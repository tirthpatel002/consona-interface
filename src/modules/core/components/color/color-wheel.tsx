import React from 'react'
import {
  ColorWheel as RACColorWheel,
  type ColorWheelProps as RACColorWheelProps,
  ColorWheelTrack as RACColorWheelTrack,
} from 'react-aria-components'
import type { Color } from '@react-stately/color'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { ColorThumb, type ColorThumbProps } from './color-thumb'

/* ==========================================================================
   ColorWheel Slots & Props
   ========================================================================== */

export interface ColorWheelSlots {
  /** Cursor thumb indicator slot */
  thumb?: React.ComponentType<ColorThumbProps>
}

export interface ColorWheelProps extends Omit<RACColorWheelProps, 'outerRadius' | 'innerRadius' | 'children'> {
  /** Outer radial dimension in pixels. */
  outerRadius?: number
  /** Inner cutout radius dimension in pixels. */
  innerRadius?: number
  /** Controlled color value (HSB/HSL Color object). */
  value?: Color
  /** Default uncontrolled initial color value. */
  defaultValue?: Color | string
  /** Handler called when hue angle changes. */
  onChange?: (color: Color) => void
  /** Whether user interaction is disabled. */
  isDisabled?: boolean
  /** Custom CSS classes for the wheel. */
  className?: string
  /** Custom thumb child element. */
  children?: React.ReactNode | ((values: any) => React.ReactNode)
  /** Injected slot component overrides. */
  slots?: SlotComponents<ColorWheelSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ColorWheelSlots>
}

const ColorWheelPrimitive = ({
  outerRadius = 100,
  innerRadius = 74,
  className,
  style,
  children,
  slots = {},
  slotProps = {},
  ...props
}: ColorWheelProps) => {
  const thumbNode = renderSlot(
    slots.thumb,
    { ...slotProps.thumb },
    { defaultComponent: ColorThumb }
  )

  return (
    <RACColorWheel
      data-slot="color-wheel"
      outerRadius={outerRadius}
      innerRadius={innerRadius}
      {...props}
      className={cn(className)}
      style={style}
    >
      <RACColorWheelTrack
        data-slot="color-wheel-track"
        className="rounded-full border border-border/80 shadow-xs disabled:bg-muted-fg forced-colors:disabled:bg-[GrayText]"
        style={({ defaultStyle, isDisabled }) => ({
          ...defaultStyle,
          background: isDisabled
            ? undefined
            : `${defaultStyle.background}, repeating-conic-gradient(#CCC 0% 25%, white 0% 50%) 50% / 16px 16px`,
        })}
      />
      {typeof children === 'function'
        ? (children as any)
        : (children ?? thumbNode)}
    </RACColorWheel>
  )
}

export const ColorWheel = createInterfaceComponent<ColorWheelProps, ColorWheelSlots>(
  {
    name: 'ColorWheel',
    category: 'form',
    description: 'Circular radial color wheel for hue selection.',
    version: '1.0.0',
    props: {
      outerRadius: 100,
      innerRadius: 74,
      isDisabled: false,
    },
    slots: {
      thumb: ColorThumb,
    },
  },
  ColorWheelPrimitive
)

// Namespace attachments for compound family ergonomics
ColorWheel.Thumb = ColorThumb

