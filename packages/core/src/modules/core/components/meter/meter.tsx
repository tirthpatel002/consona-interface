import React, { createContext, useContext } from 'react'
import {
  Meter as RACMeter,
  type MeterProps as RACMeterProps,
  type MeterRenderProps,
} from 'react-aria-components/Meter'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'

/* ==========================================================================
   Meter Thresholds
   ========================================================================== */

export type MeterBand = 'low' | 'optimum' | 'warning' | 'critical'

export interface MeterThresholds {
  /** Upper bound (inclusive) of the low / healthy band. */
  low?: number
  /** Upper bound (inclusive) of the optimum band. */
  optimum?: number
  /** Upper bound (inclusive) of the warning band. Values above this are critical. */
  warning?: number
}

export const DEFAULT_METER_THRESHOLDS: Required<MeterThresholds> = {
  low: 50,
  optimum: 70,
  warning: 90,
}

export function resolveMeterBand(
  percentage: number,
  thresholds: MeterThresholds = DEFAULT_METER_THRESHOLDS
): MeterBand {
  const low = thresholds.low ?? DEFAULT_METER_THRESHOLDS.low
  const optimum = thresholds.optimum ?? DEFAULT_METER_THRESHOLDS.optimum
  const warning = thresholds.warning ?? DEFAULT_METER_THRESHOLDS.warning
  if (percentage <= low) return 'low'
  if (percentage <= optimum) return 'optimum'
  if (percentage <= warning) return 'warning'
  return 'critical'
}

export function meterBandColor(band: MeterBand): string {
  switch (band) {
    case 'low':
      return 'var(--color-success)'
    case 'optimum':
      return 'var(--color-primary)'
    case 'warning':
      return 'var(--color-warning)'
    case 'critical':
      return 'var(--color-danger)'
  }
}

/* ==========================================================================
   Meter Context
   ========================================================================== */

export interface MeterContextValue extends MeterRenderProps {
  /** Explicit fill color override. */
  color?: string
  /** Active capacity band. */
  band: MeterBand
}

const DEFAULT_METER_CONTEXT: MeterContextValue = {
  percentage: 0,
  valueText: '0%',
  band: 'low',
}

const MeterContext = createContext<MeterContextValue | null>(null)

export function useMeterContext(): MeterContextValue {
  const ctx = useContext(MeterContext)
  return ctx ?? DEFAULT_METER_CONTEXT
}

/* ==========================================================================
   Meter Styles
   ========================================================================== */

export const meterStyles = tv({
  base: [
    'w-full',
    '[&>[data-slot=meter-header]+[data-slot=meter-track]]:mt-space-sm',
    "[&>[data-slot=meter-header]+[slot='description']]:mt-space-xs",
    "[&>[slot='description']+[data-slot=meter-track]]:mt-space-sm",
    '[&>[data-slot=meter-track]+[slot=description]]:mt-space-sm',
    '*:data-[slot=meter-header]:font-medium',
  ],
})

export const meterTrackStyles = tv({
  base: 'relative w-full overflow-hidden rounded-full bg-secondary outline outline-transparent -outline-offset-1',
  variants: {
    size: {
      sm: 'h-1',
      md: 'h-1.5',
      lg: 'h-2.5',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

export const MeterProvider = MeterContext.Provider

/* ==========================================================================
   Meter Root
   ========================================================================== */

export interface MeterSlots {
  /** Header row pairing label and live value. */
  header?: React.ComponentType<MeterHeaderProps>
  /** Capacity track. */
  track?: React.ComponentType<MeterTrackProps>
  /** Formatted value readout. */
  value?: React.ComponentType<MeterValueProps>
}

export interface MeterProps extends Omit<RACMeterProps, 'className' | 'children'> {
  /** Explicit children composition or render function. */
  children?: React.ReactNode | ((values: MeterRenderProps) => React.ReactNode)
  /** Track size token: sm, md, lg. */
  size?: 'sm' | 'md' | 'lg'
  /** Explicit fill color, bypassing threshold bands. */
  color?: string
  /** Threshold ranges used to color the fill. */
  thresholds?: MeterThresholds
  /** Whether the default anatomy shows a value header. */
  showValue?: boolean
  /** Custom CSS classes. */
  className?: string
  /** Slot overrides for header, track, and value. */
  slots?: SlotComponents<MeterSlots>
  /** Props passed into injected slots. */
  slotProps?: SlotPropsMap<MeterSlots>
}

const MeterPrimitive = ({
  className,
  children,
  size = 'md',
  color,
  thresholds,
  showValue = false,
  slots,
  slotProps,
  ...props
}: MeterProps) => {
  return (
    <RACMeter data-slot="meter" className={cn(meterStyles(), className)} {...props}>
      {(values) => {
        const band = resolveMeterBand(values.percentage ?? 0, thresholds)
        return (
          <MeterContext.Provider value={{ ...values, color, band }}>
            {children == null ? (
              <>
                {showValue &&
                  (renderSlot(slots?.header, slotProps?.header as object, { defaultComponent: MeterHeader }) ?? (
                    <MeterHeader>
                      {renderSlot(slots?.value, slotProps?.value as object, { defaultComponent: MeterValue })}
                    </MeterHeader>
                  ))}
                {renderSlot(
                  slots?.track,
                  { size, ...(slotProps?.track as object) },
                  { defaultComponent: MeterTrack }
                )}
              </>
            ) : typeof children === 'function' ? (
              children(values)
            ) : (
              children
            )}
          </MeterContext.Provider>
        )
      }}
    </RACMeter>
  )
}

export const Meter = createInterfaceComponent<MeterProps, MeterSlots>(
  {
    name: 'Meter',
    category: 'feedback',
    description: 'Accessible capacity gauge that colors fill by low, optimum, warning, and critical thresholds.',
    version: '1.0.0',
    props: {
      size: 'md',
      showValue: false,
    },
    slots: {
      header: undefined,
      track: undefined,
      value: undefined,
    },
  },
  MeterPrimitive
)

/* ==========================================================================
   Meter Header
   ========================================================================== */

export interface MeterHeaderProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Optional DOM ref attached to the header row. */
  ref?: React.Ref<HTMLDivElement>
}

const MeterHeaderPrimitive = ({ className, ref, ...props }: MeterHeaderProps) => (
  <div
    ref={ref}
    data-slot="meter-header"
    className={cn('flex items-center justify-between gap-space-sm', className)}
    {...props}
  />
)

export const MeterHeader = createInterfaceComponent<MeterHeaderProps>(
  {
    name: 'MeterHeader',
    category: 'feedback',
    description: 'Header row for a meter pairing a label with the live value.',
    version: '1.0.0',
  },
  MeterHeaderPrimitive
)

/* ==========================================================================
   Meter Value
   ========================================================================== */

export interface MeterValueProps extends Omit<React.ComponentPropsWithoutRef<'span'>, 'children'> {
  /** Optional DOM ref attached to the value text. */
  ref?: React.Ref<HTMLSpanElement>
}

const MeterValuePrimitive = ({ className, ref, ...props }: MeterValueProps) => {
  const { valueText } = useMeterContext()
  return (
    <span
      ref={ref}
      data-slot="meter-value"
      className={cn('text-sm/5 tabular-nums text-muted-fg', className)}
      {...props}
    >
      {valueText}
    </span>
  )
}

export const MeterValue = createInterfaceComponent<MeterValueProps>(
  {
    name: 'MeterValue',
    category: 'feedback',
    description: 'Formatted meter value text from the React Aria meter state.',
    version: '1.0.0',
  },
  MeterValuePrimitive
)

/* ==========================================================================
   Meter Track
   ========================================================================== */

export interface MeterTrackProps
  extends React.ComponentPropsWithoutRef<'div'>,
    VariantProps<typeof meterTrackStyles> {
  /** Track size token: sm, md, lg. */
  size?: 'sm' | 'md' | 'lg'
  /** Optional DOM ref attached to the track. */
  ref?: React.Ref<HTMLDivElement>
}

const MeterTrackPrimitive = ({ className, size = 'md', ref, ...props }: MeterTrackProps) => {
  const { percentage, color, band } = useMeterContext()
  return (
    <div
      ref={ref}
      data-slot="meter-track"
      data-band={band}
      className={meterTrackStyles({ size, className })}
      {...props}
    >
      <div
        data-slot="meter-fill"
        className="absolute inset-y-0 start-0 rounded-full transition-[width] duration-200 ease-linear will-change-[width] motion-reduce:transition-none forced-colors:bg-[Highlight]"
        style={{
          width: `${percentage ?? 0}%`,
          backgroundColor: color ?? meterBandColor(band),
        }}
      />
    </div>
  )
}

export const MeterTrack = createInterfaceComponent<MeterTrackProps>(
  {
    name: 'MeterTrack',
    category: 'feedback',
    description: 'Meter track with threshold-colored fill representing current capacity.',
    version: '1.0.0',
    props: {
      size: 'md',
    },
  },
  MeterTrackPrimitive
)

Meter.Header = MeterHeader
Meter.Value = MeterValue
Meter.Track = MeterTrack
Meter.Provider = MeterProvider
