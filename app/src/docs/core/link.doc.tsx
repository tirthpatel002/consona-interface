import React from 'react'
import { Link } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const linkDoc: ComponentDocSpec = {
  id: 'link',
  name: 'Link',
  component: Link,
  summary: 'Accessible hyperlinked navigation primitive with intent variants, external target handling, and optical focus rings.',
  subcomponents: [],
  playground: {
    defaultProps: {
      intent: 'primary',
      underline: 'hover',
      size: 'md',
      isExternal: false,
      children: 'Explore Consona Design System',
    },
    controls: [
      { name: 'intent', type: 'select', options: ['default', 'primary', 'secondary', 'danger', 'subtle', 'plain'] },
      { name: 'underline', type: 'select', options: ['none', 'hover', 'always'] },
      { name: 'size', type: 'select', options: ['sm', 'md', 'lg'] },
      { name: 'isExternal', type: 'boolean' },
      { name: 'children', type: 'text' },
    ],
    render: (props: any) => (
      <div className="flex items-center justify-center p-8">
        <Link href="https://github.com" {...props} />
      </div>
    ),
  },
  examples: [
    {
      title: 'Semantic Intent Spectrum',
      description: 'Color and hierarchy ramps for primary, secondary, and destructive actions.',
      render: () => (
        <div className="flex flex-wrap items-center gap-6">
          <Link href="#" intent="default">Default Link</Link>
          <Link href="#" intent="primary">Primary Link</Link>
          <Link href="#" intent="secondary">Secondary Link</Link>
          <Link href="#" intent="danger">Danger Link</Link>
          <Link href="https://example.com" isExternal intent="primary">External Documentation</Link>
        </div>
      ),
    },
  ],
}
