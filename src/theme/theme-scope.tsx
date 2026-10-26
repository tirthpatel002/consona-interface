import React, { useMemo } from 'react'
import {
  type ThemePreset,
  type TokenMap,
  type RadiusPreset,
  type ShadowPreset,
  type DensityPreset,
  type StrokePreset,
  RADIUS_VALUES,
  SHADOW_VALUES,
  DENSITY_VALUES,
  STROKE_VALUES,
} from './tokens'
import { useThemeOptional } from './theme-provider'

export interface ThemeScopeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Lock this subtree to 'light' or 'dark' mode */
  mode?: 'light' | 'dark'
  /** Lock this subtree to a specific preset object or preset ID */
  preset?: string | ThemePreset
  /** Lock corner curvature token (e.g. 'none', 'sm', 'md', 'lg', 'full', or custom CSS length) */
  radius?: RadiusPreset | string
  /** Lock elevation/shadow token ('none', 'subtle', 'soft', 'strong') */
  shadow?: ShadowPreset | string
  /** Lock optical density token ('compact', 'normal', 'spacious', or multiplier number) */
  density?: DensityPreset | number
  /** Lock stroke border-width token ('flat', 'standard', 'bold', or custom CSS length) */
  stroke?: StrokePreset | string
  /** Custom token variable overrides locked to this subtree */
  tokens?: TokenMap
  /** Optional HTML tag or wrapper component (default: 'div') */
  as?: React.ElementType
  children?: React.ReactNode
}

/**
 * `<ThemeScope>` isolates any component or subtree to a hardcoded theme, preset, or token set.
 * CSS variables cascade within the container, preventing root Theme Editor changes from affecting the contents.
 */
export function ThemeScope({
  mode,
  preset,
  radius,
  shadow,
  density,
  stroke,
  tokens,
  as: Component = 'div',
  className,
  style,
  children,
  ...props
}: ThemeScopeProps) {
  const themeCtx = useThemeOptional()

  const resolvedPreset = useMemo<ThemePreset | undefined>(() => {
    if (!preset) return undefined
    if (typeof preset === 'object') return preset
    if (themeCtx?.presets) {
      return themeCtx.presets.find((p) => p.id === preset)
    }
    return undefined
  }, [preset, themeCtx?.presets])

  const computedStyle = useMemo<React.CSSProperties>(() => {
    const vars: Record<string, string> = {}

    // 1. Preset base tokens
    if (resolvedPreset?.tokens) {
      Object.entries(resolvedPreset.tokens).forEach(([k, v]) => {
        if (v != null) vars[`--${k}`] = String(v)
      })
    }

    // 2. Preset color palette
    if (resolvedPreset) {
      const activeMode = mode ?? themeCtx?.resolvedMode ?? 'light'
      const palette = activeMode === 'dark' ? resolvedPreset.dark : resolvedPreset.light
      if (palette) {
        Object.entries(palette).forEach(([k, v]) => {
          if (v != null) vars[`--${k}`] = String(v)
        })
      }
    }

    // 3. Radius
    if (radius != null) {
      const radValue = (RADIUS_VALUES as any)[radius] ?? radius
      vars['--radius'] = String(radValue)
    }

    // 4. Density
    if (density != null) {
      const densityNum =
        typeof density === 'number'
          ? density
          : (DENSITY_VALUES as any)[density] ?? 1
      vars['--density-factor'] = String(densityNum)
      vars['--density'] = String(densityNum)
    }

    // 5. Stroke
    if (stroke != null) {
      const strokeVal = (STROKE_VALUES as any)[stroke] ?? stroke
      vars['--border-width'] = String(strokeVal)
    }

    // 6. Shadow
    if (shadow != null) {
      const shadowMap = (SHADOW_VALUES as any)[shadow] ?? SHADOW_VALUES.subtle
      Object.entries(shadowMap).forEach(([k, v]) => {
        vars[`--${k}`] = String(v)
      })
    }

    // 7. Explicit token overrides
    if (tokens) {
      Object.entries(tokens).forEach(([k, v]) => {
        if (v != null) vars[`--${k}`] = String(v)
      })
    }

    return {
      ...(vars as React.CSSProperties),
      ...style,
    }
  }, [resolvedPreset, mode, themeCtx?.resolvedMode, radius, density, stroke, shadow, tokens, style])

  return (
    <Component
      data-theme-scope=""
      className={className}
      style={computedStyle}
      {...props}
    >
      {children}
    </Component>
  )
}
