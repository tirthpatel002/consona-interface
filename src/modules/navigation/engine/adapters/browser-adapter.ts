import type { NavRouterAdapter } from '../types'

/**
 * Native HTML5 History API Router Adapter.
 * Leverages window.history.pushState and popstate events without external router dependencies.
 */
export class BrowserHistoryAdapter implements NavRouterAdapter {
  private listeners: Set<(path: string, state?: any) => void> = new Set()
  private cleanupPopstate?: () => void

  constructor() {
    if (typeof window !== 'undefined') {
      const handlePop = (e: PopStateEvent) => {
        const path = window.location.pathname + window.location.search + window.location.hash
        this.listeners.forEach((fn) => fn(path, e.state))
      }
      window.addEventListener('popstate', handlePop)
      this.cleanupPopstate = () => window.removeEventListener('popstate', handlePop)
    }
  }

  public getCurrentPath = (): string => {
    if (typeof window === 'undefined') return '/'
    return window.location.pathname + window.location.search + window.location.hash
  }

  public push = (pathOrId: string, state?: any): void => {
    if (typeof window !== 'undefined') {
      window.history.pushState(state, '', pathOrId)
    }
  }

  public replace = (pathOrId: string, state?: any): void => {
    if (typeof window !== 'undefined') {
      window.history.replaceState(state, '', pathOrId)
    }
  }

  public back = (): void => {
    if (typeof window !== 'undefined') {
      window.history.back()
    }
  }

  public forward = (): void => {
    if (typeof window !== 'undefined') {
      window.history.forward()
    }
  }

  public subscribe = (onPathChange: (pathOrId: string, state?: any) => void): (() => void) => {
    this.listeners.add(onPathChange)
    return () => {
      this.listeners.delete(onPathChange)
      if (this.listeners.size === 0 && this.cleanupPopstate) {
        this.cleanupPopstate()
      }
    }
  }
}
