# `@consona/interface-glass`

Refractive glass surface (SVG backdrop filter + optional WebGL).

```bash
npm install @consona/interface-glass
```

```ts
import { Glass, GlassProvider } from '@consona/interface-glass'

<GlassProvider>
  <Glass mode="svg" borderRadius={32}>
    Content
  </Glass>
</GlassProvider>
```

Optional `backgroundUrl` is used only in `mode="webgl"`. Defaults ship with no remote image.
