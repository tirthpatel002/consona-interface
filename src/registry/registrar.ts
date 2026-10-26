/**
 * Consona Interface Enhanced — Universal Interface Registrar
 * 
 * Production-ready, highly informative, token-efficient query engine and catalog
 * for Developers and AI Agents to inspect components, slots, compound subcomponents,
 * hooks, engines, providers, plugins, and types with zero hallucination and zero context overloading.
 */

import registryData from './registry.json' with { type: 'json' }
import metadataData from './metadata-registry.json' with { type: 'json' }
import type {
  ComponentCategory,
  ComponentDoc,
  ComponentPropDoc,
  ComponentSlotDoc,
  EngineDoc,
  HookDoc,
  InterfaceRegistry,
  MetadataRegistry,
  MetadataRegistryItem,
  PluginDoc,
  ProviderDoc,
  TypeDoc,
  EntityKind,
  FilePathResult,
  CodeResult,
} from './types'
import { resolveComponentDoc, listFamilyMembers, getResolvedSlots } from './resolve'
import { RegistrySearchEngine, type SearchHit, type SearchOptions } from './search-engine'

export type { SearchHit, SearchOptions }
export { RegistrySearchEngine }

function getRuntimeFs(): any {
  if (typeof window !== 'undefined' || typeof document !== 'undefined') {
    return null
  }
  try {
    const proc = (globalThis as any).process
    if (proc && proc.versions?.node) {
      if (typeof proc.getBuiltinModule === 'function') {
        return proc.getBuiltinModule('fs')
      }
      const nodeRequire = (globalThis as any).require
      if (typeof nodeRequire === 'function') {
        return nodeRequire('fs')
      }
    }
  } catch {}
  return null
}

function isAbsolutePath(p: string): boolean {
  return p.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(p)
}

function joinPaths(...parts: (string | undefined)[]): string {
  return parts
    .filter((p): p is string => typeof p === 'string' && p.length > 0)
    .join('/')
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
}

function getDirname(p: string): string {
  const normalized = p.replace(/\\/g, '/')
  const idx = normalized.lastIndexOf('/')
  return idx !== -1 ? normalized.substring(0, idx) : '.'
}

function getExtname(p: string): string {
  const normalized = p.replace(/\\/g, '/')
  const base = normalized.substring(normalized.lastIndexOf('/') + 1)
  const idx = base.lastIndexOf('.')
  return idx > 0 ? base.substring(idx) : ''
}

function getPackageRoot(): string {
  try {
    const proc = (globalThis as any).process
    if (proc && typeof proc.cwd === 'function') {
      return proc.cwd()
    }
  } catch {}
  return ''
}

function loadDefaultRegistry(): InterfaceRegistry {
  return registryData as unknown as InterfaceRegistry
}

function loadDefaultMetadata(): MetadataRegistry {
  return metadataData as unknown as MetadataRegistry
}

export interface OutputOptions {
  /** Output format */
  format?: 'markdown' | 'json' | 'raw'
  /** Write output to a file. If boolean `true`, writes to default `./interface-catalog.md`. If string, writes to specified path. */
  writeToFile?: boolean | string
  /** Include detailed prop types and JSDoc */
  detailed?: boolean
  /** Include code examples if available */
  includeExamples?: boolean
}

export interface CatalogSummary {
  version: string
  generatedAt: string
  totalComponents: number
  totalSubcomponents: number
  totalEngines: number
  totalHooks: number
  totalProviders: number
  totalPlugins: number
  totalTypes: number
  totalModules: number
  modules: string[]
  categories: string[]
}

export class InterfaceRegistrar {
  private registry: InterfaceRegistry
  private metadata: MetadataRegistry
  private searchEngine: RegistrySearchEngine

  constructor(customRegistry?: InterfaceRegistry, customMetadata?: MetadataRegistry) {
    this.registry = customRegistry || loadDefaultRegistry()
    this.metadata = customMetadata || loadDefaultMetadata()
    this.searchEngine = new RegistrySearchEngine(this.registry, this.metadata)
  }

  // ===========================================================================
  // 1. Root-Level Catalog & Statistics
  // ===========================================================================

  /**
   * Retrieves high-level catalog statistics across all domains.
   */
  public getSummary(): CatalogSummary {
    const compList = Object.values(this.registry.components)
    const subcompCount = compList.reduce(
      (acc, c) => acc + (c.subComponents?.length || 0),
      0
    )

    return {
      version: this.registry.version,
      generatedAt: this.registry.generatedAt,
      totalComponents: compList.length,
      totalSubcomponents: subcompCount,
      totalEngines: Object.keys(this.registry.engines).length,
      totalHooks: Object.keys(this.registry.hooks).length,
      totalProviders: Object.keys(this.registry.providers).length,
      totalPlugins: Object.keys(this.registry.plugins).length,
      totalTypes: Object.keys(this.registry.types || {}).length,
      totalModules: Object.keys(this.registry.modules).length,
      modules: Object.keys(this.registry.modules),
      categories: Object.keys(this.metadata.categories),
    }
  }

  /**
   * Generates a comprehensive root-level catalog of all entities.
   */
  public getCatalog(options: OutputOptions = {}): string | Record<string, any> {
    const summary = this.getSummary()

    if (options.format === 'json') {
      const result = {
        summary,
        modules: this.registry.modules,
        categories: this.metadata.categories,
      }
      this.handleFileOutput(JSON.stringify(result, null, 2), options.writeToFile, 'interface-catalog.json')
      return result
    }

    let md = `# 🌐 Consona Interface Root Catalog\n\n`
    md += `> **Universal Interface Registry & Architecture Index (v${summary.version})**\n\n`
    md += `**Generated:** ${summary.generatedAt}  \n`
    md += `**Overview:** **${summary.totalComponents}** Components | **${summary.totalEngines}** Engines | **${summary.totalHooks}** Hooks | **${summary.totalProviders}** Providers | **${summary.totalPlugins}** Plugins\n\n`
    md += `---\n\n`

    md += `## 📊 Module Catalog Index\n\n`
    md += `| Module | Subpath | Components | Engines | Hooks | Providers |\n`
    md += `| :--- | :--- | :---: | :---: | :---: | :---: |\n`

    for (const [modKey, mod] of Object.entries(this.registry.modules)) {
      md += `| [**\`${mod.name}\`**](#module-${modKey.toLowerCase()}) | \`${mod.subpath}\` | ${mod.components.length} | ${mod.engines.length} | ${mod.hooks.length} | ${mod.providers.length} |\n`
    }
    md += `\n---\n\n`

    md += `## 📦 Detailed Module Breakdowns\n\n`

    for (const [modKey, mod] of Object.entries(this.registry.modules)) {
      md += `<a id="module-${modKey.toLowerCase()}"></a>\n`
      md += `### Module: \`${mod.name}\` (\`${mod.subpath}\`)\n\n`
      md += `${mod.description}\n\n`

      if (mod.components.length > 0) {
        md += `#### Components (${mod.components.length})\n`
        for (const compName of mod.components) {
          const comp = this.registry.components[compName]
          const subcomps = comp?.subComponents?.length ? ` (Subcomponents: ${comp.subComponents.join(', ')})` : ''
          md += `- **\`${compName}\`** (${comp?.category || 'general'}): ${comp?.description || 'Interface component.'}${subcomps}\n`
        }
        md += `\n`
      }

      if (mod.engines.length > 0) {
        md += `#### Engines (${mod.engines.length})\n`
        for (const engName of mod.engines) {
          const eng = this.registry.engines[engName]
          md += `- **\`${engName}\`**: ${eng?.description || 'Pure TypeScript engine.'}\n`
        }
        md += `\n`
      }

      if (mod.hooks.length > 0) {
        md += `#### Hooks (${mod.hooks.length})\n`
        for (const hookName of mod.hooks) {
          const hook = this.registry.hooks[hookName]
          md += `- **\`${hookName}\`** (${hook?.type || 'headless'}): ${hook?.description || 'Domain hook.'}\n`
        }
        md += `\n`
      }

      if (mod.providers.length > 0) {
        md += `#### Providers (${mod.providers.length})\n`
        for (const provName of mod.providers) {
          const prov = this.registry.providers[provName]
          md += `- **\`${provName}\`** (${prov?.type || 'scoped'}): ${prov?.description || 'Provider.'}\n`
        }
        md += `\n`
      }

      md += `---\n\n`
    }

    this.handleFileOutput(md, options.writeToFile, 'interface-catalog.md')
    return md
  }

  // ===========================================================================
  // 2. Universal & Entity Inspection
  // ===========================================================================

  /**
   * Universal inspector that automatically detects and resolves any entity:
   * Component, Compound Subcomponent, Engine, Hook, Provider, Plugin, Type, or Module.
   */
  public inspect(rawName: string, options: OutputOptions = {}): string | Record<string, any> | undefined {
    const trimmed = rawName.trim()

    // 1. Check Component / Subcomponent
    const comp = resolveComponentDoc(this.registry, trimmed)
    if (comp) return this.inspectComponent(comp.name, options)

    // 2. Check Engine
    const eng = this.registry.engines[trimmed] || Object.values(this.registry.engines).find((e) => e.name.toLowerCase() === trimmed.toLowerCase())
    if (eng) return this.inspectEngine(eng.name, options)

    // 3. Check Hook
    const hook = this.registry.hooks[trimmed] || Object.values(this.registry.hooks).find((h) => h.name.toLowerCase() === trimmed.toLowerCase())
    if (hook) return this.inspectHook(hook.name, options)

    // 4. Check Provider
    const prov = this.registry.providers[trimmed] || Object.values(this.registry.providers).find((p) => p.name.toLowerCase() === trimmed.toLowerCase())
    if (prov) return this.inspectProvider(prov.name, options)

    // 5. Check Plugin
    const plug = this.registry.plugins[trimmed] || Object.values(this.registry.plugins).find((p) => p.name.toLowerCase() === trimmed.toLowerCase())
    if (plug) return this.inspectPlugin(plug.name, options)

    // 6. Check Type
    const typeDoc = this.registry.types?.[trimmed] || Object.values(this.registry.types || {}).find((t) => t.name.toLowerCase() === trimmed.toLowerCase())
    if (typeDoc) return this.inspectType(typeDoc.name, options)

    // 7. Check Module
    const mod = this.registry.modules[trimmed] || Object.values(this.registry.modules).find((m) => m.name.toLowerCase() === trimmed.toLowerCase() || m.subpath.toLowerCase() === trimmed.toLowerCase())
    if (mod) return this.inspectModule(mod.name, options)

    return undefined
  }

  /**
   * Internal resolver for entity metadata (name, kind, filePath, rawDefinition).
   */
  public resolveEntityInfo(rawName: string): { name: string; kind: EntityKind; filePath: string; rawDefinition?: string } | undefined {
    const trimmed = rawName.trim()

    // 1. Check Component / Subcomponent
    const comp = resolveComponentDoc(this.registry, trimmed)
    if (comp) return { name: comp.name, kind: 'component', filePath: comp.filePath }

    // 2. Check Engine
    const eng = this.registry.engines[trimmed] || Object.values(this.registry.engines).find((e) => e.name.toLowerCase() === trimmed.toLowerCase())
    if (eng) return { name: eng.name, kind: 'engine', filePath: eng.filePath }

    // 3. Check Hook
    const hook = this.registry.hooks[trimmed] || Object.values(this.registry.hooks).find((h) => h.name.toLowerCase() === trimmed.toLowerCase())
    if (hook) return { name: hook.name, kind: 'hook', filePath: hook.filePath }

    // 4. Check Provider
    const prov = this.registry.providers[trimmed] || Object.values(this.registry.providers).find((p) => p.name.toLowerCase() === trimmed.toLowerCase())
    if (prov) return { name: prov.name, kind: 'provider', filePath: prov.filePath }

    // 5. Check Plugin
    const plug = this.registry.plugins[trimmed] || Object.values(this.registry.plugins).find((p) => p.name.toLowerCase() === trimmed.toLowerCase())
    if (plug) return { name: plug.name, kind: 'plugin', filePath: plug.filePath }

    // 6. Check Type
    const typeDoc = this.registry.types?.[trimmed] || Object.values(this.registry.types || {}).find((t) => t.name.toLowerCase() === trimmed.toLowerCase())
    if (typeDoc) return { name: typeDoc.name, kind: 'type', filePath: typeDoc.filePath, rawDefinition: typeDoc.rawDefinition }

    // 7. Check Module
    const mod = this.registry.modules[trimmed] || Object.values(this.registry.modules).find((m) => m.name.toLowerCase() === trimmed.toLowerCase() || m.subpath.toLowerCase() === trimmed.toLowerCase())
    if (mod) {
      const moduleSlug = mod.subpath.replace('@consona/interface/', '').replace('@consona/interface', 'core')
      return { name: mod.name, kind: 'module', filePath: `src/modules/${moduleSlug}/index.ts` }
    }

    return undefined
  }

  /**
   * Resolves the relative and absolute filesystem path for any entity.
   */
  public getFilePath(rawName: string, options: OutputOptions = {}): string | FilePathResult | undefined {
    const entity = this.resolveEntityInfo(rawName)
    if (!entity) return undefined

    const root = getPackageRoot()
    const absPath = isAbsolutePath(entity.filePath) ? entity.filePath : (root ? joinPaths(root, entity.filePath) : entity.filePath)
    const fsModule = getRuntimeFs()
    const exists = fsModule ? fsModule.existsSync(absPath) : false

    const result: FilePathResult = {
      name: entity.name,
      kind: entity.kind,
      relativeFilePath: entity.filePath,
      absoluteFilePath: absPath,
      exists,
    }

    if (options.format === 'raw' || options.format === 'json') {
      if (options.writeToFile) {
        this.handleFileOutput(JSON.stringify(result, null, 2), options.writeToFile, `${entity.name}-filepath.json`)
      }
      return result
    }

    let md = `## 📁 File Path for \`${entity.name}\`\n\n`
    md += `- **Kind:** \`${entity.kind}\`\n`
    md += `- **Relative Path:** \`${entity.filePath}\`\n`
    md += `- **Absolute Path:** \`${absPath}\`\n`
    md += `- **Exists on Disk:** ${exists ? '✅ Yes' : '❌ No'}\n`

    this.handleFileOutput(md, options.writeToFile, `${entity.name}-filepath.md`)
    return md
  }

  /**
   * Alias for getFilePath.
   */
  public inspectFilePath(rawName: string, options: OutputOptions = {}): string | FilePathResult | undefined {
    return this.getFilePath(rawName, options)
  }

  /**
   * Reads and returns the exact source code for any entity (component, engine, hook, provider, plugin, type).
   */
  public getCode(rawName: string, options: OutputOptions = {}): string | CodeResult | undefined {
    const entity = this.resolveEntityInfo(rawName)
    if (!entity) return undefined

    const root = getPackageRoot()
    const absPath = isAbsolutePath(entity.filePath) ? entity.filePath : (root ? joinPaths(root, entity.filePath) : entity.filePath)
    const fsModule = getRuntimeFs()

    if (!fsModule || !fsModule.existsSync(absPath)) {
      if (entity.kind === 'type' && entity.rawDefinition) {
        const codeResult: CodeResult = {
          name: entity.name,
          kind: 'type',
          filePath: entity.filePath || 'types.ts',
          absoluteFilePath: absPath,
          language: 'typescript',
          code: entity.rawDefinition,
        }
        if (options.format === 'raw' || options.format === 'json') {
          return codeResult
        }
        return `\`\`\`typescript\n${entity.rawDefinition}\n\`\`\``
      }
      return undefined
    }

    const code = fsModule.readFileSync(absPath, 'utf-8')
    const ext = getExtname(absPath).toLowerCase()
    const language = ext === '.tsx' ? 'tsx' : ext === '.json' ? 'json' : 'typescript'

    const codeResult: CodeResult = {
      name: entity.name,
      kind: entity.kind,
      filePath: entity.filePath,
      absoluteFilePath: absPath,
      language,
      code,
    }

    if (options.format === 'raw' || options.format === 'json') {
      if (options.writeToFile) {
        this.handleFileOutput(JSON.stringify(codeResult, null, 2), options.writeToFile, `${entity.name}-code.json`)
      }
      return codeResult
    }

    let md = `## 💻 Source Code for \`${entity.name}\` (\`${entity.filePath}\`)\n\n`
    md += `\`\`\`${language}\n${code}\n\`\`\`\n`

    this.handleFileOutput(md, options.writeToFile, `${entity.name}-code.md`)
    return md
  }

  /**
   * Alias for getCode.
   */
  public inspectCode(rawName: string, options: OutputOptions = {}): string | CodeResult | undefined {
    return this.getCode(rawName, options)
  }

  /**
   * Dedicated Props inspector for components.
   */
  public inspectProps(rawName: string, options: OutputOptions = {}): string | Record<string, ComponentPropDoc> | undefined {
    const comp = resolveComponentDoc(this.registry, rawName)
    if (!comp) return undefined

    if (options.format === 'raw' || options.format === 'json') {
      if (options.writeToFile) {
        this.handleFileOutput(JSON.stringify(comp.props, null, 2), options.writeToFile, `${comp.name}-props.json`)
      }
      return comp.props
    }

    let md = `## ⚙️ Props Specification for \`${comp.name}\`\n\n`
    md += `| Prop | Type | Default | Required | Description |\n`
    md += `| :--- | :--- | :--- | :---: | :--- |\n`
    for (const [propKey, prop] of Object.entries(comp.props)) {
      const defStr = prop.default !== undefined ? `\`${String(prop.default)}\`` : '-'
      const reqStr = prop.optional ? 'Optional' : '**Required**'
      const typeStr = `\`${prop.type.replace(/\|/g, '\\|')}\``
      md += `| **\`${propKey}\`** | ${typeStr} | ${defStr} | ${reqStr} | ${prop.description || '-'} |\n`
    }

    this.handleFileOutput(md, options.writeToFile, `${comp.name}-props.md`)
    return md
  }

  /**
   * Dedicated Slots inspector for components (Rule C5).
   */
  public inspectSlots(rawName: string, options: OutputOptions = {}): string | Record<string, ComponentSlotDoc> | undefined {
    const comp = resolveComponentDoc(this.registry, rawName)
    if (!comp) return undefined

    if (options.format === 'raw' || options.format === 'json') {
      if (options.writeToFile) {
        this.handleFileOutput(JSON.stringify(comp.slots, null, 2), options.writeToFile, `${comp.name}-slots.json`)
      }
      return comp.slots
    }

    let md = `## 🎯 Slot Surface for \`${comp.name}\` (Rule C5)\n\n`
    if (Object.keys(comp.slots).length === 0) {
      md += `Component \`${comp.name}\` has no customizable slot injection points.\n`
    } else {
      md += `| Slot | Type | Default Occupant | Resolves To | Description |\n`
      md += `| :--- | :--- | :--- | :--- | :--- |\n`
      for (const [slotKey, slot] of Object.entries(comp.slots)) {
        const defOcc = slot.defaultComponent ? `\`${slot.defaultComponent}\`` : '-'
        const resTo = slot.resolvesTo ? `\`${slot.resolvesTo}\`` : '-'
        const typeStr = `\`${slot.type.replace(/\|/g, '\\|')}\``
        md += `| **\`${slotKey}\`** | ${typeStr} | ${defOcc} | ${resTo} | ${slot.description || '-'} |\n`
      }
    }

    this.handleFileOutput(md, options.writeToFile, `${comp.name}-slots.md`)
    return md
  }

  /**
   * Dedicated Compound Subcomponents inspector (Rule C6 & C8).
   */
  public inspectComposites(rawName: string, options: OutputOptions = {}): string | Record<string, any> | undefined {
    const comp = resolveComponentDoc(this.registry, rawName)
    if (!comp) return undefined

    const subcomps = comp.subComponents || []
    const attachments = comp.attachments || {}

    const compoundData = {
      root: comp.name,
      subComponents: subcomps,
      attachments,
      contextHook: comp.hook?.name,
      members: subcomps.map((s) => this.registry.components[s]).filter(Boolean),
    }

    if (options.format === 'raw' || options.format === 'json') {
      if (options.writeToFile) {
        this.handleFileOutput(JSON.stringify(compoundData, null, 2), options.writeToFile, `${comp.name}-composites.json`)
      }
      return compoundData
    }

    let md = `## 🧩 Compound Architecture for \`${comp.name}\` (Rule C6 & C8)\n\n`
    if (subcomps.length === 0) {
      md += `Component \`${comp.name}\` is a standalone component without compound subcomponents.\n`
    } else {
      md += `### Static Subcomponent Attachments (\`Root.Part\`)\n\n`
      for (const sub of subcomps) {
        const subDoc = this.registry.components[sub]
        const alias = Object.entries(attachments).find(([, v]) => v === sub)?.[0]
        const dotName = alias ? `${comp.name}.${alias}` : sub
        md += `- **\`<${dotName} />\`** (\`${sub}\`): ${subDoc?.description || 'Compound subcomponent.'}\n`
      }
      md += `\n### Usage Example\n\n`
      md += `\`\`\`tsx\n<${comp.name}>\n`
      for (const sub of subcomps) {
        const alias = Object.entries(attachments).find(([, v]) => v === sub)?.[0]
        const dotName = alias ? `${comp.name}.${alias}` : sub
        md += `  <${dotName} />\n`
      }
      md += `</${comp.name}>\n\`\`\`\n`
    }

    this.handleFileOutput(md, options.writeToFile, `${comp.name}-composites.md`)
    return md
  }

  /**
   * Alias for inspectComposites (Rule C6 & C8).
   */
  public inspectSubComponents(rawName: string, options: OutputOptions = {}): string | Record<string, any> | undefined {
    return this.inspectComposites(rawName, options)
  }

  /**
   * Dedicated Module inspector.
   */
  public inspectModule(moduleName: string, options: OutputOptions = {}): string | Record<string, any> | undefined {
    const mod = this.registry.modules[moduleName] || Object.values(this.registry.modules).find((m) => m.name.toLowerCase() === moduleName.toLowerCase() || m.subpath.toLowerCase() === moduleName.toLowerCase())
    if (!mod) return undefined

    if (options.format === 'raw' || options.format === 'json') {
      if (options.writeToFile) {
        this.handleFileOutput(JSON.stringify(mod, null, 2), options.writeToFile, `${mod.name.toLowerCase()}-module.json`)
      }
      return mod
    }

    let md = `# Module: \`${mod.name}\` (\`${mod.subpath}\`)\n\n`
    md += `${mod.description}\n\n`
    md += `| Category | Total Count |\n`
    md += `| :--- | :---: |\n`
    md += `| Components | **${mod.components.length}** |\n`
    md += `| Engines | **${mod.engines.length}** |\n`
    md += `| Hooks | **${mod.hooks.length}** |\n`
    md += `| Providers | **${mod.providers.length}** |\n`
    md += `| Plugins | **${mod.plugins.length}** |\n\n`

    if (mod.components.length > 0) {
      md += `### 🧩 Components\n\n`
      for (const c of mod.components) {
        const compDoc = this.registry.components[c]
        md += `- **\`${c}\`** (${compDoc?.category || 'general'}): ${compDoc?.description || '-'}\n`
      }
      md += `\n`
    }

    this.handleFileOutput(md, options.writeToFile, `${mod.name.toLowerCase()}-module.md`)
    return md
  }

  /**
   * Resolves and deeply inspects a component, including compound subcomponents,
   * typed props, slot surfaces with occupants, and ambient hooks.
   */
  public inspectComponent(rawName: string, options: OutputOptions = {}): string | ComponentDoc | undefined {
    const comp = resolveComponentDoc(this.registry, rawName)
    if (!comp) return undefined

    if (options.format === 'raw' || options.format === 'json') {
      if (options.writeToFile) {
        this.handleFileOutput(JSON.stringify(comp, null, 2), options.writeToFile, `${comp.name}-spec.json`)
      }
      return comp
    }

    let md = `# Component: \`${comp.name}\`\n\n`
    md += `> **Category:** \`${comp.category}\` | **Module:** \`${comp.module}\` | **File:** \`${comp.filePath}\`\n\n`
    md += `${comp.description}\n\n`

    if (comp.semanticClass || comp.dataComponent) {
      md += `- **Semantic CSS Hook:** \`.${comp.semanticClass || `interface-${comp.name.toLowerCase()}`}\`\n`
      md += `- **Data Attribute:** \`[data-component="${comp.dataComponent || comp.name}"]\`\n\n`
    }

    if (comp.subComponents && comp.subComponents.length > 0) {
      md += `### 🧩 Compound Subcomponents (\`Root.Part\`)\n\n`
      md += `This component uses the Compound Component Architecture. You can compose subcomponents directly in JSX:\n\n`
      for (const sub of comp.subComponents) {
        const subDoc = this.registry.components[sub]
        const alias = Object.entries(comp.attachments || {}).find(([, v]) => v === sub)?.[0]
        const dotName = alias ? `${comp.name}.${alias}` : sub
        md += `- **\`<${dotName} />\`** (${sub}): ${subDoc?.description || 'Compound subcomponent.'}\n`
      }
      md += `\n`
    }

    // Props table
    const propEntries = Object.entries(comp.props)
    if (propEntries.length > 0) {
      md += `### ⚙️ Component Props\n\n`
      md += `| Prop | Type | Default | Required | Description |\n`
      md += `| :--- | :--- | :--- | :---: | :--- |\n`
      for (const [propKey, prop] of propEntries) {
        const defStr = prop.default !== undefined ? `\`${String(prop.default)}\`` : '-'
        const reqStr = prop.optional ? 'Optional' : '**Required**'
        const typeStr = `\`${prop.type.replace(/\|/g, '\\|')}\``
        md += `| **\`${propKey}\`** | ${typeStr} | ${defStr} | ${reqStr} | ${prop.description || '-'} |\n`
      }
      md += `\n`
    }

    // Slots surface
    const slotEntries = Object.entries(comp.slots)
    if (slotEntries.length > 0) {
      md += `### 🎯 Slot Injection Surface (Rule C5)\n\n`
      md += `| Slot | Type | Default Occupant | Resolves To | Description |\n`
      md += `| :--- | :--- | :--- | :--- | :--- |\n`
      for (const [slotKey, slot] of slotEntries) {
        const defOcc = slot.defaultComponent ? `\`${slot.defaultComponent}\`` : '-'
        const resTo = slot.resolvesTo ? `\`${slot.resolvesTo}\`` : '-'
        const typeStr = `\`${slot.type.replace(/\|/g, '\\|')}\``
        md += `| **\`${slotKey}\`** | ${typeStr} | ${defOcc} | ${resTo} | ${slot.description || '-'} |\n`
      }
      md += `\n`
    }

    // Associated Hook
    if (comp.hook) {
      md += `### 🪝 Associated Headless Hook\n\n`
      md += `- **Hook:** \`${comp.hook.name}\`\n`
      if (comp.hook.state?.length) md += `- **State Props:** \`${comp.hook.state.join('`, `')}\`\n`
      if (comp.hook.actions?.length) md += `- **Actions:** \`${comp.hook.actions.join('`, `')}\`\n`
      md += `\n`
    }

    // Examples
    if (comp.examples && comp.examples.length > 0) {
      md += `### 💻 Usage Examples\n\n`
      for (const ex of comp.examples) {
        md += `#### ${ex.title}\n`
        if (ex.description) md += `${ex.description}\n\n`
        md += `\`\`\`tsx\n${ex.code}\n\`\`\`\n\n`
      }
    }

    this.handleFileOutput(md, options.writeToFile, `${comp.name}-spec.md`)
    return md
  }

  // ===========================================================================
  // 3. Engine, Hook, Provider & Plugin Inspection
  // ===========================================================================

  public inspectEngine(name: string, options: OutputOptions = {}): string | EngineDoc | undefined {
    const eng = this.registry.engines[name]
    if (!eng) return undefined

    if (options.format === 'raw' || options.format === 'json') {
      if (options.writeToFile) {
        this.handleFileOutput(JSON.stringify(eng, null, 2), options.writeToFile, `${eng.name}-engine.json`)
      }
      return eng
    }

    let md = `# Engine: \`${eng.name}\`\n\n`
    md += `> **Module:** \`${eng.module}\` | **File:** \`${eng.filePath}\`\n\n`
    md += `${eng.description}\n\n`

    if (eng.state && Object.keys(eng.state).length > 0) {
      md += `### 📊 State Properties\n\n`
      md += `| Property | Type | Description |\n`
      md += `| :--- | :--- | :--- |\n`
      for (const [k, v] of Object.entries(eng.state)) {
        md += `| **\`${k}\`** | \`${v.type}\` | ${v.description || '-'} |\n`
      }
      md += `\n`
    }

    if (eng.methods && Object.keys(eng.methods).length > 0) {
      md += `### 🛠️ Public Methods\n\n`
      md += `| Method | Signature | Returns | Description |\n`
      md += `| :--- | :--- | :--- | :--- |\n`
      for (const [k, v] of Object.entries(eng.methods)) {
        md += `| **\`${k}\`** | \`${v.signature}\` | \`${v.returnType}\` | ${v.description || '-'} |\n`
      }
      md += `\n`
    }

    if (eng.events && Object.keys(eng.events).length > 0) {
      md += `### ⚡ Event Bus Signals\n\n`
      md += `| Event Name | Payload Type | Description |\n`
      md += `| :--- | :--- | :--- |\n`
      for (const [k, v] of Object.entries(eng.events)) {
        md += `| **\`${k}\`** | \`${v.payloadType}\` | ${v.description || '-'} |\n`
      }
      md += `\n`
    }

    this.handleFileOutput(md, options.writeToFile, `${eng.name}-engine.md`)
    return md
  }

  public inspectHook(name: string, options: OutputOptions = {}): string | HookDoc | undefined {
    const hook = this.registry.hooks[name]
    if (!hook) return undefined

    if (options.format === 'raw' || options.format === 'json') {
      if (options.writeToFile) {
        this.handleFileOutput(JSON.stringify(hook, null, 2), options.writeToFile, `${hook.name}-hook.json`)
      }
      return hook
    }

    let md = `# Hook: \`${hook.name}\`\n\n`
    md += `> **Type:** \`${hook.type}\` | **Module:** \`${hook.module}\` | **File:** \`${hook.filePath}\`\n\n`
    md += `${hook.description}\n\n`

    if (hook.parameters && Object.keys(hook.parameters).length > 0) {
      md += `### 📥 Parameters\n\n`
      md += `| Parameter | Type | Optional | Description |\n`
      md += `| :--- | :--- | :---: | :--- |\n`
      for (const [k, v] of Object.entries(hook.parameters)) {
        md += `| **\`${k}\`** | \`${v.type}\` | ${v.optional ? 'Yes' : 'No'} | ${v.description || '-'} |\n`
      }
      md += `\n`
    }

    if (hook.returns) {
      md += `### 📤 Return Value (\`${hook.returns.type}\`)\n\n`
      if (hook.returns.state && Object.keys(hook.returns.state).length > 0) {
        md += `#### State Properties\n`
        for (const [k, v] of Object.entries(hook.returns.state)) {
          md += `- **\`${k}\`** (\`${v.type}\`): ${v.description || '-'}\n`
        }
        md += `\n`
      }
      if (hook.returns.actions && Object.keys(hook.returns.actions).length > 0) {
        md += `#### Actions\n`
        for (const [k, v] of Object.entries(hook.returns.actions)) {
          md += `- **\`${k}\`** (\`${v.type}\`): ${v.description || '-'}\n`
        }
        md += `\n`
      }
    }

    this.handleFileOutput(md, options.writeToFile, `${hook.name}-hook.md`)
    return md
  }

  public inspectProvider(name: string, options: OutputOptions = {}): string | ProviderDoc | undefined {
    const prov = this.registry.providers[name]
    if (!prov) return undefined

    if (options.format === 'raw' || options.format === 'json') {
      if (options.writeToFile) {
        this.handleFileOutput(JSON.stringify(prov, null, 2), options.writeToFile, `${prov.name}-provider.json`)
      }
      return prov
    }

    let md = `# Provider: \`${prov.name}\`\n\n`
    md += `> **Type:** \`${prov.type}\` | **Module:** \`${prov.module}\` | **File:** \`${prov.filePath}\`\n\n`
    md += `${prov.description}\n\n`

    if (prov.providedHooks?.length) {
      md += `### 🪝 Provided Hooks\n\n`
      for (const h of prov.providedHooks) {
        md += `- **\`${h}\`**\n`
      }
      md += `\n`
    }

    if (prov.providedEvents?.length) {
      md += `### ⚡ Handled Events\n\n`
      for (const e of prov.providedEvents) {
        md += `- **\`${e}\`**\n`
      }
      md += `\n`
    }

    this.handleFileOutput(md, options.writeToFile, `${prov.name}-provider.md`)
    return md
  }

  public inspectPlugin(name: string, options: OutputOptions = {}): string | PluginDoc | undefined {
    const plug = this.registry.plugins[name]
    if (!plug) return undefined

    if (options.format === 'raw' || options.format === 'json') {
      if (options.writeToFile) {
        this.handleFileOutput(JSON.stringify(plug, null, 2), options.writeToFile, `${plug.name}-plugin.json`)
      }
      return plug
    }

    let md = `# Plugin: \`${plug.name}\`\n\n`
    md += `> **Module:** \`${plug.module}\` | **File:** \`${plug.filePath}\`\n\n`
    md += `${plug.description}\n\n`

    if (plug.components?.length) {
      md += `### 🧩 Bundled Components\n\n`
      for (const c of plug.components) {
        md += `- **\`${c}\`**\n`
      }
      md += `\n`
    }

    this.handleFileOutput(md, options.writeToFile, `${plug.name}-plugin.md`)
    return md
  }

  public inspectType(name: string, options: OutputOptions = {}): string | TypeDoc | undefined {
    const typeDoc = this.registry.types[name]
    if (!typeDoc) return undefined

    if (options.format === 'raw' || options.format === 'json') {
      if (options.writeToFile) {
        this.handleFileOutput(JSON.stringify(typeDoc, null, 2), options.writeToFile, `${typeDoc.name}-type.json`)
      }
      return typeDoc
    }

    let md = `# Type Definition: \`${typeDoc.name}\`\n\n`
    md += `> **Kind:** \`${typeDoc.kind}\` | **Module:** \`${typeDoc.module}\` | **File:** \`${typeDoc.filePath}\`\n\n`
    if (typeDoc.description) md += `${typeDoc.description}\n\n`

    md += `\`\`\`typescript\n${typeDoc.rawDefinition}\n\`\`\`\n\n`

    this.handleFileOutput(md, options.writeToFile, `${typeDoc.name}-type.md`)
    return md
  }

  // ===========================================================================
  // 4. Token-Efficient AI Agent Context Generator
  // ===========================================================================

  /**
   * Generates a compact, high-density prompt context slice for AI coding agents.
   * Eliminates context window bloating by including only the exact symbols needed.
   */
  public generateAgentContext(
    targets: string | string[],
    options: OutputOptions = {}
  ): string | Record<string, any> {
    const targetList = Array.isArray(targets) ? targets : [targets]
    const resolvedComponents: ComponentDoc[] = []
    const resolvedEngines: EngineDoc[] = []
    const resolvedHooks: HookDoc[] = []

    for (const t of targetList) {
      const comp = resolveComponentDoc(this.registry, t)
      if (comp && !resolvedComponents.some((c) => c.name === comp.name)) {
        resolvedComponents.push(comp)
      }
      if (this.registry.engines[t]) resolvedEngines.push(this.registry.engines[t])
      if (this.registry.hooks[t]) resolvedHooks.push(this.registry.hooks[t])
    }

    if (options.format === 'json') {
      const jsonContext = {
        components: resolvedComponents,
        engines: resolvedEngines,
        hooks: resolvedHooks,
      }
      this.handleFileOutput(JSON.stringify(jsonContext, null, 2), options.writeToFile, 'interface-agent-context.json')
      return jsonContext
    }

    let md = `## 🤖 Consona Interface Reference Slice for Target Symbols\n\n`

    for (const comp of resolvedComponents) {
      md += `### Component \`${comp.name}\` (\`${comp.module}\`)\n`
      md += `- **Description:** ${comp.description}\n`
      if (comp.subComponents?.length) {
        md += `- **Compound Subcomponents:** \`${comp.subComponents.join('`, `')}\`\n`
      }
      const propsSummary = Object.entries(comp.props)
        .map(([k, v]) => `${k}${v.optional ? '?' : ''}: ${v.type}${v.default !== undefined ? ` = ${v.default}` : ''}`)
        .join(', ')
      md += `- **Props:** \`{ ${propsSummary} }\`\n`

      if (Object.keys(comp.slots).length > 0) {
        const slotsSummary = Object.entries(comp.slots)
          .map(([k, v]) => `${k}?: ${v.type} (default: ${v.defaultComponent || 'none'})`)
          .join(', ')
        md += `- **Slots:** \`{ ${slotsSummary} }\`\n`
      }
      md += `\n`
    }

    for (const eng of resolvedEngines) {
      md += `### Engine \`${eng.name}\` (\`${eng.module}\`)\n`
      md += `- **Description:** ${eng.description}\n`
      const methods = Object.entries(eng.methods).map(([k, v]) => `${k}${v.signature}: ${v.returnType}`).join('; ')
      md += `- **Methods:** \`${methods}\`\n\n`
    }

    for (const hook of resolvedHooks) {
      md += `### Hook \`${hook.name}\` (\`${hook.module}\`)\n`
      md += `- **Description:** ${hook.description}\n`
      md += `- **Returns:** \`${hook.returns.type}\`\n\n`
    }

    this.handleFileOutput(md, options.writeToFile, 'interface-agent-context.md')
    return md
  }

  // ===========================================================================
  // 5. Universal Tag Indexing & Querying
  // ===========================================================================

  /**
   * Retrieves all unique tags registered across the catalog.
   */
  public listTags(): string[] {
    return Object.keys(this.metadata.tags || {}).sort()
  }

  /**
   * Retrieves all entities associated with a specific tag with support for limit, list, and doc.
   */
  public getByTag(tag: string, options: SearchOptions = {}): string | Record<string, any> | string[] {
    const normalizedTag = tag.trim().toLowerCase()
    const matchingNames = (this.metadata.tags && this.metadata.tags[normalizedTag]) || []
    let items = matchingNames
      .map((name) => this.metadata.items[name])
      .filter((item): item is MetadataRegistryItem => Boolean(item))

    if (options.limit && options.limit > 0) {
      items = items.slice(0, options.limit)
    }

    // 1. List mode: return only array of entity names
    if (options.list || options.format === 'list') {
      const names = items.map((i) => i.name)
      if (options.format === 'json') {
        if (options.writeToFile) {
          this.handleFileOutput(JSON.stringify(names, null, 2), options.writeToFile, `tag-${normalizedTag}-names.json`)
        }
        return names
      }
      const listOutput = names.join('\n')
      this.handleFileOutput(listOutput, options.writeToFile, `tag-${normalizedTag}-names.txt`)
      return listOutput
    }

    // 2. Doc mode: attach JSDocs and specifications
    if (options.doc) {
      const docItems = items.map((item) => {
        const resolved = this.inspect(item.name, { format: 'raw' })
        return {
          ...item,
          doc: resolved,
        }
      })

      if (options.format === 'json') {
        const res = {
          tag: normalizedTag,
          total: items.length,
          items: docItems,
        }
        this.handleFileOutput(JSON.stringify(res, null, 2), options.writeToFile, `tag-${normalizedTag}-docs.json`)
        return res
      }

      let md = `## 🏷️ Documentation for Entities Tagged with \`${normalizedTag}\` (${items.length})\n\n`
      for (const item of items) {
        md += `### \`${item.name}\` (\`${item.type}\`)\n`
        md += `**Module:** \`${item.module}\`\n\n`
        const entityDoc = this.inspect(item.name, { format: 'markdown' })
        if (typeof entityDoc === 'string') {
          md += `${entityDoc}\n\n---\n\n`
        }
      }
      this.handleFileOutput(md, options.writeToFile, `tag-${normalizedTag}-docs.md`)
      return md
    }

    if (options.format === 'json' || options.format === 'raw') {
      const res = {
        tag: normalizedTag,
        total: items.length,
        items,
      }
      this.handleFileOutput(JSON.stringify(res, null, 2), options.writeToFile, `tag-${normalizedTag}.json`)
      return res
    }

    let md = `## 🏷️ Entities Tagged with \`${normalizedTag}\` (${items.length})\n\n`
    if (items.length === 0) {
      md += `*No entities found with tag \`${normalizedTag}\`.*\n`
    } else {
      md += `| Name | Kind | Module | Description |\n`
      md += `| :--- | :--- | :--- | :--- |\n`
      for (const item of items) {
        md += `| **\`${item.name}\`** | \`${item.type}\` | \`${item.module}\` | ${item.description || '-'} |\n`
      }
    }

    this.handleFileOutput(md, options.writeToFile, `tag-${normalizedTag}.md`)
    return md
  }

  // ===========================================================================
  // 6. Natural Language Query / Search Engine
  // ===========================================================================

  /**
   * Search across all components, hooks, engines, providers, plugins, and tags
   * using Big Tech inverted index, BM25+ scoring, Trie prefix matching, and typo tolerance.
   * 
   * Supports:
   * - limit: only retrieve n results
   * - list: return only entity names (string[])
   * - doc: include generated TypeScript JSDocs and full AST entity specifications
   */
  public search(query: string, options: SearchOptions = {}) {
    const hits = this.searchEngine.search(query, options)

    // 1. List mode: return only entity names
    if (options.list || options.format === 'list') {
      const names = hits.map((h) => h.name)
      if (options.format === 'json') {
        if (options.writeToFile) {
          this.handleFileOutput(JSON.stringify(names, null, 2), options.writeToFile, 'search-results-names.json')
        }
        return names
      }
      const listOutput = names.join('\n')
      this.handleFileOutput(listOutput, options.writeToFile, 'search-results-names.txt')
      return listOutput
    }

    // 2. Doc mode in Markdown
    if (options.doc && options.format === 'markdown') {
      let md = `### 🔍 Registrar Search Results & JSDocs for "${query}" (${hits.length} found):\n\n`
      if (hits.length === 0) {
        md += `*No matches found in interface catalog for "${query}".*\n`
      } else {
        for (let i = 0; i < hits.length; i++) {
          const hit = hits[i]!
          const tagsStr = hit.tags?.length ? ` [${hit.tags.join(', ')}]` : ''
          md += `#### ${i + 1}. \`${hit.name}\` (\`${hit.type}\`)\n`
          md += `**Module:** \`${hit.module}\`${hit.category ? ` | **Category:** \`${hit.category}\`` : ''} | **Relevance:** \`${hit.score} pts\`\n`
          md += `*${hit.description}*${tagsStr}\n\n`
          if (hit.jsDoc) {
            md += `\`\`\`ts\n${hit.jsDoc}\n\`\`\`\n\n`
          }
          md += `---\n\n`
        }
      }
      this.handleFileOutput(md, options.writeToFile, 'search-results-docs.md')
      return md
    }

    if (options.format === 'json') {
      if (options.writeToFile) {
        this.handleFileOutput(JSON.stringify(hits, null, 2), options.writeToFile, 'search-results.json')
      }
      return hits
    }

    if (options.format === 'markdown') {
      let md = `### 🔍 Registrar Search Results for "${query}" (${hits.length} found):\n\n`
      if (hits.length === 0) {
        md += `*No matches found in interface catalog for "${query}".*\n`
      } else {
        md += `| Name | Type | Module | Relevance | Matched Reason | Description |\n`
        md += `| :--- | :---: | :--- | :---: | :--- | :--- |\n`
        for (const hit of hits) {
          const tagsStr = hit.tags?.length ? ` [${hit.tags.join(', ')}]` : ''
          const reasonStr = hit.matchedOn.slice(0, 2).join(', ') || 'relevance'
          md += `| **\`${hit.name}\`** | \`${hit.type}\` | \`${hit.module}\` | \`${hit.score} pts\` | ${reasonStr} | ${hit.description}${tagsStr} |\n`
        }
      }
      this.handleFileOutput(md, options.writeToFile, 'search-results.md')
      return md
    }

    return hits
  }

  /**
   * High-level query interface that answers questions about the interface.
   */
  public ask(question: string, options: OutputOptions = {}): string | Record<string, any> {
    const q = question.toLowerCase()

    // 1. Component Props query
    if (q.includes('prop') || q.includes('props')) {
      const match = question.match(/(?:for|in|of|about)\s+([A-Z][a-zA-Z0-9]+)/i) || question.match(/([A-Z][a-zA-Z0-9]+)/)
      if (match && match[1]) {
        const comp = resolveComponentDoc(this.registry, match[1])
        if (comp) return this.inspectComponent(comp.name, options) as string | ComponentDoc
      }
    }

    // 2. Slots query
    if (q.includes('slot') || q.includes('slots') || q.includes('customiz')) {
      const match = question.match(/(?:for|in|of|about)\s+([A-Z][a-zA-Z0-9]+)/i) || question.match(/([A-Z][a-zA-Z0-9]+)/)
      if (match && match[1]) {
        const comp = resolveComponentDoc(this.registry, match[1])
        if (comp) return this.inspectComponent(comp.name, options) as string | ComponentDoc
      }
    }

    // 3. General search fallback
    const hits = this.searchEngine.search(question, { limit: 5 })
    if (hits.length > 0) {
      if (options.format === 'json') {
        const res = { question, results: hits }
        this.handleFileOutput(JSON.stringify(res, null, 2), options.writeToFile, 'query-answer.json')
        return res
      }
      let md = `### 🔍 Registrar Search Results for "${question}":\n\n`
      for (const res of hits) {
        md += `- **\`${res.name}\`** (${res.type} in \`${res.module}\`): ${res.description}\n`
      }
      this.handleFileOutput(md, options.writeToFile, 'query-answer.md')
      return md
    }

    if (options.format === 'json') {
      return { question, error: `No exact match found in Interface Registrar for "${question}".` }
    }

    return `No exact match found in Interface Registrar for "${question}". Use registrar.getCatalog() to browse all available entities.`
  }

  // ===========================================================================
  // Internal File Output Helper
  // ===========================================================================
  private handleFileOutput(content: string, writeToFile?: boolean | string, defaultFilename: string = 'interface-catalog.md') {
    if (!writeToFile) return
    const root = getPackageRoot()
    const targetPath = typeof writeToFile === 'string' ? writeToFile : (root ? joinPaths(root, defaultFilename) : defaultFilename)
    try {
      const fsModule = getRuntimeFs()
      if (!fsModule) return
      const dir = getDirname(targetPath)
      if (!fsModule.existsSync(dir)) fsModule.mkdirSync(dir, { recursive: true })
      fsModule.writeFileSync(targetPath, content, 'utf-8')
    } catch (err) {
      console.warn(`Failed to write registrar output to ${targetPath}:`, err)
    }
  }
}

/** Default singleton instance */
export const registrar = new InterfaceRegistrar()
