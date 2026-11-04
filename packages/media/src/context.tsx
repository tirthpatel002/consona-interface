import React, { createContext, useCallback, useContext, useMemo, useRef, useSyncExternalStore } from 'react'
import { AudioEngine, type AudioEngineOptions, type AudioEngineState } from './engine/audio-engine'

const AudioEngineContext = createContext<AudioEngine | null>(null)

export interface AudioProviderProps {
  children: React.ReactNode
  /** Custom options configuration. */
  options?: AudioEngineOptions & Record<string, unknown>
  /** Custom engine configuration. */
  engine?: AudioEngine
}

/**
 * App-level audio bus. Custom UIs can pull the shared player/recorder via
 * `useSharedAudioPlayer()` / `useSharedAudioRecorder()`, or
 * `useAudioPlayer({ shared: true })` / `useAudioRecorder({ shared: true })`.
 *
 * Does not destroy the engine on unmount — React Strict Mode remounts would
 * otherwise leave consumers holding a dead engine.
 */
export function AudioProvider({ children, options, engine: injected }: AudioProviderProps) {
  const optionsRef = useRef(options)
  const engine = useMemo(
    () => injected ?? new AudioEngine(optionsRef.current),
    [injected]
  )

  return (
    <AudioEngineContext.Provider value={engine}>{children}</AudioEngineContext.Provider>
  )
}

/** Shared AudioEngine when inside `<AudioProvider>`; otherwise `null`. */
export function useOptionalAudioEngine(): AudioEngine | null {
  return useContext(AudioEngineContext)
}

export function useAudioEngine(): AudioEngine {
  const engine = useOptionalAudioEngine()
  if (!engine) {
    throw new Error('useAudioEngine must be used within <AudioProvider>')
  }
  return engine
}

/**
 * Reactive subscription to the shared AudioEngine facade state.
 * Prefer player/recorder hooks for transport; use this for combined dashboards.
 */
export function useAudioEngineState(): AudioEngineState {
  const engine = useAudioEngine()
  return useSyncExternalStore(
    useCallback((onStoreChange) => engine.subscribe(onStoreChange), [engine]),
    () => engine.getState(),
    () => engine.getState()
  )
}
