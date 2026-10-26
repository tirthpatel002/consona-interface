import React, { createContext, useContext, useState, useEffect } from 'react'
import { parseColor, type Color } from '@react-stately/color'

/* ==========================================================================
   Color Spaces & Conversions
   ========================================================================== */

export type ColorFormat = 'hex' | 'rgb' | 'css' | 'hsl' | 'hsb'

export interface RgbaColor {
  r: number
  g: number
  b: number
  a: number
}

export interface HslaColor {
  h: number
  s: number
  l: number
  a: number
}

export interface HsbaColor {
  h: number
  s: number
  b: number
  a: number
}

/**
 * Clamp a number between min and max
 */
export function clampColorValue(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max)
}

/**
 * Convert RGB (0-255) to HEX string (#RRGGBB or #RRGGBBAA)
 */
export function rgbToHex(r: number, g: number, b: number, a = 1): string {
  const clampR = Math.round(clampColorValue(r, 0, 255))
  const clampG = Math.round(clampColorValue(g, 0, 255))
  const clampB = Math.round(clampColorValue(b, 0, 255))
  const clampA = clampColorValue(a, 0, 1)

  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  const baseHex = `#${toHex(clampR)}${toHex(clampG)}${toHex(clampB)}`

  if (clampA < 1) {
    const alphaHex = Math.round(clampA * 255).toString(16).padStart(2, '0')
    return `${baseHex}${alphaHex}`
  }
  return baseHex
}

/**
 * Parse HEX string to RGBA object
 */
export function hexToRgba(hex: string): RgbaColor {
  let clean = hex.trim().replace(/^#/, '')
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('')
  } else if (clean.length === 4) {
    clean = clean.split('').map((c) => c + c).join('')
  }

  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16) || 0
    const g = parseInt(clean.slice(2, 4), 16) || 0
    const b = parseInt(clean.slice(4, 6), 16) || 0
    return { r, g, b, a: 1 }
  } else if (clean.length === 8) {
    const r = parseInt(clean.slice(0, 2), 16) || 0
    const g = parseInt(clean.slice(2, 4), 16) || 0
    const b = parseInt(clean.slice(4, 6), 16) || 0
    const a = (parseInt(clean.slice(6, 8), 16) || 255) / 255
    return { r, g, b, a: Math.round(a * 100) / 100 }
  }
  return { r: 0, g: 0, b: 0, a: 1 }
}

/**
 * Convert RGBA to HSLA
 */
export function rgbaToHsla(r: number, g: number, b: number, a = 1): HslaColor {
  const normR = clampColorValue(r, 0, 255) / 255
  const normG = clampColorValue(g, 0, 255) / 255
  const normB = clampColorValue(b, 0, 255) / 255

  const max = Math.max(normR, normG, normB)
  const min = Math.min(normR, normG, normB)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case normR:
        h = (normG - normB) / d + (normG < normB ? 6 : 0)
        break
      case normG:
        h = (normB - normR) / d + 2
        break
      case normB:
        h = (normR - normG) / d + 4
        break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
    a: clampColorValue(a, 0, 1),
  }
}

/**
 * Convert HSLA to RGBA
 */
export function hslaToRgba(h: number, s: number, l: number, a = 1): RgbaColor {
  const normH = (h % 360) / 360
  const normS = clampColorValue(s, 0, 100) / 100
  const normL = clampColorValue(l, 0, 100) / 100

  if (normS === 0) {
    const val = Math.round(normL * 255)
    return { r: val, g: val, b: val, a: clampColorValue(a, 0, 1) }
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let normT = t
    if (normT < 0) normT += 1
    if (normT > 1) normT -= 1
    if (normT < 1 / 6) return p + (q - p) * 6 * normT
    if (normT < 1 / 2) return q
    if (normT < 2 / 3) return p + (q - p) * (2 / 3 - normT) * 6
    return p
  }

  const q = normL < 0.5 ? normL * (1 + normS) : normL + normS - normL * normS
  const p = 2 * normL - q

  const r = hue2rgb(p, q, normH + 1 / 3)
  const g = hue2rgb(p, q, normH)
  const b = hue2rgb(p, q, normH - 1 / 3)

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    a: clampColorValue(a, 0, 1),
  }
}

/**
 * Convert RGBA to HSBA / HSV
 */
export function rgbaToHsba(r: number, g: number, b: number, a = 1): HsbaColor {
  const normR = clampColorValue(r, 0, 255) / 255
  const normG = clampColorValue(g, 0, 255) / 255
  const normB = clampColorValue(b, 0, 255) / 255

  const max = Math.max(normR, normG, normB)
  const min = Math.min(normR, normG, normB)
  const d = max - min

  let h = 0
  const s = max === 0 ? 0 : d / max
  const v = max

  if (max !== min) {
    switch (max) {
      case normR:
        h = (normG - normB) / d + (normG < normB ? 6 : 0)
        break
      case normG:
        h = (normB - normR) / d + 2
        break
      case normB:
        h = (normR - normG) / d + 4
        break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    b: Math.round(v * 100),
    a: clampColorValue(a, 0, 1),
  }
}

/**
 * Convert HSBA / HSV to RGBA
 */
export function hsbaToRgba(h: number, s: number, b: number, a = 1): RgbaColor {
  const normH = ((h % 360) + 360) % 360
  const normS = clampColorValue(s, 0, 100) / 100
  const normV = clampColorValue(b, 0, 100) / 100

  const c = normV * normS
  const x = c * (1 - Math.abs(((normH / 60) % 2) - 1))
  const m = normV - c

  let rPrime = 0
  let gPrime = 0
  let bPrime = 0

  if (normH >= 0 && normH < 60) {
    rPrime = c
    gPrime = x
    bPrime = 0
  } else if (normH >= 60 && normH < 120) {
    rPrime = x
    gPrime = c
    bPrime = 0
  } else if (normH >= 120 && normH < 180) {
    rPrime = 0
    gPrime = c
    bPrime = x
  } else if (normH >= 180 && normH < 240) {
    rPrime = 0
    gPrime = x
    bPrime = c
  } else if (normH >= 240 && normH < 300) {
    rPrime = x
    gPrime = 0
    bPrime = c
  } else {
    rPrime = c
    gPrime = 0
    bPrime = x
  }

  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255),
    a: clampColorValue(a, 0, 1),
  }
}

/**
 * Extract RGBA from any Color object or string
 */
export function extractRgba(color: Color | string | null | undefined): RgbaColor {
  if (!color) return { r: 59, g: 130, b: 246, a: 1 }
  try {
    if (typeof color === 'string') {
      if (color.startsWith('#')) {
        return hexToRgba(color)
      }
      const parsed = parseColor(color)
      const rgbColor = parsed.toFormat('rgb')
      return {
        r: Math.round(rgbColor.getChannelValue('red')),
        g: Math.round(rgbColor.getChannelValue('green')),
        b: Math.round(rgbColor.getChannelValue('blue')),
        a: Math.round(rgbColor.getChannelValue('alpha') * 100) / 100,
      }
    }
    const rgbColor = color.toFormat('rgb')
    return {
      r: Math.round(rgbColor.getChannelValue('red')),
      g: Math.round(rgbColor.getChannelValue('green')),
      b: Math.round(rgbColor.getChannelValue('blue')),
      a: Math.round(rgbColor.getChannelValue('alpha') * 100) / 100,
    }
  } catch {
    return { r: 59, g: 130, b: 246, a: 1 }
  }
}

/**
 * Format color into specified CSS representation
 */
export function formatColorString(rgba: RgbaColor, format: ColorFormat): string {
  const { r, g, b, a } = rgba
  const alphaClean = Math.round(a * 100) / 100
  switch (format) {
    case 'hex':
      return rgbToHex(r, g, b, a)
    case 'rgb':
      return a < 1 ? `rgba(${r}, ${g}, ${b}, ${alphaClean})` : `rgb(${r}, ${g}, ${b})`
    case 'css':
      return `rgba(${r}, ${g}, ${b}, ${alphaClean})`
    case 'hsl': {
      const { h, s, l } = rgbaToHsla(r, g, b, a)
      return a < 1 ? `hsla(${h}, ${s}%, ${l}%, ${alphaClean})` : `hsl(${h}, ${s}%, ${l}%)`
    }
    case 'hsb': {
      const { h, s, b: val } = rgbaToHsba(r, g, b, a)
      return a < 1 ? `hsba(${h}, ${s}%, ${val}%, ${alphaClean})` : `hsb(${h}, ${s}%, ${val}%)`
    }
    default:
      return rgbToHex(r, g, b, a)
  }
}

/* ==========================================================================
   Gradient Math & Definitions
   ========================================================================== */

export type FillType = 'solid' | 'linear' | 'radial' | 'angular' | 'diamond' | 'image'

export type GradientType = 'linear' | 'radial' | 'angular' | 'diamond'

export interface GradientStop {
  id: string
  color: string // Hex or rgba
  position: number // 0 to 100
}

export interface GradientConfig {
  type: GradientType
  angle: number // 0 to 360 degrees
  stops: GradientStop[]
}

/**
 * Interpolate RGBA between two hex/rgba colors
 */
export function interpolateColor(color1: string, color2: string, factor: number): string {
  const c1 = extractRgba(color1)
  const c2 = extractRgba(color2)
  const t = clampColorValue(factor, 0, 1)

  const r = Math.round(c1.r + (c2.r - c1.r) * t)
  const g = Math.round(c1.g + (c2.g - c1.g) * t)
  const b = Math.round(c1.b + (c2.b - c1.b) * t)
  const a = Math.round((c1.a + (c2.a - c1.a) * t) * 100) / 100

  return rgbToHex(r, g, b, a)
}

/**
 * Get color at a specific percentage position within a gradient stop list
 */
export function getColorAtPosition(stops: GradientStop[], position: number): string {
  if (!stops.length) return '#3b82f6'
  const sorted = [...stops].sort((a, b) => a.position - b.position)
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  if (!first || !last) return '#3b82f6'

  if (position <= first.position) return first.color
  if (position >= last.position) return last.color

  for (let i = 0; i < sorted.length - 1; i++) {
    const s1 = sorted[i]
    const s2 = sorted[i + 1]
    if (s1 && s2 && position >= s1.position && position <= s2.position) {
      const range = s2.position - s1.position
      const factor = range === 0 ? 0 : (position - s1.position) / range
      return interpolateColor(s1.color, s2.color, factor)
    }
  }
  return first.color
}

/**
 * Generate CSS gradient string from GradientConfig
 */
export function gradientToCss(config: GradientConfig): string {
  const sorted = [...config.stops].sort((a, b) => a.position - b.position)
  const stopsStr = sorted.map((s) => `${s.color} ${Math.round(s.position)}%`).join(', ')

  switch (config.type) {
    case 'linear':
      return `linear-gradient(${config.angle}deg, ${stopsStr})`
    case 'radial':
      return `radial-gradient(circle at center, ${stopsStr})`
    case 'angular':
      return `conic-gradient(from ${config.angle}deg at 50% 50%, ${stopsStr})`
    case 'diamond':
      return `radial-gradient(ellipse at center, ${stopsStr})`
    default:
      return `linear-gradient(${config.angle}deg, ${stopsStr})`
  }
}

/* ==========================================================================
   Image Fill Configuration
   ========================================================================== */

export type ImageScaleMode = 'fill' | 'fit' | 'crop' | 'tile'

export interface ImageFillConfig {
  url?: string
  mode: ImageScaleMode
  opacity?: number // 0 to 100 (100 = default)
  zoom?: number // 50 to 500 (100 = 100% / original, default 130 in crop mode)
  exposure?: number // -100 to 100 (0 = default)
  contrast?: number // -100 to 100 (0 = default)
  saturation?: number // -100 to 100 (0 = default)
  temperature?: number // -100 to 100 (0 = default)
  tint?: number // -100 to 100 (0 = default)
  highlights?: number // -100 to 100 (0 = default)
  shadows?: number // -100 to 100 (0 = default)
  positionX?: number // 0 to 100 (50 = centered)
  positionY?: number // 0 to 100 (50 = centered)
  rotation?: number // 0, 90, 180, 270 (0 = default)
  fileName?: string
}

/**
 * Generate CSS filter string from design-grade adjustment parameters
 */
export function getImageFillFilter(config: Partial<ImageFillConfig>): string {
  const exposure = config.exposure ?? 0
  const contrast = config.contrast ?? 0
  const saturation = config.saturation ?? 0
  const temperature = config.temperature ?? 0
  const tint = config.tint ?? 0
  const highlights = config.highlights ?? 0
  const shadows = config.shadows ?? 0

  const filters: string[] = []

  // Exposure: -100 to +100 -> brightness(0% to 200%)
  if (exposure !== 0) {
    filters.push(`brightness(${100 + exposure}%)`)
  }

  // Contrast: -100 to +100 -> contrast(0% to 200%)
  if (contrast !== 0) {
    filters.push(`contrast(${100 + contrast}%)`)
  }

  // Saturation: -100 to +100 -> saturate(0% to 200%)
  if (saturation !== 0) {
    filters.push(`saturate(${100 + saturation}%)`)
  }

  // Highlights: boost brights
  if (highlights !== 0) {
    filters.push(`brightness(${100 + highlights * 0.25}%)`)
  }

  // Shadows: lift/deepen darks
  if (shadows !== 0) {
    filters.push(`contrast(${100 - shadows * 0.2}%)`)
  }

  // Temperature: warm (sepia) vs cool (hue-rotate)
  if (temperature > 0) {
    filters.push(`sepia(${temperature * 0.4}%)`)
  } else if (temperature < 0) {
    filters.push(`hue-rotate(${temperature * 0.3}deg)`)
  }

  // Tint: -100 to +100 -> hue-rotate(-180deg to +180deg)
  if (tint !== 0) {
    filters.push(`hue-rotate(${tint * 1.8}deg)`)
  }

  return filters.join(' ')
}

/**
 * Generate CSS style object for an image fill container or surface
 */
export function getImageFillStyle(config: Partial<ImageFillConfig>): React.CSSProperties {
  const posX = config.positionX ?? 50
  const posY = config.positionY ?? 50
  const rotation = config.rotation ?? 0
  const zoom = config.zoom ?? 130
  const opacity = (config.opacity ?? 100) / 100

  let bgSize = 'cover'
  if (config.mode === 'fit') bgSize = 'contain'
  else if (config.mode === 'tile') bgSize = 'auto'
  else if (config.mode === 'crop') bgSize = `${zoom}%`

  return {
    backgroundImage: config.url ? `url(${config.url})` : undefined,
    backgroundSize: bgSize,
    backgroundRepeat: config.mode === 'tile' ? 'repeat' : 'no-repeat',
    backgroundPosition: `${posX}% ${posY}%`,
    transform: rotation ? `rotate(${rotation}deg)` : undefined,
    filter: getImageFillFilter(config) || undefined,
    opacity,
  }
}

/* ==========================================================================
   Luxury Designer Gradient Presets
   ========================================================================== */

export const DEFAULT_GRADIENT_PRESETS: { name: string; config: GradientConfig }[] = [
  {
    name: 'Cosmic Lavender',
    config: {
      type: 'linear',
      angle: 135,
      stops: [
        { id: '1', color: '#4f46e5', position: 0 },
        { id: '2', color: '#7c3aed', position: 52 },
        { id: '3', color: '#06b6d4', position: 100 },
      ],
    },
  },
  {
    name: 'Sunset Velvet',
    config: {
      type: 'linear',
      angle: 135,
      stops: [
        { id: '1', color: '#881337', position: 0 },
        { id: '2', color: '#e11d48', position: 48 },
        { id: '3', color: '#f59e0b', position: 100 },
      ],
    },
  },
  {
    name: 'Aurora Borealis',
    config: {
      type: 'linear',
      angle: 120,
      stops: [
        { id: '1', color: '#064e3b', position: 0 },
        { id: '2', color: '#0d9488', position: 54 },
        { id: '3', color: '#5eead4', position: 100 },
      ],
    },
  },
  {
    name: 'Cyberpunk Rose',
    config: {
      type: 'linear',
      angle: 90,
      stops: [
        { id: '1', color: '#f43f5e', position: 0 },
        { id: '2', color: '#8b5cf6', position: 50 },
        { id: '3', color: '#3b82f6', position: 100 },
      ],
    },
  },
  {
    name: 'Golden Amber',
    config: {
      type: 'linear',
      angle: 45,
      stops: [
        { id: '1', color: '#78350f', position: 0 },
        { id: '2', color: '#d97706', position: 50 },
        { id: '3', color: '#fde047', position: 100 },
      ],
    },
  },
  {
    name: 'Ocean Deep',
    config: {
      type: 'linear',
      angle: 135,
      stops: [
        { id: '1', color: '#0f172a', position: 0 },
        { id: '2', color: '#1e3a8a', position: 50 },
        { id: '3', color: '#0284c7', position: 100 },
      ],
    },
  },
  {
    name: 'Monochrome Slate',
    config: {
      type: 'linear',
      angle: 180,
      stops: [
        { id: '1', color: '#09090b', position: 0 },
        { id: '2', color: '#27272a', position: 55 },
        { id: '3', color: '#71717a', position: 100 },
      ],
    },
  },
  {
    name: 'Ethereal Mist',
    config: {
      type: 'linear',
      angle: 135,
      stops: [
        { id: '1', color: '#fce7f3', position: 0 },
        { id: '2', color: '#e0e7ff', position: 50 },
        { id: '3', color: '#ccfbf1', position: 100 },
      ],
    },
  },
]

export const GRADIENT_PRESETS = DEFAULT_GRADIENT_PRESETS

/* ==========================================================================
   CSS Gradient Parser
   ========================================================================== */

/**
 * Parse a CSS gradient string (linear, radial, conic) into a GradientConfig
 */
export function parseCssGradient(css: string): GradientConfig | null {
  if (!css || typeof css !== 'string') return null
  const trimmed = css.trim()

  let type: GradientType = 'linear'
  let angle = 135

  if (trimmed.startsWith('radial-gradient')) {
    type = 'radial'
    angle = 0
  } else if (trimmed.startsWith('conic-gradient')) {
    type = 'angular'
    angle = 0
  } else if (trimmed.startsWith('linear-gradient')) {
    type = 'linear'
  } else {
    return null
  }

  const match = trimmed.match(/^[a-z\-]+\((.*)\)$/i)
  if (!match || !match[1]) return null
  const inner = match[1]

  // Split by top-level commas (ignoring commas inside nested brackets e.g. rgb())
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (let i = 0; i < inner.length; i++) {
    const char = inner[i]
    if (char === '(') depth++
    else if (char === ')') depth--

    if (char === ',' && depth === 0) {
      parts.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  if (current.trim()) {
    parts.push(current.trim())
  }

  if (parts.length === 0) return null

  // Check if first part is direction or angle
  let stopParts = parts
  const firstPart = parts[0]
  if (firstPart) {
    const angleMatch = firstPart.match(/^(\d+(?:\.\d+)?)deg$/i)
    if (angleMatch && angleMatch[1]) {
      angle = Math.round(parseFloat(angleMatch[1]))
      stopParts = parts.slice(1)
    } else if (firstPart.startsWith('to ')) {
      if (firstPart.includes('top') && firstPart.includes('right')) angle = 45
      else if (firstPart.includes('bottom') && firstPart.includes('right')) angle = 135
      else if (firstPart.includes('bottom') && firstPart.includes('left')) angle = 225
      else if (firstPart.includes('top') && firstPart.includes('left')) angle = 315
      else if (firstPart.includes('top')) angle = 0
      else if (firstPart.includes('right')) angle = 90
      else if (firstPart.includes('bottom')) angle = 180
      else if (firstPart.includes('left')) angle = 270
      stopParts = parts.slice(1)
    } else if (firstPart.startsWith('from ')) {
      const fromMatch = firstPart.match(/from\s+(\d+)deg/i)
      if (fromMatch && fromMatch[1]) {
        angle = parseInt(fromMatch[1], 10)
      }
      stopParts = parts.slice(1)
    } else if (firstPart.startsWith('circle') || firstPart.startsWith('ellipse')) {
      stopParts = parts.slice(1)
    }
  }

  if (stopParts.length === 0) return null

  const stops: GradientStop[] = stopParts.map((sp, idx) => {
    const percentMatch = sp.match(/\s+(\d+(?:\.\d+)?)%\s*$/)
    let pos = Math.round((idx / Math.max(stopParts.length - 1, 1)) * 100)
    let colorStr = sp
    if (percentMatch && percentMatch[1]) {
      pos = clampColorValue(Math.round(parseFloat(percentMatch[1])), 0, 100)
      colorStr = sp.slice(0, sp.lastIndexOf(percentMatch[0])).trim()
    }
    return {
      id: `stop_${idx + 1}`,
      color: colorStr,
      position: pos,
    }
  })

  return {
    type,
    angle,
    stops,
  }
}

/* ==========================================================================
   Color Format Context & Provider
   ========================================================================== */

export interface ColorFormatContextValue {
  /** Currently active color format ('hex' | 'rgb' | 'css' | 'hsl' | 'hsb') */
  format: ColorFormat
  /** Function to update the active color format */
  setFormat: (format: ColorFormat) => void
}

export const ColorFormatContext = createContext<ColorFormatContextValue | null>(null)

export interface ColorFormatProviderProps {
  defaultFormat?: ColorFormat
  value?: ColorFormat
  onFormatChange?: (format: ColorFormat) => void
  children: React.ReactNode
}

export const ColorFormatProvider: React.FC<ColorFormatProviderProps> = ({
  defaultFormat = 'hex',
  value: controlledFormat,
  onFormatChange,
  children,
}) => {
  const [internalFormat, setInternalFormat] = useState<ColorFormat>(defaultFormat)
  const format = controlledFormat ?? internalFormat

  const setFormat = (newFmt: ColorFormat) => {
    setInternalFormat(newFmt)
    onFormatChange?.(newFmt)
  }

  return React.createElement(
    ColorFormatContext.Provider,
    { value: { format, setFormat } },
    children
  )
}

export const useColorFormat = () => useContext(ColorFormatContext)

/* ==========================================================================
   Custom / Saved Swatches Local Storage & State Management
   ========================================================================== */

export const DEFAULT_CUSTOM_SWATCHES_STORAGE_KEY = 'consona_custom_color_swatches'

export function getStoredCustomSwatches(storageKey = DEFAULT_CUSTOM_SWATCHES_STORAGE_KEY): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {}
  return []
}

export function saveStoredCustomSwatches(swatches: string[], storageKey = DEFAULT_CUSTOM_SWATCHES_STORAGE_KEY): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(storageKey, JSON.stringify(swatches))
  } catch {}
}

export interface UseCustomSwatchesOptions {
  customSwatches?: string[]
  defaultCustomSwatches?: string[]
  onCustomSwatchesChange?: (swatches: string[]) => void
  onAddCustomSwatch?: (swatch: string) => void
  onRemoveCustomSwatch?: (swatch: string) => void
  storageKey?: string
}

export function useCustomSwatches({
  customSwatches: controlledSwatches,
  defaultCustomSwatches,
  onCustomSwatchesChange,
  onAddCustomSwatch,
  onRemoveCustomSwatch,
  storageKey = DEFAULT_CUSTOM_SWATCHES_STORAGE_KEY,
}: UseCustomSwatchesOptions = {}) {
  const [internalSwatches, setInternalSwatches] = useState<string[]>(() => {
    if (defaultCustomSwatches !== undefined) return defaultCustomSwatches
    return getStoredCustomSwatches(storageKey)
  })

  // Hydrate from localStorage in browser if uncontrolled
  useEffect(() => {
    if (controlledSwatches === undefined && defaultCustomSwatches === undefined) {
      const stored = getStoredCustomSwatches(storageKey)
      if (stored.length > 0) {
        setInternalSwatches(stored)
      }
    }
  }, [storageKey, controlledSwatches, defaultCustomSwatches])

  const swatches = controlledSwatches !== undefined ? controlledSwatches : internalSwatches

  const addSwatch = (swatch: string) => {
    if (!swatch) return
    const clean = swatch.trim()
    if (swatches.includes(clean)) return
    const next = [...swatches, clean]
    if (controlledSwatches === undefined) {
      setInternalSwatches(next)
    }
    saveStoredCustomSwatches(next, storageKey)
    onAddCustomSwatch?.(clean)
    onCustomSwatchesChange?.(next)
  }

  const removeSwatch = (swatch: string) => {
    const next = swatches.filter((s) => s !== swatch)
    if (controlledSwatches === undefined) {
      setInternalSwatches(next)
    }
    saveStoredCustomSwatches(next, storageKey)
    onRemoveCustomSwatch?.(swatch)
    onCustomSwatchesChange?.(next)
  }

  const setSwatches = (next: string[]) => {
    if (controlledSwatches === undefined) {
      setInternalSwatches(next)
    }
    saveStoredCustomSwatches(next, storageKey)
    onCustomSwatchesChange?.(next)
  }

  return {
    swatches,
    addSwatch,
    removeSwatch,
    setSwatches,
  }
}

export interface ParsedCustomSwatch {
  name: string
  value: string
  isGradient: boolean
  raw: string
}

/**
 * Parses a custom swatch item from local storage / prop array.
 * Supports:
 * 1. JSON string: `{"name":"Brand Red","hex":"#FF0000"}`
 * 2. CSS gradient string: `linear-gradient(...)`
 * 3. Standard Hex/RGB/HSL string: `#FF0000`
 */
export function parseCustomSwatchItem(item: string, idx = 0): ParsedCustomSwatch {
  if (!item) {
    return { name: `Custom ${idx + 1}`, value: '#000000', isGradient: false, raw: '' }
  }

  const trimmed = item.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed && typeof parsed === 'object') {
        const val = parsed.hex || parsed.value || '#000000'
        const isGradient =
          val.startsWith('linear-gradient') ||
          val.startsWith('radial-gradient') ||
          val.startsWith('conic-gradient')
        return {
          name: parsed.name || (isGradient ? 'Gradient' : `Custom ${idx + 1}`),
          value: val,
          isGradient,
          raw: item,
        }
      }
    } catch {}
  }

  const isGradient =
    trimmed.startsWith('linear-gradient') ||
    trimmed.startsWith('radial-gradient') ||
    trimmed.startsWith('conic-gradient')

  return {
    name: isGradient ? 'Gradient' : `Custom ${idx + 1}`,
    value: trimmed,
    isGradient,
    raw: item,
  }
}



