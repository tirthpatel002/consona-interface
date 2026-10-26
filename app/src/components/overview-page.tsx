import React, { useState, useMemo } from 'react'
import {
  ArrowRight,
  BookOpen,
  Box,
  Check,
  Code,
  Compass,
  Copy,
  Cpu,
  Eye,
  FileText,
  Layers,
  Layout,
  Palette,
  Search,
  ShieldCheck,
  Sliders,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react'
import {
  Badge,
  Button,
  Kbd,
  Separator,
  cn,
} from '@consona/interface'
import { COMPONENT_CATEGORIES_CONFIG } from '../navigation'
import { getAllDocSpecs } from '../docs'
import { getAllComponents } from '../registry/registry-client'
import { CodeViewer } from './code-viewer'
import { useNavigation } from '@consona/interface'

export interface OverviewPageProps {
  onSelectComponent?: (id: string) => void
  onOpenSearch?: () => void
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onSelectComponent,
  onOpenSearch,
}) => {
  const { navigate } = useNavigation()
  const handleSelectComponent = onSelectComponent || ((id: string) => navigate(`/components/${id}`))
  const handleOpenSearch = onOpenSearch || (() => {})

  const [copiedCmd, setCopiedCmd] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const docSpecs = getAllDocSpecs()
  const allRegistryComps = getAllComponents()

  const installCmds = {
    pnpm: 'pnpm add @consona/interface',
    npm: 'npm install @consona/interface',
    yarn: 'yarn add @consona/interface',
  }
  const [packageManager, setPackageManager] = useState<'pnpm' | 'npm' | 'yarn'>('pnpm')

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCmd(id)
    setTimeout(() => setCopiedCmd(null), 1800)
  }

  // Dynamically derive categories from COMPONENT_CATEGORIES_CONFIG (zero-duplication)
  const categories = useMemo(() => [
    { id: 'all', label: 'All Components', count: docSpecs.length },
    ...Object.entries(COMPONENT_CATEGORIES_CONFIG).map(([key, config]) => ({
      id: key,
      label: config.title,
      count: docSpecs.filter((s) => config.items.includes(s.id)).length,
    }))
  ], [docSpecs])

  const filteredSpecs = useMemo(() => {
    if (activeCategory === 'all') return docSpecs
    const config = COMPONENT_CATEGORIES_CONFIG[activeCategory]
    if (!config) return docSpecs
    return docSpecs.filter((spec) => config.items.includes(spec.id))
  }, [activeCategory, docSpecs])

  const quickStartCode = `import React from 'react'
import { ThemeProvider, Button, Field, Input, Badge } from '@consona/interface'

export function App() {
  return (
    <ThemeProvider defaultMode="dark">
      <div className="p-8 space-y-6 max-w-md mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Consona App</h1>
          <Badge intent="success">v1.0.0 Active</Badge>
        </div>

        <Field label="Workstation Name" description="Unique node identifier">
          <Input placeholder="node-cluster-01" />
        </Field>

        <Button intent="primary" className="w-full">
          Deploy Infrastructure
        </Button>
      </div>
    </ThemeProvider>
  )
}`

  return (
    <div className="space-y-16 w-full max-w-7xl mx-auto pb-24 animate-in fade-in duration-200">
      {/* 1. Hero Section */}
      <section className="relative pt-6 pb-10 border-b border-border space-y-6">
       
        <div className="space-y-3 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-fg tracking-tight leading-tight">
            Universal Design System & Enterprise UI Substrate
          </h1>
          <p className="text-sm sm:text-base text-muted-fg leading-relaxed">
            High-performance React UI component platform built on Adobe's React Aria Components primitives,
            featuring zero-runtime CSS-in-JS, compound family ergonomics, state-aware slot architecture,
            and soothing eye-friendly optical tokens.
          </p>
        </div>

        {/* Hero Actions & Quick Install Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Quick Install Pill */}
          <div className="flex items-center rounded-base border border-border bg-secondary/80 p-1 text-xs font-mono shadow-2xs">
            <div className="flex items-center gap-1 px-2 text-muted-fg">
              <Terminal className="w-3.5 h-3.5 text-primary" />
              <span className="text-fg">{installCmds[packageManager]}</span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(installCmds[packageManager], 'install')}
              className="p-1.5 rounded-micro bg-bg hover:bg-muted text-muted-fg hover:text-fg transition-colors cursor-pointer border border-border/60"
              title="Copy installation command"
            >
              {copiedCmd === 'install' ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Quick Search Trigger */}
          <button
            type="button"
            onClick={handleOpenSearch}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-base border border-border bg-secondary hover:bg-secondary/80 text-secondary-fg text-xs font-medium transition-all cursor-pointer shadow-2xs"
          >
            <Search className="w-3.5 h-3.5 text-primary" />
            <span>Search Documentation</span>
            <Kbd>⌘K</Kbd>
          </button>

          {/* Architecture Spec Button */}
          <button
            type="button"
            onClick={() => navigate('/documentation')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-base border border-border bg-secondary hover:bg-secondary/80 text-secondary-fg text-xs font-medium transition-all cursor-pointer shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-primary" />
            <span>Architecture Spec (README)</span>
          </button>

          {/* Jump to Components */}
          <button
            type="button"
            onClick={() => handleSelectComponent('button')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-base bg-primary hover:bg-primary/90 text-primary-fg text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <span>Explore Button Docs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* 2. Key Architecture Pillars */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-bold text-fg tracking-tight">Core Architecture Pillars</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Accessibility */}
          <div className="p-5 rounded-macro border border-border bg-overlay/30 backdrop-blur-sm space-y-3 hover:border-primary/40 transition-colors shadow-2xs">
            <div className="w-8 h-8 rounded-base bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-fg tracking-tight">Bulletproof Accessibility</h3>
            <p className="text-xs text-muted-fg leading-relaxed">
              Powered by React Aria Components primitives with full WCAG 2.1 AA conformance, automatic focus trapping, ARIA semantics, and keyboard navigation.
            </p>
          </div>

          {/* Card 2: Compound Ergonomics & Slots */}
          <div className="p-5 rounded-macro border border-border bg-overlay/30 backdrop-blur-sm space-y-3 hover:border-primary/40 transition-colors shadow-2xs">
            <div className="w-8 h-8 rounded-base bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-fg tracking-tight">Compound Families & Slots</h3>
            <p className="text-xs text-muted-fg leading-relaxed">
              Subcomponents attach directly to parent namespaces (e.g. <code className="text-primary font-mono text-[11px]">Field.Label</code>, <code className="text-primary font-mono text-[11px]">Sidebar.Header</code>) with overridable, state-aware slot architecture.
            </p>
          </div>

          {/* Card 3: Soothing Optical Engine */}
          <div className="p-5 rounded-macro border border-border bg-overlay/30 backdrop-blur-sm space-y-3 hover:border-primary/40 transition-colors shadow-2xs">
            <div className="w-8 h-8 rounded-base bg-primary/10 text-primary flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-fg tracking-tight">Soothing Optical System</h3>
            <p className="text-xs text-muted-fg leading-relaxed">
              Eye-friendly warm alabaster/graphite light mode, deep velvety slate dark mode, calibrated radius tokens (<code className="text-primary font-mono text-[11px]">0.625rem</code>), and density scaling (<code className="text-primary font-mono text-[11px]">0.85 – 1.15</code>).
            </p>
          </div>
        </div>
      </section>

      {/* 3. Component Fleet Explorer Grid */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-bold text-fg tracking-tight">Component Fleet Explorer</h2>
            <span className="px-2 py-0.5 rounded-micro text-2xs font-mono font-medium bg-muted text-muted-fg border border-border">
              {filteredSpecs.length} families
            </span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 p-0.5 rounded-base bg-secondary border border-border/70 text-xs overflow-x-auto">
            {categories.map((cat) => {
              const isSelected = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-micro font-medium transition-all cursor-pointer whitespace-nowrap text-xs flex items-center gap-1.5",
                    isSelected
                      ? "bg-primary text-primary-fg shadow-2xs font-semibold"
                      : "text-muted-fg hover:text-fg"
                  )}
                >
                  <span>{cat.label}</span>
                  <span className={cn("text-[10px] font-mono px-1 rounded", isSelected ? "bg-primary-fg/20 text-primary-fg" : "bg-muted text-muted-fg")}>
                    {cat.count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Component Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSpecs.map((spec) => {
            const subCount = spec.subcomponents?.length || 0
            return (
              <div
                key={spec.id}
                onClick={() => handleSelectComponent(spec.id)}
                className="p-5 rounded-macro border border-border/80 bg-overlay/30 backdrop-blur-sm hover:border-primary/50 hover:bg-overlay/60 transition-all cursor-pointer group flex flex-col justify-between space-y-4 shadow-2xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-base bg-primary/10 group-hover:bg-primary group-hover:text-primary-fg text-primary transition-colors flex items-center justify-center">
                        <Box className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-sm text-fg group-hover:text-primary transition-colors">
                        {spec.name}
                      </span>
                    </div>
                    {subCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-micro text-[10px] font-mono bg-muted text-muted-fg border border-border/60">
                        +{subCount} subparts
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-fg line-clamp-2 leading-relaxed">
                    {spec.summary || `Interactive ${spec.name} component documentation and live playground.`}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-2xs text-muted-fg font-medium">
                  <span className="font-mono text-primary/80 group-hover:text-primary">
                    &lt;{spec.name} /&gt;
                  </span>
                  <div className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-primary font-semibold">
                    <span>Explore Docs</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 4. Quick Start & Provider Setup */}
      <section className="space-y-4 pt-6 border-t border-border">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-bold text-fg tracking-tight">Quick Start Setup</h2>
        </div>
        <p className="text-xs text-muted-fg">
          Wrap your application root with <code className="text-primary font-mono text-[11px]">&lt;ThemeProvider&gt;</code> to activate the optical tokens, dark/light transitions, and density management.
        </p>
        <CodeViewer code={quickStartCode} title="App.tsx — Provider Setup" />
      </section>
    </div>
  )
}
