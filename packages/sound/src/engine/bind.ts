import { ALL_SOUND_NAMES, isSoundCue, parseCueIdentifier } from './recipes'
import type { SoundEngine } from './sound-engine'
import type { SoundEmphasis, SoundHandle } from './types'

const HOVER_GAP_MS = 120
const TYPING_RATE_LIMIT_MS = 40
const boundRoots = new WeakSet<ParentNode>()
const handledEvents = new WeakSet<Event>()
const activeHoldHandles = new WeakMap<HTMLElement, SoundHandle>()

let lastHoverTime = -Infinity
let lastTypeTime = -Infinity

function isMouse(event: PointerEvent): boolean {
  return (
    event.pointerType === 'mouse' &&
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches
  )
}

interface TargetMatch {
  element: HTMLElement
  cue: string
  variant?: string
}

interface ContinuousTargetMatch {
  element: HTMLElement
  action: 'hold' | 'start' | 'stop' | 'toggle-loop'
  cue: string
  variant?: string
  ttl?: number
}

/**
 * Universal delegated sound target resolver that parses any declarative sound attribute:
 * - data-sound="cue:variant" or data-sound="cue"
 * - data-sound-<cue> (e.g. data-sound-tap, data-sound-success, data-sound-error, data-sound-open)
 * - data-sound-<cue>-<variant> (e.g. data-sound-success-chime, data-sound-error-knock, data-sound-tap-mechanical)
 * - data-sound-hover / data-sound-press / data-sound-release
 */
function findSoundTarget(
  root: ParentNode,
  event: Event,
  eventModality: 'click' | 'pointerdown' | 'pointerup' | 'pointerenter' | 'change'
): TargetMatch | null {
  if (!(event.target instanceof Element)) return null

  let curr: HTMLElement | null = event.target as HTMLElement
  while (curr && curr !== root && (root as Node).contains(curr)) {
    for (const attr of Array.from(curr.attributes)) {
      const name = attr.name
      const value = attr.value

      // Ignore hold/start/stop continuous attributes here (handled by specialized listeners)
      if (
        name === 'data-sound-hold' ||
        name === 'data-sound-start' ||
        name === 'data-sound-stop' ||
        name === 'data-sound-toggle-loop' ||
        name.startsWith('data-sound-hold-')
      ) {
        continue
      }

      // 1. Generic data-sound="cue:variant"
      if (name === 'data-sound') {
        if (eventModality === 'click' || eventModality === 'change') {
          const parsed = parseCueIdentifier(value || 'tap')
          const explicitVariant = curr.getAttribute('data-sound-variant') || parsed.variant
          return { element: curr, cue: parsed.cue, variant: explicitVariant }
        }
      }

      // 2. Modality-specific: data-sound-click="...", data-sound-hover="...", data-sound-press="..."
      if (
        (eventModality === 'click' && name === 'data-sound-click') ||
        (eventModality === 'pointerenter' && name === 'data-sound-hover') ||
        (eventModality === 'pointerdown' && (name === 'data-sound-press' || name === 'data-sound-down')) ||
        (eventModality === 'pointerup' && (name === 'data-sound-release' || name === 'data-sound-up'))
      ) {
        const defaultCue = eventModality === 'pointerenter' ? 'select' : eventModality === 'pointerdown' ? 'press' : 'tap'
        const parsed = parseCueIdentifier(value || defaultCue)
        const explicitVariant = curr.getAttribute('data-sound-variant') || parsed.variant
        return { element: curr, cue: parsed.cue, variant: explicitVariant }
      }

      // 3. Declarative cue attributes: data-sound-<cue> or data-sound-<cue>-<variant>
      if (
        name.startsWith('data-sound-') &&
        !['data-sound-emphasis', 'data-sound-volume', 'data-sound-variant', 'data-sound-cue', 'data-sound-event', 'data-sound-click', 'data-sound-ttl', 'data-sound-release'].includes(name)
      ) {
        const suffix = name.replace('data-sound-', '')

        // Modality checks
        if (suffix === 'hover' || suffix.startsWith('hover-')) {
          if (eventModality !== 'pointerenter') continue
        } else if (suffix === 'press' || suffix.startsWith('press-') || suffix === 'down') {
          if (eventModality !== 'pointerdown') continue
        } else if (suffix === 'release' || suffix.startsWith('release-') || suffix === 'up') {
          if (eventModality !== 'pointerup') continue
        } else if (suffix === 'type' || suffix.startsWith('type-')) {
          // Handled separately by typing listener
          continue
        } else {
          // All semantic cues (tap, success, error, open, close, select, toggle, navigate, chime, etc.) trigger on click
          if (eventModality !== 'click' && eventModality !== 'change') continue
        }

        let parsedCue: string = suffix
        let parsedVariant: string | undefined = undefined

        // Match against known cues
        for (const cueName of ALL_SOUND_NAMES) {
          if (suffix === cueName) {
            parsedCue = cueName
            if (value && value !== '') {
              parsedVariant = value
            }
            break
          } else if (suffix.startsWith(`${cueName}-`)) {
            parsedCue = cueName
            parsedVariant = suffix.slice(cueName.length + 1)
            break
          }
        }

        // Allow explicit value override
        if (value && isSoundCue(value)) {
          const parsed = parseCueIdentifier(value)
          parsedCue = parsed.cue
          parsedVariant = parsed.variant ?? parsedVariant
        } else if (value && value !== '' && !parsedVariant) {
          parsedVariant = value
        }

        const explicitVariant = curr.getAttribute('data-sound-variant') || parsedVariant
        return { element: curr, cue: parsedCue, variant: explicitVariant }
      }
    }

    curr = curr.parentElement
  }

  return null
}

function findContinuousTarget(root: ParentNode, event: Event): ContinuousTargetMatch | null {
  if (!(event.target instanceof Element)) return null

  let curr: HTMLElement | null = event.target as HTMLElement
  while (curr && curr !== root && (root as Node).contains(curr)) {
    // 1. data-sound-hold="..."
    if (curr.hasAttribute('data-sound-hold')) {
      const val = curr.getAttribute('data-sound-hold') || 'loading-hum'
      const parsed = parseCueIdentifier(val)
      const ttl = parseTtl(curr)
      return {
        element: curr,
        action: 'hold',
        cue: parsed.cue,
        variant: curr.getAttribute('data-sound-variant') || parsed.variant,
        ttl,
      }
    }

    // 2. data-sound-hold-<cue>
    for (const attr of Array.from(curr.attributes)) {
      if (attr.name.startsWith('data-sound-hold-')) {
        const cue = attr.name.replace('data-sound-hold-', '')
        const ttl = parseTtl(curr)
        return {
          element: curr,
          action: 'hold',
          cue,
          variant: attr.value || curr.getAttribute('data-sound-variant') || undefined,
          ttl,
        }
      }
    }

    // 3. data-sound-start="..."
    if (curr.hasAttribute('data-sound-start')) {
      const val = curr.getAttribute('data-sound-start') || 'loading-hum'
      const parsed = parseCueIdentifier(val)
      const ttl = parseTtl(curr)
      return {
        element: curr,
        action: 'start',
        cue: parsed.cue,
        variant: curr.getAttribute('data-sound-variant') || parsed.variant,
        ttl,
      }
    }

    // 4. data-sound-stop="..."
    if (curr.hasAttribute('data-sound-stop')) {
      const val = curr.getAttribute('data-sound-stop') || 'all'
      return {
        element: curr,
        action: 'stop',
        cue: val,
      }
    }

    // 5. data-sound-toggle-loop="..."
    if (curr.hasAttribute('data-sound-toggle-loop')) {
      const val = curr.getAttribute('data-sound-toggle-loop') || 'loading-hum'
      const parsed = parseCueIdentifier(val)
      const ttl = parseTtl(curr)
      return {
        element: curr,
        action: 'toggle-loop',
        cue: parsed.cue,
        variant: curr.getAttribute('data-sound-variant') || parsed.variant,
        ttl,
      }
    }

    curr = curr.parentElement
  }

  return null
}

function parseTtl(element: HTMLElement): number | undefined {
  const ttlAttr = element.getAttribute('data-sound-ttl')
  if (ttlAttr) {
    const parsed = parseInt(ttlAttr, 10)
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  return undefined
}

function resolveEmphasis(element: HTMLElement): SoundEmphasis | undefined {
  const emphasis = element.getAttribute('data-sound-emphasis')
  if (emphasis === 'subtle' || emphasis === 'normal' || emphasis === 'strong') {
    return emphasis
  }
  return undefined
}

function resolveVolume(element: HTMLElement): number | undefined {
  const volStr = element.getAttribute('data-sound-volume')
  if (volStr) {
    const num = parseFloat(volStr)
    if (!isNaN(num) && num >= 0 && num <= 1) return num
  }
  return undefined
}

function listenClicks(engine: SoundEngine, root: ParentNode): () => void {
  const handler = (event: Event) => {
    // 1. Check for continuous start/stop/toggle-loop commands
    const contMatch = findContinuousTarget(root, event)
    if (contMatch) {
      if (contMatch.action === 'start') {
        handledEvents.add(event)
        const emphasis = resolveEmphasis(contMatch.element)
        const volume = resolveVolume(contMatch.element)
        engine.start(contMatch.cue, {
          variant: contMatch.variant,
          emphasis,
          volume,
          ttl: contMatch.ttl,
        })
        return
      } else if (contMatch.action === 'stop') {
        handledEvents.add(event)
        if (contMatch.cue === 'all' || contMatch.cue === '*') {
          engine.stopAll()
        } else {
          engine.stop(contMatch.cue)
        }
        return
      } else if (contMatch.action === 'toggle-loop') {
        handledEvents.add(event)
        if (engine.isContinuousPlaying(contMatch.cue)) {
          engine.stop(contMatch.cue)
        } else {
          const emphasis = resolveEmphasis(contMatch.element)
          const volume = resolveVolume(contMatch.element)
          engine.start(contMatch.cue, {
            variant: contMatch.variant,
            emphasis,
            volume,
            ttl: contMatch.ttl,
          })
        }
        return
      }
    }

    // 2. Standard one-shot click cues
    const match = findSoundTarget(root, event, 'click')
    if (!match || handledEvents.has(event)) return
    const { element, cue, variant } = match

    handledEvents.add(event)
    const emphasis = resolveEmphasis(element)
    const volume = resolveVolume(element)

    engine.play(cue, {
      variant,
      emphasis,
      volume,
      context: {
        inputMethod: (event as any).pointerType ?? 'mouse',
      },
    })
  }

  ;(root as EventTarget).addEventListener('click', handler, true)
  return () => {
    ;(root as EventTarget).removeEventListener('click', handler, true)
  }
}

function listenContinuousHold(engine: SoundEngine, root: ParentNode): () => void {
  const startHold = (element: HTMLElement, cue: string, variant?: string, ttl?: number) => {
    if (activeHoldHandles.has(element)) return
    const emphasis = resolveEmphasis(element)
    const volume = resolveVolume(element)

    const handle = engine.start(cue, {
      variant,
      emphasis,
      volume,
      ttl,
    })

    if (handle) {
      activeHoldHandles.set(element, handle)
    }
  }

  const endHold = (element: HTMLElement) => {
    const handle = activeHoldHandles.get(element)
    if (handle) {
      handle.stop()
      activeHoldHandles.delete(element)
    }
  }

  const handlePointerDown = (event: Event) => {
    const contMatch = findContinuousTarget(root, event)
    if (contMatch && contMatch.action === 'hold') {
      startHold(contMatch.element, contMatch.cue, contMatch.variant, contMatch.ttl)
    }
  }

  const handlePointerEnd = (event: Event) => {
    if (event.target instanceof HTMLElement) {
      endHold(event.target)
      let curr = event.target.parentElement
      while (curr && curr !== root) {
        if (activeHoldHandles.has(curr)) {
          endHold(curr)
        }
        curr = curr.parentElement
      }
    }
  }

  const target = root as EventTarget
  target.addEventListener('pointerdown', handlePointerDown, true)
  target.addEventListener('pointerup', handlePointerEnd, true)
  target.addEventListener('pointercancel', handlePointerEnd, true)
  target.addEventListener('pointerleave', handlePointerEnd, true)

  return () => {
    target.removeEventListener('pointerdown', handlePointerDown, true)
    target.removeEventListener('pointerup', handlePointerEnd, true)
    target.removeEventListener('pointercancel', handlePointerEnd, true)
    target.removeEventListener('pointerleave', handlePointerEnd, true)
  }
}

function listenTyping(engine: SoundEngine, root: ParentNode): () => void {
  const handler = (event: Event) => {
    const e = event as KeyboardEvent
    if (!(e.target instanceof HTMLElement)) return

    const target = e.target.closest<HTMLElement>(
      '[data-sound-type], [data-sound-type-mechanical], [data-sound-type-clack]'
    )
    if (!target || !(root as Node).contains(target)) return

    if (target instanceof HTMLInputElement && target.type === 'password') return
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape'].includes(e.key)) {
      return
    }
    if (e.repeat || e.isComposing) return

    const now = performance.now()
    const delta = now - lastTypeTime
    if (delta < TYPING_RATE_LIMIT_MS) return
    lastTypeTime = now

    let keyRole: 'printable' | 'space' | 'enter' | 'backspace' | 'delete' = 'printable'
    if (e.key === 'Backspace') keyRole = 'backspace'
    else if (e.key === 'Delete') keyRole = 'delete'
    else if (e.key === 'Enter') keyRole = 'enter'
    else if (e.key === ' ') keyRole = 'space'

    let variant = target.getAttribute('data-sound-type') || target.getAttribute('data-sound-variant') || undefined
    if (target.hasAttribute('data-sound-type-mechanical')) variant = 'mechanical'
    else if (target.hasAttribute('data-sound-type-clack')) variant = 'clack'

    const emphasis = resolveEmphasis(target)
    const volume = resolveVolume(target)

    engine.play('type', {
      variant: variant || undefined,
      emphasis,
      volume,
      context: {
        inputMethod: 'keyboard',
        keyRole,
        cadenceDeltaMs: delta,
      },
    })
  }

  ;(root as EventTarget).addEventListener('keydown', handler, true)
  return () => {
    ;(root as EventTarget).removeEventListener('keydown', handler, true)
  }
}

function listenSelection(engine: SoundEngine, root: ParentNode): () => void {
  const handleSelect = (event: Event) => {
    if (!(event.target instanceof HTMLElement)) return
    const match = findSoundTarget(root, event, 'change')
    if (!match) return

    const { element, cue, variant } = match
    if (handledEvents.has(event)) return
    handledEvents.add(event)

    const emphasis = resolveEmphasis(element)
    const volume = resolveVolume(element)

    engine.play(cue, {
      variant,
      emphasis,
      volume,
      context: {
        inputMethod: (event as any).pointerType ?? 'mouse',
      },
    })
  }

  ;(root as EventTarget).addEventListener('change', handleSelect, true)
  return () => {
    ;(root as EventTarget).removeEventListener('change', handleSelect, true)
  }
}

function listenHover(engine: SoundEngine, root: ParentNode): () => void {
  const handler = (event: Event) => {
    const pEvent = event as PointerEvent
    if (!isMouse(pEvent)) return

    const match = findSoundTarget(root, event, 'pointerenter')
    if (!match || handledEvents.has(event)) return
    const { element, cue, variant } = match

    const relatedTarget = pEvent.relatedTarget
    if (relatedTarget instanceof Node && element.contains(relatedTarget)) return

    const now = performance.now()
    if (now - lastHoverTime < HOVER_GAP_MS) return
    lastHoverTime = now

    handledEvents.add(event)
    const emphasis = resolveEmphasis(element)
    const volume = resolveVolume(element)

    engine.play(cue, {
      variant,
      emphasis,
      volume,
      context: {
        inputMethod: 'mouse',
      },
    })
  }

  ;(root as EventTarget).addEventListener('pointerenter', handler, true)
  return () => {
    ;(root as EventTarget).removeEventListener('pointerenter', handler, true)
  }
}

function listenPressRelease(engine: SoundEngine, root: ParentNode): () => void {
  const handleDown = (event: Event) => {
    const match = findSoundTarget(root, event, 'pointerdown')
    if (!match || handledEvents.has(event)) return
    const { element, cue, variant } = match

    handledEvents.add(event)
    const emphasis = resolveEmphasis(element)
    const volume = resolveVolume(element)

    engine.play(cue, {
      variant,
      emphasis,
      volume,
      context: {
        inputMethod: (event as any).pointerType ?? 'mouse',
      },
    })
  }

  const handleUp = (event: Event) => {
    const match = findSoundTarget(root, event, 'pointerup')
    if (!match || handledEvents.has(event)) return
    const { element, cue, variant } = match

    handledEvents.add(event)
    const emphasis = resolveEmphasis(element)
    const volume = resolveVolume(element)

    engine.play(cue, {
      variant,
      emphasis,
      volume,
      context: {
        inputMethod: (event as any).pointerType ?? 'mouse',
      },
    })
  }

  const target = root as EventTarget
  target.addEventListener('pointerdown', handleDown, true)
  target.addEventListener('pointerup', handleUp, true)

  return () => {
    target.removeEventListener('pointerdown', handleDown, true)
    target.removeEventListener('pointerup', handleUp, true)
  }
}

/**
 * Attaches high-performance delegated declarative sound listeners to a DOM subtree.
 */
export function bindDeclarativeSounds(engine: SoundEngine, root?: ParentNode): () => void {
  if (typeof document === 'undefined') return () => {}
  const scope = root ?? document

  const unbindClicks = listenClicks(engine, scope)
  const unbindHold = listenContinuousHold(engine, scope)
  const unbindTyping = listenTyping(engine, scope)
  const unbindSelection = listenSelection(engine, scope)
  const unbindHover = listenHover(engine, scope)
  const unbindPressRelease = listenPressRelease(engine, scope)

  return () => {
    unbindClicks()
    unbindHold()
    unbindTyping()
    unbindSelection()
    unbindHover()
    unbindPressRelease()
  }
}

