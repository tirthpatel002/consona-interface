import React, { useState } from 'react'
import {
  Loader,
  Button,
  type LoaderVariant,
  type LoaderSize,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

// ── Shared accent used everywhere in examples ─────────────────────────────────
const ACCENT = 'text-red-500'

const SVG_VARIANTS: { id: LoaderVariant; label: string; description: string }[] = [
  { id: 'spin',      label: 'Spin',       description: 'Classic 12-segment radial ray wheel' },
  { id: 'ring',      label: 'Ring',       description: 'Dual-tone circular track with spinning head' },
  { id: 'dash',      label: 'Dash',       description: 'Morphing stroke-dashoffset expanding arc' },
  { id: 'dots',      label: 'Dots',       description: '3-dot bouncing wave for AI thinking states' },
  { id: 'pulse',     label: 'Pulse',      description: 'Concentric expanding radar ripple ring' },
  { id: 'bars',      label: 'Bars',       description: 'Audio waveform jumping equalizer bars' },
  { id: 'grid',      label: 'Grid',       description: '3×3 pulsating micro-dot matrix' },
  { id: 'dual-ring', label: 'Dual Ring',  description: 'Counter-rotating concentric dual rings' },
  { id: 'gradient',  label: 'Gradient',   description: 'Smooth luminescent conical gradient trail' },
]

const CSS_VARIANTS: { id: LoaderVariant; label: string; description: string }[] = [
  { id: 'corner-blob', label: 'Corner Blob', description: '4 crisp dots chasing each other clockwise around the corners' },
  { id: 'spiral',      label: 'Spiral',      description: 'Single dot travels an L-shaped conic gradient track' },
  { id: 'diamond',     label: 'Diamond',     description: 'Conic diamond with expanding X-crosshair overlay' },
  { id: 'squares',     label: 'Squares',     description: '3 nested squares spinning at different cadences' },
]

const ALL_SIZES: { id: LoaderSize; label: string; px: string }[] = [
  { id: 'xs',  label: 'XS',  px: '12px' },
  { id: 'sm',  label: 'SM',  px: '14px' },
  { id: 'md',  label: 'MD',  px: '16px' },
  { id: 'lg',  label: 'LG',  px: '20px' },
  { id: 'xl',  label: 'XL',  px: '24px' },
  { id: '2xl', label: '2XL', px: '32px' },
  { id: '3xl', label: '3XL', px: '48px' },
]

// Card style shared by all variant grid tiles
const TILE = 'flex flex-col items-center justify-center p-4 rounded-macro border border-border/60 bg-card/60 hover:bg-card/90 hover:border-indigo-400/40 transition-all text-center gap-3'

export const loaderDoc: ComponentDocSpec = {
  id: 'loader',
  name: 'Loader',
  component: Loader,
  summary:
    'Accessible animated loading indicator featuring 13 motion variants — 9 SVG-based with currentColor theming and 4 CSS div-based with geometric animations. Includes optical sizing, semantic intent colors, and an ergonomic sub-component API.',
  subcomponents: [
    'Loader.Spin',
    'Loader.Ring',
    'Loader.Dash',
    'Loader.Dots',
    'Loader.Pulse',
    'Loader.Bars',
    'Loader.Grid',
    'Loader.DualRing',
    'Loader.Gradient',
    'Loader.CornerBlob',
    'Loader.Spiral',
    'Loader.Diamond',
    'Loader.Squares',
  ],
  playground: {
    defaultProps: { variant: 'gradient', size: 'xl' },
    controls: [
      {
        name: 'variant',
        type: 'select',
        options: [
          'spin', 'ring', 'dash', 'dots', 'pulse', 'bars', 'grid', 'dual-ring', 'gradient',
          'corner-blob', 'spiral', 'diamond', 'squares',
        ],
      },
      {
        name: 'size',
        type: 'select',
        options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'],
      },
    ],
    render: (props: any) => (
      <div className={`flex flex-col items-center justify-center p-8 gap-4 ${ACCENT}`}>
        <Loader {...props} />
        <span className="text-xs font-mono text-muted-fg">
          variant="{props.variant ?? 'gradient'}" · size="{props.size ?? 'xl'}"
        </span>
      </div>
    ),
  },
  examples: [
    {
      title: 'SVG Variants',
      description:
        'All 9 SVG-based variants inherit currentColor — drop any of these inside a colored parent and they adapt instantly.',
      render: () => (
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3">
          {SVG_VARIANTS.map((v) => (
            <div key={v.id} className={TILE}>
              <div className={`flex size-8 items-center justify-center ${ACCENT}`}>
                <Loader variant={v.id} size="lg" />
              </div>
              <span className="text-[10px] font-semibold text-fg leading-tight">{v.label}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'CSS & Geometric Variants',
      description:
        'Div-based variants using conic gradients, CSS transforms, and staggered timing — no SVG required.',
      render: () => (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {CSS_VARIANTS.map((v) => (
            <div key={v.id} className={TILE}>
              <div className={`flex size-10 items-center justify-center ${ACCENT}`}>
                <Loader variant={v.id} size="lg" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold text-fg">{v.label}</span>
                <span className="text-[9px] text-muted-fg line-clamp-2 leading-tight">{v.description}</span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Size Ramp & Optical Sizing',
      description: 'XS (12px) through 3XL (48px) — stroke widths and details narrow dynamically at smaller sizes to remain crisp and open.',
      render: () => (
        <div className={`flex flex-wrap items-end gap-6 p-5 rounded-macro border border-border/60 bg-card/40 ${ACCENT}`}>
          {ALL_SIZES.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-2">
              <Loader variant="gradient" size={s.id} />
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-semibold text-fg">{s.label}</span>
                <span className="text-[9px] font-mono text-muted-fg">{s.px}</span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Semantic Colors',
      description: 'SVG loaders inherit currentColor — pair any variant with any intent color class.',
      render: () => (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {[
            { label: 'Primary', color: 'text-primary',   variant: 'gradient'  as const },
            { label: 'Accent',  color: 'text-accent-fg', variant: 'ring'      as const },
            { label: 'Success', color: 'text-success',   variant: 'dash'      as const },
            { label: 'Warning', color: 'text-warning',   variant: 'pulse'     as const },
            { label: 'Danger',  color: 'text-danger',    variant: 'spin'      as const },
            { label: 'Info',    color: 'text-sky-500',   variant: 'dual-ring' as const },
            { label: 'Muted',   color: 'text-muted-fg',  variant: 'dots'      as const },
          ].map((item) => (
            <div key={item.label} className={TILE}>
              <div className={item.color}>
                <Loader variant={item.variant} size="xl" />
              </div>
              <span className="text-[10px] font-semibold text-fg">{item.label}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Button Loading States',
      description: 'Inline loaders inside buttons — click to trigger a 2s loading simulation.',
      render: () => {
        const [loadingId, setLoadingId] = useState<string | null>(null)
        const fire = (id: string) => { setLoadingId(id); setTimeout(() => setLoadingId(null), 2000) }
        return (
          <div className="flex flex-wrap items-center gap-3">
            <Button intent="primary" isDisabled={loadingId === 'save'} onPress={() => fire('save')} className="min-w-32">
              {loadingId === 'save'
                ? <><Loader variant="ring"     size="sm" className="mr-1.5" />Saving...</>
                : 'Save Changes'}
            </Button>
            <Button intent="secondary" isDisabled={loadingId === 'ai'} onPress={() => fire('ai')} className="min-w-36">
              {loadingId === 'ai'
                ? <><Loader variant="dots"     size="sm" className={`mr-1.5 ${ACCENT}`} />Generating...</>
                : 'Ask AI Assistant'}
            </Button>
            <Button intent="outline" isDisabled={loadingId === 'sync'} onPress={() => fire('sync')} className="min-w-32">
              {loadingId === 'sync'
                ? <><Loader variant="dual-ring" size="sm" className={`mr-1.5 ${ACCENT}`} />Syncing...</>
                : 'Sync Data'}
            </Button>
          </div>
        )
      },
    },
  ],
  recipes: [
    {
      title: 'Inline AI Thinking Indicator',
      description: 'Combine Dots loader with a pill container for conversational interfaces.',
      code: `export const AiThinking = () => (
  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-medium">
    <Loader.Dots size="sm" />
    <span>AI is analyzing your dataset...</span>
  </div>
)`,
    },
    {
      title: 'Hero Page Fullscreen Loader',
      description: 'Gradient loader for global app route transitions.',
      code: `export const PageLoader = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-bg/90 backdrop-blur-md">
    <Loader.Gradient size="3xl" className="text-indigo-500" />
    <p className="text-sm font-medium text-muted-fg animate-pulse">Loading Workspace...</p>
  </div>
)`,
    },
    {
      title: 'Corner Dot Ambient Loader',
      description: 'CornerBlob as a compact ambient loading indicator.',
      code: `export const AmbientLoader = () => (
  <div className="flex items-center justify-center size-12 rounded-lg border border-border/60 bg-card/60">
    <Loader.CornerBlob size="2xl" className="text-indigo-500" />
  </div>
)`,
    },
  ],
}

export default loaderDoc
