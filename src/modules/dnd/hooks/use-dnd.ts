/**
 * @file use-dnd.ts
 * Type C Engine Runtime Hook: useDnd()
 * Directly binds to active DndContext and returns reactive state and actions.
 */

import { useDndContext, type DndContextValue } from '../context'
import type {
  CollisionStrategy,
  Coordinates,
  DragItem,
  DropTarget,
  DropValidationResult,
  Identifier,
} from '../engine/types'

export interface UseDndReturn {
  /** Currently active draggable entity. */
  activeItem: DragItem | null
  /** Currently hovered drop target. */
  overTarget: DropTarget | null
  /** Real-time drag coordinates. */
  dragCoordinates: Coordinates | null
  /** Original starting coordinates. */
  initialCoordinates: Coordinates | null
  /** Starting container ID. */
  initialContainerId: Identifier | null
  /** Starting item index. */
  initialIndex: number | null
  /** Whether a drag is actively occurring. */
  isDragging: boolean
  /** Active validation result for current target. */
  validation: DropValidationResult | null
  /** Active collision detection strategy. */
  collisionStrategy: CollisionStrategy
  /** Semantic type discriminant of the active entity. */
  activeType: string | undefined
  /** Strongly typed domain data payload of the active entity. */
  activeData: any
  /** Utility function to check if an item with a given type tag is being dragged. */
  isTypeDragging: (type: string) => boolean
  /** Initiates drag for an item. */
  startDrag: (item: DragItem, coords?: Coordinates) => void
  /** Overrides or sets current hover target. */
  setOver: (target: DropTarget | null) => void
  /** Completes drag operation. */
  endDrag: (cancelled?: boolean) => void
  /** Aborts current drag operation. */
  cancelDrag: () => void
  /** Mutates active item payload dynamically. */
  updateActiveItem: (updates: Partial<DragItem>) => void
}

/**
 * Access reactive DnD state and controls.
 */
export function useDnd(): UseDndReturn {
  const ctx = useDndContext()
  return {
    activeItem: ctx.activeItem,
    overTarget: ctx.overTarget,
    dragCoordinates: ctx.dragCoordinates,
    initialCoordinates: ctx.initialCoordinates,
    initialContainerId: ctx.initialContainerId,
    initialIndex: ctx.initialIndex,
    isDragging: ctx.isDragging,
    validation: ctx.validation,
    collisionStrategy: ctx.collisionStrategy,
    activeType: ctx.activeType,
    activeData: ctx.activeData,
    isTypeDragging: ctx.isTypeDragging,
    startDrag: ctx.startDrag,
    setOver: ctx.setOver,
    endDrag: ctx.endDrag,
    cancelDrag: ctx.cancelDrag,
    updateActiveItem: ctx.updateActiveItem,
  }
}

