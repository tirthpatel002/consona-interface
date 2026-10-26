import React from 'react'
import { BumpChart } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const bumpData = [
  {
    id: 'TypeScript',
    data: [
      { x: '2021', y: 4 },
      { x: '2022', y: 3 },
      { x: '2023', y: 2 },
      { x: '2024', y: 1 },
      { x: '2025', y: 1 },
    ],
  },
  {
    id: 'Python',
    data: [
      { x: '2021', y: 1 },
      { x: '2022', y: 1 },
      { x: '2023', y: 1 },
      { x: '2024', y: 2 },
      { x: '2025', y: 2 },
    ],
  },
  {
    id: 'Rust',
    data: [
      { x: '2021', y: 5 },
      { x: '2022', y: 4 },
      { x: '2023', y: 3 },
      { x: '2024', y: 3 },
      { x: '2025', y: 3 },
    ],
  },
  {
    id: 'Go',
    data: [
      { x: '2021', y: 2 },
      { x: '2022', y: 2 },
      { x: '2023', y: 4 },
      { x: '2024', y: 4 },
      { x: '2025', y: 4 },
    ],
  },
  {
    id: 'Java',
    data: [
      { x: '2021', y: 3 },
      { x: '2022', y: 5 },
      { x: '2023', y: 5 },
      { x: '2024', y: 5 },
      { x: '2025', y: 5 },
    ],
  },
]

export const bumpChartDoc: ComponentDocSpec = {
  id: 'bump-chart',
  name: 'BumpChart',
  component: BumpChart,
  summary: 'Ranking and positional leaderboard visualizer showing ranking transitions, position shifts across discrete time intervals, and full compound composition.',
  subcomponents: [
    'BumpChart.Container',
    'BumpChart.Header',
    'BumpChart.Toolbar',
    'BumpChart.Legend',
    'BumpChart.Canvas',
    'BumpChart.Tooltip',
    'BumpChart.Empty',
    'BumpChart.Loading',
    'BumpChart.Footer',
  ],
  playground: {
    defaultProps: {
      lineWidth: 3,
      pointSize: 10,
      palette: 'brand',
      containerVariant: 'default',
    },
    controls: [
      {
        name: 'lineWidth',
        type: 'number',
        min: 1,
        max: 6,
        step: 0.5,
      },
      {
        name: 'pointSize',
        type: 'number',
        min: 6,
        max: 16,
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
    ],
    render: (props: any) => (
      <div className="w-full max-w-2xl p-4">
        <BumpChart
          data={bumpData}
          title="Programming Language Adoption Rankings"
          description="Ecosystem popularity leaderboard trajectories from 2021 to 2025."
          badge="#1 TypeScript"
          height={340}
          {...props}
        />
      </div>
    ),
  },
  examples: [
    {
      title: 'Compound Composed Leaderboard Card',
      description: 'Using BumpChart.Container and BumpChart.Canvas for modular rankings dashboard cards.',
      render: () => (
        <div className="w-full max-w-2xl">
          <BumpChart
            data={bumpData}
            palette="brand"
            lineWidth={3}
            pointSize={10}
            height={260}
          >
            <BumpChart.Container variant="glass">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-fg">Language Ecosystem Trajectory</h4>
                  <p className="text-xs text-muted-fg">Annual ranking position transitions</p>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono bg-primary/15 text-primary rounded font-semibold">5 Tracked</span>
              </div>
              <div className="p-2">
                <BumpChart.Canvas />
              </div>
              <div className="p-3 border-t border-border/40 text-xs text-muted-fg flex justify-between">
                <span>Top tier: TypeScript &amp; Python</span>
                <span className="font-mono">Updated 2025</span>
              </div>
            </BumpChart.Container>
          </BumpChart>
        </div>
      ),
    },
    {
      title: 'Glassmorphic Leaderboard Trajectory',
      description: 'Clean rank transitions with emerald & amber highlights.',
      render: () => (
        <div className="w-full">
          <BumpChart
            data={bumpData}
            title="Ecosystem Rank Shifts"
            palette="categorical"
            containerVariant="glass"
            lineWidth={3.5}
            pointSize={12}
            height={280}
          />
        </div>
      ),
    },
  ],
}
