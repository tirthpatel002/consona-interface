import { useState, useCallback, useEffect, useRef } from 'react'
import type { MapSearchResult } from '../engine/types'
import { searchPlaces } from '../engine/map-engine'

export interface UseMapPlacesOptions {
  /** Maximum number of search results to return (default: 6). */
  limit?: number
  /** Proximity coordinates for biasing search results. */
  proximity?: { longitude: number; latitude: number }
  /** Custom async search function override. */
  search?: (query: string, signal: AbortSignal) => Promise<MapSearchResult[]>
  /** Callback fired when a place is selected. */
  onSelect?: (result: MapSearchResult) => void
}

export interface UseMapPlacesReturn {
  state: {
    query: string
    results: MapSearchResult[]
    selected: MapSearchResult | null
    isSearching: boolean
    isOpen: boolean
  }
  actions: {
    setQuery: (query: string) => void
    selectPlace: (result: MapSearchResult) => void
    clear: () => void
    setOpen: (open: boolean) => void
  }
  helpers: {
    hasResults: boolean
    resultCount: number
  }
  ariaProps: {
    role: string
    'aria-expanded': boolean
    'aria-haspopup': 'listbox'
    'aria-autocomplete': 'list'
  }
}

/**
 * Headless places geocoding hook with query debouncing, abort controller, and keyboard selection.
 */
export function useMapPlaces(options: UseMapPlacesOptions = {}): UseMapPlacesReturn {
  const { limit = 6, proximity, search, onSelect } = options
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MapSearchResult[]>([])
  const [selected, setSelected] = useState<MapSearchResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const skipRef = useRef(false)

  useEffect(() => {
    const trimmed = query.trim()
    if (skipRef.current) {
      skipRef.current = false
      return
    }
    if (trimmed.length < 2) {
      setResults([])
      setIsSearching(false)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setIsSearching(true)
      try {
        const next = search
          ? await search(trimmed, controller.signal)
          : await searchPlaces(trimmed, {
              limit,
              latitude: proximity?.latitude,
              longitude: proximity?.longitude,
              signal: controller.signal,
            })
        if (!controller.signal.aborted) {
          setResults(next)
          setIsOpen(true)
        }
      } catch {
        if (!controller.signal.aborted) setResults([])
      } finally {
        if (!controller.signal.aborted) setIsSearching(false)
      }
    }, 280)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [limit, proximity?.latitude, proximity?.longitude, query, search])

  const selectPlace = useCallback(
    (result: MapSearchResult) => {
      skipRef.current = true
      setSelected(result)
      setQuery(result.label)
      setIsOpen(false)
      setResults([])
      onSelect?.(result)
    },
    [onSelect]
  )

  const clear = useCallback(() => {
    setQuery('')
    setSelected(null)
    setResults([])
    setIsOpen(false)
    setIsSearching(false)
  }, [])

  return {
    state: {
      query,
      results,
      selected,
      isSearching,
      isOpen,
    },
    actions: {
      setQuery,
      selectPlace,
      clear,
      setOpen: setIsOpen,
    },
    helpers: {
      hasResults: results.length > 0,
      resultCount: results.length,
    },
    ariaProps: {
      role: 'combobox',
      'aria-expanded': isOpen,
      'aria-haspopup': 'listbox',
      'aria-autocomplete': 'list',
    },
  }
}
