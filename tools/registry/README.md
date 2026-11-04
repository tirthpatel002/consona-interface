# Registry tooling

Unpublished AST catalog tools. Scans `packages/*/src` and writes:

- [`../../registry/registry.json`](../../registry/registry.json)
- [`../../registry/metadata-registry.json`](../../registry/metadata-registry.json)

```bash
npm run build:registry
```

Studio imports this folder via the `@registry` alias.
