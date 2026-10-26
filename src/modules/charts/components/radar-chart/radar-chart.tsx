import React, { useState } from 'react'
import { ResponsiveRadar, type RadarSvgProps } from '@nivo/radar'
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

export const RadarChartContext = ChartContext
export const RadarChartProvider = ChartProvider
export const useRadarChartContext = useChartContext

/* ==========================================================================
   Radar Chart Slots & Props Interfaces
   ========================================================================== */

export interface RadarChartSlots {
  /** Outer container card / surface */
  container?: React.ComponentType<ChartContainerProps>
  /** Interactive chart canvas viewport container */
  canvas?: React.ComponentType<ChartCanvasProps>
  /** Underlying chart engine instance */
  chart?: React.ComponentType<RadarSvgProps<any>>
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

export interface RadarChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'onClick' | 'onContextMenu'> {
  /** Multi-variable dataset array with an indexKey and series keys. */
  data?: Record<string, any>[]
  /** Key in datum representing the dimension axis (e.g. 'metric', 'skill', 'category'). */
  indexBy?: string
  /** Metric keys to plot as comparative radar polygons (e.g. ['candidateA', 'candidateB']). */
  keys?: string[]
  /** Chart height in pixels (default: 360). */
  height?: number | string
  /** Aspect ratio multiplier. Overrides height if set. */
  aspectRatio?: number
  /** Outer SVG chart margins. */
  margin?: ChartMargin
  /** Grid shape format: 'circular' or 'linear' (default: 'circular'). */
  gridShape?: 'circular' | 'linear'
  /** Curve interpolation type (default: 'linearClosed'). */
  curve?: 'linearClosed' | 'catmullRomClosed' | 'basisClosed'
  /** Number of concentric grid rings / levels (default: 5). */
  gridLevels?: number
  /** Fill opacity for radar polygons (0.0 - 1.0, default: 0.25). */
  fillOpacity?: number
  /** Outline stroke width in pixels (default: 2). */
  borderWidth?: number
  /** Vertex dot marker diameter in pixels (default: 6). */
  dotSize?: number
  /** Color palette name or color array. */
  palette?: string | string[]
  /** Custom SVG pattern / gradient defs */
  defs?: any[]
  /** Custom fill mappings linking data ids to pattern defs */
  fill?: any[]
  /** Layer sequence override supporting custom SVG/Canvas rendering functions */
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
  /** Callback when a radar item/slice is clicked */
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
  slots?: SlotComponents<RadarChartSlots>
  /** Slot props overrides for downstream customization. */
  slotProps?: SlotPropsMap<RadarChartSlots>
  className?: string
  style?: React.CSSProperties
}

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

function RadarChartPrimitive({
  data = [],
  indexBy = 'metric',
  keys = ['value'],
  height = 360,
  aspectRatio,
  margin = { top: 40, right: 40, bottom: 40, left: 40 },
  gridShape = 'circular',
  curve = 'linearClosed',
  gridLevels = 5,
  fillOpacity = 0.25,
  borderWidth = 2,
  dotSize = 6,
  palette = 'brand',
  defs,
  fill,
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
  valueFormat,
  chartProps,
  nivoProps,
  containerProps,
  slots = {},
  slotProps = {},
  className,
  style,
  children,
}: RadarChartProps) {
  const { theme, colors } = useChartTheme({ palette })
  const { ref, width, isReady } = useChartDimensions({ height, aspectRatio })
  const safeData = React.useMemo(() => {
    if (!Array.isArray(data)) return []
    return data.filter((d): d is Record<string, any> => Boolean(d && typeof d === 'object' && d[indexBy] !== undefined && d[indexBy] !== null))
  }, [data, indexBy])
  const safeKeys = React.useMemo(() => {
    const rawKeys = Array.isArray(keys) ? keys.filter((k) => typeof k === 'string' && k.trim() !== '') : []
    const firstRow = safeData[0]
    if (rawKeys.length > 0) {
      if (rawKeys.length === 1 && rawKeys[0] === 'value' && firstRow && !('value' in firstRow)) {
        const inferred = Object.keys(firstRow).filter(
          (k) => k !== indexBy && typeof firstRow[k] === 'number' && Number.isFinite(firstRow[k])
        )
        if (inferred.length > 0) return inferred
      }
      return rawKeys
    }
    if (firstRow) {
      const inferred = Object.keys(firstRow).filter(
        (k) => k !== indexBy && typeof firstRow[k] === 'number' && Number.isFinite(firstRow[k])
      )
      if (inferred.length > 0) return inferred
    }
    return []
  }, [keys, safeData, indexBy])
  const safeColors = Array.isArray(colors) && colors.length > 0 ? colors : ['#3157D5']
  const [hiddenKeys, setHiddenKeys] = useState<Record<string, boolean>>({})

  const visibleKeys = safeKeys.filter((k) => !hiddenKeys[k])

  const legendItems = safeKeys.map((key, idx) => ({
    id: key,
    label: key,
    color: safeColors[idx % safeColors.length] || '#3157D5',
    hidden: Boolean(hiddenKeys[key]),
  }))

  const toggleKey = (id: string) => {
    setHiddenKeys((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const defaultChartProps = {
    data: safeData,
    keys: visibleKeys,
    indexBy,
    margin,
    gridShape,
    curve,
    gridLevels,
    fillOpacity,
    borderWidth,
    dotSize,
    dotColor: { theme: 'background' },
    dotBorderWidth: 2,
    dotBorderColor: { from: 'color' },
    colors: safeColors,
    valueFormat,
    theme,
    ...(defs ? { defs } : {}),
    ...(fill ? { fill } : {}),
    ...(layers ? { layers } : {}),
    sliceTooltip: (props: any) => {
      const activeIndex = props?.index ?? props?.slice?.index ?? ''
      const items = props?.data || props?.slice?.data || []
      const compositeTooltip = findTooltipElement(children)
      if (compositeTooltip) {
        const tooltipPayload = {
          title: String(activeIndex),
          index: activeIndex,
          data: items,
          slice: { index: activeIndex, data: items },
          datum: { index: activeIndex, data: items },
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
          title: String(activeIndex),
          index: activeIndex,
          data: items,
          slice: { index: activeIndex, data: items },
          datum: { index: activeIndex, data: items },
          ...(slotProps.tooltip as any),
        })
      }
      return (
        <ChartTooltip title={String(activeIndex)}>
          {Array.isArray(items) && items.map((d: any) => (
            <ChartTooltip.Row key={d.id ?? d.key}>
              <div className="flex items-center gap-1.5">
                <ChartTooltip.Indicator color={d.color} shape="circle" />
                <span className="text-muted-fg">{d.id ?? d.key}:</span>
              </div>
              <ChartTooltip.Value>{d.formattedValue ?? d.value}</ChartTooltip.Value>
            </ChartTooltip.Row>
          ))}
        </ChartTooltip>
      )
    },
    tooltip: (props: any) => {
      const datum = props?.datum || props
      if (!datum) return null
      const id = datum.id ?? datum.key ?? ''
      const val = datum.formattedValue ?? datum.value
      const col = datum.color
      return (
        <ChartTooltip
          title={String(id)}
          label="Value"
          value={val}
          color={col}
        />
      )
    },
    dotTooltip: (props: any) => {
      const datum = props?.datum || props
      if (!datum) return null
      return (
        <ChartTooltip
          title={String(datum.index ?? datum.id ?? '')}
          label={String(datum.key ?? datum.id ?? '')}
          value={datum.formattedValue ?? datum.value}
          color={datum.color}
        />
      )
    },
    ...chartProps,
    ...nivoProps,
    ...(slotProps.chart as any),
  }
  const visualizerNode = (
    safeData.length === 0 || visibleKeys.length === 0 ? (
      renderSlot(slots.empty, slotProps.empty) ?? <ChartEmptyState />
    ) : (
      renderSlot(slots.chart, { ...defaultChartProps, ...(slotProps.chart as any) }, { defaultComponent: ResponsiveRadar as any }) ?? (
        <ResponsiveRadar {...defaultChartProps} />
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
    meta: { gridShape, gridLevels, fillOpacity, borderWidth, curve },
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

      {safeKeys.length > 1 && (
        <div className="mb-3">
          {renderSlot(slots.legend, slotProps.legend) ?? (
            <ChartLegend items={legendItems} onToggleItem={toggleKey} />
          )}
        </div>
      )}

      {renderSlot(
        slots.canvas,
        {
          ref,
          height,
          isLoading,
          isEmpty: safeData.length === 0,
          onContextMenu: slotProps.container?.onContextMenu,
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
          onContextMenu={slotProps.container?.onContextMenu}
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

export const RadarChart = createInterfaceComponent<RadarChartProps, RadarChartSlots>(
  {
    name: 'RadarChart',
    category: 'data',
    description: 'Multi-axis radar and spider polygon chart for evaluating comparative scores.',
    version: '1.0.0',
    props: {
      height: 360,
      gridShape: 'circular',
      gridLevels: 5,
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
  RadarChartPrimitive
)

// Namespace attachments for compound family ergonomics
RadarChart.Provider = RadarChartProvider
RadarChart.Container = ChartContainer
RadarChart.Header = ChartHeader
RadarChart.Toolbar = ChartToolbar
RadarChart.Legend = ChartLegend
RadarChart.Canvas = ChartCanvas
RadarChart.Tooltip = ChartTooltip
RadarChart.Empty = ChartEmptyState
RadarChart.Loading = ChartLoadingState
RadarChart.Footer = ChartFooter
