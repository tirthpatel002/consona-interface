import { getTargetRect, resolveTarget } from './geometry'
import type { OverlayTargetResolver, TargetRect } from './types'

export interface ScrollOptions {
  behavior?: ScrollBehavior
  block?: ScrollLogicalPosition
  inline?: ScrollLogicalPosition
  offsetTop?: number
}

/**
 * Smoothly scroll target element into visible viewport with sticky header offset compensation.
 */
export function scrollTargetIntoView(
  target: OverlayTargetResolver,
  options: ScrollOptions = {}
): void {
  if (typeof window === 'undefined') return
  const resolved = resolveTarget(target)
  if (!resolved || !(resolved instanceof Element)) return

  const {
    behavior = 'smooth',
    block = 'center',
    inline = 'nearest',
    offsetTop = 80,
  } = options

  const rect = resolved.getBoundingClientRect()
  const isInViewport =
    rect.top >= offsetTop &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)

  if (!isInViewport) {
    resolved.scrollIntoView({ behavior, block, inline })
  }
}

export interface TargetTrackerOptions {
  padding?: number
  onUpdate: (rect: TargetRect | null) => void
}

/**
 * Continuous RAF & Multi-Observer Target Tracker.
 */
export class TargetTracker {
  private target: OverlayTargetResolver | null = null
  private padding: number = 0
  private onUpdate: (rect: TargetRect | null) => void
  private rafId: number | null = null
  private resizeObserver: ResizeObserver | null = null
  private isTracking: boolean = false
  private destroyed: boolean = false

  constructor(options: TargetTrackerOptions) {
    this.padding = options.padding ?? 0
    this.onUpdate = options.onUpdate
  }

  public setTarget(target: OverlayTargetResolver | null, padding?: number): void {
    if (this.destroyed) return
    this.target = target
    if (padding !== undefined) this.padding = padding

    this.disconnectObservers()
    this.updateNow()
    this.setupObservers()
    this.startRafLoop(600) // 60fps tracking for 600ms to follow layout animations
  }

  public updateNow(): TargetRect | null {
    if (this.destroyed || !this.target) {
      this.onUpdate(null)
      return null
    }

    const resolved = resolveTarget(this.target)
    const rect = getTargetRect(resolved, this.padding)
    this.onUpdate(rect)
    return rect
  }

  public startRafLoop(durationMs: number = 600): void {
    if (this.destroyed || typeof window === 'undefined') return
    if (this.rafId) cancelAnimationFrame(this.rafId)

    const startTime = performance.now()
    const loop = (time: number) => {
      this.updateNow()
      if (time - startTime < durationMs) {
        this.rafId = requestAnimationFrame(loop)
      } else {
        this.rafId = null
      }
    }
    this.rafId = requestAnimationFrame(loop)
  }

  private setupObservers(): void {
    if (this.destroyed || typeof window === 'undefined' || !this.target) return

    const resolved = resolveTarget(this.target)
    if (resolved && resolved instanceof Element && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateNow()
      })
      this.resizeObserver.observe(resolved)
    }

    if (!this.isTracking) {
      this.isTracking = true
      window.addEventListener('scroll', this.handleScrollOrResize, { capture: true, passive: true })
      window.addEventListener('resize', this.handleScrollOrResize, { passive: true })
    }
  }

  private handleScrollOrResize = () => {
    this.updateNow()
  }

  private disconnectObservers(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
  }

  public destroy(): void {
    if (this.destroyed) return
    this.destroyed = true

    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }

    this.disconnectObservers()

    if (this.isTracking && typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.handleScrollOrResize, { capture: true })
      window.removeEventListener('resize', this.handleScrollOrResize)
      this.isTracking = false
    }
  }
}
