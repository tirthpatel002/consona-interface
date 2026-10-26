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
  adapter,
  engine: externalEngine,
  onNavigate,
  children,
}: NavigationProviderProps<TData>) {
  const onNavigateRef = useRef(onNavigate)
  onNavigateRef.current = onNavigate

  // Instantiate or reuse engine
  const internalEngine = useMemo(() => {
    if (externalEngine) return externalEngine
    return new NavigationEngine<TData>({
      tree: tree || [],
      defaultId: activeId || defaultId,
      adapter: adapter || new StateRouterAdapter(activeId || defaultId || '/'),
    })
  }, [externalEngine, adapter])

  const engine = externalEngine || internalEngine

  // Update tree dynamically if prop changes
  useEffect(() => {
    if (tree) {
      engine.setTree(tree, activeId)
    }
  }, [engine, tree, activeId])

  // Sync controlled activeId if provided
  useEffect(() => {
    if (activeId && engine.getState().activeId !== activeId) {
      engine.navigate(activeId)
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
