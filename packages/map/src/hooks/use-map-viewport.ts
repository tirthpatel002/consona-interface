import { useState, useCallback, useMemo } from 'react'
import type { MapViewport } from '../engine/types'

export interface UseMapViewportOptions {
  /** Initial camera viewport center, zoom, pitch, and bearing. */
  initialViewport?: Partial<MapViewport>
  /** Callback fired whenever the viewport changes. */
  onViewportChange?: (viewport: MapViewport) => void
}

export interface UseMapViewportReturn {
  state: {
    viewport: MapViewport
    isMoving: boolean
  }
  actions: {
    setCenter: (center: [number, number]) => void
    setZoom: (zoom: number) => void
    setBearing: (bearing: number) => void
    setPitch: (pitch: number) => void
    setViewport: (next: Partial<MapViewport>) => void
    resetNorth: () => void
  }
  helpers: {
    formattedCoordinates: string
    zoomLevelLabel: string
  }
  ariaProps: {
    role: string
    'aria-label': string
    'aria-roledescription': string
  }
}

/**
 * Headless camera viewport hook managing pan, zoom, pitch, and bearing interactions.
 */
export function useMapViewport(options: UseMapViewportOptions = {}): UseMapViewportReturn {
  const [viewport, setViewportState] = useState<MapViewport>({
    center: options.initialViewport?.center ?? [-73.9857, 40.7484],
    zoom: options.initialViewport?.zoom ?? 11.4,
    bearing: options.initialViewport?.bearing ?? 0,
    pitch: options.initialViewport?.pitch ?? 0,
  })
  const [isMoving, setIsMoving] = useState(false)

  const update = useCallback(
    (patch: Partial<MapViewport>) => {
      setViewportState((current) => {
        const next: MapViewport = {
          center: patch.center ?? current.center,
          zoom: patch.zoom ?? current.zoom,
          bearing: patch.bearing ?? current.bearing,
          pitch: patch.pitch ?? current.pitch,
        }
        options.onViewportChange?.(next)
        return next
      })
    },
    [options]
  )

  const setCenter = useCallback((center: [number, number]) => update({ center }), [update])
  const setZoom = useCallback((zoom: number) => update({ zoom }), [update])
  const setBearing = useCallback((bearing: number) => update({ bearing }), [update])
  const setPitch = useCallback((pitch: number) => update({ pitch }), [update])
  const resetNorth = useCallback(() => update({ bearing: 0, pitch: 0 }), [update])

  const formattedCoordinates = useMemo(
    () => `${viewport.center[1].toFixed(4)}°N, ${viewport.center[0].toFixed(4)}°E`,
    [viewport.center]
  )

  const zoomLevelLabel = useMemo(
    () => `Zoom ${viewport.zoom.toFixed(1)}x`,
    [viewport.zoom]
  )

  return {
    state: {
      viewport,
      isMoving,
    },
    actions: {
      setCenter,
      setZoom,
      setBearing,
      setPitch,
      setViewport: update,
      resetNorth,
    },
    helpers: {
      formattedCoordinates,
      zoomLevelLabel,
    },
    ariaProps: {
      role: 'region',
      'aria-label': `Map viewport centered at ${formattedCoordinates}`,
      'aria-roledescription': 'interactive map',
    },
  }
}
