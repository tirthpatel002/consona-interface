import React from 'react'
import {
  Toolbar,
  ToolbarGroup,
  ToolbarItem,
  ToolbarSeparator,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListBulletIcon,
  LinkIcon,
  CodeBracketIcon,
} from '@heroicons/react/20/solid'

export const toolbarDoc: ComponentDocSpec = {
  id: 'toolbar',
  name: 'Toolbar',
  component: Toolbar,
  summary: 'Accessible action toolbar orchestrating button groups, separators, and toggle buttons with horizontal or vertical orientations.',
  subcomponents: [
    'ToolbarGroup',
    'ToolbarItem',
    'ToolbarSeparator',
  ],
  playground: {
    defaultProps: {
      orientation: 'horizontal',
      isCircle: false,
      overflow: 'scroll',
    },
    controls: [
      { name: 'orientation', type: 'select', options: ['horizontal', 'vertical'] },
      { name: 'isCircle', type: 'boolean' },
      { name: 'overflow', type: 'select', options: ['scroll', 'wrap'] },
    ],
    render: (props: any) => (
      <div className="flex items-center justify-center p-6 w-full max-w-lg">
        <Toolbar {...props}>
          <ToolbarGroup aria-label="Text Formatting">
            <ToolbarItem aria-label="Bold" size="sq-sm">
              <BoldIcon className="size-4" />
            </ToolbarItem>
            <ToolbarItem aria-label="Italic" size="sq-sm">
              <ItalicIcon className="size-4" />
            </ToolbarItem>
            <ToolbarItem aria-label="Underline" size="sq-sm">
              <UnderlineIcon className="size-4" />
            </ToolbarItem>
          </ToolbarGroup>

          <ToolbarSeparator />

          <ToolbarGroup aria-label="Lists and Links">
            <ToolbarItem aria-label="List" size="sq-sm">
              <ListBulletIcon className="size-4" />
            </ToolbarItem>
            <ToolbarItem aria-label="Code" size="sq-sm">
              <CodeBracketIcon className="size-4" />
            </ToolbarItem>
            <ToolbarItem aria-label="Link" size="sq-sm">
              <LinkIcon className="size-4" />
            </ToolbarItem>
          </ToolbarGroup>
        </Toolbar>
      </div>
    ),
  },
  examples: [
    {
      title: 'Pill Styled Rich Text Controls',
      description: 'Toolbar configured with circular pill buttons and plain hover backgrounds.',
      render: () => (
        <div className="p-4 bg-muted/20 rounded-macro border border-border flex items-center justify-center">
          <Toolbar isCircle>
            <ToolbarGroup>
              <ToolbarItem intent="plain" size="sq-sm" aria-label="Bold">
                <BoldIcon className="size-4" />
              </ToolbarItem>
              <ToolbarItem intent="plain" size="sq-sm" aria-label="Italic">
                <ItalicIcon className="size-4" />
              </ToolbarItem>
            </ToolbarGroup>
            <ToolbarSeparator />
            <ToolbarGroup>
              <ToolbarItem intent="plain" size="sq-sm" aria-label="Code">
                <CodeBracketIcon className="size-4" />
              </ToolbarItem>
            </ToolbarGroup>
          </Toolbar>
        </div>
      ),
    },
  ],
}
