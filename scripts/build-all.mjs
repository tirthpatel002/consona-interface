/**
 * Topological build of all workspace packages.
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const ORDER = [
  '@consona/interface-core',
  // leaves (only need core)
  '@consona/interface-sound',
  '@consona/interface-overlay',
  '@consona/interface-glass',
  '@consona/interface-interaction',
  '@consona/interface-navigation',
  '@consona/interface-gantt',
  '@consona/interface-charts',
  '@consona/interface-map',
  '@consona/interface-media',
  // dependents
  '@consona/interface-orb',
  '@consona/interface-dnd',
  '@consona/interface-onboarding',
  '@consona/interface-composites',
  // umbrella
  '@consona/interface',
]

for (const name of ORDER) {
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
