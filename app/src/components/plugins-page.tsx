import React, { useState, useMemo } from 'react'
import {
  Cpu,
  Layers,
  Sparkles,
  Sliders,
  Box,
  CheckCircle,
} from 'lucide-react'
import {
  PageHeaderBlock,
  PageStatsBlock,
  PageFilterToolbar,
  EntityCardGrid,
} from './page-blocks'
import { getAllPlugins, type PluginDoc } from '../registry/registry-client'
import { useNavigation } from '@consona/interface'

export interface PluginsPageProps {
  onSelectPlugin?: (pluginName: string) => void
}

export const PluginsPage: React.FC<PluginsPageProps> = ({ onSelectPlugin }) => {
  const { navigate } = useNavigation()
  const handleSelect = onSelectPlugin || ((name: string) => navigate(`/architecture/plugins/${name}`))

  const [searchQuery, setSearchQuery] = useState('')

  const plugins = getAllPlugins()

  const filteredPlugins = useMemo(() => {
    if (!searchQuery.trim()) return plugins
    const q = searchQuery.toLowerCase()
    return plugins.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.module.toLowerCase().includes(q)
    )
  }, [plugins, searchQuery])

  const pluginCards = useMemo(() => {
    return filteredPlugins.map((p) => {
      const compCount = p.components?.length || 0
      const eventCount = p.events?.length || 0

      return {
        id: `plugin-${p.name}`,
        title: p.name,
        description: p.description,
        icon: Cpu,
        iconColor: 'text-primary',
        badge: p.hasProvider ? 'Provider Plugin' : 'Extension Plugin',
        badgeIntent: 'primary' as const,
        tags: [
          compCount > 0 ? `${compCount} components` : 'Components',
          eventCount > 0 ? `${eventCount} events` : 'Events',
          p.module,
        ],
        onClick: () => handleSelect(p.name),
      }
    })
  }, [filteredPlugins, handleSelect])

  return (
    <div className="space-y-10 w-full max-w-7xl mx-auto pb-20">
      <PageHeaderBlock
        title="Pluggable Subsystem Extensions"
        icon={Cpu}
        iconColor="text-primary"
        badge={`${plugins.length} Plugins`}
        badgeIntent="primary"
        description="Modular, opt-in subsystem plugins packaging dedicated engines, providers, hooks, and domain components for rich audio, navigation, charts, mapping, and onboarding."
        importStatement="import { audioPlugin, navigationPlugin, mapPlugin, ... } from '@consona/interface'"
      />

      <PageStatsBlock
        stats={[
          { label: 'Total Plugins', value: plugins.length, subtext: 'Pluggable extensions', icon: Cpu, iconColor: 'text-primary' },
          { label: 'Bundled Engines', value: '8', subtext: 'Headless core engines', icon: Sliders, iconColor: 'text-primary' },
          { label: 'Specialized Hooks', value: '30+', subtext: 'Domain hook binders', icon: Sparkles, iconColor: 'text-primary' },
          { label: 'Modular Isolation', value: '100%', subtext: 'Tree-shakeable subpaths', icon: Box, iconColor: 'text-primary' },
        ]}
      />

      <PageFilterToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search plugins by name, module, or description..."
        totalResults={filteredPlugins.length}
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h2 className="text-xl font-bold text-fg tracking-tight">Installed Plugins ({filteredPlugins.length})</h2>
          <span className="text-xs text-muted-fg font-mono">Click a plugin to view exported providers, engines, hooks, and components</span>
        </div>
        <EntityCardGrid items={pluginCards} columns={3} />
      </div>
    </div>
  )
}
