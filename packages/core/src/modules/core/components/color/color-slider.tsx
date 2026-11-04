import React from 'react'
import {
  ColorSlider as RACColorSlider,
  type ColorSliderProps as RACColorSliderProps,
  SliderOutput as RACSliderOutput,
  type SliderOutputProps as RACSliderOutputProps,
  SliderTrack as RACSliderTrack,
  type SliderTrackProps as RACSliderTrackProps,
  type ColorChannel,
} from 'react-aria-components'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { ColorThumb, type ColorThumbProps } from './color-thumb'
import { fieldStyles } from '../field'

/* ==========================================================================
   ColorSlider Styles
   ========================================================================== */

export const colorSliderStyles = tv({
  base: 'orientation-vertical:flex orientation-horizontal:grid orientation-horizontal:w-full grid-cols-[1fr_auto] flex-col items-center gap-space-sm',
})

/* ==========================================================================
   ColorSliderOutput Subcomponent & Factory
   ========================================================================== */

export interface ColorSliderOutputSlots {}

export interface ColorSliderOutputProps extends RACSliderOutputProps {
  /** Custom CSS classes for the output element. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<ColorSliderOutputSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ColorSliderOutputSlots>
}

const ColorSliderOutputPrimitive = ({
  className,
  slots,
  slotProps,
  ...props
}: ColorSliderOutputProps) => {
  return (
    <RACSliderOutput
      data-slot="color-slider-output"
      className={cn('orientation-vertical:hidden font-medium text-base/6 sm:text-sm/6 select-none', className)}
      {...props}
    />
  )
}

export const ColorSliderOutput = createInterfaceComponent<ColorSliderOutputProps, ColorSliderOutputSlots>(
  {
    name: 'ColorSliderOutput',
    category: 'form',
    description: 'Value output display for ColorSlider.',
    version: '1.0.0',
    slots: {},
  },
  ColorSliderOutputPrimitive
)

/* ==========================================================================
   ColorSliderTrack Subcomponent & Factory
   ========================================================================== */

export interface ColorSliderTrackSlots {
  /** Thumb cursor indicator slot */
  thumb?: React.ComponentType<ColorThumbProps>
}

export interface ColorSliderTrackProps extends RACSliderTrackProps {
  /** Custom CSS classes for the slider track. */
  className?: string
  /** Custom thumb child element. */
  children?: React.ReactNode
  /** Injected slot component overrides. */
  slots?: SlotComponents<ColorSliderTrackSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ColorSliderTrackSlots>
}

const ColorSliderTrackPrimitive = ({
  className,
  style,
  children,
  slots = {},
  slotProps = {},
  ...props
}: ColorSliderTrackProps) => {
  const thumbNode = renderSlot(
    slots.thumb,
    { ...slotProps.thumb },
    { defaultComponent: ColorThumb }
  )

  return (
    <RACSliderTrack
      data-slot="color-slider-track"
      {...props}
      className={cn(
        'group col-span-2 orientation-horizontal:h-6 rounded-base border border-border/80 shadow-xs overflow-hidden',
        'orientation-horizontal:h-6 orientation-horizontal:w-full',
        'orientation-vertical:ms-[50%] orientation-vertical:h-56 orientation-vertical:w-6 orientation-vertical:-translate-x-[50%]',
        'disabled:bg-muted-fg disabled:opacity-50 forced-colors:bg-[GrayText]',
        className
      )}
      style={(renderProps: any) => ({
        ...renderProps.defaultStyle,
        background: renderProps.isDisabled
          ? undefined
          : `${renderProps.defaultStyle?.background}, repeating-conic-gradient(#CCC 0% 25%, white 0% 50%) 50% / 16px 16px`,
        ...(typeof style === 'function' ? style(renderProps) : style),
      })}
    >
      {children ?? thumbNode}
    </RACSliderTrack>
  )
}

export const ColorSliderTrack = createInterfaceComponent<ColorSliderTrackProps, ColorSliderTrackSlots>(
  {
    name: 'ColorSliderTrack',
    category: 'form',
    description: 'Track container for ColorSlider.',
    version: '1.0.0',
    slots: {
      thumb: ColorThumb,
    },
  },
  ColorSliderTrackPrimitive
)

/* ==========================================================================
   ColorSlider Slots & Props
   ========================================================================== */

export interface ColorSliderSlots {
  /** Value output slot */
  output?: React.ComponentType<ColorSliderOutputProps>
  /** Slider track slot */
  track?: React.ComponentType<ColorSliderTrackProps>
}

export interface ColorSliderProps
  extends Omit<RACColorSliderProps, 'children'>,
    VariantProps<typeof colorSliderStyles> {
  /** The color channel this slider controls: 'hue', 'saturation', 'brightness', 'lightness', 'alpha', 'red', 'green', 'blue'. */
  channel: ColorChannel
  /** Orientation of the slider track: 'horizontal' or 'vertical'. */
  orientation?: 'horizontal' | 'vertical'
  /** Whether the color slider is disabled. */
  isDisabled?: boolean
  /** Custom CSS classes for the slider container. */
  className?: string
  /** Child elements including track and output. */
  children?: React.ReactNode
  /** Injected slot component overrides. */
  slots?: SlotComponents<ColorSliderSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ColorSliderSlots>
}

const resolveColorSpace = (channel?: ColorChannel, colorSpace?: string) => {
  if (colorSpace) return colorSpace as any
  if (channel === 'hue' || channel === 'saturation' || channel === 'brightness' || channel === 'alpha') return 'hsb'
  if (channel === 'lightness') return 'hsl'
  if (channel === 'red' || channel === 'green' || channel === 'blue') return 'rgb'
  return undefined
}

const ColorSliderPrimitive = ({
  channel = 'hue',
  colorSpace,
  className,
  children,
  slots = {},
  slotProps = {},
  ...props
}: ColorSliderProps) => {
  const resolvedColorSpace = resolveColorSpace(channel, colorSpace)

  return (
    <RACColorSlider
      data-slot="color-slider"
      channel={channel}
      colorSpace={resolvedColorSpace}
      className={cn(colorSliderStyles(), fieldStyles(), className)}
      {...props}
    >
      {children ?? (
        <>
          {slots.output && renderSlot(slots.output, { ...slotProps.output }, { defaultComponent: ColorSliderOutput })}
          {renderSlot(
            slots.track,
            { ...slotProps.track },
            { defaultComponent: ColorSliderTrack }
          )}
        </>
      )}
    </RACColorSlider>
  )
}

export const ColorSlider = createInterfaceComponent<ColorSliderProps, ColorSliderSlots>(
  {
    name: 'ColorSlider',
    category: 'form',
    description: '1D channel color slider (Hue, Alpha, Saturation, Lightness).',
    version: '1.0.0',
    props: {
      channel: 'hue',
      orientation: 'horizontal',
      isDisabled: false,
    },
    slots: {
      output: undefined,
      track: ColorSliderTrack,
    },
  },
  ColorSliderPrimitive
)

ColorSlider.Output = ColorSliderOutput
ColorSlider.Track = ColorSliderTrack
ColorSlider.Thumb = ColorThumb
