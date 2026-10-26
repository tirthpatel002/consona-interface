import React from 'react'
import { ChordChart } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const chordMatrix = [
  [1200, 450, 890, 320],
  [670, 980, 410, 560],
  [890, 320, 1500, 420],
  [430, 780, 520, 1100],
]
const chordKeys = ['US-East', 'US-West', 'EU-Central', 'AP-South']

export const chordChartDoc: ComponentDocSpec = {
  id: 'chord-chart',
  name: 'ChordChart',
  component: ChordChart,
  summary: 'Inter-entity relationship visualizer showing circular matrix flows, bidirectional interconnect volume, and full compound composition.',
  subcomponents: [
    'ChordChart.Container',
    'ChordChart.Header',
    'ChordChart.Toolbar',
    'ChordChart.Legend',
    'ChordChart.Canvas',
    'ChordChart.Tooltip',
    'ChordChart.Empty',
    'ChordChart.Loading',
    'ChordChart.Footer',
  ],
  playground: {
    defaultProps: {
      padAngle: 0.04,
      innerRadiusRatio: 0.9,
      ribbonOpacity: 0.5,
      ribbonHoverOpacity: 0.85,
      palette: 'brand',
      containerVariant: 'default',
    },
    controls: [
      {
        name: 'padAngle',
        type: 'number',
        min: 0,
        max: 0.15,
        step: 0.01,
      },
      {
        name: 'innerRadiusRatio',
        type: 'number',
        min: 0.7,
        max: 0.95,
        step: 0.02,
      },
      {
        name: 'ribbonOpacity',
        type: 'number',
        min: 0.1,
        max: 0.9,
        step: 0.05,
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
    ],
    render: (props: any) => (
      <div className="w-full max-w-2xl p-4">
        <ChordChart
          data={chordMatrix}
          keys={chordKeys}
          title="Global Mesh Cross-Region Traffic"
          description="Bidirectional gigabit bandwidth exchange between cloud multi-region availability zones."
          badge="11.2 TB / s Mesh"
          height={360}
          {...props}
        />
      </div>
    ),
  },
  examples: [
    {
      title: 'Compound Composed Mesh Matrix',
      description: 'Using ChordChart.Container and ChordChart.Canvas for modular network topology cards.',
      render: () => (
        <div className="w-full max-w-2xl">
          <ChordChart
            data={chordMatrix}
            keys={chordKeys}
            palette="brand"
            padAngle={0.04}
            ribbonOpacity={0.45}
            height={280}
          >
            <ChordChart.Container variant="glass">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-fg">Cross-Region Mesh Bandwidth</h4>
                  <p className="text-xs text-muted-fg">Circular inter-datacenter bandwidth matrix</p>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono bg-primary/15 text-primary rounded font-semibold">11.2 TB/s</span>
              </div>
              <div className="p-2">
                <ChordChart.Canvas />
              </div>
              <div className="p-3 border-t border-border/40 text-xs text-muted-fg flex justify-between">
                <span>4 global regions connected</span>
                <span className="font-mono">Direct backbone routing</span>
              </div>
            </ChordChart.Container>
          </ChordChart>
        </div>
      ),
    },
    {
      title: 'Glassmorphic Multi-Region Matrix',
      description: 'Clean circular arc chords on glass card with violet palette.',
      render: () => (
        <div className="w-full">
          <ChordChart
            data={chordMatrix}
            keys={chordKeys}
            title="Availability Zone Interconnect"
            palette="violet"
            containerVariant="glass"
            padAngle={0.06}
            height={300}
          />
        </div>
      ),
    },
  ],
}
