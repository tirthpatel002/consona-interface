import React, { useState, useEffect, useMemo, useRef, useId, type ReactNode } from 'react'
import type * as maplibre from 'maplibre-gl'
import type * as GeoJSON from 'geojson'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap, SlotDefinition } from '../../../../core/types'
import { useMap } from '../../context'
import type { GeoBounds, ViewBox, MapGeoJSONEvent } from '../../engine/types'
import {
  sanitizeId,
  paintColor,
  hoverCase,
  fromSvg,
  isGeoJsonUrl,
  isSvgPath,
} from '../../engine/geometry'
import { layerExists } from '../map-route/map-route'
import { MapHover } from '../map-hover/map-hover'
import { MapPopup } from '../map-popup/map-popup'
import { resolveOverlay } from '../map-search/map-search'

type FillPaint = NonNullable<maplibre.FillLayerSpecification['paint']>
type LinePaint = NonNullable<maplibre.LineLayerSpecification['paint']>
type CirclePaint = NonNullable<maplibre.CircleLayerSpecification['paint']>

const EMPTY_COLLECTION: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

export function resolveData<P extends GeoJSON.GeoJsonProperties>(
  data: MapGeoJSONProps<P>['data'],
  bounds?: GeoBounds,
  viewBox?: string | ViewBox
): GeoJSON.FeatureCollection<GeoJSON.Geometry, P> | GeoJSON.Feature<GeoJSON.Geometry, P> | GeoJSON.Geometry | string {
  if (!data) return EMPTY_COLLECTION as GeoJSON.FeatureCollection<GeoJSON.Geometry, P>
  if (typeof data !== 'string') return data
  if (isSvgPath(data) && !isGeoJsonUrl(data)) {
    if (!bounds) return EMPTY_COLLECTION as GeoJSON.FeatureCollection<GeoJSON.Geometry, P>
    return fromSvg({ d: data, bounds, viewBox, properties: { id: 'shape' } }) as unknown as GeoJSON.Feature<GeoJSON.Geometry, P>
  }
  return data
}

export function asSourceData(data: ReturnType<typeof resolveData>): GeoJSON.FeatureCollection | string {
  if (!data) return EMPTY_COLLECTION
  if (typeof data === 'string' || (typeof data === 'object' && data !== null && 'type' in data && data.type === 'FeatureCollection')) {
    return data as GeoJSON.FeatureCollection | string
  }
  if (typeof data === 'object' && data !== null && 'type' in data && data.type === 'Feature') {
    return { type: 'FeatureCollection', features: [data as GeoJSON.Feature] }
  }
  if (typeof data === 'object' && data !== null && 'type' in data) {
    return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: data as GeoJSON.Geometry }] }
  }
  return EMPTY_COLLECTION
}

export interface MapGeoJSONSlots {}

export interface MapGeoJSONProps<P extends GeoJSON.GeoJsonProperties = GeoJSON.GeoJsonProperties> {
  /** GeoJSON feature collection, feature, geometry, SVG path string (d), or remote geojson URL */
  data: GeoJSON.FeatureCollection<GeoJSON.Geometry, P> | GeoJSON.Feature<GeoJSON.Geometry, P> | GeoJSON.Geometry | string
  /** Optional layer ID identifier */
  id?: string
  /** Feature property key promoted to feature ID for feature-state hovering */
  promoteId?: string
  /** Geographic bounding box for SVG path data: [[west, south], [east, north]] */
  bounds?: GeoBounds
  /** SVG viewBox definition */
  viewBox?: string | ViewBox
  /** Fill color token or hex */
  fill?: string
  /** Fill opacity (default: 0.32) */
  fillOpacity?: number
  /** Line stroke color */
  stroke?: string
  /** Line stroke width (default: 1) */
  strokeWidth?: number
  /** Point marker color */
  pointColor?: string
  /** Point marker size (default: 5) */
  pointSize?: number
  /** Custom fill paint properties or false to disable */
  fillPaint?: FillPaint | false
  /** Custom line paint properties or false to disable */
  linePaint?: LinePaint | false
  /** Custom circle paint properties or false to disable */
  circlePaint?: CirclePaint | false
  /** Hover fill paint properties for interactive state */
  fillHoverPaint?: FillPaint
  /** Callback fired on feature click */
  onClick?: (event: MapGeoJSONEvent<P>) => void
  /** Callback fired on feature hover */
  onHover?: (event: MapGeoJSONEvent<P> | null) => void
  /** Hover tooltip content */
  tooltip?: boolean | ReactNode | ((event: MapGeoJSONEvent<P>) => ReactNode)
  /** Click popover content */
  popover?: boolean | ReactNode | ((event: MapGeoJSONEvent<P>) => ReactNode)
  /** Whether the layer intercepts pointer events (default: false) */
  interactive?: boolean
  /** Existing layer ID to place this layer below */
  beforeId?: string
  /** Slot overrides */
  slots?: SlotComponents<MapGeoJSONSlots>
  /** Slot props overrides */
  slotProps?: SlotPropsMap<MapGeoJSONSlots>
}

function MapGeoJSONPrimitive<P extends GeoJSON.GeoJsonProperties = GeoJSON.GeoJsonProperties>({
  data,
  id: propId,
  promoteId,
  bounds,
  viewBox,
  fill,
  fillOpacity = 0.32,
  stroke,
  strokeWidth = 1,
  pointColor,
  pointSize = 5,
  fillPaint,
  linePaint,
  circlePaint,
  fillHoverPaint,
  onClick,
  onHover,
  tooltip = true,
  popover = false,
  interactive = false,
  beforeId,
  slots = {},
  slotProps = {},
}: MapGeoJSONProps<P>) {
  const { map, isLoaded, resolvedTheme } = useMap()
  const [tip, setTip] = useState<{ longitude: number; latitude: number; label: ReactNode } | null>(null)
  const [pop, setPop] = useState<{ longitude: number; latitude: number; body: ReactNode } | null>(null)
  const autoId = useId()
  const id = sanitizeId(propId ?? autoId)
  const sourceId = `geojson-source-${id}`
  const fillId = `geojson-fill-${id}`
  const lineId = `geojson-line-${id}`
  const circleId = `geojson-circle-${id}`
  const geojson = useMemo(() => {
    try {
      return asSourceData(resolveData(data, bounds, viewBox))
    } catch {
      return EMPTY_COLLECTION
    }
  }, [bounds, data, viewBox])
  const fallbackFill = resolvedTheme === 'dark' ? '#404040' : '#d4d4d4'
  const fallbackStroke = resolvedTheme === 'dark' ? '#171717' : '#ffffff'
  const showFill = fillPaint !== false
  const showLine = linePaint !== false
  const showCircle = circlePaint !== false
  const [sourceReady, setSourceReady] = useState(false)
  const fillStyle = useMemo(
    () =>
      hoverCase(
        {
          'fill-color': paintColor(fill, fallbackFill),
          'fill-opacity': fillOpacity,
          ...(fillPaint || {}),
        } as FillPaint,
        fillHoverPaint
      ),
    [fallbackFill, fill, fillHoverPaint, fillOpacity, fillPaint]
  )
  const lineStyle = useMemo(
    () =>
      ({
        'line-color': paintColor(stroke, fallbackStroke),
        'line-width': strokeWidth,
        ...(linePaint || {}),
      }) as LinePaint,
    [fallbackStroke, linePaint, stroke, strokeWidth]
  )
  const circleStyle = useMemo(
    () =>
      ({
        'circle-color': paintColor(pointColor ?? fill, fallbackFill),
        'circle-radius': pointSize,
        'circle-stroke-color': paintColor(stroke, fallbackStroke),
        'circle-stroke-width': Math.min(strokeWidth, 2),
        ...(circlePaint || {}),
      }) as CirclePaint,
    [circlePaint, fallbackFill, fallbackStroke, fill, pointColor, pointSize, stroke, strokeWidth]
  )
  const latest = useRef({ onClick, onHover, tooltip, popover })
  latest.current = { onClick, onHover, tooltip, popover }

  useEffect(() => {
    if (!isLoaded || !map) return
    map.addSource(sourceId, {
      type: 'geojson',
      data: geojson as never,
      generateId: !promoteId,
      ...(promoteId ? { promoteId } : {}),
    })
    setSourceReady(true)
    return () => {
      setSourceReady(false)
      try {
        if (map.getLayer(circleId)) map.removeLayer(circleId)
        if (map.getLayer(lineId)) map.removeLayer(lineId)
        if (map.getLayer(fillId)) map.removeLayer(fillId)
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
    source?.setData(geojson as never)
  }, [geojson, isLoaded, map, sourceId])

  useEffect(() => {
    if (!sourceReady || !map?.getSource(sourceId)) return
    const before = layerExists(map, beforeId)
    try {
      if (showFill && !map.getLayer(fillId)) {
        map.addLayer({ id: fillId, type: 'fill', source: sourceId, paint: fillStyle }, before)
      } else if (!showFill && map.getLayer(fillId)) {
        map.removeLayer(fillId)
      }
    } catch {
      /* invalid fill paint */
    }
    try {
      if (showLine && !map.getLayer(lineId)) {
        map.addLayer(
          {
            id: lineId,
            type: 'line',
            source: sourceId,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: lineStyle,
          },
          before
        )
      } else if (!showLine && map.getLayer(lineId)) {
        map.removeLayer(lineId)
      }
    } catch {
      /* invalid line paint */
    }
    try {
      if (showCircle && !map.getLayer(circleId)) {
        map.addLayer(
          {
            id: circleId,
            type: 'circle',
            source: sourceId,
            filter: ['==', '$type', 'Point'],
            paint: circleStyle,
          },
          before
        )
      } else if (!showCircle && map.getLayer(circleId)) {
        map.removeLayer(circleId)
      }
    } catch {
      /* invalid circle paint */
    }
    if (showFill && map.getLayer(fillId)) {
      for (const [key, value] of Object.entries(fillStyle)) map.setPaintProperty(fillId, key as keyof FillPaint, value as never)
    }
    if (showLine && map.getLayer(lineId)) {
      for (const [key, value] of Object.entries(lineStyle)) map.setPaintProperty(lineId, key as keyof LinePaint, value as never)
    }
    if (showCircle && map.getLayer(circleId)) {
      for (const [key, value] of Object.entries(circleStyle)) map.setPaintProperty(circleId, key as keyof CirclePaint, value as never)
    }
  }, [beforeId, circleId, circleStyle, fillId, fillStyle, lineId, lineStyle, map, showCircle, showFill, showLine, sourceId, sourceReady])

  useEffect(() => {
    if (!isLoaded || !map || !interactive || !showFill) return
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
    const payload = (event: maplibre.MapLayerMouseEvent, feature: maplibre.MapGeoJSONFeature): MapGeoJSONEvent<P> => ({
      feature: feature as unknown as GeoJSON.Feature<GeoJSON.Geometry, P>,
      longitude: event.lngLat.lng,
      latitude: event.lngLat.lat,
      originalEvent: event,
    })
    const move = (event: maplibre.MapLayerMouseEvent) => {
      const feature = event.features?.[0]
      if (!feature) return
      map.getCanvas().style.cursor = 'pointer'
      if (feature.id !== hovered) setHover(feature.id ?? null)
      const next = payload(event, feature)
      latest.current.onHover?.(next)
      const label = resolveOverlay(
        latest.current.tooltip,
        String(feature.properties?.name ?? feature.properties?.id ?? 'Area'),
        next
      )
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
      const feature = event.features?.[0]
      if (!feature) return
      const next = payload(event, feature)
      latest.current.onClick?.(next)
      const body = resolveOverlay(
        latest.current.popover,
        String(feature.properties?.name ?? feature.properties?.id ?? 'Area'),
        next
      )
      if (body) setPop({ longitude: next.longitude, latitude: next.latitude, body })
    }
    map.on('mousemove', fillId, move)
    map.on('mouseleave', fillId, leave)
    map.on('click', fillId, click)
    return () => {
      map.off('mousemove', fillId, move)
      map.off('mouseleave', fillId, leave)
      map.off('click', fillId, click)
      setHover(null)
      setTip(null)
    }
  }, [fillId, interactive, isLoaded, map, showFill, sourceId])

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
    </>
  )
}

export const MapGeoJSON = createInterfaceComponent<MapGeoJSONProps<any>, MapGeoJSONSlots>(
  {
    name: 'MapGeoJSON',
    category: 'data',
    description: 'Renders GeoJSON polygons, lines, points, and SVG shapes with interactive hovering, stroke styling, and fills.',
    version: '1.0.0',
    props: {
      data: EMPTY_COLLECTION,
      fillOpacity: 0.32,
      strokeWidth: 1,
      pointSize: 5,
      interactive: false,
    },
    slots: {},
  },
  MapGeoJSONPrimitive
)

export const { Context: GeoJSONContext, useCompoundContext: useGeoJSONContext } =
  createCompoundContext<any>('GeoJSON')
