import React from 'react'
import { ResponsiveRadialBar, type RadialBarSvgProps } from '@nivo/radial-bar'
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

export const RadialBarChartContext = ChartContext
export const RadialBarChartProvider = ChartProvider
export const useRadialBarChartContext = useChartContext

/* ==========================================================================
   Radial Bar Chart Slots & Props Interfaces
   ========================================================================== */

export interface RadialBarChartSlots {
  /** Outer container card / surface */
  container?: React.ComponentType<ChartContainerProps>
  /** Interactive chart canvas viewport container */
  canvas?: React.ComponentType<ChartCanvasProps>
  /** Underlying chart engine instance */
  chart?: React.ComponentType<RadialBarSvgProps<any>>
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

export interface RadialBarChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'onClick' | 'onContextMenu'> {
  /** Radial bar series dataset with id and data points. */
  data?: Array<{ id: string; data: Array<{ x: string | number; y: number }> }>
  /** Maximum progress value (default: 'auto'). */
  maxValue?: number | 'auto'
  /** Start angle in degrees (default: 0). */
  startAngle?: number
  /** End angle in degrees (default: 360). */
  endAngle?: number
  /** Inner radius ratio (0.0 - 0.9, default: 0.3). */
  innerRadius?: number
  /** Spacing padding between adjacent concentric rings (default: 0.2). */
  padding?: number
  /** Arc corner radius in pixels (default: 4). */
  cornerRadius?: number
  /** Chart height in pixels (default: 360). */
  height?: number | string
  /** Aspect ratio multiplier. Overrides height if set. */
  aspectRatio?: number
  /** Outer SVG chart margins. */
  margin?: ChartMargin
  /** Color palette name or color array. */
  palette?: string | string[]
  /** Layer sequence override supporting custom SVG rendering functions */
  layers?: any[]
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
  /** Callback when a radial bar is clicked */
  onItemClick?: (datum: any, event: React.MouseEvent) => void
  /** Whether to show tracks behind the progress bars (default: true). */
  enableTracks?: boolean
  /** Alias for enableTracks */
  tracks?: boolean
  /** Whether to show circular grid lines (default: false). */
  enableCircularGrid?: boolean
  /** Alias for enableCircularGrid */
  circularGrid?: boolean
  /** Whether to show radial grid lines (default: false). */
  enableRadialGrid?: boolean
  /** Configuration for circular axis outer (default: null). */
  circularAxisOuter?: any
  /** Configuration for circular axis inner (default: null). */
  circularAxisInner?: any
  /** Configuration for radial axis start (default: null). */
  radialAxisStart?: any
  /** Configuration for radial axis end (default: null). */
  radialAxisEnd?: any
  /** Whether to enable arc labels directly on rings (default: false). */
  enableLabels?: boolean
  /** Value format callback or string */
  valueFormat?: string | ((val: number) => string)
  /** Pass-through props directly to underlying chart component */
  chartProps?: Record<string, any>
  /** Alias for chartProps */
  nivoProps?: Record<string, any>
  /** Props forwarded to the outer ChartContainer card */
  containerProps?: React.HTMLAttributes<HTMLDivElement>
  /** Slot overrides for downstream customization. */
  slots?: SlotComponents<RadialBarChartSlots>
  /** Slot props overrides for downstream customization. */
  slotProps?: SlotPropsMap<RadialBarChartSlots>
  className?: string
  style?: React.CSSProperties
}

/* ==========================================================================
   Radial Bar Chart Primitive
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

function RadialBarChartPrimitive({
  data = [],
  maxValue = 'auto',
  startAngle = 0,
  endAngle = 360,
  innerRadius = 0.3,
  padding = 0.2,
  cornerRadius = 4,
  height = 360,
  aspectRatio,
  margin = { top: 30, right: 30, bottom: 30, left: 30 },
  palette = 'brand',
  layers,
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
  enableTracks = true,
  tracks,
  enableCircularGrid = false,
  circularGrid,
  enableRadialGrid = false,
  circularAxisOuter = null,
  circularAxisInner = null,
  radialAxisStart = null,
  radialAxisEnd = null,
  enableLabels = false,
  valueFormat,
  chartProps,
  nivoProps,
  containerProps,
  slots = {},
  slotProps = {},
  className,
  style,
  children,
}: RadialBarChartProps) {
  const { theme, colors } = useChartTheme({ palette })
  const { ref, width, isReady } = useChartDimensions({ height, aspectRatio })
  const safeData = React.useMemo(() => {
    if (!Array.isArray(data)) return []
    return data
      .filter((d): d is NonNullable<RadialBarChartProps['data']>[number] => Boolean(d && typeof d === 'object' && d.id != null && Array.isArray(d.data)))
      .map((d) => ({
        ...d,
        data: d.data.filter(
          (p: any) =>
            p != null &&
            typeof p === 'object' &&
            p.x !== undefined &&
            p.x !== null &&
            typeof p.y === 'number' &&
            Number.isFinite(p.y)
        ),
      }))
      .filter((d) => d.data.length > 0)
  }, [data])
  const safeColors = Array.isArray(colors) && colors.length > 0 ? colors : ['#3157D5']
  const [hiddenIds, setHiddenIds] = React.useState<Record<string, boolean>>({})

  const visibleData = safeData.filter((d) => !hiddenIds[String(d?.id)])

  const legendItems = safeData.map((d, idx) => ({
    id: String(d?.id ?? idx),
    label: String(d?.id ?? idx),
    color: safeColors[idx % safeColors.length] || '#3157D5',
    hidden: Boolean(hiddenIds[String(d?.id ?? idx)]),
  }))

  const toggleKey = (id: string) => {
    setHiddenIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const resolvedTracks = tracks !== undefined ? tracks : enableTracks
  const resolvedCircularGrid = circularGrid !== undefined ? circularGrid : enableCircularGrid

  const defaultChartProps = {
    data: visibleData,
    maxValue,
    startAngle,
    endAngle,
    innerRadius,
    padding,
    cornerRadius,
    margin,
    colors: safeColors,
    enableTracks: resolvedTracks,
    tracksColor: 'var(--secondary, #f3f4f6)',
    enableCircularGrid: resolvedCircularGrid,
    enableRadialGrid,
    circularAxisOuter,
    circularAxisInner,
    radialAxisStart,
    radialAxisEnd,
    enableLabels,
    valueFormat,
    theme,
    ...(layers ? { layers } : {}),
    onClick: (bar: any, event: any) => {
      onItemClick?.(bar, event)
      slotProps.chart?.onClick?.(bar, event)
    },
    tooltip: (props: any) => {
      const bar = props?.bar || props?.datum || props?.data || props
      if (!bar) return null
      const title = String(bar.category || bar.groupId || bar.id || '')
      const label = String(bar.ringId || bar.label || bar.id || '')
      const value = bar.formattedValue ?? bar.value
      const color = bar.color
      const compositeTooltip = findTooltipElement(children)
      if (compositeTooltip) {
        const tooltipPayload = {
          title,
          label,
          value,
          color,
          bar,
          datum: bar,
          data: bar,
          ...(slotProps.tooltip as any),
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
          value,
          color,
          bar,
          datum: bar,
          data: bar,
          ...(slotProps.tooltip as any),
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
    ...(slotProps.chart as any),
  }

  const visualizerNode = (
    safeData.length === 0 || visibleData.length === 0 ? (
      renderSlot(slots.empty, slotProps.empty) ?? <ChartEmptyState />
    ) : (
      renderSlot(slots.chart, { ...defaultChartProps, ...(slotProps.chart as any) }, { defaultComponent: ResponsiveRadialBar as any }) ?? (
        <ResponsiveRadialBar {...defaultChartProps} />
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
    meta: { innerRadius, startAngle, endAngle, padding, cornerRadius },
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
          isEmpty={safeData.length === 0}
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

export const RadialBarChart = createInterfaceComponent<RadialBarChartProps, RadialBarChartSlots>(
  {
    name: 'RadialBarChart',
    category: 'data',
    description: 'Concentric ring visualizer illustrating multi-metric goal progression and radial volume.',
    version: '1.0.0',
    props: {
      height: 360,
      innerRadius: 0.3,
      padding: 0.2,
      cornerRadius: 4,
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
    },
  },
  RadialBarChartPrimitive
)

// Namespace attachments for compound family ergonomics
RadialBarChart.Provider = RadialBarChartProvider
RadialBarChart.Container = ChartContainer
RadialBarChart.Header = ChartHeader
RadialBarChart.Toolbar = ChartToolbar
RadialBarChart.Legend = ChartLegend
RadialBarChart.Canvas = ChartCanvas
RadialBarChart.Tooltip = ChartTooltip
RadialBarChart.Empty = ChartEmptyState
RadialBarChart.Loading = ChartLoadingState
RadialBarChart.Footer = ChartFooter
