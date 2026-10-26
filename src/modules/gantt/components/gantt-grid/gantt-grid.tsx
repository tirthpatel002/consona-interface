/**
 * @file gantt-grid.tsx
 * Background column grid for the scrollable timeline pane.
 */

import React from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { useOptionalGantt } from '../../hooks'

export interface GanttGridSlots {}

export interface GanttGridProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Custom CSS classes. */
  className?: string
}

const GanttGridPrimitive = ({ className, ...props }: GanttGridProps) => {
  const gantt = useOptionalGantt()
  const columns = gantt?.helpers.columns ?? []
  const cellWidth = gantt?.state.cellWidth ?? 100
  const colWindow = gantt?.helpers.columnWindow ?? {
    startIndex: 0,
    endIndex: columns.length,
    offsetPx: 0,
  }
  const visibleColumns = gantt?.helpers.visibleColumns ?? columns

  return (
    <div
      data-slot="gantt-grid"
      className={cn('pointer-events-none absolute inset-0 flex', className)}
      aria-hidden
      {...props}
    >
      {colWindow.offsetPx > 0 ? (
        <div
          data-slot="gantt-grid-virtual-spacer"
          className="h-full shrink-0"
          style={{ width: colWindow.offsetPx }}
        />
      ) : null}
      {visibleColumns.map((col, i) => {
        const index = colWindow.startIndex + i
        return (
          <div
            key={`${col.start.getTime()}-${index}`}
            data-slot="gantt-grid-cell"
            className={cn(
              'h-full shrink-0 border-r border-border/40',
              col.isToday && 'bg-danger/5'
            )}
            style={{ width: cellWidth }}
          />
        )
      })}
    </div>
  )
}

export const GanttGrid = createInterfaceComponent<GanttGridProps, GanttGridSlots>(
  {
    name: 'GanttGrid',
    category: 'data',
    description: 'Non-interactive virtualized background column grid aligning with the Gantt header cells.',
    version: '1.1.0',
    props: {},
    slots: {},
  },
  GanttGridPrimitive
)
