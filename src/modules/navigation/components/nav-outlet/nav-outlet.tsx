import React from 'react'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { useNavigation } from '../../context/use-navigation'
import type { NavNode } from '../../engine/types'

export interface NavOutletProps {
  /** Fallback content rendered when no component is mapped to active node */
  fallback?: React.ReactNode
  /** Custom render function receiving the active node and route params */
  render?: (node: NavNode | null, params: Record<string, any>) => React.ReactNode
}

function NavOutletPrimitive({ fallback = null, render }: NavOutletProps) {
  const { activeNode, params, engine } = useNavigation()

  if (render) {
    return <>{render(activeNode, params)}</>
  }

  if (!activeNode) {
    return <>{fallback}</>
  }

  const Component = engine.getCachedComponent(activeNode.id) || activeNode.component
  if (!Component) {
    return <>{fallback}</>
  }

  return <Component {...params} />
}

/**
 * Automatically renders the active route component or custom render function.
 */
export const NavOutlet = createInterfaceComponent<NavOutletProps, {}>(
  {
    name: 'NavOutlet',
    category: 'navigation',
    description: 'Dynamic navigation route outlet for rendering active route components.',
    version: '1.0.0',
    props: {},
    slots: {},
  },
  NavOutletPrimitive
)

