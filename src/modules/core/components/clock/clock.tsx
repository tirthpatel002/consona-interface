import React, {
  useEffect,
  useMemo,
  useState,
  type HTMLAttributes,
} from 'react'
import {
  GlobeAltIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Badge, type BadgeProps } from '../badge'
import { Button } from '../button'
import { Popover, PopoverTrigger } from '../popover'
import { ScrollArea } from '../scroll-area'

/* ==========================================================================
   Clock Types & Timezone Data
   ========================================================================== */

export type ClockMode = 'digital' | 'analog' | 'both'
export type ClockSize = 'sm' | 'md' | 'lg' | 'xl'
export type ClockVariant = 'card' | 'plain' | 'glass'

export interface TimeParts {
  hours: number
  rawHours: number
  minutes: number
  seconds: number
  ampm: string
  dateStr: string
}

const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', city: 'UTC', offset: 'UTC+0' },
  { value: 'America/New_York', label: 'New York (EDT/EST)', city: 'New York', offset: 'UTC-4' },
  { value: 'America/Chicago', label: 'Chicago (CDT/CST)', city: 'Chicago', offset: 'UTC-5' },
  { value: 'America/Denver', label: 'Denver (MDT/MST)', city: 'Denver', offset: 'UTC-6' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PDT/PST)', city: 'Los Angeles', offset: 'UTC-7' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)', city: 'São Paulo', offset: 'UTC-3' },
  { value: 'Europe/London', label: 'London (BST/GMT)', city: 'London', offset: 'UTC+1' },
  { value: 'Europe/Paris', label: 'Paris (CEST/CET)', city: 'Paris', offset: 'UTC+2' },
  { value: 'Europe/Berlin', label: 'Berlin (CEST/CET)', city: 'Berlin', offset: 'UTC+2' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)', city: 'Dubai', offset: 'UTC+4' },
  { value: 'Asia/Kolkata', label: 'India / Mumbai (IST)', city: 'Mumbai', offset: 'UTC+5:30' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)', city: 'Singapore', offset: 'UTC+8' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)', city: 'Hong Kong', offset: 'UTC+8' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', city: 'Tokyo', offset: 'UTC+9' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)', city: 'Sydney', offset: 'UTC+10' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)', city: 'Auckland', offset: 'UTC+12' },
]

export function getAllTimezones() {
  try {
    const list = (Intl as any).supportedValuesOf?.('timeZone')
    if (Array.isArray(list) && list.length > 0) {
      return list.map((tz: string) => {
        const parts = tz.split('/')
        const city = (parts[parts.length - 1] || tz).replace(/_/g, ' ')
        return { value: tz, label: tz.replace(/_/g, ' '), city }
      })
    }
  } catch {}
  return COMMON_TIMEZONES
}

const ROMAN_NUMERALS = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']

/* ==========================================================================
   ClockAnalog Sub-Atom & Props
   ========================================================================== */

export interface ClockAnalogProps extends HTMLAttributes<HTMLDivElement> {
  /** Size ramp token from sm to xl. */
  size?: ClockSize
  /** Calculated time parts payload. */
  timeParts?: TimeParts
  /** Hour numbering style on analog dial. */
  hourLabels?: boolean | 'numbers' | 'roman'
  /** Whether to render 60-second sub-tick marks. */
  showMarkers?: boolean
  /** Whether to render live ticking second hand. */
  showSeconds?: boolean
  /** Custom container CSS classes. */
  className?: string
}

const ClockAnalogPrimitive = ({
  size = 'md',
  timeParts = {
    hours: 12,
    rawHours: 12,
    minutes: 0,
    seconds: 0,
    ampm: 'PM',
    dateStr: '',
  },
  hourLabels = false,
  showMarkers = true,
  showSeconds = true,
  className,
  ...props
}: ClockAnalogProps) => {
  const dialDimensions = {
    sm: 130,
    md: 180,
    lg: 240,
    xl: 300,
  }
  const dialSize = dialDimensions[size]
  const center = 100
  const radius = 90

  const secAngle = timeParts.seconds * 6
  const minAngle = timeParts.minutes * 6 + timeParts.seconds * 0.1
  const hrAngle = (timeParts.rawHours % 12) * 30 + timeParts.minutes * 0.5

  return (
    <div
      data-slot="clock-analog"
      className={cn('relative flex items-center justify-center select-none', className)}
      style={{ width: dialSize, height: dialSize }}
      {...props}
    >
      <svg viewBox="0 0 200 200" className="size-full" aria-hidden="true">
        <circle cx={center} cy={center} r={radius} className="fill-muted/20 stroke-border" strokeWidth="2" />
        <circle cx={center} cy={center} r={radius - 2} className="fill-card stroke-border/40" strokeWidth="1" />

        {showMarkers &&
          Array.from({ length: 60 }).map((_, i) => {
            const isHour = i % 5 === 0
            const angle = (i * 6 - 90) * (Math.PI / 180)
            const innerR = isHour ? radius - 11 : radius - 6
            const outerR = radius - 3
            const x1 = center + innerR * Math.cos(angle)
            const y1 = center + innerR * Math.sin(angle)
            const x2 = center + outerR * Math.cos(angle)
            const y2 = center + outerR * Math.sin(angle)

            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className={isHour ? 'stroke-fg' : 'stroke-muted-fg/60'}
                strokeWidth={isHour ? 2.25 : 1.25}
                strokeLinecap="round"
              />
            )
          })}

        {hourLabels &&
          Array.from({ length: 12 }).map((_, i) => {
            const hourIndex = i === 0 ? 12 : i
            const angle = (i * 30 - 90) * (Math.PI / 180)
            const labelR = radius - 21
            const x = center + labelR * Math.cos(angle)
            const y = center + labelR * Math.sin(angle)

            const textLabel =
              hourLabels === 'roman'
                ? ROMAN_NUMERALS[i]
                : String(hourIndex)

            return (
              <text
                key={i}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-fg font-mono text-[11.5px] font-bold select-none tracking-tight"
              >
                {textLabel}
              </text>
            )
          })}

        {/* Hour Hand */}
        <line
          x1={center}
          y1={center}
          x2={center + radius * 0.54 * Math.sin((hrAngle * Math.PI) / 180)}
          y2={center - radius * 0.54 * Math.cos((hrAngle * Math.PI) / 180)}
          className="stroke-fg"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Minute Hand */}
        <line
          x1={center}
          y1={center}
          x2={center + radius * 0.76 * Math.sin((minAngle * Math.PI) / 180)}
          y2={center - radius * 0.76 * Math.cos((minAngle * Math.PI) / 180)}
          className="stroke-fg"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Second Hand */}
        {showSeconds && (
          <g>
            <line
              x1={center - 16 * Math.sin((secAngle * Math.PI) / 180)}
              y1={center + 16 * Math.cos((secAngle * Math.PI) / 180)}
              x2={center + radius * 0.85 * Math.sin((secAngle * Math.PI) / 180)}
              y2={center - radius * 0.85 * Math.cos((secAngle * Math.PI) / 180)}
              className="stroke-primary"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle
              cx={center - 10 * Math.sin((secAngle * Math.PI) / 180)}
              cy={center + 10 * Math.cos((secAngle * Math.PI) / 180)}
              r="1.5"
              className="fill-primary"
            />
          </g>
        )}

        <circle cx={center} cy={center} r="4" className="fill-card stroke-fg" strokeWidth="2" />
        <circle cx={center} cy={center} r="1.75" className="fill-primary" />
      </svg>
    </div>
  )
}

export const ClockAnalog = createInterfaceComponent<ClockAnalogProps>(
  {
    name: 'ClockAnalog',
    category: 'data',
    description: 'Analog clock face rendering circular hour/minute tracks and ticking hands.',
    version: '1.0.0',
  },
  ClockAnalogPrimitive
)

/* ==========================================================================
   ClockDigital Sub-Atom, Slots & Props
   ========================================================================== */

export interface ClockDigitalSlots {
  /** AM/PM period badge slot. */
  badge?: React.ComponentType<BadgeProps>
  /** Formatted date text slot. */
  date?: React.ComponentType<React.HTMLAttributes<HTMLSpanElement>>
}

export interface ClockDigitalProps extends HTMLAttributes<HTMLDivElement> {
  /** Size ramp token from sm to xl. */
  size?: ClockSize
  /** Calculated time parts payload. */
  timeParts?: TimeParts
  /** 12-hour or 24-hour time format. */
  format?: '12h' | '24h'
  /** Whether to render ticking seconds. */
  showSeconds?: boolean
  /** Whether to render the date string. */
  showDate?: boolean
  /** Custom container CSS classes. */
  className?: string
  /** Slot overrides. */
  slots?: SlotComponents<ClockDigitalSlots>
  /** Slot props map. */
  slotProps?: SlotPropsMap<ClockDigitalSlots>
}

const ClockDigitalPrimitive = ({
  size = 'md',
  timeParts = {
    hours: 12,
    rawHours: 12,
    minutes: 0,
    seconds: 0,
    ampm: 'PM',
    dateStr: '',
  },
  format = '12h',
  showSeconds = true,
  showDate = false,
  className,
  slots = {},
  slotProps = {},
  ...props
}: ClockDigitalProps) => {
  const digitalSizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl',
    xl: 'text-6xl',
  }

  const defaultBadge = (
    <Badge
      intent="secondary"
      className="ml-1.5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-bold text-fg bg-muted border border-border"
      {...slotProps.badge}
    >
      {timeParts.ampm}
    </Badge>
  )

  const defaultDate = (
    <span data-slot="clock-date" className="text-xs font-semibold text-muted-fg" {...slotProps.date}>
      {timeParts.dateStr}
    </span>
  )

  return (
    <div
      data-slot="clock-digital"
      className={cn('flex flex-col items-center gap-1.5 text-center', className)}
      {...props}
    >
      <div className="flex items-baseline justify-center gap-1.5 font-mono font-bold tracking-tight text-fg tabular-nums">
        <span className={digitalSizeClasses[size]}>
          {String(timeParts.hours).padStart(2, '0')}:
          {String(timeParts.minutes).padStart(2, '0')}
        </span>
        {showSeconds && (
          <span className={cn('font-semibold text-muted-fg tabular-nums', size === 'sm' ? 'text-xs' : 'text-lg')}>
            :{String(timeParts.seconds).padStart(2, '0')}
          </span>
        )}
        {format === '12h' && (
          slots.badge ? renderSlot(slots.badge, slotProps.badge) : defaultBadge
        )}
      </div>

      {showDate && (
        slots.date ? renderSlot(slots.date, slotProps.date) : defaultDate
      )}
    </div>
  )
}

export const ClockDigital = createInterfaceComponent<ClockDigitalProps, ClockDigitalSlots>(
  {
    name: 'ClockDigital',
    category: 'data',
    description: 'Digital numbers readout displaying hours, minutes, seconds, and AM/PM tag.',
    version: '1.0.0',
    slots: {
      badge: undefined,
      date: undefined,
    },
  },
  ClockDigitalPrimitive
)

/* ==========================================================================
   ClockTimezone Sub-Atom & Props
   ========================================================================== */

export interface ClockTimezoneProps extends HTMLAttributes<HTMLDivElement> {
  /** Currently selected timezone string. */
  selectedTimezone: string
  /** Handler called when timezone changes. */
  onSelectTimezone: (tz: string) => void
  /** Whether the timezone badge is an interactive dropdown selector. */
  interactive?: boolean
  /** Called when the picker overlay opens or closes. */
  onOpenChange?: (isOpen: boolean) => void
  /** Custom CSS classes. */
  className?: string
}

const ClockTimezonePrimitive = ({
  selectedTimezone,
  onSelectTimezone,
  interactive = false,
  onOpenChange,
  className,
  ...props
}: ClockTimezoneProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const allTzs = useMemo(() => getAllTimezones(), [])

  const filteredTzs = useMemo(() => {
    if (!searchQuery.trim()) return allTzs
    const q = searchQuery.toLowerCase()
    return allTzs.filter(
      (tz: any) =>
        tz.value.toLowerCase().includes(q) ||
        tz.city.toLowerCase().includes(q) ||
        tz.label.toLowerCase().includes(q)
    )
  }, [allTzs, searchQuery])

  if (!interactive) {
    return (
      <div data-slot="clock-timezone" className={cn('flex items-center justify-center w-full', className)} {...props}>
        <Badge intent="outline" className="text-[10px] font-mono px-2 py-0.5 mx-auto">
          <GlobeAltIcon className="size-3 mr-1 text-muted-fg inline-block" />
          {selectedTimezone.split('/').pop()?.replace(/_/g, ' ')}
        </Badge>
      </div>
    )
  }

  return (
    <div data-slot="clock-timezone" className={cn('relative flex items-center justify-between w-full gap-space-sm', className)} {...props}>
      <PopoverTrigger
        onOpenChange={(open) => {
          if (!open) setSearchQuery('')
          onOpenChange?.(open)
        }}
      >
        <Button
          intent="outline"
          size="sm"
          className="group w-full justify-between font-semibold"
        >
          <span className="flex items-center gap-1.5 truncate">
            <GlobeAltIcon className="size-3.5 text-primary shrink-0" />
            <span className="truncate">
              {selectedTimezone.split('/').pop()?.replace(/_/g, ' ') || selectedTimezone}
            </span>
          </span>
          <ChevronDownIcon className="size-3 text-muted-fg shrink-0 transition-transform group-aria-expanded:rotate-180" />
        </Button>
        <Popover size="auto" className="min-w-64 p-space-sm">
          {({ close }) => (
            <div className="flex flex-col gap-space-sm">
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-fg" />
                <input
                  type="text"
                  placeholder="Search timezone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-full rounded-base border border-border bg-bg pl-8 pr-2.5 text-xs text-fg placeholder:text-muted-fg focus:border-primary focus:outline-none"
                />
              </div>
              <ScrollArea className="max-h-48">
                <div className="flex flex-col gap-0.5">
                  {filteredTzs.length > 0 ? (
                    filteredTzs.slice(0, 50).map((tz: any) => {
                      const isSelected = selectedTimezone === tz.value
                      return (
                        <Button
                          key={tz.value}
                          intent="plain"
                          size="sm"
                          className={cn(
                            'w-full justify-between font-normal',
                            isSelected && 'bg-primary/10 text-primary font-medium'
                          )}
                          onPress={() => {
                            onSelectTimezone?.(tz.value)
                            close()
                          }}
                        >
                          <span className="truncate">{tz.city || tz.label}</span>
                          {isSelected && <CheckIcon className="size-3 text-primary shrink-0" />}
                        </Button>
                      )
                    })
                  ) : (
                    <div className="py-4 text-center text-xs text-muted-fg">
                      No timezone found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </Popover>
      </PopoverTrigger>
    </div>
  )
}

export const ClockTimezone = createInterfaceComponent<ClockTimezoneProps>(
  {
    name: 'ClockTimezone',
    category: 'data',
    description: 'Timezone selector badge / dropdown list for switching active world clock location.',
    version: '1.0.0',
  },
  ClockTimezonePrimitive
)

/* ==========================================================================
   Clock Root Component & Slots
   ========================================================================== */

export interface ClockSlots {
  /** Timezone dropdown selector or badge slot. */
  timezone?: React.ComponentType<ClockTimezoneProps>
  /** Analog dial face slot. */
  analog?: React.ComponentType<ClockAnalogProps>
  /** Digital readout slot. */
  digital?: React.ComponentType<ClockDigitalProps>
  /** AM/PM period badge slot. */
  badge?: React.ComponentType<BadgeProps>
  /** Formatted date text slot. */
  date?: React.ComponentType<React.HTMLAttributes<HTMLSpanElement>>
}

export interface ClockProps extends HTMLAttributes<HTMLDivElement> {
  /** Rendering mode: digital numbers, analog hands, or both. */
  mode?: ClockMode
  /** Target timezone identifier (e.g. 'America/New_York', 'UTC'). */
  timezone?: string
  /** Whether to render live ticking seconds. */
  showSeconds?: boolean
  /** Whether to render the date string below the digital clock. */
  showDate?: boolean
  /** Whether to render the timezone badge. */
  showTimezone?: boolean
  /** Whether the timezone badge is an interactive dropdown selector. */
  interactiveTimezone?: boolean
  /** Handler called when the timezone is changed. */
  onTimezoneChange?: (timezone: string) => void
  /** Size ramp token from sm to xl. */
  size?: ClockSize
  /** Visual surface container variant. */
  variant?: ClockVariant
  /** 12-hour or 24-hour time format. */
  format?: '12h' | '24h'
  /** Static override date or timestamp. */
  time?: string | Date
  /** Hour numbering on the analog face (numeric, roman, or none). */
  hourLabels?: boolean | 'numbers' | 'roman'
  /** Whether to display 60 minute/hour sub-tick marks on the analog dial. */
  showMarkers?: boolean
  /** Custom container CSS classes. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<ClockSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ClockSlots>
}

const ClockPrimitiveComponent = ({
  className,
  mode = 'digital',
  timezone,
  showSeconds = true,
  showDate = false,
  showTimezone = false,
  interactiveTimezone = false,
  onTimezoneChange,
  size = 'md',
  variant = 'card',
  format = '12h',
  time: customTime,
  hourLabels = false,
  showMarkers = true,
  slots = {},
  slotProps = {},
  ...props
}: ClockProps) => {
  const [selectedTz, setSelectedTz] = useState<string>(
    timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  )
  const [tzOpen, setTzOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState<Date>(() =>
    customTime ? new Date(customTime) : new Date()
  )

  useEffect(() => {
    if (timezone) setSelectedTz(timezone)
  }, [timezone])

  useEffect(() => {
    if (customTime) {
      setCurrentDate(new Date(customTime))
      return
    }
    if (tzOpen) return
    const timer = setInterval(() => {
      setCurrentDate(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [customTime, tzOpen])

  const handleSelectTz = (newTz: string) => {
    setSelectedTz(newTz)
    onTimezoneChange?.(newTz)
  }

  const timeParts: TimeParts = useMemo(() => {
    let h = currentDate.getHours()
    let m = currentDate.getMinutes()
    let s = currentDate.getSeconds()
    let dateStr = ''

    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: selectedTz,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
      const parts = formatter.formatToParts(currentDate)
      h = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10)
      m = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10)
      s = parseInt(parts.find((p) => p.type === 'second')?.value || '0', 10)
      const weekday = parts.find((p) => p.type === 'weekday')?.value || ''
      const month = parts.find((p) => p.type === 'month')?.value || ''
      const day = parts.find((p) => p.type === 'day')?.value || ''
      dateStr = `${weekday}, ${month} ${day}`
    } catch {
      dateStr = currentDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    }

    let ampm = ''
    let displayHours = h
    if (format === '12h') {
      ampm = h >= 12 ? 'PM' : 'AM'
      displayHours = h % 12 || 12
    }

    return {
      hours: displayHours,
      rawHours: h,
      minutes: m,
      seconds: s,
      ampm,
      dateStr,
    }
  }, [currentDate, selectedTz, format])

  const containerVariantClasses = {
    card: 'rounded-macro border border-border bg-card p-space-lg',
    plain: 'p-space-xs',
    glass: 'rounded-macro border border-border bg-card/80 backdrop-blur-md p-space-lg',
  }

  const defaultAnalog = (
    <ClockAnalog
      size={size}
      timeParts={timeParts}
      hourLabels={hourLabels}
      showMarkers={showMarkers}
      showSeconds={showSeconds}
      {...slotProps.analog}
    />
  )

  const defaultDigital = (
    <ClockDigital
      size={size}
      timeParts={timeParts}
      format={format}
      showSeconds={showSeconds}
      showDate={showDate}
      slots={{ badge: slots.badge, date: slots.date, ...slotProps.digital?.slots }}
      slotProps={slotProps.digital?.slotProps}
      {...slotProps.digital}
    />
  )

  const defaultTimezone = (
    <ClockTimezone
      selectedTimezone={selectedTz}
      onSelectTimezone={handleSelectTz}
      interactive={interactiveTimezone}
      onOpenChange={setTzOpen}
      {...slotProps.timezone}
    />
  )

  return (
    <div
      data-slot="clock"
      className={cn(
        'inline-flex w-fit h-fit max-w-full flex-col items-center gap-space-md text-fg',
        containerVariantClasses[variant],
        className
      )}
      {...props}
    >
      {/* Top Timezone selector or badge */}
      {(interactiveTimezone || showTimezone) && (
        slots.timezone
          ? renderSlot(slots.timezone, {
              selectedTimezone: selectedTz,
              onSelectTimezone: handleSelectTz,
              interactive: interactiveTimezone,
              onOpenChange: setTzOpen,
              ...slotProps.timezone,
            })
          : defaultTimezone
      )}

      {/* Clock Body */}
      {mode === 'analog' &&
        (slots.analog ? renderSlot(slots.analog, slotProps.analog) : defaultAnalog)}
      {mode === 'digital' &&
        (slots.digital ? renderSlot(slots.digital, slotProps.digital) : defaultDigital)}
      {mode === 'both' && (
        <div className="flex flex-col items-center gap-space-md">
          {slots.analog ? renderSlot(slots.analog, slotProps.analog) : defaultAnalog}
          {slots.digital ? renderSlot(slots.digital, slotProps.digital) : defaultDigital}
        </div>
      )}
    </div>
  )
}

export const Clock = createInterfaceComponent<ClockProps, ClockSlots>(
  {
    name: 'Clock',
    category: 'data',
    description: 'Analog and digital temporal clock display with live timezones and smooth second sweeping.',
    version: '1.0.0',
    slots: {
      timezone: ClockTimezone,
      analog: ClockAnalog,
      digital: ClockDigital,
      badge: undefined,
      date: undefined,
    },
  },
  ClockPrimitiveComponent
)

// Attachments
Clock.Analog = ClockAnalog
Clock.Digital = ClockDigital
Clock.Timezone = ClockTimezone

export const { Context: ClockContext, useCompoundContext: useClockContext } =
  createCompoundContext<any>('Clock')
