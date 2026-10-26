import { useCallback, useMemo, useRef, useState } from 'react'
import { useSound } from '../context'
import type { SoundEmphasis, SoundKeyRole } from '../engine/types'

export interface UseKeySoundOptions {
  /** Sound emphasis intensity level (default 'normal'). */
  emphasis?: SoundEmphasis
  /** Volume multiplier (0.0 to 1.0). */
  volume?: number
  /** Whether typing sounds are disabled. */
  disabled?: boolean
  /** Minimum interval in milliseconds between keystroke sounds (default 35ms). */
  rateLimitMs?: number
}

export interface UseKeySoundReturn {
  state: {
    /** Whether keyboard sound is active and enabled. */
    isActive: boolean
    /** Last recognized key role. */
    lastKeyRole: SoundKeyRole | null
    /** Keystroke count during current session. */
    keystrokeCount: number
  }
  actions: {
    /** Keydown event handler to attach to text inputs, textareas, or editors. */
    handleKeyDown: (e: React.KeyboardEvent) => void
    /** Manual typing sound trigger. */
    triggerKeySound: (keyRole?: SoundKeyRole) => void
    /** Reset keystroke counter. */
    resetCounter: () => void
  }
  helpers: {
    /** Determines key role category for a given key string. */
    getKeyRole: (key: string) => SoundKeyRole
  }
  ariaProps: {
    'data-sound-typing': boolean
  }
}

/**
 * Headless UI hook providing context-aware typing feedback with rate-limiting and pitch adaptation (Type B Contract).
 */
export function useKeySound(options: UseKeySoundOptions = {}): UseKeySoundReturn {
  const { emphasis = 'normal', volume = 0.8, disabled = false, rateLimitMs = 35 } = options
  const { play, enabled, isMuted } = useSound()

  const [lastKeyRole, setLastKeyRole] = useState<SoundKeyRole | null>(null)
  const [keystrokeCount, setKeystrokeCount] = useState(0)
  const lastTimeRef = useRef<number>(-Infinity)

  const getKeyRole = useCallback((key: string): SoundKeyRole => {
    if (key === 'Backspace') return 'backspace'
    if (key === 'Delete') return 'delete'
    if (key === 'Enter') return 'enter'
    if (key === ' ') return 'space'
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape'].includes(key)) {
      return 'modifier'
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(key)) {
      return 'navigation'
    }
    return 'printable'
  }, [])

  const triggerKeySound = useCallback(
    (keyRole: SoundKeyRole = 'printable') => {
      if (disabled || keyRole === 'modifier') return

      const now = performance.now()
      const delta = now - lastTimeRef.current
      if (delta < rateLimitMs) return
      lastTimeRef.current = now

      setLastKeyRole(keyRole)
      setKeystrokeCount((prev) => prev + 1)

      play('type', {
        emphasis,
        volume,
        context: {
          inputMethod: 'keyboard',
          keyRole,
          cadenceDeltaMs: delta,
        },
      })
    },
    [disabled, rateLimitMs, play, emphasis, volume]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.repeat || e.nativeEvent.isComposing) return

      const role = getKeyRole(e.key)
      if (role !== 'modifier') {
        triggerKeySound(role)
      }
    },
    [disabled, getKeyRole, triggerKeySound]
  )

  const resetCounter = useCallback(() => {
    setKeystrokeCount(0)
    setLastKeyRole(null)
  }, [])

  const isActive = enabled && !isMuted && !disabled

  return useMemo(
    () => ({
      state: {
        isActive,
        lastKeyRole,
        keystrokeCount,
      },
      actions: {
        handleKeyDown,
        triggerKeySound,
        resetCounter,
      },
      helpers: {
        getKeyRole,
      },
      ariaProps: {
        'data-sound-typing': isActive,
      },
    }),
    [isActive, lastKeyRole, keystrokeCount, handleKeyDown, triggerKeySound, resetCounter, getKeyRole]
  )
}
