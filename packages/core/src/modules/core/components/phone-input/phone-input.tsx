import React from 'react'
import { PhoneIcon } from '@heroicons/react/24/outline'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Input, InputGroup, type InputProps } from '../input'

export interface PhoneInputSlots {
  /** Leading phone icon used when no country trigger is provided. */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Country picker trigger rendered ahead of the national-number input. */
  country?: React.ComponentType<React.HTMLAttributes<HTMLElement>>
}

export interface PhoneInputProps extends Omit<InputProps, 'type' | 'slots' | 'slotProps'> {
  /** Optional country-trigger node. Prefer `slots.country` for replacement. */
  countryTrigger?: React.ReactNode
  /** Whether the national number is invalid. */
  isInvalid?: boolean
  /** Slot overrides for icon and country trigger. */
  slots?: SlotComponents<PhoneInputSlots>
  /** Props forwarded to injected slots. */
  slotProps?: SlotPropsMap<PhoneInputSlots>
}

const PhoneInputPrimitive = ({
  className,
  countryTrigger,
  slots = {},
  slotProps = {},
  autoComplete = 'tel-national',
  inputMode = 'tel',
  isInvalid,
  ...props
}: PhoneInputProps) => {
  const country = countryTrigger ?? renderSlot(slots.country, slotProps.country ?? {})

  if (country) {
    return (
      <div data-slot="control" className="flex w-full min-w-0 items-stretch">
        <div data-slot="phone-country" className="flex shrink-0 items-stretch">
          {country}
        </div>
        <div className="min-w-0 flex-1 -ms-px">
          <Input
            type="tel"
            inputMode={inputMode}
            autoComplete={autoComplete}
            data-slot="phone-input"
            className={cn('rounded-s-none', className)}
            aria-invalid={isInvalid || undefined}
            {...props}
          />
        </div>
      </div>
    )
  }

  return (
    <InputGroup>
      <span data-slot="icon" className="text-muted-fg">
        {renderSlot(slots.icon, { className: 'size-4', ...(slotProps.icon ?? {}) }, { defaultComponent: PhoneIcon })}
      </span>
      <Input
        type="tel"
        inputMode={inputMode}
        autoComplete={autoComplete}
        data-slot="phone-input"
        className={className}
        aria-invalid={isInvalid || undefined}
        {...props}
      />
    </InputGroup>
  )
}

export const PhoneInput = createInterfaceComponent<PhoneInputProps, PhoneInputSlots>(
  {
    name: 'PhoneInput',
    category: 'form',
    description: 'Telephone input atom with a leading country-trigger slot or phone icon.',
    version: '1.0.0',
    slots: {
      icon: PhoneIcon,
      country: undefined,
    },
  },
  PhoneInputPrimitive
)

Input.Phone = PhoneInput
