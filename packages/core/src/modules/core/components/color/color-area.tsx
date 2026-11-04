import React from 'react'
import {
  ColorArea as RACColorArea,
  type ColorAreaProps as RACColorAreaProps,
  type ColorChannel,
} from 'react-aria-components'
import type { Color } from '@react-stately/color'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { ColorThumb, type ColorThumbProps } from './color-thumb'

/* ==========================================================================
   ColorArea Styles
   ========================================================================== */

export const colorAreaStyles = tv({
  base: 'size-56 shrink-0 rounded-base  shadow-xs bg-muted disabled:bg-muted-fg forced-colors:bg-[GrayText] outline-none relative select-none touch-none overflow-hidden',
})

/* ==========================================================================
   ColorArea Slots & Props
   ========================================================================== */

export interface ColorAreaSlots {
  /** Cursor thumb indicator slot */
  thumb?: React.ComponentType<ColorThumbProps>
}

export interface ColorAreaProps
  extends Omit<RACColorAreaProps, 'children'>,
    VariantProps<typeof colorAreaStyles> {
  /** Color channel mapped along the horizontal X-axis (e.g. 'saturation', 'red', 'green', 'blue'). */
  xChannel?: ColorChannel
  /** Color channel mapped along the vertical Y-axis (e.g. 'brightness', 'lightness', 'green', 'blue'). */
  yChannel?: ColorChannel
  /** Controlled color value (HSB/HSL/RGB Color object). */
  value?: Color
  /** Default uncontrolled initial color value. */
  defaultValue?: Color | string
  /** Handler called when color changes. */
  onChange?: (color: Color) => void
  /** Whether user interaction is disabled. */
  isDisabled?: boolean
  /** Custom CSS classes for the color area canvas. */
  className?: string
  /** Custom thumb child element. */
  children?: React.ReactNode
  /** Injected slot component overrides. */
  slots?: SlotComponents<ColorAreaSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ColorAreaSlots>
}

const ColorAreaPrimitive = ({
  colorSpace = 'hsb',
  xChannel = 'saturation',
  yChannel = 'brightness',
  className,
  style,
  children,
  slots = {},
  slotProps = {},
  ...props
}: ColorAreaProps) => {
  const thumbNode = renderSlot(
    slots.thumb,
    { ...slotProps.thumb },
    { defaultComponent: ColorThumb }
  )

  return (
    <RACColorArea
      data-slot="color-area"
      colorSpace={colorSpace}
      xChannel={xChannel}
      yChannel={yChannel}
      {...props}
      className={cn(colorAreaStyles(), className)}
      style={(renderProps: any) => ({
        ...renderProps.defaultStyle,
        background: renderProps.isDisabled ? undefined : renderProps.defaultStyle?.background,
        ...(typeof style === 'function' ? style(renderProps) : style),
      })}
    >
      {children ?? thumbNode}
    </RACColorArea>
  )
}

export const ColorArea = createInterfaceComponent<ColorAreaProps, ColorAreaSlots>(
  {
    name: 'ColorArea',
    category: 'form',
    description: '2D saturation and brightness picker area for color selection.',
    version: '1.0.0',
    props: {
      isDisabled: false,
    },
    slots: {
      thumb: ColorThumb,
    },
  },
  ColorAreaPrimitive
)

// Namespace attachments for compound family ergonomics
ColorArea.Thumb = ColorThumb

