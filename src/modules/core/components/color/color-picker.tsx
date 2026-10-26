import React, { useContext, useState, useEffect } from 'react'
import {
  ColorPickerStateContext,
  DialogTrigger,
  ColorPicker as RACColorPicker,
  OverlayTriggerStateContext,
} from 'react-aria-components'
import { parseColor, type Color } from '@react-stately/color'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Button } from '../button'
import { Popover, type PopoverProps } from '../popover'
import { Tabs, TabList, Tab, TabPanel } from '../tabs'
import { ColorSwatch, type ColorSwatchProps } from './color-swatch'
import { ColorSwatchPicker, ColorSwatchPickerItem, type ColorSwatchPickerProps, type ColorSwatchPickerItemProps } from './color-swatch-picker'
import { ColorArea, type ColorAreaProps } from './color-area'
import { ColorSlider, ColorSliderOutput, ColorSliderTrack, type ColorSliderProps, type ColorSliderOutputProps, type ColorSliderTrackProps } from './color-slider'
import { ColorField, type ColorFieldProps } from './color-field'
import { ColorThumb, type ColorThumbProps } from './color-thumb'
import { ColorWheel, type ColorWheelProps } from './color-wheel'
import { PresetsContainer, CreatePresetForm, type PresetsContainerProps, type CreatePresetFormProps } from './color-presets'
import { ColorFormatInputs, type ColorFormatInputsProps } from './color-format-inputs'
import { ColorGradientEditor, type ColorGradientEditorProps } from './color-gradient-editor'
import { ColorImageFill, type ColorImageFillProps } from './color-image-fill'
import {
  type FillType,
  type ColorFormat,
  type GradientConfig,
  type ImageFillConfig,
  type RgbaColor,
  extractRgba,
  rgbToHex,
  hexToRgba,
  gradientToCss,
  parseCssGradient,
  parseCustomSwatchItem,
  ColorFormatProvider,
  useCustomSwatches,
  type UseCustomSwatchesOptions,
} from './color-utils'
import { EyeDropperIcon } from '@heroicons/react/24/solid'
import { PlusIcon } from '@heroicons/react/20/solid'
import { XMarkIcon } from '@heroicons/react/24/outline'

/* ==========================================================================
   ColorPicker Styles
   ========================================================================== */

export const colorPickerStyles = tv({
  base: 'w-80 p-3.5 min-w-0 bg-overlay/95 backdrop-blur-md border border-border/80 shadow-2xl rounded-2xl flex flex-col gap-3',
})

/* ==========================================================================
   ColorPicker Root Primitive & Factory (Popover)
   ========================================================================== */

export interface ColorPickerSlots {
  /** Presets container slot (Soft / Dark tabbed swatches) */
  presets?: React.ComponentType<PresetsContainerProps>
  /** Create preset form slot */
  createPresetForm?: React.ComponentType<CreatePresetFormProps>
  /** Color saturation/brightness area slot */
  area?: React.ComponentType<ColorAreaProps>
  /** Color hue slider slot */
  slider?: React.ComponentType<ColorSliderProps>
  /** Color opacity / alpha slider slot */
  alphaSlider?: React.ComponentType<ColorSliderProps>
  /** Hexadecimal color field slot */
  field?: React.ComponentType<ColorFieldProps>
  /** Dynamic format inputs (HEX, RGB, CSS, HSL, HSB) slot */
  formatInputs?: React.ComponentType<ColorFormatInputsProps>
  /** Multi-stop gradient creator slot */
  gradientEditor?: React.ComponentType<ColorGradientEditorProps>
  /** Image fill upload and adjustment slot */
  imageFill?: React.ComponentType<ColorImageFillProps>
  /** Screen eyedropper trigger slot */
  eyeDropper?: React.ComponentType<EyeDropperProps>
  /** Color swatch slot */
  swatch?: React.ComponentType<ColorSwatchProps>
  /** Color swatch picker grid slot */
  swatchPicker?: React.ComponentType<ColorSwatchPickerProps>
  /** Close button icon slot */
  closeIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface ColorPickerProps
  extends Omit<PopoverProps, 'children' | 'slots' | 'slotProps'>,
  VariantProps<typeof colorPickerStyles>,
  UseCustomSwatchesOptions {
  /** Allowed fill types: any subset of 'solid' | 'gradient' | 'image'. Defaults to ['solid', 'gradient', 'image']. */
  fillTypes?: ('solid' | 'gradient' | 'image')[]
  /** Initial active root fill type: 'solid' | 'gradient' | 'image'. */
  defaultFillType?: 'solid' | 'gradient' | 'image'
  /** Controlled fill type. */
  fillType?: 'solid' | 'gradient' | 'image'
  /** Callback fired when fill type changes. */
  onFillTypeChange?: (type: 'solid' | 'gradient' | 'image') => void
  /** Initial active root tab when in solid mode: 'editor' or 'presets'. */
  defaultTab?: 'editor' | 'presets'
  /** Initial color format ('hex' | 'rgb' | 'css' | 'hsl' | 'hsb'). */
  defaultFormat?: ColorFormat
  /** Initial gradient configuration. */
  defaultGradient?: GradientConfig
  /** Callback fired when gradient configuration changes. */
  onGradientChange?: (config: GradientConfig) => void
  /** Initial image fill configuration. */
  defaultImageFill?: ImageFillConfig
  /** Callback fired when image fill changes. */
  onImageFillChange?: (config: ImageFillConfig) => void
  /** Custom CSS classes for the color picker popover. */
  className?: string
  /** Child components or custom content rendered inside the editor tab. */
  children?: React.ReactNode
  /** Injected slot component overrides. */
  slots?: SlotComponents<ColorPickerSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ColorPickerSlots>
  /** Show the default pointing arrow indicator. */
  showArrow?: boolean
  /** Popover placement relative to the trigger anchor. */
  placement?: 'bottom' | 'bottom start' | 'bottom end' | 'top' | 'top start' | 'top end' | 'left' | 'right'
  /** Callback fired when close button is clicked. */
  onClose?: () => void
}

const ColorPickerPrimitive = ({
  className,
  children,
  fillTypes,
  defaultFillType = 'solid',
  fillType: controlledFillType,
  onFillTypeChange,
  defaultTab = 'editor',
  defaultFormat = 'hex',
  defaultGradient,
  onGradientChange,
  defaultImageFill,
  onImageFillChange,
  customSwatches: controlledCustomSwatches,
  defaultCustomSwatches,
  onCustomSwatchesChange,
  onAddCustomSwatch,
  onRemoveCustomSwatch,
  storageKey,
  placement = 'bottom start',
  showArrow = false,
  size = 'auto',
  slots = {},
  slotProps = {},
  onClose,
  ...props
}: ColorPickerProps) => {
  const pickerState = useContext(ColorPickerStateContext)
  const overlayState = useContext(OverlayTriggerStateContext)
  const availableFillTypes = fillTypes ?? (['solid', 'gradient', 'image'] as const)
  const [internalFillType, setInternalFillType] = useState<'solid' | 'gradient' | 'image'>(
    defaultFillType && availableFillTypes.includes(defaultFillType)
      ? defaultFillType
      : availableFillTypes[0] ?? 'solid'
  )
  const activeFillType = controlledFillType ?? internalFillType

  const {
    swatches: customList,
    addSwatch,
    removeSwatch,
  } = useCustomSwatches({
    customSwatches: controlledCustomSwatches,
    defaultCustomSwatches,
    onCustomSwatchesChange,
    onAddCustomSwatch,
    onRemoveCustomSwatch,
    storageKey,
  })

  const handleFillTypeChange = (type: 'solid' | 'gradient' | 'image') => {
    setInternalFillType(type)
    onFillTypeChange?.(type)
  }

  // Gradient configuration state
  const [gradientConfig, setGradientConfig] = useState<GradientConfig>(
    defaultGradient ?? {
      type: 'radial',
      angle: 135,
      stops: [
        { id: '1', color: '#7F56D9', position: 0 },
        { id: '2', color: '#432E73', position: 100 },
      ],
    }
  )
  const [activeStopId, setActiveStopId] = useState<string>('1')

  // Image configuration state
  const [imageConfig, setImageConfig] = useState<ImageFillConfig>(
    defaultImageFill ?? {
      url: '',
      mode: 'fill',
      opacity: 100,
      zoom: 130,
      exposure: 0,
      contrast: 0,
      saturation: 0,
      temperature: 0,
      tint: 0,
      highlights: 0,
      shadows: 0,
      positionX: 50,
      positionY: 50,
      rotation: 0,
    }
  )

  const [addingPresetOptions, setAddingPresetOptions] = useState<{
    initialType?: 'solid' | 'gradient'
    currentColor?: string
    currentGradient?: GradientConfig
  } | null>(null)

  // Exclusive View: When New/Add Preset form is active, no other tabs or components are rendered
  if (addingPresetOptions) {
    return (
      <Popover
        data-slot="color-picker"
        placement={placement}
        showArrow={showArrow}
        size={size}
        className={cn(colorPickerStyles(), className)}
        {...props}
      >
        <ColorFormatProvider defaultFormat={defaultFormat}>
          <div className="w-full min-w-0">
            {renderSlot(
              slots.createPresetForm,
              {
                initialType: addingPresetOptions.initialType ?? (activeFillType === 'gradient' ? 'gradient' : 'solid'),
                currentColor: addingPresetOptions.currentColor ?? pickerState?.color?.toString('hex') ?? '#7F56D9',
                currentGradient: addingPresetOptions.currentGradient ?? gradientConfig,
                onBack: () => setAddingPresetOptions(null),
                onCancel: () => setAddingPresetOptions(null),
                onSave: (payload) => {
                  addSwatch(payload)
                  const parsed = parseCustomSwatchItem(payload)
                  if (parsed.isGradient) {
                    const grad = parseCssGradient(parsed.value)
                    if (grad) {
                      setGradientConfig(grad)
                      onGradientChange?.(grad)
                      handleFillTypeChange('gradient')
                    }
                  } else {
                    try {
                      pickerState?.setColor(parseColor(parsed.value))
                      handleFillTypeChange('solid')
                    } catch { }
                  }
                  setAddingPresetOptions(null)
                },
                ...slotProps.createPresetForm,
              },
              { defaultComponent: CreatePresetForm }
            )}
          </div>
        </ColorFormatProvider>
      </Popover>
    )
  }

  return (
    <Popover
      data-slot="color-picker"
      placement={placement}
      showArrow={showArrow}
      size={size}
      className={cn(colorPickerStyles(), className)}
      {...props}
    >
      <ColorFormatProvider defaultFormat={defaultFormat}>
        {/* Top Header: Underline Tabs (Solid | Gradient | Image) & Close Button (No Dividers) */}
        {availableFillTypes.length > 1 ? (
          <div className="flex items-center justify-between pb-1.5 mb-1 shrink-0">
            <div className="flex items-center gap-4 mb-2">
              {availableFillTypes.map((tabKey) => {
                const isActive = activeFillType === tabKey
                return (
                  <button
                    key={tabKey}
                    type="button"
                    onClick={() => handleFillTypeChange(tabKey)}
                    className={cn(
                      'text-xs font-semibold capitalize pb-1 transition-all cursor-pointer relative',
                      isActive
                        ? 'text-primary'
                        : 'text-muted-fg hover:text-fg'
                    )}
                  >
                    {tabKey}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                onClose?.()
                overlayState?.close()
              }}
              aria-label="Close color picker"
              className="text-muted-fg hover:text-fg p-0.5 rounded-md transition-colors cursor-pointer"
            >
              {renderSlot(
                slots.closeIcon,
                { className: 'size-4', ...slotProps.closeIcon },
                { defaultComponent: XMarkIcon }
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end pb-1 mb-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose?.()
                overlayState?.close()
              }}
              aria-label="Close color picker"
              className="text-muted-fg hover:text-fg p-0.5 rounded-md transition-colors cursor-pointer"
            >
              {renderSlot(
                slots.closeIcon,
                { className: 'size-4', ...slotProps.closeIcon },
                { defaultComponent: XMarkIcon }
              )}
            </button>
          </div>
        )}

        {/* Mode-Specific Content */}
        {activeFillType === 'gradient' ? (
          renderSlot(
            slots.gradientEditor,
            {
              config: gradientConfig,
              onChange: (cfg) => {
                setGradientConfig(cfg)
                onGradientChange?.(cfg)
                if (cfg.stops[0]) {
                  try {
                    pickerState?.setColor(parseColor(cfg.stops[0].color))
                  } catch { }
                }
              },
              activeStopId,
              onActiveStopChange: setActiveStopId,
              customSwatches: customList,
              onAddCustomSwatch: addSwatch,
              onRemoveCustomSwatch: removeSwatch,
              onStartAddPreset: (opts) => {
                setAddingPresetOptions(opts || { initialType: 'gradient', currentGradient: gradientConfig })
              },
              ...slotProps.gradientEditor,
            },
            { defaultComponent: ColorGradientEditor }
          )
        ) : activeFillType === 'image' ? (
          renderSlot(
            slots.imageFill,
            {
              config: imageConfig,
              onChange: (cfg) => {
                setImageConfig(cfg)
                onImageFillChange?.(cfg)
              },
              ...slotProps.imageFill,
            },
            { defaultComponent: ColorImageFill }
          )
        ) : (
          /* Solid Color Mode with Interface Tabs (Editor & Presets) */
          <Tabs defaultSelectedKey={defaultTab} className="w-full flex flex-col gap-3">
            <TabList variant="segmented" className="w-full grid grid-cols-2 p-0.5">
              <Tab id="editor" size="sm" className="justify-center text-xs font-medium py-1">
                Editor
              </Tab>
              <Tab id="presets" size="sm" className="justify-center text-xs font-medium py-1">
                Presets
              </Tab>
            </TabList>

            <TabPanel id="editor" className="outline-none focus:outline-none">
              {children ? (
                children
              ) : (
                <div className="flex flex-col gap-2 w-full min-w-0">
                  {renderSlot(
                    slots.area,
                    {
                      colorSpace: 'hsb',
                      xChannel: 'saturation',
                      yChannel: 'brightness',
                      className: 'h-34 w-full rounded-xl',
                      ...slotProps.area,
                    },
                    { defaultComponent: ColorArea }
                  )}
                  <div className="flex flex-col gap-1.5">
                    {renderSlot(
                      slots.slider,
                      { channel: 'hue', colorSpace: 'hsb', className: 'w-full', ...slotProps.slider },
                      { defaultComponent: ColorSlider }
                    )}
                    {renderSlot(
                      slots.alphaSlider,
                      { channel: 'alpha', colorSpace: 'hsb', className: 'w-full', ...slotProps.alphaSlider },
                      { defaultComponent: ColorSlider }
                    )}
                    <div className="mt-0.5">
                      {renderSlot(
                        slots.formatInputs,
                        {
                          defaultFormat,
                          ...slotProps.formatInputs,
                        },
                        { defaultComponent: ColorFormatInputs }
                      )}
                    </div>
                    {renderSlot(slots?.field, slotProps?.field)}
                    {renderSlot(slots?.eyeDropper, slotProps?.eyeDropper)}
                    {renderSlot(slots?.swatch, slotProps?.swatch)}
                    {renderSlot(slots?.swatchPicker, slotProps?.swatchPicker)}
                  </div>
                </div>
              )}
            </TabPanel>

            <TabPanel id="presets" className="outline-none focus:outline-none">
              {renderSlot(
                slots.presets,
                {
                  customSwatches: customList,
                  onAddCustomSwatch: addSwatch,
                  onRemoveCustomSwatch: removeSwatch,
                  currentGradient: gradientConfig,
                  onStartAdd: (opts) => {
                    setAddingPresetOptions(opts || {
                      initialType: 'solid',
                      currentColor: pickerState?.color?.toString('hex'),
                      currentGradient: gradientConfig,
                    })
                  },
                  onSelect: (valueOrItem: string) => {
                    const parsed = parseCustomSwatchItem(valueOrItem)
                    if (parsed.isGradient) {
                      const grad = parseCssGradient(parsed.value)
                      if (grad) {
                        setGradientConfig(grad)
                        onGradientChange?.(grad)
                        handleFillTypeChange('gradient')
                      }
                    } else {
                      try {
                        pickerState?.setColor(parseColor(parsed.value))
                      } catch { }
                    }
                  },
                  ...slotProps.presets,
                },
                { defaultComponent: PresetsContainer }
              )}
            </TabPanel>
          </Tabs>
        )}
      </ColorFormatProvider>
    </Popover>
  )
}

export const ColorPicker = createInterfaceComponent<ColorPickerProps, ColorPickerSlots>(
  {
    name: 'ColorPicker',
    category: 'form',
    description: 'Precision-grade color & gradient picker popover with Solid, Gradient, and Image modes, interactive canvas vectors, draggable track stops, formatted stop rows, and saved swatches.',
    version: '1.0.0',
    props: {
      defaultFillType: 'solid',
      defaultTab: 'editor',
      defaultFormat: 'hex',
      placement: 'bottom start',
      showArrow: false,
      size: 'auto',
    },
    slots: {
      presets: PresetsContainer,
      createPresetForm: CreatePresetForm,
      area: ColorArea,
      slider: ColorSlider,
      alphaSlider: ColorSlider,
      field: undefined,
      formatInputs: ColorFormatInputs,
      gradientEditor: ColorGradientEditor,
      imageFill: ColorImageFill,
      closeIcon: XMarkIcon,
      eyeDropper: undefined,
      swatch: undefined,
      swatchPicker: undefined,
    },
  },
  ColorPickerPrimitive
)

/* ==========================================================================
   EyeDropper Subcomponent & Factory
   ========================================================================== */

export interface EyeDropperSlots {
  /** Leading eye dropper icon rendered inside the trigger button. */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface EyeDropperProps {
  /** Custom CSS classes for the eye dropper trigger button. */
  className?: string
  /** Button intent style. */
  intent?: 'outline' | 'primary' | 'secondary' | 'subtle'
  /** Button size. */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'sq-xs' | 'sq-sm' | 'sq-md' | 'sq-lg'
  /** Injected slot component overrides. */
  slots?: SlotComponents<EyeDropperSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<EyeDropperSlots>
}

declare global {
  interface Window {
    EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> }
  }
}

const EyeDropperPrimitive = ({
  className,
  intent = 'outline',
  size = 'sq-md',
  slots = {},
  slotProps = {},
}: EyeDropperProps) => {
  const state = useContext(ColorPickerStateContext)

  if (typeof window === 'undefined' || !window.EyeDropper) {
    return null
  }

  return (
    <Button
      className={cn('shrink-0 size-8', className)}
      aria-label="Eye dropper"
      size="sq-sm"
      intent={intent}
      onPress={() => {
        const eyeDropper = window.EyeDropper ? new window.EyeDropper() : null
        eyeDropper?.open().then((result) => {
          if (result?.sRGBHex && state) {
            state.setColor(parseColor(result.sRGBHex))
          }
        })
      }}
    >
      {renderSlot(
        slots.icon,
        { className: 'size-4', 'data-slot': 'icon', ...(slotProps.icon as object) } as React.SVGProps<SVGSVGElement>,
        { defaultComponent: EyeDropperIcon }
      )}
    </Button>
  )
}

export const EyeDropper = createInterfaceComponent<EyeDropperProps, EyeDropperSlots>(
  {
    name: 'EyeDropper',
    category: 'form',
    description: 'Native browser EyeDropper API button that picks any pixel color from the screen.',
    version: '1.0.0',
    props: {
      intent: 'outline',
      size: 'sq-md',
    },
    slots: {
      icon: EyeDropperIcon,
    },
  },
  EyeDropperPrimitive
)

// Namespace attachments for compound family ergonomics
ColorPicker.FormatInputs = ColorFormatInputs
ColorPicker.GradientEditor = ColorGradientEditor
ColorPicker.ImageFill = ColorImageFill
ColorPicker.Presets = PresetsContainer
ColorPicker.CreatePresetForm = CreatePresetForm
ColorPicker.Area = ColorArea
ColorPicker.Slider = ColorSlider
ColorPicker.Output = ColorSliderOutput
ColorPicker.Track = ColorSliderTrack
ColorPicker.Thumb = ColorThumb
ColorPicker.Wheel = ColorWheel
ColorPicker.Field = ColorField
ColorPicker.Swatch = ColorSwatch
ColorPicker.SwatchPicker = ColorSwatchPicker
ColorPicker.SwatchPickerItem = ColorSwatchPickerItem
ColorPicker.EyeDropper = EyeDropper
