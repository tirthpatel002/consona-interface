import React, { useMemo } from 'react'
import { useDroppable as useDndKitDroppable } from '@dnd-kit/core'
import { useOptionalDndContext } from '../context'
import { evaluateAcceptanceRule } from '../engine/rules'
import type {
  DragItem,
  DropRule,
  DropRulePredicate,
  DropTarget,
  Identifier,
} from '../engine/types'

export interface UseDroppableOptions<T = any> {
  /** Unique droppable target identifier. */
  id: Identifier
  /** Semantic type discriminant for this drop target. */
  type?: string
  /** Domain payload data attached to this drop target. */
  data?: T
  /** Accepted type(s) or wildcard patterns (e.g. 'task', 'media/*', '*'). */
  accept?: string | string[]
  /** Deep validation predicate or rule object. */
  rule?: DropRule | DropRulePredicate
  /** Maximum number of items this container can hold. */
  maxCapacity?: number
  /** Parent container ID if nested. */
  containerId?: Identifier
  /** Whether the drop target is disabled. */
  disabled?: boolean
}

export interface UseDroppableState {
  /** Whether the active drag item is currently hovering over this target. */
  isOver: boolean
  /** Whether the hovering item is allowed by acceptance rules. */
  isAccepted: boolean
  /** Whether the hovering item is explicitly rejected. */
  isRejected: boolean
  /** Reason for rejection if applicable. */
  rejectionReason?: string
  /** Active dragged item if any. */
  activeItem: DragItem | null
}

export interface UseDroppableActions {
  /** Explicitly marks this target as the current over target. */
  setOver: () => void
  /** Drops the active item onto this target. */
  drop: () => void
}

export interface UseDroppableHelpers {
  /** Target specification object. */
  target: DropTarget
}

export interface UseDroppableAriaProps {
  'aria-dropeffect': 'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup'
  'aria-disabled': boolean
}

export interface UseDroppableReturn<T = any> {
  /** DOM node ref callback. */
  ref: (element: HTMLElement | null) => void
  /** Whether an active item is hovering over this target. */
  isOver: boolean
  /** Whether the hovering item is accepted. */
  isAccepted: boolean
  /** Whether the hovering item is rejected. */
  isRejected: boolean
  /** Reason why the hovering item was rejected. */
  rejectionReason?: string
  /** The currently dragged item. */
  activeItem: DragItem | null
  /** Attributes and event handlers to spread on the droppable element. */
  droppableProps: {
    'data-droppable-id': string
    'data-is-over': boolean
    'data-is-accepted': boolean
    'data-is-rejected': boolean
  }
  /** Strict Type B Hook contract parts */
  state: UseDroppableState
  actions: UseDroppableActions
  helpers: UseDroppableHelpers
  ariaProps: UseDroppableAriaProps
}

import { useShallowMemo } from './use-shallow-memo'

export function useDroppable<T = any>(options: UseDroppableOptions<T>): UseDroppableReturn<T> {
  const { id, type = 'droppable', data, accept, rule, maxCapacity, containerId, disabled = false } = options
  const dndContext = useOptionalDndContext()

  const rawTargetPayload = useMemo(
    () => ({ id, type, accept, rule, maxCapacity, containerId, ...(typeof data === 'object' ? data : { value: data }) }),
    [id, type, accept, rule, maxCapacity, containerId, data]
  )

  const targetPayload = useShallowMemo(rawTargetPayload)

  const dndKit = useDndKitDroppable({
    id: String(id),
    data: targetPayload,
    disabled,
  })

  const target: DropTarget<T> = {
    id,
    type,
    data,
    accept,
    rule,
    maxCapacity,
    containerId,
    disabled,
  }

  const activeItem = dndContext?.activeItem ?? null
  const isOver = dndKit.isOver || Boolean(activeItem && dndContext?.overTarget && String(dndContext.overTarget.id) === String(id))

  const snap = activeItem ? dndContext?.occupancy?.snapshot(String(containerId ?? id), activeItem.id) : null
  const currentCount =
    snap?.otherCount ??
    (typeof (data as any)?.currentCount === 'number'
      ? (data as any).currentCount
      : Array.isArray((data as any)?.items)
        ? (data as any).items.length
        : undefined)

  const validation =
    activeItem && isOver
      ? evaluateAcceptanceRule(activeItem, target, {
          currentContainerCount: currentCount,
          activeAlreadyInContainer: false,
          occupancyOtherCount: snap?.otherCount,
        })
      : { isAccepted: true, isRejected: false }
  const isAccepted = isOver ? validation.isAccepted : false
  const isRejected = isOver ? validation.isRejected : false
  const rejectionReason = isOver ? validation.rejectionReason : undefined

  const ariaProps: UseDroppableAriaProps = {
    'aria-dropeffect': disabled ? 'none' : 'move',
    'aria-disabled': disabled,
  }

  const droppableProps = {
    'data-droppable-id': String(id),
    'data-is-over': isOver,
    'data-is-accepted': isAccepted,
    'data-is-rejected': isRejected,
  }

  const state: UseDroppableState = {
    isOver,
    isAccepted,
    isRejected,
    rejectionReason,
    activeItem,
  }

  const actions: UseDroppableActions = {
    setOver: () => dndContext?.setOver(target),
    drop: () => dndContext?.endDrag(false),
  }

  const helpers: UseDroppableHelpers = {
    target,
  }

  return {
    ref: dndKit.setNodeRef,
    isOver,
    isAccepted,
    isRejected,
    rejectionReason,
    activeItem,
    droppableProps,
    state,
    actions,
    helpers,
    ariaProps,
  }
}
