import type { CutoutRadius, CutoutShapeType, ParsedCutoutRadius, TargetRect } from './types'

export function parseCutoutRadius(
  radius: CutoutRadius = 'auto',
  width: number = 0,
  height: number = 0,
  shape: CutoutShapeType = 'rounded-rect',
  padding: number = 0,
  targetRadius?: ParsedCutoutRadius
): ParsedCutoutRadius {
  if (shape === 'circle' || shape === 'pill') {
    const r = Math.min(width, height) / 2
    return { topLeft: r, topRight: r, bottomRight: r, bottomLeft: r }
  }

  if (shape === 'rect') {
    return { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 }
  }

  // 1. Concentric optical sync from target element's actual computed border radius:
  if (targetRadius) {
    const hasTargetCurve =
      targetRadius.topLeft > 0 ||
      targetRadius.topRight > 0 ||
      targetRadius.bottomRight > 0 ||
      targetRadius.bottomLeft > 0

    if (radius === 'auto' || radius === undefined) {
      if (hasTargetCurve) {
        // Co-centric principle: R_outer = R_inner + padding
        return {
          topLeft: targetRadius.topLeft > 0 ? targetRadius.topLeft + padding : 0,
          topRight: targetRadius.topRight > 0 ? targetRadius.topRight + padding : 0,
          bottomRight: targetRadius.bottomRight > 0 ? targetRadius.bottomRight + padding : 0,
          bottomLeft: targetRadius.bottomLeft > 0 ? targetRadius.bottomLeft + padding : 0,
        }
      }
      return { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 }
    }

    if (typeof radius === 'number' && hasTargetCurve) {
      return {
        topLeft: targetRadius.topLeft > 0 ? targetRadius.topLeft + padding : radius + padding,
        topRight: targetRadius.topRight > 0 ? targetRadius.topRight + padding : radius + padding,
        bottomRight: targetRadius.bottomRight > 0 ? targetRadius.bottomRight + padding : radius + padding,
        bottomLeft: targetRadius.bottomLeft > 0 ? targetRadius.bottomLeft + padding : radius + padding,
      }
    }
  }

  // 2. Explicit number radius with concentric padding compensation
  if (typeof radius === 'number') {
    const r = Math.max(0, radius + padding)
    return { topLeft: r, topRight: r, bottomRight: r, bottomLeft: r }
  }

  if (Array.isArray(radius)) {
    return {
      topLeft: Math.max(0, (radius[0] ?? 0) + padding),
      topRight: Math.max(0, (radius[1] ?? 0) + padding),
      bottomRight: Math.max(0, (radius[2] ?? 0) + padding),
      bottomLeft: Math.max(0, (radius[3] ?? 0) + padding),
    }
  }

  if (typeof radius === 'object' && radius !== null) {
    return {
      topLeft: Math.max(0, (radius.topLeft ?? 8) + padding),
      topRight: Math.max(0, (radius.topRight ?? 8) + padding),
      bottomRight: Math.max(0, (radius.bottomRight ?? 8) + padding),
      bottomLeft: Math.max(0, (radius.bottomLeft ?? 8) + padding),
    }
  }

  const defaultR = 8 + padding
  return { topLeft: defaultR, topRight: defaultR, bottomRight: defaultR, bottomLeft: defaultR }
}

/**
 * Generate a single cutout sub-path for a target rect.
 * Uses co-centric corner radius matching and counter-clockwise winding.
 */
export function generateSubCutoutPath(
  rect: TargetRect,
  radius: CutoutRadius = 'auto',
  shape: CutoutShapeType = 'rounded-rect'
): string {
  const { top: y, left: x, width: w, height: h, borderRadius: targetRadius, padding = 0 } = rect
  if (w <= 0 || h <= 0) return ''

  const maxR = Math.min(w / 2, h / 2)
  const parsed = parseCutoutRadius(radius, w, h, shape, padding, targetRadius)

  const tl = Math.min(parsed.topLeft, maxR)
  const tr = Math.min(parsed.topRight, maxR)
  const br = Math.min(parsed.bottomRight, maxR)
  const bl = Math.min(parsed.bottomLeft, maxR)

  // Inner cutout drawn counter-clockwise (even-odd or non-zero fill rule compatible)
  return [
    `M ${x + tl},${y}`,
    `H ${x + w - tr}`,
    tr > 0 ? `A ${tr},${tr} 0 0 1 ${x + w},${y + tr}` : `L ${x + w},${y}`,
    `V ${y + h - br}`,
    br > 0 ? `A ${br},${br} 0 0 1 ${x + w - br},${y + h}` : `L ${x + w},${y + h}`,
    `H ${x + bl}`,
    bl > 0 ? `A ${bl},${bl} 0 0 1 ${x},${y + h - bl}` : `L ${x},${y + h}`,
    `V ${y + tl}`,
    tl > 0 ? `A ${tl},${tl} 0 0 1 ${x + tl},${y}` : `L ${x},${y}`,
    'Z',
  ].join(' ')
}

export function generateCutoutMaskPath(
  rect: TargetRect | null,
  radius: CutoutRadius = 'auto',
  viewportOrVw?: { width: number; height: number } | number,
  shapeOrVh: CutoutShapeType | number = 'rounded-rect'
): string {
  let vw = typeof window !== 'undefined' ? window.innerWidth : 1920
  let vh = typeof window !== 'undefined' ? window.innerHeight : 1080
  let shape: CutoutShapeType = 'rounded-rect'

  if (typeof viewportOrVw === 'number') {
    vw = viewportOrVw
    if (typeof shapeOrVh === 'number') {
      vh = shapeOrVh
    }
  } else if (typeof viewportOrVw === 'object' && viewportOrVw !== null) {
    vw = viewportOrVw.width
    vh = viewportOrVw.height
    if (typeof shapeOrVh === 'string') {
      shape = shapeOrVh
    }
  } else if (typeof shapeOrVh === 'string') {
    shape = shapeOrVh
  }

  // Clockwise fullscreen outer boundary
  const outerPath = `M 0,0 L ${vw},0 L ${vw},${vh} L 0,${vh} Z`

  if (!rect || rect.width <= 0 || rect.height <= 0) {
    return outerPath
  }

  const innerCutout = generateSubCutoutPath(rect, radius, shape)
  return `${outerPath} ${innerCutout}`
}

/**
 * Generate complete fullscreen SVG path with multiple target cutout holes.
 */
export function generateMultiCutoutMaskPath(
  rects: TargetRect[],
  radius: CutoutRadius = 'auto',
  viewport?: { width: number; height: number },
  shape: CutoutShapeType = 'rounded-rect'
): string {
  const vw = viewport?.width ?? (typeof window !== 'undefined' ? window.innerWidth : 1920)
  const vh = viewport?.height ?? (typeof window !== 'undefined' ? window.innerHeight : 1080)

  const outerPath = `M 0,0 L ${vw},0 L ${vw},${vh} L 0,${vh} Z`

  const validRects = rects.filter((r) => r && r.width > 0 && r.height > 0)
  if (validRects.length === 0) {
    return outerPath
  }

  const cutouts = validRects.map((r) => generateSubCutoutPath(r, radius, shape)).join(' ')
  return `${outerPath} ${cutouts}`
}
