import { cp, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

await mkdir(path.join(root, 'dist/theme'), { recursive: true })
await mkdir(path.join(root, 'dist/registry'), { recursive: true })

await cp(path.join(root, 'src/theme/styles.css'), path.join(root, 'dist/theme/styles.css'))
await cp(path.join(root, 'src/registry/registry.json'), path.join(root, 'dist/registry/registry.json'))
await cp(
  path.join(root, 'src/registry/metadata-registry.json'),
  path.join(root, 'dist/registry/metadata-registry.json')
)
