import React from 'react'
import {
  Tooltip,
  TooltipTrigger,
  Button,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const tooltipDoc: ComponentDocSpec = {
  id: 'tooltip',
  name: 'Tooltip',
  component: Tooltip,
  summary: 'Micro-information tooltip container with optical geometry, delay transitions, and placement ramps.',
  subcomponents: ['TooltipTrigger', 'TooltipArrow', 'TooltipContent'],
  playground: {
    defaultProps: {
      intent: 'default',
      size: 'md',
      showArrow: true,
      placement: 'top',
    },
    controls: [
      { name: 'intent', type: 'select', options: ['default', 'inverse', 'primary', 'subtle'] },
      { name: 'size', type: 'select', options: ['sm', 'md', 'lg'] },
      { name: 'showArrow', type: 'boolean' },
      { name: 'placement', type: 'select', options: ['top', 'bottom', 'left', 'right'] },
    ],
    render: (props: any) => (
      <div className="flex items-center justify-center p-12">
        <TooltipTrigger delay={200}>
          <Button intent="secondary">Hover Or Focus Me</Button>
          <Tooltip {...props}>
            Auto-scaling optical tooltip indicator
          </Tooltip>
        </TooltipTrigger>
      </div>
    ),
  },
  examples: [
    {
      title: 'Semantic Intent Ramps',
      description: 'Default, Inverse, Primary, and Subtle styling.',
      render: () => (
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <TooltipTrigger delay={100}>
            <Button intent="outline" size="sm">Default</Button>
            <Tooltip intent="default" showArrow>Standard optical surface</Tooltip>
          </TooltipTrigger>

          <TooltipTrigger delay={100}>
            <Button intent="outline" size="sm">Inverse</Button>
            <Tooltip intent="inverse" showArrow>High-contrast inverse bubble</Tooltip>
          </TooltipTrigger>

          <TooltipTrigger delay={100}>
            <Button intent="outline" size="sm">Primary</Button>
            <Tooltip intent="primary" showArrow>Primary brand accent indicator</Tooltip>
          </TooltipTrigger>
        </div>
      ),
    },
  ],
}
