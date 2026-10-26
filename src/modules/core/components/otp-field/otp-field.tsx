import React from 'react'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Description, Field, FieldError, Label, fieldStyles, type DescriptionProps, type FieldErrorProps, type LabelProps } from '../field'
import {
  InputOTP,
  InputOTPControl,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  type InputOTPProps,
} from '../input-otp/input-otp'
import { useOtpField, type OtpStatus } from '../../hooks/use-otp-field'

export interface OtpFieldStatusProps extends React.ComponentPropsWithoutRef<'p'> {
  /** Derived correct/incorrect status. */
  status?: OtpStatus
  /** Status copy. */
  message?: string | null
}

const OtpFieldStatusPrimitive = ({ status = 'idle', message, className, ...props }: OtpFieldStatusProps) => {
  if (!message || (status !== 'correct' && status !== 'incorrect')) return null
  const Icon = status === 'correct' ? CheckCircleIcon : XCircleIcon
  return (
    <p
      data-slot="otp-status"
      className={cn(
        'flex items-center gap-space-xs text-xs/5 font-medium',
        status === 'correct' ? 'text-success' : 'text-danger',
        className
      )}
      {...props}
    >
      <Icon className="size-4 shrink-0" />
      {message}
    </p>
  )
}

export const OtpFieldStatus = createInterfaceComponent<OtpFieldStatusProps>(
  {
    name: 'OtpFieldStatus',
    category: 'form',
    description: 'Correct/incorrect OTP feedback row.',
    version: '1.0.0',
  },
  OtpFieldStatusPrimitive
)

export interface OtpFieldSlots {
  /** Accessible label. */
  label?: React.ComponentType<LabelProps>
  /** Help text under the control. */
  description?: React.ComponentType<DescriptionProps>
  /** Validation error message. */
  error?: React.ComponentType<FieldErrorProps>
  /** OTP host input. */
  otp?: React.ComponentType<InputOTPProps>
  /** Correct/incorrect status row. */
  status?: React.ComponentType<OtpFieldStatusProps>
}

export interface OtpFieldProps {
  /** Accessible field label. */
  label?: React.ReactNode
  /** Auxiliary help text. */
  description?: React.ReactNode
  /** Override validation copy. */
  errorMessage?: React.ReactNode
  /** Controlled OTP value. */
  value?: string
  /** Uncontrolled initial OTP value. */
  defaultValue?: string
  /** Called when the OTP value changes. */
  onChange?: (value: string) => void
  /** Called when every slot is filled. */
  onComplete?: (value: string) => void
  /** Number of OTP characters. */
  length?: number
  /** When true, slots accept letters and digits. */
  alphanumeric?: boolean
  /** Expected code used for correct/incorrect feedback. */
  expected?: string
  /** Split the slots into two groups after this many characters. */
  splitAfter?: number
  /** Whether the control is disabled. */
  isDisabled?: boolean
  /** Whether a value is required. */
  isRequired?: boolean
  /** Additional classes on the field wrapper. */
  className?: string
  /** Optional composed children replacing the default anatomy. */
  children?: React.ReactNode
  /** Slot overrides. */
  slots?: SlotComponents<OtpFieldSlots>
  /** Props forwarded to injected slots. */
  slotProps?: SlotPropsMap<OtpFieldSlots>
}

const OtpSlots = ({ length, splitAfter }: { length: number; splitAfter?: number }) => {
  const split = splitAfter && splitAfter > 0 && splitAfter < length ? splitAfter : undefined
  const first = Array.from({ length: split ?? length }, (_, index) => index)
  const second = split ? Array.from({ length: length - split }, (_, index) => index + split) : []

  return (
    <InputOTPControl>
      <InputOTPGroup>
        {first.map((index) => (
          <InputOTPSlot key={index} index={index} />
        ))}
      </InputOTPGroup>
      {second.length > 0 && (
        <>
          <InputOTPSeparator />
          <InputOTPGroup>
            {second.map((index) => (
              <InputOTPSlot key={index} index={index} />
            ))}
          </InputOTPGroup>
        </>
      )}
    </InputOTPControl>
  )
}

const OtpFieldPrimitive = ({
  label = 'Verification code',
  description,
  errorMessage,
  value,
  defaultValue,
  onChange,
  onComplete,
  length = 6,
  alphanumeric = false,
  expected,
  splitAfter,
  isDisabled,
  isRequired,
  className,
  children,
  slots = {},
  slotProps = {},
}: OtpFieldProps) => {
  const field = useOtpField({
    value,
    defaultValue,
    onChange,
    onComplete,
    length,
    alphanumeric,
    expected,
  })

  const split = splitAfter ?? (length % 2 === 0 && length >= 6 ? length / 2 : undefined)

  return (
    <div data-slot="otp-field" className={cn(fieldStyles(), className)}>
      {children ?? (
        <>
          {label && renderSlot(slots.label, { children: label, ...(slotProps.label ?? {}) }, { defaultComponent: Label })}
          {renderSlot(
            slots.otp,
            {
              maxLength: field.state.length,
              value: field.state.value,
              onChange: field.actions.setValue,
              onComplete,
              pattern: field.helpers.pattern,
              inputMode: field.helpers.inputMode,
              autoComplete: field.ariaProps.autoComplete,
              disabled: isDisabled,
              'aria-invalid': field.ariaProps['aria-invalid'],
              children: <OtpSlots length={field.state.length} splitAfter={split} />,
              ...(slotProps.otp ?? {}),
            },
            { defaultComponent: InputOTP }
          )}
          {renderSlot(
            slots.status,
            {
              status: field.state.status,
              message:
                typeof errorMessage === 'string' ? errorMessage : field.helpers.message,
              ...(slotProps.status ?? {}),
            },
            { defaultComponent: OtpFieldStatus }
          )}
          {description && field.state.status !== 'incorrect' &&
            renderSlot(slots.description, { children: description, ...(slotProps.description ?? {}) }, {
              defaultComponent: Description,
            })}
          {field.state.status === 'incorrect' && errorMessage &&
            renderSlot(slots.error, { children: errorMessage, ...(slotProps.error ?? {}) }, { defaultComponent: FieldError })}
          {isRequired && <span className="sr-only">Required</span>}
        </>
      )}
    </div>
  )
}

export const OtpField = createInterfaceComponent<OtpFieldProps, OtpFieldSlots>(
  {
    name: 'OtpField',
    category: 'form',
    description: 'OTP field with configurable length, alphanumeric mode, and correct/incorrect feedback.',
    version: '1.0.0',
    props: {
      length: 6,
      alphanumeric: false,
    },
    slots: {
      label: Label,
      description: Description,
      error: FieldError,
      otp: InputOTP,
      status: OtpFieldStatus,
    },
  },
  OtpFieldPrimitive
)

export const { Context: OtpFieldContext, useCompoundContext: useOtpFieldContext } =
  createCompoundContext<any>('OtpField')

OtpField.Status = OtpFieldStatus
OtpField.Input = InputOTP

Field.OTP = OtpField
