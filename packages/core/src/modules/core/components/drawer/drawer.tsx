import React, { use, useCallback, useEffect, useRef, useState } from 'react'
import {
  Modal as RACModal,
  ModalOverlay as RACModalOverlay,
  type ModalOverlayProps as RACModalOverlayProps,
  Dialog as RACDialog,
  type DialogProps as RACDialogProps,
  type DialogTriggerProps as RACDialogTriggerProps,
  Heading as RACHeading,
  type HeadingProps as RACHeadingProps,
  Text as RACText,
  type TextProps as RACTextProps,
  OverlayTriggerStateContext,
  Button as RACButton,
} from 'react-aria-components'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { OverlayTrigger } from '../../../../core/overlay-trigger'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { XMarkIcon } from '@heroicons/react/24/outline'

/* ==========================================================================
   Drawer Slots & State
   ========================================================================== */

export interface DrawerSlotState {
  /** Whether the drawer is currently open */
  isOpen: boolean
  /** The side the drawer appears from */
  side: 'top' | 'bottom' | 'left' | 'right'
}

export interface DrawerSlots {
  /** Drag notch handle slot (appears at top for bottom drawers, bottom for top drawers) */
  notch?: React.ComponentType<DrawerNotchProps>
}

/* ==========================================================================
   DrawerContent Root (the animated surface)
   ========================================================================== */

export interface DrawerContentProps
  extends Omit<RACModalOverlayProps, 'className' | 'children' | 'isDismissable'>,
    Pick<RACDialogProps, 'aria-label' | 'aria-labelledby' | 'role' | 'children' | 'className'> {
  /** Which edge the drawer slides in from. Defaults to 'bottom'. */
  side?: 'top' | 'bottom' | 'left' | 'right'
  /** When true, the drawer floats with rounded corners and a small inset. */
  isFloat?: boolean
  /** Whether to show the drag notch handle. Bottom/top only. Defaults to true. */
  notch?: boolean
  /** Additional CSS class applied to the modal surface. */
  className?: string
  /** Props passed to the overlay backdrop. */
  overlay?: Pick<RACModalOverlayProps, 'className'>
  /** Slot component overrides. */
  slots?: SlotComponents<DrawerSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<DrawerSlots>
}

const DRAWER_ENTER_MS = 320

function useDrawerDrag(
  side: 'top' | 'bottom' | 'left' | 'right',
  enabled: boolean,
  onDismiss: () => void
) {
  const startRef = useRef(0)
  const draggingRef = useRef(false)
  const [offset, setOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const reset = useCallback(() => {
    draggingRef.current = false
    setIsDragging(false)
    setOffset(0)
  }, [])

  useEffect(() => {
    if (!enabled) reset()
  }, [enabled, reset])

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!enabled || event.button !== 0) return
      draggingRef.current = true
      setIsDragging(true)
      startRef.current = side === 'left' || side === 'right' ? event.clientX : event.clientY
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [enabled, side]
  )

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!draggingRef.current) return
      const current = side === 'left' || side === 'right' ? event.clientX : event.clientY
      const delta = current - startRef.current
      if (side === 'bottom') setOffset(Math.max(0, delta))
      else if (side === 'top') setOffset(Math.min(0, delta))
      else if (side === 'left') setOffset(Math.min(0, delta))
      else setOffset(Math.max(0, delta))
    },
    [side]
  )

  const onPointerUp = useCallback(() => {
    if (!draggingRef.current) return
    draggingRef.current = false
    setIsDragging(false)
    const distance = Math.abs(offset)
    const threshold =
      side === 'left' || side === 'right'
        ? Math.min(140, window.innerWidth * 0.25)
        : Math.min(140, window.innerHeight * 0.2)
    if (distance > threshold) onDismiss()
    else setOffset(0)
  }, [offset, onDismiss, side])

  const transform =
    offset === 0
      ? undefined
      : side === 'left' || side === 'right'
        ? `translate3d(${offset}px,0,0)`
        : `translate3d(0,${offset}px,0)`

  return {
    style: {
      transform,
      transition: isDragging ? 'none' : 'transform 200ms cubic-bezier(0.32, 0.72, 0, 1)',
    } as React.CSSProperties,
    listeners: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  }
}

const DrawerContentPrimitive = ({
  side = 'bottom',
  isFloat = false,
  notch = true,
  children,
  className,
  overlay,
  slots = {},
  slotProps = {},
  ...props
}: DrawerContentProps) => {
  const state = use(OverlayTriggerStateContext)!
  const isOpen = props.isOpen ?? state?.isOpen ?? false
  const onOpenChange = props.onOpenChange ?? state?.setOpen

  // Defer drag until CSS enter finishes so pointer capture can't stall the slide.
  const [dragReady, setDragReady] = useState(false)
  useEffect(() => {
    if (!isOpen) {
      setDragReady(false)
      return
    }
    setDragReady(false)
    const id = window.setTimeout(() => setDragReady(true), DRAWER_ENTER_MS)
    return () => window.clearTimeout(id)
  }, [isOpen])

  const dismiss = useCallback(() => {
    onOpenChange?.(false)
    state?.close?.()
  }, [onOpenChange, state])

  const drag = useDrawerDrag(side, dragReady && isOpen, dismiss)

  // Width tracks the viewport: a portion on large screens (`--drawer-max`),
  // growing toward full width as the screen shrinks (`min(100%, …)`).
  const sideWidth = isFloat
    ? 'w-[min(calc(100%-1rem),var(--drawer-max,28rem))]'
    : 'w-[min(100%,var(--drawer-max,28rem))]'

  const sideClass = {
    top: [
      'inset-x-0 mx-auto',
      sideWidth,
      isFloat ? 'top-2 rounded-macro' : 'top-0 rounded-b-macro',
    ].join(' '),
    bottom: [
      'inset-x-0 mx-auto',
      sideWidth,
      isFloat ? 'bottom-2 rounded-macro' : 'bottom-0 rounded-t-macro',
    ].join(' '),
    left: [
      'overflow-y-auto',
      sideWidth,
      isFloat ? 'inset-y-2 left-2 rounded-macro' : 'inset-y-0 left-0 h-auto',
    ].join(' '),
    right: [
      'overflow-y-auto',
      sideWidth,
      isFloat ? 'inset-y-2 right-2 rounded-macro' : 'inset-y-0 right-0 h-auto',
    ].join(' '),
  }[side]

  // No AnimatePresence / motion.create — those fight RAC mount + preventScroll
  // and freeze mid-slide on mobile. CSS data-entering runs on the compositor.
  return (
    <RACModalOverlay
      isDismissable
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      data-slot="drawer-overlay"
      className={cn(
        'consona-drawer-overlay fixed inset-0 z-50',
        '[--drawer-pad:32px]',
        overlay?.className
      )}
      {...props}
    >
      <RACModal
        data-slot="drawer-surface"
        data-side={side}
        className={cn(
          'consona-drawer-surface fixed max-h-full touch-none overflow-hidden bg-overlay text-fg',
          'border border-border/40 shadow-2xl',
          sideClass,
          className
        )}
        style={drag.style}
        {...drag.listeners}
      >
        <RACDialog
          aria-label="Drawer"
          role="dialog"
          className={cn(
            'relative flex w-full flex-col overflow-hidden outline-hidden',
            // Use dvh — RAC's --visual-viewport-height updates after preventScroll
            // on mobile and restyles max-height mid-animation (the freeze).
            side === 'top' || side === 'bottom'
              ? 'max-h-[calc(100dvh-var(--drawer-pad))]'
              : 'h-full'
          )}
        >
          {notch && side === 'bottom' && renderSlot(
            slots.notch,
            { ...slotProps?.notch, position: 'top' } as any,
            { defaultComponent: DrawerNotch as any }
          )}
          {children as React.ReactNode}
          {notch && side === 'top' && renderSlot(
            slots.notch,
            { ...slotProps?.notch, position: 'bottom' } as any,
            { defaultComponent: DrawerNotch as any }
          )}
        </RACDialog>
      </RACModal>
    </RACModalOverlay>
  )
}

export const DrawerContent = createInterfaceComponent<DrawerContentProps, DrawerSlots>(
  {
    name: 'DrawerContent',
    category: 'overlay',
    description: 'Animated slide-in drawer surface with CSS enter/exit motion and gesture drag dismissal.',
    version: '1.0.0',
    props: {
      side: 'bottom',
      isFloat: false,
      notch: true,
    },
    slots: {
      notch: undefined,
    },
  },
  DrawerContentPrimitive
)

/* ==========================================================================
   Drawer Root (trigger wrapper)
   ========================================================================== */

export interface DrawerProps extends Omit<RACDialogTriggerProps, 'children'> {
  /** Drawer trigger button and DrawerContent children. */
  children?: React.ReactNode
  /** Slot overrides map. */
  slots?: SlotComponents<DrawerSlots>
  /** Property overrides passed down to injected slots. */
  slotProps?: SlotPropsMap<DrawerSlots>
}

const DrawerPrimitive = (props: DrawerProps) => {
  return <OverlayTrigger data-slot="drawer-trigger" {...(props as any)} />
}

export const Drawer = createInterfaceComponent<DrawerProps, DrawerSlots>(
  {
    name: 'Drawer',
    category: 'overlay',
    description: 'Root trigger container for the Drawer overlay system. Wraps DialogTrigger with slot-based open state.',
    version: '1.0.0',
    slots: {
      notch: undefined,
    },
  },
  DrawerPrimitive
)

/* ==========================================================================
   Drawer Sub-Atoms
   ========================================================================== */

export interface DrawerNotchProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Position of the notch: 'top' (for bottom-anchored drawers) or 'bottom' (for top-anchored). */
  position?: 'top' | 'bottom'
}

const DrawerNotchPrimitive = ({ className, position = 'top', ...props }: DrawerNotchProps) => (
  <div
    data-slot="drawer-notch"
    className={cn(
      'mx-auto h-1.5 w-10 shrink-0 touch-pan-y rounded-full bg-fg/20',
      position === 'top' ? 'sticky top-0 mt-2.5' : 'sticky bottom-0 mb-2.5',
      className
    )}
    {...props}
  />
)

export const DrawerNotch = createInterfaceComponent<DrawerNotchProps>(
  {
    name: 'DrawerNotch',
    category: 'overlay',
    description: 'Drag handle notch affordance displayed at the edge of bottom/top drawers.',
    version: '1.0.0',
    props: { position: 'top' },
  },
  DrawerNotchPrimitive
)

export interface DrawerHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const DrawerHeaderPrimitive = ({ className, ...props }: DrawerHeaderProps) => (
  <div
    data-slot="drawer-header"
    slot="header"
    className={cn('flex flex-col p-space-lg text-center sm:text-start', className)}
    {...props}
  />
)

export const DrawerHeader = createInterfaceComponent<DrawerHeaderProps>(
  {
    name: 'DrawerHeader',
    category: 'overlay',
    description: 'Structural header container for Drawer title and description.',
    version: '1.0.0',
  },
  DrawerHeaderPrimitive
)

export interface DrawerTitleProps extends RACHeadingProps {}

const DrawerTitlePrimitive = ({ className, ...props }: DrawerTitleProps) => (
  <RACHeading
    slot="title"
    data-slot="drawer-title"
    className={cn('font-semibold text-lg/8 text-fg', className)}
    {...props}
  />
)

export const DrawerTitle = createInterfaceComponent<DrawerTitleProps>(
  {
    name: 'DrawerTitle',
    category: 'overlay',
    description: 'Accessible heading for drawer dialogs with automatic ARIA association.',
    version: '1.0.0',
  },
  DrawerTitlePrimitive
)

export interface DrawerDescriptionProps extends RACTextProps {}

const DrawerDescriptionPrimitive = ({ className, ...props }: DrawerDescriptionProps) => (
  <RACText
    slot="description"
    data-slot="drawer-description"
    className={cn('text-sm text-muted-fg', className)}
    {...props}
  />
)

export const DrawerDescription = createInterfaceComponent<DrawerDescriptionProps>(
  {
    name: 'DrawerDescription',
    category: 'overlay',
    description: 'Supporting description text for drawer dialogs.',
    version: '1.0.0',
  },
  DrawerDescriptionPrimitive
)

export interface DrawerBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

const DrawerBodyPrimitive = ({ className, ...props }: DrawerBodyProps) => (
  <div
    data-slot="drawer-body"
    slot="body"
    className={cn(
      'isolate flex max-h-[calc(100dvh-var(--drawer-pad,32px))] flex-col overflow-auto px-space-lg py-space-xs',
      className
    )}
    {...props}
  />
)

export const DrawerBody = createInterfaceComponent<DrawerBodyProps>(
  {
    name: 'DrawerBody',
    category: 'overlay',
    description: 'Scrollable content body section for drawer dialogs.',
    version: '1.0.0',
  },
  DrawerBodyPrimitive
)

export interface DrawerFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const DrawerFooterPrimitive = ({ className, ...props }: DrawerFooterProps) => (
  <div
    data-slot="drawer-footer"
    slot="footer"
    className={cn(
      'isolate mt-auto flex flex-col-reverse justify-end gap-space-sm p-space-lg sm:flex-row',
      className
    )}
    {...props}
  />
)

export const DrawerFooter = createInterfaceComponent<DrawerFooterProps>(
  {
    name: 'DrawerFooter',
    category: 'overlay',
    description: 'Action footer container for drawer dialogs.',
    version: '1.0.0',
  },
  DrawerFooterPrimitive
)

export interface DrawerCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Callback invoked when the close button is pressed. */
  onClose?: () => void
}

const DrawerClosePrimitive = ({ className, onClose, children, ...props }: DrawerCloseProps) => (
  <RACButton
    slot="close"
    data-slot="drawer-close"
    onPress={onClose}
    className={cn(
      'inline-flex items-center justify-center gap-space-xs rounded-base border border-border/60 px-space-md py-space-xs text-sm font-medium',
      'bg-secondary text-fg hover:bg-muted transition-colors cursor-pointer outline-none',
      className
    )}
    {...props as any}
  >
    {children ?? <XMarkIcon className="size-4" />}
  </RACButton>
)

export const DrawerClose = createInterfaceComponent<DrawerCloseProps>(
  {
    name: 'DrawerClose',
    category: 'overlay',
    description: 'Close/dismiss button for drawer dialogs with slot="close" aria binding.',
    version: '1.0.0',
  },
  DrawerClosePrimitive
)

/* ==========================================================================
   Aliases & Compound Namespace Attachments
   ========================================================================== */

export const Sheet = Drawer
export const SheetContent = DrawerContent
export const SheetHeader = DrawerHeader
export const SheetTitle = DrawerTitle
export const SheetDescription = DrawerDescription
export const SheetBody = DrawerBody
export const SheetFooter = DrawerFooter
export const SheetClose = DrawerClose

Drawer.Content = DrawerContent
Drawer.Header = DrawerHeader
Drawer.Title = DrawerTitle
Drawer.Description = DrawerDescription
Drawer.Body = DrawerBody
Drawer.Footer = DrawerFooter
Drawer.Close = DrawerClose
Drawer.Notch = DrawerNotch

Sheet.Content = SheetContent
Sheet.Header = SheetHeader
Sheet.Title = SheetTitle
Sheet.Description = SheetDescription
Sheet.Body = SheetBody
Sheet.Footer = SheetFooter
Sheet.Close = SheetClose

export const { Context: DrawerContext, useCompoundContext: useDrawerContext } =
  createCompoundContext<any>('Drawer')

export const { Context: SheetContext, useCompoundContext: useSheetContext } =
  createCompoundContext<any>('Sheet')
