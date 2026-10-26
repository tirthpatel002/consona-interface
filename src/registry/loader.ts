import type {
  ComponentCategory,
  ComponentDoc,
  EngineDoc,
  HookDoc,
  InterfaceRegistry,
  MetadataRegistry,
  PluginDoc,
} from './types'

import registryData from './registry.json' with { type: 'json' }
import metadataData from './metadata-registry.json' with { type: 'json' }

export const registry: InterfaceRegistry = registryData as unknown as InterfaceRegistry
export const metadataRegistry: MetadataRegistry = metadataData as unknown as MetadataRegistry

export function getRegistry(): InterfaceRegistry {
  return registry
}

export function getMetadataRegistry(): MetadataRegistry {
  return metadataRegistry
}

export function getComponent(name: string): ComponentDoc | undefined {
  return registry.components[name]
}

export { resolveComponentDoc, listFamilyMembers, getResolvedSlots } from './resolve'

export function getEngine(name: string): EngineDoc | undefined {
  return registry.engines[name]
}

export function getHook(name: string): HookDoc | undefined {
  return registry.hooks[name]
}

export function getPlugin(name: string): PluginDoc | undefined {
  return registry.plugins[name]
}

export interface ComponentQueryFilter {
  category?: ComponentCategory
  module?: string
  search?: string
}

export function queryComponents(filter: ComponentQueryFilter = {}): ComponentDoc[] {
  return Object.values(registry.components).filter((comp) => {
    if (filter.category && comp.category !== filter.category) return false
    if (filter.module && comp.module !== filter.module) return false
    if (filter.search) {
      const q = filter.search.toLowerCase()
      const matchesName = comp.name.toLowerCase().includes(q)
      const matchesDesc = comp.description.toLowerCase().includes(q)
      const matchesProps = Object.keys(comp.props).some((p) => p.toLowerCase().includes(q))
      if (!matchesName && !matchesDesc && !matchesProps) return false
    }
    return true
  })
}

export function listCategories(): ComponentCategory[] {
  return Object.keys(metadataRegistry.categories) as ComponentCategory[]
}

export function listModules(): string[] {
  return Object.keys(registry.modules)
}
