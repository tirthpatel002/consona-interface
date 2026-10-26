import React from 'react'
import {
  ColorThumb as RACColorThumb,
  type ColorThumbProps as RACColorThumbProps,
} from 'react-aria-components'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'

/* ==========================================================================
   ColorThumb Styles
   ========================================================================== */

export const colorThumbStyles = tv({
  base: [
    'absolute z-10 top-[50%] left-[50%] size-5 shrink-0 rounded-full',
    'border-2 border-overlay shadow-sm',
    'ring-1 ring-border/80 dark:ring-white/30',
    '[&_input]:sr-only',
    'focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    'dragging:scale-110 active:scale-110 transition-transform duration-100 cursor-grab active:cursor-grabbing',
    'disabled:opacity-50 disabled:pointer-events-none',
  ],
})

/* ==========================================================================
   ColorThumb Slots & Props
   ========================================================================== */

export interface ColorThumbSlots {}

export interface ColorThumbProps extends RACColorThumbProps, VariantProps<typeof colorThumbStyles> {
  /** Custom CSS classes for the thumb element. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<ColorThumbSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ColorThumbSlots>
}

const ColorThumbPrimitive = ({ className, style, slots, slotProps, ...props }: ColorThumbProps) => {
  return (
    <RACColorThumb
      data-slot="color-thumb"
      {...props}
      style={(renderProps: any) => ({
        ...renderProps.defaultStyle,
        backgroundColor: renderProps.isDisabled ? undefined : renderProps.defaultStyle?.backgroundColor,
        ...(typeof style === 'function' ? style(renderProps) : style),
      })}
      className={cn(colorThumbStyles(), className)}
    />
  )
}

export const ColorThumb = createInterfaceComponent<ColorThumbProps, ColorThumbSlots>(
  {
    name: 'ColorThumb',
    category: 'form',
    description: 'Interactive cursor thumb indicator for color areas, sliders, and wheels.',
    version: '1.0.0',
    slots: {

    },
  },
  ColorThumbPrimitive
)

