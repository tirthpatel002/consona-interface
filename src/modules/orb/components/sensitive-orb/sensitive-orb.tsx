/// <reference path="../../webgpu.d.ts" />

import * as React from 'react'
import {
  createInterfaceComponent,
  renderSlot,
  type SlotComponents,
  type SlotPropsMap,
} from '../../../../core'
import {
  type OrbParams,
  type StyleName,
} from '../../engine/presets'
import {
  defaultOrbActivationDuration,
  defaultOrbTransitionDuration,
} from '../../engine/orb-states'
import { Orb, type OrbProps, type OrbSlots } from '../orb/orb'
import { useAudioVolume } from '../../../media/hooks/use-audio-analyser'
import { resumeAudioContext } from '../../../media/engine/context'

/* ==========================================================================
   Sensitive Orb Slots
   ========================================================================== */

export interface SensitiveOrbSlots extends OrbSlots {
  /** Underlying WebGPU procedural orb renderer slot. */
  orb?: React.ComponentType<OrbProps>
}

/* ==========================================================================
   Sensitive Orb Types & Sensitivities
   ========================================================================== */

export interface SensitiveOrbSensitivities {
  /** Master sensitivity multiplier (default: 1.0) */
  master?: number
  /** Flow velocity speed sensitivity multiplier (default: 1.0) */
  speed?: number
  /** Sphere radius / scale pulsation sensitivity multiplier (default: 1.0) */
  radius?: number
  /** Alias for radius */
  size?: number
  /** Liquid boundary contour deformation sensitivity multiplier (default: 1.0) */
  contour?: number
  /** Internal fluid vortex warp distortion sensitivity multiplier (default: 1.0) */
  warp?: number
  /** Surface ripple frequency and wave count sensitivity multiplier (default: 1.0) */
  ridge?: number
  /** Ambient halo / rim glow sensitivity multiplier (default: 0.0) */
  glow?: number
  /** Optical exposure / brightness burst sensitivity multiplier (default: 0.0) */
  exposure?: number
  /** Surface specular sharpness sensitivity multiplier (default: 0.0) */
  sharp?: number
  /** Shadow depth and contrast sensitivity multiplier (default: 0.0) */
  shade?: number
}

export type SensitiveOrbSensitivity = number | SensitiveOrbSensitivities

export interface SensitiveOrbProps extends Omit<OrbProps, 'state' | 'slots' | 'slotProps'> {
  /**
   * Active state or boolean flag:
   * - `true` or `'thinking'` / `'speaking'` / `'listening'`: Orb is actively modulated with dynamics
   * - `false` or `'idle'`: Orb drifts in calm resting idle state
   */
  active?: boolean | 'idle' | 'thinking' | 'listening' | 'speaking'
  /** Explicit state profile name override ('idle' | 'thinking') */
  state?: 'idle' | 'thinking' | 'listening' | 'speaking'
  /** Continuous external energy signal level (0.0 to 1.0) from AI agent, voice VAD, socket, or animation */
  signal?: number
  /** Media element source (audio / video) to automatically analyze with WebAudio FFT */
  audioElement?: HTMLMediaElement | null
  /** Granular sensitivity options or master multiplier */
  sensitivity?: SensitiveOrbSensitivity
  /** Speed velocity sensitivity multiplier shortcut */
  speedSensitivity?: number
  /** Sphere radius / size pulsating sensitivity shortcut */
  sizeSensitivity?: number
  /** Radius sensitivity shortcut */
  radiusSensitivity?: number
  /** Contour deformation sensitivity shortcut */
  contourSensitivity?: number
  /** Vortex warp distortion sensitivity shortcut */
  warpSensitivity?: number
  /** Outer glow sensitivity shortcut */
  glowSensitivity?: number
  /** Ridge ripple frequency sensitivity shortcut */
  ridgeSensitivity?: number
  /** Optical exposure / brightness burst sensitivity shortcut */
  exposureSensitivity?: number
  /** Specular sharpness sensitivity shortcut */
  sharpSensitivity?: number
  /** Shadow contrast sensitivity shortcut */
  shadeSensitivity?: number
  /** Base resting speed during idle state (default: 0.35) */
  idleSpeed?: number
  /** Base active motion speed (default: 1.8) */
  activeSpeed?: number
  /** Base resting radius (default: 0.96) */
  baseRadius?: number
  /** Maximum radius on volume / energy peaks (default: 1.0) */
  maxRadius?: number
  /** Inertial smoothing response speed (higher = faster attack, default: 7.5) */
  smoothness?: number
  /** Whether the orb dynamically modulates with audio/signal energy */
  reactive?: boolean
  /** Slot overrides for downstream customization. */
  slots?: SlotComponents<SensitiveOrbSlots>
  /** Slot prop overrides for downstream customization. */
  slotProps?: SlotPropsMap<SensitiveOrbSlots>
}

/* ==========================================================================
   Sensitive Orb Component Implementation
   ========================================================================== */

function SensitiveOrbPrimitive(props: SensitiveOrbProps, ref?: React.Ref<HTMLDivElement>) {
  const {
    active = true,
    state: explicitState,
    signal = 0,
    audioElement = null,
    sensitivity = 1.0,
    speedSensitivity,
    sizeSensitivity,
    radiusSensitivity,
    contourSensitivity,
    warpSensitivity,
    glowSensitivity,
    ridgeSensitivity,
    exposureSensitivity,
    sharpSensitivity,
    shadeSensitivity,
    idleSpeed = 0.35,
    activeSpeed = 1.8,
    baseRadius = 0.96,
    maxRadius = 1.0,
    smoothness = 7.5,
    reactive = true,
    styleName = 'aurora',
    size,
    params: customParams,
    speed: customSpeed,
    radius: customRadius,
    canvasColor = '#00000000',
    transitionDuration = defaultOrbTransitionDuration,
    activationDuration = defaultOrbActivationDuration,
    className = '',
    slots,
    slotProps,
    ...orbProps
  } = props

  // Determine active state boolean
  const isActive = explicitState !== undefined
    ? explicitState !== 'idle'
    : typeof active === 'boolean'
      ? active
      : active === 'thinking' || active === 'speaking' || active === 'listening'

  // Ensure AudioContext is resumed when active
  React.useEffect(() => {
    if (isActive && audioElement) {
      resumeAudioContext().catch(() => {})
    }
  }, [isActive, audioElement])

  // Sample real-time volume if media element provided
  const rawAudioVolume = useAudioVolume(audioElement, {
    fftSize: 64,
    smoothingTimeConstant: 0.4,
  })

  // Resolves granular per-field sensitivity multipliers
  const sensConfig = React.useMemo(() => {
    const master = typeof sensitivity === 'number' ? sensitivity : sensitivity?.master ?? 1.0
    const opts = typeof sensitivity === 'object' ? sensitivity : {}
    return {
      master,
      speed: speedSensitivity ?? opts.speed ?? 1.0,
      radius: radiusSensitivity ?? sizeSensitivity ?? opts.radius ?? opts.size ?? 1.0,
      contour: contourSensitivity ?? opts.contour ?? 1.0,
      warp: warpSensitivity ?? opts.warp ?? 1.0,
      glow: glowSensitivity ?? opts.glow ?? 0.0,
      ridge: ridgeSensitivity ?? opts.ridge ?? 1.0,
      exposure: exposureSensitivity ?? opts.exposure ?? 0.0,
      sharp: sharpSensitivity ?? opts.sharp ?? 0.0,
      shade: shadeSensitivity ?? opts.shade ?? 0.0,
    }
  }, [
    sensitivity,
    speedSensitivity,
    sizeSensitivity,
    radiusSensitivity,
    contourSensitivity,
    warpSensitivity,
    glowSensitivity,
    ridgeSensitivity,
    exposureSensitivity,
    sharpSensitivity,
    shadeSensitivity,
  ])

  // Continuous smoothed audio/signal energy with organic exponential damping
  const smoothedEnergyRef = React.useRef(0)
  const [smoothedEnergy, setSmoothedEnergy] = React.useState(0)

  React.useEffect(() => {
    if (!isActive) {
      smoothedEnergyRef.current = 0
      setSmoothedEnergy(0)
      return
    }

    let rafId: number | null = null
    let lastTime = performance.now()

    const tick = (now: number) => {
      const dt = Math.min(0.08, (now - lastTime) / 1000)
      lastTime = now

      const elapsed = now / 1000
      // Multi-harmonic acoustic beat wave (3.2Hz + 6.4Hz + 1.6Hz)
      const b1 = Math.sin(elapsed * 3.2) * 0.5 + 0.5
      const b2 = Math.sin(elapsed * 6.4 + 0.9) * 0.3 + 0.3
      const b3 = Math.sin(elapsed * 1.6 + 1.5) * 0.2 + 0.2
      const acousticBeat = b1 * 0.5 + b2 * 0.35 + b3 * 0.15

      // Combine external signal, audio volume, and rhythmic acoustic wave
      let targetEnergy = 0
      if (signal > 0) {
        targetEnergy = signal * 1.2
      } else if (rawAudioVolume > 0.015) {
        targetEnergy = rawAudioVolume * 1.3 + acousticBeat * 0.25
      } else if (isActive) {
        targetEnergy = acousticBeat * 0.65
      }

      // Smooth exponential moving average filter for buttery, soft transitions
      const alpha = 1 - Math.exp(-dt * smoothness)
      const nextSmoothed = smoothedEnergyRef.current + (targetEnergy - smoothedEnergyRef.current) * alpha
      smoothedEnergyRef.current = nextSmoothed

      if (Math.abs(nextSmoothed - smoothedEnergy) > 0.005) {
        setSmoothedEnergy(nextSmoothed)
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [isActive, signal, rawAudioVolume, smoothedEnergy, smoothness])

  // Aggregate audio volume & rhythmic energy with master sensitivity
  const energy = isActive && reactive
    ? Math.min(1.2, Math.max(0.15, smoothedEnergy * 2.2 * sensConfig.master))
    : 0

  const resolvedState: 'idle' | 'thinking' =
    explicitState === 'idle'
      ? 'idle'
      : explicitState === 'thinking' || explicitState === 'listening' || explicitState === 'speaking'
        ? 'thinking'
        : isActive
          ? 'thinking'
          : 'idle'

  // Dynamic speed modulated by speed sensitivity
  const computedSpeed = React.useMemo(() => {
    if (customSpeed !== undefined) return customSpeed
    if (!isActive) return idleSpeed
    return activeSpeed + energy * 3.6 * sensConfig.speed
  }, [isActive, energy, customSpeed, idleSpeed, activeSpeed, sensConfig.speed])

  // Dynamic radius pulsating with radius/size sensitivity
  const computedRadius = React.useMemo(() => {
    const minR = customRadius !== undefined ? customRadius : baseRadius
    if (!isActive) return minR
    return Math.min(maxRadius, minR + energy * 0.04 * sensConfig.radius)
  }, [isActive, energy, customRadius, baseRadius, maxRadius, sensConfig.radius])

  // Dynamic deformation, optical wave, and luminescence parameters
  const dynamicParams = React.useMemo<Partial<OrbParams>>(() => {
    const params: Partial<OrbParams> = {}

    if (sensConfig.contour > 0 && isActive) {
      params.contourDeform = Math.min(1.0, 0.08 + energy * 0.45 * sensConfig.contour)
    }
    if (sensConfig.glow > 0 && isActive) {
      params.edgeGlow = Math.min(1.0, energy * 0.8 * sensConfig.glow)
    }
    if (sensConfig.exposure > 0 && isActive) {
      params.exposure = 1.0 + energy * 0.5 * sensConfig.exposure
    }
    if (sensConfig.sharp > 0 && isActive) {
      params.sharp = 2.0 + energy * 2.0 * sensConfig.sharp
    }
    if (sensConfig.shade > 0 && isActive) {
      params.shade = 0.3 + energy * 0.3 * sensConfig.shade
    }

    if (customParams) {
      for (const [k, v] of Object.entries(customParams)) {
        if (v !== undefined) {
          (params as any)[k] = v
        }
      }
    }
    return params
  }, [isActive, energy, customParams, sensConfig])

  return renderSlot(
    slots?.orb,
    {
      styleName,
      state: resolvedState,
      speed: computedSpeed,
      radius: computedRadius,
      canvasColor,
      params: dynamicParams,
      size,
      transitionDuration,
      activationDuration,
      className,
      slots,
      slotProps,
      ...orbProps,
      ...slotProps?.orb,
    },
    { defaultComponent: Orb }
  )
}

/**
 * Consona Interface — Sensitive Orb
 *
 * Audio-reactive and signal-sensitive procedural WebGPU liquid glass orb.
 * Dynamically modulates speed, pulsating radius, fluid vortex warp, edge contour
 * deformation, and optical luminescence in real-time with sub-millisecond smoothness.
 */
export const SensitiveOrb = createInterfaceComponent<SensitiveOrbProps, SensitiveOrbSlots>(
  {
    name: 'SensitiveOrb',
    category: 'media',
    description:
      'Audio-reactive and signal-sensitive procedural WebGPU liquid glass orb with fine-grained motion, warp, contour, and optical sensitivities.',
    version: '1.0.0',
    props: {
      styleName: 'aurora',
      active: true,
      signal: 0,
      sensitivity: 1.0,
      baseRadius: 0.96,
      maxRadius: 1.0,
      idleSpeed: 0.35,
      activeSpeed: 1.8,
      smoothness: 7.5,
      reactive: true,
      size: undefined,
      transitionDuration: defaultOrbTransitionDuration,
      activationDuration: defaultOrbActivationDuration,
    },
    slots: {
      orb: Orb,
      fallback: undefined,
    },
  },
  SensitiveOrbPrimitive
)

export default SensitiveOrb
