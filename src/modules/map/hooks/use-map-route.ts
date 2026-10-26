import { useState, useCallback, useEffect, useMemo } from 'react'
import type { MapCheckpoint, MapPathProfile, MapPathRoute } from '../engine/types'
import { fetchRoadPath } from '../engine/map-engine'
import { measure, sliceTo, pointAt } from '../engine/geometry'

export interface UseMapRouteOptions {
  /** Ordered list of checkpoints defining the route path. */
  checkpoints?: MapCheckpoint[]
  /** Travel profile mode (driving, walking, cycling, or straight). */
  profile?: MapPathProfile | 'straight'
  /** Progress percentage along the path (0.0 to 1.0). */
  progress?: number
  /** Custom router service URL override. */
  routerUrl?: string
  /** Callback fired when road path is computed. */
  onRoute?: (route: MapPathRoute) => void
  /** Callback fired when routing fails. */
  onError?: (error: Error) => void
}

export interface UseMapRouteReturn {
  state: {
    route: MapPathRoute | null
    traveled: [number, number][]
    currentPoint: [number, number] | null
    isLoading: boolean
    progress: number
  }
  actions: {
    setProgress: (progress: number) => void
    recalculate: () => Promise<void>
  }
  helpers: {
    formattedDistance: string
    formattedDuration: string
    totalDistanceKm: number
    totalDurationMin: number
  }
  ariaProps: {
    role: string
    'aria-valuenow': number
    'aria-valuemin': number
    'aria-valuemax': number
    'aria-valuetext': string
  }
}

/**
 * Headless route analysis and travel progression hook.
 */
export function useMapRoute(options: UseMapRouteOptions = {}): UseMapRouteReturn {
  const { checkpoints = [], profile = 'driving', progress = 0, routerUrl, onRoute, onError } = options
  const [route, setRoute] = useState<MapPathRoute | null>(null)
  const [currentProgress, setProgress] = useState(progress)
  const [isLoading, setIsLoading] = useState(false)

  const stats = useMemo(() => {
    return measure(route?.coordinates ?? [])
  }, [route?.coordinates])

  const traveled = useMemo(() => {
    if (!route?.coordinates.length) return []
    return sliceTo(route.coordinates, stats, currentProgress)
  }, [currentProgress, route?.coordinates, stats])

  const currentPoint = useMemo(() => {
    if (!route?.coordinates.length) return null
    return pointAt(route.coordinates, stats, currentProgress)
  }, [currentProgress, route?.coordinates, stats])

  const calculate = useCallback(async () => {
    if (checkpoints.length < 2) {
      setRoute(null)
      return
    }
    setIsLoading(true)
    try {
      const result = await fetchRoadPath(checkpoints, {
        profile: profile === 'straight' ? 'driving' : profile,
        routerUrl,
      })
      setRoute(result)
      onRoute?.(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Path routing failed')
      onError?.(error)
    } finally {
      setIsLoading(false)
    }
  }, [checkpoints, onError, onRoute, profile, routerUrl])

  useEffect(() => {
    void calculate()
  }, [calculate])

  const totalDistanceKm = (route?.distance ?? 0) / 1000
  const totalDurationMin = Math.round((route?.duration ?? 0) / 60)

  const formattedDistance = useMemo(() => {
    if (totalDistanceKm < 1) return `${Math.round(route?.distance ?? 0)} m`
    return `${totalDistanceKm.toFixed(1)} km`
  }, [route?.distance, totalDistanceKm])

  const formattedDuration = useMemo(() => {
    if (totalDurationMin < 60) return `${totalDurationMin} min`
    const hours = Math.floor(totalDurationMin / 60)
    const mins = totalDurationMin % 60
    return `${hours} hr ${mins} min`
  }, [totalDurationMin])

  return {
    state: {
      route,
      traveled,
      currentPoint,
      isLoading,
      progress: currentProgress,
    },
    actions: {
      setProgress,
      recalculate: calculate,
    },
    helpers: {
      formattedDistance,
      formattedDuration,
      totalDistanceKm,
      totalDurationMin,
    },
    ariaProps: {
      role: 'progressbar',
      'aria-valuenow': Math.round(currentProgress * 100),
      'aria-valuemin': 0,
      'aria-valuemax': 100,
      'aria-valuetext': `${Math.round(currentProgress * 100)}% route traveled (${formattedDistance})`,
    },
  }
}
