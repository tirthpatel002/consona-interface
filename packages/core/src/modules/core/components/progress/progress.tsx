import React, { createContext, useContext } from 'react'
import {
  ProgressBar as RACProgressBar,
  type ProgressBarProps as RACProgressBarProps,
  type ProgressBarRenderProps,
} from 'react-aria-components/ProgressBar'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'

/* ==========================================================================
   Progress Context
   ========================================================================== */

const DEFAULT_PROGRESS_CONTEXT: ProgressBarRenderProps = {
  percentage: 0,
  valueText: '0%',
  isIndeterminate: false,
}

const ProgressContext = createContext<ProgressBarRenderProps | null>(null)

export function useProgressContext(): ProgressBarRenderProps {
  const ctx = useContext(ProgressContext)
  return ctx ?? DEFAULT_PROGRESS_CONTEXT
}

/* ==========================================================================
   Progress Styles
   ========================================================================== */

export const progressStyles = tv({
  base: [
    'w-full',
    '[&>[data-slot=progress-header]+[data-slot=progress-track]]:mt-space-sm',
    "[&>[data-slot=progress-header]+[slot='description']]:mt-space-xs",
    "[&>[slot='description']+[data-slot=progress-track]]:mt-space-sm",
    '[&>[data-slot=progress-track]+[slot=description]]:mt-space-sm',
    '*:data-[slot=progress-header]:font-medium',
  ],
})

export const progressTrackStyles = tv({
  base: [
    'relative w-full overflow-hidden rounded-full bg-secondary outline-1 outline-transparent -outline-offset-1',
    'will-change-transform',
  ],
  variants: {
    size: {
      sm: 'h-1',
      md: 'h-1.5',
      lg: 'h-2.5',
    },
    intent: {
      primary: '[--progress-fill:var(--color-primary)]',
      success: '[--progress-fill:var(--color-success)]',
      warning: '[--progress-fill:var(--color-warning)]',
      danger: '[--progress-fill:var(--color-danger)]',
    },
  },
  defaultVariants: {
    size: 'md',
    intent: 'primary',
  },
})

export const progressCircleStyles = tv({
  base: 'shrink-0',
  variants: {
    size: {
      sm: 'size-4',
      md: 'size-8',
      lg: 'size-14',
      xl: 'size-20',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

export const ProgressProvider = ProgressContext.Provider

/* ==========================================================================
   Progress Root
   ========================================================================== */

export interface ProgressSlots {
  /** Optional header row containing label and value. */
  header?: React.ComponentType<ProgressHeaderProps>
  /** Linear track and fill. */
  track?: React.ComponentType<ProgressTrackProps>
  /** Percentage / formatted value readout. */
  value?: React.ComponentType<ProgressValueProps>
}

export interface ProgressProps extends Omit<RACProgressBarProps, 'className' | 'children'> {
  /** Explicit children composition or render function. */
  children?: React.ReactNode | ((values: ProgressBarRenderProps) => React.ReactNode)
  /** Linear bar size token: sm, md, lg. */
  size?: 'sm' | 'md' | 'lg'
  /** Semantic fill intent: primary, success, warning, danger. */
  intent?: 'primary' | 'success' | 'warning' | 'danger'
  /** Whether a percentage label is rendered when using the default track anatomy. */
  showValue?: boolean
  /** Custom CSS classes. */
  className?: string
  /** Slot overrides for header, track, and value. */
  slots?: SlotComponents<ProgressSlots>
  /** Props passed into injected slots. */
  slotProps?: SlotPropsMap<ProgressSlots>
}

const ProgressPrimitive = ({
  className,
  children,
  size = 'md',
  intent = 'primary',
  showValue = false,
  slots,
  slotProps,
  ...props
}: ProgressProps) => {
  return (
    <RACProgressBar
      data-slot="progress"
      className={cn(progressStyles(), className)}
      {...props}
    >
      {(values) => (
        <ProgressContext.Provider value={values}>
          {children == null ? (
            <>
              {showValue &&
                (renderSlot(slots?.header, { ...(slotProps?.header as object) }, { defaultComponent: ProgressHeader }) ?? (
                  <ProgressHeader>
                    {renderSlot(slots?.value, slotProps?.value as object, { defaultComponent: ProgressValue })}
                  </ProgressHeader>
                ))}
              {renderSlot(
                slots?.track,
                { size, intent, ...(slotProps?.track as object) },
                { defaultComponent: ProgressTrack }
              )}
            </>
          ) : typeof children === 'function' ? (
            children(values)
          ) : (
            children
          )}
        </ProgressContext.Provider>
      )}
    </RACProgressBar>
  )
}

export const Progress = createInterfaceComponent<ProgressProps, ProgressSlots>(
  {
    name: 'Progress',
    category: 'feedback',
    description: 'Accessible determinate and indeterminate linear progress bar with optical fill and percentage labels.',
    version: '1.0.0',
    props: {
      size: 'md',
      intent: 'primary',
      showValue: false,
    },
    slots: {
      header: undefined,
      track: undefined,
      value: undefined,
    },
  },
  ProgressPrimitive
)

/* ==========================================================================
   Progress Header
   ========================================================================== */

export interface ProgressHeaderProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Optional DOM ref attached to the header row. */
  ref?: React.Ref<HTMLDivElement>
}

const ProgressHeaderPrimitive = ({ className, ref, ...props }: ProgressHeaderProps) => (
  <div
    ref={ref}
    data-slot="progress-header"
    className={cn('flex items-center justify-between gap-space-sm', className)}
    {...props}
  />
)

export const ProgressHeader = createInterfaceComponent<ProgressHeaderProps>(
  {
    name: 'ProgressHeader',
    category: 'feedback',
    description: 'Header row for a progress bar pairing a label with the live value.',
    version: '1.0.0',
  },
  ProgressHeaderPrimitive
)

/* ==========================================================================
   Progress Value
   ========================================================================== */

export interface ProgressValueProps extends Omit<React.ComponentPropsWithoutRef<'span'>, 'children'> {
  /** Optional DOM ref attached to the value text. */
  ref?: React.Ref<HTMLSpanElement>
}

const ProgressValuePrimitive = ({ className, ref, ...props }: ProgressValueProps) => {
  const { valueText } = useProgressContext()
  return (
    <span
      ref={ref}
      data-slot="progress-value"
      className={cn('text-sm/5 tabular-nums text-muted-fg', className)}
      {...props}
    >
      {valueText}
    </span>
  )
}

export const ProgressValue = createInterfaceComponent<ProgressValueProps>(
  {
    name: 'ProgressValue',
    category: 'feedback',
    description: 'Formatted progress percentage or value text from the React Aria progress state.',
    version: '1.0.0',
  },
  ProgressValuePrimitive
)

/* ==========================================================================
   Progress Track
   ========================================================================== */

export interface ProgressTrackProps
  extends React.ComponentPropsWithoutRef<'div'>,
    VariantProps<typeof progressTrackStyles> {
  /** Linear bar size token: sm, md, lg. */
  size?: 'sm' | 'md' | 'lg'
  /** Semantic fill intent. */
  intent?: 'primary' | 'success' | 'warning' | 'danger'
  /** Optional DOM ref attached to the track. */
  ref?: React.Ref<HTMLDivElement>
}

const ProgressTrackPrimitive = ({
  className,
  size = 'md',
  intent = 'primary',
  ref,
  ...props
}: ProgressTrackProps) => {
  const { isIndeterminate, percentage } = useProgressContext()
  return (
    <div data-slot="progress-track" className="relative block w-full">
      <div
        ref={ref}
        className={progressTrackStyles({ size, intent, className })}
        {...props}
      >
        {!isIndeterminate ? (
          <div
            data-slot="progress-fill"
            className="absolute inset-y-0 start-0 rounded-full bg-(--progress-fill) transition-[width] duration-200 ease-linear will-change-[width] motion-reduce:transition-none forced-colors:bg-[Highlight]"
            style={{ width: `${percentage ?? 0}%` }}
          />
        ) : (
          <div
            data-slot="progress-fill"
            className="absolute inset-y-0 w-2/5 animate-[progress-slide_2000ms_ease-in-out_infinite] rounded-full bg-(--progress-fill) forced-colors:bg-[Highlight]"
          />
        )}
      </div>
    </div>
  )
}

export const ProgressTrack = createInterfaceComponent<ProgressTrackProps>(
  {
    name: 'ProgressTrack',
    category: 'feedback',
    description: 'Linear progress track with determinate fill or sliding indeterminate bar.',
    version: '1.0.0',
    props: {
      size: 'md',
      intent: 'primary',
    },
  },
  ProgressTrackPrimitive
)

/* ==========================================================================
   Progress Circle
   ========================================================================== */

export interface ProgressCircleSlots {
  /** Optional centered label inside larger circles. */
  label?: React.ComponentType<ProgressValueProps>
}

export interface ProgressCircleProps extends Omit<RACProgressBarProps, 'className'> {
  /** Circle diameter token: sm, md, lg, xl. */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Whether a centered percentage label is shown (md+). */
  showValue?: boolean
  /** Custom CSS classes. */
  className?: string
  /** Optional DOM ref attached to the circle root. */
  ref?: React.Ref<HTMLDivElement>
  /** Slot overrides for the centered label. */
  slots?: SlotComponents<ProgressCircleSlots>
  /** Props passed into injected slots. */
  slotProps?: SlotPropsMap<ProgressCircleSlots>
}

const ProgressCirclePrimitive = ({
  className,
  size = 'md',
  showValue = false,
  slots,
  slotProps,
  ref,
  ...props
}: ProgressCircleProps) => {
  const c = '50%'
  const r = 'calc(50% - 2px)'
  return (
    <RACProgressBar {...props} ref={ref as any}>
      {(values) => (
        <span data-slot="progress-circle" className="relative inline-grid place-items-center">
          <svg
            className={cn(progressCircleStyles({ size }), className)}
            viewBox="0 0 24 24"
            fill="none"
            data-slot="icon"
          >
            <circle cx={c} cy={c} r={r} strokeWidth={3} stroke="currentColor" strokeOpacity={0.25} />
            {!values.isIndeterminate ? (
              <circle
                cx={c}
                cy={c}
                r={r}
                strokeWidth={3}
                stroke="currentColor"
                pathLength={100}
                strokeDasharray="100 200"
                strokeDashoffset={100 - (values.percentage ?? 0)}
                strokeLinecap="round"
                transform="rotate(-90)"
                className="origin-center"
              />
            ) : (
              <circle
                cx={c}
                cy={c}
                r={r}
                strokeWidth={3}
                stroke="currentColor"
                pathLength={100}
                strokeDasharray="100 200"
                strokeDashoffset={70}
                strokeLinecap="round"
                className="origin-center animate-[spin_1s_cubic-bezier(0.4,0,0.2,1)_infinite]"
              />
            )}
          </svg>
          {showValue && size !== 'sm' && (
            <span className="absolute inset-0 grid place-items-center text-[0.625rem] font-medium tabular-nums">
              {renderSlot(slots?.label, slotProps?.label as object) ??
                `${Math.round(values.percentage ?? 0)}%`}
            </span>
          )}
        </span>
      )}
    </RACProgressBar>
  )
}

export const ProgressCircle = createInterfaceComponent<ProgressCircleProps, ProgressCircleSlots>(
  {
    name: 'ProgressCircle',
    category: 'feedback',
    description: 'Concentric circular progress indicator with determinate arc and spinning indeterminate state.',
    version: '1.0.0',
    props: {
      size: 'md',
      showValue: false,
    },
    slots: {
      label: undefined,
    },
  },
  ProgressCirclePrimitive
)

Progress.Header = ProgressHeader
Progress.Value = ProgressValue
Progress.Track = ProgressTrack
Progress.Circle = ProgressCircle
Progress.Provider = ProgressProvider
