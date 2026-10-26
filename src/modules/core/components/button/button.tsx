import React from 'react'
import {
  Button as RACButton,
  type ButtonProps as RACButtonProps,
  ToggleButton as RACToggleButton,
  type ToggleButtonProps as RACToggleButtonProps,
} from 'react-aria-components'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Loader, type LoaderProps } from '../loader'

import { ExpandButton, type ExpandButtonProps } from './expand-button'

import { CheckIcon, ExclamationCircleIcon } from '@heroicons/react/20/solid'

/* ==========================================================================
   Button Styles & Ramps
   ========================================================================== */

export const buttonStyles = tv({
  base: [
    'relative isolate inline-flex cursor-pointer items-center justify-center font-medium no-underline select-none',
    'border border-transparent transition-all duration-150 outline-none',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:forced-colors:text-[GrayText]',
    'data-[state=loading]:opacity-85 data-[state=loading]:cursor-wait',
    '*:data-[slot=icon]:shrink-0 *:data-[slot=icon]:self-center',
    '*:data-[slot=loader]:shrink-0 *:data-[slot=loader]:self-center',
  ],
  variants: {
    intent: {
      primary:
        'bg-primary text-primary-fg hover:bg-primary/90 active:bg-primary/95',
      secondary:
        'bg-secondary text-secondary-fg hover:bg-secondary/80 active:bg-secondary/90 border-border',
      subtle:
        'bg-primary-subtle text-primary-subtle-fg hover:bg-primary-subtle/80 active:bg-primary-subtle/90',
      outline:
        'bg-transparent text-fg border-border hover:bg-secondary active:bg-secondary/80',
      plain:
        'bg-transparent text-fg hover:bg-secondary active:bg-secondary/80 border-transparent',
      danger:
        'bg-danger text-danger-fg hover:bg-danger/90 active:bg-danger/95',
      warning:
        'bg-warning text-warning-fg hover:bg-warning/90 active:bg-warning/95',
      success:
        'bg-success text-success-fg hover:bg-success/90 active:bg-success/95',
    },
    size: {
      xs: 'min-h-7 px-2.5 py-space-xs text-xs/4 gap-x-1.5 *:data-[slot=icon]:size-3 *:data-[slot=loader]:size-3',
      sm: 'min-h-8 px-space-md py-1.5 text-xs/4 font-medium gap-x-1.5 *:data-[slot=icon]:size-3.5 *:data-[slot=loader]:size-3.5',
      md: 'min-h-9 px-3.5 py-space-sm text-sm/5 font-medium gap-x-space-sm *:data-[slot=icon]:size-4 *:data-[slot=loader]:size-4',
      lg: 'min-h-11 px-5 py-2.5 text-base/6 font-medium gap-x-2.5 *:data-[slot=icon]:size-5 *:data-[slot=loader]:size-5',
      'sq-xs': 'size-7 p-0 *:data-[slot=icon]:size-3.5 *:data-[slot=loader]:size-3.5',
      'sq-sm': 'size-8 p-0 *:data-[slot=icon]:size-4 *:data-[slot=loader]:size-4',
      'sq-md': 'size-9 p-0 *:data-[slot=icon]:size-4.5 *:data-[slot=loader]:size-4.5',
      'sq-lg': 'size-11 p-0 *:data-[slot=icon]:size-5 *:data-[slot=loader]:size-5',
    },
    isCircle: {
      true: 'rounded-full',
      false: 'rounded-base',
    },
    state: {
      idle: '',
      loading: 'cursor-wait opacity-85',
      success: '',
      error: '',
    },
  },
  defaultVariants: {
    intent: 'primary',
    size: 'md',
    isCircle: false,
    state: 'idle',
  },
})

/* ==========================================================================
   Button State & Slot Definitions
   ========================================================================== */

export type ButtonState = 'idle' | 'loading' | 'success' | 'error' | (string & {})
export type ButtonIntent = 'primary' | 'secondary' | 'subtle' | 'outline' | 'plain' | 'danger' | 'warning' | 'success'

export interface ButtonStateConfig {
  /** intent */
  intent?: ButtonIntent
  className?: string
  leftIcon?: React.ReactNode
  /** rightIcon */
  rightIcon?: React.ReactNode
  children?: React.ReactNode
}

export type ButtonStatesMap = Partial<Record<ButtonState, ButtonStateConfig>>

export interface ButtonSlots {
  /** Animated loader component rendered during loading/pending state. */
  loader?: React.ComponentType<LoaderProps>
  /** Leading icon slot positioned before button text. */
  leftIcon?: React.ComponentType<React.SVGProps<SVGSVGElement> & { state?: ButtonState }>
  /** Trailing icon slot positioned after button text. */
  rightIcon?: React.ComponentType<React.SVGProps<SVGSVGElement> & { state?: ButtonState }>
  /** Replacement icon displayed during success state. */
  successIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Replacement icon displayed during error state. */
  errorIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface ButtonProps
  extends Omit<RACButtonProps, 'className' | 'children'>,
    Omit<VariantProps<typeof buttonStyles>, 'state'> {
  /** Semantic color intent: primary, secondary, subtle, outline, plain, danger, warning, success. */
  intent?: 'primary' | 'secondary' | 'subtle' | 'outline' | 'plain' | 'danger' | 'warning' | 'success'
  /** Size token scaling button height and padding (standard or square sq-*): xs, sm, md, lg, sq-xs, sq-sm, sq-md, sq-lg. */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'sq-xs' | 'sq-sm' | 'sq-md' | 'sq-lg'
  /** Whether the button geometry uses a circular bounding box for icon buttons. */
  isCircle?: boolean
  /** Optional DOM ref attached to the button element. */
  ref?: React.Ref<HTMLButtonElement>
  /** Active interactive lifecycle state: idle, loading, success, error. */
  state?: ButtonState
  /** Shorthand for activating the loading pending state. */
  isPending?: boolean
  /** Granular state configuration map defining labels, intents, and icons per lifecycle state. */
  states?: ButtonStatesMap
  /** Shorthand node rendered to the left of button children. */
  leftIcon?: React.ReactNode
  /** Shorthand node rendered to the right of button children. */
  rightIcon?: React.ReactNode
  /** Injected slot component overrides. */
  slots?: SlotComponents<ButtonSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ButtonSlots>
  /** Custom CSS classes or dynamic render function. */
  className?: string | ((values: any) => string)
  /** Button content or dynamic render function receiving interactive states. */
  children?: React.ReactNode | ((values: any) => React.ReactNode)
}

const ButtonPrimitive = ({
  className,
  intent = 'primary',
  size = 'md',
  isCircle = false,
  state: stateProp,
  isPending,
  states,
  leftIcon,
  rightIcon,
  slots,
  slotProps,
  ref,
  children,
  ...props
}: ButtonProps) => {
  return (
    <RACButton
      ref={ref}
      isPending={isPending || stateProp === 'loading'}
      data-slot="button"
      {...props}
      className={(values) => {
        const effectiveState = stateProp ?? (values.isPending || isPending ? 'loading' : 'idle')
        const stateConfig = states?.[effectiveState]
        const effectiveIntent = stateConfig?.intent ?? (effectiveState === 'success' ? 'success' : effectiveState === 'error' ? 'danger' : intent)
        const customClass = typeof className === 'function' ? className(values) : className
        return cn(
          buttonStyles({
            intent: effectiveIntent,
            size,
            isCircle,
            state: effectiveState in buttonStyles.variants.state ? (effectiveState as any) : 'idle',
          }),
          stateConfig?.className,
          customClass
        )
      }}
    >
      {(values) => {
        const effectiveState = stateProp ?? (values.isPending || isPending ? 'loading' : 'idle')
        const stateConfig = states?.[effectiveState]
        const stateLeftIcon = stateConfig?.leftIcon ?? leftIcon
        const stateRightIcon = stateConfig?.rightIcon ?? rightIcon
        const stateChildren = stateConfig?.children ?? children

        const iconSizeClass =
          size?.startsWith('sq-') || size === 'xs'
            ? 'w-3.5 h-3.5'
            : size === 'lg'
              ? 'w-5 h-5'
              : 'w-4 h-4'

        return (
          <>
            {/* Left Slot / Loader / State Icon */}
            {effectiveState === 'loading' ? (
              renderSlot(
                slots?.loader,
                {
                  ...slotProps?.loader,
                  'data-slot': 'loader',
                  size: size?.startsWith('sq-') || size === 'xs' ? 'xs' : 'sm',
                  ...(slotProps?.loader as any),
                },
                { defaultComponent: Loader }
              )
            ) : effectiveState === 'success' ? (
              slots?.successIcon ? (
                renderSlot(slots.successIcon, {
                  'data-slot': 'icon',
                  className: iconSizeClass,
                  ...(slotProps?.successIcon as any),
                })
              ) : stateLeftIcon ? (
                <span data-slot="icon">{stateLeftIcon}</span>
              ) : (
                <CheckIcon
                  data-slot="icon"
                  className={cn(iconSizeClass, 'animate-in zoom-in-50 duration-150')}
                />
              )
            ) : effectiveState === 'error' ? (
              slots?.errorIcon ? (
                renderSlot(slots.errorIcon, {
                  'data-slot': 'icon',
                  className: iconSizeClass,
                  ...(slotProps?.errorIcon as any),
                })
              ) : stateLeftIcon ? (
                <span data-slot="icon">{stateLeftIcon}</span>
              ) : (
                <ExclamationCircleIcon
                  data-slot="icon"
                  className={cn(iconSizeClass, 'animate-in zoom-in-50 duration-150')}
                />
              )
            ) : (
              <>
                {stateLeftIcon && <span data-slot="icon">{stateLeftIcon}</span>}
                {slots?.leftIcon &&
                  renderSlot(slots.leftIcon, {
                    'data-slot': 'icon',
                    state: effectiveState,
                    ...(slotProps?.leftIcon as any),
                  })}
              </>
            )}

            {/* Label / Children */}
            {typeof stateChildren === 'function'
              ? stateChildren({
                  ...values,
                  state: effectiveState,
                  isPending: effectiveState === 'loading',
                })
              : stateChildren}

            {/* Right Slot */}
            {effectiveState === 'idle' && (
              <>
                {slots?.rightIcon &&
                  renderSlot(slots.rightIcon, {
                    'data-slot': 'icon',
                    state: effectiveState,
                    ...(slotProps?.rightIcon as any),
                  })}
                {stateRightIcon && <span data-slot="icon">{stateRightIcon}</span>}
              </>
            )}
          </>
        )
      }}
    </RACButton>
  )
}

export const Button = createInterfaceComponent<ButtonProps, ButtonSlots>(
  {
    name: 'Button',
    category: 'form',
    description:
      'Accessible interactive button with optical geometry, lifecycle states (idle/loading/success/error), intent ramps, and slot injection.',
    version: '1.0.0',
    props: {
      intent: 'primary',
      size: 'md',
      isCircle: false,
      state: 'idle',
    },
    slots: {
      loader: Loader,
      successIcon: CheckIcon,
      errorIcon: ExclamationCircleIcon,
      leftIcon: undefined,
      rightIcon: undefined,
      
    },
  },
  ButtonPrimitive
)

/* ==========================================================================
   Button with Live Status Indicator
   ========================================================================== */

export interface ButtonWithIndicatorProps extends ButtonProps {
  /** Real-time status indicator preset color: online (green), busy (red), away (yellow), offline (gray). */
  indicatorStatus?: 'online' | 'busy' | 'away' | 'offline'
}

const ButtonWithIndicatorPrimitive = ({
  indicatorStatus = 'online',
  children,
  ...props
}: ButtonWithIndicatorProps) => {
  const statusColors = {
    online: 'bg-success',
    busy: 'bg-danger',
    away: 'bg-warning',
    offline: 'bg-muted-fg',
  }

  return (
    <Button {...props}>
      {(values) => (
        <span className="relative flex items-center gap-space-sm">
          <span
            data-slot="indicator"
            className={cn(
              'inline-block size-2 rounded-full ring-2 ring-bg',
              statusColors[indicatorStatus]
            )}
          />
          {typeof children === 'function' ? children(values) : children}
        </span>
      )}
    </Button>
  )
}

export const ButtonWithIndicator = createInterfaceComponent<ButtonWithIndicatorProps>(
  {
    name: 'ButtonWithIndicator',
    category: 'form',
    description: 'Button with real-time status indicator badge dot.',
    version: '1.0.0',
    props: {
      indicatorStatus: 'online',
    },
  },
  ButtonWithIndicatorPrimitive
)

/* ==========================================================================
   Button Group Primitive
   ========================================================================== */

export interface ButtonGroupProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Layout direction for connected buttons: horizontal (row) or vertical (column). */
  orientation?: 'horizontal' | 'vertical'
}

const ButtonGroupPrimitive = ({
  orientation = 'horizontal',
  className,
  ...props
}: ButtonGroupProps) => {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(
        'inline-flex items-center rounded-base',
        orientation === 'horizontal'
          ? 'flex-row [&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:-ml-px [&>*:not(:last-child)]:rounded-r-none'
          : 'flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:-mt-px [&>*:not(:last-child)]:rounded-b-none',
        className
      )}
      {...props}
    />
  )
}

export const ButtonGroup = createInterfaceComponent<ButtonGroupProps>(
  {
    name: 'ButtonGroup',
    category: 'form',
    description: 'Connected button group with unified optical corner radii.',
    version: '1.0.0',
    props: {
      orientation: 'horizontal',
    },
  },
  ButtonGroupPrimitive
)

/* ==========================================================================
   Toggle Button Primitive
   ========================================================================== */

export interface ToggleButtonProps
  extends RACToggleButtonProps,
    VariantProps<typeof buttonStyles> {
  /** Semantic color intent when unselected: primary, secondary, subtle, outline, plain, danger, warning, success. */
  intent?: 'primary' | 'secondary' | 'subtle' | 'outline' | 'plain' | 'danger' | 'warning' | 'success'
  /** Size token scaling button dimensions: xs, sm, md, lg, sq-xs, sq-sm, sq-md, sq-lg. */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'sq-xs' | 'sq-sm' | 'sq-md' | 'sq-lg'
  /** Whether the button uses a circular bounding box. */
  isCircle?: boolean
  /** Optional DOM ref attached to the button element. */
  ref?: React.Ref<HTMLButtonElement>
}

const ToggleButtonPrimitive = ({
  className,
  intent = 'outline',
  size = 'md',
  isCircle = false,
  ref,
  ...props
}: ToggleButtonProps) => {
  return (
    <RACToggleButton
      ref={ref}
      data-slot="toggle-button"
      className={cn(
        buttonStyles({ intent, size, isCircle }),
        'selected:bg-primary selected:text-primary-fg selected:border-transparent',
        className
      )}
      {...props}
    />
  )
}

export const ToggleButton = createInterfaceComponent<ToggleButtonProps>(
  {
    name: 'ToggleButton',
    category: 'form',
    description: 'Two-state toggle button with optical geometry and selected state styling.',
    version: '1.0.0',
    props: {
      intent: 'outline',
      size: 'md',
      isCircle: false,
    },
  },
  ToggleButtonPrimitive
)

// Namespace attachments for compound family ergonomics
Button.Group = ButtonGroup
Button.Toggle = ToggleButton
Button.WithIndicator = ButtonWithIndicator
Button.Indicator = ButtonWithIndicator
Button.Expand = ExpandButton

