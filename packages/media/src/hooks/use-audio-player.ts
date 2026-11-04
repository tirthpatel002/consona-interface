'use client'

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { useOptionalAudioEngine } from '../context'
import {
  AudioPlayerEngine,
  type AudioPlayerEngineOptions,
  type AudioPlayerEngineState,
} from '../engine/player-engine'
import type { AudioSourceInput, AudioTrack } from '../engine/types'

export interface UseAudioPlayerOptions<TData = unknown> extends AudioPlayerEngineOptions<TData> {
  /**
   * Existing player engine to bind (e.g. from `audioEngine.getPlayer()`).
   * When set, this hook does not own or destroy the engine.
   */
  engine?: AudioPlayerEngine<TData> | null
  /**
   * When true, uses the shared player from `<AudioProvider>` if no `engine` is passed.
   * Throws if there is no provider.
   */
  shared?: boolean
}

export interface UseAudioPlayerResult<TData = unknown> extends AudioPlayerEngineState<TData> {
  engine: AudioPlayerEngine<TData> | null
  audioElement: HTMLAudioElement | null
  isPlaying: boolean
  /** Whether this hook created the engine (false when injected / shared). */
  isOwned: boolean
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
  options: UseAudioPlayerOptions<TData> = {}
): UseAudioPlayerResult<TData> {
  const { engine: injectedEngine, shared = false, ...engineOptions } = options
  const optionsRef = useRef(engineOptions)
  optionsRef.current = engineOptions

  const sharedAudio = useOptionalAudioEngine()
  const ownedRef = useRef<AudioPlayerEngine<TData> | null>(null)

  const resolveEngine = useCallback((): {
    engine: AudioPlayerEngine<TData> | null
    owned: boolean
  } => {
    if (injectedEngine) {
      return { engine: injectedEngine, owned: false }
    }
    if (shared) {
      if (!sharedAudio) {
        throw new Error('useAudioPlayer({ shared: true }) requires <AudioProvider>')
      }
      return { engine: sharedAudio.getPlayer() as AudioPlayerEngine<TData>, owned: false }
    }
    if (typeof window === 'undefined') {
      return { engine: null, owned: false }
    }
    if (!ownedRef.current) {
      ownedRef.current = new AudioPlayerEngine<TData>(optionsRef.current)
    }
    return { engine: ownedRef.current, owned: true }
  }, [injectedEngine, shared, sharedAudio])

  const { engine, owned: isOwned } = resolveEngine()

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!engine) return () => {}
      return engine.subscribe(() => {
        onStoreChange?.()
      })
    },
    [engine]
  )

  const getSnapshot = useCallback(() => {
    return engine ? engine.getState() : DEFAULT_PLAYER_STATE
  }, [engine])

  const getServerSnapshot = useCallback(() => DEFAULT_PLAYER_STATE, [])

  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    engine?.setEvents(optionsRef.current.events ?? {})
  }, [engine, engineOptions.events])

  useEffect(() => {
    if (!engine || !isOwned) return
    if (engineOptions.source !== undefined) {
      void engine.setSource(engineOptions.source ?? null)
      return
    }
    if (engineOptions.initialTrack) {
      const currentActive = engine.getState().activeTrack
      if (
        !currentActive ||
        currentActive.id !== engineOptions.initialTrack.id ||
        currentActive.src !== engineOptions.initialTrack.src
      ) {
        void engine.setTrack(engineOptions.initialTrack)
      }
    }
  }, [engine, isOwned, engineOptions.initialTrack, engineOptions.source])

  useEffect(() => {
    return () => {
      // Only destroy engines this hook created. Shared / injected engines outlive the hook.
      // Local destroy is OK under Strict Mode — getOrCreate recreates on remount.
      if (ownedRef.current) {
        ownedRef.current.destroy()
        ownedRef.current = null
      }
    }
  }, [])

  const play = useCallback(
    (track?: AudioTrack<TData> | null) => {
      return engine ? engine.play(track) : Promise.resolve()
    },
    [engine]
  )

  const pause = useCallback(() => {
    engine?.pause()
  }, [engine])

  const togglePlay = useCallback(() => {
    engine?.togglePlay()
  }, [engine])

  const seek = useCallback(
    (time: number) => {
      engine?.seek(time)
    },
    [engine]
  )

  const setVolume = useCallback(
    (volume: number) => {
      engine?.setVolume(volume)
    },
    [engine]
  )

  const toggleMute = useCallback(() => {
    engine?.toggleMute()
  }, [engine])

  const setPlaybackRate = useCallback(
    (rate: number) => {
      engine?.setPlaybackRate(rate)
    },
    [engine]
  )

  const setTrack = useCallback(
    (track: AudioTrack<TData> | null) => {
      return engine ? engine.setTrack(track) : Promise.resolve()
    },
    [engine]
  )

  const setSource = useCallback(
    (source: AudioSourceInput<TData> | null) => {
      return engine ? engine.setSource(source) : Promise.resolve()
    },
    [engine]
  )

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
      engine,
      audioElement: engine?.getAudioElement() ?? null,
      isPlaying,
      isOwned,
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
      engine,
      isPlaying,
      isOwned,
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

/** Shared app-level player bound to `<AudioProvider>`. */
export function useSharedAudioPlayer<TData = unknown>(
  options: Omit<UseAudioPlayerOptions<TData>, 'shared' | 'engine'> = {}
): UseAudioPlayerResult<TData> {
  return useAudioPlayer<TData>({ ...options, shared: true })
}
