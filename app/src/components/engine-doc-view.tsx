import React, { useState } from 'react'
import {
  Activity,
  Check,
  Code,
  Copy,
  Cpu,
  Layers,
  Radio,
  Sliders,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react'
import type { EngineDoc } from '@registry/types'
import { getEngineDoc, getAllEngines } from '../registry/registry-client'
import { PropsTable } from './props-table'
import { CodeViewer } from './code-viewer'
import { TypeDisplay } from './type-display'

import { useNavigation } from '@consona/interface'

export interface EngineDocViewProps {
  engineName?: string
  onSelectEngine?: (name: string) => void
  onSelectHook?: (hookName: string) => void
  onSelectComponent?: (compName: string) => void
}

const ENGINE_DEEP_EXPLANATIONS: Record<
  string,
  {
    tagline: string
    summary: string
    usageExample: string
    architectureNotes: string[]
  }
> = {
  GlassPhysicsEngine: {
    tagline: 'High Precision Optical Refraction & Specular Physics Core',
    summary:
      'GlassPhysicsEngine is a pure TypeScript state machine that drives liquid glass refraction shaders, chromatic dispersion calculations, and surface specular highlights with 60fps hardware accelerated updates.',
    usageExample: `import { GlassPhysicsEngine } from '@consona/interface/glass'

const engine = new GlassPhysicsEngine({
  refractiveIndex: 1.45,
  blur: 20,
  bezelWidth: 2,
  tintColor: 'rgba(255, 255, 255, 0.1)',
})

engine.on('glass:update', (state) => {
  console.log('Refractive state updated:', state)
})

engine.updateParams({ thickness: 12, specularOpacity: 0.8 })`,
    architectureNotes: [
      'Micro-benchmarked math pipelines computing Fresnel equations in under 0.1ms per frame.',
      'Decoupled from DOM rendering; runs safely inside Web Workers or React state bridges.',
      'Direct synchronization with useGlassPhysics() hook for zero-overhead React reactivity.',
    ],
  },
  InteractionEngine: {
    tagline: 'Declarative Multi-Device Interaction & Keyboard Chord Controller',
    summary:
      'InteractionEngine normalizes multi-key chords (e.g. ⌘+K, ⇧+⌘+P), pointer gestures, and gamepad interactions into unified semantic actions with priority arbitration.',
    usageExample: `import { InteractionEngine } from '@consona/interface/interaction'

const engine = new InteractionEngine()

engine.registerChord('palette:open', {
  keys: ['meta', 'k'],
  scope: 'global',
  preventBrowserDefault: true,
})

engine.on('action:palette:open', () => {
  console.log('Triggered ⌘K command palette!')
})`,
    architectureNotes: [
      'Cross-browser key code normalization across macOS, Windows, and Linux layouts.',
      'Scoped key trapping (e.g. modal overlay focus trap overrides global chords).',
      'Event arbitration pipeline preventing conflicting multi-key combos from double-firing.',
    ],
  },
  MapEngine: {
    tagline: 'Geospatial WebGL Layer Coordinator & Dynamic Tile Streamer',
    summary:
      'MapEngine manages map camera projection matrices, vector tile cache invalidation, marker spatial indexing (R-Tree), and interactive route path calculation.',
    usageExample: `import { MapEngine } from '@consona/interface/map'

const mapEngine = new MapEngine({
  center: [37.7749, -122.4194],
  zoom: 12,
  pitch: 45,
})

mapEngine.on('viewport:change', ({ center, zoom }) => {
  console.log('Map moved to:', center, zoom)
})

mapEngine.flyTo([40.7128, -74.006], 14)`,
    architectureNotes: [
      'Spatial R-Tree clustering index for instantaneous clustering of 100,000+ map markers.',
      'Vector tile cache eviction using LRU buffer algorithm.',
      'Smooth camera interpolation utilizing cubic Bezier flight transitions.',
    ],
  },
  OnboardingEngine: {
    tagline: 'Stateful Guided Tour & Interactive Spotlight Sequencer',
    summary:
      'OnboardingEngine drives multi-step product walkthroughs, beacon positioning, step completion tracking, and animated viewport spotlights.',
    usageExample: `import { OnboardingEngine } from '@consona/interface/onboarding'

const tour = new OnboardingEngine({
  steps: [
    { id: 'welcome', target: '#header-logo', title: 'Welcome!' },
    { id: 'search', target: '#search-bar', title: 'Find anything fast' },
  ],
})

tour.on('step:change', (step) => {
  console.log('Current tour step:', step.id)
})

tour.start()`,
    architectureNotes: [
      'Dynamic DOM element bounding rect tracking with ResizeObserver and scroll listener hooks.',
      'Step condition evaluation (e.g. auto-advance upon user clicking target element).',
      'Persistent tour state synchronization with local storage or backend profiles.',
    ],
  },
  OverlayEngine: {
    tagline: 'Multi-Layered Viewport Stacking & Collision Detection Manager',
    summary:
      'OverlayEngine controls viewport z-index stacking layers, floating popover boundary collisions, focus trapping, and backdrop dismiss sequences.',
    usageExample: `import { OverlayEngine } from '@consona/interface/overlay'

const overlays = new OverlayEngine()

const overlayId = overlays.push({
  type: 'modal',
  priority: 100,
  trapFocus: true,
  dismissOnClickOutside: true,
})`,
    architectureNotes: [
      'Stack-based layer priority system preventing popover/modal z-index clipping.',
      'Flip & shift viewport collision detection algorithm for intelligent floating placement.',
      'Universal Escape key and backdrop pointerdown listener dispatch.',
    ],
  },
}

export const EngineDocView: React.FC<EngineDocViewProps> = ({
  engineName: propEngineName,
  onSelectEngine,
  onSelectHook,
  onSelectComponent,
}) => {
  const { params, activeNode, navigate } = useNavigation()
  const engineName = propEngineName || params.name || activeNode?.data?.name || 'GlassPhysicsEngine'

  const handleSelectEngine = onSelectEngine || ((e: string) => navigate(`/architecture/engines/${e}`))
  const handleSelectHook = onSelectHook || ((h: string) => navigate(`/architecture/hooks/${h}`))
  const handleSelectComponent = onSelectComponent || ((c: string) => navigate(`/components/${c}`))

  const [copiedImport, setCopiedImport] = useState(false)
  const doc = getEngineDoc(engineName)
  const allEngines = getAllEngines()

  const deep = ENGINE_DEEP_EXPLANATIONS[engineName] || {
    tagline: `Pure TypeScript Reactive Engine for ${engineName}`,
    summary:
      doc?.description ||
      `${engineName} is a high-performance, framework-agnostic state machine powering reactive capabilities in Consona Interface.`,
    usageExample: `import { ${engineName} } from '${doc?.module || '@consona/interface'}'

const engine = new ${engineName}()
console.log('Engine state:', engine.getState())`,
    architectureNotes: [
      'Pure TypeScript logic separated from React rendering lifecycle for maximal throughput.',
      'Reactive event subscription bus for cross-component and worker synchronization.',
      'Comprehensive typed state management with immutable snapshot support.',
    ],
  }

  const importStatement = `import { ${engineName} } from '${doc?.module || '@consona/interface'}'`

  const handleCopyImport = async () => {
    try {
      await navigator.clipboard.writeText(importStatement)
      setCopiedImport(true)
      setTimeout(() => setCopiedImport(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-12 w-full max-w-7xl mx-auto pb-20">
      {/* 1. Hero Header */}
      <div className="space-y-4 border-b border-border pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-fg tracking-tight">{engineName}</h1>
            <span className="px-2.5 py-0.5 rounded-micro border text-xs font-semibold uppercase tracking-wider bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400">
              State Engine
            </span>
            {doc?.module && (
              <span className="px-2 py-0.5 rounded-micro bg-muted text-muted-fg font-mono text-xs border border-border">
                {doc.module}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-fg font-mono">Framework Agnostic</span>
          </div>
        </div>

        <p className="text-lg font-medium text-fg/90 max-w-4xl">{deep.tagline}</p>
        <p className="text-sm text-muted-fg leading-relaxed max-w-4xl">{deep.summary}</p>

        {/* Import Snippet Bar */}
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-base border border-border bg-muted/40 font-mono text-xs">
          <Terminal className="w-3.5 h-3.5 text-primary" />
          <span className="text-fg">{importStatement}</span>
          <button
            type="button"
            onClick={handleCopyImport}
            className="p-1 text-muted-fg hover:text-fg transition-colors cursor-pointer"
            title="Copy import statement"
          >
            {copiedImport ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Architecture Notes */}
      <div className="p-6 rounded-macro border border-border bg-overlay/30 backdrop-blur-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-fg">
          <Cpu className="w-4 h-4 text-primary" />
          <span>Core Engine Architecture</span>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-fg">
          {deep.architectureNotes.map((note, i) => (
            <li key={i} className="p-3.5 rounded-base border border-border/70 bg-bg/50 space-y-1.5">
              <div className="flex items-center gap-1.5 text-primary font-semibold">
                <Zap className="w-3.5 h-3.5" />
                <span>Capability 0{i + 1}</span>
              </div>
              <p className="leading-relaxed">{note}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* 3. Usage Example */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-fg tracking-tight">Engine Usage & Subscriptions</h2>
        </div>
        <div className="rounded-macro overflow-hidden border border-border">
          <CodeViewer code={deep.usageExample} />
        </div>
      </section>

      {/* 4. Typed State Model */}
      {doc?.state && Object.keys(doc.state).length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-fg tracking-tight">Engine State Model (Snapshot)</h2>
            </div>
            <span className="text-xs text-muted-fg font-mono">
              {Object.keys(doc.state).length} state fields
            </span>
          </div>
          <PropsTable propsDoc={doc.state} />
        </section>
      )}

      {/* 5. Methods & Commands */}
      {doc?.methods && Object.keys(doc.methods).length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-fg tracking-tight">Engine Methods & Actions</h2>
            </div>
            <span className="text-xs text-muted-fg font-mono">
              {Object.keys(doc.methods).length} methods
            </span>
          </div>
          <div className="rounded-macro border border-border bg-overlay/30 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40 text-muted-fg font-semibold">
                  <th className="py-3 px-4 w-[25%]">Method</th>
                  <th className="py-3 px-4 w-[35%]">Parameters</th>
                  <th className="py-3 px-4 w-[20%]">Return Type</th>
                  <th className="py-3 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-sans">
                {Object.entries(doc.methods).map(([name, method]) => (
                  <tr key={name} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary align-top">
                      {name}()
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] align-top text-muted-fg">
                      {method.signature || `${name}()`}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] align-top text-fg">
                      <TypeDisplay typeString={method.returnType || 'void'} />
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-fg align-top">
                      {method.description || 'Executes engine state transition.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 6. Event Bus & Dispatched Signals */}
      {doc?.events && Object.keys(doc.events).length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-fg tracking-tight">Engine Event Streams</h2>
            </div>
            <span className="text-xs text-muted-fg font-mono">
              {Object.keys(doc.events).length} events
            </span>
          </div>
          <div className="rounded-macro border border-border bg-overlay/30 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40 text-muted-fg font-semibold">
                  <th className="py-3 px-4 w-[30%]">Event Name</th>
                  <th className="py-3 px-4 w-[35%]">Payload Type</th>
                  <th className="py-3 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-sans">
                {Object.entries(doc.events).map(([name, ev]) => (
                  <tr key={name} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-500 align-top">
                      '{name}'
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] align-top text-fg">
                      <TypeDisplay typeString={ev.payloadType || 'any'} />
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-fg align-top">
                      {ev.description || 'Dispatched on engine lifecycle event.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 7. Quick Engine Switcher */}
      <section className="pt-8 border-t border-border space-y-4">
        <h3 className="text-sm font-bold text-muted-fg uppercase tracking-wider">
          All State Engines ({allEngines.length})
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {allEngines.map((e) => {
            const isSelected = e.name === engineName
            return (
              <button
                key={e.name}
                type="button"
                onClick={() => handleSelectEngine(e.name)}
                className={`flex flex-col p-3 rounded-base border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary shadow-xs'
                    : 'border-border bg-overlay/20 hover:bg-overlay/60 text-fg hover:border-border/80'
                }`}
              >
                <span className="font-mono text-xs font-bold truncate">{e.name}</span>
                <span className="text-[11px] text-muted-fg truncate mt-1">
                  {e.state ? `${Object.keys(e.state).length} state fields` : '0 state'}
                </span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
