import React, { useRef, useState } from 'react'
import {
  Positionable,
  Badge,
  Button,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'
import { Move, Magnet, Maximize2 } from 'lucide-react'

function PositionablePlayground({ axis: propAxis }: { axis?: 'both' | 'horizontal' | 'vertical' | 'x' | 'y' } = {}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [axis, setAxis] = useState<'both' | 'horizontal' | 'vertical' | 'x' | 'y'>(propAxis ?? 'both')
  const [gridSize, setGridSize] = useState<number>(0)
  const [lastPos, setLastPos] = useState({ x: 32, y: 32 })

  React.useEffect(() => {
    if (propAxis) setAxis(propAxis)
  }, [propAxis])

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl p-3 sm:p-4 bg-bg-surface rounded-macro border border-border/60 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-sm text-fg">Freeform Spatial Canvas</h4>
          <p className="text-xs text-fg-muted mt-0.5">
            Drag floating widgets with boundary clamping & magnetic grid snapping
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-xs text-fg-muted mr-1">Axis:</span>
            {(['both', 'horizontal', 'vertical'] as const).map((a) => (
              <Button
                key={a}
                size="sm"
                intent={axis === a ? 'primary' : 'outline'}
                onPress={() => setAxis(a)}
              >
                {a}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <span className="text-xs text-fg-muted mr-1">Snap:</span>
            {[0, 16, 32].map((g) => (
              <Button
                key={g}
                size="sm"
                intent={gridSize === g ? 'primary' : 'outline'}
                onPress={() => setGridSize(g)}
              >
                {g === 0 ? 'Off' : `${g}px`}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Constrained Canvas Area */}
      <div
        ref={containerRef}
        className="relative w-full h-80 bg-bg-subtle/40 rounded-macro border-2 border-dashed border-border/60 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

        <Positionable
          initialPosition={{ x: 32, y: 32 }}
          boundaries={{ container: containerRef }}
          axis={axis}
          gridSize={gridSize > 0 ? gridSize : undefined}
          positionMode="absolute"
          onPositionChange={(p) => setLastPos(p)}
          className="w-56 p-3 bg-bg-surface rounded-base border border-border shadow-soft flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-xs text-fg flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-primary" /> Floating Widget
            </span>
            <Badge size="sm" intent="primary">
              {axis}
            </Badge>
          </div>
          <p className="text-xs text-fg-muted">
            Bound to container box.
          </p>
          <div className="text-[11px] font-mono text-fg-muted bg-bg-muted px-1.5 py-0.5 rounded-micro">
            X: {Math.round(lastPos.x)}px | Y: {Math.round(lastPos.y)}px
          </div>
        </Positionable>
      </div>
    </div>
  )
}

export const positionableDoc: ComponentDocSpec = {
  id: 'positionable',
  name: 'Positionable',
  badge: 'Module / DnD',
  summary:
    'Freeform 2D spatial draggable container with boundary constraints, magnetic grid snapping, axis locking, and document-flow transitions.',
  subcomponents: ['Positionable.Handle'],
  playground: {
    defaultProps: {
      axis: 'both',
    },
    controls: [
      {
        name: 'axis',
        label: 'Movement Axis',
        type: 'select',
        options: ['both', 'horizontal', 'vertical', 'x', 'y'],
        defaultValue: 'both',
      },
    ],
    render: (props: any) => <PositionablePlayground {...props} />,
  },
  examples: [
    {
      title: 'Viewport Clamped Floating Overlay',
      description: 'Constrain a floating panel so it cannot be dragged offscreen.',
      render: () => <PositionablePlayground />,
    },
  ],
  recipes: [
    {
      title: 'Magnetic Grid Snapping Layout',
      description: 'Snap dragged cards to an exact 16px grid interval.',
      code: `import { Positionable } from '@consona/interface'

export function SnappedCard() {
  return (
    <Positionable gridSize={16} positionMode="absolute">
      <div className="p-4 bg-bg-surface rounded-base shadow-xs">
        Aligned to 16px Grid
      </div>
    </Positionable>
  )
}`,
    },
  ],
  a11yNotes: [
    'Positionable items declare role="dialog" with aria-grabbed states.',
    'Provides touch-action: none to allow smooth stylus and touch interaction without page scrolling interference.',
  ],
}
