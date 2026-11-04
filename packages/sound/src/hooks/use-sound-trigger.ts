import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSound } from '../context'
import type { SoundEmphasis, SoundName, SoundPlayOptions } from '../engine/types'

export interface UseSoundTriggerOptions {
  /** Sound cue identifier to play upon trigger (default 'tap'). */
  cue?: SoundName
  /** Sound variant identifier (e.g. 'mechanical', 'soft', 'pluck'). */
  variant?: string
  /** Trigger interaction event modality. */
  event?: 'click' | 'press' | 'hover' | 'hold' | 'start' | 'stop' | 'toggle-loop' | 'toggle' | 'custom'
  /** Sound emphasis intensity level. */
  emphasis?: SoundEmphasis
  /** Custom volume level multiplier (0.0 to 1.0). */
  volume?: number
  /** Whether the sound trigger is disabled. */
  disabled?: boolean
  /** Callback fired before/after sound playback. */
  onTrigger?: () => void
}

export interface UseSoundTriggerReturn {
  state: {
    /** Whether sound is currently enabled and unmuted in the provider. */
    isActive: boolean
    /** Whether trigger was recently invoked. */
    isTriggered: boolean
    /** Assigned sound cue. */
    cue: SoundName
    /** Assigned sound variant if any. */
    variant?: string
    /** Assigned emphasis level. */
    emphasis: SoundEmphasis
  }
  actions: {
    /** Imperatively fire the sound trigger. */
    trigger: (overrideOptions?: SoundPlayOptions) => void
    /** Event handler for click events. */
    handleClick: (e?: React.MouseEvent) => void
    /** Event handler for pointer down events. */
    handlePointerDown: (e?: React.PointerEvent) => void
    /** Event handler for pointer enter events. */
    handlePointerEnter: (e?: React.PointerEvent) => void
  }
  helpers: {
    /** Whether sound feedback will play when triggered. */
    canPlay: boolean
    /** Effective sound cue name. */
    cueName: string
  }
  ariaProps: {
    /** Indicates active sound feedback capability. */
    'data-sound-cue': string
  }
}

/**
 * Headless UI component hook attaching sound cues to element interactions (Type B Contract).
 */
export function useSoundTrigger(options: UseSoundTriggerOptions = {}): UseSoundTriggerReturn {
  const {
    cue = 'tap',
    variant,
    event = 'click',
    emphasis = 'normal',
    volume = 1,
    disabled = false,
    onTrigger,
  } = options

  const { play, start, stop, isContinuousPlaying, enabled, isMuted } = useSound()
  const [isTriggered, setIsTriggered] = useState(false)
  const triggerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (triggerTimerRef.current) clearTimeout(triggerTimerRef.current)
    }
  }, [])

  const trigger = useCallback(
    (overrideOptions?: SoundPlayOptions) => {
      if (disabled) return
      setIsTriggered(true)
      if (event === 'start' || event === 'hold') {
        start(cue, {
          variant,
          emphasis,
          volume,
          ...overrideOptions,
        })
      } else if (event === 'stop') {
        stop(cue)
      } else if (event === 'toggle-loop' || event === 'toggle') {
        if (isContinuousPlaying(cue, variant)) {
          stop(cue)
        } else {
          start(cue, { variant, emphasis, volume, ...overrideOptions })
        }
      } else {
        play(cue, {
          variant,
          emphasis,
          volume,
          ...overrideOptions,
        })
      }
      onTrigger?.()
      if (triggerTimerRef.current) clearTimeout(triggerTimerRef.current)
      triggerTimerRef.current = setTimeout(() => setIsTriggered(false), 150)
    },
    [
      disabled,
      play,
      start,
      stop,
      isContinuousPlaying,
      cue,
      variant,
      emphasis,
      volume,
      onTrigger,
      event,
    ]
  )

  const handleClick = useCallback(
    (e?: React.MouseEvent) => {
      if (event === 'click' || event === 'toggle') {
        trigger({
          context: {
            inputMethod: 'mouse',
          },
        })
      }
    },
    [event, trigger]
  )

  const handlePointerDown = useCallback(
    (e?: React.PointerEvent) => {
      if (event === 'press') {
        trigger({
          context: {
            inputMethod: (e?.pointerType as any) ?? 'mouse',
          },
        })
      }
    },
    [event, trigger]
  )

  const handlePointerEnter = useCallback(
    (e?: React.PointerEvent) => {
      if (event === 'hover') {
        trigger({
          context: {
            inputMethod: (e?.pointerType as any) ?? 'mouse',
          },
        })
      }
    },
    [event, trigger]
  )

  const isActive = enabled && !isMuted && !disabled
  const canPlay = isActive

  return useMemo(
    () => ({
      state: {
        isActive,
        isTriggered,
        cue,
        variant,
        emphasis,
      },
      actions: {
        trigger,
        handleClick,
        handlePointerDown,
        handlePointerEnter,
      },
      helpers: {
        canPlay,
        cueName: cue,
      },
      ariaProps: {
        'data-sound-cue': cue,
      },
    }),
    [
      isActive,
      isTriggered,
      cue,
      variant,
      emphasis,
      trigger,
      handleClick,
      handlePointerDown,
      handlePointerEnter,
      canPlay,
    ]
  )
}
