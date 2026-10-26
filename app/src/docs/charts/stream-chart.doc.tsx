import React from 'react'
import { StreamChart } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const streamData = [
  { 'Direct': 45, 'Social': 28, 'Organic': 85, 'Referral': 32 },
  { 'Direct': 62, 'Social': 34, 'Organic': 110, 'Referral': 45 },
  { 'Direct': 80, 'Social': 48, 'Organic': 140, 'Referral': 60 },
  { 'Direct': 95, 'Social': 55, 'Organic': 180, 'Referral': 75 },
  { 'Direct': 120, 'Social': 70, 'Organic': 220, 'Referral': 90 },
  { 'Direct': 140, 'Social': 85, 'Organic': 260, 'Referral': 110 },
  { 'Direct': 165, 'Social': 100, 'Organic': 310, 'Referral': 130 },
  { 'Direct': 180, 'Social': 115, 'Organic': 350, 'Referral': 145 },
]

export const streamChartDoc: ComponentDocSpec = {
  id: 'stream-chart',
  name: 'StreamChart',
  component: StreamChart,
  summary: 'Organic stacked streamgraph visualizer displaying dynamic volumetric trends, rhythmic category oscillations, and full compound composition.',
  subcomponents: [
    'StreamChart.Container',
    'StreamChart.Header',
    'StreamChart.Toolbar',
    'StreamChart.Legend',
    'StreamChart.Canvas',
    'StreamChart.Tooltip',
    'StreamChart.Empty',
    'StreamChart.Loading',
    'StreamChart.Footer',
  ],
  playground: {
    defaultProps: {
      keys: ['Direct', 'Social', 'Organic', 'Referral'],
      offsetType: 'silhouette',
      curve: 'catmullRom',
      palette: 'brand',
      containerVariant: 'default',
      fillOpacity: 0.85,
    },
    controls: [
      {
        name: 'offsetType',
        type: 'select',
        options: ['silhouette', 'wiggle', 'expand', 'diverging', 'none'],
      },
      {
        name: 'curve',
        type: 'select',
        options: ['catmullRom', 'natural', 'basis', 'linear', 'step'],
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
        name: 'fillOpacity',
        type: 'number',
        min: 0.2,
        max: 1,
        step: 0.05,
      },
    ],
    render: (props: any) => (
      <div className="w-full max-w-2xl p-4">
        <StreamChart
          data={streamData}
          keys={['Direct', 'Social', 'Organic', 'Referral']}
          title="Inbound Traffic Streams"
          description="Continuous volumetric channel flow over consecutive weekly cohorts."
          badge="790k Visitors"
          height={340}
          timeRanges={['1M', '3M', '6M', '1Y', 'ALL']}
          defaultRange="3M"
          {...props}
        />
      </div>
    ),
  },
  examples: [
    {
      title: 'Compound Composed Streamgraph Card',
      description: 'Using StreamChart.Container and StreamChart.Canvas for volumetric telemetry cards.',
      render: () => (
        <div className="w-full max-w-2xl">
          <StreamChart
            data={streamData}
            keys={['Direct', 'Social', 'Organic', 'Referral']}
            palette="brand"
            offsetType="silhouette"
            curve="catmullRom"
            height={260}
          >
            <StreamChart.Container variant="glass">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-fg">Multi-Channel Inbound Volume</h4>
                  <p className="text-xs text-muted-fg">Continuous volumetric traffic flow</p>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono bg-primary/15 text-primary rounded font-semibold">790k Peak</span>
              </div>
              <div className="p-2">
                <StreamChart.Canvas />
              </div>
              <div className="p-3 border-t border-border/40 text-xs text-muted-fg flex justify-between">
                <span>4 traffic segments</span>
                <span className="font-mono">Catmull-Rom interpolation</span>
              </div>
            </StreamChart.Container>
          </StreamChart>
        </div>
      ),
    },
    {
      title: 'Wiggle Silhouette with Violet Palette',
      description: 'Dynamic organic wave flow using wiggle centering.',
      render: () => (
        <div className="w-full">
          <StreamChart
            data={streamData}
            keys={['Direct', 'Social', 'Organic', 'Referral']}
            title="Channel Stream Dynamics"
            offsetType="wiggle"
            palette="violet"
            containerVariant="glass"
            height={280}
          />
        </div>
      ),
    },
  ],
}
