import React, { useState } from 'react'
import { Terminal, Copy, Check, LucideIcon } from 'lucide-react'
import { Badge, Button } from '@consona/interface'

export interface PageHeaderBlockProps {
  title: string
  icon?: LucideIcon | React.ComponentType<{ className?: string }>
  iconColor?: string
  badge?: string
  badgeIntent?: 'primary' | 'secondary' | 'accent' | 'outline'
  version?: string
  description?: string
  importStatement?: string
  actions?: React.ReactNode
}

export const PageHeaderBlock: React.FC<PageHeaderBlockProps> = ({
  title,
  icon: Icon,
  iconColor = 'text-primary',
  badge,
  badgeIntent = 'outline',
  version = 'v1.0.0',
  description,
  importStatement,
  actions,
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!importStatement) return
    try {
      await navigator.clipboard.writeText(importStatement)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <div className="space-y-4 border-b border-border pb-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`p-2 rounded-base bg-muted/60 border border-border/80 ${iconColor}`}>
              <Icon className="w-6 h-6" />
            </div>
          )}
          <h1 className="text-3xl font-extrabold text-fg tracking-tight">{title}</h1>
          {badge && (
            <Badge intent={badgeIntent} size="sm" className="font-semibold uppercase tracking-wider">
              {badge}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          {actions}
          {version && <span className="text-xs text-muted-fg font-mono px-2 py-1 rounded bg-muted/40 border border-border/50">{version}</span>}
        </div>
      </div>

      {description && (
        <p className="text-base text-muted-fg leading-relaxed max-w-4xl">
          {description}
        </p>
      )}

      {importStatement && (
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-base border border-border bg-muted/40 font-mono text-xs max-w-full overflow-x-auto">
          <Terminal className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-fg truncate">{importStatement}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 text-muted-fg hover:text-fg transition-colors cursor-pointer shrink-0 ml-auto"
            title="Copy import statement"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  )
}
