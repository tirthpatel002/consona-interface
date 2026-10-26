import React, { createContext, useContext, useMemo, useRef } from 'react'
import { AudioEngine, type AudioEngineOptions } from './engine/audio-engine'

const AudioEngineContext = createContext<AudioEngine | null>(null)

export interface AudioProviderProps {
  children: React.ReactNode
  /** Custom options configuration. */
  options?: AudioEngineOptions & Record<string, unknown>
  /** Custom engine configuration. */
  engine?: AudioEngine
}

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

export function useAudioEngine(): AudioEngine {
  const engine = useContext(AudioEngineContext)
  if (!engine) {
    throw new Error('useAudio must be used within <AudioProvider>')
  }
  return engine
}
