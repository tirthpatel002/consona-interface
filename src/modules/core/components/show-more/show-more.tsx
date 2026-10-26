import React from 'react'
import { composeRenderProps } from 'react-aria-components/composeRenderProps'
import { ToggleButton, type ToggleButtonProps } from 'react-aria-components/ToggleButton'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { buttonStyles, type ButtonProps } from '../button'
import { Text, type TextProps } from '../text'

/* ==========================================================================
   ShowMore Styles & Ramps
   ========================================================================== */

export const showMoreStyles = tv({
  base: 'text-sm leading-6 before:border-border after:border-border',
  variants: {
    orientation: {
      vertical: 'mx-1 h-auto self-stretch',
      horizontal: 'my-0.5 h-px w-full self-stretch',
    },
  },
  compoundVariants: [
    {
      orientation: 'vertical',
      className:
        'mx-2 flex flex-col items-center before:mb-2 before:flex-1 before:border-l after:mt-2 after:flex-1 after:border-r',
    },
    {
      orientation: 'horizontal',
      className:
        'my-2 flex items-center self-stretch before:me-2 before:flex-1 before:border-t after:ms-2 after:flex-1 after:border-t',
    },
  ],
  defaultVariants: {
    orientation: 'horizontal',
  },
})

/* ==========================================================================
   ShowMore Slots & Props
   ========================================================================== */

export interface ShowMoreSlots {
  /** Toggle button control slot. */
  button?: React.ComponentType<ToggleButtonProps & { isCircle?: boolean }>
  /** Text readout element slot. */
  text?: React.ComponentType<TextProps>
}

export interface ShowMoreProps
  extends Omit<ToggleButtonProps, 'className' | 'slots' | 'slotProps'>,
    VariantProps<typeof showMoreStyles> {
  /** Custom CSS classes. */
  className?: string
  /** Orientation ramp: horizontal or vertical divider. */
  orientation?: 'horizontal' | 'vertical'
  /** Render mode: interactive button toggle or static text divider. */
  as?: 'text' | 'button'
  /** Static text content displayed when as="text". */
  text?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<ShowMoreSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ShowMoreSlots>
}

const ShowMorePrimitive = ({
  as = 'button',
  orientation = 'horizontal',
  className,
  text,
  slots = {},
  slotProps = {},
  children,
  ...props
}: ShowMoreProps) => {
  return (
    <div
      data-slot="show-more"
      className={showMoreStyles({ orientation, className })}
    >
      {as === 'button' ? (
        slots.button ? (
          renderSlot(slots.button, {
            ...slotProps?.button,
            ...props,
            children: typeof children === 'function' ? children : () => children,
            ...slotProps.button,
          })
        ) : (
          <ToggleButton
            {...props}
            data-slot="show-more-button"
            className={buttonStyles({ isCircle: true, intent: 'outline', size: 'sm' })}
          >
            {composeRenderProps(children, (resolvedChildren) => resolvedChildren)}
          </ToggleButton>
        )
      ) : (
        slots.text ? (
          renderSlot(slots.text, { children: text, ...slotProps.text })
        ) : (
          <Text data-slot="show-more-text">{text}</Text>
        )
      )}
    </div>
  )
}

export const ShowMore = createInterfaceComponent<ShowMoreProps, ShowMoreSlots>(
  {
    name: 'ShowMore',
    category: 'data',
    description: 'Divided content truncation container with animated height expansion toggle button.',
    version: '1.0.0',
    props: {
      as: 'button',
      orientation: 'horizontal',
    },
    slots: {
      button: undefined,
      text: undefined,
    },
  },
  ShowMorePrimitive
)
