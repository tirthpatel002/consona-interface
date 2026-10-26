import React from 'react'
import {
  Calendar as RACCalendar,
  type CalendarProps as RACCalendarProps,
  CalendarCell as RACCalendarCell,
  type CalendarCellProps as RACCalendarCellProps,
  CalendarGrid as RACCalendarGrid,
  type CalendarGridProps as RACCalendarGridProps,
  CalendarGridBody as RACCalendarGridBody,
  type CalendarGridBodyProps as RACCalendarGridBodyProps,
  CalendarGridHeader as RACCalendarGridHeader,
  type CalendarGridHeaderProps as RACCalendarGridHeaderProps,
  CalendarHeaderCell as RACCalendarHeaderCell,
  type CalendarHeaderCellProps as RACCalendarHeaderCellProps,
  CalendarMonthPicker as RACCalendarMonthPicker,
  type CalendarMonthPickerProps as RACCalendarMonthPickerProps,
  CalendarYearPicker as RACCalendarYearPicker,
  type CalendarYearPickerProps as RACCalendarYearPickerProps,
  CalendarStateContext,
  RangeCalendarStateContext,
  Heading as RACHeading,
  type DateValue,
  Select as RACSelect,
  SelectValue as RACSelectValue,
  Button as RACButton,
  ListBox as RACListBox,
  ListBoxItem as RACListBoxItem,
} from 'react-aria-components'
import { composeRenderProps } from 'react-aria-components'
import { useLocale } from 'react-aria-components'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid'
import { ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { cn } from '../../../../core/cn'
import { CollectionPopover } from '../../../../core/overlay-trigger'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Button, type ButtonProps } from '../button'
import {
  remainingUntilDate,
  type RemainingParts,
} from './remaining'
import { canonicalDate, sameDate, useStableDateValue } from './date-value'

/* ==========================================================================
   YearListBox Helper
   ========================================================================== */

const YearListBox = ({
  items,
  selectedYearId,
}: {
  items: Iterable<{ id: number; formatted: string }>
  selectedYearId?: number
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useLayoutEffect(() => {
    if (selectedYearId === undefined) return
    const scrollTarget = () => {
      const activeEl = containerRef.current?.querySelector<HTMLElement>(`[data-key="${selectedYearId}"]`)
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'center', inline: 'nearest' })
      }
    }

    scrollTarget()
    const t1 = setTimeout(scrollTarget, 10)
    const t2 = setTimeout(scrollTarget, 50)
    const t3 = setTimeout(scrollTarget, 100)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [selectedYearId])

  return (
    <div ref={containerRef} className="w-full">
      <RACListBox items={items} className="outline-none flex flex-col gap-0.5">
        {(item: any) => (
          <RACListBoxItem
            id={item.id}
            textValue={item.formatted}
            className="text-xs py-1 px-2 rounded-micro cursor-pointer outline-none data-[focused]:bg-secondary data-[selected]:bg-primary/10 data-[selected]:text-primary"
          >
            {item.formatted}
          </RACListBoxItem>
        )}
      </RACListBox>
    </div>
  )
}

/* ==========================================================================
   Calendar Header Sub-Atom & Slots
   ========================================================================== */

export interface CalendarHeaderSlots {
  /** Previous month navigation button. */
  prevButton?: React.ComponentType<ButtonProps>
  /** Next month navigation button. */
  nextButton?: React.ComponentType<ButtonProps>
  /** Month dropdown picker select. */
  monthPicker?: React.ComponentType<CalendarMonthPickerProps>
  /** Year dropdown picker select. */
  yearPicker?: React.ComponentType<CalendarYearPickerProps>
  /** Text title heading (when pickers are disabled). */
  heading?: React.ComponentType<React.HTMLAttributes<HTMLHeadingElement>>
}

export interface CalendarHeaderProps extends React.HTMLAttributes<HTMLElement> {
  /** Custom CSS classes for the header container. */
  className?: string
  /** Whether to show month and year pickers in the header. */
  showPickers?: boolean
  /** When set, replaces the default pickers + nav chrome (compound composition). */
  children?: React.ReactNode
  /** Slot overrides for header sub-elements. */
  slots?: SlotComponents<CalendarHeaderSlots>
  /** Props passed into header slot occupants. */
  slotProps?: SlotPropsMap<CalendarHeaderSlots>
}

/* ==========================================================================
   Compound pieces: Heading, NavButton, HeaderCell
   ========================================================================== */

export interface CalendarHeadingProps
  extends React.ComponentPropsWithoutRef<typeof RACHeading> {
  /** Custom CSS classes for the visible month/year heading. */
  className?: string
}

const CalendarHeadingPrimitive = ({ className, ...props }: CalendarHeadingProps) => {
  return (
    <RACHeading
      data-slot="calendar-heading"
      className={cn('text-sm font-semibold text-fg', className)}
      {...props}
    />
  )
}

export const CalendarHeading = createInterfaceComponent<CalendarHeadingProps>(
  {
    name: 'CalendarHeading',
    category: 'typography',
    description: 'Accessible calendar month/year heading for compound header composition.',
    version: '1.0.0',
  },
  CalendarHeadingPrimitive
)

export interface CalendarNavButtonProps extends Omit<ButtonProps, 'slot'> {
  /** Which page direction this button advances. */
  slot: 'previous' | 'next'
}

const CalendarNavButtonPrimitive = ({
  slot,
  className,
  children,
  isDisabled: isDisabledProp,
  onPress,
  ...props
}: CalendarNavButtonProps) => {
  const { direction } = useLocale()
  const calendarState = React.useContext(CalendarStateContext)
  const rangeCalendarState = React.useContext(RangeCalendarStateContext)
  const state: any = calendarState || rangeCalendarState

  const isRtl = direction === 'rtl'
  const isPrevious = slot === 'previous'

  const handlePress = () => {
    if (!state) return
    if (isPrevious) {
      if (isRtl) state.focusNextPage?.()
      else state.focusPreviousPage?.()
    } else if (isRtl) {
      state.focusPreviousPage?.()
    } else {
      state.focusNextPage?.()
    }
  }

  const isNavDisabled = state
    ? isPrevious
      ? isRtl
        ? state.isNextCycleInvalid?.() || state.isNextPageInvalid?.()
        : state.isPreviousCycleInvalid?.() || state.isPreviousPageInvalid?.()
      : isRtl
        ? state.isPreviousCycleInvalid?.() || state.isPreviousPageInvalid?.()
        : state.isNextCycleInvalid?.() || state.isNextPageInvalid?.()
    : false

  const defaultIcon =
    (isPrevious && !isRtl) || (!isPrevious && isRtl) ? (
      <ChevronLeftIcon className="size-4" />
    ) : (
      <ChevronRightIcon className="size-4" />
    )

  return (
    <Button
      size="xs"
      isCircle
      intent="plain"
      slot={slot}
      aria-label={isPrevious ? 'Previous month' : 'Next month'}
      className={cn('size-7 text-fg p-0', className)}
      isDisabled={isDisabledProp ?? isNavDisabled}
      onPress={(e) => {
        handlePress()
        onPress?.(e)
      }}
      data-slot="calendar-nav-button"
      {...props}
    >
      {children ?? defaultIcon}
    </Button>
  )
}

export const CalendarNavButton = createInterfaceComponent<CalendarNavButtonProps>(
  {
    name: 'CalendarNavButton',
    category: 'form',
    description: 'Previous/next page button for compound calendar header composition.',
    version: '1.0.0',
  },
  CalendarNavButtonPrimitive
)

export interface CalendarHeaderCellProps extends RACCalendarHeaderCellProps {
  /** Custom CSS classes for the weekday header cell. */
  className?: string
}

const CalendarHeaderCellPrimitive = ({
  className,
  children,
  ...props
}: CalendarHeaderCellProps) => {
  return (
    <RACCalendarHeaderCell
      data-slot="calendar-header-cell"
      className={cn(
        'pb-1 text-center font-medium text-muted-fg text-[0.65rem] sm:text-xs',
        className
      )}
      {...props}
    >
      {children}
    </RACCalendarHeaderCell>
  )
}

export const CalendarHeaderCell = createInterfaceComponent<CalendarHeaderCellProps>(
  {
    name: 'CalendarHeaderCell',
    category: 'layout',
    description: 'Weekday label cell for compound calendar grid header composition.',
    version: '1.0.0',
  },
  CalendarHeaderCellPrimitive
)

const CalendarHeaderPrimitive = ({
  className,
  showPickers = true,
  children,
  slots = {},
  slotProps = {},
  ...props
}: CalendarHeaderProps) => {
  const pickerTriggerClassName =
    'h-7 min-w-0 max-w-28 w-auto px-1.5 sm:px-2 text-xs font-medium rounded-base bg-bg/80 border border-border/80 hover:bg-secondary/40 inline-flex items-center gap-1 cursor-pointer outline-none'

  if (children != null) {
    return (
      <header
        data-slot="calendar-header"
        className={cn(
          'flex w-full min-w-0 justify-between items-center gap-1 ps-1 pe-0.5 pt-0.5 pb-2',
          className
        )}
        {...props}
      >
        {children}
      </header>
    )
  }

  const defaultMonthPicker = (
    <RACCalendarMonthPicker {...slotProps.monthPicker}>
      {({ items, ...pickerProps }) => (
        <RACSelect className="inline-block" {...pickerProps}>
          <RACButton className={pickerTriggerClassName}>
            <RACSelectValue className="text-xs text-left truncate" />
            <ChevronUpDownIcon className="size-3.5 shrink-0 text-muted-fg ms-auto" />
          </RACButton>
          <CollectionPopover
            className="z-50 min-w-32 max-h-60 overflow-y-auto p-1 outline-none border border-border/80 bg-overlay/95 backdrop-blur-md text-fg rounded-macro"
          >
            <RACListBox items={items} className="outline-none flex flex-col gap-0.5">
              {(item: any) => (
                <RACListBoxItem
                  id={item.id}
                  textValue={item.formatted}
                  className="text-xs py-1 px-2 rounded-micro cursor-pointer outline-none data-[focused]:bg-secondary data-[selected]:bg-primary/10 data-[selected]:text-primary"
                >
                  {item.formatted}
                </RACListBoxItem>
              )}
            </RACListBox>
          </CollectionPopover>
        </RACSelect>
      )}
    </RACCalendarMonthPicker>
  )

  const defaultYearPicker = (
    <RACCalendarYearPicker visibleYears={401} {...slotProps.yearPicker}>
      {({ items, value, ...pickerProps }) => (
        <RACSelect className="inline-block" selectedKey={value} {...(pickerProps as any)}>
          <RACButton className={cn(pickerTriggerClassName, 'min-w-[4.75rem]')}>
            <RACSelectValue className="text-xs text-left truncate" />
            <ChevronUpDownIcon className="size-3.5 shrink-0 text-muted-fg ms-auto" />
          </RACButton>
          <CollectionPopover
            className="z-50 min-w-28 max-h-60 overflow-y-auto p-1 outline-none border border-border/80 bg-overlay/95 backdrop-blur-md text-fg rounded-macro"
          >
            <YearListBox items={items} selectedYearId={value as number | undefined} />
          </CollectionPopover>
        </RACSelect>
      )}
    </RACCalendarYearPicker>
  )

  const defaultPrevBtn = slots.prevButton ? (
    renderSlot(slots.prevButton, slotProps.prevButton)
  ) : (
    <CalendarNavButton {...slotProps.prevButton} slot="previous" />
  )

  const defaultNextBtn = slots.nextButton ? (
    renderSlot(slots.nextButton, slotProps.nextButton)
  ) : (
    <CalendarNavButton {...slotProps.nextButton} slot="next" />
  )

  return (
    <header
      data-slot="calendar-header"
      className={cn(
        'flex w-full min-w-0 justify-between items-center gap-1 ps-1 pe-0.5 pt-0.5 pb-2',
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-1" data-slot="calendar-header-pickers">
        {showPickers ? (
          <>
            {slots.monthPicker
              ? renderSlot(slots.monthPicker, slotProps.monthPicker)
              : defaultMonthPicker}
            {slots.yearPicker
              ? renderSlot(slots.yearPicker, slotProps.yearPicker)
              : defaultYearPicker}
          </>
        ) : slots.heading ? (
          renderSlot(slots.heading, slotProps.heading)
        ) : (
          <CalendarHeading />
        )}
      </div>
      <RACHeading className="sr-only" />
      <div className="flex items-center gap-1" data-slot="calendar-header-nav">
        {defaultPrevBtn}
        {defaultNextBtn}
      </div>
    </header>
  )
}

export const CalendarHeader = createInterfaceComponent<CalendarHeaderProps, CalendarHeaderSlots>(
  {
    name: 'CalendarHeader',
    category: 'layout',
    description: 'Header container containing month/year pickers and pagination navigation buttons.',
    version: '1.0.0',
    slots: {
      prevButton: undefined,
      nextButton: undefined,
      monthPicker: undefined,
      yearPicker: undefined,
      heading: undefined,
    },
  },
  CalendarHeaderPrimitive
)

/* ==========================================================================
   Calendar Grid Sub-Atoms
   ========================================================================== */

export interface CalendarGridHeaderProps extends Omit<RACCalendarGridHeaderProps, 'children'> {
  /** Custom CSS classes for the grid header. */
  className?: string
  /** Custom render function for each day label. */
  children?: (day: string) => React.ReactElement
}

const CalendarGridHeaderPrimitive = ({ className, children, ...props }: CalendarGridHeaderProps) => {
  return (
    <RACCalendarGridHeader data-slot="calendar-grid-header" className={className} {...props}>
      {children || ((day) => <CalendarHeaderCell>{day}</CalendarHeaderCell>)}
    </RACCalendarGridHeader>
  )
}

export const CalendarGridHeader = createInterfaceComponent<CalendarGridHeaderProps>(
  {
    name: 'CalendarGridHeader',
    category: 'layout',
    description: 'Days of week table header inside the calendar grid.',
    version: '1.0.0',
  },
  CalendarGridHeaderPrimitive
)

export interface CalendarGridBodyProps extends RACCalendarGridBodyProps {
  /** Custom CSS classes for the grid body. */
  className?: string
}

const CalendarGridBodyPrimitive = ({ className, ...props }: CalendarGridBodyProps) => {
  return <RACCalendarGridBody data-slot="calendar-grid-body" className={className} {...props} />
}

export const CalendarGridBody = createInterfaceComponent<CalendarGridBodyProps>(
  {
    name: 'CalendarGridBody',
    category: 'layout',
    description: 'Grid body container housing individual calendar cells.',
    version: '1.0.0',
  },
  CalendarGridBodyPrimitive
)

export interface CalendarCellIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Whether this cell is the current day. */
  isToday?: boolean
  /** Whether this cell is selected. */
  isSelected?: boolean
  /** Whether this cell is disabled. */
  isDisabled?: boolean
}

const CalendarCellIndicatorPrimitive = ({
  className,
  isToday = false,
  isSelected = false,
  isDisabled: _isDisabled,
  ...props
}: CalendarCellIndicatorProps) => {
  if (!isToday) return null
  return (
    <span
      data-slot="calendar-cell-indicator"
      aria-hidden
      className={cn(
        'pointer-events-none absolute bottom-1 left-1/2 z-10 size-1 -translate-x-1/2 rounded-full bg-primary',
        isSelected && 'bg-primary-fg',
        className
      )}
      {...props}
    />
  )
}

export const CalendarCellIndicator = createInterfaceComponent<CalendarCellIndicatorProps>(
  {
    name: 'CalendarCellIndicator',
    category: 'form',
    description: 'Current-day marker rendered inside a calendar cell. Replace via slots.cellIndicator / slots.indicator.',
    version: '1.0.0',
  },
  CalendarCellIndicatorPrimitive
)

export interface CalendarRemainingProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Structured remaining duration, when precomputed. */
  remaining?: RemainingParts | null
  /** Fallback label when `remaining` is omitted. */
  children?: React.ReactNode
}

const CalendarRemainingPrimitive = ({
  remaining,
  className,
  children,
  ...props
}: CalendarRemainingProps) => {
  const label = children ?? remaining?.label
  if (!label) return null
  return (
    <p
      data-slot="calendar-remaining"
      className={cn('pt-1.5 text-center text-xs text-muted-fg tabular-nums', className)}
      {...props}
    >
      {label}
    </p>
  )
}

export const CalendarRemaining = createInterfaceComponent<CalendarRemainingProps>(
  {
    name: 'CalendarRemaining',
    category: 'form',
    description: 'Countdown caption showing how much time remains until maxValue or the selected date.',
    version: '1.0.0',
  },
  CalendarRemainingPrimitive
)

export interface CalendarCellSlots {
  /** Current-day marker inside the cell (hidden when the day is not today). */
  indicator?: React.ComponentType<CalendarCellIndicatorProps>
}

export interface CalendarCellProps extends RACCalendarCellProps {
  /** Custom CSS classes for individual date cells. */
  className?: string
  /** Injected cell slot overrides. */
  slots?: SlotComponents<CalendarCellSlots>
  /** Props passed into cell slot occupants. */
  slotProps?: SlotPropsMap<CalendarCellSlots>
}

const CalendarCellPrimitive = ({
  className,
  slots = {},
  slotProps = {},
  children,
  ...props
}: CalendarCellProps) => {
  return (
    <RACCalendarCell
      data-slot="calendar-cell"
      className={composeRenderProps(className, (cls, { isSelected, isDisabled }) =>
        cn(
          'relative flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-micro text-xs text-fg tabular-nums outline-hidden hover:bg-secondary/70 sm:size-9 sm:text-sm/6 forced-colors:text-[ButtonText] forced-colors:outline-0 transition-colors',
          isSelected &&
          'bg-primary pressed:bg-primary text-primary-fg hover:bg-primary/90 data-invalid:bg-danger data-invalid:text-danger-fg forced-colors:bg-[Highlight] forced-colors:text-[HighlightText] forced-colors:data-invalid:bg-[Mark]',
          isDisabled && 'text-muted-fg opacity-40 cursor-not-allowed forced-colors:text-[GrayText]',
          cls
        )
      )}
      {...props}
    >
      {children ??
        (({ formattedDate, isToday, isSelected, isDisabled }) => (
          <>
            {formattedDate}
            {renderSlot(
              slots.indicator,
              { isToday, isSelected, isDisabled, ...slotProps.indicator },
              { defaultComponent: CalendarCellIndicator }
            )}
          </>
        ))}
    </RACCalendarCell>
  )
}

export const CalendarCell = createInterfaceComponent<CalendarCellProps, CalendarCellSlots>(
  {
    name: 'CalendarCell',
    category: 'form',
    description: 'Interactive day cell with active selection, today marker slot, and keyboard focus rings.',
    version: '1.0.0',
    slots: {
      indicator: CalendarCellIndicator,
    },
  },
  CalendarCellPrimitive
)

export interface CalendarMonthPickerProps extends Omit<RACCalendarMonthPickerProps, 'children'> {
  /** Custom CSS classes for the picker trigger wrapper. */
  className?: string
  /** Optional render-prop override. Defaults to the built-in Select UI. */
  children?: RACCalendarMonthPickerProps['children']
}

const PICKER_TRIGGER_CLASS =
  'h-7 min-w-0 max-w-28 w-auto px-1.5 sm:px-2 text-xs font-medium rounded-base bg-bg/80 border border-border/80 hover:bg-secondary/40 inline-flex items-center gap-1 cursor-pointer outline-none'

const CalendarMonthPickerPrimitive = ({
  children,
  className,
  ...props
}: CalendarMonthPickerProps) => {
  const defaultChildren: NonNullable<RACCalendarMonthPickerProps['children']> = ({
    items,
    ...pickerProps
  }) => (
    <RACSelect className={cn('inline-block', className)} {...pickerProps}>
      <RACButton className={PICKER_TRIGGER_CLASS}>
        <RACSelectValue className="text-xs text-left truncate" />
        <ChevronUpDownIcon className="size-3.5 shrink-0 text-muted-fg ms-auto" />
      </RACButton>
      <CollectionPopover className="z-50 min-w-32 max-h-60 overflow-y-auto p-1 outline-none border border-border/80 bg-overlay/95 backdrop-blur-md text-fg rounded-macro">
        <RACListBox items={items} className="outline-none flex flex-col gap-0.5">
          {(item: any) => (
            <RACListBoxItem
              id={item.id}
              textValue={item.formatted}
              className="text-xs py-1 px-2 rounded-micro cursor-pointer outline-none data-[focused]:bg-secondary data-[selected]:bg-primary/10 data-[selected]:text-primary"
            >
              {item.formatted}
            </RACListBoxItem>
          )}
        </RACListBox>
      </CollectionPopover>
    </RACSelect>
  )

  return (
    <RACCalendarMonthPicker data-slot="calendar-month-picker" {...(props as any)}>
      {children ?? defaultChildren}
    </RACCalendarMonthPicker>
  )
}

export const CalendarMonthPicker = createInterfaceComponent<CalendarMonthPickerProps>(
  {
    name: 'CalendarMonthPicker',
    category: 'form',
    description: 'Accessible month dropdown picker helper for date navigation.',
    version: '1.0.0',
  },
  CalendarMonthPickerPrimitive
)

export interface CalendarYearPickerProps extends Omit<RACCalendarYearPickerProps, 'children'> {
  /** Custom CSS classes for the picker trigger wrapper. */
  className?: string
  /** Optional render-prop override. Defaults to the built-in Select UI. */
  children?: RACCalendarYearPickerProps['children']
}

const CalendarYearPickerPrimitive = ({
  children,
  className,
  visibleYears = 401,
  ...props
}: CalendarYearPickerProps) => {
  const defaultChildren: NonNullable<RACCalendarYearPickerProps['children']> = ({
    items,
    value,
    ...pickerProps
  }) => (
    <RACSelect
      className={cn('inline-block', className)}
      selectedKey={value}
      {...(pickerProps as any)}
    >
      <RACButton className={cn(PICKER_TRIGGER_CLASS, 'min-w-[4.75rem]')}>
        <RACSelectValue className="text-xs text-left truncate" />
        <ChevronUpDownIcon className="size-3.5 shrink-0 text-muted-fg ms-auto" />
      </RACButton>
      <CollectionPopover className="z-50 min-w-28 max-h-60 overflow-y-auto p-1 outline-none border border-border/80 bg-overlay/95 backdrop-blur-md text-fg rounded-macro">
        <YearListBox items={items} selectedYearId={value as number | undefined} />
      </CollectionPopover>
    </RACSelect>
  )

  return (
    <RACCalendarYearPicker
      data-slot="calendar-year-picker"
      visibleYears={visibleYears}
      {...(props as any)}
    >
      {children ?? defaultChildren}
    </RACCalendarYearPicker>
  )
}

export const CalendarYearPicker = createInterfaceComponent<CalendarYearPickerProps>(
  {
    name: 'CalendarYearPicker',
    category: 'form',
    description: 'Accessible year dropdown picker helper for date navigation.',
    version: '1.0.0',
  },
  CalendarYearPickerPrimitive
)

/* ==========================================================================
   Calendar Grid Sub-Component & Slots
   ========================================================================= */

export interface CalendarGridSlots {
  /** Header row containing day of week labels. */
  header?: React.ComponentType<CalendarGridHeaderProps>
  /** Grid body containing month day rows. */
  body?: React.ComponentType<CalendarGridBodyProps>
  /** Day cell renderer slot. */
  cell?: React.ComponentType<CalendarCellProps>
  /** Current-day marker rendered inside each cell. */
  cellIndicator?: React.ComponentType<CalendarCellIndicatorProps>
}

export interface CalendarGridProps extends RACCalendarGridProps {
  /** Custom CSS classes for the calendar grid table. */
  className?: string
  /** Injected grid slot components. */
  slots?: SlotComponents<CalendarGridSlots>
  /** Props passed into injected grid slots. */
  slotProps?: SlotPropsMap<CalendarGridSlots>
}

const CalendarGridPrimitive = ({
  className,
  children,
  slots = {},
  slotProps = {},
  ...props
}: CalendarGridProps) => {
  const renderCell = (date: any) =>
    renderSlot(
      slots.cell,
      {
        date,
        slots: {
          indicator: slots.cellIndicator,
          ...slotProps.cell?.slots,
        },
        slotProps: {
          indicator: slotProps.cellIndicator,
          ...slotProps.cell?.slotProps,
        },
        ...slotProps.cell,
      },
      { defaultComponent: CalendarCell }
    ) as React.ReactElement

  return (
    <RACCalendarGrid
      data-slot="calendar-grid"
      className={cn('w-fit border-collapse [&_td]:p-0', className)}
      {...props}
    >
      {children || (
        <>
          {renderSlot(slots.header, slotProps.header, {
            defaultComponent: CalendarGridHeader,
          })}
          {slots.body ? (
            renderSlot(slots.body, {
              ...slotProps.body,
              children: renderCell,
            })
          ) : (
            <CalendarGridBody {...slotProps.body}>
              {renderCell}
            </CalendarGridBody>
          )}
        </>
      )}
    </RACCalendarGrid>
  )
}

export const CalendarGrid = createInterfaceComponent<CalendarGridProps, CalendarGridSlots>(
  {
    name: 'CalendarGrid',
    category: 'layout',
    description: 'Calendar matrix grid displaying monthly day cells.',
    version: '1.0.0',
    slots: {
      header: undefined,
      body: CalendarGridBody,
      cell: CalendarCell,
      cellIndicator: undefined,
    },
  },
  CalendarGridPrimitive
)

/* ==========================================================================
   Calendar Root Component
   ========================================================================== */

export interface CalendarSlots {
  /** Custom header controls slot. */
  header?: React.ComponentType<CalendarHeaderProps>
  /** Custom grid component slot. */
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
  heading?: React.ComponentType<React.ComponentPropsWithoutRef<typeof RACHeading>>
  /** Days of week table header slot. */
  gridHeader?: React.ComponentType<CalendarGridHeaderProps>
  /** Grid body rows container slot. */
  gridBody?: React.ComponentType<CalendarGridBodyProps>
  /** Individual date day cell slot. */
  cell?: React.ComponentType<CalendarCellProps>
  /** Current-day marker inside each cell. */
  cellIndicator?: React.ComponentType<CalendarCellIndicatorProps>
  /** Remaining-time caption below the grid. */
  remaining?: React.ComponentType<CalendarRemainingProps>
}

export interface CalendarProps<T extends DateValue = DateValue>
  extends Omit<RACCalendarProps<T>, 'children'> {
  /** Custom CSS classes for the calendar container. */
  className?: string
  /** Optional custom child elements replacing standard header/grid layout. */
  children?: React.ReactNode
  /** Show a countdown until `maxValue`, falling back to the selected date. */
  showRemaining?: boolean
  /** Injected slot component overrides. */
  slots?: SlotComponents<CalendarSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<CalendarSlots>
}

const CalendarPrimitiveComponent = <T extends DateValue = DateValue>({
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
}: CalendarProps<T>) => {
  const stableMin = useStableDateValue(minValue)
  const stableMax = useStableDateValue(maxValue)
  const stableValue = useStableDateValue(value)
  const stableDefaultValue = useStableDateValue(defaultValue)
  const stableFocused = useStableDateValue(focusedValue)
  const stableDefaultFocused = useStableDateValue(defaultFocusedValue)

  const headerSlots: SlotComponents<CalendarHeaderSlots> = {
    monthPicker: slots.monthPicker,
    yearPicker: slots.yearPicker,
    prevButton: slots.prevButton,
    nextButton: slots.nextButton,
    heading: slots.heading,
    ...slotProps.header?.slots,
  }

  const gridSlots: SlotComponents<CalendarGridSlots> = {
    header: slots.gridHeader,
    body: slots.gridBody,
    cell: slots.cell,
    cellIndicator: slots.cellIndicator,
    ...slotProps.grid?.slots,
  }

  return (
    <RACCalendar
      data-slot="calendar"
      className={cn('inline-block w-fit max-w-full p-space-xs sm:p-space-sm select-none', className)}
      {...props}
      minValue={stableMin}
      maxValue={stableMax}
      value={value === undefined ? undefined : stableValue ?? null}
      defaultValue={stableDefaultValue}
      focusedValue={stableFocused}
      defaultFocusedValue={stableDefaultFocused}
      onChange={(next) => {
        if (sameDate(stableValue ?? null, next ?? null)) return
        onChange?.(next)
      }}
      onFocusChange={(next) => {
        const canon = canonicalDate(next)
        if (!canon || sameDate(stableFocused ?? null, canon)) return
        onFocusChange?.(canon)
      }}
    >
      <CalendarInner
        showRemaining={showRemaining}
        slots={slots}
        slotProps={slotProps}
        headerSlots={headerSlots}
        gridSlots={gridSlots}
      >
        {children}
      </CalendarInner>
    </RACCalendar>
  )
}

const CalendarInner = ({
  children,
  showRemaining,
  slots,
  slotProps,
  headerSlots,
  gridSlots,
}: {
  children?: React.ReactNode
  showRemaining: boolean
  slots: SlotComponents<CalendarSlots>
  slotProps: SlotPropsMap<CalendarSlots>
  headerSlots: SlotComponents<CalendarHeaderSlots>
  gridSlots: SlotComponents<CalendarGridSlots>
}) => {
  const state = React.useContext(CalendarStateContext)
  const remaining = React.useMemo(() => {
    if (!showRemaining || !state) return null
    const until = state.maxValue
    if (until && typeof until === 'object' && 'year' in until) {
      return remainingUntilDate(until as DateValue)
    }
    const selected = state.value
    if (selected && typeof selected === 'object' && 'year' in selected) {
      return remainingUntilDate(selected as DateValue)
    }
    return null
  }, [showRemaining, state, state?.maxValue, state?.value])

  return (
    <>
      {children || (
        <>
          {renderSlot(
            slots.header,
            { slots: headerSlots, ...slotProps.header },
            { defaultComponent: CalendarHeader }
          )}
          {renderSlot(
            slots.grid,
            { slots: gridSlots, ...slotProps.grid },
            { defaultComponent: CalendarGrid }
          )}
        </>
      )}
      {showRemaining &&
        renderSlot(
          slots.remaining,
          { remaining, ...slotProps.remaining },
          { defaultComponent: CalendarRemaining }
        )}
    </>
  )
}

export const Calendar = createInterfaceComponent<CalendarProps<any>, CalendarSlots>(
  {
    name: 'Calendar',
    category: 'form',
    description: 'Accessible single-date calendar grid with month/year navigation and optical geometry.',
    version: '1.0.0',
    slots: {
      header: CalendarHeader,
      grid: CalendarGrid,
      monthPicker: CalendarMonthPicker,
      yearPicker: CalendarYearPicker,
      prevButton: undefined,
      nextButton: undefined,
      heading: CalendarHeading,
      gridHeader: CalendarGridHeader,
      gridBody: CalendarGridBody,
      cell: CalendarCell,
      cellIndicator: CalendarCellIndicator,
      remaining: CalendarRemaining,
    },
  },
  CalendarPrimitiveComponent
)

// Compound component attachments
Calendar.Header = CalendarHeader
Calendar.Heading = CalendarHeading
Calendar.NavButton = CalendarNavButton
Calendar.HeaderCell = CalendarHeaderCell
Calendar.GridHeader = CalendarGridHeader
Calendar.Grid = CalendarGrid
Calendar.GridBody = CalendarGridBody
Calendar.Cell = CalendarCell
Calendar.CellIndicator = CalendarCellIndicator
Calendar.Remaining = CalendarRemaining
Calendar.MonthPicker = CalendarMonthPicker
Calendar.YearPicker = CalendarYearPicker

export const { Context: CalendarContext, useCompoundContext: useCalendarContext } =
  createCompoundContext<any>('Calendar')
