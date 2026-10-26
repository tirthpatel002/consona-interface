import React from 'react'
import { Breadcrumbs, BreadcrumbItem } from '@consona/interface'
import type { ComponentDocSpec } from '../types'
import { HomeIcon } from '@heroicons/react/20/solid'

export const breadcrumbsDoc: ComponentDocSpec = {
  id: 'breadcrumbs',
  name: 'Breadcrumbs',
  component: Breadcrumbs,
  summary: 'Hierarchical navigation trail with custom separators, truncating ellipsis, and current page ARIA semantics.',
  subcomponents: ['BreadcrumbItem', 'BreadcrumbSeparator'],
  playground: {
    defaultProps: {
      separator: 'chevron',
    },
    controls: [
      { name: 'separator', type: 'select', options: ['chevron', 'slash', 'arrow', 'bullet'] },
    ],
    render: (props: any) => (
      <div className="flex items-center justify-center p-8">
        <Breadcrumbs {...props}>
          <BreadcrumbItem href="#">
            <HomeIcon className="size-4" />
            <span>Home</span>
          </BreadcrumbItem>
          <BreadcrumbItem href="#">Infrastructure</BreadcrumbItem>
          <BreadcrumbItem href="#">Kubernetes</BreadcrumbItem>
          <BreadcrumbItem>us-east-cluster-01</BreadcrumbItem>
        </Breadcrumbs>
      </div>
    ),
  },
  examples: [
    {
      title: 'Separator Styles',
      description: 'Chevron, slash, arrow, and bullet divider glyphs.',
      render: () => (
        <div className="flex flex-col gap-4">
          <Breadcrumbs separator="slash">
            <BreadcrumbItem href="#">Dashboard</BreadcrumbItem>
            <BreadcrumbItem href="#">Analytics</BreadcrumbItem>
            <BreadcrumbItem>Real-Time Telemetry</BreadcrumbItem>
          </Breadcrumbs>

          <Breadcrumbs separator="arrow">
            <BreadcrumbItem href="#">Projects</BreadcrumbItem>
            <BreadcrumbItem href="#">Consona</BreadcrumbItem>
            <BreadcrumbItem>Interface Enhanced</BreadcrumbItem>
          </Breadcrumbs>
        </div>
      ),
    },
  ],
}
