import React, { useState } from 'react'
import {
  ShowMore,
  Badge,
  Card,
  CardContent,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'
import {
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/20/solid'

export const showMoreDoc: ComponentDocSpec = {
  id: 'show-more',
  name: 'ShowMore',
  component: ShowMore,
  badge: 'Core Atom',
  summary: 'Horizontal or vertical toggle divider for expanding truncated lists, comments, or collapsed content blocks.',
  subcomponents: ['ShowMore'],
  playground: {
    defaultProps: {
      as: 'button',
      orientation: 'horizontal',
      isSelected: false,
    },
    controls: [
      { name: 'as', type: 'select', options: ['button', 'text'] },
      { name: 'orientation', type: 'select', options: ['horizontal', 'vertical'] },
      { name: 'isSelected', type: 'boolean' },
    ],
    render: (props: any) => {
      const [isSelected, setIsSelected] = useState(false)
      const selected = props.isSelected !== undefined ? props.isSelected : isSelected

      return (
        <div className="flex flex-col items-center justify-center p-6 w-full max-w-lg">
          <div className="w-full text-center text-sm text-muted-fg mb-3">
            Showing initial 5 of 28 transactions
          </div>

          <ShowMore
            as={props.as}
            orientation={props.orientation}
            text="23 additional events hidden"
            isSelected={selected}
            onChange={setIsSelected}
          >
            {({ isSelected: active }) => (
              <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium">
                {active ? 'Show less' : 'Show 23 more'}
                {active ? <ChevronUpIcon className="size-3.5" /> : <ChevronDownIcon className="size-3.5" />}
              </span>
            )}
          </ShowMore>
        </div>
      )
    },
  },
  examples: [
    {
      title: 'Collapsible Activity Feed',
      description: 'Progressively reveal audit log history or commentary.',
      render: () => {
        const [isExpanded, setIsExpanded] = useState(false)
        const initialLogs = [
          { id: '1', time: '12:45 PM', event: 'Deployment to us-east-1 succeeded' },
          { id: '2', time: '12:30 PM', event: 'Database migration 042 applied' },
        ]
        const extraLogs = [
          { id: '3', time: '12:15 PM', event: 'SSL certificate renewed' },
          { id: '4', time: '11:50 AM', event: 'Cache invalidated on 12 edge nodes' },
          { id: '5', time: '11:00 AM', event: 'Health check passed across all clusters' },
        ]

        const visibleLogs = isExpanded ? [...initialLogs, ...extraLogs] : initialLogs

        return (
          <div className="w-full max-w-md p-4 rounded-base border border-border bg-card">
            <h4 className="font-semibold text-fg text-sm mb-3">System Event Stream</h4>
            <div className="space-y-2">
              {visibleLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/50">
                  <span className="text-fg">{log.event}</span>
                  <span className="font-mono text-muted-fg">{log.time}</span>
                </div>
              ))}
            </div>

            <ShowMore
              isSelected={isExpanded}
              onChange={setIsExpanded}
              className="mt-4"
            >
              {({ isSelected: active }) => (
                <span className="flex items-center gap-1 text-xs">
                  {active ? 'Collapse stream' : 'Show 3 earlier events'}
                  {active ? <ChevronUpIcon className="size-3" /> : <ChevronDownIcon className="size-3" />}
                </span>
              )}
            </ShowMore>
          </div>
        )
      },
    },
    {
      title: 'Static Text Divider Mode',
      description: 'Renders an accessible boundary divider with contextual count information without button interactivity.',
      render: () => (
        <div className="w-full max-w-md py-4">
          <ShowMore as="text" text="End of loaded results (50 total)" />
        </div>
      ),
    },
  ],
  recipes: [
    {
      title: 'Custom Divider via ShowMore.extend()',
      description: 'Create an activity stream fold marker.',
      code: `export const StreamShowMore = ShowMore.extend({\n  name: 'StreamShowMore',\n  props: {\n    as: 'button',\n    orientation: 'horizontal',\n  },\n})`,
    },
  ],
  a11yNotes: [
    'Uses React Aria ToggleButton primitives with aria-pressed state.',
    'Screen readers announce expansion state change dynamically.',
  ],
}
