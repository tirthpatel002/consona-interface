import React, { createContext, useContext, useMemo, useRef } from 'react'
import { OrbPhysicsEngine, type OrbPhysicsEngineOptions } from './engine/orb-physics-engine'

const OrbEngineContext = createContext<OrbPhysicsEngine | null>(null)

export interface OrbProviderProps {
  children: React.ReactNode
  /** Custom options configuration. */
  options?: OrbPhysicsEngineOptions & Record<string, unknown>
  /** Custom engine configuration. */
  engine?: OrbPhysicsEngine
}

export function OrbProvider({ children, options, engine: injected }: OrbProviderProps) {
  const optionsRef = useRef(options)
  const engine = useMemo(
    () => injected ?? new OrbPhysicsEngine(optionsRef.current),
    [injected]
  )

  return <OrbEngineContext.Provider value={engine}>{children}</OrbEngineContext.Provider>
}

export function useOrbEngine(): OrbPhysicsEngine {
  const engine = useContext(OrbEngineContext)
  if (!engine) {
    throw new Error('useOrbPhysics must be used within <OrbProvider>')
  }
  return engine
}
