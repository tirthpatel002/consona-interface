# @consona/interface-gantt

Accessors-based Gantt chart for Consona Interface — pure `GanttEngine`, sticky rail, virtualized columns/rows, snap move/resize, optional dependency SVG, and a slottable compound UI.

## Install

```bash
pnpm add @consona/interface-gantt @heroicons/react
```

Peers: `react`, `react-dom`, `@consona/interface-core`, `@heroicons/react`.

## Quick start

```tsx
import { Gantt } from '@consona/interface-gantt'

const items = [
  { id: '1', label: 'Design', start: '2026-03-01', end: '2026-03-05', color: '#3b82f6' },
  { id: '2', label: 'Build', start: '2026-03-04', end: '2026-03-12', dependencies: ['1'] },
]

export function Plan() {
  return (
    <Gantt
      items={items}
      showDependencies
      onItemChange={({ id, start, end }) => {
        /* persist */
      }}
      onDependencyChange={({ fromId, toId, action }) => {
        /* persist edge */
      }}
    />
  )
}
```

Default accessors read `id` / `key`, `start` / `startDate`, `end` / `endDate`, `label` / `title` / `name`, `color`, and `dependencies`. Pass custom `accessors` for other shapes.

## View range (controlled vs uncontrolled)

```tsx
// Uncontrolled
<Gantt items={items} defaultViewRange="week" />

// Controlled
<Gantt
  items={items}
  viewRange={viewRange}
  onViewRangeChange={setViewRange}
/>
```

Toolbar changes always update the engine; `onViewRangeChange` notifies the parent. Search/filter UI is presentation only — filter `items` yourself (or use `filterGanttItems`).

## Engine ownership

```tsx
import { Gantt, createGanttEngine, GanttProvider } from '@consona/interface-gantt'

const engine = createGanttEngine({ viewRange: 'month' })

<Gantt items={items} engine={engine} />
```

- Injected `engine` is never destroyed by the provider.
- Owned engines are Strict Mode–safe (deferred destroy on unmount).
- Prefer one provider / chart instance per page unless you intentionally share an engine.

## Composition & slots

Compound parts: `Gantt.Toolbar`, `.Header`, `.Rail`, `.Row`, `.Bar`, `.Grid`, `.NowLine`, `.Dependencies`, `.EdgeChip`, `.CreateStrip`.

Slot overrides: `toolbar`, `header`, `railCollapse`, `rail`, `row`, `grid`, `nowLine`, `dependencies`, `createStrip`, `empty`.

Compound `children` render **inside** the scroll viewport (scroller + header stay mounted). Omit default rows when composing your own body.

## Interaction notes

- Move / resize snaps to the active view grid; move preserves duration in **calendar cell units** (DST-safe).
- Dependency dots appear when `onDependencyChange` is set and `readOnly` is false; the SVG layer mounts with `showDependencies`.
- Create strip mounts when `onCreate` is provided.
- `prefers-reduced-motion` disables smooth scroll and width transitions.
- Bars support arrow-key nudge (Alt+arrows resize edges).

## Entries

- `@consona/interface-gantt` — full surface
- `@consona/interface-gantt/gantt` (+ per-component subpaths)

## Tests

```bash
pnpm --filter @consona/interface-gantt test
```

Runs DST / snap / column+row window self-tests via `node:test`.
