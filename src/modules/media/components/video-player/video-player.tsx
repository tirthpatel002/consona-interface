'use client'

import React, {
  createContext,
  useContext,
  useMemo,
  type HTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  PauseIcon,
  PlayIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from '@heroicons/react/24/solid'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Slider } from '../../../core/components/slider'
import { useVideoPlayer, formatVideoTime, type UseVideoPlayerResult } from '../../hooks/use-video-player'

// ─── Utilities ────────────────────────────────────────────────────────────────

export { formatVideoTime }

import { createCompoundContext } from '../../../../core/context'

// ─── Context ──────────────────────────────────────────────────────────────────

export interface VideoPlayerContextValue {
  videoRef: React.RefObject<HTMLVideoElement | null>
  containerRef: React.RefObject<HTMLElement | null>
  isPlaying: boolean
  isMuted: boolean
  volume: number
  currentTime: number
  duration: number
  progress: number
  isFullscreen: boolean
  isControlsVisible: boolean
  isScrubbing: boolean
  togglePlay: () => void
  play: () => Promise<void>
  pause: () => void
  toggleMute: () => void
  setVolume: (v: number) => void
  seek: (timeInSeconds: number) => void
  startScrubbing: () => void
  stopScrubbing: (commitTime?: number) => void
  toggleFullscreen: () => void
  showControls: () => void
  hideControls: () => void
  formatTime: (seconds: number) => string
}

const { Provider: VideoPlayerContextProvider, useCompoundContext: useVideoPlayerContext } =
  createCompoundContext<VideoPlayerContextValue>('VideoPlayer')

export { useVideoPlayerContext }

// ─── VideoPlayer (Root) ───────────────────────────────────────────────────────

export interface VideoPlayerSlots {
  /** Outer container element */
  container?: React.ComponentType<HTMLAttributes<HTMLDivElement>>
  /** Bottom controls overlay bar slot */
  controls?: React.ComponentType<VideoPlayerControlsProps>
  /** Top overlay header slot */
  topBar?: React.ComponentType<VideoPlayerTopBarProps>
  /** Video scrubber timeline slot */
  scrubber?: React.ComponentType<VideoPlayerScrubberProps>
  /** Play/pause toggle button slot */
  playButton?: React.ComponentType<VideoPlayerPlayButtonProps>
  /** Mute/unmute toggle button slot */
  muteButton?: React.ComponentType<VideoPlayerMuteButtonProps>
  /** Volume output slider slot */
  volumeSlider?: React.ComponentType<VideoPlayerVolumeSliderProps>
  /** Timestamp counter label slot */
  time?: React.ComponentType<VideoPlayerTimeProps>
  /** Fullscreen mode toggle button slot */
  fullscreenButton?: React.ComponentType<VideoPlayerFullscreenButtonProps>
  /** Horizontal action row arrangement slot */
  actionRow?: React.ComponentType<VideoPlayerActionRowProps>
}

export interface VideoPlayerProps extends HTMLAttributes<HTMLDivElement> {
  /** Video source URL */
  src: string
  /** Poster thumbnail image URL */
  poster?: string
  /** Aspect ratio presets */
  aspectRatio?: '16/9' | '4/3' | '1/1' | '9/16'
  /** Autoplay video on load */
  autoPlay?: boolean
  /** Loop playback */
  loop?: boolean
  /** Child overlays and controls */
  children?: ReactNode
  /** Slot overrides map */
  slotProps?: SlotPropsMap<VideoPlayerSlots>
  /** Custom slot components */
  slots?: SlotComponents<VideoPlayerSlots>
}

function VideoPlayerPrimitive({
  src,
  poster,
  aspectRatio = '16/9',
  autoPlay = false,
  loop = false,
  className,
  children,
  slots,
  slotProps,
  ...props
}: VideoPlayerProps) {
  const player: UseVideoPlayerResult = useVideoPlayer({
    autoPlay,
    loop,
  })

  const contextValue = useMemo<VideoPlayerContextValue>(
    () => ({
      videoRef: player.videoRef,
      containerRef: player.containerRef,
      isPlaying: player.state.isPlaying,
      isMuted: player.state.isMuted,
      volume: player.state.volume,
      currentTime: player.state.currentTime,
      duration: player.state.duration,
      progress: player.state.progress,
      isFullscreen: player.state.isFullscreen,
      isControlsVisible: player.state.isControlsVisible,
      isScrubbing: player.state.isScrubbing,
      togglePlay: player.actions.togglePlay,
      play: player.actions.play,
      pause: player.actions.pause,
      toggleMute: player.actions.toggleMute,
      setVolume: player.actions.setVolume,
      seek: player.actions.seek,
      startScrubbing: player.actions.startScrubbing,
      stopScrubbing: player.actions.stopScrubbing,
      toggleFullscreen: player.actions.toggleFullscreen,
      showControls: player.actions.showControls,
      hideControls: player.actions.hideControls,
      formatTime: player.helpers.formatTime,
    }),
    [player.videoRef, player.containerRef, player.state, player.actions, player.helpers]
  )

  const defaultContent = (
    <div
      ref={player.containerRef as any}
      data-slot="video-player"
      data-playing={player.state.isPlaying ? '' : undefined}
      data-fullscreen={player.state.isFullscreen ? '' : undefined}
      onMouseMove={player.actions.showControls}
      onMouseEnter={player.actions.showControls}
      onMouseLeave={player.actions.hideControls}
      onTouchStart={player.actions.showControls}
      className={cn(
        'group/player relative overflow-hidden rounded-base bg-black select-none',
        (aspectRatio === '16/9' || (aspectRatio as string) === 'video') && 'aspect-video',
        (aspectRatio === '4/3') && 'aspect-[4/3]',
        (aspectRatio === '1/1' || (aspectRatio as string) === 'square') && 'aspect-square',
        (aspectRatio === '9/16') && 'aspect-[9/16]',
        className
      )}
      {...props}
    >
      {/* Video element */}
      <video
        ref={player.videoRef}
        src={src}
        poster={poster}
        loop={loop}
        autoPlay={autoPlay}
        muted={autoPlay || player.state.isMuted}
        playsInline
        onClick={player.actions.togglePlay}
        className="absolute inset-0 size-full cursor-pointer object-cover"
      />

      {/* Overlaid controls layer */}
      <div
        data-slot="video-controls-overlay"
        className={cn(
          'pointer-events-none absolute inset-0 z-10 flex flex-col justify-end transition-opacity duration-300',
          player.state.isControlsVisible ? 'opacity-100' : 'opacity-0'
        )}
      >
        {children ?? (
          renderSlot(slots?.controls, { slots, slotProps, ...(slotProps?.controls as object) } as any, {
            defaultComponent: DefaultControlsPrimitive as any,
          })
        )}
      </div>
    </div>
  )

  return (
    <VideoPlayerContextProvider value={contextValue}>
      {renderSlot(
        slots?.container,
        {
          'data-slot': 'video-player',
          className: cn(
            'group/player relative overflow-hidden rounded-base bg-black select-none',
            className
          ),
          children: defaultContent,
          ...slotProps?.container,
          ...props,
        } as any
      ) ?? defaultContent}
    </VideoPlayerContextProvider>
  )
}

export const VideoPlayer = createInterfaceComponent<
  VideoPlayerProps,
  VideoPlayerSlots
>(
  {
    name: 'VideoPlayer',
    category: 'media',
    description: 'Accessible, responsive HTML5 video playback framework with customizable chrome.',
    version: '1.0.0',
    slots: {
      controls: undefined,
      topBar: undefined,
      scrubber: undefined,
      playButton: undefined,
      muteButton: undefined,
      volumeSlider: undefined,
      time: undefined,
      fullscreenButton: undefined,
      actionRow: undefined,
      container: undefined,
    },
  },
  VideoPlayerPrimitive
)

// ─── VideoPlayerControls (bottom controls bar) ────────────────────────────────

export interface VideoPlayerControlsSlots {
  /** Controls wrapper */
  wrapper?: React.ComponentType<HTMLAttributes<HTMLDivElement>>
}

export interface VideoPlayerControlsProps extends HTMLAttributes<HTMLDivElement> {
  /** Slot overrides map */
  slotProps?: SlotPropsMap<VideoPlayerControlsSlots>
  /** Custom slot components */
  slots?: SlotComponents<VideoPlayerControlsSlots>
}

function VideoPlayerControlsPrimitive({ className, children, slots, slotProps, ...props }: VideoPlayerControlsProps) {
  const content = (
    <div
      data-slot="video-controls"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        'pointer-events-auto mt-auto w-full',
        'bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-3 pt-10',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )

  return renderSlot(
    slots?.wrapper,
    {
      children: content,
      ...slotProps?.wrapper,
    }
  ) ?? content
}

export const VideoPlayerControls = createInterfaceComponent<
  VideoPlayerControlsProps,
  VideoPlayerControlsSlots
>(
  {
    name: 'VideoPlayerControls',
    category: 'media',
    description: 'Bottom gradient bar container holding playback scrubbers and action buttons.',
    version: '1.0.0',
    slots: {
      wrapper: undefined,
    },
  },
  VideoPlayerControlsPrimitive
)

// ─── VideoPlayerTopBar ────────────────────────────────────────────────────────

export interface VideoPlayerTopBarSlots {
  /** Top bar wrapper */
  wrapper?: React.ComponentType<HTMLAttributes<HTMLDivElement>>
}

export interface VideoPlayerTopBarProps extends HTMLAttributes<HTMLDivElement> {
  /** Slot overrides map */
  slotProps?: SlotPropsMap<VideoPlayerTopBarSlots>
  /** Custom slot components */
  slots?: SlotComponents<VideoPlayerTopBarSlots>
}

function VideoPlayerTopBarPrimitive({ className, children, slots, slotProps, ...props }: VideoPlayerTopBarProps) {
  const content = (
    <div
      data-slot="video-top-bar"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        'pointer-events-auto w-full',
        'bg-gradient-to-b from-black/70 via-black/30 to-transparent px-3 pb-8 pt-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )

  return renderSlot(
    slots?.wrapper,
    {
      children: content,
      ...slotProps?.wrapper,
    }
  ) ?? content
}

export const VideoPlayerTopBar = createInterfaceComponent<
  VideoPlayerTopBarProps,
  VideoPlayerTopBarSlots
>(
  {
    name: 'VideoPlayerTopBar',
    category: 'media',
    description: 'Top overlay header displaying video titles and metadata.',
    version: '1.0.0',
    slots: {
      wrapper: undefined,
    },
  },
  VideoPlayerTopBarPrimitive
)

export interface VideoPlayerScrubberTrackProps extends HTMLAttributes<HTMLDivElement> {
  /** Current playback time in seconds */
  currentTime?: number
  /** Total video duration in seconds */
  duration?: number
}

export interface VideoPlayerScrubberSlots {
  /** Track element */
  track?: React.ComponentType<VideoPlayerScrubberTrackProps>
}

export interface VideoPlayerScrubberProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
  /** Slot overrides map */
  slotProps?: SlotPropsMap<VideoPlayerScrubberSlots>
  /** Custom slot components */
  slots?: SlotComponents<VideoPlayerScrubberSlots>
}

function VideoPlayerScrubberPrimitive({ className, slots, slotProps, ...props }: VideoPlayerScrubberProps) {
  const { currentTime, duration, seek, startScrubbing, stopScrubbing } = useVideoPlayerContext()

  const sliderNode = (
    <div
      data-slot="video-scrubber"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => {
        e.stopPropagation()
        startScrubbing()
      }}
      className={cn('relative flex w-full cursor-pointer items-center py-1', className)}
      {...props}
    >
      <Slider
        aria-label="Video scrubber"
        minValue={0}
        maxValue={Math.max(duration, 0.1)}
        step={0.01}
        value={currentTime}
        isDisabled={duration <= 0}
        onChange={(v) => {
          const val = typeof v === 'number' ? v : v[0]
          seek(val)
        }}
        onChangeEnd={(v) => {
          const val = typeof v === 'number' ? v : v[0]
          stopScrubbing(val)
        }}
        className="w-full flex-1"
      >
        <Slider.Track />
      </Slider>
    </div>
  )

  return renderSlot(
    slots?.track,
    {
      currentTime,
      duration,
      children: sliderNode,
      ...slotProps?.track,
    }
  ) ?? sliderNode
}

export const VideoPlayerScrubber = createInterfaceComponent<
  VideoPlayerScrubberProps,
  VideoPlayerScrubberSlots
>(
  {
    name: 'VideoPlayerScrubber',
    category: 'media',
    description: 'Timeline progress bar with hover thumbnail and scrubbing drag interaction.',
    version: '1.0.0',
    slots: {
      track: undefined,
    },
  },
  VideoPlayerScrubberPrimitive
)

// ─── VideoPlayerPlayButton ────────────────────────────────────────────────────

export interface VideoPlayerPlayButtonSlots {
  /** Play icon */
  playIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Pause icon */
  pauseIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface VideoPlayerPlayButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Slot overrides map */
  slotProps?: SlotPropsMap<VideoPlayerPlayButtonSlots>
  /** Custom slot components */
  slots?: SlotComponents<VideoPlayerPlayButtonSlots>
}

function VideoPlayerPlayButtonPrimitive({
  className,
  slots,
  slotProps,
  ...props
}: VideoPlayerPlayButtonProps) {
  const { isPlaying, togglePlay } = useVideoPlayerContext()

  return (
    <button
      type="button"
      onClick={togglePlay}
      aria-label={isPlaying ? 'Pause' : 'Play'}
      className={cn(
        'flex size-8 cursor-pointer items-center justify-center rounded-full text-white transition-transform duration-100 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
        className
      )}
      {...props}
    >
      {isPlaying
        ? renderSlot(slots?.pauseIcon, { className: 'size-4', ...slotProps?.pauseIcon }, { defaultComponent: PauseIcon })
        : renderSlot(slots?.playIcon, { className: 'size-4', ...slotProps?.playIcon }, { defaultComponent: PlayIcon })}
    </button>
  )
}

export const VideoPlayerPlayButton = createInterfaceComponent<
  VideoPlayerPlayButtonProps,
  VideoPlayerPlayButtonSlots
>(
  {
    name: 'VideoPlayerPlayButton',
    category: 'media',
    description: 'Toggle play/pause action button for video playback.',
    version: '1.0.0',
    slots: {
      playIcon: PlayIcon,
      pauseIcon: PauseIcon,
    },
  },
  VideoPlayerPlayButtonPrimitive
)

// ─── VideoPlayerMuteButton ────────────────────────────────────────────────────

export interface VideoPlayerMuteButtonSlots {
  /** Speaker active icon */
  soundIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Speaker mute icon */
  muteIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface VideoPlayerMuteButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Slot overrides map */
  slotProps?: SlotPropsMap<VideoPlayerMuteButtonSlots>
  /** Custom slot components */
  slots?: SlotComponents<VideoPlayerMuteButtonSlots>
}

function VideoPlayerMuteButtonPrimitive({
  className,
  slots,
  slotProps,
  ...props
}: VideoPlayerMuteButtonProps) {
  const { isMuted, toggleMute } = useVideoPlayerContext()

  return (
    <button
      type="button"
      onClick={toggleMute}
      aria-label={isMuted ? 'Unmute' : 'Mute'}
      className={cn(
        'flex size-8 cursor-pointer items-center justify-center rounded-full text-white transition-transform duration-100 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
        className
      )}
      {...props}
    >
      {isMuted
        ? renderSlot(slots?.muteIcon, { className: 'size-4', ...slotProps?.muteIcon }, { defaultComponent: SpeakerXMarkIcon })
        : renderSlot(slots?.soundIcon, { className: 'size-4', ...slotProps?.soundIcon }, { defaultComponent: SpeakerWaveIcon })}
    </button>
  )
}

export const VideoPlayerMuteButton = createInterfaceComponent<
  VideoPlayerMuteButtonProps,
  VideoPlayerMuteButtonSlots
>(
  {
    name: 'VideoPlayerMuteButton',
    category: 'media',
    description: 'Toggle mute audio button for video player.',
    version: '1.0.0',
    slots: {
      soundIcon: SpeakerWaveIcon,
      muteIcon: SpeakerXMarkIcon,
    },
  },
  VideoPlayerMuteButtonPrimitive
)

// ─── VideoPlayerVolumeSlider ──────────────────────────────────────────────────

export interface VideoPlayerVolumeSliderWrapperProps extends HTMLAttributes<HTMLDivElement> {
  /** Current volume level from 0 to 1 */
  volume?: number
}

export interface VideoPlayerVolumeSliderSlots {
  /** Slider track wrapper */
  wrapper?: React.ComponentType<VideoPlayerVolumeSliderWrapperProps>
}

export interface VideoPlayerVolumeSliderProps extends HTMLAttributes<HTMLDivElement> {
  /** Slot overrides map */
  slotProps?: SlotPropsMap<VideoPlayerVolumeSliderSlots>
  /** Custom slot components */
  slots?: SlotComponents<VideoPlayerVolumeSliderSlots>
}

function VideoPlayerVolumeSliderPrimitive({
  className,
  slots,
  slotProps,
  ...props
}: VideoPlayerVolumeSliderProps) {
  const { volume, isMuted, setVolume } = useVideoPlayerContext()
  const displayVolume = isMuted ? 0 : volume

  const sliderNode = (
    <div
      data-slot="video-volume"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn('flex w-20 items-center', className)}
      {...props}
    >
      <Slider
        aria-label="Video volume"
        minValue={0}
        maxValue={1}
        step={0.01}
        value={displayVolume}
        onChange={(v) => {
          const val = typeof v === 'number' ? v : v[0]
          setVolume(val)
        }}
        className="w-full"
      >
        <Slider.Track />
      </Slider>
    </div>
  )

  return renderSlot(
    slots?.wrapper,
    {
      volume: displayVolume,
      children: sliderNode,
      ...slotProps?.wrapper,
    }
  ) ?? sliderNode
}

export const VideoPlayerVolumeSlider = createInterfaceComponent<
  VideoPlayerVolumeSliderProps,
  VideoPlayerVolumeSliderSlots
>(
  {
    name: 'VideoPlayerVolumeSlider',
    category: 'media',
    description: 'Horizontal range slider controlling video volume output.',
    version: '1.0.0',
    slots: {
      wrapper: undefined,
    },
  },
  VideoPlayerVolumeSliderPrimitive
)

// ─── VideoPlayerTime ──────────────────────────────────────────────────────────

export interface VideoPlayerTimeSlots {
  /** Timestamp label */
  label?: React.ComponentType<HTMLAttributes<HTMLSpanElement>>
}

export interface VideoPlayerTimeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Slot overrides map */
  slotProps?: SlotPropsMap<VideoPlayerTimeSlots>
  /** Custom slot components */
  slots?: SlotComponents<VideoPlayerTimeSlots>
}

function VideoPlayerTimePrimitive({ className, slots, slotProps, ...props }: VideoPlayerTimeProps) {
  const { currentTime, duration, formatTime } = useVideoPlayerContext()
  const formatted = `${formatTime(currentTime)} / ${formatTime(duration)}`
  return renderSlot(
    slots?.label,
    {
      'data-slot': 'video-time',
      className: cn('font-mono text-xs text-white/80 tabular-nums select-none', className),
      children: formatted,
      ...slotProps?.label,
      ...props,
    } as any
  ) ?? (
    <span
      data-slot="video-time"
      className={cn('font-mono text-xs text-white/80 tabular-nums select-none', className)}
      {...props}
    >
      {formatted}
    </span>
  )
}

export const VideoPlayerTime = createInterfaceComponent<
  VideoPlayerTimeProps,
  VideoPlayerTimeSlots
>(
  {
    name: 'VideoPlayerTime',
    category: 'media',
    description: 'Displays current playback time and total video length.',
    version: '1.0.0',
    slots: {
      label: undefined,
    },
  },
  VideoPlayerTimePrimitive
)

// ─── VideoPlayerFullscreenButton ──────────────────────────────────────────────

export interface VideoPlayerFullscreenButtonSlots {
  /** Enter fullscreen icon */
  enterIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Exit fullscreen icon */
  exitIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface VideoPlayerFullscreenButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Slot overrides map */
  slotProps?: SlotPropsMap<VideoPlayerFullscreenButtonSlots>
  /** Custom slot components */
  slots?: SlotComponents<VideoPlayerFullscreenButtonSlots>
}

function VideoPlayerFullscreenButtonPrimitive({
  className,
  slots,
  slotProps,
  ...props
}: VideoPlayerFullscreenButtonProps) {
  const { isFullscreen, toggleFullscreen } = useVideoPlayerContext()

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      className={cn(
        'ml-auto flex size-8 cursor-pointer items-center justify-center rounded-full text-white transition-transform duration-100 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
        className
      )}
      {...props}
    >
      {isFullscreen
        ? renderSlot(slots?.exitIcon, { className: 'size-4', ...slotProps?.exitIcon }, { defaultComponent: ArrowsPointingInIcon })
        : renderSlot(slots?.enterIcon, { className: 'size-4', ...slotProps?.enterIcon }, { defaultComponent: ArrowsPointingOutIcon })}
    </button>
  )
}

export const VideoPlayerFullscreenButton = createInterfaceComponent<
  VideoPlayerFullscreenButtonProps,
  VideoPlayerFullscreenButtonSlots
>(
  {
    name: 'VideoPlayerFullscreenButton',
    category: 'media',
    description: 'Toggle full screen mode button for video player.',
    version: '1.0.0',
    slots: {
      enterIcon: ArrowsPointingOutIcon,
      exitIcon: ArrowsPointingInIcon,
    },
  },
  VideoPlayerFullscreenButtonPrimitive
)

// ─── VideoPlayerActionRow (convenience layout) ────────────────────────────────

export interface VideoPlayerActionRowSlots {
  /** Row container */
  row?: React.ComponentType<HTMLAttributes<HTMLDivElement>>
}

export interface VideoPlayerActionRowProps extends HTMLAttributes<HTMLDivElement> {
  /** Slot overrides map */
  slotProps?: SlotPropsMap<VideoPlayerActionRowSlots>
  /** Custom slot components */
  slots?: SlotComponents<VideoPlayerActionRowSlots>
}

function VideoPlayerActionRowPrimitive({
  className,
  children,
  slots,
  slotProps,
  ...props
}: VideoPlayerActionRowProps) {
  const content = (
    <div
      data-slot="video-action-row"
      className={cn('flex items-center gap-1 pt-1', className)}
      {...props}
    >
      {children}
    </div>
  )

  return renderSlot(
    slots?.row,
    {
      children: content,
      ...slotProps?.row,
    }
  ) ?? content
}

export const VideoPlayerActionRow = createInterfaceComponent<
  VideoPlayerActionRowProps,
  VideoPlayerActionRowSlots
>(
  {
    name: 'VideoPlayerActionRow',
    category: 'media',
    description: 'Horizontal row arranging media playback controls.',
    version: '1.0.0',
    slots: {
      row: undefined,
    },
  },
  VideoPlayerActionRowPrimitive
)

// ─── Default Stable Subtree Components (Prevents React Fiber Remounts) ──────

function DefaultActionRowPrimitive({
  slots,
  slotProps,
}: {
  slots?: SlotComponents<VideoPlayerSlots>
  slotProps?: SlotPropsMap<VideoPlayerSlots>
} = {}) {
  return (
    <VideoPlayerActionRowPrimitive>
      {renderSlot(slots?.playButton, slotProps?.playButton, { defaultComponent: VideoPlayerPlayButtonPrimitive })}
      {renderSlot(slots?.muteButton, slotProps?.muteButton, { defaultComponent: VideoPlayerMuteButtonPrimitive })}
      {renderSlot(slots?.volumeSlider, slotProps?.volumeSlider, { defaultComponent: VideoPlayerVolumeSliderPrimitive })}
      {renderSlot(slots?.time, slotProps?.time, { defaultComponent: VideoPlayerTimePrimitive })}
      {renderSlot(slots?.fullscreenButton, slotProps?.fullscreenButton, { defaultComponent: VideoPlayerFullscreenButtonPrimitive })}
    </VideoPlayerActionRowPrimitive>
  )
}

function DefaultControlsPrimitive({
  slots,
  slotProps,
}: {
  slots?: SlotComponents<VideoPlayerSlots>
  slotProps?: SlotPropsMap<VideoPlayerSlots>
} = {}) {
  return (
    <VideoPlayerControlsPrimitive>
      {renderSlot(slots?.topBar, slotProps?.topBar)}
      {renderSlot(slots?.scrubber, slotProps?.scrubber, { defaultComponent: VideoPlayerScrubberPrimitive })}
      {renderSlot(
        slots?.actionRow,
        { slots, slotProps, ...(slotProps?.actionRow as object) } as any,
        { defaultComponent: DefaultActionRowPrimitive as any }
      )}
    </VideoPlayerControlsPrimitive>
  )
}

// ─── Default composed VideoPlayer preset ─────────────────────────────────────

export interface VideoPlayerDefaultSlots {
  /** Scrubber */
  scrubber?: React.ComponentType<VideoPlayerScrubberProps>
}

export interface VideoPlayerDefaultProps {
  /** Video URL */
  src: string
  /** Poster image */
  poster?: string
  /** Title overlay */
  title?: string
  /** Aspect ratio */
  aspectRatio?: VideoPlayerProps['aspectRatio']
  /** Autoplay flag */
  autoPlay?: boolean
  /** Loop flag */
  loop?: boolean
  /** Root class */
  className?: string
  /** Slot overrides map */
  slotProps?: SlotPropsMap<VideoPlayerDefaultSlots>
  /** Custom slot components */
  slots?: SlotComponents<VideoPlayerDefaultSlots>
}

function VideoPlayerDefaultPrimitive({
  src,
  poster,
  title,
  aspectRatio,
  autoPlay,
  loop,
  className,
  slots,
  slotProps,
}: VideoPlayerDefaultProps) {
  return (
    <VideoPlayer
      src={src}
      poster={poster}
      aspectRatio={aspectRatio}
      autoPlay={autoPlay}
      loop={loop}
      className={className}
      slots={slots as any}
      slotProps={slotProps as any}
    >
      {title && (
        <VideoPlayerTopBar>
          <p className="text-sm font-semibold text-white drop-shadow">{title}</p>
        </VideoPlayerTopBar>
      )}
      <VideoPlayerControls>
        {renderSlot(slots?.scrubber, slotProps?.scrubber, { defaultComponent: VideoPlayerScrubber })}
        <VideoPlayerActionRow>
          <VideoPlayerPlayButton />
          <VideoPlayerMuteButton />
          <VideoPlayerVolumeSlider />
          <VideoPlayerTime />
          <VideoPlayerFullscreenButton />
        </VideoPlayerActionRow>
      </VideoPlayerControls>
    </VideoPlayer>
  )
}

export const VideoPlayerDefault = createInterfaceComponent<
  VideoPlayerDefaultProps,
  VideoPlayerDefaultSlots
>(
  {
    name: 'VideoPlayerDefault',
    category: 'media',
    description: 'Pre-composed ready-to-use video player with scrubber, time, volume and fullscreen controls.',
    version: '1.0.0',
    slots: {
      scrubber: undefined,
    },
  },
  VideoPlayerDefaultPrimitive
)

// ─── Compound Export ──────────────────────────────────────────────────────────

VideoPlayer.Controls = VideoPlayerControls
VideoPlayer.TopBar = VideoPlayerTopBar
VideoPlayer.Scrubber = VideoPlayerScrubber
VideoPlayer.PlayButton = VideoPlayerPlayButton
VideoPlayer.MuteButton = VideoPlayerMuteButton
VideoPlayer.VolumeSlider = VideoPlayerVolumeSlider
VideoPlayer.Time = VideoPlayerTime
VideoPlayer.FullscreenButton = VideoPlayerFullscreenButton
VideoPlayer.ActionRow = VideoPlayerActionRow
VideoPlayer.Default = VideoPlayerDefault
