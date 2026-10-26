import React from 'react'
import { HeatmapChart } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const hours = ['00h', '04h', '08h', '12h', '16h', '20h']

const heatmapData = days.map((day) => ({
  id: day,
  data: hours.map((hour) => ({
    x: hour,
    y: Math.floor(Math.random() * 80) + 10,
  })),
}))

export const heatmapChartDoc: ComponentDocSpec = {
  id: 'heatmap-chart',
  name: 'HeatmapChart',
  component: HeatmapChart,
  summary: 'Matrix density visualizer for calendar correlations, commit graphs, multi-dimensional heat indices, and full compound composition.',
  subcomponents: [
    'HeatmapChart.Container',
    'HeatmapChart.Header',
    'HeatmapChart.Toolbar',
    'HeatmapChart.Legend',
    'HeatmapChart.Canvas',
    'HeatmapChart.Tooltip',
    'HeatmapChart.Empty',
    'HeatmapChart.Loading',
    'HeatmapChart.Footer',
  ],
  playground: {
    defaultProps: {
      borderRadius: 0,
      padding: 0.15,
      palette: 'brand',
      containerVariant: 'default',
    },
    controls: [
      {
        name: 'borderRadius',
        type: 'number',
        min: 0,
        max: 12,
        step: 1,
      },
      {
        name: 'padding',
        type: 'number',
        min: 0,
        max: 0.4,
        step: 0.05,
      },
      {
        name: 'palette',
        type: 'select',
        options: ['brand', 'emerald', 'amber', 'violet', 'diverging'],
      },
      {
        name: 'containerVariant',
        type: 'select',
        options: ['default', 'glass', 'subtle', 'bordered', 'flat', 'glow'],
      },
    ],
    render: (props: any) => (
      <div className="w-full max-w-2xl p-4">
        <HeatmapChart
          data={heatmapData}
          title="Server Activity & Request Heat Index"
          description="Average requests per second distributed by day of week and 4-hour window."
          badge="90 req/s Peak"
          height={320}
          timeRanges={['1W', '1M', '3M', 'ALL']}
          defaultRange="1W"
          {...props}
        />
      </div>
    ),
  },
  examples: [
    {
      title: 'Compound Composed Heatmap Card',
      description: 'Using HeatmapChart.Container and HeatmapChart.Canvas to create customized telemetry status cards.',
      render: () => (
        <div className="w-full max-w-2xl">
          <HeatmapChart
            data={heatmapData}
            palette="emerald"
            borderRadius={0}
            height={260}
          >
            <HeatmapChart.Container variant="glass">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-fg">Cluster Hourly Load Matrix</h4>
                  <p className="text-xs text-muted-fg">Weekly traffic distribution</p>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono bg-emerald-500/15 text-emerald-500 rounded font-semibold">Low Jitter</span>
              </div>
              <div className="p-2">
                <HeatmapChart.Canvas />
              </div>
              <div className="p-3 border-t border-border/40 text-xs text-muted-fg flex justify-between">
                <span>7-day rolling window</span>
                <span className="font-mono">Peak: Fri 16:00 UTC</span>
              </div>
            </HeatmapChart.Container>
          </HeatmapChart>
        </div>
      ),
    },
    {
      title: 'Diverging Sentiment & Profit Matrix',
      description: 'Diverging color ramp for comparing positive vs negative variance.',
      render: () => (
        <div className="w-full">
          <HeatmapChart
            data={heatmapData}
            title="Weekly Sentiment Distribution"
            palette="diverging"
            containerVariant="glass"
            borderRadius={0}
            height={280}
          />
        </div>
      ),
    },
  ],
}
