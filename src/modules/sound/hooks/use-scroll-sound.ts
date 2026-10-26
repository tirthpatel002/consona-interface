import { useCallback, useEffect, useRef, useState } from 'react'
import { useSound } from '../context'
import type { SoundEmphasis, SoundName } from '../engine/types'

export interface UseScrollSoundOptions {
  /** Sound cue identifier to modulate (default: 'toggle'). */
  cue?: SoundName
  /** Sound variant identifier (default: 'latch', options: 'latch', 'switch', 'mechanical', 'default'). */
  variant?: string
  /** Sound dynamic emphasis level ('subtle' | 'normal' | 'strong'). */
  emphasis?: SoundEmphasis
  /** Base master volume multiplier (0.0 to 1.0). */
  volume?: number
  /** Distance in pixels scrolled per acoustic latch step/click (default: 28px). */
  stepDistance?: number
  /** Minimum velocity threshold (px/ms) required to trigger audio (default: 0.03). */
  minVelocity?: number
  /** Velocity in px/ms mapped to maximum emphasis & speed scaling (default: 1.8). */
  maxVelocity?: number
  /** Idle timeout in milliseconds after which scroll state resets (default: 90ms). */
  idleTimeoutMs?: number
  /** Whether scroll sound is disabled. */
  disabled?: boolean
}

export interface UseScrollSoundReturn {
  state: {
    /** Whether the user is actively scrolling. */
    isScrolling: boolean
    /** Real-time smoothed scroll velocity magnitude (px/ms). */
    velocity: number
    /** Normalized speed factor (0.0 to 1.0+). */
    normalizedSpeed: number
    /** Total accumulated scrolled distance in pixels. */
    scrolledDistance: number
    /** Current vertical scroll direction. */
    direction: 'up' | 'down' | 'none'
    /** Current vertical scroll progress ratio (0.0 at top to 1.0 at bottom). */
    scrollProgress: number
    /** Total step latch count triggered during scroll session. */
    latchCount: number
  }
  actions: {
    /** Container ref callback to attach directly to a scrollable HTML element. */
    containerRef: (node: HTMLElement | null) => void
    /** Manual scroll event handler for virtualized or custom lists. */
    onScroll: (e: React.UIEvent<HTMLElement> | Event) => void
    /** Resets distance and latch counters. */
    reset: () => void
  }
  helpers: {
    /** Whether scroll sound tracking is active and ready. */
    isActive: boolean
  }
  ariaProps: {
    /** Indicates active user scrolling feedback. */
    'data-sound-scrolling': boolean
  }

  // Top-level direct accessors
  isScrolling: boolean
  velocity: number
  normalizedSpeed: number
  scrolledDistance: number
  direction: 'up' | 'down' | 'none'
  scrollProgress: number
  latchCount: number
  containerRef: (node: HTMLElement | null) => void
  onScroll: (e: React.UIEvent<HTMLElement> | Event) => void
  reset: () => void
}

/**
 * Headless React hook for physics-aware scroll acoustic feedback (Type B Contract).
 * Calculates scroll distance, speed, direction, and velocity in real-time,
 * dynamically modulating 'toggle' (latch/switch) clicks based on scrolled distance intervals and speed.
 */
export function useScrollSound(
  options: UseScrollSoundOptions = {}
): UseScrollSoundReturn {
  const {
    cue = 'toggle',
    variant = 'latch',
    emphasis = 'normal',
    volume = 1,
    stepDistance = 28,
    minVelocity = 0.03,
    maxVelocity = 1.8,
    idleTimeoutMs = 90,
    disabled = false,
  } = options

  const { play, enabled, isMuted } = useSound()

  const [isScrolling, setIsScrolling] = useState(false)
  const [velocity, setVelocity] = useState(0)
  const [normalizedSpeed, setNormalizedSpeed] = useState(0)
  const [direction, setDirection] = useState<'up' | 'down' | 'none'>('none')
  const [scrollProgress, setScrollProgress] = useState(0)
  const [scrolledDistance, setScrolledDistance] = useState(0)
  const [latchCount, setLatchCount] = useState(0)

  const optionsRef = useRef(options)
  optionsRef.current = options

  const playRef = useRef(play)
  playRef.current = play

  const enabledRef = useRef({ enabled, isMuted })
  enabledRef.current = { enabled, isMuted }

  const lastScrollTopRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const accumulatedDeltaRef = useRef<number>(0)
  const totalDistanceRef = useRef<number>(0)
  const totalLatchesRef = useRef<number>(0)
  const idleTimerRef = useRef<any>(null)
  const elementRef = useRef<HTMLElement | null>(null)
  const smoothedSpeedRef = useRef<number>(0)
  const rafIdRef = useRef<number | null>(null)

  const handleScrollDirect = useCallback((target: HTMLElement | Window) => {
    const opts = optionsRef.current
    const eng = enabledRef.current
    if (opts.disabled || !eng.enabled || eng.isMuted) return

    const now = performance.now()
    const isWin = typeof Window !== 'undefined' && target instanceof Window
    const scrollTop = isWin
      ? window.scrollY || document.documentElement.scrollTop
      : (target as HTMLElement).scrollTop
    const scrollHeight = isWin
      ? document.documentElement.scrollHeight - window.innerHeight
      : (target as HTMLElement).scrollHeight - (target as HTMLElement).clientHeight

    const progress = scrollHeight > 0 ? Math.max(0, Math.min(1, scrollTop / scrollHeight)) : 0

    const dt = Math.max(1, now - (lastTimeRef.current || now))
    const dy = scrollTop - lastScrollTopRef.current
    const absDy = Math.abs(dy)
    const currentDirection = dy > 0 ? 'down' : dy < 0 ? 'up' : 'none'

    const rawVelocity = absDy / dt // px/ms
    lastScrollTopRef.current = scrollTop
    lastTimeRef.current = now

    // Smooth velocity
    const alpha = 0.35
    smoothedSpeedRef.current = smoothedSpeedRef.current * (1 - alpha) + rawVelocity * alpha
    const currentSpeed = smoothedSpeedRef.current

    const minVel = opts.minVelocity ?? 0.03
    const maxVel = opts.maxVelocity ?? 1.8
    const norm = Math.min(1.5, currentSpeed / maxVel)

    totalDistanceRef.current += absDy
    accumulatedDeltaRef.current += absDy

    const stepDist = Math.max(8, opts.stepDistance ?? 28)

    // Trigger toggle latch click every stepDistance pixels
    if (accumulatedDeltaRef.current >= stepDist && currentSpeed >= minVel) {
      const stepsToFire = Math.floor(accumulatedDeltaRef.current / stepDist)
      accumulatedDeltaRef.current %= stepDist
      totalLatchesRef.current += stepsToFire

      // Modulate emphasis and volume based on scroll speed
      const dynamicEmphasis: SoundEmphasis =
        norm > 0.85 ? 'strong' : norm > 0.3 ? 'normal' : 'subtle'
      const dynamicVol = Math.min(1, 0.4 + norm * 0.6) * (opts.volume ?? 1)

      playRef.current(opts.cue ?? 'toggle', {
        variant: opts.variant ?? 'latch',
        emphasis: opts.emphasis ?? dynamicEmphasis,
        volume: dynamicVol,
        context: {
          inputMethod: 'mouse',
          cadenceDeltaMs: Math.max(20, Math.min(200, 1000 / (currentSpeed * 30 + 1))),
        },
      })
    }

    // Schedule throttled visual state updates via rAF
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null
        setVelocity(currentSpeed)
        setNormalizedSpeed(norm)
        setScrollProgress(progress)
        setScrolledDistance(Math.round(totalDistanceRef.current))
        setLatchCount(totalLatchesRef.current)
        if (currentDirection !== 'none') {
          setDirection(currentDirection)
        }
      })
    }

    if (currentSpeed >= minVel) {
      setIsScrolling(true)

      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
      idleTimerRef.current = setTimeout(() => {
        setIsScrolling(false)
        setVelocity(0)
        setNormalizedSpeed(0)
        smoothedSpeedRef.current = 0
      }, opts.idleTimeoutMs ?? 90)
    }
  }, [])

  const onScroll = useCallback(
    (e: React.UIEvent<HTMLElement> | Event) => {
      handleScrollDirect(e.currentTarget as HTMLElement)
    },
    [handleScrollDirect]
  )

  const containerRef = useCallback(
    (node: HTMLElement | null) => {
      if (elementRef.current) {
        elementRef.current.removeEventListener('scroll', onScroll as any)
      }
      elementRef.current = node
      if (node) {
        node.addEventListener('scroll', onScroll as any, { passive: true })
        lastScrollTopRef.current = node.scrollTop
        lastTimeRef.current = performance.now()
      }
    },
    [onScroll]
  )

  const reset = useCallback(() => {
    totalDistanceRef.current = 0
    totalLatchesRef.current = 0
    accumulatedDeltaRef.current = 0
    setScrolledDistance(0)
    setLatchCount(0)
  }, [])

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    }
  }, [])

  const isActive = enabled && !isMuted && !disabled

  const state = {
    isScrolling,
    velocity,
    normalizedSpeed,
    scrolledDistance,
    direction,
    scrollProgress,
    latchCount,
  }

  const actions = {
    containerRef,
    onScroll,
    reset,
  }

  const helpers = {
    isActive,
  }

  const ariaProps = {
    'data-sound-scrolling': isScrolling,
  }

  return {
    state,
    actions,
    helpers,
    ariaProps,

    // Direct accessors for ergonomic destructuring
    isScrolling,
    velocity,
    normalizedSpeed,
    scrolledDistance,
    direction,
    scrollProgress,
    latchCount,
    containerRef,
    onScroll,
    reset,
  }
}
