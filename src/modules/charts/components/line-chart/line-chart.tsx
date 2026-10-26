import React, { useState } from 'react'
import { ResponsiveLine, ResponsiveLineCanvas, type LineSvgProps } from '@nivo/line'
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

/* ==========================================================================
   Context
   ========================================================================== */

export const LineChartContext = ChartContext
export const LineChartProvider = ChartProvider
export const useLineChartContext = useChartContext

/* ==========================================================================
   Line Chart Slots & Props Interfaces
   ========================================================================== */

export interface LineChartSlots {
  /** Outer container card / surface */
  container?: React.ComponentType<ChartContainerProps>
  /** Interactive chart canvas viewport container */
  canvas?: React.ComponentType<ChartCanvasProps>
  /** Underlying chart engine instance */
  chart?: React.ComponentType<LineSvgProps<any>>
  /** Top header with title and stats */
  header?: React.ComponentType<ChartHeaderProps>
  /** Action / time range toolbar */
  toolbar?: React.ComponentType<ChartToolbarProps>
  /** Series legend indicator */
  legend?: React.ComponentType<ChartLegendProps>
  /** Custom hover tooltip card */
  tooltip?: SlotDefinition<ChartTooltipProps>
  /** Empty state when no data exists */
  empty?: React.ComponentType<ChartEmptyStateProps>
  /** Loading placeholder */
  loading?: React.ComponentType<ChartLoadingStateProps>
  /** Summary footer */
  footer?: React.ComponentType<ChartFooterProps>
}

export interface LineChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'onClick' | 'onContextMenu'> {
  /** Multi-series dataset array. */
  data?: any[]
  /** Rendering engine: 'svg' or 'canvas' (default: 'svg'). */
  engine?: 'svg' | 'canvas'
  /** Curve interpolation type (default: 'monotoneX'). */
  curve?: 'linear' | 'monotoneX' | 'monotoneY' | 'natural' | 'step' | 'catmullRom' | 'basis'
  /** Chart height in pixels (default: 360). */
  height?: number | string
  /** Aspect ratio multiplier. Overrides height if set. */
  aspectRatio?: number
  /** Outer SVG chart margins. */
  margin?: ChartMargin
  /** Line stroke width in pixels (default: 2.5). */
  lineWidth?: number
  /** Whether to render point markers on vertices (default: true). */
  enablePoints?: boolean
  /** Point diameter in pixels (default: 8). */
  pointSize?: number
  /** Whether to fill the area under lines (default: false). */
  enableArea?: boolean
  /** Fill opacity when enableArea is true (0.0 - 1.0, default: 0.15). */
  areaOpacity?: number
  /** Custom SVG pattern / gradient defs */
  defs?: any[]
  /** Custom fill mappings linking data ids to pattern defs */
  fill?: any[]
  /** Layer sequence override supporting custom SVG/Canvas rendering functions */
  layers?: any[]
  /** Whether to render vertical grid lines (default: false). */
  enableGridX?: boolean
  /** Whether to render horizontal grid lines (default: true). */
  enableGridY?: boolean
  /** Color palette name or color array. */
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
  /** Currently selected time range (controlled) */
  selectedRange?: ChartTimeRange
  /** Default selected time range (uncontrolled) */
  defaultRange?: ChartTimeRange
  /** Callback fired when a time range is selected */
  onRangeChange?: (range: ChartTimeRange) => void
  /** Callback when a line point is clicked */
  onItemClick?: (datum: any, event: React.MouseEvent) => void
  /** Format function for Y-axis and tooltip values */
  yFormat?: (val: number | string) => string
  /** Format function for X-axis and tooltip labels */
  xFormat?: (val: number | string) => string
  /** Pass-through props directly to underlying chart component */
  chartProps?: Record<string, any>
  /** Alias for chartProps */
  nivoProps?: Record<string, any>
  /** Props forwarded to the outer ChartContainer card */
  containerProps?: React.HTMLAttributes<HTMLDivElement>
  /** Slot overrides for downstream customization. */
  slots?: SlotComponents<LineChartSlots>
  /** Slot props overrides for downstream customization. */
  slotProps?: SlotPropsMap<LineChartSlots>
  className?: string
  style?: React.CSSProperties
}

/* ==========================================================================
   Line Chart Primitive
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

function LineChartPrimitive({
  data = [],
  engine = 'svg',
  curve = 'monotoneX',
  height = 360,
  aspectRatio,
  margin = { top: 20, right: 20, bottom: 40, left: 50 },
  lineWidth = 2.5,
  enablePoints = true,
  pointSize = 8,
  enableArea = false,
  areaOpacity = 0.15,
  defs,
  fill,
  layers,
  enableGridX = false,
  enableGridY = true,
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
  yFormat,
  xFormat,
  chartProps,
  nivoProps,
  slots = {},
  slotProps = {},
  containerProps,
  className,
  style,
  children,
}: LineChartProps) {
  const { theme, colors } = useChartTheme({ palette })
  const { ref, width, isReady } = useChartDimensions({ height, aspectRatio })
  const safeData = React.useMemo(() => {
    if (!Array.isArray(data)) return []
    return data
      .filter((s: any) => Boolean(s && typeof s === 'object' && s.id != null && Array.isArray(s.data)))
      .map((s) => ({
        ...s,
        data: s.data.filter(
          (d: any) => d != null && typeof d === 'object' && d.x !== undefined && d.x !== null && d.y !== undefined
        ),
      }))
      .filter((s) => s.data.length > 0)
  }, [data])
  const safeColors = Array.isArray(colors) && colors.length > 0 ? colors : ['#3157D5']
  const [hiddenIds, setHiddenIds] = useState<Record<string, boolean>>({})

  const visibleData = safeData.filter((s) => s && s.id != null && !hiddenIds[String(s.id)])

  const legendItems = safeData.map((s, idx) => ({
    id: String(s?.id ?? idx),
    label: String(s?.id ?? idx),
    color: safeColors[idx % safeColors.length] || '#3157D5',
    hidden: Boolean(hiddenIds[String(s?.id ?? idx)]),
  }))

  const toggleKey = (id: string) => {
    setHiddenIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const defaultChartProps = {
    data: visibleData,
    margin,
    curve,
    lineWidth,
    enablePoints,
    pointSize,
    pointColor: { theme: 'background' },
    pointBorderWidth: 2,
    pointBorderColor: { from: 'serieColor' },
    enableArea,
    areaOpacity,
    enableGridX,
    enableGridY,
    colors: safeColors,
    yFormat,
    xFormat,
    theme,
    useMesh: true,
    axisTop: null,
    axisRight: null,
    axisBottom: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
    },
    axisLeft: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
    },
    ...(defs ? { defs } : {}),
    ...(fill ? { fill } : {}),
    ...(layers ? { layers } : {}),
    onClick: (point: any, event: any) => {
      onItemClick?.(point, event)
      slotProps.chart?.onClick?.(point, event)
    },
    tooltip: (props: any) => {
      const point = props?.point || props?.datum || props
      if (!point) return null
      const title = String(point.data?.xFormatted || point.data?.x || point.x || '')
      const label = String(point.serieId || point.serie?.id || '')
      const value = point.data?.yFormatted || point.data?.y || point.y || ''
      const color = point.serieColor || point.color || point.serie?.color

      const compositeTooltip = findTooltipElement(children)
      if (compositeTooltip) {
        const tooltipPayload = {
          title,
          label,
          value,
          color,
          point,
          datum: point.data || point,
          data: point.data || point,
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
          ...slotProps?.tooltip,
          title,
          label,
          value,
          color,
          point,
          datum: point.data,
          data: point.data,
          ...slotProps?.tooltip,
        })
      }
      return (
        <ChartTooltip
          title={title}
          label={label}
          value={value}
          color={color}
        />
      )
    },
    ...chartProps,
    ...nivoProps,
    ...(slotProps?.chart as any),
  }

  const ChartComponent = engine === 'canvas' ? ResponsiveLineCanvas : ResponsiveLine

  const visualizerNode = (
    safeData.length === 0 || visibleData.length === 0 ? (
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
    theme,
    width,
    height,
    isReady,
    isLoading,
    legendItems,
    toggleKey,
    timeRanges,
    selectedRange,
    onRangeChange,
    onItemClick,
    meta: { curve, enableArea, enablePoints, lineWidth },
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

      {safeData.length > 1 && (
        <div className="mb-3">
          {renderSlot(slots?.legend, slotProps?.legend) ?? (
            <ChartLegend items={legendItems} onToggleItem={toggleKey} />
          )}
        </div>
      )}

      {renderSlot(
        slots?.canvas,
        {
          ref,
          height,
          isLoading,
          isEmpty: safeData.length === 0 || visibleData.length === 0,
          onContextMenu: ((slotProps?.chart as any)?.onContextMenu || slotProps?.container?.onContextMenu) as any,
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
          isEmpty={safeData.length === 0 || visibleData.length === 0}
          onContextMenu={((slotProps?.chart as any)?.onContextMenu || slotProps?.container?.onContextMenu) as any}
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

export const LineChart = createInterfaceComponent<LineChartProps, LineChartSlots>(
  {
    name: 'LineChart',
    category: 'data',
    description: 'Continuous multi-series time-series and relationship graph with responsive tooltips.',
    version: '1.0.0',
    props: {
      height: 360,
      curve: 'monotoneX',
      palette: 'brand',
      enablePoints: true,
      enableGridY: true,
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
    },
  },
  LineChartPrimitive
)

// Namespace attachments for compound family ergonomics
LineChart.Provider = LineChartProvider
LineChart.Container = ChartContainer
LineChart.Header = ChartHeader
LineChart.Toolbar = ChartToolbar
LineChart.Legend = ChartLegend
LineChart.Canvas = ChartCanvas
LineChart.Tooltip = ChartTooltip
LineChart.Empty = ChartEmptyState
LineChart.Loading = ChartLoadingState
LineChart.Footer = ChartFooter
