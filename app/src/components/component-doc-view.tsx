import React, { Component, type ReactNode } from 'react'
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Box,
  Check,
  Copy,
  HelpCircle,
  Layers,
  Shield,
  Sliders,
  Sparkles,
  Terminal,
  Wrench,
  Zap,
} from 'lucide-react'
import type { ComponentDocSpec } from '../docs/types'
import { listFamilyMembers, resolveAnyDoc, registry } from '../registry/registry-client'
import { PlaygroundCanvas } from './playground-canvas'
import { ExampleCard } from './example-card'
import { PropsTable } from './props-table'
import { SlotsTable } from './slots-table'
import { CodeViewer } from './code-viewer'
import { TypeDisplay } from './type-display'
import { cn, useNavigation } from '@consona/interface'
import { docsRegistry } from '../docs'

interface ErrorBoundaryProps {
  children: ReactNode
  fallbackTitle?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class DocErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Doc Error Boundary caught an error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-base border border-destructive/30 bg-destructive/5 text-destructive space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-5 h-5" />
            <span>Failed to render {this.props.fallbackTitle || 'component preview'}</span>
          </div>
          <p className="text-xs font-mono opacity-80">{this.state.error?.message}</p>
        </div>
      )
    }

    return this.props.children
  }
}

export interface ComponentDocViewProps {
  spec?: ComponentDocSpec
}

export const ComponentDocView: React.FC<ComponentDocViewProps> = ({ spec: propSpec } = {}) => {
  const { activeId, activeNode, params } = useNavigation()

  const resolvedSpec =
    propSpec ||
    (activeNode?.data?.spec as ComponentDocSpec) ||
    docsRegistry[params.id || activeId] ||
    docsRegistry[activeId] ||
    docsRegistry['button']

  const spec = resolvedSpec

  const resolvedMain =
    resolveAnyDoc(registry, spec.name) ||
    (spec.component && (spec.component as any).displayName
      ? resolveAnyDoc(registry, (spec.component as any).displayName)
      : undefined)

  const familyMembers = React.useMemo(
    () => listFamilyMembers(registry, resolvedMain?.id || spec.name, spec.subcomponents ?? []),
    [resolvedMain?.id, spec.name, spec.subcomponents]
  )

  const rootMemberId = familyMembers[0]?.id || resolvedMain?.id || spec.name
  const [copiedImport, setCopiedImport] = React.useState(false)
  const [selectedMember, setSelectedMember] = React.useState<string>(rootMemberId)
  const [extraMembers, setExtraMembers] = React.useState<typeof familyMembers>([])

  React.useEffect(() => {
    setSelectedMember(rootMemberId)
    setExtraMembers([])
  }, [rootMemberId])

  const schemaMembers = React.useMemo(() => {
    const seen = new Set(familyMembers.map((member) => member.id))
    return [...familyMembers, ...extraMembers.filter((member) => !seen.has(member.id))]
  }, [familyMembers, extraMembers])

  const activeMember =
    schemaMembers.find((member) => member.id === selectedMember) ?? schemaMembers[0]
  const activeMemberDoc = activeMember?.doc as any

  const openComponentSchema = (name: string) => {
    const existing = schemaMembers.find((member) => member.id === name || (member.doc as any)?.name === name)
    if (existing) {
      setSelectedMember(existing.id)
      return
    }
    const jumped = resolveAnyDoc(registry, name)
    if (!jumped) return
    setExtraMembers((prev) => [...prev, { id: jumped.id, displayName: jumped.id, kind: jumped.kind, doc: jumped.doc }])
    setSelectedMember(jumped.id)
  }

  const importStatement = `import { ${activeMember?.id || spec.name} } from '${activeMemberDoc?.module || '@consona/interface'}'`

  const handleCopyImport = async () => {
    try {
      await navigator.clipboard.writeText(importStatement)
      setCopiedImport(true)
      setTimeout(() => setCopiedImport(false), 2000)
    } catch {
      // fallback
    }
  }

  const category = activeMemberDoc?.category || 'core'
  const description = spec.summary || activeMemberDoc?.description || `${spec.name} UI Component`

  const isHook = activeMember?.kind === 'hook' || activeMember?.id.startsWith('use')
  const isEngine = activeMember?.kind === 'engine' || activeMember?.id.endsWith('Engine')
  const isProvider = activeMember?.kind === 'provider' || activeMember?.id.endsWith('Provider')
  const isComponent = !isHook && !isEngine && !isProvider

  return (
    <div className="space-y-12 w-full max-w-7xl mx-auto pb-20">
      {/* 1. Hero Header */}
      <div className="space-y-4 border-b border-border pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-fg tracking-tight">{spec.name}</h1>
            <span className="px-2.5 py-0.5 rounded-micro bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
              {category}
            </span>
            {spec.badge && (
              <span className="px-2 py-0.5 rounded-micro bg-accent/30 text-accent-fg text-xs font-medium">
                {spec.badge}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-fg font-mono">v1.0.0</span>
          </div>
        </div>

        <p className="text-base text-muted-fg leading-relaxed max-w-3xl">
          {description}
        </p>

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

      {/* 2. Interactive Live Playground */}
      {spec.playground && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-fg tracking-tight">Interactive Playground</h2>
          </div>
          <DocErrorBoundary fallbackTitle={`Playground for ${spec.name}`}>
            <PlaygroundCanvas
              config={spec.playground}
              componentName={spec.name}
              component={spec.component}
            />
          </DocErrorBoundary>
        </section>
      )}

      {/* 3. Curated Examples Fleet */}
      {spec.examples && spec.examples.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-fg tracking-tight">Examples & Recipes</h2>
            <span className="px-2 py-0.5 rounded-micro text-2xs font-mono font-medium bg-muted text-muted-fg border border-border">
              {spec.examples.length}
            </span>
          </div>
          <div className="space-y-6">
            {spec.examples.map((ex, idx) => (
              <DocErrorBoundary key={ex.id || idx} fallbackTitle={`Example: ${ex.title}`}>
                <ExampleCard
                  title={ex.title}
                  description={ex.description}
                  render={ex.render}
                  code={ex.code}
                  minHeight={ex.minHeight}
                  className={ex.className}
                />
              </DocErrorBoundary>
            ))}
          </div>
        </section>
      )}

      {/* 4. Downstream Extension & Recipes */}
      {spec.recipes && spec.recipes.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-fg tracking-tight">Downstream Customization (.extend)</h2>
            <span className="px-2 py-0.5 rounded-micro text-2xs font-mono font-medium bg-muted text-muted-fg border border-border">
              {spec.recipes.length}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {spec.recipes.map((rcp, idx) => (
              <div key={idx} className="space-y-2">
                <h4 className="text-sm font-semibold text-fg">{rcp.title}</h4>
                {rcp.description && <p className="text-xs text-muted-fg">{rcp.description}</p>}
                <CodeViewer code={rcp.code} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. API Reference (Props & Slots Tables dynamically loaded from AST registry) */}
      <section className="space-y-6 pt-6 border-t border-border">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-fg tracking-tight">API & Schema Reference</h2>
          {schemaMembers.length > 0 && (
            <span className="px-2 py-0.5 rounded-micro text-2xs font-mono font-medium bg-muted text-muted-fg border border-border">
              {schemaMembers.length}
            </span>
          )}
        </div>

        {/* Family Member Tab Switcher (Single row, never wraps) */}
        {schemaMembers.length > 1 && (
          <div className="flex flex-nowrap overflow-x-auto items-center gap-1.5 p-1 rounded-base bg-muted/60 border border-border w-full no-scrollbar">
            {schemaMembers.map((tab) => {
              const isSelected = (activeMember?.id || selectedMember) === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedMember(tab.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-micro text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer flex items-center gap-1.5",
                    isSelected
                      ? "bg-bg text-primary shadow-2xs border border-border font-bold"
                      : "text-muted-fg hover:text-fg hover:bg-muted"
                  )}
                >
                  <span>{tab.displayName}</span>
                  {tab.kind && tab.kind !== 'component' && (
                    <span className={cn(
                      "text-[9px] font-mono px-1 py-0.2 rounded-micro uppercase tracking-wider",
                      tab.kind === 'hook' ? "bg-blue-500/10 text-blue-500" :
                      tab.kind === 'engine' ? "bg-amber-500/10 text-amber-500" :
                      "bg-purple-500/10 text-purple-500"
                    )}>
                      {tab.kind}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Member Description Subheading */}
        {activeMember && (
          <div className="p-3.5 rounded-base bg-muted/30 border border-border/60 flex items-center justify-between gap-3">
            <span className="font-mono text-xs font-semibold text-fg">
              {isComponent ? `<${activeMember.id}>` : activeMember.id}
            </span>
            <span className="text-xs text-muted-fg">
              {activeMemberDoc?.description || 'No registry schema found for this family member.'}
            </span>
          </div>
        )}

        {/* A. COMPONENT API TABLES */}
        {isComponent && (
          <>
            {/* Props Table */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-muted-fg" />
                <h3 className="text-sm font-semibold text-fg">
                  Interface Properties for &lt;{activeMember?.id || selectedMember}&gt;
                </h3>
                {activeMemberDoc?.props && Object.keys(activeMemberDoc.props).length > 0 && (
                  <span className="px-1.5 py-0.2 rounded text-3xs font-mono font-medium bg-muted text-muted-fg border border-border/50">
                    {Object.keys(activeMemberDoc.props).length}
                  </span>
                )}
              </div>
              <PropsTable
                key={`props-${activeMember?.id || selectedMember}`}
                propsDoc={activeMemberDoc?.props}
              />
            </div>

            {/* Slots Table */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-fg">
                  Injectable Slots for &lt;{activeMember?.id || selectedMember}&gt;
                </h3>
                {activeMemberDoc?.slots && Object.keys(activeMemberDoc.slots).length > 0 && (
                  <span className="px-1.5 py-0.2 rounded text-3xs font-mono font-medium bg-muted text-muted-fg border border-border/50">
                    {Object.keys(activeMemberDoc.slots).length}
                  </span>
                )}
              </div>
              <SlotsTable
                key={`slots-${activeMember?.id || selectedMember}`}
                slotsDoc={activeMemberDoc?.slots}
                onOpenComponent={openComponentSchema}
              />
            </div>
          </>
        )}

        {/* B. HOOK API TABLES */}
        {isHook && (
          <div className="space-y-6">
            {/* Hook Parameters / Options */}
            {activeMemberDoc?.parameters && Object.keys(activeMemberDoc.parameters).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-fg">Hook Parameters & Options</h3>
                  <span className="px-1.5 py-0.2 rounded text-3xs font-mono font-medium bg-muted text-muted-fg border border-border/50">
                    {Object.keys(activeMemberDoc.parameters).length}
                  </span>
                </div>
                <PropsTable propsDoc={activeMemberDoc.parameters} />
              </div>
            )}

            {/* Hook Returned Actions */}
            {activeMemberDoc?.returns?.actions && Object.keys(activeMemberDoc.returns.actions).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-fg">Actions & Imperative Methods</h3>
                  <span className="px-1.5 py-0.2 rounded text-3xs font-mono font-medium bg-muted text-muted-fg border border-border/50">
                    {Object.keys(activeMemberDoc.returns.actions).length}
                  </span>
                </div>
                <PropsTable propsDoc={activeMemberDoc.returns.actions} />
              </div>
            )}

            {/* Hook Returned State */}
            {activeMemberDoc?.returns?.state && Object.keys(activeMemberDoc.returns.state).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-fg">Reactive State Model</h3>
                  <span className="px-1.5 py-0.2 rounded text-3xs font-mono font-medium bg-muted text-muted-fg border border-border/50">
                    {Object.keys(activeMemberDoc.returns.state).length}
                  </span>
                </div>
                <PropsTable propsDoc={activeMemberDoc.returns.state} />
              </div>
            )}

            {/* Hook Returned Aria & Interaction Props */}
            {activeMemberDoc?.returns?.ariaProps && Object.keys(activeMemberDoc.returns.ariaProps).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-fg">Interaction & DOM / Aria Prop Getters</h3>
                  <span className="px-1.5 py-0.2 rounded text-3xs font-mono font-medium bg-muted text-muted-fg border border-border/50">
                    {Object.keys(activeMemberDoc.returns.ariaProps).length}
                  </span>
                </div>
                <PropsTable propsDoc={activeMemberDoc.returns.ariaProps} />
              </div>
            )}

            {/* Hook Returned Helpers */}
            {activeMemberDoc?.returns?.helpers && Object.keys(activeMemberDoc.returns.helpers).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-fg">Helper Queries & Predicates</h3>
                  <span className="px-1.5 py-0.2 rounded text-3xs font-mono font-medium bg-muted text-muted-fg border border-border/50">
                    {Object.keys(activeMemberDoc.returns.helpers).length}
                  </span>
                </div>
                <PropsTable propsDoc={activeMemberDoc.returns.helpers} />
              </div>
            )}
          </div>
        )}

        {/* C. ENGINE API TABLES */}
        {isEngine && (
          <div className="space-y-6">
            {/* Engine Methods */}
            {activeMemberDoc?.methods && Object.keys(activeMemberDoc.methods).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-fg">Engine Public Methods & Commands</h3>
                  <span className="px-1.5 py-0.2 rounded text-3xs font-mono font-medium bg-muted text-muted-fg border border-border/50">
                    {Object.keys(activeMemberDoc.methods).length}
                  </span>
                </div>
                <div className="rounded-macro border border-border bg-overlay/30 overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border/80 bg-muted/40 text-muted-fg font-semibold">
                        <th className="py-3 px-4 w-[25%]">Method</th>
                        <th className="py-3 px-4 w-[35%]">Signature</th>
                        <th className="py-3 px-4 w-[15%]">Return</th>
                        <th className="py-3 px-4">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 font-sans">
                      {Object.entries(activeMemberDoc.methods).map(([name, method]: [string, any]) => (
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
                            {method.description || 'Executes engine command.'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Engine Reactive State */}
            {activeMemberDoc?.state && Object.keys(activeMemberDoc.state).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-fg">Reactive State Model</h3>
                  <span className="px-1.5 py-0.2 rounded text-3xs font-mono font-medium bg-muted text-muted-fg border border-border/50">
                    {Object.keys(activeMemberDoc.state).length}
                  </span>
                </div>
                <PropsTable propsDoc={activeMemberDoc.state} />
              </div>
            )}

            {/* Engine Events */}
            {activeMemberDoc?.events && Object.keys(activeMemberDoc.events).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-fg">Engine Emitted Events</h3>
                  <span className="px-1.5 py-0.2 rounded text-3xs font-mono font-medium bg-muted text-muted-fg border border-border/50">
                    {Object.keys(activeMemberDoc.events).length}
                  </span>
                </div>
                <PropsTable propsDoc={activeMemberDoc.events} />
              </div>
            )}
          </div>
        )}

        {/* D. PROVIDER API TABLES */}
        {isProvider && (
          <div className="space-y-6">
            {activeMemberDoc?.props && Object.keys(activeMemberDoc.props).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-muted-fg" />
                  <h3 className="text-sm font-semibold text-fg">Provider Properties</h3>
                  <span className="px-1.5 py-0.2 rounded text-3xs font-mono font-medium bg-muted text-muted-fg border border-border/50">
                    {Object.keys(activeMemberDoc.props).length}
                  </span>
                </div>
                <PropsTable propsDoc={activeMemberDoc.props} />
              </div>
            )}
            {activeMemberDoc?.contextValue && Object.keys(activeMemberDoc.contextValue).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-fg">Context Value Model</h3>
                  <span className="px-1.5 py-0.2 rounded text-3xs font-mono font-medium bg-muted text-muted-fg border border-border/50">
                    {Object.keys(activeMemberDoc.contextValue).length}
                  </span>
                </div>
                <PropsTable propsDoc={activeMemberDoc.contextValue} />
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
