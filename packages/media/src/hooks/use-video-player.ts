'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'

export interface UseVideoPlayerOptions {
  /** Autoplay video on load */
  autoPlay?: boolean
  /** Loop playback */
  loop?: boolean
  /** Initial volume between 0 and 1 */
  initialVolume?: number
  /** Initial muted state */
  initialMuted?: boolean
  /** Controls hide delay in ms (default 2500ms) */
  controlsTimeout?: number
  /** Callback fired when playback starts */
  onPlay?: () => void
  /** Callback fired when playback pauses */
  onPause?: () => void
  /** Callback fired when playback finishes */
  onEnded?: () => void
}

export interface UseVideoPlayerState {
  isPlaying: boolean
  isPaused: boolean
  isMuted: boolean
  volume: number
  currentTime: number
  duration: number
  progress: number
  isFullscreen: boolean
  isBuffering: boolean
  isControlsVisible: boolean
  isScrubbing: boolean
}

export interface UseVideoPlayerActions {
  play: () => Promise<void>
  pause: () => void
  togglePlay: () => void
  toggleMute: () => void
  setVolume: (volume: number) => void
  seek: (timeOrPercentage: number, isPercentage?: boolean) => void
  startScrubbing: () => void
  stopScrubbing: (commitTime?: number) => void
  toggleFullscreen: () => void
  showControls: () => void
  hideControls: () => void
  attachVideoRef: (el: HTMLVideoElement | null) => void
  attachContainerRef: (el: HTMLElement | null) => void
}

export interface UseVideoPlayerHelpers {
  formatTime: (seconds: number) => string
}

export interface UseVideoPlayerResult {
  videoRef: RefObject<HTMLVideoElement | null>
  containerRef: RefObject<HTMLElement | null>
  state: UseVideoPlayerState
  actions: UseVideoPlayerActions
  helpers: UseVideoPlayerHelpers
  ariaProps: {
    role: 'region'
    'aria-label': string
  }
}

export function formatVideoTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function useVideoPlayer(options: UseVideoPlayerOptions = {}): UseVideoPlayerResult {
  const {
    initialVolume = 1,
    initialMuted = false,
    controlsTimeout = 2500,
    onPlay: propOnPlay,
    onPause: propOnPause,
    onEnded: propOnEnded,
  } = options

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLElement | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isScrubbingRef = useRef(false)
  const wasPlayingOnScrubRef = useRef(false)
  const pendingSeekRef = useRef<number | null>(null)
  const seekingRafIdRef = useRef<number | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(initialMuted)
  const [volume, setVolumeState] = useState(initialVolume)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [isControlsVisible, setIsControlsVisible] = useState(true)
  const [isScrubbing, setIsScrubbing] = useState(false)

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const attachVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el
  }, [])

  const attachContainerRef = useCallback((el: HTMLElement | null) => {
    containerRef.current = el
  }, [])

  const showControls = useCallback(() => {
    setIsControlsVisible(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused && !isScrubbingRef.current) {
        setIsControlsVisible(false)
      }
    }, controlsTimeout)
  }, [controlsTimeout])

  const hideControls = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    if (isPlaying && !isScrubbingRef.current) {
      setIsControlsVisible(false)
    }
  }, [isPlaying])

  const play = useCallback(async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play()
      } catch (err) {
        console.warn('Video playback play() failed:', err)
      }
    }
  }, [])

  const pause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause()
    }
  }, [])

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.play().catch(() => {})
    } else {
      v.pause()
    }
  }, [])

  const toggleMute = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    const next = !v.muted
    v.muted = next
    setIsMuted(next)
  }, [])

  const setVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val))
    setVolumeState(clamped)
    const nextMuted = clamped === 0
    setIsMuted(nextMuted)
    const v = videoRef.current
    if (v) {
      v.volume = clamped
      v.muted = nextMuted
    }
  }, [])

  const startScrubbing = useCallback(() => {
    isScrubbingRef.current = true
    setIsScrubbing(true)
    setIsControlsVisible(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    const v = videoRef.current
    if (v) {
      wasPlayingOnScrubRef.current = !v.paused
      if (!v.paused) {
        v.pause()
      }
    }
  }, [])

  const stopScrubbing = useCallback((commitTime?: number) => {
    isScrubbingRef.current = false
    setIsScrubbing(false)
    const v = videoRef.current
    if (!v) return
    const maxDur = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : (duration || 0)
    const target = commitTime !== undefined ? commitTime : (pendingSeekRef.current !== null ? pendingSeekRef.current : v.currentTime)
    const clamped = Math.max(0, Math.min(maxDur, target))
    v.currentTime = clamped
    setCurrentTime(clamped)
    pendingSeekRef.current = null
    if (wasPlayingOnScrubRef.current) {
      v.play().catch(() => {})
    }
    showControls()
  }, [duration, showControls])

  const seek = useCallback((timeOrPercent: number, isPercent = false) => {
    const v = videoRef.current
    const maxDur = v && Number.isFinite(v.duration) && v.duration > 0 ? v.duration : (duration || 0)
    const targetTime = isPercent ? (timeOrPercent / 100) * maxDur : timeOrPercent
    const clamped = Math.max(0, Math.min(maxDur, targetTime))

    // Always keep React state immediately responsive (60fps)
    setCurrentTime(clamped)
    pendingSeekRef.current = clamped

    // If seeking while not explicitly marked as scrubbing, mark scrubbing
    if (!isScrubbingRef.current) {
      isScrubbingRef.current = true
      setIsScrubbing(true)
    }

    // Schedule RAF update to DOM video element to avoid decoder pipeline blocking
    if (!seekingRafIdRef.current) {
      seekingRafIdRef.current = requestAnimationFrame(() => {
        seekingRafIdRef.current = null
        if (videoRef.current && pendingSeekRef.current !== null) {
          try {
            if (typeof (videoRef.current as any).fastSeek === 'function') {
              ;(videoRef.current as any).fastSeek(pendingSeekRef.current)
            } else {
              videoRef.current.currentTime = pendingSeekRef.current
            }
          } catch {
            videoRef.current.currentTime = pendingSeekRef.current
          }
        }
      })
    }
  }, [duration])

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current || videoRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {})
    } else {
      document.exitFullscreen?.().catch(() => {})
    }
  }, [])

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  // Video HTML5 event listeners
  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    const onPlay = () => {
      setIsPlaying(true)
      setIsBuffering(false)
      propOnPlay?.()
    }
    const onPause = () => {
      setIsPlaying(false)
      propOnPause?.()
    }
    const onTimeUpdate = () => {
      if (!isScrubbingRef.current) {
        setCurrentTime(v.currentTime)
      }
    }
    const onLoadedMetadata = () => {
      if (Number.isFinite(v.duration) && v.duration > 0) {
        setDuration(v.duration)
      }
    }
    const onDurationChange = () => {
      if (Number.isFinite(v.duration) && v.duration > 0) {
        setDuration(v.duration)
      }
    }
    const onWaiting = () => setIsBuffering(true)
    const onPlaying = () => setIsBuffering(false)
    const onVolumeChange = () => {
      setIsMuted(v.muted)
      setVolumeState(v.volume)
    }
    const onEnded = () => {
      setIsPlaying(false)
      propOnEnded?.()
    }

    if (Number.isFinite(v.duration) && v.duration > 0) {
      setDuration(v.duration)
    }
    setVolumeState(v.volume)
    setIsMuted(v.muted)

    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('timeupdate', onTimeUpdate)
    v.addEventListener('loadedmetadata', onLoadedMetadata)
    v.addEventListener('durationchange', onDurationChange)
    v.addEventListener('waiting', onWaiting)
    v.addEventListener('playing', onPlaying)
    v.addEventListener('volumechange', onVolumeChange)
    v.addEventListener('ended', onEnded)

    return () => {
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('timeupdate', onTimeUpdate)
      v.removeEventListener('loadedmetadata', onLoadedMetadata)
      v.removeEventListener('durationchange', onDurationChange)
      v.removeEventListener('waiting', onWaiting)
      v.removeEventListener('playing', onPlaying)
      v.removeEventListener('volumechange', onVolumeChange)
      v.removeEventListener('ended', onEnded)
      if (seekingRafIdRef.current) {
        cancelAnimationFrame(seekingRafIdRef.current)
      }
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
      }
    }
  }, [propOnPlay, propOnPause, propOnEnded])

  // Show controls when paused
  useEffect(() => {
    if (!isPlaying) {
      setIsControlsVisible(true)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [isPlaying])

  const state = useMemo<UseVideoPlayerState>(
    () => ({
      isPlaying,
      isPaused: !isPlaying,
      isMuted,
      volume,
      currentTime,
      duration,
      progress,
      isFullscreen,
      isBuffering,
      isControlsVisible,
      isScrubbing,
    }),
    [
      isPlaying,
      isMuted,
      volume,
      currentTime,
      duration,
      progress,
      isFullscreen,
      isBuffering,
      isControlsVisible,
      isScrubbing,
    ]
  )

  const actions = useMemo<UseVideoPlayerActions>(
    () => ({
      play,
      pause,
      togglePlay,
      toggleMute,
      setVolume,
      seek,
      startScrubbing,
      stopScrubbing,
      toggleFullscreen,
      showControls,
      hideControls,
      attachVideoRef,
      attachContainerRef,
    }),
    [
      play,
      pause,
      togglePlay,
      toggleMute,
      setVolume,
      seek,
      startScrubbing,
      stopScrubbing,
      toggleFullscreen,
      showControls,
      hideControls,
      attachVideoRef,
      attachContainerRef,
    ]
  )

  const helpers = useMemo<UseVideoPlayerHelpers>(
    () => ({
      formatTime: formatVideoTime,
    }),
    []
  )

  const ariaProps = useMemo(
    () => ({
      role: 'region' as const,
      'aria-label': 'Video player',
    }),
    []
  )

  return useMemo(
    () => ({
      videoRef,
      containerRef,
      state,
      actions,
      helpers,
      ariaProps,
    }),
    [state, actions, helpers, ariaProps]
  )
}
