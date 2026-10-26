import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react'
import {
  ArrowsUpDownIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  EllipsisVerticalIcon,
  EyeSlashIcon,
  LockClosedIcon,
  LockOpenIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ViewColumnsIcon,
} from '@heroicons/react/20/solid'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { OverlayTrigger } from '../../../../core/overlay-trigger'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Badge, type BadgeProps } from '../badge'
import { Button, type ButtonProps } from '../button'
import { Checkbox, CheckboxField } from '../checkbox'
import { NativeSelectContent } from '../native-select'
import { Popover, type PopoverProps } from '../popover'
import { Separator } from '../separator'
import { Loader, type LoaderProps } from '../loader'

/* ==========================================================================
   DataTable Column & Option Types
   ========================================================================== */

export type DataTableSortDirection = 'asc' | 'desc' | null

export interface RowOption<T = any> {
  /** Label text for the row action item. */
  label: string
  /** Optional icon displayed before the label. */
  icon?: ReactNode
  /** Click event handler receiving the clicked row data. */
  onClick: (row: T) => void
  /** Whether the option is disabled. */
  disabled?: boolean
  /** Visual intent variant. */
  variant?: 'default' | 'destructive'
}

export interface ColumnOption {
  /** Label text for the column action item. */
  label: string
  /** Optional icon displayed before the label. */
  icon?: ReactNode
  /** Click event handler receiving the target column ID. */
  onClick: (columnId: string) => void
  /** Whether the option is disabled. */
  disabled?: boolean
  /** Visual intent variant. */
  variant?: 'default' | 'destructive'
}

export interface DataTableColumn<T = any> {
  /** Unique ID for column. */
  id: string
  /** Column header text or render node. */
  header: ReactNode
  /** Nested dot-path (e.g. "user.email") or field key. */
  accessorKey?: string | keyof T
  /** Custom accessor function to extract value from row. */
  accessorFn?: (row: T) => any
  /** Custom cell render function. */
  cell?: (row: T, index: number) => ReactNode
  /** Enable column sorting @default true. */
  sortable?: boolean
  /** Enable column filtering/searching @default true. */
  filterable?: boolean
  /** Allow column to be hidden via column visibility menu @default true. */
  enableHiding?: boolean
  /** Default width (number in px or CSS string). */
  width?: number | string
  /** Minimum width in px @default 60. */
  minWidth?: number
  /** Maximum width in px. */
  maxWidth?: number
  /** Enable interactive column width resizing @default true. */
  resizable?: boolean
  /** Freeze / pin column to edge @default false. */
  freeze?: boolean
  /** Freeze alignment side @default 'left'. */
  freezeAlign?: 'left' | 'right'
  /** Glassmorphic blur background for frozen columns @default false. */
  freezeGlassBg?: boolean
  /** Text alignment in column cells. */
  align?: 'left' | 'center' | 'right'
}

/* ==========================================================================
   Internal Helpers
   ========================================================================== */

export function resolveRowValue(row: any, key?: string | number | symbol, fn?: (row: any) => any): any {
  if (fn) return fn(row)
  if (!key || !row) return undefined
  const strKey = String(key)
  if (strKey in row) return row[strKey]

  const parts = strKey.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '').split('.')
  let current = row
  for (const part of parts) {
    if (current == null) return undefined
    current = current[part]
  }
  return current
}

const PinSolidIcon = ({ className }: { className?: string }) => {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
    </svg>
  )
}

const PinOutlineIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.89A2 2 0 0 1 15 10.76V6h1a1 1 0 0 0 0-2H8a1 1 0 0 0 0 2h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.89A2 2 0 0 0 5 15.24Z" />
    </svg>
  )
}

export function getCellBgClass(isSelected: boolean, isPinned: boolean, isStriped: boolean) {
  if (isSelected) {
    return 'bg-bg [background-color:color-mix(in_srgb,var(--color-primary)_8%,var(--color-bg))] group-hover:[background-color:color-mix(in_srgb,var(--color-primary)_12%,var(--color-bg))]'
  }
  if (isPinned) {
    return 'bg-bg [background-color:color-mix(in_srgb,var(--color-accent)_60%,var(--color-bg))] group-hover:[background-color:color-mix(in_srgb,var(--color-accent)_80%,var(--color-bg))]'
  }
  if (isStriped) {
    return 'bg-bg [background-color:color-mix(in_srgb,var(--color-muted)_40%,var(--color-bg))] group-hover:[background-color:color-mix(in_srgb,var(--color-muted)_60%,var(--color-bg))]'
  }
  return 'bg-bg [background-color:var(--color-bg)] group-hover:[background-color:color-mix(in_srgb,var(--color-muted)_20%,var(--color-bg))]'
}

/* ==========================================================================
   DataTable Context & Types
   ========================================================================== */

export interface DataTableState<T = any> {
  data: T[]
  columns: DataTableColumn<T>[]
  visibleColumns: DataTableColumn<T>[]
  leftFrozenColumns: DataTableColumn<T>[]
  regularColumns: DataTableColumn<T>[]
  rightFrozenColumns: DataTableColumn<T>[]
  searchedData: T[]
  sortedData: T[]
  paginatedData: T[]
  searchTerm: string
  sortColumn: string | null
  sortDirection: DataTableSortDirection
  currentPage: number
  totalPages: number
  pageSize: number
  pageSizeOptions: number[]
  rowSelection: Record<string, boolean>
  selectedRowsList: T[]
  isAllPageSelected: boolean
  isSomePageSelected: boolean
  columnVisibility: Record<string, boolean>
  columnFreezeState: Record<string, boolean>
  columnWidths: Record<string, number>
  pinnedRows: Set<string>
  resizingCol: string | null
  totalTableWidth: number
  enableRowSelection: boolean
  enableSelection: boolean
  enableRowPinning: boolean
  optionsColumn: boolean
  hasOptionsCol: boolean
  loading: boolean
  striped: boolean
  bordered: boolean
  hoverable: boolean
  compact: boolean
  searchable: boolean
  searchPlaceholder: string
  showColumnVisibility: boolean
  pagination: boolean
  enablePagination: boolean
  height?: number | string
  bodyHeight?: number | string
  maxHeight?: number | string
  minHeight?: number | string
  emptyState?: ReactNode
  toolbarActions?: ReactNode
}

export interface DataTableActions<T = any> {
  setSearchTerm: (term: string) => void
  setCurrentPage: (page: number) => void
  setPageSize: (size: number) => void
  toggleSort: (colId: string) => void
  toggleSelectAll: (checked: boolean) => void
  toggleSelectRow: (row: T, index: number, checked: boolean) => void
  togglePinRow: (row: T, index: number) => void
  toggleFreezeColumn: (colId: string) => void
  setColumnVisibility: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  startResize: (e: MouseEvent, colId: string, currentWidth: number) => void
  getStickyStyle: (col: DataTableColumn<T>, isHeader?: boolean) => CSSProperties
  getRowId: (row: T, index: number) => string
  onRowClick?: (row: T, index: number) => void
  effectiveRowOptions?: (row: T) => RowOption<T>[]
  effectiveColumnOptions?: (columnId: string) => ColumnOption[]
  onDeleteRow?: (row: T) => void
}

export interface DataTableContextValue<T = any> {
  state: DataTableState<T>
  actions: DataTableActions<T>
  slots: SlotComponents<DataTableSlots>
  slotProps: SlotPropsMap<DataTableSlots>
}

export const DataTableContext = createContext<DataTableContextValue<any> | null>(null)

export function useDataTable<T = any>(): DataTableContextValue<T> | null {
  return useContext(DataTableContext)
}

export const DataTableProvider = DataTableContext.Provider
export const useDataTableContext = useDataTable

/* ==========================================================================
   DataTable Slots Interfaces
   ========================================================================== */

export interface DataTableToolbarSlots {
  /** Search filter input slot. */
  search?: React.ComponentType<DataTableSearchProps>
  /** Selection count badge slot. */
  selectionBadge?: React.ComponentType<DataTableSelectionBadgeProps>
  /** Column visibility dropdown menu slot. */
  columnVisibility?: React.ComponentType<DataTableColumnVisibilityProps>
  /** Action buttons slot on the right side. */
  toolbarActions?: React.ComponentType<DataTableToolbarActionsProps>
}

export interface DataTableToolbarProps extends HTMLAttributes<HTMLDivElement> {
  /** Injected slot component overrides. */
  slots?: SlotComponents<DataTableToolbarSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<DataTableToolbarSlots>
}

export interface DataTableSearchProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Search query value override. */
  value?: string
  /** Query change handler override. */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  /** Placeholder text override. */
  placeholder?: string
  /** Custom wrapper CSS classes. */
  wrapperClassName?: string
}

export interface DataTableSelectionBadgeProps extends BadgeProps {
  /** Content count override. */
  children?: ReactNode
}

export interface DataTableColumnVisibilityProps extends HTMLAttributes<HTMLDivElement> {
  /** Popover trigger button label. */
  triggerLabel?: string
  /** Popover trigger custom icon. */
  triggerIcon?: ReactNode
}

export interface DataTableToolbarActionsProps extends HTMLAttributes<HTMLDivElement> {
  /** Actions content. */
  children?: ReactNode
}

export interface DataTableContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Table max height with vertical scrolling. */
  maxHeight?: number | string
  /** Table min height. */
  minHeight?: number | string
  /** Explicit fixed height. */
  height?: number | string
}

export interface DataTableHeaderSlots {
  /** Column resizer drag handle slot. */
  resizer?: React.ComponentType<HTMLAttributes<HTMLDivElement>>
  /** Column action menu trigger button. */
  columnActionTrigger?: React.ComponentType<ButtonProps>
}

export interface DataTableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {
  /** Injected slot component overrides. */
  slots?: SlotComponents<DataTableHeaderSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<DataTableHeaderSlots>
}

export interface DataTableHeaderCellProps<T = any> extends HTMLAttributes<HTMLTableCellElement> {
  /** Column metadata definition. */
  column: DataTableColumn<T>
  /** Resizer handle enabled override. */
  resizable?: boolean
  /** Sorting enabled override. */
  sortable?: boolean
}

export interface DataTableBodySlots {
  /** Row element slot. */
  row?: React.ComponentType<DataTableRowProps>
  /** Loading state indicator slot. */
  loader?: React.ComponentType<DataTableLoaderProps>
  /** Empty state message slot. */
  emptyState?: React.ComponentType<DataTableEmptyStateProps>
  /** Row action menu trigger button. */
  rowActionTrigger?: React.ComponentType<ButtonProps>
}

export interface DataTableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  /** Custom rows list override. */
  rows?: any[]
  /** Injected slot component overrides. */
  slots?: SlotComponents<DataTableBodySlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<DataTableBodySlots>
}

export interface DataTableRowProps<T = any> extends HTMLAttributes<HTMLTableRowElement> {
  /** Row item record. */
  row?: T
  /** Global row index. */
  index?: number
  /** Row click callback. */
  onRowClick?: (row: T, index: number) => void
  /** Injected slot component overrides. */
  slots?: SlotComponents<Pick<DataTableBodySlots, 'rowActionTrigger'>>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<Pick<DataTableBodySlots, 'rowActionTrigger'>>
}

export interface DataTableCellProps<T = any> extends HTMLAttributes<HTMLTableCellElement> {
  /** Row item record. */
  row?: T
  /** Column metadata definition. */
  column?: DataTableColumn<T>
  /** Global row index. */
  index?: number
  /** Formatted or extracted cell value. */
  value?: any
}

export interface DataTableLoaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Loading loader size. */
  size?: 'sm' | 'md' | 'lg'
  /** Loading message caption. */
  label?: ReactNode
}

export interface DataTableEmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Empty icon or graphic. */
  icon?: ReactNode
  /** Main title headline. */
  title?: ReactNode
  /** Subtitle description text. */
  description?: ReactNode
}

export interface DataTablePaginationSlots {
  /** Rows per page selector slot. */
  pageSizeSelect?: React.ComponentType<SelectHTMLAttributes<HTMLSelectElement>>
}

export interface DataTablePaginationProps extends HTMLAttributes<HTMLDivElement> {
  /** Current page index (1-based). */
  currentPage?: number
  /** Total number of pages. */
  totalPages?: number
  /** Total count of records. */
  totalEntries?: number
  /** Number of rows per page. */
  pageSize?: number
  /** Allowed page size options. */
  pageSizeOptions?: number[]
  /** Page change callback. */
  onPageChange?: (page: number) => void
  /** Page size change callback. */
  onPageSizeChange?: (pageSize: number) => void
  /** Injected slot component overrides. */
  slots?: SlotComponents<DataTablePaginationSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<DataTablePaginationSlots>
}

export interface DataTableSlots extends DataTableToolbarSlots, DataTableHeaderSlots, DataTableBodySlots, DataTablePaginationSlots {
  /** Top action toolbar container slot. */
  toolbar?: React.ComponentType<DataTableToolbarProps>
  /** Search input field slot. */
  search?: React.ComponentType<DataTableSearchProps>
  /** Row selection counter badge slot. */
  selectionBadge?: React.ComponentType<DataTableSelectionBadgeProps>
  /** Column visibility popover menu slot. */
  columnVisibility?: React.ComponentType<DataTableColumnVisibilityProps>
  /** Additional toolbar items slot on the right side. */
  toolbarActions?: React.ComponentType<DataTableToolbarActionsProps>
  /** Scrollable table viewport container slot. */
  container?: React.ComponentType<DataTableContainerProps>
  /** Table header slot. */
  header?: React.ComponentType<DataTableHeaderProps>
  /** Table body slot. */
  body?: React.ComponentType<DataTableBodyProps>
  /** Row element slot. */
  row?: React.ComponentType<DataTableRowProps>
  /** Empty state element slot. */
  emptyState?: React.ComponentType<DataTableEmptyStateProps>
  /** Loading indicator slot. */
  loader?: React.ComponentType<DataTableLoaderProps>
  /** Pagination controls container slot. */
  pagination?: React.ComponentType<DataTablePaginationProps>
  /** Rows per page selector slot. */
  pageSizeSelect?: React.ComponentType<SelectHTMLAttributes<HTMLSelectElement>>
  /** Action menu trigger button for rows. */
  rowActionTrigger?: React.ComponentType<ButtonProps>
}

export interface DataTableProps<T = any>
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onSelect' | 'slots' | 'slotProps'> {
  /** Array of row records to display. */
  data: T[]
  /** Column definitions with sorting, filtering, and pinning metadata. */
  columns: DataTableColumn<T>[]
  /** Optional custom child composition (using compound subcomponents or render prop). When omitted, renders default table layout. */
  children?: ReactNode | ((context: DataTableContextValue<T>) => ReactNode)
  /** Enable global search filter input. @default true */
  searchable?: boolean
  /** Search input placeholder string. */
  searchPlaceholder?: string
  /** Enable pagination controls footer. @default true */
  pagination?: boolean
  /** Alias for pagination. */
  enablePagination?: boolean
  /** Number of rows displayed per page. @default 10 */
  pageSize?: number
  /** Allowed page size options in the dropdown. @default [10, 25, 50, 100] */
  pageSizeOptions?: number[]
  /** Fixed container/body height with vertical scroll. */
  height?: number | string
  /** Explicit fixed height for the table body / scroll viewport. */
  bodyHeight?: number | string
  /** Maximum container height with vertical scroll. */
  maxHeight?: number | string
  /** Minimum container height. */
  minHeight?: number | string
  /** Row click callback. */
  onRowClick?: (row: T, index: number) => void
  /** Enable checkbox selection for rows. @default false */
  enableRowSelection?: boolean
  /** Alias for enableRowSelection. */
  enableSelection?: boolean
  /** Controlled selected row IDs. */
  selectedRowIds?: string[]
  /** Callback when selected row items and IDs change. */
  onSelectionChange?: (selectedRows: T[], selectedIds: string[]) => void
  /** Alias callback for onSelectionChange. */
  onRowSelectionChange?: (selectedRows: T[], selectedIds?: string[]) => void
  /** Enable row pinning to the top of the table. @default true */
  enableRowPinning?: boolean
  /** Show rightmost actions dropdown column. @default false */
  optionsColumn?: boolean
  /** Action items generator for each row. */
  rowOptions?: (row: T) => RowOption<T>[]
  /** Alias for rowOptions. */
  rowActions?: (row: T) => RowOption<T>[]
  /** Context actions for each column header. */
  columnOptions?: (columnId: string) => ColumnOption[]
  /** Alias for columnOptions. */
  columnActions?: (columnId: string) => ColumnOption[]
  /** Callback fired when a row is pinned/unpinned. */
  onPinRow?: (row: T, isPinned: boolean) => void
  /** Callback fired when a row delete action is triggered. */
  onDeleteRow?: (row: T) => void
  /** Callback fired when a column freeze state changes. */
  onFreezeColumn?: (columnId: string, freeze: boolean) => void
  /** Unique ID extractor function for rows. */
  getRowId?: (row: T, index: number) => string
  /** Loading state flag. */
  loading?: boolean
  /** Custom empty state node. */
  emptyState?: ReactNode
  /** Additional toolbar items on the right side. */
  toolbarActions?: ReactNode
  /** Alternate row zebra striping. @default false */
  striped?: boolean
  /** Bordered table outline and cell borders. @default true */
  bordered?: boolean
  /** Row hover highlight style. @default true */
  hoverable?: boolean
  /** Compact row density. @default false */
  compact?: boolean
  /** Show column visibility toggle button in toolbar. @default true */
  showColumnVisibility?: boolean
  /** Injected slot component overrides. */
  slots?: SlotComponents<DataTableSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<DataTableSlots>
}

/* ==========================================================================
   DataTable Dedicated Pagination Component
   ========================================================================== */

const DataTablePaginationPrimitive = ({
  className,
  currentPage: propCurrentPage,
  totalPages: propTotalPages,
  totalEntries: propTotalEntries,
  pageSize: propPageSize,
  pageSizeOptions: propPageSizeOptions,
  onPageChange: propOnPageChange,
  onPageSizeChange: propOnPageSizeChange,
  slots = {},
  slotProps = {},
  ...props
}: DataTablePaginationProps) => {
  const ctx = useDataTable()
  const currentPage = propCurrentPage ?? ctx?.state.currentPage ?? 1
  const totalPages = propTotalPages ?? ctx?.state.totalPages ?? 1
  const totalEntries = propTotalEntries ?? ctx?.state.sortedData.length ?? 0
  const pageSize = propPageSize ?? ctx?.state.pageSize ?? 10
  const pageSizeOptions = propPageSizeOptions ?? ctx?.state.pageSizeOptions ?? [10, 25, 50, 100]
  const onPageChange = propOnPageChange ?? ctx?.actions.setCurrentPage ?? (() => { })
  const onPageSizeChange =
    propOnPageSizeChange ??
    (ctx
      ? (newSize: number) => {
        ctx.actions.setPageSize(newSize)
        ctx.actions.setCurrentPage(1)
      }
      : undefined)

  const startEntry = totalEntries === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endEntry = Math.min(currentPage * pageSize, totalEntries)
  const canPrev = currentPage > 1
  const canNext = currentPage < totalPages

  const pages: (number | 'ellipsis-left' | 'ellipsis-right')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push('ellipsis-left')
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push('ellipsis-right')
    pages.push(totalPages)
  }

  const navButtonClasses = (active: boolean, disabled: boolean) =>
    cn(
      'relative inline-flex items-center justify-center font-semibold text-xs tabular-nums select-none',
      'min-w-8 h-8 px-2 rounded-base transition-colors duration-150 outline-none',
      'focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1',
      active
        ? 'bg-primary text-primary-fg font-bold shadow-xs cursor-default'
        : 'bg-transparent text-muted-fg hover:bg-secondary hover:text-fg active:bg-secondary/80 cursor-pointer',
      disabled ? 'pointer-events-none opacity-30 cursor-not-allowed' : 'cursor-pointer'
    )

  return (
    <div
      data-slot="pagination-footer"
      className={cn(
        '@container flex flex-col @[640px]:flex-row items-center justify-between gap-2.5 border-t border-border/50 bg-muted/5 px-3 py-2 sm:px-4 text-xs text-muted-fg w-full overflow-hidden',
        className
      )}
      {...props}
    >
      {/* Above row on smaller screens: Entries Summary & Page Size selector */}
      <div className="flex items-center justify-between gap-3 text-xs w-full @[640px]:w-auto pb-2 border-b border-border/40 @[640px]:pb-0 @[640px]:border-b-0">
        <span className="whitespace-nowrap text-muted-fg">
          Showing <span className="font-semibold text-fg">{startEntry}</span>–<span className="font-semibold text-fg">{endEntry}</span> of{' '}
          <span className="font-semibold text-fg">{totalEntries}</span>
        </span>

        {pageSizeOptions && pageSizeOptions.length > 1 && onPageSizeChange && (
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <span className="text-muted-fg whitespace-nowrap select-none font-medium">Per page:</span>
            {slots.pageSizeSelect ? (
              renderSlot(slots.pageSizeSelect, {
                ...slotProps.pageSizeSelect,
                value: String(pageSize),
                onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onPageSizeChange(Number(e.target.value)),
              })
            ) : (
              <NativeSelectContent
                value={String(pageSize)}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="h-7 py-0 pl-2 pr-6 text-xs rounded-atom bg-bg border border-border"
              >
                {pageSizeOptions.map((sz) => (
                  <option key={sz} value={sz}>
                    {sz}
                  </option>
                ))}
              </NativeSelectContent>
            )}
          </div>
        )}
      </div>

      {/* Below row on smaller screens: Pagination Navigation Controls */}
      <nav aria-label="Table pagination" className="flex items-center justify-between @[640px]:justify-end gap-1.5 w-full @[640px]:w-auto">
        <button
          type="button"
          aria-label="First page"
          disabled={!canPrev}
          onClick={() => onPageChange?.(1)}
          className={cn(navButtonClasses(false, !canPrev), 'hidden @[640px]:inline-flex')}
        >
          <ChevronDoubleLeftIcon className="size-4 shrink-0" />
        </button>

        <button
          type="button"
          aria-label="Previous page"
          disabled={!canPrev}
          onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
          className={cn(navButtonClasses(false, !canPrev), 'px-3 gap-1')}
        >
          <ChevronLeftIcon className="size-4 shrink-0" />
          <span>Prev</span>
        </button>

        {/* Mobile: Compact Page Indicator Badge */}
        <div className="@[640px]:hidden flex items-center justify-center px-3 py-1 rounded-base bg-secondary/60 text-xs font-semibold text-fg tabular-nums select-none border border-border/40">
          <span>Page {currentPage} of {totalPages || 1}</span>
        </div>

        {/* Desktop: Numeric Page Buttons */}
        <div className="hidden @[640px]:flex items-center gap-1">
          {pages.map((p, idx) => {
            if (typeof p === 'number') {
              const isCurrent = p === currentPage
              return (
                <button
                  key={p}
                  type="button"
                  aria-current={isCurrent ? 'page' : undefined}
                  onClick={() => onPageChange?.(p)}
                  className={navButtonClasses(isCurrent, false)}
                >
                  {p}
                </button>
              )
            }
            return (
              <span
                key={`ellipsis-${idx}`}
                className="flex size-8 items-center justify-center text-muted-fg text-xs select-none"
              >
                …
              </span>
            )
          })}
        </div>

        <button
          type="button"
          aria-label="Next page"
          disabled={!canNext}
          onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
          className={cn(navButtonClasses(false, !canNext), 'px-3 gap-1')}
        >
          <span>Next</span>
          <ChevronRightIcon className="size-4 shrink-0" />
        </button>

        <button
          type="button"
          aria-label="Last page"
          disabled={!canNext}
          onClick={() => onPageChange?.(totalPages)}
          className={cn(navButtonClasses(false, !canNext), 'hidden @[640px]:inline-flex')}
        >
          <ChevronDoubleRightIcon className="size-4 shrink-0" />
        </button>
      </nav>
    </div>
  )
}

export const DataTablePagination = createInterfaceComponent<DataTablePaginationProps, DataTablePaginationSlots>(
  {
    name: 'DataTablePagination',
    category: 'data',
    description: 'Dedicated pagination footer with row counts, page size selector, and accessible page buttons for DataTable.',
    version: '1.0.0',
    slots: {
      pageSizeSelect: undefined,
    },
  },
  DataTablePaginationPrimitive
)

/* ==========================================================================
   DataTable Compound Sub-Components
   ========================================================================== */

/* --- 1. DataTableSearch --- */
const DataTableSearchPrimitive = ({
  value: propValue,
  onChange: propOnChange,
  placeholder: propPlaceholder,
  className,
  wrapperClassName,
  ...props
}: DataTableSearchProps) => {
  const ctx = useDataTable()
  const value = propValue !== undefined ? propValue : (ctx?.state.searchTerm ?? '')
  const placeholder = propPlaceholder ?? ctx?.state.searchPlaceholder ?? 'Search table records...'
  const onChange =
    propOnChange ??
    ((e: React.ChangeEvent<HTMLInputElement>) => {
      ctx?.actions.setSearchTerm(e.target.value)
      ctx?.actions.setCurrentPage(1)
    })

  return (
    <div className={cn('relative min-w-50 flex-1 max-w-sm', wrapperClassName)}>
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
    </div>
  )
}

export const DataTableSearch = createInterfaceComponent<DataTableSearchProps>(
  {
    name: 'DataTableSearch',
    category: 'data',
    description: 'Context-connected global search input for DataTable filtering.',
    version: '1.0.0',
  },
  DataTableSearchPrimitive
)

/* --- 2. DataTableSelectionBadge --- */
const DataTableSelectionBadgePrimitive = ({
  className,
  children,
  intent = 'secondary',
  ...props
}: DataTableSelectionBadgeProps) => {
  const ctx = useDataTable()
  const count = ctx?.state.selectedRowsList.length ?? 0
  if (!children && count === 0) return null

  return (
    <Badge
      intent={intent}
      className={cn('px-2.5 py-1 text-xs font-medium rounded-micro', className)}
      {...props}
    >
      {children || `${count} selected`}
    </Badge>
  )
}

export const DataTableSelectionBadge = createInterfaceComponent<DataTableSelectionBadgeProps>(
  {
    name: 'DataTableSelectionBadge',
    category: 'data',
    description: 'Counter badge reflecting selected row count in DataTable.',
    version: '1.0.0',
  },
  DataTableSelectionBadgePrimitive
)

/* --- 3. DataTableColumnVisibility --- */
const DataTableColumnVisibilityPrimitive = ({
  className,
  triggerLabel = 'Columns',
  triggerIcon,
  ...props
}: DataTableColumnVisibilityProps) => {
  const ctx = useDataTable()
  const columns = ctx?.state.columns ?? []
  const columnVisibility = ctx?.state.columnVisibility ?? {}
  const setColumnVisibility = ctx?.actions.setColumnVisibility

  return (
    <div data-slot="column-visibility" className={cn('inline-flex', className)} {...props}>
      <OverlayTrigger>
        <Button
          intent="plain"
          className="inline-flex h-9 items-center gap-1.5 rounded-base border border-border bg-bg px-3 text-xs font-medium text-fg hover:bg-muted/40 transition-colors"
        >
          {triggerIcon || <ViewColumnsIcon className="size-4 text-muted-fg" />}
          <span>{triggerLabel}</span>
        </Button>
        <Popover size="auto" className="w-48 p-1.5">
          <div className="flex flex-col gap-1">
            <div className="text-[10px] font-semibold text-muted-fg uppercase tracking-wide px-1.5 pt-0.5 pb-1">Columns</div>
            <div className="flex flex-col max-h-56 overflow-y-auto">
              {columns.map((col) => {
                if (col.enableHiding === false) return null
                const isChecked = columnVisibility[col.id] !== false
                const headerLabel =
                  typeof col.header === 'string'
                    ? col.header
                    : col.id
                      ? col.id.charAt(0).toUpperCase() + col.id.slice(1).replace(/([A-Z])/g, ' $1')
                      : 'Column'
                return (
                  <div
                    key={col.id}
                    className="flex items-center rounded-atom px-1.5 py-0.5 text-xs text-fg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      isSelected={isChecked}
                      onChange={(checked: boolean) =>
                        setColumnVisibility?.((prev) => ({ ...prev, [col.id]: checked }))
                      }
                      className="text-xs w-full"
                    >
                      <span className="truncate">{headerLabel}</span>
                    </Checkbox>
                  </div>
                )
              })}
            </div>
          </div>
        </Popover>
      </OverlayTrigger>
    </div>
  )
}

export const DataTableColumnVisibility = createInterfaceComponent<DataTableColumnVisibilityProps>(
  {
    name: 'DataTableColumnVisibility',
    category: 'data',
    description: 'Popover menu to toggle column visibility dynamically.',
    version: '1.0.0',
  },
  DataTableColumnVisibilityPrimitive
)

/* --- 4. DataTableToolbarActions --- */
const DataTableToolbarActionsPrimitive = ({
  className,
  children,
  ...props
}: DataTableToolbarActionsProps) => {
  const ctx = useDataTable()
  const content = children || ctx?.state.toolbarActions
  if (!content) return null

  return (
    <div data-slot="toolbar-actions" className={cn('flex items-center gap-2', className)} {...props}>
      {content}
    </div>
  )
}

export const DataTableToolbarActions = createInterfaceComponent<DataTableToolbarActionsProps>(
  {
    name: 'DataTableToolbarActions',
    category: 'data',
    description: 'Container for custom right-side actions inside DataTableToolbar.',
    version: '1.0.0',
  },
  DataTableToolbarActionsPrimitive
)

/* --- 5. DataTableToolbar --- */
const DataTableToolbarPrimitive = ({
  className,
  children,
  slots = {},
  slotProps = {},
  ...props
}: DataTableToolbarProps) => {
  const ctx = useDataTable()
  const searchable = ctx?.state.searchable ?? true
  const enableRowSelection = ctx?.state.enableRowSelection ?? false
  const showColumnVisibility = ctx?.state.showColumnVisibility ?? true

  return (
    <div
      data-slot="toolbar"
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 border-b border-border/60 bg-muted/5',
        className
      )}
      {...props}
    >
      {children ? (
        children
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {searchable &&
              (slots.search ? (
                renderSlot(slots.search, slotProps?.search)
              ) : (
                <DataTableSearch />
              ))}

            {enableRowSelection &&
              (slots.selectionBadge ? (
                renderSlot(slots.selectionBadge, slotProps?.selectionBadge)
              ) : (
                <DataTableSelectionBadge />
              ))}
          </div>

          <div className="flex items-center gap-2">
            {showColumnVisibility &&
              (slots.columnVisibility ? (
                renderSlot(slots.columnVisibility, slotProps?.columnVisibility)
              ) : (
                <DataTableColumnVisibility />
              ))}

            {slots.toolbarActions ? (
              renderSlot(slots.toolbarActions, slotProps?.toolbarActions)
            ) : (
              <DataTableToolbarActions />
            )}
          </div>
        </>
      )}
    </div>
  )
}

export const DataTableToolbar = createInterfaceComponent<DataTableToolbarProps, DataTableToolbarSlots>(
  {
    name: 'DataTableToolbar',
    category: 'data',
    description: 'Top action toolbar housing Search, SelectionBadge, ColumnVisibility, and ToolbarActions.',
    version: '1.0.0',
    slots: {
      search: undefined,
      selectionBadge: undefined,
      columnVisibility: undefined,
      toolbarActions: undefined,
    },
  },
  DataTableToolbarPrimitive
)

/* --- 6. DataTableLoader --- */
const DataTableLoaderPrimitive = ({
  className,
  size = 'md',
  label = 'Loading records...',
  ...props
}: DataTableLoaderProps) => {
  return (
    <div
      data-slot="loader"
      className={cn('flex flex-col items-center justify-center gap-2 py-6', className)}
      {...props}
    >
      <Loader size={size} />
      {label && <span className="text-xs font-medium text-muted-fg">{label}</span>}
    </div>
  )
}

export const DataTableLoader = createInterfaceComponent<DataTableLoaderProps>(
  {
    name: 'DataTableLoader',
    category: 'data',
    description: 'Animated loader indicator rendered during DataTable loading state.',
    version: '1.0.0',
  },
  DataTableLoaderPrimitive
)

/* --- 7. DataTableEmptyState --- */
const DataTableEmptyStatePrimitive = ({
  className,
  icon,
  title = 'No data matching filters',
  description = 'Try adjusting your search criteria or clearing filters.',
  children,
  ...props
}: DataTableEmptyStateProps) => {
  return (
    <div
      data-slot="empty-state"
      className={cn('flex flex-col items-center justify-center gap-1.5 py-8 text-center', className)}
      {...props}
    >
      {children || (
        <>

          <div className="font-semibold text-fg text-sm">{title}</div>
          {description && <div className="text-xs text-muted-fg max-w-sm">{description}</div>}
        </>
      )}
    </div>
  )
}

export const DataTableEmptyState = createInterfaceComponent<DataTableEmptyStateProps>(
  {
    name: 'DataTableEmptyState',
    category: 'data',
    description: 'Empty state illustration rendered when table has no data records.',
    version: '1.0.0',
  },
  DataTableEmptyStatePrimitive
)

/* --- 8. DataTableHeaderCell --- */
const DataTableHeaderCellPrimitive = <T extends Record<string, any>>({
  column,
  resizable: propResizable,
  sortable: propSortable,
  className,
  children,
  ...props
}: DataTableHeaderCellProps<T>) => {
  const ctx = useDataTable()
  if (!ctx) return null

  const isFrozen = ctx.state.columnFreezeState[column.id] ?? column.freeze ?? false
  const isSorted = ctx.state.sortColumn === column.id
  const sortDirection = ctx.state.sortDirection
  const sortable = propSortable ?? (column.sortable !== false)
  const resizable = propResizable ?? (column.resizable !== false)

  const colW =
    ctx.state.columnWidths[column.id] ||
    (typeof column.width === 'number'
      ? column.width
      : typeof column.width === 'string'
        ? parseInt(column.width, 10)
        : 180)

  const stickyStyles = ctx.actions.getStickyStyle(column, true)
  const effectiveColumnOptions = ctx.actions.effectiveColumnOptions

  return (
    <th
      key={column.id}
      className={cn(
        'group relative px-3 py-1 select-none transition-colors border-b border-border font-medium text-xs text-muted-fg bg-[var(--color-bg)]',
        isFrozen ? 'border-r border-border/40' : 'border-r border-border/20 last:border-r-0',
        column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left',
        sortable && 'cursor-pointer hover:text-fg',
        className
      )}
      style={{
        width: `${colW}px`,
        minWidth: `${colW}px`,
        maxWidth: column.maxWidth
          ? typeof column.maxWidth === 'number'
            ? `${column.maxWidth}px`
            : column.maxWidth
          : undefined,
        ...stickyStyles,
      }}
      onClick={() => sortable && ctx.actions.toggleSort(column.id)}
      {...props}
    >
      {children || (
        <div className="flex items-center gap-1.5 justify-between">
          <div className="flex items-center gap-1 truncate">
            <span className="truncate">{column.header}</span>
            {sortable && (
              <span className="inline-flex size-3.5 items-center justify-center text-muted-fg/70 group-hover:text-fg">
                {isSorted ? (
                  sortDirection === 'asc' ? (
                    <ChevronUpIcon className="size-3.5 text-primary" />
                  ) : (
                    <ChevronDownIcon className="size-3.5 text-primary" />
                  )
                ) : (
                  <ArrowsUpDownIcon className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </span>
            )}
          </div>

          {/* Header context menu */}
          {(effectiveColumnOptions || column.enableHiding !== false) && (
            <OverlayTrigger>
              <Button
                intent="plain"
                onPress={() => { }}
                className="opacity-0 group-hover:opacity-100 p-0.5  rounded-atom text-muted-fg hover:text-fg hover:bg-muted/60 transition-opacity"
              >
                <EllipsisVerticalIcon className="size-3.5" />
              </Button>
              <Popover size="auto" className="w-44 p-1.5">
                {({ close }: { close: () => void }) => (
                  <div className="flex flex-col gap-0.5 text-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        ctx.actions.toggleFreezeColumn(column.id)
                        close()
                      }}
                      className="flex items-center gap-2 rounded-atom px-2 py-1 text-left text-fg hover:bg-muted/50 cursor-pointer"
                    >
                      {isFrozen ? (
                        <>
                          <LockOpenIcon className="size-3.5 text-muted-fg" />
                          <span>Unfreeze Column</span>
                        </>
                      ) : (
                        <>
                          <LockClosedIcon className="size-3.5 text-muted-fg" />
                          <span>Freeze Column</span>
                        </>
                      )}
                    </button>

                    {column.enableHiding !== false && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          ctx.actions.setColumnVisibility((prev) => ({ ...prev, [column.id]: false }))
                          close()
                        }}
                        className="flex items-center gap-2 rounded-atom px-2 py-1 text-left text-fg hover:bg-muted/50 cursor-pointer"
                      >
                        <EyeSlashIcon className="size-3.5 text-muted-fg" />
                        <span>Hide Column</span>
                      </button>
                    )}

                    {effectiveColumnOptions &&
                      effectiveColumnOptions(column.id).map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          disabled={opt.disabled}
                          onClick={(e) => {
                            e.stopPropagation()
                            opt.onClick?.(column.id)
                            close()
                          }}
                          className={cn(
                            'flex items-center gap-2 rounded-atom px-2 py-1.5 text-left text-fg hover:bg-muted/50 cursor-pointer',
                            opt.variant === 'destructive' && 'text-danger hover:bg-danger/10'
                          )}
                        >
                          {opt.icon}
                          <span>{opt.label}</span>
                        </button>
                      ))}
                  </div>
                )}
              </Popover>
            </OverlayTrigger>
          )}
        </div>
      )}

      {/* Resizer handle — thin soft line on hover */}
      {resizable && (
        <div
          onMouseDown={(e) =>
            ctx.actions.startResize(
              e,
              column.id,
              ctx.state.columnWidths[column.id] || (typeof column.width === 'number' ? column.width : 180)
            )
          }
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 cursor-col-resize touch-none select-none z-10',
            'flex items-center justify-center'
          )}
        >
          <span
            className={cn(
              'block w-px h-full rounded-full transition-colors duration-150',
              ctx.state.resizingCol === column.id
                ? 'bg-primary/90'
                : 'bg-border/0 group-hover:bg-border/90'
            )}
          />
        </div>
      )}
    </th>
  )
}

export const DataTableHeaderCell = createInterfaceComponent<DataTableHeaderCellProps>(
  {
    name: 'DataTableHeaderCell',
    category: 'data',
    description: 'Header column cell with sorting, context menu, and column resizing.',
    version: '1.0.0',
  },
  DataTableHeaderCellPrimitive
)

/* --- 9. DataTableHeader --- */
const DataTableHeaderPrimitive = ({
  className,
  children,
  slots = {},
  slotProps = {},
  ...props
}: DataTableHeaderProps) => {
  const ctx = useDataTable()
  if (!ctx) return null

  const enableRowSelection = ctx.state.enableRowSelection
  const isAllPageSelected = ctx.state.isAllPageSelected
  const isSomePageSelected = ctx.state.isSomePageSelected
  const visibleColumns = ctx.state.visibleColumns
  const hasOptionsCol = ctx.state.hasOptionsCol

  return (
    <thead data-slot="header" className={cn(className)} {...props}>
      {children || (
        <tr>
          {/* Row selection column header */}
          {enableRowSelection && (
            <th
              className="w-12 min-w-12 max-w-12 px-3 py-3 text-center sticky top-0 left-0 z-35 bg-[var(--color-bg)] border-b border-border border-r border-border/40"
              style={{ position: 'sticky', top: 0, left: 0, zIndex: 35 }}
            >
              <Checkbox
                isSelected={isAllPageSelected}
                isIndeterminate={!isAllPageSelected && isSomePageSelected}
                onChange={(checked: boolean) => ctx.actions.toggleSelectAll(checked)}
                aria-label="Select all rows"
              />
            </th>
          )}

          {/* Data column headers */}
          {visibleColumns.map((col) => (
            <DataTableHeaderCell key={col.id} column={col} />
          ))}

          {/* Options column header */}
          {hasOptionsCol && (
            <th
              className="w-12 min-w-12 max-w-12 px-3 py-3 text-center sticky top-0 right-0 z-35 bg-[var(--color-bg)] border-b border-border border-l border-border/40"
              style={{ position: 'sticky', top: 0, right: 0, zIndex: 35 }}
            >
              <span className="sr-only">Actions</span>
            </th>
          )}
        </tr>
      )}
    </thead>
  )
}

export const DataTableHeader = createInterfaceComponent<DataTableHeaderProps, DataTableHeaderSlots>(
  {
    name: 'DataTableHeader',
    category: 'data',
    description: 'Header container containing all column header cells and select-all trigger.',
    version: '1.0.0',
    slots: {
      resizer: undefined,
      columnActionTrigger: undefined,
    },
  },
  DataTableHeaderPrimitive
)

/* --- 10. DataTableCell --- */
const DataTableCellPrimitive = <T extends Record<string, any>>({
  row,
  column,
  index = 0,
  value: propValue,
  className,
  children,
  ...props
}: DataTableCellProps<T>) => {
  const ctx = useDataTable()
  if (!ctx || !column || !row) return null

  const isFrozen = ctx.state.columnFreezeState[column.id] ?? column.freeze ?? false
  const rawVal = propValue !== undefined ? propValue : resolveRowValue(row, column.accessorKey, column.accessorFn)
  const isSelected = !!ctx.state.rowSelection[ctx.actions.getRowId(row, index)]
  const isPinned = ctx.state.pinnedRows.has(ctx.actions.getRowId(row, index))
  const isStriped = ctx.state.striped && index % 2 === 1

  const colW =
    ctx.state.columnWidths[column.id] ||
    (typeof column.width === 'number'
      ? column.width
      : typeof column.width === 'string'
        ? parseInt(column.width, 10)
        : 180)

  const stickyStyles = ctx.actions.getStickyStyle(column, false)

  return (
    <td
      key={column.id}
      className={cn(
        'px-3 py-1 text-sm text-fg border-b border-border/30 transition-colors',
        isFrozen ? 'border-r border-border/40' : 'border-r border-border/20 last:border-r-0',
        getCellBgClass(isSelected, isPinned, isStriped),
        column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left',
        className
      )}
      style={{
        width: `${colW}px`,
        minWidth: `${colW}px`,
        maxWidth: column.maxWidth
          ? typeof column.maxWidth === 'number'
            ? `${column.maxWidth}px`
            : column.maxWidth
          : undefined,
        ...stickyStyles,
      }}
      {...props}
    >
      {children ||
        (column.cell
          ? (() => {
            const cellFn = column.cell as any
            if (row && typeof row === 'object' && !('getValue' in row)) {
              try {
                Object.defineProperty(row, 'getValue', {
                  value: () => rawVal,
                  configurable: true,
                  writable: true,
                  enumerable: false,
                })
              } catch { }
            }
            try {
              return cellFn(row, index)
            } catch {
              return cellFn({ getValue: () => rawVal, row, index, column })
            }
          })()
          : rawVal != null
            ? String(rawVal)
            : '—')}
    </td>
  )
}

export const DataTableCell = createInterfaceComponent<DataTableCellProps>(
  {
    name: 'DataTableCell',
    category: 'data',
    description: 'Data cell component with sticky alignment and formatted value rendering.',
    version: '1.0.0',
  },
  DataTableCellPrimitive
)

/* --- 11. DataTableRow --- */
const DataTableRowPrimitive = <T extends Record<string, any>>({
  row: propRow,
  index: propIndex,
  onRowClick: propOnRowClick,
  className,
  children,
  ...props
}: DataTableRowProps<T>) => {
  const ctx = useDataTable()
  if (!ctx || !propRow) return null

  const row = propRow
  const globalIndex = propIndex ?? 0
  const rowId = ctx.actions.getRowId(row, globalIndex)
  const isSelected = !!ctx.state.rowSelection[rowId]
  const isPinned = ctx.state.pinnedRows.has(rowId)
  const isStriped = ctx.state.striped && globalIndex % 2 === 1
  const enableRowSelection = ctx.state.enableRowSelection
  const visibleColumns = ctx.state.visibleColumns
  const hasOptionsCol = ctx.state.hasOptionsCol
  const enableRowPinning = ctx.state.enableRowPinning
  const effectiveRowOptions = ctx.actions.effectiveRowOptions
  const onDeleteRow = ctx.actions.onDeleteRow
  const onRowClick = propOnRowClick ?? ctx.actions.onRowClick

  return (
    <tr
      key={rowId}
      onClick={() => onRowClick?.(row, globalIndex)}
      className={cn(
        'group transition-colors',
        onRowClick && 'cursor-pointer',
        isPinned && 'bg-accent/10 border-l-2 border-l-primary',
        className
      )}
      {...props}
    >
      {children || (
        <>
          {/* Row selection cell */}
          {enableRowSelection && (
            <td
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'w-12 min-w-12 max-w-12 px-3 py-3 text-center sticky left-0 z-25 border-b border-border/40 border-r border-border/40 transition-colors',
                isPinned && 'border-l-2 border-l-primary',
                getCellBgClass(isSelected, isPinned, isStriped)
              )}
              style={{ position: 'sticky', left: 0, zIndex: 25 }}
            >
              <Checkbox
                isSelected={isSelected}
                onChange={(checked: boolean) => ctx.actions.toggleSelectRow(row, globalIndex, checked)}
                aria-label={`Select row ${rowId}`}
              />
            </td>
          )}

          {/* Data cells */}
          {visibleColumns.map((col, colIdx) => (
            <DataTableCell
              key={col.id}
              row={row}
              column={col}
              index={globalIndex}
              className={!enableRowSelection && colIdx === 0 && isPinned ? 'border-l-2 border-l-primary' : undefined}
            />
          ))}

          {/* Options action cell */}
          {hasOptionsCol && (
            <td
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'w-12 min-w-12 max-w-12 px-3 py-3 text-center sticky right-0 z-25 border-b border-border/40 border-l border-border/40 transition-colors',
                getCellBgClass(isSelected, isPinned, isStriped)
              )}
              style={{ position: 'sticky', right: 0, zIndex: 25 }}
            >
              <OverlayTrigger>
                <Button
                  intent="plain"
                  className="p-1 rounded-atom text-muted-fg hover:text-fg hover:bg-muted/50 transition-colors"
                >
                  <EllipsisVerticalIcon className="size-4" />
                </Button>
                <Popover size="auto" className="w-48 p-1.5">
                  {({ close }: { close: () => void }) => (
                    <div className="flex flex-col gap-0.5 text-xs">
                      {enableRowPinning && (
                        <button
                          type="button"
                          onClick={() => {
                            ctx.actions.togglePinRow(row, globalIndex)
                            close()
                          }}
                          className="flex items-center gap-2 rounded-atom px-2 py-1.5 text-left text-fg hover:bg-muted/50 cursor-pointer"
                        >
                          {isPinned ? (
                            <PinSolidIcon className="size-3.5 text-primary" />
                          ) : (
                            <PinOutlineIcon className="size-3.5 text-muted-fg" />
                          )}
                          <span>{isPinned ? 'Unpin Row' : 'Pin to Top'}</span>
                        </button>
                      )}

                      {effectiveRowOptions &&
                        effectiveRowOptions(row).map((opt, i) => (
                          <button
                            key={i}
                            type="button"
                            disabled={opt.disabled}
                            onClick={() => {
                              opt.onClick?.(row)
                              close()
                            }}
                            className={cn(
                              'flex items-center gap-2 rounded-atom px-2 py-1 text-left text-fg hover:bg-muted/50 cursor-pointer',
                              opt.variant === 'destructive' && 'text-danger hover:bg-danger/10'
                            )}
                          >
                            {opt.icon}
                            <span>{opt.label}</span>
                          </button>
                        ))}

                      {onDeleteRow && (
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteRow(row)
                            close()
                          }}
                          className="flex items-center gap-2 rounded-atom px-2 py-1 text-left text-danger hover:bg-danger/10 cursor-pointer"
                        >
                          <TrashIcon className="size-3.5 text-danger" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  )}
                </Popover>
              </OverlayTrigger>
            </td>
          )}
        </>
      )}
    </tr>
  )
}

export const DataTableRow = createInterfaceComponent<DataTableRowProps>(
  {
    name: 'DataTableRow',
    category: 'data',
    description: 'Table row component with selection checkbox and actions dropdown.',
    version: '1.0.0',
  },
  DataTableRowPrimitive
)

/* --- 12. DataTableBody --- */
const DataTableBodyPrimitive = ({
  className,
  rows: propRows,
  children,
  slots = {},
  slotProps = {},
  ...props
}: DataTableBodyProps) => {
  const ctx = useDataTable()
  if (!ctx) return null

  const loading = ctx.state.loading
  const rows = propRows ?? ctx.state.paginatedData
  const colSpan =
    ctx.state.visibleColumns.length +
    (ctx.state.enableRowSelection ? 1 : 0) +
    (ctx.state.hasOptionsCol ? 1 : 0)

  return (
    <tbody data-slot="body" className={cn(className)} {...props}>
      {children ? (
        children
      ) : loading ? (
        <tr>
          <td colSpan={colSpan} className="p-12 text-center text-muted-fg border-b border-border/40">
            {slots.loader ? renderSlot(slots.loader, slotProps.loader) : <DataTableLoader />}
          </td>
        </tr>
      ) : rows.length === 0 ? (
        <tr>
          <td colSpan={colSpan} className="p-10 text-center text-muted-fg border-b border-border/40">
            {slots.emptyState ? renderSlot(slots.emptyState, slotProps.emptyState) : <DataTableEmptyState />}
          </td>
        </tr>
      ) : (
        rows.map((row, rowIdx) => {
          const globalIndex = (ctx.state.currentPage - 1) * ctx.state.pageSize + rowIdx
          return <DataTableRow key={ctx.actions.getRowId(row, globalIndex)} row={row} index={globalIndex} />
        })
      )}
    </tbody>
  )
}

export const DataTableBody = createInterfaceComponent<DataTableBodyProps, DataTableBodySlots>(
  {
    name: 'DataTableBody',
    category: 'data',
    description: 'Table body container rendering rows, loading states, or empty states.',
    version: '1.0.0',
    slots: {
      row: undefined,
      loader: undefined,
      emptyState: undefined,
      rowActionTrigger: undefined,
    },
  },
  DataTableBodyPrimitive
)

/* --- 13. DataTableContainer --- */
const DataTableContainerPrimitive = ({
  className,
  maxHeight: propMaxHeight,
  minHeight: propMinHeight,
  height: propHeight,
  children,
  ...props
}: DataTableContainerProps) => {
  const ctx = useDataTable()
  if (!ctx) return null

  const effectiveMaxHeight = propMaxHeight ?? propHeight ?? ctx.state.maxHeight ?? ctx.state.height ?? ctx.state.bodyHeight
  const effectiveMinHeight = propMinHeight ?? ctx.state.minHeight
  const totalTableWidth = ctx.state.totalTableWidth
  const enableRowSelection = ctx.state.enableRowSelection
  const visibleColumns = ctx.state.visibleColumns
  const columnWidths = ctx.state.columnWidths
  const hasOptionsCol = ctx.state.hasOptionsCol

  return (
    <div
      data-slot="table-container"
      className={cn('relative w-full overflow-x-auto', className)}
      style={{
        maxHeight: effectiveMaxHeight
          ? typeof effectiveMaxHeight === 'number'
            ? `${effectiveMaxHeight}px`
            : effectiveMaxHeight
          : undefined,
        minHeight: effectiveMinHeight
          ? typeof effectiveMinHeight === 'number'
            ? `${effectiveMinHeight}px`
            : effectiveMinHeight
          : undefined,
        overflowY: effectiveMaxHeight ? 'auto' : undefined,
      }}
      {...props}
    >
      <table
        className="w-full text-left text-xs text-fg border-separate border-spacing-0 table-fixed"
        style={{
          width: `${totalTableWidth}px`,
          minWidth: '100%',
        }}
      >
        <colgroup>
          {enableRowSelection && <col style={{ width: '48px', minWidth: '48px' }} />}
          {visibleColumns.map((col) => {
            const colW =
              columnWidths[col.id] ||
              (typeof col.width === 'number'
                ? col.width
                : typeof col.width === 'string'
                  ? parseInt(col.width, 10)
                  : 180)
            return (
              <col
                key={col.id}
                style={{
                  width: `${colW}px`,
                  minWidth: `${colW}px`,
                }}
              />
            )
          })}
          {hasOptionsCol && <col style={{ width: '48px', minWidth: '48px' }} />}
        </colgroup>

        {children || (
          <>
            <DataTableHeader />
            <DataTableBody />
          </>
        )}
      </table>
    </div>
  )
}

export const DataTableContainer = createInterfaceComponent<DataTableContainerProps>(
  {
    name: 'DataTableContainer',
    category: 'data',
    description: 'Scrollable container housing table header, column groups, and body.',
    version: '1.0.0',
  },
  DataTableContainerPrimitive
)

/* ==========================================================================
   DataTable Root Primitive Component
   ========================================================================== */

const DataTablePrimitive = <T extends Record<string, any>>({
  className,
  data: rawData = [],
  columns: rawColumns = [],
  children,
  searchable = true,
  searchPlaceholder = 'Search table records...',
  pagination = true,
  enablePagination,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  height,
  bodyHeight,
  maxHeight,
  minHeight,
  onRowClick,
  enableRowSelection = false,
  enableSelection,
  selectedRowIds,
  onSelectionChange,
  onRowSelectionChange,
  enableRowPinning = true,
  optionsColumn = false,
  rowOptions,
  rowActions,
  columnOptions,
  columnActions,
  onPinRow,
  onDeleteRow,
  onFreezeColumn,
  getRowId = (row: T, index: number) => String((row as any)?.id ?? (row as any)?.key ?? index),
  loading = false,
  emptyState,
  toolbarActions,
  striped = false,
  bordered = true,
  hoverable = true,
  compact = false,
  showColumnVisibility = true,
  slots = {},
  slotProps = {},
  ...props
}: DataTableProps<T>) => {
  const data = useMemo<T[]>(
    () => (Array.isArray(rawData) ? rawData.filter((r): r is T => Boolean(r && typeof r === 'object')) : []),
    [rawData]
  )
  const columns = useMemo<DataTableColumn<T>[]>(
    () =>
      Array.isArray(rawColumns)
        ? rawColumns
            .filter((c): c is DataTableColumn<T> => Boolean(c && typeof c === 'object' && (c.id != null || c.accessorKey != null || c.header != null)))
            .map((c, idx) => ({
              ...c,
              id: String(c.id ?? c.accessorKey ?? idx),
              header: c.header ?? String(c.accessorKey ?? c.id ?? `Column ${idx + 1}`),
            }))
        : [],
    [rawColumns]
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<DataTableSortDirection>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [activePageSize, setActivePageSize] = useState(pageSize)
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [pinnedRows, setPinnedRows] = useState<Set<string>>(new Set())
  const [columnFreezeState, setColumnFreezeState] = useState<Record<string, boolean>>({})

  // Sync activePageSize if controlled prop changes
  useEffect(() => {
    setActivePageSize(pageSize)
    setCurrentPage(1)
  }, [pageSize])

  // Resizing state
  const [resizingCol, setResizingCol] = useState<string | null>(null)
  const resizeStartX = useRef(0)
  const resizeStartWidth = useRef(0)

  // Effective row actions / column options / pagination / selection
  const effectiveRowOptions = rowOptions || rowActions
  const effectiveColumnOptions = columnOptions || columnActions
  const hasOptionsCol = optionsColumn || !!effectiveRowOptions
  const isPaginationActive = enablePagination !== undefined ? enablePagination : pagination
  const isRowSelectionActive = enableSelection !== undefined ? enableSelection : enableRowSelection

  // Sync controlled selection if provided
  useEffect(() => {
    if (selectedRowIds !== undefined) {
      const map: Record<string, boolean> = {}
      selectedRowIds.forEach((id) => {
        map[id] = true
      })
      setRowSelection(map)
    }
  }, [selectedRowIds])

  // Initialize visibility and freeze states
  useEffect(() => {
    setColumnVisibility((prev) => {
      const next: Record<string, boolean> = {}
      columns.forEach((col) => {
        next[col.id] = typeof prev[col.id] === 'boolean' ? (prev[col.id] as boolean) : true
      })
      return next
    })

    setColumnFreezeState((prev) => {
      const next: Record<string, boolean> = {}
      columns.forEach((col) => {
        next[col.id] = typeof prev[col.id] === 'boolean' ? (prev[col.id] as boolean) : (col.freeze ?? false)
      })
      return next
    })
  }, [columns])

  // Group columns into Left-Frozen, Center Unfrozen, Right-Frozen
  const leftFrozenColumns = useMemo(() => {
    return columns.filter(
      (col) =>
        (columnFreezeState[col.id] ?? col.freeze ?? false) &&
        col.freezeAlign !== 'right' &&
        columnVisibility[col.id] !== false
    )
  }, [columns, columnFreezeState, columnVisibility])

  const regularColumns = useMemo(() => {
    return columns.filter(
      (col) =>
        !(columnFreezeState[col.id] ?? col.freeze ?? false) &&
        columnVisibility[col.id] !== false
    )
  }, [columns, columnFreezeState, columnVisibility])

  const rightFrozenColumns = useMemo(() => {
    return columns.filter(
      (col) =>
        (columnFreezeState[col.id] ?? col.freeze ?? false) &&
        col.freezeAlign === 'right' &&
        columnVisibility[col.id] !== false
    )
  }, [columns, columnFreezeState, columnVisibility])

  // Full ordered visible columns
  const visibleColumns = useMemo(() => {
    return [...leftFrozenColumns, ...regularColumns, ...rightFrozenColumns]
  }, [leftFrozenColumns, regularColumns, rightFrozenColumns])

  // Global search filtering
  const searchedData = useMemo(() => {
    if (!searchTerm.trim()) return data
    const query = searchTerm.toLowerCase().trim()

    return data.filter((row) => {
      return columns.some((col) => {
        if (col.filterable === false) return false
        const val = resolveRowValue(row, col.accessorKey, col.accessorFn)
        if (val == null) return false
        return String(val).toLowerCase().includes(query)
      })
    })
  }, [data, searchTerm, columns])

  // Sort data (with pinned rows always elevated to top)
  const sortedData = useMemo(() => {
    const pinned: T[] = []
    const unpinned: T[] = []

    searchedData.forEach((row, idx) => {
      const id = getRowId(row, idx)
      if (pinnedRows.has(id)) {
        pinned.push(row)
      } else {
        unpinned.push(row)
      }
    })

    if (sortColumn && sortDirection) {
      const col = columns.find((c) => c.id === sortColumn)
      if (col && col.sortable !== false) {
        unpinned.sort((a, b) => {
          const aVal = resolveRowValue(a, col.accessorKey, col.accessorFn)
          const bVal = resolveRowValue(b, col.accessorKey, col.accessorFn)

          if (aVal == null && bVal == null) return 0
          if (aVal == null) return 1
          if (bVal == null) return -1

          let cmp = 0
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            cmp = aVal - bVal
          } else if (aVal instanceof Date && bVal instanceof Date) {
            cmp = aVal.getTime() - bVal.getTime()
          } else {
            cmp = String(aVal).localeCompare(String(bVal), undefined, {
              numeric: true,
              sensitivity: 'base',
            })
          }

          return sortDirection === 'desc' ? -cmp : cmp
        })
      }
    }

    return [...pinned, ...unpinned]
  }, [searchedData, sortColumn, sortDirection, columns, pinnedRows, getRowId])

  // Pagination slicing
  const paginatedData = useMemo(() => {
    if (!isPaginationActive) return sortedData
    const start = (currentPage - 1) * activePageSize
    return sortedData.slice(start, start + activePageSize)
  }, [sortedData, isPaginationActive, currentPage, activePageSize])

  const totalPages = Math.max(1, Math.ceil(sortedData.length / activePageSize))

  // Ensure current page is valid
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  // Selection handlers
  const selectedRowsList = useMemo(() => {
    return sortedData.filter((row, idx) => {
      const id = getRowId(row, idx)
      return !!rowSelection[id]
    })
  }, [sortedData, rowSelection, getRowId])

  const isAllPageSelected = useMemo(() => {
    if (paginatedData.length === 0) return false
    return paginatedData.every((row, idx) => {
      const id = getRowId(row, (currentPage - 1) * activePageSize + idx)
      return !!rowSelection[id]
    })
  }, [paginatedData, rowSelection, currentPage, activePageSize, getRowId])

  const isSomePageSelected = useMemo(() => {
    return paginatedData.some((row, idx) => {
      const id = getRowId(row, (currentPage - 1) * activePageSize + idx)
      return !!rowSelection[id]
    })
  }, [paginatedData, rowSelection, currentPage, activePageSize, getRowId])

  const notifySelection = useCallback(
    (nextMap: Record<string, boolean>) => {
      const selectedItems = sortedData.filter((r, i) => nextMap[getRowId(r, i)])
      const selectedKeys = Object.keys(nextMap)
      onSelectionChange?.(selectedItems, selectedKeys)
      onRowSelectionChange?.(selectedItems, selectedKeys)
    },
    [sortedData, getRowId, onSelectionChange, onRowSelectionChange]
  )

  const toggleSelectAll = useCallback(
    (checked: boolean) => {
      const next = { ...rowSelection }
      paginatedData.forEach((row, idx) => {
        const id = getRowId(row, (currentPage - 1) * activePageSize + idx)
        if (checked) {
          next[id] = true
        } else {
          delete next[id]
        }
      })
      setRowSelection(next)
      notifySelection(next)
    },
    [rowSelection, paginatedData, getRowId, currentPage, activePageSize, notifySelection]
  )

  const toggleSelectRow = useCallback(
    (row: T, index: number, checked: boolean) => {
      const id = getRowId(row, (currentPage - 1) * activePageSize + index)
      const next = { ...rowSelection }
      if (checked) {
        next[id] = true
      } else {
        delete next[id]
      }
      setRowSelection(next)
      notifySelection(next)
    },
    [getRowId, currentPage, activePageSize, rowSelection, notifySelection]
  )

  // Row pinning
  const togglePinRow = useCallback(
    (row: T, index: number) => {
      const id = getRowId(row, index)
      setPinnedRows((prev) => {
        const next = new Set(prev)
        const isPinned = !next.has(id)
        if (isPinned) {
          next.add(id)
        } else {
          next.delete(id)
        }
        onPinRow?.(row, isPinned)
        return next
      })
    },
    [getRowId, onPinRow]
  )

  // Column freeze toggle
  const toggleFreezeColumn = useCallback(
    (colId: string) => {
      setColumnFreezeState((prev) => {
        const nextVal = !(prev[colId] ?? columns.find((c) => c.id === colId)?.freeze ?? false)
        onFreezeColumn?.(colId, nextVal)
        return { ...prev, [colId]: nextVal }
      })
    },
    [columns, onFreezeColumn]
  )

  // Column sort toggle
  const toggleSort = useCallback((colId: string) => {
    setSortColumn((prevCol) => {
      if (prevCol === colId) {
        if (sortDirection === 'asc') {
          setSortDirection('desc')
          return colId
        }
        if (sortDirection === 'desc') {
          setSortDirection(null)
          return null
        }
      }
      setSortDirection('asc')
      return colId
    })
  }, [sortDirection])

  // Column resize mouse drag
  const startResize = useCallback(
    (e: MouseEvent, colId: string, currentWidth: number) => {
      e.preventDefault()
      e.stopPropagation()
      setResizingCol(colId)
      resizeStartX.current = e.clientX
      resizeStartWidth.current = currentWidth

      const onMouseMove = (moveEvent: globalThis.MouseEvent) => {
        const deltaX = moveEvent.clientX - resizeStartX.current
        const col = columns.find((c) => c.id === colId)
        const minW = col?.minWidth ?? 60
        const maxW = col?.maxWidth ?? 800
        const newWidth = Math.max(minW, Math.min(maxW, resizeStartWidth.current + deltaX))

        setColumnWidths((prev) => ({ ...prev, [colId]: newWidth }))
      }

      const onMouseUp = () => {
        setResizingCol(null)
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [columns]
  )

  // Precise sticky style computation
  const getStickyStyle = useCallback(
    (col: DataTableColumn<T>, isHeader = false): CSSProperties => {
      const isFrozen = columnFreezeState[col.id] ?? col.freeze ?? false
      if (!isFrozen) {
        if (isHeader) {
          return {
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }
        }
        return {}
      }

      const isLeft = col.freezeAlign !== 'right'

      if (isLeft) {
        const idxInLeft = leftFrozenColumns.findIndex((c) => c.id === col.id)
        let leftOffset = isRowSelectionActive ? 48 : 0
        for (let i = 0; i < idxInLeft; i++) {
          const prevCol = leftFrozenColumns[i]
          if (!prevCol) continue
          const w =
            columnWidths[prevCol.id] ||
            (typeof prevCol.width === 'number'
              ? prevCol.width
              : typeof prevCol.width === 'string'
                ? parseInt(prevCol.width, 10)
                : 180)
          leftOffset += w
        }

        return {
          position: 'sticky',
          top: isHeader ? 0 : undefined,
          left: `${leftOffset}px`,
          zIndex: isHeader ? 30 : 20,
        }
      } else {
        const idxInRight = rightFrozenColumns.findIndex((c) => c.id === col.id)
        let rightOffset = hasOptionsCol ? 48 : 0
        for (let i = rightFrozenColumns.length - 1; i > idxInRight; i--) {
          const nextCol = rightFrozenColumns[i]
          if (!nextCol) continue
          const w =
            columnWidths[nextCol.id] ||
            (typeof nextCol.width === 'number'
              ? nextCol.width
              : typeof nextCol.width === 'string'
                ? parseInt(nextCol.width, 10)
                : 180)
          rightOffset += w
        }

        return {
          position: 'sticky',
          top: isHeader ? 0 : undefined,
          right: `${rightOffset}px`,
          zIndex: isHeader ? 30 : 20,
        }
      }
    },
    [columnFreezeState, leftFrozenColumns, rightFrozenColumns, columnWidths, isRowSelectionActive, hasOptionsCol]
  )

  // Calculate total table width
  const totalTableWidth = useMemo(() => {
    let width = isRowSelectionActive ? 48 : 0
    visibleColumns.forEach((col) => {
      const colW =
        columnWidths[col.id] ||
        (typeof col.width === 'number'
          ? col.width
          : typeof col.width === 'string'
            ? parseInt(col.width, 10)
            : 180)
      width += colW
    })
    if (hasOptionsCol) {
      width += 48
    }
    return width
  }, [isRowSelectionActive, visibleColumns, columnWidths, hasOptionsCol])

  const contextValue = useMemo<DataTableContextValue<T>>(
    () => ({
      state: {
        data,
        columns,
        visibleColumns,
        leftFrozenColumns,
        regularColumns,
        rightFrozenColumns,
        searchedData,
        sortedData,
        paginatedData,
        searchTerm,
        sortColumn,
        sortDirection,
        currentPage,
        totalPages,
        pageSize: activePageSize,
        pageSizeOptions,
        rowSelection,
        selectedRowsList,
        isAllPageSelected,
        isSomePageSelected,
        columnVisibility,
        columnFreezeState,
        columnWidths,
        pinnedRows,
        resizingCol,
        totalTableWidth,
        enableRowSelection: isRowSelectionActive,
        enableSelection: isRowSelectionActive,
        enableRowPinning,
        optionsColumn,
        hasOptionsCol,
        loading,
        striped,
        bordered,
        hoverable,
        compact,
        searchable,
        searchPlaceholder,
        showColumnVisibility,
        pagination: isPaginationActive,
        enablePagination: isPaginationActive,
        height,
        bodyHeight,
        maxHeight,
        minHeight,
        emptyState,
        toolbarActions,
      },
      actions: {
        setSearchTerm,
        setCurrentPage,
        setPageSize: setActivePageSize,
        toggleSort,
        toggleSelectAll,
        toggleSelectRow,
        togglePinRow,
        toggleFreezeColumn,
        setColumnVisibility,
        startResize,
        getStickyStyle,
        getRowId,
        onRowClick,
        effectiveRowOptions,
        effectiveColumnOptions,
        onDeleteRow,
      },
      slots,
      slotProps,
    }),
    [
      data,
      columns,
      visibleColumns,
      leftFrozenColumns,
      regularColumns,
      rightFrozenColumns,
      searchedData,
      sortedData,
      paginatedData,
      searchTerm,
      sortColumn,
      sortDirection,
      currentPage,
      totalPages,
      activePageSize,
      pageSizeOptions,
      rowSelection,
      selectedRowsList,
      isAllPageSelected,
      isSomePageSelected,
      columnVisibility,
      columnFreezeState,
      columnWidths,
      pinnedRows,
      resizingCol,
      totalTableWidth,
      enableRowSelection,
      enableRowPinning,
      optionsColumn,
      hasOptionsCol,
      loading,
      striped,
      searchable,
      searchPlaceholder,
      showColumnVisibility,
      pagination,
      height,
      bodyHeight,
      maxHeight,
      minHeight,
      emptyState,
      toolbarActions,
      toggleSort,
      toggleSelectAll,
      toggleSelectRow,
      togglePinRow,
      toggleFreezeColumn,
      startResize,
      getStickyStyle,
      getRowId,
      onRowClick,
      effectiveRowOptions,
      effectiveColumnOptions,
      onDeleteRow,
      slots,
      slotProps,
    ]
  )

  return (
    <DataTableContext.Provider value={contextValue}>
      <div
        data-slot="data-table"
        className={cn(
          '@container flex flex-col rounded-macro border border-border bg-bg text-fg shadow-xs overflow-hidden',
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
            {/* Top action toolbar */}
            {searchable || showColumnVisibility || toolbarActions ? (
              slots.toolbar ? (
                renderSlot(slots.toolbar, slotProps.toolbar)
              ) : (
                <DataTableToolbar
                  slots={{
                    search: slots.search,
                    selectionBadge: slots.selectionBadge,
                    columnVisibility: slots.columnVisibility,
                    toolbarActions: slots.toolbarActions,
                    ...slotProps.toolbar?.slots,
                  }}
                  slotProps={slotProps.toolbar?.slotProps}
                  {...slotProps.toolbar}
                />
              )
            ) : null}

            {/* Main Table Viewport Container */}
            {slots.container ? (
              renderSlot(slots.container, slotProps?.container)
            ) : (
              <DataTableContainer
                maxHeight={maxHeight ?? height ?? bodyHeight}
                minHeight={minHeight}
                {...slotProps?.container}
              >
                {slots.header ? (
                  renderSlot(slots.header, slotProps?.header)
                ) : (
                  <DataTableHeader
                    slots={{
                      columnActionTrigger: slots.columnActionTrigger,
                      resizer: slots.resizer,
                      ...slotProps?.header?.slots,
                    }}
                    slotProps={slotProps?.header?.slotProps}
                    {...slotProps?.header}
                  />
                )}
                {slots.body ? (
                  renderSlot(slots.body, slotProps?.body)
                ) : (
                  <DataTableBody
                    slots={{
                      row: slots.row,
                      loader: slots.loader,
                      emptyState: slots.emptyState,
                      rowActionTrigger: slots.rowActionTrigger,
                      ...slotProps?.body?.slots,
                    }}
                    slotProps={slotProps?.body?.slotProps}
                    {...slotProps?.body}
                  />
                )}
              </DataTableContainer>
            )}

            {/* Pagination Footer */}
            {pagination && (
              slots.pagination ? (
                renderSlot(slots.pagination, slotProps?.pagination)
              ) : (
                <DataTablePagination
                  slots={{
                    pageSizeSelect: slots.pageSizeSelect,
                    ...slotProps?.pagination?.slots,
                  }}
                  slotProps={slotProps?.pagination?.slotProps}
                  {...slotProps?.pagination}
                />
              )
            )}
          </>
        )}
      </div>
    </DataTableContext.Provider>
  )
}

export const DataTable = createInterfaceComponent<DataTableProps<any>, DataTableSlots>(
  {
    name: 'DataTable',
    category: 'data',
    description: 'Enterprise data table with sticky column freezing, interactive column resizing, sorting, row pinning, and pagination.',
    version: '1.0.0',
    props: {
      searchable: true,
      pagination: true,
      pageSize: 10,
      pageSizeOptions: [10, 25, 50, 100],
      enableRowSelection: false,
      enableRowPinning: true,
      optionsColumn: false,
      loading: false,
      striped: false,
      showColumnVisibility: true,
    },
    slots: {
      toolbar: DataTableToolbar,
      search: DataTableSearch,
      selectionBadge: DataTableSelectionBadge,
      columnVisibility: DataTableColumnVisibility,
      toolbarActions: DataTableToolbarActions,
      container: DataTableContainer,
      header: DataTableHeader,
      body: DataTableBody,
      row: DataTableRow,
      emptyState: DataTableEmptyState,
      loader: DataTableLoader,
      pagination: DataTablePagination,
      pageSizeSelect: undefined,
      rowActionTrigger: undefined,
    },
  },
  DataTablePrimitive as any
)

// Compound Subcomponent Attachments
DataTable.Provider = DataTableProvider
DataTable.Toolbar = DataTableToolbar
DataTable.Search = DataTableSearch
DataTable.SelectionBadge = DataTableSelectionBadge
DataTable.SelectionBar = DataTableSelectionBadge
DataTable.ColumnVisibility = DataTableColumnVisibility
DataTable.ColumnManager = DataTableColumnVisibility
DataTable.ToolbarActions = DataTableToolbarActions
DataTable.ExportButton = DataTableToolbarActions
DataTable.Container = DataTableContainer
DataTable.Header = DataTableHeader
DataTable.Head = DataTableHeaderCell
DataTable.HeaderCell = DataTableHeaderCell
DataTable.Body = DataTableBody
DataTable.Row = DataTableRow
DataTable.Cell = DataTableCell
DataTable.Loader = DataTableLoader
DataTable.EmptyState = DataTableEmptyState
DataTable.Pagination = DataTablePagination


