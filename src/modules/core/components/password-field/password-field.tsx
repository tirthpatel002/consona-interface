import React from 'react'
import { ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Button } from '../button'
import { Description, Field, FieldError, Label, type DescriptionProps, type FieldErrorProps, type LabelProps } from '../field'
import { TextField } from '../input'
import { PasswordInput, type PasswordInputProps } from '../password-input/password-input'
import {
  usePasswordField,
  type PasswordRequirement,
  type PasswordStrengthLevel,
} from '../../hooks/use-password-field'

export interface PasswordStrengthProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Strength band used to color the meter. */
  level?: PasswordStrengthLevel
  /** Score from 0–4. */
  score?: number
  /** Status label above the meter. */
  label?: string
}

const STRENGTH_BAR: Record<PasswordStrengthLevel, string> = {
  empty: 'bg-muted',
  weak: 'bg-danger',
  fair: 'bg-warning',
  good: 'bg-primary',
  strong: 'bg-success',
}

const PasswordStrengthPrimitive = ({
  level = 'empty',
  score = 0,
  label,
  className,
  ...props
}: PasswordStrengthProps) => {
  return (
    <div data-slot="password-strength" className={cn('flex flex-col gap-space-xs', className)} {...props}>
      <div className="flex items-center justify-between">
        <span className="text-xs/5 text-muted-fg">{label}</span>
        {level !== 'empty' && (
          <span className={cn('text-xs/5 font-medium capitalize', level === 'weak' && 'text-danger', level === 'fair' && 'text-warning', level === 'good' && 'text-primary', level === 'strong' && 'text-success')}>
            {level}
          </span>
        )}
      </div>
      <div className="grid grid-cols-4 gap-space-xs">
        {Array.from({ length: 4 }, (_, index) => (
          <span
            key={index}
            data-slot="password-strength-bar"
            className={cn('h-1 rounded-full bg-muted', index < score && STRENGTH_BAR[level])}
          />
        ))}
      </div>
    </div>
  )
}

export const PasswordStrength = createInterfaceComponent<PasswordStrengthProps>(
  {
    name: 'PasswordStrength',
    category: 'form',
    description: 'Four-segment password strength meter with live level copy.',
    version: '1.0.0',
  },
  PasswordStrengthPrimitive
)

export interface PasswordRequirementsProps extends React.ComponentPropsWithoutRef<'ul'> {
  /** Requirement checklist derived from the current password. */
  requirements?: PasswordRequirement[]
}

const PasswordRequirementsPrimitive = ({ requirements = [], className, ...props }: PasswordRequirementsProps) => {
  return (
    <ul data-slot="password-requirements" className={cn('flex flex-col gap-space-2xs', className)} {...props}>
      {requirements.map((item) => (
        <li
          key={item.id}
          data-met={item.met}
          className={cn('flex items-center gap-space-xs text-xs/5', item.met ? 'text-success' : 'text-muted-fg')}
        >
          {item.met ? (
            <CheckIcon className="size-3.5 shrink-0" />
          ) : (
            <span className="size-3.5 shrink-0 rounded-full border border-current" />
          )}
          {item.label}
        </li>
      ))}
    </ul>
  )
}

export const PasswordRequirements = createInterfaceComponent<PasswordRequirementsProps>(
  {
    name: 'PasswordRequirements',
    category: 'form',
    description: 'Live checklist of password composition rules.',
    version: '1.0.0',
  },
  PasswordRequirementsPrimitive
)

export interface PasswordSuggestorProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Preview of the generated password. */
  suggestion?: string
  /** Called when the user applies the suggestion. */
  onUse?: () => void
  /** Called when the user asks for a new candidate. */
  onRefresh?: () => void
}

const PasswordSuggestorPrimitive = ({
  suggestion,
  onUse,
  onRefresh,
  className,
  ...props
}: PasswordSuggestorProps) => {
  if (!suggestion) return null
  return (
    <div
      data-slot="password-suggestor"
      className={cn('flex items-center gap-space-sm rounded-base border border-border bg-secondary/40 px-space-md py-space-sm', className)}
      {...props}
    >
      <code className="min-w-0 flex-1 truncate font-mono text-xs text-fg">{suggestion}</code>
      <Button intent="plain" size="xs" onPress={onUse}>
        Use
      </Button>
      <Button intent="plain" size="sq-xs" aria-label="Generate another password" onPress={onRefresh}>
        <ArrowPathIcon className="size-3.5" />
      </Button>
    </div>
  )
}

export const PasswordSuggestor = createInterfaceComponent<PasswordSuggestorProps>(
  {
    name: 'PasswordSuggestor',
    category: 'form',
    description: 'Generated password candidate with use and refresh actions.',
    version: '1.0.0',
  },
  PasswordSuggestorPrimitive
)

export interface PasswordFieldSlots {
  /** Accessible label. */
  label?: React.ComponentType<LabelProps>
  /** Help text under the control. */
  description?: React.ComponentType<DescriptionProps>
  /** Validation error message. */
  error?: React.ComponentType<FieldErrorProps>
  /** Password input atom. */
  input?: React.ComponentType<PasswordInputProps>
  /** Strength meter. */
  strength?: React.ComponentType<PasswordStrengthProps>
  /** Requirement checklist. */
  requirements?: React.ComponentType<PasswordRequirementsProps>
  /** Password suggestion well. */
  suggestor?: React.ComponentType<PasswordSuggestorProps>
}

export interface PasswordFieldProps {
  /** Accessible field label. */
  label?: React.ReactNode
  /** Auxiliary help text. */
  description?: React.ReactNode
  /** Override validation copy. */
  errorMessage?: React.ReactNode
  /** Controlled password. */
  value?: string
  /** Uncontrolled initial password. */
  defaultValue?: string
  /** Called when the password changes. */
  onChange?: (value: string) => void
  /** Placeholder copy. */
  placeholder?: string
  /** Whether the hide/show toggle is shown. */
  isRevealable?: boolean
  /** Controlled reveal state. */
  isRevealed?: boolean
  /** Uncontrolled initial reveal state. */
  defaultRevealed?: boolean
  /** Called when hide/show toggles. */
  onRevealChange?: (revealed: boolean) => void
  /** Whether to render the live strength meter. */
  showStrength?: boolean
  /** Whether to render the requirement checklist. */
  showRequirements?: boolean
  /** Whether to render the password suggestor. */
  showSuggestor?: boolean
  /** Minimum length for the length rule. */
  minLength?: number
  /** Whether the control is disabled. */
  isDisabled?: boolean
  /** Whether a value is required. */
  isRequired?: boolean
  /** Additional classes on the TextField wrapper. */
  className?: string
  /** Optional composed children replacing the default anatomy. */
  children?: React.ReactNode
  /** Slot overrides. */
  slots?: SlotComponents<PasswordFieldSlots>
  /** Props forwarded to injected slots. */
  slotProps?: SlotPropsMap<PasswordFieldSlots>
}

const PasswordFieldPrimitive = ({
  label = 'Password',
  description,
  errorMessage,
  value,
  defaultValue,
  onChange,
  placeholder = 'Enter a password',
  isRevealable = true,
  isRevealed,
  defaultRevealed,
  onRevealChange,
  showStrength = true,
  showRequirements = true,
  showSuggestor = true,
  minLength = 8,
  isDisabled,
  isRequired,
  className,
  children,
  slots = {},
  slotProps = {},
}: PasswordFieldProps) => {
  const field = usePasswordField({
    value,
    defaultValue,
    onChange,
    isRevealed,
    defaultRevealed,
    onRevealChange,
    minLength,
  })
  const [suggestion, setSuggestion] = React.useState(() => field.helpers.generate())

  return (
    <TextField
      value={field.state.value}
      onChange={field.actions.setValue}
      isDisabled={isDisabled}
      isRequired={isRequired}
      isInvalid={field.helpers.isInvalid}
      className={className}
      type={field.ariaProps.type}
      autoComplete={field.ariaProps.autoComplete}
      aria-invalid={field.ariaProps['aria-invalid']}
    >
      {children ?? (
        <>
          {label && renderSlot(slots.label, { children: label, ...(slotProps.label ?? {}) }, { defaultComponent: Label })}
          {renderSlot(
            slots.input,
            {
              placeholder,
              isRevealable,
              isRevealed: field.state.isRevealed,
              onRevealChange: field.actions.setRevealed,
              autoComplete: 'new-password',
              ...(slotProps.input ?? {}),
            },
            { defaultComponent: PasswordInput }
          )}
          {showStrength &&
            renderSlot(
              slots.strength,
              {
                level: field.state.level,
                score: field.state.score,
                label: field.helpers.label,
                ...(slotProps.strength ?? {}),
              },
              { defaultComponent: PasswordStrength }
            )}
          {showRequirements &&
            renderSlot(
              slots.requirements,
              { requirements: field.state.requirements, ...(slotProps.requirements ?? {}) },
              { defaultComponent: PasswordRequirements }
            )}
          {showSuggestor &&
            renderSlot(
              slots.suggestor,
              {
            ...slotProps?.suggestor,
                suggestion,
                onUse: () => field.actions.useSuggested(suggestion),
                onRefresh: () => setSuggestion(field.helpers.generate()),
                ...(slotProps.suggestor ?? {}),
              },
              { defaultComponent: PasswordSuggestor }
            )}
          {description && !field.helpers.isInvalid &&
            renderSlot(slots.description, { children: description, ...(slotProps.description ?? {}) }, {
              defaultComponent: Description,
            })}
          {field.helpers.isInvalid &&
            renderSlot(
              slots.error,
              {
                children: errorMessage ?? 'Password does not meet the requirements.',
                ...(slotProps.error ?? {}),
              },
              { defaultComponent: FieldError }
            )}
        </>
      )}
    </TextField>
  )
}

export const PasswordField = createInterfaceComponent<PasswordFieldProps, PasswordFieldSlots>(
  {
    name: 'PasswordField',
    category: 'form',
    description: 'Password field with hide/show, live strength feedback, requirement checklist, and a suggestor.',
    version: '1.0.0',
    props: {
      isRevealable: true,
      showStrength: true,
      showRequirements: true,
      showSuggestor: true,
      minLength: 8,
    },
    slots: {
      label: Label,
      description: Description,
      error: FieldError,
      input: PasswordInput,
      strength: PasswordStrength,
      requirements: PasswordRequirements,
      suggestor: PasswordSuggestor,
    },
  },
  PasswordFieldPrimitive
)

PasswordField.Strength = PasswordStrength
PasswordField.Requirements = PasswordRequirements
PasswordField.Suggestor = PasswordSuggestor
PasswordField.Input = PasswordInput

Field.Password = PasswordField

export const { Context: PasswordFieldContext, useCompoundContext: usePasswordFieldContext } =
  createCompoundContext<any>('PasswordField')
