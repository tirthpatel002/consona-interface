import React from 'react'
import { SankeyChart } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const sankeyData = {
  nodes: [
    { id: 'Organic Traffic' },
    { id: 'Paid Search' },
    { id: 'Referral' },
    { id: 'Landing Page' },
    { id: 'Pricing Page' },
    { id: 'Trial Signup' },
    { id: 'Enterprise Demo' },
    { id: 'Paid Customer' },
    { id: 'Churned' },
  ],
  links: [
    { source: 'Organic Traffic', target: 'Landing Page', value: 3400 },
    { source: 'Paid Search', target: 'Landing Page', value: 2100 },
    { source: 'Referral', target: 'Landing Page', value: 850 },
    { source: 'Landing Page', target: 'Pricing Page', value: 4200 },
    { source: 'Landing Page', target: 'Churned', value: 2150 },
    { source: 'Pricing Page', target: 'Trial Signup', value: 2600 },
    { source: 'Pricing Page', target: 'Enterprise Demo', value: 950 },
    { source: 'Pricing Page', target: 'Churned', value: 650 },
    { source: 'Trial Signup', target: 'Paid Customer', value: 1400 },
    { source: 'Trial Signup', target: 'Churned', value: 1200 },
    { source: 'Enterprise Demo', target: 'Paid Customer', value: 680 },
    { source: 'Enterprise Demo', target: 'Churned', value: 270 },
  ],
}

export const sankeyChartDoc: ComponentDocSpec = {
  id: 'sankey-chart',
  name: 'SankeyChart',
  component: SankeyChart,
  summary: 'Flow and transfer visualizer illustrating directional volume migrations, conversion pathways, drop-offs, and full compound composition.',
  subcomponents: [
    'SankeyChart.Container',
    'SankeyChart.Header',
    'SankeyChart.Toolbar',
    'SankeyChart.Legend',
    'SankeyChart.Canvas',
    'SankeyChart.Tooltip',
    'SankeyChart.Empty',
    'SankeyChart.Loading',
    'SankeyChart.Footer',
  ],
  playground: {
    defaultProps: {
      nodeOpacity: 1,
      nodeHoverOpacity: 1,
      linkOpacity: 0.35,
      linkHoverOpacity: 0.7,
      nodeSpacing: 18,
      nodeThickness: 16,
      nodeBorderRadius: 3,
      palette: 'brand',
      containerVariant: 'default',
    },
    controls: [
      {
        name: 'nodeThickness',
        type: 'number',
        min: 8,
        max: 32,
        step: 2,
      },
      {
        name: 'nodeSpacing',
        type: 'number',
        min: 10,
        max: 40,
        step: 2,
      },
      {
        name: 'linkOpacity',
        type: 'number',
        min: 0.1,
        max: 0.8,
        step: 0.05,
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
        <SankeyChart
          data={sankeyData}
          title="Customer Acquisition Flow"
          description="Traffic channel volume routing to activation and customer conversion."
          badge="32.8% Conversion"
          height={360}
          {...props}
        />
      </div>
    ),
  },
  examples: [
    {
      title: 'Compound Composed Flow Pipeline',
      description: 'Using SankeyChart.Container and SankeyChart.Canvas for user journey lifecycle mapping.',
      render: () => (
        <div className="w-full max-w-2xl">
          <SankeyChart
            data={sankeyData}
            palette="brand"
            nodeThickness={18}
            nodeSpacing={20}
            linkOpacity={0.35}
            height={280}
          >
            <SankeyChart.Container variant="glass">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-fg">Funnel Flow Pipeline</h4>
                  <p className="text-xs text-muted-fg">Conversion migration routing across stages</p>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono bg-primary/15 text-primary rounded font-semibold">9 Nodes Active</span>
              </div>
              <div className="p-2">
                <SankeyChart.Canvas />
              </div>
              <div className="p-3 border-t border-border/40 text-xs text-muted-fg flex justify-between">
                <span>Top drop-off: Landing &rarr; Churned</span>
                <span className="font-mono">Sync active</span>
              </div>
            </SankeyChart.Container>
          </SankeyChart>
        </div>
      ),
    },
    {
      title: 'Glassmorphic Flow Topology',
      description: 'Sleek dark/light flow diagram with frosted container.',
      render: () => (
        <div className="w-full">
          <SankeyChart
            data={sankeyData}
            title="Activation Pathway Breakdown"
            palette="emerald"
            containerVariant="glass"
            nodeThickness={20}
            nodeSpacing={22}
            linkOpacity={0.4}
            height={320}
          />
        </div>
      ),
    },
  ],
}
