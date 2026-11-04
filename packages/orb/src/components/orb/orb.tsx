'use client'

/// <reference path="../../webgpu.d.ts" />

import * as React from 'react'
import {
  createInterfaceComponent,
  type SlotComponents,
  type SlotPropsMap,
  type SlotDefinition,
} from '@consona/interface-core'
import { renderSlot } from '@consona/interface-core'
import { type OrbParams, type StyleName } from '../../engine/presets'
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
  styleName?: StyleName
  state?: OrbStateName
  params?: Partial<OrbParams>
  speed?: number
  radius?: number
  /** Toggle the refractive glass outer shell. */
  glassEnabled?: boolean
  glassOpacity?: number
  sheen?: number
  gloss?: number
  canvasColor?: string
  size?: number | string
  transitionDuration?: number
  activationDuration?: number
  onReady?: () => void
  onError?: (error: Error) => void
  fallback?: React.ReactNode
  slots?: SlotComponents<OrbSlots>
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
  const onReadyRef = React.useRef(onReady)
  const onErrorRef = React.useRef(onError)
  onReadyRef.current = onReady
  onErrorRef.current = onError

  const [failed, setFailed] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [isReady, setIsReady] = React.useState(false)

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
          ;(merged as Record<string, unknown>)[k] = v
        }
      }
    }

    return merged
  }, [
    styleName,
    state,
    userParams,
    speed,
    radius,
    glassEnabled,
    glassOpacity,
    sheen,
    gloss,
    canvasColor,
  ])

  const targetRef = React.useRef<OrbRenderTarget>({
    state,
    params: targetParams,
    activationDuration,
    transitionDuration,
  })

  targetRef.current = {
    state,
    params: targetParams,
    activationDuration,
    transitionDuration,
  }

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    if (!navigator.gpu) {
      const err = new Error('WebGPU is not supported by this browser.')
      setFailed(true)
      setErrorMessage(err.message)
      onErrorRef.current?.(err)
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    setFailed(false)
    setErrorMessage(null)

    const cleanup = createOrbRenderer({
      canvas,
      getTarget: () => targetRef.current,
      onError: (err) => {
        setFailed(true)
        setIsReady(false)
        setErrorMessage(err.message)
        onErrorRef.current?.(err)
      },
      onReady: () => {
        setIsReady(true)
        onReadyRef.current?.()
      },
    })

    return () => {
      cleanup()
      setIsReady(false)
    }
  }, [])

  const dimensionStyles: React.CSSProperties = {
    width: size !== undefined ? (typeof size === 'number' ? `${size}px` : size) : '100%',
    height: size !== undefined ? (typeof size === 'number' ? `${size}px` : size) : '100%',
  }

  const defaultFallback = (
    <div
      role="alert"
      aria-live="polite"
      className="flex flex-col items-center justify-center p-space-6 text-center text-xs text-muted max-w-[280px] rounded-macro bg-bg border border-border"
    >
      <span className="font-semibold text-fg mb-space-1">WebGPU required</span>
      <span>{errorMessage || 'Consona Orb requires a WebGPU-enabled browser.'}</span>
    </div>
  )

  const fallbackSlot = renderSlot(slots?.fallback, {
    errorMessage,
    styleName,
    ...(slotProps?.fallback as Record<string, unknown>),
  })

  return (
    <div
      ref={ref}
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ ...dimensionStyles, ...userStyle }}
      {...rest}
    >
      {failed && (fallbackSlot || fallbackProp || defaultFallback)}

      <canvas
        ref={canvasRef}
        aria-hidden={failed || !isReady}
        role={!failed && isReady ? 'img' : undefined}
        aria-label={!failed && isReady ? `Consona Orb (${styleName})` : undefined}
        className={`w-full h-full block transition-opacity duration-500 ${
          failed ? 'absolute inset-0 opacity-0 pointer-events-none' : isReady ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  )
}

/**
 * Consona Interface — Orb
 *
 * Procedural WebGPU orb with curated optical flow programs, signed-distance
 * boundary refraction, spectral chromatic dispersion, and fluid caustics.
 */
export const Orb = createInterfaceComponent<OrbProps, OrbSlots>(
  {
    name: 'Orb',
    category: 'media',
    description:
      'Procedural WebGPU orb with curated optical flow programs, signed-distance boundary refraction, spectral chromatic dispersion, and fluid caustics.',
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
