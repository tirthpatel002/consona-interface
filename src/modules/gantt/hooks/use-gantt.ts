/**
 * @file use-gantt.ts
 * Type C engine runtime hook + Type B headless contract for Gantt.
 * Returns the mandatory 4-part signature: { state, actions, helpers, ariaProps }.
 */

import { useMemo } from 'react'
import type { HeadlessHookReturn } from '../../../core/hooks'
import {
  useGanttCompound,
  useOptionalGanttCompound,
  type GanttContextValue,
} from '../context'
import {
  applyLiveDragLayout,
  columnWindow,
  createRangeFromPointer,
  datesFromLayout,
  formatGanttDateTime,
  layoutBar,
  nowLinePx,
  timelineWidth,
  toMs,
  type GanttBarLayout,
  type GanttColumn,
  type GanttColumnWindow,
  type GanttCreateEvent,
  type GanttDependencyChangeEvent,
  type GanttDependencySide,
  type GanttDragType,
  type GanttEngineState,
  type GanttItemChangeEvent,
  type GanttViewRange,
} from '../engine'

/** Stable empty deps list — avoids new [] identity on every getDependencies call. */
const EMPTY_DEPENDENCIES: readonly string[] = Object.freeze([])

export interface GanttHookState extends GanttEngineState {
  /** Items currently bound to the provider. */
  itemCount: number
  /** Whether a drag session is active. */
  isDragging: boolean
  /** Whether a dependency-link gesture is active. */
  isLinkingDependency: boolean
}

export interface GanttHookActions {
  /** Change timeline magnification. */
  setViewRange: (viewRange: GanttViewRange, anchor?: Date) => void
  /** Select an item by id (or clear). */
  select: (id: string | null) => void
  /** Hover an item by id (or clear). */
  hover: (id: string | null) => void
  /** Begin bar drag / resize. */
  beginDrag: (input: {
    itemId: string
    type: GanttDragType
    clientX: number
    left: number
    width: number
    startMs: number
    endMs: number
  }) => void
  /** Pointer move during drag (optional scrollLeft after edge-autoscroll). */
  updateDrag: (clientX: number, scrollLeft?: number) => void
  /** Commit drag for a concrete item. */
  endDrag: <T>(item: T) => GanttItemChangeEvent<T> | null
  /** Abort drag without committing. */
  cancelDrag: () => void
  /** Begin dependency-link from a connection dot. */
  beginDependencyLink: (input: {
    sourceId: string
    side: GanttDependencySide
    x: number
    y: number
  }) => void
  /** Update rubber-band endpoint (timeline-local). */
  updateDependencyLink: (x: number, y: number) => void
  /** Clear dependency-link gesture. */
  endDependencyLink: () => void
  /** Abort dependency-link without commit. */
  cancelDependencyLink: () => void
  /** Update scroll offset only. */
  setScrollLeft: (scrollLeft: number) => void
  /** Update scroll + visible timeline width together. */
  setViewport: (scrollLeft: number, viewportWidth: number) => void
  /** Refresh now marker. */
  setNow: (nowMs?: number) => void
  /** Emit a dependency mutation through the provider callback. */
  emitDependencyChange: (event: GanttDependencyChangeEvent) => void
  /** Emit a create-strip commit through the provider callback. */
  emitCreate: (event: GanttCreateEvent) => void
  /** Scroll the timeline so a pixel offset is centered (or near) in view. */
  scrollToPx: (px: number, behavior?: ScrollBehavior) => void
  /** Index signature for HeadlessHookReturn constraint. */
  [key: string]: Function
}

export interface GanttHookHelpers {
  /** Precomputed columns for the active view (full range — scroll + bar math). */
  columns: GanttColumn[]
  /**
   * Horizontal column window for virtualized header/grid mounting.
   * Derived from scrollLeft + viewportWidth + overscan.
   */
  columnWindow: GanttColumnWindow
  /** Columns currently in the horizontal window (slice of `columns`). */
  visibleColumns: GanttColumn[]
  /** Total timeline width in pixels. */
  timelineWidthPx: number
  /** Pixel position of the now line. */
  nowPx: number
  /** Layout a bar for an item using provider accessors (committed dates). */
  getBarLayout: <T>(item: T) => GanttBarLayout
  /**
   * Layout a bar with live drag override when `engine.state.drag` targets this item.
   * Prefer this for dependencies / chips / datetime labels.
   */
  getLiveBarLayout: <T>(item: T) => GanttBarLayout
  /** Resolve label via accessors. */
  getLabel: <T>(item: T) => string
  /** Resolve color via accessors. */
  getColor: <T>(item: T) => string | undefined
  /** Resolve dependencies via accessors. */
  getDependencies: <T>(item: T) => readonly string[]
  /** Resolve id via accessors. */
  getId: <T>(item: T) => string
  /** Format a datetime for hover/drag end labels. */
  formatDateTime: (ms: number) => string
  /** Derive a create-strip range centered on a timeline pixel. */
  createRangeAt: (pointerPx: number) => ReturnType<typeof createRangeFromPointer>
  /** Visible timeline left edge in timeline-local px. */
  visibleLeft: number
  /** Visible timeline right edge in timeline-local px. */
  visibleRight: number
  /** Whether create strip should render. */
  canCreate: boolean
  /** Whether dependency dots / linking are interactive. */
  canEditDependencies: boolean
  /**
   * Whether bars should paint their in-bar title label.
   * True when the title rail is off or collapsed.
   */
  showBarTitle: boolean
  /** Raw compound context (advanced). */
  context: GanttContextValue
}

export interface GanttHookAriaProps {
  /** Root role. */
  role: 'grid'
  /** Accessible label. */
  'aria-label': string
  /** Busy while dragging. */
  'aria-busy': boolean
}

export type UseGanttReturn = HeadlessHookReturn<
  GanttHookState,
  GanttHookActions,
  GanttHookHelpers,
  GanttHookAriaProps
>

function buildGanttReturn(ctx: GanttContextValue): UseGanttReturn {
  const {
    engine,
    state,
    items,
    accessors,
    columns,
    onItemChange,
    onDependencyChange,
    onCreate,
    hasOnCreate,
    hasOnDependencyChange,
    readOnly,
    railWidthPx,
    scrollerRef,
  } = ctx

  const getBarLayout = <T,>(item: T): GanttBarLayout => {
    const start = accessors.getStart(item as never)
    const end = accessors.getEnd(item as never)
    return layoutBar(start, end, state.rangeStartMs, state.cellWidth, state.viewRange)
  }

  const getId = <T,>(item: T) => accessors.getId(item as never)

  const getLiveBarLayout = <T,>(item: T): GanttBarLayout => {
    const base = getBarLayout(item)
    return applyLiveDragLayout(
      base,
      getId(item),
      state.drag,
      state.rangeStartMs,
      state.cellWidth,
      state.viewRange
    )
  }

  const actions: GanttHookActions = {
    setViewRange: (viewRange, anchor) => engine.setViewRange(viewRange, anchor),
    select: (id) => engine.select(id),
    hover: (id) => engine.hover(id),
    beginDrag: (input) => engine.beginDrag(input),
    updateDrag: (clientX, scrollLeft) => {
      engine.updateDrag(clientX, scrollLeft)
    },
    endDrag: <T,>(item: T) => {
      const event = engine.endDrag(item)
      if (event && onItemChange) onItemChange(event as GanttItemChangeEvent<never>)
      return event
    },
    cancelDrag: () => engine.cancelDrag(),
    beginDependencyLink: (input) => engine.beginDependencyLink(input),
    updateDependencyLink: (x, y) => {
      engine.updateDependencyLink(x, y)
    },
    endDependencyLink: () => {
      engine.endDependencyLink()
    },
    cancelDependencyLink: () => engine.cancelDependencyLink(),
    setScrollLeft: (scrollLeft) => engine.setScrollLeft(scrollLeft),
    setViewport: (scrollLeft, viewportWidth) => engine.setViewport(scrollLeft, viewportWidth),
    setNow: (nowMs) => engine.setNow(nowMs),
    emitDependencyChange: (event) => {
      onDependencyChange?.(event)
      engine.emit('gantt:dependencyChange', event)
    },
    emitCreate: (event) => {
      onCreate?.(event)
      engine.emit('gantt:create', event)
    },
    scrollToPx: (px, behavior = 'smooth') => {
      const el = scrollerRef.current
      if (!el) return
      const rail = railWidthPx
      const viewW = Math.max(0, el.clientWidth - rail)
      const target = Math.max(0, px - viewW / 2)
      el.scrollTo({ left: target, behavior })
      engine.setViewport(el.scrollLeft, viewW)
    },
  }

  const timelineWidthPx = timelineWidth(columns.length, state.cellWidth)
  const nowPx = nowLinePx(state.nowMs, state.rangeStartMs, state.cellWidth, state.viewRange)
  const colWindow = columnWindow(
    state.scrollLeft,
    state.viewportWidth,
    state.cellWidth,
    columns.length
  )
  const visibleColumns = columns.slice(colWindow.startIndex, colWindow.endIndex)
  const visibleLeft = state.scrollLeft
  const visibleRight =
    state.viewportWidth > 0 ? state.scrollLeft + state.viewportWidth : state.scrollLeft

  return {
    state: {
      ...state,
      itemCount: items.length,
      isDragging: state.drag != null,
      isLinkingDependency: state.dependencyLink != null,
    },
    actions,
    helpers: {
      columns,
      columnWindow: colWindow,
      visibleColumns,
      timelineWidthPx,
      nowPx,
      getBarLayout,
      getLiveBarLayout,
      getLabel: <T,>(item: T) => accessors.getLabel?.(item as never) ?? accessors.getId(item as never),
      getColor: <T,>(item: T) => accessors.getColor?.(item as never),
      getDependencies: <T,>(item: T) =>
        accessors.getDependencies?.(item as never) ?? EMPTY_DEPENDENCIES,
      getId,
      formatDateTime: (ms) => formatGanttDateTime(ms, state.viewRange),
      createRangeAt: (pointerPx) =>
        createRangeFromPointer(pointerPx, state.rangeStartMs, state.cellWidth, state.viewRange),
      visibleLeft,
      visibleRight,
      canCreate: hasOnCreate && !readOnly,
      canEditDependencies: hasOnDependencyChange && !readOnly,
      showBarTitle: ctx.showBarTitle,
      context: ctx,
    },
    ariaProps: {
      role: 'grid',
      'aria-label': 'Gantt chart',
      'aria-busy': state.drag != null || state.dependencyLink != null,
    },
  }
}

/**
 * Bind to the nearest GanttProvider and expose state / actions / helpers / ariaProps.
 */
export function useGantt(): UseGanttReturn {
  const ctx = useGanttCompound()
  // Memoize against engine state + items/columns — accessors/callbacks are identity-stable
  // from GanttProvider, so including whole ctx is safe without thrashing on inline handlers.
  return useMemo(
    () => buildGanttReturn(ctx),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- granular deps below
    [
      ctx.engine,
      ctx.state,
      ctx.items,
      ctx.accessors,
      ctx.columns,
      ctx.readOnly,
      ctx.onItemChange,
      ctx.onDependencyChange,
      ctx.onCreate,
      ctx.hasOnCreate,
      ctx.hasOnDependencyChange,
      ctx.railWidthPx,
      ctx.showRail,
      ctx.showEdgeChips,
      ctx.railCollapsed,
      ctx.showBarTitle,
      ctx.scrollerRef,
    ]
  )
}

/**
 * Optional variant — returns null outside a provider (Rule C8 degrade, no throw).
 */
export function useOptionalGantt(): UseGanttReturn | null {
  const ctx = useOptionalGanttCompound()
  return useMemo(
    () => (ctx ? buildGanttReturn(ctx) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- granular deps below
    [
      ctx,
      ctx?.engine,
      ctx?.state,
      ctx?.items,
      ctx?.accessors,
      ctx?.columns,
      ctx?.readOnly,
      ctx?.onItemChange,
      ctx?.onDependencyChange,
      ctx?.onCreate,
      ctx?.hasOnCreate,
      ctx?.hasOnDependencyChange,
      ctx?.railWidthPx,
      ctx?.showRail,
      ctx?.showEdgeChips,
      ctx?.railCollapsed,
      ctx?.showBarTitle,
      ctx?.scrollerRef,
    ]
  )
}

/**
 * Headless per-item layout helper (usable inside rows/bars).
 * Applies live `engine.state.drag` geometry when this item is being moved/resized.
 */
export function useGanttItemLayout(item: unknown): GanttBarLayout | null {
  const gantt = useOptionalGantt()
  return useMemo(() => {
    if (!gantt) return null
    return gantt.helpers.getLiveBarLayout(item)
  }, [gantt, item])
}

export { toMs, datesFromLayout, formatGanttDateTime }
