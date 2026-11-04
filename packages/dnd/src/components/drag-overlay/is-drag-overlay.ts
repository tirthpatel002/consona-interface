/**
 * @file is-drag-overlay.ts
 * Stable identity check for DragOverlay children (survives memo / HMR / wrappers).
 */

import React, { type ReactNode } from 'react'

/** Brand key attached to DragOverlay component constructors. */
export const DRAG_OVERLAY_BRAND = '__consonaIsDragOverlay' as const

export function markDragOverlay<T extends object>(component: T): T {
  Object.defineProperty(component, DRAG_OVERLAY_BRAND, {
    value: true,
    enumerable: false,
    configurable: true,
  })
  return component
}

export function isDragOverlayType(type: unknown): boolean {
  if (type == null || (typeof type !== 'function' && typeof type !== 'object')) {
    return false
  }
  const t = type as Record<string, unknown>
  if (t[DRAG_OVERLAY_BRAND] === true) return true
  const name =
    (typeof t.displayName === 'string' && t.displayName) ||
    (typeof t.name === 'string' && t.name) ||
    (typeof t.componentName === 'string' && t.componentName) ||
    ''
  return name === 'DragOverlay' || name === 'DragOverlayPrimitive'
}

/** True when a React child is a DragOverlay (branded or named). */
export function isDragOverlayChild(child: ReactNode): boolean {
  if (!React.isValidElement(child)) return false
  return isDragOverlayType(child.type)
}

export function hasOverlayChild(children: ReactNode): boolean {
  let found = false
  React.Children.forEach(children, (child) => {
    if (isDragOverlayChild(child)) found = true
  })
  return found
}
