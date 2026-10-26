import React from 'react'
import { ResponsiveSankey, type SankeyNodeDatum, type SankeyLinkDatum, type SankeySvgProps } from '@nivo/sankey'
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

export interface SankeyDataPayload {
  nodes: Array<{ id: string; nodeColor?: string }>
  links: Array<{ source: string; target: string; value: number }>
}

/* ==========================================================================
   Context
   ========================================================================== */

export const SankeyChartContext = ChartContext
export const SankeyChartProvider = ChartProvider
export const useSankeyChartContext = useChartContext

/* ==========================================================================
   Sankey Chart Slots & Props Interfaces
   ========================================================================== */

export interface SankeyChartSlots {
  /** Outer container card / surface */
  container?: React.ComponentType<ChartContainerProps>
  /** Interactive chart canvas viewport container */
  canvas?: React.ComponentType<ChartCanvasProps>
  /** Underlying chart engine instance */
  chart?: React.ComponentType<SankeySvgProps<any, any>>
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

export interface SankeyChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'onClick' | 'onContextMenu'> {
  /** Nodes and links flow network object. */
  data?: SankeyDataPayload
  /** Chart height in pixels (default: 360). */
  height?: number | string
  /** Aspect ratio multiplier. Overrides height if set. */
  aspectRatio?: number
  /** Outer SVG chart margins. */
  margin?: ChartMargin
  /** Node horizontal alignment: 'justify' | 'center' | 'start' | 'end' (default: 'justify'). */
  align?: 'justify' | 'center' | 'start' | 'end'
  /** Node bar thickness in pixels (default: 18). */
  nodeThickness?: number
  /** Spacing between adjacent nodes in pixels (default: 24). */
  nodeSpacing?: number
  /** Corner radius of node bars in pixels (default: 3). */
  nodeBorderRadius?: number
  /** Link blend mode ('normal' | 'multiply' | 'screen', default: 'multiply'). */
  linkBlendMode?: 'normal' | 'multiply' | 'screen'
  /** Link opacity (0.0 - 1.0, default: 0.5). */
  linkOpacity?: number
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
  /** Slot overrides for downstream customization. */
  slots?: SlotComponents<SankeyChartSlots>
  /** Slot props overrides for downstream customization. */
  slotProps?: SlotPropsMap<SankeyChartSlots>
  className?: string
  style?: React.CSSProperties
}

/* ==========================================================================
   Sankey Chart Primitive
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

function SankeyChartPrimitive({
  data = { nodes: [], links: [] },
  height = 360,
  aspectRatio,
  margin = { top: 20, right: 60, bottom: 20, left: 60 },
  align = 'justify',
  nodeThickness = 18,
  nodeSpacing = 24,
  nodeBorderRadius = 3,
  linkBlendMode = 'multiply',
  linkOpacity = 0.5,
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
}: SankeyChartProps) {
  const { theme, colors } = useChartTheme({ palette })
  const { ref, width, isReady } = useChartDimensions({ height, aspectRatio })

  const { nodes: rawNodes = [], links: rawLinks = [] } = data || {}
  const { nodes, links, safeGraphData } = React.useMemo(() => {
    const validNodes: NonNullable<SankeyChartProps['data']>['nodes'] = []
    const nodeIdSet = new Set<string>()
    if (Array.isArray(rawNodes)) {
      for (const n of rawNodes) {
        if (n && typeof n === 'object' && n.id != null && String(n.id).trim() !== '') {
          const idStr = String(n.id)
          if (!nodeIdSet.has(idStr)) {
            nodeIdSet.add(idStr)
            validNodes.push({ ...n, id: idStr })
          }
        }
      }
    }

    const validLinks: NonNullable<SankeyChartProps['data']>['links'] = []
    const directedPairs = new Set<string>()
    if (Array.isArray(rawLinks)) {
      for (const l of rawLinks) {
        if (
          l &&
          typeof l === 'object' &&
          l.source != null &&
          l.target != null &&
          typeof l.value === 'number' &&
          Number.isFinite(l.value) &&
          l.value > 0
        ) {
          const src = String(l.source)
          const tgt = String(l.target)
          if (src !== tgt && nodeIdSet.has(src) && nodeIdSet.has(tgt) && !directedPairs.has(`${tgt}->${src}`)) {
            directedPairs.add(`${src}->${tgt}`)
            validLinks.push({ ...l, source: src, target: tgt })
          }
        }
      }
    }

    return {
      nodes: validNodes,
      links: validLinks,
      safeGraphData: { nodes: validNodes, links: validLinks },
    }
  }, [rawNodes, rawLinks])
  const safeColors = Array.isArray(colors) && colors.length > 0 ? colors : ['#3157D5']

  const hasCustomNodeColors = nodes.some((n) => Boolean(n.nodeColor))

  const nodeColorAccessor = (node: any) => {
    if (node?.nodeColor) return node.nodeColor
    if (node?.data?.nodeColor) return node.data.nodeColor
    const matchedNode = nodes.find((n) => n.id === node?.id)
    if (matchedNode?.nodeColor) return matchedNode.nodeColor
    const index = typeof node?.index === 'number' ? node.index : 0
    return safeColors[index % safeColors.length] || '#3157D5'
  }

  const defaultColors = hasCustomNodeColors ? (nodeColorAccessor as any) : safeColors

  const legendItems = nodes.map((n, idx) => ({
    id: String(n.id ?? idx),
    label: String(n.id ?? idx),
    color: n.nodeColor || safeColors[idx % safeColors.length] || '#3157D5',
  }))

  const defaultChartProps = {
    data: safeGraphData,
    margin,
    align,
    colors: defaultColors,
    nodeThickness,
    nodeSpacing,
    nodeBorderRadius,
    nodeBorderWidth: 0,
    nodeOpacity: 1,
    linkBlendMode,
    linkOpacity,
    linkContract: 2,
    enableLinkGradient: true,
    valueFormat,
    theme,
    ...(onItemClick ? { onClick: onItemClick } : {}),
    nodeTooltip: ({ node }: any) => {
      if (!node) return null
      const compositeTooltip = findTooltipElement(children)
      if (compositeTooltip) {
        const tooltipPayload = {
          title: String(node.label || node.id || ''),
          label: 'Total Volume',
          value: node.formattedValue,
          color: node.color,
          node,
          datum: node,
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
          title: String(node.label || node.id || ''),
          label: 'Total Volume',
          value: node.formattedValue,
          color: node.color,
          node,
          datum: node,
          ...(slotProps.tooltip as any),
        })
      }
      return (
        <ChartTooltip
          title={String(node.label || node.id || '')}
          label="Volume"
          value={node.formattedValue}
          color={node.color}
        />
      )
    },
    linkTooltip: ({ link }: any) => {
      if (!link) return null
      return (
        <ChartTooltip
          title={`${link.source?.id ?? ''} → ${link.target?.id ?? ''}`}
          label="Flow"
          value={link.formattedValue}
          color={link.color}
        />
      )
    },
    ...chartProps,
    ...nivoProps,
    ...(slotProps.chart as any),
  }

  const hasValidGraph = nodes.length > 0 && links.length > 0

  const visualizerNode = (
    !hasValidGraph ? (
      renderSlot(slots.empty, slotProps.empty) ?? <ChartEmptyState />
    ) : (
      renderSlot(slots.chart, { ...defaultChartProps, ...(slotProps.chart as any) }, { defaultComponent: ResponsiveSankey as any }) ?? (
        <ResponsiveSankey {...defaultChartProps} />
      )
    )
  )

  const contextValue = {
    data: safeGraphData,
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
      nodeCount: nodes.length,
      linkCount: links.length,
      align,
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
          isEmpty: !data || !data.nodes || data.nodes.length === 0,
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
          isEmpty={!data || !data.nodes || data.nodes.length === 0}
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

export const SankeyChart = createInterfaceComponent<SankeyChartProps, SankeyChartSlots>(
  {
    name: 'SankeyChart',
    category: 'data',
    description: 'Directed flow visualizer tracing node-to-link volume transformations.',
    version: '1.0.0',
    props: {
      height: 360,
      align: 'justify',
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
  SankeyChartPrimitive
)

// Namespace attachments for compound family ergonomics
SankeyChart.Provider = SankeyChartProvider
SankeyChart.Container = ChartContainer
SankeyChart.Header = ChartHeader
SankeyChart.Toolbar = ChartToolbar
SankeyChart.Legend = ChartLegend
SankeyChart.Canvas = ChartCanvas
SankeyChart.Tooltip = ChartTooltip
SankeyChart.Empty = ChartEmptyState
SankeyChart.Loading = ChartLoadingState
SankeyChart.Footer = ChartFooter
