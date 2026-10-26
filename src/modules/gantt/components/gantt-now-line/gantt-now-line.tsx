/**
 * @file gantt-now-line.tsx
 * Vertical "now" marker on the timeline.
 */

import React from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { useOptionalGantt } from '../../hooks'

export interface GanttNowLineSlots {}

export interface GanttNowLineProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Hide when outside the visible range. Default: true. */
  hideOutOfRange?: boolean
  /** Custom CSS classes. */
  className?: string
}

const GanttNowLinePrimitive = ({
  hideOutOfRange = true,
  className,
  style,
  ...props
}: GanttNowLineProps) => {
  const gantt = useOptionalGantt()
  if (!gantt) return null

  const { nowPx, timelineWidthPx } = gantt.helpers
  if (hideOutOfRange && (nowPx < 0 || nowPx > timelineWidthPx)) return null

  return (
    <div
      data-slot="gantt-now-line"
      role="presentation"
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-danger',
        'before:absolute before:-top-1 before:left-1/2 before:size-2 before:-translate-x-1/2 before:rounded-full before:bg-danger',
        className
      )}
      style={{ left: nowPx, ...style }}
      {...props}
    />
  )
}

export const GanttNowLine = createInterfaceComponent<GanttNowLineProps, GanttNowLineSlots>(
  {
    name: 'GanttNowLine',
    category: 'data',
    description: 'Vertical current-time marker positioned via the Gantt engine now timestamp.',
    version: '1.0.0',
    props: {
      hideOutOfRange: true,
    },
    slots: {},
  },
  GanttNowLinePrimitive
)
