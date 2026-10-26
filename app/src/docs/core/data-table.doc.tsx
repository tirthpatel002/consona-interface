import React, { useState } from 'react'
import {
  DataTable,
  Badge,
  Button,
  Switch,
  type DataTableColumn,
} from '@consona/interface'
import { toast } from 'sonner'
import type { ComponentDocSpec } from '../types'
import {
  PencilSquareIcon,
  ServerIcon,
  TrashIcon,
  ArrowPathIcon,
  BoltIcon,
  SignalIcon,
} from '@heroicons/react/20/solid'

interface ServerNode {
  id: string
  name: string
  region: string
  ip: string
  cpu: string
  memory: string
  status: 'healthy' | 'warning' | 'degraded' | 'offline'
  uptime: string
  autoScale: boolean
}

const mockServers: ServerNode[] = [
  { id: 'node-1', name: 'us-east-edge-01', region: 'us-east-1 (Virginia)', ip: '198.51.100.12', cpu: '24%', memory: '12.4 / 64 GB', status: 'healthy', uptime: '99.98%', autoScale: true },
  { id: 'node-2', name: 'eu-west-ingress-02', region: 'eu-west-1 (Ireland)', ip: '198.51.100.45', cpu: '88%', memory: '58.1 / 64 GB', status: 'warning', uptime: '99.82%', autoScale: false },
  { id: 'node-3', name: 'ap-south-gateway-01', region: 'ap-south-1 (Mumbai)', ip: '198.51.100.78', cpu: '45%', memory: '24.8 / 32 GB', status: 'healthy', uptime: '99.99%', autoScale: true },
  { id: 'node-4', name: 'sa-east-cache-03', region: 'sa-east-1 (São Paulo)', ip: '198.51.100.91', cpu: '94%', memory: '62.0 / 64 GB', status: 'degraded', uptime: '98.45%', autoScale: false },
  { id: 'node-5', name: 'us-west-compute-04', region: 'us-west-2 (Oregon)', ip: '198.51.100.112', cpu: '12%', memory: '8.2 / 32 GB', status: 'healthy', uptime: '100.0%', autoScale: true },
  { id: 'node-6', name: 'ap-northeast-db-01', region: 'ap-northeast-1 (Tokyo)', ip: '198.51.100.144', cpu: '0%', memory: '0.0 / 64 GB', status: 'offline', uptime: '94.20%', autoScale: false },
  { id: 'node-7', name: 'eu-central-backup-01', region: 'eu-central-1 (Frankfurt)', ip: '198.51.100.165', cpu: '31%', memory: '16.0 / 32 GB', status: 'healthy', uptime: '99.95%', autoScale: true },
  { id: 'node-8', name: 'us-central-gpu-01', region: 'us-central-1 (Iowa)', ip: '198.51.100.180', cpu: '76%', memory: '112.0 / 128 GB', status: 'healthy', uptime: '99.91%', autoScale: true },
  { id: 'node-9', name: 'ca-central-auth-02', region: 'ca-central-1 (Montreal)', ip: '198.51.100.199', cpu: '18%', memory: '6.4 / 16 GB', status: 'healthy', uptime: '99.99%', autoScale: false },
  { id: 'node-10', name: 'me-central-vault-01', region: 'me-central-1 (Dubai)', ip: '198.51.100.210', cpu: '52%', memory: '34.0 / 64 GB', status: 'warning', uptime: '99.70%', autoScale: true },
  { id: 'node-11', name: 'af-south-edge-01', region: 'af-south-1 (Cape Town)', ip: '198.51.100.222', cpu: '22%', memory: '14.1 / 32 GB', status: 'healthy', uptime: '99.88%', autoScale: false },
  { id: 'node-12', name: 'ap-southeast-mq-01', region: 'ap-southeast-1 (Singapore)', ip: '198.51.100.240', cpu: '67%', memory: '48.2 / 64 GB', status: 'healthy', uptime: '99.96%', autoScale: true },
]

const renderStatusBadge = (status: ServerNode['status']) => {
  switch (status) {
    case 'healthy':
      return <Badge intent="success">Healthy</Badge>
    case 'warning':
      return <Badge intent="warning">High Load</Badge>
    case 'degraded':
      return <Badge intent="danger">Degraded</Badge>
    case 'offline':
      return <Badge intent="secondary">Offline</Badge>
  }
}

const createServerColumns = (
  onToggleAutoScale?: (id: string) => void,
  onPingNode?: (node: ServerNode) => void,
  onOptimizeNode?: (node: ServerNode) => void
): DataTableColumn<ServerNode>[] => [
  {
    id: 'name',
    header: 'Node Identifier',
    accessorKey: 'name',
    sortable: true,
    freeze: true,
    cell: (row: ServerNode) => (
      <div className="flex items-center gap-2">
        <ServerIcon className="size-4 text-primary shrink-0" />
        <span className="font-semibold text-fg">{row.name}</span>
      </div>
    ),
  },
  {
    id: 'region',
    header: 'Region',
    accessorKey: 'region',
    sortable: true,
  },
  {
    id: 'status',
    header: 'Health',
    accessorKey: 'status',
    sortable: true,
    cell: (row: ServerNode) => renderStatusBadge(row.status),
  },
  {
    id: 'cpu',
    header: 'CPU Usage',
    accessorKey: 'cpu',
    sortable: true,
    cell: (row: ServerNode) => <span className="font-mono text-xs">{row.cpu}</span>,
  },
  {
    id: 'autoScale',
    header: 'Auto-Scaling',
    accessorKey: 'autoScale',
    cell: (row: ServerNode) => (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Switch
          isSelected={row.autoScale}
          onChange={() => onToggleAutoScale?.(row.id)}
          aria-label={`Toggle auto-scaling for ${row.name}`}
        />
        <span className={row.autoScale ? 'text-xs font-medium text-primary' : 'text-xs text-muted-fg'}>
          {row.autoScale ? 'Active' : 'Manual'}
        </span>
      </div>
    ),
  },
  {
    id: 'quickActions',
    header: 'Quick Action',
    cell: (row: ServerNode) => (
      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <Button
          size="xs"
          intent="outline"
          onClick={() => onPingNode?.(row)}
          className="h-7 text-[11px] gap-1 px-2"
        >
          <SignalIcon className="size-3 text-emerald-500" />
          Ping
        </Button>
        <Button
          size="xs"
          intent="secondary"
          onClick={() => onOptimizeNode?.(row)}
          className="h-7 text-[11px] gap-1 px-2"
        >
          <BoltIcon className="size-3 text-amber-500" />
          Optimize
        </Button>
      </div>
    ),
  },
  {
    id: 'uptime',
    header: 'SLA Uptime',
    accessorKey: 'uptime',
    cell: (row: ServerNode) => <span className="font-mono text-xs text-muted-fg">{row.uptime}</span>,
  },
]

const serverColumns = createServerColumns()

const getRowOptions = (row: ServerNode) => [
  {
    label: 'Restart Node',
    icon: <ArrowPathIcon className="size-4" />,
    onClick: (r: ServerNode) => toast.info(`Restarting node ${r.name}`),
  },
  {
    label: 'Edit Configuration',
    icon: <PencilSquareIcon className="size-4" />,
    onClick: (r: ServerNode) => toast.info(`Editing configuration for ${r.name}`),
  },
  {
    label: 'Decommission',
    icon: <TrashIcon className="size-4" />,
    variant: 'destructive' as const,
    onClick: (r: ServerNode) => toast.error(`Decommissioning ${r.name}`),
  },
]

export const dataTableDoc: ComponentDocSpec = {
  id: 'data-table',
  name: 'DataTable',
  component: DataTable,
  badge: 'Enterprise Composite',
  summary: 'Enterprise-grade virtualized and paginated data table featuring multi-column sorting, row selection, faceted column filters, sticky headers, and compound slots.',
  subcomponents: [
    'DataTable',
    'DataTable.Header',
    'DataTable.Body',
    'DataTable.Row',
    'DataTable.Head',
    'DataTable.Cell',
    'DataTable.SelectionBar',
    'DataTable.Toolbar',
    'DataTable.Pagination',
    'DataTable.ColumnManager',
    'DataTable.ExportButton',
    'DataTable.EmptyState',
  ],
  playground: {
    defaultProps: {
      searchable: true,
      pagination: true,
      pageSize: 5,
      enableRowSelection: true,
      enableRowPinning: true,
      striped: false,
      loading: false,
      showColumnVisibility: true,
    },
    controls: [
      { name: 'searchable', type: 'boolean' },
      { name: 'pagination', type: 'boolean' },
      { name: 'pageSize', type: 'number', min: 2, max: 20, step: 1 },
      { name: 'enableRowSelection', type: 'boolean' },
      { name: 'enableRowPinning', type: 'boolean' },
      { name: 'striped', type: 'boolean' },
      { name: 'loading', type: 'boolean' },
      { name: 'showColumnVisibility', type: 'boolean' },
    ],
    render: (props: any) => {
      const [servers, setServers] = useState<ServerNode[]>(mockServers)

      const handleToggleAutoScale = (id: string) => {
        setServers((prev) =>
          prev.map((s) => {
            if (s.id === id) {
              const nextState = !s.autoScale
              toast.success(`Node ${s.name}: Auto-scaling ${nextState ? 'enabled' : 'disabled'}`, {
                description: nextState ? 'Dynamic load-balancer will auto-scale replica pods.' : 'Cluster set to fixed provision capacity.',
              })
              return { ...s, autoScale: nextState }
            }
            return s
          })
        )
      }

      const handlePingNode = (node: ServerNode) => {
        toast.info(`Ping dispatched to ${node.name} (${node.ip})`, {
          description: `Latency: ${Math.floor(Math.random() * 20 + 8)}ms · Loss: 0% · Status: OK`,
        })
      }

      const handleOptimizeNode = (node: ServerNode) => {
        toast.success(`Memory compaction & cache optimization applied to ${node.name}`, {
          description: `Freed 1.4 GB buffers across 8 worker threads.`,
        })
      }

      const interactiveColumns = createServerColumns(
        handleToggleAutoScale,
        handlePingNode,
        handleOptimizeNode
      )

      return (
        <div className="w-full">
          <DataTable
            data={servers}
            columns={interactiveColumns}
            searchable={props.searchable}
            searchPlaceholder="Filter clusters and nodes..."
            pagination={props.pagination}
            pageSize={props.pageSize}
            pageSizeOptions={[5, 10, 20]}
            enableRowSelection={props.enableRowSelection}
            enableRowPinning={props.enableRowPinning}
            striped={props.striped}
            loading={props.loading}
            showColumnVisibility={props.showColumnVisibility}
            rowOptions={getRowOptions}
          />
        </div>
      )
    },
  },
  examples: [
    {
      title: 'Composed Compound DataTable Layout',
      description: 'Fully custom layout orchestrating DataTable compound subcomponents with custom toolbar actions.',
      render: () => {
        return (
          <div className="w-full">
            <DataTable
              data={mockServers}
              columns={serverColumns}
              enableRowSelection
              pagination
              pageSize={4}
              rowOptions={getRowOptions}
            >
              {({ state }) => (
                <div className="flex flex-col">
                  {/* <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-fg">
                      Active Cluster Nodes ({state.data.length})
                    </span>
                    <div className="flex items-center gap-2">
                      <DataTable.ColumnManager />
                      <DataTable.ExportButton />
                    </div>
                  </div> */}
                  <DataTable.Toolbar />
                  <div className="overflow-x-auto rounded-base border border-none">
                    <table className="w-full text-xs text-left">
                      <DataTable.Header />
                      <DataTable.Body />
                    </table>
                  </div>
                  <DataTable.Pagination />
                </div>
              )}
            </DataTable>
          </div>
        )
      },
    },
  ],
  recipes: [
    {
      title: 'Custom High-Density Audit Table via DataTable.extend()',
      description: 'Preset standard table configurations for high-density audit views.',
      code: `export const AuditTable = DataTable.extend({\n  name: 'AuditTable',\n  props: {\n    compact: true,\n    bordered: true,\n    striped: true,\n    pageSize: 25,\n  },\n})`,
    },
  ],
  a11yNotes: [
    'Proper ARIA attributes (role="table", role="row", role="columnheader", role="cell", aria-sort) are automatically attached.',
    'Select all and row checkboxes have appropriate aria-label properties.',
    'Pagination controls support full keyboard navigation and announce current page and row index.',
  ],
}
