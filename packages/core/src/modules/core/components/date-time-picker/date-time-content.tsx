import React, {
  useCallback,
  useMemo,
  useState,
  type HTMLAttributes,
} from 'react'
import {
  CalendarDaysIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import {
  CalendarDate,
  endOfMonth,
  getLocalTimeZone,
  startOfMonth,
  today,
  type DateValue,
} from '@internationalized/date'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Button, type ButtonProps } from '../button'
import {
  Calendar,
  CalendarCellIndicator,
  CalendarRemaining,
  type CalendarCellIndicatorProps,
  type CalendarProps,
  type CalendarRemainingProps,
} from '../calendar/calendar'
import {
  useDateTime,
  effectiveTimeBounds,
  type DateTimeBound,
  type DateTimeParts,
  type DateTimeRangeParts,
  type DateTimeValue,
} from '../../hooks/use-date-time'
import { RangeCalendar, type RangeCalendarProps } from '../calendar/range-calendar'
import {
  InteractiveTimeWheel,
  type InteractiveTimeWheelProps,
  type TimeObject,
} from '../time-wheel'

/* ==========================================================================
   DateTime Interfaces & Types & Context
   ========================================================================== */

export type DateTimeSelection = DateTimeParts
export type DateTimeRangeSelection = DateTimeRangeParts
export type DateTimePickerValue = DateTimeValue
export type { DateTimeBound }

export interface DateTimePreset {
  /** Unique preset identifier. */
  id: string
  /** Display label for the preset chip. */
  label: string
  /** Factory function producing the preset value payload. */
  getValue: () => DateTimePickerValue
}

export interface DateTimeContentContextValue {
  tab: 'date' | 'time'
  setTab: (tab: 'date' | 'time') => void
  timeTarget: 'synced' | 'start' | 'end'
  setTimeTarget: (target: 'synced' | 'start' | 'end') => void
  is24Hour: boolean
  setIs24Hour: (is24h: boolean) => void
  activePresetId: string | null
  presets: DateTimePreset[]
  applyPreset: (preset: DateTimePreset) => void
  showTime: boolean
  range: boolean
  showSeconds: boolean
  minuteStep: number
  showRemaining: boolean
  dt: ReturnType<typeof useDateTime>
  resolvedValue: DateTimePickerValue | null
  handleSingleDateChange: (newDate: DateValue | null) => void
  handleRangeDateChange: (newRange: { start: DateValue; end: DateValue } | null) => void
  handleSingleTimeChange: (newTime: TimeObject) => void
  handleRangeTimeChange: (newTime: TimeObject) => void
  handleClear: () => void
  onDone?: () => void
  minValue?: DateTimeBound
  maxValue?: DateTimeBound
  minTime?: TimeObject | null
  maxTime?: TimeObject | null
  slots: SlotComponents<DateTimeContentSlots>
  slotProps: SlotPropsMap<DateTimeContentSlots>
}

export const DateTimeContentContext = React.createContext<DateTimeContentContextValue | null>(null)

export function useDateTimeContent(): DateTimeContentContextValue | null {
  return React.useContext(DateTimeContentContext)
}

/* ==========================================================================
   DateTimePresets Sub-Atom & Props
   ========================================================================== */

export interface DateTimePresetsProps extends HTMLAttributes<HTMLDivElement> {
  /** List of presets to display. Defaults to context presets. */
  presets?: DateTimePreset[]
  /** Currently active preset id. Defaults to context activePresetId. */
  activePresetId?: string | null
  /** Callback when preset is clicked. Defaults to context applyPreset. */
  onSelectPreset?: (preset: DateTimePreset) => void
  /** Custom CSS classes. */
  className?: string
}

const DateTimePresetsPrimitive = ({
  presets: propPresets,
  activePresetId: propActivePresetId,
  onSelectPreset: propOnSelectPreset,
  className,
  ...props
}: DateTimePresetsProps) => {
  const ctx = useDateTimeContent()
  const presets = propPresets ?? ctx?.presets ?? []
  const activePresetId =
    propActivePresetId !== undefined ? propActivePresetId : (ctx?.activePresetId ?? null)
  const onSelectPreset = propOnSelectPreset ?? ctx?.applyPreset

  if (!presets.length) return null

  return (
    <div
      data-slot="date-time-presets"
      className={cn(
        'flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 border-border pb-2 touch-pan-x',
        className
      )}
      {...props}
    >
      {presets.map((p) => {
        const isSelected = activePresetId === p.id
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelectPreset?.(p)}
            className={cn(
              'cursor-pointer shrink-0 rounded-micro px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap border',
              isSelected
                ? 'bg-primary text-primary-fg border-primary font-semibold'
                : 'bg-muted/40 text-muted-fg border-border hover:bg-muted hover:text-fg'
            )}
          >
            {p.label}
          </button>
        )
      })}
    </div>
  )
}

export const DateTimePresets = createInterfaceComponent<DateTimePresetsProps>(
  {
    name: 'DateTimePresets',
    category: 'form',
    description: 'Quick jump preset chips row for rapid temporal range and single date selection.',
    version: '1.0.0',
  },
  DateTimePresetsPrimitive
)

/* ==========================================================================
   DateTimeTabs Sub-Atom & Props
   ========================================================================== */

export interface DateTimeTabsProps extends HTMLAttributes<HTMLDivElement> {
  /** Current active tab: date or time. Defaults to context tab. */
  activeTab?: 'date' | 'time'
  /** Callback fired when tab switches. Defaults to context setTab. */
  onTabChange?: (tab: 'date' | 'time') => void
  /** Custom CSS classes. */
  className?: string
}

const DateTimeTabsPrimitive = ({
  activeTab: propActiveTab,
  onTabChange: propOnTabChange,
  className,
  ...props
}: DateTimeTabsProps) => {
  const ctx = useDateTimeContent()
  const activeTab = propActiveTab ?? ctx?.tab ?? 'date'
  const onTabChange = propOnTabChange ?? ctx?.setTab

  return (
    <div
      data-slot="date-time-tabs"
      className={cn('flex items-center rounded-base bg-muted/50 p-1 border border-border', className)}
      {...props}
    >
      <button
        type="button"
        onPointerDown={(e) => {
          e.stopPropagation()
          onTabChange?.('date')
        }}
        onClick={() => onTabChange?.('date')}
        className={cn(
          'flex items-center justify-center gap-1.5 cursor-pointer rounded-micro py-1.5 sm:py-1 text-xs font-medium transition-colors flex-1',
          activeTab === 'date'
            ? 'bg-card text-fg font-semibold border border-border/60'
            : 'text-muted-fg hover:text-fg'
        )}
      >
        <CalendarDaysIcon className="size-3.5" />
        <span>Date</span>
      </button>
      <button
        type="button"
        onPointerDown={(e) => {
          e.stopPropagation()
          onTabChange?.('time')
        }}
        onClick={() => onTabChange?.('time')}
        className={cn(
          'flex items-center justify-center gap-1.5 cursor-pointer rounded-micro py-1.5 sm:py-1 text-xs font-medium transition-colors flex-1',
          activeTab === 'time'
            ? 'bg-card text-fg font-semibold border border-border/60'
            : 'text-muted-fg hover:text-fg'
        )}
      >
        <ClockIcon className="size-3.5" />
        <span>Time</span>
      </button>
    </div>
  )
}

export const DateTimeTabs = createInterfaceComponent<DateTimeTabsProps>(
  {
    name: 'DateTimeTabs',
    category: 'form',
    description: 'Segmented date vs time tab bar switcher.',
    version: '1.0.0',
  },
  DateTimeTabsPrimitive
)

/* ==========================================================================
   DateTimeTimeTarget Sub-Atom & Props
   ========================================================================== */

export interface DateTimeTimeTargetProps extends HTMLAttributes<HTMLDivElement> {
  /** Active target mode: synced, start, or end. Defaults to context timeTarget. */
  timeTarget?: 'synced' | 'start' | 'end'
  /** Callback fired when target mode changes. Defaults to context setTimeTarget. */
  onTargetChange?: (target: 'synced' | 'start' | 'end') => void
  /** Custom CSS classes. */
  className?: string
}

const DateTimeTimeTargetPrimitive = ({
  timeTarget: propTimeTarget,
  onTargetChange: propOnTargetChange,
  className,
  ...props
}: DateTimeTimeTargetProps) => {
  const ctx = useDateTimeContent()
  const timeTarget = propTimeTarget ?? ctx?.timeTarget ?? 'synced'
  const onTargetChange = propOnTargetChange ?? ctx?.setTimeTarget

  return (
    <div
      data-slot="date-time-time-target"
      className={cn(
        'flex items-center rounded-base bg-muted/50 p-1 border border-border w-full justify-around mb-1',
        className
      )}
      {...props}
    >
      <button
        type="button"
        onClick={() => onTargetChange?.('synced')}
        className={cn(
          'flex items-center justify-center gap-1 cursor-pointer rounded-micro py-1.5 sm:py-1 text-xs font-medium transition-colors flex-1',
          timeTarget === 'synced'
            ? 'bg-card text-fg font-semibold border border-border/60'
            : 'text-muted-fg hover:text-fg'
        )}
      >
        <span>Synced</span>
      </button>
      <button
        type="button"
        onClick={() => onTargetChange?.('start')}
        className={cn(
          'flex items-center justify-center gap-1 cursor-pointer rounded-micro py-1.5 sm:py-1 text-xs font-medium transition-colors flex-1',
          timeTarget === 'start'
            ? 'bg-card text-fg font-semibold border border-border/60'
            : 'text-muted-fg hover:text-fg'
        )}
      >
        <span>Start</span>
      </button>
      <button
        type="button"
        onClick={() => onTargetChange?.('end')}
        className={cn(
          'flex items-center justify-center gap-1 cursor-pointer rounded-micro py-1.5 sm:py-1 text-xs font-medium transition-colors flex-1',
          timeTarget === 'end'
            ? 'bg-card text-fg font-semibold border border-border/60'
            : 'text-muted-fg hover:text-fg'
        )}
      >
        <span>End</span>
      </button>
    </div>
  )
}

export const DateTimeTimeTarget = createInterfaceComponent<DateTimeTimeTargetProps>(
  {
    name: 'DateTimeTimeTarget',
    category: 'form',
    description: 'Target temporal boundary switcher (Synced, Start, End) for range time selection.',
    version: '1.0.0',
  },
  DateTimeTimeTargetPrimitive
)

/* ==========================================================================
   DateTimeFooter Sub-Atom, Slots & Props
   ========================================================================== */

export interface DateTimeFooterSlots {
  /** Clear value button. */
  clearButton?: React.ComponentType<ButtonProps>
  /** Done / Next action button. */
  doneButton?: React.ComponentType<ButtonProps>
}

export interface DateTimeFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Current tab view. Defaults to context tab. */
  tab?: 'date' | 'time'
  /** Whether time mode is active. Defaults to context showTime. */
  showTime?: boolean
  /** Handler when clear is clicked. Defaults to context handleClear. */
  onClear?: () => void
  /** Handler when primary action is clicked. Defaults to context setTab or onDone. */
  onAction?: () => void
  /** Custom CSS classes. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<DateTimeFooterSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<DateTimeFooterSlots>
}

const DateTimeFooterPrimitive = ({
  tab: propTab,
  showTime: propShowTime,
  onClear: propOnClear,
  onAction: propOnAction,
  className,
  slots = {},
  slotProps = {},
  ...props
}: DateTimeFooterProps) => {
  const ctx = useDateTimeContent()
  const tab = propTab ?? ctx?.tab ?? 'date'
  const showTime = propShowTime ?? ctx?.showTime ?? true
  const onClear = propOnClear ?? ctx?.handleClear
  const onAction =
    propOnAction ??
    (() => {
      if (showTime && tab === 'date') {
        ctx?.setTab('time')
      } else {
        ctx?.onDone?.()
      }
    })

  const defaultClearBtn = (
    <Button
      type="button"
      slot={null}
      intent="plain"
      size="xs"
      onPress={onClear}
      className="flex-1 justify-center rounded-base h-8"
      {...slotProps.clearButton}
    >
      Clear
    </Button>
  )

  const defaultDoneBtn = (
    <Button
      type="button"
      slot={null}
      intent="primary"
      size="xs"
      onPress={onAction}
      className="flex-1 justify-center rounded-base h-8"
      {...slotProps.doneButton}
    >
      {showTime && tab === 'date' ? 'Next' : 'Done'}
    </Button>
  )

  return (
    <div
      data-slot="date-time-footer"
      className={cn('flex items-center justify-between gap-space-sm border-t border-border pt-2.5 mt-0.5', className)}
      {...props}
    >
      {slots.clearButton ? renderSlot(slots.clearButton, slotProps.clearButton) : defaultClearBtn}
      {slots.doneButton ? renderSlot(slots.doneButton, slotProps.doneButton) : defaultDoneBtn}
    </div>
  )
}

export const DateTimeFooter = createInterfaceComponent<DateTimeFooterProps, DateTimeFooterSlots>(
  {
    name: 'DateTimeFooter',
    category: 'form',
    description: 'Action footer bar housing Clear and Done/Next buttons.',
    version: '1.0.0',
    slots: {
      clearButton: undefined,
      doneButton: undefined,
    },
  },
  DateTimeFooterPrimitive
)

/* ==========================================================================
   DateTimeCalendar Compound Sub-Component
   ========================================================================== */

export interface DateTimeCalendarProps {
  /** Custom CSS classes. */
  className?: string
  /** Injected slots overrides. */
  slots?: SlotComponents<any>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<any>
}

const DateTimeCalendarPrimitive = ({ className, slots, slotProps }: DateTimeCalendarProps) => {
  const ctx = useDateTimeContent()
  if (!ctx) return null
  const {
    range,
    dt,
    handleRangeDateChange,
    handleSingleDateChange,
    showRemaining,
    slots: parentSlots,
    slotProps: parentSlotProps,
  } = ctx

  return (
    <div className={cn('flex justify-center py-1 w-full overflow-x-auto', className)}>
      {range ? (
        <RangeCalendar
          aria-label="Select Date Range"
          {...dt.helpers.rangeCalendarProps}
          onChange={handleRangeDateChange as any}
          showRemaining={showRemaining}
          slots={{
            cellIndicator: parentSlots.cellIndicator,
            remaining: parentSlots.remaining,
            ...(slots as any),
          }}
          slotProps={(slotProps as any) ?? parentSlotProps.calendar?.slotProps}
        />
      ) : (
        <Calendar
          aria-label="Select Date"
          {...dt.helpers.calendarProps}
          onChange={handleSingleDateChange as any}
          showRemaining={showRemaining}
          slots={{
            cellIndicator: parentSlots.cellIndicator,
            remaining: parentSlots.remaining,
            ...(slots as any),
          }}
          slotProps={(slotProps as any) ?? parentSlotProps.calendar?.slotProps}
        />
      )}
    </div>
  )
}

export const DateTimeCalendar = createInterfaceComponent<DateTimeCalendarProps>(
  {
    name: 'DateTimeCalendar',
    category: 'form',
    description: 'Context-connected calendar view for DateTimeContent compound composition.',
    version: '1.0.0',
  },
  DateTimeCalendarPrimitive
)

/* ==========================================================================
   DateTimeTimeWheel Compound Sub-Component
   ========================================================================== */

export interface DateTimeTimeWheelProps extends Partial<InteractiveTimeWheelProps> {
  /** Custom CSS classes. */
  className?: string
}

const DateTimeTimeWheelPrimitive = ({ className, ...props }: DateTimeTimeWheelProps) => {
  const ctx = useDateTimeContent()
  if (!ctx) return null
  const {
    range,
    timeTarget,
    setTimeTarget,
    is24Hour,
    setIs24Hour,
    showSeconds,
    minuteStep,
    minValue,
    maxValue,
    minTime,
    maxTime,
    showRemaining,
    handleSingleTimeChange,
    handleRangeTimeChange,
    slots: parentSlots,
    slotProps: parentSlotProps,
    resolvedValue,
  } = ctx

  const defaultRangeValue: DateTimeRangeSelection = {
    start: { date: today(getLocalTimeZone()), time: { hour: 9, minute: 0, second: 0 } },
    end: { date: today(getLocalTimeZone()).add({ days: 7 }), time: { hour: 17, minute: 0, second: 0 } },
  }
  const defaultSingleValue: DateTimeSelection = {
    date: today(getLocalTimeZone()),
    time: { hour: 19, minute: 0, second: 0 },
  }

  return (
    <div className={cn('flex flex-col items-center gap-space-xs py-1 w-full', className)}>
      {range && (
        <DateTimeTimeTarget
          timeTarget={timeTarget}
          onTargetChange={setTimeTarget}
        />
      )}
      {(() => {
        if (range) {
          const r =
            resolvedValue && 'start' in resolvedValue
              ? (resolvedValue as DateTimeRangeSelection)
              : defaultRangeValue
          const targetItem = timeTarget === 'end' ? r.end : r.start
          const time =
            targetItem?.time ??
            (timeTarget === 'end'
              ? { hour: 17, minute: 0, second: 0 }
              : { hour: 9, minute: 0, second: 0 })
          const bounds = effectiveTimeBounds(targetItem?.date, minValue, maxValue, minTime, maxTime)

          return (
            <InteractiveTimeWheel
              value={time}
              onChange={handleRangeTimeChange}
              is24Hour={is24Hour}
              onToggle24Hour={setIs24Hour}
              showSeconds={showSeconds}
              minuteStep={minuteStep}
              minTime={bounds.minTime}
              maxTime={bounds.maxTime}
              showRemaining={showRemaining}
              slots={{ remaining: parentSlots.remaining, ...parentSlotProps.timeWheel?.slots }}
              slotProps={parentSlotProps.timeWheel?.slotProps}
              {...parentSlotProps.timeWheel}
              {...props}
            />
          )
        }

        const s =
          resolvedValue && 'date' in resolvedValue
            ? (resolvedValue as DateTimeSelection)
            : defaultSingleValue
        const singleTime: TimeObject = s.time ?? { hour: 19, minute: 0, second: 0 }
        const singleBounds = effectiveTimeBounds(s.date, minValue, maxValue, minTime, maxTime)
        return (
          <InteractiveTimeWheel
            value={singleTime}
            onChange={handleSingleTimeChange}
            is24Hour={is24Hour}
            onToggle24Hour={setIs24Hour}
            showSeconds={showSeconds}
            minuteStep={minuteStep}
            minTime={singleBounds.minTime}
            maxTime={singleBounds.maxTime}
            showRemaining={showRemaining}
            slots={{ remaining: parentSlots.remaining, ...parentSlotProps.timeWheel?.slots }}
            slotProps={parentSlotProps.timeWheel?.slotProps}
            {...parentSlotProps.timeWheel}
            {...props}
          />
        )
      })()}
    </div>
  )
}

export const DateTimeTimeWheel = createInterfaceComponent<DateTimeTimeWheelProps>(
  {
    name: 'DateTimeTimeWheel',
    category: 'form',
    description: 'Context-connected time wheel view for DateTimeContent compound composition.',
    version: '1.0.0',
  },
  DateTimeTimeWheelPrimitive
)

export interface DateTimeContentSlots {
  /** Presets quick jump bar slot. */
  presets?: React.ComponentType<DateTimePresetsProps>
  /** Segmented Date vs Time tab switcher slot. */
  tabs?: React.ComponentType<DateTimeTabsProps>
  /** Range time boundary target switcher slot. */
  timeTarget?: React.ComponentType<DateTimeTimeTargetProps>
  /** Date calendar view slot (Calendar or RangeCalendar). */
  calendar?: React.ComponentType<CalendarProps<any>> | React.ComponentType<RangeCalendarProps<any>>
  /** Time wheel view slot. */
  timeWheel?: React.ComponentType<InteractiveTimeWheelProps>
  /** Action footer bar slot. */
  footer?: React.ComponentType<DateTimeFooterProps>
  /** Clear button slot inside footer. */
  clearButton?: React.ComponentType<ButtonProps>
  /** Done button slot inside footer. */
  doneButton?: React.ComponentType<ButtonProps>
  /** Current-day marker inside the embedded calendar. */
  cellIndicator?: React.ComponentType<CalendarCellIndicatorProps>
  /** Remaining-time caption (calendar and/or time wheel). */
  remaining?: React.ComponentType<CalendarRemainingProps>
}

export interface DateTimeContentProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue' | 'children'> {
  /** Optional custom child composition (using compound components or render prop). When omitted, renders default slotted layout. */
  children?: React.ReactNode | ((context: DateTimeContentContextValue) => React.ReactNode)
  /** Enable date & time range selection */
  range?: boolean
  /** Enable / disable time selection */
  showTime?: boolean
  /** Display day of week name (e.g. Thu, Fri) */
  showDayName?: boolean
  /** Default to 24-hour mode */
  is24Hour?: boolean
  /** Show seconds wheel column */
  showSeconds?: boolean
  /** Minute step interval (e.g. 1, 5, 10, 15) */
  minuteStep?: number
  /** Currently selected value (controlled) */
  value?: DateTimePickerValue
  /** Default selected value (uncontrolled) */
  defaultValue?: DateTimePickerValue
  /** Callback fired on date/time change */
  onChange?: (value: DateTimePickerValue) => void
  /** Display quick jump presets bar */
  showPresets?: boolean
  /** Custom presets array */
  customPresets?: DateTimePreset[]
  /** Action button callbacks */
  onClear?: () => void
  /** Callback when user finishes selection (Done / Apply) */
  onDone?: () => void
  /** Show or hide action footer */
  showFooter?: boolean
  /** Inclusive minimum date or date+time. */
  minValue?: DateTimeBound
  /** Inclusive maximum date or date+time. */
  maxValue?: DateTimeBound
  /** Inclusive minimum time-of-day (used when the selected date is unbounded). */
  minTime?: TimeObject | null
  /** Inclusive maximum time-of-day (used when the selected date is unbounded). */
  maxTime?: TimeObject | null
  /** Show remaining time until maxValue / maxTime. */
  showRemaining?: boolean
  /** Custom container CSS classes. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<DateTimeContentSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<DateTimeContentSlots>
}

const DateTimeContentPrimitive = ({
  children,
  range = false,
  showTime = true,
  showDayName = false,
  is24Hour: initial24Hour = false,
  showSeconds = false,
  minuteStep = 5,
  value: controlledValue,
  defaultValue,
  onChange,
  showPresets = true,
  customPresets,
  onClear,
  onDone,
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
}: DateTimeContentProps) => {
  const [tab, setTab] = useState<'date' | 'time'>('date')
  const [timeTarget, setTimeTarget] = useState<'synced' | 'start' | 'end'>('synced')
  const [is24Hour, setIs24Hour] = useState(initial24Hour)
  const [activePresetId, setActivePresetId] = useState<string | null>(null)

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

  const dt = useDateTime({
    value: controlledValue,
    defaultValue: defaultValue ?? (range ? defaultRangeValue : defaultSingleValue),
    onChange,
    range,
    minValue,
    maxValue,
    minTime,
    maxTime,
    defaultTime: { hour: 19, minute: 0, second: 0 },
    defaultStartTime: { hour: 9, minute: 0, second: 0 },
    defaultEndTime: { hour: 17, minute: 0, second: 0 },
  })

  const resolvedValue = dt.state.value

  const handleSingleDateChange = useCallback(
    (newDate: DateValue | null) => {
      setActivePresetId(null)
      dt.actions.setDate(newDate)
      if (showTime) setTab('time')
    },
    [dt.actions, showTime]
  )

  const handleRangeDateChange = useCallback(
    (newRange: { start: DateValue; end: DateValue } | null) => {
      setActivePresetId(null)
      dt.actions.setRange(newRange)
      if (showTime) setTab('time')
    },
    [dt.actions, showTime]
  )

  const handleSingleTimeChange = useCallback(
    (newTime: TimeObject) => {
      dt.actions.setTime(newTime)
    },
    [dt.actions]
  )

  const handleRangeTimeChange = useCallback(
    (newTime: TimeObject) => {
      const start = dt.state.start ?? defaultRangeValue.start
      const end = dt.state.end ?? defaultRangeValue.end
      if (timeTarget === 'synced') {
        dt.actions.setValue({
          start: { date: start.date, time: newTime },
          end: { date: end.date, time: newTime },
        })
      } else if (timeTarget === 'start') {
        dt.actions.setValue({
          start: { date: start.date, time: newTime },
          end,
        })
      } else {
        dt.actions.setValue({
          start,
          end: { date: end.date, time: newTime },
        })
      }
    },
    [dt.actions, dt.state.start, dt.state.end, defaultRangeValue.start, defaultRangeValue.end, timeTarget]
  )

  const handleClear = useCallback(() => {
    setActivePresetId(null)
    dt.actions.clear()
    onClear?.()
  }, [dt.actions, onClear])

  const applyPreset = useCallback(
    (preset: DateTimePreset) => {
      setActivePresetId(preset.id)
      dt.actions.setValue(preset.getValue())
      if (showTime) setTab('time')
    },
    [dt.actions, showTime]
  )

  const defaultPresets = useMemo<DateTimePreset[]>(() => {
    const tz = getLocalTimeZone()
    const todayDate = today(tz)

    if (range) {
      const yesterday = todayDate.subtract({ days: 1 })
      const startOfCurrMonth = startOfMonth(todayDate)
      const endOfCurrMonth = endOfMonth(todayDate)

      return [
        {
          id: 'today',
          label: 'Today',
          getValue: () => ({
            start: { date: todayDate, time: { hour: 9, minute: 0 } },
            end: { date: todayDate, time: { hour: 17, minute: 0 } },
          }),
        },
        {
          id: 'yesterday',
          label: 'Yesterday',
          getValue: () => ({
            start: { date: yesterday, time: { hour: 9, minute: 0 } },
            end: { date: yesterday, time: { hour: 17, minute: 0 } },
          }),
        },
        {
          id: 'next_7',
          label: 'Next 7 Days',
          getValue: () => ({
            start: { date: todayDate, time: { hour: 9, minute: 0 } },
            end: { date: todayDate.add({ days: 7 }), time: { hour: 17, minute: 0 } },
          }),
        },
        {
          id: 'last_7',
          label: 'Last 7 Days',
          getValue: () => ({
            start: { date: todayDate.subtract({ days: 7 }), time: { hour: 9, minute: 0 } },
            end: { date: todayDate, time: { hour: 17, minute: 0 } },
          }),
        },
        {
          id: 'this_month',
          label: 'This Month',
          getValue: () => ({
            start: { date: startOfCurrMonth, time: { hour: 9, minute: 0 } },
            end: { date: endOfCurrMonth, time: { hour: 17, minute: 0 } },
          }),
        },
        {
          id: 'next_30',
          label: 'Next 30 Days',
          getValue: () => ({
            start: { date: todayDate, time: { hour: 9, minute: 0 } },
            end: { date: todayDate.add({ days: 30 }), time: { hour: 17, minute: 0 } },
          }),
        },
        {
          id: 'last_30',
          label: 'Last 30 Days',
          getValue: () => ({
            start: { date: todayDate.subtract({ days: 30 }), time: { hour: 9, minute: 0 } },
            end: { date: todayDate, time: { hour: 17, minute: 0 } },
          }),
        },
      ]
    }

    const tomorrow = todayDate.add({ days: 1 })
    const nextWeek = todayDate.add({ days: 7 })
    const inTwoWeeks = todayDate.add({ days: 14 })
    const nextMonth = todayDate.add({ months: 1 })

    return [
      {
        id: 'today',
        label: 'Today',
        getValue: () => ({
          date: todayDate,
          time: { hour: 19, minute: 0 },
        }),
      },
      {
        id: 'tomorrow',
        label: 'Tomorrow',
        getValue: () => ({
          date: tomorrow,
          time: { hour: 19, minute: 0 },
        }),
      },
      {
        id: 'weekend',
        label: 'This Weekend',
        getValue: () => {
          const jsDate = todayDate.toDate(tz)
          const dayOfWeek = jsDate.getDay()
          const daysToSat = (6 - dayOfWeek + 7) % 7 || 7
          return {
            date: todayDate.add({ days: daysToSat }),
            time: { hour: 10, minute: 0 },
          }
        },
      },
      {
        id: 'next_week',
        label: 'Next Week',
        getValue: () => ({
          date: nextWeek,
          time: { hour: 19, minute: 0 },
        }),
      },
      {
        id: 'in_2_weeks',
        label: 'In 2 Weeks',
        getValue: () => ({
          date: inTwoWeeks,
          time: { hour: 19, minute: 0 },
        }),
      },
      {
        id: 'next_month',
        label: 'Next Month',
        getValue: () => ({
          date: nextMonth,
          time: { hour: 19, minute: 0 },
        }),
      },
    ]
  }, [range])

  const presetsToRender = customPresets || defaultPresets

  const defaultTimeTarget = (
    <DateTimeTimeTarget
      timeTarget={timeTarget}
      onTargetChange={(target) => {
        setTimeTarget(target)
        if (target === 'synced') {
          const current = (resolvedValue as DateTimeRangeSelection) || defaultRangeValue
          dt.actions.setValue({
            start: current.start,
            end: {
              ...current.end,
              time: current.start.time,
            },
          })
        }
      }}
      {...slotProps.timeTarget}
    />
  )

  const contextValue = useMemo<DateTimeContentContextValue>(
    () => ({
      tab,
      setTab,
      timeTarget,
      setTimeTarget,
      is24Hour,
      setIs24Hour,
      activePresetId,
      presets: presetsToRender,
      applyPreset,
      showTime,
      range,
      showSeconds,
      minuteStep,
      showRemaining,
      dt,
      resolvedValue,
      handleSingleDateChange,
      handleRangeDateChange,
      handleSingleTimeChange,
      handleRangeTimeChange,
      handleClear,
      onDone,
      minValue,
      maxValue,
      minTime,
      maxTime,
      slots,
      slotProps,
    }),
    [
      tab,
      timeTarget,
      is24Hour,
      activePresetId,
      presetsToRender,
      applyPreset,
      showTime,
      range,
      showSeconds,
      minuteStep,
      showRemaining,
      dt,
      resolvedValue,
      handleSingleDateChange,
      handleRangeDateChange,
      handleSingleTimeChange,
      handleRangeTimeChange,
      handleClear,
      onDone,
      minValue,
      maxValue,
      minTime,
      maxTime,
      slots,
      slotProps,
    ]
  )

  return (
    <DateTimeContentContext.Provider value={contextValue}>
      <div
        data-slot="date-time-content"
        className={cn(
          'w-full max-w-[340px] sm:max-w-[316px] flex flex-col gap-space-sm p-space-md sm:p-2.5 rounded-macro border border-border bg-card',
          className
        )}
        {...props}
      >
        {children ? (
          typeof children === 'function' ? (
            children(contextValue)
          ) : (
            children
          )
        ) : (
          <>
            {/* Presets Row */}
            {showPresets && presetsToRender.length > 0 &&
              renderSlot(
                slots.presets,
                {
                  presets: presetsToRender,
                  activePresetId,
                  onSelectPreset: applyPreset,
                  ...slotProps.presets,
                },
                { defaultComponent: DateTimePresets }
              )}

            {/* Date vs Time Segmented Tabs */}
            {showTime &&
              renderSlot(
                slots.tabs,
                {
                  activeTab: tab,
                  onTabChange: setTab,
                  ...slotProps.tabs,
                },
                { defaultComponent: DateTimeTabs }
              )}

            {/* TAB 1: DATE */}
            {tab === 'date' && (
              <div className="flex justify-center py-1 w-full overflow-x-auto">
                {slots.calendar ? (
                  renderSlot(slots.calendar, {
                    ...(range ? dt.helpers.rangeCalendarProps : dt.helpers.calendarProps),
                    onChange: (range ? handleRangeDateChange : handleSingleDateChange) as any,
                    showRemaining,
                    slots: {
                      cellIndicator: slots.cellIndicator,
                      remaining: slots.remaining,
                      ...slotProps.calendar?.slots,
                    },
                    ...slotProps.calendar,
                  } as any)
                ) : range ? (
                  <RangeCalendar
                    aria-label="Select Date Range"
                    {...dt.helpers.rangeCalendarProps}
                    onChange={handleRangeDateChange as any}
                    showRemaining={showRemaining}
                    slots={{
                      cellIndicator: slots.cellIndicator,
                      remaining: slots.remaining,
                      ...slotProps.calendar?.slots,
                    }}
                    slotProps={slotProps.calendar?.slotProps}
                    {...slotProps.calendar}
                  />
                ) : (
                  <Calendar
                    aria-label="Select Date"
                    {...dt.helpers.calendarProps}
                    onChange={handleSingleDateChange as any}
                    showRemaining={showRemaining}
                    slots={{
                      cellIndicator: slots.cellIndicator,
                      remaining: slots.remaining,
                      ...slotProps.calendar?.slots,
                    }}
                    slotProps={slotProps.calendar?.slotProps}
                    {...slotProps.calendar}
                  />
                )}
              </div>
            )}

            {/* TAB 2: TIME */}
            {tab === 'time' && showTime && (
              <div className="flex flex-col items-center gap-2 py-1 w-full">
                {range &&
                  (slots.timeTarget
                    ? renderSlot(slots.timeTarget, {
                        timeTarget,
                        onTargetChange: (target) => {
                          setTimeTarget(target)
                          if (target === 'synced') {
                            const current = (resolvedValue as DateTimeRangeSelection) || defaultRangeValue
                            dt.actions.setValue({
                              start: current.start,
                              end: {
                                ...current.end,
                                time: current.start.time,
                              },
                            })
                          }
                        },
                        ...slotProps.timeTarget,
                      })
                    : defaultTimeTarget)}

                {/* 3D Wheel Picker */}
                {(() => {
                  if (range) {
                    const r =
                      resolvedValue && 'start' in resolvedValue
                        ? (resolvedValue as DateTimeRangeSelection)
                        : defaultRangeValue
                    const currentActiveTime: TimeObject =
                      (timeTarget === 'end' ? r.end?.time : r.start?.time) ??
                      (timeTarget === 'end'
                        ? { hour: 17, minute: 0, second: 0 }
                        : { hour: 9, minute: 0, second: 0 })
                    const activeDate = timeTarget === 'end' ? r.end?.date : r.start?.date
                    const wheelBounds = effectiveTimeBounds(activeDate, minValue, maxValue, minTime, maxTime)

                    return slots.timeWheel ? (
                      renderSlot(slots.timeWheel, {
                        value: currentActiveTime,
                        onChange: handleRangeTimeChange,
                        is24Hour,
                        onToggle24Hour: setIs24Hour,
                        showSeconds,
                        minuteStep,
                        minTime: wheelBounds.minTime,
                        maxTime: wheelBounds.maxTime,
                        showRemaining,
                        slots: { remaining: slots.remaining, ...slotProps.timeWheel?.slots },
                        ...slotProps.timeWheel,
                      })
                    ) : (
                      <InteractiveTimeWheel
                        value={currentActiveTime}
                        onChange={handleRangeTimeChange}
                        is24Hour={is24Hour}
                        onToggle24Hour={setIs24Hour}
                        showSeconds={showSeconds}
                        minuteStep={minuteStep}
                        minTime={wheelBounds.minTime}
                        maxTime={wheelBounds.maxTime}
                        showRemaining={showRemaining}
                        slots={{ remaining: slots.remaining, ...slotProps.timeWheel?.slots }}
                        slotProps={slotProps.timeWheel?.slotProps}
                        {...slotProps.timeWheel}
                      />
                    )
                  }

                  const s =
                    resolvedValue && 'date' in resolvedValue
                      ? (resolvedValue as DateTimeSelection)
                      : defaultSingleValue
                  const singleTime: TimeObject = s.time ?? { hour: 19, minute: 0, second: 0 }
                  const singleBounds = effectiveTimeBounds(s.date, minValue, maxValue, minTime, maxTime)
                  return slots.timeWheel ? (
                    renderSlot(slots.timeWheel, {
                      value: singleTime,
                      onChange: handleSingleTimeChange,
                      is24Hour,
                      onToggle24Hour: setIs24Hour,
                      showSeconds,
                      minuteStep,
                      minTime: singleBounds.minTime,
                      maxTime: singleBounds.maxTime,
                      showRemaining,
                      slots: { remaining: slots.remaining, ...slotProps.timeWheel?.slots },
                      ...slotProps.timeWheel,
                    })
                  ) : (
                    <InteractiveTimeWheel
                      value={singleTime}
                      onChange={handleSingleTimeChange}
                      is24Hour={is24Hour}
                      onToggle24Hour={setIs24Hour}
                      showSeconds={showSeconds}
                      minuteStep={minuteStep}
                      minTime={singleBounds.minTime}
                      maxTime={singleBounds.maxTime}
                      showRemaining={showRemaining}
                      slots={{ remaining: slots.remaining, ...slotProps.timeWheel?.slots }}
                      slotProps={slotProps.timeWheel?.slotProps}
                      {...slotProps.timeWheel}
                    />
                  )
                })()}
              </div>
            )}

            {/* Bottom Actions Footer */}
            {showFooter &&
              renderSlot(
                slots.footer,
                {
                  tab,
                  showTime,
                  onClear: handleClear,
                  onAction: () => {
                    if (showTime && tab === 'date') {
                      setTab('time')
                    } else {
                      onDone?.()
                    }
                  },
                  slots: {
                    clearButton: slots.clearButton,
                    doneButton: slots.doneButton,
                    ...slotProps.footer?.slots,
                  },
                  slotProps: slotProps.footer?.slotProps,
                  ...slotProps.footer,
                },
                { defaultComponent: DateTimeFooter }
              )}
          </>
        )}
      </div>
    </DateTimeContentContext.Provider>
  )
}

export const DateTimeContent = createInterfaceComponent<
  DateTimeContentProps,
  DateTimeContentSlots
>(
  {
    name: 'DateTimeContent',
    category: 'form',
    description: 'Internal composite panel housing Calendar, TimeWheel, Presets bar, and Action controls.',
    version: '1.0.0',
    slots: {
      presets: DateTimePresets,
      tabs: DateTimeTabs,
      timeTarget: undefined,
      calendar: undefined,
      timeWheel: undefined,
      footer: DateTimeFooter,
      clearButton: undefined,
      doneButton: undefined,
      cellIndicator: undefined,
      remaining: undefined,
    },
  },
  DateTimeContentPrimitive
)

// Compound Subcomponent Attachments
DateTimeContent.Presets = DateTimePresets
DateTimeContent.Tabs = DateTimeTabs
DateTimeContent.TimeTarget = DateTimeTimeTarget
DateTimeContent.Calendar = DateTimeCalendar
DateTimeContent.TimeWheel = DateTimeTimeWheel
DateTimeContent.Footer = DateTimeFooter
DateTimeContent.CellIndicator = CalendarCellIndicator
DateTimeContent.Remaining = CalendarRemaining
