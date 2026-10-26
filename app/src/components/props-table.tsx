import React, { useState, useMemo } from 'react'
import type { ComponentPropDoc } from '@registry/types'
import { Check, Copy, Filter, Search } from 'lucide-react'
import { cn } from '@consona/interface'
import { TypeDisplay } from './type-display'

export interface PropsTableProps {
  propsDoc?: Record<string, ComponentPropDoc>
}

export const PropsTable: React.FC<PropsTableProps> = ({ propsDoc }) => {
  const [filterQuery, setFilterQuery] = useState('')
  const [copiedProp, setCopiedProp] = useState<string | null>(null)

  const entries = useMemo(() => {
    if (!propsDoc) return []
    const all = Object.entries(propsDoc)
    if (!filterQuery.trim()) return all
    const q = filterQuery.toLowerCase()
    return all.filter(
      ([name, doc]) =>
        name.toLowerCase().includes(q) ||
        doc.type.toLowerCase().includes(q) ||
        (doc.description && doc.description.toLowerCase().includes(q))
    )
  }, [propsDoc, filterQuery])

  if (!propsDoc || Object.keys(propsDoc).length === 0) {
    return (
      <div className="p-4 rounded-base border border-border/60 bg-muted/20 text-muted-fg text-xs italic">
        No specific interface properties defined (inherits standard HTML/RAC attributes).
      </div>
    )
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedProp(id)
    setTimeout(() => setCopiedProp(null), 1500)
  }

  return (
    <div className="space-y-3">
      {/* Quick Search Filter for Large Props Tables */}
      {Object.keys(propsDoc).length > 5 && (
        <div className="relative max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-fg pointer-events-none" />
          <input
            type="text"
            placeholder="Filter properties..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-base border border-border/70 bg-bg text-fg text-xs placeholder:text-muted-fg focus:outline-none focus:ring-1 focus:ring-ring transition-all"
          />
        </div>
      )}

      {/* Desktop / Tablet Table View (Hidden on Small Mobile) */}
      <div className="hidden md:block overflow-x-auto rounded-macro border border-border bg-overlay/30 backdrop-blur-sm shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 text-muted-fg font-semibold select-none">
              <th className="py-3 px-4 w-[22%] min-w-[140px]">Property</th>
              <th className="py-3 px-4 w-[33%] min-w-[200px]">Type</th>
              <th className="py-3 px-4 w-[12%] min-w-[90px]">Status</th>
              <th className="py-3 px-4">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 font-sans">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-muted-fg text-xs">
                  No properties matching "{filterQuery}"
                </td>
              </tr>
            ) : (
              entries.map(([name, doc]) => (
                <tr key={name} className="hover:bg-muted/30 transition-colors group">
                  {/* Property Name */}
                  <td className="py-3 px-4 font-mono font-semibold text-primary align-top">
                    <div className="flex items-center gap-1.5">
                      <span className="break-all">{name}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(name, name)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-fg hover:text-fg transition-opacity cursor-pointer"
                        title="Copy property name"
                      >
                        {copiedProp === name ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-3 px-4 font-mono text-[11px] align-top space-y-1.5">
                    <div className="inline-block max-w-full px-2 py-1 rounded-micro bg-secondary/80 border border-border/60 text-fg break-words font-medium">
                      <TypeDisplay typeString={doc.type} />
                    </div>
                    {doc.validValues && doc.validValues.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {doc.validValues.map((value) => (
                          <span
                            key={String(value)}
                            className="px-1.5 py-0.2 rounded-atom bg-primary/10 border border-primary/20 text-primary text-[10px]"
                          >
                            {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Required / Optional */}
                  <td className="py-3 px-4 align-top">
                    {doc.optional ? (
                      <span className="inline-flex px-1.5 py-0.5 rounded-micro bg-muted/60 text-muted-fg font-medium text-[10px]">
                        optional
                      </span>
                    ) : (
                      <span className="inline-flex px-1.5 py-0.5 rounded-micro bg-danger/10 border border-danger/20 text-danger font-semibold text-[10px]">
                        required
                      </span>
                    )}
                  </td>

                  {/* Description */}
                  <td className="py-3 px-4 text-fg/80 leading-relaxed align-top">
                    <p className="text-xs">{doc.description || '—'}</p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View (Visible on Screens < 768px) */}
      <div className="md:hidden space-y-2.5">
        {entries.length === 0 ? (
          <div className="p-4 text-center text-muted-fg text-xs bg-muted/20 rounded-base border border-border/60">
            No properties matching "{filterQuery}"
          </div>
        ) : (
          entries.map(([name, doc]) => (
            <div
              key={name}
              className="p-3.5 rounded-base border border-border bg-overlay/40 backdrop-blur-sm space-y-2 shadow-2xs"
            >
              {/* Header: Prop Name + Status Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-mono font-bold text-sm text-primary">
                  <span>{name}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(name, `m-${name}`)}
                    className="p-0.5 rounded text-muted-fg hover:text-fg transition-colors"
                  >
                    {copiedProp === `m-${name}` ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
                {doc.optional ? (
                  <span className="px-1.5 py-0.5 rounded-micro bg-muted/60 text-muted-fg font-medium text-[10px]">
                    optional
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded-micro bg-danger/10 border border-danger/20 text-danger font-semibold text-[10px]">
                    required
                  </span>
                )}
              </div>

              {/* Type Code Box */}
              <div className="p-2 rounded-micro bg-secondary/80 border border-border/60 font-mono text-[11px] text-fg break-words">
                <TypeDisplay typeString={doc.type} />
              </div>

              {/* Description */}
              {doc.description && (
                <p className="text-xs text-muted-fg leading-relaxed pt-0.5">
                  {doc.description}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
