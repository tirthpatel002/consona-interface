import React from 'react'
import {
  ColorSwatch as RACColorSwatch,
  type ColorSwatchProps as RACColorSwatchProps,
} from 'react-aria-components'
import type { Color } from '@react-stately/color'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'

export const colorSwatchStyles = tv({
  base: 'size-8 shrink-0 rounded-base border border-border/80 shadow-2xs relative overflow-hidden',
  variants: {
    size: {
      xs: 'size-5 rounded-micro',
      sm: 'size-6 rounded-micro',
      md: 'size-8 rounded-base',
      lg: 'size-10 rounded-base',
      xl: 'size-12 rounded-macro',
    },
    shape: {
      square: 'rounded-base',
      circle: 'rounded-full',
    },
  },
  defaultVariants: {
    size: 'md',
    shape: 'square',
  },
})

/* ==========================================================================
   ColorSwatch Slots & Props
   ========================================================================== */

export interface ColorSwatchSlots {}

export interface ColorSwatchProps
  extends Omit<RACColorSwatchProps, 'color'>,
    VariantProps<typeof colorSwatchStyles> {
  /** Color value to preview (Color object or CSS color string). */
  color?: Color | string
  /** Size token scaling swatch dimensions: 'xs', 'sm', 'md', 'lg', 'xl'. */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Geometric shape: 'square' or 'circle'. */
  shape?: 'square' | 'circle'
  /** Custom CSS classes for the swatch element. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<ColorSwatchSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ColorSwatchSlots>
}

const ColorSwatchPrimitive = ({
  size = 'md',
  shape = 'square',
  className,
  slots,
  slotProps,
  ...props
}: ColorSwatchProps) => {
  return (
    <RACColorSwatch
      data-slot="color-swatch"
      className={cn(colorSwatchStyles({ size, shape }), className)}
      {...(props as any)}
    />
  )
}

export const ColorSwatch = createInterfaceComponent<ColorSwatchProps, ColorSwatchSlots>(
  {
    name: 'ColorSwatch',
    category: 'form',
    description: 'Visual color tile swatch previewing solid or translucent color values.',
    version: '1.0.0',
    props: {
      size: 'md',
      shape: 'square',
    },
    slots: {

    },
  },
  ColorSwatchPrimitive
)
