import type { StorageAdapter } from '../../../core/storage'

/**
 * Low Frequency Oscillator (LFO) modulation configuration for dynamic sound synthesis.
 */
export interface LfoConfig {
  /** Modulation rate frequency in Hertz (e.g. 0.1Hz to 20Hz). */
  rate: number
  /** Modulation depth intensity. */
  depth: number
  /** Target parameter to modulate ('frequency' | 'gain' | 'filter'). */
  target: 'frequency' | 'gain' | 'filter'
  /** Waveform shape of the LFO oscillator (default 'sine'). */
  waveform?: OscillatorType
}

/**
 * Base timing and volume envelope for an individual synthesis layer.
 */
export interface BaseSoundLayer {
  /** Offset in seconds after sound trigger before this layer starts. */
  offset?: number
  /** Fade-in attack duration in seconds. */
  attack: number
  /** Fade-out decay duration in seconds starting immediately after attack. */
  decay: number
  /** Peak volume gain level reached at the culmination of the attack ramp (0.0 to 1.0). */
  peak: number
}

/**
 * Tone synthesis layer utilizing an oscillator node with frequency, detune, and pitch glide capabilities.
 */
export interface ToneLayer extends BaseSoundLayer {
  kind: 'tone'
  /** Oscillator waveform profile. */
  waveform: OscillatorType
  /** Base frequency in Hertz. */
  frequency: number
  /** Fine pitch detune offset in cents (100 cents = 1 semitone). */
  detune?: number
  /** Target frequency in Hertz for dynamic pitch gliding. */
  glideTo?: number
  /** Glide transition time in seconds. Defaults to (attack + decay). */
  glideTime?: number
}

/**
 * Noise synthesis layer utilizing a procedural white noise audio buffer with biquad filtering.
 */
export interface NoiseLayer extends BaseSoundLayer {
  kind: 'noise'
  /** Biquad filter type for sculpting noise timbre. */
  filterType: BiquadFilterType
  /** Filter cutoff / center frequency in Hertz. */
  filterFrequency: number
  /** Quality factor (resonance / sharpness) of the filter. */
  filterQ?: number
}

/**
 * Sustained tone synthesis layer with hold sustain level, dynamic release fade-out, and optional LFO modulation.
 */
export interface SustainedToneLayer {
  kind: 'sustained-tone'
  /** Offset in seconds before voice begins. */
  offset?: number
  /** Oscillator waveform profile. */
  waveform: OscillatorType
  /** Base frequency in Hertz. */
  frequency: number
  /** Fine pitch detune offset in cents. */
  detune?: number
  /** Dynamic frequency glide target in Hertz upon initialization. */
  glideTo?: number
  glideTime?: number
  /** Fade-in attack duration in seconds. */
  attack: number
  /** Sustain volume gain level maintained while active (0.0 to 1.0). */
  sustain: number
  /** Fade-out release duration in seconds when stop is triggered. */
  release: number
  /** Optional LFO for dynamic vibrato, tremolo, or filter breathing. */
  lfo?: LfoConfig
}

/**
 * Sustained noise synthesis layer utilizing looped procedural noise with biquad filter and release envelope.
 */
export interface SustainedNoiseLayer {
  kind: 'sustained-noise'
  /** Offset in seconds before voice begins. */
  offset?: number
  /** Biquad filter type for sculpting continuous noise. */
  filterType: BiquadFilterType
  /** Filter cutoff / center frequency in Hertz. */
  filterFrequency: number
  /** Quality factor of the filter. */
  filterQ?: number
  /** Fade-in attack duration in seconds. */
  attack: number
  /** Sustain volume gain level maintained while active (0.0 to 1.0). */
  sustain: number
  /** Fade-out release duration in seconds when stop is triggered. */
  release: number
  /** Optional LFO for dynamic filter sweeps. */
  lfo?: LfoConfig
}

/**
 * Periodic pulse loop layer generating rhythmic acoustic pulses at continuous intervals.
 */
export interface PulseLoopLayer {
  kind: 'pulse-loop'
  /** Offset in seconds before first cycle begins. */
  offset?: number
  /** Interval in seconds between repeated acoustic pulses. */
  interval: number
  /** Single-pulse sound layer definition or array of layers to synthesize on each pulse. */
  pulse: ToneLayer | NoiseLayer | (ToneLayer | NoiseLayer)[]
  /** Optional random timing jitter multiplier (0.0 to 0.5). */
  jitter?: number
  /** Fade-in attack duration in seconds for master loop gain. */
  attack?: number
  /** Fade-out release duration in seconds when stop is triggered. */
  release?: number
}

/**
 * Union of audio synthesis layers.
 */
export type SoundLayer =
  | ToneLayer
  | NoiseLayer
  | SustainedToneLayer
  | SustainedNoiseLayer
  | PulseLoopLayer

/**
 * Feedback delay network (FDN) shimmer tail configuration providing spatial ambience.
 */
export interface Shimmer {
  /** Delay time in seconds. */
  delay: number
  /** Feedback multiplication coefficient (0.0 to 0.95). */
  feedback: number
  /** Wet signal gain balance. */
  wet: number
  /** Lowpass damping filter cutoff frequency in Hertz. */
  lowpass: number
}

/**
 * Complete procedural sound synthesis recipe.
 */
export interface SoundRecipe {
  /** Overall output gain multiplier for this recipe. */
  masterGain: number
  /** Array of layered oscillator and noise generators. */
  layers: SoundLayer[]
  /** Optional acoustic reverberant shimmer tail. */
  shimmer?: Shimmer
  /** Default Time-to-Live in milliseconds for continuous playback (undefined = infinite until stop). */
  defaultTtlMs?: number
  /** Default release fade-out time in seconds when stopped. */
  defaultRelease?: number
}

/**
 * Canonical 9 semantic interaction cue names.
 */
export type CanonicalSoundName =
  | 'tap'
  | 'type'
  | 'select'
  | 'toggle'
  | 'open'
  | 'close'
  | 'success'
  | 'error'
  | 'navigate'
  | 'notification'

/**
 * Expressive sound cue names.
 */
export type ExpressiveSoundName =
  | 'bloom'
  | 'droplet'
  | 'chord'
  | 'lock'
  | 'laser'
  | 'ready'
  | 'scan'
  | 'arrival'
  | 'whoosh'
  | 'press'
  | 'release'

/**
 * Long, infinite, sustained, and looping continuous sound cue names.
 */
export type ContinuousSoundName =
  | 'loading-hum'
  | 'radar-pulse'
  | 'beam-laser'
  | 'focus-noise'
  | 'alarm-beacon'
  | 'ticker-stream'
  | 'wind-ambient'
  | 'heartbeat'

/**
 * All valid base sound cue identifiers.
 */
export type SoundName =
  | CanonicalSoundName
  | ExpressiveSoundName
  | ContinuousSoundName
  | (string & {})

/**
 * Sound emphasis intensity level.
 */
export type SoundEmphasis = 'subtle' | 'normal' | 'strong'

/**
 * Input method / pointer modality.
 */
export type SoundInputMethod = 'mouse' | 'touch' | 'pen' | 'keyboard' | 'programmatic'

/**
 * Key role classification for typing sound adaptation.
 */
export type SoundKeyRole =
  | 'printable'
  | 'space'
  | 'enter'
  | 'backspace'
  | 'delete'
  | 'navigation'
  | 'modifier'

/**
 * Selection movement direction.
 */
export type SoundSelectionDirection = 'up' | 'down' | 'forward' | 'backward' | 'none'

/**
 * Contextual metadata for adaptive sound synthesis.
 */
export interface AdaptiveSoundContext {
  /** User input modality. */
  inputMethod?: SoundInputMethod
  /** Key role during typing interactions. */
  keyRole?: SoundKeyRole
  /** Direction of list/menu selection. */
  direction?: SoundSelectionDirection
  /** State value for toggle cues ('on' | 'off' | boolean). */
  toggleState?: 'on' | 'off' | boolean
  /** Time delta in milliseconds since the previous same-cue execution. */
  cadenceDeltaMs?: number
  /** Rapid repetition counter. */
  repetitionCount?: number
}

/**
 * Sound cue definition holding default recipe and optional acoustic variants.
 */
export interface SoundCueDefinition {
  /** Default recipe for this cue. */
  default: SoundRecipe
  /** Named stylistic / mechanical variants for this cue. */
  variants?: Record<string, SoundRecipe>
}

/**
 * Playback invocation options.
 */
export interface SoundPlayOptions {
  /** Custom volume level multiplier for this specific playback instance (0.0 to 1.0). */
  volume?: number
  /** Emphasis dynamic intensity scaling ('subtle' | 'normal' | 'strong'). */
  emphasis?: SoundEmphasis
  /** Specific variant for this cue (e.g. 'mechanical', 'soft', 'pluck', etc.). */
  variant?: string
  /** Inferred or explicit interaction context for adaptive synthesis. */
  context?: AdaptiveSoundContext
}

/**
 * Options for continuous / infinite / looping sound playback.
 */
export interface SoundContinuousOptions extends SoundPlayOptions {
  /** Time-to-Live in milliseconds. Automatically fades out and stops after this duration. */
  ttl?: number
  /** Custom release fade-out duration in seconds overriding recipe defaults. */
  release?: number
  /** Initial stereo panning position (-1.0 to +1.0). */
  pan?: number
  /** Callback fired when the continuous sound finishes playing (via stop or TTL). */
  onEnded?: () => void
}

/**
 * Real-time dynamic modulation parameters for continuous sound handles and interactive motion audio.
 */
export interface SoundModulationParams {
  /** Master volume gain multiplier (0.0 to 1.0). */
  volume?: number
  /** Pitch multiplier / frequency ratio (e.g. 0.5 = octave down, 1.0 = normal, 2.0 = octave up). */
  pitch?: number
  /** Detune offset in cents (e.g. +1200 = octave up, -1200 = octave down). */
  detune?: number
  /** Biquad filter cutoff / center frequency in Hertz (20 to 20000 Hz). */
  cutoff?: number
  /** Filter quality factor / resonance Q. */
  filterQ?: number
  /** Stereo panning position (-1.0 for hard left, 0.0 for center, +1.0 for hard right). */
  pan?: number
  /** Cadence / pulse interval speed multiplier (e.g. 2.0 = twice as fast pulses). */
  rate?: number
  /** LFO modulation frequency in Hertz. */
  lfoRate?: number
  /** LFO modulation depth (0.0 to 1.0). */
  lfoDepth?: number
}

/**
 * Live audio voice handle returned by continuous sound playback with real-time modulation capabilities.
 */
export interface SoundHandle {
  /** Unique execution instance ID for this voice. */
  readonly id: string
  /** Sound cue identifier. */
  readonly cue: string
  /** Sound variant if specified. */
  readonly variant?: string
  /** Whether the sound voice is currently playing. */
  readonly isPlaying: boolean
  /** Stops the sound with smooth release fade-out. */
  stop: (releaseDuration?: number) => void
  /** Dynamically adjusts volume level multiplier (0.0 to 1.0) with smooth ramping. */
  setVolume: (volume: number, rampDuration?: number) => void
  /** Dynamically adjusts pitch multiplier (e.g. 0.5 to 3.0) with smooth ramping. */
  setPitch: (pitchMultiplier: number, rampDuration?: number) => void
  /** Dynamically adjusts detune in cents (+/- cents) with smooth ramping. */
  setDetune: (cents: number, rampDuration?: number) => void
  /** Dynamically adjusts filter cutoff frequency in Hertz with smooth ramping. */
  setCutoff: (frequencyHz: number, rampDuration?: number) => void
  /** Dynamically adjusts stereo pan position (-1.0 to 1.0) with smooth ramping. */
  setPan: (pan: number, rampDuration?: number) => void
  /** Dynamically adjusts pulse rate / speed multiplier with smooth ramping. */
  setRate: (rateMultiplier: number, rampDuration?: number) => void
  /** Batch modulates multiple audio parameters simultaneously with a single smooth ramp. */
  setModulation: (params: SoundModulationParams, rampDuration?: number) => void
}

/**
 * Reactive state interface for SoundEngine.
 */
export interface SoundState {
  /** Whether sound playback is globally enabled. */
  enabled: boolean
  /** Master volume multiplier (0.0 to 1.0). */
  volume: number
  /** Whether sound is currently muted (volume effectively 0 without altering stored volume). */
  isMuted: boolean
  /** Total number of currently synthesizing active voices / recipes. */
  activeVoicesCount: number
  /** Total count of active continuous / infinite sound loops. */
  activeContinuousCount: number
  /** List of currently playing continuous cue identifiers. */
  activeContinuousCues: string[]
  /** Timestamped record of the last played sound cue. */
  lastPlayed?: {
    cue: string
    variant?: string
    emphasis: SoundEmphasis
    volume: number
    timestamp: number
  }
}

/**
 * Constructor configuration options for SoundEngine.
 */
export interface SoundEngineOptions {
  /** Initial master volume (default 0.7). */
  defaultVolume?: number
  /** Initial enablement state (default true). */
  defaultEnabled?: boolean
  /** Initial mute state (default false). */
  defaultMuted?: boolean
  /** Custom storage adapter for state persistence (Rule ENG2). */
  storageAdapter?: StorageAdapter
  /** Custom storage key (default 'config'). */
  storageKey?: string
  /** Custom sound recipes or variants to register on initialization. */
  customRecipes?: Record<string, SoundRecipe | SoundCueDefinition>
  /** Whether to automatically wire declarative DOM data-sound-* attributes upon initialization. */
  autoBind?: boolean
}

/**
 * Sound event payloads dispatched across the interface event bus.
 */
export interface SoundPlayEventPayload {
  cue: string
  variant?: string
  volume: number
  emphasis: SoundEmphasis
  timestamp: number
}

export interface SoundContinuousStartEventPayload {
  id: string
  cue: string
  variant?: string
  volume: number
  ttl?: number
  timestamp: number
}

export interface SoundContinuousStopEventPayload {
  id: string
  cue: string
  timestamp: number
}

export interface SoundVolumeChangeEventPayload {
  volume: number
  isMuted: boolean
}

export interface SoundStateChangeEventPayload {
  enabled: boolean
}

