/**
 * @file sortable-list.tsx
 * SortableList Component Family with SortableList.Item, SortableList.Handle, and SortableList.Empty.
 * Supports sliding-window InfiniteScrollSection with LexoRank repositioning.
 * Implements Rule C6 (Universal Wrapping & Compound Attachments) and Rule C8 (Fail-Closed Defaults).
 */

import React, { forwardRef, useMemo, type HTMLAttributes, type ReactNode } from 'react'
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { InfiniteScrollSection, type InfiniteScrollConfig } from '../../../core/components/infinite-scroll-section'
import { DndProvider, useOptionalDndContext } from '../../context'
import type { DragEndEvent, Identifier } from '../../engine/types'
import { reorderWithLexoRank } from '../../engine/lexorank'
import { useSortable, type UseSortableReturn } from '../../hooks/use-sortable'
import { DraggableHandle, type DraggableHandleProps } from '../draggable/draggable'
import { DragOverlay, type DragOverlayProps } from '../drag-overlay/drag-overlay'

// ============================================================================
// 1. SortableListEmpty
// ============================================================================

export interface SortableListEmptySlots {
  /** Leading icon indicator slot. */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface SortableListEmptyProps extends HTMLAttributes<HTMLDivElement> {
  /** Custom fallback message text when list has no records. */
  message?: string
  /** Child content elements. */
  children?: ReactNode
  /** Typed slot components. */
  slots?: SlotComponents<SortableListEmptySlots>
  /** Typed slot props map. */
  slotProps?: SlotPropsMap<SortableListEmptySlots>
}

const SortableListEmptyPrimitive = forwardRef<HTMLDivElement, SortableListEmptyProps>(
  ({ message = 'No items in list', className = '', children, slots, slotProps, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        className={`flex flex-col items-center justify-center p-space-lg text-center text-sm text-fg-muted border border-dashed border-border-subtle rounded-macro bg-bg-subtle/30 ${className}`}
        {...props}
      >
        {renderSlot(slots?.icon, slotProps?.icon)}
        {children ?? message}
      </div>
    )
  }
)
SortableListEmptyPrimitive.displayName = 'SortableListEmptyPrimitive'

export const SortableListEmpty = createInterfaceComponent<SortableListEmptyProps, SortableListEmptySlots>(
  {
    name: 'SortableListEmpty',
    category: 'utility',
    description: 'Empty state placeholder when a sortable list contains no items.',
    version: '1.0.0',
    props: {
      message: 'No items in list',
    },
    slots: {
      icon: undefined,
    },
  },
  SortableListEmptyPrimitive
)

// ============================================================================
// 2. SortableListItem
// ============================================================================

export interface SortableListItemSlots {
  /** Drag handle trigger slot. */
  handle?: React.ComponentType<DraggableHandleProps>
}

export interface SortableListItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'id'> {
  /** Unique item identifier. */
  id: Identifier
  /** Semantic type discriminant. */
  type?: string
  /** Domain data attached to this item. */
  data?: any
  /** Container ID if nested. */
  containerId?: Identifier
  /** Current index in collection. */
  index?: number
  /** LexoRank string key. */
  rank?: string
  /** Sorting orientation ('vertical' | 'horizontal'). Default: 'vertical' */
  orientation?: 'vertical' | 'horizontal'
  /** Whether sorting is disabled for this item. */
  disabled?: boolean
  /** Custom UI or render function for the floating drag overlay portal when this item is dragging. */
  renderOverlay?: ReactNode | ((activeItem: any) => ReactNode)
  /** Child content or render function. */
  children?: ReactNode | ((props: UseSortableReturn) => ReactNode)
  /** Typed slot components. */
  slots?: SlotComponents<SortableListItemSlots>
  /** Typed slot props map. */
  slotProps?: SlotPropsMap<SortableListItemSlots>
}

const SortableListItemPrimitive = forwardRef<HTMLDivElement, SortableListItemProps>(
  (
    {
      id,
      type = 'sortable-item',
      data,
      containerId,
      index,
      rank,
      orientation = 'vertical',
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
      orientation,
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

    const isHorizontal = orientation === 'horizontal'
    const orientationClasses = isHorizontal
      ? 'w-56 sm:w-64 max-w-xs shrink-0 min-w-0 box-border'
      : 'w-full min-w-0 box-border'

    const itemBaseClasses = `relative flex items-center gap-space-sm p-space-sm rounded-base bg-bg-surface border border-border/80 shadow-xs hover:border-border-strong hover:shadow-subtle transition-[color,background-color,border-color,box-shadow] duration-300 ease-out select-none ${disabled ? 'cursor-default opacity-60' : 'cursor-grab active:cursor-grabbing'
      } ${orientationClasses}`

    if (typeof children === 'function') {
      return (
        <div
          ref={setRef}
          data-item-id={String(id)}
          className={`${itemBaseClasses} ${className}`}
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
        className={`${itemBaseClasses} ${className}`}
        style={dynamicStyle}
        {...sortable.attributes}
        {...sortable.listeners}
        {...props}
      >
        {renderSlot(slots?.handle, slotProps?.handle, { defaultComponent: DraggableHandle })}
        <div className="flex-1 min-w-0 truncate">{children}</div>
      </div>
    )
  }
)
SortableListItemPrimitive.displayName = 'SortableListItemPrimitive'

export const SortableListItem = createInterfaceComponent<SortableListItemProps, SortableListItemSlots>(
  {
    name: 'SortableListItem',
    category: 'utility',
    description: 'Individual sortable row item with grip handle, drag states, and optical styling.',
    version: '1.0.0',
    props: {
      orientation: 'vertical',
      disabled: false,
    },
    slots: {
      handle: undefined,
    },
  },
  SortableListItemPrimitive
)

// ============================================================================
// 3. SortableList (Root Family)
// ============================================================================

export interface SortableListItemData {
  id: Identifier
  label?: string
  content?: ReactNode
  rank?: string
  [key: string]: any
}

export interface SortableListSlots {
  /** Custom item renderer slot for list rows. */
  item?: React.ComponentType<SortableListItemProps>
  /** Empty state placeholder slot when items array is empty. */
  empty?: React.ComponentType<SortableListEmptyProps>
  /** Drag overlay floating ghost portal slot. */
  overlay?: React.ComponentType<DragOverlayProps>
}

export interface SortableListProps extends HTMLAttributes<HTMLDivElement> {
  /** Array of data items to render and sort. */
  items?: SortableListItemData[]
  /** Layout orientation ('vertical' | 'horizontal'). Default: 'vertical' */
  orientation?: 'vertical' | 'horizontal'
  /** Unique container ID for multi-list operations. */
  containerId?: Identifier
  /** Sliding-window infinite scroll configuration options. */
  infiniteScroll?: InfiniteScrollConfig
  /** Callback fired when items are reordered with LexoRank calculations. */
  onReorder?: (items: SortableListItemData[]) => void
  /** Custom item renderer function for data-driven mode. */
  renderItem?: (item: SortableListItemData, index: number) => ReactNode
  /** Custom UI or render function for the floating drag overlay portal. */
  renderOverlay?: ReactNode | ((activeItem: any) => ReactNode)
  /** Children content if using compound composition. */
  children?: ReactNode
  /** Typed slot components. */
  slots?: SlotComponents<SortableListSlots>
  /** Typed slot props map. */
  slotProps?: SlotPropsMap<SortableListSlots>
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

const SortableListPrimitive = forwardRef<HTMLDivElement, SortableListProps>(
  (
    {
      items = [],
      orientation = 'vertical',
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
    const isHorizontal = orientation === 'horizontal'
    const orientationClasses = isHorizontal
      ? 'flex flex-row gap-space-sm items-center overflow-x-auto'
      : 'flex flex-col gap-space-sm overflow-x-hidden'

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
    const strategy = isHorizontal ? horizontalListSortingStrategy : verticalListSortingStrategy

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

    const resolveItemBody = (item: SortableListItemData, index: number): ReactNode => {
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
        <div className="flex items-center gap-space-sm p-space-sm rounded-base bg-bg-surface opacity-100 border border-border-strong shadow-strong min-w-45 select-none cursor-grabbing">
          <div className="flex-1 min-w-0 text-sm font-medium text-fg">{body}</div>
        </div>
      )
    }

    // Compound composition mode
    if (children != null) {
      const alreadyHasOverlay = hasOverlayChild(children)
      const content = (
        <SortableContext items={itemIds} strategy={strategy}>
          <div
            ref={ref}
            role="list"
            className={`${orientationClasses} ${className}`}
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
          <DndProvider onDragEnd={handleStandaloneDragEnd}>
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
          <SortableContext items={itemIds} strategy={strategy}>
            <InfiniteScrollSection
              orientation={orientation}
              items={items}
              infiniteScroll={infiniteScroll}
              maxLoadedItems={infiniteScroll.maxLoadedItems ?? infiniteScroll.windowSize ?? 30}
              initialLoadCount={infiniteScroll.initialLoadCount ?? 20}
              appendCount={infiniteScroll.appendCount ?? 15}
              maxHeight={infiniteScroll.maxHeight ?? (isHorizontal ? undefined : 400)}
              maxWidth={infiniteScroll.maxWidth}
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
              renderItem={(item, index) => (
                <SortableListItem
                  key={String(item.id)}
                  id={item.id}
                  index={index}
                  containerId={containerId}
                  orientation={orientation}
                  data={item}
                  rank={item.rank}
                >
                  {resolveItemBody(item, index)}
                </SortableListItem>
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

    const dataListContent = (
      <>
        <SortableContext items={itemIds} strategy={strategy}>
          <div
            ref={ref}
            role="list"
            className={`${orientationClasses} ${className}`}
            {...props}
          >
            {items.map((item, index) => {
              const body = resolveItemBody(item, index)
              const itemNode = (
                <SortableListItem
                  key={String(item.id)}
                  id={item.id}
                  index={index}
                  containerId={containerId}
                  orientation={orientation}
                  data={item}
                  rank={item.rank}
                >
                  {body}
                </SortableListItem>
              )
              return (
                renderSlot(
                  slots?.item,
                  {
                    id: item.id,
                    index,
                    containerId,
                    orientation,
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
        <DndProvider onDragEnd={handleStandaloneDragEnd}>
          {dataListContent}
        </DndProvider>
      )
    }

    return dataListContent
  }
)
SortableListPrimitive.displayName = 'SortableListPrimitive'

export const SortableList = createInterfaceComponent<SortableListProps, SortableListSlots>(
  {
    name: 'SortableList',
    category: 'utility',
    description: 'High-level sortable list container with compound members, sliding-window infinite scrolling, and LexoRank O(1) mutations.',
    version: '1.1.0',
    props: {
      items: [],
      orientation: 'vertical',
    },
    slots: {
      item: undefined,
      empty: undefined,
      overlay: undefined,
    },
  },
  SortableListPrimitive
)

// Compound Namespace Attachments (Rule C6)
SortableList.Item = SortableListItem
SortableList.Handle = DraggableHandle
SortableList.Empty = SortableListEmpty
SortableList.Overlay = DragOverlay
