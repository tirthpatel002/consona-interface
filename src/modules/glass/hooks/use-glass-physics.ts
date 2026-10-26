import { useEngineState } from '../../../core/hooks'
import { useGlassEngine } from '../context'
import type { GlassMode } from '../engine/presets'
import type { GlassPhysicsState } from '../engine/glass-physics-engine'

export function useGlassPhysics() {
  const engine = useGlassEngine()
  const state = useEngineState(engine)

  return {
    ...state,
    setMode: (mode: GlassMode) => engine.setMode(mode),
    setBackgroundUrl: (url: string) => engine.setBackgroundUrl(url),
    updateParams: (params: Partial<GlassPhysicsState>) => engine.updateParams(params),
    reset: () => engine.reset(),
    engine,
  }
}

export const useGlass = useGlassPhysics
