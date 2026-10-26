import React, { useState, useEffect, useMemo, useRef, useId, type ReactNode } from 'react'
import type * as maplibre from 'maplibre-gl'
import type * as GeoJSON from 'geojson'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap, SlotDefinition } from '../../../../core/types'
import { useMap } from '../../context'
import { sanitizeId, paintColor, clusterFeatures } from '../../engine/geometry'
import { MapHover } from '../map-hover/map-hover'
import { MapPopup } from '../map-popup/map-popup'
import { MapMarker, MarkerContent, MarkerDot } from '../map-marker/map-marker'
import { resolveOverlay } from '../map-search/map-search'

export interface MapClusterItemSlotProps {
  id: string
  /** Custom longitude configuration. */
  longitude: number
  /** Custom latitude configuration. */
  latitude: number
  /** Custom count configuration. */
  count: number
  /** Descriptive text label displayed alongside the metric. */
  label: string
}

export interface MapClusterLayerSlots {
  /** Custom cluster marker slot */
  cluster?: SlotDefinition<MapClusterItemSlotProps>
}

export interface MapClusterLayerProps<P extends GeoJSON.GeoJsonProperties = GeoJSON.GeoJsonProperties> {
  /** Feature collection of points or geojson URL */
  data: string | GeoJSON.FeatureCollection<GeoJSON.Point, P>
  /** Maximum zoom level where clustering occurs (default: 14) */
  clusterMaxZoom?: number
  /** Pixel radius of cluster groupings (default: 50) */
  clusterRadius?: number
  /** Color scale tiers for small, medium, and large clusters */
  clusterColors?: [string, string, string]
  /** Point count thresholds for color scale tiers (default: [100, 750]) */
  clusterThresholds?: [number, number]
  /** Unclustered individual point fill color */
  pointColor?: string
  /** Unclustered point radius size (default: 5) */
  pointSize?: number
  /** Outer circle stroke color */
  stroke?: string
  /** Outer circle stroke width (default: 2) */
  strokeWidth?: number
  /** Callback fired on individual point click */
  onPointClick?: (feature: GeoJSON.Feature<GeoJSON.Point, P>, coordinates: [number, number]) => void
  /** Callback fired on cluster bubble click */
  onClusterClick?: (clusterId: number, coordinates: [number, number], pointCount: number) => void
  /** Tooltip overlay */
  tooltip?: boolean | ReactNode | ((item: { longitude: number; latitude: number; count: number; label: string }) => ReactNode)
  /** Popover overlay */
  popover?: boolean | ReactNode | ((item: { longitude: number; latitude: number; count: number; label: string }) => ReactNode)
  /** Custom cluster render function */
  renderCluster?: (item: { id: string; longitude: number; latitude: number; count: number; label: string }) => ReactNode
  /** Slot overrides */
  slots?: SlotComponents<MapClusterLayerSlots>
  /** Slot props overrides */
  slotProps?: SlotPropsMap<MapClusterLayerSlots>
}

function MapClusterLayerPrimitive<P extends GeoJSON.GeoJsonProperties = GeoJSON.GeoJsonProperties>({
  data,
  clusterMaxZoom = 14,
  clusterRadius = 50,
  clusterColors,
  clusterThresholds = [100, 750],
  pointColor,
  pointSize = 5,
  stroke,
  strokeWidth = 2,
  onPointClick,
  onClusterClick,
  tooltip = true,
  popover = false,
  renderCluster,
  slots = {},
  slotProps = {},
}: MapClusterLayerProps<P>) {
  const { map, isLoaded, resolvedTheme } = useMap()
  const id = sanitizeId(useId())
  const sourceId = `cluster-source-${id}`
  const clusterId = `clusters-${id}`
  const countId = `cluster-count-${id}`
  const pointId = `unclustered-${id}`
  const [, setView] = useState(0)
  const isGlobe = map?.getProjection()?.type === 'globe'
  const zoom = map?.getZoom() ?? 1
  const fallback = resolvedTheme === 'dark' ? '#fafafa' : '#171717'
  const overlay = resolvedTheme === 'dark' ? '#171717' : '#ffffff'
  const colors: [string, string, string] = [
    paintColor(clusterColors?.[0], fallback),
    paintColor(clusterColors?.[1], fallback),
    paintColor(clusterColors?.[2], fallback),
  ]
  const dot = paintColor(pointColor, fallback)
  const globeClusters = useMemo(() => {
    if (!isGlobe || typeof data === 'string') return []
    return clusterFeatures(data.features, zoom, clusterRadius, clusterMaxZoom)
  }, [clusterMaxZoom, clusterRadius, data, isGlobe, zoom])
  const [tip, setTip] = useState<{ longitude: number; latitude: number; label: ReactNode } | null>(null)
  const [pop, setPop] = useState<{ longitude: number; latitude: number; body: ReactNode } | null>(null)
  const overlayTooltip = useRef(tooltip)
  overlayTooltip.current = tooltip
  const overlayPopover = useRef(popover)
  overlayPopover.current = popover

  useEffect(() => {
    if (!map) return
    const bump = () => setView((value) => value + 1)
    map.on('zoom', bump)
    map.on('projectiontransition', bump)
    return () => {
      map.off('zoom', bump)
      map.off('projectiontransition', bump)
    }
  }, [map])

  useEffect(() => {
    if (!isLoaded || !map || isGlobe) return
    map.addSource(sourceId, { type: 'geojson', data, cluster: true, clusterMaxZoom, clusterRadius })
    map.addLayer({
      id: clusterId,
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          colors[0],
          clusterThresholds[0],
          colors[1],
          clusterThresholds[1],
          colors[2],
        ],
        'circle-radius': ['step', ['get', 'point_count'], 18, clusterThresholds[0], 26, clusterThresholds[1], 34],
        'circle-stroke-width': 1,
        'circle-stroke-color': overlay,
        'circle-opacity': 0.9,
      },
    })
    map.addLayer({
      id: countId,
      type: 'symbol',
      source: sourceId,
      filter: ['has', 'point_count'],
      layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 11 },
      paint: { 'text-color': overlay },
    })
    map.addLayer({
      id: pointId,
      type: 'circle',
      source: sourceId,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': dot,
        'circle-radius': pointSize,
        'circle-stroke-width': strokeWidth,
        'circle-stroke-color': paintColor(stroke, overlay),
      },
    })
    return () => {
      try {
        if (map.getLayer(countId)) map.removeLayer(countId)
        if (map.getLayer(pointId)) map.removeLayer(pointId)
        if (map.getLayer(clusterId)) map.removeLayer(clusterId)
        if (map.getSource(sourceId)) map.removeSource(sourceId)
      } catch {
        /* style reload */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGlobe, isLoaded, map])

  useEffect(() => {
    if (!isLoaded || !map || typeof data === 'string') return
    const source = map.getSource(sourceId) as maplibre.GeoJSONSource | undefined
    source?.setData(data)
  }, [data, isLoaded, map, sourceId])

  useEffect(() => {
    if (!isLoaded || !map?.getLayer(pointId)) return
    map.setPaintProperty(pointId, 'circle-color', dot)
    map.setPaintProperty(pointId, 'circle-radius', pointSize)
    map.setPaintProperty(pointId, 'circle-stroke-width', strokeWidth)
    map.setPaintProperty(pointId, 'circle-stroke-color', paintColor(stroke, overlay))
    if (map.getLayer(clusterId)) {
      map.setPaintProperty(clusterId, 'circle-color', [
        'step',
        ['get', 'point_count'],
        colors[0],
        clusterThresholds[0],
        colors[1],
        clusterThresholds[1],
        colors[2],
      ])
      map.setPaintProperty(clusterId, 'circle-stroke-color', overlay)
    }
  }, [clusterId, clusterThresholds, colors, dot, isLoaded, map, overlay, pointId, pointSize, stroke, strokeWidth])

  useEffect(() => {
    if (!isLoaded || !map || isGlobe) return
    const clusterClick = async (event: maplibre.MapMouseEvent) => {
      const feature = map.queryRenderedFeatures(event.point, { layers: [clusterId] })[0]
      if (!feature) return
      const idValue = feature.properties?.cluster_id as number
      const count = feature.properties?.point_count as number
      const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [number, number]
      const item = { longitude: coordinates[0], latitude: coordinates[1], count, label: `${count} points` }
      const body = resolveOverlay(overlayPopover.current, item.label, item)
      if (body) setPop({ longitude: item.longitude, latitude: item.latitude, body })
      if (onClusterClick) {
        onClusterClick(idValue, coordinates, count)
        return
      }
      if (body) return
      const source = map.getSource(sourceId) as maplibre.GeoJSONSource
      const zoomLevel = await source.getClusterExpansionZoom(idValue)
      map.easeTo({ center: coordinates, zoom: zoomLevel })
    }
    const pointClick = (event: maplibre.MapLayerMouseEvent) => {
      const feature = event.features?.[0]
      if (!feature) return
      const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [number, number]
      const item = {
        longitude: coordinates[0],
        latitude: coordinates[1],
        count: 1,
        label: String(feature.properties?.name ?? 'Point'),
      }
      const body = resolveOverlay(overlayPopover.current, item.label, item)
      if (body) setPop({ longitude: item.longitude, latitude: item.latitude, body })
      onPointClick?.(feature as unknown as GeoJSON.Feature<GeoJSON.Point, P>, coordinates)
    }
    const hoverFeature = (event: maplibre.MapLayerMouseEvent) => {
      const feature = event.features?.[0]
      if (!feature) return
      map.getCanvas().style.cursor = 'pointer'
      const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [number, number]
      const count = (feature.properties?.point_count as number | undefined) ?? 1
      const label = count > 1 ? `${count} points` : String(feature.properties?.name ?? 'Point')
      const item = { longitude: coordinates[0], latitude: coordinates[1], count, label }
      const body = resolveOverlay(overlayTooltip.current, label, item)
      if (!body) {
        setTip(null)
        return
      }
      setTip({ longitude: item.longitude, latitude: item.latitude, label: body })
    }
    const reset = () => {
      map.getCanvas().style.cursor = ''
      setTip(null)
    }
    map.on('click', clusterId, clusterClick)
    map.on('click', pointId, pointClick)
    map.on('mousemove', clusterId, hoverFeature)
    map.on('mouseleave', clusterId, reset)
    map.on('mousemove', pointId, hoverFeature)
    map.on('mouseleave', pointId, reset)
    return () => {
      map.off('click', clusterId, clusterClick)
      map.off('click', pointId, pointClick)
      map.off('mousemove', clusterId, hoverFeature)
      map.off('mouseleave', clusterId, reset)
      map.off('mousemove', pointId, hoverFeature)
      map.off('mouseleave', pointId, reset)
      setTip(null)
    }
  }, [clusterId, isGlobe, isLoaded, map, onClusterClick, onPointClick, pointId, sourceId])

  if (isGlobe) {
    return (
      <>
        {globeClusters.map((item) => {
          const size =
            item.count === 1
              ? Math.max(12, pointSize * 2)
              : item.count < clusterThresholds[0]
                ? 28
                : item.count < clusterThresholds[1]
                  ? 34
                  : 42
          const fill = item.count === 1 ? dot : item.count < clusterThresholds[0] ? colors[0] : item.count < clusterThresholds[1] ? colors[1] : colors[2]
          const tipNode = resolveOverlay(tooltip, item.label, item)
          const bubble = resolveOverlay(popover, item.label, item)
          const clusterContent = renderSlot(slots.cluster, { ...item, ...(slotProps.cluster as any) }) ?? (renderCluster ? renderCluster(item) : (
            <MarkerContent>
              <MarkerDot color={fill} size={size} stroke={paintColor(stroke, overlay)}>
                {item.count > 1 ? item.count : null}
              </MarkerDot>
            </MarkerContent>
          ))
          return (
            <MapMarker
              key={item.id}
              latitude={item.latitude}
              longitude={item.longitude}
              popover={bubble ?? false}
              tooltip={tipNode ?? false}
              zIndex={8}
              onClick={() => {
                if (item.count > 1) {
                  onClusterClick?.(Number(item.id.replace(/\D/g, '') || 0), [item.longitude, item.latitude], item.count)
                  map?.easeTo({ center: [item.longitude, item.latitude], zoom: zoom + 1.6 })
                  return
                }
              }}
            >
              {clusterContent}
            </MapMarker>
          )
        })}
      </>
    )
  }

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

export const MapClusterLayer = createInterfaceComponent<MapClusterLayerProps<any>, MapClusterLayerSlots>(
  {
    name: 'MapClusterLayer',
    category: 'data',
    description: 'Dynamic geographic point clustering with tiered color thresholds, expansion zoom, and 3D globe fallbacks.',
    version: '1.0.0',
    props: {
      data: { type: 'FeatureCollection', features: [] },
      clusterMaxZoom: 14,
      clusterRadius: 50,
      clusterThresholds: [100, 750],
      pointSize: 5,
      strokeWidth: 2,
    },
    slots: {
      cluster: undefined,
    },
  },
  MapClusterLayerPrimitive
)

export const { Context: GeoJSONContext, useCompoundContext: useGeoJSONContext } =
  createCompoundContext<any>('GeoJSON')
