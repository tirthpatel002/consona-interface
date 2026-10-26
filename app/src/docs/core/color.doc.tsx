import React, { useState } from 'react'
import {
  Color,
  ColorTrigger,
  ColorPicker,
  ColorFormatInputs,
  ColorGradientEditor,
  ColorImageFill,
  PresetsContainer,
  SOFT_COLOR_PRESETS,
  DARK_COLOR_PRESETS,
  ColorArea,
  ColorSlider,
  ColorSliderOutput,
  ColorSliderTrack,
  ColorWheel,
  ColorThumb,
  ColorSwatch,
  ColorSwatchPicker,
  ColorSwatchPickerItem,
  ColorField,
  EyeDropper,
  Input,
  Field,
  parseColor,
  type GradientConfig,
  type ImageFillConfig,
  gradientToCss,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const DEFAULT_COLOR = parseColor('#0b6bcb')

const PALETTE = [
  '#0a0a0a',
  '#0b6bcb',
  '#1f6b4a',
  '#c45c26',
  '#6366f1',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#8b5cf6',
]

export const colorDoc: ComponentDocSpec = {
  id: 'color',
  name: 'Color',
  component: Color,
  summary:
    'Professional-grade color suite supporting Solid fills, Linear/Radial/Angular/Diamond multi-stop gradients, Image fill with adjustments, multi-format color channel inputs (HEX, RGB, CSS, HSL, HSB), curated presets, and screen eyedropper.',
  subcomponents: [
    'Color',
    'ColorTrigger',
    'ColorPicker',
    'ColorFormatInputs',
    'ColorGradientEditor',
    'ColorImageFill',
    'PresetsContainer',
    'ColorArea',
    'ColorSlider',
    'ColorSliderOutput',
    'ColorSliderTrack',
    'ColorThumb',
    'ColorWheel',
    'ColorSwatch',
    'ColorSwatchPicker',
    'ColorSwatchPickerItem',
    'ColorField',
    'EyeDropper',
  ],
  playground: {
    defaultProps: {
      defaultFillType: 'solid',
      defaultTab: 'editor',
      size: 'md',
      shape: 'square',
      isDisabled: false,
    },
    controls: [
      {
        name: 'defaultFillType',
        label: 'Fill Mode',
        type: 'select',
        options: ['solid', 'gradient', 'image'],
        defaultValue: 'gradient',
      },
      {
        name: 'defaultTab',
        label: 'Solid Sub-Tab',
        type: 'select',
        options: ['editor', 'presets'],
        defaultValue: 'editor',
      },
      {
        name: 'size',
        label: 'Trigger Size',
        type: 'select',
        options: ['xs', 'sm', 'md', 'lg', 'xl'],
        defaultValue: 'md',
      },
      {
        name: 'shape',
        label: 'Trigger Shape',
        type: 'select',
        options: ['square', 'circle'],
        defaultValue: 'square',
      },
      {
        name: 'isDisabled',
        label: 'Disabled',
        type: 'boolean',
        defaultValue: false,
      },
    ],
    render: (props: any) => (
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 max-w-sm mx-auto w-full gap-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-xs font-medium text-muted-fg">Click to open Precision ColorPicker</span>
          <Color
            defaultValue="#3b82f6"
            defaultTab={props.defaultTab}
            size={props.size}
            shape={props.shape}
            isDisabled={props.isDisabled}
            popover={{
              defaultFillType: props.defaultFillType,
            }}
          />
        </div>
      </div>
    ),
  },
  examples: [
    {
      title: 'Advanced Fill Modes (Solid, Gradients, Image)',
      description:
        'Switch between Solid color, Linear/Radial/Angular/Diamond multi-stop Gradients, and Image Fill with live preview and filter adjustments.',
      render: () => {
        const [linearGrad, setLinearGrad] = useState<GradientConfig>({
          type: 'linear',
          angle: 135,
          stops: [
            { id: '1', color: '#ff6b6b', position: 0 },
            { id: '2', color: '#feca57', position: 100 },
          ],
        })

        const [angularGrad, setAngularGrad] = useState<GradientConfig>({
          type: 'angular',
          angle: 0,
          stops: [
            { id: '1', color: '#ff007f', position: 0 },
            { id: '2', color: '#7928ca', position: 50 },
            { id: '3', color: '#00dfd8', position: 100 },
          ],
        })

        return (
          <div className="flex flex-col gap-6 p-2 sm:p-4 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {/* Solid Fill */}
              <div className="flex flex-col gap-2 p-3.5 bg-secondary/20 rounded-base border border-border/60 min-w-0">
                <span className="text-xs font-semibold text-fg">Solid Fill</span>
                <span className="text-2xs text-muted-fg truncate">Area, sliders, format switcher (HEX/RGB/HSL/HSB/CSS)</span>
                <div className="flex items-center gap-3 mt-1 min-w-0">
                  <Color defaultValue="#6366f1" size="lg" popover={{ defaultFillType: 'solid' }} />
                  <span className="font-mono text-xs text-muted-fg uppercase truncate">#6366F1</span>
                </div>
              </div>

              {/* Linear Gradient */}
              <div className="flex flex-col gap-2 p-3.5 bg-secondary/20 rounded-base border border-border/60 min-w-0">
                <span className="text-xs font-semibold text-fg">Linear Gradient</span>
                <span className="text-2xs text-muted-fg truncate">Multi-stop track, angle degree, presets</span>
                <div className="flex items-center gap-3 mt-1 min-w-0">
                  <Color
                    defaultValue="#ff6b6b"
                    size="lg"
                    popover={{
                      defaultFillType: 'gradient',
                      defaultGradient: linearGrad,
                      onGradientChange: setLinearGrad,
                    }}
                  />
                  <div
                    className="h-8 flex-1 rounded-base border border-border/80 shadow-2xs min-w-0"
                    style={{ backgroundImage: gradientToCss(linearGrad) }}
                  />
                </div>
              </div>

              {/* Angular / Conic Gradient */}
              <div className="flex flex-col gap-2 p-3.5 bg-secondary/20 rounded-base border border-border/60 min-w-0 md:col-span-2 lg:col-span-1">
                <span className="text-xs font-semibold text-fg">Angular (Conic) Gradient</span>
                <span className="text-2xs text-muted-fg truncate">Rotational 360° stops with flip direction</span>
                <div className="flex items-center gap-3 mt-1 min-w-0">
                  <Color
                    defaultValue="#ff007f"
                    size="lg"
                    shape="circle"
                    popover={{
                      defaultFillType: 'gradient',
                      defaultGradient: angularGrad,
                      onGradientChange: setAngularGrad,
                    }}
                  />
                  <div
                    className="size-8 rounded-full border border-border/80 shadow-2xs shrink-0"
                    style={{ backgroundImage: gradientToCss(angularGrad) }}
                  />
                </div>
              </div>
            </div>
          </div>
        )
      },
    },
    {
      title: 'Dynamic Multi-Format Channel Inputs',
      description:
        'Bi-directional synchronization across HEX (#RRGGBB + Alpha), RGB (0-255 channels), HSL (° + % channels), HSB (° + % channels), and CSS strings with 1-click clipboard copy.',
      render: () => {
        const [activeColor, setActiveColor] = useState({ r: 59, g: 130, b: 246, a: 0.9 })

        return (
          <div className="flex flex-col gap-4 p-2 sm:p-4 max-w-md w-full min-w-0">
            <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-base border border-border/60 min-w-0">
              <div
                className="size-10 rounded-base border border-border/80 shadow-xs shrink-0"
                style={{ backgroundColor: `rgba(${activeColor.r}, ${activeColor.g}, ${activeColor.b}, ${activeColor.a})` }}
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-fg truncate">Active Color Channels</span>
                <span className="text-2xs font-mono text-muted-fg truncate">
                  rgba({activeColor.r}, {activeColor.g}, {activeColor.b}, {activeColor.a})
                </span>
              </div>
            </div>

            <div className="w-full min-w-0 overflow-x-auto">
              <ColorFormatInputs color={activeColor} onChange={setActiveColor} />
            </div>
          </div>
        )
      },
    },
    {
      title: 'Standalone Multi-Stop Gradient Creator',
      description:
        'Interactive gradient stop track. Click track to add stops, drag handles to adjust position, flip direction, change angles, or pick from curated gradient presets.',
      render: () => {
        const [gradient, setGradient] = useState<GradientConfig>({
          type: 'linear',
          angle: 90,
          stops: [
            { id: '1', color: '#f72585', position: 0 },
            { id: '2', color: '#7209b7', position: 50 },
            { id: '3', color: '#4cc9f0', position: 100 },
          ],
        })

        return (
          <div className="flex flex-col gap-4 p-2 sm:p-4 max-w-sm w-full min-w-0">
            <div
              className="h-20 w-full rounded-base border border-border/80 shadow-sm"
              style={{ backgroundImage: gradientToCss(gradient) }}
            />
            <ColorGradientEditor config={gradient} onChange={setGradient} />
          </div>
        )
      },
    },
    {
      title: 'Background Media & Surface Fill Selection',
      description:
        'Select, upload, and fine-tune background media fills for cards, banners, and canvas containers. Switch scale modes (Fill, Fit, Crop, Tile) and adjust Exposure, Contrast, Saturation, Warmth, and Opacity in real time.',
      render: () => {
        const [bgMedia, setBgMedia] = useState<ImageFillConfig>({
          url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
          mode: 'fill',
          opacity: 90,
          exposure: 0,
          contrast: 10,
          saturation: 15,
          temperature: 5,
          tint: 0,
          highlights: 0,
          shadows: 0,
          positionX: 50,
          positionY: 50,
          rotation: 0,
          fileName: 'portrait.jpg',
        })

        const filterStyle = [
          bgMedia.exposure ? `brightness(${100 + bgMedia.exposure}%)` : '',
          bgMedia.contrast ? `contrast(${100 + bgMedia.contrast}%)` : '',
          bgMedia.saturation ? `saturate(${100 + bgMedia.saturation}%)` : '',
          bgMedia.highlights ? `brightness(${100 + bgMedia.highlights * 0.25}%)` : '',
          bgMedia.shadows ? `contrast(${100 - bgMedia.shadows * 0.2}%)` : '',
          bgMedia.temperature && bgMedia.temperature > 0 ? `sepia(${bgMedia.temperature * 0.4}%)` : '',
          bgMedia.tint ? `hue-rotate(${bgMedia.tint * 1.8}deg)` : '',
        ]
          .filter(Boolean)
          .join(' ')

        const containerBgStyle: React.CSSProperties = {
          backgroundImage: bgMedia.url ? `url(${bgMedia.url})` : undefined,
          backgroundSize:
            bgMedia.mode === 'fill' ? 'cover' : bgMedia.mode === 'fit' ? 'contain' : bgMedia.mode === 'tile' ? 'auto' : '130%',
          backgroundRepeat: bgMedia.mode === 'tile' ? 'repeat' : 'no-repeat',
          backgroundPosition: `${bgMedia.positionX ?? 50}% ${bgMedia.positionY ?? 50}%`,
          transform: bgMedia.rotation ? `rotate(${bgMedia.rotation}deg)` : undefined,
          filter: filterStyle || undefined,
          opacity: (bgMedia.opacity ?? 100) / 100,
        }

        return (
          <div className="flex flex-col gap-5 p-2 sm:p-4 max-w-xl w-full min-w-0">
            {/* Responsive Control Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-secondary/30 rounded-base min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <Color
                  fillType="image"
                  defaultFillType="image"
                  defaultImageFill={bgMedia}
                  onImageFillChange={setBgMedia}
                  size="lg"
                  shape="square"
                  popover={{
                    defaultFillType: 'image',
                    defaultImageFill: bgMedia,
                    onImageFillChange: setBgMedia,
                  }}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-fg truncate">Background Media</span>
                  <span className="text-2xs text-muted-fg truncate">
                    {bgMedia.fileName || 'Custom Media'} • Mode: <span className="uppercase font-mono">{bgMedia.mode}</span> • Pos: {bgMedia.positionX ?? 50}%, {bgMedia.positionY ?? 50}%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-2xs font-mono text-muted-fg bg-bg/80 px-2.5 py-1 rounded-full border border-border/60 shrink-0 self-start sm:self-auto">
                <span>Exp {bgMedia.exposure ?? 0}</span>
                <span>•</span>
                <span>Sat {bgMedia.saturation ?? 0}</span>
                <span>•</span>
                <span>Pos ({bgMedia.positionX ?? 50}%, {bgMedia.positionY ?? 50}%)</span>
              </div>
            </div>

            {/* Live Container / Hero Card with Media Fill */}
            <div className="relative overflow-hidden rounded-xl border border-border/80 shadow-md min-h-80 sm:min-h-80 flex flex-col justify-end p-4 sm:p-6 select-none group w-full min-w-0">
              {/* Dynamic Background Media Layer */}
              <div
                className="absolute inset-0 transition-all duration-200 pointer-events-none"
                style={containerBgStyle}
              />

              {/* Contrast Scrim Overlay for Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

              {/* Card Foreground Content */}
              <div className="relative z-10 flex flex-col gap-2 max-w-md text-white">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-medium text-white/90 w-fit border border-white/20">
                  <span>✨ Dynamic Media Surface</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-white drop-shadow-sm">
                  Pro Studio Workspace
                </h3>
                <p className="text-xs text-white/80 leading-relaxed drop-shadow-xs">
                  Background media fill with interactive drag repositioning, 90° rotation, and non-destructive Exposure, Contrast, Saturation, Temperature, Tint, Highlights, and Shadows.
                </p>
              </div>
            </div>
          </div>
        )
      },
    },
    {
      title: 'Professional-Grade Image Fill with Repositioning',
      description:
        'Standalone ColorImageFill component. Drag the image inside the preview to reposition (pan offset), choose scale modes (Fill, Fit, Crop, Tile), rotate 90°, and fine-tune Exposure, Contrast, Saturation, Temperature, Tint, Highlights, and Shadows.',
      render: () => {
        const [imageConfig, setImageConfig] = useState<ImageFillConfig>({
          url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
          mode: 'fill',
          opacity: 100,
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
          fileName: 'portrait.jpg',
        })

        return (
          <div className="flex flex-col gap-4 p-2 sm:p-4 max-w-sm w-full min-w-0">
            <ColorImageFill config={imageConfig} onChange={setImageConfig} />
          </div>
        )
      },
    },
    {
      title: 'Trigger Box Scales & Geometry',
      description: 'Compact color trigger boxes across diverse size scales and circular/square geometry.',
      render: () => {
        return (
          <div className="flex flex-col gap-6 p-2 sm:p-4 w-full">
            <div className="flex flex-col gap-2 min-w-0">
              <span className="text-xs font-semibold text-fg">Soft Pastels (Square)</span>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size, idx) => {
                  const sampleHex = SOFT_COLOR_PRESETS[idx * 3]?.hex || '#d8e2dc'
                  return (
                    <div key={size} className="flex flex-col items-center gap-1.5">
                      <Color defaultValue={sampleHex} size={size} shape="square" />
                      <span className="text-2xs font-mono text-muted-fg uppercase">{size}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2 min-w-0">
              <span className="text-xs font-semibold text-fg">Moody Darks (Circle)</span>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size, idx) => {
                  const sampleHex = DARK_COLOR_PRESETS[idx * 4]?.hex || '#1e3a8a'
                  return (
                    <div key={size} className="flex flex-col items-center gap-1.5">
                      <Color defaultValue={sampleHex} size={size} shape="circle" />
                      <span className="text-2xs font-mono text-muted-fg uppercase">{size}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      title: 'Controlled State & Form Field Integration',
      description: 'Synchronized controlled color value with Field labels and real-time hexadecimal display.',
      render: () => {
        const [color, setColor] = useState('#d8e2dc')

        return (
          <div className="flex flex-col gap-4 p-2 sm:p-4 max-w-sm w-full min-w-0">
            <Field>
              <Field.Label>Theme Accent Token</Field.Label>
              <div className="flex items-center gap-3 min-w-0">
                <Color
                  value={color}
                  onChange={(c) => setColor(c ? c.toString('hex') : '#d8e2dc')}
                  size="md"
                />
                <span className="font-mono text-sm font-semibold uppercase text-fg truncate">{color}</span>
              </div>
              <Field.Description>Click the swatch to choose from curated soft & dark presets or use the editor.</Field.Description>
            </Field>
          </div>
        )
      },
    },
    {
      title: 'Custom PresetsContainer Composite Slotting',
      description: 'Downstream customization by injecting tailored brand palettes into the PresetsContainer slot.',
      render: () => {
        const customBrandSoft = [
          { name: 'Ethereal Mint', hex: '#d1fae5' },
          { name: 'Sky Silk', hex: '#e0f2fe' },
          { name: 'Blush Velvet', hex: '#fce7f3' },
          { name: 'Solar Mist', hex: '#fef3c7' },
        ]
        const customBrandDark = [
          { name: 'Abyssal Teal', hex: '#042f2e' },
          { name: 'Midnight Violet', hex: '#1e1b4b' },
          { name: 'Crimson Dusk', hex: '#4c0519' },
          { name: 'Charcoal Void', hex: '#0f172a' },
        ]

        return (
          <div className="flex flex-col gap-4 p-2 sm:p-4 max-w-sm w-full min-w-0">
            <Field>
              <Field.Label>Custom Brand Fleet</Field.Label>
              <div className="flex items-center gap-3 min-w-0">
                <Color
                  defaultValue="#d1fae5"
                  slotProps={{
                    presets: {
                      softColors: customBrandSoft,
                      darkColors: customBrandDark,
                      defaultTab: 'soft',
                    },
                  }}
                  size="md"
                />
                <span className="text-xs text-muted-fg truncate">Tailored 4-tone brand palettes</span>
              </div>
            </Field>
          </div>
        )
      },
    },
    {
      title: 'Palette Swatch Picker & Radial ColorWheel',
      description: 'ColorSwatchPicker with checkmark feedback and radial ColorWheel for standalone color picking.',
      render: () => {
        const [selectedColor, setSelectedColor] = useState('#0b6bcb')
        const [wheelColor, setWheelColor] = useState(() => parseColor('#3b82f6').toFormat('hsb'))

        return (
          <div className="flex flex-col sm:flex-row flex-wrap items-start gap-6 sm:gap-8 p-2 sm:p-4 w-full min-w-0">
            <div className="flex flex-col gap-4 min-w-0 max-w-full">
              <Field>
                <Field.Label>Brand Palette</Field.Label>
                <ColorSwatchPicker
                  value={selectedColor}
                  onChange={(c) => setSelectedColor(c.toString('hex'))}
                >
                  {PALETTE.map((hex) => (
                    <ColorSwatchPickerItem key={hex} color={hex} />
                  ))}
                </ColorSwatchPicker>
              </Field>
              <div className="flex items-center gap-2 min-w-0">
                <ColorSwatch color={selectedColor} className="size-6 shrink-0" />
                <span className="font-mono text-xs font-semibold text-fg uppercase truncate">{selectedColor}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 min-w-0">
              <Field.Label>Radial Hue Wheel</Field.Label>
              <ColorWheel value={wheelColor} onChange={setWheelColor} />
            </div>
          </div>
        )
      },
    },
  ],
}
