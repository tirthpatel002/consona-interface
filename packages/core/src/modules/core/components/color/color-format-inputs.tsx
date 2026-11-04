import React, { useState, useEffect, useContext } from 'react'
import { ColorPickerStateContext } from 'react-aria-components'
import { parseColor, type Color } from '@react-stately/color'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Button } from '../button'
import {
  type ColorFormat,
  type RgbaColor,
  extractRgba,
  rgbToHex,
  hexToRgba,
  rgbaToHsla,
  hslaToRgba,
  rgbaToHsba,
  hsbaToRgba,
  formatColorString,
  clampColorValue,
  useColorFormat,
} from './color-utils'
import { CheckIcon, Square2StackIcon } from '@heroicons/react/24/outline'
import { ChevronUpDownIcon } from '@heroicons/react/20/solid'

/* ==========================================================================
   ColorFormatInputs Styles
   ========================================================================== */

export const colorFormatInputsStyles = tv({
  base: 'flex items-center gap-1.5 w-full min-w-0',
})

/* ==========================================================================
   ColorFormatInputs Slots & Props
   ========================================================================== */

export interface ColorFormatInputsSlots {
  /** Copy CSS button icon slot */
  copyIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Copied check icon slot */
  checkIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface ColorFormatInputsProps extends VariantProps<typeof colorFormatInputsStyles> {
  /** Initial default format if uncontrolled ('hex' | 'rgb' | 'css' | 'hsl' | 'hsb'). */
  defaultFormat?: ColorFormat
  /** Selected format ('hex' | 'rgb' | 'css' | 'hsl' | 'hsb'). */
  format?: ColorFormat
  /** Callback fired when format changes. */
  onFormatChange?: (format: ColorFormat) => void
  /** Controlled active RGBA color. */
  color?: RgbaColor | string
  /** Callback fired when color changes. */
  onChange?: (color: RgbaColor) => void
  /** Custom CSS classes */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<ColorFormatInputsSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ColorFormatInputsSlots>
}

const FORMAT_OPTIONS: { label: string; value: ColorFormat }[] = [
  { label: 'HEX', value: 'hex' },
  { label: 'RGB', value: 'rgb' },
  { label: 'CSS', value: 'css' },
  { label: 'HSL', value: 'hsl' },
  { label: 'HSB', value: 'hsb' },
]

const ColorFormatInputsPrimitive = ({
  defaultFormat = 'hex',
  format: controlledFormat,
  onFormatChange,
  color: controlledColor,
  onChange: controlledOnChange,
  className,
  slots = {},
  slotProps = {},
}: ColorFormatInputsProps) => {
  const pickerState = useContext(ColorPickerStateContext)
  const formatContext = useColorFormat()
  const [internalFormat, setInternalFormat] = useState<ColorFormat>(defaultFormat)

  const activeFormat =
    controlledFormat !== undefined
      ? controlledFormat
      : formatContext !== null
        ? formatContext.format
        : internalFormat

  const handleFormatChange = (newFmt: ColorFormat) => {
    setInternalFormat(newFmt)
    if (formatContext) {
      formatContext.setFormat(newFmt)
    }
    onFormatChange?.(newFmt)
  }

  // Derive active RGBA color from state or controlled prop
  const activeColorObj = (pickerState as any)?.color ?? (pickerState as any)?.value
  const currentRgba: RgbaColor = controlledColor
    ? typeof controlledColor === 'string'
      ? extractRgba(controlledColor)
      : controlledColor
    : extractRgba(activeColorObj)

  // Local input field strings
  const [hexInput, setHexInput] = useState('')
  const [alphaInput, setAlphaInput] = useState('100')
  const [rInput, setRInput] = useState('')
  const [gInput, setGInput] = useState('')
  const [bInput, setBInput] = useState('')
  const [hInput, setHInput] = useState('')
  const [sInput, setSInput] = useState('')
  const [lInput, setLInput] = useState('')
  const [brightInput, setBrightInput] = useState('')
  const [copied, setCopied] = useState(false)

  // Sync inputs whenever currentRgba changes
  useEffect(() => {
    setHexInput(rgbToHex(currentRgba.r, currentRgba.g, currentRgba.b).replace('#', '').toUpperCase())
    setAlphaInput(Math.round(currentRgba.a * 100).toString())
    setRInput(currentRgba.r.toString())
    setGInput(currentRgba.g.toString())
    setBInput(currentRgba.b.toString())

    const hsla = rgbaToHsla(currentRgba.r, currentRgba.g, currentRgba.b, currentRgba.a)
    setHInput(hsla.h.toString())
    setSInput(hsla.s.toString())
    setLInput(hsla.l.toString())

    const hsba = rgbaToHsba(currentRgba.r, currentRgba.g, currentRgba.b, currentRgba.a)
    setBrightInput(hsba.b.toString())
  }, [currentRgba.r, currentRgba.g, currentRgba.b, currentRgba.a])

  // Emit color update to parent & pickerState
  const emitUpdate = (newRgba: RgbaColor) => {
    controlledOnChange?.(newRgba)
    if (pickerState) {
      try {
        const colorStr = `rgba(${newRgba.r}, ${newRgba.g}, ${newRgba.b}, ${newRgba.a})`
        pickerState.setColor(parseColor(colorStr))
      } catch {
        try {
          const hex = rgbToHex(newRgba.r, newRgba.g, newRgba.b)
          pickerState.setColor(parseColor(hex))
        } catch {}
      }
    }
  }

  const handleCopyCss = () => {
    const cssString = formatColorString(currentRgba, 'css')
    navigator.clipboard.writeText(cssString)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const inputBaseClasses =
    'h-7 w-full leading-none font-mono text-xs bg-bg border border-border/80 text-fg text-center outline-none transition-all duration-150 focus:border-primary focus:ring-1 focus:ring-primary/40 focus:relative focus:z-10 min-w-0 p-0 m-0 block box-border'

  return (
    <div data-slot="color-format-inputs" className={cn(colorFormatInputsStyles(), 'h-7 items-center', className)}>
      {/* Format Selector Dropdown */}
      <div className="relative shrink-0 h-7 flex items-center">
        <select
          value={activeFormat}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation()
            handleFormatChange(e.target.value as ColorFormat)
          }}
          aria-label="Color space format"
          className={cn(
            'h-7 leading-none py-0 pl-2 pr-5 text-xs font-semibold uppercase rounded-base cursor-pointer',
            'bg-secondary/60 hover:bg-secondary text-fg border border-border/80 outline-none transition-colors duration-150',
            'focus:border-primary focus:ring-1 focus:ring-primary/40 appearance-none m-0 block box-border'
          )}
        >
          {FORMAT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-overlay text-fg">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronUpDownIcon className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 size-3.5 text-muted-fg" />
      </div>

      {/* Dynamic Channels Input Group (Zero Gap, Overlapping Borders, Outer Corners Rounded) */}
      <div className="flex items-center -space-x-px flex-1 min-w-0 h-7">
        {/* HEX Format */}
        {activeFormat === 'hex' && (
          <>
            <div className="relative flex-1 min-w-0 h-7 flex items-center focus-within:z-10">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs leading-none font-mono text-muted-fg pointer-events-none select-none z-10">#</span>
              <input
                type="text"
                value={hexInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 8)
                  setHexInput(val.toUpperCase())
                  if (val.length === 3 || val.length === 6 || val.length === 8) {
                    const parsed = hexToRgba(`#${val}`)
                    emitUpdate({ ...parsed, a: val.length === 8 ? parsed.a : currentRgba.a })
                  }
                }}
                onBlur={() => {
                  const val = hexInput.trim()
                  if (val.length === 3 || val.length === 6 || val.length === 8) {
                    const parsed = hexToRgba(`#${val}`)
                    emitUpdate({ ...parsed, a: val.length === 8 ? parsed.a : currentRgba.a })
                    setHexInput(rgbToHex(parsed.r, parsed.g, parsed.b).replace('#', '').toUpperCase())
                  } else {
                    setHexInput(rgbToHex(currentRgba.r, currentRgba.g, currentRgba.b).replace('#', '').toUpperCase())
                  }
                }}
                aria-label="Hex value"
                className={cn(inputBaseClasses, 'pl-5 pr-1 text-left uppercase rounded-l-base rounded-r-none')}
              />
            </div>
            <div className="w-12 shrink-0 h-7 flex items-center focus-within:z-10">
              <input
                type="text"
                value={`${alphaInput}%`}
                onChange={(e) => {
                  const num = parseInt(e.target.value.replace(/\D/g, ''), 10)
                  if (!isNaN(num)) {
                    const clamped = clampColorValue(num, 0, 100)
                    setAlphaInput(clamped.toString())
                    emitUpdate({ ...currentRgba, a: clamped / 100 })
                  }
                }}
                aria-label="Alpha opacity"
                title="Alpha %"
                className={cn(inputBaseClasses, 'px-1 rounded-r-base rounded-l-none')}
              />
            </div>
          </>
        )}

        {/* RGB Format */}
        {activeFormat === 'rgb' && (
          <>
            <div className="flex-1 min-w-0 h-7 flex items-center focus-within:z-10">
              <input
                type="text"
                value={rInput}
                onChange={(e) => {
                  const num = parseInt(e.target.value.replace(/\D/g, ''), 10)
                  if (!isNaN(num)) {
                    const clamped = clampColorValue(num, 0, 255)
                    setRInput(clamped.toString())
                    emitUpdate({ ...currentRgba, r: clamped })
                  }
                }}
                aria-label="Red channel"
                title="Red (0-255)"
                className={cn(inputBaseClasses, 'px-0.5 rounded-l-base rounded-r-none')}
              />
            </div>
            <div className="flex-1 min-w-0 h-7 flex items-center focus-within:z-10">
              <input
                type="text"
                value={gInput}
                onChange={(e) => {
                  const num = parseInt(e.target.value.replace(/\D/g, ''), 10)
                  if (!isNaN(num)) {
                    const clamped = clampColorValue(num, 0, 255)
                    setGInput(clamped.toString())
                    emitUpdate({ ...currentRgba, g: clamped })
                  }
                }}
                aria-label="Green channel"
                title="Green (0-255)"
                className={cn(inputBaseClasses, 'px-0.5 rounded-none')}
              />
            </div>
            <div className="flex-1 min-w-0 h-7 flex items-center focus-within:z-10">
              <input
                type="text"
                value={bInput}
                onChange={(e) => {
                  const num = parseInt(e.target.value.replace(/\D/g, ''), 10)
                  if (!isNaN(num)) {
                    const clamped = clampColorValue(num, 0, 255)
                    setBInput(clamped.toString())
                    emitUpdate({ ...currentRgba, b: clamped })
                  }
                }}
                aria-label="Blue channel"
                title="Blue (0-255)"
                className={cn(inputBaseClasses, 'px-0.5 rounded-none')}
              />
            </div>
            <div className="w-11 shrink-0 h-7 flex items-center focus-within:z-10">
              <input
                type="text"
                value={`${alphaInput}%`}
                onChange={(e) => {
                  const num = parseInt(e.target.value.replace(/\D/g, ''), 10)
                  if (!isNaN(num)) {
                    const clamped = clampColorValue(num, 0, 100)
                    setAlphaInput(clamped.toString())
                    emitUpdate({ ...currentRgba, a: clamped / 100 })
                  }
                }}
                aria-label="Alpha opacity"
                title="Alpha %"
                className={cn(inputBaseClasses, 'px-0.5 rounded-r-base rounded-l-none')}
              />
            </div>
          </>
        )}

        {/* HSL Format */}
        {activeFormat === 'hsl' && (
          <>
            <div className="flex-1 min-w-0 h-7 flex items-center focus-within:z-10">
              <input
                type="text"
                value={hInput}
                onChange={(e) => {
                  const num = parseInt(e.target.value.replace(/\D/g, ''), 10)
                  if (!isNaN(num)) {
                    const clamped = clampColorValue(num, 0, 360)
                    setHInput(clamped.toString())
                    const hsla = rgbaToHsla(currentRgba.r, currentRgba.g, currentRgba.b, currentRgba.a)
                    const newRgba = hslaToRgba(clamped, hsla.s, hsla.l, currentRgba.a)
                    emitUpdate(newRgba)
                  }
                }}
                aria-label="Hue degrees"
                title="Hue (0-360°)"
                className={cn(inputBaseClasses, 'px-0.5 rounded-l-base rounded-r-none')}
              />
            </div>
            <div className="flex-1 min-w-0 h-7 flex items-center focus-within:z-10">
              <input
                type="text"
                value={sInput}
                onChange={(e) => {
                  const num = parseInt(e.target.value.replace(/\D/g, ''), 10)
                  if (!isNaN(num)) {
                    const clamped = clampColorValue(num, 0, 100)
                    setSInput(clamped.toString())
                    const hsla = rgbaToHsla(currentRgba.r, currentRgba.g, currentRgba.b, currentRgba.a)
                    const newRgba = hslaToRgba(hsla.h, clamped, hsla.l, currentRgba.a)
                    emitUpdate(newRgba)
                  }
                }}
                aria-label="Saturation percentage"
                title="Saturation (0-100%)"
                className={cn(inputBaseClasses, 'px-0.5 rounded-none')}
              />
            </div>
            <div className="flex-1 min-w-0 h-7 flex items-center focus-within:z-10">
              <input
                type="text"
                value={lInput}
                onChange={(e) => {
                  const num = parseInt(e.target.value.replace(/\D/g, ''), 10)
                  if (!isNaN(num)) {
                    const clamped = clampColorValue(num, 0, 100)
                    setLInput(clamped.toString())
                    const hsla = rgbaToHsla(currentRgba.r, currentRgba.g, currentRgba.b, currentRgba.a)
                    const newRgba = hslaToRgba(hsla.h, hsla.s, clamped, currentRgba.a)
                    emitUpdate(newRgba)
                  }
                }}
                aria-label="Lightness percentage"
                title="Lightness (0-100%)"
                className={cn(inputBaseClasses, 'px-0.5 rounded-none')}
              />
            </div>
            <div className="w-11 shrink-0 h-7 flex items-center focus-within:z-10">
              <input
                type="text"
                value={`${alphaInput}%`}
                onChange={(e) => {
                  const num = parseInt(e.target.value.replace(/\D/g, ''), 10)
                  if (!isNaN(num)) {
                    const clamped = clampColorValue(num, 0, 100)
                    setAlphaInput(clamped.toString())
                    emitUpdate({ ...currentRgba, a: clamped / 100 })
                  }
                }}
                aria-label="Alpha opacity"
                title="Alpha %"
                className={cn(inputBaseClasses, 'px-0.5 rounded-r-base rounded-l-none')}
              />
            </div>
          </>
        )}

        {/* HSB Format */}
        {activeFormat === 'hsb' && (
          <>
            <div className="flex-1 min-w-0 h-7 flex items-center focus-within:z-10">
              <input
                type="text"
                value={hInput}
                onChange={(e) => {
                  const num = parseInt(e.target.value.replace(/\D/g, ''), 10)
                  if (!isNaN(num)) {
                    const clamped = clampColorValue(num, 0, 360)
                    setHInput(clamped.toString())
                    const hsba = rgbaToHsba(currentRgba.r, currentRgba.g, currentRgba.b, currentRgba.a)
                    const newRgba = hsbaToRgba(clamped, hsba.s, hsba.b, currentRgba.a)
                    emitUpdate(newRgba)
                  }
                }}
                aria-label="Hue degrees"
                title="Hue (0-360°)"
                className={cn(inputBaseClasses, 'px-0.5 rounded-l-base rounded-r-none')}
              />
            </div>
            <div className="flex-1 min-w-0 h-7 flex items-center focus-within:z-10">
              <input
                type="text"
                value={sInput}
                onChange={(e) => {
                  const num = parseInt(e.target.value.replace(/\D/g, ''), 10)
                  if (!isNaN(num)) {
                    const clamped = clampColorValue(num, 0, 100)
                    setSInput(clamped.toString())
                    const hsba = rgbaToHsba(currentRgba.r, currentRgba.g, currentRgba.b, currentRgba.a)
                    const newRgba = hsbaToRgba(hsba.h, clamped, hsba.b, currentRgba.a)
                    emitUpdate(newRgba)
                  }
                }}
                aria-label="Saturation percentage"
                title="Saturation (0-100%)"
                className={cn(inputBaseClasses, 'px-0.5 rounded-none')}
              />
            </div>
            <div className="flex-1 min-w-0 h-7 flex items-center focus-within:z-10">
              <input
                type="text"
                value={brightInput}
                onChange={(e) => {
                  const num = parseInt(e.target.value.replace(/\D/g, ''), 10)
                  if (!isNaN(num)) {
                    const clamped = clampColorValue(num, 0, 100)
                    setBrightInput(clamped.toString())
                    const hsba = rgbaToHsba(currentRgba.r, currentRgba.g, currentRgba.b, currentRgba.a)
                    const newRgba = hsbaToRgba(hsba.h, hsba.s, clamped, currentRgba.a)
                    emitUpdate(newRgba)
                  }
                }}
                aria-label="Brightness percentage"
                title="Brightness (0-100%)"
                className={cn(inputBaseClasses, 'px-0.5 rounded-none')}
              />
            </div>
            <div className="w-11 shrink-0 h-7 flex items-center focus-within:z-10">
              <input
                type="text"
                value={`${alphaInput}%`}
                onChange={(e) => {
                  const num = parseInt(e.target.value.replace(/\D/g, ''), 10)
                  if (!isNaN(num)) {
                    const clamped = clampColorValue(num, 0, 100)
                    setAlphaInput(clamped.toString())
                    emitUpdate({ ...currentRgba, a: clamped / 100 })
                  }
                }}
                aria-label="Alpha opacity"
                title="Alpha %"
                className={cn(inputBaseClasses, 'px-0.5 rounded-r-base rounded-l-none')}
              />
            </div>
          </>
        )}

        {/* CSS Format */}
        {activeFormat === 'css' && (
          <>
            <div className="flex-1 min-w-0 h-7 flex items-center focus-within:z-10">
              <input
                type="text"
                readOnly
                value={formatColorString(currentRgba, 'css')}
                aria-label="CSS color string"
                className={cn(inputBaseClasses, 'text-left pl-2 pr-1 font-mono text-xs truncate cursor-text rounded-l-base rounded-r-none')}
              />
            </div>
            <button
              type="button"
              onClick={handleCopyCss}
              aria-label="Copy CSS"
              title={copied ? "Copied!" : "Copy CSS"}
              className={cn(
                'size-7 shrink-0 rounded-r-base rounded-l-none flex items-center justify-center border transition-all cursor-pointer outline-none box-border focus:relative focus:z-10 focus:border-primary focus:ring-1 focus:ring-primary/40',
                copied
                  ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-500'
                  : 'border-border/80 bg-secondary/40 text-muted-fg hover:text-fg hover:bg-secondary'
              )}
            >
              {copied
                ? renderSlot(
                    slots.checkIcon,
                    { className: 'size-3.5', ...slotProps.checkIcon },
                    { defaultComponent: CheckIcon }
                  )
                : renderSlot(
                    slots.copyIcon,
                    { className: 'size-3.5', ...slotProps.copyIcon },
                    { defaultComponent: Square2StackIcon }
                  )}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export const ColorFormatInputs = createInterfaceComponent<ColorFormatInputsProps, ColorFormatInputsSlots>(
  {
    name: 'ColorFormatInputs',
    category: 'form',
    description: 'Dynamic color format switcher and channel input controls supporting HEX, RGB, CSS, HSL, and HSB with alpha channels.',
    version: '1.0.0',
    props: {
      defaultFormat: 'hex',
    },
    slots: {
      copyIcon: Square2StackIcon,
      checkIcon: CheckIcon,
    },
  },
  ColorFormatInputsPrimitive
)
