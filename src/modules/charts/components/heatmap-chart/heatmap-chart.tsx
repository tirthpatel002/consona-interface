import React from 'react'
import { ResponsiveHeatMap, ResponsiveHeatMapCanvas, type HeatMapDatum, type HeatMapSvgProps } from '@nivo/heatmap'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap, SlotDefinition } from '../../../../core/types'
import {
  ChartContainer,
  ChartHeader,
  ChartToolbar,
  ChartLegend,
  ChartTooltip,
  ChartCanvas,
  ChartEmptyState,
  ChartLoadingState,
  ChartFooter,
  type ChartContainerProps,
  type ChartCanvasProps,
  type ChartHeaderProps,
  type ChartToolbarProps,
  type ChartLegendProps,
  type ChartTooltipProps,
  type ChartEmptyStateProps,
  type ChartLoadingStateProps,
  type ChartFooterProps,
} from '../chart-container'
import { ChartContext, ChartProvider, useChartContext } from '../chart-context'
import { useChartTheme } from '../../hooks/use-chart-theme'
import { useChartDimensions } from '../../hooks/use-chart-dimensions'
import type {
  ChartContainerVariant,
  ChartMargin,
  ChartTimeRange,
} from '../../types/common'

export interface HeatmapDatumRecord {
  id: string
  data: Array<{ x: string | number; y: number | null }>
}

/* ==========================================================================
   Context
   ========================================================================== */

export const HeatmapChartContext = ChartContext
export const HeatmapChartProvider = ChartProvider
export const useHeatmapChartContext = useChartContext

/* ==========================================================================
   Heatmap Chart Slots & Props Interfaces
   ========================================================================== */

export interface HeatmapChartSlots {
  /** Outer container card / surface */
  container?: React.ComponentType<ChartContainerProps>
  /** Interactive chart canvas viewport container */
  canvas?: React.ComponentType<ChartCanvasProps>
  /** Underlying chart engine instance */
  chart?: React.ComponentType<Record<string, unknown>>
  /** Top header with title and stats */
  header?: React.ComponentType<ChartHeaderProps>
  /** Action / time range toolbar */
  toolbar?: React.ComponentType<ChartToolbarProps>
  /** Series legend indicator */
  legend?: React.ComponentType<ChartLegendProps>
  /** Custom hover tooltip card */
  tooltip?: SlotDefinition<ChartTooltipProps>
  /** Custom cell item renderer component (SVG engine) */
  item?: React.ComponentType<Record<string, unknown>>
  /** Empty state when no data exists */
  empty?: React.ComponentType<ChartEmptyStateProps>
  /** Loading placeholder */
  loading?: React.ComponentType<ChartLoadingStateProps>
  /** Summary footer */
  footer?: React.ComponentType<ChartFooterProps>
}

export interface HeatmapChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'onClick' | 'onContextMenu'> {
  /** Matrix row dataset with id and array of {x, y} coordinate points. */
  data?: HeatmapDatumRecord[]
  /** Rendering engine: 'svg' or 'canvas' (default: 'svg'). */
  engine?: 'svg' | 'canvas'
  /** Chart height in pixels (default: 360). */
  height?: number | string
  /** Aspect ratio multiplier. Overrides height if set. */
  aspectRatio?: number
  /** Outer SVG chart margins. */
  margin?: ChartMargin
  /** Cell border radius in pixels (default: 0). */
  borderRadius?: number
  /** Padding between adjacent cells (0.0 - 0.5, default: 0.1). */
  padding?: number
  /** Color palette or gradient scale scheme ('brand' | 'emerald' | 'amber' | 'violet' | 'diverging'). */
  palette?: string | string[]
  /** Visual surface container style. */
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
  /** Callback when a cell is clicked */
  onItemClick?: (datum: any, event: React.MouseEvent) => void
  /** Value format callback or string */
  valueFormat?: string | ((val: number) => string)
  /** Pass-through props directly to underlying chart component */
  chartProps?: Record<string, any>
  /** Alias for chartProps */
  nivoProps?: Record<string, any>
  /** Props forwarded to the outer ChartContainer card */
  containerProps?: React.HTMLAttributes<HTMLDivElement>
  /** Slot overrides for downstream customization. */
  slots?: SlotComponents<HeatmapChartSlots>
  /** Slot props overrides for downstream customization. */
  slotProps?: SlotPropsMap<HeatmapChartSlots>
  className?: string
  style?: React.CSSProperties
}

/* ==========================================================================
   Heatmap Chart Primitive
   ========================================================================== */

function findTooltipElement(node: React.ReactNode): React.ReactElement | null {
  if (!node) return null
  for (const child of React.Children.toArray(node)) {
    if (React.isValidElement(child)) {
      if (
        child.type === ChartTooltip ||
        (child.type as any)?.displayName === 'ChartTooltip' ||
        (child.type as any)?.name === 'ChartTooltip' ||
        (child.props as any)?.['data-slot'] === 'chart-tooltip'
      ) {
        return child
      }
      if ((child.props as any)?.children) {
        const found = findTooltipElement((child.props as any).children)
        if (found) return found
      }
    }
  }
  return null
}

function HeatmapChartPrimitive({
  data = [],
  engine = 'svg',
  height = 360,
  aspectRatio,
  margin = { top: 30, right: 30, bottom: 40, left: 60 },
  borderRadius = 0,
  padding = 0.1,
  palette = 'brand',
  containerVariant = 'default',
  title,
  description,
  badge,
  isLoading = false,
  timeRanges,
  selectedRange,
  defaultRange,
  onRangeChange,
  onItemClick,
  valueFormat,
  chartProps,
  nivoProps,
  containerProps,
  slots = {},
  slotProps = {},
  className,
  style,
  children,
}: HeatmapChartProps) {
  const { theme, colors } = useChartTheme({ palette })
  const { ref, width, isReady } = useChartDimensions({ height, aspectRatio })
  const safeData = React.useMemo(() => {
    if (!Array.isArray(data)) return []
    return data
      .filter((d): d is NonNullable<HeatmapChartProps['data']>[number] => Boolean(d && typeof d === 'object' && d.id != null && Array.isArray(d.data)))
      .map((d) => ({
        ...d,
        data: d.data.filter(
          (c: any) =>
            c != null &&
            typeof c === 'object' &&
            c.x !== undefined &&
            c.x !== null &&
            (c.y === null || (typeof c.y === 'number' && Number.isFinite(c.y)))
        ),
      }))
      .filter((d) => d.data.length > 0)
  }, [data])
  const safeColors = Array.isArray(colors) && colors.length > 0 ? colors : ['#E0E7FF', '#3157D5']

  const legendItems = React.useMemo(() => {
    return safeData.map((d, i) => ({
      id: String(d.id),
      label: String(d.id),
      color: safeColors[i % safeColors.length] || '#3157D5',
    }))
  }, [safeData, safeColors])

  const defaultChartProps = {
    data: safeData as any,
    margin,
    borderRadius,
    padding,
    valueFormat,
    theme,
    colors: {
      type: 'quantize' as const,
      colors: safeColors.length > 2 ? safeColors : [safeColors[0] || '#E0E7FF', safeColors[1] || '#3157D5'],
      steps: 5,
    },
    axisTop: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
    },
    axisLeft: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
    },
    emptyColor: 'var(--secondary, #f3f4f6)',
    onClick: (cell: any, event: any) => {
      onItemClick?.(cell, event)
        ; (slotProps.chart as any)?.onClick?.(cell, event)
    },
    ...(slots.item ? { cellComponent: slots.item } : {}),
    tooltip: (props: any) => {
      const cell = props?.cell || props?.datum || props?.data || props
      if (!cell) return null
      const title = `${cell.serieId ?? ''} × ${cell.data?.x ?? cell.x ?? ''}`
      const value = cell.formattedValue ?? cell.data?.y ?? cell.value
      const color = cell.color
      const compositeTooltip = findTooltipElement(children)
      if (compositeTooltip) {
        const tooltipPayload = {
          title,
          label: 'Density',
          value,
          color,
          cell,
          datum: cell,
          data: cell,
          ...(slotProps?.tooltip as any),
        }
        const tooltipPropsObj = (compositeTooltip.props || {}) as Record<string, any>
        if (typeof tooltipPropsObj.children === 'function') {
          return (
            <ChartTooltip {...tooltipPropsObj}>
              {tooltipPropsObj.children(tooltipPayload)}
            </ChartTooltip>
          )
        }
        return React.cloneElement(compositeTooltip, tooltipPayload)
      }
      if (slots?.tooltip) {
        return renderSlot(slots?.tooltip, {
          title,
          label: 'Density',
          value,
          color,
          cell,
          datum: cell,
          data: cell,
          ...slotProps?.tooltip,
        })
      }
      return (
        <ChartTooltip
          title={title}
          label="Value"
          value={value}
          color={color}
        />
      )
    },
    ...chartProps,
    ...nivoProps,
    ...(slotProps?.chart as any),
  }

  const ChartComponent = engine === 'canvas' ? ResponsiveHeatMapCanvas : ResponsiveHeatMap

  const visualizerNode = (
    safeData.length === 0 ? (
      renderSlot(slots?.empty, slotProps?.empty) ?? <ChartEmptyState />
    ) : (
      renderSlot(slots?.chart, { ...defaultChartProps, ...slotProps?.chart }, { defaultComponent: ChartComponent as any }) ?? (
        <ChartComponent {...(defaultChartProps as any)} />
      )
    )
  )

  const contextValue = {
    data: safeData,
    colors: safeColors,
    legendItems,
    theme,
    width,
    height,
    isReady,
    isLoading,
    timeRanges,
    selectedRange,
    onRangeChange,
    onItemClick,
    meta: { engine, borderRadius, padding },
    renderChart: () => visualizerNode,
    chartNode: visualizerNode,
  }

  if (children != null) {
    return (
      <ChartProvider value={contextValue}>
        {children}
      </ChartProvider>
    )
  }

  const defaultContainerContent = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-space-md mb-2">
        {renderSlot(slots?.header, slotProps?.header) ?? (
          (title || description || badge) && (
            <ChartHeader
              title={title}
              description={description}
              badge={badge}
            />
          )
        )}
        {renderSlot(slots?.toolbar, slotProps?.toolbar) ?? (
          timeRanges && (
            <ChartToolbar
              timeRanges={timeRanges}
              selectedRange={selectedRange}
              defaultRange={defaultRange}
              onRangeChange={onRangeChange}
            />
          )
        )}
      </div>

      {renderSlot(slots?.legend, slotProps?.legend)}

      {renderSlot(
        slots?.canvas,
        {
          ref,
          height,
          isLoading,
          isEmpty: safeData.length === 0,
          onContextMenu: (slotProps?.chart?.onContextMenu || slotProps?.container?.onContextMenu) as any,
          ...slotProps?.canvas,
          children: isLoading ? (
            renderSlot(slots?.loading, slotProps?.loading) ?? <ChartLoadingState />
          ) : (
            visualizerNode
          ),
        },
        { defaultComponent: ChartCanvas }
      ) ?? (
        <ChartCanvas
          ref={ref}
          height={height}
          isLoading={isLoading}
          isEmpty={safeData.length === 0}
          onContextMenu={(slotProps?.chart?.onContextMenu || slotProps?.container?.onContextMenu) as any}
        >
          {isLoading ? (
            renderSlot(slots?.loading, slotProps?.loading) ?? <ChartLoadingState />
          ) : (
            visualizerNode
          )}
        </ChartCanvas>
      )}

      {renderSlot(slots?.footer, slotProps?.footer)}
    </>
  )

  const containerMergedProps = {
    variant: containerVariant,
    className,
    style,
    ...containerProps,
    ...(slotProps?.container as any),
    children: defaultContainerContent,
  }

  return (
    <ChartProvider value={contextValue}>
      {renderSlot(slots?.container, { ...containerMergedProps, ...slotProps?.container }, { defaultComponent: ChartContainer }) ?? (
        <ChartContainer {...containerMergedProps} />
      )}
    </ChartProvider>
  )
}

/* ==========================================================================
   Factory & Compound Attachments
   ========================================================================== */

export const HeatmapChart = createInterfaceComponent<HeatmapChartProps, HeatmapChartSlots>(
  {
    name: 'HeatmapChart',
    category: 'data',
    description: 'High-density categorical intensity matrix with quantized color scales.',
    version: '1.0.0',
    props: {
      height: 360,
      borderRadius: 0,
      padding: 0.1,
      palette: 'brand',
    },
    slots: {
      container: undefined,
      canvas: undefined,
      chart: undefined,
      header: undefined,
      toolbar: undefined,
      legend: undefined,
      tooltip: undefined,
      empty: undefined,
      loading: undefined,
      footer: undefined,
      item: undefined,
    },
  },
  HeatmapChartPrimitive
)

// Namespace attachments for compound family ergonomics
HeatmapChart.Provider = HeatmapChartProvider
HeatmapChart.Container = ChartContainer
HeatmapChart.Header = ChartHeader
HeatmapChart.Toolbar = ChartToolbar
HeatmapChart.Legend = ChartLegend
HeatmapChart.Canvas = ChartCanvas
HeatmapChart.Tooltip = ChartTooltip
HeatmapChart.Empty = ChartEmptyState
HeatmapChart.Loading = ChartLoadingState
HeatmapChart.Footer = ChartFooter
