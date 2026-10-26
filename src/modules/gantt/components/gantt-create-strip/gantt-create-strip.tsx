/**
 * @file gantt-create-strip.tsx
 * Sticky bottom create strip with ghost preview; click emits onCreate({ start, end }).
 * Ghost tracks pointer X in timeline content space (scrollLeft-aware), like Fluenciq
 * FloatingBox / newRecordPreviewPosition.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { clientToTimelinePoint } from '../../engine'
import { useOptionalGantt } from '../../hooks'

export interface GanttCreateStripSlots {}

export interface GanttCreateStripProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'children'> {
  /** Custom CSS classes. */
  className?: string
}

const GanttCreateStripPrimitive = ({ className, ...props }: GanttCreateStripProps) => {
  const gantt = useOptionalGantt()
  const trackRef = useRef<HTMLDivElement>(null)
  const hoveringRef = useRef(false)
  const [ghost, setGhost] = useState<{ left: number; width: number; startMs: number; endMs: number } | null>(
    null
  )

  /**
   * Timeline content X under the pointer.
   * Fluenciq: `clientX - rect.left + scrollLeft` on the scroll container (not the sticky strip).
   * Sticky strip getBoundingClientRect().left can sit at the viewport edge while abspos
   * children still use content coordinates — that mismatch pinned the ghost at timeline start.
   */
  const pointerToTimelineX = useCallback(
    (clientX: number, clientY: number) => {
      if (!gantt) return 0
      const scroller = gantt.helpers.context.scrollerRef.current
      if (scroller) {
        return clientToTimelinePoint(
          clientX,
          clientY,
          scroller,
          gantt.helpers.context.railWidthPx
        ).x
      }
      // Fallback: non-sticky timeline element
      const timeline = trackRef.current?.closest('[data-slot="gantt-timeline"]') as HTMLElement | null
      if (timeline) {
        return clientX - timeline.getBoundingClientRect().left
      }
      return gantt.state.scrollLeft
    },
    [gantt]
  )

  const updateGhost = useCallback(
    (clientX: number, clientY: number) => {
      if (!gantt) return
      const x = pointerToTimelineX(clientX, clientY)
      const range = gantt.helpers.createRangeAt(x)
      setGhost({
        left: range.left,
        width: Math.max(range.width, 8),
        startMs: range.start.getTime(),
        endMs: range.end.getTime(),
      })
    },
    [gantt, pointerToTimelineX]
  )

  const clearGhost = useCallback(() => {
    hoveringRef.current = false
    setGhost(null)
  }, [])

  // Document-level mousemove while hovering — mirrors Fluenciq FloatingBox so the ghost
  // updates every move even if a child/overlay eats strip-local events.
  useEffect(() => {
    if (!gantt) return

    const onMove = (e: MouseEvent) => {
      if (!hoveringRef.current) return
      const el = trackRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const scroller = gantt.helpers.context.scrollerRef.current
      const sRect = scroller?.getBoundingClientRect()
      const rail = gantt.helpers.context.railWidthPx
      // Intersect strip box with the visible scroller (sticky + wide timeline can make
      // getBoundingClientRect span far off-screen).
      const left = sRect ? Math.max(rect.left, sRect.left + rail) : rect.left
      const right = sRect ? Math.min(rect.right, sRect.right) : rect.right
      const top = sRect ? Math.max(rect.top, sRect.top) : rect.top
      const bottom = sRect ? Math.min(rect.bottom, sRect.bottom) : rect.bottom
      if (e.clientX < left || e.clientX > right || e.clientY < top || e.clientY > bottom) {
        clearGhost()
        return
      }
      updateGhost(e.clientX, e.clientY)
    }

    document.addEventListener('mousemove', onMove)
    return () => document.removeEventListener('mousemove', onMove)
  }, [gantt, updateGhost, clearGhost])

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!gantt || e.button !== 0) return
      const x = pointerToTimelineX(e.clientX, e.clientY)
      const range = gantt.helpers.createRangeAt(x)
      gantt.actions.emitCreate({ start: range.start, end: range.end })
    },
    [gantt, pointerToTimelineX]
  )

  if (!gantt || !gantt.helpers.canCreate) return null

  const timelineWidthPx = gantt.helpers.timelineWidthPx

  return (
    <div
      ref={trackRef}
      data-slot="gantt-create-strip"
      role="button"
      tabIndex={0}
      aria-label="Create item on timeline"
      {...props}
      className={cn(
        // sticky bottom only — do NOT sticky left (that pinned rect.left to the viewport).
        // sticky is the abspos containing block for the ghost (avoid also setting relative).
        'sticky bottom-0 z-[12] h-9 cursor-copy overflow-visible border-t border-border bg-bg',
        className
      )}
      style={{
        width: timelineWidthPx,
        minWidth: timelineWidthPx,
        ...(typeof props.style === 'object' && props.style ? props.style : null),
      }}
      onMouseEnter={(e) => {
        hoveringRef.current = true
        updateGhost(e.clientX, e.clientY)
      }}
      onMouseMove={(e) => {
        hoveringRef.current = true
        updateGhost(e.clientX, e.clientY)
      }}
      onMouseLeave={clearGhost}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          const mid = (gantt.helpers.visibleLeft + gantt.helpers.visibleRight) / 2
          const range = gantt.helpers.createRangeAt(mid)
          gantt.actions.emitCreate({ start: range.start, end: range.end })
        }
      }}
    >
      {!ghost && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-medium text-muted-fg/70">
            Click to create · ghost follows cursor
          </span>
        </div>
      )}
      {ghost && (
        <>
          {/* Centered on cursor like Fluenciq FloatingBox (translate -50% on content X). */}
          <div
            data-slot="gantt-create-ghost"
            className="pointer-events-none absolute top-1/2 z-[1] h-5 -translate-y-1/2 rounded-micro border-0 bg-primary/20"
            style={{ left: ghost.left, width: ghost.width }}
          />
          <span
            className="pointer-events-none absolute top-1/2 z-[1] -translate-x-full -translate-y-1/2 whitespace-nowrap px-space-xs text-[10px] tabular-nums text-muted-fg"
            style={{ left: ghost.left - 4 }}
          >
            {gantt.helpers.formatDateTime(ghost.startMs)}
          </span>
          <span
            className="pointer-events-none absolute top-1/2 z-[1] -translate-y-1/2 whitespace-nowrap px-space-xs text-[10px] tabular-nums text-muted-fg"
            style={{ left: ghost.left + ghost.width + 4 }}
          >
            {gantt.helpers.formatDateTime(ghost.endMs)}
          </span>
        </>
      )}
    </div>
  )
}

export const GanttCreateStrip = createInterfaceComponent<
  GanttCreateStripProps,
  GanttCreateStripSlots
>(
  {
    name: 'GanttCreateStrip',
    category: 'data',
    description:
      'Sticky bottom create strip with ghost preview; click emits onCreate with a range derived from viewRange cell size.',
    version: '1.2.0',
    props: {},
    slots: {},
  },
  GanttCreateStripPrimitive
)
