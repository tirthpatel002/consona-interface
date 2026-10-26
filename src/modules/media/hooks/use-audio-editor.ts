'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { AudioEngine } from '../engine/audio-engine'
import { analyseAudioBuffer } from '../engine/analyser'

export interface UseAudioEditorResult {
  /** The currently decoded AudioBuffer. */
  buffer: AudioBuffer | null
  /** Sampled peak amplitudes for waveform rendering (normalized 0..1). */
  peaks: number[]
  /** Duration of the loaded buffer in seconds. */
  duration: number
  /** Sample rate in Hz. */
  sampleRate: number
  /** Number of audio channels. */
  channels: number
  /** Whether an audio file is actively being decoded. */
  isLoading: boolean
  /** Any error encountered during audio loading or DSP processing. */
  error: Error | null
  /** Loads and decodes an audio source (Blob, URL, or File). */
  loadAudio: (source: Blob | string | File) => Promise<AudioBuffer>
  /** Non-destructively trims the audio buffer to the specified time window. */
  trim: (startSeconds: number, endSeconds: number) => AudioBuffer
  /** Applies a linear fade-in effect to the start of the audio. */
  fadeIn: (durationSeconds: number) => AudioBuffer
  /** Applies a linear fade-out effect to the end of the audio. */
  fadeOut: (durationSeconds: number) => AudioBuffer
  /** Normalizes audio volume peak to maximum headroom. */
  normalize: (targetPeak?: number) => AudioBuffer
  /** Scales the audio gain by a multiplier. */
  applyGain: (factor: number) => AudioBuffer
  /** Reverses the audio samples. */
  reverse: () => AudioBuffer
  /** Exports the current audio buffer as a WAV Blob. */
  exportAsWav: () => Blob
  /** Downloads the audio buffer as a WAV file. */
  download: (filename?: string) => void
}

/**
 * Hook for audio editing, DSP operations (trim, fade, normalize, gain, reverse), and WAV export.
 */
export function useAudioEditor(targetWaveformBars = 100): UseAudioEditorResult {
  const engineRef = useRef<AudioEngine | null>(null)
  if (!engineRef.current) {
    engineRef.current = new AudioEngine()
  }
  const engine = engineRef.current

  const [buffer, setBuffer] = useState<AudioBuffer | null>(null)
  const [peaks, setPeaks] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateBufferState = useCallback(
    (newBuffer: AudioBuffer) => {
      setBuffer(newBuffer)
      setPeaks(analyseAudioBuffer(newBuffer, targetWaveformBars))
    },
    [targetWaveformBars]
  )

  const loadAudio = useCallback(
    async (source: Blob | string | File): Promise<AudioBuffer> => {
      setIsLoading(true)
      setError(null)
      try {
        const decoded = await engine.loadAudioBuffer(source)
        updateBufferState(decoded)
        return decoded
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err))
        setError(errorObj)
        throw errorObj
      } finally {
        setIsLoading(false)
      }
    },
    [engine, updateBufferState]
  )

  const trim = useCallback(
    (startSeconds: number, endSeconds: number): AudioBuffer => {
      const trimmed = engine.trim(startSeconds, endSeconds)
      updateBufferState(trimmed)
      return trimmed
    },
    [engine, updateBufferState]
  )

  const fadeIn = useCallback(
    (durationSeconds: number): AudioBuffer => {
      const result = engine.fadeIn(durationSeconds)
      updateBufferState(result)
      return result
    },
    [engine, updateBufferState]
  )

  const fadeOut = useCallback(
    (durationSeconds: number): AudioBuffer => {
      const result = engine.fadeOut(durationSeconds)
      updateBufferState(result)
      return result
    },
    [engine, updateBufferState]
  )

  const normalize = useCallback(
    (targetPeak = 0.98): AudioBuffer => {
      const result = engine.normalize(targetPeak)
      updateBufferState(result)
      return result
    },
    [engine, updateBufferState]
  )

  const applyGain = useCallback(
    (factor: number): AudioBuffer => {
      const result = engine.applyGain(factor)
      updateBufferState(result)
      return result
    },
    [engine, updateBufferState]
  )

  const reverse = useCallback((): AudioBuffer => {
    const result = engine.reverse()
    updateBufferState(result)
    return result
  }, [engine, updateBufferState])

  const exportAsWav = useCallback((): Blob => {
    return engine.exportAsWav()
  }, [engine])

  const download = useCallback(
    (filename = 'audio-edit.wav') => {
      engine.download(filename)
    },
    [engine]
  )

  return useMemo(
    () => ({
      buffer,
      peaks,
      duration: buffer ? buffer.duration : 0,
      sampleRate: buffer ? buffer.sampleRate : 44100,
      channels: buffer ? buffer.numberOfChannels : 2,
      isLoading,
      error,
      loadAudio,
      trim,
      fadeIn,
      fadeOut,
      normalize,
      applyGain,
      reverse,
      exportAsWav,
      download,
    }),
    [
      buffer,
      peaks,
      isLoading,
      error,
      loadAudio,
      trim,
      fadeIn,
      fadeOut,
      normalize,
      applyGain,
      reverse,
      exportAsWav,
      download,
    ]
  )
}
