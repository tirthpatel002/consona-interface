/**
 * @file gantt.tsx
 * Gantt root family — provider shell, toolbar (view-range + search + filter), sticky rail + timeline.
 * Fail-closed defaults (Rule C8): zero children renders a complete interactive chart.
 *
 * Search/filter on the default toolbar are controlled presentation only — downstream owns
 * matching (filter `items` before passing, or use `filterGanttItems`). Replace the whole
 * toolbar via `slots.toolbar`; extend fields/regions via Gantt props or nested toolbar slots.
 */

import React, { useEffect, useLayoutEffect, useRef } from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { useControllableState } from '../../../../core/hooks'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { useIsMobile } from '../../../../hooks/use-mobile'
import { DEFAULT_GANTT_ACCESSORS, GanttProvider } from '../../context'
import type {
  GanttCreateEvent,
  GanttDependencyChangeEvent,
  GanttFieldAccessors,
  GanttItemChangeEvent,
  GanttViewRange,
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
}

export interface GanttProps<T = unknown>
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'children'> {
  /** Timeline items of any domain shape. */
  items: readonly T[]
  /** Accessors mapping domain fields → Gantt geometry. Defaults to standard JSON task fields (`id`, `start`, `end`, `label`, `color`, `dependencies`). */
  accessors?: GanttFieldAccessors<T>
  /** Controlled or initial view range. Default: 'month'. */
  viewRange?: GanttViewRange
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
  /** Anchor date for range construction. */
  anchor?: Date
  /** Custom CSS classes. */
  className?: string
  /**
   * Compound composition children. When omitted, the default anatomy renders
   * (toolbar + header + rail + rows + grid + now line + optional create strip).
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
  ...props
}: Omit<
  GanttProps,
  | 'items'
  | 'accessors'
  | 'onItemChange'
  | 'onDependencyChange'
  | 'onCreate'
  | 'viewRange'
  | 'readOnly'
  | 'anchor'
  | 'defaultRailCollapsed'
>) {
  const gantt = useGantt()
  const didScrollRef = useRef(false)
  // Keep latest actions/helpers without putting the whole hook return in effect deps
  // (that identity changes on every engine snapshot and re-triggered setScrollLeft loops).
  const ganttRef = useRef(gantt)
  ganttRef.current = gantt

  // Expanded width vs collapsed icon strip (header keeps the expand control reachable).
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
  // Resolve chip policy: explicit prop > context (provider already applied showRail default).
  const edgeChipsEnabled =
    showEdgeChips !== undefined
      ? showEdgeChips
      : gantt.helpers.context.showEdgeChips

  // Publish measured rail width for viewport math (edge chips).
  useLayoutEffect(() => {
    ganttRef.current.helpers.context.setRailWidthPx(railWidthPx)
  }, [railWidthPx])

  // Bind scroller element into context ref for scrollToPx / edge chips.
  const setScrollerNode = (node: HTMLDivElement | null) => {
    gantt.helpers.context.scrollerRef.current = node
  }

  // Scroll now into view once per viewRange / range rebuild
  useEffect(() => {
    didScrollRef.current = false
  }, [gantt.state.viewRange, gantt.state.rangeStartMs])

  useEffect(() => {
    if (didScrollRef.current) return
    const el = gantt.helpers.context.scrollerRef.current
    if (!el) return
    // Mark before any engine write so a sync scroll event cannot re-enter.
    didScrollRef.current = true
    const { nowPx } = ganttRef.current.helpers
    const viewW = Math.max(0, el.clientWidth - railWidthPx)
    const target = nowPx - viewW / 2
    el.scrollLeft = Math.max(0, target)
    ganttRef.current.actions.setViewport(el.scrollLeft, viewW)
  }, [gantt.state.viewRange, gantt.state.rangeStartMs, gantt.helpers.nowPx, gantt.helpers.columns.length, railWidthPx])

  // Keep viewportWidth in sync on resize
  useEffect(() => {
    const el = gantt.helpers.context.scrollerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => {
      const viewW = Math.max(0, el.clientWidth - railWidthPx)
      ganttRef.current.actions.setViewport(el.scrollLeft, viewW)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [gantt.helpers.context.scrollerRef, railWidthPx])

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const viewW = Math.max(0, el.clientWidth - railWidthPx)
    gantt.actions.setViewport(el.scrollLeft, viewW)
  }

  const items = gantt.helpers.context.items
  // Mount when consumer passed onCreate (prop presence). CreateStrip self-gates on canCreate/readOnly.
  // Do NOT use Boolean(ctx.onCreate): useCallbackRef always returns a function.
  const showCreate = gantt.helpers.context.hasOnCreate

  return (
    <div
      data-slot="gantt"
      className={cn(
        'flex flex-col overflow-hidden rounded-macro border border-border bg-bg',
        className
      )}
      {...gantt.ariaProps}
      {...props}
    >
      {showToolbar &&
        renderSlot(
          slots?.toolbar,
          {
            viewRange: gantt.state.viewRange,
            setViewRange: (vr: GanttViewRange) => gantt.actions.setViewRange(vr),
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

      {children != null ? (
        children
      ) : (
        <div
          ref={setScrollerNode}
          data-slot="gantt-scroller"
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
                ...((slotProps?.header as { slots?: object } | undefined)?.slots as
                  object),
                ...(slots?.railCollapse ? { railCollapse: slots.railCollapse } : null),
              },
            },
            { defaultComponent: GanttHeader }
          )}

          <div data-slot="gantt-body" className="relative flex w-max min-w-full">
            {showRail &&
              renderSlot(
                slots?.rail,
                { width: railWidthCss, ...(slotProps?.rail as object) },
                { defaultComponent: GanttRail }
              )}

            <div
              data-slot="gantt-timeline"
              className="relative shrink-0"
              style={{
                width: gantt.helpers.timelineWidthPx,
                minWidth: gantt.helpers.timelineWidthPx,
              }}
            >
              {renderSlot(slots?.grid, slotProps?.grid as object, {
                defaultComponent: GanttGrid,
              })}
              {renderSlot(slots?.nowLine, slotProps?.nowLine as object, {
                defaultComponent: GanttNowLine,
              })}
              {items.map((item, index) => (
                <React.Fragment key={gantt.helpers.getId(item)}>
                  {renderSlot(
                    slots?.row,
                    {
                      item,
                      index,
                      showEdgeChips: edgeChipsEnabled,
                      ...(slotProps?.row as object),
                    },
                    { defaultComponent: GanttRow }
                  )}
                </React.Fragment>
              ))}
              {/* showDependencies alone mounts the layer; readOnly only gates edit dots. */}
              {showDependencies &&
                renderSlot(slots?.dependencies, slotProps?.dependencies as object, {
                  defaultComponent: GanttDependencies,
                })}
              {showCreate &&
                renderSlot(slots?.createStrip, slotProps?.createStrip as object, {
                  defaultComponent: GanttCreateStrip,
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function GanttPrimitive<T>({
  items = [],
  accessors = DEFAULT_GANTT_ACCESSORS,
  viewRange = 'month',
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
  anchor,
  className,
  children,
  slots,
  slotProps,
  ...props
}: GanttProps<T>) {
  const isMobile = useIsMobile()
  // Uncontrolled default: mobile → collapsed; desktop → expanded. Explicit
  // defaultRailCollapsed / controlled railCollapsed always win; user toggles stick.
  const [railCollapsed, setRailCollapsed] = useControllableState<boolean>({
    prop: railCollapsedProp,
    defaultProp: defaultRailCollapsed ?? (showRail ? isMobile : false),
    onChange: onRailCollapsedChange,
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
      'Reusable accessors-based Gantt chart with collapsible sticky title rail (mobile defaults collapsed), scrollable timeline, unit-aware snap move/resize, in-bar titles when the rail is collapsed or off, optional overflow edge chips (off while the expanded title rail is visible; on when collapsed or rail off), hover datetime labels, dependency SVG (showDependencies), connection dots (onDependencyChange && !readOnly), now line, view-range + search + filter toolbar, and optional create strip — all regions slottable for downstream overrides. Search/filter are controlled presentation; downstream owns item matching.',
    version: '1.4.0',
    props: {
      viewRange: 'month',
      readOnly: false,
      showDependencies: false,
      showToolbar: true,
      showSearch: true,
      showFilter: true,
      showRail: true,
      // showEdgeChips defaults: on when !showRail || railCollapsed
      // railCollapsed defaults from useIsMobile (768px) when showRail
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
    },
  },
  GanttPrimitive as React.ComponentType<GanttProps>
)

// Compound attachments (Rule C6 / C8 — same parts as slot defaults)
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
