/**
 * @file timeline.ts
 * Pure timeline geometry: columns, unit-aware px↔time, snap move/resize. Zero React.
 *
 * Conversions use calendar cell units (hour / day / week) so geometry stays aligned with
 * buildColumns across DST. Never map day/week cells through a fixed 86400000 ms.
 */

import type {
  GanttBarLayout,
  GanttColumn,
  GanttDragSession,
  GanttDragType,
  GanttTimeValue,
  GanttViewRange,
} from './types'

const MS_MINUTE = 60_000
const MS_HOUR = 3_600_000
const MS_DAY = 86_400_000
const MS_WEEK = 7 * MS_DAY

/** Cell unit for a view — one grid column. */
export type GanttCellUnit = 'hour' | 'day' | 'week'

/** Coerce Date | number | ISO string → epoch milliseconds. Invalid → NaN. */
export function toMs(value: GanttTimeValue): number {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return value
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : NaN
}

/** Start of local calendar day. */
export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Start of local ISO week (Monday). */
export function startOfWeek(date: Date): Date {
  const d = startOfDay(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

/** Add days to a date (local calendar). */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/** Add hours to a date (epoch ms — used for day-view hour columns). */
export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * MS_HOUR)
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatDayLabel(d: Date): string {
  return `${MONTH_SHORT[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`
}

function formatHourLabel(d: Date): string {
  const h = d.getHours()
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}${suffix}`
}

/** Weekday + day number — Elixir week primary `ccc d` (e.g. "Wed 7"). */
function formatWeekDayLabel(d: Date): string {
  return `${WEEKDAY_SHORT[d.getDay()]} ${d.getDate()}`
}

/** Day-of-month only — Elixir month primary `d` (e.g. "7"). */
function formatMonthDayLabel(d: Date): string {
  return String(d.getDate())
}

/** ISO-8601 week number (week containing Thursday; Monday start). */
function isoWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((date.getTime() - yearStart.getTime()) / MS_DAY + 1) / 7)
}

/**
 * Parent-band label for day-cell views.
 * Week → `Mar (Week 12)` (Elixir secondary `MMM '(Week' W ')'`).
 * Month → `Mar 2026` (Elixir secondary `MMM yyyy`).
 */
function formatDayParentLabel(d: Date, viewRange: 'week' | 'month'): string {
  if (viewRange === 'week') {
    const weekStart = startOfWeek(d)
    return `${MONTH_SHORT[weekStart.getMonth()]} (Week ${isoWeekNumber(weekStart)})`
  }
  return `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

/** Stable group key so parentLabel is emitted only on the first cell of a band. */
function dayParentGroupKey(d: Date, viewRange: 'week' | 'month'): string {
  if (viewRange === 'week') return String(startOfWeek(d).getTime())
  return `${d.getFullYear()}-${d.getMonth()}`
}

/**
 * Default cell width per view range.
 * Week/month both use day cells — width differentiates density (Elixir 144 / 72).
 */
export function defaultCellWidth(viewRange: GanttViewRange): number {
  switch (viewRange) {
    case 'day':
      return 60
    case 'week':
      return 144
    case 'month':
      return 72
    case 'quarter':
      return 120
  }
}

/** Cell unit for the view (matches buildColumns). */
export function cellUnit(viewRange: GanttViewRange): GanttCellUnit {
  switch (viewRange) {
    case 'day':
      return 'hour'
    case 'week':
    case 'month':
      return 'day'
    case 'quarter':
      return 'week'
  }
}

/**
 * Nominal milliseconds for one full cell (ratios / min-width math only).
 * day → 1 hour, week/month → 1 day, quarter → 1 week.
 * Do NOT use this for px↔time across DST — use {@link timeToPx} / {@link pxToTime}.
 */
export function cellDurationMs(viewRange: GanttViewRange): number {
  switch (viewRange) {
    case 'day':
      return MS_HOUR
    case 'week':
    case 'month':
      return MS_DAY
    case 'quarter':
      return MS_WEEK
  }
}

/** Nominal snap quantum in milliseconds (sub-cell). Prefer {@link snapToUnit} for commits. */
export function snapDurationMs(viewRange: GanttViewRange): number {
  switch (viewRange) {
    case 'day':
      return 15 * MS_MINUTE
    case 'week':
    case 'month':
      return MS_HOUR
    case 'quarter':
      return MS_DAY
  }
}

/** Snap step as a fraction of one cell (for pixel-grid snap). */
export function snapFraction(viewRange: GanttViewRange): number {
  return snapDurationMs(viewRange) / cellDurationMs(viewRange)
}

/** Approximate pixels per millisecond (nominal). Prefer unit-based helpers for geometry. */
export function pxPerMs(cellWidth: number, viewRange: GanttViewRange): number {
  return cellWidth / cellDurationMs(viewRange)
}

/** Wall-clock ms since local midnight (0..~MS_DAY; 25h DST days can exceed). */
function timeOfDayMs(ms: number): number {
  const d = new Date(ms)
  return (
    d.getHours() * MS_HOUR +
    d.getMinutes() * MS_MINUTE +
    d.getSeconds() * 1000 +
    d.getMilliseconds()
  )
}

/**
 * Fractional local calendar days between two instants (DST-safe).
 * Whole days count via Y-M-D; intra-day fraction uses nominal 24h wall clock.
 */
function diffCalendarDays(fromMs: number, toMs: number): number {
  const a = startOfDay(new Date(fromMs))
  const b = startOfDay(new Date(toMs))
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  const whole = (utcB - utcA) / MS_DAY
  const fromFrac = timeOfDayMs(fromMs) / MS_DAY
  const toFrac = timeOfDayMs(toMs) / MS_DAY
  return whole + (toFrac - fromFrac)
}

/** Add fractional local calendar days (DST-safe for whole-day steps). */
function addCalendarDays(fromMs: number, days: number): number {
  const whole = days >= 0 ? Math.floor(days) : Math.ceil(days)
  const frac = days - whole
  const d = new Date(fromMs)
  d.setDate(d.getDate() + whole)
  if (frac === 0) return d.getTime()
  // Nominal fraction → wall-clock hours (matches fractional calendar-day math).
  return d.getTime() + frac * MS_DAY
}

/** Fractional cell units from `fromMs` to `toMs` for the view's cell unit. */
export function diffCellUnits(
  fromMs: number,
  toMs: number,
  viewRange: GanttViewRange
): number {
  switch (cellUnit(viewRange)) {
    case 'hour':
      return (toMs - fromMs) / MS_HOUR
    case 'day':
      return diffCalendarDays(fromMs, toMs)
    case 'week':
      return diffCalendarDays(fromMs, toMs) / 7
  }
}

/** Add fractional cell units to an instant. */
export function addCellUnits(
  fromMs: number,
  units: number,
  viewRange: GanttViewRange
): number {
  switch (cellUnit(viewRange)) {
    case 'hour':
      return fromMs + units * MS_HOUR
    case 'day':
      return addCalendarDays(fromMs, units)
    case 'week':
      return addCalendarDays(fromMs, units * 7)
  }
}

/**
 * Snap an instant to the view's snap quantum (unit boundaries).
 * day → 15 min, week/month → hour, quarter → local midnight.
 */
export function snapToUnit(
  ms: number,
  viewRange: GanttViewRange,
  method: 'round' | 'floor' | 'ceil' = 'round'
): number {
  if (!Number.isFinite(ms)) return ms

  switch (viewRange) {
    case 'day': {
      const snap = 15 * MS_MINUTE
      if (method === 'floor') return Math.floor(ms / snap) * snap
      if (method === 'ceil') return Math.ceil(ms / snap) * snap
      return Math.round(ms / snap) * snap
    }
    case 'week':
    case 'month': {
      const d = new Date(ms)
      const dayStart = startOfDay(d).getTime()
      const tod = ms - dayStart
      const hours = tod / MS_HOUR
      let snappedHours: number
      if (method === 'floor') snappedHours = Math.floor(hours)
      else if (method === 'ceil') snappedHours = Math.ceil(hours)
      else snappedHours = Math.round(hours)
      // setHours handles day overflow; keep local calendar.
      const out = startOfDay(d)
      out.setHours(snappedHours, 0, 0, 0)
      return out.getTime()
    }
    case 'quarter': {
      const dayStart = startOfDay(new Date(ms)).getTime()
      if (method === 'floor') return dayStart
      if (method === 'ceil') {
        return ms === dayStart ? dayStart : addDays(new Date(dayStart), 1).getTime()
      }
      // Round toward nearer midnight (noon threshold via nominal half-day).
      const noon = dayStart + MS_DAY / 2
      return ms < noon ? dayStart : addDays(new Date(dayStart), 1).getTime()
    }
  }
}

/** Snap pixel offset to the nearest snap quantum (origin-aligned grid). */
export function snapPx(px: number, cellWidth: number, viewRange: GanttViewRange): number {
  const snap = cellWidth * snapFraction(viewRange)
  if (snap <= 0) return px
  return Math.round(px / snap) * snap
}

export interface BuildColumnsOptions {
  /** Anchor "today" for relative windows. Default: now. */
  anchor?: Date
  /** Override column count (advanced). */
  count?: number
  /**
   * Inclusive lower bound columns must cover (typically min item start).
   * Unioned with the default view window; floored to the view's cell start.
   */
  coverStartMs?: number
  /**
   * Upper bound columns must cover (typically max item end).
   * Unioned with the default view window; ceiled to the view's exclusive cell end.
   */
  coverEndMs?: number
  /**
   * Extra cells before `coverStartMs` and after `coverEndMs`.
   * Default: 1 when either cover bound is set; otherwise 0.
   */
  paddingCells?: number
}

/** Accessors needed to derive a timeline extent from items. */
export interface GanttExtentAccessors<T> {
  getStart: (item: T) => GanttTimeValue
  getEnd: (item: T) => GanttTimeValue
}

/**
 * Min start / max end across items via accessors.
 * Returns null when no finite start/end values exist.
 */
export function itemExtentMs<T>(
  items: readonly T[],
  accessors: GanttExtentAccessors<T>
): { startMs: number; endMs: number } | null {
  let startMs = Infinity
  let endMs = -Infinity
  for (const item of items) {
    const s = toMs(accessors.getStart(item))
    const e = toMs(accessors.getEnd(item))
    if (Number.isFinite(s)) startMs = Math.min(startMs, s)
    if (Number.isFinite(e)) endMs = Math.max(endMs, e)
  }
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return null
  if (endMs < startMs) return { startMs, endMs: startMs }
  return { startMs, endMs }
}

/** Floor an instant to the view's cell start (hour / local day / ISO week). */
function floorToCellStart(ms: number, viewRange: GanttViewRange): Date {
  const d = new Date(ms)
  switch (cellUnit(viewRange)) {
    case 'hour': {
      const out = new Date(d)
      out.setMinutes(0, 0, 0)
      return out
    }
    case 'day':
      return startOfDay(d)
    case 'week':
      return startOfWeek(d)
  }
}

/** Exclusive end of the cell containing `ms` (or `ms` when already on a boundary). */
function ceilToCellEndExclusive(ms: number, viewRange: GanttViewRange): Date {
  const floored = floorToCellStart(ms, viewRange)
  if (floored.getTime() === ms) return floored
  return addCells(floored, 1, viewRange)
}

/** Add whole cell units with calendar-aware math. */
function addCells(date: Date, cells: number, viewRange: GanttViewRange): Date {
  switch (cellUnit(viewRange)) {
    case 'hour':
      return addHours(date, cells)
    case 'day':
      return addDays(date, cells)
    case 'week':
      return addDays(date, cells * 7)
  }
}

/** Default relative window around an anchor (exclusive end). */
function defaultColumnWindow(
  viewRange: GanttViewRange,
  anchor: Date
): { start: Date; end: Date } {
  switch (viewRange) {
    case 'day': {
      const start = startOfDay(anchor)
      return { start, end: addHours(start, 24) }
    }
    case 'week': {
      // Days −7..+14 inclusive → exclusive end at +15.
      return { start: addDays(anchor, -7), end: addDays(anchor, 15) }
    }
    case 'month': {
      // Days −14..+60 inclusive → exclusive end at +61.
      return { start: addDays(anchor, -14), end: addDays(anchor, 61) }
    }
    case 'quarter': {
      const week0 = startOfWeek(anchor)
      // Weeks −2..+11 inclusive → exclusive end at +12 weeks.
      return { start: addDays(week0, -14), end: addDays(week0, 84) }
    }
  }
}

/**
 * Expand a column window so it also covers optional item extents (union),
 * with unit-aligned padding.
 */
function expandWindowForCover(
  window: { start: Date; end: Date },
  viewRange: GanttViewRange,
  coverStartMs?: number,
  coverEndMs?: number,
  paddingCells?: number
): { start: Date; end: Date } {
  const hasCover =
    (coverStartMs != null && Number.isFinite(coverStartMs)) ||
    (coverEndMs != null && Number.isFinite(coverEndMs))
  if (!hasCover) return window

  const pad = paddingCells ?? 1
  let { start, end } = window

  if (coverStartMs != null && Number.isFinite(coverStartMs)) {
    let coverStart = floorToCellStart(coverStartMs, viewRange)
    if (pad !== 0) coverStart = addCells(coverStart, -pad, viewRange)
    if (coverStart.getTime() < start.getTime()) start = coverStart
  }

  if (coverEndMs != null && Number.isFinite(coverEndMs)) {
    let coverEnd = ceilToCellEndExclusive(coverEndMs, viewRange)
    if (pad !== 0) coverEnd = addCells(coverEnd, pad, viewRange)
    if (coverEnd.getTime() > end.getTime()) end = coverEnd
  }

  if (end.getTime() <= start.getTime()) {
    end = addCells(start, 1, viewRange)
  }
  return { start, end }
}

/**
 * Absolute safety net in the column build loop.
 * Soft per-unit caps were removed once header/grid column virtualization made
 * large cover∪anchor spans safe to keep for scroll + bar positioning.
 * Raise only if building tens of thousands of column descriptors becomes costly.
 */
const MAX_COLUMNS = 50_000

/**
 * Build header / grid columns for a view range.
 * Default windows: day (24h), week (−7..+14d), month (−14..+60d), quarter (−2..+12w).
 * Pass `coverStartMs` / `coverEndMs` to union the window with item extents
 * (optional `paddingCells`, default 1 when covering).
 */
export function buildColumns(
  viewRange: GanttViewRange,
  options: BuildColumnsOptions = {}
): GanttColumn[] {
  const anchor = startOfDay(options.anchor ?? new Date())
  const now = new Date()
  let window = defaultColumnWindow(viewRange, anchor)
  window = expandWindowForCover(
    window,
    viewRange,
    options.coverStartMs,
    options.coverEndMs,
    options.paddingCells
  )

  // Optional minimum column count — never shrinks a cover-expanded window.
  if (options.count != null && options.count > 0) {
    const countEnd = addCells(window.start, options.count, viewRange)
    if (countEnd.getTime() > window.end.getTime()) {
      window = { start: window.start, end: countEnd }
    }
  }

  const unit = cellUnit(viewRange)

  const columns: GanttColumn[] = []
  let cursor = window.start
  const endMs = window.end.getTime()

  while (cursor.getTime() < endMs && columns.length < MAX_COLUMNS) {
    let colEnd: Date
    switch (unit) {
      case 'hour': {
        colEnd = addHours(cursor, 1)
        columns.push({
          start: cursor,
          end: colEnd,
          label: formatHourLabel(cursor),
          subLabel: cursor.getHours() === 0 ? formatDayLabel(cursor) : undefined,
          isToday: now >= cursor && now < colEnd,
        })
        break
      }
      case 'day': {
        colEnd = addDays(cursor, 1)
        // Week vs month share day cells; labels + parent band differentiate (Elixir-like).
        const dayView = viewRange === 'week' || viewRange === 'month' ? viewRange : 'month'
        const groupKey = dayParentGroupKey(cursor, dayView)
        const prevKey =
          columns.length > 0
            ? dayParentGroupKey(columns[columns.length - 1]!.start, dayView)
            : null
        const parentLabel =
          groupKey !== prevKey ? formatDayParentLabel(cursor, dayView) : undefined
        columns.push({
          start: cursor,
          end: colEnd,
          label:
            dayView === 'week' ? formatWeekDayLabel(cursor) : formatMonthDayLabel(cursor),
          parentLabel,
          isToday: startOfDay(now).getTime() === cursor.getTime(),
        })
        break
      }
      case 'week': {
        colEnd = addDays(cursor, 7)
        columns.push({
          start: cursor,
          end: colEnd,
          label: `${formatDayLabel(cursor)} – ${formatDayLabel(addDays(cursor, 6))}`,
          isToday: now >= cursor && now < colEnd,
        })
        break
      }
    }
    cursor = colEnd
  }

  return columns
}

/** Convert absolute time → pixel offset from range start (unit-aware). */
export function timeToPx(
  timeMs: number,
  rangeStartMs: number,
  cellWidth: number,
  viewRange: GanttViewRange
): number {
  return diffCellUnits(rangeStartMs, timeMs, viewRange) * cellWidth
}

/** Convert pixel offset → absolute time (unit-aware). */
export function pxToTime(
  px: number,
  rangeStartMs: number,
  cellWidth: number,
  viewRange: GanttViewRange
): number {
  if (cellWidth <= 0) return rangeStartMs
  return addCellUnits(rangeStartMs, px / cellWidth, viewRange)
}

/** Layout a bar from start/end times within a timeline range. */
export function layoutBar(
  start: GanttTimeValue,
  end: GanttTimeValue,
  rangeStartMs: number,
  cellWidth: number,
  viewRange: GanttViewRange
): GanttBarLayout {
  const startMs = toMs(start)
  const endMs = toMs(end)
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    return {
      left: 0,
      width: cellWidth,
      startMs: rangeStartMs,
      endMs: addCellUnits(rangeStartMs, 1, viewRange),
    }
  }
  const rawLeft = timeToPx(startMs, rangeStartMs, cellWidth, viewRange)
  const rawRight = timeToPx(endMs, rangeStartMs, cellWidth, viewRange)
  const left = Math.max(0, rawLeft)
  const right = Math.max(left, rawRight)
  const minWidth = cellWidth * snapFraction(viewRange)
  return {
    left,
    width: Math.max(minWidth, right - left),
    startMs,
    endMs,
  }
}

/** Pixel position of "now" on the timeline. */
export function nowLinePx(
  nowMs: number,
  rangeStartMs: number,
  cellWidth: number,
  viewRange: GanttViewRange
): number {
  return timeToPx(nowMs, rangeStartMs, cellWidth, viewRange)
}

export interface ApplyDragResult {
  left: number
  width: number
  /** Committed-preview start after snap. */
  start: Date
  /** Committed-preview end after snap (duration preserved on move). */
  end: Date
}

/**
 * Apply a pointer delta to a drag session with snap + clamps.
 * Snaps edges to the view grid; move keeps visual width. Returns {left,width,start,end}.
 */
export function applyDragDelta(
  session: Pick<GanttDragSession, 'type' | 'startLeft' | 'startWidth' | 'originalDurationMs'>,
  dx: number,
  cellWidth: number,
  viewRange: GanttViewRange,
  timelineWidthPx: number,
  rangeStartMs: number
): ApplyDragResult {
  const snap = cellWidth * snapFraction(viewRange)
  let left = session.startLeft
  let width = session.startWidth

  switch (session.type) {
    case 'move': {
      left = snapPx(session.startLeft + dx, cellWidth, viewRange)
      left = Math.max(0, Math.min(left, Math.max(0, timelineWidthPx - session.startWidth)))
      width = session.startWidth
      break
    }
    case 'resize-start': {
      const maxLeft = session.startLeft + session.startWidth - snap
      left = snapPx(session.startLeft + dx, cellWidth, viewRange)
      left = Math.max(0, Math.min(left, maxLeft))
      width = session.startWidth + (session.startLeft - left)
      break
    }
    case 'resize-end': {
      // Snap the trailing edge, not the width alone — keeps end on unit boundaries.
      const rawRight = session.startLeft + session.startWidth + dx
      const right = snapPx(rawRight, cellWidth, viewRange)
      const maxRight = timelineWidthPx
      const clampedRight = Math.max(session.startLeft + snap, Math.min(right, maxRight))
      width = clampedRight - session.startLeft
      break
    }
  }

  const { start, end } = datesFromLayout(left, width, rangeStartMs, cellWidth, viewRange, {
    type: session.type,
    preserveDurationMs: session.type === 'move' ? session.originalDurationMs : undefined,
  })

  return { left, width, start, end }
}

/**
 * Resolve committed dates from a final bar layout.
 * Move preserves original duration when provided. All views snap via {@link snapToUnit}.
 */
export function datesFromLayout(
  left: number,
  width: number,
  rangeStartMs: number,
  cellWidth: number,
  viewRange: GanttViewRange,
  options: { preserveDurationMs?: number; type?: GanttDragType } = {}
): { start: Date; end: Date } {
  let startMs = snapToUnit(pxToTime(left, rangeStartMs, cellWidth, viewRange), viewRange)
  let endMs: number

  if (options.type === 'move' && options.preserveDurationMs != null) {
    endMs = startMs + options.preserveDurationMs
  } else {
    endMs = snapToUnit(pxToTime(left + width, rangeStartMs, cellWidth, viewRange), viewRange)
  }

  const minSpan = snapDurationMs(viewRange)
  if (!(endMs > startMs)) {
    endMs = startMs + minSpan
  }

  return { start: new Date(startMs), end: new Date(endMs) }
}

/** Default extra columns mounted beyond the visible horizontal viewport. */
export const GANTT_COLUMN_OVERSCAN = 8

/** Visible column index window for horizontal virtualization. */
export interface GanttColumnWindow {
  /** Inclusive start index into the full columns array. */
  startIndex: number
  /** Exclusive end index into the full columns array. */
  endIndex: number
  /** Pixel offset of `startIndex` from the timeline origin (leading spacer). */
  offsetPx: number
}

/**
 * Compute which columns intersect the horizontal viewport (+ overscan).
 * Keeps full `columnCount` / total width for scroll + absolute bar math; only
 * header / grid / related column DOM should mount the returned slice.
 */
export function columnWindow(
  scrollLeft: number,
  viewportWidth: number,
  cellWidth: number,
  columnCount: number,
  overscan: number = GANTT_COLUMN_OVERSCAN
): GanttColumnWindow {
  if (columnCount <= 0 || cellWidth <= 0) {
    return { startIndex: 0, endIndex: 0, offsetPx: 0 }
  }
  const left = Number.isFinite(scrollLeft) ? Math.max(0, scrollLeft) : 0
  // Before the scroller measures, assume ~24 cells so we still mount something.
  const viewW =
    viewportWidth > 0 && Number.isFinite(viewportWidth) ? viewportWidth : cellWidth * 24
  const startIndex = Math.max(0, Math.floor(left / cellWidth) - overscan)
  const endIndex = Math.min(
    columnCount,
    Math.ceil((left + viewW) / cellWidth) + overscan
  )
  return {
    startIndex,
    endIndex,
    offsetPx: startIndex * cellWidth,
  }
}

/** Parent-band segment with absolute left for virtualized header rendering. */
export interface GanttParentBand {
  label: string
  left: number
  width: number
  key: string
}

/**
 * Collapse consecutive day cells into spanning parent-band segments.
 * `left` / `width` are absolute timeline pixels (full column set).
 */
export function parentBandsFromColumns(
  columns: readonly GanttColumn[],
  cellWidth: number
): GanttParentBand[] {
  const bands: GanttParentBand[] = []
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i]!
    if (col.parentLabel) {
      bands.push({
        label: col.parentLabel,
        left: i * cellWidth,
        width: cellWidth,
        key: `parent-${col.start.getTime()}-${i}`,
      })
    } else if (bands.length > 0) {
      bands[bands.length - 1]!.width += cellWidth
    }
  }
  return bands
}

/**
 * Parent bands that intersect a horizontal column window (for virtualized headers).
 */
export function parentBandsInWindow(
  bands: readonly GanttParentBand[],
  offsetPx: number,
  windowWidthPx: number
): GanttParentBand[] {
  if (bands.length === 0 || windowWidthPx <= 0) return []
  const right = offsetPx + windowWidthPx
  return bands.filter((band) => band.left < right && band.left + band.width > offsetPx)
}

/** Total timeline width for a column set. */
export function timelineWidth(columnCount: number, cellWidth: number): number {
  return columnCount * cellWidth
}

/** Derive range start/end ms from columns. */
export function rangeFromColumns(columns: GanttColumn[]): { startMs: number; endMs: number } {
  if (columns.length === 0) {
    const now = Date.now()
    return { startMs: now, endMs: now + MS_DAY }
  }
  return {
    startMs: columns[0]!.start.getTime(),
    endMs: columns[columns.length - 1]!.end.getTime(),
  }
}

/** Compact datetime label for bar hover / drag ends. */
export function formatGanttDateTime(ms: number, viewRange: GanttViewRange): string {
  if (!Number.isFinite(ms)) return ''
  const d = new Date(ms)
  const month = MONTH_SHORT[d.getMonth()]
  const day = String(d.getDate()).padStart(2, '0')
  if (viewRange === 'day') {
    const h = d.getHours()
    const m = String(d.getMinutes()).padStart(2, '0')
    const suffix = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${month} ${day} ${h12}:${m}${suffix}`
  }
  if (viewRange === 'quarter') {
    return `${month} ${day}`
  }
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${month} ${day} ${String(h).padStart(2, '0')}:${m}`
}

/**
 * Apply a live drag session onto a committed bar layout.
 * Used by bars, edge chips, and the dependency SVG so geometry tracks every pointer move.
 */
export function applyLiveDragLayout(
  layout: GanttBarLayout,
  itemId: string,
  drag: GanttDragSession | null,
  rangeStartMs: number,
  cellWidth: number,
  viewRange: GanttViewRange
): GanttBarLayout {
  if (!drag || drag.itemId !== itemId) return layout
  const { start, end } = datesFromLayout(drag.left, drag.width, rangeStartMs, cellWidth, viewRange, {
    type: drag.type,
    preserveDurationMs: drag.type === 'move' ? drag.originalDurationMs : undefined,
  })
  return {
    left: drag.left,
    width: drag.width,
    startMs: start.getTime(),
    endMs: end.getTime(),
  }
}

/**
 * Default create-strip range: one cell duration centered on a timeline pixel.
 * Snapped to the active view's snap quantum.
 */
export function createRangeFromPointer(
  pointerPx: number,
  rangeStartMs: number,
  cellWidth: number,
  viewRange: GanttViewRange
): { start: Date; end: Date; left: number; width: number } {
  const halfUnits = 0.5
  const centerMs = pxToTime(pointerPx, rangeStartMs, cellWidth, viewRange)
  let startMs = addCellUnits(centerMs, -halfUnits, viewRange)
  startMs = snapToUnit(startMs, viewRange)
  const endMs = addCellUnits(startMs, 1, viewRange)
  const left = timeToPx(startMs, rangeStartMs, cellWidth, viewRange)
  const width = Math.max(
    cellWidth * snapFraction(viewRange),
    timeToPx(endMs, rangeStartMs, cellWidth, viewRange) - left
  )
  return { start: new Date(startMs), end: new Date(endMs), left, width }
}

/**
 * Convert a viewport clientX/clientY into timeline content coordinates.
 * Formula: `client - containerRect + scrollLeft/Top`.
 * Prefer the scroll container (never sticky) so sticky strips/headers cannot skew rect.left.
 */
export function clientToTimelinePoint(
  clientX: number,
  clientY: number,
  scroller: HTMLElement,
  railWidthPx: number
): { x: number; y: number } {
  const rect = scroller.getBoundingClientRect()
  return {
    x: clientX - rect.left - railWidthPx + scroller.scrollLeft,
    y: clientY - rect.top + scroller.scrollTop,
  }
}

/** Edge band (px) that triggers autoscroll while dragging — matches Elixir Timeline.jsx. */
export const GANTT_EDGE_SCROLL_THRESHOLD = 50

/** Pixels to shift the scroller per autoscroll tick — matches Elixir Timeline.jsx. */
export const GANTT_EDGE_SCROLL_SPEED = 15

export interface AutoScrollNearEdgesOptions {
  /** Distance from each edge that triggers scroll. Default: {@link GANTT_EDGE_SCROLL_THRESHOLD}. */
  edgeThreshold?: number
  /** Scroll delta applied when the pointer is inside the edge band. Default: {@link GANTT_EDGE_SCROLL_SPEED}. */
  scrollSpeed?: number
  /** Allow horizontal autoscroll. Default: true. */
  horizontal?: boolean
  /** Allow vertical autoscroll. Default: true. */
  vertical?: boolean
}

export interface AutoScrollNearEdgesResult {
  /** Actual change in scrollLeft after clamping. */
  scrolledX: number
  /** Actual change in scrollTop after clamping. */
  scrolledY: number
}

/**
 * Whether the pointer sits inside the scroller's edge autoscroll bands.
 * Used to keep an rAF loop alive while the pointer is held near an edge.
 */
export function isNearScrollerEdge(
  scroller: HTMLElement,
  clientX: number,
  clientY: number,
  edgeThreshold: number = GANTT_EDGE_SCROLL_THRESHOLD
): boolean {
  const rect = scroller.getBoundingClientRect()
  const nearLeft = clientX < rect.left + edgeThreshold
  const nearRight = clientX > rect.right - edgeThreshold
  const nearTop = clientY < rect.top + edgeThreshold
  const nearBottom = clientY > rect.bottom - edgeThreshold
  return nearLeft || nearRight || nearTop || nearBottom
}

/**
 * Scroll a Gantt scroller when the pointer nears its edges (Elixir Timeline edgeThreshold).
 * Returns the actual scroll deltas so callers can keep bar preview / rubber-band in sync.
 */
export function autoScrollNearEdges(
  scroller: HTMLElement,
  clientX: number,
  clientY: number,
  options: AutoScrollNearEdgesOptions = {}
): AutoScrollNearEdgesResult {
  const edgeThreshold = options.edgeThreshold ?? GANTT_EDGE_SCROLL_THRESHOLD
  const scrollSpeed = options.scrollSpeed ?? GANTT_EDGE_SCROLL_SPEED
  const horizontal = options.horizontal ?? true
  const vertical = options.vertical ?? true
  const rect = scroller.getBoundingClientRect()

  let scrolledX = 0
  let scrolledY = 0

  if (vertical) {
    if (clientY < rect.top + edgeThreshold) {
      const before = scroller.scrollTop
      scroller.scrollTop = Math.max(0, before - scrollSpeed)
      scrolledY = scroller.scrollTop - before
    } else if (clientY > rect.bottom - edgeThreshold) {
      const before = scroller.scrollTop
      scroller.scrollTop = before + scrollSpeed
      scrolledY = scroller.scrollTop - before
    }
  }

  if (horizontal) {
    if (clientX < rect.left + edgeThreshold) {
      const before = scroller.scrollLeft
      scroller.scrollLeft = Math.max(0, before - scrollSpeed)
      scrolledX = scroller.scrollLeft - before
    } else if (clientX > rect.right - edgeThreshold) {
      const before = scroller.scrollLeft
      scroller.scrollLeft = before + scrollSpeed
      scrolledX = scroller.scrollLeft - before
    }
  }

  return { scrolledX, scrolledY }
}
