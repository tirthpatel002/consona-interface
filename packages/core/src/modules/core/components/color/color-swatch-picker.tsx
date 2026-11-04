import React from 'react'
import {
  ColorSwatchPicker as RACColorSwatchPicker,
  type ColorSwatchPickerProps as RACColorSwatchPickerProps,
  ColorSwatchPickerItem as RACColorSwatchPickerItem,
  type ColorSwatchPickerItemProps as RACColorSwatchPickerItemProps,
} from 'react-aria-components'
import type { Color } from '@react-stately/color'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { ColorSwatch, type ColorSwatchProps } from './color-swatch'
import { CheckIcon } from '@heroicons/react/20/solid'

export const colorSwatchPickerStyles = tv({
  base: 'flex flex-wrap gap-space-sm items-center',
})

/* ==========================================================================
   ColorSwatchPicker Slots & Props
   ========================================================================== */

export interface ColorSwatchPickerSlots {}

export interface ColorSwatchPickerProps
  extends Omit<RACColorSwatchPickerProps, 'children'>,
    VariantProps<typeof colorSwatchPickerStyles> {
  /** Controlled selected color value. */
  value?: Color | string
  /** Default uncontrolled initial selected color value. */
  defaultValue?: Color | string
  /** Handler called when color selection changes. */
  onChange?: (color: Color) => void
  /** Whether selection interaction is disabled. */
  isDisabled?: boolean
  /** Custom CSS classes for the swatch picker container. */
  className?: string
  /** Children swatches. */
  children?: React.ReactNode
  /** Injected slot component overrides. */
  slots?: SlotComponents<ColorSwatchPickerSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ColorSwatchPickerSlots>
}

const ColorSwatchPickerPrimitive = ({
  className,
  slots,
  slotProps,
  ...props
}: ColorSwatchPickerProps) => {
  return (
    <RACColorSwatchPicker
      data-slot="color-swatch-picker"
      className={cn(colorSwatchPickerStyles(), className)}
      {...props}
    />
  )
}

export const ColorSwatchPicker = createInterfaceComponent<ColorSwatchPickerProps, ColorSwatchPickerSlots>(
  {
    name: 'ColorSwatchPicker',
    category: 'form',
    description: 'Palette grid of selectable color swatches.',
    version: '1.0.0',
    props: {
      isDisabled: false,
    },
    slots: {},
  },
  ColorSwatchPickerPrimitive
)

/* ==========================================================================
   ColorSwatchPickerItem Slots & Props
   ========================================================================== */

export interface ColorSwatchPickerItemSlots {
  /** Checkmark selection indicator slot */
  checkIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface ColorSwatchPickerItemProps extends RACColorSwatchPickerItemProps {
  /** Color value for this specific swatch (Color object or CSS string). */
  color: Color | string
  /** Custom CSS classes for the item wrapper. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<ColorSwatchPickerItemSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ColorSwatchPickerItemSlots>
}

function swatchHex(color: Color | string | undefined): string {
  if (!color) return '#808080'
  if (typeof color === 'string') return color
  try {
    return color.toString('hex')
  } catch {
    return '#808080'
  }
}

function contrastingForeground(cssColor: string): string {
  const hex = cssColor.trim()
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex)
  if (!match) return '#ffffff'
  let raw = match[1]!
  if (raw.length === 3) {
    raw = raw.split('').map((c) => c + c).join('')
  }
  const r = Number.parseInt(raw.slice(0, 2), 16) / 255
  const g = Number.parseInt(raw.slice(2, 4), 16) / 255
  const b = Number.parseInt(raw.slice(4, 6), 16) / 255
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return lum > 0.55 ? '#0a0a0a' : '#ffffff'
}

const ColorSwatchPickerItemPrimitive = ({
  className,
  color,
  children,
  slots = {},
  slotProps = {},
  style,
  ...props
}: ColorSwatchPickerItemProps) => {
  const hex = swatchHex(color)
  const dot = contrastingForeground(hex)

  return (
    <RACColorSwatchPickerItem
      color={color}
      data-slot="color-swatch-picker-item"
      style={(renderProps) => {
        const defaultStyle = typeof style === 'function' ? style(renderProps) : style
        return {
          ...defaultStyle,
          '--tw-ring-color': color
            ? `color-mix(in oklab, ${hex} 40%, transparent)`
            : undefined,
        }
      }}
      className={cn(
        'relative size-8 rounded-base border-0 outline-none cursor-pointer transition-all duration-150',
        '*:rounded-[calc(var(--radius-base)-1px)] *:data-[slot=color-swatch]:size-8 *:data-[slot=color-swatch]:inset-ring-0 *:data-[slot=color-swatch]:shadow-none',
        'data-[selected]:ring-2 data-[selected]:ring-primary data-[selected]:ring-offset-2 data-[selected]:ring-offset-bg',
        'focus-visible:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'hover:opacity-90 active:scale-[0.96]',
        'data-[disabled]:opacity-50 data-[disabled]:pointer-events-none',
        className
      )}
      {...props}
    >
      {(values) => {
        const childContent =
          typeof children === 'function'
            ? children(values)
            : children ?? (
                <ColorSwatch color={color} className="size-full rounded-[calc(var(--radius-base)-1px)]" />
              )

        return (
          <>
            {childContent}
            {values.isSelected &&
              renderSlot(
                slots.checkIcon,
                {
                  className: 'pointer-events-none absolute top-1/2 left-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2',
                  style: { color: dot },
                  ...slotProps.checkIcon,
                },
                { defaultComponent: CheckIcon }
              )}
          </>
        )
      }}
    </RACColorSwatchPickerItem>
  )
}

export const ColorSwatchPickerItem = createInterfaceComponent<ColorSwatchPickerItemProps, ColorSwatchPickerItemSlots>(
  {
    name: 'ColorSwatchPickerItem',
    category: 'form',
    description: 'Selectable swatch item within ColorSwatchPicker.',
    version: '1.0.0',
    slots: {
      checkIcon: CheckIcon,
    },
  },
  ColorSwatchPickerItemPrimitive
)

// Namespace attachments for compound family ergonomics
ColorSwatchPicker.Item = ColorSwatchPickerItem
ColorSwatchPicker.Swatch = ColorSwatch
