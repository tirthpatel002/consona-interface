import React, { useMemo, useState } from 'react'
import { ResponsivePie, ResponsivePieCanvas, type MayHaveLabel, type PieSvgProps } from '@nivo/pie'
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
import { cn } from '../../../../core/cn'
import type {
  ChartContainerVariant,
  ChartMargin,
  ChartTimeRange,
} from '../../types/common'

export interface PieChartDatum {
  id: string | number
  /** Descriptive text label displayed alongside the metric. */
  /** Descriptive text label displayed alongside the metric. */
  label?: string
  value: number
  color?: string
}

export interface PieCenterMetricSlotProps {
  /** Total aggregate value displayed in the center metric display. */
  total: number
  label?: string
  /** Currently active or hovered chart datum record. */
  /** Currently active or hovered chart datum record. */
  activeDatum?: PieChartDatum | null
}

/* ==========================================================================
   Context
   ========================================================================== */

export const PieChartContext = ChartContext
export const PieChartProvider = ChartProvider
export const usePieChartContext = useChartContext

/* ==========================================================================
   Center Metric Sub-Atom
   ========================================================================== */

export interface PieCenterMetricProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Total aggregate value displayed in the center metric display. */
  total?: number
  /** Label describing the center metric aggregate. */
  label?: string
  /** Currently active or hovered slice datum. */
  activeDatum?: PieChartDatum | null
}

const PieCenterMetricPrimitive = ({
  className,
  total: propTotal,
  label = 'Total',
  activeDatum,
  children,
  style,
  ...props
}: PieCenterMetricProps) => {
  const ctx = useChartContext()
  const computedTotal =
    propTotal ??
    (Array.isArray(ctx.data)
      ? (ctx.data as PieChartDatum[]).reduce((acc, curr) => acc + (curr.value || 0), 0)
      : 0)

  if (children != null) {
    return (
      <div
        data-slot="pie-center-metric"
        className={cn(
          'absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center select-none',
          className
        )}
        style={style}
        {...props}
      >
        {children}
      </div>
    )
  }

  return (
    <div
      data-slot="pie-center-metric"
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center select-none',
        className
      )}
      style={style}
      {...props}
    >
      <span className="text-xl sm:text-2xl font-black text-fg tracking-tight">
        {computedTotal.toLocaleString()}
      </span>
      <span className="text-3xs uppercase tracking-wider font-semibold text-muted-fg">
        {label}
      </span>
    </div>
  )
}

export const PieCenterMetric = createInterfaceComponent<PieCenterMetricProps>(
  {
    name: 'PieCenterMetric',
    category: 'data',
    description: 'Centered metric readout for donut pie charts.',
    version: '1.0.0',
  },
  PieCenterMetricPrimitive
)

/* ==========================================================================
   Pie Chart Slots & Props Interfaces
   ========================================================================== */

export interface PieChartSlots {
  /** Outer container card / surface */
  container?: React.ComponentType<ChartContainerProps>
  /** Interactive chart canvas viewport container */
  canvas?: React.ComponentType<ChartCanvasProps>
  /** Underlying chart engine instance */
  chart?: React.ComponentType<PieSvgProps<any> & { onContextMenu?: (...args: any[]) => void }>
  /** Top header with title and stats */
  header?: React.ComponentType<ChartHeaderProps>
  /** Action / time range toolbar */
  toolbar?: React.ComponentType<ChartToolbarProps>
  /** Series legend indicator */
  legend?: React.ComponentType<ChartLegendProps>
  /** Centered donut hole metric readout */
  centerMetric?: SlotDefinition<PieCenterMetricSlotProps>
  /** Custom hover tooltip card */
  tooltip?: SlotDefinition<ChartTooltipProps>
  /** Empty state when no data exists */
  empty?: React.ComponentType<ChartEmptyStateProps>
  /** Loading placeholder */
  loading?: React.ComponentType<ChartLoadingStateProps>
  /** Summary footer */
  footer?: React.ComponentType<ChartFooterProps>
}

export interface PieChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'onClick' | 'onContextMenu'> {
  /** Slice dataset with id, value, and optional label/color. */
  data?: PieChartDatum[]
  /** Rendering engine: 'svg' or 'canvas' (default: 'svg'). */
  engine?: 'svg' | 'canvas'
  /** Donut inner radius ratio (0.0 = full pie, 0.6 = donut hole, default: 0.6). */
  innerRadius?: number
  /** Spacing angle between adjacent slices in degrees (default: 1.5). */
  padAngle?: number
  /** Border radius curvature of arc corners in pixels (default: 4). */
  cornerRadius?: number
  /** Chart height in pixels (default: 360). */
  height?: number | string
  /** Aspect ratio multiplier. Overrides height if set. */
  aspectRatio?: number
  /** Outer SVG chart margins. */
  margin?: ChartMargin
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
  /** Controlled currently selected time range */
  selectedRange?: ChartTimeRange
  /** Default selected time range when uncontrolled */
  defaultRange?: ChartTimeRange
  /** Callback fired when a time range is selected */
  onRangeChange?: (range: ChartTimeRange) => void
  /** Whether to render arc labels on the slices (default: false). */
  enableArcLabels?: boolean
  /** Whether to render arc link labels outside the pie (default: false). */
  enableArcLinkLabels?: boolean
  /** Active slice outward expansion distance in pixels (default: 6). */
  activeOuterRadiusOffset?: number
  /** Value format callback or string */
  valueFormat?: string | ((val: number) => string)
  /** Custom SVG defs (patterns, gradients) */
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
  slots?: SlotComponents<PieChartSlots>
  /** Slot props overrides for downstream customization. */
  slotProps?: SlotPropsMap<PieChartSlots>
  className?: string
  style?: React.CSSProperties
}

/* ==========================================================================
   Pie Chart Primitive
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

function PieChartPrimitive({
  data = [],
  engine = 'svg',
  innerRadius = 0.6,
  padAngle = 1.5,
  cornerRadius = 4,
  height = 360,
  aspectRatio,
  margin = { top: 20, right: 20, bottom: 20, left: 20 },
  palette = 'categorical',
  containerVariant = 'default',
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
  enableArcLabels = false,
  enableArcLinkLabels = false,
  activeOuterRadiusOffset = 6,
  valueFormat,
  chartProps,
  nivoProps,
  onItemClick,
  containerProps,
  slots = {},
  slotProps = {},
  className,
  style,
  children,
}: PieChartProps) {
  const { theme, colors } = useChartTheme({ palette })
  const { ref, width, isReady } = useChartDimensions({ height, aspectRatio })
  const hoveredDatumRef = React.useRef<any>(null)
  const safeData = useMemo(() => {
    if (!Array.isArray(data)) return []
    return data.filter(
      (d): d is PieChartDatum =>
        Boolean(d && typeof d === 'object' && d.id != null && typeof d.value === 'number' && Number.isFinite(d.value))
    )
  }, [data])
  const safeColors = Array.isArray(colors) && colors.length > 0 ? colors : ['#3157D5']
  const [hiddenIds, setHiddenIds] = useState<Record<string, boolean>>({})

  const visibleData = safeData.filter((d) => !hiddenIds[String(d?.id)])

  const total = useMemo(() => {
    return visibleData.reduce((acc, curr) => acc + (curr?.value || 0), 0)
  }, [visibleData])

  const legendItems = safeData.map((d, idx) => ({
    id: String(d?.id ?? idx),
    label: d?.label || String(d?.id ?? idx),
    color: d?.color || safeColors[idx % safeColors.length] || '#3157D5',
    hidden: Boolean(hiddenIds[String(d?.id ?? idx)]),
  }))

  const toggleKey = (id: string) => {
    setHiddenIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const defaultChartProps = {
    data: visibleData,
    margin,
    innerRadius,
    padAngle,
    cornerRadius,
    activeOuterRadiusOffset,
    colors: safeColors,
    enableArcLabels,
    enableArcLinkLabels,
    arcLinkLabelsTextColor: 'var(--muted-fg, #6b7280)',
    arcLinkLabelsThickness: 1.5,
    arcLinkLabelsColor: { from: 'color' },
    valueFormat,
    theme,
    ...(defs ? { defs } : {}),
    ...(fill ? { fill } : {}),
    ...(onItemClick ? { onClick: onItemClick } : {}),
    tooltip: ({ datum }: any) => {
      if (!datum) return null
      hoveredDatumRef.current = datum
      const compositeTooltip = findTooltipElement(children)
      if (compositeTooltip) {
        const tooltipPayload = {
          title: String(datum.label || datum.id || ''),
          label: 'Value',
          value: datum.formattedValue,
          color: datum.color,
          badge: `${((datum.value / (total || 1)) * 100).toFixed(1)}%`,
          datum,
          data: datum.data,
          arc: datum,
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
          title: String(datum.label || datum.id || ''),
          label: 'Value',
          value: datum.formattedValue,
          color: datum.color,
          badge: `${((datum.value / (total || 1)) * 100).toFixed(1)}%`,
          datum,
          data: datum.data,
          arc: datum,
          ...(slotProps.tooltip as any),
        })
      }
      return (
        <ChartTooltip
          title={String(datum.label || datum.id || '')}
          label="Share"
          value={datum.formattedValue}
          badge={`${((datum.value / (total || 1)) * 100).toFixed(1)}%`}
          color={datum.color}
        />
      )
    },
    ...chartProps,
    ...nivoProps,
    ...(slotProps.chart as any),
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

  const ChartComponent = engine === 'canvas' ? ResponsivePieCanvas : ResponsivePie

  const visualizerNode = (
    visibleData.length === 0 ? (
      renderSlot(slots.empty, slotProps.empty) ?? <ChartEmptyState />
    ) : (
      <>
        {renderSlot(slots.chart, { ...defaultChartProps, ...slotProps?.chart }, { defaultComponent: ChartComponent as any }) ?? (
          <ChartComponent {...(defaultChartProps as any)} />
        )}
        {innerRadius > 0 && (
          renderSlot(slots.centerMetric, { total, ...(slotProps.centerMetric as any) }) ?? (
            <PieCenterMetric total={total} />
          )
        )}
      </>
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
    meta: { total, innerRadius, sliceCount: safeData.length },
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

export const PieChart = createInterfaceComponent<PieChartProps, PieChartSlots>(
  {
    name: 'PieChart',
    category: 'data',
    description: 'Precision radial partition and donut chart visualizing proportional metrics.',
    version: '1.0.0',
    props: {
      innerRadius: 0.6,
      padAngle: 1.5,
      cornerRadius: 4,
      height: 360,
      palette: 'categorical',
    },
    slots: {
      container: undefined,
      canvas: undefined,
      chart: undefined,
      header: undefined,
      toolbar: undefined,
      legend: undefined,
      centerMetric: undefined,
      tooltip: undefined,
      empty: undefined,
      loading: undefined,
      footer: undefined,
    },
  },
  PieChartPrimitive
)

// Namespace attachments for compound family ergonomics
PieChart.Provider = PieChartProvider
PieChart.Container = ChartContainer
PieChart.Header = ChartHeader
PieChart.Toolbar = ChartToolbar
PieChart.Legend = ChartLegend
PieChart.Canvas = ChartCanvas
PieChart.CenterMetric = PieCenterMetric
PieChart.Tooltip = ChartTooltip
PieChart.Empty = ChartEmptyState
PieChart.Loading = ChartLoadingState
PieChart.Footer = ChartFooter
