import type { ComponentDocSpec } from './types'

// Auto-discover all *.doc.tsx and *.doc.ts files across subdirectories
const docModules = import.meta.glob<{ [key: string]: unknown }>('./**/*.doc.{ts,tsx}', {
  eager: true,
})

export const docsRegistry: Record<string, ComponentDocSpec> = {}

// Scan all modules and index every ComponentDocSpec export
for (const path in docModules) {
  const mod = docModules[path]
  for (const exportKey in mod) {
    const value = mod[exportKey]
    if (
      value &&
      typeof value === 'object' &&
      'id' in value &&
      typeof (value as any).id === 'string' &&
      'name' in value &&
      typeof (value as any).name === 'string'
    ) {
      const spec = value as ComponentDocSpec
      // 1. Index by primary spec ID
      docsRegistry[spec.id] = spec

      // 2. If export name is an alias (e.g. `onboardingDoc`, `tourCardDoc`), index by kebab-cased export name
      const aliasKey = exportKey.replace(/Doc$/, '').replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
      if (aliasKey && !docsRegistry[aliasKey]) {
        docsRegistry[aliasKey] = spec
      }
    }
  }
}

/**
 * Lookup ComponentDocSpec by ID, alias, or fuzzy component name.
 */
export function getDocSpec(id: string): ComponentDocSpec | undefined {
  if (!id) return undefined
  const key = id.trim()
  return (
    docsRegistry[key] ||
    docsRegistry[key.toLowerCase()] ||
    Object.values(docsRegistry).find(
      (spec) =>
        spec.id.toLowerCase() === key.toLowerCase() ||
        spec.name.toLowerCase() === key.toLowerCase() ||
        spec.name.replace(/\s+/g, '').toLowerCase() === key.replace(/[-_\s.]/g, '').toLowerCase()
    )
  )
}

/**
 * Returns all unique ComponentDocSpecs registered in the system.
 */
export function getAllDocSpecs(): ComponentDocSpec[] {
  const map = new Map<string, ComponentDocSpec>()
  for (const spec of Object.values(docsRegistry)) {
    if (!map.has(spec.id)) {
      map.set(spec.id, spec)
    }
  }
  return Array.from(map.values())
}

export * from './types'
