import React from 'react'
import { Button, Gradient, type GradientShadow } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const gradientDoc: ComponentDocSpec = {
  id: 'gradient',
  name: 'Gradient',
  component: Gradient,
  summary: 'Mesh gradient background with a white or black shadow along the edges.',
  subcomponents: [],
  playground: {
    defaultHeight: 'regular',
    defaultProps: {
      shadow: 'white' as GradientShadow,
    },
    controls: [
      { name: 'shadow', type: 'select', options: ['white', 'black', 'none'] },
    ],
    render: (props: { shadow?: GradientShadow }) => (
      <Gradient shadow={props.shadow} className="flex min-h-72 w-full items-center justify-center rounded-macro px-8 py-12 text-center text-white">
        <div className="mx-auto max-w-md">
          <h2 className="text-4xl font-semibold tracking-tight">
            Join Our Newsletter and <span className="italic font-serif font-normal">Stay</span> Updated
          </h2>
          <p className="mx-auto mt-3 max-w-xs text-sm text-white/80">
            Get the latest insights, updates, and strategies delivered to your inbox.
          </p>
          <Button className="mt-6" intent="primary">
            Join Newsletter
          </Button>
        </div>
      </Gradient>
    ),
  },
  examples: [
    {
      title: 'Background layer',
      description: 'An empty Gradient fills the nearest relative parent and ignores pointer events.',
      render: () => (
        <div className="relative h-48 w-full overflow-hidden rounded-macro">
          <Gradient />
          <div className="relative flex h-full items-center justify-center px-6 text-center text-sm font-medium text-white">
            Content sits above the wash
          </div>
        </div>
      ),
    },
    {
      title: 'Left and right',
      description: 'Left and right blooms are separate from the top and bottom. The edge shadow stays on the rim.',
      render: () => (
        <div className="flex w-full flex-col gap-3">
          <Gradient className="h-52 w-full rounded-macro" shadow="white" colors={{ left: '#efe9ff', right: '#312e81' }} />
          <Gradient className="h-52 w-full rounded-macro" shadow="black" colors={{ left: '#efe9ff', right: '#312e81' }} />
        </div>
      ),
    },
  ],
}
