import React, { useEffect, useMemo, useRef } from 'react'
import type { NavTree, NavRouterAdapter, NavNode, NavigationOptions } from '../engine/types'
import { NavigationEngine } from '../engine/navigation-engine'
import { NavigationContext } from './navigation-context'
import { StateRouterAdapter } from '../engine/adapters/state-adapter'

export interface NavigationProviderProps<TData = any> {
  /** Hierarchical navigation tree definition */
  tree?: NavTree<TData>
  /** Active node ID (controlled) */
  activeId?: string
  /** Default active node ID */
  defaultId?: string
  /** Optional basename for nested deployments (e.g. `/app`) */
  basename?: string
  /** Pluggable router adapter */
  adapter?: NavRouterAdapter
  /** Custom pre-instantiated NavigationEngine */
  engine?: NavigationEngine<TData>
  /** Callback fired whenever navigation occurs */
  onNavigate?: (node: NavNode<TData>, options?: NavigationOptions<TData>) => void
  /** React child elements */
  children?: React.ReactNode
}

export function NavigationProvider<TData = any>({
  tree,
  activeId,
  defaultId,
  basename,
  adapter,
  engine: externalEngine,
  onNavigate,
  children,
}: NavigationProviderProps<TData>) {
  const onNavigateRef = useRef(onNavigate)
  onNavigateRef.current = onNavigate

  const ownedEngineRef = useRef<NavigationEngine<TData> | null>(null)

  // Create a stable owned engine once; swap adapters/trees via engine APIs.
  const ownedEngine = useMemo(() => {
    if (externalEngine) return null
    const engine = new NavigationEngine<TData>({
      tree: tree || [],
      defaultId: activeId || defaultId,
      basename,
      adapter: adapter || new StateRouterAdapter(activeId || defaultId || '/'),
    })
    ownedEngineRef.current = engine
    return engine
    // Intentionally omit tree/adapter — applied via effects below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalEngine, basename])

  const engine = externalEngine || ownedEngine!

  // Destroy owned engine on unmount or when a new owned instance replaces it
  useEffect(() => {
    if (externalEngine) return
    return () => {
      ownedEngineRef.current?.destroy()
      ownedEngineRef.current = null
    }
  }, [externalEngine, ownedEngine])

  // Hot-swap adapter without recreating the engine
  useEffect(() => {
    if (externalEngine || !adapter) return
    engine.setAdapter(adapter)
  }, [engine, adapter, externalEngine])

  // Update tree dynamically if prop changes
  useEffect(() => {
    if (tree) {
      engine.setTree(tree, activeId)
    }
  }, [engine, tree, activeId])

  // Sync controlled activeId if provided
  useEffect(() => {
    if (activeId && engine.getState().activeId !== activeId) {
      void engine.navigate(activeId)
    }
  }, [engine, activeId])

  // Subscribe to navigation changes to dispatch onNavigate callback
  useEffect(() => {
    const unsub = engine.on('nav:change', ({ to, state, params, query, meta }) => {
      onNavigateRef.current?.(to, { state, params, query, meta })
    })
    return unsub
  }, [engine])

  return (
    <NavigationContext.Provider value={engine}>
      {children}
    </NavigationContext.Provider>
  )
}
