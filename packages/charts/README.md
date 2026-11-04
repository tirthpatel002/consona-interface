# @consona/interface-charts

Consona Interface chart module — slot-based wrappers around SVG/Canvas visualizers with a shared container, legend, toolbar, and persistent canvas tooltips.

## Install

```bash
npm install @consona/interface-charts @consona/interface-core
# plus the chart engines you use, e.g.
npm install @nivo/bar @nivo/line @nivo/pie
```

Peer chart engines (`@nivo/*`, `d3-scale`, `d3-shape`) are optional — import only the chart entrypoints you need.

## Imports

```ts
// Prefer deep entrypoints for tree-shaking
import { BarChart } from '@consona/interface-charts/bar-chart'
import { LineChart } from '@consona/interface-charts/line-chart'
import { ChartContainer, createChartTheme } from '@consona/interface-charts'
```

## Composition

```tsx
<BarChart data={rows} indexBy="month" keys={['revenue', 'expenses']} title="Revenue">
  <BarChart.Tooltip>
    {({ title, label, value, color }) => (
      <BarChart.Tooltip title={title} label={label} value={value} color={color} />
    )}
  </BarChart.Tooltip>
</BarChart>
```

- **Default shell** — header, toolbar, legend, canvas, footer via slots or props.
- **Tooltip-only children** compose into the default shell (they do not replace the chart).
- **Headless** — pass `Container` / `Canvas` / other layout chrome as children to own the layout.
- **Engine escape hatch** — `chartProps` (alias: deprecated `nivoProps`) spreads onto the visualizer last.

## Theming

```ts
import { createChartTheme, resolveChartPalette } from '@consona/interface-charts'

const theme = createChartTheme()
const colors = resolveChartPalette('categorical')
```

`createNivoTheme` remains as a deprecated alias of `createChartTheme`.

## Slots

Common slots on every chart: `container`, `canvas`, `chart`, `header`, `toolbar`, `legend`, `tooltip`, `empty`, `loading`, `footer`.
