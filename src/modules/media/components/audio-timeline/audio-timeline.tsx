'use client'

import React, {
  useCallback,
  type HTMLAttributes,
} from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Slider } from '../../../core/components/slider'
import { useOptionalAudioPlayerEngine, useOptionalAudioPlayerSlice } from '../audio-player/audio-player'
import { formatAudioTimestamp } from '../../engine/utils'

import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'

export { formatAudioTimestamp }

export type AudioTimelineVariant = 'slider'

export interface AudioTimelineContextValue {
  currentTime: number
  duration: number
  isDisabled: boolean
  handleSeek: (timeInSeconds: number) => void
}

const { Provider: AudioTimelineContextProvider, useCompoundContext: useAudioTimelineContext } =
  createCompoundContext<AudioTimelineContextValue>('AudioTimeline')

export { useAudioTimelineContext }

export interface AudioTimelineSlots {
  /** Outer container wrapper */
  container?: React.ComponentType<HTMLAttributes<HTMLDivElement>>
  /** Time stamp label component */
  timestamp?: React.ComponentType<AudioTimelineTimestampProps>
}

export interface AudioTimelineProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Variant of the timeline. Currently supports 'slider'. Default: 'slider'. */
  variant?: AudioTimelineVariant
  /** Current playback time in seconds. Optional if inside AudioPlayerProvider. */
  currentTime?: number
  /** Total media duration in seconds. Optional if inside AudioPlayerProvider. */
  duration?: number
  /** Callback fired when user seeks to a new timestamp. */
  onSeek?: (timeInSeconds: number) => void
  /** Normalized amplitude data (preserved for API compatibility). */
  data?: number[]
  /** Whether to render elapsed/duration timestamp labels below the slider. Default: false. */
  showLabels?: boolean
  /** Whether timestamp labels are shown inline alongside the slider. Default: false. */
  inlineLabels?: boolean
  /** Whether the timeline interactions are disabled. */
  isDisabled?: boolean
  /** Slot overrides map. */
  slotProps?: SlotPropsMap<AudioTimelineSlots>
  /** Custom slot components. */
  slots?: SlotComponents<AudioTimelineSlots>
}

export interface AudioTimelineSliderProps extends HTMLAttributes<HTMLDivElement> {
  className?: string
}

function AudioTimelineSliderPrimitive({ className, ...props }: AudioTimelineSliderProps) {
  const { currentTime, duration, isDisabled, handleSeek } = useAudioTimelineContext()

  return (
    <div className={cn('w-full flex-1', className)} {...props}>
      <Slider
        aria-label="Audio playback progress"
        minValue={0}
        maxValue={Math.max(duration, 0.1)}
        step={0.01}
        value={currentTime}
        isDisabled={isDisabled || duration <= 0}
        onChange={(v) => {
          const val = typeof v === 'number' ? v : v[0]
          handleSeek(val)
        }}
        className="w-full flex-1"
      >
        <Slider.Track />
      </Slider>
    </div>
  )
}

export const AudioTimelineSlider = createInterfaceComponent<
  AudioTimelineSliderProps,
  Record<string, never>
>(
  {
    name: 'AudioTimelineSlider',
    category: 'media',
    description: 'Slider track for audio timeline.',
    version: '1.0.0',
  },
  AudioTimelineSliderPrimitive
)

export interface AudioTimelineTimestampProps extends HTMLAttributes<HTMLSpanElement> {
  /** Custom type configuration. */
  type?: 'current' | 'total'
}

function AudioTimelineTimestampPrimitive({
  type = 'current',
  className,
  ...props
}: AudioTimelineTimestampProps) {
  const { currentTime, duration } = useAudioTimelineContext()
  const display = type === 'current' ? formatAudioTimestamp(currentTime) : (duration > 0 ? formatAudioTimestamp(duration) : '--:--')

  return (
    <span
      className={cn('font-mono text-xs text-muted-fg tabular-nums shrink-0 select-none', className)}
      {...props}
    >
      {display}
    </span>
  )
}

export const AudioTimelineTimestamp = createInterfaceComponent<
  AudioTimelineTimestampProps,
  Record<string, never>
>(
  {
    name: 'AudioTimelineTimestamp',
    category: 'media',
    description: 'Timestamp label for audio timeline.',
    version: '1.0.0',
  },
  AudioTimelineTimestampPrimitive
)

function AudioTimelinePrimitive({
  variant: _variant = 'slider',
  currentTime: propCurrentTime,
  duration: propDuration,
  onSeek: propOnSeek,
  data: _data,
  showLabels = false,
  inlineLabels = false,
  isDisabled = false,
  className,
  children,
  slots,
  slotProps,
  ...props
}: AudioTimelineProps) {
  const engine = useOptionalAudioPlayerEngine()
  const contextCurrentTime = useOptionalAudioPlayerSlice((s) => s.currentTime, 0)
  const contextDuration = useOptionalAudioPlayerSlice((s) => s.duration, 0)

  const currentTime = propCurrentTime !== undefined ? propCurrentTime : (engine ? contextCurrentTime : 0)

  const rawDuration = propDuration !== undefined ? propDuration : (engine ? contextDuration : 0)
  const engineAudio = engine?.getAudioElement?.()
  const engineDuration = engineAudio && Number.isFinite(engineAudio.duration) && engineAudio.duration > 0
    ? engineAudio.duration
    : 0
  const duration = rawDuration > 0 ? rawDuration : engineDuration

  const handleSeek = useCallback(
    (timeInSeconds: number) => {
      if (isDisabled) return
      const maxDur = duration > 0 ? duration : (engineDuration > 0 ? engineDuration : Infinity)
      const clamped = Math.max(0, Math.min(maxDur, timeInSeconds))
      if (propOnSeek) {
        propOnSeek(clamped)
      } else if (engine) {
        engine.seek(clamped)
      }
    },
    [isDisabled, duration, engineDuration, propOnSeek, engine]
  )

  const contextValue: AudioTimelineContextValue = {
    currentTime,
    duration,
    isDisabled,
    handleSeek,
  }

  if (children) {
    return (
      <AudioTimelineContextProvider value={contextValue}>
        <div
          data-slot="audio-timeline"
          className={cn('flex items-center gap-2.5 w-full', className)}
          {...props}
        >
          {children}
        </div>
      </AudioTimelineContextProvider>
    )
  }

  const slider = <AudioTimelineSlider />

  const defaultContent = inlineLabels ? (
    <div
      data-slot="audio-timeline"
      className={cn('flex items-center gap-2.5 w-full', className)}
      {...props}
    >
      {renderSlot(
        slots?.timestamp,
        { type: 'current', ...slotProps?.timestamp },
        { defaultComponent: AudioTimelineTimestamp }
      )}
      {slider}
      {renderSlot(
        slots?.timestamp,
        { type: 'total', ...slotProps?.timestamp },
        { defaultComponent: AudioTimelineTimestamp }
      )}
    </div>
  ) : (
    <div
      data-slot="audio-timeline"
      className={cn('flex flex-col gap-1.5 w-full justify-center', className)}
      {...props}
    >
      {slider}
      {showLabels && (
        <div className="flex items-center justify-between font-mono text-xs tabular-nums text-muted-fg">
          {renderSlot(
            slots?.timestamp,
            { type: 'current', ...slotProps?.timestamp },
            { defaultComponent: AudioTimelineTimestamp }
          )}
          {renderSlot(
            slots?.timestamp,
            { type: 'total', ...slotProps?.timestamp },
            { defaultComponent: AudioTimelineTimestamp }
          )}
        </div>
      )}
    </div>
  )

  return (
    <AudioTimelineContextProvider value={contextValue}>
      {renderSlot(
        slots?.container,
        {
          'data-slot': 'audio-timeline',
          className: cn(
            inlineLabels ? 'flex items-center gap-2.5 w-full' : 'flex flex-col gap-1.5 w-full justify-center',
            className
          ),
          children: defaultContent,
          ...slotProps?.container,
          ...props,
        } as any
      ) ?? defaultContent}
    </AudioTimelineContextProvider>
  )
}

export const AudioTimeline = createInterfaceComponent<
  AudioTimelineProps,
  AudioTimelineSlots
>(
  {
    name: 'AudioTimeline',
    category: 'media',
    description: 'Universal interactive audio playback timeline using standard slider.',
    version: '1.0.0',
    props: {
      variant: 'slider',
    },
    slots: {
      timestamp: AudioTimelineTimestamp,
      container: undefined,
    },
  },
  AudioTimelinePrimitive
)

AudioTimeline.Slider = AudioTimelineSlider
AudioTimeline.Timestamp = AudioTimelineTimestamp

