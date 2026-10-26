import React from 'react'
import {
  ScrollArea,
  Badge,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const scrollAreaDoc: ComponentDocSpec = {
  id: 'scroll-area',
  name: 'ScrollArea',
  component: ScrollArea,
  summary: 'Custom styled scroll area container with non-intrusive scrollbars and optical curve styling.',
  subcomponents: [
    'ScrollBar',
    'ScrollAreaViewport',
    'ScrollAreaThumb',
    'ScrollAreaCorner',
  ],
  playground: {
    defaultProps: {
      type: 'hover',
      orientation: 'vertical',
    },
    controls: [
      { name: 'type', type: 'select', options: ['hover', 'auto', 'always', 'scroll'] },
      { name: 'orientation', type: 'select', options: ['vertical', 'horizontal', 'both'] },
    ],
    render: (props: any) => (
      <div className="w-full max-w-sm p-4">
        <ScrollArea className="h-64 rounded-macro border border-border/80 bg-overlay/30 p-4" {...props}>
          <div className="space-y-3 pr-4">
            <h4 className="text-sm font-bold text-fg">Cluster Event Stream</h4>
            {Array.from({ length: 15 }).map((_, i) => (
              <div
                key={i}
                className="p-3 rounded-base bg-secondary/50 border border-border/60 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-fg">Event Log #{i + 1}</div>
                  <div className="text-2xs text-muted-fg font-mono">pod-worker-0{i}.us-east</div>
                </div>
                <Badge intent={i % 3 === 0 ? 'success' : 'secondary'} size="sm">
                  {i % 3 === 0 ? 'Ready' : 'Sync'}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    ),
  },
  examples: [
    {
      title: 'Horizontal Code Scroll Viewport',
      description: 'ScrollArea handling horizontal overflow code blocks.',
      render: () => (
        <div className="w-full max-w-sm">
          <ScrollArea orientation="horizontal" className="rounded-base border border-border/80 bg-muted/40 p-3 font-mono text-xs text-primary">
            <div className="whitespace-nowrap pb-2">
              kubectl rollout restart deployment/edge-orchestrator-gateway --namespace=production-us-east-1 --cluster=consona-k8s-prime
            </div>
          </ScrollArea>
        </div>
      ),
    },
  ],
}
