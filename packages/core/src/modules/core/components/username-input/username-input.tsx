import React from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Input, InputGroup, type InputProps } from '../input'
import type { LoaderProps } from '../loader'
import { Loader } from '../loader'

export interface UsernameAtMarkProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Additional classes on the @ mark. */
  className?: string
  /** Children mark content. */
  children?: React.ReactNode
}

const UsernameAtMarkPrimitive = ({ className, children, ...props }: UsernameAtMarkProps) => {
  return (
    <span
      data-slot="icon"
      aria-hidden="true"
      className={cn('flex items-center justify-center text-sm/5 font-medium text-muted-fg', className)}
      {...props}
    >
      {children != null ? children : '@'}
    </span>
  )
}

export const UsernameAtMark = createInterfaceComponent<UsernameAtMarkProps>(
  {
    name: 'UsernameAtMark',
    category: 'form',
    description: 'Leading @ mark for username inputs.',
    version: '1.0.0',
  },
  UsernameAtMarkPrimitive
)

export interface UsernameInputSlots {
  /** Leading @ mark. Replace with an outlined icon if desired. */
  at?: React.ComponentType<UsernameAtMarkProps>
  /** Loader shown while a parent field checks availability. */
  loader?: React.ComponentType<LoaderProps>
}

export interface UsernameInputProps extends Omit<InputProps, 'type' | 'slots' | 'slotProps'> {
  /** Whether an async availability check is in flight. */
  isChecking?: boolean
  /** Slot overrides for the @ mark and loader. */
  slots?: SlotComponents<UsernameInputSlots>
  /** Props forwarded to injected slots. */
  slotProps?: SlotPropsMap<UsernameInputSlots>
  /** Children elements. */
  children?: React.ReactNode
}

const UsernameInputPrimitive = ({
  className,
  isChecking = false,
  slots = {},
  slotProps = {},
  autoComplete = 'username',
  spellCheck = false,
  ...props
}: UsernameInputProps) => {
  return (
    <InputGroup>
      {isChecking ? (
        <span data-slot="loader" className="text-muted-fg">
          {renderSlot(slots.loader, { size: 'xs', ...(slotProps.loader ?? {}) }, { defaultComponent: Loader })}
        </span>
      ) : (
        renderSlot(slots.at, slotProps.at ?? {}, { defaultComponent: UsernameAtMark })
      )}
      <Input
        type="text"
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={spellCheck}
        data-slot="username-input"
        className={className}
        {...props}
      />
    </InputGroup>
  )
}

export const UsernameInput = createInterfaceComponent<UsernameInputProps, UsernameInputSlots>(
  {
    name: 'UsernameInput',
    category: 'form',
    description: 'Handle input atom with a leading @ mark and optional availability loader.',
    version: '1.0.0',
    props: {
      isChecking: false,
    },
    slots: {
      at: UsernameAtMark,
      loader: Loader,
    },
  },
  UsernameInputPrimitive
)

UsernameInput.At = UsernameAtMark
Input.Username = UsernameInput
