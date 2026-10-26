import React from 'react'
import { TreemapChart } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const treemapData = {
  name: 'Storage Cluster',
  children: [
    {
      name: 'User Media',
      children: [
        { name: 'Video Uploads', value: 450 },
        { name: 'High-Res Images', value: 280 },
        { name: 'Audio Tracks', value: 140 },
      ],
    },
    {
      name: 'System Logs',
      children: [
        { name: 'Access Logs', value: 220 },
        { name: 'Error Traces', value: 95 },
        { name: 'Audit Events', value: 65 },
      ],
    },
    {
      name: 'Backups & Snapshots',
      children: [
        { name: 'Daily Snapshots', value: 380 },
        { name: 'Archive Cold', value: 310 },
      ],
    },
  ],
}

const monochromeTreemapDefs = [
  {
    id: 'treemap-slanted-lines-white',
    type: 'patternLines',
    background: '#18181b',
    color: '#ffffff',
    rotation: -45,
    lineWidth: 3,
    spacing: 7,
  },
  {
    id: 'treemap-slanted-lines-dark',
    type: 'patternLines',
    background: '#ffffff',
    color: '#18181b',
    rotation: 45,
    lineWidth: 3,
    spacing: 7,
  },
]

const TreemapHatchedNode = ({ node, onClick, onMouseEnter, onMouseMove, onMouseLeave }: any) => {
  const width = node.width
  const height = node.height
  const label = node.id || node.data?.name || ''

  if (width <= 0 || height <= 0) return null

  const showLabel = width > 55 && height > 28
  const pillWidth = Math.min(width - 10, Math.max(50, label.length * 7.5 + 14))

  const handleMouseEnter = (e: any) => {
    node.onMouseEnter?.(e)
    onMouseEnter?.(node, e)
  }

  const handleMouseMove = (e: any) => {
    node.onMouseMove?.(e)
    onMouseMove?.(node, e)
  }

  const handleMouseLeave = (e: any) => {
    node.onMouseLeave?.(e)
    onMouseLeave?.(node, e)
  }

  const handleClick = (e: any) => {
    node.onClick?.(e)
    onClick?.(node, e)
  }

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className="cursor-pointer"
    >
      <rect
        width={width}
        height={height}
        fill={node.fill || node.color}
        stroke="var(--border)"
        strokeWidth={node.borderWidth ?? 1.5}
        rx={3}
      />
      {showLabel && (
        <g transform={`translate(${width / 2}, ${height / 2})`}>
          {/* Centered background badge following Consona interface theme */}
          <rect
            x={-pillWidth / 2}
            y={-11}
            width={pillWidth}
            height={22}
            rx={4}
            fill="var(--bg)"
            stroke="var(--border)"
            strokeWidth={1}
            className="shadow-sm"
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontSize: '11px', fill: 'var(--fg)', fontWeight: 600 }}
            className="select-none pointer-events-none"
          >
            {label}
          </text>
        </g>
      )}
    </g>
  )
}

export const treemapChartDoc: ComponentDocSpec = {
  id: 'treemap-chart',
  name: 'TreemapChart',
  component: TreemapChart,
  summary: 'Space-filling nested rectangle visualizer ideal for disk allocations, pattern fills, portfolio distributions, hierarchical telemetry, and full compound composition.',
  subcomponents: [
    'TreemapChart.Container',
    'TreemapChart.Header',
    'TreemapChart.Toolbar',
    'TreemapChart.Legend',
    'TreemapChart.Canvas',
    'TreemapChart.Tooltip',
    'TreemapChart.Empty',
    'TreemapChart.Loading',
    'TreemapChart.Footer',
  ],
  playground: {
    defaultProps: {
      tile: 'squarify',
      innerPadding: 4,
      outerPadding: 4,
      palette: 'brand',
      containerVariant: 'default',
      leavesOnly: false,
    },
    controls: [
      {
        name: 'tile',
        type: 'select',
        options: ['squarify', 'binary', 'dice', 'slice', 'sliceDice'],
      },
      {
        name: 'innerPadding',
        type: 'number',
        min: 0,
        max: 12,
        step: 1,
      },
      {
        name: 'outerPadding',
        type: 'number',
        min: 0,
        max: 16,
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
      {
        name: 'leavesOnly',
        type: 'boolean',
      },
    ],
    render: (props: any) => (
      <div className="w-full max-w-2xl p-4">
        <TreemapChart
          data={treemapData}
          title="Cluster Storage Utilization"
          description="Nested partition allocations across active storage pools."
          badge="1.94 TB Used"
          height={340}
          {...props}
        />
      </div>
    ),
  },
  examples: [
    {
      title: 'Black & White Slanted Lines (Hatched Partitions)',
      description: 'High-contrast monochrome treemap with 45° diagonal line textures and centered background badges on titles for CAD-style telemetry.',
      render: () => (
        <div className="w-full max-w-2xl">
          <TreemapChart
            data={treemapData}
            palette={['#09090b', '#27272a', '#52525b', '#71717a', '#a1a1aa']}
            innerPadding={4}
            outerPadding={4}
            leavesOnly={true}
            defs={monochromeTreemapDefs}
            fill={[
              { match: { id: 'Video Uploads' }, id: 'treemap-slanted-lines-white' },
              { match: { id: 'Daily Snapshots' }, id: 'treemap-slanted-lines-dark' },
              { match: { id: 'Access Logs' }, id: 'treemap-slanted-lines-white' },
            ]}
            slots={{
              item: TreemapHatchedNode,
            }}
            height={290}
          >
            <TreemapChart.Container variant="glass">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-fg font-mono uppercase tracking-wider">Hatched Storage Topography</h4>
                  <p className="text-xs text-muted-fg">Monochrome entities with centered badge titles</p>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono bg-muted/60 text-fg rounded border border-border">
                  HATCH PATTERNS
                </span>
              </div>
              <div className="p-3">
                <TreemapChart.Canvas />
              </div>
              <div className="p-3 border-t border-border/40 bg-muted/20 flex items-center justify-between text-xs text-muted-fg font-mono text-2xs">
                <span>/// Slanted Light (Media &amp; Logs)</span>
                <span>\\\\ Slanted Dark (Snapshots)</span>
                <span>Solid (Backups &amp; Audio)</span>
              </div>
            </TreemapChart.Container>
          </TreemapChart>
        </div>
      ),
    },
    {
      title: 'Granular Custom UI & Storage Pool Inspector',
      description: 'Granular slot customization with custom styled tooltip cards computing subtree storage percentages, partition badges, and pool status indicators.',
      render: () => (
        <div className="w-full max-w-2xl">
          <TreemapChart
            data={treemapData}
            palette="brand"
            innerPadding={4}
            outerPadding={4}
            height={320}
            slots={{
              tooltip: ({ title, label, value, datum }: any) => {
                const node = datum?.data || datum || {}
                const name = node.name || title || label || 'Storage Node'
                const val = typeof node.value === 'number' ? node.value : value || 0
                const percentOfCluster = ((val / 1940) * 100).toFixed(1)
                return (
                  <div className="p-3.5 rounded-base bg-popover/95 backdrop-blur-md border border-border shadow-xl min-w-52 text-xs space-y-2 transition-colors duration-150">
                    <div className="flex items-center justify-between border-b border-border/50 pb-1.5 font-semibold text-fg">
                      <span>{name}</span>
                      <span className="text-3xs px-1.5 py-0.5 rounded-micro bg-primary/10 text-primary font-mono font-bold">
                        NVMe Tier
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-muted-fg">
                        <span>Allocated Volume:</span>
                        <span className="font-mono font-bold text-fg">{val} GB</span>
                      </div>
                      <div className="flex items-center justify-between text-muted-fg">
                        <span>Cluster Share:</span>
                        <span className="font-mono font-bold text-primary">{percentOfCluster}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(5, parseFloat(percentOfCluster)))}%` }}
                      />
                    </div>
                    <div className="pt-1 flex items-center justify-between text-3xs text-muted-fg border-t border-border/40">
                      <span>Redundancy policy</span>
                      <span className="font-mono text-success font-semibold">RAID-Z2</span>
                    </div>
                  </div>
                )
              },
            }}
          >
            <TreemapChart.Container variant="glass">
              <div className="p-4 border-b border-border/50 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-fg">ZFS Storage Subtree Allocations</h4>
                    <span className="px-2 py-0.5 text-3xs font-mono font-bold bg-success/15 text-success rounded-full border border-success/30">
                      Healthy • 88% Cap
                    </span>
                  </div>
                  <p className="text-xs text-muted-fg">Recursive partition footprints across tiered datasets</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-micro bg-muted/60 border border-border text-2xs font-mono font-bold">
                    1.94 TB Pool Total
                  </span>
                </div>
              </div>

              <div className="p-3">
                <TreemapChart.Canvas />
              </div>

              <div className="p-3 border-t border-border/40 bg-muted/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3 text-muted-fg">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-primary" /> User Media (870 GB)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Backups (690 GB)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> System Logs (380 GB)
                  </span>
                </div>
                <span className="text-3xs font-mono text-muted-fg">Snapshot: Daily 04:00 UTC</span>
              </div>
            </TreemapChart.Container>
          </TreemapChart>
        </div>
      ),
    },
    {
      title: 'Compound Composed Storage Map',
      description: 'Using TreemapChart.Container and TreemapChart.Canvas to build high-density disk allocation cards.',
      render: () => (
        <div className="w-full max-w-2xl">
          <TreemapChart
            data={treemapData}
            palette="brand"
            innerPadding={3}
            outerPadding={3}
            height={260}
          >
            <TreemapChart.Container variant="glass">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-fg">Storage Partition Hierarchy</h4>
                  <p className="text-xs text-muted-fg">Volume utilization across disk subtrees</p>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono bg-primary/15 text-primary rounded font-semibold">1.94 TB</span>
              </div>
              <div className="p-2">
                <TreemapChart.Canvas />
              </div>
              <div className="p-3 border-t border-border/40 text-xs text-muted-fg flex justify-between">
                <span>3 primary storage pools</span>
                <span className="font-mono">Auto-tiering enabled</span>
              </div>
            </TreemapChart.Container>
          </TreemapChart>
        </div>
      ),
    },
    {
      title: 'Leaves-Only Squarify',
      description: 'Clean minimal leaf-node tiles with emerald palette.',
      render: () => (
        <div className="w-full">
          <TreemapChart
            data={treemapData}
            title="Storage Leaves Distribution"
            leavesOnly={true}
            palette="emerald"
            containerVariant="glass"
            innerPadding={3}
            height={280}
          />
        </div>
      ),
    },
  ],
}
