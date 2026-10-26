import React from 'react'
import { PieChart } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const pieData = [
  { id: 'Compute / EC2', label: 'Compute', value: 420 },
  { id: 'Managed DB / Aurora', label: 'Databases', value: 280 },
  { id: 'Storage / S3', label: 'Object Storage', value: 160 },
  { id: 'Networking / CDN', label: 'CDN & Egress', value: 95 },
  { id: 'Observability / Logs', label: 'Monitoring', value: 65 },
]

const monochromePieDefs = [
  {
    id: 'pie-slanted-lines-white',
    type: 'patternLines',
    background: '#18181b',
    color: '#ffffff',
    rotation: -45,
    lineWidth: 3,
    spacing: 6,
  },
  {
    id: 'pie-slanted-lines-dark',
    type: 'patternLines',
    background: '#ffffff',
    color: '#18181b',
    rotation: 45,
    lineWidth: 3,
    spacing: 6,
  },
  {
    id: 'pie-dots-white',
    type: 'patternDots',
    background: '#18181b',
    color: '#ffffff',
    size: 3,
    padding: 4,
    stagger: true,
  },
]

export const pieChartDoc: ComponentDocSpec = {
  id: 'pie-chart',
  name: 'PieChart',
  component: PieChart,
  summary: 'Donut and pie chart visualizer with configurable inner radius, pattern fills, center metric overlay, and full compound composition.',
  subcomponents: [
    'PieChart.Container',
    'PieChart.Header',
    'PieChart.Toolbar',
    'PieChart.Legend',
    'PieChart.Canvas',
    'PieChart.Tooltip',
    'PieChart.CenterMetric',
    'PieChart.Empty',
    'PieChart.Loading',
    'PieChart.Footer',
  ],
  playground: {
    defaultProps: {
      innerRadius: 0.6,
      padAngle: 1.5,
      cornerRadius: 4,
      palette: 'brand',
      containerVariant: 'default',
      enableArcLinkLabels: true,
      enableArcLabels: false,
    },
    controls: [
      {
        name: 'innerRadius',
        type: 'number',
        min: 0,
        max: 0.85,
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
        max: 10,
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
        name: 'enableArcLinkLabels',
        type: 'boolean',
      },
      {
        name: 'enableArcLabels',
        type: 'boolean',
      },
    ],
    render: (props: any) => (
      <div className="w-full max-w-2xl p-4">
        <PieChart
          data={pieData}
          title="Cloud Infrastructure Spend"
          description="Breakdown of monthly infrastructure costs by category."
          badge="$1,020 / mo"
          height={320}
          {...props}
        />
      </div>
    ),
  },
  examples: [
    {
      title: 'Black & White Slanted Lines (Hatched Donut)',
      description: 'High-contrast monochrome donut with diagonal 45° slanted line textures, dotted hatch fills, and custom center metric for technical telemetry.',
      render: () => (
        <div className="w-full max-w-2xl">
          <PieChart
            data={pieData}
            innerRadius={0.72}
            padAngle={2}
            cornerRadius={4}
            palette={['#09090b', '#27272a', '#52525b', '#71717a', '#a1a1aa']}
            defs={monochromePieDefs}
            fill={[
              { match: { id: 'Compute / EC2' }, id: 'pie-slanted-lines-white' },
              { match: { id: 'Storage / S3' }, id: 'pie-slanted-lines-dark' },
              { match: { id: 'Observability / Logs' }, id: 'pie-dots-white' },
            ]}
            height={280}
          >
            <PieChart.Container variant="glass">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-fg font-mono uppercase tracking-wider">Hatched Allocation Donut</h4>
                  <p className="text-xs text-muted-fg">Monochrome entities with slanted stripe &amp; dot pattern fills</p>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono bg-muted/60 text-fg rounded border border-border">
                  HATCH PATTERNS
                </span>
              </div>
              <div className="relative p-2">
                <PieChart.Canvas />
                <PieChart.CenterMetric
                  title="TOTAL SPEND"
                  value="$1,020"
                  subtitle="5 Segments"
                />
              </div>
              <div className="p-3 border-t border-border/40 bg-muted/20 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-fg font-mono text-2xs">
                <span>/// Slanted White (EC2)</span>
                <span>\\\\ Slanted Dark (S3)</span>
                <span>::: Dotted (Logs)</span>
                <span>Solid (DB &amp; CDN)</span>
              </div>
            </PieChart.Container>
          </PieChart>
        </div>
      ),
    },
    {
      title: 'Granular Custom UI & Interactive KPI Donut Card',
      description: 'Granular slot customization with custom styled center metric, custom hover tooltips with category budget caps, and interactive breakdown legend with spend progress bars.',
      render: () => (
        <div className="w-full max-w-2xl">
          <PieChart
            data={pieData}
            innerRadius={0.74}
            padAngle={2.5}
            cornerRadius={5}
            palette="brand"
            height={290}
            slots={{
              tooltip: ({ datum }: any) => {
                const slice = datum?.data || datum || {}
                const label = slice.label || slice.id || 'Category'
                const val = typeof slice.value === 'number' ? slice.value : 0
                const percent = ((val / 1020) * 100).toFixed(1)
                return (
                  <div className="p-3.5 rounded-base bg-popover/95 backdrop-blur-md border border-border shadow-xl min-w-48 text-xs space-y-1.5 transition-colors duration-150">
                    <div className="flex items-center justify-between border-b border-border/50 pb-1.5 font-semibold text-fg">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                        {label}
                      </span>
                      <span className="text-3xs px-1.5 py-0.5 rounded-micro bg-primary/10 text-primary font-mono font-bold">
                        {percent}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-fg">
                      <span>Monthly Spend:</span>
                      <span className="font-mono font-bold text-fg">${val.toLocaleString()}</span>
                    </div>
                    <div className="pt-1 flex items-center justify-between text-3xs text-muted-fg border-t border-border/40">
                      <span>Budget status</span>
                      <span className="font-mono text-success font-semibold">Under Budget (-4%)</span>
                    </div>
                  </div>
                )
              },
            }}
          >
            <PieChart.Container variant="glass">
              <div className="p-4 border-b border-border/50 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-fg">Infrastructure Spend Breakdown</h4>
                    <span className="px-2 py-0.5 text-3xs font-mono font-bold bg-success/15 text-success rounded-full border border-success/30">
                      FinOps Verified
                    </span>
                  </div>
                  <p className="text-xs text-muted-fg">Granular donut with custom center metric and budget caps</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-micro bg-primary/10 text-primary text-2xs font-mono font-bold">
                    Q3 Forecast
                  </span>
                </div>
              </div>

              <div className="relative p-2">
                <PieChart.Canvas />
                <PieChart.CenterMetric
                  title="Total Run Rate"
                  value="$1,020"
                  subtitle="41.2% compute"
                />
              </div>

              <div className="p-3.5 border-t border-border/40 bg-muted/20 space-y-2">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  {pieData.slice(0, 3).map((item, idx) => {
                    const colors = ['#3157D5', '#22C55E', '#F59E0B']
                    const percent = ((item.value / 1020) * 100).toFixed(0)
                    return (
                      <div key={item.id} className="p-2 rounded-micro bg-bg/50 border border-border/60 space-y-1">
                        <div className="flex items-center justify-between text-2xs">
                          <span className="font-medium text-fg truncate">{item.label}</span>
                          <span className="font-mono font-bold text-primary">{percent}%</span>
                        </div>
                        <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${percent}%`,
                              backgroundColor: colors[idx % colors.length],
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </PieChart.Container>
          </PieChart>
        </div>
      ),
    },
    {
      title: 'Compound Composition with Center Metric',
      description: 'Using PieChart.Container, PieChart.Canvas, and PieChart.CenterMetric for high-impact donut KPI cards.',
      render: () => (
        <div className="w-full max-w-2xl">
          <PieChart
            data={pieData}
            innerRadius={0.72}
            padAngle={2}
            cornerRadius={4}
            palette="brand"
            height={260}
          >
            <PieChart.Container variant="glass">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-fg">Active Cloud Allocations</h4>
                  <p className="text-xs text-muted-fg">Composed Donut KPI with PieChart.CenterMetric</p>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono bg-success/15 text-success rounded font-semibold">+12.4% MoM</span>
              </div>
              <div className="relative p-2">
                <PieChart.Canvas />
                <PieChart.CenterMetric
                  title="Total Run Rate"
                  value="$1,020"
                  subtitle="Monthly spend"
                />
              </div>
              <div className="p-3 border-t border-border/40 text-xs text-muted-fg flex justify-between">
                <span>5 active resource categories</span>
                <span className="font-mono">Auto-scaling enabled</span>
              </div>
            </PieChart.Container>
          </PieChart>
        </div>
      ),
    },
    {
      title: 'Solid Pie vs Thin Donut',
      description: 'Configurable inner radius for solid pie charts or modern thin rings.',
      render: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <PieChart
            data={pieData}
            title="Solid Pie"
            innerRadius={0}
            padAngle={0.5}
            palette="categorical"
            containerVariant="subtle"
            height={260}
          />
          <PieChart
            data={pieData}
            title="Modern Donut Ring"
            innerRadius={0.75}
            padAngle={3}
            cornerRadius={6}
            palette="violet"
            containerVariant="glass"
            height={260}
          />
        </div>
      ),
    },
  ],
}
