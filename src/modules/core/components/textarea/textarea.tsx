import React from 'react'
import {
  TextArea as RACTextArea,
  type TextAreaProps as RACTextAreaProps,
} from 'react-aria-components/TextArea'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'

/* ==========================================================================
   TextArea Slot Definitions
   ========================================================================== */

export interface TextAreaCharCountSlotProps {
  /** Current character count. */
  count?: number
  /** Maximum allowed length when a cap is set. */
  maxLength?: number
}

export interface TextAreaFooterSlotProps {
  /** Additional CSS class names for the footer bar. */
  className?: string
}

export interface TextAreaSlots {
  /** Character count indicator slot positioned below the textarea. */
  charCount?: React.ComponentType<TextAreaCharCountSlotProps>
  /** Custom auxiliary footer bar rendered beneath the text area. */
  footer?: React.ComponentType<TextAreaFooterSlotProps>
}

export interface TextAreaProps extends Omit<RACTextAreaProps, 'children'> {
  /** Explicit children composition or render function. */
  children?: React.ReactNode | ((values: any) => React.ReactNode)
  /** Optional DOM ref attached to the textarea element. */
  ref?: React.Ref<HTMLTextAreaElement>
  /** Whether the textarea control is disabled. */
  isDisabled?: boolean
  /** Slot overrides map for injecting custom character count or footer components. */
  slots?: SlotComponents<TextAreaSlots>
  /** Granular property overrides passed down to injected slots. */
  slotProps?: SlotPropsMap<TextAreaSlots>
}

const TextAreaComponent = ({
  className,
  ref,
  slots,
  slotProps,
  isDisabled,
  disabled = isDisabled,
  children,
  ...props
}: TextAreaProps) => {
  return (
    <span data-slot="control" className="relative block w-full">
      <RACTextArea
        ref={ref}
        disabled={disabled}
        data-slot="textarea"
        className={cn(
          'field-sizing-content relative block min-h-20 w-full appearance-none rounded-base bg-bg px-3.5 py-2.5 sm:px-space-md sm:py-space-sm',
          'text-base/6 text-fg placeholder:text-muted-fg sm:text-sm/6',
          'border border-input transition-colors enabled:hover:border-muted-fg/40',
          'outline-hidden focus:border-ring focus:ring-2 focus:ring-ring/20',
          'invalid:border-danger focus:invalid:border-danger focus:invalid:ring-danger/20',
          'disabled:bg-muted disabled:opacity-60 disabled:cursor-not-allowed',
          'dark:scheme-dark',
          className
        )}
        {...props}
      />
      {slots?.charCount && renderSlot(slots.charCount, slotProps?.charCount)}
      {slots?.footer && renderSlot(slots.footer, slotProps?.footer)}
    </span>
  )
}

export const TextArea = createInterfaceComponent<TextAreaProps, TextAreaSlots>(
  {
    name: 'TextArea',
    category: 'form',
    description: 'Accessible multiline text input with optical radius and auto content sizing.',
    version: '1.0.0',
    slots: {
      charCount: undefined,
      footer: undefined,
    },
  },
  TextAreaComponent
)

/** Alias for TextArea */
export const Textarea = TextArea
export interface TextareaProps extends TextAreaProps {}

// Namespace attachments for compound family ergonomics
TextArea.Textarea = Textarea

