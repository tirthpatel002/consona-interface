import React from 'react'
import {
  Link as RACLink,
  type LinkProps as RACLinkProps,
} from 'react-aria-components'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid'

/* ==========================================================================
   Link Styles & Ramps
   ========================================================================== */

export const linkStyles = tv({
  base: [
    'inline-flex items-center gap-space-xs font-medium transition-colors duration-150 outline-none select-none cursor-pointer',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 rounded-micro',
    'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40 data-[disabled]:pointer-events-none',
  ],
  variants: {
    intent: {
      default: 'text-fg hover:text-primary active:text-primary-hover',
      primary: 'text-primary hover:underline active:text-primary-hover',
      secondary: 'text-muted-fg hover:text-fg active:text-fg',
      danger: 'text-danger hover:underline active:text-danger/80',
      subtle: 'text-primary-subtle-fg hover:text-primary',
      plain: 'text-inherit hover:opacity-80',
    },
    underline: {
      none: 'no-underline',
      hover: 'hover:underline',
      always: 'underline underline-offset-4',
    },
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  },
  defaultVariants: {
    intent: 'default',
    underline: 'hover',
    size: 'md',
  },
})

/* ==========================================================================
   Link Slots & State Definitions
   ========================================================================== */

export interface LinkSlots {
  /** Leading icon component */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Trailing external link icon indicator */
  externalIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

/* ==========================================================================
   Link Root Primitive & Factory
   ========================================================================== */

export interface LinkProps
  extends RACLinkProps,
    VariantProps<typeof linkStyles> {
  /** Semantic color intent: default, primary, secondary, danger, subtle, plain. */
  intent?: 'default' | 'primary' | 'secondary' | 'danger' | 'subtle' | 'plain'
  /** Underline decoration style: none, hover, always. */
  underline?: 'none' | 'hover' | 'always'
  /** Size token scaling typography: sm, md, lg. */
  size?: 'sm' | 'md' | 'lg'
  /** Whether the link opens in a new tab/window (adds rel="noopener noreferrer" and target="_blank"). */
  isExternal?: boolean
  /** Show the external indicator icon when isExternal is true. */
  showExternalIcon?: boolean
  /** Additional CSS class names. */
  className?: string
  /** Slot component overrides. */
  slots?: SlotComponents<LinkSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<LinkSlots>
}

const LinkPrimitive = ({
  className,
  intent = 'default',
  underline = 'hover',
  size = 'md',
  isExternal = false,
  showExternalIcon = true,
  target,
  rel,
  slots = {},
  slotProps = {},
  children,
  ...props
}: LinkProps) => {
  const finalTarget = isExternal ? (target || '_blank') : target
  const finalRel = isExternal ? (rel || 'noopener noreferrer') : rel

  return (
    <RACLink
      data-slot="link"
      target={finalTarget}
      rel={finalRel}
      className={(values) =>
        cn(
          linkStyles({ intent, underline, size }),
          typeof className === 'function' ? (className as any)(values) : className
        )
      }
      {...props}
    >
      {(linkState) => (
        <>
          {renderSlot(slots.icon, slotProps.icon)}
          {typeof children === 'function' ? children(linkState) : children}
          {isExternal && showExternalIcon && (
            <span data-slot="external-icon" className="inline-block shrink-0">
              {renderSlot(slots.externalIcon, slotProps.externalIcon) || (
                <ArrowTopRightOnSquareIcon className="size-3.5 opacity-70" />
              )}
            </span>
          )}
        </>
      )}
    </RACLink>
  )
}

export const Link = createInterfaceComponent<LinkProps, LinkSlots>(
  {
    name: 'Link',
    category: 'navigation',
    description: 'Accessible hyperlinked navigation primitive with intent variants, external target handling, and optical focus rings.',
    version: '1.0.0',
    props: {
      intent: 'default',
      underline: 'hover',
      size: 'md',
      isExternal: false,
      showExternalIcon: true,
    },
    slots: {
      icon: undefined,
      externalIcon: undefined,
    },
  },
  LinkPrimitive
)
