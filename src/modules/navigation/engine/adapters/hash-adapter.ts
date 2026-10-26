import type { NavRouterAdapter } from '../types'

/**
 * Native Hash Router Adapter.
 * Uses window.location.hash for static exports, documentation portals, and GitHub Pages.
 */
export class HashRouterAdapter implements NavRouterAdapter {
  private listeners: Set<(path: string, state?: any) => void> = new Set()
  private cleanupHashChange?: () => void

  constructor() {
    if (typeof window !== 'undefined') {
      const handleHash = () => {
        const hash = window.location.hash.replace(/^#/, '') || '/'
        this.listeners.forEach((fn) => fn(hash))
      }
      window.addEventListener('hashchange', handleHash)
      this.cleanupHashChange = () => window.removeEventListener('hashchange', handleHash)
    }
  }

  public getCurrentPath = (): string => {
    if (typeof window === 'undefined') return '/'
    return window.location.hash.replace(/^#/, '') || '/'
  }

  public push = (pathOrId: string, state?: any): void => {
    if (typeof window !== 'undefined') {
      window.location.hash = pathOrId.startsWith('#') ? pathOrId : `#${pathOrId}`
    }
    this.listeners.forEach((fn) => fn(pathOrId, state))
  }

  public replace = (pathOrId: string, state?: any): void => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.hash = pathOrId.startsWith('#') ? pathOrId : `#${pathOrId}`
      window.location.replace(url.toString())
    }
    this.listeners.forEach((fn) => fn(pathOrId, state))
  }

  public subscribe = (onPathChange: (pathOrId: string, state?: any) => void): (() => void) => {
    this.listeners.add(onPathChange)
    return () => {
      this.listeners.delete(onPathChange)
      if (this.listeners.size === 0 && this.cleanupHashChange) {
        this.cleanupHashChange()
      }
    }
  }
}
