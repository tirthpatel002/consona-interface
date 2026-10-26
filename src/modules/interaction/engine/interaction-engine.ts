/**
 * InteractionEngine Pure TypeScript Implementation
 * Framework-agnostic interaction event bus, rule evaluation pipeline, and action dispatcher.
 */

import { BaseEngine } from '../../../core/engine'
import { resolveTargetElement, matchesKeyPattern } from './rule-matcher'
import type {
  InteractionContext,
  InteractionEngineOptions,
  InteractionLogEntry,
  InteractionRule,
  InteractionState,
} from './types'

export class InteractionEngine extends BaseEngine<InteractionState> {
  private maxLogEntries: number
  private keySequenceTimeout: number
  private keyTimer: ReturnType<typeof setTimeout> | null = null
  private debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()
  private throttleTimestamps: Map<string, number> = new Map()

  constructor(options: InteractionEngineOptions = {}) {
    super({
      rules: options.initialRules ?? [],
      logs: [],
      isPaused: false,
      stats: {
        totalEvents: 0,
        matchedRules: 0,
        lastEventTimestamp: null,
      },
      keyBuffer: [],
    })

    this.maxLogEntries = options.maxLogEntries ?? 100
    this.keySequenceTimeout = options.keySequenceTimeout ?? 1000
  }

  /**
   * Registers a new interaction rule into the engine.
   * Returns an unsubscribe cleanup function.
   */
  public addRule = <TPayload = any>(rule: InteractionRule<TPayload>): (() => void) => {
    const existingIndex = this.state.rules.findIndex((r) => r.id === rule.id)
    const updatedRules = [...this.state.rules]

    if (existingIndex >= 0) {
      updatedRules[existingIndex] = rule
    } else {
      updatedRules.push(rule)
    }

    // Sort by priority descending (highest priority executes first)
    updatedRules.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))

    this.setState({ rules: updatedRules })
    this.emit('rule:added', { ruleId: rule.id, name: rule.name })

    return () => {
      this.removeRule(rule.id)
    }
  }

  /**
   * Removes an interaction rule by ID.
   */
  public removeRule = (id: string): void => {
    const nextRules = this.state.rules.filter((r) => r.id !== id)
    if (nextRules.length !== this.state.rules.length) {
      this.setState({ rules: nextRules })
      this.emit('rule:removed', { ruleId: id })
    }

    // Clear any pending debounce timers for this rule
    if (this.debounceTimers.has(id)) {
      clearTimeout(this.debounceTimers.get(id)!)
      this.debounceTimers.delete(id)
    }
    this.throttleTimestamps.delete(id)
  }

  /**
   * Retrieves a registered rule by ID.
   */
  public getRule = (id: string): InteractionRule | undefined => {
    return this.state.rules.find((r) => r.id === id)
  }

  /**
   * Toggles the enabled state of a specific rule.
   */
  public setRuleEnabled = (id: string, enabled: boolean): void => {
    const nextRules = this.state.rules.map((r) =>
      r.id === id ? { ...r, enabled } : r
    )
    this.setState({ rules: nextRules })
    this.emit('rule:toggled', { ruleId: id, enabled })
  }

  /**
   * Clears all registered rules.
   */
  public clearRules = (): void => {
    this.debounceTimers.forEach((timer) => clearTimeout(timer))
    this.debounceTimers.clear()
    this.throttleTimestamps.clear()
    this.setState({ rules: [] })
    this.emit('rules:cleared')
  }

  /**
   * Pauses global event processing.
   */
  public pause = (): void => {
    this.setState({ isPaused: true })
    this.emit('engine:paused')
  }

  /**
   * Resumes global event processing.
   */
  public resume = (): void => {
    this.setState({ isPaused: false })
    this.emit('engine:resumed')
  }

  /**
   * Clears activity log entries.
   */
  public clearLogs = (): void => {
    this.setState({ logs: [] })
    this.emit('logs:cleared')
  }

  /**
   * Dispatches a custom synthetic interaction event through the rule pipeline.
   */
  public dispatchCustom = <TPayload = any>(
    eventName: string,
    payload?: TPayload,
    target?: HTMLElement
  ): void => {
    const customEvent = new CustomEvent(eventName, {
      detail: payload,
      bubbles: true,
      cancelable: true,
    })

    if (target) {
      target.dispatchEvent(customEvent)
    } else {
      this.handleNativeEvent(customEvent, 'bubble', payload)
    }
  }

  /**
   * Core Delegated Event Processing Pipeline.
   * Evaluates rules against the incoming DOM event with condition matching and modifier handling.
   */
  public handleNativeEvent = (
    event: Event,
    phase: 'capture' | 'bubble' = 'bubble',
    customPayload?: any
  ): void => {
    if (this.state.isPaused) return

    const now = Date.now()
    const eventType = event.type
    const rawTarget = event.target as HTMLElement | null

    // Track statistics
    this.setState((prev) => ({
      stats: {
        ...prev.stats,
        totalEvents: prev.stats.totalEvents + 1,
        lastEventTimestamp: now,
      },
    }))

    // Handle key buffer tracking for multi-key sequences
    if (event instanceof KeyboardEvent && event.type === 'keydown') {
      this.updateKeyBuffer(event.key)
    }

    let isCancelled = false
    const cancel = () => {
      isCancelled = true
    }

    // Filter candidate rules listening to this event type & phase
    const matchingRules = this.state.rules.filter((rule) => {
      if (rule.enabled === false) return false
      const listensToEvent = rule.events.includes(eventType) || rule.events.includes('*')
      if (!listensToEvent) return false

      const isCaptureRule = Boolean(rule.modifiers?.capture)
      return phase === 'capture' ? isCaptureRule : !isCaptureRule
    })

    for (const rule of matchingRules) {
      if (isCancelled) break

      const { modifiers, target: targetMatcher, when } = rule

      // 1. Keyboard pattern matching
      if (
        event instanceof KeyboardEvent &&
        modifiers?.keys &&
        modifiers.keys.length > 0
      ) {
        if (!matchesKeyPattern(event, modifiers.keys)) {
          continue
        }
      }

      // 2. DOM target element resolution
      const { matched, targetElement } = resolveTargetElement(
        rawTarget,
        targetMatcher,
        modifiers?.within,
        modifiers?.exactTargetOnly
      )

      if (!matched || !targetElement) {
        continue
      }

      // Build execution context
      const context: InteractionContext = {
        id: rule.id,
        event,
        target: targetElement,
        matchedSelector: typeof targetMatcher === 'string' ? targetMatcher : undefined,
        timestamp: now,
        payload: customPayload ?? (event as CustomEvent).detail,
        cancel,
        state: {},
      }

      // 3. Conditional guard evaluation
      if (when && !when(context)) {
        continue
      }

      // 4. Apply Event Modifiers
      if (modifiers?.preventDefault) {
        event.preventDefault()
      }
      if (modifiers?.stopPropagation) {
        event.stopPropagation()
      }
      if (modifiers?.stopImmediatePropagation) {
        event.stopImmediatePropagation()
      }

      // 5. Throttling check
      if (modifiers?.throttle && modifiers.throttle > 0) {
        const lastExecuted = this.throttleTimestamps.get(rule.id) ?? 0
        if (now - lastExecuted < modifiers.throttle) {
          continue
        }
        this.throttleTimestamps.set(rule.id, now)
      }

      // 6. Action Execution (with optional debouncing)
      if (modifiers?.debounce && modifiers.debounce > 0) {
        if (this.debounceTimers.has(rule.id)) {
          clearTimeout(this.debounceTimers.get(rule.id)!)
        }
        const timer = setTimeout(() => {
          this.executeRuleHandler(rule, context)
          this.debounceTimers.delete(rule.id)
        }, modifiers.debounce)
        this.debounceTimers.set(rule.id, timer)
      } else {
        this.executeRuleHandler(rule, context)
      }

      // Unregister one-time rules
      if (modifiers?.once) {
        this.removeRule(rule.id)
      }
    }
  }

  private executeRuleHandler = (rule: InteractionRule, context: InteractionContext): void => {
    const startTime = performance.now()
    try {
      rule.handler(context)
      const durationMs = Math.round((performance.now() - startTime) * 100) / 100

      this.logExecution({
        ruleId: rule.id,
        eventType: context.event.type,
        targetTag: context.target.tagName.toLowerCase(),
        targetSelector: context.matchedSelector,
        timestamp: context.timestamp,
        matched: true,
        durationMs,
        phase: rule.modifiers?.capture ? 'capture' : 'bubble',
      })

      this.setState((prev) => ({
        stats: {
          ...prev.stats,
          matchedRules: prev.stats.matchedRules + 1,
        },
      }))

      this.emit('rule:executed', { ruleId: rule.id, eventType: context.event.type })
    } catch (error) {
      this.emit('rule:error', { ruleId: rule.id, error })
    }
  }

  private logExecution = (entry: Omit<InteractionLogEntry, 'id'>): void => {
    const newEntry: InteractionLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...entry,
    }

    this.setState((prev) => ({
      logs: [newEntry, ...prev.logs].slice(0, this.maxLogEntries),
    }))
  }

  private updateKeyBuffer = (key: string): void => {
    if (this.keyTimer) clearTimeout(this.keyTimer)

    const nextBuffer = [...this.state.keyBuffer, key].slice(-5)
    this.setState({ keyBuffer: nextBuffer })

    this.keyTimer = setTimeout(() => {
      this.setState({ keyBuffer: [] })
    }, this.keySequenceTimeout)
  }

  public override destroy = (): void => {
    this.debounceTimers.forEach((timer) => clearTimeout(timer))
    this.debounceTimers.clear()
    if (this.keyTimer) clearTimeout(this.keyTimer)
    super.destroy()
  }
}

/**
 * Factory helper for creating an InteractionEngine instance.
 */
export function createInteractionEngine(options?: InteractionEngineOptions): InteractionEngine {
  return new InteractionEngine(options)
}
