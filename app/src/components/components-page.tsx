import React, { useState, useMemo } from 'react'
import {
  Box,
  Compass,
  FileText,
  Calendar,
  CircleDot,
  Layers3,
  Layers,
  Sparkles,
  Sliders,
  Volume2,
  BarChart3,
  Globe,
  LayoutGrid,
  Search,
  Wand2,
  GripVertical,
} from 'lucide-react'
import {
  PageHeaderBlock,
  PageStatsBlock,
  PageFilterToolbar,
  EntityCardGrid,
} from './page-blocks'
import { docsRegistry } from '../docs'
import { getAllComponents, getComponentDoc } from '../registry/registry-client'
import { useNavigation } from '@consona/interface'

import {
  COMPONENT_CATEGORIES_CONFIG,
  findCategoryForComponent,
  type ComponentCategoryDefinition,
} from '../navigation/categories'

export { COMPONENT_CATEGORIES_CONFIG, type ComponentCategoryDefinition }


export interface ComponentsPageProps {
  onNavigateToCategory?: (categoryKey: string) => void
  onNavigateToComponent?: (componentId: string) => void
}

export const ComponentsPage: React.FC<ComponentsPageProps> = ({
  onNavigateToCategory,
  onNavigateToComponent,
}) => {
  const { navigate } = useNavigation()
  const handleNavCategory = onNavigateToCategory || ((key: string) => navigate(`/components/category/${key}`))
  const handleNavComponent = onNavigateToComponent || ((id: string) => navigate(`/components/${id}`))

  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'categories' | 'all'>('categories')

  const allComps = getAllComponents()
  const totalCategoryCount = Object.keys(COMPONENT_CATEGORIES_CONFIG).length

  const categoryCards = useMemo(() => {
    return Object.entries(COMPONENT_CATEGORIES_CONFIG).map(([key, cat]) => {
      const validItems = cat.items.filter((id) => Boolean(docsRegistry[id]))
      return {
        id: key,
        title: cat.title,
        description: cat.description,
        icon: cat.icon,
        iconColor: cat.color,
        badge: `${validItems.length} components`,
        tags: validItems.slice(0, 4),
        onClick: () => handleNavCategory(key),
      }
    })
  }, [handleNavCategory])

  const findCategoryKeyForDoc = (docId: string, docName: string): string => {
    return findCategoryForComponent(docId) || findCategoryForComponent(docName.toLowerCase()) || 'foundation'
  }

  const filteredComponents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    const all = Object.entries(docsRegistry).map(([id, doc]) => ({ id, doc })).filter((item) => Boolean(item.doc))
    if (!q) return all
    return all.filter(
      ({ id, doc }) =>
        doc!.name.toLowerCase().includes(q) ||
        doc!.summary?.toLowerCase().includes(q) ||
        id.toLowerCase().includes(q)
    )
  }, [searchQuery])

  const componentCards = useMemo(() => {
    return filteredComponents.map(({ id, doc }) => {
      const catKey = findCategoryKeyForDoc(id, doc!.name)
      const catConfig = COMPONENT_CATEGORIES_CONFIG[catKey]
      const astDoc = getComponentDoc(doc!.name)
      const slotCount = astDoc?.slots ? Object.keys(astDoc.slots).length : 0

      return {
        id,
        title: doc!.name,
        description: doc!.summary || astDoc?.description,
        icon: catConfig?.icon || Box,
        iconColor: catConfig?.color || 'text-primary',
        badge: doc!.badge || (slotCount > 0 ? `${slotCount} slots` : 'Atom'),
        tags: [catConfig?.title || 'Component', doc!.subpath || 'v1.0.0'],
        onClick: () => handleNavComponent(id),
      }
    })
  }, [filteredComponents, handleNavComponent])

  return (
    <div className="space-y-10 w-full max-w-7xl mx-auto pb-20">
      <PageHeaderBlock
        title="Component Fleet & System Primitives"
        icon={Box}
        iconColor="text-primary"
        badge="80+ Production Components"
        badgeIntent="primary"
        description="Comprehensive design system library featuring polymorphic atoms, complex enterprise grids, temporal engines, and rich media widgets built with slot-based composition."
        importStatement="import { Button, Input, Table, Calendar, ... } from '@consona/interface'"
      />

      <PageStatsBlock
        stats={[
          { label: 'Total Components', value: allComps.length || 84, subtext: 'Accessible primitives', icon: Box, iconColor: 'text-primary' },
          { label: 'Categories', value: totalCategoryCount, subtext: 'Functional fleets', icon: LayoutGrid, iconColor: 'text-primary' },
          { label: 'Compound Slots', value: '180+', subtext: 'Dynamic pluggable slots', icon: Layers, iconColor: 'text-primary' },
          { label: 'State Engines', value: '10', subtext: 'Pure headless engines', icon: Sliders, iconColor: 'text-primary' },
        ]}
      />

      <PageFilterToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search all 80+ components by name, category, or keyword..."
        filterOptions={[
          { id: 'categories', label: 'By Category', count: totalCategoryCount },
          { id: 'all', label: 'All Components', count: filteredComponents.length },
        ]}
        activeFilter={viewMode}
        onFilterChange={(id) => setViewMode(id as 'categories' | 'all')}
        totalResults={viewMode === 'categories' ? totalCategoryCount : filteredComponents.length}
      />

      {viewMode === 'categories' && !searchQuery.trim() ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h2 className="text-xl font-bold text-fg tracking-tight">Functional Fleets</h2>
            <span className="text-xs text-muted-fg font-mono">Select a category to view its components</span>
          </div>
          <EntityCardGrid items={categoryCards} columns={3} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h2 className="text-xl font-bold text-fg tracking-tight">
              {searchQuery ? `Search Results (${filteredComponents.length})` : 'All Components'}
            </h2>
            <span className="text-xs text-muted-fg font-mono">
              Displaying {filteredComponents.length} primitives with progressive infinite scroll
            </span>
          </div>
          <EntityCardGrid
            items={componentCards}
            columns={3}
            enableInfiniteScroll
            maxHeight={780}
            initialLoadCount={18}
            appendCount={12}
          />
        </div>
      )}
    </div>
  )
}
