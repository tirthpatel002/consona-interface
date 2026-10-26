import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Code, Laptop, Maximize2, Minimize2, Smartphone, Tablet, X } from 'lucide-react'
import { CodeModal } from './code-modal'
import { CodeViewer } from './code-viewer'
import { cn } from '@consona/interface'

export interface ExampleCardProps {
  title: string
  description?: string
  render: () => React.ReactNode
  code?: string
  minHeight?: number | string
  className?: string
}

/** Mount example `render` as a component so hooks inside docs examples are legal. */
const ExampleRenderer: React.FC<{ renderFn: () => React.ReactNode }> = ({ renderFn: Render }) => {
  return <Render />
}

export const ExampleCard: React.FC<ExampleCardProps> = ({
  title,
  description,
  render,
  code,
  minHeight,
  className,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false)
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)
  const [fullscreenViewport, setFullscreenViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [showFullscreenCode, setShowFullscreenCode] = useState(false)

  // Lazy mount when entering viewport
  useEffect(() => {
    if (isVisible) return
    const el = containerRef.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '300px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [isVisible])

  // Manage body scroll lock during fullscreen inspection
  useEffect(() => {
    if (isFullscreenOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isFullscreenOpen])

  return (
    <div
      ref={containerRef}
      className={cn("rounded-macro border border-border bg-overlay/40 backdrop-blur-sm overflow-hidden shadow-xs", className)}
    >
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border/70 flex flex-wrap items-center justify-between gap-3 bg-muted/20">
        <div>
          <h3 className="text-sm font-semibold text-fg tracking-tight">{title}</h3>
          {description && (
            <p className="text-xs text-muted-fg mt-0.5 leading-normal">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Expand / Fullscreen Canvas */}
          <button
            type="button"
            onClick={() => setIsFullscreenOpen(true)}
            className="h-7 inline-flex items-center gap-1.5 px-2.5 rounded-base text-xs font-medium bg-secondary hover:bg-secondary/80 text-secondary-fg transition-colors cursor-pointer border border-border/60"
            title="Expand example to full-screen responsive preview"
          >
            <Maximize2 className="w-3.5 h-3.5 text-muted-fg" />
            <span className="hidden sm:inline">Expand</span>
          </button>

          {/* View Code Modal Button */}
          {code && (
            <button
              type="button"
              onClick={() => setIsCodeModalOpen(true)}
              className="h-7 inline-flex items-center gap-1.5 px-2.5 rounded-base text-xs font-medium bg-secondary hover:bg-secondary/80 text-secondary-fg transition-colors cursor-pointer border border-border/60"
              title="View source code snippet"
            >
              <Code className="w-3.5 h-3.5 text-primary" />
              <span>Code</span>
            </button>
          )}
        </div>
      </div>

      {/* Preview Area with customizable minHeight */}
      <div
        className="@container p-4 md:p-6 bg-bg/60 flex items-center justify-center relative overflow-auto transition-all min-w-0"
        style={{ minHeight: typeof minHeight === 'number' ? `${minHeight}px` : (minHeight || '160px') }}
      >
        <div className="@container w-full min-w-0 min-h-[20rem] flex items-center justify-center">
          {isVisible ? (
            <ExampleRenderer renderFn={render} />
          ) : (
            <div className="w-full h-48 flex items-center justify-center text-muted-fg/40 text-xs font-mono animate-pulse">
              Loading example preview...
            </div>
          )}
        </div>
      </div>

      {/* Code Modal Dialog */}
      {code && (
        <CodeModal
          isOpen={isCodeModalOpen}
          onClose={() => setIsCodeModalOpen(false)}
          code={code}
          title={`${title} — Source Code`}
          description={description}
        />
      )}

      {/* Fullscreen Responsive Inspection Overlay */}
      {isFullscreenOpen && createPortal(
        <div className="fixed inset-0 z-50 flex flex-col bg-bg/95 backdrop-blur-md animate-in fade-in duration-200">
          {/* Fullscreen Top Header */}
          <div className="px-6 py-3.5 border-b border-border bg-secondary/40 flex items-center justify-between gap-4 shrink-0">
            <div>
              <h2 className="text-sm font-bold text-fg tracking-tight">{title}</h2>
              {description && (
                <p className="text-xs text-muted-fg truncate max-w-md">{description}</p>
              )}
            </div>

            {/* Viewport Switcher & Actions */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center h-8 p-0.5 rounded-base bg-secondary border border-border/60">
                <button
                  type="button"
                  onClick={() => setFullscreenViewport('desktop')}
                  className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-micro transition-all cursor-pointer",
                    fullscreenViewport === 'desktop' ? "bg-primary text-primary-fg shadow-2xs" : "text-muted-fg hover:text-fg"
                  )}
                  title="Desktop viewport (100% width)"
                >
                  <Laptop className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setFullscreenViewport('tablet')}
                  className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-micro transition-all cursor-pointer",
                    fullscreenViewport === 'tablet' ? "bg-primary text-primary-fg shadow-2xs" : "text-muted-fg hover:text-fg"
                  )}
                  title="Tablet viewport (768px)"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setFullscreenViewport('mobile')}
                  className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-micro transition-all cursor-pointer",
                    fullscreenViewport === 'mobile' ? "bg-primary text-primary-fg shadow-2xs" : "text-muted-fg hover:text-fg"
                  )}
                  title="Mobile viewport (375px)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>

              {code && (
                <button
                  type="button"
                  onClick={() => setShowFullscreenCode(!showFullscreenCode)}
                  className={cn(
                    "h-8 inline-flex items-center gap-1.5 px-2.5 rounded-base text-xs font-semibold border transition-all cursor-pointer",
                    showFullscreenCode
                      ? "bg-primary text-primary-fg border-primary"
                      : "bg-secondary text-secondary-fg border-border/70 hover:bg-secondary/80"
                  )}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>{showFullscreenCode ? 'Hide Code' : 'Show Code'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsFullscreenOpen(false)}
                className="h-8 w-8 flex items-center justify-center text-muted-fg hover:text-fg rounded-base hover:bg-muted transition-colors cursor-pointer border border-border/60"
                title="Close fullscreen preview (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Fullscreen Canvas Body */}
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 p-6 md:p-12 overflow-y-auto flex items-center justify-center bg-bg/50">
              {fullscreenViewport === 'desktop' ? (
                <div className="@container w-full min-w-0 h-full min-h-[24rem] flex items-center justify-center">
                  <ExampleRenderer renderFn={render} />
                </div>
              ) : (
                <div
                  className={cn(
                    'transition-all duration-300 rounded-macro border border-border/80 bg-bg overflow-hidden flex flex-col',
                    fullscreenViewport === 'mobile' ? 'w-[375px] h-[680px]' : 'w-[768px] h-[720px]'
                  )}
                >
                  <div className="px-3.5 py-2 border-b border-border/60 bg-muted/40 flex items-center justify-between text-[11px] text-muted-fg font-mono select-none">
                    <span className="flex items-center gap-1.5">
                      {fullscreenViewport === 'mobile' ? (
                        <>
                          <Smartphone className="w-3.5 h-3.5 text-primary" />
                          <span>375px Mobile Frame</span>
                        </>
                      ) : (
                        <>
                          <Tablet className="w-3.5 h-3.5 text-primary" />
                          <span>768px Tablet Frame</span>
                        </>
                      )}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px]">Active</span>
                    </div>
                  </div>
                  <div className="@container p-3 flex-1 min-h-0 min-w-0 flex items-center justify-center overflow-auto bg-bg/60">
                    <ExampleRenderer renderFn={render} />
                  </div>
                </div>
              )}
            </div>

            {/* Side-by-side Code Drawer in Fullscreen Mode */}
            {showFullscreenCode && code && (
              <div className="w-96 border-l border-border bg-overlay p-5 overflow-y-auto flex flex-col gap-3 animate-in slide-in-from-right duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-fg">Source Code</span>
                </div>
                <CodeViewer code={code} className="flex-1 max-h-[80vh] overflow-y-auto" />
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
