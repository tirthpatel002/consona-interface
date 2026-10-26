/**
 * Pure TypeScript types for Consona Overlay Engine.
 */

export interface ParsedCutoutRadius {
  topLeft: number
  topRight: number
  bottomRight: number
  bottomLeft: number
}

export interface TargetRect {
  top: number
  left: number
  width: number
  height: number
  bottom: number
  right: number
  borderRadius?: ParsedCutoutRadius
  padding?: number
}

export interface TargetGeometry extends TargetRect {
  scrollX: number
  scrollY: number
  viewportWidth: number
  viewportHeight: number
  dpr: number
}

export type OverlayTargetResolver =
  | Element
  | TargetRect
  | { current: Element | null }
  | string
  | (() => Element | null | undefined)
  | { x: number; y: number; width?: number; height?: number }

export type OverlayPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end'
  | 'center'

export type OverlayArrowPlacement = 'top' | 'bottom' | 'left' | 'right'

export interface ArrowPosition {
  x: number
  y: number
  placement: OverlayArrowPlacement
}

export interface CalculatedPosition {
  x: number
  y: number
  placement: OverlayPlacement
  arrowX?: number
  arrowY?: number
  arrowPlacement?: OverlayArrowPlacement
  maxHeight?: number
  maxWidth?: number
}

export type CutoutShapeType = 'rounded-rect' | 'rect' | 'circle' | 'pill'

export type CutoutRadius =
  | 'auto'
  | number
  | [number, number, number, number] // [topLeft, topRight, bottomRight, bottomLeft]
  | { topLeft?: number; topRight?: number; bottomRight?: number; bottomLeft?: number }

export type BackdropBehavior = 'block' | 'dismiss' | 'close' | 'pass-through' | 'next'

export type BackdropVariant = 'cutout' | 'ring' | 'elevation' | 'none'

export interface ViewportDimensions {
  width: number
  height: number
  scrollX: number
  scrollY: number
  safeAreaInsetTop?: number
  safeAreaInsetBottom?: number
  safeAreaInsetLeft?: number
  safeAreaInsetRight?: number
}

export interface SpotlightOptions {
  id?: string
  target: OverlayTargetResolver | OverlayTargetResolver[]
  shape?: CutoutShapeType
  padding?: number
  radius?: CutoutRadius
  variant?: BackdropVariant
  interactive?: boolean
  backdropBlur?: boolean
  backdropBehavior?: BackdropBehavior
  scrollIntoView?: boolean
  scrollMarginTop?: number
  meta?: Record<string, any>
}

export interface FloatingPositionOptions {
  placement?: OverlayPlacement
  offset?: number
  arrowSize?: number
  edgePadding?: number
  autoFlip?: boolean
  flipFallbackPlacements?: OverlayPlacement[]
  autoShift?: boolean
}

export interface OverlayEngineState {
  activeSpotlight: SpotlightOptions | null
  activeTargets: TargetRect[]
  isOpen: boolean
}

export interface OverlayEngineEventMap {
  'spotlight:change': { spotlight: SpotlightOptions | null; targets: TargetRect[] }
  'spotlight:clear': void
  'target:resize': { targets: TargetRect[] }
  'state:change': OverlayEngineState
}

export type OverlayEngineEventListener<T = any> = (data: T) => void
