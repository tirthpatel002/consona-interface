import React from 'react'
import { isRegisteredType } from '../registry/registry-client'
import { useTypeInspector } from './type-inspector-modal'
import { ExternalLink } from 'lucide-react'

export interface TypeDisplayProps {
  typeString: string
  className?: string
}

export const TypeDisplay: React.FC<TypeDisplayProps> = ({ typeString, className }) => {
  const { inspectType } = useTypeInspector()

  if (!typeString) return <span className={className}>void</span>

  // Tokenize the type string by words / identifiers
  // e.g. "SpotlightOptions | null" -> ["SpotlightOptions", " | null"]
  // "SlotComponents<AudioRecorderSlots>" -> ["SlotComponents", "<", "AudioRecorderSlots", ">"]
  const parts: React.ReactNode[] = []
  const regex = /([A-Z][A-Za-z0-9_]*)|([^A-Z]+)/g
  let match
  let key = 0

  while ((match = regex.exec(typeString)) !== null) {
    const ident = match[1]
    const nonIdent = match[2]

    if (ident) {
      const isKnown = isRegisteredType(ident)
      if (isKnown) {
        parts.push(
          <button
            key={key++}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              inspectType(ident)
            }}
            className="inline-flex items-center align-middle gap-1 px-1.5 py-0.5 mx-0.5 rounded-micro bg-fg text-bg font-mono text-[10.5px] font-semibold tracking-tight shadow-xs hover:opacity-90 active:scale-95 transition-all duration-150 cursor-pointer select-none group leading-none"
            title={`Inspect definition: ${ident}`}
          >
            <span className="leading-none">{ident}</span>
            <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
          </button>
        )
      } else {
        parts.push(
          <span key={key++} className="text-fg/90">
            {ident}
          </span>
        )
      }
    } else if (nonIdent) {
      parts.push(
        <span key={key++} className="text-muted-fg/70">
          {nonIdent}
        </span>
      )
    }
  }

  return (
    <span className={`font-mono text-[11px] break-words leading-relaxed ${className || ''}`}>
      {parts}
    </span>
  )
}
