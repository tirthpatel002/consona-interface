import React, { useState } from 'react'
import { ResponsiveStream, type StreamDatum, type StreamSvgProps } from '@nivo/stream'
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

export const StreamChartContext = ChartContext
export const StreamChartProvider = ChartProvider
export const useStreamChartContext = useChartContext

/* ==========================================================================
   Stream Chart Slots & Props Interfaces
   ========================================================================== */

export interface StreamChartSlots {
  /** Outer container card / surface */
  container?: React.ComponentType<ChartContainerProps>
  /** Interactive chart canvas viewport container */
  canvas?: React.ComponentType<ChartCanvasProps>
  /** Underlying chart engine instance */
  chart?: React.ComponentType<StreamSvgProps<any>>
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

export interface StreamChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'onClick' | 'onContextMenu'> {
  /** Sequence dataset array of time-indexed objects. */
  data?: StreamDatum[]
  /** Series metric keys to plot as stacked stream layers (e.g. ['sales', 'marketing', 'support']). */
  keys?: string[]
  /** Offset layout mode: 'silhouette' | 'wiggle' | 'expand' | 'none' (default: 'silhouette'). */
  offsetType?: 'silhouette' | 'wiggle' | 'expand' | 'none'
  /** Curve interpolation: 'monotoneX' | 'natural' | 'catmullRom' | 'basis' (default: 'monotoneX'). */
  curve?: 'monotoneX' | 'natural' | 'catmullRom' | 'basis'
  /** Chart height in pixels (default: 360). */
  height?: number | string
  /** Aspect ratio multiplier. Overrides height if set. */
  aspectRatio?: number
  /** Outer SVG chart margins. */
  margin?: ChartMargin
  /** Fill opacity of the stream layers (0.0 - 1.0, default: 0.85). */
  fillOpacity?: number
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
  /** Format function or pattern string for values */
  valueFormat?: string | ((val: number) => string)
  /** Pass-through props directly forwarded to the underlying Nivo chart instance */
  chartProps?: Record<string, any>
  /** Additional raw Nivo engine props */
  nivoProps?: Record<string, any>
  /** Item click callback */
  onItemClick?: (datum: any, event: React.MouseEvent) => void
  /** Props forwarded to the outer ChartContainer card */
  containerProps?: React.HTMLAttributes<HTMLDivElement>
  /** Slot overrides for downstream customization. */
  slots?: SlotComponents<StreamChartSlots>
  /** Slot props overrides for downstream customization. */
  slotProps?: SlotPropsMap<StreamChartSlots>
  className?: string
  style?: React.CSSProperties
}

/* ==========================================================================
   Stream Chart Primitive
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

function StreamChartPrimitive({
  data = [],
  keys = ['value'],
  offsetType = 'silhouette',
  curve = 'monotoneX',
  height = 360,
  aspectRatio,
  margin = { top: 20, right: 20, bottom: 40, left: 50 },
  fillOpacity = 0.85,
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
  valueFormat,
  chartProps,
  nivoProps,
  onItemClick,
  slots = {},
  slotProps = {},
  containerProps,
  className,
  style,
  children,
}: StreamChartProps) {
  const { theme, colors } = useChartTheme({ palette })
  const { ref, width, isReady } = useChartDimensions({ height, aspectRatio })
  const rawObjects = React.useMemo(() => {
    if (!Array.isArray(data)) return []
    return data.filter((d): d is Record<string, any> => Boolean(d && typeof d === 'object'))
  }, [data])
  const safeKeys = React.useMemo(() => {
    const rawKeys = Array.isArray(keys) ? keys.filter((k) => typeof k === 'string' && k.trim() !== '') : []
    const firstRow = rawObjects[0]
    if (rawKeys.length > 0) {
      if (rawKeys.length === 1 && rawKeys[0] === 'value' && firstRow && !('value' in firstRow)) {
        const inferred = Object.keys(firstRow).filter(
          (k) => typeof firstRow[k] === 'number' && Number.isFinite(firstRow[k])
        )
        if (inferred.length > 0) return inferred
      }
      return rawKeys
    }
    if (firstRow) {
      const inferred = Object.keys(firstRow).filter(
        (k) => typeof firstRow[k] === 'number' && Number.isFinite(firstRow[k])
      )
      if (inferred.length > 0) return inferred
    }
    return []
  }, [keys, rawObjects])
  const safeData = React.useMemo(() => {
    if (rawObjects.length === 0 || safeKeys.length === 0) return []
    return rawObjects.map((row) => {
      const normalized: Record<string, any> = { ...row }
      for (const k of safeKeys) {
        normalized[k] = typeof row[k] === 'number' && Number.isFinite(row[k]) ? row[k] : 0
      }
      return normalized
    })
  }, [rawObjects, safeKeys])
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
    margin,
    offsetType,
    curve,
    colors: safeColors,
    fillOpacity,
    valueFormat,
    theme,
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
    enableStackTooltip: true,
    stackTooltip: (props: any) => {
      const slice = props?.slice || props
      if (!slice) return null
      const activeIndex = slice.index !== undefined ? slice.index : ''
      const stackItems = slice.stack || slice.data || slice.slices || []
      const compositeTooltip = findTooltipElement(children)
      if (compositeTooltip) {
        const tooltipPayload = {
          title: `Index ${activeIndex}`,
          index: activeIndex,
          slice,
          datum: slice,
          data: stackItems,
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
          title: `Index ${activeIndex}`,
          index: activeIndex,
          slice,
          datum: slice,
          data: stackItems,
          ...(slotProps.tooltip as any),
        })
      }
      return (
        <ChartTooltip title={`Time Index ${activeIndex}`}>
          {Array.isArray(stackItems) &&
            stackItems.map((layer: any) => {
              const label = String(layer.layerLabel ?? layer.layerId ?? layer.id ?? '')
              const val = layer.formattedValue ?? layer.value
              return (
                <ChartTooltip.Row key={label || layer.index}>
                  <div className="flex items-center gap-1.5">
                    <ChartTooltip.Indicator color={layer.color} shape="circle" />
                    <span className="text-muted-fg">{label}:</span>
                  </div>
                  <ChartTooltip.Value>{val}</ChartTooltip.Value>
                </ChartTooltip.Row>
              )
            })}
        </ChartTooltip>
      )
    },
    sliceTooltip: (props: any) => {
      const slice = props?.slice || props
      if (!slice) return null
      const activeIndex = slice.index !== undefined ? slice.index : ''
      const stackItems = slice.stack || slice.data || slice.slices || []
      return (
        <ChartTooltip title={`Time Index ${activeIndex}`}>
          {Array.isArray(stackItems) &&
            stackItems.map((layer: any) => {
              const label = String(layer.layerLabel ?? layer.layerId ?? layer.id ?? '')
              const val = layer.formattedValue ?? layer.value
              return (
                <ChartTooltip.Row key={label || layer.index}>
                  <div className="flex items-center gap-1.5">
                    <ChartTooltip.Indicator color={layer.color} shape="circle" />
                    <span className="text-muted-fg">{label}:</span>
                  </div>
                  <ChartTooltip.Value>{val}</ChartTooltip.Value>
                </ChartTooltip.Row>
              )
            })}
        </ChartTooltip>
      )
    },
    tooltip: (props: any) => {
      const layer = props?.layer || props?.datum || props?.slice || props
      if (!layer) return null
      const title = String(layer.label ?? layer.id ?? layer.layerLabel ?? layer.layerId ?? '')
      const val = layer.formattedValue ?? layer.value
      const color = layer.color
      return (
        <ChartTooltip
          title={title}
          label="Value"
          value={val}
          color={color}
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
      renderSlot(slots.chart, { ...defaultChartProps, ...(slotProps.chart as any) }, { defaultComponent: ResponsiveStream as any }) ?? (
        <ResponsiveStream {...defaultChartProps} />
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
      keys: safeKeys,
      visibleKeys,
      offsetType,
      curve,
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

  const containerContent = (
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
    children: containerContent,
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

export const StreamChart = createInterfaceComponent<StreamChartProps, StreamChartSlots>(
  {
    name: 'StreamChart',
    category: 'data',
    description: 'Continuous organic flowing streamgraph visualizing multi-series displacement over time.',
    version: '1.0.0',
    props: {
      height: 360,
      offsetType: 'silhouette',
      curve: 'monotoneX',
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
  StreamChartPrimitive
)

// Namespace attachments for compound family ergonomics
StreamChart.Provider = StreamChartProvider
StreamChart.Container = ChartContainer
StreamChart.Header = ChartHeader
StreamChart.Toolbar = ChartToolbar
StreamChart.Legend = ChartLegend
StreamChart.Canvas = ChartCanvas
StreamChart.Tooltip = ChartTooltip
StreamChart.Empty = ChartEmptyState
StreamChart.Loading = ChartLoadingState
StreamChart.Footer = ChartFooter
