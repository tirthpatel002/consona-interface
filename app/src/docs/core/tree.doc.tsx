import React, { useState } from 'react'
import {
  Tree,
  TreeItem,
  TreeContent,
  Badge,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'
import {
  FolderIcon,
  FolderOpenIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/20/solid'

interface FileNode {
  id: string
  name: string
  type: 'folder' | 'file'
  extension?: string
  children?: FileNode[]
}

const fileTreeData: FileNode[] = [
  {
    id: 'src',
    name: 'src',
    type: 'folder',
    children: [
      {
        id: 'components',
        name: 'components',
        type: 'folder',
        children: [
          { id: 'button.tsx', name: 'button.tsx', type: 'file', extension: 'tsx' },
          { id: 'data-table.tsx', name: 'data-table.tsx', type: 'file', extension: 'tsx' },
          { id: 'tree.tsx', name: 'tree.tsx', type: 'file', extension: 'tsx' },
        ],
      },
      {
        id: 'styles',
        name: 'styles',
        type: 'folder',
        children: [
          { id: 'globals.css', name: 'globals.css', type: 'file', extension: 'css' },
          { id: 'tokens.css', name: 'tokens.css', type: 'file', extension: 'css' },
        ],
      },
      { id: 'index.ts', name: 'index.ts', type: 'file', extension: 'ts' },
    ],
  },
  {
    id: 'public',
    name: 'public',
    type: 'folder',
    children: [
      { id: 'favicon.ico', name: 'favicon.ico', type: 'file', extension: 'ico' },
      { id: 'manifest.json', name: 'manifest.json', type: 'file', extension: 'json' },
    ],
  },
  { id: 'package.json', name: 'package.json', type: 'file', extension: 'json' },
  { id: 'tsconfig.json', name: 'tsconfig.json', type: 'file', extension: 'json' },
]

export const treeDoc: ComponentDocSpec = {
  id: 'tree',
  name: 'Tree',
  component: Tree,
  badge: 'Core Atom',
  summary: 'Hierarchical nested tree view with branch collapse/expansion, tree line guides, keyboard navigation, and single or multi-selection.',
  subcomponents: ['TreeItem', 'TreeContent', 'TreeIndicator'],
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
      const [expandedKeys, setExpandedKeys] = useState<any>(new Set(['src', 'components']))
      const [selectedKeys, setSelectedKeys] = useState<any>(new Set(['button.tsx']))

      const renderTreeItem = (item: FileNode) => (
        <TreeItem key={item.id} id={item.id} textValue={item.name}>
          <TreeContent>
            <div className="flex items-center gap-2 py-0.5 min-w-0">
              {item.type === 'folder' ? (
                <FolderIcon className="size-4 text-primary shrink-0" />
              ) : (
                <DocumentTextIcon className="size-4 text-muted-fg shrink-0" />
              )}
              <span className="truncate text-sm font-mono">{item.name}</span>
            </div>
          </TreeContent>
          {item.children?.map(renderTreeItem)}
        </TreeItem>
      )

      return (
        <div className="w-full max-w-md p-4 rounded-base border border-border bg-card">
          <Tree
            aria-label="Repository Source Tree"
            selectionMode={props.selectionMode}
            expandedKeys={expandedKeys}
            onExpandedChange={setExpandedKeys}
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
          >
            {fileTreeData.map(renderTreeItem)}
          </Tree>
        </div>
      )
    },
  },
  examples: [
    {
      title: 'Project Organization Hierarchy with Status Badges',
      description: 'Render rich custom labels, badges, and icons for deep navigational branches.',
      render: () => {
        const [expanded, setExpanded] = useState<any>(new Set(['src', 'components']))
        const [selected, setSelected] = useState<any>(new Set(['data-table.tsx']))

        return (
          <div className="w-full max-w-lg p-4 rounded-base border border-border bg-card">
            <Tree
              aria-label="Component Registry Tree"
              selectionMode="single"
              expandedKeys={expanded}
              onExpandedChange={setExpanded}
              selectedKeys={selected}
              onSelectionChange={setSelected}
            >
              {fileTreeData.map(function renderNode(node): any {
                return (
                  <TreeItem key={node.id} id={node.id} textValue={node.name}>
                    <TreeContent>
                      <div className="flex items-center justify-between w-full pr-2 py-0.5">
                        <div className="flex items-center gap-2">
                          {node.type === 'folder' ? (
                            <FolderIcon className="size-4 text-primary" />
                          ) : (
                            <CodeBracketIcon className="size-4 text-accent" />
                          )}
                          <span className="text-xs font-mono font-medium">{node.name}</span>
                        </div>
                        {node.type === 'file' && (
                          <Badge intent="outline" className="text-[10px] uppercase font-mono px-1 py-0">
                            {node.extension}
                          </Badge>
                        )}
                      </div>
                    </TreeContent>
                    {node.children?.map(renderNode)}
                  </TreeItem>
                )
              })}
            </Tree>
          </div>
        )
      },
    },
  ],
  recipes: [
    {
      title: 'Custom File Explorer via Tree.extend()',
      description: 'Defaulting tree selection behaviors and active styling token presets.',
      code: `export const ProjectTree = Tree.extend({\n  name: 'ProjectTree',\n  props: {\n    selectionMode: 'single',\n  },\n})`,
    },
  ],
  a11yNotes: [
    'Complies with WAI-ARIA Treeview pattern using arrow keys to expand/collapse (Right/Left) and navigate (Up/Down).',
    'Exposes aria-expanded state on expandable parent branch nodes.',
    'Screen readers announce node depth level automatically via CSS variable calculations.',
  ],
}
