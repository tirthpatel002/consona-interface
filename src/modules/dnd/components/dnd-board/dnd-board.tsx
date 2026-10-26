/**
 * @file dnd-board.tsx
 * DndBoard Component Family (Kanban Board) with Column, Item, and Header sub-components.
 * Supports function-based dynamic item partitioning, column/card LexoRank O(1) mutations,
 * and dual-axis (horizontal columns & vertical cards) sliding-window infinite scrolling.
 * Fully compliant with Rule C1, C4, C5, C6, and C8.
 */

import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState, type HTMLAttributes, type ReactNode } from 'react'
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { InfiniteScrollSection, type InfiniteScrollConfig } from '../../../core/components/infinite-scroll-section'
import { DndProvider, useOptionalDndContext } from '../../context'
import type {
  DragEndEvent,
  DragOverEvent,
  DragReorderEvent,
  DropRule,
  DropRulePredicate,
  Identifier,
} from '../../engine/types'
import {
  handleMultiContainerDrag,
  resolveMultiContainerMove,
  findContainerForItem,
  getItemId,
} from '../../engine/multi-container'
import { evaluateAcceptanceRule } from '../../engine/rules'
import { generateLexoRankBetween } from '../../engine/lexorank'
import { useShallowMemo } from '../../hooks/use-shallow-memo'
import { useSortable, type UseSortableReturn } from '../../hooks/use-sortable'
import { DraggableHandle, type DraggableHandleProps } from '../draggable/draggable'
import { DragOverlay, type DragOverlayProps } from '../drag-overlay/drag-overlay'

// ============================================================================
// 1. DndBoardItem & Column Context
// ============================================================================

export interface DndBoardColumnContextValue {
  columnId: Identifier
  title: string
  items: any[]
  maxCapacity?: number
  accept?: string | string[]
  rule?: DropRule | DropRulePredicate
  collapsible?: boolean
  collapsed?: boolean
  onToggleCollapse?: () => void
  disabled?: boolean
  rank?: string
  infiniteScroll?: InfiniteScrollConfig
}

const DndBoardColumnContext = React.createContext<DndBoardColumnContextValue | null>(null)

export interface DndBoardItemSlots {
  /** Drag handle trigger element slot. */
  handle?: React.ComponentType<DraggableHandleProps>
}

export interface DndBoardItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'id'> {
  /** Unique item identifier. */
  id: Identifier
  /** Semantic type tag (e.g. 'task', 'story', 'bug'). Default: 'task' */
  type?: string
  /** Domain payload data. */
  data?: any
  /** Parent column ID. */
  columnId?: Identifier
  /** Index in column list. */
  index?: number
  /** LexoRank string key. */
  rank?: string
  /** Whether interaction is disabled. */
  disabled?: boolean
  /** Custom UI or render function for the floating drag overlay portal when this item is dragging. */
  renderOverlay?: ReactNode | ((activeItem: any) => ReactNode)
  /** Child content or render function. */
  children?: ReactNode | ((props: UseSortableReturn) => ReactNode)
  /** Typed slot components. */
  slots?: SlotComponents<DndBoardItemSlots>
  /** Typed slot props map. */
  slotProps?: SlotPropsMap<DndBoardItemSlots>
}

const DndBoardItemPrimitive = forwardRef<HTMLDivElement, DndBoardItemProps>(
  (
    {
      id,
      type = 'task',
      data,
      columnId,
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
    const columnContext = React.useContext(DndBoardColumnContext)
    const effectiveColumnId = columnId ?? columnContext?.columnId
    const effectiveAccept = columnContext?.accept
    const effectiveRule = columnContext?.rule
    const effectiveDisabled = disabled || (columnContext?.disabled ?? false)

    // Card sortable payload — identity + layout only. Capacity/accept come from
    // OccupancyIndex on the parent column (O(1) Map→Set), not per-card copies.
    const rawItemData = useMemo(() => {
      const base = typeof data === 'object' && data !== null ? data : { value: data }
      return {
        ...base,
        id,
        type,
        rank: rank ?? base.rank,
        containerId: effectiveColumnId,
        columnId: effectiveColumnId,
        disabled: effectiveDisabled,
      }
    }, [data, id, type, rank, effectiveColumnId, effectiveDisabled])

    const itemData = useShallowMemo(rawItemData)

    const sortable = useSortable({
      id,
      type,
      data: itemData,
      containerId: effectiveColumnId,
      accept: effectiveAccept,
      rule: effectiveRule,
      index,
      orientation: 'vertical',
      disabled: effectiveDisabled,
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

    const itemBaseClasses =
      'relative flex flex-col gap-space-xs p-space-sm rounded-base bg-bg-surface border border-border/80 shadow-xs hover:border-border-strong hover:shadow-subtle transition-[color,background-color,border-color,box-shadow] duration-300 ease-out cursor-grab active:cursor-grabbing w-full min-w-0 box-border'

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
        <div className="flex items-center justify-between gap-space-xs w-full min-w-0">
          <div className="flex-1 min-w-0 font-medium text-sm text-fg">{children}</div>
          {slots?.handle && renderSlot(slots.handle, slotProps?.handle, { defaultComponent: DraggableHandle })}
        </div>
      </div>
    )
  }
)

DndBoardItemPrimitive.displayName = 'DndBoardItemPrimitive'

export const DndBoardItem = createInterfaceComponent<DndBoardItemProps, DndBoardItemSlots>(
  {
    name: 'DndBoardItem',
    category: 'utility',
    description: 'Draggable card item within a DndBoardColumn.',
    version: '1.0.0',
    props: {
      type: 'task',
      disabled: false,
    },
    slots: {
      handle: undefined,
    },
  },
  DndBoardItemPrimitive
)

// ============================================================================
// 2. DndBoardHeader
// ============================================================================

export interface DndBoardHeaderSlots {
  /** Drag handle trigger element slot. */
  handle?: React.ComponentType<DraggableHandleProps>
  /** Contextual options or settings trigger slot. */
  options?: React.ComponentType<HTMLAttributes<HTMLDivElement>>
  /** Collapse / expand toggle button slot. */
  collapseButton?: React.ComponentType<{ collapsed: boolean; onClick?: () => void }>
}

export interface DndBoardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Column title heading text. */
  title: string
  /** Number of items contained in this column. */
  count?: number
  /** Maximum capacity limit for this column. */
  maxCapacity?: number
  /** Whether the column can be toggled collapsed. */
  collapsible?: boolean
  /** Controlled collapsed state. */
  collapsed?: boolean
  /** Callback fired when collapse toggle is triggered. */
  onToggleCollapse?: () => void
  /** Typed slot components. */
  slots?: SlotComponents<DndBoardHeaderSlots>
  /** Typed slot props map. */
  slotProps?: SlotPropsMap<DndBoardHeaderSlots>
}

const DndBoardHeaderPrimitive = forwardRef<HTMLDivElement, DndBoardHeaderProps>(
  (
    {
      title: propTitle,
      count: propCount,
      maxCapacity: propMaxCapacity,
      collapsible: propCollapsible,
      collapsed: propCollapsed,
      onToggleCollapse: propOnToggleCollapse,
      className = '',
      children,
      slots,
      slotProps,
      ...props
    },
    ref
  ) => {
    const colCtx = React.useContext(DndBoardColumnContext)
    const title = propTitle || colCtx?.title || ''
    const count = propCount !== undefined ? propCount : colCtx?.items?.length
    const maxCapacity = propMaxCapacity !== undefined ? propMaxCapacity : colCtx?.maxCapacity
    const collapsible = propCollapsible ?? colCtx?.collapsible ?? true
    const collapsed = propCollapsed ?? colCtx?.collapsed ?? false
    const onToggleCollapse = propOnToggleCollapse ?? colCtx?.onToggleCollapse

    const isFull = maxCapacity != null && count != null && count >= maxCapacity

    const handleToggle = (e: React.SyntheticEvent) => {
      e.stopPropagation()
      onToggleCollapse?.()
    }

    const stopPropagation = (e: React.SyntheticEvent) => {
      e.stopPropagation()
    }

    if (collapsed) {
      return (
        <div
          ref={ref}
          className={cn('flex flex-col items-center justify-between h-full w-full py-1 gap-2 select-none', className)}
          {...props}
        >
          <div className="flex flex-col items-center gap-1.5 w-full">
            {collapsible && (
              slots?.collapseButton
                ? renderSlot(slots.collapseButton, { collapsed: true, onClick: onToggleCollapse, ...slotProps?.collapseButton })
                : (
                  <button
                    type="button"
                    onClick={handleToggle}
                    onPointerDown={stopPropagation}
                    onMouseDown={stopPropagation}
                    onTouchStart={stopPropagation}
                    title="Expand column"
                    className="p-1 rounded-md text-fg-muted hover:text-fg hover:bg-bg-subtle transition-colors flex items-center justify-center cursor-pointer border border-transparent hover:border-border/40"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                )
            )}
            {slots?.handle && renderSlot(slots.handle, slotProps?.handle, { defaultComponent: DraggableHandle })}
          </div>

          <div
            className="flex-1 flex items-center justify-center py-2 cursor-pointer select-none min-h-0 w-full"
            onClick={handleToggle}
            onPointerDown={stopPropagation}
            onMouseDown={stopPropagation}
            onTouchStart={stopPropagation}
            title={`${title} (Click to expand)`}
          >
            <span className="font-semibold text-xs text-fg tracking-wide [writing-mode:vertical-rl] rotate-180 truncate max-h-64">
              {title}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1.5 w-full">
            {count != null && (
              <span
                className={cn(
                  'px-1.5 py-0.5 text-2xs font-semibold rounded-full min-w-5 text-center',
                  isFull ? 'bg-danger-subtle text-danger' : 'bg-bg-muted text-fg-muted'
                )}
                title={maxCapacity != null ? `${count}/${maxCapacity} items` : `${count} items`}
              >
                {count}
              </span>
            )}
            {slots?.options && (
              <div
                onPointerDown={stopPropagation}
                onMouseDown={stopPropagation}
                onTouchStart={stopPropagation}
              >
                {renderSlot(slots.options, slotProps?.options)}
              </div>
            )}
          </div>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-between pb-space-xs mb-space-xs border-b border-border/40 gap-space-xs', className)}
        {...props}
      >
        <div className="flex items-center gap-space-xs min-w-0 flex-1">
          {slots?.handle && renderSlot(slots.handle, slotProps?.handle, { defaultComponent: DraggableHandle })}
          <h3 className="font-semibold text-sm text-fg truncate">{title}</h3>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {count != null && (
            <span
              className={cn(
                'px-space-xs py-0.5 text-xs font-medium rounded-full',
                isFull ? 'bg-danger-subtle text-danger' : 'bg-bg-muted text-fg-muted'
              )}
            >
              {count}
              {maxCapacity != null ? `/${maxCapacity}` : ''}
            </span>
          )}
          {slots?.options && (
            <div
              onPointerDown={stopPropagation}
              onMouseDown={stopPropagation}
              onTouchStart={stopPropagation}
            >
              {renderSlot(slots.options, slotProps?.options)}
            </div>
          )}
          {collapsible && (
            slots?.collapseButton
              ? renderSlot(slots.collapseButton, { collapsed: false, onClick: onToggleCollapse, ...slotProps?.collapseButton })
              : (
                <button
                  type="button"
                  onClick={handleToggle}
                  onPointerDown={stopPropagation}
                  onMouseDown={stopPropagation}
                  onTouchStart={stopPropagation}
                  title="Collapse column"
                  className="p-1 rounded-md text-fg-muted hover:text-fg hover:bg-bg-subtle transition-colors flex items-center justify-center cursor-pointer border border-transparent hover:border-border/40"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
              )
          )}
        </div>
      </div>
    )
  }
)

DndBoardHeaderPrimitive.displayName = 'DndBoardHeaderPrimitive'

export const DndBoardHeader = createInterfaceComponent<DndBoardHeaderProps, DndBoardHeaderSlots>(
  {
    name: 'DndBoardHeader',
    category: 'utility',
    description: 'Header component for DndBoardColumn with title, counter, and collapse control.',
    version: '1.0.0',
    props: {
      title: '',
      collapsible: true,
    },
    slots: {
      handle: undefined,
      options: undefined,
      collapseButton: undefined,
    },
  },
  DndBoardHeaderPrimitive
)

// ============================================================================
// 3. DndBoardColumn
// ============================================================================

export interface DndBoardColumnSlots {
  /** Column header container slot. */
  header?: React.ComponentType<DndBoardHeaderProps>
  /** Column drag handle slot. */
  handle?: React.ComponentType<DraggableHandleProps>
  /** Options or settings menu slot. */
  options?: React.ComponentType<HTMLAttributes<HTMLDivElement>>
  /** Collapse / expand toggle button slot. */
  collapseButton?: React.ComponentType<{ collapsed: boolean; onClick?: () => void }>
  /** Empty column placeholder slot when items array is empty. */
  empty?: React.ComponentType<HTMLAttributes<HTMLDivElement>>
}

export type ColumnInfiniteScrollOptions = InfiniteScrollConfig


export interface DndBoardColumnProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'id'> {
  /** Unique column identifier. */
  id: Identifier
  /** Column title header string. */
  title: string
  /** Column index in board layout. */
  index?: number
  /** LexoRank string key for column reordering. */
  rank?: string
  /** Items within this column. */
  items?: any[]
  /** Maximum capacity limit for this column. */
  maxCapacity?: number
  /** Accepted item type tags. */
  accept?: string | string[]
  /** Custom drop acceptance rule. */
  rule?: DropRule | DropRulePredicate
  /** Whether column is collapsible. Default: true */
  collapsible?: boolean
  /** Controlled collapsed state. */
  collapsed?: boolean
  /** Initial uncontrolled collapsed state. Default: false */
  defaultCollapsed?: boolean
  /** Callback fired when collapsed state changes. */
  onCollapsedChange?: (collapsed: boolean) => void
  /** Vertical sliding-window infinite scroll configuration. */
  infiniteScroll?: ColumnInfiniteScrollOptions
  /** Custom item renderer for data-driven item lists. */
  renderItem?: (item: any, index: number) => ReactNode
  /** Whether column interactions are disabled. */
  disabled?: boolean
  /** Child items or custom column layout. */
  children?: ReactNode
  /** Typed slot components. */
  slots?: SlotComponents<DndBoardColumnSlots>
  /** Typed slot props map. */
  slotProps?: SlotPropsMap<DndBoardColumnSlots>
}

const DndBoardColumnPrimitive = forwardRef<HTMLDivElement, DndBoardColumnProps>(
  (
    {
      id,
      title,
      index,
      rank,
      items = [],
      maxCapacity,
      accept,
      rule,
      collapsible = true,
      collapsed,
      defaultCollapsed = false,
      onCollapsedChange,
      infiniteScroll,
      renderItem,
      disabled = false,
      className = '',
      children,
      slots,
      slotProps,
      ...props
    },
    ref
  ) => {
    const dndContext = useOptionalDndContext()
    const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(defaultCollapsed)
    const isCollapsed = collapsed !== undefined ? collapsed : uncontrolledCollapsed
    const columnBodyRef = useRef<HTMLDivElement | null>(null)
    const [columnBodyNode, setColumnBodyNode] = useState<HTMLDivElement | null>(null)

    // Non-ISS columns: lock dominant-vertical wheel onto the column so incidental
    // trackpad deltaX cannot pan the parent horizontal board.
    useEffect(() => {
      if (infiniteScroll || isCollapsed) return
      const el = columnBodyNode
      if (!el) return

      const onWheel = (e: WheelEvent) => {
        if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return
        e.preventDefault()
        e.stopPropagation()
        el.scrollTop += e.deltaY
      }

      el.addEventListener('wheel', onWheel, { passive: false })
      return () => el.removeEventListener('wheel', onWheel)
    }, [infiniteScroll, isCollapsed, columnBodyNode])

    const setColumnBodyRef = useCallback((node: HTMLDivElement | null) => {
      columnBodyRef.current = node
      setColumnBodyNode(node)
    }, [])

    const handleToggleCollapse = useCallback(() => {
      const next = !isCollapsed
      if (collapsed === undefined) {
        setUncontrolledCollapsed(next)
      }
      onCollapsedChange?.(next)
    }, [isCollapsed, collapsed, onCollapsedChange])

    const rawColumnData = useMemo(() => ({
      id,
      type: 'column',
      title,
      // Keep items on the column node only (one per column) for overlays / debug;
      // capacity membership lives in OccupancyIndex as a Set.
      items,
      rank,
      containerId: id,
      currentCount: items.length,
      maxCapacity,
      accept,
      rule,
      collapsible,
      collapsed: isCollapsed,
      disabled,
    }), [id, title, items, rank, maxCapacity, accept, rule, collapsible, isCollapsed, disabled])

    const columnData = useShallowMemo(rawColumnData)

    // Sync O(1) occupancy index: Map<columnId, Set<itemId>>. Fingerprint skip avoids
    // rebuilding the Set when membership is unchanged.
    const occupancyItemIds = useMemo(
      () => (Array.isArray(items) ? items.map((item, idx) => String(item?.id ?? idx)) : []),
      [items]
    )
    React.useLayoutEffect(() => {
      const occupancy = dndContext?.occupancy
      if (!occupancy) return
      occupancy.sync(id, occupancyItemIds, {
        maxCapacity,
        accept,
        rule,
        disabled,
      })
      return () => {
        occupancy.remove(id)
      }
    }, [dndContext?.occupancy, id, occupancyItemIds, maxCapacity, accept, rule, disabled])

    const sortable = useSortable({
      id,
      type: 'column',
      data: columnData,
      containerId: id,
      index,
      orientation: 'horizontal',
      disabled,
      accept,
      rule,
    })

    const setRef = (node: HTMLDivElement | null) => {
      sortable.ref(node)
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as any).current = node
    }

    const itemIds = useMemo(() => {
      if (Array.isArray(items) && items.length > 0) {
        return items.map((i, idx) => String(i?.id ?? idx))
      }
      if (children != null) {
        return React.Children.toArray(children)
          .map((child: any) => (child?.props?.id != null ? String(child.props.id) : null))
          .filter(Boolean) as string[]
      }
      return []
    }, [items, children])

    const overTarget = dndContext?.overTarget
    const overId = overTarget?.id != null ? String(overTarget.id) : null
    const overTargetData = overTarget?.data as any
    const overContainerId =
      overTarget?.containerId != null
        ? String(overTarget.containerId)
        : overTargetData?.containerId != null
          ? String(overTargetData.containerId)
          : overTargetData?.columnId != null
            ? String(overTargetData.columnId)
            : null
    const colIdStr = String(id)

    const isCurrentDropTarget =
      overId === colIdStr ||
      overContainerId === colIdStr ||
      (overId != null && itemIds.includes(overId))
    const activeItem = dndContext?.activeItem

    const isHoverActive = isCurrentDropTarget && activeItem?.type !== 'column'
    let isAccepted = true
    if (isHoverActive && activeItem) {
      const targetObj = {
        id,
        type: 'column',
        accept,
        rule,
        maxCapacity,
        data: { id, title, items, maxCapacity, rank },
      }
      const validation = evaluateAcceptanceRule(activeItem, targetObj, {
        currentContainerCount: items.length,
      })
      isAccepted = validation.isAccepted
    }

    const dropHighlightClass = isHoverActive
      ? isAccepted
        ? 'ring-primary/50 bg-primary-subtle/10 border-primary/45 shadow-sm'
        : 'ring-danger/50 bg-danger-subtle/10 border-danger/45 shadow-sm'
      : 'ring-transparent'

    // Transition ring/border/bg only — never `transition-all` (fights sortable transform).
    const columnMotion =
      'ring-2 ring-inset transition-[color,background-color,border-color,box-shadow] duration-300 ease-out'

    const columnBaseClasses = isCollapsed
      ? `flex flex-col w-12 sm:w-14 min-w-12 max-w-14 min-h-96 max-h-120 p-2 rounded-macro border border-border bg-bg-surface/95 shadow-subtle ${columnMotion} shrink-0 select-none`
      : `flex flex-col w-72 max-w-full min-h-96 max-h-120 p-space-sm rounded-macro border border-border bg-bg-surface/90 shadow-subtle ${columnMotion} shrink-0 select-none`

    const renderColumnCardList = () => {
      if (children != null) {
        return (
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            {children}
          </SortableContext>
        )
      }

      if (infiniteScroll) {
        return (
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            <InfiniteScrollSection
              infiniteScroll={infiniteScroll as any}
              items={items}
              className="flex-1 min-h-0 h-full w-full"
              contentClassName="flex flex-col gap-space-xs p-0.5"
              maxHeight={infiniteScroll.maxHeight ?? '100%'}
              windowSize={infiniteScroll.maxLoadedItems ?? infiniteScroll.windowSize ?? 30}
              initialLoadCount={infiniteScroll.initialLoadCount ?? 20}
              appendCount={infiniteScroll.appendCount ?? 15}
              threshold={infiniteScroll.threshold ?? 80}
              enableTopLoad={infiniteScroll.enableTopLoad ?? infiniteScroll.enableStartLoad}
              autoFill={infiniteScroll.autoFill}
              onLoadMore={infiniteScroll.onLoadMore as any}
              fetchNextPage={infiniteScroll.fetchNextPage}
              fetchPreviousPage={infiniteScroll.fetchPreviousPage}
              hasMoreBottom={infiniteScroll.hasMoreBottom}
              hasNextPage={infiniteScroll.hasNextPage}
              hasMoreTop={infiniteScroll.hasMoreTop}
              hasPreviousPage={infiniteScroll.hasPreviousPage}
              loadingBottom={infiniteScroll.loadingBottom}
              isFetchingNextPage={infiniteScroll.isFetchingNextPage}
              loadingTop={infiniteScroll.loadingTop}
              isFetchingPreviousPage={infiniteScroll.isFetchingPreviousPage}
              loadingBottomComponent={infiniteScroll.loadingBottomComponent}
              loadingTopComponent={infiniteScroll.loadingTopComponent}
              endReachedComponent={infiniteScroll.endReachedComponent}
              emptyState={infiniteScroll.emptyState}
              renderItem={(item, idx) => (
                <DndBoardItem
                  key={String(item?.id ?? idx)}
                  id={item?.id ?? idx}
                  columnId={id}
                  index={idx}
                  data={item}
                  rank={item?.rank}
                >
                  {renderItem ? renderItem(item, idx) : (item?.title ?? String(item?.id ?? idx))}
                </DndBoardItem>
              )}
            />
          </SortableContext>
        )
      }

      if (items.length === 0) {
        return (
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            {isHoverActive && activeItem?.type !== 'column' ? (
              <div className="flex items-center justify-center p-space-md rounded-base border-2 border-dashed border-primary/40 bg-primary-subtle/20 text-xs font-medium text-primary min-h-16 select-none transition-[color,background-color,border-color,opacity] duration-300 ease-out opacity-90">
                Drop here
              </div>
            ) : (
              <div className="flex-1 min-h-16 flex flex-col justify-center">
                {slots?.empty
                  ? renderSlot(slots.empty, slotProps?.empty)
                  : (
                    <div className="flex flex-col items-center justify-center py-6 px-2 text-center text-xs text-fg-muted/60 border border-dashed border-border-subtle/60 rounded-base select-none">
                      <span>No items</span>
                    </div>
                  )}
              </div>
            )}
          </SortableContext>
        )
      }

      return (
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {items.map((item, idx) => (
            <DndBoardItem
              key={String(item?.id ?? idx)}
              id={item?.id ?? idx}
              columnId={id}
              index={idx}
              data={item}
              rank={item?.rank}
            >
              {renderItem ? renderItem(item, idx) : (item?.title ?? String(item?.id ?? idx))}
            </DndBoardItem>
          ))}
        </SortableContext>
      )
    }

    const columnContextValue = useMemo<DndBoardColumnContextValue>(
      () => ({
        columnId: id,
        title,
        items,
        maxCapacity,
        accept,
        rule,
        collapsible,
        collapsed: isCollapsed,
        onToggleCollapse: handleToggleCollapse,
        disabled,
        rank,
        infiniteScroll,
      }),
      [
        id,
        title,
        items,
        maxCapacity,
        accept,
        rule,
        collapsible,
        isCollapsed,
        handleToggleCollapse,
        disabled,
        rank,
        infiniteScroll,
      ]
    )

    return (
      <div
        ref={setRef}
        className={cn(columnBaseClasses, dropHighlightClass, className)}
        style={{
          ...sortable.style,
          touchAction: 'none',
        }}
        {...sortable.attributes}
        {...props}
      >
        <DndBoardColumnContext.Provider value={columnContextValue}>
          {slots?.header
            ? renderSlot(slots.header, {
              title,
              count: items.length,
              maxCapacity,
              collapsible,
              collapsed: isCollapsed,
              onToggleCollapse: handleToggleCollapse,
              slots: {
                handle: slots?.handle,
                options: slots?.options,
                collapseButton: slots?.collapseButton,
              },
              slotProps: {
                handle: slotProps?.handle,
                options: slotProps?.options,
                collapseButton: slotProps?.collapseButton,
              },
              ...slotProps?.header,
            })
            : (
              <DndBoardHeaderPrimitive
                title={title}
                count={items.length}
                maxCapacity={maxCapacity}
                collapsible={collapsible}
                collapsed={isCollapsed}
                onToggleCollapse={handleToggleCollapse}
                slots={{
                  handle: slots?.handle,
                  options: slots?.options,
                  collapseButton: slots?.collapseButton,
                }}
                slotProps={{
                  handle: slotProps?.handle,
                  options: slotProps?.options,
                  collapseButton: slotProps?.collapseButton,
                }}
                {...sortable.listeners}
              />
            )}

          <div
            ref={setColumnBodyRef}
            className={
              isCollapsed
                ? 'hidden'
                : cn(
                  'flex flex-col flex-1 min-h-0',
                  infiniteScroll
                    ? 'overflow-hidden'
                    : 'gap-space-xs overflow-y-auto overflow-x-hidden overscroll-contain min-h-20 p-0.5'
                )
            }
            style={
              !infiniteScroll && !isCollapsed
                ? { overscrollBehavior: 'contain' }
                : undefined
            }
          >
            {renderColumnCardList()}
          </div>
        </DndBoardColumnContext.Provider>
      </div>
    )
  }
)

DndBoardColumnPrimitive.displayName = 'DndBoardColumnPrimitive'

export const DndBoardColumn = createInterfaceComponent<DndBoardColumnProps, DndBoardColumnSlots>(
  {
    name: 'DndBoardColumn',
    category: 'utility',
    description: 'Sortable column container within a Kanban DndBoard supporting collapsible layout, column LexoRank, and card sliding-window infinite scroll.',
    version: '1.0.0',
    props: {
      title: '',
      items: [],
      collapsible: true,
      disabled: false,
    },
    slots: {
      header: undefined,
      handle: undefined,
      options: undefined,
      collapseButton: undefined,
      empty: undefined,
    },
  },
  DndBoardColumnPrimitive
)

// ============================================================================
// 4. DndBoard (Root Family)
// ============================================================================

export interface DndBoardColumnData<TItem = any> {
  id: Identifier
  title: string
  items?: TItem[]
  rank?: string
  maxCapacity?: number
  accept?: string | string[]
  rule?: DropRule | DropRulePredicate
  collapsible?: boolean
  collapsed?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  disabled?: boolean
  slots?: SlotComponents<DndBoardColumnSlots>
  slotProps?: SlotPropsMap<DndBoardColumnSlots>
  [key: string]: any
}

export interface DndBoardSlots {
  /** Individual column container slot. */
  column?: React.ComponentType<DndBoardColumnProps>
  /** Drag overlay floating ghost portal slot. */
  overlay?: React.ComponentType<DragOverlayProps>
}

export interface DndBoardProps<TItem = any, TColumn extends DndBoardColumnData<TItem> = DndBoardColumnData<TItem>>
  extends HTMLAttributes<HTMLDivElement> {
  /** Flat item collection for dynamic function-based partitioning. */
  items?: TItem[]
  /** Column data models. */
  columns?: TColumn[]
  /** Controlled columns state mutator. */
  onColumnsChange?: (columns: TColumn[]) => void
  /** Controlled items state mutator for flat datasets. */
  onItemsChange?: (items: TItem[]) => void
  /** Function-based grouping resolver: maps an item to its column identifier. */
  groupBy?: (item: TItem) => Identifier
  /** Custom per-column item accessor (alternative to groupBy). */
  getItemsForColumn?: (column: TColumn) => TItem[]
  /** Reducer function called on item drop to produce the updated item model. */
  assignColumn?: (item: TItem, targetColumnId: Identifier, newRank: string) => TItem
  /** Horizontal infinite scroll configuration for column streams (e.g. multi-year timeline). */
  columnsInfiniteScroll?: InfiniteScrollConfig & {
    onLoadMore?: (direction: 'start' | 'end' | 'left' | 'right', count: number) => Promise<void> | void
    hasMoreEnd?: boolean
    hasMoreStart?: boolean
    loadingEnd?: boolean
    loadingStart?: boolean
    loadingEndComponent?: ReactNode
    loadingStartComponent?: ReactNode
  }
  /** Vertical infinite scroll configuration applied across columns. */
  columnInfiniteScroll?: ColumnInfiniteScrollOptions & {
    onLoadMore?: (columnId: Identifier, direction: 'top' | 'bottom', count: number) => Promise<void> | void
  }
  /** Specific card movement callback with LexoRank and moved item data. */
  onMoveItem?: (event: DragReorderEvent & { item?: TItem; rank?: string }) => void
  /** Specific column movement callback with column LexoRank. */
  onMoveColumn?: (event: DragReorderEvent & { column?: TColumn; rank?: string }) => void
  /** Render function for card item. */
  renderItem?: (item: TItem, column: TColumn, index: number) => ReactNode
  /** Render function for column header. */
  renderHeader?: (column: TColumn) => ReactNode
  /** Custom UI or render function for the floating drag overlay portal. */
  renderOverlay?: ReactNode | ((activeItem: any) => ReactNode)
  /** Auto-scrolling behavior for scrollable ancestors (column vertical lists and board horizontal scroll). */
  autoScroll?: boolean | any
  /** Children content for compound JSX usage. */
  children?: ReactNode
  /** Typed slot components. */
  slots?: SlotComponents<DndBoardSlots>
  /** Typed slot props map. */
  slotProps?: SlotPropsMap<DndBoardSlots>
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

const DndBoardPrimitive = forwardRef<HTMLDivElement, DndBoardProps>(
  (
    {
      items: propItems,
      columns: propColumns = [],
      onColumnsChange,
      onItemsChange,
      groupBy,
      getItemsForColumn,
      assignColumn,
      columnsInfiniteScroll,
      columnInfiniteScroll,
      onMoveItem,
      onMoveColumn,
      renderItem,
      renderHeader,
      className = '',
      children,
      renderOverlay,
      autoScroll,
      slots,
      slotProps,
      ...props
    },
    ref
  ) => {
    const dndContext = useOptionalDndContext()

    // Resolve column items dynamically using groupBy or getItemsForColumn if flat items array provided
    const resolvedColumns: DndBoardColumnData[] = useMemo(() => {
      if (!Array.isArray(propColumns)) return []

      const itemsArray = Array.isArray(propItems) ? propItems : []
      const effectiveGroupBy = groupBy ?? ((item: any) => item?.columnId ?? item?.status ?? item?.containerId)

      const sortedCols =
        propColumns.length > 0 && propColumns.every((col) => col?.rank != null && col.rank !== '')
          ? [...propColumns].sort((a, b) => String(a.rank).localeCompare(String(b.rank)))
          : propColumns

      return sortedCols.map((col) => {
        let colItems: any[] = []
        if (getItemsForColumn) {
          colItems = getItemsForColumn(col as any)
        } else if (itemsArray.length > 0) {
          const colIdStr = String(col.id)
          colItems = itemsArray.filter((item) => String(effectiveGroupBy(item)) === colIdStr)
        } else if (Array.isArray(col.items)) {
          colItems = col.items
        }

        const allHaveRanks =
          colItems.length > 0 && colItems.every((item) => item?.rank != null && item.rank !== '')
        if (allHaveRanks) {
          colItems = [...colItems].sort((a, b) => String(a.rank).localeCompare(String(b.rank)))
        }

        return {
          ...col,
          items: colItems,
        }
      })
    }, [propColumns, propItems, groupBy, getItemsForColumn])

    const columnIds = useMemo(() => {
      if (resolvedColumns.length > 0) {
        return resolvedColumns.map((col, idx) => String(col.id ?? idx))
      }
      if (children != null) {
        return React.Children.toArray(children)
          .map((child: any) => (child?.props?.id != null ? String(child.props.id) : null))
          .filter(Boolean) as string[]
      }
      return []
    }, [resolvedColumns, children])

    const handleStandaloneDragOver = (event: DragOverEvent) => {
      if (!event.over) return
      if (event.validation?.isRejected) return
      const activeId = event.active?.id
      const overId = event.over?.id
      if (!activeId || !overId || String(activeId) === String(overId)) return

      const activeIsColumn =
        event.active?.type === 'column' ||
        (event.active?.data as any)?.type === 'column' ||
        resolvedColumns.some((col) => String(col.id) === String(activeId))

      if (activeIsColumn) {
        // Columns visual shift is powered smoothly by @dnd-kit SortableContext transforms during drag
        // and committed atomically with LexoRank on dragEnd to prevent layout thrashing and jitter.
        return
      }

      if (propItems && onItemsChange) {
        const moveResult = resolveMultiContainerMove(resolvedColumns as any[], { ...event, isDropped: false } as any)
        if (moveResult.hasChanged && moveResult.sourceContainerId !== moveResult.targetContainerId) {
          const targetCol = resolvedColumns.find((c) => String(c.id) === String(moveResult.targetContainerId))
          if (targetCol?.maxCapacity != null) {
            const occupied = (targetCol.items ?? []).filter((item) => getItemId(item) !== String(moveResult.activeId))
              .length
            if (occupied >= targetCol.maxCapacity) return
          }

          const activeStr = String(moveResult.activeId)
          const targetColId = moveResult.targetContainerId
          const overStr = String(overId)
          const newRank = moveResult.rank ?? generateLexoRankBetween(moveResult.beforeRank, moveResult.afterRank)

          const activeItemObj = propItems.find((item) => getItemId(item) === activeStr)
          if (!activeItemObj) return

          const updatedMovedItem = assignColumn
            ? assignColumn(activeItemObj, targetColId, newRank)
            : {
              ...activeItemObj,
              columnId: targetColId,
              status: targetColId,
              containerId: targetColId,
              rank: newRank,
            }

          const withoutActive = propItems.filter((item) => getItemId(item) !== activeStr)
          let insertIndex = -1
          if (overStr !== String(targetColId)) {
            insertIndex = withoutActive.findIndex((item) => getItemId(item) === overStr)
          }

          let nextItems: any[]
          if (insertIndex !== -1) {
            nextItems = [...withoutActive]
            nextItems.splice(insertIndex, 0, updatedMovedItem)
          } else {
            const effectiveGroupBy = groupBy ?? ((item: any) => item?.columnId ?? item?.status ?? item?.containerId)
            const lastColItemIdx = withoutActive
              .map((item, idx) => ({ item, idx }))
              .filter(({ item }) => String(effectiveGroupBy(item)) === String(targetColId))
              .pop()?.idx

            if (lastColItemIdx !== undefined) {
              nextItems = [...withoutActive]
              nextItems.splice(lastColItemIdx + 1, 0, updatedMovedItem)
            } else {
              nextItems = [...withoutActive, updatedMovedItem]
            }
          }

          onItemsChange(nextItems)
        }
      } else if (onColumnsChange) {
        const updated = handleMultiContainerDrag(resolvedColumns as any[], event, 'over')
        if (updated !== resolvedColumns) {
          onColumnsChange?.(updated as any)
        }
      }
    }

    const handleStandaloneDragEnd = (event: DragEndEvent) => {
      if (!event.over) return
      if (event.validation?.isRejected) return

      const activeId = event.active?.id
      const overId = event.over?.id
      if (!activeId || !overId || String(activeId) === String(overId)) return

      // Handle Column Reorder Drop
      const activeIsColumn =
        event.active?.type === 'column' ||
        (event.active?.data as any)?.type === 'column' ||
        resolvedColumns.some((col) => String(col.id) === String(activeId))

      if (activeIsColumn) {
        const activeStr = String(activeId)
        const overStr = String(overId)
        const activeColIndex = resolvedColumns.findIndex((c) => String(c.id) === activeStr)
        let overColIndex = resolvedColumns.findIndex((c) => String(c.id) === overStr)
        if (overColIndex === -1) {
          const col = findContainerForItem(resolvedColumns as any[], overId)
          if (col) {
            overColIndex = resolvedColumns.findIndex((c) => String(c.id) === String(col.id))
          }
        }

        if (activeColIndex !== -1 && overColIndex !== -1 && activeColIndex !== overColIndex) {
          const reordered = arrayMove([...resolvedColumns], activeColIndex, overColIndex)
          const beforeCol = overColIndex > 0 ? reordered[overColIndex - 1] : undefined
          const afterCol = overColIndex < reordered.length - 1 ? reordered[overColIndex + 1] : undefined
          const newRank = generateLexoRankBetween(beforeCol?.rank, afterCol?.rank)

          reordered[overColIndex] = {
            ...reordered[overColIndex],
            rank: newRank,
          } as DndBoardColumnData

          onColumnsChange?.(reordered as any)

          if (onMoveColumn && event.active && event.over) {
            onMoveColumn({
              activeId,
              sourceContainerId: activeId,
              targetContainerId: overId,
              sourceIndex: activeColIndex,
              targetIndex: overColIndex,
              rank: newRank,
              beforeRank: beforeCol?.rank,
              afterRank: afterCol?.rank,
              column: reordered[overColIndex] as any,
            } as any)
          }
        }
        return
      }

      // Handle Card Item Drop
      const moveResult = resolveMultiContainerMove(resolvedColumns as any[], event)
      if (moveResult.hasChanged) {
        if (moveResult.sourceContainerId !== moveResult.targetContainerId) {
          const targetCol = resolvedColumns.find((c) => String(c.id) === String(moveResult.targetContainerId))
          if (targetCol?.maxCapacity != null) {
            const occupied = (targetCol.items ?? []).filter((item) => getItemId(item) !== String(moveResult.activeId))
              .length
            if (occupied >= targetCol.maxCapacity) return
          }
        }

        if (onColumnsChange && !propItems) {
          onColumnsChange?.(moveResult.containers as any)
        }

        if (propItems && onItemsChange) {
          const activeStr = String(moveResult.activeId)
          const targetColId = moveResult.targetContainerId
          const overStr = String(overId)
          const newRank = moveResult.rank ?? generateLexoRankBetween(moveResult.beforeRank, moveResult.afterRank)

          const activeItemObj = propItems.find((item) => getItemId(item) === activeStr)
          if (activeItemObj) {
            const updatedMovedItem = assignColumn
              ? assignColumn(activeItemObj, targetColId, newRank)
              : {
                ...activeItemObj,
                columnId: targetColId,
                status: targetColId,
                containerId: targetColId,
                rank: newRank,
              }

            const withoutActive = propItems.filter((item) => getItemId(item) !== activeStr)
            let insertIndex = -1
            if (overStr !== String(targetColId)) {
              insertIndex = withoutActive.findIndex((item) => getItemId(item) === overStr)
            }

            let nextItems: any[]
            if (insertIndex !== -1) {
              nextItems = [...withoutActive]
              nextItems.splice(insertIndex, 0, updatedMovedItem)
            } else {
              const effectiveGroupBy = groupBy ?? ((item: any) => item?.columnId ?? item?.status ?? item?.containerId)
              const lastColItemIdx = withoutActive
                .map((item, idx) => ({ item, idx }))
                .filter(({ item }) => String(effectiveGroupBy(item)) === String(targetColId))
                .pop()?.idx

              if (lastColItemIdx !== undefined) {
                nextItems = [...withoutActive]
                nextItems.splice(lastColItemIdx + 1, 0, updatedMovedItem)
              } else {
                nextItems = [...withoutActive, updatedMovedItem]
              }
            }

            onItemsChange(nextItems)
          }
        }
      }

      if (onMoveItem && event.active && event.over) {
        const targetCol = moveResult.containers.find(
          (c) => String(c.id) === String(moveResult.targetContainerId)
        )
        onMoveItem({
          activeId: moveResult.activeId,
          sourceContainerId: moveResult.sourceContainerId,
          targetContainerId: moveResult.targetContainerId,
          sourceIndex: moveResult.sourceIndex,
          targetIndex: moveResult.targetIndex,
          rank: moveResult.rank,
          beforeRank: moveResult.beforeRank,
          afterRank: moveResult.afterRank,
          beforeItem: moveResult.beforeItem,
          afterItem: moveResult.afterItem,
          item: moveResult.movedItem,
          items: targetCol?.items,
        } as any)
      }
    }

    const defaultOverlayRenderer = (activeItem: any) => {
      const data = activeItem?.data ?? activeItem
      if (!data) return null

      // If dragging a column
      if (activeItem?.type === 'column' || data?.type === 'column') {
        const colTitle = data?.title ?? String(data?.id ?? activeItem?.id ?? 'Column')
        const colItems = Array.isArray(data?.items) ? data.items : []
        return (
          <div className="flex flex-col w-72 max-w-full p-space-sm rounded-macro border border-border-strong bg-bg-surface shadow-strong opacity-100 pointer-events-none ring-1 ring-primary/20">
            <div className="flex items-center justify-between pb-space-xs mb-space-xs border-b border-border/40">
              <h3 className="font-semibold text-sm text-fg truncate">{colTitle}</h3>
              <span className="px-space-xs py-0.5 text-xs font-medium rounded-full bg-bg-muted text-fg-muted">
                {colItems.length}
              </span>
            </div>
            <div className="flex flex-col gap-2 p-3 bg-bg-muted/40 rounded-base min-h-24 items-center justify-center text-xs text-fg-muted italic">
              Column moving ({colItems.length} tasks)
            </div>
          </div>
        )
      }

      // If dragging a card item
      if (renderItem) {
        return (
          <div className="relative flex flex-col gap-space-xs p-space-sm rounded-base bg-bg-surface opacity-100 border border-border-strong shadow-strong w-full min-w-0 box-border select-none cursor-grabbing">
            <div className="flex items-center justify-between gap-space-xs w-full min-w-0">
              <div className="flex-1 min-w-0 font-medium text-sm text-fg">
                {renderItem(data, { id: data?.columnId ?? 'col', title: '', items: [] } as any, data?.index ?? 0)}
              </div>
            </div>
          </div>
        )
      }
      const title = data?.title ?? String(data?.id ?? activeItem?.id ?? 'Item')
      return (
        <div className="relative flex flex-col gap-space-xs p-space-sm rounded-base bg-bg-surface opacity-100 border border-border-strong shadow-strong w-full min-w-0 box-border select-none cursor-grabbing">
          <span className="font-medium text-sm text-fg truncate">{title}</span>
          {data?.priority && (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-2xs font-semibold px-1.5 py-0.5 rounded capitalize bg-bg-subtle text-fg-muted border border-border-subtle">
                {data.priority}
              </span>
            </div>
          )}
        </div>
      )
    }

    useEffect(() => {
      if (!dndContext?.registerMonitor) return
      if (!onColumnsChange && !onItemsChange && !onMoveItem && !onMoveColumn) return
      return dndContext.registerMonitor({
        onDragOver: handleStandaloneDragOver,
        onDragEnd: handleStandaloneDragEnd,
      })
    }, [
      dndContext,
      onColumnsChange,
      onItemsChange,
      onMoveItem,
      onMoveColumn,
      handleStandaloneDragOver,
      handleStandaloneDragEnd,
    ])

    // Compound mode
    if (children != null) {
      const alreadyHasOverlay = hasOverlayChild(children)
      const content = (
        <div
          ref={ref}
          className={`flex flex-row gap-space-md items-start overflow-x-auto overflow-y-hidden p-space-sm ${className}`}
          {...props}
        >
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            {children}
          </SortableContext>
          {!alreadyHasOverlay &&
            renderSlot(
              slots?.overlay,
              {
                renderOverlay: renderOverlay ?? defaultOverlayRenderer,
                ...slotProps?.overlay,
              },
              { defaultComponent: DragOverlay }
            )}
        </div>
      )

      if (!dndContext && (onColumnsChange || onItemsChange || onMoveItem || onMoveColumn)) {
        return (
          <DndProvider autoScroll={autoScroll} onDragOver={handleStandaloneDragOver} onDragEnd={handleStandaloneDragEnd}>
            {content}
          </DndProvider>
        )
      }
      return content
    }

    // Horizontal Infinite Scroll for Columns
    if (columnsInfiniteScroll) {
      const horizontalContent = (
        <div ref={ref} className={cn('w-full min-w-0 p-space-sm', className)} {...props}>
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            <InfiniteScrollSection
              infiniteScroll={columnsInfiniteScroll as any}
              orientation="horizontal"
              items={resolvedColumns}
              maxWidth={columnsInfiniteScroll.maxWidth ?? '100%'}
              maxLoadedItems={columnsInfiniteScroll.maxLoadedItems ?? columnsInfiniteScroll.windowSize ?? 12}
              initialLoadCount={columnsInfiniteScroll.initialLoadCount ?? 8}
              appendCount={columnsInfiniteScroll.appendCount ?? 6}
              threshold={columnsInfiniteScroll.threshold ?? 120}
              enableStartLoad={columnsInfiniteScroll.enableStartLoad ?? columnsInfiniteScroll.enableTopLoad}
              autoFill={columnsInfiniteScroll.autoFill}
              onLoadMore={columnsInfiniteScroll.onLoadMore as any}
              hasMoreEnd={columnsInfiniteScroll.hasMoreEnd}
              hasMoreStart={columnsInfiniteScroll.hasMoreStart}
              loadingEnd={columnsInfiniteScroll.loadingEnd}
              loadingStart={columnsInfiniteScroll.loadingStart}
              loadingEndComponent={columnsInfiniteScroll.loadingEndComponent}
              loadingStartComponent={columnsInfiniteScroll.loadingStartComponent}
              endReachedComponent={columnsInfiniteScroll.endReachedComponent}
              renderItem={(col: any, colIdx) => (
                <DndBoardColumn
                  key={String(col.id ?? colIdx)}
                  id={col.id}
                  title={col.title}
                  index={colIdx}
                  rank={col.rank}
                  items={col.items ?? []}
                  maxCapacity={col.maxCapacity}
                  accept={col.accept}
                  rule={col.rule}
                  collapsible={col.collapsible}
                  collapsed={col.collapsed}
                  defaultCollapsed={col.defaultCollapsed}
                  onCollapsedChange={col.onCollapsedChange}
                  disabled={col.disabled}
                  infiniteScroll={
                    col.infiniteScroll ??
                    (columnInfiniteScroll
                      ? {
                        ...columnInfiniteScroll,
                        onLoadMore: columnInfiniteScroll.onLoadMore
                          ? (dir: any, count: number) => columnInfiniteScroll.onLoadMore!(col.id, dir, count)
                          : undefined,
                      }
                      : undefined)
                  }
                  renderItem={renderItem ? (item, idx) => renderItem(item, col, idx) : undefined}
                  slots={col.slots}
                  slotProps={col.slotProps}
                >
                  {renderHeader ? renderHeader(col) : undefined}
                </DndBoardColumn>
              )}
            />
          </SortableContext>
          {renderSlot(
            slots?.overlay,
            {
              renderOverlay: renderOverlay ?? defaultOverlayRenderer,
              ...slotProps?.overlay,
            },
            { defaultComponent: DragOverlay }
          )}
        </div>
      )

      if (!dndContext && (onColumnsChange || onItemsChange)) {
        return (
          <DndProvider autoScroll={autoScroll} onDragOver={handleStandaloneDragOver} onDragEnd={handleStandaloneDragEnd}>
            {horizontalContent}
          </DndProvider>
        )
      }
      return horizontalContent
    }

    // Default data-driven rendering (Rule C8)
    const dataDrivenContent = (
      <div
        ref={ref}
        className={`flex flex-row gap-space-md items-start overflow-x-auto overflow-y-hidden p-space-sm ${className}`}
        {...props}
      >
        <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
          {resolvedColumns.map((col, colIdx) => {
            const effectiveColInfiniteScroll =
              col.infiniteScroll ??
              (columnInfiniteScroll
                ? {
                  ...columnInfiniteScroll,
                  onLoadMore: columnInfiniteScroll.onLoadMore
                    ? (dir: 'top' | 'bottom', count: number) => columnInfiniteScroll.onLoadMore!(col.id, dir, count)
                    : undefined,
                }
                : undefined)

            const columnNode = (
              <DndBoardColumn
                key={String(col.id)}
                id={col.id}
                title={col.title}
                index={colIdx}
                rank={col.rank}
                items={col.items ?? []}
                maxCapacity={col.maxCapacity}
                accept={col.accept}
                rule={col.rule}
                collapsible={col.collapsible}
                collapsed={col.collapsed}
                defaultCollapsed={col.defaultCollapsed}
                onCollapsedChange={col.onCollapsedChange}
                disabled={col.disabled}
                infiniteScroll={effectiveColInfiniteScroll}
                renderItem={renderItem ? (item, idx) => renderItem(item, col as any, idx) : undefined}
                slots={{
                  header: renderHeader ? () => renderHeader(col as any) : col.slots?.header,
                  ...col.slots,
                }}
                slotProps={col.slotProps}
              />
            )
            return (
              <React.Fragment key={col.id}>
                {renderSlot(
                  slots?.column,
                  {
                    id: col.id,
                    title: col.title,
                    index: colIdx,
                    rank: col.rank,
                    items: col.items ?? [],
                    maxCapacity: col.maxCapacity,
                    accept: col.accept,
                    rule: col.rule,
                    collapsible: col.collapsible,
                    collapsed: col.collapsed,
                    defaultCollapsed: col.defaultCollapsed,
                    onCollapsedChange: col.onCollapsedChange,
                    disabled: col.disabled,
                    ...slotProps?.column,
                  },
                  { defaultComponent: undefined }
                ) ?? columnNode}
              </React.Fragment>
            )
          })}
        </SortableContext>
        {renderSlot(
          slots?.overlay,
          {
            renderOverlay: renderOverlay ?? defaultOverlayRenderer,
            ...slotProps?.overlay,
          },
          { defaultComponent: DragOverlay }
        )}
      </div>
    )

    if (!dndContext && (onColumnsChange || onItemsChange)) {
      return (
        <DndProvider autoScroll={autoScroll} onDragOver={handleStandaloneDragOver} onDragEnd={handleStandaloneDragEnd}>
          {dataDrivenContent}
        </DndProvider>
      )
    }

    return dataDrivenContent
  }
)

DndBoardPrimitive.displayName = 'DndBoardPrimitive'

export const DndBoard = createInterfaceComponent<DndBoardProps, DndBoardSlots>(
  {
    name: 'DndBoard',
    category: 'utility',
    description: 'Multi-column Kanban board container supporting function-based dynamic grouping, cross-column transfers, column/card LexoRank O(1) mutations, and dual-axis sliding-window infinite scrolling.',
    version: '1.1.0',
    props: {
      columns: [],
    },
    slots: {
      column: undefined,
      overlay: undefined,
    },
  },
  DndBoardPrimitive as any
)

// Compound Namespace Attachments (Rule C6)
DndBoard.Column = DndBoardColumn
DndBoard.Item = DndBoardItem
DndBoard.Header = DndBoardHeader
DndBoard.Handle = DraggableHandle
DndBoard.Overlay = DragOverlay
