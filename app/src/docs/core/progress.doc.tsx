import React from 'react'
import { Progress, Label } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const progressDoc: ComponentDocSpec = {
  id: 'progress',
  name: 'Progress',
  component: Progress,
  summary: 'Accessible determinate and indeterminate progress — linear bars and concentric circles with percentage labels.',
  subcomponents: ['ProgressHeader', 'ProgressValue', 'ProgressTrack', 'ProgressCircle'],
  playground: {
    defaultProps: {
      value: 42,
      size: 'md',
      intent: 'primary',
      showValue: true,
    },
    controls: [
      { name: 'value', type: 'number', min: 0, max: 100 },
      { name: 'size', type: 'select', options: ['sm', 'md', 'lg'] },
      { name: 'intent', type: 'select', options: ['primary', 'success', 'warning', 'danger'] },
      { name: 'showValue', type: 'boolean' },
    ],
    render: (props: any) => (
      <div className="w-full max-w-md mx-auto p-6">
        <Progress {...props} />
      </div>
    ),
  },
  examples: [
    {
      title: 'Labeled linear bar',
      description: 'Compound header + track anatomy with a live value.',
      render: () => (
        <Progress value={68} className="w-full max-w-md">
          <Progress.Header>
            <Label>Uploading assets</Label>
            <Progress.Value />
          </Progress.Header>
          <Progress.Track intent="primary" />
        </Progress>
      ),
    },
    {
      title: 'Indeterminate',
      description: 'Sliding fill when the percentage is unknown.',
      render: () => (
        <Progress isIndeterminate className="w-full max-w-md">
          <Progress.Header>
            <Label>Connecting</Label>
          </Progress.Header>
          <Progress.Track />
        </Progress>
      ),
    },
    {
      title: 'Circular progress',
      description: 'Concentric arcs with optional centered percentage.',
      render: () => (
        <div className="flex items-center gap-6 text-primary">
          <Progress.Circle value={24} size="sm" />
          <Progress.Circle value={56} size="md" showValue />
          <Progress.Circle value={82} size="lg" showValue />
          <Progress.Circle isIndeterminate size="lg" />
        </div>
      ),
    },
  ],
}
