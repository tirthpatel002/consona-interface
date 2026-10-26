'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  calculateRmsVolume,
  createAudioAnalyser,
  extractMultiBandFrequencies,
  generateSyntheticBands,
  getLiveBands,
  MULTIBAND_DEFAULTS,
  type LiveBandData,
} from '../engine/analyser'
import type { AgentState, AudioAnalyserOptions, MultiBandVolumeOptions } from '../engine/types'

/**
 * Hook for tracking the real-time RMS volume of an audio stream or element.
 */
export function useAudioVolume(
  sourceInput?: MediaStream | HTMLMediaElement | AudioNode | null,
  options: AudioAnalyserOptions = { fftSize: 32, smoothingTimeConstant: 0 }
): number {
  const [volume, setVolume] = useState(0)
  const volumeRef = useRef(0)
  const frameId = useRef<number | null>(null)

  const memoizedOptions = useMemo(
    () => options,
    [options.fftSize, options.smoothingTimeConstant, options.minDecibels, options.maxDecibels]
  )

  useEffect(() => {
    if (!sourceInput) {
      setVolume(0)
      volumeRef.current = 0
      return
    }

    try {
      const { analyser, cleanup } = createAudioAnalyser(sourceInput, memoizedOptions)
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      let lastUpdate = 0
      const updateInterval = 1000 / 30 // 30 FPS

      const updateVolume = (timestamp: number) => {
        if (timestamp - lastUpdate >= updateInterval) {
          analyser.getByteFrequencyData(dataArray)
          const newVolume = calculateRmsVolume(dataArray)

          if (Math.abs(newVolume - volumeRef.current) > 0.008) {
            volumeRef.current = newVolume
            setVolume(newVolume)
          }
          lastUpdate = timestamp
        }
        frameId.current = requestAnimationFrame(updateVolume)
      }

      frameId.current = requestAnimationFrame(updateVolume)

      return () => {
        cleanup()
        if (frameId.current !== null) {
          cancelAnimationFrame(frameId.current)
        }
      }
    } catch {
      // Graceful fallback if WebAudio cannot attach to source
      setVolume(0)
      return undefined
    }
  }, [sourceInput, memoizedOptions])

  return volume
}

/**
 * Hook for tracking volume levels partitioned into multi-band frequency spectrum chunks.
 */
export function useMultibandVolume(
  sourceInput?: MediaStream | HTMLMediaElement | AudioNode | null,
  options: MultiBandVolumeOptions = {}
): number[] {
  const opts = useMemo(
    () => ({ ...MULTIBAND_DEFAULTS, ...options }),
    [
      options.bands,
      options.loPass,
      options.hiPass,
      options.updateInterval,
      options.analyserOptions?.fftSize,
      options.analyserOptions?.smoothingTimeConstant,
      options.analyserOptions?.minDecibels,
      options.analyserOptions?.maxDecibels,
    ]
  )

  const [frequencyBands, setFrequencyBands] = useState<number[]>(() =>
    new Array(opts.bands).fill(0)
  )
  const bandsRef = useRef<number[]>(new Array(opts.bands).fill(0))
  const frameId = useRef<number | null>(null)

  useEffect(() => {
    if (!sourceInput) {
      const empty = new Array(opts.bands).fill(0)
      setFrequencyBands(empty)
      bandsRef.current = empty
      return
    }

    try {
      const { analyser, cleanup } = createAudioAnalyser(sourceInput, opts.analyserOptions)
      const dataArray = new Float32Array(analyser.frequencyBinCount)

      let lastUpdate = 0
      const updateInterval = opts.updateInterval

      const updateBands = (timestamp: number) => {
        if (timestamp - lastUpdate >= updateInterval) {
          analyser.getFloatFrequencyData(dataArray)

          const chunks = extractMultiBandFrequencies(
            dataArray,
            opts.bands,
            opts.loPass,
            opts.hiPass
          )

          let changed = false
          for (let i = 0; i < chunks.length; i++) {
            const chunkVal = chunks[i]
            const bandVal = bandsRef.current[i]
            if (chunkVal !== undefined && bandVal !== undefined && Math.abs(chunkVal - bandVal) > 0.01) {
              changed = true
              break
            }
          }

          if (changed) {
            bandsRef.current = chunks
            setFrequencyBands(chunks)
          }

          lastUpdate = timestamp
        }

        frameId.current = requestAnimationFrame(updateBands)
      }

      frameId.current = requestAnimationFrame(updateBands)

      return () => {
        cleanup()
        if (frameId.current !== null) {
          cancelAnimationFrame(frameId.current)
        }
      }
    } catch {
      const empty = new Array(opts.bands).fill(0)
      setFrequencyBands(empty)
      bandsRef.current = empty
      return undefined
    }
  }, [sourceInput, opts])

  return frequencyBands
}

export interface UseLiveAudioBandsOptions extends MultiBandVolumeOptions {
  demo?: boolean
  state?: AgentState
}

/**
 * Unified live audio bands hook returning full frequency spectrum, RMS volume, peak decibels,
 * and built-in fallback to synthetic traveling sine waves for voice agent states or demo mode.
 */
export function useLiveAudioBands(
  sourceInput?: MediaStream | HTMLMediaElement | AudioNode | null,
  options: UseLiveAudioBandsOptions = {}
): LiveBandData {
  const bandsCount = options.bands ?? 16
  const isDemo = options.demo || (!sourceInput && !!options.state)

  const [data, setData] = useState<LiveBandData>(() => ({
    bands: new Array(bandsCount).fill(0),
    volume: 0,
    peak: 0,
    isSilent: true,
  }))

  const frameId = useRef<number | null>(null)
  const startTimeRef = useRef<number>(performance.now() / 1000)

  useEffect(() => {
    if (isDemo) {
      const updateDemo = () => {
        const time = performance.now() / 1000 - startTimeRef.current
        const bands = generateSyntheticBands(options.state || 'speaking', time, bandsCount)
        const avg = bands.reduce((acc, v) => acc + v, 0) / (bands.length || 1)
        setData({
          bands,
          volume: avg,
          peak: Math.max(...bands),
          isSilent: false,
        })
        frameId.current = requestAnimationFrame(updateDemo)
      }

      frameId.current = requestAnimationFrame(updateDemo)
      return () => {
        if (frameId.current) cancelAnimationFrame(frameId.current)
      }
    }

    if (!sourceInput) {
      setData({
        bands: new Array(bandsCount).fill(0),
        volume: 0,
        peak: 0,
        isSilent: true,
      })
      return
    }

    try {
      const { analyser, cleanup } = createAudioAnalyser(sourceInput, options.analyserOptions)
      let lastUpdate = 0
      const updateInterval = options.updateInterval ?? 32

      const updateLive = (timestamp: number) => {
        if (timestamp - lastUpdate >= updateInterval) {
          const live = getLiveBands(analyser, bandsCount, options)
          setData(live)
          lastUpdate = timestamp
        }
        frameId.current = requestAnimationFrame(updateLive)
      }

      frameId.current = requestAnimationFrame(updateLive)

      return () => {
        cleanup()
        if (frameId.current) cancelAnimationFrame(frameId.current)
      }
    } catch {
      setData({
        bands: new Array(bandsCount).fill(0),
        volume: 0,
        peak: 0,
        isSilent: true,
      })
      return undefined
    }
  }, [sourceInput, isDemo, options.state, bandsCount, options.loPass, options.hiPass, options.updateInterval])

  return data
}

