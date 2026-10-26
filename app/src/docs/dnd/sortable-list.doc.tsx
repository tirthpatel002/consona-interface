import React, { useState } from 'react'
import {
  SortableList,
  Badge,
  Button,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

interface TaskItem {
  id: string
  label: string
  priority: 'high' | 'medium' | 'low'
  tag: string
  rank?: string
}

const INITIAL_ITEMS: TaskItem[] = [
  { id: '1', label: 'Implement AST Registry Builder', priority: 'high', tag: 'Core', rank: '10' },
  { id: '2', label: 'Design Optical Scale Geometry Tokens', priority: 'high', tag: 'Theme', rank: '20' },
  { id: '3', label: 'Optimize Zero-Reflow Collision Hit-Testing', priority: 'medium', tag: 'Engine', rank: '30' },
  { id: '4', label: 'Add WeakRef Memory Management', priority: 'medium', tag: 'Memory', rank: '40' },
  { id: '5', label: 'Draft Documentation Playgrounds', priority: 'low', tag: 'Docs', rank: '50' },
]

const LIST_STORAGE_KEY = 'consona:sortable-list:playground-v1'

function SortableListPlayground({ orientation: propOrientation }: { orientation?: 'vertical' | 'horizontal' } = {}) {
  const [items, setItems] = useState<TaskItem[]>(() => {
    if (typeof window === 'undefined') return INITIAL_ITEMS
    try {
      const stored = window.localStorage.getItem(LIST_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch {
      // Ignore fallback
    }
    return INITIAL_ITEMS
  })

  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>(propOrientation ?? 'vertical')
  React.useEffect(() => {
    if (propOrientation) setOrientation(propOrientation)
  }, [propOrientation])

  const handleReorder = (newItems: TaskItem[]) => {
    setItems(newItems)
    try {
      window.localStorage.setItem(LIST_STORAGE_KEY, JSON.stringify(newItems))
    } catch {
      // Ignore
    }
  }

  const handleReset = () => {
    try {
      window.localStorage.removeItem(LIST_STORAGE_KEY)
    } catch {
      // Ignore
    }
    setItems(INITIAL_ITEMS)
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-xl p-3 sm:p-4 bg-bg-surface rounded-macro border border-border/60 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm text-fg">Engineering Sprint Backlog</h4>
            <Badge size="sm" intent="primary">LexoRank O(1)</Badge>
            <Badge size="sm" intent="secondary" className="text-[10px]">Persisted</Badge>
          </div>
          <p className="text-xs text-fg-muted mt-0.5">
            Drag items to reorder them with fluid animations, persisted in localStorage
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            intent={orientation === 'vertical' ? 'primary' : 'outline'}
            onPress={() => setOrientation('vertical')}
          >
            Vertical
          </Button>
          <Button
            size="sm"
            intent={orientation === 'horizontal' ? 'primary' : 'outline'}
            onPress={() => setOrientation('horizontal')}
          >
            Horizontal
          </Button>
        </div>
      </div>

      <div className={orientation === 'horizontal' ? 'overflow-x-auto pb-3 pt-1 w-full max-w-full' : 'w-full'}>
        <SortableList
          orientation={orientation}
          items={items}
          onReorder={(newItems) => handleReorder(newItems as TaskItem[])}
          className={orientation === 'horizontal' ? 'min-h-[140px]' : 'min-h-[220px]'}
          renderOverlay={(activeItem) => {
            const item = activeItem?.data as TaskItem | undefined
            if (!item) return null
            const activeIndex = items.findIndex((t) => t.id === item.id)
            const itemWidthClasses =
              orientation === 'horizontal'
                ? 'w-64 sm:w-72 max-w-xs shrink-0 min-w-0'
                : 'w-full min-w-0'
            return (
              <div className={`flex flex-col gap-1.5 p-space-sm rounded-base bg-bg-surface opacity-100 border border-border-strong shadow-strong ${itemWidthClasses}`}>
                <div className="flex items-center justify-between gap-1 w-full pb-1 border-b border-border/40 text-[10px] font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                    idx: #{activeIndex !== -1 ? activeIndex : 0}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-bg-muted text-fg-muted font-medium">
                    id: {item.id}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                    rank: {item.rank ?? '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-sm font-semibold text-fg truncate">
                    {item.label}
                  </span>
                  <Badge
                    size="sm"
                    className="shrink-0"
                    intent={
                      item.priority === 'high'
                        ? 'danger'
                        : item.priority === 'medium'
                          ? 'warning'
                          : 'secondary'
                    }
                  >
                    {item.priority}
                  </Badge>
                </div>
              </div>
            )
          }}
        >
          {items.map((item: TaskItem, index: number) => {
            const itemWidthClasses =
              orientation === 'horizontal'
                ? 'w-64 sm:w-72 max-w-xs shrink-0 min-w-0'
                : 'w-full min-w-0'

            return (
              <SortableList.Item
                key={item.id}
                id={item.id}
                index={index}
                orientation={orientation}
                data={item}
                className={`bg-bg-surface border-border/80 shadow-xs hover:border-border-strong box-border ${itemWidthClasses}`}
              >
                <div className="flex flex-col gap-1.5 w-full min-w-0">
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
                  <div className="flex items-center justify-between gap-2 w-full min-w-0">
                    <span className="text-sm font-medium text-fg truncate">
                      {item.label}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge
                        size="sm"
                        intent={
                          item.priority === 'high'
                            ? 'danger'
                            : item.priority === 'medium'
                              ? 'warning'
                              : 'secondary'
                        }
                      >
                        {item.priority}
                      </Badge>
                      <span className="text-xs text-fg-muted font-mono bg-bg-muted px-1.5 py-0.5 rounded-micro">
                        {item.tag}
                      </span>
                    </div>
                  </div>
                </div>
              </SortableList.Item>
            )
          })}
        </SortableList>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs text-fg-muted">
        <span>{items.length} tasks in list</span>
        <Button
          size="sm"
          intent="plain"
          onPress={handleReset}
        >
          Reset Order
        </Button>
      </div>
    </div>
  )
}

function CustomOverlayListDemo() {
  const INITIAL_CUSTOM_TASKS = [
    { id: 'c1', label: '🚀 Deploy v2.4 Release Candidate', tag: 'Release', rank: '10' },
    { id: 'c2', label: '🛡️ Enforce SAIF Security Guardrails', tag: 'Security', rank: '20' },
    { id: 'c3', label: '⚡ Benchmark Zero-Reflow Drag Latency', tag: 'Perf', rank: '30' },
  ]
  const [tasks, setTasks] = useState(INITIAL_CUSTOM_TASKS)

  return (
    <div className="w-full max-w-md p-3 sm:p-4 bg-bg-surface rounded-macro border border-border/60 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-border/40">
        <div className="min-w-0 flex-1">
          <h5 className="text-xs font-semibold uppercase text-fg-muted tracking-wider">
            Custom Portal Overlay Demo
          </h5>
          <p className="text-xs text-fg-muted mt-0.5">Floating preview with renderOverlay prop</p>
        </div>
        <Button
          size="sm"
          intent="plain"
          onPress={() => setTasks(INITIAL_CUSTOM_TASKS)}
        >
          Reset
        </Button>
      </div>
      <SortableList
        items={tasks}
        onReorder={(newItems) => setTasks(newItems as any)}
        renderOverlay={(activeItem) => {
          const activeIndex = tasks.findIndex((t) => t.id === activeItem?.data?.id)
          return (
            <div className="p-space-sm bg-bg-surface border border-border-strong rounded-base shadow-strong flex flex-col gap-1.5 w-full box-border">
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
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm text-fg truncate">
                  {activeItem?.data?.label}
                </span>
                <Badge size="sm" intent="primary">
                  {activeItem?.data?.tag ?? 'Moving'}
                </Badge>
              </div>
            </div>
          )
        }}
      >
        {tasks.map((task, index) => (
          <SortableList.Item
            key={task.id}
            id={task.id}
            index={index}
            data={task}
            className="bg-bg-surface border-border/80 shadow-xs"
          >
            <div className="flex flex-col gap-1.5 w-full">
              <div className="flex items-center justify-between gap-1 w-full pb-1 border-b border-border/40 text-[10px] font-mono">
                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                  idx: #{index}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-bg-muted text-fg-muted font-medium">
                  id: {task.id}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                  rank: {task.rank ?? '—'}
                </span>
              </div>
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-medium text-fg">{task.label}</span>
                <span className="text-xs font-mono text-fg-muted bg-bg-muted px-1.5 py-0.5 rounded-micro">
                  {task.tag}
                </span>
              </div>
            </div>
          </SortableList.Item>
        ))}
      </SortableList>
    </div>
  )
}

function InfiniteScrollSortableListDemo() {
  const [items, setItems] = useState(() => {
    return Array.from({ length: 80 }, (_, i) => ({
      id: `task-${i + 1}`,
      label: `Pipeline Job #${i + 1}: Automated Test Suite & Code Quality Scan`,
      rank: `r${String(i).padStart(3, '0')}`,
    }))
  })
  const [log, setLog] = useState<string | null>(null)

  return (
    <div className="w-full max-w-lg p-3 sm:p-4 bg-bg-surface rounded-macro border border-border/60 shadow-xs flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/40">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h5 className="text-xs font-semibold uppercase text-fg-muted tracking-wider">
              Sliding-Window Infinite Sortable List
            </h5>
            <Badge size="sm" intent="success">80 Items (DOM Window 20)</Badge>
          </div>
          <p className="text-xs text-fg-muted mt-0.5">
            Scroll smoothly through 80 items with memory capped to 20 DOM nodes while maintaining full drag reordering.
          </p>
        </div>
      </div>

      {log && (
        <div className="px-3 py-1.5 bg-primary/5 rounded border border-primary/20 text-xs font-mono text-primary flex items-center gap-2">
          <span>⚡</span>
          <span>{log}</span>
        </div>
      )}

      <SortableList
        items={items.map((item, index) => ({
          ...item,
          content: (
            <div className="flex flex-col gap-1.5 w-full p-2">
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
              <span className="text-sm font-medium text-fg truncate">{item.label}</span>
            </div>
          ),
        }))}
        infiniteScroll={{
          maxLoadedItems: 20,
          maxHeight: 280,
          threshold: 60,
        }}
        onReorder={(newItems) => {
          setItems(newItems as any)
          setLog(`Reordered list: ${newItems.length} items total in dataset`)
        }}
      />
    </div>
  )
}

function DataDrivenListDemo() {
  const INITIAL_DATA_TASKS = [
    { id: 't1', label: 'Verify TypeScript types (0 errors)', rank: '10' },
    { id: 't2', label: 'Audit slot injector contracts', rank: '20' },
    { id: 't3', label: 'Verify accessibility focus rings', rank: '30' },
  ]
  const [tasks, setTasks] = useState(INITIAL_DATA_TASKS)

  return (
    <div className="w-full max-w-md p-3 sm:p-4 bg-bg-surface rounded-macro border border-border/60 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-border/40">
        <div className="min-w-0 flex-1">
          <h5 className="text-xs font-semibold uppercase text-fg-muted tracking-wider">
            Data-Driven Mode (Rule C8)
          </h5>
          <p className="text-xs text-fg-muted mt-0.5">Automatic reordering from array data with rank, persistent id & index</p>
        </div>
        <Button
          size="sm"
          intent="plain"
          onPress={() => setTasks(INITIAL_DATA_TASKS)}
        >
          Reset
        </Button>
      </div>
      <SortableList
        items={tasks.map((item, index) => ({
          ...item,
          content: (
            <div className="flex flex-col gap-1.5 w-full p-2">
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
              <span className="text-sm font-medium text-fg truncate">{item.label}</span>
            </div>
          ),
        }))}
        onReorder={(newItems) => setTasks(newItems as any)}
      />
    </div>
  )
}

export const sortableListDoc: ComponentDocSpec = {
  id: 'sortable-list',
  name: 'SortableList',
  badge: 'Module / DnD',
  summary:
    'Universal sortable list family with keyboard accessibility, compound sub-components, optical geometry tokens, and automatic reordering.',
  subcomponents: ['SortableList.Item', 'SortableList.Handle', 'SortableList.Empty'],
  playground: {
    defaultProps: {
      orientation: 'vertical',
    },
    controls: [
      {
        name: 'orientation',
        label: 'Orientation',
        type: 'select',
        options: ['vertical', 'horizontal'],
        defaultValue: 'vertical',
      },
    ],
    render: (props: any) => <SortableListPlayground {...props} />,
  },
  examples: [
    {
      title: 'High-Volume Sliding-Window Sortable List (80+ Items)',
      description:
        'Handles large datasets efficiently by mounting only active viewport cards within a sliding memory window with zero lag.',
      render: () => <InfiniteScrollSortableListDemo />,
    },
    {
      title: 'Compound Item Composition',
      description:
        'Use <SortableList.Item> inside <SortableList> to fully customize item appearance, badges, and layout.',
      render: () => <SortableListPlayground />,
    },
    {
      title: 'Data-Driven Usage with Automatic Reordering',
      description:
        'Pass an items array directly to <SortableList items={...} onReorder={...} /> for zero-boilerplate lists with automatic drop handling.',
      render: () => <DataDrivenListDemo />,
    },
    {
      title: 'Custom Floating Drag Overlay (renderOverlay)',
      description:
        'Pass a renderOverlay callback to <SortableList> to fully customize the floating drag ghost preview rendered in the portal overlay.',
      render: () => <CustomOverlayListDemo />,
    },
  ],
  recipes: [
    {
      title: 'Customizing Drag Overlay Portal UI',
      description: 'Define custom floating drag overlay previews via renderOverlay prop on SortableList or per-item.',
      code: `import { SortableList, Badge } from '@consona/interface'

export function CustomOverlayList({ items, onReorder }) {
  return (
    <SortableList
      items={items}
      onReorder={onReorder}
      renderOverlay={(activeItem) => (
        <div className="p-3 bg-bg-surface border-2 border-primary rounded-macro shadow-strong flex items-center gap-2">
          <span className="font-semibold text-sm">{activeItem?.data?.label}</span>
          <Badge size="sm" intent="primary">Moving</Badge>
        </div>
      )}
    >
      {items.map((item, index) => (
        <SortableList.Item key={item.id} id={item.id} index={index} data={item}>
          {item.label}
        </SortableList.Item>
      ))}
    </SortableList>
  )
}`,
    },
    {
      title: 'Customizing Item Slots with Branded Grip Handles',
      description: 'Inject custom grip handles or badges into SortableList.Item via typed slots.',
      code: `import { SortableList, DraggableHandle } from '@consona/interface'

export function CustomSortableList({ items, onReorder }) {
  return (
    <SortableList items={items} onReorder={onReorder}>
      {items.map((item, index) => (
        <SortableList.Item
          key={item.id}
          id={item.id}
          index={index}
          slots={{ handle: DraggableHandle }}
          slotProps={{ handle: { className: 'text-primary' } }}
        >
          {item.title}
        </SortableList.Item>
      ))}
    </SortableList>
  )
}`,
    },
  ],
  a11yNotes: [
    'SortableList.Item has role="listitem" and receives aria-grabbed and aria-dropeffect states automatically.',
    'Supports keyboard arrow navigation and drag-handle aria-label="Drag handle" affordances.',
  ],
}
