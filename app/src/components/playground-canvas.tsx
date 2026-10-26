import React, { useState, useEffect, memo } from 'react'
import { createPortal } from 'react-dom'
import {
  Laptop,
  Smartphone,
  Tablet,
  RotateCcw,
  Sliders,
  Play,
  Code,
  Maximize2,
  Minimize2,
  Columns,
  Rows,
  Sparkles,
  X,
} from 'lucide-react'
import type { PlaygroundConfig } from '../docs/types'
import { CodeModal } from './code-modal'
import { CodeViewer } from './code-viewer'
import { cn } from '@consona/interface'

export interface PlaygroundCanvasProps {
  config: PlaygroundConfig
  componentName: string
  component?: React.ComponentType<any>
}

interface PlaygroundRendererProps {
  config: PlaygroundConfig
  propsState: Record<string, any>
  component?: React.ComponentType<any>
  /** Remount custom render trees when the documented component changes. */
  renderKey?: string
}

/** Mounts playground `render` as a real component so its hooks are legal. */
const PlaygroundCustomRender = memo(function PlaygroundCustomRender({
  Render,
  propsState,
}: {
  Render: React.ComponentType<any>
  propsState: Record<string, any>
}) {
  return <Render {...propsState} />
})

const PlaygroundRenderer = memo<PlaygroundRendererProps>(({
  config,
  propsState,
  component: Component,
  renderKey,
}) => {
  if (config.render) {
    return (
      <PlaygroundCustomRender
        key={renderKey}
        Render={config.render as React.ComponentType<any>}
        propsState={propsState}
      />
    )
  }
  if (Component) {
    return (
      <Component {...propsState}>
        {propsState.children || 'Component Preview'}
      </Component>
    )
  }
  return <div className="text-xs text-muted-fg">No render target defined</div>
})

PlaygroundRenderer.displayName = 'PlaygroundRenderer'

export const PlaygroundCanvas: React.FC<PlaygroundCanvasProps> = ({
  config,
  componentName,
  component: Component,
}) => {
  const [propsState, setPropsState] = useState<Record<string, any>>({ ...config.defaultProps })
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [heightMode, setHeightMode] = useState<'compact' | 'regular' | 'tall'>(
    config.defaultHeight || 'regular'
  )
  const [layoutMode, setLayoutMode] = useState<'split' | 'stacked'>(
    config.defaultLayout || 'split'
  )
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false)
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)
  const [fullscreenViewport, setFullscreenViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [showFullscreenProps, setShowFullscreenProps] = useState(true)

  // Sync state when config changes (e.g. navigating between components)
  useEffect(() => {
    setPropsState({ ...config.defaultProps })
  }, [config])

  // Handle body overflow lock when fullscreen is open
  useEffect(() => {
    if (isFullscreenOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isFullscreenOpen])

  const handlePropChange = (name: string, value: any) => {
    setPropsState((prev) => ({ ...prev, [name]: value }))
  }

  const handleReset = () => {
    setPropsState({ ...config.defaultProps })
  }

  // Calculate dynamic canvas min-height based on mode & spec
  const getCanvasMinHeight = () => {
    const base = typeof config.minHeight === 'number' ? config.minHeight : 380
    switch (heightMode) {
      case 'compact':
        return '240px'
      case 'tall':
        return `${Math.max(base, 720)}px`
      case 'regular':
      default:
        return `${base}px`
    }
  }

  // Safe stringify utility to handle React elements and circular objects in props
  const safeStringify = (val: any) => {
    try {
      const seen = new WeakSet()
      return JSON.stringify(val, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value) || value.$$typeof || value._owner) {
            return undefined
          }
          seen.add(value)
        }
        return value
      })
    } catch {
      return '"{...}"'
    }
  }

  // Generate live JSX preview string
  const generateJsxString = () => {
    if (config.code) {
      let liveCode = config.code

      // Build active prop pairs
      const propPairs: string[] = []
      Object.entries(propsState).forEach(([k, v]) => {
        if (k === 'children') return
        if (v === true) propPairs.push(k)
        else if (v === false || v === undefined || v === null) return
        else if (typeof v === 'string') propPairs.push(`${k}="${v}"`)
        else if (typeof v === 'number') propPairs.push(`${k}={${v}}`)
        else propPairs.push(`${k}={${safeStringify(v)}}`)
      })
      const propStr = propPairs.length > 0 ? ` ${propPairs.join(' ')}` : ''

      // Replace {...props} if present
      if (liveCode.includes('{...props}')) {
        liveCode = liveCode.replace(/\{\.\.\.props\}/g, propStr.trim())
      }

      // Replace explicit control props if present
      config.controls.forEach((ctrl) => {
        const val = propsState[ctrl.name]
        if (val !== undefined) {
          const strRegex = new RegExp(`${ctrl.name}="[^"]*"`, 'g')
          if (typeof val === 'string') {
            liveCode = liveCode.replace(strRegex, `${ctrl.name}="${val}"`)
          }
        }
      })

      return liveCode
    }

    const propPairs: string[] = []
    let childrenVal = propsState.children || 'Preview'

    Object.entries(propsState).forEach(([k, v]) => {
      if (k === 'children') return
      if (v === true) propPairs.push(k)
      else if (v === false || v === undefined || v === null) return
      else if (typeof v === 'string') propPairs.push(`${k}="${v}"`)
      else if (typeof v === 'number') propPairs.push(`${k}={${v}}`)
      else propPairs.push(`${k}={${safeStringify(v)}}`)
    })

    const propStr = propPairs.length > 0 ? ` ${propPairs.join(' ')}` : ''
    return `<${componentName}${propStr}>\n  ${childrenVal}\n</${componentName}>`
  }

  // Render the controls surface
  const renderControls = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-fg uppercase tracking-wider">
          <Sliders className="w-3.5 h-3.5" />
          <span>Properties</span>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-2xs text-muted-fg hover:text-fg flex items-center gap-1 cursor-pointer transition-colors"
          title="Reset to default props"
        >
          <RotateCcw className="w-2.5 h-2.5" />
          <span>Reset</span>
        </button>
      </div>

      <div className={cn(
        layoutMode === 'stacked'
          ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5"
          : "space-y-3"
      )}>
        {config.controls.map((ctrl) => {
          const curVal = propsState[ctrl.name]

          if (ctrl.type === 'select') {
            return (
              <div key={ctrl.name} className="space-y-1">
                <label className="text-[11px] font-medium text-fg flex items-center justify-between">
                  <span>{ctrl.label || ctrl.name}</span>
                  <span className="font-mono text-muted-fg text-2xs">{String(curVal)}</span>
                </label>
                <select
                  value={curVal ?? ''}
                  onChange={(e) => handlePropChange(ctrl.name, e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-base border border-input bg-bg text-fg focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {ctrl.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )
          }

          if (ctrl.type === 'boolean') {
            return (
              <label
                key={ctrl.name}
                className="flex items-center justify-between p-2 rounded-base bg-bg/40 border border-border/50 text-xs cursor-pointer hover:bg-bg/70 transition-colors"
              >
                <span className="font-medium text-fg">{ctrl.label || ctrl.name}</span>
                <input
                  type="checkbox"
                  checked={Boolean(curVal)}
                  onChange={(e) => handlePropChange(ctrl.name, e.target.checked)}
                  className="w-4 h-4 rounded-atom border-input bg-bg text-primary focus:ring-ring cursor-pointer accent-primary"
                />
              </label>
            )
          }

          if (ctrl.type === 'number') {
            return (
              <div key={ctrl.name} className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-medium text-fg">
                  <span>{ctrl.label || ctrl.name}</span>
                  <span className="font-mono text-muted-fg text-2xs">{curVal}</span>
                </div>
                <input
                  type="range"
                  min={ctrl.min ?? 0}
                  max={ctrl.max ?? 100}
                  step={ctrl.step ?? 1}
                  value={Number(curVal ?? 0)}
                  onChange={(e) => handlePropChange(ctrl.name, Number(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            )
          }

          if (ctrl.type === 'text') {
            return (
              <div key={ctrl.name} className="space-y-1">
                <label className="text-[11px] font-medium text-fg">{ctrl.label || ctrl.name}</label>
                <input
                  type="text"
                  value={curVal ?? ''}
                  onChange={(e) => handlePropChange(ctrl.name, e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-base border border-input bg-bg text-fg focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            )
          }

          return null
        })}
      </div>
    </div>
  )

  return (
    <div className="rounded-macro border border-border bg-overlay/30 backdrop-blur-md overflow-hidden shadow-sm">
      {/* Top Toolbar */}
      <div className="px-5 py-3 border-b border-border/70 flex flex-wrap items-center justify-between gap-3 bg-muted/30">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-fg tracking-tight">Interactive Playground</span>
        </div>

        {/* Viewport, Size, Layout & Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Viewport Width Selector */}
          <div className="flex items-center h-8 p-0.5 rounded-base bg-secondary border border-border/60">
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-micro transition-all cursor-pointer",
                viewport === 'desktop' ? "bg-primary text-primary-fg shadow-2xs" : "text-muted-fg hover:text-fg"
              )}
              title="Desktop view (Full width)"
            >
              <Laptop className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewport('tablet')}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-micro transition-all cursor-pointer",
                viewport === 'tablet' ? "bg-primary text-primary-fg shadow-2xs" : "text-muted-fg hover:text-fg"
              )}
              title="Tablet frame (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-micro transition-all cursor-pointer",
                viewport === 'mobile' ? "bg-primary text-primary-fg shadow-2xs" : "text-muted-fg hover:text-fg"
              )}
              title="Mobile frame (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Canvas Height Presets (S / M / L) */}
          <div className="hidden sm:flex items-center h-8 p-0.5 rounded-base bg-secondary border border-border/60">
            <button
              type="button"
              onClick={() => setHeightMode('compact')}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-micro font-mono text-[11px] font-bold transition-all cursor-pointer",
                heightMode === 'compact' ? "bg-primary text-primary-fg shadow-2xs" : "text-muted-fg hover:text-fg"
              )}
              title="Compact height (260px)"
            >
              S
            </button>
            <button
              type="button"
              onClick={() => setHeightMode('regular')}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-micro font-mono text-[11px] font-bold transition-all cursor-pointer",
                heightMode === 'regular' ? "bg-primary text-primary-fg shadow-2xs" : "text-muted-fg hover:text-fg"
              )}
              title="Regular height (390px)"
            >
              M
            </button>
            <button
              type="button"
              onClick={() => setHeightMode('tall')}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-micro font-mono text-[11px] font-bold transition-all cursor-pointer",
                heightMode === 'tall' ? "bg-primary text-primary-fg shadow-2xs" : "text-muted-fg hover:text-fg"
              )}
              title="Tall height (580px)"
            >
              L
            </button>
          </div>

          {/* Layout Mode Toggle (Split vs Stacked) */}
          <div className="hidden md:flex items-center h-8 p-0.5 rounded-base bg-secondary border border-border/60">
            <button
              type="button"
              onClick={() => setLayoutMode('split')}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-micro transition-all cursor-pointer",
                layoutMode === 'split' ? "bg-primary text-primary-fg shadow-2xs" : "text-muted-fg hover:text-fg"
              )}
              title="Side-by-side split layout"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('stacked')}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-micro transition-all cursor-pointer",
                layoutMode === 'stacked' ? "bg-primary text-primary-fg shadow-2xs" : "text-muted-fg hover:text-fg"
              )}
              title="Full-width stacked layout"
            >
              <Rows className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fullscreen Expand Action */}
          <button
            type="button"
            onClick={() => setIsFullscreenOpen(true)}
            className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-base border border-border/70 bg-secondary hover:bg-secondary/80 text-secondary-fg text-xs font-medium transition-all cursor-pointer"
            title="Expand to full-screen interactive workbench"
          >
            <Maximize2 className="w-3.5 h-3.5 text-muted-fg" />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>

          {/* View Code Action */}
          <button
            type="button"
            onClick={() => setIsCodeModalOpen(true)}
            className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-base border border-border/70 bg-secondary hover:bg-secondary/80 text-secondary-fg text-xs font-medium transition-all cursor-pointer"
            title="View live generated source code"
          >
            <Code className="w-3.5 h-3.5 text-primary" />
            <span>Code</span>
          </button>
        </div>
      </div>

      {/* Main Grid / Stack Container */}
      <div className={cn(
        layoutMode === 'split'
          ? "grid grid-cols-1 lg:grid-cols-12"
          : "flex flex-col"
      )}>
        {/* Live Canvas Viewport Container */}
        <div
          className={cn(
            layoutMode === 'split' ? "lg:col-span-9 border-b lg:border-b-0 lg:border-r" : "w-full border-b",
            "p-6 md:p-8 flex flex-col items-center justify-center bg-bg/70 border-border/70 relative overflow-auto min-w-0"
          )}
          style={{ minHeight: getCanvasMinHeight() }}
        >
          {viewport === 'desktop' ? (
            <div className="@container w-full min-w-0 h-full min-h-[20rem] flex items-center justify-center">
              <PlaygroundRenderer config={config} propsState={propsState} component={Component} renderKey={componentName} />
            </div>
          ) : (
            <div
              className={cn(
                'rounded-macro border border-border/40 bg-bg overflow-hidden flex flex-col shadow-sm @container',
                viewport === 'mobile' ? 'w-[375px] max-w-full' : 'w-[768px] max-w-full'
              )}
            >
              {/* Device Frame Header */}
              <div className="px-3 py-1.5 border-b border-border/40 bg-surface/50 flex items-center justify-between text-[10px] text-muted-fg font-mono select-none">
                <span className="flex items-center gap-1.5">
                  {viewport === 'mobile' ? (
                    <>
                      <Smartphone className="w-3 h-3 text-primary" />
                      <span>375px (Mobile Viewport)</span>
                    </>
                  ) : (
                    <>
                      <Tablet className="w-3 h-3 text-primary" />
                      <span>768px (Tablet Viewport)</span>
                    </>
                  )}
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-2xs" />
                  <span className="text-[9px]">Responsive Frame</span>
                </div>
              </div>

              {/* Device Content Viewport */}
              <div
                className="@container p-3 sm:p-4 w-full min-w-0 min-h-0 flex items-center justify-center bg-bg/50 overflow-auto"
                style={{
                  height: heightMode === 'compact'
                    ? (viewport === 'mobile' ? '360px' : '400px')
                    : heightMode === 'tall'
                    ? (viewport === 'mobile' ? '560px' : '620px')
                    : (viewport === 'mobile' ? '480px' : '520px')
                }}
              >
                <PlaygroundRenderer config={config} propsState={propsState} component={Component} renderKey={componentName} />
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Controls Surface (Narrower 3-column width) */}
        <div className={cn(
          layoutMode === 'split' ? "lg:col-span-3 p-4 overflow-y-auto max-h-[720px]" : "w-full p-5 bg-muted/30",
          "bg-muted/20 flex flex-col justify-between"
        )}>
          {renderControls()}
        </div>
      </div>

      {/* Live JSX Modal */}
      <CodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        code={generateJsxString()}
        title={`${componentName} Playground — Live JSX`}
        description="Interactive component configuration with active state and prop values"
      />

      {/* Fullscreen Interactive Inspection Overlay */}
      {isFullscreenOpen && createPortal(
        <div className="fixed inset-0 z-50 flex flex-col bg-bg/95 backdrop-blur-md animate-in fade-in duration-200">
          {/* Fullscreen Header Bar */}
          <div className="px-6 py-3.5 border-b border-border bg-secondary/40 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-2.5">
              <Play className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm text-fg tracking-tight">{componentName} Fullscreen Studio</span>
            </div>

            {/* Viewport, Props Drawer Toggle & Close */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center h-8 p-0.5 rounded-base bg-secondary border border-border/60">
                <button
                  type="button"
                  onClick={() => setFullscreenViewport('desktop')}
                  className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-micro transition-all cursor-pointer",
                    fullscreenViewport === 'desktop' ? "bg-primary text-primary-fg shadow-2xs" : "text-muted-fg hover:text-fg"
                  )}
                  title="Desktop (100% width)"
                >
                  <Laptop className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setFullscreenViewport('tablet')}
                  className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-micro transition-all cursor-pointer",
                    fullscreenViewport === 'tablet' ? "bg-primary text-primary-fg shadow-2xs" : "text-muted-fg hover:text-fg"
                  )}
                  title="Tablet (768px)"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setFullscreenViewport('mobile')}
                  className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-micro transition-all cursor-pointer",
                    fullscreenViewport === 'mobile' ? "bg-primary text-primary-fg shadow-2xs" : "text-muted-fg hover:text-fg"
                  )}
                  title="Mobile (375px)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowFullscreenProps(!showFullscreenProps)}
                className={cn(
                  "h-8 inline-flex items-center gap-1.5 px-2.5 rounded-base text-xs font-semibold border transition-all cursor-pointer",
                  showFullscreenProps
                    ? "bg-primary text-primary-fg border-primary"
                    : "bg-secondary text-secondary-fg border-border/70 hover:bg-secondary/80"
                )}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{showFullscreenProps ? 'Hide Controls' : 'Show Controls'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreenOpen(false)}
                className="h-8 w-8 flex items-center justify-center text-muted-fg hover:text-fg rounded-base hover:bg-muted transition-colors cursor-pointer border border-border/60"
                title="Exit fullscreen (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Fullscreen Body */}
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 p-6 md:p-12 overflow-y-auto flex items-center justify-center bg-bg/50">
              {fullscreenViewport === 'desktop' ? (
                <div className="@container w-full min-w-0 h-full min-h-[24rem] flex items-center justify-center">
                  <PlaygroundRenderer config={config} propsState={propsState} component={Component} renderKey={componentName} />
                </div>
              ) : (
                <div
                  className={cn(
                    'transition-all duration-300 rounded-macro border border-border/80 bg-bg overflow-hidden flex flex-col',
                    fullscreenViewport === 'mobile' ? 'w-[375px] h-[680px]' : 'w-[768px] h-[740px]'
                  )}
                >
                  <div className="px-3.5 py-2 border-b border-border/60 bg-muted/40 flex items-center justify-between text-[11px] text-muted-fg font-mono select-none">
                    <span className="flex items-center gap-1.5">
                      {fullscreenViewport === 'mobile' ? (
                        <>
                          <Smartphone className="w-3.5 h-3.5 text-primary" />
                          <span>375px Mobile Frame</span>
                        </>
                      ) : (
                        <>
                          <Tablet className="w-3.5 h-3.5 text-primary" />
                          <span>768px Tablet Frame</span>
                        </>
                      )}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px]">Interactive</span>
                    </div>
                  </div>
                  <div className="@container p-3 flex-1 min-h-0 min-w-0 flex items-center justify-center overflow-auto bg-bg/60">
                    <PlaygroundRenderer config={config} propsState={propsState} component={Component} renderKey={componentName} />
                  </div>
                </div>
              )}
            </div>

            {/* Controls Side Panel in Fullscreen */}
            {showFullscreenProps && (
              <div className="w-80 border-l border-border bg-overlay p-5 overflow-y-auto flex flex-col gap-4 animate-in slide-in-from-right duration-200">
                {renderControls()}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
