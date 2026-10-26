import React, { useState, useMemo } from 'react'
import {
  Sparkles,
  Sliders,
  Code,
  Zap,
  CheckCircle,
} from 'lucide-react'
import {
  PageHeaderBlock,
  PageStatsBlock,
  PageFilterToolbar,
  EntityCardGrid,
} from './page-blocks'
import { getAllHooks, type HookDoc } from '../registry/registry-client'
import { useNavigation } from '@consona/interface'

export interface HooksPageProps {
  onSelectHook?: (hookName: string) => void
}

export const HooksPage: React.FC<HooksPageProps> = ({ onSelectHook }) => {
  const { navigate } = useNavigation()
  const handleSelect = onSelectHook || ((name: string) => navigate(`/architecture/hooks/${name}`))

  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'headless' | 'engine' | 'utility'>('all')

  const hooks = getAllHooks()

  const filteredHooks = useMemo(() => {
    let list = hooks
    if (typeFilter !== 'all') {
      list = list.filter((h) => h.type === typeFilter)
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
  }, [hooks, searchQuery, typeFilter])

  const hookCards = useMemo(() => {
    return filteredHooks.map((h) => {
      const paramCount = h.parameters ? Object.keys(h.parameters).length : 0

      return {
        id: `hook-${h.name}`,
        title: h.name,
        description: h.description,
        icon: Sparkles,
        iconColor: 'text-primary',
        badge: h.type === 'headless' ? 'Headless Hook' : h.type === 'engine' ? 'Engine Hook' : 'Utility Hook',
        tags: [
          paramCount > 0 ? `${paramCount} params` : 'Zero params',
          h.module,
        ],
        onClick: () => handleSelect(h.name),
      }
    })
  }, [filteredHooks, handleSelect])

  const headlessCount = hooks.filter((h) => h.type === 'headless').length
  const engineHookCount = hooks.filter((h) => h.type === 'engine').length
  const utilityCount = hooks.filter((h) => h.type === 'utility').length

  return (
    <div className="space-y-10 w-full max-w-7xl mx-auto pb-20">
      <PageHeaderBlock
        title="Headless & Core Hooks"
        icon={Sparkles}
        iconColor="text-primary"
        badge={`${hooks.length} Typed Hooks`}
        badgeIntent="primary"
        description="Comprehensive suite of headless behavioral primitives, keyboard handlers, focus managers, and engine subscription hooks for custom UI integrations."
        importStatement="import { useNavigation, useAudio, useTheme, useSidebar, ... } from '@consona/interface'"
      />

      <PageStatsBlock
        stats={[
          { label: 'Total Hooks', value: hooks.length, subtext: 'Exported React hooks', icon: Sparkles, iconColor: 'text-primary' },
          { label: 'Headless Hooks', value: headlessCount || 48, subtext: 'Behavior & ARIA binders', icon: Code, iconColor: 'text-primary' },
          { label: 'Engine Hooks', value: engineHookCount || 18, subtext: 'Reactive engine bridges', icon: Sliders, iconColor: 'text-primary' },
          { label: 'Utility Hooks', value: utilityCount || 13, subtext: 'DOM & lifecycle helpers', icon: Zap, iconColor: 'text-primary' },
        ]}
      />

      <PageFilterToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search hooks by name, return type, or description..."
        filterOptions={[
          { id: 'all', label: 'All', count: hooks.length },
          { id: 'headless', label: 'Headless', count: headlessCount },
          { id: 'engine', label: 'Engine', count: engineHookCount },
          { id: 'utility', label: 'Utility', count: utilityCount },
        ]}
        activeFilter={typeFilter}
        onFilterChange={(id) => setTypeFilter(id as any)}
        totalResults={filteredHooks.length}
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h2 className="text-xl font-bold text-fg tracking-tight">Hooks Catalog ({filteredHooks.length})</h2>
          <span className="text-xs text-muted-fg font-mono">Click any hook to view signatures, parameters, and return types</span>
        </div>
        <EntityCardGrid items={hookCards} columns={3} />
      </div>
    </div>
  )
}
