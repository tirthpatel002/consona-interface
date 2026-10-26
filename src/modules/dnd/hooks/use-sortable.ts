import React, { useEffect, useMemo, useRef } from 'react'
import {
  useSortable as useDndKitSortable,
  defaultAnimateLayoutChanges,
  type AnimateLayoutChanges,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useOptionalDndContext } from '../context'
import type {
  DropRule,
  DropRulePredicate,
  Identifier,
} from '../engine/types'
import { type UseDraggableOptions } from './use-draggable'
import { type UseDroppableOptions } from './use-droppable'


export interface UseSortableOptions<T = any> extends UseDraggableOptions<T> {
  /** Accepted item type(s) when this item acts as a drop target. */
  accept?: string | string[]
  /** Custom validation rule or predicate for dropping onto this sortable item. */
  rule?: DropRule | DropRulePredicate
  /** Sorting layout orientation ('vertical' or 'horizontal'). Default: 'vertical' */
  orientation?: 'vertical' | 'horizontal'
  /** Custom transition configuration for layout sorting animations. */
  transition?: any
  /** Custom animateLayoutChanges hook. */
  animateLayoutChanges?: AnimateLayoutChanges
}

export interface UseSortableState {
  /** Whether this item is actively being dragged. */
  isDragging: boolean
  /** Whether another item is currently being sorted over this item. */
  isSorting: boolean
  /** Item identifier. */
  id: Identifier
}

export interface UseSortableActions {
  startDrag: (coords?: { x: number; y: number }) => void
  endDrag: (cancelled?: boolean) => void
}

export interface UseSortableAriaProps {
  role: string
  tabIndex: number
  'aria-grabbed': boolean
  'aria-dropeffect': 'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup'
  'aria-disabled': boolean
}

export interface UseSortableReturn<T = any> {
  /** Combined ref callback for DOM node. */
  ref: (element: HTMLElement | null) => void
  /** Dedicated drag handle activator node ref callback. */
  setActivatorNodeRef: (element: HTMLElement | null) => void
  /** Whether this item is actively being dragged. */
  isDragging: boolean
  /** Whether another active drag item is sorting over this item. */
  isSorting: boolean
  /** Whether an active drag item is hovering over this item. */
  isOver: boolean
  /** Combined event listeners. */
  listeners: any
  /** Accessibility attributes to spread on the draggable element. */
  attributes: any
  /** Transform delta. */
  transform: any
  /** Transition CSS string. */
  transition: string | undefined
  /** Computed dynamic inline style with GPU hardware transform and transition. */
  style: React.CSSProperties
  /** Strict Type B Hook contract parts */
  state: UseSortableState
  actions: UseSortableActions
  helpers: any
  ariaProps: UseSortableAriaProps
}

import { useShallowMemo } from './use-shallow-memo'

/** Softer than @dnd-kit's default 200ms/ease — shared by board, list, and grid live-sort. */
export const DEFAULT_SORTABLE_TRANSITION = {
  duration: 280,
  easing: 'cubic-bezier(0.22, 0.8, 0.24, 1)',
}

export function useSortable<T = any>(options: UseSortableOptions<T>): UseSortableReturn<T> {
  const {
    id,
    type = 'sortable',
    containerId,
    index,
    data,
    accept,
    rule,
    disabled = false,
    renderOverlay,
    animateLayoutChanges = defaultAnimateLayoutChanges,
    transition: customTransition = DEFAULT_SORTABLE_TRANSITION,
  } = options

  const dndContext = useOptionalDndContext()

  const rawItemPayload = useMemo(
    () => ({
      id,
      type,
      containerId,
      index,
      accept,
      rule,
      disabled,
      renderOverlay,
      ...(typeof data === 'object' ? data : { value: data }),
      ...(renderOverlay ? { renderOverlay } : {}),
    }),
    [id, type, containerId, index, accept, rule, disabled, data, renderOverlay]
  )

  const itemPayload = useShallowMemo(rawItemPayload)

  const dndKit = useDndKitSortable({
    id: String(id),
    data: itemPayload,
    disabled,
    animateLayoutChanges,
    transition: customTransition,
  })

  const isDragging = dndKit.isDragging || Boolean(dndContext?.activeItem && String(dndContext.activeItem.id) === String(id))
  const isSorting = dndKit.isSorting
  const isOver = dndKit.isOver || Boolean(dndContext?.activeItem && dndContext?.overTarget && String(dndContext.overTarget.id) === String(id))

  const dynamicStyle: React.CSSProperties = {
    transform: isDragging ? undefined : CSS.Transform.toString(dndKit.transform),
    transition: isDragging ? 'none' : dndKit.transition,
    opacity: isDragging ? 0 : 1,
    visibility: isDragging ? 'hidden' : undefined,
    zIndex: isDragging ? -1 : undefined,
  }

  const ariaProps: UseSortableAriaProps = {
    role: 'listitem',
    tabIndex: disabled ? -1 : 0,
    'aria-grabbed': isDragging,
    'aria-dropeffect': disabled ? 'none' : 'move',
    'aria-disabled': disabled,
  }

  const state: UseSortableState = {
    isDragging,
    isSorting,
    id,
  }

  const actions: UseSortableActions = {
    startDrag: (coords) =>
      dndContext?.startDrag(
        {
          id,
          type,
          data: (typeof data === 'object' ? { ...data, renderOverlay } : data) as T,
          containerId,
          index,
        },
        coords
      ),
    endDrag: (cancelled) => dndContext?.endDrag(cancelled),
  }

  return {
    ref: dndKit.setNodeRef,
    setActivatorNodeRef: dndKit.setActivatorNodeRef,
    isDragging,
    isSorting,
    isOver,
    listeners: dndKit.listeners ?? {},
    attributes: { ...ariaProps, ...dndKit.attributes },
    transform: dndKit.transform,
    transition: dndKit.transition,
    style: dynamicStyle,
    state,
    actions,
    helpers: { dndKit },
    ariaProps,
  }
}
