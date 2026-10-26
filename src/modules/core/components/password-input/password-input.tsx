import React from 'react'
import { EyeIcon, EyeSlashIcon, KeyIcon } from '@heroicons/react/24/outline'
import { Button as RACButton } from 'react-aria-components'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { useControllableState } from '../../../../core/hooks'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Input, InputGroup, type InputProps } from '../input'

export interface PasswordInputSlots {
  /** Leading key icon slot. */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Icon shown when the password is hidden. */
  revealIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Icon shown when the password is visible. */
  hideIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface PasswordInputProps extends Omit<InputProps, 'type' | 'slots' | 'slotProps'> {
  /** Whether the trailing hide/show control is rendered. Owned visually by the input atom; Field products turn it on. */
  isRevealable?: boolean
  /** Controlled plaintext reveal state. */
  isRevealed?: boolean
  /** Uncontrolled initial reveal state. */
  defaultRevealed?: boolean
  /** Called when hide/show toggles. */
  onRevealChange?: (revealed: boolean) => void
  /** Slot overrides for icons. */
  slots?: SlotComponents<PasswordInputSlots>
  /** Props forwarded to injected slots. */
  slotProps?: SlotPropsMap<PasswordInputSlots>
}

const PasswordInputPrimitive = ({
  className,
  isRevealable = false,
  isRevealed: revealedProp,
  defaultRevealed = false,
  onRevealChange,
  slots = {},
  slotProps = {},
  autoComplete = 'current-password',
  ...props
}: PasswordInputProps) => {
  const [isRevealed, setRevealed] = useControllableState({
    prop: revealedProp,
    defaultProp: defaultRevealed,
    onChange: onRevealChange,
  })

  return (
    <InputGroup>
      <span data-slot="icon" className="text-muted-fg">
        {renderSlot(slots.icon, { className: 'size-4', ...(slotProps.icon ?? {}) }, { defaultComponent: KeyIcon })}
      </span>
      <Input
        type={isRevealed ? 'text' : 'password'}
        autoComplete={autoComplete}
        spellCheck={false}
        data-slot="password-input"
        className={className}
        {...props}
      />
      {isRevealable && (
        <RACButton
          type="button"
          data-slot="password-reveal"
          aria-label={isRevealed ? 'Hide password' : 'Show password'}
          aria-pressed={isRevealed}
          className={cn(
            'inline-flex items-center justify-center px-space-md text-muted-fg hover:text-fg',
            'rounded-e-base outline-none focus-visible:ring-2 focus-visible:ring-ring/40'
          )}
          onPress={() => setRevealed(!isRevealed)}
        >
          {isRevealed
            ? renderSlot(slots.hideIcon, { className: 'size-4', ...(slotProps.hideIcon ?? {}) }, { defaultComponent: EyeSlashIcon })
            : renderSlot(slots.revealIcon, { className: 'size-4', ...(slotProps.revealIcon ?? {}) }, { defaultComponent: EyeIcon })}
        </RACButton>
      )}
    </InputGroup>
  )
}

export const PasswordInput = createInterfaceComponent<PasswordInputProps, PasswordInputSlots>(
  {
    name: 'PasswordInput',
    category: 'form',
    description: 'Password input atom with optional hide/show toggle and key icon.',
    version: '1.0.0',
    props: {
      isRevealable: false,
      defaultRevealed: false,
    },
    slots: {
      icon: KeyIcon,
      revealIcon: EyeIcon,
      hideIcon: EyeSlashIcon,
    },
  },
  PasswordInputPrimitive
)

Input.Password = PasswordInput
