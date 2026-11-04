import React from 'react'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Description, Field, FieldError, Label, type DescriptionProps, type FieldErrorProps, type LabelProps } from '../field'
import { EmailInput, type EmailInputProps } from '../email-input/email-input'
import { TextField } from '../input'
import { useEmailField } from '../../hooks/use-email-field'

export interface EmailFieldSlots {
  /** Accessible label. */
  label?: React.ComponentType<LabelProps>
  /** Help text under the control. */
  description?: React.ComponentType<DescriptionProps>
  /** Validation error message. */
  error?: React.ComponentType<FieldErrorProps>
  /** Email input atom. */
  input?: React.ComponentType<EmailInputProps>
}

export interface EmailFieldProps {
  /** Accessible field label. */
  label?: React.ReactNode
  /** Auxiliary help text. */
  description?: React.ReactNode
  /** Override validation copy. */
  errorMessage?: React.ReactNode
  /** Controlled value. */
  value?: string
  /** Uncontrolled initial value. */
  defaultValue?: string
  /** Called when the value changes. */
  onChange?: (value: string) => void
  /** Placeholder copy. */
  placeholder?: string
  /** When to run local format validation. */
  validateOn?: 'change' | 'blur'
  /** Override the default email format pattern. */
  pattern?: RegExp | string
  /** Restrict accepted domains, e.g. `['company.com', '.edu']`. */
  allowedDomains?: string[]
  /** Reject these domains, e.g. `['mailinator.com', '.xyz']`. */
  blockedDomains?: string[]
  /** Whether the control is disabled. */
  isDisabled?: boolean
  /** Whether a value is required. */
  isRequired?: boolean
  /** Additional classes on the TextField wrapper. */
  className?: string
  /** Optional composed children replacing the default anatomy. */
  children?: React.ReactNode
  /** Slot overrides. */
  slots?: SlotComponents<EmailFieldSlots>
  /** Props forwarded to injected slots. */
  slotProps?: SlotPropsMap<EmailFieldSlots>
}

const EmailFieldPrimitive = ({
  label = 'Email',
  description,
  errorMessage,
  value,
  defaultValue,
  onChange,
  placeholder = 'name@company.com',
  validateOn = 'change',
  pattern,
  allowedDomains,
  blockedDomains,
  isDisabled,
  isRequired,
  className,
  children,
  slots = {},
  slotProps = {},
}: EmailFieldProps) => {
  const field = useEmailField({
    value,
    defaultValue,
    onChange,
    validateOn,
    pattern,
    allowedDomains,
    blockedDomains,
  })

  return (
    <TextField
      value={field.state.value}
      onChange={field.actions.setValue}
      onBlur={field.actions.blur}
      isDisabled={isDisabled}
      isRequired={isRequired}
      isInvalid={field.state.isInvalid}
      className={className}
      {...field.ariaProps}
    >
      {children ?? (
        <>
          {label && renderSlot(slots.label, { children: label, ...(slotProps.label ?? {}) }, { defaultComponent: Label })}
          {renderSlot(slots.input, { placeholder, ...(slotProps.input ?? {}) }, { defaultComponent: EmailInput })}
          {description && !field.state.isInvalid &&
            renderSlot(slots.description, { children: description, ...(slotProps.description ?? {}) }, {
              defaultComponent: Description,
            })}
          {field.state.isInvalid &&
            renderSlot(
              slots.error,
              { children: errorMessage ?? field.helpers.message, ...(slotProps.error ?? {}) },
              { defaultComponent: FieldError }
            )}
        </>
      )}
    </TextField>
  )
}

export const EmailField = createInterfaceComponent<EmailFieldProps, EmailFieldSlots>(
  {
    name: 'EmailField',
    category: 'form',
    description: 'Email field with format validation, domain allowlist/denylist, and a leading envelope icon.',
    version: '1.0.0',
    props: {
      validateOn: 'change',
    },
    slots: {
      label: Label,
      description: Description,
      error: FieldError,
      input: EmailInput,
    },
  },
  EmailFieldPrimitive
)

EmailField.Input = EmailInput
Field.Email = EmailField
