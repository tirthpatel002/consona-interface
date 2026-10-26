/**
 * @file gantt-bar.tsx
 * Interactive Gantt bar with move / resize, hover datetime labels, and dependency dots.
 * Edge-autoscroll (Elixir Timeline edgeThreshold) while moving/resizing or linking.
 * Dependency-dot drag: begin on pointerdown, track globally, rubber-band via
 * engine.dependencyLink (scrollLeft-aware), commit on pointerup over another record.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import {
  autoScrollNearEdges,
  clientToTimelinePoint,
  isNearScrollerEdge,
  softBarFill,
  softBarInk,
  toMs,
  type GanttDependencySide,
  type GanttDragType,
} from '../../engine'
import { useGanttItemLayout, useOptionalGantt, type UseGanttReturn } from '../../hooks'

export interface GanttBarLabelSlotProps {
  /** Item id. */
  id: string
  /** Resolved label. */
  label: string
  /** Source item. */
  item: unknown
}

export interface GanttBarDatetimeSlotProps {
  /** Item id. */
  id: string
  /** Formatted datetime string. */
  text: string
  /** Raw ms. */
  ms: number
  /** Which edge. */
  edge: 'start' | 'end'
  /** Source item. */
  item: unknown
}

export interface GanttBarDepDotSlotProps {
  /** Item id. */
  id: string
  /** Which connection side. */
  side: 'start' | 'end'
  /** Accessible label. */
  'aria-label': string
  /** Pointer-down handler that begins a dependency drag. */
  onPointerDown: (e: React.PointerEvent) => void
  /** Source item. */
  item: unknown
}

export interface GanttBarSlots {
  /** Inner label content of the bar. */
  label?: React.ComponentType<GanttBarLabelSlotProps>
  /** Hover/drag datetime chip above the bar start. */
  datetimeStart?: React.ComponentType<GanttBarDatetimeSlotProps>
  /** Hover/drag datetime chip above the bar end. */
  datetimeEnd?: React.ComponentType<GanttBarDatetimeSlotProps>
  /** Dependency connection dot on the start edge. */
  depDotStart?: React.ComponentType<GanttBarDepDotSlotProps>
  /** Dependency connection dot on the end edge. */
  depDotEnd?: React.ComponentType<GanttBarDepDotSlotProps>
}

export interface GanttBarProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'children'> {
  /** Domain item this bar represents. */
  item: unknown
  /** Force a specific drag handle hit area in px. Default: 8. */
  resizeHandleWidth?: number
  /** Disable move/resize for this bar. */
  disabled?: boolean
  /** Show start/end datetime labels on hover or while dragging. Default: true. */
  showDateTimeLabels?: boolean
  /** Custom CSS classes. */
  className?: string
  /** Explicit children replace the default label. */
  children?: React.ReactNode
  /** Slot overrides. */
  slots?: SlotComponents<GanttBarSlots>
  /** Slot props. */
  slotProps?: SlotPropsMap<GanttBarSlots>
}

const DefaultBarLabel = ({ label }: GanttBarLabelSlotProps) => (
  <span className="w-full truncate px-space-sm text-center text-xs font-medium text-inherit">
    {label}
  </span>
)

const DefaultDatetimeChip = ({ text, edge }: GanttBarDatetimeSlotProps) => (
  <span
    data-slot={edge === 'start' ? 'gantt-bar-datetime-start' : 'gantt-bar-datetime-end'}
    className={cn(
      'pointer-events-none absolute bottom-[calc(100%+4px)] z-[25] whitespace-nowrap rounded-micro border border-border/60 bg-bg px-space-xs py-px text-[10px] tabular-nums text-muted-fg shadow-xs',
      edge === 'start' ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'
    )}
  >
    {text}
  </span>
)

const DefaultDepDot = ({ side, onPointerDown, 'aria-label': ariaLabel }: GanttBarDepDotSlotProps) => (
  <button
    type="button"
    data-slot="gantt-dep-dot"
    data-side={side}
    aria-label={ariaLabel}
    className={cn(
      'absolute top-1/2 z-40 flex h-6 w-6 -translate-y-1/2 cursor-grab items-center justify-center active:cursor-grabbing',
      side === 'start' ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'
    )}
    onPointerDown={onPointerDown}
    onMouseDown={(e) => {
      e.stopPropagation()
    }}
  >
    <span className="pointer-events-none h-2.5 w-2.5 rounded-full bg-fg" />
  </button>
)

/** Edge-autoscroll the gantt scroller; sync viewport; return current scrollLeft. */
function syncEdgeAutoScroll(
  gantt: UseGanttReturn,
  clientX: number,
  clientY: number
): number {
  const scroller = gantt.helpers.context.scrollerRef.current
  if (!scroller) return gantt.helpers.context.engine.getState().scrollLeft
  const { scrolledX, scrolledY } = autoScrollNearEdges(scroller, clientX, clientY)
  if (scrolledX !== 0 || scrolledY !== 0) {
    const rail = gantt.helpers.context.railWidthPx
    gantt.actions.setViewport(
      scroller.scrollLeft,
      Math.max(0, scroller.clientWidth - rail)
    )
  }
  return scroller.scrollLeft
}

const GanttBarPrimitive = ({
  item,
  resizeHandleWidth = 8,
  disabled = false,
  showDateTimeLabels = true,
  className,
  style,
  children,
  slots,
  slotProps,
  ...props
}: GanttBarProps) => {
  const gantt = useOptionalGantt()
  const layout = useGanttItemLayout(item)
  const barRef = useRef<HTMLDivElement>(null)
  const [hoverEdge, setHoverEdge] = useState<'start' | 'end' | 'body' | null>(null)
  // Sync flag so dots stay mounted for the gesture without waiting for engine→React.
  const [linkingSide, setLinkingSide] = useState<GanttDependencySide | null>(null)
  // Tear down document listeners attached synchronously in startDot (Elixir-style).
  const linkCleanupRef = useRef<(() => void) | null>(null)

  const id = gantt ? gantt.helpers.getId(item) : ''
  const isDragging = Boolean(gantt && gantt.state.drag?.itemId === id)
  const isHovered = Boolean(gantt && gantt.state.hoveredId === id)
  const engineLink = gantt?.state.dependencyLink
  const isLinkSource = Boolean(
    linkingSide != null || (engineLink && engineLink.sourceId === id)
  )
  // Keep dots visible while hovered OR while this bar owns the link drag.
  // Do not hide on mousedown — only hide while this bar is being moved/resized.
  const showDots =
    Boolean(gantt?.helpers.canEditDependencies) &&
    (isHovered || isLinkSource) &&
    !isDragging

  const resolveDragType = useCallback(
    (clientX: number, target: HTMLElement): GanttDragType => {
      const rect = target.getBoundingClientRect()
      const x = clientX - rect.left
      if (x < resizeHandleWidth) return 'resize-start'
      if (x > rect.width - resizeHandleWidth) return 'resize-end'
      return 'move'
    },
    [resizeHandleWidth]
  )

  const toTimelinePoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!gantt) return { x: 0, y: 0 }
      const timelineEl = barRef.current?.closest('[data-slot="gantt-timeline"]') as HTMLElement | null
      const scroller = gantt.helpers.context.scrollerRef.current
      // X: Fluenciq scroll-container formula (rail + scrollLeft).
      // Y: content Y relative to timeline/SVG origin = scroller Y minus sticky header height.
      // Using timeline.getBoundingClientRect alone can sit ~1 row low once the sticky
      // header overlaps the scrolled body (rubber-band tip looked a row below the cursor).
      let x = 0
      let y = 0
      if (scroller) {
        const pt = clientToTimelinePoint(
          clientX,
          clientY,
          scroller,
          gantt.helpers.context.railWidthPx
        )
        x = pt.x
        const headerEl = scroller.querySelector('[data-slot="gantt-header"]') as HTMLElement | null
        const headerH = headerEl?.offsetHeight ?? 0
        y = pt.y - headerH
      } else if (timelineEl) {
        const rect = timelineEl.getBoundingClientRect()
        x = clientX - rect.left
        y = clientY - rect.top
      }
      return { x, y }
    },
    [gantt]
  )

  useEffect(() => {
    if (!gantt || !isDragging) return

    let lastX = 0
    let lastY = 0
    let hasPointer = false
    let rafId = 0

    const stopLoop = () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = 0
      }
    }

    const applyDragFrame = () => {
      if (!hasPointer) return
      const scrollLeft = syncEdgeAutoScroll(gantt, lastX, lastY)
      gantt.actions.updateDrag(lastX, scrollLeft)
    }

    const loop = () => {
      rafId = 0
      const scroller = gantt.helpers.context.scrollerRef.current
      if (!scroller || !hasPointer) return
      if (!isNearScrollerEdge(scroller, lastX, lastY)) return
      const beforeLeft = scroller.scrollLeft
      const beforeTop = scroller.scrollTop
      applyDragFrame()
      // Keep ticking only while scroll still moves (avoid spinning at bounds).
      if (scroller.scrollLeft !== beforeLeft || scroller.scrollTop !== beforeTop) {
        rafId = requestAnimationFrame(loop)
      }
    }

    const onMove = (e: PointerEvent) => {
      lastX = e.clientX
      lastY = e.clientY
      hasPointer = true
      applyDragFrame()
      const scroller = gantt.helpers.context.scrollerRef.current
      if (!rafId && scroller && isNearScrollerEdge(scroller, lastX, lastY)) {
        rafId = requestAnimationFrame(loop)
      }
    }
    const onUp = () => {
      stopLoop()
      gantt.actions.endDrag(item)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopLoop()
        gantt.actions.cancelDrag()
      }
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    document.addEventListener('keydown', onKey)
    return () => {
      stopLoop()
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('keydown', onKey)
    }
  }, [isDragging, gantt, item])

  // Clear sync link flag if engine cancels externally.
  useEffect(() => {
    if (!engineLink && linkingSide != null) {
      setLinkingSide(null)
    }
  }, [engineLink, linkingSide])

  useEffect(() => {
    return () => {
      linkCleanupRef.current?.()
      linkCleanupRef.current = null
    }
  }, [])

  if (!gantt || !layout) return null

  const label = gantt.helpers.getLabel(item)
  const color = gantt.helpers.getColor(item)
  const readOnly = gantt.helpers.context.readOnly || disabled
  const isSelected = gantt.state.selectedId === id
  const showLabels = showDateTimeLabels && (isDragging || isHovered || hoverEdge != null)

  const commitDependencyDrop = (clientX: number, clientY: number) => {
    const engine = gantt.helpers.context.engine
    const link = engine.getState().dependencyLink
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null
    const target = el?.closest?.('[data-gantt-item-id]') as HTMLElement | null
    const targetId = target?.getAttribute('data-gantt-item-id')
    if (link && targetId && targetId !== link.sourceId) {
      // side 'end' (right) → source is predecessor; side 'start' (left) → target is predecessor
      const fromId = link.side === 'end' ? link.sourceId : targetId
      const toId = link.side === 'end' ? targetId : link.sourceId
      const toItem = gantt.helpers.context.items.find((it) => gantt.helpers.getId(it) === toId)
      const existing = toItem ? gantt.helpers.getDependencies(toItem) : []
      const action = existing.includes(fromId) ? 'remove' : 'add'
      gantt.actions.emitDependencyChange({ fromId, toId, action })
    }
    gantt.actions.endDependencyLink()
    setLinkingSide(null)
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (readOnly || e.button !== 0) return
    // Don't start bar drag when grabbing a dependency dot / mid link session
    if (linkingSide != null) return
    if ((e.target as HTMLElement).closest('[data-slot="gantt-dep-dot"]')) return
    e.preventDefault()
    e.stopPropagation()
    const type = resolveDragType(e.clientX, e.currentTarget)
    const startMs = toMs(gantt.helpers.context.accessors.getStart(item as never))
    const endMs = toMs(gantt.helpers.context.accessors.getEnd(item as never))
    // Align engine scrollLeft with the live scroller before snapshotting startScrollLeft.
    const scroller = gantt.helpers.context.scrollerRef.current
    if (scroller) {
      const rail = gantt.helpers.context.railWidthPx
      gantt.actions.setViewport(
        scroller.scrollLeft,
        Math.max(0, scroller.clientWidth - rail)
      )
    }
    gantt.actions.beginDrag({
      itemId: id,
      type,
      clientX: e.clientX,
      left: layout.left,
      width: layout.width,
      startMs,
      endMs,
    })
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  /**
   * Fluenciq handleDragStart: stopPropagation so RecordBar move/resize cannot steal,
   * setDraggingDot immediately, then track mousePosition on document every move.
   */
  const startDot = (side: GanttDependencySide) => (e: React.PointerEvent) => {
    // CRITICAL: stop bar move/resize from the same pointerdown (Elixir stopPropagation).
    e.preventDefault()
    e.stopPropagation()
    if (readOnly || e.button !== 0 || !gantt) return

    linkCleanupRef.current?.()
    linkCleanupRef.current = null

    const anchorX = side === 'start' ? layout.left : layout.left + layout.width
    const { x: pointerX, y: pointerY } = toTimelinePoint(e.clientX, e.clientY)

    // Sync local flag BEFORE engine→React round-trip so dots stay mounted.
    setLinkingSide(side)
    gantt.actions.beginDependencyLink({
      sourceId: id,
      side,
      x: anchorX,
      y: pointerY,
    })
    // Endpoint follows pointer immediately (rubber-band first frame).
    gantt.actions.updateDependencyLink(pointerX, pointerY)

    let finished = false
    let lastX = e.clientX
    let lastY = e.clientY
    let rafId = 0

    const stopLoop = () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = 0
      }
    }

    const applyLinkFrame = (clientX: number, clientY: number) => {
      syncEdgeAutoScroll(gantt, clientX, clientY)
      // Recompute after scroll so rubber-band tip stays under the pointer (scrollLeft-aware).
      const pt = toTimelinePoint(clientX, clientY)
      gantt.actions.updateDependencyLink(pt.x, pt.y)
    }

    const loop = () => {
      rafId = 0
      if (finished) return
      const scroller = gantt.helpers.context.scrollerRef.current
      if (!scroller || !isNearScrollerEdge(scroller, lastX, lastY)) return
      const beforeLeft = scroller.scrollLeft
      const beforeTop = scroller.scrollTop
      applyLinkFrame(lastX, lastY)
      if (scroller.scrollLeft !== beforeLeft || scroller.scrollTop !== beforeTop) {
        rafId = requestAnimationFrame(loop)
      }
    }

    const onMove = (ev: PointerEvent) => {
      if (finished) return
      lastX = ev.clientX
      lastY = ev.clientY
      applyLinkFrame(lastX, lastY)
      const scroller = gantt.helpers.context.scrollerRef.current
      if (!rafId && scroller && isNearScrollerEdge(scroller, lastX, lastY)) {
        rafId = requestAnimationFrame(loop)
      }
    }

    const onUp = (ev: PointerEvent) => {
      if (finished) return
      finished = true
      cleanup()
      commitDependencyDrop(ev.clientX, ev.clientY)
    }

    const onKey = (ev: KeyboardEvent) => {
      if (ev.key !== 'Escape' || finished) return
      finished = true
      cleanup()
      gantt.actions.cancelDependencyLink()
      setLinkingSide(null)
    }

    const cleanup = () => {
      stopLoop()
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('mousemove', onMove as EventListener)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('mouseup', onUp as EventListener)
      document.removeEventListener('keydown', onKey)
      linkCleanupRef.current = null
    }

    linkCleanupRef.current = cleanup
    // Attach NOW (not in useEffect) so the first moves after mousedown are never dropped.
    document.addEventListener('pointermove', onMove)
    document.addEventListener('mousemove', onMove as EventListener)
    document.addEventListener('pointerup', onUp)
    document.addEventListener('mouseup', onUp as EventListener)
    document.addEventListener('keydown', onKey)

    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  return (
    <div
      ref={barRef}
      data-slot="gantt-bar"
      data-gantt-item-id={id}
      role="gridcell"
      tabIndex={readOnly ? -1 : 0}
      aria-selected={isSelected}
      aria-grabbed={isDragging}
      aria-label={label}
      className={cn(
        'absolute top-1/2 flex h-7 -translate-y-1/2 cursor-grab items-center overflow-visible rounded-micro border border-border/50 bg-primary/25 text-fg shadow-xs',
        'active:cursor-grabbing',
        isDragging && 'z-20 opacity-90 shadow-sm',
        (isHovered || showDots) && !isDragging && 'z-[15]',
        isSelected && 'ring-2 ring-primary/40',
        readOnly && 'cursor-default',
        className
      )}
      style={{
        left: layout.left,
        width: layout.width,
        ...(color
          ? { backgroundColor: softBarFill(color), color: softBarInk(color) }
          : null),
        ...style,
      }}
      onPointerDown={onPointerDown}
      onMouseEnter={() => {
        gantt.actions.hover(id)
        setHoverEdge((prev) => prev ?? 'body')
      }}
      onMouseLeave={() => {
        // Prefer engine snapshot — React state can lag one frame behind beginDependencyLink.
        if (!gantt.helpers.context.engine.getState().dependencyLink && linkingSide == null) {
          gantt.actions.hover(null)
        }
        setHoverEdge(null)
      }}
      onFocus={() => gantt.actions.select(id)}
      {...props}
    >
      {!readOnly && (
        <>
          <span
            data-slot="gantt-bar-resize-start"
            className="absolute inset-y-0 left-0 z-[1] w-2 cursor-col-resize"
            aria-hidden
            onMouseEnter={() => setHoverEdge('start')}
            onMouseLeave={() => setHoverEdge((e) => (e === 'start' ? 'body' : e))}
          />
          <span
            data-slot="gantt-bar-resize-end"
            className="absolute inset-y-0 right-0 z-[1] w-2 cursor-col-resize"
            aria-hidden
            onMouseEnter={() => setHoverEdge('end')}
            onMouseLeave={() => setHoverEdge((e) => (e === 'end' ? 'body' : e))}
          />
        </>
      )}

      {/* Hover / drag datetime labels — above the bar so they never cover side dep dots */}
      {showLabels && (
        <>
          {renderSlot(
            slots?.datetimeStart,
            {
              id,
              text: gantt.helpers.formatDateTime(layout.startMs),
              ms: layout.startMs,
              edge: 'start' as const,
              item,
              ...(slotProps?.datetimeStart as object),
            },
            { defaultComponent: DefaultDatetimeChip }
          )}
          {renderSlot(
            slots?.datetimeEnd,
            {
              id,
              text: gantt.helpers.formatDateTime(layout.endMs),
              ms: layout.endMs,
              edge: 'end' as const,
              item,
              ...(slotProps?.datetimeEnd as object),
            },
            { defaultComponent: DefaultDatetimeChip }
          )}
        </>
      )}

      {/* In-bar title: only when rail is off or collapsed (title lives in rail when expanded). */}
      {gantt.helpers.context.showBarTitle ? (
        <div className="relative z-0 flex min-w-0 flex-1 items-center justify-center overflow-hidden">
          {children != null
            ? children
            : renderSlot(
                slots?.label,
                { id, label, item, ...(slotProps?.label as object) },
                { defaultComponent: DefaultBarLabel }
              )}
        </div>
      ) : null}

      {/* Dependency connection dots — outside bar edges; stopPropagation so bar drag cannot steal */}
      {showDots && (
        <>
          {renderSlot(
            slots?.depDotStart,
            {
              id,
              side: 'start' as const,
              'aria-label': `Connect dependency start for ${label}`,
              onPointerDown: startDot('start'),
              item,
              ...(slotProps?.depDotStart as object),
            },
            { defaultComponent: DefaultDepDot }
          )}
          {renderSlot(
            slots?.depDotEnd,
            {
              id,
              side: 'end' as const,
              'aria-label': `Connect dependency end for ${label}`,
              onPointerDown: startDot('end'),
              item,
              ...(slotProps?.depDotEnd as object),
            },
            { defaultComponent: DefaultDepDot }
          )}
        </>
      )}
    </div>
  )
}

export const GanttBar = createInterfaceComponent<GanttBarProps, GanttBarSlots>(
  {
    name: 'GanttBar',
    category: 'data',
    description:
      'Interactive Gantt bar supporting snap move/resize with edge autoscroll, hover datetime labels, and dependency connection dots.',
    version: '1.5.0',
    props: {
      resizeHandleWidth: 8,
      disabled: false,
      showDateTimeLabels: true,
    },
    slots: {
      label: undefined,
      datetimeStart: undefined,
      datetimeEnd: undefined,
      depDotStart: undefined,
      depDotEnd: undefined,
    },
  },
  GanttBarPrimitive
)
