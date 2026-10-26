import React, { useMemo } from 'react'
import type * as GeoJSON from 'geojson'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import type { GeoBounds, ViewBox } from '../../engine/types'
import { fromSvg } from '../../engine/geometry'
import { renderSlot } from '../../../../core/slot-resolver'
import { MapGeoJSON, type MapGeoJSONProps } from '../map-geojson/map-geojson'

const EMPTY_COLLECTION: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

export interface MapShapeSlots {
  /** GeoJSON rendering layer slot */
  geojson?: React.ComponentType<MapGeoJSONProps<any>>
}

export interface MapShapeProps<P extends GeoJSON.GeoJsonProperties = GeoJSON.GeoJsonProperties>
  extends Omit<MapGeoJSONProps<P>, 'data'> {
  /** SVG path definition string (e.g. "M10 10 H 90 V 90 H 10 L 10 10 Z") */
  d: string
  /** Geographic bounding box to project the SVG path into: [[west, south], [east, north]] */
  bounds: GeoBounds
  /** SVG viewBox specification */
  viewBox?: string | ViewBox
  /** Curve sampling density for Bezier and Arc commands */
  samples?: number
  /** Custom feature properties */
  properties?: P
  /** Slot overrides */
  slots?: SlotComponents<MapShapeSlots>
  /** Slot props overrides */
  slotProps?: SlotPropsMap<MapShapeSlots>
}

function MapShapePrimitive<P extends GeoJSON.GeoJsonProperties = GeoJSON.GeoJsonProperties>({
  d,
  bounds,
  viewBox,
  samples,
  properties,
  slots,
  slotProps,
  ...props
}: MapShapeProps<P>) {
  const data = useMemo(() => {
    try {
      return fromSvg({ d, bounds, viewBox, samples, properties: { id: 'shape', ...(properties as any) } })
    } catch {
      return EMPTY_COLLECTION
    }
  }, [bounds, d, properties, samples, viewBox])

  return renderSlot(
    slots?.geojson,
    {
      ...props,
      bounds,
      data: data as GeoJSON.Feature<GeoJSON.Geometry, P>,
      viewBox,
      ...(slotProps?.geojson as object),
    },
    {
      defaultComponent: MapGeoJSON,
    }
  )
}

export const MapShape = createInterfaceComponent<MapShapeProps<any>, MapShapeSlots>(
  {
    name: 'MapShape',
    category: 'data',
    description: 'Projects arbitrary SVG vector path geometry onto real-world geographic coordinates.',
    version: '1.0.0',
    props: {
      d: '',
      bounds: [[-180, -90], [180, 90]],
    },
    slots: {
      geojson: MapGeoJSON,
    },
  },
  MapShapePrimitive
)

export const { Context: GeoJSONContext, useCompoundContext: useGeoJSONContext } =
  createCompoundContext<any>('GeoJSON')
