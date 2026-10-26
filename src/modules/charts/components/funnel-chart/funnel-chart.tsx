import React from 'react'
import { ResponsiveFunnel, type FunnelDatum } from '@nivo/funnel'
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

export const FunnelChartContext = ChartContext
export const FunnelChartProvider = ChartProvider
export const useFunnelChartContext = useChartContext

/* ==========================================================================
   Funnel Chart Slots & Props Interfaces
   ========================================================================== */

export interface FunnelChartSlots {
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

export interface FunnelChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'onClick' | 'onContextMenu'> {
  /** Sequential stage dataset array with id, value, and label. */
  data?: FunnelDatum[]
  /** Chart height in pixels (default: 360). */
  height?: number | string
  /** Aspect ratio multiplier. Overrides height if set. */
  aspectRatio?: number
  /** Outer SVG chart margins. */
  margin?: ChartMargin
  /** Direction of the funnel: 'vertical' or 'horizontal' (default: 'vertical'). */
  direction?: 'vertical' | 'horizontal'
  /** Shape curve interpolation ('smooth' | 'linear', default: 'smooth'). */
  interpolation?: 'smooth' | 'linear'
  /** Spacing between funnel stages in pixels (default: 2). */
  spacing?: number
  /** Border width of the funnel sections in pixels (default: 1). */
  borderWidth?: number
  /** Color palette name or color array. */
  palette?: string | string[]
  /** Custom SVG pattern / gradient defs */
  defs?: any[]
  /** Custom fill mappings linking data ids to pattern defs */
  fill?: any[]
  /** Layer sequence override supporting custom SVG/Canvas rendering functions */
  layers?: any[]
  /** Extension size for current hovered part */
  currentPartSizeExtension?: number
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
  /** Callback when a funnel part/stage is clicked */
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
  slots?: SlotComponents<FunnelChartSlots>
  /** Slot props overrides for downstream customization. */
  slotProps?: SlotPropsMap<FunnelChartSlots>
  className?: string
  style?: React.CSSProperties
}

/* ==========================================================================
   Funnel Chart Primitive
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

function FunnelChartPrimitive({
  data = [],
  height = 360,
  aspectRatio,
  margin = { top: 20, right: 20, bottom: 20, left: 20 },
  direction = 'vertical',
  interpolation = 'smooth',
  spacing = 2,
  borderWidth = 1,
  palette = 'brand',
  defs,
  fill,
  layers,
  currentPartSizeExtension,
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
}: FunnelChartProps) {
  const { theme, colors } = useChartTheme({ palette })
  const { ref, width, isReady } = useChartDimensions({ height, aspectRatio })

  const safeData = React.useMemo(() => {
    if (!Array.isArray(data)) return []
    return data.filter(
      (d): d is NonNullable<FunnelChartProps['data']>[number] =>
        Boolean(d && typeof d === 'object' && d.id != null && typeof d.value === 'number' && Number.isFinite(d.value))
    )
  }, [data])
  const safeColors = Array.isArray(colors) && colors.length > 0 ? colors : ['#3157D5']

  const legendItems = React.useMemo(() => {
    return safeData.map((d, i) => ({
      id: String(d.id),
      label: String(d.label || d.id),
      color: safeColors[i % safeColors.length] || '#3157D5',
      value: d.value,
    }))
  }, [safeData, safeColors])

  const defaultChartProps = {
    data: safeData,
    margin,
    direction,
    interpolation,
    spacing,
    borderWidth,
    borderColor: 'var(--border, #e5e7eb)',
    colors: safeColors,
    valueFormat,
    theme,
    ...(defs ? { defs } : {}),
    ...(fill ? { fill } : {}),
    ...(layers ? { layers } : {}),
    ...(currentPartSizeExtension !== undefined ? { currentPartSizeExtension } : {}),
    onClick: (part: any, event: any) => {
      onItemClick?.(part, event)
        ; (slotProps.chart as any)?.onClick?.(part, event)
    },
    tooltip: (props: any) => {
      const part = props?.part || props?.datum || props?.data || props
      if (!part) return null
      const partId = String(part.data?.id ?? part.id ?? '')
      const partLabel = String(part.data?.label ?? part.label ?? partId)
      const currentVal = Number(part.data?.value ?? part.value ?? 0)
      const formattedVal = part.formattedValue ?? currentVal.toLocaleString()
      const color = part.color

      const currentIndex = safeData.findIndex(
        (d) => String(d.id) === partId || String(d.label) === partLabel
      )
      const topVal = safeData[0]?.value ?? currentVal
      const prevVal = currentIndex > 0 ? (safeData[currentIndex - 1]?.value ?? null) : null

      const overallPercent = topVal > 0 ? ((currentVal / topVal) * 100).toFixed(1) : '100.0'
      const dropFromPrev = prevVal && prevVal > 0 && prevVal > currentVal
        ? (((prevVal - currentVal) / prevVal) * 100).toFixed(1)
        : null
      const stepConversion = prevVal && prevVal > 0
        ? ((currentVal / prevVal) * 100).toFixed(1)
        : null

      const stageInfo = currentIndex >= 0 ? `Stage ${currentIndex + 1} of ${safeData.length}` : 'Stage'
      const badgeText = `${stageInfo} • ${overallPercent}% of Total`

      const compositeTooltip = findTooltipElement(children)
      if (compositeTooltip) {
        const tooltipPayload = {
          title: partLabel,
          label: 'Stage Volume',
          value: formattedVal,
          color,
          badge: badgeText,
          overallPercent,
          dropFromPrev,
          stepConversion,
          part,
          datum: part.data || part,
          data: part.data || part,
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
          title: partLabel,
          label: 'Stage Volume',
          value: formattedVal,
          color,
          badge: badgeText,
          overallPercent,
          dropFromPrev,
          stepConversion,
          part,
          datum: part.data || part,
          data: part.data || part,
          ...slotProps?.tooltip,
        })
      }
      return (
        <ChartTooltip title={partLabel} badge={badgeText}>
          <ChartTooltip.Row>
            <div className="flex items-center gap-1.5">
              <ChartTooltip.Indicator color={color} shape="circle" />
              <span className="text-muted-fg">Stage Volume:</span>
            </div>
            <ChartTooltip.Value>{formattedVal}</ChartTooltip.Value>
          </ChartTooltip.Row>
          {currentIndex > 0 && (
            <ChartTooltip.Row>
              <span className="text-muted-fg text-2xs">Drop from Prev:</span>
              <span className="text-danger font-mono font-semibold text-2xs">
                {dropFromPrev ? `-${dropFromPrev}%` : '0.0%'}
              </span>
            </ChartTooltip.Row>
          )}
          {currentIndex > 0 && stepConversion && (
            <ChartTooltip.Row>
              <span className="text-muted-fg text-2xs">Step Retention:</span>
              <span className="text-success font-mono font-semibold text-2xs">
                {stepConversion}%
              </span>
            </ChartTooltip.Row>
          )}
        </ChartTooltip>
      )
    },
    ...chartProps,
    ...nivoProps,
    ...(slotProps?.chart as any),
  }

  const visualizerNode = (
    safeData.length === 0 ? (
      renderSlot(slots?.empty, slotProps?.empty) ?? <ChartEmptyState />
    ) : (
      renderSlot(slots?.chart, { ...defaultChartProps, ...slotProps?.chart }, { defaultComponent: ResponsiveFunnel as any }) ?? (
        <ResponsiveFunnel {...defaultChartProps} />
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
    meta: { direction, interpolation, spacing, borderWidth },
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

  const containerContent = (
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
    children: containerContent,
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

export const FunnelChart = createInterfaceComponent<FunnelChartProps, FunnelChartSlots>(
  {
    name: 'FunnelChart',
    category: 'data',
    description: 'Stage-by-stage pipeline conversion visualizer measuring drop-off rates.',
    version: '1.0.0',
    props: {
      height: 360,
      direction: 'vertical',
      interpolation: 'smooth',
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
  FunnelChartPrimitive
)

// Namespace attachments for compound family ergonomics
FunnelChart.Provider = FunnelChartProvider
FunnelChart.Container = ChartContainer
FunnelChart.Header = ChartHeader
FunnelChart.Toolbar = ChartToolbar
FunnelChart.Legend = ChartLegend
FunnelChart.Canvas = ChartCanvas
FunnelChart.Tooltip = ChartTooltip
FunnelChart.Empty = ChartEmptyState
FunnelChart.Loading = ChartLoadingState
FunnelChart.Footer = ChartFooter
