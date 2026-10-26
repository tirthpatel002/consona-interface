import React from 'react'
import { EnvelopeIcon } from '@heroicons/react/24/outline'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Input, InputGroup, type InputProps } from '../input'

export interface EmailInputSlots {
  /** Leading envelope icon slot. */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface EmailInputProps extends Omit<InputProps, 'type' | 'slots' | 'slotProps'> {
  /** Slot overrides for the leading icon. */
  slots?: SlotComponents<EmailInputSlots>
  /** Props forwarded to injected slots. */
  slotProps?: SlotPropsMap<EmailInputSlots>
}

const EmailInputPrimitive = ({
  className,
  slots = {},
  slotProps = {},
  autoComplete = 'email',
  inputMode = 'email',
  ...props
}: EmailInputProps) => {
  return (
    <InputGroup>
      <span data-slot="icon" className="text-muted-fg">
        {renderSlot(slots.icon, { className: 'size-4', ...(slotProps.icon ?? {}) }, { defaultComponent: EnvelopeIcon })}
      </span>
      <Input
        type="email"
        inputMode={inputMode}
        autoComplete={autoComplete}
        data-slot="email-input"
        className={className}
        {...props}
      />
    </InputGroup>
  )
}

export const EmailInput = createInterfaceComponent<EmailInputProps, EmailInputSlots>(
  {
    name: 'EmailInput',
    category: 'form',
    description: 'Single-line email input atom with a leading envelope icon.',
    version: '1.0.0',
    slots: {
      icon: EnvelopeIcon,
    },
  },
  EmailInputPrimitive
)

Input.Email = EmailInput
