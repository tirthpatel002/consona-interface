import React, { useState } from 'react'
import { LineChart } from '@consona/interface'
import type { ChartTimeRange } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const fullLineData = [
  {
    id: 'API Gateway',
    data: [
      { x: 'Jan', y: 124 },
      { x: 'Feb', y: 145 },
      { x: 'Mar', y: 189 },
      { x: 'Apr', y: 232 },
      { x: 'May', y: 280 },
      { x: 'Jun', y: 345 },
      { x: 'Jul', y: 410 },
      { x: 'Aug', y: 440 },
      { x: 'Sep', y: 495 },
      { x: 'Oct', y: 530 },
      { x: 'Nov', y: 590 },
      { x: 'Dec', y: 650 },
    ],
  },
  {
    id: 'Auth Service',
    data: [
      { x: 'Jan', y: 80 },
      { x: 'Feb', y: 92 },
      { x: 'Mar', y: 110 },
      { x: 'Apr', y: 140 },
      { x: 'May', y: 175 },
      { x: 'Jun', y: 210 },
      { x: 'Jul', y: 260 },
      { x: 'Aug', y: 290 },
      { x: 'Sep', y: 310 },
      { x: 'Oct', y: 340 },
      { x: 'Nov', y: 380 },
      { x: 'Dec', y: 410 },
    ],
  },
  {
    id: 'Database Node',
    data: [
      { x: 'Jan', y: 45 },
      { x: 'Feb', y: 55 },
      { x: 'Mar', y: 68 },
      { x: 'Apr', y: 85 },
      { x: 'May', y: 102 },
      { x: 'Jun', y: 130 },
      { x: 'Jul', y: 155 },
      { x: 'Aug', y: 170 },
      { x: 'Sep', y: 195 },
      { x: 'Oct', y: 215 },
      { x: 'Nov', y: 240 },
      { x: 'Dec', y: 265 },
    ],
  },
]

const getLineDataByRange = (range: ChartTimeRange) => {
  const count = range === '1D' || range === '1W' || range === '1M' ? 2 : range === '3M' ? 4 : range === '6M' ? 6 : 12
  return fullLineData.map((series) => ({
    ...series,
    data: series.data.slice(-count),
  }))
}

export const lineChartDoc: ComponentDocSpec = {
  id: 'line-chart',
  name: 'LineChart',
  component: LineChart,
  summary: 'Multi-series line visualizer with configurable spline interpolations, area fills, and full compound composition.',
  subcomponents: [
    'LineChart.Container',
    'LineChart.Header',
    'LineChart.Toolbar',
    'LineChart.Legend',
    'LineChart.Canvas',
    'LineChart.Tooltip',
    'LineChart.Empty',
    'LineChart.Loading',
    'LineChart.Footer',
  ],
  playground: {
    defaultProps: {
      curve: 'monotoneX',
      palette: 'brand',
      containerVariant: 'default',
      lineWidth: 2.5,
      enablePoints: true,
      pointSize: 8,
      enableArea: false,
    },
    controls: [
      {
        name: 'curve',
        type: 'select',
        options: ['monotoneX', 'natural', 'catmullRom', 'linear', 'step'],
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
        name: 'enableArea',
        type: 'boolean',
      },
      {
        name: 'enablePoints',
        type: 'boolean',
      },
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
        min: 4,
        max: 16,
        step: 1,
      },
    ],
    render: (props: any) => {
      const [range, setRange] = useState<ChartTimeRange>('6M')
      const activeData = getLineDataByRange(range)
      const maxVal = Math.max(
        ...activeData.flatMap((s) => s.data.map((d) => d.y as number))
      )

      return (
        <div className="w-full max-w-2xl p-4">
          <LineChart
            data={activeData}
            title="Service Requests / Sec"
            description={`RPS distribution per microservice (${range} active view).`}
            badge={`${maxVal} RPS Peak (${range})`}
            height={320}
            timeRanges={['1M', '3M', '6M', '1Y', 'ALL']}
            selectedRange={range}
            onRangeChange={setRange}
            {...props}
          />
        </div>
      )
    },
  },
  examples: [
    {
      title: 'Compound Composed Line Visualizer',
      description: 'Custom layout with LineChart.Container, LineChart.Toolbar, LineChart.Canvas, and custom stat overlay.',
      render: () => {
        const [range, setRange] = useState<ChartTimeRange>('6M')
        const activeData = getLineDataByRange(range)
        const peakVal = Math.max(
          ...activeData.flatMap((s) => s.data.map((d) => d.y as number))
        )

        return (
          <div className="w-full max-w-2xl">
            <LineChart
              data={activeData}
              palette="brand"
              height={240}
              curve="monotoneX"
            >
              <LineChart.Container variant="glass">
                <div className="p-4 border-b border-border/50 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-fg">Real-Time Throughput</h4>
                    <p className="text-xs text-muted-fg">Microservice traffic telemetry stream ({range})</p>
                  </div>
                  <LineChart.Toolbar
                    timeRanges={['1M', '3M', '6M', '1Y', 'ALL']}
                    selectedRange={range}
                    onRangeChange={setRange}
                  />
                </div>
                <div className="p-2">
                  <LineChart.Canvas />
                </div>
                <div className="p-3 border-t border-border/40 text-xs text-muted-fg flex justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    3 clusters online &bull; Peak: {peakVal} RPS
                  </span>
                  <span className="font-mono">P99 latency: 14ms</span>
                </div>
              </LineChart.Container>
            </LineChart>
          </div>
        )
      },
    },
    {
      title: 'Glassmorphic Splines with Points',
      description: 'Clean curved line rendering with high contrast markers and interactive range toolbar.',
      render: () => {
        const [range, setRange] = useState<ChartTimeRange>('3M')
        const activeData = getLineDataByRange(range).slice(0, 2)

        return (
          <div className="w-full">
            <LineChart
              data={activeData}
              title="Gateway vs Auth RPS"
              description={`Throughput comparison over ${range}`}
              curve="catmullRom"
              palette="emerald"
              containerVariant="glass"
              enablePoints={true}
              pointSize={8}
              height={260}
              timeRanges={['1M', '3M', '6M', 'ALL']}
              selectedRange={range}
              onRangeChange={setRange}
            />
          </div>
        )
      },
    },
  ],
}
