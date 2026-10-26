import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type HTMLAttributes,
} from 'react'
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import {
  getLocalTimeZone,
  today,
} from '@internationalized/date'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Button, type ButtonProps } from '../button'
import {
  CalendarCellIndicator,
  CalendarRemaining,
  type CalendarCellIndicatorProps,
  type CalendarRemainingProps,
} from '../calendar/calendar'
import {
  DateTimePicker,
  formatSingleDisplay,
  type DateTimeContentProps,
  type DateTimePickerProps,
  type DateTimePickerValue,
  type DateTimeRangeSelection,
  type DateTimeSelection,
} from '../date-time-picker'

/* ==========================================================================
   DateTime Slots & Props
   ========================================================================== */

export interface DateTimeSlots {
  /** Form field trigger button. */
  trigger?: React.ComponentType<ButtonProps>
  /** Leading icon (Clock / Calendar). */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Clear value button. */
  clearButton?: React.ComponentType<ButtonProps>
  /** Trailing dropdown chevron indicator. */
  indicator?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Embedded popup DateTimePicker picker slot. */
  picker?: React.ComponentType<DateTimePickerProps>
  /** Form label element. */
  label?: React.ComponentType<React.HTMLAttributes<HTMLLabelElement>>
  /** Field description element. */
  description?: React.ComponentType<React.HTMLAttributes<HTMLSpanElement>>
  /** Field error message element. */
  errorMessage?: React.ComponentType<React.HTMLAttributes<HTMLSpanElement>>
  /** Current-day marker inside the picker calendar. */
  cellIndicator?: React.ComponentType<CalendarCellIndicatorProps>
  /** Remaining-time caption inside the picker. */
  remaining?: React.ComponentType<CalendarRemainingProps>
}

export interface DateTimeProps
  extends Omit<DateTimeContentProps, 'slots' | 'slotProps' | 'children'>,
    Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue' | 'children'> {
  /** Optional custom trigger or content override. */
  children?: React.ReactNode
  /** Input placeholder string when unselected. */
  placeholder?: string
  /** Accessible form label displayed above trigger. */
  label?: string
  /** Auxiliary description text displayed beneath field. */
  description?: string
  /** Validation error message text. */
  errorMessage?: string
  /** Whether user interaction is disabled. */
  isDisabled?: boolean
  /** Whether the field is in a read-only state. */
  isReadOnly?: boolean
  /** Whether to render the clear button when a value exists. */
  clearable?: boolean
  /** Display day of week name (e.g. Thu, Fri) in the formatted label. */
  showDayName?: boolean
  /** Popover placement alignment. */
  placement?: 'bottom' | 'bottom start' | 'bottom end' | 'top' | 'top start' | 'top end'
  /** Controlled popover open state. */
  isOpen?: boolean
  /** Default uncontrolled open state. */
  defaultOpen?: boolean
  /** Callback fired when popover open state changes. */
  onOpenChange?: (isOpen: boolean) => void
  /** Injected slot component overrides. */
  slots?: SlotComponents<DateTimeSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<DateTimeSlots>
}

const DateTimePrimitive = ({
  range = false,
  showTime = true,
  showDayName = false,
  is24Hour = false,
  showSeconds = false,
  minuteStep = 5,
  value: controlledValue,
  defaultValue,
  onChange,
  placeholder,
  label,
  description,
  errorMessage,
  isDisabled = false,
  isReadOnly = false,
  clearable = true,
  showPresets = true,
  customPresets,
  placement = 'bottom start',
  isOpen: controlledIsOpen,
  defaultOpen = false,
  onOpenChange,
  showFooter = true,
  minValue,
  maxValue,
  minTime,
  maxTime,
  showRemaining = false,
  className,
  slots = {},
  slotProps = {},
  ...props
}: DateTimeProps) => {
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

  const defaultSingleValue = useMemo<DateTimeSelection>(
    () => ({
      date: today(getLocalTimeZone()),
      time: { hour: 19, minute: 0, second: 0 },
    }),
    []
  )

  const defaultRangeValue = useMemo<DateTimeRangeSelection>(
    () => ({
      start: {
        date: today(getLocalTimeZone()),
        time: { hour: 9, minute: 0, second: 0 },
      },
      end: {
        date: today(getLocalTimeZone()).add({ days: 7 }),
        time: { hour: 17, minute: 0, second: 0 },
      },
    }),
    []
  )

  const [internalValue, setInternalValue] = useState<DateTimePickerValue>(() => {
    if (controlledValue !== undefined) return controlledValue
    if (defaultValue !== undefined) return defaultValue
    return range ? defaultRangeValue : defaultSingleValue
  })

  useEffect(() => {
    if (controlledValue === undefined) return
    setInternalValue((prev) => (prev === controlledValue ? prev : controlledValue))
  }, [controlledValue])

  const resolvedValue = controlledValue !== undefined ? controlledValue : internalValue

  const handleUpdate = useCallback(
    (newVal: DateTimePickerValue) => {
      setInternalValue(newVal)
      onChange?.(newVal)
    },
    [onChange]
  )

  const singleDisplay = useMemo(() => {
    if (!resolvedValue || range) return ''
    const s = resolvedValue as DateTimeSelection
    if (!s.date) return ''
    return formatSingleDisplay(s, is24Hour, showSeconds, showTime, showDayName)
  }, [resolvedValue, range, is24Hour, showSeconds, showTime, showDayName])

  const rangeDisplay = useMemo(() => {
    if (!resolvedValue || !range) return { start: '', end: '' }
    const r = resolvedValue as DateTimeRangeSelection
    const startStr = r.start?.date
      ? formatSingleDisplay(r.start, is24Hour, showSeconds, showTime, showDayName)
      : ''
    const endStr = r.end?.date
      ? formatSingleDisplay(r.end, is24Hour, showSeconds, showTime, showDayName)
      : ''
    return { start: startStr, end: endStr }
  }, [resolvedValue, range, is24Hour, showSeconds, showTime, showDayName])

  const hasValue = range
    ? Boolean(rangeDisplay.start || rangeDisplay.end)
    : Boolean(singleDisplay)

  const handleClearTrigger = (e: React.SyntheticEvent) => {
    e.stopPropagation()
    e.preventDefault()
    handleUpdate(null)
  }

  const defaultIcon = showTime ? (
    <ClockIcon
      data-slot="icon"
      className="size-4 shrink-0 text-muted-fg group-hover:text-primary transition-colors self-center"
    />
  ) : (
    <CalendarDaysIcon
      data-slot="icon"
      className="size-4 shrink-0 text-muted-fg group-hover:text-primary transition-colors self-center"
    />
  )

  const defaultIndicator = (
    <ChevronDownIcon
      data-slot="indicator"
      className="size-4 text-muted-fg transition-transform duration-200 group-data-[open]:rotate-180"
    />
  )

  const defaultClearButton = (
    <span
      data-slot="clear-button"
      role="button"
      tabIndex={-1}
      title="Clear date & time"
      onPointerDown={handleClearTrigger}
      onClick={handleClearTrigger}
      {...(slotProps.clearButton as any)}
      className={cn(
        'size-5 inline-flex items-center justify-center rounded-atom text-muted-fg hover:bg-muted hover:text-fg transition-colors cursor-pointer',
        typeof slotProps.clearButton?.className === 'string' ? slotProps.clearButton.className : undefined
      )}
    >
      <XMarkIcon className="size-3.5" />
    </span>
  )

  const defaultTrigger = (
    <Button
      intent="plain"
      isDisabled={isDisabled}
      data-slot="date-time-trigger"
      aria-label={label || placeholder || 'Select date and time'}
      className={cn(
        'group relative flex w-full items-center justify-between gap-space-sm rounded-base border border-input bg-bg px-space-md py-2 text-left font-normal transition-colors hover:bg-secondary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring min-h-[38px]',
        isDisabled && 'opacity-50 cursor-not-allowed'
      )}
      {...slotProps.trigger}
    >
      <div className="flex items-center gap-space-sm min-w-0 flex-1">
        {slots.icon ? renderSlot(slots.icon, slotProps.icon) : defaultIcon}

        {range ? (
          hasValue ? (
            <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1 py-0.5">
              <span className="font-mono text-xs sm:text-sm text-fg whitespace-nowrap">
                {rangeDisplay.start || 'Start date'}
              </span>
              <span className="text-muted-fg text-xs px-0.5 shrink-0 select-none">→</span>
              <span className="font-mono text-xs sm:text-sm text-fg whitespace-nowrap">
                {rangeDisplay.end || 'End date'}
              </span>
            </div>
          ) : (
            <span className="truncate font-mono text-xs sm:text-sm text-muted-fg">
              {placeholder || 'Select date & time range...'}
            </span>
          )
        ) : (
          <span
            className={cn(
              'truncate font-mono text-xs sm:text-sm',
              hasValue ? 'text-fg' : 'text-muted-fg'
            )}
          >
            {singleDisplay ||
              placeholder ||
              (showTime ? 'Select date & time...' : 'Select date...')}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0 self-center">
        {clearable && hasValue && !isDisabled && !isReadOnly && (
          slots.clearButton ? renderSlot(slots.clearButton, slotProps.clearButton) : defaultClearButton
        )}
        <div className="pointer-events-none">
          {slots.indicator ? renderSlot(slots.indicator, slotProps.indicator) : defaultIndicator}
        </div>
      </div>
    </Button>
  )

  const defaultPicker = (
    <DateTimePicker
      range={range}
      showTime={showTime}
      showDayName={showDayName}
      is24Hour={is24Hour}
      showSeconds={showSeconds}
      minuteStep={minuteStep}
      value={resolvedValue}
      onChange={handleUpdate}
      showPresets={showPresets}
      customPresets={customPresets}
      placement={placement}
      isOpen={isOpen}
      onOpenChange={setOpen}
      showFooter={showFooter}
      minValue={minValue}
      maxValue={maxValue}
      minTime={minTime}
      maxTime={maxTime}
      showRemaining={showRemaining}
      slots={{
        cellIndicator: slots.cellIndicator,
        remaining: slots.remaining,
        ...slotProps.picker?.slots,
      }}
      {...slotProps.picker}
    >
      {slots.trigger ? renderSlot(slots.trigger, slotProps.trigger) : defaultTrigger}
    </DateTimePicker>
  )

  return (
    <div data-slot="date-time" className={cn('flex flex-col gap-1.5 w-full', className)} {...props}>
      {label &&
        (slots.label ? (
          renderSlot(slots.label, { children: label, ...slotProps.label })
        ) : (
          <label data-slot="label" className="text-xs font-semibold text-fg">
            {label}
          </label>
        ))}

      {slots.picker ? renderSlot(slots.picker, slotProps.picker) : defaultPicker}

      {description &&
        (slots.description ? (
          renderSlot(slots.description, { children: description, ...slotProps.description })
        ) : (
          <span data-slot="description" className="text-xs text-muted-fg">
            {description}
          </span>
        ))}

      {errorMessage &&
        (slots.errorMessage ? (
          renderSlot(slots.errorMessage, { children: errorMessage, ...slotProps.errorMessage })
        ) : (
          <span data-slot="error-message" className="text-xs text-danger font-medium">
            {errorMessage}
          </span>
        ))}
    </div>
  )
}

export const DateTime = createInterfaceComponent<DateTimeProps, DateTimeSlots>(
  {
    name: 'DateTime',
    category: 'form',
    description: 'Composite form control with formatted label, range markers, and embedded DateTimePicker popup.',
    version: '1.0.0',
    slots: {
      trigger: undefined,
      icon: undefined,
      clearButton: undefined,
      indicator: undefined,
      picker: undefined,
      label: undefined,
      description: undefined,
      errorMessage: undefined,
      cellIndicator: undefined,
      remaining: undefined,
    },
  },
  DateTimePrimitive
)

DateTime.CellIndicator = CalendarCellIndicator
DateTime.Remaining = CalendarRemaining
