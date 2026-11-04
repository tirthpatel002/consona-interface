// Component Fleet
export * from './components'

// Engine & Shader Pipeline
export * from './engine/presets'
export * from './engine/orb-states'
export * from './engine/orb-uniforms'
export * from './engine/orb-renderer'
export * from './engine/shader-source'
export { OrbPhysicsEngine } from './engine/orb-physics-engine'
export type { OrbPhysicsState, OrbPhysicsEngineOptions } from './engine/orb-physics-engine'
export { compileShaderSource, defaultOrbUniforms } from './engine/shader-pipeline'
export type { ShaderUniforms } from './engine/shader-pipeline'

// Hooks & Context
export { OrbPlugin } from './plugin'
export { OrbProvider, useOrbEngine } from './context'
export type { OrbProviderProps } from './context'
export { useOrbPhysics } from './hooks/use-orb-physics'
export { useShaderMaterial } from './hooks/use-shader-material'
