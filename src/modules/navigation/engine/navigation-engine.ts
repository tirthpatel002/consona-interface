/**
 * Pure TypeScript Navigation Engine
 * Framework-agnostic hierarchical navigation graph coordinator, trail resolver,
 * route pattern matcher, and history manager.
 * Zero React dependencies.
 */

import { BaseEngine } from '../../../core/engine'
import type {
  NavNode,
  NavTree,
  NavTrailStep,
  NavigationOptions,
  NavigationState,
  NavRouterAdapter,
  NavigationGuard,
  PrefetchStatus,
} from './types'
import { StateRouterAdapter } from './adapters/state-adapter'
import { RoutePrefetcher, type RoutePrefetcherConfig } from './prefetcher'

export interface NavigationEngineConfig<TData = any> {
  /** Hierarchical navigation tree definition */
  tree?: NavTree<TData>
  /** Default active node ID or starting path */
  defaultId?: string
  /** Pluggable router adapter (defaults to StateRouterAdapter) */
  adapter?: NavRouterAdapter
  /** Global navigation guards */
  guards?: NavigationGuard<TData>[]
  /** Optional prefetcher configuration */
  prefetcher?: RoutePrefetcherConfig
}

export class NavigationEngine<TData = any> extends BaseEngine<NavigationState<TData>> {
  private tree: NavTree<TData> = []
  private nodeMap: Map<string, NavNode<TData>> = new Map()
  private hrefMap: Map<string, NavNode<TData>> = new Map()
  private parentMap: Map<string, string | undefined> = new Map()
  private childrenMap: Map<string, NavNode<TData>[]> = new Map()
  private patternList: { regex: RegExp; keys: string[]; node: NavNode<TData> }[] = []
  private adapter: NavRouterAdapter
  private guards: NavigationGuard<TData>[] = []
  private historyStack: { path: string; id: string; state?: any }[] = []
  private unsubscribeAdapter?: () => void
  private prefetcher: RoutePrefetcher

  constructor(config: NavigationEngineConfig<TData> = {}) {
    const adapter = config.adapter || new StateRouterAdapter(config.defaultId || '/')
    super({
      activeId: config.defaultId || '',
      currentPath: adapter.getCurrentPath() || '/',
      activeNode: null,
      trail: [],
      params: {},
      query: {},
      state: null,
      historyIndex: 0,
      totalNodes: 0,
    })

    this.adapter = adapter
    this.prefetcher = new RoutePrefetcher(config.prefetcher)

    if (config.guards) {
      this.guards = [...config.guards]
    }

    if (config.tree) {
      this.setTree(config.tree, config.defaultId)
    }

    // Subscribe to external route changes from the adapter
    this.unsubscribeAdapter = this.adapter.subscribe((path, externalState) => {
      this.syncFromExternal(path, externalState)
    })
  }

  /**
   * Sets or updates the navigation tree and rebuilds all fast lookup indexes.
   */
  public setTree(tree: NavTree<TData>, initialActiveId?: string): void {
    this.tree = tree
    this.nodeMap.clear()
    this.hrefMap.clear()
    this.parentMap.clear()
    this.childrenMap.clear()
    this.patternList = []

    this.indexTree(this.tree, undefined)

    const currentPath = this.adapter.getCurrentPath()
    const targetId = initialActiveId || (currentPath ? currentPath : this.state.activeId) || (this.tree[0]?.id ?? '')
    const resolved = this.resolveNode(targetId) || (this.tree[0] ? this.resolveNode(this.tree[0].id) : null)

    this.setState({
      totalNodes: this.nodeMap.size,
      activeId: resolved?.node.id || targetId,
      activeNode: resolved?.node || null,
      trail: resolved?.node ? this.buildTrail(resolved.node) : [],
      params: resolved?.params || {},
      query: this.parseQuery(this.adapter.getCurrentPath()),
    })

    this.emit('nav:tree-update', { totalNodes: this.nodeMap.size })
  }

  /**
   * Recursively indexes nodes for O(1) lookups, parent linkages, and regex patterns.
   */
  private indexTree(nodes: NavNode<TData>[], parentId?: string): void {
    for (const node of nodes) {
      node.parentId = node.parentId || parentId
      this.nodeMap.set(node.id, node)
      this.parentMap.set(node.id, node.parentId)
      this.indexHref(node)

      if (parentId) {
        if (!this.childrenMap.has(parentId)) {
          this.childrenMap.set(parentId, [])
        }
        this.childrenMap.get(parentId)!.push(node)
      }

      if (node.pattern) {
        this.compilePattern(node)
      }

      if (node.children && node.children.length > 0) {
        this.indexTree(node.children, node.id)
      }
    }
  }

  /**
   * Indexes a path onto the deepest node that owns it.
   * A folder and the page nested inside it often share one href. The folder is
   * indexed first, so keeping the first match would select the folder and the
   * nested page would never become active.
   */
  private indexHref(node: NavNode<TData>): void {
    if (!node.href) return
    const existing = this.hrefMap.get(node.href)
    if (!existing || this.nodeDepth(node) > this.nodeDepth(existing)) {
      this.hrefMap.set(node.href, node)
    }
  }

  private nodeDepth(node: NavNode<TData>): number {
    let depth = 0
    let parentId = this.parentMap.get(node.id)
    const seen = new Set<string>([node.id])
    while (parentId && !seen.has(parentId)) {
      seen.add(parentId)
      depth++
      parentId = this.parentMap.get(parentId)
    }
    return depth
  }

  /**
   * Compiles dynamic route patterns like '/modules/:module/:component' into RegExp.
   */
  private compilePattern(node: NavNode<TData>): void {
    if (!node.pattern) return
    if (node.pattern instanceof RegExp) {
      this.patternList.push({ regex: node.pattern, keys: [], node })
      return
    }

    const patternStr = node.pattern
    const keys: string[] = []
    const regexStr = patternStr.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
      keys.push(key)
      return '([^/]+)'
    })

    const regex = new RegExp(`^${regexStr}$`)
    this.patternList.push({ regex, keys, node })
  }

  /**
   * Navigates to a target node ID, URL path, or pattern match with optional params and state payload.
   */
  public async navigate(
    target: string | NavNode<TData>,
    options: NavigationOptions<TData> = {}
  ): Promise<boolean> {
    const targetIdOrPath = typeof target === 'string' ? target : target.id
    const resolved = this.resolveNode(targetIdOrPath, options.params)

    if (!resolved || !resolved.node) {
      console.warn(`[NavigationEngine] Unable to resolve route for: "${targetIdOrPath}"`)
      return false
    }

    const toNode = resolved.node
    const fromNode = this.state.activeNode

    // Run navigation guards
    for (const guard of this.guards) {
      const result = await guard(toNode, fromNode, options)
      if (result === false) {
        this.emit('nav:blocked', { to: toNode, from: fromNode, reason: 'guard' })
        return false
      }
      if (typeof result === 'string') {
        return this.navigate(result, options)
      }
    }

    this.emit('nav:before-navigate', { to: toNode, from: fromNode, options })

    // Compute path string
    let finalPath = toNode.href || `/${toNode.id}`
    if (toNode.pattern && typeof toNode.pattern === 'string' && options.params) {
      finalPath = toNode.pattern.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
        return options.params?.[key] !== undefined ? String(options.params[key]) : `:${key}`
      })
    }

    // Append query params if present
    if (options.query && Object.keys(options.query).length > 0) {
      const qs = new URLSearchParams()
      Object.entries(options.query).forEach(([k, v]) => {
        if (v !== undefined) qs.set(k, String(v))
      })
      finalPath += `?${qs.toString()}`
    }

    // Sync with router adapter
    if (options.replace) {
      this.adapter.replace(finalPath, options.state)
    } else {
      this.adapter.push(finalPath, options.state)
    }

    const trail = this.buildTrail(toNode)
    const nextParams = { ...resolved.params, ...(options.params || {}) }
    const nextQuery = { ...this.parseQuery(finalPath), ...(options.query || {}) }

    this.setState({
      activeId: toNode.id,
      currentPath: finalPath,
      activeNode: toNode,
      trail,
      params: nextParams,
      query: nextQuery,
      state: options.state || null,
      historyIndex: this.state.historyIndex + 1,
    })

    this.historyStack.push({
      path: finalPath,
      id: toNode.id,
      state: options.state,
    })

    // Pin active route and breadcrumb trail from LRU eviction
    this.prefetcher.pinNodes(trail.map((s) => s.node.id))

    this.emit('nav:change', {
      to: toNode,
      from: fromNode,
      trail,
      params: nextParams,
      query: nextQuery,
      state: options.state,
      meta: options.meta,
    })

    return true
  }

  /**
   * Synchronizes engine state when external router updates (e.g., browser back button).
   */
  private syncFromExternal(path: string, externalState?: any): void {
    const resolved = this.resolveNode(path)
    if (!resolved || !resolved.node) return

    const toNode = resolved.node
    const trail = this.buildTrail(toNode)

    this.prefetcher.pinNodes(trail.map((s) => s.node.id))

    this.setState({
      activeId: toNode.id,
      currentPath: path,
      activeNode: toNode,
      trail,
      params: resolved.params,
      query: this.parseQuery(path),
      state: externalState || null,
    })

    this.emit('nav:change', {
      to: toNode,
      from: this.state.activeNode,
      trail,
      params: resolved.params,
      query: this.parseQuery(path),
      state: externalState,
      meta: { trigger: 'external' },
    })
  }

  /**
   * Resolves a node by exact ID, href, or dynamic pattern.
   */
  public resolveNode(
    idOrPath: string,
    providedParams?: Record<string, any>
  ): { node: NavNode<TData>; params: Record<string, any> } | null {
    // 1. Direct ID lookup
    if (this.nodeMap.has(idOrPath)) {
      return { node: this.nodeMap.get(idOrPath)!, params: providedParams || {} }
    }

    // Clean path (strip query & hash for lookup)
    const cleanPath = (idOrPath.split('?')[0] ?? '').split('#')[0] ?? ''

    // 2. Direct href match. Shared paths resolve to the nested page, not its folder.
    const hrefMatch = this.hrefMap.get(cleanPath) || this.hrefMap.get(idOrPath)
    if (hrefMatch) {
      return { node: hrefMatch, params: providedParams || {} }
    }

    // 3. Dynamic pattern match
    for (const { regex, keys, node } of this.patternList) {
      const match = cleanPath.match(regex)
      if (match) {
        const extractedParams: Record<string, any> = {}
        keys.forEach((k, idx) => {
          extractedParams[k] = match[idx + 1]
        })
        return { node, params: { ...extractedParams, ...(providedParams || {}) } }
      }
    }

    return null
  }

  /**
   * Builds the complete ancestor trail from root down to target node.
   */
  public buildTrail(targetNode: NavNode<TData>): NavTrailStep<TData>[] {
    const chain: NavNode<TData>[] = []
    let current: NavNode<TData> | undefined = targetNode

    while (current) {
      if (!current.hideInBreadcrumbs) {
        chain.unshift(current)
      }
      current = current.parentId ? this.nodeMap.get(current.parentId) : undefined
    }

    return chain.map((node, level) => {
      const siblings = this.getSiblings(node.id)
      const children = this.getChildren(node.id)
      return {
        node,
        level,
        siblings,
        children,
        isCurrent: level === chain.length - 1,
      }
    })
  }

  /**
   * Returns all sibling nodes that share the exact same parent.
   */
  public getSiblings(nodeId: string): NavNode<TData>[] {
    const parentId = this.parentMap.get(nodeId)
    if (!parentId) {
      // Top-level root nodes
      return this.tree.filter((n) => !n.hideInMenu && !n.hideInNav && !n.hideInBreadcrumbs)
    }
    return (this.childrenMap.get(parentId) || []).filter(
      (n) => !n.hideInMenu && !n.hideInNav && !n.hideInBreadcrumbs
    )
  }

  /**
   * Returns immediate child options for a node.
   */
  public getChildren(nodeId: string): NavNode<TData>[] {
    return (this.childrenMap.get(nodeId) || []).filter(
      (n) => !n.hideInMenu && !n.hideInNav && !n.hideInBreadcrumbs
    )
  }

  /**
   * Registers a global navigation middleware guard.
   */
  public beforeEach(guard: NavigationGuard<TData>): () => void {
    this.guards.push(guard)
    return () => {
      this.guards = this.guards.filter((g) => g !== guard)
    }
  }

  /**
   * Speculatively prefetches a target route or node immediately.
   */
  public async prefetch(target: string | NavNode<TData>, force = false): Promise<any> {
    const resolved = typeof target === 'string' ? this.resolveNode(target) : { node: target, params: {} }
    if (!resolved?.node) return
    return this.prefetcher.prefetch(resolved.node, force)
  }

  /**
   * Debounces prefetching for hover intent (e.g. 65ms).
   */
  public prefetchOnIntent(target: string | NavNode<TData>, delayMs?: number): void {
    const resolved = typeof target === 'string' ? this.resolveNode(target) : { node: target, params: {} }
    if (!resolved?.node) return
    this.prefetcher.prefetchOnIntent(resolved.node, delayMs)
  }

  /**
   * Cancels a pending hover intent timer for a route.
   */
  public cancelPrefetch(target: string | NavNode<TData>): void {
    const id = typeof target === 'string' ? target : target.id
    this.prefetcher.cancelIntent(id)
  }

  /**
   * Returns the current prefetch status of a route.
   */
  public getPrefetchStatus(targetId: string): PrefetchStatus {
    return this.prefetcher.getStatus(targetId)
  }

  /**
   * Retrieves the cached component for a route if loaded.
   */
  public getCachedComponent(targetId: string): any | undefined {
    return this.prefetcher.getCachedComponent(targetId)
  }

  /**
   * Exposes the underlying RoutePrefetcher instance.
   */
  public getPrefetcher(): RoutePrefetcher {
    return this.prefetcher
  }

  /**
   * Parses URL search queries into key-value map.
   */
  private parseQuery(url: string): Record<string, string> {
    const queryIdx = url.indexOf('?')
    if (queryIdx === -1) return {}
    const search = url.slice(queryIdx + 1).split('#')[0]
    const params = new URLSearchParams(search)
    const result: Record<string, string> = {}
    params.forEach((val, key) => {
      result[key] = val
    })
    return result
  }

  /**
   * Navigates back in history.
   */
  public back(): void {
    if (this.adapter.back) {
      this.adapter.back()
    } else if (typeof window !== 'undefined' && window.history) {
      window.history.back()
    }
  }

  /**
   * Navigates forward in history.
   */
  public forward(): void {
    if (this.adapter.forward) {
      this.adapter.forward()
    } else if (typeof window !== 'undefined' && window.history) {
      window.history.forward()
    }
  }

  /**
   * Clean up engine subscriptions and prefetcher timers.
   */
  public override destroy(): void {
    this.prefetcher.destroy()
    if (this.unsubscribeAdapter) {
      this.unsubscribeAdapter()
    }
    super.destroy()
  }
}
