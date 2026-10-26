import React from 'react'
import { Radio, RadioGroup, RadioField, Description } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const radioDoc: ComponentDocSpec = {
  id: 'radio',
  name: 'Radio',
  component: Radio,
  summary: 'Radio selection button and group with circular optical geometry and custom dot slots.',
  subcomponents: ['RadioGroup', 'RadioField'],
  playground: {
    defaultProps: {
      defaultValue: 'pro'
    },
    controls: [
      {
        name: 'defaultValue',
        type: 'select',
        options: ['starter', 'pro', 'enterprise']
    },
    ],
    render: (props: any) => (
      <RadioGroup defaultValue={props.defaultValue}>
        <Radio value="starter">Starter Plan</Radio>
        <Radio value="pro">Professional Plan</Radio>
        <Radio value="enterprise">Enterprise Plan</Radio>
      </RadioGroup>
    )
    },
  examples: [
    {
      title: 'Plan Selection with RadioField and Description',
      description: 'Radio fields with rich descriptive summaries.',
      render: () => (
        <RadioGroup defaultValue="us-east" className="w-full max-w-md space-y-3">
          <RadioField value="us-east">
            <Radio value="us-east">US East (N. Virginia)</Radio>
            <Description>Lowest latency for North American customers (12ms).</Description>
          </RadioField>
          <RadioField value="eu-central">
            <Radio value="eu-central">Europe (Frankfurt)</Radio>
            <Description>GDPR compliant datacenter with encrypted backups.</Description>
          </RadioField>
        </RadioGroup>
      )
    },
  ]
    }
