import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSound } from '../context'
import type {
  SoundContinuousOptions,
  SoundEmphasis,
  SoundHandle,
  SoundName,
} from '../engine/types'

export interface UseContinuousSoundOptions {
  /** Continuous sound cue identifier (e.g. 'loading-hum', 'radar-pulse', 'beam-laser', 'focus-noise'). */
  cue?: SoundName
  /** Sound variant identifier. */
  variant?: string
  /** Sound emphasis dynamic level. */
  emphasis?: SoundEmphasis
  /** Volume level multiplier (0.0 to 1.0). */
  volume?: number
  /** Time to live in milliseconds. Automatically executes release fade-out when elapsed. */
  ttl?: number
  /** Release fade-out duration in seconds when stopped. */
  release?: number
  /** Whether to automatically start playing on component mount. */
  autoStart?: boolean
  /** Whether sound playback is disabled. */
  disabled?: boolean
  /** Callback fired when the continuous sound starts playing. */
  onStart?: () => void
  /** Callback fired when the continuous sound stops playing (via stop() or TTL timeout). */
  onStop?: () => void
}

export interface UseContinuousSoundReturn {
  state: {
    /** Whether this continuous voice is currently active and synthesizing. */
    isPlaying: boolean
    /** Effective sound cue identifier. */
    cue: SoundName
    /** Effective sound variant if specified. */
    variant?: string
    /** Unique active voice instance ID if playing. */
    voiceId?: string
    /** Number of total active continuous sounds in the sound engine. */
    activeCount: number
  }
  actions: {
    /** Starts the continuous sound loop. Returns the live SoundHandle or null. */
    start: (overrideOptions?: SoundContinuousOptions) => SoundHandle | null
    /** Gracefully stops the sound with a smooth release fade-out curve. */
    stop: (releaseDuration?: number) => void
    /** Toggles playing state between start and stop. */
    toggle: () => void
    /** Dynamically modulates volume while active (0.0 to 1.0). */
    setVolume: (volume: number) => void
  }
  helpers: {
    /** Whether sound engine is enabled and active. */
    isReady: boolean
    /** Effective sound cue name. */
    cueName: string
  }
  ariaProps: {
    /** Indicates ongoing audio synthesis activity. */
    'aria-busy': boolean
    /** Data attribute signaling continuous sound loop state. */
    'data-sound-loop': boolean
    /** Sound cue identifier. */
    'data-sound-cue': string
  }
  /** Live SoundHandle reference if currently playing. */
  handle: SoundHandle | null
}

/**
 * Headless React hook for managing long, infinite, sustained, and looping continuous sound cues (Type B Contract).
 * Automatically cleans up and stops audio synthesis on component unmount to prevent orphaned Web Audio voices.
 */
export function useContinuousSound(
  options: UseContinuousSoundOptions = {}
): UseContinuousSoundReturn {
  const {
    cue = 'loading-hum',
    variant,
    emphasis = 'normal',
    volume = 1,
    ttl,
    release,
    autoStart = false,
    disabled = false,
    onStart,
    onStop,
  } = options

  const { start: engineStart, stop: engineStop, activeContinuousCount, enabled, isMuted } = useSound()
  const [isPlaying, setIsPlaying] = useState(false)
  const [voiceId, setVoiceId] = useState<string | undefined>(undefined)
  const handleRef = useRef<SoundHandle | null>(null)

  const stop = useCallback(
    (releaseDuration?: number) => {
      if (handleRef.current) {
        handleRef.current.stop(releaseDuration ?? release)
        handleRef.current = null
      } else {
        engineStop(cue, releaseDuration ?? release)
      }
      setIsPlaying(false)
      setVoiceId(undefined)
      onStop?.()
    },
    [engineStop, cue, release, onStop]
  )

  const start = useCallback(
    (overrideOptions?: SoundContinuousOptions): SoundHandle | null => {
      if (disabled || !enabled || isMuted) return null

      // If already playing, stop previous instance first
      if (handleRef.current) {
        handleRef.current.stop(0.05)
      }

      const handle = engineStart(cue, {
        variant,
        emphasis,
        volume,
        ttl,
        release,
        ...overrideOptions,
        onEnded: () => {
          setIsPlaying(false)
          setVoiceId(undefined)
          handleRef.current = null
          overrideOptions?.onEnded?.()
          onStop?.()
        },
      })

      if (handle) {
        handleRef.current = handle
        setIsPlaying(true)
        setVoiceId(handle.id)
        onStart?.()
      }

      return handle
    },
    [disabled, enabled, isMuted, engineStart, cue, variant, emphasis, volume, ttl, release, onStart, onStop]
  )

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop()
    } else {
      start()
    }
  }, [isPlaying, stop, start])

  const setVolume = useCallback((vol: number) => {
    handleRef.current?.setVolume(vol)
  }, [])

  // Auto-start on mount if requested
  useEffect(() => {
    if (autoStart && !disabled) {
      start()
    }
    return () => {
      if (handleRef.current) {
        handleRef.current.stop(0.04)
        handleRef.current = null
      }
    }
  }, [autoStart, disabled, start])

  const isReady = enabled && !isMuted && !disabled

  return useMemo(
    () => ({
      state: {
        isPlaying,
        cue,
        variant,
        voiceId,
        activeCount: activeContinuousCount,
      },
      actions: {
        start,
        stop,
        toggle,
        setVolume,
      },
      helpers: {
        isReady,
        cueName: cue,
      },
      ariaProps: {
        'aria-busy': isPlaying,
        'data-sound-loop': isPlaying,
        'data-sound-cue': cue,
      },
      handle: handleRef.current,
    }),
    [isPlaying, cue, variant, voiceId, activeContinuousCount, start, stop, toggle, setVolume, isReady]
  )
}

