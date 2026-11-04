/**
 * Topological build of all workspace packages.
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PACKAGE_ORDER } from './package-order.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

for (const name of PACKAGE_ORDER) {
  console.log(`\n=== building ${name} ===`)
  const r = spawnSync('npm', ['run', 'build', '-w', name], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  })
  if (r.status !== 0) {
    console.error(`Build failed: ${name}`)
    process.exit(r.status ?? 1)
  }
}

console.log('\nAll packages built.')
