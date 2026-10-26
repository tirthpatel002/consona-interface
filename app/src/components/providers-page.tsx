import React, { useState, useMemo } from 'react'
import {
  Layers,
  Sparkles,
  Cpu,
  Radio,
  Sliders,
  Terminal,
} from 'lucide-react'
import {
  PageHeaderBlock,
  PageStatsBlock,
  PageFilterToolbar,
  EntityCardGrid,
} from './page-blocks'
import { getAllProviders, type ProviderDoc } from '../registry/registry-client'
import { useNavigation } from '@consona/interface'

export interface ProvidersPageProps {
  onSelectProvider?: (providerName: string) => void
}

export const ProvidersPage: React.FC<ProvidersPageProps> = ({ onSelectProvider }) => {
  const { navigate } = useNavigation()
  const handleSelect = onSelectProvider || ((name: string) => navigate(`/architecture/providers/${name}`))

  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'global' | 'plugin' | 'scoped'>('all')

  const providers = getAllProviders()

  const filteredProviders = useMemo(() => {
    let list = providers
    if (typeFilter !== 'all') {
      list = list.filter((p) => p.type === typeFilter)
    }
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.module.toLowerCase().includes(q)
    )
  }, [providers, searchQuery, typeFilter])

  const providerCards = useMemo(() => {
    return filteredProviders.map((p) => {
      const hookCount = p.providedHooks?.length || 0
      const propCount = p.props ? Object.keys(p.props).length : 0

      return {
        id: `provider-${p.name}`,
        title: p.name,
        description: p.description,
        icon: Layers,
        iconColor: 'text-primary',
        badge: p.type === 'global' ? 'Global Provider' : p.type === 'plugin' ? 'Plugin Provider' : 'Scoped Provider',
        tags: [
          hookCount > 0 ? `${hookCount} hooks` : 'Zero hooks',
          propCount > 0 ? `${propCount} props` : 'Zero props',
          p.module,
        ],
        onClick: () => handleSelect(p.name),
      }
    })
  }, [filteredProviders, handleSelect])

  const globalCount = providers.filter((p) => p.type === 'global').length
  const pluginCount = providers.filter((p) => p.type === 'plugin').length

  return (
    <div className="space-y-10 w-full max-w-7xl mx-auto pb-20">
      <PageHeaderBlock
        title="Providers & Context Runtime"
        icon={Layers}
        iconColor="text-primary"
        badge={`${providers.length} Registered Providers`}
        badgeIntent="primary"
        description="Unified context tree infrastructure supplying reactive states, theme tokens, audio engines, and navigation topologies across the application."
        importStatement="import { InterfaceProvider, ThemeProvider, NavigationProvider, ... } from '@consona/interface'"
      />

      <PageStatsBlock
        stats={[
          { label: 'Total Providers', value: providers.length, subtext: 'Context hierarchies', icon: Layers, iconColor: 'text-primary' },
          { label: 'Global Providers', value: globalCount, subtext: 'Root-level context', icon: Sparkles, iconColor: 'text-primary' },
          { label: 'Plugin Providers', value: pluginCount, subtext: 'Feature-scoped bundles', icon: Cpu, iconColor: 'text-primary' },
          { label: 'Shared Hooks', value: '75+', subtext: 'Context consumer hooks', icon: Sliders, iconColor: 'text-primary' },
        ]}
      />

      <PageFilterToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search providers by name, description, or module..."
        filterOptions={[
          { id: 'all', label: 'All', count: providers.length },
          { id: 'global', label: 'Global', count: globalCount },
          { id: 'plugin', label: 'Plugin', count: pluginCount },
        ]}
        activeFilter={typeFilter}
        onFilterChange={(id) => setTypeFilter(id as any)}
        totalResults={filteredProviders.length}
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h2 className="text-xl font-bold text-fg tracking-tight">Context Providers ({filteredProviders.length})</h2>
          <span className="text-xs text-muted-fg font-mono">Click a provider to inspect its props, context value, and hooks</span>
        </div>
        <EntityCardGrid items={providerCards} columns={3} />
      </div>
    </div>
  )
}
