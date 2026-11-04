/**
 * Pure TypeScript Navigation Engine
 * Framework-agnostic hierarchical navigation graph coordinator, trail resolver,
 * route pattern matcher, and history manager.
 * Zero React dependencies.
 */

import { BaseEngine } from '@consona/interface-core'
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

const MAX_HISTORY_ENTRIES = 100
const MAX_GUARD_REDIRECTS = 8

export interface NavigationEngineConfig<TData = any> {
  /** Hierarchical navigation tree definition */
  tree?: NavTree<TData>
  /** Default active node ID or starting path */
  defaultId?: string
  /** Optional basename prefix (e.g. `/app`) stripped/applied to paths */
  basename?: string
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
  private basename: string
  /** Suppress adapter→engine sync while we are driving navigation ourselves */
  private internalNavDepth = 0

  constructor(config: NavigationEngineConfig<TData> = {}) {
    const adapter = config.adapter || new StateRouterAdapter(config.defaultId || '/')
    const basename = normalizeBasename(config.basename)
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
    this.basename = basename
    this.prefetcher = new RoutePrefetcher(config.prefetcher)

    if (config.guards) {
      this.guards = [...config.guards]
    }

    if (config.tree) {
      this.setTree(config.tree, config.defaultId)
    }

    this.bindAdapter(this.adapter)
  }

  /**
   * Swap the router adapter without recreating the engine.
   */
  public setAdapter(adapter: NavRouterAdapter): void {
    if (adapter === this.adapter) return
    this.bindAdapter(adapter)
  }

  private bindAdapter(adapter: NavRouterAdapter): void {
    if (this.unsubscribeAdapter) {
      this.unsubscribeAdapter()
      this.unsubscribeAdapter = undefined
    }
    this.adapter = adapter
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

    const currentPath = this.stripBasename(this.adapter.getCurrentPath())
    const targetId =
      initialActiveId ||
      (currentPath ? currentPath : this.state.activeId) ||
      (this.tree[0]?.id ?? '')
    const resolved =
      this.resolveNode(targetId) || (this.tree[0] ? this.resolveNode(this.tree[0].id) : null)

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
   * Does not mutate the input tree — parent links live in parentMap only.
   */
  private indexTree(nodes: NavNode<TData>[], parentId?: string): void {
    for (const node of nodes) {
      const resolvedParentId = node.parentId ?? parentId
      this.nodeMap.set(node.id, node)
      this.parentMap.set(node.id, resolvedParentId)
      this.indexHref(node)

      if (resolvedParentId) {
        if (!this.childrenMap.has(resolvedParentId)) {
          this.childrenMap.set(resolvedParentId, [])
        }
        this.childrenMap.get(resolvedParentId)!.push(node)
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
    options: NavigationOptions<TData> = {},
    redirectDepth = 0
  ): Promise<boolean> {
    const targetIdOrPath = typeof target === 'string' ? target : target.id
    const resolved = this.resolveNode(targetIdOrPath, options.params)

    if (!resolved || !resolved.node) {
      console.warn(`[NavigationEngine] Unable to resolve route for: "${targetIdOrPath}"`)
      this.emit('nav:not-found', { target: targetIdOrPath, options })
      return false
    }

    const toNode = resolved.node
    const fromNode = this.state.activeNode

    if (toNode.disabled) {
      console.warn(`[NavigationEngine] Refusing navigation to disabled route: "${toNode.id}"`)
      this.emit('nav:blocked', { to: toNode, from: fromNode, reason: 'disabled' })
      return false
    }

    // Run navigation guards
    for (const guard of this.guards) {
      const result = await guard(toNode, fromNode, options)
      if (result === false) {
        this.emit('nav:blocked', { to: toNode, from: fromNode, reason: 'guard' })
        return false
      }
      if (typeof result === 'string') {
        if (redirectDepth >= MAX_GUARD_REDIRECTS) {
          console.warn(
            `[NavigationEngine] Guard redirect depth exceeded (${MAX_GUARD_REDIRECTS}) for: "${result}"`
          )
          this.emit('nav:blocked', { to: toNode, from: fromNode, reason: 'guard-redirect-loop' })
          return false
        }
        return this.navigate(result, options, redirectDepth + 1)
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

    const adapterPath = this.applyBasename(finalPath)

    // Sync with router adapter without re-entering syncFromExternal
    this.internalNavDepth++
    try {
      if (options.replace) {
        this.adapter.replace(adapterPath, options.state)
      } else {
        this.adapter.push(adapterPath, options.state)
      }
    } finally {
      this.internalNavDepth--
    }

    const trail = this.buildTrail(toNode)
    const nextParams = { ...resolved.params, ...(options.params || {}) }
    const nextQuery = { ...this.parseQuery(finalPath), ...(options.query || {}) }
    const nextHistoryIndex = options.replace
      ? this.state.historyIndex
      : this.state.historyIndex + 1

    this.setState({
      activeId: toNode.id,
      currentPath: finalPath,
      activeNode: toNode,
      trail,
      params: nextParams,
      query: nextQuery,
      state: options.state || null,
      historyIndex: nextHistoryIndex,
    })

    if (options.replace && this.historyStack.length > 0) {
      this.historyStack[this.historyStack.length - 1] = {
        path: finalPath,
        id: toNode.id,
        state: options.state,
      }
    } else {
      this.historyStack.push({
        path: finalPath,
        id: toNode.id,
        state: options.state,
      })
      if (this.historyStack.length > MAX_HISTORY_ENTRIES) {
        this.historyStack.splice(0, this.historyStack.length - MAX_HISTORY_ENTRIES)
      }
    }

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
    if (this.internalNavDepth > 0) return

    const fromNode = this.state.activeNode
    const resolved = this.resolveNode(path)
    if (!resolved || !resolved.node) {
      this.emit('nav:not-found', { target: path, meta: { trigger: 'external' } })
      return
    }

    const toNode = resolved.node
    if (toNode.disabled) {
      this.emit('nav:blocked', { to: toNode, from: fromNode, reason: 'disabled' })
      return
    }

    // Skip no-op syncs (same active node + path)
    const cleanPath = this.stripBasename(this.cleanPath(path))
    if (
      fromNode?.id === toNode.id &&
      this.cleanPath(this.state.currentPath) === cleanPath
    ) {
      return
    }

    const trail = this.buildTrail(toNode)
    const nextParams = resolved.params
    const nextQuery = this.parseQuery(path)

    this.prefetcher.pinNodes(trail.map((s) => s.node.id))

    this.setState({
      activeId: toNode.id,
      currentPath: this.stripBasename(path) || path,
      activeNode: toNode,
      trail,
      params: nextParams,
      query: nextQuery,
      state: externalState || null,
    })

    this.emit('nav:change', {
      to: toNode,
      from: fromNode,
      trail,
      params: nextParams,
      query: nextQuery,
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

    const stripped = this.stripBasename(idOrPath)
    const cleanPath = this.cleanPath(stripped)

    // 2. Direct href match. Shared paths resolve to the nested page, not its folder.
    const hrefMatch =
      this.hrefMap.get(cleanPath) ||
      this.hrefMap.get(stripped) ||
      this.hrefMap.get(idOrPath)
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
    const seen = new Set<string>()

    while (current && !seen.has(current.id)) {
      seen.add(current.id)
      if (!current.hideInBreadcrumbs) {
        chain.unshift(current)
      }
      const parentId = this.parentMap.get(current.id)
      current = parentId ? this.nodeMap.get(parentId) : undefined
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
    const resolved =
      typeof target === 'string' ? this.resolveNode(target) : { node: target, params: {} }
    if (!resolved?.node) return
    return this.prefetcher.prefetch(resolved.node, force)
  }

  /**
   * Debounces prefetching for hover intent (e.g. 65ms).
   */
  public prefetchOnIntent(target: string | NavNode<TData>, delayMs?: number): void {
    const resolved =
      typeof target === 'string' ? this.resolveNode(target) : { node: target, params: {} }
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

  private cleanPath(idOrPath: string): string {
    return (idOrPath.split('?')[0] ?? '').split('#')[0] ?? ''
  }

  private stripBasename(path: string): string {
    if (!this.basename) return path
    const clean = this.cleanPath(path)
    const suffix = path.slice(clean.length)
    if (clean === this.basename) return `/${suffix}`
    if (clean.startsWith(`${this.basename}/`)) {
      return clean.slice(this.basename.length) + suffix
    }
    return path
  }

  private applyBasename(path: string): string {
    if (!this.basename) return path
    const clean = this.cleanPath(path)
    const suffix = path.slice(clean.length)
    if (clean === '/') return `${this.basename}${suffix}`
    return `${this.basename}${clean.startsWith('/') ? clean : `/${clean}`}${suffix}`
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
      this.unsubscribeAdapter = undefined
    }
    this.historyStack = []
    super.destroy()
  }
}

function normalizeBasename(basename?: string): string {
  if (!basename || basename === '/') return ''
  const trimmed = basename.replace(/\/+$/, '')
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}
