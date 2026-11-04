/**
 * Align package.jsons for a safe public publish:
 * - Feature packages @ 1.0.0 (first publish)
 * - Umbrella @ 2.0.0 (replaces monolithic 1.0.0 — packaging break)
 * - Pin @consona/* deps to ^1.0.0 (no bare "*")
 * - Include LICENSE in files[]
 * - Ensure prepublishOnly builds
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PACKAGE_ORDER, packageDir } from './package-order.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const FEATURE_VERSION = '1.0.0'
const UMBRELLA_VERSION = '2.0.0'
const CONSONA_RANGE = `^${FEATURE_VERSION}`

function readPkg(dir) {
  const file = path.join(root, 'packages', dir, 'package.json')
  return { file, pkg: JSON.parse(fs.readFileSync(file, 'utf8')) }
}

function writePkg(file, pkg) {
  fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`)
}

function pinConsonaDeps(deps) {
  if (!deps) return deps
  const next = { ...deps }
  for (const key of Object.keys(next)) {
    if (key.startsWith('@consona/')) next[key] = CONSONA_RANGE
  }
  return next
}

for (const name of PACKAGE_ORDER) {
  const dir = packageDir(name)
  const { file, pkg } = readPkg(dir)
  const isUmbrella = name === '@consona/interface'

  pkg.version = isUmbrella ? UMBRELLA_VERSION : FEATURE_VERSION
  pkg.dependencies = pinConsonaDeps(pkg.dependencies)

  const files = new Set(pkg.files ?? ['dist', 'README.md'])
  files.add('dist')
  files.add('README.md')
  files.add('LICENSE')
  pkg.files = [...files]

  pkg.scripts = {
    ...pkg.scripts,
    prepublishOnly: 'npm run build',
  }

  if (!pkg.publishConfig) {
    pkg.publishConfig = {
      access: 'public',
      registry: 'https://registry.npmjs.org/',
    }
  } else {
    pkg.publishConfig.access = 'public'
    pkg.publishConfig.registry = 'https://registry.npmjs.org/'
  }

  writePkg(file, pkg)
  console.log(`${name}@${pkg.version} ← packages/${dir}`)
}

console.log('\nPrepared for publish.')
console.log(`  modules: ${FEATURE_VERSION}`)
console.log(`  umbrella: ${UMBRELLA_VERSION}`)
console.log(`  @consona/* deps: ${CONSONA_RANGE}`)
