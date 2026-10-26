import React, { useState } from 'react'
import { ResponsiveScatterPlot, ResponsiveScatterPlotCanvas, type ScatterPlotRawSerie, type ScatterPlotSvgProps } from '@nivo/scatterplot'
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

export interface ScatterDatumPoint {
  x: number | string
  y: number | string
  size?: number
  [key: string]: any
}

export interface ScatterSerieRecord {
  id: string
  data: ScatterDatumPoint[]
}

/* ==========================================================================
   Context
   ========================================================================== */

export const ScatterChartContext = ChartContext
export const ScatterChartProvider = ChartProvider
export const useScatterChartContext = useChartContext

/* ==========================================================================
   Scatter Chart Slots & Props Interfaces
   ========================================================================== */

export interface ScatterChartSlots {
  /** Outer container card / surface */
  container?: React.ComponentType<ChartContainerProps>
  /** Interactive chart canvas viewport container */
  canvas?: React.ComponentType<ChartCanvasProps>
  /** Underlying chart engine instance */
  chart?: React.ComponentType<ScatterPlotSvgProps<any>>
  /** Custom node / point renderer */
  item?: React.ComponentType<Record<string, unknown>>
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

export interface ScatterChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'onClick' | 'onContextMenu'> {
  /** Multi-series scatter point datasets with id and array of {x, y, size}. */
  data?: ScatterSerieRecord[]
  /** Rendering engine: 'svg' or 'canvas' (default: 'svg'). */
  engine?: 'svg' | 'canvas'
  /** Chart height in pixels (default: 360). */
  height?: number | string
  /** Aspect ratio multiplier. Overrides height if set. */
  aspectRatio?: number
  /** Outer SVG chart margins. */
  margin?: ChartMargin
  /** Diameter of scatter node bubbles in pixels (default: 8). */
  nodeSize?: number
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
  /** Callback when a scatter node is clicked */
  onItemClick?: (datum: any, event: React.MouseEvent) => void
  /** Custom node renderer component (e.g., custom SVG Avatars, icons) */
  nodeComponent?: React.ComponentType<Record<string, unknown>>
  /** Custom SVG defs (patterns, gradients, clipPaths) */
  defs?: any[]
  /** Fill pattern match rules */
  fill?: any[]
  /** Format function or string for Y-axis ticks */
  yFormat?: string | ((val: any) => string)
  /** Format function or string for X-axis ticks */
  xFormat?: string | ((val: any) => string)
  /** Pass-through props directly to underlying chart component */
  chartProps?: Record<string, any>
  /** Alias for chartProps */
  nivoProps?: Record<string, any>
  /** Props forwarded to the outer ChartContainer card */
  containerProps?: React.HTMLAttributes<HTMLDivElement>
  /** Slot overrides for downstream customization. */
  slots?: SlotComponents<ScatterChartSlots>
  /** Slot props overrides for downstream customization. */
  slotProps?: SlotPropsMap<ScatterChartSlots>
  className?: string
  style?: React.CSSProperties
}

/* ==========================================================================
   Scatter Chart Primitive
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

function ScatterChartPrimitive({
  data = [],
  engine = 'svg',
  height = 360,
  aspectRatio,
  margin = { top: 20, right: 20, bottom: 40, left: 50 },
  nodeSize = 8,
  palette = 'categorical',
  containerVariant = 'default',
  nodeComponent: nodeComponentProp,
  defs,
  fill,
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
}: ScatterChartProps) {
  const { theme, colors } = useChartTheme({ palette })
  const { ref, width, isReady } = useChartDimensions({ height, aspectRatio })
  const safeData = React.useMemo(() => {
    if (!Array.isArray(data)) return []
    return data
      .filter((s): s is NonNullable<ScatterChartProps['data']>[number] => Boolean(s && typeof s === 'object' && s.id != null && Array.isArray(s.data)))
      .map((s) => ({
        ...s,
        data: s.data.filter(
          (p: any) => p != null && typeof p === 'object' && p.x !== undefined && p.x !== null && p.y !== undefined && p.y !== null
        ),
      }))
      .filter((s) => s.data.length > 0)
  }, [data])
  const safeColors = Array.isArray(colors) && colors.length > 0 ? colors : ['#3157D5']
  const [hiddenSeries, setHiddenSeries] = useState<Record<string, boolean>>({})

  const visibleData = safeData.filter((s) => s && s.id != null && !hiddenSeries[String(s.id)])

  const legendItems = safeData.map((s, idx) => ({
    id: String(s?.id ?? idx),
    label: String(s?.id ?? idx),
    color: safeColors[idx % safeColors.length] || '#3157D5',
    hidden: Boolean(hiddenSeries[String(s?.id ?? idx)]),
  }))

  const toggleSeries = (id: string) => {
    setHiddenSeries((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const resolvedNodeComponent =
    slots.item ||
    slotProps.chart?.nodeComponent ||
    nodeComponentProp

  const defaultChartProps = {
    data: visibleData as any,
    margin,
    nodeSize,
    colors: safeColors,
    xFormat,
    yFormat,
    theme,
    useMesh: true,
    ...(resolvedNodeComponent ? { nodeComponent: resolvedNodeComponent } : {}),
    ...(defs ? { defs } : {}),
    ...(fill ? { fill } : {}),
    onClick: (node: any, event: any) => {
      onItemClick?.(node, event)
      slotProps.chart?.onClick?.(node, event)
    },
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
    tooltip: (props: any) => {
      const node = props?.node || props?.datum || props
      if (!node) return null
      const title = String(node.serieId ?? '')
      const xVal = node.data?.formattedX ?? node.data?.x ?? ''
      const yVal = node.data?.formattedY ?? node.data?.y ?? ''
      const label = `(${xVal}, ${yVal})`
      const sizeVal = node.data?.size ? `Size: ${node.data.size}` : undefined
      const color = node.style?.color || node.color

      const compositeTooltip = findTooltipElement(children)
      if (compositeTooltip) {
        const tooltipPayload = {
          title,
          label,
          value: sizeVal || `${xVal}, ${yVal}`,
          color,
          node,
          datum: node.data || node,
          data: node.data || node,
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
      if (slots.tooltip) {
        return renderSlot(slots.tooltip, {
          ...slotProps?.tooltip,
          title,
          label,
          value: sizeVal || `${xVal}, ${yVal}`,
          color,
          node,
          datum: node.data || node,
          data: node.data || node,
          ...(slotProps.tooltip as any),
        })
      }
      return (
        <ChartTooltip
          title={title}
          label={label}
          value={sizeVal || `${xVal}, ${yVal}`}
          color={color}
        />
      )
    },
    ...chartProps,
    ...nivoProps,
    ...(slotProps.chart as any),
  }

  const ChartComponent = engine === 'canvas' ? ResponsiveScatterPlotCanvas : ResponsiveScatterPlot

  const visualizerNode = (
    safeData.length === 0 || visibleData.length === 0 ? (
      renderSlot(slots.empty, slotProps.empty) ?? <ChartEmptyState />
    ) : (
      renderSlot(slots.chart, { ...defaultChartProps, ...(slotProps.chart as any) }, { defaultComponent: ChartComponent as any }) ?? (
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
    toggleKey: toggleSeries,
    timeRanges,
    selectedRange,
    onRangeChange,
    onItemClick,
    meta: { engine, nodeSize },
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
        {renderSlot(slots.header, slotProps.header) ?? (
          (title || description || badge) && (
            <ChartHeader
              title={title}
              description={description}
              badge={badge}
            />
          )
        )}
        {renderSlot(slots.toolbar, slotProps.toolbar) ?? (
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
          {renderSlot(slots.legend, slotProps.legend) ?? (
            <ChartLegend items={legendItems} onToggleItem={toggleSeries} />
          )}
        </div>
      )}

      {renderSlot(
        slots.canvas,
        {
          ref,
          height,
          isLoading,
          isEmpty: safeData.length === 0 || visibleData.length === 0,
          onContextMenu: ((slotProps?.chart as any)?.onContextMenu || slotProps?.container?.onContextMenu) as any,
          ...slotProps?.canvas,
          children: isLoading ? (
            renderSlot(slots.loading, slotProps.loading) ?? <ChartLoadingState />
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
            renderSlot(slots.loading, slotProps.loading) ?? <ChartLoadingState />
          ) : (
            visualizerNode
          )}
        </ChartCanvas>
      )}

      {renderSlot(slots.footer, slotProps.footer)}
    </>
  )

  const containerMergedProps = {
    variant: containerVariant,
    className,
    style,
    ...containerProps,
    ...(slotProps.container as any),
    children: defaultContainerContent,
  }

  return (
    <ChartProvider value={contextValue}>
      {renderSlot(slots.container, { ...slotProps?.container, ...containerMergedProps }, { defaultComponent: ChartContainer }) ?? (
        <ChartContainer {...containerMergedProps} />
      )}
    </ChartProvider>
  )
}

/* ==========================================================================
   Factory & Compound Attachments
   ========================================================================== */

export const ScatterChart = createInterfaceComponent<ScatterChartProps, ScatterChartSlots>(
  {
    name: 'ScatterChart',
    category: 'data',
    description: 'Multi-dimensional correlation plot placing point clusters across continuous axes.',
    version: '1.0.0',
    props: {
      height: 360,
      nodeSize: 8,
      palette: 'categorical',
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
  ScatterChartPrimitive
)

// Namespace attachments for compound family ergonomics
ScatterChart.Provider = ScatterChartProvider
ScatterChart.Container = ChartContainer
ScatterChart.Header = ChartHeader
ScatterChart.Toolbar = ChartToolbar
ScatterChart.Legend = ChartLegend
ScatterChart.Canvas = ChartCanvas
ScatterChart.Tooltip = ChartTooltip
ScatterChart.Empty = ChartEmptyState
ScatterChart.Loading = ChartLoadingState
ScatterChart.Footer = ChartFooter
