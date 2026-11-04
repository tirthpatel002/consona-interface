import { useCallback, useMemo, useState } from 'react'
import { useSound } from '../context'
import type { SoundEmphasis, SoundName } from '../engine/types'

export interface UseSoundFeedbackOptions {
  /** Sound cue played when async task starts (default 'open'). */
  startCue?: SoundName
  /** Sound cue played when async task succeeds (default 'success'). */
  successCue?: SoundName
  /** Sound cue played when async task fails (default 'error'). */
  errorCue?: SoundName
  /** Emphasis level for feedback cues (default 'normal'). */
  emphasis?: SoundEmphasis
  /** Custom volume level multiplier. */
  volume?: number
}

export interface UseSoundFeedbackReturn {
  state: {
    /** Whether an async operation is currently executing with sound feedback. */
    isLoading: boolean
    /** Last execution result status. */
    status: 'idle' | 'loading' | 'success' | 'error'
    /** Last error object if rejected. */
    error: Error | null
  }
  actions: {
    /** Wraps an asynchronous Promise or function execution with automatic sound feedback. */
    withSound: <T>(promiseOrFn: Promise<T> | (() => Promise<T>)) => Promise<T>
    /** Reset status to idle. */
    reset: () => void
  }
  helpers: {
    /** Whether sound feedback is active and ready. */
    isReady: boolean
  }
  ariaProps: {
    'aria-busy': boolean
    'aria-live': 'polite' | 'assertive' | 'off'
  }
}

/**
 * Headless UI hook wrapping asynchronous operations with automated acoustic feedback (Type B Contract).
 */
export function useSoundFeedback(options: UseSoundFeedbackOptions = {}): UseSoundFeedbackReturn {
  const {
    startCue = 'open',
    successCue = 'success',
    errorCue = 'error',
    emphasis = 'normal',
    volume = 1,
  } = options

  const { play, enabled, isMuted } = useSound()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState<Error | null>(null)

  const withSound = useCallback(
    async <T>(promiseOrFn: Promise<T> | (() => Promise<T>)): Promise<T> => {
      setStatus('loading')
      setError(null)
      play(startCue, { emphasis: 'subtle', volume })

      try {
        const promise = typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn
        const result = await promise
        setStatus('success')
        play(successCue, { emphasis, volume })
        return result
      } catch (err: any) {
        setStatus('error')
        const e = err instanceof Error ? err : new Error(String(err))
        setError(e)
        play(errorCue, { emphasis: 'strong', volume })
        throw err
      }
    },
    [play, startCue, successCue, errorCue, emphasis, volume]
  )

  const reset = useCallback(() => {
    setStatus('idle')
    setError(null)
  }, [])

  const isLoading = status === 'loading'
  const isReady = enabled && !isMuted

  return useMemo(
    () => ({
      state: {
        isLoading,
        status,
        error,
      },
      actions: {
        withSound,
        reset,
      },
      helpers: {
        isReady,
      },
      ariaProps: {
        'aria-busy': isLoading,
        'aria-live': status === 'error' ? 'assertive' : 'polite',
      },
    }),
    [isLoading, status, error, withSound, reset, isReady]
  )
}
