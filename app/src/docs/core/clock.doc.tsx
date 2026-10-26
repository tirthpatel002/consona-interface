import React from 'react'
import { Clock } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const clockDoc: ComponentDocSpec = {
  id: 'clock',
  name: 'Clock',
  component: Clock,
  summary: 'Live analog and digital clock readout with smooth sweeping seconds and interactive timezone switching.',
  subcomponents: ['Timer'],
  playground: {
    defaultProps: {
      mode: 'digital',
      size: 'md',
      variant: 'card',
      format: '12h',
      showSeconds: true,
      showDate: true,
      showTimezone: true,
      interactiveTimezone: true,
      hourLabels: 'numbers',
    },
    controls: [
      { name: 'mode', type: 'select', options: ['digital', 'analog', 'both'] },
      { name: 'size', type: 'select', options: ['sm', 'md', 'lg', 'xl'] },
      { name: 'variant', type: 'select', options: ['card', 'plain', 'glass'] },
      { name: 'format', type: 'select', options: ['12h', '24h'] },
      { name: 'showSeconds', type: 'boolean' },
      { name: 'showDate', type: 'boolean' },
      { name: 'showTimezone', type: 'boolean' },
      { name: 'interactiveTimezone', type: 'boolean' },
      { name: 'hourLabels', type: 'select', options: ['numbers', 'roman'] },
    ],
    render: (props) => (
      <div className="flex justify-center p-6">
        <Clock {...props} />
      </div>
    ),
  },
  examples: [
    {
      title: 'Digital Clock with Interactive Timezone',
      description: 'Searchable timezone switcher with real-time offset recalculation.',
      render: () => (
        <div className="flex justify-center p-4">
          <Clock
            mode="digital"
            size="md"
            showSeconds
            showDate
            interactiveTimezone
          />
        </div>
      ),
    },
    {
      title: 'Analog Clock Dial',
      description: 'SVG dial face with sub-ticks, numeric markers, and counterbalanced sweeping second hand.',
      render: () => (
        <div className="flex justify-center p-4">
          <Clock
            mode="analog"
            size="md"
            hourLabels="numbers"
            showMarkers
            showSeconds
          />
        </div>
      ),
    },
    {
      title: 'Combined Analog & Digital Display',
      description: 'Both analog face and digital readout synchronized in a glass card container.',
      render: () => (
        <div className="flex justify-center p-4">
          <Clock
            mode="both"
            variant="glass"
            size="sm"
            hourLabels="roman"
            showSeconds
            showDate
            showTimezone
          />
        </div>
      ),
    },
  ],
}
