import React, { useMemo, useState } from 'react'
import {
  DateTime,
  DateTimePicker,
  DateTimeContent,
  todayLocal,
  type CalendarCellIndicatorProps,
  type CalendarRemainingProps,
  type DateTimePickerValue,
  type DateTimePreset,
} from '@consona/interface'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'
import type { ComponentDocSpec } from '../types'

function DateTimeBoundsExample() {
  const [val, setVal] = useState<DateTimePickerValue>(null)
  const bounds = useMemo(() => {
    const now = todayLocal()
    return {
      minValue: { date: now, time: { hour: 9, minute: 0, second: 0 } },
      maxValue: { date: now.add({ days: 7 }), time: { hour: 17, minute: 0, second: 0 } },
      minTime: { hour: 9, minute: 0, second: 0 },
      maxTime: { hour: 17, minute: 0, second: 0 },
    }
  }, [])
  return (
    <div className="flex justify-center p-4 w-full max-w-xs mx-auto">
      <DateTime
        label="Office hours"
        description="Today through next week, 09:00–17:00"
        value={val}
        onChange={setVal}
        minValue={bounds.minValue}
        maxValue={bounds.maxValue}
        minTime={bounds.minTime}
        maxTime={bounds.maxTime}
        showRemaining
        showTime
        clearable
      />
    </div>
  )
}

/* ==========================================================================
   Slot overrides — instance-level chrome, design tokens only
   ========================================================================== */

function HairlineTodayMark({
  isToday,
  isSelected,
  className,
  ...props
}: CalendarCellIndicatorProps) {
  if (!isToday) return null
  return (
    <span
      aria-hidden
      className={[
        'pointer-events-none absolute inset-x-2.5 bottom-1 h-px rounded-full bg-fg/55',
        isSelected ? 'bg-primary-fg/80' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}

function WindowRemaining({ remaining, className, ...props }: CalendarRemainingProps) {
  if (!remaining) return null
  const detail =
    remaining.days > 0
      ? `${remaining.days}d ${remaining.hours}h remaining`
      : remaining.hours > 0
        ? `${remaining.hours}h ${remaining.minutes}m remaining`
        : remaining.label
  return (
    <p
      className={[
        'mt-1.5 text-center text-[11px] font-medium tracking-wide text-muted-fg tabular-nums',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      Window closes · {detail}
    </p>
  )
}

function DateFieldIcon(props: React.SVGProps<SVGSVGElement>) {
  return <CalendarDaysIcon data-slot="icon" className="size-4 shrink-0 text-muted-fg" {...props} />
}

function SlotsDateTimeExample() {
  const [val, setVal] = useState<DateTimePickerValue>(null)
  const bounds = useMemo(() => {
    const now = todayLocal()
    return {
      minValue: { date: now, time: { hour: 8, minute: 0 } },
      maxValue: { date: now.add({ days: 10 }), time: { hour: 18, minute: 0 } },
    }
  }, [])

  return (
    <div className="flex justify-center p-4 w-full max-w-sm mx-auto">
      <DateTime
        label="Publish window"
        description="Slots swap the today mark, remaining caption, and leading icon — same field chrome."
        value={val}
        onChange={setVal}
        minValue={bounds.minValue}
        maxValue={bounds.maxValue}
        showTime
        showDayName
        showRemaining
        clearable
        minuteStep={15}
        slots={{
          icon: DateFieldIcon,
          cellIndicator: HairlineTodayMark,
          remaining: WindowRemaining,
        }}
        slotProps={{
          label: { className: 'text-[11px] uppercase tracking-[0.08em] text-muted-fg font-semibold' },
          description: { className: 'text-xs text-muted-fg leading-relaxed' },
          trigger: {
            className: 'rounded-base border-border bg-bg hover:bg-secondary/30',
          },
        }}
      />
    </div>
  )
}

/* ==========================================================================
   .extend() — baked release scheduler with quarter-hour presets
   ========================================================================== */

function buildReleasePresets(): DateTimePreset[] {
  const today = todayLocal()
  const tomorrow = today.add({ days: 1 })
  const nextMonday = (() => {
    const dow = today.toDate('UTC').getUTCDay()
    const daysUntil = ((1 - dow + 7) % 7) || 7
    return today.add({ days: daysUntil })
  })()

  return [
    {
      id: 'today-10',
      label: 'Today · 10:00',
      getValue: () => ({
        date: today,
        time: { hour: 10, minute: 0, second: 0 },
      }),
    },
    {
      id: 'tomorrow-14',
      label: 'Tomorrow · 14:00',
      getValue: () => ({
        date: tomorrow,
        time: { hour: 14, minute: 0, second: 0 },
      }),
    },
    {
      id: 'monday-09',
      label: 'Mon · 09:00',
      getValue: () => ({
        date: nextMonday,
        time: { hour: 9, minute: 0, second: 0 },
      }),
    },
  ]
}

const ReleaseWindowField = DateTime.extend({
  name: 'ReleaseWindowField',
  props: {
    showTime: true,
    showDayName: true,
    showPresets: true,
    showRemaining: true,
    clearable: true,
    minuteStep: 15,
    is24Hour: true,
    placeholder: 'Select release moment…',
    customPresets: buildReleasePresets(),
    slotProps: {
      label: {
        className: 'text-[11px] uppercase tracking-[0.08em] text-muted-fg font-semibold',
      },
      trigger: {
        className: 'rounded-base font-mono text-[13px] tracking-tight',
      },
    },
  },
  slots: {
    icon: DateFieldIcon,
    cellIndicator: HairlineTodayMark,
    remaining: WindowRemaining,
  },
})

function ExtendDateTimeExample() {
  const [val, setVal] = useState<DateTimePickerValue>(null)
  const bounds = useMemo(() => {
    const now = todayLocal()
    return {
      minValue: { date: now, time: { hour: 9, minute: 0 } },
      maxValue: { date: now.add({ days: 14 }), time: { hour: 17, minute: 0 } },
      minTime: { hour: 9, minute: 0 },
      maxTime: { hour: 17, minute: 0 },
    }
  }, [])

  return (
    <div className="flex justify-center p-4 w-full max-w-sm mx-auto">
      <ReleaseWindowField
        label="Release moment"
        description="Extended field: 15-minute grid, 24h display, and baked Today / Tomorrow / Monday presets."
        value={val}
        onChange={setVal}
        minValue={bounds.minValue}
        maxValue={bounds.maxValue}
        minTime={bounds.minTime}
        maxTime={bounds.maxTime}
      />
    </div>
  )
}

export const dateTimePickerDoc: ComponentDocSpec = {
  id: 'date-time-picker',
  name: 'DateTimePicker',
  component: DateTimePicker,
  summary: 'High-precision composite picker composing Calendar, 3D TimeWheel, Presets, and action footer, with DateTime input field wrapper.',
  subcomponents: ['DateTime', 'DateTimeContent', 'InteractiveTimeWheel', 'DrumColumn'],
  playground: {
    defaultProps: {
      range: false,
      showTime: true,
      showPresets: true,
      is24Hour: false,
      showSeconds: false,
    },
    controls: [
      { name: 'range', type: 'boolean' },
      { name: 'showTime', type: 'boolean' },
      { name: 'showPresets', type: 'boolean' },
      { name: 'is24Hour', type: 'boolean' },
      { name: 'showSeconds', type: 'boolean' },
    ],
    render: (props) => {
      const [val, setVal] = useState<DateTimePickerValue>(null)
      return (
        <div className="flex flex-col items-center gap-6 p-4 w-full max-w-md mx-auto">
          <DateTime
            label="Schedule Meeting"
            description="Select your preferred date and time slot"
            value={val}
            onChange={setVal}
            clearable
            {...props}
          />
        </div>
      )
    },
  },
  examples: [
    {
      title: 'DateTime Input Field (Single Date & Time)',
      description: 'Complete form field control with popover popup, clear button, and formatted value display.',
      render: () => {
        const [val, setVal] = useState<DateTimePickerValue>(null)
        return (
          <div className="flex justify-center p-4 w-full max-w-xs mx-auto">
            <DateTime
              label="Event Date & Time"
              description="Click trigger to open the picker popup"
              value={val}
              onChange={setVal}
              range={false}
              showTime
              showDayName
              clearable
            />
          </div>
        )
      },
    },
    {
      title: 'DateTime Range Field (Start & End Time)',
      description: 'Range picker field with arrow transition indicators and synced/independent start & end time selection.',
      render: () => {
        const [val, setVal] = useState<DateTimePickerValue>(null)
        return (
          <div className="flex justify-center p-4 w-full max-w-md mx-auto">
            <DateTime
              label="Reservation Span"
              description="Pick booking start and return date/time"
              value={val}
              onChange={setVal}
              range
              showTime
              showDayName
              clearable
            />
          </div>
        )
      },
    },
    {
      title: 'Direct DateTimeContent Panel',
      description: 'Embedded picker panel featuring quick presets, calendar day selection, and interactive time wheel.',
      render: () => {
        const [val, setVal] = useState<DateTimePickerValue>(null)
        return (
          <div className="flex justify-center p-4">
            <DateTimeContent
              value={val}
              onChange={setVal}
              range={false}
              showTime
              showPresets
            />
          </div>
        )
      },
    },
    {
      title: 'Min / max date-time with remaining',
      description: 'Windowed booking: dates and times clamp to min/max, with a remaining countdown on the calendar and wheel.',
      render: () => <DateTimeBoundsExample />,
    },
    {
      title: 'Instance slots',
      description:
        'Override icon, today mark, and remaining caption on one DateTime — no factory. Uses design tokens only.',
      render: () => <SlotsDateTimeExample />,
    },
    {
      title: 'Release window via DateTime.extend()',
      description:
        'Reusable ReleaseWindowField: 15-minute steps, 24h display, hairline today mark, and baked Today / Tomorrow / Monday presets.',
      render: () => <ExtendDateTimeExample />,
    },
  ],
  recipes: [
    {
      title: 'DateTime.extend() release scheduler',
      description: 'Ship a product-specific field without forking the picker.',
      code: `import { DateTime, todayLocal, type DateTimePreset } from '@consona/interface'

const ReleaseWindowField = DateTime.extend({
  name: 'ReleaseWindowField',
  props: {
    minuteStep: 15,
    is24Hour: true,
    showPresets: true,
    showRemaining: true,
    customPresets: [/* Today 10:00, Tomorrow 14:00, Mon 09:00 */],
  },
  slots: {
    cellIndicator: HairlineTodayMark,
    remaining: WindowRemaining,
  },
})`,
    },
  ],
}
