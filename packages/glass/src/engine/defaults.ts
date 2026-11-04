import type { GlassMode, SurfaceFunctionName } from './types'

/** Single source of truth for Glass defaults (component, engine, factory). */
export const GLASS_DEFAULTS = {
  mode: 'svg' as GlassMode,
  borderRadius: 48,
  thickness: 80,
  bezelWidth: 60,
  refractiveIndex: 3.0,
  scaleRatio: 1.0,
  blur: 0.3,
  specularOpacity: 0.5,
  specularSaturation: 4,
  shadowColor: '#ffffff',
  shadowBlur: 20,
  shadowSpread: -5,
  tintColor: '#ffffff',
  tintOpacity: 0.06,
  outerShadowBlur: 24,
  outerShadowOpacity: 0.18,
  surfaceFunction: 'convex_squircle' as SurfaceFunctionName,
  /** Empty = sample procedural backdrop only (no remote image). */
  backgroundUrl: '',
} as const

export type GlassDefaults = typeof GLASS_DEFAULTS

export const SURFACE_FUNCTION_INDEX: Record<SurfaceFunctionName, number> = {
  convex_squircle: 0,
  convex_circle: 1,
  concave: 2,
  lip: 3,
}
