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

export const AreaChartContext = ChartContext
export const AreaChartProvider = ChartProvider
export const useAreaChartContext = useChartContext

/* ==========================================================================
   Area Chart Slots & Props Interfaces
   ========================================================================== */

export interface AreaChartSlots {
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
  /** Empty state when no data exists */
  empty?: React.ComponentType<ChartEmptyStateProps>
  /** Loading placeholder */
  loading?: React.ComponentType<ChartLoadingStateProps>
  /** Summary footer */
  footer?: React.ComponentType<ChartFooterProps>
}

export interface AreaChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'onClick' | 'onContextMenu'> {
  /** Multi-series or single-series data formatted as Nivo line series array. */
  data?: any[]
  /** Rendering engine: 'svg' or 'canvas' (default: 'svg'). */
  engine?: 'svg' | 'canvas'
  /** Chart height in pixels (default: 360). */
  height?: number | string
  /** Aspect ratio multiplier (e.g. 16/9, 2/1). Overrides height if set. */
  aspectRatio?: number
  /** Outer SVG chart margins. */
  margin?: ChartMargin
  /** Curve interpolation type ('monotoneX' | 'natural' | 'catmullRom' | 'linear' | 'step'). */
  curve?: 'monotoneX' | 'natural' | 'catmullRom' | 'linear' | 'step'
  /** Color palette name ('categorical' | 'brand' | 'emerald' | 'amber' | 'violet') or color array. */
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
  /** Area fill opacity (0.0 - 1.0, default: 0.25). */
  areaOpacity?: number
  /** Line stroke width in pixels (default: 2.5). */
  lineWidth?: number
  /** Whether to enable point markers on the lines (default: false). */
  enablePoints?: boolean
  /** Whether to show grid horizontal and vertical lines (default: true). */
  enableGridX?: boolean
  /** Whether to show vertical grid lines (default: false). */
  enableGridY?: boolean
  /** Format function or string for Y-axis ticks */
  yFormat?: string | ((val: any) => string)
  /** Format function or string for X-axis ticks */
  xFormat?: string | ((val: any) => string)
  /** Custom SVG defs (gradients, patterns) */
  defs?: any[]
  /** Fill pattern match rules */
  fill?: any[]
  /** Pass-through props directly forwarded to the underlying Nivo chart instance */
  chartProps?: Record<string, any>
  /** Additional raw Nivo engine props */
  nivoProps?: Record<string, any>
  /** Item click callback */
  onItemClick?: (datum: any, event: React.MouseEvent) => void
  /** Props forwarded to the outer ChartContainer card */
  containerProps?: React.HTMLAttributes<HTMLDivElement>
  /** Slot overrides for downstream customization. */
  slots?: SlotComponents<AreaChartSlots>
  /** Slot props overrides for downstream customization. */
  slotProps?: SlotPropsMap<AreaChartSlots>
  className?: string
  style?: React.CSSProperties
}

/* ==========================================================================
   Area Chart Primitive
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

function AreaChartPrimitive({
  data = [],
  engine = 'svg',
  height = 360,
  aspectRatio,
  margin = { top: 20, right: 20, bottom: 40, left: 50 },
  curve = 'monotoneX',
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
  areaOpacity = 0.25,
  lineWidth = 2.5,
  enablePoints = false,
  enableGridX = false,
  enableGridY = true,
  yFormat,
  xFormat,
  defs,
  fill,
  chartProps,
  nivoProps,
  onItemClick,
  containerProps,
  slots = {},
  slotProps = {},
  className,
  style,
  children,
}: AreaChartProps) {
  const { theme, colors } = useChartTheme({ palette })
  const { ref, width, isReady } = useChartDimensions({ height, aspectRatio })
  const hoveredDatumRef = React.useRef<any>(null)
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
    enableArea: true,
    areaOpacity,
    enablePoints,
    pointSize: 6,
    pointColor: { theme: 'background' },
    pointBorderWidth: 2,
    pointBorderColor: { from: 'serieColor' },
    enableGridX,
    enableGridY,
    colors: safeColors,
    yFormat,
    xFormat,
    theme,
    useMesh: true,
    ...(defs ? { defs } : {}),
    ...(fill ? { fill } : {}),
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
    ...(onItemClick ? { onClick: onItemClick } : {}),
    tooltip: (props: any) => {
      const point = props?.point || props?.datum || props
      if (!point) return null
      hoveredDatumRef.current = point
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

  const handleCanvasContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    const chartContextMenu = (slotProps?.chart as any)?.onContextMenu
    const containerContextMenu = slotProps?.container?.onContextMenu
    if (chartContextMenu) {
      if (hoveredDatumRef.current != null) {
        chartContextMenu(hoveredDatumRef.current, e)
      } else {
        chartContextMenu(e)
      }
    }
    if (containerContextMenu && containerContextMenu !== chartContextMenu) {
      containerContextMenu(e)
    }
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
    meta: {
      seriesCount: safeData.length,
      visibleCount: visibleData.length,
      curve,
      areaOpacity,
    },
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
          isEmpty: safeData.length === 0,
          onContextMenu: handleCanvasContextMenu,
          onPointerLeave: () => {
            hoveredDatumRef.current = null
          },
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
          onContextMenu={handleCanvasContextMenu}
          onPointerLeave={() => {
            hoveredDatumRef.current = null
          }}
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

export const AreaChart = createInterfaceComponent<AreaChartProps, AreaChartSlots>(
  {
    name: 'AreaChart',
    category: 'data',
    description: 'High-performance area visualizer supporting gradient fills, multi-series curves, and dynamic token theming.',
    version: '1.0.0',
    props: {
      height: 360,
      curve: 'monotoneX',
      palette: 'brand',
      areaOpacity: 0.25,
      lineWidth: 2.5,
      enablePoints: false,
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
  AreaChartPrimitive
)

// Namespace attachments for compound family ergonomics
AreaChart.Provider = AreaChartProvider
AreaChart.Container = ChartContainer
AreaChart.Header = ChartHeader
AreaChart.Toolbar = ChartToolbar
AreaChart.Legend = ChartLegend
AreaChart.Canvas = ChartCanvas
AreaChart.Tooltip = ChartTooltip
AreaChart.Empty = ChartEmptyState
AreaChart.Loading = ChartLoadingState
AreaChart.Footer = ChartFooter
