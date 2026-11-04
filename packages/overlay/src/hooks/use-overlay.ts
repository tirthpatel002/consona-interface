import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { getCompoundTargetRect, getTargetGeometry, getTargetRect, resolveTargets } from '../engine/geometry'
import { OverlayEngine, type OverlayEngineOptions } from '../engine/overlay-engine'
import { calculateFloatingPosition } from '../engine/positioning'
import { TargetTracker } from '../engine/tracker'
import type {
  CalculatedPosition,
  FloatingPositionOptions,
  OverlayEngineState,
  OverlayPlacement,
  OverlayTargetResolver,
  TargetGeometry,
  TargetRect,
} from '../engine/types'

let defaultSingletonOverlayEngine: OverlayEngine | null = null

export function getGlobalOverlayEngine(): OverlayEngine {
  if (!defaultSingletonOverlayEngine) {
    defaultSingletonOverlayEngine = new OverlayEngine()
  }
  return defaultSingletonOverlayEngine
}

/**
 * Hook to manage an OverlayEngine instance.
 */
export function useOverlayEngine(options?: OverlayEngineOptions): OverlayEngine {
  const engineRef = useRef<OverlayEngine | null>(null)

  if (!engineRef.current) {
    engineRef.current = new OverlayEngine(options)
  }

  useEffect(() => {
    return () => {
      if (engineRef.current && engineRef.current !== defaultSingletonOverlayEngine) {
        engineRef.current.destroy()
      }
    }
  }, [])

  return engineRef.current
}

/**
 * Reactive subscription to OverlayEngine state via useSyncExternalStore.
 */
export function useOverlayState(engine: OverlayEngine): OverlayEngineState {
  return useSyncExternalStore(
    (callback) => engine.subscribe(callback),
    () => engine.getState(),
    () => engine.getState()
  )
}

/**
 * Hook to continuously track single or multi target elements with ResizeObserver and RAF loop.
 */
export function useTargetGeometry(
  target: OverlayTargetResolver | OverlayTargetResolver[] | null | undefined,
  padding: number = 0
): {
  rect: TargetRect | null
  geometry: TargetGeometry | null
  update: () => TargetRect | null
} {
  const [rect, setRect] = useState<TargetRect | null>(() => {
    const list = resolveTargets(target ?? undefined)
    if (list.length === 0) return null
    return list.length === 1 ? getTargetRect(list[0], padding) : getCompoundTargetRect(list, padding)
  })

  const trackersRef = useRef<TargetTracker[]>([])

  const updateAll = () => {
    const list = resolveTargets(target ?? undefined)
    if (list.length === 0) {
      setRect(null)
      return null
    }
    const rects: TargetRect[] = []
    for (const item of list) {
      const r = getTargetRect(item, padding)
      if (r) rects.push(r)
    }
    const compound = rects.length === 0 ? null : rects.length === 1 ? rects[0]! : getCompoundTargetRect(rects, 0)
    setRect(compound)
    return compound
  }

  useEffect(() => {
    for (const t of trackersRef.current) {
      t.destroy()
    }
    trackersRef.current = []

    const list = resolveTargets(target ?? undefined)
    if (list.length === 0) {
      setRect(null)
      return
    }

    const newRects: (TargetRect | null)[] = new Array(list.length).fill(null)
    list.forEach((item, index) => {
      const tracker = new TargetTracker({
        padding,
        onUpdate: (r) => {
          newRects[index] = r
          const valid = newRects.filter((item): item is TargetRect => item !== null)
          const compound = valid.length === 0 ? null : valid.length === 1 ? valid[0]! : getCompoundTargetRect(valid, 0)
          setRect(compound)
        },
      })
      tracker.setTarget(item, padding)
      trackersRef.current.push(tracker)
    })

    return () => {
      for (const t of trackersRef.current) {
        t.destroy()
      }
      trackersRef.current = []
    }
  }, [target, padding])

  const geometry = useMemo(() => {
    return rect ? getTargetGeometry(rect, 0) : null
  }, [rect])

  return {
    rect,
    geometry,
    update: updateAll,
  }
}

/**
 * Hook to dynamically calculate floating anchor positioning relative to a target element.
 */
export function useFloatingPosition(
  target: OverlayTargetResolver | null | undefined,
  cardDims: { width: number; height: number },
  placement: OverlayPlacement = 'bottom',
  options?: FloatingPositionOptions
): {
  position: CalculatedPosition
  targetRect: TargetRect | null
  update: () => void
} {
  const { rect, update } = useTargetGeometry(target, 0)

  const position = useMemo(() => {
    return calculateFloatingPosition(
      rect,
      cardDims.width,
      cardDims.height,
      placement,
      options
    )
  }, [rect, cardDims.width, cardDims.height, placement, options])

  return {
    position,
    targetRect: rect,
    update,
  }
}

/**
 * Hook to lock body scrolling during modal/spotlight presentation with layout shift compensation.
 */
export function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked || typeof window === 'undefined') return

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    const prevOverflow = document.body.style.overflow
    const prevPaddingRight = document.body.style.paddingRight

    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }

    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.paddingRight = prevPaddingRight
    }
  }, [locked])
}
