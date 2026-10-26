import React, { useState } from 'react'
import {
  ArrowPathIcon,
  ArrowsPointingOutIcon,
  MinusIcon,
  PlusIcon,
  ViewfinderCircleIcon,
} from '@heroicons/react/24/outline'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import { cn } from '../../../../core/cn'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Loader } from '../../../core/components/loader'
import { useMap } from '../../context'
import {Button} from '../../../core/components/button'
export const CONTROL_POSITION = {
  'top-left': 'start-3 top-3',
  'top-right': 'end-3 top-3',
  'bottom-left': 'start-3 bottom-3',
  'bottom-right': 'end-3 bottom-3',
} as const

export const controlButton =
  'bg-overlay text-overlay-fg shadow-xs [--btn-bg:var(--overlay)] [--btn-fg:var(--overlay-fg)] [--btn-icon:var(--muted-fg)] [--btn-overlay:color-mix(in_oklab,var(--fg)_8%,var(--overlay)_92%)]'

export interface MapControlsSlots {
  /** Custom zoom-in button icon */
  zoomInIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Custom zoom-out button icon */
  zoomOutIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Custom compass button icon / indicator */
  compassIcon?: React.ComponentType<React.HTMLAttributes<HTMLSpanElement>>
  /** Custom location finder button icon */
  locateIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Custom fullscreen toggle button icon */
  fullscreenIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Custom auto-rotate toggle button icon */
  autoRotateIcon?: React.ComponentType<{ autoRotate?: boolean; className?: string }>
  /** Loading indicator used during geolocation */
  loader?: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
}

export interface MapControlsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Placement corner for the control button stack */
  position?: keyof typeof CONTROL_POSITION
  /** Whether to show the zoom-in and zoom-out buttons (default: true) */
  showZoom?: boolean
  /** Whether to show the reset north compass button (default: false) */
  showCompass?: boolean
  /** Whether to show the user geolocation button (default: false) */
  showLocate?: boolean
  /** Whether to show the fullscreen toggle button (default: false) */
  showFullscreen?: boolean
  /** Whether to show the auto-rotate toggle button (default: auto-detected for globes) */
  showAutoRotate?: boolean
  /** Callback fired with coordinates when location is retrieved */
  onLocate?: (coords: { longitude: number; latitude: number }) => void
  /** Callback fired when auto-rotate is toggled */
  onAutoRotateToggle?: (autoRotate: boolean) => void
  /** Slot overrides for internal icons and loaders */
  slots?: SlotComponents<MapControlsSlots>
  /** Slot props overrides */
  slotProps?: SlotPropsMap<MapControlsSlots>
  className?: string
}

function MapControlsPrimitive({
  className,
  position = 'top-right',
  showZoom = true,
  showCompass = false,
  showLocate = false,
  showFullscreen = false,
  showAutoRotate,
  onLocate,
  onAutoRotateToggle,
  slots = {},
  slotProps = {},
  ...props
}: MapControlsProps) {
  const { map, autoRotate, setAutoRotate, isGlobe } = useMap()
  const [locating, setLocating] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const shouldShowAutoRotate = showAutoRotate !== undefined ? showAutoRotate : isGlobe

  const zoomInIcon = renderSlot(slots.zoomInIcon, { strokeWidth: 1.5, ...slotProps.zoomInIcon }) ?? (
    <PlusIcon strokeWidth={1.5} />
  )
  const zoomOutIcon = renderSlot(slots.zoomOutIcon, { strokeWidth: 1.5, ...slotProps.zoomOutIcon }) ?? (
    <MinusIcon strokeWidth={1.5} />
  )
  const compassIcon = renderSlot(slots.compassIcon, slotProps.compassIcon) ?? (
    <span className="font-medium text-[10px]">N</span>
  )
  const locateIcon = renderSlot(slots.locateIcon, { strokeWidth: 1.5, ...slotProps.locateIcon }) ?? (
    <ViewfinderCircleIcon strokeWidth={1.5} />
  )
  const fullscreenIcon = renderSlot(slots.fullscreenIcon, { strokeWidth: 1.5, ...slotProps.fullscreenIcon }) ?? (
    <ArrowsPointingOutIcon strokeWidth={1.5} />
  )
  const autoRotateIcon = renderSlot(slots.autoRotateIcon, {
    autoRotate,
    className: 'size-4',
    ...slotProps.autoRotateIcon,
  }) ?? (
    <ArrowPathIcon
      className={cn(
        'size-4 transition-all duration-300',
        autoRotate ? 'animate-spin [animation-duration:3.5s] text-primary-fg' : 'text-muted-fg'
      )}
    />
  )
  const loader = renderSlot(slots.loader, slotProps.loader) ?? <Loader size="xs" />

  return (
    <div
      className={cn('absolute z-10 flex flex-col gap-1', CONTROL_POSITION[position], className)}
      data-slot="map-controls"
      {...props}
    >
      {showZoom ? (
        <>
          <Button
            aria-label="Zoom in"
            className={controlButton}
            intent="outline"
            size="sq-sm"
            onPress={() => map?.zoomTo((map.getZoom() ?? 0) + 1, { duration: 200 })}
          >
            {zoomInIcon}
          </Button>
          <Button
            aria-label="Zoom out"
            className={controlButton}
            intent="outline"
            size="sq-sm"
            onPress={() => map?.zoomTo((map.getZoom() ?? 0) - 1, { duration: 200 })}
          >
            {zoomOutIcon}
          </Button>
        </>
      ) : null}
      {showCompass ? (
        <Button
          aria-label="Reset north"
          className={controlButton}
          intent="outline"
          size="sq-sm"
          onPress={() => map?.resetNorthPitch({ duration: 280 })}
        >
          {compassIcon}
        </Button>
      ) : null}
      {shouldShowAutoRotate ? (
        <Button
          aria-label={autoRotate ? 'Pause auto-rotation' : 'Start auto-rotation'}
          aria-pressed={autoRotate}
          className={cn(
            controlButton,
            'transition-all duration-200',
            autoRotate
              ? '!bg-primary !text-primary-fg !border-primary hover:!bg-primary/90 shadow-sm ring-2 ring-primary/30'
              : 'hover:text-fg'
          )}
          intent="outline"
          size="sq-sm"
          onPress={() => {
            const next = !autoRotate
            setAutoRotate(next)
            onAutoRotateToggle?.(next)
          }}
        >
          {autoRotateIcon}
        </Button>
      ) : null}
      {showLocate ? (
        <Button
          aria-label="Find my location"
          className={cn(
            controlButton,
            'transition-all duration-200',
            locating && '!bg-primary/10 !text-primary !border-primary/40 ring-1 ring-primary/20'
          )}
          intent="outline"
          isDisabled={locating}
          size="sq-sm"
          onPress={() => {
            if (!('geolocation' in navigator)) return
            setLocating(true)
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const coords = {
                  longitude: pos.coords.longitude,
                  latitude: pos.coords.latitude,
                }
                map?.flyTo({ center: [coords.longitude, coords.latitude], zoom: 14, duration: 1200 })
                onLocate?.(coords)
                setLocating(false)
              },
              () => setLocating(false),
              { timeout: 10_000 }
            )
          }}
        >
          {locating ? loader : locateIcon}
        </Button>
      ) : null}
      {showFullscreen ? (
        <Button
          aria-label="Toggle fullscreen"
          aria-pressed={isFullscreen}
          className={cn(
            controlButton,
            'transition-all duration-200',
            isFullscreen
              ? '!bg-primary !text-primary-fg !border-primary hover:!bg-primary/90 shadow-sm ring-2 ring-primary/30'
              : 'hover:text-fg'
          )}
          intent="outline"
          size="sq-sm"
          onPress={() => {
            const node = map?.getContainer().parentElement
            if (!node) return
            if (document.fullscreenElement) void document.exitFullscreen()
            else void node.requestFullscreen()
          }}
        >
          {fullscreenIcon}
        </Button>
      ) : null}
    </div>
  )
}

export const MapControls = createInterfaceComponent<MapControlsProps, MapControlsSlots>(
  {
    name: 'MapControls',
    category: 'navigation',
    description: 'Floating on-map navigation control stack for zooming, compass orientation, auto-rotation, geolocation, and fullscreen.',
    version: '1.1.0',
    props: {
      position: 'top-right',
      showZoom: true,
      showCompass: false,
      showLocate: false,
      showFullscreen: false,
      showAutoRotate: undefined,
    },
    slots: {
      zoomInIcon: undefined,
      zoomOutIcon: undefined,
      compassIcon: undefined,
      locateIcon: undefined,
      fullscreenIcon: undefined,
      autoRotateIcon: undefined,
      loader: undefined,
    },
  },
  MapControlsPrimitive
)

