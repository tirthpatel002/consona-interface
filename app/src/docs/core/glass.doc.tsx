import React, { useState, useMemo } from 'react'
import {
  Glass,
  type GlassMode,
  type SurfaceFunctionName,
  Color,
  ColorArea,
  ColorSlider,
  ColorField,
  EyeDropper,
  Popover,
  PopoverTrigger,
  Button,
  parseColor,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const WALLPAPERS = {
  'Abstract Flow':
    'https://images.unsplash.com/photo-1789660817213-260c3815de6f?q=80&w=2274&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'Warm Interior':
    'https://images.unsplash.com/photo-1615874959474-d609969a20ed?q=80&w=1760&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'Emerald Organic':
    'https://images.unsplash.com/photo-1731937817165-1fed94fc03b2?q=80&w=3132&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'Serene Horizon':
    'https://images.unsplash.com/photo-1780238461375-7019e513b56f?q=80&w=3132&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
}

type WallpaperKey = keyof typeof WALLPAPERS

export const glassDoc: ComponentDocSpec = {
  id: 'glass',
  name: 'Glass',
  subpath: '@consona/interface/glass',
  badge: 'Liquid Glass Surface',
  summary:
    "Real-time physics-based liquid glass surface with procedural Snell's law refraction profiles, squircle bezel geometry, specular reflection highlights, and dual-engine SVG / WebGL rendering pipelines.",
  subcomponents: ['Glass'],
  playground: {
    defaultHeight: 'tall',
    minHeight: 560,
    defaultProps: {
      wallpaper: 'Abstract Flow' as WallpaperKey,
      showContent: true,
      width: 340,
      height: 220,
      mode: 'svg' as GlassMode,
      borderRadius: 36,
      thickness: 70,
      bezelWidth: 50,
      refractiveIndex: 2.6,
      scaleRatio: 1.0,
      blur: 0.4,
      specularOpacity: 0.45,
      specularSaturation: 3,
      shadowBlur: 18,
      shadowSpread: -4,
      tintColor: '#ffffff',
      tintOpacity: 0.08,
      outerShadowBlur: 20,
      surfaceFunction: 'convex_squircle' as SurfaceFunctionName,
    },
    controls: [
      {
        name: 'showContent',
        label: 'Show Content',
        type: 'boolean',
        defaultValue: true,
        description: 'Toggle rendering child UI content inside the glass surface.',
      },
      {
        name: 'wallpaper',
        label: 'Backdrop Wallpaper',
        type: 'select',
        options: Object.keys(WALLPAPERS),
        defaultValue: 'Abstract Flow',
        description: 'Curated high-resolution optical backdrop texture.',
      },
      {
        name: 'width',
        label: 'Width',
        type: 'number',
        min: 160,
        max: 680,
        step: 10,
        defaultValue: 340,
        description: 'Width of the glass surface container in pixels.',
      },
      {
        name: 'height',
        label: 'Height',
        type: 'number',
        min: 80,
        max: 480,
        step: 10,
        defaultValue: 220,
        description: 'Height of the glass surface container in pixels.',
      },
      {
        name: 'mode',
        label: 'Engine Mode',
        type: 'select',
        options: ['svg', 'webgl'],
        defaultValue: 'svg',
        description: 'SVG feDisplacementMap (Chromium) vs WebGL Ray Refraction Shader (Universal).',
      },
      {
        name: 'thickness',
        label: 'Glass Thickness',
        type: 'number',
        min: 10,
        max: 200,
        step: 5,
        defaultValue: 70,
        description: 'Physical glass thickness determining light bending magnitude.',
      },
      {
        name: 'bezelWidth',
        label: 'Bezel Slope Width',
        type: 'number',
        min: 2,
        max: 60,
        step: 2,
        defaultValue: 50,
        description: 'Width of the curved outer edge bezel gradient in pixels.',
      },
      {
        name: 'refractiveIndex',
        label: 'Index of Refraction (IOR)',
        type: 'number',
        min: 1.0,
        max: 3.0,
        step: 0.05,
        defaultValue: 2.6,
        description: "Snell's law refraction index (1.0 = air, 1.5 = standard glass, 2.4+ = diamond liquid).",
      },
      {
        name: 'scaleRatio',
        label: 'Scale Ratio',
        type: 'number',
        min: 0.0,
        max: 2.0,
        step: 0.05,
        defaultValue: 1.0,
        description: 'Displacement magnitude scaling multiplier.',
      },
      {
        name: 'blur',
        label: 'Backdrop Blur',
        type: 'number',
        min: 0.0,
        max: 8.0,
        step: 0.2,
        defaultValue: 0.4,
        description: 'Gaussian blur radius applied to the backdrop before refraction.',
      },
      {
        name: 'specularOpacity',
        label: 'Specular Opacity',
        type: 'number',
        min: 0.0,
        max: 1.0,
        step: 0.05,
        defaultValue: 0.45,
        description: 'Opacity of directional specular rim reflections.',
      },
      {
        name: 'specularSaturation',
        label: 'Specular Saturation',
        type: 'number',
        min: 0,
        max: 10,
        step: 1,
        defaultValue: 3,
        description: 'Color saturation boost along refracted specular edges.',
      },
      {
        name: 'borderRadius',
        label: 'Border Radius',
        type: 'number',
        min: 4,
        max: 100,
        step: 2,
        defaultValue: 36,
        description: 'Corner squircle curvature in pixels.',
      },
      {
        name: 'tintColor',
        label: 'Tint Color',
        type: 'text',
        defaultValue: '#ffffff',
        description: 'Hex or RGB tint color applied to the inner surface.',
      },
      {
        name: 'tintOpacity',
        label: 'Tint Opacity',
        type: 'number',
        min: 0.0,
        max: 1.0,
        step: 0.01,
        defaultValue: 0.08,
        description: 'Inner surface glass tint opacity.',
      },
      {
        name: 'shadowBlur',
        label: 'Inner Shadow Blur',
        type: 'number',
        min: 0,
        max: 40,
        step: 2,
        defaultValue: 18,
        description: 'Inner rim bevel shadow blur radius.',
      },
    ],
    render: function GlassPlaygroundCanvas(props) {
      const [selectedBg, setSelectedBg] = useState<WallpaperKey | null>(null)
      const [customTint, setCustomTint] = useState<string | null>(null)

      const currentWallpaperKey = (selectedBg ?? props.wallpaper ?? 'Abstract Flow') as WallpaperKey
      const activeBgUrl = WALLPAPERS[currentWallpaperKey] ?? WALLPAPERS['Abstract Flow']
      const activeTintColor = customTint ?? props.tintColor ?? '#ffffff'

      const parsedColor = useMemo(() => {
        try {
          return parseColor(activeTintColor)
        } catch {
          return parseColor('#ffffff')
        }
      }, [activeTintColor])

      return (
        <div
          className="relative flex flex-col items-center justify-center p-space-8 w-full min-h-[560px] rounded-macro overflow-hidden border border-border/80 transition-all duration-300"
          style={{
            backgroundImage: `url('${activeBgUrl}')`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        >
          <div className="absolute inset-0 bg-black/15 pointer-events-none" />

          {/* Interactive HUD Toolbar */}
          <div className="absolute top-space-4 inset-x-space-4 z-20 flex items-center justify-between pointer-events-none">
            {/* ColorPicker for Tint Color */}
            <div className="pointer-events-auto">
              <PopoverTrigger>
                <Button
                  intent="secondary"
                  size="sm"
                  className="flex items-center gap-2 bg-black/40 hover:bg-black/60 backdrop-blur-md border-white/15 text-white shadow-sm font-normal"
                >
                  <div
                    className="size-3.5 rounded-full border border-white/40 shadow-xs"
                    style={{ backgroundColor: activeTintColor }}
                  />
                  <span className="text-xs">Tint:</span>
                  <span className="font-mono text-2xs uppercase text-white/80">{activeTintColor}</span>
                </Button>
                <Popover
                  aria-label="Tint Color"
                  className="p-3 w-56 rounded-macro bg-overlay/90 backdrop-blur-xl border border-border/40 shadow-xl"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-1 border-b border-border/30">
                      <span className="text-xs font-semibold text-fg">Tint Color</span>
                      <div className="flex items-center gap-1.5">
                        <div
                          className="size-3 rounded-full border border-border"
                          style={{ backgroundColor: activeTintColor }}
                        />
                        <span className="font-mono text-[11px] text-muted-fg uppercase">
                          {activeTintColor}
                        </span>
                      </div>
                    </div>

                    <Color
                      value={parsedColor}
                      onChange={(color) => {
                        setCustomTint(color.toString('hex'))
                      }}
                      className="w-full flex flex-col gap-2.5"
                    >
                      <ColorArea
                        colorSpace="hsb"
                        xChannel="saturation"
                        yChannel="brightness"
                        className="h-32 w-full rounded-base"
                      />
                      <ColorSlider channel="hue" colorSpace="hsb" className="w-full" />
                      <div className="flex items-center gap-2">
                        <ColorField className="flex-1" />
                        <EyeDropper size="sm" intent="outline" />
                      </div>
                    </Color>

                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/30">
                      {[
                        { label: 'White', hex: '#ffffff' },
                        { label: 'Onyx', hex: '#000000' },
                        { label: 'Blue', hex: '#3b82f6' },
                        { label: 'Emerald', hex: '#10b981' },
                        { label: 'Amber', hex: '#f59e0b' },
                        { label: 'Rose', hex: '#ec4899' },
                        { label: 'Violet', hex: '#8b5cf6' },
                      ].map(({ label, hex }) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setCustomTint(hex)}
                          className={`size-5 rounded-full border transition-transform hover:scale-110 ${
                            activeTintColor.toLowerCase() === hex.toLowerCase()
                              ? 'ring-2 ring-primary ring-offset-1 border-transparent'
                              : 'border-border/60'
                          }`}
                          style={{ backgroundColor: hex }}
                          title={label}
                        />
                      ))}
                    </div>
                  </div>
                </Popover>
              </PopoverTrigger>
            </div>

            {/* Direct 4 Wallpaper Switcher in Playground */}
            <div className="pointer-events-auto flex items-center gap-2 p-1.5 rounded-macro bg-black/40 backdrop-blur-md border border-white/15 shadow-sm">
              {(Object.keys(WALLPAPERS) as WallpaperKey[]).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedBg(name)}
                  className={`relative w-9 h-9 rounded-base overflow-hidden border transition-all ${
                    currentWallpaperKey === name
                      ? 'border-white ring-2 ring-white/40 scale-105'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  title={name}
                >
                  <img src={WALLPAPERS[name]} alt={name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Glass Surface */}
          <Glass
            mode={props.mode ?? 'svg'}
            borderRadius={props.borderRadius ?? 36}
            thickness={props.thickness ?? 70}
            bezelWidth={props.bezelWidth ?? 50}
            refractiveIndex={props.refractiveIndex ?? 2.6}
            scaleRatio={props.scaleRatio ?? 1.0}
            blur={props.blur ?? 0.4}
            specularOpacity={props.specularOpacity ?? 0.45}
            specularSaturation={props.specularSaturation ?? 3}
            shadowBlur={props.shadowBlur ?? 18}
            shadowSpread={props.shadowSpread ?? -4}
            tintColor={activeTintColor}
            tintOpacity={props.tintOpacity ?? 0.08}
            outerShadowBlur={props.outerShadowBlur ?? 20}
            surfaceFunction={props.surfaceFunction ?? 'convex_squircle'}
            backgroundUrl={activeBgUrl}
            style={{
              width: typeof props.width === 'number' ? `${props.width}px` : (props.width ?? '340px'),
              height: typeof props.height === 'number' ? `${props.height}px` : (props.height ?? '220px'),
            }}
          >
            {props.showContent !== false && (
              <div className="flex flex-col justify-between h-full p-space-5 text-white select-none">
                <div className="flex items-center justify-between text-[11px] font-medium tracking-wider uppercase text-white/80">
                  <span>Surface</span>
                  <span className="opacity-70 font-mono">{(props.mode ?? 'svg').toUpperCase()}</span>
                </div>

                <div>
                  <h4 className="text-sm font-medium tracking-tight text-white drop-shadow-sm">
                    Liquid Glass
                  </h4>
                  <p className="text-[12px] text-white/70 mt-0.5 leading-normal">
                    Refractive optical layer with Snell's law dispersion.
                  </p>
                </div>

                <div className="text-[11px] text-white/50 pt-2 border-t border-white/10 flex items-center justify-between font-mono">
                  <span>
                    {props.width ?? 340} × {props.height ?? 220}
                  </span>
                  <span>IOR: {props.refractiveIndex ?? 2.6}</span>
                </div>
              </div>
            )}
          </Glass>
        </div>
      )
    },
    code: `<Glass
  mode="svg"
  borderRadius={36}
  thickness={70}
  bezelWidth={50}
  refractiveIndex={2.6}
  blur={0.4}
  specularOpacity={0.45}
  tintOpacity={0.08}
  style={{ width: 340, height: 220 }}
>
  <div className="p-5 text-white">
    <h4 className="text-sm font-medium">Liquid Glass</h4>
    <p className="text-xs text-white/70 mt-1">Refractive optical surface</p>
  </div>
</Glass>`,
  },
  examples: [
    {
      title: 'Minimal Glass Surface',
      description: 'Wrap any custom element inside a clean, subtle Glass surface.',
      render: () => (
        <div
          className="p-8 rounded-macro overflow-hidden"
          style={{
            backgroundImage: `url('${WALLPAPERS['Abstract Flow']}')`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        >
          <Glass
            borderRadius={24}
            thickness={60}
            bezelWidth={40}
            refractiveIndex={2.5}
            backgroundUrl={WALLPAPERS['Abstract Flow']}
            style={{ width: 280, height: 160 }}
          >
            <div className="p-4 text-white">
              <h4 className="text-sm font-medium">Refractive Card</h4>
              <p className="text-xs text-white/70 mt-1">Lightweight optical surface.</p>
            </div>
          </Glass>
        </div>
      ),
    },
  ],
  recipes: [
    {
      title: 'Minimal Glass Surface in App Layout',
      description: 'Wrap any custom element inside a clean, subtle Glass surface.',
      code: `import { Glass } from '@consona/interface'

export function MinimalSurface() {
  return (
    <Glass
      borderRadius={24}
      thickness={60}
      bezelWidth={40}
      refractiveIndex={2.5}
      className="p-4 w-[280px]"
    >
      <div className="text-white">
        <h4 className="text-sm font-medium">Refractive Card</h4>
        <p className="text-xs text-white/70 mt-1">Lightweight optical surface.</p>
      </div>
    </Glass>
  )
}`,
    },
    {
      title: 'Downstream Branded Variant with .extend()',
      description: 'Create specialized glass surfaces with pre-configured optical tokens.',
      code: `import { Glass } from '@consona/interface'

export const SoftFrostedGlass = Glass.extend({
  name: 'SoftFrostedGlass',
  props: {
    borderRadius: 28,
    thickness: 50,
    bezelWidth: 40,
    blur: 2.5,
    tintOpacity: 0.12,
    specularOpacity: 0.4,
  },
})`,
    },
  ],
  a11yNotes: [
    'Glass surfaces isolate their rendering layer without interfering with inner text semantics or keyboard interactions.',
    'Text rendered inside Glass containers receives optical backdrop tinting to guarantee high contrast against photographic backdrops.',
  ],
}
