# `@consona/interface`

Umbrella package — re-exports every Consona Interface module.

```bash
npm install @consona/interface@^2
```

```ts
import { Button, InterfaceProvider } from '@consona/interface'
import { Draggable } from '@consona/interface/dnd'
import '@consona/interface/styles.css'
```

## Why `2.0.0`?

`@consona/interface@1.0.0` on npm was a single monolithic tarball. That version is immutable. This release is the workspace umbrella (`packages/interface`) and depends on the split `@consona/interface-*` packages.

For a smaller install, use modules directly:

```bash
npm install @consona/interface-core
# optional
npm install @consona/interface-dnd @consona/interface-media
```

See the [monorepo README](../../README.md) and [packages/](../README.md).
