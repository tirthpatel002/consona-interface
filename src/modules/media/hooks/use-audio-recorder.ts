'use client'

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import {
  AudioRecorderEngine,
  type AudioRecorderEngineState,
  type AudioRecorderOptions,
} from '../engine/recorder-engine'
import type { AudioRecordingResult } from '../engine/types'

export interface UseAudioRecorderResult extends AudioRecorderEngineState {
  engine: AudioRecorderEngine | null
  stream: MediaStream | null
  isRecording: boolean
  isPaused: boolean
  isIdle: boolean
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

export function useAudioRecorder(options: AudioRecorderOptions = {}): UseAudioRecorderResult {
  const optionsRef = useRef(options)
  optionsRef.current = options

  const engineRef = useRef<AudioRecorderEngine | null>(null)

  function getOrCreateEngine(): AudioRecorderEngine | null {
    if (typeof window === 'undefined') return null
    if (!engineRef.current) {
      engineRef.current = new AudioRecorderEngine(optionsRef.current)
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
    return engine ? engine.getState() : DEFAULT_RECORDER_STATE
  }, [])

  const getServerSnapshot = useCallback(() => DEFAULT_RECORDER_STATE, [])

  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    return () => {
      engineRef.current?.destroy()
      engineRef.current = null
    }
  }, [])

  const start = useCallback((deviceId?: string) => {
    const engine = getOrCreateEngine()
    if (!engine) return Promise.reject(new Error('Recorder engine not initialized'))
    return engine.start(deviceId)
  }, [])

  const pause = useCallback(() => {
    const engine = getOrCreateEngine()
    engine?.pause()
  }, [])

  const resume = useCallback(() => {
    const engine = getOrCreateEngine()
    engine?.resume()
  }, [])

  const resumeRecording = useCallback((deviceId?: string) => {
    const engine = getOrCreateEngine()
    if (!engine) return Promise.reject(new Error('Recorder engine not initialized'))
    return engine.resumeRecording(deviceId)
  }, [])

  const stop = useCallback(() => {
    const engine = getOrCreateEngine()
    if (!engine) return Promise.reject(new Error('Recorder engine not initialized'))
    return engine.stop()
  }, [])

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
      engine: engineRef.current,
      stream: engineRef.current?.getStream() ?? null,
      isRecording,
      isPaused,
      isIdle,
      start,
      pause,
      resume,
      resumeRecording,
      stop,
      toggleRecord,
    }),
    [state, isRecording, isPaused, isIdle, start, pause, resume, resumeRecording, stop, toggleRecord]
  )
}
