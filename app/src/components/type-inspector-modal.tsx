import React, { createContext, useContext, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Code,
  Copy,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
  Search,
  Box,
  CornerDownRight,
  ArrowLeft,
  FileCode,
} from 'lucide-react'
import { getTypeDoc, getAllTypes, isRegisteredType, type TypeDoc } from '../registry/registry-client'
import { Badge, Kbd } from '@consona/interface'
import { CodeViewer } from './code-viewer'

interface TypeInspectorContextValue {
  inspectType: (typeName: string) => void
  closeInspector: () => void
  currentType: string | null
  isOpen: boolean
}

const TypeInspectorContext = createContext<TypeInspectorContextValue | null>(null)

export const useTypeInspector = () => {
  const ctx = useContext(TypeInspectorContext)
  if (!ctx) {
    return {
      inspectType: () => {},
      closeInspector: () => {},
      currentType: null,
      isOpen: false,
    }
  }
  return ctx
}

export const TypeInspectorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [filterQuery, setFilterQuery] = useState('')
  const [copiedCode, setCopiedCode] = useState(false)

  const currentType = history[history.length - 1] || null
  const typeDoc = currentType ? getTypeDoc(currentType) : undefined

  const inspectType = (typeName: string) => {
    // Strip generics or array brackets if passed
    const cleanName = typeName.replace(/<[^>]+>/g, '').replace(/\[\]$/, '').trim()
    if (!cleanName) return

    setHistory((prev) => [...prev, cleanName])
    setIsOpen(true)
    setFilterQuery('')
  }

  const handlePop = () => {
    setHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : []))
    if (history.length <= 1) {
      setIsOpen(false)
    }
  }

  const handleJumpToHistoryIndex = (index: number) => {
    setHistory((prev) => prev.slice(0, index + 1))
  }

  const closeInspector = () => {
    setIsOpen(false)
    setHistory([])
  }

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } catch {
      // ignore
    }
  }

  const contextValue = useMemo(
    () => ({
      inspectType,
      closeInspector,
      currentType,
      isOpen,
    }),
    [currentType, isOpen]
  )

  // Filtered properties for current type
  const filteredProperties = useMemo(() => {
    if (!typeDoc?.properties) return []
    const entries = Object.entries(typeDoc.properties)
    if (!filterQuery.trim()) return entries
    const q = filterQuery.toLowerCase()
    return entries.filter(
      ([name, doc]) =>
        name.toLowerCase().includes(q) ||
        doc.type.toLowerCase().includes(q) ||
        (doc.description && doc.description.toLowerCase().includes(q))
    )
  }, [typeDoc, filterQuery])

  return (
    <TypeInspectorContext.Provider value={contextValue}>
      {children}

      {/* Type Inspector Modal */}
      {isOpen &&
        typeDoc &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
            <div className="fixed inset-0" onClick={closeInspector} aria-hidden="true" />

            <div className="relative w-full max-w-4xl max-h-[90vh] rounded-macro border border-border/80 bg-overlay/95 backdrop-blur-2xl text-fg shadow-2xl flex flex-col z-10 overflow-hidden animate-in zoom-in-95 duration-150 select-none">
              {/* Modal Header & Navigation Bar */}
              <div className="flex flex-col border-b border-border/70 bg-muted/30 p-4 gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {history.length > 1 && (
                      <button
                        type="button"
                        onClick={handlePop}
                        className="p-1.5 rounded-base hover:bg-muted text-muted-fg hover:text-fg transition-colors cursor-pointer mr-1"
                        title="Go back"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    )}

                    {/* History Breadcrumbs */}
                    <div className="flex items-center gap-1 text-xs font-mono">
                      {history.map((hName, idx) => {
                        const isLast = idx === history.length - 1
                        return (
                          <React.Fragment key={idx}>
                            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-fg shrink-0" />}
                            <button
                              type="button"
                              onClick={() => handleJumpToHistoryIndex(idx)}
                              className={`px-2 py-1 rounded-micro transition-all cursor-pointer font-bold ${
                                isLast
                                  ? 'bg-primary/20 text-primary border border-primary/30'
                                  : 'text-muted-fg hover:text-fg hover:bg-muted/60'
                              }`}
                            >
                              {hName}
                            </button>
                          </React.Fragment>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={closeInspector}
                      className="p-1.5 rounded-base hover:bg-muted text-muted-fg hover:text-fg transition-colors cursor-pointer"
                      title="Close Type Inspector (ESC)"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Type Identification Banner */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold font-mono text-fg">{typeDoc.name}</h2>
                    <span className="px-2 py-0.5 rounded-micro bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold uppercase">
                      {typeDoc.kind}
                    </span>
                    {typeDoc.module && (
                      <span className="px-2 py-0.5 rounded-micro bg-muted border border-border text-muted-fg text-xs font-mono">
                        {typeDoc.module}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-muted-fg font-mono">
                    {typeDoc.filePath}
                  </span>
                </div>

                {typeDoc.description && (
                  <p className="text-xs text-muted-fg leading-relaxed">
                    {typeDoc.description}
                  </p>
                )}
              </div>

              {/* Modal Body with Scroll */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 min-h-0">
                {/* 1. Union Values (If Union Type) */}
                {typeDoc.kind === 'union' && typeDoc.unionValues && typeDoc.unionValues.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-muted-fg uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>Possible Union Literals ({typeDoc.unionValues.length})</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {typeDoc.unionValues.map((val) => (
                        <div
                          key={val}
                          className="px-3 py-1.5 rounded-base border border-border bg-muted/40 font-mono text-xs font-medium text-fg flex items-center gap-1.5"
                        >
                          <span className="text-primary font-bold">"{val}"</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Structured Properties Table (If Interface or Object Type) */}
                {typeDoc.properties && Object.keys(typeDoc.properties).length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-muted-fg uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-primary" />
                        <span>Resolved Member Properties ({Object.keys(typeDoc.properties).length})</span>
                      </h3>

                      {Object.keys(typeDoc.properties).length > 4 && (
                        <div className="relative max-w-xs">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-fg pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Filter members..."
                            value={filterQuery}
                            onChange={(e) => setFilterQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1 rounded-base border border-border/70 bg-bg text-fg text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                        </div>
                      )}
                    </div>

                    <div className="overflow-x-auto rounded-macro border border-border bg-overlay/30">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-border/80 bg-muted/40 text-muted-fg font-semibold">
                            <th className="py-2.5 px-4 w-[25%] min-w-[140px]">Property</th>
                            <th className="py-2.5 px-4 w-[40%] min-w-[200px]">Type</th>
                            <th className="py-2.5 px-4 w-[12%] min-w-[80px]">Required</th>
                            <th className="py-2.5 px-4">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60 font-sans">
                          {filteredProperties.map(([name, pDoc]) => {
                            // Check if this property type contains another registered type
                            const innerTokens = pDoc.type.match(/[A-Z][A-Za-z0-9_]*/g) || []
                            const clickableToken = innerTokens.find((t) => isRegisteredType(t))

                            return (
                              <tr key={name} className="hover:bg-muted/30 transition-colors">
                                <td className="py-2.5 px-4 font-mono font-bold text-primary align-top">
                                  {name}
                                </td>
                                <td className="py-2.5 px-4 font-mono text-[11px] align-top text-fg">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span>{pDoc.type}</span>
                                    {clickableToken && clickableToken !== currentType && (
                                      <button
                                        type="button"
                                        onClick={() => inspectType(clickableToken)}
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-micro bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-[10px] cursor-pointer transition-colors"
                                        title={`Inspect nested type ${clickableToken}`}
                                      >
                                        <span>{clickableToken}</span>
                                        <ExternalLink className="w-2.5 h-2.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-4 font-mono text-[11px] align-top text-muted-fg">
                                  {pDoc.optional ? (
                                    <span className="text-muted-fg">Optional</span>
                                  ) : (
                                    <span className="text-primary font-bold">Required</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-4 text-xs text-muted-fg align-top">
                                  {pDoc.description || '-'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. Raw TypeScript Source Definition */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-muted-fg uppercase tracking-wider flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-primary" />
                      <span>Exact TypeScript Source Schema</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleCopy(typeDoc.rawDefinition)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-micro border border-border bg-muted/40 hover:bg-muted text-xs text-muted-fg hover:text-fg transition-colors cursor-pointer font-mono"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied' : 'Copy Definition'}</span>
                    </button>
                  </div>
                  <div className="rounded-macro overflow-hidden border border-border font-mono text-xs">
                    <CodeViewer code={typeDoc.rawDefinition} />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3 border-t border-border/70 bg-muted/20 flex items-center justify-between text-xs text-muted-fg">
                <div className="flex items-center gap-2">
                  <span className="font-mono">
                    {typeDoc.properties ? `${Object.keys(typeDoc.properties).length} members` : `${typeDoc.kind}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Press <Kbd>ESC</Kbd> or click outside to close</span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </TypeInspectorContext.Provider>
  )
}
