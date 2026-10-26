import React, {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import * as maplibre from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import { cn } from '../../../../core/cn'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Loader } from '../../../core/components/loader'
import { MapContext } from '../../context'
import type { MapViewport, MapStyleOption, MapRef } from '../../engine/types'
import { MapControls, type MapControlsProps } from '../map-controls/map-controls'
import { MapLegend } from '../map-legend/map-legend'
import {
  MapMarker,
  MarkerContent,
  MarkerPin,
  MarkerDot,
  MarkerPopup,
  MarkerTooltip,
  MarkerLabel,
} from '../map-marker/map-marker'
import { MapPopup } from '../map-popup/map-popup'
import { MapHover } from '../map-hover/map-hover'
import { MapSearch } from '../map-search/map-search'
import { MapRoute, RouteProgress, RouteMarker } from '../map-route/map-route'
import { MapPath } from '../map-path/map-path'
import { MapGeoJSON } from '../map-geojson/map-geojson'
import { MapShape } from '../map-shape/map-shape'
import { MapArc } from '../map-arc/map-arc'
import { MapClusterLayer } from '../map-cluster-layer/map-cluster-layer'
import { useTheme } from '../../../../theme/theme-provider'
try {
  if (typeof window !== 'undefined' && !maplibre.getWorkerUrl()) {
    maplibre.setWorkerUrl(
      `https://unpkg.com/maplibre-gl@${maplibre.getVersion()}/dist/maplibre-gl-worker.mjs`
    )
  }
} catch {
  /* bundler already wired the worker */
}

export const MAP_STYLES = {
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
} as const

const BLANK_STYLE: maplibre.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': 'rgba(0,0,0,0)' } }],
}

function readViewport(map: maplibre.Map): MapViewport {
  const center = map.getCenter()
  return {
    center: [center.lng, center.lat],
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
  }
}

/* ==========================================================================
   Map Slots & Props Interfaces
   ========================================================================== */

export interface MapSlots {
  /** On-map navigation controls stack */
  controls?: React.ComponentType<MapControlsProps>
  /** Loading overlay placeholder */
  loader?: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
}

export interface MapProps extends Omit<maplibre.MapOptions, 'container' | 'style'> {
  /** Child overlays, layers, markers, and controls */
  children?: ReactNode
  /** Custom CSS classes */
  className?: string
  /** Theme-specific stylesheet overrides */
  styles?: { light?: MapStyleOption; dark?: MapStyleOption }
  /** Direct map style specification or tile URL */
  mapStyle?: MapStyleOption
  /** Whether to render a transparent canvas without basemap tiles */
  blank?: boolean
  /** Map projection specification (e.g. { type: 'globe' }) */
  projection?: maplibre.ProjectionSpecification
  /** Controlled or initial camera viewport state */
  viewport?: Partial<MapViewport>
  /** Callback fired whenever the camera viewport changes */
  onViewportChange?: (viewport: MapViewport) => void
  /** Whether data is actively loading */
  loading?: boolean
  /** Whether default navigation controls should be mounted */
  controls?: boolean
  /** Whether the globe or map rotates slowly automatically around its axis (default: false) */
  autoRotate?: boolean
  /** Auto-rotation speed in degrees per second (default: 6, negative reverses direction) */
  autoRotateSpeed?: number
  /** Whether user drag/zoom gestures temporarily pause auto-rotation (default: true) */
  pauseOnInteraction?: boolean
  /** Inactivity delay in ms before auto-rotation resumes after user interaction (default: 2500) */
  resumeDelay?: number
  /** Callback fired when auto-rotation state changes */
  onAutoRotateChange?: (rotating: boolean) => void
  /** Fades the WebGL globe / basemap opacity while keeping HTML markers full strength (default: 1) */
  globeOpacity?: number
  /** Culls occluded markers and popovers on the far side of the 3D globe (default: true) */
  hideOccluded?: boolean
  /** Corner placement for the required Carto/OSM attribution badge */
  attributionPosition?: maplibre.ControlPosition
  /** Inner corner radius of attribution badge in px or CSS token (default: 8) */
  attributionRadius?: number | string
  /** Ref forwarded to underlying maplibre Map instance */
  ref?: React.Ref<MapRef>
  /** Slot overrides for controls and loaders */
  slots?: SlotComponents<MapSlots>
  /** Slot props overrides */
  slotProps?: SlotPropsMap<MapSlots>
}

/* ==========================================================================
   Map Primitive
   ========================================================================== */

function MapPrimitive(
  {
    children,
    className,
    styles,
    mapStyle,
    blank = false,
    projection,
    viewport,
    onViewportChange,
    loading = false,
    controls = true,
    autoRotate: autoRotateProp,
    autoRotateSpeed: autoRotateSpeedProp = 24,
    pauseOnInteraction = true,
    resumeDelay = 2500,
    onAutoRotateChange,
    globeOpacity = 1,
    hideOccluded = true,
    attributionControl = { compact: true },
    attributionPosition = 'bottom-right',
    attributionRadius = 8,
    cooperativeGestures = false,
    renderWorldCopies = false,
    trackResize = true,
    slots = {},
    slotProps = {},
    ref,
    ...options
  }: MapProps
) {
  const { resolvedMode } = useTheme()
  const shellRef = useRef<HTMLDivElement>(null)
  const [instance, setInstance] = useState<maplibre.Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [styleReady, setStyleReady] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [hoverTarget, setHoverTarget] = useState<string | null>(null)
  const syncingRef = useRef(false)
  const styleRef = useRef<MapStyleOption | null>(null)
  const onMoveRef = useRef(onViewportChange)
  onMoveRef.current = onViewportChange

  const isGlobe = projection?.type === 'globe'
  const [autoRotateState, setAutoRotateState] = useState(autoRotateProp ?? false)
  const [speedState, setSpeedState] = useState(autoRotateSpeedProp ?? 6)
  const userInteractingRef = useRef(false)
  const resumeTimerRef = useRef<number | null>(null)
  const currentLngRef = useRef<number>(0)
  const currentLatRef = useRef<number>(0)

  const syncCoordinatesFromCenter = useCallback(() => {
    if (!instance) return
    const center = instance.getCenter()
    if (center) {
      currentLngRef.current = center.lng
      currentLatRef.current = center.lat
    }
  }, [instance])

  const setAutoRotate = useCallback(
    (val: boolean | ((prev: boolean) => boolean)) => {
      setAutoRotateState((prev) => {
        const next = typeof val === 'function' ? val(prev) : val
        userInteractingRef.current = false
        if (next) {
          syncCoordinatesFromCenter()
        }
        onAutoRotateChange?.(next)
        return next
      })
    },
    [onAutoRotateChange, syncCoordinatesFromCenter]
  )

  useEffect(() => {
    if (autoRotateProp !== undefined) {
      setAutoRotateState(autoRotateProp)
    }
  }, [autoRotateProp])

  useEffect(() => {
    if (autoRotateSpeedProp !== undefined) {
      setSpeedState(autoRotateSpeedProp)
    }
  }, [autoRotateSpeedProp])

  useEffect(() => {
    if (!instance) return

    const pause = () => {
      userInteractingRef.current = true
      if (resumeTimerRef.current) {
        window.clearTimeout(resumeTimerRef.current)
        resumeTimerRef.current = null
      }
    }

    const resume = () => {
      if (!pauseOnInteraction) return
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current)
      resumeTimerRef.current = window.setTimeout(() => {
        syncCoordinatesFromCenter()
        userInteractingRef.current = false
      }, resumeDelay)
    }

    instance.on('dragstart', pause)
    instance.on('dragend', resume)
    instance.on('rotatestart', pause)
    instance.on('rotateend', resume)
    instance.on('pitchstart', pause)
    instance.on('pitchend', resume)
    instance.on('boxzoomstart', pause)
    instance.on('boxzoomend', resume)
    instance.on('touchstart', pause)
    instance.on('touchend', resume)
    instance.on('wheel', pause)

    return () => {
      instance.off('dragstart', pause)
      instance.off('dragend', resume)
      instance.off('rotatestart', pause)
      instance.off('rotateend', resume)
      instance.off('pitchstart', pause)
      instance.off('pitchend', resume)
      instance.off('boxzoomstart', pause)
      instance.off('boxzoomend', resume)
      instance.off('touchstart', pause)
      instance.off('touchend', resume)
      instance.off('wheel', pause)
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current)
    }
  }, [instance, pauseOnInteraction, resumeDelay, syncCoordinatesFromCenter])

  useEffect(() => {
    if (!instance || !autoRotateState) return

    syncCoordinatesFromCenter()
    userInteractingRef.current = false
    let animationFrameId: number
    let lastTime = performance.now()

    const frame = (time: number) => {
      const delta = Math.min((time - lastTime) / 1000, 0.1)
      lastTime = time

      if (!userInteractingRef.current) {
        currentLngRef.current += speedState * delta
        while (currentLngRef.current > 180) currentLngRef.current -= 360
        while (currentLngRef.current < -180) currentLngRef.current += 360

        syncingRef.current = true
        instance.jumpTo({ center: [currentLngRef.current, currentLatRef.current] })
        syncingRef.current = false
      }

      animationFrameId = requestAnimationFrame(frame)
    }

    animationFrameId = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [instance, autoRotateState, speedState, syncCoordinatesFromCenter])

  const themeStyle = useMemo<MapStyleOption>(() => {
    if (mapStyle) return mapStyle
    if (styles) return styles[resolvedMode] ?? MAP_STYLES[resolvedMode]
    if (blank) return BLANK_STYLE
    return MAP_STYLES[resolvedMode]
  }, [blank, mapStyle, resolvedMode, styles])

  useImperativeHandle(ref, () => instance as maplibre.Map, [instance])

  useEffect(() => {
    const node = shellRef.current
    if (!node) return

    styleRef.current = themeStyle
    const map = new maplibre.Map({
      container: node,
      style: themeStyle,
      attributionControl: false,
      cooperativeGestures,
      renderWorldCopies,
      trackResize,
      center: [-73.9857, 40.7484],
      zoom: 11.4,
      ...options,
      ...viewport,
      ...(projection ? { projection } : {}),
    })
    if (attributionControl) {
      const control = new maplibre.AttributionControl(
        typeof attributionControl === 'object' ? { compact: true, ...attributionControl } : { compact: true }
      )
      map.addControl(control, attributionPosition)
      const badge = map.getContainer().querySelector('.maplibregl-ctrl-attrib')
      badge?.classList.add('maplibregl-compact')
      badge?.classList.remove('maplibregl-compact-show')
    }

    const onLoad = () => {
      setIsLoaded(true)
      map.resize()
    }
    const onStyle = () => setStyleReady(true)
    const onMove = () => {
      if (!syncingRef.current) onMoveRef.current?.(readViewport(map))
    }

    map.on('load', onLoad)
    map.on('style.load', onStyle)
    map.on('move', onMove)
    setInstance(map)

    const observer = new ResizeObserver(() => map.resize())
    observer.observe(node)

    return () => {
      observer.disconnect()
      map.off('load', onLoad)
      map.off('style.load', onStyle)
      map.off('move', onMove)
      map.remove()
      setInstance(null)
      setIsLoaded(false)
      setStyleReady(false)
    }
    // Mount once; style/viewport sync in later effects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!instance || styleRef.current === themeStyle) return
    styleRef.current = themeStyle
    setStyleReady(false)
    instance.setStyle(themeStyle, { diff: false })
  }, [instance, themeStyle])

  useEffect(() => {
    if (!instance || !styleReady || !projection) return
    instance.setProjection(projection)
    if (projection.type !== 'globe') return
    try {
      instance.setSky({
        'atmosphere-blend': 0,
        'fog-color': resolvedMode === 'dark' ? '#0b1020' : '#c5d9ec',
        'horizon-color': resolvedMode === 'dark' ? '#1a2233' : '#d8e7f5',
        'sky-color': resolvedMode === 'dark' ? '#070b14' : '#87b7e0',
      })
    } catch {
      /* style without sky */
    }
  }, [instance, projection, resolvedMode, styleReady])

  useEffect(() => {
    if (!instance || !styleReady) return
    instance.getCanvas().style.opacity = String(globeOpacity)
  }, [globeOpacity, instance, styleReady])

  const controlled = viewport !== undefined && onViewportChange !== undefined

  useEffect(() => {
    if (!instance || !controlled || !viewport || instance.isMoving()) return
    const current = readViewport(instance)
    const next = {
      center: viewport.center ?? current.center,
      zoom: viewport.zoom ?? current.zoom,
      bearing: viewport.bearing ?? current.bearing,
      pitch: viewport.pitch ?? current.pitch,
    }
    if (
      next.center[0] === current.center[0] &&
      next.center[1] === current.center[1] &&
      next.zoom === current.zoom &&
      next.bearing === current.bearing &&
      next.pitch === current.pitch
    ) {
      return
    }
    syncingRef.current = true
    instance.jumpTo(next)
    syncingRef.current = false
  }, [controlled, instance, viewport])

  const [legendState, setLegendStateInternal] = useState<Record<string, boolean>>({})
  const setLegendState = useCallback((key: string, expanded: boolean) => {
    setLegendStateInternal((prev) => ({ ...prev, [key]: expanded }))
  }, [])

  const context = useMemo(
    () => ({
      map: instance,
      isLoaded: Boolean(instance && isLoaded && styleReady),
      resolvedTheme: resolvedMode,
      resolvedMode,
      hideOccluded,
      popoverOpen,
      setPopoverOpen,
      hoverTarget,
      setHoverTarget,
      legendState,
      setLegendState,
      autoRotate: autoRotateState,
      setAutoRotate,
      autoRotateSpeed: speedState,
      setAutoRotateSpeed: setSpeedState,
      isGlobe,
    }),
    [
      autoRotateState,
      hideOccluded,
      hoverTarget,
      instance,
      isGlobe,
      isLoaded,
      legendState,
      popoverOpen,
      resolvedMode,
      setAutoRotate,
      setLegendState,
      speedState,
      styleReady,
    ]
  )

  const hasOwnControls = Children.toArray(children).some(
    (child) => isValidElement(child) && (child.type === MapControls || (child.type as any)?.name === 'MapControls')
  )

  const controlsElement = renderSlot(slots.controls, slotProps.controls) ?? (
    controls && !hasOwnControls ? <MapControls /> : null
  )

  const loaderElement = renderSlot(slots.loader, slotProps.loader) ?? <Loader size="md" />

  return (
    <MapContext.Provider value={context}>
      <div
        className={cn(
          'relative isolate min-h-80 overflow-hidden rounded-base bg-muted ring-1 ring-fg/10',
          className
        )}
        data-attrib={attributionPosition}
        data-hide-occluded={hideOccluded ? '' : undefined}
        data-slot="map"
        style={{
          ['--map-attrib-radius' as string]:
            typeof attributionRadius === 'number' ? `${attributionRadius}px` : attributionRadius,
        }}
      >
        <div className="absolute inset-0 size-full" ref={shellRef} />
        {(!isLoaded || loading) && (
          <div className="absolute inset-0 z-10 grid place-content-center bg-bg/40 backdrop-blur-[2px]">
            {loaderElement}
          </div>
        )}
        {instance ? children : null}
        {controlsElement}
      </div>
    </MapContext.Provider>
  )
}

/* ==========================================================================
   Globe Map (Specialized Variant)
   ========================================================================== */

export interface GlobeMapSlots extends MapSlots {}

export interface GlobeMapProps extends Omit<MapProps, 'projection'> {
  /** Fades the WebGL globe surface opacity (HTML markers remain full opacity, default: 1) */
  opacity?: number
}

function GlobeMapPrimitive({ opacity = 1, ...props }: GlobeMapProps) {
  return (
    <Map
      center={[20, 16]}
      maxPitch={85}
      minZoom={0.5}
      zoom={1.55}
      {...props}
      globeOpacity={opacity}
      projection={{ type: 'globe' }}
    />
  )
}

export const GlobeMap = createInterfaceComponent<GlobeMapProps, GlobeMapSlots>(
  {
    name: 'GlobeMap',
    category: 'data',
    description: '3D spherical globe visualizer with dynamic atmospheric sky gradient, horizon fog, and orbital projection.',
    version: '1.0.0',
    props: {
      opacity: 1,
      minZoom: 0.5,
      maxPitch: 85,
    },
    slots: {
      controls: undefined,
      loader: undefined,
    },
  },
  GlobeMapPrimitive
)

/* ==========================================================================
   Factory & Compound Attachments
   ========================================================================== */

export const Map = createInterfaceComponent<MapProps, MapSlots>(
  {
    name: 'Map',
    category: 'data',
    description: 'Interactive WebGL vector map container supporting dynamic themes, routes, flight arcs, GeoJSON shapes, and clustering.',
    version: '1.0.0',
    props: {
      blank: false,
      controls: true,
      cooperativeGestures: false,
      globeOpacity: 1,
      hideOccluded: true,
      attributionPosition: 'bottom-right',
      attributionRadius: 8,
    },
    slots: {
      controls: undefined,
      loader: undefined,
    },
  },
  MapPrimitive
)

Map.Globe = GlobeMap
Map.Controls = MapControls
Map.Legend = MapLegend
Map.Marker = MapMarker
Map.MarkerContent = MarkerContent
Map.MarkerPin = MarkerPin
Map.MarkerDot = MarkerDot
Map.MarkerPopup = MarkerPopup
Map.MarkerTooltip = MarkerTooltip
Map.MarkerLabel = MarkerLabel
Map.Popup = MapPopup
Map.Hover = MapHover
Map.Search = MapSearch
Map.Route = MapRoute
Map.RouteProgress = RouteProgress
Map.RouteMarker = RouteMarker
Map.Path = MapPath
Map.GeoJSON = MapGeoJSON
Map.Shape = MapShape
Map.Arc = MapArc
Map.ClusterLayer = MapClusterLayer
