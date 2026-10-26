/**
 * @file plugin.ts
 * DndPlugin definition for @consona/interface plugin registration system (Rule 5).
 */

import { definePlugin } from '../../core/plugin'
import {
  DndBoard,
  Draggable,
  DragOverlay,
  Droppable,
  Positionable,
  Sortable,
  SortableGrid,
  SortableList,
} from './components'
import { DndProvider } from './context'

export const DndPlugin = definePlugin({
  name: 'dnd',
  version: '1.0.0',
  Provider: DndProvider,
  components: {
    Draggable,
    Droppable,
    Sortable,
    SortableList,
    SortableGrid,
    DndBoard,
    Positionable,
    DragOverlay,
  },
})
