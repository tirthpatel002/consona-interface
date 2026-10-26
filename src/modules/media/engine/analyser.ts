import { createAudioContext, resumeAudioContext, getSharedAudioContext } from './context'
import type { AgentState, AudioAnalyserOptions, MultiBandVolumeOptions } from './types'

export interface AnalyserSnapshot {
  rms: number
  peak: number
}

export interface LiveBandData {
  /** Normalized frequency bands array (each between 0 and 1). */
  bands: number[]
  /** Overall RMS volume level (0 to 1). */
  volume: number
  /** Peak amplitude level (0 to 1). */
  peak: number
  /** Whether the audio source is considered silent (volume below threshold). */
  isSilent: boolean
}

/**
 * Converts a time-domain PCM buffer into display meters. Pure math — no DOM.
 */
export function analysePcm(samples: ArrayLike<number>): AnalyserSnapshot {
  if (samples.length === 0) return { rms: 0, peak: 0 }
  let sumSquares = 0
  let peak = 0
  for (let i = 0; i < samples.length; i += 1) {
    const sample = samples[i] ?? 0
    sumSquares += sample * sample
    const abs = Math.abs(sample)
    if (abs > peak) peak = abs
  }
  return { rms: Math.sqrt(sumSquares / (samples.length || 1)), peak }
}

export interface AudioAnalyserInstance {
  analyser: AnalyserNode
  audioContext: AudioContext
  source: AudioNode
  cleanup: () => void
}

const mediaElementSourceCache = new WeakMap<
  HTMLMediaElement,
  { source: AudioNode; audioContext: AudioContext }
>()

/**
 * Creates an AnalyserNode pipeline from a MediaStream, HTMLMediaElement, or existing AudioNode.
 */
export function createAudioAnalyser(
  sourceInput: MediaStream | HTMLMediaElement | AudioNode,
  options: AudioAnalyserOptions = {},
  existingContext?: AudioContext
): AudioAnalyserInstance {
  const isMediaEl = typeof HTMLMediaElement !== 'undefined' && sourceInput instanceof HTMLMediaElement

  let audioContext: AudioContext
  let source: AudioNode

  if (isMediaEl) {
    const cached = mediaElementSourceCache.get(sourceInput)
    if (cached && cached.audioContext.state !== 'closed') {
      audioContext = cached.audioContext
      source = cached.source
    } else {
      audioContext = existingContext || getSharedAudioContext()
      try {
        source = audioContext.createMediaElementSource(sourceInput)
        try {
          source.connect(audioContext.destination)
        } catch {
          // Destination connection may already exist
        }
        mediaElementSourceCache.set(sourceInput, { source, audioContext })
      } catch {
        // If already connected in another context, fallback to shared context
        audioContext = getSharedAudioContext()
        const fallbackCached = mediaElementSourceCache.get(sourceInput)
        if (fallbackCached) {
          source = fallbackCached.source
        } else {
          source = audioContext.createGain() // Safe dummy fallback node
        }
      }
    }
  } else if (typeof MediaStream !== 'undefined' && sourceInput instanceof MediaStream) {
    audioContext = existingContext || createAudioContext()
    source = audioContext.createMediaStreamSource(sourceInput)
  } else {
    audioContext = existingContext || createAudioContext()
    source = sourceInput as AudioNode
  }

  resumeAudioContext(audioContext)

  const analyser = audioContext.createAnalyser()
  if (options.fftSize !== undefined) analyser.fftSize = options.fftSize
  if (options.smoothingTimeConstant !== undefined) analyser.smoothingTimeConstant = options.smoothingTimeConstant
  if (options.minDecibels !== undefined) analyser.minDecibels = options.minDecibels
  if (options.maxDecibels !== undefined) analyser.maxDecibels = options.maxDecibels

  try {
    source.connect(analyser)
  } catch {
    // Ignore connect error
  }

  const cleanup = () => {
    try {
      source.disconnect(analyser)
    } catch {
      // Ignored
    }
    try {
      analyser.disconnect()
    } catch {
      // Ignored
    }
    if (!existingContext && !isMediaEl && audioContext.state !== 'closed') {
      audioContext.close().catch(() => {})
    }
  }

  return { analyser, audioContext, source, cleanup }
}

/**
 * Decibel normalizer mapping from standard dB range to 0..1 scale.
 */
export function normalizeDb(value: number, minDb = -100, maxDb = -10): number {
  if (value === -Infinity || Number.isNaN(value)) return 0
  const clamped = Math.max(minDb, Math.min(maxDb, value))
  const normalized = 1 - (clamped * -1) / Math.abs(minDb)
  return Math.sqrt(Math.max(0, Math.min(1, normalized)))
}

/**
 * Calculates RMS volume level (0..1) from a frequency or time-domain byte array.
 */
export function calculateRmsVolume(dataArray: Uint8Array): number {
  if (dataArray.length === 0) return 0
  let sum = 0
  for (let i = 0; i < dataArray.length; i++) {
    const val = dataArray[i] ?? 0
    sum += val * val
  }
  return Math.sqrt(sum / (dataArray.length || 1)) / 255
}

/**
 * Calculates peak volume level (0..1) from a byte array.
 */
export function calculatePeakVolume(dataArray: Uint8Array): number {
  let max = 0
  for (let i = 0; i < dataArray.length; i++) {
    const val = dataArray[i] ?? 0
    if (val > max) max = val
  }
  return max / 255
}

export const MULTIBAND_DEFAULTS: Required<MultiBandVolumeOptions> = {
  bands: 16,
  loPass: 60,
  hiPass: 7500,
  updateInterval: 32,
  analyserOptions: { fftSize: 256, smoothingTimeConstant: 0.75 },
}

/**
 * Extracts normalized multiband frequency values from Uint8 or Float32 frequency data.
 * Correctly maps acoustic Hz boundaries to FFT bin indices.
 */
export function extractMultiBandFrequencies(
  data: Uint8Array | Float32Array,
  bandsCount = 16,
  loPass = 60,
  hiPass = 7500,
  sampleRate = 48000
): number[] {
  const binCount = data.length
  if (binCount === 0) return new Array(bandsCount).fill(0.06)

  const nyquist = sampleRate / 2
  // Convert Hz to bin indices
  let startBin = Math.max(0, Math.floor((loPass / nyquist) * binCount))
  let endBin = Math.min(binCount, Math.ceil((hiPass / nyquist) * binCount))

  // Fallback if bin range is too narrow
  if (endBin <= startBin) {
    startBin = 0
    endBin = Math.max(bandsCount, Math.floor(binCount * 0.6))
  }

  const sliceLength = endBin - startBin
  const step = Math.max(1, sliceLength / bandsCount)

  const isFloat = data instanceof Float32Array
  const bands: number[] = []

  for (let i = 0; i < bandsCount; i++) {
    const start = Math.floor(startBin + i * step)
    const end = Math.max(start + 1, Math.min(endBin, Math.floor(startBin + (i + 1) * step)))
    let sum = 0
    let count = 0

    for (let j = start; j < end && j < binCount; j++) {
      const val = data[j]
      if (val !== undefined && Number.isFinite(val)) {
        sum += val
        count++
      }
    }

    if (isFloat) {
      const avgDb = count > 0 ? sum / (count || 1) : -100
      bands.push(normalizeDb(avgDb, -85, -10))
    } else {
      const rawAvg = count > 0 ? sum / (count || 1) / 255 : 0
      // Soft noise gate + perceptual scaling with headroom (prevents ceiling clipping)
      const noiseGate = 0.025
      const gated = Math.max(0, rawAvg - noiseGate) / (1 - noiseGate)
      const boosted = Math.pow(gated, 0.85) * 0.82
      bands.push(Math.max(0.06, Math.min(0.90, boosted)))
    }
  }

  return bands
}

/**
 * Reads a live snapshot from an active AnalyserNode.
 */
export function getLiveBands(
  analyser: AnalyserNode,
  bandsCount = 16,
  options: MultiBandVolumeOptions = {}
): LiveBandData {
  const byteData = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteFrequencyData(byteData)

  const sampleRate = analyser.context.sampleRate || 48000
  const loPass = options.loPass ?? 60
  const hiPass = options.hiPass ?? 7500

  const bands = extractMultiBandFrequencies(byteData, bandsCount, loPass, hiPass, sampleRate)
  const volume = calculateRmsVolume(byteData)
  const peak = calculatePeakVolume(byteData)

  return {
    bands,
    volume,
    peak,
    isSilent: volume < 0.015,
  }
}

/**
 * Generates beautiful continuous traveling sine wave bands for Voice Agent states.
 * Preserves fluid dynamics with headroom-controlled peak ranges.
 */
export function generateSyntheticBands(
  state: AgentState | string | undefined,
  time: number,
  barCount = 15
): number[] {
  const count = Math.max(1, barCount)
  const newBands = new Array(count)

  for (let i = 0; i < count; i++) {
    const x = count > 1 ? i / (count - 1) : 0.5

    if (state === 'speaking') {
      // Pure traveling sine wave with breathing dynamic envelope and headroom
      const wave = Math.sin(2 * Math.PI * 1.5 * x - time * 4.5)
      const envelope = Math.sin(time * 1.8) * 0.08 + 0.36
      newBands[i] = Math.max(0.06, Math.min(0.85, envelope + 0.32 * wave))
    } else if (state === 'thinking') {
      // Pure traveling sine wave with 2.0 cycles
      const wave = Math.sin(2 * Math.PI * 2.0 * x - time * 3.5)
      const envelope = Math.sin(time * 1.2) * 0.06 + 0.32
      newBands[i] = Math.max(0.06, Math.min(0.78, envelope + 0.28 * wave))
    } else if (state === 'listening') {
      // Gentle undulating sine wave with 1.0 cycle
      const wave = Math.sin(2 * Math.PI * 1.0 * x - time * 2.5)
      newBands[i] = Math.max(0.06, Math.min(0.58, 0.24 + 0.20 * wave))
    } else if (state === 'connecting' || state === 'initializing') {
      // Symmetrical standing sine wave pulsing from center
      const wave = Math.sin(Math.PI * x) * Math.sin(time * 3.5)
      newBands[i] = Math.max(0.06, Math.min(0.72, 0.30 + 0.28 * wave))
    } else if (state === 'muted') {
      newBands[i] = 0.06
    } else if (state === 'error') {
      const pulse = Math.sin(time * 6.0)
      newBands[i] = Math.max(0.06, Math.min(0.50, 0.22 + 0.16 * pulse))
    } else {
      // Idle: serene slow ambient sine wave
      const wave = Math.sin(2 * Math.PI * 1.0 * x - time * 1.5)
      newBands[i] = Math.max(0.06, Math.min(0.32, 0.15 + 0.09 * wave))
    }
  }

  return newBands
}

/**
 * Extracts offline peak amplitudes from an AudioBuffer for timeline visualization or editing previews.
 */
export function analyseAudioBuffer(buffer: AudioBuffer, targetBars = 100): number[] {
  const channelData = buffer.getChannelData(0)
  const totalSamples = channelData.length
  const samplesPerBar = Math.floor(totalSamples / targetBars)
  const peaks: number[] = []

  for (let i = 0; i < targetBars; i++) {
    const start = i * samplesPerBar
    const end = Math.min(totalSamples, start + samplesPerBar)
    let max = 0

    for (let j = start; j < end; j++) {
      const val = Math.abs(channelData[j] ?? 0)
      if (val > max) max = val
    }

    peaks.push(Math.max(0.05, Math.min(1, max)))
  }

  return peaks
}

