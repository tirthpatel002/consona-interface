/**
 * @file gantt-dependencies.tsx
 * Optional SVG dependency layer connecting predecessor → successor bars.
 * Uses live drag layout (engine.state.drag) every pointer move.
 * Strokes are a uniform whitish color (bars use soft pastel fills so the line stays readable).
 */

import React, { useMemo } from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import {
  dependencyCubicPath,
  GANTT_BAR_VISUAL_HEIGHT,
  outlinedDependencyArrowPath,
} from '../../engine'
import { useOptionalGantt } from '../../hooks'

export interface GanttDependenciesSlots {}

export interface GanttDependenciesProps extends React.ComponentPropsWithoutRef<'svg'> {
  /** Row height used to compute vertical anchors. Default: 40 (h-10). */
  rowHeight?: number
  /** Visual bar height (kept for API compat). Default: 28 (h-7). */
  barHeight?: number
  /** Uniform stroke for the whole edge + arrowhead. Default: whitish. */
  stroke?: string
  /** Opacity for dependency strokes. Default: 0.92. */
  strokeOpacity?: number
  /** Custom CSS classes. */
  className?: string
}

/** Soft light-gray stroke — readable on soft pastel bars. */
const WHITISH_STROKE = 'color-mix(in oklab, white 48%, var(--fg, #111))'

interface EdgeGeom {
  key: string
  path: string
  arrowPath: string
  tipStroke: string
}

const GanttDependenciesPrimitive = ({
  rowHeight = 40,
  barHeight: _barHeight = GANTT_BAR_VISUAL_HEIGHT,
  stroke = WHITISH_STROKE,
  strokeOpacity = 0.92,
  className,
  ...props
}: GanttDependenciesProps) => {
  const gantt = useOptionalGantt()

  const items = gantt?.helpers.context.items
  const getLiveBarLayout = gantt?.helpers.getLiveBarLayout
  const getId = gantt?.helpers.getId
  const getDependencies = gantt?.helpers.getDependencies
  const timelineWidthPx = gantt?.helpers.timelineWidthPx ?? 0
  const drag = gantt?.state.drag
  const dependencyLink = gantt?.state.dependencyLink

  const edges = useMemo(() => {
    if (!items || !getLiveBarLayout || !getId || !getDependencies) return [] as EdgeGeom[]

    const idToIndex = new Map<string, number>()
    items.forEach((item, i) => idToIndex.set(getId(item), i))

    const result: EdgeGeom[] = []
    items.forEach((item, rowIndex) => {
      const toId = getId(item)
      const deps = getDependencies(item)
      const toLayout = getLiveBarLayout(item)
      for (const fromId of deps) {
        const fromIndex = idToIndex.get(fromId)
        if (fromIndex == null) continue
        const fromItem = items[fromIndex]
        if (!fromItem) continue
        const fromLayout = getLiveBarLayout(fromItem)
        const x1 = fromLayout.left + fromLayout.width
        const y1 = fromIndex * rowHeight + rowHeight / 2
        const x2 = toLayout.left
        const y2 = rowIndex * rowHeight + rowHeight / 2
        result.push({
          key: `${fromId}->${toId}`,
          path: dependencyCubicPath(x1, y1, x2, y2),
          arrowPath: outlinedDependencyArrowPath(x1, y1, x2, y2),
          tipStroke: stroke,
        })
      }
    })
    return result
  }, [items, getLiveBarLayout, getId, getDependencies, rowHeight, drag, stroke])

  const linkPath = useMemo(() => {
    if (!dependencyLink || !items || !getLiveBarLayout || !getId) return null
    const sourceIndex = items.findIndex((it) => getId(it) === dependencyLink.sourceId)
    if (sourceIndex < 0) return null
    const sourceItem = items[sourceIndex]!
    const layout = getLiveBarLayout(sourceItem)
    const x1 =
      dependencyLink.side === 'start' ? layout.left : layout.left + layout.width
    const y1 = sourceIndex * rowHeight + rowHeight / 2
    const x2 = dependencyLink.x
    const y2 = dependencyLink.y
    return {
      path: dependencyCubicPath(x1, y1, x2, y2),
      arrowPath: outlinedDependencyArrowPath(x1, y1, x2, y2),
      tipStroke: stroke,
      x1,
      y1,
      x2,
      y2,
    }
  }, [dependencyLink, items, getLiveBarLayout, getId, rowHeight, stroke])

  if (!gantt) return null
  if (edges.length === 0 && !linkPath) return null

  const height =
    Math.max(
      (items?.length ?? 0) * rowHeight,
      linkPath?.y2 ?? 0,
      dependencyLink?.y ?? 0
    ) + rowHeight

  return (
    <svg
      data-slot="gantt-dependencies"
      className={cn('pointer-events-none absolute left-0 top-0 z-[10]', className)}
      width={timelineWidthPx}
      height={height}
      aria-hidden
      {...props}
    >
      {edges.map((edge) => (
        <g key={edge.key} data-edge={edge.key}>
          <path
            d={edge.path}
            fill="none"
            stroke={stroke}
            strokeWidth={1.5}
            strokeLinecap="round"
            opacity={strokeOpacity}
          />
          <path
            d={edge.arrowPath}
            fill="none"
            stroke={edge.tipStroke}
            strokeWidth={1.5}
            strokeLinecap="round"
            opacity={strokeOpacity}
          />
        </g>
      ))}
      {linkPath && (
        <>
          <path
            d={linkPath.path}
            fill="none"
            stroke={stroke}
            strokeWidth={2}
            strokeDasharray="6 4"
            strokeLinecap="round"
            opacity={strokeOpacity}
          />
          <path
            d={linkPath.arrowPath}
            fill="none"
            stroke={linkPath.tipStroke}
            strokeWidth={1.5}
            strokeLinecap="round"
            opacity={strokeOpacity}
          />
          <circle cx={linkPath.x1} cy={linkPath.y1} r={5} fill={stroke} opacity={0.35} />
          <circle cx={linkPath.x2} cy={linkPath.y2} r={5} fill={stroke} opacity={0.45} />
        </>
      )}
    </svg>
  )
}

export const GanttDependencies = createInterfaceComponent<
  GanttDependenciesProps,
  GanttDependenciesSlots
>(
  {
    name: 'GanttDependencies',
    category: 'data',
    description:
      'Optional SVG dependency layer; uniform whitish stroke over soft pastel bars.',
    version: '1.0.0',
    props: {
      rowHeight: 40,
      barHeight: GANTT_BAR_VISUAL_HEIGHT,
      stroke: WHITISH_STROKE,
      strokeOpacity: 0.92,
    },
    slots: {},
  },
  GanttDependenciesPrimitive
)
