import React, { createContext, useContext, useMemo, useRef, useSyncExternalStore } from 'react'
import {
  OverlayEngine,
  createOverlayEngine,
  type OverlayEngineOptions,
} from './engine/overlay-engine'
import { SpotlightOverlay } from './components/spotlight-overlay'
import type {
  OverlayTargetResolver,
  SpotlightOptions,
  TargetRect,
} from './engine/types'

export interface OverlayContextValue {
  /** Active spotlight options or null. */
  activeSpotlight: SpotlightOptions | null
  /** Active spotlighted target rectangles. */
  activeTargets: TargetRect[]
  /** Whether any spotlight is currently open. */
  isOpen: boolean
  /** Spotlight a target element or options programmatically. */
  spotlight: (target: OverlayTargetResolver | OverlayTargetResolver[] | SpotlightOptions) => void
  /** Dismiss active spotlight. */
  clearSpotlight: () => void
  /** Highlight element on error or focus. */
  spotlightError: (target: OverlayTargetResolver, message?: string) => void
}

export interface ExtendedOverlayContextValue extends OverlayContextValue {
  /** Underlying framework-agnostic OverlayEngine instance. */
  engine: OverlayEngine
}

const OverlayContext = createContext<ExtendedOverlayContextValue | null>(null)

export function useOverlay(): ExtendedOverlayContextValue {
  const ctx = useContext(OverlayContext)
  if (!ctx) {
    throw new Error('useOverlay must be used within an <OverlayProvider>')
  }
  return ctx
}



export interface OverlayProviderProps extends OverlayEngineOptions {
  /** Custom engine configuration. */
  engine?: OverlayEngine
  /** Custom options configuration. */
  options?: OverlayEngineOptions & Record<string, unknown>
  children: React.ReactNode
}

export function OverlayProvider({
  engine: propEngine,
  options,
  defaultPadding = 8,
  defaultRadius = 8,
  defaultShape = 'rounded-rect',
  enableKeyboard = true,
  children,
}: OverlayProviderProps) {
  const engineRef = useRef<OverlayEngine | null>(null)

  if (!engineRef.current) {
    if (propEngine) {
      engineRef.current = propEngine
    } else {
      engineRef.current = createOverlayEngine({
        defaultPadding: options?.defaultPadding ?? defaultPadding,
        defaultRadius: options?.defaultRadius ?? defaultRadius,
        defaultShape: options?.defaultShape ?? defaultShape,
        enableKeyboard: options?.enableKeyboard ?? enableKeyboard,
      })
    }
  }

  const engine = engineRef.current!

  const engineState = useSyncExternalStore(
    (callback) => engine.subscribe(callback),
    () => engine.getState(),
    () => engine.getState()
  )

  const contextValue: ExtendedOverlayContextValue = useMemo(() => {
    return {
      engine,
      activeSpotlight: engineState.activeSpotlight,
      activeTargets: engineState.activeTargets,
      isOpen: engineState.isOpen,

      spotlight: (targetOrOptions) => {
        engine.spotlight(targetOrOptions)
      },

      clearSpotlight: () => {
        engine.clearSpotlight()
      },

      spotlightError: (target: OverlayTargetResolver, message?: string) => {
        engine.spotlight({
          target,
          variant: 'ring',
          padding: 6,
          scrollIntoView: true,
          meta: { errorMessage: message },
        })
      },
    }
  }, [engine, engineState])

  return (
    <OverlayContext.Provider value={contextValue}>
      {children}

      {/* Global Spotlight Render Target */}
      {engineState.isOpen && engineState.activeSpotlight && (
        <SpotlightOverlay
          target={engineState.activeSpotlight.target}
          active={engineState.isOpen}
          variant={engineState.activeSpotlight.variant ?? 'cutout'}
          padding={engineState.activeSpotlight.padding ?? defaultPadding}
          radius={engineState.activeSpotlight.radius ?? defaultRadius}
          shape={engineState.activeSpotlight.shape ?? defaultShape}
          interactive={engineState.activeSpotlight.interactive ?? false}
          backdropBlur={engineState.activeSpotlight.backdropBlur ?? false}
          backdropBehavior={engineState.activeSpotlight.backdropBehavior ?? 'dismiss'}
          onBackdropClick={() => {
            const b = engineState.activeSpotlight?.backdropBehavior ?? 'dismiss'
            if (b === 'dismiss') {
              engine.clearSpotlight()
            }
          }}
        />
      )}
    </OverlayContext.Provider>
  )
}
