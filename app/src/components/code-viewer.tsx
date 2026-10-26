import React, { useState } from 'react'
import { Check, Copy, Terminal } from 'lucide-react'

export interface CodeViewerProps {
  code: string
  language?: string
  title?: string
  className?: string
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  language = 'tsx',
  title,
  className = '',
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <div className={`relative group rounded-base border border-border bg-bg/80 dark:bg-bg/60 backdrop-blur-md overflow-hidden font-mono text-xs ${className}`}>
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-border/60 bg-muted/40 text-muted-fg text-[11px]">
        <div className="flex items-center gap-2 font-medium">
          <Terminal className="w-3.5 h-3.5 text-primary" />
          <span>{title || language.toUpperCase()}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-micro bg-secondary/80 hover:bg-secondary text-secondary-fg text-[11px] font-sans font-medium transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-success" />
              <span className="text-success">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[12.5px] leading-relaxed text-fg/90 selection:bg-primary/20">
        <code>{code.trim()}</code>
      </pre>
    </div>
  )
}
