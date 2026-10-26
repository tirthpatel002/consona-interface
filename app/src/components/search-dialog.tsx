import React, { useEffect, useState, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Search,
  X,
  Sparkles,
  Compass,
  FileText,
  CornerDownLeft,
  Layers,
  Cpu,
  Sliders,
  Box,
  Terminal,
} from 'lucide-react'
import {
  getAllComponents,
  getAllProviders,
  getAllEngines,
  getAllHooks,
  getAllPlugins,
} from '../registry/registry-client'
import { COMPONENT_CATEGORIES_CONFIG } from '../navigation'
import { docsRegistry } from '../docs'
import { Badge, Kbd } from '@consona/interface'

export interface SearchDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelect?: (targetPath: string) => void
  onSelectComponent?: (idOrPath: string) => void
}

interface SearchItem {
  id: string
  name: string
  href: string
  categoryName: string
  type: 'overview' | 'readme' | 'architecture' | 'provider' | 'engine' | 'hook' | 'plugin' | 'category' | 'component'
  description?: string
  badge?: string
  badgeIntent?: 'primary' | 'secondary' | 'accent' | 'outline'
  icon?: any
  iconColor?: string
}

export const SearchDialog: React.FC<SearchDialogProps> = ({
  isOpen,
  onClose,
  onSelect,
  onSelectComponent,
}) => {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsContainerRef = useRef<HTMLDivElement>(null)

  // Dynamically derive all searchable items from the single source of truth
  const masterItems: SearchItem[] = useMemo(() => {
    const items: SearchItem[] = [
      {
        id: 'overview',
        name: 'Platform Overview',
        href: '/',
        type: 'overview',
        categoryName: 'General',
        description: 'Introduction, design philosophy, architecture pillars, and component matrix.',
        icon: Compass,
        iconColor: 'text-primary',
        badge: 'Hub',
        badgeIntent: 'primary',
      },
      {
        id: 'readme',
        name: 'Architecture Spec (README)',
        href: '/documentation',
        type: 'readme',
        categoryName: 'General',
        description: 'Core platform specifications, slot architecture, and token system.',
        icon: FileText,
        iconColor: 'text-primary',
        badge: 'Spec',
        badgeIntent: 'secondary',
      },
      {
        id: 'architecture',
        name: 'Architecture & Engine Hub',
        href: '/architecture',
        type: 'architecture',
        categoryName: 'General',
        description: 'System-wide overview of context providers, state engines, headless hooks, and plugins.',
        icon: Cpu,
        iconColor: 'text-primary',
        badge: 'Architecture',
        badgeIntent: 'primary',
      },
      {
        id: 'components-hub',
        name: 'Components Hub',
        href: '/components',
        type: 'category',
        categoryName: 'General',
        description: 'Directory of all production UI primitives, enterprise charts, maps, and rich media.',
        icon: Box,
        iconColor: 'text-primary',
        badge: 'Directory',
        badgeIntent: 'primary',
      },
      {
        id: 'registrar',
        name: 'Interface Registrar & CLI Catalog',
        href: '/registrar',
        type: 'overview',
        categoryName: 'General',
        description: 'AST schema catalog, prop/slot inspector, and interactive in-browser CLI terminal.',
        icon: Terminal,
        iconColor: 'text-primary',
        badge: 'CLI Tool',
        badgeIntent: 'primary',
      },
    ]

    // Providers
    getAllProviders().forEach((p) => {
      items.push({
        id: `provider-${p.name}`,
        name: p.name,
        href: `/architecture/providers/${p.name}`,
        type: 'provider',
        categoryName: 'Providers',
        description: p.description,
        icon: Layers,
        iconColor: 'text-purple-500',
        badge: `${p.type} provider`,
        badgeIntent: 'primary',
      })
    })

    // Engines
    getAllEngines().forEach((e) => {
      items.push({
        id: `engine-${e.name}`,
        name: e.name,
        href: `/architecture/engines/${e.name}`,
        type: 'engine',
        categoryName: 'State Engines',
        description: e.description,
        icon: Sliders,
        iconColor: 'text-amber-500',
        badge: 'State Engine',
        badgeIntent: 'outline',
      })
    })

    // Hooks
    getAllHooks().forEach((h) => {
      items.push({
        id: `hook-${h.name}`,
        name: h.name,
        href: `/architecture/hooks/${h.name}`,
        type: 'hook',
        categoryName: 'Headless Hooks',
        description: h.description,
        icon: Sparkles,
        iconColor: 'text-blue-500',
        badge: `${h.type} hook`,
        badgeIntent: 'accent',
      })
    })

    // Plugins
    getAllPlugins().forEach((pl) => {
      items.push({
        id: `plugin-${pl.name}`,
        name: pl.name,
        href: `/architecture/plugins/${pl.name}`,
        type: 'plugin',
        categoryName: 'Plugins',
        description: pl.description,
        icon: Cpu,
        iconColor: 'text-emerald-500',
        badge: 'Plugin',
        badgeIntent: 'primary',
      })
    })

    // Component Categories & Individual Components
    Object.entries(COMPONENT_CATEGORIES_CONFIG).forEach(([catKey, cat]) => {
      // Category item
      items.push({
        id: `cat-${catKey}`,
        name: `${cat.title} Hub`,
        href: `/components/category/${catKey}`,
        type: 'category',
        categoryName: 'Component Categories',
        description: cat.description,
        icon: cat.icon,
        iconColor: cat.color,
        badge: `${cat.items.length} components`,
        badgeIntent: 'secondary',
      })

      // Child Component items
      cat.items.forEach((id) => {
        const doc = docsRegistry[id]
        if (doc) {
          items.push({
            id,
            name: doc.name,
            href: `/components/${id}`,
            type: 'component',
            categoryName: cat.title,
            description: doc.summary,
            icon: cat.icon,
            iconColor: cat.color,
            badge: doc.badge || 'Component',
            badgeIntent: 'secondary',
          })
        }
      })
    })

    return items
  }, [])

  // Dynamic Category Filters
  const categoryFilters = useMemo(() => {
    const categories = new Set<string>()
    masterItems.forEach((item) => categories.add(item.categoryName))
    return ['All', ...Array.from(categories)]
  }, [masterItems])

  const q = query.trim().toLowerCase()

  const filteredItems = useMemo(() => {
    return masterItems.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All' || item.categoryName === selectedCategory

      if (!matchesCategory) return false
      if (!q) return true

      return (
        item.name.toLowerCase().includes(q) ||
        item.categoryName.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      )
    })
  }, [masterItems, selectedCategory, q])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedCategory('All')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const handleSelect = (item: SearchItem) => {
    if (onSelect) {
      onSelect(item.href)
    } else if (onSelectComponent) {
      onSelectComponent(item.href)
    }
    onClose?.()
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onClose?.()
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        onClose?.()
      }
      if (e.key === 'ArrowDown' && isOpen && filteredItems.length > 0) {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length)
      }
      if (e.key === 'ArrowUp' && isOpen && filteredItems.length > 0) {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length)
      }
      if (e.key === 'Enter' && isOpen && filteredItems.length > 0) {
        e.preventDefault()
        const selected = filteredItems[selectedIndex]
        if (selected) {
          handleSelect(selected)
        }
      }
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, filteredItems, selectedIndex])

  // Keep selected index in bounds
  useEffect(() => {
    if (selectedIndex >= filteredItems.length && filteredItems.length > 0) {
      setSelectedIndex(0)
    }
  }, [filteredItems.length, selectedIndex])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 pt-12 sm:pt-20 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-2xl rounded-macro border border-border/80 bg-overlay/95 backdrop-blur-xl text-fg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[75vh] z-10 animate-in zoom-in-95 duration-150 select-none">
        {/* Search Header */}
        <div className="flex items-center px-3.5 sm:px-4 py-3 sm:py-3.5 border-b border-border/70 gap-2.5 sm:gap-3 shrink-0 bg-bg/50">
          <Search className="size-4.5 text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            placeholder="Search components, providers, engines, hooks... (⌘K)"
            className="w-full bg-transparent text-sm sm:text-base text-fg placeholder:text-muted-fg focus:outline-none min-w-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              className="p-1 text-muted-fg hover:text-fg rounded-micro transition-colors cursor-pointer"
              title="Clear query"
            >
              <X className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted-fg hover:text-fg hover:bg-muted/60 rounded-base transition-colors cursor-pointer shrink-0"
            aria-label="Close search"
          >
            <Kbd className="hidden sm:inline-block">ESC</Kbd>
            <X className="size-4 sm:hidden" />
          </button>
        </div>

        {/* Dynamic Category Pill Strip */}
        <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2 border-b border-border/60 bg-muted/20 overflow-x-auto no-scrollbar shrink-0">
          {categoryFilters.map((cat) => {
            const isSelected = selectedCategory === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat)
                  setSelectedIndex(0)
                }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-primary-fg shadow-xs font-semibold'
                    : 'bg-secondary/70 text-muted-fg hover:text-fg hover:bg-secondary'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {/* Results List */}
        <div
          ref={resultsContainerRef}
          className="flex-1 min-h-0 overflow-y-auto p-2 divide-y divide-border/30 space-y-1"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2">
              <Search className="size-8 mx-auto text-muted-fg/40 stroke-1" />
              <p className="text-sm font-medium text-fg">No matching items</p>
              <p className="text-xs text-muted-fg max-w-xs mx-auto">
                No results for "{query}" in {selectedCategory === 'All' ? 'the library' : selectedCategory}.
              </p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex
              const ItemIcon = item.icon || Box

              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-3 py-2.5 sm:py-3 rounded-base transition-all flex items-center justify-between group cursor-pointer ${
                    isSelected
                      ? 'bg-primary/10 text-primary ring-1 ring-primary/40'
                      : 'hover:bg-muted/40 text-fg'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <ItemIcon className={`size-4 shrink-0 ${item.iconColor || 'text-primary'}`} />
                      <span className="text-sm font-semibold truncate font-mono">
                        {item.name}
                      </span>
                      <Badge
                        intent={item.badgeIntent || 'secondary'}
                        size="sm"
                        className="font-mono text-[10px] uppercase"
                      >
                        {item.badge || item.categoryName}
                      </Badge>
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-fg line-clamp-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <CornerDownLeft className="size-3.5 text-primary shrink-0 hidden sm:block" />
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="px-3.5 sm:px-4 py-2 border-t border-border/70 bg-muted/30 text-[11px] text-muted-fg flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> to navigate
            </span>
            <span className="flex items-center gap-1">
              <Kbd>↵</Kbd> to select
            </span>
          </div>
          <span className="font-mono">{filteredItems.length} results</span>
        </div>
      </div>
    </div>,
    document.body
  )
}
