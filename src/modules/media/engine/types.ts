/**
 * Universal types for the Consona Audio & Media Engine.
 * Completely provider-agnostic, runtime-safe, and AST-extractable.
 */

export type AudioPlaybackState =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'buffering'
  | 'ended'
  | 'error'

export type AudioRecordingStatus =
  | 'idle'
  | 'requesting-permission'
  | 'recording'
  | 'paused'
  | 'stopped'
  | 'error'

export type AgentState =
  | 'idle'
  | 'connecting'
  | 'initializing'
  | 'listening'
  | 'recording'
  | 'thinking'
  | 'processing'
  | 'speaking'
  | 'success'
  | 'error'
  | 'muted'

export interface AudioTrack<TData = unknown> {
  id: string | number
  src: string
  title?: string
  artist?: string
  album?: string
  artwork?: string
  duration?: number
  mimeType?: string
  data?: TData
}

/** Anything a parent or consumer can hand the player/recorder as "the audio". */
export type AudioSourceInput<TData = unknown> =
  | string
  | Blob
  | File
  | MediaStream
  | HTMLAudioElement
  | ArrayBuffer
  | AudioTrack<TData>
  | {
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

export interface AudioSourceConstraints {
  maxBytes?: number
  accept?: readonly string[] | string
  allowBlobUrls?: boolean
  allowDataUrls?: boolean
}

export interface ResolvedAudioSource<TData = unknown> {
  track: AudioTrack<TData> | null
  src: string | null
  srcObject: MediaStream | null
  element: HTMLAudioElement | null
  mimeType?: string
  revoke: () => void
}

export interface AudioEngineError {
  message: string
  code?: number
  name?: string
}

export interface AudioPlayerEvents<TData = unknown> {
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  onError?: (error: AudioEngineError) => void
  onTimeUpdate?: (time: number) => void
  onTrackChange?: (track: AudioTrack<TData> | null) => void
  onDurationChange?: (duration: number) => void
}

export interface AudioUploadProgress {
  loaded: number
  total: number
  percent: number
}

export interface AudioUploadResult {
  url: string
  id?: string | number
  duration?: number
  mimeType?: string
  data?: unknown
}

export type AudioUploader = (
  file: Blob | File,
  ctx: {
    onProgress?: (progress: AudioUploadProgress) => void
    signal?: AbortSignal
  }
) => Promise<AudioUploadResult | string>

export const DEFAULT_AUDIO_ACCEPT = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/ogg',
  'audio/webm',
  'audio/mp4',
  'audio/aac',
  'audio/flac',
  'audio/x-m4a',
  'audio/m4a',
  'video/webm',
] as const

export const DEFAULT_AUDIO_ACCEPT_ATTR =
  'audio/*,video/webm,.mp3,.wav,.ogg,.webm,.m4a,.aac,.flac,.mp4'

export const DEFAULT_MAX_AUDIO_BYTES = 50 * 1024 * 1024

export interface AudioAnalyserOptions {
  fftSize?: number
  smoothingTimeConstant?: number
  minDecibels?: number
  maxDecibels?: number
}

export interface MultiBandVolumeOptions {
  bands?: number
  loPass?: number
  hiPass?: number
  updateInterval?: number
  analyserOptions?: AudioAnalyserOptions
}

export interface AudioDevice {
  deviceId: string
  label: string
  groupId: string
}

export interface AudioRecordingResult {
  blob: Blob
  url: string
  duration: number
  audioBuffer?: AudioBuffer | null
  waveform: number[]
}

export interface BaseTranscriptSegment {
  segmentIndex: number
  text: string
}

export interface TranscriptWord extends BaseTranscriptSegment {
  kind: 'word'
  wordIndex: number
  startTime: number
  endTime: number
}

export interface TranscriptGap extends BaseTranscriptSegment {
  kind: 'gap'
}

export type TranscriptSegment = TranscriptWord | TranscriptGap

export interface TranscriptAlignment {
  characters?: string[]
  characterStartTimesSeconds?: number[]
  characterEndTimesSeconds?: number[]
  words?: Array<{
    word: string
    startTime: number
    endTime: number
  }>
}

export interface TranscriptCue {
  text: string
  startTime: number
  endTime: number
}

/** Plain text, word timings, cues, or a composed transcript. */
export type TranscriptInput =
  | string
  | TranscriptAlignment
  | TranscriptWord[]
  | TranscriptCue[]
  | ComposedTranscript
  | null
  | undefined

export interface ComposedTranscript {
  segments: TranscriptSegment[]
  words: TranscriptWord[]
  hasTimings?: boolean
}

export type TranscriptWordStatus = 'spoken' | 'unspoken' | 'current'
