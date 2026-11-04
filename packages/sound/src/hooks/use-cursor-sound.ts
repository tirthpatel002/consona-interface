import { useCallback, useEffect, useRef, useState } from 'react'
import { useDynamicSound } from './use-dynamic-sound'
import type { SoundEmphasis, SoundName } from '../engine/types'

export interface UseCursorSoundOptions {
  /** Sound cue identifier for cursor atmospheric air (default: 'wind-ambient'). */
  cue?: SoundName
  /** Sound variant for gentle air (default: 'breeze', options: 'breeze', 'gust', 'default'). */
  variant?: string
  /** Sound dynamic emphasis level. */
  emphasis?: SoundEmphasis
  /** Base master volume multiplier (0.0 to 1.0). */
  volume?: number
  /** Whether to dynamically pan audio in stereo (-1.0 to 1.0) based on pointer horizontal position (default: true). */
  spatialPanning?: boolean
  /** Minimum velocity threshold (px/ms) required to trigger sound (default: 0.04). */
  minVelocity?: number
  /** Velocity in px/ms mapped to max modulation (default: 2.0). */
  maxVelocity?: number
  /** Output pitch multiplier range [min, max] based on pointer speed (default: [0.95, 1.3]). */
  pitchRange?: [number, number]
  /** Biquad filter cutoff frequency range [minHz, maxHz] based on pointer speed (default: [500, 2400]). */
  cutoffRange?: [number, number]
  /** Idle timeout in milliseconds before stopping air sound after pointer halts (default: 85ms). */
  idleTimeoutMs?: number
  /** Whether cursor audio tracking is disabled. */
  disabled?: boolean
}

export interface CursorPosition {
  clientX: number
  clientY: number
  normalizedX: number // -1.0 (left) to +1.0 (right)
  normalizedY: number // -1.0 (top) to +1.0 (bottom)
  distanceMoved: number
}

export interface UseCursorSoundReturn {
  state: {
    /** Whether the pointer is actively moving above the velocity threshold. */
    isMoving: boolean
    /** Whether the pointer is hovering inside the target container. */
    isHovering: boolean
    /** Real-time smoothed cursor velocity (px/ms). */
    cursorSpeed: number
    /** Normalized cursor coordinates and accumulated distance. */
    cursorPosition: CursorPosition
  }
  actions: {
    /** Ref callback to attach to a container element. */
    containerRef: (node: HTMLElement | null) => void
    /** Explicit manual stop helper. */
    stop: () => void
  }
  helpers: {
    /** Whether cursor motion tracking is active and ready. */
    isActive: boolean
  }
  ariaProps: {
    /** Indicates active cursor tracking sound feedback. */
    'data-sound-cursor': boolean
  }
  /** Pointer event handlers to spread onto any interactive element. */
  cursorProps: {
    onPointerEnter: (e: React.PointerEvent<HTMLElement>) => void
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => void
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => void
  }

  // Direct top-level accessors
  isMoving: boolean
  isHovering: boolean
  cursorSpeed: number
  cursorPosition: CursorPosition
  containerRef: (node: HTMLElement | null) => void
  stop: () => void
}

/**
 * Headless React hook for interactive pointer motion and atmospheric air breeze modulation (Type B Contract).
 * Calculates cursor speed, trajectory, and container coordinates in real-time,
 * dynamically modulating 'wind-ambient' (breeze) filter cutoff, pitch, volume, and stereo panning.
 */
export function useCursorSound(
  options: UseCursorSoundOptions = {}
): UseCursorSoundReturn {
  const {
    cue = 'wind-ambient',
    variant = 'breeze',
    emphasis = 'normal',
    volume = 1,
    spatialPanning = true,
    minVelocity = 0.04,
    maxVelocity = 2.0,
    pitchRange = [0.95, 1.3],
    cutoffRange = [500, 2400],
    idleTimeoutMs = 85,
    disabled = false,
  } = options

  const dynamicSound = useDynamicSound({
    cue,
    variant,
    emphasis,
    volume,
    disabled,
  })

  const [isHovering, setIsHovering] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [cursorSpeed, setCursorSpeed] = useState(0)
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({
    clientX: 0,
    clientY: 0,
    normalizedX: 0,
    normalizedY: 0,
    distanceMoved: 0,
  })

  const optionsRef = useRef(options)
  optionsRef.current = options

  const actionsRef = useRef(dynamicSound.actions)
  actionsRef.current = dynamicSound.actions

  const isPlayingRef = useRef(dynamicSound.state.isPlaying)
  isPlayingRef.current = dynamicSound.state.isPlaying

  const lastCoordRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 })
  const totalDistanceRef = useRef<number>(0)
  const idleTimerRef = useRef<any>(null)
  const elementRef = useRef<HTMLElement | null>(null)
  const smoothedSpeedRef = useRef(0)
  const rafIdRef = useRef<number | null>(null)

  const handlePointerMovement = useCallback((clientX: number, clientY: number, containerRect?: DOMRect) => {
    const opts = optionsRef.current
    if (opts.disabled) return

    const now = performance.now()
    const dt = Math.max(1, now - (lastCoordRef.current.time || now))
    const dx = clientX - lastCoordRef.current.x
    const dy = clientY - lastCoordRef.current.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const rawSpeed = dist / dt // px/ms

    if (lastCoordRef.current.time > 0) {
      totalDistanceRef.current += dist
    }
    lastCoordRef.current = { x: clientX, y: clientY, time: now }

    const alpha = 0.35
    smoothedSpeedRef.current = smoothedSpeedRef.current * (1 - alpha) + rawSpeed * alpha
    const currentSpeed = smoothedSpeedRef.current

    let normX = 0
    let normY = 0
    if (containerRect && containerRect.width > 0 && containerRect.height > 0) {
      normX = Math.max(-1, Math.min(1, ((clientX - containerRect.left) / containerRect.width) * 2 - 1))
      normY = Math.max(-1, Math.min(1, ((clientY - containerRect.top) / containerRect.height) * 2 - 1))
    } else if (typeof window !== 'undefined') {
      normX = Math.max(-1, Math.min(1, (clientX / window.innerWidth) * 2 - 1))
      normY = Math.max(-1, Math.min(1, (clientY / window.innerHeight) * 2 - 1))
    }

    const minVel = opts.minVelocity ?? 0.04
    const maxVel = opts.maxVelocity ?? 2.0

    if (currentSpeed >= minVel) {
      if (!isPlayingRef.current) {
        actionsRef.current?.start({
          pan: opts.spatialPanning !== false ? normX : 0,
          volume: 0.15,
        })
      }

      const pRange = opts.pitchRange ?? [0.95, 1.3]
      const cRange = opts.cutoffRange ?? [500, 2400]
      const baseVol = opts.volume ?? 1

      const normSpeed = Math.min(1.2, currentSpeed / maxVel)
      const pitch = pRange[0] + (pRange[1] - pRange[0]) * Math.min(1, normSpeed)
      const cutoff = cRange[0] + (cRange[1] - cRange[0]) * Math.min(1, normSpeed)
      const modVolume = Math.min(0.8, 0.25 + normSpeed * 0.55) * baseVol

      actionsRef.current?.setModulation(
        {
          pitch,
          cutoff,
          volume: modVolume,
          pan: opts.spatialPanning !== false ? normX : 0,
        },
        0.03
      )

      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
      idleTimerRef.current = setTimeout(() => {
        setIsMoving(false)
        setCursorSpeed(0)
        smoothedSpeedRef.current = 0
        actionsRef.current?.stop(0.08)
      }, opts.idleTimeoutMs ?? 85)
    }

    // Schedule throttled visual state updates via rAF
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null
        setIsMoving(currentSpeed >= minVel)
        setCursorSpeed(currentSpeed)
        setCursorPosition({
          clientX,
          clientY,
          normalizedX: normX,
          normalizedY: normY,
          distanceMoved: Math.round(totalDistanceRef.current),
        })
      })
    }
  }, [])

  const onPointerEnter = useCallback((e: React.PointerEvent<HTMLElement>) => {
    setIsHovering(true)
    lastCoordRef.current = { x: e.clientX, y: e.clientY, time: performance.now() }
    smoothedSpeedRef.current = 0
  }, [])

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      handlePointerMovement(e.clientX, e.clientY, rect)
    },
    [handlePointerMovement]
  )

  const onPointerLeave = useCallback(() => {
    setIsHovering(false)
    setIsMoving(false)
    setCursorSpeed(0)
    smoothedSpeedRef.current = 0
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    actionsRef.current?.stop(0.08)
  }, [])

  const containerRef = useCallback(
    (node: HTMLElement | null) => {
      if (elementRef.current) {
        elementRef.current.removeEventListener('pointerenter', onPointerEnter as any)
        elementRef.current.removeEventListener('pointermove', onPointerMove as any)
        elementRef.current.removeEventListener('pointerleave', onPointerLeave as any)
      }
      elementRef.current = node
      if (node) {
        node.addEventListener('pointerenter', onPointerEnter as any, { passive: true })
        node.addEventListener('pointermove', onPointerMove as any, { passive: true })
        node.addEventListener('pointerleave', onPointerLeave as any, { passive: true })
      }
    },
    [onPointerEnter, onPointerMove, onPointerLeave]
  )

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
      actionsRef.current?.stop(0.04)
    }
  }, [])

  const isActive = !disabled

  const state = {
    isMoving,
    isHovering,
    cursorSpeed,
    cursorPosition,
  }

  const actions = {
    containerRef,
    stop: dynamicSound.actions.stop,
  }

  const helpers = {
    isActive,
  }

  const ariaProps = {
    'data-sound-cursor': isMoving,
  }

  return {
    state,
    actions,
    helpers,
    ariaProps,
    cursorProps: {
      onPointerEnter,
      onPointerMove,
      onPointerLeave,
    },

    // Direct top-level accessors
    isHovering,
    isMoving,
    cursorSpeed,
    cursorPosition,
    containerRef,
    stop: dynamicSound.actions.stop,
  }
}
