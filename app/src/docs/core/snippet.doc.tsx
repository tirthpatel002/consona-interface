import React from 'react'
import { Snippet } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const TS_SAMPLE = `import { createInterfaceComponent } from '../../core/component-factory'
import { Note } from '../note'

export interface BannerProps {
  /** Status copy shown inside the note. */
  message?: string
}

export function Banner({ message = 'Ready to ship.' }: BannerProps) {
  return (
    <Note intent="success" isDismissible>
      {message}
    </Note>
  )
}

export const ShippingBanner = createInterfaceComponent<BannerProps>(
  {
    name: 'ShippingBanner',
    category: 'feedback',
    description: 'Preconfigured success note for release banners.',
    version: '1.0.0',
    props: { message: 'Ready to ship.' },
  },
  Banner
)
`

const REACT_SAMPLE = `import { useState } from 'react'
import { Button, Progress, Snippet, ToastQueue } from '@consona/interface'

export function PublishPanel() {
  const [progress, setProgress] = useState(12)

  return (
    <div className="flex flex-col gap-space-lg">
      <Progress value={progress} showValue>
        <Progress.Header>Uploading bundle</Progress.Header>
        <Progress.Track intent="primary" />
      </Progress>
      <Snippet variant="block" language="bash" maxLines={8}>
        pnpm interface build --registry
      </Snippet>
      <Button
        intent="primary"
        onPress={() => {
          setProgress(100)
          ToastQueue.success('Bundle published')
        }}
      >
        Publish
      </Button>
    </div>
  )
}
`

const CSS_SAMPLE = `@layer components {
  [data-slot='snippet'] {
    border-color: color-mix(in oklab, var(--border) 70%, transparent);
    background: var(--bg);
  }

  [data-slot='snippet-highlight'] {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    line-height: 1.25rem;
    overflow-x: auto;
    white-space: pre;
  }

  [data-slot='snippet'] [data-slot='button'] {
    color: var(--muted-fg);
    border-color: color-mix(in oklab, var(--border) 50%, transparent);
  }
}
`

const BASH_SAMPLE = `#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/interface-enhanced"

pnpm install
pnpm exec tsc -p tsconfig.json --noEmit
node --experimental-strip-types src/registry/builder.ts

echo "Registry compiled. Opening workbench..."
cd "$ROOT/interface-enhanced-demo"
pnpm dev --host --port 5175
`

const JSON_SAMPLE = `{
  "name": "@consona/interface",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./snippet": "./src/modules/core/components/snippet/index.ts",
    "./registry": "./src/registry/index.ts"
  },
  "scripts": {
    "type-check": "tsc -p tsconfig.json --noEmit",
    "build:registry": "node --experimental-strip-types src/registry/builder.ts"
  }
}
`

function PlaygroundSnippet() {
  return (
    <Snippet.Tabs defaultSelectedKey="ts" className="w-full max-w-2xl">
      <Snippet.List>
        <Snippet.Tab id="ts">TypeScript</Snippet.Tab>
        <Snippet.Tab id="tsx">React</Snippet.Tab>
        <Snippet.Tab id="css">CSS</Snippet.Tab>
        <Snippet.Tab id="bash">Bash</Snippet.Tab>
        <Snippet.Tab id="json">JSON</Snippet.Tab>
      </Snippet.List>
      <Snippet.Panel id="ts" code={TS_SAMPLE}>
        {TS_SAMPLE}
      </Snippet.Panel>
      <Snippet.Panel id="tsx" code={REACT_SAMPLE}>
        {REACT_SAMPLE}
      </Snippet.Panel>
      <Snippet.Panel id="css" code={CSS_SAMPLE}>
        {CSS_SAMPLE}
      </Snippet.Panel>
      <Snippet.Panel id="bash" code={BASH_SAMPLE}>
        {BASH_SAMPLE}
      </Snippet.Panel>
      <Snippet.Panel id="json" code={JSON_SAMPLE}>
        {JSON_SAMPLE}
      </Snippet.Panel>
    </Snippet.Tabs>
  )
}

export const snippetDoc: ComponentDocSpec = {
  id: 'snippet',
  name: 'Snippet',
  component: Snippet,
  summary: 'Inline or block code snippet with copy-to-clipboard, highlight slot, and multi-line collapse.',
  subcomponents: ['SnippetCopyButton', 'SnippetHighlight', 'SnippetTabs'],
  playground: {
    defaultProps: {},
    controls: [],
    defaultHeight: 'tall',
    defaultLayout: 'stacked',
    render: () => (
      <div className="w-full p-4">
        <PlaygroundSnippet />
      </div>
    ),
  },
  examples: [
    {
      title: 'Inline snippet',
      description: 'Compact chip for a single command.',
      render: () => <Snippet variant="inline" code="pnpm add @consona/interface" />,
    },
    {
      title: 'Tabbed files',
      description: 'Five language tabs with longer sources and a per-panel copy control.',
      minHeight: 420,
      render: () => <PlaygroundSnippet />,
    },
  ],
}
