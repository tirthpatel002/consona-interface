import {
  DEFAULT_AUDIO_ACCEPT,
  DEFAULT_MAX_AUDIO_BYTES,
  type AudioEngineError,
  type AudioSourceConstraints,
} from './types'

const BLOCKED_PROTOCOLS = /^(javascript|vbscript|file|about):/i

export function toAudioEngineError(err: unknown, fallback = 'Audio error'): AudioEngineError {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as Error).message === 'string') {
    const native = err as { message: string; code?: number; name?: string }
    return {
      message: native.message || fallback,
      code: native.code,
      name: native.name,
    }
  }
  if (typeof MediaError !== 'undefined' && err instanceof MediaError) {
    return {
      message: mediaErrorMessage(err),
      code: err.code,
      name: 'MediaError',
    }
  }
  return { message: typeof err === 'string' ? err : fallback }
}

export function mediaErrorMessage(error: MediaError | null | undefined): string {
  if (!error) return 'Unknown audio error'
  switch (error.code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return 'Audio playback was aborted'
    case MediaError.MEDIA_ERR_NETWORK:
      return 'A network error interrupted audio loading'
    case MediaError.MEDIA_ERR_DECODE:
      return 'The audio file could not be decoded'
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return 'This audio source is not supported'
    default:
      return 'Unknown audio error'
  }
}

export function sanitizeAudioUrl(
  src: string,
  constraints: AudioSourceConstraints = {}
): string {
  const trimmed = src.trim()
  if (!trimmed) {
    throw new Error('Empty audio source')
  }
  if (BLOCKED_PROTOCOLS.test(trimmed)) {
    throw new Error('Blocked audio URL protocol')
  }

  if (trimmed.startsWith('blob:')) {
    if (constraints.allowBlobUrls === false) {
      throw new Error('Blob audio URLs are not allowed')
    }
    return trimmed
  }

  if (trimmed.startsWith('data:')) {
    if (constraints.allowDataUrls === false) {
      throw new Error('Data audio URLs are not allowed')
    }
    if (!/^data:(audio|video)\//i.test(trimmed)) {
      throw new Error('Data URLs must use an audio or video MIME type')
    }
    return trimmed
  }

  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../')
  ) {
    return trimmed
  }

  try {
    const base =
      typeof window !== 'undefined' ? window.location.href : 'https://localhost'
    const url = new URL(trimmed, base)
    if (!['http:', 'https:', 'blob:', 'data:'].includes(url.protocol)) {
      throw new Error(`Unsupported audio protocol: ${url.protocol}`)
    }
    return trimmed
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Unsupported')) throw err
    throw new Error('Invalid audio URL')
  }
}

export function isAllowedAudioMime(
  mime: string | undefined,
  accept: readonly string[] | string = DEFAULT_AUDIO_ACCEPT
): boolean {
  if (!mime) return true
  const normalized = mime.toLowerCase().split(';')[0]?.trim() || ''
  if (!normalized) return true
  if (normalized.startsWith('audio/')) return true

  const list = typeof accept === 'string' ? accept.split(',').map((s) => s.trim()) : [...accept]
  return list.some((item) => {
    const token = item.toLowerCase()
    if (token === 'audio/*') return normalized.startsWith('audio/')
    if (token.endsWith('/*')) return normalized.startsWith(token.slice(0, -1))
    if (token.startsWith('.')) return false
    return normalized === token
  })
}

export function assertAudioFile(
  file: Blob,
  constraints: AudioSourceConstraints = {}
): void {
  const maxBytes = constraints.maxBytes ?? DEFAULT_MAX_AUDIO_BYTES
  if (file.size > maxBytes) {
    throw new Error(`Audio file exceeds the ${Math.round(maxBytes / (1024 * 1024))}MB limit`)
  }
  if (file.type && !isAllowedAudioMime(file.type, constraints.accept ?? DEFAULT_AUDIO_ACCEPT)) {
    throw new Error(`Unsupported audio type: ${file.type}`)
  }
}

export function clampVolume(volume: number): number {
  if (!Number.isFinite(volume)) return 1
  return Math.min(1, Math.max(0, volume))
}

export function clampPlaybackRate(rate: number): number {
  if (!Number.isFinite(rate)) return 1
  return Math.min(4, Math.max(0.25, rate))
}

export function revokeObjectUrl(url: string | null | undefined): void {
  if (url && url.startsWith('blob:') && typeof URL !== 'undefined') {
    try {
      URL.revokeObjectURL(url)
    } catch {
      // already revoked
    }
  }
}
