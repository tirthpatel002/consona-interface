import React, { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import * as maplibre from 'maplibre-gl'
import type { PopupOptions } from 'maplibre-gl'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import { cn } from '../../../../core/cn'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Button } from '../../../core/components/button'
import { useMap } from '../../context'
import { overlayCard } from '../map-legend/map-legend'
import { isOccluded } from '../map-hover/map-hover'

export interface MapPopupSlots {
  /** Custom close button icon */
  closeIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Custom popup body wrapper or content */
  content?: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
}

export interface MapPopupProps extends Omit<PopupOptions, 'className' | 'closeButton'> {
  /** Longitude coordinate of popup anchor */
  longitude: number
  /** Latitude coordinate of popup anchor */
  latitude: number
  /** Content rendered inside popup card */
  children: ReactNode
  /** Custom CSS classes */
  className?: string
  /** Whether to show the top-right close button (default: false) */
  closeButton?: boolean
  /** Callback fired when popup is closed */
  onClose?: () => void
  /** Slot overrides */
  slots?: SlotComponents<MapPopupSlots>
  /** Slot props overrides */
  slotProps?: SlotPropsMap<MapPopupSlots>
}

function MapPopupPrimitive({
  longitude,
  latitude,
  children,
  className,
  closeButton = false,
  onClose,
  slots = {},
  slotProps = {},
  ...options
}: MapPopupProps) {
  const { map, hideOccluded, setPopoverOpen } = useMap()
  const node = useMemo(() => document.createElement('div'), [])
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const dismissed = useRef(false)
  const suppressClose = useRef(false)

  const popup = useMemo(
    () =>
      new maplibre.Popup({
        offset: 16,
        closeOnClick: false,
        focusAfterOpen: false,
        ...options,
        className: 'map-popover',
        closeButton: false,
      })
        .setMaxWidth('none')
        .setLngLat([longitude, latitude]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useEffect(() => {
    dismissed.current = false
  }, [latitude, longitude])

  useEffect(() => {
    if (!map) return
    const closed = () => {
      if (suppressClose.current) return
      dismissed.current = true
      setPopoverOpen(false)
      onCloseRef.current?.()
    }
    popup.on('close', closed)
    popup.setDOMContent(node)
    const sync = () => {
      const hidden = hideOccluded && isOccluded(map, longitude, latitude)
      if (hidden) {
        if (popup.isOpen()) {
          suppressClose.current = true
          popup.remove()
          suppressClose.current = false
        }
        return
      }
      if (dismissed.current) return
      if (!popup.isOpen()) {
        popup.addTo(map)
        setPopoverOpen(true)
      }
    }
    const outside = (event: PointerEvent) => {
      if (!popup.isOpen()) return
      const target = event.target as Node | null
      if (!target) return
      if (popup.getElement()?.contains(target)) return
      if ((target as HTMLElement).closest?.('.maplibregl-marker')) return
      popup.remove()
    }
    sync()
    map.on('move', sync)
    document.addEventListener('pointerdown', outside, true)
    return () => {
      popup.off('close', closed)
      map.off('move', sync)
      document.removeEventListener('pointerdown', outside, true)
      suppressClose.current = true
      if (popup.isOpen()) popup.remove()
      suppressClose.current = false
      setPopoverOpen(false)
    }
  }, [hideOccluded, latitude, longitude, map, node, popup, setPopoverOpen])

  useEffect(() => {
    popup.setLngLat([longitude, latitude])
  }, [latitude, longitude, popup])

  const closeIcon = renderSlot(slots.closeIcon, { strokeWidth: 1.5, ...slotProps.closeIcon }) ?? (
    <XMarkIcon strokeWidth={1.5} />
  )
  const content = renderSlot(slots.content, { children, ...slotProps.content }) ?? children

  return createPortal(
    <div className={cn('relative min-w-40 p-3 text-sm', overlayCard, className)}>
      {closeButton ? (
        <Button
          aria-label="Close"
          className="absolute end-1 top-1"
          intent="plain"
          size="sq-sm"
          onPress={() => popup.remove()}
        >
          {closeIcon}
        </Button>
      ) : null}
      {content}
    </div>,
    node
  )
}

export const MapPopup = createInterfaceComponent<MapPopupProps, MapPopupSlots>(
  {
    name: 'MapPopup',
    category: 'overlay',
    description: 'Floating modal / card popover attached to specific longitude and latitude coordinates.',
    version: '1.0.0',
    props: {
      longitude: 0,
      latitude: 0,
      closeButton: false,
    },
    slots: {
      closeIcon: undefined,
      content: undefined,
    },
  },
  MapPopupPrimitive
)
