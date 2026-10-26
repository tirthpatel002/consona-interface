import React from 'react'
import { Timer } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const timerDoc: ComponentDocSpec = {
  id: 'timer',
  name: 'Timer',
  component: Timer,
  summary: 'Precision stopwatch and countdown timer with sub-second accuracy, lap split tracking, and circular progress arcs.',
  subcomponents: [],
  playground: {
    defaultProps: {
      mode: 'stopwatch',
      size: 'md',
      variant: 'card',
      showControls: true,
      showMilliseconds: true,
      showProgressRing: false,
      enableLaps: true,
    },
    controls: [
      { name: 'mode', type: 'select', options: ['stopwatch', 'countdown'] },
      { name: 'size', type: 'select', options: ['sm', 'md', 'lg'] },
      { name: 'variant', type: 'select', options: ['card', 'plain', 'compact', 'inline'] },
      { name: 'showControls', type: 'boolean' },
      { name: 'showMilliseconds', type: 'boolean' },
      { name: 'showProgressRing', type: 'boolean' },
      { name: 'enableLaps', type: 'boolean' },
    ],
    render: (props) => (
      <div className="flex justify-center p-6">
        <Timer {...props} />
      </div>
    ),
  },
  examples: [
    {
      title: 'Stopwatch with Lap Tracking',
      description: 'Record split times and sequential lap intervals during active timing.',
      render: () => (
        <div className="flex justify-center p-4">
          <Timer mode="stopwatch" enableLaps showMilliseconds size="md" />
        </div>
      ),
    },
    {
      title: 'Countdown Timer with Progress Ring',
      description: 'Circular SVG progress arc animating smoothly towards countdown completion.',
      render: () => (
        <div className="flex justify-center p-4">
          <Timer
            mode="countdown"
            initialTime={120}
            showProgressRing
            size="md"
            showControls
          />
        </div>
      ),
    },
    {
      title: 'Compact Inline Timer',
      description: 'Minimal footprint timer widget suitable for toolbars and status bars.',
      render: () => (
        <div className="flex items-center gap-4 p-4 border border-border rounded-lg bg-card">
          <span className="text-xs text-muted-fg font-medium">Session Duration:</span>
          <Timer variant="inline" size="sm" showControls={false} />
        </div>
      ),
    },
  ],
}
