import type { ComponentType, ReactNode } from 'react'
import type { InterfaceEventListener } from './event-bus'

export interface InterfacePlugin {
  name: string
  version?: string
  description?: string
  tags?: string[]
  /** React Provider wrapping the tree for this feature */
  Provider?: ComponentType<{ children: ReactNode; options?: Record<string, any> }>
  /** Optional engine/provider options (storage adapters, z-index, flags). */
  options?: Record<string, any>
  /** Global component / slot overrides bundled with this plugin */
  components?: Record<string, ComponentType<any>>
  /** Global event listeners across engines. Keys may be exact or wildcards (`*:error`). */
  events?: Record<string, InterfaceEventListener>
}

/**
 * Type-safe helper for authoring Consona plugins
 */
export function definePlugin(plugin: InterfacePlugin): InterfacePlugin {
  return plugin
}
