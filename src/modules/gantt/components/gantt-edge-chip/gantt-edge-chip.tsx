/**
 * @file gantt-edge-chip.tsx
 * Viewport overflow edge chip — pinned to visible left/right when a bar is clipped.
 */

import React, { useCallback } from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { useOptionalGantt } from '../../hooks'

export interface GanttEdgeChipSlots {}

export interface GanttEdgeChipProps extends Omit<React.ComponentPropsWithoutRef<'button'>, 'children'> {
  /** Domain item this chip represents. */
  item: unknown
  /** Which overflow edge. */
  edge: 'start' | 'end'
  /** Optional override label (defaults to accessors getLabel). */
  label?: string
  /** Custom CSS classes. */
  className?: string
}

const GanttEdgeChipPrimitive = ({
  item,
  edge,
  label: labelProp,
  className,
  ...props
}: GanttEdgeChipProps) => {
  const gantt = useOptionalGantt()

  const onActivate = useCallback(() => {
    if (!gantt) return
    const layout = gantt.helpers.getLiveBarLayout(item)
    const center = layout.left + layout.width / 2
    // If the entire bar is off-screen on this side, scroll to center; else to the clipped edge.
    const target =
      edge === 'start'
        ? layout.left + layout.width < gantt.helpers.visibleLeft
          ? center
          : layout.left
        : layout.left > gantt.helpers.visibleRight
          ? center
          : layout.left + layout.width
    gantt.actions.scrollToPx(target)
  }, [gantt, item, edge])

  if (!gantt) return null

  const layout = gantt.helpers.getLiveBarLayout(item)
  const { visibleLeft, visibleRight } = gantt.helpers
  const show =
    edge === 'start'
      ? visibleLeft > layout.left && gantt.state.viewportWidth > 0
      : visibleRight < layout.left + layout.width && gantt.state.viewportWidth > 0

  if (!show) return null

  const label = labelProp ?? gantt.helpers.getLabel(item)
  const truncated = label.length > 12 ? `${label.slice(0, 12)}…` : label
  const dateMs = edge === 'start' ? layout.startMs : layout.endMs
  const dateLabel = gantt.helpers.formatDateTime(dateMs)

  const left =
    edge === 'start'
      ? visibleLeft + 8
      : Math.max(visibleLeft + 8, visibleRight - 132)

  return (
    <button
      type="button"
      data-slot="gantt-edge-chip"
      data-edge={edge}
      className={cn(
        'absolute top-1/2 z-[15] flex -translate-y-1/2 items-center gap-space-xs',
        'rounded-micro border border-border bg-bg px-space-sm py-space-xs',
        'text-[11px] font-medium text-muted-fg shadow-xs',
        'hover:border-primary/40 hover:text-fg',
        'transition-colors',
        className
      )}
      style={{ left, maxWidth: 160 }}
      title={`${label} · ${dateLabel}`}
      onClick={(e) => {
        e.stopPropagation()
        onActivate?.()
      }}
      {...props}
    >
      {edge === 'start' && (
        <span aria-hidden className="text-muted-fg">
          ‹
        </span>
      )}
      <span className="truncate">{truncated}</span>
      {edge === 'end' && (
        <span aria-hidden className="text-muted-fg">
          ›
        </span>
      )}
    </button>
  )
}

export const GanttEdgeChip = createInterfaceComponent<GanttEdgeChipProps, GanttEdgeChipSlots>(
  {
    name: 'GanttEdgeChip',
    category: 'data',
    description:
      'Pinned overflow chip at the visible viewport edge when a Gantt bar start/end is scrolled out of view. Prefer enabling via Gantt showEdgeChips; defaults off while the expanded title rail is visible, on when collapsed or rail off.',
    version: '1.0.0',
    props: {},
    slots: {},
  },
  GanttEdgeChipPrimitive
)
