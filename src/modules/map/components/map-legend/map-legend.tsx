import React, {
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import { cn } from '../../../../core/cn'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { MapLegendContext, useMap, type MapLegendContextValue } from '../../context'
import { CONTROL_POSITION } from '../map-controls/map-controls'

export { useMapLegend } from '../../context'
export type { MapLegendContextValue }

export const overlayCard =
  'rounded-base bg-overlay text-overlay-fg shadow-xs ring-1 ring-fg/10 backdrop-blur-sm'

export interface MapLegendSlots {
  /** Title header element */
  title?: React.ComponentType<{ children?: ReactNode; isExpanded?: boolean }>
  /** Custom series / scale items content */
  content?: React.ComponentType<{ children?: ReactNode; isExpanded?: boolean }>
  /** Custom collapse/expand toggle icon slot */
  toggleIcon?: React.ComponentType<{ isExpanded?: boolean; className?: string }>
  /** Optional leading icon in header */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface MapLegendProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Optional legend title text or ReactNode */
  title?: ReactNode
  /** Legend items and series list */
  children?: ReactNode
  /** Placement corner on the map (default: 'bottom-left') */
  position?: keyof typeof CONTROL_POSITION
  /** Whether the legend can be collapsed into a compact header bar (default: true) */
  collapsible?: boolean
  /** Initial expanded state when uncontrolled (default: true) */
  defaultExpanded?: boolean
  /** Controlled expanded state */
  isExpanded?: boolean
  /** Callback fired when expanded state changes */
  onExpandedChange?: (isExpanded: boolean) => void
  /** Unique storage key for persisting expanded state across page reloads */
  storageKey?: string
  /** Whether to persist expanded state in localStorage and MapContext (default: true) */
  persist?: boolean
  /** Custom CSS classes */
  className?: string
  /** Slot overrides for downstream customization */
  slots?: SlotComponents<MapLegendSlots>
  /** Slot props overrides */
  slotProps?: SlotPropsMap<MapLegendSlots>
}

function MapLegendPrimitive({
  title,
  children,
  position = 'bottom-left',
  collapsible = true,
  defaultExpanded = true,
  isExpanded: isExpandedProp,
  onExpandedChange,
  storageKey,
  persist = true,
  className,
  slots = {},
  slotProps = {},
  ...props
}: MapLegendProps) {
  let mapContext: ReturnType<typeof useMap> | null = null
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    mapContext = useMap()
  } catch {
    // Render gracefully if used outside <Map>
  }

  const titleString = typeof title === 'string' ? title : ''
  const resolvedKey =
    storageKey ||
    (titleString
      ? `consona-map-legend-${titleString.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
      : 'consona-map-legend')

  const [internalExpanded, setInternalExpanded] = useState<boolean>(() => {
    if (isExpandedProp !== undefined) return isExpandedProp
    if (mapContext?.legendState && mapContext.legendState[resolvedKey] !== undefined) {
      return mapContext.legendState[resolvedKey]!
    }
    if (persist && typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(resolvedKey)
        if (saved !== null) {
          return saved === 'true'
        }
      } catch {
        /* storage restricted */
      }
    }
    return defaultExpanded
  })

  const isControlled = isExpandedProp !== undefined
  const expanded = isControlled ? isExpandedProp : internalExpanded

  const setExpanded = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      const value = typeof next === 'function' ? next(expanded) : next
      if (!isControlled) {
        setInternalExpanded(value)
      }
      onExpandedChange?.(value)
      if (mapContext?.setLegendState) {
        mapContext.setLegendState(resolvedKey, value)
      }
      if (persist && typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(resolvedKey, String(value))
        } catch {
          /* storage restricted */
        }
      }
    },
    [expanded, isControlled, mapContext, onExpandedChange, persist, resolvedKey]
  )

  const toggle = useCallback(() => {
    if (!collapsible) return
    setExpanded((prev) => !prev)
  }, [collapsible, setExpanded])

  const legendContextValue = useMemo<MapLegendContextValue>(
    () => ({
      isExpanded: expanded,
      setIsExpanded: (val: boolean) => setExpanded(val),
      toggle,
      collapsible,
    }),
    [collapsible, expanded, setExpanded, toggle]
  )

  const defaultToggleIcon = (
    <ChevronDownIcon
      className={cn(
        'size-3.5 shrink-0 text-muted-fg transition-transform duration-200 ease-out',
        expanded ? 'rotate-0' : '-rotate-90'
      )}
    />
  )

  const toggleIcon =
    collapsible
      ? renderSlot(slots.toggleIcon, {
            ...slotProps?.toggleIcon,
          isExpanded: expanded,
          className: cn('size-3.5 shrink-0 text-muted-fg transition-transform duration-200 ease-out', expanded ? 'rotate-0' : '-rotate-90'),
          ...slotProps.toggleIcon,
        }) ?? defaultToggleIcon
      : null

  const leadingIcon = renderSlot(slots.icon, slotProps.icon)

  const titleContent =
    renderSlot(slots.title, { children: title, isExpanded: expanded, ...slotProps.title }) ?? (
      title ? <span className="font-medium text-xs tracking-tight">{title}</span> : null
    )

  const contentNode = renderSlot(slots.content, { children, isExpanded: expanded, ...slotProps.content }) ?? (
    <div className="flex flex-col gap-1.5 text-muted-fg text-xs">{children}</div>
  )

  return (
    <MapLegendContext.Provider value={legendContextValue}>
      <div
        className={cn(
          'absolute z-10 min-w-36 max-w-56 transition-all duration-200 ease-out select-none',
          CONTROL_POSITION[position],
          overlayCard,
          expanded ? 'p-3' : 'px-2.5 py-1.5',
          className
        )}
        data-slot="map-legend"
        data-expanded={expanded}
        data-collapsible={collapsible}
        {...props}
      >
        {titleContent || collapsible ? (
          <div
            role={collapsible ? 'button' : undefined}
            tabIndex={collapsible ? 0 : undefined}
            aria-expanded={collapsible ? expanded : undefined}
            onClick={toggle}
            onKeyDown={(e) => {
              if (collapsible && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                toggle()
              }
            }}
            className={cn(
              'flex items-center justify-between gap-2',
              collapsible && 'cursor-pointer group/legend-header hover:text-fg outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm',
              expanded && (titleContent || children) && 'mb-2'
            )}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {leadingIcon}
              {titleContent}
            </div>
            {toggleIcon}
          </div>
        ) : null}

        {expanded ? contentNode : null}
      </div>
    </MapLegendContext.Provider>
  )
}

export const MapLegend = createInterfaceComponent<MapLegendProps, MapLegendSlots>(
  {
    name: 'MapLegend',
    category: 'data',
    description: 'Collapsible on-map legend overlay for categorical, threshold, or thematic color keys with persistent context.',
    version: '1.1.0',
    props: {
      position: 'bottom-left',
      collapsible: true,
      defaultExpanded: true,
      persist: true,
    },
    slots: {
      title: undefined,
      content: undefined,
      toggleIcon: undefined,
      icon: undefined,
    },
  },
  MapLegendPrimitive
)
