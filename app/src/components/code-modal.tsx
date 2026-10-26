import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Code, X } from 'lucide-react'
import { CodeViewer } from './code-viewer'

export interface CodeModalProps {
  isOpen: boolean
  onClose: () => void
  code: string
  title: string
  description?: string
}

export const CodeModal: React.FC<CodeModalProps> = ({
  isOpen,
  onClose,
  code,
  title,
  description,
}) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.()
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      {/* Backdrop Click */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-3xl rounded-macro border border-border bg-overlay shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-micro bg-primary/10 text-primary">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-fg tracking-tight">{title}</h3>
              {description && (
                <p className="text-xs text-muted-fg mt-0.5 leading-normal">{description}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted-fg hover:text-fg rounded-micro hover:bg-muted transition-colors cursor-pointer"
            title="Close modal (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto bg-bg/80 flex-1">
          <CodeViewer code={code} title={title} className="max-h-[60vh] overflow-y-auto" />
        </div>
      </div>
    </div>,
    document.body
  )
}
