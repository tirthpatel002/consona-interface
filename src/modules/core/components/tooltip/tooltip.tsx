import React from 'react'
import {
  Tooltip as RACTooltip,
  type TooltipProps as RACTooltipProps,
  TooltipTrigger as RACTooltipTrigger,
  type TooltipTriggerComponentProps as RACTooltipTriggerProps,
  OverlayArrow as RACOverlayArrow,
  type OverlayArrowProps as RACOverlayArrowProps,
} from 'react-aria-components'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'

/* ==========================================================================
   Tooltip Styles & Ramps
   ========================================================================== */

export const tooltipStyles = tv({
  base: [
    'group z-50 px-2.5 py-space-xs text-xs font-medium text-fg border border-border/80 bg-overlay/95 backdrop-blur-md rounded-micro shadow-xs',
    'transition-all duration-150 select-none pointer-events-none',
    'data-[entering]:animate-in data-[entering]:fade-in-0 data-[entering]:zoom-in-95',
    'data-[exiting]:animate-out data-[exiting]:fade-out-0 data-[exiting]:zoom-out-95',
    'data-[placement=top]:slide-in-from-bottom-1 data-[placement=bottom]:slide-in-from-top-1',
    'data-[placement=left]:slide-in-from-right-1 data-[placement=right]:slide-in-from-left-1',
  ],
  variants: {
    intent: {
      default: 'bg-overlay/95 text-fg border-border/80',
      inverse: 'bg-fg text-bg border-transparent',
      primary: 'bg-primary text-primary-fg border-primary/20',
      subtle: 'bg-secondary text-secondary-fg border-border',
    },
    size: {
      sm: 'px-space-sm py-space-2xs text-[11px] font-normal',
      md: 'px-2.5 py-space-xs text-xs font-medium',
      lg: 'px-space-md py-1.5 text-xs font-semibold',
    },
  },
  defaultVariants: {
    intent: 'default',
    size: 'md',
  },
})

/* ==========================================================================
   Tooltip Slot & State Definitions
   ========================================================================== */

export interface TooltipSlotState {
  /** Current placement of the tooltip */
  placement?: string
  /** Whether the tooltip is currently entering */
  isEntering?: boolean
  /** Whether the tooltip is currently exiting */
  isExiting?: boolean
}

export interface TooltipSlots {
  /** Arrow pointing indicator */
  arrow?: React.ComponentType<TooltipArrowProps>
}

/* ==========================================================================
   Tooltip Root Primitive & Factory
   ========================================================================== */

export interface TooltipProps
  extends Omit<RACTooltipProps, 'children'>,
    VariantProps<typeof tooltipStyles> {
  /** Semantic color intent: default, inverse, primary, subtle. */
  intent?: 'default' | 'inverse' | 'primary' | 'subtle'
  /** Size token scaling dimensions and typography: sm, md, lg. */
  size?: 'sm' | 'md' | 'lg'
  /** Show pointing arrow. */
  showArrow?: boolean
  /** Additional CSS class names. */
  className?: string
  /** Slot component overrides. */
  slots?: SlotComponents<TooltipSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<TooltipSlots>
  /** Tooltip text content or children. */
  children?: React.ReactNode
}

const TooltipPrimitive = ({
  className,
  intent = 'default',
  size = 'md',
  showArrow = false,
  offset = 6,
  slots = {},
  slotProps = {},
  children,
  ...props
}: TooltipProps) => {
  return (
    <RACTooltip
      offset={offset}
      data-slot="tooltip"
      data-intent={intent}
      className={(values) =>
        cn(
          tooltipStyles({ intent, size }),
          typeof className === 'function' ? (className as any)(values) : className
        )
      }
      {...props}
    >
      {() => (
        <>
          {showArrow && (
            <TooltipArrow
              slots={slots.arrow ? { arrow: slots.arrow } : undefined}
              {...slotProps.arrow}
            />
          )}
          {children}
        </>
      )}
    </RACTooltip>
  )
}

export const Tooltip = createInterfaceComponent<TooltipProps, TooltipSlots>(
  {
    name: 'Tooltip',
    category: 'overlay',
    description: 'Micro-information tooltip container with optical geometry, delay transitions, and placement ramps.',
    version: '1.0.0',
    props: {
      intent: 'default',
      size: 'md',
      showArrow: false,
      offset: 6,
    },
    slots: {
      arrow: undefined,
    },
  },
  TooltipPrimitive
)

/* ==========================================================================
   Tooltip Sub-Atoms
   ========================================================================== */

export interface TooltipTriggerProps extends RACTooltipTriggerProps {}

const TooltipTriggerPrimitive = (props: TooltipTriggerProps) => {
  return <RACTooltipTrigger data-slot="tooltip-trigger" {...props} />
}

export const TooltipTrigger = createInterfaceComponent<TooltipTriggerProps>(
  {
    name: 'TooltipTrigger',
    category: 'overlay',
    description: 'Trigger wrapper connecting target elements to hover/focus tooltip state.',
    version: '1.0.0',
    props: {
      delay: 400,
      closeDelay: 150,
    },
  },
  TooltipTriggerPrimitive
)

export interface TooltipArrowProps extends RACOverlayArrowProps {
  /** className */
  className?: string
}

const TooltipArrowPrimitive = ({ className, ...props }: TooltipArrowProps) => {
  return (
    <RACOverlayArrow data-slot="tooltip-arrow" className="group" {...props}>
      <svg
        width={8}
        height={8}
        viewBox="0 0 8 8"
        className={cn(
          'block fill-overlay stroke-border/80 transition-colors',
          'group-data-[intent=inverse]:fill-fg group-data-[intent=inverse]:stroke-transparent',
          'group-data-[intent=primary]:fill-primary group-data-[intent=primary]:stroke-primary/20',
          'group-data-[intent=subtle]:fill-secondary group-data-[intent=subtle]:stroke-border',
          'group-data-[placement=bottom]:rotate-180 group-data-[placement=left]:-rotate-90 group-data-[placement=right]:rotate-90',
          className
        )}
      >
        <path d="M0 0 L4 4 L8 0" />
      </svg>
    </RACOverlayArrow>
  )
}

export const TooltipArrow = createInterfaceComponent<TooltipArrowProps>(
  {
    name: 'TooltipArrow',
    category: 'overlay',
    description: 'Pointing arrow connecting tooltip bubble to anchor target.',
    version: '1.0.0',
  },
  TooltipArrowPrimitive
)

export interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const TooltipContentPrimitive = ({ className, ...props }: TooltipContentProps) => {
  return <div data-slot="tooltip-content" className={cn('inline-flex items-center gap-1.5', className)} {...props} />
}

export const TooltipContent = createInterfaceComponent<TooltipContentProps>(
  {
    name: 'TooltipContent',
    category: 'overlay',
    description: 'Formatted content section inside tooltip bubbles.',
    version: '1.0.0',
  },
  TooltipContentPrimitive
)

// Namespace attachments for compound family ergonomics
Tooltip.Trigger = TooltipTrigger
Tooltip.Arrow = TooltipArrow
Tooltip.Content = TooltipContent

export const { Context: TooltipContext, useCompoundContext: useTooltipContext } =
  createCompoundContext<any>('Tooltip')
