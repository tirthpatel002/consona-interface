import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { BaseEngine, EngineInstance } from './engine'

/**
 * Standard 4-Part Contract for Headless Component Hooks (Tier 3)
 */
export interface HeadlessHookReturn<
  TState extends Record<string, any> = Record<string, any>,
  TActions extends Record<string, Function> = Record<string, Function>,
  THelpers extends Record<string, any> = Record<string, any>,
  TAriaProps extends Record<string, any> = Record<string, any>
> {
  state: TState
  actions: TActions
  helpers: THelpers
  ariaProps: TAriaProps
}

/**
 * Stable Callback Ref hook primitive
 * Ensures event callbacks never cause unnecessary re-renders when passed downstream.
 */
export function useCallbackRef<T extends (...args: any[]) => any>(callback?: T): T {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(((...args: any[]) => callbackRef.current?.(...args)) as T, [])
}

/**
 * Controlled / Uncontrolled state synchronization primitive for headless component hooks.
 */
export interface UseControllableStateParams<T> {
  prop?: T
  defaultProp?: T
  onChange?: (state: T) => void
}

export function useControllableState<T>({
  prop,
  defaultProp,
  onChange,
}: UseControllableStateParams<T>): [T, (next: T | ((prev: T) => T)) => void] {
  const [uncontrolledProp, setUncontrolledProp] = useState<T>(defaultProp as T)
  const isControlled = prop !== undefined
  const value = isControlled ? prop : uncontrolledProp
  const handleChange = useCallbackRef(onChange)

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const nextValue = typeof next === 'function' ? (next as (prev: T) => T)(value) : next
      if (!isControlled) {
        setUncontrolledProp(nextValue)
      }
      handleChange(nextValue)
    },
    [isControlled, value, handleChange]
  )

  return [value, setValue]
}

/**
 * React Hook primitive that binds any pure TypeScript EngineInstance to a React component
 * using useSyncExternalStore to guarantee zero tearing and optimal rendering performance.
 */
export function useEngineState<TState>(engine: EngineInstance<TState>): TState {
  return useSyncExternalStore(
    engine.subscribe,
    engine.getState,
    engine.getState
  )
}

/**
 * React Hook primitive that creates and manages the lifecycle of a pure BaseEngine instance.
 * Automatically cleans up / destroys the engine when the component unmounts.
 */
export function useEngine<TState extends Record<string, any>, TEngine extends BaseEngine<TState>>(
  factory: () => TEngine,
  deps: React.DependencyList = []
): [TState, TEngine] {
  const factoryRef = useRef(factory)
  factoryRef.current = factory
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const engine = useMemo(() => factoryRef.current(), deps)

  useEffect(() => {
    return () => {
      engine.destroy()
    }
  }, [engine])

  const state = useEngineState(engine)
  return [state, engine]
}
