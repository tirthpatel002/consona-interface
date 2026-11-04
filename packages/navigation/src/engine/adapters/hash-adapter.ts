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

  private normalizeHash(pathOrId: string): string {
    const raw = pathOrId.startsWith('#') ? pathOrId.slice(1) : pathOrId
    return raw.startsWith('/') ? raw : `/${raw}`
  }

  public push = (pathOrId: string, state?: any): void => {
    const hash = this.normalizeHash(pathOrId)
    if (typeof window !== 'undefined') {
      const next = `#${hash}`
      if (window.location.hash !== next) {
        window.location.hash = next
      }
    }
    this.listeners.forEach((fn) => fn(hash, state))
  }

  public replace = (pathOrId: string, state?: any): void => {
    const hash = this.normalizeHash(pathOrId)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.hash = hash
      // history.replaceState avoids a full document reload (unlike location.replace)
      window.history.replaceState(state ?? null, '', url.toString())
    }
    this.listeners.forEach((fn) => fn(hash, state))
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
      if (this.listeners.size === 0 && this.cleanupHashChange) {
        this.cleanupHashChange()
        this.cleanupHashChange = undefined
      }
    }
  }
}
