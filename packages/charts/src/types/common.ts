import type { ReactNode } from 'react'

/** Margin geometry object standard in Nivo charts */
export interface ChartMargin {
  top?: number
  right?: number
  bottom?: number
  left?: number
}

/** Standard responsive height/aspect ratio configuration */
export interface ChartDimensionProps {
  /** Fixed height in pixels or CSS height value (default: 360). */
  height?: number | string
  /** Aspect ratio width / height multiplier (e.g. 16/9, 2/1). Overrides height if specified. */
  aspectRatio?: number
  /** Outer SVG / Canvas margins. */
  margin?: ChartMargin
}

/** Supported SaaS surface container variants */
export type ChartContainerVariant =
  | 'default'
  | 'glass'
  | 'subtle'
  | 'bordered'
  | 'flat'
  | 'glow'

/** Time range filtering tokens */
export type ChartTimeRange = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL' | string

/** Export file formats */
export type ChartExportFormat = 'png' | 'svg' | 'csv' | 'json'

/** Action item in the chart toolbar */
export interface ChartToolbarAction {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick?: () => void
  disabled?: boolean
}

/** Base point / datum interface for tooltips */
export interface ChartTooltipSlotProps<T = any> {
  datum?: T
  point?: T
  node?: T
  slice?: T
  bar?: T
  cell?: T
  part?: T
  arc?: T
  link?: T
  data?: any
  color?: string
  formattedValue?: string | number
  label?: string | number
  title?: string
  badge?: string
  value?: string | number
  children?: ReactNode
}

/** Normalized datum item click callback */
export type ChartItemClickHandler<TDatum = any> = (
  datum: TDatum,
  event: React.MouseEvent
) => void

/** SVG Gradient & Filter Defs Slot Props */
export interface ChartDefsSlotProps {
  chartId: string
  colors: string[]
  primaryColor: string
  accentColor: string
  isDark: boolean
}

/** Standard base props shared by all visualizer chart components */
export interface BaseChartProps extends ChartDimensionProps {
  /** Visual surface container variant style */
  containerVariant?: ChartContainerVariant
  /** Title text for default header */
  title?: string
  /** Description text for default header */
  description?: string
  /** Stat badge for default header */
  badge?: string
  /** Whether data is currently loading */
  isLoading?: boolean
  /** Time ranges for toolbar */
  timeRanges?: ChartTimeRange[]
  /** Controlled currently selected time range */
  selectedRange?: ChartTimeRange
  /** Default selected time range when uncontrolled */
  defaultRange?: ChartTimeRange
  /** Callback fired when a time range is selected */
  onRangeChange?: (range: ChartTimeRange) => void
  /** Color palette name or color array */
  palette?: string | string[]
  /** Props forwarded to the outer ChartContainer card */
  containerProps?: React.HTMLAttributes<HTMLDivElement>
  /** Low-level engine pass-through props forwarded directly to the underlying Nivo or SVG visualizer */
  chartProps?: Record<string, any>
  /** Alias for chartProps */
  nivoProps?: Record<string, any>
  /** Item click event handler */
  onItemClick?: ChartItemClickHandler<any>
}

