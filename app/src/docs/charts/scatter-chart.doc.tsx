import React from 'react'
import { ScatterChart, ChartTooltip } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const scatterData = [
  {
    id: 'Production Nodes',
    data: [
      { x: 12, y: 85, size: 10 },
      { x: 24, y: 120, size: 14 },
      { x: 38, y: 210, size: 18 },
      { x: 45, y: 190, size: 16 },
      { x: 58, y: 310, size: 22 },
      { x: 72, y: 380, size: 26 },
      { x: 88, y: 440, size: 30 },
      { x: 95, y: 490, size: 32 },
    ],
  },
  {
    id: 'Canary Fleet',
    data: [
      { x: 15, y: 60, size: 8 },
      { x: 30, y: 95, size: 12 },
      { x: 42, y: 140, size: 14 },
      { x: 65, y: 220, size: 18 },
      { x: 80, y: 280, size: 20 },
      { x: 92, y: 330, size: 24 },
    ],
  },
]

const contributorData = [
  {
    id: 'Core Engineering',
    data: [
      { x: 35, y: 82, name: 'Elena Rostova', role: 'Staff Systems Eng', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=face', status: 'online' },
      { x: 68, y: 145, name: 'Marcus Chen', role: 'Principal Architect', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face', status: 'online' },
      { x: 102, y: 220, name: 'Aisha Patel', role: 'Lead Infrastructure', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=96&h=96&fit=crop&crop=face', status: 'busy' },
      { x: 140, y: 310, name: 'David Kim', role: 'Distributed Systems', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop&crop=face', status: 'online' },
    ],
  },
  {
    id: 'Product & Design',
    data: [
      { x: 28, y: 65, name: 'Sophie Laurent', role: 'Design Systems', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=face', status: 'online' },
      { x: 60, y: 110, name: 'Lucas Vance', role: 'Product Lead', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=96&h=96&fit=crop&crop=face', status: 'busy' },
      { x: 88, y: 175, name: 'Chloe Dubois', role: 'UX Research', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=96&h=96&fit=crop&crop=face', status: 'away' },
    ],
  },
]

const UserAvatarScatterNode = ({ node, onMouseEnter, onMouseMove, onMouseLeave, onClick }: any) => {
  const datum = node.data || {}
  const avatarUrl = datum.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=96&h=96&fit=crop&crop=face'
  const radius = Math.max(12, (node.size || 36) / 2)
  const patternId = `avatar-pat-${String(node.serieId || 's')}-${String(node.index ?? 0)}-${String(datum.x ?? 0)}-${String(datum.y ?? 0)}`.replace(/[^a-zA-Z0-9_-]/g, '_')
  const strokeColor = node.style?.color || '#3b82f6'

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      onMouseEnter={onMouseEnter || node.onMouseEnter}
      onMouseMove={onMouseMove || node.onMouseMove}
      onMouseLeave={onMouseLeave || node.onMouseLeave}
      onClick={onClick || node.onClick}
      className="cursor-pointer transition-transform duration-200 hover:scale-115"
    >
      <defs>
        <pattern
          id={patternId}
          width="1"
          height="1"
          patternContentUnits="objectBoundingBox"
        >
          <image
            href={avatarUrl}
            x="0"
            y="0"
            width="1"
            height="1"
            preserveAspectRatio="xMidYMid slice"
          />
        </pattern>
      </defs>
      {/* Outer border / halo */}
      <circle
        r={radius + 2}
        cx={0}
        cy={0}
        fill="var(--bg)"
        stroke={strokeColor}
        strokeWidth={2}
      />
      {/* Pattern-filled avatar circle: strictly contained inside the circle, cover-based */}
      <circle
        r={radius}
        cx={0}
        cy={0}
        fill={`url(#${patternId})`}
      />
      {/* Status dot badge */}
      <circle
        cx={radius * 0.7}
        cy={radius * 0.7}
        r={Math.max(3, radius * 0.22)}
        fill={datum.status === 'busy' ? '#F59E0B' : datum.status === 'away' ? '#6B7280' : '#10B981'}
        stroke="var(--bg)"
        strokeWidth={1.5}
      />
    </g>
  )
}

export const scatterChartDoc: ComponentDocSpec = {
  id: 'scatter-chart',
  name: 'ScatterChart',
  component: ScatterChart,
  summary: 'Multivariate scatter plot and bubble chart visualizer highlighting correlations, clusters, regression distributions, and full compound composition.',
  subcomponents: [
    'ScatterChart.Container',
    'ScatterChart.Header',
    'ScatterChart.Toolbar',
    'ScatterChart.Legend',
    'ScatterChart.Canvas',
    'ScatterChart.Tooltip',
    'ScatterChart.Empty',
    'ScatterChart.Loading',
    'ScatterChart.Footer',
  ],
  playground: {
    defaultProps: {
      nodeSize: 12,
      palette: 'brand',
      containerVariant: 'default',
    },
    controls: [
      {
        name: 'nodeSize',
        type: 'number',
        min: 6,
        max: 24,
        step: 2,
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
        <ScatterChart
          data={scatterData}
          title="Latency vs CPU Utilization Correlation"
          description="Distribution of response times against core saturation across node clusters."
          badge="R² = 0.94"
          height={340}
          timeRanges={['1H', '6H', '24H', '7D', 'ALL']}
          defaultRange="24H"
          {...props}
        />
      </div>
    ),
  },
  examples: [
    {
      title: 'User Avatars as Scatter Nodes (Unsplash Profiles)',
      description: 'Extensible slot customization with custom SVG avatar nodes, cover-fit image clipping, status badges, and rich profile inspection tooltips.',
      render: () => (
        <div className="w-full max-w-2xl">
          <ScatterChart
            data={contributorData}
            palette="brand"
            nodeSize={36}
            height={320}
            xFormat={(val) => `${val} PRs`}
            yFormat={(val) => `${val} Commits`}
            slots={{
              item: UserAvatarScatterNode,
              tooltip: ({ datum }: any) => {
                const member = datum?.data || datum || {}
                const name = member.name || 'Team Contributor'
                const role = member.role || 'Engineer'
                const prs = member.x ?? 0
                const commits = member.y ?? 0
                const statusColor = member.status === 'busy' ? '#F59E0B' : member.status === 'away' ? '#6B7280' : '#10B981'
                return (
                  <ChartTooltip
                    title={name}
                    badge={role}
                    color="#3B82F6"
                  >
                    <div className="flex items-center gap-2.5 pb-1">
                      <img
                        src={member.avatar}
                        alt={name}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/40"
                      />
                      <div className="flex-1">
                        <span className="text-3xs text-muted-fg font-medium">Activity Status</span>
                        <div className="flex items-center gap-1.5 font-semibold text-fg">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: statusColor }}
                          />
                          <span className="capitalize">{member.status || 'Active'}</span>
                        </div>
                      </div>
                    </div>
                    <ChartTooltip.Section>
                      <ChartTooltip.Row label="Code Reviews" value={`${prs} PRs`} />
                      <ChartTooltip.Row label="Commits" value={String(commits)} color="#3B82F6" />
                    </ChartTooltip.Section>
                  </ChartTooltip>
                )
              },
            }}
          >
            <ScatterChart.Container variant="glass">
              <div className="p-4 border-b border-border/50 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-fg">Engineering Velocity &amp; Impact</h4>
                    <span className="px-2 py-0.5 text-3xs font-mono font-bold bg-success/15 text-success rounded-full border border-success/30">
                      7 Active Contributors
                    </span>
                  </div>
                  <p className="text-xs text-muted-fg">PR reviews (X) vs committed changes (Y) with Unsplash profile nodes</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-micro bg-primary/10 text-primary text-2xs font-mono font-bold">
                    Q3 Sprint
                  </span>
                </div>
              </div>

              <div className="p-3">
                <ScatterChart.Canvas />
              </div>

              <div className="p-3 border-t border-border/40 bg-muted/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-4 text-muted-fg">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Core Engineering (4)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Product &amp; Design (3)
                  </span>
                </div>
                <span className="font-mono text-3xs text-muted-fg">Live GitHub Sync</span>
              </div>
            </ScatterChart.Container>
          </ScatterChart>
        </div>
      ),
    },
    {
      title: 'Granular Custom UI & Outlier Inspector',
      description: 'Granular slot customization with custom styled tooltip cards displaying deviation standard errors, cluster tag badges, and custom quadrant legends.',
      render: () => (
        <div className="w-full max-w-2xl">
          <ScatterChart
            data={scatterData}
            palette="brand"
            nodeSize={14}
            height={300}
            slots={{
              tooltip: ({ title, label, value, datum }: any) => {
                const nodeData = datum?.data || datum || {}
                const latency = nodeData.y ?? value
                const cpu = nodeData.x ?? 0
                const isOutlier = latency > 350
                return (
                  <ChartTooltip
                    title={title || 'Cluster Node'}
                    badge={isOutlier ? 'High Deviation' : 'Nominal'}
                    badgeVariant={isOutlier ? 'danger' : 'success'}
                    color={isOutlier ? '#EF4444' : '#10B981'}
                  >
                    <ChartTooltip.Section>
                      <ChartTooltip.Row label="CPU Saturation" value={`${cpu}%`} />
                      <ChartTooltip.Row label="P99 Latency" value={`${latency} ms`} color={isOutlier ? '#EF4444' : '#10B981'} />
                      <ChartTooltip.Row label="Regression Z-Score" value={`${((latency - 200) / 75).toFixed(2)}σ`} color="#3157D5" />
                    </ChartTooltip.Section>
                  </ChartTooltip>
                )
              },
            }}
          >
            <ScatterChart.Container variant="glass">
              <div className="p-4 border-b border-border/50 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-fg">Fleet Node Regression Outliers</h4>
                    <span className="px-2 py-0.5 text-3xs font-mono font-bold bg-primary/10 text-primary rounded-full">
                      Z-Score Filter Active
                    </span>
                  </div>
                  <p className="text-xs text-muted-fg">Multivariate latency vs core saturation distribution</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-2xs font-mono bg-warning/15 text-warning rounded font-semibold">
                    2 Outliers &gt; 2.5σ
                  </span>
                </div>
              </div>

              <div className="p-3">
                <ScatterChart.Canvas />
              </div>

              <div className="p-3 border-t border-border/40 bg-muted/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-4 text-muted-fg">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Production Fleet (n=8)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Canary Nodes (n=6)
                  </span>
                </div>
                <span className="font-mono text-3xs text-muted-fg">Sample Window: 24 Hours</span>
              </div>
            </ScatterChart.Container>
          </ScatterChart>
        </div>
      ),
    },
    {
      title: 'Compound Composed Scatter Plot',
      description: 'Using ScatterChart.Container and ScatterChart.Canvas for cluster distribution telemetry.',
      render: () => (
        <div className="w-full max-w-2xl">
          <ScatterChart
            data={scatterData}
            palette="brand"
            nodeSize={14}
            height={260}
          >
            <ScatterChart.Container variant="glass">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-fg">Compute Outlier Analysis</h4>
                  <p className="text-xs text-muted-fg">Node CPU utilization vs P99 response time</p>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono bg-warning/15 text-warning rounded font-semibold">2 Outliers Detected</span>
              </div>
              <div className="p-2">
                <ScatterChart.Canvas />
              </div>
              <div className="p-3 border-t border-border/40 text-xs text-muted-fg flex justify-between">
                <span>Production + Canary nodes</span>
                <span className="font-mono">Correlation index: 0.91</span>
              </div>
            </ScatterChart.Container>
          </ScatterChart>
        </div>
      ),
    },
    {
      title: 'Glassmorphic Bubble Clustering',
      description: 'Clean high contrast scatter points on dark/light glass card.',
      render: () => (
        <div className="w-full">
          <ScatterChart
            data={scatterData}
            title="Cluster Latency Map"
            palette="violet"
            containerVariant="glass"
            nodeSize={14}
            height={280}
          />
        </div>
      ),
    },
  ],
}
