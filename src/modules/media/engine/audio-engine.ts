import { BaseEngine } from '../../../core/engine'
import {
  createAudioAnalyser,
  getLiveBands,
  type AudioAnalyserInstance,
  type LiveBandData,
  analyseAudioBuffer,
} from './analyser'
import { createAudioContext, resumeAudioContext } from './context'
import { AudioPlayerEngine, type AudioPlayerEngineOptions } from './player-engine'
import {
  AudioRecorderEngine,
  audioBufferToWav,
  concatAudioBuffers,
  type AudioRecorderOptions,
} from './recorder-engine'
import {
  clampPlaybackRate,
  clampVolume,
} from './security'
import type {
  AudioPlaybackState,
  AudioRecordingResult,
  AudioRecordingStatus,
  AudioSourceInput,
  AudioTrack,
  MultiBandVolumeOptions,
} from './types'

export interface AudioEngineOptions<TData = unknown> extends AudioPlayerEngineOptions<TData> {
  recorderOptions?: AudioRecorderOptions
  enableAnalyser?: boolean
}

export interface AudioEngineState<TData = unknown> {
  // Playback Slice
  status: AudioPlaybackState
  activeTrack: AudioTrack<TData> | null
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  playbackRate: number
  isBuffering: boolean
  error: Error | MediaError | null

  // Recording Slice
  recordingStatus: AudioRecordingStatus
  recordingDuration: number
  recordingVolume: number
  recordingWaveformHistory: number[]
  activeDeviceId?: string

  // Analysis Slice
  liveBands: number[]
  liveVolume: number
  livePeak: number
  isSilent: boolean

  // Audio Buffer & Editing Slice
  loadedBuffer: AudioBuffer | null
}

export class AudioEngine<TData = unknown> extends BaseEngine<AudioEngineState<TData>> {
  // Sub-engines
  private player: AudioPlayerEngine<TData>
  private recorder: AudioRecorderEngine
  private analyserInstance: AudioAnalyserInstance | null = null
  private audioContext: AudioContext | null = null
  private analysisRafId: number | null = null

  constructor(options: AudioEngineOptions<TData> = {}) {
    const initialState: AudioEngineState<TData> = {
      status: 'idle',
      activeTrack: options.initialTrack ?? null,
      currentTime: 0,
      duration: options.initialTrack?.duration ?? 0,
      volume: clampVolume(options.volume ?? 1),
      isMuted: false,
      playbackRate: clampPlaybackRate(options.playbackRate ?? 1),
      isBuffering: false,
      error: null,

      recordingStatus: 'idle',
      recordingDuration: 0,
      recordingVolume: 0,
      recordingWaveformHistory: [],
      activeDeviceId: options.recorderOptions?.deviceId,

      liveBands: new Array(16).fill(0),
      liveVolume: 0,
      livePeak: 0,
      isSilent: true,

      loadedBuffer: null,
    }

    super(initialState)

    // Instantiate sub-engines
    this.player = new AudioPlayerEngine<TData>(options)
    this.recorder = new AudioRecorderEngine(options.recorderOptions)

    // Sync Player State
    this.player.subscribe(() => {
      const playerState = this.player.getState()
      this.setState({
        status: playerState.status,
        activeTrack: playerState.activeTrack,
        currentTime: playerState.currentTime,
        duration: playerState.duration,
        volume: playerState.volume,
        isMuted: playerState.isMuted,
        playbackRate: playerState.playbackRate,
        isBuffering: playerState.isBuffering,
        error: playerState.error,
      })
      this.emit('audio:change', this.state)
    })

    // Sync Recorder State
    this.recorder.subscribe(() => {
      const recorderState = this.recorder.getState()
      this.setState({
        recordingStatus: recorderState.status,
        recordingDuration: recorderState.duration,
        recordingVolume: recorderState.volume,
        recordingWaveformHistory: recorderState.waveformHistory,
        activeDeviceId: recorderState.activeDeviceId,
      })
      this.emit('recorder:change', recorderState)
    })

    // Setup Analyser if enabled
    if (options.enableAnalyser) {
      this.initAnalyser()
    }
  }

  /* ==========================================================================
     Playback Methods
     ========================================================================== */

  public async play(): Promise<void> {
    return this.player.play()
  }

  public pause(): void {
    this.player.pause()
  }

  public togglePlay(): void {
    this.player.togglePlay()
  }

  public stop(): void {
    this.player.pause()
    this.player.seek(0)
  }

  public seek(time: number): void {
    this.player.seek(time)
  }

  public seekRelative(deltaSeconds: number): void {
    const current = this.player.getState().currentTime
    this.player.seek(current + deltaSeconds)
  }

  public setVolume(volume: number): void {
    this.player.setVolume(volume)
  }

  public setMuted(muted: boolean): void {
    const currentMuted = this.player.getState().isMuted
    if (currentMuted !== muted) {
      this.player.toggleMute()
    }
  }

  public toggleMute(): void {
    this.player.toggleMute()
  }

  public setPlaybackRate(rate: number): void {
    this.player.setPlaybackRate(rate)
  }

  public async setSource(source: AudioSourceInput<TData> | null): Promise<void> {
    return this.player.setSource(source)
  }

  public async setTrack(track: AudioTrack<TData> | null): Promise<void> {
    return this.player.setTrack(track)
  }

  public attachElement(element: HTMLAudioElement): void {
    this.player.attachElement(element)
    this.initAnalyser(element)
  }

  public getAudioElement(): HTMLAudioElement | null {
    return this.player.getAudioElement()
  }

  /* ==========================================================================
     Recording Methods
     ========================================================================== */

  public async startRecording(deviceId?: string): Promise<MediaStream> {
    return this.recorder.start(deviceId)
  }

  public async stopRecording(): Promise<AudioRecordingResult> {
    return this.recorder.stop()
  }

  public pauseRecording(): void {
    this.recorder.pause()
  }

  public resumeRecording(): void {
    this.recorder.resume()
  }

  public cancelRecording(): void {
    this.recorder.cancel()
  }

  public getMediaStream(): MediaStream | null {
    return this.recorder.getStream()
  }

  /* ==========================================================================
     Live Analysis Methods
     ========================================================================== */

  private initAnalyser(element?: HTMLMediaElement): void {
    if (typeof window === 'undefined') return

    try {
      const source = element || this.player.getAudioElement()
      if (source) {
        if (this.analyserInstance) {
          this.analyserInstance.cleanup()
        }
        this.analyserInstance = createAudioAnalyser(source, {
          fftSize: 256,
          smoothingTimeConstant: 0.8,
        })
        this.startAnalysisLoop()
      }
    } catch {
      // Ignored for environments without AudioContext support
    }
  }

  private startAnalysisLoop(): void {
    if (this.analysisRafId) cancelAnimationFrame(this.analysisRafId)

    const update = () => {
      if (this.analyserInstance?.analyser) {
        const bandsData = getLiveBands(this.analyserInstance.analyser, 16)
        this.setState({
          liveBands: bandsData.bands,
          liveVolume: bandsData.volume,
          livePeak: bandsData.peak,
          isSilent: bandsData.isSilent,
        })
      }
      this.analysisRafId = requestAnimationFrame(update)
    }

    this.analysisRafId = requestAnimationFrame(update)
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyserInstance?.analyser ?? this.recorder.getAnalyser()
  }

  public getLiveBands(bandsCount = 16, options?: MultiBandVolumeOptions): number[] {
    const analyser = this.getAnalyser()
    if (!analyser) return this.state.liveBands.slice(0, bandsCount)
    return getLiveBands(analyser, bandsCount, options).bands
  }

  public getVolume(): number {
    return this.state.status === 'playing' ? this.state.liveVolume : this.state.recordingVolume
  }

  /* ==========================================================================
     Audio Editing & DSP Methods
     ========================================================================== */

  public async loadAudioBuffer(source: Blob | ArrayBuffer | string): Promise<AudioBuffer> {
    if (!this.audioContext) {
      this.audioContext = createAudioContext()
    }
    resumeAudioContext(this.audioContext)

    let arrayBuffer: ArrayBuffer
    if (typeof source === 'string') {
      const resp = await fetch(source)
      arrayBuffer = await resp.arrayBuffer()
    } else if (source instanceof Blob) {
      arrayBuffer = await source.arrayBuffer()
    } else {
      arrayBuffer = source
    }

    const buffer = await this.audioContext.decodeAudioData(arrayBuffer)
    this.setState({ loadedBuffer: buffer })
    return buffer
  }

  /**
   * Non-destructively trims an AudioBuffer to the specified time window.
   */
  public trim(startSeconds: number, endSeconds: number, sourceBuffer?: AudioBuffer): AudioBuffer {
    const buffer = sourceBuffer || this.state.loadedBuffer
    if (!buffer) throw new Error('No AudioBuffer loaded for trimming.')

    const ctx = this.audioContext || createAudioContext()
    const sampleRate = buffer.sampleRate
    const startOffset = Math.max(0, Math.floor(startSeconds * sampleRate))
    const endOffset = Math.min(buffer.length, Math.floor(endSeconds * sampleRate))
    const frameCount = Math.max(1, endOffset - startOffset)

    const trimmed = ctx.createBuffer(buffer.numberOfChannels, frameCount, sampleRate)
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const src = buffer.getChannelData(c)
      const dest = trimmed.getChannelData(c)
      for (let i = 0; i < frameCount; i++) {
        dest[i] = src[startOffset + i] ?? 0
      }
    }

    this.setState({ loadedBuffer: trimmed })
    return trimmed
  }

  /**
   * Concatenates multiple AudioBuffers into a single continuous AudioBuffer.
   */
  public concat(buffers: AudioBuffer[]): AudioBuffer {
    if (buffers.length === 0) throw new Error('No buffers provided to concatenate.')
    const ctx = this.audioContext || createAudioContext()
    let result = buffers[0]!
    for (let i = 1; i < buffers.length; i++) {
      const next = buffers[i]
      if (next) {
        result = concatAudioBuffers(ctx, result, next)
      }
    }
    this.setState({ loadedBuffer: result })
    return result
  }

  /**
   * Applies linear or decibel gain scaling to an AudioBuffer.
   */
  public applyGain(factor: number, sourceBuffer?: AudioBuffer): AudioBuffer {
    const buffer = sourceBuffer || this.state.loadedBuffer
    if (!buffer) throw new Error('No AudioBuffer loaded.')

    const ctx = this.audioContext || createAudioContext()
    const out = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate)

    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const src = buffer.getChannelData(c)
      const dest = out.getChannelData(c)
      for (let i = 0; i < buffer.length; i++) {
        dest[i] = Math.max(-1, Math.min(1, (src[i] ?? 0) * factor))
      }
    }

    this.setState({ loadedBuffer: out })
    return out
  }

  /**
   * Applies a linear fade-in effect to the start of an AudioBuffer.
   */
  public fadeIn(durationSeconds: number, sourceBuffer?: AudioBuffer): AudioBuffer {
    const buffer = sourceBuffer || this.state.loadedBuffer
    if (!buffer) throw new Error('No AudioBuffer loaded.')

    const ctx = this.audioContext || createAudioContext()
    const out = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate)
    const fadeSamples = Math.min(buffer.length, Math.floor(durationSeconds * buffer.sampleRate))

    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const src = buffer.getChannelData(c)
      const dest = out.getChannelData(c)
      for (let i = 0; i < buffer.length; i++) {
        const gain = i < fadeSamples ? i / fadeSamples : 1
        dest[i] = (src[i] ?? 0) * gain
      }
    }

    this.setState({ loadedBuffer: out })
    return out
  }

  /**
   * Applies a linear fade-out effect to the end of an AudioBuffer.
   */
  public fadeOut(durationSeconds: number, sourceBuffer?: AudioBuffer): AudioBuffer {
    const buffer = sourceBuffer || this.state.loadedBuffer
    if (!buffer) throw new Error('No AudioBuffer loaded.')

    const ctx = this.audioContext || createAudioContext()
    const out = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate)
    const fadeSamples = Math.min(buffer.length, Math.floor(durationSeconds * buffer.sampleRate))
    const startFade = buffer.length - fadeSamples

    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const src = buffer.getChannelData(c)
      const dest = out.getChannelData(c)
      for (let i = 0; i < buffer.length; i++) {
        const gain = i >= startFade ? Math.max(0, (buffer.length - i) / fadeSamples) : 1
        dest[i] = (src[i] ?? 0) * gain
      }
    }

    this.setState({ loadedBuffer: out })
    return out
  }

  /**
   * Normalizes audio volume peak to maximum headroom.
   */
  public normalize(targetPeak = 0.98, sourceBuffer?: AudioBuffer): AudioBuffer {
    const buffer = sourceBuffer || this.state.loadedBuffer
    if (!buffer) throw new Error('No AudioBuffer loaded.')

    let maxSample = 0
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const data = buffer.getChannelData(c)
      for (let i = 0; i < data.length; i++) {
        const abs = Math.abs(data[i] ?? 0)
        if (abs > maxSample) maxSample = abs
      }
    }

    if (maxSample === 0) return buffer
    const multiplier = targetPeak / maxSample
    return this.applyGain(multiplier, buffer)
  }

  /**
   * Reverses audio samples non-destructively.
   */
  public reverse(sourceBuffer?: AudioBuffer): AudioBuffer {
    const buffer = sourceBuffer || this.state.loadedBuffer
    if (!buffer) throw new Error('No AudioBuffer loaded.')

    const ctx = this.audioContext || createAudioContext()
    const out = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate)

    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const src = buffer.getChannelData(c)
      const dest = out.getChannelData(c)
      const len = buffer.length
      for (let i = 0; i < len; i++) {
        dest[i] = src[len - 1 - i] ?? 0
      }
    }

    this.setState({ loadedBuffer: out })
    return out
  }

  /**
   * Encodes the current AudioBuffer as a 16-bit PCM WAV Blob.
   */
  public exportAsWav(sourceBuffer?: AudioBuffer): Blob {
    const buffer = sourceBuffer || this.state.loadedBuffer
    if (!buffer) throw new Error('No AudioBuffer loaded for WAV export.')
    return audioBufferToWav(buffer)
  }

  /**
   * Downloads the current AudioBuffer as a WAV file.
   */
  public download(filename = 'audio-export.wav', sourceBuffer?: AudioBuffer): void {
    if (typeof window === 'undefined') return
    const blob = this.exportAsWav(sourceBuffer)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  /**
   * Analyzes the loaded AudioBuffer to generate amplitude peak arrays.
   */
  public getWaveformPeaks(targetBars = 100, sourceBuffer?: AudioBuffer): number[] {
    const buffer = sourceBuffer || this.state.loadedBuffer
    if (!buffer) return []
    return analyseAudioBuffer(buffer, targetBars)
  }

  /**
   * Destroys all sub-engines and cancels RAF loops.
   */
  public destroy(): void {
    if (this.analysisRafId) {
      cancelAnimationFrame(this.analysisRafId)
      this.analysisRafId = null
    }
    this.analyserInstance?.cleanup()
    this.player.destroy()
    this.recorder.destroy()
  }
}

// Backward-compatible exports
export { AudioPlayerEngine, AudioRecorderEngine }

