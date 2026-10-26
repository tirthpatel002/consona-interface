import React from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const cardDoc: ComponentDocSpec = {
  id: 'card',
  name: 'Card',
  component: Card,
  summary: 'Concentric card container with optical macro geometry, surface variants, and composite anatomy.',
  subcomponents: [
    'CardHeader',
    'CardTitle',
    'CardDescription',
    'CardContent',
    'CardFooter',
    'CardAction',
  ],
  playground: {
    defaultProps: {
      variant: 'default',
      padding: 'sm',
    },
    controls: [
      { name: 'variant', type: 'select', options: ['default', 'subtle', 'bordered', 'flat', 'glow', 'interactive'] },
      { name: 'padding', type: 'select', options: ['none', 'sm', 'md', 'lg'] },
    ],
    render: (props: any) => (
      <div className="w-full max-w-md p-6">
        <Card {...props}>
          <CardHeader
            title="Cluster Performance Metrics"
            description="Real-time telemetry from production edge instances."
          />
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-base bg-secondary/50 border border-border/60">
              <span className="text-xs text-muted-fg">CPU Utilization</span>
              <span className="text-xs font-mono font-bold text-emerald-500">28.4% Normal</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-base bg-secondary/50 border border-border/60">
              <span className="text-xs text-muted-fg">Memory Saturation</span>
              <span className="text-xs font-mono font-bold text-fg">4.2 / 16 GB</span>
            </div>
          </CardContent>
          <CardFooter>
            <Badge intent="success" size="sm">Live Connected</Badge>
            <Button intent="primary" size="sm">View Node Logs</Button>
          </CardFooter>
        </Card>
      </div>
    ),
  },
  examples: [
    {
      title: 'Interactive & Glow Surface Cards',
      description: 'Hover elevations and optical ambient specular glows.',
      render: () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
          <Card variant="glow">
            <CardHeader title="AI Synthesis Engine" description="Glow accent variant" />
            <CardContent>
              <p className="text-xs text-muted-fg">Neural optical synthesis pipeline active.</p>
            </CardContent>
          </Card>

          <Card variant="interactive">
            <CardHeader title="Clickable Workspace" description="Interactive elevation" />
            <CardContent>
              <p className="text-xs text-muted-fg">Click or hover to inspect hover states.</p>
            </CardContent>
          </Card>
        </div>
      ),
    },
  ],
}
