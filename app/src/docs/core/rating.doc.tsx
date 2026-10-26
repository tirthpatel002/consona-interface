import React, { useState } from 'react'
import {
  Rating,
  Field,
} from '@consona/interface'
import { Heart } from 'lucide-react'
import type { ComponentDocSpec } from '../types'

export const ratingDoc: ComponentDocSpec = {
  id: 'rating',
  name: 'Rating',
  component: Rating,
  summary: 'Accessible rating and scoring component with half-star fractional precision, custom icon slots, keyboard navigation, and readonly review support.',
  subcomponents: [],
  playground: {
    defaultProps: {
      defaultValue: 4,
      max: 5,
      precision: 1,
      size: 'md',
      showValue: true,
      disabled: false,
      readOnly: false,
    },
    controls: [
      { name: 'max', type: 'number' },
      { name: 'precision', type: 'select', options: ['1', '0.5'] },
      { name: 'size', type: 'select', options: ['sm', 'md', 'lg', 'xl'] },
      { name: 'showValue', type: 'boolean' },
      { name: 'disabled', type: 'boolean' },
      { name: 'readOnly', type: 'boolean' },
    ],
    render: (props: any) => (
      <div className="flex flex-col items-center justify-center p-8 max-w-sm mx-auto w-full">
        <Rating {...props} />
      </div>
    ),
  },
  examples: [
    {
      title: 'Interactive Star Rating with Precision',
      description: 'Supports full-star and fractional half-step increments with live value display.',
      render: () => {
        const [val, setVal] = useState(3.5)
        return (
          <div className="flex flex-col gap-4 p-4 max-w-sm">
            <Field>
              <Field.Label>Customer Satisfaction</Field.Label>
              <Rating
                value={val}
                onChange={setVal}
                precision={0.5}
                showValue
                tooltips={['Poor', 'Fair', 'Average', 'Good', 'Excellent']}
              />
              <Field.Description>Rate your overall satisfaction with our service.</Field.Description>
            </Field>
          </div>
        )
      },
    },
    {
      title: 'Optical Sizes (sm, md, lg, xl)',
      description: 'Standard optical sizing scale for compact table rows or prominent review cards.',
      render: () => (
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center gap-4">
            <span className="w-12 text-xs font-mono text-muted-fg">sm:</span>
            <Rating size="sm" defaultValue={4} />
          </div>
          <div className="flex items-center gap-4">
            <span className="w-12 text-xs font-mono text-muted-fg">md:</span>
            <Rating size="md" defaultValue={4} />
          </div>
          <div className="flex items-center gap-4">
            <span className="w-12 text-xs font-mono text-muted-fg">lg:</span>
            <Rating size="lg" defaultValue={4.5} precision={0.5} />
          </div>
          <div className="flex items-center gap-4">
            <span className="w-12 text-xs font-mono text-muted-fg">xl:</span>
            <Rating size="xl" defaultValue={5} />
          </div>
        </div>
      ),
    },
    {
      title: 'Read-Only Review Mode',
      description: 'Static presentation mode for verified customer reviews.',
      render: () => (
        <div className="flex flex-col gap-2 p-4">
          <div className="flex items-center gap-2">
            <Rating defaultValue={5} readOnly showValue />
            <span className="text-xs text-muted-fg font-medium">(1,420 verified reviews)</span>
          </div>
        </div>
      ),
    },
  ],
}
