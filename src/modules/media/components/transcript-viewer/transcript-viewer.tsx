'use client'

import React, {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react'
import { PauseIcon, PlayIcon } from '@heroicons/react/24/solid'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Button, type ButtonProps } from '../../../core/components/button'
import { Slider } from '../../../core/components/slider'
import {
  useTranscriptEngine,
  type UseTranscriptEngineProps,
  type UseTranscriptEngineResult,
} from '../../hooks/use-transcript-engine'
import type {
  TranscriptAlignment,
  TranscriptGap,
  TranscriptInput,
  TranscriptSegment,
  TranscriptWord,
  TranscriptWordStatus,
} from '../../engine/types'
import { normalizeTranscript } from '../../engine/transcript-engine'
import type { AudioPlayerEngine } from '../../engine/player-engine'
import { formatAudioTimestamp } from '../../engine/utils'

import { createCompoundContext } from '../../../../core/context'

/* ==========================================================================
   Context
   ========================================================================== */

export const {
  Context: TranscriptViewerContext,
  Provider: TranscriptViewerProvider,
  useCompoundContext: useTranscriptViewerContext,
} = createCompoundContext<UseTranscriptEngineResult>('TranscriptViewer')

/* ==========================================================================
   TranscriptViewerContainer (Root)
   ========================================================================== */

export interface TranscriptViewerContainerSlots {
  /** Root container element */
  container?: React.ComponentType<HTMLAttributes<HTMLDivElement>>
}

export interface TranscriptViewerContainerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onPlay' | 'onPause' | 'onEnded' | 'onTimeUpdate' | 'onDurationChange'>,
    Omit<UseTranscriptEngineProps, 'alignment'> {
  /** Optional audio source URL */
  audioSrc?: string
  /** Alias for audio source URL */
  source?: string
  /** Transcript source data */
  transcript?: TranscriptInput
  /** Alignment structure */
  alignment?: TranscriptAlignment | TranscriptInput
  /** Optional external player engine reference */
  playerEngine?: AudioPlayerEngine<any> | null
  /** Child nodes */
  children?: ReactNode
  /** Slot overrides map */
  slotProps?: SlotPropsMap<TranscriptViewerContainerSlots>
  /** Custom slot components */
  slots?: SlotComponents<TranscriptViewerContainerSlots>
}

function TranscriptViewerContainerPrimitive({
  alignment,
  transcript,
  hideAudioTags = true,
  audioSrc,
  source,
  audioRef: externalAudioRef,
  playerEngine,
  onPlay,
  onPause,
  onTimeUpdate,
  onEnded,
  onDurationChange,
  children,
  className,
  slots,
  slotProps,
  ...props
}: TranscriptViewerContainerProps) {
  const effectiveSrc = audioSrc ?? source
  const effectiveAlignment = useMemo(
    () =>
      normalizeTranscript(transcript ?? alignment, {
        hideAudioTags,
        duration: playerEngine?.getState().duration,
      }),
    [transcript, alignment, hideAudioTags, playerEngine]
  )

  const viewerState = useTranscriptEngine({
    alignment: effectiveAlignment,
    hideAudioTags,
    audioRef: externalAudioRef,
    onPlay,
    onPause,
    onTimeUpdate,
    onEnded,
    onDurationChange,
  })

  useEffect(() => {
    if (effectiveSrc) return
    const node = playerEngine?.getAudioElement() ?? null
    const bind = viewerState.audioRef
    if (typeof bind === 'function') bind(node)
  }, [effectiveSrc, playerEngine, viewerState.audioRef])

  const defaultContent = (
    <div
      data-slot="transcript-viewer-root"
      className={cn(
        'flex flex-col gap-4 rounded-2xl border border-border/40 bg-card/60 p-4 sm:p-5 backdrop-blur-md transition-all',
        className
      )}
      {...props}
    >
      {effectiveSrc && (
        <audio
          ref={viewerState.audioRef as RefObject<HTMLAudioElement | null>}
          src={effectiveSrc}
          preload="metadata"
          className="hidden"
        />
      )}
      {children}
    </div>
  )

  return (
    <TranscriptViewerContext.Provider value={viewerState}>
      {renderSlot(
        slots?.container,
        {
          'data-slot': 'transcript-viewer-root',
          className: cn(
            'flex flex-col gap-4 rounded-2xl border border-border/40 bg-card/60 p-4 sm:p-5 backdrop-blur-md transition-all',
            className
          ),
          children: (
            <>
              {effectiveSrc && (
                <audio
                  ref={viewerState.audioRef as RefObject<HTMLAudioElement | null>}
                  src={effectiveSrc}
                  preload="metadata"
                  className="hidden"
                />
              )}
              {children}
            </>
          ),
          ...slotProps?.container,
          ...props,
        } as any
      ) ?? defaultContent}
    </TranscriptViewerContext.Provider>
  )
}

export const TranscriptViewerContainer = createInterfaceComponent<
  TranscriptViewerContainerProps,
  TranscriptViewerContainerSlots
>(
  {
    name: 'TranscriptViewerContainer',
    category: 'media',
    description: 'Root container establishing transcript synchronization context.',
    version: '1.0.0',
    slots: {
      container: undefined,
    },
  },
  TranscriptViewerContainerPrimitive
)

/* ==========================================================================
   TranscriptViewerWord
   ========================================================================== */

export interface TranscriptViewerWordWrapperProps extends HTMLAttributes<HTMLSpanElement> {
  /** The word metadata */
  word?: TranscriptWord
  /** Current word playback status */
  status?: TranscriptWordStatus
}

export interface TranscriptViewerWordSlots {
  /** Custom word text wrapper */
  wrapper?: React.ComponentType<TranscriptViewerWordWrapperProps>
}

export interface TranscriptViewerWordProps extends HTMLAttributes<HTMLSpanElement> {
  /** The word metadata */
  word: TranscriptWord
  /** Current word playback status */
  status: TranscriptWordStatus
  /** Optional click callback */
  onClickWord?: (word: TranscriptWord) => void
  /** Slot overrides map */
  slotProps?: SlotPropsMap<TranscriptViewerWordSlots>
  /** Custom slot components */
  slots?: SlotComponents<TranscriptViewerWordSlots>
}

function TranscriptViewerWordPrimitive({
  word,
  status,
  onClickWord,
  className,
  children,
  slots,
  slotProps,
  ...props
}: TranscriptViewerWordProps) {
  const { seekToWord } = useTranscriptViewerContext()
  const wordRef = useRef<HTMLSpanElement | null>(null)

  const handleClick = () => {
    seekToWord(word)
    onClickWord?.(word)
  }

  useEffect(() => {
    if (status === 'current' && wordRef.current) {
      wordRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      })
    }
  }, [status])

  const wordNode = (
    <span
      ref={wordRef}
      data-slot="transcript-word"
      data-status={status}
      onClick={handleClick}
      className={cn(
        'relative z-[1] inline-flex cursor-pointer items-center rounded-micro px-1 py-0.5 transition-colors duration-200 select-text',
        status === 'spoken' && 'text-fg font-normal',
        status === 'unspoken' && 'text-muted-fg/40 hover:text-muted-fg/80',
        status === 'current' && 'text-primary-fg font-medium',
        className
      )}
      {...props}
    >
      {children ?? word.text}
    </span>
  )

  return renderSlot(
    slots?.wrapper,
    {
      word,
      status,
      children: wordNode,
      ...slotProps?.wrapper,
    }
  ) ?? wordNode
}

export const TranscriptViewerWord = createInterfaceComponent<
  TranscriptViewerWordProps,
  TranscriptViewerWordSlots
>(
  {
    name: 'TranscriptViewerWord',
    category: 'media',
    description: 'Individual interactive transcript word unit.',
    version: '1.0.0',
    slots: {
      wrapper: undefined,
    },
  },
  TranscriptViewerWordPrimitive
)

/* ==========================================================================
   TranscriptViewerWords
   ========================================================================== */

export interface TranscriptViewerWordsSlots {
  /** Glider indicator */
  glider?: React.ComponentType<HTMLAttributes<HTMLSpanElement>>
}

export interface TranscriptViewerWordsProps extends HTMLAttributes<HTMLDivElement> {
  /** Custom word renderer */
  renderWord?: (props: { word: TranscriptWord; status: TranscriptWordStatus }) => ReactNode
  /** Custom gap/space renderer */
  renderGap?: (props: { segment: TranscriptGap; status: TranscriptWordStatus }) => ReactNode
  /** ClassName applied to inner words */
  wordClassName?: string
  /** Visual font scale variant */
  size?: 'sm' | 'md' | 'lg'
  /** Max scroll height */
  maxHeight?: string | number
  /** Slot overrides map */
  slotProps?: SlotPropsMap<TranscriptViewerWordsSlots>
  /** Custom slot components */
  slots?: SlotComponents<TranscriptViewerWordsSlots>
}

function TranscriptViewerWordsPrimitive({
  className,
  renderWord,
  renderGap,
  wordClassName,
  size = 'md',
  maxHeight = 240,
  style,
  slots,
  slotProps,
  ...props
}: TranscriptViewerWordsProps) {
  const { spokenSegments, unspokenSegments, currentWord, segments, duration, currentTime, words } =
    useTranscriptViewerContext()

  const nearEnd = duration > 0 && currentTime >= duration - 0.05
  const hasTimings = words.some((word) => word.endTime > word.startTime)

  const segmentsWithStatus = useMemo(() => {
    if (!hasTimings) {
      return segments.map((s) => ({ segment: s, status: 'spoken' as const }))
    }

    if (nearEnd) {
      return segments.map((s) => ({ segment: s, status: 'spoken' as const }))
    }

    const res: Array<{ segment: TranscriptSegment; status: TranscriptWordStatus }> = []
    for (const s of spokenSegments) {
      res.push({ segment: s, status: 'spoken' })
    }
    if (currentWord) {
      res.push({ segment: currentWord, status: 'current' })
    }
    for (const s of unspokenSegments) {
      res.push({ segment: s, status: 'unspoken' })
    }
    return res
  }, [spokenSegments, unspokenSegments, currentWord, nearEnd, segments, hasTimings])

  const sizeClasses = {
    sm: 'text-sm leading-relaxed',
    md: 'text-base leading-relaxed',
    lg: 'text-lg leading-loose',
  }

  const scrollStyle: React.CSSProperties = {
    maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
    overflowY: 'auto',
    ...style,
  }

  const scrollRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [glider, setGlider] = useState({ x: 0, y: 0, w: 0, h: 0, visible: false })

  useLayoutEffect(() => {
    const measure = measureRef.current
    if (!measure) return

    const update = () => {
      const el = measure.querySelector(
        '[data-slot="transcript-word"][data-status="current"]'
      ) as HTMLElement | null
      if (!el) {
        setGlider((prev) => (prev.visible ? { ...prev, visible: false } : prev))
        return
      }
      const origin = measure.getBoundingClientRect()
      const box = el.getBoundingClientRect()
      const next = {
        x: box.left - origin.left,
        y: box.top - origin.top,
        w: box.width,
        h: box.height,
        visible: true,
      }
      setGlider((prev) =>
        prev.x === next.x && prev.y === next.y && prev.w === next.w && prev.h === next.h && prev.visible
          ? prev
          : next
      )
    }

    update()
    const frame = requestAnimationFrame(update)
    const ro = new ResizeObserver(update)
    ro.observe(measure)
    const current = measure.querySelector(
      '[data-slot="transcript-word"][data-status="current"]'
    )
    if (current) ro.observe(current)
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
    }
  }, [currentWord, hasTimings, nearEnd, size, segmentsWithStatus])

  return (
    <div
      ref={scrollRef}
      data-slot="transcript-words"
      style={scrollStyle}
      className={cn(
        'tracking-normal select-text scrollbar-thin scroll-smooth',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <div ref={measureRef} className="relative">
        {renderSlot(
          slots?.glider,
          {
            'aria-hidden': 'true',
            className: 'pointer-events-none absolute top-0 left-0 z-0 rounded-micro bg-primary shadow-xs',
            style: {
              transform: `translate3d(${glider.x}px, ${glider.y}px, 0)`,
              width: glider.w,
              height: glider.h,
              opacity: glider.visible ? 1 : 0,
              transition:
                'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), width 220ms cubic-bezier(0.22, 1, 0.36, 1), height 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 160ms ease',
            },
            ...slotProps?.glider,
          }
        ) ?? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 z-0 rounded-micro bg-primary shadow-xs"
            style={{
              transform: `translate3d(${glider.x}px, ${glider.y}px, 0)`,
              width: glider.w,
              height: glider.h,
              opacity: glider.visible ? 1 : 0,
              transition:
                'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), width 220ms cubic-bezier(0.22, 1, 0.36, 1), height 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 160ms ease',
            }}
          />
        )}
        {segmentsWithStatus.map(({ segment, status }) => {
          if (segment.kind === 'gap') {
            return renderGap ? (
              <span key={`gap-${segment.segmentIndex}`}>
                {renderGap({ segment, status })}
              </span>
            ) : (
              <span key={`gap-${segment.segmentIndex}`}>{segment.text}</span>
            )
          }

          if (renderWord) {
            return (
              <span key={`word-${segment.segmentIndex}`}>
                {renderWord({ word: segment, status })}
              </span>
            )
          }

          return (
            <TranscriptViewerWord
              key={`word-${segment.segmentIndex}`}
              word={segment}
              status={status}
              className={wordClassName}
            />
          )
        })}
      </div>
    </div>
  )
}

export const TranscriptViewerWords = createInterfaceComponent<
  TranscriptViewerWordsProps,
  TranscriptViewerWordsSlots
>(
  {
    name: 'TranscriptViewerWords',
    category: 'media',
    description: 'Continuous synchronized transcript word stream with active glider highlight.',
    version: '1.0.0',
    slots: {
      glider: undefined,
    },
  },
  TranscriptViewerWordsPrimitive
)

/* ==========================================================================
   TranscriptViewerPlayPauseButton
   ========================================================================== */

export interface TranscriptViewerPlayPauseButtonSlots {
  /** Play icon */
  playIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Pause icon */
  pauseIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface TranscriptViewerPlayPauseButtonProps
  extends Omit<ButtonProps, 'children' | 'slots' | 'slotProps'> {
  /** Slot overrides map */
  slotProps?: SlotPropsMap<TranscriptViewerPlayPauseButtonSlots>
  /** Custom slot components */
  slots?: SlotComponents<TranscriptViewerPlayPauseButtonSlots>
}

function TranscriptViewerPlayPauseButtonPrimitive({
  className,
  slots,
  slotProps,
  ...props
}: TranscriptViewerPlayPauseButtonProps) {
  const { isPlaying, play, pause } = useTranscriptViewerContext()

  return (
    <Button
      type="button"
      intent="primary"
      size="sq-md"
      isCircle
      onPress={isPlaying ? pause : play}
      aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
      className={cn('cursor-pointer shadow-sm transition-transform active:scale-95', className)}
      {...props}
    >
      {isPlaying
        ? renderSlot(slots?.pauseIcon, { className: 'size-5', ...slotProps?.pauseIcon }, { defaultComponent: PauseIcon })
        : renderSlot(slots?.playIcon, { className: 'size-5 translate-x-0.5', ...slotProps?.playIcon }, { defaultComponent: PlayIcon })}
    </Button>
  )
}

export const TranscriptViewerPlayPauseButton = createInterfaceComponent<
  TranscriptViewerPlayPauseButtonProps,
  TranscriptViewerPlayPauseButtonSlots
>(
  {
    name: 'TranscriptViewerPlayPauseButton',
    category: 'media',
    description: 'Toggle play/pause button for transcript synchronized audio.',
    version: '1.0.0',
    slots: {
      playIcon: PlayIcon,
      pauseIcon: PauseIcon,
    },
  },
  TranscriptViewerPlayPauseButtonPrimitive
)

/* ==========================================================================
   TranscriptViewerScrubBar
   ========================================================================== */

export interface TranscriptViewerScrubBarSlots {
  /** Inner scrub bar component */
  scrubBar?: React.ComponentType<HTMLAttributes<HTMLDivElement>>
}

export interface TranscriptViewerScrubBarProps extends HTMLAttributes<HTMLDivElement> {
  /** Whether to render start and end time labels below the bar */
  showLabels?: boolean
  /** Slot overrides map */
  slotProps?: SlotPropsMap<TranscriptViewerScrubBarSlots>
  /** Custom slot components */
  slots?: SlotComponents<TranscriptViewerScrubBarSlots>
}

function TranscriptViewerScrubBarPrimitive({
  showLabels = true,
  className,
  ...props
}: TranscriptViewerScrubBarProps) {
  const { duration, currentTime, seekToTime } =
    useTranscriptViewerContext()

  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)} {...props}>
      <Slider
        aria-label="Transcript playback progress"
        minValue={0}
        maxValue={Math.max(duration, 0.1)}
        step={0.01}
        value={currentTime}
        isDisabled={duration <= 0}
        onChange={(v) => {
          const val = typeof v === 'number' ? v : v[0]
          seekToTime(val)
        }}
        className="w-full"
      >
        <Slider.Track />
      </Slider>
      {showLabels && (
        <div className="flex items-center justify-between font-mono text-[11px] tabular-nums text-muted-fg">
          <span>{formatAudioTimestamp(currentTime)}</span>
          <span>{duration > 0 ? formatAudioTimestamp(duration) : '--:--'}</span>
        </div>
      )}
    </div>
  )
}

export const TranscriptViewerScrubBar = createInterfaceComponent<
  TranscriptViewerScrubBarProps,
  TranscriptViewerScrubBarSlots
>(
  {
    name: 'TranscriptViewerScrubBar',
    category: 'media',
    description: 'Timeline progress scrubber attached to transcript audio playback.',
    version: '1.0.0',
    slots: {
      scrubBar: undefined,
    },
  },
  TranscriptViewerScrubBarPrimitive
)

/* ==========================================================================
   TranscriptViewerTime & Duration
   ========================================================================== */

export interface TranscriptViewerTimeSlots {
  /** Label wrapper */
  label?: React.ComponentType<HTMLAttributes<HTMLSpanElement>>
}

export interface TranscriptViewerTimeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Slot overrides map */
  slotProps?: SlotPropsMap<TranscriptViewerTimeSlots>
  /** Custom slot components */
  slots?: SlotComponents<TranscriptViewerTimeSlots>
}

function TranscriptViewerTimePrimitive({ className, slots, slotProps, ...props }: TranscriptViewerTimeProps) {
  const { currentTime } = useTranscriptViewerContext()
  const formatted = formatAudioTimestamp(currentTime)
  return renderSlot(
    slots?.label,
    {
      className: cn('font-mono text-xs tabular-nums text-muted-fg', className),
      children: formatted,
      ...slotProps?.label,
      ...props,
    }
  ) ?? (
    <span className={cn('font-mono text-xs tabular-nums text-muted-fg', className)} {...props}>
      {formatted}
    </span>
  )
}

export const TranscriptViewerTime = createInterfaceComponent<
  TranscriptViewerTimeProps,
  TranscriptViewerTimeSlots
>(
  {
    name: 'TranscriptViewerTime',
    category: 'media',
    description: 'Current playback elapsed timestamp.',
    version: '1.0.0',
    slots: {
      label: undefined,
    },
  },
  TranscriptViewerTimePrimitive
)

function TranscriptViewerDurationPrimitive({ className, slots, slotProps, ...props }: TranscriptViewerTimeProps) {
  const { duration } = useTranscriptViewerContext()
  const formatted = duration > 0 ? formatAudioTimestamp(duration) : '--:--'
  return renderSlot(
    slots?.label,
    {
      className: cn('font-mono text-xs tabular-nums text-muted-fg', className),
      children: formatted,
      ...slotProps?.label,
      ...props,
    }
  ) ?? (
    <span className={cn('font-mono text-xs tabular-nums text-muted-fg', className)} {...props}>
      {formatted}
    </span>
  )
}

export const TranscriptViewerDuration = createInterfaceComponent<
  TranscriptViewerTimeProps,
  TranscriptViewerTimeSlots
>(
  {
    name: 'TranscriptViewerDuration',
    category: 'media',
    description: 'Total media playback duration timestamp.',
    version: '1.0.0',
    slots: {
      label: undefined,
    },
  },
  TranscriptViewerDurationPrimitive
)

/* ==========================================================================
   TranscriptViewer Composite Root
   ========================================================================== */

export interface TranscriptViewerSlots {
  /** Root container */
  container?: React.ComponentType<TranscriptViewerContainerProps>
  /** Words stream */
  words?: React.ComponentType<TranscriptViewerWordsProps>
  /** Play/pause button */
  playButton?: React.ComponentType<TranscriptViewerPlayPauseButtonProps>
  /** Timeline scrubber */
  scrubBar?: React.ComponentType<TranscriptViewerScrubBarProps>
}

export interface TranscriptViewerProps
  extends Omit<TranscriptViewerContainerProps, 'alignment' | 'slots' | 'slotProps'> {
  /** Source audio URL */
  src?: string
  /** Raw or normalized transcript input */
  transcript?: TranscriptInput
  /** Alignment structure input */
  alignment?: TranscriptInput
  /** Font scale */
  size?: 'sm' | 'md' | 'lg'
  /** Max scroll height */
  maxHeight?: string | number
  /** Whether to render default transport controls */
  showTransport?: boolean
  /** Child nodes or compound subcomponents */
  children?: ReactNode
  /** Slot overrides map */
  slotProps?: SlotPropsMap<TranscriptViewerSlots>
  /** Custom slot components */
  slots?: SlotComponents<TranscriptViewerSlots>
}

function TranscriptViewerPrimitive({
  src,
  audioSrc,
  transcript,
  alignment,
  size,
  maxHeight,
  showTransport = true,
  playerEngine,
  className,
  slots,
  slotProps,
  ...props
}: TranscriptViewerProps) {
  const effectiveSrc = src ?? audioSrc
  const effectiveAlignment = transcript ?? alignment
  const hideTransport = !showTransport || (!effectiveSrc && Boolean(playerEngine))

  const defaultContent = (
    <TranscriptViewerContainer
      audioSrc={effectiveSrc}
      alignment={effectiveAlignment}
      transcript={effectiveAlignment}
      playerEngine={playerEngine}
      className={className}
      {...props}
    >
      {renderSlot(
        slots?.words,
        { size, maxHeight, className: 'rounded-base bg-muted/25 px-3 py-2.5', ...slotProps?.words },
        { defaultComponent: TranscriptViewerWords }
      )}
      {!hideTransport && (
        <div className="flex items-center gap-space-3">
          {effectiveSrc && (
            renderSlot(slots?.playButton, { className: 'shrink-0', ...slotProps?.playButton }, { defaultComponent: TranscriptViewerPlayPauseButton })
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex h-14 w-full items-center overflow-hidden rounded-base bg-muted/25 px-3">
              {renderSlot(slots?.scrubBar, { showLabels: false, className: 'w-full', ...slotProps?.scrubBar }, { defaultComponent: TranscriptViewerScrubBar })}
            </div>
            <div className="flex items-center justify-between font-mono text-[11px] tabular-nums text-muted-fg">
              <TranscriptViewerTime />
              <TranscriptViewerDuration />
            </div>
          </div>
        </div>
      )}
    </TranscriptViewerContainer>
  )

  return renderSlot(
    slots?.container,
    {
      audioSrc: effectiveSrc,
      alignment: effectiveAlignment,
      transcript: effectiveAlignment,
      playerEngine,
      className,
      children: defaultContent,
      ...slotProps?.container,
      ...props,
    },
    { defaultComponent: TranscriptViewerContainer }
  ) ?? defaultContent
}

export const TranscriptViewer = createInterfaceComponent<
  TranscriptViewerProps,
  TranscriptViewerSlots
>(
  {
    name: 'TranscriptViewer',
    category: 'media',
    description: 'Synchronized audio transcript reader with active word tracking and timeline seeking.',
    version: '1.0.0',
    slots: {
      words: TranscriptViewerWords,
      playButton: TranscriptViewerPlayPauseButton,
      scrubBar: TranscriptViewerScrubBar,
      container: TranscriptViewerContainer,
    },
  },
  TranscriptViewerPrimitive
)

/* ==========================================================================
   TranscriptViewerHeader
   ========================================================================== */

export interface TranscriptViewerHeaderSlots {}

export interface TranscriptViewerHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Title text for the transcript header */
  title?: string
  /** Children nodes */
  children?: React.ReactNode
  /** Slot overrides map */
  slots?: SlotComponents<TranscriptViewerHeaderSlots>
  /** Slot props map */
  slotProps?: SlotPropsMap<TranscriptViewerHeaderSlots>
}

function TranscriptViewerHeaderPrimitive({ className, title, children, ...props }: TranscriptViewerHeaderProps) {
  return (
    <div
      data-slot="transcript-viewer-header"
      className={cn('flex items-center justify-between gap-2', className)}
      {...props}
    >
      {children ?? (title ? <span className="text-sm font-semibold text-fg">{title}</span> : null)}
    </div>
  )
}

export const TranscriptViewerHeader = createInterfaceComponent<
  TranscriptViewerHeaderProps,
  TranscriptViewerHeaderSlots
>(
  {
    name: 'TranscriptViewerHeader',
    category: 'media',
    description: 'Optional header row for the transcript viewer containing title and action slots.',
    version: '1.0.0',
    slots: {

    },
  },
  TranscriptViewerHeaderPrimitive
)

/* ==========================================================================
   TranscriptViewerBody
   ========================================================================== */

export interface TranscriptViewerBodySlots {
  /** Words stream component */
  words?: React.ComponentType<TranscriptViewerWordsProps>
}

export interface TranscriptViewerBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Font scale */
  size?: 'sm' | 'md' | 'lg'
  /** Max scroll height */
  maxHeight?: string | number
  /** Children nodes */
  children?: ReactNode
  /** Slot overrides map */
  slots?: SlotComponents<TranscriptViewerBodySlots>
  /** Slot props map */
  slotProps?: SlotPropsMap<TranscriptViewerBodySlots>
}

function TranscriptViewerBodyPrimitive({
  className,
  size,
  maxHeight,
  children,
  slots,
  slotProps,
  ...props
}: TranscriptViewerBodyProps) {
  return (
    <div
      data-slot="transcript-viewer-body"
      className={cn('rounded-base bg-muted/25 px-3 py-2.5', className)}
      {...props}
    >
      {children ??
        renderSlot(
          slots?.words,
          { size, maxHeight, ...slotProps?.words },
          { defaultComponent: TranscriptViewerWords }
        )}
    </div>
  )
}

export const TranscriptViewerBody = createInterfaceComponent<
  TranscriptViewerBodyProps,
  TranscriptViewerBodySlots
>(
  {
    name: 'TranscriptViewerBody',
    category: 'media',
    description: 'Scrollable body region that renders synchronized transcript words.',
    version: '1.0.0',
    slots: {
      words: TranscriptViewerWords,
    },
  },
  TranscriptViewerBodyPrimitive
)

/* ==========================================================================
   TranscriptViewerSearch
   ========================================================================== */

export interface TranscriptViewerSearchSlots {}

export interface TranscriptViewerSearchProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Search input placeholder text */
  placeholder?: string
  /** Children nodes */
  children?: ReactNode
  /** Slot overrides map */
  slots?: SlotComponents<TranscriptViewerSearchSlots>
  /** Slot props map */
  slotProps?: SlotPropsMap<TranscriptViewerSearchSlots>
}

function TranscriptViewerSearchPrimitive({ className, placeholder = 'Search transcript…', children, ...props }: TranscriptViewerSearchProps) {
  return (
    <div
      data-slot="transcript-viewer-search"
      className={cn('relative flex items-center', className)}
      {...props}
    >
      {children ?? (
        <input
          type="search"
          placeholder={placeholder}
          className="w-full rounded-base border border-border/40 bg-muted/30 px-3 py-1.5 text-sm text-fg placeholder:text-muted-fg/60 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      )}
    </div>
  )
}

export const TranscriptViewerSearch = createInterfaceComponent<
  TranscriptViewerSearchProps,
  TranscriptViewerSearchSlots
>(
  {
    name: 'TranscriptViewerSearch',
    category: 'media',
    description: 'Search input for filtering or jumping to keywords within the transcript.',
    version: '1.0.0',
    slots: {

    },
  },
  TranscriptViewerSearchPrimitive
)

/* ==========================================================================
   TranscriptViewerTransport
   ========================================================================== */

export interface TranscriptViewerTransportSlots {
  /** Play/pause button */
  playButton?: React.ComponentType<TranscriptViewerPlayPauseButtonProps>
  /** Timeline scrub bar */
  scrubBar?: React.ComponentType<TranscriptViewerScrubBarProps>
}

export interface TranscriptViewerTransportProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether to show play/pause button */
  showPlayButton?: boolean
  /** Children nodes */
  children?: ReactNode
  /** Slot overrides map */
  slots?: SlotComponents<TranscriptViewerTransportSlots>
  /** Slot props map */
  slotProps?: SlotPropsMap<TranscriptViewerTransportSlots>
}

function TranscriptViewerTransportPrimitive({
  className,
  showPlayButton = true,
  children,
  slots,
  slotProps,
  ...props
}: TranscriptViewerTransportProps) {
  return (
    <div
      data-slot="transcript-viewer-transport"
      className={cn('flex items-center gap-space-3', className)}
      {...props}
    >
      {children ?? (
        <>
          {showPlayButton &&
            renderSlot(slots?.playButton, slotProps?.playButton, {
              defaultComponent: TranscriptViewerPlayPauseButton,
            })}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex h-14 w-full items-center overflow-hidden rounded-base bg-muted/25 px-3">
              {renderSlot(
                slots?.scrubBar,
                { showLabels: false, className: 'w-full', ...slotProps?.scrubBar },
                { defaultComponent: TranscriptViewerScrubBar }
              )}
            </div>
            <div className="flex items-center justify-between font-mono text-[11px] tabular-nums text-muted-fg">
              <TranscriptViewerTime />
              <TranscriptViewerDuration />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export const TranscriptViewerTransport = createInterfaceComponent<
  TranscriptViewerTransportProps,
  TranscriptViewerTransportSlots
>(
  {
    name: 'TranscriptViewerTransport',
    category: 'media',
    description: 'Transport controls bar containing play/pause and timeline scrub bar for transcript audio.',
    version: '1.0.0',
    slots: {
      playButton: TranscriptViewerPlayPauseButton,
      scrubBar: TranscriptViewerScrubBar,
    },
  },
  TranscriptViewerTransportPrimitive
)

/* ==========================================================================
   Compound TranscriptViewer Attachments
   ========================================================================== */

TranscriptViewer.Root = TranscriptViewerContainer
TranscriptViewer.Container = TranscriptViewerContainer
TranscriptViewer.Header = TranscriptViewerHeader
TranscriptViewer.Body = TranscriptViewerBody
TranscriptViewer.Search = TranscriptViewerSearch
TranscriptViewer.Transport = TranscriptViewerTransport
TranscriptViewer.Word = TranscriptViewerWord
TranscriptViewer.Words = TranscriptViewerWords
TranscriptViewer.PlayPauseButton = TranscriptViewerPlayPauseButton
TranscriptViewer.ScrubBar = TranscriptViewerScrubBar
TranscriptViewer.Time = TranscriptViewerTime
TranscriptViewer.Duration = TranscriptViewerDuration


