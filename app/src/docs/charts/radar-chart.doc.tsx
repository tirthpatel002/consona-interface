import React from 'react'
import { RadarChart } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const radarData = [
  { metric: 'Speed', 'v1.0 (Legacy)': 65, 'v2.0 (NextGen)': 92 },
  { metric: 'Reliability', 'v1.0 (Legacy)': 75, 'v2.0 (NextGen)': 98 },
  { metric: 'Scalability', 'v1.0 (Legacy)': 60, 'v2.0 (NextGen)': 95 },
  { metric: 'DX & Tooling', 'v1.0 (Legacy)': 80, 'v2.0 (NextGen)': 88 },
  { metric: 'Security', 'v1.0 (Legacy)': 85, 'v2.0 (NextGen)': 94 },
  { metric: 'Efficiency', 'v1.0 (Legacy)': 55, 'v2.0 (NextGen)': 89 },
]

export const radarChartDoc: ComponentDocSpec = {
  id: 'radar-chart',
  name: 'RadarChart',
  component: RadarChart,
  summary: 'Multivariate radar / spider visualizer comparing feature dimensions, architectural benchmarks, and full compound composition.',
  subcomponents: [
    'RadarChart.Container',
    'RadarChart.Header',
    'RadarChart.Toolbar',
    'RadarChart.Legend',
    'RadarChart.Canvas',
    'RadarChart.Tooltip',
    'RadarChart.Empty',
    'RadarChart.Loading',
    'RadarChart.Footer',
  ],
  playground: {
    defaultProps: {
      keys: ['v1.0 (Legacy)', 'v2.0 (NextGen)'],
      indexBy: 'metric',
      curve: 'linearClosed',
      palette: 'brand',
      containerVariant: 'default',
      gridShape: 'circular',
      fillOpacity: 0.25,
      enableDots: true,
    },
    controls: [
      {
        name: 'curve',
        type: 'select',
        options: ['linearClosed', 'catmullRomClosed', 'basisClosed'],
      },
      {
        name: 'gridShape',
        type: 'select',
        options: ['circular', 'linear'],
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
        name: 'enableDots',
        type: 'boolean',
      },
      {
        name: 'fillOpacity',
        type: 'number',
        min: 0.05,
        max: 0.8,
        step: 0.05,
      },
    ],
    render: (props: any) => (
      <div className="w-full max-w-2xl p-4">
        <RadarChart
          data={radarData}
          keys={['v1.0 (Legacy)', 'v2.0 (NextGen)']}
          indexBy="metric"
          title="Engine Capability Index"
          description="Architecture capability scoring across key production dimensions."
          badge="+38% Overall"
          height={340}
          {...props}
        />
      </div>
    ),
  },
  examples: [
    {
      title: 'Compound Composed Radar Visualizer',
      description: 'Using RadarChart.Container and RadarChart.Canvas for modular architecture benchmarking.',
      render: () => (
        <div className="w-full max-w-2xl">
          <RadarChart
            data={radarData}
            keys={['v2.0 (NextGen)']}
            indexBy="metric"
            palette="brand"
            gridShape="circular"
            curve="catmullRomClosed"
            height={260}
          >
            <RadarChart.Container variant="glass">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-fg">NextGen System Matrix</h4>
                  <p className="text-xs text-muted-fg">Radar evaluation across core performance vectors</p>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono bg-primary/15 text-primary rounded font-semibold">Score: 94/100</span>
              </div>
              <div className="p-2">
                <RadarChart.Canvas />
              </div>
              <div className="p-3 border-t border-border/40 text-xs text-muted-fg flex justify-between">
                <span>6 dimensions evaluated</span>
                <span className="font-mono">Benchmarked against Tier 1 SLA</span>
              </div>
            </RadarChart.Container>
          </RadarChart>
        </div>
      ),
    },
    {
      title: 'Polygonal Grid with Smooth Curves',
      description: 'Linear grid shape with Catmull-Rom closed smoothing.',
      render: () => (
        <div className="w-full">
          <RadarChart
            data={radarData}
            keys={['v2.0 (NextGen)']}
            indexBy="metric"
            title="v2.0 Architectural Profile"
            gridShape="linear"
            curve="catmullRomClosed"
            palette="emerald"
            containerVariant="glass"
            height={280}
          />
        </div>
      ),
    },
  ],
}
