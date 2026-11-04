import React from 'react'
import { Keyboard as RACKeyboard } from 'react-aria-components/Keyboard'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'

export interface KbdProps extends React.ComponentPropsWithoutRef<typeof RACKeyboard> {
  /** Optional DOM ref attached to the keyboard shortcut container element. */
  ref?: React.Ref<HTMLElement>
  /** Custom CSS classes for styling adjustments. */
  className?: string
  /** Keyboard shortcut key combination text. */
  children?: React.ReactNode
}

const KbdPrimitive = ({ className, ref, ...props }: KbdProps) => {
  return (
    <RACKeyboard
      ref={ref as any}
      data-slot="kbd"
      className={cn(
        'inline-flex items-center justify-center font-mono text-[0.75rem] font-medium leading-none',
        'px-1.5 py-space-2xs rounded-atom border border-border bg-muted text-muted-fg',
        'group-hover:text-fg group-focus:text-fg group-disabled:opacity-50',
        'forced-colors:group-focus:text-[HighlightText]',
        className
      )}
      {...props}
    />
  )
}

export const Kbd = createInterfaceComponent<KbdProps>(
  {
    name: 'Kbd',
    category: 'typography',
    description: 'Monospace keyboard shortcut indicator with optical atom radius and subtle elevation.',
    version: '1.0.0',
  },
  KbdPrimitive
)

/** Alias for Kbd */
export const Keyboard = Kbd
export interface KeyboardProps extends KbdProps {}

// Namespace attachments for compound family ergonomics
Kbd.Keyboard = Keyboard

