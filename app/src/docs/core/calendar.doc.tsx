import React, { useMemo, useState } from 'react'
import {
  Calendar,
  RangeCalendar,
  canonicalDate,
  todayLocal,
  type DateValue,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

function CalendarBoundsExample() {
  const { minValue, maxValue } = useMemo(() => {
    const now = todayLocal()
    return { minValue: now, maxValue: now.add({ days: 14 }) }
  }, [])
  return (
    <div className="flex justify-center p-4 border border-border rounded-xl bg-card">
      <Calendar aria-label="Booking window" minValue={minValue} maxValue={maxValue} showRemaining />
    </div>
  )
}

function CompoundCalendarExample() {
  const { minValue, maxValue } = useMemo(() => {
    const now = todayLocal()
    return { minValue: now, maxValue: now.add({ days: 21 }) }
  }, [])
  const [value, setValue] = useState(todayLocal().add({ days: 2 }))

  return (
    <div className="flex flex-col items-center gap-4 p-4 border border-border rounded-xl bg-card w-full max-w-sm mx-auto">
      <p className="text-sm text-fg">
        Selected:{' '}
        <span className="font-mono font-medium tabular-nums">
          {value ? `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}` : 'None'}
        </span>
      </p>
      <p className="text-xs text-muted-fg">
        Window {minValue.year}-{String(minValue.month).padStart(2, '0')}-{String(minValue.day).padStart(2, '0')}
        {' → '}
        {maxValue.year}-{String(maxValue.month).padStart(2, '0')}-{String(maxValue.day).padStart(2, '0')}
      </p>
      <Calendar
        aria-label="Event date"
        minValue={minValue}
        maxValue={maxValue}
        value={value}
        onChange={(next) => {
          const day = canonicalDate(next)
          if (day) setValue(day)
        }}
      >
        <Calendar.Header>
          <div className="flex min-w-0 items-center gap-1">
            <Calendar.MonthPicker />
            <Calendar.YearPicker />
          </div>
          <div className="flex items-center gap-1">
            <Calendar.NavButton slot="previous" />
            <Calendar.NavButton slot="next" />
          </div>
        </Calendar.Header>
        <Calendar.Grid>
          <Calendar.GridHeader>
            {(day: string) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
          </Calendar.GridHeader>
          <Calendar.GridBody>{(date: DateValue) => <Calendar.Cell date={date} />}</Calendar.GridBody>
        </Calendar.Grid>
      </Calendar>
    </div>
  )
}

export const calendarDoc: ComponentDocSpec = {
  id: 'calendar',
  name: 'Calendar',
  component: Calendar,
  summary: 'Accessible date grid with month/year dropdown pickers, multi-month range selection, and optical geometry.',
  subcomponents: [
    'RangeCalendar',
    'CalendarHeader',
    'CalendarHeading',
    'CalendarNavButton',
    'CalendarHeaderCell',
    'CalendarGridHeader',
    'CalendarGrid',
    'CalendarGridBody',
    'CalendarCell',
    'CalendarCellIndicator',
    'CalendarRemaining',
    'CalendarMonthPicker',
    'CalendarYearPicker',
  ],
  playground: {
    defaultProps: {
      isDisabled: false,
      isReadOnly: false,
    },
    controls: [
      { name: 'isDisabled', type: 'boolean' },
      { name: 'isReadOnly', type: 'boolean' },
    ],
    render: (props) => (
      <div className="flex justify-center p-4">
        <Calendar aria-label="Event date" {...props} />
      </div>
    ),
  },
  examples: [
    {
      title: 'Single Date Calendar',
      description: 'Standard single-date picker grid with month and year pickers and RTL-aware pagination.',
      render: () => (
        <div className="flex justify-center p-4 border border-border rounded-xl bg-card">
          <Calendar aria-label="Appointment date" />
        </div>
      ),
    },
    {
      title: 'Range Calendar',
      description: 'Multi-day span selection with start/end pill highlights and intermediate subtle ramp.',
      render: () => (
        <div className="flex justify-center p-4 border border-border rounded-xl bg-card">
          <RangeCalendar aria-label="Trip dates" />
        </div>
      ),
    },
    {
      title: 'Dual Month Range Calendar',
      description: 'Visible duration set to 2 months side-by-side for booking stays and scheduling intervals.',
      render: () => (
        <div className="flex justify-center p-4 border border-border rounded-xl bg-card overflow-x-auto">
          <RangeCalendar aria-label="Quarterly range" visibleDuration={{ months: 2 }} />
        </div>
      ),
    },
    {
      title: 'Compound composition',
      description:
        'Build the calendar tree with Calendar.* parts. Controlled value is shown above; minValue / maxValue clamp the selectable window.',
      render: () => <CompoundCalendarExample />,
    },
    {
      title: 'Min / max with remaining',
      description: 'Dates outside the window are disabled. Remaining counts down to maxValue. The today marker is Calendar.CellIndicator.',
      render: () => <CalendarBoundsExample />,
    },
  ],
}
