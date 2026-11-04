'use client'

import { useCallback, useRef, useState } from 'react'
import { assertAudioFile } from '../engine/security'
import type {
  AudioSourceConstraints,
  AudioUploadProgress,
  AudioUploadResult,
  AudioUploader,
} from '../engine/types'

export interface UseAudioUploadOptions extends AudioSourceConstraints {
  uploader?: AudioUploader | null
}

export interface UseAudioUploadResult {
  upload: (file: Blob | File) => Promise<AudioUploadResult>
  cancel: () => void
  progress: AudioUploadProgress
  status: 'idle' | 'uploading' | 'success' | 'error'
  error: Error | null
  result: AudioUploadResult | null
  isUploading: boolean
}

const IDLE_PROGRESS: AudioUploadProgress = { loaded: 0, total: 0, percent: 0 }

export function useAudioUpload(options: UseAudioUploadOptions = {}): UseAudioUploadResult {
  const { uploader, ...constraints } = options
  const uploaderRef = useRef(uploader)
  uploaderRef.current = uploader
  const constraintsRef = useRef(constraints)
  constraintsRef.current = constraints

  const abortRef = useRef<AbortController | null>(null)
  const [progress, setProgress] = useState<AudioUploadProgress>(IDLE_PROGRESS)
  const [status, setStatus] = useState<UseAudioUploadResult['status']>('idle')
  const [error, setError] = useState<Error | null>(null)
  const [result, setResult] = useState<AudioUploadResult | null>(null)

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setStatus((prev) => (prev === 'uploading' ? 'idle' : prev))
  }, [])

  const upload = useCallback(async (file: Blob | File): Promise<AudioUploadResult> => {
    const activeUploader = uploaderRef.current
    if (!activeUploader) {
      throw new Error('No audio uploader provided. Pass `uploader` to useAudioUpload or the parent component.')
    }

    assertAudioFile(file, constraintsRef.current)
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setStatus('uploading')
    setError(null)
    setResult(null)
    setProgress({ loaded: 0, total: file.size, percent: 0 })

    try {
      const raw = await activeUploader(file, {
        signal: controller.signal,
        onProgress: (next) => {
          const total = next.total || file.size
          const loaded = next.loaded
          setProgress({
            loaded,
            total,
            percent: total > 0 ? Math.min(100, Math.round((loaded / (total || 1)) * 100)) : next.percent,
          })
        },
      })
      const normalized: AudioUploadResult = typeof raw === 'string' ? { url: raw } : raw
      setResult(normalized)
      setStatus('success')
      setProgress((prev) => ({ ...prev, percent: 100, loaded: prev.total || file.size }))
      return normalized
    } catch (err) {
      const next = err instanceof Error ? err : new Error(String(err))
      if (next.name !== 'AbortError') {
        setError(next)
        setStatus('error')
      } else {
        setStatus('idle')
      }
      throw next
    }
  }, [])

  return {
    upload,
    cancel,
    progress,
    status,
    error,
    result,
    isUploading: status === 'uploading',
  }
}
