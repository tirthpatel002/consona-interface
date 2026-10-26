import type { ChecklistStorageAdapter, PersistedOnboardingState } from './types'

export const DEFAULT_STORAGE_KEY = 'consona_onboarding_state'

import { MemoryStorageAdapter, createWebStorageAdapter, createBrowserLocalStorageAdapter } from '../../../core/storage'
export { MemoryStorageAdapter, createWebStorageAdapter, createBrowserLocalStorageAdapter }

export class LocalStorageAdapter implements ChecklistStorageAdapter {
  private adapter = createBrowserLocalStorageAdapter()

  getItem(key: string): string | null | Promise<string | null> {
    try {
      return this.adapter.getItem(key)
    } catch (e) {
      console.warn('[OnboardingEngine] Storage read failed:', e)
      return null
    }
  }

  setItem(key: string, value: string): void | Promise<void> {
    try {
      return this.adapter.setItem(key, value)
    } catch (e) {
      console.warn('[OnboardingEngine] Storage write failed:', e)
    }
  }

  removeItem(key: string): void | Promise<void> {
    try {
      return this.adapter.removeItem?.(key)
    } catch (e) {
      console.warn('[OnboardingEngine] Storage removeItem failed:', e)
    }
  }
}

export function createDefaultPersistedState(): PersistedOnboardingState {
  return {
    completedTours: [],
    completedTasks: {},
    taskTimestamps: {},
    dismissedChecklists: [],
    customData: {},
  }
}

export function parsePersistedState(raw: string | null): PersistedOnboardingState {
  if (!raw) return createDefaultPersistedState()
  try {
    const parsed = JSON.parse(raw)
    return {
      completedTours: Array.isArray(parsed.completedTours) ? parsed.completedTours : [],
      completedTasks: typeof parsed.completedTasks === 'object' && parsed.completedTasks ? parsed.completedTasks : {},
      taskTimestamps: typeof parsed.taskTimestamps === 'object' && parsed.taskTimestamps ? parsed.taskTimestamps : {},
      dismissedChecklists: Array.isArray(parsed.dismissedChecklists) ? parsed.dismissedChecklists : [],
      customData: typeof parsed.customData === 'object' && parsed.customData ? parsed.customData : {},
    }
  } catch {
    return createDefaultPersistedState()
  }
}
