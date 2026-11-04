import React from 'react'
import {
  TimeField as RACTimeField,
  type TimeFieldProps as RACTimeFieldProps,
  type TimeValue,
} from 'react-aria-components'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { CalendarRemaining, type CalendarRemainingProps } from '../calendar/calendar'
import { remainingUntilTime } from '../calendar/remaining'
import { DateInput, DateSegment, type DateInputProps, type DateSegmentProps } from '../date-picker/date-field'
import { fieldStyles } from '../field'
import { nowLocal } from '../../hooks/date-time'

/* ==========================================================================
   TimeField Props & Slots
   ========================================================================== */

export interface TimeFieldSlots {
  /** Injected custom segmented time input well. */
  input?: React.ComponentType<DateInputProps>
  /** Injected custom time segment slot. */
  segment?: React.ComponentType<DateSegmentProps>
  /** Remaining-time caption until `maxValue`. */
  remaining?: React.ComponentType<CalendarRemainingProps>
}

export interface TimeFieldProps<T extends TimeValue = TimeValue>
  extends Omit<RACTimeFieldProps<T>, 'children'> {
  /** Explicit children composition or render function. */
  children?: React.ReactNode | ((values: any) => React.ReactNode)
  /** Custom CSS classes for the time field container. */
  className?: string
  /** Show remaining time from now until `maxValue`. */
  showRemaining?: boolean
  /** Injected slot component overrides. */
  slots?: SlotComponents<TimeFieldSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<TimeFieldSlots>
}

const TimeFieldPrimitiveComponent = <T extends TimeValue = TimeValue>({
  className,
  children,
  showRemaining = false,
  slots = {},
  slotProps = {},
  ...props
}: TimeFieldProps<T>) => {
  const remaining = React.useMemo(() => {
    if (!showRemaining || !props.maxValue) return null
    const current = nowLocal()
    return remainingUntilTime(
      {
        hour: props.maxValue.hour,
        minute: props.maxValue.minute,
        second: props.maxValue.second,
      },
      {
        hour: current.hour,
        minute: current.minute,
        second: current.second,
      }
    )
  }, [showRemaining, props.maxValue])

  const resolvedChildren =
    children == null
      ? renderSlot(
          slots.input,
          {
            slots: { segment: slots.segment, ...slotProps.input?.slots },
            slotProps: slotProps.input?.slotProps,
            ...slotProps.input,
          },
          { defaultComponent: DateInput }
        )
      : children

  return (
    <RACTimeField
      data-slot="control"
      className={cn(fieldStyles({ className: 'w-fit' }), className)}
      {...props}
      children={
        <>
          {resolvedChildren as React.ReactNode}
          {showRemaining &&
            renderSlot(
              slots.remaining,
              { remaining, ...slotProps.remaining },
              { defaultComponent: CalendarRemaining }
            )}
        </>
      }
    />
  )
}

export const TimeField = createInterfaceComponent<TimeFieldProps<any>, TimeFieldSlots>(
  {
    name: 'TimeField',
    category: 'form',
    description: 'Segmented temporal input for hours, minutes, seconds, and AM/PM with keyboard incrementing.',
    version: '1.0.0',
    slots: {
      input: DateInput,
      segment: undefined,
      remaining: CalendarRemaining,
    },
  },
  TimeFieldPrimitiveComponent
)

export const TimeInput = DateInput
export const TimeSegment = DateSegment

// Attachments
TimeField.Input = TimeInput
TimeField.Segment = TimeSegment
TimeField.Remaining = CalendarRemaining

export const { Context: TimeFieldContext, useCompoundContext: useTimeFieldContext } =
  createCompoundContext<any>('TimeField')
