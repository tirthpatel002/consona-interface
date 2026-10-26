import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSound } from '../context'
import type {
  SoundContinuousOptions,
  SoundEmphasis,
  SoundHandle,
  SoundModulationParams,
  SoundName,
} from '../engine/types'

export interface UseDynamicSoundOptions {
  /** Sound cue identifier (default: 'cursor'). */
  cue?: SoundName
  /** Sound variant identifier. */
  variant?: string
  /** Sound emphasis dynamic level. */
  emphasis?: SoundEmphasis
  /** Initial volume level multiplier (0.0 to 1.0). */
  volume?: number
  /** Initial stereo panning position (-1.0 to +1.0). */
  pan?: number
  /** Time to live in milliseconds. */
  ttl?: number
  /** Release fade-out duration in seconds when stopped. */
  release?: number
  /** Whether to automatically start playing on component mount. */
  autoStart?: boolean
  /** Whether sound playback is disabled. */
  disabled?: boolean
  /** Callback fired when the sound starts playing. */
  onStart?: () => void
  /** Callback fired when the sound stops playing. */
  onStop?: () => void
}

export interface UseDynamicSoundReturn {
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
    /** Dynamically adjusts volume level multiplier (0.0 to 1.0). */
    setVolume: (volume: number, rampDuration?: number) => void
    /** Dynamically adjusts pitch multiplier (e.g. 0.5 to 3.0). */
    setPitch: (pitchMultiplier: number, rampDuration?: number) => void
    /** Dynamically adjusts detune in cents (+/- cents). */
    setDetune: (cents: number, rampDuration?: number) => void
    /** Dynamically adjusts filter cutoff frequency in Hertz. */
    setCutoff: (frequencyHz: number, rampDuration?: number) => void
    /** Dynamically adjusts stereo pan position (-1.0 to 1.0). */
    setPan: (pan: number, rampDuration?: number) => void
    /** Dynamically adjusts pulse rate / speed multiplier. */
    setRate: (rateMultiplier: number, rampDuration?: number) => void
    /** Batch modulates multiple audio parameters simultaneously. */
    setModulation: (params: SoundModulationParams, rampDuration?: number) => void
  }
  helpers: {
    /** Whether dynamic sound is ready to synthesize. */
    isReady: boolean
    /** Effective sound cue name. */
    cueName: SoundName
  }
  ariaProps: {
    /** Indicates active parametric sound modulation. */
    'aria-busy': boolean
    /** Data attribute signaling dynamic sound loop active state. */
    'data-sound-dynamic': boolean
    /** Sound cue identifier. */
    'data-sound-cue': string
  }
  /** Live SoundHandle reference if currently playing. */
  handle: SoundHandle | null
}

/**
 * Headless React hook for interactive real-time parametric audio manipulation (Type B Contract).
 * Enables any component to continuously modulate pitch, filter cutoff, stereo pan,
 * pulse cadence, and volume based on physical motion, cursor coordinates, speed, or custom logic.
 */
export function useDynamicSound(
  options: UseDynamicSoundOptions = {}
): UseDynamicSoundReturn {
  const {
    cue = 'wind-ambient',
    variant,
    emphasis = 'normal',
    volume = 1,
    pan = 0,
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

  const optionsRef = useRef(options)
  optionsRef.current = options

  const engineRef = useRef({ engineStart, engineStop, enabled, isMuted })
  engineRef.current = { engineStart, engineStop, enabled, isMuted }

  const stop = useCallback((releaseDuration?: number) => {
    const opts = optionsRef.current
    if (handleRef.current) {
      handleRef.current.stop(releaseDuration ?? opts.release)
      handleRef.current = null
    } else {
      engineRef.current.engineStop(opts.cue ?? 'wind-ambient', releaseDuration ?? opts.release)
    }
    setIsPlaying(false)
    setVoiceId(undefined)
    opts.onStop?.()
  }, [])

  const start = useCallback((overrideOptions?: SoundContinuousOptions): SoundHandle | null => {
    const opts = optionsRef.current
    const eng = engineRef.current

    if (opts.disabled || !eng.enabled || eng.isMuted) return null

    if (handleRef.current) {
      handleRef.current.stop(0.04)
    }

    const targetCue = opts.cue ?? 'wind-ambient'
    const handle = eng.engineStart(targetCue, {
      variant: opts.variant,
      emphasis: opts.emphasis,
      volume: opts.volume,
      pan: opts.pan,
      ttl: opts.ttl,
      release: opts.release,
      ...overrideOptions,
      onEnded: () => {
        setIsPlaying(false)
        setVoiceId(undefined)
        handleRef.current = null
        overrideOptions?.onEnded?.()
        optionsRef.current.onStop?.()
      },
    })

    if (handle) {
      handleRef.current = handle
      setIsPlaying(true)
      setVoiceId(handle.id)
      opts.onStart?.()
    }

    return handle
  }, [])

  const toggle = useCallback(() => {
    if (handleRef.current && handleRef.current.isPlaying) {
      stop()
    } else {
      start()
    }
  }, [start, stop])

  const setVolume = useCallback((vol: number, rampDuration?: number) => {
    handleRef.current?.setVolume(vol, rampDuration)
  }, [])

  const setPitch = useCallback((pitchMultiplier: number, rampDuration?: number) => {
    handleRef.current?.setPitch(pitchMultiplier, rampDuration)
  }, [])

  const setDetune = useCallback((cents: number, rampDuration?: number) => {
    handleRef.current?.setDetune(cents, rampDuration)
  }, [])

  const setCutoff = useCallback((frequencyHz: number, rampDuration?: number) => {
    handleRef.current?.setCutoff(frequencyHz, rampDuration)
  }, [])

  const setPan = useCallback((panPos: number, rampDuration?: number) => {
    handleRef.current?.setPan(panPos, rampDuration)
  }, [])

  const setRate = useCallback((rateMultiplier: number, rampDuration?: number) => {
    handleRef.current?.setRate(rateMultiplier, rampDuration)
  }, [])

  const setModulation = useCallback((params: SoundModulationParams, rampDuration?: number) => {
    handleRef.current?.setModulation(params, rampDuration)
  }, [])

  useEffect(() => {
    if (autoStart && !disabled && enabled && !isMuted) {
      start()
    }
    return () => {
      if (handleRef.current) {
        handleRef.current.stop(0.04)
        handleRef.current = null
      }
    }
  }, [autoStart, disabled, enabled, isMuted, start])

  const isReady = enabled && !isMuted && !disabled

  const state = useMemo(
    () => ({
      isPlaying,
      cue,
      variant,
      voiceId,
      activeCount: activeContinuousCount,
    }),
    [isPlaying, cue, variant, voiceId, activeContinuousCount]
  )

  const actions = useMemo(
    () => ({
      start,
      stop,
      toggle,
      setVolume,
      setPitch,
      setDetune,
      setCutoff,
      setPan,
      setRate,
      setModulation,
    }),
    [start, stop, toggle, setVolume, setPitch, setDetune, setCutoff, setPan, setRate, setModulation]
  )

  const helpers = useMemo(
    () => ({
      isReady,
      cueName: cue,
    }),
    [isReady, cue]
  )

  const ariaProps = useMemo(
    () => ({
      'aria-busy': isPlaying,
      'data-sound-dynamic': isPlaying,
      'data-sound-cue': cue,
    }),
    [isPlaying, cue]
  )

  return {
    state,
    actions,
    helpers,
    ariaProps,
    handle: handleRef.current,
  }
}
