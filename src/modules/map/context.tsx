import { createContext, useContext } from 'react'
import type * as maplibre from 'maplibre-gl'
import type { RouteAnchor } from './engine/types'

export interface MapContextValue {
  map: maplibre.Map | null
  isLoaded: boolean
  resolvedTheme: 'light' | 'dark'
  hideOccluded: boolean
  popoverOpen: boolean
  setPopoverOpen: (open: boolean) => void
  hoverTarget: string | null
  setHoverTarget: (target: string | null) => void
  legendState: Record<string, boolean>
  setLegendState: (key: string, expanded: boolean) => void
  autoRotate: boolean
  setAutoRotate: (rotating: boolean | ((prev: boolean) => boolean)) => void
  autoRotateSpeed: number
  setAutoRotateSpeed: (speed: number) => void
  isGlobe: boolean
}

export const MapContext = createContext<MapContextValue | null>(null)

export function useMap(): MapContextValue {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error('useMap must be used within <Map>')
  }
  return context
}

export interface MapLegendContextValue {
  isExpanded: boolean
  setIsExpanded: (expanded: boolean) => void
  toggle: () => void
  collapsible: boolean
}

export const MapLegendContext = createContext<MapLegendContextValue | null>(null)

export function useMapLegend(): MapLegendContextValue {
  const context = useContext(MapLegendContext)
  if (!context) {
    throw new Error('useMapLegend must be used within <MapLegend>')
  }
  return context
}

export interface MarkerContextValue {
  marker: maplibre.Marker
  map: maplibre.Map | null
}

export const MarkerContext = createContext<MarkerContextValue | null>(null)

export function useMarker(): MarkerContextValue {
  const context = useContext(MarkerContext)
  if (!context) {
    throw new Error('Marker parts must be used inside <MapMarker>')
  }
  return context
}

export interface RouteContextValue {
  id: string
  ready: boolean
  coordinates: [number, number][]
  traveled: [number, number][]
  progress: number | undefined
  color: string
  width: number
  opacity: number
  dashArray: [number, number] | undefined
  beforeId: string | undefined
  pointAt: (at: RouteAnchor) => [number, number] | null
  registerLayer: (id: string) => () => void
}

export const RouteContext = createContext<RouteContextValue | null>(null)

export function useRoute(): RouteContextValue {
  const context = useContext(RouteContext)
  if (!context) {
    throw new Error('Route parts must be used inside <MapRoute>')
  }
  return context
}
