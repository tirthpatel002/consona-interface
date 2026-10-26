import React from 'react'
import { Avatar, AvatarGroup, AvatarBadge, Badge, Card } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const avatarDoc: ComponentDocSpec = {
  id: 'avatar',
  name: 'Avatar',
  component: Avatar,
  summary: 'Visual user avatar element with image loading fallbacks, concentric squircle/circle curvature, initials rendering, and status indicator slots.',
  subcomponents: ['AvatarBadge', 'AvatarGroup'],
  playground: {
    defaultProps: {
      size: 'xl',
      isSquare: false,
      status: 'none',
      initials: 'TK',
    },
    controls: [
      { name: 'size', type: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'] },
      { name: 'isSquare', type: 'boolean' },
      { name: 'status', type: 'select', options: ['none', 'default', 'primary', 'neutral', 'online', 'offline', 'busy', 'away'] },
      { name: 'initials', type: 'text' },
    ],
    render: ({ status, ...props }: any) => {
      const effectiveStatus = status === 'none' ? undefined : status
      return (
        <div className="flex flex-col items-center justify-center gap-6 p-8">
          <div className="flex items-center gap-6">
            <Avatar
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
              alt="Sarah Connor"
              status={effectiveStatus}
              {...props}
            />
            <Avatar
              src={null}
              status={effectiveStatus}
              {...props}
            />
          </div>
        </div>
      )
    },
  },
  examples: [
    {
      title: 'Standard Avatars (Without Badges)',
      description: 'Clean circular and squircle avatar forms rendering images, typography initials, and fallback icons.',
      render: () => (
        <div className="flex flex-wrap items-center gap-6 p-4">
          <Avatar
            size="2xl"
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
            alt="Elena Rostova"
          />
          <Avatar
            size="2xl"
            isSquare
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80"
            alt="Marcus Brody"
          />
          <Avatar size="2xl" initials="JD" />
          <Avatar size="2xl" isSquare initials="AL" />
          <Avatar size="2xl" />
        </div>
      ),
    },
    {
      title: 'Member Profile Badges & Status Indicators',
      description: 'Concentric radius scaling with status indicators and typography initials.',
      render: () => (
        <div className="flex flex-wrap items-center gap-6 p-4">
          <Avatar
            size="2xl"
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
            alt="Elena"
            status="primary"
          />
          <Avatar
            size="2xl"
            isSquare
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80"
            alt="Marcus"
            status="neutral"
          />
          <Avatar size="2xl" initials="JD" status="away" />
          <Avatar size="2xl" isSquare initials="AL" status="default" />
        </div>
      ),
    },
    {
      title: 'Size Ramp Hierarchy',
      description: 'Progressive dimensional scale from micro (xs) to macro (3xl).',
      render: () => (
        <div className="flex flex-wrap items-end gap-3 p-4">
          <Avatar size="xs" initials="XS" />
          <Avatar size="sm" initials="SM" />
          <Avatar size="md" initials="MD" />
          <Avatar size="lg" initials="LG" />
          <Avatar size="xl" initials="XL" />
          <Avatar size="2xl" initials="2X" />
          <Avatar size="3xl" initials="3X" />
        </div>
      ),
    },
    {
      title: 'Overlapping Team Cluster',
      description: 'Stacked group with concentric boundary rings and counter pill.',
      render: () => (
        <div className="flex flex-col gap-4 p-4">
          <AvatarGroup max={4}>
            <Avatar src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" alt="Sarah" />
            <Avatar src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" alt="Alex" />
            <Avatar src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80" alt="Elena" />
            <Avatar src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" alt="David" />
            <Avatar initials="MR" />
            <Avatar initials="TK" />
          </AvatarGroup>
        </div>
      ),
    },
  ],
}
