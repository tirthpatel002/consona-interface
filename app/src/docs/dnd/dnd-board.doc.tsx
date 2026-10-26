import React, { useState } from 'react'
import {
  DndBoard,
  useBoardState,
  Badge,
  Button,
  cn,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

interface KanbanItem {
  id: string
  title: string
  columnId: string
  priority: 'high' | 'medium' | 'low'
  assignee: string
  rank?: string
}

interface KanbanColumn {
  id: string
  title: string
  rank?: string
  maxCapacity?: number
  collapsible?: boolean
  collapsed?: boolean
  defaultCollapsed?: boolean
}

const PLAYGROUND_COLUMNS: KanbanColumn[] = [
  { id: 'todo', title: 'To Do', rank: '10' },
  { id: 'in-progress', title: 'In Progress (Max 3)', maxCapacity: 3, rank: '20' },
  { id: 'review', title: 'Review (Max 2 - Full)', maxCapacity: 2, rank: '30' },
  { id: 'done', title: 'Done', rank: '40' },
]

const PLAYGROUND_ITEMS: KanbanItem[] = [
  { id: 'pg-1', title: 'Implement BaseEngine batching pipeline', columnId: 'todo', priority: 'high', assignee: 'Alex', rank: '10' },
  { id: 'pg-2', title: 'Audit Color Contrast ratios for WCAG AA', columnId: 'todo', priority: 'low', assignee: 'Sarah', rank: '20' },
  { id: 'pg-3', title: 'Configure Zero-Reflow Spatial Snapshotting', columnId: 'todo', priority: 'high', assignee: 'David', rank: '30' },
  { id: 'pg-4', title: 'Build Declarative Navigation Routing', columnId: 'todo', priority: 'medium', assignee: 'Elena', rank: '40' },
  { id: 'pg-5', title: 'Setup Procedural Sound Synthesis Engine', columnId: 'todo', priority: 'high', assignee: 'Alex', rank: '50' },
  { id: 'pg-6', title: 'Optimize Hardware-Accelerated Transforms', columnId: 'todo', priority: 'medium', assignee: 'Sarah', rank: '60' },
  { id: 'pg-7', title: 'Design Glassmorphic Overlay Portals', columnId: 'todo', priority: 'low', assignee: 'David', rank: '70' },
  { id: 'pg-8', title: 'Add Collapsible Vertical Rail Writing-Mode', columnId: 'todo', priority: 'medium', assignee: 'Elena', rank: '80' },
  { id: 'pg-9', title: 'Build WeakRef Hit-Testing Cache', columnId: 'in-progress', priority: 'high', assignee: 'David', rank: '10' },
  { id: 'pg-10', title: 'Construct DndBoard Kanban Family', columnId: 'in-progress', priority: 'medium', assignee: 'Elena', rank: '20' },
  { id: 'pg-11', title: 'Verify AST Registry builder hooks', columnId: 'review', priority: 'medium', assignee: 'Alex', rank: '10' },
  { id: 'pg-12', title: 'Define DnD Engine Core Contracts', columnId: 'review', priority: 'high', assignee: 'Elena', rank: '20' },
  { id: 'pg-13', title: 'Release v2.4 Candidate Bundle', columnId: 'done', priority: 'low', assignee: 'David', rank: '10' },
  { id: 'pg-14', title: 'Implement Semantic Type Filters', columnId: 'done', priority: 'high', assignee: 'Sarah', rank: '20' },
  { id: 'pg-15', title: 'Tone Acoustic Feedback Presets', columnId: 'done', priority: 'medium', assignee: 'Alex', rank: '30' },
  { id: 'pg-16', title: 'Add Rejection Toast Error Alerts', columnId: 'done', priority: 'high', assignee: 'Elena', rank: '40' },
  { id: 'pg-17', title: 'Benchmark 120Hz Animation Smoothness', columnId: 'done', priority: 'low', assignee: 'David', rank: '50' },
  { id: 'pg-18', title: 'Integrate Keyboard Accessibility', columnId: 'done', priority: 'medium', assignee: 'Sarah', rank: '60' },
]

const DATA_DRIVEN_COLUMNS: KanbanColumn[] = [
  { id: 'backlog', title: 'Backlog', rank: '10' },
  { id: 'wip', title: 'In Development', rank: '20' },
  { id: 'shipped', title: 'Shipped', rank: '30' },
]

const DATA_DRIVEN_ITEMS: KanbanItem[] = [
  { id: 'dd-1', title: 'Zero-Reflow Spatial Snapshotting', columnId: 'backlog', priority: 'high', assignee: 'Alex', rank: '10' },
  { id: 'dd-2', title: 'Aria-dropeffect announcements', columnId: 'backlog', priority: 'low', assignee: 'Elena', rank: '20' },
  { id: 'dd-3', title: 'Compound Slot Attachments', columnId: 'wip', priority: 'medium', assignee: 'David', rank: '10' },
  { id: 'dd-4', title: 'Memory-safe WeakRef registry', columnId: 'shipped', priority: 'high', assignee: 'Sarah', rank: '10' },
]

const HOOK_COLUMNS: KanbanColumn[] = [
  { id: 'sprint', title: 'Sprint Queue', rank: '10' },
  { id: 'active', title: 'Active Work (Max 2)', maxCapacity: 2, rank: '20' },
  { id: 'completed', title: 'Completed', rank: '30' },
]

const HOOK_ITEMS: KanbanItem[] = [
  { id: 'hk-1', title: 'Configure Declarative Routing', columnId: 'sprint', priority: 'high', assignee: 'Sarah', rank: '10' },
  { id: 'hk-2', title: 'Setup Token Scale Geometry', columnId: 'sprint', priority: 'medium', assignee: 'Alex', rank: '20' },
  { id: 'hk-3', title: 'Audit Optical Elevation Styles', columnId: 'active', priority: 'medium', assignee: 'Elena', rank: '10' },
  { id: 'hk-4', title: 'Generate Automated Tests', columnId: 'completed', priority: 'low', assignee: 'David', rank: '10' },
]

const PLAYGROUND_STORAGE_ITEMS_KEY = 'consona:dnd-board:playground-items-v2'
const PLAYGROUND_STORAGE_COLS_KEY = 'consona:dnd-board:playground-cols-v2'

function DndBoardPlayground() {
  const [columns, setColumns] = useState<KanbanColumn[]>(() => {
    if (typeof window === 'undefined') return PLAYGROUND_COLUMNS
    try {
      const stored = window.localStorage.getItem(PLAYGROUND_STORAGE_COLS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    return PLAYGROUND_COLUMNS
  })

  const [items, setItems] = useState<KanbanItem[]>(() => {
    if (typeof window === 'undefined') return PLAYGROUND_ITEMS
    try {
      const stored = window.localStorage.getItem(PLAYGROUND_STORAGE_ITEMS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    return PLAYGROUND_ITEMS
  })

  const [lastMoveLog, setLastMoveLog] = useState<{
    activeId: string
    sourceContainerId: string
    targetContainerId: string
    rank?: string
    beforeRank?: string
    afterRank?: string
  } | null>(null)

  const handleItemsChange = (newItems: KanbanItem[]) => {
    setItems(newItems)
    try {
      window.localStorage.setItem(PLAYGROUND_STORAGE_ITEMS_KEY, JSON.stringify(newItems))
    } catch {}
  }

  const handleColumnsChange = (newCols: KanbanColumn[]) => {
    setColumns(newCols)
    try {
      window.localStorage.setItem(PLAYGROUND_STORAGE_COLS_KEY, JSON.stringify(newCols))
    } catch {}
  }

  const handleReset = () => {
    try {
      window.localStorage.removeItem(PLAYGROUND_STORAGE_ITEMS_KEY)
      window.localStorage.removeItem(PLAYGROUND_STORAGE_COLS_KEY)
    } catch {}
    setItems(PLAYGROUND_ITEMS)
    setColumns(PLAYGROUND_COLUMNS)
    setLastMoveLog(null)
  }

  return (
    <div className="flex flex-col gap-4 w-full p-3 sm:p-4 bg-bg-surface rounded-macro border border-border/60 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm text-fg">Product Engineering Board</h4>
            <Badge size="sm" intent="primary">LexoRank O(1)</Badge>
            <Badge size="sm" intent="secondary" className="text-[10px]">Flat Normalized</Badge>
          </div>
          <p className="text-xs text-fg-muted mt-0.5">
            Normalized flat dataset ({items.length} items) partitioned dynamically by columnId with single-row LexoRank mutations.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            intent="outline"
            onPress={handleReset}
          >
            Reset Board
          </Button>
        </div>
      </div>

      {lastMoveLog && (
        <div className="flex items-center gap-3 px-3 py-2 bg-primary/5 rounded-md border border-primary/20 text-xs font-mono">
          <span className="font-semibold text-primary">Live LexoRank Event:</span>
          <span className="text-fg-muted">
            item <code className="text-fg font-bold">#{lastMoveLog.activeId}</code> → {lastMoveLog.targetContainerId} | rank: <code className="text-primary font-bold">{lastMoveLog.rank}</code> (between: {lastMoveLog.beforeRank ?? 'null'} & {lastMoveLog.afterRank ?? 'null'})
          </span>
        </div>
      )}

      <DndBoard
        items={items}
        columns={columns}
        groupBy={(item) => item.columnId}
        assignColumn={(item, targetColId, newRank) => ({
          ...item,
          columnId: String(targetColId),
          rank: newRank,
        })}
        onItemsChange={handleItemsChange}
        onColumnsChange={(cols) => handleColumnsChange(cols as KanbanColumn[])}
        onMoveItem={(event) => {
          setLastMoveLog({
            activeId: String(event.activeId),
            sourceContainerId: String(event.sourceContainerId),
            targetContainerId: String(event.targetContainerId),
            rank: event.rank,
            beforeRank: event.beforeRank,
            afterRank: event.afterRank,
          })
        }}
        renderItem={(item: KanbanItem, _col, index) => (
          <div className="flex flex-col gap-1.5 min-w-0">
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
            <span className="text-sm font-medium leading-snug truncate text-fg">
              {item.title}
            </span>
            <div className="flex items-center justify-between text-xs text-fg-muted pt-0.5">
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
              <span className="font-medium text-xs truncate">{item.assignee}</span>
            </div>
          </div>
        )}
      />
    </div>
  )
}

function DataDrivenBoardDemo() {
  const [columns, setColumns] = useState<KanbanColumn[]>(DATA_DRIVEN_COLUMNS)
  const [items, setItems] = useState<KanbanItem[]>(DATA_DRIVEN_ITEMS)

  return (
    <div className="w-full p-3 sm:p-4 bg-bg-surface rounded-macro border border-border/60 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-border/40">
        <div className="min-w-0 flex-1">
          <h5 className="text-xs font-semibold uppercase text-fg-muted tracking-wider">
            Normalized Flat Architecture (Rule C8)
          </h5>
          <p className="text-xs text-fg-muted mt-0.5">Flat items & decoupled columns with automatic reconciliation</p>
        </div>
        <Button
          size="sm"
          intent="plain"
          onPress={() => {
            setItems(DATA_DRIVEN_ITEMS)
            setColumns(DATA_DRIVEN_COLUMNS)
          }}
        >
          Reset
        </Button>
      </div>
      <DndBoard
        items={items}
        columns={columns}
        groupBy={(item) => item.columnId}
        onItemsChange={(newItems) => setItems(newItems as KanbanItem[])}
        onColumnsChange={(newCols) => setColumns(newCols as KanbanColumn[])}
        renderItem={(item: KanbanItem, _col, index) => (
          <div className="flex flex-col gap-1 min-w-0">
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
            <span className="text-sm font-medium leading-snug truncate text-fg">
              {item.title}
            </span>
          </div>
        )}
      />
    </div>
  )
}

function HookDrivenBoardDemo() {
  const board = useBoardState<KanbanItem, KanbanColumn>({
    initialItems: HOOK_ITEMS,
    initialColumns: HOOK_COLUMNS,
    groupBy: (item) => item.columnId,
    assignColumn: (item, targetColId, newRank) => ({
      ...item,
      columnId: String(targetColId),
      rank: newRank,
    }),
  })

  return (
    <div className="w-full p-3 sm:p-4 bg-bg-surface rounded-macro border border-border/60 shadow-xs flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/40">
        <div className="min-w-0 flex-1">
          <h5 className="text-xs font-semibold uppercase text-fg-muted tracking-wider">
            Managed by useBoardState Hook
          </h5>
          <p className="text-xs text-fg-muted mt-0.5">Programmatic state control with normalized items and column dispatch</p>
        </div>
        <Button size="sm" intent="plain" onPress={() => board.reset(HOOK_ITEMS, HOOK_COLUMNS)}>
          Reset
        </Button>
      </div>
      <DndBoard
        items={board.items}
        columns={board.columns}
        groupBy={(item) => item.columnId}
        onItemsChange={board.onItemsChange}
        onColumnsChange={(cols) => board.onColumnsChange(cols as KanbanColumn[])}
        renderItem={(item: KanbanItem, _col, index) => (
          <div className="flex flex-col gap-1 min-w-0">
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
            <span className="font-semibold text-sm text-fg">{item.title}</span>
            <div className="flex items-center justify-between text-xs pt-0.5">
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
              <span className="text-primary font-mono text-xs">{item.assignee}</span>
            </div>
          </div>
        )}
      />
    </div>
  )
}

function CollapsibleBoardDemo() {
  const [columns, setColumns] = useState<KanbanColumn[]>([
    { id: 'backlog', title: 'Backlog Queue', collapsible: true, defaultCollapsed: true, rank: '10' },
    { id: 'in-progress', title: 'In Progress', collapsible: true, rank: '20' },
    { id: 'shipped', title: 'Done & Shipped', collapsible: true, rank: '30' },
  ])

  const [items, setItems] = useState<KanbanItem[]>([
    { id: 'cb-1', title: 'Refactor Physics Engine', columnId: 'backlog', priority: 'medium', assignee: 'Alex', rank: '10' },
    { id: 'cb-2', title: 'Spatial Grid Indexing', columnId: 'backlog', priority: 'low', assignee: 'Elena', rank: '20' },
    { id: 'cb-3', title: 'Collapsible Board Rails', columnId: 'in-progress', priority: 'high', assignee: 'Sarah', rank: '10' },
    { id: 'cb-4', title: 'Vertical Options Slot', columnId: 'in-progress', priority: 'medium', assignee: 'David', rank: '20' },
    { id: 'cb-5', title: 'Acoustic Sound Synthesis', columnId: 'shipped', priority: 'high', assignee: 'David', rank: '10' },
  ])

  return (
    <div className="w-full p-3 sm:p-4 bg-bg-surface rounded-macro border border-border/60 shadow-xs flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/40">
        <div className="min-w-0 flex-1">
          <h5 className="text-xs font-semibold uppercase text-fg-muted tracking-wider">
            Collapsible Columns Rail Experience
          </h5>
          <p className="text-xs text-fg-muted mt-0.5">
            Click the chevron or column title when collapsed to toggle between expanded card views and vertical rails.
          </p>
        </div>
      </div>
      <DndBoard
        items={items}
        columns={columns}
        groupBy={(item) => item.columnId}
        onItemsChange={(newItems) => setItems(newItems as KanbanItem[])}
        onColumnsChange={(cols) => setColumns(cols as KanbanColumn[])}
        renderItem={(item: KanbanItem, _col, index) => (
          <div className="flex flex-col gap-1 min-w-0">
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
            <span className="font-semibold text-sm text-fg">{item.title}</span>
            <div className="flex items-center justify-between text-xs pt-0.5">
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
              <span className="text-fg-muted font-mono text-xs">{item.assignee}</span>
            </div>
          </div>
        )}
      />
    </div>
  )
}

function DynamicGroupingBoardDemo() {
  type GroupDimension = 'status' | 'priority' | 'month'
  const [dimension, setDimension] = useState<GroupDimension>('status')

  interface FlexibleTask {
    id: string
    title: string
    status: 'backlog' | 'in-progress' | 'review' | 'done'
    priority: 'urgent' | 'high' | 'medium' | 'low'
    month: string
    assignee: string
    rank: string
  }

  const INITIAL_TASKS: FlexibleTask[] = [
    { id: 'dyn-1', title: 'Decoupled Multi-Container Partitioning', status: 'in-progress', priority: 'urgent', month: '2026-10', assignee: 'Alex', rank: '10' },
    { id: 'dyn-2', title: 'LexoRank O(1) Single-Row Updates', status: 'done', priority: 'high', month: '2026-09', assignee: 'David', rank: '10' },
    { id: 'dyn-3', title: 'Horizontal InfiniteScroll Columns', status: 'in-progress', priority: 'high', month: '2026-10', assignee: 'Sarah', rank: '20' },
    { id: 'dyn-4', title: 'Vertical Card Memory Windowing', status: 'backlog', priority: 'medium', month: '2026-11', assignee: 'Elena', rank: '10' },
    { id: 'dyn-5', title: 'Continuous Roadmap Multi-Year Slicing', status: 'backlog', priority: 'low', month: '2026-11', assignee: 'Alex', rank: '20' },
    { id: 'dyn-6', title: 'Bi-Directional Boundary Threshold Triggers', status: 'review', priority: 'high', month: '2026-10', assignee: 'Sarah', rank: '10' },
    { id: 'dyn-7', title: 'Automated Drag Over AutoScroll Integration', status: 'done', priority: 'medium', month: '2026-09', assignee: 'David', rank: '20' },
  ]

  const [tasks, setTasks] = useState<FlexibleTask[]>(INITIAL_TASKS)
  const [log, setLog] = useState<string | null>(null)

  const [columnsByDimension, setColumnsByDimension] = useState<{
    status: KanbanColumn[]
    priority: KanbanColumn[]
    month: KanbanColumn[]
  }>({
    status: [
      { id: 'backlog', title: 'Backlog Queue', rank: '10' },
      { id: 'in-progress', title: 'Active Work', rank: '20' },
      { id: 'review', title: 'In Review', rank: '30' },
      { id: 'done', title: 'Completed', rank: '40' },
    ],
    priority: [
      { id: 'urgent', title: '🔥 Urgent', rank: '10' },
      { id: 'high', title: '⚡ High', rank: '20' },
      { id: 'medium', title: 'Standard', rank: '30' },
      { id: 'low', title: 'Low / Backlog', rank: '40' },
    ],
    month: [
      { id: '2026-09', title: 'Sep 2026', rank: '10' },
      { id: '2026-10', title: 'Oct 2026', rank: '20' },
      { id: '2026-11', title: 'Nov 2026', rank: '30' },
      { id: '2026-12', title: 'Dec 2026', rank: '40' },
    ],
  })

  return (
    <div className="w-full p-3 sm:p-4 bg-bg-surface rounded-macro border border-border/60 shadow-xs flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/40">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h5 className="text-xs font-semibold uppercase text-fg-muted tracking-wider">
              Function-Based Dynamic Grouping
            </h5>
            <Badge size="sm" intent="primary">O(1) LexoRank</Badge>
          </div>
          <p className="text-xs text-fg-muted mt-0.5">
            Same flat collection of {tasks.length} items dynamically re-partitioned without schema alterations.
          </p>
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-bg-subtle rounded-base border border-border/40">
          {(['status', 'priority', 'month'] as GroupDimension[]).map((dim) => (
            <button
              key={dim}
              type="button"
              onClick={() => setDimension(dim)}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded capitalize transition-all',
                dimension === dim
                  ? 'bg-bg-surface text-fg font-semibold shadow-xs border border-border/60'
                  : 'text-fg-muted hover:text-fg'
              )}
            >
              By {dim}
            </button>
          ))}
        </div>
      </div>

      {log && (
        <div className="px-3 py-1.5 bg-primary/5 rounded border border-primary/20 text-xs font-mono text-primary flex items-center gap-2">
          <span>⚡</span>
          <span>{log}</span>
        </div>
      )}

      <DndBoard
        items={tasks}
        columns={columnsByDimension[dimension]}
        groupBy={(task: FlexibleTask) => task[dimension]}
        assignColumn={(task: FlexibleTask, targetColId, newRank) => ({
          ...task,
          [dimension]: targetColId,
          rank: newRank,
        })}
        onItemsChange={(updated) => setTasks(updated as FlexibleTask[])}
        onColumnsChange={(newCols) => {
          setColumnsByDimension((prev) => ({
            ...prev,
            [dimension]: newCols as KanbanColumn[],
          }))
        }}
        onMoveColumn={(e) => {
          setLog(`Column '${e.column?.title ?? e.activeId}' reordered to index ${e.targetIndex} (rank: ${e.rank})`)
        }}
        onMoveItem={(e) => {
          setLog(`Task #${e.activeId} moved to ${dimension}: '${e.targetContainerId}' with rank '${e.rank}'`)
        }}
        renderItem={(item: FlexibleTask, _col, index) => (
          <div className="flex flex-col gap-1 min-w-0">
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
            <span className="font-semibold text-xs text-fg truncate">{item.title}</span>
            <div className="flex items-center justify-between text-[11px] text-fg-muted pt-0.5">
              <span className="capitalize">{item.priority}</span>
              <span className="truncate">{item.assignee}</span>
            </div>
          </div>
        )}
      />
    </div>
  )
}

function DualAxisTimelineBoardDemo() {
  const [columns, setColumns] = useState<KanbanColumn[]>(() => {
    return Array.from({ length: 18 }, (_, i) => {
      const year = 2026 + Math.floor(i / 12)
      const m = (i % 12) + 1
      const id = `${year}-${String(m).padStart(2, '0')}`
      return {
        id,
        title: `${new Date(year, m - 1).toLocaleString('default', { month: 'short' })} ${year}`,
        rank: `c${String(i).padStart(2, '0')}`,
      }
    })
  })

  const [items, setItems] = useState<KanbanItem[]>(() => {
    const list: KanbanItem[] = []
    for (let i = 0; i < 18; i++) {
      const year = 2026 + Math.floor(i / 12)
      const m = (i % 12) + 1
      const colId = `${year}-${String(m).padStart(2, '0')}`
      for (let j = 0; j < 15; j++) {
        list.push({
          id: `${colId}-task-${j + 1}`,
          title: `Milestone ${String.fromCharCode(65 + (j % 26))} Feature Implementation`,
          columnId: colId,
          priority: j % 3 === 0 ? 'high' : j % 3 === 1 ? 'medium' : 'low',
          assignee: j % 2 === 0 ? 'Alex' : 'Sarah',
          rank: `r${String(j).padStart(2, '0')}`,
        })
      }
    }
    return list
  })

  const [lastAction, setLastAction] = useState<string | null>(null)

  return (
    <div className="w-full p-3 sm:p-4 bg-bg-surface rounded-macro border border-border/60 shadow-xs flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/40">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h5 className="text-xs font-semibold uppercase text-fg-muted tracking-wider">
              Continuous 18-Month Timeline Roadmap (Dual-Axis Windowing)
            </h5>
            <Badge size="sm" intent="success">60 FPS Memory Capped</Badge>
          </div>
          <p className="text-xs text-fg-muted mt-0.5">
            Horizontal infinite scroll across 18 timeline columns + vertical card sliding window within each column ({items.length} total tasks).
          </p>
        </div>
      </div>

      {lastAction && (
        <div className="px-3 py-1.5 bg-success/10 rounded border border-success/20 text-xs font-mono text-success flex items-center gap-2">
          <span>✓</span>
          <span>{lastAction}</span>
        </div>
      )}

      <DndBoard
        items={items}
        columns={columns}
        groupBy={(task) => task.columnId}
        assignColumn={(task, targetColId, newRank) => ({
          ...task,
          columnId: String(targetColId),
          rank: newRank,
        })}
        onItemsChange={(newItems) => setItems(newItems as KanbanItem[])}
        onColumnsChange={(cols) => setColumns(cols as KanbanColumn[])}
        columnsInfiniteScroll={{
          orientation: 'horizontal',
          windowSize: 12,
          threshold: 100,
        }}
        columnInfiniteScroll={{
          windowSize: 10,
          threshold: 50,
        }}
        onMoveColumn={(e) => {
          setLastAction(`Column #${e.activeId} reordered to index ${e.targetIndex} (Rank: ${e.rank})`)
        }}
        onMoveItem={(e) => {
          setLastAction(`Task #${e.activeId} dropped in column '${e.targetContainerId}' (Rank: ${e.rank})`)
        }}
        renderItem={(item: KanbanItem, _col, index) => (
          <div className="flex flex-col gap-1 min-w-0">
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
            <span className="font-medium text-xs text-fg truncate">{item.title}</span>
            <div className="flex items-center justify-between text-[10px] text-fg-muted pt-0.5">
              <span className="capitalize">{item.priority}</span>
              <span className="truncate">{item.assignee}</span>
            </div>
          </div>
        )}
      />
    </div>
  )
}

export const dndBoardDoc: ComponentDocSpec = {
  id: 'dnd-board',
  name: 'DndBoard',
  badge: 'Module / DnD',
  summary:
    'Normalized Kanban board supporting decoupled columns, function-based dynamic grouping, single-row LexoRank O(1) mutations, and dual-axis sliding-window infinite scrolling.',
  subcomponents: [
    'DndBoard.Column',
    'DndBoard.Item',
    'DndBoard.Header',
    'DndBoard.Handle',
  ],
  playground: {
    defaultProps: {},
    controls: [],
    render: () => <DndBoardPlayground />,
  },
  examples: [
    {
      title: 'Dynamic Function-Based Grouping (Status / Priority / Timeline Months)',
      description:
        'Pass a flat collection of items and a pure groupBy resolver function. Switch partitioning dimensions on the fly with O(1) LexoRank database assignment.',
      render: () => <DynamicGroupingBoardDemo />,
    },
    {
      title: 'Dual-Axis High-Scale Timeline (Horizontal Columns + Vertical Card Sliding Window)',
      description:
        'Supports 20+ horizontal timeline columns and hundreds of cards per column with sliding DOM memory windows and O(1) Column & Card LexoRank reordering.',
      render: () => <DualAxisTimelineBoardDemo />,
    },
    {
      title: 'Declarative Board with renderItem',
      description:
        'Pass flat items, column definitions, and renderItem for instant full-featured Kanban boards in under 10 lines.',
      render: () => <DndBoardPlayground />,
    },
    {
      title: 'Zero-Boilerplate Data-Driven Mode',
      description:
        'Pass flat items and columns data arrays directly to <DndBoard items={...} columns={...} /> for pure zero-configuration Kanban boards.',
      render: () => <DataDrivenBoardDemo />,
    },
    {
      title: 'State Management with useBoardState Hook',
      description:
        'Use the universal useBoardState hook for normalized state control, reset capabilities, and seamless synchronization.',
      render: () => <HookDrivenBoardDemo />,
    },
    {
      title: 'Collapsible Columns with Vertical Text & Options',
      description:
        'Columns can be collapsed into sleek slim rails with vertical title writing-mode and stacked vertical action controls.',
      render: () => <CollapsibleBoardDemo />,
    },
  ],
  recipes: [
    {
      title: 'Collapsible Kanban Rails',
      description: 'Set collapsible={true} and defaultCollapsed={true} or controlled collapsed state on <DndBoard.Column> or within column data objects.',
      code: `<DndBoard items={items} columns={columns} onItemsChange={setItems} onColumnsChange={setColumns}>
  <DndBoard.Column
    id="backlog"
    title="Backlog"
    collapsible={true}
    defaultCollapsed={true}
  >
    {items.filter(i => i.columnId === 'backlog').map((item, index) => (
      <DndBoard.Item key={item.id} id={item.id} columnId="backlog" index={index}>
        {item.title}
      </DndBoard.Item>
    ))}
  </DndBoard.Column>
</DndBoard>`,
    },
    {
      title: 'Compound Kanban Composition',
      description: 'Use compound sub-components <DndBoard.Column> and <DndBoard.Item> when you need fine-grained control over slot injection.',
      code: `import { DndBoard } from '@consona/interface'

export function CompoundBoard({ items, columns, onItemsChange, onColumnsChange }) {
  return (
    <DndBoard items={items} columns={columns} onItemsChange={onItemsChange} onColumnsChange={onColumnsChange}>
      {columns.map((col) => {
        const colItems = items.filter(i => i.columnId === col.id)
        return (
          <DndBoard.Column key={col.id} id={col.id} title={col.title}>
            {colItems.map((item, index) => (
              <DndBoard.Item key={item.id} id={item.id} columnId={col.id} index={index}>
                {item.title}
              </DndBoard.Item>
            ))}
          </DndBoard.Column>
        )
      })}
    </DndBoard>
  )
}`,
    },
    {
      title: 'Column Capacity & WIP Limits',
      description: 'Columns configured with maxCapacity automatically reject items and display an optical warning state when full.',
      code: `<DndBoard items={items} columns={columns} onItemsChange={setItems} onColumnsChange={setColumns}>
  <DndBoard.Column id="review" title="Review (Max 2)" maxCapacity={2}>
    {items.filter(i => i.columnId === 'review').map((item, index) => (
      <DndBoard.Item key={item.id} id={item.id} columnId="review" index={index}>
        {item.title}
      </DndBoard.Item>
    ))}
  </DndBoard.Column>
</DndBoard>`,
    },
  ],
  a11yNotes: [
    'Columns declare droppable regions with aria-dropeffect="move".',
    'Card items declare draggable status and can be navigated via keyboard.',
  ],
}
