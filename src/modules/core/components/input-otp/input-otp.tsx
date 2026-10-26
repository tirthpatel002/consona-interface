import React, { use } from 'react'
import { MinusIcon } from '@heroicons/react/24/outline'
import { OTPInput, OTPInputContext } from 'input-otp'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { fieldStyles, Label, type LabelProps } from '../field'
import { Input } from '../input'

export interface InputOTPSlots {
  /** Separator glyph between OTP groups. */
  separator?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface InputOTPProps {
  /** Maximum number of OTP characters. */
  maxLength: number
  /** Controlled OTP value. */
  value?: string
  /** Called when the OTP value changes. */
  onChange?: (newValue: string) => void
  /** Called when every slot is filled. */
  onComplete?: (value: string) => void
  /** Character class pattern forwarded to the hidden input. */
  pattern?: string
  /** Virtual keyboard hint. */
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  /** Autocomplete token. */
  autoComplete?: string
  /** Whether the hidden input is disabled. */
  disabled?: boolean
  /** Accessible name. */
  'aria-label'?: string
  /** Invalid state reflected on active slots. */
  'aria-invalid'?: boolean | 'true' | 'false'
  /** Additional classes on the hidden input. */
  className?: string
  /** Additional classes on the OTP container. */
  containerClassName?: string
  /** Slot cells rendered as children of the OTP host. */
  children: React.ReactNode
  /** Slot overrides for the default separator glyph. */
  slots?: SlotComponents<InputOTPSlots>
  /** Props forwarded to injected slots. */
  slotProps?: SlotPropsMap<InputOTPSlots>
}

const InputOTPPrimitive = ({ containerClassName, slots, slotProps, ...props }: InputOTPProps) => {
  void slots
  void slotProps
  return (
    <span data-slot="control" className="relative block">
      <OTPInput
        data-slot="input-otp"
        containerClassName={cn(fieldStyles({ className: 'has-[:disabled]:opacity-50' }), containerClassName)}
        {...props}
      />
    </span>
  )
}

export const InputOTP = createInterfaceComponent<InputOTPProps, InputOTPSlots>(
  {
    name: 'InputOTP',
    category: 'form',
    description: 'Hidden OTP input host that drives grouped character slots and caret state.',
    version: '1.0.0',
    slots: {
      separator: MinusIcon,
    },
  },
  InputOTPPrimitive
)

export interface InputOTPControlProps extends React.ComponentPropsWithoutRef<'span'> {
  /** Additional classes on the control row. */
  className?: string
}

const InputOTPControlPrimitive = ({ className, ...props }: InputOTPControlProps) => {
  return (
    <span
      data-slot="control"
      className={cn('flex items-center gap-space-sm has-disabled:opacity-50', className)}
      {...props}
    />
  )
}

export const InputOTPControl = createInterfaceComponent<InputOTPControlProps>(
  {
    name: 'InputOTPControl',
    category: 'form',
    description: 'Horizontal OTP control row wrapping slot groups and separators.',
    version: '1.0.0',
  },
  InputOTPControlPrimitive
)

export interface InputOTPGroupProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Additional classes on the slot group. */
  className?: string
}

const InputOTPGroupPrimitive = ({ className, ...props }: InputOTPGroupProps) => {
  return <div data-slot="input-otp-group" className={cn('flex items-center', className)} {...props} />
}

export const InputOTPGroup = createInterfaceComponent<InputOTPGroupProps>(
  {
    name: 'InputOTPGroup',
    category: 'form',
    description: 'Joined cluster of adjacent OTP character slots.',
    version: '1.0.0',
  },
  InputOTPGroupPrimitive
)

export interface InputOTPSlotProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Zero-based slot index into the OTP context. */
  index: number
}

const InputOTPSlotPrimitive = ({ index, className, ...props }: InputOTPSlotProps) => {
  const otp = use(OTPInputContext)
  const { char, hasFakeCaret, isActive } = otp?.slots[index] ?? {}

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        'relative flex size-9 items-center justify-center border-input border-y border-r shadow-xs outline-none transition-all',
        'first:rounded-s-base first:border-l last:rounded-e-base',
        'aria-invalid:border-danger data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:bg-primary-subtle/10',
        'data-[active=true]:ring-2 data-[active=true]:ring-ring/20',
        'data-[active=true]:aria-invalid:border-danger data-[active=true]:aria-invalid:ring-danger/20',
        'sm:text-sm/6',
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-fg duration-1000" />
        </div>
      )}
    </div>
  )
}

export const InputOTPSlot = createInterfaceComponent<InputOTPSlotProps>(
  {
    name: 'InputOTPSlot',
    category: 'form',
    description: 'Single OTP character cell with fake caret and active-ring states.',
    version: '1.0.0',
  },
  InputOTPSlotPrimitive
)

export interface InputOTPSeparatorProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Slot overrides for the separator glyph. */
  slots?: SlotComponents<InputOTPSlots>
  /** Props forwarded to the separator glyph. */
  slotProps?: SlotPropsMap<InputOTPSlots>
}

const InputOTPSeparatorPrimitive = ({ slots = {}, slotProps = {}, ...props }: InputOTPSeparatorProps) => {
  return (
    <div data-slot="input-otp-separator" {...props}>
      {renderSlot(slots.separator, { className: 'size-4', ...(slotProps.separator ?? {}) }, { defaultComponent: MinusIcon })}
    </div>
  )
}

export const InputOTPSeparator = createInterfaceComponent<InputOTPSeparatorProps, InputOTPSlots>(
  {
    name: 'InputOTPSeparator',
    category: 'form',
    description: 'Visual divider between OTP slot groups.',
    version: '1.0.0',
    slots: {
      separator: MinusIcon,
    },
  },
  InputOTPSeparatorPrimitive
)

export interface InputOTPLabelProps extends LabelProps {}

const InputOTPLabelPrimitive = (props: InputOTPLabelProps) => {
  return <Label elementType="span" data-slot="control-label" {...props} />
}

export const InputOTPLabel = createInterfaceComponent<InputOTPLabelProps>(
  {
    name: 'InputOTPLabel',
    category: 'form',
    description: 'Accessible label associated with an OTP control.',
    version: '1.0.0',
  },
  InputOTPLabelPrimitive
)

InputOTP.Control = InputOTPControl
InputOTP.Group = InputOTPGroup
InputOTP.Slot = InputOTPSlot
InputOTP.Separator = InputOTPSeparator
InputOTP.Label = InputOTPLabel

Input.OTP = InputOTP

export const { Context: InputOTPContext, useCompoundContext: useInputOTPContext } =
  createCompoundContext<any>('InputOTP')
