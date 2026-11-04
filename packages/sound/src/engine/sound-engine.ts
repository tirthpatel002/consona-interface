import { BaseEngine } from '@consona/interface-core'
import {
  createBrowserLocalStorageAdapter as createLocalStorageAdapter,
  createPrefixStorageAdapter,
} from '@consona/interface-core'
import { createSoundAudioGraph, type SoundAudioGraph } from './audio-graph'
import { bindDeclarativeSounds } from './bind'
import {
  ALL_SOUND_NAMES,
  SOUND_REGISTRY,
  adaptRecipe,
  getCueVariants,
  getSoundRecipe,
  isSoundCue,
  parseCueIdentifier,
} from './recipes'
import type {
  SoundContinuousOptions,
  SoundCueDefinition,
  SoundEngineOptions,
  SoundHandle,
  SoundPlayOptions,
  SoundRecipe,
  SoundState,
} from './types'

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

function cloneCueDefinition(def: SoundCueDefinition): SoundCueDefinition {
  return {
    default: def.default,
    variants: def.variants ? { ...def.variants } : undefined,
  }
}

/**
 * Pure TypeScript SoundEngine orchestrating Web Audio interaction sound synthesis,
 * sustained / infinite cues, acoustic variants, declarative DOM bindings, and persistent audio preferences.
 */
export class SoundEngine extends BaseEngine<SoundState> {
  private customRegistry: Map<string, SoundCueDefinition> = new Map()
  private continuousHandles: Map<string, SoundHandle> = new Map()
  private cleanupBinding?: () => void
  private extraBindings = new Set<() => void>()
  private graph: SoundAudioGraph
  private respectReducedMotion: boolean

  constructor(options: SoundEngineOptions = {}) {
    const {
      defaultVolume = 0.7,
      defaultEnabled = true,
      defaultMuted = false,
      storageAdapter,
      storageKey = 'config',
      customRecipes = {},
      autoBind = true,
      respectReducedMotion = true,
    } = options

    super({
      enabled: defaultEnabled,
      volume: Math.max(0, Math.min(1, defaultVolume)),
      isMuted: defaultMuted,
      activeVoicesCount: 0,
      activeContinuousCount: 0,
      activeContinuousCues: [],
    })

    this.respectReducedMotion = respectReducedMotion
    this.graph = createSoundAudioGraph({
      getMasterVolume: () => this.state.volume,
    })

    Object.entries(customRecipes).forEach(([cue, defOrRecipe]) => {
      if (defOrRecipe && typeof defOrRecipe === 'object' && 'default' in defOrRecipe) {
        this.customRegistry.set(cue, cloneCueDefinition(defOrRecipe as SoundCueDefinition))
      } else {
        this.customRegistry.set(cue, { default: defOrRecipe as SoundRecipe })
      }
    })

    // Opt-in persistence: only when a storage adapter is provided.
    if (storageAdapter) {
      const prefixAdapter = createPrefixStorageAdapter('consona:sound:', storageAdapter)
      this.attachStorage({
        adapter: prefixAdapter,
        key: storageKey,
        stateKeys: ['enabled', 'volume', 'isMuted'],
        serialize: (s) => JSON.stringify(s),
        deserialize: (raw) => {
          try {
            return JSON.parse(raw)
          } catch {
            return {}
          }
        },
      })
    }

    if (autoBind && typeof document !== 'undefined') {
      this.cleanupBinding = bindDeclarativeSounds(this)
    }
  }

  private customRegistryRecord(): Record<string, SoundCueDefinition> {
    return Object.fromEntries(this.customRegistry)
  }

  private shouldSuppressPlayback(): boolean {
    return this.respectReducedMotion && prefersReducedMotion()
  }

  private resolveCue(cue: string): boolean {
    return isSoundCue(cue, this.customRegistryRecord())
  }

  /**
   * Plays an interactive sound cue with optional variant and context adaptation.
   */
  public play = (cue: string = 'tap', options?: SoundPlayOptions): void => {
    if (!this.state.enabled || this.state.isMuted) return
    if (this.shouldSuppressPlayback()) return
    if (!this.resolveCue(cue)) return

    const { cue: parsedCue, variant: parsedVariant } = parseCueIdentifier(cue)
    const effectiveVariant = options?.variant ?? parsedVariant
    const custom = this.customRegistryRecord()

    const recipe =
      getSoundRecipe(parsedCue, effectiveVariant, custom) ??
      getSoundRecipe(parsedCue, effectiveVariant)

    if (!recipe) return

    const emphasis = options?.emphasis ?? 'normal'
    const instanceVolume = Math.max(0, Math.min(1, options?.volume ?? 1))
    if (instanceVolume <= 0 || this.state.volume <= 0) return

    const adapted = adaptRecipe(recipe, emphasis, options?.context)
    const playVolume = this.state.volume * instanceVolume

    this.graph.synthesizeRecipe(
      adapted,
      instanceVolume,
      (voiceCount) => {
        this.syncActiveVoices(voiceCount)
      },
      () => {
        const lastPlayed = {
          cue: parsedCue,
          variant: effectiveVariant,
          emphasis,
          volume: playVolume,
          timestamp: Date.now(),
        }
        this.setState({ lastPlayed })
        this.emit('sound:play', lastPlayed)
      },
      options?.pan
    )
  }

  /**
   * Starts a continuous / infinite / sustained audio loop that plays indefinitely
   * until stopped or until the optional TTL duration expires.
   */
  public start = (
    cue: string = 'loading-hum',
    options?: SoundContinuousOptions
  ): SoundHandle | null => {
    if (!this.state.enabled || this.state.isMuted) return null
    if (this.shouldSuppressPlayback()) return null
    if (!this.resolveCue(cue)) return null

    const { cue: parsedCue, variant: parsedVariant } = parseCueIdentifier(cue)
    const effectiveVariant = options?.variant ?? parsedVariant
    const custom = this.customRegistryRecord()

    this.stop(parsedCue, 0.06)

    const recipe =
      getSoundRecipe(parsedCue, effectiveVariant, custom) ??
      getSoundRecipe(parsedCue, effectiveVariant)

    if (!recipe) return null

    const emphasis = options?.emphasis ?? 'normal'
    const instanceVolume = Math.max(0, Math.min(1, options?.volume ?? 1))
    if (instanceVolume <= 0 || this.state.volume <= 0) return null

    const adapted = adaptRecipe(recipe, emphasis, options?.context)
    const originalOnEnded = options?.onEnded

    const handle = this.graph.synthesizeContinuous(
      parsedCue,
      adapted,
      instanceVolume,
      {
        ...options,
        variant: effectiveVariant,
        onEnded: () => {
          this.continuousHandles.delete(handle?.id ?? '')
          this.syncActiveContinuous()
          originalOnEnded?.()
          this.emit('sound:continuousStop', {
            id: handle?.id ?? '',
            cue: parsedCue,
            timestamp: Date.now(),
          })
        },
      },
      (voiceCount) => {
        this.syncActiveVoices(voiceCount)
      }
    )

    if (handle) {
      this.continuousHandles.set(handle.id, handle)
      this.syncActiveContinuous()

      this.emit('sound:continuousStart', {
        id: handle.id,
        cue: parsedCue,
        variant: effectiveVariant,
        volume: this.state.volume * instanceVolume,
        ttl: options?.ttl,
        timestamp: Date.now(),
      })
    }

    return handle
  }

  /** Alias for start(). */
  public playLoop = (
    cue: string = 'loading-hum',
    options?: SoundContinuousOptions
  ): SoundHandle | null => {
    return this.start(cue, options)
  }

  public stop = (cueOrHandle?: string | SoundHandle, releaseDuration?: number): void => {
    if (!cueOrHandle) {
      this.stopAll(releaseDuration)
      return
    }

    if (typeof cueOrHandle === 'object' && 'stop' in cueOrHandle) {
      cueOrHandle.stop(releaseDuration)
      this.continuousHandles.delete(cueOrHandle.id)
      this.syncActiveContinuous()
      return
    }

    if (typeof cueOrHandle === 'string') {
      const { cue: parsedCue } = parseCueIdentifier(cueOrHandle)
      for (const [id, handle] of this.continuousHandles.entries()) {
        if (handle.cue === parsedCue || id === cueOrHandle) {
          handle.stop(releaseDuration)
          this.continuousHandles.delete(id)
        }
      }
      this.graph.stopContinuousByCue(parsedCue, releaseDuration)
      this.syncActiveContinuous()
    }
  }

  public stopAll = (releaseDuration?: number): void => {
    for (const handle of this.continuousHandles.values()) {
      handle.stop(releaseDuration)
    }
    this.continuousHandles.clear()
    this.graph.stopAllContinuousVoices(releaseDuration)
    this.syncActiveContinuous()
  }

  public isContinuousPlaying = (cue: string, variant?: string): boolean => {
    const { cue: parsedCue, variant: parsedVariant } = parseCueIdentifier(cue)
    const targetVariant = variant ?? parsedVariant
    for (const handle of this.continuousHandles.values()) {
      if (handle.cue === parsedCue && handle.isPlaying) {
        if (targetVariant !== undefined) {
          return (handle.variant ?? 'default') === (targetVariant ?? 'default')
        }
        return true
      }
    }
    return false
  }

  private syncActiveVoices = (voiceCount: number): void => {
    this.setState({ activeVoicesCount: voiceCount })
  }

  private syncActiveContinuous = (): void => {
    const activeCues = this.graph.getActiveContinuousCues()
    this.setState({
      activeContinuousCount: activeCues.length,
      activeContinuousCues: activeCues,
    })
  }

  public setVolume = (volume: number): void => {
    const clamped = Math.max(0, Math.min(1, Number.isFinite(volume) ? volume : 1))
    this.setState({ volume: clamped })
    this.graph.updateMasterVolume(clamped)
    this.emit('sound:volumeChange', { volume: clamped, isMuted: this.state.isMuted })
  }

  public setEnabled = (enabled: boolean): void => {
    const isEnabled = Boolean(enabled)
    this.setState({ enabled: isEnabled })
    if (!isEnabled) {
      this.stopAll(0.05)
    }
    this.emit('sound:stateChange', { enabled: isEnabled })
  }

  public setMuted = (isMuted: boolean): void => {
    const muted = Boolean(isMuted)
    this.setState({ isMuted: muted })
    if (muted) {
      this.stopAll(0.05)
    }
    this.emit('sound:volumeChange', { volume: this.state.volume, isMuted: muted })
  }

  public toggleMute = (): void => {
    this.setMuted(!this.state.isMuted)
  }

  /**
   * Registers or overrides a sound recipe or variant without mutating the built-in palette.
   */
  public registerRecipe = (cue: string, recipe: SoundRecipe, variant?: string): void => {
    const existingCustom = this.customRegistry.get(cue)
    const base = existingCustom
      ? cloneCueDefinition(existingCustom)
      : SOUND_REGISTRY[cue]
        ? cloneCueDefinition(SOUND_REGISTRY[cue])
        : { default: recipe }

    if (variant) {
      base.variants = { ...base.variants, [variant]: recipe }
    } else {
      base.default = recipe
    }
    this.customRegistry.set(cue, base)
  }

  public registerCue = (cue: string, definition: SoundCueDefinition): void => {
    this.customRegistry.set(cue, cloneCueDefinition(definition))
  }

  public getAvailableCues = (): readonly string[] => {
    return Array.from(new Set([...ALL_SOUND_NAMES, ...this.customRegistry.keys()]))
  }

  public getVariants = (cue: string): string[] => {
    return getCueVariants(cue, this.customRegistryRecord())
  }

  public resumeAudio = (): Promise<void> => {
    return this.graph.resume()
  }

  public bind = (root?: ParentNode): (() => void) => {
    const unbind = bindDeclarativeSounds(this, root)
    this.extraBindings.add(unbind)
    return () => {
      unbind()
      this.extraBindings.delete(unbind)
    }
  }

  public override destroy(): void {
    this.stopAll(0.02)
    this.cleanupBinding?.()
    this.cleanupBinding = undefined
    for (const unbind of this.extraBindings) {
      try {
        unbind()
      } catch {
        /* ignore */
      }
    }
    this.extraBindings.clear()
    this.graph.destroy()
    super.destroy()
  }
}

/**
 * Factory for creating a SoundEngine instance.
 * Pass `storageAdapter` (e.g. `createLocalStorageAdapter()`) to persist preferences.
 */
export function createSoundEngine(options: SoundEngineOptions = {}): SoundEngine {
  return new SoundEngine(options)
}

export { createLocalStorageAdapter }
