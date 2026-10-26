import React from 'react'
import {
  DescriptionList,
  DescriptionTerm,
  DescriptionDetails,
  Badge,
  Button,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'
import {
  CheckCircleIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  KeyIcon,
} from '@heroicons/react/20/solid'

export const descriptionListDoc: ComponentDocSpec = {
  id: 'description-list',
  name: 'DescriptionList',
  component: DescriptionList,
  badge: 'Core Atom',
  summary: 'Structured definition list for displaying key-value metadata pairs with optical alignment and responsive two-column layouts.',
  subcomponents: ['DescriptionTerm', 'DescriptionDetails'],
  playground: {
    defaultProps: {},
    controls: [],
    render: () => {
      return (
        <div className="w-full max-w-xl p-6 rounded-base border border-border bg-card">
          <h3 className="text-base font-semibold text-fg mb-4">Instance Configuration</h3>
          <DescriptionList>
            <DescriptionTerm>Cluster ID</DescriptionTerm>
            <DescriptionDetails className="font-mono text-xs">cls-prd-us-east-9042</DescriptionDetails>

            <DescriptionTerm>Deployment Zone</DescriptionTerm>
            <DescriptionDetails>us-east-1a (N. Virginia)</DescriptionDetails>

            <DescriptionTerm>Operating Status</DescriptionTerm>
            <DescriptionDetails>
              <Badge intent="success">Online & Healthy</Badge>
            </DescriptionDetails>

            <DescriptionTerm>Node Capacity</DescriptionTerm>
            <DescriptionDetails>64 vCPU / 256 GB RAM</DescriptionDetails>

            <DescriptionTerm>Public IP Address</DescriptionTerm>
            <DescriptionDetails className="font-mono text-xs text-primary">198.51.100.245</DescriptionDetails>

            <DescriptionTerm>Auto-Scaling Policy</DescriptionTerm>
            <DescriptionDetails className="text-muted-fg">Target CPU 70%, Min 3 nodes, Max 24 nodes</DescriptionDetails>
          </DescriptionList>
        </div>
      )
    },
  },
  examples: [
    {
      title: 'Customer & Subscription Overview',
      description: 'Clean profile ledger with badges, formatted currencies, and actions.',
      render: () => (
        <div className="w-full max-w-2xl p-6 rounded-base border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
            <div>
              <h4 className="font-semibold text-fg">Enterprise Plan Overview</h4>
              <p className="text-xs text-muted-fg mt-0.5">Account #ACC-99214 • Renewal in 42 days</p>
            </div>
            <Button size="sm" intent="primary">Upgrade Tier</Button>
          </div>

          <DescriptionList>
            <DescriptionTerm>Plan Tier</DescriptionTerm>
            <DescriptionDetails>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Dedicated Multi-Tenant</span>
                <Badge intent="primary">Enterprise</Badge>
              </div>
            </DescriptionDetails>

            <DescriptionTerm>Monthly Rate</DescriptionTerm>
            <DescriptionDetails className="font-mono font-semibold">$2,499.00 / month</DescriptionDetails>

            <DescriptionTerm>Security Clearance</DescriptionTerm>
            <DescriptionDetails>
              <div className="flex items-center gap-1.5 text-xs text-success font-medium">
                <ShieldCheckIcon className="size-4" />
                SOC2 Type II & HIPAA Certified
              </div>
            </DescriptionDetails>

            <DescriptionTerm>Primary Admin</DescriptionTerm>
            <DescriptionDetails>elena.rostova@acmecorp.com</DescriptionDetails>
          </DescriptionList>
        </div>
      ),
    },
  ],
  recipes: [
    {
      title: 'Semantic Key-Value List with DescriptionList.extend()',
      description: 'Enforce consistent spacing and typography tokens across admin summaries.',
      code: `export const SystemMetadataList = DescriptionList.extend({\n  name: 'SystemMetadataList',\n  props: {\n    className: 'gap-y-2',\n  },\n})`,
    },
  ],
  a11yNotes: [
    'Renders semantic HTML <dl>, <dt>, and <dd> elements for accessible screen reader navigation.',
    'Maintains strict dt/dd pairing relationship for assistive technology indexing.',
  ],
}
