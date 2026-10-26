import React, { useState, useMemo } from 'react'
import { scaleLinear, scaleBand } from 'd3-scale'
import { line, curveMonotoneX } from 'd3-shape'
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
import { useChartDimensions } from '../../hooks/use-chart-dimensions'
import { useChartTooltip } from '../../hooks/use-chart-tooltip'
import { createTooltipStore } from '../../tooltip-registry'
import type {
  ChartContainerVariant,
  ChartMargin,
  ChartTimeRange,
} from '../../types/common'

export interface CandlestickDatum {
  date: string | number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

/* ==========================================================================
   Context
   ========================================================================== */

export const CandlestickChartContext = ChartContext
export const CandlestickChartProvider = ChartProvider
export const useCandlestickChartContext = useChartContext

/* ==========================================================================
   Candlestick Chart Slots & Props Interfaces
   ========================================================================== */

export interface CandlestickChartSlots {
  /** Outer container card / surface */
  container?: React.ComponentType<ChartContainerProps>
  /** Interactive chart canvas viewport container */
  canvas?: React.ComponentType<ChartCanvasProps>
  /** Underlying chart engine / SVG instance */
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

export interface CandlestickChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'onClick' | 'onContextMenu'> {
  /** Financial OHLC dataset */
  data?: CandlestickDatum[]
  /** Moving average period overlays (e.g. [20, 50]). */
  movingAverages?: number[]
  /** Whether to render bottom volume histogram (default: true). */
  enableVolume?: boolean
  /** Bull candle color (default: 'var(--success, #10B981)'). */
  bullColor?: string
  /** Bear candle color (default: 'var(--danger, #EF4444)'). */
  bearColor?: string
  /** Chart height in pixels (default: 400). */
  height?: number | string
  /** Aspect ratio multiplier. Overrides height if set. */
  aspectRatio?: number
  /** Outer SVG margins. */
  margin?: ChartMargin
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
  /** Format currency or number values */
  priceFormat?: (val: number) => string
  /** Pass-through props directly forwarded to the underlying visualizer */
  chartProps?: Record<string, any>
  /** Additional raw visualizer props */
  nivoProps?: Record<string, any>
  /** Item click callback */
  onItemClick?: (datum: CandlestickDatum, event: React.MouseEvent) => void
  /** Props forwarded to the outer ChartContainer card */
  containerProps?: React.HTMLAttributes<HTMLDivElement>
  /** Slot overrides for downstream customization. */
  slots?: SlotComponents<CandlestickChartSlots>
  /** Slot props overrides for downstream customization. */
  slotProps?: SlotPropsMap<CandlestickChartSlots>
  /** Compound composition children */
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

/* ==========================================================================
   Candlestick Chart Primitive
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

function CandlestickChartPrimitive({
  data = [],
  movingAverages = [20],
  enableVolume = true,
  bullColor = 'var(--success, #10B981)',
  bearColor = 'var(--danger, #EF4444)',
  height = 400,
  aspectRatio,
  margin = { top: 20, right: 60, bottom: 40, left: 20 },
  containerVariant = 'default',
  title,
  description,
  badge,
  isLoading = false,
  timeRanges,
  selectedRange,
  defaultRange,
  onRangeChange,
  priceFormat = (v) => `$${v.toFixed(2)}`,
  chartProps,
  nivoProps,
  onItemClick,
  containerProps,
  slots = {},
  slotProps = {},
  children,
  className,
  style,
}: CandlestickChartProps) {
  const { ref, width, height: chartHeight, isReady } = useChartDimensions({ height, aspectRatio })
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [hiddenMA, setHiddenMA] = useState<Record<number, boolean>>({})
  const safeData = useMemo(() => {
    if (!Array.isArray(data)) return []
    return data.filter(
      (d): d is CandlestickDatum =>
        Boolean(
          d &&
            typeof d === 'object' &&
            d.date !== undefined &&
            d.date !== null &&
            typeof d.open === 'number' &&
            Number.isFinite(d.open) &&
            typeof d.high === 'number' &&
            Number.isFinite(d.high) &&
            typeof d.low === 'number' &&
            Number.isFinite(d.low) &&
            typeof d.close === 'number' &&
            Number.isFinite(d.close)
        )
    )
  }, [data])
  const safeMA = Array.isArray(movingAverages) ? movingAverages.filter((p) => typeof p === 'number' && p > 0) : [20]

  const instanceTooltipStore = useMemo(() => createTooltipStore({ persistInCanvas: true }), [])

  const toggleMA = (id: string) => {
    const period = parseInt(id.replace('ma-', ''), 10)
    if (!isNaN(period)) {
      setHiddenMA((prev) => ({ ...prev, [period]: !prev[period] }))
    }
  }

  const legendItems = [
    { id: 'bull', label: 'Bullish (Up)', color: bullColor },
    { id: 'bear', label: 'Bearish (Down)', color: bearColor },
    ...safeMA.map((period, idx) => {
      const maColors = ['#F59E0B', '#3B82F6', '#8B5CF6']
      return {
        id: `ma-${period}`,
        label: `MA (${period})`,
        color: maColors[idx % maColors.length] || '#F59E0B',
        hidden: Boolean(hiddenMA[period]),
      }
    }),
  ]

  const innerWidth = Math.max(10, width - (margin.left || 0) - (margin.right || 0))
  const innerHeight = Math.max(10, chartHeight - (margin.top || 0) - (margin.bottom || 0))
  const volumeHeight = enableVolume ? Math.floor(innerHeight * 0.22) : 0
  const candleAreaHeight = innerHeight - (enableVolume ? volumeHeight + 15 : 0)

  // Scales & Calculations
  const { minPrice, maxPrice, maxVolume, maData } = useMemo(() => {
    if (safeData.length === 0) return { minPrice: 0, maxPrice: 100, maxVolume: 1, maData: {} }

    let minP = Infinity
    let maxP = -Infinity
    let maxV = 0

    for (const d of safeData) {
      if (d.low < minP) minP = d.low
      if (d.high > maxP) maxP = d.high
      if (d.volume && d.volume > maxV) maxV = d.volume
    }

    // Moving average computation
    const maMap: Record<number, Array<{ x: number; y: number }>> = {}
    for (const period of safeMA) {
      const pts: Array<{ x: number; y: number }> = []
      if (safeData.length >= period) {
        for (let i = period - 1; i < safeData.length; i++) {
          const slice = safeData.slice(i - period + 1, i + 1)
          const avg = slice.reduce((sum, item) => sum + item.close, 0) / period
          pts.push({ x: i, y: avg })
        }
      }
      maMap[period] = pts
    }

    return {
      minPrice: minP * 0.99,
      maxPrice: maxP * 1.01,
      maxVolume: maxV || 1,
      maData: maMap,
    }
  }, [safeData, safeMA])

  const xScale = useMemo(() => {
    return scaleBand()
      .domain(safeData.map((_, i) => String(i)))
      .range([0, innerWidth])
      .padding(0.25)
  }, [safeData, innerWidth])

  const yScale = useMemo(() => {
    return scaleLinear()
      .domain([minPrice, maxPrice])
      .range([candleAreaHeight, 0])
      .nice()
  }, [minPrice, maxPrice, candleAreaHeight])

  const volumeScale = useMemo(() => {
    return scaleLinear()
      .domain([0, maxVolume])
      .range([innerHeight, innerHeight - volumeHeight])
  }, [maxVolume, innerHeight, volumeHeight])

  const candleWidth = xScale.bandwidth()

  const maPaths = useMemo(() => {
    const paths: Record<number, string> = {}
    for (const period of safeMA) {
      if (hiddenMA[period]) continue
      const pts = maData[period] || []
      if (pts.length === 0) continue
      const maLineGen = line<{ x: number; y: number }>()
        .x((pt) => (xScale(String(pt.x)) || 0) + candleWidth / 2)
        .y((pt) => yScale(pt.y))
        .curve(curveMonotoneX)
      const d = maLineGen(pts)
      if (d) paths[period] = d
    }
    return paths
  }, [safeMA, maData, xScale, candleWidth, yScale, hiddenMA])

  const renderTooltipNode = (d: CandlestickDatum) => {
    const compositeTooltip = findTooltipElement(children)
    if (compositeTooltip) {
      const tooltipPayload = {
        title: String(d.date),
        datum: d,
        close: d.close,
        open: d.open,
        high: d.high,
        low: d.low,
        volume: d.volume,
        priceFormat,
        bullColor,
        bearColor,
        isBull: d.close >= d.open,
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
        title: String(d.date),
        datum: d,
        close: d.close,
        open: d.open,
        high: d.high,
        low: d.low,
        volume: d.volume,
        priceFormat,
        bullColor,
        bearColor,
        isBull: d.close >= d.open,
        ...slotProps?.tooltip,
      })
    }
    return (
      <ChartTooltip
        title={String(d.date)}
        label="Close"
        value={priceFormat(d.close)}
        badge={`O: ${priceFormat(d.open)} | H: ${priceFormat(d.high)} | L: ${priceFormat(d.low)}`}
        color={d.close >= d.open ? bullColor : bearColor}
      />
    )
  }

  const hoverDatum = hoverIndex !== null && safeData[hoverIndex] ? safeData[hoverIndex] : null

  const visualizerNode = (
    safeData.length === 0 ? (
      renderSlot(slots.empty, slotProps.empty) ?? <ChartEmptyState />
    ) : (
      renderSlot(slots?.chart, {
        data: safeData,
        width,
        height: chartHeight,
        margin,
        movingAverages: safeMA,
        bullColor,
        bearColor,
        ...chartProps,
        ...nivoProps,
        ...slotProps.chart,
      }) ?? (
        <>
          <svg
            width="100%"
            height={chartHeight}
            className="overflow-visible select-none"
            onPointerLeave={() => {
              setHoverIndex(null)
              instanceTooltipStore.hideTooltip(false, 150)
            }}
            {...chartProps}
            {...nivoProps}
            {...(slotProps.chart as any)}
          >
            <g transform={`translate(${margin.left || 0}, ${margin.top || 0})`}>
              {/* Horizontal Grid lines */}
              {yScale.ticks(5).map((tick) => (
                <g key={tick} transform={`translate(0, ${yScale(tick)})`}>
                  <line
                    x1={0}
                    x2={innerWidth}
                    stroke="var(--border, rgba(140, 140, 140, 0.15))"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={innerWidth + 8}
                    y={4}
                    fill="var(--muted-fg, #6b7280)"
                    fontSize={10}
                    fontFamily="var(--font-mono, monospace)"
                  >
                    {priceFormat(tick)}
                  </text>
                </g>
              ))}

              {/* Vertical Dates */}
              {safeData.map((d, i) => {
                if (i % Math.ceil(safeData.length / 6) !== 0) return null
                const x = (xScale(String(i)) || 0) + candleWidth / 2
                return (
                  <text
                    key={d.date}
                    x={x}
                    y={innerHeight + 20}
                    textAnchor="middle"
                    fill="var(--muted-fg, #6b7280)"
                    fontSize={10}
                    fontFamily="var(--font-mono, monospace)"
                  >
                    {String(d.date)}
                  </text>
                )
              })}

              {/* Volume Histogram */}
              {enableVolume && (
                <g opacity={0.35}>
                  {safeData.map((d, i) => {
                    if (!d.volume) return null
                    const x = xScale(String(i)) || 0
                    const y = volumeScale(d.volume)
                    const h = innerHeight - y
                    const isBull = d.close >= d.open
                    return (
                      <rect
                        key={`vol-${d.date}`}
                        x={x}
                        y={y}
                        width={candleWidth}
                        height={Math.max(1, h)}
                        fill={isBull ? bullColor : bearColor}
                        rx={1}
                      />
                    )
                  })}
                </g>
              )}

              {/* Candlesticks (Wicks & Bodies) */}
              {safeData.map((d, i) => {
                const x = xScale(String(i)) || 0
                const isBull = d.close >= d.open
                const color = isBull ? bullColor : bearColor
                const highY = yScale(d.high)
                const lowY = yScale(d.low)
                const openY = yScale(d.open)
                const closeY = yScale(d.close)
                const bodyTop = Math.min(openY, closeY)
                const bodyHeight = Math.max(2, Math.abs(openY - closeY))
                const wickX = x + candleWidth / 2

                return (
                  <g
                    key={`candle-${d.date}`}
                    className="cursor-pointer transition-opacity duration-150"
                    opacity={hoverIndex === null || hoverIndex === i ? 1 : 0.4}
                    onMouseEnter={(e) => {
                      setHoverIndex(i)
                      const node = renderTooltipNode(d)
                      instanceTooltipStore.showTooltipFromEvent(node, e, { datum: d })
                    }}
                    onMouseMove={(e) => {
                      const node = renderTooltipNode(d)
                      instanceTooltipStore.showTooltipFromEvent(node, e, { datum: d })
                    }}
                    onMouseLeave={() => {
                      instanceTooltipStore.hideTooltip(false, 150)
                    }}
                    onClick={(e) => onItemClick?.(d, e)}
                  >
                    {/* Upper & Lower Wick */}
                    <line
                      x1={wickX}
                      x2={wickX}
                      y1={highY}
                      y2={lowY}
                      stroke={color}
                      strokeWidth={1.5}
                    />
                    {/* Real Body */}
                    <rect
                      x={x}
                      y={bodyTop}
                      width={candleWidth}
                      height={bodyHeight}
                      fill={color}
                      rx={1}
                    />
                  </g>
                )
              })}

              {/* Moving Average Line Overlays */}
              {safeMA.map((period, pIdx) => {
                const pathData = maPaths[period]
                if (!pathData) return null
                const maColors = ['#F59E0B', '#3B82F6', '#8B5CF6']
                const strokeColor = maColors[pIdx % maColors.length]

                return (
                  <path
                    key={`ma-${period}`}
                    d={pathData}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                )
              })}

              {/* Interactive Crosshair Tracking */}
              {hoverIndex !== null && safeData[hoverIndex] && (
                <g className="pointer-events-none">
                  {/* Vertical tracking line */}
                  <line
                    x1={(xScale(String(hoverIndex)) || 0) + candleWidth / 2}
                    x2={(xScale(String(hoverIndex)) || 0) + candleWidth / 2}
                    y1={0}
                    y2={innerHeight}
                    stroke="var(--fg, #111827)"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    opacity={0.4}
                  />
                  {/* Horizontal close-price tracking line */}
                  <line
                    x1={0}
                    x2={innerWidth}
                    y1={yScale(safeData[hoverIndex]!.close)}
                    y2={yScale(safeData[hoverIndex]!.close)}
                    stroke="var(--fg, #111827)"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    opacity={0.4}
                  />
                </g>
              )}
            </g>
          </svg>
        </>
      )
    )
  )


  const contextValue = {
    data: safeData,
    colors: [bullColor, bearColor],
    width,
    height,
    isReady,
    isLoading,
    legendItems,
    toggleKey: toggleMA,
    timeRanges,
    selectedRange,
    onRangeChange,
    tooltipStore: instanceTooltipStore,
    persistTooltipInCanvas: true,
    meta: {
      candleCount: safeData.length,
      minPrice,
      maxPrice,
      movingAverages: safeMA,
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

      {renderSlot(slots?.legend, slotProps?.legend) ?? (
        <div className="mb-3">
          <ChartLegend items={legendItems} onToggleItem={toggleMA} />
        </div>
      )}

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
   ========================================================================= */

export const CandlestickChart = createInterfaceComponent<CandlestickChartProps, CandlestickChartSlots>(
  {
    name: 'CandlestickChart',
    category: 'data',
    description: 'Financial OHLC candlestick visualizer with Moving Average overlays, volume histograms, and precision crosshairs.',
    version: '1.0.0',
    props: {
      height: 400,
      enableVolume: true,
      movingAverages: [20],
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
  CandlestickChartPrimitive
)

CandlestickChart.Provider = CandlestickChartProvider
CandlestickChart.Container = ChartContainer
CandlestickChart.Header = ChartHeader
CandlestickChart.Toolbar = ChartToolbar
CandlestickChart.Legend = ChartLegend
CandlestickChart.Canvas = ChartCanvas
CandlestickChart.Tooltip = ChartTooltip
CandlestickChart.Empty = ChartEmptyState
CandlestickChart.Loading = ChartLoadingState
CandlestickChart.Footer = ChartFooter

