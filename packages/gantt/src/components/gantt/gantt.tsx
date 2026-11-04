/**
 * @file gantt.tsx
 * Gantt root family — provider shell, toolbar (view-range + search + filter), sticky rail + timeline.
 * Fail-closed defaults (Rule C8): zero children renders a complete interactive chart.
 *
 * Search/filter on the default toolbar are controlled presentation only — downstream owns
 * matching (filter `items` before passing, or use `filterGanttItems`). Replace the whole
 * toolbar via `slots.toolbar`; extend fields/regions via Gantt props or nested toolbar slots.
 */

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@consona/interface-core'
import { createInterfaceComponent } from '@consona/interface-core'
import { useControllableState } from '@consona/interface-core'
import { renderSlot } from '@consona/interface-core'
import type { SlotComponents, SlotPropsMap } from '@consona/interface-core'
import { useIsMobile } from '@consona/interface-core'
import { DEFAULT_GANTT_ACCESSORS, GanttProvider } from '../../context'
import type {
  GanttCreateEvent,
  GanttDependencyChangeEvent,
  GanttEngine,
  GanttFieldAccessors,
  GanttItemChangeEvent,
  GanttViewRange,
} from '../../engine'
import {
  GANTT_ROW_HEIGHT,
  GANTT_ROW_OVERSCAN,
  prefersReducedMotion,
  rowWindow,
} from '../../engine'
import { useGantt } from '../../hooks'
import { GanttBar } from '../gantt-bar'
import { GanttCreateStrip } from '../gantt-create-strip'
import { GanttDependencies } from '../gantt-dependencies'
import { GanttEdgeChip } from '../gantt-edge-chip'
import { GanttGrid } from '../gantt-grid'
import {
  GanttHeader,
  type GanttHeaderRailCollapseSlotProps,
} from '../gantt-header'
import { GanttNowLine } from '../gantt-now-line'
import { GanttRail } from '../gantt-rail'
import { GanttRow } from '../gantt-row'
import {
  GanttToolbar,
  type GanttFilterField,
  type GanttFilterValue,
  type GanttToolbarSlotProps,
} from '../gantt-toolbar'

export type { GanttFilterField, GanttFilterValue, GanttToolbarSlotProps }

/** Collapsed title-column width (icon strip for the expand control). */
export const GANTT_COLLAPSED_RAIL_WIDTH = '2.5rem'
export const GANTT_COLLAPSED_RAIL_WIDTH_PX = 40

export interface GanttSlots {
  /**
   * Top toolbar (view-range + search + filter). Full replace via this slot;
   * nested search/filter regions live on GanttToolbar (`slots` / `slotProps` under
   * `slotProps.toolbar` or by composing `Gantt.Toolbar`).
   */
  toolbar?: React.ComponentType<GanttToolbarSlotProps>
  /** Sticky timeline header. */
  header?: React.ComponentType<React.ComponentProps<typeof GanttHeader>>
  /**
   * Title-column collapse / expand control (rendered in the header rail spacer).
   * Forwarded into `GanttHeader` `slots.railCollapse`.
   */
  railCollapse?: React.ComponentType<GanttHeaderRailCollapseSlotProps>
  /** Sticky left rail. */
  rail?: React.ComponentType<React.ComponentProps<typeof GanttRail>>
  /** One timeline row (bar + optional edge chips). */
  row?: React.ComponentType<React.ComponentProps<typeof GanttRow>>
  /** Background grid. */
  grid?: React.ComponentType<React.ComponentProps<typeof GanttGrid>>
  /** Now marker. */
  nowLine?: React.ComponentType<React.ComponentProps<typeof GanttNowLine>>
  /** Dependency SVG layer (mounted only when showDependencies is true). */
  dependencies?: React.ComponentType<React.ComponentProps<typeof GanttDependencies>>
  /** Bottom create strip (only when onCreate is provided). */
  createStrip?: React.ComponentType<React.ComponentProps<typeof GanttCreateStrip>>
  /** Empty-state content when `items` is empty. */
  empty?: React.ComponentType<{ className?: string }>
}

export interface GanttProps<T = unknown>
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'children'> {
  /** Timeline items of any domain shape. */
  items: readonly T[]
  /** Accessors mapping domain fields → Gantt geometry. Defaults to standard JSON task fields. */
  accessors?: GanttFieldAccessors<T>
  /**
   * Controlled view range when paired with `onViewRangeChange`.
   * Without a change callback, treated as the initial / uncontrolled value.
   */
  viewRange?: GanttViewRange
  /** Uncontrolled initial view range. Default: 'month'. Ignored when `viewRange` is controlled. */
  defaultViewRange?: GanttViewRange
  /** Called when the view range changes (toolbar or imperative). */
  onViewRangeChange?: (viewRange: GanttViewRange) => void
  /** Called when a bar move/resize commits new dates. */
  onItemChange?: (event: GanttItemChangeEvent<T>) => void
  /** Called when a dependency edge is added or removed. */
  onDependencyChange?: (event: GanttDependencyChangeEvent) => void
  /**
   * Called when the bottom create strip commits a new range.
   * When provided, the create strip renders automatically (fail-closed otherwise omitted).
   */
  onCreate?: (event: GanttCreateEvent) => void
  /** Disable pointer interactions. */
  readOnly?: boolean
  /** Show dependency SVG layer (independent of readOnly / onDependencyChange). Default: false. */
  showDependencies?: boolean
  /** Show toolbar (view-range + search + filter). Default: true. */
  showToolbar?: boolean
  /**
   * Controlled search string for the default toolbar.
   * Presentation only — filter `items` yourself (or use `filterGanttItems`).
   */
  searchValue?: string
  /** Search change callback. UI still renders when omitted (no-op). */
  onSearchChange?: (value: string) => void
  /** Search input placeholder. Default: 'Search…'. */
  searchPlaceholder?: string
  /**
   * Controlled filter map for the default toolbar popover.
   * Presentation only — downstream owns matching against `items`.
   */
  filters?: GanttFilterValue
  /** Filter change callback. UI still renders when omitted (no-op). */
  onFiltersChange?: (filters: GanttFilterValue) => void
  /**
   * Filter field definitions shown in the default filter popover.
   * Add a custom field by appending to this array (key/label/type[+options/getValue]).
   */
  filterFields?: readonly GanttFilterField<any>[]
  /** Show search input in the default toolbar. Default: true. */
  showSearch?: boolean
  /** Show filter trigger + popover in the default toolbar. Default: true. */
  showFilter?: boolean
  /** Sticky rail width. Default: 12rem. Ignored when showRail is false. */
  railWidth?: string | number
  /**
   * Show the sticky title/rail column. Default: true.
   * When true, overflow edge chips stay off unless showEdgeChips is forced on.
   */
  showRail?: boolean
  /**
   * Controlled collapsed state for the title/rail column.
   * When collapsed, the rail shrinks to an icon strip and bar titles render in-bar.
   */
  railCollapsed?: boolean
  /** Called when the user toggles the title-column collapse control. */
  onRailCollapsedChange?: (collapsed: boolean) => void
  /**
   * Uncontrolled initial collapsed state. When omitted, defaults to `true` on
   * mobile viewports (`useIsMobile`, 768px) and `false` on desktop — only when
   * `showRail` is true. Ignored when `railCollapsed` is controlled.
   */
  defaultRailCollapsed?: boolean
  /**
   * Show overflow edge chips when a bar is clipped by the viewport.
   * Default: false when the expanded title rail is visible; true when the rail is
   * hidden or collapsed (rail overflow arrows hide with labels). Still overridable.
   */
  showEdgeChips?: boolean
  /** Max height of the scroll viewport. */
  maxHeight?: string | number
  /** Row height in pixels (rail, rows, dependency anchors). Default: 40. */
  rowHeight?: number
  /** Anchor date for range construction. */
  anchor?: Date
  /** Inject a shared engine (never destroyed by the provider). */
  engine?: GanttEngine
  /** Custom CSS classes. */
  className?: string
  /**
   * Compound composition children rendered **inside** the scroll viewport
   * (after the default header when using the default anatomy).
   * When provided without replacing the whole shell via slots, default rows
   * are omitted — compose `Gantt.Row` / etc. yourself.
   */
  children?: React.ReactNode
  /** Slot overrides. */
  slots?: SlotComponents<GanttSlots>
  /** Slot props. */
  slotProps?: SlotPropsMap<GanttSlots>
}

function parseRailWidthPx(railWidth: string | number): number {
  if (typeof railWidth === 'number') return railWidth
  const rem = railWidth.match(/^([\d.]+)rem$/)
  if (rem) return Number(rem[1]) * 16
  const px = railWidth.match(/^([\d.]+)px$/)
  if (px) return Number(px[1])
  const n = Number.parseFloat(railWidth)
  return Number.isFinite(n) ? n : 192
}

const DefaultEmpty = ({ className }: { className?: string }) => (
  <div
    data-slot="gantt-empty"
    role="status"
    className={cn(
      'flex min-h-[8rem] w-full items-center justify-center px-space-md py-space-lg text-sm text-muted-fg',
      className
    )}
  >
    No items to display
  </div>
)

/** Inner shell that consumes provider context (must sit under GanttProvider). */
function GanttShell({
  className,
  children,
  slots,
  slotProps,
  showDependencies = false,
  showToolbar = true,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters,
  onFiltersChange,
  filterFields,
  showSearch = true,
  showFilter = true,
  railWidth = '12rem',
  showRail = true,
  railCollapsed = false,
  onRailCollapsedChange,
  showEdgeChips,
  maxHeight = '70vh',
  rowHeight = GANTT_ROW_HEIGHT,
  ...props
}: Omit<
  GanttProps,
  | 'items'
  | 'accessors'
  | 'onItemChange'
  | 'onDependencyChange'
  | 'onCreate'
  | 'viewRange'
  | 'defaultViewRange'
  | 'onViewRangeChange'
  | 'readOnly'
  | 'anchor'
  | 'defaultRailCollapsed'
  | 'engine'
>) {
  const gantt = useGantt()
  const didScrollRef = useRef(false)
  const ganttRef = useRef(gantt)
  ganttRef.current = gantt
  const [scrollTop, setScrollTop] = useState(0)
  const [bodyViewportH, setBodyViewportH] = useState(0)
  const scrollRafRef = useRef(0)

  const railWidthCss: string | number = !showRail
    ? 0
    : railCollapsed
      ? GANTT_COLLAPSED_RAIL_WIDTH
      : railWidth
  const railWidthPx = !showRail
    ? 0
    : railCollapsed
      ? GANTT_COLLAPSED_RAIL_WIDTH_PX
      : parseRailWidthPx(railWidth)
  const edgeChipsEnabled =
    showEdgeChips !== undefined ? showEdgeChips : gantt.helpers.context.showEdgeChips

  useLayoutEffect(() => {
    ganttRef.current.helpers.context.setRailWidthPx(railWidthPx)
  }, [railWidthPx])

  const setScrollerNode = (node: HTMLDivElement | null) => {
    gantt.helpers.context.scrollerRef.current = node
  }

  useEffect(() => {
    didScrollRef.current = false
  }, [gantt.state.viewRange, gantt.state.rangeStartMs])

  useEffect(() => {
    if (didScrollRef.current) return
    const el = gantt.helpers.context.scrollerRef.current
    if (!el) return
    didScrollRef.current = true
    const { nowPx } = ganttRef.current.helpers
    const viewW = Math.max(0, el.clientWidth - railWidthPx)
    const target = nowPx - viewW / 2
    el.scrollLeft = Math.max(0, target)
    ganttRef.current.actions.setViewport(el.scrollLeft, viewW)
  }, [
    gantt.state.viewRange,
    gantt.state.rangeStartMs,
    gantt.helpers.nowPx,
    gantt.helpers.columns.length,
    railWidthPx,
  ])

  useEffect(() => {
    const el = gantt.helpers.context.scrollerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const measure = () => {
      const viewW = Math.max(0, el.clientWidth - railWidthPx)
      ganttRef.current.actions.setViewport(el.scrollLeft, viewW)
      const headerEl = el.querySelector('[data-slot="gantt-header"]') as HTMLElement | null
      const headerH = headerEl?.offsetHeight ?? 0
      setBodyViewportH(Math.max(0, el.clientHeight - headerH))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [gantt.helpers.context.scrollerRef, railWidthPx])

  useEffect(() => {
    return () => {
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current)
    }
  }, [])

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const viewW = Math.max(0, el.clientWidth - railWidthPx)
    gantt.actions.setViewport(el.scrollLeft, viewW)
    if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current)
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = 0
      setScrollTop(el.scrollTop)
      const headerEl = el.querySelector('[data-slot="gantt-header"]') as HTMLElement | null
      const headerH = headerEl?.offsetHeight ?? 0
      setBodyViewportH(Math.max(0, el.clientHeight - headerH))
    })
  }

  const items = gantt.helpers.context.items
  const showCreate = gantt.helpers.context.hasOnCreate
  const useCompoundChildren = children != null

  const vertical = useMemo(
    () =>
      rowWindow(
        scrollTop,
        bodyViewportH > 0 ? bodyViewportH : 600,
        items.length,
        rowHeight,
        GANTT_ROW_OVERSCAN
      ),
    [scrollTop, bodyViewportH, items.length, rowHeight]
  )

  const visibleItems = useMemo(() => {
    if (useCompoundChildren) return [] as { item: unknown; index: number }[]
    const slice = items.slice(vertical.startIndex, vertical.endIndex)
    return slice.map((item, i) => ({ item, index: vertical.startIndex + i }))
  }, [items, vertical.startIndex, vertical.endIndex, useCompoundChildren])

  const totalBodyHeight = items.length * rowHeight
  const reduceMotion = prefersReducedMotion()

  const setViewRange = useCallback(
    (vr: GanttViewRange) => {
      gantt.actions.setViewRange(vr)
    },
    [gantt.actions]
  )

  const { role: _role, ...rootAria } = gantt.ariaProps

  return (
    <div
      data-slot="gantt"
      className={cn(
        'flex flex-col overflow-hidden rounded-macro border border-border bg-bg',
        className
      )}
      {...rootAria}
      {...props}
    >
      {showToolbar &&
        renderSlot(
          slots?.toolbar,
          {
            viewRange: gantt.state.viewRange,
            setViewRange,
            searchValue,
            onSearchChange,
            searchPlaceholder,
            filters,
            onFiltersChange,
            filterFields,
            showSearch,
            showFilter,
            ...(slotProps?.toolbar as object),
          },
          { defaultComponent: GanttToolbar }
        )}

      <div
        ref={setScrollerNode}
        data-slot="gantt-scroller"
        role="grid"
        aria-rowcount={items.length}
        aria-label={gantt.ariaProps['aria-label']}
        className="relative overflow-auto"
        style={{ maxHeight }}
        onScroll={onScroll}
      >
        {renderSlot(
          slots?.header,
          {
            ...(slotProps?.header as object),
            railWidth: showRail ? railWidthCss : 0,
            hideRailSpacer: !showRail,
            showRailCollapse: showRail,
            railCollapsed,
            onRailCollapsedChange,
            slots: {
              ...((slotProps?.header as { slots?: object } | undefined)?.slots as object),
              ...(slots?.railCollapse ? { railCollapse: slots.railCollapse } : null),
            },
          },
          { defaultComponent: GanttHeader }
        )}

        {useCompoundChildren ? (
          children
        ) : items.length === 0 ? (
          renderSlot(slots?.empty, slotProps?.empty as object, {
            defaultComponent: DefaultEmpty,
          })
        ) : (
          <div data-slot="gantt-body" className="relative flex w-max min-w-full">
            {showRail &&
              renderSlot(
                slots?.rail,
                {
                  width: railWidthCss,
                  rowHeight,
                  rowWindow: vertical,
                  totalHeight: totalBodyHeight,
                  reduceMotion,
                  ...(slotProps?.rail as object),
                },
                { defaultComponent: GanttRail }
              )}

            <div
              data-slot="gantt-timeline"
              className="relative shrink-0"
              style={{
                width: gantt.helpers.timelineWidthPx,
                minWidth: gantt.helpers.timelineWidthPx,
                height: totalBodyHeight + (showCreate ? 36 : 0),
              }}
            >
              {renderSlot(slots?.grid, slotProps?.grid as object, {
                defaultComponent: GanttGrid,
              })}
              {renderSlot(slots?.nowLine, slotProps?.nowLine as object, {
                defaultComponent: GanttNowLine,
              })}

              {/* Leading spacer for virtualized rows */}
              {vertical.offsetPx > 0 && (
                <div
                  data-slot="gantt-row-spacer-start"
                  aria-hidden
                  style={{ height: vertical.offsetPx }}
                />
              )}

              {visibleItems.map(({ item, index }) => (
                <React.Fragment key={gantt.helpers.getId(item) || `row-${index}`}>
                  {renderSlot(
                    slots?.row,
                    {
                      item,
                      index,
                      showEdgeChips: edgeChipsEnabled,
                      style: { height: rowHeight },
                      ...(slotProps?.row as object),
                    },
                    { defaultComponent: GanttRow }
                  )}
                </React.Fragment>
              ))}

              {/* Trailing spacer */}
              {(() => {
                const trailing =
                  totalBodyHeight - vertical.offsetPx - visibleItems.length * rowHeight
                return trailing > 0 ? (
                  <div
                    data-slot="gantt-row-spacer-end"
                    aria-hidden
                    style={{ height: trailing }}
                  />
                ) : null
              })()}

              {showDependencies &&
                renderSlot(
                  slots?.dependencies,
                  {
                    rowHeight,
                    rowWindow: vertical,
                    ...(slotProps?.dependencies as object),
                  },
                  { defaultComponent: GanttDependencies }
                )}
              {showCreate &&
                renderSlot(slots?.createStrip, slotProps?.createStrip as object, {
                  defaultComponent: GanttCreateStrip,
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function GanttPrimitive<T>({
  items = [],
  accessors = DEFAULT_GANTT_ACCESSORS,
  viewRange: viewRangeProp,
  defaultViewRange = 'month',
  onViewRangeChange,
  onItemChange,
  onDependencyChange,
  onCreate,
  readOnly = false,
  showDependencies = false,
  showToolbar = true,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters,
  onFiltersChange,
  filterFields,
  showSearch = true,
  showFilter = true,
  railWidth = '12rem',
  showRail = true,
  railCollapsed: railCollapsedProp,
  onRailCollapsedChange,
  defaultRailCollapsed,
  showEdgeChips,
  maxHeight = '70vh',
  rowHeight = GANTT_ROW_HEIGHT,
  anchor,
  engine,
  className,
  children,
  slots,
  slotProps,
  ...props
}: GanttProps<T>) {
  const isMobile = useIsMobile()
  const [railCollapsed, setRailCollapsed] = useControllableState<boolean>({
    prop: railCollapsedProp,
    defaultProp: defaultRailCollapsed ?? (showRail ? isMobile : false),
    onChange: onRailCollapsedChange,
  })

  const isViewRangeControlled = viewRangeProp !== undefined && onViewRangeChange != null
  const [viewRange, setViewRange] = useControllableState<GanttViewRange>({
    prop: isViewRangeControlled ? viewRangeProp : undefined,
    defaultProp: viewRangeProp ?? defaultViewRange,
    onChange: onViewRangeChange,
  })

  const effectiveCollapsed = showRail ? railCollapsed : false
  const railWidthPx = !showRail
    ? 0
    : effectiveCollapsed
      ? GANTT_COLLAPSED_RAIL_WIDTH_PX
      : parseRailWidthPx(railWidth)

  return (
    <GanttProvider
      items={items}
      accessors={accessors}
      viewRange={viewRange}
      onViewRangeChange={setViewRange}
      onItemChange={onItemChange}
      onDependencyChange={onDependencyChange}
      onCreate={onCreate}
      readOnly={readOnly}
      railWidthPx={railWidthPx}
      showRail={showRail}
      showEdgeChips={showEdgeChips}
      railCollapsed={effectiveCollapsed}
      setRailCollapsed={setRailCollapsed}
      anchor={anchor}
      engine={engine}
      dependenciesEnabled={Boolean(onDependencyChange) || showDependencies}
    >
      <GanttShell
        className={className}
        showDependencies={showDependencies}
        showToolbar={showToolbar}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
        onFiltersChange={onFiltersChange}
        filterFields={filterFields}
        showSearch={showSearch}
        showFilter={showFilter}
        railWidth={railWidth}
        showRail={showRail}
        railCollapsed={effectiveCollapsed}
        onRailCollapsedChange={setRailCollapsed}
        showEdgeChips={showEdgeChips}
        maxHeight={maxHeight}
        rowHeight={rowHeight}
        slots={slots}
        slotProps={slotProps}
        {...props}
      >
        {children}
      </GanttShell>
    </GanttProvider>
  )
}

export const Gantt = createInterfaceComponent<GanttProps, GanttSlots>(
  {
    name: 'Gantt',
    category: 'data',
    description:
      'Reusable accessors-based Gantt chart with collapsible sticky title rail, scrollable timeline, unit-aware snap move/resize, optional dependency SVG, now line, view-range + search + filter toolbar, and optional create strip — all regions slottable. Search/filter are controlled presentation; downstream owns item matching.',
    version: '1.0.0',
    props: {
      viewRange: 'month',
      readOnly: false,
      showDependencies: false,
      showToolbar: true,
      showSearch: true,
      showFilter: true,
      showRail: true,
    },
    slots: {
      toolbar: undefined,
      header: undefined,
      railCollapse: undefined,
      rail: undefined,
      row: undefined,
      grid: undefined,
      nowLine: undefined,
      dependencies: undefined,
      createStrip: undefined,
      empty: undefined,
    },
  },
  GanttPrimitive as React.ComponentType<GanttProps>
)

Gantt.Toolbar = GanttToolbar
Gantt.Header = GanttHeader
Gantt.Rail = GanttRail
Gantt.Row = GanttRow
Gantt.Bar = GanttBar
Gantt.Grid = GanttGrid
Gantt.NowLine = GanttNowLine
Gantt.Dependencies = GanttDependencies
Gantt.EdgeChip = GanttEdgeChip
Gantt.CreateStrip = GanttCreateStrip

export type GanttComponent = typeof Gantt & {
  Toolbar: typeof GanttToolbar
  Header: typeof GanttHeader
  Rail: typeof GanttRail
  Row: typeof GanttRow
  Bar: typeof GanttBar
  Grid: typeof GanttGrid
  NowLine: typeof GanttNowLine
  Dependencies: typeof GanttDependencies
  EdgeChip: typeof GanttEdgeChip
  CreateStrip: typeof GanttCreateStrip
}
