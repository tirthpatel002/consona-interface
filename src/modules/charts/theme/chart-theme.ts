/**
 * Nivo theme specification bridge connecting Consona Interface design tokens
 * with Nivo's SVG & Canvas render tree.
 */

export interface NivoThemeOptions {
  textColor?: string
  fontSize?: number
  fontFamily?: string
  borderColor?: string
  gridColor?: string
  tooltipBg?: string
  tooltipFg?: string
  tooltipBorder?: string
  tooltipShadow?: string
  isDark?: boolean
}

/**
 * Creates a compliant Nivo Theme object synchronized with Consona Interface styles.
 */
export function createNivoTheme(options: NivoThemeOptions = {}): any {
  const {
    textColor = 'var(--muted-fg, #6b7280)',
    fontSize = 11,
    fontFamily = 'var(--font-sans, system-ui, sans-serif)',
    borderColor = 'var(--border, rgba(140, 140, 140, 0.2))',
    gridColor = 'var(--border, rgba(140, 140, 140, 0.15))',
    tooltipBg = 'var(--overlay, #ffffff)',
    tooltipFg = 'var(--fg, #111827)',
    tooltipBorder = 'var(--border, rgba(140, 140, 140, 0.3))',
  } = options

  return {
    background: 'transparent',
    text: {
      fontSize,
      fill: textColor,
      fontFamily,
      outlineWidth: 0,
      outlineColor: 'transparent',
    },
    axis: {
      domain: {
        line: {
          stroke: borderColor,
          strokeWidth: 1,
        },
      },
      legend: {
        text: {
          fontSize: fontSize + 1,
          fill: textColor,
          fontFamily,
          fontWeight: 600,
        },
      },
      ticks: {
        line: {
          stroke: borderColor,
          strokeWidth: 1,
        },
        text: {
          fontSize,
          fill: textColor,
          fontFamily,
        },
      },
    },
    grid: {
      line: {
        stroke: gridColor,
        strokeWidth: 1,
        strokeDasharray: '3 3',
      },
    },
    legends: {
      title: {
        text: {
          fontSize,
          fill: textColor,
          fontFamily,
          fontWeight: 600,
        },
      },
      text: {
        fontSize,
        fill: textColor,
        fontFamily,
      },
      ticks: {
        line: {},
        text: {
          fontSize: fontSize - 1,
          fill: textColor,
        },
      },
    },
    annotations: {
      text: {
        fontSize,
        fill: textColor,
        fontFamily,
        outlineWidth: 2,
        outlineColor: tooltipBg,
        outlineOpacity: 1,
      },
      link: {
        stroke: borderColor,
        strokeWidth: 1,
        outlineWidth: 2,
        outlineColor: tooltipBg,
        outlineOpacity: 1,
      },
      outline: {
        stroke: borderColor,
        strokeWidth: 2,
        outlineWidth: 2,
        outlineColor: tooltipBg,
        outlineOpacity: 1,
      },
      symbol: {
        fill: borderColor,
        outlineWidth: 2,
        outlineColor: tooltipBg,
        outlineOpacity: 1,
      },
    },
    tooltip: {
      wrapper: {
        display: 'none',
        visibility: 'hidden',
        opacity: 0,
        pointerEvents: 'none',
      },
      container: {
        display: 'none',
        visibility: 'hidden',
        opacity: 0,
        pointerEvents: 'none',
      },
      basic: {},
      chip: {},
      table: {},
      tableCell: {
        padding: '3px 8px',
      },
      tableCellValue: {
        fontWeight: 'bold',
      },
    },
    crosshair: {
      line: {
        stroke: 'var(--primary, #3157D5)',
        strokeWidth: 1.5,
        strokeOpacity: 0.75,
        strokeDasharray: '4 4',
      },
    },
    dots: {
      text: {
        fill: textColor,
        fontSize,
        fontFamily,
      },
    },
    labels: {
      text: {
        fontSize,
        fontFamily,
        fontWeight: 500,
      },
    },
  }
}
