/**
 * @file sortable-grid.tsx
 * SortableGrid Component Family with SortableGrid.Item and SortableGrid.Empty.
 * Provides responsive 2D layout sorting with compound attachments, sliding-window infinite scroll, and fail-closed defaults.
 */

import React, { forwardRef, useMemo, type HTMLAttributes, type ReactNode } from 'react'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { InfiniteScrollSection, type InfiniteScrollConfig } from '../../../core/components/infinite-scroll-section'
import { DndProvider, useOptionalDndContext } from '../../context'
import type { DragEndEvent, Identifier } from '../../engine/types'
import { reorderWithLexoRank } from '../../engine/lexorank'
import { useSortable, type UseSortableReturn } from '../../hooks/use-sortable'
import { SortableListEmpty, type SortableListEmptyProps } from '../sortable-list/sortable-list'
import { DragOverlay, type DragOverlayProps } from '../drag-overlay/drag-overlay'

// ============================================================================
// 1. SortableGridItem
// ============================================================================

export interface SortableGridItemSlots { }

export interface SortableGridItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'id'> {
  /** Unique item identifier. */
  id: Identifier
  /** Semantic type discriminant. */
  type?: string
  /** Domain payload data. */
  data?: any
  /** Container ID if nested. */
  containerId?: Identifier
  /** Current index in grid collection. */
  index?: number
  /** LexoRank string key. */
  rank?: string
  /** Whether sorting is disabled for this grid cell. */
  disabled?: boolean
  /** Custom UI or render function for the floating drag overlay portal when this cell is dragging. */
  renderOverlay?: ReactNode | ((activeItem: any) => ReactNode)
  /** Child content or render function receiving useSortable hook state. */
  children?: ReactNode | ((props: UseSortableReturn) => ReactNode)
  /** Typed slot components. */
  slots?: SlotComponents<SortableGridItemSlots>
  /** Typed slot props map. */
  slotProps?: SlotPropsMap<SortableGridItemSlots>
}

const SortableGridItemPrimitive = forwardRef<HTMLDivElement, SortableGridItemProps>(
  (
    {
      id,
      type = 'grid-item',
      data,
      containerId,
      index,
      rank,
      disabled = false,
      renderOverlay,
      className = '',
      style,
      children,
      slots,
      slotProps,
      ...props
    },
    ref
  ) => {
    const itemData = useMemo(() => {
      const base = typeof data === 'object' && data !== null ? data : { value: data }
      return {
        ...base,
        id,
        rank: rank ?? base.rank,
        containerId,
      }
    }, [data, id, rank, containerId])

    const sortable = useSortable({
      id,
      type,
      data: itemData,
      containerId,
      index,
      orientation: 'horizontal',
      disabled,
      renderOverlay,
    })

    const setRef = (node: HTMLDivElement | null) => {
      sortable.ref(node)
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as any).current = node
    }

    const dynamicStyle: React.CSSProperties = {
      ...sortable.style,
      ...style,
      opacity: sortable.style.opacity,
      touchAction: 'none',
    }

    const cellBaseClasses = `relative flex flex-col justify-center items-center p-space-md rounded-macro bg-bg-surface border border-border/80 shadow-xs hover:border-border-strong hover:shadow-subtle transition-[color,background-color,border-color,box-shadow] duration-300 ease-out select-none ${disabled ? 'cursor-default opacity-60' : 'cursor-grab active:cursor-grabbing'
      }`

    if (typeof children === 'function') {
      return (
        <div
          ref={setRef}
          data-item-id={String(id)}
          className={`${cellBaseClasses} ${className}`}
          style={dynamicStyle}
          {...sortable.attributes}
          {...sortable.listeners}
          {...props}
        >
          {children(sortable)}
        </div>
      )
    }

    return (
      <div
        ref={setRef}
        data-item-id={String(id)}
        className={`${cellBaseClasses} ${className}`}
        style={dynamicStyle}
        {...sortable.attributes}
        {...sortable.listeners}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SortableGridItemPrimitive.displayName = 'SortableGridItemPrimitive'

export const SortableGridItem = createInterfaceComponent<SortableGridItemProps, SortableGridItemSlots>(
  {
    name: 'SortableGridItem',
    category: 'utility',
    description: 'Draggable cell within a SortableGrid container.',
    version: '1.0.0',
    props: {
      disabled: false,
    },
    slots: {},
  },
  SortableGridItemPrimitive
)

// ============================================================================
// 2. SortableGrid (Root Family)
// ============================================================================

export interface SortableGridItemData {
  id: Identifier
  content?: ReactNode
  label?: string
  rank?: string
  [key: string]: any
}

export interface SortableGridSlots {
  /** Custom item renderer slot for grid cells. */
  item?: React.ComponentType<SortableGridItemProps>
  /** Empty state placeholder slot when items array is empty. */
  empty?: React.ComponentType<SortableListEmptyProps>
  /** Drag overlay floating ghost portal slot. */
  overlay?: React.ComponentType<DragOverlayProps>
}

export interface SortableGridProps extends HTMLAttributes<HTMLDivElement> {
  /** Array of data items to render in grid cells. */
  items?: SortableGridItemData[]
  /** Number of grid columns (1-12) or responsive grid class. Default: 3 */
  columns?: number
  /** Gap scale token between grid items. Default: 'md' */
  gap?: 'xs' | 'sm' | 'md' | 'lg'
  /** Unique container ID. */
  containerId?: Identifier
  /** Sliding-window infinite scroll options. */
  infiniteScroll?: InfiniteScrollConfig
  /** Callback fired when items are reordered. */
  onReorder?: (items: SortableGridItemData[]) => void
  /** Custom item renderer function for data-driven mode. */
  renderItem?: (item: SortableGridItemData, index: number) => ReactNode
  /** Custom UI or render function for the floating drag overlay portal. */
  renderOverlay?: ReactNode | ((activeItem: any) => ReactNode)
  /** Children content for compound JSX usage. */
  children?: ReactNode
  /** Typed slot components. */
  slots?: SlotComponents<SortableGridSlots>
  /** Typed slot props map. */
  slotProps?: SlotPropsMap<SortableGridSlots>
}

function hasOverlayChild(children: ReactNode): boolean {
  let hasOverlay = false
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      const name =
        (child.type as any)?.displayName ||
        (child.type as any)?.name ||
        (child.type as any)?.componentName
      if (child.type === DragOverlay || name === 'DragOverlay' || name === 'DragOverlayPrimitive') {
        hasOverlay = true
      }
    }
  })
  return hasOverlay
}

const SortableGridPrimitive = forwardRef<HTMLDivElement, SortableGridProps>(
  (
    {
      items = [],
      columns = 3,
      gap = 'md',
      containerId,
      infiniteScroll,
      onReorder,
      renderItem,
      renderOverlay,
      className = '',
      children,
      slots,
      slotProps,
      ...props
    },
    ref
  ) => {
    const dndContext = useOptionalDndContext()
    const gridColsMap: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
      4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
      5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5',
      6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6',
    }

    const gapMap: Record<string, string> = {
      xs: 'gap-space-xs',
      sm: 'gap-space-sm',
      md: 'gap-space-md',
      lg: 'gap-space-lg',
    }

    const gridClass = `grid ${gridColsMap[columns] ?? 'grid-cols-3'} ${gapMap[gap] ?? 'gap-space-md'}`
    const itemIds = useMemo(() => {
      if (Array.isArray(items) && items.length > 0) {
        return items.map((item) => String(item.id))
      }
      if (children != null) {
        return React.Children.toArray(children)
          .map((child: any) => (child?.props?.id != null ? String(child.props.id) : null))
          .filter(Boolean) as string[]
      }
      return []
    }, [items, children])

    const handleStandaloneDragEnd = React.useCallback(
      (event: DragEndEvent) => {
        if (!onReorder || !event.over || event.validation?.isRejected || event.isDropped === false) return
        const activeId = event.active.id
        const overId = event.over.id
        if (String(activeId) === String(overId)) return
        const oldIndex = items.findIndex((i) => String(i.id) === String(activeId))
        const newIndex = items.findIndex((i) => String(i.id) === String(overId))
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          onReorder?.(reorderWithLexoRank(items, oldIndex, newIndex))
        }
      },
      [items, onReorder]
    )

    React.useEffect(() => {
      if (!dndContext?.registerMonitor || !onReorder) return
      return dndContext.registerMonitor({
        onDragEnd: handleStandaloneDragEnd,
      })
    }, [dndContext, onReorder, handleStandaloneDragEnd])

    const resolveItemBody = (item: SortableGridItemData, index: number): ReactNode => {
      if (renderItem) return renderItem(item, index)
      return item.content ?? item.label ?? item.title ?? String(item.id)
    }

    const defaultOverlayRenderer = (activeItem: any) => {
      const data = activeItem?.data ?? activeItem
      if (!data) return null
      const matchedIndex = items.findIndex((i) => String(i.id) === String(data?.id ?? activeItem?.id))
      const matchedItem = matchedIndex !== -1 ? items[matchedIndex] : data
      const body = matchedItem ? resolveItemBody(matchedItem, matchedIndex !== -1 ? matchedIndex : 0) : String(activeItem?.id ?? '')
      return (
        <div className="flex flex-col justify-between p-space-md rounded-macro bg-bg-surface opacity-100 border border-border-strong shadow-strong min-w-40 select-none cursor-grabbing">
          <div className="w-full min-w-0">{body}</div>
        </div>
      )
    }

    // Compound mode
    if (children != null) {
      const alreadyHasOverlay = hasOverlayChild(children)
      const content = (
        <SortableContext items={itemIds} strategy={rectSortingStrategy}>
          <div
            ref={ref}
            className={`${gridClass} ${className}`}
            {...props}
          >
            {children}
          </div>
        </SortableContext>
      )

      const wrappedContent = (
        <>
          {content}
          {!alreadyHasOverlay &&
            renderSlot(
              slots?.overlay,
              { renderOverlay: renderOverlay ?? defaultOverlayRenderer, ...slotProps?.overlay },
              { defaultComponent: DragOverlay }
            )}
        </>
      )

      if (!dndContext) {
        return (
          <DndProvider
            onDragEnd={handleStandaloneDragEnd}
          >
            {wrappedContent}
          </DndProvider>
        )
      }
      return wrappedContent
    }

    // Fail-Closed default data-driven rendering (Rule C8)
    if (items.length === 0) {
      return (
        <div ref={ref} className={className} {...props}>
          {renderSlot(slots?.empty, slotProps?.empty, { defaultComponent: SortableListEmpty })}
        </div>
      )
    }

    // Infinite Scroll Mode
    if (infiniteScroll) {
      const infiniteContent = (
        <div ref={ref} className={cn('w-full min-w-0', className)} {...props}>
          <SortableContext items={itemIds} strategy={rectSortingStrategy}>
            <InfiniteScrollSection
              items={items}
              infiniteScroll={infiniteScroll}
              maxLoadedItems={infiniteScroll.maxLoadedItems ?? infiniteScroll.windowSize ?? 30}
              initialLoadCount={infiniteScroll.initialLoadCount ?? 20}
              appendCount={infiniteScroll.appendCount ?? 15}
              maxHeight={infiniteScroll.maxHeight ?? 450}
              threshold={infiniteScroll.threshold ?? 80}
              onLoadMore={infiniteScroll.onLoadMore as any}
              fetchNextPage={infiniteScroll.fetchNextPage}
              fetchPreviousPage={infiniteScroll.fetchPreviousPage}
              hasMoreBottom={infiniteScroll.hasMoreBottom}
              hasMoreTop={infiniteScroll.hasMoreTop}
              hasMoreEnd={infiniteScroll.hasMoreEnd}
              hasMoreStart={infiniteScroll.hasMoreStart}
              hasNextPage={infiniteScroll.hasNextPage}
              hasPreviousPage={infiniteScroll.hasPreviousPage}
              isFetchingNextPage={infiniteScroll.isFetchingNextPage}
              isFetchingPreviousPage={infiniteScroll.isFetchingPreviousPage}
              loadingBottom={infiniteScroll.loadingBottom}
              loadingTop={infiniteScroll.loadingTop}
              loadingEnd={infiniteScroll.loadingEnd}
              loadingStart={infiniteScroll.loadingStart}
              loadingBottomComponent={infiniteScroll.loadingBottomComponent}
              loadingTopComponent={infiniteScroll.loadingTopComponent}
              loadingStartComponent={infiniteScroll.loadingStartComponent}
              loadingEndComponent={infiniteScroll.loadingEndComponent}
              endReachedComponent={infiniteScroll.endReachedComponent}
              emptyState={infiniteScroll.emptyState}
              enableTopLoad={infiniteScroll.enableTopLoad}
              enableStartLoad={infiniteScroll.enableStartLoad}
              autoFill={infiniteScroll.autoFill}
              contentClassName={gridClass}
              renderItem={(item, index) => (
                <SortableGridItem
                  key={String(item.id)}
                  id={item.id}
                  index={index}
                  containerId={containerId}
                  data={item}
                  rank={item.rank}
                >
                  {resolveItemBody(item, index)}
                </SortableGridItem>
              )}
            />
          </SortableContext>
          {renderSlot(
            slots?.overlay,
            { renderOverlay: renderOverlay ?? defaultOverlayRenderer, ...slotProps?.overlay },
            { defaultComponent: DragOverlay }
          )}
        </div>
      )

      if (!dndContext) {
        return (
          <DndProvider onDragEnd={handleStandaloneDragEnd}>
            {infiniteContent}
          </DndProvider>
        )
      }
      return infiniteContent
    }

    const dataGridContent = (
      <>
        <SortableContext items={itemIds} strategy={rectSortingStrategy}>
          <div
            ref={ref}
            className={`${gridClass} ${className}`}
            {...props}
          >
            {items.map((item, index) => {
              const body = resolveItemBody(item, index)
              const itemNode = (
                <SortableGridItem
                  key={String(item.id)}
                  id={item.id}
                  index={index}
                  containerId={containerId}
                  data={item}
                  rank={item.rank}
                >
                  {body}
                </SortableGridItem>
              )
              return (
                renderSlot(
                  slots?.item,
                  {
                    id: item.id,
                    index,
                    containerId,
                    data: item,
                    rank: item.rank,
                    children: body,
                    ...slotProps?.item,
                  },
                  { defaultComponent: undefined }
                ) ?? itemNode
              )
            })}
          </div>
        </SortableContext>
        {renderSlot(
          slots?.overlay,
          { renderOverlay: renderOverlay ?? defaultOverlayRenderer, ...slotProps?.overlay },
          { defaultComponent: DragOverlay }
        )}
      </>
    )

    if (!dndContext) {
      return (
        <DndProvider
          onDragEnd={handleStandaloneDragEnd}
        >
          {dataGridContent}
        </DndProvider>
      )
    }

    return dataGridContent
  }
)
SortableGridPrimitive.displayName = 'SortableGridPrimitive'

export const SortableGrid = createInterfaceComponent<SortableGridProps, SortableGridSlots>(
  {
    name: 'SortableGrid',
    category: 'utility',
    description: 'Responsive 2D sortable grid container supporting drag rearrangement, sliding-window infinite scroll, and LexoRank calculations.',
    version: '1.1.0',
    props: {
      columns: 3,
      gap: 'md',
      items: [],
    },
    slots: {
      item: undefined,
      empty: undefined,
      overlay: undefined,
    },
  },
  SortableGridPrimitive
)

SortableGrid.Item = SortableGridItem
SortableGrid.Empty = SortableListEmpty
SortableGrid.Overlay = DragOverlay
