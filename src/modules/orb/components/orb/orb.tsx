/// <reference path="../../webgpu.d.ts" />

import * as React from 'react'
import {
  createInterfaceComponent,
  type SlotComponents,
  type SlotPropsMap,
  type SlotDefinition,
} from '../../../../core'
import { renderSlot } from '../../../../core/slot-resolver'
import {
  type OrbParams,
  type StyleName,
} from '../../engine/presets'
import {
  type OrbStateName,
  type OrbRenderTarget,
  defaultOrbActivationDuration,
  defaultOrbTransitionDuration,
  resolveOrbStateParams,
  createPresetOrbStateConfiguration,
} from '../../engine/orb-states'
import { createOrbRenderer } from '../../engine/orb-renderer'

export interface OrbFallbackSlotProps {
  /** Error message describing why WebGPU is unavailable. */
  errorMessage?: string | null
  /** Active style preset name. */
  styleName?: StyleName
}

export interface OrbSlots {
  /** Fallback content rendered when WebGPU is not supported or encounters an error. */
  fallback?: SlotDefinition<OrbFallbackSlotProps>
}

export interface OrbProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onError'> {
  /** Flow style program preset. */
  styleName?: StyleName
  /** Active animation state profile: 'idle' | 'thinking'. */
  state?: OrbStateName
  /** Custom parameter overrides. */
  params?: Partial<OrbParams>
  /** Motion speed multiplier. */
  speed?: number
  /** Normalized sphere radius ratio (0.3 - 0.95). */
  radius?: number
  /** Toggle the refractive liquid glass outer shell. */
  glassEnabled?: boolean
  /** Opacity of the outer glass shell refraction and rim lighting (0.0 - 1.0). */
  glassOpacity?: number
  /** Specular sheen intensity multiplier (0.0 - 2.0). */
  sheen?: number
  /** Chromatic dispersion gloss multiplier across refracted rays (0.0 - 2.0). */
  gloss?: number
  /** Background canvas color in hex (default: '#00000000' / transparent). */
  canvasColor?: string
  /** Width / height dimension (number in px or CSS string). */
  size?: number | string
  /** Transition duration between states in seconds. */
  transitionDuration?: number
  /** State activation duration in seconds. */
  activationDuration?: number
  /** Called when the WebGPU renderer is initialized and rendering. */
  onReady?: () => void
  /** Called when WebGPU fails to initialize or encounters an error. */
  onError?: (error: Error) => void
  /** Fallback React node when WebGPU is not supported. */
  fallback?: React.ReactNode
  /** Slot overrides for downstream customization. */
  slots?: SlotComponents<OrbSlots>
  /** Slot prop overrides for downstream customization. */
  slotProps?: SlotPropsMap<OrbSlots>
}

function OrbPrimitive(props: OrbProps, ref?: React.Ref<HTMLDivElement>) {
  const {
    styleName = 'chrome',
    state = 'thinking',
    params: userParams,
    speed,
    radius,
    glassEnabled,
    glassOpacity,
    sheen,
    gloss,
    canvasColor = '#00000000',
    size,
    transitionDuration = defaultOrbTransitionDuration,
    activationDuration = defaultOrbActivationDuration,
    className = '',
    style: userStyle,
    onReady,
    onError,
    fallback: fallbackProp,
    slots,
    slotProps,
    ...rest
  } = props

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const [isSupported, setIsSupported] = React.useState<boolean | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [isReady, setIsReady] = React.useState(false)

  // Derive active parameters
  const targetParams = React.useMemo<OrbParams>(() => {
    const config = createPresetOrbStateConfiguration(styleName)
    const resolved = resolveOrbStateParams(config, state)
    const merged = { ...resolved }

    if (speed !== undefined) merged.speed = speed
    if (radius !== undefined) merged.radius = radius
    if (glassEnabled !== undefined) merged.glassEnabled = glassEnabled
    if (glassOpacity !== undefined) merged.glassOpacity = glassOpacity
    if (sheen !== undefined) merged.sheen = sheen
    if (gloss !== undefined) merged.gloss = gloss
    if (canvasColor !== undefined) merged.canvasColor = canvasColor

    if (userParams) {
      for (const [k, v] of Object.entries(userParams)) {
        if (v !== undefined) {
          (merged as any)[k] = v
        }
      }
    }

    return merged
  }, [styleName, state, userParams, speed, radius, glassEnabled, glassOpacity, sheen, gloss, canvasColor])

  // Keep target ref updated for live 60fps sampling
  const targetRef = React.useRef<OrbRenderTarget>({
    state,
    params: targetParams,
    activationDuration,
    transitionDuration,
  })

  // Synchronously update ref during render so WebGPU render loop gets new values on the next frame immediately
  targetRef.current = {
    state,
    params: targetParams,
    activationDuration,
    transitionDuration,
  }

  React.useEffect(() => {
    targetRef.current = {
      state,
      params: targetParams,
      activationDuration,
      transitionDuration,
    }
  }, [state, targetParams, activationDuration, transitionDuration])

  // Check WebGPU support & initialize renderer
  React.useEffect(() => {
    if (typeof window === 'undefined') return

    if (!navigator.gpu) {
      setIsSupported(false)
      setErrorMessage('WebGPU is not supported by this browser.')
      onError?.(new Error('WebGPU is not supported by this browser.'))
      return
    }

    setIsSupported(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const cleanup = createOrbRenderer({
      canvas,
      getTarget: () => targetRef.current,
      onError: (err) => {
        setErrorMessage(err.message)
        onError?.(err)
      },
      onReady: () => {
        setIsReady(true)
        onReady?.()
      },
    })

    return () => {
      cleanup()
      setIsReady(false)
    }
  }, [onReady, onError])

  const dimensionStyles: React.CSSProperties = {
    width: size !== undefined ? (typeof size === 'number' ? `${size}px` : size) : '100%',
    height: size !== undefined ? (typeof size === 'number' ? `${size}px` : size) : '100%',
  }

  const defaultFallback = (
    <div className="flex flex-col items-center justify-center p-space-6 text-center text-xs text-muted max-w-[280px] rounded-macro bg-bg border border-border">
      <span className="text-2xl mb-space-2">🔮</span>
      <span className="font-semibold text-fg mb-space-1">WebGPU Required</span>
      <span>{errorMessage || 'Liquid Glass Orb requires a WebGPU-enabled browser.'}</span>
    </div>
  )

  const fallbackSlot = renderSlot(
    slots?.fallback,
    { errorMessage, styleName, ...(slotProps?.fallback as any) }
  )

  return (
    <div
      ref={ref}
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ ...dimensionStyles, ...userStyle }}
      {...rest}
    >
      {isSupported === false && (fallbackSlot || fallbackProp || defaultFallback)}

      <canvas
        ref={canvasRef}
        aria-label={`Consona Orb (${styleName})`}
        className={`w-full h-full block transition-opacity duration-500 ${
          isReady ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  )
}

/**
 * Consona Interface — Liquid Glass Orb
 *
 * Real-time procedural WebGPU liquid glass orb with curated optical flow programs,
 * signed-distance boundary refraction, spectral chromatic dispersion, and fluid caustics.
 */
export const Orb = createInterfaceComponent<OrbProps, OrbSlots>(
  {
    name: 'Orb',
    category: 'media',
    description:
      'Real-time procedural WebGPU liquid glass orb with curated optical flow programs, signed-distance boundary refraction, spectral chromatic dispersion, and fluid caustics.',
    version: '1.0.0',
    props: {
      styleName: 'chrome',
      state: 'thinking',
      canvasColor: '#00000000',
      size: undefined,
      transitionDuration: defaultOrbTransitionDuration,
      activationDuration: defaultOrbActivationDuration,
    },
    slots: {
      fallback: undefined,
    },
  },
  OrbPrimitive
)

export default Orb
