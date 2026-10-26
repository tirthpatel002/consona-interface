/**
 * @file plugin.ts
 * GanttPlugin definition for @consona/interface plugin registration (Rule 5).
 *
 * Note: GanttProvider is not registered as plugin.Provider because it requires
 * `items` + `accessors`. The <Gantt> root embeds GanttProvider (same pattern as Map).
 *
 * Overflow edge chips: gated by `showRail` / `railCollapsed` / `showEdgeChips` on <Gantt>
 * (chips default off while the expanded title rail is visible; on when collapsed or
 * `showRail={false}`; force with `showEdgeChips`).
 * Dependency SVG: `showDependencies` only. Connection dots: `onDependencyChange` && !readOnly.
 *
 * Toolbar search/filter: presentation + controlled state only (`searchValue` /
 * `onSearchChange`, `filters` / `onFiltersChange`, `filterFields`). Downstream owns
 * matching — filter `items` before passing, or use `filterGanttItems`. Replace the
 * whole toolbar via `slots.toolbar`; extend regions via nested toolbar slots
 * (`viewRange`, `search`, `filterTrigger`, `filterPopover`) through
 * `slotProps.toolbar.slots` / compose `Gantt.Toolbar`.
 *
 * Downstream: swap any region via `slots` / `slotProps` (toolbar, header, rail, row, grid,
 * nowLine, dependencies, createStrip) and nested bar/rail/row/toolbar slots.
 */

import { definePlugin } from '../../core/plugin'
import {
  Gantt,
  GanttBar,
  GanttCreateStrip,
  GanttDependencies,
  GanttEdgeChip,
  GanttGrid,
  GanttHeader,
  GanttNowLine,
  GanttRail,
  GanttRow,
  GanttToolbar,
} from './components'

export const GanttPlugin = definePlugin({
  name: 'gantt',
  version: '1.0.0',
  components: {
    Gantt,
    GanttToolbar,
    GanttHeader,
    GanttRail,
    GanttRow,
    GanttBar,
    GanttGrid,
    GanttNowLine,
    GanttDependencies,
    GanttEdgeChip,
    GanttCreateStrip,
  },
})
