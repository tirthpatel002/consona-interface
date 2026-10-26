import React from 'react'
import { ResponsiveChord, type ChordSvgProps } from '@nivo/chord'
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

export const ChordChartContext = ChartContext
export const ChordChartProvider = ChartProvider
export const useChordChartContext = useChartContext

/* ==========================================================================
   Chord Chart Slots & Props Interfaces
   ========================================================================== */

export interface ChordChartSlots {
  /** Outer container card / surface */
  container?: React.ComponentType<ChartContainerProps>
  /** Interactive chart canvas viewport container */
  canvas?: React.ComponentType<ChartCanvasProps>
  /** Underlying chart engine instance */
  chart?: React.ComponentType<ChordSvgProps>
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

export interface ChordChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'onClick' | 'onContextMenu'> {
  /** Square matrix array of numbers indicating interconnectivity weights between entities. */
  matrix?: number[][]
  /** Alias for matrix */
  data?: number[][]
  /** Entity keys corresponding to rows/cols in the matrix (e.g. ['US', 'EU', 'APAC', 'LATAM']). */
  keys?: string[]
  /** Chart height in pixels (default: 360). */
  height?: number | string
  /** Aspect ratio multiplier. Overrides height if set. */
  aspectRatio?: number
  /** Outer SVG chart margins. */
  margin?: ChartMargin
  /** Spacing angle between adjacent arc segments in degrees (default: 0.04). */
  padAngle?: number
  /** Inner radius ratio offset from perimeter (default: 0.9). */
  innerRadiusRatio?: number
  /** Inner radius offset in pixels (default: 0.02). */
  innerRadiusOffset?: number
  /** Ribbon opacity (0.0 - 1.0, default: 0.5). */
  ribbonOpacity?: number
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
  slots?: SlotComponents<ChordChartSlots>
  /** Slot props overrides for downstream customization. */
  slotProps?: SlotPropsMap<ChordChartSlots>
  className?: string
  style?: React.CSSProperties
}

/* ==========================================================================
   Chord Chart Primitive
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

function ChordChartPrimitive({
  matrix: matrixProp,
  data,
  keys = [],
  height = 360,
  aspectRatio,
  margin = { top: 40, right: 40, bottom: 40, left: 40 },
  padAngle = 0.04,
  innerRadiusRatio = 0.9,
  innerRadiusOffset = 0.02,
  ribbonOpacity = 0.5,
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
}: ChordChartProps) {
  const rawMatrix = matrixProp || data || []
  const activeMatrix = Array.isArray(rawMatrix) ? rawMatrix : []
  const safeKeys = (Array.isArray(keys) && keys.length === activeMatrix.length && keys.length > 0)
    ? keys
    : (activeMatrix.length > 0 ? activeMatrix.map((_, i) => String(i + 1)) : [])
  const { theme, colors } = useChartTheme({ palette })
  const safeColors = Array.isArray(colors) && colors.length > 0 ? colors : ['#3157D5']
  const { ref, width, isReady } = useChartDimensions({ height, aspectRatio })

  const legendItems = safeKeys.map((key, idx) => ({
    id: key,
    label: key,
    color: safeColors[idx % safeColors.length] || '#3157D5',
  }))

  const defaultChartProps = {
    data: activeMatrix,
    matrix: activeMatrix,
    keys: safeKeys,
    margin,
    padAngle,
    innerRadiusRatio,
    innerRadiusOffset,
    ribbonOpacity,
    colors: safeColors,
    valueFormat,
    theme,
    arcBorderWidth: 1,
    arcBorderColor: 'var(--border, #e5e7eb)',
    ribbonBorderWidth: 1,
    ribbonBorderColor: { from: 'color', modifiers: [['darker', 0.2]] },
    ...(onItemClick ? { onArcClick: onItemClick } : {}),
    arcTooltip: (props: any) => {
      const arc = props?.arc || props?.datum || props
      if (!arc) return null
      const title = String(arc.label || arc.id || '')
      const value = arc.formattedValue || arc.value
      const color = arc.color
      const compositeTooltip = findTooltipElement(children)
      if (compositeTooltip) {
        const tooltipPayload = {
          title,
          label: 'Total Degree',
          value,
          color,
          arc,
          datum: arc,
          data: arc,
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
          title,
          label: 'Total Degree',
          value,
          color,
          arc,
          datum: arc,
          data: arc,
          ...slotProps?.tooltip,
        })
      }
      return (
        <ChartTooltip
          title={title}
          label="Degree"
          value={value}
          color={color}
        />
      )
    },
    ribbonTooltip: (props: any) => {
      const ribbon = props?.ribbon || props
      if (!ribbon) return null
      return (
        <ChartTooltip
          title={`${ribbon.source?.label || ribbon.source?.id || ''} ⇄ ${ribbon.target?.label || ribbon.target?.id || ''}`}
          label="Flow"
          value={ribbon.formattedValue || ribbon.source?.value}
          color={ribbon.source?.color}
        />
      )
    },
    ...chartProps,
    ...nivoProps,
    ...(slotProps?.chart as any),
  }

  const hasValidMatrix =
    activeMatrix.length > 0 &&
    safeKeys.length === activeMatrix.length &&
    activeMatrix.every(
      (row) =>
        Array.isArray(row) &&
        row.length === activeMatrix.length &&
        row.every((v) => typeof v === 'number' && Number.isFinite(v))
    )

  const visualizerNode = (
    !hasValidMatrix ? (
      renderSlot(slots?.empty, slotProps?.empty) ?? <ChartEmptyState />
    ) : (
      renderSlot(slots?.chart, { ...defaultChartProps, ...slotProps?.chart }, { defaultComponent: ResponsiveChord }) ?? (
        <ResponsiveChord {...defaultChartProps} />
      )
    )
  )

  const contextValue = {
    data: activeMatrix,
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
      entityCount: safeKeys.length,
      keys: safeKeys,
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

      {renderSlot(slots?.legend, slotProps?.legend)}

      {renderSlot(
        slots?.canvas,
        {
          ref,
          height,
          isLoading,
          isEmpty: !activeMatrix || activeMatrix.length === 0,
          onContextMenu: slotProps?.container?.onContextMenu,
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
          isEmpty={!activeMatrix || activeMatrix.length === 0}
          onContextMenu={slotProps?.container?.onContextMenu}
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

export const ChordChart = createInterfaceComponent<ChordChartProps, ChordChartSlots>(
  {
    name: 'ChordChart',
    category: 'data',
    description: 'Circular matrix visualizer illustrating bidirectional flows between grouped entities.',
    version: '1.0.0',
    props: {
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
      tooltip: undefined,
      empty: undefined,
      loading: undefined,
      footer: undefined,
    },
  },
  ChordChartPrimitive
)

// Namespace attachments for compound family ergonomics
ChordChart.Provider = ChordChartProvider
ChordChart.Container = ChartContainer
ChordChart.Header = ChartHeader
ChordChart.Toolbar = ChartToolbar
ChordChart.Legend = ChartLegend
ChordChart.Canvas = ChartCanvas
ChordChart.Tooltip = ChartTooltip
ChordChart.Empty = ChartEmptyState
ChordChart.Loading = ChartLoadingState
ChordChart.Footer = ChartFooter
