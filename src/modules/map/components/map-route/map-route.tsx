import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type * as maplibre from 'maplibre-gl'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap, SlotDefinition } from '../../../../core/types'
import { RouteContext, useMap, useRoute } from '../../context'
import type { RouteAnchor, RouteMeasure } from '../../engine/types'
import { sanitizeId, paintColor, measure, sliceTo, pointAt } from '../../engine/geometry'
import { MapHover } from '../map-hover/map-hover'
import { MapPopup } from '../map-popup/map-popup'
import { MapMarker, type MapMarkerProps } from '../map-marker/map-marker'
import { resolveOverlay } from '../map-search/map-search'

type LinePaint = NonNullable<maplibre.LineLayerSpecification['paint']>

export function layerExists(map: maplibre.Map, id: string | undefined): string | undefined {
  return id && map.getLayer(id) ? id : undefined
}

const EMPTY: [number, number][] = []

/* ==========================================================================
   Route Progress
   ========================================================================== */

export interface RouteProgressSlots {}

export interface RouteProgressProps {
  /** Line stroke color */
  color?: string
  /** Line stroke width */
  width?: number
  /** Line opacity from 0.0 to 1.0 */
  opacity?: number
  /** Dash pattern array */
  dashArray?: [number, number]
  /** Slot overrides */
  slots?: SlotComponents<RouteProgressSlots>
  /** Slot props overrides */
  slotProps?: SlotPropsMap<RouteProgressSlots>
}

function RouteProgressPrimitive({
  color,
  width,
  opacity,
  dashArray,
}: RouteProgressProps) {
  const { map, isLoaded, resolvedTheme } = useMap()
  const route = useRoute()
  const sourceId = `route-progress-source-${route.id}`
  const layerId = `route-progress-layer-${route.id}`
  const fallback = resolvedTheme === 'dark' ? '#fafafa' : '#171717'
  const lineColor = paintColor(color ?? route.color, fallback)
  const lineWidth = width ?? route.width
  const lineOpacity = opacity ?? route.opacity

  useEffect(() => {
    if (!route.ready || !map) return
    map.addSource(sourceId, {
      type: 'geojson',
      data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } },
    })
    map.addLayer(
      {
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': lineColor,
          'line-width': lineWidth,
          'line-opacity': lineOpacity,
          ...(dashArray ? { 'line-dasharray': dashArray } : {}),
        },
      },
      layerExists(map, route.beforeId)
    )
    const unregister = route.registerLayer(layerId)
    return () => {
      unregister()
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId)
        if (map.getSource(sourceId)) map.removeSource(sourceId)
      } catch {
        /* style reload */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, route.ready])

  useEffect(() => {
    if (!route.ready || !map) return
    const source = map.getSource(sourceId) as maplibre.GeoJSONSource | undefined
    source?.setData({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: route.traveled.length < 2 ? [] : route.traveled },
    })
  }, [map, route.ready, route.traveled, sourceId])

  useEffect(() => {
    if (!isLoaded || !map?.getLayer(layerId)) return
    map.setPaintProperty(layerId, 'line-color', lineColor)
    map.setPaintProperty(layerId, 'line-width', lineWidth)
    map.setPaintProperty(layerId, 'line-opacity', lineOpacity)
    map.setPaintProperty(layerId, 'line-dasharray', dashArray)
  }, [dashArray, isLoaded, layerId, lineColor, lineOpacity, lineWidth, map])

  return null
}

export const RouteProgress = createInterfaceComponent<RouteProgressProps, RouteProgressSlots>(
  {
    name: 'RouteProgress',
    category: 'data',
    description: 'Renders the active traveled segment along a parent MapRoute path.',
    version: '1.0.0',
    props: {},
    slots: {

    },
  },
  RouteProgressPrimitive
)

/* ==========================================================================
   Route Marker
   ========================================================================== */

export interface RouteMarkerSlots {
  /** Custom marker icon or content */
  content?: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
}

export interface RouteMarkerProps extends Omit<MapMarkerProps, 'longitude' | 'latitude'> {
  /** Anchor position along the route: 'start' | 'end' | 'progress' | fractional number */
  at: RouteAnchor
  /** Custom marker elements */
  children?: ReactNode
  /** Slot overrides */
  slots?: SlotComponents<RouteMarkerSlots>
  /** Slot props overrides */
  slotProps?: SlotPropsMap<RouteMarkerSlots>
}

function RouteMarkerPrimitive({ at, children, slots = {}, slotProps = {}, ...props }: RouteMarkerProps) {
  const { pointAt } = useRoute()
  const position = pointAt(at)
  if (!position) return null
  return (
    <MapMarker latitude={position[1]} longitude={position[0]} {...props}>
      {children != null ? children : renderSlot(slots.content, slotProps.content)}
    </MapMarker>
  )
}

export const RouteMarker = createInterfaceComponent<RouteMarkerProps, RouteMarkerSlots>(
  {
    name: 'RouteMarker',
    category: 'data',
    description: 'Dynamic marker positioned along a MapRoute path by anchor or progress percentage.',
    version: '1.0.0',
    props: {
      at: 'start',
    },
    slots: {
      content: undefined,
    },
  },
  RouteMarkerPrimitive
)

/* ==========================================================================
   Map Route (Root Family)
   ========================================================================== */

export interface MapRouteSlots {
  /** Traveled path progress renderer */
  progress?: React.ComponentType<RouteProgressProps>
}

export interface MapRouteProps {
  /** Optional route identifier */
  id?: string
  /** Array of [longitude, latitude] coordinates */
  coordinates: [number, number][]
  /** Line stroke color token or hex */
  color?: string
  /** Line stroke width (default: 3) */
  width?: number
  /** Line opacity (default: 0.8) */
  opacity?: number
  /** Line dash pattern array */
  dashArray?: [number, number]
  /** Outer casing stroke color */
  casingColor?: string
  /** Outer casing stroke width */
  casingWidth?: number
  /** Line cap style (default: 'round') */
  lineCap?: 'butt' | 'round' | 'square'
  /** Line join style (default: 'round') */
  lineJoin?: 'bevel' | 'round' | 'miter'
  /** Raw MapLibre line paint properties */
  paint?: LinePaint
  /** Traveled progression fraction from 0.0 to 1.0 */
  progress?: number
  /** Whether the route is actively selected */
  active?: boolean
  /** Active stroke color override */
  activeColor?: string
  /** Active stroke width override */
  activeWidth?: number
  /** Active stroke opacity override */
  activeOpacity?: number
  /** Active dash pattern override */
  activeDashArray?: [number, number]
  /** Existing layer ID to insert this route below */
  beforeId?: string
  /** Callback fired on route click */
  onClick?: () => void
  /** Callback fired on mouse enter */
  onMouseEnter?: () => void
  /** Callback fired on mouse leave */
  onMouseLeave?: () => void
  /** Hover tooltip content */
  tooltip?: boolean | ReactNode
  /** Click popover content */
  popover?: boolean | ReactNode
  /** Whether mouse events are intercepted (default: true) */
  interactive?: boolean
  /** Child elements (RouteProgress, RouteMarker, etc.) */
  children?: ReactNode
  /** Slot overrides */
  slots?: SlotComponents<MapRouteSlots>
  /** Slot props overrides */
  slotProps?: SlotPropsMap<MapRouteSlots>
}

function MapRoutePrimitive({
  id: propId,
  coordinates: incoming,
  color,
  width = 3,
  opacity = 0.8,
  dashArray,
  casingColor,
  casingWidth,
  lineCap = 'round',
  lineJoin = 'round',
  paint,
  progress,
  active = false,
  activeColor,
  activeWidth,
  activeOpacity,
  activeDashArray,
  beforeId,
  onClick,
  onMouseEnter,
  onMouseLeave,
  tooltip = true,
  popover = false,
  interactive = true,
  children,
  slots = {},
  slotProps = {},
}: MapRouteProps) {
  const { map, isLoaded, resolvedTheme } = useMap()
  const [tip, setTip] = useState<{ longitude: number; latitude: number } | null>(null)
  const [pop, setPop] = useState<{ longitude: number; latitude: number; body: ReactNode } | null>(null)
  const autoId = useId()
  const id = sanitizeId(propId ?? autoId)
  const sourceId = `route-source-${id}`
  const layerId = `route-layer-${id}`
  const casingId = `route-casing-${id}`
  const hitId = `route-hit-${id}`
  const [ready, setReady] = useState(false)
  const coordinates = incoming.length > 0 ? incoming : EMPTY
  const fallback = resolvedTheme === 'dark' ? '#fafafa' : '#171717'
  const resolvedColor = paintColor(active ? (activeColor ?? color) : color, fallback)
  const resolvedWidth = active ? (activeWidth ?? width) : width
  const resolvedOpacity = active ? (activeOpacity ?? opacity) : opacity
  const resolvedDash = active ? (activeDashArray ?? dashArray) : dashArray
  const resolvedCasing = casingColor ? paintColor(casingColor, resolvedTheme === 'dark' ? '#171717' : '#ffffff') : undefined
  const resolvedCasingWidth = resolvedCasing ? (casingWidth ?? resolvedWidth + 4) : 0
  const stats = useMemo(() => measure(coordinates), [coordinates])
  const traveled = useMemo(
    () => (progress === undefined ? EMPTY : sliceTo(coordinates, stats, progress)),
    [coordinates, progress, stats]
  )
  const at = useCallback(
    (anchor: RouteAnchor) => {
      if (!coordinates.length) return null
      if (anchor === 'start') return coordinates[0] ?? null
      if (anchor === 'end') return coordinates[coordinates.length - 1] ?? null
      if (anchor === 'progress') return progress === undefined ? null : pointAt(coordinates, stats, progress)
      return pointAt(coordinates, stats, anchor)
    },
    [coordinates, progress, stats]
  )
  const layersRef = useRef<string[]>([])
  const registerLayer = useCallback((childId: string) => {
    layersRef.current = [...layersRef.current, childId]
    return () => {
      layersRef.current = layersRef.current.filter((entry) => entry !== childId)
    }
  }, [])

  useEffect(() => {
    if (!isLoaded || !map) return
    map.addSource(sourceId, {
      type: 'geojson',
      data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } },
    })
    const before = layerExists(map, beforeId)
    map.addLayer(
      {
        id: hitId,
        type: 'line',
        source: sourceId,
        layout: { 'line-join': lineJoin, 'line-cap': lineCap },
        paint: { 'line-color': 'rgba(0,0,0,0)', 'line-width': Math.max(resolvedWidth + 8, 14), 'line-opacity': 1 },
      },
      before
    )
    map.addLayer(
      {
        id: casingId,
        type: 'line',
        source: sourceId,
        layout: { 'line-join': lineJoin, 'line-cap': lineCap },
        paint: {
          'line-color': resolvedCasing ?? 'rgba(0,0,0,0)',
          'line-width': resolvedCasingWidth,
          'line-opacity': resolvedCasing ? resolvedOpacity : 0,
        },
      },
      before
    )
    map.addLayer(
      {
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: { 'line-join': lineJoin, 'line-cap': lineCap },
        paint: {
          'line-color': resolvedColor,
          'line-width': resolvedWidth,
          'line-opacity': resolvedOpacity,
          ...(resolvedDash ? { 'line-dasharray': resolvedDash } : {}),
          ...paint,
        },
      },
      before
    )
    setReady(true)
    return () => {
      setReady(false)
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId)
        if (map.getLayer(casingId)) map.removeLayer(casingId)
        if (map.getLayer(hitId)) map.removeLayer(hitId)
        if (map.getSource(sourceId)) map.removeSource(sourceId)
      } catch {
        /* style reload */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, map])

  useEffect(() => {
    if (!isLoaded || !map) return
    const source = map.getSource(sourceId) as maplibre.GeoJSONSource | undefined
    source?.setData({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: coordinates.length < 2 ? [] : coordinates },
    })
  }, [coordinates, isLoaded, map, sourceId])

  useEffect(() => {
    if (!isLoaded || !map?.getLayer(layerId)) return
    map.setPaintProperty(layerId, 'line-color', resolvedColor)
    map.setPaintProperty(layerId, 'line-width', resolvedWidth)
    map.setPaintProperty(layerId, 'line-opacity', resolvedOpacity)
    map.setPaintProperty(layerId, 'line-dasharray', resolvedDash ?? undefined)
    map.setLayoutProperty(layerId, 'line-cap', lineCap)
    map.setLayoutProperty(layerId, 'line-join', lineJoin)
    if (paint) {
      for (const [key, value] of Object.entries(paint)) {
        map.setPaintProperty(layerId, key as keyof LinePaint, value as never)
      }
    }
    if (map.getLayer(casingId)) {
      map.setPaintProperty(casingId, 'line-color', resolvedCasing ?? 'rgba(0,0,0,0)')
      map.setPaintProperty(casingId, 'line-width', resolvedCasingWidth)
      map.setPaintProperty(casingId, 'line-opacity', resolvedCasing ? resolvedOpacity : 0)
      map.setLayoutProperty(casingId, 'line-cap', lineCap)
      map.setLayoutProperty(casingId, 'line-join', lineJoin)
    }
    if (map.getLayer(hitId)) map.setPaintProperty(hitId, 'line-width', Math.max(resolvedWidth + 8, 14))
  }, [casingId, hitId, isLoaded, layerId, lineCap, lineJoin, map, paint, resolvedCasing, resolvedCasingWidth, resolvedColor, resolvedDash, resolvedOpacity, resolvedWidth])

  useEffect(() => {
    if (!ready || !map || !active) return
    let lastLayerSet = ''
    const raise = () => {
      const order = map.getLayersOrder()
      const layerSet = [...order].sort().join('|')
      if (layerSet === lastLayerSet) return
      lastLayerSet = layerSet
      const owned = [hitId, casingId, layerId, ...layersRef.current].filter((entry) => map.getLayer(entry))
      if (owned.length === 0) return
      const before = layerExists(map, beforeId)
      const limit = before ? order.indexOf(before) : order.length
      const top = order.slice(Math.max(0, limit - owned.length), limit)
      if (owned.every((entry, index) => top[index] === entry)) return
      for (const entry of owned) map.moveLayer(entry, before)
    }
    raise()
    map.on('styledata', raise)
    return () => {
      map.off('styledata', raise)
    }
  }, [active, beforeId, casingId, hitId, layerId, map, ready])

  useEffect(() => {
    if (!isLoaded || !map || !interactive) return
    const click = (event: maplibre.MapLayerMouseEvent) => {
      onClick?.()
      const body = resolveOverlay(popover, 'Route', {
        longitude: event.lngLat.lng,
        latitude: event.lngLat.lat,
      })
      if (body) setPop({ longitude: event.lngLat.lng, latitude: event.lngLat.lat, body })
    }
    let inside = false
    const move = (event: maplibre.MapLayerMouseEvent) => {
      map.getCanvas().style.cursor = 'pointer'
      if (!inside) {
        inside = true
        onMouseEnter?.()
      }
      setTip({ longitude: event.lngLat.lng, latitude: event.lngLat.lat })
    }
    const leave = () => {
      inside = false
      map.getCanvas().style.cursor = ''
      onMouseLeave?.()
      setTip(null)
    }
    map.on('click', hitId, click)
    map.on('mousemove', hitId, move)
    map.on('mouseleave', hitId, leave)
    return () => {
      map.off('click', hitId, click)
      map.off('mousemove', hitId, move)
      map.off('mouseleave', hitId, leave)
      setTip(null)
    }
  }, [hitId, interactive, isLoaded, map, onClick, onMouseEnter, onMouseLeave, popover])

  const value = useMemo(
    () => ({
      id,
      ready,
      coordinates,
      traveled,
      progress,
      color: resolvedColor,
      width: resolvedWidth,
      opacity: resolvedOpacity,
      dashArray: resolvedDash,
      beforeId,
      pointAt: at,
      registerLayer,
    }),
    [at, beforeId, coordinates, id, progress, ready, registerLayer, resolvedColor, resolvedDash, resolvedOpacity, resolvedWidth, traveled]
  )

  return (
    <RouteContext.Provider value={value}>
      {children != null
        ? children
        : progress !== undefined
          ? renderSlot(slots.progress, slotProps.progress, { defaultComponent: RouteProgress })
          : null}
      {tooltip ? (
        <MapHover latitude={tip?.latitude ?? null} longitude={tip?.longitude ?? null}>
          {tooltip === true ? 'Route' : tooltip}
        </MapHover>
      ) : null}
      {pop ? (
        <MapPopup latitude={pop.latitude} longitude={pop.longitude} onClose={() => setPop(null)}>
          {pop.body}
        </MapPopup>
      ) : null}
    </RouteContext.Provider>
  )
}

export const MapRoute = createInterfaceComponent<MapRouteProps, MapRouteSlots>(
  {
    name: 'MapRoute',
    category: 'data',
    description: 'Vector line string path with dynamic progress animation, casing border, and hit testing.',
    version: '1.0.0',
    props: {
      coordinates: [],
      width: 3,
      opacity: 0.8,
      lineCap: 'round',
      lineJoin: 'round',
      active: false,
      tooltip: true,
      popover: false,
      interactive: true,
    },
    slots: {
      progress: RouteProgress,
    },
  },
  MapRoutePrimitive
)

MapRoute.Progress = RouteProgress
MapRoute.Marker = RouteMarker

export const { Context: MapRouteContext, useCompoundContext: useMapRouteContext } =
  createCompoundContext<any>('MapRoute')
