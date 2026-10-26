'use client'

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type HTMLAttributes,
} from 'react'
import {
  ArrowPathIcon,
  CheckIcon,
  ChevronDownIcon,
  EllipsisHorizontalIcon,
  MicrophoneIcon,
  PauseIcon,
  PlayIcon,
  StopIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Button } from '../../../core/components/button'
import { Popover, PopoverTrigger } from '../../../core/components/popover'
import { useAudioRecorder, type UseAudioRecorderResult } from '../../hooks/use-audio-recorder'
import { useAudioDevices } from '../../hooks/use-audio-devices'
import type { AudioRecordingResult } from '../../engine/types'
import { LiveWaveform } from '../live-waveform'
import { formatAudioTimestamp } from '../../engine/utils'

/* ==========================================================================
   AudioRecorderButton (Compact Button)
   ========================================================================== */

export interface AudioRecorderButtonSlots {
  /** Microphone default icon */
  micIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Active stop icon */
  stopIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Review play icon */
  playIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Review pause icon */
  pauseIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface AudioRecorderButtonProps
  extends Omit<ComponentProps<typeof Button>, 'children' | 'isPending' | 'slots' | 'slotProps'> {
  /** Hook or engine recorder result */
  recorder?: UseAudioRecorderResult
  /** Callback fired on stop with recorded audio blob and waveform data */
  onRecordingComplete?: (result: AudioRecordingResult) => void
  /** Show live waveform preview during recording */
  showWaveform?: boolean
  /** Allow clicking button again to listen to review */
  allowPlayback?: boolean
  /** Selected audio device */
  deviceId?: string
  /** Slot overrides map */
  slotProps?: SlotPropsMap<AudioRecorderButtonSlots>
  /** Custom slot components */
  slots?: SlotComponents<AudioRecorderButtonSlots>
}

function AudioRecorderButtonPrimitive({
  recorder: externalRecorder,
  onRecordingComplete,
  showWaveform = true,
  allowPlayback = true,
  deviceId,
  size = 'md',
  intent = 'secondary',
  className,
  onPress,
  slots,
  slotProps,
  ...props
}: AudioRecorderButtonProps) {
  const internalRecorder = useAudioRecorder()
  const recorder = externalRecorder || internalRecorder
  const [recordedResult, setRecordedResult] = useState<AudioRecordingResult | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const isRecording = recorder.isRecording

  const MicIconSlot = slots?.micIcon ?? MicrophoneIcon
  const StopIconSlot = slots?.stopIcon ?? StopIcon
  const PlayIconSlot = slots?.playIcon ?? PlayIcon
  const PauseIconSlot = slots?.pauseIcon ?? PauseIcon

  const handlePress = async (e: any) => {
    onPress?.(e)
    if (isRecording) {
      const res = await recorder.stop()
      setRecordedResult(res)
      onRecordingComplete?.(res)
    } else if (recordedResult && allowPlayback) {
      if (!audioRef.current) {
        audioRef.current = new Audio(recordedResult.url)
        audioRef.current.onended = () => setIsPlaying(false)
      } else if (audioRef.current.src !== recordedResult.url) {
        audioRef.current.src = recordedResult.url
      }

      if (isPlaying) {
        audioRef.current?.pause?.()
        setIsPlaying(false)
      } else {
        audioRef.current?.play?.().then(() => setIsPlaying(true)).catch(() => {})
      }
    } else {
      setRecordedResult(null)
      try {
        await recorder.start(deviceId)
      } catch (err) {
        console.warn('Mic start failed:', err)
      }
    }
  }

  const handleReset = (e: React.SyntheticEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (audioRef.current) audioRef.current.pause()
    setIsPlaying(false)
    setRecordedResult(null)
  }

  return (
    <Button
      type="button"
      intent={isRecording ? 'danger' : recordedResult ? 'primary' : intent}
      size={size}
      onPress={handlePress}
      aria-label={
        isRecording
          ? 'Stop recording'
          : recordedResult
            ? isPlaying
              ? 'Pause recorded audio'
              : 'Play recorded audio'
            : 'Start recording'
      }
      className={cn(
        'group relative inline-flex items-center gap-space-2 transition-all',
        isRecording && 'ring-2 ring-danger/30',
        className
      )}
      {...props}
    >
      {isRecording ? (
        renderSlot(slots?.stopIcon, { className: 'size-4 animate-pulse text-danger-fg', ...slotProps?.stopIcon }, { defaultComponent: StopIcon })
      ) : recordedResult ? (
        isPlaying ? (
          renderSlot(slots?.pauseIcon, { className: 'size-4 text-primary-fg', ...slotProps?.pauseIcon }, { defaultComponent: PauseIcon })
        ) : (
          renderSlot(slots?.playIcon, { className: 'size-4 text-primary-fg', ...slotProps?.playIcon }, { defaultComponent: PlayIcon })
        )
      ) : (
        renderSlot(slots?.micIcon, { className: 'size-4 text-muted-fg group-hover:text-fg', ...slotProps?.micIcon }, { defaultComponent: MicrophoneIcon })
      )}

      {showWaveform && isRecording && (
        <div className="h-4 w-20 overflow-hidden rounded-micro bg-danger-fg/20 px-1">
          <LiveWaveform
            active={isRecording}
            mediaStream={recorder.stream}
            deviceId={deviceId}
            barWidth={2}
            barGap={1}
            barRadius={1}
            height={16}
            mode="static"
          />
        </div>
      )}

      {!isRecording && !recordedResult && <span>Record</span>}
      {isRecording && <span className="font-mono text-xs">{Math.floor(recorder.duration)}s</span>}
      {recordedResult && !isRecording && (
        <span className="font-mono text-xs font-semibold">
          {isPlaying ? 'Playing' : 'Listen'} ({Math.ceil(recordedResult.duration)}s)
        </span>
      )}

      {recordedResult && !isRecording && (
        <span
          role="button"
          tabIndex={0}
          title="Record new take"
          aria-label="Record again"
          onPointerDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
          }}
          onClick={handleReset}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleReset(e)
          }}
          className="ml-1 flex cursor-pointer items-center justify-center text-current/85 hover:text-current hover:rotate-45 active:scale-90 transition-all p-0.5"
        >
          <ArrowPathIcon className="size-4" />
        </span>
      )}
    </Button>
  )
}

export const AudioRecorderButton = createInterfaceComponent<
  AudioRecorderButtonProps,
  AudioRecorderButtonSlots
>(
  {
    name: 'AudioRecorderButton',
    category: 'media',
    description: 'Compact voice recording trigger button with live inline waveform and instant review.',
    version: '1.0.0',
    slots: {
      micIcon: MicrophoneIcon,
      stopIcon: StopIcon,
      playIcon: PlayIcon,
      pauseIcon: PauseIcon,
    },
  },
  AudioRecorderButtonPrimitive
)

/* ==========================================================================
   SpeechInputButton
   ========================================================================== */

export interface SpeechInputButtonSlots {
  /** Trigger button */
  trigger?: React.ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement> & { isRecording?: boolean }>
}

export interface SpeechInputButtonProps {
  /** External controlled recording flag */
  isRecording?: boolean
  /** Live transcription string */
  transcript?: string
  /** Placeholder when listening */
  placeholder?: string
  /** Audio URL of review audio */
  audioUrl?: string
  /** Callback fired on start */
  onStart?: () => void
  /** Callback fired on stop */
  onStop?: () => void
  /** Callback fired on cancel */
  onCancel?: () => void
  /** Callback fired when complete */
  onRecordingComplete?: (blob: Blob) => void
  /** Root class */
  className?: string
  /** Slot overrides map */
  slotProps?: SlotPropsMap<SpeechInputButtonSlots>
  /** Custom slot components */
  slots?: SlotComponents<SpeechInputButtonSlots>
}

function SpeechInputButtonPrimitive({
  isRecording: externalIsRecording,
  transcript = '',
  placeholder = 'Listening...',
  audioUrl: externalAudioUrl,
  onStart,
  onStop,
  onCancel,
  onRecordingComplete,
  className,
  slots,
  slotProps,
}: SpeechInputButtonProps) {
  const [internalRecording, setInternalRecording] = useState(false)
  const [capturedAudioUrl, setCapturedAudioUrl] = useState<string | null>(externalAudioUrl || null)
  const [isPlayingCaptured, setIsPlayingCaptured] = useState(false)
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null)

  const isControlled = externalIsRecording !== undefined
  const isRecording = isControlled ? externalIsRecording : internalRecording

  const handleToggle = () => {
    if (isRecording) {
      if (!isControlled) setInternalRecording(false)
      onStop?.()
    } else {
      if (!isControlled) setInternalRecording(true)
      onStart?.()
    }
  }

  const handleCancel = () => {
    if (!isControlled) setInternalRecording(false)
    if (audioPreviewRef.current) audioPreviewRef.current.pause()
    setIsPlayingCaptured(false)
    setCapturedAudioUrl(null)
    onCancel?.()
  }

  const handleToggleCapturedPlay = () => {
    const url = capturedAudioUrl || externalAudioUrl
    if (!url) return
    if (!audioPreviewRef.current) {
      audioPreviewRef.current = new Audio(url)
      audioPreviewRef.current.onended = () => setIsPlayingCaptured(false)
    }
    if (isPlayingCaptured) {
      audioPreviewRef.current?.pause?.()
      setIsPlayingCaptured(false)
    } else {
      audioPreviewRef.current?.play?.().then(() => setIsPlayingCaptured(true)).catch(() => {})
    }
  }

  const triggerNode = (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isRecording ? 'Stop speech input' : 'Start speech input'}
      className={cn(
        'flex size-8 cursor-pointer items-center justify-center rounded-full transition-transform active:scale-95',
        isRecording
          ? 'bg-danger text-danger-fg animate-pulse'
          : 'bg-primary text-primary-fg hover:scale-105'
      )}
    >
      {isRecording ? <StopIcon className="size-4" /> : <MicrophoneIcon className="size-4" />}
    </button>
  )

  return (
    <div
      data-slot="speech-input-button"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/80 p-1 shadow-xs backdrop-blur-md transition-all duration-300',
        isRecording && 'border-primary/50 shadow-[0_0_15px_rgba(var(--color-primary),0.12)]',
        className
      )}
    >
      {renderSlot(
        slots?.trigger,
        {
          isRecording,
          onClick: handleToggle,
          children: triggerNode,
          ...slotProps?.trigger,
        }
      ) ?? triggerNode}

      {isRecording && (
        <div className="flex items-center gap-space-2 px-2.5 transition-all">
          <div className="h-4 w-16 overflow-hidden">
            <LiveWaveform
              active={true}
              demo={true}
              barWidth={2}
              barGap={1}
              barRadius={1}
              height={16}
              mode="static"
            />
          </div>

          <span className="max-w-[140px] truncate text-xs text-muted-fg font-medium">
            {transcript || placeholder}
          </span>

          <button
            type="button"
            onClick={handleCancel}
            aria-label="Cancel speech input"
            className="flex cursor-pointer items-center justify-center text-muted-fg hover:text-fg hover:scale-110 active:scale-90 transition-all p-0.5"
          >
            <XMarkIcon className="size-4" />
          </button>
        </div>
      )}

      {!isRecording && (capturedAudioUrl || externalAudioUrl) && (
        <button
          type="button"
          onClick={handleToggleCapturedPlay}
          aria-label={isPlayingCaptured ? 'Pause recording' : 'Play recording'}
          className="flex size-7 cursor-pointer items-center justify-center rounded-full bg-muted/60 text-fg hover:bg-muted"
        >
          {isPlayingCaptured ? <PauseIcon className="size-3.5" /> : <PlayIcon className="size-3.5 translate-x-0.5" />}
        </button>
      )}
    </div>
  )
}

export const SpeechInputButton = createInterfaceComponent<
  SpeechInputButtonProps,
  SpeechInputButtonSlots
>(
  {
    name: 'SpeechInputButton',
    category: 'media',
    description: 'Expandable dictation pill trigger with real-time speech waveform preview.',
    version: '1.0.0',
    slots: {
      trigger: undefined,
    },
  },
  SpeechInputButtonPrimitive
)

/* ==========================================================================
   AudioRecorderPill (The Perfect Recorder Pill)
   ========================================================================== */

const recorderPillIntentStyles = {
  primary: {
    idleBtn: 'bg-primary text-primary-fg',
    reviewBtn: 'bg-primary text-primary-fg',
    fillBg: 'bg-primary text-primary-fg',
    glow: 'shadow-[0_0_16px_rgba(var(--color-primary),0.18)]',
    border: 'border-primary/50',
  },
  secondary: {
    idleBtn: 'bg-secondary text-secondary-fg',
    reviewBtn: 'bg-secondary text-secondary-fg',
    fillBg: 'bg-secondary text-secondary-fg',
    glow: 'shadow-xs',
    border: 'border-secondary/50',
  },
  danger: {
    idleBtn: 'bg-danger text-danger-fg',
    reviewBtn: 'bg-danger text-danger-fg',
    fillBg: 'bg-danger text-danger-fg',
    glow: 'shadow-[0_0_16px_rgba(var(--color-danger),0.18)]',
    border: 'border-danger/50',
  },
  warning: {
    idleBtn: 'bg-warning text-warning-fg',
    reviewBtn: 'bg-warning text-warning-fg',
    fillBg: 'bg-warning text-warning-fg',
    glow: 'shadow-[0_0_16px_rgba(var(--color-warning),0.18)]',
    border: 'border-warning/50',
  },
  success: {
    idleBtn: 'bg-success text-success-fg',
    reviewBtn: 'bg-success text-success-fg',
    fillBg: 'bg-success text-success-fg',
    glow: 'shadow-[0_0_16px_rgba(var(--color-success),0.18)]',
    border: 'border-success/50',
  },
} as const

export interface MiniPillVisualizerSlots {}

export interface MiniPillVisualizerProps {
  /** Whether playback is currently active. */
  isPlaying: boolean
  className?: string
  /** Custom bar width configuration. */
  barWidth?: string
  children?: React.ReactNode
}

function MiniPillVisualizerPrimitive({
  isPlaying,
  className,
  barWidth = 'w-0.75',
}: MiniPillVisualizerProps) {
  const bars = [35, 65, 95, 55, 80, 45]

  return (
    <div className={cn('flex items-center gap-0.5 shrink-0 px-1 pointer-events-none select-none', className)}>
      {bars.map((heightPercent, i) => (
        <span
          key={i}
          className={cn(
            'rounded-full bg-current transition-all duration-300 pointer-events-none',
            barWidth,
            isPlaying ? 'animate-pulse' : 'opacity-70'
          )}
          style={{
            height: isPlaying
              ? `${Math.max(30, (heightPercent * ((i % 3) + 1.2)) % 100)}%`
              : `${heightPercent * 0.45}%`,
            animationDuration: isPlaying ? `${600 + (i % 4) * 180}ms` : undefined,
            animationDelay: isPlaying ? `${(i * 120) % 600}ms` : undefined,
          }}
        />
      ))}
    </div>
  )
}

export const MiniPillVisualizer = createInterfaceComponent<
  MiniPillVisualizerProps,
  MiniPillVisualizerSlots
>(
  {
    name: 'MiniPillVisualizer',
    category: 'media',
    description: 'Compact animated waveform visualizer bar strip for pill recorder.',
    version: '1.0.0',
    slots: {

    },
  },
  MiniPillVisualizerPrimitive
)

const recorderPillSizeStyles = {
  sm: {
    container: 'h-9 min-w-[220px]',
    button: 'w-9 px-2.5',
    icon: 'size-4',
    content: 'px-3 py-1 gap-2.5',
    title: 'text-xs font-medium leading-tight',
    subtitle: 'text-[10px] leading-tight mt-0.5',
    visualizer: 'h-4 gap-0.5',
    barWidth: 'w-0.5',
    waveformHeight: 14,
    waveformWrapper: 'h-4.5 w-20',
    actionIcon: 'size-4',
  },
  md: {
    container: 'h-11 min-w-[270px]',
    button: 'w-11 px-3.5',
    icon: 'size-4.5',
    content: 'px-4 py-2 gap-3.5',
    title: 'text-[13px] sm:text-sm font-medium leading-tight',
    subtitle: 'text-[11px] leading-tight mt-0.5',
    visualizer: 'h-5 gap-0.5',
    barWidth: 'w-0.75',
    waveformHeight: 20,
    waveformWrapper: 'h-5.5 w-28 sm:w-32',
    actionIcon: 'size-4.5',
  },
  lg: {
    container: 'h-13 min-w-[320px]',
    button: 'w-13 px-4.5',
    icon: 'size-5.5',
    content: 'px-5 py-2.5 gap-4',
    title: 'text-sm sm:text-base font-medium leading-tight',
    subtitle: 'text-xs leading-tight mt-0.5',
    visualizer: 'h-6 gap-0.5',
    barWidth: 'w-1',
    waveformHeight: 24,
    waveformWrapper: 'h-6.5 w-36 sm:w-40',
    actionIcon: 'size-5',
  },
} as const

export interface AudioRecorderPillSlots {
  /** Mic icon */
  micIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Stop icon */
  stopIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Play icon */
  playIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Pause icon */
  pauseIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Device menu item slot */
  item?: React.ComponentType<Record<string, unknown>>
}

export interface AudioRecorderPillProps {
  /** Hook or engine recorder result */
  recorder?: UseAudioRecorderResult
  /** Callback fired with recorded audio payload */
  onRecordingComplete?: (result: AudioRecordingResult) => void
  /** Callback fired on explicit discard or cancel */
  onDiscard?: () => void
  /** Selected audio device ID */
  deviceId?: string
  /** Callback on audio device selection */
  onDeviceChange?: (deviceId: string) => void
  /** Whether to show visualizer in recording and review */
  showWaveform?: boolean
  /** Whether to enable instant audio playback after recording */
  allowPlayback?: boolean
  /** Display title text */
  label?: string
  /** Visual intent */
  intent?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success'
  /** Sizing scale */
  size?: 'sm' | 'md' | 'lg'
  /** Root class */
  className?: string
  /** Automatically trigger playback review once recording stops */
  autoPlayReview?: boolean
  /** Slot overrides map */
  slotProps?: SlotPropsMap<AudioRecorderPillSlots>
  /** Custom slot components */
  slots?: SlotComponents<AudioRecorderPillSlots>
  /** Children elements */
  children?: React.ReactNode
}

function AudioRecorderPillPrimitive({
  recorder: externalRecorder,
  onRecordingComplete,
  onDiscard,
  deviceId: customDeviceId,
  onDeviceChange,
  showWaveform = true,
  allowPlayback = true,
  label = 'Voice Note',
  intent = 'primary',
  size = 'md',
  className,
  autoPlayReview = false,
  slots,
  slotProps,
}: AudioRecorderPillProps) {
  const internalRecorder = useAudioRecorder()
  const recorder = externalRecorder || internalRecorder

  const { devices, loading: devicesLoading, loadDevices, hasPermission } = useAudioDevices()
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(customDeviceId || '')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isReviewMenuOpen, setIsReviewMenuOpen] = useState(false)

  const [recordedResult, setRecordedResult] = useState<AudioRecordingResult | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const rafRef = useRef<number | null>(null)

  const isRecording = recorder.isRecording

  const MicIconSlot = slots?.micIcon ?? MicrophoneIcon
  const StopIconSlot = slots?.stopIcon ?? StopIcon
  const PlayIconSlot = slots?.playIcon ?? PlayIcon
  const PauseIconSlot = slots?.pauseIcon ?? PauseIcon

  useEffect(() => {
    if (customDeviceId !== undefined) {
      setSelectedDeviceId(customDeviceId)
    }
  }, [customDeviceId])

  // Silky smooth 60fps time updater via requestAnimationFrame
  useEffect(() => {
    if (!isPlaying || !audioRef.current) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    const updateLoop = () => {
      if (audioRef.current && !audioRef.current.paused) {
        setCurrentTime(audioRef.current.currentTime)
        rafRef.current = requestAnimationFrame(updateLoop)
      }
    }

    rafRef.current = requestAnimationFrame(updateLoop)
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [isPlaying])

  const reviewDuration = recordedResult?.duration || 0
  const progress =
    reviewDuration > 0 ? Math.min(100, Math.max(0, (currentTime / reviewDuration) * 100)) : 0

  const [dragProgress, setDragProgress] = useState<number | null>(null)
  const effectiveProgress = dragProgress !== null ? dragProgress : progress
  const effectiveTime =
    dragProgress !== null && reviewDuration > 0
      ? (dragProgress / 100) * reviewDuration
      : currentTime

  const contentRef = useRef<HTMLDivElement>(null)
  const [contentWidth, setContentWidth] = useState<number>(0)
  const isDraggingRef = useRef(false)

  const getOrCreateAudio = useCallback(
    (targetUrl?: string) => {
      const url = targetUrl || recordedResult?.url
      if (!url) return null
      if (!audioRef.current || audioRef.current.src !== url) {
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.src = ''
        }
        const audio = new Audio(url)
        audio.onended = () => {
          setIsPlaying(false)
          setCurrentTime(0)
        }
        audioRef.current = audio
      }
      return audioRef.current
    },
    [recordedResult?.url]
  )

  useEffect(() => {
    if (recordedResult?.url) {
      getOrCreateAudio(recordedResult.url)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
    }
  }, [recordedResult?.url, getOrCreateAudio])

  useEffect(() => {
    if (!contentRef.current) return
    const el = contentRef.current
    const updateWidth = () => {
      setContentWidth(el.getBoundingClientRect().width)
    }
    updateWidth()

    const observer = new ResizeObserver(() => {
      updateWidth()
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [isRecording, recordedResult])

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isRecording) {
      const res = await recorder.stop()
      setRecordedResult(res)
      setCurrentTime(0)
      onRecordingComplete?.(res)
      if (autoPlayReview && res.url && allowPlayback) {
        const audio = getOrCreateAudio(res.url)
        if (audio) {
          audio.play().then(() => setIsPlaying(true)).catch(() => {})
        }
      }
    } else if (recordedResult && allowPlayback) {
      const audio = getOrCreateAudio()
      if (!audio) return

      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
      } else {
        audio.play().then(() => setIsPlaying(true)).catch(() => {})
      }
    } else {
      setRecordedResult(null)
      setCurrentTime(0)
      try {
        await recorder.start(selectedDeviceId || customDeviceId)
      } catch (err) {
        console.warn('Microphone recording error:', err)
      }
    }
  }

  const handleDiscard = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setIsReviewMenuOpen(false)
    if (isRecording) {
      recorder.stop().catch(() => {})
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    setIsPlaying(false)
    setRecordedResult(null)
    setCurrentTime(0)
    onDiscard?.()
  }

  const handleResetRecord = async (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setIsReviewMenuOpen(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    setIsPlaying(false)
    setRecordedResult(null)
    setCurrentTime(0)
    try {
      await recorder.start(selectedDeviceId || customDeviceId)
    } catch (err) {
      console.warn('Microphone recording error:', err)
    }
  }

  const handleResumeRecord = async (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setIsReviewMenuOpen(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    setIsPlaying(false)
    setRecordedResult(null)
    setCurrentTime(0)
    try {
      await recorder.resumeRecording(selectedDeviceId || customDeviceId)
    } catch (err) {
      console.warn('Resume recording error:', err)
    }
  }

  const handleSeekReview = (clientX: number) => {
    if (!contentRef.current || !recordedResult || reviewDuration <= 0) return
    const rect = contentRef.current.getBoundingClientRect()
    if (rect.width <= 0) return
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    setDragProgress(ratio * 100)
    const newTime = ratio * reviewDuration

    const audio = getOrCreateAudio()
    if (audio) {
      try {
        audio.currentTime = newTime
      } catch (err) {
        console.warn('Seek error:', err)
      }
    }
    setCurrentTime(newTime)
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!recordedResult || e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    isDraggingRef.current = true
    handleSeekReview(e.clientX)

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (isDraggingRef.current) {
        handleSeekReview(moveEvent.clientX)
      }
    }

    const handlePointerUp = (upEvent: PointerEvent) => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false
        if (contentRef.current && recordedResult && reviewDuration > 0) {
          const rect = contentRef.current.getBoundingClientRect()
          if (rect.width > 0) {
            const ratio = Math.max(0, Math.min(1, (upEvent.clientX - rect.left) / rect.width))
            const newTime = ratio * reviewDuration
            const audio = getOrCreateAudio()
            if (audio) {
              try {
                audio.currentTime = newTime
              } catch (err) {
                console.warn('Seek error:', err)
              }
            }
            setCurrentTime(newTime)
          }
        }
      }
      setDragProgress(null)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  const handleSelectDevice = (devId: string) => {
    setSelectedDeviceId(devId)
    onDeviceChange?.(devId)
    setIsDropdownOpen(false)
  }

  const currentIntent = recorderPillIntentStyles[intent || 'primary'] ?? recorderPillIntentStyles.primary
  const currentSize = recorderPillSizeStyles[size || 'md'] ?? recorderPillSizeStyles.md

  const activeDevice =
    devices.find((d) => d.deviceId === (selectedDeviceId || customDeviceId)) || devices[0]

  return (
    <div
      data-slot="audio-recorder-pill"
      role="region"
      aria-label="Audio recorder"
      className={cn(
        'group relative inline-flex items-stretch overflow-visible rounded-full border transition-all duration-200 select-none',
        isRecording
          ? 'border-danger bg-danger text-danger-fg shadow-[0_0_20px_rgba(var(--color-danger),0.32)]'
          : 'border-border/60 bg-card/85 text-fg shadow-xs backdrop-blur-md hover:border-border hover:shadow-sm',
        !isRecording && recordedResult && isPlaying && currentIntent.border,
        !isRecording && recordedResult && isPlaying && currentIntent.glow,
        currentSize.container,
        className
      )}
    >
      {/* Edge-to-edge left Trigger Button with no right corner radius */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label={
          isRecording
            ? 'Stop recording'
            : recordedResult
              ? isPlaying
                ? 'Pause review'
                : 'Play review'
              : 'Start recording'
        }
        className={cn(
          'relative z-20 flex items-center justify-center shrink-0 cursor-pointer rounded-l-full rounded-r-none transition-all duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
          isRecording
            ? 'bg-danger text-danger-fg hover:brightness-110 active:brightness-90'
            : recordedResult
              ? cn(currentIntent.reviewBtn, 'hover:brightness-110 active:brightness-95')
              : cn(currentIntent.idleBtn, 'hover:brightness-110 active:brightness-95'),
          currentSize.button
        )}
      >
        {isRecording ? (
          renderSlot(slots?.stopIcon, { className: cn(currentSize.icon, 'animate-pulse'), ...slotProps?.stopIcon }, { defaultComponent: StopIcon })
        ) : recordedResult ? (
          isPlaying ? (
            renderSlot(slots?.pauseIcon, { className: currentSize.icon, ...slotProps?.pauseIcon }, { defaultComponent: PauseIcon })
          ) : (
            renderSlot(slots?.playIcon, { className: cn(currentSize.icon, 'translate-x-0.5'), ...slotProps?.playIcon }, { defaultComponent: PlayIcon })
          )
        ) : (
          renderSlot(slots?.micIcon, { className: currentSize.icon, ...slotProps?.micIcon }, { defaultComponent: MicrophoneIcon })
        )}
      </button>

      {/* Middle Content Section (Timeline / Live Status) */}
      <div
        ref={contentRef}
        onPointerDown={handlePointerDown}
        className={cn(
          'relative flex flex-1 items-center min-w-0 overflow-hidden',
          recordedResult ? 'cursor-pointer' : ''
        )}
      >
        {/* --- 1. RECORDING STATE --- */}
        {isRecording && (
          <div
            className={cn(
              'flex w-full items-center justify-between text-danger-fg pointer-events-none select-none',
              currentSize.content
            )}
          >
            <div className="flex items-center gap-space-2 min-w-0">
              <span className="relative flex size-2 shrink-0">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-90" />
                <span className="relative inline-flex size-2 rounded-full bg-white" />
              </span>
              <span className="font-mono text-xs font-semibold text-danger-fg tabular-nums leading-tight">
                {formatAudioTimestamp(recorder.duration)}
              </span>
            </div>

            {showWaveform && (
              <div
                className={cn(
                  'overflow-hidden rounded-micro bg-black/15 dark:bg-white/15 px-1 py-0.5 pointer-events-none',
                  currentSize.waveformWrapper
                )}
              >
                <LiveWaveform
                  active={isRecording}
                  mediaStream={recorder.stream}
                  deviceId={selectedDeviceId || customDeviceId}
                  barWidth={2}
                  barGap={1.5}
                  barRadius={1.5}
                  barColor="currentColor"
                  height={currentSize.waveformHeight}
                  fadeEdges={false}
                  mode="static"
                />
              </div>
            )}
          </div>
        )}

        {/* --- 2. RECORDED REVIEW STATE (with Silky 60fps Morphing Fill & Waveform) --- */}
        {!isRecording && recordedResult && (
          <>
            {/* Base Layer */}
            <div
              className={cn(
                'flex w-full items-center justify-between text-fg pointer-events-none select-none',
                currentSize.content
              )}
            >
              <div className="flex flex-col min-w-0 justify-center">
                <span className={cn('truncate text-fg', currentSize.title)}>
                  {label}
                </span>
                <span className={cn('font-mono text-muted-fg tabular-nums', currentSize.subtitle)}>
                  {formatAudioTimestamp(effectiveTime)} / {formatAudioTimestamp(reviewDuration)}
                </span>
              </div>

              {/* Recorded Waveform Visualizer */}
              {showWaveform && (
                <MiniPillVisualizer
                  isPlaying={isPlaying}
                  className={cn(currentSize.visualizer, 'pointer-events-none')}
                  barWidth={currentSize.barWidth}
                />
              )}
            </div>

            {/* Morphing Overlay Layer (Frame-by-frame 60fps granular fill) */}
            <div
              className={cn(
                'absolute inset-y-0 left-0 overflow-hidden pointer-events-none z-10',
                currentIntent.fillBg
              )}
              style={{ width: `${effectiveProgress}%` }}
            >
              <div
                className={cn(
                  'flex items-center justify-between h-full pointer-events-none select-none',
                  currentSize.content
                )}
                style={{ width: contentWidth > 0 ? `${contentWidth}px` : '100%' }}
              >
                <div className="flex flex-col min-w-0 justify-center">
                  <span className={cn('truncate text-inherit', currentSize.title)}>
                    {label}
                  </span>
                  <span className={cn('font-mono opacity-85 tabular-nums text-inherit', currentSize.subtitle)}>
                    {formatAudioTimestamp(effectiveTime)} / {formatAudioTimestamp(reviewDuration)}
                  </span>
                </div>

                {/* Recorded Waveform Visualizer (in morph color) */}
                {showWaveform && (
                  <MiniPillVisualizer
                    isPlaying={isPlaying}
                    className={cn(currentSize.visualizer, 'pointer-events-none')}
                    barWidth={currentSize.barWidth}
                  />
                )}
              </div>
            </div>
          </>
        )}

        {/* --- 3. IDLE STATE (Clean title and subtitle) --- */}
        {!isRecording && !recordedResult && (
          <div
            className={cn(
              'flex w-full items-center justify-between text-fg pointer-events-none select-none',
              currentSize.content
            )}
          >
            <div className="flex flex-col min-w-0 justify-center">
              <span className={cn('truncate text-fg', currentSize.title)}>
                {label}
              </span>
              <span className={cn('text-muted-fg leading-tight', currentSize.subtitle)}>
                Tap to record
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Edge-to-edge right Action Button (Outside of Timeline context, matching left button bg) */}
      {isRecording ? (
        <button
          type="button"
          onClick={handleDiscard}
          title="Cancel recording"
          aria-label="Cancel recording"
          className={cn(
            'relative z-20 flex items-center justify-center shrink-0 cursor-pointer rounded-r-full rounded-l-none transition-all duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1',
            'bg-danger text-danger-fg hover:brightness-110 active:brightness-90',
            currentSize.button
          )}
        >
          <XMarkIcon className={currentSize.actionIcon} />
        </button>
      ) : recordedResult ? (
        <PopoverTrigger
          isOpen={isReviewMenuOpen}
          onOpenChange={setIsReviewMenuOpen}
        >
          <button
            type="button"
            aria-label="Recording options"
            className={cn(
              'relative z-20 flex items-center justify-center shrink-0 cursor-pointer rounded-r-full rounded-l-none transition-all duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
              cn(currentIntent.reviewBtn, 'hover:brightness-110 active:brightness-95'),
              currentSize.button
            )}
          >
            <EllipsisHorizontalIcon className={currentSize.actionIcon} />
          </button>

          <Popover size="auto" placement="bottom end" className="w-56 p-1.5 shadow-2xl">
            {({ close }) => (
              <div className="flex flex-col gap-0.5">
                <div className="px-2.5 py-1 text-[10px] font-semibold text-muted-fg uppercase tracking-wider">
                  Recording Options
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    handleResumeRecord(e)
                    close()
                  }}
                  className="flex w-full items-center gap-2.5 rounded-micro px-2.5 py-1.5 text-left text-xs text-fg hover:bg-muted transition-colors cursor-pointer"
                >
                  <MicrophoneIcon className="size-4 text-primary shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium">Resume recording</span>
                    <span className="text-[10px] text-muted-fg">
                      Continue from {formatAudioTimestamp(reviewDuration)}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    handleResetRecord(e)
                    close()
                  }}
                  className="flex w-full items-center gap-2.5 rounded-micro px-2.5 py-1.5 text-left text-xs text-fg hover:bg-muted transition-colors cursor-pointer"
                >
                  <ArrowPathIcon className="size-4 text-muted-fg shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium">Re-record</span>
                    <span className="text-[10px] text-muted-fg">Restart from beginning</span>
                  </div>
                </button>

                <div className="my-1 h-px bg-border/60" />

                <button
                  type="button"
                  onClick={(e) => {
                    handleDiscard(e)
                    close()
                  }}
                  className="flex w-full items-center gap-2.5 rounded-micro px-2.5 py-1.5 text-left text-xs text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                >
                  <TrashIcon className="size-4 text-danger shrink-0" />
                  <span className="font-medium">Discard recording</span>
                </button>
              </div>
            )}
          </Popover>
        </PopoverTrigger>
      ) : (
        <PopoverTrigger
          isOpen={isDropdownOpen}
          onOpenChange={(open) => {
            setIsDropdownOpen(open)
            if (open && !hasPermission && !devicesLoading) {
              loadDevices()
            }
          }}
        >
          <button
            type="button"
            aria-label={activeDevice ? activeDevice.label : 'Select microphone'}
            className={cn(
              'relative z-20 flex items-center justify-center shrink-0 cursor-pointer rounded-r-full rounded-l-none transition-all duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
              cn(currentIntent.idleBtn, 'hover:brightness-110 active:brightness-95'),
              currentSize.button
            )}
          >
            <ChevronDownIcon
              className={cn(
                currentSize.actionIcon,
                'transition-transform duration-200',
                isDropdownOpen && 'rotate-180'
              )}
            />
          </button>

          <Popover size="auto" placement="bottom end" className="w-64 p-1.5 shadow-2xl">
            {({ close }) => (
              <div className="flex flex-col gap-0.5">
                <div className="px-2.5 py-1 text-[10px] font-semibold text-muted-fg uppercase tracking-wider">
                  Audio Input
                </div>
                <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                  {devices.length === 0 ? (
                    <div className="px-2.5 py-2 text-xs text-muted-fg">
                      {devicesLoading ? 'Detecting devices...' : 'Default Microphone'}
                    </div>
                  ) : (
                    devices.map((d) => {
                      const isSelected =
                        (selectedDeviceId || customDeviceId || devices[0]?.deviceId) === d.deviceId
                      const handleClick = () => {
                        handleSelectDevice(d.deviceId)
                        close()
                      }
                      const defaultItem = (
                        <button
                          key={d.deviceId}
                          type="button"
                          onClick={handleClick}
                          className={cn(
                            'flex w-full items-center justify-between gap-2 rounded-micro px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer',
                            isSelected
                              ? 'bg-primary text-primary-fg font-medium'
                              : 'text-overlay-fg hover:bg-muted'
                          )}
                        >
                          <span className="truncate">{d.label}</span>
                          {isSelected && <CheckIcon className="size-3.5 shrink-0" />}
                        </button>
                      )

                      return renderSlot(
                        slots?.item,
                        {
                          key: d.deviceId,
                          device: d,
                          isSelected,
                          onClick: handleClick,
                          children: defaultItem,
                          ...slotProps?.item,
                        }
                      ) ?? defaultItem
                    })
                  )}
                </div>
              </div>
            )}
          </Popover>
        </PopoverTrigger>
      )}
    </div>
  )
}

export const AudioRecorderPill = createInterfaceComponent<
  AudioRecorderPillProps,
  AudioRecorderPillSlots
>(
  {
    name: 'AudioRecorderPill',
    category: 'media',
    description: 'Modern pill audio recorder with edge-to-edge controls, 60fps morphing timeline fill, and device switching.',
    version: '1.0.0',
    slots: {
      micIcon: MicrophoneIcon,
      stopIcon: StopIcon,
      playIcon: PlayIcon,
      pauseIcon: PauseIcon,
      item: undefined,
    },
  },
  AudioRecorderPillPrimitive
)

AudioRecorderPill.Visualizer = MiniPillVisualizer
AudioRecorderPill.MiniPillVisualizer = MiniPillVisualizer
AudioRecorderButton.SpeechInput = SpeechInputButton
AudioRecorderButton.Pill = AudioRecorderPill
AudioRecorderButton.MiniPillVisualizer = MiniPillVisualizer

export const { Context: AudioRecorderPillContext, useCompoundContext: useAudioRecorderPillContext } =
  createCompoundContext<any>('AudioRecorderPill')

export const { Context: AudioRecorderButtonContext, useCompoundContext: useAudioRecorderButtonContext } =
  createCompoundContext<any>('AudioRecorderButton')
