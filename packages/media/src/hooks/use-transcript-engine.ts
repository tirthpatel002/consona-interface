'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import type {
  TranscriptInput,
  TranscriptSegment,
  TranscriptWord,
} from '../engine/types'
import {
  composeTranscript,
  findWordIndexByTime,
  normalizeTranscript,
} from '../engine/transcript-engine'

export interface UseTranscriptEngineProps {
  alignment?: TranscriptInput
  hideAudioTags?: boolean
  audioRef?: RefObject<HTMLAudioElement | null>
  onPlay?: () => void
  onPause?: () => void
  onTimeUpdate?: (time: number) => void
  onEnded?: () => void
  onDurationChange?: (duration: number) => void
}

export interface UseTranscriptEngineResult {
  segments: TranscriptSegment[]
  words: TranscriptWord[]
  spokenSegments: TranscriptSegment[]
  unspokenSegments: TranscriptSegment[]
  currentWord: TranscriptWord | null
  currentSegmentIndex: number
  currentWordIndex: number
  seekToTime: (time: number) => void
  seekToWord: (word: number | TranscriptWord) => void
  audioRef: RefObject<HTMLAudioElement | null> | ((node: HTMLAudioElement | null) => void)
  audioElement: HTMLAudioElement | null
  isPlaying: boolean
  isScrubbing: boolean
  duration: number
  currentTime: number
  play: () => void
  pause: () => void
  togglePlay: () => void
  startScrubbing: () => void
  endScrubbing: () => void
}

export function useTranscriptEngine({
  alignment,
  hideAudioTags = true,
  audioRef: externalAudioRef,
  onPlay,
  onPause,
  onTimeUpdate,
  onEnded,
  onDurationChange,
}: UseTranscriptEngineProps): UseTranscriptEngineResult {
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const internalAudioRef = useRef<HTMLAudioElement | null>(null)

  const handleAudioRef = useCallback(
    (node: HTMLAudioElement | null) => {
      internalAudioRef.current = node
      setAudioElement(node)
      if (externalAudioRef) {
        if (typeof externalAudioRef === 'function') {
          ;(externalAudioRef as (instance: HTMLAudioElement | null) => void)(node)
        } else if ('current' in externalAudioRef) {
          ;(externalAudioRef as React.MutableRefObject<HTMLAudioElement | null>).current = node
        }
      }
    },
    [externalAudioRef]
  )

  const [isPlaying, setIsPlaying] = useState(false)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [currentWordIndex, setCurrentWordIndex] = useState(-1)

  const rafRef = useRef<number | null>(null)
  const handleTimeUpdateRef = useRef<(time: number) => void>(() => {})
  const onDurationChangeRef = useRef<(d: number) => void>(() => {})

  const { segments, words } = useMemo(() => {
    const normalized = normalizeTranscript(alignment, { hideAudioTags })
    if (!normalized) return { segments: [], words: [] }
    return composeTranscript(normalized, { hideAudioTags })
  }, [alignment, hideAudioTags])

  const guessedDuration = useMemo(() => {
    if (words.length) {
      const lastWord = words[words.length - 1]
      return lastWord && lastWord.endTime > 0 ? lastWord.endTime : 0
    }
    return 0
  }, [words])

  useEffect(() => {
    setCurrentTime(0)
    setDuration(guessedDuration ?? 0)
    setIsPlaying(false)
  }, [guessedDuration])

  handleTimeUpdateRef.current = (time: number) => {
    onTimeUpdate?.(time)
    const index = findWordIndexByTime(words, time)
    setCurrentWordIndex(index)
  }

  onDurationChangeRef.current = (d: number) => {
    onDurationChange?.(d)
  }

  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const startRaf = useCallback(() => {
    stopRaf()
    const loop = () => {
      const audio = internalAudioRef.current
      if (audio && !audio.paused && !audio.ended) {
        const time = audio.currentTime
        setCurrentTime(time)
        handleTimeUpdateRef.current(time)
        rafRef.current = requestAnimationFrame(loop)
      } else {
        stopRaf()
      }
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [stopRaf])

  useEffect(() => {
    const audio = internalAudioRef.current
    if (!audio) return

    const onAudioPlay = () => {
      setIsPlaying(true)
      startRaf()
      onPlay?.()
    }

    const onAudioPause = () => {
      setIsPlaying(false)
      stopRaf()
      onPause?.()
    }

    const onAudioEnded = () => {
      setIsPlaying(false)
      stopRaf()
      onEnded?.()
    }

    const onAudioTimeUpdate = () => {
      if (rafRef.current === null) {
        const time = audio.currentTime
        setCurrentTime(time)
        handleTimeUpdateRef.current(time)
      }
    }

    const onAudioLoadedMetadata = () => {
      const audioDuration = audio.duration
      if (Number.isFinite(audioDuration) && audioDuration > 0) {
        setDuration(audioDuration)
        onDurationChangeRef.current(audioDuration)
      }
    }

    audio.addEventListener('play', onAudioPlay)
    audio.addEventListener('pause', onAudioPause)
    audio.addEventListener('ended', onAudioEnded)
    audio.addEventListener('timeupdate', onAudioTimeUpdate)
    audio.addEventListener('loadedmetadata', onAudioLoadedMetadata)

    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      setDuration(audio.duration)
    }

    return () => {
      stopRaf()
      audio.removeEventListener('play', onAudioPlay)
      audio.removeEventListener('pause', onAudioPause)
      audio.removeEventListener('ended', onAudioEnded)
      audio.removeEventListener('timeupdate', onAudioTimeUpdate)
      audio.removeEventListener('loadedmetadata', onAudioLoadedMetadata)
    }
  }, [audioElement, onPlay, onPause, onEnded, startRaf, stopRaf])

  const play = useCallback(() => {
    internalAudioRef.current?.play().catch(() => {})
  }, [])

  const pause = useCallback(() => {
    internalAudioRef.current?.pause()
  }, [])

  const togglePlay = useCallback(() => {
    const audio = internalAudioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }, [])

  const seekToTime = useCallback(
    (time: number) => {
      const clamped = Math.max(0, Math.min(duration || Infinity, time))
      setCurrentTime(clamped)
      handleTimeUpdateRef.current(clamped)
      if (internalAudioRef.current) {
        internalAudioRef.current.currentTime = clamped
      }
    },
    [duration]
  )

  const seekToWord = useCallback(
    (target: number | TranscriptWord) => {
      const wordObj = typeof target === 'number' ? words[target] : target
      if (wordObj && Number.isFinite(wordObj.startTime)) {
        seekToTime(wordObj.startTime)
      }
    },
    [seekToTime, words]
  )

  const startScrubbing = useCallback(() => {
    setIsScrubbing(true)
    if (internalAudioRef.current && !internalAudioRef.current.paused) {
      internalAudioRef.current.pause()
    }
  }, [])

  const endScrubbing = useCallback(() => {
    setIsScrubbing(false)
  }, [])

  const currentWord = words[currentWordIndex] ?? null
  const currentSegmentIndex = currentWord?.segmentIndex ?? -1

  const spokenSegments = useMemo(() => {
    if (!segments.length || currentSegmentIndex <= 0) return []
    return segments.slice(0, currentSegmentIndex)
  }, [segments, currentSegmentIndex])

  const unspokenSegments = useMemo(() => {
    if (!segments.length) return []
    if (currentSegmentIndex === -1) return segments
    if (currentSegmentIndex + 1 >= segments.length) return []
    return segments.slice(currentSegmentIndex + 1)
  }, [segments, currentSegmentIndex])

  return {
    segments,
    words,
    spokenSegments,
    unspokenSegments,
    currentWord,
    currentSegmentIndex,
    currentWordIndex,
    seekToTime,
    seekToWord,
    audioRef: handleAudioRef,
    audioElement,
    isPlaying,
    isScrubbing,
    duration,
    currentTime,
    play,
    pause,
    togglePlay,
    startScrubbing,
    endScrubbing,
  }
}
