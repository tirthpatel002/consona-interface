import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarItem,
  SidebarRail,
  Kbd,
  Badge,
  useSidebar,
  useNavigation,
  cn,
} from '@consona/interface'
import {
  Box,
  ChevronDown,
  Compass,
  Cpu,
  FileText,
  Palette,
  Search,
  Terminal,
} from 'lucide-react'
import { getAllComponents } from '../registry/registry-client'
import { buildNavTree } from '../navigation'

interface NavCategoryItem {
  id: string
  name: string
  icon: React.ReactNode
  targetPath: string
}

interface NavCategory {
  name: string
  items: NavCategoryItem[]
}

const STORAGE_KEY_COLLAPSED_CATS = 'consona_demo_sidebar_collapsed_categories'
const STORAGE_KEY_EXPANDED_MORE = 'consona_demo_sidebar_expanded_more'

const isDefaultCollapsedCategory = (name: string): boolean => {
  return /engine|hook|provider|plugin/i.test(name)
}

const SidebarNavSection: React.FC<{
  category: NavCategory
  isCategoryCollapsed: boolean
  onToggleCategory: () => void
  isShowMoreExpanded: boolean
  onToggleShowMore: () => void
  selectedId: string
  onSelect: (item: NavCategoryItem) => void
  onHoverItem?: (item: NavCategoryItem) => void
  onLeaveItem?: (item: NavCategoryItem) => void
  onTouchItem?: (item: NavCategoryItem) => void
}> = React.memo(({
  category,
  isCategoryCollapsed,
  onToggleCategory,
  isShowMoreExpanded,
  onToggleShowMore,
  selectedId,
  onSelect,
  onHoverItem,
  onLeaveItem,
  onTouchItem,
}) => {
  const { state } = useSidebar()
  const isSidebarDocked = state === 'collapsed'

  const VISIBLE_LIMIT = 6
  const hasMore = category.items.length > VISIBLE_LIMIT
  const initialItems = hasMore ? category.items.slice(0, VISIBLE_LIMIT) : category.items
  const remainingItems = hasMore ? category.items.slice(VISIBLE_LIMIT) : []

  if (isSidebarDocked) {
    return (
      <div className="flex flex-col gap-y-1 py-1">
        <div className="my-1.5 h-px w-full bg-border/60" />
        {category.items.map((item) => {
          const isSelected = selectedId === item.id
          return (
            <div
              key={item.id}
              onPointerEnter={() => onHoverItem?.(item)}
              onPointerLeave={() => onLeaveItem?.(item)}
              onPointerDown={() => onTouchItem?.(item)}
            >
              <SidebarItem
                icon={item.icon}
                isCurrent={isSelected}
                onClick={() => onSelect?.(item)}
                tooltip={item.name}
              >
                {item.name}
              </SidebarItem>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-y-1">
      <button
        type="button"
        onClick={onToggleCategory}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-base hover:bg-muted/50 text-muted-fg hover:text-fg transition-all cursor-pointer group select-none"
        aria-expanded={!isCategoryCollapsed}
        title={`Toggle ${category.name}`}
      >
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-fg group-hover:text-fg transition-colors truncate">
          {category.name}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-muted/60 text-muted-fg group-hover:bg-muted group-hover:text-fg transition-colors font-medium">
            {category.items.length}
          </span>
          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 text-muted-fg group-hover:text-fg transition-transform duration-200',
              isCategoryCollapsed ? '-rotate-90' : 'rotate-0'
            )}
          />
        </div>
      </button>

      {!isCategoryCollapsed && (
        <div className="flex flex-col gap-y-0.5 animate-in fade-in duration-150">
          {/* First 6 items */}
          {initialItems.map((item) => {
            const isSelected = selectedId === item.id
            return (
              <div
                key={item.id}
                onPointerEnter={() => onHoverItem?.(item)}
                onPointerLeave={() => onLeaveItem?.(item)}
                onPointerDown={() => onTouchItem?.(item)}
              >
                <SidebarItem
                  icon={item.icon}
                  isCurrent={isSelected}
                  onClick={() => onSelect?.(item)}
                  tooltip={item.name}
                >
                  {item.name}
                </SidebarItem>
              </div>
            )
          })}

          {/* Sub-collapsible for remaining items (>6) */}
          {hasMore && (
            <div className="flex flex-col gap-y-0.5 mt-0.5">
              <button
                type="button"
                onClick={onToggleShowMore}
                className="w-full flex items-center justify-between px-2.5 py-1 rounded-base hover:bg-muted/40 text-muted-fg hover:text-fg text-xs transition-colors cursor-pointer group select-none"
                aria-expanded={isShowMoreExpanded}
                title={isShowMoreExpanded ? 'Show fewer items' : `Show ${remainingItems.length} more items`}
              >
                <span className="text-[11px] font-medium text-muted-fg group-hover:text-fg flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-primary/60" />
                  {isShowMoreExpanded ? 'Show less' : `+${remainingItems.length} more`}
                </span>
                <ChevronDown
                  className={cn(
                    'w-3 h-3 text-muted-fg group-hover:text-fg transition-transform duration-200',
                    isShowMoreExpanded ? 'rotate-180' : 'rotate-0'
                  )}
                />
              </button>

              {isShowMoreExpanded && (
                <div className="flex flex-col gap-y-0.5 pl-1.5 border-l border-border/40 ml-2 animate-in fade-in slide-in-from-top-1 duration-150">
                  {remainingItems.map((item) => {
                    const isSelected = selectedId === item.id
                    return (
                      <div
                        key={item.id}
                        onPointerEnter={() => onHoverItem?.(item)}
                        onPointerLeave={() => onLeaveItem?.(item)}
                        onPointerDown={() => onTouchItem?.(item)}
                      >
                        <SidebarItem
                          icon={item.icon}
                          isCurrent={isSelected}
                          onClick={() => onSelect?.(item)}
                          tooltip={item.name}
                        >
                          {item.name}
                        </SidebarItem>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
})

const AppSidebarFooter: React.FC<{ totalCount: number }> = ({ totalCount }) => {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  if (isCollapsed) {
    return (
      <div className="flex items-center justify-center w-full">
        <Badge intent="outline" size="sm" className="font-mono text-[10px] px-1.5">
          {totalCount}
        </Badge>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 font-mono text-[11px]">
      <Badge intent="outline" size="sm">
        {totalCount} Components
      </Badge>
    </div>
  )
}

export interface AppSidebarProps {
  onOpenSearch?: () => void
  onOpenThemeEditor?: () => void
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  onOpenSearch,
  onOpenThemeEditor,
}) => {
  const { activeId, navigate, prefetchOnIntent, cancelPrefetch, prefetch } = useNavigation()

  // Persisted category collapse states
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_COLLAPSED_CATS)
        if (saved) {
          return JSON.parse(saved)
        }
      } catch {}
    }
    return {}
  })

  // Persisted sub-collapsible (>6 items) expand states
  const [expandedMore, setExpandedMore] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_EXPANDED_MORE)
        if (saved) {
          return JSON.parse(saved)
        }
      } catch {}
    }
    return {}
  })

  const allComps = getAllComponents()
  const navTree = useMemo(() => buildNavTree(), [])

  const handleHoverItem = useCallback(
    (item: NavCategoryItem) => {
      prefetchOnIntent(item.targetPath, 65)
    },
    [prefetchOnIntent]
  )

  const handleLeaveItem = useCallback(
    (item: NavCategoryItem) => {
      cancelPrefetch(item.targetPath)
    },
    [cancelPrefetch]
  )

  const handleTouchItem = useCallback(
    (item: NavCategoryItem) => {
      prefetch(item.targetPath).catch(() => {})
    },
    [prefetch]
  )

  // Group items for sidebar navigation dynamically derived from navTree
  const navCategories: NavCategory[] = useMemo(() => {
    const categories: NavCategory[] = []

    // 1. Architecture branch
    const archNode = navTree.find((n) => n.id === 'architecture-root')
    if (archNode?.children) {
      archNode.children.forEach((sub) => {
        if (sub.children && sub.children.length > 0) {
          const iconColor = 'text-primary'

          categories.push({
            name: `${sub.title} (${sub.children.length})`,
            items: sub.children.map((child) => ({
              id: child.id,
              name: child.title,
              targetPath: child.href || `/${child.id}`,
              icon: sub.icon ? <sub.icon className={`w-4 h-4 ${iconColor}`} /> : <Box className="w-4 h-4 text-primary" />,
            })),
          })
        }
      })
    }

    // 2. Component Categories branch
    const compNode = navTree.find((n) => n.id === 'components-root')
    if (compNode?.children) {
      compNode.children.forEach((cat) => {
        if (cat.children && cat.children.length > 0) {
          categories.push({
            name: cat.title,
            items: cat.children.map((child) => ({
              id: child.id,
              name: child.title,
              targetPath: child.href || `/components/${child.id}`,
              icon: cat.icon ? <cat.icon className="w-4 h-4 text-primary" /> : <Box className="w-4 h-4 text-primary" />,
            })),
          })
        }
      })
    }

    return categories
  }, [navTree])

  const toggleCategory = useCallback((catName: string) => {
    setCollapsedCategories((prev) => {
      const current = prev[catName] !== undefined ? prev[catName] : isDefaultCollapsedCategory(catName)
      const next = {
        ...prev,
        [catName]: !current,
      }
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY_COLLAPSED_CATS, JSON.stringify(next))
        } catch {}
      }
      return next
    })
  }, [])

  const toggleShowMore = useCallback((catName: string) => {
    setExpandedMore((prev) => {
      const next = {
        ...prev,
        [catName]: !prev[catName],
      }
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY_EXPANDED_MORE, JSON.stringify(next))
        } catch {}
      }
      return next
    })
  }, [])

  // Auto-expand category and sub-collapsible if active component is inside a collapsed section
  useEffect(() => {
    const parentCat = navCategories.find((cat) => cat.items.some((item) => item.id === activeId))
    if (parentCat) {
      const isCollapsed =
        collapsedCategories[parentCat.name] !== undefined
          ? collapsedCategories[parentCat.name]
          : isDefaultCollapsedCategory(parentCat.name)

      if (isCollapsed) {
        setCollapsedCategories((prev) => {
          const next = {
            ...prev,
            [parentCat.name]: false,
          }
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(STORAGE_KEY_COLLAPSED_CATS, JSON.stringify(next))
            } catch {}
          }
          return next
        })
      }

      // Check if selected item is among >6 items (in the sub-collapsible)
      const itemIndex = parentCat.items.findIndex((item) => item.id === activeId)
      if (itemIndex >= 6 && !expandedMore[parentCat.name]) {
        setExpandedMore((prev) => {
          const next = {
            ...prev,
            [parentCat.name]: true,
          }
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(STORAGE_KEY_EXPANDED_MORE, JSON.stringify(next))
            } catch {}
          }
          return next
        })
      }
    }
  }, [activeId, navCategories])

  const handleSelectItem = useCallback(
    (item: NavCategoryItem) => {
      navigate(item.targetPath)
    },
    [navigate]
  )

  return (
    <Sidebar
      collapsible="hidden"
      className="border-r border-border bg-bg shrink-0 h-full"
      slots={{
        header: ({ isCollapsed }: any) => (
          <div className="p-3 border-b border-border/70 flex flex-col gap-2.5">
            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              <div className="w-7 h-7 shrink-0 rounded-base bg-primary text-primary-fg flex items-center justify-center font-black text-sm shadow-xs">
                C
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <div className="font-extrabold text-sm text-fg tracking-tight truncate">
                    Consona Interface
                  </div>
                  <div className="text-[10px] text-muted-fg font-mono truncate">
                    Workbench v1.0.0
                  </div>
                </div>
              )}
            </div>

            {/* Quick Search Bar */}
            {!isCollapsed ? (
              <button
                type="button"
                onClick={onOpenSearch}
                className="w-full px-2.5 py-1.5 rounded-base border border-border/80 bg-muted/30 hover:bg-muted/60 text-muted-fg text-xs flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
                  <span>Search docs...</span>
                </div>
                <Kbd>⌘K</Kbd>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenSearch}
                className="w-7 h-7 mx-auto rounded-base border border-border/80 bg-muted/30 hover:bg-muted/60 text-muted-fg flex items-center justify-center transition-all cursor-pointer group"
                title="Search docs (⌘K)"
              >
                <Search className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
              </button>
            )}
          </div>
        ),
      }}
    >
      {/* Sidebar Navigation Items */}
      <SidebarContent className="p-2.5 space-y-3 overflow-y-auto">
        <div className="flex flex-col gap-y-0.5">
          <SidebarItem
            icon={<Compass className="w-4 h-4 text-primary" />}
            isCurrent={activeId === 'overview'}
            onClick={() => navigate('/')}
            tooltip="Overview"
          >
            Overview
          </SidebarItem>
          <SidebarItem
            icon={<Terminal className="w-4 h-4 text-primary" />}
            isCurrent={activeId === 'registrar'}
            onClick={() => navigate('/registrar')}
            tooltip="Registrar & CLI Catalog"
          >
            Registrar & CLI
          </SidebarItem>
          <SidebarItem
            icon={<Box className="w-4 h-4 text-primary" />}
            isCurrent={activeId === 'components-root' || activeId.startsWith('cat-')}
            onClick={() => navigate('/components')}
            tooltip="All Components Hub"
          >
            Components Hub
          </SidebarItem>
          <SidebarItem
            icon={<Cpu className="w-4 h-4 text-primary" />}
            isCurrent={activeId === 'architecture'}
            onClick={() => navigate('/architecture')}
            tooltip="Architecture & Hub"
          >
            Architecture & Hub
          </SidebarItem>
          <SidebarItem
            icon={<FileText className="w-4 h-4 text-primary" />}
            isCurrent={activeId === 'readme'}
            onClick={() => navigate('/documentation')}
            tooltip="Architecture Spec (README)"
          >
            Architecture Spec
          </SidebarItem>
          <SidebarItem
            icon={<FileText className="w-4 h-4 text-primary" />}
            isCurrent={activeId === 'navigation-spec'}
            onClick={() => navigate('/documentation/navigation')}
            tooltip="Navigation Spec"
          >
            Navigation Spec
          </SidebarItem>
          <SidebarItem
            icon={<Palette className="w-4 h-4 text-primary" />}
            isCurrent={false}
            onClick={onOpenThemeEditor}
            tooltip="Theme Editor"
          >
            Theme Editor
          </SidebarItem>
        </div>

        <div className="h-px w-full bg-border/60" />

        {navCategories.map((cat) => {
          const isCatCollapsed =
            collapsedCategories[cat.name] !== undefined
              ? collapsedCategories[cat.name]
              : isDefaultCollapsedCategory(cat.name)

          return (
            <SidebarNavSection
              key={cat.name}
              category={cat}
              isCategoryCollapsed={isCatCollapsed}
              onToggleCategory={() => toggleCategory(cat.name)}
              isShowMoreExpanded={!!expandedMore[cat.name]}
              onToggleShowMore={() => toggleShowMore(cat.name)}
              selectedId={activeId}
              onSelect={handleSelectItem}
              onHoverItem={handleHoverItem}
              onLeaveItem={handleLeaveItem}
              onTouchItem={handleTouchItem}
            />
          )
        })}
      </SidebarContent>

      {/* Sidebar Footer */}
      <SidebarFooter className="p-3 border-t border-border/70 flex items-center justify-between text-xs text-muted-fg overflow-hidden">
        <AppSidebarFooter totalCount={allComps.length} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
