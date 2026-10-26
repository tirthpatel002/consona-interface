import React, { useState } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap, SlotDefinition } from '../../../../core/types'
import type { ChartTimeRange, ChartToolbarAction } from '../../types/common'
import { useChartDimensions } from '../../hooks/use-chart-dimensions'
import { useChartContext } from '../chart-context'

/* ==========================================================================
   Chart Container Styles & Surface Ramps
   ========================================================================== */

export const chartContainerStyles = tv({
  base: [
    'relative isolate flex flex-col overflow-hidden text-fg transition-all duration-200',
    'rounded-macro border w-full',
  ],
  variants: {
    variant: {
      default:
        'bg-overlay/60 backdrop-blur-md border-border/80 shadow-xs',
      glass:
        'bg-overlay/40 backdrop-blur-xl border-border/60 shadow-md ring-1 ring-white/10 dark:ring-white/5',
      subtle:
        'bg-secondary/30 border-border/60 shadow-2xs',
      bordered:
        'bg-transparent border-border hover:bg-secondary/10',
      flat:
        'bg-muted/40 border-transparent',
      glow:
        'bg-overlay/70 backdrop-blur-xl border-primary/40 ring-1 ring-primary/20 shadow-lg',
    },
    padding: {
      none: 'p-0',
      sm: 'p-space-sm sm:p-space-md gap-y-space-sm',
      md: 'p-space-md sm:p-space-lg gap-y-space-md',
      lg: 'p-space-lg sm:p-space-xl gap-y-space-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'md',
  },
})

/* ==========================================================================
   Chart Container Slots & Component Definition
   ========================================================================== */

export interface ChartContainerSlots {
  /** Top header region */
  header?: React.ComponentType<ChartHeaderProps>
  /** Top action / range switcher toolbar */
  toolbar?: React.ComponentType<ChartToolbarProps>
  /** Series legend indicator */
  legend?: React.ComponentType<ChartLegendProps>
  /** Interactive chart canvas viewport container */
  canvas?: React.ComponentType<ChartCanvasProps>
  /** Main visual content area (alias for canvas) */
  content?: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
  /** Bottom summary / metric footer */
  footer?: React.ComponentType<ChartFooterProps>
}

export interface ChartContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof chartContainerStyles> {
  /** Visual surface variant: default, glass, subtle, bordered, flat, glow. */
  variant?: 'default' | 'glass' | 'subtle' | 'bordered' | 'flat' | 'glow'
  /** Internal padding ramp: none, sm, md, lg. */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** Slot overrides for downstream customization. */
  slots?: SlotComponents<ChartContainerSlots>
  /** Slot props overrides for downstream customization. */
  slotProps?: SlotPropsMap<ChartContainerSlots>
}

const ChartContainerPrimitive = ({
  className,
  variant = 'default',
  padding = 'md',
  slots = {},
  slotProps = {},
  children,
  ...props
}: ChartContainerProps) => {
  return (
    <div
      data-slot="chart-container"
      className={cn(chartContainerStyles({ variant, padding }), className)}
      {...props}
    >
      {children ?? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-space-md">
            {renderSlot(slots?.header, slotProps?.header)}
            {renderSlot(slots?.toolbar, slotProps?.toolbar)}
          </div>
          {renderSlot(slots?.legend, slotProps?.legend)}
          {renderSlot(slots?.canvas, slotProps?.canvas) ?? renderSlot(slots?.content, slotProps?.content)}
          {renderSlot(slots?.footer, slotProps?.footer)}
        </>
      )}
    </div>
  )
}

export const ChartContainer = createInterfaceComponent<ChartContainerProps, ChartContainerSlots>(
  {
    name: 'ChartContainer',
    category: 'data',
    description: 'Concentric card container designed for hosting interactive SaaS visualizers and Nivo charts.',
    version: '1.0.0',
    props: {
      variant: 'default',
      padding: 'md',
    },
    slots: {
      header: undefined,
      toolbar: undefined,
      legend: undefined,
      canvas: undefined,
      content: undefined,
      footer: undefined,
    },
  },
  ChartContainerPrimitive
)

/* ==========================================================================
   Chart Header Sub-Atom
   ========================================================================== */

export interface ChartHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Chart title text */
  title?: string
  /** Subtitle or metric explanation */
  description?: string
  /** Main stat badge value (e.g. '$124.5k' or '+18.4%') */
  badge?: string
  /** Badge intent styling (success, primary, warning, danger, accent) */
  badgeIntent?: 'success' | 'primary' | 'warning' | 'danger' | 'accent' | 'default'
}

const ChartHeaderPrimitive = ({
  className,
  title,
  description,
  badge,
  badgeIntent = 'primary',
  children,
  ...props
}: ChartHeaderProps) => {
  if (children != null) {
    return (
      <div data-slot="chart-header" className={cn('flex flex-col gap-1 min-w-0', className)} {...props}>
        {children}
      </div>
    )
  }

  return (
    <div
      data-slot="chart-header"
      className={cn('flex flex-col gap-1 min-w-0', className)}
      {...props}
    >
      <div className="flex items-center gap-2 flex-wrap">
        {title && (
          <h3 className="text-sm sm:text-base font-semibold text-fg tracking-tight truncate">
            {title}
          </h3>
        )}
        {badge && (
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-micro text-2xs sm:text-xs font-semibold',
              badgeIntent === 'success' && 'bg-success/15 text-success border border-success/30',
              badgeIntent === 'danger' && 'bg-danger/15 text-danger border border-danger/30',
              badgeIntent === 'warning' && 'bg-warning/15 text-warning border border-warning/30',
              badgeIntent === 'accent' && 'bg-accent/30 text-fg border border-accent',
              badgeIntent === 'primary' && 'bg-primary/15 text-primary border border-primary/30',
              badgeIntent === 'default' && 'bg-secondary text-secondary-fg border border-border'
            )}
          >
            {badge}
          </span>
        )}
      </div>
      {description && (
        <p className="text-xs text-muted-fg leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}

export const ChartHeader = createInterfaceComponent<ChartHeaderProps>(
  {
    name: 'ChartHeader',
    category: 'data',
    description: 'Header container organizing chart titles, descriptions, and KPI trend badges.',
    version: '1.0.0',
  },
  ChartHeaderPrimitive
)

/* ==========================================================================
   Chart Toolbar Sub-Atom
   ========================================================================== */

export interface ChartToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Available time range filter options (e.g. ['1D', '1W', '1M', '1Y', 'ALL']) */
  timeRanges?: ChartTimeRange[]
  /** Controlled currently selected time range */
  selectedRange?: ChartTimeRange
  /** Default selected time range when uncontrolled */
  defaultRange?: ChartTimeRange
  /** Callback fired when a time range is clicked */
  onRangeChange?: (range: ChartTimeRange) => void
  /** Additional action items */
  actions?: ChartToolbarAction[]
}

const ChartToolbarPrimitive = ({
  className,
  timeRanges: propTimeRanges,
  selectedRange: propSelectedRange,
  defaultRange,
  onRangeChange: propOnRangeChange,
  actions = [],
  children,
  ...props
}: ChartToolbarProps) => {
  const ctx = useChartContext()
  const rawRanges = propTimeRanges ?? ctx.timeRanges ?? ['1D', '1W', '1M', '1Y', 'ALL']
  const timeRanges = Array.isArray(rawRanges) ? rawRanges : []
  const controlledRange = propSelectedRange ?? ctx.selectedRange
  const onRangeChange = propOnRangeChange ?? ctx.onRangeChange

  const [internalRange, setInternalRange] = useState<ChartTimeRange>(
    controlledRange || defaultRange || (timeRanges.length > 0 ? timeRanges[0] : undefined) || '1M'
  )

  React.useEffect(() => {
    if (controlledRange !== undefined) {
      setInternalRange(controlledRange)
    }
  }, [controlledRange])

  const isControlled = controlledRange !== undefined && onRangeChange !== undefined
  const activeRange = isControlled ? controlledRange : internalRange

  const handleRangeClick = (range: ChartTimeRange) => {
    setInternalRange(range)
    onRangeChange?.(range)
  }

  if (children != null) {
    return (
      <div data-slot="chart-toolbar" className={cn('flex items-center gap-1.5 flex-wrap ml-auto', className)} {...props}>
        {children}
      </div>
    )
  }

  return (
    <div
      data-slot="chart-toolbar"
      className={cn('flex items-center gap-1.5 flex-wrap ml-auto', className)}
      {...props}
    >
      {timeRanges.length > 0 && (
        <div className="inline-flex items-center p-0.5 rounded-micro bg-secondary/50 border border-border/60">
          {timeRanges.map((range) => {
            const isSelected = activeRange === range
            return (
              <button
                key={range}
                type="button"
                onClick={() => handleRangeClick(range)}
                className={cn(
                  'px-2 py-0.5 text-2xs font-medium rounded-atom transition-all duration-150 cursor-pointer',
                  isSelected
                    ? 'bg-overlay text-fg font-semibold shadow-2xs border border-border/80'
                    : 'text-muted-fg hover:text-fg hover:bg-overlay/40'
                )}
              >
                {range}
              </button>
            )
          })}
        </div>
      )}

      {Array.isArray(actions) && actions.map((action) => {
        const Icon = action.icon
        return (
          <button
            key={action.id}
            type="button"
            disabled={action.disabled}
            onClick={action.onClick}
            className="inline-flex items-center gap-1 px-2 py-1 text-2xs font-medium rounded-micro bg-secondary/40 hover:bg-secondary border border-border/60 text-muted-fg hover:text-fg transition-all"
          >
            {Icon && <Icon className="w-3 h-3" />}
            {action.label}
          </button>
        )
      })}
    </div>
  )
}

export const ChartToolbar = createInterfaceComponent<ChartToolbarProps>(
  {
    name: 'ChartToolbar',
    category: 'data',
    description: 'Time range switcher and quick action bar for chart visualizers.',
    version: '1.0.0',
  },
  ChartToolbarPrimitive
)

/* ==========================================================================
   Chart Legend Sub-Atom
   ========================================================================== */

export interface ChartLegendItem {
  id: string
  label: string
  color: string
  hidden?: boolean
}

export interface ChartLegendProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of data items to display. */
  items?: ChartLegendItem[]
  /** Callback fired when an item visibility toggle is triggered. */
  onToggleItem?: (id: string) => void
  /** Alignment positioning for the elements. */
  align?: 'left' | 'center' | 'right'
}

const ChartLegendPrimitive = ({
  className,
  items: propItems,
  onToggleItem: propOnToggleItem,
  align = 'left',
  children,
  ...props
}: ChartLegendProps) => {
  const ctx = useChartContext()
  const rawItems = propItems ?? ctx.legendItems ?? []
  const items = Array.isArray(rawItems) ? rawItems : []
  const onToggleItem = propOnToggleItem ?? ctx.toggleKey

  if (children != null) {
    return (
      <div data-slot="chart-legend" className={cn('flex flex-wrap items-center gap-3 pt-1 text-xs', className)} {...props}>
        {children}
      </div>
    )
  }

  if (items.length === 0) return null

  return (
    <div
      data-slot="chart-legend"
      className={cn(
        'flex flex-wrap items-center gap-3 pt-1 text-xs',
        align === 'center' && 'justify-center',
        align === 'right' && 'justify-end',
        align === 'left' && 'justify-start',
        className
      )}
      {...props}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onToggleItem?.(item.id)}
          className={cn(
            'inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-micro transition-opacity hover:opacity-100 cursor-pointer',
            item.hidden ? 'opacity-40 line-through' : 'opacity-90'
          )}
        >
          <span
            className="w-2.5 h-2.5 rounded-atom shrink-0 shadow-2xs"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-fg text-2xs sm:text-xs font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  )
}

export const ChartLegend = createInterfaceComponent<ChartLegendProps>(
  {
    name: 'ChartLegend',
    category: 'data',
    description: 'Interactive legend component supporting series toggle and color identification.',
    version: '1.0.0',
  },
  ChartLegendPrimitive
)

/* ==========================================================================
   Chart Tooltip Sub-Atom & Compound Pieces
   ========================================================================== */

export interface ChartTooltipProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
  /** Main header title of the tooltip card. */
  title?: React.ReactNode
  /** Metric series label. */
  label?: string | number
  /** Formatted metric numeric value. */
  value?: string | number
  /** Series indicator color swatch. */
  color?: string
  /** Trend or categorical badge text. */
  badge?: React.ReactNode
  /** Badge visual variant style. */
  badgeVariant?: 'default' | 'success' | 'danger' | 'warning' | 'info'
  /** Visual indicator shape. */
  indicatorShape?: 'circle' | 'square' | 'line'
  /** Whether to force direct DOM rendering instead of delegating to CanvasTooltipOverlay */
  standalone?: boolean
  /** Children or render function */
  children?: React.ReactNode | ((payload: any) => React.ReactNode)
  /** Additional chart engine-specific payload properties (datum, point, slice, etc.). */
  [key: string]: any
}

import {
  ChartTooltipStoreContext,
  defaultChartTooltipStore,
  useTooltipStoreState,
  type TooltipStore,
} from '../../tooltip-registry'

export interface ChartTooltipHeaderProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'title'> {
  /** Title or heading node rendered at the top of the tooltip card. */
  title?: React.ReactNode
}

const ChartTooltipHeader = ({ className, title, children, ...props }: ChartTooltipHeaderProps) => (
  <span className={cn('font-semibold text-muted-fg text-2xs border-b border-border/40 pb-1', className)} {...props}>
    {children ?? title}
  </span>
)

export interface ChartTooltipSectionProps extends React.HTMLAttributes<HTMLDivElement> {}

const ChartTooltipSection = ({ className, children, ...props }: ChartTooltipSectionProps) => (
  <div
    data-slot="chart-tooltip-section"
    className={cn('flex flex-col gap-1 pt-1 border-t border-border/40 first:border-t-0 first:pt-0', className)}
    {...props}
  >
    {children}
  </div>
)

export interface ChartTooltipRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Metric or series label descriptor. */
  label?: React.ReactNode
  /** Primary metric value display. */
  value?: React.ReactNode
  /** Color indicator accent matching series palette. */
  color?: string
  /** Geometric shape for the series bullet indicator. */
  indicatorShape?: 'circle' | 'square' | 'line'
}

const ChartTooltipRow = ({
  className,
  label,
  value,
  color,
  indicatorShape = 'square',
  children,
  ...props
}: ChartTooltipRowProps) => {
  if (children != null) {
    return (
      <div className={cn('flex items-center justify-between gap-3', className)} {...props}>
        {children}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center justify-between gap-3', className)} {...props}>
      <div className="flex items-center gap-1.5">
        {color && <ChartTooltipIndicator color={color} shape={indicatorShape} />}
        {label && <span className="text-muted-fg">{label}:</span>}
      </div>
      {value !== undefined && <ChartTooltipValue>{value}</ChartTooltipValue>}
    </div>
  )
}

const ChartTooltipIndicator = ({
  color,
  shape = 'square',
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { color?: string; shape?: 'circle' | 'square' | 'line' }) => (
  <span
    className={cn(
      'shrink-0',
      shape === 'circle' && 'w-2 h-2 rounded-full',
      shape === 'square' && 'w-2 h-2 rounded-atom',
      shape === 'line' && 'w-3 h-1 rounded-full',
      className
    )}
    style={{ backgroundColor: color }}
    {...props}
  />
)

export interface ChartTooltipValueProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Raw metric value or formatted display node. */
  value?: React.ReactNode
}

const ChartTooltipValue = ({ className, value, children, ...props }: ChartTooltipValueProps) => (
  <span className={cn('font-bold text-fg font-mono', className)} {...props}>
    {children ?? value}
  </span>
)

export interface ChartTooltipBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Semantic status or trend badge variant. */
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info'
}

const ChartTooltipBadge = ({
  className,
  variant = 'default',
  children,
  ...props
}: ChartTooltipBadgeProps) => {
  const variantStyles = {
    default: 'bg-muted/50 text-muted-fg border-border/60',
    success: 'bg-success/15 text-success border-success/30',
    danger: 'bg-danger/15 text-danger border-danger/30',
    warning: 'bg-warning/15 text-warning border-warning/30',
    info: 'bg-primary/15 text-primary border-primary/30',
  }
  return (
    <span
      className={cn(
        'text-3xs px-1.5 py-0.5 rounded-micro font-mono font-bold border',
        variantStyles[variant] || variantStyles.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

const ChartTooltipPrimitive = ({
  className,
  title,
  label,
  value,
  color,
  badge,
  badgeVariant = 'default',
  indicatorShape = 'square',
  children,
  ...props
}: ChartTooltipProps) => {
  const chartCtx = useChartContext()
  const contextStore = React.useContext(ChartTooltipStoreContext)
  const activeStore = chartCtx.tooltipStore || contextStore

  const content = typeof children === 'function'
    ? children({ title, label, value, color, badge, badgeVariant, ...props })
    : children

  const cardContent = content ?? (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1">
        {title && <ChartTooltipHeader className="border-b-0 pb-0">{title}</ChartTooltipHeader>}
        {badge && <ChartTooltipBadge variant={badgeVariant}>{badge}</ChartTooltipBadge>}
      </div>
      <ChartTooltipRow>
        <div className="flex items-center gap-1.5">
          {color && <ChartTooltipIndicator color={color} shape={indicatorShape} />}
          {label && <span className="text-muted-fg">{label}:</span>}
        </div>
        {value !== undefined && <ChartTooltipValue>{value}</ChartTooltipValue>}
      </ChartTooltipRow>
    </>
  )

  const cardNode = (
    <div
      data-slot="chart-tooltip"
      className={cn(
        'flex flex-col gap-1 min-w-[120px] p-2 sm:p-2.5 rounded-micro bg-overlay/95 backdrop-blur-xl border border-border/80 text-fg shadow-lg text-2xs sm:text-xs pointer-events-none',
        className
      )}
      {...props}
    >
      {cardContent}
    </div>
  )

  React.useLayoutEffect(() => {
    if (activeStore) {
      activeStore.showTooltip(cardNode, {
        datum: props.datum || props.data || props.point || props.cell || props.bar || props.node || props.arc,
      })
    }
  }, [title, label, value, color, badge, badgeVariant, content, activeStore])

  // Suppress rendering inside Nivo's unmounting legacy container when CanvasTooltipOverlay is active
  if (activeStore && !props.standalone) {
    return null
  }

  return cardNode
}

export interface ChartTooltipBridgeProps {
  /** Custom React node or slot payload to mount in the persistent canvas overlay. */
  content: React.ReactNode
  /** Datum payload containing active metric attributes and hovered record state. */
  datum?: any
  /** Optional alignment or anchor constraint for tooltip positioning. */
  anchor?: string
}

/**
 * Headless bridge component forwarding custom slot tooltip content to the canvas tooltip store
 * while returning null to suppress Nivo's unmounting legacy wrapper.
 */
export const ChartTooltipBridge: React.FC<ChartTooltipBridgeProps> = ({ content, datum, anchor }) => {
  const chartCtx = useChartContext()
  const contextStore = React.useContext(ChartTooltipStoreContext)
  const activeStore = chartCtx.tooltipStore || contextStore

  React.useLayoutEffect(() => {
    if (activeStore && content) {
      activeStore.showTooltip(content, { datum, anchor: anchor as any })
    }
  }, [activeStore, content, datum, anchor])

  return null
}

export const ChartTooltip = createInterfaceComponent<ChartTooltipProps>(
  {
    name: 'ChartTooltip',
    category: 'data',
    description: 'Glassmorphism tooltip container rendering rich metric hovercards.',
    version: '1.0.0',
  },
  ChartTooltipPrimitive
)

export const { Context: ChartTooltipContext, useCompoundContext: useChartTooltipContext } =
  createCompoundContext<any>('ChartTooltip')

ChartTooltip.Header = ChartTooltipHeader
ChartTooltip.Section = ChartTooltipSection
ChartTooltip.Row = ChartTooltipRow
ChartTooltip.Indicator = ChartTooltipIndicator
ChartTooltip.Value = ChartTooltipValue
ChartTooltip.Badge = ChartTooltipBadge

/* ==========================================================================
   Canvas Tooltip Overlay Sub-Atom (Persistent, Non-Flickering)
   ========================================================================== */

export interface CanvasTooltipOverlayProps {
  /** Custom TooltipStore instance controlling active display and pointer coordinates. */
  store?: TooltipStore | null
}

export const CanvasTooltipOverlay: React.FC<CanvasTooltipOverlayProps> = ({ store }) => {
  const chartCtx = useChartContext()
  const contextStore = React.useContext(ChartTooltipStoreContext)
  const activeStore = store || chartCtx.tooltipStore || contextStore || defaultChartTooltipStore
  const state = useTooltipStoreState(activeStore)

  const tooltipRef = React.useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = React.useState<{ width: number; height: number }>({ width: 0, height: 0 })
  const lastContentRef = React.useRef<React.ReactNode>(null)
  const hasEnteredRef = React.useRef(false)
  const [enableMotionTransition, setEnableMotionTransition] = React.useState(false)

  if (state.content) {
    lastContentRef.current = state.content
  }

  // Measure tooltip bounding box smoothly
  React.useLayoutEffect(() => {
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0 && (rect.width !== dimensions.width || rect.height !== dimensions.height)) {
        setDimensions({ width: rect.width, height: rect.height })
      }
    }
  }, [state.content, state.isOpen])

  // Track initial entrance vs inter-item motion
  React.useEffect(() => {
    if (state.isOpen) {
      if (!hasEnteredRef.current) {
        // Initial entrance: snap position instantly, then enable gliding transition on next tick
        hasEnteredRef.current = true
        setEnableMotionTransition(false)
        const frame = requestAnimationFrame(() => {
          setEnableMotionTransition(true)
        })
        return () => cancelAnimationFrame(frame)
      }
    } else {
      hasEnteredRef.current = false
      setEnableMotionTransition(false)
    }
  }, [state.isOpen])

  const renderedContent = state.content || lastContentRef.current

  if (!renderedContent && !state.isOpen) {
    return null
  }

  const canvasWidth = typeof chartCtx.width === 'number' && chartCtx.width > 0 ? chartCtx.width : 600
  const rawHeight = typeof chartCtx.height === 'number' ? chartCtx.height : typeof chartCtx.height === 'string' ? parseInt(chartCtx.height, 10) : 360
  const canvasHeight = !isNaN(rawHeight) && rawHeight > 0 ? rawHeight : 360

  const tw = dimensions.width || 140
  const th = dimensions.height || 60

  let left = state.x
  let top = state.y

  if (state.anchor === 'top') {
    left = state.x - tw / 2
    top = state.y - th - 12
    if (top < 8) {
      top = state.y + 14
    }
  } else if (state.anchor === 'bottom') {
    left = state.x - tw / 2
    top = state.y + 14
    if (top + th > canvasHeight - 8) {
      top = state.y - th - 12
    }
  } else if (state.anchor === 'left') {
    left = state.x - tw - 14
    top = state.y - th / 2
  } else if (state.anchor === 'right') {
    left = state.x + 14
    top = state.y - th / 2
  } else {
    // center
    left = state.x - tw / 2
    top = state.y - th / 2
  }

  // Smooth clamping within chart canvas bounds with 8px margin
  left = Math.max(8, Math.min(left, canvasWidth - tw - 8))
  top = Math.max(8, Math.min(top, canvasHeight - th - 8))

  return (
    <div
      ref={tooltipRef}
      data-slot="canvas-tooltip-overlay"
      aria-hidden={!state.isOpen}
      className={cn(
        'pointer-events-none absolute left-0 top-0 z-30 will-change-transform',
        state.isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      )}
      style={{
        transform: `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`,
        transitionProperty: enableMotionTransition ? 'transform, opacity, scale' : 'opacity, scale',
        transitionDuration: enableMotionTransition ? '120ms, 160ms, 160ms' : '160ms, 160ms',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1), cubic-bezier(0.16, 1, 0.3, 1), cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {renderedContent}
    </div>
  )
}

/* ==========================================================================
   Chart Canvas Container Sub-Atom
   ========================================================================== */

export interface ChartCanvasProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Optional DOM ref attached to the canvas viewport container. */
  ref?: React.Ref<HTMLDivElement>
  /** Chart height in pixels or string CSS unit. */
  height?: number | string
  /** Aspect ratio multiplier (width / height). */
  aspectRatio?: number
  /** Whether the chart is currently in loading state. */
  isLoading?: boolean
  /** Whether the chart dataset is empty. */
  isEmpty?: boolean
  /** Custom fallback message displayed during empty state. */
  emptyMessage?: string
  /** Whether tooltips stay visible and smooth during inter-item canvas motion (default: true). */
  persistTooltip?: boolean
  /** Canvas child content or render prop receiving chart context. */
  children?: React.ReactNode | ((context: any) => React.ReactNode)
}

const ChartCanvasPrimitive = ({
  className,
  ref: propRef,
  height: propHeight,
  aspectRatio: propAspectRatio,
  isLoading: propIsLoading,
  isEmpty: propIsEmpty,
  emptyMessage = 'No data available to display.',
  persistTooltip = true,
  children,
  style,
  onPointerEnter,
  onPointerMove,
  onPointerLeave,
  ...props
}: ChartCanvasProps) => {
  const ctx = useChartContext()
  const contextStore = React.useContext(ChartTooltipStoreContext)
  const activeStore = ctx.tooltipStore || contextStore || defaultChartTooltipStore

  const internalRef = React.useRef<HTMLDivElement>(null)

  const height = propHeight ?? ctx.height ?? 360
  const isLoading = propIsLoading ?? ctx.isLoading ?? false
  const isEmpty = propIsEmpty ?? (ctx.data && Array.isArray(ctx.data) && ctx.data.length === 0)

  const visualizer = ctx.renderChart ? ctx.renderChart() : ctx.chartNode
  const nonTooltipChildren = (typeof children === 'function' ? [] : React.Children.toArray(children)).filter((child) => {
    if (!React.isValidElement(child)) return true
    const isTooltip =
      child.type === ChartTooltip ||
      (child.type as any)?.displayName === 'ChartTooltip' ||
      (child.type as any)?.name === 'ChartTooltip' ||
      (child.props as any)?.['data-slot'] === 'chart-tooltip'
    return !isTooltip
  })

  const resolvedContent = typeof children === 'function'
    ? children(ctx)
    : nonTooltipChildren.length > 0
      ? nonTooltipChildren
      : visualizer
  const resolvedHeight = typeof height === 'number' ? `${height}px` : height

  React.useEffect(() => {
    if (internalRef.current) {
      activeStore.setCanvasRef(internalRef.current)
    }
    activeStore.setOptions({ persistInCanvas: persistTooltip })
  }, [activeStore, persistTooltip])

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    activeStore.onCanvasPointerEnter?.(e)
    onPointerEnter?.(e)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    activeStore.onCanvasPointerMove?.(e)
    onPointerMove?.(e)
  }

  const handlePointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    activeStore.onCanvasPointerLeave?.(e)
    onPointerLeave?.(e)
  }

  const setRefs = (node: HTMLDivElement | null) => {
    (internalRef as any).current = node
    if (typeof propRef === 'function') {
      propRef(node)
    } else if (propRef && 'current' in propRef) {
      ;(propRef as any).current = node
    }
    if (node) {
      activeStore.setCanvasRef(node)
    }
  }

  return (
    <div
      ref={setRefs}
      data-slot="chart-canvas"
      className={cn('w-full relative select-none', className)}
      style={{
        width: '100%',
        height: resolvedHeight,
        minHeight: resolvedHeight,
        position: 'relative',
        ...style,
      }}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...props}
    >
      {isLoading ? (
        <ChartLoadingState />
      ) : isEmpty ? (
        <ChartEmptyState message={emptyMessage} />
      ) : (
        <>
          {resolvedContent}
          <CanvasTooltipOverlay store={activeStore} />
        </>
      )}
    </div>
  )
}

export const ChartCanvas = createInterfaceComponent<ChartCanvasProps>(
  {
    name: 'ChartCanvas',
    category: 'data',
    description: 'Responsive canvas viewport managing chart dimensions, loading pulses, and empty state fallbacks.',
    version: '1.0.0',
  },
  ChartCanvasPrimitive
)

/* ==========================================================================
   Chart Empty & Loading State Sub-Atoms
   ========================================================================== */

export interface ChartEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Custom message configuration. */
  message?: string
}

const ChartEmptyStatePrimitive = ({
  className,
  message = 'No data available to display.',
  ...props
}: ChartEmptyStateProps) => {
  return (
    <div
      data-slot="chart-empty-state"
      className={cn(
        'w-full h-full min-h-[220px] flex flex-col items-center justify-center p-6 text-center text-muted-fg border border-dashed border-border/60 rounded-base bg-secondary/10',
        className
      )}
      {...props}
    >
      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center mb-2 text-muted-fg">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <p className="text-xs font-medium">{message}</p>
    </div>
  )
}

export const ChartEmptyState = createInterfaceComponent<ChartEmptyStateProps>(
  {
    name: 'ChartEmptyState',
    category: 'data',
    description: 'Graceful empty state for empty chart datasets.',
    version: '1.0.0',
  },
  ChartEmptyStatePrimitive
)

export interface ChartLoadingStateProps extends React.HTMLAttributes<HTMLDivElement> { }

const ChartLoadingStatePrimitive = ({
  className,
  ...props
}: ChartLoadingStateProps) => {
  return (
    <div
      data-slot="chart-loading-state"
      className={cn(
        'w-full h-full min-h-[220px] flex flex-col items-center justify-center gap-3 p-6 animate-pulse bg-secondary/20 rounded-base border border-border/40',
        className
      )}
      {...props}
    >
      <div className="w-full h-32 bg-secondary/40 rounded-base" />
      <div className="flex items-center justify-between w-full">
        <div className="w-24 h-4 bg-secondary/60 rounded-micro" />
        <div className="w-32 h-4 bg-secondary/60 rounded-micro" />
      </div>
    </div>
  )
}

export const ChartLoadingState = createInterfaceComponent<ChartLoadingStateProps>(
  {
    name: 'ChartLoadingState',
    category: 'data',
    description: 'Optical skeleton pulse shimmer state for loading visualizers.',
    version: '1.0.0',
  },
  ChartLoadingStatePrimitive
)

/* ==========================================================================
   Chart Footer Sub-Atom
   ========================================================================== */

export interface ChartFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Primary summary text displayed in the container footer. */
  summary?: string
  /** Secondary footnote or explanatory text displayed in the footer. */
  footnote?: string
}

const ChartFooterPrimitive = ({
  className,
  summary,
  footnote,
  children,
  ...props
}: ChartFooterProps) => {
  if (children != null) {
    return (
      <div
        data-slot="chart-footer"
        className={cn(
          'mt-auto pt-space-sm border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-2xs text-muted-fg',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  return (
    <div
      data-slot="chart-footer"
      className={cn(
        'mt-auto pt-space-sm border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-2xs text-muted-fg',
        className
      )}
      {...props}
    >
      {summary && <span className="font-medium text-fg">{summary}</span>}
      {footnote && <span className="text-muted-fg">{footnote}</span>}
    </div>
  )
}

export const ChartFooter = createInterfaceComponent<ChartFooterProps>(
  {
    name: 'ChartFooter',
    category: 'data',
    description: 'Bottom summary and footnote container for charts.',
    version: '1.0.0',
  },
  ChartFooterPrimitive
)

export const { Context: ChartContainerContext, useCompoundContext: useChartContainerContext } =
  createCompoundContext<any>('ChartContainer')

// Namespace attachments for compound family ergonomics
ChartContainer.Header = ChartHeader
ChartContainer.Toolbar = ChartToolbar
ChartContainer.Legend = ChartLegend
ChartContainer.Canvas = ChartCanvas
ChartContainer.Tooltip = ChartTooltip
ChartContainer.Overlay = CanvasTooltipOverlay
ChartContainer.Bridge = ChartTooltipBridge
ChartContainer.Empty = ChartEmptyState
ChartContainer.Loading = ChartLoadingState
ChartContainer.Footer = ChartFooter
ChartContainer.ChartToolbar = ChartToolbar

ChartTooltip.Bridge = ChartTooltipBridge
ChartCanvas.Overlay = CanvasTooltipOverlay


