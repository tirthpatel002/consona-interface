import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  ColorPicker as RACColorPicker,
  DialogTrigger,
  Button as RACButton,
} from 'react-aria-components'
import { parseColor, type Color as ColorValue } from '@react-stately/color'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap, InterfaceComponent } from '../../../../core/types'
import { Popover } from '../popover'
import { Tabs, TabList, Tab, TabPanel } from '../tabs'
import { ColorArea, type ColorAreaProps } from './color-area'
import { ColorSlider, type ColorSliderProps } from './color-slider'
import { ColorFormatInputs, type ColorFormatInputsProps } from './color-format-inputs'
import { PresetsContainer, CreatePresetForm, type PresetsContainerProps, type CreatePresetFormProps } from './color-presets'
import {
  type GradientConfig,
  type GradientStop,
  type GradientType,
  gradientToCss,
  parseCssGradient,
  getColorAtPosition,
  extractRgba,
  rgbToHex,
  hexToRgba,
  clampColorValue,
  GRADIENT_PRESETS,
  useCustomSwatches,
  type UseCustomSwatchesOptions,
  parseCustomSwatchItem,
} from './color-utils'
import {
  ArrowsRightLeftIcon,
  PlusIcon,
  MinusIcon,
  ChevronDownIcon,
  SparklesIcon,
  ArrowLeftIcon,
} from '@heroicons/react/20/solid'

/* ==========================================================================
   StopSolidColorPicker Popover Subcomponent
   ========================================================================== */

interface StopSolidColorPickerProps {
  color: string
  onChange: (hex: string) => void
  onSelect?: () => void
  slots?: SlotComponents<ColorGradientEditorSlots>
  slotProps?: SlotPropsMap<ColorGradientEditorSlots>
}

const StopSolidColorPicker = ({ color, onChange, onSelect, slots = {}, slotProps = {} }: StopSolidColorPickerProps) => {
  const [isAddingPreset, setIsAddingPreset] = useState(false)
  let parsedColor: ColorValue
  try {
    parsedColor = parseColor(color)
  } catch {
    parsedColor = parseColor('#7F56D9')
  }

  return (
    <RACColorPicker
      value={parsedColor}
      onChange={(c) => {
        onChange?.(c.toString('hex'))
      }}
    >
      <DialogTrigger>
        <RACButton
          onPress={onSelect}
          aria-label="Pick stop color with SolidColorPicker"
          className="relative size-4 rounded-full border border-border/80 shadow-2xs shrink-0 cursor-pointer hover:scale-120 active:scale-95 transition-transform outline-none focus-visible:ring-2 focus-visible:ring-primary"
          style={{ backgroundColor: color }}
        />
        <Popover
          placement="bottom start"
          className="w-80 p-3.5 min-w-0 bg-overlay/95 backdrop-blur-md border border-border/80 shadow-2xl rounded-2xl flex flex-col gap-3 z-50"
        >
          {isAddingPreset ? (
            renderSlot(
              slots.createPresetForm,
              {
                initialType: 'solid',
                currentColor: color,
                onBack: () => setIsAddingPreset(false),
                onCancel: () => setIsAddingPreset(false),
                onSave: (payload) => {
                  const parsed = parseCustomSwatchItem(payload)
                  if (!parsed.isGradient) {
                    onChange?.(parsed.value)
                  }
                  setIsAddingPreset(false)
                },
                ...slotProps.createPresetForm,
              },
              { defaultComponent: CreatePresetForm }
            )
          ) : (
            <Tabs defaultSelectedKey="editor" className="w-full flex flex-col gap-3">
              <TabList variant="segmented" className="w-full grid grid-cols-2 p-0.5">
                <Tab id="editor" size="sm" className="justify-center text-xs font-medium py-1">
                  Editor
                </Tab>
                <Tab id="presets" size="sm" className="justify-center text-xs font-medium py-1">
                  Presets
                </Tab>
              </TabList>

              <TabPanel id="editor" className="outline-none focus:outline-none">
                <div className="flex flex-col gap-2 w-full min-w-0">
                  {renderSlot(
                    slots.area,
                    {
                      colorSpace: 'hsb',
                      xChannel: 'saturation',
                      yChannel: 'brightness',
                      className: 'h-32 w-full rounded-xl',
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
              </TabPanel>

              <TabPanel id="presets" className="outline-none focus:outline-none min-h-56">
                {renderSlot(
                  slots.presets,
                  {
                    onSelect: (hex) => onChange?.(hex),
                    onStartAdd: () => setIsAddingPreset(true),
                    ...slotProps.presets,
                  },
                  { defaultComponent: PresetsContainer }
                )}
              </TabPanel>
            </Tabs>
          )}
        </Popover>
      </DialogTrigger>
    </RACColorPicker>
  )
}

/* ==========================================================================
   ColorGradientEditor Styles
   ========================================================================== */

export const colorGradientEditorStyles = tv({
  base: 'flex flex-col gap-3 w-full min-w-0',
})

/* ==========================================================================
   ColorGradientEditor Slots & Props
   ========================================================================== */

export interface ColorGradientEditorSlots {
  /** Presets container slot. */
  presets?: React.ComponentType<PresetsContainerProps>
  /** Create preset form slot. */
  createPresetForm?: React.ComponentType<CreatePresetFormProps>
  /** Color saturation/brightness 2D area slot. */
  area?: React.ComponentType<ColorAreaProps>
  /** Hue color slider slot. */
  slider?: React.ComponentType<ColorSliderProps>
  /** Alpha opacity slider slot. */
  alphaSlider?: React.ComponentType<ColorSliderProps>
  /** Color format inputs switcher slot. */
  formatInputs?: React.ComponentType<ColorFormatInputsProps>
  /** Add stop (+) icon slot. */
  plusIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Remove stop (-) icon slot. */
  minusIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Reverse gradient stops icon slot. */
  reverseIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Back navigation icon slot. */
  backIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface ColorGradientEditorProps
  extends VariantProps<typeof colorGradientEditorStyles>,
    UseCustomSwatchesOptions {
  /** Controlled gradient configuration. */
  config?: GradientConfig
  /** Callback fired when gradient configuration changes. */
  onChange?: (config: GradientConfig) => void
  /** Currently active selected stop ID. */
  activeStopId?: string
  /** Callback fired when active stop selection changes. */
  onActiveStopChange?: (stopId: string) => void
  /** Callback fired to start creating a new preset in an external full-picker container view. */
  onStartAddPreset?: (options?: { initialType?: 'solid' | 'gradient'; currentColor?: string; currentGradient?: GradientConfig }) => void
  /** Whether to show the bottom presets row (default: true). */
  showPresetsRow?: boolean
  /** Custom CSS classes. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<ColorGradientEditorSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ColorGradientEditorSlots>
}

const DEFAULT_GRADIENT_CONFIG: GradientConfig = {
  type: 'radial',
  angle: 135,
  stops: [
    { id: '1', color: '#7F56D9', position: 0 },
    { id: '2', color: '#432E73', position: 100 },
  ],
}

const GRADIENT_TYPES: { label: string; value: GradientType }[] = [
  { label: 'Radial', value: 'radial' },
  { label: 'Linear', value: 'linear' },
  { label: 'Angular', value: 'angular' },
  { label: 'Diamond', value: 'diamond' },
]

const ColorGradientEditorPrimitive = ({
  config: controlledConfig,
  onChange,
  activeStopId: controlledActiveStopId,
  onActiveStopChange,
  onStartAddPreset,
  showPresetsRow = true,
  customSwatches: controlledCustomSwatches,
  defaultCustomSwatches,
  onCustomSwatchesChange,
  onAddCustomSwatch,
  onRemoveCustomSwatch,
  storageKey,
  className,
  slots = {},
  slotProps = {},
}: ColorGradientEditorProps) => {
  const [isAddingPreset, setIsAddingPreset] = useState(false)
  const [isViewingPresets, setIsViewingPresets] = useState(false)
  const [internalConfig, setInternalConfig] = useState<GradientConfig>(DEFAULT_GRADIENT_CONFIG)
  const config = controlledConfig ?? internalConfig

  const [internalActiveStopId, setInternalActiveStopId] = useState<string>(() => config.stops[0]?.id || '1')
  const activeStopId = controlledActiveStopId ?? internalActiveStopId

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

  const canvasRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [draggingTarget, setDraggingTarget] = useState<
    | { type: 'track'; stopId: string }
    | { type: 'canvas-stop'; stopId: string; isEndpoint?: 'start' | 'end' }
    | null
  >(null)

  const updateConfig = useCallback(
    (newConfig: GradientConfig) => {
      setInternalConfig(newConfig)
      onChange?.(newConfig)
    },
    [onChange]
  )

  const handleTypeChange = (type: GradientType) => {
    updateConfig({ ...config, type })
  }

  const handleSelectStop = (id: string) => {
    setInternalActiveStopId(id)
    onActiveStopChange?.(id)
  }

  // --- Geometry Synchronization ---
  // Compute vector start and end coordinates extending to the bounding edges of the canvas
  const { startCoords, endCoords } = useMemo(() => {
    const angle = config.angle ?? 135
    const rad = ((angle - 90) * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    const absCos = Math.abs(cos)
    const absSin = Math.abs(sin)
    let scale = 50
    if (absCos > 0.0001 && absSin > 0.0001) {
      scale = Math.min(50 / absCos, 50 / absSin)
    } else if (absCos > 0.0001) {
      scale = 50 / absCos
    } else if (absSin > 0.0001) {
      scale = 50 / absSin
    }

    return {
      startCoords: {
        x: clampColorValue(Math.round(50 - scale * cos), 0, 100),
        y: clampColorValue(Math.round(50 - scale * sin), 0, 100),
      },
      endCoords: {
        x: clampColorValue(Math.round(50 + scale * cos), 0, 100),
        y: clampColorValue(Math.round(50 + scale * sin), 0, 100),
      },
    }
  }, [config.angle])

  // Get coordinates for each individual stop along the vector line
  const stopCanvasPositions = useMemo(() => {
    const dx = endCoords.x - startCoords.x
    const dy = endCoords.y - startCoords.y
    return config.stops.map((stop) => ({
      id: stop.id,
      color: stop.color,
      position: stop.position,
      x: clampColorValue(startCoords.x + (stop.position / 100) * dx, 0, 100),
      y: clampColorValue(startCoords.y + (stop.position / 100) * dy, 0, 100),
    }))
  }, [config.stops, startCoords, endCoords])

  const handleAddStop = () => {
    const sorted = [...config.stops].sort((a, b) => a.position - b.position)
    let newPos = 50
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    if (first && last && sorted.length >= 2) {
      newPos = Math.round((first.position + last.position) / 2)
    }
    const interpolatedColor = getColorAtPosition(config.stops, newPos)
    const newId = `stop_${Date.now()}`
    const newStop: GradientStop = {
      id: newId,
      color: interpolatedColor,
      position: newPos,
    }
    const updatedStops = [...config.stops, newStop].sort((a, b) => a.position - b.position)
    updateConfig({ ...config, stops: updatedStops })
    handleSelectStop(newId)
  }

  const handleDeleteStop = (id: string) => {
    if (config.stops.length <= 2) return
    const updatedStops = config.stops.filter((s) => s.id !== id)
    updateConfig({ ...config, stops: updatedStops })
    if (activeStopId === id && updatedStops[0]) {
      handleSelectStop(updatedStops[0].id)
    }
  }

  const handleFlipStops = () => {
    const flipped = config.stops
      .map((s) => ({
        ...s,
        position: 100 - s.position,
      }))
      .sort((a, b) => a.position - b.position)

    updateConfig({
      ...config,
      angle: (config.angle + 180) % 360,
      stops: flipped,
    })
  }

  const handleUpdateStopColor = (id: string, color: string) => {
    let targetId = id
    if (!config.stops.some((s) => s.id === targetId)) {
      targetId = config.stops[0]?.id || '1'
    }
    const updated = config.stops.map((s) => (s.id === targetId ? { ...s, color } : s))
    updateConfig({ ...config, stops: updated })
  }

  const handleUpdateStopPosition = (id: string, pos: number) => {
    const clamped = clampColorValue(pos, 0, 100)
    const updated = config.stops.map((s) => (s.id === id ? { ...s, position: clamped } : s))
    updateConfig({ ...config, stops: updated })
  }

  // --- Track Mouse Down (Click to add or select stop) ---
  const handleTrackMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const position = clampColorValue((clickX / rect.width) * 100, 0, 100)

    const nearestStop = config.stops.find((s) => Math.abs(s.position - position) < 8)
    if (nearestStop) {
      handleSelectStop(nearestStop.id)
      setDraggingTarget({ type: 'track', stopId: nearestStop.id })
    } else {
      const interpolatedColor = getColorAtPosition(config.stops, position)
      const newId = `stop_${Date.now()}`
      const newStop: GradientStop = {
        id: newId,
        color: interpolatedColor,
        position: Math.round(position),
      }
      const updatedStops = [...config.stops, newStop].sort((a, b) => a.position - b.position)
      updateConfig({ ...config, stops: updatedStops })
      handleSelectStop(newId)
      setDraggingTarget({ type: 'track', stopId: newId })
    }
  }

  // Global mouse move & mouse up for track dragging, canvas stop dragging, and canvas vector rotation
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!draggingTarget) return

      // 1. Dragging stop on horizontal track
      if (draggingTarget.type === 'track' && trackRef.current) {
        const rect = trackRef.current.getBoundingClientRect()
        const moveX = e.clientX - rect.left
        const newPos = clampColorValue(Math.round((moveX / rect.width) * 100), 0, 100)
        const updated = config.stops.map((s) =>
          s.id === draggingTarget.stopId ? { ...s, position: newPos } : s
        )
        updateConfig({ ...config, stops: updated })
      }

      // 2. Dragging a stop handle on the canvas (endpoints rotate/adjust vector; intermediate slides along line)
      if (draggingTarget.type === 'canvas-stop' && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        const mouseX = clampColorValue(((e.clientX - rect.left) / rect.width) * 100, 0, 100)
        const mouseY = clampColorValue(((e.clientY - rect.top) / rect.height) * 100, 0, 100)

        if (draggingTarget.isEndpoint) {
          const centerX = 50
          const centerY = 50
          const deltaX = draggingTarget.isEndpoint === 'end' ? mouseX - centerX : centerX - mouseX
          const deltaY = draggingTarget.isEndpoint === 'end' ? mouseY - centerY : centerY - mouseY

          const rad = Math.atan2(deltaY, deltaX)
          const newAngle = Math.round(((rad * 180) / Math.PI + 90 + 360) % 360)

          // Project mouse coordinate onto the new vector line to update stop position
          const radNew = ((newAngle - 90) * Math.PI) / 180
          const cos = Math.cos(radNew)
          const sin = Math.sin(radNew)
          const absCos = Math.abs(cos)
          const absSin = Math.abs(sin)
          let scale = 50
          if (absCos > 0.0001 && absSin > 0.0001) {
            scale = Math.min(50 / absCos, 50 / absSin)
          } else if (absCos > 0.0001) {
            scale = 50 / absCos
          } else if (absSin > 0.0001) {
            scale = 50 / absSin
          }
          const sX = 50 - scale * cos
          const sY = 50 - scale * sin
          const eX = 50 + scale * cos
          const eY = 50 + scale * sin
          const dx = eX - sX
          const dy = eY - sY
          const lenSq = dx * dx + dy * dy
          let newPos = draggingTarget.isEndpoint === 'end' ? 100 : 0
          if (lenSq > 0) {
            const t = ((mouseX - sX) * dx + (mouseY - sY) * dy) / lenSq
            newPos = clampColorValue(Math.round(t * 100), 0, 100)
          }

          const updated = config.stops.map((s) =>
            s.id === draggingTarget.stopId ? { ...s, position: newPos } : s
          )
          updateConfig({ ...config, angle: newAngle, stops: updated })
        } else {
          // Intermediate stop: slide along vector line segment
          const dx = endCoords.x - startCoords.x
          const dy = endCoords.y - startCoords.y
          const lenSq = dx * dx + dy * dy
          if (lenSq > 0) {
            const t = ((mouseX - startCoords.x) * dx + (mouseY - startCoords.y) * dy) / lenSq
            const newPos = clampColorValue(Math.round(t * 100), 0, 100)
            const updated = config.stops.map((s) =>
              s.id === draggingTarget.stopId ? { ...s, position: newPos } : s
            )
            updateConfig({ ...config, stops: updated })
          }
        }
      }
    }

    const onMouseUp = () => {
      setDraggingTarget(null)
    }

    if (draggingTarget) {
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
      return () => {
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
      }
    }
  }, [draggingTarget, config, startCoords, endCoords, updateConfig])

  if (isAddingPreset) {
    return (
      <div data-slot="color-gradient-editor" className={cn(colorGradientEditorStyles(), className, 'p-1 overflow-x-hidden')}>
        {renderSlot(
          slots.createPresetForm,
          {
            title: 'New Gradient Preset',
            initialType: 'gradient',
            currentGradient: config,
            onBack: () => setIsAddingPreset(false),
            onCancel: () => setIsAddingPreset(false),
            onSave: (payload: string) => {
              addSwatch(payload)
              const parsed = parseCustomSwatchItem(payload)
              if (parsed.isGradient) {
                const grad = parseCssGradient(parsed.value)
                if (grad) updateConfig(grad)
              } else {
                handleUpdateStopColor(activeStopId, parsed.value)
              }
              setIsAddingPreset(false)
            },
            ...slotProps.createPresetForm,
          },
          { defaultComponent: CreatePresetForm }
        )}
      </div>
    )
  }

  if (isViewingPresets) {
    return (
      <div data-slot="color-gradient-editor" className={cn(colorGradientEditorStyles(), className, 'p-1 overflow-x-hidden')}>
        <div className="flex items-center justify-between gap-2 pb-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsViewingPresets(false)}
            className="flex items-center gap-1 text-xs font-medium text-muted-fg hover:text-fg transition-colors cursor-pointer bg-transparent outline-none"
          >
            {renderSlot(
              slots.backIcon,
              { className: 'size-3.5', ...slotProps.backIcon },
              { defaultComponent: ArrowLeftIcon }
            )}
            <span>Back to Gradient</span>
          </button>
          <span className="text-xs font-semibold text-fg">Presets</span>
          <div className="size-4" />
        </div>
        {renderSlot(
          slots.presets,
          {
            customSwatches: customList,
            onAddCustomSwatch: addSwatch,
            onRemoveCustomSwatch: removeSwatch,
            currentGradient: config,
            initialPresetType: 'gradient',
            onStartAdd: (opts) => {
              if (onStartAddPreset) {
                onStartAddPreset(opts || { initialType: 'gradient', currentGradient: config })
              } else {
                setIsAddingPreset(true)
              }
            },
            onSelect: (item: string) => {
              const parsed = parseCustomSwatchItem(item)
              if (parsed.isGradient) {
                const grad = parseCssGradient(parsed.value)
                if (grad) {
                  updateConfig(grad)
                  setIsViewingPresets(false)
                }
              } else {
                handleUpdateStopColor(activeStopId, parsed.value)
                setIsViewingPresets(false)
              }
            },
            ...slotProps.presets,
          },
          { defaultComponent: PresetsContainer }
        )}
      </div>
    )
  }

  return (
    <div data-slot="color-gradient-editor" className={cn(colorGradientEditorStyles(), className)}>
      {/* 1. Main Gradient Canvas with Vector Line & Synchronized Stop Handles (No extra circles) */}
      <div
        ref={canvasRef}
        className="relative w-full h-34 rounded-xl overflow-hidden border border-border/80 shadow-inner select-none bg-secondary/30"
      >
        <div
          className="size-full"
          style={{
            backgroundImage: gradientToCss(config),
          }}
        />

        {/* Vector Dashed Guide Line Overlay */}
        <svg className="absolute inset-0 size-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <line
            x1={`${startCoords.x}%`}
            y1={`${startCoords.y}%`}
            x2={`${endCoords.x}%`}
            y2={`${endCoords.y}%`}
            stroke="rgba(255, 255, 255, 0.75)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
        </svg>

        {/* Synchronized Stop Handles Along The Vector Line (Endpoints rotate & change length/rotation) */}
        {stopCanvasPositions.map((stop) => {
          const isSelected = stop.id === activeStopId
          const sorted = [...config.stops].sort((a, b) => a.position - b.position)
          const isStartEndpoint = stop.id === sorted[0]?.id
          const isEndEndpoint = stop.id === sorted[sorted.length - 1]?.id
          const isEndpoint = isEndEndpoint ? 'end' : isStartEndpoint ? 'start' : undefined

          return (
            <div
              key={stop.id}
              onMouseDown={(e) => {
                e.stopPropagation()
                handleSelectStop(stop.id)
                setDraggingTarget({ type: 'canvas-stop', stopId: stop.id, isEndpoint })
              }}
              title={`Stop ${Math.round(stop.position)}%${isEndpoint ? ' (Drag to rotate & adjust vector)' : ''}`}
              className={cn(
                'absolute -translate-x-1/2 -translate-y-1/2 size-4.5 rounded-full border-2 border-white shadow-md cursor-grab active:cursor-grabbing transition-transform',
                isSelected
                  ? 'ring-2 ring-primary ring-offset-1 ring-offset-black scale-115 z-20'
                  : 'hover:scale-115 z-10'
              )}
              style={{
                left: `${stop.x}%`,
                top: `${stop.y}%`,
                backgroundColor: stop.color,
              }}
            />
          )
        })}
      </div>

      {/* 2. Text-Based Header Controls Row (Type Selector, Angle, Presets & Flip) */}
      <div className="flex items-center justify-between w-full pt-0.5">
        {/* Gradient Type Dropdown (Clean text with chevron) */}
        <div className="relative flex items-center">
          <select
            value={config.type}
            onChange={(e) => handleTypeChange(e.target.value as GradientType)}
            aria-label="Gradient type"
            className="text-xs font-semibold text-fg hover:text-primary bg-transparent cursor-pointer outline-none border-none pr-4 appearance-none transition-colors"
          >
            {GRADIENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 size-3.5 text-muted-fg" />
        </div>

        {/* Right Actions: Angle, Presets Link, Flip Icon */}
        <div className="flex items-center gap-3">
          {/* Angle degree input */}
          {(config.type === 'linear' || config.type === 'angular') && (
            <div className="flex items-center text-xs font-mono text-muted-fg hover:text-fg transition-colors">
              <input
                type="text"
                value={`${config.angle}°`}
                onChange={(e) => {
                  const num = parseInt(e.target.value.replace(/\D/g, ''), 10)
                  if (!isNaN(num)) {
                    updateConfig({ ...config, angle: num % 360 })
                  }
                }}
                className="w-9 text-right text-xs font-mono text-muted-fg hover:text-fg focus:text-fg bg-transparent outline-none cursor-text"
              />
            </div>
          )}

          {/* Swap / Flip Direction Icon */}
          <button
            type="button"
            onClick={handleFlipStops}
            aria-label="Swap gradient directions"
            title="Swap gradient directions"
            className="text-muted-fg hover:text-fg transition-colors cursor-pointer bg-transparent p-0.5"
          >
            {renderSlot(
              slots?.reverseIcon,
              { className: 'size-3.5', ...slotProps?.reverseIcon },
              { defaultComponent: ArrowsRightLeftIcon }
            )}
          </button>
        </div>
      </div>

      {/* 3. Interactive Horizontal Gradient Bar / Slider */}
      <div className="relative w-full py-1 px-2">
        <div
          ref={trackRef}
          onMouseDown={handleTrackMouseDown}
          className="relative h-3 w-full rounded-full cursor-pointer select-none overflow-visible shadow-2xs border border-black/15 dark:border-white/15"
          style={{
            backgroundImage: gradientToCss({ ...config, type: 'linear', angle: 90 }),
          }}
        >
          {config.stops.map((stop) => {
            const isSelected = stop.id === activeStopId
            return (
              <div
                key={stop.id}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  handleSelectStop(stop.id)
                  setDraggingTarget({ type: 'track', stopId: stop.id })
                }}
                className={cn(
                  'absolute top-1/2 -translate-x-1/2 -translate-y-1/2 size-4.5 rounded-full cursor-grab active:cursor-grabbing transition-transform',
                  'border-2 border-white shadow-md',
                  isSelected ? 'ring-2 ring-primary scale-115 z-20' : 'hover:scale-110 z-10'
                )}
                style={{
                  left: `${stop.position}%`,
                  backgroundColor: stop.color,
                }}
              />
            )
          })}
        </div>
      </div>

      {/* 4. "Stops" Header & Add Button */}
      <div className="flex items-center justify-between w-full pt-0.5">
        <span className="text-xs font-semibold text-fg">Stops ({config.stops.length})</span>
        <button
          type="button"
          onClick={handleAddStop}
          className="flex items-center gap-1 text-xs font-semibold text-fg hover:text-primary transition-colors cursor-pointer bg-transparent"
        >
          <PlusIcon className="size-3.5" />
          <span>Add</span>
        </button>
      </div>

      {/* 5. Stop Rows List */}
      <div className="flex flex-col gap-1.5 w-full">
        {config.stops.map((stop) => {
          const isSelected = stop.id === activeStopId
          const rgba = extractRgba(stop.color)
          const hexValue = rgbToHex(rgba.r, rgba.g, rgba.b).toUpperCase()
          const alphaPercent = Math.round(rgba.a * 100)

          return (
            <div key={stop.id} className="flex items-center gap-1.5 w-full">
              {/* Position % Box */}
              <input
                type="text"
                defaultValue={`${Math.round(stop.position)}%`}
                key={`pos_${stop.id}_${Math.round(stop.position)}`}
                onBlur={(e) => {
                  const num = parseInt(e.target.value.replace(/\D/g, ''), 10)
                  if (!isNaN(num)) {
                    handleUpdateStopPosition(stop.id, num)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const num = parseInt((e.target as HTMLInputElement).value.replace(/\D/g, ''), 10)
                    if (!isNaN(num)) {
                      handleUpdateStopPosition(stop.id, num)
                    }
                    ;(e.target as HTMLInputElement).blur()
                  }
                }}
                onFocus={() => handleSelectStop(stop.id)}
                aria-label="Stop position percentage"
                className={cn(
                  'w-12 h-7.5 px-1 rounded-lg border font-mono text-xs text-center bg-bg text-fg outline-none transition-all',
                  isSelected ? 'border-primary ring-1 ring-primary/40' : 'border-border/80 hover:border-border'
                )}
              />

              {/* Color Swatch + Hex Input + Opacity Input Unified Pill */}
              <div
                onClick={() => handleSelectStop(stop.id)}
                className={cn(
                  'flex-1 h-7.5 px-2 rounded-lg border bg-bg flex items-center gap-1.5 transition-all min-w-0',
                  isSelected ? 'border-primary ring-1 ring-primary/40' : 'border-border/80 hover:border-border'
                )}
              >
                {/* Solid Color Picker Trigger Swatch (Opens Popover with ColorArea, Sliders, Format Inputs & Presets) */}
                <StopSolidColorPicker
                  color={stop.color}
                  onChange={(newColor) => handleUpdateStopColor(stop.id, newColor)}
                  onSelect={() => handleSelectStop(stop.id)}
                  slots={slots}
                  slotProps={slotProps}
                />

                {/* Hex Code Input */}
                <input
                  type="text"
                  defaultValue={hexValue}
                  key={`hex_${stop.id}_${hexValue}`}
                  onBlur={(e) => {
                    const val = e.target.value.trim()
                    const clean = val.startsWith('#') ? val : `#${val}`
                    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(clean)) {
                      const parsed = hexToRgba(clean)
                      handleUpdateStopColor(stop.id, rgbToHex(parsed.r, parsed.g, parsed.b, rgba.a))
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value.trim()
                      const clean = val.startsWith('#') ? val : `#${val}`
                      if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(clean)) {
                        const parsed = hexToRgba(clean)
                        handleUpdateStopColor(stop.id, rgbToHex(parsed.r, parsed.g, parsed.b, rgba.a))
                      }
                      ;(e.target as HTMLInputElement).blur()
                    }
                  }}
                  onFocus={() => handleSelectStop(stop.id)}
                  aria-label="Hex color"
                  className="font-mono text-xs uppercase flex-1 min-w-0 bg-transparent text-fg outline-none"
                />

                {/* Opacity % Input */}
                <input
                  type="text"
                  defaultValue={`${alphaPercent}%`}
                  key={`alpha_${stop.id}_${alphaPercent}`}
                  onBlur={(e) => {
                    const num = parseInt(e.target.value.replace(/\D/g, ''), 10)
                    if (!isNaN(num)) {
                      const clamped = clampColorValue(num, 0, 100)
                      handleUpdateStopColor(stop.id, rgbToHex(rgba.r, rgba.g, rgba.b, clamped / 100))
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const num = parseInt((e.target as HTMLInputElement).value.replace(/\D/g, ''), 10)
                      if (!isNaN(num)) {
                        const clamped = clampColorValue(num, 0, 100)
                        handleUpdateStopColor(stop.id, rgbToHex(rgba.r, rgba.g, rgba.b, clamped / 100))
                      }
                      ;(e.target as HTMLInputElement).blur()
                    }
                  }}
                  onFocus={() => handleSelectStop(stop.id)}
                  aria-label="Stop alpha percentage"
                  className="w-9 font-mono text-xs text-center bg-transparent text-fg outline-none shrink-0"
                />
              </div>

              {/* Remove Action Button (Minus) */}
              {config.stops.length > 2 ? (
                <button
                  type="button"
                  onClick={() => handleDeleteStop(stop.id)}
                  aria-label="Remove stop"
                  title="Remove stop"
                  className="size-7 flex items-center justify-center text-muted-fg hover:text-danger transition-colors shrink-0 cursor-pointer bg-transparent"
                >
                  {renderSlot(
                    slots.minusIcon,
                    { className: 'size-3.5', ...slotProps.minusIcon },
                    { defaultComponent: MinusIcon }
                  )}
                </button>
              ) : (
                <div className="size-7 shrink-0" />
              )}
            </div>
          )
        })}
      </div>

      {/* 6. User Added Presets Row (Only Added Ones, No Hardcoded Presets) */}
      {showPresetsRow && (
        <div className="flex flex-col gap-1.5 w-full pt-1">
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => setIsViewingPresets(true)}
              aria-label="Open Presets Browser"
              className="flex items-center gap-1 text-xs font-semibold text-fg hover:text-primary transition-colors cursor-pointer bg-transparent outline-none p-0 border-none shadow-none"
            >
              <span>Presets</span>
              <ChevronDownIcon className="size-3 text-muted-fg" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (onStartAddPreset) {
                  onStartAddPreset({ initialType: 'gradient', currentGradient: config })
                } else {
                  setIsAddingPreset(true)
                }
              }}
              aria-label="Create new preset"
              className="flex items-center gap-1 text-xs font-semibold text-fg hover:text-primary transition-colors cursor-pointer bg-transparent outline-none p-0 border-none shadow-none"
            >
              {renderSlot(
                slots.plusIcon,
                { className: 'size-3.5', ...slotProps.plusIcon },
                { defaultComponent: PlusIcon }
              )}
              <span>New</span>
            </button>
          </div>

          {/* Dynamic Row showing only user-added swatches */}
          {customList.length > 0 ? (
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none w-full min-w-0 overscroll-x-contain">
              {customList.map((item, idx) => {
                const parsed = parseCustomSwatchItem(item, idx)
                return (
                  <button
                    key={`custom_grad_${idx}`}
                    type="button"
                    onClick={() => {
                      if (parsed.isGradient) {
                        const grad = parseCssGradient(parsed.value)
                        if (grad) updateConfig(grad)
                      } else {
                        handleUpdateStopColor(activeStopId, parsed.value)
                      }
                    }}
                    title={`${parsed.name} (${parsed.value})`}
                    className="size-6 shrink-0 rounded-full border border-border/80 shadow-2xs hover:scale-110 active:scale-95 transition-all cursor-pointer outline-none relative"
                    style={{ background: parsed.value }}
                  />
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-fg italic py-0.5">No presets saved. Click &quot;New&quot; to save this gradient.</p>
          )}
        </div>
      )}
    </div>
  )
}

export const ColorGradientEditor: InterfaceComponent<ColorGradientEditorProps, ColorGradientEditorSlots> =
  createInterfaceComponent<ColorGradientEditorProps, ColorGradientEditorSlots>(
  {
    name: 'ColorGradientEditor',
    category: 'form',
    description: 'High-fidelity canvas gradient editor featuring interactive canvas vectors, draggable track stops, formatted stop rows, and direct color manipulation.',
    version: '1.0.0',
    props: {
      showPresetsRow: true,
    },
    slots: {
      presets: undefined,
      createPresetForm: undefined,
      area: ColorArea,
      slider: ColorSlider,
      alphaSlider: ColorSlider,
      formatInputs: ColorFormatInputs,
      plusIcon: PlusIcon,
      minusIcon: MinusIcon,
      reverseIcon: ArrowsRightLeftIcon,
      backIcon: ArrowLeftIcon,
    },
  },
  ColorGradientEditorPrimitive
)

// Namespace attachments for compound family ergonomics
ColorGradientEditor.Area = ColorArea
ColorGradientEditor.Slider = ColorSlider
ColorGradientEditor.FormatInputs = ColorFormatInputs

