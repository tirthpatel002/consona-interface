import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type UIEvent,
  type WheelEvent,
} from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/20/solid'
import {
  Pagination,
  PaginationFirst,
  PaginationGap,
  PaginationItem,
  PaginationLast,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
  type PaginationProps,
} from '../pagination'
import { Loader, type LoaderProps } from '../loader'

/* ==========================================================================
   PaginatedSection Configuration & Types
   ========================================================================== */

export interface PaginationConfig {
  /** Maximum number of items to load at once. */
  maxLoadedItems?: number
  /** Number of items per page when fixed or as calculation baseline. */
  appendCount?: number
  /** Maximum height of the section (in pixels or CSS value string). */
  maxHeight?: string | number
  /** Fixed number of items per page (overrides dynamic viewport measurement). */
  itemsPerPage?: number
  /** Whether to dynamically calculate items per page based on viewport height. */
  calculateByViewport?: boolean
  /** Space reserved in pixels for header/footer controls in calculation @default 80. */
  reservedControlHeight?: number
}

export interface PaginatedSectionSlots {
  /** Loading indicator slot. */
  loader?: React.ComponentType<LoaderProps>
  /** Empty state placeholder slot. */
  emptyState?: React.ComponentType<HTMLAttributes<HTMLDivElement>>
  /** Underlying Pagination composite slot. */
  pagination?: React.ComponentType<PaginationProps>
}

export interface PaginatedSectionProps<T = any>
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'slots' | 'slotProps'> {
  /** Array of items to paginate. */
  items?: T[]
  /** Alias for items prop. */
  data?: T[]
  /** Children to paginate (alternative to items prop). */
  children?: ReactNode | ReactNode[]
  /** Pagination configuration options. */
  pagination?: PaginationConfig
  /** Direct fixed items per page prop. */
  itemsPerPage?: number
  /** Mode: 'auto' (viewport calculation) or 'fixed'. */
  mode?: 'auto' | 'fixed'
  /** Direct maxHeight prop. */
  maxHeight?: string | number
  /** Direct append count prop. */
  appendCount?: number
  /** Grid column configuration. */
  gridCols?: number | { sm?: number; md?: number; lg?: number; xl?: number }
  /** Gap between items. */
  gap?: string | number
  /** Custom class for inner content list/grid container. */
  contentClassName?: string
  /** Custom render function for each item. */
  renderItem?: (item: T, index: number) => ReactNode
  /** Whether to render pagination controls. @default true */
  showControls?: boolean
  /** Custom render function for pagination controls. */
  renderControls?: (props: {
    currentPage: number
    totalPages: number
    totalItems: number
    pageSize: number
    onPrevious: () => void
    onNext: () => void
    onPageChange: (page: number) => void
    canGoPrevious: boolean
    canGoNext: boolean
  }) => ReactNode
  /** Callback when page number changes. */
  onPageChange?: (page: number) => void
  /** Initial page number (1-indexed). @default 1 */
  initialPage?: number
  /** Controlled current page. */
  page?: number
  /** Loading state. */
  loading?: boolean
  /** Empty state component. */
  emptyState?: ReactNode
  /** Forwarded ref for the container. */
  ref?: React.Ref<HTMLDivElement>
  /** Injected slot component overrides. */
  slots?: SlotComponents<PaginatedSectionSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<PaginatedSectionSlots>
}

/* ==========================================================================
   PaginatedSection Dedicated Pagination Component
   ========================================================================== */

export interface PaginatedSectionPaginationProps extends HTMLAttributes<HTMLDivElement> {
  /** 1-based index of the currently active page. */
  currentPage: number
  /** Total count of pages available. */
  totalPages: number
  /** Total number of items across all pages. */
  totalItems: number
  /** Number of items rendered per page. */
  pageSize?: number
  /** Handler to navigate to previous page. */
  onPrevious: () => void
  /** Handler to navigate to next page. */
  onNext: () => void
  /** Handler to navigate directly to a specific page number. */
  onPageChange: (page: number) => void
  /** Whether the previous page navigation action is allowed. */
  canGoPrevious: boolean
  /** Whether the next page navigation action is allowed. */
  canGoNext: boolean
}

const PaginatedSectionPaginationPrimitive = ({
  className,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPrevious,
  onNext,
  onPageChange,
  canGoPrevious,
  canGoNext,
  ...props
}: PaginatedSectionPaginationProps) => {
  const pageNumbers: (number | 'gap')[] = []
  const delta = 1

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      pageNumbers.push(i)
    } else if (
      (i === currentPage - delta - 1 && i > 1) ||
      (i === currentPage + delta + 1 && i < totalPages)
    ) {
      pageNumbers.push('gap')
    }
  }

  const cleanPages: (number | 'gap')[] = []
  for (const p of pageNumbers) {
    if (p === 'gap' && cleanPages[cleanPages.length - 1] === 'gap') continue
    cleanPages.push(p)
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

  const startItem = pageSize ? (totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1) : null
  const endItem = pageSize ? Math.min(currentPage * pageSize, totalItems) : null

  return (
    <div
      data-slot="paginated-controls"
      className={cn(
        '@container flex flex-col @[640px]:flex-row items-center justify-between gap-3 border-t border-border/70 bg-muted/20 px-3 py-3 sm:px-4 shrink-0 w-full overflow-hidden',
        className
      )}
      {...props}
    >
      {/* Above row on smaller screens: Entries Summary */}
      <div className="flex items-center justify-between gap-3 text-xs w-full @[640px]:w-auto pb-2 border-b border-border/40 @[640px]:pb-0 @[640px]:border-b-0">
        <span className="whitespace-nowrap text-muted-fg">
          {startItem !== null && endItem !== null ? (
            <>
              Showing <span className="font-semibold text-fg">{startItem}</span>–<span className="font-semibold text-fg">{endItem}</span> of{' '}
              <span className="font-semibold text-fg">{totalItems}</span>
            </>
          ) : (
            <>
              Total <span className="font-semibold text-fg">{totalItems}</span> items
            </>
          )}
        </span>
        <span className="text-muted-fg font-medium tabular-nums whitespace-nowrap">
          Page <span className="font-semibold text-fg">{currentPage}</span> / {totalPages || 1}
        </span>
      </div>

      {/* Below row on smaller screens: Pagination Navigation Controls */}
      <nav aria-label="Pagination" className="flex items-center justify-between @[640px]:justify-end gap-1.5 shrink-0 w-full @[640px]:w-auto">
        <button
          type="button"
          aria-label="First page"
          disabled={!canGoPrevious}
          onClick={() => onPageChange?.(1)}
          className={cn(navButtonClasses(false, !canGoPrevious), 'hidden @[640px]:inline-flex')}
        >
          <ChevronDoubleLeftIcon className="size-4 shrink-0" />
        </button>

        <button
          type="button"
          aria-label="Previous page"
          disabled={!canGoPrevious}
          onClick={onPrevious}
          className={cn(navButtonClasses(false, !canGoPrevious), 'px-3 gap-1')}
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
          {cleanPages.map((p, idx) => {
            if (p === 'gap') {
              return (
                <span
                  key={`gap-${idx}`}
                  className="flex size-8 items-center justify-center text-muted-fg text-xs select-none"
                >
                  …
                </span>
              )
            }
            const isCurrent = p === currentPage
            return (
              <button
                key={`page-${p}`}
                type="button"
                aria-current={isCurrent ? 'page' : undefined}
                onClick={() => onPageChange?.(p)}
                className={navButtonClasses(isCurrent, false)}
              >
                {p}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          aria-label="Next page"
          disabled={!canGoNext}
          onClick={onNext}
          className={cn(navButtonClasses(false, !canGoNext), 'px-3 gap-1')}
        >
          <span>Next</span>
          <ChevronRightIcon className="size-4 shrink-0" />
        </button>

        <button
          type="button"
          aria-label="Last page"
          disabled={!canGoNext}
          onClick={() => onPageChange?.(totalPages)}
          className={cn(navButtonClasses(false, !canGoNext), 'hidden @[640px]:inline-flex')}
        >
          <ChevronDoubleRightIcon className="size-4 shrink-0" />
        </button>
      </nav>
    </div>
  )
}

export const PaginatedSectionPagination = createInterfaceComponent<PaginatedSectionPaginationProps>(
  {
    name: 'PaginatedSectionPagination',
    category: 'navigation',
    description: 'Dedicated pagination footer controls for PaginatedSection.',
    version: '1.0.0',
  },
  PaginatedSectionPaginationPrimitive
)

const PaginatedSectionPrimitive = <T extends any>({
  items,
  data,
  children,
  pagination = {},
  itemsPerPage: topItemsPerPage,
  mode,
  maxHeight: topMaxHeight,
  appendCount: topAppendCount,
  gridCols,
  gap,
  contentClassName,
  renderItem,
  showControls = true,
  renderControls,
  onPageChange,
  initialPage = 1,
  page: controlledPage,
  loading = false,
  emptyState,
  className,
  style,
  ref,
  slots = {},
  slotProps = {},
  ...props
}: PaginatedSectionProps<T>) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const measurementRef = useRef<HTMLDivElement | null>(null)

  const isFixedMode = mode === 'fixed' || topItemsPerPage !== undefined || pagination.itemsPerPage !== undefined
  const fixedItemsPerPage = topItemsPerPage ?? pagination.itemsPerPage
  const maxHeight = topMaxHeight ?? pagination.maxHeight
  const appendCount = topAppendCount ?? pagination.appendCount ?? (fixedItemsPerPage || 10)
  const calculateByViewport = isFixedMode ? false : (pagination.calculateByViewport ?? true)
  const reservedControlHeight = pagination.reservedControlHeight ?? 72
  const maxLoadedItems = pagination.maxLoadedItems

  const [uncontrolledPage, setUncontrolledPage] = useState(initialPage)
  const currentPage = controlledPage !== undefined ? controlledPage : uncontrolledPage

  const [itemsPerPage, setItemsPerPage] = useState<number | null>(() => fixedItemsPerPage ?? null)
  const [totalPages, setTotalPages] = useState(1)

  // Normalize items and children
  const allItems = useMemo(() => {
    if (items !== undefined) return items
    if (data !== undefined) return data
    if (children !== undefined) return React.Children.toArray(children) as T[]
    return []
  }, [items, data, children])

  // Calculate items per page dynamically or from props
  const calculateItemsPerPage = useCallback(() => {
    if (fixedItemsPerPage) {
      return fixedItemsPerPage
    }

    if (!calculateByViewport || !containerRef.current || !measurementRef.current) {
      return appendCount
    }

    const container = containerRef.current
    const measurement = measurementRef.current

    const containerHeight = maxHeight
      ? typeof maxHeight === 'number'
        ? maxHeight
        : parseFloat(String(maxHeight))
      : container.clientHeight

    if (!containerHeight || containerHeight <= 0) {
      return appendCount
    }

    const sampleChildren = measurement.children
    if (sampleChildren.length === 0) {
      return appendCount
    }

    let totalHeight = 0
    let measuredCount = 0
    const sampleCount = Math.min(5, sampleChildren.length)

    for (let i = 0; i < sampleCount; i++) {
      const child = sampleChildren[i] as HTMLElement
      if (child) {
        totalHeight += child.offsetHeight
        measuredCount++
      }
    }

    if (measuredCount === 0 || totalHeight === 0) {
      return appendCount
    }

    const avgItemHeight = totalHeight / measuredCount
    const availableHeight = Math.max(50, containerHeight - reservedControlHeight)
    const calculated = Math.max(1, Math.floor(availableHeight / avgItemHeight))

    if (maxLoadedItems) {
      return Math.min(calculated, maxLoadedItems)
    }

    return calculated
  }, [fixedItemsPerPage, calculateByViewport, appendCount, maxHeight, reservedControlHeight, maxLoadedItems])

  // ResizeObserver for dynamic viewport height calculation
  useEffect(() => {
    if (!containerRef.current || !calculateByViewport) return

    const container = containerRef.current
    const ro = new ResizeObserver(() => {
      const nextCount = calculateItemsPerPage()
      setItemsPerPage((prev) => (prev !== nextCount ? nextCount : prev))
    })

    ro.observe(container)
    return () => ro.disconnect()
  }, [calculateByViewport, calculateItemsPerPage])

  // Initial calculation
  useEffect(() => {
    const initial = calculateItemsPerPage()
    setItemsPerPage(initial)
  }, [calculateItemsPerPage])

  // Total page calculation
  const effectivePageSize = itemsPerPage ?? appendCount
  useEffect(() => {
    const count = Math.max(1, Math.ceil(allItems.length / effectivePageSize))
    setTotalPages(count)

    if (currentPage > count && count > 0) {
      const targetPage = Math.max(1, count)
      if (controlledPage === undefined) {
        setUncontrolledPage(targetPage)
      }
      onPageChange?.(targetPage)
    }
  }, [allItems.length, effectivePageSize, currentPage, controlledPage, onPageChange])

  // Sliced items for active page
  const currentPageItems = useMemo(() => {
    const start = (currentPage - 1) * effectivePageSize
    const end = start + effectivePageSize
    return allItems.slice(start, end)
  }, [allItems, currentPage, effectivePageSize])

  // Handlers
  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage < 1 || newPage > totalPages) return
      if (controlledPage === undefined) {
        setUncontrolledPage(newPage)
      }
      onPageChange?.(newPage)

      if (contentRef.current) {
        contentRef.current.scrollTop = 0
      }
    },
    [totalPages, controlledPage, onPageChange]
  )

  const handlePrevious = useCallback(() => {
    handlePageChange(currentPage - 1)
  }, [currentPage, handlePageChange])

  const handleNext = useCallback(() => {
    handlePageChange(currentPage + 1)
  }, [currentPage, handlePageChange])

  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages

  // Combined refs
  const setCombinedRef = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
      }
    },
    [ref]
  )

  const defaultLoader = (
    <div
      ref={setCombinedRef}
      data-slot="paginated-loader"
      className={cn('flex flex-col items-center justify-center p-12 text-muted-fg', className)}
      style={{
        maxHeight: maxHeight ? (typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight) : undefined,
        ...style,
      }}
      {...props}
    >
      <Loader size="md" />
      <span className="mt-3 text-sm font-medium">Loading items...</span>
    </div>
  )

  const defaultEmptyState = (
    <div
      ref={setCombinedRef}
      data-slot="paginated-empty-state"
      className={cn('flex flex-col items-center justify-center p-10 text-center text-sm text-muted-fg', className)}
      style={{
        maxHeight: maxHeight ? (typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight) : undefined,
        ...style,
      }}
      {...props}
    >
      {emptyState || <div>No items to display</div>}
    </div>
  )

  if (loading) {
    return slots.loader ? renderSlot(slots.loader, slotProps?.loader as object) : defaultLoader
  }

  if (allItems.length === 0) {
    return slots.emptyState ? renderSlot(slots.emptyState, slotProps?.emptyState as object) : defaultEmptyState
  }

  // Build visible pagination items
  const renderPaginationItems = () => {
    const pageNumbers: (number | 'gap')[] = []
    const delta = 1

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pageNumbers.push(i)
      } else if (
        (i === currentPage - delta - 1 && i > 1) ||
        (i === currentPage + delta + 1 && i < totalPages)
      ) {
        pageNumbers.push('gap')
      }
    }

    const cleanPages: (number | 'gap')[] = []
    for (const p of pageNumbers) {
      if (p === 'gap' && cleanPages[cleanPages.length - 1] === 'gap') continue
      cleanPages.push(p)
    }

    return cleanPages.map((p, idx) => {
      if (p === 'gap') {
        return <PaginationGap key={`gap-${idx}`} />
      }
      return (
        <PaginationItem
          key={`page-${p}`}
          isCurrent={p === currentPage}
          onClick={() => handlePageChange(p)}
        >
          {p}
        </PaginationItem>
      )
    })
  }

  return (
    <div
      ref={setCombinedRef}
      data-slot="paginated-section"
      className={cn(
        '@container flex flex-col justify-between overflow-hidden rounded-macro border border-border bg-bg shadow-xs',
        className
      )}
      style={{
        maxHeight: maxHeight ? (typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight) : undefined,
        ...style,
      }}
      {...props}
    >
      {/* Hidden measurement container for dynamic estimation */}
      <div
        ref={measurementRef}
        aria-hidden="true"
        className="pointer-events-none absolute opacity-0 -z-50"
        style={{ visibility: 'hidden' }}
      >
        {allItems.slice(0, 5).map((item, index) => (
          <div key={`measure-${index}`}>{renderItem ? renderItem(item, index) : (item as ReactNode)}</div>
        ))}
      </div>

      {/* Content list / grid */}
      <div ref={contentRef} data-slot="paginated-content" className="flex-1 overflow-y-auto p-3 sm:p-4">
        <div
          className={cn(
            gridCols
              ? typeof gridCols === 'number'
                ? gridCols === 1
                  ? 'grid grid-cols-1'
                  : gridCols === 2
                  ? 'grid grid-cols-1 sm:grid-cols-2'
                  : gridCols === 4
                  ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                  : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              : 'flex flex-col gap-2',
            contentClassName
          )}
          style={{ gap: gap !== undefined ? (typeof gap === 'number' ? `${gap}px` : gap) : undefined }}
        >
          {currentPageItems.map((item, index) => {
            const globalIndex = (currentPage - 1) * effectivePageSize + index
            return (
              <React.Fragment key={globalIndex}>
                {renderItem ? renderItem(item, globalIndex) : (item as ReactNode)}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Pagination Controls Footer */}
      {showControls && (
        renderControls ? (
          renderControls({
            currentPage,
            totalPages,
            totalItems: allItems.length,
            pageSize: effectivePageSize,
            onPrevious: handlePrevious,
            onNext: handleNext,
            onPageChange: handlePageChange,
            canGoPrevious,
            canGoNext,
          })
        ) : slots.pagination ? (
          renderSlot(slots.pagination, slotProps?.pagination as object)
        ) : (
          <PaginatedSectionPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={allItems.length}
            pageSize={effectivePageSize}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onPageChange={handlePageChange}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
          />
        )
      )}
    </div>
  )
}

export const PaginatedSection = createInterfaceComponent<
  PaginatedSectionProps<any>,
  PaginatedSectionSlots
>(
  {
    name: 'PaginatedSection',
    category: 'data',
    description: 'Dynamic data section container with automatic viewport-based or fixed page calculations and pagination controls.',
    version: '1.0.0',
    props: {
      showControls: true,
      initialPage: 1,
      loading: false,
    },
    slots: {
      loader: undefined,
      emptyState: undefined,
      pagination: undefined,
    },
  },
  PaginatedSectionPrimitive as any
)

/* ==========================================================================
   InfiniteScrollSection Re-export for Backwards Compatibility
   ========================================================================== */

export * from '../infinite-scroll-section'

