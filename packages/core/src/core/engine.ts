import { forwardEngineEvent } from './event-bus'
import type { StorageAdapter } from './storage'

export type EngineEventListener<TPayload = any> = (payload: TPayload) => void
export type EngineStateSubscriber = () => void

export interface EngineStorageBindingOptions<TState, K extends keyof TState = keyof TState> {
  adapter: StorageAdapter
  key: string
  stateKeys?: K[]
  serialize?: (state: Partial<TState>) => string
  deserialize?: (raw: string) => Partial<TState>
}

export interface EngineInstance<TState = any> {
  getState: () => TState
  subscribe: (subscriber: EngineStateSubscriber) => () => void
  on: (event: string, listener: EngineEventListener) => () => void
  emit: (event: string, payload?: any) => void
  destroy?: () => void
}

export abstract class BaseEngine<TState extends Record<string, any> = Record<string, any>>
  implements EngineInstance<TState>
{
  protected state: TState
  private subscribers: Set<EngineStateSubscriber> = new Set()
  private listeners: Map<string, Set<EngineEventListener>> = new Map()
  private isDestroyed: boolean = false
  private isBatching: boolean = false
  private hasPendingNotification: boolean = false
  private storageCleanup?: () => void

  constructor(initialState: TState) {
    this.state = initialState
  }

  /**
   * Returns current state snapshot (compatible with React useSyncExternalStore).
   */
  public getState = (): TState => {
    return this.state
  }

  /**
   * Updates state and notifies all React subscribers.
   */
  protected setState(updater: Partial<TState> | ((prev: TState) => Partial<TState>)): void {
    if (this.isDestroyed) return
    const nextState = typeof updater === 'function' ? updater(this.state) : updater
    this.state = { ...this.state, ...nextState }

    if (this.isBatching) {
      this.hasPendingNotification = true
    } else {
      this.notifySubscribers()
    }
  }

  /**
   * Batches multiple state updates together, firing a single notification to subscribers upon completion.
   */
  public batch(fn: () => void): void {
    if (this.isDestroyed) return
    const previousBatching = this.isBatching
    this.isBatching = true
    try {
      fn()
    } finally {
      this.isBatching = previousBatching
      if (!this.isBatching && this.hasPendingNotification) {
        this.hasPendingNotification = false
        this.notifySubscribers()
      }
    }
  }

  /**
   * Subscribes a React component to state mutations (useSyncExternalStore).
   */
  public subscribe = (subscriber: EngineStateSubscriber): (() => void) => {
    if (this.isDestroyed) return () => {}
    this.subscribers.add(subscriber)
    return () => {
      this.subscribers.delete(subscriber)
    }
  }

  /**
   * Notifies all active React component subscribers.
   */
  public notifySubscribers(): void {
    if (this.isDestroyed) return
    this.subscribers.forEach((sub) => {
      try {
        sub()
      } catch (err) {
        console.error('[Consona Engine Error] Subscriber threw an error:', err)
      }
    })
  }

  /**
   * Registers a lifecycle or custom event listener.
   */
  public on = (event: string, listener: EngineEventListener): (() => void) => {
    if (this.isDestroyed) return () => {}
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    const set = this.listeners.get(event)!
    set.add(listener)
    return () => {
      set.delete(listener)
    }
  }

  /**
   * Emits an event to all registered listeners and forwards to the interface event bus.
   */
  public emit = (event: string, payload?: any): void => {
    if (this.isDestroyed) return
    this.listeners.get(event)?.forEach((listener) => {
      try {
        listener(payload)
      } catch (err) {
        console.error(`[Consona Engine Error] Event listener for "${event}" failed:`, err)
      }
    })
    forwardEngineEvent(event, payload)
  }

  /**
   * Declaratively binds engine state keys to a pluggable StorageAdapter (Rule ENG2).
   */
  public attachStorage<K extends keyof TState = keyof TState>(
    options: EngineStorageBindingOptions<TState, K>
  ): () => void {
    const {
      adapter,
      key,
      stateKeys,
      serialize = (s) => JSON.stringify(s),
      deserialize = (r) => JSON.parse(r),
    } = options

    // 1. Initial hydrate from storage
    try {
      const raw = adapter.getItem(key)
      if (raw instanceof Promise) {
        raw.then((val) => {
          if (val && !this.isDestroyed) {
            try {
              const parsed = deserialize(val)
              this.setState(parsed)
            } catch {}
          }
        }).catch(() => {})
      } else if (raw) {
        const parsed = deserialize(raw)
        this.setState(parsed)
      }
    } catch {}

    // 2. Synchronize state on change
    const unsub = this.subscribe(() => {
      if (this.isDestroyed) return
      try {
        const payload: any = {}
        if (stateKeys && stateKeys.length > 0) {
          for (const k of stateKeys) {
            payload[k] = this.state[k]
          }
        } else {
          Object.assign(payload, this.state)
        }
        const serialized = serialize(payload)
        const res = adapter.setItem(key, serialized)
        if (res instanceof Promise) res.catch(() => {})
      } catch {}
    })

    this.storageCleanup = unsub
    return unsub
  }

  /**
   * Cleans up all listeners, storage bindings, and subscribers.
   */
  public destroy(): void {
    this.isDestroyed = true
    this.storageCleanup?.()
    this.subscribers.clear()
    this.listeners.clear()
  }
}

