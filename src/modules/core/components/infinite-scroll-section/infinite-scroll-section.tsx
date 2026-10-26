'use client'

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type TouchEvent,
  type UIEvent,
} from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Loader } from '../loader'
import { useDragState } from '../../drag-state-context'

/* ==========================================================================
   InfiniteScrollSection Configuration & Types
   ========================================================================== */

/**
 * Configuration options for infinite scroll behavior.
 * Includes all external loading/state props so DnD wrappers can pass a single
 * `infiniteScroll` config object that ISS understands directly.
 */
export interface InfiniteScrollConfig {
  /** Scroll orientation: 'vertical' (default) or 'horizontal' */
  orientation?: 'vertical' | 'horizontal'
  /** Maximum number of items to render in DOM at once (sliding memory window) */
  maxLoadedItems?: number
  /** Alias for maxLoadedItems */
  windowSize?: number
  /** Initial number of items to load */
  initialLoadCount?: number
  /** Number of items to append/prepend per batch load */
  appendCount?: number
  /** Maximum height of the container (in pixels or CSS value string) */
  maxHeight?: string | number
  /** Maximum width of the container (in pixels or CSS value string) */
  maxWidth?: string | number
  /** Threshold distance from edge to trigger load (in pixels) */
  threshold?: number
  /** Whether to enable loading items at the top/start when scrolled up/left */
  enableTopLoad?: boolean
  /** Alias for enableTopLoad in horizontal mode */
  enableStartLoad?: boolean
  /** Debounce/throttle delay for scroll events (ms) */
  scrollDebounceMs?: number
  /** Automatically load more items if content does not fill container viewport */
  autoFill?: boolean

  // ---- External load callbacks ----
  /** Callback when more items are requested */
  onLoadMore?: (direction: 'top' | 'bottom' | 'start' | 'end' | 'left' | 'right', currentCount: number) => Promise<void> | void
  /** Fetch next page / append items */
  fetchNextPage?: () => Promise<void> | void
  /** Fetch previous page / prepend items */
  fetchPreviousPage?: () => Promise<void> | void

  // ---- External has-more flags ----
  /** Whether more items exist at the bottom/end */
  hasMoreBottom?: boolean
  /** Whether more items exist at the top/start */
  hasMoreTop?: boolean
  /** Alias for hasMoreBottom in horizontal mode */
  hasMoreEnd?: boolean
  /** Alias for hasMoreTop in horizontal mode */
  hasMoreStart?: boolean
  /** TanStack Query alias for hasMoreBottom */
  hasNextPage?: boolean
  /** TanStack Query alias for hasMoreTop */
  hasPreviousPage?: boolean

  // ---- External loading flags ----
  /** Whether the bottom/end is currently loading */
  loadingBottom?: boolean
  /** Whether the top/start is currently loading */
  loadingTop?: boolean
  /** Alias for loadingBottom in horizontal mode */
  loadingEnd?: boolean
  /** Alias for loadingTop in horizontal mode */
  loadingStart?: boolean
  /** TanStack Query alias for loadingBottom */
  isFetchingNextPage?: boolean
  /** TanStack Query alias for loadingTop */
  isFetchingPreviousPage?: boolean

  // ---- Custom loading / empty components ----
  /** Custom loading component for bottom/end */
  loadingBottomComponent?: React.ReactNode
  /** Custom loading component for top/start */
  loadingTopComponent?: React.ReactNode
  /** Custom loading component for start/left */
  loadingStartComponent?: React.ReactNode
  /** Custom loading component for end/right */
  loadingEndComponent?: React.ReactNode
  /** Component shown when all items are loaded */
  endReachedComponent?: React.ReactNode
  /** Empty state component shown when no items exist */
  emptyState?: React.ReactNode
}


export interface InfiniteScrollSectionSlots {
  /** Top loading indicator slot (vertical). */
  loadingTop?: React.ComponentType<Record<string, unknown>>
  /** Bottom loading indicator slot (vertical). */
  loadingBottom?: React.ComponentType<Record<string, unknown>>
  /** Start/left loading indicator slot (horizontal). */
  loadingStart?: React.ComponentType<Record<string, unknown>>
  /** End/right loading indicator slot (horizontal). */
  loadingEnd?: React.ComponentType<Record<string, unknown>>
  /** Left loading indicator slot (horizontal alias). */
  loadingLeft?: React.ComponentType<Record<string, unknown>>
  /** Right loading indicator slot (horizontal alias). */
  loadingRight?: React.ComponentType<Record<string, unknown>>
  /** End of data reached notification slot. */
  endReached?: React.ComponentType<HTMLAttributes<HTMLDivElement>>
  /** Empty state placeholder slot. */
  emptyState?: React.ComponentType<HTMLAttributes<HTMLDivElement>>
}

/**
 * Props for InfiniteScrollSection component
 */
export interface InfiniteScrollSectionProps<T = any>
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'slots' | 'slotProps'> {
  /** Scroll orientation: 'vertical' (default) or 'horizontal' */
  orientation?: 'vertical' | 'horizontal'
  /** Array of items to display */
  items?: T[]
  /** Alias for items */
  data?: T[]
  /** Children to display (alternative to items prop) */
  children?: ReactNode | ReactNode[]
  /** Infinite scroll configuration options */
  infiniteScroll?: InfiniteScrollConfig
  /** Direct windowSize prop (maximum items rendered in DOM) */
  windowSize?: number
  /** Direct maxLoadedItems prop */
  maxLoadedItems?: number
  /** Direct initialLoadCount prop */
  initialLoadCount?: number
  /** Direct appendCount prop */
  appendCount?: number
  /** Direct maxHeight prop */
  maxHeight?: string | number
  /** Direct maxWidth prop (for horizontal mode) */
  maxWidth?: string | number
  /** Direct threshold prop in px */
  threshold?: number
  /** Direct enableTopLoad prop */
  enableTopLoad?: boolean
  /** Direct enableStartLoad prop for horizontal mode */
  enableStartLoad?: boolean
  /** Automatically load more items if container is not full */
  autoFill?: boolean
  /** Custom render function for each item */
  renderItem?: (item: T, index: number) => ReactNode
  /** Callback when more items are requested (for async loading) */
  onLoadMore?: (
    direction: 'top' | 'bottom' | 'start' | 'end' | 'left' | 'right',
    currentCount: number
  ) => Promise<void> | void
  /** Alternate callback to fetch next page / append items */
  fetchNextPage?: () => Promise<void> | void
  /** Alternate callback to fetch previous page / prepend items */
  fetchPreviousPage?: () => Promise<void> | void
  /** Whether more items are available at the bottom / end */
  hasMoreBottom?: boolean
  /** Alias for hasMoreBottom */
  hasNextPage?: boolean
  /** Alias for hasMoreBottom in horizontal orientation */
  hasMoreEnd?: boolean
  /** Alias for hasMoreBottom in horizontal orientation */
  hasMoreRight?: boolean
  /** Whether more items are available at the top / start */
  hasMoreTop?: boolean
  /** Alias for hasMoreTop */
  hasPreviousPage?: boolean
  /** Alias for hasMoreTop in horizontal orientation */
  hasMoreStart?: boolean
  /** Alias for hasMoreTop in horizontal orientation */
  hasMoreLeft?: boolean
  /** Loading state for bottom / end */
  loadingBottom?: boolean
  /** Alias for loadingBottom */
  isFetchingNextPage?: boolean
  /** Alias for loadingBottom in horizontal mode */
  loadingEnd?: boolean
  /** Alias for loadingBottom in horizontal mode */
  loadingRight?: boolean
  /** Loading state for top / start */
  loadingTop?: boolean
  /** Alias for loadingTop */
  isFetchingPreviousPage?: boolean
  /** Alias for loadingTop in horizontal mode */
  loadingStart?: boolean
  /** Alias for loadingTop in horizontal mode */
  loadingLeft?: boolean
  /** Custom loading component for bottom / end */
  loadingBottomComponent?: ReactNode
  /** Custom loading component for top / start */
  loadingTopComponent?: ReactNode
  /** Custom loading component for start / left */
  loadingStartComponent?: ReactNode
  /** Custom loading component for end / right */
  loadingEndComponent?: ReactNode
  /** Custom component shown when all items are loaded at bottom / end */
  endReachedComponent?: ReactNode
  /** Empty state component shown when no items exist */
  emptyState?: ReactNode
  /** Custom class for inner content list container */
  contentClassName?: string
  /** Callback when scroll position changes */
  onScrollChange?: (scrollPos: number, scrollDimension: number, clientDimension: number) => void
  /** Callback when render window changes */
  onRenderWindowChange?: (start: number, end: number, total: number) => void
  /** Forwarded ref for container */
  ref?: React.Ref<HTMLDivElement>
  /** Slot component overrides */
  slots?: SlotComponents<InfiniteScrollSectionSlots>
  /** Slot props overrides */
  slotProps?: SlotPropsMap<InfiniteScrollSectionSlots>
}

/* ==========================================================================
   InfiniteScrollSection Primitive & Implementation
   ========================================================================== */

const InfiniteScrollSectionPrimitive = <T extends any>({
  orientation: propOrientation,
  items,
  data,
  children,
  infiniteScroll = {},
  windowSize,
  maxLoadedItems: topMaxLoadedItems,
  initialLoadCount: topInitialLoadCount,
  appendCount: topAppendCount,
  maxHeight: topMaxHeight,
  maxWidth: topMaxWidth,
  threshold: topThreshold,
  enableTopLoad: topEnableTopLoad,
  enableStartLoad: topEnableStartLoad,
  autoFill: topAutoFill,
  contentClassName,
  renderItem,
  onLoadMore,
  fetchNextPage,
  fetchPreviousPage,
  hasMoreBottom: externalHasMoreBottom,
  hasNextPage,
  hasMoreEnd: externalHasMoreEnd,
  hasMoreRight: externalHasMoreRight,
  hasMoreTop: externalHasMoreTop,
  hasPreviousPage,
  hasMoreStart: externalHasMoreStart,
  hasMoreLeft: externalHasMoreLeft,
  loadingBottom: externalLoadingBottom = false,
  isFetchingNextPage = false,
  loadingEnd: externalLoadingEnd,
  loadingRight: externalLoadingRight,
  loadingTop: externalLoadingTop = false,
  isFetchingPreviousPage = false,
  loadingStart: externalLoadingStart,
  loadingLeft: externalLoadingLeft,
  loadingBottomComponent,
  loadingTopComponent,
  loadingStartComponent,
  loadingEndComponent,
  endReachedComponent,
  emptyState,
  onScrollChange,
  onRenderWindowChange,
  className,
  style,
  ref,
  slots = {},
  slotProps = {},
  ...props
}: InfiniteScrollSectionProps<T>) => {
  const orientation = propOrientation ?? infiniteScroll.orientation ?? 'vertical'
  const isHorizontal = orientation === 'horizontal'

  const containerRef = useRef<HTMLDivElement | null>(null)
  /** State mirror so the wheel listener effect re-binds when the DOM node mounts. */
  const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(null)
  const itemsListRef = useRef<HTMLDivElement | null>(null)
  const startSentinelRef = useRef<HTMLDivElement | null>(null)
  const endSentinelRef = useRef<HTMLDivElement | null>(null)

  const lastScrollPosRef = useRef<number>(0)
  const isProgrammaticScrollRef = useRef<boolean>(false)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  // Loading, rate-limiting, and displacement tracking (original onLoadMore contract)
  const isBusyRef = useRef<{ start: boolean; end: boolean }>({ start: false, end: false })
  const lastLoadTimeRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 })
  /** Set on user displacement toward an edge; required before an external onLoadMore/fetch. */
  const hasDisplacedRef = useRef<{ start: boolean; end: boolean }>({ start: false, end: false })
  /**
   * In-memory window slides only: one load per edge until the user leaves the threshold.
   * Does NOT gate onLoadMore — that uses hasDisplacedRef like before.
   */
  const edgeArmedRef = useRef<{ start: boolean; end: boolean }>({ start: true, end: true })
  const lastRequestedBoundaryRef = useRef<{ startFirstId: string | null; endLastId: string | null }>({
    startFirstId: null,
    endLastId: null,
  })

  // Normalized config values
  const rawMaxLoadedItems = topMaxLoadedItems ?? windowSize ?? infiniteScroll.maxLoadedItems
  const initialLoadCount = Math.max(1, topInitialLoadCount ?? infiniteScroll.initialLoadCount ?? 20)
  const appendCount = Math.max(1, topAppendCount ?? infiniteScroll.appendCount ?? 15)
  const maxLoadedItems = rawMaxLoadedItems ? Math.max(rawMaxLoadedItems, 6) : undefined
  /** In-memory slide step — capped so the window never skips unseen items. External onLoadMore ignores this. */
  const slideStep = maxLoadedItems
    ? Math.min(appendCount, Math.max(1, maxLoadedItems - Math.max(1, Math.floor(maxLoadedItems / 2))))
    : appendCount
  const maxHeight = topMaxHeight ?? infiniteScroll.maxHeight
  const maxWidth = topMaxWidth ?? infiniteScroll.maxWidth
  const threshold = Math.max(10, topThreshold ?? infiniteScroll.threshold ?? 80)
  const shouldAutoFill = topAutoFill ?? infiniteScroll.autoFill ?? true

  // Loading states
  const loadingEnd =
    (externalLoadingEnd ?? externalLoadingRight ?? externalLoadingBottom) || isFetchingNextPage
  const loadingStart =
    (externalLoadingStart ?? externalLoadingLeft ?? externalLoadingTop) || isFetchingPreviousPage

  // Unified items array
  const allItems = useMemo(() => {
    if (items !== undefined) return items
    if (data !== undefined) return data
    if (children !== undefined) return React.Children.toArray(children) as T[]
    return []
  }, [items, data, children])

  // Track dataset changes for diffing
  const prevItemsLengthRef = useRef<number>(allItems.length)
  const prevFirstItemRef = useRef<any>(allItems[0])

  // Render window slice [start, end)
  const [renderWindow, setRenderWindow] = useState<{ start: number; end: number }>(() => {
    if (allItems.length === 0) return { start: 0, end: 0 }
    const initialCount = Math.min(initialLoadCount, maxLoadedItems ?? allItems.length, allItems.length)
    return { start: 0, end: initialCount }
  })
  const renderWindowRef = useRef(renderWindow)
  renderWindowRef.current = renderWindow
  const allItemsRef = useRef(allItems)
  allItemsRef.current = allItems

  const { activeDndId, isDragScrollingRef } = useDragState()
  const activeDndIdRef = useRef(activeDndId)
  activeDndIdRef.current = activeDndId
  /** After a non-drag edge load, pull scroll off the threshold so the next wheel cannot walk the window. */
  const pendingSettleEdgeRef = useRef<'start' | 'end' | null>(null)

  /** True for the whole drag session, or while auto-scroll is actively clamping the edge. */
  const isDragSession = () => activeDndIdRef.current != null || isDragScrollingRef.current === true

  const activeIndex = useMemo(() => {
    if (activeDndId == null) return -1
    const activeIdStr = String(activeDndId)
    return allItems.findIndex((it: any) => {
      const id = it?.id != null ? String(it.id) : it?.key != null ? String(it.key) : String(it)
      return id === activeIdStr
    })
  }, [allItems, activeDndId])

  // Universal DOM Anchor for sub-pixel zero-jump window transitions
  const anchorRef = useRef<{ id: string; offset: number } | null>(null)

  const findItemElement = useCallback((listEl: HTMLElement, itemId: string | number): HTMLElement | null => {
    const target = String(itemId)
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
      try {
        return listEl.querySelector(`[data-item-id="${CSS.escape(target)}"]`) as HTMLElement | null
      } catch {
        // Fallback to manual attribute comparison
      }
    }
    const nodes = listEl.querySelectorAll('[data-item-id]')
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i] as HTMLElement
      if (node.getAttribute('data-item-id') === target) return node
    }
    return null
  }, [])

  const captureAnchor = useCallback(
    (preferredId?: string | number) => {
      const container = containerRef.current
      const listEl = itemsListRef.current
      if (!container || !listEl) return

      const containerRect = container.getBoundingClientRect()

      // 1. If preferred ID is given and currently exists in DOM, use it
      if (preferredId != null) {
        const el = findItemElement(listEl, preferredId)
        if (el) {
          const childRect = el.getBoundingClientRect()
          const offset = isHorizontal ? childRect.left - containerRect.left : childRect.top - containerRect.top
          anchorRef.current = { id: String(preferredId), offset }
          return
        }
      }

      // 2. Otherwise find the first child currently visible in the container viewport
      const children = Array.from(listEl.querySelectorAll('[data-item-id]')) as HTMLElement[]
      if (children.length === 0) return

      for (const child of children) {
        const id = child.getAttribute('data-item-id')
        if (!id) continue
        // Never anchor to the active dragging item
        if (activeDndId != null && String(id) === String(activeDndId)) continue

        const r = child.getBoundingClientRect()
        const trailing = isHorizontal ? r.right - containerRect.left : r.bottom - containerRect.top
        if (trailing > 0) {
          const offset = isHorizontal ? r.left - containerRect.left : r.top - containerRect.top
          anchorRef.current = { id, offset }
          return
        }
      }
    },
    [isHorizontal, activeDndId, findItemElement]
  )

  // Synchronously adjust scroll position right after render before paint
  useLayoutEffect(() => {
    const container = containerRef.current
    const listEl = itemsListRef.current

    if (anchorRef.current && container && listEl) {
      const { id, offset } = anchorRef.current
      anchorRef.current = null

      const targetEl = findItemElement(listEl, id)
      if (targetEl) {
        const containerRect = container.getBoundingClientRect()
        const childRect = targetEl.getBoundingClientRect()
        const newOffset = isHorizontal ? childRect.left - containerRect.left : childRect.top - containerRect.top
        const delta = newOffset - offset

        if (Math.abs(delta) > 0.5) {
          isProgrammaticScrollRef.current = true
          if (isHorizontal) {
            container.scrollLeft += delta
            lastScrollPosRef.current = container.scrollLeft
          } else {
            container.scrollTop += delta
            lastScrollPosRef.current = container.scrollTop
          }
        }
      }
    }

    // After an edge load: keep viewport via anchor (above), then micro-nudge just clear of
    // the load threshold. Do NOT jump by a large fraction of the viewport — that skips
    // newly mounted items the user overscrolled to see (especially horizontal chips).
    const settleEdge = pendingSettleEdgeRef.current
    if (settleEdge && container && activeDndIdRef.current == null) {
      pendingSettleEdgeRef.current = null
      const scrollDim = isHorizontal ? container.scrollWidth : container.scrollHeight
      const clientDim = isHorizontal ? container.clientWidth : container.clientHeight
      const maxScroll = Math.max(0, scrollDim - clientDim)
      const scrollPos = isHorizontal ? container.scrollLeft : container.scrollTop
      const effectiveThreshold = maxScroll > 0 ? Math.min(threshold, maxScroll * 0.35) : 0
      const nudge = effectiveThreshold + 20

      if (settleEdge === 'end' && maxScroll > 0 && scrollPos >= maxScroll - effectiveThreshold) {
        isProgrammaticScrollRef.current = true
        const next = Math.max(0, maxScroll - nudge)
        if (isHorizontal) container.scrollLeft = next
        else container.scrollTop = next
        lastScrollPosRef.current = next
        edgeArmedRef.current.end = false
      } else if (settleEdge === 'start' && scrollPos <= effectiveThreshold) {
        isProgrammaticScrollRef.current = true
        const next = Math.min(maxScroll, nudge)
        if (isHorizontal) container.scrollLeft = next
        else container.scrollTop = next
        lastScrollPosRef.current = next
        edgeArmedRef.current.start = false
      } else {
        // Anchor already left the zone — just keep the edge disarmed for this gesture
        if (settleEdge === 'end') edgeArmedRef.current.end = false
        else edgeArmedRef.current.start = false
      }
    }

    if (isProgrammaticScrollRef.current) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          isProgrammaticScrollRef.current = false
        })
      })
    }
  }, [renderWindow, allItems, isHorizontal, threshold])

  // Normalization on drag end: prune offscreen items while preserving the user's active viewport
  const prevActiveDndIdRef = useRef<string | number | null>(null)
  useEffect(() => {
    const wasDragging = prevActiveDndIdRef.current != null
    prevActiveDndIdRef.current = activeDndId

    if (wasDragging && activeDndId == null && maxLoadedItems) {
      setRenderWindow((prev) => {
        const count = prev.end - prev.start
        if (count <= maxLoadedItems) return prev

        const container = containerRef.current
        const listEl = itemsListRef.current
        if (!container || !listEl) return prev

        const containerRect = container.getBoundingClientRect()
        const itemElements = Array.from(listEl.querySelectorAll('[data-item-id]')) as HTMLElement[]

        let firstVisibleIdx = prev.start
        for (let i = 0; i < itemElements.length; i++) {
          const child = itemElements[i]
          if (!child) continue
          const r = child.getBoundingClientRect()
          const trailing = isHorizontal ? r.right - containerRect.left : r.bottom - containerRect.top
          if (trailing > 0) {
            firstVisibleIdx = prev.start + i
            break
          }
        }

        const halfWindow = Math.floor(maxLoadedItems / 3)
        const targetStart = Math.max(0, Math.min(allItems.length - maxLoadedItems, firstVisibleIdx - halfWindow))
        const targetEnd = Math.min(allItems.length, targetStart + maxLoadedItems)

        if (targetStart === prev.start && targetEnd === prev.end) return prev

        captureAnchor()
        return { start: targetStart, end: targetEnd }
      })
    }
  }, [activeDndId, maxLoadedItems, isHorizontal, allItems.length, captureAnchor])

  // Window change notification
  const prevRenderWindowRef = useRef<{ start: number; end: number; total: number }>({ start: -1, end: -1, total: -1 })
  useEffect(() => {
    if (
      prevRenderWindowRef.current.start !== renderWindow.start ||
      prevRenderWindowRef.current.end !== renderWindow.end ||
      prevRenderWindowRef.current.total !== allItems.length
    ) {
      prevRenderWindowRef.current = { start: renderWindow.start, end: renderWindow.end, total: allItems.length }
      onRenderWindowChange?.(renderWindow.start, renderWindow.end, allItems.length)
    }
  }, [renderWindow.start, renderWindow.end, allItems.length, onRenderWindowChange])

  // Capabilities
  const enableStartLoad =
    topEnableStartLoad ??
    topEnableTopLoad ??
    infiniteScroll.enableStartLoad ??
    infiniteScroll.enableTopLoad ??
    (fetchPreviousPage !== undefined ||
      hasPreviousPage !== undefined ||
      externalHasMoreTop !== undefined ||
      externalHasMoreStart !== undefined ||
      externalHasMoreLeft !== undefined ||
      onLoadMore !== undefined ||
      renderWindow.start > 0)

  const hasMoreEnd =
    hasNextPage !== undefined
      ? hasNextPage
      : externalHasMoreEnd !== undefined
        ? externalHasMoreEnd
        : externalHasMoreRight !== undefined
          ? externalHasMoreRight
          : externalHasMoreBottom !== undefined
            ? externalHasMoreBottom
            : renderWindow.end < allItems.length

  const hasMoreStart =
    hasPreviousPage !== undefined
      ? hasPreviousPage
      : externalHasMoreStart !== undefined
        ? externalHasMoreStart
        : externalHasMoreLeft !== undefined
          ? externalHasMoreLeft
          : externalHasMoreTop !== undefined
            ? externalHasMoreTop
            : renderWindow.start > 0

  // Imperative mirrors so triggerLoad never acts on a stale hasMore/loading from a prior render
  // (drag-scroll probes fire between commits and were skipping batches on stale false).
  const hasMoreEndRef = useRef(hasMoreEnd)
  hasMoreEndRef.current = hasMoreEnd
  const hasMoreStartRef = useRef(hasMoreStart)
  hasMoreStartRef.current = hasMoreStart
  const loadingEndRef = useRef(loadingEnd)
  loadingEndRef.current = loadingEnd
  const loadingStartRef = useRef(loadingStart)
  loadingStartRef.current = loadingStart
  const enableStartLoadRef = useRef(enableStartLoad)
  enableStartLoadRef.current = enableStartLoad

  const visibleItems = useMemo(() => {
    return allItems.slice(renderWindow.start, renderWindow.end)
  }, [allItems, renderWindow.start, renderWindow.end])

  // Synchronize renderWindow with external allItems mutations
  useEffect(() => {
    const prevLength = prevItemsLengthRef.current
    const prevFirstItem = prevFirstItemRef.current
    const currentLength = allItems.length
    const currentFirstItem = allItems[0]

    prevItemsLengthRef.current = currentLength
    prevFirstItemRef.current = currentFirstItem

    if (currentLength === 0) {
      setRenderWindow((prev) => (prev.start === 0 && prev.end === 0 ? prev : { start: 0, end: 0 }))
      return
    }

    if (prevLength === 0) {
      const initialCount = Math.min(initialLoadCount, maxLoadedItems ?? currentLength, currentLength)
      setRenderWindow({ start: 0, end: initialCount })
      return
    }

    if (currentLength === prevLength) {
      setRenderWindow((prev) => {
        const clampedEnd = Math.min(currentLength, Math.max(1, prev.end))
        const clampedStart = Math.min(prev.start, Math.max(0, clampedEnd - 1))
        if (prev.start === clampedStart && prev.end === clampedEnd) return prev
        return { start: clampedStart, end: clampedEnd }
      })
      return
    }

    // Prepend: items added before start
    if (currentLength > prevLength && currentFirstItem !== prevFirstItem) {
      const addedCount = currentLength - prevLength
      const dragging = isDragSession()
      if (!dragging && activeDndId == null && renderWindow.start === 0) {
        const prevId = (prevFirstItem as any)?.id ?? (prevFirstItem as any)?.key ?? 0
        captureAnchor(prevId)
      }
      lastRequestedBoundaryRef.current.startFirstId = null
      setRenderWindow((prev) => {
        if (dragging) {
          const next = {
            start: prev.start,
            end: Math.min(currentLength, prev.end + addedCount),
          }
          renderWindowRef.current = next
          return next
        }
        if (prev.start > 0) {
          const nextStart = Math.min(currentLength - 1, prev.start + addedCount)
          const nextEnd = maxLoadedItems
            ? Math.min(currentLength, nextStart + maxLoadedItems)
            : Math.min(currentLength, prev.end + addedCount)
          const next = { start: nextStart, end: nextEnd }
          renderWindowRef.current = next
          return next
        }
        const next = {
          start: 0,
          end: maxLoadedItems
            ? Math.min(currentLength, maxLoadedItems)
            : Math.min(currentLength, prev.end + addedCount),
        }
        renderWindowRef.current = next
        return next
      })
      return
    }

    // Append: items added at end (onLoadMore / fetchNextPage) or inserted after first item
    if (currentLength > prevLength && currentFirstItem === prevFirstItem) {
      lastRequestedBoundaryRef.current.endLastId = null
      const dragging = isDragSession()
      const wasAtEnd = renderWindow.end >= prevLength

      if (!dragging && activeDndId == null && wasAtEnd && maxLoadedItems) {
        const loadedCount = currentLength - renderWindow.start
        if (loadedCount > maxLoadedItems) {
          const newStart = currentLength - maxLoadedItems
          if (newStart > renderWindow.start) captureAnchor()
        }
      } else if (!dragging && wasAtEnd) {
        captureAnchor()
      }

      setRenderWindow((prev) => {
        // If the window was NOT at the end of the previous in-memory items list,
        // do not jump the window to the tail of the list.
        if (prev.end < prevLength) {
          if (maxLoadedItems && prev.end - prev.start < maxLoadedItems) {
            const grownEnd = Math.min(currentLength, prev.start + maxLoadedItems)
            const next = { start: prev.start, end: grownEnd }
            renderWindowRef.current = next
            return next
          }
          return prev
        }

        // During drag-scroll: grow end by the newly appended count only when we were
        // already at the prior data end. Never jump start, and never leap to the tail
        // from a mid-window (that skipped unseen in-memory batches).
        if (dragging) {
          const next = { start: prev.start, end: currentLength }
          renderWindowRef.current = next
          return next
        }
        const newEnd = currentLength
        if (!maxLoadedItems) {
          const next = { start: prev.start, end: newEnd }
          renderWindowRef.current = next
          return next
        }
        const loadedCount = newEnd - prev.start
        const newStart = loadedCount > maxLoadedItems ? newEnd - maxLoadedItems : prev.start
        const next = { start: newStart, end: newEnd }
        renderWindowRef.current = next
        return next
      })
      return
    }

    // Truncate
    if (currentLength < prevLength) {
      setRenderWindow((prev) => {
        const clampedEnd = Math.min(currentLength, Math.max(1, prev.end))
        const clampedStart = maxLoadedItems
          ? Math.max(0, clampedEnd - maxLoadedItems)
          : Math.min(prev.start, Math.max(0, clampedEnd - 1))
        const next = { start: clampedStart, end: clampedEnd }
        renderWindowRef.current = next
        return next
      })
    }
  }, [allItems, initialLoadCount, maxLoadedItems, activeDndId, renderWindow.start, renderWindow.end, captureAnchor])

  const getItemKey = (item: any, fallback: number) => {
    if (item == null) return String(fallback)
    return String(item.id ?? item.key ?? fallback)
  }

  // Single Core Trigger Function — returns false when the load was skipped (caller may re-arm).
  // Uses refs for window/items/hasMore so rapid drag-scroll probes never act on stale state
  // (stale end / stale hasMore=false caused skipped batches / missed onLoadMore).
  const triggerLoad = useCallback(
    (dir: 'start' | 'end'): boolean => {
      if (isBusyRef.current[dir]) return false

      const windowNow = renderWindowRef.current
      const itemsNow = allItemsRef.current
      const dragging = isDragSession()
      const activeIdx = (() => {
        if (activeDndIdRef.current == null) return -1
        const idStr = String(activeDndIdRef.current)
        return itemsNow.findIndex((it: any) => {
          const id = it?.id != null ? String(it.id) : it?.key != null ? String(it.key) : String(it)
          return id === idStr
        })
      })()

      if (dir === 'start' && (!enableStartLoadRef.current || !hasMoreStartRef.current || loadingStartRef.current)) {
        return false
      }
      if (dir === 'end' && (!hasMoreEndRef.current || loadingEndRef.current)) return false

      const isExternal = dir === 'start' ? windowNow.start <= 0 : windowNow.end >= itemsNow.length

      // Original contract: external onLoadMore/fetch requires a user displacement toward that edge
      if (isExternal && !hasDisplacedRef.current[dir] && !dragging) return false

      // Prevent duplicate external requests for the exact same boundary state
      if (isExternal && itemsNow.length > 0) {
        if (dir === 'start') {
          const firstKey = getItemKey(itemsNow[0], 0)
          if (lastRequestedBoundaryRef.current.startFirstId === firstKey) return false
        } else {
          const lastKey = getItemKey(itemsNow[itemsNow.length - 1], itemsNow.length - 1)
          if (lastRequestedBoundaryRef.current.endLastId === lastKey) return false
        }
      }

      const now = Date.now()
      // In-memory slides during drag: short gap only (busy-through-paint is the real gate).
      // External / idle: keep 300ms so wheel overscroll cannot walk the window.
      const minGap = dragging && !isExternal ? 50 : 300
      if (now - lastLoadTimeRef.current[dir] < minGap) return false

      isBusyRef.current[dir] = true
      lastLoadTimeRef.current[dir] = now

      if (isExternal) {
        // During drag-scroll keep displaced true so a slow onLoadMore can retry after
        // boundary unlock when items arrive; idle still clears like the original contract.
        if (!dragging) hasDisplacedRef.current[dir] = false
        if (itemsNow.length > 0) {
          if (dir === 'start') {
            lastRequestedBoundaryRef.current.startFirstId = getItemKey(itemsNow[0], 0)
          } else {
            lastRequestedBoundaryRef.current.endLastId = getItemKey(
              itemsNow[itemsNow.length - 1],
              itemsNow.length - 1
            )
          }
        }
      }

      const releaseBusyAfterPaint = () => {
        // Hold busy through commit+paint so probe/observer/scroll cannot double-slide
        // in the same frame (that skipped the batch the user never got to see).
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            isBusyRef.current[dir] = false
          })
        })
      }

      const applyWindow = (next: { start: number; end: number }) => {
        renderWindowRef.current = next
        // Keep derived hasMore in sync for the next probe before React re-renders
        if (hasNextPage === undefined && externalHasMoreEnd === undefined && externalHasMoreRight === undefined && externalHasMoreBottom === undefined) {
          hasMoreEndRef.current = next.end < allItemsRef.current.length
        }
        if (hasPreviousPage === undefined && externalHasMoreStart === undefined && externalHasMoreLeft === undefined && externalHasMoreTop === undefined) {
          hasMoreStartRef.current = next.start > 0
        }
        return next
      }

      void (async () => {
        try {
          if (dir === 'start') {
            if (windowNow.start > 0) {
              if (!dragging) {
                captureAnchor()
                pendingSettleEdgeRef.current = 'start'
              }
              setRenderWindow((prev) => {
                const itemsLen = allItemsRef.current.length
                if (prev.start <= 0) return prev
                const newStart = Math.max(0, prev.start - slideStep)
                if (dragging) {
                  // Grow-only toward start; keep active item mounted; never drop the trailing side past active
                  let newEnd = prev.end
                  if (activeIdx !== -1 && activeIdx >= newEnd) {
                    newEnd = Math.min(itemsLen, activeIdx + 1)
                  }
                  return applyWindow({ start: newStart, end: newEnd })
                }
                let newEnd = prev.end
                if (maxLoadedItems) {
                  newEnd = Math.min(itemsLen, newStart + maxLoadedItems)
                  const overlap = Math.max(1, Math.floor(maxLoadedItems / 2))
                  newEnd = Math.max(newEnd, Math.min(itemsLen, prev.start + overlap))
                  if (activeIdx !== -1 && activeIdx >= newEnd) {
                    newEnd = Math.min(itemsLen, activeIdx + 1)
                  }
                }
                return applyWindow({ start: newStart, end: newEnd })
              })
              releaseBusyAfterPaint()
            } else if (fetchPreviousPage) {
              captureAnchor()
              await fetchPreviousPage()
              isBusyRef.current[dir] = false
            } else if (onLoadMore) {
              captureAnchor()
              await onLoadMore(isHorizontal ? 'start' : 'top', 0)
              isBusyRef.current[dir] = false
            } else {
              isBusyRef.current[dir] = false
            }
          } else {
            if (windowNow.end < itemsNow.length) {
              if (!dragging) {
                captureAnchor()
                pendingSettleEdgeRef.current = 'end'
              }
              setRenderWindow((prev) => {
                const itemsLen = allItemsRef.current.length
                if (prev.end >= itemsLen) return prev
                const newEnd = Math.min(itemsLen, prev.end + slideStep)
                if (dragging) {
                  // Grow-only toward end — never advance start (that skipped unseen batches)
                  let newStart = prev.start
                  if (activeIdx !== -1 && activeIdx < newStart) newStart = activeIdx
                  return applyWindow({ start: newStart, end: Math.max(prev.end, newEnd) })
                }
                let newStart = prev.start
                if (maxLoadedItems && newEnd - newStart > maxLoadedItems) {
                  const overlap = Math.max(1, Math.floor(maxLoadedItems / 2))
                  newStart = newEnd - maxLoadedItems
                  newStart = Math.min(newStart, Math.max(0, prev.end - overlap))
                }
                if (activeIdx !== -1 && activeIdx < newStart) newStart = activeIdx
                return applyWindow({ start: newStart, end: newEnd })
              })
              releaseBusyAfterPaint()
            } else if (fetchNextPage) {
              await fetchNextPage()
              isBusyRef.current[dir] = false
            } else if (onLoadMore) {
              await onLoadMore(isHorizontal ? 'end' : 'bottom', itemsNow.length)
              isBusyRef.current[dir] = false
            } else {
              isBusyRef.current[dir] = false
            }
          }
        } catch (err) {
          console.error('[InfiniteScrollSection] load error:', err)
          isBusyRef.current[dir] = false
        }
      })()

      return true
    },
    [
      slideStep,
      maxLoadedItems,
      fetchPreviousPage,
      fetchNextPage,
      onLoadMore,
      isHorizontal,
      captureAnchor,
      hasNextPage,
      hasPreviousPage,
      externalHasMoreEnd,
      externalHasMoreRight,
      externalHasMoreBottom,
      externalHasMoreStart,
      externalHasMoreLeft,
      externalHasMoreTop,
    ]
  )

  const handleDisplacement = useCallback(
    (rawScrollPos: number, delta: number) => {
      if (Math.abs(delta) < 0.5) return
      const container = containerRef.current
      if (!container) return

      const clientDim = isHorizontal ? container.clientWidth : container.clientHeight
      const scrollDim = isHorizontal ? container.scrollWidth : container.scrollHeight
      const maxScroll = Math.max(0, scrollDim - clientDim)

      const scrollPos = Math.max(0, Math.min(rawScrollPos, maxScroll))
      const effectiveThreshold = maxScroll > 0 ? Math.min(threshold, maxScroll * 0.35) : 0
      const leaveBuffer = 15
      const windowNow = renderWindowRef.current
      const itemsLen = allItemsRef.current.length
      const atDataEnd = windowNow.end >= itemsLen
      const atDataStart = windowNow.start <= 0
      const dragging = isDragSession()

      if (delta > 0) {
        // Mark displaced so onLoadMore can fire (original contract)
        hasDisplacedRef.current.end = true
        if (scrollPos < maxScroll - effectiveThreshold - leaveBuffer) {
          edgeArmedRef.current.end = true
        }
        if (scrollPos > effectiveThreshold + leaveBuffer) {
          lastRequestedBoundaryRef.current.startFirstId = null
        }
        if (maxScroll > 0 && scrollPos >= maxScroll - effectiveThreshold) {
          // External / data-end: hasDisplaced gates inside triggerLoad.
          // In-memory: edgeArmed prevents wheel runaway — but during drag-scroll the
          // pointer stays in the auto-scroll zone, so edgeArmed must not block loads.
          if (atDataEnd || edgeArmedRef.current.end || dragging) {
            if (!atDataEnd && !dragging) edgeArmedRef.current.end = false
            if (!triggerLoad('end') && !atDataEnd && !dragging) {
              edgeArmedRef.current.end = true
            }
          }
        }
      } else {
        hasDisplacedRef.current.start = true
        if (scrollPos > effectiveThreshold + leaveBuffer) {
          edgeArmedRef.current.start = true
        }
        if (maxScroll > 0 && scrollPos < maxScroll - effectiveThreshold - leaveBuffer) {
          lastRequestedBoundaryRef.current.endLastId = null
        }
        if (scrollPos <= effectiveThreshold) {
          if (atDataStart || edgeArmedRef.current.start || dragging) {
            if (!atDataStart && !dragging) edgeArmedRef.current.start = false
            if (!triggerLoad('start') && !atDataStart && !dragging) {
              edgeArmedRef.current.start = true
            }
          }
        }
      }
    },
    [isHorizontal, threshold, triggerLoad]
  )

  // Scroll Event Handler
  // Always keep lastScrollPosRef current (including programmatic scrolls) so the next
  // real scroll computes the correct delta. Boundary detection still runs on real scrolls.
  const handleScroll = useCallback(
    (e: UIEvent<HTMLDivElement>) => {
      const target = containerRef.current ?? (e.currentTarget as HTMLDivElement | null)
      if (!target) return

      const rawScrollPos = isHorizontal ? target.scrollLeft : target.scrollTop

      onScrollChange?.(
        rawScrollPos,
        isHorizontal ? target.scrollWidth : target.scrollHeight,
        isHorizontal ? target.clientWidth : target.clientHeight
      )

      if (isProgrammaticScrollRef.current) {
        lastScrollPosRef.current = rawScrollPos
        return
      }

      const scrollDiff = rawScrollPos - lastScrollPosRef.current
      lastScrollPosRef.current = rawScrollPos

      if (Math.abs(scrollDiff) > 0.5) {
        handleDisplacement(rawScrollPos, scrollDiff)
      }
    },
    [isHorizontal, onScrollChange, handleDisplacement]
  )

  const handleDisplacementRef = useRef(handleDisplacement)
  handleDisplacementRef.current = handleDisplacement

  // While dragging, dnd-kit auto-scroll often sits at the clamp (no scroll delta / no
  // scroll event). Probe the edge so the next in-memory batch can mount and auto-scroll
  // can continue. Idle/wheel onLoadMore paths are untouched (activeDndId is null then).
  useEffect(() => {
    if (activeDndId == null) return

    const probe = () => {
      const container = containerRef.current
      if (!container) return
      const clientDim = isHorizontal ? container.clientWidth : container.clientHeight
      const scrollDim = isHorizontal ? container.scrollWidth : container.scrollHeight
      const maxScroll = Math.max(0, scrollDim - clientDim)
      const scrollPos = isHorizontal ? container.scrollLeft : container.scrollTop
      const effectiveThreshold = maxScroll > 0 ? Math.min(threshold, maxScroll * 0.35) : 0

      if (maxScroll > 0 && scrollPos >= maxScroll - effectiveThreshold) {
        hasDisplacedRef.current.end = true
        handleDisplacementRef.current(scrollPos, 1)
      } else if (scrollPos <= effectiveThreshold) {
        hasDisplacedRef.current.start = true
        handleDisplacementRef.current(scrollPos, -1)
      }
    }

    const id = window.setInterval(probe, 80)
    return () => window.clearInterval(id)
  }, [activeDndId, isHorizontal, threshold])

  // Native non-passive wheel: React's onWheel is passive, so preventDefault is ignored.
  // Vertical: stopPropagation so a parent horizontal board/ISS cannot also remap deltaY → scrollLeft.
  // Horizontal: ignore events already handled by a nested vertical scroller.
  useEffect(() => {
    const container = containerNode
    if (!container) return

    const onWheel = (e: WheelEvent) => {
      if (isProgrammaticScrollRef.current) return

      if (isHorizontal) {
        // Nested column already claimed this gesture
        if (e.defaultPrevented) return

        const delta =
          Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.deltaY
        if (Math.abs(delta) < 0.5) return

        // If the pointer is over a nested vertical scroller inside us, do not remap Y→X
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          const path = typeof e.composedPath === 'function' ? e.composedPath() : []
          for (const node of path) {
            if (node === container) break
            if (!(node instanceof HTMLElement)) continue
            if (!container.contains(node)) continue
            const style = window.getComputedStyle(node)
            const oy = style.overflowY
            if (
              (oy === 'auto' || oy === 'scroll') &&
              node.scrollHeight > node.clientHeight + 2
            ) {
              return
            }
          }
        }

        const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth)
        const canScrollRight = delta > 0 && (container.scrollLeft < maxScroll - 0.5 || hasMoreEndRef.current || loadingEndRef.current)
        const canScrollLeft =
          delta < 0 &&
          (container.scrollLeft > 0.5 || (enableStartLoadRef.current && (hasMoreStartRef.current || loadingStartRef.current)))

        if (canScrollRight || canScrollLeft || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) {
          e.preventDefault()
          const prev = container.scrollLeft
          container.scrollLeft += delta
          if (Math.abs(container.scrollLeft - prev) < 0.5) {
            handleDisplacementRef.current(container.scrollLeft, delta)
          }
        } else {
          handleDisplacementRef.current(container.scrollLeft, delta)
        }
        return
      }

      // Vertical column/list: stop bubble so a parent DnD board horizontal scroller never pans,
      // and consume the wheel event when the container can scroll or load more in that direction.
      if (Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
        e.stopPropagation()
        const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight)
        const canScrollDown =
          e.deltaY > 0 && (container.scrollTop < maxScroll - 0.5 || hasMoreEndRef.current || loadingEndRef.current)
        const canScrollUp =
          e.deltaY < 0 &&
          (container.scrollTop > 0.5 || (enableStartLoadRef.current && (hasMoreStartRef.current || loadingStartRef.current)))

        if (canScrollDown || canScrollUp) {
          e.preventDefault()
          const prev = container.scrollTop
          container.scrollTop += e.deltaY
          if (Math.abs(container.scrollTop - prev) < 0.5) {
            handleDisplacementRef.current(container.scrollTop, e.deltaY)
          }
        } else {
          handleDisplacementRef.current(container.scrollTop, e.deltaY)
        }
      }
      // Dominant X: let parent horizontal board receive the event (intentional pan)
    }

    container.addEventListener('wheel', onWheel, { passive: false })
    return () => container.removeEventListener('wheel', onWheel)
  }, [isHorizontal, containerNode])

  // Touch Handlers
  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    const first = e.touches[0]
    if (first) touchStartRef.current = { x: first.clientX, y: first.clientY }
  }, [])

  const handleTouchMove = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (!touchStartRef.current || isProgrammaticScrollRef.current) return
      const current = e.touches[0]
      if (!current) return
      const container = containerRef.current
      if (!container) return
      const delta = isHorizontal
        ? touchStartRef.current.x - current.clientX
        : touchStartRef.current.y - current.clientY

      if (Math.abs(delta) > 4) {
        const rawScrollPos = isHorizontal ? container.scrollLeft : container.scrollTop
        handleDisplacement(rawScrollPos, delta)
        touchStartRef.current = { x: current.clientX, y: current.clientY }
      }
    },
    [isHorizontal, handleDisplacement]
  )

  // Keyboard Handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) return

      const isEndKey =
        (!isHorizontal && (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'End' || e.key === ' ')) ||
        (isHorizontal && (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'End'))

      const isStartKey =
        (!isHorizontal && (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'Home')) ||
        (isHorizontal && (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'Home'))

      const container = containerRef.current
      if (!container) return
      const rawScrollPos = isHorizontal ? container.scrollLeft : container.scrollTop
      if (isEndKey) handleDisplacement(rawScrollPos, 1)
      else if (isStartKey) handleDisplacement(rawScrollPos, -1)
    },
    [isHorizontal, handleDisplacement]
  )

  // Sentinels Observer (high-performance edge detection)
  // FIX: Stabilize triggerLoad reference via a ref so the observer doesn't tear down
  // and rebuild on every render (which would cause sentinels to be invisible briefly
  // and miss intersection events).
  const triggerLoadRef = useRef(triggerLoad)
  triggerLoadRef.current = triggerLoad

  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof IntersectionObserver === 'undefined') return

    const clientDim = isHorizontal ? container.clientWidth : container.clientHeight
    const safeMargin = Math.max(4, Math.min(threshold, Math.floor(clientDim * 0.15)))
    // FIX: Correct rootMargin format: vertical uses top/bottom margins, horizontal uses left/right.
    const rootMargin = isHorizontal
      ? `0px ${safeMargin}px 0px ${safeMargin}px`
      : `${safeMargin}px 0px ${safeMargin}px 0px`

    const observer = new IntersectionObserver(
      (entries) => {
        const target = containerRef.current
        if (!target) return

        const rawScrollPos = isHorizontal ? target.scrollLeft : target.scrollTop
        const clientD = isHorizontal ? target.clientWidth : target.clientHeight
        const scrollD = isHorizontal ? target.scrollWidth : target.scrollHeight
        const maxScroll = Math.max(0, scrollD - clientD)
        if (maxScroll <= 10) return

        const scrollPos = Math.max(0, Math.min(rawScrollPos, maxScroll))
        const effectiveThreshold = Math.min(threshold, maxScroll * 0.35)
        const windowNow = renderWindowRef.current
        const itemsLen = allItemsRef.current.length
        const atDataEnd = windowNow.end >= itemsLen
        const atDataStart = windowNow.start <= 0

        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const sentinelType = (entry.target as HTMLElement).getAttribute('data-sentinel')

          if (sentinelType === 'end') {
            if (
              (hasDisplacedRef.current.end || isDragSession()) &&
              scrollPos >= maxScroll - effectiveThreshold
            ) {
              const dragging = isDragSession()
              if (atDataEnd || edgeArmedRef.current.end || dragging) {
                if (!atDataEnd && !dragging) edgeArmedRef.current.end = false
                if (!triggerLoadRef.current('end') && !atDataEnd && !dragging) {
                  edgeArmedRef.current.end = true
                }
              }
            }
          } else if (sentinelType === 'start') {
            if (
              (hasDisplacedRef.current.start || isDragSession()) &&
              scrollPos <= effectiveThreshold
            ) {
              const dragging = isDragSession()
              if (atDataStart || edgeArmedRef.current.start || dragging) {
                if (!atDataStart && !dragging) edgeArmedRef.current.start = false
                if (!triggerLoadRef.current('start') && !atDataStart && !dragging) {
                  edgeArmedRef.current.start = true
                }
              }
            }
          }
        }
      },
      { root: container, rootMargin, threshold: 0 }
    )

    if (startSentinelRef.current) observer.observe(startSentinelRef.current)
    if (endSentinelRef.current) observer.observe(endSentinelRef.current)

    return () => observer.disconnect()
  }, [isHorizontal, threshold, activeDndId])

  // Auto-fill underfilled container viewport
  const autoFillAttemptRef = useRef<number>(0)
  useEffect(() => {
    if (!shouldAutoFill || !hasMoreEnd || loadingEnd || allItems.length === 0 || activeDndId != null) {
      autoFillAttemptRef.current = 0
      return
    }

    const container = containerRef.current
    if (!container) return

    const timer = setTimeout(() => {
      if (isProgrammaticScrollRef.current || isBusyRef.current.end || !hasMoreEnd) return
      const clientDim = isHorizontal ? container.clientWidth : container.clientHeight
      const scrollDim = isHorizontal ? container.scrollWidth : container.scrollHeight
      if (clientDim > 0 && scrollDim <= clientDim + 2 && autoFillAttemptRef.current < 3) {
        autoFillAttemptRef.current += 1
        hasDisplacedRef.current.end = true
        edgeArmedRef.current.end = true
        triggerLoad('end')
      }
    }, 60)

    return () => clearTimeout(timer)
  }, [shouldAutoFill, hasMoreEnd, loadingEnd, allItems.length, renderWindow.end, isHorizontal, activeDndId, triggerLoad])

  // ResizeObserver for responsive autofill
  useEffect(() => {
    const container = containerRef.current
    if (!container || !shouldAutoFill || typeof ResizeObserver === 'undefined') return

    const ro = new ResizeObserver(() => {
      if (activeDndId != null || isProgrammaticScrollRef.current || !hasMoreEnd || loadingEnd) return
      const clientDim = isHorizontal ? container.clientWidth : container.clientHeight
      const scrollDim = isHorizontal ? container.scrollWidth : container.scrollHeight
      if (clientDim > 0 && scrollDim <= clientDim + 2) {
        hasDisplacedRef.current.end = true
        edgeArmedRef.current.end = true
        triggerLoad('end')
      }
    })

    ro.observe(container)
    return () => ro.disconnect()
  }, [shouldAutoFill, hasMoreEnd, loadingEnd, isHorizontal, activeDndId, triggerLoad])

  const defaultLoadingEnd =
    loadingEndComponent ??
    loadingBottomComponent ?? (
      <div
        className={cn(
          'flex items-center justify-center gap-2 text-xs font-medium text-muted-fg animate-fadeIn',
          isHorizontal ? 'h-full min-h-0 px-3 shrink-0' : 'p-3'
        )}
      >
        <Loader className="size-4" />
        <span>Loading more records...</span>
      </div>
    )

  const defaultLoadingStart =
    loadingStartComponent ??
    loadingTopComponent ?? (
      <div
        className={cn(
          'flex items-center justify-center gap-2 text-xs font-medium text-muted-fg animate-fadeIn',
          isHorizontal ? 'h-full min-h-0 px-3 shrink-0' : 'p-3'
        )}
      >
        <Loader className="size-4" />
        <span>Loading previous records...</span>
      </div>
    )

  const defaultEndReached = endReachedComponent ?? (
    <div className={cn('text-center text-[11px] font-medium text-muted-fg/70', isHorizontal ? 'px-3 py-2 shrink-0 flex items-center' : 'py-3 border-t border-border/40 mt-2')}>
      ✓ All {allItems.length} records loaded
    </div>
  )

  const defaultEmptyState = emptyState ?? (
    <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-muted-fg">
      <span>No items to display</span>
    </div>
  )

  // Combine refs
  const containerRefCallback = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node
      setContainerNode(node)
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ; (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
      }
    },
    [ref]
  )

  // Prevent parent scroll chaining while items remain to be loaded
  const isScrollContained =
    hasMoreEnd ||
    (enableStartLoad && hasMoreStart) ||
    loadingEnd ||
    loadingStart

  if (allItems.length === 0 && !loadingEnd && !loadingStart) {
    return (
      <div
        ref={containerRefCallback}
        className={cn('flex items-center justify-center p-8 text-center text-sm text-muted-fg [overflow-anchor:none]', className)}
        style={{
          maxHeight: maxHeight ? (typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight) : undefined,
          maxWidth: maxWidth ? (typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth) : undefined,
          overflowAnchor: 'none',
          ...style,
        }}
        {...props}
      >
        {slots.emptyState ? renderSlot(slots.emptyState, slotProps.emptyState) : defaultEmptyState}
      </div>
    )
  }

  const endSlot =
    slots.loadingEnd ??
    slots.loadingRight ??
    slots.loadingBottom

  const startSlot =
    slots.loadingStart ??
    slots.loadingLeft ??
    slots.loadingTop

  return (
    <div
      ref={containerRefCallback}
      role="feed"
      tabIndex={0}
      aria-busy={loadingEnd || loadingStart}
      aria-label={props['aria-label'] ?? 'Scrollable data stream'}
      className={cn(
        'focus-visible:outline-hidden [overflow-anchor:none]',
        isHorizontal
          ? 'overflow-x-auto overflow-y-hidden flex flex-row items-stretch'
          : 'overflow-y-auto overflow-x-hidden',
        isScrollContained ? 'overscroll-contain' : 'overscroll-auto',
        className
      )}
      style={{
        maxHeight: maxHeight ? (typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight) : undefined,
        maxWidth: maxWidth ? (typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth) : undefined,
        // Contain both axes so nested column vertical scroll cannot chain into a parent board.
        overscrollBehavior: isScrollContained ? 'contain' : 'auto',
        overflowAnchor: 'none',
        ...style,
      }}
      onScroll={handleScroll}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {/* Screen Reader Live Region for Progressive Batch Announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {loadingStart
          ? 'Loading previous items...'
          : loadingEnd
            ? 'Loading more items...'
            : !hasMoreEnd && visibleItems.length > 0
              ? `All ${allItems.length} items loaded.`
              : ''}
      </div>

      {/* Top/Start Sentinel for IntersectionObserver (Direct sibling to protect inner grid/flex layouts) */}
      <div
        ref={startSentinelRef}
        data-sentinel="start"
        aria-hidden="true"
        style={{
          width: isHorizontal ? 1 : '100%',
          height: isHorizontal ? '100%' : 1,
          pointerEvents: 'none',
          opacity: 0,
          flexShrink: 0,
        }}
      />

      {/* Start / Top loading indicator */}
      {loadingStart && (
        <div
          data-loader="start"
          className={
            isHorizontal
              ? 'shrink-0 self-stretch flex items-center justify-center'
              : undefined
          }
        >
          {startSlot ? renderSlot(startSlot, slotProps.loadingStart ?? slotProps.loadingTop) : defaultLoadingStart}
        </div>
      )}

      {/* Main Items Content Stream */}
      <div
        ref={itemsListRef}
        className={cn(
          isHorizontal ? 'flex flex-row items-center gap-2' : 'space-y-2',
          contentClassName
        )}
      >
        {visibleItems.map((item, localIndex) => {
          const actualIndex = renderWindow.start + localIndex
          const itemObj = item as any
          const itemKey =
            itemObj?.id !== undefined
              ? String(itemObj.id)
              : itemObj?.key !== undefined
                ? String(itemObj.key)
                : String(actualIndex)

          if (renderItem) {
            const rendered = renderItem(item, actualIndex)
            if (React.isValidElement(rendered)) {
              return React.cloneElement(rendered as React.ReactElement<any>, {
                key: itemKey,
                'data-item-id': (rendered.props as any)['data-item-id'] ?? itemKey,
              })
            }
            return (
              <div key={itemKey} data-item-id={itemKey} className={isHorizontal ? 'shrink-0' : undefined}>
                {rendered}
              </div>
            )
          }

          return (
            <div key={itemKey} data-item-id={itemKey} className={isHorizontal ? 'shrink-0' : undefined}>
              {item as ReactNode}
            </div>
          )
        })}
      </div>

      {/* End / Bottom loading indicator */}
      {loadingEnd && (
        <div
          data-loader="end"
          className={
            isHorizontal
              ? 'shrink-0 self-stretch flex items-center justify-center'
              : undefined
          }
        >
          {endSlot ? renderSlot(endSlot, slotProps.loadingEnd ?? slotProps.loadingBottom) : defaultLoadingEnd}
        </div>
      )}

      {/* End reached component */}
      {!hasMoreEnd && !loadingEnd && visibleItems.length > 0 && (
        slots.endReached ? renderSlot(slots.endReached, slotProps.endReached) : defaultEndReached
      )}

      {/* Bottom/End Sentinel for IntersectionObserver */}
      <div
        ref={endSentinelRef}
        data-sentinel="end"
        aria-hidden="true"
        style={{
          width: isHorizontal ? 1 : '100%',
          height: isHorizontal ? '100%' : 1,
          pointerEvents: 'none',
          opacity: 0,
          flexShrink: 0,
        }}
      />
    </div>
  )
}

export const InfiniteScrollSection = createInterfaceComponent<
  InfiniteScrollSectionProps,
  InfiniteScrollSectionSlots
>(
  {
    name: 'InfiniteScrollSection',
    category: 'layout',
    description: 'Virtual and DOM-managed bidirectional infinite scroll container with load trigger thresholds supporting vertical and horizontal orientations.',
    version: '1.0.0',
    slots: {
      loadingTop: undefined,
      loadingBottom: undefined,
      loadingStart: undefined,
      loadingEnd: undefined,
      loadingLeft: undefined,
      loadingRight: undefined,
      endReached: undefined,
      emptyState: undefined,
    },
  },
  InfiniteScrollSectionPrimitive as any
)

InfiniteScrollSection.displayName = 'InfiniteScrollSection'
