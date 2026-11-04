import { arrayMove } from '@dnd-kit/sortable'
import type { Identifier, DragOverEvent, DragEndEvent } from './types'
import { evaluateAcceptanceRule } from './rules'
import { generateLexoRankBetween } from './lexorank'

export interface ContainerEntity<TItem = any> {
  id: Identifier
  items: TItem[]
  maxCapacity?: number
  accept?: string | string[]
  rule?: any
  collapsible?: boolean
  collapsed?: boolean
  disabled?: boolean
  rank?: string
  [key: string]: any
}

/**
 * Normalizes an item or identifier into a string ID.
 */
export function getItemId(item: any): string {
  if (item === null || item === undefined) return ''
  if (typeof item === 'object' && 'id' in item) {
    return String(item.id)
  }
  return String(item)
}

/**
 * Finds the container that contains an item or matches the container ID directly.
 */
export function findContainerForItem<TContainer extends ContainerEntity>(
  containers: TContainer[],
  id: Identifier | null | undefined
): TContainer | undefined {
  if (id === null || id === undefined || !Array.isArray(containers)) return undefined
  const strId = String(id)

  return containers.find(
    (col) =>
      col &&
      (String(col.id) === strId ||
        (Array.isArray(col.items) && col.items.some((item) => getItemId(item) === strId)))
  )
}

export interface MoveItemOptions {
  activeId: Identifier
  overId: Identifier
  /** Whether to respect maxCapacity limits on the target container. Default: true */
  respectCapacity?: boolean
  /** Property key holding the LexoRank string on items. Default: 'rank' */
  rankKey?: string
}

export interface MultiContainerMoveResult<TContainer extends ContainerEntity = any, TItem = any> {
  containers: TContainer[]
  activeId: Identifier
  sourceContainerId: Identifier
  targetContainerId: Identifier
  sourceIndex: number
  targetIndex: number
  rank?: string
  beforeRank?: string
  afterRank?: string
  beforeItem?: TItem
  afterItem?: TItem
  movedItem?: TItem
  hasChanged: boolean
}

/**
 * Moves an item across containers or reorders it if dropped on another item in another container.
 * Automatically computes LexoRank on the moved item.
 * Returns a new immutably updated containers array.
 */
export function moveItemAcrossContainers<TContainer extends ContainerEntity>(
  containers: TContainer[],
  options: MoveItemOptions
): TContainer[] {
  if (!Array.isArray(containers)) return containers
  const { activeId, overId, respectCapacity = true, rankKey = 'rank' } = options
  const activeCol = findContainerForItem(containers, activeId)
  const overCol = findContainerForItem(containers, overId)

  if (!activeCol || !overCol || activeCol.id === overCol.id) {
    return containers
  }

  // Capacity check — occupancy excluding the active item (optimistic live moves
  // already place it in the target list; counting it would false-block the last slot).
  if (respectCapacity && typeof overCol.maxCapacity === 'number' && Array.isArray(overCol.items)) {
    const occupied = overCol.items.filter((item) => getItemId(item) !== String(activeId)).length
    if (occupied >= overCol.maxCapacity) {
      return containers
    }
  }

  const activeStr = String(activeId)
  const overStr = String(overId)

  const activeItems = Array.isArray(activeCol.items) ? activeCol.items : []
  const activeIndex = activeItems.findIndex((item) => getItemId(item) === activeStr)
  if (activeIndex === -1) return containers

  let itemToMove = activeItems[activeIndex]

  // Deep acceptance rule & type check
  if (overCol.accept || overCol.rule || overCol.disabled) {
    const activeType = (itemToMove as any)?.type ?? (itemToMove as any)?.data?.type ?? 'task'
    const validation = evaluateAcceptanceRule(
      { id: activeId, type: activeType, data: itemToMove, containerId: activeCol.id },
      {
        id: overCol.id,
        type: 'column',
        accept: overCol.accept,
        rule: overCol.rule,
        maxCapacity: overCol.maxCapacity,
        disabled: overCol.disabled,
      },
      { currentContainerCount: overCol.items?.length }
    )
    if (validation.isAccepted === false || validation.isRejected) {
      return containers
    }
  }
  const overItems = Array.isArray(overCol.items) ? overCol.items : []
  const overIndex = overItems.findIndex((item) => getItemId(item) === overStr)

  const newIndex = overIndex >= 0 ? overIndex : overItems.length

  // Calculate LexoRank between neighbors in destination container
  const beforeItem = newIndex > 0 ? overItems[newIndex - 1] : undefined
  const afterItem = overIndex >= 0 ? overItems[overIndex] : undefined

  const beforeRank = beforeItem ? (beforeItem as any)[rankKey] : undefined
  const afterRank = afterItem ? (afterItem as any)[rankKey] : undefined
  const newRank = generateLexoRankBetween(beforeRank, afterRank)

  if (itemToMove && typeof itemToMove === 'object') {
    itemToMove = {
      ...itemToMove,
      [rankKey]: newRank,
      columnId: overCol.id,
      containerId: overCol.id,
    }
  }

  return containers.map((col) => {
    if (!col) return col
    if (col.id === activeCol.id) {
      return {
        ...col,
        items: activeItems.filter((item) => getItemId(item) !== activeStr),
      }
    }
    if (col.id === overCol.id) {
      const nextItems = [...overItems]
      nextItems.splice(newIndex, 0, itemToMove)
      return {
        ...col,
        items: nextItems,
      }
    }
    return col
  })
}

export interface ReorderContainerOptions {
  containerId: Identifier
  activeId: Identifier
  overId: Identifier
  rankKey?: string
}

/**
 * Reorders items within the same container and calculates new LexoRank.
 * Returns a new immutably updated containers array.
 */
export function reorderWithinContainer<TContainer extends ContainerEntity>(
  containers: TContainer[],
  options: ReorderContainerOptions
): TContainer[] {
  if (!Array.isArray(containers)) return containers
  const { containerId, activeId, overId, rankKey = 'rank' } = options
  const targetCol = containers.find((col) => col && String(col.id) === String(containerId))
  if (!targetCol || !Array.isArray(targetCol.items)) return containers

  const activeStr = String(activeId)
  const overStr = String(overId)

  if (activeStr === overStr) return containers

  const oldIndex = targetCol.items.findIndex((item) => getItemId(item) === activeStr)
  let newIndex = targetCol.items.findIndex((item) => getItemId(item) === overStr)

  // If dropped on the container itself rather than a card item, move to end
  if (newIndex === -1 && String(targetCol.id) === overStr) {
    newIndex = targetCol.items.length - 1
  }

  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
    return containers
  }

  const reordered = arrayMove(targetCol.items, oldIndex, newIndex)
  const movedItem = reordered[newIndex]

  // Calculate LexoRank between new surrounding neighbors
  const beforeItem = newIndex > 0 ? reordered[newIndex - 1] : undefined
  const afterItem = newIndex < reordered.length - 1 ? reordered[newIndex + 1] : undefined

  const beforeRank = beforeItem ? (beforeItem as any)[rankKey] : undefined
  const afterRank = afterItem ? (afterItem as any)[rankKey] : undefined
  const newRank = generateLexoRankBetween(beforeRank, afterRank)

  if (movedItem && typeof movedItem === 'object') {
    reordered[newIndex] = {
      ...movedItem,
      [rankKey]: newRank,
    }
  }

  return containers.map((col) => {
    if (col && col.id === targetCol.id) {
      return {
        ...col,
        items: reordered,
      }
    }
    return col
  })
}

/**
 * Resolves full LexoRank and positional movement details for a multi-container drag event.
 */
export function resolveMultiContainerMove<TContainer extends ContainerEntity = any, TItem = any>(
  containers: TContainer[],
  event: DragEndEvent,
  rankKey: string = 'rank'
): MultiContainerMoveResult<TContainer, TItem> {
  const activeId = event.active?.id
  const overId = event.over?.id

  const fallback: MultiContainerMoveResult<TContainer, TItem> = {
    containers,
    activeId: activeId ?? '',
    sourceContainerId: event.initialContainerId ?? event.active?.containerId ?? '',
    targetContainerId: event.targetContainerId ?? event.over?.containerId ?? event.over?.id ?? '',
    sourceIndex: event.initialIndex ?? 0,
    targetIndex: event.targetIndex ?? 0,
    hasChanged: false,
  }

  if (!activeId || !overId || !Array.isArray(containers)) {
    return fallback
  }

  const activeStr = String(activeId)
  const overStr = String(overId)

  if (activeStr === overStr) {
    return fallback
  }

  // Check if dragging a column
  const activeIsColumn =
    event.active?.type === 'column' ||
    (event.active?.data as any)?.type === 'column' ||
    containers.some((col) => col && String(col.id) === activeStr)

  if (activeIsColumn) {
    const activeColIndex = containers.findIndex((c) => c && String(c.id) === activeStr)
    let overColIndex = containers.findIndex((c) => c && String(c.id) === overStr)
    if (overColIndex === -1) {
      const col = findContainerForItem(containers, overId)
      if (col) {
        overColIndex = containers.findIndex((c) => c && String(c.id) === String(col.id))
      }
    }

    if (activeColIndex === -1 || overColIndex === -1 || activeColIndex === overColIndex) {
      return fallback
    }

    const updatedContainers = handleMultiContainerDrag(containers, event, 'end', rankKey)
    const movedCol = updatedContainers[overColIndex]
    const beforeCol = overColIndex > 0 ? updatedContainers[overColIndex - 1] : undefined
    const afterCol = overColIndex < updatedContainers.length - 1 ? updatedContainers[overColIndex + 1] : undefined

    const beforeRank = beforeCol ? (beforeCol as any)[rankKey] : undefined
    const afterRank = afterCol ? (afterCol as any)[rankKey] : undefined
    const rank = movedCol ? (movedCol as any)[rankKey] ?? generateLexoRankBetween(beforeRank, afterRank) : undefined

    return {
      containers: updatedContainers,
      activeId,
      sourceContainerId: activeId,
      targetContainerId: overId,
      sourceIndex: activeColIndex,
      targetIndex: overColIndex,
      rank,
      beforeRank,
      afterRank,
      beforeItem: beforeCol as any,
      afterItem: afterCol as any,
      movedItem: movedCol as any,
      hasChanged: updatedContainers !== containers,
    }
  }

  // Card Item Drag & Drop
  const activeCol = findContainerForItem(containers, activeId)
  const overCol = findContainerForItem(containers, overId)

  if (!activeCol || !overCol) {
    return fallback
  }

  const sourceItems = Array.isArray(activeCol.items) ? activeCol.items : []
  const sourceIndex = sourceItems.findIndex((item) => getItemId(item) === activeStr)
  if (sourceIndex === -1) return fallback

  const updatedContainers = handleMultiContainerDrag(containers, event, 'end', rankKey)
  const updatedTargetCol = updatedContainers.find((c) => c && String(c.id) === String(overCol.id))
  const targetItems = Array.isArray(updatedTargetCol?.items) ? updatedTargetCol.items : []
  const targetIndex = targetItems.findIndex((item) => getItemId(item) === activeStr)

  const finalTargetIndex = targetIndex !== -1 ? targetIndex : 0
  const movedItem = targetItems[finalTargetIndex]

  const beforeItem = finalTargetIndex > 0 ? targetItems[finalTargetIndex - 1] : undefined
  const afterItem = finalTargetIndex < targetItems.length - 1 ? targetItems[finalTargetIndex + 1] : undefined

  const beforeRank = beforeItem ? (beforeItem as any)[rankKey] : undefined
  const afterRank = afterItem ? (afterItem as any)[rankKey] : undefined
  const rank = movedItem ? (movedItem as any)[rankKey] ?? generateLexoRankBetween(beforeRank, afterRank) : undefined

  return {
    containers: updatedContainers,
    activeId,
    sourceContainerId: activeCol.id,
    targetContainerId: overCol.id,
    sourceIndex,
    targetIndex: finalTargetIndex,
    rank,
    beforeRank,
    afterRank,
    beforeItem,
    afterItem,
    movedItem,
    hasChanged: updatedContainers !== containers,
  }
}

/**
 * Universal multi-container drag event handler.
 * Supports both horizontal column reordering and item transfers/reordering.
 * Automatically computes LexoRank on moved columns and moved items.
 * Safely isolates cross-column transfer on 'over' and intra-column reordering on 'end',
 * completely preventing infinite update depth loops.
 */
export function handleMultiContainerDrag<TContainer extends ContainerEntity>(
  containers: TContainer[],
  event: DragOverEvent | DragEndEvent,
  phase: 'over' | 'end' = 'end',
  rankKey: string = 'rank'
): TContainer[] {
  if (!Array.isArray(containers)) return containers
  const activeId = event.active?.id
  const overId = event.over?.id
  if (!activeId || !overId) return containers

  const activeStr = String(activeId)
  const overStr = String(overId)

  if (activeStr === overStr) return containers

  // 1. Column Drag & Drop Reordering
  const activeIsColumn =
    event.active?.type === 'column' ||
    (event.active?.data as any)?.type === 'column' ||
    containers.some((col) => col && String(col.id) === activeStr)

  if (activeIsColumn) {
    if (phase !== 'end') {
      return containers
    }

    const activeColIndex = containers.findIndex((c) => c && String(c.id) === activeStr)
    if (activeColIndex !== -1) {
      let overColIndex = containers.findIndex((c) => c && String(c.id) === overStr)
      if (overColIndex === -1) {
        const col = findContainerForItem(containers, overId)
        if (col) {
          overColIndex = containers.findIndex((c) => c && String(c.id) === String(col.id))
        }
      }
      if (overColIndex !== -1 && activeColIndex !== overColIndex) {
        const reordered = arrayMove(containers, activeColIndex, overColIndex)
        const movedCol = reordered[overColIndex]
        if (movedCol && typeof movedCol === 'object') {
          const beforeCol = overColIndex > 0 ? reordered[overColIndex - 1] : undefined
          const afterCol = overColIndex < reordered.length - 1 ? reordered[overColIndex + 1] : undefined
          const beforeRank = beforeCol ? (beforeCol as any)[rankKey] : undefined
          const afterRank = afterCol ? (afterCol as any)[rankKey] : undefined
          const newRank = generateLexoRankBetween(beforeRank, afterRank)
          reordered[overColIndex] = {
            ...movedCol,
            [rankKey]: newRank,
          }
        }
        return reordered
      }
    }
    return containers
  }

  // 2. Card Item Drag & Drop
  const activeCol = findContainerForItem(containers, activeId)
  const overCol = findContainerForItem(containers, overId)

  if (!activeCol || !overCol) return containers

  // CASE 1: Cross-column transfer (runs on 'over' or on final drop 'end')
  if (activeCol.id !== overCol.id) {
    return moveItemAcrossContainers(containers, { activeId, overId, rankKey })
  }

  // CASE 2: Same-column reordering (ONLY on final 'end' drop to prevent React update loops)
  if (phase === 'end' && activeCol.id === overCol.id) {
    return reorderWithinContainer(containers, {
      containerId: activeCol.id,
      activeId,
      overId,
      rankKey,
    })
  }

  return containers
}
