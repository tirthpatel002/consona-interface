/**
 * @file rules.ts
 * Type-safe acceptance rule evaluation engine for Drag-and-Drop operations.
 * Validates entity types, glob patterns, capacity bounds, and custom predicate contracts.
 */

import type {
  DragItem,
  DropRule,
  DropRulePredicate,
  DropTarget,
  DropValidationResult,
} from './types'

/**
 * Checks if a candidate type matches an accept pattern (supporting wildcards like 'media/*' or '*').
 */
export function matchesTypePattern(candidateType: string | undefined, pattern: string): boolean {
  if (pattern === '*' || pattern === '') return true
  if (!candidateType) return false
  if (candidateType === pattern) return true

  // Wildcard trailing matching (e.g. 'image/*' matches 'image/png' or 'task:*' matches 'task:bug')
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -2)
    return candidateType.startsWith(prefix + '/')
  }

  if (pattern.endsWith(':*')) {
    const prefix = pattern.slice(0, -2)
    return candidateType.startsWith(prefix + ':')
  }

  return false
}

/**
 * Evaluates whether an active item's type satisfies the target's acceptance list.
 */
export function isTypeAccepted(
  activeType: string | undefined,
  accept: string | string[] | undefined
): boolean {
  if (!accept) return true
  const list = Array.isArray(accept) ? accept : [accept]
  if (list.length === 0 || list.includes('*')) return true
  if (!activeType) return false

  return list.some((pattern) => matchesTypePattern(activeType, pattern))
}

/**
 * Evaluates all acceptance rules, constraints, and capacity limits for a drop target.
 */
export function evaluateAcceptanceRule(
  activeItem: DragItem | null,
  target: DropTarget | null,
  options?: {
    currentContainerCount?: number
    /** True when a live/optimistic move already placed the active item in this container. */
    activeAlreadyInContainer?: boolean
    /**
     * Precomputed occupancy excluding the active id (from OccupancyIndex.snapshot).
     * When provided, skips O(n) scans of target.items / itemIds.
     */
    occupancyOtherCount?: number
  }
): DropValidationResult {
  // If no active item or target, default to accepted
  if (!activeItem || !target) {
    return {
      isAccepted: true,
      isRejected: false,
    }
  }

  // 1. Target is explicitly disabled
  if (target.disabled) {
    return {
      isAccepted: false,
      isRejected: true,
      rejectionReason: 'Target container is currently disabled.',
    }
  }

  // 2. Direct type matching (only when target explicitly specifies an accept filter)
  const acceptTypes = target.accept ?? (typeof target.rule === 'object' ? target.rule?.acceptTypes : undefined)
  if (acceptTypes != null && acceptTypes !== '*' && acceptTypes !== '') {
    const itemType = activeItem.type || 'item'
    if (!isTypeAccepted(itemType, acceptTypes)) {
      const expected = Array.isArray(acceptTypes) ? acceptTypes.join(', ') : acceptTypes
      return {
        isAccepted: false,
        isRejected: true,
        rejectionReason: `Type "${itemType}" is not accepted. Expected: ${expected}`,
      }
    }
  }

  // 3. Container capacity constraint (only applies when transferring a *card* into a foreign container).
  // Column↔column reorders must never hit item capacity toasts.
  const activeIsColumn =
    activeItem.type === 'column' ||
    (activeItem.data as any)?.type === 'column'

  const maxCapacity = target.maxCapacity ?? (typeof target.rule === 'object' ? target.rule?.maxCapacity : undefined)
  const count = options?.currentContainerCount

  if (!activeIsColumn && typeof maxCapacity === 'number') {
    const targetContainerId = target.containerId ?? target.id
    const isOriginContainer =
      activeItem.containerId != null &&
      (String(activeItem.containerId) === String(target.id) ||
        String(activeItem.containerId) === String(targetContainerId))

    if (!isOriginContainer) {
      let otherItemsCount: number | undefined

      // Fast path: O(1) precomputed occupancy from OccupancyIndex
      if (typeof options?.occupancyOtherCount === 'number') {
        otherItemsCount = options.occupancyOtherCount
      } else {
        const targetItems = Array.isArray((target as any).items)
          ? (target as any).items
          : Array.isArray(target.data?.items)
            ? target.data.items
            : []

        const activeIdStr = String(activeItem.id)
        const alreadyInTarget =
          options?.activeAlreadyInContainer === true ||
          targetItems.some((item: any) => String(item?.id ?? item) === activeIdStr)

        if (targetItems.length > 0) {
          otherItemsCount = alreadyInTarget ? targetItems.length - 1 : targetItems.length
        } else if (typeof count === 'number') {
          otherItemsCount = alreadyInTarget ? Math.max(0, count - 1) : count
        }
      }

      if (typeof otherItemsCount === 'number' && otherItemsCount >= maxCapacity) {
        return {
          isAccepted: false,
          isRejected: true,
          rejectionReason: `Container capacity reached (max ${maxCapacity} items).`,
        }
      }
    }
  }

  // 4. Custom functional rule or predicate check
  if (target.rule) {
    const predicate = typeof target.rule === 'function' ? target.rule : target.rule?.predicate
    if (typeof predicate === 'function') {
      try {
        const passes = predicate({
          active: activeItem,
          target,
          containerId: target.containerId,
          currentCount: count,
        })
        if (!passes) {
          const msg = typeof target.rule === 'object' ? target.rule?.rejectionMessage : undefined
          return {
            isAccepted: false,
            isRejected: true,
            rejectionReason: msg ?? 'Item rejected by drop rule validation.',
          }
        }
      } catch (err) {
        return {
          isAccepted: false,
          isRejected: true,
          rejectionReason: `Drop rule error: ${err instanceof Error ? err.message : String(err)}`,
        }
      }
    }
  }

  // All checks passed
  return {
    isAccepted: true,
    isRejected: false,
  }
}

import { arrayMove } from '@dnd-kit/sortable'

export { arrayMove }

/**
 * Pure mathematical item array reordering utility supporting directional insertion positions.
 */
export function reorderItems<T extends { id: any }>(
  items: T[],
  activeId: any,
  overId: any,
  sortPosition: 'before' | 'after' = 'before'
): T[] {
  const sourceIndex = items.findIndex((i) => String(i.id) === String(activeId))
  if (sourceIndex === -1) return items

  let overIndex = items.findIndex((i) => String(i.id) === String(overId))
  if (overIndex === -1) {
    overIndex = sortPosition === 'before' ? 0 : items.length - 1
  }

  if (sourceIndex === overIndex) return items

  return arrayMove(items, sourceIndex, overIndex)
}
