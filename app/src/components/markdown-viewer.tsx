import React, { useMemo } from 'react'
import {
  Copy,
  Check,
  Hash,
  Terminal,
  Info,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
} from 'lucide-react'
import { Badge, Button, Separator, cn } from '@consona/interface'
import { CodeViewer } from './code-viewer'

interface MarkdownViewerProps {
  content: string
  className?: string
  onHeadingExtract?: (headings: { id: string; text: string; level: number }[]) => void
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

/**
 * Format inline markdown: bold, italic, code, links, strikethrough
 */
function renderInline(text: string): React.ReactNode {
  // Regex tokens: inline code, bold, italic, link, plain
  const parts: React.ReactNode[] = []
  let remaining = text
  let keyIdx = 0

  while (remaining.length > 0) {
    // 1. Inline code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/)
    if (codeMatch) {
      parts.push(
        <code
          key={`code-${keyIdx++}`}
          className="px-1.5 py-0.5 rounded-micro bg-primary/10 text-primary font-mono text-[12px] font-medium border border-primary/20"
        >
          {codeMatch[1]}
        </code>
      )
      remaining = remaining.slice(codeMatch[0].length)
      continue
    }

    // 2. Bold: **text** or __text__
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/) || remaining.match(/^__([^_]+)__/)
    if (boldMatch) {
      parts.push(
        <strong key={`bold-${keyIdx++}`} className="font-bold text-fg">
          {renderInline(boldMatch[1])}
        </strong>
      )
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }

    // 3. Italic: *text* or _text_
    const italicMatch = remaining.match(/^\*([^*]+)\*/) || remaining.match(/^_([^_]+)_/)
    if (italicMatch) {
      parts.push(
        <em key={`italic-${keyIdx++}`} className="italic text-fg/90">
          {renderInline(italicMatch[1])}
        </em>
      )
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }

    // 4. Links: [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/)
    if (linkMatch) {
      const isExternal = linkMatch[2].startsWith('http')
      parts.push(
        <a
          key={`link-${keyIdx++}`}
          href={linkMatch[2]}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
        >
          <span>{linkMatch[1]}</span>
          {isExternal && <ExternalLink className="w-3 h-3 inline-block" />}
        </a>
      )
      remaining = remaining.slice(linkMatch[0].length)
      continue
    }

    // 5. Strikethrough: ~~text~~
    const strikeMatch = remaining.match(/^~~([^~]+)~~/)
    if (strikeMatch) {
      parts.push(
        <del key={`strike-${keyIdx++}`} className="line-through text-muted-fg">
          {strikeMatch[1]}
        </del>
      )
      remaining = remaining.slice(strikeMatch[0].length)
      continue
    }

    // Plain text character
    // Find earliest markdown character
    const nextSpecial = remaining.search(/[`*_\[~]/)
    if (nextSpecial === -1) {
      parts.push(remaining)
      break
    } else if (nextSpecial === 0) {
      parts.push(remaining[0])
      remaining = remaining.slice(1)
    } else {
      parts.push(remaining.slice(0, nextSpecial))
      remaining = remaining.slice(nextSpecial)
    }
  }

  return parts
}

type BlockType =
  | { type: 'heading'; level: number; text: string; id: string }
  | { type: 'paragraph'; text: string }
  | { type: 'code'; language: string; code: string }
  | { type: 'blockquote'; lines: string[]; variant?: 'vision' | 'note' | 'tip' | 'warning' }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'hr' }

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  className = '',
  onHeadingExtract,
}) => {
  const blocks = useMemo(() => {
    const lines = content.split('\n')
    const parsedBlocks: BlockType[] = []
    const extractedHeadings: { id: string; text: string; level: number }[] = []

    let i = 0
    while (i < lines.length) {
      const line = lines[i]

      // 1. Code block fence
      if (line.trim().startsWith('```')) {
        const langMatch = line.trim().match(/^```(\w+)?/)
        const language = langMatch && langMatch[1] ? langMatch[1] : 'text'
        const codeLines: string[] = []
        i++
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i])
          i++
        }
        i++ // consume closing ```
        parsedBlocks.push({
          type: 'code',
          language,
          code: codeLines.join('\n'),
        })
        continue
      }

      // 2. Headings (#, ##, ###, ####)
      const headingMatch = line.match(/^(#{1,4})\s+(.+)$/)
      if (headingMatch) {
        const level = headingMatch[1].length
        const text = headingMatch[2].trim()
        const id = slugify(text)
        extractedHeadings.push({ id, text, level })
        parsedBlocks.push({
          type: 'heading',
          level,
          text,
          id,
        })
        i++
        continue
      }

      // 3. Horizontal rule (--- or ***)
      if (/^(\s*[-*_]\s*){3,}$/.test(line)) {
        parsedBlocks.push({ type: 'hr' })
        i++
        continue
      }

      // 4. Blockquote (> ...)
      if (line.trim().startsWith('>')) {
        const bqLines: string[] = []
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          bqLines.push(lines[i].replace(/^>\s?/, ''))
          i++
        }
        const fullBqText = bqLines.join(' ')
        let variant: 'vision' | 'note' | 'tip' | 'warning' | undefined
        if (fullBqText.toLowerCase().includes('vision:')) {
          variant = 'vision'
        } else if (fullBqText.toLowerCase().includes('note:')) {
          variant = 'note'
        } else if (fullBqText.toLowerCase().includes('tip:')) {
          variant = 'tip'
        } else if (fullBqText.toLowerCase().includes('warning:') || fullBqText.toLowerCase().includes('caution:')) {
          variant = 'warning'
        }
        parsedBlocks.push({
          type: 'blockquote',
          lines: bqLines,
          variant,
        })
        continue
      }

      // 5. Table (| ... |)
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const tableLines: string[] = []
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i].trim())
          i++
        }
        if (tableLines.length >= 2) {
          const parseRow = (rowStr: string) =>
            rowStr
              .slice(1, -1)
              .split('|')
              .map((c) => c.trim())
          const headers = parseRow(tableLines[0])
          // tableLines[1] is the delimiter row: | --- | --- |
          const rows = tableLines.slice(2).map(parseRow)
          parsedBlocks.push({
            type: 'table',
            headers,
            rows,
          })
          continue
        }
      }

      // 6. Unordered list (- or *)
      if (/^\s*[-*]\s+/.test(line)) {
        const items: string[] = []
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*[-*]\s+/, '').trim())
          i++
        }
        parsedBlocks.push({
          type: 'ul',
          items,
        })
        continue
      }

      // 7. Ordered list (1. 2. etc.)
      if (/^\s*\d+\.\s+/.test(line)) {
        const items: string[] = []
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*\d+\.\s+/, '').trim())
          i++
        }
        parsedBlocks.push({
          type: 'ol',
          items,
        })
        continue
      }

      // 8. Empty line
      if (line.trim() === '') {
        i++
        continue
      }

      // 9. Regular Paragraph
      const pLines: string[] = []
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !lines[i].trim().startsWith('#') &&
        !lines[i].trim().startsWith('```') &&
        !lines[i].trim().startsWith('>') &&
        !lines[i].trim().startsWith('|') &&
        !/^\s*[-*]\s+/.test(lines[i]) &&
        !/^\s*\d+\.\s+/.test(lines[i]) &&
        !/^(\s*[-*_]\s*){3,}$/.test(lines[i])
      ) {
        pLines.push(lines[i])
        i++
      }
      parsedBlocks.push({
        type: 'paragraph',
        text: pLines.join(' '),
      })
    }

    if (onHeadingExtract) {
      onHeadingExtract(extractedHeadings)
    }

    return parsedBlocks
  }, [content, onHeadingExtract])

  return (
    <div className={cn('space-y-6 text-fg leading-relaxed max-w-none', className)}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'heading': {
            const headingClasses = {
              1: 'text-2xl sm:text-3xl font-black tracking-tight text-fg pt-6 pb-2 border-b border-border/80 flex items-center group',
              2: 'text-xl sm:text-2xl font-extrabold tracking-tight text-fg pt-6 pb-1.5 flex items-center group',
              3: 'text-base sm:text-lg font-bold text-fg pt-4 pb-1 flex items-center group',
              4: 'text-sm font-bold text-fg pt-3 pb-0.5 flex items-center group',
            }[block.level as 1 | 2 | 3 | 4] || 'text-base font-bold'

            const anchor = (
              <a
                href={`#${block.id}`}
                className="opacity-0 group-hover:opacity-100 ml-2 text-muted-fg hover:text-primary transition-opacity"
                aria-label={`Link to ${block.text}`}
              >
                <Hash className="w-4 h-4 inline" />
              </a>
            )

            if (block.level === 1) {
              return (
                <h1 key={idx} id={block.id} className={headingClasses}>
                  <span>{renderInline(block.text)}</span>
                  {anchor}
                </h1>
              )
            }
            if (block.level === 2) {
              return (
                <h2 key={idx} id={block.id} className={headingClasses}>
                  <span>{renderInline(block.text)}</span>
                  {anchor}
                </h2>
              )
            }
            if (block.level === 3) {
              return (
                <h3 key={idx} id={block.id} className={headingClasses}>
                  <span>{renderInline(block.text)}</span>
                  {anchor}
                </h3>
              )
            }
            return (
              <h4 key={idx} id={block.id} className={headingClasses}>
                <span>{renderInline(block.text)}</span>
                {anchor}
              </h4>
            )
          }

          case 'paragraph':
            return (
              <p key={idx} className="text-sm sm:text-[14.5px] text-muted-fg leading-relaxed">
                {renderInline(block.text)}
              </p>
            )

          case 'code':
            return (
              <div key={idx} className="my-4">
                <CodeViewer
                  code={block.code}
                  language={block.language}
                  title={block.language.toUpperCase()}
                />
              </div>
            )

          case 'blockquote': {
            const isVision = block.variant === 'vision'
            const isWarning = block.variant === 'warning'
            const isTip = block.variant === 'tip'

            return (
              <div
                key={idx}
                className={cn(
                  'p-4 rounded-macro border my-4 space-y-2 text-xs sm:text-sm shadow-2xs backdrop-blur-sm',
                  isVision && 'border-primary/40 bg-primary/5 text-fg',
                  isWarning && 'border-amber-500/40 bg-amber-500/5 text-amber-200',
                  isTip && 'border-emerald-500/40 bg-emerald-500/5 text-emerald-200',
                  !block.variant && 'border-border bg-muted/30 text-muted-fg'
                )}
              >
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                  {isVision && <Sparkles className="w-4 h-4 text-primary" />}
                  {isWarning && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                  {isTip && <Lightbulb className="w-4 h-4 text-emerald-500" />}
                  {!block.variant && <Info className="w-4 h-4 text-muted-fg" />}
                  <span className={cn(isVision ? 'text-primary' : 'text-fg')}>
                    {isVision ? 'Vision & Architectural Directive' : isWarning ? 'Warning' : isTip ? 'Pro Tip' : 'Note'}
                  </span>
                </div>
                <div className="space-y-1.5 leading-relaxed text-fg/90">
                  {block.lines.map((l, lIdx) => (
                    <p key={lIdx}>{renderInline(l)}</p>
                  ))}
                </div>
              </div>
            )
          }

          case 'table':
            return (
              <div key={idx} className="my-5 overflow-x-auto rounded-base border border-border bg-overlay/30 shadow-2xs">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/60 text-fg font-bold">
                      {block.headers.map((h, hIdx) => (
                        <th key={hIdx} className="px-3.5 py-2.5 font-bold tracking-tight">
                          {renderInline(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {block.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-muted/30 transition-colors">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3.5 py-2.5 text-muted-fg align-top">
                            {renderInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )

          case 'ul':
            return (
              <ul key={idx} className="space-y-1.5 my-3 pl-5 list-disc text-xs sm:text-sm text-muted-fg">
                {block.items.map((item, itIdx) => (
                  <li key={itIdx} className="leading-relaxed">
                    {renderInline(item)}
                  </li>
                ))}
              </ul>
            )

          case 'ol':
            return (
              <ol key={idx} className="space-y-1.5 my-3 pl-5 list-decimal text-xs sm:text-sm text-muted-fg">
                {block.items.map((item, itIdx) => (
                  <li key={itIdx} className="leading-relaxed">
                    {renderInline(item)}
                  </li>
                ))}
              </ol>
            )

          case 'hr':
            return <hr key={idx} className="my-8 border-border/80" />

          default:
            return null
        }
      })}
    </div>
  )
}
