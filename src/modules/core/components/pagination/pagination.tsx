import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
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
import { buttonStyles } from '../button'
import { Link, type LinkProps } from '../link'
import { usePagination } from '../../hooks/use-pagination'

/* ==========================================================================
   Scroll track context — pins sit outside the list and disable at the edges
   ========================================================================== */

interface PaginationScrollContextValue {
  registerList: (node: HTMLUListElement | null) => void
  startInView: boolean
  endInView: boolean
  scrollToEdge: (edge: 'start' | 'end') => void
}

const PaginationScrollContext = createContext<PaginationScrollContextValue | null>(null)

function readEdges(node: HTMLUListElement) {
  const max = Math.max(node.scrollWidth - node.clientWidth, 0)
  return {
    startInView: node.scrollLeft <= 1,
    endInView: max === 0 || node.scrollLeft >= max - 1,
  }
}

function usePaginationScroll() {
  return useContext(PaginationScrollContext)
}

/* ==========================================================================
   Pagination Root Primitive & Factory
   ========================================================================== */

export interface PaginationSlots {
  /** List container slot */
  list?: React.ComponentType<PaginationListProps>
}

export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  /** Additional CSS class names */
  className?: string
  /** Slot component overrides */
  slots?: SlotComponents<PaginationSlots>
  /** Slot props overrides */
  slotProps?: SlotPropsMap<PaginationSlots>
}

const PaginationPrimitive = ({
  className,
  slots = {},
  slotProps = {},
  children,
  ...props
}: PaginationProps) => {
  const listRef = useRef<HTMLUListElement | null>(null)
  const [edges, setEdges] = useState({ startInView: false, endInView: false })

  const registerList = useCallback((node: HTMLUListElement | null) => {
    listRef.current = node
    if (!node) return
    const next = readEdges(node)
    setEdges((prev) =>
      prev.startInView === next.startInView && prev.endInView === next.endInView ? prev : next
    )
  }, [])

  const scrollToEdge = useCallback((edge: 'start' | 'end') => {
    const node = listRef.current
    if (!node) return
    node.scrollTo({
      left: edge === 'start' ? 0 : node.scrollWidth,
      behavior: 'smooth',
    })
  }, [])

  const scroll = useMemo<PaginationScrollContextValue>(
    () => ({
      registerList,
      startInView: edges.startInView,
      endInView: edges.endInView,
      scrollToEdge,
    }),
    [edges.endInView, edges.startInView, registerList, scrollToEdge]
  )

  return (
    <PaginationScrollContext.Provider value={scroll}>
      <nav
        data-slot="pagination"
        aria-label="Pagination"
        className={cn(
          'mx-auto flex w-full min-w-0 max-w-full flex-nowrap items-center gap-1.5 py-space-2xs select-none',
          className
        )}
        {...props}
      >
        {renderSlot(slots.list, slotProps.list)}
        {children}
      </nav>
    </PaginationScrollContext.Provider>
  )
}

export const Pagination = createInterfaceComponent<PaginationProps, PaginationSlots>(
  {
    name: 'Pagination',
    category: 'navigation',
    description: 'Accessible page navigation system with first/last jumps, adjacent steppers, and page number matrices.',
    version: '1.0.0',
    slots: {
      list: undefined,
    },
  },
  PaginationPrimitive
)

/* ==========================================================================
   Pagination Sub-Atoms
   ========================================================================== */

export interface PaginationListSlots {
  /** First page jump button slot */
  first?: React.ComponentType<PaginationFirstProps>
  /** Previous page button slot */
  previous?: React.ComponentType<PaginationPreviousProps>
  /** Pages numbers matrix slot */
  pages?: React.ComponentType<PaginationPagesProps>
  /** Next page button slot */
  next?: React.ComponentType<PaginationNextProps>
  /** Last page jump button slot */
  last?: React.ComponentType<PaginationLastProps>
  /** Pinned start page button slot */
  start?: React.ComponentType<Omit<PaginationPinProps, 'edge'>>
  /** Pinned end page button slot */
  end?: React.ComponentType<Omit<PaginationPinProps, 'edge'>>
  /** Ellipsis gap slot */
  gap?: React.ComponentType<PaginationGapProps>
  /** Numbered page link item slot */
  item?: React.ComponentType<PaginationItemProps>
  /** Section slot */
  section?: React.ComponentType<PaginationSectionProps>
  /** Expanding spacer slot */
  spacer?: React.ComponentType<PaginationSpacerProps>
  /** Summary label slot */
  label?: React.ComponentType<PaginationLabelProps>
}

/** Unordered list that holds pagination items and sections. */
export interface PaginationListProps extends React.HTMLAttributes<HTMLUListElement> {
  /** Injected slot component overrides. */
  slots?: SlotComponents<PaginationListSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<PaginationListSlots>
}

const PaginationListPrimitive = ({ className, onScroll, children, slots, slotProps, ...props }: PaginationListProps) => {
  const scroll = usePaginationScroll()
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (!scroll) return
    const node = listRef.current
    scroll.registerList(node)
    if (!node) return
    const observer = new ResizeObserver(() => scroll.registerList(node))
    observer.observe(node)
    return () => {
      observer.disconnect()
      scroll.registerList(null)
    }
  }, [scroll])

  return (
    <ul
      ref={listRef}
      data-slot="pagination-list"
      onScroll={(event) => {
        onScroll?.(event)
        scroll?.registerList(event.currentTarget)
      }}
      className={cn(
        'no-scrollbar flex min-w-0 flex-nowrap items-center gap-1.5 overflow-x-auto overscroll-x-contain',
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          {renderSlot(slots?.first, slotProps?.first)}
          {renderSlot(slots?.previous, slotProps?.previous)}
          {renderSlot(slots?.start, slotProps?.start)}
          {renderSlot(slots?.pages, slotProps?.pages)}
          {renderSlot(slots?.gap, slotProps?.gap)}
          {renderSlot(slots?.item, slotProps?.item)}
          {renderSlot(slots?.section, slotProps?.section)}
          {renderSlot(slots?.end, slotProps?.end)}
          {renderSlot(slots?.next, slotProps?.next)}
          {renderSlot(slots?.last, slotProps?.last)}
          {renderSlot(slots?.spacer, slotProps?.spacer)}
          {renderSlot(slots?.label, slotProps?.label)}
        </>
      )}
    </ul>
  )
}

export interface PaginationSectionProps extends React.HTMLAttributes<HTMLLIElement> {}

const PaginationSectionPrimitive = ({ className, children, ...props }: PaginationSectionProps) => {
  return (
    <li
      data-slot="pagination-section"
      className={cn('flex flex-nowrap items-center gap-1.5', className)}
      {...props}
    >
      {children}
    </li>
  )
}

export const PaginationSection = createInterfaceComponent<PaginationSectionProps>(
  {
    name: 'PaginationSection',
    category: 'navigation',
    description: 'Logical section grouping within pagination lists.',
    version: '1.0.0',
  },
  PaginationSectionPrimitive
)

export interface PaginationItemProps
  extends Omit<LinkProps, 'children' | 'size'> {
  /** Whether this page button represents the currently active page */
  isCurrent?: boolean
  /** Whether the button is rendered as a circle */
  isCircle?: boolean
  /** Size token: xs, sm, md, lg */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** Extra classes for the wrapping list item. */
  listItemClassName?: string
  /** Slot name on the wrapping list item. Numbered pages stay `pagination-item`. */
  itemSlot?:
    | 'pagination-item'
    | 'pagination-first'
    | 'pagination-previous'
    | 'pagination-next'
    | 'pagination-last'
    | 'pagination-start'
    | 'pagination-end'
  /** Whether the control is disabled. */
  isDisabled?: boolean
  /** Content children */
  children?: string | number | React.ReactNode
}

const PaginationItemPrimitive = ({
  className,
  isCurrent = false,
  isCircle = false,
  size = 'md',
  listItemClassName,
  itemSlot = 'pagination-item',
  isDisabled = false,
  children,
  onClick,
  onPress,
  href,
  ...props
}: PaginationItemProps & { onPress?: (e: any) => void; href?: string; onClick?: (e: any) => void }) => {
  const itemRef = useRef<HTMLElement | null>(null)
  const setItemRef = (node: HTMLElement | null) => {
    itemRef.current = node
  }

  useEffect(() => {
    if (!isCurrent || itemSlot !== 'pagination-item') return
    itemRef.current?.scrollIntoView({
      block: 'nearest',
      inline: 'center',
      behavior: 'smooth',
    })
  }, [isCurrent, itemSlot])

  const buttonClasses = cn(
    'relative isolate inline-flex shrink-0 items-center justify-center font-semibold text-xs tabular-nums select-none',
    'min-w-8 h-8 px-2 rounded-base transition-colors duration-150 outline-none cursor-pointer',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1',
    isCircle && 'rounded-full',
    isCurrent
      ? 'bg-primary text-primary-fg font-bold shadow-xs'
      : 'bg-transparent text-muted-fg hover:bg-secondary hover:text-fg active:bg-secondary/80',
    isDisabled && 'pointer-events-none opacity-30 cursor-not-allowed',
    className
  )

  const handleClick = (e: React.MouseEvent<any>) => {
    if (isDisabled) {
      e.preventDefault()
      return
    }
    onClick?.(e)
    onPress?.(e)
  }

  return (
    <li
      ref={setItemRef}
      data-slot={itemSlot}
      data-current={isCurrent || undefined}
      className={cn('list-none inline-flex shrink-0 items-center', listItemClassName)}
    >
      {href ? (
        <a
          href={href}
          aria-current={isCurrent ? 'page' : undefined}
          aria-disabled={isDisabled || undefined}
          className={buttonClasses}
          onClick={handleClick}
          {...(props as any)}
        >
          {children}
        </a>
      ) : (
        <button
          type="button"
          disabled={isDisabled}
          aria-current={isCurrent ? 'page' : undefined}
          aria-disabled={isDisabled || undefined}
          className={buttonClasses}
          onClick={handleClick}
          {...(props as any)}
        >
          {children}
        </button>
      )}
    </li>
  )
}

export const PaginationItem = createInterfaceComponent<PaginationItemProps>(
  {
    name: 'PaginationItem',
    category: 'navigation',
    description: 'Numbered page link button within pagination controls.',
    version: '1.0.0',
    props: {
      isCurrent: false,
      isCircle: false,
      size: 'md',
    },
  },
  PaginationItemPrimitive
)

export interface PaginationFirstProps extends PaginationItemProps {}

const PaginationFirstPrimitive = ({ itemSlot, listItemClassName, ...props }: PaginationFirstProps) => {
  return (
    <PaginationItem
      aria-label="First page"
      {...props}
      itemSlot={itemSlot ?? 'pagination-first'}
      listItemClassName={cn('me-0.5', listItemClassName)}
    >
      <ChevronDoubleLeftIcon data-slot="icon" className="size-4 shrink-0" />
    </PaginationItem>
  )
}

export const PaginationFirst = createInterfaceComponent<PaginationFirstProps>(
  {
    name: 'PaginationFirst',
    category: 'navigation',
    description: 'Jump to first page navigation button.',
    version: '1.0.0',
  },
  PaginationFirstPrimitive
)

export interface PaginationPreviousProps extends PaginationItemProps {}

const PaginationPreviousPrimitive = ({ itemSlot, listItemClassName, ...props }: PaginationPreviousProps) => {
  return (
    <PaginationItem
      aria-label="Previous page"
      {...props}
      itemSlot={itemSlot ?? 'pagination-previous'}
      listItemClassName={cn('shrink-0', listItemClassName)}
    >
      <ChevronLeftIcon data-slot="icon" className="size-4 shrink-0" />
    </PaginationItem>
  )
}

export const PaginationPrevious = createInterfaceComponent<PaginationPreviousProps>(
  {
    name: 'PaginationPrevious',
    category: 'navigation',
    description: 'Step backward to previous page button.',
    version: '1.0.0',
  },
  PaginationPreviousPrimitive
)

export interface PaginationNextProps extends PaginationItemProps {}

const PaginationNextPrimitive = ({ itemSlot, listItemClassName, ...props }: PaginationNextProps) => {
  return (
    <PaginationItem
      aria-label="Next page"
      {...props}
      itemSlot={itemSlot ?? 'pagination-next'}
      listItemClassName={cn('shrink-0', listItemClassName)}
    >
      <ChevronRightIcon data-slot="icon" className="size-4 shrink-0" />
    </PaginationItem>
  )
}

export const PaginationNext = createInterfaceComponent<PaginationNextProps>(
  {
    name: 'PaginationNext',
    category: 'navigation',
    description: 'Step forward to next page button.',
    version: '1.0.0',
  },
  PaginationNextPrimitive
)

export interface PaginationLastProps extends PaginationItemProps {}

const PaginationLastPrimitive = ({ itemSlot, listItemClassName, ...props }: PaginationLastProps) => {
  return (
    <PaginationItem
      aria-label="Last page"
      {...props}
      itemSlot={itemSlot ?? 'pagination-last'}
      listItemClassName={cn('ms-0.5', listItemClassName)}
    >
      <ChevronDoubleRightIcon data-slot="icon" className="size-4 shrink-0" />
    </PaginationItem>
  )
}

export const PaginationLast = createInterfaceComponent<PaginationLastProps>(
  {
    name: 'PaginationLast',
    category: 'navigation',
    description: 'Jump to last page navigation button.',
    version: '1.0.0',
  },
  PaginationLastPrimitive
)

export interface PaginationPinProps extends Omit<PaginationItemProps, 'children'> {
  /** Page number shown on the pin. */
  page: number
  /** Which scroll edge this pin represents. */
  edge: 'start' | 'end'
}

const PaginationPinPrimitive = ({
  page,
  edge,
  isDisabled,
  onClick,
  itemSlot,
  ...props
}: PaginationPinProps) => {
  const scroll = usePaginationScroll()
  const inView = edge === 'start' ? scroll?.startInView : scroll?.endInView
  const disabled = Boolean(isDisabled || inView)

  return (
    <PaginationItem
      {...props}
      itemSlot={itemSlot ?? (edge === 'start' ? 'pagination-start' : 'pagination-end')}
      isDisabled={disabled}
      aria-label={edge === 'start' ? `Page ${page}` : `Page ${page}`}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault()
          return
        }
        onClick?.(event)
        scroll?.scrollToEdge(edge)
      }}
    >
      {page}
    </PaginationItem>
  )
}

export const PaginationStart = createInterfaceComponent<Omit<PaginationPinProps, 'edge'>>(
  {
    name: 'PaginationStart',
    category: 'navigation',
    description: 'Pinned first-page number outside the scroll list. Disabled while the start of the list is in view.',
    version: '1.0.0',
  },
  (props) => <PaginationPinPrimitive {...props} edge="start" />
)

export const PaginationEnd = createInterfaceComponent<Omit<PaginationPinProps, 'edge'>>(
  {
    name: 'PaginationEnd',
    category: 'navigation',
    description: 'Pinned last-page number outside the scroll list. Disabled while the end of the list is in view.',
    version: '1.0.0',
  },
  (props) => <PaginationPinPrimitive {...props} edge="end" />
)

export interface PaginationGapProps extends React.HTMLAttributes<HTMLLIElement> {}

const PaginationGapPrimitive = ({
  className,
  children = <>…</>,
  ...props
}: PaginationGapProps) => {
  return (
    <li
      data-slot="pagination-gap"
      aria-hidden="true"
      className={cn(
        'flex size-8 sm:size-9 items-center justify-center select-none text-sm font-semibold text-muted-fg',
        className
      )}
      {...props}
    >
      {children}
    </li>
  )
}

export const PaginationGap = createInterfaceComponent<PaginationGapProps>(
  {
    name: 'PaginationGap',
    category: 'navigation',
    description: 'Ellipsis gap indicator representing truncated pages.',
    version: '1.0.0',
  },
  PaginationGapPrimitive
)

export interface PaginationSpacerProps extends React.HTMLAttributes<HTMLDivElement> {}

const PaginationSpacerPrimitive = ({ className, ...props }: PaginationSpacerProps) => {
  return (
    <div
      aria-hidden="true"
      className={cn('min-w-0 flex-1', className)}
      {...props}
    />
  )
}

export const PaginationSpacer = createInterfaceComponent<PaginationSpacerProps>(
  {
    name: 'PaginationSpacer',
    category: 'navigation',
    description: 'Expanding flex spacer separating pagination items from summary labels.',
    version: '1.0.0',
  },
  PaginationSpacerPrimitive
)

export interface PaginationLabelProps extends React.HTMLAttributes<HTMLDivElement> {}

const PaginationLabelPrimitive = ({ className, ...props }: PaginationLabelProps) => {
  return (
    <div
      data-slot="pagination-label"
      className={cn(
        'min-w-0 max-w-40 truncate text-xs text-muted-fg sm:max-w-none',
        className
      )}
      {...props}
    />
  )
}

export const PaginationLabel = createInterfaceComponent<PaginationLabelProps>(
  {
    name: 'PaginationLabel',
    category: 'navigation',
    description: 'Summary label showing current page range and total items.',
    version: '1.0.0',
  },
  PaginationLabelPrimitive
)

export interface PaginationPagesSlots {
  /** Custom item slot override */
  item?: React.ComponentType<PaginationItemProps>
  /** Custom gap slot override */
  gap?: React.ComponentType<PaginationGapProps>
}

export interface PaginationPagesProps
  extends Omit<PaginationItemProps, 'isCurrent' | 'children' | 'href' | 'slots' | 'slotProps'> {
  /** 1-based current page. */
  page?: number
  /** Uncontrolled initial page. */
  defaultPage?: number
  /** Total page count. Every page is rendered in the scrollable list. */
  pageCount: number
  /** Called when the current page changes. */
  onPageChange?: (page: number) => void
  /**
   * When set, collapse to first / current window / last with ellipses.
   * Omit to render every page so the list can be scrolled.
   */
  siblingCount?: number
  /** Optional href factory for each page number. */
  getHref?: (page: number) => string
  /** Include first and last page inside the list. Defaults to false when pins are used. */
  includeEdges?: boolean
  /** Injected slot component overrides. */
  slots?: SlotComponents<PaginationPagesSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<PaginationPagesSlots>
}

const PaginationPagesPrimitive = ({
  page,
  defaultPage,
  pageCount,
  onPageChange,
  siblingCount,
  getHref,
  includeEdges = false,
  slots = {},
  slotProps = {},
  ...itemProps
}: PaginationPagesProps) => {
  const pagination = usePagination({
    page,
    defaultPage,
    pageCount,
    onPageChange,
    siblingCount: siblingCount ?? 1,
  })
  const items = (() => {
    if (siblingCount != null) return pagination.helpers.items
    const start = includeEdges ? 1 : Math.min(2, pageCount)
    const end = includeEdges ? pageCount : Math.max(pageCount - 1, start)
    if (pageCount <= (includeEdges ? 0 : 2)) return []
    return Array.from({ length: Math.max(end - start + 1, 0) }, (_, index) => start + index)
  })()

  return (
    <>
      {items.map((item, index) =>
        item === 'gap' ? (
          <React.Fragment key={`gap-${index}`}>
            {renderSlot(slots.gap, slotProps.gap as object, {
              defaultComponent: PaginationGap,
            })}
          </React.Fragment>
        ) : (
          <React.Fragment key={item}>
            {renderSlot(
              slots.item,
              {
                ...itemProps,
                href: getHref?.(item) ?? '#',
                isCurrent: item === pagination.state.page,
                onClick: (event: any) => {
                  itemProps.onClick?.(event)
                  if (!getHref) event.preventDefault()
                  pagination.actions.setPage(item)
                },
                children: item,
                ...(slotProps.item as object),
              },
              {
                defaultComponent: PaginationItem,
              }
            )}
          </React.Fragment>
        )
      )}
    </>
  )
}

export const PaginationPages = createInterfaceComponent<PaginationPagesProps, PaginationPagesSlots>(
  {
    name: 'PaginationPages',
    category: 'navigation',
    description:
      'Page numbers for the scrollable list. Renders every page unless siblingCount collapses the window.',
    version: '1.0.0',
    props: {
      includeEdges: false,
    },
    slots: {
      item: PaginationItem,
      gap: PaginationGap,
    },
  },
  PaginationPagesPrimitive
)

export const PaginationList = createInterfaceComponent<PaginationListProps, PaginationListSlots>(
  {
    name: 'PaginationList',
    category: 'navigation',
    description: 'Unordered list container wrapping numbered pagination items.',
    version: '1.0.0',
    slots: {
      first: PaginationFirst,
      previous: PaginationPrevious,
      pages: PaginationPages,
      next: PaginationNext,
      last: PaginationLast,
      start: PaginationStart,
      end: PaginationEnd,
      gap: PaginationGap,
      item: PaginationItem,
      section: PaginationSection,
      spacer: PaginationSpacer,
      label: PaginationLabel,
    },
  },
  PaginationListPrimitive
)

// Namespace attachments for compound family ergonomics
Pagination.List = PaginationList
Pagination.Section = PaginationSection
Pagination.Item = PaginationItem
Pagination.First = PaginationFirst
Pagination.Previous = PaginationPrevious
Pagination.Next = PaginationNext
Pagination.Last = PaginationLast
Pagination.Start = PaginationStart
Pagination.End = PaginationEnd
Pagination.Gap = PaginationGap
Pagination.Pages = PaginationPages
Pagination.Spacer = PaginationSpacer
Pagination.Label = PaginationLabel
