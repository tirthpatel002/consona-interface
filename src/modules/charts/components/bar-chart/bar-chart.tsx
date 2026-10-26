import React, { useState } from 'react'
import { ResponsiveBar, ResponsiveBarCanvas, type BarDatum, type BarSvgProps } from '@nivo/bar'
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
import { BarChartItem, TopRoundedBarItem, RightRoundedBarItem, type BarChartItemProps } from './bar-item'
import type {
  ChartContainerVariant,
  ChartMargin,
  ChartTimeRange,
} from '../../types/common'

/* ==========================================================================
   Context
   ========================================================================== */

export const BarChartContext = ChartContext
export const BarChartProvider = ChartProvider
export const useBarChartContext = useChartContext

/* ==========================================================================
   Bar Chart Slots & Props Interfaces
   ========================================================================== */

export interface BarChartSlots {
  /** Outer container card / surface */
  container?: React.ComponentType<ChartContainerProps>
  /** Interactive chart canvas viewport container */
  canvas?: React.ComponentType<ChartCanvasProps>
  /** Underlying chart engine instance */
  chart?: React.ComponentType<Record<string, unknown>>
  /** Custom Bar item component */
  item?: React.ComponentType<BarChartItemProps>
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

export interface BarChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'onClick' | 'onContextMenu'> {
  /** Dataset array of objects with an index key and multiple metric keys. */
  data?: BarDatum[]
  /** Key in datum representing the category index (e.g. 'month', 'country', 'department'). */
  indexBy?: string
  /** Metric keys to plot as bars (e.g. ['revenue', 'expenses', 'profit']). */
  keys?: string[]
  /** Rendering engine: 'svg' or 'canvas' (default: 'svg'). */
  engine?: 'svg' | 'canvas'
  /** Layout direction: 'vertical' or 'horizontal' (default: 'vertical'). */
  layout?: 'vertical' | 'horizontal'
  /** Grouping mode: 'grouped' or 'stacked' (default: 'grouped'). */
  groupMode?: 'grouped' | 'stacked'
  /** Chart height in pixels (default: 360). */
  height?: number | string
  /** Aspect ratio multiplier. Overrides height if set. */
  aspectRatio?: number
  /** Outer SVG chart margins. */
  margin?: ChartMargin
  /** Padding between adjacent bars in the same group (0.0 - 0.9, default: 0.3). */
  padding?: number
  /** Inner padding between grouped bars (0.0 - 0.9, default: 0.1). */
  innerPadding?: number
  /** Border radius curvature of the bars in pixels (default: 4). */
  borderRadius?: number
  /** Corner radius rounding behavior: 'all', 'flat-baseline' (0 on axis touch side), 'top', 'right', 'none'. */
  cornerStyle?: 'all' | 'flat-baseline' | 'top' | 'right' | 'none'
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
  /** Whether to show numeric values inside or on bars (default: false). */
  enableLabel?: boolean
  /** Custom SVG defs (gradients, patterns) */
  defs?: any[]
  /** Fill pattern match rules */
  fill?: any[]
  /** Custom Bar Item component */
  barComponent?: React.ComponentType<Record<string, unknown>>
  /** Value format callback or string */
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
  slots?: SlotComponents<BarChartSlots>
  /** Slot props overrides for downstream customization. */
  slotProps?: SlotPropsMap<BarChartSlots>
  className?: string
  style?: React.CSSProperties
}

/* ==========================================================================
   Bar Chart Primitive
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

function BarChartPrimitive({
  data = [],
  indexBy = 'id',
  keys = ['value'],
  engine = 'svg',
  layout = 'vertical',
  groupMode = 'grouped',
  height = 360,
  aspectRatio,
  margin = { top: 20, right: 20, bottom: 40, left: 50 },
  padding = 0.3,
  innerPadding = 0.1,
  borderRadius = 4,
  cornerStyle = 'all',
  palette = 'categorical',
  containerVariant = 'default',
  defs,
  fill,
  barComponent: barComponentProp,
  title,
  description,
  badge,
  isLoading = false,
  timeRanges,
  selectedRange,
  defaultRange,
  onRangeChange,
  enableLabel = false,
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
}: BarChartProps) {
  const { theme, colors } = useChartTheme({ palette })
  const { ref, width, isReady } = useChartDimensions({ height, aspectRatio })
  const hoveredDatumRef = React.useRef<any>(null)
  const safeData = React.useMemo(() => {
    if (!Array.isArray(data)) return []
    return data.filter((d): d is BarDatum => Boolean(d && typeof d === 'object' && d[indexBy] !== undefined && d[indexBy] !== null))
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

  // Choose default bar renderer according to cornerStyle or slots.item / barComponent
  const resolvedBarComponent =
    slots.item ||
    slotProps.chart?.barComponent ||
    barComponentProp ||
    (cornerStyle !== 'all' || onItemClick
      ? (barProps: any) => (
        <BarChartItem
          {...barProps}
          borderRadius={borderRadius}
          cornerStyle={cornerStyle}
          layout={layout}
          onClick={onItemClick || barProps.onClick}
        />
      )
      : undefined)

  const chartSlotOnContextMenu = (slotProps?.chart as any)?.onContextMenu

  const defaultChartProps = {
    data: safeData,
    keys: visibleKeys,
    indexBy,
    layout,
    groupMode,
    margin,
    padding,
    innerPadding,
    borderRadius,
    colors: safeColors,
    enableLabel,
    valueFormat,
    theme,
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
    ...(resolvedBarComponent ? { barComponent: resolvedBarComponent } : {}),
    tooltip: ({ id, value, color, indexValue, data }: any) => {
      hoveredDatumRef.current = { id, value, color, indexValue, data }
      const compositeTooltip = findTooltipElement(children)
      if (compositeTooltip) {
        const tooltipPayload = {
          title: String(indexValue ?? ''),
          label: String(id ?? ''),
          value,
          color,
          data,
          datum: data,
          bar: { id, value, color, indexValue, data },
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
      if (slots?.tooltip) {
        return renderSlot(slots?.tooltip, {
          ...slotProps?.tooltip,
          title: String(indexValue ?? ''),
          label: String(id ?? ''),
          value,
          color,
          data,
          datum: data,
          bar: { id, value, color, indexValue, data },
          ...slotProps?.tooltip,
        })
      }
      return (
        <ChartTooltip
          title={String(indexValue ?? '')}
          label={String(id ?? '')}
          value={value}
          color={color}
        />
      )
    },
    ...chartProps,
    ...nivoProps,
    ...(slotProps?.chart as any),
    ...(chartSlotOnContextMenu
      ? {
          onContextMenu: (datum: any, event: React.MouseEvent) => {
            if (event) {
              ;(event as any).__consonaChartContextHandled = true
              if (event.nativeEvent) {
                ;(event.nativeEvent as any).__consonaChartContextHandled = true
              }
            }
            chartSlotOnContextMenu(datum, event)
          },
        }
      : {}),
  }

  const handleCanvasContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    const alreadyHandled =
      Boolean((e as any).__consonaChartContextHandled) ||
      Boolean((e.nativeEvent as any)?.__consonaChartContextHandled)
    const containerContextMenu = slotProps?.container?.onContextMenu
    if (chartSlotOnContextMenu && !alreadyHandled) {
      if (hoveredDatumRef.current != null) {
        chartSlotOnContextMenu(hoveredDatumRef.current, e)
      } else {
        chartSlotOnContextMenu(e)
      }
    }
    if (containerContextMenu && containerContextMenu !== chartSlotOnContextMenu) {
      containerContextMenu(e)
    }
  }

  const ChartComponent = engine === 'canvas' ? ResponsiveBarCanvas : ResponsiveBar

  const visualizerNode = (
    safeData.length === 0 || visibleKeys.length === 0 ? (
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
      keys: safeKeys,
      visibleKeys,
      indexBy,
      layout,
      groupMode,
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

      {safeKeys.length > 1 && (
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
          isEmpty: safeData.length === 0 || visibleKeys.length === 0,
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
          <div
            ref={ref}
            onContextMenu={handleCanvasContextMenu}
            onPointerLeave={() => {
              hoveredDatumRef.current = null
            }}
            style={{
              width: '100%',
              height: typeof height === 'number' ? `${height}px` : height,
              minHeight: typeof height === 'number' ? `${height}px` : height,
              position: 'relative',
            }}
          >
            {isLoading ? (
              renderSlot(slots?.loading, slotProps?.loading) ?? <ChartLoadingState />
            ) : (
              visualizerNode
            )}
          </div>
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

export const BarChart = createInterfaceComponent<BarChartProps, BarChartSlots>(
  {
    name: 'BarChart',
    category: 'data',
    description: 'Enterprise bar visualizer with grouped, stacked, vertical, and horizontal configurations.',
    version: '1.0.0',
    props: {
      height: 360,
      layout: 'vertical',
      groupMode: 'grouped',
      padding: 0.3,
      innerPadding: 2,
      borderRadius: 4,
      cornerStyle: 'all',
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
  BarChartPrimitive
)

// Namespace attachments for compound family ergonomics
BarChart.Provider = BarChartProvider
BarChart.Container = ChartContainer
BarChart.Header = ChartHeader
BarChart.Toolbar = ChartToolbar
BarChart.Legend = ChartLegend
BarChart.Canvas = ChartCanvas
BarChart.Tooltip = ChartTooltip
BarChart.Empty = ChartEmptyState
BarChart.Loading = ChartLoadingState
BarChart.Footer = ChartFooter
BarChart.Item = BarChartItem
BarChart.TopRounded = TopRoundedBarItem
BarChart.RightRounded = RightRoundedBarItem

