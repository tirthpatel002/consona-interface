import { BaseEngine } from '../../../core/engine'
import { getCompoundTargetRect, getTargetGeometry, getTargetRect, resolveTarget } from './geometry'
import { generateCutoutMaskPath, generateMultiCutoutMaskPath } from './mask'
import { calculateFloatingPosition } from './positioning'
import { scrollTargetIntoView } from './tracker'
import type {
  CalculatedPosition,
  CutoutRadius,
  CutoutShapeType,
  FloatingPositionOptions,
  OverlayEngineEventListener,
  OverlayEngineEventMap,
  OverlayEngineState,
  OverlayPlacement,
  OverlayTargetResolver,
  SpotlightOptions,
  TargetGeometry,
  TargetRect,
} from './types'

export interface OverlayEngineOptions {
  defaultPadding?: number
  defaultRadius?: CutoutRadius
  defaultShape?: CutoutShapeType
  enableKeyboard?: boolean
}

export class OverlayEngine extends BaseEngine<OverlayEngineState> {
  private defaultPadding: number
  private defaultRadius: CutoutRadius
  private defaultShape: CutoutShapeType
  private enableKeyboard: boolean
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null
  private destroyed: boolean = false

  constructor(options: OverlayEngineOptions = {}) {
    super({
      activeSpotlight: null,
      activeTargets: [],
      isOpen: false,
    })

    this.defaultPadding = options.defaultPadding ?? 8
    this.defaultRadius = options.defaultRadius ?? 8
    this.defaultShape = options.defaultShape ?? 'rounded-rect'
    this.enableKeyboard = options.enableKeyboard ?? true

    this.setupKeyboardListeners()
  }



  // ─── Spotlight Operations ──────────────────────────────────────────────────────

  public spotlight(
    targetOrOptions: OverlayTargetResolver | OverlayTargetResolver[] | SpotlightOptions
  ): this {
    let options: SpotlightOptions
    if (
      typeof targetOrOptions === 'object' &&
      targetOrOptions !== null &&
      'target' in targetOrOptions &&
      !('current' in targetOrOptions) &&
      !('x' in targetOrOptions && 'y' in targetOrOptions)
    ) {
      options = targetOrOptions as SpotlightOptions
    } else {
      options = {
        target: targetOrOptions as OverlayTargetResolver | OverlayTargetResolver[],
      }
    }

    const targets = Array.isArray(options.target) ? options.target : [options.target]
    const padding = options.padding ?? this.defaultPadding

    const resolvedRects: TargetRect[] = []
    for (const t of targets) {
      const resolved = resolveTarget(t)
      const rect = getTargetRect(resolved, padding)
      if (rect) resolvedRects.push(rect)
    }

    this.setState({
      activeSpotlight: options,
      activeTargets: resolvedRects,
      isOpen: true,
    })

    if (options.scrollIntoView !== false && targets.length > 0 && targets[0]) {
      scrollTargetIntoView(targets[0], { offsetTop: options.scrollMarginTop ?? 80 })
    }

    this.emit('spotlight:change', { spotlight: options, targets: resolvedRects })
    return this
  }

  public clearSpotlight(): void {
    if (!this.state.isOpen && !this.state.activeSpotlight) return

    this.setState({
      activeSpotlight: null,
      activeTargets: [],
      isOpen: false,
    })

    this.emit('spotlight:clear', undefined as any)
  }

  public updateTargets(): TargetRect[] {
    if (!this.state.activeSpotlight) return []

    const targets = Array.isArray(this.state.activeSpotlight.target)
      ? this.state.activeSpotlight.target
      : [this.state.activeSpotlight.target]
    const padding = this.state.activeSpotlight.padding ?? this.defaultPadding

    const resolvedRects: TargetRect[] = []
    for (const t of targets) {
      const resolved = resolveTarget(t)
      const rect = getTargetRect(resolved, padding)
      if (rect) resolvedRects.push(rect)
    }

    this.setState({ activeTargets: resolvedRects })
    this.emit('target:resize', { targets: resolvedRects })
    return resolvedRects
  }

  // ─── Mathematical Utility Proxies ──────────────────────────────────────────────

  public resolve(target: OverlayTargetResolver): Element | TargetRect | null {
    return resolveTarget(target)
  }

  public getRect(target: OverlayTargetResolver, padding?: number): TargetRect | null {
    const resolved = resolveTarget(target)
    return getTargetRect(resolved, padding ?? this.defaultPadding)
  }

  public getGeometry(target: OverlayTargetResolver, padding?: number): TargetGeometry | null {
    const resolved = resolveTarget(target)
    return getTargetGeometry(resolved, padding ?? this.defaultPadding)
  }

  public getCompoundRect(targets: OverlayTargetResolver[], padding?: number): TargetRect | null {
    const resolvedList = targets.map((t) => resolveTarget(t))
    return getCompoundTargetRect(resolvedList, padding ?? this.defaultPadding)
  }

  public calculatePosition(
    targetRect: TargetRect | null | undefined,
    cardWidth: number,
    cardHeight: number,
    placement: OverlayPlacement = 'bottom',
    options?: FloatingPositionOptions
  ): CalculatedPosition {
    return calculateFloatingPosition(targetRect, cardWidth, cardHeight, placement, options)
  }

  public generateMask(
    rect: TargetRect | null,
    radius?: CutoutRadius,
    viewport?: { width: number; height: number },
    shape?: CutoutShapeType
  ): string {
    return generateCutoutMaskPath(rect, radius ?? this.defaultRadius, viewport, shape ?? this.defaultShape)
  }

  public generateMultiMask(
    rects: TargetRect[],
    radius?: CutoutRadius,
    viewport?: { width: number; height: number },
    shape?: CutoutShapeType
  ): string {
    return generateMultiCutoutMaskPath(rects, radius ?? this.defaultRadius, viewport, shape ?? this.defaultShape)
  }

  public scrollIntoView(target: OverlayTargetResolver, offsetTop: number = 80): void {
    scrollTargetIntoView(target, { offsetTop })
  }

  private setupKeyboardListeners(): void {
    if (typeof window === 'undefined' || !this.enableKeyboard) return

    this.keydownHandler = (e: KeyboardEvent) => {
      if (!this.state.isOpen || !this.state.activeSpotlight) return

      if (e.key === 'Escape') {
        const behavior = this.state.activeSpotlight.backdropBehavior ?? 'dismiss'
        if (behavior === 'dismiss') {
          e.preventDefault()
          this.clearSpotlight()
        }
      }
    }

    window.addEventListener('keydown', this.keydownHandler)
  }

  public override destroy(): void {
    if (this.destroyed) return
    this.destroyed = true

    if (this.keydownHandler && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.keydownHandler)
      this.keydownHandler = null
    }

    super.destroy()
  }
}

export function createOverlayEngine(options?: OverlayEngineOptions): OverlayEngine {
  return new OverlayEngine(options)
}
