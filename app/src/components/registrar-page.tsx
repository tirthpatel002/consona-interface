import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  Terminal,
  Search,
  Box,
  Sliders,
  Sparkles,
  Layers,
  Cpu,
  Code,
  Copy,
  Check,
  Download,
  Play,
  Trash2,
  CornerDownLeft,
  ChevronRight,
  ExternalLink,
  Layers3,
  FileCode,
  Info,
  CheckCircle2,
  X,
  FileText,
  Filter,
} from 'lucide-react'
import {
  Badge,
  Button,
  Kbd,
  cn,
  useNavigation,
  InfiniteScrollSection,
} from '@consona/interface'
import {
  PageHeaderBlock,
  PageStatsBlock,
  PageFilterToolbar,
} from './page-blocks'
import {
  getAllComponents,
  getAllEngines,
  getAllHooks,
  getAllProviders,
  getAllPlugins,
  getAllTypes,
  getComponentDoc,
  getEngineDoc,
  getHookDoc,
  getProviderDoc,
  getPluginDoc,
  getTypeDoc,
  getModuleDoc,
  searchRegistry,
  registry,
  type ComponentDoc,
  type EngineDoc,
  type HookDoc,
  type ProviderDoc,
  type PluginDoc,
  type TypeDoc,
} from '../registry/registry-client'
import { useTypeInspector } from './type-inspector-modal'
import { docsRegistry } from '../docs'

export type EntityKind = 'all' | 'component' | 'hook' | 'engine' | 'provider' | 'plugin' | 'type'

export interface UnifiedEntity {
  id: string
  name: string
  kind: 'component' | 'hook' | 'engine' | 'provider' | 'plugin' | 'type'
  module: string
  filePath?: string
  description?: string
  tags?: string[]
  propsCount?: number
  slotsCount?: number
  methodsCount?: number
  eventsCount?: number
  rawDoc?: any
}

interface CliHistoryItem {
  id: string
  command: string
  timestamp: string
  output: any
  format: 'json' | 'markdown' | 'raw'
  isError?: boolean
}

const MODULE_FACETS = [
  { id: 'all', label: 'All Modules' },
  { id: 'core', label: 'Core / Foundation' },
  { id: 'charts', label: 'Charts & Graphs' },
  { id: 'temporal', label: 'Temporal & Calendars' },
  { id: 'overlay', label: 'Overlay & Spotlights' },
  { id: 'data', label: 'Data & Virtual Grids' },
  { id: 'media', label: 'Rich Media & Audio' },
  { id: 'maps', label: 'Geospatial & Maps' },
  { id: 'generative', label: 'Generative Surfaces' },
  { id: 'panes', label: 'Interactive Panes & Tools' },
]

const CLI_QUICK_COMMAND_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'catalog', label: 'Catalog' },
  { id: 'inspect', label: 'Inspect' },
  { id: 'props-slots', label: 'Props & Slots' },
  { id: 'engines-hooks', label: 'Engines & Hooks' },
  { id: 'types', label: 'Types AST' },
  { id: 'source', label: 'Source & Path' },
  { id: 'ai-search', label: 'AI & Search' },
  { id: 'utils', label: 'Utils' },
]

interface QuickCliOption {
  category: string
  label: string
  command: string
  description: string
}

const CLI_QUICK_COMMANDS: QuickCliOption[] = [
  // 1. Catalog
  {
    category: 'catalog',
    label: '--catalog (JSON)',
    command: 'npm run registrar -- --catalog --json',
    description: 'Export full interface registry in formatted JSON',
  },
  {
    category: 'catalog',
    label: '--catalog (Markdown)',
    command: 'npm run registrar -- --catalog --md',
    description: 'Export full catalog as markdown documentation',
  },

  // 2. Inspection
  {
    category: 'inspect',
    label: '--inspect Button',
    command: 'npm run registrar -- --inspect Button --json',
    description: 'Universal AST schema inspection of Button component',
  },
  {
    category: 'inspect',
    label: '--inspect NavigationEngine',
    command: 'npm run registrar -- --inspect NavigationEngine --json',
    description: 'Universal inspection of Navigation state engine',
  },
  {
    category: 'inspect',
    label: '--inspect useAudioPlayer',
    command: 'npm run registrar -- --inspect useAudioPlayer --json',
    description: 'Universal inspection of useAudioPlayer hook',
  },
  {
    category: 'inspect',
    label: '--inspect ThemeProvider',
    command: 'npm run registrar -- --inspect ThemeProvider --json',
    description: 'Universal inspection of ThemeProvider context',
  },

  // 3. Props & Slots & Composites
  {
    category: 'props-slots',
    label: '--props DataTable',
    command: 'npm run registrar -- --props DataTable --json',
    description: 'Extract typed props schema for DataTable',
  },
  {
    category: 'props-slots',
    label: '--slots ChartContainer',
    command: 'npm run registrar -- --slots ChartContainer --json',
    description: 'Extract compound slot topology for ChartContainer',
  },
  {
    category: 'props-slots',
    label: '--composites Calendar',
    command: 'npm run registrar -- --composites Calendar --json',
    description: 'List compound family child components of Calendar',
  },

  // 4. Engines & Hooks
  {
    category: 'engines-hooks',
    label: '--engine NavigationEngine',
    command: 'npm run registrar -- --engine NavigationEngine --json',
    description: 'Inspect state methods, signatures, and events of NavigationEngine',
  },
  {
    category: 'engines-hooks',
    label: '--hook usePagination',
    command: 'npm run registrar -- --hook usePagination --json',
    description: 'Inspect parameters, state, and return types of usePagination',
  },
  {
    category: 'engines-hooks',
    label: '--provider ThemeProvider',
    command: 'npm run registrar -- --provider ThemeProvider --json',
    description: 'Inspect context value and provider props for ThemeProvider',
  },
  {
    category: 'engines-hooks',
    label: '--plugin AnalyticsPlugin',
    command: 'npm run registrar -- --plugin AnalyticsPlugin --json',
    description: 'Inspect plugin configuration and lifecycle hooks',
  },

  // 5. Types & AST
  {
    category: 'types',
    label: '--type ButtonProps',
    command: 'npm run registrar -- --type ButtonProps --json',
    description: 'Inspect ButtonProps interface properties and JSDoc',
  },
  {
    category: 'types',
    label: '--type ChartContainerProps',
    command: 'npm run registrar -- --type ChartContainerProps --json',
    description: 'Inspect ChartContainerProps slot and theme definitions',
  },
  {
    category: 'types',
    label: '--type NavigationState',
    command: 'npm run registrar -- --type NavigationState --json',
    description: 'Inspect NavigationState reactive interface properties',
  },

  // 6. Source & Paths
  {
    category: 'source',
    label: '--filePath NavigationEngine',
    command: 'npm run registrar -- --filePath NavigationEngine',
    description: 'Look up absolute filesystem path of NavigationEngine',
  },
  {
    category: 'source',
    label: '--code Button',
    command: 'npm run registrar -- --code Button',
    description: 'Retrieve implementation source code of Button',
  },

  // 7. AI Context & Search
  {
    category: 'ai-search',
    label: '--context Button Input Field',
    command: 'npm run registrar -- --context Button Input Field --json',
    description: 'Generate complete bundled context for AI coding agents',
  },
  {
    category: 'ai-search',
    label: '--search date calendar time',
    command: 'npm run registrar -- --search date calendar time',
    description: 'Fuzzy keyword search across all registered AST metadata',
  },
  {
    category: 'ai-search',
    label: '--ask "which chart supports candlestick?"',
    command: 'npm run registrar -- --ask "which chart supports candlestick?"',
    description: 'Natural language capability query with recommendations',
  },

  // 8. Terminal Controls
  {
    category: 'utils',
    label: 'help',
    command: 'help',
    description: 'Show CLI synopsis, usage examples, and available flags',
  },
  {
    category: 'utils',
    label: 'clear',
    command: 'clear',
    description: 'Clear terminal screen history',
  },
]

export const RegistrarPage: React.FC = () => {
  const { navigate } = useNavigation()
  const { inspectType } = useTypeInspector()

  // Mode state
  const [viewMode, setViewMode] = useState<'catalog' | 'cli'>('catalog')

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [activeKind, setActiveKind] = useState<EntityKind>('all')
  const [activeModule, setActiveModule] = useState<string>('all')
  const [hoveredEntity, setHoveredEntity] = useState<UnifiedEntity | null>(null)
  const [selectedEntity, setSelectedEntity] = useState<UnifiedEntity | null>(null)
  const [copiedCliId, setCopiedCliId] = useState<string | null>(null)

  // CLI REPL state
  const [cliInput, setCliInput] = useState('')
  const [activeCliCategory, setActiveCliCategory] = useState<string>('all')
  const [cliHistory, setCliHistory] = useState<CliHistoryItem[]>([
    {
      id: 'init-1',
      command: 'npm run registrar -- --catalog --json',
      timestamp: new Date().toLocaleTimeString(),
      output: {
        system: '@consona/interface',
        version: '1.0.0',
        summary: 'Registrar active. Ready for token-efficient schema queries.',
        counts: {
          components: Object.keys(registry.components || {}).length,
          engines: Object.keys(registry.engines || {}).length,
          hooks: Object.keys(registry.hooks || {}).length,
          providers: Object.keys(registry.providers || {}).length,
          plugins: Object.keys(registry.plugins || {}).length,
          types: Object.keys(registry.types || {}).length,
        },
      },
      format: 'json',
    },
  ])
  const [historyIndex, setHistoryIndex] = useState<number>(-1)
  const cliOutputEndRef = useRef<HTMLDivElement>(null)
  const cliInputRef = useRef<HTMLInputElement>(null)

  // Data fetching & unifying
  const allComponents = useMemo(() => getAllComponents(), [])
  const allEngines = useMemo(() => getAllEngines(), [])
  const allHooks = useMemo(() => getAllHooks(), [])
  const allProviders = useMemo(() => getAllProviders(), [])
  const allPlugins = useMemo(() => getAllPlugins(), [])
  const allTypes = useMemo(() => getAllTypes(), [])

  // Build unified items list
  const unifiedEntities: UnifiedEntity[] = useMemo(() => {
    const list: UnifiedEntity[] = []

    // 1. Components
    allComponents.forEach((c) => {
      const slotCount = c.slots ? Object.keys(c.slots).length : 0
      const propCount = c.props ? Object.keys(c.props).length : 0
      list.push({
        id: `component-${c.name}`,
        name: c.name,
        kind: 'component',
        module: c.module || '@consona/interface',
        filePath: c.filePath,
        description: c.description,
        tags: c.tags,
        propsCount: propCount,
        slotsCount: slotCount,
        rawDoc: c,
      })
    })

    // 2. Engines
    allEngines.forEach((e) => {
      const methodCount = e.methods ? Object.keys(e.methods).length : 0
      const eventCount = e.events ? Object.keys(e.events).length : 0
      list.push({
        id: `engine-${e.name}`,
        name: e.name,
        kind: 'engine',
        module: e.module || '@consona/interface',
        filePath: e.filePath,
        description: e.description,
        tags: e.tags,
        methodsCount: methodCount,
        eventsCount: eventCount,
        rawDoc: e,
      })
    })

    // 3. Hooks
    allHooks.forEach((h) => {
      list.push({
        id: `hook-${h.name}`,
        name: h.name,
        kind: 'hook',
        module: h.module || '@consona/interface',
        filePath: h.filePath,
        description: h.description,
        tags: h.tags,
        rawDoc: h,
      })
    })

    // 4. Providers
    allProviders.forEach((p) => {
      list.push({
        id: `provider-${p.name}`,
        name: p.name,
        kind: 'provider',
        module: p.module || '@consona/interface',
        filePath: p.filePath,
        description: p.description,
        tags: p.tags,
        rawDoc: p,
      })
    })

    // 5. Plugins
    allPlugins.forEach((pl) => {
      list.push({
        id: `plugin-${pl.name}`,
        name: pl.name,
        kind: 'plugin',
        module: pl.module || '@consona/interface',
        filePath: pl.filePath,
        description: pl.description,
        tags: pl.tags,
        rawDoc: pl,
      })
    })

    // 6. Types
    allTypes.forEach((t) => {
      const propCount = t.properties ? Object.keys(t.properties).length : 0
      list.push({
        id: `type-${t.name}`,
        name: t.name,
        kind: 'type',
        module: t.module || '@consona/interface',
        filePath: t.filePath,
        description: t.description,
        tags: t.tags,
        propsCount: propCount,
        rawDoc: t,
      })
    })

    return list
  }, [allComponents, allEngines, allHooks, allProviders, allPlugins, allTypes])

  // Filtered entities
  const filteredEntities = useMemo(() => {
    return unifiedEntities.filter((item) => {
      // Kind filter
      if (activeKind !== 'all' && item.kind !== activeKind) return false

      // Module filter
      if (activeModule !== 'all') {
        const itemMod = (item.module || '').toLowerCase()
        const itemPath = (item.filePath || '').toLowerCase()
        const target = activeModule.toLowerCase()
        if (!itemMod.includes(target) && !itemPath.includes(target)) {
          return false
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesName = item.name.toLowerCase().includes(q)
        const matchesDesc = (item.description || '').toLowerCase().includes(q)
        const matchesModule = (item.module || '').toLowerCase().includes(q)
        const matchesFile = (item.filePath || '').toLowerCase().includes(q)
        if (!matchesName && !matchesDesc && !matchesModule && !matchesFile) {
          return false
        }
      }

      return true
    })
  }, [unifiedEntities, activeKind, activeModule, searchQuery])

  // Kind filter tabs configuration
  const kindFilterOptions = [
    { id: 'all', label: 'All Entities', count: unifiedEntities.length },
    { id: 'component', label: 'Components', count: allComponents.length },
    { id: 'hook', label: 'Hooks', count: allHooks.length },
    { id: 'engine', label: 'Engines', count: allEngines.length },
    { id: 'provider', label: 'Providers', count: allProviders.length },
    { id: 'plugin', label: 'Plugins', count: allPlugins.length },
    { id: 'type', label: 'Types & AST', count: allTypes.length },
  ]

  // Copy helper
  const handleCopyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCliId(id)
      setTimeout(() => setCopiedCliId(null), 1800)
    } catch {}
  }

  // Navigation / Inspector click handler
  const handleEntityClick = (entity: UnifiedEntity) => {
    setSelectedEntity(entity)
    if (entity.kind === 'component') {
      // Find matching docId in docsRegistry
      const matchedKey = Object.keys(docsRegistry).find(
        (k) => docsRegistry[k].name.toLowerCase() === entity.name.toLowerCase() || k === entity.name.toLowerCase()
      )
      if (matchedKey) {
        navigate(`/components/${matchedKey}`)
      } else {
        // Fallback search or inspect type
        inspectType(entity.name)
      }
    } else if (entity.kind === 'engine') {
      navigate(`/architecture/engines/${entity.name}`)
    } else if (entity.kind === 'hook') {
      navigate(`/architecture/hooks/${entity.name}`)
    } else if (entity.kind === 'provider') {
      navigate(`/architecture/providers/${entity.name}`)
    } else if (entity.kind === 'plugin') {
      navigate(`/architecture/plugins/${entity.name}`)
    } else if (entity.kind === 'type') {
      inspectType(entity.name)
    }
  }

  // Generate dynamic CLI command for an entity
  const getCliCommandForEntity = (entity: UnifiedEntity, flag: string = '--inspect', format: 'json' | 'md' = 'json') => {
    const fmtFlag = format === 'json' ? '--json' : ''
    return `npm run registrar -- ${flag} ${entity.name} ${fmtFlag}`.trim()
  }

  // Active snapshot entity for the left quick-CLI card
  const activeSnapshot = hoveredEntity || selectedEntity || (filteredEntities.length > 0 ? filteredEntities[0] : null)

  // In-Browser CLI Command Executor
  const executeCliCommand = (rawCmd: string) => {
    const trimmed = rawCmd.trim()
    if (!trimmed) return

    // Add to history
    const isJson = trimmed.includes('--json') || trimmed.includes('-j') || trimmed.includes('--format json')
    const format: 'json' | 'markdown' | 'raw' = isJson ? 'json' : 'markdown'

    // Clean tokens
    const tokens = trimmed
      .replace(/^npm run registrar --\s*/, '')
      .replace(/^npx registrar\s*/, '')
      .replace(/^registrar\s*/, '')
      .split(/\s+/)

    let resultOutput: any = null
    let isError = false

    const mainFlag = tokens[0] || '--help'
    const targetName = tokens[1]

    try {
      if (mainFlag === '--help' || mainFlag === '-h' || mainFlag === 'help') {
        resultOutput = {
          usage: 'npm run registrar -- [flag] [TargetName] [--json|--md]',
          flags: [
            { flag: '--catalog', description: 'Export full registry metadata' },
            { flag: '--inspect <Name>', description: 'Universal inspection of any entity' },
            { flag: '--component <Name>', description: 'Inspect component props and slots' },
            { flag: '--engine <Name>', description: 'Inspect engine state methods & events' },
            { flag: '--hook <Name>', description: 'Inspect hook signature & return types' },
            { flag: '--provider <Name>', description: 'Inspect provider context & props' },
            { flag: '--plugin <Name>', description: 'Inspect plugin configuration & components' },
            { flag: '--module <Name>', description: 'Inspect module exports and components' },
            { flag: '--tag <Name>', description: 'List all entities matching a specific tag' },
            { flag: '--tags', description: 'List all registered tags in interface' },
            { flag: '--type <Name>', description: 'Inspect AST interface/type properties' },
            { flag: '--props <Name>', description: 'Extract component prop definitions' },
            { flag: '--slots <Name>', description: 'Extract compound slot topology' },
            { flag: '--code <Name>', description: 'Retrieve component implementation' },
            { flag: '--filePath <Name>', description: 'Get source file path' },
            { flag: '--search <Query>', description: 'Fuzzy search registry metadata' },
            { flag: '--ask "<Question>"', description: 'Ask natural language query' },
            { flag: '--context <Names...>', description: 'Generate AI agent context bundle' },
          ],
        }
      } else if (mainFlag === '--catalog') {
        resultOutput = {
          timestamp: new Date().toISOString(),
          totalEntities: unifiedEntities.length,
          components: allComponents.map((c) => ({ name: c.name, module: c.module, props: Object.keys(c.props || {}).length })),
          engines: allEngines.map((e) => ({ name: e.name, methods: Object.keys(e.methods || {}).length })),
          hooks: allHooks.map((h) => h.name),
          types: allTypes.slice(0, 100).map((t) => t.name),
        }
      } else if (mainFlag === '--inspect' || mainFlag === 'inspect') {
        if (!targetName) throw new Error('Please specify an entity name to inspect.')
        let match = getComponentDoc(targetName) ||
          getEngineDoc(targetName) ||
          getHookDoc(targetName) ||
          getProviderDoc(targetName) ||
          getPluginDoc(targetName) ||
          getTypeDoc(targetName)

        if (!match) {
          const lower = targetName.toLowerCase()
          const found = unifiedEntities.find((e) => e.name.toLowerCase() === lower)
          if (found) {
            match = found.rawDoc || found
          }
        }

        if (!match) {
          // Collect close suggestions
          const lower = targetName.toLowerCase()
          const suggestions = unifiedEntities
            .filter((e) => e.name.toLowerCase().includes(lower) || lower.includes(e.name.toLowerCase().slice(0, 4)))
            .slice(0, 5)
            .map((e) => e.name)

          resultOutput = {
            error: `Entity "${targetName}" not found in interface registry.`,
            ...(suggestions.length > 0 ? { suggestions } : {}),
            hint: 'Use "npm run registrar -- --search <query>" to search by keyword.',
          }
        } else {
          resultOutput = match
        }
      } else if (mainFlag === '--props' || mainFlag === 'props') {
        if (!targetName) throw new Error('Please specify a component name.')
        const comp = getComponentDoc(targetName) || unifiedEntities.find((e) => e.name.toLowerCase() === targetName.toLowerCase())?.rawDoc
        resultOutput = comp?.props || { error: `No props found for "${targetName}". Ensure target is a valid registered component.` }
      } else if (mainFlag === '--slots' || mainFlag === 'slots') {
        if (!targetName) throw new Error('Please specify a component name.')
        const comp = getComponentDoc(targetName) || unifiedEntities.find((e) => e.name.toLowerCase() === targetName.toLowerCase())?.rawDoc
        resultOutput = comp?.slots || { error: `No slots found for "${targetName}". Ensure target is a valid registered component.` }
      } else if (mainFlag === '--composites' || mainFlag === '--subcomponents') {
        if (!targetName) throw new Error('Please specify a component name.')
        const comp = getComponentDoc(targetName) || unifiedEntities.find((e) => e.name.toLowerCase() === targetName.toLowerCase())?.rawDoc
        resultOutput = {
          name: targetName,
          subComponents: comp?.subComponents || [],
          attachments: comp?.attachments || {},
        }
      } else if (mainFlag === '--code' || mainFlag === 'code') {
        if (!targetName) throw new Error('Please specify an entity name.')
        const found = unifiedEntities.find((e) => e.name.toLowerCase() === targetName.toLowerCase())
        resultOutput = found ? {
          name: found.name,
          kind: found.kind,
          module: found.module,
          filePath: found.filePath,
          schema: found.rawDoc,
        } : { error: `Entity "${targetName}" not found.` }
      } else if (mainFlag === '--context' || mainFlag === 'context') {
        const targets = tokens.slice(1).filter((t) => !t.startsWith('--'))
        if (targets.length === 0) throw new Error('Please specify target names for context bundle.')
        const bundle = targets.map((t) => {
          const found = unifiedEntities.find((e) => e.name.toLowerCase() === t.toLowerCase())
          return found ? (found.rawDoc || found) : { name: t, error: 'Not found' }
        })
        resultOutput = {
          bundleSize: bundle.length,
          targets,
          entities: bundle,
        }
      } else if (mainFlag === '--component') {
        const comp = getComponentDoc(targetName) || unifiedEntities.find((e) => e.kind === 'component' && e.name.toLowerCase() === targetName.toLowerCase())?.rawDoc
        resultOutput = comp || { error: `Component "${targetName}" not found in registry.` }
      } else if (mainFlag === '--engine') {
        const eng = getEngineDoc(targetName) || unifiedEntities.find((e) => e.kind === 'engine' && e.name.toLowerCase() === targetName.toLowerCase())?.rawDoc
        resultOutput = eng || { error: `Engine "${targetName}" not found in registry.` }
      } else if (mainFlag === '--hook') {
        const hk = getHookDoc(targetName) || unifiedEntities.find((e) => e.kind === 'hook' && e.name.toLowerCase() === targetName.toLowerCase())?.rawDoc
        resultOutput = hk || { error: `Hook "${targetName}" not found in registry.` }
      } else if (mainFlag === '--provider' || mainFlag === 'provider') {
        if (!targetName) throw new Error('Please specify a provider name.')
        const prov = getProviderDoc(targetName) || unifiedEntities.find((e) => e.kind === 'provider' && e.name.toLowerCase() === targetName.toLowerCase())?.rawDoc
        resultOutput = prov || { error: `Provider "${targetName}" not found in registry.` }
      } else if (mainFlag === '--plugin' || mainFlag === 'plugin') {
        if (!targetName) throw new Error('Please specify a plugin name.')
        const plug = getPluginDoc(targetName) || unifiedEntities.find((e) => e.kind === 'plugin' && e.name.toLowerCase() === targetName.toLowerCase())?.rawDoc
        resultOutput = plug || { error: `Plugin "${targetName}" not found in registry.` }
      } else if (mainFlag === '--module' || mainFlag === 'module') {
        if (!targetName) throw new Error('Please specify a module name.')
        const mod = getModuleDoc(targetName) || getModuleDoc(targetName.toLowerCase()) || (registry as any).modules?.[targetName] || (registry as any).modules?.[targetName.toLowerCase()]
        resultOutput = mod || { error: `Module "${targetName}" not found in registry.` }
      } else if (mainFlag === '--tag' || mainFlag === 'tag') {
        if (!targetName) {
          const allTags = Array.from(new Set(unifiedEntities.flatMap((e) => e.tags || []))).sort()
          resultOutput = { totalTags: allTags.length, tags: allTags }
        } else {
          const tLower = targetName.toLowerCase()
          const matched = unifiedEntities.filter((e) => e.tags?.some((t) => t.toLowerCase() === tLower))
          resultOutput = {
            tag: targetName,
            total: matched.length,
            items: matched.map((m) => ({ name: m.name, kind: m.kind, module: m.module, description: m.description })),
          }
        }
      } else if (mainFlag === '--tags' || mainFlag === 'tags') {
        const allTags = Array.from(new Set(unifiedEntities.flatMap((e) => e.tags || []))).sort()
        resultOutput = { totalTags: allTags.length, tags: allTags }
      } else if (mainFlag === '--type') {
        const tp = getTypeDoc(targetName) || unifiedEntities.find((e) => e.kind === 'type' && e.name.toLowerCase() === targetName.toLowerCase())?.rawDoc
        resultOutput = tp || { error: `Type "${targetName}" not found in registry.` }
      } else if (mainFlag === '--filePath' || mainFlag === '--file') {
        const found = unifiedEntities.find((e) => e.name.toLowerCase() === (targetName || '').toLowerCase())
        resultOutput = { name: targetName, filePath: found?.filePath || 'Unknown' }
      } else if (mainFlag === '--search' || mainFlag === 'search') {
        const query = tokens.slice(1).join(' ')
        const hits = searchRegistry(query, { limit: 20 })
        resultOutput = { query, total: hits.length, matches: hits.map((h) => ({ name: h.name, kind: h.type, module: h.module, score: h.score, matchedOn: h.matchedOn, description: h.description })) }
      } else if (mainFlag === '--ask' || mainFlag === 'ask') {
        const q = tokens.slice(1).join(' ')
        const hits = searchRegistry(q, { limit: 5 })
        resultOutput = {
          question: q,
          analysis: `Query matched ${hits.length} high-relevance items in registry.`,
          recommendations: hits.map((e) => ({ name: e.name, kind: e.type, module: e.module, score: e.score, description: e.description })),
        }
      } else if (mainFlag === 'clear' || mainFlag === 'cls') {
        setCliHistory([])
        setCliInput('')
        return
      } else {
        // Fallback auto inspect
        const found = unifiedEntities.find((e) => e.name.toLowerCase() === mainFlag.toLowerCase())
        if (found) {
          resultOutput = found.rawDoc || found
        } else {
          resultOutput = {
            message: `Command or entity "${mainFlag}" unrecognized. Type "help" for all available commands.`,
          }
        }
      }
    } catch (err: any) {
      isError = true
      resultOutput = { error: err.message || 'Execution error' }
    }

    const newItem: CliHistoryItem = {
      id: `cmd-${Date.now()}`,
      command: trimmed,
      timestamp: new Date().toLocaleTimeString(),
      output: resultOutput,
      format,
      isError,
    }

    setCliHistory((prev) => [...prev, newItem])
    setCliInput('')
    setHistoryIndex(-1)
  }

  // Scroll to bottom of terminal when history changes
  useEffect(() => {
    if (viewMode === 'cli') {
      cliOutputEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [cliHistory, viewMode])

  // Export full catalog as JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(registry, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', 'consona-interface-registry.json')
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  // Quick CLI Prompt load button (loads into prompt for editing without executing)
  const handleLoadInCliShell = (cmd: string) => {
    setViewMode('cli')
    setCliInput(cmd)
    setTimeout(() => {
      cliInputRef.current?.focus()
    }, 50)
  }

  return (
    <div className="space-y-10 w-full max-w-7xl mx-auto pb-24 animate-in fade-in duration-200">
      {/* 1. Page Header Block */}
      <PageHeaderBlock
        title="Interface Registrar & Catalog"
        icon={Terminal}
        iconColor="text-primary"
        badge="Catalog Active"
        badgeIntent="primary"
        version="v1.0.0"
        description="Unified registry inspection engine and developer CLI for querying AST schemas, prop specifications, slot topologies, compound families, and type signatures across all Consona modules."
        importStatement="npm run registrar -- --catalog"
        actions={
          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center p-1 rounded-base bg-muted/60 border border-border">
              <button
                type="button"
                onClick={() => setViewMode('catalog')}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded transition-all cursor-pointer flex items-center gap-1.5',
                  viewMode === 'catalog'
                    ? 'bg-primary text-primary-fg shadow-xs'
                    : 'text-muted-fg hover:text-fg hover:bg-muted/50'
                )}
              >
                <Box className="w-3.5 h-3.5" />
                <span>Catalog Explorer</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cli')}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded transition-all cursor-pointer flex items-center gap-1.5',
                  viewMode === 'cli'
                    ? 'bg-primary text-primary-fg shadow-xs'
                    : 'text-muted-fg hover:text-fg hover:bg-muted/50'
                )}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Interactive CLI Shell</span>
              </button>
            </div>

            {/* Export JSON Button */}
            <Button
              intent="outline"
              size="sm"
              onClick={handleExportJson}
              className="gap-1.5 hidden sm:inline-flex cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </Button>
          </div>
        }
      />

      {/* 2. Stats Block */}
      <PageStatsBlock
        stats={[
          {
            label: 'Total Primitives',
            value: allComponents.length || 609,
            subtext: 'Accessible UI components',
            icon: Box,
            iconColor: 'text-primary',
          },
          {
            label: 'State Engines',
            value: allEngines.length || 10,
            subtext: 'Pure headless state classes',
            icon: Sliders,
            iconColor: 'text-primary',
          },
          {
            label: 'Reactive Hooks',
            value: allHooks.length || 92,
            subtext: 'Headless coordination hooks',
            icon: Sparkles,
            iconColor: 'text-primary',
          },
          {
            label: 'Type Signatures',
            value: allTypes.length || 1307,
            subtext: 'Exported AST interfaces & types',
            icon: Code,
            iconColor: 'text-primary',
          },
        ]}
      />

      {/* 3. Main Views */}
      {viewMode === 'catalog' ? (
        <div className="space-y-8">
          {/* Toolbar with Search & Kind Filters */}
          <PageFilterToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search 600+ components, engines, hooks, and types by name, prop, slot, or file..."
            filterOptions={kindFilterOptions}
            activeFilter={activeKind}
            onFilterChange={(id) => setActiveKind(id as EntityKind)}
            totalResults={filteredEntities.length}
          />

          {/* Catalog Layout: Left Module Facets & CLI Snippet + Right Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            {/* Left Column: Facet Filters + Quick CLI Card */}
            <div className="lg:col-span-1 space-y-6">
              {/* Module Filter Group */}
              <div className="p-4 rounded-macro border border-border bg-card/60 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-fg">Module Facet</span>
                  </div>
                  {activeModule !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setActiveModule('all')}
                      className="text-[10px] text-muted-fg hover:text-fg font-mono underline cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  {MODULE_FACETS.map((fac) => {
                    const isSelected = activeModule === fac.id
                    return (
                      <button
                        key={fac.id}
                        type="button"
                        onClick={() => setActiveModule(fac.id)}
                        className={cn(
                          'w-full text-left px-2.5 py-1.5 rounded-base text-xs transition-all cursor-pointer flex items-center justify-between',
                          isSelected
                            ? 'bg-primary/10 text-primary font-semibold border border-primary/30'
                            : 'text-muted-fg hover:text-fg hover:bg-muted/40'
                        )}
                      >
                        <span className="truncate">{fac.label}</span>
                        {isSelected && <Check className="w-3 h-3 text-primary shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Quick CLI Snapshot Panel */}
              <div className="p-4 rounded-macro border border-border bg-muted/30 space-y-3 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-destructive/60" />
                      <span className="w-2 h-2 rounded-full bg-amber-500/60" />
                      <span className="w-2 h-2 rounded-full bg-success/60" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-fg">CLI Inspect Snapshot</span>
                  </div>
                </div>

                {activeSnapshot ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-primary truncate max-w-[140px]">
                        {activeSnapshot.name}
                      </span>
                      <Badge intent="outline" size="sm" className="font-mono text-[10px] uppercase">
                        {activeSnapshot.kind}
                      </Badge>
                    </div>

                    <div className="p-2.5 rounded-base bg-bg border border-border/80 font-mono text-xs text-fg space-y-2 overflow-x-auto">
                      <div className="flex items-center justify-between gap-2 text-muted-fg text-[11px]">
                        <span className="truncate text-primary">$ npm run registrar</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyText(
                              getCliCommandForEntity(activeSnapshot, '--inspect', 'json'),
                              'snapshot-copy'
                            )
                          }
                          className="p-1 hover:text-fg cursor-pointer shrink-0"
                          title="Copy command"
                        >
                          {copiedCliId === 'snapshot-copy' ? (
                            <Check className="w-3 h-3 text-success" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <div className="text-fg font-mono text-[11px] select-all">
                        --inspect {activeSnapshot.name} --json
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button
                        intent="primary"
                        size="sm"
                        onClick={() =>
                          handleLoadInCliShell(
                            `npm run registrar -- --inspect ${activeSnapshot.name} --json`
                          )
                        }
                        className="w-full text-xs gap-1 cursor-pointer"
                      >
                        <Terminal className="w-3 h-3" />
                        <span>Load in Shell</span>
                      </Button>
                      <Button
                        intent="secondary"
                        size="sm"
                        onClick={() => handleEntityClick(activeSnapshot)}
                        className="w-full text-xs gap-1 cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View Docs</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-fg text-center py-4">
                    Hover or select any entity to preview its CLI inspect command.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Entity Card Grid with Infinite Scroll */}
            <div className="lg:col-span-3 space-y-6">
              <div className="flex flex-wrap items-center justify-between border-b border-border/60 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-fg tracking-tight">
                    {searchQuery
                      ? `Search Results (${filteredEntities.length})`
                      : activeKind === 'all'
                      ? `All Registry Entities (${filteredEntities.length})`
                      : `${activeKind.toUpperCase()} Entities (${filteredEntities.length})`}
                  </h2>
                  <Badge intent="outline" size="sm" className="font-mono text-[11px]">
                    {filteredEntities.length} items
                  </Badge>
                </div>
                <span className="text-xs text-muted-fg font-mono">
                  Infinite scroll with virtual memory window
                </span>
              </div>

              <InfiniteScrollSection
                items={filteredEntities}
                initialLoadCount={24}
                appendCount={18}
                windowSize={72}
                maxHeight={780}
                threshold={120}
                contentClassName="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                className="p-1 rounded-macro border border-border/50 bg-muted/5 shadow-inner"
                renderItem={(entity: UnifiedEntity) => {
                  const isHovered = hoveredEntity?.id === entity.id
                  const isSelected = selectedEntity?.id === entity.id

                  // Icon & Intent per kind
                  let IconComponent = Box
                  let kindIntent: 'primary' | 'secondary' | 'accent' | 'outline' = 'primary'

                  if (entity.kind === 'engine') {
                    IconComponent = Sliders
                    kindIntent = 'accent'
                  } else if (entity.kind === 'hook') {
                    IconComponent = Sparkles
                    kindIntent = 'secondary'
                  } else if (entity.kind === 'provider') {
                    IconComponent = Layers
                    kindIntent = 'outline'
                  } else if (entity.kind === 'plugin') {
                    IconComponent = Cpu
                    kindIntent = 'secondary'
                  } else if (entity.kind === 'type') {
                    IconComponent = Code
                    kindIntent = 'outline'
                  }

                  return (
                    <div
                      key={entity.id}
                      onMouseEnter={() => setHoveredEntity(entity)}
                      onClick={() => handleEntityClick(entity)}
                      className={cn(
                        'p-4.5 rounded-macro border bg-card/60 hover:bg-card transition-all flex flex-col justify-between group cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden h-full',
                        isSelected || isHovered
                          ? 'border-primary/60 bg-muted/20'
                          : 'border-border hover:border-primary/40'
                      )}
                    >
                      <div className="space-y-2.5">
                        {/* Top Row: Icon + Title + Kind Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-2 rounded-base bg-muted/60 border border-border/80 text-primary shrink-0 group-hover:scale-105 transition-transform">
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-sm text-fg group-hover:text-primary transition-colors truncate">
                                {entity.name}
                              </h3>
                              <span className="text-[10px] text-muted-fg font-mono truncate block">
                                {entity.module}
                              </span>
                            </div>
                          </div>
                          <Badge intent={kindIntent} size="sm" className="shrink-0 font-mono text-[10px] uppercase">
                            {entity.kind}
                          </Badge>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-muted-fg line-clamp-2 leading-relaxed min-h-[32px]">
                          {entity.description || 'Interface AST primitive registered for zero-runtime composition.'}
                        </p>
                      </div>

                      {/* Card Meta & Bottom Row */}
                      <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-muted-fg">
                        <div className="flex items-center gap-2 truncate">
                          {entity.propsCount !== undefined && entity.propsCount > 0 && (
                            <span>{entity.propsCount} props</span>
                          )}
                          {entity.slotsCount !== undefined && entity.slotsCount > 0 && (
                            <span>· {entity.slotsCount} slots</span>
                          )}
                          {entity.methodsCount !== undefined && entity.methodsCount > 0 && (
                            <span>{entity.methodsCount} methods</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-primary group-hover:translate-x-0.5 transition-transform shrink-0 font-semibold">
                          <span>{entity.kind === 'type' ? 'Inspect' : 'Spec'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  )
                }}
                emptyState={
                  <div className="p-12 text-center rounded-macro border border-dashed border-border/80 bg-muted/10 space-y-3">
                    <Search className="w-8 h-8 text-muted-fg mx-auto opacity-50" />
                    <div className="text-sm font-semibold text-fg">No registry items match your query</div>
                    <div className="text-xs text-muted-fg max-w-sm mx-auto">
                      Try searching for another component, hook, engine, or type signature.
                    </div>
                    <Button
                      intent="secondary"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('')
                        setActiveKind('all')
                        setActiveModule('all')
                      }}
                      className="mt-2"
                    >
                      Clear Filters
                    </Button>
                  </div>
                }
                endReachedComponent={
                  <div className="py-4 text-center text-xs text-muted-fg font-mono border-t border-border/40 mt-3">
                    ✓ All {filteredEntities.length} registry entities loaded
                  </div>
                }
              />
            </div>
          </div>
        </div>
      ) : (
        /* 4. In-Browser Interactive CLI Shell (Terminal REPL) */
        <div className="space-y-6">
          {/* Quick Command Prompt Panel with Categories */}
          <div className="p-4 rounded-macro border border-border bg-muted/20 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-fg font-mono">
                  Quick Command Palette
                </span>
              </div>
              <span className="text-[11px] text-muted-fg font-mono">
                Click any chip to load into prompt for editing
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pb-1">
              {CLI_QUICK_COMMAND_CATEGORIES.map((cat) => {
                const isActive = activeCliCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCliCategory(cat.id)}
                    className={cn(
                      'px-2.5 py-1 text-xs rounded-base transition-colors cursor-pointer font-medium',
                      isActive
                        ? 'bg-primary text-primary-fg font-bold shadow-xs'
                        : 'bg-muted/40 hover:bg-muted text-muted-fg hover:text-fg'
                    )}
                  >
                    {cat.label}
                  </button>
                )
              })}
            </div>

            {/* Command Chips Grid */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {CLI_QUICK_COMMANDS.filter(
                (cmd) => activeCliCategory === 'all' || cmd.category === activeCliCategory
              ).map((cmd) => (
                <button
                  key={cmd.command}
                  type="button"
                  onClick={() => {
                    setCliInput(cmd.command)
                    setTimeout(() => {
                      cliInputRef.current?.focus()
                    }, 20)
                  }}
                  title={`${cmd.description} — Click to load into prompt`}
                  className="px-2.5 py-1.5 text-xs font-mono rounded-base border border-border/80 bg-bg hover:bg-muted hover:border-primary/50 text-muted-fg hover:text-fg transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs group text-left"
                >
                  <span className="text-primary font-bold group-hover:scale-110 transition-transform">
                    $
                  </span>
                  <span className="truncate max-w-[280px]">
                    {cmd.command.replace(/^npm run registrar --\s*/, '')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Terminal Console Window */}
          <div className="rounded-macro border border-border/80 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden font-mono flex flex-col min-h-[520px]">
            {/* Terminal Window Bar */}
            <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
                <span className="text-xs text-zinc-400 font-semibold ml-2">
                  registrar-cli v1.0.0 — bash interactive session
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <span className="hidden sm:inline">Zero-Hallucination AST</span>
                <button
                  type="button"
                  onClick={() => setCliHistory([])}
                  className="p-1 hover:text-zinc-100 transition-colors cursor-pointer flex items-center gap-1"
                  title="Clear history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Clear</span>
                </button>
              </div>
            </div>

            {/* Terminal Output Log */}
            <div className="flex-1 p-5 overflow-y-auto space-y-6 text-xs leading-relaxed max-h-[600px]">
              {cliHistory.map((item) => (
                <div key={item.id} className="space-y-2 animate-in fade-in duration-150">
                  {/* Command line prompt header */}
                  <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800/60 pb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-primary font-bold">➜</span>
                      <span className="text-emerald-400 font-bold">@consona/interface</span>
                      <span className="text-zinc-100 font-semibold">{item.command}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 shrink-0">
                      <span>{item.timestamp}</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(
                            typeof item.output === 'object'
                              ? JSON.stringify(item.output, null, 2)
                              : String(item.output),
                            item.id
                          )
                        }
                        className="p-1 hover:text-zinc-200 cursor-pointer flex items-center gap-1"
                        title="Copy command output"
                      >
                        {copiedCliId === item.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>

                  {/* Output Rendering */}
                  <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-base p-3 overflow-x-auto text-zinc-300 select-text">
                    {typeof item.output === 'object' ? (
                      <pre className="font-mono text-xs text-emerald-300 whitespace-pre-wrap">
                        {JSON.stringify(item.output, null, 2)}
                      </pre>
                    ) : (
                      <pre className="font-mono text-xs whitespace-pre-wrap">{item.output}</pre>
                    )}
                  </div>
                </div>
              ))}
              <div ref={cliOutputEndRef} />
            </div>

            {/* Terminal Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                executeCliCommand(cliInput)
              }}
              className="p-3 bg-zinc-900/90 border-t border-zinc-800 flex items-center gap-3"
            >
              <span className="text-primary font-bold text-sm shrink-0">$ registrar &gt;</span>
              <input
                ref={cliInputRef}
                type="text"
                value={cliInput}
                onChange={(e) => setCliInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    if (cliHistory.length === 0) return
                    const nextIdx = historyIndex === -1 ? cliHistory.length - 1 : Math.max(0, historyIndex - 1)
                    setHistoryIndex(nextIdx)
                    setCliInput(cliHistory[nextIdx]?.command || '')
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    if (historyIndex === -1) return
                    const nextIdx = historyIndex + 1
                    if (nextIdx >= cliHistory.length) {
                      setHistoryIndex(-1)
                      setCliInput('')
                    } else {
                      setHistoryIndex(nextIdx)
                      setCliInput(cliHistory[nextIdx]?.command || '')
                    }
                  }
                }}
                placeholder="Type a command or pick a chip above (e.g. --inspect Button --json, --props Card, help)..."
                className="flex-1 bg-transparent text-zinc-100 placeholder:text-zinc-600 focus:outline-none text-xs font-mono"
                autoFocus
              />
              {cliInput && (
                <button
                  type="button"
                  onClick={() => {
                    setCliInput('')
                    cliInputRef.current?.focus()
                  }}
                  className="text-zinc-500 hover:text-zinc-300 text-xs p-1 cursor-pointer"
                  title="Clear input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <Button
                type="submit"
                intent="primary"
                size="sm"
                className="gap-1 text-xs shrink-0 cursor-pointer"
              >
                <span>Run</span>
                <CornerDownLeft className="w-3.5 h-3.5" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
