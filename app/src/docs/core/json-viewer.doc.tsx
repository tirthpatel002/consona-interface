import React from 'react'
import { JsonViewer } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const sampleJson = {
  service: 'interface-kernel',
  version: '1.0.0',
  status: 'healthy',
  uptimeSeconds: 84920,
  features: {
    astRegistry: true,
    dynamicTheming: true,
    zeroTearing: true,
    maxConcurrentSessions: 1000,
  },
  clusterNodes: [
    { id: 'node-01', region: 'us-east-1', active: true, latencyMs: 1.2 },
    { id: 'node-02', region: 'us-west-2', active: true, latencyMs: 14.8 },
    { id: 'node-03', region: 'eu-west-1', active: false, latencyMs: null },
  ],
  metadata: {
    maintainer: 'Consona Design Systems',
    tags: ['react-aria', 'tailwind-v4', 'web-components'],
  },
}

export const jsonViewerDoc: ComponentDocSpec = {
  id: 'json-viewer',
  name: 'JsonViewer',
  component: JsonViewer,
  summary: 'Collapsible syntax-colored JSON tree visualizer with search auto-expansion, match navigation, auto-scrolling, depth controls, and subtree clipboard copy.',
  subcomponents: ['JsonViewer'],
  playground: {
    defaultProps: {
      initialExpandedDepth: 1,
      searchable: true,
      copyable: true,
      showControls: true,
      maxHeight: 340,
    },
    controls: [
      { name: 'initialExpandedDepth', type: 'number', min: 1, max: 5, step: 1 },
      { name: 'searchable', type: 'boolean' },
      { name: 'copyable', type: 'boolean' },
      { name: 'showControls', type: 'boolean' },
    ],
    render: (props: any) => (
      <div className="w-full max-w-xl p-4">
        <JsonViewer data={sampleJson} {...props} />
      </div>
    ),
  },
  examples: [
    {
      title: 'Deep Nested Search & Match Scrolling',
      description: 'Type "latencyMs" or "tags" into the search bar — the viewer auto-expands ancestor branches, scrolls the match into view, and lets you navigate matches with Enter/Shift+Enter. Hover any node to copy its complete JSON value with all nested children.',
      render: () => (
        <div className="w-full max-w-lg">
          <JsonViewer
            data={{
              cluster: {
                name: 'production-us-east',
                datacenter: {
                  tier: 4,
                  zones: [
                    { zone: 'us-east-1a', healthy: true, nodes: 48, p99Latency: '1.4ms' },
                    { zone: 'us-east-1b', healthy: true, nodes: 52, p99Latency: '1.8ms' },
                    { zone: 'us-east-1c', healthy: false, nodes: 12, p99Latency: '45.2ms' },
                  ],
                },
                security: {
                  mTLS: true,
                  cipherSuites: ['TLS_AES_256_GCM_SHA384', 'TLS_CHACHA20_POLY1305_SHA256'],
                  rotationDays: 30,
                },
              },
            }}
            initialExpandedDepth={1}
            maxHeight={260}
          />
        </div>
      ),
    },
    {
      title: 'Compact Inspector without Controls',
      description: 'JsonViewer embedded inside a small diagnostics card with controls hidden.',
      render: () => (
        <div className="w-full max-w-md">
          <JsonViewer
            data={{
              responseCode: 200,
              message: 'Authentication token verified',
              authenticated: true,
              scopes: ['read:components', 'write:registry'],
            }}
            showControls={false}
            initialExpandedDepth={3}
            maxHeight={200}
          />
        </div>
      ),
    },
  ],
}
