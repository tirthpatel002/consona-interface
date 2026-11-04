/**
 * Consona Interface Enhanced — Complete Registry Type Definitions
 * 
 * Defines the unified metadata schema for Components, Engines, Headless Hooks,
 * Plugins, and Subpath Modules extracted via static AST analysis.
 */

import type { ComponentCategory } from '../core/types'

export type { ComponentCategory }

export interface ComponentPropDoc {
  name: string
  type: string
  optional: boolean
  default?: string | number | boolean | null
  description?: string
  validValues?: string[]
  examples?: (string | number | boolean)[]
}

export interface ComponentSlotDoc {
  name: string
  type: string
  optional?: boolean
  description?: string
  defaultComponent?: string
  variants?: string[]
  stateType?: string
  props?: Record<string, ComponentPropDoc>
  /** Canonical occupant. `props` here is a delta over that occupant's props. */
  resolvesTo?: string
}

export interface RegistryGraphEdge {
  from: string
  slot?: string
  to: string
  kind: 'occupant' | 'variant' | 'attachment'
}

export interface ComponentHookDoc {
  name: string
  state: string[]
  actions: string[]
  helpers?: string[]
  ariaProps?: string[]
  description?: string
}

export interface ComponentExampleDoc {
  title: string
  description?: string
  code: string
}

export interface ComponentDoc {
  name: string
  category: ComponentCategory
  description: string
  module: string
  filePath: string
  tags?: string[]
  semanticClass?: string
  dataComponent?: string
  props: Record<string, ComponentPropDoc>
  /** Ordered list of serializable props in semantic positional-argument priority (for OpenUI Lang / DSL schema synthesis). */
  positionalProps?: string[]
  slots: Record<string, ComponentSlotDoc>
  hook?: ComponentHookDoc
  /** Canonical registry names of compound / family members. */
  subComponents?: string[]
  /** Compound attachments: { Header: "CalendarHeader" }. */
  attachments?: Record<string, string>
  aliases?: string[]
  aliasOf?: string
  examples?: ComponentExampleDoc[]
}

export interface EngineMethodDoc {
  name: string
  signature: string
  returnType: string
  description?: string
}

export interface EngineEventDoc {
  name: string
  payloadType: string
  description?: string
}

export interface ProviderDoc {
  name: string
  type: 'global' | 'plugin' | 'scoped'
  module: string
  description: string
  filePath: string
  tags?: string[]
  props: Record<string, ComponentPropDoc>
  contextValue?: Record<string, ComponentPropDoc>
  providedHooks: string[]
  providedEvents: string[]
  plugin?: string
}

export interface EngineDoc {
  name: string
  module: string
  description: string
  filePath: string
  tags?: string[]
  state: Record<string, ComponentPropDoc>
  methods: Record<string, EngineMethodDoc>
  events: Record<string, EngineEventDoc>
  plugin?: string
}

export interface HookReturnDoc {
  type: string
  description?: string
  state?: Record<string, ComponentPropDoc>
  actions?: Record<string, ComponentPropDoc>
  helpers?: Record<string, ComponentPropDoc>
  ariaProps?: Record<string, ComponentPropDoc>
}

export interface HookDoc {
  name: string
  type: 'utility' | 'engine' | 'headless'
  module: string
  description: string
  filePath: string
  tags?: string[]
  parameters: Record<string, ComponentPropDoc>
  returns: HookReturnDoc
  provider?: string
}

export interface PluginDoc {
  name: string
  module: string
  description: string
  filePath: string
  tags?: string[]
  hasProvider: boolean
  events: string[]
  components: string[]
}

export interface ModuleSummaryDoc {
  name: string
  subpath: string
  description: string
  tags?: string[]
  components: string[]
  providers: string[]
  engines: string[]
  hooks: string[]
  plugins: string[]
}

export interface TypeDoc {
  name: string
  kind: 'interface' | 'type' | 'union' | 'enum'
  module: string
  filePath: string
  tags?: string[]
  description?: string
  rawDefinition: string
  properties?: Record<string, ComponentPropDoc>
  unionValues?: string[]
  extends?: string[]
}

/**
 * Full Complete Registry Schema
 */
export interface InterfaceRegistry {
  version: string
  generatedAt: string
  components: Record<string, ComponentDoc>
  providers: Record<string, ProviderDoc>
  engines: Record<string, EngineDoc>
  hooks: Record<string, HookDoc>
  plugins: Record<string, PluginDoc>
  types: Record<string, TypeDoc>
  modules: Record<string, ModuleSummaryDoc>
  /** Compact occupant / family edges. Follow `to` in `components` for full props. */
  graph: RegistryGraphEdge[]
}

/**
 * Lightweight Metadata Registry Schema for Fast Search & Agent Prompt Ingestion
 */
export interface MetadataRegistryItem {
  name: string
  type: 'component' | 'provider' | 'engine' | 'hook' | 'plugin'
  category?: ComponentCategory
  module: string
  description: string
  tags?: string[]
  semanticClass?: string
  dataComponent?: string
  slots?: string[]
  props?: string[]
  positionalProps?: string[]
  hook?: string
  provider?: string
  aliases?: string[]
  aliasOf?: string
}

export interface MetadataRegistry {
  version: string
  generatedAt: string
  items: Record<string, MetadataRegistryItem>
  categories: Record<ComponentCategory, string[]>
  modules: Record<string, string[]>
  tags: Record<string, string[]>
}

export type EntityKind = 'component' | 'engine' | 'hook' | 'provider' | 'plugin' | 'type' | 'module'

export interface FilePathResult {
  name: string
  kind: EntityKind
  relativeFilePath: string
  absoluteFilePath: string
  exists: boolean
}

export interface CodeResult {
  name: string
  kind: EntityKind
  filePath: string
  absoluteFilePath: string
  language: string
  code: string
}
