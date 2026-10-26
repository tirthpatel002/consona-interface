/**
 * @file gantt-row.tsx
 * One Gantt row: optional sticky label cell + timeline track with bar + overflow edge chips.
 */

import React from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { useOptionalGantt } from '../../hooks'
import { GanttBar, type GanttBarProps } from '../gantt-bar'
import { GanttEdgeChip } from '../gantt-edge-chip'

export interface GanttRowSlots {
  /** Bar occupant for this row. */
  bar?: React.ComponentType<GanttBarProps>
  /** Overflow chip when the bar start is clipped (timeline chips mode). */
  startChip?: React.ComponentType<React.ComponentProps<typeof GanttEdgeChip>>
  /** Overflow chip when the bar end is clipped (timeline chips mode). */
  endChip?: React.ComponentType<React.ComponentProps<typeof GanttEdgeChip>>
}

export interface GanttRowProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'children'> {
  /** Domain item for this row. */
  item: unknown
  /** Row index (optional, for zebra / a11y). */
  index?: number
  /** Show an inline label cell (when not using a separate Gantt.Rail). */
  showLabel?: boolean
  /** Label cell width when showLabel is true. */
  labelWidth?: string | number
  /**
   * Show overflow edge chips when the bar is clipped by the viewport.
   * Default: from Gantt context (off when title rail is visible; on when rail={false} / showRail={false}).
   */
  showEdgeChips?: boolean
  /** Custom CSS classes. */
  className?: string
  /** Explicit children replace the default bar. */
  children?: React.ReactNode
  /** Slot overrides. */
  slots?: SlotComponents<GanttRowSlots>
  /** Slot props. */
  slotProps?: SlotPropsMap<GanttRowSlots>
}

const GanttRowPrimitive = ({
  item,
  index = 0,
  showLabel = false,
  labelWidth = '12rem',
  showEdgeChips: showEdgeChipsProp,
  className,
  children,
  slots,
  slotProps,
  ...props
}: GanttRowProps) => {
  const gantt = useOptionalGantt()
  const id = gantt ? gantt.helpers.getId(item) : String(index)
  const label = gantt ? gantt.helpers.getLabel(item) : id
  const timelineWidthPx = gantt?.helpers.timelineWidthPx ?? 0
  const isFocused = gantt?.state.selectedId === id || gantt?.state.hoveredId === id
  // Prefer explicit prop; else provider policy (chips off when rail/title column enabled).
  const showEdgeChips =
    showEdgeChipsProp !== undefined
      ? showEdgeChipsProp
      : (gantt?.helpers.context.showEdgeChips ?? false)

  return (
    <div
      data-slot="gantt-row"
      data-gantt-item-id={id}
      role="row"
      aria-rowindex={index + 1}
      className={cn(
        'relative flex h-10 overflow-visible border-b border-border/50',
        isFocused && 'bg-primary/5',
        className
      )}
      {...props}
    >
      {showLabel && (
        <div
          data-slot="gantt-row-label"
          className="sticky left-0 z-20 flex shrink-0 items-center border-r border-border bg-bg px-space-md"
          style={{ width: labelWidth }}
        >
          <span className="truncate text-sm font-medium text-fg">{label}</span>
        </div>
      )}
      <div
        data-slot="gantt-row-track"
        className="relative h-full overflow-visible"
        style={{ width: timelineWidthPx, minWidth: timelineWidthPx }}
      >
        {children != null
          ? children
          : renderSlot(
              slots?.bar,
              { item, ...(slotProps?.bar as object) },
              { defaultComponent: GanttBar }
            )}
        {showEdgeChips && (
          <>
            {renderSlot(
              slots?.startChip,
              { item, edge: 'start', ...(slotProps?.startChip as object) },
              { defaultComponent: GanttEdgeChip }
            )}
            {renderSlot(
              slots?.endChip,
              { item, edge: 'end', ...(slotProps?.endChip as object) },
              { defaultComponent: GanttEdgeChip }
            )}
          </>
        )}
      </div>
    </div>
  )
}

export const GanttRow = createInterfaceComponent<GanttRowProps, GanttRowSlots>(
  {
    name: 'GanttRow',
    category: 'data',
    description:
      'Single Gantt row hosting an optional sticky label, a timeline track with a bar, and optional overflow edge chips (gated off when the expanded title rail is visible — the rail shows its own overflow arrows; chips take over when the rail is collapsed or hidden).',
    version: '1.2.0',
    props: {
      showLabel: false,
      // showEdgeChips defaults from Gantt context (off with rail)
    },
    slots: {
      bar: undefined,
      startChip: undefined,
      endChip: undefined,
    },
  },
  GanttRowPrimitive
)
