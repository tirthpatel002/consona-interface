import registryJson from '@registry/registry.json'
import metadataJson from '@registry/metadata-registry.json'
import type {
  ComponentCategory,
  ComponentDoc,
  EngineDoc,
  HookDoc,
  PluginDoc,
  ProviderDoc,
  TypeDoc,
  InterfaceRegistry,
  MetadataRegistry,
  ModuleSummaryDoc,
} from '@registry/types'
import {
  inferResolvedSlotTarget,
  listFamilyMembers,
  resolveAnyDoc,
  resolveComponentDoc,
} from '@registry/resolve'
import { RegistrySearchEngine, type SearchHit, type SearchOptions } from '@registry/search-engine'

export { inferResolvedSlotTarget, listFamilyMembers, resolveAnyDoc, resolveComponentDoc, RegistrySearchEngine }
export type { ProviderDoc, EngineDoc, HookDoc, ComponentDoc, PluginDoc, TypeDoc, SearchHit, SearchOptions }

export const registry = registryJson as unknown as InterfaceRegistry
export const metadataRegistry = metadataJson as unknown as MetadataRegistry
export const searchEngine = new RegistrySearchEngine(registry, metadataRegistry)

export function searchRegistry(query: string, options?: SearchOptions): SearchHit[] {
  return searchEngine.search(query, options)
}

export function getComponentDoc(name: string, rootName?: string): ComponentDoc | undefined {
  return resolveComponentDoc(registry, name, rootName)
}

export function getAllComponents(): ComponentDoc[] {
  return Object.values(registry.components)
}

export function getComponentsByCategory(category: ComponentCategory): ComponentDoc[] {
  return Object.values(registry.components).filter((c) => c.category === category)
}

export function getAllCategories(): string[] {
  return Object.keys(metadataRegistry.categories)
}

export function getProviderDoc(name: string): ProviderDoc | undefined {
  return registry.providers ? registry.providers[name] : undefined
}

export function getAllProviders(): ProviderDoc[] {
  return registry.providers ? Object.values(registry.providers) : []
}

export function getEngineDoc(name: string): EngineDoc | undefined {
  return registry.engines[name]
}

export function getAllEngines(): EngineDoc[] {
  return Object.values(registry.engines)
}

export function getHookDoc(name: string): HookDoc | undefined {
  return registry.hooks[name]
}

export function getAllHooks(): HookDoc[] {
  return Object.values(registry.hooks)
}

export function getPluginDoc(name: string): PluginDoc | undefined {
  return registry.plugins ? registry.plugins[name] : undefined
}

export function getAllPlugins(): PluginDoc[] {
  return registry.plugins ? Object.values(registry.plugins) : []
}

export function getTypeDoc(name: string): TypeDoc | undefined {
  return registry.types ? registry.types[name] : undefined
}

export function getAllTypes(): TypeDoc[] {
  return registry.types ? Object.values(registry.types) : []
}

export function isRegisteredType(name: string): boolean {
  return Boolean(registry.types && registry.types[name])
}

export function getModuleDoc(subpath: string): ModuleSummaryDoc | undefined {
  return registry.modules[subpath]
}

