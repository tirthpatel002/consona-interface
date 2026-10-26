/**
 * @file use-board-state.ts
 * Universal multi-container and Kanban board state management hook.
 * Operates on normalized flat datasets with decoupled column entities and dynamic groupBy partitioning.
 */

import { useCallback, useState } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import type {
  DragCancelEvent,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  Identifier,
} from '../engine/types'
import {
  getItemId,
  type ContainerEntity,
} from '../engine/multi-container'
import { generateLexoRankBetween } from '../engine/lexorank'

export interface ColumnEntity {
  id: Identifier
  title: string
  rank?: string
  maxCapacity?: number
  accept?: string | string[]
  rule?: any
  collapsible?: boolean
  collapsed?: boolean
  disabled?: boolean
  [key: string]: any
}

export interface UseBoardStateOptions<
  TItem = any,
  TColumn extends ColumnEntity = ColumnEntity
> {
  /** Initial flat items collection. */
  initialItems?: TItem[]
  /** Initial column definitions collection. */
  initialColumns?: TColumn[]
  /** Function mapping an item to its column ID. Default: (item) => item.columnId ?? item.status */
  groupBy?: (item: TItem) => Identifier
  /** Custom reducer called when an item is assigned a new column and rank. */
  assignColumn?: (item: TItem, targetColumnId: Identifier, newRank: string) => TItem
  /** Callback fired whenever items change. */
  onItemsChange?: (items: TItem[]) => void
  /** Callback fired whenever columns change. */
  onColumnsChange?: (columns: TColumn[]) => void
}

export interface UseBoardStateReturn<
  TItem = any,
  TColumn extends ColumnEntity = ColumnEntity
> {
  /** Current reactive items array. */
  items: TItem[]
  /** State setter for items. */
  setItems: React.Dispatch<React.SetStateAction<TItem[]>>
  /** Direct items change handler. */
  onItemsChange: (items: TItem[]) => void
  /** Current reactive columns array. */
  columns: TColumn[]
  /** State setter for columns. */
  setColumns: React.Dispatch<React.SetStateAction<TColumn[]>>
  /** Direct columns change handler. */
  onColumnsChange: (columns: TColumn[]) => void
  /** Active item currently being dragged. */
  activeItem: any | null
  /** Programmatically move a column to another position. */
  moveColumn: (activeColumnId: Identifier, overColumnId: Identifier) => void
  /** Programmatically move an item to another column. */
  moveItem: (activeId: Identifier, targetColumnId: Identifier, newRank?: string) => void
  /** Programmatically reorder an item within the same or across columns. */
  reorderItem: (activeId: Identifier, overId: Identifier) => void
  /** Resets board state back to initial or specified datasets. */
  reset: (newItems?: TItem[], newColumns?: TColumn[]) => void
  /** Drag lifecycle handler for drag initiation. */
  onDragStart: (event: DragStartEvent) => void
  /** Drag lifecycle handler for cross-column hovering. */
  onDragOver: (event: DragOverEvent) => void
  /** Drag lifecycle handler for drop completion. */
  onDragEnd: (event: DragEndEvent) => void
  /** Drag lifecycle handler for cancellation. */
  onDragCancel: (event?: DragCancelEvent) => void
  /** Props bundle ready to spread directly onto <DndProvider /> */
  dndProviderProps: {
    onDragStart: (event: DragStartEvent) => void
    onDragOver: (event: DragOverEvent) => void
    onDragEnd: (event: DragEndEvent) => void
    onDragCancel: (event?: DragCancelEvent) => void
  }
}

export function useBoardState<
  TItem = any,
  TColumn extends ColumnEntity = ColumnEntity
>(options: UseBoardStateOptions<TItem, TColumn>): UseBoardStateReturn<TItem, TColumn> {
  const {
    initialItems = [],
    initialColumns = [],
    groupBy = (item: any) => item?.columnId ?? item?.status ?? item?.containerId,
    assignColumn = (item: any, targetColId: Identifier, newRank: string) => ({
      ...item,
      columnId: targetColId,
      status: targetColId,
      rank: newRank,
    }),
    onItemsChange,
    onColumnsChange,
  } = options

  const [items, setItemsState] = useState<TItem[]>(initialItems)
  const [columns, setColumnsState] = useState<TColumn[]>(initialColumns)
  const [activeItem, setActiveItem] = useState<any | null>(null)

  const setItems = useCallback(
    (action: React.SetStateAction<TItem[]>) => {
      setItemsState((prev) => {
        const next = typeof action === 'function' ? (action as any)(prev) : action
        onItemsChange?.(next)
        return next
      })
    },
    [onItemsChange]
  )

  const setColumns = useCallback(
    (action: React.SetStateAction<TColumn[]>) => {
      setColumnsState((prev) => {
        const next = typeof action === 'function' ? (action as any)(prev) : action
        onColumnsChange?.(next)
        return next
      })
    },
    [onColumnsChange]
  )

  const moveColumn = useCallback(
    (activeColumnId: Identifier, overColumnId: Identifier) => {
      setColumns((prev) => {
        const activeIdx = prev.findIndex((c) => String(c.id) === String(activeColumnId))
        let overIdx = prev.findIndex((c) => String(c.id) === String(overColumnId))
        if (overIdx === -1) {
          const overItem = items.find((i) => getItemId(i) === String(overColumnId))
          if (overItem) {
            const colId = String(groupBy(overItem))
            overIdx = prev.findIndex((c) => String(c.id) === colId)
          }
        }
        if (activeIdx !== -1 && overIdx !== -1 && activeIdx !== overIdx) {
          const reordered = arrayMove(prev, activeIdx, overIdx)
          const beforeCol = overIdx > 0 ? reordered[overIdx - 1] : undefined
          const afterCol = overIdx < reordered.length - 1 ? reordered[overIdx + 1] : undefined
          const newRank = generateLexoRankBetween(beforeCol?.rank, afterCol?.rank)
          reordered[overIdx] = {
            ...reordered[overIdx],
            rank: newRank,
          } as TColumn
          return reordered
        }
        return prev
      })
    },
    [setColumns, items, groupBy]
  )

  const moveItem = useCallback(
    (activeId: Identifier, targetColumnId: Identifier, customRank?: string) => {
      const activeStr = String(activeId)
      setItems((prev) => {
        const activeItemObj = prev.find((item) => getItemId(item) === activeStr)
        if (!activeItemObj) return prev

        const targetColItems = prev.filter(
          (item) => String(groupBy(item)) === String(targetColumnId) && getItemId(item) !== activeStr
        )
        const lastItem = targetColItems[targetColItems.length - 1] as any
        const computedRank = customRank ?? generateLexoRankBetween(lastItem?.rank, undefined)

        const updatedItem = assignColumn(activeItemObj, targetColumnId, computedRank)
        const withoutActive = prev.filter((item) => getItemId(item) !== activeStr)

        const lastColIdx = withoutActive
          .map((item, idx) => ({ item, idx }))
          .filter(({ item }) => String(groupBy(item)) === String(targetColumnId))
          .pop()?.idx

        if (lastColIdx !== undefined) {
          const next = [...withoutActive]
          next.splice(lastColIdx + 1, 0, updatedItem)
          return next
        }

        return [...withoutActive, updatedItem]
      })
    },
    [groupBy, assignColumn, setItems]
  )

  const reorderItem = useCallback(
    (activeId: Identifier, overId: Identifier) => {
      const activeStr = String(activeId)
      const overStr = String(overId)
      if (activeStr === overStr) return

      setItems((prev) => {
        const activeItemObj = prev.find((item) => getItemId(item) === activeStr)
        if (!activeItemObj) return prev

        const targetColumnId = groupBy(activeItemObj)
        const colItems = prev.filter((item) => String(groupBy(item)) === String(targetColumnId))
        const oldIndex = colItems.findIndex((item) => getItemId(item) === activeStr)
        const newIndex = colItems.findIndex((item) => getItemId(item) === overStr)

        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev

        const reordered = arrayMove(colItems, oldIndex, newIndex)
        const beforeItem = newIndex > 0 ? (reordered[newIndex - 1] as any) : undefined
        const afterItem = newIndex < reordered.length - 1 ? (reordered[newIndex + 1] as any) : undefined
        const newRank = generateLexoRankBetween(beforeItem?.rank, afterItem?.rank)

        const updatedMovedItem = assignColumn(activeItemObj, targetColumnId, newRank)

        const withoutActive = prev.filter((item) => getItemId(item) !== activeStr)
        const overIdxInWithout = withoutActive.findIndex((item) => getItemId(item) === overStr)

        if (overIdxInWithout !== -1) {
          const next = [...withoutActive]
          const insertPos = oldIndex < newIndex ? overIdxInWithout + 1 : overIdxInWithout
          next.splice(insertPos, 0, updatedMovedItem)
          return next
        }

        return prev.map((item) => {
          if (getItemId(item) === activeStr) {
            return updatedMovedItem
          }
          return item
        })
      })
    },
    [groupBy, assignColumn, setItems]
  )

  const reset = useCallback(
    (newItems?: TItem[], newColumns?: TColumn[]) => {
      const targetItems = newItems ?? initialItems
      const targetCols = newColumns ?? initialColumns
      setItemsState(targetItems)
      setColumnsState(targetCols)
      onItemsChange?.(targetItems)
      onColumnsChange?.(targetCols)
      setActiveItem(null)
    },
    [initialItems, initialColumns, onItemsChange, onColumnsChange]
  )

  const onDragStart = useCallback((event: DragStartEvent) => {
    const activeData = event.active?.data
    setActiveItem(activeData ?? event.active)
  }, [])

  const onDragOver = useCallback((_event: DragOverEvent) => {
    // Over handling is resolved by DndBoard engine
  }, [])

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveItem(null)
      if (!event.over || event.validation?.isRejected || event.isDropped === false) return

      const activeId = event.active?.id
      const overId = event.over?.id
      if (!activeId || !overId) return

      const activeStr = String(activeId)
      const overStr = String(overId)

      // Column reordering
      const activeIsColumn =
        event.active?.type === 'column' ||
        (event.active?.data as any)?.type === 'column' ||
        columns.some((c) => String(c.id) === activeStr)

      if (activeIsColumn) {
        const resolvedColTargetId =
          columns.some((c) => String(c.id) === overStr)
            ? overId
            : event.over.containerId ?? overId
        moveColumn(activeId, resolvedColTargetId)
        return
      }

      // Card item reordering / moving
      const activeItemObj = items.find((item) => getItemId(item) === activeStr)
      if (!activeItemObj) return

      const targetCol = columns.find((c) => String(c.id) === overStr)
      if (targetCol) {
        // Dropped directly on a column
        moveItem(activeId, targetCol.id)
      } else {
        // Dropped on another item
        const overItemObj = items.find((item) => getItemId(item) === overStr)
        if (overItemObj) {
          const targetColId = groupBy(overItemObj)
          const sourceColId = groupBy(activeItemObj)

          if (String(sourceColId) === String(targetColId)) {
            // Same-column reordering using arrayMove
            reorderItem(activeId, overId)
          } else {
            // Cross-column move to specific slot
            const targetColItems = items.filter(
              (item) => String(groupBy(item)) === String(targetColId) && getItemId(item) !== activeStr
            )
            const overIdx = targetColItems.findIndex((item) => getItemId(item) === overStr)

            const beforeItem = overIdx > 0 ? (targetColItems[overIdx - 1] as any) : undefined
            const afterItem = overIdx >= 0 ? (targetColItems[overIdx] as any) : undefined
            const newRank = generateLexoRankBetween(beforeItem?.rank, afterItem?.rank)

            setItems((prev) =>
              prev.map((item) => {
                if (getItemId(item) === activeStr) {
                  return assignColumn(item, targetColId, newRank)
                }
                return item
              })
            )
          }
        }
      }
    },
    [columns, items, groupBy, assignColumn, moveColumn, moveItem, reorderItem, setItems]
  )

  const onDragCancel = useCallback(() => {
    setActiveItem(null)
  }, [])

  return {
    items,
    setItems,
    onItemsChange: (nextItems: TItem[]) => setItems(nextItems),
    columns,
    setColumns,
    onColumnsChange: (nextCols: TColumn[]) => setColumns(nextCols),
    activeItem,
    moveColumn,
    moveItem,
    reorderItem,
    reset,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragCancel,
    dndProviderProps: {
      onDragStart,
      onDragOver,
      onDragEnd,
      onDragCancel,
    },
  }
}

