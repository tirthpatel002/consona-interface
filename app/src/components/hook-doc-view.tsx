import React, { useState } from 'react'
import {
  Activity,
  Check,
  Code,
  Copy,
  Layers,
  Sparkles,
  Terminal,
  Zap,
  Sliders,
  Shield,
  HelpCircle,
} from 'lucide-react'
import type { HookDoc } from '@registry/types'
import { getHookDoc, getAllHooks } from '../registry/registry-client'
import { PropsTable } from './props-table'
import { CodeViewer } from './code-viewer'
import { TypeDisplay } from './type-display'

import { useNavigation } from '@consona/interface'

export interface HookDocViewProps {
  hookName?: string
  onSelectHook?: (name: string) => void
  onSelectProvider?: (name: string) => void
  onSelectComponent?: (compName: string) => void
}

export const HookDocView: React.FC<HookDocViewProps> = ({
  hookName: propHookName,
  onSelectHook,
  onSelectProvider,
  onSelectComponent,
}) => {
  const { params, activeNode, navigate } = useNavigation()
  const hookName = propHookName || params.name || activeNode?.data?.name || 'useTheme'

  const handleSelectHook = onSelectHook || ((h: string) => navigate(`/architecture/hooks/${h}`))
  const handleSelectProvider = onSelectProvider || ((p: string) => navigate(`/architecture/providers/${p}`))
  const handleSelectComponent = onSelectComponent || ((c: string) => navigate(`/components/${c}`))

  const [copiedImport, setCopiedImport] = useState(false)
  const doc = getHookDoc(hookName)
  const allHooks = getAllHooks()

  const importStatement = `import { ${hookName} } from '${doc?.module || '@consona/interface'}'`

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
    doc?.type === 'headless'
      ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400'
      : doc?.type === 'engine'
      ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
      : 'bg-primary/10 border-primary/30 text-primary dark:text-primary-400'

  const returnType = doc?.returns?.type || 'void'

  // Generate an automated usage example based on parameters and return shape
  const sampleParams = doc?.parameters
    ? Object.keys(doc.parameters)
        .map((p) => p)
        .join(', ')
    : ''

  const stateKeys = doc?.returns?.state ? Object.keys(doc.returns.state) : []
  const actionKeys = doc?.returns?.actions ? Object.keys(doc.returns.actions) : []
  const ariaKeys = doc?.returns?.ariaProps ? Object.keys(doc.returns.ariaProps) : []

  const sampleDestructuring = [
    ...stateKeys.slice(0, 3),
    ...actionKeys.slice(0, 2),
    ...ariaKeys.slice(0, 2),
  ].join(', ')

  const sampleUsage = `import React from 'react'
import { ${hookName} } from '${doc?.module || '@consona/interface'}'

export function ExampleConsumer() {
  ${
    sampleDestructuring
      ? `const { ${sampleDestructuring} } = ${hookName}(${sampleParams ? `{ /* options */ }` : ''})`
      : `const result = ${hookName}(${sampleParams ? `{ /* options */ }` : ''})`
  }

  return (
    <div className="p-4 border border-border rounded-base">
      <h4 className="font-bold">${hookName} Active</h4>
      ${stateKeys.length > 0 ? `<p>State: {JSON.stringify(${stateKeys[0]})}</p>` : ''}
    </div>
  )
}`

  return (
    <div className="space-y-12 w-full max-w-7xl mx-auto pb-20">
      {/* 1. Hero Header */}
      <div className="space-y-4 border-b border-border pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-fg tracking-tight font-mono">{hookName}</h1>
            <span
              className={`px-2.5 py-0.5 rounded-micro border text-xs font-semibold uppercase tracking-wider ${typeColor}`}
            >
              {doc?.type || 'Utility'} Hook
            </span>
            {doc?.module && (
              <span className="px-2 py-0.5 rounded-micro bg-muted text-muted-fg font-mono text-xs border border-border">
                {doc.module}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-fg font-mono">React 18 / 19 Primitive</span>
          </div>
        </div>

        <p className="text-sm text-muted-fg leading-relaxed max-w-4xl">
          {doc?.description || `React primitive hook ${hookName} for headless state and behavior.`}
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

      {/* 2. Usage Recipe */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-fg tracking-tight">Hook Invocation Pattern</h2>
        </div>
        <div className="rounded-macro overflow-hidden border border-border">
          <CodeViewer code={sampleUsage} />
        </div>
      </section>

      {/* 3. Hook Parameters */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-fg tracking-tight">Input Parameters & Options</h2>
          </div>
          <span className="text-xs text-muted-fg font-mono">
            {doc?.parameters ? Object.keys(doc.parameters).length : 0} arguments
          </span>
        </div>
        <PropsTable propsDoc={doc?.parameters} />
      </section>

      {/* 4. Return Shape (Broken down into state, actions, ariaProps, helpers) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-fg tracking-tight flex items-center gap-2">
              <span>Return Value:</span>
              <TypeDisplay typeString={returnType} />
            </h2>
          </div>
        </div>

        {/* State Fields */}
        {doc?.returns?.state && Object.keys(doc.returns.state).length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted-fg uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span>Reactive State Variables ({Object.keys(doc.returns.state).length})</span>
            </h3>
            <PropsTable propsDoc={doc.returns.state} />
          </div>
        )}

        {/* Action Methods */}
        {doc?.returns?.actions && Object.keys(doc.returns.actions).length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted-fg uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Action Methods & Mutators ({Object.keys(doc.returns.actions).length})</span>
            </h3>
            <PropsTable propsDoc={doc.returns.actions} />
          </div>
        )}

        {/* Accessibility Props */}
        {doc?.returns?.ariaProps && Object.keys(doc.returns.ariaProps).length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted-fg uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span>Accessibility & DOM Prop Bindings ({Object.keys(doc.returns.ariaProps).length})</span>
            </h3>
            <PropsTable propsDoc={doc.returns.ariaProps} />
          </div>
        )}

        {/* Helper Utilities */}
        {doc?.returns?.helpers && Object.keys(doc.returns.helpers).length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted-fg uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>Helper Utilities ({Object.keys(doc.returns.helpers).length})</span>
            </h3>
            <PropsTable propsDoc={doc.returns.helpers} />
          </div>
        )}
      </section>

      {/* 5. Quick Hook Directory */}
      <section className="pt-8 border-t border-border space-y-4">
        <h3 className="text-sm font-bold text-muted-fg uppercase tracking-wider">
          All Headless Hooks ({allHooks.length})
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {allHooks.map((h) => {
            const isSelected = h.name === hookName
            return (
              <button
                key={h.name}
                type="button"
                onClick={() => handleSelectHook(h.name)}
                className={`flex flex-col p-3 rounded-base border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary shadow-xs'
                    : 'border-border bg-overlay/20 hover:bg-overlay/60 text-fg hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono text-xs font-bold truncate">{h.name}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded-micro bg-muted text-muted-fg">
                    {h.type}
                  </span>
                </div>
                <span className="text-[11px] text-muted-fg truncate mt-1">
                  {h.returns?.type || 'void'}
                </span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
