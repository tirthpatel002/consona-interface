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
import { createCompoundContext } from '@consona/interface-core'
import { useCallbackRef, useEngineState } from '@consona/interface-core'
import {
  GanttEngine,
  buildColumns,
  createGanttEngine,
  itemExtentMs,
  toMs,
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

const FALLBACK_EPOCH = 0

/**
 * Default field accessors for standard JSON task objects.
 * Invalid / missing dates yield NaN via `toMs` (layoutBar falls back to a one-cell bar).
 * Ids fall back to a stable empty string — callers should supply real ids.
 */
export const DEFAULT_GANTT_ACCESSORS: GanttFieldAccessors<any> = {
  getId: (item: any) => String(item?.id ?? item?.key ?? ''),
  getStart: (item: any) => item?.start ?? item?.startDate ?? FALLBACK_EPOCH,
  getEnd: (item: any) => item?.end ?? item?.endDate ?? FALLBACK_EPOCH,
  getLabel: (item: any) => item?.label ?? item?.title ?? item?.name,
  getColor: (item: any) => item?.color,
  getDependencies: (item: any) =>
    Array.isArray(item?.dependencies) ? item.dependencies : undefined,
}

export interface GanttProviderProps<T = unknown> extends GanttEngineOptions {
  /** Timeline items of any domain shape. */
  items?: readonly T[]
  /** Accessors mapping domain fields → Gantt geometry. Defaults to DEFAULT_GANTT_ACCESSORS. */
  accessors?: GanttFieldAccessors<T>
  /** Controlled view range (optional). */
  viewRange?: GanttViewRange
  /** Called when the engine view range changes (toolbar or imperative). */
  onViewRangeChange?: (viewRange: GanttViewRange) => void
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
  /** Inject a pre-built engine (testing / advanced). Never destroyed by the provider. */
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
 * Strict Mode–safe: owned engines are destroyed on a deferred microtask so remount reuses them.
 */
export function GanttProvider<T = unknown>({
  items = [],
  accessors = DEFAULT_GANTT_ACCESSORS,
  viewRange: viewRangeProp,
  onViewRangeChange,
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
  const ownedRef = useRef(false)
  const mountedRef = useRef(false)
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const [railWidthPx, setRailWidthPxState] = useState(railWidthPxProp)
  const anchor = engineOptions.anchor
  const anchorMs = anchor?.getTime()
  const anchorRef = useRef(anchor)
  anchorRef.current = anchor

  const stableOnViewRangeChange = useCallbackRef(onViewRangeChange)

  if (propEngine) {
    engineRef.current = propEngine
    ownedRef.current = false
  } else if (!engineRef.current) {
    engineRef.current = createGanttEngine({
      ...engineOptions,
      viewRange: viewRangeProp ?? 'month',
      dependenciesEnabled: Boolean(onDependencyChange) || engineOptions.dependenciesEnabled,
    })
    ownedRef.current = true
  }

  const engine = engineRef.current!
  const state = useEngineState(engine)

  const stableAccessors = useStableAccessors(accessors)
  const stableOnItemChange = useCallbackRef(onItemChange)
  const stableOnDependencyChange = useCallbackRef(onDependencyChange)
  const stableOnCreate = useCallbackRef(onCreate)

  const hasOnCreate = Boolean(onCreate)
  const hasOnDependencyChange = Boolean(onDependencyChange)
  const dependenciesEnabledOpt = engineOptions.dependenciesEnabled

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (!ownedRef.current) return
      const eng = engineRef.current
      if (!eng) return
      void Promise.resolve().then(() => {
        if (mountedRef.current) return
        if (engineRef.current !== eng) return
        try {
          eng.destroy()
        } catch {
          /* ignore */
        }
        if (engineRef.current === eng) engineRef.current = null
      })
    }
  }, [propEngine])

  // Keep dependenciesEnabled in sync — depend on presence flag, not callback identity.
  useEffect(() => {
    engine.setDependenciesEnabled(hasOnDependencyChange || Boolean(dependenciesEnabledOpt))
  }, [engine, hasOnDependencyChange, dependenciesEnabledOpt])

  useEffect(() => {
    if (railWidthPxProp !== railWidthPx) setRailWidthPxState(railWidthPxProp)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to prop changes
  }, [railWidthPxProp])

  // Sync controlled viewRange only when the *prop* changes.
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

  // Notify parent when engine view range changes (toolbar / imperative).
  const lastEmittedViewRangeRef = useRef(state.viewRange)
  useEffect(() => {
    if (state.viewRange === lastEmittedViewRangeRef.current) return
    lastEmittedViewRangeRef.current = state.viewRange
    stableOnViewRangeChange?.(state.viewRange)
  }, [state.viewRange, stableOnViewRangeChange])

  useEffect(() => {
    engine.setNow()
    const id = window.setInterval(() => engine.setNow(), 60_000)
    return () => window.clearInterval(id)
  }, [engine])

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

  useLayoutEffect(() => {
    engine.syncColumns(columns)
  }, [engine, columns])

  const setRailWidthPx = useCallback((px: number) => {
    setRailWidthPxState((prev) => (prev === px ? prev : px))
  }, [])

  const showEdgeChips =
    showEdgeChipsProp !== undefined ? showEdgeChipsProp : !showRail || railCollapsed

  const setRailCollapsed = useCallback(
    (collapsed: boolean) => {
      setRailCollapsedProp?.(collapsed)
    },
    [setRailCollapsedProp]
  )

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

// Re-export toMs for consumers wiring custom accessors against DEFAULT_GANTT_ACCESSORS.
export { toMs }
