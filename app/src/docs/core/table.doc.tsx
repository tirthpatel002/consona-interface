import React, { useState } from 'react'
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  TableFooter,
  Badge,
  Button,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/20/solid'

interface UserRecord {
  id: string
  name: string
  role: string
  status: 'active' | 'pending' | 'suspended'
  email: string
  bandwidth: string
}

const sampleUsers: UserRecord[] = [
  { id: '1', name: 'Elena Rostova', role: 'Staff Engineer', status: 'active', email: 'elena@consona.dev', bandwidth: '4.2 TB/mo' },
  { id: '2', name: 'Marcus Vance', role: 'Security Architect', status: 'active', email: 'marcus@consona.dev', bandwidth: '1.8 TB/mo' },
  { id: '3', name: 'Sophia Chen', role: 'Product Designer', status: 'pending', email: 'sophia@consona.dev', bandwidth: '620 GB/mo' },
  { id: '4', name: 'Alex Rivera', role: 'DevOps Lead', status: 'active', email: 'alex@consona.dev', bandwidth: '8.9 TB/mo' },
  { id: '5', name: 'Devon Bell', role: 'Infrastructure Tech', status: 'suspended', email: 'devon@consona.dev', bandwidth: '120 GB/mo' },
]

export const tableDoc: ComponentDocSpec = {
  id: 'table',
  name: 'Table',
  component: Table,
  badge: 'Core Atom',
  summary: 'Accessible, responsive tabular data presentation with interactive sorting, row selection, zebra stripes, and column resizing.',
  subcomponents: [
    'TableHeader',
    'TableColumn',
    'TableBody',
    'TableRow',
    'TableCell',
    'TableFooter',
    'ColumnResizer',
    'ResizableTableContainer',
  ],
  playground: {
    defaultProps: {
      striped: false,
      grid: false,
      bleed: false,
      selectionMode: 'multiple',
    },
    controls: [
      { name: 'striped', type: 'boolean' },
      { name: 'grid', type: 'boolean' },
      { name: 'bleed', type: 'boolean' },
      {
        name: 'selectionMode',
        type: 'select',
        options: ['none', 'single', 'multiple'],
      },
    ],
    render: (props: any) => {
      const [selectedKeys, setSelectedKeys] = useState<any>(new Set(['1', '3']))

      const renderStatusBadge = (status: UserRecord['status']) => {
        switch (status) {
          case 'active':
            return <Badge intent="success">Active</Badge>
          case 'pending':
            return <Badge intent="warning">Pending</Badge>
          case 'suspended':
            return <Badge intent="danger">Suspended</Badge>
        }
      }

      return (
        <div className="w-full">
          <Table
            aria-label="Playground User Management Table"
            striped={props.striped}
            grid={props.grid}
            bleed={props.bleed}
            selectionMode={props.selectionMode}
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
          >
            <TableHeader>
              <TableColumn id="name" isRowHeader allowsSorting>
                Name
              </TableColumn>
              <TableColumn id="role">Role</TableColumn>
              <TableColumn id="status">Status</TableColumn>
              <TableColumn id="email">Email</TableColumn>
              <TableColumn id="bandwidth" className="text-end">Bandwidth</TableColumn>
            </TableHeader>
            <TableBody items={sampleUsers}>
              {(user) => (
                <TableRow id={user.id}>
                  <TableCell className="font-medium text-fg">{user.name}</TableCell>
                  <TableCell className="text-muted-fg">{user.role}</TableCell>
                  <TableCell>{renderStatusBadge(user.status)}</TableCell>
                  <TableCell className="text-muted-fg font-mono text-xs">{user.email}</TableCell>
                  <TableCell className="text-end font-mono text-xs">{user.bandwidth}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )
    },
  },
  examples: [
    {
      title: 'Sorting & Interactive Column Headers',
      description: 'Columns with allowsSorting enable native accessible ascending/descending sorting descriptors.',
      render: () => {
        const [sortDescriptor, setSortDescriptor] = useState<{ column: string; direction: 'ascending' | 'descending' }>({
          column: 'bandwidth',
          direction: 'descending',
        })

        const sortedUsers = [...sampleUsers].sort((a, b) => {
          const col = sortDescriptor.column as keyof UserRecord
          const cmp = a[col].localeCompare(b[col])
          return sortDescriptor.direction === 'descending' ? -cmp : cmp
        })

        return (
          <div className="w-full">
            <Table
              aria-label="Sorted Cluster Metrics"
              sortDescriptor={sortDescriptor as any}
              onSortChange={(desc) => setSortDescriptor(desc as any)}
            >
              <TableHeader>
                <TableColumn id="name" allowsSorting isRowHeader>
                  Engineer
                </TableColumn>
                <TableColumn id="role" allowsSorting>
                  Assignment
                </TableColumn>
                <TableColumn id="bandwidth" allowsSorting className="text-end">
                  Bandwidth (TB)
                </TableColumn>
              </TableHeader>
              <TableBody items={sortedUsers}>
                {(user) => (
                  <TableRow id={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell className="text-end font-mono text-sm">{user.bandwidth}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )
      },
    },
    {
      title: 'Striped & Grid Variant with Summary Footer',
      description: 'Zebra striping and cell grid borders for dense financial and telemetry ledgers.',
      render: () => (
        <div className="w-full">
          <Table aria-label="Financial Ledger" striped grid>
            <TableHeader>
              <TableColumn id="invoice" isRowHeader>Invoice ID</TableColumn>
              <TableColumn id="client">Client</TableColumn>
              <TableColumn id="period">Billing Cycle</TableColumn>
              <TableColumn id="total" className="text-end">Amount</TableColumn>
            </TableHeader>
            <TableBody>
              <TableRow id="inv-101">
                <TableCell className="font-mono text-xs font-semibold text-primary">INV-2026-001</TableCell>
                <TableCell>Acme Cloud Services</TableCell>
                <TableCell className="text-muted-fg">Sep 2026</TableCell>
                <TableCell className="text-end font-mono font-medium">$14,250.00</TableCell>
              </TableRow>
              <TableRow id="inv-102">
                <TableCell className="font-mono text-xs font-semibold text-primary">INV-2026-002</TableCell>
                <TableCell>Vanguard Robotics</TableCell>
                <TableCell className="text-muted-fg">Sep 2026</TableCell>
                <TableCell className="text-end font-mono font-medium">$8,400.00</TableCell>
              </TableRow>
              <TableRow id="inv-103">
                <TableCell className="font-mono text-xs font-semibold text-primary">INV-2026-003</TableCell>
                <TableCell>Helios Dynamics</TableCell>
                <TableCell className="text-muted-fg">Sep 2026</TableCell>
                <TableCell className="text-end font-mono font-medium">$23,900.00</TableCell>
              </TableRow>
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="font-semibold text-muted-fg">Total Revenue</TableCell>
                <TableCell className="text-end font-mono font-bold text-fg">$46,550.00</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      ),
    },
    {
      title: 'Empty State Fallback',
      description: 'Graceful rendering when no rows or query matches exist.',
      render: () => (
        <div className="w-full">
          <Table aria-label="Empty Search Results">
            <TableHeader>
              <TableColumn id="id" isRowHeader>Order ID</TableColumn>
              <TableColumn id="customer">Customer</TableColumn>
              <TableColumn id="status">Status</TableColumn>
            </TableHeader>
            <TableBody
              items={[]}
              renderEmptyState={() => (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <ExclamationTriangleIcon className="size-8 text-muted-fg mb-2" />
                  <p className="font-medium text-fg">No matching records found</p>
                  <p className="text-xs text-muted-fg mt-1">Try adjusting your active filters or search terms.</p>
                </div>
              )}
            >
              {() => <TableRow id="empty"><TableCell /><TableCell /><TableCell /></TableRow>}
            </TableBody>
          </Table>
        </div>
      ),
    },
  ],
  recipes: [
    {
      title: 'Custom Striped Ledger via Table.extend()',
      description: 'Create a pre-configured dense financial table preset.',
      code: `export const FinancialTable = Table.extend({\n  name: 'FinancialTable',\n  props: {\n    striped: true,\n    grid: true,\n    bleed: false,\n  },\n})`,
    },
  ],
  a11yNotes: [
    'Uses semantic WAI-ARIA grid role semantics provided by React Aria Components.',
    'Row selection utilizes native keyboard navigation (Arrow Up/Down, Space to select).',
    'Sortable column headers expose aria-sort values (ascending/descending/none).',
  ],
}
