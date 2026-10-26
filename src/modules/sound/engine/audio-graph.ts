import type {
  LfoConfig,
  NoiseLayer,
  PulseLoopLayer,
  Shimmer,
  SoundContinuousOptions,
  SoundHandle,
  SoundLayer,
  SoundModulationParams,
  SoundRecipe,
  SustainedNoiseLayer,
  SustainedToneLayer,
  ToneLayer,
} from './types'

const SOURCE_STOP_PADDING = 0.05
const CLEANUP_MARGIN = 0.06
const INAUDIBLE_GAIN = 0.0001
const OUTPUT_GAIN = 3.8

let sharedContext: AudioContext | null = null
let sharedOutput: GainNode | null = null
let activeVoices = 0

interface ActiveContinuousVoice {
  id: string
  cue: string
  variant?: string
  context: AudioContext
  masterGain: GainNode
  pannerNode?: StereoPannerNode
  filterNode?: BiquadFilterNode
  recipe: SoundRecipe
  nodesToDisconnect: (AudioNode | { stop?: (when?: number) => void; disconnect: () => void })[]
  intervalTimers: any[]
  ttlTimer?: any
  isStopped: boolean
  onEnded?: () => void
  handle: SoundHandle
  toneOscillators: { osc: OscillatorNode; baseFreq: number; baseDetune: number }[]
  noiseFilters: { filter: BiquadFilterNode; baseFreq: number; baseQ: number }[]
  noiseSources: { source: AudioBufferSourceNode }[]
  pulseSchedulers: { setRate: (rateMultiplier: number) => void; baseInterval: number }[]
  currentPitchMultiplier: number
  currentDetuneCents: number
  currentRateMultiplier: number
}

const activeContinuousMap = new Map<string, ActiveContinuousVoice>()

export function getAudioContext(): AudioContext | null {
  if (sharedContext) return sharedContext
  if (typeof window === 'undefined') return null

  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

  if (!Ctor) return null

  try {
    sharedContext = new Ctor()
  } catch {
    return null
  }
  return sharedContext
}

function getOutput(context: AudioContext): GainNode {
  if (sharedOutput) return sharedOutput

  const output = context.createGain()
  output.gain.value = OUTPUT_GAIN

  // Master dynamics limiter to prevent speaker clipping
  const limiter = context.createDynamicsCompressor()
  limiter.threshold.value = -6
  limiter.knee.value = 6
  limiter.ratio.value = 14
  limiter.attack.value = 0.002
  limiter.release.value = 0.07

  output.connect(limiter).connect(context.destination)
  sharedOutput = output
  return output
}

function renderTone(
  context: AudioContext,
  destination: AudioNode,
  layer: ToneLayer,
  startTime: number
): AudioNode[] {
  const oscillator = context.createOscillator()
  oscillator.type = layer.waveform
  oscillator.frequency.setValueAtTime(Math.max(20, layer.frequency), startTime)

  if (layer.detune) {
    oscillator.detune.setValueAtTime(layer.detune, startTime)
  }

  if (layer.glideTo !== undefined) {
    const glideTime = layer.glideTime ?? layer.attack + layer.decay
    try {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(20, layer.glideTo),
        startTime + Math.max(0.001, glideTime)
      )
    } catch {
      oscillator.frequency.linearRampToValueAtTime(
        Math.max(20, layer.glideTo),
        startTime + Math.max(0.001, glideTime)
      )
    }
  }

  const gain = context.createGain()
  gain.gain.setValueAtTime(INAUDIBLE_GAIN, startTime)
  gain.gain.exponentialRampToValueAtTime(
    Math.max(INAUDIBLE_GAIN, layer.peak),
    startTime + Math.max(0.001, layer.attack)
  )
  gain.gain.exponentialRampToValueAtTime(
    INAUDIBLE_GAIN,
    startTime + layer.attack + Math.max(0.001, layer.decay)
  )

  oscillator.connect(gain).connect(destination)
  oscillator.start(startTime)
  oscillator.stop(startTime + layer.attack + layer.decay + SOURCE_STOP_PADDING)

  return [oscillator, gain]
}

function renderNoise(
  context: AudioContext,
  destination: AudioNode,
  layer: NoiseLayer,
  startTime: number
): AudioNode[] {
  const duration = layer.attack + layer.decay + SOURCE_STOP_PADDING
  const length = Math.max(1, Math.floor(duration * context.sampleRate))
  const buffer = context.createBuffer(1, length, context.sampleRate)
  const data = buffer.getChannelData(0)

  // Procedural white noise synthesis
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1
  }

  const source = context.createBufferSource()
  source.buffer = buffer

  const filter = context.createBiquadFilter()
  filter.type = layer.filterType
  filter.frequency.setValueAtTime(Math.max(20, Math.min(20000, layer.filterFrequency)), startTime)
  if (layer.filterQ !== undefined) {
    filter.Q.setValueAtTime(layer.filterQ, startTime)
  }

  const gain = context.createGain()
  gain.gain.setValueAtTime(INAUDIBLE_GAIN, startTime)
  gain.gain.exponentialRampToValueAtTime(
    Math.max(INAUDIBLE_GAIN, layer.peak),
    startTime + Math.max(0.001, layer.attack)
  )
  gain.gain.exponentialRampToValueAtTime(
    INAUDIBLE_GAIN,
    startTime + layer.attack + Math.max(0.001, layer.decay)
  )

  source.connect(filter).connect(gain).connect(destination)
  source.start(startTime)
  source.stop(startTime + duration)

  return [source, filter, gain]
}

function setupLfo(
  context: AudioContext,
  targetParam: AudioParam,
  lfoConfig: LfoConfig,
  startTime: number
): AudioNode[] {
  const lfoOsc = context.createOscillator()
  lfoOsc.type = lfoConfig.waveform ?? 'sine'
  lfoOsc.frequency.setValueAtTime(Math.max(0.01, lfoConfig.rate), startTime)

  const lfoGain = context.createGain()
  lfoGain.gain.setValueAtTime(lfoConfig.depth, startTime)

  lfoOsc.connect(lfoGain)
  lfoGain.connect(targetParam)
  lfoOsc.start(startTime)

  return [lfoOsc, lfoGain]
}

function renderSustainedTone(
  context: AudioContext,
  destination: AudioNode,
  layer: SustainedToneLayer,
  startTime: number,
  collector?: { toneOscillators: { osc: OscillatorNode; baseFreq: number; baseDetune: number }[] }
): AudioNode[] {
  const oscillator = context.createOscillator()
  oscillator.type = layer.waveform
  oscillator.frequency.setValueAtTime(Math.max(20, layer.frequency), startTime)

  if (layer.detune) {
    oscillator.detune.setValueAtTime(layer.detune, startTime)
  }

  if (collector) {
    collector.toneOscillators.push({
      osc: oscillator,
      baseFreq: layer.frequency,
      baseDetune: layer.detune ?? 0,
    })
  }

  if (layer.glideTo !== undefined) {
    const glideTime = layer.glideTime ?? layer.attack * 2
    try {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(20, layer.glideTo),
        startTime + Math.max(0.001, glideTime)
      )
    } catch {
      oscillator.frequency.linearRampToValueAtTime(
        Math.max(20, layer.glideTo),
        startTime + Math.max(0.001, glideTime)
      )
    }
  }

  const gain = context.createGain()
  gain.gain.setValueAtTime(INAUDIBLE_GAIN, startTime)
  gain.gain.exponentialRampToValueAtTime(
    Math.max(INAUDIBLE_GAIN, layer.sustain),
    startTime + Math.max(0.001, layer.attack)
  )

  const nodes: AudioNode[] = [oscillator, gain]

  if (layer.lfo) {
    let targetParam: AudioParam = oscillator.frequency
    if (layer.lfo.target === 'gain') {
      targetParam = gain.gain
    }
    const lfoNodes = setupLfo(context, targetParam, layer.lfo, startTime)
    nodes.push(...lfoNodes)
  }

  oscillator.connect(gain).connect(destination)
  oscillator.start(startTime)

  return nodes
}

function renderSustainedNoise(
  context: AudioContext,
  destination: AudioNode,
  layer: SustainedNoiseLayer,
  startTime: number,
  collector?: {
    noiseSources: { source: AudioBufferSourceNode }[]
    noiseFilters: { filter: BiquadFilterNode; baseFreq: number; baseQ: number }[]
  }
): AudioNode[] {
  // 3-second looping procedural noise buffer
  const bufferDuration = 3.0
  const length = Math.floor(bufferDuration * context.sampleRate)
  const buffer = context.createBuffer(1, length, context.sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1
  }

  const source = context.createBufferSource()
  source.buffer = buffer
  source.loop = true

  const filter = context.createBiquadFilter()
  filter.type = layer.filterType
  filter.frequency.setValueAtTime(Math.max(20, Math.min(20000, layer.filterFrequency)), startTime)
  if (layer.filterQ !== undefined) {
    filter.Q.setValueAtTime(layer.filterQ, startTime)
  }

  if (collector) {
    collector.noiseSources.push({ source })
    collector.noiseFilters.push({
      filter,
      baseFreq: layer.filterFrequency,
      baseQ: layer.filterQ ?? 1.0,
    })
  }

  const gain = context.createGain()
  gain.gain.setValueAtTime(INAUDIBLE_GAIN, startTime)
  gain.gain.exponentialRampToValueAtTime(
    Math.max(INAUDIBLE_GAIN, layer.sustain),
    startTime + Math.max(0.001, layer.attack)
  )

  const nodes: AudioNode[] = [source, filter, gain]

  if (layer.lfo) {
    let targetParam: AudioParam = filter.frequency
    if (layer.lfo.target === 'gain') {
      targetParam = gain.gain
    }
    const lfoNodes = setupLfo(context, targetParam, layer.lfo, startTime)
    nodes.push(...lfoNodes)
  }

  source.connect(filter).connect(gain).connect(destination)
  source.start(startTime)

  return nodes
}

function attachShimmer(
  context: AudioContext,
  source: AudioNode,
  destination: AudioNode,
  shimmer: Shimmer
): AudioNode[] {
  const delay = context.createDelay(1.5)
  delay.delayTime.value = shimmer.delay

  const feedbackFilter = context.createBiquadFilter()
  feedbackFilter.type = 'lowpass'
  feedbackFilter.frequency.value = shimmer.lowpass

  const feedbackGain = context.createGain()
  feedbackGain.gain.value = Math.min(0.9, shimmer.feedback)

  const wetGain = context.createGain()
  wetGain.gain.value = shimmer.wet

  source.connect(delay)
  delay.connect(feedbackFilter)
  feedbackFilter.connect(feedbackGain)
  feedbackGain.connect(delay)
  feedbackFilter.connect(wetGain)
  wetGain.connect(destination)

  return [delay, feedbackFilter, feedbackGain, wetGain]
}

function calculateSourceEnd(recipe: SoundRecipe): number {
  return Math.max(
    ...recipe.layers.map((layer) => {
      if (layer.kind === 'tone' || layer.kind === 'noise') {
        return (layer.offset ?? 0) + layer.attack + layer.decay + SOURCE_STOP_PADDING
      }
      return 1.0
    })
  )
}

function calculateShimmerTail(shimmer?: Shimmer): number {
  if (!shimmer || shimmer.feedback <= 0) return 0
  if (shimmer.feedback >= 1) return shimmer.delay * 2
  return shimmer.delay * (1 + Math.ceil(Math.log(INAUDIBLE_GAIN) / Math.log(shimmer.feedback)))
}

/**
 * Procedurally synthesizes a one-shot sound recipe through the Web Audio graph.
 */
export function synthesizeRecipe(
  recipe: SoundRecipe,
  volumeMultiplier: number,
  onActiveVoiceChange?: (count: number) => void
): boolean {
  if (typeof window === 'undefined') return false
  if (volumeMultiplier <= 0) return false

  const context = getAudioContext()
  if (!context) return false

  const playFn = () => {
    if (context.state !== 'running') return
    const now = context.currentTime
    const output = getOutput(context)

    const master = context.createGain()
    master.gain.value = Math.max(0, Math.min(1, recipe.masterGain * volumeMultiplier))
    master.connect(output)

    const shimmerNodes = recipe.shimmer
      ? attachShimmer(context, master, output, recipe.shimmer)
      : []

    for (const layer of recipe.layers) {
      const startTime = now + (layer.offset ?? 0)
      if (layer.kind === 'tone') {
        renderTone(context, master, layer, startTime)
      } else if (layer.kind === 'noise') {
        renderNoise(context, master, layer, startTime)
      } else if (layer.kind === 'sustained-tone') {
        renderSustainedTone(context, master, layer, startTime)
      } else if (layer.kind === 'sustained-noise') {
        renderSustainedNoise(context, master, layer, startTime)
      }
    }

    activeVoices++
    onActiveVoiceChange?.(activeVoices)

    const cleanupDurationMs =
      (calculateSourceEnd(recipe) + calculateShimmerTail(recipe.shimmer) + CLEANUP_MARGIN) * 1000

    setTimeout(() => {
      try {
        master.disconnect()
        for (const node of shimmerNodes) {
          node.disconnect()
        }
      } catch {}
      activeVoices = Math.max(0, activeVoices - 1)
      onActiveVoiceChange?.(activeVoices)
    }, cleanupDurationMs)
  }

  if (context.state === 'running') {
    playFn()
    return true
  } else {
    try {
      void context.resume().then(
        () => {
          if (context.state === 'running') {
            playFn()
          }
        },
        () => {}
      )
      return true
    } catch {
      return false
    }
  }
}

/**
 * Procedurally synthesizes a continuous / looping sound recipe that plays infinitely
 * until explicitly stopped or until TTL timeout expires, with real-time dynamic modulation.
 */
export function synthesizeContinuous(
  cue: string,
  recipe: SoundRecipe,
  volumeMultiplier: number,
  options: SoundContinuousOptions = {},
  onActiveVoiceChange?: (count: number) => void
): SoundHandle | null {
  if (typeof window === 'undefined') return null

  const context = getAudioContext()
  if (!context) return null

  const voiceId = `voice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const targetGain = Math.max(0, Math.min(1, recipe.masterGain * volumeMultiplier))

  const voiceRecord: ActiveContinuousVoice = {
    id: voiceId,
    cue,
    variant: options.variant,
    context,
    masterGain: null as any,
    recipe,
    nodesToDisconnect: [],
    intervalTimers: [],
    isStopped: false,
    onEnded: options.onEnded,
    handle: null as any,
    toneOscillators: [],
    noiseFilters: [],
    noiseSources: [],
    pulseSchedulers: [],
    currentPitchMultiplier: 1.0,
    currentDetuneCents: 0,
    currentRateMultiplier: 1.0,
  }

  const stopVoice = (releaseDuration?: number) => {
    if (voiceRecord.isStopped) return
    voiceRecord.isStopped = true

    if (voiceRecord.ttlTimer) {
      clearTimeout(voiceRecord.ttlTimer)
      voiceRecord.ttlTimer = undefined
    }

    for (const timer of voiceRecord.intervalTimers) {
      clearInterval(timer)
      clearTimeout(timer)
    }
    voiceRecord.intervalTimers = []

    const effectiveRelease = Math.max(
      0.02,
      releaseDuration ??
        options.release ??
        recipe.defaultRelease ??
        Math.max(
          ...recipe.layers.map((l) =>
            'release' in l && typeof (l as any).release === 'number'
              ? (l as any).release
              : 0.3
          ),
          0.3
        )
    )

    try {
      const now = context.currentTime
      if (voiceRecord.masterGain) {
        voiceRecord.masterGain.gain.cancelScheduledValues(now)
        voiceRecord.masterGain.gain.setValueAtTime(
          Math.max(INAUDIBLE_GAIN, voiceRecord.masterGain.gain.value),
          now
        )
        voiceRecord.masterGain.gain.exponentialRampToValueAtTime(INAUDIBLE_GAIN, now + effectiveRelease)
      }
    } catch {
      try {
        const now = context.currentTime
        if (voiceRecord.masterGain) {
          voiceRecord.masterGain.gain.linearRampToValueAtTime(0, now + effectiveRelease)
        }
      } catch {}
    }

    setTimeout(() => {
      for (const node of voiceRecord.nodesToDisconnect) {
        try {
          if ('stop' in node && typeof (node as any).stop === 'function') {
            ;(node as any).stop()
          }
          node.disconnect()
        } catch {}
      }

      try {
        voiceRecord.masterGain?.disconnect()
        voiceRecord.pannerNode?.disconnect()
        voiceRecord.filterNode?.disconnect()
      } catch {}

      activeContinuousMap.delete(voiceId)
      activeVoices = Math.max(0, activeVoices - 1)
      onActiveVoiceChange?.(activeVoices)

      try {
        voiceRecord.onEnded?.()
      } catch {}
    }, effectiveRelease * 1000 + 40)
  }

  const setVolume = (volume: number, rampDuration = 0.04) => {
    if (voiceRecord.isStopped || !voiceRecord.masterGain) return
    const newVol = Math.max(0, Math.min(1, recipe.masterGain * volumeMultiplier * volume))
    try {
      const now = context.currentTime
      const safeRamp = Math.max(0.005, rampDuration)
      voiceRecord.masterGain.gain.cancelScheduledValues(now)
      voiceRecord.masterGain.gain.setValueAtTime(voiceRecord.masterGain.gain.value, now)
      voiceRecord.masterGain.gain.linearRampToValueAtTime(newVol, now + safeRamp)
    } catch {}
  }

  const setPitch = (multiplier: number, rampDuration = 0.04) => {
    if (voiceRecord.isStopped) return
    const clampedMult = Math.max(0.05, Math.min(20, multiplier))
    voiceRecord.currentPitchMultiplier = clampedMult
    const now = context.currentTime
    const safeRamp = Math.max(0.005, rampDuration)

    for (const item of voiceRecord.toneOscillators) {
      try {
        const targetFreq = Math.max(20, Math.min(20000, item.baseFreq * clampedMult))
        item.osc.frequency.setTargetAtTime(targetFreq, now, safeRamp)
      } catch {}
    }

    for (const item of voiceRecord.noiseSources) {
      try {
        item.source.playbackRate.setTargetAtTime(clampedMult, now, safeRamp)
      } catch {}
    }
  }

  const setDetune = (cents: number, rampDuration = 0.04) => {
    if (voiceRecord.isStopped) return
    voiceRecord.currentDetuneCents = cents
    const now = context.currentTime
    const safeRamp = Math.max(0.005, rampDuration)

    for (const item of voiceRecord.toneOscillators) {
      try {
        item.osc.detune.setTargetAtTime(item.baseDetune + cents, now, safeRamp)
      } catch {}
    }
  }

  const setCutoff = (frequencyHz: number, rampDuration = 0.04) => {
    if (voiceRecord.isStopped) return
    const clampedHz = Math.max(20, Math.min(20000, frequencyHz))
    const now = context.currentTime
    const safeRamp = Math.max(0.005, rampDuration)

    if (voiceRecord.filterNode) {
      try {
        voiceRecord.filterNode.frequency.setTargetAtTime(clampedHz, now, safeRamp)
      } catch {}
    }

    for (const item of voiceRecord.noiseFilters) {
      try {
        item.filter.frequency.setTargetAtTime(clampedHz, now, safeRamp)
      } catch {}
    }
  }

  const setPan = (pan: number, rampDuration = 0.04) => {
    if (voiceRecord.isStopped || !voiceRecord.pannerNode) return
    const clampedPan = Math.max(-1, Math.min(1, pan))
    const now = context.currentTime
    const safeRamp = Math.max(0.005, rampDuration)
    try {
      voiceRecord.pannerNode.pan.setTargetAtTime(clampedPan, now, safeRamp)
    } catch {}
  }

  const setRate = (rateMultiplier: number) => {
    if (voiceRecord.isStopped) return
    const clampedRate = Math.max(0.05, Math.min(30, rateMultiplier))
    voiceRecord.currentRateMultiplier = clampedRate
    for (const scheduler of voiceRecord.pulseSchedulers) {
      try {
        scheduler.setRate(clampedRate)
      } catch {}
    }
  }

  const setModulation = (params: SoundModulationParams, rampDuration = 0.04) => {
    if (params.volume !== undefined) setVolume(params.volume, rampDuration)
    if (params.pitch !== undefined) setPitch(params.pitch, rampDuration)
    if (params.detune !== undefined) setDetune(params.detune, rampDuration)
    if (params.cutoff !== undefined) setCutoff(params.cutoff, rampDuration)
    if (params.pan !== undefined) setPan(params.pan, rampDuration)
    if (params.rate !== undefined) setRate(params.rate)
  }

  const handle: SoundHandle = {
    get id() {
      return voiceId
    },
    get cue() {
      return cue
    },
    get variant() {
      return options.variant
    },
    get isPlaying() {
      return !voiceRecord.isStopped
    },
    stop: stopVoice,
    setVolume,
    setPitch,
    setDetune,
    setCutoff,
    setPan,
    setRate,
    setModulation,
  }

  voiceRecord.handle = handle

  const playFn = () => {
    if (context.state !== 'running') return
    const now = context.currentTime
    const output = getOutput(context)

    const master = context.createGain()
    master.gain.setValueAtTime(INAUDIBLE_GAIN, now)
    master.gain.exponentialRampToValueAtTime(Math.max(INAUDIBLE_GAIN, targetGain), now + 0.04)

    // Stereo Panning
    let chainDestination: AudioNode = output
    if (typeof context.createStereoPanner === 'function') {
      const panner = context.createStereoPanner()
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, options.pan ?? 0)), now)
      panner.connect(output)
      voiceRecord.pannerNode = panner
      chainDestination = panner
    }

    master.connect(chainDestination)
    voiceRecord.masterGain = master

    const shimmerNodes = recipe.shimmer
      ? attachShimmer(context, master, chainDestination, recipe.shimmer)
      : []
    voiceRecord.nodesToDisconnect.push(...shimmerNodes)

    for (const layer of recipe.layers) {
      const startTime = now + (layer.offset ?? 0)

      if (layer.kind === 'sustained-tone') {
        const nodes = renderSustainedTone(context, master, layer, startTime, voiceRecord)
        voiceRecord.nodesToDisconnect.push(...nodes)
      } else if (layer.kind === 'sustained-noise') {
        const nodes = renderSustainedNoise(context, master, layer, startTime, voiceRecord)
        voiceRecord.nodesToDisconnect.push(...nodes)
      } else if (layer.kind === 'pulse-loop') {
        const pulseLayer = layer as PulseLoopLayer
        let currentIntervalMs = Math.max(20, pulseLayer.interval * 1000)

        const runPulse = () => {
          if (voiceRecord.isStopped) return
          const pulseNow = context.currentTime
          const pulseList = Array.isArray(pulseLayer.pulse)
            ? pulseLayer.pulse
            : [pulseLayer.pulse]

          for (const p of pulseList) {
            if (p.kind === 'tone') {
              renderTone(context, master, p, pulseNow)
            } else if (p.kind === 'noise') {
              renderNoise(context, master, p, pulseNow)
            }
          }
        }

        // Trigger initial pulse immediately
        runPulse()

        let pulseIntervalId: any = null
        const schedulePulseLoop = () => {
          if (pulseIntervalId) clearInterval(pulseIntervalId)
          if (voiceRecord.isStopped) return
          pulseIntervalId = setInterval(() => {
            if (voiceRecord.isStopped) {
              clearInterval(pulseIntervalId)
              return
            }
            if (pulseLayer.jitter && pulseLayer.jitter > 0) {
              const jitterMs = (Math.random() * 2 - 1) * pulseLayer.jitter * currentIntervalMs
              setTimeout(runPulse, Math.max(0, jitterMs))
            } else {
              runPulse()
            }
          }, currentIntervalMs)
          voiceRecord.intervalTimers.push(pulseIntervalId)
        }

        const pulseScheduler = {
          baseInterval: pulseLayer.interval,
          setRate: (multiplier: number) => {
            currentIntervalMs = Math.max(15, (pulseLayer.interval / Math.max(0.1, multiplier)) * 1000)
            schedulePulseLoop()
          },
        }

        voiceRecord.pulseSchedulers.push(pulseScheduler)
        schedulePulseLoop()
      } else if (layer.kind === 'tone') {
        const nodes = renderTone(context, master, layer, startTime)
        voiceRecord.nodesToDisconnect.push(...nodes)
      } else if (layer.kind === 'noise') {
        const nodes = renderNoise(context, master, layer, startTime)
        voiceRecord.nodesToDisconnect.push(...nodes)
      }
    }

    activeVoices++
    onActiveVoiceChange?.(activeVoices)
    activeContinuousMap.set(voiceId, voiceRecord)

    // Handle TTL (Time to Live) auto-expiration
    const effectiveTtl = options.ttl ?? recipe.defaultTtlMs
    if (effectiveTtl && effectiveTtl > 0) {
      voiceRecord.ttlTimer = setTimeout(() => {
        stopVoice(options.release)
      }, effectiveTtl)
    }
  }

  if (context.state === 'running') {
    playFn()
  } else {
    try {
      void context.resume().then(
        () => {
          if (context.state === 'running' && !voiceRecord.isStopped) {
            playFn()
          }
        },
        () => {}
      )
    } catch {}
  }

  return handle
}

/**
 * Stops all currently playing continuous audio voices with a smooth release.
 */
export function stopAllContinuousVoices(releaseDuration?: number): void {
  for (const voice of activeContinuousMap.values()) {
    voice.handle.stop(releaseDuration)
  }
}

/**
 * Stops a specific continuous sound cue by name or all instances of that cue.
 */
export function stopContinuousByCue(cue: string, releaseDuration?: number): void {
  for (const voice of activeContinuousMap.values()) {
    if (voice.cue === cue) {
      voice.handle.stop(releaseDuration)
    }
  }
}

/**
 * Returns array of currently active continuous voice cues.
 */
export function getActiveContinuousCues(): string[] {
  return Array.from(activeContinuousMap.values())
    .filter((v) => !v.isStopped)
    .map((v) => (v.variant ? `${v.cue}:${v.variant}` : v.cue))
}

/**
 * Returns current active voice count.
 */
export function getActiveVoicesCount(): number {
  return activeVoices
}

/**
 * Ensures sound audio context is resumed on user gesture.
 */
export function resumeSoundContext(): Promise<void> {
  const ctx = getAudioContext()
  if (ctx && ctx.state === 'suspended') {
    return ctx.resume()
  }
  return Promise.resolve()
}

