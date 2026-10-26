import { BaseEngine } from '../../../core/engine'
import {
  createBrowserLocalStorageAdapter as createLocalStorageAdapter,
  createPrefixStorageAdapter,
} from '../../../core/storage'
import {
  getActiveContinuousCues,
  getActiveVoicesCount,
  resumeSoundContext,
  stopAllContinuousVoices,
  stopContinuousByCue,
  synthesizeContinuous,
  synthesizeRecipe,
} from './audio-graph'
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
  SoundName,
  SoundPlayOptions,
  SoundRecipe,
  SoundState,
} from './types'

/**
 * Pure TypeScript SoundEngine orchestrating Web Audio interaction sound synthesis,
 * sustained / infinite cues, acoustic variants, declarative DOM bindings, and persistent audio preferences.
 */
export class SoundEngine extends BaseEngine<SoundState> {
  private customRegistry: Map<string, SoundCueDefinition> = new Map()
  private continuousHandles: Map<string, SoundHandle> = new Map()
  private cleanupBinding?: () => void

  constructor(options: SoundEngineOptions = {}) {
    const {
      defaultVolume = 0.7,
      defaultEnabled = true,
      defaultMuted = false,
      storageAdapter = createLocalStorageAdapter(),
      storageKey = 'config',
      customRecipes = {},
      autoBind = true,
    } = options

    super({
      enabled: defaultEnabled,
      volume: Math.max(0, Math.min(1, defaultVolume)),
      isMuted: defaultMuted,
      activeVoicesCount: 0,
      activeContinuousCount: 0,
      activeContinuousCues: [],
    })

    // 1. Initialize custom recipes
    Object.entries(customRecipes).forEach(([cue, defOrRecipe]) => {
      if ('default' in defOrRecipe) {
        this.customRegistry.set(cue, defOrRecipe as SoundCueDefinition)
      } else {
        this.customRegistry.set(cue, { default: defOrRecipe as SoundRecipe })
      }
    })

    // 2. Attach persistent storage binding (Rule ENG2)
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

    // 3. Auto-bind declarative DOM listeners if enabled
    if (autoBind && typeof document !== 'undefined') {
      this.cleanupBinding = bindDeclarativeSounds(this)
    }
  }

  /**
   * Plays an interactive sound cue with optional variant and context adaptation.
   */
  public play = (cue: string = 'tap', options?: SoundPlayOptions): void => {
    if (!this.state.enabled || this.state.isMuted) return
    if (!isSoundCue(cue)) return

    const { cue: parsedCue, variant: parsedVariant } = parseCueIdentifier(cue)
    const effectiveVariant = options?.variant ?? parsedVariant

    const recipe =
      getSoundRecipe(parsedCue, effectiveVariant, Object.fromEntries(this.customRegistry)) ??
      getSoundRecipe(parsedCue, effectiveVariant)

    if (!recipe) return

    const emphasis = options?.emphasis ?? 'normal'
    const playVolume = Math.max(0, Math.min(1, this.state.volume * (options?.volume ?? 1)))

    if (playVolume <= 0) return

    const adapted = adaptRecipe(recipe, emphasis, options?.context)

    const success = synthesizeRecipe(adapted, playVolume, (voiceCount) => {
      this.syncActiveVoices(voiceCount)
    })

    if (success) {
      const lastPlayed = {
        cue: parsedCue,
        variant: effectiveVariant,
        emphasis,
        volume: playVolume,
        timestamp: Date.now(),
      }

      this.setState({ lastPlayed })
      this.emit('sound:play', lastPlayed)
    }
  }

  /**
   * Starts a continuous / infinite / sustained audio loop that plays indefinitely
   * until stopped or until the optional TTL duration expires.
   *
   * @param cue Sound cue name (e.g. 'loading-hum', 'radar-pulse', 'beam-laser', 'focus-noise').
   * @param options Optional configuration including TTL, custom release fade-out, volume, and variant.
   * @returns A SoundHandle with `.stop()` and `.setVolume()` methods, or null if audio is disabled.
   */
  public start = (
    cue: string = 'loading-hum',
    options?: SoundContinuousOptions
  ): SoundHandle | null => {
    if (!this.state.enabled || this.state.isMuted) return null
    if (!isSoundCue(cue)) return null

    const { cue: parsedCue, variant: parsedVariant } = parseCueIdentifier(cue)
    const effectiveVariant = options?.variant ?? parsedVariant

    // Stop existing instance of this continuous cue so variants don't stack/clash
    this.stop(parsedCue, 0.06)

    const recipe =
      getSoundRecipe(parsedCue, effectiveVariant, Object.fromEntries(this.customRegistry)) ??
      getSoundRecipe(parsedCue, effectiveVariant)

    if (!recipe) return null

    const emphasis = options?.emphasis ?? 'normal'
    const playVolume = Math.max(0, Math.min(1, this.state.volume * (options?.volume ?? 1)))

    if (playVolume <= 0) return null

    const adapted = adaptRecipe(recipe, emphasis, options?.context)

    const originalOnEnded = options?.onEnded

    const handle = synthesizeContinuous(
      parsedCue,
      adapted,
      playVolume,
      {
        ...options,
        variant: effectiveVariant,
        onEnded: () => {
          this.continuousHandles.delete(handle?.id ?? '')
          this.syncActiveContinuous()
          originalOnEnded?.()
          this.emit('sound:continuousStop', { id: handle?.id ?? '', cue: parsedCue, timestamp: Date.now() })
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
        volume: playVolume,
        ttl: options?.ttl,
        timestamp: Date.now(),
      })
    }

    return handle
  }

  /**
   * Alias for start() method to trigger a continuous loop.
   */
  public playLoop = (
    cue: string = 'loading-hum',
    options?: SoundContinuousOptions
  ): SoundHandle | null => {
    return this.start(cue, options)
  }

  /**
   * Stops a continuous sound voice by handle reference, cue name, or voice ID.
   *
   * @param cueOrHandle Optional SoundHandle instance or cue name to stop.
   * @param releaseDuration Optional custom fade-out duration in seconds.
   */
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
      stopContinuousByCue(parsedCue, releaseDuration)
      this.syncActiveContinuous()
    }
  }

  /**
   * Stops all currently playing continuous audio voices gracefully with release fade-out.
   */
  public stopAll = (releaseDuration?: number): void => {
    for (const handle of this.continuousHandles.values()) {
      handle.stop(releaseDuration)
    }
    this.continuousHandles.clear()
    stopAllContinuousVoices(releaseDuration)
    this.syncActiveContinuous()
  }

  /**
   * Returns whether a continuous cue or voice is currently synthesizing.
   */
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
    const activeCues = getActiveContinuousCues()
    this.setState({
      activeContinuousCount: activeCues.length,
      activeContinuousCues: activeCues,
    })
  }

  /**
   * Sets the global master volume multiplier (0.0 to 1.0).
   */
  public setVolume = (volume: number): void => {
    const clamped = Math.max(0, Math.min(1, Number.isFinite(volume) ? volume : 1))
    this.setState({ volume: clamped })
    for (const handle of this.continuousHandles.values()) {
      handle.setVolume(clamped)
    }
    this.emit('sound:volumeChange', { volume: clamped, isMuted: this.state.isMuted })
  }

  /**
   * Enables or disables sound synthesis globally.
   */
  public setEnabled = (enabled: boolean): void => {
    const isEnabled = Boolean(enabled)
    this.setState({ enabled: isEnabled })
    if (!isEnabled) {
      this.stopAll(0.05)
    }
    this.emit('sound:stateChange', { enabled: isEnabled })
  }

  /**
   * Mutes or unmutes sound playback without changing the stored volume level.
   */
  public setMuted = (isMuted: boolean): void => {
    const muted = Boolean(isMuted)
    this.setState({ isMuted: muted })
    if (muted) {
      this.stopAll(0.05)
    }
    this.emit('sound:volumeChange', { volume: this.state.volume, isMuted: muted })
  }

  /**
   * Toggles mute state on/off.
   */
  public toggleMute = (): void => {
    this.setMuted(!this.state.isMuted)
  }

  /**
   * Registers or overrides a sound recipe or variant.
   */
  public registerRecipe = (cue: string, recipe: SoundRecipe, variant?: string): void => {
    const existing = this.customRegistry.get(cue) ?? SOUND_REGISTRY[cue] ?? { default: recipe }
    if (variant) {
      existing.variants = { ...existing.variants, [variant]: recipe }
    } else {
      existing.default = recipe
    }
    this.customRegistry.set(cue, existing)
  }

  /**
   * Registers a full sound cue definition with default recipe and variants.
   */
  public registerCue = (cue: string, definition: SoundCueDefinition): void => {
    this.customRegistry.set(cue, { ...definition })
  }

  /**
   * Returns list of all available sound cue names.
   */
  public getAvailableCues = (): readonly string[] => {
    return Array.from(new Set([...ALL_SOUND_NAMES, ...this.customRegistry.keys()]))
  }

  /**
   * Returns available variants for a specific cue.
   */
  public getVariants = (cue: string): string[] => {
    return getCueVariants(cue, Object.fromEntries(this.customRegistry))
  }

  /**
   * Resumes underlying Web Audio context on user interaction.
   */
  public resumeAudio = (): Promise<void> => {
    return resumeSoundContext()
  }

  /**
   * Wires up declarative data-sound-* interaction bindings to a given root element.
   */
  public bind = (root?: ParentNode): (() => void) => {
    return bindDeclarativeSounds(this, root)
  }

  /**
   * Cleans up all listeners, storage bindings, continuous voices, and DOM delegated listeners.
   */
  public override destroy(): void {
    this.stopAll(0.02)
    super.destroy()
    this.cleanupBinding?.()
  }
}

/**
 * Factory for creating a SoundEngine instance.
 */
export function createSoundEngine(options: SoundEngineOptions = {}): SoundEngine {
  return new SoundEngine(options)
}

