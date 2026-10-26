import React from 'react'
import {
  Cpu,
  ChevronLeft,
  Layers,
  Sparkles,
  Sliders,
  Box,
  Terminal,
  ExternalLink,
  Radio,
} from 'lucide-react'
import {
  PageHeaderBlock,
  PageStatsBlock,
  EntityCardGrid,
} from './page-blocks'
import { getPluginDoc, type PluginDoc } from '../registry/registry-client'
import { Badge, useNavigation } from '@consona/interface'

export interface PluginDocViewProps {
  pluginName?: string
  onNavigateBack?: () => void
  onNavigateToComponent?: (id: string) => void
  onNavigateToEngine?: (name: string) => void
  onNavigateToProvider?: (name: string) => void
  onNavigateToHook?: (name: string) => void
}

export const PluginDocView: React.FC<PluginDocViewProps> = ({
  pluginName: propPluginName,
  onNavigateBack,
  onNavigateToComponent,
  onNavigateToEngine,
  onNavigateToProvider,
  onNavigateToHook,
}) => {
  const { params, activeNode, navigate } = useNavigation()
  const pluginName = propPluginName || params.name || activeNode?.data?.name || 'audio'
  const plugin = getPluginDoc(pluginName)

  const handleBack = onNavigateBack || (() => navigate('/architecture/plugins'))
  const handleNavComponent = onNavigateToComponent || ((c: string) => navigate(`/components/${c}`))

  if (!plugin) {
    return (
      <div className="space-y-6 w-full max-w-7xl mx-auto pb-20">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-base border border-border bg-muted/30 hover:bg-muted text-xs font-semibold text-muted-fg hover:text-fg transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to Plugins</span>
        </button>
        <div className="p-12 text-center rounded-macro border border-dashed border-border bg-muted/10">
          <h2 className="text-xl font-bold text-fg">Plugin Not Found</h2>
          <p className="text-sm text-muted-fg mt-2">Could not find plugin documentation for "{pluginName}".</p>
        </div>
      </div>
    )
  }

  const importStatement = `import { ${plugin.name} } from '${plugin.module}'`

  return (
    <div className="space-y-10 w-full max-w-7xl mx-auto pb-20">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-base border border-border bg-muted/30 hover:bg-muted text-xs font-semibold text-muted-fg hover:text-fg transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to Plugins Catalog</span>
        </button>
      </div>

      <PageHeaderBlock
        title={plugin.name}
        icon={Cpu}
        iconColor="text-emerald-500"
        badge="Plugin Extension"
        badgeIntent="primary"
        description={plugin.description}
        importStatement={importStatement}
      />

      <PageStatsBlock
        stats={[
          { label: 'Subpath Module', value: plugin.module.replace('@consona/interface/', ''), subtext: 'Import entrypoint', icon: Terminal, iconColor: 'text-primary' },
          { label: 'Context Provider', value: plugin.hasProvider ? 'Yes' : 'No', subtext: plugin.hasProvider ? 'Includes provider' : 'Engine only', icon: Layers, iconColor: 'text-purple-500' },
          { label: 'Reactive Events', value: plugin.events?.length || 0, subtext: 'Dispatched events', icon: Radio, iconColor: 'text-amber-500' },
          { label: 'Domain Components', value: plugin.components?.length || 0, subtext: 'Bundled UI elements', icon: Box, iconColor: 'text-blue-500' },
        ]}
      />

      {/* Plugin Ecosystem Sub-Sections */}
      <div className="space-y-8">
        {plugin.events && plugin.events.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-fg tracking-tight flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-500" />
              <span>Dispatched Events ({plugin.events.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {plugin.events.map((evtName) => (
                <div
                  key={evtName}
                  className="p-3.5 rounded-macro border border-border bg-card font-mono text-xs text-fg flex items-center justify-between"
                >
                  <span>{evtName}</span>
                  <Badge intent="outline" size="sm">Event</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {plugin.components && plugin.components.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-fg tracking-tight flex items-center gap-2">
              <Box className="w-4 h-4 text-primary" />
              <span>Domain Components ({plugin.components.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {plugin.components.map((cName) => (
                <div
                  key={cName}
                  onClick={() => handleNavComponent(cName.toLowerCase())}
                  className="p-3.5 rounded-macro border border-border bg-card hover:bg-muted/30 hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-between font-medium text-xs text-fg"
                >
                  <span className="font-bold">{cName}</span>
                  <Badge intent="outline" size="sm">Component</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
