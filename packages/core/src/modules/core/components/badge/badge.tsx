import React from 'react'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'

export const badgeStyles = tv({
  base: [
    'inline-flex items-center gap-x-1.5 font-medium forced-colors:outline',
    'border border-border/40 bg-(--badge-bg) text-(--badge-fg)',
    'group-hover:bg-(--badge-overlay) group-focus:bg-(--badge-overlay)',
    '*:data-[slot=icon]:size-3 *:data-[slot=icon]:shrink-0',
    'transition-colors duration-150',
  ],
  variants: {
    intent: {
      primary:
        'border-primary/25 [--badge-bg:var(--color-primary-subtle)] [--badge-fg:var(--color-primary-subtle-fg)] [--badge-overlay:var(--color-primary)]/20',
      secondary:
        'border-border/40 [--badge-bg:var(--color-secondary)] [--badge-fg:var(--color-secondary-fg)] [--badge-overlay:var(--color-muted-fg)]/25',
      success:
        'border-success/25 [--badge-bg:var(--color-success-subtle)] [--badge-fg:var(--color-success-subtle-fg)] [--badge-overlay:var(--color-success)]/20',
      info:
        'border-info/25 [--badge-bg:var(--color-info-subtle)] [--badge-fg:var(--color-info-subtle-fg)] [--badge-overlay:var(--color-fg)]/15',
      warning:
        'border-warning/25 [--badge-bg:var(--color-warning-subtle)] [--badge-fg:var(--color-warning-subtle-fg)] [--badge-overlay:var(--color-warning)]/20',
      danger:
        'border-danger/25 [--badge-bg:var(--color-danger-subtle)] [--badge-fg:var(--color-danger-subtle-fg)] [--badge-overlay:var(--color-danger)]/20',
      accent:
        'border-accent/25 [--badge-bg:var(--color-accent)] [--badge-fg:var(--color-accent-fg)] [--badge-overlay:var(--color-fg)]/15',
      outline:
        'border-border/50 text-fg bg-transparent',
    },
    size: {
      sm: 'py-space-2xs px-1.5 text-[0.6875rem]/4',
      md: 'py-px px-space-sm text-xs/5',
      lg: 'py-space-xs px-2.5 text-xs/5 font-semibold',
    },
    isCircle: {
      true: 'rounded-full',
      false: 'rounded-micro',
    },
  },
  defaultVariants: {
    intent: 'primary',
    size: 'md',
    isCircle: false,
  },
})

/* ==========================================================================
   Badge Slot Definitions
   ========================================================================== */

export interface BadgeSlots {
  /** Leading or decorative icon slot rendered inside the badge container. */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface BadgeProps
  extends React.ComponentPropsWithoutRef<'span'>,
    VariantProps<typeof badgeStyles> {
  /** Semantic color intent ramp: primary, secondary, success, info, warning, danger, accent, outline. */
  intent?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'accent' | 'outline'
  /** Size token scaling padding and text scale: sm, md, lg. */
  size?: 'sm' | 'md' | 'lg'
  /** Whether the badge geometry uses rounded-full pill curvature. */
  isCircle?: boolean
  /** Optional DOM ref attached to the span root element. */
  ref?: React.Ref<HTMLSpanElement>
  /** Shorthand icon node rendered before badge children. */
  icon?: React.ReactNode
  /** Slot overrides map for customizing internal badge sub-elements. */
  slots?: SlotComponents<BadgeSlots>
  /** Granular property overrides passed down to injected slots. */
  slotProps?: SlotPropsMap<BadgeSlots>
}

const BadgePrimitive = ({
  intent = 'primary',
  size = 'md',
  isCircle = false,
  className,
  icon,
  slots,
  slotProps,
  children,
  ref,
  ...props
}: BadgeProps) => {
  return (
    <span
      ref={ref}
      data-slot="badge"
      className={badgeStyles({ intent, size, isCircle, className })}
      {...props}
    >
      {icon && <span data-slot="icon">{icon}</span>}
      {slots?.icon && renderSlot(slots.icon, { 'data-slot': 'icon', ...(slotProps?.icon as any) })}
      {children}
    </span>
  )
}

export const Badge = createInterfaceComponent<BadgeProps, BadgeSlots>(
  {
    name: 'Badge',
    category: 'feedback',
    description: 'Compact status badge indicator with optical geometry and semantic intent ramps.',
    version: '1.0.0',
    props: {
      intent: 'primary',
      size: 'md',
      isCircle: false,
    },
    slots: {
      icon: undefined,
    },
  },
  BadgePrimitive
)

/** Aliases for Badge */
export const Tag = Badge
export interface TagProps extends BadgeProps {}

export const Chip = Badge
export interface ChipProps extends BadgeProps {}

// Namespace attachments for compound family ergonomics
Badge.Tag = Tag
Badge.Chip = Chip

export const { Context: BadgeContext, useCompoundContext: useBadgeContext } =
  createCompoundContext<any>('Badge')
