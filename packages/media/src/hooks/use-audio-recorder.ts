'use client'

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { useOptionalAudioEngine } from '../context'
import {
  AudioRecorderEngine,
  type AudioRecorderEngineState,
  type AudioRecorderOptions,
} from '../engine/recorder-engine'
import type { AudioRecordingResult } from '../engine/types'

export interface UseAudioRecorderHookOptions extends AudioRecorderOptions {
  /**
   * Existing recorder engine to bind (e.g. from `audioEngine.getRecorder()`).
   * When set, this hook does not own or destroy the engine.
   */
  engine?: AudioRecorderEngine | null
  /**
   * When true, uses the shared recorder from `<AudioProvider>` if no `engine` is passed.
   * Throws if there is no provider.
   */
  shared?: boolean
}

export interface UseAudioRecorderResult extends AudioRecorderEngineState {
  engine: AudioRecorderEngine | null
  stream: MediaStream | null
  isRecording: boolean
  isPaused: boolean
  isIdle: boolean
  /** Whether this hook created the engine (false when injected / shared). */
  isOwned: boolean
  start: (deviceId?: string) => Promise<MediaStream>
  pause: () => void
  resume: () => void
  resumeRecording: (deviceId?: string) => Promise<MediaStream>
  stop: () => Promise<AudioRecordingResult>
  toggleRecord: (deviceId?: string) => Promise<AudioRecordingResult | MediaStream | void>
}

const DEFAULT_RECORDER_STATE: AudioRecorderEngineState = {
  status: 'idle',
  duration: 0,
  volume: 0,
  waveformHistory: [],
  error: null,
}

export function useAudioRecorder(options: UseAudioRecorderHookOptions = {}): UseAudioRecorderResult {
  const { engine: injectedEngine, shared = false, ...recorderOptions } = options
  const optionsRef = useRef(recorderOptions)
  optionsRef.current = recorderOptions

  const sharedAudio = useOptionalAudioEngine()
  const ownedRef = useRef<AudioRecorderEngine | null>(null)

  const resolveEngine = useCallback((): {
    engine: AudioRecorderEngine | null
    owned: boolean
  } => {
    if (injectedEngine) {
      return { engine: injectedEngine, owned: false }
    }
    if (shared) {
      if (!sharedAudio) {
        throw new Error('useAudioRecorder({ shared: true }) requires <AudioProvider>')
      }
      return { engine: sharedAudio.getRecorder(), owned: false }
    }
    if (typeof window === 'undefined') {
      return { engine: null, owned: false }
    }
    if (!ownedRef.current) {
      ownedRef.current = new AudioRecorderEngine(optionsRef.current)
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
    return engine ? engine.getState() : DEFAULT_RECORDER_STATE
  }, [engine])

  const getServerSnapshot = useCallback(() => DEFAULT_RECORDER_STATE, [])

  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    return () => {
      if (ownedRef.current) {
        ownedRef.current.destroy()
        ownedRef.current = null
      }
    }
  }, [])

  const start = useCallback(
    (deviceId?: string) => {
      if (!engine) return Promise.reject(new Error('Recorder engine not initialized'))
      return engine.start(deviceId)
    },
    [engine]
  )

  const pause = useCallback(() => {
    engine?.pause()
  }, [engine])

  const resume = useCallback(() => {
    engine?.resume()
  }, [engine])

  const resumeRecording = useCallback(
    (deviceId?: string) => {
      if (!engine) return Promise.reject(new Error('Recorder engine not initialized'))
      return engine.resumeRecording(deviceId)
    },
    [engine]
  )

  const stop = useCallback(() => {
    if (!engine) return Promise.reject(new Error('Recorder engine not initialized'))
    return engine.stop()
  }, [engine])

  const toggleRecord = useCallback(
    (deviceId?: string) => {
      if (state.status === 'recording') {
        return stop()
      }
      return start(deviceId)
    },
    [state.status, start, stop]
  )

  const isRecording = state.status === 'recording'
  const isPaused = state.status === 'paused'
  const isIdle = state.status === 'idle'

  return useMemo(
    () => ({
      ...state,
      engine,
      stream: engine?.getStream() ?? null,
      isRecording,
      isPaused,
      isIdle,
      isOwned,
      start,
      pause,
      resume,
      resumeRecording,
      stop,
      toggleRecord,
    }),
    [
      state,
      engine,
      isRecording,
      isPaused,
      isIdle,
      isOwned,
      start,
      pause,
      resume,
      resumeRecording,
      stop,
      toggleRecord,
    ]
  )
}

/** Shared app-level recorder bound to `<AudioProvider>`. */
export function useSharedAudioRecorder(
  options: Omit<UseAudioRecorderHookOptions, 'shared' | 'engine'> = {}
): UseAudioRecorderResult {
  return useAudioRecorder({ ...options, shared: true })
}
