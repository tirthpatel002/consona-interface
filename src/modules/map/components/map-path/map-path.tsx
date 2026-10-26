import React, { useState, useEffect, useRef, type ReactNode } from 'react'
import * as maplibre from 'maplibre-gl'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap, SlotDefinition } from '../../../../core/types'
import { useMap } from '../../context'
import type {
  MapCheckpoint,
  MapCheckpointContext,
  MapPathProfile,
  MapPathRoute,
} from '../../engine/types'
import { fetchRoadPath } from '../../engine/map-engine'
import { densifyCheckpoints, checkpointRole } from '../../engine/geometry'
import { MapRoute, type MapRouteProps } from '../map-route/map-route'
import { MapMarker, MarkerContent, MarkerDot, MarkerLabel } from '../map-marker/map-marker'
import { resolveOverlay } from '../map-search/map-search'

export interface MapPathSlots {
  /** Underlying MapRoute path renderer */
  route?: React.ComponentType<MapRouteProps>
  /** Custom checkpoint marker slot */
  marker?: SlotDefinition<MapCheckpointContext>
}

export interface MapPathProps extends Omit<MapRouteProps, 'coordinates' | 'slots' | 'slotProps'> {
  /** Array of checkpoint waypoints */
  checkpoints: MapCheckpoint[]
  /** Direct polyline coordinates override */
  coordinates?: [number, number][]
  /** Routing profile (driving, walking, or cycling) */
  profile?: MapPathProfile
  /** Road snapping behavior ('roads' or 'straight') */
  snap?: 'roads' | 'straight'
  /** Custom OSRM router endpoint URL */
  routerUrl?: string
  /** Automatic camera bounds fitting */
  fit?: boolean | maplibre.FitBoundsOptions
  /** Callback fired when road path geometry is computed */
  onRoute?: (route: MapPathRoute) => void
  /** Callback fired when path calculation fails */
  onError?: (error: Error) => void
  /** Tooltip content for checkpoints */
  checkpointTooltip?: boolean | ReactNode | ((context: MapCheckpointContext) => ReactNode)
  /** Popover content for checkpoints */
  checkpointPopover?: boolean | ReactNode | ((context: MapCheckpointContext) => ReactNode)
  /** Custom checkpoint renderer function */
  renderCheckpoint?: (context: MapCheckpointContext) => ReactNode
  /** Child elements */
  children?: ReactNode
  /** Slot overrides */
  slots?: SlotComponents<MapPathSlots>
  /** Slot props overrides */
  slotProps?: SlotPropsMap<MapPathSlots>
}

function MapPathPrimitive({
  checkpoints,
  coordinates,
  profile = 'driving',
  snap = 'roads',
  routerUrl,
  fit = true,
  color,
  width = 5,
  opacity = 0.95,
  dashArray,
  casingColor,
  casingWidth,
  lineCap,
  lineJoin,
  paint,
  progress,
  tooltip,
  interactive,
  onRoute,
  onError,
  checkpointTooltip,
  checkpointPopover,
  renderCheckpoint,
  children,
  slots = {},
  slotProps = {},
  ...routeProps
}: MapPathProps) {
  const { map, isLoaded, resolvedTheme } = useMap()
  const [route, setRoute] = useState<MapPathRoute | null>(null)
  const fallback = resolvedTheme === 'dark' ? '#171717' : '#ffffff'
  const onRouteRef = useRef(onRoute)
  onRouteRef.current = onRoute
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError
  const checkpointsRef = useRef(checkpoints)
  checkpointsRef.current = checkpoints
  const key = checkpoints.map((point) => `${point.longitude},${point.latitude}`).join('|')

  useEffect(() => {
    const points = checkpointsRef.current
    if (coordinates && coordinates.length >= 2) {
      const next: MapPathRoute = {
        coordinates,
        distance: 0,
        duration: 0,
        profile: 'straight',
        waypoints: points.map((point) => ({ longitude: point.longitude, latitude: point.latitude })),
      }
      setRoute(next)
      onRouteRef.current?.(next)
      return
    }
    if (points.length < 2) {
      setRoute(null)
      return
    }
    if (snap === 'straight') {
      const next: MapPathRoute = {
        coordinates: densifyCheckpoints(points),
        distance: 0,
        duration: 0,
        profile: 'straight',
        waypoints: points.map((point) => ({ longitude: point.longitude, latitude: point.latitude })),
      }
      setRoute(next)
      onRouteRef.current?.(next)
      return
    }
    const controller = new AbortController()
    void fetchRoadPath(points, { profile, routerUrl, signal: controller.signal })
      .then((next) => {
        setRoute(next)
        onRouteRef.current?.(next)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const fallbackRoute: MapPathRoute = {
          coordinates: densifyCheckpoints(points),
          distance: 0,
          duration: 0,
          profile: 'straight',
          waypoints: points.map((point) => ({ longitude: point.longitude, latitude: point.latitude })),
        }
        setRoute(fallbackRoute)
        onErrorRef.current?.(error instanceof Error ? error : new Error('Path failed'))
      })
    return () => controller.abort()
  }, [coordinates, key, profile, routerUrl, snap])

  useEffect(() => {
    if (!fit || !isLoaded || !map || !route?.coordinates.length) return
    const bounds = new maplibre.LngLatBounds()
    for (const coord of route.coordinates) bounds.extend(coord)
    map.fitBounds(bounds, typeof fit === 'object' ? fit : { padding: 48, duration: 600, maxZoom: 14 })
  }, [fit, isLoaded, map, route])

  const line = route?.coordinates ?? densifyCheckpoints(checkpoints)

  const routeContent = (
    <>
      {checkpoints.map((checkpoint, index) => {
        const role = checkpointRole(index, checkpoints.length)
        const context = { checkpoint, index, role, total: checkpoints.length }
        const marker = renderSlot(slots.marker, { ...context, ...(slotProps.marker as any) }) ?? renderCheckpoint?.(context)
        const tip = resolveOverlay(checkpointTooltip, checkpoint.tooltip ?? null, context)
        const bubble = resolveOverlay(checkpointPopover, null, context)
        return (
          <MapMarker
            key={String(checkpoint.id ?? `${checkpoint.longitude},${checkpoint.latitude},${index}`)}
            latitude={checkpoint.latitude}
            longitude={checkpoint.longitude}
            popover={bubble ?? false}
            tooltip={tip ?? false}
          >
            {marker ?? (
              <MarkerContent>
                <MarkerDot
                  color={color}
                  size={role === 'via' ? 16 : 22}
                  stroke={casingColor ?? fallback}
                >
                  {role === 'via' ? index : null}
                </MarkerDot>
                {checkpoint.label ? <MarkerLabel>{checkpoint.label}</MarkerLabel> : null}
              </MarkerContent>
            )}
          </MapMarker>
        )
      })}
      {children}
    </>
  )

  return renderSlot(
    slots.route,
    {
      casingColor: casingColor ?? fallback,
      casingWidth,
      color,
      coordinates: line,
      dashArray,
      interactive,
      lineCap,
      lineJoin,
      opacity,
      paint,
      progress,
      tooltip,
      width,
      children: routeContent,
      ...routeProps,
      ...slotProps.route,
    },
    { defaultComponent: MapRoute }
  )
}

export const MapPath = createInterfaceComponent<MapPathProps, MapPathSlots>(
  {
    name: 'MapPath',
    category: 'data',
    description: 'Calculates and renders multi-point road itineraries or straight paths with interactive checkpoints.',
    version: '1.0.0',
    props: {
      checkpoints: [],
      profile: 'driving',
      snap: 'roads',
      fit: true,
      width: 5,
      opacity: 0.95,
    },
    slots: {
      route: MapRoute,
      marker: undefined,
    },
  },
  MapPathPrimitive
)
