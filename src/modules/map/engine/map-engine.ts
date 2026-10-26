import { BaseEngine } from '../../../core/engine'
import type {
  MapViewport,
  MapPathProfile,
  MapPathRoute,
  MapSearchResult,
  MapCheckpoint,
} from './types'
import { densifyCheckpoints } from './geometry'

export interface MapEngineState {
  /** Active camera viewport */
  viewport: MapViewport
  /** Whether the map style and canvas are fully loaded */
  isLoaded: boolean
  /** Whether the vector style is ready for layer injection */
  styleReady: boolean
  /** Active theme name */
  theme: 'light' | 'dark'
  /** Whether occlusion culling is active */
  hideOccluded: boolean
  /** Currently selected search result or marker ID */
  selectedId: string | null
  /** Currently hovered feature identifier */
  hoveredId: string | number | null
  /** Whether global popover is currently active */
  popoverOpen: boolean
}

export interface MapEngineOptions {
  /** Initial viewport center, zoom, bearing, pitch */
  initialViewport?: Partial<MapViewport>
  /** Initial theme */
  theme?: 'light' | 'dark'
  /** Initial occlusion culling flag */
  hideOccluded?: boolean
}

/**
 * Pure TypeScript Engine managing map state, camera tracking, and geospatial events.
 * Zero React dependencies.
 */
export class MapEngine extends BaseEngine<MapEngineState> {
  constructor(options: MapEngineOptions = {}) {
    super({
      viewport: {
        center: options.initialViewport?.center ?? [-73.9857, 40.7484],
        zoom: options.initialViewport?.zoom ?? 11.4,
        bearing: options.initialViewport?.bearing ?? 0,
        pitch: options.initialViewport?.pitch ?? 0,
      },
      isLoaded: false,
      styleReady: false,
      theme: options.theme ?? 'light',
      hideOccluded: options.hideOccluded ?? true,
      selectedId: null,
      hoveredId: null,
      popoverOpen: false,
    })
  }

  public setViewport(viewport: Partial<MapViewport>) {
    const current = this.state.viewport
    const next: MapViewport = {
      center: viewport.center ?? current.center,
      zoom: viewport.zoom ?? current.zoom,
      bearing: viewport.bearing ?? current.bearing,
      pitch: viewport.pitch ?? current.pitch,
    }
    this.setState({ viewport: next })
    this.emit('map:viewportChange', next)
  }

  public setLoaded(isLoaded: boolean) {
    this.setState({ isLoaded })
    this.emit('map:load', { isLoaded })
  }

  public setStyleReady(styleReady: boolean) {
    this.setState({ styleReady })
    this.emit('map:styleReady', { styleReady })
  }

  public setTheme(theme: 'light' | 'dark') {
    this.setState({ theme })
    this.emit('map:themeChange', { theme })
  }

  public setSelected(selectedId: string | null) {
    this.setState({ selectedId })
    this.emit('map:select', { selectedId })
  }

  public setHovered(hoveredId: string | number | null) {
    this.setState({ hoveredId })
    this.emit('map:hover', { hoveredId })
  }

  public setPopoverOpen(popoverOpen: boolean) {
    this.setState({ popoverOpen })
    this.emit('map:popover', { popoverOpen })
  }
}

/**
 * Searches places via geocoding service.
 */
export async function searchPlaces(
  query: string,
  options?: { limit?: number; latitude?: number; longitude?: number; signal?: AbortSignal }
): Promise<MapSearchResult[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []
  const params = new URLSearchParams({ q: trimmed, limit: String(options?.limit ?? 6) })
  if (options?.latitude != null && options?.longitude != null) {
    params.set('lat', String(options.latitude))
    params.set('lon', String(options.longitude))
  }
  const response = await fetch(`https://photon.komoot.io/api/?${params}`, { signal: options?.signal })
  if (!response.ok) throw new Error('Place search failed')
  const payload = (await response.json()) as {
    features?: {
      geometry?: { coordinates?: number[] }
      properties?: { osm_id?: number; osm_type?: string; name?: string; street?: string; city?: string; state?: string; country?: string }
    }[]
  }
  const results: MapSearchResult[] = []
  for (const [index, feature] of (payload.features ?? []).entries()) {
    const [longitude, latitude] = feature.geometry?.coordinates ?? []
    if (longitude == null || latitude == null) continue
    const props = feature.properties ?? {}
    const detail = [props.street, props.city, props.state, props.country].filter(Boolean).join(', ')
    results.push({
      id: `${props.osm_type ?? 'p'}-${props.osm_id ?? index}`,
      label: props.name || detail || `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`,
      detail: props.name ? detail : undefined,
      longitude,
      latitude,
    })
  }
  return results
}

/**
 * Calculates road routing geometry using OSRM routing engine.
 */
export async function fetchRoadPath(
  checkpoints: MapCheckpoint[],
  options?: { profile?: MapPathProfile; routerUrl?: string; signal?: AbortSignal }
): Promise<MapPathRoute> {
  if (checkpoints.length < 2) {
    return {
      coordinates: checkpoints.map((point) => [point.longitude, point.latitude]),
      distance: 0,
      duration: 0,
      profile: options?.profile ?? 'driving',
      waypoints: checkpoints.map((point) => ({ longitude: point.longitude, latitude: point.latitude })),
    }
  }
  const profile = options?.profile ?? 'driving'
  const base = (options?.routerUrl ?? 'https://router.project-osrm.org').replace(/\/$/, '')
  const path = checkpoints.map((point) => `${point.longitude},${point.latitude}`).join(';')
  const response = await fetch(
    `${base}/route/v1/${profile}/${path}?overview=full&geometries=geojson&steps=false`,
    { signal: options?.signal }
  )
  if (!response.ok) throw new Error('Path request failed')
  const payload = (await response.json()) as {
    code?: string
    routes?: { distance: number; duration: number; geometry?: { coordinates?: [number, number][] } }[]
    waypoints?: { location?: [number, number]; name?: string }[]
  }
  const route = payload.routes?.[0]
  const coordinates = route?.geometry?.coordinates
  if (payload.code !== 'Ok' || !route || !coordinates?.length) throw new Error(payload.code ?? 'No path')
  return {
    coordinates,
    distance: route.distance,
    duration: route.duration,
    profile,
    waypoints: (payload.waypoints ?? []).map((waypoint, index) => ({
      longitude: waypoint.location?.[0] ?? checkpoints[index]?.longitude ?? 0,
      latitude: waypoint.location?.[1] ?? checkpoints[index]?.latitude ?? 0,
      name: waypoint.name,
    })),
  }
}
