import React, { useState } from 'react'
import {
  Check,
  Copy,
  Layers,
  Sparkles,
  Terminal,
  Shield,
  Zap,
  Globe,
  Radio,
  Sliders,
  Code,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import type { ProviderDoc } from '@registry/types'
import { getProviderDoc, getAllProviders, getHookDoc } from '../registry/registry-client'
import { PropsTable } from './props-table'
import { CodeViewer } from './code-viewer'

import { useNavigation } from '@consona/interface'

export interface ProviderDocViewProps {
  providerName?: string
  onSelectHook?: (hookName: string) => void
  onSelectComponent?: (compName: string) => void
  onSelectProvider?: (provName: string) => void
}

const PROVIDER_DEEP_EXPLANATIONS: Record<
  string,
  {
    tagline: string
    summary: string
    architectureHighlights: string[]
    bestPractices: string[]
    exampleCode: string
  }
> = {
  InterfaceProvider: {
    tagline: 'The Master Inversion-of-Control & Plugin Foundation for Consona Interface',
    summary:
      'InterfaceProvider serves as the supreme root orchestration boundary. It initializes the component slot registry (allowing runtime override and dependency injection of any atomic or composite component), connects plugin subsystems (Audio, Glass, Map, Onboarding), and exposes a typed event bus for global telemetry and inter-component messaging.',
    architectureHighlights: [
      'Component Injection Registry: Swap out any internal component implementation (e.g. custom Button or Modal) across your entire app via the components prop without modifying atomic source code.',
      'Plugin Subsystem Bus: Registers and initializes modular plugins dynamically with lifecycle hooks.',
      'Universal Event Dispatcher: Asynchronous, type-safe event broadcasting (emit) across isolated subtree branches.',
      'Theme & Scale Bridge: Automatically seeds downstream ThemeProvider and SizeProvider defaults if not nested separately.',
    ],
    bestPractices: [
      'Mount InterfaceProvider at the highest level of your React tree (e.g. main.tsx or _app.tsx).',
      'Use the plugins array to activate rich capabilities such as Audio, Glass Physics, or Geospatial Maps.',
      'Supply event listeners to track user interactions, telemetry, or system-wide audio feedback.',
    ],
    exampleCode: `import React from 'react'
import { InterfaceProvider, Button, Card } from '@consona/interface'
import { consonaThemeExtender } from '@consona/interface/theme'

export function App() {
  return (
    <InterfaceProvider
      theme={{
        preset: 'slate',
        radius: 'md',
        extenders: [consonaThemeExtender],
      }}
      events={{
        'theme:change': (payload) => console.log('Theme changed to:', payload),
        'toast:show': (payload) => console.log('Toast triggered:', payload),
      }}
    >
      <main className="p-8">
        <Card>
          <h1>Consona Interface Application</h1>
          <Button intent="primary">Get Started</Button>
        </Card>
      </main>
    </InterfaceProvider>
  )
}`,
  },
  ThemeProvider: {
    tagline: 'Next-Gen Dynamic Token Engine with CSS Variable Cascade & Theme Scopes',
    summary:
      'ThemeProvider powers the Tier 0/1 CSS variable architecture of Consona Interface. It maintains 45+ responsive color, typography, optical density, and shadow elevation tokens in real-time, auto-loads Google Fonts, persists user preferences in localStorage, and supports isolated subtrees via <ThemeScope>.',
    architectureHighlights: [
      'Instant Reactive CSS Tokens: Injects 45+ CSS custom properties directly onto document.documentElement without re-rendering downstream DOM elements.',
      'Cascading Shadow Elevation System: Automatically synchronizes subtle, medium, elevated, float, and glow shadow levels across all modal, popover, menu, select, and card elements.',
      'Optical Scale & Density Engine: Dynamically recalculates spacing, padding, and font-size factors from compact (0.85) to spacious (1.15).',
      'Dynamic Font Loader: Loads modern typography from Google Fonts (Inter, Outfit, Geist, JetBrains Mono, etc.) on demand.',
      'Subtree Isolation: Pair with <ThemeScope> to render dark mode sidebars or inverted accent cards within a light mode application.',
    ],
    bestPractices: [
      'Use the useTheme() hook to read current tokens, swap presets, or toggle between light, dark, and system modes.',
      'Leverage ThemeEditorModal or ThemeEditor to provide end-users with live in-app customization.',
      'Use <ThemeScope preset="obsidian" mode="dark"> for dedicated dark-themed navigation rails or code panels.',
    ],
    exampleCode: `import React from 'react'
import { ThemeProvider, useTheme, Button, ThemeScope } from '@consona/interface'

function Header() {
  const { mode, setMode, presetId, setPresetId, density, setDensity } = useTheme()
  return (
    <header className="flex items-center justify-between p-4 border-b border-border">
      <span className="font-bold">Active Preset: {presetId}</span>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>
          Toggle Mode ({mode})
        </Button>
        <Button size="sm" onClick={() => setDensity(density === 1.0 ? 0.85 : 1.0)}>
          Toggle Compact
        </Button>
      </div>
    </header>
  )
}

export function App() {
  return (
    <ThemeProvider
      defaultTheme="system"
      preset="slate"
      radius="md"
      shadow="subtle"
      fontSize="md"
    >
      <Header />
      <div className="p-8 space-y-6">
        {/* Main Content */}
        <div>Standard Theme Scope Content</div>

        {/* Inverted Isolated Subtree */}
        <ThemeScope mode="dark" preset="mono">
          <div className="p-6 rounded-macro bg-bg text-fg border border-border">
            <h4>Isolated Dark Theme Scope</h4>
            <Button intent="primary">Isolated Button</Button>
          </div>
        </ThemeScope>
      </div>
    </ThemeProvider>
  )
}`,
  },
  SizeProvider: {
    tagline: 'Hierarchical Optical Scale & Density Scaling Engine',
    summary:
      'SizeProvider establishes a contextual optical scale across child components. It propagates sizing tiers (xs, sm, md, lg, xl) and continuous optical scaling factors, enabling miniature status badges, dense data grids, or prominent display heroes to maintain proportional harmony.',
    architectureHighlights: [
      'Scale Cascade: Automatically informs child primitives of the surrounding container density.',
      'Fluid Proportions: Recalculates typography, icon bounding boxes, and padding with zero layout thrashing.',
      'Nested Overrides: Nest child SizeProviders to locally compact or magnify specific UI regions.',
    ],
    bestPractices: [
      'Wrap dense enterprise tables in <SizeProvider size="sm"> to compact entire row layouts uniformly.',
      'Access scale metrics in custom components with useOpticalSize().',
    ],
    exampleCode: `import React from 'react'
import { SizeProvider, useOpticalSize, Button, Input, Badge } from '@consona/interface'

function SizedCluster() {
  const { size, opticalFactor } = useOpticalSize()
  return (
    <div className="flex items-center gap-3">
      <Badge>Size: {size}</Badge>
      <Input placeholder="Enter value..." />
      <Button intent="primary">Submit</Button>
    </div>
  )
}

export function App() {
  return (
    <div className="space-y-6 p-8">
      {/* Compact Data Row */}
      <SizeProvider size="sm">
        <SizedCluster />
      </SizeProvider>

      {/* Standard Form Area */}
      <SizeProvider size="md">
        <SizedCluster />
      </SizeProvider>

      {/* Prominent Hero Form */}
      <SizeProvider size="lg">
        <SizedCluster />
      </SizeProvider>
    </div>
  )
}`,
  },
  SidebarProvider: {
    tagline: 'Responsive Navigation Rail & Dock State Coordinator',
    summary:
      'SidebarProvider orchestrates the state of collapsible desktop sidebars, mobile drawer sheets, and icon dock rails. It manages keyboard shortcuts (⌘B / Ctrl+B), detects screen breakpoints, and persists collapsed states to cookies or localStorage.',
    architectureHighlights: [
      'Multi-Mode State: Supports expanded, collapsed (dock), and mobile off-canvas sheet presentations.',
      'Global Keyboard Chords: Built-in ⌘B listener with configurable keybinding handler.',
      'Persistent Storage: Preserves user layout preferences seamlessly across page navigations.',
      'Hover Rail Detection: Automatically reveals full menu items upon hovering docked rail icons.',
    ],
    bestPractices: [
      'Wrap your shell layout with <SidebarProvider defaultOpen={true}>.',
      'Use useSidebar() inside header bars, navigation menus, or custom triggers to toggle or inspect state.',
    ],
    exampleCode: `import React from 'react'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarItem,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from '@consona/interface'
import { Home, Settings, User } from 'lucide-react'

function TopNav() {
  const { state, toggleSidebar } = useSidebar()
  return (
    <header className="h-12 border-b border-border flex items-center px-4 gap-3">
      <SidebarTrigger />
      <span>Sidebar state: {state}</span>
    </header>
  )
}

export function Shell() {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen w-screen">
        <Sidebar collapsible="dock">
          <SidebarContent>
            <SidebarItem icon={<Home className="w-4 h-4" />}>Dashboard</SidebarItem>
            <SidebarItem icon={<User className="w-4 h-4" />}>Profile</SidebarItem>
            <SidebarItem icon={<Settings className="w-4 h-4" />}>Settings</SidebarItem>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <TopNav />
          <main className="p-6">Main content area</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}`,
  },
  AudioProvider: {
    tagline: 'High-Performance Web Audio Graph Host & Spatial Soundscape Engine',
    summary:
      'AudioProvider creates and manages the Web Audio AudioContext singleton, master gain compressor nodes, dynamic audio buffer caching, real-time frequency analyser nodes, and microphone input streams for all media primitives.',
    architectureHighlights: [
      'Singleton AudioContext: Safely handles browser autoplay policies and resume gestures.',
      'Real-Time Spectrum Analyser: Powers BarVisualizer, Waveforms, and voice activity meters.',
      'Spatial Sound Positioning: Computes listener position and HRTF panning for 3D UI audio.',
      'Audio Device Enumeration: Manages microphone switching and input gain leveling.',
    ],
    bestPractices: [
      'Wrap media-heavy applications or voice interfaces in AudioProvider.',
      'Use useAudio() or useAudioPlayer() to connect UI controls directly to the global audio pipeline.',
    ],
    exampleCode: `import React from 'react'
import { AudioProvider, useAudio, AudioPlayer, BarVisualizer } from '@consona/interface/media'

function SoundControls() {
  const { masterVolume, setMasterVolume, isMuted, toggleMute } = useAudio()
  return (
    <div className="flex items-center gap-3">
      <button onClick={toggleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>
      <span>Volume: {Math.round(masterVolume * 100)}%</span>
    </div>
  )
}

export function App() {
  return (
    <AudioProvider autoUnlock latencyHint="interactive">
      <SoundControls />
      <AudioPlayer src="/sample.mp3" />
      <BarVisualizer bands={32} />
    </AudioProvider>
  )
}`,
  },
  GlassProvider: {
    tagline: 'Liquid Glass Real-Time Refraction & Specular Physics Engine',
    summary:
      'GlassProvider orchestrates real-time backdrop blur, refractive index computation, specular chromatic dispersion, and dynamic surface lighting across all <LiquidGlass> and glassmorphic UI components.',
    architectureHighlights: [
      'Refractive Shader Mesh: Calculates Fresnel reflections and optical distortion.',
      'Adaptive Performance: Automatically throttles shader sampling on low-power devices.',
      'Dynamic Theme Sync: Harmonizes glass tint and specular saturation with active theme presets.',
    ],
    bestPractices: [
      'Mount GlassProvider when using advanced liquid glass cards, floating headers, or dialogs.',
      'Access physical parameters via useGlassPhysics().',
    ],
    exampleCode: `import React from 'react'
import { GlassProvider, LiquidGlass, useGlassPhysics } from '@consona/interface/glass'

export function App() {
  return (
    <GlassProvider defaultRefractiveIndex={1.45} defaultBlur={16}>
      <LiquidGlass thickness={8} bezelWidth={2} className="p-8 rounded-2xl">
        <h3>Liquid Glass Surface</h3>
        <p>Real-time optical refraction and dynamic lighting.</p>
      </LiquidGlass>
    </GlassProvider>
  )
}`,
  },
}

export const ProviderDocView: React.FC<ProviderDocViewProps> = ({
  providerName: propProviderName,
  onSelectHook,
  onSelectComponent,
  onSelectProvider,
}) => {
  const { params, activeNode, navigate } = useNavigation()
  const providerName = propProviderName || params.name || activeNode?.data?.name || 'InterfaceProvider'

  const handleSelectHook = onSelectHook || ((h: string) => navigate(`/architecture/hooks/${h}`))
  const handleSelectProvider = onSelectProvider || ((p: string) => navigate(`/architecture/providers/${p}`))
  const handleSelectComponent = onSelectComponent || ((c: string) => navigate(`/components/${c}`))

  const [copiedImport, setCopiedImport] = useState(false)
  const doc = getProviderDoc(providerName)
  const allProviders = getAllProviders()

  const deep = PROVIDER_DEEP_EXPLANATIONS[providerName] || {
    tagline: `Context & State Management Architecture for ${providerName}`,
    summary:
      doc?.description ||
      `${providerName} is a foundational context provider supplying reactive state and lifecycle services across the Consona Interface component hierarchy.`,
    architectureHighlights: [
      `Context Scoping: Isolates state management cleanly within its mounting subtree.`,
      `Zero-Overhead Memory Footprint: Automatically cleans up listeners and external subscriptions upon unmount.`,
      `Headless Hook Integration: Direct pairing with complementary React consumer hooks.`,
    ],
    bestPractices: [
      `Wrap relevant component subtrees or your application root with <${providerName}>.`,
      `Use the companion hooks to interact with provided state and methods.`,
    ],
    exampleCode: `import React from 'react'
import { ${providerName} } from '${doc?.module || '@consona/interface'}'

export function App() {
  return (
    <${providerName}>
      <div className="p-6">
        {/* Child components consuming ${providerName} */}
      </div>
    </${providerName}>
  )
}`,
  }

  const importStatement = `import { ${providerName} } from '${doc?.module || '@consona/interface'}'`

  const handleCopyImport = async () => {
    try {
      await navigator.clipboard.writeText(importStatement)
      setCopiedImport(true)
      setTimeout(() => setCopiedImport(false), 2000)
    } catch {
      // ignore
    }
  }

  const typeColor =
    doc?.type === 'global'
      ? 'bg-primary/10 border-primary/30 text-primary'
      : doc?.type === 'plugin'
      ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400'
      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'

  return (
    <div className="space-y-12 w-full max-w-7xl mx-auto pb-20">
      {/* 1. Hero Header */}
      <div className="space-y-4 border-b border-border pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-fg tracking-tight">{providerName}</h1>
            <span
              className={`px-2.5 py-0.5 rounded-micro border text-xs font-semibold uppercase tracking-wider ${typeColor}`}
            >
              {doc?.type || 'Scoped'} Provider
            </span>
            {doc?.module && (
              <span className="px-2 py-0.5 rounded-micro bg-muted text-muted-fg font-mono text-xs border border-border">
                {doc.module}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-fg font-mono">v1.0.0 Architecture</span>
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

      {/* 2. Architectural Highlights & Best Practices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-macro border border-border bg-overlay/30 backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-fg">
            <Shield className="w-4 h-4 text-primary" />
            <span>Architecture & Engine Capabilities</span>
          </div>
          <ul className="space-y-2.5 text-xs text-muted-fg">
            {deep.architectureHighlights.map((highlight, i) => (
              <li key={i} className="flex items-start gap-2">
                <Zap className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span className="leading-relaxed">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 rounded-macro border border-border bg-overlay/30 backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-fg">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Integration & Best Practices</span>
          </div>
          <ul className="space-y-2.5 text-xs text-muted-fg">
            {deep.bestPractices.map((practice, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{practice}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 3. Implementation & Code Recipe */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-fg tracking-tight">Complete Usage Recipe</h2>
        </div>
        <div className="rounded-macro overflow-hidden border border-border">
          <CodeViewer code={deep.exampleCode} />
        </div>
      </section>

      {/* 4. Provider Configuration Props */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-fg tracking-tight">Provider Configuration Props</h2>
          </div>
          <span className="text-xs text-muted-fg font-mono">
            {doc?.props ? Object.keys(doc.props).length : 0} properties
          </span>
        </div>
        <PropsTable propsDoc={doc?.props} />
      </section>

      {/* 5. Context Value & Exposed API */}
      {doc?.contextValue && Object.keys(doc.contextValue).length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-fg tracking-tight">
                Context Value Schema (Downstream API)
              </h2>
            </div>
            <span className="text-xs text-muted-fg font-mono">
              {Object.keys(doc.contextValue).length} exposed members
            </span>
          </div>
          <PropsTable propsDoc={doc.contextValue} />
        </section>
      )}

      {/* 6. Quick Provider Navigation */}
      <section className="pt-8 border-t border-border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-muted-fg uppercase tracking-wider">
            All Architecture Providers ({allProviders.length})
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {allProviders.map((p) => {
            const isSelected = p.name === providerName
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => handleSelectProvider(p.name)}
                className={`flex flex-col p-3 rounded-base border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary shadow-xs'
                    : 'border-border bg-overlay/20 hover:bg-overlay/60 text-fg hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono text-xs font-bold truncate">{p.name}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded-micro bg-muted text-muted-fg">
                    {p.type}
                  </span>
                </div>
                <span className="text-[11px] text-muted-fg truncate mt-1">
                  {p.props ? `${Object.keys(p.props).length} props` : '0 props'}
                </span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
