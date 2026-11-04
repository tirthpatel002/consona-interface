/**
 * Pluggable persistence adapter for domain engines (ENG2).
 * Engines must never call localStorage/sessionStorage directly.
 */

export interface StorageAdapter {
  getItem: (key: string) => string | null | Promise<string | null>
  setItem: (key: string, value: string) => void | Promise<void>
  removeItem?: (key: string) => void | Promise<void>
}

export class MemoryStorageAdapter implements StorageAdapter {
  private store = new Map<string, string>()

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }
}

export function createWebStorageAdapter(
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
): StorageAdapter {
  return {
    getItem: (key) => storage.getItem(key),
    setItem: (key, value) => {
      storage.setItem(key, value)
    },
    removeItem: (key) => {
      storage.removeItem(key)
    },
  }
}

export function createBrowserLocalStorageAdapter(): StorageAdapter {
  if (typeof window !== 'undefined' && window.localStorage) {
    return createWebStorageAdapter(window.localStorage)
  }
  return new MemoryStorageAdapter()
}

/**
 * Wraps any StorageAdapter with an isolated key namespace prefix (e.g. `consona:audio:`).
 */
export function createPrefixStorageAdapter(
  prefix: string,
  adapter: StorageAdapter
): StorageAdapter {
  const formatKey = (key: string) => `${prefix}${key}`
  return {
    getItem: (key) => adapter.getItem(formatKey(key)),
    setItem: (key, value) => adapter.setItem(formatKey(key), value),
    removeItem: (key) => adapter.removeItem?.(formatKey(key)),
  }
}

/**
 * Type-safe JSON serialization helper with fallback handling for corrupted data.
 */
export interface SafeJSONSerializer<T> {
  serialize: (data: T) => string
  deserialize: (raw: string | null) => T
}

export function createSafeJSONSerializer<T>(defaultValue: T): SafeJSONSerializer<T> {
  return {
    serialize: (data: T): string => {
      try {
        return JSON.stringify(data)
      } catch (err) {
        console.error('[Consona Storage Error] Serialization failed:', err)
        return JSON.stringify(defaultValue)
      }
    },
    deserialize: (raw: string | null): T => {
      if (!raw) return defaultValue
      try {
        return JSON.parse(raw) as T
      } catch (err) {
        console.error('[Consona Storage Error] Deserialization failed, using default value:', err)
        return defaultValue
      }
    },
  }
}

