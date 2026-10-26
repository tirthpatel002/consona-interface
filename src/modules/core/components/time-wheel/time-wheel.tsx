import React, { useMemo, type HTMLAttributes } from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { DrumColumn, type DrumColumnProps } from './drum-column'
import {
  CalendarRemaining,
  type CalendarRemainingProps,
} from '../calendar/calendar'
import type { TimeObject } from '../../hooks/use-date-time'
import { sameTime } from '../calendar/date-value'
import { remainingUntilTime } from '../calendar/remaining'
import { clampTime } from '../../hooks/use-date-time'

/* ==========================================================================
   Time Wheel Utilities & Helpers
   ========================================================================== */

export type { TimeObject } from '../../hooks/use-date-time'

export function pad(num: number): string {
  return String(num).padStart(2, '0')
}

export function snapMinute(minute: number, step: number = 5): number {
  const rounded = Math.round(minute / step) * step
  return rounded >= 60 ? 55 : rounded
}

export function to12Hour(hour24: number): { hour12: number; period: 'AM' | 'PM' } {
  const period = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return { hour12, period }
}

export function to24Hour(hour12: number, period: 'AM' | 'PM'): number {
  if (period === 'AM') {
    return hour12 === 12 ? 0 : hour12
  }
  return hour12 === 12 ? 12 : hour12 + 12
}

/* ==========================================================================
   TimeWheelModeToggle Sub-Atom
   ========================================================================== */

export interface TimeWheelModeToggleProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onToggle'> {
  /** Whether 24-hour mode is active. */
  is24Hour: boolean
  /** Callback fired when mode is toggled. */
  onToggle: (is24Hour: boolean) => void
  /** Custom CSS classes. */
  className?: string
}

const TimeWheelModeTogglePrimitive = ({
  is24Hour,
  onToggle,
  className,
  ...props
}: TimeWheelModeToggleProps) => {
  return (
    <div
      data-slot="time-wheel-mode-toggle"
      className={cn(
        'flex items-center gap-1 rounded-micro border border-border bg-muted/40 p-0.5 text-xs font-medium text-muted-fg',
        className
      )}
      {...props}
    >
      <button
        type="button"
        onClick={() => onToggle?.(false)}
        className={cn(
          'cursor-pointer rounded-atom px-2.5 py-0.5 transition-colors',
          !is24Hour
            ? 'bg-card text-fg font-semibold border border-border/60'
            : 'hover:text-fg'
        )}
      >
        12-Hour
      </button>
      <button
        type="button"
        onClick={() => onToggle?.(true)}
        className={cn(
          'cursor-pointer rounded-atom px-2.5 py-0.5 transition-colors',
          is24Hour
            ? 'bg-card text-fg font-semibold border border-border/60'
            : 'hover:text-fg'
        )}
      >
        24-Hour
      </button>
    </div>
  )
}

export const TimeWheelModeToggle = createInterfaceComponent<TimeWheelModeToggleProps>(
  {
    name: 'TimeWheelModeToggle',
    category: 'form',
    description: '12-Hour vs 24-Hour mode switcher pill for temporal time wheels.',
    version: '1.0.0',
  },
  TimeWheelModeTogglePrimitive
)

/* ==========================================================================
   TimeWheelSelectionBar Sub-Atom
   ========================================================================== */

export interface TimeWheelSelectionBarProps extends HTMLAttributes<HTMLDivElement> {
  /** Custom CSS classes. */
  className?: string
}

const TimeWheelSelectionBarPrimitive = ({ className, ...props }: TimeWheelSelectionBarProps) => {
  return (
    <div
      data-slot="time-wheel-selection-bar"
      className={cn(
        'pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 h-10 rounded-base bg-secondary/80 border border-border',
        className
      )}
      {...props}
    />
  )
}

export const TimeWheelSelectionBar = createInterfaceComponent<TimeWheelSelectionBarProps>(
  {
    name: 'TimeWheelSelectionBar',
    category: 'form',
    description: 'Center active selection highlight bar across drum columns.',
    version: '1.0.0',
  },
  TimeWheelSelectionBarPrimitive
)

/* ==========================================================================
   TimeWheelSeparator Sub-Atom
   ========================================================================== */

export interface TimeWheelSeparatorProps extends HTMLAttributes<HTMLSpanElement> {
  /** Custom separator text (defaults to colon :). */
  children?: React.ReactNode
  /** Custom CSS classes. */
  className?: string
}

const TimeWheelSeparatorPrimitive = ({
  children = ':',
  className,
  ...props
}: TimeWheelSeparatorProps) => {
  return (
    <span
      data-slot="time-wheel-separator"
      className={cn(
        'self-center font-mono font-bold text-fg text-2xl mb-1 select-none px-0.5',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export const TimeWheelSeparator = createInterfaceComponent<TimeWheelSeparatorProps>(
  {
    name: 'TimeWheelSeparator',
    category: 'form',
    description: 'Typographic colon separator dividing hours, minutes, and seconds drum columns.',
    version: '1.0.0',
  },
  TimeWheelSeparatorPrimitive
)

/* ==========================================================================
   InteractiveTimeWheel Props, Slots & Component
   ========================================================================== */

export interface InteractiveTimeWheelSlots {
  /** Hours drum column slot. */
  hourColumn?: React.ComponentType<DrumColumnProps<number>>
  /** Minutes drum column slot. */
  minuteColumn?: React.ComponentType<DrumColumnProps<number>>
  /** Optional seconds drum column slot. */
  secondColumn?: React.ComponentType<DrumColumnProps<number>>
  /** AM/PM period drum column slot. */
  periodColumn?: React.ComponentType<DrumColumnProps<'AM' | 'PM'>>
  /** 12-Hour vs 24-Hour mode switcher toggle slot. */
  modeToggle?: React.ComponentType<TimeWheelModeToggleProps>
  /** Center active selection highlight band slot. */
  selectionBar?: React.ComponentType<TimeWheelSelectionBarProps>
  /** Separator colon element slot. */
  separator?: React.ComponentType<TimeWheelSeparatorProps>
  /** Remaining-time caption below the wheel. */
  remaining?: React.ComponentType<CalendarRemainingProps>
}

export interface InteractiveTimeWheelProps {
  /** Optional custom composed children */
  children?: React.ReactNode
  /** Selected time object representation. */
  value?: TimeObject
  /** Handler called when time values change. */
  onChange?: (time: TimeObject) => void
  /** Whether 24-hour military format is active. */
  is24Hour?: boolean
  /** Optional handler to switch between 12-hour and 24-hour modes. */
  onToggle24Hour?: (is24h: boolean) => void
  /** Whether to render the seconds drum column. */
  showSeconds?: boolean
  /** Granularity interval for minute snapping (default 5). */
  minuteStep?: number
  /** Earliest selectable time. */
  minTime?: TimeObject | null
  /** Latest selectable time. */
  maxTime?: TimeObject | null
  /** Show remaining time from the selected value until `maxTime`. */
  showRemaining?: boolean
  /** Custom container CSS classes. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<InteractiveTimeWheelSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<InteractiveTimeWheelSlots>
}

const InteractiveTimeWheelPrimitive = ({
  children,
  value = { hour: 0, minute: 0, second: 0 },
  onChange,
  is24Hour = false,
  onToggle24Hour,
  showSeconds = false,
  minuteStep = 5,
  minTime,
  maxTime,
  showRemaining = false,
  className,
  slots = {},
  slotProps = {},
}: InteractiveTimeWheelProps) => {
  const { hour12, period } = to12Hour(value.hour)

  const hours12 = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), [])
  const hours24 = useMemo(() => Array.from({ length: 24 }, (_, i) => i), [])
  const minutes = useMemo(() => {
    const list: number[] = []
    for (let i = 0; i < 60; i += minuteStep) {
      list.push(i)
    }
    return list
  }, [minuteStep])
  const seconds = useMemo(() => Array.from({ length: 60 }, (_, i) => i), [])
  const periods: ('AM' | 'PM')[] = ['AM', 'PM']

  const commit = (next: TimeObject) => {
    const clamped = clampTime(next, minTime, maxTime)
    if (sameTime(clamped, value)) return
    onChange?.(clamped)
  }

  const handleHourChange = (newHour: number) => {
    if (is24Hour) {
      commit({ ...value, hour: newHour })
    } else {
      commit({ ...value, hour: to24Hour(newHour, period) })
    }
  }

  const handlePeriodChange = (newPeriod: 'AM' | 'PM') => {
    commit({ ...value, hour: to24Hour(hour12, newPeriod) })
  }

  const handleMinuteChange = (newMin: number) => {
    commit({ ...value, minute: newMin })
  }

  const handleSecondChange = (newSec: number) => {
    commit({ ...value, second: newSec })
  }

  const remaining = showRemaining ? remainingUntilTime(maxTime, value) : null

  const defaultToggle = onToggle24Hour ? (
    <TimeWheelModeToggle
      is24Hour={is24Hour}
      onToggle={onToggle24Hour}
      {...slotProps.modeToggle}
    />
  ) : null

  const defaultHourColumn = is24Hour ? (
    <DrumColumn
      items={hours24}
      value={value.hour}
      onChange={handleHourChange}
      format={(v) => pad(v)}
      loop
      {...slotProps.hourColumn}
    />
  ) : (
    <DrumColumn
      items={hours12}
      value={hour12}
      onChange={handleHourChange}
      format={(v) => pad(v)}
      loop
      {...slotProps.hourColumn}
    />
  )

  const defaultMinuteColumn = (
    <DrumColumn
      items={minutes}
      value={snapMinute(value.minute, minuteStep)}
      onChange={handleMinuteChange}
      format={(v) => pad(v)}
      loop
      {...slotProps.minuteColumn}
    />
  )

  const defaultSecondColumn = (
    <DrumColumn
      items={seconds}
      value={value.second ?? 0}
      onChange={handleSecondChange}
      format={(v) => pad(v)}
      loop
      {...slotProps.secondColumn}
    />
  )

  const defaultPeriodColumn = (
    <DrumColumn
      items={periods}
      value={period}
      onChange={handlePeriodChange}
      columnWidth="w-14 sm:w-16"
      loop={false}
      {...slotProps.periodColumn}
    />
  )

  return (
    <div
      data-slot="interactive-time-wheel"
      className={cn('flex flex-col items-center gap-space-sm w-full', className)}
    >
      {children != null ? (
        children
      ) : (
        <>
          {/* 12h / 24h Mode Toggle */}
          {onToggle24Hour &&
            (slots.modeToggle
              ? renderSlot(slots.modeToggle, {
                  is24Hour,
                  onToggle: onToggle24Hour,
                  ...slotProps.modeToggle,
                })
              : defaultToggle)}

          {/* Clock Readout with Center Selection Bar */}
          <div className="relative flex items-center justify-center gap-1 w-full px-space-xs">
            {slots.selectionBar
              ? renderSlot(slots.selectionBar, slotProps.selectionBar)
              : <TimeWheelSelectionBar {...slotProps.selectionBar} />}

            {slots.hourColumn
              ? renderSlot(slots.hourColumn, {
            ...slotProps?.hourColumn,
                  items: is24Hour ? hours24 : hours12,
                  value: is24Hour ? value.hour : hour12,
                  onChange: handleHourChange,
                  format: (v: number) => pad(v),
                  loop: true,
                  ...slotProps.hourColumn,
                })
              : defaultHourColumn}

            {slots.separator
              ? renderSlot(slots.separator, slotProps.separator)
              : <TimeWheelSeparator {...slotProps.separator} />}

            {slots.minuteColumn
              ? renderSlot(slots.minuteColumn, {
            ...slotProps?.minuteColumn,
                  items: minutes,
                  value: snapMinute(value.minute, minuteStep),
                  onChange: handleMinuteChange,
                  format: (v: number) => pad(v),
                  loop: true,
                  ...slotProps.minuteColumn,
                })
              : defaultMinuteColumn}

            {showSeconds && (
              <>
                {slots.separator
                  ? renderSlot(slots.separator, slotProps.separator)
                  : <TimeWheelSeparator {...slotProps.separator} />}
                {slots.secondColumn
                  ? renderSlot(slots.secondColumn, {
            ...slotProps?.secondColumn,
                      items: seconds,
                      value: value.second ?? 0,
                      onChange: handleSecondChange,
                      format: (v: number) => pad(v),
                      loop: true,
                      ...slotProps.secondColumn,
                    })
                  : defaultSecondColumn}
              </>
            )}

            {!is24Hour &&
              (slots.periodColumn
                ? renderSlot(slots.periodColumn, {
                    items: periods,
                    value: period,
                    onChange: handlePeriodChange,
                    columnWidth: 'w-14 sm:w-16',
                    loop: false,
                    ...slotProps.periodColumn,
                  })
                : defaultPeriodColumn)}
          </div>

          {showRemaining &&
            renderSlot(
              slots.remaining,
              { remaining, ...slotProps.remaining },
              { defaultComponent: CalendarRemaining }
            )}
        </>
      )}
    </div>
  )
}

export const InteractiveTimeWheel = createInterfaceComponent<
  InteractiveTimeWheelProps,
  InteractiveTimeWheelSlots
>(
  {
    name: 'InteractiveTimeWheel',
    category: 'form',
    description: 'Composite temporal time wheel with synchronized hours, minutes, seconds, and AM/PM columns.',
    version: '1.0.0',
    slots: {
      hourColumn: undefined,
      minuteColumn: undefined,
      secondColumn: undefined,
      periodColumn: undefined,
      modeToggle: undefined,
      selectionBar: undefined,
      separator: undefined,
      remaining: CalendarRemaining,
    },
  },
  InteractiveTimeWheelPrimitive
)

export const TimeWheel = InteractiveTimeWheel

// Attachments
InteractiveTimeWheel.Column = DrumColumn
InteractiveTimeWheel.Toggle = TimeWheelModeToggle
InteractiveTimeWheel.SelectionBar = TimeWheelSelectionBar
InteractiveTimeWheel.Separator = TimeWheelSeparator
InteractiveTimeWheel.Remaining = CalendarRemaining

TimeWheel.Column = DrumColumn
TimeWheel.Toggle = TimeWheelModeToggle
TimeWheel.SelectionBar = TimeWheelSelectionBar
TimeWheel.Separator = TimeWheelSeparator
TimeWheel.Interactive = InteractiveTimeWheel
TimeWheel.Remaining = CalendarRemaining

export { DrumColumn, type DrumColumnProps }

export const { Context: InteractiveTimeWheelContext, useCompoundContext: useInteractiveTimeWheelContext } =
  createCompoundContext<any>('InteractiveTimeWheel')
