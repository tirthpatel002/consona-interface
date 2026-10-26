import React from 'react'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'

/* ==========================================================================
   Skeleton Styles
   ========================================================================== */

export const skeletonStyles = tv({
  base: 'pointer-events-none select-none',
  variants: {
    variant: {
      block: 'animate-shimmer rounded-base bg-secondary',
      wrapper: '',
    },
  },
  defaultVariants: {
    variant: 'block',
  },
})

export const skeletonTextStyles = tv({
  base: 'flex w-full flex-col',
  variants: {
    size: {
      sm: 'gap-space-xs',
      md: 'gap-space-sm',
      lg: 'gap-space-md',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

export const skeletonLineStyles = tv({
  base: 'animate-shimmer w-full bg-secondary',
  variants: {
    size: {
      sm: 'h-2.5 rounded-atom',
      md: 'h-3 rounded-micro',
      lg: 'h-4 rounded-micro',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

export const skeletonAvatarStyles = tv({
  base: 'animate-shimmer shrink-0 bg-secondary',
  variants: {
    size: {
      xs: 'size-5',
      sm: 'size-6',
      md: 'size-8',
      lg: 'size-10',
      xl: 'size-12',
    },
    shape: {
      circle: 'rounded-full',
      square: 'rounded-soft-square',
    },
  },
  defaultVariants: {
    size: 'md',
    shape: 'circle',
  },
})

/* ==========================================================================
   Skeleton Root
   ========================================================================== */

export interface SkeletonSlots {}

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonStyles> {
  /**
   * When true, children are rendered as a pulsing content wrapper.
   * When false (default for empty children), renders a shimmer block.
   */
  isLoading?: boolean
  /** Visual mode: standalone block or content wrapper. */
  variant?: 'block' | 'wrapper'
  /** Optional DOM ref attached to the skeleton root. */
  ref?: React.Ref<HTMLDivElement>
  /** Slot overrides. */
  slots?: SlotComponents<SkeletonSlots>
  /** Props passed into injected slots. */
  slotProps?: SlotPropsMap<SkeletonSlots>
}

const SkeletonPrimitive = ({
  isLoading = true,
  variant,
  className,
  children,
  slots: _slots,
  slotProps: _slotProps,
  ref,
  ...props
}: SkeletonProps) => {
  const resolvedVariant = variant ?? (children ? 'wrapper' : 'block')

  if (resolvedVariant === 'wrapper') {
    return (
      <div
        ref={ref}
        data-slot="skeleton"
        data-loading={isLoading ? '' : undefined}
        className={cn(
          isLoading && [
            'pointer-events-none',
            '[&_*]:animate-shimmer [&_*]:select-none [&_*]:text-transparent [&_*]:shadow-none',
            '[&_[data-slot=avatar]]:rounded-full [&_img]:border-0',
          ],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  return (
    <div
      ref={ref}
      data-slot="skeleton"
      aria-hidden
      className={skeletonStyles({ variant: 'block', className })}
      {...props}
    />
  )
}

export const Skeleton = createInterfaceComponent<SkeletonProps, SkeletonSlots>(
  {
    name: 'Skeleton',
    category: 'feedback',
    description: 'Shimmering placeholder block or content wrapper using optical radius tokens.',
    version: '1.0.0',
    props: {
      isLoading: true,
      variant: 'block',
    },
    slots: {

    },
  },
  SkeletonPrimitive
)

/* ==========================================================================
   Skeleton Text
   ========================================================================== */

export interface SkeletonTextProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonTextStyles> {
  /** Number of placeholder lines. */
  lines?: number
  /** Width of the last line as a percentage of the container. */
  lastLineWidth?: number
  /** Line height token: sm, md, lg. */
  size?: 'sm' | 'md' | 'lg'
  /** Optional DOM ref attached to the text group. */
  ref?: React.Ref<HTMLDivElement>
  /** Slot overrides (unused, reserved for symmetry). */
  slots?: SlotComponents<Record<string, never>>
  /** Slot props (unused, reserved for symmetry). */
  slotProps?: SlotPropsMap<Record<string, never>>
}

const SkeletonTextPrimitive = ({
  lines = 3,
  lastLineWidth = 64,
  size = 'md',
  className,
  ref,
  ...props
}: SkeletonTextProps) => {
  const count = Math.max(1, lines)
  return (
    <div
      ref={ref}
      data-slot="skeleton-text"
      aria-hidden
      className={skeletonTextStyles({ size, className })}
      {...props}
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          data-slot="skeleton-line"
          className={skeletonLineStyles({ size })}
          style={index === count - 1 && count > 1 ? { width: `${lastLineWidth}%` } : undefined}
        />
      ))}
    </div>
  )
}

export const SkeletonText = createInterfaceComponent<SkeletonTextProps>(
  {
    name: 'SkeletonText',
    category: 'feedback',
    description: 'Stacked shimmering text lines with a shorter last line for natural copy placeholders.',
    version: '1.0.0',
    props: {
      lines: 3,
      lastLineWidth: 64,
      size: 'md',
    },
  },
  SkeletonTextPrimitive
)

/* ==========================================================================
   Skeleton Avatar
   ========================================================================== */

export interface SkeletonAvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonAvatarStyles> {
  /** Avatar size token matching Avatar: xs, sm, md, lg, xl. */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Circle or squircle geometry matching Avatar. */
  shape?: 'circle' | 'square'
  /** Optional DOM ref attached to the avatar placeholder. */
  ref?: React.Ref<HTMLDivElement>
  /** Slot overrides (unused, reserved for symmetry). */
  slots?: SlotComponents<Record<string, never>>
  /** Slot props (unused, reserved for symmetry). */
  slotProps?: SlotPropsMap<Record<string, never>>
}

const SkeletonAvatarPrimitive = ({
  size = 'md',
  shape = 'circle',
  className,
  ref,
  ...props
}: SkeletonAvatarProps) => (
  <div
    ref={ref}
    data-slot="skeleton-avatar"
    aria-hidden
    className={skeletonAvatarStyles({ size, shape, className })}
    {...props}
  />
)

export const SkeletonAvatar = createInterfaceComponent<SkeletonAvatarProps>(
  {
    name: 'SkeletonAvatar',
    category: 'feedback',
    description: 'Avatar-shaped shimmer placeholder matching Avatar optical radii.',
    version: '1.0.0',
    props: {
      size: 'md',
      shape: 'circle',
    },
  },
  SkeletonAvatarPrimitive
)

Skeleton.Text = SkeletonText
Skeleton.Avatar = SkeletonAvatar

export const { Context: SkeletonContext, useCompoundContext: useSkeletonContext } =
  createCompoundContext<any>('Skeleton')
