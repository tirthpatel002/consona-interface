import { useCallback, useEffect, useRef, useState } from 'react'
import { useSound } from '../context'
import type { SoundEmphasis, SoundName } from '../engine/types'

export type DragCueOption =
  | SoundName
  | {
      cue: SoundName
      variant?: string
      emphasis?: SoundEmphasis
      volume?: number
    }

export interface UseDragSoundOptions {
  /** Sound cue identifier for continuous drag movement (default: 'navigate'). */
  cue?: SoundName
  /** Sound variant for drag movement (default: 'slide', options: 'slide', 'swipe', 'whoosh', 'default'). */
  variant?: string
  /** Sound dynamic emphasis level ('subtle' | 'normal' | 'strong'). */
  emphasis?: SoundEmphasis
  /** Base master volume multiplier (0.0 to 1.0). */
  volume?: number
  /** Distance in pixels dragged between acoustic movement strides (default: 36px). */
  stepDistance?: number
  /** Minimum velocity threshold (px/ms) required to trigger drag audio (default: 0.02). */
  minVelocity?: number
  /** Velocity in px/ms mapped to maximum emphasis & speed scaling (default: 1.5). */
  maxVelocity?: number
  /** Whether to dynamically pan audio in stereo (-1.0 to 1.0) based on pointer horizontal position (default: true). */
  spatialPanning?: boolean

  /**
   * Sound cue played when picking up / initiating drag (default: { cue: 'open', variant: 'slide' }).
   * Set to false to disable pickup sound.
   */
  pickCue?: DragCueOption | false
  /**
   * Discrete one-shot sound cue fired on pointer drop/release (default: 'release').
   * Set to false to disable drop sound.
   */
  dropCue?: DragCueOption | false
  /**
   * Sound cue played when a drag & drop target resolves successfully (default: { cue: 'success', variant: 'harmonic' }).
   */
  successCue?: DragCueOption
  /**
   * Sound cue played when a drag & drop operation fails or is rejected (default: { cue: 'error', variant: 'buzz' }).
   */
  errorCue?: DragCueOption
  /**
   * Sound cue played when items are reordered, swapped, or shuffled (default: { cue: 'navigate', variant: 'swipe' }).
   */
  shuffleCue?: DragCueOption

  /** Whether drag sound is disabled. */
  disabled?: boolean
}

export interface DragPosition {
  x: number
  y: number
  dx: number
  dy: number
  distance: number
}

export interface UseDragSoundReturn {
  state: {
    /** Whether a drag interaction is actively occurring. */
    isDragging: boolean
    /** Current smoothed drag velocity magnitude (px/ms). */
    dragSpeed: number
    /** Drag displacement coordinates and Euclidean distance. */
    dragPosition: DragPosition
    /** Number of whoosh / slide stride triggers during current drag session. */
    dragCount: number
  }
  actions: {
    /** Triggers the motion stride sound cue during continuous dragging. */
    playStride: (override?: DragCueOption) => void
    /** Triggers the pick-up sound cue. */
    playPick: (override?: DragCueOption) => void
    /** Triggers the drop sound cue. */
    playDrop: (override?: DragCueOption) => void
    /** Triggers the success sound cue for valid drop zones. */
    playSuccess: (override?: DragCueOption) => void
    /** Triggers the error sound cue for invalid drops / cancellation. */
    playError: (override?: DragCueOption) => void
    /** Triggers the shuffle / reorder sound cue when items swap. */
    playShuffle: (override?: DragCueOption) => void
    /** Resets drag position and stride metrics. */
    reset: () => void
    /** Explicit manual stop helper. */
    stop: () => void
  }
  helpers: {
    /** Whether drag sound is ready to synthesize. */
    isActive: boolean
  }
  ariaProps: {
    /** Indicates active dragging feedback. */
    'data-sound-dragging': boolean
  }
  /** Pointer event props to spread onto any draggable element. */
  dragProps: {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => void
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => void
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => void
    onPointerCancel: (e: React.PointerEvent<HTMLElement>) => void
  }

  // Direct top-level accessors
  isDragging: boolean
  dragSpeed: number
  dragPosition: DragPosition
  dragCount: number
  playStride: (override?: DragCueOption) => void
  playPick: (override?: DragCueOption) => void
  playDrop: (override?: DragCueOption) => void
  playSuccess: (override?: DragCueOption) => void
  playError: (override?: DragCueOption) => void
  playShuffle: (override?: DragCueOption) => void
  reset: () => void
  stop: () => void
}

function parseCue(
  opt: DragCueOption | false | undefined,
  defaultCue: SoundName,
  defaultVariant?: string
): { cue: SoundName; variant?: string; emphasis?: SoundEmphasis; volume?: number } | null {
  if (opt === false) return null
  if (!opt) return { cue: defaultCue, variant: defaultVariant }
  if (typeof opt === 'string') {
    if (opt.includes(':')) {
      const [c, v] = opt.split(':')
      return { cue: c as SoundName, variant: v }
    }
    return { cue: opt as SoundName, variant: defaultVariant }
  }
  return {
    cue: opt.cue || defaultCue,
    variant: opt.variant !== undefined ? opt.variant : defaultVariant,
    emphasis: opt.emphasis,
    volume: opt.volume,
  }
}

/**
 * Headless React hook for physical, velocity-aware drag audio synthesis.
 * Calculates 2D Euclidean distance, speed, and spatial position during active dragging,
 * dynamically synthesizing 'navigate' ('slide' by default) strides as the item is dragged
 * across screen space, and providing intuitive event triggers for pick (open-slide),
 * drop (release), success (success-harmonic), error (error-buzz), and shuffle (navigate-swipe).
 */
export function useDragSound(
  options: UseDragSoundOptions = {}
): UseDragSoundReturn {
  const {
    cue = 'navigate',
    variant = 'slide',
    emphasis = 'normal',
    volume = 1,
    stepDistance = 44,
    minVelocity = 0.02,
    maxVelocity = 1.5,
    spatialPanning = true,
    pickCue = { cue: 'open', variant: 'slide' },
    dropCue = 'release',
    successCue = { cue: 'success', variant: 'harmonic' },
    errorCue = { cue: 'error', variant: 'buzz' },
    shuffleCue = { cue: 'navigate', variant: 'swipe' },
    disabled = false,
  } = options

  const { play, enabled, isMuted } = useSound()

  const [isDragging, setIsDragging] = useState(false)
  const [dragSpeed, setDragSpeed] = useState(0)
  const [dragCount, setDragCount] = useState(0)
  const [dragPosition, setDragPosition] = useState<DragPosition>({
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    distance: 0,
  })

  const optionsRef = useRef(options)
  optionsRef.current = options

  const playRef = useRef(play)
  playRef.current = play

  const enabledRef = useRef({ enabled, isMuted })
  enabledRef.current = { enabled, isMuted }

  const startCoordRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const lastCoordRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 })
  const accumulatedDeltaRef = useRef<number>(0)
  const totalDistanceRef = useRef<number>(0)
  const totalDragsRef = useRef<number>(0)
  const smoothedSpeedRef = useRef<number>(0)
  const isDraggingRef = useRef(false)
  const rafIdRef = useRef<number | null>(null)

  const triggerCue = useCallback((resolved: { cue: SoundName; variant?: string; emphasis?: SoundEmphasis; volume?: number } | null, fallbackEmphasis?: SoundEmphasis) => {
    if (!resolved) return
    const eng = enabledRef.current
    const opts = optionsRef.current
    if (opts.disabled || !eng.enabled || eng.isMuted) return

    playRef.current(resolved.cue, {
      variant: resolved.variant,
      emphasis: resolved.emphasis ?? fallbackEmphasis ?? opts.emphasis ?? 'normal',
      volume: resolved.volume ?? opts.volume ?? 1,
    })
  }, [])

  const playStride = useCallback((override?: DragCueOption) => {
    const opts = optionsRef.current
    const target = parseCue(override ?? { cue: opts.cue ?? 'navigate', variant: opts.variant ?? 'slide', emphasis: opts.emphasis ?? 'normal', volume: opts.volume ?? 1 }, 'navigate', 'slide')
    triggerCue(target, 'normal')
  }, [triggerCue])

  const playPick = useCallback((override?: DragCueOption) => {
    const target = parseCue(override ?? optionsRef.current.pickCue, 'open', 'slide')
    triggerCue(target, 'normal')
  }, [triggerCue])

  const playDrop = useCallback((override?: DragCueOption) => {
    const target = parseCue(override ?? optionsRef.current.dropCue, 'release')
    triggerCue(target, 'normal')
  }, [triggerCue])

  const playSuccess = useCallback((override?: DragCueOption) => {
    const target = parseCue(override ?? optionsRef.current.successCue, 'success', 'harmonic')
    triggerCue(target, 'normal')
  }, [triggerCue])

  const playError = useCallback((override?: DragCueOption) => {
    const target = parseCue(override ?? optionsRef.current.errorCue, 'error', 'buzz')
    triggerCue(target, 'strong')
  }, [triggerCue])

  const playShuffle = useCallback((override?: DragCueOption) => {
    const target = parseCue(override ?? optionsRef.current.shuffleCue, 'navigate', 'swipe')
    triggerCue(target, 'normal')
  }, [triggerCue])

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const opts = optionsRef.current
    const eng = enabledRef.current
    if (opts.disabled) return

    isDraggingRef.current = true
    setIsDragging(true)

    const startX = e.clientX
    const startY = e.clientY
    startCoordRef.current = { x: startX, y: startY }
    lastCoordRef.current = { x: startX, y: startY, time: performance.now() }
    accumulatedDeltaRef.current = 0
    totalDistanceRef.current = 0
    totalDragsRef.current = 0
    smoothedSpeedRef.current = 0

    setDragPosition({
      x: startX,
      y: startY,
      dx: 0,
      dy: 0,
      distance: 0,
    })
    setDragCount(0)

    // Play pick sound (open-slide by default)
    if (opts.pickCue !== false && eng.enabled && !eng.isMuted) {
      const pickResolved = parseCue(opts.pickCue, 'open', 'slide')
      if (pickResolved) {
        playRef.current(pickResolved.cue, {
          variant: pickResolved.variant,
          emphasis: pickResolved.emphasis ?? 'subtle',
          volume: (pickResolved.volume ?? 1) * (opts.volume ?? 1),
        })
      }
    }
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (!isDraggingRef.current) return
    const opts = optionsRef.current
    const eng = enabledRef.current
    if (opts.disabled) return

    const now = performance.now()
    const currentX = e.clientX
    const currentY = e.clientY
    const dt = Math.max(1, now - (lastCoordRef.current.time || now))

    const stepDx = currentX - lastCoordRef.current.x
    const stepDy = currentY - lastCoordRef.current.y
    const stepDist = Math.sqrt(stepDx * stepDx + stepDy * stepDy)
    const rawSpeed = stepDist / dt // px/ms

    const totalDx = currentX - startCoordRef.current.x
    const totalDy = currentY - startCoordRef.current.y
    const totalDistance = Math.sqrt(totalDx * totalDx + totalDy * totalDy)

    lastCoordRef.current = { x: currentX, y: currentY, time: now }

    const alpha = 0.35
    smoothedSpeedRef.current = smoothedSpeedRef.current * (1 - alpha) + rawSpeed * alpha
    const currentSpeed = smoothedSpeedRef.current

    totalDistanceRef.current = totalDistance
    accumulatedDeltaRef.current += stepDist

    const strideDist = Math.max(12, opts.stepDistance ?? 36)
    const minVel = opts.minVelocity ?? 0.02
    const maxVel = opts.maxVelocity ?? 1.5
    const norm = Math.min(1.5, currentSpeed / maxVel)

    // Trigger navigate:slide (or configured variant) acoustic stride during active dragging
    if (accumulatedDeltaRef.current >= strideDist && currentSpeed >= minVel && eng.enabled && !eng.isMuted) {
      const stepsToFire = Math.floor(accumulatedDeltaRef.current / strideDist)
      accumulatedDeltaRef.current %= strideDist
      totalDragsRef.current += stepsToFire

      const dynamicEmphasis: SoundEmphasis =
        norm > 0.6 ? 'strong' : norm > 0.2 ? 'normal' : 'subtle'
      const dynamicVol = Math.min(0.85, 0.35 + norm * 0.45) * (opts.volume ?? 1)

      playRef.current(opts.cue ?? 'navigate', {
        variant: opts.variant ?? 'slide',
        emphasis: opts.emphasis ?? dynamicEmphasis,
        volume: dynamicVol,
        context: {
          inputMethod: 'mouse',
          cadenceDeltaMs: Math.max(25, Math.min(220, 1000 / (currentSpeed * 28 + 1))),
        },
      })
    }

    // Schedule throttled visual state updates via rAF
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null
        setDragSpeed(currentSpeed)
        setDragPosition({
          x: currentX,
          y: currentY,
          dx: totalDx,
          dy: totalDy,
          distance: totalDistance,
        })
        setDragCount(totalDragsRef.current)
      })
    }
  }, [])

  const endDrag = useCallback(() => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    setIsDragging(false)
    setDragSpeed(0)
    smoothedSpeedRef.current = 0

    const opts = optionsRef.current
    const eng = enabledRef.current
    if (opts.dropCue !== false && !opts.disabled && eng.enabled && !eng.isMuted) {
      const dropResolved = parseCue(opts.dropCue, 'release')
      if (dropResolved) {
        playRef.current(dropResolved.cue, {
          variant: dropResolved.variant,
          emphasis: dropResolved.emphasis ?? opts.emphasis ?? 'normal',
          volume: (dropResolved.volume ?? 1) * (opts.volume ?? 1),
        })
      }
    }
  }, [])

  const reset = useCallback(() => {
    accumulatedDeltaRef.current = 0
    totalDistanceRef.current = 0
    totalDragsRef.current = 0
    setDragPosition({ x: 0, y: 0, dx: 0, dy: 0, distance: 0 })
    setDragSpeed(0)
    setDragCount(0)
    smoothedSpeedRef.current = 0
  }, [])

  const stop = useCallback(() => {
    endDrag()
  }, [endDrag])

  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    }
  }, [])

  const isActive = !optionsRef.current.disabled && enabledRef.current.enabled && !enabledRef.current.isMuted

  const state = {
    isDragging,
    dragSpeed,
    dragPosition,
    dragCount,
  }

  const actions = {
    playStride,
    playPick,
    playDrop,
    playSuccess,
    playError,
    playShuffle,
    reset,
    stop,
  }

  const helpers = {
    isActive,
  }

  const ariaProps = {
    'data-sound-dragging': isDragging,
  }

  return {
    state,
    actions,
    helpers,
    ariaProps,
    dragProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },

    // Direct top-level accessors
    isDragging,
    dragSpeed,
    dragPosition,
    dragCount,
    playPick,
    playDrop,
    playSuccess,
    playError,
    playShuffle,
    playStride,
    reset,
    stop,
  }
}
