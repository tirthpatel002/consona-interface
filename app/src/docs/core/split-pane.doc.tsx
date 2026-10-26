import React from 'react'
import {
  SplitPane,
  SplitPanePanel,
  SplitPaneHandle,
  SplitPaneFirst,
  SplitPaneSecond,
  Badge,
  Button,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'
import {
  FolderIcon,
  DocumentTextIcon,
  CommandLineIcon,
} from '@heroicons/react/20/solid'

export const splitPaneDoc: ComponentDocSpec = {
  id: 'split-pane',
  name: 'SplitPane',
  component: SplitPane,
  summary: 'Horizontal or vertical resizable layout container with draggable splitter handle, collapse boundaries, and keyboard step controls.',
  subcomponents: [
    'SplitPanePanel',
    'SplitPaneHandle',
    'SplitPaneDivider',
    'SplitPaneFirst',
    'SplitPaneSecond',
    'ResizablePanels',
  ],
  playground: {
    defaultProps: {
      orientation: 'horizontal',
      defaultSize: 40,
      minSize: 15,
      maxSize: 85,
      disabled: false,
    },
    controls: [
      { name: 'orientation', type: 'select', options: ['horizontal', 'vertical'] },
      { name: 'defaultSize', type: 'number', min: 10, max: 90, step: 5 },
      { name: 'minSize', type: 'number', min: 5, max: 30, step: 5 },
      { name: 'maxSize', type: 'number', min: 70, max: 95, step: 5 },
      { name: 'disabled', type: 'boolean' },
    ],
    render: (props: any) => (
      <div className="w-full max-w-2xl h-80 p-4">
        <SplitPane {...props} className="h-full border border-border bg-card">
          <SplitPaneFirst className="p-4 bg-muted/20">
            <div className="flex items-center gap-2 mb-3">
              <FolderIcon className="size-4 text-primary" />
              <span className="text-xs font-semibold text-fg">Project Tree</span>
            </div>
            <ul className="space-y-1 text-xs text-muted-fg font-mono">
              <li className="px-2 py-1 rounded-micro hover:bg-muted/40 text-fg">src/</li>
              <li className="pl-4 px-2 py-1 rounded-micro hover:bg-muted/40 text-fg">components/</li>
              <li className="pl-6 px-2 py-1 rounded-micro bg-primary/10 text-primary font-medium">split-pane.tsx</li>
              <li className="pl-6 px-2 py-1 rounded-micro hover:bg-muted/40">index.ts</li>
            </ul>
          </SplitPaneFirst>

          <SplitPaneHandle />

          <SplitPaneSecond className="p-4 bg-bg">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="size-4 text-primary" />
                <span className="text-xs font-semibold text-fg">Editor Buffer</span>
              </div>
              <Badge intent="success" size="sm">TypeScript</Badge>
            </div>
            <pre className="text-xs font-mono text-muted-fg leading-relaxed overflow-x-auto">
              {`export const SplitPane = createInterfaceComponent(\n  { name: 'SplitPane' },\n  SplitPanePrimitive\n)`}
            </pre>
          </SplitPaneSecond>
        </SplitPane>
      </div>
    ),
  },
  examples: [
    {
      title: 'IDE Split Workspace (Vertical Console)',
      description: 'Editor panel split vertically with terminal output console.',
      render: () => (
        <div className="w-full max-w-xl h-72 border border-border rounded-macro overflow-hidden bg-bg">
          <SplitPane orientation="vertical" defaultSize={65}>
            <SplitPaneFirst className="p-4">
              <span className="text-xs font-semibold text-fg">Main Code Workspace</span>
              <p className="mt-1 text-xs text-muted-fg leading-relaxed">
                Drag the horizontal divider below or focus and use arrow keys (Shift for 10% steps).
              </p>
            </SplitPaneFirst>
            <SplitPaneHandle />
            <SplitPaneSecond className="p-3 bg-muted/30 font-mono text-xs text-muted-fg">
              <div className="flex items-center gap-2 mb-2 text-fg font-semibold">
                <CommandLineIcon className="size-3.5" />
                <span>Integrated Terminal</span>
              </div>
              <p className="text-emerald-500">$ pnpm build:registry</p>
              <p className="text-muted-fg/80">⚡ 407 components indexed successfully.</p>
            </SplitPaneSecond>
          </SplitPane>
        </div>
      ),
    },
    {
      title: 'Custom Handle Render Prop with Snap Buttons',
      description: 'Customizing handle content to include snap-to-edge buttons.',
      render: () => (
        <div className="w-full max-w-xl h-64 border border-border rounded-macro overflow-hidden bg-bg">
          <SplitPane defaultSize={35}>
            <SplitPanePanel panel="first" className="p-4 bg-secondary/20">
              <span className="text-xs font-semibold text-fg">Sidebar Panel</span>
            </SplitPanePanel>
            <SplitPaneHandle>
              {({ collapseFirst, resetSplit, collapseSecond }) => (
                <div className="flex flex-col gap-1 p-1 bg-overlay border border-border rounded-base shadow-xs">
                  <button
                    type="button"
                    onClick={collapseFirst}
                    title="Collapse Left"
                    className="size-4 text-[9px] flex items-center justify-center rounded-atom hover:bg-muted font-mono"
                  >
                    «
                  </button>
                  <button
                    type="button"
                    onClick={resetSplit}
                    title="Center"
                    className="size-4 text-[9px] flex items-center justify-center rounded-atom hover:bg-muted font-mono"
                  >
                    •
                  </button>
                  <button
                    type="button"
                    onClick={collapseSecond}
                    title="Collapse Right"
                    className="size-4 text-[9px] flex items-center justify-center rounded-atom hover:bg-muted font-mono"
                  >
                    »
                  </button>
                </div>
              )}
            </SplitPaneHandle>
            <SplitPanePanel panel="second" className="p-4 bg-bg">
              <span className="text-xs font-semibold text-fg">Content Area</span>
            </SplitPanePanel>
          </SplitPane>
        </div>
      ),
    },
  ],
}
