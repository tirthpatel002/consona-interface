import React from 'react'
import {
  DateField as RACDateField,
  type DateFieldProps as RACDateFieldProps,
  DateInput as RACDateInput,
  type DateInputProps as RACDateInputProps,
  DateSegment as RACDateSegment,
  type DateSegmentProps as RACDateSegmentProps,
  type DateValue,
} from 'react-aria-components'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { fieldStyles } from '../field'

/* ==========================================================================
   DateSegment Sub-Component
   ========================================================================== */

export interface DateSegmentProps extends RACDateSegmentProps {
  /** Custom CSS classes for the date segment. */
  className?: string
}

const DateSegmentPrimitive = ({ className, ...props }: DateSegmentProps) => {
  return (
    <RACDateSegment
      data-slot="date-segment"
      className={cn(
        'inline shrink-0 rounded-atom px-1 type-literal:px-0 py-0.5 text-fg tracking-wider caret-transparent outline-none data-placeholder:not-data-focused:text-muted-fg sm:text-sm',
        'focus:bg-primary-subtle focus:text-primary-subtle-fg focus:data-invalid:bg-danger-subtle focus:data-invalid:text-danger-subtle-fg forced-colors:focus:bg-[Highlight] forced-colors:focus:text-[HighlightText]',
        'forced-color-adjust-none forced-colors:text-[ButtonText]',
        'in-disabled:bg-muted disabled:bg-muted forced-colors:disabled:text-[GrayText]',
        className
      )}
      {...props}
    />
  )
}

export const DateSegment = createInterfaceComponent<DateSegmentProps>(
  {
    name: 'DateSegment',
    category: 'form',
    description: 'Individual editable temporal segment inside a date/time input.',
    version: '1.0.0',
  },
  DateSegmentPrimitive
)

/* ==========================================================================
   DateInput Sub-Component & Slots
   ========================================================================== */

export interface DateInputSlots {
  /** Individual date segment component slot. */
  segment?: React.ComponentType<DateSegmentProps>
}

export interface DateInputProps extends Omit<RACDateInputProps, 'children'> {
  /** Custom CSS classes for the segmented date input container. */
  className?: string
  /** Custom segment render function or children. */
  children?: (segment: any) => React.ReactElement
  /** Injected slot component overrides. */
  slots?: SlotComponents<DateInputSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<DateInputSlots>
}

const DateInputPrimitive = ({
  className,
  children,
  slots = {},
  slotProps = {},
  ...props
}: DateInputProps) => {
  return (
    <span data-slot="control" className="relative block">
      <RACDateInput
        data-slot="date-input"
        className={cn(
          'relative block appearance-none rounded-base px-3.5 py-2 sm:px-3 sm:py-1.5',
          'text-base/6 text-fg placeholder:text-muted-fg sm:text-sm/6',
          'bg-bg border border-input transition-colors enabled:hover:border-muted-fg/40',
          'focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 focus-within:outline-none',
          'group-open:border-ring group-open:ring-2 group-open:ring-ring/20',
          'invalid:border-danger focus-within:invalid:border-danger focus-within:invalid:ring-danger/20',
          'disabled:bg-muted disabled:opacity-50 disabled:cursor-not-allowed',
          'dark:scheme-dark',
          className
        )}
        {...props}
      >
        {children ||
          ((segment) =>
            renderSlot(slots.segment, { segment, ...slotProps.segment }, {
              defaultComponent: DateSegment,
            }) as React.ReactElement)}
      </RACDateInput>
    </span>
  )
}

export const DateInput = createInterfaceComponent<DateInputProps, DateInputSlots>(
  {
    name: 'DateInput',
    category: 'form',
    description: 'Segmented input field container rendering date parts with keyboard and stepper control.',
    version: '1.0.0',
    slots: {
      segment: DateSegment,
    },
  },
  DateInputPrimitive
)

/* ==========================================================================
   DateField Root Component & Slots
   ========================================================================== */

export interface DateFieldSlots {
  /** Segmented date input well slot. */
  input?: React.ComponentType<DateInputProps>
  /** Individual date segment item slot. */
  segment?: React.ComponentType<DateSegmentProps>
}

export interface DateFieldProps<T extends DateValue = DateValue>
  extends RACDateFieldProps<T> {
  /** Custom CSS classes for the date field wrapper. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<DateFieldSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<DateFieldSlots>
}

const DateFieldPrimitiveComponent = <T extends DateValue = DateValue>({
  className,
  children,
  slots = {},
  slotProps = {},
  ...props
}: DateFieldProps<T>) => {
  const inputSlots: SlotComponents<DateInputSlots> = {
    segment: slots.segment,
    ...slotProps.input?.slots,
  }

  return (
    <RACDateField
      data-slot="control"
      className={cn(fieldStyles({ className: 'w-fit' }), className)}
      {...props}
    >
      {children ||
        renderSlot(
          slots.input,
          { slots: inputSlots, ...slotProps.input },
          { defaultComponent: DateInput }
        )}
    </RACDateField>
  )
}

export const DateField = createInterfaceComponent<DateFieldProps<any>, DateFieldSlots>(
  {
    name: 'DateField',
    category: 'form',
    description: 'Accessible date input field managing date values without a calendar popover.',
    version: '1.0.0',
    slots: {
      input: DateInput,
      segment: DateSegment,
    },
  },
  DateFieldPrimitiveComponent
)

// Attachments
DateField.Input = DateInput
DateField.Segment = DateSegment
