import { assertAudioFile, revokeObjectUrl, sanitizeAudioUrl } from './security'
import type {
  AudioRecordingResult,
  AudioSourceConstraints,
  AudioSourceInput,
  AudioTrack,
  ResolvedAudioSource,
} from './types'

function isTrack<TData>(value: unknown): value is AudioTrack<TData> {
  return Boolean(value && typeof value === 'object' && 'src' in (value as object) && 'id' in (value as object))
}

function makeId(prefix: string, hint?: string | number): string {
  return `${prefix}-${hint ?? Math.random().toString(36).slice(2, 10)}`
}

function blobTitle(blob: Blob): string {
  return blob instanceof File && blob.name ? blob.name.replace(/\.[^.]+$/, '') : 'Audio file'
}

export function sourceIdentity(source: AudioSourceInput | null | undefined): string {
  if (!source) return ''
  if (typeof source === 'string') return `url:${source}`
  if (typeof MediaStream !== 'undefined' && source instanceof MediaStream) return `stream:${source.id}`
  if (typeof HTMLAudioElement !== 'undefined' && source instanceof HTMLAudioElement) {
    return `el:${source.src || source.currentSrc || 'attached'}`
  }
  if (typeof ArrayBuffer !== 'undefined' && source instanceof ArrayBuffer) {
    return `buf:${source.byteLength}`
  }
  if (typeof Blob !== 'undefined' && source instanceof Blob) {
    const file = source as File
    return `blob:${file.name || ''}:${source.size}:${file.lastModified || 0}:${source.type}`
  }
  if (isTrack(source)) return `track:${source.id}:${source.src}`
  const obj = source as Exclude<AudioSourceInput, string | Blob | MediaStream | HTMLAudioElement | ArrayBuffer | AudioTrack>
  if (obj.element) return sourceIdentity(obj.element)
  if (obj.stream) return sourceIdentity(obj.stream)
  if (obj.file) return sourceIdentity(obj.file)
  if (obj.src) return `url:${obj.src}`
  return 'empty'
}

export function resolveAudioSource<TData = unknown>(
  input: AudioSourceInput<TData> | null | undefined,
  constraints: AudioSourceConstraints = {}
): ResolvedAudioSource<TData> {
  const empty = (): ResolvedAudioSource<TData> => ({
    track: null,
    src: null,
    srcObject: null,
    element: null,
    revoke: () => {},
  })

  if (!input) return empty()

  if (typeof HTMLAudioElement !== 'undefined' && input instanceof HTMLAudioElement) {
    const src = input.src || input.currentSrc || ''
    return {
      track: src
        ? { id: makeId('el', src), src: sanitizeAudioUrl(src, constraints), title: 'Audio track' }
        : null,
      src: src || null,
      srcObject: (input.srcObject as MediaStream | null) ?? null,
      element: input,
      revoke: () => {},
    }
  }

  if (typeof MediaStream !== 'undefined' && input instanceof MediaStream) {
    return {
      track: { id: makeId('stream', input.id), src: '', title: 'Live stream' },
      src: null,
      srcObject: input,
      element: null,
      revoke: () => {},
    }
  }

  if (typeof ArrayBuffer !== 'undefined' && input instanceof ArrayBuffer) {
    const blob = new Blob([input], { type: 'audio/wav' })
    return resolveAudioSource(blob, constraints)
  }

  if (typeof Blob !== 'undefined' && input instanceof Blob) {
    assertAudioFile(input, constraints)
    const objectUrl = URL.createObjectURL(input)
    const title = blobTitle(input)
    return {
      track: {
        id: makeId('file', `${title}-${input.size}`),
        src: objectUrl,
        title,
        mimeType: input.type || undefined,
        duration: undefined,
      },
      src: objectUrl,
      srcObject: null,
      element: null,
      mimeType: input.type || undefined,
      revoke: () => revokeObjectUrl(objectUrl),
    }
  }

  if (typeof input === 'string') {
    const src = sanitizeAudioUrl(input, constraints)
    return {
      track: { id: src, src, title: 'Audio track' },
      src,
      srcObject: null,
      element: null,
      revoke: () => {},
    }
  }

  if (isTrack<TData>(input)) {
    const src = input.src ? sanitizeAudioUrl(input.src, constraints) : input.src
    return {
      track: { ...input, src },
      src,
      srcObject: null,
      element: null,
      mimeType: input.mimeType,
      revoke: () => {},
    }
  }

  const obj = input as {
    src?: string
    file?: Blob | File
    stream?: MediaStream
    element?: HTMLAudioElement
    type?: string
    title?: string
    artist?: string
    id?: string | number
    duration?: number
    data?: TData
  }

  if (obj.element) return resolveAudioSource(obj.element, constraints)
  if (obj.stream) return resolveAudioSource(obj.stream, constraints)
  if (obj.file) {
    const resolved = resolveAudioSource<TData>(obj.file, constraints)
    if (resolved.track) {
      resolved.track = {
        ...resolved.track,
        id: obj.id ?? resolved.track.id,
        title: obj.title ?? resolved.track.title,
        artist: obj.artist,
        duration: obj.duration ?? resolved.track.duration,
        mimeType: obj.type ?? resolved.track.mimeType,
        data: obj.data,
      }
    }
    return resolved
  }
  if (obj.src) {
    const src = sanitizeAudioUrl(obj.src, constraints)
    return {
      track: {
        id: obj.id ?? src,
        src,
        title: obj.title || 'Audio track',
        artist: obj.artist,
        duration: obj.duration,
        mimeType: obj.type,
        data: obj.data,
      },
      src,
      srcObject: null,
      element: null,
      mimeType: obj.type,
      revoke: () => {},
    }
  }

  return empty()
}

export async function probeAudioDuration(src: string): Promise<number> {
  if (typeof Audio === 'undefined') return 0
  return new Promise((resolve) => {
    const audio = new Audio()
    audio.preload = 'metadata'
    const done = (value: number) => {
      audio.removeAttribute('src')
      audio.load()
      resolve(value)
    }
    audio.onloadedmetadata = () => {
      done(Number.isFinite(audio.duration) ? audio.duration : 0)
    }
    audio.onerror = () => done(0)
    try {
      audio.src = sanitizeAudioUrl(src)
    } catch {
      done(0)
    }
  })
}

export async function recordingFromFile(
  file: Blob | File,
  constraints: AudioSourceConstraints = {}
): Promise<AudioRecordingResult> {
  assertAudioFile(file, constraints)
  const url = URL.createObjectURL(file)
  const duration = await probeAudioDuration(url)
  return {
    blob: file,
    url,
    duration,
    audioBuffer: null,
    waveform: [],
  }
}

export function revokeRecording(result: AudioRecordingResult | string | null | undefined): void {
  const url = typeof result === 'string' ? result : result?.url
  revokeObjectUrl(url)
}
