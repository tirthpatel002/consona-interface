import { cp, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const umbrella = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'packages', 'interface')
const coreCss = path.resolve(umbrella, '../core/dist/theme/styles.css')

await mkdir(path.join(umbrella, 'dist'), { recursive: true })
await cp(coreCss, path.join(umbrella, 'dist', 'styles.css'))
