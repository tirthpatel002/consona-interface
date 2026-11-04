/**
 * @file dependency-geometry.ts
 * Pure dependency-edge geometry: cubic paths and stroke segmentation against live bar rects.
 * Zero React. Crossing segments carry the crossed bar's contrast ink for readable strokes.
 * Keeps work cheap at O(edges × visible bars × samples).
 */

/** Axis-aligned bar rectangle in timeline content coordinates. */
export interface GanttBarRect {
  /** Item id this rect belongs to (used to skip endpoint bars per edge). */
  id: string
  /** Left edge in px. */
  left: number
  /** Top edge in px. */
  top: number
  /** Width in px. */
  width: number
  /** Height in px. */
  height: number
  /** Optional bar fill from getColor (informational; ink is preferred for strokes). */
  fill?: string
  /**
   * Readable label/contrast ink for this bar fill.
   * Crossing dependency strokes use this color at full opacity.
   */
  ink?: string
}

/** One stroke piece after splitting a dependency curve against bars. */
export interface GanttDependencyStrokeSegment {
  /** SVG path `d` attribute. */
  d: string
  /** True when this piece crosses a bar (stroke with crossingInk, not the default stroke). */
  crossing: boolean
  /** Id of the bar this piece crosses (when crossing). */
  crossingBarId?: string
  /**
   * Contrast ink of the crossed bar — same color as that bar's label text.
   * Present when crossing is true and the bar supplied ink.
   */
  crossingInk?: string
}

export interface SegmentDependencyStrokeOptions {
  /** Samples along the cubic (inclusive endpoints). Default: 32. */
  samples?: number
  /** Inflate each bar by this many px (accounts for stroke width). Default: 2. */
  pad?: number
  /** Bar ids to ignore — typically the edge's from/to endpoints. */
  ignoreIds?: ReadonlySet<string> | readonly string[]
}

/** Default visual bar height matching GanttBar `h-7` (28px). */
export const GANTT_BAR_VISUAL_HEIGHT = 28

/** Build a vertical-centered bar rect for a row from live layout. */
export function barRectFromLayout(
  id: string,
  layout: { left: number; width: number },
  rowIndex: number,
  rowHeight: number,
  barHeight: number = GANTT_BAR_VISUAL_HEIGHT,
  color?: { fill?: string; ink?: string }
): GanttBarRect {
  const height = Math.min(barHeight, rowHeight)
  const top = rowIndex * rowHeight + (rowHeight - height) / 2
  return {
    id,
    left: layout.left,
    top,
    width: Math.max(0, layout.width),
    height,
    ...(color?.fill != null ? { fill: color.fill } : null),
    ...(color?.ink != null ? { ink: color.ink } : null),
  }
}

/**
 * Control points with a bend at both ends before the path settles into the
 * exit / approach direction (Elixir timeline `computeControlPoints`).
 */
export function dependencyCubicControls(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { c1x: number; c1y: number; c2x: number; c2y: number } {
  const dx = x2 - x1
  const dy = y2 - y1
  const distance = Math.hypot(dx, dy)
  const angle = Math.atan2(dy, dx)

  const isBackward = dx < 0
  const isVertical = Math.abs(dx) < Math.abs(dy) * 0.5
  const isShort = distance < 200
  const isLong = distance > 800

  let controlDist = distance * 0.4
  if (isShort) controlDist = Math.max(80, distance * 0.5)
  if (isLong) controlDist = Math.min(distance * 0.3, 300)

  if (isBackward) {
    const verticalOffset = Math.max(100, Math.abs(dy) * 0.6)
    const horizontalExtension = Math.max(150, Math.abs(dx) * 0.3)
    return {
      c1x: x1 + horizontalExtension,
      c1y: y1 + (dy > 0 ? verticalOffset : -verticalOffset) * 0.45,
      c2x: x2 - horizontalExtension,
      c2y: y2 + (dy > 0 ? -verticalOffset : verticalOffset) * 0.55,
    }
  }

  if (isVertical) {
    const sideOffset = Math.max(50, Math.abs(dx) * 0.8)
    const sign = dx >= 0 ? 1 : -1
    return {
      c1x: x1 * 1.05 + sign * sideOffset,
      c1y: y1 + dy * 0.3,
      c2x: x2 * 0.95 - sign * sideOffset,
      c2y: y2 * 0.9 - dy * 0.3,
    }
  }

  // Standard forward arc: bend out from start, flatten into end direction.
  const angleAdjustment = 0.5 - (Math.abs(angle) / (Math.PI / 2)) * 0.3
  const xFactor = angleAdjustment
  const yFactor = 0.1 + (1 - angleAdjustment) * 0.2
  return {
    c1x: x1 + Math.cos(angle) * controlDist * xFactor,
    c1y: y1 + Math.sin(angle) * controlDist * yFactor + (dy > 0 ? 20 : -20),
    c2x: x2 - Math.cos(angle) * controlDist * xFactor * 1.5,
    c2y: y2 - Math.sin(angle) * controlDist * 0.05,
  }
}

/** SVG cubic path using bent end control points. */
export function dependencyCubicPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string {
  const { c1x, c1y, c2x, c2y } = dependencyCubicControls(x1, y1, x2, y2)
  return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`
}

/** Evaluate a cubic bezier at t ∈ [0, 1]. */
export function cubicBezierPoint(
  t: number,
  x1: number,
  y1: number,
  c1x: number,
  c1y: number,
  c2x: number,
  c2y: number,
  x2: number,
  y2: number
): { x: number; y: number } {
  const u = 1 - t
  const uu = u * u
  const tt = t * t
  const uuu = uu * u
  const ttt = tt * t
  return {
    x: uuu * x1 + 3 * uu * t * c1x + 3 * u * tt * c2x + ttt * x2,
    y: uuu * y1 + 3 * uu * t * c1y + 3 * u * tt * c2y + ttt * y2,
  }
}

function pointInBar(
  x: number,
  y: number,
  bar: GanttBarRect,
  pad: number
): boolean {
  return (
    x >= bar.left - pad &&
    x <= bar.left + bar.width + pad &&
    y >= bar.top - pad &&
    y <= bar.top + bar.height + pad
  )
}

function toIgnoreSet(
  ignoreIds: SegmentDependencyStrokeOptions['ignoreIds']
): ReadonlySet<string> | null {
  if (!ignoreIds) return null
  return ignoreIds instanceof Set ? ignoreIds : new Set(ignoreIds)
}

/**
 * First bar (x, y) lies inside, excluding `ignore`.
 * O(bars) — call site loops samples × edges for overall O(edges × bars × samples).
 */
export function findCrossedBar(
  x: number,
  y: number,
  bars: readonly GanttBarRect[],
  pad: number = 2,
  ignore: ReadonlySet<string> | null = null
): GanttBarRect | null {
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i]!
    if (ignore?.has(bar.id)) continue
    if (pointInBar(x, y, bar, pad)) return bar
  }
  return null
}

/**
 * True when (x, y) lies inside any bar except those in `ignore`.
 */
export function pointCrossesBars(
  x: number,
  y: number,
  bars: readonly GanttBarRect[],
  pad: number = 2,
  ignore: ReadonlySet<string> | null = null
): boolean {
  return findCrossedBar(x, y, bars, pad, ignore) != null
}

function polylinePath(points: readonly { x: number; y: number }[]): string {
  if (points.length === 0) return ''
  let d = `M ${points[0]!.x} ${points[0]!.y}`
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i]!.x} ${points[i]!.y}`
  }
  return d
}

interface SamplePoint {
  x: number
  y: number
  /** Crossed bar id, or null when outside all bars. */
  barId: string | null
  /** Contrast ink of the crossed bar (when barId is set). */
  ink?: string
}

function pushSegment(
  segments: GanttDependencyStrokeSegment[],
  run: readonly { x: number; y: number }[],
  barId: string | null,
  ink: string | undefined
) {
  const d = polylinePath(run)
  if (!d) return
  if (barId == null) {
    segments.push({ d, crossing: false })
    return
  }
  segments.push({
    d,
    crossing: true,
    crossingBarId: barId,
    ...(ink != null ? { crossingInk: ink } : null),
  })
}

/**
 * Split a dependency cubic into outside vs bar-crossing stroke segments.
 * When nothing crosses, returns a single cubic segment (preserves smooth curves).
 * Otherwise returns sampled polylines so crossing pieces can use each bar's contrast
 * ink independently (splits also when the crossed bar id changes).
 */
export function segmentDependencyStroke(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  bars: readonly GanttBarRect[],
  options: SegmentDependencyStrokeOptions = {}
): GanttDependencyStrokeSegment[] {
  const samples = Math.max(4, options.samples ?? 32)
  const pad = options.pad ?? 2
  const ignore = toIgnoreSet(options.ignoreIds)
  const { c1x, c1y, c2x, c2y } = dependencyCubicControls(x1, y1, x2, y2)

  const points: SamplePoint[] = []
  let anyCrossing = false

  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const p = cubicBezierPoint(t, x1, y1, c1x, c1y, c2x, c2y, x2, y2)
    const crossed = findCrossedBar(p.x, p.y, bars, pad, ignore)
    if (crossed) anyCrossing = true
    points.push({
      x: p.x,
      y: p.y,
      barId: crossed?.id ?? null,
      ink: crossed?.ink,
    })
  }

  if (!anyCrossing) {
    return [{ d: dependencyCubicPath(x1, y1, x2, y2), crossing: false }]
  }

  const segments: GanttDependencyStrokeSegment[] = []
  let run: { x: number; y: number }[] = [points[0]!]
  let runBarId = points[0]!.barId
  let runInk = points[0]!.ink

  for (let i = 1; i < points.length; i++) {
    const p = points[i]!
    if (p.barId === runBarId) {
      run.push(p)
      // Prefer the first ink seen in the run; fill gaps if a later sample has ink.
      if (runInk == null && p.ink != null) runInk = p.ink
      continue
    }
    // Include the boundary point on both sides so segments meet.
    run.push(p)
    pushSegment(segments, run, runBarId, runInk)
    run = [p]
    runBarId = p.barId
    runInk = p.ink
  }

  pushSegment(segments, run, runBarId, runInk)
  return segments
}

/**
 * Cull bars that cannot intersect the horizontal span of an edge (cheap prefilter).
 * Still O(bars) but skips vertical work for far-away columns; callers pass the result
 * into {@link segmentDependencyStroke}.
 */
export function barsNearEdgeSpan(
  bars: readonly GanttBarRect[],
  x1: number,
  x2: number,
  margin: number = 8
): GanttBarRect[] {
  const lo = Math.min(x1, x2) - margin
  const hi = Math.max(x1, x2) + margin
  const out: GanttBarRect[] = []
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i]!
    if (b.left + b.width < lo || b.left > hi) continue
    out.push(b)
  }
  return out
}


/**
 * Two-sided open arrowhead (chevron) at the cubic end — tip → wing, tip → wing.
 * No base stroke; fill none at the call site (Elixir `RenderCurvedLine` arrow).
 */
export function outlinedDependencyArrowPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  size: number = 10
): string {
  const { c2x, c2y } = dependencyCubicControls(x1, y1, x2, y2)
  let dx = x2 - c2x
  let dy = y2 - c2y
  const len = Math.hypot(dx, dy) || 1
  dx /= len
  dy /= len
  const px = -dy
  const py = dx
  const p1x = x2 - size * dx + size * 0.5 * px
  const p1y = y2 - size * dy + size * 0.5 * py
  const p2x = x2 - size * dx - size * 0.5 * px
  const p2y = y2 - size * dy - size * 0.5 * py
  return `M ${x2} ${y2} L ${p1x} ${p1y} M ${x2} ${y2} L ${p2x} ${p2y}`
}

/**
 * Stroke color for the arrow tip: bar label ink when the tip sits on a bar, else `fallback`.
 */
export function dependencyTipStroke(
  x: number,
  y: number,
  bars: readonly GanttBarRect[],
  fallback: string,
  pad: number = 2
): string {
  const hit = findCrossedBar(x, y, bars, pad)
  return hit?.ink ?? fallback
}
