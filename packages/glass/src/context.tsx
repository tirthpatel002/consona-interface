'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react'
import {
  GlassPhysicsEngine,
  type GlassPhysicsEngineOptions,
  type GlassPhysicsState,
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
  const engine = useMemo(
    () => injected ?? new GlassPhysicsEngine(options),
    // Recreate only when the injected instance identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [injected]
  )

  // Honor live option updates for the owned engine.
  useEffect(() => {
    if (injected || !options) return
    engine.updateParams(options)
  }, [engine, injected, options])

  useEffect(() => {
    if (injected) return
    return () => {
      engine.destroy()
    }
  }, [engine, injected])

  return <GlassEngineContext.Provider value={engine}>{children}</GlassEngineContext.Provider>
}

export function useGlassEngine(): GlassPhysicsEngine {
  const engine = useContext(GlassEngineContext)
  if (!engine) {
    throw new Error('useGlassEngine must be used within <GlassProvider>')
  }
  return engine
}

export function useOptionalGlassEngine(): GlassPhysicsEngine | null {
  return useContext(GlassEngineContext)
}

export function useOptionalGlassEngineState(): GlassPhysicsState | null {
  const engine = useOptionalGlassEngine()
  return useSyncExternalStore(
    React.useCallback(
      (onStoreChange) => {
        if (!engine) return () => {}
        return engine.subscribe(onStoreChange)
      },
      [engine]
    ),
    () => engine?.getState() ?? null,
    () => engine?.getState() ?? null
  )
}
