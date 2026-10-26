/**
 * @file dnd-engine.ts
 * High-Performance Pure TypeScript Drag-and-Drop state machine and coordinator (Rule ENG1).
 * Features:
 * 1. WeakRef DOM Node Registry: Eliminates memory leaks from unmounted/virtualized items.
 * 2. One-Time Spatial Snapshotting: Takes layout snapshots on drag-start only, eliminating 60fps layout thrashing.
 * 3. Native Hit-Testing Fast-Path (elementFromPoint): Instant ~0.02ms O(1) drop target resolution.
 * 4. High-frequency state mutation batching with BaseEngine<DndState>.
 */

import { BaseEngine } from '../../../core/engine'
import { elementFromPointStrategy, evaluateCollision } from './collision'
import { evaluateAcceptanceRule, isTypeAccepted } from './rules'
import type {
  ClientRectangle,
  CollisionStrategy,
  Coordinates,
  DndState,
  DragCancelEvent,
  DragEndEvent,
  DragItem,
  DragMoveEvent,
  DragOverEvent,
  DragStartEvent,
  DropTarget,
  SpatialSnapshot,
} from './types'

export interface DndEngineOptions {
  collisionStrategy?: CollisionStrategy
  initialState?: Partial<DndState>
}

export class DndEngine extends BaseEngine<DndState> {
  // Memory-Safe WeakRef Registries (Prevents Detached DOM Node Leaks)
  private draggables = new Map<string, { item: DragItem; elementRef: WeakRef<HTMLElement> }>()
  private droppables = new Map<string, { target: DropTarget; elementRef: WeakRef<HTMLElement> }>()
  private droppableMetaMap = new Map<string, DropTarget>()

  // In-Memory Spatial Snapshot (Eliminates O(N) getBoundingClientRect reflows during pointermove)
  private spatialSnapshot: SpatialSnapshot[] = []

  // Passive Scroll/Resize Listeners for Spatial Cache Invalidation
  private scrollCleanup?: () => void

  constructor(options: DndEngineOptions = {}) {
    const initialState: DndState = {
      activeItem: null,
      overTarget: null,
      dragCoordinates: null,
      initialCoordinates: null,
      initialContainerId: null,
      initialIndex: null,
      isDragging: false,
      validation: null,
      collisionStrategy: options.collisionStrategy ?? 'element-from-point',
      ...options.initialState,
    }

    super(initialState)
  }

  // Last valid hover target cache (Ensures drops on gaps, containers, or child boundaries never drop silently)
  private lastValidOverTarget: DropTarget | null = null

  /**
   * Dynamically updates active collision detection strategy.
   */
  public setCollisionStrategy(collisionStrategy: CollisionStrategy): void {
    if (this.state.collisionStrategy !== collisionStrategy) {
      this.setState({ collisionStrategy })
    }
  }

  /**
   * Synchronizes dynamic provider configuration options.
   */
  public updateOptions(options: { collisionStrategy?: CollisionStrategy }): void {
    const updates: Partial<DndState> = {}
    if (options.collisionStrategy && this.state.collisionStrategy !== options.collisionStrategy) {
      updates.collisionStrategy = options.collisionStrategy
    }
    if (Object.keys(updates).length > 0) {
      this.setState(updates)
    }
  }

  // ============================================================================
  // Registration Subsystem (Memory-Safe WeakRefs)
  // ============================================================================

  /**
   * Registers a draggable DOM element using a WeakRef to prevent memory leaks.
   */
  public registerDraggable = (item: DragItem, element: HTMLElement): (() => void) => {
    const key = String(item.id)
    this.draggables.set(key, { item, elementRef: new WeakRef(element) })
    return () => {
      this.draggables.delete(key)
    }
  }

  /**
   * Registers a droppable zone using a WeakRef and updates the O(1) metadata cache.
   */
  public registerDroppable = (target: DropTarget, element: HTMLElement): (() => void) => {
    const key = String(target.id)
    this.droppables.set(key, { target, elementRef: new WeakRef(element) })
    this.droppableMetaMap.set(key, target)
    return () => {
      this.droppables.delete(key)
      this.droppableMetaMap.delete(key)
    }
  }

  /**
   * Captures an in-memory spatial layout snapshot of all active droppables.
   * Runs ONCE on drag initiation to prevent layout thrashing on subsequent pointer moves.
   */
  private captureSpatialSnapshot(activeType?: string): void {
    const snapshots: SpatialSnapshot[] = []
    const deadKeys: string[] = []

    for (const [key, entry] of this.droppables) {
      const element = entry.elementRef.deref()
      if (!element || !element.isConnected) {
        deadKeys.push(key)
        continue
      }

      // Early Pruning: Skip droppables that cannot accept this item type
      const acceptList = entry.target.accept ?? (entry.target.rule && typeof entry.target.rule === 'object' ? entry.target.rule.acceptTypes : undefined)
      if (activeType && !isTypeAccepted(activeType, acceptList)) {
        continue
      }

      const r = element.getBoundingClientRect()
      snapshots.push({
        target: entry.target,
        rect: {
          top: r.top,
          left: r.left,
          right: r.right,
          bottom: r.bottom,
          width: r.width,
          height: r.height,
        },
      })
    }

    // Auto-clean any garbage collected WeakRefs
    for (const key of deadKeys) {
      this.droppables.delete(key)
      this.droppableMetaMap.delete(key)
    }

    this.spatialSnapshot = snapshots
  }

  // ============================================================================
  // Drag Lifecycle Actions
  // ============================================================================

  /**
   * Initiates a drag operation, taking a one-time spatial snapshot and attaching passive scroll listeners.
   */
  public startDrag(item: DragItem, coords: Coordinates = { x: 0, y: 0 }): void {
    this.lastValidOverTarget = null
    const initialContainerId = item.containerId ?? null
    const initialIndex = item.index ?? null

    let initialRect: ClientRectangle | null = null
    const registered = this.draggables.get(String(item.id))
    if (registered) {
      const element = registered.elementRef.deref()
      if (element && element.isConnected) {
        const r = element.getBoundingClientRect()
        initialRect = {
          top: r.top,
          left: r.left,
          right: r.right,
          bottom: r.bottom,
          width: r.width,
          height: r.height,
        }
      }
    }

    const hydratedItem: DragItem = {
      ...item,
      initialRect,
    }

    // 1. Snapshot layout once at drag initiation
    this.captureSpatialSnapshot(item.type)

    // 2. Attach passive scroll listener to update cached rects on container scrolls
    if (typeof window !== 'undefined') {
      const handleScroll = () => {
        if (this.state.isDragging) {
          this.captureSpatialSnapshot(this.state.activeItem?.type)
        }
      }
      window.addEventListener('scroll', handleScroll, { passive: true, capture: true })
      this.scrollCleanup = () => {
        window.removeEventListener('scroll', handleScroll, { capture: true })
      }
    }

    this.setState({
      activeItem: hydratedItem,
      overTarget: null,
      dragCoordinates: coords,
      initialCoordinates: coords,
      initialContainerId,
      initialIndex,
      isDragging: true,
      validation: null,
    })

    const payload: DragStartEvent = {
      active: hydratedItem,
      coordinates: coords,
    }

    this.emit('drag:start', payload)
  }

  /**
   * Updates pointer coordinates at 60-120Hz.
   * Utilizes O(1) native compositor hit-testing and in-memory spatial cache (Zero synchronous DOM reflows).
   */
  public updateDragCoordinates(coords: Coordinates): void {
    const { activeItem, initialCoordinates, collisionStrategy } = this.state
    if (!activeItem || !this.state.isDragging) return

    this.batch(() => {
      let candidateTarget: DropTarget | null = null

      // Fast-Path 1: Native elementFromPoint hit-testing (~0.02ms O(1) compositor query)
      if (collisionStrategy === 'element-from-point') {
        candidateTarget = elementFromPointStrategy(coords, this.droppableMetaMap)
      }

      // Fast-Path 2: Pure in-memory coordinate arithmetic against spatial snapshot
      if (!candidateTarget && this.spatialSnapshot.length > 0) {
        let activeRect: ClientRectangle | null = null
        if (activeItem.initialRect && initialCoordinates) {
          const dx = coords.x - initialCoordinates.x
          const dy = coords.y - initialCoordinates.y
          activeRect = {
            top: activeItem.initialRect.top + dy,
            left: activeItem.initialRect.left + dx,
            right: activeItem.initialRect.right + dx,
            bottom: activeItem.initialRect.bottom + dy,
            width: activeItem.initialRect.width,
            height: activeItem.initialRect.height,
          }
        }

        candidateTarget = evaluateCollision(
          collisionStrategy === 'element-from-point' ? 'rect-intersection' : collisionStrategy,
          coords,
          activeRect,
          this.spatialSnapshot,
          this.droppableMetaMap
        )
      }

      let validation = null
      if (candidateTarget) {
        this.lastValidOverTarget = candidateTarget
        validation = evaluateAcceptanceRule(activeItem, candidateTarget)
      }

      this.setState({
        dragCoordinates: coords,
        overTarget: candidateTarget,
        validation,
      })

      const movePayload: DragMoveEvent = {
        active: activeItem,
        coordinates: coords,
        delta: {
          x: coords.x - (initialCoordinates?.x ?? coords.x),
          y: coords.y - (initialCoordinates?.y ?? coords.y),
        },
      }
      this.emit('drag:move', movePayload)

      if (candidateTarget) {
        const overPayload: DragOverEvent = {
          active: activeItem,
          over: candidateTarget,
          validation: validation ?? undefined,
        }
        this.emit('drag:over', overPayload)
      }
    })
  }

  /**
   * Manually sets or clears the current hover target with validation.
   */
  public setOver(target: DropTarget | null): void {
    const { activeItem } = this.state
    const validation = activeItem && target ? evaluateAcceptanceRule(activeItem, target) : null

    if (target) {
      this.lastValidOverTarget = target
    }

    this.setState({
      overTarget: target,
      validation,
    })

    if (activeItem) {
      this.emit('drag:over', {
        active: activeItem,
        over: target ?? undefined,
        validation: validation ?? undefined,
      })
    }
  }

  /**
   * Updates mutable properties on the active drag item.
   */
  public updateActiveItem(updates: Partial<DragItem>): void {
    if (!this.state.activeItem) return
    this.setState({
      activeItem: { ...this.state.activeItem, ...updates },
    })
  }

  /**
   * Finalizes the drag operation with a successful drop or cancel, clearing spatial cache.
   */
  public endDrag(cancelled: boolean = false): void {
    const { activeItem, overTarget, initialContainerId, initialIndex, validation } = this.state
    if (!activeItem) return

    const effectiveOverTarget = overTarget ?? this.lastValidOverTarget
    const effectiveValidation = effectiveOverTarget
      ? evaluateAcceptanceRule(activeItem, effectiveOverTarget)
      : validation

    const isDropped =
      !cancelled &&
      effectiveOverTarget !== null &&
      effectiveValidation?.isAccepted !== false

    // Clean up spatial snapshot & scroll listener
    this.spatialSnapshot = []
    if (this.scrollCleanup) {
      this.scrollCleanup()
      this.scrollCleanup = undefined
    }

    this.lastValidOverTarget = null

    this.setState({
      activeItem: null,
      overTarget: null,
      dragCoordinates: null,
      initialCoordinates: null,
      initialContainerId: null,
      initialIndex: null,
      isDragging: false,
      validation: null,
    })

    if (cancelled || !isDropped) {
      const cancelPayload: DragCancelEvent = {
        active: activeItem,
        initialContainerId: initialContainerId ?? undefined,
        initialIndex: initialIndex ?? undefined,
      }
      this.emit('drag:cancel', cancelPayload)
    } else {
      let computedTargetIndex: number | undefined = undefined
      const rawIndex = (effectiveOverTarget?.data as any)?.index
      if (typeof rawIndex === 'number') {
        computedTargetIndex = rawIndex
      }

      const endPayload: DragEndEvent = {
        active: activeItem,
        over: effectiveOverTarget ?? undefined,
        validation: this.state.validation ?? undefined,
        initialContainerId: initialContainerId ?? undefined,
        initialIndex: initialIndex ?? undefined,
        targetContainerId:
          effectiveOverTarget?.containerId ??
          (effectiveOverTarget?.data as any)?.containerId ??
          effectiveOverTarget?.id ??
          initialContainerId ??
          undefined,
        targetIndex: computedTargetIndex ?? (typeof rawIndex === 'number' ? rawIndex : undefined),
        isDropped: !this.state.validation?.isRejected,
      }
      this.emit('drag:drop', endPayload)
    }
  }

  /**
   * Cancels the active drag operation immediately.
   */
  public cancelDrag(): void {
    this.endDrag(true)
  }

  // ============================================================================
  // Type Query Helpers
  // ============================================================================

  /**
   * Returns the type identifier of the currently dragged entity.
   */
  public getActiveType(): string | undefined {
    return this.state.activeItem?.type
  }

  /**
   * Returns the strongly typed data payload of the active entity.
   */
  public getActiveData<T = any>(): T | undefined {
    return this.state.activeItem?.data as T | undefined
  }

  /**
   * Checks if an entity of the given type is currently being dragged.
   */
  public isTypeDragging(type: string): boolean {
    return this.state.isDragging && this.state.activeItem?.type === type
  }

  /**
   * Override cleanup to clear maps, snapshots, and listeners.
   */
  public override destroy(): void {
    this.spatialSnapshot = []
    if (this.scrollCleanup) {
      this.scrollCleanup()
      this.scrollCleanup = undefined
    }
    this.draggables.clear()
    this.droppables.clear()
    this.droppableMetaMap.clear()
    super.destroy()
  }
}

/**
 * Factory helper for instantiating a DndEngine.
 */
export function createDndEngine(options?: DndEngineOptions): DndEngine {
  return new DndEngine(options)
}
