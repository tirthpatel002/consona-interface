# Products ↔ Projects reconciliation (2026-11-05)

## Remotes
Both trees share `origin` = `github.com/tirthpatel002/consona-interface.git`.
Remote `main` tip: `8652ef4` (`1.0.0`). Everything after that is local-only.

## Method
SHA-1 of every `.ts/.tsx/.css/...` source file, three-way against:
- `products/packages/<module>/src/...` (canonical package-split layout)
- `projects/src/modules/<module>/...` (legacy monolith layout)
- `origin/8652ef4` content at the old monolith path

## Findings (before fix)
| Class | Count | Meaning |
|---|---|---|
| Identical in both, changed vs origin | 80 | Shared progress (charts/sound/gantt/tree/etc.) |
| Unchanged vs origin in both | 414 | Untouched |
| Products changed, projects still origin | 76 | Package-split / glass-orb harden only in products |
| **Projects changed, products still origin** | **1** | **`slider.tsx` — your optical `rounded-atom` work** |
| Both diverged | 25 | Same logic; products had `@consona/interface-*` imports |
| Only in projects | 7 | Stale orb stubs + README copies |
| Only in products | 3 | Intentional new package files |

## Fix applied
1. Ported `projects` slider (+ `slider.doc.tsx`) → `products` (restored missing progress).
2. Synced all `products/packages/*/src` → `projects/src/modules/*` (+ substrate).
3. Removed stale projects-only orb stubs that products already deleted in the orb harden.

## Canonical tree
**`products/consona/interface`** is source of truth.
`projects/consona-interface` is a runtime mirror for the docs app — keep it synced from products, do not author there.
