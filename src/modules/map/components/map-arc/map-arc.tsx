import React, { useState, useEffect, useMemo, useRef, useId, type ReactNode } from 'react'
import * as maplibre from 'maplibre-gl'
import type * as GeoJSON from 'geojson'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap, SlotDefinition } from '../../../../core/types'
import { useMap } from '../../context'
import type { MapArcDatum } from '../../engine/types'
import {
  sanitizeId,
  paintColor,
  hoverCase,
  arcFeature,
} from '../../engine/geometry'
import { layerExists } from '../map-route/map-route'
import { MapHover } from '../map-hover/map-hover'
import { MapPopup } from '../map-popup/map-popup'
import { MapMarker, MarkerContent, MarkerDot } from '../map-marker/map-marker'
import { resolveOverlay } from '../map-search/map-search'

type LinePaint = NonNullable<maplibre.LineLayerSpecification['paint']>

export interface MapArcMarkerSlotProps {
  /** Custom arc configuration. */
  arc: any
  /** Custom end configuration. */
  end: 'from' | 'to'
  /** Custom longitude configuration. */
  longitude: number
  /** Custom latitude configuration. */
  latitude: number
}

export interface MapArcSlots {
  /** Custom endpoint marker slot */
  marker?: SlotDefinition<MapArcMarkerSlotProps>
}

export interface MapArcProps<T extends MapArcDatum = MapArcDatum> {
  /** Array of origin/destination connection arc objects */
  data: T[]
  /** Optional layer ID identifier */
  id?: string
  /** Geodesic curve interpolation samples (default: 100) */
  samples?: number
  /** Arc stroke color */
  color?: string
  /** Arc stroke width (default: 2) */
  width?: number
  /** Arc stroke opacity (default: 0.9) */
  opacity?: number
  /** Custom MapLibre line paint properties */
  paint?: LinePaint
  /** Custom hover paint properties */
  hoverPaint?: LinePaint
  /** Stroke dash array pattern */
  dashArray?: [number, number]
  /** Outer casing line color */
  casingColor?: string
  /** Outer casing line width */
  casingWidth?: number
  /** Whether to render endpoint origin/destination markers */
  markers?: boolean
  /** Custom endpoint marker renderer */
  renderMarker?: (context: { arc: T; end: 'from' | 'to'; longitude: number; latitude: number }) => ReactNode
  /** Automatic camera bounds fitting */
  fit?: boolean | maplibre.FitBoundsOptions
  /** Antimeridian wrapping mode ('split' for flat maps, 'unwrap' for 3D globe) */
  antimeridian?: 'split' | 'unwrap'
  /** Callback fired on arc click */
  onClick?: (event: { arc: T; longitude: number; latitude: number }) => void
  /** Callback fired on arc hover */
  onHover?: (event: { arc: T; longitude: number; latitude: number } | null) => void
  /** Hover tooltip content */
  tooltip?: boolean | ReactNode | ((event: { arc: T; longitude: number; latitude: number }) => ReactNode)
  /** Click popover content */
  popover?: boolean | ReactNode | ((event: { arc: T; longitude: number; latitude: number }) => ReactNode)
  /** Whether arcs intercept pointer events (default: true) */
  interactive?: boolean
  /** Existing layer ID to place arcs below */
  beforeId?: string
  /** Slot overrides */
  slots?: SlotComponents<MapArcSlots>
  /** Slot props overrides */
  slotProps?: SlotPropsMap<MapArcSlots>
}

function MapArcPrimitive<T extends MapArcDatum = MapArcDatum>({
  data,
  id: propId,
  samples = 100,
  color,
  width = 2,
  opacity = 0.9,
  paint,
  hoverPaint,
  dashArray,
  casingColor,
  casingWidth,
  markers = false,
  renderMarker,
  fit = false,
  antimeridian = 'split',
  onClick,
  onHover,
  tooltip = true,
  popover = false,
  interactive = true,
  beforeId,
  slots = {},
  slotProps = {},
}: MapArcProps<T>) {
  const { map, isLoaded, resolvedTheme } = useMap()
  const [tip, setTip] = useState<{ longitude: number; latitude: number; label: ReactNode } | null>(null)
  const [pop, setPop] = useState<{ longitude: number; latitude: number; body: ReactNode } | null>(null)
  const autoId = useId()
  const id = sanitizeId(propId ?? autoId)
  const sourceId = `arc-source-${id}`
  const layerId = `arc-layer-${id}`
  const casingId = `arc-casing-${id}`
  const hitId = `arc-hit-${id}`
  const fallback = resolvedTheme === 'dark' ? '#fafafa' : '#171717'
  const lineColor = paintColor(color, fallback)
  const casing = casingColor ? paintColor(casingColor, resolvedTheme === 'dark' ? '#171717' : '#ffffff') : undefined
  const casingSize = casing ? (casingWidth ?? width + 3) : 0
  const merged = useMemo(
    () =>
      hoverCase(
        {
          'line-color': lineColor,
          'line-width': width,
          'line-opacity': opacity,
          ...(dashArray ? { 'line-dasharray': dashArray } : {}),
          ...paint,
        } as LinePaint,
        hoverPaint
      ),
    [dashArray, hoverPaint, lineColor, opacity, paint, width]
  )
  const hitWidth = Math.max((typeof paint?.['line-width'] === 'number' ? paint['line-width'] : width) + 6, 12)
  const geojson = useMemo<GeoJSON.FeatureCollection<GeoJSON.LineString | GeoJSON.MultiLineString>>(
    () => ({
      type: 'FeatureCollection',
      features: data.map((arc) => arcFeature(arc, samples, antimeridian)),
    }),
    [antimeridian, data, samples]
  )
  const latest = useRef({ data, onClick, onHover, tooltip, popover })
  latest.current = { data, onClick, onHover, tooltip, popover }

  useEffect(() => {
    if (!fit || !isLoaded || !map || geojson.features.length === 0) return
    let empty = true
    const bounds = new maplibre.LngLatBounds()
    for (const feature of geojson.features) {
      const geometry = feature.geometry
      const rings = geometry.type === 'MultiLineString' ? geometry.coordinates : [geometry.coordinates]
      for (const ring of rings) {
        for (const coord of ring) {
          bounds.extend(coord as [number, number])
          empty = false
        }
      }
    }
    if (empty) return
    map.fitBounds(bounds, typeof fit === 'object' ? fit : { padding: 56, duration: 0, maxZoom: 3.2 })
  }, [fit, geojson, isLoaded, map])

  useEffect(() => {
    if (!isLoaded || !map) return
    map.addSource(sourceId, { type: 'geojson', data: geojson, promoteId: 'id' })
    map.addLayer(
      {
        id: hitId,
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': 'rgba(0,0,0,0)', 'line-width': hitWidth, 'line-opacity': 1 },
      },
      layerExists(map, beforeId)
    )
    map.addLayer(
      {
        id: casingId,
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': casing ?? 'rgba(0,0,0,0)',
          'line-width': casingSize,
          'line-opacity': casing ? opacity : 0,
        },
      },
      layerExists(map, beforeId)
    )
    map.addLayer(
      {
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: merged,
      },
      layerExists(map, beforeId)
    )
    return () => {
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
    source?.setData(geojson)
  }, [geojson, isLoaded, map, sourceId])

  useEffect(() => {
    if (!isLoaded || !map?.getLayer(layerId)) return
    for (const [key, value] of Object.entries(merged)) {
      map.setPaintProperty(layerId, key as keyof LinePaint, value as never)
    }
    if (map.getLayer(hitId)) map.setPaintProperty(hitId, 'line-width', hitWidth)
    if (map.getLayer(casingId)) {
      map.setPaintProperty(casingId, 'line-color', casing ?? 'rgba(0,0,0,0)')
      map.setPaintProperty(casingId, 'line-width', casingSize)
      map.setPaintProperty(casingId, 'line-opacity', casing ? opacity : 0)
    }
  }, [casing, casingId, casingSize, hitId, hitWidth, isLoaded, layerId, map, merged, opacity])

  useEffect(() => {
    if (!isLoaded || !map || !interactive) return
    let hovered: string | number | null = null
    const setHover = (next: string | number | null) => {
      if (next === hovered) return
      if (hovered != null && map.getSource(sourceId)) {
        map.setFeatureState({ source: sourceId, id: hovered }, { hover: false })
      }
      hovered = next
      if (next != null && map.getSource(sourceId)) {
        map.setFeatureState({ source: sourceId, id: next }, { hover: true })
      }
    }
    const find = (featureId: string | number | undefined) =>
      latest.current.data.find((arc) => String(arc.id) === String(featureId))
    const move = (event: maplibre.MapLayerMouseEvent) => {
      const featureId = event.features?.[0]?.id as string | number | undefined
      if (featureId == null) return
      if (featureId !== hovered) {
        setHover(featureId)
        map.getCanvas().style.cursor = 'pointer'
      }
      const arc = find(featureId)
      if (!arc) return
      const next = { arc, longitude: event.lngLat.lng, latitude: event.lngLat.lat }
      latest.current.onHover?.(next)
      const label = resolveOverlay(latest.current.tooltip, String(arc.label ?? arc.id), next)
      if (!label) {
        setTip(null)
        return
      }
      setTip({ longitude: next.longitude, latitude: next.latitude, label })
    }
    const leave = () => {
      setHover(null)
      map.getCanvas().style.cursor = ''
      latest.current.onHover?.(null)
      setTip(null)
    }
    const click = (event: maplibre.MapLayerMouseEvent) => {
      const arc = find(event.features?.[0]?.id as string | number | undefined)
      if (!arc) return
      const next = { arc, longitude: event.lngLat.lng, latitude: event.lngLat.lat }
      latest.current.onClick?.(next)
      const body = resolveOverlay(latest.current.popover, String(arc.label ?? arc.id), next)
      if (body) setPop({ longitude: next.longitude, latitude: next.latitude, body })
    }
    map.on('mousemove', hitId, move)
    map.on('mouseleave', hitId, leave)
    map.on('click', hitId, click)
    return () => {
      map.off('mousemove', hitId, move)
      map.off('mouseleave', hitId, leave)
      map.off('click', hitId, click)
      setHover(null)
      setTip(null)
    }
  }, [hitId, interactive, isLoaded, map, sourceId])

  const ends = useMemo(() => {
    if (!markers && !renderMarker && !slots.marker) return []
    const seen = new Set<string>()
    const list: { key: string; arc: T; end: 'from' | 'to'; longitude: number; latitude: number }[] = []
    for (const arc of data) {
      for (const end of ['from', 'to'] as const) {
        const [longitude, latitude] = arc[end]
        const key = `${longitude.toFixed(5)},${latitude.toFixed(5)}`
        if (seen.has(key)) continue
        seen.add(key)
        list.push({ key, arc, end, longitude, latitude })
      }
    }
    return list
  }, [data, markers, renderMarker, slots.marker])

  return (
    <>
      <MapHover latitude={tip?.latitude ?? null} longitude={tip?.longitude ?? null}>
        {tip?.label}
      </MapHover>
      {pop ? (
        <MapPopup latitude={pop.latitude} longitude={pop.longitude} onClose={() => setPop(null)}>
          {pop.body}
        </MapPopup>
      ) : null}
      {ends.map((point) => {
        const markerNode = renderSlot(slots.marker, { ...point, ...(slotProps.marker as any) }) ?? (renderMarker ? renderMarker(point) : (
          <MarkerContent>
            <MarkerDot color={lineColor} size={Math.max(10, width + 8)} />
          </MarkerContent>
        ))
        return (
          <MapMarker
            key={point.key}
            latitude={point.latitude}
            longitude={point.longitude}
            tooltip={false}
            zIndex={1}
          >
            {markerNode}
          </MapMarker>
        )
      })}
    </>
  )
}

export const MapArc = createInterfaceComponent<MapArcProps<any>, MapArcSlots>(
  {
    name: 'MapArc',
    category: 'data',
    description: 'Spherical geodesic great-circle flight and connection arcs across 2D maps and 3D globes.',
    version: '1.0.0',
    props: {
      data: [],
      samples: 100,
      width: 2,
      opacity: 0.9,
      markers: false,
      fit: false,
      antimeridian: 'split',
      interactive: true,
    },
    slots: {
      marker: undefined,
    },
  },
  MapArcPrimitive
)
