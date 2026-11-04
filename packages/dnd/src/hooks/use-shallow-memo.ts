import { useRef } from 'react'
import { shallowEqual } from '../engine/shallow'

/**
 * Returns a stable reference to `value` as long as its shallow contents have not changed.
 * Prevents unnecessary re-registrations and infinite update cycles with @dnd-kit reducers.
 */
export function useShallowMemo<T>(value: T): T {
  const ref = useRef<T>(value)
  if (!shallowEqual(ref.current, value)) {
    ref.current = value
  }
  return ref.current
}
