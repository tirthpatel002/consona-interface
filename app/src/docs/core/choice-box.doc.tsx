import React, { useState } from 'react'
import {
  ChoiceBox,
  ChoiceBoxItem,
  Field,
  Badge,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'
import { ServerIcon, CpuChipIcon, CloudIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

export const choiceBoxDoc: ComponentDocSpec = {
  id: 'choice-box',
  name: 'ChoiceBox',
  component: ChoiceBox,
  summary: 'Selectable card grid container organizing multi-attribute radio or checkbox choice cards.',
  subcomponents: ['ChoiceBoxItem', 'ChoiceBoxLabel', 'ChoiceBoxDescription'],
  playground: {
    defaultProps: {
      columns: 2,
      selectionMode: 'single',
      defaultSelectedKeys: ['standard'],
    },
    controls: [
      { name: 'columns', type: 'select', options: ['1', '2', '3'] },
      { name: 'selectionMode', type: 'select', options: ['single', 'multiple'] },
    ],
    render: (props: any) => (
      <div className="flex flex-col items-center justify-center p-8 max-w-xl mx-auto w-full">
        <ChoiceBox {...props}>
          <ChoiceBoxItem
            id="standard"
            title="Standard Compute"
            description="2 vCPU, 4GB RAM — Ideal for web apps and development."
            icon={<ServerIcon className="size-5" />}
          />
          <ChoiceBoxItem
            id="performance"
            title="Performance Plus"
            description="8 vCPU, 32GB RAM — Optimized for intensive workloads."
            icon={<CpuChipIcon className="size-5" />}
          />
        </ChoiceBox>
      </div>
    ),
  },
  examples: [
    {
      title: 'Infrastructure Tier Selection (Multi-column)',
      description: 'Choice box grid displaying icons, titles, and detailed specs.',
      render: () => {
        const [selected, setSelected] = useState<any>(new Set(['pro']))
        return (
          <div className="flex flex-col gap-4 p-4 max-w-2xl">
            <ChoiceBox
              columns={3}
              selectionMode="single"
              selectedKeys={selected}
              onSelectionChange={setSelected}
            >
              <ChoiceBoxItem
                id="starter"
                title="Starter"
                description="$19/mo • 10K requests"
                icon={<CloudIcon className="size-5" />}
              />
              <ChoiceBoxItem
                id="pro"
                title="Professional"
                description="$79/mo • 500K requests"
                icon={<ServerIcon className="size-5" />}
              />
              <ChoiceBoxItem
                id="enterprise"
                title="Enterprise"
                description="Custom • Dedicated SLAs"
                icon={<ShieldCheckIcon className="size-5" />}
              />
            </ChoiceBox>
          </div>
        )
      },
    },
  ],
}
