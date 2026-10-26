declare module '*?raw' {
  const content: string
  export default content
}

declare module '*.wgsl' {
  const content: string
  export default content
}

declare module '*.wgsl?raw' {
  const content: string
  export default content
}

declare module 'maplibre-gl' {
  export interface MarkerOptions {
    [key: string]: any
  }
  export interface PopupOptions {
    [key: string]: any
  }
  export interface FitBoundsOptions {
    [key: string]: any
  }
  export interface MapOptions {
    [key: string]: any
  }
  export type ControlPosition = any
  export type ProjectionSpecification = any
  export type StyleSpecification = any
  export type FillLayerSpecification = { paint?: any }
  export type LineLayerSpecification = { paint?: any }
  export type CircleLayerSpecification = { paint?: any }
  export type GeoJSONSource = any
  export type MapGeoJSONFeature = any
  export type MapLayerMouseEvent = any
  export type MapMouseEvent = any
  export type LngLat = any
  export type LngLatBounds = any
  export type Map = any
  export type Marker = any
  export type Popup = any
  export type AttributionControl = any
  export const Marker: any
  export const Popup: any
  export const Map: any
  export const LngLat: any
  export const LngLatBounds: any
  export const AttributionControl: any
  export const getWorkerUrl: any
  export const setWorkerUrl: any
  export const getVersion: any
  const content: any
  export default content
}

declare module 'geojson' {
  export type Feature<G = any, P = any> = any
  export type FeatureCollection<G = any, P = any> = any
  export type Geometry = any
  export type GeoJsonProperties = Record<string, any> | null | undefined
  export type Position = number[]
  export type Point = any
  export type MultiPoint = any
  export type LineString = any
  export type MultiLineString = any
  export type Polygon = any
  export type MultiPolygon = any
  export type GeometryCollection = any
  export type BBox = number[]
  export type GeoJsonObject = any
  const content: any
  export default content
}
