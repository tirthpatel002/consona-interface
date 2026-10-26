/**
 * @file context.tsx
 * Clean, high-performance DndContext and <DndProvider /> powered by official @dnd-kit/core
 * with integrated procedural audio synthesis via useDragSound.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  DndContext as DndKitContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  closestCorners,
  rectIntersection,
  pointerWithin,
  TraversalOrder,
  AutoScrollActivator,
  getScrollableAncestors,
  type AutoScrollOptions,
  type DragStartEvent as DndKitDragStartEvent,
  type DragMoveEvent as DndKitDragMoveEvent,
  type DragOverEvent as DndKitDragOverEvent,
  type DragEndEvent as DndKitDragEndEvent,
  type DragCancelEvent as DndKitDragCancelEvent,
  type CollisionDetection,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import type {
  CollisionStrategy,
  Coordinates,
  DragCancelEvent,
  DragEndEvent,
  DragItem,
  DragMoveEvent,
  DragOverEvent,
  DragStartEvent,
  DropTarget,
  DropValidationResult,
  Identifier,
} from './engine/types'
import { evaluateAcceptanceRule } from './engine/rules'
import { OccupancyIndex } from './engine/occupancy-index'
import { useDragSound, type UseDragSoundOptions, type UseDragSoundReturn } from '../sound'
import { toast } from '../core/components/toast'
import { DragStateProvider, type DragStateContextValue } from '../core/drag-state-context'

export interface DndContextValue {
  /** Currently dragged item snapshot. */
  activeItem: DragItem | null
  /** Currently hovered drop target snapshot. */
  overTarget: DropTarget | null
  /** Real-time viewport drag coordinates. */
  dragCoordinates: Coordinates | null
  /** Initial coordinates where drag started. */
  initialCoordinates: Coordinates | null
  /** Original container ID of the active item. */
  initialContainerId: Identifier | null
  /** Original index of the active item. */
  initialIndex: number | null
  /** Whether a drag interaction is in progress. */
  isDragging: boolean
  /** Validation result of the current active item against over target. */
  validation: DropValidationResult | null
  /** Active collision detection strategy. */
  collisionStrategy: CollisionStrategy
  /** Semantic type tag of the active entity. */
  activeType: string | undefined
  /** Strongly typed domain data payload of the active entity. */
  activeData: any
  /** Checks whether an entity of a given type is currently dragging. */
  isTypeDragging: (type: string) => boolean
  /** Programmatically set over target. */
  setOver: (target: DropTarget | null) => void
  /** Start drag programmatically. */
  startDrag: (item: DragItem, coords?: Coordinates) => void
  /** End drag programmatically. */
  endDrag: (cancelled?: boolean) => void
  /** Cancel drag programmatically. */
  cancelDrag: () => void
  /** Update active item payload. */
  updateActiveItem: (updates: Partial<DragItem>) => void
  /** Registration functions for element-level event binding. */
  registerDraggable: (item: DragItem, element: HTMLElement) => () => void
  registerDroppable: (target: DropTarget, element: HTMLElement) => () => void
  /**
   * O(1) container occupancy index (Map → Set of member ids).
   * Columns sync; capacity validation reads — cards never store membership.
   */
  occupancy: OccupancyIndex
  /** Integrated drag audio synthesis controller and event triggers. */
  dragSound: UseDragSoundReturn
  /** Subscribe child composite containers (e.g. DndBoard, SortableList, SortableGrid) when nested inside a parent DndProvider. */
  registerMonitor?: (listener: DndMonitorListener) => () => void
}

export interface DndMonitorListener {
  onDragStart?: (event: DragStartEvent) => void
  onDragOver?: (event: DragOverEvent) => void
  onDragEnd?: (event: DragEndEvent) => void
  onDragCancel?: (event: DragCancelEvent) => void
}

const DndContext = createContext<DndContextValue | null>(null)

export interface DndProviderProps {
  /** Collision detection strategy. Default: 'closest-corners' */
  collisionStrategy?: CollisionStrategy
  /** Pointer activation distance in pixels before drag initiates. Default: 4 */
  activationDistance?: number
  /**
   * Auto-scrolling behavior for scrollable ancestors (e.g. column vertical lists and board horizontal viewports).
   * Default: TraversalOrder.ReversedTreeOrder with { x: 0.15, y: 0.2 } threshold.
   */
  autoScroll?: boolean | AutoScrollOptions
  /**
   * Sound synthesis feedback configuration for drag and drop interactions.
   * Enables soothing movement strides, pickup audio, drop confirmations, reorder whooshes, and cancel buzzes.
   * Set to `false` to disable sound effects in DnD.
   * Default: `true`
   */
  sound?: boolean | UseDragSoundOptions
  /** Callback fired when drag gesture initiates. */
  onDragStart?: (event: DragStartEvent) => void
  /** Callback fired continuously during pointer movement. */
  onDragMove?: (event: DragMoveEvent) => void
  /** Callback fired when entering or moving over a drop target. */
  onDragOver?: (event: DragOverEvent) => void
  /** Callback fired when an item is dropped onto a target. */
  onDragEnd?: (event: DragEndEvent) => void
  /** Callback fired when a drag gesture is cancelled. */
  onDragCancel?: (event: DragCancelEvent) => void
  /** Children elements. */
  children: ReactNode
}

export const defaultAutoScrollConfig: AutoScrollOptions = {
  order: TraversalOrder.ReversedTreeOrder,
  activator: AutoScrollActivator.Pointer,
  threshold: {
    x: 0.18,
    y: 0.18,
  },
  acceleration: 28,
  interval: 5,
  layoutShiftCompensation: false,
  canScroll: (element: Element) => {
    if (element instanceof HTMLElement) {
      const style = window.getComputedStyle(element)
      const overflowY = style.overflowY
      const overflowX = style.overflowX
      const canScrollY =
        overflowY !== 'hidden' &&
        (overflowY === 'auto' || overflowY === 'scroll') &&
        element.scrollHeight > element.clientHeight + 2
      const canScrollX =
        overflowX !== 'hidden' &&
        (overflowX === 'auto' || overflowX === 'scroll') &&
        element.scrollWidth > element.clientWidth + 2
      return canScrollY || canScrollX
    }
    return true
  },
}


/**
 * <DndProvider />
 * Root Drag-and-Drop provider powered directly by official @dnd-kit/core
 * with integrated procedural audio synthesis via useDragSound.
 */
/**
 * Extracts a normalized DropTarget from a DnD-Kit over object, enriching
 * container capacity/accept metadata from the occupancy index when the pointer
 * is over a child card (which does not carry that data).
 */
function extractDropTarget(
  over: { id: any; data?: { current?: any } },
  occupancy?: OccupancyIndex
): DropTarget {
  const current = over.data?.current || {}
  const items = Array.isArray(current.items)
    ? current.items
    : Array.isArray(current.data?.items)
      ? current.data.items
      : undefined

  const containerId = current.containerId ?? current.columnId
  const type = current.type ?? 'droppable'
  const occupancyKey = type === 'column' ? over.id : containerId
  const snap = occupancyKey != null ? occupancy?.get(String(occupancyKey)) : null

  return {
    id: over.id,
    type,
    containerId,
    accept: current.accept ?? snap?.accept,
    rule: (current.rule ?? snap?.rule) as DropTarget['rule'],
    maxCapacity: current.maxCapacity ?? snap?.maxCapacity,
    disabled: Boolean(current.disabled ?? snap?.disabled),
    items,
    data: {
      ...current,
      ...(typeof current.data === 'object' ? current.data : {}),
      items,
    },
  } as DropTarget
}

/**
 * Extracts current item count from a DnD-Kit over object.
 */
function extractContainerCount(
  over: { id?: any; data?: { current?: any } },
  occupancy?: OccupancyIndex
): number | undefined {
  const current = over.data?.current || {}
  if (typeof current.currentCount === 'number') return current.currentCount
  if (Array.isArray(current.items)) return current.items.length
  if (Array.isArray(current.data?.items)) return current.data.items.length

  const containerId = current.containerId ?? current.columnId ?? (current.type === 'column' ? over.id : null)
  if (containerId != null) {
    const entry = occupancy?.get(String(containerId))
    if (entry) return entry.members.size
  }
  return undefined
}

export const DndProvider: React.FC<DndProviderProps> = ({
  collisionStrategy = 'closest-corners',
  activationDistance = 4,
  autoScroll = defaultAutoScrollConfig,
  sound = true,
  onDragStart,
  onDragMove,
  onDragOver,
  onDragEnd,
  onDragCancel,
  children,
}) => {
  const [activeItem, setActiveItem] = useState<DragItem | null>(null)
  const [overTarget, setOverTarget] = useState<DropTarget | null>(null)

  // Track active container auto-scrolling during drag session.
  // isDragScrollingRef is set from pointer-in-threshold (same frame as collision),
  // not from a delayed window scroll listener.
  const isDragScrollingRef = useRef<boolean>(false)
  const frozenOverIdRef = useRef<Identifier | null>(null)
  const releaseScrollFrameRef = useRef<number | null>(null)
  const autoScrollThresholdRef = useRef({ x: 0.18, y: 0.18 })
  const canScrollRef = useRef<((element: Element) => boolean) | undefined>(undefined)
  const autoScrollEnabledRef = useRef(true)

  // Lean drag-state context: only updates on drag start/end, never on pointer moves.
  // This prevents all InfiniteScrollSection instances from re-rendering every pointermove.
  const [dragState, setDragState] = useState<DragStateContextValue>({
    activeDndId: null,
    activeDndType: null,
    isDragScrollingRef,
  })

  const soundOptions = typeof sound === 'object' ? sound : {}
  const dragSound = useDragSound({
    cue: 'navigate',
    variant: 'slide',
    pickCue: { cue: 'open', variant: 'slide' },
    dropCue: 'release',
    successCue: { cue: 'success', variant: 'harmonic' },
    errorCue: { cue: 'error', variant: 'buzz' },
    shuffleCue: { cue: 'navigate', variant: 'swipe' },
    ...soundOptions,
    disabled: sound === false,
  })

  const lastDeltaRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const lastTimeRef = useRef<number>(0)
  const accumulatedDeltaRef = useRef<number>(0)
  const lastOverIdRef = useRef<any>(null)
  const lastOverRejectedRef = useRef<boolean>(false)
  const initialContainerIdRef = useRef<Identifier | null>(null)
  /** Stable Map→Set occupancy index — columns sync, validation reads. */
  const occupancyRef = useRef(new OccupancyIndex())
  const activeItemRef = useRef<DragItem | null>(null)
  activeItemRef.current = activeItem
  const recentVectorRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 })
  const lastSpeedRef = useRef<number>(0)

  const releaseDragScroll = useCallback(() => {
    isDragScrollingRef.current = false
    frozenOverIdRef.current = null
    if (releaseScrollFrameRef.current != null) {
      cancelAnimationFrame(releaseScrollFrameRef.current)
      releaseScrollFrameRef.current = null
    }
  }, [])

  React.useEffect(() => {
    if (!activeItem) {
      releaseDragScroll()
    }
  }, [activeItem, releaseDragScroll])

  // Configure high-precision @dnd-kit sensors with distance constraint
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: activationDistance,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Smart multi-container collision detection:
  // - When dragging a column, isolate collision testing strictly to column containers using closestCenter.
  // - When dragging an item, detect direct pointer/rect collisions, resolving to child items first or
  //   finding the closest item in a hovered column container for instantaneous live-sort feedback.
  const collisionDetection: CollisionDetection = useCallback(
    (args) => {
      const activeData = args.active.data.current as any
      const activeType = activeData?.type ?? activeData?.data?.type

      // Column dragging: isolate collisions strictly to column containers
      if (activeType === 'column') {
        const columnContainers = args.droppableContainers.filter((container) => {
          const current = container.data.current as any
          return (
            current?.type === 'column' ||
            current?.data?.type === 'column' ||
            (current?.containerId === container.id && !current?.columnId)
          )
        })
        return closestCenter({
          ...args,
          droppableContainers: columnContainers.length > 0 ? columnContainers : args.droppableContainers,
        })
      }

      // Card / Item dragging:
      // 1. First test pointer containment
      const pointerCollisions = pointerWithin(args)
      const collisions = pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args)
      const overId = collisions.length > 0 ? collisions[0]?.id : null

      if (overId != null) {
        const overContainer = args.droppableContainers.find((d) => d.id === overId)
        const overData = overContainer?.data?.current as any
        const isColumn =
          overData?.type === 'column' ||
          overData?.data?.type === 'column' ||
          (overData?.containerId === overId && !overData?.columnId)

        // If hovering over a column container itself (e.g. gaps/padding/header),
        // find the closest item in that column so SortableContext immediately shifts items.
        if (isColumn) {
          const columnItems = args.droppableContainers.filter((container) => {
            const current = container.data.current as any
            const isCol =
              current?.type === 'column' ||
              current?.data?.type === 'column' ||
              (current?.containerId === container.id && !current?.columnId)
            if (isCol) return false
            const parentColId = current?.containerId ?? current?.columnId
            return parentColId != null && String(parentColId) === String(overId)
          })

          if (columnItems.length > 0) {
            const closestItem = closestCenter({
              ...args,
              droppableContainers: columnItems,
            })
            if (closestItem.length > 0) {
              return closestItem
            }
          }
        }

        // Prioritize direct card item collision over enclosing column droppable
        const itemCollision = collisions.find((c) => {
          const container = args.droppableContainers.find((d) => d.id === c.id)
          const current = container?.data?.current as any
          const isCol =
            current?.type === 'column' ||
            current?.data?.type === 'column' ||
            (current?.containerId === container?.id && !current?.columnId)
          return !isCol
        })

        if (itemCollision) {
          return [itemCollision]
        }
        return collisions
      }

      // Fallback to distance-based collision across all droppables
      if (collisionStrategy === 'closest-center') {
        return closestCenter(args)
      }
      return closestCorners(args)
    },
    [collisionStrategy]
  )

  const handleDndKitDragStart = useCallback(
    (event: DndKitDragStartEvent) => {
      const activeData = event.active.data.current as any
      const startContainerId = (activeData?.containerId ?? activeData?.columnId) || null
      initialContainerIdRef.current = startContainerId

      const item: DragItem = {
        id: event.active.id,
        type: activeData?.type ?? 'item',
        data: activeData?.data ?? activeData,
        containerId: startContainerId,
        index: activeData?.index,
      }
      setActiveItem(item)
      setOverTarget(null)
      // Update lean drag state so ISS instances know a drag started
      setDragState({ activeDndId: event.active.id, activeDndType: activeData?.type ?? activeData?.data?.type ?? null, isDragScrollingRef })

      lastDeltaRef.current = { x: 0, y: 0 }
      lastTimeRef.current = performance.now()
      accumulatedDeltaRef.current = 0
      lastOverIdRef.current = null
      lastOverRejectedRef.current = false
      recentVectorRef.current = { dx: 0, dy: 0 }

      // Acoustic pick feedback (open:gentle)
      dragSound.playPick()

      const startEvt: DragStartEvent = {
        active: item,
        coordinates: { x: 0, y: 0 },
      }
      onDragStart?.(startEvt)
      monitorsRef.current.forEach((m) => m.onDragStart?.(startEvt))
    },
    [onDragStart, dragSound]
  )

  const monitorsRef = useRef<Set<DndMonitorListener>>(new Set())
  const registerMonitor = useCallback((listener: DndMonitorListener) => {
    monitorsRef.current.add(listener)
    return () => {
      monitorsRef.current.delete(listener)
    }
  }, [])

  const handleDndKitDragMove = useCallback(
    (event: DndKitDragMoveEvent) => {
      const now = performance.now()
      const currentDelta = event.delta || { x: 0, y: 0 }
      const dx = currentDelta.x - lastDeltaRef.current.x
      const dy = currentDelta.y - lastDeltaRef.current.y
      const stepDist = Math.sqrt(dx * dx + dy * dy)
      const dt = Math.max(1, now - (lastTimeRef.current || now))
      const speed = stepDist / dt

      lastDeltaRef.current = { x: currentDelta.x, y: currentDelta.y }
      lastTimeRef.current = now
      lastSpeedRef.current = speed
      accumulatedDeltaRef.current += stepDist
      recentVectorRef.current = {
        dx: recentVectorRef.current.dx * 0.6 + dx * 0.4,
        dy: recentVectorRef.current.dy * 0.6 + dy * 0.4,
      }

      const strideDist = (soundOptions as UseDragSoundOptions)?.stepDistance ?? 36
      const minVel = (soundOptions as UseDragSoundOptions)?.minVelocity ?? 0.02

      if (accumulatedDeltaRef.current >= strideDist && speed >= minVel) {
        accumulatedDeltaRef.current %= strideDist
        // Active motion slide stride
        dragSound.playStride()
      }

      onDragMove?.({
        active: activeItem ?? { id: event.active.id, type: 'item' },
        coordinates: currentDelta,
        delta: currentDelta,
      })
    },
    [activeItem, onDragMove, dragSound, soundOptions]
  )

  const handleDndKitDragOver = useCallback(
    (event: DndKitDragOverEvent) => {
      if (!event.over) {
        setOverTarget(null)
        lastOverIdRef.current = null
        lastOverRejectedRef.current = false
        const emptyOverEvt: DragOverEvent = {
          active: activeItem ?? { id: event.active.id, type: 'item' },
          over: undefined,
        }
        onDragOver?.(emptyOverEvt)
        monitorsRef.current.forEach((m) => m.onDragOver?.(emptyOverEvt))
        return
      }

      const occupancy = occupancyRef.current
      const target = extractDropTarget(event.over, occupancy)
      const evaluatedActive: DragItem = activeItem
        ? { ...activeItem, containerId: activeItem.containerId ?? initialContainerIdRef.current ?? undefined }
        : { id: event.active.id, type: 'item', containerId: initialContainerIdRef.current ?? undefined }

      const targetContainerId = String(target.containerId ?? target.id)
      const snap = occupancy.snapshot(targetContainerId, evaluatedActive.id)
      const currentCount = snap?.otherCount ?? extractContainerCount(event.over, occupancy)

      const validation = evaluateAcceptanceRule(evaluatedActive, target, {
        currentContainerCount: currentCount,
        // snapshot.otherCount already excludes active when present in the Set
        activeAlreadyInContainer: false,
        occupancyOtherCount: snap?.otherCount,
      })

      const isRejected = validation.isRejected

      // Play soft shuffle swipe acoustic cue only when transitioning over a different valid drop target.
      // NO error sound is ever played during hover/drag over; error cues are reserved exclusively for drop release.
      const targetChanged = lastOverIdRef.current === null || String(lastOverIdRef.current) !== String(event.over.id)
      if (targetChanged && !isRejected) {
        dragSound.playShuffle()
      }

      lastOverIdRef.current = event.over.id
      lastOverRejectedRef.current = isRejected
      setOverTarget(target)

      const overEvt: DragOverEvent = {
        active: evaluatedActive,
        over: target,
        validation,
      }
      onDragOver?.(overEvt)
      monitorsRef.current.forEach((m) => m.onDragOver?.(overEvt))
    },
    [activeItem, onDragOver, dragSound]
  )

  const handleDndKitDragEnd = useCallback(
    (event: DndKitDragEndEvent) => {
      const currentActive = activeItem ?? { id: event.active.id, type: 'item' }
      const origContainerId = initialContainerIdRef.current
      setActiveItem(null)
      setOverTarget(null)
      lastOverIdRef.current = null
      lastOverRejectedRef.current = false
      initialContainerIdRef.current = null
      // Clear lean drag state so ISS instances know the drag ended
      setDragState({ activeDndId: null, activeDndType: null, isDragScrollingRef })

      if (!event.over) {
        // Cancelled / dropped outside -> error buzz
        dragSound.playError()

        const cancelEvt: DragCancelEvent = {
          active: currentActive,
          initialContainerId: origContainerId ?? currentActive.containerId,
          initialIndex: currentActive.index,
        }
        onDragCancel?.(cancelEvt)
        monitorsRef.current.forEach((m) => m.onDragCancel?.(cancelEvt))
        return
      }

      const occupancy = occupancyRef.current
      const target = extractDropTarget(event.over, occupancy)
      const evaluatedActive: DragItem = {
        ...currentActive,
        containerId: origContainerId ?? currentActive.containerId,
      }
      const targetContainerId = String(target.containerId ?? target.id)
      const snap = occupancy.snapshot(targetContainerId, evaluatedActive.id)
      const currentCount = snap?.otherCount ?? extractContainerCount(event.over, occupancy)

      const validation = evaluateAcceptanceRule(evaluatedActive, target, {
        currentContainerCount: currentCount,
        activeAlreadyInContainer: false,
        occupancyOtherCount: snap?.otherCount,
      })

      if (validation.isRejected) {
        // Rejected drop (max limit reached, type mismatch, predicate rejection) -> error buzz
        dragSound.playError()

        if (validation.rejectionReason) {
          toast.error(validation.rejectionReason)
        }
      } else {
        // Successful drop -> success harmonic chime
        dragSound.playSuccess()
      }

      const overData = event.over.data.current as any
      const endEvent: DragEndEvent = {
        active: evaluatedActive,
        over: target,
        validation,
        initialContainerId: origContainerId ?? currentActive.containerId,
        initialIndex: currentActive.index,
        targetContainerId: target.containerId ?? target.id,
        targetIndex: typeof (overData?.index) === 'number' ? overData.index : undefined,
        isDropped: !validation.isRejected,
      }

      onDragEnd?.(endEvent)
      monitorsRef.current.forEach((m) => m.onDragEnd?.(endEvent))
    },
    [activeItem, onDragEnd, onDragCancel, dragSound]
  )

  const handleDndKitDragCancel = useCallback(
    (_event: DndKitDragCancelEvent) => {
      const currentActive = activeItem ?? { id: 'cancelled', type: 'item' }
      const origContainerId = initialContainerIdRef.current
      setActiveItem(null)
      setOverTarget(null)
      lastOverIdRef.current = null
      initialContainerIdRef.current = null
      // Clear lean drag state so ISS instances know the drag was cancelled
      setDragState({ activeDndId: null, activeDndType: null, isDragScrollingRef })

      // Cancelled -> error buzz
      dragSound.playError()

      const cancelEvt: DragCancelEvent = {
        active: currentActive,
        initialContainerId: origContainerId ?? currentActive.containerId,
        initialIndex: currentActive.index,
      }
      onDragCancel?.(cancelEvt)
      monitorsRef.current.forEach((m) => m.onDragCancel?.(cancelEvt))
    },
    [activeItem, onDragCancel, dragSound]
  )

  const validation = useMemo(() => {
    if (!activeItem || !overTarget) return null
    const evaluatedActive: DragItem = {
      ...activeItem,
      containerId: activeItem.containerId ?? initialContainerIdRef.current ?? undefined,
    }
    const targetContainerId = String(overTarget.containerId ?? overTarget.id)
    const snap = occupancyRef.current.snapshot(targetContainerId, evaluatedActive.id)
    const currentCount =
      snap?.otherCount ??
      (Array.isArray(overTarget.items) ? overTarget.items.length : undefined)
    return evaluateAcceptanceRule(evaluatedActive, overTarget, {
      currentContainerCount: currentCount,
      activeAlreadyInContainer: false,
      occupancyOtherCount: snap?.otherCount,
    })
  }, [activeItem, overTarget])

  const contextValue: DndContextValue = useMemo(() => {
    return {
      activeItem,
      overTarget,
      dragCoordinates: null,
      initialCoordinates: null,
      initialContainerId: activeItem?.containerId ?? null,
      initialIndex: activeItem?.index ?? null,
      isDragging: activeItem !== null,
      validation,
      collisionStrategy,
      activeType: activeItem?.type,
      activeData: activeItem?.data,
      isTypeDragging: (type: string) => activeItem?.type === type,
      setOver: (t) => setOverTarget(t),
      startDrag: (item) => {
        dragSound.playPick()
        setActiveItem(item)
      },
      endDrag: (cancelled) => {
        if (cancelled) dragSound.playError()
        else dragSound.playSuccess()
        setActiveItem(null)
        setOverTarget(null)
      },
      cancelDrag: () => {
        dragSound.playError()
        setActiveItem(null)
        setOverTarget(null)
      },
      updateActiveItem: (updates) => {
        setActiveItem((prev) => (prev ? { ...prev, ...updates } : null))
      },
      registerDraggable: () => () => { },
      registerDroppable: () => () => { },
      occupancy: occupancyRef.current,
      dragSound,
      registerMonitor,
    }
  }, [activeItem, overTarget, validation, collisionStrategy, dragSound, registerMonitor])

  const resolvedAutoScroll = useMemo(() => {
    if (autoScroll === false) {
      autoScrollEnabledRef.current = false
      return false
    }
    autoScrollEnabledRef.current = true
    const base = typeof autoScroll === 'object' ? autoScroll : defaultAutoScrollConfig
    const resolved = {
      ...defaultAutoScrollConfig,
      ...base,
      activator: base.activator ?? AutoScrollActivator.Pointer,
      canScroll: (element: Element) => {
        if (base.canScroll && base.canScroll(element) === false) {
          return false
        }
        if (element instanceof HTMLElement) {
          const style = window.getComputedStyle(element)
          const overflowY = style.overflowY
          const overflowX = style.overflowX
          const hasOverflowY = overflowY !== 'hidden' && (overflowY === 'auto' || overflowY === 'scroll')
          const hasOverflowX = overflowX !== 'hidden' && (overflowX === 'auto' || overflowX === 'scroll')
          const isScrollableY = hasOverflowY && element.scrollHeight > element.clientHeight + 2
          const isScrollableX = hasOverflowX && element.scrollWidth > element.clientWidth + 2

          // If this is a vertical-only scroll container (e.g. column card list):
          if (isScrollableY && !isScrollableX) {
            const currentItem = activeItemRef.current
            // When dragging a column (column reorder), NEVER auto-scroll vertical column card lists!
            if (currentItem && currentItem.type === 'column') {
              return false
            }
          }

          return isScrollableY || isScrollableX
        }
        return true
      },
    }

    autoScrollThresholdRef.current = {
      x: typeof resolved.threshold?.x === 'number' ? resolved.threshold.x : 0.18,
      y: typeof resolved.threshold?.y === 'number' ? resolved.threshold.y : 0.18,
    }
    canScrollRef.current = resolved.canScroll

    return resolved
  }, [autoScroll])

  return (
    <DragStateProvider value={dragState}>
      <DndContext.Provider value={contextValue}>
        <DndKitContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          autoScroll={resolvedAutoScroll}
          onDragStart={handleDndKitDragStart}
          onDragMove={handleDndKitDragMove}
          onDragOver={handleDndKitDragOver}
          onDragEnd={handleDndKitDragEnd}
          onDragCancel={handleDndKitDragCancel}
        >
          {children}
        </DndKitContext>
      </DndContext.Provider>
    </DragStateProvider>
  )
}

/**
 * Access the active DnD context and state.
 */
export function useDndContext(): DndContextValue {
  const context = useContext(DndContext)
  if (!context) {
    throw new Error('useDndContext must be used within a <DndProvider>')
  }
  return context
}

/**
 * Optional context reader that returns null if rendered outside a provider.
 */
export function useOptionalDndContext(): DndContextValue | null {
  return useContext(DndContext)
}
