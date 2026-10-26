/**
 * @file drag-overlay.tsx
 * DragOverlay Component Family rendering a floating portal preview of the actively dragged entity.
 * Features velocity tilt physics, dynamic coordinates tracking, and optical elevation shadows.
 */

import React, { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  DragOverlay as DndKitDragOverlay,
  defaultDropAnimationSideEffects,
  type DropAnimation,
} from '@dnd-kit/core'
import { createInterfaceComponent } from '../../../../core/component-factory'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { useOptionalDndContext } from '../../context'
import type { Coordinates, DragItem } from '../../engine/types'

export interface DragOverlaySlots { }

let activeOverlaySession: { activeId: string; overlayId: string } | null = null

export const defaultDropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0',
      },
    },
  }),
  duration: 420,
  easing: 'cubic-bezier(0.22, 0.8, 0.24, 1)',
}

export interface DragOverlayProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Z-index depth layer for the floating overlay. Default: 9999 */
  zIndex?: number
  /** Slight tilt angle in degrees applied during active dragging. Default: 0 */
  tiltAngle?: number
  /** Cursor alignment anchor point offset in pixels. Default: { x: 0, y: 0 } */
  offset?: Coordinates
  /** Drop animation configuration, or null for instant drop without animation. Default: defaultDropAnimationConfig */
  dropAnimation?: DropAnimation | null
  /** Custom render function or ReactNode for the floating drag overlay portal. */
  renderOverlay?: ReactNode | ((activeItem: DragItem | null) => ReactNode)
  /** Custom render function receiving the currently dragged item. */
  children?: ReactNode | ((activeItem: DragItem | null) => ReactNode)
  /** Typed slot components. */
  slots?: SlotComponents<DragOverlaySlots>
  /** Typed slot props map. */
  slotProps?: SlotPropsMap<DragOverlaySlots>
}

const DragOverlayPrimitive = forwardRef<HTMLDivElement, DragOverlayProps>(
  (
    {
      zIndex = 9999,
      tiltAngle = 0,
      dropAnimation = defaultDropAnimationConfig,
      renderOverlay,
      className = '',
      style,
      children,
      ...props
    },
    ref
  ) => {
    const dndContext = useOptionalDndContext()
    const activeItem = dndContext?.activeItem ?? null
    const overlayInstanceId = React.useId()

    // Singleton lock: ensure only one DragOverlay renders across the entire DOM tree per drag session
    if (activeItem) {
      const currentActiveId = String(activeItem.id)
      if (!activeOverlaySession || activeOverlaySession.activeId !== currentActiveId) {
        activeOverlaySession = { activeId: currentActiveId, overlayId: overlayInstanceId }
      }
    } else {
      activeOverlaySession = null
    }

    const isPrimaryOverlay = !activeItem || (activeOverlaySession?.overlayId === overlayInstanceId)

    const customRenderer =
      children ??
      renderOverlay ??
      activeItem?.data?.renderOverlay ??
      activeItem?.data?.overlay

    const defaultRenderer = (item: DragItem | null) => {
      if (!item) return null

      // 1. Direct item custom render callback
      if (typeof item.data?.renderItem === 'function') {
        return item.data.renderItem(item.data)
      }

      // 2. JSX content from SortableGrid or custom data
      if (item.data?.content && React.isValidElement(item.data.content)) {
        return (
          <div className="relative flex flex-col justify-center items-center p-space-md rounded-macro bg-bg-surface border border-border-strong shadow-strong w-full box-border select-none">
            {item.data.content}
          </div>
        )
      }

      // 3. Structured Kanban / Task card representation
      if (
        item.data &&
        typeof item.data === 'object' &&
        (item.data.title || item.data.tag || item.data.priority || item.data.assignee || item.data.points != null)
      ) {
        const { title, tag, priority, assignee, points } = item.data
        return (
          <div className="flex flex-col gap-space-xs p-space-sm rounded-base bg-bg-surface border border-border-strong shadow-strong w-full min-w-0 box-border select-none">
            <div className="flex items-center justify-between gap-space-xs w-full min-w-0">
              <span className="font-medium text-sm text-fg truncate">{title ?? String(item.id)}</span>
              {priority && (
                <span
                  className={`text-2xs font-semibold px-1.5 py-0.5 rounded capitalize shrink-0 ${priority === 'high' || priority === 'urgent'
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                      : priority === 'medium'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-bg-subtle text-fg-muted border border-border-subtle'
                    }`}
                >
                  {priority}
                </span>
              )}
            </div>
            {(tag || assignee || points != null) && (
              <div className="flex items-center justify-between text-xs text-fg-muted pt-1 border-t border-border-subtle/50 w-full">
                {tag && <span className="bg-bg-subtle px-1.5 py-0.5 rounded text-2xs font-medium">{tag}</span>}
                <div className="flex items-center gap-space-sm ml-auto">
                  {assignee && <span>{assignee}</span>}
                  {points != null && (
                    <span className="font-mono text-2xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">
                      {points} pts
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      }

      // 4. Universal Sortable Row item fallback
      const label =
        item.data?.label ??
        item.data?.title ??
        item.data?.name ??
        (typeof item.data === 'string' ? item.data : null) ??
        String(item.id)

      return (
        <div className="flex items-center gap-space-sm p-space-sm rounded-base bg-bg-surface border border-border-strong shadow-strong w-full min-w-0 box-border select-none">
          <div className="flex items-center justify-center w-4 h-4 text-fg-muted shrink-0">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="3" r="1.5" />
              <circle cx="11" cy="3" r="1.5" />
              <circle cx="5" cy="8" r="1.5" />
              <circle cx="11" cy="8" r="1.5" />
              <circle cx="5" cy="13" r="1.5" />
              <circle cx="11" cy="13" r="1.5" />
            </svg>
          </div>
          <span className="font-medium text-sm text-fg truncate flex-1 min-w-0">{label}</span>
        </div>
      )
    }

    if (!isPrimaryOverlay) {
      return null
    }

    const content =
      typeof customRenderer === 'function'
        ? customRenderer(activeItem)
        : (customRenderer ?? defaultRenderer(activeItem))

    const overlayContent = (
      <DndKitDragOverlay
        zIndex={zIndex}
        dropAnimation={dropAnimation}
        style={{
          cursor: 'grabbing',
          opacity: 1,
          ...style,
        }}
      >
        {activeItem && content ? (
          <div
            ref={ref}
            role="presentation"
            aria-hidden="true"
            className={`select-none pointer-events-none box-border opacity-100 w-full ${className}`}
            style={{
              opacity: 1,
              transform: tiltAngle ? `rotate(${tiltAngle}deg)` : undefined,
              transformOrigin: '50% 50%',
            }}
            {...props}
          >
            {content}
          </div>
        ) : null}
      </DndKitDragOverlay>
    )

    if (typeof document !== 'undefined' && document.body) {
      return createPortal(overlayContent, document.body)
    }

    return overlayContent
  }
)
DragOverlayPrimitive.displayName = 'DragOverlayPrimitive'

export const DragOverlay = createInterfaceComponent<DragOverlayProps, DragOverlaySlots>(
  {
    name: 'DragOverlay',
    category: 'utility',
    description: 'Floating portal drag ghost preview rendering the active item with tilt and optical elevation.',
    version: '1.0.0',
    props: {
      zIndex: 9999,
      tiltAngle: 0,
      offset: { x: 0, y: 0 },
    },
    slots: {},
  },
  DragOverlayPrimitive
)
