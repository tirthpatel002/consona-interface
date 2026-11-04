import React, { useContext, useState, useEffect } from 'react'
import { ColorPickerStateContext, ColorPicker as RACColorPicker } from 'react-aria-components'
import { parseColor, type Color } from '@react-stately/color'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap, InterfaceComponent } from '../../../../core/types'
import { Tabs, TabList, Tab, TabPanel } from '../tabs'
import { Input, type InputProps } from '../input'
import { PlusIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/20/solid'
import { ColorArea, type ColorAreaProps } from './color-area'
import { ColorSlider, type ColorSliderProps } from './color-slider'
import { ColorFormatInputs, type ColorFormatInputsProps } from './color-format-inputs'
import { ColorGradientEditor, type ColorGradientEditorProps } from './color-gradient-editor'
import {
  useCustomSwatches,
  type UseCustomSwatchesOptions,
  parseCustomSwatchItem,
  type GradientConfig,
  gradientToCss,
  GRADIENT_PRESETS,
} from './color-utils'

/* ==========================================================================
   Curated Preset Palettes (36 Soft Pastel + 36 Moody Dark)
   ========================================================================== */

export interface ColorPresetItem {
  name: string
  hex: string
}

export const SOFT_COLOR_PRESETS: ColorPresetItem[] = [
  // Whites, Neutrals & Light Grays
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Snow Drift', hex: '#f8fafc' },
  { name: 'Alabaster', hex: '#f8f9fa' },
  { name: 'Cotton Pearl', hex: '#f5f5f7' },
  { name: 'Ivory Mist', hex: '#fdfbf7' },
  { name: 'Porcelain', hex: '#f1f5f9' },
  { name: 'Soft Chalk', hex: '#e2e8f0' },
  { name: 'Dove Gray', hex: '#e4e4e7' },

  // Soft Pinks & Roses
  { name: 'Blush Satin', hex: '#ffcad4' },
  { name: 'Rose Quartz', hex: '#ffe5d9' },
  { name: 'Cameo Pink', hex: '#fde2e4' },
  { name: 'Petal Pink', hex: '#fce7f3' },
  { name: 'Flamingo Pastel', hex: '#fbcfe8' },
  { name: 'Ballet Slipper', hex: '#ffd1dc' },

  // Soft Purples & Lavenders
  { name: 'Lavender Haze', hex: '#e8e8e4' },
  { name: 'Frosted Mauve', hex: '#e2d4f0' },
  { name: 'Lilac Feather', hex: '#f3e8ff' },
  { name: 'Pale Thistle', hex: '#ece4f9' },
  { name: 'Wisteria Pale', hex: '#e9d8fd' },
  { name: 'Soft Iris', hex: '#ede9fe' },

  // Soft Blues & Cyans
  { name: 'Cloud Whisper', hex: '#e0fbfc' },
  { name: 'Chalk Blue', hex: '#d9e8f5' },
  { name: 'Morning Sky', hex: '#e0f2fe' },
  { name: 'Icy Azure', hex: '#e1f5fe' },
  { name: 'Periwinkle Fog', hex: '#dce4ff' },
  { name: 'Glacier Mist', hex: '#cffafe' },

  // Soft Mints, Seafoams & Sages
  { name: 'Soft Sage', hex: '#d8e2dc' },
  { name: 'Dusty Mint', hex: '#d0f4de' },
  { name: 'Eucalyptus', hex: '#c6dec6' },
  { name: 'Seafoam Silk', hex: '#e8f8f5' },
  { name: 'Pistachio Ice', hex: '#e8f5e9' },
  { name: 'Matcha Milk', hex: '#e4eed7' },
  { name: 'Honeydew', hex: '#f0fdf4' },
  { name: 'Celadon Breeze', hex: '#def0e5' },
  { name: 'Spearmint Foam', hex: '#ccfbf1' },
  { name: 'Spring Meadow', hex: '#dcfce7' },

  // Soft Yellows, Creams & Peaches
  { name: 'Buttercream', hex: '#fef9e7' },
  { name: 'Vanilla Chiffon', hex: '#fff8e7' },
  { name: 'Peach Puff', hex: '#ffe5d4' },
  { name: 'Champagne', hex: '#f9f1e7' },
  { name: 'Apricot Nectar', hex: '#ffedd5' },
  { name: 'Primrose Soft', hex: '#fef08a' },
  { name: 'Lemon Chiffon', hex: '#fef9c3' },
  { name: 'Custard Cream', hex: '#fef3c7' },
  { name: 'Pastel Saffron', hex: '#fed7aa' },
  { name: 'Papaya Whip', hex: '#ffefd5' },

  // Soft Earth & Warm Pastels
  { name: 'Linen Mist', hex: '#f7ebe8' },
  { name: 'Oatmeal Cream', hex: '#f5ebe0' },
  { name: 'Fawn Cashmere', hex: '#ead7d1' },
  { name: 'Smoky Quartz Light', hex: '#e5e0db' },
  { name: 'Sand Dollar', hex: '#efece6' },
  { name: 'Cool Pewter', hex: '#cbd5e1' },
]

export const DARK_COLOR_PRESETS: ColorPresetItem[] = [
  // Blacks, Charcoals & Grays
  { name: 'Pure Black', hex: '#000000' },
  { name: 'Obsidian Noir', hex: '#0f0f11' },
  { name: 'Charcoal Gray', hex: '#1f2937' },
  { name: 'Gunmetal Slate', hex: '#27272a' },
  { name: 'Iron Ore', hex: '#374151' },
  { name: 'Cool Graphite', hex: '#475569' },
  { name: 'Smoked Tungsten', hex: '#3f3f46' },
  { name: 'Pewter Shadow', hex: '#52525b' },

  // Dark Pinks & Magentas
  { name: 'Dark Rose Pink', hex: '#9f1239' },
  { name: 'Midnight Magenta', hex: '#be185d' },
  { name: 'Raspberry Noir', hex: '#831843' },
  { name: 'Dark Coral Pink', hex: '#9e2a2b' },
  { name: 'Deep Flamingo', hex: '#a21caf' },
  { name: 'Mulberry Pink', hex: '#701a75' },
  { name: 'Ruby Twilight', hex: '#881337' },
  { name: 'Dark Fuchsia', hex: '#86198f' },

  // Dark Yellows, Mustards & Golds
  { name: 'Dark Mustard', hex: '#854d0e' },
  { name: 'Antique Gold', hex: '#713f12' },
  { name: 'Dark Saffron', hex: '#a16207' },
  { name: 'Dark Citron', hex: '#4d4408' },
  { name: 'Honey Ochre', hex: '#92400e' },
  { name: 'Tuscan Amber', hex: '#b45309' },
  { name: 'Bronze Olive', hex: '#594a05' },
  { name: 'Burnt Caramel', hex: '#7c2d12' },

  // Dark Mints, Seafoams & Greens
  { name: 'Dark Mint', hex: '#065f46' },
  { name: 'Dark Spearmint', hex: '#047857' },
  { name: 'Seafoam Shadow', hex: '#0d5c58' },
  { name: 'Jade Mint', hex: '#115e59' },
  { name: 'Pine Mint', hex: '#0f766e' },
  { name: 'Frosted Evergreen', hex: '#134e4a' },
  { name: 'Forest Emerald', hex: '#14532d' },
  { name: 'Deep Pine', hex: '#15803d' },

  // Dark Limes & Olives
  { name: 'Dark Olive Lime', hex: '#3f6212' },
  { name: 'Moss Green', hex: '#4d7c0f' },
  { name: 'Dark Chartreuse', hex: '#365314' },
  { name: 'Kombu Green', hex: '#1a381e' },

  // Dark Cyans & Teals
  { name: 'Deep Petroleum', hex: '#0e7490' },
  { name: 'Ocean Abyss', hex: '#0369a1' },
  { name: 'Aegean Teal', hex: '#155e75' },
  { name: 'Stormy Cyan', hex: '#164e63' },

  // Dark Blues & Indigos
  { name: 'Midnight Navy', hex: '#1e3a8a' },
  { name: 'Deep Sapphire', hex: '#1d4ed8' },
  { name: 'Imperial Indigo', hex: '#4338ca' },
  { name: 'Slate Indigo', hex: '#3730a3' },
  { name: 'Cobalt Night', hex: '#2563eb' },
  { name: 'Twilight Steel', hex: '#334155' },

  // Dark Purples & Violets
  { name: 'Velvet Violet', hex: '#6b21a8' },
  { name: 'Dark Amethyst', hex: '#5b21b6' },
  { name: 'Blackcurrant', hex: '#4c1d95' },
  { name: 'Imperial Plum', hex: '#581c87' },

  // Dark Warm & Earth Tones
  { name: 'Dark Terracotta', hex: '#9a3412' },
  { name: 'Espresso Roast', hex: '#451a03' },
]

/* ==========================================================================
   CreatePresetForm Slots & Props
   ========================================================================== */

export interface CreatePresetFormSlots {
  /** Color saturation/brightness 2D area slot. */
  area?: React.ComponentType<ColorAreaProps>
  /** Hue color slider slot. */
  slider?: React.ComponentType<ColorSliderProps>
  /** Alpha opacity slider slot. */
  alphaSlider?: React.ComponentType<ColorSliderProps>
  /** Color format inputs switcher slot. */
  formatInputs?: React.ComponentType<ColorFormatInputsProps>
  /** Gradient multi-stop editor slot. */
  gradientEditor?: React.ComponentType<ColorGradientEditorProps>
  /** Preset name text input slot. */
  nameInput?: React.ComponentType<InputProps>
  /** Back navigation icon slot. */
  backIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface CreatePresetFormProps {
  /** Initial mode: 'solid' | 'gradient'. */
  initialType?: 'solid' | 'gradient'
  /** Current active solid color hex. */
  currentColor?: string
  /** Current active gradient configuration. */
  currentGradient?: GradientConfig
  /** Callback fired when the preset is saved. */
  onSave: (payload: string, name: string) => void
  /** Optional cancel callback. */
  onCancel?: () => void
  /** Optional back button callback. */
  onBack?: () => void
  /** Title text. */
  title?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<CreatePresetFormSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<CreatePresetFormSlots>
}

const CreatePresetFormPrimitive = ({
  initialType = 'solid',
  currentColor,
  currentGradient,
  onSave,
  onBack,
  title = 'New Preset',
  slots = {},
  slotProps = {},
}: CreatePresetFormProps) => {
  const [presetType, setPresetType] = useState<'solid' | 'gradient'>(initialType)
  const [presetName, setPresetName] = useState('')
  const [solidColor, setSolidColor] = useState<Color>(() => {
    try {
      return parseColor(currentColor || '#7F56D9')
    } catch {
      return parseColor('#7F56D9')
    }
  })
  const [gradientConfig, setGradientConfig] = useState<GradientConfig>(() => {
    if (currentGradient) return currentGradient
    return (
      GRADIENT_PRESETS[0]?.config || {
        type: 'linear',
        angle: 90,
        stops: [
          { id: '1', color: '#f43f5e', position: 0 },
          { id: '2', color: '#8b5cf6', position: 50 },
          { id: '3', color: '#3b82f6', position: 100 },
        ],
      }
    )
  })

  useEffect(() => {
    setPresetType(initialType)
    setPresetName('')
    if (currentColor) {
      try {
        setSolidColor(parseColor(currentColor))
      } catch { }
    }
    if (currentGradient) {
      setGradientConfig(currentGradient)
    }
  }, [initialType, currentColor, currentGradient])

  const handleSave = () => {
    if (presetType === 'solid') {
      const hex = solidColor.toString('hex').toUpperCase()
      const name = presetName.trim() || 'Custom Color'
      const payload = JSON.stringify({ name, hex })
      onSave?.(payload, name)
    } else {
      const css = gradientToCss(gradientConfig)
      const name = presetName.trim() || 'Custom Gradient'
      const payload = JSON.stringify({ name, hex: css })
      onSave?.(payload, name)
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full min-w-0 max-w-full overflow-x-hidden p-1">
      {/* Top Header without divider border */}
      <div className="flex items-center justify-between gap-2 pb-0.5 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="flex items-center justify-center p-0.5 -ml-0.5 rounded-md text-muted-fg hover:text-fg hover:bg-secondary/60 transition-colors cursor-pointer bg-transparent outline-none shrink-0"
            >
              {renderSlot(
                slots.backIcon,
                { className: 'size-3.5', ...slotProps.backIcon },
                { defaultComponent: ArrowLeftIcon }
              )}
            </button>
          )}
          <span className="text-xs font-semibold text-fg truncate">{title}</span>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="px-2.5 py-1 rounded-base bg-primary text-primary-fg text-xs font-semibold hover:bg-primary/90 active:scale-95 transition-all cursor-pointer outline-none shadow-2xs shrink-0"
        >
          Save
        </button>
      </div>

      {/* Mode Switcher: Underline Tabs (Solid Color vs Gradient) */}
      <div className="flex items-center gap-4 shrink-0 pb-1 mb-0.5">
        <button
          type="button"
          onClick={() => setPresetType('solid')}
          className={cn(
            'text-xs font-semibold pb-1 transition-all cursor-pointer relative',
            presetType === 'solid'
              ? 'text-primary'
              : 'text-muted-fg hover:text-fg'
          )}
        >
          Solid Color
          {presetType === 'solid' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setPresetType('gradient')}
          className={cn(
            'text-xs font-semibold pb-1 transition-all cursor-pointer relative',
            presetType === 'gradient'
              ? 'text-primary'
              : 'text-muted-fg hover:text-fg'
          )}
        >
          Gradient
          {presetType === 'gradient' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      </div>

      {/* Preset Name Input */}
      <div className="flex flex-col gap-1 shrink-0">
        {renderSlot(
          slots.nameInput,
          {
            placeholder: presetType === 'gradient' ? 'Preset Name (e.g. Sunset Glow)' : 'Preset Name (e.g. Brand Purple)',
            value: presetName,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPresetName(e.target.value),
            autoFocus: true,
            className: 'h-7.5 text-xs py-1 px-2.5 rounded-base',
            ...slotProps.nameInput,
          },
          { defaultComponent: Input }
        )}
      </div>

      {/* Editor Body */}
      {presetType === 'solid' ? (
        <RACColorPicker
          value={solidColor}
          onChange={setSolidColor}
        >
          <div className="flex flex-col gap-2 w-full min-w-0">
            {renderSlot(
              slots.area,
              {
                colorSpace: 'hsb',
                xChannel: 'saturation',
                yChannel: 'brightness',
                className: 'h-28 w-full rounded-xl',
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
                  { ...slotProps.formatInputs },
                  { defaultComponent: ColorFormatInputs }
                )}
              </div>
            </div>
          </div>
        </RACColorPicker>
      ) : (
        <div className="flex flex-col gap-2 w-full min-w-0 max-w-full max-h-80 overflow-y-auto overflow-x-hidden p-1 pr-1.5">
          {renderSlot(
            slots.gradientEditor,
            {
              config: gradientConfig,
              onChange: setGradientConfig,
              showPresetsRow: false,
              ...slotProps.gradientEditor,
            },
            { defaultComponent: ColorGradientEditor }
          )}
        </div>
      )}
    </div>
  )
}

export const CreatePresetForm: InterfaceComponent<CreatePresetFormProps, CreatePresetFormSlots> =
  createInterfaceComponent<CreatePresetFormProps, CreatePresetFormSlots>(
  {
    name: 'CreatePresetForm',
    category: 'form',
    description: 'Inline creation form for saving custom solid colors or gradients with naming and live preview.',
    version: '1.0.0',
    props: {
      initialType: 'solid',
      title: 'New Preset',
    },
    slots: {
      area: ColorArea,
      slider: ColorSlider,
      alphaSlider: ColorSlider,
      formatInputs: ColorFormatInputs,
      gradientEditor: undefined,
      nameInput: Input,
      backIcon: ArrowLeftIcon,
    },
  },
  CreatePresetFormPrimitive
)

/* ==========================================================================
   PresetsContainer Styles
   ========================================================================== */

export const presetsContainerStyles = tv({
  base: 'flex flex-col gap-3 w-full min-w-0',
})

/* ==========================================================================
   PresetsContainer Slots & Props
   ========================================================================== */

export interface PresetsContainerSlots {
  /** Create preset form slot. */
  createForm?: React.ComponentType<CreatePresetFormProps>
  /** Add (+) button icon slot. */
  addIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Remove preset trash icon slot. */
  deleteIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface PresetsContainerProps
  extends VariantProps<typeof presetsContainerStyles>,
  UseCustomSwatchesOptions {
  /** Custom soft pastel presets array (defaults to 36 soft colors). */
  softColors?: ColorPresetItem[]
  /** Custom dark moody presets array (defaults to 36 dark colors). */
  darkColors?: ColorPresetItem[]
  /** Default active sub-tab ('soft' | 'dark' | 'custom'). */
  defaultTab?: 'soft' | 'dark' | 'custom'
  /** Current active color hex string to add when + is clicked if not using state context. */
  currentColor?: string
  /** Current active gradient configuration (if opened in gradient context). */
  currentGradient?: GradientConfig
  /** Whether to start immediately in Create Preset view. */
  initialIsAdding?: boolean
  /** Initial preset type when creating a preset: 'solid' | 'gradient'. */
  initialPresetType?: 'solid' | 'gradient'
  /** Custom CSS classes for the presets container. */
  className?: string
  /** Callback fired when a preset color tile is clicked. */
  onSelect?: (hexOrCss: string) => void
  /** Callback fired to start creating a new preset in an external full-picker container view. */
  onStartAdd?: (options?: { initialType?: 'solid' | 'gradient'; currentColor?: string; currentGradient?: GradientConfig }) => void
  /** Injected slot component overrides. */
  slots?: SlotComponents<PresetsContainerSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<PresetsContainerSlots>
}

const PresetsContainerPrimitive = ({
  softColors = SOFT_COLOR_PRESETS,
  darkColors = DARK_COLOR_PRESETS,
  defaultTab = 'soft',
  customSwatches: controlledCustomSwatches,
  defaultCustomSwatches,
  onCustomSwatchesChange,
  onAddCustomSwatch,
  onRemoveCustomSwatch,
  storageKey,
  currentColor,
  currentGradient,
  initialIsAdding = false,
  initialPresetType,
  className,
  onSelect,
  onStartAdd,
  slots = {},
  slotProps = {},
}: PresetsContainerProps) => {
  const state = useContext(ColorPickerStateContext)
  const activeColorObj = state?.color ?? (state as any)?.value
  const activeHex = activeColorObj ? activeColorObj.toString('hex')?.toLowerCase() : currentColor?.toLowerCase()

  const [selectedTab, setSelectedTab] = useState<'soft' | 'dark' | 'custom'>(defaultTab)
  const [isAdding, setIsAdding] = useState(initialIsAdding)

  const handleStartAdd = () => {
    if (onStartAdd) {
      onStartAdd({
        initialType: initialPresetType || (currentGradient ? 'gradient' : 'solid'),
        currentColor: activeHex || currentColor,
        currentGradient,
      })
    } else {
      setIsAdding(true)
    }
  }

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

  const renderColorGrid = (items: ColorPresetItem[]) => (
    <div className="grid grid-cols-2 auto-rows-max content-start gap-1.5 min-h-56 max-h-60 overflow-y-auto w-full overscroll-contain py-1 pr-0.5">
      {items.map((item) => {
        const isSelected = activeHex === item.hex.toLowerCase()
        return (
          <button
            type="button"
            key={item.hex}
            onClick={() => {
              onSelect?.(item.hex)
              try {
                state?.setColor(parseColor(item.hex))
              } catch { }
            }}
            className={cn(
              'group/preset flex items-center gap-2 p-1.5 rounded-base text-left transition-all duration-150 cursor-pointer outline-none select-none w-full h-auto',
              'border border-border/60 hover:border-border hover:bg-secondary/40 active:scale-[0.98]',
              'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40',
              isSelected && 'border-primary bg-primary/10 ring-1 ring-inset ring-primary/50'
            )}
            title={`${item.name} (${item.hex})`}
          >
            <div
              className="size-5 shrink-0 rounded-micro border border-border/80 shadow-2xs"
              style={{ backgroundColor: item.hex }}
            />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium text-fg truncate leading-tight">{item.name}</span>
              <span className="text-[11px] font-mono text-muted-fg uppercase tracking-tight leading-none">{item.hex}</span>
            </div>
          </button>
        )
      })}
    </div>
  )

  const renderCustomGrid = () => {
    if (customList.length === 0) {
      return (
        <div className="min-h-56 flex flex-col items-center justify-center p-4 text-center border border-dashed border-border/80 rounded-xl my-1">
          <p className="text-xs text-muted-fg font-medium">No custom colors saved yet.</p>
          <p className="text-xs text-muted-fg mt-0.5">Pick and name your favorite colors & gradients</p>
          <button
            type="button"
            onClick={handleStartAdd}
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-base bg-primary/10 text-primary hover:bg-primary hover:text-primary-fg transition-all cursor-pointer border border-primary/20 outline-none"
          >
            {renderSlot(
              slots.addIcon,
              { className: 'size-3.5', ...slotProps.addIcon },
              { defaultComponent: PlusIcon }
            )}
            <span>Create Custom Preset</span>
          </button>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 auto-rows-max content-start gap-1.5 min-h-56 max-h-60 overflow-y-auto w-full overscroll-contain py-1 pr-0.5">
        {customList.map((item, idx) => {
          const parsed = parseCustomSwatchItem(item, idx)
          const isSelected = activeHex && parsed.value.toLowerCase() === activeHex

          return (
            <div
              key={`${item}_${idx}`}
              className={cn(
                'group/custom flex items-center justify-between gap-1.5 p-1.5 rounded-base text-left transition-all duration-150 cursor-pointer select-none w-full h-auto relative',
                'border border-border/60 hover:border-border hover:bg-secondary/40',
                isSelected && 'border-primary bg-primary/10 ring-1 ring-inset ring-primary/50'
              )}
            >
              <button
                type="button"
                onClick={() => {
                  onSelect?.(parsed.value)
                  if (!parsed.isGradient) {
                    try {
                      state?.setColor(parseColor(parsed.value))
                    } catch { }
                  }
                }}
                className="flex items-center gap-2 min-w-0 flex-1 text-left outline-none cursor-pointer bg-transparent"
                title={`${parsed.name} (${parsed.value})`}
              >
                <div
                  className="size-5 shrink-0 rounded-micro border border-border/80 shadow-2xs"
                  style={{ background: parsed.value }}
                />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-medium text-fg truncate leading-tight">
                    {parsed.name}
                  </span>
                  <span className="text-[11px] font-mono text-muted-fg uppercase tracking-tight leading-none truncate">
                    {parsed.isGradient ? 'CSS' : parsed.value}
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeSwatch(item)
                }}
                aria-label={`Remove ${parsed.name}`}
                title="Remove swatch"
                className="opacity-0 group-hover/custom:opacity-100 p-1 text-muted-fg hover:text-danger rounded transition-opacity cursor-pointer bg-transparent shrink-0"
              >
                {renderSlot(
                  slots.deleteIcon,
                  { className: 'size-3', ...slotProps.deleteIcon },
                  { defaultComponent: TrashIcon }
                )}
              </button>
            </div>
          )
        })}
      </div>
    )
  }

  // If in create preset view inside the Presets popover
  if (isAdding) {
    return (
      <div data-slot="presets-container" className={cn(presetsContainerStyles(), className, 'p-1 overflow-x-hidden')}>
        {renderSlot(
          slots.createForm,
          {
            initialType: initialPresetType || (currentGradient ? 'gradient' : 'solid'),
            currentColor: activeHex || currentColor,
            currentGradient: currentGradient,
            onBack: () => setIsAdding(false),
            onCancel: () => setIsAdding(false),
            onSave: (payload) => {
              addSwatch(payload)
              const parsed = parseCustomSwatchItem(payload)
              onSelect?.(parsed.value)
              setIsAdding(false)
              setSelectedTab('custom')
            },
            ...slotProps.createForm,
          },
          { defaultComponent: CreatePresetForm }
        )}
      </div>
    )
  }

  return (
    <div data-slot="presets-container" className={cn(presetsContainerStyles(), className)}>
      <div className="flex flex-col gap-3 w-full min-w-0">
        <div className="flex items-center justify-between gap-2 w-full pb-1 shrink-0">
          <div className="flex items-center gap-4">
            {(['soft', 'dark', 'custom'] as const).map((tabKey) => {
              const isActive = selectedTab === tabKey
              const count = tabKey === 'soft' ? softColors.length : tabKey === 'dark' ? darkColors.length : customList.length
              const label = tabKey === 'soft' ? 'Soft' : tabKey === 'dark' ? 'Dark' : 'Custom'
              return (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => setSelectedTab(tabKey)}
                  className={cn(
                    'text-xs font-semibold capitalize pb-1 transition-all cursor-pointer relative outline-none',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-fg hover:text-fg'
                  )}
                >
                  {label} ({count})
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={handleStartAdd}
            aria-label="Add new custom preset"
            title="Create new color preset (+)"
            className="size-6 flex items-center justify-center rounded-base border border-border/80 bg-secondary/40 hover:bg-secondary text-fg hover:text-primary transition-all cursor-pointer shrink-0 outline-none active:scale-95"
          >
            {renderSlot(
              slots.addIcon,
              { className: 'size-3.5', ...slotProps.addIcon },
              { defaultComponent: PlusIcon }
            )}
          </button>
        </div>

        <div className="w-full min-h-56">
          {selectedTab === 'soft' && renderColorGrid(softColors)}
          {selectedTab === 'dark' && renderColorGrid(darkColors)}
          {selectedTab === 'custom' && renderCustomGrid()}
        </div>
      </div>
    </div>
  )
}

export const PresetsContainer: InterfaceComponent<PresetsContainerProps, PresetsContainerSlots> =
  createInterfaceComponent<PresetsContainerProps, PresetsContainerSlots>(
  {
    name: 'PresetsContainer',
    category: 'form',
    description: 'Tabbed preset color browser featuring curated soft and dark palettes, custom user-saved swatches, and localStorage persistence.',
    version: '1.0.0',
    props: {
      defaultTab: 'soft',
    },
    slots: {
      createForm: CreatePresetForm,
      addIcon: PlusIcon,
      deleteIcon: TrashIcon,
    },
  },
  PresetsContainerPrimitive
)

// Namespace attachments for compound family ergonomics
PresetsContainer.CreateForm = CreatePresetForm

