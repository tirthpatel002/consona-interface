/**
 * Publish workspace packages in topological order.
 *
 *   node scripts/publish-all.mjs              # real publish
 *   node scripts/publish-all.mjs --dry-run    # npm publish --dry-run each
 *   node scripts/publish-all.mjs --skip-build
 *   node scripts/publish-all.mjs --deprecate-old
 *
 * Always targets https://registry.npmjs.org/ (ignores local Verdaccio default).
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PACKAGE_ORDER, packageDir } from './package-order.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REGISTRY = 'https://registry.npmjs.org/'
const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run')
const skipBuild = args.has('--skip-build')
const deprecateOld = args.has('--deprecate-old')

function run(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: process.env,
    ...opts,
  })
  return r.status ?? 1
}

function runCapture(cmd, cmdArgs) {
  const r = spawnSync(cmd, cmdArgs, {
    cwd: root,
    encoding: 'utf8',
    shell: true,
    env: process.env,
  })
  return {
    status: r.status ?? 1,
    stdout: (r.stdout ?? '').trim(),
    stderr: (r.stderr ?? '').trim(),
  }
}

console.log(dryRun ? '=== dry-run publish ===' : '=== publish ===')
console.log(`registry: ${REGISTRY}`)

// 1. Auth gate
const who = runCapture('npm', ['whoami', '--registry', REGISTRY])
if (who.status !== 0 || !who.stdout) {
  console.error(`
npm auth failed for ${REGISTRY}.

Fix:
  npm login --registry ${REGISTRY}

Then confirm:
  npm whoami --registry ${REGISTRY}
  npm access list packages @consona --registry ${REGISTRY}
`)
  process.exit(1)
}
console.log(`authenticated as: ${who.stdout}`)

// 2. Prepare manifests
if (run('node', ['scripts/prepare-publish.mjs']) !== 0) process.exit(1)

// 3. Build
if (!skipBuild) {
  if (run('node', ['scripts/build-all.mjs']) !== 0) process.exit(1)
}

// 4. Publish in order
const published = []
for (const name of PACKAGE_ORDER) {
  const dir = packageDir(name)
  const pkgPath = path.join(root, 'packages', dir, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  const tag = `${name}@${pkg.version}`

  const view = runCapture('npm', [
    'view',
    tag,
    'version',
    '--registry',
    REGISTRY,
  ])
  if (view.status === 0 && view.stdout === pkg.version) {
    console.log(`\nskip ${tag} (already on registry)`)
    published.push({ name, version: pkg.version, skipped: true })
    continue
  }

  console.log(`\n=== publishing ${tag} ===`)
  const publishArgs = [
    'publish',
    '-w',
    name,
    '--access',
    'public',
    '--registry',
    REGISTRY,
  ]
  if (dryRun) publishArgs.push('--dry-run')

  const status = run('npm', publishArgs)
  if (status !== 0) {
    console.error(`Publish failed: ${tag}`)
    process.exit(status)
  }
  published.push({ name, version: pkg.version, skipped: false })
}

// 5. Optional deprecate monolithic 1.0.0
if (deprecateOld && !dryRun) {
  const msg =
    'Monolithic 1.0.0 superseded. Install @consona/interface@^2 (umbrella) or @consona/interface-core@^1 for a slim install. See https://www.npmjs.com/package/@consona/interface'
  console.log('\n=== deprecating @consona/interface@1.0.0 ===')
  const status = run('npm', [
    'deprecate',
    '@consona/interface@1.0.0',
    msg,
    '--registry',
    REGISTRY,
  ])
  if (status !== 0) {
    console.error('Deprecate failed (publish may still be OK). Re-run with --deprecate-old after fixing auth/permissions.')
    process.exit(status)
  }
}

console.log('\nDone.')
for (const p of published) {
  console.log(`  ${p.skipped ? 'skip' : dryRun ? 'dry ' : 'pub '} ${p.name}@${p.version}`)
}
if (dryRun) {
  console.log('\nDry-run only. Re-run without --dry-run to publish.')
}
if (!deprecateOld) {
  console.log('\nTip: add --deprecate-old to mark @consona/interface@1.0.0 deprecated after a real publish.')
}
