'use client'

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
} from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Orb, type OrbProps } from '../../../orb/components/orb'
import {
  SensitiveOrb,
  type SensitiveOrbProps,
  type SensitiveOrbSensitivities,
  type SensitiveOrbSensitivity,
} from '../../../orb/components/sensitive-orb'
import type { StyleName, OrbParams } from '../../../orb/engine/presets'
import { resumeAudioContext } from '../../../media/engine/context'
import {
  AudioPlayerProvider,
  AudioPlayerPlayButton,
  AudioPlayerTime,
  AudioPlayerDuration,
  AudioPlayerMuteButton,
  AudioPlayerVolumeSlider,
  AudioPlayerSpeedDropdown,
  AudioPlayerTrackInfo,
  AudioPlayerScrubber,
  useOptionalAudioPlayerEngine,
  useOptionalAudioPlayerSlice,
} from '../../../media/components/audio-player'
import { AudioTimeline } from '../../../media/components/audio-timeline'
import {
  AudioPlayerPill,
  type AudioPlayerPillIntent,
  type AudioPlayerPillIntentStyle,
} from '../../../media/components/audio-player-button'
import { useAudioPlayer, type UseAudioPlayerResult } from '../../../media/hooks/use-audio-player'
import type { AudioTrack, AudioSourceInput } from '../../../media/engine/types'

/* ==========================================================================
   Style to Intent & Preset Mappings
   ========================================================================== */

const INTENT_TO_ORB_STYLE: Record<string, StyleName> = {
  primary: 'aurora',
  secondary: 'chrome',
  success: 'emerald',
  warning: 'gold',
  danger: 'plasma',
  info: 'blueFlame',
  indigo: 'chrome',
}

/* ==========================================================================
   Reactive Orb Component for Audio
   ========================================================================== */

export type OrbSensitivityOptions = SensitiveOrbSensitivities
export type OrbSensitivity = SensitiveOrbSensitivity

export interface ReactiveOrbProps extends Omit<SensitiveOrbProps, 'active'> {
  /** External audio player instance or uses context */
  player?: UseAudioPlayerResult<any> | null
  /** Force specific orb state or automatically calculate from audio playback */
  state?: 'idle' | 'thinking'
  /** Granular sensitivity options or master multiplier */
  sensitivity?: OrbSensitivity
}

export function ReactiveOrb({
  player: propPlayer,
  state: propState,
  sensitivity = 1.0,
  speedSensitivity,
  sizeSensitivity,
  contourSensitivity = 5,
  warpSensitivity,
  glowSensitivity,
  ridgeSensitivity,
  styleName = 'aurora',
  size = 160,
  reactive = true,
  params: customParams,
  speed: customSpeed,
  radius: customRadius,
  transitionDuration = 0.85,
  activationDuration = 0.55,
  className,
  ...orbProps
}: ReactiveOrbProps) {
  const engine = useOptionalAudioPlayerEngine()
  const isPlayingSlice = useOptionalAudioPlayerSlice((s) => s.status === 'playing', false)
  const isPlayingProp = propPlayer?.isPlaying ?? false
  const isPlaying = isPlayingProp || isPlayingSlice

  const audioElement = propPlayer?.audioElement || engine?.getAudioElement() || null

  return (
    <div
      data-slot="orb-audio-reactive"
      className={cn('relative size-full flex items-center justify-center select-none p-0', className)}
    >
      <SensitiveOrb
        active={isPlaying}
        state={propState}
        audioElement={audioElement}
        styleName={styleName}
        size={size}
        reactive={reactive}
        sensitivity={sensitivity}
        speedSensitivity={speedSensitivity}
        sizeSensitivity={sizeSensitivity}
        contourSensitivity={contourSensitivity}
        warpSensitivity={warpSensitivity}
        glowSensitivity={glowSensitivity}
        ridgeSensitivity={ridgeSensitivity}
        speed={customSpeed}
        radius={customRadius}
        params={customParams}
        transitionDuration={transitionDuration}
        activationDuration={activationDuration}
        className="size-full"
        {...orbProps}
      />
    </div>
  )
}

/* ==========================================================================
   OrbAudioPlayer.Artwork / Thumbnail Component
   ========================================================================== */

export interface OrbAudioArtworkProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional audio player instance for reactivity */
  player?: UseAudioPlayerResult<any> | null
  /** Artwork image URL (if provided, renders image; if absent, renders reactive Orb) */
  artwork?: string
  /** Alias for artwork */
  image?: string
  /** Force Orb visualization even if track has artwork */
  forceOrb?: boolean
  /** Orb style preset */
  orbStyle?: StyleName
  /** Orb dimension size */
  size?: number | string
  /** Orb audio sensitivity options or multiplier */
  sensitivity?: OrbSensitivity
  /** Speed sensitivity multiplier shortcut */
  speedSensitivity?: number
  /** Size sensitivity multiplier shortcut */
  sizeSensitivity?: number
  /** Contour deformation sensitivity shortcut */
  contourSensitivity?: number
  /** Warp fluid sensitivity shortcut */
  warpSensitivity?: number
  /** Glow sensitivity shortcut */
  glowSensitivity?: number
  /** Ridge ripple frequency sensitivity shortcut */
  ridgeSensitivity?: number
  /** Custom state transition duration (seconds) */
  transitionDuration?: number
  /** Activation duration from off (seconds) */
  activationDuration?: number
  /** Additional props forwarded directly to the ReactiveOrb WebGPU component */
  orbProps?: Partial<ReactiveOrbProps>
  /** Aspect ratio container class */
  containerClassName?: string
}

export function OrbAudioArtwork({
  player,
  artwork,
  image,
  forceOrb = false,
  orbStyle = 'aurora',
  size = 144,
  sensitivity = 1.0,
  speedSensitivity,
  sizeSensitivity,
  contourSensitivity,
  warpSensitivity,
  glowSensitivity,
  ridgeSensitivity,
  transitionDuration,
  activationDuration,
  orbProps,
  className,
  containerClassName,
  ...props
}: OrbAudioArtworkProps) {
  const displayArtwork = artwork ?? image
  const shouldRenderOrb = forceOrb || !displayArtwork

  if (shouldRenderOrb) {
    return (
      <div
        data-slot="orb-audio-artwork"
        className={cn(
          'relative flex items-center justify-center shrink-0 overflow-visible p-0',
          containerClassName,
          className
        )}
        style={{ width: size, height: size }}
        {...props}
      >
        <ReactiveOrb
          player={player}
          styleName={orbStyle}
          size={size}
          sensitivity={sensitivity}
          speedSensitivity={speedSensitivity}
          sizeSensitivity={sizeSensitivity}
          contourSensitivity={contourSensitivity}
          warpSensitivity={warpSensitivity}
          glowSensitivity={glowSensitivity}
          ridgeSensitivity={ridgeSensitivity}
          transitionDuration={transitionDuration}
          activationDuration={activationDuration}
          className="size-full"
          {...orbProps}
        />
      </div>
    )
  }

  return (
    <div
      data-slot="orb-audio-artwork"
      className={cn(
        'relative flex items-center justify-center shrink-0 rounded-2xl overflow-hidden shadow-xs border border-border/40 bg-muted/40',
        containerClassName,
        className
      )}
      style={{ width: size, height: size }}
      {...props}
    >
      <img
        src={displayArtwork}
        alt="Track artwork"
        className="size-full object-cover select-none"
        loading="lazy"
      />
    </div>
  )
}

/* ==========================================================================
   OrbAudioPlayer Slots & Props
   ========================================================================== */

export interface OrbAudioPlayerSlots {
  /** Artwork / Orb visualizer slot */
  artwork?: React.ComponentType<OrbAudioArtworkProps>
  /** Track title and artist info */
  trackInfo?: React.ComponentType<Record<string, unknown>>
  /** Interactive seeker timeline */
  timeline?: React.ComponentType<Record<string, unknown>>
  /** Play / pause transport button */
  playButton?: React.ComponentType<Record<string, unknown>>
  /** Playback speed dropdown */
  speedDropdown?: React.ComponentType<Record<string, unknown>>
  /** Volume mute button */
  muteButton?: React.ComponentType<Record<string, unknown>>
  /** Volume slider */
  volumeSlider?: React.ComponentType<Record<string, unknown>>
  /** Custom footer node */
  footer?: React.ComponentType<Record<string, unknown>>
}

export interface OrbAudioPlayerProps<TData = unknown>
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onError' | 'onTimeUpdate' | 'onPlay' | 'onPause' | 'onEnded'> {
  /** Track data object */
  track?: AudioTrack<TData> | null
  /** Audio source URL, Blob, or File */
  src?: string | Blob | File
  /** Audio source file, blob, stream, or descriptor input */
  source?: AudioSourceInput<TData> | null
  /** Raw File or Blob audio payload */
  file?: Blob | File | null
  /** Display title */
  title?: string
  /** Display artist */
  artist?: string
  /** Artwork cover image URL (defaults to WebGPU Orb if undefined) */
  artwork?: string
  /** Alias for artwork */
  image?: string
  /** Force WebGPU Orb even if artwork URL is present */
  forceOrb?: boolean
  /** Orb visual style preset */
  orbStyle?: StyleName
  /** Audio sensitivity multiplier or granular options for Orb motion */
  orbSensitivity?: OrbSensitivity
  /** Speed sensitivity multiplier shortcut */
  speedSensitivity?: number
  /** Size / radius sensitivity multiplier shortcut */
  sizeSensitivity?: number
  /** Contour deformation sensitivity shortcut */
  contourSensitivity?: number
  /** Warp fluid sensitivity shortcut */
  warpSensitivity?: number
  /** Outer glow sensitivity shortcut */
  glowSensitivity?: number
  /** Ridge ripple frequency sensitivity shortcut */
  ridgeSensitivity?: number
  /** Transition duration for state changes in seconds */
  transitionDuration?: number
  /** Activation duration for state changes in seconds */
  activationDuration?: number
  /** Hero Orb dimension size in px */
  orbSize?: number | string
  /** Additional props forwarded directly to the internal ReactiveOrb WebGPU component */
  orbProps?: Partial<ReactiveOrbProps>
  /** Total duration in seconds (if known upfront) */
  duration?: number
  /** Visual intent color theme or custom name */
  intent?: AudioPlayerPillIntent | (string & {})
  /** Direct custom intent style override for pill button, fill, glow, and border */
  intentStyle?: AudioPlayerPillIntentStyle
  /** Map of named custom or override intent style definitions */
  intentStyles?: Record<string, AudioPlayerPillIntentStyle>
  /** Presentation variant */
  variant?: 'card' | 'pill' | 'hero'
  /** Auto-play on mount */
  autoPlay?: boolean
  /** Initial volume level (0.0 to 1.0) */
  volume?: number
  /** Initial playback speed */
  playbackRate?: number
  /** Loop playback */
  loop?: boolean
  /** Slot overrides map */
  slotProps?: SlotPropsMap<OrbAudioPlayerSlots>
  /** Custom slot components */
  slots?: SlotComponents<OrbAudioPlayerSlots>
  /** Event triggered when playback begins. */
  onPlay?: () => void
  /** Event triggered when playback is paused. */
  onPause?: () => void
  /** Event triggered when playback reaches the end of the track. */
  onEnded?: () => void
  /** Event triggered when audio loading or decoding fails. */
  onError?: (error: any) => void
  /** Event triggered on playback position update with current time in seconds. */
  onTimeUpdate?: (time: number) => void
  /** Event triggered when active audio track changes. */
  onTrackChange?: (track: AudioTrack<TData> | null) => void
  /** When true and variant='pill', the artwork/orb acts as the play/pause button.
   *  Hovering reveals a translucent play/pause icon overlay. */
  artworkAsButton?: boolean
}

function DefaultTrackInfo({
  title,
  artist,
  className,
  ...props
}: {
  title?: string
  artist?: string
  className?: string
  [key: string]: unknown
}) {
  return (
    <div className={cn('flex flex-col min-w-0 justify-center', className)} {...props}>
      <span className="truncate text-base font-semibold text-fg tracking-tight">
        {title || 'Audio track'}
      </span>
      {artist && <span className="truncate text-xs text-muted-fg mt-0.5">{artist}</span>}
    </div>
  )
}

/* ==========================================================================
   OrbAudioPlayer Primitive Implementation
   ========================================================================== */

function OrbAudioPlayerPrimitive<TData = unknown>({
  track,
  src,
  source,
  file,
  title,
  artist,
  artwork,
  image,
  forceOrb = false,
  orbStyle: propOrbStyle,
  orbSensitivity = 1.0,
  speedSensitivity,
  sizeSensitivity,
  contourSensitivity,
  warpSensitivity,
  glowSensitivity,
  ridgeSensitivity,
  transitionDuration,
  activationDuration,
  orbSize,
  orbProps,
  duration,
  intent = 'primary',
  intentStyle,
  intentStyles,
  variant = 'card',
  autoPlay,
  volume,
  playbackRate,
  loop,
  className,
  children,
  slots,
  slotProps,
  artworkAsButton = false,
  onPlay,
  onPause,
  onEnded,
  onError,
  onTimeUpdate,
  onTrackChange,
  ...props
}: OrbAudioPlayerProps<TData>) {
  const displayArtwork = artwork ?? image ?? track?.artwork
  const resolvedOrbStyle = propOrbStyle || INTENT_TO_ORB_STYLE[intent] || 'aurora'
  const resolvedSource = source ?? file ?? src ?? null

  const effectiveTrack = useMemo<AudioTrack<TData> | null>(() => {
    if (track) return { ...track, artwork: displayArtwork ?? track.artwork }
    if (typeof src === 'string') {
      return {
        id: src,
        src,
        title: title || 'Audio track',
        artist,
        artwork: displayArtwork,
        duration,
      } as AudioTrack<TData>
    }
    return null
  }, [track, src, title, artist, displayArtwork, duration])

  const internalPlayer = useAudioPlayer<TData>({
    initialTrack: effectiveTrack,
    source: resolvedSource,
    autoplay: autoPlay,
    volume,
    playbackRate,
    loop,
    events: {
      onPlay,
      onPause,
      onEnded,
      onTimeUpdate,
      onTrackChange,
      onError,
    },
  })

  // If Pill variant is requested:
  if (variant === 'pill') {
    const pillOrbSize = orbSize || 34
    return (
      <AudioPlayerPill
        track={effectiveTrack}
        src={src}
        title={title}
        artist={artist}
        artwork={displayArtwork}
        showArtwork={true}
        duration={duration}
        player={internalPlayer}
        intent={intent}
        intentStyle={intentStyle}
        intentStyles={intentStyles}
        className={className}
        artworkAsButton={artworkAsButton}
        slots={{
          artwork: ({ className: slotClass }: any) => (
            <div className={cn('size-full flex items-center justify-center rounded-full shrink-0 p-0', slotClass)}>
              {forceOrb || !displayArtwork ? (
                <ReactiveOrb
                  player={internalPlayer}
                  styleName={resolvedOrbStyle}
                  size={orbSize || '100%'}
                  sensitivity={orbSensitivity}
                  speedSensitivity={speedSensitivity}
                  sizeSensitivity={sizeSensitivity}
                  contourSensitivity={contourSensitivity}
                  warpSensitivity={warpSensitivity}
                  glowSensitivity={glowSensitivity}
                  ridgeSensitivity={ridgeSensitivity}
                  transitionDuration={transitionDuration}
                  activationDuration={activationDuration}
                  className="size-full rounded-full"
                  {...orbProps}
                />
              ) : (
                <img
                  src={displayArtwork}
                  alt={title || 'Track artwork'}
                  className="size-full object-cover rounded-full select-none"
                />
              )}
            </div>
          ),
        }}
      />
    )
  }

  // Hero / Card Layout
  const isHero = variant === 'hero'
  const heroSize = orbSize || (isHero ? 280 : 144)

  const innerContent = children ? (
    <div
      data-slot="orb-audio-player"
      className={cn(
        'relative flex w-full flex-col gap-4 rounded-3xl border border-border/40 bg-card/70 p-5 sm:p-6 shadow-md backdrop-blur-xl transition-all',
        className
      )}
      {...props}
    >
      {children}
    </div>
  ) : (
    <div
      data-slot="orb-audio-player"
      className={cn(
        'relative flex w-full flex-col gap-4.5 rounded-3xl border border-border/40 bg-card/75 p-5 sm:p-6 shadow-md backdrop-blur-xl transition-all',
        isHero && 'items-center text-center max-w-md mx-auto',
        className
      )}
      {...props}
    >
      {/* Top Section: Hero Orb / Artwork + Track Info */}
      <div className={cn('flex items-center gap-4 w-full', isHero ? 'flex-col justify-center' : 'justify-between')}>
        <div className={cn('flex items-center gap-4 min-w-0', isHero && 'flex-col items-center')}>
          {renderSlot(
            slots?.artwork,
            {
              player: internalPlayer,
              artwork: displayArtwork,
              forceOrb,
              orbStyle: resolvedOrbStyle,
              size: heroSize,
              sensitivity: orbSensitivity,
              speedSensitivity,
              sizeSensitivity,
              contourSensitivity,
              warpSensitivity,
              glowSensitivity,
              containerClassName: isHero ? 'rounded-full shadow-lg' : undefined,
              orbProps,
              ...slotProps?.artwork,
            },
            {
              defaultComponent: OrbAudioArtwork,
            }
          )}

          <div className={cn('flex flex-col min-w-0', isHero && 'items-center')}>
            {renderSlot(
              slots?.trackInfo,
              {
                title: effectiveTrack?.title || title || 'Audio track',
                artist: effectiveTrack?.artist || artist,
                showArtwork: false,
                className: isHero ? 'text-center' : undefined,
                ...slotProps?.trackInfo,
              },
              {
                defaultComponent: DefaultTrackInfo,
              }
            )}
          </div>
        </div>
      </div>

      {/* Seeker Timeline */}
      <div className="flex flex-col gap-1.5 w-full">
        {renderSlot(slots?.timeline, slotProps?.timeline, { defaultComponent: AudioTimeline })}
        <div className="flex items-center justify-between font-mono text-[11px] tabular-nums text-muted-fg px-0.5">
          <AudioPlayerTime />
          <AudioPlayerDuration />
        </div>
      </div>

      {/* Control Transport Bar */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {renderSlot(
          slots?.playButton,
          {
            intent,
            size: isHero ? 'sq-lg' : 'sq-md',
            ...slotProps?.playButton,
          },
          { defaultComponent: AudioPlayerPlayButton }
        )}

        <div className="flex items-center gap-2">
          {renderSlot(slots?.speedDropdown, slotProps?.speedDropdown, {
            defaultComponent: AudioPlayerSpeedDropdown,
          })}
          {renderSlot(slots?.muteButton, slotProps?.muteButton, {
            defaultComponent: AudioPlayerMuteButton,
          })}
          {renderSlot(
            slots?.volumeSlider,
            { className: 'w-18 sm:w-22', ...slotProps?.volumeSlider },
            { defaultComponent: AudioPlayerVolumeSlider }
          )}
        </div>
      </div>

      {renderSlot(slots?.footer, slotProps?.footer)}
    </div>
  )

  return (
    <AudioPlayerProvider
      initialTrack={effectiveTrack}
      source={source ?? src ?? null}
      engine={internalPlayer.engine}
      autoplay={autoPlay}
      volume={volume}
      playbackRate={playbackRate}
      loop={loop}
      onPlay={onPlay}
      onPause={onPause}
      onEnded={onEnded}
      onTimeUpdate={onTimeUpdate}
      onTrackChange={onTrackChange}
      onError={onError}
    >
      {innerContent}
    </AudioPlayerProvider>
  )
}

/* ==========================================================================
   Component Creation & Compound Primatives Attachments
   ========================================================================== */

export const OrbAudioPlayer = createInterfaceComponent<
  OrbAudioPlayerProps<any>,
  OrbAudioPlayerSlots
>(
  {
    name: 'OrbAudioPlayer',
    category: 'composite',
    description:
      'Audio-reactive player composite showcasing real-time WebGPU Liquid Glass Orb motion sensitive to audio frequency and volume when no track artwork is provided.',
    version: '1.0.0',
    slots: {
      artwork: OrbAudioArtwork,
      trackInfo: AudioPlayerTrackInfo,
      timeline: AudioTimeline,
      playButton: AudioPlayerPlayButton,
      speedDropdown: AudioPlayerSpeedDropdown,
      muteButton: AudioPlayerMuteButton,
      volumeSlider: AudioPlayerVolumeSlider,
      footer: undefined,
    },
  },
  OrbAudioPlayerPrimitive
)

// Compound Subcomponents
OrbAudioPlayer.Orb = ReactiveOrb
OrbAudioPlayer.Artwork = OrbAudioArtwork
OrbAudioPlayer.PlayButton = AudioPlayerPlayButton
OrbAudioPlayer.Timeline = AudioTimeline
OrbAudioPlayer.TrackInfo = AudioPlayerTrackInfo
OrbAudioPlayer.Scrubber = AudioPlayerScrubber
OrbAudioPlayer.Time = AudioPlayerTime
OrbAudioPlayer.Duration = AudioPlayerDuration
OrbAudioPlayer.MuteButton = AudioPlayerMuteButton
OrbAudioPlayer.VolumeSlider = AudioPlayerVolumeSlider
OrbAudioPlayer.SpeedDropdown = AudioPlayerSpeedDropdown
OrbAudioPlayer.Pill = AudioPlayerPill

export const { Context: OrbAudioPlayerContext, useCompoundContext: useOrbAudioPlayerContext } =
  createCompoundContext<any>('OrbAudioPlayer')
