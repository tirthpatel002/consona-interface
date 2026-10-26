import React, { useState } from 'react'
import {
  NavBreadcrumbs,
  NavLevelMenu,
  NavOutlet,
  NavigationProvider,
  useNavigation,
  type NavTree,
  type NavNode,
  Button,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'
import {
  ServerIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/20/solid'

const SAMPLE_NAV_TREE: NavTree = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    shortTitle: 'Dashboard',
    icon: ChartBarIcon,
    children: [
      {
        id: 'overview',
        title: 'System Overview',
        shortTitle: 'Overview',
        description: 'Global health metrics and cluster status',
      },
      {
        id: 'metrics',
        title: 'Realtime Telemetry',
        shortTitle: 'Metrics',
        description: 'Throughput and latency histograms',
      },
    ],
  },
  {
    id: 'clusters',
    title: 'Compute Clusters',
    shortTitle: 'Clusters',
    icon: ServerIcon,
    children: [
      {
        id: 'us-east-1',
        title: 'US-East Production',
        shortTitle: 'US-East-1',
        description: 'Primary production Kubernetes pool',
        children: [
          {
            id: 'ingress',
            title: 'Ingress Gateways',
            shortTitle: 'Ingress',
            description: 'Envoy and edge load balancers',
          },
          {
            id: 'workloads',
            title: 'Microservices Workloads',
            shortTitle: 'Workloads',
            description: 'Core application deployment pods',
          },
        ],
      },
      {
        id: 'eu-central-1',
        title: 'EU-Central Primary',
        shortTitle: 'EU-Central-1',
        description: 'GDPR compliant European datacenter',
      },
    ],
  },
  {
    id: 'settings',
    title: 'Platform Settings',
    shortTitle: 'Settings',
    icon: Cog6ToothIcon,
    children: [
      {
        id: 'security',
        title: 'Access & Security',
        shortTitle: 'Security',
        description: 'IAM policies and TLS certificates',
      },
      {
        id: 'logs',
        title: 'Audit Logs',
        shortTitle: 'Audit',
        description: 'Compliance and security event traces',
      },
    ],
  },
]

function NavigationPlayground() {
  const [activeRouteId, setActiveRouteId] = useState('ingress')

  return (
    <div className="flex flex-col gap-6 p-6 w-full max-w-3xl">
      <div className="flex items-center justify-between p-4 rounded-macro border border-border bg-bg/80 backdrop-blur-md">
        <NavBreadcrumbs
          tree={SAMPLE_NAV_TREE}
          activeId={activeRouteId}
          onNavigate={(node: NavNode) => setActiveRouteId(node.id)}
          separator="chevron"
          enableHoverMenus={true}
          enableForwardMenus={true}
        />
        <div className="text-xs font-mono text-muted-fg bg-muted/60 px-2 py-1 rounded-micro border border-border">
          Active: <span className="text-fg font-semibold">{activeRouteId}</span>
        </div>
      </div>

      <div className="p-4 rounded-macro border border-dashed border-border flex flex-col gap-2 bg-muted/20 text-xs">
        <span className="font-semibold text-fg">Tip:</span>
        <span className="text-muted-fg">
          Hover over any breadcrumb segment (e.g. &quot;Compute Clusters&quot; or &quot;US-East-1&quot;) or click the chevron separators to open smooth gliding flyout menus.
        </span>
      </div>
    </div>
  )
}

function NavigationProviderDemo() {
  return (
    <NavigationProvider
      tree={SAMPLE_NAV_TREE}
      defaultId="workloads"
    >
      <NavigationProviderInner />
    </NavigationProvider>
  )
}

function NavigationProviderInner() {
  const { activeNode, navigate } = useNavigation()

  return (
    <div className="flex flex-col gap-4 p-4 border border-border rounded-macro bg-bg">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <NavBreadcrumbs />
        <div className="flex gap-2">
          <Button
            size="sm"
            intent="outline"
            onPress={() => navigate('overview')}
          >
            Go to Overview
          </Button>
          <Button
            size="sm"
            intent="outline"
            onPress={() => navigate('security')}
          >
            Go to Security
          </Button>
        </div>
      </div>
      <div className="p-4 bg-muted/30 rounded-base border border-border/60">
        <div className="text-xs font-semibold text-fg">Active Node Content:</div>
        <div className="text-sm font-medium text-primary mt-1">{activeNode?.title}</div>
        <div className="text-xs text-muted-fg mt-0.5">{activeNode?.description || 'No description'}</div>
      </div>
    </div>
  )
}

export const navigationDoc: ComponentDocSpec = {
  id: 'navigation',
  name: 'Navigation',
  subpath: '@consona/interface/navigation',
  badge: 'Gliding Hierarchy Engine',
  summary:
    'Tree-connected hierarchical navigation engine with single-container gliding flyout menus, cascaded sub-routes, and stateful routing context.',
  subcomponents: ['NavBreadcrumbs', 'NavLevelMenu', 'NavOutlet', 'NavigationProvider'],
  playground: {
    defaultProps: {
      separator: 'chevron',
      enableHoverMenus: true,
      enableForwardMenus: true,
      trigger: 'hover',
    },
    controls: [
      {
        name: 'separator',
        label: 'Separator Style',
        type: 'select',
        options: ['chevron', 'slash', 'arrow', 'bullet'],
        defaultValue: 'chevron',
      },
      {
        name: 'enableHoverMenus',
        label: 'Enable Hover Menus',
        type: 'boolean',
        defaultValue: true,
      },
      {
        name: 'enableForwardMenus',
        label: 'Enable Forward Menus',
        type: 'boolean',
        defaultValue: true,
      },
      {
        name: 'trigger',
        label: 'Trigger Mode',
        type: 'select',
        options: ['hover', 'click', 'both'],
        defaultValue: 'hover',
      },
    ],
    render: () => <NavigationPlayground />,
  },
  examples: [
    {
      title: 'Context Provider & Hooks',
      description: 'Manage active route state across nested components via useNavigation and NavigationProvider.',
      render: () => <NavigationProviderDemo />,
    },
  ],
  recipes: [
    {
      title: 'Connecting Navigation Tree with NavBreadcrumbs',
      description: 'Define an enterprise navigation schema and render with automated flyouts.',
      code: `import { NavBreadcrumbs, type NavTree } from '@consona/interface'

const tree: NavTree = [
  {
    id: 'workspaces',
    title: 'Workspaces',
    children: [
      { id: 'app-1', title: 'Payment API' },
      { id: 'app-2', title: 'Auth Service' },
    ],
  },
]

export function TopNav() {
  return <NavBreadcrumbs tree={tree} activeId="app-1" />
}`,
    },
  ],
  a11yNotes: [
    'NavBreadcrumbs marks the active element with aria-current="page" and provides full keyboard navigation across menu items.',
    'Flyout menus support Escape key dismissal and automatic boundary flipping.',
  ],
}
