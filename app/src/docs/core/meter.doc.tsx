import React from 'react'
import { Meter, Label } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const meterDoc: ComponentDocSpec = {
  id: 'meter',
  name: 'Meter',
  component: Meter,
  summary: 'Capacity gauge that colors fill across low, optimum, warning, and critical thresholds.',
  subcomponents: ['MeterHeader', 'MeterValue', 'MeterTrack'],
  playground: {
    defaultProps: {
      value: 36,
      size: 'md',
      showValue: true,
    },
    controls: [
      { name: 'value', type: 'number', min: 0, max: 100 },
      { name: 'size', type: 'select', options: ['sm', 'md', 'lg'] },
      { name: 'showValue', type: 'boolean' },
    ],
    render: (props: any) => (
      <div className="w-full max-w-md mx-auto p-6">
        <Meter {...props} />
      </div>
    ),
  },
  examples: [
    {
      title: 'Threshold bands',
      description: 'Low (success), warning, and critical fills at increasing capacity.',
      render: () => (
        <div className="flex flex-col gap-5 w-full max-w-md">
          {[32, 64, 78, 94].map((value) => (
            <Meter key={value} value={value}>
              <Meter.Header>
                <Label>Disk {value}%</Label>
                <Meter.Value />
              </Meter.Header>
              <Meter.Track />
            </Meter>
          ))}
        </div>
      ),
    },
  ],
}
