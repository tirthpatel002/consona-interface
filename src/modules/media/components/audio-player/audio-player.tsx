'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import {
  PauseIcon,
  PlayIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  MusicalNoteIcon,
} from '@heroicons/react/24/solid'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Button, type ButtonProps } from '../../../core/components/button'
import { Slider } from '../../../core/components/slider'
import {
  AudioPlayerEngine,
  type AudioPlayerEngineState,
  type AudioPlayerEngineOptions,
} from '../../engine/player-engine'
import { type UseAudioPlayerResult } from '../../hooks/use-audio-player'
import type {
  AudioEngineError,
  AudioPlayerEvents,
  AudioSourceInput,
  AudioTrack,
  AudioUploader,
  TranscriptInput,
  AudioUploadResult,
} from '../../engine/types'
import { sourceIdentity } from '../../engine/source'
import { TranscriptViewer, type TranscriptViewerProps } from '../transcript-viewer'
import { AudioSourcePicker, type AudioSourcePickerProps } from '../audio-source-picker'
import { AudioTimeline, type AudioTimelineProps } from '../audio-timeline'
import { formatAudioTimestamp } from '../../engine/utils'

/* ==========================================================================
   AudioPlayer Engine & Context
   ========================================================================== */

const DEFAULT_PLAYER_STATE: AudioPlayerEngineState<any> = {
  activeTrack: null,
  status: 'idle',
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  playbackRate: 1,
  isBuffering: false,
  error: null,
}

const AudioPlayerEngineContext = createContext<AudioPlayerEngine<any> | null | undefined>(undefined)

export function usePlayerEngine<TData = unknown>(): AudioPlayerEngine<TData> | null {
  const engine = useContext(AudioPlayerEngineContext) as AudioPlayerEngine<TData> | null | undefined
  return engine ?? null
}

export function useOptionalAudioPlayerEngine<TData = unknown>(): AudioPlayerEngine<TData> | null {
  const engine = useContext(AudioPlayerEngineContext) as AudioPlayerEngine<TData> | null | undefined
  return engine === undefined ? null : engine
}

export function useOptionalAudioPlayerSlice<T>(
  selector: (state: AudioPlayerEngineState) => T,
  fallback: T
): T {
  const engine = useOptionalAudioPlayerEngine()
  const selectorRef = useRef(selector)
  selectorRef.current = selector
  const selectedRef = useRef<T>(engine ? selector(engine.getState()) : fallback)

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!engine) return () => {}
      return engine.subscribe(() => onStoreChange?.())
    },
    [engine]
  )

  const getSnapshot = useCallback(() => {
    if (!engine) return fallback
    const next = selectorRef.current(engine.getState())
    if (Object.is(selectedRef.current, next)) return selectedRef.current
    selectedRef.current = next
    return next
  }, [engine, fallback])

  const getServerSnapshot = useCallback(
    () => (engine ? selectorRef.current(DEFAULT_PLAYER_STATE) : fallback),
    [engine, fallback]
  )

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function useAudioPlayerSlice<T>(
  selector: (state: AudioPlayerEngineState) => T
): T {
  const engine = usePlayerEngine()
  const selectorRef = useRef(selector)
  selectorRef.current = selector
  const selectedRef = useRef<T>(selector(engine?.getState() ?? DEFAULT_PLAYER_STATE))

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!engine) return () => {}
      return engine.subscribe(() => onStoreChange?.())
    },
    [engine]
  )

  const getSnapshot = useCallback(() => {
    const next = selectorRef.current(engine?.getState() ?? DEFAULT_PLAYER_STATE)
    if (Object.is(selectedRef.current, next)) return selectedRef.current
    selectedRef.current = next
    return next
  }, [engine])

  const getServerSnapshot = useCallback(
    () => selectorRef.current(DEFAULT_PLAYER_STATE),
    []
  )

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function useAudioPlayerContext<TData = unknown>(): UseAudioPlayerResult<TData> {
  const engine = usePlayerEngine<TData>()
  const state = useAudioPlayerSlice((s) => s) as AudioPlayerEngineState<TData>

  return useMemo(
    () => ({
      ...state,
      engine,
      audioElement: engine?.getAudioElement() ?? null,
      isPlaying: state.status === 'playing',
      play: (track?: AudioTrack<TData> | null) => (engine ? engine.play(track) : Promise.resolve()),
      pause: () => engine?.pause(),
      togglePlay: () => engine?.togglePlay(),
      seek: (time: number) => engine?.seek(time),
      setVolume: (volume: number) => engine?.setVolume(volume),
      toggleMute: () => engine?.toggleMute(),
      setPlaybackRate: (rate: number) => engine?.setPlaybackRate(rate),
      setTrack: (track: AudioTrack<TData> | null) =>
        engine ? engine.setTrack(track) : Promise.resolve(),
      setSource: (source: AudioSourceInput<TData> | null) =>
        engine ? engine.setSource(source) : Promise.resolve(),
      isTrackActive: (id: string | number | null | undefined) =>
        id !== null && id !== undefined && engine?.getState().activeTrack?.id === id,
    }),
    [engine, state]
  )
}

/* ==========================================================================
   AudioPlayerProvider
   ========================================================================== */

export interface AudioPlayerProviderProps<TData = unknown>
  extends Pick<AudioPlayerEngineOptions<TData>, 'autoplay' | 'volume' | 'playbackRate' | 'loop' | 'preload' | 'crossOrigin'> {
  /** Optional initial track configuration */
  initialTrack?: AudioTrack<TData> | null
  /** Audio source url or descriptor */
  source?: AudioSourceInput<TData> | null
  /** Existing engine instance */
  engine?: AudioPlayerEngine<TData> | null
  /** Child elements */
  children: ReactNode
  /** Event listeners */
  onPlay?: () => void
  /** Callback fired when pause occurs. */
  onPause?: () => void
  /** Callback fired when ended occurs. */
  /** Callback fired when ended occurs. */
  onEnded?: () => void
  /** Callback fired when error occurs. */
  /** Callback fired when error occurs. */
  onError?: (error: AudioEngineError) => void
  /** Callback fired when time update occurs. */
  onTimeUpdate?: (time: number) => void
  /** Callback fired when track change occurs. */
  onTrackChange?: (track: AudioTrack<TData> | null) => void
}

export function AudioPlayerProvider<TData = unknown>({
  initialTrack,
  source,
  engine: injectedEngine,
  autoplay,
  volume,
  playbackRate,
  loop,
  preload,
  crossOrigin,
  children,
  onPlay,
  onPause,
  onEnded,
  onError,
  onTimeUpdate,
  onTrackChange,
}: AudioPlayerProviderProps<TData>) {
  const ownedEngineRef = useRef<AudioPlayerEngine<TData> | null>(null)
  const injected = injectedEngine ?? null

  if (typeof window !== 'undefined' && !injected && !ownedEngineRef.current) {
    ownedEngineRef.current = new AudioPlayerEngine<TData>({
      initialTrack,
      source,
      autoplay,
      volume,
      playbackRate,
      loop,
      preload,
      crossOrigin,
    })
  }

  const engine = injected ?? ownedEngineRef.current

  const events = useMemo<AudioPlayerEvents<TData>>(
    () => ({ onPlay, onPause, onEnded, onError, onTimeUpdate, onTrackChange }),
    [onPlay, onPause, onEnded, onError, onTimeUpdate, onTrackChange]
  )

  useEffect(() => {
    engine?.setEvents(events)
  }, [engine, events])

  const sourceKey = sourceIdentity(source ?? initialTrack ?? null)
  const prevEngineRef = useRef<AudioPlayerEngine<TData> | null>(null)
  const prevSourceKeyRef = useRef<string>('')

  useEffect(() => {
    if (!engine) return
    const engineChanged = prevEngineRef.current !== engine
    const sourceKeyChanged = prevSourceKeyRef.current !== sourceKey
    prevEngineRef.current = engine
    prevSourceKeyRef.current = sourceKey

    if (engineChanged || sourceKeyChanged) {
      if (source !== undefined) {
        engine.setSource(source ?? null)
      } else if (initialTrack) {
        engine.setTrack(initialTrack)
      }
    }
  }, [engine, sourceKey, source, initialTrack])

  useEffect(() => {
    return () => {
      if (!injected) {
        ownedEngineRef.current?.destroy()
        ownedEngineRef.current = null
      }
    }
  }, [injected])

  return (
    <AudioPlayerEngineContext.Provider value={engine as AudioPlayerEngine<any> | null}>
      {children}
    </AudioPlayerEngineContext.Provider>
  )
}



/* ==========================================================================
   AudioPlayerPlayButton
   ========================================================================== */

export interface AudioPlayerPlayButtonSlots {
  /** Play icon */
  playIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Pause icon */
  pauseIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface AudioPlayerPlayButtonProps
  extends Omit<ButtonProps, 'children' | 'isPending' | 'slots' | 'slotProps'> {
  /** Button sizing variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'sq-xs' | 'sq-sm' | 'sq-md' | 'sq-lg'
  /** Slot overrides map */
  slotProps?: SlotPropsMap<AudioPlayerPlayButtonSlots>
  /** Custom slot components */
  slots?: SlotComponents<AudioPlayerPlayButtonSlots>
}

function AudioPlayerPlayButtonPrimitive({
  className,
  size = 'sq-md',
  intent = 'primary',
  isCircle = true,
  slots,
  slotProps,
  ...props
}: AudioPlayerPlayButtonProps) {
  const engine = usePlayerEngine()
  const isPlaying = useAudioPlayerSlice((s) => s.status === 'playing')
  const isBuffering = useAudioPlayerSlice((s) => s.isBuffering)
  const showSpinner = isBuffering && isPlaying

  return (
    <Button
      type="button"
      size={size}
      intent={intent}
      isCircle={isCircle}
      isPending={false}
      onPress={() => engine?.togglePlay()}
      aria-label={isPlaying ? 'Pause' : 'Play'}
      className={cn('cursor-pointer shadow-sm transition-[background-color,box-shadow,opacity,transform] active:scale-95', className)}
      {...props}
    >
      {/* Fixed-size icon container — all three states always mounted, opacity-crossfaded */}
      <span className="relative flex items-center justify-center size-5 pointer-events-none">
        <span className={cn('absolute inset-0 flex items-center justify-center transition-opacity duration-[120ms]', showSpinner ? 'opacity-100' : 'opacity-0')}>
          <div className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        </span>
        <span className={cn('absolute inset-0 flex items-center justify-center transition-opacity duration-[120ms]', !showSpinner && !isPlaying ? 'opacity-100' : 'opacity-0')}>
          {renderSlot(slots?.playIcon, { className: 'size-5 translate-x-0.5', ...slotProps?.playIcon }, { defaultComponent: PlayIcon })}
        </span>
        <span className={cn('absolute inset-0 flex items-center justify-center transition-opacity duration-[120ms]', !showSpinner && isPlaying ? 'opacity-100' : 'opacity-0')}>
          {renderSlot(slots?.pauseIcon, { className: 'size-5', ...slotProps?.pauseIcon }, { defaultComponent: PauseIcon })}
        </span>
      </span>
    </Button>
  )
}

export const AudioPlayerPlayButton = createInterfaceComponent<
  AudioPlayerPlayButtonProps,
  AudioPlayerPlayButtonSlots
>(
  {
    name: 'AudioPlayerPlayButton',
    category: 'media',
    description: 'Play and pause toggle button with loading and buffering states.',
    version: '1.0.0',
    slots: {
      playIcon: PlayIcon,
      pauseIcon: PauseIcon,
    },
  },
  AudioPlayerPlayButtonPrimitive
)

/* ==========================================================================
   AudioPlayerScrubber
   ========================================================================== */

export interface AudioPlayerScrubberSlots {
  /** Outer scrub bar container */
  scrubBar?: React.ComponentType<Record<string, unknown>>
}

export interface AudioPlayerScrubberProps extends HTMLAttributes<HTMLDivElement> {
  /** Whether to render elapsed/duration timestamps */
  showLabels?: boolean
  /** Slot overrides map */
  slotProps?: SlotPropsMap<AudioPlayerScrubberSlots>
  /** Custom slot components */
  slots?: SlotComponents<AudioPlayerScrubberSlots>
}

function AudioPlayerScrubberPrimitive({
  showLabels = true,
  className,
  slots,
  slotProps,
  ...props
}: AudioPlayerScrubberProps) {
  const engine = usePlayerEngine()
  const currentTime = useAudioPlayerSlice((s) => s.currentTime)
  const duration = useAudioPlayerSlice((s) => s.duration)

  const sliderNode = (
    <Slider
      aria-label="Audio playback progress"
      minValue={0}
      maxValue={Math.max(duration, 0.1)}
      step={0.01}
      value={currentTime}
      isDisabled={duration <= 0}
      onChange={(v) => {
        const val = typeof v === 'number' ? v : v[0]
        engine?.seek(val)
      }}
      className="w-full"
    >
      <Slider.Track />
    </Slider>
  )

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)} {...props}>
      {renderSlot(
        slots?.scrubBar,
        {
          currentTime,
          duration,
          onSeek: (time: number) => engine?.seek(time),
          children: sliderNode,
          ...slotProps?.scrubBar,
        }
      ) ?? sliderNode}
      {showLabels && (
        <div className="flex items-center justify-between font-mono text-xs tabular-nums text-muted-fg">
          <span>{formatAudioTimestamp(currentTime)}</span>
          <span>{duration > 0 ? formatAudioTimestamp(duration) : '--:--'}</span>
        </div>
      )}
    </div>
  )
}

export const AudioPlayerScrubber = createInterfaceComponent<
  AudioPlayerScrubberProps,
  AudioPlayerScrubberSlots
>(
  {
    name: 'AudioPlayerScrubber',
    category: 'media',
    description: 'Interactive timeline scrubber with current time and duration labels.',
    version: '1.0.0',
    slots: {
      scrubBar: undefined,
    },
  },
  AudioPlayerScrubberPrimitive
)

/* ==========================================================================
   AudioPlayerTime & Duration
   ========================================================================== */

export interface AudioPlayerTimeSlots {
  /** Time text wrapper */
  wrapper?: React.ComponentType<HTMLAttributes<HTMLSpanElement>>
}

export interface AudioPlayerTimeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Slot overrides map */
  slotProps?: SlotPropsMap<AudioPlayerTimeSlots>
  /** Custom slot components */
  slots?: SlotComponents<AudioPlayerTimeSlots>
}

function AudioPlayerTimePrimitive({ className, slots, slotProps, ...props }: AudioPlayerTimeProps) {
  const currentTime = useAudioPlayerSlice((s) => s.currentTime)
  const formatted = formatAudioTimestamp(currentTime)
  return renderSlot(
    slots?.wrapper,
    {
      className: cn('font-mono text-xs tabular-nums text-muted-fg', className),
      children: formatted,
      ...slotProps?.wrapper,
      ...props,
    }
  ) ?? (
    <span className={cn('font-mono text-xs tabular-nums text-muted-fg', className)} {...props}>
      {formatted}
    </span>
  )
}

export const AudioPlayerTime = createInterfaceComponent<AudioPlayerTimeProps, AudioPlayerTimeSlots>(
  {
    name: 'AudioPlayerTime',
    category: 'media',
    description: 'Displays current playback elapsed timestamp.',
    version: '1.0.0',
    slots: {
      wrapper: undefined,
    },
  },
  AudioPlayerTimePrimitive
)

function AudioPlayerDurationPrimitive({ className, slots, slotProps, ...props }: AudioPlayerTimeProps) {
  const engine = useOptionalAudioPlayerEngine()
  const durationSlice = useAudioPlayerSlice((s) => s.duration)
  const audioEl = engine?.getAudioElement?.()
  const elDuration = audioEl && Number.isFinite(audioEl.duration) && audioEl.duration > 0 ? audioEl.duration : 0
  const duration = durationSlice > 0 ? durationSlice : elDuration
  const formatted = duration > 0 ? formatAudioTimestamp(duration) : '--:--'

  return renderSlot(
    slots?.wrapper,
    {
      className: cn('font-mono text-xs tabular-nums text-muted-fg', className),
      children: formatted,
      ...slotProps?.wrapper,
      ...props,
    }
  ) ?? (
    <span className={cn('font-mono text-xs tabular-nums text-muted-fg', className)} {...props}>
      {formatted}
    </span>
  )
}

export const AudioPlayerDuration = createInterfaceComponent<AudioPlayerTimeProps, AudioPlayerTimeSlots>(
  {
    name: 'AudioPlayerDuration',
    category: 'media',
    description: 'Displays total duration timestamp of active audio track.',
    version: '1.0.0',
    slots: {
      wrapper: undefined,
    },
  },
  AudioPlayerDurationPrimitive
)

/* ==========================================================================
   AudioPlayerMuteButton
   ========================================================================== */

export interface AudioPlayerMuteButtonSlots {
  /** Speaker sound icon */
  soundIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Speaker muted icon */
  muteIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface AudioPlayerMuteButtonProps
  extends Omit<ButtonProps, 'children' | 'slots' | 'slotProps'> {
  /** Slot overrides map */
  slotProps?: SlotPropsMap<AudioPlayerMuteButtonSlots>
  /** Custom slot components */
  slots?: SlotComponents<AudioPlayerMuteButtonSlots>
}

function AudioPlayerMuteButtonPrimitive({
  className,
  size = 'sq-sm',
  intent = 'plain',
  slots,
  slotProps,
  ...props
}: AudioPlayerMuteButtonProps) {
  const engine = usePlayerEngine()
  const isMuted = useAudioPlayerSlice((s) => s.isMuted)

  return (
    <Button
      type="button"
      size={size}
      intent={intent}
      onPress={() => engine?.toggleMute()}
      aria-label={isMuted ? 'Unmute' : 'Mute'}
      className={cn('cursor-pointer text-muted-fg hover:text-fg', className)}
      {...props}
    >
      {isMuted
        ? renderSlot(slots?.muteIcon, { className: 'size-4', ...slotProps?.muteIcon }, { defaultComponent: SpeakerXMarkIcon })
        : renderSlot(slots?.soundIcon, { className: 'size-4', ...slotProps?.soundIcon }, { defaultComponent: SpeakerWaveIcon })}
    </Button>
  )
}

export const AudioPlayerMuteButton = createInterfaceComponent<
  AudioPlayerMuteButtonProps,
  AudioPlayerMuteButtonSlots
>(
  {
    name: 'AudioPlayerMuteButton',
    category: 'media',
    description: 'Mute and unmute toggle button with volume icons.',
    version: '1.0.0',
    slots: {
      soundIcon: SpeakerWaveIcon,
      muteIcon: SpeakerXMarkIcon,
    },
  },
  AudioPlayerMuteButtonPrimitive
)

/* ==========================================================================
   AudioPlayerVolumeSlider
   ========================================================================== */

export interface AudioPlayerVolumeSliderSlots {
  /** Outer volume wrapper */
  wrapper?: React.ComponentType<HTMLAttributes<HTMLDivElement>>
}

export interface AudioPlayerVolumeSliderProps extends HTMLAttributes<HTMLDivElement> {
  /** Slot overrides map */
  slotProps?: SlotPropsMap<AudioPlayerVolumeSliderSlots>
  /** Custom slot components */
  slots?: SlotComponents<AudioPlayerVolumeSliderSlots>
}

function AudioPlayerVolumeSliderPrimitive({ className, slots, slotProps, ...props }: AudioPlayerVolumeSliderProps) {
  const engine = usePlayerEngine()
  const volume = useAudioPlayerSlice((s) => s.volume)
  const isMuted = useAudioPlayerSlice((s) => s.isMuted)
  const displayVol = isMuted ? 0 : volume

  const sliderNode = (
    <div data-slot="audio-player-volume" className={cn('flex w-20 items-center', className)} {...props}>
      <Slider
        aria-label="Audio volume"
        minValue={0}
        maxValue={1}
        step={0.01}
        value={displayVol}
        onChange={(v) => {
          const val = typeof v === 'number' ? v : v[0]
          engine?.setVolume(val)
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
      children: sliderNode,
      ...slotProps?.wrapper,
    }
  ) ?? sliderNode
}

export const AudioPlayerVolumeSlider = createInterfaceComponent<
  AudioPlayerVolumeSliderProps,
  AudioPlayerVolumeSliderSlots
>(
  {
    name: 'AudioPlayerVolumeSlider',
    category: 'media',
    description: 'Slider track adjusting playback audio volume level.',
    version: '1.0.0',
    slots: {
      wrapper: undefined,
    },
  },
  AudioPlayerVolumeSliderPrimitive
)

/* ==========================================================================
   AudioPlayerSpeedButtonGroup & SpeedDropdown
   ========================================================================== */

export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const

export interface AudioPlayerSpeedButtonGroupSlots {
  /** Group wrapper */
  wrapper?: React.ComponentType<HTMLAttributes<HTMLDivElement>>
}

export interface AudioPlayerSpeedButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Custom speed multiples array */
  speeds?: readonly number[]
  /** Slot overrides map */
  slotProps?: SlotPropsMap<AudioPlayerSpeedButtonGroupSlots>
  /** Custom slot components */
  slots?: SlotComponents<AudioPlayerSpeedButtonGroupSlots>
}

function AudioPlayerSpeedButtonGroupPrimitive({
  speeds = PLAYBACK_SPEEDS,
  className,
  slots,
  slotProps,
  ...props
}: AudioPlayerSpeedButtonGroupProps) {
  const engine = usePlayerEngine()
  const playbackRate = useAudioPlayerSlice((s) => s.playbackRate)

  const groupNode = (
    <div
      data-slot="audio-speed-group"
      className={cn('flex items-center gap-1', className)}
      role="group"
      aria-label="Playback speed"
      {...props}
    >
      {speeds.map((rate) => (
        <button
          key={rate}
          type="button"
          onClick={() => engine?.setPlaybackRate(rate)}
          className={cn(
            'cursor-pointer rounded-micro px-2 py-0.5 font-mono text-[11px] font-medium transition-colors',
            playbackRate === rate
              ? 'bg-primary text-primary-fg shadow-xs'
              : 'text-muted-fg hover:bg-muted hover:text-fg'
          )}
        >
          {rate === 1 ? '1x' : `${rate}x`}
        </button>
      ))}
    </div>
  )

  return renderSlot(
    slots?.wrapper,
    {
      children: groupNode,
      ...slotProps?.wrapper,
    }
  ) ?? groupNode
}

export const AudioPlayerSpeedButtonGroup = createInterfaceComponent<
  AudioPlayerSpeedButtonGroupProps,
  AudioPlayerSpeedButtonGroupSlots
>(
  {
    name: 'AudioPlayerSpeedButtonGroup',
    category: 'media',
    description: 'Group of speed multiplier buttons (0.5x to 2x).',
    version: '1.0.0',
    slots: {
      wrapper: undefined,
    },
  },
  AudioPlayerSpeedButtonGroupPrimitive
)

export interface AudioPlayerSpeedDropdownSlots {
  /** Dropdown trigger */
  trigger?: React.ComponentType<Record<string, unknown>>
}

export interface AudioPlayerSpeedDropdownProps extends HTMLAttributes<HTMLDivElement> {
  /** Slot overrides map */
  slotProps?: SlotPropsMap<AudioPlayerSpeedDropdownSlots>
  /** Custom slot components */
  slots?: SlotComponents<AudioPlayerSpeedDropdownSlots>
}

function AudioPlayerSpeedDropdownPrimitive({ className, slots, slotProps, ...props }: AudioPlayerSpeedDropdownProps) {
  const engine = usePlayerEngine()
  const playbackRate = useAudioPlayerSlice((s) => s.playbackRate)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)} {...props}>
      {renderSlot(
        slots?.trigger,
        {
          isOpen,
          playbackRate,
          onClick: () => setIsOpen(!isOpen),
          ...slotProps?.trigger,
        }
      ) ?? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Playback speed"
          className="flex cursor-pointer items-center gap-1 rounded-micro border border-border/50 bg-muted/40 px-2 py-1 font-mono text-xs font-medium text-muted-fg hover:bg-muted/80 hover:text-fg transition-colors"
        >
          <span>{playbackRate === 1 ? '1x' : `${playbackRate}x`}</span>
          <span className="text-[10px] text-muted-fg/70">▾</span>
        </button>
      )}

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-1.5 z-50 flex min-w-[76px] flex-col rounded-base border border-border/50 bg-card p-1 shadow-lg backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
          {PLAYBACK_SPEEDS.map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => {
                engine?.setPlaybackRate(rate)
                setIsOpen(false)
              }}
              className={cn(
                'flex w-full cursor-pointer items-center justify-between rounded-micro px-2 py-1 text-xs font-mono transition-colors',
                playbackRate === rate
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-fg hover:bg-muted/60'
              )}
            >
              <span>{rate === 1 ? '1x' : `${rate}x`}</span>
              {playbackRate === rate && <span className="text-[10px] text-primary">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export const AudioPlayerSpeedDropdown = createInterfaceComponent<
  AudioPlayerSpeedDropdownProps,
  AudioPlayerSpeedDropdownSlots
>(
  {
    name: 'AudioPlayerSpeedDropdown',
    category: 'media',
    description: 'Compact popover dropdown menu for selecting audio speed.',
    version: '1.0.0',
    slots: {
      trigger: undefined,
    },
  },
  AudioPlayerSpeedDropdownPrimitive
)

/* ==========================================================================
   AudioPlayerArtwork
   ========================================================================== */

export interface AudioPlayerArtworkSlots {
  /** Fallback placeholder icon */
  fallbackIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface AudioPlayerArtworkProps extends HTMLAttributes<HTMLDivElement> {
  /** Artwork image URL */
  src?: string
  /** Image alt text */
  alt?: string
  /** Slot overrides map */
  slotProps?: SlotPropsMap<AudioPlayerArtworkSlots>
  /** Custom slot components */
  slots?: SlotComponents<AudioPlayerArtworkSlots>
}

function AudioPlayerArtworkPrimitive({
  src,
  alt = 'Album artwork',
  className,
  slots,
  slotProps,
  ...props
}: AudioPlayerArtworkProps) {
  const activeTrack = useAudioPlayerSlice((s) => s.activeTrack)
  const imageSrc = src ?? activeTrack?.artwork

  if (!imageSrc) {
    return (
      <div
        data-slot="audio-artwork-placeholder"
        className={cn(
          'flex size-12 sm:size-14 shrink-0 items-center justify-center rounded-xl bg-secondary/60 text-muted-fg border border-border/60 shadow-xs select-none',
          className
        )}
        {...props}
      >
        {renderSlot(
          slots?.fallbackIcon,
          { className: 'size-6', ...slotProps?.fallbackIcon },
          { defaultComponent: MusicalNoteIcon }
        )}
      </div>
    )
  }

  return (
    <div
      data-slot="audio-artwork"
      className={cn(
        'relative size-12 sm:size-14 shrink-0 overflow-hidden rounded-xl border border-border/60 shadow-xs select-none group/artwork',
        className
      )}
      {...props}
    >
      <img
        src={imageSrc}
        alt={alt}
        className="size-full object-cover transition-transform duration-300 group-hover/artwork:scale-105"
        loading="lazy"
      />
    </div>
  )
}

export const AudioPlayerArtwork = createInterfaceComponent<
  AudioPlayerArtworkProps,
  AudioPlayerArtworkSlots
>(
  {
    name: 'AudioPlayerArtwork',
    category: 'media',
    description: 'Displays artwork or album cover image for the current audio track.',
    version: '1.0.0',
    slots: {
      fallbackIcon: MusicalNoteIcon,
    },
  },
  AudioPlayerArtworkPrimitive
)

/* ==========================================================================
   AudioPlayerTrackInfo
   ========================================================================== */

export interface AudioPlayerTrackInfoSlots {
  /** Wrapper */
  wrapper?: React.ComponentType<HTMLAttributes<HTMLDivElement>>
  /** Artwork display slot */
  artwork?: React.ComponentType<AudioPlayerArtworkProps>
}

export interface AudioPlayerTrackInfoProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional title override */
  title?: string
  /** Optional artist override */
  artist?: string
  /** Optional artwork / cover image URL */
  artwork?: string
  /** Alias for artwork */
  image?: string
  /** Whether to render artwork image thumbnail if available */
  showArtwork?: boolean
  /** Slot overrides map */
  slotProps?: SlotPropsMap<AudioPlayerTrackInfoSlots>
  /** Custom slot components */
  slots?: SlotComponents<AudioPlayerTrackInfoSlots>
}

function AudioPlayerTrackInfoPrimitive({
  title,
  artist,
  artwork: propArtwork,
  image: propImage,
  showArtwork = true,
  className,
  slots,
  slotProps,
  ...props
}: AudioPlayerTrackInfoProps) {
  const activeTrack = useAudioPlayerSlice((s) => s.activeTrack)
  const displayTitle = title ?? activeTrack?.title
  const displayArtist = artist ?? activeTrack?.artist
  const displayArtwork = propArtwork ?? propImage ?? activeTrack?.artwork

  if (!displayTitle && !displayArtist && !displayArtwork) return null

  const infoNode = (
    <div data-slot="audio-track-info" className={cn('flex items-center gap-3.5 min-w-0 flex-1', className)} {...props}>
      {showArtwork && displayArtwork && (
        renderSlot(
          slots?.artwork,
          {
            src: displayArtwork,
            alt: displayTitle || 'Track artwork',
            ...slotProps?.artwork,
          },
          { defaultComponent: AudioPlayerArtwork }
        )
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {displayTitle && (
          <span className="truncate text-sm font-semibold text-fg leading-snug">{displayTitle}</span>
        )}
        {displayArtist && (
          <span className="truncate text-xs text-muted-fg leading-snug mt-0.5">{displayArtist}</span>
        )}
      </div>
    </div>
  )

  return renderSlot(
    slots?.wrapper,
    {
      children: infoNode,
      ...slotProps?.wrapper,
    }
  ) ?? infoNode
}

export const AudioPlayerTrackInfo = createInterfaceComponent<
  AudioPlayerTrackInfoProps,
  AudioPlayerTrackInfoSlots
>(
  {
    name: 'AudioPlayerTrackInfo',
    category: 'media',
    description: 'Displays current active track title, artist and cover artwork.',
    version: '1.0.0',
    slots: {
      wrapper: undefined,
      artwork: AudioPlayerArtwork,
    },
  },
  AudioPlayerTrackInfoPrimitive
)

/* ==========================================================================
   AudioPlayerWaveformScrubber
   ========================================================================== */

export interface AudioPlayerWaveformScrubberSlots {
  /** Scrubber component */
  scrubber?: React.ComponentType<Record<string, unknown>>
}

export interface AudioPlayerWaveformScrubberProps extends HTMLAttributes<HTMLDivElement> {
  /** Sampled waveform amplitudes */
  data?: number[]
  /** Slot overrides map */
  slotProps?: SlotPropsMap<AudioPlayerWaveformScrubberSlots>
  /** Custom slot components */
  slots?: SlotComponents<AudioPlayerWaveformScrubberSlots>
}

function AudioPlayerWaveformScrubberPrimitive({
  data: _data,
  className,
  slots,
  slotProps,
  ...props
}: AudioPlayerWaveformScrubberProps) {
  const defaultScrubber = (
    <AudioTimeline
      className={cn('w-full', className)}
      {...props}
    />
  )

  return renderSlot(
    slots?.scrubber,
    {
      data: _data,
      className,
      children: defaultScrubber,
      ...slotProps?.scrubber,
    }
  ) ?? defaultScrubber
}

export const AudioPlayerWaveformScrubber = createInterfaceComponent<
  AudioPlayerWaveformScrubberProps,
  AudioPlayerWaveformScrubberSlots
>(
  {
    name: 'AudioPlayerWaveformScrubber',
    category: 'media',
    description: 'Audio timeline scrubber synchronized with active playback.',
    version: '1.0.0',
    slots: {
      scrubber: undefined,
    },
  },
  AudioPlayerWaveformScrubberPrimitive
)

/* ==========================================================================
   AudioPlayer (Root)
   ========================================================================== */

export interface AudioPlayerSlots {
  /** Outer container wrapper */
  container?: React.ComponentType<HTMLAttributes<HTMLDivElement>>
  /** Artwork image display slot */
  artwork?: React.ComponentType<AudioPlayerArtworkProps>
  /** Track information display slot */
  trackInfo?: React.ComponentType<AudioPlayerTrackInfoProps>
  /** Timeline scrubber slot */
  timeline?: React.ComponentType<AudioTimelineProps>
  /** Play/pause primary toggle button slot */
  playButton?: React.ComponentType<AudioPlayerPlayButtonProps>
  /** Mute/unmute toggle button slot */
  muteButton?: React.ComponentType<AudioPlayerMuteButtonProps>
  /** Volume level slider slot */
  volumeSlider?: React.ComponentType<AudioPlayerVolumeSliderProps>
  /** Playback speed dropdown or button group slot */
  speedDropdown?: React.ComponentType<AudioPlayerSpeedDropdownProps>
  /** Source file importer slot */
  importer?: React.ComponentType<AudioSourcePickerProps>
  /** Synchronized transcript viewer slot */
  transcript?: React.ComponentType<TranscriptViewerProps>
  /** Footer content slot */
  footer?: React.ComponentType<HTMLAttributes<HTMLDivElement>>
}

export interface AudioPlayerProps<TData = unknown>
  extends Omit<
    HTMLAttributes<HTMLDivElement>,
    'onError' | 'onTimeUpdate' | 'onPlay' | 'onPause' | 'onEnded'
  > {
  /** Direct audio stream URL */
  src?: string
  /** Audio source object or input */
  source?: AudioSourceInput<TData> | null
  /** Active track item configuration */
  track?: AudioTrack<TData> | null
  /** Raw File or Blob audio payload */
  file?: Blob | File | null
  /** Track title text override */
  title?: string
  /** Track artist text override */
  artist?: string
  /** Optional artwork / album cover image URL */
  artwork?: string
  /** Alias for artwork */
  image?: string
  /** Whether to show artwork thumbnail in track info */
  showArtwork?: boolean
  /** Known audio duration in seconds */
  duration?: number
  /** Initial playback volume level (0 to 1) */
  volume?: number
  /** Initial playback speed rate multiplier (e.g., 1.0, 1.25, 1.5, 2.0) */
  playbackRate?: number
  /** Whether playback should automatically loop */
  loop?: boolean
  /** Whether playback should start automatically on mount */
  autoPlay?: boolean
  /** HTMLAudioElement preload mode */
  preload?: 'auto' | 'metadata' | 'none'
  /** CORS cross-origin configuration */
  crossOrigin?: 'anonymous' | 'use-credentials'
  /** Existing AudioPlayerEngine instance to bind */
  engine?: AudioPlayerEngine<TData> | null
  /** Synchronized transcript payload */
  transcript?: TranscriptInput
  /** Audio uploader adapter */
  uploader?: AudioUploader | null
  /** Callback fired on successful upload */
  onUpload?: (result: AudioUploadResult, file: File) => void
  /** Allow drag-and-drop file import */
  allowImport?: boolean
  /** Callback fired when playback starts */
  onPlay?: () => void
  /** Callback fired when playback pauses */
  onPause?: () => void
  /** Callback fired when track finishes */
  onEnded?: () => void
  /** Callback fired when playback time updates */
  onTimeUpdate?: (currentTime: number) => void
  /** Callback fired when active track changes */
  onTrackChange?: (track: AudioTrack<TData> | null) => void
  /** Callback fired on audio engine or loading error */
  onError?: (error: AudioEngineError) => void
  /** Slot overrides map */
  slots?: SlotComponents<AudioPlayerSlots>
  /** Property overrides passed down to injected slots */
  slotProps?: SlotPropsMap<AudioPlayerSlots>
}

function AudioPlayerPrimitive<TData = unknown>({
  src,
  source,
  track,
  file,
  title,
  artist,
  artwork,
  image,
  showArtwork = true,
  duration,
  volume,
  playbackRate,
  loop,
  autoPlay,
  preload,
  crossOrigin,
  engine,
  transcript,
  uploader,
  onUpload,
  allowImport,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onTrackChange,
  onError,
  className,
  children,
  slots,
  slotProps,
  ...props
}: AudioPlayerProps<TData>) {
  const resolvedArtwork = artwork ?? image ?? track?.artwork

  const resolvedSource = useMemo(() => {
    if (source) {
      if (
        typeof source === 'object' &&
        !(
          'stream' in source ||
          source instanceof Blob ||
          (typeof MediaStream !== 'undefined' && source instanceof MediaStream) ||
          (typeof ArrayBuffer !== 'undefined' && source instanceof ArrayBuffer) ||
          (typeof HTMLAudioElement !== 'undefined' && source instanceof HTMLAudioElement)
        )
      ) {
        return {
          ...source,
          ...(title ? { title } : {}),
          ...(artist ? { artist } : {}),
          ...(resolvedArtwork ? { artwork: resolvedArtwork } : {}),
          ...(duration ? { duration } : {}),
        } as AudioSourceInput<TData>
      }
      return source
    }
    if (file) {
      return { file, title, artist, artwork: resolvedArtwork, duration } as AudioSourceInput<TData>
    }
    if (track) {
      return {
        ...track,
        ...(title ? { title } : {}),
        ...(artist ? { artist } : {}),
        ...(resolvedArtwork ? { artwork: resolvedArtwork } : {}),
        ...(duration ? { duration } : {}),
      } as AudioTrack<TData>
    }
    if (src) {
      return { src, title: title || 'Audio track', artist, artwork: resolvedArtwork, duration } as AudioSourceInput<TData>
    }
    return null
  }, [source, file, track, src, title, artist, resolvedArtwork, duration])

  const initialTrackMemo = useMemo(() => {
    if (track) {
      return {
        ...track,
        ...(title ? { title } : {}),
        ...(artist ? { artist } : {}),
        ...(resolvedArtwork ? { artwork: resolvedArtwork } : {}),
        ...(duration ? { duration } : {}),
      } as AudioTrack<TData>
    }
    if (src) {
      return { id: src, src, title: title || 'Audio track', artist, artwork: resolvedArtwork, duration } as AudioTrack<TData>
    }
    return null
  }, [track, src, title, artist, resolvedArtwork, duration])

  const showImporter = allowImport ?? Boolean(uploader || onUpload)

  const innerContent = children ? (
    <div
      data-slot="audio-player"
      className={cn(
        'relative flex w-full flex-col gap-4 rounded-2xl border border-border/40 bg-card/60 p-4 sm:p-5 shadow-sm backdrop-blur-md transition-all',
        className
      )}
      {...props}
    >
      {children}
    </div>
  ) : (
    <div
      data-slot="audio-player"
      className={cn(
        'relative flex w-full flex-col gap-4 rounded-2xl border border-border/40 bg-card/60 p-4 sm:p-5 shadow-sm backdrop-blur-md transition-all',
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        {renderSlot(
          slots?.trackInfo,
          {
            title,
            artist,
            artwork: resolvedArtwork,
            showArtwork,
            ...slotProps?.trackInfo,
          },
          { defaultComponent: AudioPlayerTrackInfo }
        )}
        {showImporter &&
          renderSlot(
            slots?.importer,
            {
            ...slotProps?.importer,
              iconOnly: true,
              uploader,
              onUpload,
              autoUpload: Boolean(uploader),
              onFile: (newFile: File) => engine?.setSource(newFile),
              ...slotProps?.importer,
            },
            { defaultComponent: AudioSourcePicker }
          )}
      </div>

      <div className="flex flex-col gap-1.5 w-full">
        {renderSlot(slots?.timeline, slotProps?.timeline, { defaultComponent: AudioTimeline })}
        <div className="flex items-center justify-between font-mono text-[11px] tabular-nums text-muted-fg">
          <AudioPlayerTime />
          <AudioPlayerDuration />
        </div>
      </div>

      <div className="flex items-center justify-between gap-space-3">
        {renderSlot(slots?.playButton, slotProps?.playButton, { defaultComponent: AudioPlayerPlayButton })}
        <div className="flex items-center gap-1.5">
          {renderSlot(slots?.speedDropdown, slotProps?.speedDropdown, {
            defaultComponent: AudioPlayerSpeedDropdown,
          })}
          {renderSlot(slots?.muteButton, slotProps?.muteButton, {
            defaultComponent: AudioPlayerMuteButton,
          })}
          {renderSlot(
            slots?.volumeSlider,
            { className: 'w-16', ...slotProps?.volumeSlider },
            { defaultComponent: AudioPlayerVolumeSlider }
          )}
        </div>
      </div>

      {transcript &&
        renderSlot(
          slots?.transcript,
          {
            transcript,
            playerEngine: engine,
            showTransport: false,
            className: 'border-0 bg-transparent p-0 shadow-none',
            ...slotProps?.transcript,
          },
          { defaultComponent: TranscriptViewer }
        )}

      {renderSlot(slots?.footer, slotProps?.footer)}
    </div>
  )

  const content = renderSlot(
    slots?.container,
    {
      className: cn(
        'relative flex w-full flex-col gap-4 rounded-2xl border border-border/40 bg-card/60 p-4 sm:p-5 shadow-sm backdrop-blur-md transition-all',
        className
      ),
      children: innerContent,
      ...slotProps?.container,
      ...props,
    }
  ) ?? innerContent

  const contextEngine = useOptionalAudioPlayerEngine()
  const hasOwnSource = Boolean(src || source || track || file || engine)

  if (!hasOwnSource && contextEngine) {
    return content
  }

  return (
    <AudioPlayerProvider
      initialTrack={initialTrackMemo}
      source={resolvedSource}
      engine={engine}
      autoplay={autoPlay}
      volume={volume}
      playbackRate={playbackRate}
      loop={loop}
      preload={preload}
      crossOrigin={crossOrigin}
      onPlay={onPlay}
      onPause={onPause}
      onEnded={onEnded}
      onTimeUpdate={onTimeUpdate}
      onTrackChange={onTrackChange}
      onError={onError}
    >
      {content}
    </AudioPlayerProvider>
  )
}

export const AudioPlayer = createInterfaceComponent<
  AudioPlayerProps<any>,
  AudioPlayerSlots
>(
  {
    name: 'AudioPlayer',
    category: 'media',
    description: 'Universal container and complete workstation for audio playback transport controls and visualizers.',
    version: '1.0.0',
    slots: {
      artwork: AudioPlayerArtwork,
      trackInfo: AudioPlayerTrackInfo,
      playButton: AudioPlayerPlayButton,
      muteButton: AudioPlayerMuteButton,
      volumeSlider: AudioPlayerVolumeSlider,
      speedDropdown: AudioPlayerSpeedDropdown,
      timeline: AudioTimeline,
      container: undefined,
      importer: AudioSourcePicker,
      transcript: TranscriptViewer,
      footer: undefined,
    },
  },
  AudioPlayerPrimitive
)

/* ==========================================================================
   AudioPlayerCard (Pre-composed full card)
   ========================================================================== */

export interface AudioPlayerCardSlots {
  /** Outer player container */
  player?: React.ComponentType<AudioPlayerProps>
  /** Play button */
  playButton?: React.ComponentType<AudioPlayerPlayButtonProps>
}

export interface AudioPlayerCardProps<TData = unknown> {
  /** Active track item */
  track?: AudioTrack<TData> | null
  /** Audio URL */
  src?: string
  /** Audio source object */
  source?: AudioSourceInput<TData> | null
  /** File or Blob payload */
  file?: Blob | File | null
  /** Title text */
  title?: string
  /** Artist text */
  artist?: string
  /** Optional artwork / album cover image URL */
  artwork?: string
  /** Alias for artwork */
  image?: string
  /** Whether to show artwork thumbnail in track info */
  showArtwork?: boolean
  /** Total duration in seconds */
  duration?: number
  /** Style of timeline */
  timelineVariant?: 'slider'
  /** Pre-calculated waveform bars (compatibility) */
  waveformData?: number[]
  /** Show waveform timeline flag (compatibility) */
  showWaveform?: boolean
  /** Synchronized transcript payload */
  transcript?: TranscriptInput
  /** Audio uploader adapter */
  uploader?: AudioUploader | null
  /** Callback fired on successful upload */
  onUpload?: (result: AudioUploadResult, file: File) => void
  /** Allow drag-and-drop file import */
  allowImport?: boolean
  /** Audio engine instance */
  engine?: AudioPlayerEngine<TData> | null
  /** Custom timeline element */
  timeline?: ReactNode
  /** Custom footer node */
  footer?: ReactNode
  /** Children nodes */
  children?: ReactNode
  /** Root class */
  className?: string
  /** Event handlers */
  onPlay?: () => void
  /** Callback invoked when track playback completes */
  onEnded?: () => void
  /** Callback invoked when an error occurs during audio playback or loading */
  onError?: (error: AudioEngineError) => void
  /** Slot overrides map */
  slotProps?: SlotPropsMap<AudioPlayerCardSlots>
  /** Custom slot components */
  slots?: SlotComponents<AudioPlayerCardSlots>
}

function AudioPlayerCardPrimitive<TData = unknown>({
  track,
  src,
  source,
  file,
  title,
  artist,
  artwork,
  image,
  showArtwork = true,
  duration,
  timelineVariant: _timelineVariant,
  waveformData: _waveformData,
  showWaveform: _showWaveform,
  transcript,
  uploader,
  onUpload,
  allowImport,
  engine,
  timeline,
  footer,
  children,
  className,
  onPlay,
  onEnded,
  onError,
  slots,
  slotProps,
  ...props
}: AudioPlayerCardProps<TData>) {
  const resolvedArtwork = artwork ?? image ?? track?.artwork

  const defaultPlayer = (
    <AudioPlayer
      track={track}
      src={src}
      source={source}
      file={file}
      title={title}
      artist={artist}
      artwork={resolvedArtwork}
      showArtwork={showArtwork}
      duration={duration}
      transcript={transcript}
      uploader={uploader}
      onUpload={onUpload}
      allowImport={allowImport}
      engine={engine}
      onPlay={onPlay}
      onEnded={onEnded}
      onError={onError}
      className={className}
      slots={{
        ...(timeline ? { timeline: () => <>{timeline}</> } : {}),
        ...(footer ? { footer: () => <>{footer}</> } : {}),
        ...slots,
      }}
      slotProps={slotProps}
      {...props}
    >
      {children}
    </AudioPlayer>
  )

  return renderSlot(
    slots?.player,
    {
      track,
      src,
      source,
      file,
      title,
      artist,
      artwork: resolvedArtwork,
      image: resolvedArtwork,
      showArtwork,
      duration,
      transcript,
      uploader,
      onUpload,
      allowImport,
      engine: engine as any,
      onPlay,
      onEnded,
      onError,
      className,
      children: defaultPlayer,
      ...slotProps?.player,
    }
  ) ?? defaultPlayer
}

export const AudioPlayerCard = createInterfaceComponent<
  AudioPlayerCardProps<any>,
  AudioPlayerCardSlots
>(
  {
    name: 'AudioPlayerCard',
    category: 'media',
    description: 'Full featured audio player card with timeline, track info, speed, volume and transcript support.',
    version: '1.0.0',
    slots: {
      player: undefined,
      playButton: AudioPlayerPlayButton,
    },
  },
  AudioPlayerCardPrimitive
)

/* ==========================================================================
   Compound AudioPlayer Attachments
   ========================================================================== */

AudioPlayer.Provider = AudioPlayerProvider
AudioPlayer.Artwork = AudioPlayerArtwork
AudioPlayer.PlayButton = AudioPlayerPlayButton
AudioPlayer.Scrubber = AudioPlayerScrubber
AudioPlayer.Time = AudioPlayerTime
AudioPlayer.Duration = AudioPlayerDuration
AudioPlayer.MuteButton = AudioPlayerMuteButton
AudioPlayer.VolumeSlider = AudioPlayerVolumeSlider
AudioPlayer.SpeedButtonGroup = AudioPlayerSpeedButtonGroup
AudioPlayer.SpeedDropdown = AudioPlayerSpeedDropdown
AudioPlayer.TrackInfo = AudioPlayerTrackInfo
AudioPlayer.WaveformScrubber = AudioPlayerWaveformScrubber
AudioPlayer.Timeline = AudioTimeline
AudioPlayer.Card = AudioPlayerCard
AudioPlayerCard.Artwork = AudioPlayerArtwork

