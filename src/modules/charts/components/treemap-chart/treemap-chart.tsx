import React from 'react'
import { ResponsiveTreeMap, ResponsiveTreeMapCanvas, type TreeMapSvgProps } from '@nivo/treemap'
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

export interface TreemapNodeRecord {
  name: string
  value?: number
  color?: string
  children?: TreemapNodeRecord[]
}

/* ==========================================================================
   Context
   ========================================================================== */

export const TreemapChartContext = ChartContext
export const TreemapChartProvider = ChartProvider
export const useTreemapChartContext = useChartContext

/* ==========================================================================
   Treemap Chart Slots & Props Interfaces
   ========================================================================== */

export interface TreemapChartSlots {
  /** Outer container card / surface */
  container?: React.ComponentType<ChartContainerProps>
  /** Interactive chart canvas viewport container */
  canvas?: React.ComponentType<ChartCanvasProps>
  /** Underlying chart engine instance */
  chart?: React.ComponentType<TreeMapSvgProps<any> & { onContextMenu?: (...args: any[]) => void }>
  /** Custom Treemap node renderer */
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

export interface TreemapChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'onClick' | 'onContextMenu'> {
  /** Root hierarchical dataset object with nested leaves. */
  data?: TreemapNodeRecord
  /** Rendering engine: 'svg' or 'canvas' (default: 'svg'). */
  engine?: 'svg' | 'canvas'
  /** Chart height in pixels (default: 360). */
  height?: number | string
  /** Aspect ratio multiplier. Overrides height if set. */
  aspectRatio?: number
  /** Outer SVG chart margins. */
  margin?: ChartMargin
  /** Tile inner padding gap in pixels (default: 3). */
  innerPadding?: number
  /** Outer padding around tile groups in pixels (default: 3). */
  outerPadding?: number
  /** Tiling algorithm to layout nodes (default: 'squarify'). */
  tile?: 'squarify' | 'binary' | 'dice' | 'slice' | 'sliceDice'
  /** Only render leaf nodes without parent containers (default: false). */
  leavesOnly?: boolean
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
  /** Custom SVG defs (patterns, gradients) */
  defs?: any[]
  /** Fill pattern match rules */
  fill?: any[]
  /** Slot overrides for downstream customization. */
  slots?: SlotComponents<TreemapChartSlots>
  /** Slot props overrides for downstream customization. */
  slotProps?: SlotPropsMap<TreemapChartSlots>
  className?: string
  style?: React.CSSProperties
}

/* ==========================================================================
   Treemap Chart Primitive
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

function TreemapChartPrimitive({
  data = { name: 'root', children: [] },
  engine = 'svg',
  height = 360,
  aspectRatio,
  margin = { top: 10, right: 10, bottom: 10, left: 10 },
  innerPadding = 3,
  outerPadding = 3,
  tile = 'squarify',
  leavesOnly = false,
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
}: TreemapChartProps) {
  const { theme, colors } = useChartTheme({ palette })
  const { ref, width, isReady } = useChartDimensions({ height, aspectRatio })
  const hoveredDatumRef = React.useRef<any>(null)
  const safeColors = Array.isArray(colors) && colors.length > 0 ? colors : ['#3157D5']

  const sanitizeNode = React.useCallback((node: any): TreemapChartProps['data'] | null => {
    if (!node || typeof node !== 'object') return null
    const name = node.name != null ? String(node.name) : node.id != null ? String(node.id) : null
    if (!name) return null
    const rawChildren = Array.isArray(node.children)
      ? node.children
          .map((c: any) => sanitizeNode(c))
          .filter((c: TreemapChartProps['data'] | null): c is TreemapChartProps['data'] => c !== null)
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

  const safeData = React.useMemo(() => sanitizeNode(data), [data, sanitizeNode])

  const legendItems = Array.isArray(safeData?.children)
    ? safeData.children.map((child, idx) => ({
      id: child.name,
      label: child.name,
      color: child.color || safeColors[idx % safeColors.length] || '#3157D5',
    }))
    : []

  const resolvedNodeComponent =
    slots.item ||
    slotProps.chart?.nodeComponent

  const defaultChartProps = {
    data: safeData,
    identity: 'name',
    value: 'value',
    margin,
    innerPadding,
    outerPadding,
    tile,
    leavesOnly,
    colors: safeColors,
    valueFormat,
    theme,
    nodeOpacity: 0.9,
    borderWidth: 1,
    borderColor: { from: 'color', modifiers: [['darker', 0.3]] },
    ...(onItemClick ? { onClick: onItemClick } : {}),
    ...(resolvedNodeComponent ? { nodeComponent: resolvedNodeComponent } : {}),
    ...(defs ? { defs } : {}),
    ...(fill ? { fill } : {}),
    tooltip: (props: any) => {
      const node = props?.node || props?.datum || props?.data || props
      if (!node) return null
      hoveredDatumRef.current = node
      const title = String(node.id || node.data?.name || node.name || '')
      const value = node.formattedValue ?? node.value
      const color = node.color
      const compositeTooltip = findTooltipElement(children)
      if (compositeTooltip) {
        const tooltipPayload = {
          title,
          label: 'Size',
          value,
          color,
          node,
          datum: node.data || node,
          data: node.data || node,
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
          label: 'Size',
          value,
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
          label="Size"
          value={value}
          color={color}
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

  const ChartComponent = engine === 'canvas' ? ResponsiveTreeMapCanvas : ResponsiveTreeMap

  const visualizerNode = (
    !safeData || (!safeData.children?.length && !safeData.value) ? (
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
    timeRanges,
    selectedRange,
    onRangeChange,
    meta: {
      rootName: safeData?.name,
      childCount: safeData?.children?.length ?? 0,
      tile,
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

      {renderSlot(slots.legend, slotProps.legend)}

      {renderSlot(
        slots.canvas,
        {
          ref,
          height,
          isLoading,
          isEmpty: !safeData,
          onContextMenu: handleCanvasContextMenu,
          onPointerLeave: () => {
            hoveredDatumRef.current = null
          },
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
          isEmpty={!safeData}
          onContextMenu={handleCanvasContextMenu}
          onPointerLeave={() => {
            hoveredDatumRef.current = null
          }}
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

export const TreemapChart = createInterfaceComponent<TreemapChartProps, TreemapChartSlots>(
  {
    name: 'TreemapChart',
    category: 'data',
    description: 'Hierarchical proportional tiling visualizer for inspecting multi-level category weights.',
    version: '1.0.0',
    props: {
      height: 360,
      innerPadding: 3,
      outerPadding: 3,
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
  TreemapChartPrimitive
)

// Namespace attachments for compound family ergonomics
TreemapChart.Provider = TreemapChartProvider
TreemapChart.Container = ChartContainer
TreemapChart.Header = ChartHeader
TreemapChart.Toolbar = ChartToolbar
TreemapChart.Legend = ChartLegend
TreemapChart.Canvas = ChartCanvas
TreemapChart.Tooltip = ChartTooltip
TreemapChart.Empty = ChartEmptyState
TreemapChart.Loading = ChartLoadingState
TreemapChart.Footer = ChartFooter
