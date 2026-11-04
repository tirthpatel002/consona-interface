import type {
  OverlayTargetResolver,
  ParsedCutoutRadius,
  TargetGeometry,
  TargetRect,
  ViewportDimensions,
} from './types'

/**
 * Snap values to device subpixel boundaries to avoid blurry borders.
 */
export function dprRound(value: number): number {
  if (typeof window === 'undefined') return Math.round(value)
  const dpr = window.devicePixelRatio || 1
  return Math.round(value * dpr) / dpr
}

/**
 * Extract computed border radius from a DOM element for concentric optical sync.
 */
export function getElementBorderRadius(el: Element): ParsedCutoutRadius | undefined {
  if (typeof window === 'undefined' || !(el instanceof HTMLElement || el instanceof SVGElement)) {
    return undefined
  }
  try {
    const style = window.getComputedStyle(el)
    const tl = parseFloat(style.borderTopLeftRadius) || 0
    const tr = parseFloat(style.borderTopRightRadius) || 0
    const br = parseFloat(style.borderBottomRightRadius) || 0
    const bl = parseFloat(style.borderBottomLeftRadius) || 0
    return { topLeft: tl, topRight: tr, bottomRight: br, bottomLeft: bl }
  } catch {
    return undefined
  }
}

/**
 * Get current viewport dimensions and scroll positions.
 */
export function getViewportDimensions(): ViewportDimensions {
  if (typeof window === 'undefined') {
    return {
      width: 1024,
      height: 768,
      scrollX: 0,
      scrollY: 0,
    }
  }

  return {
    width: window.innerWidth || document.documentElement.clientWidth || 1024,
    height: window.innerHeight || document.documentElement.clientHeight || 768,
    scrollX: window.scrollX || window.pageXOffset || 0,
    scrollY: window.scrollY || window.pageYOffset || 0,
  }
}

/**
 * Resolve target to an actual DOM element or virtual coordinate rectangle.
 */
export function resolveTarget(target?: OverlayTargetResolver): Element | TargetRect | null {
  if (!target) return null

  // 1. Target is already a DOM Element
  if (typeof Element !== 'undefined' && target instanceof Element) {
    return target
  }

  // 2. Target is a CSS Selector string
  if (typeof target === 'string') {
    if (typeof document === 'undefined') return null
    try {
      return document.querySelector(target)
    } catch {
      return null
    }
  }

  // 3. Target is a getter function
  if (typeof target === 'function') {
    try {
      const el = target()
      return el ?? null
    } catch {
      return null
    }
  }

  // 4. Target is a ref object with `.current`
  if (typeof target === 'object' && 'current' in target) {
    return target.current ?? null
  }

  // 5. Target is a virtual coordinate object
  if (
    typeof target === 'object' &&
    'x' in target &&
    'y' in target &&
    typeof (target as any).x === 'number' &&
    typeof (target as any).y === 'number'
  ) {
    const v = target as { x: number; y: number; width?: number; height?: number }
    const w = v.width ?? 0
    const h = v.height ?? 0
    return {
      top: v.y,
      left: v.x,
      width: w,
      height: h,
      bottom: v.y + h,
      right: v.x + w,
    }
  }

  return null
}

/**
 * Resolve target or target array or multi-node CSS selector to an array of elements/rects.
 */
export function resolveTargets(
  target?: OverlayTargetResolver | OverlayTargetResolver[]
): (Element | TargetRect)[] {
  if (!target) return []

  if (Array.isArray(target)) {
    return target.flatMap((t) => resolveTargets(t))
  }

  // If target is a CSS selector that matches multiple elements
  if (typeof target === 'string' && typeof document !== 'undefined') {
    try {
      const nodes = Array.from(document.querySelectorAll(target))
      if (nodes.length > 0) return nodes
    } catch {
      // Invalid selector fallback
    }
  }

  const single = resolveTarget(target)
  return single ? [single] : []
}

/**
 * Extract exact bounding rectangle for a single resolved target with computed border-radius.
 */
export function getTargetRect(
  target: Element | TargetRect | null | undefined,
  padding: number = 0
): TargetRect | null {
  if (!target) return null

  let rawRect: TargetRect
  let borderRadius: ParsedCutoutRadius | undefined

  if (typeof Element !== 'undefined' && target instanceof Element) {
    const domRect = target.getBoundingClientRect()
    // Element not attached or 0x0
    if (domRect.width === 0 && domRect.height === 0 && domRect.top === 0 && domRect.left === 0) {
      return null
    }
    borderRadius = getElementBorderRadius(target)
    rawRect = {
      top: domRect.top,
      left: domRect.left,
      width: domRect.width,
      height: domRect.height,
      bottom: domRect.bottom,
      right: domRect.right,
      borderRadius,
    }
  } else {
    rawRect = target as TargetRect
    borderRadius = rawRect.borderRadius
  }

  const p = Math.max(0, padding)
  const top = dprRound(rawRect.top - p)
  const left = dprRound(rawRect.left - p)
  const width = dprRound(rawRect.width + p * 2)
  const height = dprRound(rawRect.height + p * 2)

  return {
    top,
    left,
    width,
    height,
    bottom: top + height,
    right: left + width,
    borderRadius,
    padding: p,
  }
}

/**
 * Compute the bounding union rect encompassing multiple targets.
 */
export function getCompoundTargetRect(
  targets: (Element | TargetRect | null | undefined)[],
  padding: number = 0
): TargetRect | null {
  const validRects: TargetRect[] = []
  for (const t of targets) {
    const r = getTargetRect(t, padding)
    if (r) validRects.push(r)
  }

  if (validRects.length === 0) return null
  if (validRects.length === 1) return validRects[0]!

  let minTop = Infinity
  let minLeft = Infinity
  let maxBottom = -Infinity
  let maxRight = -Infinity

  for (const r of validRects) {
    if (r.top < minTop) minTop = r.top
    if (r.left < minLeft) minLeft = r.left
    if (r.bottom > maxBottom) maxBottom = r.bottom
    if (r.right > maxRight) maxRight = r.right
  }

  return {
    top: minTop,
    left: minLeft,
    width: maxRight - minLeft,
    height: maxBottom - minTop,
    bottom: maxBottom,
    right: maxRight,
  }
}

/**
 * Get comprehensive spatial geometry for a target.
 */
export function getTargetGeometry(
  target: Element | TargetRect | null | undefined,
  padding: number = 0
): TargetGeometry | null {
  const rect = getTargetRect(target, padding)
  if (!rect) return null

  const viewport = getViewportDimensions()
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

  return {
    ...rect,
    scrollX: viewport.scrollX,
    scrollY: viewport.scrollY,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
    dpr,
  }
}
