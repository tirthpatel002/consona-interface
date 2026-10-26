/**
 * @file gantt-rail.tsx
 * Sticky left rail for row labels, with viewport overflow arrows per bar.
 */

import React from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { useOptionalGantt } from '../../hooks'

export interface GanttRailLabelSlotProps {
  /** Item id. */
  id: string
  /** Resolved label text. */
  label: string
  /** Source item. */
  item: unknown
  /** Row index. */
  index: number
}

export interface GanttRailOverflowSlotProps {
  /** Source item. */
  item: unknown
  /** Item id. */
  id: string
  /** Row index. */
  index: number
}

export interface GanttRailSlots {
  /** Per-row label occupant. */
  label?: React.ComponentType<GanttRailLabelSlotProps>
  /** Viewport overflow arrows (‹ / ›) for this row. */
  overflow?: React.ComponentType<GanttRailOverflowSlotProps>
}

export interface GanttRailProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Rail width. Default: 12rem. */
  width?: string | number
  /** Custom CSS classes. */
  className?: string
  /** Slot overrides. */
  slots?: SlotComponents<GanttRailSlots>
  /** Slot props. */
  slotProps?: SlotPropsMap<GanttRailSlots>
}

const DefaultRailLabel = ({ label }: GanttRailLabelSlotProps) => (
  <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{label}</span>
)

/** Left / right chevrons when the bar start/end (or whole bar) is outside the viewport. */
function DefaultRailOverflow({ item }: GanttRailOverflowSlotProps) {
  const gantt = useOptionalGantt()
  if (!gantt || gantt.state.viewportWidth <= 0) return null

  const layout = gantt.helpers.getLiveBarLayout(item)
  const { visibleLeft, visibleRight } = gantt.helpers
  const barStart = layout.left
  const barEnd = layout.left + layout.width

  // Same rule as Elixir: start left of viewport → left arrow; end right of viewport → right.
  const showLeft = visibleLeft > barStart
  const showRight = visibleRight < barEnd
  if (!showLeft && !showRight) return null

  const scrollToEdge = (edge: 'start' | 'end') => {
    const center = barStart + layout.width / 2
    const entireLeft = barEnd < visibleLeft
    const entireRight = barStart > visibleRight
    const target =
      edge === 'start'
        ? entireLeft
          ? center
          : barStart
        : entireRight
          ? center
          : barEnd
    gantt.actions.scrollToPx(target)
  }

  return (
    <span
      data-slot="gantt-rail-overflow"
      className="ml-auto flex shrink-0 items-center gap-0.5"
    >
      {showLeft && (
        <button
          type="button"
          data-edge="start"
          className={cn(
            'inline-flex h-6 w-6 items-center justify-center rounded-micro',
            'text-muted-fg hover:bg-secondary hover:text-fg',
            'transition-colors'
          )}
          title="Scroll to bar start"
          aria-label="Scroll to bar start"
          onClick={(e) => {
            e.stopPropagation()
            scrollToEdge('start')
          }}
        >
          <span aria-hidden className="text-sm leading-none">
            ‹
          </span>
        </button>
      )}
      {showRight && (
        <button
          type="button"
          data-edge="end"
          className={cn(
            'inline-flex h-6 w-6 items-center justify-center rounded-micro',
            'text-muted-fg hover:bg-secondary hover:text-fg',
            'transition-colors'
          )}
          title="Scroll to bar end"
          aria-label="Scroll to bar end"
          onClick={(e) => {
            e.stopPropagation()
            scrollToEdge('end')
          }}
        >
          <span aria-hidden className="text-sm leading-none">
            ›
          </span>
        </button>
      )}
    </span>
  )
}

const GanttRailPrimitive = ({
  width = '12rem',
  className,
  children,
  slots,
  slotProps,
  ...props
}: GanttRailProps) => {
  const gantt = useOptionalGantt()
  const items = gantt?.helpers.context.items ?? []
  const accessors = gantt?.helpers.context.accessors
  const collapsed = gantt?.helpers.context.railCollapsed ?? false

  return (
    <div
      data-slot="gantt-rail"
      data-collapsed={collapsed || undefined}
      className={cn(
        'sticky left-0 z-20 flex shrink-0 flex-col self-start overflow-hidden border-r border-border bg-bg',
        'transition-[width] duration-200 ease-out',
        className
      )}
      style={{ width }}
      {...props}
    >
      {children != null
        ? collapsed
          ? null
          : children
        : items.map((item, index) => {
            const id = accessors ? accessors.getId(item) : String(index)
            const label =
              accessors?.getLabel?.(item) ??
              (accessors ? accessors.getId(item) : String(index))
            return (
              <div
                key={id}
                data-slot="gantt-rail-row"
                className={cn(
                  'flex h-10 items-center gap-space-xs border-b border-border/50',
                  collapsed ? 'justify-center px-0' : 'px-space-md'
                )}
              >
                {/* Labels / overflow hide while collapsed — titles move onto bars. */}
                {!collapsed && (
                  <>
                    {renderSlot(
                      slots?.label,
                      { id, label, item, index, ...(slotProps?.label as object) },
                      { defaultComponent: DefaultRailLabel }
                    )}
                    {renderSlot(
                      slots?.overflow,
                      { item, id, index, ...(slotProps?.overflow as object) },
                      { defaultComponent: DefaultRailOverflow }
                    )}
                  </>
                )}
              </div>
            )
          })}
    </div>
  )
}

export const GanttRail = createInterfaceComponent<GanttRailProps, GanttRailSlots>(
  {
    name: 'GanttRail',
    category: 'data',
    description:
      'Sticky left rail listing Gantt row labels; shows left/right arrows when a bar start/end (or the whole bar) is outside the viewport.',
    version: '1.2.0',
    props: {},
    slots: {
      label: undefined,
      overflow: undefined,
    },
  },
  GanttRailPrimitive
)
