import React from 'react'
import {
  NumberField as RACNumberField,
  type NumberFieldProps as RACNumberFieldProps,
  Button as RACButton,
  type ButtonProps as RACButtonProps,
  Input as RACInput,
  type InputProps as RACInputProps,
} from 'react-aria-components'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { MinusIcon, PlusIcon } from '@heroicons/react/20/solid'
import { fieldStyles } from '../field'

/* ==========================================================================
   NumberField Styles & Ramps
   ========================================================================== */

export const numberFieldStyles = tv({
  base: 'flex flex-col gap-1.5 w-full',
})

/* ==========================================================================
   NumberField Slots & State Definitions
   ========================================================================== */

export interface NumberFieldSlots {}

/* ==========================================================================
   NumberField Root Primitive & Factory
   ========================================================================== */

export interface NumberFieldProps
  extends Omit<RACNumberFieldProps, 'children'>,
    VariantProps<typeof numberFieldStyles> {
  /** Current controlled numeric value. */
  value?: number
  /** Default uncontrolled initial numeric value. */
  defaultValue?: number
  /** Handler called when the numeric value changes. */
  onChange?: (value: number) => void
  /** Minimum allowable numeric value. */
  minValue?: number
  /** Maximum allowable numeric value. */
  maxValue?: number
  /** Granularity stepping interval for increment and decrement actions. */
  step?: number
  /** Formatting options for currency, percentages, units, and decimal places. */
  formatOptions?: Intl.NumberFormatOptions
  /** Whether user interaction with the number field is disabled. */
  isDisabled?: boolean
  /** Whether the field is in a read-only state. */
  isReadOnly?: boolean
  /** Whether a value is required for form submission. */
  isRequired?: boolean
  /** Custom CSS classes for the number field container. */
  className?: string
  /** Child elements, defaulting to NumberInput if omitted. */
  children?: React.ReactNode
  /** Injected slot component overrides. */
  slots?: SlotComponents<NumberFieldSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<NumberFieldSlots>
}

const NumberFieldPrimitive = ({
  className,
  children,
  slots = {},
  slotProps = {},
  ...props
}: NumberFieldProps) => {
  return (
    <RACNumberField
      data-slot="number-field"
      className={cn(numberFieldStyles(), fieldStyles(), className)}
      {...props}
    >
      {children || <NumberInput />}
    </RACNumberField>
  )
}

export const NumberField = createInterfaceComponent<NumberFieldProps, NumberFieldSlots>(
  {
    name: 'NumberField',
    category: 'form',
    description: 'Formatted numeric input with increment/decrement steppers, format scaling, and keyboard controls.',
    version: '1.0.0',
    props: {
      step: 1,
      isDisabled: false,
    },
    slots: {

    },
  },
  NumberFieldPrimitive
)

/* ==========================================================================
   NumberInput & Stepper Subcomponents
   ========================================================================== */

export interface NumberInputSteppersProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS class names for the stepper cluster. */
  className?: string
}

export const NumberInputSteppers = ({ className, ...props }: NumberInputSteppersProps) => (
  <div
    data-slot="stepper-controls"
    className={cn(
      'absolute inset-y-space-xs end-1 z-10 flex items-center divide-x divide-border/40 overflow-hidden rounded-[calc(var(--radius-base)-4px)] border border-border/40 bg-secondary/80',
      className
    )}
    {...props}
  >
    <StepperButton slot="decrement" />
    <StepperButton slot="increment" />
  </div>
)

export interface NumberInputSlots {
  /** Stepper button controls wrapper slot */
  steppers?: React.ComponentType<NumberInputSteppersProps>
}

export interface NumberInputProps extends RACInputProps {
  /** Optional DOM ref passed directly to the native HTML input element. */
  ref?: React.Ref<HTMLInputElement>
  /** Placeholder text shown when input is empty. */
  placeholder?: string
  /** Custom CSS class names for the input. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<NumberInputSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<NumberInputSlots>
}

const NumberInputPrimitive = ({
  className,
  ref,
  slots,
  slotProps,
  ...props
}: NumberInputProps) => {
  return (
    <div data-slot="number-input-group" className="relative isolate flex items-center w-full">
      <RACInput
        ref={ref as any}
        data-slot="input"
        className={cn(
          'relative block w-full appearance-none rounded-base bg-bg px-3.5 py-space-sm sm:px-space-md sm:py-1.5',
          'text-base/6 text-fg placeholder:text-muted-fg sm:text-sm/6',
          'border border-input transition-colors enabled:hover:border-muted-fg/40',
          'outline-hidden focus:border-ring focus:ring-2 focus:ring-ring/20',
          'invalid:border-danger focus:invalid:border-danger focus:invalid:ring-danger/20',
          'tabular-nums font-mono pe-16',
          'disabled:bg-muted disabled:opacity-60 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
      {renderSlot(slots?.steppers, slotProps?.steppers as object, {
        defaultComponent: NumberInputSteppers,
      })}
    </div>
  )
}

export const NumberInput = createInterfaceComponent<NumberInputProps, NumberInputSlots>(
  {
    name: 'NumberInput',
    category: 'form',
    description: 'Formatted numerical input field with integrated stepper side controls.',
    version: '1.0.0',
    slots: {
      steppers: NumberInputSteppers,
    },
  },
  NumberInputPrimitive
)

export interface StepperButtonSlots {
  /** Stepper button icon override slot */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface StepperButtonProps extends RACButtonProps {
  /** Action slot type designating increment or decrement behavior. */
  slot: 'increment' | 'decrement'
  /** Custom CSS classes for the stepper button. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<StepperButtonSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<StepperButtonSlots>
}

const StepperButtonPrimitive = ({
  slot,
  className,
  slots = {},
  slotProps = {},
  ...props
}: StepperButtonProps) => {
  return (
    <RACButton
      data-slot="stepper-button"
      data-stepper={slot}
      aria-label={slot === 'increment' ? 'Increment value' : 'Decrement value'}
      className={cn(
        'inline-flex items-center justify-center size-7 cursor-pointer select-none text-muted-fg transition-colors duration-150 hover:text-fg hover:bg-secondary active:bg-muted/80 focus:outline-none disabled:pointer-events-none disabled:opacity-40',
        className
      )}
      slot={slot}
      {...props}
    >
      {renderSlot(
        slots.icon,
        { className: 'size-3.5', ...(slotProps.icon as object) },
        {
          defaultComponent: slot === 'increment' ? PlusIcon : MinusIcon,
        }
      )}
    </RACButton>
  )
}

export const StepperButton = createInterfaceComponent<StepperButtonProps, StepperButtonSlots>(
  {
    name: 'StepperButton',
    category: 'form',
    description: 'Increment/decrement stepper button for numeric inputs.',
    version: '1.0.0',
    slots: {
      icon: undefined,
    },
  },
  StepperButtonPrimitive
)

// Namespace attachments for compound family ergonomics
export const StepperInput = NumberInput
NumberField.Input = NumberInput
NumberField.Stepper = StepperButton
NumberField.StepperButton = StepperButton

export const { Context: NumberFieldContext, useCompoundContext: useNumberFieldContext } =
  createCompoundContext<any>('NumberField')
