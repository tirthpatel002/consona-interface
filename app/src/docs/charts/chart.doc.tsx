import React, { useState } from 'react'
import {
  ChartContainer,
  ChartHeader,
  ChartToolbar,
  ChartLegend,
  ChartTooltip,
  ChartEmptyState,
  ChartLoadingState,
  ChartFooter,
  AreaChart,
  BarChart,
  PieChart,
  TreemapChart,
  SankeyChart,
  Badge,
  Button,
  toast,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const sampleSankeyData = {
  nodes: [
    { id: 'Inbound Inquiries', nodeColor: '#BFDBFE' },
    { id: 'Partner Referrals', nodeColor: '#93C5FD' },
    { id: 'Product Signups', nodeColor: '#60A5FA' },
    { id: 'Sales Qualified', nodeColor: '#3B82F6' },
    { id: 'Self-Serve Tier', nodeColor: '#2563EB' },
    { id: 'Enterprise Closed', nodeColor: '#1D4ED8' },
    { id: 'Expansion / Upsell', nodeColor: '#1E40AF' },
    { id: 'Churn / Lost', nodeColor: '#94A3B8' },
  ],
  links: [
    { source: 'Inbound Inquiries', target: 'Product Signups', value: 4200 },
    { source: 'Inbound Inquiries', target: 'Sales Qualified', value: 2400 },
    { source: 'Partner Referrals', target: 'Sales Qualified', value: 1800 },
    { source: 'Product Signups', target: 'Self-Serve Tier', value: 3100 },
    { source: 'Product Signups', target: 'Sales Qualified', value: 1100 },
    { source: 'Sales Qualified', target: 'Enterprise Closed', value: 3800 },
    { source: 'Sales Qualified', target: 'Churn / Lost', value: 1500 },
    { source: 'Self-Serve Tier', target: 'Expansion / Upsell', value: 2200 },
    { source: 'Self-Serve Tier', target: 'Churn / Lost', value: 900 },
    { source: 'Enterprise Closed', target: 'Expansion / Upsell', value: 3200 },
    { source: 'Enterprise Closed', target: 'Churn / Lost', value: 600 },
  ],
}

const sampleTreemapData = {
  name: 'Global Portfolio',
  children: [
    {
      name: 'North America',
      children: [
        { name: 'Enterprise Cloud', value: 480 },
        { name: 'AI Services', value: 320 },
        { name: 'Cybersecurity', value: 210 },
      ],
    },
    {
      name: 'EMEA',
      children: [
        { name: 'Fintech Solutions', value: 290 },
        { name: 'Data Infrastructure', value: 180 },
      ],
    },
    {
      name: 'APAC',
      children: [
        { name: 'SaaS Platforms', value: 340 },
        { name: 'Edge Computing', value: 160 },
      ],
    },
  ],
}

const samplePieData = [
  { id: 'Enterprise Direct', label: 'Enterprise Direct', value: 450, color: '#3157D5' },
  { id: 'Channel Partners', label: 'Channel Partners', value: 290, color: '#00B894' },
  { id: 'Self-Serve PLG', label: 'Self-Serve PLG', value: 210, color: '#F59E0B' },
  { id: 'OEM / Embedded', label: 'OEM / Embedded', value: 130, color: '#8B5CF6' },
]

const sampleAreaData = [
  {
    id: 'Revenue',
    data: [
      { x: 'Jan', y: 45000 },
      { x: 'Feb', y: 52000 },
      { x: 'Mar', y: 61000 },
      { x: 'Apr', y: 78000 },
      { x: 'May', y: 94000 },
      { x: 'Jun', y: 112000 },
    ],
  },
  {
    id: 'Cost',
    data: [
      { x: 'Jan', y: 28000 },
      { x: 'Feb', y: 31000 },
      { x: 'Mar', y: 34000 },
      { x: 'Apr', y: 40000 },
      { x: 'May', y: 46000 },
      { x: 'Jun', y: 51000 },
    ],
  },
]

const barQuarterData = [
  { quarter: 'Q1', SaaS: 120, Services: 45, Hardware: 22 },
  { quarter: 'Q2', SaaS: 145, Services: 52, Hardware: 28 },
  { quarter: 'Q3', SaaS: 185, Services: 64, Hardware: 35 },
  { quarter: 'Q4', SaaS: 240, Services: 78, Hardware: 42 },
]

/* ==========================================================================
   Real-World .extend() Factory Pattern Example
   ========================================================================== */

/**
 * Pre-configured Executive Metric Area Chart created via factory .extend().
 * Baked-in glassmorphism, brand palette, custom header badge, and action slots.
 */
const ExecutiveRevenueChart = AreaChart.extend({
  name: 'ExecutiveRevenueChart',
  props: {
    containerVariant: 'glass',
    palette: 'brand',
    curve: 'monotoneX',
    height: 240,
    timeRanges: ['1W', '1M', '1Q', '1Y', 'YTD'],
    defaultRange: '1Q',
  },
  slots: {
    footer: () => (
      <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-fg">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time pipeline sync active</span>
        </div>
        <span className="font-mono text-[11px]">Updated 2m ago</span>
      </div>
    ),
  },
})

export const chartContainerDoc: ComponentDocSpec = {
  id: 'chart-container',
  name: 'Chart Container',
  component: ChartContainer,
  summary: 'Unified shell container, chrome toolbar, legend, and glassmorphic tooltip infrastructure for enterprise data visualizers.',
  subcomponents: [
    'ChartContainer.Header',
    'ChartContainer.Toolbar',
    'ChartContainer.Legend',
    'ChartContainer.Canvas',
    'ChartContainer.Tooltip',
    'ChartContainer.Tooltip.Header',
    'ChartContainer.Tooltip.Row',
    'ChartContainer.Tooltip.Indicator',
    'ChartContainer.Tooltip.Value',
    'ChartContainer.Tooltip.Badge',
    'ChartContainer.Empty',
    'ChartContainer.Loading',
    'ChartContainer.Footer',
  ],
  playground: {
    defaultProps: {
      variant: 'default',
    },
    controls: [
      {
        name: 'variant',
        type: 'select',
        options: ['default', 'glass', 'subtle', 'bordered', 'flat', 'glow'],
      },
    ],
    render: (props: any) => {
      const [range, setRange] = useState<string>('6M')

      const filteredData = React.useMemo(() => {
        const sliceCount = range === '1M' ? 2 : range === '3M' ? 3 : range === '6M' ? 6 : range === '1Y' ? 6 : 6
        return sampleAreaData.map((series) => ({
          ...series,
          data: series.data.slice(-sliceCount),
        }))
      }, [range])

      const handlePointClick = (point: any) => {
        const seriesName = String(point?.serieId || point?.serie?.id || 'Metric')
        const month = String(point?.data?.xFormatted || point?.data?.x || point?.x || '')
        const rawY = Number(point?.data?.y ?? point?.y ?? 0)
        const formattedY = point?.data?.yFormatted || `$${(rawY / 1000).toFixed(0)}k`
        toast.success(`Selected ${seriesName} (${month})`, {
          description: `Recorded value: ${formattedY} (${range} active view).`,
        })
      }

      const handlePlaygroundContextMenu = (arg1: any, arg2?: React.MouseEvent) => {
        const isEventFirst = arg1 && typeof arg1.preventDefault === 'function'
        const event = (isEventFirst ? arg1 : arg2) as React.MouseEvent | undefined
        const point = isEventFirst ? null : arg1
        event?.preventDefault()

        if (point && (point.serieId || point.data)) {
          const seriesName = String(point.serieId || point.serie?.id || 'Metric')
          const month = String(point.data?.xFormatted || point.data?.x || point.x || '')
          const rawY = Number(point.data?.y ?? point.y ?? 0)
          const formattedY = point.data?.yFormatted || `$${(rawY / 1000).toFixed(0)}k`
          toast.info(`Context Action: ${seriesName} — ${month} (${formattedY})`, {
            description: `Exporting ${month} ${seriesName.toLowerCase()} snapshot (${range} window) as CSV...`,
          })
        } else {
          toast.info(`Context Action: Enterprise Financial Performance (${range})`, {
            description: `Exporting consolidated ${range} Revenue vs. Cost dataset...`,
          })
        }
      }

      return (
        <div className="w-full max-w-2xl p-4">
          <AreaChart
            data={filteredData}
            title="Enterprise Financial Performance"
            description={`Consolidated revenue versus infrastructure cost metrics (${range} active view).`}
            badge={range === '1M' ? '+4.2% MoM' : range === '3M' ? '+14.8% QoQ' : '+28.4% ARR'}
            containerVariant={props.variant}
            timeRanges={['1M', '3M', '6M', '1Y', 'ALL']}
            selectedRange={range}
            onRangeChange={setRange}
            curve="monotoneX"
            height={320}
            palette="brand"
            yFormat={(v: any) => `$${(Number(v) / 1000).toFixed(0)}k`}
            slotProps={{
              chart: {
                onClick: handlePointClick,
                onContextMenu: handlePlaygroundContextMenu,
              },
              container: {
                onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
              },
            }}
          />
        </div>
      )
    },
  },
  examples: [
    {
      title: 'Interactive onClick & onContextMenu Actions',
      description: 'Granular interaction triggers: click datum to drill down; right-click datum to invoke contextual SaaS workflow actions.',
      render: () => {
        const [selectedItem, setSelectedItem] = useState<{ label: string; value: number } | null>(null)

        const handleBarClick = (datum: any) => {
          const item = { label: `${datum.indexValue} — ${datum.id}`, value: Number(datum.value) }
          setSelectedItem(item)
          toast.success(`Drill-down triggered for ${item.label}`, {
            description: `Volume: $${item.value}k ARR. Opening detailed ledger...`,
          })
        }

        const handleContextMenu = (arg1: any, arg2?: React.MouseEvent) => {
          const isEventFirst = arg1 && typeof arg1.preventDefault === 'function'
          const event = (isEventFirst ? arg1 : arg2) as React.MouseEvent | undefined
          const datum = isEventFirst ? null : arg1
          event?.preventDefault()

          if (datum && datum.indexValue !== undefined && datum.id !== undefined) {
            const item = { label: `${datum.indexValue} — ${datum.id}`, value: Number(datum.value) }
            setSelectedItem(item)
            toast.info(`Context Menu: ${item.label} ($${item.value}k ARR)`, {
              description: `Exporting ${datum.indexValue} ${datum.id} segment ledger as CSV / Parquet format.`,
            })
          } else if (selectedItem) {
            toast.info(`Context Menu: ${selectedItem.label} ($${selectedItem.value}k ARR)`, {
              description: `Exporting selected ${selectedItem.label} dataset as CSV / Parquet format.`,
            })
          } else {
            toast.info('Context Menu: Quarterly Enterprise Revenue', {
              description: 'Exporting full Q1–Q4 multi-segment dataset as CSV / Parquet format.',
            })
          }
        }

        return (
          <div className="flex flex-col gap-4 w-full">
            <BarChart
              data={barQuarterData}
              indexBy="quarter"
              keys={['SaaS', 'Services', 'Hardware']}
              title="Quarterly Enterprise Revenue"
              description="Click any bar segment to inspect; right-click any bar or canvas to export."
              badge="Interactive"
              containerVariant="glass"
              height={260}
              slotProps={{
                chart: {
                  onClick: handleBarClick,
                  onContextMenu: handleContextMenu,
                },
                container: {
                  onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
                },
              }}
            />
            {selectedItem && (
              <div className="p-3 rounded-base bg-muted/40 border border-border/80 flex items-center justify-between text-xs animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <Badge intent="primary" size="sm">Active Segment</Badge>
                  <span className="font-semibold text-fg">{selectedItem.label}</span>
                  <span className="text-muted-fg font-mono">(${selectedItem.value}k)</span>
                </div>
                <Button size="xs" intent="outline" onClick={() => setSelectedItem(null)}>
                  Clear Selection
                </Button>
              </div>
            )}
          </div>
        )
      },
    },
    {
      title: 'TreeMap Slot Model (slotProps.chart & slotProps.container)',
      description: 'Using slotProps.chart and slotProps.container to pass engine handlers (onClick, onContextMenu) directly without polluting top-level component props.',
      render: () => {
        const [activeNode, setActiveNode] = useState<{ name: string; region?: string; value: number } | null>(null)

        const extractTreemapNode = (node: any) => {
          if (!node || typeof node !== 'object') return null
          const name = String(node.data?.name || node.name || node.id || '')
          if (!name) return null
          const parentName = node.parent?.data?.name || node.parent?.id
          const region = parentName && parentName !== 'Global Portfolio' ? String(parentName) : undefined
          return {
            name,
            region,
            value: Number(node.value || 0),
          }
        }

        const handleNodeClick = (node: any) => {
          const item = extractTreemapNode(node) || { name: 'Segment', region: undefined, value: 0 }
          setActiveNode(item)
          toast.success(`Selected Treemap Node: ${item.name}`, {
            description: item.region
              ? `Region: ${item.region} • Allocation: $${item.value}M ARR`
              : `Allocation: $${item.value}M ARR`,
          })
        }

        const handleContextMenu = (arg1: any, arg2?: React.MouseEvent) => {
          const isEventFirst = arg1 && typeof arg1.preventDefault === 'function'
          const event = (isEventFirst ? arg1 : arg2) as React.MouseEvent | undefined
          const rawNode = isEventFirst ? null : arg1
          event?.preventDefault()

          const item = extractTreemapNode(rawNode) || activeNode
          if (item) {
            setActiveNode(item)
            toast.info(`Treemap Context Action: ${item.name}`, {
              description: item.region
                ? `Exporting $${item.value}M ARR allocation breakdown (${item.region}).`
                : `Exporting $${item.value}M ARR portfolio allocation breakdown.`,
            })
          } else {
            toast.info('Treemap Context Action: Global Portfolio', {
              description: 'Exporting full portfolio asset distribution hierarchy.',
            })
          }
        }

        const handleContainerContextMenu = (e: React.MouseEvent) => {
          e.preventDefault()
        }

        return (
          <div className="flex flex-col gap-4 w-full">
            <TreemapChart
              data={sampleTreemapData}
              title="Portfolio Asset Distribution"
              description="Squarified asset distribution with slotProps model."
              badge="Slot Model"
              containerVariant="glass"
              height={280}
              palette="emerald"
              slotProps={{
                container: {
                  onContextMenu: handleContainerContextMenu,
                },
                chart: {
                  onClick: handleNodeClick,
                  onContextMenu: handleContextMenu,
                },
              }}
            />
            {activeNode && (
              <div className="p-3 rounded-base bg-muted/40 border border-border/80 flex items-center justify-between text-xs animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <Badge intent="success" size="sm">Active Node</Badge>
                  <span className="font-semibold text-fg">{activeNode.name}</span>
                  {activeNode.region && <span className="text-muted-fg">({activeNode.region})</span>}
                  <span className="text-muted-fg font-mono">(${activeNode.value}M Allocation)</span>
                </div>
                <Button size="xs" intent="outline" onClick={() => setActiveNode(null)}>
                  Clear Selection
                </Button>
              </div>
            )}
          </div>
        )
      },
    },
    {
      title: 'PieChart Slot Model (slotProps.chart & slotProps.container)',
      description: 'Injecting custom handlers (onClick, onContextMenu) directly through the slot system via slotProps.chart and slotProps.container without polluting top-level component props.',
      render: () => {
        const [activeSlice, setActiveSlice] = useState<{ label: string; value: number; share: string } | null>(null)
        const totalPieValue = samplePieData.reduce((acc, d) => acc + d.value, 0)

        const extractSlice = (datum: any) => {
          if (!datum || typeof datum !== 'object' || (datum.label === undefined && datum.id === undefined)) {
            return null
          }
          const value = Number(datum.value || 0)
          const share = `${((value / (totalPieValue || 1)) * 100).toFixed(1)}%`
          return {
            label: String(datum.label || datum.id),
            value,
            share,
          }
        }

        const handleSliceClick = (datum: any) => {
          const item = extractSlice(datum)
          if (!item) return
          setActiveSlice(item)
          toast.success(`Selected Channel: ${item.label}`, {
            description: `Contribution: $${item.value}k ARR (${item.share} share)`,
          })
        }

        const handleChartContextMenu = (arg1: any, arg2?: React.MouseEvent) => {
          const isEventFirst = arg1 && typeof arg1.preventDefault === 'function'
          const event = (isEventFirst ? arg1 : arg2) as React.MouseEvent | undefined
          const rawDatum = isEventFirst ? null : arg1
          event?.preventDefault()

          const item = extractSlice(rawDatum) || activeSlice
          if (item) {
            setActiveSlice(item)
            toast.info(`Channel Context Action: ${item.label}`, {
              description: `Exporting $${item.value}k ARR (${item.share} share) attribution report.`,
            })
          } else {
            toast.info('Channel Context Action: All Channels', {
              description: `Exporting $${totalPieValue}k total ARR channel attribution report.`,
            })
          }
        }

        return (
          <div className="flex flex-col gap-4 w-full">
            <PieChart
              data={samplePieData}
              title="Revenue Channel Attribution"
              description="Interactive donut visualizer with slotProps.chart onClick and onContextMenu injection."
              badge="Slot Model"
              containerVariant="glass"
              height={280}
              innerRadius={0.65}
              padAngle={2}
              slotProps={{
                chart: {
                  onClick: handleSliceClick,
                  onContextMenu: handleChartContextMenu,
                },
                container: {
                  onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
                },
              }}
            />
            {activeSlice && (
              <div className="p-3 rounded-base bg-muted/40 border border-border/80 flex items-center justify-between text-xs animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <Badge intent="primary" size="sm">Active Channel</Badge>
                  <span className="font-semibold text-fg">{activeSlice.label}</span>
                  <span className="text-muted-fg font-mono">(${activeSlice.value}k ARR • {activeSlice.share})</span>
                </div>
                <Button size="xs" intent="outline" onClick={() => setActiveSlice(null)}>
                  Clear Selection
                </Button>
              </div>
            )}
          </div>
        )
      },
    },
    {
      title: 'Reusable Factory Pattern (.extend())',
      description: 'Creating specialized, brand-aligned chart components with baked-in defaults, footer slots, and real-time telemetry markers.',
      render: () => {
        const createFactoryHandlers = (chartTitle: string) => ({
          onClick: (point: any) => {
            const seriesName = String(point?.serieId || point?.serie?.id || 'Metric')
            const month = String(point?.data?.xFormatted || point?.data?.x || point?.x || '')
            const rawY = Number(point?.data?.y ?? point?.y ?? 0)
            toast.success(`${chartTitle}: ${seriesName} (${month})`, {
              description: `Telemetry value: $${(rawY / 1000).toFixed(1)}k`,
            })
          },
          onContextMenu: (arg1: any, arg2?: React.MouseEvent) => {
            const isEventFirst = arg1 && typeof arg1.preventDefault === 'function'
            const event = (isEventFirst ? arg1 : arg2) as React.MouseEvent | undefined
            const point = isEventFirst ? null : arg1
            event?.preventDefault()
            if (point && (point.serieId || point.data)) {
              const seriesName = String(point.serieId || point.serie?.id || 'Metric')
              const month = String(point.data?.xFormatted || point.data?.x || point.x || '')
              const rawY = Number(point.data?.y ?? point.y ?? 0)
              toast.info(`Context Action: ${chartTitle} — ${month}`, {
                description: `Exporting ${seriesName} ($${(rawY / 1000).toFixed(1)}k) telemetry log...`,
              })
            } else {
              toast.info(`Context Action: ${chartTitle}`, {
                description: 'Exporting real-time pipeline telemetry snapshot...',
              })
            }
          },
        })

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <ExecutiveRevenueChart
              data={sampleAreaData}
              title="ARR Growth Velocity"
              description="Pre-configured executive visualizer created via AreaChart.extend()."
              badge="+34.2% YoY"
              slotProps={{
                chart: createFactoryHandlers('ARR Growth Velocity'),
                container: {
                  onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
                },
              }}
            />
            <ExecutiveRevenueChart
              data={sampleAreaData.slice(1, 2)}
              title="Infrastructure Burn"
              description="Shared factory component instance with amber palette override."
              badge="$51.0k Burn"
              palette="amber"
              slotProps={{
                chart: createFactoryHandlers('Infrastructure Burn'),
                container: {
                  onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
                },
              }}
            />
          </div>
        )
      },
    },
    {
      title: 'Glassmorphism & Glow Surface Variants',
      description: 'Optical backdrop blur and radiant outer luminescence for modern executive surfaces.',
      render: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <AreaChart
            data={sampleAreaData.slice(0, 1)}
            title="Revenue Velocity"
            badge="+34.2%"
            containerVariant="glass"
            palette="brand"
            height={220}
          />
          <AreaChart
            data={sampleAreaData.slice(1, 2)}
            title="Operating Expense"
            badge="$51.0k"
            containerVariant="glow"
            palette="violet"
            height={220}
          />
        </div>
      ),
    },
    {
      title: 'Soft & Sophisticated Sankey Flow (Custom Composed Tooltip)',
      description: 'Granular tooltip composition utilizing ChartTooltip, ChartTooltip.Header, ChartTooltip.Row, ChartTooltip.Indicator, ChartTooltip.Value, and ChartTooltip.Badge with a soft, translucent ribbon aesthetic.',
      render: () => (
        <div className="w-full">
          <SankeyChart
            data={sampleSankeyData}
            title="B2B Revenue Pipeline & Conversion Migration"
            description="Multi-stage customer acquisition pathway showing volume routing and pipeline health."
            badge="86.4% Net Retention"
            containerVariant="glass"
            height={320}
            nodeThickness={14}
            nodeSpacing={26}
            nodeBorderRadius={4}
            linkOpacity={0.28}
            linkBlendMode="normal"
            margin={{ top: 24, right: 130, bottom: 24, left: 130 }}
            slots={{
              tooltip: ({ title, value, color, node }: any) => {
                const rawVal = Number(node?.value ?? value ?? 0)
                const formattedVal = `$${(rawVal / 10).toFixed(1)}k ARR`
                const layer = node?.layer ?? 0
                const sourceLinks = node?.sourceLinks?.length ?? 0
                const targetLinks = node?.targetLinks?.length ?? 0

                return (
                  <ChartTooltip className="min-w-[210px] shadow-2xl border-border/80 bg-overlay/95 backdrop-blur-xl p-3">
                    <ChartTooltip.Header className="flex items-center justify-between gap-2 pb-1.5 border-b border-border/40">
                      <span className="font-semibold text-fg text-xs">{title}</span>
                      <span className="font-mono text-3xs px-1.5 py-0.5 rounded-micro bg-primary/10 text-primary font-semibold">
                        Stage {layer + 1}
                      </span>
                    </ChartTooltip.Header>
                    <div className="py-1.5 flex flex-col gap-1.5">
                      <ChartTooltip.Row>
                        <div className="flex items-center gap-1.5">
                          <ChartTooltip.Indicator color={color} shape="circle" />
                          <span className="text-muted-fg text-2xs">Aggregated Volume</span>
                        </div>
                        <ChartTooltip.Value className="text-primary text-xs">{formattedVal}</ChartTooltip.Value>
                      </ChartTooltip.Row>
                      <ChartTooltip.Row>
                        <span className="text-muted-fg text-3xs">Connections</span>
                        <span className="text-fg font-mono text-3xs font-medium">
                          {targetLinks} in &bull; {sourceLinks} out
                        </span>
                      </ChartTooltip.Row>
                    </div>
                    <ChartTooltip.Badge className="border-t border-border/30 pt-1 text-3xs text-muted-fg flex items-center justify-between">
                      <span>Flow Velocity</span>
                      <span className="text-emerald-500 font-semibold font-mono">High Affinity</span>
                    </ChartTooltip.Badge>
                  </ChartTooltip>
                )
              },
            }}
            slotProps={{
              chart: {
                linkTooltip: ({ link }: any) => {
                  const sourceName = link?.source?.id ?? link?.source?.label ?? 'Source'
                  const targetName = link?.target?.id ?? link?.target?.label ?? 'Target'
                  const val = Number(link?.value ?? 0)
                  return (
                    <ChartTooltip className="min-w-[200px] shadow-2xl border-border/80 bg-overlay/95 backdrop-blur-xl p-3">
                      <ChartTooltip.Header className="text-3xs text-muted-fg font-mono uppercase tracking-wider pb-1 border-b border-border/40">
                        Pipeline Transition
                      </ChartTooltip.Header>
                      <div className="py-1.5 flex flex-col gap-1.5">
                        <ChartTooltip.Row>
                          <span className="text-xs font-semibold text-fg">
                            {sourceName} &rarr; {targetName}
                          </span>
                        </ChartTooltip.Row>
                        <ChartTooltip.Row>
                          <div className="flex items-center gap-1.5">
                            <ChartTooltip.Indicator color={link?.color || '#3B82F6'} shape="line" />
                            <span className="text-muted-fg text-2xs">Transition Flow</span>
                          </div>
                          <ChartTooltip.Value className="text-xs">${(val / 10).toFixed(1)}k ARR</ChartTooltip.Value>
                        </ChartTooltip.Row>
                      </div>
                      <ChartTooltip.Badge className="border-t border-border/30 pt-1 text-3xs text-muted-fg flex items-center justify-between">
                        <span>Transfer Share</span>
                        <span className="text-primary font-semibold font-mono">{((val / 8400) * 100).toFixed(1)}%</span>
                      </ChartTooltip.Badge>
                    </ChartTooltip>
                  )
                },
              },
            }}
          />
        </div>
      ),
    },
    {
      title: 'Soft & Sophisticated Sankey Flow (Composites Only)',
      description: 'Fully composite and compound architecture where the shell, header, canvas, custom hover tooltip, and footer are all composed of subcomponent primitives (SankeyChart.Container, SankeyChart.Header, SankeyChart.Canvas, SankeyChart.Tooltip with Header, Row, Indicator, Value, Badge, and SankeyChart.Footer) without slots or slotProps.',
      render: () => (
        <div className="w-full">
          <SankeyChart
            data={sampleSankeyData}
            height={320}
            nodeThickness={14}
            nodeSpacing={26}
            nodeBorderRadius={4}
            linkOpacity={0.28}
            linkBlendMode="normal"
            margin={{ top: 24, right: 130, bottom: 24, left: 130 }}
          >
            <SankeyChart.Container variant="glass">
              <SankeyChart.Header>
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col gap-0.5">
                    <h4 className="text-sm font-bold text-fg">B2B Revenue Pipeline &amp; Conversion Migration</h4>
                    <p className="text-xs text-muted-fg">
                      Multi-stage customer acquisition pathway showing volume routing and pipeline health.
                    </p>
                  </div>
                  <Badge intent="primary" size="sm">86.4% Net Retention</Badge>
                </div>
              </SankeyChart.Header>

              <div className="p-2">
                <SankeyChart.Canvas>
                  <SankeyChart.Tooltip className="min-w-[210px] shadow-2xl border border-border/80 bg-overlay/95 backdrop-blur-xl p-3">
                    {({ node, title, value, color }: any) => {
                      const rawVal = Number(node?.value ?? value ?? 0)
                      const formattedVal = `$${(rawVal / 10).toFixed(1)}k ARR`
                      const layer = node?.layer ?? 0
                      const sourceLinks = node?.sourceLinks?.length ?? 0
                      const targetLinks = node?.targetLinks?.length ?? 0

                      return (
                        <>
                          <SankeyChart.Tooltip.Header className="flex items-center justify-between gap-2 pb-1.5 border-b border-border/40">
                            <span className="font-semibold text-fg text-xs">{node?.id ?? title}</span>
                            <span className="font-mono text-3xs px-1.5 py-0.5 rounded-micro bg-primary/10 text-primary font-semibold">
                              Stage {layer + 1}
                            </span>
                          </SankeyChart.Tooltip.Header>
                          <div className="py-1.5 flex flex-col gap-1.5">
                            <SankeyChart.Tooltip.Row>
                              <div className="flex items-center gap-1.5">
                                <SankeyChart.Tooltip.Indicator color={node?.color ?? color} shape="circle" />
                                <span className="text-muted-fg text-2xs">Aggregated Volume</span>
                              </div>
                              <SankeyChart.Tooltip.Value className="text-primary text-xs">{formattedVal}</SankeyChart.Tooltip.Value>
                            </SankeyChart.Tooltip.Row>
                            <SankeyChart.Tooltip.Row>
                              <span className="text-muted-fg text-3xs">Connections</span>
                              <span className="text-fg font-mono text-3xs font-medium">
                                {targetLinks} in &bull; {sourceLinks} out
                              </span>
                            </SankeyChart.Tooltip.Row>
                          </div>
                          <SankeyChart.Tooltip.Badge className="border-t border-border/30 pt-1 text-3xs text-muted-fg flex items-center justify-between">
                            <span>Flow Velocity</span>
                            <span className="text-emerald-500 font-semibold font-mono">High Affinity</span>
                          </SankeyChart.Tooltip.Badge>
                        </>
                      )
                    }}
                  </SankeyChart.Tooltip>
                </SankeyChart.Canvas>
              </div>

              <SankeyChart.Footer>
                <div className="flex items-center justify-between text-xs text-muted-fg w-full pt-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Pure composite architecture (Container &bull; Header &bull; Canvas &bull; Tooltip &bull; Footer)</span>
                  </div>
                  <span className="font-mono text-3xs">Hover node for live telemetry</span>
                </div>
              </SankeyChart.Footer>
            </SankeyChart.Container>
          </SankeyChart>
        </div>
      ),
    },
    {
      title: 'Persistent Canvas Tooltip Engine (Zero-Flicker Inter-Item Motion)',
      description: 'Demonstrates the persistent tooltip architecture. When moving cursor from bar to bar or across whitespace in the canvas, the tooltip remains permanently mounted, dynamically sliding and morphing in-place without jarring unmount/remount cycles or layout shifts.',
      render: () => (
        <div className="w-full flex flex-col gap-4">
          <BarChart
            data={[
              { category: 'Jan', revenue: 42000, profit: 18000 },
              { category: 'Feb', revenue: 49000, profit: 21000 },
              { category: 'Mar', revenue: 63000, profit: 29000 },
              { category: 'Apr', revenue: 78000, profit: 36000 },
              { category: 'May', revenue: 95000, profit: 44000 },
              { category: 'Jun', revenue: 112000, profit: 53000 },
            ]}
            indexBy="category"
            keys={['revenue', 'profit']}
            title="Continuous Canvas Tooltip Dynamics"
            description="Move your cursor across bars: the tooltip smoothly glides and updates in-place without blinking."
            badge="Persistent Tooltip"
            containerVariant="glow"
            palette="brand"
            cornerStyle="flat-baseline"
            borderRadius={6}
            height={280}
            slots={{
              tooltip: ({ title, label, value, color, bar }: any) => (
                <ChartTooltip className="min-w-[190px] shadow-2xl border border-border/80 bg-overlay/95 backdrop-blur-xl p-3">
                  <ChartTooltip.Header className="flex items-center justify-between gap-2 pb-1.5 border-b border-border/40">
                    <span className="font-semibold text-fg text-xs">{title} 2026</span>
                    <span className="font-mono text-3xs px-1.5 py-0.5 rounded-micro bg-primary/15 text-primary font-bold">
                      {label}
                    </span>
                  </ChartTooltip.Header>
                  <div className="py-1.5 flex flex-col gap-1">
                    <ChartTooltip.Row>
                      <div className="flex items-center gap-1.5">
                        <ChartTooltip.Indicator color={color} shape="circle" />
                        <span className="text-muted-fg text-2xs">Metric Total</span>
                      </div>
                      <ChartTooltip.Value className="text-primary font-mono text-xs">
                        ${Number(value).toLocaleString()}
                      </ChartTooltip.Value>
                    </ChartTooltip.Row>
                  </div>
                  <ChartTooltip.Badge className="border-t border-border/30 pt-1 text-3xs text-muted-fg flex items-center justify-between">
                    <span>Presence</span>
                    <span className="text-emerald-500 font-semibold font-mono">Canvas Locked</span>
                  </ChartTooltip.Badge>
                </ChartTooltip>
              ),
            }}
          />
        </div>
      ),
    },
    {
      title: 'Structured ChartTooltip Subcomponents',
      description: 'Granular tooltip layout construction using ChartTooltip.Header, ChartTooltip.Row, ChartTooltip.Indicator, and ChartTooltip.Value.',
      render: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div className="p-4 rounded-lg bg-bg border border-border flex flex-col items-center justify-center min-h-[140px]">
            <ChartTooltip>
              <ChartTooltip.Header title="2026-09-23 &middot; Daily Peak" />
              <ChartTooltip.Row>
                <ChartTooltip.Indicator color="var(--primary, #3B82F6)" />
                <span className="text-xs text-muted-fg font-medium">Throughput</span>
                <ChartTooltip.Value value="14,280 req/s" />
              </ChartTooltip.Row>
              <ChartTooltip.Row>
                <ChartTooltip.Indicator color="var(--success, #10B981)" />
                <span className="text-xs text-muted-fg font-medium">P99 Latency</span>
                <ChartTooltip.Value value="12.4 ms" />
              </ChartTooltip.Row>
            </ChartTooltip>
          </div>
          <div className="p-4 rounded-lg bg-bg border border-border flex flex-col items-center justify-center min-h-[140px]">
            <ChartTooltip title="Segment: Enterprise Direct" label="Total ARR" value="$450k" color="#3157D5" badge="+24% YoY" />
          </div>
        </div>
      ),
    },
    {
      title: 'Empty & Skeleton Loading Fallbacks',
      description: 'Standardized fallback states for asynchronous query lifecycles and zero-result filter sets.',
      render: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <ChartContainer variant="subtle">
            <ChartHeader title="Async Telemetry Query" description="Fetching telemetry batch from cluster..." />
            <ChartLoadingState />
          </ChartContainer>

          <ChartContainer variant="subtle">
            <ChartHeader title="Zero Data Stream" description="Filter returned 0 records." />
            <ChartEmptyState message="No transactions recorded for the selected timeframe." />
          </ChartContainer>
        </div>
      ),
    },
  ],
}
