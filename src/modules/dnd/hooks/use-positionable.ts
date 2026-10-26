/**
 * @file use-positionable.ts
 * Type B Headless Hook: usePositionable()
 * Coordinates freeform 2D spatial positioning with boundary clamping, magnetic grid snapping,
 * axis locking, and integrated drag audio synthesis.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  BoundaryConstraints,
  ClientRectangle,
  Coordinates,
  DragAxis,
} from '../engine/types'
import { useDragSound, type UseDragSoundOptions, type UseDragSoundReturn } from '../../sound'

export interface UsePositionableOptions {
  /** Initial (x, y) coordinates in pixels. Default: { x: 0, y: 0 } */
  initialPosition?: Coordinates
  /** Z-index layer depth. Default: 1000 */
  zIndex?: number
  /** Boundary clamping container, padding, and viewport constraints. */
  boundaries?: BoundaryConstraints
  /** Constrained movement axis ('both' | 'horizontal' | 'vertical' | 'x' | 'y'). Default: 'both' */
  axis?: DragAxis
  /** Magnetic snap grid interval in pixels (e.g. 16 or [16, 16]). */
  gridSize?: number | [number, number]
  /** Positioning mode strategy: 'fixed' | 'absolute'. */
  positionMode?: 'fixed' | 'absolute'
  /** Sound synthesis feedback options or boolean flag. Default: true */
  sound?: boolean | UseDragSoundOptions
  /** Callback fired when position updates. */
  onPositionChange?: (position: Coordinates) => void
  /** Callback fired when drag begins. */
  onDragStart?: () => void
  /** Callback fired when drag concludes. */
  onDragEnd?: () => void
  /** Whether repositioning is disabled. */
  disabled?: boolean
  /** CSS selector or element for the drag handle affordance. */
  dragHandle?: string | HTMLElement | null
  /** CSS selector(s) to ignore pointer events on (e.g. buttons, inputs). */
  ignoreDragSelector?: string | string[]
  /** If true, item starts in document flow until first dragged. */
  startInFlow?: boolean
  /** Active cursor style when hovering/dragging. */
  cursor?: string
}

export interface UsePositionableState {
  position: Coordinates
  isDragging: boolean
  hasBeenDragged: boolean
  isAbsolute: boolean
}

export interface UsePositionableActions {
  setPosition: (pos: Coordinates) => void
  resetPosition: () => void
}

export interface UsePositionableHelpers {
  constrainPosition: (x: number, y: number) => Coordinates
  snapToGrid: (x: number, y: number) => Coordinates
  dragSound: UseDragSoundReturn
}

export interface UsePositionableAriaProps {
  role: string
  'aria-grabbed': boolean
  'aria-disabled': boolean
}

export interface UsePositionableReturn {
  containerRef: React.RefObject<HTMLDivElement | null>
  position: Coordinates
  isDragging: boolean
  hasBeenDragged: boolean
  handlePointerDown: (e: React.PointerEvent<HTMLDivElement>) => void
  containerStyle: React.CSSProperties
  /** Strict Type B Hook contract parts */
  state: UsePositionableState
  actions: UsePositionableActions
  helpers: UsePositionableHelpers
  ariaProps: UsePositionableAriaProps
}

export function usePositionable(options: UsePositionableOptions = {}): UsePositionableReturn {
  const {
    initialPosition = { x: 0, y: 0 },
    zIndex = 1000,
    boundaries = {},
    axis = 'both',
    gridSize,
    positionMode,
    sound = true,
    onPositionChange,
    onDragStart,
    onDragEnd,
    disabled = false,
    dragHandle = null,
    ignoreDragSelector = null,
    startInFlow = false,
    cursor = 'move',
  } = options

  const containerRef = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState<Coordinates>(initialPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [hasBeenDragged, setHasBeenDragged] = useState(false)

  const dragSound = useDragSound({
    cue: 'navigate',
    variant: 'slide',
    pickCue: { cue: 'open', variant: 'slide' },
    dropCue: 'release',
    ...(typeof sound === 'object' ? sound : {}),
    disabled: sound === false,
  })

  const dragOffsetRef = useRef<Coordinates>({ x: 0, y: 0 })
  const dragStartPosRef = useRef<Coordinates>({ x: 0, y: 0 })
  const isDraggingRef = useRef(false)
  const hasInitializedRef = useRef(false)

  const {
    container: boundaryContainer = null,
    padding: boundaryPadding = { top: 0, right: 0, bottom: 0, left: 0 },
    constrainToViewport = false,
  } = boundaries

  const getContainerElement = useCallback((): HTMLElement | null => {
    if (!boundaryContainer || typeof document === 'undefined') return null
    if (typeof boundaryContainer === 'string') {
      const closestMatch = containerRef.current?.closest(boundaryContainer) as HTMLElement | null
      return closestMatch ?? (document.querySelector(boundaryContainer) as HTMLElement | null)
    }
    if (typeof boundaryContainer === 'object' && 'current' in boundaryContainer) {
      return boundaryContainer.current
    }
    if (boundaryContainer instanceof HTMLElement) {
      return boundaryContainer
    }
    return null
  }, [boundaryContainer])

  const isAbsolute = useMemo(() => {
    if (positionMode === 'absolute') return true
    if (positionMode === 'fixed') return false
    return !!boundaryContainer
  }, [positionMode, boundaryContainer])

  const getBoundaryRect = useCallback((): ClientRectangle | null => {
    const containerEl = getContainerElement()
    const padding = {
      left: Math.max(0, boundaryPadding.left || 0),
      top: Math.max(0, boundaryPadding.top || 0),
      right: Math.max(0, boundaryPadding.right || 0),
      bottom: Math.max(0, boundaryPadding.bottom || 0),
    }

    if (containerEl) {
      if (isAbsolute) {
        const width = containerEl.clientWidth || containerEl.getBoundingClientRect().width
        const height = containerEl.clientHeight || containerEl.getBoundingClientRect().height
        return {
          left: padding.left,
          top: padding.top,
          right: Math.max(padding.left, width - padding.right),
          bottom: Math.max(padding.top, height - padding.bottom),
          width,
          height,
        }
      } else {
        const rect = containerEl.getBoundingClientRect()
        return {
          left: rect.left + padding.left,
          top: rect.top + padding.top,
          right: rect.right - padding.right,
          bottom: rect.bottom - padding.bottom,
          width: rect.width,
          height: rect.height,
        }
      }
    }

    if (constrainToViewport && typeof window !== 'undefined') {
      return {
        left: padding.left,
        top: padding.top,
        right: window.innerWidth - padding.right,
        bottom: window.innerHeight - padding.bottom,
        width: window.innerWidth,
        height: window.innerHeight,
      }
    }

    return null
  }, [boundaryPadding, constrainToViewport, getContainerElement, isAbsolute])

  // Snap to magnetic grid
  const snapToGrid = useCallback(
    (x: number, y: number): Coordinates => {
      if (!gridSize) return { x, y }
      const [gx, gy] = Array.isArray(gridSize) ? gridSize : [gridSize, gridSize]
      return {
        x: Math.round(x / gx) * gx,
        y: Math.round(y / gy) * gy,
      }
    },
    [gridSize]
  )

  const constrainPosition = useCallback(
    (rawX: number, rawY: number): Coordinates => {
      const snapped = snapToGrid(rawX, rawY)
      const boundaryRect = getBoundaryRect()
      if (!boundaryRect || !containerRef.current) return snapped

      const el = containerRef.current
      const elWidth = el.offsetWidth
      const elHeight = el.offsetHeight

      const minX = boundaryRect.left
      const maxX = Math.max(minX, boundaryRect.right - elWidth)
      const minY = boundaryRect.top
      const maxY = Math.max(minY, boundaryRect.bottom - elHeight)

      return {
        x: Math.max(minX, Math.min(maxX, snapped.x)),
        y: Math.max(minY, Math.min(maxY, snapped.y)),
      }
    },
    [getBoundaryRect, snapToGrid]
  )

  const shouldIgnoreDrag = useCallback(
    (target: Element): boolean => {
      if (!ignoreDragSelector) return false
      const selectors = Array.isArray(ignoreDragSelector) ? ignoreDragSelector : [ignoreDragSelector]
      return selectors.some((sel) => target.matches(sel) || target.closest(sel))
    },
    [ignoreDragSelector]
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || e.button !== 0) return

      if (shouldIgnoreDrag(e.target as Element)) return

      if (dragHandle) {
        const target = e.target as Element
        if (typeof dragHandle === 'string') {
          if (!target.matches(dragHandle) && !target.closest(dragHandle)) return
        } else if (dragHandle instanceof HTMLElement) {
          if (!dragHandle.contains(target)) return
        }
      }

      e.preventDefault()
      e.stopPropagation()

      if (!containerRef.current) return
      const el = containerRef.current
      const rect = el.getBoundingClientRect()

      let initialX: number
      let initialY: number

      if (isAbsolute) {
        const parent = el.offsetParent || getContainerElement() || el.parentElement
        const parentRect = parent ? parent.getBoundingClientRect() : { left: 0, top: 0 }
        initialX = rect.left - parentRect.left
        initialY = rect.top - parentRect.top
      } else {
        initialX = rect.left
        initialY = rect.top
      }

      dragStartPosRef.current = { x: initialX, y: initialY }

      if (startInFlow && !hasBeenDragged) {
        setPosition({ x: initialX, y: initialY })
        setHasBeenDragged(true)
      }

      const offsetX = e.clientX - rect.left
      const offsetY = e.clientY - rect.top
      dragOffsetRef.current = { x: offsetX, y: offsetY }

      setIsDragging(true)
      isDraggingRef.current = true

      // Start drag sound with pick cue
      dragSound.playPick()
      dragSound.dragProps?.onPointerDown?.(e)

      if (onDragStart) {
        try {
          onDragStart()
        } catch {}
      }

      const handlePointerMove = (moveEvent: PointerEvent) => {
        if (!isDraggingRef.current || !containerRef.current) return

        let rawX: number
        let rawY: number

        if (isAbsolute) {
          const parent = containerRef.current.offsetParent || getContainerElement() || containerRef.current.parentElement
          const parentRect = parent ? parent.getBoundingClientRect() : { left: 0, top: 0 }
          rawX = moveEvent.clientX - parentRect.left - dragOffsetRef.current.x
          rawY = moveEvent.clientY - parentRect.top - dragOffsetRef.current.y
        } else {
          rawX = moveEvent.clientX - dragOffsetRef.current.x
          rawY = moveEvent.clientY - dragOffsetRef.current.y
        }

        // Enforce axis constraints
        if (axis === 'horizontal' || axis === 'x') {
          rawY = dragStartPosRef.current.y
        } else if (axis === 'vertical' || axis === 'y') {
          rawX = dragStartPosRef.current.x
        }

        const constrained = constrainPosition(rawX, rawY)

        if (axis === 'horizontal' || axis === 'x') {
          constrained.y = dragStartPosRef.current.y
        } else if (axis === 'vertical' || axis === 'y') {
          constrained.x = dragStartPosRef.current.x
        }

        setPosition(constrained)

        // Process active motion drag sound
        dragSound.dragProps?.onPointerMove?.(moveEvent as any)

        if (onPositionChange) {
          try {
            onPositionChange(constrained)
          } catch {}
        }
      }

      const handlePointerUp = () => {
        setIsDragging(false)
        isDraggingRef.current = false
        cleanupListenersRef.current = null

        // Drop sound
        dragSound.playDrop()
        dragSound.dragProps?.onPointerUp?.(null as any)

        if (onDragEnd) {
          try {
            onDragEnd()
          } catch {}
        }

        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
        window.removeEventListener('pointercancel', handlePointerUp)
      }

      cleanupListenersRef.current?.()
      cleanupListenersRef.current = () => {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
        window.removeEventListener('pointercancel', handlePointerUp)
      }

      window.addEventListener('pointermove', handlePointerMove, { passive: false })
      window.addEventListener('pointerup', handlePointerUp, { passive: true })
      window.addEventListener('pointercancel', handlePointerUp, { passive: true })
    },
    [
      disabled,
      dragHandle,
      shouldIgnoreDrag,
      isAbsolute,
      getContainerElement,
      startInFlow,
      hasBeenDragged,
      dragSound,
      onDragStart,
      axis,
      constrainPosition,
      onPositionChange,
      onDragEnd,
    ]
  )

  const cleanupListenersRef = useRef<(() => void) | null>(null)
  useEffect(() => {
    return () => {
      cleanupListenersRef.current?.()
    }
  }, [])

  useEffect(() => {
    if (!hasInitializedRef.current) {
      setPosition(initialPosition)
      hasInitializedRef.current = true
    }
  }, [initialPosition])

  const useRelativePositioning = startInFlow && !hasBeenDragged

  const containerStyle: React.CSSProperties = {
    position: useRelativePositioning ? 'relative' : isAbsolute ? 'absolute' : 'fixed',
    ...(useRelativePositioning
      ? {}
      : {
          left: `${position.x}px`,
          top: `${position.y}px`,
        }),
    zIndex,
    cursor: isDragging ? 'grabbing' : dragHandle ? 'default' : cursor,
    touchAction: 'none',
  }

  const ariaProps: UsePositionableAriaProps = {
    role: 'dialog',
    'aria-grabbed': isDragging,
    'aria-disabled': disabled,
  }

  const state: UsePositionableState = {
    position,
    isDragging,
    hasBeenDragged,
    isAbsolute,
  }

  const actions: UsePositionableActions = {
    setPosition,
    resetPosition: () => setPosition(initialPosition),
  }

  const helpers: UsePositionableHelpers = {
    constrainPosition,
    snapToGrid,
    dragSound,
  }

  return {
    containerRef,
    position,
    isDragging,
    hasBeenDragged,
    handlePointerDown,
    containerStyle,
    state,
    actions,
    helpers,
    ariaProps,
  }
}
