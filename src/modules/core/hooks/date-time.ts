/**
 * Public date / time surface for @consona/interface.
 *
 * Downstream apps should import from here — not from `@internationalized/date`.
 * Prefer `todayLocal` / `nowLocal` / `createDate` / `createTime` for everyday use.
 */

import {
  CalendarDate,
  Time,
  getLocalTimeZone,
  now as intlNow,
  today as intlToday,
} from '@internationalized/date'

export {
  CalendarDate,
  CalendarDateTime,
  Time,
  ZonedDateTime,
  GregorianCalendar,
  createCalendar,
  DateFormatter,
  getLocalTimeZone,
  setLocalTimeZone,
  resetLocalTimeZone,
  today,
  now,
  isToday,
  isSameDay,
  isSameMonth,
  isSameYear,
  isEqualDay,
  isEqualMonth,
  isEqualYear,
  isWeekend,
  isWeekday,
  getDayOfWeek,
  getHoursInDay,
  getWeeksInMonth,
  startOfMonth,
  startOfWeek,
  startOfYear,
  endOfMonth,
  endOfWeek,
  endOfYear,
  minDate,
  maxDate,
  toCalendarDateTime,
  toTime,
  toCalendar,
  toZoned,
  toTimeZone,
  toLocalTimeZone,
  fromDate,
  fromDateToLocal,
  fromAbsolute,
  parseDateTime as parseIsoDateTime,
  parseAbsolute,
  parseAbsoluteToLocal,
  parseZonedDateTime,
  parseDuration,
  parseDate as parseIsoDate,
  parseTime as parseIsoTime,
  toCalendarDate as toIntlCalendarDate,
} from '@internationalized/date'

export type {
  DateValue,
  AnyCalendarDate,
  AnyTime,
  AnyDateTime,
  CalendarIdentifier,
  DateDuration,
  TimeDuration,
  DateTimeDuration,
  DateFields,
  TimeFields,
  Disambiguation,
  CycleOptions,
  CycleTimeOptions,
  DayOfWeek,
} from '@internationalized/date'

/** Internationalized calendar system (Gregorian, Hebrew, …). Named to avoid clashing with the Calendar component. */
export type { Calendar as CalendarSystem } from '@internationalized/date'
/** Intl date field key (`'year' | 'month' | …`). Named to avoid clashing with the DateField component. */
export type { DateField as DateFieldKey } from '@internationalized/date'
/** Intl time field key (`'hour' | 'minute' | …`). Named to avoid clashing with the TimeField component. */
export type { TimeField as TimeFieldKey } from '@internationalized/date'

/** Today's calendar date in the local timezone. Prefer this over `today(getLocalTimeZone())`. */
export function todayLocal(): CalendarDate {
  return intlToday(getLocalTimeZone())
}

/** Current zoned datetime in the local timezone. Prefer this over `now(getLocalTimeZone())`. */
export function nowLocal() {
  return intlNow(getLocalTimeZone())
}

/** Build a canonical calendar day without touching `@internationalized/date`. */
export function createDate(year: number, month: number, day: number): CalendarDate {
  return new CalendarDate(year, month, day)
}

/** Build an internationalized `Time` value for TimeField / TimeWheel min/max. */
export function createTime(hour: number, minute: number = 0, second: number = 0, millisecond: number = 0): Time {
  return new Time(hour, minute, second, millisecond)
}

export {
  useDateTime,
  parseDate,
  parseTime,
  canonicalDate,
  canonicalTime,
  canonicalDateTime,
  dateKey,
  timeKey,
  sameDate,
  sameTime,
  sameDateTime,
  sameDateTimeValue,
  isRangeValue,
  isDateTimeParts,
  clampTime,
  timeToMs,
  boundDate,
  boundTime,
  effectiveTimeBounds,
  toCalendarDate,
} from './use-date-time'

export type {
  TimeObject,
  DateTimeParts,
  DateTimeRangeParts,
  DateTimeValue,
  DateLike,
  TimeLike,
  DateTimeBound,
  UseDateTimeOptions,
  UseDateTimeReturn,
  DateTimeState,
  DateTimeActions,
  DateTimeHelpers,
  DateTimeAriaProps,
} from './use-date-time'
