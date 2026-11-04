import type {
  LfoConfig,
  NoiseLayer,
  PulseLoopLayer,
  Shimmer,
  SoundContinuousOptions,
  SoundHandle,
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
const SHARED_NOISE_BUFFER_SECONDS = 3.0

/** Shared AudioContext + output across graphs (browsers limit concurrent contexts). */
let sharedContext: AudioContext | null = null
let sharedOutput: GainNode | null = null
let sharedContextRefCount = 0
const noiseBufferCache = new Map<number, AudioBuffer>()

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

function acquireSharedContext(): AudioContext | null {
  const ctx = getAudioContext()
  if (!ctx) return null
  sharedContextRefCount++
  return ctx
}

function releaseSharedContext(): void {
  sharedContextRefCount = Math.max(0, sharedContextRefCount - 1)
  if (sharedContextRefCount === 0 && sharedContext) {
    try {
      void sharedContext.close()
    } catch {
      /* ignore */
    }
    sharedContext = null
    sharedOutput = null
    noiseBufferCache.clear()
  }
}

function getOutput(context: AudioContext): GainNode {
  if (sharedOutput) return sharedOutput

  const output = context.createGain()
  output.gain.value = OUTPUT_GAIN

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

function getSharedNoiseBuffer(context: AudioContext): AudioBuffer {
  const cached = noiseBufferCache.get(context.sampleRate)
  if (cached) return cached

  const length = Math.floor(SHARED_NOISE_BUFFER_SECONDS * context.sampleRate)
  const buffer = context.createBuffer(1, length, context.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1
  }
  noiseBufferCache.set(context.sampleRate, buffer)
  return buffer
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
): { nodes: AudioNode[]; osc: OscillatorNode; depthGain: GainNode } {
  const lfoOsc = context.createOscillator()
  lfoOsc.type = lfoConfig.waveform ?? 'sine'
  lfoOsc.frequency.setValueAtTime(Math.max(0.01, lfoConfig.rate), startTime)

  const lfoGain = context.createGain()
  lfoGain.gain.setValueAtTime(lfoConfig.depth, startTime)

  lfoOsc.connect(lfoGain)
  lfoGain.connect(targetParam)
  lfoOsc.start(startTime)

  return { nodes: [lfoOsc, lfoGain], osc: lfoOsc, depthGain: lfoGain }
}

function renderSustainedTone(
  context: AudioContext,
  destination: AudioNode,
  layer: SustainedToneLayer,
  startTime: number,
  collector?: {
    toneOscillators: { osc: OscillatorNode; baseFreq: number; baseDetune: number }[]
    lfoControls: { osc: OscillatorNode; depthGain: GainNode; baseRate: number; baseDepth: number }[]
  }
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
    const lfo = setupLfo(context, targetParam, layer.lfo, startTime)
    nodes.push(...lfo.nodes)
    collector?.lfoControls.push({
      osc: lfo.osc,
      depthGain: lfo.depthGain,
      baseRate: layer.lfo.rate,
      baseDepth: layer.lfo.depth,
    })
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
    lfoControls: { osc: OscillatorNode; depthGain: GainNode; baseRate: number; baseDepth: number }[]
  }
): AudioNode[] {
  const source = context.createBufferSource()
  source.buffer = getSharedNoiseBuffer(context)
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
    const lfo = setupLfo(context, targetParam, layer.lfo, startTime)
    nodes.push(...lfo.nodes)
    collector?.lfoControls.push({
      osc: lfo.osc,
      depthGain: lfo.depthGain,
      baseRate: layer.lfo.rate,
      baseDepth: layer.lfo.depth,
    })
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
      if (layer.kind === 'sustained-tone' || layer.kind === 'sustained-noise') {
        const release = 'release' in layer && typeof layer.release === 'number' ? layer.release : 0.2
        return (layer.offset ?? 0) + layer.attack + 0.15 + release + SOURCE_STOP_PADDING
      }
      return 1.0
    }),
    0.05
  )
}

function calculateShimmerTail(shimmer?: Shimmer): number {
  if (!shimmer || shimmer.feedback <= 0) return 0
  if (shimmer.feedback >= 1) return shimmer.delay * 2
  return shimmer.delay * (1 + Math.ceil(Math.log(INAUDIBLE_GAIN) / Math.log(shimmer.feedback)))
}

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
  intervalTimers: ReturnType<typeof setInterval>[]
  timeoutTimers: ReturnType<typeof setTimeout>[]
  ttlTimer?: ReturnType<typeof setTimeout>
  isStopped: boolean
  hasStarted: boolean
  onEnded?: () => void
  handle: SoundHandle
  toneOscillators: { osc: OscillatorNode; baseFreq: number; baseDetune: number }[]
  noiseFilters: { filter: BiquadFilterNode; baseFreq: number; baseQ: number }[]
  noiseSources: { source: AudioBufferSourceNode }[]
  pulseSchedulers: { setRate: (rateMultiplier: number) => void; baseInterval: number }[]
  lfoControls: { osc: OscillatorNode; depthGain: GainNode; baseRate: number; baseDepth: number }[]
  currentPitchMultiplier: number
  currentDetuneCents: number
  currentRateMultiplier: number
  /** Engine master volume (0–1). */
  masterVolume: number
  /** Per-play options.volume (0–1). */
  instanceVolume: number
  /** handle.setVolume relative multiplier (0–1). */
  userVolume: number
}

export interface SoundAudioGraphOptions {
  getMasterVolume?: () => number
}

/**
 * Per-engine Web Audio synthesis session. Continuous voice maps and voice counts are
 * isolated per graph; the AudioContext/output chain is shared and reference-counted.
 */
export class SoundAudioGraph {
  private activeVoices = 0
  private activeContinuousMap = new Map<string, ActiveContinuousVoice>()
  private acquired = false
  private destroyed = false
  private getMasterVolume: () => number

  constructor(options: SoundAudioGraphOptions = {}) {
    this.getMasterVolume = options.getMasterVolume ?? (() => 1)
  }

  private ensureContext(): AudioContext | null {
    if (this.destroyed) return null
    const ctx = this.acquired ? getAudioContext() : acquireSharedContext()
    if (ctx && !this.acquired) this.acquired = true
    return ctx
  }

  private bumpVoices(delta: number, onActiveVoiceChange?: (count: number) => void): void {
    this.activeVoices = Math.max(0, this.activeVoices + delta)
    onActiveVoiceChange?.(this.activeVoices)
  }

  getActiveVoicesCount(): number {
    return this.activeVoices
  }

  getActiveContinuousCues(): string[] {
    return Array.from(this.activeContinuousMap.values())
      .filter((v) => !v.isStopped && v.hasStarted)
      .map((v) => (v.variant ? `${v.cue}:${v.variant}` : v.cue))
  }

  /**
   * Procedurally synthesizes a one-shot sound recipe.
   * Returns true only when audio is scheduled on a running context.
   * If the context is suspended, resumes and invokes `onPlayed` after scheduling.
   */
  synthesizeRecipe(
    recipe: SoundRecipe,
    instanceVolume: number,
    onActiveVoiceChange?: (count: number) => void,
    onPlayed?: () => void,
    pan?: number
  ): boolean {
    if (typeof window === 'undefined') return false
    const masterVolume = this.getMasterVolume()
    const volumeMultiplier = masterVolume * instanceVolume
    if (volumeMultiplier <= 0) return false

    const context = this.ensureContext()
    if (!context) return false

    const playFn = () => {
      if (context.state !== 'running' || this.destroyed) return
      const now = context.currentTime
      const output = getOutput(context)

      let destination: AudioNode = output
      const panNodes: AudioNode[] = []
      if (typeof pan === 'number' && typeof context.createStereoPanner === 'function') {
        const panner = context.createStereoPanner()
        panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), now)
        panner.connect(output)
        panNodes.push(panner)
        destination = panner
      }

      const master = context.createGain()
      master.gain.value = Math.max(0, Math.min(1, recipe.masterGain * volumeMultiplier))
      master.connect(destination)

      const shimmerNodes = recipe.shimmer
        ? attachShimmer(context, master, destination, recipe.shimmer)
        : []

      const oneShotSources: Array<OscillatorNode | AudioBufferSourceNode> = []

      for (const layer of recipe.layers) {
        const startTime = now + (layer.offset ?? 0)
        if (layer.kind === 'tone') {
          renderTone(context, master, layer, startTime)
        } else if (layer.kind === 'noise') {
          renderNoise(context, master, layer, startTime)
        } else if (layer.kind === 'sustained-tone') {
          const nodes = renderSustainedTone(context, master, layer, startTime)
          for (const node of nodes) {
            if (node instanceof OscillatorNode) oneShotSources.push(node)
          }
          // Envelope a short hold then release for one-shot use of sustained layers
          const release = layer.release ?? 0.2
          const hold = 0.12
          try {
            const g = nodes.find((n) => n instanceof GainNode) as GainNode | undefined
            if (g) {
              const releaseAt = startTime + layer.attack + hold
              g.gain.setValueAtTime(Math.max(INAUDIBLE_GAIN, layer.sustain), releaseAt)
              g.gain.exponentialRampToValueAtTime(INAUDIBLE_GAIN, releaseAt + Math.max(0.01, release))
            }
            const osc = nodes.find((n) => n instanceof OscillatorNode) as OscillatorNode | undefined
            osc?.stop(startTime + layer.attack + hold + release + SOURCE_STOP_PADDING)
          } catch {
            /* ignore */
          }
        } else if (layer.kind === 'sustained-noise') {
          const nodes = renderSustainedNoise(context, master, layer, startTime)
          for (const node of nodes) {
            if (node instanceof AudioBufferSourceNode) oneShotSources.push(node)
          }
          const release = layer.release ?? 0.2
          const hold = 0.12
          try {
            const g = nodes.find((n) => n instanceof GainNode) as GainNode | undefined
            if (g) {
              const releaseAt = startTime + layer.attack + hold
              g.gain.setValueAtTime(Math.max(INAUDIBLE_GAIN, layer.sustain), releaseAt)
              g.gain.exponentialRampToValueAtTime(INAUDIBLE_GAIN, releaseAt + Math.max(0.01, release))
            }
            const src = nodes.find((n) => n instanceof AudioBufferSourceNode) as
              | AudioBufferSourceNode
              | undefined
            src?.stop(startTime + layer.attack + hold + release + SOURCE_STOP_PADDING)
          } catch {
            /* ignore */
          }
        }
      }

      this.bumpVoices(1, onActiveVoiceChange)
      onPlayed?.()

      const cleanupDurationMs =
        (calculateSourceEnd(recipe) + calculateShimmerTail(recipe.shimmer) + CLEANUP_MARGIN) * 1000

      setTimeout(() => {
        try {
          for (const src of oneShotSources) {
            try {
              src.stop()
            } catch {
              /* already stopped */
            }
            try {
              src.disconnect()
            } catch {
              /* ignore */
            }
          }
          master.disconnect()
          for (const node of shimmerNodes) {
            node.disconnect()
          }
          for (const node of panNodes) {
            node.disconnect()
          }
        } catch {
          /* ignore */
        }
        this.bumpVoices(-1, onActiveVoiceChange)
      }, cleanupDurationMs)
    }

    if (context.state === 'running') {
      playFn()
      return true
    }

    try {
      void context.resume().then(
        () => {
          if (context.state === 'running') playFn()
        },
        () => {}
      )
    } catch {
      return false
    }
    return false
  }

  synthesizeContinuous(
    cue: string,
    recipe: SoundRecipe,
    instanceVolume: number,
    options: SoundContinuousOptions = {},
    onActiveVoiceChange?: (count: number) => void
  ): SoundHandle | null {
    if (typeof window === 'undefined') return null

    const context = this.ensureContext()
    if (!context) return null

    const voiceId = `voice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const masterVolume = this.getMasterVolume()

    const voiceRecord: ActiveContinuousVoice = {
      id: voiceId,
      cue,
      variant: options.variant,
      context,
      masterGain: null as unknown as GainNode,
      recipe,
      nodesToDisconnect: [],
      intervalTimers: [],
      timeoutTimers: [],
      isStopped: false,
      hasStarted: false,
      onEnded: options.onEnded,
      handle: null as unknown as SoundHandle,
      toneOscillators: [],
      noiseFilters: [],
      noiseSources: [],
      pulseSchedulers: [],
      lfoControls: [],
      currentPitchMultiplier: 1.0,
      currentDetuneCents: 0,
      currentRateMultiplier: 1.0,
      masterVolume,
      instanceVolume: Math.max(0, Math.min(1, instanceVolume)),
      userVolume: 1,
    }

    const applyGain = (rampDuration = 0.04) => {
      if (voiceRecord.isStopped || !voiceRecord.masterGain) return
      const newVol = Math.max(
        0,
        Math.min(
          1,
          recipe.masterGain *
            voiceRecord.masterVolume *
            voiceRecord.instanceVolume *
            voiceRecord.userVolume
        )
      )
      try {
        const now = context.currentTime
        const safeRamp = Math.max(0.005, rampDuration)
        voiceRecord.masterGain.gain.cancelScheduledValues(now)
        voiceRecord.masterGain.gain.setValueAtTime(
          Math.max(INAUDIBLE_GAIN, voiceRecord.masterGain.gain.value),
          now
        )
        voiceRecord.masterGain.gain.linearRampToValueAtTime(Math.max(INAUDIBLE_GAIN, newVol), now + safeRamp)
      } catch {
        /* ignore */
      }
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
      }
      for (const timer of voiceRecord.timeoutTimers) {
        clearTimeout(timer)
      }
      voiceRecord.intervalTimers = []
      voiceRecord.timeoutTimers = []

      const effectiveRelease = Math.max(
        0.02,
        releaseDuration ??
          options.release ??
          recipe.defaultRelease ??
          Math.max(
            ...recipe.layers.map((l) =>
              'release' in l && typeof (l as { release?: number }).release === 'number'
                ? ((l as { release?: number }).release as number)
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
          voiceRecord.masterGain.gain.exponentialRampToValueAtTime(
            INAUDIBLE_GAIN,
            now + effectiveRelease
          )
        }
      } catch {
        try {
          const now = context.currentTime
          if (voiceRecord.masterGain) {
            voiceRecord.masterGain.gain.linearRampToValueAtTime(0, now + effectiveRelease)
          }
        } catch {
          /* ignore */
        }
      }

      setTimeout(() => {
        for (const node of voiceRecord.nodesToDisconnect) {
          try {
            if ('stop' in node && typeof (node as { stop?: () => void }).stop === 'function') {
              ;(node as { stop: () => void }).stop()
            }
            node.disconnect()
          } catch {
            /* ignore */
          }
        }

        try {
          voiceRecord.masterGain?.disconnect()
          voiceRecord.pannerNode?.disconnect()
          voiceRecord.filterNode?.disconnect()
        } catch {
          /* ignore */
        }

        this.activeContinuousMap.delete(voiceId)
        if (voiceRecord.hasStarted) {
          this.bumpVoices(-1, onActiveVoiceChange)
        }

        try {
          voiceRecord.onEnded?.()
        } catch {
          /* ignore */
        }
      }, effectiveRelease * 1000 + 40)
    }

    const setVolume = (volume: number, rampDuration = 0.04) => {
      voiceRecord.userVolume = Math.max(0, Math.min(1, volume))
      applyGain(rampDuration)
    }

    const setMasterVolume = (volume: number, rampDuration = 0.04) => {
      voiceRecord.masterVolume = Math.max(0, Math.min(1, volume))
      applyGain(rampDuration)
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
        } catch {
          /* ignore */
        }
      }

      for (const item of voiceRecord.noiseSources) {
        try {
          item.source.playbackRate.setTargetAtTime(clampedMult, now, safeRamp)
        } catch {
          /* ignore */
        }
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
        } catch {
          /* ignore */
        }
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
        } catch {
          /* ignore */
        }
      }

      for (const item of voiceRecord.noiseFilters) {
        try {
          item.filter.frequency.setTargetAtTime(clampedHz, now, safeRamp)
        } catch {
          /* ignore */
        }
      }
    }

    const setFilterQ = (q: number, rampDuration = 0.04) => {
      if (voiceRecord.isStopped) return
      const clampedQ = Math.max(0.0001, Math.min(1000, q))
      const now = context.currentTime
      const safeRamp = Math.max(0.005, rampDuration)

      if (voiceRecord.filterNode) {
        try {
          voiceRecord.filterNode.Q.setTargetAtTime(clampedQ, now, safeRamp)
        } catch {
          /* ignore */
        }
      }

      for (const item of voiceRecord.noiseFilters) {
        try {
          item.filter.Q.setTargetAtTime(clampedQ, now, safeRamp)
        } catch {
          /* ignore */
        }
      }
    }

    const setPan = (pan: number, rampDuration = 0.04) => {
      if (voiceRecord.isStopped || !voiceRecord.pannerNode) return
      const clampedPan = Math.max(-1, Math.min(1, pan))
      const now = context.currentTime
      const safeRamp = Math.max(0.005, rampDuration)
      try {
        voiceRecord.pannerNode.pan.setTargetAtTime(clampedPan, now, safeRamp)
      } catch {
        /* ignore */
      }
    }

    const setRate = (rateMultiplier: number) => {
      if (voiceRecord.isStopped) return
      const clampedRate = Math.max(0.05, Math.min(30, rateMultiplier))
      voiceRecord.currentRateMultiplier = clampedRate
      for (const scheduler of voiceRecord.pulseSchedulers) {
        try {
          scheduler.setRate(clampedRate)
        } catch {
          /* ignore */
        }
      }
    }

    const setLfo = (rate?: number, depth?: number, rampDuration = 0.04) => {
      if (voiceRecord.isStopped) return
      const now = context.currentTime
      const safeRamp = Math.max(0.005, rampDuration)
      for (const lfo of voiceRecord.lfoControls) {
        try {
          if (rate !== undefined) {
            lfo.osc.frequency.setTargetAtTime(Math.max(0.01, rate), now, safeRamp)
          }
          if (depth !== undefined) {
            lfo.depthGain.gain.setTargetAtTime(Math.max(0, depth), now, safeRamp)
          }
        } catch {
          /* ignore */
        }
      }
    }

    const setModulation = (params: SoundModulationParams, rampDuration = 0.04) => {
      if (params.volume !== undefined) setVolume(params.volume, rampDuration)
      if (params.pitch !== undefined) setPitch(params.pitch, rampDuration)
      if (params.detune !== undefined) setDetune(params.detune, rampDuration)
      if (params.cutoff !== undefined) setCutoff(params.cutoff, rampDuration)
      if (params.filterQ !== undefined) setFilterQ(params.filterQ, rampDuration)
      if (params.pan !== undefined) setPan(params.pan, rampDuration)
      if (params.rate !== undefined) setRate(params.rate)
      if (params.lfoRate !== undefined || params.lfoDepth !== undefined) {
        setLfo(params.lfoRate, params.lfoDepth, rampDuration)
      }
    }

    const handle: SoundHandle & { setMasterVolume: (v: number, r?: number) => void } = {
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
        return !voiceRecord.isStopped && voiceRecord.hasStarted
      },
      stop: stopVoice,
      setVolume,
      setPitch,
      setDetune,
      setCutoff,
      setPan,
      setRate,
      setModulation,
      setMasterVolume,
    }

    voiceRecord.handle = handle

    const playFn = () => {
      if (context.state !== 'running' || voiceRecord.isStopped || this.destroyed) return
      const now = context.currentTime
      const output = getOutput(context)

      const master = context.createGain()
      const targetGain = Math.max(
        0,
        Math.min(
          1,
          recipe.masterGain *
            voiceRecord.masterVolume *
            voiceRecord.instanceVolume *
            voiceRecord.userVolume
        )
      )
      master.gain.setValueAtTime(INAUDIBLE_GAIN, now)
      master.gain.exponentialRampToValueAtTime(Math.max(INAUDIBLE_GAIN, targetGain), now + 0.04)

      let chainDestination: AudioNode = output

      // Master filter so setCutoff always has a target
      const filterNode = context.createBiquadFilter()
      filterNode.type = 'lowpass'
      filterNode.frequency.setValueAtTime(18000, now)
      filterNode.Q.setValueAtTime(0.7, now)
      filterNode.connect(output)
      voiceRecord.filterNode = filterNode
      voiceRecord.nodesToDisconnect.push(filterNode)
      chainDestination = filterNode

      if (typeof context.createStereoPanner === 'function') {
        const panner = context.createStereoPanner()
        panner.pan.setValueAtTime(Math.max(-1, Math.min(1, options.pan ?? 0)), now)
        panner.connect(chainDestination)
        voiceRecord.pannerNode = panner
        voiceRecord.nodesToDisconnect.push(panner)
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

          runPulse()

          let pulseIntervalId: ReturnType<typeof setInterval> | null = null
          const schedulePulseLoop = () => {
            if (pulseIntervalId) {
              clearInterval(pulseIntervalId)
              voiceRecord.intervalTimers = voiceRecord.intervalTimers.filter((t) => t !== pulseIntervalId)
            }
            if (voiceRecord.isStopped) return
            pulseIntervalId = setInterval(() => {
              if (voiceRecord.isStopped) {
                if (pulseIntervalId) clearInterval(pulseIntervalId)
                return
              }
              if (pulseLayer.jitter && pulseLayer.jitter > 0) {
                const jitterMs = (Math.random() * 2 - 1) * pulseLayer.jitter * currentIntervalMs
                const t = setTimeout(runPulse, Math.max(0, jitterMs))
                voiceRecord.timeoutTimers.push(t)
              } else {
                runPulse()
              }
            }, currentIntervalMs)
            voiceRecord.intervalTimers.push(pulseIntervalId)
          }

          const pulseScheduler = {
            baseInterval: pulseLayer.interval,
            setRate: (multiplier: number) => {
              currentIntervalMs = Math.max(
                15,
                (pulseLayer.interval / Math.max(0.1, multiplier)) * 1000
              )
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

      voiceRecord.hasStarted = true
      this.bumpVoices(1, onActiveVoiceChange)
      this.activeContinuousMap.set(voiceId, voiceRecord)

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
      } catch {
        /* ignore */
      }
    }

    return handle
  }

  stopAllContinuousVoices(releaseDuration?: number): void {
    for (const voice of Array.from(this.activeContinuousMap.values())) {
      voice.handle.stop(releaseDuration)
    }
  }

  stopContinuousByCue(cue: string, releaseDuration?: number): void {
    for (const voice of Array.from(this.activeContinuousMap.values())) {
      if (voice.cue === cue) {
        voice.handle.stop(releaseDuration)
      }
    }
  }

  updateMasterVolume(volume: number, rampDuration = 0.04): void {
    for (const voice of this.activeContinuousMap.values()) {
      const handle = voice.handle as SoundHandle & {
        setMasterVolume?: (v: number, r?: number) => void
      }
      handle.setMasterVolume?.(volume, rampDuration)
    }
  }

  resume(): Promise<void> {
    const ctx = this.ensureContext()
    if (ctx && ctx.state === 'suspended') {
      return ctx.resume()
    }
    return Promise.resolve()
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.stopAllContinuousVoices(0.02)
    if (this.acquired) {
      releaseSharedContext()
      this.acquired = false
    }
  }
}

export function createSoundAudioGraph(options?: SoundAudioGraphOptions): SoundAudioGraph {
  return new SoundAudioGraph(options)
}

/** @deprecated Prefer SoundEngine-owned graphs. Module helpers use a shared fallback graph. */
let fallbackGraph: SoundAudioGraph | null = null

function getFallbackGraph(): SoundAudioGraph {
  if (!fallbackGraph) fallbackGraph = createSoundAudioGraph()
  return fallbackGraph
}

export function synthesizeRecipe(
  recipe: SoundRecipe,
  volumeMultiplier: number,
  onActiveVoiceChange?: (count: number) => void,
  onPlayed?: () => void,
  pan?: number
): boolean {
  return getFallbackGraph().synthesizeRecipe(
    recipe,
    volumeMultiplier,
    onActiveVoiceChange,
    onPlayed,
    pan
  )
}

export function synthesizeContinuous(
  cue: string,
  recipe: SoundRecipe,
  volumeMultiplier: number,
  options: SoundContinuousOptions = {},
  onActiveVoiceChange?: (count: number) => void
): SoundHandle | null {
  return getFallbackGraph().synthesizeContinuous(
    cue,
    recipe,
    volumeMultiplier,
    options,
    onActiveVoiceChange
  )
}

export function stopAllContinuousVoices(releaseDuration?: number): void {
  getFallbackGraph().stopAllContinuousVoices(releaseDuration)
}

export function stopContinuousByCue(cue: string, releaseDuration?: number): void {
  getFallbackGraph().stopContinuousByCue(cue, releaseDuration)
}

export function getActiveContinuousCues(): string[] {
  return getFallbackGraph().getActiveContinuousCues()
}

export function getActiveVoicesCount(): number {
  return getFallbackGraph().getActiveVoicesCount()
}

export function resumeSoundContext(): Promise<void> {
  return getFallbackGraph().resume()
}
