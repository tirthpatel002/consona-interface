/**
 * @file occupancy-index.ts
 * Per-container occupancy index for O(1) capacity / membership checks during drag.
 *
 * Columns sync once when their item ids change. Cards never carry membership lists —
 * validation resolves the parent container through this index.
 */

export interface ContainerOccupancyMeta {
  maxCapacity?: number
  accept?: string | string[]
  rule?: unknown
  disabled?: boolean
}

export interface ContainerOccupancySnapshot {
  /** Member count excluding `excludeId` when that id is present. */
  otherCount: number
  /** Whether `excludeId` is currently a member. */
  hasActive: boolean
  maxCapacity?: number
  accept?: string | string[]
  rule?: unknown
  disabled?: boolean
}

export class OccupancyIndex {
  private readonly containers = new Map<
    string,
    ContainerOccupancyMeta & { members: Set<string>; /** fingerprint of last synced id list */ sig: string }
  >()

  /**
   * Upsert a container's member set. Skips Set rebuild when the id fingerprint is unchanged.
   * Sync cost: O(n) only when membership actually changes; O(1) fingerprint hit otherwise.
   */
  sync(containerId: string | number, itemIds: readonly string[], meta: ContainerOccupancyMeta = {}): void {
    const key = String(containerId)
    const sig = itemIds.length === 0 ? '' : itemIds.join('\0')
    const prev = this.containers.get(key)

    if (prev && prev.sig === sig) {
      prev.maxCapacity = meta.maxCapacity
      prev.accept = meta.accept
      prev.rule = meta.rule
      prev.disabled = meta.disabled
      return
    }

    this.containers.set(key, {
      members: new Set(itemIds),
      sig,
      maxCapacity: meta.maxCapacity,
      accept: meta.accept,
      rule: meta.rule,
      disabled: meta.disabled,
    })
  }

  remove(containerId: string | number): void {
    this.containers.delete(String(containerId))
  }

  get(containerId: string | number) {
    return this.containers.get(String(containerId))
  }

  /**
   * O(1) occupancy snapshot for capacity checks.
   * `otherCount` excludes the active id when it already sits in the container
   * (same-column reorder or optimistic live transfer).
   */
  snapshot(containerId: string | number, excludeId?: string | number): ContainerOccupancySnapshot | null {
    const entry = this.containers.get(String(containerId))
    if (!entry) return null

    const exclude = excludeId != null ? String(excludeId) : null
    const hasActive = exclude != null && entry.members.has(exclude)
    return {
      otherCount: hasActive ? entry.members.size - 1 : entry.members.size,
      hasActive,
      maxCapacity: entry.maxCapacity,
      accept: entry.accept,
      rule: entry.rule,
      disabled: entry.disabled,
    }
  }

  clear(): void {
    this.containers.clear()
  }
}
