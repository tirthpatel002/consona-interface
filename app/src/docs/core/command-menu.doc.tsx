import React, { useState } from 'react'
import {
  CommandMenu,
  CommandMenuSearch,
  CommandMenuList,
  CommandMenuSection,
  CommandMenuItem,
  CommandMenuFooter,
  CommandMenuSeparator,
  Button,
  Kbd,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'
import {
  CommandLineIcon,
  DocumentDuplicateIcon,
  PencilSquareIcon,
  TrashIcon,
  UserPlusIcon,
  Cog6ToothIcon,
  ArrowRightCircleIcon,
} from '@heroicons/react/20/solid'

export const commandMenuDoc: ComponentDocSpec = {
  id: 'command-menu',
  name: 'CommandMenu',
  component: CommandMenu,
  summary: 'Spotlight modal command palette with instant search filtering, keyboard shortcut execution, and group headers.',
  subcomponents: [
    'CommandMenuSearch',
    'CommandMenuList',
    'CommandMenuSection',
    'CommandMenuItem',
    'CommandMenuDescription',
    'CommandMenuSeparator',
    'CommandMenuFooter',
    'CommandMenuLabel',
    'CommandMenuShortcut',
    'CommandPalette',
  ],
  playground: {
    defaultProps: {
      size: 'lg',
      isPending: false,
      escapeButton: true,
    },
    controls: [
      { name: 'size', type: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] },
      { name: 'isPending', type: 'boolean' },
      { name: 'escapeButton', type: 'boolean' },
    ],
    render: (props: any) => {
      const [isOpen, setIsOpen] = useState(false)
      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8">
          <div className="text-center">
            <Button intent="primary" onPress={() => setIsOpen(true)}>
              <CommandLineIcon className="size-4 mr-1.5" />
              Open Command Palette
            </Button>
            <p className="mt-2 text-xs text-muted-fg">
              Or press <Kbd>⌘</Kbd> + <Kbd>K</Kbd> anywhere to trigger
            </p>
          </div>

          <CommandMenu
            isOpen={isOpen}
            onOpenChange={setIsOpen}
            shortcut="k"
            size={props.size}
            isPending={props.isPending}
            escapeButton={props.escapeButton}
          >
            <CommandMenuSearch placeholder="Type a command or search actions..." />
            <CommandMenuList>
              <CommandMenuSection title="Quick Actions">
                <CommandMenuItem
                  id="new-doc"
                  icon={<PencilSquareIcon />}
                  shortcut="⌘N"
                  onAction={() => {
                    alert('New Document created')
                    setIsOpen(false)
                  }}
                >
                  Create New Document
                </CommandMenuItem>
                <CommandMenuItem
                  id="clone"
                  icon={<DocumentDuplicateIcon />}
                  shortcut="⌘D"
                  onAction={() => {
                    alert('Duplicate triggered')
                    setIsOpen(false)
                  }}
                >
                  Clone Repository
                </CommandMenuItem>
                <CommandMenuItem
                  id="invite"
                  icon={<UserPlusIcon />}
                  shortcut="⌘I"
                  onAction={() => {
                    alert('Invite dialog opened')
                    setIsOpen(false)
                  }}
                >
                  Invite Team Member
                </CommandMenuItem>
              </CommandMenuSection>

              <CommandMenuSeparator />

              <CommandMenuSection title="Navigation">
                <CommandMenuItem
                  id="settings"
                  icon={<Cog6ToothIcon />}
                  shortcut="⌘,"
                  onAction={() => {
                    alert('Navigating to Settings')
                    setIsOpen(false)
                  }}
                >
                  Workspace Settings
                </CommandMenuItem>
                <CommandMenuItem
                  id="deployments"
                  icon={<ArrowRightCircleIcon />}
                  onAction={() => {
                    alert('Navigating to Deployments')
                    setIsOpen(false)
                  }}
                >
                  View Edge Deployments
                </CommandMenuItem>
              </CommandMenuSection>

              <CommandMenuSeparator />

              <CommandMenuSection title="Danger Zone">
                <CommandMenuItem
                  id="delete"
                  intent="danger"
                  icon={<TrashIcon />}
                  shortcut="⌫"
                  onAction={() => {
                    alert('Delete initiated')
                    setIsOpen(false)
                  }}
                >
                  Purge Cache & Logs
                </CommandMenuItem>
              </CommandMenuSection>
            </CommandMenuList>

            <CommandMenuFooter>
              <span>Navigate with <kbd>↑</kbd> <kbd>↓</kbd></span>
              <span>Select with <kbd>↵</kbd></span>
              <span>Dismiss with <kbd>esc</kbd></span>
            </CommandMenuFooter>
          </CommandMenu>
        </div>
      )
    },
  },
  examples: [
    {
      title: 'Async Loading Command Search',
      description: 'Command menu displaying animated loader during asynchronous backend queries.',
      render: () => {
        const [open, setOpen] = useState(false)
        return (
          <div>
            <Button intent="secondary" onPress={() => setOpen(true)}>
              Search Remote Services
            </Button>
            <CommandMenu isOpen={open} onOpenChange={setOpen} isPending>
              <CommandMenuSearch placeholder="Querying edge DNS mesh..." />
              <CommandMenuList>
                <CommandMenuSection title="Results">
                  <CommandMenuItem id="1">us-east-cluster-01.internal</CommandMenuItem>
                </CommandMenuSection>
              </CommandMenuList>
            </CommandMenu>
          </div>
        )
      },
    },
  ],
}
