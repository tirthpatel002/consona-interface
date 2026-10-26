import React from 'react'
import {
  DateRangePicker as RACDateRangePicker,
  type DateRangePickerProps as RACDateRangePickerProps,
  Button as RACButton,
  type DateValue,
} from 'react-aria-components'
import type { DateDuration } from '@internationalized/date'
import { CalendarDateRangeIcon } from '@heroicons/react/24/outline'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import {
  CalendarCellIndicator,
  CalendarRemaining,
  type CalendarProps,
  type CalendarCellIndicatorProps,
  type CalendarRemainingProps,
} from '../calendar/calendar'
import { sameDate, useStableDateRange, useStableDateValue, useStableDuration } from '../calendar/date-value'
import { RangeCalendar, type RangeCalendarProps } from '../calendar/range-calendar'
import { fieldStyles } from '../field'
import { InputGroup, type InputGroupProps } from '../input'
import { Modal, type ModalProps } from '../modal'
import { Popover, type PopoverProps } from '../popover'
import { DateInput, DateSegment, type DateInputProps } from './date-field'
import { DatePickerOverlay, type DatePickerOverlayProps, type DatePickerOverlaySlots } from './date-picker'

/* ==========================================================================
   DateRangePickerTrigger Sub-Component & Slots
   ========================================================================== */

export interface DateRangePickerTriggerSlots {
  /** Start date segmented input well. */
  startInput?: React.ComponentType<DateInputProps>
  /** End date segmented input well. */
  endInput?: React.ComponentType<DateInputProps>
  /** Separator dash/dot element between start and end inputs. */
  separator?: React.ComponentType<React.HTMLAttributes<HTMLSpanElement>>
  /** Calendar activation trigger button. */
  button?: React.ComponentType<React.ComponentPropsWithoutRef<typeof RACButton>>
  /** Trigger button icon. */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface DateRangePickerTriggerProps extends InputGroupProps {
  /** Custom CSS classes for the range input trigger group. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<DateRangePickerTriggerSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<DateRangePickerTriggerSlots>
}

const DefaultStartDateInput = (props: React.ComponentProps<typeof DateInput>) => (
  <DateInput slot="start" className="rounded-none border-none focus-within:ring-0" {...props} />
)

const DefaultEndDateInput = (props: React.ComponentProps<typeof DateInput>) => (
  <DateInput slot="end" className="rounded-none border-none focus-within:ring-0" {...props} />
)

const DateRangePickerTriggerPrimitive = ({
  className,
  slots = {},
  slotProps = {},
  ...props
}: DateRangePickerTriggerProps) => {
  const defaultIcon = <CalendarDateRangeIcon data-slot="icon" />

  const defaultSeparator = (
    <span
      data-slot="date-range-separator"
      aria-hidden="true"
      className="pointer-events-none z-10 -mx-3 block h-0.5 w-2 shrink-0 self-center rounded-full bg-fg opacity-60 sm:-mx-2"
    />
  )

  const defaultButton = (
    <RACButton
      data-slot="date-picker-trigger"
      className={cn(
        'touch-target grid place-content-center outline-none cursor-pointer text-muted-fg hover:text-fg focus-visible:text-fg transition-colors',
        'px-3.5 py-2 sm:px-3 sm:py-1.5',
        '*:-me-px *:-mt-0.5 *:size-5 sm:*:size-4'
      )}
      {...slotProps.button}
    >
      {slots.icon ? renderSlot(slots.icon, slotProps.icon) : defaultIcon}
    </RACButton>
  )

  return (
    <InputGroup
      className={cn(
        'flex items-center overflow-hidden rounded-base pe-space-lg',
        'border border-input transition-colors hover:enabled:border-muted-fg/40',
        'group-open/date-range-picker:border-ring group-open/date-range-picker:ring-2 group-open/date-range-picker:ring-ring/20',
        'focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 focus-within:outline-none',
        'invalid:border-danger focus-within:invalid:border-danger focus-within:invalid:ring-danger/20',
        'disabled:bg-muted disabled:opacity-50',
        className
      )}
      {...props}
    >
      {renderSlot(slots.startInput, slotProps.startInput, {
        defaultComponent: DefaultStartDateInput,
      })}
      {slots.separator ? renderSlot(slots.separator, slotProps.separator) : defaultSeparator}
      {renderSlot(slots.endInput, slotProps.endInput, {
        defaultComponent: DefaultEndDateInput,
      })}
      {slots.button ? renderSlot(slots.button, slotProps.button) : defaultButton}
    </InputGroup>
  )
}

export const DateRangePickerTrigger = createInterfaceComponent<
  DateRangePickerTriggerProps,
  DateRangePickerTriggerSlots
>(
  {
    name: 'DateRangePickerTrigger',
    category: 'form',
    description: 'Segmented start/end date input pair with date range icon trigger button.',
    version: '1.0.0',
    slots: {
      startInput: undefined,
      endInput: undefined,
      separator: undefined,
      button: undefined,
      icon: undefined,
    },
  },
  DateRangePickerTriggerPrimitive
)

/* ==========================================================================
   DateRangePicker Root Component
   ========================================================================== */

export interface DateRangePickerSlots {
  /** Injected custom range trigger input group. */
  trigger?: React.ComponentType<DateRangePickerTriggerProps>
  /** Injected custom range calendar popover overlay. */
  overlay?: React.ComponentType<DatePickerOverlayProps>
  /** Calendar component rendered inside overlay. */
  calendar?: React.ComponentType<RangeCalendarProps<any>> | React.ComponentType<CalendarProps<any>>
  /** Start date segmented input well slot. */
  startInput?: React.ComponentType<DateInputProps>
  /** End date segmented input well slot. */
  endInput?: React.ComponentType<DateInputProps>
  /** Separator dash/dot element between start and end inputs. */
  separator?: React.ComponentType<React.HTMLAttributes<HTMLSpanElement>>
  /** Calendar activation trigger button slot. */
  button?: React.ComponentType<React.ComponentPropsWithoutRef<typeof RACButton>>
  /** Trigger button icon slot. */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Current-day marker inside the overlay calendar. */
  cellIndicator?: React.ComponentType<CalendarCellIndicatorProps>
  /** Remaining-time caption inside the overlay calendar. */
  remaining?: React.ComponentType<CalendarRemainingProps>
  /** Desktop popover wrapper slot. */
  popover?: React.ComponentType<PopoverProps>
  /** Mobile modal sheet slot. */
  modal?: React.ComponentType<ModalProps>
}

export interface DateRangePickerProps<T extends DateValue = DateValue>
  extends RACDateRangePickerProps<T> {
  /** Visible duration in months for the calendar overlay. */
  visibleDuration?: DateDuration
  /** Page scrolling behavior. */
  pageBehavior?: 'visible' | 'single'
  /** Popover overlay configuration. */
  popover?: DatePickerOverlayProps
  /** Show remaining time until maxValue (or the selected end date) in the calendar. */
  showRemaining?: boolean
  /** Injected slot component overrides. */
  slots?: SlotComponents<DateRangePickerSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<DateRangePickerSlots>
}

const DateRangePickerPrimitiveComponent = <T extends DateValue = DateValue>({
  className,
  popover,
  children,
  visibleDuration = { months: 1 },
  showRemaining = false,
  slots = {},
  slotProps = {},
  minValue,
  maxValue,
  value,
  defaultValue,
  onChange,
  ...props
}: DateRangePickerProps<T>) => {
  const stableDuration = useStableDuration(visibleDuration)
  const stableMin = useStableDateValue(minValue)
  const stableMax = useStableDateValue(maxValue)
  const stableValue = useStableDateRange(value ?? null)
  const stableDefaultValue = useStableDateRange(defaultValue ?? null)
  const triggerSlots: SlotComponents<DateRangePickerTriggerSlots> = {
    startInput: slots.startInput,
    endInput: slots.endInput,
    separator: slots.separator,
    button: slots.button,
    icon: slots.icon,
    ...slotProps.trigger?.slots,
  }

  const overlaySlots: SlotComponents<DatePickerOverlaySlots> = {
    calendar: slots.calendar,
    cellIndicator: slots.cellIndicator,
    remaining: slots.remaining,
    popover: slots.popover,
    modal: slots.modal,
    ...slotProps.overlay?.slots,
  }

  return (
    <RACDateRangePicker
      data-slot="control"
      className={cn(fieldStyles({ className: 'group/date-range-picker' }), className)}
      minValue={stableMin}
      maxValue={stableMax}
      value={stableValue ?? undefined}
      defaultValue={stableDefaultValue ?? undefined}
      onChange={(next) => {
        if (
          sameDate(stableValue?.start ?? null, next?.start ?? null) &&
          sameDate(stableValue?.end ?? null, next?.end ?? null)
        ) {
          return
        }
        onChange?.(next)
      }}
      {...props}
    >
      {(values) => (
        <>
          {typeof children === 'function'
            ? children(values)
            : children ||
              renderSlot(
                slots.trigger,
                { slots: triggerSlots, ...slotProps.trigger },
                { defaultComponent: DateRangePickerTrigger }
              )}
          {renderSlot(
            slots.overlay,
            {
              ...popover,
              visibleDuration: stableDuration,
              range: true,
              showRemaining: showRemaining || popover?.showRemaining,
              slots: overlaySlots,
              slotProps: slotProps.overlay?.slotProps,
              ...slotProps.overlay,
            },
            { defaultComponent: DatePickerOverlay }
          )}
        </>
      )}
    </RACDateRangePicker>
  )
}

export const DateRangePicker = createInterfaceComponent<
  DateRangePickerProps<any>,
  DateRangePickerSlots
>(
  {
    name: 'DateRangePicker',
    category: 'form',
    description: 'Accessible date span picker with start/end input segments and dual-range calendar popover.',
    version: '1.0.0',
    slots: {
      trigger: DateRangePickerTrigger,
      overlay: DatePickerOverlay,
      calendar: undefined,
      startInput: undefined,
      endInput: undefined,
      separator: undefined,
      button: undefined,
      icon: undefined,
      cellIndicator: undefined,
      remaining: undefined,
      popover: undefined,
      modal: undefined,
    },
  },
  DateRangePickerPrimitiveComponent
)

// Attachments
DateRangePicker.Trigger = DateRangePickerTrigger
DateRangePicker.Overlay = DatePickerOverlay
DateRangePicker.Calendar = RangeCalendar
DateRangePicker.RangeCalendar = RangeCalendar
DateRangePicker.Input = DateInput
DateRangePicker.Segment = DateSegment
DateRangePicker.CellIndicator = CalendarCellIndicator
DateRangePicker.Remaining = CalendarRemaining
