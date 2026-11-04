/**
 * @file bar-color.ts
 * Bar fill → soft background + readable label ink helpers.
 * Zero React.
 */

/**
 * Soft / pastel bar background from a solid `getColor` fill.
 * Mixes the fill into white so bars stay tinted but light enough for a
 * whitish dependency stroke to read on top.
 */
export function softBarFill(fill: string, solidPercent: number = 28): string {
  const f = fill.trim()
  if (!f) return 'color-mix(in oklab, var(--color-primary, #3b82f6) 28%, white)'
  return `color-mix(in oklab, ${f} ${solidPercent}%, white)`
}

/**
 * Pick light or dark label ink for a fill (used when the bar uses a solid fill).
 */
export function contrastInk(fill: string): string {
  const hex = fill.trim()
  let r = 0
  let g = 0
  let b = 0
  const m = hex.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (m?.[1]) {
    let h = m[1]
    if (h.length === 3) h = `${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`
    r = parseInt(h.slice(0, 2), 16)
    g = parseInt(h.slice(2, 4), 16)
    b = parseInt(h.slice(4, 6), 16)
  } else {
    const rgb = hex.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i)
    if (rgb) {
      r = Number(rgb[1])
      g = Number(rgb[2])
      b = Number(rgb[3])
    } else {
      // Soft / token fills → dark label on light pastel.
      return '#111'
    }
  }
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  return L > 0.45 ? '#111' : '#fff'
}

/** Label ink when the bar uses {@link softBarFill} (pastel → dark text). */
export function softBarInk(_fill?: string | null): string {
  return '#111'
}

/** Resolve ink for legacy solid-bar contrast. */
export function resolveBarInk(fill?: string | null): string {
  if (fill == null || fill.trim() === '') return '#fff'
  return contrastInk(fill)
}
