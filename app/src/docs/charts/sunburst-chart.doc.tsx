import React from 'react'
import { SunburstChart } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const sunburstData = {
  name: 'Platform Core',
  children: [
    {
      name: 'Frontend',
      children: [
        { name: 'Design Tokens', value: 120 },
        { name: 'Components', value: 340 },
        { name: 'Hooks', value: 95 },
      ],
    },
    {
      name: 'Backend Services',
      children: [
        { name: 'Auth Server', value: 210 },
        { name: 'GraphQL Gateway', value: 290 },
        { name: 'Queue Workers', value: 180 },
      ],
    },
    {
      name: 'Infrastructure',
      children: [
        { name: 'Kubernetes', value: 380 },
        { name: 'Postgres Aurora', value: 240 },
        { name: 'Redis Cache', value: 130 },
      ],
    },
  ],
}

export const sunburstChartDoc: ComponentDocSpec = {
  id: 'sunburst-chart',
  name: 'SunburstChart',
  component: SunburstChart,
  summary: 'Multi-level radial hierarchy visualizer showing proportional relationships across nested entity layers, and full compound composition.',
  subcomponents: [
    'SunburstChart.Container',
    'SunburstChart.Header',
    'SunburstChart.Toolbar',
    'SunburstChart.Legend',
    'SunburstChart.Canvas',
    'SunburstChart.Tooltip',
    'SunburstChart.Empty',
    'SunburstChart.Loading',
    'SunburstChart.Footer',
  ],
  playground: {
    defaultProps: {
      cornerRadius: 4,
      borderWidth: 1,
      palette: 'brand',
      containerVariant: 'default',
      enableArcLabels: true,
    },
    controls: [
      {
        name: 'cornerRadius',
        type: 'number',
        min: 0,
        max: 8,
        step: 1,
      },
      {
        name: 'borderWidth',
        type: 'number',
        min: 0,
        max: 4,
        step: 1,
      },
      {
        name: 'palette',
        type: 'select',
        options: ['brand', 'categorical', 'emerald', 'amber', 'violet', 'monochrome'],
      },
      {
        name: 'containerVariant',
        type: 'select',
        options: ['default', 'glass', 'subtle', 'bordered', 'flat', 'glow'],
      },
      {
        name: 'enableArcLabels',
        type: 'boolean',
      },
    ],
    render: (props: any) => (
      <div className="w-full max-w-2xl p-4">
        <SunburstChart
          data={sunburstData}
          title="Monorepo Codebase Hierarchy"
          description="Radial distribution of codebase volume across nested architectural domains."
          badge="1,985 KLOC"
          height={340}
          {...props}
        />
      </div>
    ),
  },
  examples: [
    {
      title: 'Compound Composed Sunburst Card',
      description: 'Using SunburstChart.Container and SunburstChart.Canvas for modular code tree visualization.',
      render: () => (
        <div className="w-full max-w-2xl">
          <SunburstChart
            data={sunburstData}
            palette="brand"
            cornerRadius={4}
            height={280}
          >
            <SunburstChart.Container variant="glass">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-fg">Codebase Hierarchy Map</h4>
                  <p className="text-xs text-muted-fg">Radial domain topology</p>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono bg-primary/15 text-primary rounded font-semibold">1,985 KLOC</span>
              </div>
              <div className="p-2">
                <SunburstChart.Canvas />
              </div>
              <div className="p-3 border-t border-border/40 text-xs text-muted-fg flex justify-between">
                <span>3 architectural tiers</span>
                <span className="font-mono">AST indexed</span>
              </div>
            </SunburstChart.Container>
          </SunburstChart>
        </div>
      ),
    },
    {
      title: 'Glassmorphic Radial Sunburst',
      description: 'Modern nested arc hierarchy with frosted glass card.',
      render: () => (
        <div className="w-full">
          <SunburstChart
            data={sunburstData}
            title="System Components Breakdown"
            palette="violet"
            containerVariant="glass"
            cornerRadius={6}
            height={300}
          />
        </div>
      ),
    },
  ],
}
