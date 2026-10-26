import React from 'react'
import {
  composeRenderProps,
  Radio as RACRadio,
  type RadioProps as RACRadioProps,
  RadioGroup as RACRadioGroup,
  type RadioGroupProps as RACRadioGroupProps,
  RadioField as RACRadioField,
  type RadioFieldProps as RACRadioFieldProps,
} from 'react-aria-components'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'

/* ==========================================================================
   Radio Group & Field
   ========================================================================== */

export interface RadioGroupProps extends Omit<RACRadioGroupProps, 'children'> {
  /** Explicit children composition or render function. */
  children?: React.ReactNode | ((values: any) => React.ReactNode)
  /** Custom CSS classes for the radio group container. */
  className?: string
}

const RadioGroupPrimitive = ({ className, ...props }: RadioGroupProps) => {
  return (
    <RACRadioGroup
      {...props}
      data-slot="control"
      className={cn(
        'space-y-space-md has-[[slot=description]]:not-has-[[slot=errorMessage]]:space-y-5 *:data-[slot=label]:font-medium',
        className
      )}
    />
  )
}

export const RadioGroup = createInterfaceComponent<RadioGroupProps>(
  {
    name: 'RadioGroup',
    category: 'form',
    description: 'Accessible radio group container coordinating mutually exclusive selections.',
    version: '1.0.0',
  },
  RadioGroupPrimitive
)

export interface RadioFieldProps extends RACRadioFieldProps {
  /** Custom CSS classes for the radio field layout grid. */
  className?: string
}

const RadioFieldPrimitive = ({ className, ...props }: RadioFieldProps) => {
  return (
    <RACRadioField
      {...props}
      data-slot="control"
      className={cn(
        'grid grid-cols-[1.125rem_1fr] gap-x-space-md gap-y-space-xs sm:grid-cols-[1rem_1fr]',
        '*:data-[slot=control]:col-start-1 *:data-[slot=control]:row-start-1 *:data-[slot=control]:mt-space-2xs sm:*:data-[slot=control]:mt-space-2xs',
        '**:data-[slot=control-label]:col-start-2 **:data-[slot=control-label]:row-start-1',
        '*:[[slot=description]]:col-start-2 *:[[slot=description]]:row-start-2',
        'has-[[slot=description]]:**:data-[slot=control-label]:font-medium',
        className
      )}
    />
  )
}

export const RadioField = createInterfaceComponent<RadioFieldProps>(
  {
    name: 'RadioField',
    category: 'form',
    description: 'Grid layout container combining radio button indicator with label and description.',
    version: '1.0.0',
  },
  RadioFieldPrimitive
)

/* ==========================================================================
   Radio Primitive & Slots
   ========================================================================== */

export interface RadioSlots {
  /** Custom inner dot indicator slot rendered when selected. */
  dot?: React.ComponentType<{ isSelected?: boolean }>
}

export interface RadioProps extends Omit<RACRadioProps, 'children'> {
  /** Explicit children composition or render function. */
  children?: React.ReactNode | ((values: any) => React.ReactNode)
  /** Optional DOM ref attached to the label wrapper element. */
  ref?: React.Ref<HTMLLabelElement>
  /** Slot overrides map for customizing the inner radio selection dot. */
  slots?: SlotComponents<RadioSlots>
  /** Property overrides passed down into injected slots. */
  slotProps?: SlotPropsMap<RadioSlots>
}

const RadioComponent = ({
  className,
  children,
  ref,
  slots,
  slotProps,
  ...props
}: RadioProps) => {
  return (
    <RACRadio
      ref={ref as any}
      data-slot="radio"
      className={cn('group inline-flex cursor-pointer col-span-full gap-x-space-md focus:outline-hidden select-none', className)}
      {...props}
    >
      {composeRenderProps(children, (children, { isSelected, isInvalid }) => {
        return (
          <>
            <span
              data-slot="indicator"
              className={cn([
                'relative col-start-1 row-start-1 mt-space-2xs isolate flex size-4.5 shrink-0 items-center justify-center rounded-full border border-input bg-bg transition-colors',
                "before:absolute before:inset-auto before:size-2 before:shrink-0 before:rounded-full before:content-[''] hover:before:bg-muted-fg/20 sm:size-4 sm:before:size-1.5",
                'in-disabled:bg-muted in-disabled:opacity-60',
                isSelected && [
                  'border-primary bg-primary text-primary-fg before:bg-primary-fg hover:before:bg-primary-fg/90',
                  'group-invalid:border-danger group-invalid:bg-danger group-invalid:text-danger-fg',
                ],
                isInvalid &&
                  'border-danger bg-danger/10 text-danger-fg ring-danger/20',
              ])}
            >
              {slots?.dot && renderSlot(slots.dot, { isSelected, ...slotProps?.dot })}
            </span>
            <span data-slot="control-label" className="text-sm font-normal text-fg">
              {children}
            </span>
          </>
        )
      })}
    </RACRadio>
  )
}

export const Radio = createInterfaceComponent<RadioProps, RadioSlots>(
  {
    name: 'Radio',
    category: 'form',
    description: 'Accessible radio button control with concentric optical circular indicators.',
    version: '1.0.0',
    slots: {
      dot: undefined,
    },
  },
  RadioComponent
)

// Namespace attachments for compound family ergonomics
Radio.Group = RadioGroup
Radio.Field = RadioField
RadioGroup.Item = Radio
RadioGroup.Field = RadioField

export const { Context: RadioContext, useCompoundContext: useRadioContext } =
  createCompoundContext<any>('Radio')

export const { Context: RadioGroupContext, useCompoundContext: useRadioGroupContext } =
  createCompoundContext<any>('RadioGroup')
