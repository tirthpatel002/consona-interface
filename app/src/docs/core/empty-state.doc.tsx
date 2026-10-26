import React from 'react'
import { EmptyState, Button } from '@consona/interface'
import { Inbox } from 'lucide-react'
import type { ComponentDocSpec } from '../types'

export const emptyStateDoc: ComponentDocSpec = {
  id: 'empty-state',
  name: 'EmptyState',
  component: EmptyState,
  summary: 'Zero-data placeholder with illustration, title, description, and primary/secondary actions.',
  subcomponents: [],
  playground: {
    defaultProps: {
      variant: 'dashed',
      size: 'md',
      title: 'No projects yet',
      description: 'Create a project to start collecting feedback and shipping releases.',
    },
    controls: [
      { name: 'variant', type: 'select', options: ['card', 'dashed', 'ghost'] },
      { name: 'size', type: 'select', options: ['sm', 'md', 'lg'] },
      { name: 'title', type: 'text' },
      { name: 'description', type: 'text' },
    ],
    render: (props: any) => (
      <EmptyState
        {...props}
        icon={<Inbox className="size-6" />}
        action={<Button intent="primary">New project</Button>}
        secondaryAction={<Button intent="outline">Import</Button>}
      />
    ),
  },
  examples: [
    {
      title: 'Card surface',
      description: 'Raised empty state for inset panels.',
      render: () => (
        <EmptyState
          variant="card"
          icon={<Inbox className="size-6" />}
          title="Inbox zero"
          description="You are all caught up. New mentions will land here."
          action={<Button size="sm">Refresh</Button>}
        />
      ),
    },
  ],
}
