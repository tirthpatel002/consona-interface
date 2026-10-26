import React from 'react'
import {
  DragOverlay,
  Draggable,
  Droppable,
  DndProvider,
  Badge,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'
import { Sparkles } from 'lucide-react'

function DragOverlayPlayground({ tiltAngle = 4 }: { tiltAngle?: number } = {}) {
  return (
    <DndProvider>
      <div className="flex flex-col gap-4 w-full max-w-lg p-3 sm:p-4 bg-bg-surface rounded-macro border border-border/60 shadow-xs">
        <div className="flex flex-col gap-1 pb-3 border-b border-border/40">
          <h4 className="font-semibold text-sm text-fg">Portal Ghost Drag Preview</h4>
          <p className="text-xs text-fg-muted">
            Drag the card below to see the floating portal ghost with tilt physics & elevation
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <Draggable id="ghost-demo-card" type="widget" data={{ name: 'Realtime Visualizer' }}>
            <div className="p-4 bg-bg-surface rounded-base border border-border shadow-xs cursor-grab active:cursor-grabbing">
              <div className="font-medium text-sm text-fg flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" /> Realtime Visualizer
              </div>
              <div className="text-xs text-fg-muted mt-1">Drag me to inspect the floating ghost</div>
            </div>
          </Draggable>

          <Droppable id="ghost-drop-target">
            <Droppable.Zone className="h-28 w-full sm:w-44">
              <div className="text-xs text-fg-muted">Drop zone</div>
            </Droppable.Zone>
          </Droppable>
        </div>

        {/* Floating Portal Overlay */}
        <DragOverlay tiltAngle={tiltAngle}>
          {(active) => (
            <div className="p-4 bg-bg-surface rounded-macro border border-primary/40 shadow-strong flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary animate-spin" />
              <span className="font-semibold text-sm text-fg">{active?.data?.name ?? 'Dragging...'}</span>
              <Badge size="sm" intent="primary">Ghost</Badge>
            </div>
          )}
        </DragOverlay>
      </div>
    </DndProvider>
  )
}

export const dragOverlayDoc: ComponentDocSpec = {
  id: 'drag-overlay',
  name: 'DragOverlay',
  badge: 'Module / DnD',
  summary:
    'Floating portal drag ghost preview rendering the active item with velocity tilt and optical elevation.',
  subcomponents: [],
  playground: {
    defaultProps: {
      tiltAngle: 3,
      zIndex: 9999,
    },
    controls: [
      {
        name: 'tiltAngle',
        label: 'Tilt Angle (deg)',
        type: 'number',
        min: 0,
        max: 15,
        defaultValue: 3,
      },
    ],
    render: (props: any) => <DragOverlayPlayground {...props} />,
  },
  examples: [],
  recipes: [],
  a11yNotes: ['DragOverlay is marked aria-hidden="true" and pointer-events: none to avoid interfering with accessibility trees.'],
}
