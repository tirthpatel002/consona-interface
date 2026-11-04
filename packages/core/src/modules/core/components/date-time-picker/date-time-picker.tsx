import React, { useCallback, useState } from 'react'
import {
  CalendarDate,
  getLocalTimeZone,
} from '@internationalized/date'
import { OverlayTrigger } from '../../../../core/overlay-trigger'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { useIsMobile } from '../../../../hooks/use-mobile'
import { Modal, type ModalProps } from '../modal'
import { Popover, type PopoverProps } from '../popover'
import {
  CalendarCellIndicator,
  CalendarRemaining,
} from '../calendar/calendar'
import {
  DateTimeContent,
  DateTimePresets,
  DateTimeTabs,
  DateTimeTimeTarget,
  DateTimeCalendar,
  DateTimeTimeWheel,
  DateTimeFooter,
  type DateTimeContentProps,
  type DateTimeContentSlots,
  type DateTimePickerValue,
  type DateTimeBound,
  type DateTimeSelection,
  type DateTimeRangeSelection,
  type DateTimePreset,
  type DateTimePresetsProps,
  type DateTimeTabsProps,
  type DateTimeTimeTargetProps,
  type DateTimeCalendarProps,
  type DateTimeTimeWheelProps,
  type DateTimeFooterProps,
} from './date-time-content'
import {
  DrumColumn,
  InteractiveTimeWheel,
  TimeWheel,
  type TimeObject,
  type DrumColumnProps,
  type InteractiveTimeWheelProps,
  pad,
  to12Hour,
} from '../time-wheel'
import type { ButtonProps } from '../button'

/* ==========================================================================
   Display Formatting Helpers
   ========================================================================== */

const FALLBACK_TIME: TimeObject = { hour: 0, minute: 0, second: 0 }

export function resolveTime(time?: TimeObject | null, fallback: TimeObject = FALLBACK_TIME): TimeObject {
  return {
    hour: time?.hour ?? fallback.hour,
    minute: time?.minute ?? fallback.minute,
    second: time?.second ?? fallback.second ?? 0,
  }
}

export function formatSingleDisplay(
  item: { date: CalendarDate | null; time?: TimeObject | null } | null | undefined,
  is24h: boolean,
  showSeconds: boolean,
  showTime: boolean,
  showDayName: boolean = false
): string {
  if (!item?.date) return ''

  let dayPrefix = ''
  if (showDayName) {
    try {
      const jsDate = item.date.toDate(getLocalTimeZone())
      dayPrefix = `${new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(jsDate)}, `
    } catch {
      // Fallback
    }
  }

  const dateStr = `${dayPrefix}${item.date.year}-${pad(item.date.month)}-${pad(item.date.day)}`
  if (!showTime) return dateStr

  const time = resolveTime(item.time)

  if (is24h) {
    const timeStr = `${pad(time.hour)}:${pad(time.minute)}${
      showSeconds ? `:${pad(time.second ?? 0)}` : ''
    }`
    return `${dateStr} ${timeStr}`
  }

  const { hour12, period } = to12Hour(time.hour)
  const timeStr = `${pad(hour12)}:${pad(time.minute)}${
    showSeconds ? `:${pad(time.second ?? 0)}` : ''
  } ${period}`
  return `${dateStr} ${timeStr}`
}

/* ==========================================================================
   DateTimePicker Root Component & Slots
   ========================================================================== */

export interface DateTimePickerSlots extends DateTimeContentSlots {
  /** Main internal composite picker panel slot. */
  content?: React.ComponentType<DateTimeContentProps>
  /** Desktop popover container wrapper slot. */
  popover?: React.ComponentType<PopoverProps>
  /** Mobile modal sheet container wrapper slot. */
  modal?: React.ComponentType<ModalProps>
}

export interface DateTimePickerProps extends DateTimeContentProps {
  /** Custom popover placement */
  placement?: 'bottom' | 'bottom start' | 'bottom end' | 'top' | 'top start' | 'top end'
  /** Popover open state (controlled) */
  isOpen?: boolean
  /** Popover default open state */
  defaultOpen?: boolean
  /** Callback on popover open change */
  onOpenChange?: (isOpen: boolean) => void
  /** Optional custom trigger node */
  children?: React.ReactNode
  /** Injected slot component overrides. */
  slots?: SlotComponents<DateTimePickerSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<DateTimePickerSlots>
}

const DateTimePickerPrimitive = ({
  range = false,
  showTime = true,
  showDayName = false,
  is24Hour = false,
  showSeconds = false,
  minuteStep = 5,
  value,
  defaultValue,
  onChange,
  showPresets = true,
  customPresets,
  placement = 'bottom start',
  isOpen: controlledIsOpen,
  defaultOpen = false,
  onOpenChange,
  showFooter = true,
  className,
  children,
  slots = {},
  slotProps = {},
  ...props
}: DateTimePickerProps) => {
  const isMobile = useIsMobile()
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(defaultOpen)
  const isControlledOpen = controlledIsOpen !== undefined
  const isOpen = isControlledOpen ? controlledIsOpen : uncontrolledIsOpen

  const setOpen = useCallback(
    (open: boolean) => {
      if (!isControlledOpen) {
        setUncontrolledIsOpen(open)
      }
      onOpenChange?.(open)
    },
    [isControlledOpen, onOpenChange]
  )

  const content = (close?: () => void) =>
    slots.content ? (
      renderSlot(slots.content, slotProps?.content)
    ) : (
      <DateTimeContent
        range={range}
        showTime={showTime}
        showDayName={showDayName}
        is24Hour={is24Hour}
        showSeconds={showSeconds}
        minuteStep={minuteStep}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        showPresets={showPresets}
        customPresets={customPresets}
        showFooter={showFooter}
        onDone={() => {
          close?.()
          setOpen(false)
        }}
        className={cn('w-full sm:w-79', className)}
        slots={{
          presets: slots.presets,
          tabs: slots.tabs,
          timeTarget: slots.timeTarget,
          calendar: slots.calendar,
          timeWheel: slots.timeWheel,
          footer: slots.footer,
          clearButton: slots.clearButton,
          doneButton: slots.doneButton,
          cellIndicator: slots.cellIndicator,
          remaining: slots.remaining,
          ...slotProps?.content?.slots,
        }}
        slotProps={slotProps?.content?.slotProps}
        {...props}
      />
    )

  if (!children) {
    return content()
  }

  if (isMobile) {
    return (
      <OverlayTrigger isOpen={isOpen} onOpenChange={setOpen}>
        {children}
        {slots.modal ? (
          renderSlot(slots.modal, {
            isDismissable: true,
            showCloseButton: false,
            size: 'sm',
            contentClassName: 'p-0 border-0 bg-transparent shadow-none w-auto max-w-87 mx-auto flex justify-center',
            ...slotProps?.modal,
            children: ({ close }: any) => content(close),
          })
        ) : (
          <Modal
            isDismissable
            showCloseButton={false}
            size="sm"
            contentClassName="p-0 border-0 bg-transparent shadow-none w-auto max-w-87 mx-auto flex justify-center"
            {...slotProps?.modal}
          >
            {({ close }) => content(close)}
          </Modal>
        )}
      </OverlayTrigger>
    )
  }

  return (
    <OverlayTrigger isOpen={isOpen} onOpenChange={setOpen}>
      {children}
      {slots.popover ? (
        renderSlot(slots.popover, {
            ...slotProps?.popover,
          placement,
          className: cn(
            'p-0 bg-transparent border-0 shadow-none w-auto flex justify-center'
          ),
          ...slotProps?.popover,
          children: ({ close }: any) => content(close),
        })
      ) : (
        <Popover
          placement={placement}
          className={cn(
            'p-0 bg-transparent border-0 shadow-none w-auto flex justify-center'
          )}
          {...slotProps?.popover}
        >
          {({ close }) => content(close)}
        </Popover>
      )}
    </OverlayTrigger>
  )
}

export const DateTimePicker = createInterfaceComponent<
  DateTimePickerProps,
  DateTimePickerSlots
>(
  {
    name: 'DateTimePicker',
    category: 'form',
    description: 'High-precision composite temporal picker composing Calendar, TimeWheel, Presets bar, and Footer actions.',
    version: '1.0.0',
    slots: {
      content: undefined,
      popover: undefined,
      modal: undefined,
    },
  },
  DateTimePickerPrimitive
)

// Attachments
DateTimePicker.Content = DateTimeContent
DateTimePicker.Presets = DateTimePresets
DateTimePicker.Tabs = DateTimeTabs
DateTimePicker.TimeTarget = DateTimeTimeTarget
DateTimePicker.Calendar = DateTimeCalendar
DateTimePicker.TimeWheel = DateTimeTimeWheel
DateTimePicker.Footer = DateTimeFooter
DateTimePicker.Wheel = InteractiveTimeWheel
DateTimePicker.Column = DrumColumn
DateTimePicker.CellIndicator = CalendarCellIndicator
DateTimePicker.Remaining = CalendarRemaining

export {
  DateTimeContent,
  DateTimePresets,
  DateTimeTabs,
  DateTimeTimeTarget,
  DateTimeCalendar,
  DateTimeTimeWheel,
  DateTimeFooter,
  InteractiveTimeWheel,
  DrumColumn,
  TimeWheel,
}

export type {
  DateTimeContentProps,
  DateTimeContentSlots,
  DateTimeSelection,
  DateTimeRangeSelection,
  DateTimePickerValue,
  DateTimeBound,
  DateTimePreset,
  DateTimePresetsProps,
  DateTimeTabsProps,
  DateTimeTimeTargetProps,
  DateTimeCalendarProps,
  DateTimeTimeWheelProps,
  DateTimeFooterProps,
  InteractiveTimeWheelProps,
  DrumColumnProps,
  TimeObject,
}

export const { Context: DateTimePickerContext, useCompoundContext: useDateTimePickerContext } =
  createCompoundContext<any>('DateTimePicker')
