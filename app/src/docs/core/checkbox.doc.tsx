import React from 'react'
import { Checkbox, CheckboxGroup, CheckboxField, Description } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const checkboxDoc: ComponentDocSpec = {
  id: 'checkbox',
  name: 'Checkbox',
  component: Checkbox,
  summary: 'Accessible selection control with optical atom radius, indeterminate states, and group bindings.',
  subcomponents: ['CheckboxGroup', 'CheckboxField'],
  playground: {
    defaultProps: {
      children: 'Enable real-time analytics sync'
    },
    controls: [
      { name: 'children', type: 'text' },
    ],
    render: (props: any) => (
      <div className="flex items-center gap-3">
        <Checkbox {...props} />
      </div>
    )
    },
  examples: [
    {
      title: 'Checkbox Group with Descriptions',
      description: 'Grouped checkboxes with independent field labels and descriptions.',
      render: () => (
        <div className="space-y-4">
          <Checkbox>I agree to terms of service</Checkbox>

          <div className="pt-3 border-t border-border">
            <CheckboxField>
              <Checkbox>Weekly Security Audit</Checkbox>
              <Description>Receive weekly compliance summary reports in email.</Description>
            </CheckboxField>
          </div>
        </div>
      )
    },
  ]
    }
