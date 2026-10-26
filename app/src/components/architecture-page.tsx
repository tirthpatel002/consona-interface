import React, { useState, useMemo } from 'react'
import {
  Activity,
  Box,
  Compass,
  Cpu,
  Layers,
  Radio,
  Search,
  Shield,
  Sliders,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react'
import {
  getAllProviders,
  getAllEngines,
  getAllHooks,
  type ProviderDoc,
  type EngineDoc,
  type HookDoc,
} from '../registry/registry-client'
import { Badge, Input, Kbd, useNavigation } from '@consona/interface'

export interface ArchitecturePageProps {
  onSelectProvider?: (providerName: string) => void
  onSelectEngine?: (engineName: string) => void
  onSelectHook?: (hookName: string) => void
}

export const ArchitecturePage: React.FC<ArchitecturePageProps> = ({
  onSelectProvider,
  onSelectEngine,
  onSelectHook,
}) => {
  const { navigate } = useNavigation()
  const handleProvider = onSelectProvider || ((name: string) => navigate(`/architecture/providers/${name}`))
  const handleEngine = onSelectEngine || ((name: string) => navigate(`/architecture/engines/${name}`))
  const handleHook = onSelectHook || ((name: string) => navigate(`/architecture/hooks/${name}`))

  const [activeTab, setActiveTab] = useState<'providers' | 'engines' | 'hooks'>('providers')
  const [searchQuery, setSearchQuery] = useState('')
  const [hookTypeFilter, setHookTypeFilter] = useState<'all' | 'headless' | 'engine' | 'utility'>('all')

  const providers = getAllProviders()
  const engines = getAllEngines()
  const hooks = getAllHooks()

  const filteredProviders = useMemo(() => {
    if (!searchQuery.trim()) return providers
    const q = searchQuery.toLowerCase()
    return providers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.module.toLowerCase().includes(q)
    )
  }, [providers, searchQuery])

  const filteredEngines = useMemo(() => {
    if (!searchQuery.trim()) return engines
    const q = searchQuery.toLowerCase()
    return engines.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.module.toLowerCase().includes(q)
    )
  }, [engines, searchQuery])

  const filteredHooks = useMemo(() => {
    let list = hooks
    if (hookTypeFilter !== 'all') {
      list = list.filter((h) => h.type === hookTypeFilter)
    }
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.description?.toLowerCase().includes(q) ||
        h.module.toLowerCase().includes(q) ||
        h.returns?.type.toLowerCase().includes(q)
    )
  }, [hooks, searchQuery, hookTypeFilter])

  return (
    <div className="space-y-10 w-full max-w-7xl mx-auto pb-20">
      {/* Hero Header */}
      <div className="space-y-3 border-b border-border pb-8">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-base bg-primary/10 text-primary">
            <Cpu className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-extrabold text-fg tracking-tight">
            Architecture, Engines & Headless Primitives
          </h1>
        </div>
        <p className="text-base text-muted-fg leading-relaxed max-w-4xl">
          Deep-dive into the foundational runtime layers of Consona Interface: 15 Global & Plugin Context
          Providers, 7 High-Throughput TypeScript Engines, and 78 Headless State & DOM Hooks.
        </p>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('providers')}
          className={`p-5 rounded-macro border text-left transition-all cursor-pointer ${
            activeTab === 'providers'
              ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40'
              : 'border-border bg-overlay/30 hover:bg-overlay/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-fg">
              Context Providers
            </span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-fg mt-2 font-mono">{providers.length}</div>
          <p className="text-xs text-muted-fg mt-1">
            Global layers, plugin boundaries & theme scopes
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('engines')}
          className={`p-5 rounded-macro border text-left transition-all cursor-pointer ${
            activeTab === 'engines'
              ? 'border-amber-500 bg-amber-500/10 shadow-sm ring-1 ring-amber-500/40'
              : 'border-border bg-overlay/30 hover:bg-overlay/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-fg">
              State Engines
            </span>
            <Cpu className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-fg mt-2 font-mono">{engines.length}</div>
          <p className="text-xs text-muted-fg mt-1">
            Framework-agnostic physics, audio & tour machines
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hooks')}
          className={`p-5 rounded-macro border text-left transition-all cursor-pointer ${
            activeTab === 'hooks'
              ? 'border-blue-500 bg-blue-500/10 shadow-sm ring-1 ring-blue-500/40'
              : 'border-border bg-overlay/30 hover:bg-overlay/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-fg">
              Headless Hooks
            </span>
            <Sparkles className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-fg mt-2 font-mono">{hooks.length}</div>
          <p className="text-xs text-muted-fg mt-1">
            Headless reactivity, optical scale, ARIA & clipboard
          </p>
        </button>
      </div>

      {/* Tab Controls & Search Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-2 rounded-macro border border-border bg-overlay/20 backdrop-blur-sm">
        <div className="flex items-center gap-1.5 p-1 rounded-base bg-muted/60">
          <button
            type="button"
            onClick={() => setActiveTab('providers')}
            className={`px-3.5 py-1.5 rounded-micro text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'providers'
                ? 'bg-bg text-fg shadow-2xs font-bold'
                : 'text-muted-fg hover:text-fg'
            }`}
          >
            Providers ({providers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('engines')}
            className={`px-3.5 py-1.5 rounded-micro text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'engines'
                ? 'bg-bg text-fg shadow-2xs font-bold'
                : 'text-muted-fg hover:text-fg'
            }`}
          >
            Engines ({engines.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hooks')}
            className={`px-3.5 py-1.5 rounded-micro text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'hooks'
                ? 'bg-bg text-fg shadow-2xs font-bold'
                : 'text-muted-fg hover:text-fg'
            }`}
          >
            Hooks ({hooks.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'hooks' && (
            <div className="flex items-center gap-1 text-xs">
              {(['all', 'headless', 'engine', 'utility'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setHookTypeFilter(t)}
                  className={`px-2 py-1 rounded-micro uppercase font-mono text-[10px] cursor-pointer transition-all ${
                    hookTypeFilter === t
                      ? 'bg-primary text-primary-fg font-bold'
                      : 'text-muted-fg hover:text-fg'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-fg pointer-events-none" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-base border border-border/70 bg-bg text-fg text-xs placeholder:text-muted-fg focus:outline-none focus:ring-1 focus:ring-ring transition-all"
            />
          </div>
        </div>
      </div>

      {/* TAB CONTENT 1: PROVIDERS */}
      {activeTab === 'providers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProviders.map((p) => {
            const typeBadge =
              p.type === 'global'
                ? 'bg-primary/10 border-primary/30 text-primary'
                : p.type === 'plugin'
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'

            const propCount = p.props ? Object.keys(p.props).length : 0
            const ctxCount = p.contextValue ? Object.keys(p.contextValue).length : 0

            return (
              <button
                key={p.name}
                type="button"
                onClick={() => handleProvider(p.name)}
                className="flex flex-col justify-between p-5 rounded-macro border border-border bg-overlay/30 hover:bg-overlay/70 hover:border-primary/50 text-left transition-all group cursor-pointer shadow-2xs hover:shadow-xs space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-extrabold text-fg group-hover:text-primary transition-colors">
                      {p.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-micro border text-[10px] font-mono uppercase font-semibold ${typeBadge}`}
                    >
                      {p.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-fg line-clamp-2 leading-relaxed">
                    {p.description || `Context provider ${p.name}`}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/60 text-[11px] text-muted-fg font-mono">
                  <span>{propCount} Props</span>
                  <span>{ctxCount} Context Methods</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* TAB CONTENT 2: ENGINES */}
      {activeTab === 'engines' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEngines.map((e) => {
            const stateCount = e.state ? Object.keys(e.state).length : 0
            const methodCount = e.methods ? Object.keys(e.methods).length : 0
            const eventCount = e.events ? Object.keys(e.events).length : 0

            return (
              <button
                key={e.name}
                type="button"
                onClick={() => handleEngine(e.name)}
                className="flex flex-col justify-between p-5 rounded-macro border border-border bg-overlay/30 hover:bg-overlay/70 hover:border-amber-500/50 text-left transition-all group cursor-pointer shadow-2xs hover:shadow-xs space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-extrabold text-fg group-hover:text-amber-500 transition-colors">
                      {e.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-micro border text-[10px] font-mono uppercase font-semibold bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400">
                      Engine
                    </span>
                  </div>
                  <p className="text-xs text-muted-fg line-clamp-2 leading-relaxed">
                    {e.description || `State machine ${e.name}`}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/60 text-[11px] text-muted-fg font-mono">
                  <span>{stateCount} State</span>
                  <span>{methodCount} Methods</span>
                  <span>{eventCount} Events</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* TAB CONTENT 3: HOOKS */}
      {activeTab === 'hooks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHooks.map((h) => {
            const typeBadge =
              h.type === 'headless'
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400'
                : h.type === 'engine'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'

            const paramCount = h.parameters ? Object.keys(h.parameters).length : 0

            return (
              <button
                key={h.name}
                type="button"
                onClick={() => handleHook(h.name)}
                className="flex flex-col justify-between p-5 rounded-macro border border-border bg-overlay/30 hover:bg-overlay/70 hover:border-blue-500/50 text-left transition-all group cursor-pointer shadow-2xs hover:shadow-xs space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-extrabold text-fg group-hover:text-blue-500 transition-colors truncate max-w-[200px]">
                      {h.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-micro border text-[10px] font-mono uppercase font-semibold ${typeBadge}`}
                    >
                      {h.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-fg line-clamp-2 leading-relaxed">
                    {h.description || `React primitive ${h.name}`}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/60 text-[11px] text-muted-fg font-mono">
                  <span>{paramCount} Params</span>
                  <span className="truncate max-w-[140px]">{h.returns?.type || 'void'}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
