import React, { useState } from 'react'
import {
  ColorSwatch,
  ColorSwatchPicker,
  ColorSwatchPickerItem,
  Label,
  Slider,
  SliderOutput,
  SliderTrack,
  Text,
  Map,
  GlobeMap,
  MapArc,
  MapClusterLayer,
  MapControls,
  MapGeoJSON,
  MapLegend,
  MapMarker,
  MapPath,
  MapSearch,
  MarkerContent,
  MarkerDot,
  MarkerLabel,
  MarkerPin,
  RouteMarker,
  RouteProgress,
  fromSvg,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

/* ==========================================================================
   Dataset Fixtures from Original Map Demo
   ========================================================================== */

const places = [
  { id: 'studio', name: 'Studio', hint: 'HQ', longitude: -73.9857, latitude: 40.7484 },
  { id: 'dock', name: 'Dock', hint: 'Warehouse', longitude: -74.006, latitude: 40.7128 },
  { id: 'north', name: 'North', hint: 'Showroom', longitude: -73.9654, latitude: 40.7829 },
] as const

const manhattanBounds = [
  [-74.047, 40.683],
  [-73.907, 40.882],
] as const

/** Island + Central Park hole, in a 140×199 viewBox mapped onto `manhattanBounds`. */
const manhattanSvg =
  'M 30.40 181.70 L 27.50 176.50 L 29.20 170.80 L 31.00 165.00 L 32.20 157.20 L 34.10 149.50 L 35.80 141.00 L 37.20 133.20 L 40.00 126.50 L 42.80 120.80 L 46.20 114.50 L 50.50 108.20 L 55.20 101.50 L 60.00 94.80 L 64.50 88.00 L 69.20 81.00 L 75.50 72.50 L 82.00 64.50 L 89.00 56.00 L 95.80 47.50 L 102.00 39.00 L 107.50 30.50 L 113.20 23.20 L 119.00 16.50 L 128.50 5.50 L 125.20 3.20 L 129.80 10.00 L 132.20 17.00 L 128.50 26.00 L 125.00 35.00 L 122.20 44.00 L 119.50 53.50 L 116.00 63.00 L 112.20 72.50 L 108.00 82.00 L 103.00 91.00 L 98.20 99.00 L 93.00 107.00 L 87.50 114.50 L 81.50 122.00 L 76.00 129.00 L 73.20 135.50 L 74.80 142.50 L 76.00 149.20 L 73.50 156.50 L 70.20 163.20 L 66.50 168.50 L 60.50 172.50 L 53.50 175.50 L 46.00 178.00 L 38.50 180.00 Z M 65.80 113.90 L 74.00 117.20 L 97.70 85.20 L 88.90 81.40 Z'

const manhattan = fromSvg({
  d: manhattanSvg,
  viewBox: '0 0 140 199',
  bounds: [
    [manhattanBounds[0][0], manhattanBounds[0][1]],
    [manhattanBounds[1][0], manhattanBounds[1][1]],
  ],
  properties: { id: 'manhattan', name: 'Manhattan' },
})

const clusters = {
  type: 'FeatureCollection' as const,
  features: places.flatMap((place, index) =>
    Array.from({ length: 14 }, (_, offset) => ({
      type: 'Feature' as const,
      properties: { name: place.name },
      geometry: {
        type: 'Point' as const,
        coordinates: [
          place.longitude + ((offset % 5) - 2) * 0.004,
          place.latitude + (Math.floor(offset / 5) - 1) * 0.003 + index * 0.0004,
        ],
      },
    }))
  ),
}

const tour = [
  { id: 'central-park', name: 'Central Park', hint: 'New York', longitude: -73.9654, latitude: 40.7829 },
  { id: 'eiffel', name: 'Eiffel Tower', hint: 'Paris', longitude: 2.2945, latitude: 48.8584 },
  { id: 'dubai', name: 'Burj Khalifa', hint: 'Dubai', longitude: 55.2744, latitude: 25.1972 },
  { id: 'delhi', name: 'Delhi', hint: 'India', longitude: 77.209, latitude: 28.6139 },
  { id: 'shanghai', name: 'Shanghai', hint: 'The Bund', longitude: 121.4737, latitude: 31.2304 },
  { id: 'singapore', name: 'Singapore', hint: 'Marina Bay', longitude: 103.8198, latitude: 1.3521 },
  { id: 'tokyo', name: 'Tokyo', hint: 'Japan', longitude: 139.6917, latitude: 35.6895 },
  { id: 'opera', name: 'Opera House', hint: 'Sydney', longitude: 151.2153, latitude: -33.8568 },
  { id: 'silicon', name: 'Silicon Valley', hint: 'Bay Area', longitude: -122.084, latitude: 37.422 },
  { id: 'moscow', name: 'Moscow', hint: 'Russia', longitude: 37.6173, latitude: 55.7558 },
  { id: 'london', name: 'London', hint: 'UK', longitude: -0.1278, latitude: 51.5074 },
  { id: 'egypt', name: 'Giza', hint: 'Egypt', longitude: 31.1342, latitude: 29.9792 },
  { id: 'cameroon', name: 'Yaoundé', hint: 'Cameroon', longitude: 11.5021, latitude: 3.848 },
  { id: 'brazil', name: 'Rio', hint: 'Brazil', longitude: -43.1729, latitude: -22.9068 },
  { id: 'mexico', name: 'Mexico City', hint: 'Mexico', longitude: -99.1332, latitude: 19.4326 },
  { id: 'cape-town', name: 'Cape Town', hint: 'South Africa', longitude: 18.4241, latitude: -33.9249 },
] as const

const mumbai = { id: 'mumbai', name: 'Mumbai', hint: 'India', longitude: 72.8777, latitude: 19.076 } as const
const clusterStops = [...tour, mumbai]
const tourById = Object.fromEntries(clusterStops.map((stop) => [stop.id, stop]))

const extraArcs = [
  ['eiffel', 'moscow'],
  ['moscow', 'delhi'],
  ['moscow', 'central-park'],
  ['moscow', 'silicon'],
  ['moscow', 'tokyo'],
  ['central-park', 'cape-town'],
  ['central-park', 'brazil'],
  ['silicon', 'mexico'],
  ['mexico', 'brazil'],
  ['brazil', 'egypt'],
  ['egypt', 'london'],
  ['london', 'moscow'],
  ['opera', 'cape-town'],
  ['opera', 'mumbai'],
  ['opera', 'brazil'],
  ['egypt', 'cameroon'],
  ['cameroon', 'cape-town'],
  ['cape-town', 'dubai'],
  ['dubai', 'mumbai'],
  ['mumbai', 'shanghai'],
  ['shanghai', 'tokyo'],
  ['tokyo', 'central-park'],
  ['tokyo', 'silicon'],
] as const

const globeArcs = [
  ...tour.slice(0, 9).map((stop, index, loop) => {
    const next = loop[(index + 1) % loop.length]!
    return {
      id: `${stop.id}-${next.id}`,
      label: `${stop.name} → ${next.name}`,
      from: [stop.longitude, stop.latitude] as [number, number],
      to: [next.longitude, next.latitude] as [number, number],
    }
  }),
  ...extraArcs.map(([fromId, toId]) => {
    const from = tourById[fromId]!
    const to = tourById[toId]!
    return {
      id: `${from.id}-${to.id}`,
      label: `${from.name} → ${to.name}`,
      from: [from.longitude, from.latitude] as [number, number],
      to: [to.longitude, to.latitude] as [number, number],
    }
  }),
]

const globeClusters = {
  type: 'FeatureCollection' as const,
  features: clusterStops.flatMap((stop) =>
    [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ].map(([dx, dy]) => ({
      type: 'Feature' as const,
      properties: { name: stop.name },
      geometry: {
        type: 'Point' as const,
        coordinates: [stop.longitude + dx * 0.08, stop.latitude + dy * 0.08],
      },
    }))
  ),
}

function asNumber(set: (value: number) => void) {
  return (value: number | number[]) => set(Array.isArray(value) ? (value[0] ?? 0) : value)
}

const SWATCHES = ['#171717', '#525252', '#0b6bcb', '#1f6b4a', '#c45c26']

function Swatches({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label>{label}</Label>
      <ColorSwatchPicker aria-label={label} value={value} onChange={(color) => onChange?.(color.toString('hex'))}>
        {SWATCHES.map((color) => (
          <ColorSwatchPickerItem color={color} key={color}>
            <ColorSwatch />
          </ColorSwatchPickerItem>
        ))}
      </ColorSwatchPicker>
    </div>
  )
}

/* ==========================================================================
   Map Doc Specification
   ========================================================================== */

export const mapDoc: ComponentDocSpec = {
  id: 'map',
  name: 'Map & Geospatial Suite',
  component: Map,
  summary:
    'Vector map canvas, 3D globes, geodesic flight arcs, road route pathfinding, point clustering, and interactive overlays.',
  subcomponents: [
    'GlobeMap',
    'MapControls',
    'MapLegend',
    'MapMarker',
    'MarkerContent',
    'MarkerPin',
    'MarkerDot',
    'MarkerLabel',
    'MapSearch',
    'MapPath',
    'MapGeoJSON',
    'MapArc',
    'MapClusterLayer',
    'RouteMarker',
    'RouteProgress',
  ],
  playground: {
    defaultProps: {
      interactive: true,
      controls: true,
    },
    controls: [
      {
        name: 'interactive',
        type: 'boolean',
      },
      {
        name: 'controls',
        type: 'boolean',
      },
    ],
    render: (props: any) => {
      const [selected, setSelected] = useState<(typeof places)[number]['id'] | null>('studio')

      return (
        <div className="w-full max-w-4xl p-2">
          <div className="h-[440px] w-full rounded-macro overflow-hidden border border-border/70 shadow-lg relative">
            <Map
              className="w-full h-full"
              interactive={props.interactive}
              controls={props.controls}
            >
              {places.map((place) => (
                <MapMarker
                  key={place.id}
                  latitude={place.latitude}
                  longitude={place.longitude}
                  popover={
                    <>
                      <div className="font-medium">{place.name}</div>
                      <Text className="m-0 text-muted-fg text-xs">{place.hint}</Text>
                    </>
                  }
                  popoverOpen={selected === place.id}
                  tooltip={place.hint}
                  onClick={() => setSelected(place.id)}
                  onPopoverOpenChange={(open) => {
                    if (!open) setSelected(null)
                  }}
                >
                  <MarkerContent>
                    <MarkerPin>x</MarkerPin>
                    <MarkerLabel>{place.name}</MarkerLabel>
                  </MarkerContent>
                </MapMarker>
              ))}
              <MapSearch placeholder="Search a place" />
              <MapControls showCompass showFullscreen showLocate />
              <MapLegend title="Sites">
                {places.map((place) => (
                  <button
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-0.5 text-start hover:text-fg"
                    key={place.id}
                    type="button"
                    onClick={() => setSelected(place.id)}
                  >
                    <span>{place.name}</span>
                    <span className="text-[10px] uppercase tracking-wide">{place.hint}</span>
                  </button>
                ))}
              </MapLegend>
            </Map>
          </div>
        </div>
      )
    },
  },
  examples: [
    {
      title: 'Sites & Waypoint Markers',
      description: 'Markers, popups, legend, and search geocoding on a Carto basemap.',
      render: () => {
        const [selected, setSelected] = useState<(typeof places)[number]['id'] | null>('studio')

        return (
          <div className="h-[28rem] min-h-[28rem] w-full rounded-macro overflow-hidden border border-border/70 relative">
            <Map className="w-full h-full">
              {places.map((place) => (
                <MapMarker
                  key={place.id}
                  latitude={place.latitude}
                  longitude={place.longitude}
                  popover={
                    <>
                      <div className="font-medium">{place.name}</div>
                      <Text className="m-0 text-muted-fg text-xs">{place.hint}</Text>
                    </>
                  }
                  popoverOpen={selected === place.id}
                  tooltip={place.hint}
                  onClick={() => setSelected(place.id)}
                  onPopoverOpenChange={(open) => {
                    if (!open) setSelected(null)
                  }}
                >
                  <MarkerContent>
                    <MarkerPin />
                    <MarkerLabel>{place.name}</MarkerLabel>
                  </MarkerContent>
                </MapMarker>
              ))}
              <MapSearch placeholder="Search a place" />
              <MapControls showCompass showFullscreen showLocate />
              <MapLegend title="Sites">
                {places.map((place) => (
                  <button
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-0.5 text-start hover:text-fg"
                    key={place.id}
                    type="button"
                    onClick={() => setSelected(place.id)}
                  >
                    <span>{place.name}</span>
                    <span className="text-[10px] uppercase tracking-wide">{place.hint}</span>
                  </button>
                ))}
              </MapLegend>
            </Map>
          </div>
        )
      },
    },
    {
      title: 'Path & Road Snapping',
      description: 'Road-snapped route: checkpoints, casing, progress, and custom markers.',
      render: () => {
        const [progress, setProgress] = useState(0.45)
        const [arcColor, setArcColor] = useState('#171717')
        const [arcWidth, setArcWidth] = useState(2)
        const [pathCasing, setPathCasing] = useState('#ffffff')
        const [markerSize, setMarkerSize] = useState(14)
        const [markerFill] = useState('#171717')
        const [markerStroke] = useState('#ffffff')
        const [pathInfo, setPathInfo] = useState<{ distance: number; duration: number } | null>(null)
        const [snap, setSnap] = useState<'roads' | 'straight'>('roads')

        return (
          <div className="flex flex-col gap-4 w-full">
            <div className="mb-2 grid gap-4 sm:grid-cols-2">
              <Swatches label="Path color" value={arcColor} onChange={setArcColor} />
              <Swatches label="Casing" value={pathCasing} onChange={setPathCasing} />
              <Slider aria-label="Path width" maxValue={10} minValue={2} step={0.5} value={arcWidth} onChange={asNumber(setArcWidth)}>
                <Label>Width</Label>
                <SliderOutput />
                <SliderTrack />
              </Slider>
              <Slider aria-label="Checkpoint size" maxValue={28} minValue={10} step={1} value={markerSize} onChange={asNumber(setMarkerSize)}>
                <Label>Checkpoints</Label>
                <SliderOutput />
                <SliderTrack />
              </Slider>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(['roads', 'straight'] as const).map((mode) => (
                <button
                  className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs ring-1 ${snap === mode ? 'bg-overlay font-medium ring-fg/15' : 'text-muted-fg ring-fg/10'}`}
                  key={mode}
                  type="button"
                  onClick={() => setSnap(mode)}
                >
                  {mode === 'roads' ? 'Follow roads' : 'Straight'}
                </button>
              ))}
              {pathInfo && pathInfo.distance > 0 ? (
                <Text className="m-0 text-muted-fg text-xs">
                  {(pathInfo.distance / 1000).toFixed(1)} km · {Math.max(1, Math.round(pathInfo.duration / 60))} min
                </Text>
              ) : null}
            </div>
            <div className="h-[26rem] min-h-[26rem] w-full rounded-macro overflow-hidden border border-border/70 relative">
              <Map className="w-full h-full">
                <MapSearch />
                <MapPath
                  casingColor={pathCasing}
                  color={arcColor}
                  fit
                  profile="driving"
                  progress={progress}
                  snap={snap}
                  tooltip="Path"
                  width={arcWidth}
                  checkpoints={places.map((place) => ({
                    id: place.id,
                    longitude: place.longitude,
                    latitude: place.latitude,
                    label: place.name,
                    tooltip: place.hint,
                  }))}
                  checkpointTooltip={({ checkpoint }) => checkpoint.tooltip}
                  renderCheckpoint={({ checkpoint, role, index }) => (
                    <MarkerContent>
                      <MarkerDot color={arcColor} size={role === 'via' ? markerSize : markerSize + 6} stroke={pathCasing}>
                        {role === 'via' ? index : null}
                      </MarkerDot>
                      <MarkerLabel>{checkpoint.label}</MarkerLabel>
                    </MarkerContent>
                  )}
                  onRoute={(route) => setPathInfo({ distance: route.distance, duration: route.duration })}
                >
                  <RouteProgress color={arcColor} />
                  <RouteMarker at="progress">
                    <MarkerContent>
                      <MarkerDot color={markerFill} size={12} stroke={markerStroke} />
                    </MarkerContent>
                  </RouteMarker>
                </MapPath>
                <MapControls />
              </Map>
            </div>
            <Slider aria-label="Route progress" maxValue={1} minValue={0} step={0.01} value={progress} onChange={asNumber(setProgress)}>
              <SliderOutput />
              <SliderTrack />
            </Slider>
          </div>
        )
      },
    },
    {
      title: 'Layers, Vector Masks (fromSvg) & Point Clusters',
      description: 'Any silhouette: SVG path or GeoJSON, projected onto the map with holes, polygons, and clusters.',
      render: () => {
        const [fill, setFill] = useState('#171717')
        const [fillOpacity, setFillOpacity] = useState(0.28)
        const [stroke, setStroke] = useState('#ffffff')
        const [strokeWidth, setStrokeWidth] = useState(1.5)
        const [pointSize, setPointSize] = useState(5)

        return (
          <div className="flex flex-col gap-4 w-full">
            <div className="grid gap-4 sm:grid-cols-2">
              <Swatches label="Fill" value={fill} onChange={setFill} />
              <Swatches label="Stroke" value={stroke} onChange={setStroke} />
              <Slider aria-label="Fill opacity" maxValue={1} minValue={0.05} step={0.01} value={fillOpacity} onChange={asNumber(setFillOpacity)}>
                <Label>Fill opacity</Label>
                <SliderOutput />
                <SliderTrack />
              </Slider>
              <Slider aria-label="Stroke width" maxValue={6} minValue={0} step={0.25} value={strokeWidth} onChange={asNumber(setStrokeWidth)}>
                <Label>Stroke width</Label>
                <SliderOutput />
                <SliderTrack />
              </Slider>
              <Slider aria-label="Point size" maxValue={14} minValue={2} step={1} value={pointSize} onChange={asNumber(setPointSize)}>
                <Label>Point size</Label>
                <SliderOutput />
                <SliderTrack />
              </Slider>
            </div>
            <div className="h-[22rem] min-h-[22rem] w-full rounded-macro overflow-hidden border border-border/70 relative">
              <Map className="w-full h-full">
                <MapGeoJSON
                  data={manhattan}
                  fill={fill}
                  fillHoverPaint={{ 'fill-opacity': Math.min(1, fillOpacity + 0.2) }}
                  fillOpacity={fillOpacity}
                  interactive
                  promoteId="id"
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                />
                <MapClusterLayer clusterRadius={42} data={clusters} pointColor={fill} pointSize={pointSize} stroke={stroke} strokeWidth={strokeWidth} />
                <MapControls />
              </Map>
            </div>
          </div>
        )
      },
    },
    {
      title: 'Great-Circle Arcs on Basemap',
      description: 'Great-circle flight arcs rendered directly on Carto tiles with auto-fitBounds.',
      render: () => {
        const [arcColor, setArcColor] = useState('#171717')
        const [arcWidth, setArcWidth] = useState(2)
        const [pathCasing] = useState('#ffffff')

        return (
          <div className="flex flex-col gap-4 w-full">
            <div className="grid gap-4 sm:grid-cols-2">
              <Swatches label="Arc color" value={arcColor} onChange={setArcColor} />
              <Slider aria-label="Arc width" maxValue={8} minValue={1} step={0.5} value={arcWidth} onChange={asNumber(setArcWidth)}>
                <Label>Arc width</Label>
                <SliderOutput />
                <SliderTrack />
              </Slider>
            </div>
            <div className="h-[22rem] min-h-[22rem] w-full rounded-macro overflow-hidden border border-border/70 relative">
              <Map className="w-full h-full" renderWorldCopies>
                <MapArc casingColor={pathCasing} color={arcColor} data={globeArcs.slice(0, 3)} fit markers width={arcWidth} />
                <MapControls />
              </Map>
            </div>
          </div>
        )
      },
    },
    {
      title: '3D Globe Projection & World Tour',
      description: 'MapLibre globe projection with great-circle tour out of Central Park and around the world.',
      render: () => {
        const [stop, setStop] = useState<(typeof clusterStops)[number]['id'] | null>('central-park')
        const [globeOpacity, setGlobeOpacity] = useState(1)
        const [markerSize, setMarkerSize] = useState(14)
        const [markerFill, setMarkerFill] = useState('#171717')
        const [markerStroke, setMarkerStroke] = useState('#ffffff')
        const [arcColor] = useState('#171717')
        const [arcWidth] = useState(2)
        const [pathCasing] = useState('#ffffff')
        const [stroke] = useState('#ffffff')
        const [strokeWidth] = useState(1.5)
        const [pointSize] = useState(5)

        return (
          <div className="flex flex-col gap-4 w-full">
            <div className="grid gap-4 sm:grid-cols-2">
              <Slider aria-label="Globe opacity" maxValue={1} minValue={0.15} step={0.01} value={globeOpacity} onChange={asNumber(setGlobeOpacity)}>
                <Label>Globe opacity</Label>
                <SliderOutput />
                <SliderTrack />
              </Slider>
              <Slider aria-label="Point size" maxValue={28} minValue={8} step={1} value={markerSize} onChange={asNumber(setMarkerSize)}>
                <Label>Point size</Label>
                <SliderOutput />
                <SliderTrack />
              </Slider>
              <Swatches label="Point fill" value={markerFill} onChange={setMarkerFill} />
              <Swatches label="Point stroke" value={markerStroke} onChange={setMarkerStroke} />
            </div>
            <div className="h-[32rem] min-h-[32rem] w-full rounded-macro overflow-hidden border border-border/70 relative">
              <GlobeMap className="w-full h-full" opacity={globeOpacity}>
                <MapArc
                  antimeridian="unwrap"
                  casingColor={pathCasing}
                  color={arcColor}
                  data={globeArcs}
                  opacity={0.95}
                  width={arcWidth}
                />
                {clusterStops.map((place) => (
                  <MapMarker
                    key={place.id}
                    latitude={place.latitude}
                    longitude={place.longitude}
                    popover={
                      <>
                        <div className="font-medium">{place.name}</div>
                        <Text className="m-0 text-muted-fg text-xs">{place.hint}</Text>
                      </>
                    }
                    popoverOpen={stop === place.id}
                    tooltip={place.hint}
                    zIndex={1}
                    onClick={() => setStop(place.id)}
                    onPopoverOpenChange={(open) => {
                      if (!open) setStop(null)
                    }}
                  >
                    <MarkerContent>
                      <MarkerDot color={markerFill} size={markerSize} stroke={markerStroke} />
                      <MarkerLabel>{place.name}</MarkerLabel>
                    </MarkerContent>
                  </MapMarker>
                ))}
                <MapClusterLayer
                  clusterRadius={28}
                  data={globeClusters}
                  pointColor={arcColor}
                  pointSize={Math.max(4, pointSize)}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                />
                <MapControls showCompass showFullscreen showAutoRotate />
                <MapLegend title="Tour">
                  {clusterStops.map((place) => (
                    <button
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-0.5 text-start hover:text-fg"
                      key={place.id}
                      type="button"
                      onClick={() => setStop(place.id)}
                    >
                      <span>{place.name}</span>
                      <span className="text-[10px] uppercase tracking-wide">{place.hint}</span>
                    </button>
                  ))}
                </MapLegend>
              </GlobeMap>
            </div>
          </div>
        )
      },
    },
  ],
}
