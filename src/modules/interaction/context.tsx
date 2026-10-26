import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react'
import {
  InteractionEngine,
  createInteractionEngine,
} from './engine/interaction-engine'
import type {
  InteractionEngineOptions,
  InteractionLogEntry,
  InteractionRule,
  InteractionStats,
} from './engine/types'

export interface InteractionContextValue {
  /** All currently registered interaction rules. */
  rules: InteractionRule[]
  /** Activity and execution logs. */
  logs: InteractionLogEntry[]
  /** Whether the global interaction engine listener is paused. */
  isPaused: boolean
  /** Real-time event statistics. */
  stats: InteractionStats
  /** Current buffer of sequential key chords. */
  keyBuffer: string[]
  /** Register a new interaction rule into the engine. Returns unsubscribe function. */
  addRule: <TPayload = any>(rule: InteractionRule<TPayload>) => () => void
  /** Remove an interaction rule by ID. */
  removeRule: (id: string) => void
  /** Retrieve a rule by ID. */
  getRule: (id: string) => InteractionRule | undefined
  /** Toggle rule enablement. */
  setRuleEnabled: (id: string, enabled: boolean) => void
  /** Clear all rules. */
  clearRules: () => void
  /** Pause global engine listener. */
  pause: () => void
  /** Resume global engine listener. */
  resume: () => void
  /** Clear activity logs. */
  clearLogs: () => void
  /** Dispatch a custom synthetic interaction event. */
  dispatchCustom: <TPayload = any>(
    eventName: string,
    payload?: TPayload,
    target?: HTMLElement
  ) => void
}

export interface ExtendedInteractionContextValue extends InteractionContextValue {
  /** Underlying framework-agnostic InteractionEngine instance. */
  engine: InteractionEngine
}

const InteractionContext = createContext<ExtendedInteractionContextValue | null>(null)

/**
 * Access the active Interaction Engine context and state.
 */
export function useInteraction(): ExtendedInteractionContextValue {
  const ctx = useContext(InteractionContext)
  if (!ctx) {
    throw new Error('useInteraction must be used within an <InteractionProvider>')
  }
  return ctx
}

export interface InteractionProviderProps extends InteractionEngineOptions {
  /** Pre-configured or external InteractionEngine instance. */
  engine?: InteractionEngine
  /** Additional engine options. */
  options?: InteractionEngineOptions & Record<string, unknown>
  /** Initial rules passed to the provider. */
  defaultRules?: InteractionRule[]
  /** Specific event types to listen to. Defaults to standard UI events. */
  observedEvents?: Array<keyof HTMLElementEventMap | string>
  /** React children nodes. */
  children: React.ReactNode
}

const DEFAULT_OBSERVED_EVENTS: string[] = [
  'click',
  'dblclick',
  'contextmenu',
  'keydown',
  'keyup',
  'pointerdown',
  'pointerup',
  'pointerenter',
  'pointerleave',
  'focusin',
  'focusout',
  'submit',
  'change',
  'input',
]

/**
 * High-performance global interaction rule engine & delegated event listener provider.
 */
export function InteractionProvider({
  engine: propEngine,
  options,
  defaultRules = [],
  initialRules,
  maxLogEntries = 100,
  keySequenceTimeout = 1000,
  observedEvents = DEFAULT_OBSERVED_EVENTS,
  children,
}: InteractionProviderProps) {
  const engineRef = useRef<InteractionEngine | null>(null)

  if (!engineRef.current) {
    if (propEngine) {
      engineRef.current = propEngine
    } else {
      engineRef.current = createInteractionEngine({
        initialRules: options?.initialRules ?? initialRules ?? defaultRules,
        maxLogEntries: options?.maxLogEntries ?? maxLogEntries,
        keySequenceTimeout: options?.keySequenceTimeout ?? keySequenceTimeout,
      })
    }
  }

  const engine = engineRef.current!

  const engineState = useSyncExternalStore(
    (callback) => engine.subscribe(callback),
    () => engine.getState(),
    () => engine.getState()
  )

  // Attach high-performance root delegated capture and bubble listeners
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleBubble = (e: Event) => {
      engine.handleNativeEvent(e, 'bubble')
    }

    const handleCapture = (e: Event) => {
      engine.handleNativeEvent(e, 'capture')
    }

    const registeredEvents = Array.from(new Set(observedEvents))

    for (const eventName of registeredEvents) {
      window.addEventListener(eventName, handleBubble, { passive: false, capture: false })
      window.addEventListener(eventName, handleCapture, { passive: false, capture: true })
    }

    return () => {
      for (const eventName of registeredEvents) {
        window.removeEventListener(eventName, handleBubble)
        window.removeEventListener(eventName, handleCapture)
      }
    }
  }, [engine, observedEvents])

  const contextValue: ExtendedInteractionContextValue = useMemo(() => {
    return {
      engine,
      rules: engineState.rules,
      logs: engineState.logs,
      isPaused: engineState.isPaused,
      stats: engineState.stats,
      keyBuffer: engineState.keyBuffer,

      addRule: (rule) => engine.addRule(rule),
      removeRule: (id) => engine.removeRule(id),
      getRule: (id) => engine.getRule(id),
      setRuleEnabled: (id, enabled) => engine.setRuleEnabled(id, enabled),
      clearRules: () => engine.clearRules(),
      pause: () => engine.pause(),
      resume: () => engine.resume(),
      clearLogs: () => engine.clearLogs(),
      dispatchCustom: (name, payload, target) => engine.dispatchCustom(name, payload, target),
    }
  }, [engine, engineState])

  return (
    <InteractionContext.Provider value={contextValue}>
      {children}
    </InteractionContext.Provider>
  )
}
