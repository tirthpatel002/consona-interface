import React, { useState } from 'react'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Button, type ButtonProps } from '../button'

/* ==========================================================================
   Note Styles & Ramps
   ========================================================================== */

export const noteStyles = tv({
  base: [
    'relative grid w-full items-start overflow-hidden',
    'rounded-macro border border-current/15 p-space-lg text-base/6 backdrop-blur-2xl sm:text-sm/6',
    '*:[a]:hover:underline **:[strong]:font-medium',
  ],
  variants: {
    intent: {
      info: 'bg-info-subtle text-info-subtle-fg **:[.text-muted-fg]:text-info-subtle-fg/70',
      success: 'bg-success-subtle text-success-subtle-fg **:[.text-muted-fg]:text-success-subtle-fg/80',
      warning: 'bg-warning-subtle text-warning-subtle-fg **:[.text-muted-fg]:text-warning-subtle-fg/80',
      danger: 'bg-danger-subtle text-danger-subtle-fg **:[.text-muted-fg]:text-danger-subtle-fg/80',
      neutral: 'bg-muted/50 text-secondary-fg',
    },
  },
  defaultVariants: {
    intent: 'info',
  },
})

export const noteIndicatorStyles = tv({
  base: 'me-space-md grid size-8 place-content-center rounded-full border-2',
  variants: {
    intent: {
      info: 'border-info-subtle-fg/40',
      success: 'border-success-subtle-fg/40',
      warning: 'border-warning-subtle-fg/40',
      danger: 'border-danger-subtle-fg/40',
      neutral: 'border-muted-fg/30',
    },
  },
})

export const noteIndicatorInnerStyles = tv({
  base: 'grid size-6 place-content-center rounded-full border-2',
  variants: {
    intent: {
      info: 'border-info-subtle-fg/85',
      success: 'border-success-subtle-fg/85',
      warning: 'border-warning-subtle-fg/85',
      danger: 'border-danger-subtle-fg/85',
      neutral: 'border-muted-fg/60',
    },
  },
})

const DEFAULT_ICONS: Record<NoteIntent, React.ComponentType<React.SVGProps<SVGSVGElement>> | null> = {
  info: InformationCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationCircleIcon,
  danger: ExclamationCircleIcon,
  neutral: null,
}

/* ==========================================================================
   Note Slots & Props
   ========================================================================== */

export type NoteIntent = 'info' | 'success' | 'warning' | 'danger' | 'neutral'

export interface NoteIconSlotProps extends React.SVGProps<SVGSVGElement> {
  /** Active semantic intent of the parent note. */
  intent?: NoteIntent
}

export interface NoteCloseSlotProps extends ButtonProps {
  /** Dismisses the note when pressed. */
  onPress?: () => void
}

export interface NoteSlots {
  /** Leading concentric status icon. */
  icon?: React.ComponentType<NoteIconSlotProps>
  /** Trailing dismiss control. */
  close?: React.ComponentType<NoteCloseSlotProps>
}

export interface NoteProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof noteStyles> {
  /** Semantic status ramp: info, success, warning, danger, neutral. */
  intent?: NoteIntent
  /** Whether the concentric status indicator is shown. */
  indicator?: boolean
  /** Whether a close trigger is rendered. */
  isDismissible?: boolean
  /** Called when the note is dismissed. */
  onDismiss?: () => void
  /** Shorthand icon node rendered instead of the default intent icon. */
  icon?: React.ReactNode
  /** Optional DOM ref attached to the note root. */
  ref?: React.Ref<HTMLDivElement>
  /** Slot overrides for icon and close trigger. */
  slots?: SlotComponents<NoteSlots>
  /** Props passed into injected slots. */
  slotProps?: SlotPropsMap<NoteSlots>
}

const NoteDefaultCloseButton = ({ children: _c, ...closeProps }: NoteCloseSlotProps) => (
  <Button {...closeProps}>
    <XMarkIcon data-slot="icon" className="size-4" />
  </Button>
)

const NotePrimitive = ({
  intent = 'info',
  indicator = true,
  isDismissible = false,
  onDismiss,
  icon,
  className,
  slots,
  slotProps,
  children,
  ref,
  ...props
}: NoteProps) => {
  const [isVisible, setIsVisible] = useState(true)
  if (!isVisible) return null

  const dismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  const DefaultIcon = DEFAULT_ICONS[intent]
  const showIndicator = indicator && (Boolean(icon) || Boolean(slots?.icon) || Boolean(DefaultIcon))

  return (
    <div
      ref={ref}
      role="status"
      data-slot="note"
      data-intent={intent}
      className={cn(
        noteStyles({ intent }),
        isDismissible ? 'grid-cols-[auto_1fr_auto]' : 'grid-cols-[auto_1fr]',
        className
      )}
      {...props}
    >
      {showIndicator ? (
        <div data-slot="note-indicator" className={noteIndicatorStyles({ intent })}>
          <div className={noteIndicatorInnerStyles({ intent })}>
            {icon ? (
              <span data-slot="icon" className="grid place-content-center *:size-5">
                {icon}
              </span>
            ) : (
              renderSlot(
                slots?.icon,
                { className: 'size-5 shrink-0', ...(slotProps?.icon as object) },
                { defaultComponent: DefaultIcon ?? undefined }
              )
            )}
          </div>
        </div>
      ) : (
        <span />
      )}

      <div data-slot="note-body" className="min-w-0 text-pretty">
        {children}
      </div>

      {isDismissible && (
        <div className="ms-space-sm -me-space-xs -mt-space-xs">
          {renderSlot(
            slots?.close,
            {
              size: 'sq-xs',
              intent: 'plain',
              'aria-label': 'Dismiss',
              onPress: dismiss,
              className: 'text-current/70 hover:text-current',
              ...(slotProps?.close as object),
            },
            {
              defaultComponent: NoteDefaultCloseButton,
            }
          )}
        </div>
      )}
    </div>
  )
}

export const Note = createInterfaceComponent<NoteProps, NoteSlots>(
  {
    name: 'Note',
    category: 'feedback',
    description: 'Visual status alert with concentric intent indicators, optional close trigger, and optical macro radius.',
    version: '1.0.0',
    props: {
      intent: 'info',
      indicator: true,
      isDismissible: false,
    },
    slots: {
      icon: undefined,
      close: undefined,
    },
  },
  NotePrimitive
)

export const { Context: NoteContext, useCompoundContext: useNoteContext } =
  createCompoundContext<any>('Note')

export const Alert = Note.extend({
  name: 'Alert',
  props: {
    intent: 'warning',
  },
})
export interface AlertProps extends NoteProps {}

export const Callout = Note.extend({
  name: 'Callout',
  props: {
    intent: 'neutral',
  },
})
export interface CalloutProps extends NoteProps {}

Note.Alert = Alert
Note.Callout = Callout
