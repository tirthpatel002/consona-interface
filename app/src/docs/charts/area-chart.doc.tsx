import React from 'react'
import { AreaChart } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const areaData = [
  {
    id: 'Production Cloud',
    data: [
      { x: '00:00', y: 120 },
      { x: '04:00', y: 95 },
      { x: '08:00', y: 280 },
      { x: '12:00', y: 450 },
      { x: '16:00', y: 390 },
      { x: '20:00', y: 240 },
      { x: '23:59', y: 160 },
    ],
  },
  {
    id: 'Staging Fleet',
    data: [
      { x: '00:00', y: 40 },
      { x: '04:00', y: 30 },
      { x: '08:00', y: 110 },
      { x: '12:00', y: 180 },
      { x: '16:00', y: 140 },
      { x: '20:00', y: 90 },
    ],
  },
]

const CustomAreaTelemetryVisualizer = ({ series }: { series: any[] }) => {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)
  const [hoveredSeries, setHoveredSeries] = React.useState<'prod' | 'staging'>('prod')

  const prodSeries = series[0]?.data || []
  const stagingSeries = series[1]?.data || []
  const maxY = 500
  const svgWidth = 600
  const svgHeight = 160

  // Extract shared chronological X categories across all series
  const allXCategories = Array.from(
    new Set(series.flatMap((s: any) => (s.data || []).map((d: any) => String(d.x))))
  )

  const getX = (xVal: string | number) => {
    const idx = allXCategories.indexOf(String(xVal))
    if (idx === -1) return 30
    return 30 + (idx / Math.max(1, allXCategories.length - 1)) * (svgWidth - 60)
  }
  const getY = (val: number) => svgHeight - 20 - (val / maxY) * (svgHeight - 40)

  // Construct SVG points based on true X category positions
  const prodPoints = prodSeries.map((pt: any) => ({
    x: getX(pt.x),
    y: getY(pt.y),
    rawX: pt.x,
    rawY: pt.y,
  }))
  const stagingPoints = stagingSeries.map((pt: any) => ({
    x: getX(pt.x),
    y: getY(pt.y),
    rawX: pt.x,
    rawY: pt.y,
  }))

  const makeAreaPath = (pts: any[]) => {
    if (pts.length === 0) return ''
    const linePath = pts.reduce((acc: string, pt: any, i: number) => {
      if (i === 0) return `M ${pt.x},${pt.y}`
      const prev = pts[i - 1]
      const cx1 = prev.x + (pt.x - prev.x) / 2
      const cx2 = prev.x + (pt.x - prev.x) / 2
      return `${acc} C ${cx1},${prev.y} ${cx2},${pt.y} ${pt.x},${pt.y}`
    }, '')
    return `${linePath} L ${pts[pts.length - 1].x},${svgHeight - 15} L ${pts[0].x},${svgHeight - 15} Z`
  }

  const makeLinePath = (pts: any[]) => {
    if (pts.length === 0) return ''
    return pts.reduce((acc: string, pt: any, i: number) => {
      if (i === 0) return `M ${pt.x},${pt.y}`
      const prev = pts[i - 1]
      const cx1 = prev.x + (pt.x - prev.x) / 2
      const cx2 = prev.x + (pt.x - prev.x) / 2
      return `${acc} C ${cx1},${prev.y} ${cx2},${pt.y} ${pt.x},${pt.y}`
    }, '')
  }

  const peakPoint = prodPoints.reduce((max: any, pt: any) => (pt.rawY > (max?.rawY || 0) ? pt : max), prodPoints[0])
  const activeCategory = hoveredIndex !== null ? allXCategories[hoveredIndex] : null
  const activeProd = activeCategory ? prodPoints.find((p: any) => String(p.rawX) === activeCategory) || null : null
  const activeStaging = activeCategory ? stagingPoints.find((p: any) => String(p.rawX) === activeCategory) || null : null

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseSvgX = ((e.clientX - rect.left) / rect.width) * svgWidth
    const mouseSvgY = ((e.clientY - rect.top) / rect.height) * svgHeight

    // Find closest index across shared categories
    let closestIdx = 0
    let minDiff = Infinity
    allXCategories.forEach((cat: string, idx: number) => {
      const catX = getX(cat)
      const diff = Math.abs(catX - mouseSvgX)
      if (diff < minDiff) {
        minDiff = diff
        closestIdx = idx
      }
    })

    const cat = allXCategories[closestIdx]
    const pPt = prodPoints.find((p: any) => String(p.rawX) === cat)
    const sPt = stagingPoints.find((p: any) => String(p.rawX) === cat)

    const distProd = pPt ? Math.abs(pPt.y - mouseSvgY) : Infinity
    const distStaging = sPt ? Math.abs(sPt.y - mouseSvgY) : Infinity

    setHoveredIndex(closestIdx)
    if (sPt && distStaging < distProd) {
      setHoveredSeries('staging')
    } else {
      setHoveredSeries('prod')
    }
  }

  const handleMouseLeave = () => {
    setHoveredIndex(null)
  }

  const activeTargetPoint = hoveredSeries === 'staging' ? (activeStaging || activeProd) : (activeProd || activeStaging)
  const targetX = activeCategory ? getX(activeCategory) : 0
  const targetY = activeTargetPoint ? activeTargetPoint.y : 0
  const isNearTop = targetY < 48

  return (
    <div className="flex flex-col gap-3 w-full h-[300px]  relative">
      <div className="w-full relative overflow-hidden rounded-base bg-secondary/15 border border-border/60 p-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="customAreaProdGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3157D5" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#3157D5" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="customAreaStagingGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Reference Lines */}
          <line x1="20" y1={getY(100)} x2={svgWidth - 20} y2={getY(100)} stroke="var(--border)" strokeDasharray="3 3" strokeOpacity="0.6" />
          <line x1="20" y1={getY(250)} x2={svgWidth - 20} y2={getY(250)} stroke="var(--border)" strokeDasharray="3 3" strokeOpacity="0.6" />
          <line x1="20" y1={getY(400)} x2={svgWidth - 20} y2={getY(400)} stroke="var(--border)" strokeDasharray="3 3" strokeOpacity="0.6" />

          {/* Staging Area & Line (Green) */}
          <path
            d={makeAreaPath(stagingPoints)}
            fill="url(#customAreaStagingGrad)"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredSeries('staging')}
          />
          <path
            d={makeLinePath(stagingPoints)}
            fill="none"
            stroke="#10B981"
            strokeWidth={hoveredSeries === 'staging' && hoveredIndex !== null ? 3 : 2}
            strokeDasharray="4 4"
            className="transition-all duration-150 cursor-pointer"
            onMouseEnter={() => setHoveredSeries('staging')}
          />

          {/* Production Area & Line (Blue) */}
          <path
            d={makeAreaPath(prodPoints)}
            fill="url(#customAreaProdGrad)"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredSeries('prod')}
          />
          <path
            d={makeLinePath(prodPoints)}
            fill="none"
            stroke="#3157D5"
            strokeWidth={hoveredSeries === 'prod' && hoveredIndex !== null ? 3.5 : 2.5}
            className="transition-all duration-150 cursor-pointer"
            onMouseEnter={() => setHoveredSeries('prod')}
          />

          {/* Points Markers */}
          {prodPoints.map((pt: any, i: number) => (
            <circle
              key={`prod-pt-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={activeCategory === String(pt.rawX) && hoveredSeries === 'prod' ? 5.5 : activeCategory === String(pt.rawX) ? 4 : 3}
              fill="#3157D5"
              stroke="var(--bg)"
              strokeWidth={activeCategory === String(pt.rawX) ? 2 : 1}
              className="transition-all duration-150"
            />
          ))}
          {stagingPoints.map((pt: any, i: number) => (
            <circle
              key={`staging-pt-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={activeCategory === String(pt.rawX) && hoveredSeries === 'staging' ? 5.5 : activeCategory === String(pt.rawX) ? 4 : 3}
              fill="#10B981"
              stroke="var(--bg)"
              strokeWidth={activeCategory === String(pt.rawX) ? 2 : 1}
              className="transition-all duration-150"
            />
          ))}

          {/* Dedicated Hitbox Targets for Precise Hovering */}
          {stagingPoints.map((pt: any, i: number) => (
            <circle
              key={`staging-hitbox-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={16}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => {
                const cIdx = allXCategories.indexOf(String(pt.rawX))
                if (cIdx !== -1) setHoveredIndex(cIdx)
                setHoveredSeries('staging')
              }}
            />
          ))}
          {prodPoints.map((pt: any, i: number) => (
            <circle
              key={`prod-hitbox-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={16}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => {
                const cIdx = allXCategories.indexOf(String(pt.rawX))
                if (cIdx !== -1) setHoveredIndex(cIdx)
                setHoveredSeries('prod')
              }}
            />
          ))}

          {/* Peak Indicator & Glow Badge */}
          {peakPoint && (
            <g transform={`translate(${peakPoint.x}, ${peakPoint.y})`}>
              <circle r="12" fill="#3157D5" fillOpacity="0.2" className="animate-ping" />
              <circle r="5" fill="#3157D5" stroke="var(--bg)" strokeWidth="2" />
              <g transform="translate(0, -22)">
                <rect x="-44" y="-9" width="88" height="18" rx="4" fill="var(--bg)" stroke="var(--border)" strokeWidth="1" className="shadow-xs" />
                <text textAnchor="middle" dominantBaseline="central" style={{ fontSize: '9px', fill: 'var(--fg)', fontWeight: 700 }} className="font-mono">
                  Peak: {peakPoint.rawY} IOPS
                </text>
              </g>
            </g>
          )}

          {/* Active Hover Crosshair / Guideline */}
          {activeCategory && (
            <g className="transition-opacity duration-150">
              <line
                x1={targetX}
                y1={10}
                x2={targetX}
                y2={svgHeight - 15}
                stroke="var(--fg)"
                strokeOpacity="0.4"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              {/* Highlight Rings on active points */}
              {activeProd && (
                <>
                  <circle
                    cx={activeProd.x}
                    cy={activeProd.y}
                    r={hoveredSeries === 'prod' ? 9 : 6}
                    fill="#3157D5"
                    fillOpacity={hoveredSeries === 'prod' ? 0.4 : 0.2}
                    className="transition-all duration-150"
                  />
                  <circle cx={activeProd.x} cy={activeProd.y} r={4} fill="#3157D5" stroke="var(--bg)" strokeWidth="1.5" />
                </>
              )}
              {activeStaging && (
                <>
                  <circle
                    cx={activeStaging.x}
                    cy={activeStaging.y}
                    r={hoveredSeries === 'staging' ? 9 : 6}
                    fill="#10B981"
                    fillOpacity={hoveredSeries === 'staging' ? 0.4 : 0.2}
                    className="transition-all duration-150"
                  />
                  <circle cx={activeStaging.x} cy={activeStaging.y} r="4" fill="#10B981" stroke="var(--bg)" strokeWidth="1.5" />
                </>
              )}
            </g>
          )}

          {/* Timeline Ticks based on shared categories */}
          {allXCategories.map((cat: string, i: number) => (
            <text
              key={i}
              x={getX(cat)}
              y={svgHeight - 2}
              textAnchor="middle"
              style={{
                fontSize: '9px',
                fill: hoveredIndex === i ? 'var(--fg)' : 'var(--muted-fg)',
                fontWeight: hoveredIndex === i ? 700 : 400,
              }}
              className="font-mono transition-colors"
            >
              {cat}
            </text>
          ))}
        </svg>

        {/* Floating Tooltip Component */}
        {activeCategory && activeTargetPoint && (
          <div
            className={`absolute pointer-events-none z-30 transition-all duration-150 ease-out -translate-x-1/2 ${
              isNearTop ? 'translate-y-2' : '-translate-y-full'
            }`}
            style={{
              left: `${(targetX / svgWidth) * 100}%`,
              top: `${Math.max(6, Math.min(88, ((targetY + (isNearTop ? 10 : -8)) / svgHeight) * 100))}%`,
            }}
          >
            <AreaChart.Tooltip
              title={`Time: ${activeCategory} UTC`}
              badge={hoveredSeries === 'staging' ? 'Staging Focused' : 'Production Focused'}
            >
              <div className="flex flex-col gap-1.5 mt-1 min-w-[145px]">
                {activeProd && (
                  <div
                    className={`flex items-center justify-between gap-4 p-1 rounded-micro transition-colors ${
                      hoveredSeries === 'prod' ? 'bg-[#3157D5]/15 font-semibold text-fg' : 'opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#3157D5] shrink-0 shadow-xs" />
                      <span className="text-muted-fg text-2xs">Production</span>
                    </div>
                    <span className="font-mono font-bold text-fg text-2xs">{activeProd.rawY} IOPS</span>
                  </div>
                )}
                {activeStaging && (
                  <div
                    className={`flex items-center justify-between gap-4 p-1 rounded-micro transition-colors ${
                      hoveredSeries === 'staging' ? 'bg-[#10B981]/15 font-semibold text-fg' : 'opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0 shadow-xs" />
                      <span className="text-muted-fg text-2xs">Staging</span>
                    </div>
                    <span className="font-mono font-bold text-fg text-2xs">{activeStaging.rawY} IOPS</span>
                  </div>
                )}
                <div className="border-t border-border/40 pt-1 mt-0.5 flex items-center justify-between text-3xs text-muted-fg px-1">
                  <span>Combined Load</span>
                  <span className="font-mono font-bold text-primary">
                    {(activeProd?.rawY || 0) + (activeStaging?.rawY || 0)} IOPS
                  </span>
                </div>
              </div>
            </AreaChart.Tooltip>
          </div>
        )}
      </div>

      {/* Telemetry KPIs */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="p-2 rounded-micro bg-secondary/30 border border-border/50">
          <span className="text-3xs text-muted-fg block">Peak Load</span>
          <span className="font-mono font-bold text-fg">450 IOPS</span>
        </div>
        <div className="p-2 rounded-micro bg-secondary/30 border border-border/50">
          <span className="text-3xs text-muted-fg block">
            {activeCategory ? `Active Slice (${activeCategory})` : 'Avg Saturation'}
          </span>
          <span className="font-mono font-bold text-primary">
            {activeCategory ? `${(activeProd?.rawY || 0) + (activeStaging?.rawY || 0)} IOPS` : '248 IOPS'}
          </span>
        </div>
        <div className="p-2 rounded-micro bg-secondary/30 border border-border/50">
          <span className="text-3xs text-muted-fg block">Focus Target</span>
          <span className={`font-mono font-bold ${hoveredSeries === 'staging' ? 'text-success' : 'text-primary'}`}>
            {hoveredIndex !== null ? (hoveredSeries === 'staging' ? 'Staging Fleet' : 'Production Cloud') : '< 1.8 ms (P99)'}
          </span>
        </div>
      </div>
    </div>
  )
}

export const areaChartDoc: ComponentDocSpec = {
  id: 'area-chart',
  name: 'AreaChart',
  component: AreaChart,
  summary: 'High-performance area visualizer supporting gradient fills, multi-series curves, dynamic token theming, and full compound composition.',
  subcomponents: [
    'AreaChart.Container',
    'AreaChart.Header',
    'AreaChart.Toolbar',
    'AreaChart.Legend',
    'AreaChart.Canvas',
    'AreaChart.Tooltip',
    'AreaChart.Empty',
    'AreaChart.Loading',
    'AreaChart.Footer',
  ],
  playground: {
    defaultProps: {
      curve: 'monotoneX',
      palette: 'brand',
      containerVariant: 'default',
      areaOpacity: 0.3,
      lineWidth: 2.5,
      enablePoints: false,
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
        name: 'enablePoints',
        type: 'boolean',
      },
      {
        name: 'areaOpacity',
        type: 'number',
        min: 0.05,
        max: 0.9,
        step: 0.05,
      },
    ],
    render: (props: any) => (
      <div className="w-full max-w-2xl p-4">
        <AreaChart
          data={areaData}
          title="Compute Cluster Throughput"
          description="Real-time IOPS load distribution over 24-hour cycle."
          badge="450 IOPS Peak"
          height={320}
          timeRanges={['1D', '1W', '1M', '1Y', 'ALL']}
          defaultRange="1D"
          {...props}
        />
      </div>
    ),
  },
  examples: [
    {
      title: 'Custom Canvas Viewport Rendering (Live IOPS Stream & Peak Telemetry)',
      description: 'Using AreaChart.Canvas render-function to directly customize viewport presentation with SVG cubic splines, glowing peak indicators, and live telemetry cards.',
      render: () => (
        <div className="w-full max-w-2xl">
          <AreaChart
            data={areaData}
            palette="brand"
            height={320}
          >
            <AreaChart.Container variant="glass">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-fg">Real-Time IOPS Telemetry</h4>
                  <p className="text-xs text-muted-fg">Custom visualizer stream rendered directly in AreaChart.Canvas</p>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono bg-primary/15 text-primary rounded font-semibold">Live 5s Stream</span>
              </div>
              <div className="p-4">
                <AreaChart.Canvas>
                  {(context: any) => <CustomAreaTelemetryVisualizer series={context.data || areaData} />}
                </AreaChart.Canvas>
              </div>
              <div className="p-3 border-t border-border/40 text-xs text-muted-fg flex justify-between">
                <span>Production (Solid) vs Staging (Dashed)</span>
                <span className="font-mono text-success font-semibold">Nominal Load</span>
              </div>
            </AreaChart.Container>
          </AreaChart>
        </div>
      ),
    },
    {
      title: 'Compound Composed Area Chart',
      description: 'Using AreaChart compound attachments to build a glassmorphic dashboard card.',
      render: () => (
        <div className="w-full max-w-2xl">
          <AreaChart
            data={areaData}
            curve="monotoneX"
            palette="emerald"
            height={240}
            areaOpacity={0.25}
          >
            <AreaChart.Container variant="glass">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-fg">Cluster Resource Load</h4>
                  <p className="text-xs text-muted-fg">Live 24h provisioned capacity usage</p>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono bg-emerald-500/10 text-emerald-500 rounded font-semibold">Healthy</span>
              </div>
              <div className="p-2">
                <AreaChart.Canvas />
              </div>
              <div className="p-3 border-t border-border/40 text-xs text-muted-fg flex justify-between">
                <span>Production + Staging fleets</span>
                <span className="font-mono">Sync latency &lt; 2s</span>
              </div>
            </AreaChart.Container>
          </AreaChart>
        </div>
      ),
    },
    {
      title: 'Stepped & Smooth Comparison',
      description: 'Different curve interpolation modes for step transitions vs organic curves.',
      render: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <AreaChart
            data={areaData.slice(0, 1)}
            title="Step Pipeline Transitions"
            curve="step"
            palette="emerald"
            containerVariant="subtle"
            height={240}
          />
          <AreaChart
            data={areaData.slice(0, 1)}
            title="Natural Smooth Spline"
            curve="natural"
            palette="violet"
            containerVariant="glass"
            height={240}
          />
        </div>
      ),
    },
  ],
}
