import React, { useState } from 'react'
import {
  GridList,
  GridListItem,
  GridListHeader,
  GridListSection,
  Badge,
  Button,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'
import {
  FolderIcon,
  DocumentIcon,
  CodeBracketSquareIcon,
  TrashIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/20/solid'

interface AssetFile {
  id: string
  name: string
  type: string
  size: string
  updatedAt: string
}

const documentAssets: AssetFile[] = [
  { id: '1', name: 'Q3_Architecture_Report.pdf', type: 'PDF Document', size: '4.8 MB', updatedAt: '2 hours ago' },
  { id: '2', name: 'Security_Audit_2026.docx', type: 'Word Document', size: '1.2 MB', updatedAt: 'Yesterday' },
  { id: '3', name: 'Design_System_Spec.fig', type: 'Design File', size: '34.5 MB', updatedAt: '3 days ago' },
]

const codeAssets: AssetFile[] = [
  { id: '4', name: 'data-table.module.ts', type: 'TypeScript', size: '48 KB', updatedAt: '10 mins ago' },
  { id: '5', name: 'tailwind.config.ts', type: 'TypeScript', size: '4 KB', updatedAt: '5 hours ago' },
  { id: '6', name: 'theme-contract.css', type: 'CSS Stylesheet', size: '18 KB', updatedAt: 'Just now' },
]

export const gridListDoc: ComponentDocSpec = {
  id: 'grid-list',
  name: 'GridList',
  component: GridList,
  badge: 'Core Atom',
  summary: 'Interactive selectable list supporting single or multiple item selection, section headers, drag-and-drop handles, and keyboard roving navigation.',
  subcomponents: ['GridListItem', 'GridListHeader', 'GridListSection'],
  playground: {
    defaultProps: {
      selectionMode: 'multiple',
    },
    controls: [
      {
        name: 'selectionMode',
        type: 'select',
        options: ['none', 'single', 'multiple'],
      },
    ],
    render: (props: any) => {
      const [selectedKeys, setSelectedKeys] = useState<any>(new Set(['1', '3']))

      return (
        <div className="w-full max-w-lg">
          <GridList
            aria-label="File Repository Assets"
            selectionMode={props.selectionMode}
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
          >
            {documentAssets.map((asset) => (
              <GridListItem key={asset.id} id={asset.id} textValue={asset.name}>
                <div className="flex items-center gap-3 w-full py-1">
                  <DocumentIcon className="size-5 text-primary shrink-0" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium text-fg truncate text-sm">{asset.name}</span>
                    <span className="text-xs text-muted-fg">{asset.type} • {asset.size}</span>
                  </div>
                  <Badge intent="outline" className="text-xs shrink-0">{asset.updatedAt}</Badge>
                </div>
              </GridListItem>
            ))}
          </GridList>
        </div>
      )
    },
  },
  examples: [
    {
      title: 'Grouped Sections with Headers',
      description: 'Organize items into categorized sections using GridListSection and GridListHeader.',
      render: () => {
        const [selected, setSelected] = useState<any>(new Set(['4']))

        return (
          <div className="w-full max-w-lg">
            <GridList
              aria-label="Workspace Library Assets"
              selectionMode="multiple"
              selectedKeys={selected}
              onSelectionChange={setSelected}
            >
              <GridListSection>
                <GridListHeader>
                  <div className="flex items-center gap-1.5 font-semibold text-fg">
                    <FolderIcon className="size-4 text-primary" />
                    Documents & Specifications
                  </div>
                </GridListHeader>
                {documentAssets.slice(0, 2).map((item) => (
                  <GridListItem key={item.id} id={item.id} textValue={item.name}>
                    <div className="flex items-center gap-2 py-0.5">
                      <DocumentIcon className="size-4 text-muted-fg" />
                      <span className="text-sm">{item.name}</span>
                    </div>
                  </GridListItem>
                ))}
              </GridListSection>

              <GridListSection>
                <GridListHeader>
                  <div className="flex items-center gap-1.5 font-semibold text-fg">
                    <CodeBracketSquareIcon className="size-4 text-accent" />
                    Source Modules
                  </div>
                </GridListHeader>
                {codeAssets.map((item) => (
                  <GridListItem key={item.id} id={item.id} textValue={item.name}>
                    <div className="flex items-center gap-2 py-0.5">
                      <CodeBracketSquareIcon className="size-4 text-muted-fg" />
                      <span className="text-sm font-mono text-xs">{item.name}</span>
                    </div>
                  </GridListItem>
                ))}
              </GridListSection>
            </GridList>
          </div>
        )
      },
    },
    {
      title: 'Single Selection & Item Action Buttons',
      description: 'Compact single-choice list with integrated contextual actions.',
      render: () => {
        const [activeId, setActiveId] = useState<any>(new Set(['1']))

        return (
          <div className="w-full max-w-lg">
            <GridList
              aria-label="Single File Selection"
              selectionMode="single"
              selectedKeys={activeId}
              onSelectionChange={setActiveId}
            >
              {documentAssets.map((asset) => (
                <GridListItem key={asset.id} id={asset.id} textValue={asset.name}>
                  <div className="flex items-center justify-between w-full py-1">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{asset.name}</span>
                      <span className="text-xs text-muted-fg">{asset.size}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        intent="secondary"
                        onPress={() => alert(`Downloaded ${asset.name}`)}
                        aria-label={`Download ${asset.name}`}
                      >
                        <ArrowDownTrayIcon className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </GridListItem>
              ))}
            </GridList>
          </div>
        )
      },
    },
  ],
  recipes: [
    {
      title: 'Configuring Checkbox Mode via GridList.extend()',
      description: 'Pre-configure a multi-select asset manager list with toggle selection behavior.',
      code: `export const AssetPickerList = GridList.extend({\n  name: 'AssetPickerList',\n  props: {\n    selectionMode: 'multiple',\n    selectionBehavior: 'toggle',\n  },\n})`,
    },
  ],
  a11yNotes: [
    'Complies with WAI-ARIA Listbox / Grid pattern with full arrow key roving focus.',
    'Provides selection announcement for screen readers on space or enter keystrokes.',
  ],
}
