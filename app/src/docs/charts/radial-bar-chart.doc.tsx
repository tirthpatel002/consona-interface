import React from 'react'
import { RadialBarChart } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const radialBarData = [
  {
    id: 'Target Goal A',
    data: [{ x: 'Goal A', y: 88 }],
  },
  {
    id: 'Target Goal B',
    data: [{ x: 'Goal B', y: 72 }],
  },
  {
    id: 'Target Goal C',
    data: [{ x: 'Goal C', y: 54 }],
  },
  {
    id: 'Target Goal D',
    data: [{ x: 'Goal D', y: 95 }],
  },
]

export const radialBarChartDoc: ComponentDocSpec = {
  id: 'radial-bar-chart',
  name: 'RadialBarChart',
  component: RadialBarChart,
  summary: 'Circular progress gauge and radial bar visualizer ideal for KPI target rings, activity tracking, and full compound composition.',
  subcomponents: [
    'RadialBarChart.Container',
    'RadialBarChart.Header',
    'RadialBarChart.Toolbar',
    'RadialBarChart.Legend',
    'RadialBarChart.Canvas',
    'RadialBarChart.Tooltip',
    'RadialBarChart.Empty',
    'RadialBarChart.Loading',
    'RadialBarChart.Footer',
  ],
  playground: {
    defaultProps: {
      innerRadius: 0.3,
      padAngle: 2,
      cornerRadius: 6,
      palette: 'brand',
      containerVariant: 'default',
      circularGrid: true,
      tracks: true,
    },
    controls: [
      {
        name: 'innerRadius',
        type: 'number',
        min: 0.1,
        max: 0.6,
        step: 0.05,
      },
      {
        name: 'padAngle',
        type: 'number',
        min: 0,
        max: 5,
        step: 0.5,
      },
      {
        name: 'cornerRadius',
        type: 'number',
        min: 0,
        max: 12,
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
        name: 'circularGrid',
        type: 'boolean',
      },
      {
        name: 'tracks',
        type: 'boolean',
      },
    ],
    render: (props: any) => (
      <div className="w-full max-w-2xl p-4">
        <RadialBarChart
          data={radialBarData}
          title="Quarterly Objectives"
          description="Progress fulfillment across key strategic OKRs."
          badge="82% Average"
          height={340}
          {...props}
        />
      </div>
    ),
  },
  examples: [
    {
      title: 'Compound Composed Target Gauge',
      description: 'Using RadialBarChart.Container and RadialBarChart.Canvas to create customized OKR gauge cards.',
      render: () => (
        <div className="w-full max-w-2xl">
          <RadialBarChart
            data={radialBarData}
            palette="emerald"
            cornerRadius={8}
            innerRadius={0.35}
            height={260}
          >
            <RadialBarChart.Container variant="glass">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-fg">Engineering Sprint Targets</h4>
                  <p className="text-xs text-muted-fg">Current milestone completion rates</p>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono bg-emerald-500/15 text-emerald-500 rounded font-semibold">On Track</span>
              </div>
              <div className="p-2">
                <RadialBarChart.Canvas />
              </div>
              <div className="p-3 border-t border-border/40 text-xs text-muted-fg flex justify-between">
                <span>4 objectives active</span>
                <span className="font-mono">Next review in 3 days</span>
              </div>
            </RadialBarChart.Container>
          </RadialBarChart>
        </div>
      ),
    },
    {
      title: 'Glassmorphic Ring Tracker',
      description: 'Rounded concentric progress rings on frosted backdrop.',
      render: () => (
        <div className="w-full">
          <RadialBarChart
            data={radialBarData}
            title="Sprint Goal Fulfillment"
            palette="emerald"
            containerVariant="glass"
            cornerRadius={8}
            height={280}
          />
        </div>
      ),
    },
  ],
}
