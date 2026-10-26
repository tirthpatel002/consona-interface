import React from 'react'
import {
  Select,
  ListBoxItem,
  ListBoxSection,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'
import {
  ServerStackIcon,
  CpuChipIcon,
  GlobeAmericasIcon,
} from '@heroicons/react/20/solid'

export const selectDoc: ComponentDocSpec = {
  id: 'select',
  name: 'Select',
  component: Select,
  summary: 'Accessible select dropdown system with searchable options, chips, and optical token styling.',
  subcomponents: [
    'SelectTrigger',
    'SelectValue',
    'SelectPopover',
    'ListBox',
    'ListBoxItem',
    'ListBoxSection',
    'ListBoxSeparator',
    'SelectField',
  ],
  playground: {
    defaultProps: {
      variant: 'default',
      size: 'md',
      placeholder: 'Choose primary region...',
      isDisabled: false,
    },
    controls: [
      { name: 'variant', type: 'select', options: ['default', 'filled', 'outline', 'subtle'] },
      { name: 'size', type: 'select', options: ['sm', 'md', 'lg'] },
      { name: 'placeholder', type: 'text' },
      { name: 'isDisabled', type: 'boolean' },
    ],
    render: (props: any) => (
      <div className="w-full max-w-xs p-6">
        <Select aria-label="Region Selector" {...props}>
          <ListBoxSection title="North America">
            <ListBoxItem id="us-east" icon={<ServerStackIcon />} description="Virginia (12ms)">
              US East (N. Virginia)
            </ListBoxItem>
            <ListBoxItem id="us-west" icon={<ServerStackIcon />} description="Oregon (28ms)">
              US West (Oregon)
            </ListBoxItem>
          </ListBoxSection>
          <ListBoxSection title="Europe & Asia">
            <ListBoxItem id="eu-central" icon={<GlobeAmericasIcon />} description="Frankfurt (84ms)">
              EU Central (Frankfurt)
            </ListBoxItem>
            <ListBoxItem id="ap-east" icon={<GlobeAmericasIcon />} description="Tokyo (110ms)">
              Asia Pacific (Tokyo)
            </ListBoxItem>
          </ListBoxSection>
        </Select>
      </div>
    ),
  },
  examples: [
    {
      title: 'Compute Instance Type Selector',
      description: 'Select with icons and hardware specification descriptions.',
      render: () => (
        <div className="w-full max-w-sm">
          <Select aria-label="Instance Sizing" placeholder="Select instance...">
            <ListBoxItem id="t3-micro" icon={<CpuChipIcon />} description="2 vCPUs, 1GB RAM">
              General Purpose (t3.micro)
            </ListBoxItem>
            <ListBoxItem id="c5-large" icon={<CpuChipIcon />} description="4 vCPUs, 8GB RAM">
              Compute Optimized (c5.large)
            </ListBoxItem>
            <ListBoxItem id="m5-2xlarge" icon={<CpuChipIcon />} description="8 vCPUs, 32GB RAM">
              Memory Optimized (m5.2xlarge)
            </ListBoxItem>
          </Select>
        </div>
      ),
    },
  ],
}
