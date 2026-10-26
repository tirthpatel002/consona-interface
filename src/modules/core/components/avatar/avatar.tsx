import React from 'react'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'

/* ==========================================================================
   Avatar Styles & Ramps
   ========================================================================== */

export const avatarStyles = tv({
  base: 'relative inline-flex shrink-0 select-none align-middle font-medium text-fg',
  variants: {
    size: {
      xs: 'size-5 text-[10px]',
      sm: 'size-6 text-xs',
      md: 'size-8 text-xs',
      lg: 'size-10 text-sm',
      xl: 'size-12 text-base',
      '2xl': 'size-14 text-lg',
      '3xl': 'size-16 text-xl',
      '4xl': 'size-20 text-2xl',
      '5xl': 'size-24 text-3xl',
      '6xl': 'size-28 text-4xl',
      '7xl': 'size-32 text-5xl',
      '8xl': 'size-36 text-6xl',
      '9xl': 'size-42 text-7xl',
    },
    shape: {
      circle: 'rounded-full *:rounded-full',
      square: 'rounded-soft-square *:rounded-soft-square',
    },
  },
  defaultVariants: {
    size: 'md',
    shape: 'circle',
  },
})

export const avatarBadgeStyles = tv({
  base: 'absolute z-20 block rounded-full ring-2 ring-bg border border-border/40 pointer-events-none',
  variants: {
    status: {
      default: 'bg-primary',
      primary: 'bg-primary',
      neutral: 'bg-muted-fg/60',
      online: 'bg-success',
      offline: 'bg-muted-fg/40',
      busy: 'bg-danger',
      away: 'bg-warning',
    },
    size: {
      xs: 'size-1.5 -bottom-0.5 -right-0.5 ring-1',
      sm: 'size-2 -bottom-0.5 -right-0.5 ring-1',
      md: 'size-2.5 bottom-0 right-0',
      lg: 'size-3 bottom-0 right-0',
      xl: 'size-3.5 bottom-0.5 right-0.5',
      '2xl': 'size-4 bottom-0.5 right-0.5',
      '3xl': 'size-4.5 bottom-1 right-1',
      '4xl': 'size-5 bottom-1 right-1',
      '5xl': 'size-6 bottom-1.5 right-1.5',
      '6xl': 'size-7 bottom-2 right-2',
      '7xl': 'size-8 bottom-2.5 right-2.5',
      '8xl': 'size-9 bottom-3 right-3',
      '9xl': 'size-10 bottom-3.5 right-3.5',
    },
  },
  defaultVariants: {
    status: 'default',
    size: 'md',
  },
})

/* ==========================================================================
   Avatar Slots & State Definitions
   ========================================================================== */

export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Initials or placeholder text rendered when no image is available. */
  initials?: string
}

export interface AvatarSlots {
  /** Optional status indicator badge slot */
  badge?: React.ComponentType<AvatarBadgeProps>
  /** Custom fallback slot rendered when image is missing */
  fallback?: React.ComponentType<AvatarFallbackProps>
}

/* ==========================================================================
   Avatar Root Primitive & Factory
   ========================================================================== */

export interface AvatarProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'>,
    VariantProps<typeof avatarStyles> {
  /** Image source URL */
  src?: string | null
  /** Fallback initials text displayed when image is absent or loading */
  initials?: string
  /** Accessible alternative text */
  alt?: string
  /** Whether the avatar has a squircle shape instead of a circle */
  isSquare?: boolean
  /** Online status indicator (default, primary, neutral, online, offline, busy, away) */
  status?: 'default' | 'primary' | 'neutral' | 'online' | 'offline' | 'busy' | 'away'
  /** Shape variant */
  shape?: 'circle' | 'square'
  /** Additional CSS class names */
  className?: string
  /** Slot component overrides */
  slots?: SlotComponents<AvatarSlots>
  /** Slot props overrides */
  slotProps?: SlotPropsMap<AvatarSlots>
}

const AvatarPrimitive = ({
  src = null,
  initials,
  alt = '',
  isSquare = false,
  size = 'md',
  shape: shapeProp,
  status,
  className,
  slots = {},
  slotProps = {},
  children,
  ...props
}: AvatarProps) => {
  const shape = isSquare ? 'square' : (shapeProp || 'circle')
  const shapeClass = shape === 'square' ? 'rounded-soft-square' : 'rounded-full'

  return (
    <span
      data-slot="avatar"
      data-shape={shape}
      className={cn(avatarStyles({ size, shape }), className)}
      {...props}
    >
      <span
        data-slot="avatar-content"
        className={cn(
          'relative flex size-full items-center justify-center overflow-hidden bg-secondary text-secondary-fg outline-1 outline-fg/15 -outline-offset-1',
          shapeClass
        )}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="size-full object-cover object-center select-none"
            onError={(e) => {
              ;(e.target as HTMLElement).style.display = 'none'
            }}
          />
        ) : initials ? (
          <svg
            className="size-full select-none fill-current p-[5%] font-medium text-[48px] uppercase"
            viewBox="0 0 100 100"
            aria-hidden={alt ? undefined : 'true'}
          >
            {alt && <title>{alt}</title>}
            <text
              x="50%"
              y="50%"
              alignmentBaseline="middle"
              dominantBaseline="middle"
              textAnchor="middle"
              dy=".125em"
            >
              {initials}
            </text>
          </svg>
        ) : (
          renderSlot(slots.fallback, slotProps.fallback) || (
            <div
              data-slot="avatar-fallback"
              className="flex size-full items-center justify-center text-muted-fg"
            >
              <svg
                className="size-3/5 fill-current"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          )
        )}
      </span>

      {status && (
        <AvatarBadge
          status={status}
          size={size as any}
          {...slotProps.badge}
        />
      )}

      {renderSlot(slots.badge, slotProps.badge)}
      {children}
    </span>
  )
}

export const Avatar = createInterfaceComponent<AvatarProps, AvatarSlots>(
  {
    name: 'Avatar',
    category: 'layout',
    description: 'Visual user avatar element with image loading fallbacks, concentric squircle/circle curvature, initials rendering, and status indicator slots.',
    version: '1.0.0',
    props: {
      size: 'md',
      isSquare: false,
    },
    slots: {
      badge: undefined,
      fallback: undefined,
    },
  },
  AvatarPrimitive
)

/* ==========================================================================
   Avatar Sub-Atoms
   ========================================================================== */

export interface AvatarBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof avatarBadgeStyles> {
  /** status */
  status?: 'default' | 'primary' | 'neutral' | 'online' | 'offline' | 'busy' | 'away'
  /** Custom size configuration. */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl' | '9xl'
}

const AvatarBadgePrimitive = ({
  className,
  status = 'default',
  size = 'md',
  ...props
}: AvatarBadgeProps) => {
  return (
    <span
      data-slot="avatar-badge"
      aria-label={`Status: ${status}`}
      className={cn(avatarBadgeStyles({ status, size }), className)}
      {...props}
    />
  )
}

export const AvatarBadge = createInterfaceComponent<AvatarBadgeProps>(
  {
    name: 'AvatarBadge',
    category: 'layout',
    description: 'Status indicator dot pinned to the corner of an Avatar.',
    version: '1.0.0',
    props: {
      status: 'default',
      size: 'md',
    },
  },
  AvatarBadgePrimitive
)

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum number of visible avatars before rendering +N excess counter */
  max?: number
  /** Additional CSS class names */
  className?: string
}

const AvatarGroupPrimitive = ({
  className,
  max,
  children,
  ...props
}: AvatarGroupProps) => {
  const childArray = React.Children.toArray(children).filter(React.isValidElement)
  const visibleChildren = max ? childArray.slice(0, max) : childArray
  const excessCount = max ? Math.max(0, childArray.length - max) : 0

  return (
    <div
      data-slot="avatar-group"
      className={cn(
        'flex items-center -space-x-2.5 *:ring-2 *:ring-bg *:transition-transform hover:*:z-10 hover:*:scale-105',
        className
      )}
      {...props}
    >
      {visibleChildren}
      {excessCount > 0 && (
        <span className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-fg font-mono text-xs font-bold ring-2 ring-bg border border-border/40">
          +{excessCount}
        </span>
      )}
    </div>
  )
}

export const AvatarGroup = createInterfaceComponent<AvatarGroupProps>(
  {
    name: 'AvatarGroup',
    category: 'layout',
    description: 'Stacked group container displaying overlapping avatars with excess counter support.',
    version: '1.0.0',
  },
  AvatarGroupPrimitive
)

// Namespace attachments for compound family ergonomics
Avatar.Badge = AvatarBadge
Avatar.Group = AvatarGroup

export const { Context: AvatarContext, useCompoundContext: useAvatarContext } =
  createCompoundContext<any>('Avatar')
