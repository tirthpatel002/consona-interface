/**
 * Split monolithic @consona/interface into workspace packages.
 *
 * Run from interface root: node scripts/split-packages.mjs
 *
 * Idempotent enough to re-run after cleaning packages/ (except it expects src/ still present).
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcRoot = path.join(root, 'src')
const packagesRoot = path.join(root, 'packages')

const MODULES = [
  'charts',
  'composites',
  'dnd',
  'gantt',
  'glass',
  'interaction',
  'map',
  'media',
  'navigation',
  'onboarding',
  'orb',
  'overlay',
  'sound',
]

/** Feature package → extra workspace deps beyond interface-core */
const EXTRA_DEPS = {
  orb: ['@consona/interface-media'],
  dnd: ['@consona/interface-sound'],
  onboarding: ['@consona/interface-overlay'],
  composites: ['@consona/interface-media', '@consona/interface-orb'],
}

const pkgMeta = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))

function pkgName(mod) {
  return `@consona/interface-${mod}`
}

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true })
}

function listFiles(dir, exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.css', '.json'])) {
  const out = []
  if (!existsSync(dir)) return out
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === 'dist') continue
      out.push(...listFiles(p, exts))
    } else if (exts.has(path.extname(ent.name)) || ent.name.endsWith('.d.ts')) {
      out.push(p)
    }
  }
  return out
}

function copyDir(from, to) {
  ensureDir(path.dirname(to))
  cpSync(from, to, { recursive: true })
}

/**
 * Rewrite a relative import specifier that escapes into another package.
 * Returns the new specifier or null if unchanged.
 */
function rewriteSpecifier(spec, fromFile, packageMod) {
  if (!spec.startsWith('.')) return null

  const fromDir = path.dirname(fromFile)
  const resolved = path.resolve(fromDir, spec)
  const norm = resolved.replace(/\\/g, '/')

  // Map absolute-ish path under original src layout after move:
  // packages/<mod>/src/...  mirrors either modules/<mod>/... or core substrate layout
  // We resolve against the NEW file location but detect intent via path segments.

  const relFromPkgSrc = path.relative(path.join(packagesRoot, packageMod, 'src'), resolved)

  // If still inside this package, keep relative
  if (!relFromPkgSrc.startsWith('..') && !path.isAbsolute(relFromPkgSrc)) {
    return null
  }

  // Core package: substrate lives in-package; only rewrite if somehow outside
  if (packageMod === 'core') {
    return null
  }

  // Detect target module / substrate from resolved path when it points into packages/core
  // or legacy-style segments in the relative string itself.
  const segs = spec.replace(/\\/g, '/').split('/')

  // Cross-feature: ../sound, ../../orb/components/... → package root barrel
  for (const mod of MODULES) {
    if (mod === packageMod) continue
    const idx = segs.findIndex((s) => s === mod)
    if (idx !== -1 && segs.slice(0, idx).every((s) => s === '..')) {
      return pkgName(mod)
    }
  }

  // ../core/... or ../../../../core/cn → interface-core
  const coreIdx = segs.findIndex((s) => s === 'core')
  if (coreIdx !== -1 && segs.slice(0, coreIdx).every((s) => s === '..')) {
    return '@consona/interface-core'
  }

  // theme / provider / hooks escapes
  for (const folder of ['theme', 'provider', 'hooks']) {
    const idx = segs.findIndex((s) => s === folder)
    if (idx !== -1 && segs.slice(0, idx).every((s) => s === '..')) {
      return '@consona/interface-core'
    }
  }

  return null
}

function rewriteFileImports(filePath, packageMod) {
  let text = readFileSync(filePath, 'utf8')
  const original = text

  text = text.replace(
    /from\s+['"]([^'"]+)['"]/g,
    (full, spec) => {
      const next = rewriteSpecifier(spec, filePath, packageMod)
      if (!next) return full
      return full.replace(spec, next)
    }
  )

  text = text.replace(
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    (full, spec) => {
      const next = rewriteSpecifier(spec, filePath, packageMod)
      if (!next) return full
      return full.replace(spec, next)
    }
  )

  // export ... from
  text = text.replace(
    /export\s+(?:\*|\{[^}]*\})\s+from\s+['"]([^'"]+)['"]/g,
    (full, spec) => {
      const next = rewriteSpecifier(spec, filePath, packageMod)
      if (!next) return full
      return full.replace(spec, next)
    }
  )

  if (text !== original) writeFileSync(filePath, text)
  return text !== original
}

function buildExportsMap(mod, pkgSrc) {
  const exportsMap = {
    '.': {
      types: './dist/index.d.ts',
      import: './dist/index.js',
      default: './dist/index.js',
    },
  }

  if (mod === 'core') {
    exportsMap['./styles.css'] = './dist/theme/styles.css'
    exportsMap['./theme'] = {
      types: './dist/theme/index.d.ts',
      import: './dist/theme/index.js',
      default: './dist/theme/index.js',
    }
    exportsMap['./provider'] = {
      types: './dist/provider/index.d.ts',
      import: './dist/provider/index.js',
      default: './dist/provider/index.js',
    }
  }

  if (mod === 'media') {
    // audio alias handled by umbrella; optional deep path later
  }

  const componentsDir = path.join(
    pkgSrc,
    mod === 'core' ? 'modules/core/components' : 'components'
  )
  if (existsSync(componentsDir)) {
    for (const ent of readdirSync(componentsDir, { withFileTypes: true })) {
      if (!ent.isDirectory()) continue
      const indexTs = path.join(componentsDir, ent.name, 'index.ts')
      const indexTsx = path.join(componentsDir, ent.name, 'index.tsx')
      if (!existsSync(indexTs) && !existsSync(indexTsx)) continue
      const rel =
        mod === 'core'
          ? `./dist/modules/core/components/${ent.name}/index.js`
          : `./dist/components/${ent.name}/index.js`
      exportsMap[`./${ent.name}`] = {
        types: rel.replace(/\.js$/, '.d.ts'),
        import: rel,
        default: rel,
      }
    }
  }

  return exportsMap
}

function writePackageJson(mod) {
  const name = pkgName(mod)
  const isCore = mod === 'core'
  const dependencies = {}
  if (!isCore) {
    dependencies['@consona/interface-core'] = '^1.0.0'
  }
  for (const dep of EXTRA_DEPS[mod] ?? []) {
    dependencies[dep] = '^1.0.0'
  }

  // Copy runtime deps onto core; feature packages peer react only + workspace deps
  const coreDeps = isCore ? { ...pkgMeta.dependencies } : {}
  const peerDependencies = {
    react: pkgMeta.peerDependencies.react,
    'react-dom': pkgMeta.peerDependencies['react-dom'],
  }
  const peerDependenciesMeta = {}

  if (mod === 'dnd') {
    for (const p of ['@dnd-kit/core', '@dnd-kit/modifiers', '@dnd-kit/sortable', '@dnd-kit/utilities']) {
      peerDependencies[p] = pkgMeta.peerDependencies[p]
      peerDependenciesMeta[p] = { optional: true }
    }
  }
  if (mod === 'map') {
    peerDependencies['maplibre-gl'] = pkgMeta.peerDependencies['maplibre-gl']
    peerDependenciesMeta['maplibre-gl'] = { optional: true }
  }
  if (mod === 'charts') {
    for (const [k, v] of Object.entries(pkgMeta.peerDependencies)) {
      if (k.startsWith('@nivo/') || k.startsWith('d3-')) {
        peerDependencies[k] = v
        peerDependenciesMeta[k] = { optional: true }
      }
    }
  }

  const pkgSrc = path.join(packagesRoot, mod, 'src')
  const pkg = {
    name,
    version: pkgMeta.version,
    description:
      mod === 'core'
        ? 'Consona Interface core — substrate, theme, provider, and foundation components'
        : `Consona Interface ${mod} module`,
    license: pkgMeta.license,
    author: pkgMeta.author,
    type: 'module',
    main: './dist/index.js',
    module: './dist/index.js',
    types: './dist/index.d.ts',
    sideEffects: isCore ? ['**/*.css', './dist/theme/styles.css'] : false,
    exports: buildExportsMap(mod, pkgSrc),
    files: ['dist', 'README.md', 'LICENSE'],
    scripts: {
      build: 'tsc -p tsconfig.build.json && node ../../scripts/copy-package-assets.mjs --package ' + mod,
      prebuild:
        'node --input-type=module -e "import { rm } from \'node:fs/promises\'; await rm(\'dist\', { recursive: true, force: true })"',
      'type-check': 'tsc -p tsconfig.json --noEmit',
      prepublishOnly: 'npm run build',
    },
    peerDependencies,
    ...(Object.keys(peerDependenciesMeta).length ? { peerDependenciesMeta } : {}),
    dependencies: { ...coreDeps, ...dependencies },
    publishConfig: pkgMeta.publishConfig,
    engines: pkgMeta.engines,
  }

  writeFileSync(path.join(packagesRoot, mod, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')
}

function writeTsconfigs(mod) {
  const pkgDir = path.join(packagesRoot, mod)
  writeFileSync(
    path.join(pkgDir, 'tsconfig.json'),
    JSON.stringify(
      {
        extends: '../../tsconfig.base.json',
        compilerOptions: {
          noEmit: true,
          rootDir: './src',
          paths: {
            '@consona/interface-core': ['../core/src/index.ts'],
            '@consona/interface-core/*': ['../core/src/*'],
            '@consona/interface-media': ['../media/src/index.ts'],
            '@consona/interface-media/*': ['../media/src/*'],
            '@consona/interface-orb': ['../orb/src/index.ts'],
            '@consona/interface-orb/*': ['../orb/src/*'],
            '@consona/interface-sound': ['../sound/src/index.ts'],
            '@consona/interface-sound/*': ['../sound/src/*'],
            '@consona/interface-overlay': ['../overlay/src/index.ts'],
            '@consona/interface-overlay/*': ['../overlay/src/*'],
            '@consona/interface-dnd': ['../dnd/src/index.ts'],
            '@consona/interface-onboarding': ['../onboarding/src/index.ts'],
            '@consona/interface-composites': ['../composites/src/index.ts'],
            '@consona/interface-charts': ['../charts/src/index.ts'],
            '@consona/interface-map': ['../map/src/index.ts'],
            '@consona/interface-gantt': ['../gantt/src/index.ts'],
            '@consona/interface-glass': ['../glass/src/index.ts'],
            '@consona/interface-interaction': ['../interaction/src/index.ts'],
            '@consona/interface-navigation': ['../navigation/src/index.ts'],
          },
        },
        include: ['src/**/*'],
      },
      null,
      2
    ) + '\n'
  )

  // Build config must NOT inherit `paths` to sibling src — resolve via package dist.
  writeFileSync(
    path.join(pkgDir, 'tsconfig.build.json'),
    JSON.stringify(
      {
        extends: '../../tsconfig.base.json',
        compilerOptions: {
          noEmit: false,
          declaration: true,
          declarationMap: true,
          sourceMap: false,
          outDir: './dist',
          rootDir: './src',
          allowImportingTsExtensions: false,
        },
        include: ['src/**/*'],
        exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      },
      null,
      2
    ) + '\n'
  )
}

function writeCoreIndex() {
  const index = `/** @consona/interface-core public barrel */
export * from './core'
export * from './theme'
export * from './provider'
export * from './hooks'
export * from './modules/core'
`
  writeFileSync(path.join(packagesRoot, 'core', 'src', 'index.ts'), index)
}

function writeFeatureIndex(mod) {
  // modules already have index.ts at root of copied tree
  const idx = path.join(packagesRoot, mod, 'src', 'index.ts')
  if (!existsSync(idx)) {
    writeFileSync(idx, `export * from './components'\n`)
  }
}

function writeUmbrella() {
  const dir = path.join(packagesRoot, 'interface')
  ensureDir(path.join(dir, 'src'))

  const deps = {
    '@consona/interface-core': '^1.0.0',
  }
  for (const mod of MODULES) {
    deps[pkgName(mod)] = '^1.0.0'
  }

  const exportsMap = {
    '.': {
      types: './dist/index.d.ts',
      import: './dist/index.js',
      default: './dist/index.js',
    },
    './styles.css': './node_modules/@consona/interface-core/dist/theme/styles.css',
    './core': {
      types: './dist/core.d.ts',
      import: './dist/core.js',
      default: './dist/core.js',
    },
  }

  for (const mod of MODULES) {
    exportsMap[`./${mod}`] = {
      types: `./dist/${mod}.d.ts`,
      import: `./dist/${mod}.js`,
      default: `./dist/${mod}.js`,
    }
  }
  exportsMap['./audio'] = exportsMap['./media']

  // Better styles path: re-export file we copy at build
  exportsMap['./styles.css'] = './dist/styles.css'

  const umbrellaPkg = {
    name: '@consona/interface',
    version: pkgMeta.version,
    description: pkgMeta.description,
    license: pkgMeta.license,
    author: pkgMeta.author,
    type: 'module',
    main: './dist/index.js',
    module: './dist/index.js',
    types: './dist/index.d.ts',
    sideEffects: ['**/*.css', './dist/styles.css'],
    exports: exportsMap,
    files: ['dist', 'README.md', 'LICENSE'],
    scripts: {
      build: 'tsc -p tsconfig.build.json && node ../../scripts/copy-umbrella-assets.mjs',
      prebuild:
        'node --input-type=module -e "import { rm } from \'node:fs/promises\'; await rm(\'dist\', { recursive: true, force: true })"',
      'type-check': 'tsc -p tsconfig.json --noEmit',
      prepublishOnly: 'npm run build',
    },
    dependencies: deps,
    peerDependencies: {
      react: pkgMeta.peerDependencies.react,
      'react-dom': pkgMeta.peerDependencies['react-dom'],
    },
    publishConfig: pkgMeta.publishConfig,
    engines: pkgMeta.engines,
  }
  writeFileSync(path.join(dir, 'package.json'), JSON.stringify(umbrellaPkg, null, 2) + '\n')

  const lines = [
    `export * from '@consona/interface-core'`,
    ...MODULES.map((m) => `export * from '${pkgName(m)}'`),
    '',
  ]
  writeFileSync(path.join(dir, 'src', 'index.ts'), lines.join('\n'))

  writeFileSync(path.join(dir, 'src', 'core.ts'), `export * from '@consona/interface-core'\n`)
  for (const mod of MODULES) {
    writeFileSync(path.join(dir, 'src', `${mod}.ts`), `export * from '${pkgName(mod)}'\n`)
  }

  writeTsconfigs('interface')
  // Fix interface tsconfig name — writeTsconfigs uses packages/interface
}

// --- main ---

if (!existsSync(srcRoot)) {
  console.error(
    'Legacy src/ is gone — packages/ is the source of truth.\n' +
      'Do not re-run split-packages.mjs; edit packages/*/src directly.'
  )
  process.exit(1)
}

console.log('Cleaning packages/ …')
if (existsSync(packagesRoot)) rmSync(packagesRoot, { recursive: true, force: true })
ensureDir(packagesRoot)

console.log('Creating @consona/interface-core …')
{
  const dest = path.join(packagesRoot, 'core', 'src')
  ensureDir(dest)
  copyDir(path.join(srcRoot, 'core'), path.join(dest, 'core'))
  copyDir(path.join(srcRoot, 'theme'), path.join(dest, 'theme'))
  copyDir(path.join(srcRoot, 'provider'), path.join(dest, 'provider'))
  copyDir(path.join(srcRoot, 'hooks'), path.join(dest, 'hooks'))
  ensureDir(path.join(dest, 'modules'))
  copyDir(path.join(srcRoot, 'modules', 'core'), path.join(dest, 'modules', 'core'))
  if (existsSync(path.join(srcRoot, 'global.d.ts'))) {
    cpSync(path.join(srcRoot, 'global.d.ts'), path.join(dest, 'global.d.ts'))
  }
  writeCoreIndex()
  writePackageJson('core')
  writeTsconfigs('core')
}

for (const mod of MODULES) {
  console.log(`Creating ${pkgName(mod)} …`)
  const dest = path.join(packagesRoot, mod, 'src')
  copyDir(path.join(srcRoot, 'modules', mod), dest)
  writeFeatureIndex(mod)
  writePackageJson(mod)
  writeTsconfigs(mod)
}

console.log('Rewriting cross-package imports …')
let changed = 0
for (const mod of ['core', ...MODULES]) {
  const files = listFiles(path.join(packagesRoot, mod, 'src'))
  for (const f of files) {
    if (!f.endsWith('.ts') && !f.endsWith('.tsx')) continue
    if (rewriteFileImports(f, mod)) changed++
  }
}
console.log(`Rewrote imports in ${changed} files`)

console.log('Creating umbrella @consona/interface …')
writeUmbrella()

// Base tsconfig for packages
writeFileSync(
  path.join(root, 'tsconfig.base.json'),
  JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        lib: ['ES2022', 'DOM', 'DOM.Iterable'],
        jsx: 'react-jsx',
        strict: true,
        skipLibCheck: true,
        noUncheckedIndexedAccess: true,
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        isolatedModules: true,
        resolveJsonModule: true,
        declaration: true,
        types: ['node', 'react', 'react-dom'],
      },
    },
    null,
    2
  ) + '\n'
)

console.log('Done. Next: update root package.json workspaces and install.')
