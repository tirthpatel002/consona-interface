import React from 'react'
import { FunnelChart } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const funnelData = [
  { id: 'step_visits', value: 100000, label: 'Website Visitors' },
  { id: 'step_signup', value: 38000, label: 'Account Signups' },
  { id: 'step_onboarding', value: 24000, label: 'Completed Onboarding' },
  { id: 'step_active', value: 14000, label: 'Active Trial Users' },
  { id: 'step_paid', value: 4800, label: 'Paid Subscriptions' },
]

const monochromeFunnelDefs = [
  {
    id: 'funnel-slanted-lines-white',
    type: 'patternLines',
    background: '#18181b',
    color: '#ffffff',
    rotation: -45,
    lineWidth: 3,
    spacing: 7,
  },
  {
    id: 'funnel-slanted-lines-dark',
    type: 'patternLines',
    background: '#ffffff',
    color: '#18181b',
    rotation: 45,
    lineWidth: 3,
    spacing: 7,
  },
]

/**
 * Custom SVG layer rendering styled funnel stage items with centered badges and inter-stage drop-off indicators.
 */
const CustomFunnelPartsLayer = ({ parts, areaGenerator, borderGenerator }: any) => {
  return (
    <g>
      {parts.map((part: any, index: number) => {
        const areaPath = areaGenerator(part.areaPoints)
        const borderPath = borderGenerator(part.borderPoints)
        const stageName = part.data?.label || part.data?.id || `Stage ${index + 1}`
        const volume = Number(part.data?.value || 0).toLocaleString()

        // Midpoint calculations for centered badges
        const midY = (part.y0 + part.y1) / 2
        const midX = (part.x0 + part.x1) / 2

        // Drop-off from previous stage
        const prevValue = index > 0 ? parts[index - 1].data?.value : null
        const dropoffPercent = prevValue ? (((prevValue - part.data?.value) / prevValue) * 100).toFixed(1) : null

        return (
          <g key={part.data?.id || index} className="group cursor-pointer">
            {/* Main Stage Polygon */}
            <path
              d={areaPath}
              fill={part.fill || part.color}
              fillOpacity={0.88}
              stroke="var(--border)"
              strokeWidth={1.5}
              onMouseEnter={part.onMouseEnter}
              onMouseMove={part.onMouseMove}
              onMouseLeave={part.onMouseLeave}
              onClick={part.onClick}
              className="transition-all duration-200 hover:fill-opacity-100"
            />
            {borderPath && (
              <path
                d={borderPath}
                fill="none"
                stroke="var(--border)"
                strokeWidth={2}
                className="pointer-events-none"
              />
            )}

           

            {/* Inter-stage Drop-off Pill */}
            {dropoffPercent && (
              <g transform={`translate(${midX + (part.width / 2) + 24}, ${part.y0})`} className="pointer-events-none">
                <rect
                  x={-42}
                  y={-9}
                  width={84}
                  height={18}
                  rx={4}
                  fill="var(--bg)"
                  stroke="var(--danger, #ef4444)"
                  strokeWidth={1}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ fontSize: '9px', fill: 'var(--danger, #ef4444)', fontWeight: 700 }}
                >
                  ↓ -{dropoffPercent}%
                </text>
              </g>
            )}
          </g>
        )
      })}
    </g>
  )
}

export const funnelChartDoc: ComponentDocSpec = {
  id: 'funnel-chart',
  name: 'FunnelChart',
  component: FunnelChart,
  summary: 'Conversion funnel visualizer tracking drop-off rates, progression stages across user journeys, and full compound composition.',
  subcomponents: [
    'FunnelChart.Container',
    'FunnelChart.Header',
    'FunnelChart.Toolbar',
    'FunnelChart.Legend',
    'FunnelChart.Canvas',
    'FunnelChart.Tooltip',
    'FunnelChart.Empty',
    'FunnelChart.Loading',
    'FunnelChart.Footer',
  ],
  playground: {
    defaultProps: {
      direction: 'vertical',
      interpolation: 'smooth',
      spacing: 2,
      palette: 'brand',
      containerVariant: 'default',
    },
    controls: [
      {
        name: 'direction',
        type: 'select',
        options: ['vertical', 'horizontal'],
      },
      {
        name: 'interpolation',
        type: 'select',
        options: ['smooth', 'linear'],
      },
      {
        name: 'palette',
        type: 'select',
        options: ['brand', 'categorical', 'emerald', 'amber', 'violet'],
      },
      {
        name: 'containerVariant',
        type: 'select',
        options: ['default', 'glass', 'subtle', 'bordered', 'flat', 'glow'],
      },
    ],
    render: (props: any) => (
      <div className="w-full max-w-2xl p-4">
        <FunnelChart
          data={funnelData}
          title="Product Conversion Pipeline"
          description="Visitor to paid customer progression metrics across all marketing cohorts."
          badge="4.8% Overall Conversion"
          height={320}
          timeRanges={['1M', '3M', '6M', '1Y', 'ALL']}
          defaultRange="1M"
          {...props}
        />
      </div>
    ),
  },
  examples: [
    {
      title: 'Custom Item UI with Hatched Fills & Drop-Off Badges',
      description: 'Using custom SVG layers in FunnelChart.Canvas to transform stage items with diagonal hatch patterns, centered badges, and stage-to-stage drop-off indicators.',
      render: () => (
        <div className="w-full max-w-2xl">
          <FunnelChart
            data={funnelData}
            palette={['#09090b', '#27272a', '#52525b', '#71717a', '#a1a1aa']}
            defs={monochromeFunnelDefs}
            fill={[
              { match: { id: 'step_visits' }, id: 'funnel-slanted-lines-white' },
              { match: { id: 'step_onboarding' }, id: 'funnel-slanted-lines-dark' },
              { match: { id: 'step_paid' }, id: 'funnel-slanted-lines-white' },
            ]}
            layers={[CustomFunnelPartsLayer]}
            margin={{ top: 24, right: 60, bottom: 24, left: 24 }}
            height={320}
          >
            <FunnelChart.Container variant="glass">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-fg font-mono uppercase tracking-wider">Hatched Pipeline Stages</h4>
                  <p className="text-xs text-muted-fg">Custom stage item renderer with drop-off percentage badges</p>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono bg-muted/60 text-fg rounded border border-border">
                  CUSTOM LAYER
                </span>
              </div>
              <div className="p-2">
                <FunnelChart.Canvas />
              </div>
              <div className="p-3 border-t border-border/40 bg-muted/20 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-fg font-mono text-2xs">
                <span>/// Hatched (Visits, Onboarding, Paid)</span>
                <span>Solid (Signup, Active)</span>
                <span className="text-danger font-semibold">Drop-off telemetry active</span>
              </div>
            </FunnelChart.Container>
          </FunnelChart>
        </div>
      ),
    },
    {
      title: 'Custom Canvas Viewport Rendering (Interactive Stage Cards)',
      description: 'Using FunnelChart.Canvas children render-function to directly customize stage items into responsive telemetry blocks with progress bars.',
      render: () => (
        <div className="w-full max-w-2xl">
          <FunnelChart
            data={funnelData}
            palette="brand"
            height={320}
          >
            <FunnelChart.Container variant="glass">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-fg">Self-Serve Journey Blocks</h4>
                  <p className="text-xs text-muted-fg">Custom items rendered directly inside FunnelChart.Canvas</p>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono bg-primary/15 text-primary rounded font-semibold">4.8% End-to-End</span>
              </div>
              <div className="p-4">
                <FunnelChart.Canvas>
                  {(context: any) => {
                    const data = context.data || funnelData
                    const topVolume = data[0]?.value || 100000
                    return (
                      <div className="flex flex-col gap-2.5 w-full">
                        {data.map((stage: any, idx: number) => {
                          const percentOfTop = ((stage.value / topVolume) * 100).toFixed(1)
                          const prevStage = idx > 0 ? data[idx - 1] : null
                          const conversionFromPrev = prevStage ? ((stage.value / prevStage.value) * 100).toFixed(1) : null
                          const colors = ['#3157D5', '#3B82F6', '#60A5FA', '#93C5FD', '#10B981']

                          return (
                            <div
                              key={stage.id}
                              className="p-3 rounded-base bg-secondary/30 border border-border/60 hover:border-primary/50 transition-all group"
                            >
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-3xs font-bold font-mono text-white"
                                    style={{ backgroundColor: colors[idx % colors.length] }}
                                  >
                                    {idx + 1}
                                  </span>
                                  <span className="font-semibold text-fg">{stage.label}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  {conversionFromPrev && (
                                    <span className="text-3xs font-mono text-muted-fg bg-muted/60 px-1.5 py-0.5 rounded">
                                      {conversionFromPrev}% step-through
                                    </span>
                                  )}
                                  <span className="font-mono font-bold text-fg">{stage.value.toLocaleString()}</span>
                                </div>
                              </div>
                              <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{
                                    width: `${percentOfTop}%`,
                                    backgroundColor: colors[idx % colors.length],
                                  }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  }}
                </FunnelChart.Canvas>
              </div>
              <div className="p-3 border-t border-border/40 text-xs text-muted-fg flex justify-between">
                <span>5 conversion milestones</span>
                <span className="font-mono text-success font-semibold">Highest retention: Step 3 (63.2%)</span>
              </div>
            </FunnelChart.Container>
          </FunnelChart>
        </div>
      ),
    },
    {
      title: 'Compound Composed Funnel Card',
      description: 'Using FunnelChart.Container and FunnelChart.Canvas to create customized marketing funnel cards.',
      render: () => (
        <div className="w-full max-w-2xl">
          <FunnelChart
            data={funnelData}
            palette="brand"
            direction="vertical"
            interpolation="smooth"
            height={260}
          >
            <FunnelChart.Container variant="glass">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-fg">Self-Serve Activation Funnel</h4>
                  <p className="text-xs text-muted-fg">Signup to paid lifecycle progression</p>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono bg-primary/15 text-primary rounded font-semibold">4.8% Conversion</span>
              </div>
              <div className="p-2">
                <FunnelChart.Canvas />
              </div>
              <div className="p-3 border-t border-border/40 text-xs text-muted-fg flex justify-between">
                <span>5 pipeline stages</span>
                <span className="font-mono">Drop-off: 48.2% at Trial</span>
              </div>
            </FunnelChart.Container>
          </FunnelChart>
        </div>
      ),
    },
    {
      title: 'Horizontal & Linear Funnels',
      description: 'Horizontal stage progression with linear polygon boundaries.',
      render: () => (
        <div className="w-full">
          <FunnelChart
            data={funnelData}
            title="Horizontal Journey Pipeline"
            direction="horizontal"
            interpolation="linear"
            palette="emerald"
            containerVariant="glass"
            height={260}
          />
        </div>
      ),
    },
  ],
}
