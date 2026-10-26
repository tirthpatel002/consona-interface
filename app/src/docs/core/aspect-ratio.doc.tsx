import React from 'react'
import { AspectRatio, Badge } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const aspectRatioDoc: ComponentDocSpec = {
  id: 'aspect-ratio',
  name: 'AspectRatio',
  component: AspectRatio,
  summary: 'Container enforcing exact geometric width-to-height proportions across responsive viewports.',
  subcomponents: [],
  playground: {
    defaultProps: {
      preset: '16/9',
    },
    controls: [
      { name: 'preset', type: 'select', options: ['16/9', '4/3', '1/1', '21/9', '9/16', '3/2', '2/3'] },
    ],
    render: (props: any) => (
      <div className="w-full max-w-md p-6">
        <AspectRatio
          {...props}
          className="rounded-macro border border-border/40 bg-surface/60 overflow-hidden relative flex items-center justify-center shadow-xs"
        >
          <img
            src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80"
            alt="Gradient preview"
            className="size-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 backdrop-blur-2xs flex items-center justify-center">
            <Badge intent="primary" size="md">Ratio: {props.preset || '16/9'}</Badge>
          </div>
        </AspectRatio>
      </div>
    ),
  },
  examples: [
    {
      title: 'Standard Proportions (16:9, 1:1, 4:3)',
      description: 'Cinema, square, and photo aspect ratio formats.',
      render: () => (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          <AspectRatio preset="16/9" className="rounded-base bg-surface/60 border border-border/40 flex items-center justify-center text-xs font-mono text-fg shadow-2xs">
            16:9 Cinema
          </AspectRatio>
          <AspectRatio preset="1/1" className="rounded-base bg-surface/60 border border-border/40 flex items-center justify-center text-xs font-mono text-fg shadow-2xs">
            1:1 Square
          </AspectRatio>
          <AspectRatio preset="4/3" className="rounded-base bg-surface/60 border border-border/40 flex items-center justify-center text-xs font-mono text-fg shadow-2xs">
            4:3 Standard
          </AspectRatio>
        </div>
      ),
    },
  ],
}
