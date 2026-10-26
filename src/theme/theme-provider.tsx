import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  DEFAULT_THEME_PRESETS,
  EDITABLE_COLOR_TOKENS,
  RADIUS_VALUES,
  SHADOW_VALUES,
  DENSITY_VALUES,
  STROKE_VALUES,
  FONT_SIZE_VALUES,
  CORE_TOKEN_DESCRIPTORS,
  resolveFontSizeFactor,
  loadGoogleFont,
  type RadiusPreset,
  type ShadowPreset,
  type DensityPreset,
  type StrokePreset,
  type FontSizePreset,
  type ThemePreset,
  type ThemeTokens,
  type TokenMap,
  type TokenDescriptor,
  type ThemeExtension,
} from './tokens'

export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeConfig {
  /** Mode: 'light', 'dark', or 'system' (default: 'system'). */
  defaultTheme?: ThemeMode
  /** Initial preset ID (default: 'mono'). */
  preset?: string
  /** Initial corner curvature preset or CSS value (default: 'md'). */
  radius?: RadiusPreset | string
  /** Initial shadow elevation preset (default: 'subtle'). */
  shadow?: ShadowPreset | string
  /** Initial optical density preset or factor (default: 'normal'). */
  density?: DensityPreset | number
  /** Initial stroke border-width preset (default: 'standard'). */
  stroke?: StrokePreset | string
  /** Initial base font size preset or value (default: 'md'). */
  fontSize?: FontSizePreset | string
  /** Initial sans font family (default: 'Inter'). */
  fontFamily?: string
  /** Initial mono font family (default: 'Geist Mono'). */
  fontFamilyMono?: string
  /** Optional theme extenders injecting custom presets, tokens, and font catalogs. */
  extenders?: ThemeExtension[]
  /** Optional ad-hoc theme presets. */
  presets?: ThemePreset[]
  /** Optional token descriptors for dynamic editor discovery. */
  descriptors?: TokenDescriptor[]
  /** Direct token overrides applied on root. */
  tokens?: TokenMap | Partial<ThemeTokens>
  /** Custom storage key for localStorage persistence (default: 'consona-theme'). */
  storageKey?: string
}

export interface ThemeContextValue {
  /* --- Unified Mode Management --- */
  mode: ThemeMode
  resolvedMode: 'light' | 'dark'
  setMode: (mode: ThemeMode) => void

  /* --- Unified Preset Registry --- */
  presetId: string
  setPresetId: (id: string) => void
  presets: ThemePreset[]
  activePreset: ThemePreset
  registerPreset: (preset: ThemePreset) => void
  unregisterPreset: (id: string) => void

  /* --- Universal Token Engine (Pure Token-Driven Persistence & Granularity) --- */
  tokens: TokenMap
  getToken: (key: string) => string | number | undefined
  setToken: (key: string, value: string | number) => void
  setTokens: (tokens: TokenMap) => void
  removeToken: (key: string) => void
  resetTokens: () => void

  /* --- Token Descriptors (Tooling & Editor Discovery) --- */
  descriptors: TokenDescriptor[]
  registerDescriptors: (descriptors: TokenDescriptor[]) => void

  /* --- Global Reset --- */
  resetTheme: () => void

  /* --- Optical Token Convenience Helpers (Direct Token Projections) --- */
  radius: RadiusPreset | string
  setRadius: (radius: RadiusPreset | string) => void
  shadow: ShadowPreset | string
  setShadow: (shadow: ShadowPreset | string) => void
  density: DensityPreset | number
  setDensity: (density: DensityPreset | number) => void
  stroke: StrokePreset | string
  setStroke: (stroke: StrokePreset | string) => void
  fontSize: FontSizePreset | string
  setFontSize: (size: FontSizePreset | string) => void
  fontFamily: string
  setFontFamily: (font: string) => void
  fontFamilyMono: string
  setFontFamilyMono: (font: string) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

export const useThemeOptional = () => useContext(ThemeContext)

function readStored(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStored(key: string, value: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, value)
  } catch {
    // ignore quota / private mode
  }
}

function removeStored(key: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export function ThemeProvider({
  defaultTheme = 'system',
  preset = 'mono',
  radius: defaultRadius = 'md',
  shadow: defaultShadow = 'subtle',
  density: defaultDensity = 'normal',
  stroke: defaultStroke = 'standard',
  fontSize: defaultFontSize = 'md',
  fontFamily: defaultFontFamily = 'Inter',
  fontFamilyMono: defaultFontFamilyMono = 'Geist Mono',
  extenders = [],
  presets: propPresets = [],
  descriptors: propDescriptors = [],
  tokens: tokenOverrides,
  storageKey = 'consona-theme',
  children,
}: ThemeConfig & { children: ReactNode }) {
  // 1. Mode state with synchronous initial resolution
  const [mode, setModeState] = useState<ThemeMode>(
    () => (readStored(`${storageKey}-mode`) as ThemeMode) ?? defaultTheme
  )
  const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>(() => {
    const initialMode = (readStored(`${storageKey}-mode`) as ThemeMode) ?? defaultTheme
    if (initialMode === 'system') {
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return 'light'
    }
    return initialMode === 'dark' ? 'dark' : 'light'
  })

  // Dynamic presets registered at runtime
  const [dynamicPresets, setDynamicPresets] = useState<ThemePreset[]>([])

  // Dynamic descriptors registered at runtime
  const [dynamicDescriptors, setDynamicDescriptors] = useState<TokenDescriptor[]>([])

  // Merged presets collection
  const allPresets = useMemo<ThemePreset[]>(() => {
    const list: ThemePreset[] = [...DEFAULT_THEME_PRESETS]

    for (const ext of extenders) {
      if (ext.presets) {
        for (const p of ext.presets) {
          const idx = list.findIndex((item) => item.id === p.id)
          if (idx >= 0) list[idx] = p
          else list.push(p)
        }
      }
    }

    for (const p of propPresets) {
      const idx = list.findIndex((item) => item.id === p.id)
      if (idx >= 0) list[idx] = p
      else list.push(p)
    }

    for (const p of dynamicPresets) {
      const idx = list.findIndex((item) => item.id === p.id)
      if (idx >= 0) list[idx] = p
      else list.push(p)
    }

    return list
  }, [extenders, propPresets, dynamicPresets])

  // Merged descriptors collection
  const allDescriptors = useMemo<TokenDescriptor[]>(() => {
    const map = new Map<string, TokenDescriptor>()
    CORE_TOKEN_DESCRIPTORS.forEach((d) => map.set(d.key, d))

    for (const ext of extenders) {
      if (ext.descriptors) {
        ext.descriptors.forEach((d) => map.set(d.key, d))
      }
    }

    propDescriptors.forEach((d) => map.set(d.key, d))
    dynamicDescriptors.forEach((d) => map.set(d.key, d))

    return Array.from(map.values())
  }, [extenders, propDescriptors, dynamicDescriptors])

  // 2. Active Preset ID
  const [presetId, setPresetIdState] = useState<string>(
    () => readStored(`${storageKey}-preset`) ?? preset
  )

  const activePreset = useMemo(() => {
    return allPresets.find((p) => p.id === presetId) ?? allPresets[0] ?? DEFAULT_THEME_PRESETS[0]!
  }, [allPresets, presetId])

  // 3. Universal Token Store (all custom token values, geometric overrides, color tweaks, and font selections)
  const [tokens, setTokensState] = useState<TokenMap>(() => {
    const stored = readStored(`${storageKey}-tokens`)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        // ignore
      }
    }
    const legacyCustom = readStored(`${storageKey}-custom-tokens`)
    if (legacyCustom) {
      try {
        return JSON.parse(legacyCustom)
      } catch {
        // ignore
      }
    }
    return {}
  })

  // System theme listener
  useEffect(() => {
    const updateResolved = () => {
      if (mode === 'system') {
        const isDark =
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches
        setResolvedMode(isDark ? 'dark' : 'light')
      } else {
        setResolvedMode(mode)
      }
    }

    updateResolved()
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', updateResolved)
    return () => mq.removeEventListener('change', updateResolved)
  }, [mode])

  // Mode and Preset ID persistence
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode)
    writeStored(`${storageKey}-mode`, newMode)
  }, [storageKey])

  const setPresetId = useCallback((newId: string) => {
    setPresetIdState(newId)
    writeStored(`${storageKey}-preset`, newId)

    // Override custom tokens for all tokens provided by the selected preset
    const target = allPresets.find((p) => p.id === newId)
    if (target) {
      const presetKeys = new Set<string>()

      // Preset light & dark color palette keys
      if (target.light) Object.keys(target.light).forEach((k) => presetKeys.add(k))
      if (target.dark) Object.keys(target.dark).forEach((k) => presetKeys.add(k))

      // If the preset defines color palettes, also include standard editable color keys to ensure the preset palette cleanly takes over
      if (target.light || target.dark) {
        EDITABLE_COLOR_TOKENS.forEach((t) => presetKeys.add(t.key))
      }

      // Preset geometry & typography tokens
      if (target.tokens) {
        Object.keys(target.tokens).forEach((k) => {
          presetKeys.add(k)
          if (k === 'radius') presetKeys.add('radius')
          if (k === 'shadow') presetKeys.add('shadow')
          if (k === 'density') {
            presetKeys.add('density')
            presetKeys.add('density-factor')
          }
          if (k === 'stroke') {
            presetKeys.add('stroke')
            presetKeys.add('border-width')
          }
          if (k === 'fontSize') {
            presetKeys.add('font-size')
            presetKeys.add('font-size-base')
          }
          if (k === 'fontFamily') {
            presetKeys.add('fontFamily')
            presetKeys.add('font-sans')
          }
          if (k === 'fontFamilyMono') {
            presetKeys.add('fontFamilyMono')
            presetKeys.add('font-mono')
          }
        })
      }

      setTokensState((prev) => {
        let changed = false
        const next = { ...prev }
        for (const key of presetKeys) {
          if (key in next) {
            delete next[key]
            changed = true
          }
        }
        if (changed) {
          writeStored(`${storageKey}-tokens`, JSON.stringify(next))
          return next
        }
        return prev
      })
    }
  }, [allPresets, storageKey])

  // Universal Token API
  const setToken = useCallback((key: string, value: string | number) => {
    setTokensState((prev) => {
      const next = { ...prev, [key]: value }
      writeStored(`${storageKey}-tokens`, JSON.stringify(next))
      return next
    })
  }, [storageKey])

  const setTokens = useCallback((newTokens: TokenMap) => {
    setTokensState((prev) => {
      const next = { ...prev, ...newTokens }
      writeStored(`${storageKey}-tokens`, JSON.stringify(next))
      return next
    })
  }, [storageKey])

  const removeToken = useCallback((key: string) => {
    setTokensState((prev) => {
      const next = { ...prev }
      delete next[key]
      writeStored(`${storageKey}-tokens`, JSON.stringify(next))
      return next
    })
  }, [storageKey])

  const resetTokens = useCallback(() => {
    setTokensState({})
    removeStored(`${storageKey}-tokens`)
    removeStored(`${storageKey}-custom-tokens`)
  }, [storageKey])

  const getToken = useCallback((key: string) => {
    return tokens[key]
  }, [tokens])

  // Optical helpers mapped directly onto tokens
  const currentRadius = (tokens['radius'] as RadiusPreset | string) ?? activePreset.tokens?.radius ?? defaultRadius
  const currentShadow = (tokens['shadow'] as ShadowPreset | string) ?? activePreset.tokens?.shadow ?? defaultShadow
  const currentDensity = (tokens['density'] as DensityPreset | number) ?? (tokens['density-factor'] as number) ?? activePreset.tokens?.density ?? defaultDensity
  const currentStroke = (tokens['stroke'] as StrokePreset | string) ?? (tokens['border-width'] as string) ?? activePreset.tokens?.stroke ?? defaultStroke
  const currentFontSize = (tokens['font-size'] as FontSizePreset | string) ?? (tokens['font-size-base'] as string) ?? activePreset.tokens?.fontSize ?? defaultFontSize
  const currentFontFamily = (tokens['font-sans'] as string) ?? (tokens['fontFamily'] as string) ?? defaultFontFamily
  const currentFontFamilyMono = (tokens['font-mono'] as string) ?? (tokens['fontFamilyMono'] as string) ?? defaultFontFamilyMono

  const setRadius = useCallback((r: RadiusPreset | string) => {
    setToken('radius', r)
  }, [setToken])

  const setShadow = useCallback((s: ShadowPreset | string) => {
    setToken('shadow', s)
  }, [setToken])

  const setDensity = useCallback((d: DensityPreset | number) => {
    setToken('density', d)
  }, [setToken])

  const setStroke = useCallback((st: StrokePreset | string) => {
    setToken('stroke', st)
  }, [setToken])

  const setFontSize = useCallback((sz: FontSizePreset | string) => {
    setToken('font-size', sz)
  }, [setToken])

  const setFontFamily = useCallback((font: string) => {
    setToken('font-sans', font)
    loadGoogleFont(font)
  }, [setToken])

  const setFontFamilyMono = useCallback((font: string) => {
    setToken('font-mono', font)
    loadGoogleFont(font)
  }, [setToken])

  // Dynamic preset registration
  const registerPreset = useCallback((newPreset: ThemePreset) => {
    setDynamicPresets((prev) => {
      const filtered = prev.filter((p) => p.id !== newPreset.id)
      return [...filtered, newPreset]
    })
  }, [])

  const unregisterPreset = useCallback((id: string) => {
    setDynamicPresets((prev) => prev.filter((p) => p.id !== id))
  }, [])

  // Dynamic descriptor registration
  const registerDescriptors = useCallback((newDescriptors: TokenDescriptor[]) => {
    setDynamicDescriptors((prev) => {
      const map = new Map<string, TokenDescriptor>()
      prev.forEach((d) => map.set(d.key, d))
      newDescriptors.forEach((d) => map.set(d.key, d))
      return Array.from(map.values())
    })
  }, [])

  const resetTheme = useCallback(() => {
    setMode(defaultTheme)
    setPresetId(preset)
    resetTokens()
  }, [defaultTheme, preset, setMode, setPresetId, resetTokens])

  // Auto-load custom fonts
  useEffect(() => {
    if (currentFontFamily) loadGoogleFont(currentFontFamily)
    if (currentFontFamilyMono) loadGoogleFont(currentFontFamilyMono)
  }, [currentFontFamily, currentFontFamilyMono])

  // DOM CSS Variables Injection Layer (100% Token-Driven Live Engine)
  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement

    // 1. Dark class toggle
    if (resolvedMode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // 2. Extenders base tokens & mode palette
    for (const ext of extenders) {
      if (ext.tokens) {
        Object.entries(ext.tokens).forEach(([k, v]) => {
          if (v != null) root.style.setProperty(`--${k}`, String(v))
        })
      }
      const extPalette = resolvedMode === 'dark' ? ext.dark : ext.light
      if (extPalette) {
        Object.entries(extPalette).forEach(([k, v]) => {
          if (v != null) root.style.setProperty(`--${k}`, String(v))
        })
      }
    }

    // 3. Active Preset base tokens & mode palette
    if (activePreset.tokens) {
      Object.entries(activePreset.tokens).forEach(([k, v]) => {
        if (v != null) root.style.setProperty(`--${k}`, String(v))
      })
    }

    const palette = resolvedMode === 'dark' ? activePreset.dark : activePreset.light
    if (palette) {
      Object.entries(palette).forEach(([k, v]) => {
        if (v != null) root.style.setProperty(`--${k}`, String(v))
      })
    }

    // 4. Config direct token overrides
    if (tokenOverrides) {
      Object.entries(tokenOverrides).forEach(([k, v]) => {
        if (v != null) root.style.setProperty(`--${k}`, String(v))
      })
    }

    // 5. Universal Persisted Tokens (highest priority user customization)
    Object.entries(tokens).forEach(([k, v]) => {
      if (v != null) {
        const propName = k.startsWith('--') ? k : `--${k}`
        root.style.setProperty(propName, String(v))
      }
    })

    // 6. Geometric ramps & optical scaling calculations
    const radValue = (RADIUS_VALUES as any)[currentRadius] ?? currentRadius
    root.style.setProperty('--radius', String(radValue))

    const densityNum =
      typeof currentDensity === 'number'
        ? currentDensity
        : (DENSITY_VALUES as any)[currentDensity] ?? 1
    root.style.setProperty('--density-factor', String(densityNum))
    root.style.setProperty('--density', String(densityNum))

    const strokeValue = (STROKE_VALUES as any)[currentStroke] ?? currentStroke
    root.style.setProperty('--border-width', String(strokeValue))

    const fontSizeValue = (FONT_SIZE_VALUES as any)[currentFontSize] ?? currentFontSize
    const fontFactor = resolveFontSizeFactor(currentFontSize)
    root.style.setProperty('--font-size-base', String(fontSizeValue))
    root.style.setProperty('--font-size-factor', String(fontFactor))
    root.style.fontSize = ''
    root.setAttribute('data-font-size', String(currentFontSize))

    const shadowMap = (SHADOW_VALUES as any)[currentShadow] ?? SHADOW_VALUES.subtle
    Object.entries(shadowMap).forEach(([k, v]) => {
      root.style.setProperty(`--${k}`, String(v))
    })

    if (currentFontFamily) {
      root.style.setProperty('--font-sans', `'${currentFontFamily}', sans-serif`)
    }
    if (currentFontFamilyMono) {
      root.style.setProperty('--font-mono', `'${currentFontFamilyMono}', monospace`)
    }
  }, [
    resolvedMode,
    activePreset,
    tokens,
    currentRadius,
    currentShadow,
    currentDensity,
    currentStroke,
    currentFontSize,
    currentFontFamily,
    currentFontFamilyMono,
    extenders,
    tokenOverrides,
  ])

  // Context value assembly
  const contextValue = useMemo<ThemeContextValue>(() => ({
    mode,
    resolvedMode,
    setMode,
    presetId,
    setPresetId,
    activePreset,
    presets: allPresets,
    registerPreset,
    unregisterPreset,
    tokens,
    getToken,
    setToken,
    setTokens,
    removeToken,
    resetTokens,
    descriptors: allDescriptors,
    registerDescriptors,
    resetTheme,
    radius: currentRadius,
    setRadius,
    shadow: currentShadow,
    setShadow,
    density: currentDensity,
    setDensity,
    stroke: currentStroke,
    setStroke,
    fontSize: currentFontSize,
    setFontSize,
    fontFamily: currentFontFamily,
    setFontFamily,
    fontFamilyMono: currentFontFamilyMono,
    setFontFamilyMono,
  }), [
    mode,
    resolvedMode,
    setMode,
    presetId,
    setPresetId,
    activePreset,
    allPresets,
    registerPreset,
    unregisterPreset,
    tokens,
    getToken,
    setToken,
    setTokens,
    removeToken,
    resetTokens,
    allDescriptors,
    registerDescriptors,
    resetTheme,
    currentRadius,
    setRadius,
    currentShadow,
    setShadow,
    currentDensity,
    setDensity,
    currentStroke,
    setStroke,
    currentFontSize,
    setFontSize,
    currentFontFamily,
    setFontFamily,
    currentFontFamilyMono,
    setFontFamilyMono,
  ])

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}
