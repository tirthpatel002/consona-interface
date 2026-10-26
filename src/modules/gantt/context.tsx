/**
 * @file context.tsx
 * GanttProvider + compound ambient context for the Gantt family (Rules C6, ENG triad).
 */

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { createCompoundContext } from '../../core/context'
import { useCallbackRef, useEngineState } from '../../core/hooks'
import {
  GanttEngine,
  buildColumns,
  createGanttEngine,
  itemExtentMs,
  type GanttColumn,
  type GanttCreateEvent,
  type GanttDependencyChangeEvent,
  type GanttEngineOptions,
  type GanttEngineState,
  type GanttFieldAccessors,
  type GanttItemChangeEvent,
  type GanttViewRange,
} from './engine'

export interface GanttContextValue<T = unknown> {
  /** Underlying pure engine instance. */
  engine: GanttEngine
  /** Reactive engine state snapshot. */
  state: GanttEngineState
  /** Consumer items (generic). */
  items: readonly T[]
  /** Field accessors — never hardcoded domain keys. */
  accessors: GanttFieldAccessors<T>
  /** Precomputed header / grid columns. */
  columns: GanttColumn[]
  /** Commit callback for bar move/resize. */
  onItemChange?: (event: GanttItemChangeEvent<T>) => void
  /** Optional dependency edge mutations. */
  onDependencyChange?: (event: GanttDependencyChangeEvent) => void
  /** Optional create-strip commit (bottom row). */
  onCreate?: (event: GanttCreateEvent) => void
  /**
   * True when the consumer passed an `onCreate` prop (not the stable callback-ref wrapper).
   * useCallbackRef always returns a function, so feature gates must use this flag.
   */
  hasOnCreate: boolean
  /**
   * True when the consumer passed an `onDependencyChange` prop (not the stable callback-ref wrapper).
   */
  hasOnDependencyChange: boolean
  /** Whether bars are interactive. */
  readOnly: boolean
  /** Sticky rail width in CSS pixels (for viewport / edge chips). */
  railWidthPx: number
  /** Whether the title/rail column is shown. Edge chips default off when true. */
  showRail: boolean
  /**
   * Whether overflow edge chips may render.
   * Default policy: on when the rail is hidden or collapsed (overflow arrows hide with labels);
   * off when the expanded title rail is visible.
   */
  showEdgeChips: boolean
  /**
   * Whether the sticky title/rail column is collapsed (narrow icon strip).
   * Only meaningful when showRail is true.
   */
  railCollapsed: boolean
  /** Toggle / set rail collapsed state (controlled or uncontrolled from Gantt root). */
  setRailCollapsed: (collapsed: boolean) => void
  /**
   * Whether bar bodies should render their in-bar title label.
   * True when the rail is hidden (showRail false) or collapsed.
   */
  showBarTitle: boolean
  /** Mutable scroller element ref (edge-chip scroll-into-view). */
  scrollerRef: RefObject<HTMLDivElement | null>
  /** Update measured rail width (from GanttShell). */
  setRailWidthPx: (px: number) => void
}

const {
  Context: GanttCompoundContext,
  Provider: GanttCompoundProvider,
  useCompoundContext: useGanttCompound,
  useOptionalCompoundContext: useOptionalGanttCompound,
} = createCompoundContext<GanttContextValue>('Gantt')

export {
  GanttCompoundContext,
  GanttCompoundProvider,
  useGanttCompound,
  useOptionalGanttCompound,
}

/**
 * Default field accessors for standard JSON task objects (`id`, `start`/`startDate`, `end`/`endDate`, `label`/`title`/`name`, `color`, `dependencies`).
 * Enables zero-accessor usage in declarative/streaming runtimes like OpenUI Lang and prevents crashes while props stream in.
 */
export const DEFAULT_GANTT_ACCESSORS: GanttFieldAccessors<any> = {
  getId: (item: any) => String(item?.id ?? item?.key ?? ''),
  getStart: (item: any) => item?.start ?? item?.startDate ?? new Date(),
  getEnd: (item: any) => item?.end ?? item?.endDate ?? new Date(),
  getLabel: (item: any) => item?.label ?? item?.title ?? item?.name,
  getColor: (item: any) => item?.color,
  getDependencies: (item: any) => (Array.isArray(item?.dependencies) ? item.dependencies : undefined),
}

export interface GanttProviderProps<T = unknown> extends GanttEngineOptions {
  /** Timeline items of any domain shape. */
  items?: readonly T[]
  /** Accessors mapping domain fields → Gantt geometry. Defaults to DEFAULT_GANTT_ACCESSORS. */
  accessors?: GanttFieldAccessors<T>
  /** Controlled view range (optional). */
  viewRange?: GanttViewRange
  /** Called when a bar move/resize commits new dates. */
  onItemChange?: (event: GanttItemChangeEvent<T>) => void
  /** Called when a dependency edge is added or removed. */
  onDependencyChange?: (event: GanttDependencyChangeEvent) => void
  /** Called when the create strip commits a new range (optional feature). */
  onCreate?: (event: GanttCreateEvent) => void
  /** Disable pointer interactions on bars. Default: false. */
  readOnly?: boolean
  /** Initial sticky rail width in px. Default: 192 (12rem). */
  railWidthPx?: number
  /** Show the sticky title/rail column. Default: true. */
  showRail?: boolean
  /**
   * Show overflow edge chips when a bar is clipped.
   * Default: false when the expanded title rail is visible; true when the rail is
   * hidden or collapsed (rail overflow arrows are unavailable while collapsed).
   */
  showEdgeChips?: boolean
  /**
   * Whether the title/rail column is collapsed.
   * Managed by Gantt root (controlled / uncontrolled); default false here.
   */
  railCollapsed?: boolean
  /** Setter for rail collapsed state. */
  setRailCollapsed?: (collapsed: boolean) => void
  /** Inject a pre-built engine (testing / advanced). */
  engine?: GanttEngine
  /** Provider children. */
  children: ReactNode
}

/**
 * Stable accessor facade — identity never changes across parent re-renders.
 * Always reads the latest accessors via ref (prevents context thrash loops) and falls back to DEFAULT_GANTT_ACCESSORS.
 */
function useStableAccessors<T>(accessors?: GanttFieldAccessors<T>): GanttFieldAccessors<T> {
  const accessorsRef = useRef(accessors)
  accessorsRef.current = accessors

  return useMemo<GanttFieldAccessors<T>>(
    () => ({
      getId: (item) => (accessorsRef.current?.getId ?? DEFAULT_GANTT_ACCESSORS.getId)(item),
      getStart: (item) => (accessorsRef.current?.getStart ?? DEFAULT_GANTT_ACCESSORS.getStart)(item),
      getEnd: (item) => (accessorsRef.current?.getEnd ?? DEFAULT_GANTT_ACCESSORS.getEnd)(item),
      getLabel: (item) => (accessorsRef.current?.getLabel ?? DEFAULT_GANTT_ACCESSORS.getLabel)?.(item),
      getColor: (item) => (accessorsRef.current?.getColor ?? DEFAULT_GANTT_ACCESSORS.getColor)?.(item),
      getDependencies: (item) =>
        (accessorsRef.current?.getDependencies ?? DEFAULT_GANTT_ACCESSORS.getDependencies)?.(item),
    }),
    []
  )
}

/**
 * Root provider that owns a GanttEngine and publishes ambient compound context.
 */
export function GanttProvider<T = unknown>({
  items = [],
  accessors = DEFAULT_GANTT_ACCESSORS,
  viewRange: viewRangeProp,
  onItemChange,
  onDependencyChange,
  onCreate,
  readOnly = false,
  railWidthPx: railWidthPxProp = 192,
  showRail = true,
  showEdgeChips: showEdgeChipsProp,
  railCollapsed = false,
  setRailCollapsed: setRailCollapsedProp,
  engine: propEngine,
  children,
  ...engineOptions
}: GanttProviderProps<T>) {
  const safeItems = useMemo(
    () => (Array.isArray(items) ? items.filter((it): it is T => it != null && typeof it === 'object') : []),
    [items]
  )
  const engineRef = useRef<GanttEngine | null>(null)
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const [railWidthPx, setRailWidthPxState] = useState(railWidthPxProp)
  const anchor = engineOptions.anchor
  // Anchor Date identity is unstable when callers pass `new Date()` inline.
  // Depend on epoch ms so effects/memos do not thrash every render.
  const anchorMs = anchor?.getTime()
  const anchorRef = useRef(anchor)
  anchorRef.current = anchor

  if (!engineRef.current) {
    engineRef.current =
      propEngine ??
      createGanttEngine({
        ...engineOptions,
        viewRange: viewRangeProp ?? 'month',
        dependenciesEnabled: Boolean(onDependencyChange) || engineOptions.dependenciesEnabled,
      })
  }

  const engine = engineRef.current
  const state = useEngineState(engine)

  const stableAccessors = useStableAccessors(accessors)
  const stableOnItemChange = useCallbackRef(onItemChange)
  const stableOnDependencyChange = useCallbackRef(onDependencyChange)
  const stableOnCreate = useCallbackRef(onCreate)

  const dependenciesEnabledOpt = engineOptions.dependenciesEnabled
  // Keep dependenciesEnabled in sync when the consumer wires/unwires the callback.
  useEffect(() => {
    engine.setDependenciesEnabled(Boolean(onDependencyChange) || Boolean(dependenciesEnabledOpt))
  }, [engine, onDependencyChange, dependenciesEnabledOpt])

  useEffect(() => {
    if (railWidthPxProp !== railWidthPx) setRailWidthPxState(railWidthPxProp)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to prop changes
  }, [railWidthPxProp])

  // Sync controlled viewRange only when the *prop* changes.
  // Do not reset the engine when the toolbar updates viewRange internally —
  // that fight (prop month vs engine week) rebuilt columns every click and
  // could cascade with scroll/now effects into a render storm.
  const prevViewRangePropRef = useRef<GanttViewRange | undefined>(undefined)
  useEffect(() => {
    if (viewRangeProp == null) return
    const propChanged = viewRangeProp !== prevViewRangePropRef.current
    prevViewRangePropRef.current = viewRangeProp
    if (!propChanged) return
    if (viewRangeProp !== engine.getState().viewRange) {
      engine.setViewRange(viewRangeProp, anchorRef.current)
    }
  }, [viewRangeProp, engine, anchorMs])

  useEffect(() => {
    engine.setNow()
    const id = window.setInterval(() => engine.setNow(), 60_000)
    return () => window.clearInterval(id)
  }, [engine])

  // Columns span the default view window ∪ item extents (via accessors), every viewRange.
  // Recompute when items, accessors, viewRange, or anchor change.
  // Use stableAccessors so inline parent accessor objects do not rebuild columns
  // (and thrash syncColumns / child memos) every render.
  const columns = useMemo(() => {
    const extent = itemExtentMs(safeItems, stableAccessors)
    return buildColumns(state.viewRange, {
      anchor: anchorRef.current,
      ...(extent
        ? {
            coverStartMs: extent.startMs,
            coverEndMs: extent.endMs,
            paddingCells: 1,
          }
        : {}),
    })
  }, [state.viewRange, anchorMs, safeItems, stableAccessors])

  // Keep engine rangeStart/rangeEnd + columnCount aligned with provider columns before paint.
  useLayoutEffect(() => {
    engine.syncColumns(columns)
  }, [engine, columns])

  const setRailWidthPx = useCallback((px: number) => {
    setRailWidthPxState((prev) => (prev === px ? prev : px))
  }, [])

  // Feature gates must use prop presence — stable callback refs are always truthy functions.
  const hasOnCreate = Boolean(onCreate)
  const hasOnDependencyChange = Boolean(onDependencyChange)
  // Edge chips: off with expanded title rail (rail has ‹/›); on when rail is
  // hidden or collapsed (labels/overflow hide — chips take over); explicit prop wins.
  const showEdgeChips =
    showEdgeChipsProp !== undefined
      ? showEdgeChipsProp
      : !showRail || railCollapsed

  const setRailCollapsed = useCallback(
    (collapsed: boolean) => {
      setRailCollapsedProp?.(collapsed)
    },
    [setRailCollapsedProp]
  )

  // In-bar titles when the rail column is off or collapsed (title lives in rail when expanded).
  const showBarTitle = !showRail || railCollapsed

  const value = useMemo<GanttContextValue<T>>(
    () => ({
      engine,
      state,
      items: safeItems,
      accessors: stableAccessors,
      columns,
      onItemChange: stableOnItemChange,
      onDependencyChange: stableOnDependencyChange,
      onCreate: stableOnCreate,
      hasOnCreate,
      hasOnDependencyChange,
      readOnly,
      railWidthPx,
      showRail,
      showEdgeChips,
      railCollapsed,
      setRailCollapsed,
      showBarTitle,
      scrollerRef,
      setRailWidthPx,
    }),
    [
      engine,
      state,
      safeItems,
      stableAccessors,
      columns,
      stableOnItemChange,
      stableOnDependencyChange,
      stableOnCreate,
      hasOnCreate,
      hasOnDependencyChange,
      readOnly,
      railWidthPx,
      showRail,
      showEdgeChips,
      railCollapsed,
      setRailCollapsed,
      showBarTitle,
      setRailWidthPx,
    ]
  )

  return (
    <GanttCompoundProvider value={value as GanttContextValue}>
      {children}
    </GanttCompoundProvider>
  )
}
