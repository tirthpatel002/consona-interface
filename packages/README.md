# Consona Interface packages

npm workspaces monorepo. Published packages:

| Package | Installs |
|---|---|
| `@consona/interface-core` | Substrate, theme, provider, foundation components |
| `@consona/interface-media` | Audio player / recorder |
| `@consona/interface-orb` | WebGPU orb (depends on media) |
| `@consona/interface-sound` | Procedural sound |
| `@consona/interface-dnd` | Drag-and-drop (depends on sound) |
| `@consona/interface-overlay` | Spotlight overlays |
| `@consona/interface-onboarding` | Tours / checklists (depends on overlay) |
| `@consona/interface-map` | MapLibre maps |
| `@consona/interface-charts` | Nivo charts |
| `@consona/interface-gantt` | Gantt |
| `@consona/interface-glass` | Glass surfaces |
| `@consona/interface-interaction` | Interaction engine |
| `@consona/interface-navigation` | Navigation engine |
| `@consona/interface-composites` | Cross-module composites |
| `@consona/interface` | Umbrella — depends on all of the above |

```bash
# from repo root
npm install
npm run build:all

# core-only consumer
npm install @consona/interface-core

# everything
npm install @consona/interface
```

Legacy monolithic `src/` has been removed. Edit `packages/*/src` directly.

Registry tooling lives in `tools/registry/` and writes JSON to `/registry`.
