import React, { useState } from 'react'
import { BarChart, ChartTooltip, Badge, type ChartTimeRange } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const fullBarData = [
  { month: 'Jan', direct: 3200, organic: 2400, referral: 1200 },
  { month: 'Feb', direct: 3800, organic: 2700, referral: 1500 },
  { month: 'Mar', direct: 4500, organic: 3400, referral: 1900 },
  { month: 'Apr', direct: 5200, organic: 4100, referral: 2400 },
  { month: 'May', direct: 6100, organic: 4800, referral: 2900 },
  { month: 'Jun', direct: 7400, organic: 5600, referral: 3500 },
  { month: 'Jul', direct: 8100, organic: 6200, referral: 3900 },
  { month: 'Aug', direct: 8900, organic: 6800, referral: 4300 },
  { month: 'Sep', direct: 9600, organic: 7400, referral: 4800 },
  { month: 'Oct', direct: 10400, organic: 8100, referral: 5300 },
  { month: 'Nov', direct: 11200, organic: 8800, referral: 5900 },
  { month: 'Dec', direct: 12500, organic: 9700, referral: 6600 },
]

function getBarDataByRange(range?: ChartTimeRange) {
  switch (range) {
    case '1D':
    case '1W':
    case '1M':
      return fullBarData.slice(-2)
    case '3M':
      return fullBarData.slice(-4)
    case '6M':
      return fullBarData.slice(-6)
    case '1Y':
      return fullBarData.slice(-12)
    case 'ALL':
    default:
      return fullBarData
  }
}

const monochromeDefs = [
  {
    id: 'slanted-lines-white',
    type: 'patternLines',
    background: '#18181b',
    color: '#ffffff',
    rotation: -45,
    lineWidth: 3,
    spacing: 7,
  },
  {
    id: 'slanted-lines-dark',
    type: 'patternLines',
    background: '#ffffff',
    color: '#18181b',
    rotation: 45,
    lineWidth: 3,
    spacing: 7,
  },
]

export const barChartDoc: ComponentDocSpec = {
  id: 'bar-chart',
  name: 'BarChart',
  component: BarChart,
  summary: 'Enterprise bar visualizer with grouped, stacked, vertical, horizontal, flat-baseline corner styles, pattern fills, and full compound composition.',
  subcomponents: [
    'BarChart.Container',
    'BarChart.Header',
    'BarChart.Toolbar',
    'BarChart.Legend',
    'BarChart.Canvas',
    'BarChart.Tooltip',
    'BarChart.Item',
    'BarChart.TopRounded',
    'BarChart.RightRounded',
    'BarChart.Empty',
    'BarChart.Loading',
    'BarChart.Footer',
  ],
  playground: {
    defaultProps: {
      layout: 'vertical',
      groupMode: 'grouped',
      borderRadius: 4,
      cornerStyle: 'flat-baseline',
      padding: 0.35,
      palette: 'brand',
      containerVariant: 'default',
    },
    controls: [
      {
        name: 'layout',
        type: 'select',
        options: ['vertical', 'horizontal'],
      },
      {
        name: 'cornerStyle',
        type: 'select',
        options: ['rounded', 'flat-baseline'],
      },
      {
        name: 'groupMode',
        type: 'select',
        options: ['grouped', 'stacked'],
      },
      {
        name: 'borderRadius',
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
    ],
    render: (props: any) => {
      const [range, setRange] = useState<ChartTimeRange>('6M')
      const activeData = getBarDataByRange(range)
      const totalVisits = activeData.reduce(
        (acc, d) => acc + d.direct + d.organic + d.referral,
        0
      )

      return (
        <div className="w-full max-w-2xl p-4">
          <BarChart
            data={activeData}
            indexBy="month"
            keys={['direct', 'organic', 'referral']}
            title="Acquisition Channel Breakdown"
            description="Monthly user acquisition volume segmented by acquisition channel."
            badge={`${(totalVisits / 1000).toFixed(1)}k Total (${range})`}
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
      title: 'Stacked Bar Chart (Props-Based)',
      description: 'Standard props-based stacked bar visualizer using groupMode="stacked" to plot multi-series segment totals on a unified column axis with interactive time range filtering.',
      render: () => {
        const [range, setRange] = useState<ChartTimeRange>('6M')
        const activeData = getBarDataByRange(range)

        return (
          <div className="w-full max-w-2xl">
            <BarChart
              data={activeData}
              indexBy="month"
              keys={['direct', 'organic', 'referral']}
              groupMode="stacked"
              layout="vertical"
              padding={0.32}
              borderRadius={4}
              palette="brand"
              title="Monthly Channel Mix (Stacked)"
              description="Cumulative volume breakdown by acquisition funnel segment"
              badge={`Active: ${range}`}
              containerVariant="glass"
              height={300}
              timeRanges={['1M', '3M', '6M', '1Y', 'ALL']}
              selectedRange={range}
              onRangeChange={setRange}
            />
          </div>
        )
      },
    },
    {
      title: 'Stacked Bar Chart (Pure Composite Architecture)',
      description: 'Fully composite stacked bar visualizer configured with BarChart.Container, BarChart.Header, BarChart.Toolbar, BarChart.Legend, BarChart.Canvas, and custom BarChart.Tooltip with live range-controlled data stream.',
      render: () => {
        const [range, setRange] = useState<ChartTimeRange>('6M')
        const activeData = getBarDataByRange(range)
        const totalVolume = activeData.reduce(
          (acc, d) => acc + d.direct + d.organic + d.referral,
          0
        )

        return (
          <div className="w-full max-w-2xl">
            <BarChart
              data={activeData}
              indexBy="month"
              keys={['direct', 'organic', 'referral']}
              groupMode="stacked"
              layout="vertical"
              padding={0.35}
              borderRadius={3}
              palette="brand"
            >
              <BarChart.Container variant="glass">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border/40">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-fg">Traffic Composition &amp; Cumulative Retention</h4>
                      <Badge intent="primary" size="sm">{range} Window</Badge>
                    </div>
                    <p className="text-xs text-muted-fg">Stacked traffic split over time across all acquisition channels</p>
                  </div>
                  <BarChart.Toolbar
                    timeRanges={['1M', '3M', '6M', '1Y', 'ALL']}
                    selectedRange={range}
                    onRangeChange={setRange}
                  />
                </div>

                {/* Interactive series toggle legend */}
                <BarChart.Legend align="left" className="px-4 pt-2" />

                <div className="p-2">
                  <BarChart.Canvas height={300}>
                    <BarChart.Tooltip>
                      {({ title, label, value, color, bar }: any = {}) => {
                        if (!title && !label && value === undefined) return null
                        const formattedVal = typeof value === 'number' ? value.toLocaleString() : value
                        const monthTotal = bar?.data
                          ? (bar.data.direct || 0) + (bar.data.organic || 0) + (bar.data.referral || 0)
                          : undefined
                        const sharePercent = monthTotal && typeof value === 'number'
                          ? `${((value / monthTotal) * 100).toFixed(1)}%`
                          : undefined

                        return (
                          <ChartTooltip
                            title={`${title} Acquisition`}
                            badge={sharePercent ? `${sharePercent} Share` : 'Stacked'}
                            badgeVariant="info"
                          >
                            <ChartTooltip.Section>
                              <ChartTooltip.Row label={label} value={`${formattedVal} visits`} color={color} />
                              {monthTotal !== undefined && (
                                <ChartTooltip.Row label="Month Total" value={`${monthTotal.toLocaleString()} visits`} />
                              )}
                            </ChartTooltip.Section>
                          </ChartTooltip>
                        )
                      }}
                    </BarChart.Tooltip>
                  </BarChart.Canvas>
                </div>

                <BarChart.Footer>
                  <div className="flex items-center justify-between text-xs text-muted-fg w-full pt-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{totalVolume.toLocaleString()} total visits tracked across {range} timeframe</span>
                    </div>
                    <span className="font-mono text-3xs">Interactive Time Range Toolbar Active</span>
                  </div>
                </BarChart.Footer>
              </BarChart.Container>
            </BarChart>
          </div>
        )
      },
    },
    {
      title: 'Black & White Slanted Lines (Hatch Pattern)',
      description: 'High-contrast monochrome visualizer with diagonal 45° slanted line textures (SVG pattern defs) on bars for print-friendly or tactical dashboards with telemetry tooltips.',
      render: () => (
        <div className="w-full max-w-2xl">
          <BarChart
            data={fullBarData.slice(0, 5)}
            indexBy="month"
            keys={['direct', 'organic', 'referral']}
            palette={['#09090b', '#27272a', '#71717a']}
            defs={monochromeDefs}
            fill={[
              { match: { id: 'organic' }, id: 'slanted-lines-white' },
              { match: { id: 'referral' }, id: 'slanted-lines-dark' },
            ]}
            height={280}
            borderRadius={3}
            cornerStyle="flat-baseline"
          >
            <BarChart.Container variant="glass">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-fg font-mono uppercase tracking-wider">Tactical Telemetry Matrix</h4>
                  <p className="text-xs text-muted-fg">Monochrome entities with diagonal hatch pattern fills</p>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono bg-muted/60 text-fg rounded border border-border">
                  HATCH PATTERNS
                </span>
              </div>
              <div className="p-3">
                <BarChart.Canvas>
                  <BarChart.Tooltip>
                    {({ title, label, value, bar }: any = {}) => {
                      const patternType = label === 'organic'
                        ? '/// Slanted Light'
                        : label === 'referral'
                          ? '\\\\\\ Slanted Dark'
                          : '■ Solid Black'
                      const valNum = typeof value === 'number' ? value : Number(value) || 0
                      const monthSum = bar?.data
                        ? (bar.data.direct || 0) + (bar.data.organic || 0) + (bar.data.referral || 0)
                        : 0
                      const share = monthSum > 0 ? `${((valNum / monthSum) * 100).toFixed(1)}%` : undefined

                      return (
                        <ChartTooltip
                          title={`Tactical Node: ${title}`}
                          badge={patternType}
                          badgeVariant="default"
                        >
                          <ChartTooltip.Section>
                            <ChartTooltip.Row label={`Channel (${label})`} value={`${valNum.toLocaleString()} units`} />
                            {share && <ChartTooltip.Row label="Cohort Share" value={share} color="#71717A" />}
                          </ChartTooltip.Section>
                        </ChartTooltip>
                      )
                    }}
                  </BarChart.Tooltip>
                </BarChart.Canvas>
              </div>
              <div className="p-3 border-t border-border/40 bg-muted/20 flex items-center justify-between text-xs text-muted-fg">
                <span className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-fg border border-border inline-block" /> Solid (Direct)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-card border border-fg inline-block" /> Slanted Light (Organic)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-muted border border-border inline-block" /> Slanted Dark (Referral)</span>
                </span>
                <span className="font-mono text-3xs">Extensible Fill Defs</span>
              </div>
            </BarChart.Container>
          </BarChart>
        </div>
      ),
    },
    {
      title: 'Granular Custom UI & Dynamic Range Toolbar',
      description: 'Granular slot customization with custom styled tooltip cards, metric threshold markers, and interactive range toolbar filtering.',
      render: () => {
        const [range, setRange] = useState<ChartTimeRange>('6M')
        const activeData = getBarDataByRange(range)
        const totalVisits = activeData.reduce(
          (acc, d) => acc + d.direct + d.organic + d.referral,
          0
        )

        return (
          <div className="w-full max-w-2xl">
            <BarChart
              data={activeData}
              indexBy="month"
              keys={['direct', 'organic', 'referral']}
              palette="brand"
              height={300}
              borderRadius={5}
              cornerStyle="flat-baseline"
              slots={{
                tooltip: ({ title, label, value, color, bar }: any) => {
                  const valNum = typeof value === 'number' ? value : Number(value) || 0
                  const isHighPerformance = valNum > 5000
                  const monthTotal = bar?.data
                    ? (bar.data.direct || 0) + (bar.data.organic || 0) + (bar.data.referral || 0)
                    : 0
                  const quotaRate = Math.round((valNum / 4500) * 100)

                  return (
                    <ChartTooltip
                      title={`${title} Performance`}
                      badge={isHighPerformance ? 'Target Exceeded' : 'On Track'}
                      badgeVariant={isHighPerformance ? 'success' : 'info'}
                      color={color}
                    >
                      <ChartTooltip.Section>
                        <ChartTooltip.Row label={label} value={`${valNum.toLocaleString()} visits`} color={color} />
                        {monthTotal > 0 && (
                          <ChartTooltip.Row label="Month Total" value={`${monthTotal.toLocaleString()} visits`} />
                        )}
                        <ChartTooltip.Row
                          label="Quota Attainment"
                          value={`${quotaRate}%`}
                          color={quotaRate >= 100 ? '#10B981' : '#F59E0B'}
                        />
                      </ChartTooltip.Section>
                    </ChartTooltip>
                  )
                },
              }}
            >
              <BarChart.Container variant="glass">
                <div className="p-4 border-b border-border/50 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-fg">Channel Growth Matrix</h4>
                      <span className="px-2 py-0.5 text-3xs font-mono font-bold bg-success/15 text-success rounded-full border border-success/30">
                        {totalVisits.toLocaleString()} Total Visits
                      </span>
                    </div>
                    <p className="text-xs text-muted-fg">Granularly formatted tooltips with live quota attainment metrics</p>
                  </div>
                  <BarChart.Toolbar
                    timeRanges={['1M', '3M', '6M', '1Y', 'ALL']}
                    selectedRange={range}
                    onRangeChange={setRange}
                  />
                </div>

                <div className="p-3">
                  <BarChart.Canvas />
                </div>

                <div className="p-3 border-t border-border/40 bg-muted/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-4 text-muted-fg">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary" /> Direct (+18%)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Organic (+24%)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Referral (+9%)
                    </span>
                  </div>
                  <span className="text-3xs font-mono text-muted-fg">Range: {range} &bull; Updated 2m ago</span>
                </div>
              </BarChart.Container>
            </BarChart>
          </div>
        )
      },
    },
    {
      title: 'Flat-Baseline Corner Radii (Vertical & Horizontal)',
      description: 'Zero corner radius on touching baselines (bottom on vertical bars, left on horizontal bars) with interactive tooltips.',
      render: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <BarChart
            data={fullBarData.slice(0, 5)}
            indexBy="month"
            keys={['direct', 'organic']}
            title="Vertical Flat Baseline"
            description="Rounded top, flat bottom touching axis"
            cornerStyle="flat-baseline"
            borderRadius={5}
            palette="brand"
            containerVariant="subtle"
            height={260}
          />
          <BarChart
            data={fullBarData.slice(0, 5)}
            indexBy="month"
            keys={['direct', 'organic']}
            layout="horizontal"
            title="Horizontal Flat Baseline"
            description="Rounded right, flat left touching axis"
            cornerStyle="flat-baseline"
            borderRadius={5}
            palette="emerald"
            containerVariant="glass"
            height={260}
          />
        </div>
      ),
    },
    {
      title: 'Compound Composition with Custom Toolbar & Metrics',
      description: 'Custom composed layout with BarChart.Container, BarChart.Header, BarChart.Toolbar, BarChart.Canvas, and custom slot footer.',
      render: () => {
        const [range, setRange] = useState<ChartTimeRange>('3M')
        const activeData = getBarDataByRange(range)

        return (
          <div className="w-full max-w-2xl">
            <BarChart
              data={activeData}
              indexBy="month"
              keys={['direct', 'organic', 'referral']}
              palette="violet"
              height={220}
              borderRadius={4}
              cornerStyle="flat-baseline"
            >
              <BarChart.Container variant="glass">
                <div className="p-4 border-b border-border/50 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-fg">Compound Composed Bar Visualizer</h4>
                    <p className="text-xs text-muted-fg">Custom inner layout using BarChart compound attachments</p>
                  </div>
                  <BarChart.Toolbar
                    timeRanges={['1M', '3M', '6M', 'ALL']}
                    selectedRange={range}
                    onRangeChange={setRange}
                  />
                </div>
                <div className="p-2">
                  <BarChart.Canvas />
                </div>
                <div className="p-3 border-t border-border/40 text-xs text-muted-fg flex justify-between">
                  <span>Direct / Organic / Referral</span>
                  <span className="font-mono">Live Stream ({range})</span>
                </div>
              </BarChart.Container>
            </BarChart>
          </div>
        )
      },
    },
    {
      title: 'Horizontal & Stacked Layouts',
      description: 'Horizontal orientation for long categorical labels and stacked bars for cumulative totals.',
      render: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <BarChart
            data={fullBarData.slice(0, 4)}
            indexBy="month"
            keys={['direct', 'organic']}
            layout="horizontal"
            groupMode="stacked"
            title="Horizontal Stacked Split"
            palette="brand"
            containerVariant="subtle"
            height={260}
          />
          <BarChart
            data={fullBarData.slice(0, 4)}
            indexBy="month"
            keys={['direct', 'organic', 'referral']}
            groupMode="stacked"
            title="Vertical Stacked Cumulative"
            palette="emerald"
            containerVariant="glass"
            height={260}
          />
        </div>
      ),
    },
  ],
}


