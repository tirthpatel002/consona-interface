# Consona Interface packages

npm workspaces. Published packages:

| Package | Version | Installs |
|---|---|---|
| `@consona/interface-core` | `1.0.0` | Substrate, theme, provider, foundation components |
| `@consona/interface-media` | `1.0.0` | Audio / video media |
| `@consona/interface-orb` | `1.0.0` | WebGPU orb (depends on media) |
| `@consona/interface-sound` | `1.0.0` | Procedural sound |
| `@consona/interface-dnd` | `1.0.0` | Drag-and-drop (depends on sound) |
| `@consona/interface-overlay` | `1.0.0` | Spotlight overlays |
| `@consona/interface-onboarding` | `1.0.0` | Tours / checklists (depends on overlay) |
| `@consona/interface-map` | `1.0.0` | MapLibre maps |
| `@consona/interface-charts` | `1.0.0` | Nivo charts |
| `@consona/interface-gantt` | `1.0.0` | Gantt |
| `@consona/interface-glass` | `1.0.0` | Glass surfaces |
| `@consona/interface-interaction` | `1.0.0` | Interaction engine |
| `@consona/interface-navigation` | `1.0.0` | Navigation engine |
| `@consona/interface-composites` | `1.0.0` | Cross-module composites |
| `@consona/interface` | `2.0.0` | Umbrella — depends on all of the above |

```bash
# from repo root
npm install
npm run build:all

# core-only consumer
npm install @consona/interface-core

# everything
npm install @consona/interface@^2
```

## Versioning

- **New modules** ship at `1.0.0` (first publish — version free).
- **Umbrella** ships at `2.0.0` because `@consona/interface@1.0.0` already exists on npm as the old monolith and **cannot** be republished.
- Internal `@consona/*` dependencies are pinned to `^1.0.0` (not `*`).

## Publish

```bash
npm login --registry https://registry.npmjs.org/
npm run publish:dry                 # verify auth + pack contents
npm run publish:all:deprecate       # publish topo-order + deprecate 1.0.0
```

Order: core → sound/overlay/glass/… → orb/dnd/onboarding/composites → umbrella.  
See `scripts/package-order.mjs`, `scripts/prepare-publish.mjs`, `scripts/publish-all.mjs`.

Legacy monolithic `src/` has been removed. Edit `packages/*/src` directly.  
Registry tooling lives in `tools/registry/` and writes JSON to `/registry`.
