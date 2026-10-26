import type { NavNode, AsyncComponentLoader, PrefetchStatus } from './types'

export interface RoutePrefetchEntry {
  nodeId: string
  status: PrefetchStatus
  component?: any
  promise?: Promise<any>
  timestamp: number
  lastAccessed: number
  isPinned: boolean
  error?: any
}

export interface RoutePrefetcherConfig {
  /** Maximum entries retained in the LRU prefetch cache (default: 25) */
  capacity?: number
  /** Time to live before idle prefetched entries are eligible for eviction (default: 300000ms / 5min) */
  ttlMs?: number
  /** Hover intent debounce delay in milliseconds (default: 65ms) */
  intentDelayMs?: number
}

/**
 * Checks whether client network conditions permit speculative prefetching.
 */
export function isPrefetchAllowed(): boolean {
  if (typeof navigator === 'undefined') return false
  const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  if (conn) {
    if (conn.saveData) return false
    if (conn.effectiveType && /^(slow-2g|2g|3g)$/i.test(conn.effectiveType)) return false
  }
  return true
}

/**
 * Enterprise-grade Route Prefetcher with LRU Cache, TTL Expiration, and Intent Debouncing.
 */
export class RoutePrefetcher {
  private cache: Map<string, RoutePrefetchEntry> = new Map()
  private hoverTimers: Map<string, any> = new Map()
  private capacity: number
  private ttlMs: number
  private intentDelayMs: number
  private gcIntervalId?: any

  constructor(config: RoutePrefetcherConfig = {}) {
    this.capacity = config.capacity ?? 25
    this.ttlMs = config.ttlMs ?? 5 * 60 * 1000 // 5 minutes
    this.intentDelayMs = config.intentDelayMs ?? 65

    // Run garbage collection janitor every 60 seconds in browser
    if (typeof window !== 'undefined') {
      this.gcIntervalId = setInterval(() => this.runGarbageCollection(), 60 * 1000)
    }
  }

  /**
   * Prefetches a navigation node's async component immediately.
   */
  public async prefetch(node: NavNode, force = false): Promise<any> {
    if (!node || !node.id) return
    if (!force && !isPrefetchAllowed()) return

    const existing = this.cache.get(node.id)
    if (existing) {
      existing.lastAccessed = Date.now()
      if (existing.status === 'loaded' && existing.component) {
        return existing.component
      }
      if (existing.status === 'loading' && existing.promise) {
        return existing.promise
      }
    }

    // 1. If explicit async loader is provided (node.lazy)
    const loader = node.lazy || (typeof node.component === 'function' && node.component.constructor?.name === 'AsyncFunction' ? (node.component as AsyncComponentLoader) : undefined)

    if (loader) {
      const entry: RoutePrefetchEntry = {
        nodeId: node.id,
        status: 'loading',
        timestamp: Date.now(),
        lastAccessed: Date.now(),
        isPinned: false,
      }

      this.cache.set(node.id, entry)
      this.enforceCapacity()

      const loadPromise = (async () => {
        try {
          const result = await loader()
          const resolved = (result && typeof result === 'object' && 'default' in result) ? result.default : result
          entry.status = 'loaded'
          entry.component = resolved
          entry.promise = undefined
          return resolved
        } catch (err) {
          entry.status = 'error'
          entry.error = err
          entry.promise = undefined
          console.warn(`[RoutePrefetcher] Failed to prefetch route "${node.id}":`, err)
          throw err
        }
      })()

      entry.promise = loadPromise
      return loadPromise
    }

    // 2. Direct synchronous Component (node.component)
    const comp = node.component
    if (comp) {
      const entry: RoutePrefetchEntry = {
        nodeId: node.id,
        status: 'loaded',
        component: comp,
        timestamp: Date.now(),
        lastAccessed: Date.now(),
        isPinned: false,
      }
      this.cache.set(node.id, entry)
      this.enforceCapacity()
      return comp
    }

    return undefined
  }

  /**
   * Debounces prefetching based on user hover intent (e.g. 65ms).
   */
  public prefetchOnIntent(node: NavNode, delayMs?: number): void {
    if (!node || !node.id || !isPrefetchAllowed()) return
    const delay = delayMs ?? this.intentDelayMs

    this.cancelIntent(node.id)

    const timer = setTimeout(() => {
      this.hoverTimers.delete(node.id)
      const execute = () => {
        this.prefetch(node).catch(() => {})
      }

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(execute, { timeout: 300 })
      } else {
        setTimeout(execute, 0)
      }
    }, delay)

    this.hoverTimers.set(node.id, timer)
  }

  /**
   * Cancels a pending intent debounce timer for a node.
   */
  public cancelIntent(nodeId: string): void {
    const timer = this.hoverTimers.get(nodeId)
    if (timer) {
      clearTimeout(timer)
      this.hoverTimers.delete(nodeId)
    }
  }

  /**
   * Gets the current prefetch status of a node.
   */
  public getStatus(nodeId: string): PrefetchStatus {
    const entry = this.cache.get(nodeId)
    return entry ? entry.status : 'idle'
  }

  /**
   * Retrieves the cached component for a node if loaded.
   */
  public getCachedComponent(nodeId: string): any | undefined {
    const entry = this.cache.get(nodeId)
    if (entry && entry.status === 'loaded') {
      entry.lastAccessed = Date.now()
      return entry.component
    }
    return undefined
  }

  /**
   * Pins node IDs (e.g. active route and trail) so they are immune to LRU/TTL garbage collection.
   */
  public pinNodes(nodeIds: string[]): void {
    const idSet = new Set(nodeIds)
    this.cache.forEach((entry, id) => {
      entry.isPinned = idSet.has(id)
    })
  }

  /**
   * Manually evicts a specific node from the prefetch cache.
   */
  public evict(nodeId: string): boolean {
    this.cancelIntent(nodeId)
    return this.cache.delete(nodeId)
  }

  /**
   * Enforces LRU capacity by evicting least-recently used unpinned entries.
   */
  private enforceCapacity(): void {
    if (this.cache.size <= this.capacity) return

    // Find unpinned entries sorted by oldest lastAccessed
    const unpinnedEntries: RoutePrefetchEntry[] = []
    this.cache.forEach((entry) => {
      if (!entry.isPinned) {
        unpinnedEntries.push(entry)
      }
    })

    unpinnedEntries.sort((a, b) => a.lastAccessed - b.lastAccessed)

    while (this.cache.size > this.capacity && unpinnedEntries.length > 0) {
      const oldest = unpinnedEntries.shift()!
      this.cache.delete(oldest.nodeId)
    }
  }

  /**
   * Prunes expired entries that exceeded TTL without being visited or pinned.
   */
  public runGarbageCollection(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    this.cache.forEach((entry, id) => {
      if (!entry.isPinned && now - entry.lastAccessed > this.ttlMs) {
        expiredKeys.push(id)
      }
    })

    for (const key of expiredKeys) {
      this.cache.delete(key)
    }
  }

  /**
   * Clean up all timers and intervals upon destruction.
   */
  public destroy(): void {
    this.hoverTimers.forEach((timer) => clearTimeout(timer))
    this.hoverTimers.clear()
    if (this.gcIntervalId) {
      clearInterval(this.gcIntervalId)
    }
    this.cache.clear()
  }
}
