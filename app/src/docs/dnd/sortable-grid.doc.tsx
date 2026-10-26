import React, { useState } from 'react'
import {
  SortableGrid,
  Badge,
  Button,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'
import { Database, Shield, Zap, Globe, Cpu, Sparkles } from 'lucide-react'

interface GridCard {
  id: string
  title: string
  icon: any
  tag: string
  metric: string
  rank?: string
}

const INITIAL_CARDS: GridCard[] = [
  { id: 'c1', title: 'Database Pool', icon: Database, tag: 'Storage', metric: '99.98%', rank: '10' },
  { id: 'c2', title: 'Security Shield', icon: Shield, tag: 'Auth', metric: '0 Threats', rank: '20' },
  { id: 'c3', title: 'Lightning Cache', icon: Zap, tag: 'Compute', metric: '1.2ms', rank: '30' },
  { id: 'c4', title: 'Global Edge', icon: Globe, tag: 'Network', metric: '48 Regions', rank: '40' },
  { id: 'c5', title: 'Neural Engine', icon: Cpu, tag: 'AI/ML', metric: '84 TFLOPS', rank: '50' },
  { id: 'c6', title: 'Quantum Matrix', icon: Sparkles, tag: 'Core', metric: 'Active', rank: '60' },
]

const GRID_STORAGE_KEY = 'consona:sortable-grid:playground-v1'

function SortableGridPlayground({
  columns: propColumns,
  gap: propGap,
}: {
  columns?: number | string
  gap?: 'xs' | 'sm' | 'md' | 'lg'
} = {}) {
  const [cards, setCards] = useState<GridCard[]>(() => {
    if (typeof window === 'undefined') return INITIAL_CARDS
    try {
      const stored = window.localStorage.getItem(GRID_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((card, idx) => ({
            ...card,
            icon: INITIAL_CARDS.find((c) => c.id === card.id)?.icon ?? INITIAL_CARDS[idx % INITIAL_CARDS.length].icon,
          }))
        }
      }
    } catch {
      // Ignore
    }
    return INITIAL_CARDS
  })

  const [columns, setColumns] = useState<number>(propColumns ? Number(propColumns) : 3)
  React.useEffect(() => {
    if (propColumns != null) setColumns(Number(propColumns))
  }, [propColumns])

  const handleReorder = (newCards: GridCard[]) => {
    setCards(newCards)
    try {
      // Save serializable fields
      const toSave = newCards.map(({ icon, ...rest }) => rest)
      window.localStorage.setItem(GRID_STORAGE_KEY, JSON.stringify(toSave))
    } catch {
      // Ignore
    }
  }

  const handleReset = () => {
    try {
      window.localStorage.removeItem(GRID_STORAGE_KEY)
    } catch {
      // Ignore
    }
    setCards(INITIAL_CARDS)
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl p-3 sm:p-4 bg-bg-surface rounded-macro border border-border/60 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm text-fg">Dashboard Widget Grid</h4>
            <Badge size="sm" intent="primary">LexoRank O(1)</Badge>
            <Badge size="sm" intent="secondary" className="text-[10px]">Persisted</Badge>
          </div>
          <p className="text-xs text-fg-muted mt-0.5">
            Widgets dynamically rearrange across 2D grid cells as you drag, persisted in localStorage
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <span className="text-xs text-fg-muted mr-1">Cols:</span>
            {[2, 3, 4].map((num) => (
              <Button
                key={num}
                size="sm"
                intent={columns === num ? 'primary' : 'outline'}
                onPress={() => setColumns(num)}
              >
                {num}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <SortableGrid
        columns={columns}
        gap={propGap ?? 'md'}
        items={cards}
        onReorder={(newItems) => handleReorder(newItems as GridCard[])}
        className="w-full"
        renderOverlay={(activeItem) => {
          const card = activeItem?.data as GridCard | undefined
          if (!card) return null
          const activeIndex = cards.findIndex((c) => c.id === card.id)
          const Icon = card.icon
          return (
            <div className="flex flex-col items-center text-center gap-2 p-space-md rounded-macro bg-bg-surface opacity-100 border border-border-strong shadow-strong w-full box-border">
              <div className="flex items-center justify-between gap-1 w-full pb-1.5 border-b border-border/40 text-[10px] font-mono">
                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                  idx: #{activeIndex !== -1 ? activeIndex : 0}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-bg-muted text-fg-muted font-medium">
                  id: {card.id}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                  rank: {card.rank ?? '—'}
                </span>
              </div>
              {Icon && (
                <div className="p-2.5 rounded-full bg-primary-subtle text-primary flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
              )}
              <div className="font-semibold text-sm text-fg truncate w-full">{card.title}</div>
              <div className="flex items-center justify-center gap-1.5 w-full">
                <Badge size="sm" intent="primary">
                  {card.tag}
                </Badge>
                <span className="text-xs font-mono font-semibold text-primary">{card.metric}</span>
              </div>
            </div>
          )
        }}
      >
        {cards.map((card: GridCard, index: number) => {
          const Icon = card.icon
          return (
            <SortableGrid.Item
              key={card.id}
              id={card.id}
              index={index}
              data={card}
              className="bg-bg-surface border border-border/80 shadow-xs hover:border-border-strong transition-colors transition-shadow duration-150 w-full min-w-0 box-border"
            >
              <div className="flex flex-col items-center text-center gap-2 w-full min-w-0">
                <div className="flex items-center justify-between gap-1 w-full pb-1.5 border-b border-border/40 text-[10px] font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                    idx: #{index}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-bg-muted text-fg-muted font-medium">
                    id: {card.id}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                    rank: {card.rank ?? '—'}
                  </span>
                </div>
                {Icon && (
                  <div className="p-2.5 rounded-full bg-primary-subtle text-primary flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                )}
                <div className="font-medium text-sm text-fg truncate w-full">{card.title}</div>
                <div className="flex items-center justify-center flex-wrap gap-1.5 w-full">
                  <Badge size="sm" intent="secondary">
                    {card.tag}
                  </Badge>
                  <span className="text-xs font-mono font-semibold text-fg-muted">{card.metric}</span>
                </div>
              </div>
            </SortableGrid.Item>
          )
        })}
      </SortableGrid>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs text-fg-muted">
        <span>{cards.length} widgets displayed</span>
        <Button
          size="sm"
          intent="plain"
          onPress={handleReset}
        >
          Reset Grid
        </Button>
      </div>
    </div>
  )
}

function CustomOverlayGridDemo() {
  const INITIAL_WIDGETS = [
    { id: 'w1', name: 'Analytics Stream', status: 'Live', speed: '4.2k req/s', rank: '10' },
    { id: 'w2', name: 'Vector Database', status: 'Optimal', speed: '99.9%', rank: '20' },
    { id: 'w3', name: 'Inference Engine', status: 'Warm', speed: '12ms', rank: '30' },
    { id: 'w4', name: 'Cache Layer', status: 'Hit 94%', speed: '0.8ms', rank: '40' },
  ]
  const [widgets, setWidgets] = useState(INITIAL_WIDGETS)

  return (
    <div className="w-full max-w-lg p-3 sm:p-4 bg-bg-surface rounded-macro border border-border/60 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-border/40">
        <div className="min-w-0 flex-1">
          <h5 className="text-xs font-semibold uppercase text-fg-muted tracking-wider">
            Custom Grid Portal Overlay (renderOverlay)
          </h5>
          <p className="text-xs text-fg-muted mt-0.5">Custom drag previews in 2D grids</p>
        </div>
        <Button
          size="sm"
          intent="plain"
          onPress={() => setWidgets(INITIAL_WIDGETS)}
        >
          Reset
        </Button>
      </div>
      <SortableGrid
        columns={2}
        gap="sm"
        items={widgets}
        onReorder={(newItems) => setWidgets(newItems as any)}
        renderOverlay={(activeItem) => {
          const activeIndex = widgets.findIndex((w) => w.id === activeItem?.data?.id)
          return (
            <div className="p-3 bg-bg-surface border border-border-strong rounded-macro shadow-strong flex flex-col items-center gap-1.5 w-full box-border text-center">
              <div className="flex items-center justify-between gap-1 w-full pb-1 border-b border-border/40 text-[10px] font-mono">
                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                  idx: #{activeIndex !== -1 ? activeIndex : 0}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-bg-muted text-fg-muted font-medium">
                  id: {activeItem?.data?.id}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                  rank: {activeItem?.data?.rank ?? '—'}
                </span>
              </div>
              <span className="font-bold text-sm text-fg">{activeItem?.data?.name}</span>
              <div className="flex items-center gap-1.5">
                <Badge size="sm" intent="primary">{activeItem?.data?.status}</Badge>
                <span className="text-xs font-mono text-primary font-semibold">{activeItem?.data?.speed}</span>
              </div>
            </div>
          )
        }}
      >
        {widgets.map((widget, idx) => (
          <SortableGrid.Item
            key={widget.id}
            id={widget.id}
            index={idx}
            data={widget}
            className="p-3 bg-bg-surface border border-border/80 shadow-xs rounded-macro text-center"
          >
            <div className="flex items-center justify-between gap-1 w-full pb-1 mb-1 border-b border-border/40 text-[10px] font-mono">
              <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                idx: #{idx}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-bg-muted text-fg-muted font-medium">
                id: {widget.id}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                rank: {widget.rank ?? '—'}
              </span>
            </div>
            <div className="font-medium text-sm text-fg">{widget.name}</div>
            <div className="text-xs text-fg-muted font-mono mt-1">{widget.speed}</div>
          </SortableGrid.Item>
        ))}
      </SortableGrid>
    </div>
  )
}

function InfiniteScrollGridDemo() {
  const [items, setItems] = useState(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: `grid-widget-${i + 1}`,
      rank: `r${String(i).padStart(3, '0')}`,
      metric: `${(20 + (i * 7) % 75)}%`,
    }))
  })

  return (
    <div className="w-full max-w-xl p-3 sm:p-4 bg-bg-surface rounded-macro border border-border/60 shadow-xs flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/40">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h5 className="text-xs font-semibold uppercase text-fg-muted tracking-wider">
              Sliding-Window 2D Infinite Sortable Grid
            </h5>
            <Badge size="sm" intent="success">60 Grid Tiles (Window 18)</Badge>
          </div>
          <p className="text-xs text-fg-muted mt-0.5">
            Scroll smoothly across 60 grid items with memory capped to 18 DOM tiles while maintaining 2D drag rearrangement.
          </p>
        </div>
      </div>

      <SortableGrid
        columns={3}
        gap="sm"
        items={items.map((item, index) => ({
          ...item,
          content: (
            <div className="flex flex-col items-center justify-center p-2.5 text-center gap-1.5 w-full">
              <div className="flex items-center justify-between gap-1 w-full pb-1 border-b border-border/40 text-[10px] font-mono">
                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                  idx: #{index}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-bg-muted text-fg-muted font-medium">
                  id: {item.id}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                  rank: {item.rank}
                </span>
              </div>
              <span className="font-semibold text-xs text-fg">Widget Item</span>
              <span className="text-[10px] font-mono text-primary font-bold">Load: {item.metric}</span>
            </div>
          ),
        }))}
        infiniteScroll={{
          maxLoadedItems: 18,
          maxHeight: 320,
          threshold: 60,
        }}
        onReorder={(newItems) => setItems(newItems as any)}
      />
    </div>
  )
}

function DataDrivenGridDemo() {
  const INITIAL_GRID_ITEMS = [
    { id: 'g1', label: 'Widget A', rank: '10' },
    { id: 'g2', label: 'Widget B', rank: '20' },
    { id: 'g3', label: 'Widget C', rank: '30' },
    { id: 'g4', label: 'Widget D', rank: '40' },
    { id: 'g5', label: 'Widget E', rank: '50' },
    { id: 'g6', label: 'Widget F', rank: '60' },
  ]
  const [items, setItems] = useState(INITIAL_GRID_ITEMS)

  return (
    <div className="w-full max-w-lg p-3 sm:p-4 bg-bg-surface rounded-macro border border-border/60 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-border/40">
        <div className="min-w-0 flex-1">
          <h5 className="text-xs font-semibold uppercase text-fg-muted tracking-wider">
            Data-Driven Grid Generation
          </h5>
          <p className="text-xs text-fg-muted mt-0.5">Automatic 2D grid generation from items array with rank, persistent id & index</p>
        </div>
        <Button
          size="sm"
          intent="plain"
          onPress={() => setItems(INITIAL_GRID_ITEMS)}
        >
          Reset
        </Button>
      </div>
      <SortableGrid
        columns={3}
        items={items.map((item, index) => ({
          ...item,
          content: (
            <div className="flex flex-col items-center justify-center p-3 text-center gap-1.5 w-full">
              <div className="flex items-center justify-between gap-1 w-full pb-1 border-b border-border/40 text-[10px] font-mono">
                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                  idx: #{index}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-bg-muted text-fg-muted font-medium">
                  id: {item.id}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                  rank: {item.rank ?? '—'}
                </span>
              </div>
              <div className="font-medium text-sm text-fg">{item.label}</div>
            </div>
          ),
        }))}
        onReorder={(newItems) => setItems(newItems as any)}
      />
    </div>
  )
}


export const sortableGridDoc: ComponentDocSpec = {
  id: 'sortable-grid',
  name: 'SortableGrid',
  badge: 'Module / DnD',
  summary:
    'Responsive 2D sortable grid container supporting drag rearrangement, auto-flow layouts, and optical geometry.',
  subcomponents: ['SortableGrid.Item', 'SortableGrid.Empty'],
  playground: {
    defaultProps: {
      columns: 3,
      gap: 'md',
    },
    controls: [
      {
        name: 'columns',
        label: 'Grid Columns',
        type: 'select',
        options: ['1', '2', '3', '4', '6'],
        defaultValue: '3',
      },
      {
        name: 'gap',
        label: 'Spacing Gap',
        type: 'select',
        options: ['xs', 'sm', 'md', 'lg'],
        defaultValue: 'md',
      },
    ],
    render: (props: any) => <SortableGridPlayground {...props} />,
  },
  examples: [
    {
      title: 'High-Volume Sliding-Window Sortable Grid (60+ Tiles)',
      description:
        'Smooth 2D drag rearrangement with memory capped to 18 DOM tiles across large grid collections.',
      render: () => <InfiniteScrollGridDemo />,
    },
    {
      title: 'Compound Grid Item Composition',
      description:
        'Compose custom widgets and metric badges within <SortableGrid.Item> inside <SortableGrid>.',
      render: () => <SortableGridPlayground />,
    },
    {
      title: 'Data-Driven Grid Generation with Automatic Reordering',
      description: 'Render responsive cards directly from an array of items with automatic drop handling.',
      render: () => <DataDrivenGridDemo />,
    },
    {
      title: 'Custom Floating Grid Overlay (renderOverlay)',
      description:
        'Provide a custom renderOverlay function to design bespoke floating portal previews for 2D grid items.',
      render: () => <CustomOverlayGridDemo />,
    },
  ],
  recipes: [
    {
      title: 'Customizing Drag Overlay Portal UI',
      description: 'Render custom card preview in the drag overlay portal via renderOverlay prop.',
      code: `import { SortableGrid } from '@consona/interface'

export function CustomGridOverlay({ items, onReorder }) {
  return (
    <SortableGrid
      columns={3}
      gap="md"
      items={items}
      onReorder={onReorder}
      renderOverlay={(activeItem) => (
        <div className="p-4 bg-bg-surface border-2 border-primary rounded-macro shadow-strong flex flex-col items-center">
          <span className="font-bold text-sm text-fg">{activeItem?.data?.title}</span>
          <span className="text-xs text-primary font-mono">{activeItem?.data?.metric}</span>
        </div>
      )}
    >
      {items.map((card, idx) => (
        <SortableGrid.Item key={card.id} id={card.id} index={idx} data={card}>
          <div>{card.title}</div>
        </SortableGrid.Item>
      ))}
    </SortableGrid>
  )
}`,
    },
    {
      title: 'Customizing Grid Cell Proportions and Slots',
      description: 'Compose sub-atoms within SortableGrid.Item for custom layout cells.',
      code: `import { SortableGrid } from '@consona/interface'

export function MetricGrid({ items, onReorder }) {
  return (
    <SortableGrid columns={3} gap="md" items={items} onReorder={onReorder}>
      {items.map((item, idx) => (
        <SortableGrid.Item key={item.id} id={item.id} index={idx}>
          <div className="font-bold text-lg">{item.metric}</div>
          <div className="text-xs text-fg-muted">{item.label}</div>
        </SortableGrid.Item>
      ))}
    </SortableGrid>
  )
}`,
    },
  ],
  a11yNotes: [
    'SortableGrid items support keyboard focus rings, role attributes, and screen-reader position cues.',
  ],
}
