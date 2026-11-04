import React from 'react'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Heading, Text, type HeadingProps, type TextProps } from '../text'

/* ==========================================================================
   Empty State Styles
   ========================================================================== */

export const emptyStateStyles = tv({
  base: 'mx-auto flex w-full flex-col items-center justify-center text-center transition-all',
  variants: {
    variant: {
      card: 'rounded-macro border border-border/80 bg-overlay p-space-xl',
      dashed: 'rounded-macro border-2 border-dashed border-border bg-muted/10 p-space-xl',
      ghost: 'bg-transparent p-space-lg',
    },
    size: {
      sm: 'gap-space-sm py-space-lg px-space-md',
      md: 'gap-space-md py-space-2xl px-space-lg',
      lg: 'gap-space-lg py-space-3xl px-space-xl',
    },
  },
  defaultVariants: {
    variant: 'dashed',
    size: 'md',
  },
})

export const emptyStateIllustrationStyles = tv({
  base: 'mb-space-xs grid place-content-center rounded-macro border border-border/50 bg-muted/50 text-muted-fg',
  variants: {
    size: {
      sm: 'size-9 p-space-sm *:size-5',
      md: 'size-12 p-space-md *:size-6',
      lg: 'size-16 p-space-lg *:size-8',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

/* ==========================================================================
   Empty State Slots
   ========================================================================== */

export interface EmptyStateIllustrationProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Size token inherited from the parent. */
  size?: 'sm' | 'md' | 'lg'
}

export interface EmptyStateActionsProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface EmptyStateSlots {
  /** Illustration or icon well above the title. */
  illustration?: React.ComponentType<EmptyStateIllustrationProps>
  /** Title heading. */
  title?: React.ComponentType<HeadingProps>
  /** Supporting description. */
  description?: React.ComponentType<TextProps>
  /** Primary / secondary action row. */
  actions?: React.ComponentType<EmptyStateActionsProps>
}

export interface EmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof emptyStateStyles> {
  /** Surface treatment: card, dashed, ghost. */
  variant?: 'card' | 'dashed' | 'ghost'
  /** Optical size of illustration and type: sm, md, lg. */
  size?: 'sm' | 'md' | 'lg'
  /** Shorthand illustration node. */
  icon?: React.ReactNode
  /** Title content. */
  title?: React.ReactNode
  /** Description content. */
  description?: React.ReactNode
  /** Primary action node. */
  action?: React.ReactNode
  /** Secondary action node. */
  secondaryAction?: React.ReactNode
  /** Optional DOM ref attached to the container. */
  ref?: React.Ref<HTMLDivElement>
  /** Slot overrides. */
  slots?: SlotComponents<EmptyStateSlots>
  /** Props passed into injected slots. */
  slotProps?: SlotPropsMap<EmptyStateSlots>
}

const EmptyStatePrimitive = ({
  variant = 'dashed',
  size = 'md',
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  slots,
  slotProps,
  children,
  ref,
  ...props
}: EmptyStateProps) => {
  const titleSize = size === 'sm' ? 5 : size === 'lg' ? 3 : 4
  const descSize = size === 'sm' ? 'xs' : 'sm'

  return (
    <div
      ref={ref}
      data-slot="empty-state"
      className={emptyStateStyles({ variant, size, className })}
      {...props}
    >
      {(icon || slots?.illustration) &&
        (icon ? (
          <div data-slot="empty-state-icon" className={emptyStateIllustrationStyles({ size })}>
            {icon}
          </div>
        ) : (
          renderSlot(slots?.illustration, {
            ...slotProps?.illustration,
            size,
            className: emptyStateIllustrationStyles({ size }),
            ...(slotProps?.illustration as object),
          })
        ))}

      {title &&
        (renderSlot(slots?.title, {
          level: titleSize,
          children: title,
          className: 'tracking-tight',
          ...(slotProps?.title as object),
        }) ?? (
          <Heading data-slot="empty-state-title" level={titleSize} className="tracking-tight">
            {title}
          </Heading>
        ))}

      {description &&
        (renderSlot(slots?.description, {
            ...slotProps?.description,
          variant: 'muted',
          size: descSize,
          children: description,
          className: cn('leading-relaxed', size === 'sm' ? 'max-w-xs' : size === 'lg' ? 'max-w-md' : 'max-w-sm'),
          ...(slotProps?.description as object),
        }) ?? (
          <Text
            data-slot="empty-state-description"
            variant="muted"
            size={descSize}
            className={cn('leading-relaxed', size === 'sm' ? 'max-w-xs' : size === 'lg' ? 'max-w-md' : 'max-w-sm')}
          >
            {description}
          </Text>
        ))}

      {children}

      {(action || secondaryAction || slots?.actions) &&
        (renderSlot(slots?.actions, slotProps?.actions as object) ?? (
          <div
            data-slot="empty-state-actions"
            className="mt-space-sm flex flex-wrap items-center justify-center gap-space-sm pt-space-xs"
          >
            {action}
            {secondaryAction}
          </div>
        ))}
    </div>
  )
}

export const EmptyState = createInterfaceComponent<EmptyStateProps, EmptyStateSlots>(
  {
    name: 'EmptyState',
    category: 'feedback',
    description: 'Zero-data placeholder with illustration slot, title, description, and primary/secondary actions.',
    version: '1.0.0',
    props: {
      variant: 'dashed',
      size: 'md',
    },
    slots: {
      illustration: undefined,
      title: undefined,
      description: undefined,
      actions: undefined,
    },
  },
  EmptyStatePrimitive
)

export const EmptyStateTitle = Heading.extend({
  name: 'EmptyStateTitle',
  props: { level: 4 },
})

export const EmptyStateDescription = Text.extend({
  name: 'EmptyStateDescription',
  props: { variant: 'muted', size: 'sm' },
})

export interface EmptyStateActionsRootProps extends React.HTMLAttributes<HTMLDivElement> {}

const EmptyStateActionsPrimitive = ({ className, ...props }: EmptyStateActionsRootProps) => (
  <div
    data-slot="empty-state-actions"
    className={cn('mt-space-sm flex flex-wrap items-center justify-center gap-space-sm pt-space-xs', className)}
    {...props}
  />
)

export const EmptyStateActions = createInterfaceComponent<EmptyStateActionsRootProps>(
  {
    name: 'EmptyStateActions',
    category: 'feedback',
    description: 'Action row for empty-state primary and secondary buttons.',
    version: '1.0.0',
  },
  EmptyStateActionsPrimitive
)

EmptyState.Title = EmptyStateTitle
EmptyState.Description = EmptyStateDescription
EmptyState.Actions = EmptyStateActions

export const { Context: EmptyStateContext, useCompoundContext: useEmptyStateContext } =
  createCompoundContext<any>('EmptyState')
