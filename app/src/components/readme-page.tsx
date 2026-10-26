import React, { useState, useMemo } from 'react'
import {
  BookOpen,
  Check,
  Compass,
  Copy,
  FileText,
  Hash,
  Layers,
  Sparkles,
  Terminal,
  ArrowUp,
  ExternalLink,
  ChevronRight,
  Sliders,
} from 'lucide-react'
import {
  Badge,
  Button,
  ChapterScrubber,
  type ChapterScrubberItem,
  Kbd,
  Separator,
  cn,
} from '@consona/interface'
import { MarkdownViewer } from './markdown-viewer'
import rawReadme from '../../README.md?raw'

export interface ReadmePageProps {
  onSelectComponent?: (id: string) => void
}

export const ReadmePage: React.FC<ReadmePageProps> = ({ onSelectComponent }) => {
  const [copied, setCopied] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  // Extract headings for ChapterScrubber
  const chapters: ChapterScrubberItem[] = useMemo(() => {
    const lines: string[] = rawReadme.split('\n')
    const list: ChapterScrubberItem[] = []
    let sectionCount = 0

    lines.forEach((line: string) => {
      const match = line.match(/^(#{1,3})\s+(.+)$/)
      if (match) {
        sectionCount++
        const level = match[1].length
        const text = match[2].trim()
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-')

        list.push({
          id,
          title: text,
          meta: `H${level} • Section ${sectionCount}`,
          description: `Jump to "${text}"`,
          badge: (
            <Badge
              intent={level === 1 ? 'primary' : level === 2 ? 'secondary' : 'outline'}
              size="sm"
            >
              H{level}
            </Badge>
          ),
          icon: level === 1 ? <BookOpen className="w-4 h-4" /> : <FileText className="w-4 h-4" />,
        })
      }
    })
    return list
  }, [])

  const handleCopyRaw = async () => {
    try {
      await navigator.clipboard.writeText(rawReadme)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    const mainEl = document.querySelector('main')
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const wordCount = rawReadme.split(/\s+/).length
  const readingTime = Math.ceil(wordCount / 200)

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-24 animate-in fade-in duration-200 relative">
      {/* 1. Header Banner */}
      <header className="relative pt-4 pb-8 border-b border-border space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-base bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-fg tracking-tight">
                  Architecture & Design Specification
                </h1>
                <Badge intent="success" size="sm">
                  v1.0.0
                </Badge>
              </div>
              <p className="text-xs text-muted-fg font-mono mt-0.5">
                interface-enhanced-demo/README.md
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyRaw}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-base border border-border bg-secondary hover:bg-secondary/80 text-secondary-fg text-xs font-medium transition-all cursor-pointer shadow-2xs"
              title="Copy entire raw README Markdown"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-semibold">Copied Markdown</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Raw Markdown</span>
                </>
              )}
            </button>


          </div>
        </div>

        {/* Spec Meta Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-fg font-medium">
          <span className="px-2.5 py-1  text-muted-fg  font-mono text-[11px]">
            {rawReadme.split('\n').length} Lines
          </span>
          <span className="px-2.5 py-1  text-muted-fg font-mono text-[11px]">
            {wordCount.toLocaleString()} Words
          </span>
          <span className="px-2.5 py-1  text-muted-fg font-mono text-[11px]">
            ~{readingTime} Min Read
          </span>
          <span className="px-2.5 py-1 text-primary font-mono text-[11px] font-semibold">
            4-Tier Customization Architecture
          </span>
        </div>
      </header>

      {/* 2. Main Document Content */}
      <div className="w-full max-w-4xl mx-auto min-w-0 bg-overlay/20 border border-border/70 rounded-macro p-6 sm:p-10 shadow-xs">
        <MarkdownViewer content={rawReadme} />
      </div>

      {/* 3. Fixed Kinetic Chapter Scrubber Rail at Top-Right */}
      <aside className="hidden xl:flex fixed right-4 2xl:right-8 top-20 z-40 flex-col items-center">
  
          <ChapterScrubber
            chapters={chapters}
            orientation="vertical"
            side="left"
            rowHeight={8}
            peakLength={44}
            restLength={10}
            radius={3}
            currentIndex={currentIndex}
            onSelect={(chap, idx) => {
              setCurrentIndex(idx)
              scrollToSection(chap.id)
            }}
          />
      
      </aside>
    </div>
  )
}
