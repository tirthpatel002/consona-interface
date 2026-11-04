/**
 * Enterprise SaaS color palettes harmonized with Consona Interface tokens.
 * Supports dynamic CSS variable injection and standalone fallback hex codes.
 */

export interface ChartPalette {
  id: string
  name: string
  colors: string[]
  gradientStops?: Array<{ offset: string; color: string; opacity?: number }>
}

export const CHART_PALETTES: Record<string, string[]> = {
  /** High-contrast 12-series categorical SaaS palette */
  categorical: [
    '#3157D5', // Indigo Blue
    '#0EA5E9', // Sky Cyan
    '#10B981', // Emerald Green
    '#F59E0B', // Amber Gold
    '#EC4899', // Pink / Rose
    '#8B5CF6', // Purple / Violet
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#6366F1', // Royal Indigo
    '#84CC16', // Lime
    '#06B6D4', // Cyan
    '#D946EF', // Fuchsia
  ],

  /** Clean financial brand palette prioritizing primary & cyan accents */
  brand: [
    '#3157D5',
    '#60A5FA',
    '#38BDF8',
    '#818CF8',
    '#A78BFA',
    '#C084FC',
  ],

  /** Emerald & teal performance growth palette */
  emerald: [
    '#059669',
    '#10B981',
    '#34D399',
    '#6EE7B7',
    '#A7F3D0',
    '#D1FAE5',
  ],

  /** Amber and warm metallic executive palette */
  amber: [
    '#D97706',
    '#F59E0B',
    '#FBBF24',
    '#FCD34D',
    '#FDE68A',
    '#FEF3C7',
  ],

  /** Violet and deep space modernism palette */
  violet: [
    '#7C3AED',
    '#8B5CF6',
    '#A78BFA',
    '#C4B5FD',
    '#DDD6FE',
    '#EDE9FE',
  ],

  /** Diverging palette for profit/loss, status, density */
  diverging: [
    '#EF4444', // Red
    '#F87171',
    '#FCA5A5',
    '#E5E7EB', // Neutral
    '#86EFAC',
    '#34D399',
    '#10B981', // Green
  ],

  /** Monochrome tone-on-tone gradient ramp */
  monochrome: [
    '#1F2937',
    '#374151',
    '#4B5563',
    '#6B7280',
    '#9CA3AF',
    '#D1D5DB',
  ],
}

/**
 * Resolves an active palette name or array of colors.
 */
export function resolveChartPalette(
  palette: string | string[] | undefined,
  primaryColor?: string
): string[] {
  if (Array.isArray(palette) && palette.length > 0) {
    return palette
  }
  if (typeof palette === 'string' && CHART_PALETTES[palette]) {
    return CHART_PALETTES[palette]
  }
  if (primaryColor) {
    const cat = CHART_PALETTES.categorical ?? []
    return [
      primaryColor,
      ...cat.filter((c) => c !== primaryColor),
    ]
  }
  return CHART_PALETTES.categorical ?? []
}
