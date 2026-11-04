import React, { useEffect, useState } from 'react'
import { createInterfaceComponent } from '@consona/interface-core'
import { useNavigation } from '../../context/use-navigation'
import type { NavNode } from '../../engine/types'

export interface NavOutletProps {
  /** Fallback content rendered when no component is mapped to active node */
  fallback?: React.ReactNode
  /** Content shown while a lazy route module is loading */
  pendingFallback?: React.ReactNode
  /** Custom render function receiving the active node and route params */
  render?: (node: NavNode | null, params: Record<string, any>) => React.ReactNode
}

function resolveSyncComponent(
  node: NavNode | null,
  getCached: (id: string) => any | undefined
): React.ComponentType<any> | null {
  if (!node) return null
  const cached = getCached(node.id)
  if (cached) return cached
  if (node.component && !node.lazy) return node.component
  return null
}

function NavOutletPrimitive({
  fallback = null,
  pendingFallback = null,
  render,
}: NavOutletProps) {
  const { activeNode, params, engine } = useNavigation()
  const [lazyComponent, setLazyComponent] = useState<React.ComponentType<any> | null>(() =>
    resolveSyncComponent(activeNode, (id) => engine.getCachedComponent(id))
  )
  const [isPending, setIsPending] = useState(false)
  const [loadError, setLoadError] = useState<unknown>(null)

  useEffect(() => {
    let cancelled = false

    setLoadError(null)

    if (!activeNode) {
      setLazyComponent(null)
      setIsPending(false)
      return
    }

    const sync = resolveSyncComponent(activeNode, (id) => engine.getCachedComponent(id))
    if (sync) {
      setLazyComponent(() => sync)
      setIsPending(false)
      return
    }

    if (!activeNode.lazy) {
      setLazyComponent(null)
      setIsPending(false)
      return
    }

    setIsPending(true)
    engine
      .prefetch(activeNode, true)
      .then((comp) => {
        if (cancelled) return
        setLazyComponent(() => comp ?? null)
        setIsPending(false)
      })
      .catch((err) => {
        if (cancelled) return
        setLoadError(err)
        setLazyComponent(null)
        setIsPending(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeNode, engine])

  if (render) {
    return <>{render(activeNode, params)}</>
  }

  if (!activeNode) {
    return <>{fallback}</>
  }

  if (isPending) {
    return <>{pendingFallback ?? fallback}</>
  }

  if (loadError) {
    return <>{fallback}</>
  }

  const Component =
    lazyComponent ||
    engine.getCachedComponent(activeNode.id) ||
    (!activeNode.lazy ? activeNode.component : null)

  if (!Component) {
    return <>{fallback}</>
  }

  return <Component {...params} />
}

/**
 * Automatically renders the active route component or custom render function.
 * Loads `node.lazy` modules on demand when they are not yet cached.
 */
export const NavOutlet = createInterfaceComponent<NavOutletProps, {}>(
  {
    name: 'NavOutlet',
    category: 'navigation',
    description:
      'Dynamic navigation route outlet for rendering active route components, including on-demand lazy loading.',
    version: '1.1.0',
    props: {},
    slots: {},
  },
  NavOutletPrimitive
)
