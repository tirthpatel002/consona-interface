import React, { useState, useEffect, useRef, type ReactNode } from 'react'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import { cn } from '../../../../core/cn'
import type { SlotComponents, SlotPropsMap, SlotDefinition } from '../../../../core/types'
import { SearchField, SearchInput } from '../../../core/components/search-field'
import { Loader } from '../../../core/components/loader'
import { useMap } from '../../context'
import type { MapSearchResult } from '../../engine/types'
import { searchPlaces } from '../../engine/map-engine'
import { CONTROL_POSITION } from '../map-controls/map-controls'
import { overlayCard } from '../map-legend/map-legend'
import { MapMarker, MarkerContent, MarkerPin, MarkerLabel } from '../map-marker/map-marker'

export function resolveOverlay<T>(
  overlay: boolean | ReactNode | ((value: T) => ReactNode) | undefined,
  fallback: ReactNode,
  value: T
): ReactNode | null {
  if (overlay === false) return null
  if (overlay === undefined || overlay === true) return fallback ?? null
  if (typeof overlay === 'function') return (overlay as (value: T) => ReactNode)(value)
  return overlay
}

export interface MapSearchSlots {
  /** Search progress loading indicator */
  loader?: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
  /** Custom marker slot when place is selected */
  marker?: SlotDefinition<MapSearchResult>
}

export interface MapSearchProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'popover' | 'onSelect'> {
  /** Position corner for the floating search input */
  position?: keyof typeof CONTROL_POSITION
  /** Input placeholder text (default: 'Search a place') */
  placeholder?: string
  /** Whether selecting a place flies the camera to its coordinates (default: true) */
  flyTo?: boolean
  /** Zoom level to fly to upon selection (default: 14) */
  zoom?: number
  /** Maximum number of place results (default: 6) */
  limit?: number
  /** Whether to place a marker upon selection (boolean or custom render fn) */
  marker?: boolean | ((result: MapSearchResult) => ReactNode)
  /** Tooltip content for the selected search marker */
  tooltip?: boolean | ReactNode | ((result: MapSearchResult) => ReactNode)
  /** Popover content for the selected search marker */
  popover?: boolean | ReactNode | ((result: MapSearchResult) => ReactNode)
  /** Callback fired when a place is selected */
  onSelect?: (result: MapSearchResult) => void
  /** Custom async search function override */
  search?: (query: string, signal: AbortSignal) => Promise<MapSearchResult[]>
  /** Custom marker render function override */
  renderMarker?: (result: MapSearchResult) => ReactNode
  /** Custom CSS classes */
  className?: string
  /** Slot overrides */
  slots?: SlotComponents<MapSearchSlots>
  /** Slot props overrides */
  slotProps?: SlotPropsMap<MapSearchSlots>
}

function MapSearchPrimitive({
  className,
  position = 'top-left',
  placeholder = 'Search a place',
  flyTo = true,
  zoom = 14,
  limit = 6,
  marker = true,
  tooltip = true,
  popover = false,
  onSelect,
  search,
  renderMarker,
  slots = {},
  slotProps = {},
  ...props
}: MapSearchProps) {
  const { map } = useMap()
  const rootRef = useRef<HTMLDivElement>(null)
  const skipSearch = useRef(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MapSearchResult[]>([])
  const [pending, setPending] = useState(false)
  const [selected, setSelected] = useState<MapSearchResult | null>(null)
  const [open, setOpen] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)

  useEffect(() => {
    const trimmed = query.trim()
    if (skipSearch.current) {
      skipSearch.current = false
      return
    }
    if (trimmed.length < 2) {
      setResults([])
      setPending(false)
      return
    }
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setPending(true)
      try {
        const center = map?.getCenter()
        const next = search
          ? await search(trimmed, controller.signal)
          : await searchPlaces(trimmed, {
              limit,
              latitude: center?.lat,
              longitude: center?.lng,
              signal: controller.signal,
            })
        if (!controller.signal.aborted) {
          setResults(next)
          setOpen(true)
        }
      } catch {
        if (!controller.signal.aborted) setResults([])
      } finally {
        if (!controller.signal.aborted) setPending(false)
      }
    }, 280)
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [limit, map, query, search])

  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (target && rootRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (result: MapSearchResult) => {
    skipSearch.current = true
    setSelected(result)
    setQuery(result.label)
    setOpen(false)
    setResults([])
    setPopoverOpen(Boolean(popover))
    if (flyTo && map) {
      const lng = Number(result.longitude)
      const lat = Number(result.latitude)
      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        map.stop()
        map.flyTo({
          center: [lng, lat],
          zoom: zoom ?? 14,
          duration: 1100,
          essential: true,
        })
      }
    }
    onSelect?.(result)
  }

  const customMarker =
    selected &&
    (renderSlot(slots.marker, { ...selected, ...(slotProps.marker as any) }) ??
      (typeof marker === 'function' ? marker(selected) : renderMarker?.(selected)))
  const tooltipNode = selected ? resolveOverlay(tooltip, selected.detail || selected.label, selected) : null
  const popoverNode = selected ? resolveOverlay(popover, selected.detail || selected.label, selected) : null
  const loader = renderSlot(slots.loader, slotProps.loader) ?? <Loader size="xs" />

  return (
    <>
      <div
        ref={rootRef}
        className={cn('absolute z-20 w-[min(18rem,calc(100%-4.5rem))]', CONTROL_POSITION[position], className)}
        data-slot="map-search"
        {...props}
      >
        <SearchField
          aria-label="Search a place"
          className="m-0"
          value={query}
          onChange={(value) => {
            setQuery(value)
            if (!value) {
              setSelected(null)
              setResults([])
              setOpen(false)
              setPopoverOpen(false)
            }
          }}
          onSubmit={() => {
            const first = results[0]
            if (first) {
              pick(first)
            }
          }}
        >
          <SearchInput
            className="bg-overlay shadow-xs"
            placeholder={placeholder}
            onFocus={() => {
              if (results.length) setOpen(true)
            }}
          />
        </SearchField>
        {open && (pending || results.length > 0) ? (
          <div className={cn('mt-1 max-h-56 overflow-auto p-1', overlayCard)}>
            {pending && results.length === 0 ? (
              <div className="flex items-center gap-2 px-2 py-2 text-muted-fg text-xs">
                {loader}
                Searching
              </div>
            ) : (
              results.map((result) => (
                <button
                  className="flex w-full cursor-pointer flex-col rounded-md px-2 py-1.5 text-start text-sm hover:bg-muted"
                  key={result.id}
                  type="button"
                  onPointerDown={(event) => {
                    event.stopPropagation()
                    pick(result)
                  }}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                  }}
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    pick(result)
                  }}
                >
                  <span className="font-medium">{result.label}</span>
                  {result.detail ? <span className="text-muted-fg text-xs">{result.detail}</span> : null}
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
      {marker !== false && selected ? (
        <MapMarker
          latitude={selected.latitude}
          longitude={selected.longitude}
          popover={popoverNode ?? false}
          popoverOpen={popoverOpen}
          tooltip={tooltipNode ?? false}
          onPopoverOpenChange={setPopoverOpen}
        >
          {customMarker ?? (
            <MarkerContent>
              <MarkerPin />
              <MarkerLabel>{selected.label}</MarkerLabel>
            </MarkerContent>
          )}
        </MapMarker>
      ) : null}
    </>
  )
}

export const MapSearch = createInterfaceComponent<MapSearchProps, MapSearchSlots>(
  {
    name: 'MapSearch',
    category: 'navigation',
    description: 'Floating search and autocomplete input with live reverse geocoding and marker drop.',
    version: '1.0.0',
    props: {
      position: 'top-left',
      placeholder: 'Search a place',
      flyTo: true,
      zoom: 14,
      limit: 6,
      marker: true,
      tooltip: true,
      popover: false,
    },
    slots: {
      loader: undefined,
      marker: undefined,
    },
  },
  MapSearchPrimitive
)
