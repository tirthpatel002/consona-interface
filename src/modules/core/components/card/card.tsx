import React from 'react'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import type { BadgeProps } from '../badge'

/* ==========================================================================
   Card Styles & Ramps
   ========================================================================== */

export const cardStyles = tv({
  base: [
    'relative isolate flex flex-col overflow-hidden text-fg transition-all duration-200',
    'rounded-macro border',
  ],
  variants: {
    variant: {
      default:
        'bg-overlay/40 backdrop-blur-md border-border/80 hover:border-border',
      subtle:
        'bg-secondary/40 border-border/60',
      bordered:
        'bg-transparent border-border hover:bg-secondary/20',
      flat:
        'bg-muted/40 border-transparent',
      glow:
        'bg-overlay/60 backdrop-blur-xl border-primary/30 ring-1 ring-primary/20',
      interactive:
        'bg-overlay/40 backdrop-blur-md border-border/80 hover:border-primary/50 hover:bg-overlay/70 cursor-pointer active:scale-[0.99]',
    },
    padding: {
      none: 'p-0',
      sm: 'p-space-md sm:p-space-lg gap-y-space-md',
      md: 'p-5 sm:p-space-xl gap-y-space-lg',
      lg: 'p-space-xl sm:p-space-2xl gap-y-5',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'md',
  },
})

import { createCompoundContext } from '../../../../core/context'

/* ==========================================================================
   Card Context & State Definitions
   ========================================================================== */

export interface CardContextValue {
  variant?: 'default' | 'subtle' | 'bordered' | 'flat' | 'glow' | 'interactive'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const {
  Provider: CardProvider,
  useCompoundContext: useCardContext,
  Context: CardContext,
} = createCompoundContext<CardContextValue>('Card')

export interface CardSlots {
  /** Top header slot */
  header?: React.ComponentType<CardHeaderProps>
  /** Main body content slot */
  content?: React.ComponentType<CardContentProps>
  /** Bottom action footer slot */
  footer?: React.ComponentType<CardFooterProps>
}

/* ==========================================================================
   Card Root Primitive & Factory
   ========================================================================== */

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardStyles> {
  /** Visual surface variant: default, subtle, bordered, flat, glow, interactive. */
  variant?: 'default' | 'subtle' | 'bordered' | 'flat' | 'glow' | 'interactive'
  /** Internal padding ramp: none, sm, md, lg. */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** Slot component overrides. */
  slots?: SlotComponents<CardSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<CardSlots>
  /** Card body children */
  children?: React.ReactNode
}

const CardPrimitive = ({
  className,
  variant = 'default',
  padding = 'md',
  slots = {},
  slotProps = {},
  children,
  ...props
}: CardProps) => {
  return (
    <CardProvider value={{ variant, padding }}>
      <div
        data-slot="card"
        className={cn(cardStyles({ variant, padding }), className)}
        {...props}
      >
        {renderSlot(slots.header, slotProps?.header)}
        {renderSlot(slots.content, slotProps?.content) ?? children}
        {renderSlot(slots.footer, slotProps?.footer)}
      </div>
    </CardProvider>
  )
}

export const Card = createInterfaceComponent<CardProps, CardSlots>(
  {
    name: 'Card',
    category: 'data',
    description: 'Concentric card container with optical macro geometry, surface variants, and composite anatomy.',
    version: '1.0.0',
    props: {
      variant: 'default',
      padding: 'md',
    },
    slots: {
      header: undefined,
      content: undefined,
      footer: undefined,
    },
  },
  CardPrimitive
)

/* ==========================================================================
   Card Sub-Atoms
   ========================================================================== */

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Title text */
  title?: string
  /** Subtitle/description text */
  description?: string
}

const CardHeaderPrimitive = ({
  className,
  title,
  description,
  children,
  ...props
}: CardHeaderProps) => {
  return (
    <div
      data-slot="card-header"
      className={cn('flex flex-col gap-1.5', className)}
      {...props}
    >
      {title && <CardTitle>{title}</CardTitle>}
      {description && <CardDescription>{description}</CardDescription>}
      {children}
    </div>
  )
}

export const CardHeader = createInterfaceComponent<CardHeaderProps>(
  {
    name: 'CardHeader',
    category: 'data',
    description: 'Header container organizing card title and description.',
    version: '1.0.0',
  },
  CardHeaderPrimitive
)

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** level */
  level?: 1 | 2 | 3 | 4 | 5 | 6
}

const CardTitlePrimitive = ({
  className,
  level = 3,
  ...props
}: CardTitleProps) => {
  const HeadingTag = `h${level}` as const
  return (
    <HeadingTag
      data-slot="card-title"
      className={cn('text-base sm:text-lg font-bold text-fg tracking-tight leading-snug', className)}
      {...props}
    />
  )
}

export const CardTitle = createInterfaceComponent<CardTitleProps>(
  {
    name: 'CardTitle',
    category: 'data',
    description: 'Heading title element for card components.',
    version: '1.0.0',
  },
  CardTitlePrimitive
)

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescriptionPrimitive = ({
  className,
  ...props
}: CardDescriptionProps) => {
  return (
    <p
      data-slot="card-description"
      className={cn('text-xs sm:text-sm text-muted-fg leading-relaxed', className)}
      {...props}
    />
  )
}

export const CardDescription = createInterfaceComponent<CardDescriptionProps>(
  {
    name: 'CardDescription',
    category: 'data',
    description: 'Supporting description text for card headers.',
    version: '1.0.0',
  },
  CardDescriptionPrimitive
)

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardContentPrimitive = ({
  className,
  ...props
}: CardContentProps) => {
  return (
    <div
      data-slot="card-content"
      className={cn('text-sm text-fg leading-relaxed', className)}
      {...props}
    />
  )
}

export const CardContent = createInterfaceComponent<CardContentProps>(
  {
    name: 'CardContent',
    category: 'data',
    description: 'Main body content section for cards.',
    version: '1.0.0',
  },
  CardContentPrimitive
)

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardFooterPrimitive = ({
  className,
  ...props
}: CardFooterProps) => {
  return (
    <div
      data-slot="card-footer"
      className={cn('mt-auto pt-space-lg border-t border-border/60 flex items-center justify-between gap-space-md', className)}
      {...props}
    />
  )
}

export const CardFooter = createInterfaceComponent<CardFooterProps>(
  {
    name: 'CardFooter',
    category: 'data',
    description: 'Action footer container for cards.',
    version: '1.0.0',
  },
  CardFooterPrimitive
)

/** Absolute top-right action cluster inside a card. */
export interface CardActionProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardActionPrimitive = ({
  className,
  ...props
}: CardActionProps) => {
  return (
    <div
      data-slot="card-action"
      className={cn('absolute top-4 right-4 z-10', className)}
      {...props}
    />
  )
}

export const CardAction = createInterfaceComponent<CardActionProps>(
  {
    name: 'CardAction',
    category: 'data',
    description: 'Absolute top-right action trigger container within cards.',
    version: '1.0.0',
  },
  CardActionPrimitive
)

// Namespace attachments for compound family ergonomics
Card.Provider = CardProvider
Card.Header = CardHeader
Card.Title = CardTitle
Card.Description = CardDescription
Card.Content = CardContent
Card.Footer = CardFooter
Card.Action = CardAction
