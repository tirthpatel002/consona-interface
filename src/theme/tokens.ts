/**
 * Consona Design System: Universal Token & Geometry Schema
 */

export type TokenMap = Record<string, string | number>

/**
 * Dynamic theme tokens applied as CSS custom properties on <html> or target root.
 * Values may be any valid CSS color, dimension, or string (hex, rgb, oklch, rem, px, …).
 * Keys are variable names without the leading `--`.
 */
export type ThemeTokens = Record<string, string>

export type TokenControl =
  | 'color'
  | 'dimension'
  | 'number'
  | 'font'
  | 'shadow'
  | 'select'
  | 'text'

export interface TokenDescriptor {
  key: string
  label: string
  category: string
  control?: TokenControl
  options?: Array<{ label: string; value: string | number }>
  description?: string
  defaultLight?: string | number
  defaultDark?: string | number
}

export type RadiusPreset = 'none' | 'sm' | 'md' | 'lg' | 'xl'

export const RADIUS_PRESETS: { id: RadiusPreset; label: string; value: string }[] = [
  { id: 'none', label: 'None (0px)', value: '0px' },
  { id: 'sm', label: 'Small (4px)', value: '0.25rem' },
  { id: 'md', label: 'Medium (8px)', value: '0.5rem' },
  { id: 'lg', label: 'Large (12px)', value: '0.75rem' },
  { id: 'xl', label: 'X-Large (16px)', value: '1rem' },
]

export const RADIUS_VALUES: Record<RadiusPreset, string> = {
  none: '0px',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
}

export function resolveRadius(radius: RadiusPreset | string | undefined): string {
  if (!radius) return RADIUS_VALUES.md
  if (radius in RADIUS_VALUES) return RADIUS_VALUES[radius as RadiusPreset]
  return radius
}

export type DensityPreset = 'compact' | 'normal' | 'spacious'

export const DENSITY_VALUES: Record<DensityPreset, number> = {
  compact: 0.85,
  normal: 1,
  spacious: 1.15,
}

export type ShadowPreset = 'none' | 'subtle' | 'soft' | 'strong'

export const SHADOW_PRESETS: { id: ShadowPreset; label: string; description: string }[] = [
  { id: 'none', label: 'None (0px)', description: 'Zero box shadows across UI (Default)' },
  { id: 'subtle', label: 'Subtle (xs)', description: 'Ultra-crisp minimal micro-shadows' },
  { id: 'soft', label: 'Soft', description: 'Layered ambient depth' },
  { id: 'strong', label: 'Elevated', description: 'High-contrast floating elevation' },
]

const fg = (alpha: number) => `color-mix(in oklab, var(--fg) ${alpha}%, transparent)`

export const SHADOW_VALUES: Record<
  ShadowPreset,
  Record<'shadow-2xs' | 'shadow-xs' | 'shadow-sm' | 'shadow-md' | 'shadow-lg' | 'shadow-xl' | 'shadow-2xl', string>
> = {
  none: {
    'shadow-2xs': 'none',
    'shadow-xs': 'none',
    'shadow-sm': 'none',
    'shadow-md': 'none',
    'shadow-lg': 'none',
    'shadow-xl': 'none',
    'shadow-2xl': 'none',
  },
  subtle: {
    'shadow-2xs': `0 1px ${fg(8)}`,
    'shadow-xs': `0 1px 2px 0 ${fg(10)}`,
    'shadow-sm': `0 1px 3px 0 ${fg(12)}, 0 1px 2px -1px ${fg(8)}`,
    'shadow-md': `0 3px 6px -1px ${fg(14)}, 0 2px 4px -2px ${fg(8)}`,
    'shadow-lg': `0 6px 12px -2px ${fg(16)}, 0 3px 6px -3px ${fg(10)}`,
    'shadow-xl': `0 12px 20px -4px ${fg(18)}, 0 4px 8px -4px ${fg(10)}`,
    'shadow-2xl': `0 18px 32px -8px ${fg(22)}`,
  },
  soft: {
    'shadow-2xs': `0 1px ${fg(12)}`,
    'shadow-xs': `0 1px 2px 0 ${fg(12)}`,
    'shadow-sm': `0 1px 3px 0 ${fg(16)}, 0 1px 2px -1px ${fg(12)}`,
    'shadow-md': `0 4px 6px -1px ${fg(16)}, 0 2px 4px -2px ${fg(12)}`,
    'shadow-lg': `0 10px 15px -3px ${fg(18)}, 0 4px 6px -4px ${fg(12)}`,
    'shadow-xl': `0 20px 25px -5px ${fg(18)}, 0 8px 10px -6px ${fg(12)}`,
    'shadow-2xl': `0 25px 50px -12px ${fg(28)}`,
  },
  strong: {
    'shadow-2xs': `0 1px 2px ${fg(16)}`,
    'shadow-xs': `0 1px 3px 0 ${fg(20)}`,
    'shadow-sm': `0 2px 5px 0 ${fg(24)}, 0 1px 3px -1px ${fg(16)}`,
    'shadow-md': `0 6px 12px -2px ${fg(26)}, 0 3px 6px -2px ${fg(16)}`,
    'shadow-lg': `0 14px 24px -4px ${fg(28)}, 0 6px 10px -4px ${fg(18)}`,
    'shadow-xl': `0 24px 38px -6px ${fg(30)}, 0 10px 16px -6px ${fg(20)}`,
    'shadow-2xl': `0 32px 64px -14px ${fg(36)}`,
  },
}

/** Stroke / border-width knob. Maps to `--border-width`. */
export type StrokePreset = 'flat' | 'standard' | 'bold'

export const STROKE_VALUES: Record<StrokePreset, string> = {
  flat: '0px',
  standard: '1px',
  bold: '2px',
}

/**
 * Base font size knob. Controls root typography scaling and proportional rem calculations.
 */
export type FontSizePreset = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export const FONT_SIZE_PRESETS: {
  id: FontSizePreset
  label: string
  value: string
  px: string
  description: string
}[] = [
  { id: 'xs', label: 'Extra Small', value: '0.8125rem', px: '13px', description: 'Compact & data-dense layouts' },
  { id: 'sm', label: 'Small', value: '0.875rem', px: '14px', description: 'Dense UI & analytical dashboards' },
  { id: 'md', label: 'Medium', value: '1rem', px: '16px', description: 'Default balanced application scale' },
  { id: 'lg', label: 'Large', value: '1.125rem', px: '18px', description: 'Comfortable reading & spacious UI' },
  { id: 'xl', label: 'Extra Large', value: '1.25rem', px: '20px', description: 'High-legibility & presentation scale' },
]

export const FONT_SIZE_VALUES: Record<FontSizePreset, string> = {
  xs: '0.8125rem',
  sm: '0.875rem',
  md: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
}

export const FONT_SIZE_FACTORS: Record<FontSizePreset, number> = {
  xs: 0.8125,
  sm: 0.875,
  md: 1,
  lg: 1.125,
  xl: 1.25,
}

export function resolveFontSize(size: FontSizePreset | string | undefined): string {
  if (!size) return FONT_SIZE_VALUES.md
  if (size in FONT_SIZE_VALUES) return FONT_SIZE_VALUES[size as FontSizePreset]
  return size
}

export function resolveFontSizeFactor(size: FontSizePreset | string | undefined): number {
  if (!size) return 1
  if (size in FONT_SIZE_FACTORS) return FONT_SIZE_FACTORS[size as FontSizePreset]
  const parsed = parseFloat(String(size))
  if (Number.isFinite(parsed)) {
    if (String(size).endsWith('px')) return parsed / 16
    return parsed
  }
  return 1
}

export interface ThemePreset {
  id: string
  label: string
  description?: string
  /** Swatch colors shown in the picker (usually primary / bg / accent). */
  preview?: string[]
  /** Tokens shared across both light and dark modes (radius, density, shadow, stroke, fonts, spacing, or any custom variable). */
  tokens?: TokenMap
  /** Mode-specific overrides (primarily colors and surface tints) */
  light: ThemeTokens
  dark: ThemeTokens
  /** Metadata for external tooling or categories */
  meta?: Record<string, unknown>
}

export interface FontPreset {
  name: string
  label: string
  category?: 'sans' | 'mono' | 'serif' | 'display'
  description?: string
  src?: string
}

export interface ThemeExtension {
  name: string
  presets?: ThemePreset[]
  tokens?: TokenMap
  light?: TokenMap
  dark?: TokenMap
  descriptors?: TokenDescriptor[]
  fonts?: FontPreset[]
}

/** Token keys the picker exposes for live editing. */
export const EDITABLE_COLOR_TOKENS = [
  { key: 'bg', label: 'Background' },
  { key: 'fg', label: 'Foreground' },
  { key: 'primary', label: 'Primary' },
  { key: 'primary-fg', label: 'On primary' },
  { key: 'primary-subtle', label: 'Primary subtle' },
  { key: 'primary-subtle-fg', label: 'On primary subtle' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'secondary-fg', label: 'On secondary' },
  { key: 'overlay', label: 'Overlay' },
  { key: 'overlay-fg', label: 'On overlay' },
  { key: 'accent', label: 'Accent' },
  { key: 'accent-fg', label: 'On accent' },
  { key: 'muted', label: 'Muted' },
  { key: 'muted-fg', label: 'Muted text' },
  { key: 'border', label: 'Border' },
  { key: 'input', label: 'Input' },
  { key: 'ring', label: 'Ring' },
  { key: 'success', label: 'Success' },
  { key: 'success-fg', label: 'On success' },
  { key: 'warning', label: 'Warning' },
  { key: 'warning-fg', label: 'On warning' },
  { key: 'danger', label: 'Danger' },
  { key: 'danger-fg', label: 'On danger' },
] as const

export type EditableColorToken = (typeof EDITABLE_COLOR_TOKENS)[number]['key']

/** Core descriptors for automatic ThemeEditor discovery and grouping */
export const CORE_TOKEN_DESCRIPTORS: TokenDescriptor[] = [
  { key: 'radius', label: 'Curvature Radius', category: 'Geometry', control: 'dimension' },
  { key: 'density-factor', label: 'Optical Density', category: 'Geometry', control: 'number' },
  { key: 'border-width', label: 'Border Stroke Width', category: 'Geometry', control: 'dimension' },
  { key: 'font-size-base', label: 'Base Font Size', category: 'Typography', control: 'dimension' },
  { key: 'font-sans', label: 'Sans Font Family', category: 'Typography', control: 'font' },
  { key: 'font-mono', label: 'Mono Font Family', category: 'Typography', control: 'font' },
  ...EDITABLE_COLOR_TOKENS.map((tok) => ({
    key: tok.key,
    label: tok.label,
    category: 'Colors',
    control: 'color' as const,
  })),
]

/** Baseline core presets matching interface default themes. Empty light/dark = CSS defaults from styles.css. */
export const DEFAULT_THEME_PRESETS: ThemePreset[] = [
  {
    id: 'mono',
    label: 'Default Soft',
    description: 'Calm linen & deep graphite defaults from styles.css',
    preview: ['#24262d', '#fbfbfa', '#e8e8e6'],
    light: {
      bg: 'oklch(0.982 0.004 85)',
      fg: 'oklch(0.25 0.008 260)',
      primary: 'oklch(0.27 0.008 260)',
      'primary-fg': 'oklch(0.985 0.003 85)',
      'primary-subtle': 'oklch(0.27 0.008 260 / 0.07)',
      'primary-subtle-fg': 'oklch(0.29 0.008 260)',
      secondary: 'oklch(0.938 0.006 85)',
      'secondary-fg': 'oklch(0.27 0.008 260)',
      overlay: 'oklch(0.998 0.002 85)',
      'overlay-fg': 'oklch(0.25 0.008 260)',
      accent: 'oklch(0.932 0.006 85)',
      'accent-fg': 'oklch(0.25 0.008 260)',
      muted: 'oklch(0.942 0.006 85)',
      'muted-fg': 'oklch(0.50 0.010 260)',
      border: 'oklch(0.895 0.006 85)',
      input: 'oklch(0.87 0.006 85)',
      ring: 'oklch(0.27 0.008 260)',
    },
    dark: {
      bg: 'oklch(0.14 0.008 260)',
      fg: 'oklch(0.90 0.006 90)',
      primary: 'oklch(0.92 0.006 90)',
      'primary-fg': 'oklch(0.14 0.008 260)',
      'primary-subtle': 'oklch(0.90 0.006 90 / 0.08)',
      'primary-subtle-fg': 'oklch(0.86 0.006 90)',
      secondary: 'oklch(0.21 0.008 260)',
      'secondary-fg': 'oklch(0.90 0.006 90)',
      overlay: 'oklch(0.23 0.009 260)',
      'overlay-fg': 'oklch(0.90 0.006 90)',
      accent: 'oklch(0.24 0.009 260)',
      'accent-fg': 'oklch(0.90 0.006 90)',
      muted: 'oklch(0.18 0.008 260)',
      'muted-fg': 'oklch(0.60 0.008 260)',
      border: 'oklch(0.26 0.008 260)',
      input: 'oklch(0.29 0.008 260)',
      ring: 'oklch(0.90 0.006 90)',
    },
    tokens: {
      radius: 'md',
      shadow: 'subtle',
      density: 'normal',
    },
  },
]

export const THEME_PRESETS = DEFAULT_THEME_PRESETS

/** Accent suggestions for the color swatch strip. */
export const ACCENT_SWATCHES = [
  '#24262d',
  '#2563eb',
  '#0d9488',
  '#16a34a',
  '#15803d',
  '#c2410c',
  '#7c3aed',
  '#4f46e5',
  '#be123c',
  '#0e7490',
  '#b45309',
  '#06b6d4',
  '#ec4899',
  '#f59e0b',
] as const

export function loadGoogleFont(fontName: string, customUrl?: string) {
  if (typeof document === 'undefined') return
  const elementId = `consona-font-${fontName.toLowerCase().replace(/\s+/g, '-')}`
  if (!document.getElementById(elementId)) {
    const link = document.createElement('link')
    link.id = elementId
    link.rel = 'stylesheet'
    link.href =
      customUrl ||
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@300;400;500;600;700;800&display=swap`
    document.head.appendChild(link)
  }
}

export function injectDefaultThemeFonts() {
  if (typeof document === 'undefined') return
  const id = 'consona-default-fonts'
  if (!document.getElementById(id)) {
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Geist+Mono:wght@300;400;500;600;700&display=swap'
    document.head.appendChild(link)
  }
}
