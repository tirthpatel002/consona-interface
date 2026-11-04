// Component Fleet
export * from './components'

// Engine & Refraction Pipeline
export * from './engine/presets'
export * from './engine/refraction-pipeline'
export { GlassPhysicsEngine } from './engine/glass-physics-engine'
export type { GlassPhysicsState, GlassPhysicsEngineOptions } from './engine/glass-physics-engine'

// Context, Plugin & Hooks
export { GlassPlugin } from './plugin'
export {
  GlassProvider,
  useGlassEngine,
  useOptionalGlassEngine,
  useOptionalGlassEngineState,
} from './context'
export type { GlassProviderProps } from './context'
export { GLASS_DEFAULTS, SURFACE_FUNCTION_INDEX } from './engine/defaults'
export { useGlassPhysics, useGlass } from './hooks/use-glass-physics'
