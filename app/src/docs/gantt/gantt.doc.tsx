import React, { useCallback, useMemo, useState } from 'react'
import {
  Gantt,
  filterGanttItems,
  type GanttDependencyChangeEvent,
  type GanttFieldAccessors,
  type GanttFilterField,
  type GanttFilterValue,
  type GanttItemChangeEvent,
  type GanttProps,
  type GanttViewRange,
} from '@consona/interface/gantt'
import { Badge, Text } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

/* ==========================================================================
   Sample domain shape (generic — not Fluenciq field names)
   ========================================================================== */

interface SampleItem {
  id: string
  title: string
  start: string
  end: string
  color?: string
  dependsOn?: string[]
}


/** createInterfaceComponent erases the item generic — restore it for demos. */
function TypedGantt<T>(props: GanttProps<T>) {
  const Comp = Gantt as React.ComponentType<GanttProps<T>>
  return <Comp {...props} />
}

function daysFromNow(offset: number, hour = 9): string {
  const d = new Date()
  d.setHours(hour, 0, 0, 0)
  d.setDate(d.getDate() + offset)
  return d.toISOString()
}

const SAMPLE_ITEMS: SampleItem[] = [
  {
    id: 'design',
    title: 'Design system audit',
    start: daysFromNow(-10),
    end: daysFromNow(-2),
    color: 'var(--color-primary)',
  },
  {
    id: 'api',
    title: 'API contract freeze',
    start: daysFromNow(-4),
    end: daysFromNow(3),
    color: '#0b6bcb',
    dependsOn: ['design'],
  },
  {
    id: 'frontend',
    title: 'Timeline UI build',
    start: daysFromNow(-1),
    end: daysFromNow(8),
    color: '#1f6b4a',
    dependsOn: ['api'],
  },
  {
    id: 'qa',
    title: 'QA & accessibility',
    start: daysFromNow(5),
    end: daysFromNow(12),
    color: '#c45c26',
    dependsOn: ['frontend'],
  },
  {
    id: 'launch',
    title: 'Launch checklist',
    start: daysFromNow(10),
    end: daysFromNow(16),
    color: '#7c3aed',
    dependsOn: ['qa'],
  },
]

const accessors: GanttFieldAccessors<SampleItem> = {
  getId: (item) => item.id,
  getStart: (item) => item.start,
  getEnd: (item) => item.end,
  getLabel: (item) => item.title,
  getColor: (item) => item.color,
  getDependencies: (item) => item.dependsOn,
}

/** Demo filter fields — product owns matching via filterGanttItems / custom predicates. */
const DEMO_FILTER_FIELDS: GanttFilterField<SampleItem>[] = [
  {
    key: 'hasDependencies',
    label: 'Has dependencies',
    type: 'boolean',
    getValue: (item) => (item.dependsOn?.length ?? 0) > 0,
  },
]

function applyItemChange(items: SampleItem[], event: GanttItemChangeEvent<SampleItem>): SampleItem[] {
  return items.map((item) =>
    item.id === event.id
      ? { ...item, start: event.start.toISOString(), end: event.end.toISOString() }
      : item
  )
}

function applyDependencyChange(
  items: SampleItem[],
  event: GanttDependencyChangeEvent
): SampleItem[] {
  return items.map((item) => {
    if (item.id !== event.toId) return item
    const current = new Set(item.dependsOn ?? [])
    if (event.action === 'add') current.add(event.fromId)
    else current.delete(event.fromId)
    return { ...item, dependsOn: Array.from(current) }
  })
}

function formatRange(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${s.toLocaleDateString(undefined, opts)} → ${e.toLocaleDateString(undefined, opts)}`
}

/* ==========================================================================
   Interactive demos
   ========================================================================== */

function BasicGanttPlayground({
  viewRange,
  readOnly,
  showDependencies,
  showToolbar,
}: {
  viewRange: GanttViewRange
  readOnly: boolean
  showDependencies: boolean
  showToolbar: boolean
}) {
  const [items, setItems] = useState(SAMPLE_ITEMS)
  const [searchValue, setSearchValue] = useState('')
  const [filters, setFilters] = useState<GanttFilterValue>({})
  const [lastChange, setLastChange] = useState<string | null>(null)

  const visibleItems = useMemo(
    () =>
      filterGanttItems(items, {
        searchValue,
        filters,
        accessors,
        filterFields: DEMO_FILTER_FIELDS,
      }),
    [items, searchValue, filters]
  )

  const handleItemChange = useCallback((event: GanttItemChangeEvent<SampleItem>) => {
    setItems((prev) => applyItemChange(prev, event))
    setLastChange(
      `${event.type}: ${event.id} · ${event.start.toLocaleDateString()} → ${event.end.toLocaleDateString()}`
    )
  }, [])

  const handleDependencyChange = useCallback((event: GanttDependencyChangeEvent) => {
    setItems((prev) => applyDependencyChange(prev, event))
    setLastChange(`dependency ${event.action}: ${event.fromId} → ${event.toId}`)
  }, [])

  const handleCreate = useCallback(({ start, end }: { start: Date; end: Date }) => {
    const id = `new-${Date.now()}`
    setItems((prev) => [
      ...prev,
      {
        id,
        title: 'New item',
        start: start.toISOString(),
        end: end.toISOString(),
        color: '#64748b',
      },
    ])
    setLastChange(`created ${id} · ${start.toLocaleDateString()} → ${end.toLocaleDateString()}`)
  }, [])

  return (
    <div className="flex w-full flex-col gap-3">
      <TypedGantt
        items={visibleItems}
        accessors={accessors}
        viewRange={viewRange}
        readOnly={readOnly}
        showDependencies={showDependencies}
        showToolbar={showToolbar}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filters={filters}
        onFiltersChange={setFilters}
        filterFields={DEMO_FILTER_FIELDS}
        maxHeight="22rem"
        onItemChange={readOnly ? undefined : handleItemChange}
        onDependencyChange={readOnly ? undefined : handleDependencyChange}
        onCreate={readOnly ? undefined : handleCreate}
      />
      {lastChange ? (
        <Text className="m-0 text-xs text-muted-fg font-mono">{lastChange}</Text>
      ) : (
        <Text className="m-0 text-xs text-muted-fg">
          Toolbar search filters by label · funnel toggles &quot;Has dependencies&quot; · Show
          dependencies draws SVG edges · drag bars when editable
        </Text>
      )}
    </div>
  )
}

function ViewRangeModesExample() {
  const [viewRange, setViewRange] = useState<GanttViewRange>('week')
  const [items, setItems] = useState(SAMPLE_ITEMS)
  const modes: GanttViewRange[] = ['day', 'week', 'month', 'quarter']

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-fg">Controlled viewRange:</span>
        {modes.map((mode) => (
          <button
            key={mode}
            type="button"
            className={`rounded-lg px-2.5 py-1 text-xs ring-1 ${
              viewRange === mode
                ? 'bg-overlay font-medium ring-fg/15'
                : 'text-muted-fg ring-fg/10'
            }`}
            onClick={() => setViewRange(mode)}
          >
            {mode}
          </button>
        ))}
        <Badge size="sm" intent="secondary">
          {viewRange}
        </Badge>
      </div>
      <TypedGantt
        items={items}
        accessors={accessors}
        viewRange={viewRange}
        showToolbar={false}
        showDependencies
        maxHeight="18rem"
        onItemChange={(event) => setItems((prev) => applyItemChange(prev, event))}
        onDependencyChange={(event) => setItems((prev) => applyDependencyChange(prev, event))}
      />
    </div>
  )
}

function AccessorsExample() {
  type AltItem = {
    key: string
    name: string
    from: number
    to: number
    tint: string
    blockedBy?: string[]
  }

  const [altItems, setAltItems] = useState<AltItem[]>(() => {
    const start = Date.now() - 5 * 86400000
    return [
      { key: 'a', name: 'Discovery', from: start, to: start + 4 * 86400000, tint: '#0b6bcb' },
      {
        key: 'b',
        name: 'Prototype',
        from: start + 3 * 86400000,
        to: start + 9 * 86400000,
        tint: '#1f6b4a',
        blockedBy: ['a'],
      },
      {
        key: 'c',
        name: 'Hardening',
        from: start + 8 * 86400000,
        to: start + 14 * 86400000,
        tint: '#c45c26',
        blockedBy: ['b'],
      },
    ]
  })

  const altAccessors: GanttFieldAccessors<AltItem> = useMemo(
    () => ({
      getId: (item) => item.key,
      getStart: (item) => item.from,
      getEnd: (item) => item.to,
      getLabel: (item) => item.name,
      getColor: (item) => item.tint,
      getDependencies: (item) => item.blockedBy,
    }),
    []
  )

  return (
    <div className="flex w-full flex-col gap-3">
      <Text className="m-0 text-xs text-muted-fg">
        Same chart, different domain keys (`key` / `from` / `to` / `tint` / `blockedBy`) mapped once via accessors.
      </Text>
      <TypedGantt
        items={altItems}
        accessors={altAccessors}
        viewRange="week"
        showDependencies
        maxHeight="14rem"
        onItemChange={(event) => {
          setAltItems((prev) =>
            prev.map((item) =>
              item.key === event.id
                ? { ...item, from: event.start.getTime(), to: event.end.getTime() }
                : item
            )
          )
        }}
        onDependencyChange={(event) => {
          setAltItems((prev) =>
            prev.map((item) => {
              if (item.key !== event.toId) return item
              const current = new Set(item.blockedBy ?? [])
              if (event.action === 'add') current.add(event.fromId)
              else current.delete(event.fromId)
              return { ...item, blockedBy: Array.from(current) }
            })
          )
        }}
      />
    </div>
  )
}

function EditableItemsExample() {
  const [items, setItems] = useState(SAMPLE_ITEMS)
  const [log, setLog] = useState<string[]>([])

  return (
    <div className="flex w-full flex-col gap-3">
      <TypedGantt
        items={items}
        accessors={accessors}
        viewRange="week"
        showDependencies
        maxHeight="20rem"
        onItemChange={(event) => {
          setItems((prev) => applyItemChange(prev, event))
          setLog((prev) =>
            [
              `${event.type} · ${event.id} · ${event.start.toLocaleDateString()} → ${event.end.toLocaleDateString()}`,
              ...prev,
            ].slice(0, 4)
          )
        }}
        onDependencyChange={(event) => {
          setItems((prev) => applyDependencyChange(prev, event))
          setLog((prev) =>
            [`dependency ${event.action} · ${event.fromId} → ${event.toId}`, ...prev].slice(0, 4)
          )
        }}
        onCreate={({ start, end }) => {
          const id = `new-${Date.now()}`
          setItems((prev) => [
            ...prev,
            {
              id,
              title: 'New item',
              start: start.toISOString(),
              end: end.toISOString(),
              color: '#64748b',
            },
          ])
          setLog((prev) =>
            [`created · ${id} · ${start.toLocaleDateString()} → ${end.toLocaleDateString()}`, ...prev].slice(0, 4)
          )
        }}
      />
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="mb-2 text-xs font-semibold text-fg">onItemChange log</div>
        {log.length === 0 ? (
          <Text className="m-0 text-xs text-muted-fg">Move or resize a bar to commit dates.</Text>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-1 p-0 font-mono text-[11px] text-muted-fg">
            {log.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-border/70 px-2.5 py-1.5 text-xs"
          >
            <span className="font-medium text-fg truncate">{item.title}</span>
            <span className="shrink-0 text-muted-fg tabular-nums">
              {formatRange(item.start, item.end)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DependenciesExample() {
  const [items, setItems] = useState(SAMPLE_ITEMS)

  return (
    <div className="flex w-full flex-col gap-3">
      <TypedGantt
        items={items}
        accessors={accessors}
        viewRange="week"
        showDependencies
        maxHeight="20rem"
        onItemChange={(event) => setItems((prev) => applyItemChange(prev, event))}
        onDependencyChange={(event) => setItems((prev) => applyDependencyChange(prev, event))}
        onCreate={({ start, end }) => {
          const id = `new-${Date.now()}`
          setItems((prev) => [
            ...prev,
            {
              id,
              title: 'New item',
              start: start.toISOString(),
              end: end.toISOString(),
              color: '#64748b',
            },
          ])
        }}
      />
      <Text className="m-0 text-xs text-muted-fg">
        `showDependencies` mounts the SVG edges. Wire `onDependencyChange` (and leave
        `readOnly` off) for hover connection dots / add-remove.
      </Text>
    </div>
  )
}

function CompoundSlotsExample() {
  const [items, setItems] = useState(SAMPLE_ITEMS)

  return (
    <div className="flex w-full flex-col gap-3">
      <TypedGantt
        items={items}
        accessors={accessors}
        viewRange="month"
        showDependencies
        maxHeight="20rem"
        railWidth="14rem"
        onItemChange={(event) => setItems((prev) => applyItemChange(prev, event))}
        onDependencyChange={(event) => setItems((prev) => applyDependencyChange(prev, event))}
        slots={{
          toolbar: ({ viewRange, setViewRange }) => (
            <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-fg">Release plan</span>
                <span className="text-[11px] text-muted-fg">Custom toolbar slot</span>
              </div>
              <div className="flex items-center gap-1">
                {(['day', 'week', 'month', 'quarter'] as GanttViewRange[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`rounded-micro px-2 py-1 text-[11px] font-medium ${
                      viewRange === mode
                        ? 'bg-primary text-primary-fg'
                        : 'bg-secondary text-fg hover:bg-secondary/80'
                    }`}
                    onClick={() => setViewRange(mode)}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          ),
        }}
      />
      <Text className="m-0 text-xs text-muted-fg">
        Compound parts: `Gantt.Header`, `Gantt.Rail`, `Gantt.Row`, `Gantt.Bar`, `Gantt.Grid`,
        `Gantt.NowLine`, `Gantt.Dependencies`, `Gantt.EdgeChip`, `Gantt.CreateStrip`. Prefer `slots`
        to override defaults without rebuilding the shell.
      </Text>
    </div>
  )
}

/* ==========================================================================
   Gantt Doc Specification
   ========================================================================== */

export const ganttDoc: ComponentDocSpec = {
  id: 'gantt',
  name: 'Gantt Timeline',
  component: Gantt,
  badge: 'Gantt',
  summary:
    'Accessors-based Gantt chart with sticky rail, scrollable timeline, snap move/resize, overflow edge chips, hover datetime labels, live dependency SVG, connection dots, now line, view-range + search + filter toolbar, and optional create strip.',
  subcomponents: [
    'GanttToolbar',
    'GanttHeader',
    'GanttRail',
    'GanttRow',
    'GanttBar',
    'GanttGrid',
    'GanttNowLine',
    'GanttDependencies',
    'GanttEdgeChip',
    'GanttCreateStrip',
  ],
  playground: {
    defaultProps: {
      viewRange: 'month',
      readOnly: false,
      showDependencies: true,
      showToolbar: true,
    },
    defaultHeight: 'tall',
    defaultLayout: 'stacked',
    controls: [
      {
        name: 'viewRange',
        label: 'View range',
        type: 'select',
        options: ['day', 'week', 'month', 'quarter'],
        defaultValue: 'month',
      },
      {
        name: 'readOnly',
        label: 'Read only',
        type: 'boolean',
        defaultValue: false,
      },
      {
        name: 'showDependencies',
        label: 'Show dependencies',
        type: 'boolean',
        defaultValue: true,
      },
      {
        name: 'showToolbar',
        label: 'Show toolbar',
        type: 'boolean',
        defaultValue: true,
      },
    ],
    render: (props) => (
      <BasicGanttPlayground
        viewRange={props.viewRange}
        readOnly={props.readOnly}
        showDependencies={props.showDependencies}
        showToolbar={props.showToolbar}
      />
    ),
  },
  examples: [
    {
      id: 'basic-gantt',
      title: 'Basic Gantt',
      description:
        'Fail-closed defaults: pass items + accessors and the full anatomy renders (toolbar with search/filter, header, rail, rows, grid, now line). Wire `searchValue`/`filters` and filter items client-side (see playground). Pass `onCreate` to reveal the bottom create strip.',
      minHeight: 420,
      render: () => {
        const [items, setItems] = useState(SAMPLE_ITEMS)
        return (
          <TypedGantt
            items={items}
            accessors={accessors}
            viewRange="month"
            showDependencies
            maxHeight="20rem"
            onItemChange={(event) => setItems((prev) => applyItemChange(prev, event))}
            onDependencyChange={(event) => setItems((prev) => applyDependencyChange(prev, event))}
            onCreate={({ start, end }) => {
              const id = `new-${Date.now()}`
              setItems((prev) => [
                ...prev,
                {
                  id,
                  title: 'New item',
                  start: start.toISOString(),
                  end: end.toISOString(),
                  color: '#64748b',
                },
              ])
            }}
          />
        )
      },
      code: `import { Gantt } from '@consona/interface/gantt'

const accessors = {
  getId: (item) => item.id,
  getStart: (item) => item.start,
  getEnd: (item) => item.end,
  getLabel: (item) => item.title,
  getColor: (item) => item.color,
}

<Gantt
  items={items}
  accessors={accessors}
  viewRange="month"
  onItemChange={(event) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === event.id
          ? { ...item, start: event.start.toISOString(), end: event.end.toISOString() }
          : item
      )
    )
  }}
  onCreate={({ start, end }) => {
    // append a new domain item using the proposed range
  }}
/>`,
    },
    {
      id: 'view-range-modes',
      title: 'View range modes',
      description:
        'Switch magnification with `viewRange`: day, week, month, or quarter. Bars stay interactive (move/resize/deps) while you change modes.',
      minHeight: 380,
      render: () => <ViewRangeModesExample />,
    },
    {
      id: 'accessors',
      title: 'Generic accessors',
      description:
        'The module never reads hardcoded field names. Map any domain shape once through `GanttFieldAccessors` — still fully interactive with deps.',
      minHeight: 320,
      render: () => <AccessorsExample />,
      code: `const accessors = {
  getId: (item) => item.key,
  getStart: (item) => item.from,
  getEnd: (item) => item.to,
  getLabel: (item) => item.name,
  getColor: (item) => item.tint,
  getDependencies: (item) => item.blockedBy,
}

<Gantt
  items={items}
  accessors={accessors}
  showDependencies
  onItemChange={...}
  onDependencyChange={...}
/>`,
    },
    {
      id: 'on-item-change',
      title: 'Editable bars (onItemChange)',
      description:
        'Drag to move or resize edges. Commits snap to the active view and emit `onItemChange` with the new start/end Dates.',
      minHeight: 480,
      render: () => <EditableItemsExample />,
    },
    {
      id: 'dependencies',
      title: 'Optional dependencies',
      description:
        '`showDependencies` mounts the SVG edges. `onDependencyChange` (and not `readOnly`) enables hover connection dots for add/remove. Edges track live drag layout while moving/resizing.',
      minHeight: 400,
      render: () => <DependenciesExample />,
      code: `<Gantt
  items={items}
  accessors={{
    ...accessors,
    getDependencies: (item) => item.dependsOn,
  }}
  showDependencies
  onDependencyChange={(event) => {
    // event: { fromId, toId, action: 'add' | 'remove' }
  }}
/>`,
    },
    {
      id: 'on-create',
      title: 'Create strip (onCreate)',
      description:
        'Pass `onCreate` to reveal a sticky bottom create strip. A ghost bar follows the cursor; click commits `{ start, end }` derived from the active viewRange cell size.',
      minHeight: 420,
      render: () => {
        const [items, setItems] = useState(SAMPLE_ITEMS)
        const [last, setLast] = useState<string | null>(null)
        return (
          <div className="flex w-full flex-col gap-3">
            <TypedGantt
              items={items}
              accessors={accessors}
              viewRange="week"
              showDependencies
              maxHeight="18rem"
              onItemChange={(event) => setItems((prev) => applyItemChange(prev, event))}
              onDependencyChange={(event) => setItems((prev) => applyDependencyChange(prev, event))}
              onCreate={({ start, end }) => {
                const id = `new-${Date.now()}`
                setItems((prev) => [
                  ...prev,
                  {
                    id,
                    title: 'New item',
                    start: start.toISOString(),
                    end: end.toISOString(),
                    color: '#64748b',
                  },
                ])
                setLast(`created ${id} · ${start.toLocaleString()} → ${end.toLocaleString()}`)
              }}
            />
            <Text className="m-0 text-xs text-muted-fg font-mono">
              {last ?? 'Hover the bottom strip, then click to create.'}
            </Text>
          </div>
        )
      },
      code: `<Gantt
  items={items}
  accessors={accessors}
  onCreate={({ start, end }) => {
    // append a new domain item using the proposed range
  }}
/>`,
    },
    {
      id: 'compound-slots',
      title: 'Compound parts & slots',
      description:
        'Override anatomy via `slots` (toolbar, header, rail, grid, nowLine, dependencies, createStrip) or compose with `Gantt.*` attachments.',
      minHeight: 420,
      render: () => <CompoundSlotsExample />,
      code: `<Gantt
  items={items}
  accessors={accessors}
  slots={{
    toolbar: ({ viewRange, setViewRange }) => (
      <CustomToolbar viewRange={viewRange} onChange={setViewRange} />
    ),
  }}
/>

{/* Compound attachments also available: */}
{/* Gantt.Header · Gantt.Rail · Gantt.Row · Gantt.Bar */}
{/* Gantt.Grid · Gantt.NowLine · Gantt.Dependencies */}
{/* Gantt.EdgeChip · Gantt.CreateStrip */}`,
    },
  ],
  recipes: [
    {
      title: 'Minimal controlled timeline',
      description: 'Items stay in React state; accessors stay stable; commits flow through onItemChange.',
      code: `import { useState } from 'react'
import { Gantt, type GanttFieldAccessors } from '@consona/interface/gantt'

type Task = { id: string; title: string; start: string; end: string }

const accessors: GanttFieldAccessors<Task> = {
  getId: (t) => t.id,
  getStart: (t) => t.start,
  getEnd: (t) => t.end,
  getLabel: (t) => t.title,
}

export function ProjectTimeline({ initial }: { initial: Task[] }) {
  const [items, setItems] = useState(initial)
  return (
    <Gantt
      items={items}
      accessors={accessors}
      viewRange="week"
      onItemChange={(event) => {
        setItems((prev) =>
          prev.map((item) =>
            item.id === event.id
              ? { ...item, start: event.start.toISOString(), end: event.end.toISOString() }
              : item
          )
        )
      }}
    />
  )
}`,
    },
    {
      title: 'Read-only overview',
      description: 'Disable pointer interactions while keeping the now line and toolbar.',
      code: `<Gantt
  items={items}
  accessors={accessors}
  viewRange="quarter"
  readOnly
  showToolbar
  maxHeight="60vh"
/>`,
    },
  ],
  a11yNotes: [
    'Root publishes timeline semantics via aria props from useGantt.',
    'Prefer readOnly for purely presentational schedules so bars are not keyboard-operable as drag targets.',
    'Keep getLabel populated so rail and bar text remain meaningful for screen readers.',
  ],
}
