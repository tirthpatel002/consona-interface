/**
 * Interaction Rule Matcher & Key Chord Parser
 * Pure TypeScript utilities for high-performance DOM target resolution and keyboard normalization.
 */

import type { InteractionTargetMatcher } from './types'

/**
 * Resolves whether an event target matches a given selector or predicate function.
 * Utilizes Element.closest() to support event bubbling from nested children.
 */
export function resolveTargetElement(
  rawTarget: EventTarget | null,
  matcher?: InteractionTargetMatcher,
  withinAncestor?: string,
  exactOnly?: boolean
): { matched: boolean; targetElement: HTMLElement | null } {
  if (!rawTarget || !(rawTarget instanceof HTMLElement)) {
    return { matched: !matcher, targetElement: null }
  }

  // If no matcher is defined, the event target itself is the default match
  if (!matcher) {
    if (withinAncestor && !rawTarget.closest(withinAncestor)) {
      return { matched: false, targetElement: null }
    }
    return { matched: true, targetElement: rawTarget }
  }

  // Custom predicate matching
  if (typeof matcher === 'function') {
    const isMatch = matcher(rawTarget, new Event('check'))
    return { matched: isMatch, targetElement: isMatch ? rawTarget : null }
  }

  // Exact target only match
  if (exactOnly) {
    const isMatch = rawTarget.matches(matcher)
    return { matched: isMatch, targetElement: isMatch ? rawTarget : null }
  }

  // Delegated ancestor match using closest()
  const matchedElement = rawTarget.closest<HTMLElement>(matcher)
  if (!matchedElement) {
    return { matched: false, targetElement: null }
  }

  // Constrain within optional boundary
  if (withinAncestor && !matchedElement.closest(withinAncestor)) {
    return { matched: false, targetElement: null }
  }

  return { matched: true, targetElement: matchedElement }
}

/**
 * Normalizes a KeyboardEvent into a canonical key chord string.
 * Example: 'Meta+k', 'Control+Shift+p', 'Escape', 'ArrowDown'.
 */
export function normalizeKeyChord(event: KeyboardEvent): string {
  const parts: string[] = []

  if (event.metaKey) parts.push('Meta')
  if (event.ctrlKey) parts.push('Ctrl')
  if (event.altKey) parts.push('Alt')
  if (event.shiftKey && event.key !== 'Shift') parts.push('Shift')

  const key = event.key
  // Clean up key name representation
  let keyName = key
  if (key === ' ') keyName = 'Space'
  else if (key.length === 1) keyName = key.toLowerCase()

  // Avoid duplicate key if modifier alone was pressed
  if (!['Meta', 'Control', 'Alt', 'Shift'].includes(key)) {
    parts.push(keyName)
  }

  return parts.join('+')
}

/**
 * Parses and checks if an active KeyboardEvent matches a configured key chord pattern.
 */
export function matchesKeyPattern(event: KeyboardEvent, patterns: string[]): boolean {
  if (!patterns || patterns.length === 0) return true

  const activeChord = normalizeKeyChord(event).toLowerCase()
  const rawKey = (event.key === ' ' ? 'space' : event.key).toLowerCase()

  for (const pattern of patterns) {
    const normalizedPattern = pattern
      .split('+')
      .map((p) => (p.trim() === ' ' ? 'space' : p.trim().toLowerCase()))
      .join('+')

    // Direct match against chord or single key
    if (activeChord === normalizedPattern || rawKey === normalizedPattern) {
      return true
    }

    // Support 'mod+k' alias where mod = Meta on macOS or Ctrl on Windows/Linux
    if (normalizedPattern.startsWith('mod+')) {
      const rest = normalizedPattern.slice(4)
      const isModPressed = event.metaKey || event.ctrlKey
      if (isModPressed && rawKey === rest) {
        return true
      }
    }
  }

  return false
}
