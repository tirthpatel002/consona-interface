'use client'

import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react'
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  PauseIcon,
  PlayIcon,
  StopIcon,
  TrashIcon,
} from '@heroicons/react/24/solid'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Button } from '../../../core/components/button'
import {
  useAudioRecorder,
  type UseAudioRecorderResult,
} from '../../hooks/use-audio-recorder'
import type { AudioRecorderOptions } from '../../engine/recorder-engine'
import type { AudioRecordingResult, AudioUploader, AudioUploadResult } from '../../engine/types'
import { recordingFromFile, revokeRecording } from '../../engine/source'
import { useAudioUpload } from '../../hooks/use-audio-upload'
import { AudioSourcePicker, type AudioSourcePickerProps } from '../audio-source-picker'
import { LiveWaveform, type LiveWaveformProps } from '../live-waveform'
import { AudioTimeline, type AudioTimelineProps } from '../audio-timeline'
import { formatAudioTimestamp } from '../../engine/utils'

import { createCompoundContext } from '../../../../core/context'

/* ==========================================================================
   Context
   ========================================================================== */

export interface AudioRecorderContextValue {
  recorder: UseAudioRecorderResult
  lastRecording: AudioRecordingResult | null
  setLastRecording: (rec: AudioRecordingResult | null) => void
}

const { Provider: AudioRecorderContextProvider, useCompoundContext: useAudioRecorderContext } =
  createCompoundContext<AudioRecorderContextValue>('AudioRecorder')

export { useAudioRecorderContext }

/* ==========================================================================
   AudioRecorderProvider
   ========================================================================== */

export interface AudioRecorderProviderProps {
  children: ReactNode
  /** Custom options configuration. */
  options?: AudioRecorderOptions
  /** Callback fired when recording complete occurs. */
  onRecordingComplete?: (result: AudioRecordingResult) => void
  /** Custom uploader configuration. */
  uploader?: AudioUploader | null
  /** Custom auto upload configuration. */
  autoUpload?: boolean
}

export function AudioRecorderProvider({
  children,
  options,
  onRecordingComplete,
  uploader,
  autoUpload = Boolean(uploader),
}: AudioRecorderProviderProps) {
  const recorder = useAudioRecorder(options)
  const [lastRecording, setLastRecording] = useState<AudioRecordingResult | null>(null)
  const lastRecordingRef = useRef<AudioRecordingResult | null>(null)
  const upload = useAudioUpload({ uploader })

  return (
    <AudioRecorderContextProvider
      value={{
        recorder,
        lastRecording,
        setLastRecording: (res) => {
          if (lastRecordingRef.current && lastRecordingRef.current !== res) {
            revokeRecording(lastRecordingRef.current)
          }
          lastRecordingRef.current = res
          setLastRecording(res)
          if (res) {
            onRecordingComplete?.(res)
            if (autoUpload && uploader) {
              upload.upload(res.blob).catch(() => {})
            }
          }
        },
      }}
    >
      {children}
    </AudioRecorderContextProvider>
  )
}

/* ==========================================================================
   AudioRecorderTimer
   ========================================================================== */

export interface AudioRecorderTimerSlots {
  /** Timer span */
  label?: React.ComponentType<HTMLAttributes<HTMLSpanElement>>
}

export interface AudioRecorderTimerProps extends HTMLAttributes<HTMLSpanElement> {
  /** Slot overrides map */
  slotProps?: SlotPropsMap<AudioRecorderTimerSlots>
  /** Custom slot components */
  slots?: SlotComponents<AudioRecorderTimerSlots>
}

function AudioRecorderTimerPrimitive({ className, slots, slotProps, ...props }: AudioRecorderTimerProps) {
  const { recorder, lastRecording } = useAudioRecorderContext()
  const time = recorder.isRecording || recorder.isPaused ? recorder.duration : lastRecording?.duration ?? 0
  const formatted = formatAudioTimestamp(time)

  return renderSlot(
    slots?.label,
    {
      'data-slot': 'audio-recorder-timer',
      className: cn('font-mono text-sm font-semibold tabular-nums text-fg', className),
      children: formatted,
      ...slotProps?.label,
      ...props,
    } as any
  ) ?? (
    <span
      data-slot="audio-recorder-timer"
      className={cn('font-mono text-sm font-semibold tabular-nums text-fg', className)}
      {...props}
    >
      {formatted}
    </span>
  )
}

export const AudioRecorderTimer = createInterfaceComponent<
  AudioRecorderTimerProps,
  AudioRecorderTimerSlots
>(
  {
    name: 'AudioRecorderTimer',
    category: 'media',
    description: 'Displays current recording duration or length of finished recording.',
    version: '1.0.0',
    slots: {
      label: undefined,
    },
  },
  AudioRecorderTimerPrimitive
)

/* ==========================================================================
   AudioRecorder (Root)
   ========================================================================== */

export interface AudioRecorderSlots {
  /** Outer wrapper container element */
  container?: React.ComponentType<HTMLAttributes<HTMLDivElement>>
  /** Duration timer display slot */
  timer?: React.ComponentType<AudioRecorderTimerProps>
  /** Real-time microphone input waveform visualizer slot */
  waveform?: React.ComponentType<LiveWaveformProps>
  /** Post-recording review timeline scrubber slot */
  timeline?: React.ComponentType<AudioTimelineProps>
  /** Audio file drag-and-drop importer slot */
  importer?: React.ComponentType<AudioSourcePickerProps>
}

export interface AudioRecorderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onError'> {
  /** Card header title text override */
  title?: string
  /** Targeted audio input device ID */
  deviceId?: string
  /** Style of playback timeline ('bars' | 'slider') */
  timelineVariant?: 'bars' | 'slider'
  /** Recording complete callback */
  onSave?: (result: AudioRecordingResult) => void
  /** Alias callback for recording completion */
  onRecordingComplete?: (result: AudioRecordingResult) => void
  /** Audio uploader adapter */
  uploader?: AudioUploader | null
  /** Callback fired when an upload completes */
  onUpload?: (result: AudioUploadResult, file: Blob) => void
  /** Allow file drag-and-drop import */
  allowImport?: boolean
  /** Maximum recording duration in seconds */
  maxDuration?: number
  /** Detailed recorder engine options */
  options?: AudioRecorderOptions
  /** Automatically trigger upload on recording completion */
  autoUpload?: boolean
  /** Error callback */
  onError?: (error: Error) => void
  /** Slot overrides map */
  slots?: SlotComponents<AudioRecorderSlots>
  /** Property overrides passed down to injected slots */
  slotProps?: SlotPropsMap<AudioRecorderSlots>
}

function AudioRecorderPrimitive({
  title = 'Voice Recorder',
  deviceId,
  timelineVariant = 'bars',
  onSave,
  onRecordingComplete,
  uploader,
  onUpload,
  allowImport = true,
  maxDuration,
  options,
  autoUpload,
  onError: _onError,
  className,
  children,
  slots,
  slotProps,
  ...props
}: AudioRecorderProps) {
  const [playbackTime, setPlaybackTime] = useState(0)
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false)
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null)
  const handleComplete = onRecordingComplete ?? onSave

  const mergedOptions = useMemo(
    () => ({ deviceId, maxDuration, ...options }),
    [deviceId, maxDuration, options]
  )

  if (children) {
    return (
      <div
        data-slot="audio-recorder"
        className={cn(
          'relative flex w-full flex-col gap-4 rounded-2xl border border-border/40 bg-card/60 p-4 sm:p-5 shadow-sm backdrop-blur-md transition-all',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  const defaultContent = (
    <AudioRecorderProvider
      onRecordingComplete={handleComplete}
      uploader={uploader}
      autoUpload={autoUpload}
      options={mergedOptions}
    >
      <AudioRecorderCardInner
        title={title}
        deviceId={deviceId}
        timelineVariant={timelineVariant}
        playbackTime={playbackTime}
        setPlaybackTime={setPlaybackTime}
        isPlayingRecorded={isPlayingRecorded}
        setIsPlayingRecorded={setIsPlayingRecorded}
        audioPreviewRef={audioPreviewRef}
        allowImport={allowImport}
        uploader={uploader}
        onUpload={onUpload}
        slots={slots}
        slotProps={slotProps}
        className={className}
        {...props}
      />
    </AudioRecorderProvider>
  )

  return renderSlot(
    slots?.container,
    {
      'data-slot': 'audio-recorder',
      className: cn(
        'relative flex w-full flex-col gap-4 rounded-2xl border border-border/40 bg-card/60 p-4 sm:p-5 shadow-sm backdrop-blur-md transition-all',
        className
      ),
      children: defaultContent,
      ...slotProps?.container,
      ...props,
    } as any
  ) ?? defaultContent
}

export const AudioRecorder = createInterfaceComponent<
  AudioRecorderProps,
  AudioRecorderSlots
>(
  {
    name: 'AudioRecorder',
    category: 'media',
    description: 'Universal container and complete workstation for voice recording controls, live waveforms, and playback review.',
    version: '1.0.0',
    slots: {
      timer: AudioRecorderTimer,
      waveform: LiveWaveform,
      timeline: AudioTimeline,
      importer: AudioSourcePicker,
      container: undefined,
    },
  },
  AudioRecorderPrimitive
)

/* ==========================================================================
   AudioRecorderCard
   ========================================================================== */

export interface AudioRecorderCardSlots {
  /** Outer recorder container */
  recorder?: React.ComponentType<AudioRecorderProps>
  /** Timer duration display slot */
  timer?: React.ComponentType<AudioRecorderTimerProps>
  /** Live microphone waveform visualizer slot */
  waveform?: React.ComponentType<LiveWaveformProps>
  /** Playback timeline scrubber slot */
  timeline?: React.ComponentType<AudioTimelineProps>
  /** Source importer slot */
  importer?: React.ComponentType<AudioSourcePickerProps>
}

export interface AudioRecorderCardProps extends AudioRecorderProps {
  /** Card header title */
  title?: string
  /** Targeted audio input device ID */
  deviceId?: string
  /** Style of timeline */
  timelineVariant?: 'bars' | 'slider'
  /** Recording complete callback */
  onSave?: (result: AudioRecordingResult) => void
  /** Audio uploader */
  uploader?: AudioUploader | null
  /** Upload finished callback */
  onUpload?: (result: AudioUploadResult, file: Blob) => void
  /** Allow file drag-and-drop */
  allowImport?: boolean
  /** Maximum recording length in seconds */
  maxDuration?: number
  /** Class name */
  className?: string
  /** Slot overrides map */
  slotProps?: SlotPropsMap<AudioRecorderCardSlots>
  /** Custom slot components */
  slots?: SlotComponents<AudioRecorderCardSlots>
}

export interface AudioRecorderCardInnerSlots {
  /** Timer slot */
  timer?: React.ComponentType<AudioRecorderTimerProps>
  /** Waveform slot */
  waveform?: React.ComponentType<LiveWaveformProps>
  /** Timeline slot */
  timeline?: React.ComponentType<AudioTimelineProps>
  /** Importer slot */
  importer?: React.ComponentType<AudioSourcePickerProps>
}

export interface AudioRecorderCardInnerProps {
  /** Optional title heading displayed in card header. */
  title?: string
  /** Audio input device identifier to capture from. */
  deviceId?: string
  /** Visual presentation mode of the playback scrubber. */
  timelineVariant?: 'bars' | 'slider'
  /** Current playback time in seconds for the recorded snippet. */
  playbackTime: number
  /** State setter for updating preview playback time. */
  setPlaybackTime: (t: number) => void
  /** Whether the recorded audio preview is currently playing. */
  isPlayingRecorded: boolean
  /** State setter for toggling preview playback state. */
  setIsPlayingRecorded: (p: boolean) => void
  /** Ref to the preview HTMLAudioElement. */
  audioPreviewRef: RefObject<HTMLAudioElement | null>
  /** Whether to show the file drag-and-drop import zone. */
  allowImport?: boolean
  /** Optional audio uploader instance for remote cloud uploads. */
  uploader?: AudioUploader | null
  /** Callback fired when an imported or recorded audio file finishes uploading. */
  onUpload?: AudioRecorderCardProps['onUpload']
  /** Slot overrides map. */
  slots?: SlotComponents<AudioRecorderSlots>
  /** Slot props overrides map. */
  slotProps?: SlotPropsMap<AudioRecorderSlots>
  /** Additional CSS class names. */
  className?: string
}

function AudioRecorderCardInnerPrimitive({
  title,
  deviceId,
  timelineVariant = 'bars',
  playbackTime,
  setPlaybackTime,
  isPlayingRecorded,
  setIsPlayingRecorded,
  audioPreviewRef,
  allowImport,
  uploader,
  onUpload,
  slots,
  slotProps,
  className,
}: AudioRecorderCardInnerProps) {
  const { recorder, lastRecording, setLastRecording } = useAudioRecorderContext()

  const handleStart = async () => {
    setLastRecording(null)
    setPlaybackTime(0)
    setIsPlayingRecorded(false)
    try {
      await recorder.start(deviceId)
    } catch (err) {
      console.warn('Microphone start error:', err)
    }
  }

  const handleResumeRecord = async () => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause()
    }
    setLastRecording(null)
    setPlaybackTime(0)
    setIsPlayingRecorded(false)
    try {
      await recorder.resumeRecording(deviceId)
    } catch (err) {
      console.warn('Resume recording error:', err)
    }
  }

  const handleStop = async () => {
    const result = await recorder.stop()
    setLastRecording(result)
  }

  const handleClear = () => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause()
    }
    setLastRecording(null)
    setPlaybackTime(0)
    setIsPlayingRecorded(false)
  }

  const handleTogglePlayPreview = () => {
    if (!lastRecording?.url) return
    if (!audioPreviewRef.current) {
      const audio = new Audio(lastRecording.url)
      audioPreviewRef.current = audio
      audio.ontimeupdate = () => {
        setPlaybackTime(audio.currentTime)
      }
      audio.onended = () => {
        setIsPlayingRecorded(false)
        setPlaybackTime(0)
      }
    } else if (audioPreviewRef.current.src !== lastRecording.url) {
      audioPreviewRef.current.src = lastRecording.url
    }

    const audio = audioPreviewRef.current
    if (isPlayingRecorded) {
      audio.pause()
      setIsPlayingRecorded(false)
    } else {
      audio.play().then(() => setIsPlayingRecorded(true)).catch((e) => console.warn('Preview play error:', e))
    }
  }

  const handleSeekPreview = (time: number) => {
    setPlaybackTime(time)
    if (!audioPreviewRef.current && lastRecording?.url) {
      const audio = new Audio(lastRecording.url)
      audioPreviewRef.current = audio
      audio.ontimeupdate = () => {
        setPlaybackTime(audio.currentTime)
      }
      audio.onended = () => {
        setIsPlayingRecorded(false)
        setPlaybackTime(0)
      }
    } else if (audioPreviewRef.current && lastRecording?.url && audioPreviewRef.current.src !== lastRecording.url) {
      audioPreviewRef.current.src = lastRecording.url
    }

    if (audioPreviewRef.current) {
      try {
        audioPreviewRef.current.currentTime = time
      } catch (err) {
        console.warn('Seek preview error:', err)
      }
    }
  }

  return (
    <div
      data-slot="audio-recorder"
      className={cn(
        'relative flex w-full flex-col gap-4 rounded-2xl border border-border/40 bg-card/60 p-4 sm:p-5 shadow-sm backdrop-blur-md transition-all',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-2">
          {title && <span className="text-sm font-semibold text-fg">{title}</span>}
          {recorder.isRecording && (
            <span className="flex items-center gap-1.5 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-semibold text-danger">
              <span className="size-1.5 animate-pulse rounded-full bg-danger" />
              REC
            </span>
          )}
          {recorder.isPaused && (
            <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
              <span className="size-1.5 rounded-full bg-amber-500" />
              PAUSED
            </span>
          )}
        </div>
        {renderSlot(slots?.timer, slotProps?.timer, { defaultComponent: AudioRecorderTimer })}
      </div>

      {/* Visualizer Area */}
      <div className="relative h-20 w-full overflow-hidden rounded-base border border-border/40 bg-muted/30 p-2">
        {recorder.error ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
            <span className="text-xs font-medium text-danger">Microphone permission required</span>
            <Button
              type="button"
              size="xs"
              intent="outline"
              onPress={handleStart}
              className="text-[11px] h-6 px-2"
            >
              Grant Access
            </Button>
          </div>
        ) : lastRecording && !recorder.isRecording && !recorder.isPaused ? (
          renderSlot(
            slots?.timeline,
            {
              inlineLabels: true,
              currentTime: playbackTime,
              duration: lastRecording.duration,
              onSeek: handleSeekPreview,
              className: 'w-full h-full px-2',
              ...slotProps?.timeline,
            },
            { defaultComponent: AudioTimeline }
          )
        ) : (
          renderSlot(
            slots?.waveform,
            {
              active: recorder.isRecording,
              mediaStream: recorder.stream,
              deviceId,
              barWidth: 3,
              barGap: 1.5,
              sensitivity: 1.8,
              height: '100%',
              mode: 'static',
              ...slotProps?.waveform,
            },
            { defaultComponent: LiveWaveform }
          )
        )}
      </div>

      {/* Actions / Controls */}
      <div className="flex flex-wrap items-center justify-between gap-space-2 pt-1">
        {lastRecording && !recorder.isRecording && !recorder.isPaused ? (
          <>
            <div className="flex items-center gap-space-2">
              <Button
                type="button"
                intent="primary"
                size="sm"
                onPress={handleTogglePlayPreview}
                className="gap-1.5 whitespace-nowrap min-w-[76px]"
              >
                {isPlayingRecorded ? <PauseIcon className="size-3.5" /> : <PlayIcon className="size-3.5" />}
                <span>{isPlayingRecorded ? 'Pause' : 'Play'}</span>
              </Button>

              <div className="flex items-center rounded-micro border border-border/50 bg-muted/30 p-0.5">
                <a
                  href={lastRecording.url}
                  download={`recording-${Date.now()}.webm`}
                  className="inline-flex size-7 items-center justify-center rounded-micro text-muted-fg hover:bg-muted hover:text-fg transition-colors"
                  title="Download recording"
                >
                  <ArrowDownTrayIcon className="size-3.5" />
                </a>
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex size-7 items-center justify-center rounded-micro text-muted-fg hover:bg-danger/10 hover:text-danger transition-colors cursor-pointer"
                  title="Delete recording"
                  aria-label="Delete recording"
                >
                  <TrashIcon className="size-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                intent="secondary"
                size="sm"
                onPress={handleResumeRecord}
                className="gap-1.5 whitespace-nowrap"
                aria-label="Continue recording onto this audio"
              >
                <span className="size-1.5 rounded-full bg-danger animate-pulse" />
                <span>Resume</span>
              </Button>
              <Button
                type="button"
                intent="outline"
                size="sm"
                onPress={handleStart}
                className="gap-1.5 whitespace-nowrap text-muted-fg hover:text-fg"
                aria-label="Discard and start fresh recording"
              >
                <ArrowPathIcon className="size-3.5" />
                <span>Restart</span>
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-space-2">
            {recorder.isRecording || recorder.isPaused ? (
              <>
                <Button
                  type="button"
                  intent="danger"
                  size="sm"
                  onPress={handleStop}
                  className="gap-space-2 whitespace-nowrap"
                >
                  <StopIcon className="size-4" />
                  Stop Recording
                </Button>
                <Button
                  type="button"
                  intent="secondary"
                  size="sm"
                  onPress={recorder.isPaused ? recorder.resume : recorder.pause}
                  className="gap-1.5 whitespace-nowrap"
                >
                  {recorder.isPaused ? <PlayIcon className="size-3.5" /> : <PauseIcon className="size-3.5" />}
                  <span>{recorder.isPaused ? 'Resume' : 'Pause'}</span>
                </Button>
              </>
            ) : (
              <Button
                type="button"
                intent="primary"
                size="sm"
                onPress={handleStart}
                className="gap-space-2 whitespace-nowrap"
              >
                <span className="size-2 rounded-full bg-primary-fg" />
                Start Recording
              </Button>
            )}
          </div>
        )}
      </div>

      {allowImport && !recorder.isRecording && (
        renderSlot(
          slots?.importer,
          {
            ...slotProps?.importer,
            compact: true,
            uploader,
            autoUpload: Boolean(uploader),
            onUpload: (result: any, file: any) => onUpload?.(result, file),
            onFile: async (file: any) => {
              const imported = await recordingFromFile(file)
              setLastRecording(imported)
              setPlaybackTime(0)
              setIsPlayingRecorded(false)
            },
          },
          { defaultComponent: AudioSourcePicker }
        )
      )}
    </div>
  )
}

export const AudioRecorderCardInner = createInterfaceComponent<
  AudioRecorderCardInnerProps,
  AudioRecorderCardInnerSlots
>(
  {
    name: 'AudioRecorderCardInner',
    category: 'media',
    description: 'Inner interactive workstation for audio recorder card.',
    version: '1.0.0',
    slots: {
      timer: AudioRecorderTimer,
      waveform: LiveWaveform,
      timeline: AudioTimeline,
      importer: AudioSourcePicker,
      },
  },
  AudioRecorderCardInnerPrimitive
)

function AudioRecorderCardPrimitive({
  title = 'Voice Recorder',
  deviceId,
  timelineVariant = 'bars',
  onSave,
  onRecordingComplete,
  uploader,
  onUpload,
  allowImport = true,
  maxDuration,
  slots,
  slotProps,
  className,
  ...props
}: AudioRecorderCardProps) {
  const [playbackTime, setPlaybackTime] = useState(0)
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false)
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null)
  const handleComplete = onRecordingComplete ?? onSave

  const defaultCard = (
    <AudioRecorderProvider
      onRecordingComplete={handleComplete}
      uploader={uploader}
      options={{ deviceId, maxDuration }}
    >
      <AudioRecorderCardInner
        title={title}
        deviceId={deviceId}
        timelineVariant={timelineVariant}
        playbackTime={playbackTime}
        setPlaybackTime={setPlaybackTime}
        isPlayingRecorded={isPlayingRecorded}
        setIsPlayingRecorded={setIsPlayingRecorded}
        audioPreviewRef={audioPreviewRef}
        allowImport={allowImport}
        uploader={uploader}
        onUpload={onUpload}
        slots={slots}
        slotProps={slotProps}
        className={className}
        {...props}
      />
    </AudioRecorderProvider>
  )

  return renderSlot(
    slots?.recorder,
    {
      title,
      deviceId,
      timelineVariant,
      onSave,
      onRecordingComplete,
      uploader,
      onUpload,
      allowImport,
      maxDuration,
      className,
      children: defaultCard,
      ...slotProps?.recorder,
    }
  ) ?? defaultCard
}

export const AudioRecorderCard = createInterfaceComponent<
  AudioRecorderCardProps,
  AudioRecorderCardSlots
>(
  {
    name: 'AudioRecorderCard',
    category: 'media',
    description: 'Pre-composed voice recording workstation card with live waveform and playback scrubber.',
    version: '1.0.0',
    slots: {
      timer: AudioRecorderTimer,
      waveform: LiveWaveform,
      timeline: AudioTimeline,
      importer: AudioSourcePicker,
      recorder: undefined,
    },
  },
  AudioRecorderCardPrimitive
)

/* ==========================================================================
   AudioRecorderControls
   ========================================================================== */

export interface AudioRecorderControlsSlots {
  /** Start/stop record button slot */
  recordButton?: React.ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement>>
}

export interface AudioRecorderControlsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Slot overrides map */
  slots?: SlotComponents<AudioRecorderControlsSlots>
  /** Slot props map */
  slotProps?: SlotPropsMap<AudioRecorderControlsSlots>
  /** Children nodes */
  children?: React.ReactNode
}

function AudioRecorderControlsPrimitive({ className, children, slots, slotProps, ...props }: AudioRecorderControlsProps) {
  const content = children ?? (
    renderSlot(slots?.recordButton, slotProps?.recordButton)
  )

  return (
    <div
      data-slot="audio-recorder-controls"
      className={cn('flex flex-wrap items-center justify-between gap-space-2 pt-1', className)}
      {...props}
    >
      {content}
    </div>
  )
}

export const AudioRecorderControls = createInterfaceComponent<
  AudioRecorderControlsProps,
  AudioRecorderControlsSlots
>(
  {
    name: 'AudioRecorderControls',
    category: 'media',
    description: 'Control bar for the audio recorder containing start, stop, pause and playback action buttons.',
    version: '1.0.0',
    slots: {
      recordButton: undefined,
    },
  },
  AudioRecorderControlsPrimitive
)

/* ==========================================================================
   AudioRecorderLiveVisualizer
   ========================================================================== */

export interface AudioRecorderLiveVisualizerSlots {
  /** Waveform visualizer slot */
  waveform?: React.ComponentType<LiveWaveformProps>
}

export interface AudioRecorderLiveVisualizerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Slot overrides map */
  slots?: SlotComponents<AudioRecorderLiveVisualizerSlots>
  /** Slot props map */
  slotProps?: SlotPropsMap<AudioRecorderLiveVisualizerSlots>
  /** Children nodes */
  children?: React.ReactNode
}

function AudioRecorderLiveVisualizerPrimitive({
  className,
  children,
  slots,
  slotProps,
  ...props
}: AudioRecorderLiveVisualizerProps) {
  const { recorder } = useAudioRecorderContext()
  return (
    <div
      data-slot="audio-recorder-live-visualizer"
      className={cn('relative h-20 w-full overflow-hidden rounded-base border border-border/40 bg-muted/30 p-2', className)}
      {...props}
    >
      {children ??
        renderSlot(
          slots?.waveform,
          {
            active: recorder.isRecording,
            mediaStream: recorder.stream,
            barWidth: 3,
            barGap: 1.5,
            sensitivity: 1.8,
            height: '100%',
            mode: 'static',
            ...slotProps?.waveform,
          },
          { defaultComponent: LiveWaveform }
        )}
    </div>
  )
}

export const AudioRecorderLiveVisualizer = createInterfaceComponent<
  AudioRecorderLiveVisualizerProps,
  AudioRecorderLiveVisualizerSlots
>(
  {
    name: 'AudioRecorderLiveVisualizer',
    category: 'media',
    description: 'Real-time live microphone waveform visualizer displayed during active recording.',
    version: '1.0.0',
    slots: {
      waveform: LiveWaveform,
    },
  },
  AudioRecorderLiveVisualizerPrimitive
)

/* ==========================================================================
   Compound AudioRecorder Attachments
   ========================================================================== */

AudioRecorder.Provider = AudioRecorderProvider
AudioRecorder.Timer = AudioRecorderTimer
AudioRecorder.Card = AudioRecorderCard
AudioRecorder.CardInner = AudioRecorderCardInner
AudioRecorder.Controls = AudioRecorderControls
AudioRecorder.LiveVisualizer = AudioRecorderLiveVisualizer


