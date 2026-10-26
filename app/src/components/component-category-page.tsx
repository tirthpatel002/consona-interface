import React, { useState, useMemo } from 'react'
import {
  Box,
  ChevronLeft,
  Layers,
  Sparkles,
  Sliders,
  Terminal,
} from 'lucide-react'
import {
  PageHeaderBlock,
  PageStatsBlock,
  PageFilterToolbar,
  EntityCardGrid,
} from './page-blocks'
import { COMPONENT_CATEGORIES_CONFIG } from '../navigation'
import { docsRegistry } from '../docs'
import { getComponentDoc } from '../registry/registry-client'
import { Button, useNavigation } from '@consona/interface'

export interface ComponentCategoryPageProps {
  categoryKey?: string
  category?: string
  onNavigateBack?: () => void
  onNavigateToComponent?: (componentId: string) => void
}

export const ComponentCategoryPage: React.FC<ComponentCategoryPageProps> = ({
  categoryKey: propCategoryKey,
  category: propCategory,
  onNavigateBack,
  onNavigateToComponent,
} = {}) => {
  const { params, activeNode, navigate } = useNavigation()
  const categoryKey =
    propCategoryKey ||
    propCategory ||
    params.category ||
    activeNode?.id?.replace('cat-', '') ||
    'form'

  const handleBack = onNavigateBack || (() => navigate('/components'))
  const handleNavComponent = onNavigateToComponent || ((id: string) => navigate(`/components/${id}`))

  const [searchQuery, setSearchQuery] = useState('')

  const config =
    COMPONENT_CATEGORIES_CONFIG[categoryKey.toLowerCase()] || {
      title: `${categoryKey.toUpperCase()} Components`,
      icon: Box,
      color: 'text-primary',
      description: `Components belonging to the ${categoryKey} category.`,
      items: [],
    }

  const categoryDocs = useMemo(() => {
    return config.items
      .map((id) => {
        const doc = docsRegistry[id]
        const astDoc = getComponentDoc(id)
        if (!doc) return null
        return {
          id,
          doc,
          astDoc,
        }
      })
      .filter(Boolean) as { id: string; doc: any; astDoc: any }[]
  }, [config.items])

  const filteredDocs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return categoryDocs
    return categoryDocs.filter(
      (item) =>
        item.doc.name.toLowerCase().includes(q) ||
        item.doc.summary?.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
    )
  }, [categoryDocs, searchQuery])

  const componentCards = useMemo(() => {
    return filteredDocs.map(({ id, doc, astDoc }) => {
      const propCount = astDoc?.props ? Object.keys(astDoc.props).length : 0
      const slotCount = astDoc?.slots ? Object.keys(astDoc.slots).length : 0

      return {
        id,
        title: doc.name,
        description: doc.summary || astDoc?.description,
        icon: config.icon,
        iconColor: config.color,
        badge: doc.badge || (slotCount > 0 ? `${slotCount} slots` : 'Atom'),
        tags: [
          propCount > 0 ? `${propCount} props` : 'Zero props',
          doc.category || categoryKey,
        ],
        onClick: () => handleNavComponent(id),
      }
    })
  }, [filteredDocs, config.icon, config.color, categoryKey, handleNavComponent])

  const totalProps = categoryDocs.reduce((acc, curr) => {
    return acc + (curr.astDoc?.props ? Object.keys(curr.astDoc.props).length : 0)
  }, 0)

  const totalSlots = categoryDocs.reduce((acc, curr) => {
    return acc + (curr.astDoc?.slots ? Object.keys(curr.astDoc.slots).length : 0)
  }, 0)

  return (
    <div className="space-y-10 w-full max-w-7xl mx-auto pb-20">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-base border border-border bg-muted/30 hover:bg-muted text-xs font-semibold text-muted-fg hover:text-fg transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to All Categories</span>
        </button>
      </div>

      <PageHeaderBlock
        title={config.title}
        icon={config.icon}
        iconColor={config.color}
        badge={`${categoryDocs.length} Components`}
        badgeIntent="primary"
        description={config.description}
        importStatement={`import { ${categoryDocs.slice(0, 4).map((c) => c.doc.name).join(', ')} } from '@consona/interface'`}
      />

      <PageStatsBlock
        stats={[
          { label: 'Category Components', value: categoryDocs.length, subtext: 'Registered primitives', icon: config.icon, iconColor: config.color },
          { label: 'Contract Props', value: totalProps || '50+', subtext: 'Typed options', icon: Sliders, iconColor: 'text-amber-500' },
          { label: 'Compound Slots', value: totalSlots || '12+', subtext: 'Customizable subcomponents', icon: Layers, iconColor: 'text-purple-500' },
          { label: 'Accessibility', value: 'WAI-ARIA', subtext: 'Keyboard & screen-reader ready', icon: Sparkles, iconColor: 'text-emerald-500' },
        ]}
      />

      <PageFilterToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={`Search within ${config.title}...`}
        totalResults={filteredDocs.length}
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h2 className="text-xl font-bold text-fg tracking-tight">Components in {config.title}</h2>
          <span className="text-xs text-muted-fg font-mono">Select any component to open its interactive playground</span>
        </div>
        <EntityCardGrid items={componentCards} columns={3} />
      </div>
    </div>
  )
}
