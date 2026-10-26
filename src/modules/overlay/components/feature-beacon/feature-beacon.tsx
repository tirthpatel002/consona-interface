import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { calculateFloatingPosition } from '../../engine/positioning'
import { useTargetGeometry } from '../../hooks/use-overlay'
import type { OverlayPlacement, OverlayTargetResolver } from '../../engine/types'

const SIZE_CLASSES = {
  xs: 'size-2',
  sm: 'size-2.5',
  md: 'size-3.5',
  lg: 'size-5',
}

const PULSE_CLASSES = {
  xs: 'size-4 -top-1 -left-1',
  sm: 'size-5.5 -top-1.5 -left-1.5',
  md: 'size-7 -top-1.75 -left-1.75',
  lg: 'size-10 -top-2.5 -left-2.5',
}

const INTENT_CLASSES = {
  primary: 'bg-primary text-primary shadow-primary/50',
  success: 'bg-success text-success shadow-success/50',
  warning: 'bg-warning text-warning shadow-warning/50',
  danger: 'bg-danger text-danger shadow-danger/50',
}

/* ==========================================================================
   FeatureBeacon Slot Definitions
   ========================================================================== */

export interface FeatureBeaconSlots {
  /** Custom pulse ping animation layer slot. */
  pulse?: React.ComponentType<React.HTMLAttributes<HTMLSpanElement>>
  /** Center core dot layer slot. */
  dot?: React.ComponentType<React.HTMLAttributes<HTMLSpanElement>>
}

/* ==========================================================================
   FeatureBeacon Props
   ========================================================================== */

export interface FeatureBeaconProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Anchor target (optional; if not provided renders inline). */
  target?: OverlayTargetResolver
  /** Size variant: xs, sm, md, lg. */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** Color intent: primary, success, warning, danger. */
  intent?: 'primary' | 'success' | 'warning' | 'danger'
  /** Accessible label. */
  label?: string
  /** Custom pulse animation. */
  pulse?: boolean
  /** Placement if anchored to target. */
  placement?: OverlayPlacement
  /** Custom offset if anchored. */
  offset?: number
  /** Custom slot components. */
  slots?: SlotComponents<FeatureBeaconSlots>
  /** Custom slot props map. */
  slotProps?: SlotPropsMap<FeatureBeaconSlots>
}

const FeatureBeaconPrimitive = ({
  target,
  size = 'md',
  intent = 'primary',
  label = 'New feature indicator',
  pulse = true,
  placement = 'top-end',
  offset = 4,
  className,
  slots,
  slotProps,
  ...props
}: FeatureBeaconProps) => {
  const [mounted, setMounted] = useState(false)
  const { rect: targetRect } = useTargetGeometry(target, 0)

  useEffect(() => {
    setMounted(true)
  }, [])

  const beacon = (
    <button
      type="button"
      data-slot="feature-beacon"
      aria-label={label}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full transition-transform hover:scale-125 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary cursor-pointer',
        SIZE_CLASSES[size],
        INTENT_CLASSES[intent],
        className
      )}
      {...props}
    >
      {/* Animated Expanding Radar Pulse Ring */}
      {pulse && (
        <span
          data-slot="pulse"
          className={cn(
            'absolute rounded-full opacity-75 animate-ping pointer-events-none',
            PULSE_CLASSES[size],
            INTENT_CLASSES[intent]
          )}
        >
          {slots?.pulse && renderSlot(slots.pulse, slotProps?.pulse as any)}
        </span>
      )}
      <span
        data-slot="dot"
        className={cn('relative inline-flex rounded-full size-full', INTENT_CLASSES[intent])}
      >
        {slots?.dot && renderSlot(slots.dot, slotProps?.dot as any)}
      </span>
    </button>
  )

  if (!target) {
    return beacon
  }

  if (!mounted || !targetRect) return null

  const pos = calculateFloatingPosition(targetRect, 20, 20, placement, { offset })

  return createPortal(
    <div
      className="fixed z-[9990] pointer-events-auto"
      style={{
        top: `${pos.y}px`,
        left: `${pos.x}px`,
      }}
    >
      {beacon}
    </div>,
    document.body
  )
}

export const FeatureBeacon = createInterfaceComponent<FeatureBeaconProps, FeatureBeaconSlots>(
  {
    name: 'FeatureBeacon',
    category: 'overlay',
    description: 'Animated hotspot radar beacon indicator anchored to target coordinates or rendered inline.',
    version: '1.0.0',
    props: {
      size: 'md',
      intent: 'primary',
      label: 'New feature indicator',
      pulse: true,
      placement: 'top-end',
      offset: 4,
    },
    slots: {
      pulse: undefined,
      dot: undefined,
    },
  },
  FeatureBeaconPrimitive
)
