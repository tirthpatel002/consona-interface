import React from 'react'
import {
  DatePicker as RACDatePicker,
  type DatePickerProps as RACDatePickerProps,
  Button as RACButton,
  Group as RACGroup,
  type GroupProps as RACGroupProps,
  type DateValue,
} from 'react-aria-components'
import type { DateDuration } from '@internationalized/date'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { useIsMobile } from '../../../../hooks/use-mobile'
import {
  Calendar,
  CalendarCellIndicator,
  CalendarRemaining,
  type CalendarCellIndicatorProps,
  type CalendarProps,
  type CalendarRemainingProps,
} from '../calendar/calendar'
import { sameDate, useStableDateValue } from '../calendar/date-value'
import { RangeCalendar, type RangeCalendarProps } from '../calendar/range-calendar'
import { fieldStyles } from '../field'
import { InputGroup } from '../input'
import { Modal, ModalBody, type ModalProps } from '../modal'
import { Popover, type PopoverProps } from '../popover'
import { DateInput, DateSegment, type DateInputProps } from './date-field'

/* ==========================================================================
   DatePickerTrigger Sub-Component & Slots
   ========================================================================== */

export interface DatePickerTriggerSlots {
  /** Segmented date input well. */
  input?: React.ComponentType<DateInputProps>
  /** Trigger button opening the calendar overlay. */
  button?: React.ComponentType<React.ComponentPropsWithoutRef<typeof RACButton>>
  /** Leading or trailing calendar icon inside the trigger button. */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface DatePickerTriggerProps extends RACGroupProps {
  /** Custom CSS classes for the trigger input group. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<DatePickerTriggerSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<DatePickerTriggerSlots>
}

const DatePickerTriggerPrimitive = ({
  className,
  slots = {},
  slotProps = {},
  ...props
}: DatePickerTriggerProps) => {
  const defaultIcon = <CalendarDaysIcon data-slot="icon" />

  const defaultButton = (
    <RACButton
      data-slot="date-picker-trigger"
      className={cn(
        'touch-target grid place-content-center outline-none cursor-pointer',
        'pressed:text-fg text-muted-fg hover:text-fg focus-visible:text-fg transition-colors',
        'px-3.5 py-2 sm:px-3 sm:py-1.5',
        '*:size-5 sm:*:size-4'
      )}
      {...slotProps?.button}
    >
      {slots.icon ? renderSlot(slots.icon, slotProps?.icon) : defaultIcon}
    </RACButton>
  )

  return (
    <InputGroup className={cn('flex items-center *:data-[slot=control]:flex-1', className)} {...props}>
      {renderSlot(slots.input, slotProps?.input, {
        defaultComponent: DateInput,
      })}
      {slots.button ? renderSlot(slots.button, slotProps?.button) : defaultButton}
    </InputGroup>
  )
}

export const DatePickerTrigger = createInterfaceComponent<DatePickerTriggerProps, DatePickerTriggerSlots>(
  {
    name: 'DatePickerTrigger',
    category: 'form',
    description: 'Input group trigger with embedded calendar button for activating the date picker.',
    version: '1.0.0',
    slots: {
      input: DateInput,
      button: undefined,
      icon: undefined,
    },
  },
  DatePickerTriggerPrimitive
)

/* ==========================================================================
   DatePickerOverlay Sub-Component & Slots
   ========================================================================== */

export interface DatePickerOverlaySlots {
  /** Calendar component rendered inside overlay (Calendar or RangeCalendar). */
  calendar?: React.ComponentType<CalendarProps<any>> | React.ComponentType<RangeCalendarProps<any>>
  /** Current-day marker inside overlay calendar cells. */
  cellIndicator?: React.ComponentType<CalendarCellIndicatorProps>
  /** Remaining-time caption inside the overlay calendar. */
  remaining?: React.ComponentType<CalendarRemainingProps>
  /** Mobile modal wrapper slot. */
  modal?: React.ComponentType<ModalProps>
  /** Desktop popover wrapper slot. */
  popover?: React.ComponentType<PopoverProps>
}

export interface DatePickerOverlayProps {
  /** Whether to render a range calendar inside the overlay. */
  range?: boolean
  /** Visible duration (number of months). */
  visibleDuration?: DateDuration
  /** Page navigation behavior. */
  pageBehavior?: 'visible' | 'single'
  /** Popover placement. */
  placement?: 'bottom' | 'bottom start' | 'bottom end' | 'top' | 'top start' | 'top end'
  /** Custom CSS classes for the popover overlay. */
  className?: string
  /** Children override. */
  children?: React.ReactNode
  /** Show remaining time until maxValue (or the selected date) inside the calendar. */
  showRemaining?: boolean
  /** Injected slot component overrides. */
  slots?: SlotComponents<DatePickerOverlaySlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<DatePickerOverlaySlots>
}

const DatePickerOverlayPrimitive = ({
  visibleDuration = { months: 1 },
  pageBehavior = 'visible',
  placement = 'bottom start',
  range,
  className,
  children,
  showRemaining = false,
  slots = {},
  slotProps = {},
  ...props
}: DatePickerOverlayProps) => {
  const isMobile = useIsMobile()

  const calendarSlots = {
    cellIndicator: slots.cellIndicator,
    remaining: slots.remaining,
    ...slotProps.calendar?.slots,
  }

  const defaultCalendar = range ? (
    <RangeCalendar
      pageBehavior={pageBehavior}
      visibleDuration={visibleDuration}
      showRemaining={showRemaining}
      slots={calendarSlots}
      slotProps={slotProps.calendar?.slotProps}
    />
  ) : (
    <Calendar
      showRemaining={showRemaining}
      slots={calendarSlots}
      slotProps={slotProps.calendar?.slotProps}
    />
  )

  if (isMobile) {
    return (
      <Modal {...slotProps?.modal}>
        <ModalBody className="p-space-lg flex justify-center">
          {children ||
            (slots.calendar
              ? renderSlot(slots.calendar, slotProps?.calendar)
              : defaultCalendar)}
        </ModalBody>
      </Modal>
    )
  }

  return (
    <Popover
      placement={placement}
      className={cn(
        'flex min-w-auto max-w-none snap-x justify-center p-space-md sm:min-w-[16.5rem] sm:p-space-sm',
        visibleDuration?.months === 1 ? 'sm:max-w-xs' : 'sm:max-w-none',
        className
      )}
      {...slotProps?.popover}
      {...props}
    >
      {children ||
        (slots.calendar
          ? renderSlot(slots.calendar, slotProps?.calendar)
          : defaultCalendar)}
    </Popover>
  )
}

export const DatePickerOverlay = createInterfaceComponent<DatePickerOverlayProps, DatePickerOverlaySlots>(
  {
    name: 'DatePickerOverlay',
    category: 'form',
    description: 'Adaptive popover / mobile sheet overlay housing calendar picker components.',
    version: '1.0.0',
    slots: {
      calendar: undefined,
      cellIndicator: undefined,
      remaining: undefined,
      modal: undefined,
      popover: undefined,
    },
  },
  DatePickerOverlayPrimitive
)

/* ==========================================================================
   DatePicker Root Component
   ========================================================================== */

export interface DatePickerSlots {
  /** Injected custom trigger button or input group. */
  trigger?: React.ComponentType<DatePickerTriggerProps>
  /** Injected custom calendar popover overlay. */
  overlay?: React.ComponentType<DatePickerOverlayProps>
  /** Calendar component rendered inside overlay. */
  calendar?: React.ComponentType<CalendarProps<any>> | React.ComponentType<RangeCalendarProps<any>>
  /** Input well slot inside trigger. */
  input?: React.ComponentType<DateInputProps>
  /** Trigger button slot. */
  button?: React.ComponentType<React.ComponentPropsWithoutRef<typeof RACButton>>
  /** Calendar icon slot. */
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

export interface DatePickerProps<T extends DateValue = DateValue>
  extends Omit<RACDatePickerProps<T>, 'children'> {
  /** Custom CSS classes for the date picker root container. */
  className?: string
  /** Configuration passed down to the calendar popover overlay. */
  popover?: DatePickerOverlayProps
  /** Show remaining time until maxValue (or the selected date) in the calendar. */
  showRemaining?: boolean
  /** Injected slot component overrides. */
  slots?: SlotComponents<DatePickerSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<DatePickerSlots>
  /** Custom child composition or render function. */
  children?: React.ReactNode | ((values: any) => React.ReactNode)
}

const DatePickerPrimitiveComponent = <T extends DateValue = DateValue>({
  className,
  children,
  popover,
  showRemaining = false,
  slots = {},
  slotProps = {},
  minValue,
  maxValue,
  value,
  defaultValue,
  onChange,
  ...props
}: DatePickerProps<T>) => {
  const stableMin = useStableDateValue(minValue)
  const stableMax = useStableDateValue(maxValue)
  const stableValue = useStableDateValue(value)
  const stableDefaultValue = useStableDateValue(defaultValue)
  const triggerSlots: SlotComponents<DatePickerTriggerSlots> = {
    input: slots.input,
    button: slots.button,
    icon: slots.icon,
    ...slotProps?.trigger?.slots,
  }

  const overlaySlots: SlotComponents<DatePickerOverlaySlots> = {
    calendar: slots.calendar,
    cellIndicator: slots.cellIndicator,
    remaining: slots.remaining,
    popover: slots.popover,
    modal: slots.modal,
    ...slotProps?.overlay?.slots,
  }

  return (
    <RACDatePicker
      data-slot="control"
      className={cn(fieldStyles({ className: 'group/date-picker' }), className)}
      {...props}
      minValue={stableMin}
      maxValue={stableMax}
      value={value === undefined ? undefined : stableValue ?? null}
      defaultValue={stableDefaultValue}
      onChange={(next) => {
        if (sameDate(stableValue ?? null, next ?? null)) return
        onChange?.(next)
      }}
    >
      {(values) => (
        <>
          {typeof children === 'function'
            ? children(values)
            : children ||
              renderSlot(
                slots.trigger,
                { slots: triggerSlots, ...slotProps?.trigger },
                { defaultComponent: DatePickerTrigger }
              )}
          {renderSlot(
            slots.overlay,
            {
              ...popover,
              showRemaining: showRemaining || popover?.showRemaining,
              slots: overlaySlots,
              slotProps: slotProps?.overlay?.slotProps,
              ...slotProps?.overlay,
            },
            { defaultComponent: DatePickerOverlay }
          )}
        </>
      )}
    </RACDatePicker>
  )
}

export const DatePicker = createInterfaceComponent<DatePickerProps<any>, DatePickerSlots>(
  {
    name: 'DatePicker',
    category: 'form',
    description: 'Accessible date picker control combining segmented text input with an interactive calendar popover.',
    version: '1.0.0',
    slots: {
      trigger: DatePickerTrigger,
      overlay: DatePickerOverlay,
      calendar: undefined,
      input: DateInput,
      button: undefined,
      icon: undefined,
      cellIndicator: undefined,
      remaining: undefined,
      popover: undefined,
      modal: undefined,
    },
  },
  DatePickerPrimitiveComponent
)

// Attachments
DatePicker.Trigger = DatePickerTrigger
DatePicker.Overlay = DatePickerOverlay
DatePicker.Calendar = Calendar
DatePicker.RangeCalendar = RangeCalendar
DatePicker.Input = DateInput
DatePicker.Segment = DateSegment
DatePicker.CellIndicator = CalendarCellIndicator
DatePicker.Remaining = CalendarRemaining

export const { Context: DatePickerContext, useCompoundContext: useDatePickerContext } =
  createCompoundContext<any>('DatePicker')
