import React, { useState, useRef, useCallback, useEffect } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import {
  type ImageFillConfig,
  type ImageScaleMode,
  getImageFillFilter,
} from './color-utils'
import { Slider, SliderTrack, SliderThumb } from '../slider'
import {
  PhotoIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ArrowUpTrayIcon,
  CheckIcon,
} from '@heroicons/react/20/solid'

/* ==========================================================================
   ColorImageFill Styles
   ========================================================================== */

export const colorImageFillStyles = tv({
  base: 'flex flex-col gap-3 w-full select-none',
})

/* ==========================================================================
   ColorImageFill Slots & Props
   ========================================================================== */

export interface ColorImageAdjustmentSliderProps {
  label: string
  value: number
  min?: number
  max?: number
  defaultValue?: number
  onChange: (value: number) => void
}

export interface ColorImageFillSlots {
  /** Upload button icon slot */
  uploadIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Reset/Rotate button icon slot */
  rotateIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Empty state photo icon slot */
  photoIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Dropdown chevron icon slot */
  chevronIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Injected adjustment slider component slot */
  slider?: React.ComponentType<ColorImageAdjustmentSliderProps>
}

export interface ColorImageFillProps extends VariantProps<typeof colorImageFillStyles> {
  /** Controlled image fill configuration. */
  config?: ImageFillConfig
  /** Callback fired when image fill configuration changes. */
  onChange?: (config: ImageFillConfig) => void
  /** Custom CSS classes. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<ColorImageFillSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ColorImageFillSlots>
}

export const DEFAULT_IMAGE_CONFIG: ImageFillConfig = {
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

const SCALE_MODES: { label: string; value: ImageScaleMode }[] = [
  { label: 'Fill', value: 'fill' },
  { label: 'Fit', value: 'fit' },
  { label: 'Crop', value: 'crop' },
  { label: 'Tile', value: 'tile' },
]

/* ==========================================================================
   Precision Adjustment Slider using Interface's Slider Atom
   ========================================================================== */

const ColorImageAdjustmentSliderPrimitive = ({
  label,
  value,
  min = -100,
  max = 100,
  defaultValue = 0,
  onChange,
}: ColorImageAdjustmentSliderProps) => {
  return (
    <div className="grid grid-cols-[100px_1fr] items-center gap-3 py-0.5">
      <span className="text-xs font-semibold text-fg select-none truncate">
        {label}
      </span>

      <Slider
        aria-label={label}
        minValue={min}
        maxValue={max}
        value={value}
        onChange={(v) => onChange?.(typeof v === 'number' ? v : v[0])}
        onDoubleClick={() => onChange?.(defaultValue)}
        className="w-full"
      >
        <SliderTrack className="h-4 w-full rounded-full border border-border/80 bg-secondary/30 hover:border-border transition-colors grow">
          <SliderThumb
            aria-label={label}
            className="top-[50%] left-[50%] size-3.5 rounded-full bg-white dark:bg-card border border-black/15 dark:border-border/60 shadow-xs ring-0 ring-offset-0 transition-transform active:scale-95 hover:scale-105 focus-visible:scale-105"
          />
        </SliderTrack>
      </Slider>
    </div>
  )
}

export const ColorImageAdjustmentSlider = createInterfaceComponent<ColorImageAdjustmentSliderProps>(
  {
    name: 'ColorImageAdjustmentSlider',
    category: 'form',
    description: 'Adjustment slider row integrating Consona Slider into image fill picker.',
    version: '1.0.0',
  },
  ColorImageAdjustmentSliderPrimitive
)

/* ==========================================================================
   ColorImageFill Primitive
   ========================================================================== */

const ColorImageFillPrimitive = ({
  config: controlledConfig,
  onChange,
  className,
  slots = {},
  slotProps = {},
}: ColorImageFillProps) => {
  const [internalConfig, setInternalConfig] = useState<ImageFillConfig>(DEFAULT_IMAGE_CONFIG)
  const config = controlledConfig ?? internalConfig
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isHoveringImage, setIsHoveringImage] = useState(false)
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Drag-to-reposition tracking state
  const dragStartRef = useRef<{ clientX: number; clientY: number; posX: number; posY: number }>({
    clientX: 0,
    clientY: 0,
    posX: 50,
    posY: 50,
  })

  const updateConfig = (newConfig: ImageFillConfig) => {
    setInternalConfig(newConfig)
    onChange?.(newConfig)
  }

  // Handle outside click for mode dropdown menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (result) {
        updateConfig({
          ...config,
          url: result,
          fileName: file.name,
          positionX: 50,
          positionY: 50,
          zoom: 130,
        })
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRotate = () => {
    const currentRot = config.rotation ?? 0
    const nextRot = ((currentRot + 90) % 360) as 0 | 90 | 180 | 270
    updateConfig({ ...config, rotation: nextRot })
  }

  const handleSliderChange = (key: keyof ImageFillConfig, value: number) => {
    updateConfig({ ...config, [key]: value })
  }

  // Pointer panning handlers for image repositioning inside the cutout
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // If the click is on an interactive button or input, do not start panning
    if ((e.target as HTMLElement).closest('button, input, [role="button"]')) {
      return
    }
    if (!config.url) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsPanning(true)
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      posX: config.positionX ?? 50,
      posY: config.positionY ?? 50,
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning) return
    const rect = e.currentTarget.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    // Direct manipulation: dragging right moves image right, dragging down moves image down
    const deltaX = ((e.clientX - dragStartRef.current.clientX) / rect.width) * 100
    const deltaY = ((e.clientY - dragStartRef.current.clientY) / rect.height) * 100

    const nextX = Math.round(Math.min(100, Math.max(0, dragStartRef.current.posX + deltaX)))
    const nextY = Math.round(Math.min(100, Math.max(0, dragStartRef.current.posY + deltaY)))

    updateConfig({
      ...config,
      positionX: nextX,
      positionY: nextY,
    })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      setIsPanning(false)
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {}
    }
  }

  // Wheel zoom handling in crop mode
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (config.mode !== 'crop') return
    e.stopPropagation()
    const currentZoom = config.zoom ?? 130
    const delta = e.deltaY < 0 ? 10 : -10
    const nextZoom = Math.min(400, Math.max(50, currentZoom + delta))
    updateConfig({ ...config, zoom: nextZoom })
  }

  const posX = config.positionX ?? 50
  const posY = config.positionY ?? 50
  const rotation = config.rotation ?? 0
  const zoom = config.zoom ?? 130
  const filterStyle = getImageFillFilter(config)

  const currentModeLabel =
    SCALE_MODES.find((m) => m.value === (config.mode || 'fill'))?.label || 'Fill'

  return (
    <div data-slot="color-image-fill" className={cn(colorImageFillStyles(), className)}>
      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onClick={(e) => {
          ;(e.target as HTMLInputElement).value = ''
        }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileUpload(file)
        }}
        className="hidden"
      />

      {/* 1. Large Image Cutout Area with Drag Repositioning & Crop Zoom */}
      <div
        onMouseEnter={() => setIsHoveringImage(true)}
        onMouseLeave={() => setIsHoveringImage(false)}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDraggingFile(true)
        }}
        onDragLeave={() => setIsDraggingFile(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDraggingFile(false)
          const file = e.dataTransfer.files?.[0]
          if (file) handleFileUpload(file)
        }}
        onWheel={handleWheel}
        onDoubleClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) return
          fileInputRef.current?.click()
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={cn(
          'relative w-full aspect-[4/5] max-h-64 rounded-2xl border border-border/80 shadow-xs overflow-hidden select-none transition-all duration-150 flex items-center justify-center',
          'bg-[repeating-conic-gradient(#cbd5e1_0%_25%,#ffffff_0%_50%)] bg-[length:12px_12px]',
          isPanning ? 'cursor-grabbing ring-2 ring-primary/80' : 'cursor-grab',
          isDraggingFile && 'ring-2 ring-primary border-primary scale-[0.99]'
        )}
      >
        {config.url ? (
          <div
            className="absolute transition-transform duration-75 flex items-center justify-center pointer-events-none"
            style={{
              left: `${posX}%`,
              top: `${posY}%`,
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              width: config.mode === 'crop' ? `${zoom}%` : '100%',
              height: config.mode === 'crop' ? `${zoom}%` : '100%',
              minWidth: config.mode === 'fill' ? '100%' : undefined,
              minHeight: config.mode === 'fill' ? '100%' : undefined,
            }}
          >
            {config.mode === 'tile' ? (
              <div
                className="size-full"
                style={{
                  backgroundImage: `url(${config.url})`,
                  backgroundRepeat: 'repeat',
                  backgroundSize: 'auto',
                  filter: filterStyle,
                  opacity: (config.opacity ?? 100) / 100,
                }}
              />
            ) : (
              <img
                src={config.url}
                alt="Preview"
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit:
                    config.mode === 'fill'
                      ? 'cover'
                      : config.mode === 'fit'
                      ? 'contain'
                      : config.mode === 'crop'
                      ? 'cover'
                      : 'contain',
                  filter: filterStyle,
                  opacity: (config.opacity ?? 100) / 100,
                }}
                className="pointer-events-none select-none max-w-none"
              />
            )}
          </div>
        ) : (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-1.5 text-muted-fg p-4 text-center cursor-pointer hover:text-fg transition-colors"
          >
            {renderSlot(
              slots.photoIcon,
              { className: 'size-8 text-muted-fg', ...slotProps.photoIcon },
              { defaultComponent: PhotoIcon }
            )}
            <span className="text-xs font-semibold">Click to choose image</span>
            <span className="text-2xs text-muted-fg">or drag & drop file here</span>
          </button>
        )}

        {/* Photography Rule-of-Thirds Grid in Crop Mode */}
        {config.mode === 'crop' && (
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-25">
            <div className="border-r border-b border-white" />
            <div className="border-r border-b border-white" />
            <div className="border-b border-white" />
            <div className="border-r border-b border-white" />
            <div className="border-r border-b border-white" />
            <div className="border-b border-white" />
            <div className="border-r border-white" />
            <div className="border-r border-white" />
            <div />
          </div>
        )}

        {/* Reposition Coordinates Indicator on Panning */}
        {isPanning && (
          <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-md bg-black/75 backdrop-blur-md text-white text-[11px] font-mono tracking-tight shadow-md flex items-center gap-2 pointer-events-none z-30">
            <span>X: {posX}%</span>
            <span>•</span>
            <span>Y: {posY}%</span>
            {config.mode === 'crop' && (
              <>
                <span>•</span>
                <span>Zoom: {zoom}%</span>
              </>
            )}
          </div>
        )}

        {/* Crop Mode Zoom Controls Pill */}
        {config.mode === 'crop' && config.url && !isPanning && (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute bottom-2.5 left-2.5 px-1.5 py-1 rounded-md bg-black/75 backdrop-blur-md text-white shadow-md flex items-center gap-1 z-20"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                const nextZoom = Math.max(50, zoom - 15)
                updateConfig({ ...config, zoom: nextZoom })
              }}
              title="Zoom out"
              aria-label="Zoom out"
              className="size-5 flex items-center justify-center rounded hover:bg-white/20 active:scale-95 text-xs font-bold text-white/90 cursor-pointer"
            >
              −
            </button>
            <span
              onDoubleClick={(e) => {
                e.stopPropagation()
                updateConfig({ ...config, zoom: 100 })
              }}
              title="Double click to reset zoom (100%)"
              className="text-[11px] font-mono text-white/90 min-w-[38px] text-center select-none cursor-pointer"
            >
              {zoom}%
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                const nextZoom = Math.min(400, zoom + 15)
                updateConfig({ ...config, zoom: nextZoom })
              }}
              title="Zoom in"
              aria-label="Zoom in"
              className="size-5 flex items-center justify-center rounded hover:bg-white/20 active:scale-95 text-xs font-bold text-white/90 cursor-pointer"
            >
              +
            </button>
          </div>
        )}

        {/* Change Image Button */}
        {config.url && (isHoveringImage || true) && !isPanning && (
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation()
            }}
            onClick={(e) => {
              e.stopPropagation()
              fileInputRef.current?.click()
            }}
            aria-label="Change image"
            className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-md bg-black/75 hover:bg-black/90 active:scale-95 backdrop-blur-md text-white text-xs font-medium shadow-md transition-all flex items-center gap-1.5 cursor-pointer z-20"
          >
            {renderSlot(
              slots.uploadIcon,
              { className: 'size-3.5', ...slotProps.uploadIcon },
              { defaultComponent: ArrowUpTrayIcon }
            )}
            <span>Change</span>
          </button>
        )}
      </div>

      {/* 2. Header Row: Mode Select Dropdown (Left) & Rotate/Reset Icon (Right) */}
      <div className="flex items-center justify-between pt-0.5 px-0.5">
        {/* Dropdown for Fill / Fit / Crop / Tile */}
        <div ref={menuRef} className="relative inline-block text-left">
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            className="inline-flex items-center gap-1 text-xs font-semibold text-fg hover:text-primary transition-colors cursor-pointer py-1 select-none outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-xs"
          >
            <span>{currentModeLabel}</span>
            {renderSlot(
              slots.chevronIcon,
              { className: cn('size-3.5 text-muted-fg transition-transform', isMenuOpen && 'rotate-180'), ...slotProps.chevronIcon },
              { defaultComponent: ChevronDownIcon }
            )}
          </button>

          {isMenuOpen && (
            <div className="absolute left-0 top-full mt-1 w-32 rounded-xl bg-overlay/95 backdrop-blur-md border border-border/80 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              {SCALE_MODES.map((m) => {
                const isSelected = (config.mode || 'fill') === m.value
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => {
                      updateConfig({ ...config, mode: m.value })
                      setIsMenuOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-1.5 text-xs text-left cursor-pointer transition-colors',
                      isSelected
                        ? 'text-primary font-semibold bg-primary/10'
                        : 'text-fg hover:bg-secondary/40'
                    )}
                  >
                    <span>{m.label}</span>
                    {isSelected && <CheckIcon className="size-3.5 text-primary" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Rotate 90° / Reset Icon Button */}
        <button
          type="button"
          onClick={handleRotate}
          title={`Rotate 90° clockwise (${rotation}°)`}
          aria-label="Rotate image"
          className="size-6 flex items-center justify-center rounded-md text-muted-fg hover:text-fg hover:bg-secondary/40 active:scale-95 transition-all cursor-pointer"
        >
          {renderSlot(
            slots.rotateIcon,
            { className: 'size-4', ...slotProps.rotateIcon },
            { defaultComponent: ArrowPathIcon }
          )}
        </button>
      </div>

      {/* 3. Adjustment Sliders (Plus Zoom slider when in Crop mode) */}
      <div className="flex flex-col gap-1 w-full pt-1">
        {config.mode === 'crop' &&
          renderSlot(
            slots.slider,
            {
              label: 'Zoom',
              value: zoom,
              min: 50,
              max: 400,
              defaultValue: 100,
              onChange: (val: number) => handleSliderChange('zoom', val),
              ...slotProps.slider,
            },
            { defaultComponent: ColorImageAdjustmentSlider }
          )}

        {renderSlot(
          slots.slider,
          {
            label: 'Exposure',
            value: config.exposure ?? 0,
            onChange: (val: number) => handleSliderChange('exposure', val),
            ...slotProps.slider,
          },
          { defaultComponent: ColorImageAdjustmentSlider }
        )}

        {renderSlot(
          slots.slider,
          {
            label: 'Contrast',
            value: config.contrast ?? 0,
            onChange: (val: number) => handleSliderChange('contrast', val),
            ...slotProps.slider,
          },
          { defaultComponent: ColorImageAdjustmentSlider }
        )}

        {renderSlot(
          slots.slider,
          {
            label: 'Saturation',
            value: config.saturation ?? 0,
            onChange: (val: number) => handleSliderChange('saturation', val),
            ...slotProps.slider,
          },
          { defaultComponent: ColorImageAdjustmentSlider }
        )}

        {renderSlot(
          slots.slider,
          {
            label: 'Temperature',
            value: config.temperature ?? 0,
            onChange: (val: number) => handleSliderChange('temperature', val),
            ...slotProps.slider,
          },
          { defaultComponent: ColorImageAdjustmentSlider }
        )}

        {renderSlot(
          slots.slider,
          {
            label: 'Tint',
            value: config.tint ?? 0,
            onChange: (val: number) => handleSliderChange('tint', val),
            ...slotProps.slider,
          },
          { defaultComponent: ColorImageAdjustmentSlider }
        )}

        {renderSlot(
          slots.slider,
          {
            label: 'Highlights',
            value: config.highlights ?? 0,
            onChange: (val: number) => handleSliderChange('highlights', val),
            ...slotProps.slider,
          },
          { defaultComponent: ColorImageAdjustmentSlider }
        )}

        {renderSlot(
          slots.slider,
          {
            label: 'Shadows',
            value: config.shadows ?? 0,
            onChange: (val: number) => handleSliderChange('shadows', val),
            ...slotProps.slider,
          },
          { defaultComponent: ColorImageAdjustmentSlider }
        )}
      </div>
    </div>
  )
}

export const ColorImageFill = createInterfaceComponent<ColorImageFillProps, ColorImageFillSlots>(
  {
    name: 'ColorImageFill',
    category: 'form',
    description:
      'Professional-grade image fill creator supporting interactive drag repositioning, scale modes (Fill, Fit, Crop, Tile), 90-degree rotation, and 7 non-destructive image adjustments.',
    version: '1.0.0',
    props: {},
    slots: {
      uploadIcon: ArrowUpTrayIcon,
      rotateIcon: ArrowPathIcon,
      photoIcon: PhotoIcon,
      chevronIcon: ChevronDownIcon,
      slider: ColorImageAdjustmentSlider,
    },
  },
  ColorImageFillPrimitive
)
