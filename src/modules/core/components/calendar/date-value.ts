export {
  dateKey,
  timeKey,
  sameDate,
  sameTime,
  sameDateTime,
  sameDateTimeValue,
  canonicalDate,
  canonicalTime,
  canonicalDateTime,
  parseDate,
  parseTime,
  clampTime,
  timeToMs,
  boundDate,
  boundTime,
  effectiveTimeBounds,
  toCalendarDate,
} from '../../hooks/use-date-time'

import React from 'react'
import { canonicalDate } from '../../hooks/use-date-time'
import type { DateValue } from '@internationalized/date'

/** Keeps a single CalendarDate instance for the same day. */
export function useStableDateValue<T extends DateValue | null | undefined>(value: T): T {
  if (value == null) return value
  return (canonicalDate(value) ?? value) as T
}

export function useStableDateRange<T extends { start: DateValue | null; end: DateValue | null } | null | undefined>(
  value: T
): T {
  if (!value) return value
  return {
    ...value,
    start: value.start ? canonicalDate(value.start) : null,
    end: value.end ? canonicalDate(value.end) : null,
  } as T
}

export function useStableDuration<T extends { years?: number; months?: number; weeks?: number; days?: number } | undefined>(
  value: T
): T {
  const ref = React.useRef(value)
  const prev = ref.current
  if (
    prev &&
    value &&
    prev.years === value.years &&
    prev.months === value.months &&
    prev.weeks === value.weeks &&
    prev.days === value.days
  ) {
    return prev
  }
  ref.current = value
  return value
}
