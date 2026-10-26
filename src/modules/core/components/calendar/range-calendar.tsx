import React from 'react'
import {
  RangeCalendar as RACRangeCalendar,
  type RangeCalendarProps as RACRangeCalendarProps,
  CalendarCell as RACCalendarCell,
  RangeCalendarStateContext,
  type DateValue,
} from 'react-aria-components'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import {
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeader,
  CalendarHeading,
  CalendarNavButton,
  CalendarHeaderCell,
  CalendarCell,
  CalendarCellIndicator,
  CalendarRemaining,
  type CalendarHeaderProps,
  type CalendarGridProps,
  type CalendarCellProps,
  type CalendarCellIndicatorProps,
  type CalendarRemainingProps,
  type CalendarMonthPickerProps,
  type CalendarYearPickerProps,
  type CalendarHeadingProps,
  type CalendarGridHeaderProps,
  type CalendarGridBodyProps,
} from './calendar'
import type { ButtonProps } from '../button'
import { remainingUntilDate } from './remaining'
import { sameDate, useStableDateRange, useStableDateValue, useStableDuration } from './date-value'

/* ==========================================================================
   RangeCalendar Slots & Props
   ========================================================================== */

export interface RangeCalendarSlots {
  /** Landmark header controls slot. */
  header?: React.ComponentType<CalendarHeaderProps>
  /** Landmark calendar grid matrix slot. */
  grid?: React.ComponentType<CalendarGridProps>
  /** Month dropdown picker slot. */
  monthPicker?: React.ComponentType<CalendarMonthPickerProps>
  /** Year dropdown picker slot. */
  yearPicker?: React.ComponentType<CalendarYearPickerProps>
  /** Previous month navigation button slot. */
  prevButton?: React.ComponentType<ButtonProps>
  /** Next month navigation button slot. */
  nextButton?: React.ComponentType<ButtonProps>
  /** Calendar heading title slot. */
  heading?: React.ComponentType<CalendarHeadingProps>
  /** Grid header days of week table row slot. */
  gridHeader?: React.ComponentType<CalendarGridHeaderProps>
  /** Grid body rows container slot. */
  gridBody?: React.ComponentType<CalendarGridBodyProps>
  /** Individual date range cell renderer slot. */
  cell?: React.ComponentType<CalendarCellProps>
  /** Current-day marker inside each cell. */
  cellIndicator?: React.ComponentType<CalendarCellIndicatorProps>
  /** Remaining-time caption below the grid. */
  remaining?: React.ComponentType<CalendarRemainingProps>
}

export interface RangeCalendarProps<T extends DateValue = DateValue>
  extends Omit<RACRangeCalendarProps<T>, 'children'> {
  /** Custom CSS classes for the range calendar container. */
  className?: string
  /** Optional custom child elements replacing standard header/grid layout. */
  children?: React.ReactNode
  /** Show a countdown until `maxValue`, falling back to the selected end date. */
  showRemaining?: boolean
  /** Injected slot component overrides. */
  slots?: SlotComponents<RangeCalendarSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<RangeCalendarSlots>
}

const RangeCalendarPrimitive = <T extends DateValue = DateValue>({
  visibleDuration = { months: 1 },
  className,
  children,
  showRemaining = false,
  slots = {},
  slotProps = {},
  minValue,
  maxValue,
  value,
  defaultValue,
  focusedValue,
  defaultFocusedValue,
  onChange,
  onFocusChange,
  ...props
}: RangeCalendarProps<T>) => {
  const stableDuration = useStableDuration(visibleDuration)
  const monthCount = stableDuration?.months ?? 1
  const stableMin = useStableDateValue(minValue)
  const stableMax = useStableDateValue(maxValue)
  const stableValue = useStableDateRange(value ?? null)
  const stableDefaultValue = useStableDateRange(defaultValue ?? null)
  const stableFocused = useStableDateValue(focusedValue)
  const stableDefaultFocused = useStableDateValue(defaultFocusedValue)

  const headerSlots = {
    monthPicker: slots.monthPicker,
    yearPicker: slots.yearPicker,
    prevButton: slots.prevButton,
    nextButton: slots.nextButton,
    heading: slots.heading,
    ...slotProps.header?.slots,
  }

  const gridSlots = {
    header: slots.gridHeader,
    body: slots.gridBody,
    cell: slots.cell,
    ...slotProps.grid?.slots,
  }

  return (
    <RACRangeCalendar
      data-slot="range-calendar"
      visibleDuration={stableDuration}
      className={cn('inline-block w-fit max-w-full p-space-xs sm:p-space-sm select-none', className)}
      minValue={stableMin}
      maxValue={stableMax}
      value={stableValue ?? undefined}
      defaultValue={stableDefaultValue ?? undefined}
      focusedValue={stableFocused}
      defaultFocusedValue={stableDefaultFocused}
      onChange={(next) => {
        if (
          sameDate(stableValue?.start ?? null, next?.start ?? null) &&
          sameDate(stableValue?.end ?? null, next?.end ?? null)
        ) {
          return
        }
        onChange?.(next)
      }}
      onFocusChange={(next) => {
        if (sameDate(stableFocused ?? null, next ?? null)) return
        onFocusChange?.(next)
      }}
      {...props}
    >
      <RangeCalendarInner showRemaining={showRemaining} slots={slots} slotProps={slotProps}>
      {children || (
        <>
          {renderSlot(
            slots.header,
            { slots: headerSlots, ...slotProps.header },
            { defaultComponent: CalendarHeader }
          )}
          <div className="flex snap-x items-start justify-stretch gap-space-lg overflow-auto">
            {Array.from({ length: monthCount }).map((_, index) => {
              const id = index + 1
              return (
                <CalendarGrid
                  key={index}
                  offset={id >= 2 ? { months: id - 1 } : undefined}
                  {...slotProps.grid}
                >
                  <CalendarGridHeader />
                  <CalendarGridBody className="snap-start">
                    {(date) =>
                      slots.cell ? (
                        renderSlot(slots.cell, { date, ...slotProps.cell }) as React.ReactElement
                      ) : (
                        <RACCalendarCell
                          date={date}
                          className="shrink-0 [--cell-fg:var(--color-primary-subtle-fg)] [--cell:var(--color-primary-subtle)] group/calendar-cell relative size-8 shrink-0 cursor-pointer text-xs leading-none outline-hidden sm:size-9 sm:text-sm selection-start:rounded-s-micro selection-end:rounded-e-micro data-outside-month:text-muted-fg selected:bg-(--cell) selected:text-(--cell-fg) invalid:selected:bg-danger-subtle [td:first-child_&]:rounded-s-micro [td:last-child_&]:rounded-e-micro forced-colors:selected:bg-[Highlight] forced-colors:selected:text-[HighlightText] forced-colors:invalid:selected:bg-[Mark]"
                        >
                          {({
                            formattedDate,
                            isSelected,
                            isSelectionStart,
                            isSelectionEnd,
                            isDisabled,
                            isToday,
                          }) => (
                            <span
                              className={cn(
                                'relative flex size-full items-center justify-center rounded-micro tabular-nums forced-color-adjust-none transition-colors',
                                isSelected && (isSelectionStart || isSelectionEnd)
                                  ? 'bg-primary text-primary-fg group-invalid/calendar-cell:bg-danger group-invalid/calendar-cell:text-danger-fg forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]'
                                  : isSelected
                                    ? [
                                      'group-hover/calendar-cell:bg-primary/20',
                                      'group-pressed/calendar-cell:bg-(--cell)',
                                      'group-invalid/calendar-cell:text-danger-subtle-fg group-invalid/calendar-cell:group-hover/calendar-cell:bg-danger/15',
                                    ]
                                    : 'group-hover/calendar-cell:bg-secondary/70 group-pressed/calendar-cell:bg-secondary forced-colors:group-pressed/calendar-cell:bg-[Highlight]',
                                isDisabled && 'opacity-40 cursor-not-allowed forced-colors:text-[GrayText]'
                              )}
                            >
                              {formattedDate}
                              {renderSlot(
                                slots.cellIndicator,
                                {
                                  isToday,
                                  isSelected: Boolean(isSelected && (isSelectionStart || isSelectionEnd)),
                                  isDisabled,
                                  ...slotProps.cellIndicator,
                                },
                                { defaultComponent: CalendarCellIndicator }
                              )}
                            </span>
                          )}
                        </RACCalendarCell>
                      )
                    }
                  </CalendarGridBody>
                </CalendarGrid>
              )
            })}
          </div>
        </>
      )}
      </RangeCalendarInner>
    </RACRangeCalendar>
  )
}

function RangeCalendarInner({
  children,
  showRemaining,
  slots,
  slotProps,
}: {
  children?: React.ReactNode
  showRemaining: boolean
  slots: SlotComponents<RangeCalendarSlots>
  slotProps: SlotPropsMap<RangeCalendarSlots>
}) {
  const state = React.useContext(RangeCalendarStateContext)
  const remaining = React.useMemo(() => {
    if (!showRemaining || !state) return null
    return remainingUntilDate(state.maxValue ?? state.value?.end ?? null)
  }, [showRemaining, state, state?.maxValue, state?.value])

  return (
    <>
      {children}
      {showRemaining &&
        renderSlot(
          slots.remaining,
          { remaining, ...slotProps.remaining },
          { defaultComponent: CalendarRemaining }
        )}
    </>
  )
}

export const RangeCalendar = createInterfaceComponent<RangeCalendarProps<any>, RangeCalendarSlots>(
  {
    name: 'RangeCalendar',
    category: 'form',
    description: 'Accessible date range calendar grid supporting multi-month spans and optical cell selection.',
    version: '1.0.0',
    slots: {
      header: CalendarHeader,
      grid: undefined,
      monthPicker: undefined,
      yearPicker: undefined,
      prevButton: undefined,
      nextButton: undefined,
      heading: undefined,
      gridHeader: undefined,
      gridBody: undefined,
      cell: undefined,
      cellIndicator: CalendarCellIndicator,
      remaining: CalendarRemaining,
    },
  },
  RangeCalendarPrimitive
)

// Attachments
RangeCalendar.Header = CalendarHeader
RangeCalendar.Heading = CalendarHeading
RangeCalendar.NavButton = CalendarNavButton
RangeCalendar.HeaderCell = CalendarHeaderCell
RangeCalendar.Grid = CalendarGrid
RangeCalendar.GridHeader = CalendarGridHeader
RangeCalendar.GridBody = CalendarGridBody
RangeCalendar.Cell = CalendarCell
RangeCalendar.CellIndicator = CalendarCellIndicator
RangeCalendar.Remaining = CalendarRemaining
