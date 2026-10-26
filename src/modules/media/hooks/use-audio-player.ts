'use client'

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import {
  AudioPlayerEngine,
  type AudioPlayerEngineOptions,
  type AudioPlayerEngineState,
} from '../engine/player-engine'
import type { AudioSourceInput, AudioTrack } from '../engine/types'

export interface UseAudioPlayerResult<TData = unknown> extends AudioPlayerEngineState<TData> {
  engine: AudioPlayerEngine<TData> | null
  audioElement: HTMLAudioElement | null
  isPlaying: boolean
  play: (track?: AudioTrack<TData> | null) => Promise<void>
  pause: () => void
  togglePlay: () => void
  seek: (timeInSeconds: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  setPlaybackRate: (rate: number) => void
  setTrack: (track: AudioTrack<TData> | null) => Promise<void>
  setSource: (source: AudioSourceInput<TData> | null) => Promise<void>
  isTrackActive: (id: string | number | null | undefined) => boolean
}

const DEFAULT_PLAYER_STATE: AudioPlayerEngineState<any> = {
  activeTrack: null,
  status: 'idle',
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  playbackRate: 1,
  isBuffering: false,
  error: null,
}

export function useAudioPlayer<TData = unknown>(
  options: AudioPlayerEngineOptions<TData> = {}
): UseAudioPlayerResult<TData> {
  const optionsRef = useRef(options)
  optionsRef.current = options

  const engineRef = useRef<AudioPlayerEngine<TData> | null>(null)

  function getOrCreateEngine(): AudioPlayerEngine<TData> | null {
    if (typeof window === 'undefined') return null
    if (!engineRef.current) {
      engineRef.current = new AudioPlayerEngine<TData>(optionsRef.current)
    }
    return engineRef.current
  }

  const subscribe = useCallback((onStoreChange: () => void) => {
    const engine = getOrCreateEngine()
    if (!engine) return () => {}
    return engine.subscribe(() => {
      onStoreChange?.()
    })
  }, [])

  const getSnapshot = useCallback(() => {
    const engine = getOrCreateEngine()
    return engine ? engine.getState() : DEFAULT_PLAYER_STATE
  }, [])

  const getServerSnapshot = useCallback(() => DEFAULT_PLAYER_STATE, [])

  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    engineRef.current?.setEvents(optionsRef.current.events ?? {})
  }, [options.events])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    if (options.source !== undefined) {
      engine.setSource(options.source ?? null)
      return
    }
    if (options.initialTrack) {
      const currentActive = engine.getState().activeTrack
      if (
        !currentActive ||
        currentActive.id !== options.initialTrack.id ||
        currentActive.src !== options.initialTrack.src
      ) {
        engine.setTrack(options.initialTrack)
      }
    }
  }, [options.initialTrack, options.source])

  useEffect(() => {
    return () => {
      engineRef.current?.destroy()
      engineRef.current = null
    }
  }, [])

  const play = useCallback((track?: AudioTrack<TData> | null) => {
    const engine = getOrCreateEngine()
    return engine ? engine.play(track) : Promise.resolve()
  }, [])

  const pause = useCallback(() => {
    const engine = getOrCreateEngine()
    engine?.pause()
  }, [])

  const togglePlay = useCallback(() => {
    const engine = getOrCreateEngine()
    engine?.togglePlay()
  }, [])

  const seek = useCallback((time: number) => {
    const engine = getOrCreateEngine()
    engine?.seek(time)
  }, [])

  const setVolume = useCallback((volume: number) => {
    const engine = getOrCreateEngine()
    engine?.setVolume(volume)
  }, [])

  const toggleMute = useCallback(() => {
    const engine = getOrCreateEngine()
    engine?.toggleMute()
  }, [])

  const setPlaybackRate = useCallback((rate: number) => {
    const engine = getOrCreateEngine()
    engine?.setPlaybackRate(rate)
  }, [])

  const setTrack = useCallback((track: AudioTrack<TData> | null) => {
    const engine = getOrCreateEngine()
    return engine ? engine.setTrack(track) : Promise.resolve()
  }, [])

  const setSource = useCallback((source: AudioSourceInput<TData> | null) => {
    const engine = getOrCreateEngine()
    return engine ? engine.setSource(source) : Promise.resolve()
  }, [])

  const isTrackActive = useCallback(
    (id: string | number | null | undefined) => {
      if (id === null || id === undefined) return false
      return state.activeTrack?.id === id
    },
    [state.activeTrack]
  )

  const isPlaying = state.status === 'playing'

  return useMemo(
    () => ({
      ...state,
      engine: engineRef.current,
      audioElement: engineRef.current?.getAudioElement() ?? null,
      isPlaying,
      play,
      pause,
      togglePlay,
      seek,
      setVolume,
      toggleMute,
      setPlaybackRate,
      setTrack,
      setSource,
      isTrackActive,
    }),
    [
      state,
      isPlaying,
      play,
      pause,
      togglePlay,
      seek,
      setVolume,
      toggleMute,
      setPlaybackRate,
      setTrack,
      setSource,
      isTrackActive,
    ]
  )
}
