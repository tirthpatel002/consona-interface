import React from 'react'
import { Badge, Tag, Chip } from '@consona/interface'
import { CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react'
import type { ComponentDocSpec } from '../types'
import { AutoVariantGrid } from '../../components/auto-variant-grid'

export const badgeDoc: ComponentDocSpec = {
  id: 'badge',
  name: 'Badge',
  component: Badge,
  summary: 'Compact status badge and tag indicator with optical geometry, semantic intent ramps, and icon slots.',
  subcomponents: ['Tag', 'Chip'],
  playground: {
    defaultProps: {
      children: 'Live System',
      intent: 'primary',
      size: 'md',
      isCircle: false
    },
    controls: [
      {
        name: 'intent',
        type: 'select',
        options: ['primary', 'secondary', 'success', 'info', 'warning', 'danger', 'accent', 'outline']
    },
      {
        name: 'size',
        type: 'select',
        options: ['sm', 'md', 'lg']
    },
      {
        name: 'isCircle',
        type: 'boolean'
    },
      {
        name: 'children',
        type: 'text'
    },
    ]
    },
  examples: [
    {
      title: 'Semantic Intents & Sizes Matrix',
      description: 'Status badge across all semantic intent ramps.',
      render: () => (
        <AutoVariantGrid
          component={Badge}
          intents={['primary', 'secondary', 'success', 'info', 'warning', 'danger', 'accent', 'outline']}
          sizes={['sm', 'md', 'lg']}
          label="Status"
        />
      )
    },
    {
      title: 'Circular Badges & Icon Slots',
      description: 'Badges with rounded-full pill geometry or custom icon slots.',
      render: () => (
        <div className="flex flex-wrap gap-3 items-center">
          <Badge isCircle intent="success">
            Operational
          </Badge>
          <Badge isCircle intent="warning">
            Degraded
          </Badge>
          <Badge isCircle intent="danger">
            Outage
          </Badge>
          <Badge slots={{ icon: Sparkles }} intent="primary">
            AI Enhanced
          </Badge>
          <Badge slots={{ icon: ShieldAlert }} intent="danger">
            High Severity
          </Badge>
        </div>
      )
    },
    {
      title: 'Tags and Chips',
      description: 'Interactive and secondary indicator tags.',
      render: () => (
        <div className="flex flex-wrap gap-3 items-center">
          <Tag intent="primary">React 19</Tag>
          <Tag intent="accent">Tailwind 4</Tag>
          <Chip intent="secondary">Selected Filter</Chip>
          <Chip intent="outline">Unselected Filter</Chip>
        </div>
      )
    },
  ],
  recipes: [
    {
      title: 'Specializing via Badge.extend()',
      description: 'Pre-configure a status indicator for system health.',
      code: `export const VerifiedBadge = Badge.extend({\n  name: 'VerifiedBadge',\n  props: {\n    intent: 'success',\n    isCircle: true,\n  },\n  slots: {\n    icon: CheckCircle2,\n  },\n})`
    },
  ]
    }
