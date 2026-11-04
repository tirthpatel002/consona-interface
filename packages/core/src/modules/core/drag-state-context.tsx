'use client'

/**
 * @file drag-state-context.tsx
 * Minimal drag-active state context in core to avoid circular deps.
 *
 * WHY this exists: @dnd-kit/core's useDndContext() re-renders consumers on EVERY
 * pointer move (to update active.rect, collisions, over). When InfiniteScrollSection
 * called useDndContext() directly, all N ISS instances in a DndBoard re-rendered on
 * every single pointer move causing severe jank. This context only updates on drag
 * start/end (2 state changes per drag total), keeping all ISS instances stable.
 *
 * Populated by: DndProvider (src/modules/dnd/context.tsx)
 * Consumed by: InfiniteScrollSection (activeDndId for window pinning)
 */

import React, { createContext, useContext, type ReactNode } from 'react'

export interface DragStateContextValue {
  /** ID of the currently active (dragged) item, null when nothing is dragging. */
  activeDndId: string | number | null
  /** Semantic type tag of the active item (e.g. 'column', 'card'), null otherwise. */
  activeDndType: string | null
  /**
   * Stable ref that is `true` while dnd-kit's auto-scroller is actively scrolling a container.
   * ISS reads this imperatively in handlers — a ref, not state, so zero re-renders.
   */
  isDragScrollingRef: React.RefObject<boolean>
}

/** Stable no-op ref for environments where no DndProvider is mounted. */
const falseRef: React.RefObject<boolean> = { current: false }

const defaultDragState: DragStateContextValue = {
  activeDndId: null,
  activeDndType: null,
  isDragScrollingRef: falseRef,
}

export const DragStateContext = createContext<DragStateContextValue>(defaultDragState)

/**
 * Read the current active-drag identity.
 * Safe to call outside a DndProvider — returns null values when no drag is active.
 */
export function useDragState(): DragStateContextValue {
  return useContext(DragStateContext)
}

export interface DragStateProviderProps {
  value: DragStateContextValue
  children: ReactNode
}

export function DragStateProvider({ value, children }: DragStateProviderProps) {
  return <DragStateContext.Provider value={value}>{children}</DragStateContext.Provider>
}
