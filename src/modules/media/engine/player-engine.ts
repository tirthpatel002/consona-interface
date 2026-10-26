import { BaseEngine } from '../../../core/engine'
import {
  clampPlaybackRate,
  clampVolume,
  sanitizeAudioUrl,
  toAudioEngineError,
} from './security'
import { resolveAudioSource, sourceIdentity } from './source'
import type {
  AudioPlaybackState,
  AudioPlayerEvents,
  AudioSourceConstraints,
  AudioSourceInput,
  AudioTrack,
} from './types'

export interface AudioPlayerEngineOptions<TData = unknown> {
  initialTrack?: AudioTrack<TData> | null
  source?: AudioSourceInput<TData> | null
  autoplay?: boolean
  volume?: number
  playbackRate?: number
  loop?: boolean
  preload?: 'none' | 'metadata' | 'auto'
  crossOrigin?: 'anonymous' | 'use-credentials' | null
  element?: HTMLAudioElement | null
  sourceConstraints?: AudioSourceConstraints
  events?: AudioPlayerEvents<TData>
}

export type AudioPlayerEngineListener<TData = unknown> = (state: AudioPlayerEngineState<TData>) => void

export interface AudioPlayerEngineState<TData = unknown> {
  activeTrack: AudioTrack<TData> | null
  status: AudioPlaybackState
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  playbackRate: number
  isBuffering: boolean
  error: MediaError | null
}

export class AudioPlayerEngine<TData = unknown> extends BaseEngine<AudioPlayerEngineState<TData>> {
  private audio: HTMLAudioElement | null = null
  private playPromise: Promise<void> | null = null
  private rafId: number | null = null
  private seeking = false
  private seekResetTimer: ReturnType<typeof setTimeout> | null = null
  private volumeBeforeMute = 1
  private ownedElement = true
  private sourceRevoke: (() => void) | null = null
  private sourceKey = ''
  private events: AudioPlayerEvents<TData>
  private sourceConstraints: AudioSourceConstraints
  private loop: boolean
  private preload: 'none' | 'metadata' | 'auto'
  private crossOrigin: 'anonymous' | 'use-credentials' | null

  constructor(options: AudioPlayerEngineOptions<TData> = {}) {
    const initialState: AudioPlayerEngineState<TData> = {
      activeTrack: options.initialTrack ?? null,
      status: 'idle',
      currentTime: 0,
      duration: options.initialTrack?.duration ?? 0,
      volume: clampVolume(options.volume ?? 1),
      isMuted: false,
      playbackRate: clampPlaybackRate(options.playbackRate ?? 1),
      isBuffering: false,
      error: null,
    }

    super(initialState)

    this.events = options.events ?? {}
    this.sourceConstraints = options.sourceConstraints ?? {}
    this.loop = options.loop ?? false
    this.preload = options.preload ?? 'auto'
    this.crossOrigin = options.crossOrigin ?? null

    if (typeof window !== 'undefined') {
      if (options.element) {
        this.attachElement(options.element)
      } else {
        this.initAudioElement()
      }
      if (options.source) {
        this.setSource(options.source)
      } else if (this.state.activeTrack) {
        this.applyTrack(this.state.activeTrack, null)
      }
      if (options.autoplay && (options.source || options.initialTrack)) {
        this.play().catch(() => {})
      }
    }
  }

  public setEvents(events: AudioPlayerEvents<TData>): void {
    this.events = events
  }

  public getAudioElement(): HTMLAudioElement | null {
    return this.audio
  }

  public attachElement(element: HTMLAudioElement): void {
    if (this.audio === element) return
    this.teardownAudio()
    this.audio = element
    this.ownedElement = false
    this.wireListeners(element)
    this.syncAudioAttributes(element)
  }

  private initAudioElement(): void {
    if (typeof Audio === 'undefined') return
    const audio = new Audio()
    this.audio = audio
    this.ownedElement = true
    this.wireListeners(audio)
    this.syncAudioAttributes(audio)
  }

  private syncAudioAttributes(audio: HTMLAudioElement): void {
    audio.volume = this.state.volume
    audio.playbackRate = this.state.playbackRate
    audio.loop = this.loop
    audio.preload = this.preload
    if (this.crossOrigin) {
      audio.crossOrigin = this.crossOrigin
    }
  }

  private wireListeners(audio: HTMLAudioElement): void {
    audio.addEventListener('play', this.handlePlay)
    audio.addEventListener('pause', this.handlePause)
    audio.addEventListener('ended', this.handleEnded)
    audio.addEventListener('timeupdate', this.handleTimeUpdate)
    audio.addEventListener('loadedmetadata', this.handleMetadata)
    audio.addEventListener('loadeddata', this.handleMetadata)
    audio.addEventListener('durationchange', this.handleDurationChange)
    audio.addEventListener('waiting', this.handleWaiting)
    audio.addEventListener('playing', this.handlePlaying)
    audio.addEventListener('canplay', this.handleCanPlay)
    audio.addEventListener('canplaythrough', this.handleCanPlay)
    audio.addEventListener('error', this.handleError)
  }

  private unwireListeners(audio: HTMLAudioElement): void {
    audio.removeEventListener('play', this.handlePlay)
    audio.removeEventListener('pause', this.handlePause)
    audio.removeEventListener('ended', this.handleEnded)
    audio.removeEventListener('timeupdate', this.handleTimeUpdate)
    audio.removeEventListener('loadedmetadata', this.handleMetadata)
    audio.removeEventListener('loadeddata', this.handleMetadata)
    audio.removeEventListener('durationchange', this.handleDurationChange)
    audio.removeEventListener('waiting', this.handleWaiting)
    audio.removeEventListener('playing', this.handlePlaying)
    audio.removeEventListener('canplay', this.handleCanPlay)
    audio.removeEventListener('canplaythrough', this.handleCanPlay)
    audio.removeEventListener('error', this.handleError)
  }

  private teardownAudio(): void {
    if (!this.audio) return
    this.stopTicker()
    this.unwireListeners(this.audio)
    if (this.ownedElement) {
      this.audio.pause()
      this.audio.removeAttribute('src')
      this.audio.load()
    }
    this.audio = null
  }

  public async setSource(input: AudioSourceInput<TData> | null): Promise<void> {
    const key = sourceIdentity(input)
    if (key && key === this.sourceKey && this.state.activeTrack) {
      if (input && typeof input === 'object' && ('title' in input || 'artist' in input)) {
        const inp = input as any
        const updatedTrack = {
          ...this.state.activeTrack,
          title: inp.title ?? this.state.activeTrack.title,
          artist: inp.artist ?? this.state.activeTrack.artist,
        }
        this.setState({ activeTrack: updatedTrack })
      }
      return
    }

    this.sourceRevoke?.()
    this.sourceRevoke = null
    this.sourceKey = key

    if (!input) {
      await this.applyTrack(null, null)
      this.events.onTrackChange?.(null)
      this.emit('audio:trackChange', { track: null })
      return
    }

    try {
      const resolved = resolveAudioSource<TData>(input, this.sourceConstraints)
      this.sourceRevoke = resolved.revoke
      if (resolved.element && resolved.element !== this.audio) {
        this.attachElement(resolved.element)
      }
      await this.applyTrack(resolved.track, resolved.srcObject)
      this.events.onTrackChange?.(resolved.track)
      this.emit('audio:trackChange', { track: resolved.track })
    } catch (err) {
      const error = toAudioEngineError(err, 'Failed to load audio source')
      this.setState({ status: 'error', error: this.audio?.error ?? null, isBuffering: false })
      this.events.onError?.(error)
      this.emit('audio:error', { error })
      throw err instanceof Error ? err : new Error(error.message)
    }
  }

  public async setTrack(track: AudioTrack<TData> | null): Promise<void> {
    await this.setSource(track)
  }

  private applyTrack(track: AudioTrack<TData> | null, srcObject: MediaStream | null): Promise<void> {
    if (!this.audio) return Promise.resolve()

    this.audio.pause()
    this.playPromise = null
    this.stopTicker()

    if (!track && !srcObject) {
      this.audio.removeAttribute('src')
      this.audio.srcObject = null
      this.setState({
        activeTrack: null,
        currentTime: 0,
        duration: 0,
        status: 'idle',
        isBuffering: false,
        error: null,
      })
      return Promise.resolve()
    }

    let safeSrc = track?.src ?? ''
    if (safeSrc) {
      try {
        safeSrc = sanitizeAudioUrl(safeSrc, this.sourceConstraints)
      } catch (err) {
        const error = toAudioEngineError(err, 'Blocked audio source')
        this.setState({ status: 'error', isBuffering: false, error: this.audio.error })
        this.events.onError?.(error)
        this.emit('audio:error', { error })
        return Promise.reject(err)
      }
    }

    const nextTrack = track ? { ...track, src: safeSrc } : null
    const initialDuration = nextTrack?.duration ?? (this.audio && Number.isFinite(this.audio.duration) && this.audio.duration > 0 ? this.audio.duration : 0)
    this.setState({
      activeTrack: nextTrack,
      currentTime: 0,
      duration: initialDuration,
      status: 'idle',
      isBuffering: false,
      error: null,
    })

    if (srcObject) {
      this.audio.srcObject = srcObject
    } else {
      this.audio.srcObject = null
      this.audio.src = safeSrc
    }
    this.audio.load()
    if (this.audio && Number.isFinite(this.audio.duration) && this.audio.duration > 0) {
      this.syncDuration()
    }
    return Promise.resolve()
  }

  public async play(track?: AudioTrack<TData> | null): Promise<void> {
    if (!this.audio) return

    if (track !== undefined && track !== null) {
      if (track.id !== this.state.activeTrack?.id || this.audio.src !== track.src) {
        await this.setSource(track)
      }
    } else if (this.state.activeTrack && !this.audio.src && !this.audio.srcObject) {
      await this.applyTrack(this.state.activeTrack, null)
    }

    if (this.playPromise) {
      try {
        await this.playPromise
      } catch {
        // Ignored
      }
    }

    try {
      this.playPromise = this.audio.play()
      await this.playPromise
      this.playPromise = null
      // Duration sync only — the 'play' audio event fires synchronously and
      // handlePlay already sets status:'playing' + starts the ticker.
      // Avoid a duplicate setState here to prevent spurious re-renders.
      const audioDuration = Number.isFinite(this.audio.duration) && this.audio.duration > 0 ? this.audio.duration : this.state.duration
      if (audioDuration !== this.state.duration) {
        this.setState({ duration: audioDuration })
      }
    } catch (err) {
      this.playPromise = null
      const interrupted =
        err instanceof DOMException && (err.name === 'AbortError' || err.name === 'NotAllowedError')
      if (!interrupted) {
        const audioErr = toAudioEngineError(err, 'Audio play failed')
        this.events.onError?.(audioErr)
        this.emit('audio:error', { error: audioErr })
      }
    }
  }

  public pause(): void {
    if (!this.audio) return
    this.audio.pause()
    this.playPromise = null
    // Do not call setState here — the 'pause' audio event fires and handlePause
    // is the single source of truth, preventing a double re-render.
    this.stopTicker()
  }

  public togglePlay(): void {
    if (this.state.status === 'playing') {
      this.pause()
    } else {
      this.play()
    }
  }

  public seek(timeInSeconds: number): void {
    if (!this.audio) return
    const maxDur = this.state.duration > 0
      ? this.state.duration
      : (Number.isFinite(this.audio.duration) && this.audio.duration > 0 ? this.audio.duration : Infinity)
    const clamped = Math.max(0, Math.min(maxDur, timeInSeconds))
    this.beginSeek()
    this.audio.currentTime = clamped
    this.setState({ currentTime: clamped })
    this.emit('audio:seek', { currentTime: clamped })
  }

  public setVolume(volume: number): void {
    if (!this.audio) return
    const clamped = clampVolume(volume)
    this.audio.volume = clamped
    if (clamped > 0) {
      this.volumeBeforeMute = clamped
      this.audio.muted = false
      this.setState({ volume: clamped, isMuted: false })
      this.emit('audio:volume', { volume: clamped })
      return
    }
    this.audio.muted = true
    this.setState({ volume: clamped, isMuted: true })
    this.emit('audio:volume', { volume: clamped })
  }

  public toggleMute(): void {
    if (!this.audio) return
    const nextMuted = !this.audio.muted
    this.audio.muted = nextMuted
    if (nextMuted) {
      this.volumeBeforeMute = this.audio.volume > 0 ? this.audio.volume : this.volumeBeforeMute
    } else if (this.audio.volume === 0) {
      this.audio.volume = this.volumeBeforeMute || 1
    }
    this.setState({
      isMuted: nextMuted,
      volume: this.audio.volume,
    })
    this.emit('audio:mute', { isMuted: nextMuted })
  }

  public setPlaybackRate(rate: number): void {
    if (!this.audio) return
    const clamped = clampPlaybackRate(rate)
    this.audio.playbackRate = clamped
    this.setState({ playbackRate: clamped })
    this.emit('audio:playbackRate', { playbackRate: clamped })
  }

  private startTicker() {
    if (this.rafId !== null) return
    let lastNotifiedWallTime = 0

    const tick = (now: number) => {
      if (this.audio && !this.audio.paused) {
        if (now - lastNotifiedWallTime >= 60) {
          lastNotifiedWallTime = now
          const updates: Partial<AudioPlayerEngineState<TData>> = {
            currentTime: this.audio.currentTime,
          }
          if (this.state.duration <= 0 && Number.isFinite(this.audio.duration) && this.audio.duration > 0) {
            updates.duration = this.audio.duration
          }
          this.setState(updates)
          this.events.onTimeUpdate?.(this.audio.currentTime)
        }
        this.rafId = requestAnimationFrame(tick)
      } else {
        this.rafId = null
      }
    }
    this.rafId = requestAnimationFrame(tick)
  }

  private stopTicker() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  private handlePlay = () => {
    // Guard: skip if already playing to avoid spurious re-renders
    if (this.state.status === 'playing' && !this.state.isBuffering) {
      this.startTicker()
      return
    }
    this.startTicker()
    this.setState({
      status: 'playing',
      isBuffering: false,
    })
    this.events.onPlay?.()
    this.emit('audio:play')
  }

  private handlePause = () => {
    if (this.seeking) return
    this.stopTicker()
    if (this.state.status !== 'ended' && this.state.status !== 'error' && this.state.status !== 'paused') {
      this.setState({ status: 'paused' })
      this.events.onPause?.()
      this.emit('audio:pause')
    }
  }

  private handleEnded = () => {
    this.stopTicker()
    this.setState({
      status: 'ended',
      currentTime: this.state.duration,
    })
    this.events.onEnded?.()
    this.emit('audio:ended')
  }

  private handleTimeUpdate = () => {
    if (this.rafId !== null) return
    if (this.audio) {
      this.setState({ currentTime: this.audio.currentTime })
      this.events.onTimeUpdate?.(this.audio.currentTime)
    }
  }

  private syncDuration(): void {
    if (this.audio && Number.isFinite(this.audio.duration) && this.audio.duration > 0) {
      if (this.state.duration !== this.audio.duration) {
        this.setState({ duration: this.audio.duration })
        this.events.onDurationChange?.(this.audio.duration)
        this.emit('audio:durationChange', { duration: this.audio.duration })
      }
    }
  }

  private handleMetadata = () => {
    if (this.audio && Number.isFinite(this.audio.duration)) {
      this.syncDuration()
      this.setState({
        isBuffering: this.state.status === 'playing' ? this.state.isBuffering : false,
        status: this.state.status === 'loading' ? 'paused' : this.state.status,
      })
    }
  }

  private handleDurationChange = () => {
    this.syncDuration()
  }

  private handleWaiting = () => {
    // Suppress buffering indicator during user-initiated seeks — the 'waiting'
    // event fires on every currentTime assignment, causing spinner flashes.
    if (this.seeking) return
    this.setState({ isBuffering: true })
    this.emit('audio:buffering', { isBuffering: true })
  }

  private handlePlaying = () => {
    this.syncDuration()
    // Guard: skip if already playing and not buffering to avoid spurious re-renders
    if (this.state.status === 'playing' && !this.state.isBuffering) return
    this.setState({ isBuffering: false, status: 'playing' })
  }

  private handleCanPlay = () => {
    this.syncDuration()
    // Guard: skip if already not buffering to avoid spurious re-renders
    if (!this.state.isBuffering) return
    this.setState({ isBuffering: false })
  }

  private handleError = () => {
    const error = toAudioEngineError(this.audio?.error, 'Audio load failed')
    this.setState({
      status: 'error',
      isBuffering: false,
      error: this.audio?.error ?? null,
    })
    this.events.onError?.(error)
    this.emit('audio:error', { error })
  }

  private beginSeek() {
    this.seeking = true
    if (this.seekResetTimer) clearTimeout(this.seekResetTimer)
    this.seekResetTimer = setTimeout(() => {
      this.seeking = false
    }, 150)
  }

  public override destroy(): void {
    super.destroy()
    this.teardownAudio()
    this.sourceRevoke?.()
    this.sourceRevoke = null
  }
}
