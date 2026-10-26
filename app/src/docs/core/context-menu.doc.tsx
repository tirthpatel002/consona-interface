import React from 'react'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSection,
  ContextMenuSeparator,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'
import {
  DocumentDuplicateIcon,
  PencilSquareIcon,
  TrashIcon,
  ShareIcon,
  ArrowTopRightOnSquareIcon,
  FolderArrowDownIcon,
} from '@heroicons/react/20/solid'

export const contextMenuDoc: ComponentDocSpec = {
  id: 'context-menu',
  name: 'ContextMenu',
  component: ContextMenu,
  summary: 'Right-click contextual action menu anchored to mouse pointer coordinates with optical tokens and nested actions.',
  subcomponents: [
    'ContextMenuTrigger',
    'ContextMenuContent',
    'ContextMenuItem',
    'ContextMenuSection',
    'ContextMenuHeader',
    'ContextMenuSeparator',
    'ContextMenuShortcut',
    'ContextMenuSub',
  ],
  playground: {
    defaultProps: {
      placement: 'bottom start',
      offset: 4,
    },
    controls: [
      { name: 'placement', type: 'select', options: ['bottom start', 'bottom end', 'top start', 'top end', 'left', 'right'] },
      { name: 'offset', type: 'number', min: 0, max: 20, step: 2 },
    ],
    render: (props: any) => {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <ContextMenu>
            <ContextMenuTrigger className="flex h-48 w-80 flex-col items-center justify-center rounded-macro border-2 border-dashed border-border/80 bg-muted/20 p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/40">
              <div className="size-10 rounded-full bg-secondary flex items-center justify-center mb-2">
                <FolderArrowDownIcon className="size-5 text-primary" />
              </div>
              <span className="text-sm font-semibold text-fg">Project Asset Container</span>
              <span className="mt-1 text-xs text-muted-fg">
                Right-click anywhere inside this box to trigger the context menu
              </span>
            </ContextMenuTrigger>

            <ContextMenuContent
              placement={props.placement}
              offset={props.offset}
            >
              <ContextMenuSection title="Asset Actions">
                <ContextMenuItem id="edit" icon={<PencilSquareIcon />} shortcut="⌘E">
                  Edit Metadata
                </ContextMenuItem>
                <ContextMenuItem id="duplicate" icon={<DocumentDuplicateIcon />} shortcut="⌘D">
                  Make Copy
                </ContextMenuItem>
                <ContextMenuItem id="share" icon={<ShareIcon />} shortcut="⌘S">
                  Share Link
                </ContextMenuItem>
              </ContextMenuSection>

              <ContextMenuSeparator />

              <ContextMenuSection title="Management">
                <ContextMenuItem id="open-new" icon={<ArrowTopRightOnSquareIcon />}>
                  Open in New Tab
                </ContextMenuItem>
                <ContextMenuItem id="delete" intent="danger" icon={<TrashIcon />} shortcut="⌫">
                  Delete Asset
                </ContextMenuItem>
              </ContextMenuSection>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      )
    },
  },
  examples: [
    {
      title: 'Context Menu on Media Card',
      description: 'Right-click menu applied to individual item cards in a grid.',
      render: () => (
        <ContextMenu>
          <ContextMenuTrigger className="group relative flex items-center gap-3 rounded-base border border-border p-3 hover:bg-muted/50 cursor-context-menu">
            <div className="size-8 rounded-atom bg-primary/10 flex items-center justify-center text-primary font-mono text-xs font-bold">
              MP4
            </div>
            <div>
              <div className="text-xs font-medium text-fg">demo-presentation.mp4</div>
              <div className="text-[11px] text-muted-fg">24.5 MB • Right click for options</div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem id="download">Download File</ContextMenuItem>
            <ContextMenuItem id="rename">Rename</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem id="remove" intent="danger">Remove</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ),
    },
  ],
}
