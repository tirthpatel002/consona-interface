import { useEffect, useRef, useState } from 'react'

export interface ClipboardOptions {
  timeout?: number
  writeText?: (value: string) => Promise<void>
  onCopy?: (value: string) => void
  onError?: (error: unknown) => void
}

export function useClipboard(options: ClipboardOptions = {}) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  const copy = async (value: string) => {
    try {
      if (options.writeText) {
        await options.writeText(value)
      } else {
        await navigator.clipboard.writeText(value)
      }
      setCopied(true)
      options.onCopy?.(value)
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(() => setCopied(false), options.timeout ?? 2000)
      return true
    } catch (err) {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
      setCopied(false)
      options.onError?.(err)
      return false
    }
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  return { copy, copied }
}
