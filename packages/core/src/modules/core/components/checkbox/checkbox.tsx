import React from 'react'
import { CheckIcon, MinusIcon } from '@heroicons/react/20/solid'
import {
  Checkbox as RACCheckbox,
  type CheckboxProps as RACCheckboxProps,
  CheckboxGroup as RACCheckboxGroup,
  type CheckboxGroupProps as RACCheckboxGroupProps,
  CheckboxField as RACCheckboxField,
  type CheckboxFieldProps as RACCheckboxFieldProps,
  composeRenderProps,
} from 'react-aria-components'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'

/* ==========================================================================
   Checkbox Group & Field
   ========================================================================== */

export interface CheckboxGroupProps extends RACCheckboxGroupProps {
  /** Custom CSS classes for the checkbox group container. */
  className?: string
}

const CheckboxGroupPrimitive = ({ className, ...props }: CheckboxGroupProps) => {
  return (
    <RACCheckboxGroup
      {...props}
      data-slot="control"
      className={cn(
        'space-y-space-md has-[[slot=description]]:not-has-[[slot=errorMessage]]:space-y-5 *:data-[slot=label]:font-medium',
        className
      )}
    />
  )
}

export const CheckboxGroup = createInterfaceComponent<CheckboxGroupProps>(
  {
    name: 'CheckboxGroup',
    category: 'form',
    description: 'Accessible group container for multiple related checkboxes.',
    version: '1.0.0',
  },
  CheckboxGroupPrimitive
)

export interface CheckboxFieldProps extends RACCheckboxFieldProps {
  /** Custom CSS classes for the checkbox field grid layout. */
  className?: string
}

const CheckboxFieldPrimitive = ({ className, slot, ...props }: CheckboxFieldProps) => {
  const isSelection = slot === 'selection'
  return (
    <RACCheckboxField
      data-slot="control"
      slot={slot}
      {...props}
      className={cn(
        isSelection
          ? 'flex items-center justify-center'
          : [
              'grid grid-cols-[1.125rem_1fr] gap-x-space-md gap-y-space-xs sm:grid-cols-[1rem_1fr]',
              '*:data-[slot=control]:col-start-1 *:data-[slot=control]:row-start-1 *:data-[slot=control]:mt-space-2xs sm:*:data-[slot=control]:mt-space-2xs',
              '*:[[slot=errorMessage]]:col-span-full',
              '**:data-[slot=control-label]:col-start-2 **:data-[slot=control-label]:row-start-1',
              '*:[[slot=description]]:col-start-2 *:[[slot=description]]:row-start-2',
              'has-[[slot=description]]:**:data-[slot=control-label]:font-medium',
            ],
        className
      )}
    />
  )
}

export const CheckboxField = createInterfaceComponent<CheckboxFieldProps>(
  {
    name: 'CheckboxField',
    category: 'form',
    description: 'Grid layout container combining checkbox indicator with label and description.',
    version: '1.0.0',
  },
  CheckboxFieldPrimitive
)

/* ==========================================================================
   Checkbox Primitive & Slots
   ========================================================================== */

export interface CheckboxSlots {
  /** Custom check mark icon slot rendered when selected. */
  checkIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Custom minus/dash icon slot rendered when indeterminate. */
  minusIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface CheckboxProps extends Omit<RACCheckboxProps, 'children'> {
  /** Optional DOM ref attached to the label wrapper element. */
  ref?: React.Ref<HTMLLabelElement>
  /** Slot overrides map for customizing check mark or indeterminate minus icons. */
  slots?: SlotComponents<CheckboxSlots>
  /** Property overrides passed down to injected slots. */
  slotProps?: SlotPropsMap<CheckboxSlots>
  /** Checkbox label content or dynamic render function. */
  children?: React.ReactNode | ((values: any) => React.ReactNode)
}

const CheckboxComponent = ({
  className,
  ref,
  slots,
  slotProps,
  ...props
}: CheckboxProps) => {
  return (
    <RACCheckbox
      ref={ref as any}
      data-slot="checkbox"
      className={cn('group inline-flex cursor-pointer col-span-full gap-x-space-md focus:outline-hidden select-none', className)}
      {...props}
    >
      {composeRenderProps(
        props.children,
        (children, { isSelected, isIndeterminate, isInvalid }) => {
          const indicator = isIndeterminate ? (
            renderSlot(slots?.minusIcon, { 'data-slot': 'check-indicator', ...(slotProps?.minusIcon as any) }, { defaultComponent: MinusIcon })
          ) : isSelected ? (
            renderSlot(slots?.checkIcon, { 'data-slot': 'check-indicator', ...(slotProps?.checkIcon as any) }, { defaultComponent: CheckIcon })
          ) : null

          return (
            <div
              className={cn(
                children
                  ? 'grid grid-cols-[1.125rem_1fr] items-center gap-x-space-md gap-y-space-xs sm:grid-cols-[1rem_1fr]'
                  : 'flex items-center justify-center'
              )}
            >
              <span
                data-slot="indicator"
                className={cn([
                  'col-start-1 row-start-1 relative isolate flex shrink-0 items-center justify-center rounded-atom border border-input bg-bg text-bg transition-colors',
                  'group-hover:border-muted-fg/40 group-focus-visible:border-ring group-focus-visible:ring-2 group-focus-visible:ring-ring/20',
                  'size-4.5 *:data-[slot=check-indicator]:size-3.5 sm:size-4 sm:*:data-[slot=check-indicator]:size-3',
                  'in-disabled:bg-muted in-disabled:opacity-60',
                  (isSelected || isIndeterminate) && [
                    'border-primary bg-primary text-primary-fg',
                    'group-invalid:border-danger group-invalid:bg-danger group-invalid:text-danger-fg',
                  ],
                  isInvalid &&
                    'border-danger bg-danger/10 text-danger-fg ring-danger/20 group-hover:border-danger',
                ])}
              >
                {indicator}
              </span>
              {children ? (
                <span
                  className="col-start-2 row-start-1 text-sm font-normal text-fg"
                  data-slot="control-label"
                >
                  {children}
                </span>
              ) : null}
            </div>
          )
        }
      )}
    </RACCheckbox>
  )
}

export const Checkbox = createInterfaceComponent<CheckboxProps, CheckboxSlots>(
  {
    name: 'Checkbox',
    category: 'form',
    description: 'Accessible checkbox control with concentric optical atom radius and intermediate state.',
    version: '1.0.0',
    slots: {
      checkIcon: CheckIcon,
      minusIcon: MinusIcon,
    },
  },
  CheckboxComponent
)

// Namespace attachments for compound family ergonomics
Checkbox.Group = CheckboxGroup
Checkbox.Field = CheckboxField

export const { Context: CheckboxContext, useCompoundContext: useCheckboxContext } =
  createCompoundContext<any>('Checkbox')
