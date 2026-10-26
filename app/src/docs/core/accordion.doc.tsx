import React from 'react'
import {
  Accordion,
  AccordionItem,
  Collapsible,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'
import {
  ShieldCheckIcon,
  ServerStackIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/20/solid'

export const accordionDoc: ComponentDocSpec = {
  id: 'accordion',
  name: 'Accordion',
  component: Accordion,
  summary: 'Expandable disclosure accordion matrix with bordered, separated, and flush optical variants.',
  subcomponents: [
    'AccordionItem',
    'AccordionTrigger',
    'AccordionHeading',
    'AccordionContent',
    'Collapsible',
  ],
  playground: {
    defaultProps: {
      variant: 'bordered',
      allowsMultipleExpansion: true,
    },
    controls: [
      { name: 'variant', type: 'select', options: ['bordered', 'separated', 'flush'] },
      { name: 'allowsMultipleExpansion', type: 'boolean' },
    ],
    render: (props: any) => (
      <div className="w-full max-w-md p-6">
        <Accordion {...props}>
          <AccordionItem
            id="infra"
            title="Infrastructure Provisioning"
            description="Terraform state & AWS VPC routing"
            icon={<ServerStackIcon />}
          >
            Configures automated multi-region VPC peering, egress gateways, and direct connect links.
          </AccordionItem>
          <AccordionItem
            id="security"
            title="Zero-Trust Authentication"
            description="mTLS and OAuth2 provider sync"
            icon={<ShieldCheckIcon />}
          >
            Enforces strict mutual TLS authentication between all internal micro-services and API gateways.
          </AccordionItem>
          <AccordionItem
            id="tuning"
            title="Optical Theme Parameters"
            description="Density and radius token tuning"
            icon={<AdjustmentsHorizontalIcon />}
          >
            Customizes the 4-Tier Customization ladder with dynamic OKLCH color ramps and concentric radius geometry.
          </AccordionItem>
        </Accordion>
      </div>
    ),
  },
  examples: [
    {
      title: 'Standalone Collapsible Box',
      description: 'Single expandable disclosure panel for settings.',
      render: () => (
        <div className="w-full max-w-md">
          <Collapsible
            id="debug-options"
            title="Advanced Debugger Settings"
            description="Verbose telemetry headers"
          >
            Enables full distributed trace capturing with OpenTelemetry exporters.
          </Collapsible>
        </div>
      ),
    },
  ],
}
