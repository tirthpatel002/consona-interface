import React from 'react'
import {
  Menu,
  MenuItem,
  MenuSection,
  MenuSeparator,
  MenuTrigger,
  MenuPopover,
  Button,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'
import {
  DocumentDuplicateIcon,
  PencilSquareIcon,
  TrashIcon,
  ShareIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/20/solid'

export const menuDoc: ComponentDocSpec = {
  id: 'menu',
  name: 'Menu',
  component: Menu,
  summary: 'Accessible action menu with keyboard navigation, sub-menu nesting, and optical token styling.',
  subcomponents: [
    'MenuTrigger',
    'MenuPopover',
    'MenuItem',
    'MenuSection',
    'MenuHeader',
    'MenuSeparator',
    'MenuSubmenuTrigger',
    'MenuKeyboardShortcut',
    'Dropdown',
  ],
  playground: {
    defaultProps: {
      placement: 'bottom start',
    },
    controls: [
      { name: 'placement', type: 'select', options: ['bottom start', 'bottom end', 'top start', 'top end', 'left', 'right'] },
    ],
    render: (props: any) => (
      <div className="flex items-center justify-center p-8">
        <MenuTrigger>
          <Button intent="secondary">Document Actions ▾</Button>
          <MenuPopover placement={props.placement}>
            <Menu onAction={(key) => console.log('Selected:', key)}>
              <MenuSection title="File Operations">
                <MenuItem id="edit" icon={<PencilSquareIcon />} shortcut="⌘E">
                  Edit Document
                </MenuItem>
                <MenuItem id="duplicate" icon={<DocumentDuplicateIcon />} shortcut="⌘D">
                  Duplicate Copy
                </MenuItem>
                <MenuItem id="share" icon={<ShareIcon />} shortcut="⌘S">
                  Share Access
                </MenuItem>
              </MenuSection>
              <MenuSeparator />
              <MenuSection title="Danger Zone">
                <MenuItem id="delete" intent="danger" icon={<TrashIcon />} shortcut="⌫">
                  Delete File
                </MenuItem>
              </MenuSection>
            </Menu>
          </MenuPopover>
        </MenuTrigger>
      </div>
    ),
  },
  examples: [
    {
      title: 'Cloud Deployment Dropdown',
      description: 'Action menu with primary and status intent options.',
      render: () => (
        <MenuTrigger>
          <Button intent="primary">Deploy Node ▾</Button>
          <MenuPopover>
            <Menu>
              <MenuItem id="prod" intent="primary" icon={<CloudArrowUpIcon />}>
                Deploy to Production (US-East)
              </MenuItem>
              <MenuItem id="staging" icon={<CloudArrowUpIcon />}>
                Deploy to Staging Cluster
              </MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>
      ),
    },
  ],
}
