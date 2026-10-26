import React, { useMemo } from 'react'
import { useDraggable as useDndKitDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useOptionalDndContext } from '../context'
import type { DragItem, Identifier } from '../engine/types'

export interface UseDraggableOptions<T = any> {
  /** Unique identifier for this draggable element. */
  id: Identifier
  /** Semantic type discriminant for acceptance filtering (e.g., 'task', 'column', 'widget'). */
  type?: string
  /** Custom data payload attached to the drag item. */
  data?: T
  /** Parent container identifier if inside a collection or column. */
  containerId?: Identifier
  /** Current index position in collection. */
  index?: number
  /** Whether dragging is disabled. */
  disabled?: boolean
  /** Custom floating overlay portal render function or element when this item is dragging. */
  renderOverlay?: React.ReactNode | ((activeItem: DragItem<T> | null) => React.ReactNode)
}

export interface UseDraggableState {
  /** Whether this specific item is currently being dragged. */
  isDragging: boolean
  /** Whether drag is disabled for this item. */
  disabled: boolean
  /** Active item identifier. */
  id: Identifier
}

export interface UseDraggableActions {
  /** Programmatically starts dragging this item. */
  startDrag: (coords?: { x: number; y: number }) => void
  /** Completes or cancels drag. */
  endDrag: (cancelled?: boolean) => void
}

export interface UseDraggableHelpers {
  /** Item specification object. */
  item: DragItem
}

export interface UseDraggableAriaProps {
  role: string
  tabIndex: number
  'aria-grabbed': boolean
  'aria-disabled': boolean
}

export interface UseDraggableReturn<T = any> {
  /** Node reference callback to attach to the draggable DOM element. */
  ref: (element: HTMLElement | null) => void
  /** Whether this item is actively being dragged. */
  isDragging: boolean
  /** Accessibility attributes to spread on the draggable element. */
  attributes: any
  /** Event listeners to spread on the draggable element. */
  listeners: any
  /** Transform delta. */
  transform: any
  /** Computed inline dynamic style for draggable translation. */
  style: React.CSSProperties
  /** Strict Type B Hook contract parts */
  state: UseDraggableState
  actions: UseDraggableActions
  helpers: UseDraggableHelpers
  ariaProps: UseDraggableAriaProps
}

import { useShallowMemo } from './use-shallow-memo'

export function useDraggable<T = any>(options: UseDraggableOptions<T>): UseDraggableReturn<T> {
  const { id, type = 'draggable', data, containerId, index, disabled = false, renderOverlay } = options
  const dndContext = useOptionalDndContext()

  const rawItemPayload = useMemo(
    () => ({
      id,
      type,
      containerId,
      index,
      renderOverlay,
      ...(typeof data === 'object' ? data : { value: data }),
      ...(renderOverlay ? { renderOverlay } : {}),
    }),
    [id, type, containerId, index, data, renderOverlay]
  )

  const itemPayload = useShallowMemo(rawItemPayload)

  const dndKit = useDndKitDraggable({
    id: String(id),
    data: itemPayload,
    disabled,
  })

  const item: DragItem<T> = {
    id,
    type,
    data: (typeof data === 'object' ? { ...data, renderOverlay } : data) as T,
    containerId,
    index,
  }

  const isDragging = dndKit.isDragging || Boolean(dndContext?.activeItem && String(dndContext.activeItem.id) === String(id))

  const ariaProps: UseDraggableAriaProps = {
    role: 'button',
    tabIndex: disabled ? -1 : 0,
    'aria-grabbed': isDragging,
    'aria-disabled': disabled,
  }

  const actions: UseDraggableActions = {
    startDrag: (coords) => dndContext?.startDrag(item, coords),
    endDrag: (cancelled) => dndContext?.endDrag(cancelled),
  }

  const state: UseDraggableState = {
    isDragging,
    disabled,
    id,
  }

  const helpers: UseDraggableHelpers = {
    item,
  }

  const dynamicStyle: React.CSSProperties = {
    transform: dndKit.transform ? CSS.Translate.toString(dndKit.transform) : undefined,
    transition: isDragging ? 'none' : 'transform 420ms cubic-bezier(0.22, 0.8, 0.24, 1)',
    opacity: isDragging ? 0 : 1,
    visibility: isDragging ? 'hidden' : undefined,
    zIndex: isDragging ? -1 : undefined,
  }

  return {
    ref: dndKit.setNodeRef,
    isDragging,
    attributes: { ...ariaProps, ...dndKit.attributes },
    listeners: dndKit.listeners ?? {},
    transform: dndKit.transform,
    style: dynamicStyle,
    state,
    actions,
    helpers,
    ariaProps,
  }
}
