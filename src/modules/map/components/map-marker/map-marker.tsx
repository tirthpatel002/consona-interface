import React, {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import * as maplibre from 'maplibre-gl'
import type { MarkerOptions, PopupOptions } from 'maplibre-gl'
import { MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import { cn } from '../../../../core/cn'
import type { SlotComponents, SlotPropsMap, SlotDefinition } from '../../../../core/types'
import { Button } from '../../../core/components/button'
import { MarkerContext, useMap, useMarker } from '../../context'
import { overlayCard } from '../map-legend/map-legend'
import { isOccluded, MapHover } from '../map-hover/map-hover'
import { MapPopup } from '../map-popup/map-popup'

function isHoverInside(target: EventTarget | null, ...roots: Array<EventTarget | Node | null | undefined>) {
  if (!(target instanceof Node)) return false
  return roots.some((root) => {
    if (!root || !(root instanceof Node)) return false
    return root === target || root.contains(target)
  })
}

/* ==========================================================================
   Marker Content
   ========================================================================== */

export interface MarkerContentSlots {
  /** Root content element */
  content?: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
}

export interface MarkerContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Children rendered inside the DOM marker element */
  children?: ReactNode
  /** Custom CSS classes */
  className?: string
  /** Slot overrides */
  slots?: SlotComponents<MarkerContentSlots>
  /** Slot props overrides */
  slotProps?: SlotPropsMap<MarkerContentSlots>
}

function MarkerContentPrimitive({
  children,
  className,
  slots = {},
  slotProps = {},
  ...props
}: MarkerContentProps) {
  const { marker } = useMarker()
  const content = renderSlot(slots.content, { children, ...slotProps.content }) ?? children
  return createPortal(
    <div className={cn('relative cursor-pointer select-none will-change-transform', className)} {...props}>
      {content}
    </div>,
    marker.getElement()
  )
}

export const MarkerContent = createInterfaceComponent<MarkerContentProps, MarkerContentSlots>(
  {
    name: 'MarkerContent',
    category: 'data',
    description: 'Portal container mounting custom React elements directly into MapLibre DOM marker shells.',
    version: '1.0.0',
    props: {},
    slots: {
      content: undefined,
    },
  },
  MarkerContentPrimitive
)

/* ==========================================================================
   Marker Pin
   ========================================================================== */

export interface MarkerPinSlots {
  /** Inner icon component */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface MarkerPinProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Custom CSS classes */
  className?: string
  /** Background fill color token or hex */
  color?: string
  /** Stroke ring color */
  stroke?: string
  /** Size in pixels (default: 32) */
  size?: number
  /** Custom child icon or badge */
  children?: ReactNode
  /** Slot overrides */
  slots?: SlotComponents<MarkerPinSlots>
  /** Slot props overrides */
  slotProps?: SlotPropsMap<MarkerPinSlots>
}

function MarkerPinPrimitive({
  className,
  color,
  stroke,
  size = 32,
  children,
  slots = {},
  slotProps = {},
  style,
  ...props
}: MarkerPinProps) {
  const icon = renderSlot(slots.icon, { className: 'size-[45%]', strokeWidth: 1.5, ...slotProps.icon }) ?? (
    children ?? <MapPinIcon className="size-[45%]" strokeWidth={1.5} />
  )

  return (
    <span
      className={cn(
        'grid place-content-center rounded-full bg-primary text-primary-fg shadow-xs ring-1 ring-fg/10',
        className
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        color: stroke,
        boxShadow: stroke ? `inset 0 0 0 1.5px ${stroke}` : undefined,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
      {...props}
    >
      {icon}
    </span>
  )
}

export const MarkerPin = createInterfaceComponent<MarkerPinProps, MarkerPinSlots>(
  {
    name: 'MarkerPin',
    category: 'data',
    description: 'Standard circular / teardrop map pin icon badge with custom intent colors and sizes.',
    version: '1.0.0',
    props: {
      size: 32,
    },
    slots: {
      icon: undefined,
    },
  },
  MarkerPinPrimitive
)

/* ==========================================================================
   Marker Dot
   ========================================================================== */

export interface MarkerDotSlots {
  /** Inner badge content */
  content?: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
}

export interface MarkerDotProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Badge text or number label */
  children?: ReactNode
  /** Custom CSS classes */
  className?: string
  /** Size diameter in pixels (default: 14) */
  size?: number
  /** Background fill color */
  color?: string
  /** Outer stroke color */
  stroke?: string
  /** Slot overrides */
  slots?: SlotComponents<MarkerDotSlots>
  /** Slot props overrides */
  slotProps?: SlotPropsMap<MarkerDotSlots>
}

function MarkerDotPrimitive({
  children,
  className,
  size = 14,
  color,
  stroke,
  slots = {},
  slotProps = {},
  style,
  ...props
}: MarkerDotProps) {
  const content = renderSlot(slots.content, { children, ...slotProps.content }) ?? children
  return (
    <div
      className={cn('grid place-content-center rounded-full font-medium text-[10px] shadow-xs', className)}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        color: stroke,
        boxShadow: stroke ? `inset 0 0 0 1.5px ${stroke}` : undefined,
        ...style,
      }}
      {...props}
    >
      {content}
    </div>
  )
}

export const MarkerDot = createInterfaceComponent<MarkerDotProps, MarkerDotSlots>(
  {
    name: 'MarkerDot',
    category: 'data',
    description: 'Compact circular indicator dot for high-density geographic waypoint display.',
    version: '1.0.0',
    props: {
      size: 14,
    },
    slots: {
      content: undefined,
    },
  },
  MarkerDotPrimitive
)

/* ==========================================================================
   Marker Popup
   ========================================================================== */

export interface MarkerPopupSlots {
  /** Custom close icon */
  closeIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Custom body content */
  content?: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
}

export interface MarkerPopupProps extends Omit<PopupOptions, 'className' | 'closeButton'> {
  /** Content rendered inside popup card */
  children: ReactNode
  /** Custom CSS classes */
  className?: string
  /** Whether to show the top-right close button (default: false) */
  closeButton?: boolean
  /** Slot overrides */
  slots?: SlotComponents<MarkerPopupSlots>
  /** Slot props overrides */
  slotProps?: SlotPropsMap<MarkerPopupSlots>
}

function MarkerPopupPrimitive({
  children,
  className,
  closeButton = false,
  slots = {},
  slotProps = {},
  ...options
}: MarkerPopupProps) {
  const { marker, map } = useMarker()
  const { setPopoverOpen, hideOccluded } = useMap()
  const node = useMemo(() => document.createElement('div'), [])
  const popup = useMemo(
    () =>
      new maplibre.Popup({
        offset: 16,
        closeOnClick: true,
        focusAfterOpen: false,
        ...options,
        className: 'map-popover',
        closeButton: false,
      }).setMaxWidth('none').setDOMContent(node),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useEffect(() => {
    if (!map) return
    marker.setPopup(popup)
    const onOpen = () => setPopoverOpen(true)
    const onClose = () => setPopoverOpen(false)
    popup.on('open', onOpen)
    popup.on('close', onClose)
    const outside = (event: PointerEvent) => {
      if (!popup.isOpen()) return
      const target = event.target as Node | null
      if (!target) return
      if (popup.getElement()?.contains(target)) return
      if (marker.getElement().contains(target)) return
      popup.remove()
    }
    const sync = () => {
      if (!hideOccluded || !popup.isOpen()) return
      const { lng, lat } = marker.getLngLat()
      if (isOccluded(map, lng, lat)) popup.remove()
    }
    document.addEventListener('pointerdown', outside, true)
    map.on('move', sync)
    return () => {
      document.removeEventListener('pointerdown', outside, true)
      map.off('move', sync)
      popup.off('open', onOpen)
      popup.off('close', onClose)
      marker.setPopup(null)
      setPopoverOpen(false)
    }
  }, [hideOccluded, map, marker, popup, setPopoverOpen])

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

export const MarkerPopup = createInterfaceComponent<MarkerPopupProps, MarkerPopupSlots>(
  {
    name: 'MarkerPopup',
    category: 'overlay',
    description: 'Popup card anchored directly to its parent MapMarker element.',
    version: '1.0.0',
    props: {
      closeButton: false,
    },
    slots: {
      closeIcon: undefined,
      content: undefined,
    },
  },
  MarkerPopupPrimitive
)

/* ==========================================================================
   Marker Tooltip
   ========================================================================== */

export interface MarkerTooltipSlots {
  /** Tooltip body content */
  content?: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
}

export interface MarkerTooltipProps extends Omit<PopupOptions, 'className' | 'closeButton' | 'closeOnClick'> {
  /** Tooltip node content */
  children: ReactNode
  /** Custom CSS classes */
  className?: string
  /** Slot overrides */
  slots?: SlotComponents<MarkerTooltipSlots>
  /** Slot props overrides */
  slotProps?: SlotPropsMap<MarkerTooltipSlots>
}

function MarkerTooltipPrimitive({
  children,
  className,
  slots = {},
  slotProps = {},
  ...options
}: MarkerTooltipProps) {
  const { marker, map } = useMarker()
  const { hideOccluded, popoverOpen, setHoverTarget } = useMap()
  const node = useMemo(() => document.createElement('div'), [])
  const tooltip = useMemo(
    () =>
      new maplibre.Popup({
        offset: 10,
        closeOnClick: false,
        closeOnMove: false,
        focusAfterOpen: false,
        ...options,
        className: 'map-tooltip',
        closeButton: false,
      }).setMaxWidth('none'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useEffect(() => {
    if (!map) return
    tooltip.setDOMContent(node)
    const el = marker.getElement()
    let closeTimer = 0
    const blocked = () =>
      popoverOpen || (hideOccluded && el.classList.contains('maplibregl-marker-covered'))
    const hide = () => {
      window.clearTimeout(closeTimer)
      setHoverTarget(null)
      tooltip.remove()
    }
    const open = () => {
      window.clearTimeout(closeTimer)
      if (blocked()) return
      setHoverTarget('marker')
      tooltip.setLngLat(marker.getLngLat())
      if (!tooltip.isOpen()) tooltip.addTo(map)
    }
    const closeFromMarker = (event: PointerEvent) => {
      if (isHoverInside(event.relatedTarget, tooltip.getElement(), node)) return
      hide()
    }
    const closeFromTooltip = (event: PointerEvent) => {
      if (isHoverInside(event.relatedTarget, el, tooltip.getElement(), node)) return
      hide()
    }
    el.addEventListener('pointerenter', open)
    el.addEventListener('pointerleave', closeFromMarker)
    const attachPopup = () => {
      const popupEl = tooltip.getElement()
      if (!popupEl || popupEl.dataset.hoverBound === '1') return
      popupEl.dataset.hoverBound = '1'
      popupEl.addEventListener('pointerenter', open)
      popupEl.addEventListener('pointerleave', closeFromTooltip)
    }
    tooltip.on('open', attachPopup)
    attachPopup()
    const sync = () => {
      if (!tooltip.isOpen()) return
      if (blocked()) {
        tooltip.remove()
        return
      }
      tooltip.setLngLat(marker.getLngLat())
    }
    map.on('move', sync)
    return () => {
      window.clearTimeout(closeTimer)
      el.removeEventListener('pointerenter', open)
      el.removeEventListener('pointerleave', closeFromMarker)
      tooltip.off('open', attachPopup)
      const popupEl = tooltip.getElement()
      popupEl?.removeEventListener('pointerenter', open)
      popupEl?.removeEventListener('pointerleave', closeFromTooltip)
      if (popupEl) delete popupEl.dataset.hoverBound
      map.off('move', sync)
      tooltip.remove()
    }
  }, [hideOccluded, map, marker, node, popoverOpen, tooltip])

  const content = renderSlot(slots.content, { children, ...slotProps.content }) ?? children

  return createPortal(
    <div className={cn('px-2 py-1 text-xs', overlayCard, className)}>{content}</div>,
    node
  )
}

export const MarkerTooltip = createInterfaceComponent<MarkerTooltipProps, MarkerTooltipSlots>(
  {
    name: 'MarkerTooltip',
    category: 'feedback',
    description: 'Micro-tooltip card anchored directly to its parent MapMarker element on hover.',
    version: '1.0.0',
    props: {},
    slots: {
      content: undefined,
    },
  },
  MarkerTooltipPrimitive
)

/* ==========================================================================
   Marker Label
   ========================================================================== */

export interface MarkerLabelSlots {
  /** Label body content */
  content?: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
}

export interface MarkerLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Label text or indicator */
  children: ReactNode
  /** Custom CSS classes */
  className?: string
  /** Position relative to marker pin (default: 'top') */
  position?: 'top' | 'bottom'
  /** Slot overrides */
  slots?: SlotComponents<MarkerLabelSlots>
  /** Slot props overrides */
  slotProps?: SlotPropsMap<MarkerLabelSlots>
}

function MarkerLabelPrimitive({
  children,
  className,
  position = 'top',
  slots = {},
  slotProps = {},
  ...props
}: MarkerLabelProps) {
  const content = renderSlot(slots.content, { children, ...slotProps.content }) ?? children
  return (
    <div
      className={cn(
        'absolute left-1/2 -ml-28 w-56 flex justify-center whitespace-nowrap select-none pointer-events-none',
        position === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
        className
      )}
      style={{
        textRendering: 'geometricPrecision',
        WebkitFontSmoothing: 'subpixel-antialiased',
      }}
      {...props}
    >
      <span className="inline-flex items-center rounded-full bg-overlay/95 px-2 py-0.5 font-medium text-[10px] text-overlay-fg shadow-xs backdrop-blur-md ring-1 ring-fg/10">
        {content}
      </span>
    </div>
  )
}

export const MarkerLabel = createInterfaceComponent<MarkerLabelProps, MarkerLabelSlots>(
  {
    name: 'MarkerLabel',
    category: 'data',
    description: 'Positioned typography label placed directly above or below a marker pin.',
    version: '1.0.0',
    props: {
      position: 'top',
    },
    slots: {
      content: undefined,
    },
  },
  MarkerLabelPrimitive
)

/* ==========================================================================
   Map Marker (Root Family)
   ========================================================================== */

export interface MapMarkerSlots {
  /** Custom marker content wrapper */
  content?: React.ComponentType<MarkerContentProps>
  /** Custom marker pin component */
  pin?: React.ComponentType<MarkerPinProps>
}

export interface MapMarkerProps extends Omit<MarkerOptions, 'element'> {
  /** Longitude coordinate */
  longitude: number
  /** Latitude coordinate */
  latitude: number
  /** Children elements (MarkerContent, MarkerPin, MarkerPopup, MarkerTooltip, etc.) */
  children?: ReactNode
  /** Custom CSS classes */
  className?: string
  /** Override map hideOccluded behavior for this marker */
  hideOccluded?: boolean
  /** Tooltip node, boolean toggle, or render function */
  tooltip?: boolean | ReactNode
  /** Popover node, boolean toggle, or render function */
  popover?: boolean | ReactNode
  /** Controlled popover open state */
  popoverOpen?: boolean
  /** Callback fired when popover open state changes */
  onPopoverOpenChange?: (open: boolean) => void
  /** Callback fired when marker is clicked */
  onClick?: (event: MouseEvent) => void
  /** Callback fired on pointer enter */
  onMouseEnter?: (event: MouseEvent) => void
  /** Callback fired on pointer leave */
  onMouseLeave?: (event: MouseEvent) => void
  /** Callback fired when drag begins */
  onDragStart?: (lngLat: { lng: number; lat: number }) => void
  /** Callback fired during dragging */
  onDrag?: (lngLat: { lng: number; lat: number }) => void
  /** Callback fired when drag ends */
  onDragEnd?: (lngLat: { lng: number; lat: number }) => void
  /** HTML marker z-index */
  zIndex?: number
  /** Slot overrides */
  slots?: SlotComponents<MapMarkerSlots>
  /** Slot props overrides */
  slotProps?: SlotPropsMap<MapMarkerSlots>
}

function MapMarkerPrimitive({
  longitude,
  latitude,
  children,
  className,
  hideOccluded: hideOccludedProp,
  tooltip,
  popover,
  popoverOpen,
  onPopoverOpenChange,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onDrag,
  onDragEnd,
  draggable = false,
  zIndex,
  slots = {},
  slotProps = {},
  ...options
}: MapMarkerProps) {
  const { map, hideOccluded: hideOccludedCtx, setHoverTarget } = useMap()
  const hideOccluded = hideOccludedProp ?? hideOccludedCtx
  const hideRef = useRef(hideOccluded)
  hideRef.current = hideOccluded
  const callbacks = useRef({ onClick, onMouseEnter, onMouseLeave, onDragStart, onDrag, onDragEnd, onPopoverOpenChange, popoverOpen, popover })
  callbacks.current = { onClick, onMouseEnter, onMouseLeave, onDragStart, onDrag, onDragEnd, onPopoverOpenChange, popoverOpen, popover }

  const marker = useMemo(() => {
    const next = new maplibre.Marker({
      ...options,
      element: document.createElement('div'),
      draggable,
      ...(hideRef.current ? { opacityWhenCovered: 0 } : {}),
    }).setLngLat([longitude, latitude])
    const el = next.getElement()
    el.style.transition = 'opacity 220ms ease'
    el.addEventListener('click', (event: MouseEvent) => {
      if (hideRef.current && el.classList.contains('maplibregl-marker-covered')) {
        event.preventDefault()
        event.stopPropagation()
        return
      }
      callbacks.current.onClick?.(event)
      if (callbacks.current.popoverOpen != null && callbacks.current.popover !== false && callbacks.current.popover != null) {
        callbacks.current.onPopoverOpenChange?.(!callbacks.current.popoverOpen)
      }
    })
    el.addEventListener('mouseenter', (event: MouseEvent) => {
      setHoverTarget('marker')
      callbacks.current.onMouseEnter?.(event)
    })
    el.addEventListener('mouseleave', (event: MouseEvent) => {
      setHoverTarget(null)
      callbacks.current.onMouseLeave?.(event)
    })
    const emit =
      (key: 'onDragStart' | 'onDrag' | 'onDragEnd') => () => {
        const { lng, lat } = next.getLngLat()
        callbacks.current[key]?.({ lng, lat })
      }
    next.on('dragstart', emit('onDragStart'))
    next.on('drag', emit('onDrag'))
    next.on('dragend', emit('onDragEnd'))
    return next
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!map) return
    marker.addTo(map)
    return () => {
      marker.remove()
    }
  }, [map, marker])

  useEffect(() => {
    marker.setLngLat([longitude, latitude])
    marker.setDraggable(draggable)
    marker.getElement().style.zIndex = zIndex == null ? '' : String(zIndex)
  }, [draggable, latitude, longitude, marker, zIndex])

  useEffect(() => {
    marker.setOpacity(1, hideOccluded ? 0 : 0.2)
  }, [hideOccluded, marker])

  const childList = Children.toArray(children)
  const tooltipChild = childList.find((child) => isValidElement(child) && child.type === MarkerTooltip)
  const popoverChild = childList.find((child) => isValidElement(child) && child.type === MarkerPopup)
  const rest = childList.filter((child) => child !== tooltipChild && child !== popoverChild)
  const tooltipNode = tooltip === false ? null : tooltip === undefined || tooltip === true ? tooltipChild : <MarkerTooltip>{tooltip}</MarkerTooltip>
  const popoverNode =
    popover === false
      ? null
      : popover === undefined || popover === true
        ? popoverChild
        : popoverOpen == null
          ? <MarkerPopup>{popover}</MarkerPopup>
          : null
  const controlledPopover = popoverOpen && popover !== false && popover != null && popover !== true ? popover : null

  const defaultContent = (
    <MarkerContent className={className}>
      {renderSlot(slots.pin, slotProps.pin, { defaultComponent: MarkerPin })}
    </MarkerContent>
  )

  return (
    <MarkerContext.Provider value={{ marker, map }}>
      {rest.length > 0 ? rest : (renderSlot(slots.content, slotProps.content) ?? defaultContent)}
      {tooltipNode}
      {popoverNode}
      {controlledPopover ? (
        <MapPopup
          latitude={latitude}
          longitude={longitude}
          onClose={() => onPopoverOpenChange?.(false)}
        >
          {controlledPopover}
        </MapPopup>
      ) : null}
    </MarkerContext.Provider>
  )
}

export const MapMarker = createInterfaceComponent<MapMarkerProps, MapMarkerSlots>(
  {
    name: 'MapMarker',
    category: 'data',
    description: 'Interactive HTML DOM marker attached to map coordinates with drag, hover tooltip, and click popup support.',
    version: '1.0.0',
    props: {
      longitude: 0,
      latitude: 0,
      draggable: false,
    },
    slots: {
      content: undefined,
      pin: MarkerPin,
    },
  },
  MapMarkerPrimitive
)

MapMarker.Content = MarkerContent
MapMarker.Pin = MarkerPin
MapMarker.Dot = MarkerDot
MapMarker.Popup = MarkerPopup
MapMarker.Tooltip = MarkerTooltip
MapMarker.Label = MarkerLabel

export const { Context: MapMarkerContext, useCompoundContext: useMapMarkerContext } =
  createCompoundContext<any>('MapMarker')
