/**
 * @file collision.ts
 * Spatial collision detection algorithms for drag-and-drop interactions.
 * Features native browser hit-testing (elementFromPoint) for O(1) resolution,
 * alongside pure in-memory spatial geometric intersection calculations.
 */

import type {
  ClientRectangle,
  CollisionStrategy,
  Coordinates,
  DropTarget,
  SpatialSnapshot,
} from './types'

/**
 * Calculates Euclidean distance between two 2D points.
 */
export function distanceBetween(p1: Coordinates, p2: Coordinates): number {
  const dx = p1.x - p2.x
  const dy = p1.y - p2.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Computes the center point of a bounding rectangle.
 */
export function getRectCenter(rect: ClientRectangle): Coordinates {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}

/**
 * Determines whether a coordinate lies strictly within a bounding rectangle.
 */
export function isPointInsideRect(
  point: Coordinates,
  rect: ClientRectangle
): boolean {
  return (
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  )
}

/**
 * Computes the overlapping intersection area between two bounding rectangles in pixels^2.
 */
export function getIntersectionArea(
  r1: ClientRectangle,
  r2: ClientRectangle
): number {
  const xOverlap = Math.max(
    0,
    Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left)
  )
  const yOverlap = Math.max(
    0,
    Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top)
  )
  return xOverlap * yOverlap
}

/**
 * Native Browser Hit-Testing Strategy:
 * Uses document.elementFromPoint(x, y) to locate the topmost [data-droppable-id]
 * directly via the browser compositor in ~0.02ms without layout loops.
 */
export function elementFromPointStrategy(
  pointer: Coordinates,
  droppableMap: Map<string, DropTarget>
): DropTarget | null {
  if (typeof document === 'undefined') return null

  try {
    const el = document.elementFromPoint(pointer.x, pointer.y)
    if (!el) return null

    const droppableEl = el.closest('[data-droppable-id]')
    if (!droppableEl) return null

    const droppableId = droppableEl.getAttribute('data-droppable-id')
    if (!droppableId) return null

    const matched = droppableMap.get(droppableId)
    if (matched && !matched.disabled) {
      return matched
    }
  } catch {}

  return null
}

/**
 * Pointer-Within Collision Strategy:
 * Selects the smallest droppable rectangle containing the pointer coordinates.
 */
export function pointerWithin(
  pointer: Coordinates,
  _activeRect: ClientRectangle | null,
  droppables: SpatialSnapshot[]
): DropTarget | null {
  let matchedTarget: DropTarget | null = null
  let minArea = Infinity

  for (const { target, rect } of droppables) {
    if (target.disabled) continue
    if (isPointInsideRect(pointer, rect)) {
      const area = rect.width * rect.height
      if (area < minArea) {
        minArea = area
        matchedTarget = target
      }
    }
  }

  return matchedTarget
}

/**
 * Closest-Center Collision Strategy:
 * Finds the droppable whose center is closest to the active item's center (or pointer).
 */
export function closestCenter(
  pointer: Coordinates,
  activeRect: ClientRectangle | null,
  droppables: SpatialSnapshot[]
): DropTarget | null {
  const center = activeRect ? getRectCenter(activeRect) : pointer
  let closestTarget: DropTarget | null = null
  let minDistance = Infinity

  for (const { target, rect } of droppables) {
    if (target.disabled) continue
    const targetCenter = getRectCenter(rect)
    const dist = distanceBetween(center, targetCenter)
    if (dist < minDistance) {
      minDistance = dist
      closestTarget = target
    }
  }

  return closestTarget
}

/**
 * Closest-Corners Collision Strategy:
 * Compares the distances of all 4 corners between active rect and target rects.
 */
export function closestCorners(
  pointer: Coordinates,
  activeRect: ClientRectangle | null,
  droppables: SpatialSnapshot[]
): DropTarget | null {
  if (!activeRect) {
    return closestCenter(pointer, null, droppables)
  }

  const activeCorners: Coordinates[] = [
    { x: activeRect.left, y: activeRect.top },
    { x: activeRect.right, y: activeRect.top },
    { x: activeRect.left, y: activeRect.bottom },
    { x: activeRect.right, y: activeRect.bottom },
  ]

  let closestTarget: DropTarget | null = null
  let minDistance = Infinity

  for (const { target, rect } of droppables) {
    if (target.disabled) continue
    const targetCorners: Coordinates[] = [
      { x: rect.left, y: rect.top },
      { x: rect.right, y: rect.top },
      { x: rect.left, y: rect.bottom },
      { x: rect.right, y: rect.bottom },
    ]

    let totalDist = 0
    for (let i = 0; i < 4; i++) {
      totalDist += distanceBetween(activeCorners[i]!, targetCorners[i]!)
    }

    if (totalDist < minDistance) {
      minDistance = totalDist
      closestTarget = target
    }
  }

  return closestTarget
}

/**
 * Rect-Intersection Collision Strategy:
 * Selects the droppable with the largest overlapping surface area.
 */
export function rectIntersection(
  pointer: Coordinates,
  activeRect: ClientRectangle | null,
  droppables: SpatialSnapshot[]
): DropTarget | null {
  if (!activeRect) {
    return pointerWithin(pointer, null, droppables)
  }

  let maxArea = 0
  let bestTarget: DropTarget | null = null

  for (const { target, rect } of droppables) {
    if (target.disabled) continue
    const area = getIntersectionArea(activeRect, rect)
    if (area > maxArea) {
      maxArea = area
      bestTarget = target
    }
  }

  // Fallback to closest-center if no overlap
  if (!bestTarget) {
    return closestCenter(pointer, activeRect, droppables)
  }

  return bestTarget
}

/**
 * Master collision resolver dispatching to the configured strategy.
 */
export function evaluateCollision(
  strategy: CollisionStrategy,
  pointer: Coordinates,
  activeRect: ClientRectangle | null,
  droppables: SpatialSnapshot[],
  droppableMap?: Map<string, DropTarget>
): DropTarget | null {
  if (typeof strategy === 'function') {
    return strategy(pointer, activeRect, droppables)
  }

  if (strategy === 'element-from-point' && droppableMap) {
    const hit = elementFromPointStrategy(pointer, droppableMap)
    if (hit) return hit
  }

  switch (strategy) {
    case 'element-from-point':
      return pointerWithin(pointer, activeRect, droppables)
    case 'pointer-within':
      return pointerWithin(pointer, activeRect, droppables)
    case 'closest-center':
      return closestCenter(pointer, activeRect, droppables)
    case 'closest-corners':
      return closestCorners(pointer, activeRect, droppables)
    case 'rect-intersection':
    default:
      return rectIntersection(pointer, activeRect, droppables)
  }
}
