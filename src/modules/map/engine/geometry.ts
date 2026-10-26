import type * as GeoJSON from 'geojson'
import type { GeoBounds, ViewBox, RouteMeasure, RouteAnchor, MapArcDatum, MapCheckpoint } from './types'

const TAU = Math.PI * 2

export function tokenize(d: string): (string | number)[] {
  const tokens: (string | number)[] = []
  const source = d.trim()
  const number = /^-?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][+-]?\d+)?/
  let i = 0
  while (i < source.length) {
    const char = source[i]!
    if (char === ',' || char === ' ' || char === '\n' || char === '\t' || char === '\r') {
      i += 1
      continue
    }
    if (/[A-Za-z]/.test(char)) {
      tokens.push(char)
      i += 1
      continue
    }
    const rest = source.slice(i)
    const match = rest.match(number)
    if (!match) throw new Error(`Invalid SVG path at ${i}`)
    tokens.push(Number(match[0]))
    i += match[0].length
  }
  return tokens
}

export function cubic(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const mt = 1 - t
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3
}

export function quadratic(p0: number, p1: number, p2: number, t: number): number {
  const mt = 1 - t
  return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2
}

/** SVG elliptical arc → center parameterization, then sample. */
export function arcPoints(
  from: [number, number],
  rx: number,
  ry: number,
  rotation: number,
  large: boolean,
  sweep: boolean,
  to: [number, number],
  samples: number
): [number, number][] {
  if (rx === 0 || ry === 0) return [to]
  const φ = (rotation * Math.PI) / 180
  const cos = Math.cos(φ)
  const sin = Math.sin(φ)
  const dx = (from[0] - to[0]) / 2
  const dy = (from[1] - to[1]) / 2
  const x1 = cos * dx + sin * dy
  const y1 = -sin * dx + cos * dy
  let rx2 = Math.abs(rx)
  let ry2 = Math.abs(ry)
  const λ = (x1 * x1) / (rx2 * rx2) + (y1 * y1) / (ry2 * ry2)
  if (λ > 1) {
    const scale = Math.sqrt(λ)
    rx2 *= scale
    ry2 *= scale
  }
  const sign = large === sweep ? -1 : 1
  const n = rx2 * rx2 * y1 * y1 + ry2 * ry2 * x1 * x1
  const d = rx2 * rx2 * ry2 * ry2 - n
  const coef = sign * Math.sqrt(Math.max(0, d / n))
  const cx1 = coef * ((rx2 * y1) / ry2)
  const cy1 = coef * (-(ry2 * x1) / rx2)
  const cx = cos * cx1 - sin * cy1 + (from[0] + to[0]) / 2
  const cy = sin * cx1 + cos * cy1 + (from[1] + to[1]) / 2
  const start = Math.atan2((y1 - cy1) / ry2, (x1 - cx1) / rx2)
  const end = Math.atan2((-y1 - cy1) / ry2, (-x1 - cx1) / rx2)
  let delta = end - start
  if (!sweep && delta > 0) delta -= TAU
  if (sweep && delta < 0) delta += TAU
  const count = Math.max(2, Math.ceil(samples * (Math.abs(delta) / TAU)))
  const points: [number, number][] = []
  for (let i = 1; i <= count; i += 1) {
    const θ = start + (delta * i) / (count || 1)
    const x = rx2 * Math.cos(θ)
    const y = ry2 * Math.sin(θ)
    points.push([cos * x - sin * y + cx, sin * x + cos * y + cy])
  }
  return points
}

export function flattenPath(d: string, curveSamples: number): [number, number][][] {
  const tokens = tokenize(d)
  const rings: [number, number][][] = []
  let ring: [number, number][] = []
  let i = 0
  let command = 'M'
  let cx = 0
  let cy = 0
  let startX = 0
  let startY = 0
  let lastCubic: [number, number] | null = null
  let lastQuad: [number, number] | null = null

  const take = (count: number): number[] => {
    const values: number[] = []
    for (let n = 0; n < count; n += 1) {
      const value = tokens[i++]
      if (typeof value !== 'number') throw new Error('Expected number in SVG path')
      values.push(value)
    }
    return values
  }

  const push = (x: number, y: number) => {
    const prev = ring[ring.length - 1]
    if (prev && prev[0] === x && prev[1] === y) return
    ring.push([x, y])
    cx = x
    cy = y
  }

  const close = () => {
    if (ring.length < 2) {
      ring = []
      return
    }
    const first = ring[0]!
    const last = ring[ring.length - 1]!
    if (first[0] !== last[0] || first[1] !== last[1]) ring.push([first[0], first[1]])
    if (ring.length >= 4) rings.push(ring)
    ring = []
    cx = startX
    cy = startY
  }

  while (i < tokens.length) {
    const token = tokens[i]
    if (typeof token === 'string') {
      command = token
      i += 1
    }
    lastCubic = command === 'C' || command === 'c' || command === 'S' || command === 's' ? lastCubic : null
    lastQuad = command === 'Q' || command === 'q' || command === 'T' || command === 't' ? lastQuad : null
    switch (command) {
      case 'M':
      case 'm': {
        const [x = 0, y = 0] = take(2)
        if (ring.length) close()
        const abs = command === 'M'
        const nx = abs ? x : cx + x
        const ny = abs ? y : cy + y
        startX = nx
        startY = ny
        push(nx, ny)
        command = command === 'M' ? 'L' : 'l'
        break
      }
      case 'L':
      case 'l': {
        const [x = 0, y = 0] = take(2)
        push(command === 'L' ? x : cx + x, command === 'L' ? y : cy + y)
        break
      }
      case 'H':
      case 'h': {
        const [x = 0] = take(1)
        push(command === 'H' ? x : cx + x, cy)
        break
      }
      case 'V':
      case 'v': {
        const [y = 0] = take(1)
        push(cx, command === 'V' ? y : cy + y)
        break
      }
      case 'C':
      case 'c': {
        const [x1 = 0, y1 = 0, x2 = 0, y2 = 0, x = 0, y = 0] = take(6)
        const abs = command === 'C'
        const p1x = abs ? x1 : cx + x1
        const p1y = abs ? y1 : cy + y1
        const p2x = abs ? x2 : cx + x2
        const p2y = abs ? y2 : cy + y2
        const nx = abs ? x : cx + x
        const ny = abs ? y : cy + y
        for (let t = 1; t <= curveSamples; t += 1) {
          const u = t / curveSamples
          push(cubic(cx, p1x, p2x, nx, u), cubic(cy, p1y, p2y, ny, u))
        }
        lastCubic = [p2x, p2y]
        break
      }
      case 'S':
      case 's': {
        const [x2 = 0, y2 = 0, x = 0, y = 0] = take(4)
        const abs = command === 'S'
        const p2x = abs ? x2 : cx + x2
        const p2y = abs ? y2 : cy + y2
        const nx = abs ? x : cx + x
        const ny = abs ? y : cy + y
        const p1x = lastCubic ? 2 * cx - lastCubic[0] : cx
        const p1y = lastCubic ? 2 * cy - lastCubic[1] : cy
        for (let t = 1; t <= curveSamples; t += 1) {
          const u = t / curveSamples
          push(cubic(cx, p1x, p2x, nx, u), cubic(cy, p1y, p2y, ny, u))
        }
        lastCubic = [p2x, p2y]
        break
      }
      case 'Q':
      case 'q': {
        const [x1 = 0, y1 = 0, x = 0, y = 0] = take(4)
        const abs = command === 'Q'
        const p1x = abs ? x1 : cx + x1
        const p1y = abs ? y1 : cy + y1
        const nx = abs ? x : cx + x
        const ny = abs ? y : cy + y
        for (let t = 1; t <= curveSamples; t += 1) {
          const u = t / curveSamples
          push(quadratic(cx, p1x, nx, u), quadratic(cy, p1y, ny, u))
        }
        lastQuad = [p1x, p1y]
        break
      }
      case 'T':
      case 't': {
        const [x = 0, y = 0] = take(2)
        const abs = command === 'T'
        const nx = abs ? x : cx + x
        const ny = abs ? y : cy + y
        const p1x: number = lastQuad ? 2 * cx - lastQuad[0] : cx
        const p1y: number = lastQuad ? 2 * cy - lastQuad[1] : cy
        for (let t = 1; t <= curveSamples; t += 1) {
          const u = t / curveSamples
          push(quadratic(cx, p1x, nx, u), quadratic(cy, p1y, ny, u))
        }
        lastQuad = [p1x, p1y]
        break
      }
      case 'A':
      case 'a': {
        const [rx = 0, ry = 0, rot = 0, large = 0, sweep = 0, x = 0, y = 0] = take(7)
        const nx = command === 'A' ? x : cx + x
        const ny = command === 'A' ? y : cy + y
        for (const point of arcPoints([cx, cy], rx, ry, rot, Boolean(large), Boolean(sweep), [nx, ny], curveSamples)) {
          push(point[0], point[1])
        }
        break
      }
      case 'Z':
      case 'z':
        close()
        ring = [[startX, startY]]
        break
      default:
        throw new Error(`Unsupported SVG command ${command}`)
    }
  }
  if (ring.length >= 4) close()
  return rings
}

export function pathBox(rings: [number, number][][]): ViewBox {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const ring of rings) {
    for (const [x, y] of ring) {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }
  return [minX, minY, maxX - minX || 1, maxY - minY || 1]
}

export function parseViewBox(value: string | ViewBox | undefined, rings: [number, number][][]): ViewBox {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    const parts = value.trim().split(/[\s,]+/).map(Number)
    if (parts.length === 4 && parts.every(Number.isFinite)) return parts as ViewBox
  }
  return pathBox(rings)
}

export function project(x: number, y: number, viewBox: ViewBox, bounds: GeoBounds): [number, number] {
  const [minX, minY, width, height] = viewBox
  const [[west, south], [east, north]] = bounds
  return [
    west + ((x - minX) / width) * (east - west),
    north - ((y - minY) / height) * (north - south),
  ]
}

export function ringArea(ring: [number, number][]): number {
  let area = 0
  for (let i = 0; i < ring.length - 1; i += 1) {
    const a = ring[i]!
    const b = ring[i + 1]!
    area += a[0] * b[1] - b[0] * a[1]
  }
  return area / 2
}

export function pointInRing(point: [number, number], ring: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]!
    const b = ring[j]!
    const intersect = a[1] > point[1] !== b[1] > point[1] && point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1] + Number.EPSILON) + a[0]
    if (intersect) inside = !inside
  }
  return inside
}

export function asPolygons(rings: [number, number][][]): GeoJSON.Position[][][] {
  const closed = rings.map((ring) => {
    const next = ring.map(([x, y]) => [x, y] as [number, number])
    const first = next[0]!
    const last = next[next.length - 1]!
    if (first[0] !== last[0] || first[1] !== last[1]) next.push([first[0], first[1]])
    return next
  })
  const used = new Set<number>()
  const polygons: GeoJSON.Position[][][] = []
  const outers = closed
    .map((ring, index) => ({ ring, index, area: Math.abs(ringArea(ring)) }))
    .sort((a, b) => b.area - a.area)

  for (const outer of outers) {
    if (used.has(outer.index)) continue
    used.add(outer.index)
    const holes: GeoJSON.Position[][] = []
    for (const candidate of outers) {
      if (used.has(candidate.index) || candidate.area >= outer.area) continue
      const test = candidate.ring[0]!
      if (!pointInRing(test, outer.ring)) continue
      used.add(candidate.index)
      holes.push(ringArea(candidate.ring) * ringArea(outer.ring) > 0 ? candidate.ring.slice().reverse() : candidate.ring)
    }
    polygons.push([outer.ring, ...holes])
  }
  return polygons
}

export function fromSvg(input: {
  d: string
  bounds: GeoBounds
  viewBox?: string | ViewBox
  properties?: GeoJSON.GeoJsonProperties
  samples?: number
}): GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> {
  const sampled = flattenPath(input.d, input.samples ?? 16)
  const viewBox = parseViewBox(input.viewBox, sampled)
  const projected = sampled.map((ring) => ring.map(([x, y]) => project(x, y, viewBox, input.bounds)))
  const polygons = asPolygons(projected)
  if (polygons.length === 0) {
    throw new Error('SVG path did not produce a closed shape')
  }
  const geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon =
    polygons.length === 1
      ? { type: 'Polygon', coordinates: polygons[0]! }
      : { type: 'MultiPolygon', coordinates: polygons }
  return {
    type: 'Feature',
    properties: { id: 'shape', ...input.properties },
    geometry,
  }
}

export function fromRings(
  outer: [number, number][],
  holes: [number, number][][] = [],
  properties: GeoJSON.GeoJsonProperties = { id: 'shape' }
): GeoJSON.Feature<GeoJSON.Polygon> {
  const close = (ring: [number, number][]) => {
    const first = ring[0]!
    const last = ring[ring.length - 1]!
    return first[0] === last[0] && first[1] === last[1] ? ring : [...ring, first]
  }
  return {
    type: 'Feature',
    properties,
    geometry: { type: 'Polygon', coordinates: [close(outer), ...holes.map(close)] },
  }
}

export function isGeoJsonUrl(value: string): boolean {
  return /^(https?:)?\/\//.test(value) || value.endsWith('.json') || value.endsWith('.geojson')
}

export function isSvgPath(value: string): boolean {
  return /^\s*[Mm]/.test(value)
}

export function measure(coordinates: [number, number][]): RouteMeasure {
  if (coordinates.length < 2) return { cumulative: [], total: 0 }
  const cumulative = [0]
  let total = 0
  for (let i = 1; i < coordinates.length; i += 1) {
    const [lng1, lat1] = coordinates[i - 1]!
    const [lng2, lat2] = coordinates[i]!
    const mid = ((lat1 + lat2) / 2) * (Math.PI / 180)
    total += Math.hypot((lng2 - lng1) * Math.cos(mid), lat2 - lat1)
    cumulative.push(total)
  }
  return { cumulative, total }
}

export function clamp(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0))
}

export function segmentIndex(cumulative: number[], distance: number): number {
  let low = 0
  let high = cumulative.length - 1
  while (low < high) {
    const mid = Math.floor((low + high) / 2)
    if ((cumulative[mid] ?? 0) < distance) low = mid + 1
    else high = mid
  }
  return Math.min(low === 0 ? 0 : low - 1, Math.max(0, cumulative.length - 2))
}

export function pointAt(coordinates: [number, number][], route: RouteMeasure, fraction: number): [number, number] | null {
  if (!coordinates[0]) return null
  if (coordinates.length === 1 || route.total === 0) return coordinates[0]
  const target = route.total * clamp(fraction)
  const index = segmentIndex(route.cumulative, target)
  const a = coordinates[index]!
  const b = coordinates[index + 1]!
  const span = (route.cumulative[index + 1] ?? 0) - (route.cumulative[index] ?? 0)
  const t = span === 0 ? 0 : (target - (route.cumulative[index] ?? 0)) / span
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
}

const EMPTY_COORDS: [number, number][] = []

export function sliceTo(coordinates: [number, number][], route: RouteMeasure, fraction: number): [number, number][] {
  const t = clamp(fraction)
  if (coordinates.length < 2 || t <= 0 || route.total === 0) return EMPTY_COORDS
  if (t >= 1) return coordinates
  const target = route.total * t
  const index = segmentIndex(route.cumulative, target)
  const end = pointAt(coordinates, route, t)
  const head = coordinates.slice(0, index + 1)
  if (end) head.push(end)
  return head
}

export function toRad(value: number): number {
  return (value * Math.PI) / 180
}

export function toDeg(value: number): number {
  return (value * 180) / Math.PI
}

/** Spherical interpolation — great circle line segments without external CJS deps. */
export function geodesicCoordinates(from: [number, number], to: [number, number], npoints: number): [number, number][] {
  const φ1 = toRad(from[1])
  const λ1 = toRad(from[0])
  const φ2 = toRad(to[1])
  const λ2 = toRad(to[0])
  const Δ = 2 * Math.asin(
    Math.sqrt(Math.sin((φ2 - φ1) / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2)
  )
  if (!Number.isFinite(Δ) || Δ === 0) return [from, to]
  const count = Math.max(2, npoints)
  const coords: [number, number][] = []
  for (let i = 0; i <= count; i += 1) {
    const f = i / (count || 1)
    const A = Math.sin((1 - f) * Δ) / Math.sin(Δ)
    const B = Math.sin(f * Δ) / Math.sin(Δ)
    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2)
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2)
    const z = A * Math.sin(φ1) + B * Math.sin(φ2)
    coords.push([toDeg(Math.atan2(y, x)), toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)))])
  }
  return coords
}

export function splitAntimeridian(coords: [number, number][]): GeoJSON.LineString | GeoJSON.MultiLineString {
  const parts: [number, number][][] = [[]]
  for (const coord of coords) {
    const current = parts[parts.length - 1]!
    const prev = current[current.length - 1]
    if (prev && Math.abs(coord[0] - prev[0]) > 180) parts.push([coord])
    else current.push(coord)
  }
  return parts.length === 1
    ? { type: 'LineString', coordinates: parts[0]! }
    : { type: 'MultiLineString', coordinates: parts }
}

export function unwrapLongitudes(coords: [number, number][]): GeoJSON.LineString {
  const coordinates: [number, number][] = []
  for (const coord of coords) {
    const prev = coordinates[coordinates.length - 1]
    if (!prev) {
      coordinates.push(coord)
      continue
    }
    let lng = coord[0]
    while (lng - prev[0] > 180) lng -= 360
    while (lng - prev[0] < -180) lng += 360
    coordinates.push([lng, coord[1]])
  }
  return { type: 'LineString', coordinates }
}

export function arcFeature(
  arc: MapArcDatum,
  npoints: number,
  antimeridian: 'split' | 'unwrap'
): GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString> {
  const { from, to, ...properties } = arc
  const coords = geodesicCoordinates(from, to, npoints)
  return {
    type: 'Feature',
    properties,
    geometry: antimeridian === 'unwrap' ? unwrapLongitudes(coords) : splitAntimeridian(coords),
  }
}

export function mercatorXY(lng: number, lat: number): [number, number] {
  const x = (lng + 180) / 360
  const sine = Math.min(0.9999, Math.max(-0.9999, Math.sin((lat * Math.PI) / 180)))
  const y = 0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)
  return [x, y]
}

export function clusterFeatures(
  features: GeoJSON.Feature<GeoJSON.Point>[],
  zoom: number,
  radius: number,
  maxZoom: number
): { id: string; longitude: number; latitude: number; count: number; label: string }[] {
  if (zoom >= maxZoom) {
    return features.map((feature, index) => ({
      id: String(feature.id ?? `p-${index}`),
      longitude: feature.geometry.coordinates[0]!,
      latitude: feature.geometry.coordinates[1]!,
      count: 1,
      label: String(feature.properties?.name ?? 'Point'),
    }))
  }
  const world = 512 * 2 ** zoom
  const used = new Set<number>()
  const clustered: { id: string; longitude: number; latitude: number; count: number; label: string }[] = []
  for (let i = 0; i < features.length; i += 1) {
    if (used.has(i)) continue
    const seed = features[i]!
    const [sx, sy] = mercatorXY(seed.geometry.coordinates[0]!, seed.geometry.coordinates[1]!)
    let lng = 0
    let lat = 0
    let count = 0
    const names = new Set<string>()
    for (let j = i; j < features.length; j += 1) {
      if (used.has(j)) continue
      const next = features[j]!
      const [x, y] = mercatorXY(next.geometry.coordinates[0]!, next.geometry.coordinates[1]!)
      const dx = (sx - x) * world
      const dy = (sy - y) * world
      if (dx * dx + dy * dy > radius * radius) continue
      used.add(j)
      lng += next.geometry.coordinates[0]!
      lat += next.geometry.coordinates[1]!
      count += 1
      if (next.properties?.name) names.add(String(next.properties.name))
    }
    clustered.push({
      id: `c-${i}-${count}`,
      longitude: lng / (count || 1),
      latitude: lat / (count || 1),
      count,
      label: count === 1 ? [...names][0] ?? 'Point' : names.size === 1 ? `${[...names][0]} · ${count}` : `${count} points`,
    })
  }
  return clustered
}

export function densifyCheckpoints(checkpoints: MapCheckpoint[], steps = 24): [number, number][] {
  const line: [number, number][] = []
  for (let i = 0; i < checkpoints.length; i += 1) {
    const current = checkpoints[i]!
    line.push([current.longitude, current.latitude])
    const next = checkpoints[i + 1]
    if (!next) continue
    for (let step = 1; step < steps; step += 1) {
      const t = step / (steps || 1)
      line.push([
        current.longitude + (next.longitude - current.longitude) * t,
        current.latitude + (next.latitude - current.latitude) * t,
      ])
    }
  }
  return line
}

export function checkpointRole(index: number, total: number): 'start' | 'via' | 'end' {
  if (index === 0) return 'start'
  if (index === total - 1) return 'end'
  return 'via'
}

export function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '')
}

export function cssColor(token: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  const probe = document.createElement('span')
  probe.style.color = `var(${token})`
  document.body.appendChild(probe)
  const value = getComputedStyle(probe).color
  probe.remove()
  return value && value !== 'rgba(0, 0, 0, 0)' ? value : fallback
}

export function paintColor(value: string | undefined, fallback: string): string {
  if (!value) return fallback
  if (value.startsWith('var(')) return cssColor(value.slice(4, -1).trim(), fallback)
  if (value.startsWith('--')) return cssColor(value, fallback)
  return value
}

export function hoverCase<T extends Record<string, unknown>>(paint: T, hover?: T): T {
  if (!hover) return paint
  const next: Record<string, unknown> = { ...paint }
  for (const [key, value] of Object.entries(hover)) {
    if (value === undefined) continue
    const base = next[key]
    next[key] =
      base === undefined ? value : ['case', ['boolean', ['feature-state', 'hover'], false], value, base]
  }
  return next as T
}
