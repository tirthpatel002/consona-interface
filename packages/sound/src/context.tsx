import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react'
import { createSoundEngine, SoundEngine } from './engine/sound-engine'
import type {
  SoundContinuousOptions,
  SoundCueDefinition,
  SoundEngineOptions,
  SoundHandle,
  SoundName,
  SoundPlayOptions,
  SoundRecipe,
  SoundState,
} from './engine/types'

export interface SoundContextValue extends SoundState {
  /** Underlying framework-agnostic SoundEngine instance. */
  engine: SoundEngine
  /** Plays an interactive sound cue with optional variant, volume, emphasis, and context overrides. */
  play: (cue?: string, options?: SoundPlayOptions) => void
  /** Starts a continuous / infinite / sustained audio loop that plays until stopped or TTL expires. */
  start: (cue?: string, options?: SoundContinuousOptions) => SoundHandle | null
  /** Alias for start() to trigger a continuous loop. */
  playLoop: (cue?: string, options?: SoundContinuousOptions) => SoundHandle | null
  /** Stops a continuous sound voice by cue name or SoundHandle. */
  stop: (cueOrHandle?: string | SoundHandle, releaseDuration?: number) => void
  /** Stops all active continuous sound voices. */
  stopAll: (releaseDuration?: number) => void
  /** Returns whether a continuous cue is currently active. */
  isContinuousPlaying: (cue: string, variant?: string) => boolean
  /** Sets the global master volume (0.0 to 1.0). */
  setVolume: (volume: number) => void
  /** Enables or disables sound synthesis globally. */
  setEnabled: (enabled: boolean) => void
  /** Sets mute state. */
  setMuted: (isMuted: boolean) => void
  /** Toggles mute state on/off. */
  toggleMute: () => void
  /** Registers or overrides a custom sound recipe or variant. */
  registerRecipe: (cue: string, recipe: SoundRecipe, variant?: string) => void
  /** Registers a full sound cue definition with default recipe and variants. */
  registerCue: (cue: string, definition: SoundCueDefinition) => void
  /** Returns list of all available sound cue names. */
  getAvailableCues: () => readonly string[]
  /** Returns available variants for a given cue. */
  getVariants: (cue: string) => string[]
  /** Resumes Web Audio context on user gesture. */
  resumeAudio: () => Promise<void>
}

export const SoundContext = createContext<SoundContextValue | null>(null)

/**
 * Access the active Sound Engine context and reactive state (Type C Engine Hook).
 */
export function useSound(): SoundContextValue {
  const ctx = useContext(SoundContext)
  if (!ctx) {
    throw new Error('useSound must be used within a <SoundProvider>')
  }
  return ctx
}

export interface SoundProviderProps extends SoundEngineOptions {
  /** Pre-configured or external SoundEngine instance. */
  engine?: SoundEngine
  /** Additional engine options object. */
  options?: SoundEngineOptions & Record<string, unknown>
  /** React children nodes. */
  children: React.ReactNode
}

/**
 * High-performance Web Audio interaction sound synthesis provider.
 */
export function SoundProvider({
  engine: propEngine,
  options,
  defaultVolume = 0.7,
  defaultEnabled = true,
  defaultMuted = false,
  storageAdapter,
  storageKey,
  customRecipes,
  autoBind = true,
  children,
}: SoundProviderProps) {
  const engineRef = useRef<SoundEngine | null>(null)

  if (!engineRef.current) {
    if (propEngine) {
      engineRef.current = propEngine
    } else {
      engineRef.current = createSoundEngine({
        defaultVolume: options?.defaultVolume ?? defaultVolume,
        defaultEnabled: options?.defaultEnabled ?? defaultEnabled,
        defaultMuted: options?.defaultMuted ?? defaultMuted,
        storageAdapter: options?.storageAdapter ?? storageAdapter,
        storageKey: options?.storageKey ?? storageKey,
        customRecipes: options?.customRecipes ?? customRecipes,
        autoBind: options?.autoBind ?? autoBind,
      })
    }
  }

  const engine = engineRef.current!

  const engineState = useSyncExternalStore(
    (callback) => engine.subscribe(callback),
    () => engine.getState(),
    () => engine.getState()
  )

  useEffect(() => {
    return () => {
      if (!propEngine) {
        engineRef.current?.destroy()
        engineRef.current = null
      }
    }
  }, [propEngine])

  const contextValue: SoundContextValue = useMemo(() => {
    return {
      engine,
      enabled: engineState.enabled,
      volume: engineState.volume,
      isMuted: engineState.isMuted,
      activeVoicesCount: engineState.activeVoicesCount,
      activeContinuousCount: engineState.activeContinuousCount,
      activeContinuousCues: engineState.activeContinuousCues,
      lastPlayed: engineState.lastPlayed,

      play: (cue, opts) => engine.play(cue, opts),
      start: (cue, opts) => engine.start(cue, opts),
      playLoop: (cue, opts) => engine.playLoop(cue, opts),
      stop: (c, r) => engine.stop(c, r),
      stopAll: (r) => engine.stopAll(r),
      isContinuousPlaying: (c, v) => engine.isContinuousPlaying(c, v),
      setVolume: (v) => engine.setVolume(v),
      setEnabled: (e) => engine.setEnabled(e),
      setMuted: (m) => engine.setMuted(m),
      toggleMute: () => engine.toggleMute(),
      registerRecipe: (c, r, v) => engine.registerRecipe(c, r, v),
      registerCue: (c, d) => engine.registerCue(c, d),
      getAvailableCues: () => engine.getAvailableCues(),
      getVariants: (c) => engine.getVariants(c),
      resumeAudio: () => engine.resumeAudio(),
    }
  }, [engine, engineState])

  return <SoundContext.Provider value={contextValue}>{children}</SoundContext.Provider>
}

