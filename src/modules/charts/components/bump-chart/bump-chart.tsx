import React, { useState } from 'react'
import { ResponsiveBump, type BumpSerie, type BumpSvgProps } from '@nivo/bump'
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

export const BumpChartContext = ChartContext
export const BumpChartProvider = ChartProvider
export const useBumpChartContext = useChartContext

/* ==========================================================================
   Bump Chart Slots & Props Interfaces
   ========================================================================== */

export interface BumpChartSlots {
  /** Outer container card / surface */
  container?: React.ComponentType<ChartContainerProps>
  /** Interactive chart canvas viewport container */
  canvas?: React.ComponentType<ChartCanvasProps>
  /** Underlying chart engine instance */
  chart?: React.ComponentType<BumpSvgProps<any, any>>
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

export interface BumpChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'onClick' | 'onContextMenu'> {
  /** Ranking series dataset array with id and array of {x, y} ranking points. */
  data?: Array<BumpSerie<any, any>>
  /** Chart height in pixels (default: 360). */
  height?: number | string
  /** Aspect ratio multiplier. Overrides height if set. */
  aspectRatio?: number
  /** Outer SVG chart margins. */
  margin?: ChartMargin
  /** Line stroke width in pixels (default: 3). */
  lineWidth?: number
  /** Point node circle diameter in pixels (default: 10). */
  pointSize?: number
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
  /** Callback when a ranking node/serie is clicked */
  onItemClick?: (datum: any, event: React.MouseEvent) => void
  /** Pass-through props directly to underlying chart component */
  chartProps?: Record<string, any>
  /** Alias for chartProps */
  nivoProps?: Record<string, any>
  /** Props forwarded to the outer ChartContainer card */
  containerProps?: React.HTMLAttributes<HTMLDivElement>
  /** Slot overrides for downstream customization. */
  slots?: SlotComponents<BumpChartSlots>
  /** Slot props overrides for downstream customization. */
  slotProps?: SlotPropsMap<BumpChartSlots>
  className?: string
  style?: React.CSSProperties
}

/* ==========================================================================
   Bump Chart Primitive
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

function BumpChartPrimitive({
  data = [],
  height = 360,
  aspectRatio,
  margin = { top: 40, right: 80, bottom: 40, left: 80 },
  lineWidth = 3,
  pointSize = 10,
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
  onItemClick,
  chartProps,
  nivoProps,
  slots = {},
  slotProps = {},
  containerProps,
  className,
  style,
  children,
}: BumpChartProps) {
  const { theme, colors } = useChartTheme({ palette })
  const { ref, width, isReady } = useChartDimensions({ height, aspectRatio })
  const safeData = React.useMemo(() => {
    if (!Array.isArray(data)) return []
    return data
      .filter((s): s is BumpSerie<any, any> => Boolean(s && typeof s === 'object' && s.id != null && Array.isArray(s.data)))
      .map((s) => ({
        ...s,
        data: s.data.filter(
          (d: any) =>
            d != null &&
            typeof d === 'object' &&
            d.x !== undefined &&
            d.x !== null &&
            (d.y === null || (typeof d.y === 'number' && Number.isFinite(d.y)))
        ),
      }))
      .filter((s) => s.data.length > 0)
  }, [data])
  const safeColors = Array.isArray(colors) && colors.length > 0 ? colors : ['#3157D5']
  const [hiddenSeries, setHiddenSeries] = useState<Record<string, boolean>>({})

  const hasValidData =
    safeData.length > 0 &&
    safeData.every((s) => s && s.id != null && Array.isArray(s.data) && s.data.length > 0)
  const visibleData = hasValidData
    ? safeData.filter((s) => s && s.id != null && !hiddenSeries[String(s.id)])
    : []

  const legendItems = safeData.map((s, idx) => ({
    id: String(s?.id ?? idx),
    label: String(s?.id ?? idx),
    color: safeColors[idx % safeColors.length] || '#3157D5',
    hidden: Boolean(hiddenSeries[String(s?.id ?? idx)]),
  }))

  const toggleSeries = (id: string) => {
    setHiddenSeries((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const renderPointTooltip = (props: any) => {
    const point = props?.point || props?.datum || props
    if (!point) return null
    const seriesId = String(point.serie?.id ?? point.serieId ?? point.id?.split('.')?.[0] ?? '')
    const xVal = point.data?.x ?? point.x ?? ''
    const yVal = point.data?.y ?? point.y
    const color = point.serie?.color || point.color

    const rawSeries = safeData.find((s) => String(s?.id) === seriesId)
    const seriesDataList: Array<{ x: string | number; y: number | null }> =
      rawSeries?.data ||
      (Array.isArray(point.serie?.data?.data) ? point.serie.data.data : [])

    const currentIdx = seriesDataList.findIndex((d) => String(d.x) === String(xVal))
    const prevPoint = currentIdx > 0 ? seriesDataList[currentIdx - 1] : null
    const prevRank = prevPoint?.y ?? null

    let rankChangeText: string | null = null
    let isImproved = false
    let isDropped = false

    if (prevRank !== null && yVal !== null && yVal !== undefined) {
      const diff = prevRank - yVal // In leaderboard, rank 3 -> 1 is +2 positions
      if (diff > 0) {
        rankChangeText = `+${diff} ${diff === 1 ? 'spot' : 'spots'}`
        isImproved = true
      } else if (diff < 0) {
        rankChangeText = `${diff} ${Math.abs(diff) === 1 ? 'spot' : 'spots'}`
        isDropped = true
      } else {
        rankChangeText = 'No change'
      }
    }

    let bestRank = Infinity
    let worstRank = -Infinity
    for (const d of seriesDataList) {
      if (d.y !== null && d.y !== undefined) {
        if (d.y < bestRank) bestRank = d.y
        if (d.y > worstRank) worstRank = d.y
      }
    }

    const badgeText = yVal !== null && yVal !== undefined
      ? `${xVal} • Rank #${yVal}`
      : `${xVal} • Unranked`

    const compositeTooltip = findTooltipElement(children)
    if (compositeTooltip) {
      const tooltipPayload = {
        title: seriesId,
        label: `Rank in ${xVal}`,
        value: yVal !== null && yVal !== undefined ? `#${yVal}` : 'Unranked',
        color,
        badge: badgeText,
        xVal,
        yVal,
        rankChangeText,
        bestRank: bestRank !== Infinity ? bestRank : null,
        worstRank: worstRank !== -Infinity ? worstRank : null,
        point,
        serie: point.serie,
        datum: point.data || point,
        data: point.data || point,
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
        title: seriesId,
        label: `Rank in ${xVal}`,
        value: yVal !== null && yVal !== undefined ? `#${yVal}` : 'Unranked',
        color,
        badge: badgeText,
        xVal,
        yVal,
        rankChangeText,
        bestRank: bestRank !== Infinity ? bestRank : null,
        worstRank: worstRank !== -Infinity ? worstRank : null,
        point,
        serie: point.serie,
        datum: point.data || point,
        data: point.data || point,
        ...slotProps?.tooltip,
      })
    }
    return (
      <ChartTooltip title={seriesId} badge={badgeText}>
        <ChartTooltip.Row>
          <div className="flex items-center gap-1.5">
            <ChartTooltip.Indicator color={color} shape="circle" />
            <span className="text-muted-fg">{`Rank in ${xVal}:`}</span>
          </div>
          <ChartTooltip.Value>
            {yVal !== null && yVal !== undefined ? `#${yVal}` : 'Unranked'}
          </ChartTooltip.Value>
        </ChartTooltip.Row>
        {prevPoint && rankChangeText && (
          <ChartTooltip.Row>
            <span className="text-muted-fg text-2xs">{`vs ${prevPoint.x}:`}</span>
            <span
              className={`font-mono text-2xs font-semibold ${
                isImproved ? 'text-success' : isDropped ? 'text-danger' : 'text-muted-fg'
              }`}
            >
              {rankChangeText}
            </span>
          </ChartTooltip.Row>
        )}
        {bestRank !== Infinity && worstRank !== -Infinity && bestRank !== worstRank && (
          <ChartTooltip.Row>
            <span className="text-muted-fg text-2xs">Career Range:</span>
            <span className="text-fg font-mono text-2xs">
              {`#${bestRank} – #${worstRank}`}
            </span>
          </ChartTooltip.Row>
        )}
      </ChartTooltip>
    )
  }

  const defaultChartProps = {
    data: visibleData,
    margin,
    lineWidth,
    pointSize,
    pointColor: { theme: 'background' },
    pointBorderWidth: 2,
    pointBorderColor: { from: 'serie.color' },
    colors: safeColors,
    theme,
    onClick: (point: any, event: any) => {
      onItemClick?.(point, event)
      slotProps.chart?.onClick?.(point, event)
    },
    pointTooltip: renderPointTooltip,
    tooltip: renderPointTooltip,
    lineTooltip: (props: any) => {
      const s = props?.serie || props
      if (!s) return null
      const seriesId = String(s.id ?? s.data?.id ?? '')
      const rawSeries = safeData.find((item) => String(item?.id) === seriesId)
      const points: Array<{ x: string | number; y: number | null }> =
        rawSeries?.data ||
        (Array.isArray(s.points) ? s.points.map((p: any) => p.data) : [])

      const latestPoint = points[points.length - 1]
      const currentRank = latestPoint?.y

      let bestRank = Infinity
      let worstRank = -Infinity
      for (const d of points) {
        if (d.y !== null && d.y !== undefined) {
          if (d.y < bestRank) bestRank = d.y
          if (d.y > worstRank) worstRank = d.y
        }
      }

      const color = s.color || rawSeries?.color || s.data?.color
      return (
        <ChartTooltip
          title={seriesId}
          badge={`${points.length} tracked intervals`}
        >
          <ChartTooltip.Row>
            <div className="flex items-center gap-1.5">
              <ChartTooltip.Indicator color={color} shape="line" />
              <span className="text-muted-fg">Current Rank:</span>
            </div>
            <ChartTooltip.Value>
              {currentRank !== null && currentRank !== undefined ? `#${currentRank}` : 'Unranked'}
            </ChartTooltip.Value>
          </ChartTooltip.Row>
          {bestRank !== Infinity && (
            <ChartTooltip.Row>
              <span className="text-muted-fg text-2xs">Best Peak Rank:</span>
              <span className="text-success font-mono text-2xs font-semibold">#{bestRank}</span>
            </ChartTooltip.Row>
          )}
          {bestRank !== Infinity && worstRank !== -Infinity && (
            <ChartTooltip.Row>
              <span className="text-muted-fg text-2xs">Overall Range:</span>
              <span className="text-fg font-mono text-2xs">#{bestRank} – #{worstRank}</span>
            </ChartTooltip.Row>
          )}
        </ChartTooltip>
      )
    },
    axisTop: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
    },
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
    axisRight: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
    },
    ...chartProps,
    ...nivoProps,
    ...(slotProps?.chart as any),
  }

  const visualizerNode = (
    !hasValidData || visibleData.length === 0 ? (
      renderSlot(slots?.empty, slotProps?.empty) ?? <ChartEmptyState />
    ) : (
      renderSlot(slots?.chart, { ...defaultChartProps, ...slotProps?.chart }, { defaultComponent: ResponsiveBump }) ?? (
        <ResponsiveBump {...defaultChartProps} />
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
    meta: { lineWidth, pointSize },
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

      {safeData.length > 1 && (
        <div className="mb-3">
          {renderSlot(slots?.legend, slotProps?.legend) ?? (
            <ChartLegend items={legendItems} onToggleItem={toggleSeries} />
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
          onContextMenu={((slotProps?.chart as any)?.onContextMenu || slotProps?.container?.onContextMenu) as any}
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

export const BumpChart = createInterfaceComponent<BumpChartProps, BumpChartSlots>(
  {
    name: 'BumpChart',
    category: 'data',
    description: 'Ranking change visualizer mapping relative position movements across sequential time steps.',
    version: '1.0.0',
    props: {
      height: 360,
      lineWidth: 3,
      pointSize: 10,
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
  BumpChartPrimitive
)

// Namespace attachments for compound family ergonomics
BumpChart.Provider = BumpChartProvider
BumpChart.Container = ChartContainer
BumpChart.Header = ChartHeader
BumpChart.Toolbar = ChartToolbar
BumpChart.Legend = ChartLegend
BumpChart.Canvas = ChartCanvas
BumpChart.Tooltip = ChartTooltip
BumpChart.Empty = ChartEmptyState
BumpChart.Loading = ChartLoadingState
BumpChart.Footer = ChartFooter
