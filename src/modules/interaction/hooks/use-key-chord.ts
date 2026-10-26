import { useId } from 'react'
import { useInteractionRule } from './use-interaction-rule'
import type { InteractionContext } from '../engine/types'

export interface UseKeyChordOptions {
  /** Prevent default browser action when chord matches. Default `true`. */
  preventDefault?: boolean
  /** Stop event propagation. Default `false`. */
  stopPropagation?: boolean
  /** Whether the key chord listener is active. Default `true`. */
  enabled?: boolean
  /** Restrict matching to when focus is within a specific element selector. */
  within?: string
}

/**
 * High-level hook for listening to single keys or keyboard chords (e.g. 'Meta+k', 'Ctrl+Shift+p').
 */
export function useKeyChord(
  keys: string | string[],
  handler: (context: InteractionContext<KeyboardEvent>) => void,
  options: UseKeyChordOptions = {}
): void {
  const ruleId = useId()
  const keyList = Array.isArray(keys) ? keys : [keys]
  const {
    preventDefault = true,
    stopPropagation = false,
    enabled = true,
    within,
  } = options

  useInteractionRule(
    {
      id: `key-chord-${ruleId}`,
      name: `KeyChord (${keyList.join(', ')})`,
      events: ['keydown'],
      enabled,
      modifiers: {
        keys: keyList,
        preventDefault,
        stopPropagation,
        within,
      },
      handler,
    },
    [keyList.join(','), preventDefault, stopPropagation, enabled, within]
  )
}
