import React, { useMemo } from 'react'
import {
  DatePicker,
  DatePickerTrigger,
  DateRangePicker,
  DateRangePickerTrigger,
  DateField,
  DateInput,
  DateTime,
  todayLocal,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

function DatePickerBoundsExample() {
  const { minValue, maxValue } = useMemo(() => {
    const now = todayLocal()
    return { minValue: now, maxValue: now.add({ days: 10 }) }
  }, [])
  return (
    <div className="w-full max-w-xs flex flex-col gap-2">
      <label className="text-xs font-semibold text-fg">Book by</label>
      <DatePicker aria-label="Book by" minValue={minValue} maxValue={maxValue} showRemaining>
        <DatePickerTrigger />
      </DatePicker>
    </div>
  )
}

export const datePickerDoc: ComponentDocSpec = {
  id: 'date-picker',
  name: 'DatePicker',
  component: DatePicker,
  summary: 'Segmented date input field paired with popover calendar, range spans, and quick format presets.',
  subcomponents: [
    'DateRangePicker',
    'DatePickerTrigger',
    'DateRangePickerTrigger',
    'DateField',
    'DateInput',
    'DateSegment',
    'DateTime',
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
      <div className="w-full max-w-xs flex flex-col gap-4 p-4">
        <DatePicker aria-label="Meeting date" {...props}>
          <DatePickerTrigger />
        </DatePicker>
      </div>
    ),
  },
  examples: [
    {
      title: 'Standard DatePicker',
      description: 'Single date picker with calendar trigger button and popup dialog.',
      render: () => (
        <div className="w-full max-w-xs flex flex-col gap-2">
          <label className="text-xs font-semibold text-fg">Event Date</label>
          <DatePicker aria-label="Event Date">
            <DatePickerTrigger />
          </DatePicker>
        </div>
      ),
    },
    {
      title: 'DateRangePicker',
      description: 'Dual input segments with range separator and multi-month calendar popover.',
      render: () => (
        <div className="w-full max-w-sm flex flex-col gap-2">
          <label className="text-xs font-semibold text-fg">Stay Duration</label>
          <DateRangePicker aria-label="Stay Duration">
            <DateRangePickerTrigger />
          </DateRangePicker>
        </div>
      ),
    },
    {
      title: 'Standalone DateField',
      description: 'Keyboard-driven segmented date input without a popover calendar.',
      render: () => (
        <div className="w-full max-w-xs flex flex-col gap-2">
          <label className="text-xs font-semibold text-fg">Birth Date</label>
          <DateField aria-label="Birth Date">
            <DateInput />
          </DateField>
        </div>
      ),
    },
    {
      title: 'Composite DateTime Field',
      description: 'Rich trigger button with formatted date/time preview, clear button, and presets.',
      render: () => (
        <div className="w-full max-w-sm">
          <DateTime
            label="Schedule Meeting"
            description="Select an upcoming date and time interval"
            showTime
            clearable
          />
        </div>
      ),
    },
    {
      title: 'Min / max with remaining',
      description: 'DatePicker inherits minValue/maxValue and can show remaining days until the deadline.',
      render: () => <DatePickerBoundsExample />,
    },
  ],
}
