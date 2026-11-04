/**
 * Shared topological order for build + publish.
 * Leaves after core; dependents after their deps; umbrella last.
 */
export const PACKAGE_ORDER = [
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

/** Workspace folder name for a package name */
export function packageDir(name) {
  if (name === '@consona/interface') return 'interface'
  return name.replace('@consona/interface-', '')
}
