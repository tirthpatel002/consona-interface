/**
 * Framework-agnostic event bus shared by BaseEngine and <InterfaceProvider />.
 * Supports exact names plus wildcards: `*`, `domain:*`, `*:error`.
 */

export type InterfaceEventListener = (
  payload?: any
) => void | boolean | Promise<void | boolean>

export function matchEvent(pattern: string, event: string): boolean {
  if (pattern === event || pattern === '*') return true
  if (pattern.endsWith(':*')) {
    return event.startsWith(pattern.slice(0, -1))
  }
  if (pattern.startsWith('*:')) {
    const suffix = pattern.slice(2)
    const segment = event.includes(':') ? event.slice(event.lastIndexOf(':') + 1) : event
    return segment === suffix || event.endsWith(`:${suffix}`)
  }
  return false
}

export function collectEventListeners(
  bag: Record<string, InterfaceEventListener> | undefined,
  event: string
): InterfaceEventListener[] {
  if (!bag) return []
  return Object.entries(bag)
    .filter(([pattern]) => matchEvent(pattern, event))
    .map(([, listener]) => listener)
}

export async function dispatchEventListeners(
  listeners: InterfaceEventListener[],
  payload?: any
): Promise<boolean> {
  let allSuccessful = true
  for (const listener of listeners) {
    try {
      const result = await listener(payload)
      if (result === false) {
        allSuccessful = false
      }
    } catch (err) {
      console.error('[Consona EventBus Error] Event listener failed:', err)
    }
  }
  return allSuccessful
}

type EngineEventBridge = (event: string, payload?: any) => void | Promise<void>

const engineEventBridges = new Set<EngineEventBridge>()

export function registerEngineEventBridge(bridge: EngineEventBridge | null): () => void {
  if (!bridge) return () => {}
  engineEventBridges.add(bridge)
  return () => {
    engineEventBridges.delete(bridge)
  }
}

export function forwardEngineEvent(event: string, payload?: any): void {
  engineEventBridges.forEach((bridge) => {
    try {
      void bridge(event, payload)
    } catch (err) {
      console.error(`[Consona EventBus Error] Bridge forwarding failed for "${event}":`, err)
    }
  })
}

