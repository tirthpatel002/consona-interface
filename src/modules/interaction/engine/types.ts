/**
 * Interaction Engine Types & Interfaces
 * Pure TypeScript contract for high-performance delegated event matching, rule execution, and action pipelines.
 */

export type InteractionTargetMatcher =
  | string
  | ((element: HTMLElement, event: Event) => boolean)

export interface InteractionModifier {
  /** Execute handler at most once before unregistering. */
  once?: boolean
  /** Debounce delay in milliseconds before executing handler. */
  debounce?: number
  /** Throttle interval in milliseconds limiting execution frequency. */
  throttle?: number
  /** Listen during the event capture phase instead of bubbling. */
  capture?: boolean
  /** Attach passive listener. */
  passive?: boolean
  /** Automatically call event.preventDefault(). */
  preventDefault?: boolean
  /** Automatically call event.stopPropagation(). */
  stopPropagation?: boolean
  /** Automatically call event.stopImmediatePropagation(). */
  stopImmediatePropagation?: boolean
  /** Keyboard shortcuts or key chord sequences (e.g. ['Meta+k', 'Escape', 'Ctrl+Shift+p']). */
  keys?: string[]
  /** Constrain target matching within a specific parent ancestor selector. */
  within?: string
  /** Require event.target to exactly match the target (no descendant bubbling). */
  exactTargetOnly?: boolean
}

export interface InteractionContext<TPayload = any> {
  /** Unique ID of the matched rule. */
  id: string
  /** Native or synthetic DOM event. */
  event: Event
  /** Resolved target DOM element (matched via closest() or direct target). */
  target: HTMLElement
  /** Selector or predicate matched against. */
  matchedSelector?: string
  /** High-resolution timestamp of the event. */
  timestamp: number
  /** Optional custom payload passed during dispatch. */
  payload?: TPayload
  /** Cancel subsequent lower-priority rules for this event tick. */
  cancel: () => void
  /** Arbitrary shared state dictionary. */
  state: Record<string, unknown>
}

export interface InteractionRule<TPayload = any> {
  /** Stable unique identifier for the interaction rule. */
  id: string
  /** Human-readable name for inspection and debugging. */
  name?: string
  /** Description of what this interaction rule orchestrates. */
  description?: string
  /** DOM or custom event types (e.g. ['click', 'keydown', 'pointerenter', 'consona:action']). */
  events: Array<keyof HTMLElementEventMap | string>
  /** Target element selector, data-slot, ID, or custom predicate function. */
  target?: InteractionTargetMatcher
  /** Condition guard function. Rule only executes if this returns true. */
  when?: (context: InteractionContext<TPayload>) => boolean
  /** Behavioral modifiers (debounce, throttle, key chords, capture phase). */
  modifiers?: InteractionModifier
  /** Numeric priority ranking (higher values execute before lower values). Default `0`. */
  priority?: number
  /** Whether the rule is currently active. Default `true`. */
  enabled?: boolean
  /** Categorization tags for filtering or scoped enablement. */
  tags?: string[]
  /** Action handler invoked when the rule conditions match. */
  handler: (context: InteractionContext<TPayload>) => void | Promise<void>
}

export interface InteractionLogEntry {
  /** Unique execution identifier. */
  id: string
  /** ID of the rule triggered, if any. */
  ruleId?: string
  /** Event name (e.g. 'click', 'keydown'). */
  eventType: string
  /** Tag name of the event target element. */
  targetTag: string
  /** Resolved selector or summary. */
  targetSelector?: string
  /** Timestamp when event occurred. */
  timestamp: number
  /** Whether a rule was matched and executed. */
  matched: boolean
  /** Handler execution duration in milliseconds. */
  durationMs?: number
  /** Event phase ('capture' | 'bubble'). */
  phase: 'capture' | 'bubble'
}

export interface InteractionStats {
  /** Total events captured by the delegated listener. */
  totalEvents: number
  /** Total rules successfully evaluated and executed. */
  matchedRules: number
  /** Timestamp of the most recent interaction event. */
  lastEventTimestamp: number | null
}

export interface InteractionState {
  /** Registered active interaction rules. */
  rules: InteractionRule[]
  /** Recent execution and activity logs for debugging. */
  logs: InteractionLogEntry[]
  /** Whether the global interaction engine listener is paused. */
  isPaused: boolean
  /** Real-time event statistics. */
  stats: InteractionStats
  /** Current buffer of sequential key chord inputs. */
  keyBuffer: string[]
}

export interface InteractionEngineOptions {
  /** Initial set of interaction rules registered at instantiation. */
  initialRules?: InteractionRule[]
  /** Maximum number of activity log entries retained in memory. Default `100`. */
  maxLogEntries?: number
  /** Custom key buffer timeout in milliseconds for multi-key sequences. Default `1000`. */
  keySequenceTimeout?: number
}
