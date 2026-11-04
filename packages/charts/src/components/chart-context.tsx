import React, { createContext, useContext, useMemo } from 'react'
import type { ChartLegendItem } from './chart-container'
import type { ChartTimeRange } from '../types/common'
import { createTooltipStore, type TooltipStore, ChartTooltipStoreContext } from '../tooltip-registry'

export interface ChartContextValue<TData = any> {
  /** Chart dataset */
  data?: TData
  /** Active color array */
  colors?: string[]
  /** Theme object for Nivo/SVG */
  theme?: any
  /** Width of the render area */
  width?: number
  /** Height of the render area */
  height?: number | string
  /** Whether the chart is in ready state */
  isReady?: boolean
  /** Whether data is currently loading */
  isLoading?: boolean
  /** Computed legend series items */
  legendItems?: ChartLegendItem[]
  /** Toggle key visibility */
  toggleKey?: (id: string) => void
  /** Available time ranges */
  timeRanges?: ChartTimeRange[]
  /** Currently active time range */
  selectedRange?: ChartTimeRange
  /** Handler when time range changes */
  onRangeChange?: (range: ChartTimeRange) => void
  /** Render function for the chart visualizer */
  renderChart?: (props?: any) => React.ReactNode
  /** Pre-rendered visualizer node */
  chartNode?: React.ReactNode
  /** Dedicated persistent tooltip store instance */
  tooltipStore?: TooltipStore
  /** Whether tooltip persists in canvas while cursor is in the canvas */
  persistTooltipInCanvas?: boolean
  /** Additional engine or chart specific metadata */
  meta?: Record<string, any>
}

export const ChartContext = createContext<ChartContextValue | null>(null)

export interface ChartProviderProps<TData = any> {
  /** Currently selected or active value. */
  value: ChartContextValue<TData>
  children: React.ReactNode
}

export function ChartProvider<TData = any>({ value, children }: ChartProviderProps<TData>) {
  // Ensure a dedicated tooltip store exists for this chart instance
  const tooltipStore = useMemo(() => {
    return value.tooltipStore || createTooltipStore({
      persistInCanvas: value.persistTooltipInCanvas ?? true,
    })
  }, [value.tooltipStore, value.persistTooltipInCanvas])

  const mergedValue = useMemo(() => ({
    ...value,
    tooltipStore,
  }), [value, tooltipStore])

  return (
    <ChartContext.Provider value={mergedValue}>
      <ChartTooltipStoreContext.Provider value={tooltipStore}>
        {children}
      </ChartTooltipStoreContext.Provider>
    </ChartContext.Provider>
  )
}

/**
 * Hook to access current chart context inside compound child components.
 */
export function useChartContext<TData = any>(): ChartContextValue<TData> {
  const ctx = useContext(ChartContext)
  return (ctx || {}) as ChartContextValue<TData>
}

