import React from 'react'
import {
  Tabs,
  TabList,
  Tab,
  TabPanel,
  SegmentedControl,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'
import {
  CpuChipIcon,
  ShieldCheckIcon,
  ChartBarIcon,
} from '@heroicons/react/20/solid'

export const tabsDoc: ComponentDocSpec = {
  id: 'tabs',
  name: 'Tabs',
  component: Tabs,
  summary: 'Accessible tab matrix container with pill, segmented, and underline optical variants.',
  subcomponents: [
    'TabList',
    'Tab',
    'TabPanel',
    'SegmentedControl',
  ],
  playground: {
    defaultProps: {
      variant: 'pill',
      orientation: 'horizontal',
      size: 'md',
      animationType: 'fade',
    },
    controls: [
      { name: 'variant', type: 'select', options: ['pill', 'segmented', 'underline', 'bordered'] },
      { name: 'size', type: 'select', options: ['xs', 'sm', 'md', 'lg'] },
      { name: 'orientation', type: 'select', options: ['horizontal', 'vertical'] },
      { name: 'animationType', type: 'select', options: ['fade', 'lift', 'slide'] },
    ],
    render: (props: any) => (
      <div className="w-full max-w-xl p-6">
        <Tabs defaultSelectedKey="overview" variant={props.variant} size={props.size} orientation={props.orientation}>
          <TabList>
            <Tab id="overview" icon={<ChartBarIcon />}>Overview</Tab>
            <Tab id="hardware" icon={<CpuChipIcon />} badge="4 Nodes">Hardware</Tab>
            <Tab id="security" icon={<ShieldCheckIcon />}>Security</Tab>
          </TabList>
          <TabPanel id="overview" animationType={props.animationType} className="p-4 rounded-macro border border-border/80 bg-overlay/30 text-xs text-muted-fg">
            Overview metrics and real-time dashboard telemetry overview.
          </TabPanel>
          <TabPanel id="hardware" animationType={props.animationType} className="p-4 rounded-macro border border-border/80 bg-overlay/30 text-xs text-muted-fg">
            Hardware node topology, CPU allocations, and cluster memory pools.
          </TabPanel>
          <TabPanel id="security" animationType={props.animationType} className="p-4 rounded-macro border border-border/80 bg-overlay/30 text-xs text-muted-fg">
            Firewall rule inspection, mTLS encryption verification, and zero-trust policies.
          </TabPanel>
        </Tabs>
      </div>
    ),
  },
  examples: [
    {
      title: 'Size Scale Matrix (xs, sm, md, lg)',
      description: 'Standard sizing tokens scaling height, typography, and padding proportionally.',
      render: () => (
        <div className="flex flex-col gap-6 w-full max-w-lg">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono text-muted-fg">Extra Small (size="xs")</span>
            <Tabs defaultSelectedKey="1" size="xs" variant="pill">
              <TabList>
                <Tab id="1">Metrics</Tab>
                <Tab id="2">Logs</Tab>
                <Tab id="3" badge="12">Traces</Tab>
              </TabList>
            </Tabs>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono text-muted-fg">Small (size="sm")</span>
            <Tabs defaultSelectedKey="1" size="sm" variant="pill">
              <TabList>
                <Tab id="1">Metrics</Tab>
                <Tab id="2">Logs</Tab>
                <Tab id="3" badge="12">Traces</Tab>
              </TabList>
            </Tabs>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono text-muted-fg">Medium Default (size="md")</span>
            <Tabs defaultSelectedKey="1" size="md" variant="pill">
              <TabList>
                <Tab id="1">Metrics</Tab>
                <Tab id="2">Logs</Tab>
                <Tab id="3" badge="12">Traces</Tab>
              </TabList>
            </Tabs>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono text-muted-fg">Large (size="lg")</span>
            <Tabs defaultSelectedKey="1" size="lg" variant="pill">
              <TabList>
                <Tab id="1">Metrics</Tab>
                <Tab id="2">Logs</Tab>
                <Tab id="3" badge="12">Traces</Tab>
              </TabList>
            </Tabs>
          </div>
        </div>
      ),
    },
    {
      title: 'Custom Sized & Styled Tabs',
      description: 'Applying custom dimensional overrides, extra spacious padding, and custom typography classes.',
      render: () => (
        <Tabs defaultSelectedKey="design" variant="segmented" className="w-full max-w-lg">
          <TabList className="p-1.5 rounded-2xl bg-muted/60 backdrop-blur-md border border-border/60">
            <Tab id="design" className="h-11 px-6 text-sm font-semibold rounded-xl" icon={<ChartBarIcon />}>
              Design System
            </Tab>
            <Tab id="tokens" className="h-11 px-6 text-sm font-semibold rounded-xl" badge="v2.4">
              Design Tokens
            </Tab>
            <Tab id="icons" className="h-11 px-6 text-sm font-semibold rounded-xl" icon={<CpuChipIcon />}>
              Icon Set
            </Tab>
          </TabList>
          <TabPanel id="design" className="p-5 mt-3 rounded-2xl border border-border/80 bg-overlay/40 text-xs text-muted-fg">
            Custom high-density design system workspace and component guidelines.
          </TabPanel>
          <TabPanel id="tokens" className="p-5 mt-3 rounded-2xl border border-border/80 bg-overlay/40 text-xs text-muted-fg">
            Global color ramps, typography scale, spacing scales, and optical elevations.
          </TabPanel>
          <TabPanel id="icons" className="p-5 mt-3 rounded-2xl border border-border/80 bg-overlay/40 text-xs text-muted-fg">
            Comprehensive SVG icon symbol catalog with dynamic stroke thickness tokens.
          </TabPanel>
        </Tabs>
      ),
    },
    {
      title: 'Segmented Control Switcher',
      description: 'Compact density toggle for view modes.',
      render: () => (
        <SegmentedControl defaultSelectedKey="grid" size="sm">
          <TabList>
            <Tab id="grid">Grid View</Tab>
            <Tab id="table">Table View</Tab>
            <Tab id="graph">Topology Graph</Tab>
          </TabList>
        </SegmentedControl>
      ),
    },
    {
      title: 'Vertical Navigation Rail',
      description: 'Vertical layout for sidebar navigation with segmented variant.',
      render: () => (
        <Tabs orientation="vertical" defaultSelectedKey="general">
          <TabList>
            <Tab id="general">General Settings</Tab>
            <Tab id="billing" badge="Pro">Billing & Plan</Tab>
            <Tab id="team">Team Members</Tab>
          </TabList>
          <TabPanel id="general" className="p-4 rounded-macro border border-border/80 bg-overlay/30 text-xs text-muted-fg flex-1">
            General workspace preferences, default currency, and timezone configurations.
          </TabPanel>
          <TabPanel id="billing" className="p-4 rounded-macro border border-border/80 bg-overlay/30 text-xs text-muted-fg flex-1">
            Manage your Pro subscription, invoices, and payment methods.
          </TabPanel>
          <TabPanel id="team" className="p-4 rounded-macro border border-border/80 bg-overlay/30 text-xs text-muted-fg flex-1">
            Invite teammates and configure granular workspace role permissions.
          </TabPanel>
        </Tabs>
      ),
    },
  ],
}
