import { useCallback, useMemo, useRef } from 'react'
import {
  CalendarDate,
  Time,
  getLocalTimeZone,
  parseDate as parseIsoDate,
  toCalendarDate as toIntlCalendarDate,
  type DateValue,
} from '@internationalized/date'
import { useCallbackRef, useControllableState, type HeadlessHookReturn } from '../../../core/hooks'

export interface TimeObject {
  /** Hour value (0-23 in 24h format). */
  hour: number
  /** Minute value (0-59). */
  minute: number
  /** Optional second value (0-59). */
  second?: number
}

/* ==========================================================================
   Canonical date / time model
   ========================================================================== */

export interface DateTimeParts {
  /** Calendar day, or null when cleared. */
  date: CalendarDate | null
  /** Clock time, or null when not set. */
  time: TimeObject | null
}

export interface DateTimeRangeParts {
  /** Range start. */
  start: DateTimeParts
  /** Range end. */
  end: DateTimeParts
}

export type DateTimeValue = DateTimeParts | DateTimeRangeParts | null

/** Anything we accept as a day (distinct from the DateInput component). */
export type DateLike =
  | DateValue
  | Date
  | number
  | string
  | { year: number; month: number; day: number }
  | DateTimeParts
  | null
  | undefined

/** Anything we accept as a clock time (distinct from the TimeInput component). */
export type TimeLike =
  | TimeObject
  | Time
  | Date
  | DateValue
  | string
  | { hour: number; minute?: number; second?: number }
  | DateTimeParts
  | null
  | undefined

/** Inclusive bound: a day, a date+time, or a raw date input. */
export type DateTimeBound = DateLike | DateTimeParts | null | undefined

const dateCache = new Map<string, CalendarDate>()
const timeCache = new Map<string, TimeObject>()

/** Stable key for a calendar day. */
export function dateKey(value?: DateValue | null): string {
  if (!value) return ''
  const calendarId = 'calendar' in value && value.calendar ? value.calendar.identifier : ''
  return `${calendarId}:${value.year}-${value.month}-${value.day}`
}

/** Stable key for a clock time. */
export function timeKey(value?: TimeObject | null): string {
  if (!value) return ''
  return `${value.hour}:${value.minute}:${value.second ?? 0}`
}

export function sameDate(a?: DateValue | null, b?: DateValue | null): boolean {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  return a.compare(b) === 0
}

export function sameTime(a?: TimeObject | null, b?: TimeObject | null): boolean {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  return a.hour === b.hour && a.minute === b.minute && (a.second ?? 0) === (b.second ?? 0)
}

export function sameDateTime(a?: DateTimeParts | null, b?: DateTimeParts | null): boolean {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  return sameDate(a.date, b.date) && sameTime(a.time, b.time)
}

export function sameDateTimeValue(a: DateTimeValue, b: DateTimeValue): boolean {
  if (a === b) return true
  if (!a || !b) return false
  if (isRangeValue(a) && isRangeValue(b)) {
    return sameDateTime(a.start, b.start) && sameDateTime(a.end, b.end)
  }
  if (!isRangeValue(a) && !isRangeValue(b)) {
    return sameDateTime(a, b)
  }
  return false
}

export function isRangeValue(value: DateTimeValue): value is DateTimeRangeParts {
  return Boolean(value && typeof value === 'object' && 'start' in value && 'end' in value)
}

export function isDateTimeParts(value: unknown): value is DateTimeParts {
  return Boolean(value && typeof value === 'object' && 'date' in value && !('start' in value))
}

/** Returns the one shared CalendarDate instance for that day. */
export function canonicalDate(input?: DateLike): CalendarDate | null {
  const parsed = parseDate(input)
  if (!parsed) return null
  const key = dateKey(parsed)
  const cached = dateCache.get(key)
  if (cached) return cached
  dateCache.set(key, parsed)
  return parsed
}

/** Returns the one shared TimeObject instance for that clock time. */
export function canonicalTime(input?: TimeLike): TimeObject | null {
  const parsed = parseTime(input)
  if (!parsed) return null
  const key = timeKey(parsed)
  const cached = timeCache.get(key)
  if (cached) return cached
  timeCache.set(key, parsed)
  return parsed
}

export function canonicalDateTime(input?: DateTimeBound | DateTimeValue): DateTimeParts {
  if (isRangeValue((input ?? null) as DateTimeValue)) {
    return { date: null, time: null }
  }
  return {
    date: canonicalDate(input as DateLike),
    time: canonicalTime(input as TimeLike),
  }
}

export function parseDate(input?: DateLike): CalendarDate | null {
  if (input == null) return null

  if (isDateTimeParts(input)) {
    return parseDate(input.date)
  }

  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return null
    return new CalendarDate(input.getFullYear(), input.getMonth() + 1, input.getDate())
  }

  if (typeof input === 'number') {
    return parseDate(new Date(input))
  }

  if (typeof input === 'string') {
    const trimmed = input.trim()
    if (!trimmed) return null
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return parseIsoDate(trimmed)
      }
      return parseDate(new Date(trimmed))
    } catch {
      return null
    }
  }

  if (typeof input === 'object' && 'year' in input && 'month' in input && 'day' in input) {
    try {
      if ('calendar' in input && input.calendar) {
        return toIntlCalendarDate(input as DateValue)
      }
      return new CalendarDate(input.year, input.month, input.day)
    } catch {
      return null
    }
  }

  return null
}

export function parseTime(input?: TimeLike): TimeObject | null {
  if (input == null) return null

  if (isDateTimeParts(input)) {
    return parseTime(input.time)
  }

  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return null
    return {
      hour: input.getHours(),
      minute: input.getMinutes(),
      second: input.getSeconds(),
    }
  }

  if (typeof input === 'string') {
    const match = input.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/)
    if (!match) return null
    return {
      hour: Number(match[1]),
      minute: Number(match[2]),
      second: match[3] ? Number(match[3]) : 0,
    }
  }

  if (typeof input === 'object' && 'hour' in input && typeof (input as TimeObject).hour === 'number') {
    const hour = (input as TimeObject).hour
    const minute = 'minute' in input && typeof (input as { minute?: number }).minute === 'number'
      ? (input as TimeObject).minute
      : 0
    const second = 'second' in input && typeof (input as { second?: number }).second === 'number'
      ? ((input as TimeObject).second ?? 0)
      : 0
    return { hour, minute, second }
  }

  return null
}

export function timeToMs(time: TimeObject): number {
  return ((time.hour * 60 + time.minute) * 60 + (time.second ?? 0)) * 1000
}

export function clampTime(
  time: TimeObject,
  minTime?: TimeObject | null,
  maxTime?: TimeObject | null
): TimeObject {
  const current = timeToMs(time)
  if (minTime && current < timeToMs(minTime)) return canonicalTime(minTime) ?? time
  if (maxTime && current > timeToMs(maxTime)) return canonicalTime(maxTime) ?? time
  return canonicalTime(time) ?? time
}

export function boundDate(value?: DateTimeBound): CalendarDate | null {
  return canonicalDate(value as DateLike)
}

export function boundTime(value?: DateTimeBound | TimeLike): TimeObject | null {
  return canonicalTime(value as TimeLike)
}

export function effectiveTimeBounds(
  date: CalendarDate | null | undefined,
  minValue?: DateTimeBound,
  maxValue?: DateTimeBound,
  minTime?: TimeLike,
  maxTime?: TimeLike
): { minTime: TimeObject | null; maxTime: TimeObject | null } {
  const minD = boundDate(minValue)
  const maxD = boundDate(maxValue)
  let lo = canonicalTime(minTime) ?? boundTime(minValue)
  let hi = canonicalTime(maxTime) ?? boundTime(maxValue)
  if (date && minD && date.compare(minD) > 0) lo = null
  if (date && maxD && date.compare(maxD) < 0) hi = null
  return { minTime: lo, maxTime: hi }
}

/* ==========================================================================
   Headless hook
   ========================================================================== */

export interface UseDateTimeOptions {
  /** Controlled value. */
  value?: DateTimeValue
  /** Uncontrolled initial value. */
  defaultValue?: DateTimeValue
  /** Called when the canonical value changes. */
  onChange?: (value: DateTimeValue) => void
  /** Select a start/end pair instead of a single instant. */
  range?: boolean
  /** Inclusive minimum day or date+time. */
  minValue?: DateTimeBound
  /** Inclusive maximum day or date+time. */
  maxValue?: DateTimeBound
  /** Inclusive minimum clock time. */
  minTime?: TimeLike
  /** Inclusive maximum clock time. */
  maxTime?: TimeLike
  /** Time applied when a date is chosen and none is stored yet. */
  defaultTime?: TimeLike
  /** Range start time applied when none is stored yet. */
  defaultStartTime?: TimeLike
  /** Range end time applied when none is stored yet. */
  defaultEndTime?: TimeLike
}

export interface DateTimeState {
  /** Canonical selected value. */
  value: DateTimeValue
  /** Single-mode date (null when empty or range). */
  date: CalendarDate | null
  /** Single-mode time. */
  time: TimeObject | null
  /** Range start. */
  start: DateTimeParts | null
  /** Range end. */
  end: DateTimeParts | null
  /** Canonical min day. */
  minDate: CalendarDate | null
  /** Canonical max day. */
  maxDate: CalendarDate | null
  /** Canonical min clock (unbounded days). */
  minTime: TimeObject | null
  /** Canonical max clock (unbounded days). */
  maxTime: TimeObject | null
  /** Whether range mode is active. */
  range: boolean
}

export type DateTimeActions = {
  /** Replace the whole value. */
  setValue: (value: DateTimeValue) => void
  /** Set the single-mode (or range-start) date. */
  setDate: (date: DateLike) => void
  /** Set the single-mode time. */
  setTime: (time: TimeLike) => void
  /** Set both ends of a range. */
  setRange: (range: { start: DateLike; end: DateLike } | null) => void
  /** Clear the selection. */
  clear: () => void
}

export interface DateTimeHelpers {
  /** True when a date (or both range ends) is set. */
  hasDate: boolean
  /** True when the current value sits inside min/max. */
  isInRange: boolean
  /** Day compare. */
  sameDate: typeof sameDate
  /** Clock compare. */
  sameTime: typeof sameTime
  /** Props to spread onto Calendar (always controlled). */
  calendarProps: {
    value: CalendarDate | null
    minValue: CalendarDate | undefined
    maxValue: CalendarDate | undefined
    onChange: (date: DateValue | null) => void
  }
  /** Props to spread onto RangeCalendar (always controlled). */
  rangeCalendarProps: {
    value: { start: CalendarDate; end: CalendarDate } | null
    minValue: CalendarDate | undefined
    maxValue: CalendarDate | undefined
    onChange: (range: { start: DateValue; end: DateValue } | null) => void
  }
}

export interface DateTimeAriaProps {
  /** Human-readable selected value. */
  'aria-valuetext': string
}

export type UseDateTimeReturn = HeadlessHookReturn<
  DateTimeState,
  DateTimeActions,
  DateTimeHelpers,
  DateTimeAriaProps
>

function normalizeValue(value: DateTimeValue, range: boolean): DateTimeValue {
  if (!value) return null
  if (range) {
    if (!isRangeValue(value)) return null
    return {
      start: {
        date: canonicalDate(value.start.date),
        time: canonicalTime(value.start.time),
      },
      end: {
        date: canonicalDate(value.end.date),
        time: canonicalTime(value.end.time),
      },
    }
  }
  if (isRangeValue(value)) return null
  return {
    date: canonicalDate(value.date),
    time: canonicalTime(value.time),
  }
}

function formatParts(parts: DateTimeParts | null): string {
  if (!parts?.date) return ''
  const date = `${parts.date.year}-${String(parts.date.month).padStart(2, '0')}-${String(parts.date.day).padStart(2, '0')}`
  if (!parts.time) return date
  return `${date} ${String(parts.time.hour).padStart(2, '0')}:${String(parts.time.minute).padStart(2, '0')}`
}

export function useDateTime(options: UseDateTimeOptions = {}): UseDateTimeReturn {
  const range = Boolean(options.range)
  const emit = useCallbackRef(options.onChange)

  const minDate = canonicalDate(options.minValue as DateLike)
  const maxDate = canonicalDate(options.maxValue as DateLike)
  const minTime = canonicalTime(options.minTime)
  const maxTime = canonicalTime(options.maxTime)

  const [value, setRawValue] = useControllableState<DateTimeValue>({
    prop: options.value !== undefined ? normalizeValue(options.value, range) : undefined,
    defaultProp: normalizeValue(options.defaultValue ?? null, range),
    onChange: (next) => {
      const canon = normalizeValue(next, range)
      emit(canon)
    },
  })

  const canonValue = normalizeValue(value, range)
  const canonValueRef = useRef(canonValue)
  canonValueRef.current = canonValue

  const commit = useCallback((next: DateTimeValue) => {
    const canon = normalizeValue(next, range)
    if (sameDateTimeValue(canonValueRef.current, canon)) return
    canonValueRef.current = canon
    setRawValue(canon)
  }, [range, setRawValue])

  const single = !range && canonValue && !isRangeValue(canonValue) ? canonValue : null
  const span = range && isRangeValue(canonValue) ? canonValue : null

  const setDate = useCallback((input: DateLike) => {
    const date = canonicalDate(input)
    if (!date) {
      commit(null)
      return
    }
    if (minDate && date.compare(minDate) < 0) return
    if (maxDate && date.compare(maxDate) > 0) return
    const current = canonValueRef.current
    const singleCurrent =
      current && !isRangeValue(current) ? current : null
    const bounds = effectiveTimeBounds(date, options.minValue, options.maxValue, minTime, maxTime)
    const time = clampTime(
      singleCurrent?.time ?? canonicalTime(options.defaultTime) ?? { hour: 0, minute: 0, second: 0 },
      bounds.minTime,
      bounds.maxTime
    )
    commit({ date, time })
  }, [commit, minDate, maxDate, minTime, maxTime, options.minValue, options.maxValue, options.defaultTime])

  const setTime = useCallback((input: TimeLike) => {
    const time = canonicalTime(input)
    if (!time) return
    const current = canonValueRef.current
    const singleCurrent =
      current && !isRangeValue(current) ? current : null
    const date = singleCurrent?.date ?? null
    const bounds = effectiveTimeBounds(date, options.minValue, options.maxValue, minTime, maxTime)
    commit({
      date,
      time: clampTime(time, bounds.minTime, bounds.maxTime),
    })
  }, [commit, minTime, maxTime, options.minValue, options.maxValue])

  const setRange = useCallback((next: { start: DateLike; end: DateLike } | null) => {
    if (!next?.start || !next.end) return
    const startDate = canonicalDate(next.start)
    const endDate = canonicalDate(next.end)
    if (!startDate || !endDate) return
    if (minDate && startDate.compare(minDate) < 0) return
    if (maxDate && endDate.compare(maxDate) > 0) return
    const current = canonValueRef.current
    const spanCurrent = current && isRangeValue(current) ? current : null
    const startBounds = effectiveTimeBounds(startDate, options.minValue, options.maxValue, minTime, maxTime)
    const endBounds = effectiveTimeBounds(endDate, options.minValue, options.maxValue, minTime, maxTime)
    commit({
      start: {
        date: startDate,
        time: clampTime(
          spanCurrent?.start.time ?? canonicalTime(options.defaultStartTime) ?? { hour: 0, minute: 0, second: 0 },
          startBounds.minTime,
          startBounds.maxTime
        ),
      },
      end: {
        date: endDate,
        time: clampTime(
          spanCurrent?.end.time ?? canonicalTime(options.defaultEndTime) ?? { hour: 0, minute: 0, second: 0 },
          endBounds.minTime,
          endBounds.maxTime
        ),
      },
    })
  }, [
    commit,
    minDate,
    maxDate,
    minTime,
    maxTime,
    options.minValue,
    options.maxValue,
    options.defaultStartTime,
    options.defaultEndTime,
  ])

  const calendarProps = useMemo(
    () => ({
      value: single?.date ?? null,
      minValue: minDate ?? undefined,
      maxValue: maxDate ?? undefined,
      onChange: (date: DateValue | null) => setDate(date),
    }),
    [single?.date, minDate, maxDate, setDate]
  )

  const rangeCalendarProps = useMemo(
    () => ({
      value:
        span?.start.date && span.end.date
          ? { start: span.start.date, end: span.end.date }
          : null,
      minValue: minDate ?? undefined,
      maxValue: maxDate ?? undefined,
      onChange: (next: { start: DateValue; end: DateValue } | null) => setRange(next),
    }),
    [span?.start.date, span?.end.date, minDate, maxDate, setRange]
  )

  const ariaText = useMemo(() => {
    if (span) {
      const start = formatParts(span.start)
      const end = formatParts(span.end)
      return start && end ? `${start} → ${end}` : start || end
    }
    return formatParts(single)
  }, [single, span])

  return {
    state: {
      value: canonValue,
      date: single?.date ?? null,
      time: single?.time ?? null,
      start: span?.start ?? null,
      end: span?.end ?? null,
      minDate,
      maxDate,
      minTime,
      maxTime,
      range,
    },
    actions: {
      setValue: commit,
      setDate,
      setTime,
      setRange,
      clear: () => commit(null),
    },
    helpers: {
      hasDate: Boolean(single?.date || (span?.start.date && span?.end.date)),
      isInRange: (() => {
        const day = single?.date ?? span?.start.date
        if (!day) return true
        if (minDate && day.compare(minDate) < 0) return false
        if (maxDate && (span?.end.date ?? day).compare(maxDate) > 0) return false
        return true
      })(),
      sameDate,
      sameTime,
      calendarProps,
      rangeCalendarProps,
    },
    ariaProps: {
      'aria-valuetext': ariaText,
    },
  }
}

/** @deprecated Prefer `canonicalDate`. */
export function toCalendarDate(value: DateValue): CalendarDate {
  return canonicalDate(value) ?? new CalendarDate(value.year, value.month, value.day)
}
