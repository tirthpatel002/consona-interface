import React, { useState, useMemo } from 'react'
import {
  Sliders,
  Activity,
  Cpu,
  Radio,
  Sparkles,
  Zap,
} from 'lucide-react'
import {
  PageHeaderBlock,
  PageStatsBlock,
  PageFilterToolbar,
  EntityCardGrid,
} from './page-blocks'
import { getAllEngines, type EngineDoc } from '../registry/registry-client'
import { useNavigation } from '@consona/interface'

export interface EnginesPageProps {
  onSelectEngine?: (engineName: string) => void
}

export const EnginesPage: React.FC<EnginesPageProps> = ({ onSelectEngine }) => {
  const { navigate } = useNavigation()
  const handleSelect = onSelectEngine || ((name: string) => navigate(`/architecture/engines/${name}`))

  const [searchQuery, setSearchQuery] = useState('')

  const engines = getAllEngines()

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

  const engineCards = useMemo(() => {
    return filteredEngines.map((e) => {
      const methodCount = e.methods ? Object.keys(e.methods).length : 0
      const eventCount = e.events ? Object.keys(e.events).length : 0

      return {
        id: `engine-${e.name}`,
        title: e.name,
        description: e.description,
        icon: Sliders,
        iconColor: 'text-primary',
        badge: 'Pure TypeScript Engine',
        badgeIntent: 'secondary' as const,
        tags: [
          methodCount > 0 ? `${methodCount} methods` : 'Methods',
          eventCount > 0 ? `${eventCount} events` : 'Events',
          e.module,
        ],
        onClick: () => handleSelect(e.name),
      }
    })
  }, [filteredEngines, handleSelect])

  const totalMethods = engines.reduce(
    (acc, curr) => acc + (curr.methods ? Object.keys(curr.methods).length : 0),
    0
  )
  const totalEvents = engines.reduce(
    (acc, curr) => acc + (curr.events ? Object.keys(curr.events).length : 0),
    0
  )

  return (
    <div className="space-y-10 w-full max-w-7xl mx-auto pb-20">
      <PageHeaderBlock
        title="State & Coordination Engines"
        icon={Sliders}
        iconColor="text-primary"
        badge={`${engines.length} Pure Engines`}
        badgeIntent="secondary"
        description="Framework-agnostic, zero-React state engines managing complex async workflows, audio signal processing, spatial geometry, navigation graphs, and onboarding tours."
        importStatement="import { NavigationEngine, AudioEngine, MapEngine, ... } from '@consona/interface'"
      />

      <PageStatsBlock
        stats={[
          { label: 'State Engines', value: engines.length, subtext: 'Pure TypeScript classes', icon: Sliders, iconColor: 'text-primary' },
          { label: 'Engine Methods', value: totalMethods, subtext: 'Callable runtime APIs', icon: Zap, iconColor: 'text-primary' },
          { label: 'Typed Events', value: totalEvents, subtext: 'Reactive event streams', icon: Radio, iconColor: 'text-primary' },
          { label: 'Framework Deps', value: 'Zero', subtext: '100% headless portability', icon: Cpu, iconColor: 'text-primary' },
        ]}
      />

      <PageFilterToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search engines by name, description, or module..."
        totalResults={filteredEngines.length}
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h2 className="text-xl font-bold text-fg tracking-tight">State Engines ({filteredEngines.length})</h2>
          <span className="text-xs text-muted-fg font-mono">Click an engine to inspect its methods, event payloads, and state models</span>
        </div>
        <EntityCardGrid items={engineCards} columns={3} />
      </div>
    </div>
  )
}
