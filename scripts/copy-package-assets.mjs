/**
 * Per-package asset copy. Usage:
 *   node scripts/copy-package-assets.mjs --package core
 */
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const pkgIdx = args.indexOf('--package')
const mod = pkgIdx >= 0 ? args[pkgIdx + 1] : 'core'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const pkgRoot = path.resolve(scriptDir, '..', 'packages', mod)

if (mod === 'core') {
  await mkdir(path.join(pkgRoot, 'dist/theme'), { recursive: true })
  await cp(
    path.join(pkgRoot, 'src/theme/styles.css'),
    path.join(pkgRoot, 'dist/theme/styles.css')
  )
}

if (mod === 'orb') {
  // Keep generated TS string module in sync with the WGSL source for tsc consumers.
  const wgslPath = path.join(pkgRoot, 'src/engine/effect.wgsl')
  const outPath = path.join(pkgRoot, 'src/engine/effect-wgsl.ts')
  const wgsl = await readFile(wgslPath, 'utf8')
  await writeFile(
    outPath,
    `/** Auto-generated from effect.wgsl — do not edit by hand. */\nexport default ${JSON.stringify(wgsl)} as string\n`
  )
}
