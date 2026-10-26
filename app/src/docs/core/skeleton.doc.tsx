import React from 'react'
import { Skeleton, SkeletonText, SkeletonAvatar } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const skeletonDoc: ComponentDocSpec = {
  id: 'skeleton',
  name: 'Skeleton',
  component: Skeleton,
  summary: 'Shimmer placeholders with optical radii matching text, avatars, and surface atoms.',
  subcomponents: ['SkeletonText', 'SkeletonAvatar'],
  playground: {
    defaultProps: {},
    controls: [],
    render: () => (
      <div className="flex items-start gap-4 w-full max-w-md p-6">
        <SkeletonAvatar size="lg" />
        <SkeletonText className="flex-1" lines={3} />
      </div>
    ),
  },
  examples: [
    {
      title: 'Profile card placeholder',
      description: 'Avatar + text lines using matching optical radii.',
      render: () => (
        <div className="flex items-start gap-4 w-full max-w-md">
          <Skeleton.Avatar size="lg" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton.Text lines={2} lastLineWidth={72} />
          </div>
        </div>
      ),
    },
    {
      title: 'Squircle avatar',
      description: 'Square skeleton matches Avatar shape="square".',
      render: () => (
        <div className="flex items-center gap-3">
          <SkeletonAvatar size="sm" />
          <SkeletonAvatar size="md" />
          <SkeletonAvatar size="lg" shape="square" />
          <SkeletonAvatar size="xl" shape="square" />
        </div>
      ),
    },
  ],
}
