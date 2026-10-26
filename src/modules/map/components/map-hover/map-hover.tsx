import React, { useEffect, useMemo, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import * as maplibre from 'maplibre-gl'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import { cn } from '../../../../core/cn'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { useMap } from '../../context'
import { overlayCard } from '../map-legend/map-legend'

export function isOccluded(map: maplibre.Map, lng: number, lat: number): boolean {
  const camera = map as unknown as { transform?: { isLocationOccluded?: (lngLat: maplibre.LngLat) => boolean } }
  return Boolean(camera.transform?.isLocationOccluded?.(new maplibre.LngLat(lng, lat)))
}

export interface MapHoverSlots {
  /** Custom tooltip container or content */
  content?: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
}

export interface MapHoverProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Target longitude coordinate */
  longitude: number | null
  /** Target latitude coordinate */
  latitude: number | null
  /** Tooltip node content */
  children?: ReactNode
  /** Custom CSS classes */
  className?: string
  /** Slot overrides for tooltip customization */
  slots?: SlotComponents<MapHoverSlots>
  /** Slot props overrides */
  slotProps?: SlotPropsMap<MapHoverSlots>
}

function MapHoverPrimitive({
  longitude,
  latitude,
  children,
  className,
  slots = {},
  slotProps = {},
}: MapHoverProps) {
  const { map, hideOccluded, popoverOpen, hoverTarget } = useMap()
  const node = useMemo(() => document.createElement('div'), [])
  const hover = useMemo(
    () =>
      new maplibre.Popup({
        offset: 10,
        closeOnClick: false,
        closeOnMove: false,
        focusAfterOpen: false,
        className: 'map-tooltip map-tooltip-layer',
        closeButton: false,
      }).setMaxWidth('none'),
    []
  )

  const visible =
    children != null &&
    children !== false &&
    longitude != null &&
    latitude != null &&
    !popoverOpen &&
    hoverTarget !== 'marker' &&
    !(map && hideOccluded && isOccluded(map, longitude, latitude))

  useEffect(() => {
    if (!map) return
    hover.setDOMContent(node)
    if (!visible || longitude == null || latitude == null) {
      if (hover.isOpen()) hover.remove()
      return
    }
    hover.setLngLat([longitude, latitude])
    if (!hover.isOpen()) hover.addTo(map)
  }, [hideOccluded, hover, latitude, longitude, map, node, visible])

  useEffect(() => {
    return () => {
      hover.remove()
    }
  }, [hover])

  if (!visible || longitude == null || latitude == null) return null

  const content = renderSlot(slots.content, { children, ...slotProps.content }) ?? children

  return createPortal(
    <div className={cn('px-2 py-1 text-xs', overlayCard, className)}>
      {content}
    </div>,
    node
  )
}

export const MapHover = createInterfaceComponent<MapHoverProps, MapHoverSlots>(
  {
    name: 'MapHover',
    category: 'feedback',
    description: 'Floating micro-tooltip anchored dynamically to cursor or vector geometry coordinates.',
    version: '1.0.0',
    props: {
      longitude: null,
      latitude: null,
    },
    slots: {
      content: undefined,
    },
  },
  MapHoverPrimitive
)
