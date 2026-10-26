import React, { createContext, useContext, useMemo, useRef } from 'react'
import {
  GlassPhysicsEngine,
  type GlassPhysicsEngineOptions,
} from './engine/glass-physics-engine'

const GlassEngineContext = createContext<GlassPhysicsEngine | null>(null)

export interface GlassProviderProps {
  children: React.ReactNode
  /** Custom options configuration. */
  options?: GlassPhysicsEngineOptions & Record<string, unknown>
  /** Custom engine configuration. */
  engine?: GlassPhysicsEngine
}

export function GlassProvider({ children, options, engine: injected }: GlassProviderProps) {
  const optionsRef = useRef(options)
  const engine = useMemo(
    () => injected ?? new GlassPhysicsEngine(optionsRef.current),
    [injected]
  )

  return <GlassEngineContext.Provider value={engine}>{children}</GlassEngineContext.Provider>
}

export function useGlassEngine(): GlassPhysicsEngine {
  const engine = useContext(GlassEngineContext)
  if (!engine) {
    throw new Error('useGlassEngine must be used within <GlassProvider>')
  }
  return engine
}
