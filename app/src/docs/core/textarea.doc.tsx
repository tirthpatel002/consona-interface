import React from 'react'
import { TextArea, Button } from '@consona/interface'
import { Sparkles, Send } from 'lucide-react'
import type { ComponentDocSpec } from '../types'

export const textareaDoc: ComponentDocSpec = {
  id: 'textarea',
  name: 'TextArea',
  component: TextArea,
  summary: 'Multi-line text input with auto-resize, optical geometry, character count slots, and footer slots.',
  subcomponents: ['Textarea'],
  playground: {
    defaultProps: {
      placeholder: 'Write your prompt or instructions here...',
      rows: 3,
      size: 'md',
      isDisabled: false
    },
    controls: [
      { name: 'size', type: 'select', options: ['xs', 'sm', 'md', 'lg'] },
      { name: 'rows', type: 'number', min: 1, max: 10 },
      { name: 'placeholder', type: 'text' },
      { name: 'isDisabled', type: 'boolean' },
    ],
    render: (props: any) => (
      <div className="w-full max-w-md">
        <TextArea {...props} />
      </div>
    )
    },
  examples: [
    {
      title: 'Standard Multi-line TextArea',
      description: 'Clean optical border and density-scaled padding.',
      render: () => (
        <div className="w-full max-w-md space-y-3">
          <TextArea placeholder="Describe the system architecture..." rows={3} />
          <TextArea defaultValue="Initialized with custom system instructions..." rows={2} />
        </div>
      )
    },
  ]
    }
