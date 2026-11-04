/**
 * @file lexorank.ts
 * High-Performance LexoRank (Fractional Lexicographical Indexing) Engine.
 * 
 * Provides O(1) single-record position calculation for Kanban boards, sortable lists,
 * and distributed databases without requiring O(N) cascading updates.
 * 
 * Natural sorting guarantees:
 * Lexicographical string comparison `a < b` directly matches database `ORDER BY rank ASC`.
 */

export const LEXORANK_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'
const BASE = LEXORANK_ALPHABET.length // 36
const MIN_CHAR = LEXORANK_ALPHABET[0]! // '0'
const MAX_CHAR = LEXORANK_ALPHABET[BASE - 1]! // 'z'
const MID_CHAR = LEXORANK_ALPHABET[Math.floor(BASE / 2)]! // 'i' or 'm'

/**
 * Converts a single character to its base-36 integer index (0-35).
 */
function charToVal(char: string): number {
  const code = char.charCodeAt(0)
  if (code >= 48 && code <= 57) return code - 48 // 0-9
  if (code >= 97 && code <= 122) return code - 87 // a-z
  if (code >= 65 && code <= 90) return code - 55 // A-Z (case-insensitive fallback)
  return 0
}

/**
 * Converts an integer (0-35) to its base-36 character.
 */
function valToChar(val: number): string {
  const clamped = Math.max(0, Math.min(BASE - 1, Math.floor(val)))
  return LEXORANK_ALPHABET[clamped]!
}

/**
 * Sanitizes a rank value by converting to string, lowercasing, and stripping non-base36 characters.
 */
export function cleanLexoRank(val: unknown): string {
  if (val === null || val === undefined) return ''
  const str = String(val).trim().toLowerCase()
  let result = ''
  for (let i = 0; i < str.length; i++) {
    const char = str[i]!
    if (LEXORANK_ALPHABET.includes(char)) {
      result += char
    }
  }
  return result
}

/**
 * Computes a lexicographical string strictly between `prev` and `next`.
 * Guaranteed to satisfy: `prev < between(prev, next) < next`.
 * 
 * Auto-resolves corruptions (non-base36 characters, equal ranks, inverted ranks, numbers).
 * 
 * @param prev Previous item's rank string (or null/undefined if inserting at head)
 * @param next Next item's rank string (or null/undefined if inserting at tail)
 */
export function generateLexoRankBetween(
  prev?: string | number | null,
  next?: string | number | null
): string {
  const p = cleanLexoRank(prev)
  const n = cleanLexoRank(next)

  // Case 1: Both empty (First item in an empty column)
  if (!p && !n) {
    return 'm'
  }

  // Case 2: Inserting at the head of a column (before `next`)
  if (!p && n) {
    let result = ''
    for (let i = 0; i < n.length; i++) {
      const nChar = n[i]!
      const nVal = charToVal(nChar)
      if (nVal > 0) {
        const midVal = Math.floor(nVal / 2)
        return result + valToChar(midVal)
      }
      result += MIN_CHAR
    }
    return result + MID_CHAR
  }

  // Case 3: Inserting at the tail of a column (after `prev`)
  if (p && !n) {
    const lastChar = p[p.length - 1]!
    const pVal = charToVal(lastChar)
    if (pVal < BASE - 1) {
      const midVal = Math.floor((pVal + BASE) / 2)
      return p.slice(0, -1) + valToChar(midVal)
    }
    return p + MID_CHAR
  }

  // Case 4: Corrupted equal ranks (e.g. duplicate ranks "10" and "10" from dirty database)
  if (p === n) {
    return p + MID_CHAR
  }

  // Case 5: Corrupted inverted ranks (e.g. prev "50" > next "10" due to unsorted data feed)
  if (p > n) {
    // Generate a valid position after p to preserve monotonically increasing order
    return p + MID_CHAR
  }

  // Case 6: Standard valid insertion between two distinct items (p < n)
  let i = 0
  let result = ''

  while (true) {
    const pChar = i < p.length ? p[i]! : MIN_CHAR
    const nChar = i < n.length ? n[i]! : MAX_CHAR

    if (pChar === nChar) {
      result += pChar
      i++
      continue
    }

    const pVal = charToVal(pChar)
    const nVal = charToVal(nChar)

    const diff = nVal - pVal

    if (diff > 1) {
      // Direct midpoint between different characters
      const midVal = pVal + Math.floor(diff / 2)
      return result + valToChar(midVal)
    }

    // Characters are consecutive (e.g. 'a' and 'b'). Keep pChar and continue resolving suffix.
    result += pChar
    i++

    // Resolve suffix after consecutive character
    while (i < p.length && p[i] === MAX_CHAR) {
      result += MAX_CHAR
      i++
    }

    const nextPChar = i < p.length ? p[i]! : MIN_CHAR
    const nextPVal = charToVal(nextPChar)
    const midVal = Math.floor((nextPVal + BASE) / 2)
    return result + valToChar(midVal)
  }
}

/**
 * Generates N evenly distributed LexoRank keys for initial lists or batch seeding.
 */
export function generateInitialLexoRanks(count: number): string[] {
  if (count <= 0) return []
  if (count === 1) return ['m']

  const ranks: string[] = []
  const step = BASE / (count + 1)

  for (let i = 1; i <= count; i++) {
    const val = Math.floor(i * step)
    ranks.push(valToChar(val))
  }

  return ranks
}

/**
 * Validates whether an array has clean, strictly ascending LexoRank values.
 */
export function isLexoRankCorrupted<T>(
  items: T[],
  rankKey: string = 'rank'
): boolean {
  if (!Array.isArray(items) || items.length <= 1) return false
  let prevRank = ''

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (!item || typeof item !== 'object') continue
    const rawRank = (item as any)[rankKey]
    if (rawRank === undefined || rawRank === null || rawRank === '') {
      return true // missing rank
    }
    const cleaned = cleanLexoRank(rawRank)
    if (!cleaned || cleaned.length === 0) {
      return true // invalid characters
    }
    if (i > 0 && cleaned <= prevRank) {
      return true // duplicate or inverted ordering
    }
    prevRank = cleaned
  }
  return false
}

/**
 * Auto-repairs an array of items by regenerating clean, evenly spaced LexoRanks
 * if missing, duplicate, or inverted ranks are detected.
 */
export function repairCorruptedRanks<T>(
  items: T[],
  rankKey: string = 'rank'
): T[] {
  if (!Array.isArray(items) || items.length === 0) return items
  if (!isLexoRankCorrupted(items, rankKey)) {
    return items
  }

  const freshRanks = generateInitialLexoRanks(items.length)
  return items.map((item, idx) => {
    if (item && typeof item === 'object') {
      return {
        ...item,
        [rankKey]: freshRanks[idx] ?? 'm',
      }
    }
    return item
  })
}

/**
 * Sorts an array of items by their LexoRank key ascending.
 */
export function sortItemsByLexoRank<T>(
  items: T[],
  rankKey: string = 'rank'
): T[] {
  if (!Array.isArray(items)) return []
  return [...items].sort((a: any, b: any) => {
    const rankA = cleanLexoRank(a?.[rankKey])
    const rankB = cleanLexoRank(b?.[rankKey])
    if (rankA < rankB) return -1
    if (rankA > rankB) return 1
    return 0
  })
}

/**
 * Reorders an array by moving an item from oldIndex to newIndex.
 * If items contain a LexoRank property, automatically generates the new rank between neighbors in O(1).
 */
export function reorderWithLexoRank<T>(
  items: T[],
  oldIndex: number,
  newIndex: number,
  rankKey: string = 'rank'
): T[] {
  if (!Array.isArray(items) || oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
    return items
  }
  const newArray = [...items]
  const [removed] = newArray.splice(oldIndex, 1)
  if (removed === undefined) return items
  newArray.splice(newIndex, 0, removed)

  const movedItem = newArray[newIndex]
  const hasRank = newArray.some(
    (item) => item && typeof item === 'object' && rankKey in item
  )

  if (hasRank && movedItem && typeof movedItem === 'object') {
    const beforeItem = newIndex > 0 ? newArray[newIndex - 1] : undefined
    const afterItem = newIndex < newArray.length - 1 ? newArray[newIndex + 1] : undefined

    const beforeRank = beforeItem ? (beforeItem as any)[rankKey] : undefined
    const afterRank = afterItem ? (afterItem as any)[rankKey] : undefined
    const newRank = generateLexoRankBetween(beforeRank, afterRank)

    newArray[newIndex] = {
      ...movedItem,
      [rankKey]: newRank,
    }
  }

  return newArray
}

/**
 * LexoRank static API namespace.
 */
export const LexoRank = {
  between: generateLexoRankBetween,
  clean: cleanLexoRank,
  initial: generateInitialLexoRanks,
  sort: sortItemsByLexoRank,
  reorder: reorderWithLexoRank,
  isCorrupted: isLexoRankCorrupted,
  repair: repairCorruptedRanks,
  alphabet: LEXORANK_ALPHABET,
}
