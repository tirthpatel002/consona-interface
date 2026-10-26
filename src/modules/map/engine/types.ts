import type * as GeoJSON from 'geojson'
import type * as maplibre from 'maplibre-gl'

/** Geographic bounding box: [[west, south], [east, north]]. */
export type GeoBounds = [[number, number], [number, number]]

/** SVG view box definition: [minX, minY, width, height]. */
export type ViewBox = [number, number, number, number]

/** Map camera viewport state. */
export interface MapViewport {
  /** Longitude and latitude of the camera center. */
  center: [number, number]
  /** Zoom level of the camera. */
  zoom: number
  /** Bearing angle in degrees. */
  bearing: number
  /** Pitch / tilt angle in degrees. */
  pitch: number
}

/** Tile / vector style specification or stylesheet URL. */
export type MapStyleOption = string | maplibre.StyleSpecification

/** MapLibre map instance reference. */
export type MapRef = maplibre.Map

/** Universal overlay render target (boolean, node, or render function). */
export type MapOverlay<T = unknown> = boolean | unknown | ((value: T) => unknown)

/** Paint configuration for vector stroke rendering. */
export interface MapLineStyle {
  /** Stroke color token or hex string. */
  color?: string
  /** Stroke width in pixels. */
  width?: number
  /** Stroke opacity from 0.0 to 1.0. */
  opacity?: number
  /** Dash pattern array: [dashLength, gapLength]. */
  dashArray?: [number, number]
  /** Outer casing line color. */
  casingColor?: string
  /** Outer casing stroke width in pixels. */
  casingWidth?: number
  /** Line end cap style. */
  lineCap?: 'butt' | 'round' | 'square'
  /** Line join style. */
  lineJoin?: 'bevel' | 'round' | 'miter'
}

/** Route anchor position on a travel line. */
export type RouteAnchor = 'start' | 'end' | 'progress' | number

/** Route distance calculation metrics. */
export interface RouteMeasure {
  /** Cumulative distances per vertex. */
  cumulative: number[]
  /** Total route length in projected units. */
  total: number
}

/** Checkpoint along a path. */
export interface MapCheckpoint {
  /** Unique checkpoint identifier. */
  id?: string | number
  /** Longitude coordinate. */
  longitude: number
  /** Latitude coordinate. */
  latitude: number
  /** Text label or badge representation. */
  label?: any
  /** Tooltip content on hover. */
  tooltip?: any
}

/** Context passed to checkpoint renderer functions. */
export interface MapCheckpointContext {
  /** The checkpoint datum. */
  checkpoint: MapCheckpoint
  /** Position index in the checkpoint array. */
  index: number
  /** Role along the path: start point, intermediate stop, or destination. */
  role: 'start' | 'via' | 'end'
  /** Total number of checkpoints in the route. */
  total: number
}

/** Routing profile for road calculations. */
export type MapPathProfile = 'driving' | 'walking' | 'cycling'

/** Computed path result from routing engine. */
export interface MapPathRoute {
  /** GeoJSON coordinates line string. */
  coordinates: [number, number][]
  /** Total distance in meters. */
  distance: number
  /** Estimated duration in seconds. */
  duration: number
  /** Travel profile mode. */
  profile: MapPathProfile | 'straight'
  /** Computed waypoints along the route. */
  waypoints: { longitude: number; latitude: number; name?: string }[]
}

/** Map feature interaction event payload. */
export interface MapGeoJSONEvent<P extends GeoJSON.GeoJsonProperties = GeoJSON.GeoJsonProperties> {
  /** The target GeoJSON feature. */
  feature: GeoJSON.Feature<GeoJSON.Geometry, P>
  /** Longitude coordinate of the cursor. */
  longitude: number
  /** Latitude coordinate of the cursor. */
  latitude: number
  /** Original maplibre mouse event. */
  originalEvent: maplibre.MapLayerMouseEvent
}

/** Flight / connection arc datum between two geographic coordinates. */
export interface MapArcDatum {
  /** Unique arc identifier. */
  id: string | number
  /** Origin coordinate: [longitude, latitude]. */
  from: [number, number]
  /** Destination coordinate: [longitude, latitude]. */
  to: [number, number]
  /** Optional hover/tooltip label. */
  label?: string
  [key: string]: unknown
}

/** Place search result item from geocoding engine. */
export interface MapSearchResult {
  /** Unique place identifier. */
  id: string
  /** Human-readable place name. */
  label: string
  /** Secondary address or hierarchy details. */
  detail?: string
  /** Longitude coordinate. */
  longitude: number
  /** Latitude coordinate. */
  latitude: number
}
