import { useMemo } from 'react'
import { createChartTheme } from '../theme/chart-theme'
import { resolveChartPalette } from '../theme/color-palettes'

export interface UseChartThemeOptions {
  palette?: string | string[]
  themeOverrides?: Record<string, any>
  isDark?: boolean
}

/**
 * Hook to dynamically compute chart themes and color palettes
 * synced with Consona Interface styles.
 */
export function useChartTheme(options: UseChartThemeOptions = {}) {
  const { palette, themeOverrides, isDark } = options

  const theme = useMemo(() => {
    const baseTheme = createChartTheme({ isDark })
    if (!themeOverrides) return baseTheme
    return {
      ...baseTheme,
      ...themeOverrides,
      text: { ...baseTheme.text, ...themeOverrides.text },
      axis: { ...baseTheme.axis, ...themeOverrides.axis },
      grid: { ...baseTheme.grid, ...themeOverrides.grid },
      tooltip: { ...baseTheme.tooltip, ...themeOverrides.tooltip },
      legends: { ...baseTheme.legends, ...themeOverrides.legends },
    }
  }, [themeOverrides, isDark])

  const colors = useMemo(() => {
    return resolveChartPalette(palette)
  }, [palette])

  return {
    theme,
    colors,
  }
}
