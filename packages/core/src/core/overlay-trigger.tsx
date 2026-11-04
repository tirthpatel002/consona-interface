import React, {
  Children,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react'
import {
  DialogTrigger as RACDialogTrigger,
  OverlayTriggerStateContext,
  Popover as RACPopover,
  PopoverContext,
  Pressable,
  type DialogTriggerProps as RACDialogTriggerProps,
  type PopoverProps as RACPopoverProps,
} from 'react-aria-components'

const dynamicSurfaceSelectors = new Set<string>([
  '[data-slot="popover"]',
  '[data-slot="collection-popover"]',
  '[data-slot="modal-content"]',
  '[data-slot="modal-overlay"]',
  '.react-aria-Popover',
  '.react-aria-Modal',
])

/**
 * Registers an additional surface selector that prevents parent overlay dismissal on click (Rule C0).
 */
export function registerOverlaySurfaceSelector(selector: string): () => void {
  dynamicSurfaceSelectors.add(selector)
  return () => {
    dynamicSurfaceSelectors.delete(selector)
  }
}

export function getOverlaySurfaceSelector(): string {
  return Array.from(dynamicSurfaceSelectors).join(',')
}

/** Nested overlay surfaces that must not dismiss a parent popover (e.g. Calendar Select). */
export const OVERLAY_SURFACE_SELECTOR = [
  '[data-slot="popover"]',
  '[data-slot="collection-popover"]',
  '[data-slot="modal-content"]',
  '[data-slot="modal-overlay"]',
  '.react-aria-Popover',
  '.react-aria-Modal',
].join(',')

function triggerFromPopoverContext() {
  const popoverContext = useContext(PopoverContext)
  if (!popoverContext || Array.isArray(popoverContext)) return undefined
  return (popoverContext as { triggerRef?: RefObject<Element | null> }).triggerRef
}

export function useOverlayDismiss(options: {
  onClose: () => void
  triggerRef?: RefObject<Element | null> | null
  overlayRef?: RefObject<Element | null> | null
  /** Keep parent open when the click is on a nested overlay (Select, submenu). */
  containNested?: boolean
  /** When false, the listener is not attached. */
  enabled?: boolean
}) {
  const { onClose, triggerRef, overlayRef, containNested = false, enabled = true } = options

  useEffect(() => {
    if (!enabled) return

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      const target = event.target
      if (!(target instanceof Element)) return
      if (overlayRef && !overlayRef.current) return
      if (overlayRef?.current instanceof Element && overlayRef.current.contains(target)) return
      if (containNested && target.closest(getOverlaySurfaceSelector())) return
      const trigger = triggerRef?.current
      if (trigger instanceof Element && trigger.contains(target)) return
      onClose?.()
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [onClose, triggerRef, overlayRef, containNested, enabled])
}


/**
 * Standard overlay host for Popover, Modal, and composites.
 * First child is the trigger (any host, via Pressable). Remaining children are overlays.
 */
export function OverlayTrigger({ children, ...props }: RACDialogTriggerProps) {
  const items = Children.toArray(children as ReactNode)
  const trigger = items[0]
  const overlays = items.slice(1)

  return (
    <RACDialogTrigger {...props}>
      {isValidElement(trigger) ? <Pressable>{trigger as any}</Pressable> : trigger}
      {overlays}
    </RACDialogTrigger>
  )
}

export function useOverlayTriggerClose() {
  return useContext(OverlayTriggerStateContext)?.close
}

/**
 * RAC Select / ListBox overlay. No Dialog wrapper (collections require that).
 * Dismiss is scoped to this surface so a click on the parent calendar closes it.
 */
export function CollectionPopover({ className, ...props }: RACPopoverProps) {
  const overlayRef = useRef<HTMLElement>(null)
  const state = useContext(OverlayTriggerStateContext)
  const triggerRef = triggerFromPopoverContext()

  useOverlayDismiss({
    enabled: !!state?.isOpen,
    onClose: () => state?.close(),
    overlayRef,
    triggerRef,
  })

  return (
    <RACPopover
      ref={overlayRef}
      isNonModal
      data-slot="collection-popover"
      className={className}
      {...props}
    />
  )
}
