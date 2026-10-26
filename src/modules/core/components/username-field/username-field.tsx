import React from 'react'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Description, Field, FieldError, Label, type DescriptionProps, type FieldErrorProps, type LabelProps } from '../field'
import { TextField } from '../input'
import { UsernameInput, type UsernameInputProps } from '../username-input/username-input'
import {
  suggestUsernames,
  useUsernameField,
  type UsernameAvailability,
} from '../../hooks/use-username-field'

export interface UsernameFieldStatusProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Availability outcome shown beside the input. */
  status?: UsernameAvailability['status']
  /** Alternate handles offered when the name is taken. */
  suggestions?: string[]
  /** Called when a suggestion chip is chosen. */
  onSuggest?: (value: string) => void
}

const UsernameFieldStatusPrimitive = ({
  status = 'idle',
  suggestions = [],
  onSuggest,
  className,
  ...props
}: UsernameFieldStatusProps) => {
  if (status === 'idle' || status === 'invalid') return null

  const copy = status === 'checking' ? 'Checking…' : status === 'available' ? 'Username is available' : 'Username is taken'
  const Icon = status === 'available' ? CheckCircleIcon : status === 'taken' ? XCircleIcon : undefined

  return (
    <div data-slot="username-status" className={cn('flex flex-col gap-space-sm', className)} {...props}>
      <p
        className={cn(
          'flex items-center gap-space-sm text-sm/6 font-medium',
          status === 'available' && 'text-success',
          status === 'taken' && 'text-danger',
          status === 'checking' && 'text-muted-fg'
        )}
      >
        {Icon && <Icon className="size-5 shrink-0" />}
        {copy}
      </p>
      {status === 'taken' && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-space-xs">
          {suggestions.map((item) => (
            <button
              key={item}
              type="button"
              className="rounded-micro border border-border bg-secondary px-space-sm py-space-2xs text-xs text-fg hover:bg-secondary/80"
              onClick={() => onSuggest?.(item)}
            >
              @{item}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export const UsernameFieldStatus = createInterfaceComponent<UsernameFieldStatusProps>(
  {
    name: 'UsernameFieldStatus',
    category: 'form',
    description: 'Subtle username availability feedback with optional suggested handles.',
    version: '1.0.0',
  },
  UsernameFieldStatusPrimitive
)

export interface UsernameFieldSlots {
  /** Accessible label. */
  label?: React.ComponentType<LabelProps>
  /** Help text under the control. */
  description?: React.ComponentType<DescriptionProps>
  /** Validation error message. */
  error?: React.ComponentType<FieldErrorProps>
  /** Username input atom. */
  input?: React.ComponentType<UsernameInputProps>
  /** Availability badge and suggestion row. */
  status?: React.ComponentType<UsernameFieldStatusProps>
}

export interface UsernameFieldProps {
  /** Accessible field label. */
  label?: React.ReactNode
  /** Auxiliary help text. */
  description?: React.ReactNode
  /** Override validation copy. */
  errorMessage?: React.ReactNode
  /** Controlled handle (without a leading @). */
  value?: string
  /** Uncontrolled initial handle. */
  defaultValue?: string
  /** Called when the handle changes. */
  onChange?: (value: string) => void
  /** Placeholder copy. */
  placeholder?: string
  /** When to run local format validation. */
  validateOn?: 'change' | 'blur'
  /** Username availability checker. */
  checkAvailability?: (value: string) => UsernameAvailability | Promise<UsernameAvailability>
  /** Override the default username format pattern. */
  pattern?: RegExp | string
  /** Whether the control is disabled. */
  isDisabled?: boolean
  /** Whether a value is required. */
  isRequired?: boolean
  /** Additional classes on the TextField wrapper. */
  className?: string
  /** Optional composed children replacing the default anatomy. */
  children?: React.ReactNode
  /** Slot overrides. */
  slots?: SlotComponents<UsernameFieldSlots>
  /** Props forwarded to injected slots. */
  slotProps?: SlotPropsMap<UsernameFieldSlots>
}

const UsernameFieldPrimitive = ({
  label = 'Username',
  description,
  errorMessage,
  value,
  defaultValue,
  onChange,
  placeholder = 'yourhandle',
  validateOn = 'change',
  checkAvailability,
  pattern,
  isDisabled,
  isRequired,
  className,
  children,
  slots = {},
  slotProps = {},
}: UsernameFieldProps) => {
  const field = useUsernameField({
    value,
    defaultValue,
    onChange,
    validateOn,
    checkAvailability,
    pattern,
  })

  const suggestions =
    field.state.availability.suggestions ??
    (field.state.availability.status === 'taken' ? suggestUsernames(field.state.value) : [])

  const taken = field.state.availability.status === 'taken'
  const resolvedError =
    errorMessage ??
    (taken || field.state.availability.status === 'available' ? null : field.helpers.message)

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
          {renderSlot(
            slots.input,
            {
              placeholder,
              isChecking: field.state.availability.status === 'checking',
              ...(slotProps.input ?? {}),
            },
            { defaultComponent: UsernameInput }
          )}
          {renderSlot(
            slots.status,
            {
              status: field.state.availability.status,
              suggestions,
              onSuggest: field.actions.setValue,
              ...(slotProps.status ?? {}),
            },
            { defaultComponent: UsernameFieldStatus }
          )}
          {description && !field.state.isInvalid &&
            renderSlot(slots.description, { children: description, ...(slotProps.description ?? {}) }, {
              defaultComponent: Description,
            })}
          {field.state.isInvalid && !taken && resolvedError &&
            renderSlot(slots.error, { children: resolvedError, ...(slotProps.error ?? {}) }, { defaultComponent: FieldError })}
        </>
      )}
    </TextField>
  )
}

export const UsernameField = createInterfaceComponent<UsernameFieldProps, UsernameFieldSlots>(
  {
    name: 'UsernameField',
    category: 'form',
    description: 'Username field with a leading @ mark, format validation, and availability feedback.',
    version: '1.0.0',
    props: {
      validateOn: 'change',
    },
    slots: {
      label: Label,
      description: Description,
      error: FieldError,
      input: UsernameInput,
      status: UsernameFieldStatus,
    },
  },
  UsernameFieldPrimitive
)

UsernameField.Status = UsernameFieldStatus
UsernameField.Input = UsernameInput
Field.Username = UsernameField

export const { Context: UsernameFieldContext, useCompoundContext: useUsernameFieldContext } =
  createCompoundContext<any>('UsernameField')
