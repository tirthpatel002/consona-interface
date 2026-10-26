import React, { useContext } from 'react'
import { NavigationContext } from './navigation-context'
import { useEngineState } from '../../../core/hooks'
import type { NavNode, NavigationOptions, NavTrailStep, NavigationState, PrefetchStatus } from '../engine/types'
import type { NavigationEngine } from '../engine/navigation-engine'

export interface UseNavigationReturn<TData = any> extends NavigationState<TData> {
  /** Programmatically navigate to target node ID or path */
  navigate: (target: string | NavNode<TData>, options?: NavigationOptions<TData>) => Promise<boolean>
  /** Navigates back in browser history */
  back: () => void
  /** Navigates forward in browser history */
  forward: () => void
  /** Speculatively prefetches a route component immediately */
  prefetch: (target: string | NavNode<TData>, force?: boolean) => Promise<any>
  /** Debounces prefetching based on user hover intent (default 65ms) */
  prefetchOnIntent: (target: string | NavNode<TData>, delayMs?: number) => void
  /** Cancels a pending hover intent timer */
  cancelPrefetch: (target: string | NavNode<TData>) => void
  /** Gets prefetch status for a route ID */
  getPrefetchStatus: (id: string) => PrefetchStatus
  /** Resolves trail for any node ID */
  getTrail: (id: string) => NavTrailStep<TData>[]
  /** Retrieves children of a given node */
  getChildren: (id: string) => NavNode<TData>[]
  /** Retrieves siblings of a given node */
  getSiblings: (id: string) => NavNode<TData>[]
  /** Raw NavigationEngine instance */
  engine: NavigationEngine<TData>
}

export function useNavigation<TData = any>(): UseNavigationReturn<TData> {
  const engine = useContext(NavigationContext) as NavigationEngine<TData> | null

  if (!engine) {
    throw new Error(
      '[useNavigation] Must be used within a <NavigationProvider> or with an initialized NavigationEngine.'
    )
  }

  const state = useEngineState(engine)

  const navigate = (target: string | NavNode<TData>, options?: NavigationOptions<TData>) => {
    return new Promise<boolean>((resolve) => {
      if (typeof React.startTransition === 'function') {
        React.startTransition(() => {
          engine.navigate(target, options).then(resolve)
        })
      } else {
        engine.navigate(target, options).then(resolve)
      }
    })
  }

  return {
    ...state,
    navigate,
    back: () => engine.back(),
    forward: () => engine.forward(),
    prefetch: (target, force) => engine.prefetch(target, force),
    prefetchOnIntent: (target, delay) => engine.prefetchOnIntent(target, delay),
    cancelPrefetch: (target) => engine.cancelPrefetch(target),
    getPrefetchStatus: (id) => engine.getPrefetchStatus(id),
    getTrail: (id) => {
      const resolved = engine.resolveNode(id)
      return resolved?.node ? engine.buildTrail(resolved.node) : []
    },
    getChildren: (id) => engine.getChildren(id),
    getSiblings: (id) => engine.getSiblings(id),
    engine,
  }
}
