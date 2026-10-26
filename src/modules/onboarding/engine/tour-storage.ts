import type { StorageAdapter } from '../../../core/storage'
import { MemoryStorageAdapter } from '../../../core/storage'

export const ONBOARDING_STORAGE_KEY = 'consona:onboarding'

export function resolveTourStorage(adapter?: StorageAdapter): StorageAdapter {
  return adapter ?? new MemoryStorageAdapter()
}

export async function readTourProgress(
  storage: StorageAdapter,
  key = ONBOARDING_STORAGE_KEY
): Promise<string | null> {
  return storage.getItem(key)
}

export async function writeTourProgress(
  storage: StorageAdapter,
  value: string,
  key = ONBOARDING_STORAGE_KEY
): Promise<void> {
  await storage.setItem(key, value)
}
