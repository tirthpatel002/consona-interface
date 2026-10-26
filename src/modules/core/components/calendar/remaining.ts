import {
  getLocalTimeZone,
  today,
  type DateValue,
} from '@internationalized/date'
import type { TimeObject } from '../../hooks/use-date-time'
import { timeToMs } from '../../hooks/use-date-time'

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

export interface RemainingParts {
  /** Remaining duration in milliseconds. */
  totalMs: number
  /** Whole days remaining. */
  days: number
  /** Remaining hours after days. */
  hours: number
  /** Remaining minutes after hours. */
  minutes: number
  /** Remaining seconds after minutes. */
  seconds: number
  /** Human label such as "12 days remaining". */
  label: string
}

function plural(count: number, singular: string, pluralForm: string = `${singular}s`): string {
  return count === 1 ? singular : pluralForm
}

/** Formats a non-negative millisecond duration into a remaining label. */
export function formatRemaining(totalMs: number): RemainingParts | null {
  if (!Number.isFinite(totalMs) || totalMs < 0) return null

  const days = Math.floor(totalMs / DAY_MS)
  const hours = Math.floor((totalMs % DAY_MS) / HOUR_MS)
  const minutes = Math.floor((totalMs % HOUR_MS) / MINUTE_MS)
  const seconds = Math.floor((totalMs % MINUTE_MS) / 1000)

  let label: string
  if (days > 0) {
    label = `${days} ${plural(days, 'day')} remaining`
  } else if (hours > 0) {
    label = `${hours} ${plural(hours, 'hour')} remaining`
  } else if (minutes > 0) {
    label = `${minutes} ${plural(minutes, 'minute')} remaining`
  } else {
    label = '0 remaining'
  }

  return { totalMs, days, hours, minutes, seconds, label }
}

/** Remaining calendar time from `from` (default today) until `until`. */
export function remainingUntilDate(
  until: DateValue | null | undefined,
  from: DateValue = today(getLocalTimeZone())
): RemainingParts | null {
  if (!until) return null
  const tz = getLocalTimeZone()
  return formatRemaining(until.toDate(tz).getTime() - from.toDate(tz).getTime())
}

/** Remaining wall-clock time between two JS dates. */
export function remainingUntilDateTime(until: Date, from: Date = new Date()): RemainingParts | null {
  return formatRemaining(until.getTime() - from.getTime())
}

/** Remaining time-of-day from `from` until `until`. */
export function remainingUntilTime(
  until: TimeObject | null | undefined,
  from: TimeObject
): RemainingParts | null {
  if (!until) return null
  return formatRemaining(timeToMs(until) - timeToMs(from))
}
