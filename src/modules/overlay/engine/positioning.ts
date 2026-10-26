import { dprRound, getViewportDimensions } from './geometry'
import type {
  CalculatedPosition,
  FloatingPositionOptions,
  OverlayArrowPlacement,
  OverlayPlacement,
  TargetRect,
} from './types'

const OPPOSITE_SIDE: Record<string, string> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
}

const ARROW_OPPOSITE_MAP: Record<string, OverlayArrowPlacement> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
}

/**
 * 12-Placement collision and floating anchor position solver.
 */
export function calculateFloatingPosition(
  targetRect: TargetRect | null | undefined,
  cardWidth: number = 360,
  cardHeight: number = 200,
  preferredPlacement: OverlayPlacement = 'bottom',
  options?: FloatingPositionOptions | number
): CalculatedPosition {
  const normalizedOptions: FloatingPositionOptions =
    typeof options === 'number' ? { offset: options } : options ?? {}

  const {
    offset = 14,
    arrowSize = 8,
    edgePadding = 14,
    autoFlip = true,
    flipFallbackPlacements,
    autoShift = true,
  } = normalizedOptions

  const viewport = getViewportDimensions()
  const vw = viewport.width
  const vh = viewport.height

  // Fallback if no target: center on screen
  if (!targetRect || preferredPlacement === 'center') {
    return {
      x: dprRound(Math.max(edgePadding, (vw - cardWidth) / 2)),
      y: dprRound(Math.max(edgePadding, (vh - cardHeight) / 2)),
      placement: 'center',
      maxHeight: vh - edgePadding * 2,
      maxWidth: vw - edgePadding * 2,
    }
  }

  const { top: tY, left: tX, width: tW, height: tH } = targetRect
  const tCenterX = tX + tW / 2
  const tCenterY = tY + tH / 2

  // Determine candidate placements to test
  const candidatePlacements: OverlayPlacement[] = [preferredPlacement]

  if (autoFlip) {
    if (flipFallbackPlacements && flipFallbackPlacements.length > 0) {
      for (const p of flipFallbackPlacements) {
        if (!candidatePlacements.includes(p)) candidatePlacements.push(p)
      }
    } else {
      // Auto generate opposite flip
      const parts = preferredPlacement.split('-')
      const side = parts[0]!
      const align = parts[1] ? `-${parts[1]}` : ''
      const oppSide = OPPOSITE_SIDE[side] || 'bottom'
      const flipped = `${oppSide}${align}` as OverlayPlacement
      if (!candidatePlacements.includes(flipped)) candidatePlacements.push(flipped)

      // Add other perpendicular sides as fallbacks
      if (side === 'top' || side === 'bottom') {
        candidatePlacements.push('right', 'left')
      } else {
        candidatePlacements.push('bottom', 'top')
      }
    }
  }

  let bestPlacement: OverlayPlacement = preferredPlacement
  let bestX = 0
  let bestY = 0
  let bestOverflow = Infinity

  for (const placement of candidatePlacements) {
    let x = 0
    let y = 0

    switch (placement) {
      case 'top':
        x = tCenterX - cardWidth / 2
        y = tY - cardHeight - offset
        break
      case 'top-start':
        x = tX
        y = tY - cardHeight - offset
        break
      case 'top-end':
        x = tX + tW - cardWidth
        y = tY - cardHeight - offset
        break

      case 'bottom':
        x = tCenterX - cardWidth / 2
        y = tY + tH + offset
        break
      case 'bottom-start':
        x = tX
        y = tY + tH + offset
        break
      case 'bottom-end':
        x = tX + tW - cardWidth
        y = tY + tH + offset
        break

      case 'left':
        x = tX - cardWidth - offset
        y = tCenterY - cardHeight / 2
        break
      case 'left-start':
        x = tX - cardWidth - offset
        y = tY
        break
      case 'left-end':
        x = tX - cardWidth - offset
        y = tY + tH - cardHeight
        break

      case 'right':
        x = tX + tW + offset
        y = tCenterY - cardHeight / 2
        break
      case 'right-start':
        x = tX + tW + offset
        y = tY
        break
      case 'right-end':
        x = tX + tW + offset
        y = tY + tH - cardHeight
        break

      default:
        x = tCenterX - cardWidth / 2
        y = tY + tH + offset
        break
    }

    // Calculate overflow beyond viewport
    const overflowLeft = Math.max(0, edgePadding - x)
    const overflowRight = Math.max(0, x + cardWidth - (vw - edgePadding))
    const overflowTop = Math.max(0, edgePadding - y)
    const overflowBottom = Math.max(0, y + cardHeight - (vh - edgePadding))

    const totalOverflow = overflowLeft + overflowRight + overflowTop + overflowBottom

    if (totalOverflow < bestOverflow) {
      bestOverflow = totalOverflow
      bestPlacement = placement
      bestX = x
      bestY = y
      if (totalOverflow === 0) break
    }
  }

  // Shift & Clamp to viewport edges if enabled
  let finalX = bestX
  let finalY = bestY

  if (autoShift) {
    finalX = Math.max(edgePadding, Math.min(vw - cardWidth - edgePadding, finalX))
    finalY = Math.max(edgePadding, Math.min(vh - cardHeight - edgePadding, finalY))
  }

  // Determine pointer arrow position
  const mainSide = bestPlacement.split('-')[0]!
  const arrowPlacement = ARROW_OPPOSITE_MAP[mainSide] ?? 'top'

  let arrowX: number | undefined
  let arrowY: number | undefined

  if (mainSide === 'top' || mainSide === 'bottom') {
    // Arrow is horizontal: points at target center, clamped to card body
    const idealArrowX = tCenterX - finalX
    const minArrowX = 16 + arrowSize
    const maxArrowX = cardWidth - 16 - arrowSize
    arrowX = dprRound(Math.max(minArrowX, Math.min(maxArrowX, idealArrowX)))
  } else if (mainSide === 'left' || mainSide === 'right') {
    // Arrow is vertical: points at target center, clamped to card body
    const idealArrowY = tCenterY - finalY
    const minArrowY = 16 + arrowSize
    const maxArrowY = cardHeight - 16 - arrowSize
    arrowY = dprRound(Math.max(minArrowY, Math.min(maxArrowY, idealArrowY)))
  }

  return {
    x: dprRound(finalX),
    y: dprRound(finalY),
    placement: bestPlacement,
    arrowX,
    arrowY,
    arrowPlacement,
    maxHeight: vh - edgePadding * 2,
    maxWidth: vw - edgePadding * 2,
  }
}
