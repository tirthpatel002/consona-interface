/**
 * @file gantt-engine.ts
 * Pure TypeScript GanttEngine — timeline viewport, selection, and drag sessions.
 * Zero React dependencies (Rule ENG1).
 */

import { BaseEngine } from '../../../core/engine'
import {
  applyDragDelta,
  buildColumns,
  datesFromLayout,
  defaultCellWidth,
  rangeFromColumns,
  timelineWidth,
  toMs,
} from './timeline'
import type {
  GanttColumn,
  GanttDependencyLinkSession,
  GanttDependencySide,
  GanttDragSession,
  GanttDragType,
  GanttEngineOptions,
  GanttEngineState,
  GanttItemChangeEvent,
  GanttViewRange,
} from './types'

/**
 * Framework-agnostic engine managing Gantt viewport geometry and interaction state.
 * Item data stays in React; the engine only tracks view/selection/drag sessions.
 */
export class GanttEngine extends BaseEngine<GanttEngineState> {
  private columnCount: number = 0

  constructor(options: GanttEngineOptions = {}) {
    const viewRange: GanttViewRange = options.viewRange ?? 'month'
    const cellWidth = options.cellWidth ?? defaultCellWidth(viewRange)
    const columns = buildColumns(viewRange, { anchor: options.anchor })
    const { startMs, endMs } = rangeFromColumns(columns)

    super({
      viewRange,
      cellWidth,
      rangeStartMs: startMs,
      rangeEndMs: endMs,
      selectedId: null,
      hoveredId: null,
      drag: null,
      dependencyLink: null,
      scrollLeft: 0,
      viewportWidth: 0,
      nowMs: options.nowMs ?? Date.now(),
      dependenciesEnabled: options.dependenciesEnabled ?? false,
    })

    this.columnCount = columns.length
  }

  /** Rebuild columns + range bounds for a view range change. */
  public setViewRange(viewRange: GanttViewRange, anchor?: Date): void {
    if (viewRange === this.state.viewRange && !anchor) return
    const cellWidth = defaultCellWidth(viewRange)
    const columns = buildColumns(viewRange, { anchor })
    const { startMs, endMs } = rangeFromColumns(columns)
    // Skip notify when magnification + range are unchanged (unstable Date identity).
    if (
      viewRange === this.state.viewRange &&
      cellWidth === this.state.cellWidth &&
      startMs === this.state.rangeStartMs &&
      endMs === this.state.rangeEndMs
    ) {
      return
    }
    this.columnCount = columns.length
    this.setState({
      viewRange,
      cellWidth,
      rangeStartMs: startMs,
      rangeEndMs: endMs,
      drag: null,
      dependencyLink: null,
    })
    this.emit('gantt:viewRangeChange', { viewRange, rangeStartMs: startMs, rangeEndMs: endMs })
  }

  /** Override cell width (advanced densification). */
  public setCellWidth(cellWidth: number): void {
    if (cellWidth === this.state.cellWidth) return
    this.setState({ cellWidth })
    this.emit('gantt:cellWidthChange', { cellWidth })
  }

  /** Refresh "now" marker timestamp. */
  public setNow(nowMs: number = Date.now()): void {
    if (nowMs === this.state.nowMs) return
    this.setState({ nowMs })
    this.emit('gantt:now', { nowMs })
  }

  /** Sync horizontal scroll offset. */
  public setScrollLeft(scrollLeft: number): void {
    if (scrollLeft === this.state.scrollLeft) return
    this.setState({ scrollLeft })
  }

  /**
   * Sync scroll + visible timeline viewport width together.
   * Prefer this from the scroller so edge chips stay aligned without double notifies.
   */
  public setViewport(scrollLeft: number, viewportWidth: number): void {
    const nextWidth = Math.max(0, viewportWidth)
    if (scrollLeft === this.state.scrollLeft && nextWidth === this.state.viewportWidth) return
    this.setState({ scrollLeft, viewportWidth: nextWidth })
  }

  public select(selectedId: string | null): void {
    if (selectedId === this.state.selectedId) return
    this.setState({ selectedId })
    this.emit('gantt:select', { selectedId })
  }

  public hover(hoveredId: string | null): void {
    if (hoveredId === this.state.hoveredId) return
    this.setState({ hoveredId })
    this.emit('gantt:hover', { hoveredId })
  }

  public setDependenciesEnabled(enabled: boolean): void {
    this.setState({ dependenciesEnabled: enabled })
  }

  /** Begin a move / resize gesture. */
  public beginDrag(input: {
    itemId: string
    type: GanttDragType
    clientX: number
    left: number
    width: number
    startMs: number
    endMs: number
  }): void {
    const session: GanttDragSession = {
      itemId: input.itemId,
      type: input.type,
      startClientX: input.clientX,
      startScrollLeft: this.state.scrollLeft,
      startLeft: input.left,
      startWidth: input.width,
      originalDurationMs: Math.max(0, input.endMs - input.startMs),
      left: input.left,
      width: input.width,
    }
    this.setState({ drag: session, selectedId: input.itemId, dependencyLink: null })
    this.emit('gantt:dragStart', session)
  }

  /**
   * Update live preview during pointer move.
   * Pass `scrollLeft` after edge-autoscroll so dx includes scroll delta since drag start.
   */
  public updateDrag(clientX: number, scrollLeft?: number): GanttDragSession | null {
    const drag = this.state.drag
    if (!drag) return null
    const currentScrollLeft = scrollLeft ?? this.state.scrollLeft
    // Content-space delta: pointer move + any scroller shift since beginDrag.
    const dx =
      clientX - drag.startClientX + (currentScrollLeft - drag.startScrollLeft)
    const widthPx = timelineWidth(this.columnCount, this.state.cellWidth)
    const { left, width } = applyDragDelta(
      drag,
      dx,
      this.state.cellWidth,
      this.state.viewRange,
      widthPx,
      this.state.rangeStartMs
    )
    const next: GanttDragSession = { ...drag, left, width }
    this.setState({ drag: next })
    this.emit('gantt:dragMove', next)
    return next
  }

  /**
   * Commit the active drag and emit a typed item-change payload.
   * Returns null when there is no active session.
   */
  public endDrag<T = unknown>(item: T): GanttItemChangeEvent<T> | null {
    const drag = this.state.drag
    if (!drag) return null

    const { start, end } = datesFromLayout(
      drag.left,
      drag.width,
      this.state.rangeStartMs,
      this.state.cellWidth,
      this.state.viewRange,
      {
        type: drag.type,
        preserveDurationMs: drag.type === 'move' ? drag.originalDurationMs : undefined,
      }
    )

    const event: GanttItemChangeEvent<T> = {
      id: drag.itemId,
      item,
      start,
      end,
      type: drag.type,
    }

    this.setState({ drag: null })
    this.emit('gantt:dragEnd', event)
    this.emit('gantt:itemChange', event)
    return event
  }

  public cancelDrag(): void {
    if (!this.state.drag) return
    this.setState({ drag: null })
    this.emit('gantt:dragCancel', undefined)
  }

  /** Begin dragging a dependency connection from a bar edge dot. */
  public beginDependencyLink(input: {
    sourceId: string
    side: GanttDependencySide
    x: number
    y: number
  }): void {
    const session: GanttDependencyLinkSession = {
      sourceId: input.sourceId,
      side: input.side,
      x: input.x,
      y: input.y,
    }
    this.setState({ dependencyLink: session, drag: null })
    this.emit('gantt:dependencyLinkStart', session)
  }

  /** Update the rubber-band endpoint while linking. */
  public updateDependencyLink(x: number, y: number): GanttDependencyLinkSession | null {
    const link = this.state.dependencyLink
    if (!link) return null
    if (link.x === x && link.y === y) return link
    const next: GanttDependencyLinkSession = { ...link, x, y }
    this.setState({ dependencyLink: next })
    return next
  }

  /** Clear the dependency-link gesture without committing. */
  public endDependencyLink(): GanttDependencyLinkSession | null {
    const link = this.state.dependencyLink
    if (!link) return null
    this.setState({ dependencyLink: null })
    this.emit('gantt:dependencyLinkEnd', link)
    return link
  }

  public cancelDependencyLink(): void {
    if (!this.state.dependencyLink) return
    this.setState({ dependencyLink: null })
    this.emit('gantt:dependencyLinkCancel', undefined)
  }

  /** Rebuild range around a new anchor without changing viewRange. */
  public rebuildRange(anchor?: Date): void {
    const columns = buildColumns(this.state.viewRange, { anchor })
    const { startMs, endMs } = rangeFromColumns(columns)
    this.columnCount = columns.length
    this.setState({ rangeStartMs: startMs, rangeEndMs: endMs })
  }

  /**
   * Apply provider-computed columns as the timeline range + width basis.
   * Used when columns expand to cover item extents beyond the default window.
   */
  public syncColumns(columns: GanttColumn[]): void {
    const { startMs, endMs } = rangeFromColumns(columns)
    const count = columns.length
    if (
      startMs === this.state.rangeStartMs &&
      endMs === this.state.rangeEndMs &&
      count === this.columnCount
    ) {
      return
    }
    this.columnCount = count
    this.setState({ rangeStartMs: startMs, rangeEndMs: endMs })
  }

  /** Column count used for timeline width clamps. */
  public getColumnCount(): number {
    return this.columnCount
  }

  /** Convenience: coerce accessor time values. */
  public static toMs = toMs
}

/** Factory helper matching other Consona engines. */
export function createGanttEngine(options?: GanttEngineOptions): GanttEngine {
  return new GanttEngine(options)
}
