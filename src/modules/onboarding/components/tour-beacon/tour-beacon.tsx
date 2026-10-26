import React from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { useTour } from '../../context'

/* ==========================================================================
   TourBeacon Slot Definitions
   ========================================================================== */

export interface TourBeaconSlots {
  /** Pulse ping ring layer slot. */
  pulse?: React.ComponentType<React.HTMLAttributes<HTMLSpanElement>>
  /** Center core dot indicator slot. */
  dot?: React.ComponentType<React.HTMLAttributes<HTMLSpanElement>>
}

/* ==========================================================================
   TourBeacon Props
   ========================================================================== */

export interface TourBeaconProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Optional tour ID to launch when clicked. */
  tourId?: string
  /** Step index to start at if launching a tour. */
  startStep?: number
  /** Visual intent color: primary, success, warning, danger. */
  intent?: 'primary' | 'success' | 'warning' | 'danger'
  /** Beacon size: sm, md, lg. */
  size?: 'sm' | 'md' | 'lg'
  /** Whether the beacon has an active pulsing animation. */
  pulse?: boolean
  /** Accessible label. */
  label?: string
  /** Custom slot components. */
  slots?: SlotComponents<TourBeaconSlots>
  /** Custom slot props map. */
  slotProps?: SlotPropsMap<TourBeaconSlots>
}

const TourBeaconPrimitive = ({
  tourId,
  startStep = 0,
  intent = 'primary',
  size = 'md',
  pulse = true,
  label = 'View feature guide',
  className,
  onClick,
  slots,
  slotProps,
  ...props
}: TourBeaconProps) => {
  let tourCtx: ReturnType<typeof useTour> | null = null
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    tourCtx = useTour()
  } catch {
    tourCtx = null
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e)
    }
    if (tourId && tourCtx) {
      tourCtx.startTour(tourId, startStep)
    }
  }

  const sizeClasses = {
    sm: 'size-3.5',
    md: 'size-5',
    lg: 'size-6',
  }[size]

  const dotClasses = {
    sm: 'size-1.5',
    md: 'size-2',
    lg: 'size-2.5',
  }[size]

  const intentColor = {
    primary: 'bg-primary text-primary-fg border-primary',
    success: 'bg-success text-success-fg border-success',
    warning: 'bg-warning text-warning-fg border-warning',
    danger: 'bg-danger text-danger-fg border-danger',
  }[intent]

  return (
    <button
      type="button"
      data-slot="tour-beacon"
      aria-label={label}
      onClick={handleClick}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary',
        sizeClasses,
        className
      )}
      {...props}
    >
      {/* Outer Pulse Waves */}
      {pulse && (
        <span
          data-slot="tour-beacon-pulse"
          className={cn(
            'absolute inset-0 rounded-full opacity-60 animate-ping',
            intentColor.split(' ')[0]
          )}
          style={{ animationDuration: '2.5s' }}
        >
          {slots?.pulse && renderSlot(slots.pulse, slotProps?.pulse as any)}
        </span>
      )}

      {/* Halo ring */}
      <span
        data-slot="tour-beacon-halo"
        className={cn(
          'absolute inset-0 rounded-full opacity-30 border',
          intentColor.split(' ')[2]
        )}
      />

      {/* Core Center Dot */}
      <span
        data-slot="tour-beacon-dot"
        className={cn(
          'relative rounded-full shadow-sm',
          dotClasses,
          intentColor.split(' ')[0]
        )}
      >
        {slots?.dot && renderSlot(slots.dot, slotProps?.dot as any)}
      </span>
    </button>
  )
}

export const TourBeacon = createInterfaceComponent<TourBeaconProps, TourBeaconSlots>(
  {
    name: 'TourBeacon',
    category: 'onboarding',
    description: 'Hotspot radar beacon launching interactive product tours on click.',
    version: '1.0.0',
    props: {
      startStep: 0,
      intent: 'primary',
      size: 'md',
      pulse: true,
      label: 'View feature guide',
    },
    slots: {
      pulse: undefined,
      dot: undefined,
    },
  },
  TourBeaconPrimitive
)
