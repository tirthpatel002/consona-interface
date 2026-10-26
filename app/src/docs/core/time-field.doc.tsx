import React from 'react'
import { TimeField, TimeInput, createTime } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const timeFieldDoc: ComponentDocSpec = {
  id: 'time-field',
  name: 'TimeField',
  component: TimeField,
  summary: 'Segmented temporal input for hours, minutes, seconds, and AM/PM with keyboard arrow incrementing.',
  subcomponents: ['TimeInput'],
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
      <div className="w-full max-w-xs flex flex-col gap-2 p-4">
        <label className="text-xs font-semibold text-fg">Appointment Time</label>
        <TimeField aria-label="Appointment Time" {...props}>
          <TimeInput />
        </TimeField>
      </div>
    ),
  },
  examples: [
    {
      title: 'Standard TimeField',
      description: 'Segmented time input allowing keyboard arrow increments and number typing.',
      render: () => (
        <div className="w-full max-w-xs flex flex-col gap-2">
          <label className="text-xs font-semibold text-fg">Start Time</label>
          <TimeField aria-label="Start Time">
            <TimeInput />
          </TimeField>
        </div>
      ),
    },
    {
      title: 'Disabled State',
      description: 'Disabled time field prevents user edits and focus.',
      render: () => (
        <div className="w-full max-w-xs flex flex-col gap-2">
          <label className="text-xs font-semibold text-fg">Fixed Departure Time</label>
          <TimeField aria-label="Departure Time" isDisabled>
            <TimeInput />
          </TimeField>
        </div>
      ),
    },
    {
      title: 'Min / max with remaining',
      description: 'TimeField already supports minValue/maxValue. Remaining counts down from now to maxValue.',
      render: () => (
        <div className="w-full max-w-xs flex flex-col gap-2">
          <label className="text-xs font-semibold text-fg">Arrive by</label>
          <TimeField
            aria-label="Arrive by"
            minValue={createTime(9)}
            maxValue={createTime(17)}
            showRemaining
          >
            <TimeInput />
          </TimeField>
        </div>
      ),
    },
  ],
}
