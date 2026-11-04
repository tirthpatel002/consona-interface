import React from 'react'
import {
  Switch as RACSwitch,
  type SwitchProps as RACSwitchProps,
  SwitchButton as RACSwitchButton,
  type SwitchButtonProps as RACSwitchButtonProps,
  SwitchField as RACSwitchField,
  type SwitchFieldProps as RACSwitchFieldProps,
} from 'react-aria-components/Switch'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Label } from '../field'

/* ==========================================================================
   Switch Field & Button Primitives
   ========================================================================== */

export interface SwitchFieldProps extends RACSwitchFieldProps {
  /** Custom CSS classes for the switch field container. */
  className?: string
}

const SwitchFieldPrimitive = ({ className, ...props }: SwitchFieldProps) => {
  return (
    <RACSwitchField
      {...props}
      data-slot="control"
      className={cn('has-[[slot=description]]:**:data-[slot=control-label]:font-medium', className)}
      style={({ defaultStyle }) => ({
        ...defaultStyle,
        WebkitTapHighlightColor: 'transparent',
      })}
    />
  )
}

export const SwitchField = createInterfaceComponent<SwitchFieldProps>(
  {
    name: 'SwitchField',
    category: 'form',
    description: 'Form field container combining switch control, label, and description.',
    version: '1.0.0',
  },
  SwitchFieldPrimitive
)

export interface SwitchButtonProps extends RACSwitchButtonProps {
  /** Custom CSS classes for the grid layout switch button. */
  className?: string
}

const SwitchButtonPrimitive = ({ children, className, ...props }: SwitchButtonProps) => {
  return (
    <RACSwitchButton
      className={cn(
        'group relative grid cursor-pointer gap-x-space-lg gap-y-space-xs ltr:grid-cols-[1fr_auto] rtl:grid-cols-[auto_1fr]',
        '*:data-[slot=control-label]:row-start-1 ltr:*:data-[slot=control-label]:col-start-1 rtl:*:data-[slot=control-label]:col-start-2',
        '*:[[slot=description]]:row-start-2 ltr:*:[[slot=description]]:col-start-1 rtl:*:[[slot=description]]:col-start-2',
        'disabled:opacity-50',
        className
      )}
      {...props}
    >
      {(values) => (
        <>
          <span
            data-slot="indicator"
            className={cn(
              'relative isolate inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-space-2xs',
              'transition-colors duration-200 ease-in-out',
              'border border-input bg-input/40',
              values.isHovered && 'border-muted-fg/40',
              values.isFocusVisible && 'border-ring ring-2 ring-ring/20',
              values.isSelected && 'border-primary bg-primary',
              values.isDisabled && 'opacity-60 cursor-not-allowed'
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none block size-3.5 shrink-0 rounded-full border border-transparent bg-bg shadow-xs transition-transform duration-200 ease-in-out',
                values.isSelected
                  ? 'bg-primary-fg shadow-none ltr:translate-x-4 rtl:-translate-x-4'
                  : 'ltr:translate-x-0 rtl:translate-x-0'
              )}
            />
          </span>
          {typeof children === 'function' ? (
            children(values)
          ) : typeof children === 'string' ? (
            <Label elementType="span" data-slot="control-label">
              {children}
            </Label>
          ) : (
            children
          )}
        </>
      )}
    </RACSwitchButton>
  )
}

export const SwitchButton = createInterfaceComponent<SwitchButtonProps>(
  {
    name: 'SwitchButton',
    category: 'form',
    description: 'Grid layout button combining switch indicator with label and description.',
    version: '1.0.0',
  },
  SwitchButtonPrimitive
)

/* ==========================================================================
   Switch Primitive & Slots
   ========================================================================== */

export interface SwitchSlots {
  /** Custom interactive sliding thumb indicator slot. */
  thumb?: React.ComponentType<{ isSelected?: boolean }>
}

export interface SwitchProps extends Omit<RACSwitchProps, 'children'> {
  /** Explicit children composition or render function. */
  children?: React.ReactNode | ((values: any) => React.ReactNode)
  /** Custom CSS classes for the switch control. */
  className?: string
  /** Optional DOM ref attached to the label wrapper element. */
  ref?: React.Ref<HTMLLabelElement>
  /** Injected slot component overrides. */
  slots?: SlotComponents<SwitchSlots>
  /** Property overrides passed down to injected slots. */
  slotProps?: SlotPropsMap<SwitchSlots>
}

const SwitchComponent = ({
  children,
  className,
  ref,
  slots,
  slotProps,
  ...props
}: SwitchProps) => {
  return (
    <RACSwitch
      ref={ref as any}
      data-slot="switch"
      className={cn(
        'group relative inline-flex items-center cursor-pointer gap-x-space-md select-none',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    >
      {(values) => (
        <>
          <span
            data-slot="indicator"
            className={cn(
              'relative isolate inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-space-2xs',
              'transition-colors duration-200 ease-in-out',
              'border border-input bg-input/40',
              values.isHovered && 'border-muted-fg/40',
              values.isFocusVisible && 'border-ring ring-2 ring-ring/20',
              values.isSelected && 'border-primary bg-primary',
              values.isDisabled && 'opacity-60 cursor-not-allowed'
            )}
          >
            {slots?.thumb ? (
              renderSlot(slots.thumb, { isSelected: values.isSelected, ...slotProps?.thumb })
            ) : (
              <span
                aria-hidden="true"
                className={cn(
                  'pointer-events-none block size-3.5 shrink-0 rounded-full border border-transparent bg-bg shadow-xs transition-transform duration-200 ease-in-out',
                  values.isSelected
                    ? 'bg-primary-fg shadow-none ltr:translate-x-4 rtl:-translate-x-4'
                    : 'ltr:translate-x-0 rtl:translate-x-0'
                )}
              />
            )}
          </span>
          {typeof children === 'function' ? (
            children(values)
          ) : typeof children === 'string' ? (
            <span data-slot="control-label" className="text-sm font-medium text-fg">
              {children}
            </span>
          ) : (
            children
          )}
        </>
      )}
    </RACSwitch>
  )
}

export const Switch = createInterfaceComponent<SwitchProps, SwitchSlots>(
  {
    name: 'Switch',
    category: 'form',
    description: 'Accessible toggle switch control with smooth sliding physics and optical pill curvature.',
    version: '1.0.0',
    slots: {
      thumb: undefined,
    },
  },
  SwitchComponent
)

// Namespace attachments for compound family ergonomics
Switch.Field = SwitchField
Switch.Button = SwitchButton

export const { Context: SwitchContext, useCompoundContext: useSwitchContext } =
  createCompoundContext<any>('Switch')
