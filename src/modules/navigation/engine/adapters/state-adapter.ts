import type { NavRouterAdapter } from '../types'

/**
 * Pure In-Memory Router Adapter.
 * Zero external browser or framework dependencies. Ideal for tabbed interfaces, embedded widgets, and demos.
 */
export class StateRouterAdapter implements NavRouterAdapter {
  private currentPath: string
  private listeners: Set<(path: string, state?: any) => void> = new Set()

  constructor(initialPath: string = '/') {
    this.currentPath = initialPath
  }

  public getCurrentPath = (): string => {
    return this.currentPath
  }

  public push = (pathOrId: string, state?: any): void => {
    this.currentPath = pathOrId
    this.notify(state)
  }

  public replace = (pathOrId: string, state?: any): void => {
    this.currentPath = pathOrId
    this.notify(state)
  }

  public subscribe = (onPathChange: (pathOrId: string, state?: any) => void): (() => void) => {
    this.listeners.add(onPathChange)
    return () => {
      this.listeners.delete(onPathChange)
    }
  }

  private notify(state?: any): void {
    this.listeners.forEach((listener) => listener(this.currentPath, state))
  }
}
