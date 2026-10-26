/**
 * @file gantt-toolbar.tsx
 * Default Gantt toolbar: controlled search, filter popover, then view-range switcher.
 *
 * Search/filter are presentation + controlled state only. Downstream owns matching —
 * filter `items` before passing them to <Gantt>, or use `filterGanttItems` as a
 * convenience helper. Replace the whole toolbar via `slots.toolbar`, or extend
 * regions via nested `slots` / `slotProps` on GanttToolbar (`viewRange`, `search`,
 * `filterTrigger`, `filterPopover`).
 */

import React, { useMemo, useState } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { FunnelIcon } from '@heroicons/react/24/outline'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { OverlayTrigger } from '../../../../core/overlay-trigger'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Button } from '../../../core/components/button'
import { Checkbox } from '../../../core/components/checkbox'
import { Popover } from '../../../core/components/popover'
import { Separator } from '../../../core/components/separator'
import type { GanttFieldAccessors, GanttViewRange } from '../../engine'

const VIEW_RANGE_OPTIONS: { value: GanttViewRange; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
]

/* ==========================================================================
   Filter / search contracts (controlled — Gantt does not invent domain matching)
   ========================================================================== */

/** Active filter map: field key → value (boolean | string | selected enum value). */
export type GanttFilterValue = Record<string, unknown>

/** Stable empty filter map — avoids new `{}` identity every render when uncontrolled. */
const EMPTY_FILTERS: GanttFilterValue = Object.freeze({})

/**
 * One filter field rendered in the default filter popover.
 * Downstream supplies fields + owns matching (or uses `filterGanttItems` + `getValue`).
 */
export interface GanttFilterField<T = unknown> {
  /** Stable key stored in `filters`. */
  key: string
  /** Human-readable label in the popover. */
  label: string
  /** Widget kind. Default: 'boolean'. */
  type?: 'boolean' | 'enum' | 'string'
  /** Enum options when type is 'enum'. */
  options?: readonly { value: string; label: string }[]
  /** Placeholder for string fields. */
  placeholder?: string
  /** Optional value extractor used by `filterGanttItems`. */
  getValue?: (item: T) => unknown
}

/**
 * Client-side helper: match items by search (label + optional extractors) and
 * active filter fields. Prefer owning this logic in the product; this helper is
 * for playgrounds and simple apps.
 */
export function filterGanttItems<T>(
  items: readonly T[],
  options: {
    searchValue?: string
    filters?: GanttFilterValue
    accessors: GanttFieldAccessors<T>
    filterFields?: readonly GanttFilterField<T>[]
    /** Extra search extractors beyond `accessors.getLabel`. */
    searchAccessors?: readonly ((item: T) => string | undefined)[]
  }
): T[] {
  const {
    searchValue = '',
    filters = {},
    accessors,
    filterFields = [],
    searchAccessors = [],
  } = options
  const q = searchValue.trim().toLowerCase()

  return items.filter((item) => {
    if (q) {
      const haystacks: string[] = []
      const label = accessors.getLabel?.(item)
      if (label) haystacks.push(label)
      for (const get of searchAccessors) {
        const v = get(item)
        if (v) haystacks.push(v)
      }
      if (haystacks.length === 0 || !haystacks.some((h) => h.toLowerCase().includes(q))) {
        return false
      }
    }

    for (const field of filterFields) {
      const active = filters[field.key]
      if (active == null || active === '' || active === false) continue
      const raw = field.getValue?.(item)
      const type = field.type ?? 'boolean'
      if (type === 'boolean') {
        if (Boolean(raw) !== true) return false
      } else if (type === 'enum') {
        if (String(raw ?? '') !== String(active)) return false
      } else if (type === 'string') {
        if (!String(raw ?? '')
          .toLowerCase()
          .includes(String(active).toLowerCase())) {
          return false
        }
      }
    }

    return true
  })
}

/* ==========================================================================
   Nested slot prop interfaces
   ========================================================================== */

export interface GanttToolbarViewRangeOptionProps {
  /** Range label shown on the button. */
  label: string
  /** Whether this range is the active selection. */
  isActive: boolean
  /** Select this range. */
  onSelect?: () => void
}

function GanttToolbarViewRangeOption({ label, isActive, onSelect }: GanttToolbarViewRangeOptionProps) {
  return (
    <button
      type="button"
      data-active={isActive || undefined}
      className={cn(
        'rounded-micro px-space-sm py-space-xs text-xs font-medium transition-colors',
        isActive ? 'bg-primary text-primary-fg' : 'bg-secondary text-fg hover:bg-secondary/80'
      )}
      onClick={onSelect}
    >
      {label}
    </button>
  )
}

export interface GanttToolbarViewRangeSlots {
  /** Swappable view-range option button. */
  option?: React.ComponentType<GanttToolbarViewRangeOptionProps>
}

export interface GanttToolbarViewRangeProps {
  /** Active view range. */
  viewRange: GanttViewRange
  /** Change view range. */
  setViewRange: (viewRange: GanttViewRange) => void
  /** Custom CSS classes. */
  className?: string
  /** Slot component overrides. */
  slots?: SlotComponents<GanttToolbarViewRangeSlots>
  /** Slot prop overrides. */
  slotProps?: SlotPropsMap<GanttToolbarViewRangeSlots>
}

export interface GanttToolbarSearchProps {
  /** Controlled search string. */
  value?: string
  /** Search change callback (optional — no-op when omitted). */
  onChange?: (value: string) => void
  /** Input placeholder. */
  placeholder?: string
  /** Custom CSS classes on the wrapper. */
  className?: string
}

export interface GanttToolbarFilterTriggerProps {
  /** Number of active (truthy) filters — shown as a badge when > 0. */
  activeCount?: number
  /** Accessible label. */
  'aria-label'?: string
  /** Custom CSS classes. */
  className?: string
  /** Children override (icon + optional label). */
  children?: React.ReactNode
}

export interface GanttToolbarFilterPopoverProps {
  /** Field definitions for the default filter UI. */
  filterFields?: readonly GanttFilterField[]
  /** Controlled filter map. */
  filters?: GanttFilterValue
  /** Filter change callback (optional — no-op when omitted). */
  onFiltersChange?: (filters: GanttFilterValue) => void
  /** Custom CSS classes on the popover body. */
  className?: string
}

export interface GanttToolbarSlots {
  /** View-range button group (Day / Week / Month / Quarter). */
  viewRange?: React.ComponentType<GanttToolbarViewRangeProps>
  /** Search input region. */
  search?: React.ComponentType<GanttToolbarSearchProps>
  /** Filter icon / trigger button (inside OverlayTrigger). */
  filterTrigger?: React.ComponentType<GanttToolbarFilterTriggerProps>
  /** Filter popover body (field widgets). */
  filterPopover?: React.ComponentType<GanttToolbarFilterPopoverProps>
}

/**
 * Props passed into `slots.toolbar` (and consumed by DefaultToolbar / GanttToolbar).
 * Search/filter are controlled presentation — downstream filters `items` itself.
 */
export interface GanttToolbarSlotProps {
  /** Active view range. */
  viewRange: GanttViewRange
  /** Change view range. */
  setViewRange: (viewRange: GanttViewRange) => void
  /** Controlled search string. */
  searchValue?: string
  /** Search change. Optional — UI still renders; no-ops when omitted. */
  onSearchChange?: (value: string) => void
  /** Search input placeholder. */
  searchPlaceholder?: string
  /** Controlled filter map. */
  filters?: GanttFilterValue
  /** Filter change. Optional — UI still renders; no-ops when omitted. */
  onFiltersChange?: (filters: GanttFilterValue) => void
  /** Fields rendered in the default filter popover. */
  filterFields?: readonly GanttFilterField[]
  /** Show search input. Default: true. */
  showSearch?: boolean
  /** Show filter trigger + popover. Default: true. */
  showFilter?: boolean
  /** Nested slot overrides for toolbar regions. */
  slots?: SlotComponents<GanttToolbarSlots>
  /** Nested slot props for toolbar regions. */
  slotProps?: SlotPropsMap<GanttToolbarSlots>
  /** Custom CSS classes on the toolbar root. */
  className?: string
}

export interface GanttToolbarProps extends GanttToolbarSlotProps {
  /** Nested slot overrides for toolbar regions. */
  slots?: SlotComponents<GanttToolbarSlots>
  /** Nested slot props for toolbar regions. */
  slotProps?: SlotPropsMap<GanttToolbarSlots>
  /** Compound children. Replaces the default toolbar regions when provided. */
  children?: React.ReactNode
}

/* ==========================================================================
   Default nested occupants
   ========================================================================== */

function GanttToolbarViewRangePrimitive({
  viewRange,
  setViewRange,
  className,
  slots,
  slotProps,
}: GanttToolbarViewRangeProps) {
  return (
    <div
      data-slot="gantt-toolbar-view-range"
      className={cn('flex shrink-0 items-center gap-space-xs', className)}
    >
      {VIEW_RANGE_OPTIONS.map((opt) => (
        <React.Fragment key={opt.value}>
          {renderSlot(
            slots?.option,
            {
              label: opt.label,
              isActive: viewRange === opt.value,
              onSelect: () => setViewRange(opt.value),
              ...(slotProps?.option as object),
            },
            { defaultComponent: GanttToolbarViewRangeOption }
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export const GanttToolbarViewRange = createInterfaceComponent<
  GanttToolbarViewRangeProps,
  GanttToolbarViewRangeSlots
>(
  {
    name: 'GanttToolbarViewRange',
    category: 'data',
    description: 'View-range switcher buttons for the Gantt toolbar.',
    version: '1.0.0',
    slots: {
      option: GanttToolbarViewRangeOption,
    },
  },
  GanttToolbarViewRangePrimitive
)

function GanttToolbarSearchPrimitive({
  value: valueProp,
  onChange,
  placeholder = 'Search…',
  className,
}: GanttToolbarSearchProps) {
  // Controlled when onChange is wired (typical). Without it, keep a local value so the
  // input is not a frozen controlled field — filtering still no-ops until the product
  // owns matching via onSearchChange + filtered `items`.
  const isControlled = onChange != null
  const [uncontrolled, setUncontrolled] = useState(valueProp ?? '')
  const value = isControlled ? (valueProp ?? '') : uncontrolled
  const setValue = (next: string) => {
    if (isControlled) onChange?.(next)
    else setUncontrolled(next)
  }

  return (
    <div
      data-slot="gantt-toolbar-search"
      className={cn('relative w-40 max-w-xs shrink-0', className)}
    >
      <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-fg" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Search gantt items"
        className={cn(
          'h-8 w-full rounded-base border border-border bg-bg pl-8 pr-8 text-xs text-fg',
          'placeholder:text-muted-fg focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary'
        )}
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setValue('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-atom p-0.5 text-muted-fg hover:text-fg"
        >
          <XMarkIcon className="size-3.5" />
        </button>
      ) : null}
    </div>
  )
}

export const GanttToolbarSearch = createInterfaceComponent<GanttToolbarSearchProps>(
  {
    name: 'GanttToolbarSearch',
    category: 'data',
    description: 'Controlled search input for the Gantt toolbar (presentation only).',
    version: '1.0.0',
  },
  GanttToolbarSearchPrimitive
)

function GanttToolbarFilterTriggerPrimitive({
  activeCount = 0,
  className,
  children,
  'aria-label': ariaLabel = 'Filter items',
}: GanttToolbarFilterTriggerProps) {
  return (
    <Button
      intent="plain"
      size="sq-sm"
      aria-label={ariaLabel}
      data-slot="gantt-toolbar-filter-trigger"
      className={cn(
        'relative rounded-base border border-border bg-bg text-fg hover:bg-muted/40',
        className
      )}
    >
      {children ?? <FunnelIcon className="size-3.5 text-muted-fg" />}
      {activeCount > 0 ? (
        <span className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-fg">
          {activeCount}
        </span>
      ) : null}
    </Button>
  )
}

export const GanttToolbarFilterTrigger = createInterfaceComponent<GanttToolbarFilterTriggerProps>(
  {
    name: 'GanttToolbarFilterTrigger',
    category: 'data',
    description: 'Filter icon button that opens the Gantt filter popover.',
    version: '1.0.0',
  },
  GanttToolbarFilterTriggerPrimitive
)

function setFilterKey(
  filters: GanttFilterValue,
  key: string,
  value: unknown,
  onFiltersChange?: (filters: GanttFilterValue) => void
) {
  const next = { ...filters }
  if (value == null || value === '' || value === false) {
    delete next[key]
  } else {
    next[key] = value
  }
  onFiltersChange?.(next)
}

function GanttToolbarFilterPopoverPrimitive({
  filterFields = [],
  filters = {},
  onFiltersChange,
  className,
}: GanttToolbarFilterPopoverProps) {
  const activeCount = useMemo(
    () => Object.values(filters).filter((v) => v != null && v !== '' && v !== false).length,
    [filters]
  )

  return (
    <div
      data-slot="gantt-toolbar-filter-popover"
      className={cn('flex flex-col gap-2.5', className)}
    >
      <div className="text-xs font-semibold text-fg">Filters</div>
      <Separator />
      {filterFields.length === 0 ? (
        <p className="m-0 text-xs text-muted-fg">
          No filter fields configured. Pass{' '}
          <code className="text-[10px]">filterFields</code> on Gantt / toolbar, or replace this
          region via <code className="text-[10px]">slots.filterPopover</code>. Matching stays in
          the product — filter <code className="text-[10px]">items</code> before render.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filterFields.map((field) => {
            const type = field.type ?? 'boolean'
            const current = filters[field.key]

            if (type === 'boolean') {
              return (
                <Checkbox
                  key={field.key}
                  isSelected={Boolean(current)}
                  onChange={(checked: boolean) =>
                    setFilterKey(filters, field.key, checked, onFiltersChange)
                  }
                  className="text-xs"
                >
                  {field.label}
                </Checkbox>
              )
            }

            if (type === 'enum') {
              return (
                <label key={field.key} className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-fg">{field.label}</span>
                  <select
                    value={current == null ? '' : String(current)}
                    onChange={(e) =>
                      setFilterKey(filters, field.key, e.target.value || undefined, onFiltersChange)
                    }
                    className="h-8 w-full rounded-base border border-border bg-bg px-2 text-xs text-fg focus:border-primary focus:outline-hidden"
                  >
                    <option value="">Any</option>
                    {(field.options ?? []).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              )
            }

            return (
              <label key={field.key} className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-fg">{field.label}</span>
                <input
                  type="text"
                  value={current == null ? '' : String(current)}
                  placeholder={field.placeholder ?? `Filter ${field.label.toLowerCase()}…`}
                  onChange={(e) =>
                    setFilterKey(filters, field.key, e.target.value, onFiltersChange)
                  }
                  className="h-8 w-full rounded-base border border-border bg-bg px-2.5 text-xs text-fg placeholder:text-muted-fg focus:border-primary focus:outline-hidden"
                />
              </label>
            )
          })}
        </div>
      )}
      {activeCount > 0 ? (
        <Button
          intent="plain"
          size="sm"
          className="mt-0.5 w-full justify-center text-xs"
          onClick={() => onFiltersChange?.({})}
        >
          Clear filters
        </Button>
      ) : null}
    </div>
  )
}

export const GanttToolbarFilterPopover = createInterfaceComponent<GanttToolbarFilterPopoverProps>(
  {
    name: 'GanttToolbarFilterPopover',
    category: 'data',
    description: 'Filter field widgets inside the Gantt toolbar popover (controlled).',
    version: '1.0.0',
  },
  GanttToolbarFilterPopoverPrimitive
)

/* ==========================================================================
   Toolbar root
   ========================================================================== */

function GanttToolbarPrimitive({
  viewRange,
  setViewRange,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters: filtersProp,
  onFiltersChange,
  filterFields = [],
  showSearch = true,
  showFilter = true,
  slots = {},
  slotProps = {},
  className,
  children,
}: GanttToolbarProps) {
  // Controlled when onFiltersChange is wired. Without it, keep local draft state so
  // checkboxes/selects do not snap back — matching still no-ops until the product
  // owns filtering via onFiltersChange + filtered `items`.
  const filtersControlled = onFiltersChange != null
  const [uncontrolledFilters, setUncontrolledFilters] = useState<GanttFilterValue>(
    () => filtersProp ?? EMPTY_FILTERS
  )
  const filters = filtersControlled ? (filtersProp ?? EMPTY_FILTERS) : uncontrolledFilters
  const setFilters = (next: GanttFilterValue) => {
    if (filtersControlled) onFiltersChange?.(next)
    else setUncontrolledFilters(next)
  }

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((v) => v != null && v !== '' && v !== false).length,
    [filters]
  )

  return (
    <div
      data-slot="gantt-toolbar"
      className={cn(
        'flex w-full min-w-0 flex-nowrap items-center gap-space-sm overflow-x-auto overflow-y-hidden overscroll-x-contain scrollbar-none border-b border-border px-space-md py-space-sm',
        className
      )}
    >
      {children != null ? (
        children
      ) : (
      <>
      <div className="flex shrink-0 flex-nowrap items-center gap-space-sm">
        {showSearch &&
          renderSlot(
            slots.search,
            {
              value: searchValue,
              onChange: onSearchChange,
              placeholder: searchPlaceholder,
              ...(slotProps.search as object),
            },
            { defaultComponent: GanttToolbarSearch }
          )}

        {showFilter && (
          <OverlayTrigger>
            {renderSlot(
              slots.filterTrigger,
              {
                activeCount: activeFilterCount,
                ...(slotProps.filterTrigger as object),
              },
              { defaultComponent: GanttToolbarFilterTrigger }
            )}
            <Popover size="auto" className="w-64 p-3" placement="bottom start">
              {renderSlot(
                slots.filterPopover,
                {
                  filterFields,
                  filters,
                  onFiltersChange: setFilters,
                  ...(slotProps.filterPopover as object),
                },
                { defaultComponent: GanttToolbarFilterPopover }
              )}
            </Popover>
          </OverlayTrigger>
        )}
      </div>

      {renderSlot(
        slots.viewRange,
        {
          viewRange,
          setViewRange,
          ...(slotProps.viewRange as object),
        },
        { defaultComponent: GanttToolbarViewRange }
      )}
      </>
      )}
    </div>
  )
}

export const GanttToolbar = createInterfaceComponent<GanttToolbarProps, GanttToolbarSlots>(
  {
    name: 'GanttToolbar',
    category: 'data',
    description:
      'Gantt toolbar with controlled search, filter popover, and view-range switcher (single non-wrapping row; scrolls horizontally when needed). Search/filter are presentation-only; downstream owns item matching.',
    version: '1.0.0',
    props: {
      showSearch: true,
      showFilter: true,
      searchPlaceholder: 'Search…',
    },
    slots: {
      viewRange: GanttToolbarViewRange,
      search: GanttToolbarSearch,
      filterTrigger: GanttToolbarFilterTrigger,
      filterPopover: GanttToolbarFilterPopover,
    },
  },
  GanttToolbarPrimitive
)

GanttToolbar.ViewRange = GanttToolbarViewRange
GanttToolbar.Search = GanttToolbarSearch
GanttToolbar.FilterTrigger = GanttToolbarFilterTrigger
GanttToolbar.FilterPopover = GanttToolbarFilterPopover

export type GanttToolbarComponent = typeof GanttToolbar & {
  ViewRange: typeof GanttToolbarViewRange
  Search: typeof GanttToolbarSearch
  FilterTrigger: typeof GanttToolbarFilterTrigger
  FilterPopover: typeof GanttToolbarFilterPopover
}
