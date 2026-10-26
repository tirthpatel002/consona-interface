import React from 'react'
import { ResponsiveSunburst, type SunburstSvgProps } from '@nivo/sunburst'
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

export interface SunburstHierarchyNode {
  name: string
  color?: string
  value?: number
  children?: SunburstHierarchyNode[]
}

/* ==========================================================================
   Context
   ========================================================================== */

export const SunburstChartContext = ChartContext
export const SunburstChartProvider = ChartProvider
export const useSunburstChartContext = useChartContext

/* ==========================================================================
   Sunburst Chart Slots & Props Interfaces
   ========================================================================== */

export interface SunburstChartSlots {
  /** Outer container card / surface */
  container?: React.ComponentType<ChartContainerProps>
  /** Interactive chart canvas viewport container */
  canvas?: React.ComponentType<ChartCanvasProps>
  /** Underlying chart engine instance */
  chart?: React.ComponentType<SunburstSvgProps<any>>
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

export interface SunburstChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'onClick' | 'onContextMenu'> {
  /** Root hierarchical dataset node with children and values. */
  data?: SunburstHierarchyNode
  /** Chart height in pixels (default: 360). */
  height?: number | string
  /** Aspect ratio multiplier. Overrides height if set. */
  aspectRatio?: number
  /** Outer SVG chart margins. */
  margin?: ChartMargin
  /** Corner radius curvature of arc segments in pixels (default: 3). */
  cornerRadius?: number
  /** Arc padding gap in degrees (default: 1). */
  arcPadding?: number
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
  slots?: SlotComponents<SunburstChartSlots>
  /** Slot props overrides for downstream customization. */
  slotProps?: SlotPropsMap<SunburstChartSlots>
  className?: string
  style?: React.CSSProperties
}

/* ==========================================================================
   Sunburst Chart Primitive
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

function SunburstChartPrimitive({
  data = { name: 'root', children: [] },
  height = 360,
  aspectRatio,
  margin = { top: 20, right: 20, bottom: 20, left: 20 },
  cornerRadius = 3,
  arcPadding = 1,
  palette = 'categorical',
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
}: SunburstChartProps) {
  const { theme, colors } = useChartTheme({ palette })
  const { ref, width, isReady } = useChartDimensions({ height, aspectRatio })
  const safeColors = Array.isArray(colors) && colors.length > 0 ? colors : ['#3157D5']
  const [hiddenIds, setHiddenIds] = React.useState<Record<string, boolean>>({})

  const sanitizeNode = React.useCallback((node: any): SunburstChartProps['data'] | null => {
    if (!node || typeof node !== 'object') return null
    const name = node.name != null ? String(node.name) : node.id != null ? String(node.id) : null
    if (!name) return null
    const rawChildren = Array.isArray(node.children)
      ? node.children
          .map((c: any) => sanitizeNode(c))
          .filter((c: SunburstChartProps['data'] | null): c is SunburstChartProps['data'] => c !== null)
      : undefined
    const hasChildren = Boolean(rawChildren && rawChildren.length > 0)
    const hasValue = typeof node.value === 'number' && Number.isFinite(node.value) && node.value > 0
    if (!hasChildren && !hasValue) return null
    return {
      ...node,
      name,
      ...(hasChildren ? { children: rawChildren } : { children: undefined }),
    }
  }, [])

  const safeRoot = React.useMemo(() => sanitizeNode(data), [data, sanitizeNode])

  const filteredData = React.useMemo(() => {
    if (!safeRoot) return null
    if (!Array.isArray(safeRoot.children)) return safeRoot
    const visibleChildren = safeRoot.children.filter((child) => child && !hiddenIds[child.name])
    return {
      ...safeRoot,
      children: visibleChildren,
    }
  }, [safeRoot, hiddenIds])

  const legendItems = Array.isArray(safeRoot?.children)
    ? safeRoot.children.map((child, idx) => ({
      id: child.name,
      label: child.name,
      color: child.color || safeColors[idx % safeColors.length] || '#3157D5',
      hidden: Boolean(hiddenIds[child.name]),
    }))
    : []

  const toggleKey = (id: string) => {
    setHiddenIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const defaultChartProps = {
    data: filteredData as any,
    id: 'name',
    value: 'value',
    cornerRadius,
    borderWidth: 1,
    borderColor: 'var(--border, #e5e7eb)',
    colors: safeColors,
    arcPadding,
    valueFormat,
    theme,
    ...(onItemClick ? { onClick: onItemClick } : {}),
    tooltip: (props: any) => {
      const computedNode = props?.node || props?.datum || props
      if (!computedNode) return null
      const rawData = computedNode.data || {}
      const title = String(computedNode.id || rawData.name || computedNode.name || '')
      const depth = computedNode.depth !== undefined
        ? computedNode.depth
        : (Array.isArray(computedNode.path) ? computedNode.path.length - 1 : 0)
      const value = computedNode.formattedValue || (computedNode.value !== undefined ? computedNode.value : rawData.value)
      const color = computedNode.color || rawData.color
      const percentage = computedNode.percentage !== undefined
        ? `${(computedNode.percentage * 100).toFixed(1)}%`
        : undefined
      const badgeText = percentage ? `Depth: ${depth} • ${percentage}` : `Depth: ${depth}`

      const compositeTooltip = findTooltipElement(children)
      if (compositeTooltip) {
        const tooltipPayload = {
          title,
          label: 'Value',
          value,
          color,
          badge: badgeText,
          node: computedNode,
          datum: rawData || computedNode,
          data: rawData || computedNode,
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
          label: 'Value',
          value,
          color,
          badge: badgeText,
          node: computedNode,
          datum: rawData || computedNode,
          data: rawData || computedNode,
          ...(slotProps.tooltip as any),
        })
      }
      return (
        <ChartTooltip
          title={title}
          label="Value"
          value={value}
          color={color}
          badge={badgeText}
        />
      )
    },
    ...chartProps,
    ...nivoProps,
    ...(slotProps.chart as any),
  }

  const visualizerNode = (
    !filteredData || (!filteredData.children?.length && !filteredData.value) ? (
      renderSlot(slots.empty, slotProps.empty) ?? <ChartEmptyState />
    ) : (
      renderSlot(slots.chart, { ...defaultChartProps, ...(slotProps.chart as any) }, { defaultComponent: ResponsiveSunburst as any }) ?? (
        <ResponsiveSunburst {...defaultChartProps} />
      )
    )
  )

  const contextValue = {
    data: filteredData,
    rawData: data,
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
      rootName: data?.name,
      childCount: filteredData?.children?.length ?? 0,
      totalChildCount: data?.children?.length ?? 0,
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

      {legendItems.length > 0 && (
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
          isEmpty: !data,
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
          isEmpty={!data}
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

export const SunburstChart = createInterfaceComponent<SunburstChartProps, SunburstChartSlots>(
  {
    name: 'SunburstChart',
    category: 'data',
    description: 'Radial hierarchical multi-ring visualizer tracing tree depths outwards.',
    version: '1.0.0',
    props: {
      height: 360,
      cornerRadius: 3,
      arcPadding: 1,
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
    },
  },
  SunburstChartPrimitive
)

// Namespace attachments for compound family ergonomics
SunburstChart.Provider = SunburstChartProvider
SunburstChart.Container = ChartContainer
SunburstChart.Header = ChartHeader
SunburstChart.Toolbar = ChartToolbar
SunburstChart.Legend = ChartLegend
SunburstChart.Canvas = ChartCanvas
SunburstChart.Tooltip = ChartTooltip
SunburstChart.Empty = ChartEmptyState
SunburstChart.Loading = ChartLoadingState
SunburstChart.Footer = ChartFooter
