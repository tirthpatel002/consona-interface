/**
 * @file types.ts
 * Shared type contracts for the Gantt module: accessors, timeline geometry, and engine state.
 */

/** Supported timeline magnification presets. */
export type GanttViewRange = 'day' | 'week' | 'month' | 'quarter'

/** Absolute time value accepted by accessors and geometry helpers. */
export type GanttTimeValue = Date | number | string

/**
 * Generic field accessors that decouple the Gantt module from any domain schema.
 * Consumers map their item shape once — the module never reads hardcoded field names.
 */
export interface GanttFieldAccessors<T> {
  /** Stable unique identifier for the item. */
  getId: (item: T) => string
  /** Inclusive range start (Date, epoch ms, or ISO string). */
  getStart: (item: T) => GanttTimeValue
  /** Inclusive range end (Date, epoch ms, or ISO string). */
  getEnd: (item: T) => GanttTimeValue
  /** Optional human-readable label for the bar / rail. */
  getLabel?: (item: T) => string | undefined
  /** Optional CSS color token or hex for the bar fill. */
  getColor?: (item: T) => string | undefined
  /** Optional dependency target ids this item depends on (predecessors). */
  getDependencies?: (item: T) => readonly string[] | undefined
}

/** Pixel layout of a single bar on the timeline. */
export interface GanttBarLayout {
  /** Distance from timeline origin in pixels. */
  left: number
  /** Bar width in pixels. */
  width: number
  /** Resolved start epoch milliseconds. */
  startMs: number
  /** Resolved end epoch milliseconds. */
  endMs: number
}

/** One column (day or week chunk) in the header / grid. */
export interface GanttColumn {
  /** Column start instant. */
  start: Date
  /** Column end exclusive instant. */
  end: Date
  /** Primary header label (e.g. "Wed 7" / "7" / "Oct 07"). */
  label: string
  /** Secondary per-cell header label (e.g. weekday under day-view hours). */
  subLabel?: string
  /**
   * Spanning parent-band label for the first cell of a group
   * (e.g. week view "Mar (Week 12)", month view "Mar 2026").
   */
  parentLabel?: string
  /** Whether this column contains "now". */
  isToday: boolean
}

/** Active drag / resize gesture kind. */
export type GanttDragType = 'move' | 'resize-start' | 'resize-end'

/** Snapshot of an in-progress pointer drag session. */
export interface GanttDragSession {
  /** Item id being manipulated. */
  itemId: string
  /** Gesture kind. */
  type: GanttDragType
  /** Pointer clientX when the gesture started. */
  startClientX: number
  /** Scroller scrollLeft when the gesture started (keeps preview correct across autoscroll). */
  startScrollLeft: number
  /** Bar left when the gesture started. */
  startLeft: number
  /** Bar width when the gesture started. */
  startWidth: number
  /** Original duration in milliseconds (preserved on move). */
  originalDurationMs: number
  /** Live preview left. */
  left: number
  /** Live preview width. */
  width: number
}

/** Side of a bar used for dependency connection dots. */
export type GanttDependencySide = 'start' | 'end'

/**
 * In-progress dependency-link gesture (drag between hover dots).
 * Coordinates are timeline-local (scroll content space).
 */
export interface GanttDependencyLinkSession {
  /** Item id where the drag started. */
  sourceId: string
  /** Which connection dot started the gesture. */
  side: GanttDependencySide
  /** Timeline-local pointer X. */
  x: number
  /** Timeline-local pointer Y. */
  y: number
}

/** Payload emitted when a bar move/resize commits. */
export interface GanttItemChangeEvent<T = unknown> {
  /** Item id. */
  id: string
  /** Source item snapshot. */
  item: T
  /** New start Date. */
  start: Date
  /** New end Date. */
  end: Date
  /** Gesture that produced the change. */
  type: GanttDragType
}

/** Payload emitted when a dependency edge is created or removed. */
export interface GanttDependencyChangeEvent {
  /** Predecessor item id. */
  fromId: string
  /** Successor item id. */
  toId: string
  /** Whether the edge was added or removed. */
  action: 'add' | 'remove'
}

/** Payload emitted when the create strip commits a new range. */
export interface GanttCreateEvent {
  /** Proposed start Date. */
  start: Date
  /** Proposed end Date. */
  end: Date
}

/** Directed dependency edge for the optional SVG layer. */
export interface GanttDependencyEdge {
  /** Predecessor item id. */
  fromId: string
  /** Successor item id. */
  toId: string
}

/** Pure engine reactive state. */
export interface GanttEngineState {
  /** Active view magnification. */
  viewRange: GanttViewRange
  /** Width of one column cell in pixels. */
  cellWidth: number
  /** Timeline range start (epoch ms). */
  rangeStartMs: number
  /** Timeline range end exclusive (epoch ms). */
  rangeEndMs: number
  /** Currently selected item id. */
  selectedId: string | null
  /** Currently hovered item id. */
  hoveredId: string | null
  /** Active drag session or null. */
  drag: GanttDragSession | null
  /** Active dependency-link gesture or null. */
  dependencyLink: GanttDependencyLinkSession | null
  /** Horizontal scroll offset of the timeline pane. */
  scrollLeft: number
  /**
   * Visible timeline viewport width in pixels (scroller clientWidth minus sticky rail).
   * Used for overflow edge chips.
   */
  viewportWidth: number
  /** Cached "now" epoch ms (updated by tick / setNow). */
  nowMs: number
  /** Whether dependency editing affordances are enabled. */
  dependenciesEnabled: boolean
}

/** Constructor options for GanttEngine. */
export interface GanttEngineOptions {
  /** Initial view range. Default: 'month'. */
  viewRange?: GanttViewRange
  /** Column cell width in pixels. Default depends on viewRange. */
  cellWidth?: number
  /** Anchor date for building the default range. Default: now. */
  anchor?: Date
  /** Enable dependency interaction layer. Default: false. */
  dependenciesEnabled?: boolean
  /** Override initial now timestamp (testing). */
  nowMs?: number
}
