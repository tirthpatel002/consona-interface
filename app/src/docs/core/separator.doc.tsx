import React from 'react'
import { Separator, Divider } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const separatorDoc: ComponentDocSpec = {
  id: 'separator',
  name: 'Separator',
  component: Separator,
  summary: 'Visual rule and content divider supporting horizontal and vertical orientations with accessible ARIA semantics.',
  subcomponents: ['Divider'],
  playground: {
    defaultProps: {
      orientation: 'horizontal'
    },
    controls: [
      {
        name: 'orientation',
        type: 'select',
        options: ['horizontal', 'vertical']
    },
    ],
    render: (props: any) => (
      <div className="w-full max-w-sm flex items-center justify-center gap-4 p-4">
        {props.orientation === 'vertical' ? (
          <div className="flex h-12 items-center gap-4 text-xs text-muted-fg">
            <span>Left Content</span>
            <Separator orientation="vertical" />
            <span>Right Content</span>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-3 text-xs text-muted-fg text-center">
            <span>Section Top</span>
            <Separator />
            <span>Section Bottom</span>
          </div>
        )}
      </div>
    )
    },
  examples: [
    {
      title: 'Divider with Centered Label',
      description: 'Horizontal divider with embedded content.',
      render: () => (
        <div className="w-full max-w-sm space-y-4">
          <div className="relative flex items-center justify-center">
            <Separator className="w-full" />
            <span className="absolute bg-bg px-2 text-[10px] uppercase font-semibold text-muted-fg">
              OR CONTINUE WITH
            </span>
          </div>
        </div>
      )
    },
    {
      title: 'Divider Alias Usage',
      description: 'Divider is an alias for Separator providing the exact same horizontal/vertical divider rules.',
      render: () => (
        <div className="w-full max-w-sm flex flex-col gap-2">
          <span className="text-xs text-muted-fg">Upper Section</span>
          <Divider />
          <span className="text-xs text-muted-fg">Lower Section</span>
        </div>
      )
    },
  ]
}
