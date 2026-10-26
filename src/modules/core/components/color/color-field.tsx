import React, { useContext, useState, useEffect, useId } from 'react'
import {
  ColorField as RACColorField,
  type ColorFieldProps as RACColorFieldProps,
  ColorPickerStateContext,
} from 'react-aria-components'
import { parseColor, type Color } from '@react-stately/color'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { fieldStyles } from '../field'
import { Input, type InputProps } from '../input'

/* ==========================================================================
   ColorField Styles
   ========================================================================== */

export const colorFieldStyles = tv({
  base: 'flex flex-col gap-1.5 w-full',
})

/* ==========================================================================
   ColorField Slots & Props
   ========================================================================== */

export interface ColorFieldSlots {
  /** Formatted text input slot */
  input?: React.ComponentType<InputProps>
}

export interface ColorFieldProps
  extends Omit<RACColorFieldProps, 'children'>,
    VariantProps<typeof colorFieldStyles> {
  /** Controlled color value (hex string or Color object). */
  value?: Color | string
  /** Default uncontrolled initial color value. */
  defaultValue?: Color | string
  /** Handler called when color changes. */
  onChange?: (color: Color | null) => void
  /** Whether user interaction is disabled. */
  isDisabled?: boolean
  /** Whether the field is read-only. */
  isReadOnly?: boolean
  /** Custom CSS classes for the color field wrapper. */
  className?: string
  /** Child input element or label components. */
  children?: React.ReactNode
  /** Injected slot component overrides. */
  slots?: SlotComponents<ColorFieldSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ColorFieldSlots>
}

const formatColorHex = (color: Color | null | undefined): string => {
  if (!color) return ''
  try {
    const alpha = color.getChannelValue('alpha')
    return alpha < 1 ? color.toString('hexa') : color.toString('hex')
  } catch {
    return color.toString('hex')
  }
}

const ColorFieldPrimitive = ({
  className,
  children,
  value,
  defaultValue,
  onChange,
  isDisabled = false,
  isReadOnly = false,
  slots = {},
  slotProps = {},
  ...props
}: ColorFieldProps) => {
  const pickerState = useContext(ColorPickerStateContext)
  const inputId = useId()

  // When used inside ColorPicker / Color context without explicit value props, sync directly with picker state
  if (pickerState && value === undefined && defaultValue === undefined && onChange === undefined) {
    const activeColor = (pickerState as any).color ?? (pickerState as any).value
    const formattedHex = formatColorHex(activeColor)
    const [inputValue, setInputValue] = useState(formattedHex)
    const [isFocused, setIsFocused] = useState(false)

    useEffect(() => {
      if (!isFocused) {
        setInputValue(formattedHex)
      }
    }, [formattedHex, isFocused])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setInputValue(val)

      const normalized = val.trim().startsWith('#') ? val.trim() : `#${val.trim()}`
      if (/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(normalized)) {
        try {
          const parsed = parseColor(normalized)
          pickerState.setColor(parsed)
        } catch {
          // ignore parsing error while mid-typing
        }
      }
    }

    const handleBlur = () => {
      setIsFocused(false)
      const normalized = inputValue.trim().startsWith('#') ? inputValue.trim() : `#${inputValue.trim()}`
      if (/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(normalized)) {
        try {
          const parsed = parseColor(normalized)
          pickerState.setColor(parsed)
          setInputValue(formatColorHex(parsed))
          return
        } catch {
          // fallback to active color
        }
      }
      setInputValue(formattedHex)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleBlur()
      }
    }

    const inputNode = renderSlot(
      slots.input,
      {
        id: inputId,
        'aria-label': 'Hex color',
        className: 'font-mono uppercase text-xs',
        value: inputValue,
        onChange: handleInputChange,
        onFocus: () => setIsFocused(true),
        onBlur: handleBlur,
        onKeyDown: handleKeyDown,
        disabled: isDisabled,
        readOnly: isReadOnly,
        ...slotProps.input,
      },
      { defaultComponent: Input }
    )

    const { slot, ...domProps } = props as any

    return (
      <div
        data-slot="control"
        slot={slot ?? undefined}
        className={cn(fieldStyles(), colorFieldStyles(), className)}
        {...domProps}
      >
        {children || inputNode}
      </div>
    )
  }

  return (
    <RACColorField
      data-slot="control"
      className={cn(fieldStyles(), colorFieldStyles(), className)}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      {...props}
    >
      {children ||
        renderSlot(
          slots.input,
          { className: 'font-mono uppercase text-xs', ...slotProps.input },
          { defaultComponent: Input }
        )}
    </RACColorField>
  )
}

export const ColorField = createInterfaceComponent<ColorFieldProps, ColorFieldSlots>(
  {
    name: 'ColorField',
    category: 'form',
    description: 'Formatted text input field for editing color hexadecimal and channel values.',
    version: '1.0.0',
    props: {
      isDisabled: false,
    },
    slots: {
      input: Input,
    },
  },
  ColorFieldPrimitive
)

// Namespace attachments for compound family ergonomics
ColorField.Input = Input

