import React from 'react'
import { Kbd, Keyboard } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const kbdDoc: ComponentDocSpec = {
  id: 'kbd',
  name: 'Kbd',
  component: Kbd,
  summary: 'Keyboard shortcut indicator with optical atom radius, elevated specular border, and platform key modifiers.',
  subcomponents: ['Keyboard'],
  playground: {
    defaultProps: {
      children: '⌘K'
    },
    controls: [{ name: 'children', type: 'text' }],
    render: (props: any) => (
      <div className="flex items-center gap-3">
        <Kbd>{props.children}</Kbd>
      </div>
    )
    },
  examples: [
    {
      title: 'Shortcut Key Combos',
      description: 'Standard key sequences formatted with Kbd elements.',
      render: () => (
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-1.5 text-xs text-muted-fg">
            <span>Command Palette:</span>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-fg">
            <span>Save:</span>
            <Kbd>Ctrl</Kbd>
            <Kbd>S</Kbd>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-fg">
            <span>Close:</span>
            <Kbd>Esc</Kbd>
          </div>
        </div>
      )
    },
    {
      title: 'Keyboard Alias Usage',
      description: 'Keyboard is an alias for Kbd providing the exact same monospace keyboard shortcut badge styling.',
      render: () => (
        <div className="flex items-center gap-2 text-xs text-muted-fg">
          <span>Quick search:</span>
          <Keyboard>⌘</Keyboard>
          <Keyboard>/</Keyboard>
        </div>
      )
    },
  ]
}
