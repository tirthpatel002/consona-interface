import { useMemo } from 'react'
import { useControllableState, type HeadlessHookReturn } from '../../../core/hooks'

export interface UsePaginationOptions {
  /** Controlled page (1-based). */
  page?: number
  /** Uncontrolled initial page (1-based). */
  defaultPage?: number
  /** Total number of pages. */
  pageCount: number
  /** Called when the page changes. */
  onPageChange?: (page: number) => void
  /** How many sibling pages to show around the current page. */
  siblingCount?: number
}

export interface PaginationState {
  /** Current 1-based page. */
  page: number
  /** Total number of pages. */
  pageCount: number
}

export type PaginationActions = {
  /** Jump to a clamped page index. */
  setPage: (page: number) => void
  /** Advance one page. */
  next: () => void
  /** Go back one page. */
  previous: () => void
  /** Jump to the first page. */
  first: () => void
  /** Jump to the last page. */
  last: () => void
}

export interface PaginationHelpers {
  /** Whether a previous page exists. */
  canPrevious: boolean
  /** Whether a next page exists. */
  canNext: boolean
  /** Page numbers and gap markers for rendering. */
  items: Array<number | 'gap'>
}

export interface PaginationAriaProps {
  /** Accessible name for the pagination nav. */
  'aria-label': string
}

export type UsePaginationReturn = HeadlessHookReturn<
  PaginationState,
  PaginationActions,
  PaginationHelpers,
  PaginationAriaProps
>

function buildItems(page: number, pageCount: number, siblingCount: number): Array<number | 'gap'> {
  if (pageCount <= 0) return []
  const windowStart = Math.max(2, page - siblingCount)
  const windowEnd = Math.min(pageCount - 1, page + siblingCount)
  const items: Array<number | 'gap'> = [1]
  if (windowStart > 2) items.push('gap')
  for (let i = windowStart; i <= windowEnd; i += 1) {
    items.push(i)
  }
  if (windowEnd < pageCount - 1) items.push('gap')
  if (pageCount > 1) items.push(pageCount)
  return items
}

export function usePagination(options: UsePaginationOptions): UsePaginationReturn {
  const { pageCount, siblingCount = 1, onPageChange } = options
  const [page, setPageRaw] = useControllableState<number>({
    prop: options.page,
    defaultProp: options.defaultPage ?? 1,
    onChange: onPageChange,
  })

  const clamp = (next: number) => Math.min(Math.max(1, next), Math.max(1, pageCount))
  const setPage = (next: number) => setPageRaw(clamp(next))

  const items = useMemo(
    () => buildItems(page, pageCount, siblingCount),
    [page, pageCount, siblingCount]
  )

  return {
    state: { page, pageCount },
    actions: {
      setPage,
      next: () => setPage(page + 1),
      previous: () => setPage(page - 1),
      first: () => setPage(1),
      last: () => setPage(pageCount),
    },
    helpers: {
      canPrevious: page > 1,
      canNext: page < pageCount,
      items,
    },
    ariaProps: { 'aria-label': 'Pagination' },
  }
}
