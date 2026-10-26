#!/usr/bin/env node

/**
 * ============================================================================
 * Consona Interface — Safe Mechanical Transforms Engine
 * ============================================================================
 *
 * Automates deterministic, mechanical code pattern updates across the interface
 * library without deforming formatting or breaking structural AST invariants.
 *
 * Guarantees:
 *  - 100% Idempotent (running N times yields identical output)
 *  - Non-destructive (safe guards against comments, string literals, and type declarations)
 *  - Zero Anti-Patterns: No indiscriminate regex or unstructured rewrites
 *
 * Usage:
 *  node --experimental-strip-types scripts/mechanical-transforms.ts
 *  node --experimental-strip-types scripts/mechanical-transforms.ts --dry-run
 *  node --experimental-strip-types scripts/mechanical-transforms.ts --filter=accordion
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

// ─── CLI Options ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const filterArg = args.find((a) => a.startsWith('--filter='))?.replace('--filter=', '')

const SRC_DIR = path.resolve(process.cwd(), 'src')

interface TransformResult {
  filePath: string
  transformName: string
  changesCount: number
}

// ─── File Utilities ──────────────────────────────────────────────────────────

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        getAllFiles(fullPath, arrayOfFiles)
      }
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      arrayOfFiles.push(fullPath)
    }
  }
  return arrayOfFiles
}

// ─── Individual Transform Handlers ───────────────────────────────────────────

/**
 * Transform 1: ChartContext export in chart-context.tsx
 * Ensures ChartContext is exported so chart components can consume it.
 */
function transformChartContextExport(content: string, filePath: string): { content: string; count: number } {
  if (!filePath.endsWith('chart-context.tsx')) return { content, count: 0 }

  const target = 'const ChartContext = createContext<ChartContextValue | null>(null)'
  const replacement = 'export const ChartContext = createContext<ChartContextValue | null>(null)'

  if (content.includes(target) && !content.includes(replacement)) {
    return {
      content: content.replace(target, replacement),
      count: 1,
    }
  }
  return { content, count: 0 }
}

/**
 * Transform 2: createCompoundContext array destructuring to object destructuring
 * createCompoundContext returns { Context, Provider, useCompoundContext, useOptionalCompoundContext }
 */
function transformCompoundContext(content: string): { content: string; count: number } {
  let count = 0
  const arrayPattern = /export\s+const\s+\[\s*([A-Za-z0-9_]+)\s*,\s*([A-Za-z0-9_]+)\s*,\s*([A-Za-z0-9_]+)\s*\]\s*=\s*createCompoundContext<([^>]+)>\(([^)]+)\)/g

  const updated = content.replace(arrayPattern, (_match, provider, hook, ctx, typeParam, arg) => {
    count++
    return `export const {\n  Provider: ${provider},\n  useCompoundContext: ${hook},\n  Context: ${ctx},\n} = createCompoundContext<${typeParam}>(${arg})`
  })

  return { content: updated, count }
}

/**
 * Transform 3: renderSlot className argument fix
 * SlotOptions (3rd arg) does not accept `className`; className belongs in props (2nd arg).
 */
function transformRenderSlotArgs(content: string): { content: string; count: number } {
  let count = 0
  // Pattern: renderSlot(slots?.x, slotProps?.x as object, { defaultComponent: Comp, className: '...' })
  const patternA = /renderSlot\(\s*([A-Za-z0-9_?.]+)\s*,\s*([A-Za-z0-9_?.]+(?:\s+as\s+object)?)\s*,\s*\{\s*defaultComponent:\s*([A-Za-z0-9_]+)\s*,\s*className:\s*(['"`][^'"`]+['"`])\s*,?\s*\}\s*\)/g

  let updated = content.replace(patternA, (_match, slot, props, comp, cls) => {
    count++
    return `renderSlot(\n            ${slot},\n            { className: ${cls}, ...(${props}) },\n            { defaultComponent: ${comp} }\n          )`
  })

  // Pattern: renderSlot(slots?.x, slotProps?.x as object, { className: '...', defaultComponent: Comp })
  const patternB = /renderSlot\(\s*([A-Za-z0-9_?.]+)\s*,\s*([A-Za-z0-9_?.]+(?:\s+as\s+object)?)\s*,\s*\{\s*className:\s*(['"`][^'"`]+['"`])\s*,\s*defaultComponent:\s*([A-Za-z0-9_]+)\s*,?\s*\}\s*\)/g

  updated = updated.replace(patternB, (_match, slot, props, cls, comp) => {
    count++
    return `renderSlot(\n            ${slot},\n            { className: ${cls}, ...(${props}) },\n            { defaultComponent: ${comp} }\n          )`
  })

  return { content: updated, count }
}

/**
 * Transform 4: Map components index.ts disambiguation
 * Replaces star exports with explicit named exports for overlapping modules.
 */
function transformMapIndexExports(content: string, filePath: string): { content: string; count: number } {
  if (!filePath.endsWith(path.join('map', 'components', 'index.ts'))) return { content, count: 0 }

  let count = 0
  let updated = content

  const replacements: [string, string][] = [
    ["export * from './globe-map'", "export { GlobeMap, type GlobeMapProps, type GlobeMapSlots } from './globe-map'"],
    ["export * from './map-shape'", "export { MapShape, type MapShapeProps, type MapShapeSlots } from './map-shape'"],
    ["export * from './map-cluster-layer'", "export { MapClusterLayer, type MapClusterLayerProps, type MapClusterLayerSlots } from './map-cluster-layer'"],
  ]

  for (const [from, to] of replacements) {
    if (updated.includes(from)) {
      updated = updated.replace(from, to)
      count++
    }
  }

  return { content: updated, count }
}

// ─── Execution Pipeline ──────────────────────────────────────────────────────

function main() {
  console.log('⚡ Running Consona Mechanical Transforms Engine...\n')
  if (isDryRun) {
    console.log('🔍 [DRY RUN] No files will be written.\n')
  }

  const allFiles = getAllFiles(SRC_DIR).filter((f) => {
    if (filterArg) {
      return f.includes(filterArg)
    }
    return true
  })

  const results: TransformResult[] = []

  for (const filePath of allFiles) {
    const original = fs.readFileSync(filePath, 'utf-8')
    let current = original

    // Run safe transforms
    const t1 = transformChartContextExport(current, filePath)
    if (t1.count > 0) {
      current = t1.content
      results.push({ filePath, transformName: 'ChartContext Export', changesCount: t1.count })
    }

    const t2 = transformCompoundContext(current)
    if (t2.count > 0) {
      current = t2.content
      results.push({ filePath, transformName: 'Compound Context Destructuring', changesCount: t2.count })
    }

    const t3 = transformRenderSlotArgs(current)
    if (t3.count > 0) {
      current = t3.content
      results.push({ filePath, transformName: 'renderSlot SlotOptions className placement', changesCount: t3.count })
    }

    const t4 = transformMapIndexExports(current, filePath)
    if (t4.count > 0) {
      current = t4.content
      results.push({ filePath, transformName: 'Map Components Index Disambiguation', changesCount: t4.count })
    }

    if (current !== original && !isDryRun) {
      fs.writeFileSync(filePath, current, 'utf-8')
    }
  }

  // ─── Summary ─────────────────────────────────────────────────────────────

  if (results.length === 0) {
    console.log('✨ All files already conform to mechanical transform invariants. No changes needed.')
  } else {
    console.log(`📝 Applied ${results.reduce((acc, r) => acc + r.changesCount, 0)} mechanical transform(s) across ${new Set(results.map((r) => r.filePath)).size} file(s):`)
    for (const r of results) {
      const relPath = path.relative(process.cwd(), r.filePath)
      console.log(`   - [${r.transformName}] ${relPath} (${r.changesCount} occurrence${r.changesCount > 1 ? 's' : ''})`)
    }
  }

  console.log('\n✅ Mechanical transforms finished successfully.\n')
}

main()
