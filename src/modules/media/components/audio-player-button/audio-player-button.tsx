'use client'

import React, { useMemo, useRef, useState, useEffect, type ComponentProps, type HTMLAttributes } from 'react'
import { PauseIcon, PlayIcon } from '@heroicons/react/24/solid'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Button } from '../../../core/components/button'
import { useAudioPlayer } from '../../hooks/use-audio-player'
import type { UseAudioPlayerResult } from '../../hooks/use-audio-player'
import type { AudioTrack, AudioSourceInput } from '../../engine/types'
import { formatAudioTimestamp } from '../../engine/utils'

/* ==========================================================================
   AudioPlayerButton Slots & Props
   ========================================================================== */

export interface AudioPlayerButtonSlots {
  /** Play icon */
  playIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Pause icon */
  pauseIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface AudioPlayerButtonProps<TData = unknown>
  extends Omit<ComponentProps<typeof Button>, 'children' | 'isPending' | 'slots' | 'slotProps'> {
  /** Track data or descriptor */
  track?: AudioTrack<TData> | null
  /** Audio URL */
  src?: string
  /** Audio title */
  title?: string
  /** Accessibility/display label */
  label?: string
  /** Artist name */
  artist?: string
  /** Artwork URL */
  artwork?: string
  /** Alias for artwork */
  image?: string
  /** Duration in seconds */
  duration?: number
  /** External audio player instance */
  player?: UseAudioPlayerResult<TData>
  /** Slot overrides map */
  slotProps?: SlotPropsMap<AudioPlayerButtonSlots>
  /** Custom slot components */
  slots?: SlotComponents<AudioPlayerButtonSlots>
}

function AudioPlayerButtonPrimitive<TData = unknown>({
  track,
  src,
  title,
  label,
  artist,
  artwork,
  image,
  duration,
  player: externalPlayer,
  intent = 'primary',
  size = 'sq-md',
  isCircle = true,
  className,
  onPress,
  slots,
  slotProps,
  ...props
}: AudioPlayerButtonProps<TData>) {
  const effectiveTrack = useMemo<AudioTrack<TData> | null>(() => {
    if (track) return { ...track, artwork: artwork ?? image ?? track.artwork }
    if (src) {
      return {
        id: src,
        src,
        title: title || label || 'Audio track',
        artist,
        artwork: artwork ?? image,
        duration,
      } as AudioTrack<TData>
    }
    return null
  }, [track, src, title, label, artist, artwork, image, duration])

  const internalPlayer = useAudioPlayer<TData>({ initialTrack: effectiveTrack })
  const player = externalPlayer || internalPlayer

  const isCurrentActive = effectiveTrack ? player.isTrackActive(effectiveTrack.id) : true
  const isPlaying = isCurrentActive && player.isPlaying
  const isLoading = isCurrentActive && player.isBuffering

  const PlayIconSlot = slots?.playIcon ?? PlayIcon
  const PauseIconSlot = slots?.pauseIcon ?? PauseIcon

  const handlePress = (e: any) => {
    onPress?.(e)
    if (isPlaying) {
      player.pause()
    } else {
      player.play(effectiveTrack)
    }
  }

  const showSpinner = isLoading && isPlaying

  return (
    <Button
      type="button"
      intent={intent}
      size={size}
      isCircle={isCircle}
      isPending={false}
      onPress={handlePress}
      aria-label={isPlaying ? 'Pause track' : 'Play track'}
      className={cn('cursor-pointer shadow-xs transition-[background-color,box-shadow,opacity,transform] active:scale-95', className)}
      {...props}
    >
      {/* Fixed-size icon container — all three states always mounted, opacity-crossfaded */}
      <span className="relative flex items-center justify-center size-4 pointer-events-none">
        <span className={cn('absolute inset-0 flex items-center justify-center transition-opacity duration-[120ms]', showSpinner ? 'opacity-100' : 'opacity-0')}>
          <div className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
        </span>
        <span className={cn('absolute inset-0 flex items-center justify-center transition-opacity duration-[120ms]', !showSpinner && !isPlaying ? 'opacity-100' : 'opacity-0')}>
          {renderSlot(slots?.playIcon, { className: 'size-4 translate-x-0.5', ...slotProps?.playIcon }, { defaultComponent: PlayIcon })}
        </span>
        <span className={cn('absolute inset-0 flex items-center justify-center transition-opacity duration-[120ms]', !showSpinner && isPlaying ? 'opacity-100' : 'opacity-0')}>
          {renderSlot(slots?.pauseIcon, { className: 'size-4', ...slotProps?.pauseIcon }, { defaultComponent: PauseIcon })}
        </span>
      </span>
    </Button>
  )
}

export const AudioPlayerButton = createInterfaceComponent<
  AudioPlayerButtonProps<any>,
  AudioPlayerButtonSlots
>(
  {
    name: 'AudioPlayerButton',
    category: 'media',
    description: 'Compact standalone audio player button that triggers or pauses playback of a track.',
    version: '1.0.0',
    slots: {
      playIcon: PlayIcon,
      pauseIcon: PauseIcon,
    },
  },
  AudioPlayerButtonPrimitive
)

/* ==========================================================================
   AudioPlayerPill
   ========================================================================== */

const MiniPillVisualizer = ({
  isPlaying,
  className,
  barWidth = 'w-0.75',
}: {
  isPlaying: boolean
  className?: string
  barWidth?: string
}) => {
  const bars = [35, 65, 95, 55, 80, 45]

  return (
    <div className={cn('flex items-center shrink-0 px-1 pointer-events-none select-none', className)}>
      {bars.map((heightPercent, i) => (
        <span
          key={i}
          className={cn(
            'rounded-full bg-current pointer-events-none',
            'transition-[height,opacity] duration-300 ease-in-out',
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

const pillIntentStyles = {
  primary: {
    btnBg: 'bg-primary text-primary-fg',
    fillBg: 'bg-primary text-primary-fg',
    glow: '',
    activeBorder: 'border-primary/50',
  },
  secondary: {
    btnBg: 'bg-secondary text-secondary-fg',
    fillBg: 'bg-secondary text-secondary-fg',
    glow: '',
    activeBorder: 'border-secondary/50',
  },
  warning: {
    btnBg: 'bg-warning text-warning-fg',
    fillBg: 'bg-warning text-warning-fg',
    glow: '',
    activeBorder: 'border-warning/50',
  },
  danger: {
    btnBg: 'bg-danger text-danger-fg',
    fillBg: 'bg-danger text-danger-fg',
    glow: '',
    activeBorder: 'border-danger/50',
  },
  success: {
    btnBg: 'bg-success text-success-fg',
    fillBg: 'bg-success text-success-fg',
    glow: '',
    activeBorder: 'border-success/50',
  },
  info: {
    btnBg: 'bg-info text-info-fg',
    fillBg: 'bg-info text-info-fg',
    glow: '',
    activeBorder: 'border-info/50',
  },
  indigo: {
    btnBg: 'bg-indigo-600 dark:bg-indigo-500 text-white',
    fillBg: 'bg-indigo-600 dark:bg-indigo-500 text-white',
    glow: '',
    activeBorder: 'border-indigo-500/50',
  },
} as const

const pillSizeStyles = {
  sm: {
    container: 'h-10 min-w-56',
    button: 'size-8 p-0',
    artwork: 'size-8',
    icon: 'size-4',
    capsule: 'h-full p-1 mr-0 ml-0',
    trackOverlap: '-ml-5',
    content: 'pl-6 pr-3.5 py-1.5 gap-2.5',
    title: 'text-xs font-medium leading-tight',
    timestamp: 'text-[10px] leading-tight mt-0.5',
    visualizer: 'h-3.5 gap-0.75',
    barWidth: 'w-0.5',
  },
  md: {
    container: 'h-12 min-w-68',
    button: 'size-10 p-0',
    artwork: 'size-10',
    icon: 'size-5',
    capsule: 'h-full p-1 my-0 mr-0 ml-0',
    trackOverlap: '-ml-6',
    content: 'pl-7 pr-4.5 py-2 gap-3.5',
    title: 'text-[13px] sm:text-sm font-medium leading-tight',
    timestamp: 'text-[11px] leading-tight mt-0.5',
    visualizer: 'h-4.5 gap-1',
    barWidth: 'w-0.75',
  },
  lg: {
    container: 'h-14 min-w-80',
    button: 'size-11 p-0',
    artwork: 'size-11',
    icon: 'size-5.5',
    capsule: 'h-full p-1.5 my-0 mr-0 ml-0',
    trackOverlap: '-ml-7',
    content: 'pl-8 pr-5.5 py-2.5 gap-4.5',
    title: 'text-sm sm:text-base font-medium leading-tight',
    timestamp: 'text-xs leading-tight mt-0.5',
    visualizer: 'h-5 gap-1.25',
    barWidth: 'w-1',
  },
} as const

export type AudioPlayerPillIntent =
  | 'primary'
  | 'secondary'
  | 'warning'
  | 'danger'
  | 'success'
  | 'info'
  | 'indigo'

export interface AudioPlayerPillIntentStyle {
  /** Play/pause circular button background and text classes */
  btnBg?: string
  /** Morphing timeline progress fill background and text classes */
  fillBg?: string
  /** Ambient box shadow / glow class applied to pill when playing */
  glow?: string
  /** Highlight border class applied to pill when playing */
  activeBorder?: string
}

export interface AudioPlayerPillArtworkProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Image source URL for track artwork thumbnail */
  src?: string
  /** Accessible alternative text for artwork image */
  alt?: string
  /** Additional CSS class names */
  className?: string
}

function DefaultAudioPlayerPillArtwork({
  src,
  alt = 'Track artwork',
  className,
  ...rest
}: AudioPlayerPillArtworkProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn('rounded-full object-cover shrink-0 select-none shadow-2xs', className)}
      loading="lazy"
      {...rest}
    />
  )
}

export interface AudioPlayerPillSlots {
  /** Play icon */
  playIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Pause icon */
  pauseIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Artwork image slot */
  artwork?: React.ComponentType<AudioPlayerPillArtworkProps>
}

export interface AudioPlayerPillProps<TData = unknown> {
  /** Track data */
  track?: AudioTrack<TData> | null
  /** Source URL, Blob, or File */
  src?: string | Blob | File
  /** Audio source file, blob, stream, or descriptor input */
  source?: AudioSourceInput<TData> | null
  /** Raw File or Blob audio payload */
  file?: Blob | File | null
  /** Display title */
  title?: string
  /** Accessibility or fallback label */
  label?: string
  /** Artist text */
  artist?: string
  /** Optional artwork / cover image URL */
  artwork?: string
  /** Alias for artwork */
  image?: string
  /** Whether to show artwork thumbnail inside pill */
  showArtwork?: boolean
  /** Total duration in seconds */
  duration?: number
  /** Hook or engine result */
  player?: UseAudioPlayerResult<TData>
  /** Visual intent preset or custom key */
  intent?: AudioPlayerPillIntent | (string & {})
  /** Direct custom intent style override for button, fill, glow, and border */
  intentStyle?: AudioPlayerPillIntentStyle
  /** Map of named custom or override intent style definitions */
  intentStyles?: Record<string, AudioPlayerPillIntentStyle>
  /** Sizing scale */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show animated visualizer bars */
  showWaveform?: boolean
  /** Whether to show timestamp indicators */
  showTimestamp?: boolean
  /** Class name */
  className?: string
  /** Play/pause callback */
  onPress?: () => void
  /** Seeking callback */
  onSeek?: (time: number) => void
  /** When true the artwork/orb acts as the play/pause button — no separate button shown.
   *  Hovering the artwork reveals a translucent play/pause icon overlay. */
  artworkAsButton?: boolean
  /** Slot overrides map */
  slotProps?: SlotPropsMap<AudioPlayerPillSlots>
  /** Custom slot components */
  slots?: SlotComponents<AudioPlayerPillSlots>
  /** Custom children or compound content */
  children?: React.ReactNode
}

function AudioPlayerPillPrimitive<TData = unknown>({
  track,
  src,
  source,
  file,
  title,
  label,
  artist,
  artwork,
  image,
  showArtwork = true,
  duration: customDuration,
  player: externalPlayer,
  intent = 'primary',
  intentStyle,
  intentStyles,
  size = 'md',
  showWaveform = true,
  showTimestamp = true,
  className,
  onPress,
  onSeek,
  artworkAsButton = false,
  slots,
  slotProps,
}: AudioPlayerPillProps<TData>) {
  const displayArtwork = artwork ?? image ?? track?.artwork
  const hasArtwork = Boolean(showArtwork && (displayArtwork || slots?.artwork))
  const resolvedSource = source ?? file ?? src ?? null

  const effectiveTrack = useMemo<AudioTrack<TData> | null>(() => {
    if (track) return { ...track, artwork: displayArtwork ?? track.artwork }
    if (typeof src === 'string') {
      return {
        id: src,
        src,
        title: title || label || 'Audio track',
        artist,
        artwork: displayArtwork,
        duration: customDuration,
      } as AudioTrack<TData>
    }
    return null
  }, [track, src, title, label, artist, displayArtwork, customDuration])

  const internalPlayer = useAudioPlayer<TData>({
    initialTrack: effectiveTrack,
    source: resolvedSource,
  })
  const player = externalPlayer || internalPlayer

  const trackId = effectiveTrack?.id ?? ''
  const isCurrentActive = trackId ? player.isTrackActive(trackId) : true
  const isPlaying = isCurrentActive && player.isPlaying
  const isLoading = isCurrentActive && player.isBuffering
  const currentTime = isCurrentActive ? player.currentTime : 0
  const duration = isCurrentActive ? player.duration : effectiveTrack?.duration ?? 0

  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0

  const [dragProgress, setDragProgress] = useState<number | null>(null)
  const effectiveProgress = dragProgress !== null ? dragProgress : progress
  const effectiveTime = dragProgress !== null && duration > 0 ? (dragProgress / 100) * duration : currentTime

  const contentRef = useRef<HTMLDivElement>(null)
  const [contentWidth, setContentWidth] = useState<number>(0)
  const isDraggingRef = useRef(false)

  const PlayIconSlot = slots?.playIcon ?? PlayIcon
  const PauseIconSlot = slots?.pauseIcon ?? PauseIcon

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
  }, [])

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    onPress?.()
    if (isPlaying) {
      player.pause()
    } else {
      player.play(effectiveTrack)
    }
  }

  const handleSeekFromClientX = (clientX: number) => {
    if (!contentRef.current || duration <= 0) return
    const rect = contentRef.current.getBoundingClientRect()
    if (rect.width <= 0) return
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    setDragProgress(ratio * 100)
    const newTime = ratio * duration
    player.seek(newTime)
    onSeek?.(newTime)
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    isDraggingRef.current = true
    handleSeekFromClientX(e.clientX)

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (isDraggingRef.current) {
        handleSeekFromClientX(moveEvent.clientX)
      }
    }

    const handlePointerUp = (upEvent: PointerEvent) => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false
        if (contentRef.current && duration > 0) {
          const rect = contentRef.current.getBoundingClientRect()
          if (rect.width > 0) {
            const ratio = Math.max(0, Math.min(1, (upEvent.clientX - rect.left) / rect.width))
            const newTime = ratio * duration
            player.seek(newTime)
            onSeek?.(newTime)
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

  const defaultIntentStyle = pillIntentStyles[intent as keyof typeof pillIntentStyles] ?? pillIntentStyles.primary
  const customMapStyle = intentStyles?.[intent as string]
  const currentIntent: AudioPlayerPillIntentStyle = {
    ...defaultIntentStyle,
    ...customMapStyle,
    ...intentStyle,
  }
  const currentSize = pillSizeStyles[size || 'md'] ?? pillSizeStyles.md
  const showSpinner = isLoading && isPlaying

  return (
    <div
      data-slot="audio-player-pill"
      role="region"
      aria-label={effectiveTrack?.title || label || 'Audio player'}
      className={cn(
        'group relative inline-flex items-center overflow-hidden rounded-full border transition-all duration-200 select-none',
        'border-border/60 bg-card/85 shadow-xs backdrop-blur-md hover:border-border hover:shadow-sm',
        isPlaying && currentIntent.activeBorder,
        isPlaying && currentIntent.glow,
        currentSize.container,
        className
      )}
    >
      {/* Left Capsule Controls */}
      <div
        className={cn(
          'relative z-30 flex items-center shrink-0 rounded-full bg-card gap-1 select-none',
          currentSize.capsule
        )}
      >
        {artworkAsButton ? (
          /* ── Artwork-as-button variant ── artwork IS the play/pause trigger */
          hasArtwork && (
            <button
              type="button"
              onClick={handleTogglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className={cn(
                'group/artwork relative flex items-center justify-center shrink-0 cursor-pointer rounded-full overflow-hidden',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                currentSize.artwork
              )}
            >
              {/* Artwork / Orb */}
              {renderSlot(
                slots?.artwork,
                {
                  src: displayArtwork,
                  alt: effectiveTrack?.title || label || 'Track artwork',
                  className: 'size-full',
                  ...slotProps?.artwork,
                },
                { defaultComponent: DefaultAudioPlayerPillArtwork }
              )}
              {/* Play/Pause/Spinner overlay — fades in on hover, all states always mounted */}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover/artwork:opacity-100 transition-opacity duration-150 pointer-events-none">
                <span className={cn('relative flex items-center justify-center', currentSize.icon)}>
                  <span className={cn('absolute inset-0 flex items-center justify-center transition-opacity duration-[120ms]', showSpinner ? 'opacity-100' : 'opacity-0')}>
                    <div className="size-[75%] rounded-full border-2 border-white border-t-transparent animate-spin" />
                  </span>
                  <span className={cn('absolute inset-0 flex items-center justify-center transition-opacity duration-[120ms]', !showSpinner && !isPlaying ? 'opacity-100' : 'opacity-0')}>
                    {renderSlot(slots?.playIcon, { className: cn(currentSize.icon, 'translate-x-0.5 text-white drop-shadow'), ...slotProps?.playIcon }, { defaultComponent: PlayIcon })}
                  </span>
                  <span className={cn('absolute inset-0 flex items-center justify-center transition-opacity duration-[120ms]', !showSpinner && isPlaying ? 'opacity-100' : 'opacity-0')}>
                    {renderSlot(slots?.pauseIcon, { className: cn(currentSize.icon, 'text-white drop-shadow'), ...slotProps?.pauseIcon }, { defaultComponent: PauseIcon })}
                  </span>
                </span>
              </div>
            </button>
          )
        ) : (
          /* ── Default variant ── separate artwork + play/pause button ── */
          <>
            {hasArtwork && (
              <div className="flex items-center justify-center shrink-0">
                {renderSlot(
                  slots?.artwork,
                  {
                    src: displayArtwork,
                    alt: effectiveTrack?.title || label || 'Track artwork',
                    className: currentSize.artwork,
                    ...slotProps?.artwork,
                  },
                  { defaultComponent: DefaultAudioPlayerPillArtwork }
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleTogglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className={cn(
                'relative flex items-center justify-center shrink-0 cursor-pointer rounded-full',
                'transition-[background-color,box-shadow,opacity] duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                currentIntent.btnBg,
                'hover:brightness-110 active:brightness-95',
                currentSize.button
              )}
            >
              {/* Fixed-size icon container — all three states always mounted, opacity-crossfaded */}
              <span className={cn('relative flex items-center justify-center pointer-events-none', currentSize.icon)}>
                <span className={cn('absolute inset-0 flex items-center justify-center transition-opacity duration-[120ms]', showSpinner ? 'opacity-100' : 'opacity-0')}>
                  <div className="size-[75%] rounded-full border-2 border-current border-t-transparent animate-spin" />
                </span>
                <span className={cn('absolute inset-0 flex items-center justify-center transition-opacity duration-[120ms]', !showSpinner && !isPlaying ? 'opacity-100' : 'opacity-0')}>
                  {renderSlot(slots?.playIcon, { className: cn(currentSize.icon, 'translate-x-0.5'), ...slotProps?.playIcon }, { defaultComponent: PlayIcon })}
                </span>
                <span className={cn('absolute inset-0 flex items-center justify-center transition-opacity duration-[120ms]', !showSpinner && isPlaying ? 'opacity-100' : 'opacity-0')}>
                  {renderSlot(slots?.pauseIcon, { className: currentSize.icon, ...slotProps?.pauseIcon }, { defaultComponent: PauseIcon })}
                </span>
              </span>
            </button>
          </>
        )}
      </div>

      {/* Timeline & Content Section (Starts from where the right curvature starts of the left capsule) */}
      <div
        ref={contentRef}
        onPointerDown={handlePointerDown}
        className={cn(
          'relative z-20 flex flex-1 items-center h-full min-w-0 cursor-pointer overflow-hidden rounded-r-full select-none',
          currentSize.trackOverlap
        )}
      >
        {/* Base Layer (Normal Theme Colors) */}
        <div
          className={cn(
            'flex w-full items-center justify-between text-fg pointer-events-none select-none',
            currentSize.content
          )}
        >
          <div className="flex flex-col min-w-0 justify-center">
            <span className={cn('truncate text-fg', currentSize.title)}>
              {effectiveTrack?.title || label || 'Audio track'}
            </span>
            {showTimestamp && (
              <span className={cn('font-mono text-muted-fg tabular-nums', currentSize.timestamp)}>
                {formatAudioTimestamp(effectiveTime)} / {formatAudioTimestamp(duration)}
              </span>
            )}
          </div>

          {showWaveform && (
            <MiniPillVisualizer
              isPlaying={isPlaying}
              className={currentSize.visualizer}
              barWidth={currentSize.barWidth}
            />
          )}
        </div>

        {/* Morphing Progress Overlay Layer */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 overflow-hidden pointer-events-none z-10 rounded-r-full',
            currentIntent.fillBg
          )}
          style={{
            width: `${effectiveProgress}%`,
          }}
        >
          {/* Subpixel-matched duplicate content */}
          <div
            className={cn(
              'flex items-center justify-between h-full pointer-events-none select-none',
              currentSize.content
            )}
            style={{ width: contentWidth > 0 ? `${contentWidth}px` : '100%' }}
          >
            <div className="flex flex-col min-w-0 justify-center">
              <span className={cn('truncate text-inherit', currentSize.title)}>
                {effectiveTrack?.title || label || 'Audio track'}
              </span>
              {showTimestamp && (
                <span className={cn('font-mono opacity-85 tabular-nums text-inherit', currentSize.timestamp)}>
                  {formatAudioTimestamp(effectiveTime)} / {formatAudioTimestamp(duration)}
                </span>
              )}
            </div>

            {showWaveform && (
              <MiniPillVisualizer
                isPlaying={isPlaying}
                className={currentSize.visualizer}
                barWidth={currentSize.barWidth}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export const AudioPlayerPill = createInterfaceComponent<
  AudioPlayerPillProps<any>,
  AudioPlayerPillSlots
>(
  {
    name: 'AudioPlayerPill',
    category: 'media',
    description: 'Modern pill-shaped audio player featuring edge-to-edge controls and morphing progress fill.',
    version: '1.0.0',
    slots: {
      playIcon: PlayIcon,
      pauseIcon: PauseIcon,
      artwork: undefined,
    },
  },
  AudioPlayerPillPrimitive
)

AudioPlayerButton.Pill = AudioPlayerPill
AudioPlayerButton.AudioPlayerPill = AudioPlayerPill
AudioPlayerPill.Visualizer = MiniPillVisualizer
AudioPlayerPill.AudioPlayerPill = AudioPlayerPill

export const { Context: AudioPlayerButtonContext, useCompoundContext: useAudioPlayerButtonContext } =
  createCompoundContext<any>('AudioPlayerButton')

export const { Context: AudioPlayerPillContext, useCompoundContext: useAudioPlayerPillContext } =
  createCompoundContext<any>('AudioPlayerPill')

