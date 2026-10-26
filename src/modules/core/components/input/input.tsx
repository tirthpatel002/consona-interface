import React from 'react'
import {
  Group,
  type GroupProps,
  Input as InputPrimitive,
  type InputProps as InputPrimitiveProps,
  TextField as RACTextField,
  type TextFieldProps as RACTextFieldProps,
} from 'react-aria-components'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { fieldStyles } from '../field'

/* ==========================================================================
   Input Slot Definitions
   ========================================================================== */

export interface InputSlots {}

export interface InputProps extends InputPrimitiveProps {
  /** Optional DOM ref passed directly to the native HTML input element. */
  ref?: React.RefObject<HTMLInputElement | null>
  /** Whether the input control is disabled. */
  isDisabled?: boolean
  /** Slot overrides map. */
  slots?: SlotComponents<InputSlots>
  /** Property overrides passed down to injected slots. */
  slotProps?: SlotPropsMap<InputSlots>
  /** Input children (if any). */
  children?: React.ReactNode
}

const InputComponent = ({
  className,
  ref,
  slots,
  slotProps,
  isDisabled,
  disabled = isDisabled,
  ...props
}: InputProps) => {
  return (
    <span data-slot="control" className="relative block w-full">
      <InputPrimitive
        ref={ref}
        disabled={disabled}
        data-slot="input"
        className={cn(
          'relative block w-full appearance-none rounded-base bg-bg px-3.5 py-space-sm sm:px-space-md sm:py-1.5',
          'text-base/6 text-fg placeholder:text-muted-fg sm:text-sm/6',
          'border border-input transition-colors enabled:hover:border-muted-fg/40',
          'outline-hidden focus:border-ring focus:ring-2 focus:ring-ring/20',
          'invalid:border-danger focus:invalid:border-danger focus:invalid:ring-danger/20',
          '[&::-ms-reveal]:hidden [&::-webkit-search-cancel-button]:hidden',
          'disabled:bg-muted disabled:opacity-60 disabled:cursor-not-allowed',
          'dark:scheme-dark',
          className
        )}
        {...props}
      />
    </span>
  )
}

export const Input = createInterfaceComponent<InputProps, InputSlots>(
  {
    name: 'Input',
    category: 'form',
    description: 'Accessible single-line text input control with optical geometry and focus elevation.',
    version: '1.0.0',
    slots: {

    },
  },
  InputComponent
)

/* ==========================================================================
   InputGroup Component (Addons, Icons, Loaders)
   ========================================================================== */

export interface InputGroupProps extends GroupProps {
  /** Custom CSS classes for the composite input group wrapper. */
  className?: string
}

const InputGroupPrimitive = ({ className, ...props }: InputGroupProps) => {
  return (
    <Group
      data-slot="control"
      className={cn(
        'relative isolate block',
        // icon positioning
        'has-[>[data-slot=icon]:first-child]:[&_input]:ps-10 has-[>[data-slot=icon]:last-child]:[&_input]:pe-10 sm:has-[>[data-slot=icon]:first-child]:[&_input]:ps-8.5 sm:has-[>[data-slot=icon]:last-child]:[&_input]:pe-8.5',
        '*:data-[slot=icon]:pointer-events-none *:data-[slot=icon]:absolute *:data-[slot=icon]:top-3 *:data-[slot=icon]:z-10 *:data-[slot=icon]:size-5 sm:*:data-[slot=icon]:top-2.5 sm:*:data-[slot=icon]:size-4',
        '[&>[data-slot=icon]:first-child]:start-3 sm:[&>[data-slot=icon]:first-child]:start-2.5 [&>[data-slot=icon]:last-child]:end-3 sm:[&>[data-slot=icon]:last-child]:end-2.5',

        // loader positioning
        'has-[[data-slot=loader]:first-child]:[&_input]:ps-10 has-[[data-slot=loader]:last-child]:[&_input]:pe-10 sm:has-[[data-slot=loader]:first-child]:[&_input]:ps-8.5 sm:has-[[data-slot=loader]:last-child]:[&_input]:pe-8.5',
        '*:data-[slot=loader]:pointer-events-none *:data-[slot=loader]:absolute *:data-[slot=loader]:top-3 *:data-[slot=loader]:z-10 *:data-[slot=loader]:size-5 sm:*:data-[slot=loader]:top-2.5 sm:*:data-[slot=loader]:size-4',
        '[&>[data-slot=loader]:first-child]:start-3 sm:[&>[data-slot=loader]:first-child]:start-2.5 [&>[data-slot=loader]:last-child]:end-3 sm:[&>[data-slot=loader]:last-child]:end-2.5',

        // kbd shortcut positioning
        'has-[[data-slot=kbd]:last-child]:[&_input]:pe-12 sm:has-[[data-slot=kbd]:last-child]:[&_input]:pe-10',
        '*:data-[slot=kbd]:absolute *:data-[slot=kbd]:top-2 *:data-[slot=kbd]:end-2.5 *:data-[slot=kbd]:z-10',

        // button positioning
        'has-[>button:first-child]:[&_input]:ps-14 has-[>button:last-child]:[&_input]:pe-14 sm:has-[>button:first-child]:[&_input]:ps-12 sm:has-[>button:last-child]:[&_input]:pe-12',
        '[&>button:first-child]:rounded-e-none [&>button:last-child]:rounded-s-none',
        '[&>button:first-child]:start-0 [&>button:last-child]:end-0',
        '*:[button]:absolute *:[button]:top-0 *:[button]:z-10 *:[button]:min-h-10 sm:*:[button]:min-h-8.5',

        className
      )}
      {...props}
    />
  )
}

export const InputGroup = createInterfaceComponent<InputGroupProps>(
  {
    name: 'InputGroup',
    category: 'form',
    description: 'Composite input wrapper supporting embedded icon, loader, and kbd adornments.',
    version: '1.0.0',
  },
  InputGroupPrimitive
)

/* ==========================================================================
   TextField Primitive
   ========================================================================== */

export interface TextFieldProps extends RACTextFieldProps {
  /** Custom CSS classes for the composite text field layout container. */
  className?: string
}

const TextFieldComponent = ({ className, ...props }: TextFieldProps) => {
  return (
    <RACTextField
      data-slot="control"
      className={cn(fieldStyles(), className)}
      {...props}
    />
  )
}

export const TextField = createInterfaceComponent<TextFieldProps>(
  {
    name: 'TextField',
    category: 'form',
    description: 'Accessible composite text field combining label, input, description, and error messaging.',
    version: '1.0.0',
  },
  TextFieldComponent
)

// Namespace attachments for compound family ergonomics
Input.Group = InputGroup
Input.Field = TextField

export const { Context: InputContext, useCompoundContext: useInputContext } =
  createCompoundContext<any>('Input')
