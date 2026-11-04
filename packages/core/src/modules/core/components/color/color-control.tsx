import React, { useState } from 'react'
import {
  ColorPicker as RACColorPicker,
  type ColorPickerProps as RACColorPickerProps,
  Button as RACButton,
  DialogTrigger,
  ColorSwatch as RACColorSwatch,
} from 'react-aria-components'
import { parseColor, type Color as ColorValue } from '@react-stately/color'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { ColorPicker, type ColorPickerProps, type ColorPickerSlots, EyeDropper, type EyeDropperProps } from './color-picker'
import { ColorSwatch, type ColorSwatchProps } from './color-swatch'
import { ColorArea, type ColorAreaProps } from './color-area'
import { ColorSlider, ColorSliderOutput, ColorSliderTrack, type ColorSliderProps, type ColorSliderOutputProps, type ColorSliderTrackProps } from './color-slider'
import { ColorField, type ColorFieldProps } from './color-field'
import { ColorThumb, type ColorThumbProps } from './color-thumb'
import { ColorWheel, type ColorWheelProps } from './color-wheel'
import { ColorSwatchPicker, ColorSwatchPickerItem, type ColorSwatchPickerProps, type ColorSwatchPickerItemProps } from './color-swatch-picker'
import { PresetsContainer, CreatePresetForm, type PresetsContainerProps, type CreatePresetFormProps } from './color-presets'
import { ColorFormatInputs, type ColorFormatInputsProps } from './color-format-inputs'
import { ColorGradientEditor, type ColorGradientEditorProps } from './color-gradient-editor'
import { ColorImageFill, type ColorImageFillProps } from './color-image-fill'

import {
  type GradientConfig,
  type ImageFillConfig,
  gradientToCss,
  ColorFormatProvider,
} from './color-utils'

/* ==========================================================================
   Color Trigger Styles
   ========================================================================== */

export const colorTriggerStyles = tv({
  base: [
    'group/color relative inline-flex items-center justify-center p-0.5 shrink-0 outline-none cursor-pointer',
    'border border-border/80 bg-bg shadow-xs transition-all duration-150',
    'hover:border-border hover:shadow-sm active:scale-[0.98]',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'overflow-hidden',
  ],
  variants: {
    size: {
      xs: 'size-6 rounded-micro',
      sm: 'size-7 rounded-micro',
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
   ColorTrigger Subcomponent & Factory
   ========================================================================== */

export interface ColorTriggerProps
  extends React.ComponentPropsWithoutRef<typeof RACButton>,
    VariantProps<typeof colorTriggerStyles> {
  /** Size token scaling the box trigger dimensions. */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Geometric shape: 'square' or 'circle'. */
  shape?: 'square' | 'circle'
  /** Fill type: 'solid' | 'gradient' | 'image' */
  fillType?: 'solid' | 'gradient' | 'image'
  /** Gradient configuration if fillType is gradient */
  gradient?: GradientConfig
  /** Image URL if fillType is image */
  imageUrl?: string
  /** Custom CSS classes */
  className?: string
  /** Children or custom swatch indicator */
  children?: React.ReactNode
}

const ColorTriggerPrimitive = ({
  size = 'md',
  shape = 'square',
  fillType = 'solid',
  gradient,
  imageUrl,
  className,
  children,
  ...props
}: ColorTriggerProps) => {
  return (
    <RACButton
      data-slot="color-trigger"
      className={cn(colorTriggerStyles({ size, shape }), className)}
      {...props}
    >
      {children ? (
        children
      ) : fillType === 'gradient' && gradient ? (
        <div
          className="size-full rounded-[inherit] border border-border/40"
          style={{ backgroundImage: gradientToCss(gradient) }}
        />
      ) : fillType === 'image' && imageUrl ? (
        <div
          className="size-full rounded-[inherit] border border-border/40 bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      ) : (
        <RACColorSwatch className="size-full rounded-[inherit] border border-border/40" />
      )}
    </RACButton>
  )
}

export const ColorTrigger = createInterfaceComponent<ColorTriggerProps>(
  {
    name: 'ColorTrigger',
    category: 'form',
    description: 'Small box trigger displaying current color preview for opening the ColorPicker popover.',
    version: '1.0.0',
    props: {
      size: 'md',
      shape: 'square',
    },
  },
  ColorTriggerPrimitive
)

/* ==========================================================================
   Color Root Component & Factory
   ========================================================================== */

export interface ColorSlots extends ColorPickerSlots {
  /** Trigger button slot */
  trigger?: React.ComponentType<ColorTriggerProps>
  /** Color picker popover slot */
  picker?: React.ComponentType<ColorPickerProps>
}

export interface ColorProps
  extends Omit<RACColorPickerProps, 'children'>,
    VariantProps<typeof colorTriggerStyles> {
  /** Allowed fill types: any subset of 'solid' | 'gradient' | 'image'. Defaults to ['solid', 'gradient', 'image']. */
  fillTypes?: ('solid' | 'gradient' | 'image')[]
  /** Whether the color picker trigger is disabled. */
  isDisabled?: boolean
  /** Initial active root tab in the color picker popover ('presets' | 'editor'). */
  defaultTab?: 'presets' | 'editor'
  /** Initial fill type ('solid' | 'gradient' | 'image'). */
  defaultFillType?: 'solid' | 'gradient' | 'image'
  /** Controlled fill type ('solid' | 'gradient' | 'image'). */
  fillType?: 'solid' | 'gradient' | 'image'
  /** Callback fired when fill type changes. */
  onFillTypeChange?: (fillType: 'solid' | 'gradient' | 'image') => void
  /** Initial gradient configuration. */
  defaultGradient?: GradientConfig
  /** Callback fired when gradient changes. */
  onGradientChange?: (gradient: GradientConfig) => void
  /** Initial image fill configuration. */
  defaultImageFill?: ImageFillConfig
  /** Callback fired when image fill changes. */
  onImageFillChange?: (image: ImageFillConfig) => void
  /** Size token scaling the small box: 'xs' | 'sm' | 'md' | 'lg' | 'xl'. */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Geometric shape: 'square' or 'circle'. */
  shape?: 'square' | 'circle'
  /** Custom CSS classes for the trigger button. */
  className?: string
  /** Props passed down into the ColorPicker popover. */
  popover?: ColorPickerProps
  /** Accessible label for the trigger button. */
  'aria-label'?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<ColorSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ColorSlots>
  /** Custom child composition override. */
  children?: React.ReactNode
}

const DEFAULT_GRADIENT: GradientConfig = {
  type: 'radial',
  angle: 135,
  stops: [
    { id: '1', color: '#7F56D9', position: 0 },
    { id: '2', color: '#432E73', position: 100 },
  ],
}

const ColorPrimitive = ({
  size = 'md',
  shape = 'square',
  defaultTab = 'presets',
  fillTypes,
  defaultFillType,
  fillType: controlledFillType,
  onFillTypeChange,
  defaultGradient,
  onGradientChange,
  defaultImageFill,
  onImageFillChange,
  className,
  popover,
  children,
  slots = {},
  slotProps = {},
  'aria-label': ariaLabel = 'Choose color',
  ...props
}: ColorProps) => {
  const initialFillType = controlledFillType ?? defaultFillType ?? popover?.defaultFillType ?? 'solid'
  const [internalFillType, setInternalFillType] = useState<'solid' | 'gradient' | 'image'>(initialFillType)
  const activeFillType = controlledFillType ?? internalFillType

  const [internalGradient, setInternalGradient] = useState<GradientConfig>(
    defaultGradient ?? popover?.defaultGradient ?? DEFAULT_GRADIENT
  )
  const activeGradient = internalGradient

  const [internalImage, setInternalImage] = useState<ImageFillConfig | undefined>(
    defaultImageFill ?? popover?.defaultImageFill
  )
  const activeImage = internalImage

  const handleFillTypeChange = (type: 'solid' | 'gradient' | 'image') => {
    setInternalFillType(type)
    onFillTypeChange?.(type)
    popover?.onFillTypeChange?.(type)
  }

  const handleGradientChange = (g: GradientConfig) => {
    setInternalGradient(g)
    onGradientChange?.(g)
    popover?.onGradientChange?.(g)
  }

  const handleImageChange = (img: ImageFillConfig) => {
    setInternalImage(img)
    onImageFillChange?.(img)
    popover?.onImageFillChange?.(img)
  }

  const trigger = renderSlot(
    slots.trigger,
    {
      size,
      shape,
      className,
      fillType: activeFillType,
      gradient: activeGradient,
      imageUrl: activeImage?.url,
      'aria-label': ariaLabel,
      isDisabled: props.isDisabled,
      ...slotProps.trigger,
    },
    { defaultComponent: ColorTrigger }
  )

  const picker = renderSlot(
    slots.picker,
    {
      fillTypes: fillTypes ?? popover?.fillTypes,
      defaultTab,
      defaultFillType: activeFillType,
      fillType: activeFillType,
      onFillTypeChange: handleFillTypeChange,
      defaultGradient: activeGradient,
      onGradientChange: handleGradientChange,
      defaultImageFill: activeImage,
      onImageFillChange: handleImageChange,
      ...popover,
      slots: {
        presets: slots.presets,
        createPresetForm: slots.createPresetForm,
        area: slots.area,
        slider: slots.slider,
        alphaSlider: slots.alphaSlider,
        field: slots.field,
        formatInputs: slots.formatInputs,
        gradientEditor: slots.gradientEditor,
        imageFill: slots.imageFill,
        eyeDropper: slots.eyeDropper,
        swatch: slots.swatch,
        swatchPicker: slots.swatchPicker,
        closeIcon: slots.closeIcon,
        ...popover?.slots,
      },
      slotProps: {
        presets: slotProps.presets,
        createPresetForm: slotProps.createPresetForm,
        area: slotProps.area,
        slider: slotProps.slider,
        alphaSlider: slotProps.alphaSlider,
        field: slotProps.field,
        formatInputs: slotProps.formatInputs,
        gradientEditor: slotProps.gradientEditor,
        imageFill: slotProps.imageFill,
        eyeDropper: slotProps.eyeDropper,
        swatch: slotProps.swatch,
        swatchPicker: slotProps.swatchPicker,
        closeIcon: slotProps.closeIcon,
        ...popover?.slotProps,
      },
      ...slotProps.picker,
    },
    { defaultComponent: ColorPicker }
  )

  return (
    <ColorFormatProvider>
      <RACColorPicker data-slot="color" {...props}>
        {children ? (
          children
        ) : (
          <DialogTrigger>
            {trigger}
            {picker}
          </DialogTrigger>
        )}
      </RACColorPicker>
    </ColorFormatProvider>
  )
}

export const Color = createInterfaceComponent<ColorProps, ColorSlots>(
  {
    name: 'Color',
    category: 'form',
    description: 'Compact color swatch box trigger that opens an interactive ColorPicker popover on click.',
    version: '1.0.0',
    props: {
      size: 'md',
      shape: 'square',
      defaultTab: 'presets',
    },
    slots: {
      trigger: ColorTrigger,
      picker: ColorPicker,
      presets: PresetsContainer,
      createPresetForm: CreatePresetForm,
      area: ColorArea,
      slider: ColorSlider,
      alphaSlider: ColorSlider,
      field: undefined,
      formatInputs: ColorFormatInputs,
      gradientEditor: ColorGradientEditor,
      imageFill: ColorImageFill,
      eyeDropper: undefined,
      swatch: undefined,
      swatchPicker: undefined,
      closeIcon: undefined,
    },
  },
  ColorPrimitive
)

// Namespace attachments for compound family ergonomics
Color.Trigger = ColorTrigger
Color.Picker = ColorPicker
Color.Presets = PresetsContainer
Color.CreatePresetForm = CreatePresetForm
Color.FormatInputs = ColorFormatInputs
Color.GradientEditor = ColorGradientEditor
Color.ImageFill = ColorImageFill
Color.Swatch = ColorSwatch
Color.SwatchPicker = ColorSwatchPicker
Color.SwatchPickerItem = ColorSwatchPickerItem
Color.Area = ColorArea
Color.Slider = ColorSlider
Color.SliderOutput = ColorSliderOutput
Color.SliderTrack = ColorSliderTrack
Color.Thumb = ColorThumb
Color.Wheel = ColorWheel
Color.Field = ColorField
Color.EyeDropper = EyeDropper
