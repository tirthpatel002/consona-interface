import React from 'react'
import {
  Container,
  Stack,
  HStack,
  VStack,
  Center,
  Bleed,
  Float,
  BackToTop,
  Card,
  Badge,
  Button,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const layoutDoc: ComponentDocSpec = {
  id: 'layout',
  name: 'Layout',
  component: Container,
  summary: 'Suite of fundamental structural layout primitives: Container, Stack, HStack, VStack, Center, Bleed, Float, and BackToTop.',
  subcomponents: [
    'Container',
    'Stack',
    'HStack',
    'VStack',
    'Center',
    'Bleed',
    'Float',
    'BackToTop',
  ],
  playground: {
    defaultProps: {
      direction: 'row',
      align: 'center',
      justify: 'between',
      gap: 'md',
    },
    controls: [
      { name: 'direction', type: 'select', options: ['row', 'col', 'responsive', 'responsive-reverse'] },
      { name: 'align', type: 'select', options: ['start', 'center', 'end', 'stretch'] },
      { name: 'justify', type: 'select', options: ['start', 'center', 'end', 'between', 'around'] },
      { name: 'gap', type: 'select', options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] },
    ],
    render: (props: any) => (
      <div className="w-full max-w-xl p-6 bg-surface/50 rounded-macro border border-border/40 shadow-xs">
        <Stack {...props}>
          <div className="p-4 rounded-base bg-primary/10 border border-primary/20 text-xs font-bold text-primary shadow-2xs">
            Box 1
          </div>
          <div className="p-4 rounded-base bg-primary/10 border border-primary/20 text-xs font-bold text-primary shadow-2xs">
            Box 2
          </div>
          <div className="p-4 rounded-base bg-primary/10 border border-primary/20 text-xs font-bold text-primary shadow-2xs">
            Box 3
          </div>
        </Stack>
      </div>
    ),
  },
  examples: [
    {
      title: 'HStack and Center Alignment',
      description: 'Horizontal linear layout with centered elements and inter-item dividers.',
      render: () => (
        <div className="flex flex-col gap-6 w-full max-w-lg">
          <Center className="h-24 rounded-base bg-surface/40 border border-dashed border-border/40">
            <Badge intent="primary">Centered Content</Badge>
          </Center>

          <HStack gap="sm" justify="between" className="p-4 rounded-base bg-surface/50 border border-border/40 shadow-2xs">
            <span className="text-xs font-medium text-fg">Cluster Status</span>
            <Badge intent="success" size="sm">Healthy</Badge>
          </HStack>
        </div>
      ),
    },
    {
      title: 'Bleed Wrapper Effect',
      description: 'Negative margin wrapper allowing child components to bleed edge-to-edge beyond parent padding.',
      render: () => (
        <div className="p-6 rounded-macro bg-surface/50 border border-border/40 max-w-md overflow-hidden shadow-xs">
          <p className="text-xs text-muted-fg mb-4">Container with 24px padding (p-6)</p>
          <Bleed inline="lg">
            <div className="bg-primary/10 border-y border-primary/20 p-3 text-center text-xs font-semibold text-primary">
              Full Bleed Edge-to-Edge Strip
            </div>
          </Bleed>
          <p className="text-xs text-muted-fg mt-4">Rest of container content</p>
        </div>
      ),
    },
  ],
}
