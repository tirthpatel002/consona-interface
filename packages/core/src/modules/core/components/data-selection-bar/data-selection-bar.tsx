import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react'
import {
  ArrowDownIcon,
  ArrowsUpDownIcon,
  ArrowUpIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { OverlayTrigger } from '../../../../core/overlay-trigger'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Badge, type BadgeProps } from '../badge'
import { Button, type ButtonProps } from '../button'
import { NativeSelectContent } from '../native-select'
import { Popover, type PopoverProps } from '../popover'
import { Separator } from '../separator'

/* ==========================================================================
   Field & Query Configuration Types
   ========================================================================== */

export type FieldType = 'string' | 'number' | 'date' | 'boolean' | 'enum' | 'array'

export type SortDirection = 'asc' | 'desc' | null

export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'between'
  | 'in'
  | 'notIn'
  | 'containsAny'
  | 'containsAll'
  | 'isEmpty'
  | 'isNotEmpty'

export interface FieldDefinition<T = any> {
  /** Unique key for the field (supports nested dot-paths like "user.address.city"). */
  key: string
  /** Display label for the field. */
  label: string
  /** Data type classification. */
  type: FieldType
  /** Whether this field is indexed for searching. */
  searchable?: boolean
  /** Whether this field can be filtered. */
  filterable?: boolean
  /** Whether this field can be sorted. */
  sortable?: boolean
  /** Whether this field appears as a quick category filter. */
  category?: boolean
  /** Value options for enum fields. */
  enumValues?: readonly (string | number)[]
  /** Custom search evaluator function. */
  searchFn?: (value: any, searchTerm: string, item: T) => boolean
  /** Custom filter evaluator function. */
  filterFn?: (value: any, filterValue: any, operator: FilterOperator, item: T) => boolean
  /** Value formatter for badge/preview rendering. */
  formatValue?: (value: any) => string
  /** Custom value getter for deep or computed extraction. */
  getValue?: (item: T) => any
}

export interface FilterConfig {
  /** Target field key. */
  field: string
  /** Comparison operator. */
  operator: FilterOperator
  /** Filter target value or array of values. */
  value: any
  /** Human-readable field label. */
  label?: string
}

export interface SortConfig {
  /** Target field key. */
  field: string
  /** Active sort direction. */
  direction: SortDirection
}

export interface CategoryConfig {
  /** Target field key. */
  field: string
  /** Selected category value. */
  value: any
  /** Human-readable field label. */
  label?: string
}

/* ==========================================================================
   Internal Path & Search Utilities
   ========================================================================== */

function resolveNestedValue(obj: any, path: string): any {
  if (!obj || typeof obj !== 'object' || !path) return undefined
  if (!path.includes('.') && !path.includes('[') && path in obj) {
    return obj[path]
  }

  const parts = path.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '').split('.')
  let current = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = current[part]
  }
  return current
}

function searchAnywhere(obj: any, query: string): boolean {
  if (obj == null) return false
  if (typeof obj === 'string' || typeof obj === 'number') {
    return String(obj).toLowerCase().includes(query)
  }
  if (Array.isArray(obj)) {
    return obj.some((item) => searchAnywhere(item, query))
  }
  if (typeof obj === 'object') {
    return Object.values(obj).some((val) => searchAnywhere(val, query))
  }
  return false
}

/* ==========================================================================
   DataSelectionBar Context & Types
   ========================================================================== */

export interface DataSelectionBarState<T = any> {
  data: T[]
  fields: FieldDefinition<T>[]
  categories?: FieldDefinition<T>[]
  filteredData: T[]
  searchTerm: string
  debouncedSearch: string
  filters: FilterConfig[]
  category: CategoryConfig | null
  sortConfig: SortConfig | null
  filterableFields: FieldDefinition<T>[]
  categoryFields: FieldDefinition<T>[]
  sortableFields: FieldDefinition<T>[]
  searchPlaceholder: string
  showSearch: boolean
  showFilters: boolean
  showCategory: boolean
  showSort: boolean
  extraActions?: ReactNode
}

export interface DataSelectionBarActionHandlers<T = any> {
  setSearchTerm: (term: string) => void
  addFilter: (fieldKey: string, operator: FilterOperator, value: any) => void
  removeFilter: (fieldKey: string) => void
  clearAllFilters: () => void
  handleCategoryChange: (fieldKey: string, value: any) => void
  handleSortToggle: (fieldKey: string) => void
  getFieldDefinition: (key: string) => FieldDefinition<T> | undefined
  getFieldValue: (item: T, field: FieldDefinition<T>) => any
  formatFieldValue: (field: FieldDefinition<T>, value: any) => string
  getUniqueFieldValues: (field: FieldDefinition<T>) => any[]
  renderFilterValue?: (field: FieldDefinition<T>, value: any) => ReactNode
  renderCategoryValue?: (field: FieldDefinition<T>, value: any) => ReactNode
}

export interface DataSelectionBarContextValue<T = any> {
  state: DataSelectionBarState<T>
  actions: DataSelectionBarActionHandlers<T>
  slots: SlotComponents<DataSelectionBarSlots>
  slotProps: SlotPropsMap<DataSelectionBarSlots>
}

export const DataSelectionBarContext = createContext<DataSelectionBarContextValue<any> | null>(null)

export function useDataSelectionBar<T = any>(): DataSelectionBarContextValue<T> | null {
  return useContext(DataSelectionBarContext)
}

export const DataSelectionBarProvider = DataSelectionBarContext.Provider
export const useDataSelectionBarContext = useDataSelectionBar

/* ==========================================================================
   DataSelectionBar Slots & Props
   ========================================================================== */

export interface DataSelectionBarSearchProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Placeholder string. */
  placeholder?: string
  /** Controlled value override. */
  value?: string
  /** Change callback override. */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  /** Wrapper container class. */
  wrapperClassName?: string
}

export interface DataSelectionBarCategorySelectProps extends HTMLAttributes<HTMLDivElement> {
  /** Specific category field to render. If omitted, renders all category fields. */
  field?: FieldDefinition<any>
}

export interface DataSelectionBarFilterBuilderProps extends HTMLAttributes<HTMLDivElement> {
  /** Popover trigger label. */
  triggerLabel?: string
  /** Custom popover classes. */
  popoverClassName?: string
}

export interface DataSelectionBarSortMenuProps extends HTMLAttributes<HTMLDivElement> {
  /** Popover trigger label. */
  triggerLabel?: string
  /** Custom popover classes. */
  popoverClassName?: string
}

export interface DataSelectionBarFilterBadgeProps extends BadgeProps {
  /** Target filter configuration. */
  filter?: FilterConfig
  /** Remove callback override. */
  onRemove?: () => void
}

export interface DataSelectionBarFilterStripSlots {
  /** Injected filter badge component. */
  filterBadge?: React.ComponentType<DataSelectionBarFilterBadgeProps>
  /** Injected clear all button component. */
  clearButton?: React.ComponentType<ButtonProps>
}

export interface DataSelectionBarFilterStripProps extends HTMLAttributes<HTMLDivElement> {
  /** Custom label text. */
  label?: string
  /** Custom clear all button text. */
  clearLabel?: string
  /** Slot overrides map. */
  slots?: SlotComponents<DataSelectionBarFilterStripSlots>
  /** Property overrides passed down to injected slots. */
  slotProps?: SlotPropsMap<DataSelectionBarFilterStripSlots>
}

export interface DataSelectionBarActionsProps extends HTMLAttributes<HTMLDivElement> {
  /** Actions content. */
  children?: ReactNode
}

export interface DataSelectionBarSlots {
  /** Search input field slot. */
  search?: React.ComponentType<DataSelectionBarSearchProps>
  /** Category selector dropdown slot. */
  categorySelect?: React.ComponentType<DataSelectionBarCategorySelectProps>
  /** Filter popover builder slot. */
  filterBuilder?: React.ComponentType<DataSelectionBarFilterBuilderProps>
  /** Sort popover menu slot. */
  sortMenu?: React.ComponentType<DataSelectionBarSortMenuProps>
  /** Active filter badge token slot. */
  filterBadge?: React.ComponentType<DataSelectionBarFilterBadgeProps>
  /** Active filter strip container slot. */
  filterStrip?: React.ComponentType<DataSelectionBarFilterStripProps>
  /** Clear all filters action button slot. */
  clearButton?: React.ComponentType<ButtonProps>
  /** Extra toolbar actions container slot. */
  extraActions?: React.ComponentType<DataSelectionBarActionsProps>
}

export interface DataSelectionBarProps<T = any>
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'slots' | 'slotProps' | 'children'> {
  /** Array of raw dataset records. */
  data: T[]
  /** Field schema definitions describing fields, types, and searchability. */
  fields: FieldDefinition<T>[]
  /** Optional custom child composition (using compound components or render prop). When omitted, renders default selection bar layout. */
  children?: ReactNode | ((context: DataSelectionBarContextValue<T>) => ReactNode)
  /** Optional explicit category fields list (defaults to fields with category: true). */
  categories?: FieldDefinition<T>[]
  /** Callback fired when filtered, searched, and sorted records change. */
  onDataChange?: (filteredData: T[]) => void
  /** Alias callback for onDataChange. */
  onFilteredDataChange?: (filteredData: T[]) => void
  /** Callback fired when search query changes. */
  onSearchChange?: (searchTerm: string) => void
  /** Alias for onSearchChange. */
  onSearch?: (searchTerm: string) => void
  /** Callback fired when filter query changes. */
  onFilterChange?: (filters: FilterConfig[]) => void
  /** Alias for onFilterChange. */
  onFiltersChange?: (filters: FilterConfig[]) => void
  /** Callback fired when category selection changes. */
  onCategoryChange?: (category: CategoryConfig | null) => void
  /** Callback fired when sort configuration changes. */
  onSortChange?: (sort: SortConfig | null) => void
  /** Initial search input value. */
  initialSearch?: string
  /** Initial active filter rules. */
  initialFilters?: FilterConfig[]
  /** Initial active category. */
  initialCategory?: CategoryConfig | null
  /** Initial active sorting rule. */
  initialSort?: SortConfig | null
  /** Search input placeholder string. */
  searchPlaceholder?: string
  /** Whether to render the search input bar. @default true */
  showSearch?: boolean
  /** Whether to render the filter popover trigger. @default true */
  showFilters?: boolean
  /** Whether to render the category selector. @default true */
  showCategory?: boolean
  /** Whether to render the sort popover trigger. @default true */
  showSort?: boolean
  /** Search input debounce delay in ms. @default 250 */
  searchDebounceMs?: number
  /** Custom render function for filter values in badges. */
  renderFilterValue?: (field: FieldDefinition<T>, value: any) => ReactNode
  /** Custom render function for category selector values. */
  renderCategoryValue?: (field: FieldDefinition<T>, value: any) => ReactNode
  /** Additional custom actions on the right side of the toolbar. */
  extraActions?: ReactNode
  /** Injected slot component overrides. */
  slots?: SlotComponents<DataSelectionBarSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<DataSelectionBarSlots>
}

/* ==========================================================================
   Compound Sub-Components
   ========================================================================== */

/* --- 1. DataSelectionBarSearch --- */
const DataSelectionBarSearchPrimitive = ({
  value: propValue,
  onChange: propOnChange,
  placeholder: propPlaceholder,
  className,
  wrapperClassName,
  ...props
}: DataSelectionBarSearchProps) => {
  const ctx = useDataSelectionBar()
  const value = propValue !== undefined ? propValue : (ctx?.state.searchTerm ?? '')
  const placeholder = propPlaceholder ?? ctx?.state.searchPlaceholder ?? 'Search records...'
  const onChange = propOnChange ?? ((e: React.ChangeEvent<HTMLInputElement>) => ctx?.actions.setSearchTerm(e.target.value))

  return (
    <div className={cn('relative min-w-50 flex-1', wrapperClassName)}>
      <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-fg" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          'h-9 w-full rounded-base border border-border bg-bg pl-9 pr-3 text-xs text-fg placeholder:text-muted-fg focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary',
          className
        )}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => ctx?.actions.setSearchTerm('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-atom p-0.5 text-muted-fg hover:text-fg cursor-pointer"
        >
          <XMarkIcon className="size-3.5" />
        </button>
      )}
    </div>
  )
}

export const DataSelectionBarSearch = createInterfaceComponent<DataSelectionBarSearchProps>(
  {
    name: 'DataSelectionBarSearch',
    category: 'data',
    description: 'Context-connected search input with clear trigger for DataSelectionBar.',
    version: '1.0.0',
  },
  DataSelectionBarSearchPrimitive
)

/* --- 2. DataSelectionBarCategorySelect --- */
const DataSelectionBarCategorySelectPrimitive = ({
  field: propField,
  className,
  ...props
}: DataSelectionBarCategorySelectProps) => {
  const ctx = useDataSelectionBar()
  if (!ctx) return null

  const categoryFields = propField ? [propField] : ctx.state.categoryFields
  if (categoryFields.length === 0) return null

  return (
    <div className={cn('flex items-center gap-1.5', className)} {...props}>
      {categoryFields.map((catField) => {
        const uniqueVals = ctx.actions.getUniqueFieldValues(catField)
        const activeVal = ctx.state.category?.field === catField.key ? ctx.state.category.value : ''

        return (
          <div key={catField.key} className="flex items-center">
            <NativeSelectContent
              value={activeVal}
              onChange={(e) => ctx.actions.handleCategoryChange(catField.key, e.target.value)}
              className="h-9 rounded-base border-border bg-bg py-0 pl-2.5 pr-7 text-xs font-medium text-fg"
            >
              <option value="">All {catField.label}s</option>
              {uniqueVals.map((val) => (
                <option key={String(val)} value={String(val)}>
                  {ctx.actions.renderCategoryValue
                    ? ctx.actions.renderCategoryValue(catField, val)
                    : ctx.actions.formatFieldValue(catField, val)}
                </option>
              ))}
            </NativeSelectContent>
          </div>
        )
      })}
    </div>
  )
}

export const DataSelectionBarCategorySelect = createInterfaceComponent<DataSelectionBarCategorySelectProps>(
  {
    name: 'DataSelectionBarCategorySelect',
    category: 'data',
    description: 'Category dropdown switcher for instant faceted data filtering.',
    version: '1.0.0',
  },
  DataSelectionBarCategorySelectPrimitive
)

/* --- 3. DataSelectionBarFilterBuilder --- */
const DataSelectionBarFilterBuilderPrimitive = ({
  triggerLabel = 'Filter',
  popoverClassName,
  className,
  children,
  ...props
}: DataSelectionBarFilterBuilderProps) => {
  const ctx = useDataSelectionBar()
  const filterableFields = ctx?.state.filterableFields ?? []
  const [selectedFieldKey, setSelectedFieldKey] = useState<string>('')
  const [selectedOperator, setSelectedOperator] = useState<FilterOperator>('equals')
  const [filterInputValue, setFilterInputValue] = useState<any>('')

  useEffect(() => {
    if (!selectedFieldKey && filterableFields.length > 0) {
      setSelectedFieldKey(filterableFields[0]?.key || '')
    }
  }, [filterableFields, selectedFieldKey])

  if (!ctx || filterableFields.length === 0) return null
  const filtersCount = ctx.state.filters.length

  return (
    <div className={cn('inline-flex', className)} {...props}>
      <OverlayTrigger>
        <Button
          intent="plain"
          className="inline-flex h-9 items-center gap-1.5 rounded-base border border-border bg-bg px-3 text-xs font-medium text-fg hover:bg-muted/40 transition-colors"
        >
          <FunnelIcon className="size-3.5 text-muted-fg" />
          <span>{triggerLabel}</span>
          {filtersCount > 0 && (
            <Badge intent="primary" className="size-4 p-0 text-xs justify-center rounded-full">
              {filtersCount}
            </Badge>
          )}
        </Button>
        <Popover className={cn('w-72 p-3', popoverClassName)}>
          <div className="flex flex-col gap-2.5">
            <div className="text-xs font-semibold text-fg">Add Filter Rule</div>
            <Separator />

            {/* Field selector */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-fg">Field</label>
              <NativeSelectContent
                size="sm"
                value={selectedFieldKey}
                onChange={(e) => setSelectedFieldKey(e.target.value)}
              >
                {filterableFields.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </NativeSelectContent>
            </div>

            {/* Operator selector */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-fg">Condition</label>
              <NativeSelectContent
                size="sm"
                value={selectedOperator}
                onChange={(e) => setSelectedOperator(e.target.value as FilterOperator)}
              >
                <option value="equals">Equals</option>
                <option value="notEquals">Does not equal</option>
                <option value="contains">Contains</option>
                <option value="notContains">Does not contain</option>
                <option value="startsWith">Starts with</option>
                <option value="endsWith">Ends with</option>
                <option value="greaterThan">Greater than</option>
                <option value="lessThan">Less than</option>
                <option value="isEmpty">Is empty</option>
                <option value="isNotEmpty">Is not empty</option>
              </NativeSelectContent>
            </div>

            {/* Value input */}
            {selectedOperator !== 'isEmpty' && selectedOperator !== 'isNotEmpty' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-fg">Value</label>
                <input
                  type="text"
                  value={filterInputValue}
                  onChange={(e) => setFilterInputValue(e.target.value)}
                  placeholder="Enter value..."
                  className="h-8 w-full rounded-base border border-border bg-bg px-2.5 text-xs text-fg placeholder:text-muted-fg focus:border-primary focus:outline-hidden"
                />
              </div>
            )}

            <Button
              intent="primary"
              size="sm"
              onClick={() => {
                if (!selectedFieldKey) return
                ctx.actions.addFilter(selectedFieldKey, selectedOperator, filterInputValue)
                setFilterInputValue('')
              }}
              className="mt-1 w-full justify-center text-xs"
            >
              Apply Filter
            </Button>
          </div>
        </Popover>
      </OverlayTrigger>
    </div>
  )
}

export const DataSelectionBarFilterBuilder = createInterfaceComponent<DataSelectionBarFilterBuilderProps>(
  {
    name: 'DataSelectionBarFilterBuilder',
    category: 'data',
    description: 'Interactive condition and operator query rule builder for DataSelectionBar.',
    version: '1.0.0',
  },
  DataSelectionBarFilterBuilderPrimitive
)

/* --- 4. DataSelectionBarSortMenu --- */
const DataSelectionBarSortMenuPrimitive = ({
  triggerLabel = 'Sort',
  popoverClassName,
  className,
  ...props
}: DataSelectionBarSortMenuProps) => {
  const ctx = useDataSelectionBar()
  const sortableFields = ctx?.state.sortableFields ?? []
  if (!ctx || sortableFields.length === 0) return null

  const sortConfig = ctx.state.sortConfig
  const activeSortLabel = sortConfig ? ctx.actions.getFieldDefinition(sortConfig.field)?.label : null

  return (
    <div className={cn('inline-flex', className)} {...props}>
      <OverlayTrigger>
        <Button
          intent="plain"
          className="inline-flex h-9 items-center gap-1.5 rounded-base border border-border bg-bg px-3 text-xs font-medium text-fg hover:bg-muted/40 transition-colors"
        >
          <ArrowsUpDownIcon className="size-3.5 text-muted-fg" />
          <span>{triggerLabel}</span>
          {activeSortLabel && <span className="text-primary font-semibold">{activeSortLabel}</span>}
        </Button>
        <Popover className={cn('w-56 p-2', popoverClassName)}>
          <div className="flex flex-col gap-1 text-xs">
            <div className="px-2 py-1 font-semibold text-fg text-xs">Sort By Field</div>
            <Separator className="my-1" />
            {sortableFields.map((f) => {
              const isSorted = sortConfig?.field === f.key
              const dir = isSorted ? sortConfig.direction : null

              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => ctx.actions.handleSortToggle(f.key)}
                  className={cn(
                    'flex items-center justify-between rounded-atom px-2.5 py-1.5 text-left text-xs hover:bg-muted/50 transition-colors cursor-pointer',
                    isSorted && 'bg-primary/10 text-primary font-medium'
                  )}
                >
                  <span>{f.label}</span>
                  {dir === 'asc' && <ArrowUpIcon className="size-3.5 text-primary" />}
                  {dir === 'desc' && <ArrowDownIcon className="size-3.5 text-primary" />}
                </button>
              )
            })}
          </div>
        </Popover>
      </OverlayTrigger>
    </div>
  )
}

export const DataSelectionBarSortMenu = createInterfaceComponent<DataSelectionBarSortMenuProps>(
  {
    name: 'DataSelectionBarSortMenu',
    category: 'data',
    description: 'Multi-field sorting popover menu with ascending and descending direction indicators.',
    version: '1.0.0',
  },
  DataSelectionBarSortMenuPrimitive
)

/* --- 5. DataSelectionBarActions --- */
const DataSelectionBarActionsPrimitive = ({
  className,
  children,
  ...props
}: DataSelectionBarActionsProps) => {
  const ctx = useDataSelectionBar()
  const content = children || ctx?.state.extraActions
  if (!content) return null

  return (
    <div data-slot="actions" className={cn('flex items-center gap-2 ml-auto', className)} {...props}>
      {content}
    </div>
  )
}

export const DataSelectionBarActions = createInterfaceComponent<DataSelectionBarActionsProps>(
  {
    name: 'DataSelectionBarActions',
    category: 'data',
    description: 'Custom toolbar action buttons container in DataSelectionBar.',
    version: '1.0.0',
  },
  DataSelectionBarActionsPrimitive
)

/* --- 6. DataSelectionBarFilterBadge --- */
const DataSelectionBarFilterBadgePrimitive = ({
  filter,
  onRemove,
  className,
  ...props
}: DataSelectionBarFilterBadgeProps) => {
  const ctx = useDataSelectionBar()
  if (!filter || !ctx) return null

  const field = ctx.actions.getFieldDefinition(filter.field)
  const label = field?.label || filter.field
  const valueStr =
    ctx.actions.renderFilterValue && field
      ? ctx.actions.renderFilterValue(field, filter.value)
      : String(filter.value)

  return (
    <Badge
      intent="secondary"
      className={cn('inline-flex items-center gap-1.5 rounded-micro pl-2 pr-1 py-0.5 text-xs font-normal', className)}
      {...props}
    >
      <span>
        <strong className="font-semibold text-fg">{label}</strong> {filter.operator}{' '}
        {filter.operator !== 'isEmpty' && filter.operator !== 'isNotEmpty' && (
          <span className="text-fg">{valueStr}</span>
        )}
      </span>
      <button
        type="button"
        onClick={() => onRemove?.() ?? ctx.actions.removeFilter(filter.field)}
        className="rounded-full p-0.5 hover:bg-muted text-muted-fg hover:text-fg cursor-pointer"
      >
        <XMarkIcon className="size-3" />
      </button>
    </Badge>
  )
}

export const DataSelectionBarFilterBadge = createInterfaceComponent<DataSelectionBarFilterBadgeProps>(
  {
    name: 'DataSelectionBarFilterBadge',
    category: 'data',
    description: 'Removable filter badge token representing an active filter rule.',
    version: '1.0.0',
  },
  DataSelectionBarFilterBadgePrimitive
)

/* --- 7. DataSelectionBarFilterStrip --- */
const DataSelectionBarFilterStripPrimitive = ({
  label = 'Filters:',
  clearLabel = 'Clear all',
  className,
  children,
  slots = {},
  slotProps = {},
  ...props
}: DataSelectionBarFilterStripProps) => {
  const ctx = useDataSelectionBar()
  const filters = ctx?.state.filters ?? []
  if (!children && filters.length === 0) return null

  return (
    <div data-slot="filter-strip" className={cn('flex flex-wrap items-center gap-1.5 pt-1', className)} {...props}>
      {children || (
        <>
          <span className="text-xs font-medium text-muted-fg">{label}</span>
          {filters.map((f) =>
            slots.filterBadge ? (
              renderSlot(slots.filterBadge, {
                ...slotProps.filterBadge,
                filter: f,
                onRemove: () => ctx?.actions.removeFilter(f.field),
              })
            ) : (
              <DataSelectionBarFilterBadge key={f.field} filter={f} />
            )
          )}
          {slots.clearButton ? (
            renderSlot(slots.clearButton, {
              ...slotProps.clearButton,
              onPress: () => ctx?.actions.clearAllFilters(),
              children: clearLabel,
            })
          ) : (
            <button
              type="button"
              onClick={() => ctx?.actions.clearAllFilters()}
              className="text-xs font-medium text-muted-fg hover:text-danger ml-1 underline cursor-pointer"
            >
              {clearLabel}
            </button>
          )}
        </>
      )}
    </div>
  )
}

export const DataSelectionBarFilterStrip = createInterfaceComponent<
  DataSelectionBarFilterStripProps,
  DataSelectionBarFilterStripSlots
>(
  {
    name: 'DataSelectionBarFilterStrip',
    category: 'data',
    description: 'Horizontal active filter pills container with clear all trigger.',
    version: '1.0.0',
    slots: {
      filterBadge: DataSelectionBarFilterBadge,
      clearButton: undefined,
    },
  },
  DataSelectionBarFilterStripPrimitive
)

/* ==========================================================================
   DataSelectionBar Root Primitive Component
   ========================================================================== */

const DataSelectionBarPrimitive = <T extends Record<string, any>>({
  data = [],
  fields = [],
  categories: explicitCategories,
  children,
  onDataChange,
  onFilteredDataChange,
  onSearchChange,
  onSearch,
  onFilterChange,
  onFiltersChange,
  onCategoryChange: onCategoryChangeProp,
  onSortChange: onSortChangeProp,
  initialSearch = '',
  initialFilters = [],
  initialCategory = null,
  initialSort = null,
  searchPlaceholder = 'Search records...',
  showSearch = true,
  showFilters = true,
  showCategory = true,
  showSort = true,
  searchDebounceMs = 250,
  className,
  renderFilterValue,
  renderCategoryValue,
  extraActions,
  slots = {},
  slotProps = {},
  ...props
}: DataSelectionBarProps<T>) => {
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch)
  const [filters, setFilters] = useState<FilterConfig[]>(initialFilters)
  const [category, setCategory] = useState<CategoryConfig | null>(initialCategory)
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(initialSort)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      onSearchChange?.(searchTerm)
      onSearch?.(searchTerm)
    }, searchDebounceMs)
    return () => clearTimeout(timer)
  }, [searchTerm, searchDebounceMs, onSearchChange, onSearch])

  // Get field definition by key
  const getFieldDefinition = useCallback(
    (key: string): FieldDefinition<T> | undefined => {
      return (
        fields.find((f) => f.key === key) ??
        explicitCategories?.find((f) => f.key === key)
      )
    },
    [fields, explicitCategories]
  )

  // Extract field value from an item
  const getFieldValue = useCallback(
    (item: T, field: FieldDefinition<T>): any => {
      if (field.getValue) {
        return field.getValue(item)
      }
      return resolveNestedValue(item, field.key)
    },
    []
  )

  // Format value for display
  const formatFieldValue = useCallback(
    (field: FieldDefinition<T>, value: any): string => {
      if (field.formatValue) {
        return field.formatValue(value)
      }
      if (value === null || value === undefined) {
        return ''
      }
      if (field.type === 'date') {
        const d = value instanceof Date ? value : new Date(value)
        return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString()
      }
      if (field.type === 'boolean') {
        return value ? 'Yes' : 'No'
      }
      if (Array.isArray(value)) {
        return value.join(', ')
      }
      return String(value)
    },
    []
  )

  // Search evaluator
  const matchesSearch = useCallback(
    (item: T): boolean => {
      if (!debouncedSearch.trim()) return true

      const query = debouncedSearch.toLowerCase().trim()
      const searchableFields = fields.filter((f) => f.searchable !== false)
      const targetFields = searchableFields.length > 0 ? searchableFields : fields

      const matchedInFields = targetFields.some((field) => {
        const val = getFieldValue(item, field)
        if (val === null || val === undefined) return false

        if (field.searchFn) {
          return field.searchFn(val, debouncedSearch, item)
        }

        if (Array.isArray(val)) {
          return val.some((v) => String(v).toLowerCase().includes(query))
        }

        return String(val).toLowerCase().includes(query)
      })

      if (matchedInFields) return true
      return searchAnywhere(item, query)
    },
    [debouncedSearch, fields, getFieldValue]
  )

  // Filter evaluator
  const matchesFilters = useCallback(
    (item: T): boolean => {
      if (filters.length === 0) return true

      return filters.every((filter) => {
        const field = getFieldDefinition(filter.field)
        if (!field || field.filterable === false) return true

        const val = getFieldValue(item, field)

        if (field.filterFn) {
          return field.filterFn(val, filter.value, filter.operator, item)
        }

        switch (filter.operator) {
          case 'isEmpty':
            return val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0)
          case 'isNotEmpty':
            return val !== null && val !== undefined && val !== '' && (!Array.isArray(val) || val.length > 0)
          case 'equals':
            return String(val).toLowerCase() === String(filter.value).toLowerCase()
          case 'notEquals':
            return String(val).toLowerCase() !== String(filter.value).toLowerCase()
          case 'contains':
            if (Array.isArray(val)) {
              return val.some((v) => String(v).toLowerCase().includes(String(filter.value).toLowerCase()))
            }
            return String(val).toLowerCase().includes(String(filter.value).toLowerCase())
          case 'notContains':
            if (Array.isArray(val)) {
              return !val.some((v) => String(v).toLowerCase().includes(String(filter.value).toLowerCase()))
            }
            return !String(val).toLowerCase().includes(String(filter.value).toLowerCase())
          case 'startsWith':
            return String(val).toLowerCase().startsWith(String(filter.value).toLowerCase())
          case 'endsWith':
            return String(val).toLowerCase().endsWith(String(filter.value).toLowerCase())
          case 'greaterThan':
            return Number(val) > Number(filter.value)
          case 'lessThan':
            return Number(val) < Number(filter.value)
          case 'greaterThanOrEqual':
            return Number(val) >= Number(filter.value)
          case 'lessThanOrEqual':
            return Number(val) <= Number(filter.value)
          case 'between': {
            if (!Array.isArray(filter.value) || filter.value.length < 2) return true
            const [min, max] = filter.value
            const num = Number(val)
            if (min !== '' && min !== null && min !== undefined && num < Number(min)) return false
            if (max !== '' && max !== null && max !== undefined && num > Number(max)) return false
            return true
          }
          case 'in':
          case 'containsAny': {
            const list = Array.isArray(filter.value) ? filter.value : [filter.value]
            const strList = list.map((l) => String(l).toLowerCase())
            if (Array.isArray(val)) {
              return val.some((v) => strList.includes(String(v).toLowerCase()))
            }
            return strList.includes(String(val).toLowerCase())
          }
          case 'notIn': {
            const list = Array.isArray(filter.value) ? filter.value : [filter.value]
            const strList = list.map((l) => String(l).toLowerCase())
            if (Array.isArray(val)) {
              return !val.some((v) => strList.includes(String(v).toLowerCase()))
            }
            return !strList.includes(String(val).toLowerCase())
          }
          case 'containsAll': {
            const list = Array.isArray(filter.value) ? filter.value : [filter.value]
            if (!Array.isArray(val)) return false
            const strVal = val.map((v) => String(v).toLowerCase())
            return list.every((itemToFind) => strVal.includes(String(itemToFind).toLowerCase()))
          }
          default:
            return true
        }
      })
    },
    [filters, getFieldDefinition, getFieldValue]
  )

  // Category evaluator
  const matchesCategory = useCallback(
    (item: T): boolean => {
      if (!category || category.value === '' || category.value === null || category.value === undefined) {
        return true
      }

      const field = getFieldDefinition(category.field)
      if (!field) return true

      const val = getFieldValue(item, field)
      if (val === null || val === undefined) return false

      if (Array.isArray(val)) {
        return val.some((v) => String(v).toLowerCase() === String(category.value).toLowerCase())
      }
      return String(val).toLowerCase() === String(category.value).toLowerCase()
    },
    [category, getFieldDefinition, getFieldValue]
  )

  // Sorting evaluator
  const sortData = useCallback(
    (items: T[]): T[] => {
      if (!sortConfig || !sortConfig.direction) return items

      const field = getFieldDefinition(sortConfig.field)
      if (!field || field.sortable === false) return items

      return [...items].sort((a, b) => {
        const aVal = getFieldValue(a, field)
        const bVal = getFieldValue(b, field)

        if (aVal == null && bVal == null) return 0
        if (aVal == null) return 1
        if (bVal == null) return -1

        let comparison = 0
        if (field.type === 'number') {
          comparison = Number(aVal) - Number(bVal)
        } else if (field.type === 'date') {
          const aDate = aVal instanceof Date ? aVal : new Date(aVal)
          const bDate = bVal instanceof Date ? bVal : new Date(bVal)
          comparison = aDate.getTime() - bDate.getTime()
        } else if (field.type === 'boolean') {
          comparison = (aVal === bVal ? 0 : aVal ? -1 : 1)
        } else {
          comparison = String(aVal).localeCompare(String(bVal), undefined, {
            numeric: true,
            sensitivity: 'base',
          })
        }

        return sortConfig.direction === 'desc' ? -comparison : comparison
      })
    },
    [sortConfig, getFieldDefinition, getFieldValue]
  )

  // Process data pipeline
  const filteredData = useMemo(() => {
    const result = data.filter((item) => {
      return matchesSearch(item) && matchesFilters(item) && matchesCategory(item)
    })
    return sortData(result)
  }, [data, matchesSearch, matchesFilters, matchesCategory, sortData])

  // Broadcast data changes to parent
  useEffect(() => {
    onDataChange?.(filteredData)
    onFilteredDataChange?.(filteredData)
  }, [filteredData, onDataChange, onFilteredDataChange])

  // Filter actions
  const addFilter = useCallback(
    (fieldKey: string, operator: FilterOperator, value: any) => {
      const field = getFieldDefinition(fieldKey)
      if (!field || field.filterable === false) return

      setFilters((prev) => {
        const next = prev.filter((f) => f.field !== fieldKey)
        const updated = [...next, { field: fieldKey, operator, value, label: field.label }]
        onFilterChange?.(updated)
        onFiltersChange?.(updated)
        return updated
      })
    },
    [getFieldDefinition, onFilterChange, onFiltersChange]
  )

  const removeFilter = useCallback(
    (fieldKey: string) => {
      setFilters((prev) => {
        const next = prev.filter((f) => f.field !== fieldKey)
        onFilterChange?.(next)
        onFiltersChange?.(next)
        return next
      })
    },
    [onFilterChange, onFiltersChange]
  )

  const clearAllFilters = useCallback(() => {
    setFilters([])
    onFilterChange?.([])
    onFiltersChange?.([])
  }, [onFilterChange, onFiltersChange])

  // Category change
  const handleCategoryChange = useCallback(
    (fieldKey: string, value: any) => {
      const field = getFieldDefinition(fieldKey)
      if (!field) return

      if (value === '' || value === null || value === undefined) {
        setCategory(null)
        onCategoryChangeProp?.(null)
      } else {
        const next = { field: fieldKey, value, label: field.label }
        setCategory(next)
        onCategoryChangeProp?.(next)
      }
    },
    [getFieldDefinition, onCategoryChangeProp]
  )

  // Sort cycle
  const handleSortToggle = useCallback(
    (fieldKey: string) => {
      const field = getFieldDefinition(fieldKey)
      if (!field || field.sortable === false) return

      setSortConfig((prev) => {
        let next: SortConfig | null = null
        if (prev?.field === fieldKey) {
          if (prev.direction === 'asc') next = { field: fieldKey, direction: 'desc' }
          else if (prev.direction === 'desc') next = null
        } else {
          next = { field: fieldKey, direction: 'asc' }
        }
        onSortChangeProp?.(next)
        return next
      })
    },
    [getFieldDefinition, onSortChangeProp]
  )

  const filterableFields = useMemo(
    () => fields.filter((f) => f.filterable !== false),
    [fields]
  )
  const categoryFields = useMemo(() => {
    if (explicitCategories && explicitCategories.length > 0) return explicitCategories
    return fields.filter((f) => f.category)
  }, [fields, explicitCategories])

  const sortableFields = useMemo(
    () => fields.filter((f) => f.sortable !== false),
    [fields]
  )

  // Unique values for enum / category dropdowns
  const getUniqueFieldValues = useCallback(
    (field: FieldDefinition<T>): any[] => {
      if (field.enumValues) return [...field.enumValues]
      const set = new Set<any>()
      data.forEach((item) => {
        const val = getFieldValue(item, field)
        if (val !== null && val !== undefined && val !== '') {
          if (Array.isArray(val)) {
            val.forEach((v) => set.add(v))
          } else {
            set.add(val)
          }
        }
      })
      return Array.from(set).sort()
    },
    [data, getFieldValue]
  )

  const contextValue = useMemo<DataSelectionBarContextValue<T>>(
    () => ({
      state: {
        data,
        fields,
        categories: explicitCategories,
        filteredData,
        searchTerm,
        debouncedSearch,
        filters,
        category,
        sortConfig,
        filterableFields,
        categoryFields,
        sortableFields,
        searchPlaceholder,
        showSearch,
        showFilters,
        showCategory,
        showSort,
        extraActions,
      },
      actions: {
        setSearchTerm,
        addFilter,
        removeFilter,
        clearAllFilters,
        handleCategoryChange,
        handleSortToggle,
        getFieldDefinition,
        getFieldValue,
        formatFieldValue,
        getUniqueFieldValues,
        renderFilterValue,
        renderCategoryValue,
      },
      slots,
      slotProps,
    }),
    [
      data,
      fields,
      explicitCategories,
      filteredData,
      searchTerm,
      debouncedSearch,
      filters,
      category,
      sortConfig,
      filterableFields,
      categoryFields,
      sortableFields,
      searchPlaceholder,
      showSearch,
      showFilters,
      showCategory,
      showSort,
      extraActions,
      addFilter,
      removeFilter,
      clearAllFilters,
      handleCategoryChange,
      handleSortToggle,
      getFieldDefinition,
      getFieldValue,
      formatFieldValue,
      getUniqueFieldValues,
      renderFilterValue,
      renderCategoryValue,
      slots,
      slotProps,
    ]
  )

  return (
    <DataSelectionBarContext.Provider value={contextValue}>
      <div
        data-slot="data-selection-bar"
        className={cn(
          'flex flex-col gap-2.5 rounded-macro border border-border bg-bg/80 p-3 shadow-xs backdrop-blur-md sm:p-3.5',
          className
        )}
        {...props}
      >
        {children ? (
          typeof children === 'function' ? (
            children(contextValue)
          ) : (
            children
          )
        ) : (
          <>
            {/* Top action row */}
            <div className="flex flex-wrap items-center gap-2">
              {showSearch &&
                (slots.search ? (
                  renderSlot(slots.search, slotProps?.search)
                ) : (
                  <DataSelectionBarSearch />
                ))}

              {showCategory && categoryFields.length > 0 &&
                (slots.categorySelect ? (
                  renderSlot(slots.categorySelect, slotProps?.categorySelect)
                ) : (
                  <DataSelectionBarCategorySelect />
                ))}

              {showFilters && filterableFields.length > 0 &&
                (slots.filterBuilder ? (
                  renderSlot(slots.filterBuilder, slotProps?.filterBuilder)
                ) : (
                  <DataSelectionBarFilterBuilder />
                ))}

              {showSort && sortableFields.length > 0 &&
                (slots.sortMenu ? (
                  renderSlot(slots.sortMenu, slotProps?.sortMenu)
                ) : (
                  <DataSelectionBarSortMenu />
                ))}

              {slots.extraActions ? (
                renderSlot(slots.extraActions, slotProps?.extraActions)
              ) : (
                <DataSelectionBarActions />
              )}
            </div>

            {/* Active filters token strip */}
            {slots.filterStrip ? (
              renderSlot(slots.filterStrip, slotProps?.filterStrip)
            ) : (
              <DataSelectionBarFilterStrip />
            )}
          </>
        )}
      </div>
    </DataSelectionBarContext.Provider>
  )
}

export const DataSelectionBar = createInterfaceComponent<
  DataSelectionBarProps<any>,
  DataSelectionBarSlots
>(
  {
    name: 'DataSelectionBar',
    category: 'data',
    description: 'Universal data toolbar with search debouncing, structured query filter builder, category pills, and multi-field sorting.',
    version: '1.0.0',
    props: {
      showSearch: true,
      showFilters: true,
      showCategory: true,
      showSort: true,
      searchDebounceMs: 250,
    },
    slots: {
      search: DataSelectionBarSearch,
      categorySelect: DataSelectionBarCategorySelect,
      filterBuilder: DataSelectionBarFilterBuilder,
      sortMenu: DataSelectionBarSortMenu,
      filterBadge: DataSelectionBarFilterBadge,
      filterStrip: DataSelectionBarFilterStrip,
      clearButton: undefined,
      extraActions: undefined,
    },
  },
  DataSelectionBarPrimitive as any
)

// Compound Subcomponent Attachments
DataSelectionBar.Provider = DataSelectionBarProvider
DataSelectionBar.Search = DataSelectionBarSearch
DataSelectionBar.CategorySelect = DataSelectionBarCategorySelect
DataSelectionBar.Categories = DataSelectionBarCategorySelect
DataSelectionBar.FilterBuilder = DataSelectionBarFilterBuilder
DataSelectionBar.Filter = DataSelectionBarFilterBuilder
DataSelectionBar.SortMenu = DataSelectionBarSortMenu
DataSelectionBar.Sort = DataSelectionBarSortMenu
DataSelectionBar.FilterStrip = DataSelectionBarFilterStrip
DataSelectionBar.FilterBadge = DataSelectionBarFilterBadge
DataSelectionBar.Actions = DataSelectionBarActions

