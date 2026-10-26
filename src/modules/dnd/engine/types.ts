/**
 * @file types.ts
 * Type definitions for @consona/interface Drag-and-Drop (DnD) Engine.
 * Provides normalized geometric primitives, serializable data payloads, rule specifications, and lifecycle events.
 */


/** Unique identifier for draggables, droppables, and containers. */
export type Identifier = string | number

/** Spatial 2D Cartesian coordinates. */
export interface Coordinates {
  /** Horizontal X coordinate in pixels. */
  x: number
  /** Vertical Y coordinate in pixels. */
  y: number
}

/** Axis constraints for drag movement and spatial placement. */
export type DragAxis = 'both' | 'horizontal' | 'vertical' | 'x' | 'y'

/** Bounding rectangle in viewport coordinate space. */
export interface ClientRectangle {
  top: number
  left: number
  right: number
  bottom: number
  width: number
  height: number
}

/** Boundary padding offsets in pixels. */
export interface BoundaryPadding {
  top?: number
  right?: number
  bottom?: number
  left?: number
}

/** Spatial boundary constraints for drag operations. */
export interface BoundaryConstraints {
  container?: HTMLElement | string | { readonly current: HTMLElement | null } | null
  padding?: BoundaryPadding
  constrainToViewport?: boolean
}

/**
 * Normalized, serializable representation of an active draggable entity.
 */
export interface DragItem<TData = any> {
  /** Unique entity identifier. */
  id: Identifier
  /** Semantic type discriminant for acceptance rules (e.g. 'task', 'column', 'media/image'). */
  type?: string
  /** Arbitrary domain payload data. */
  data?: TData
  /** Identifier of the parent container holding this item. */
  containerId?: Identifier
  /** Initial index within the source container collection. */
  index?: number
  /** Cached bounding client rect at drag initiation (without holding DOM reference). */
  initialRect?: ClientRectangle | null
}

/**
 * Predicate validation callback for deep droppable acceptance rules.
 */
export type DropRulePredicate<TActive = any, TTarget = any> = (context: {
  active: DragItem<TActive>
  target: DropTarget<TTarget>
  containerId?: Identifier
  currentCount?: number
}) => boolean

/**
 * Acceptance rule specification for drop targets.
 */
export interface DropRule<TActive = any, TTarget = any> {
  /** Explicit type strings or glob patterns to match against active item type. */
  acceptTypes?: string | string[]
  /** Custom boolean validator function. */
  predicate?: DropRulePredicate<TActive, TTarget>
  /** Maximum number of items the target or container can accept. */
  maxCapacity?: number
  /** Explanatory message when acceptance rule fails. */
  rejectionMessage?: string
}

/**
 * Evaluation result of acceptance validation.
 */
export interface DropValidationResult {
  /** Whether the active item is permitted to drop on this target. */
  isAccepted: boolean
  /** Whether the active item was rejected by validation rules. */
  isRejected: boolean
  /** Descriptive reason if rejected. */
  rejectionReason?: string
}

/**
 * Normalized, serializable representation of a registered droppable zone.
 */
export interface DropTarget<TData = any> {
  /** Unique droppable identifier. */
  id: Identifier
  /** Semantic droppable target type. */
  type?: string
  /** Arbitrary domain payload data. */
  data?: TData
  /** Accepted item type(s) or wildcard pattern ('*'). */
  accept?: string | string[]
  /** Advanced functional acceptance rule or capacity limiter. */
  rule?: DropRule | DropRulePredicate
  /** Identifier of the enclosing container if nested. */
  containerId?: Identifier
  /** Maximum capacity for this target. */
  maxCapacity?: number
  /** Full item list when available (e.g. column shell). */
  items?: any[]
  /** Whether this drop target is disabled. */
  disabled?: boolean
  /** Cached bounding client rect snapshot during drag session. */
  rect?: ClientRectangle | null
}

/**
 * Spatial layout snapshot taken at drag start for zero-reflow move cycles.
 */
export interface SpatialSnapshot {
  target: DropTarget
  rect: ClientRectangle
}

/**
 * Collision detection algorithm names.
 */
export type CollisionStrategyName =
  | 'closest-center'
  | 'closest-corners'
  | 'rect-intersection'
  | 'pointer-within'
  | 'element-from-point'

/**
 * Custom collision detection function signature.
 */
export type CollisionStrategyFn = (
  pointer: Coordinates,
  activeRect: ClientRectangle | null,
  droppables: SpatialSnapshot[]
) => DropTarget | null

/**
 * Collision strategy: either predefined name or custom function.
 */
export type CollisionStrategy = CollisionStrategyName | CollisionStrategyFn

/**
 * Drag lifecycle event payloads.
 */
export interface DragStartEvent<TActive = any> {
  active: DragItem<TActive>
  coordinates: Coordinates
}

export interface DragMoveEvent<TActive = any> {
  active: DragItem<TActive>
  coordinates: Coordinates
  delta: Coordinates
}

export interface DragOverEvent<TActive = any, TOver = any> {
  active: DragItem<TActive>
  over?: DropTarget<TOver>
  validation?: DropValidationResult
}

export interface DragEndEvent<TActive = any, TOver = any> {
  active: DragItem<TActive>
  over?: DropTarget<TOver>
  validation?: DropValidationResult
  initialContainerId?: Identifier
  initialIndex?: number
  targetContainerId?: Identifier
  targetIndex?: number
  isDropped: boolean
  rank?: string
  beforeRank?: string
  afterRank?: string
  beforeItem?: any
  afterItem?: any
}

export interface DragCancelEvent<TActive = any> {
  active: DragItem<TActive>
  initialContainerId?: Identifier
  initialIndex?: number
}

export interface DragReorderEvent<TItem = any> {
  activeId: Identifier
  sourceContainerId: Identifier
  targetContainerId: Identifier
  sourceIndex: number
  targetIndex: number
  items?: TItem[]
  rank?: string
  beforeRank?: string
  afterRank?: string
  beforeItem?: TItem
  afterItem?: TItem
}

/**
 * Sensor activation options and thresholds.
 */
export interface SensorOptions {
  /** Movement distance in pixels before drag gesture activates. Default: 3px */
  activationDistance?: number
  /** Hold duration in milliseconds before activation. Default: 0ms */
  activationDelay?: number
  /** Tolerance threshold for jitter during activation delay. */
  tolerance?: number
}

/**
 * Comprehensive reactive state managed by the DndEngine.
 */
export interface DndState {
  /** Currently dragged item, or null when idle. */
  activeItem: DragItem | null
  /** Currently hovered drop target, or null when not over any target. */
  overTarget: DropTarget | null
  /** Real-time pointer/touch cursor coordinates. */
  dragCoordinates: Coordinates | null
  /** Pointer coordinates at the instant drag was initiated. */
  initialCoordinates: Coordinates | null
  /** Original container ID where the drag began. */
  initialContainerId: Identifier | null
  /** Original index in the source collection. */
  initialIndex: number | null
  /** Whether a drag operation is actively in progress. */
  isDragging: boolean
  /** Validation status of the active item against the current hover target. */
  validation: DropValidationResult | null
  /** Active collision detection strategy. */
  collisionStrategy: CollisionStrategy
}
