import React, { use } from 'react'
import { AnimatePresence, motion } from 'motion/react'
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
   Framer Motion wrappers
   ========================================================================== */

const DrawerMotionOverlay = motion.create(RACModalOverlay)
const DrawerMotionModal = motion.create(RACModal)

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

  const sideClass = {
    top: isFloat ? 'inset-x-2 top-2 rounded-macro' : 'inset-x-0 top-0 rounded-b-macro',
    bottom: isFloat ? 'inset-x-2 bottom-2 rounded-macro' : 'inset-x-0 bottom-0 rounded-t-macro',
    left: [
      'w-full max-w-xs overflow-y-auto',
      isFloat ? 'inset-y-2 left-2 rounded-macro' : 'inset-y-0 left-0 h-auto',
    ].join(' '),
    right: [
      'w-full max-w-xs overflow-y-auto',
      isFloat ? 'inset-y-2 right-2 rounded-macro' : 'inset-y-0 right-0 h-auto',
    ].join(' '),
  }[side]

  const initialMotion = {
    x: side === 'left' ? '-100%' : side === 'right' ? '100%' : 0,
    y: side === 'top' ? '-100%' : side === 'bottom' ? '100%' : 0,
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <DrawerMotionOverlay
          isDismissable
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          initial={{ backgroundColor: 'rgba(0, 0, 0, 0)', backdropFilter: 'blur(0px)' }}
          animate={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(1px)' }}
          exit={{ backgroundColor: 'rgba(0, 0, 0, 0)', backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.15, ease: 'easeInOut' }}
          className={cn(
            'fixed inset-0 z-50 will-change-auto [--visual-viewport-vertical-padding:32px]',
            'motion-reduce:backdrop-blur-none',
            overlay?.className
          )}
        >
          {({ state: overlayState }) => (
            <DrawerMotionModal
              data-slot="drawer-surface"
              className={cn(
                'fixed max-h-full touch-none overflow-hidden bg-overlay text-fg shadow-2xl',
                'border border-border/40 will-change-transform',
                sideClass,
                className
              )}
              animate={{ x: 0, y: 0 }}
              initial={initialMotion}
              exit={initialMotion}
              drag={side === 'left' || side === 'right' ? 'x' : 'y'}
              whileDrag={{ cursor: 'grabbing' }}
              dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
              dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
              onDragEnd={(_, { offset, velocity }) => {
                if (side === 'bottom' && (velocity.y > 150 || offset.y > screen.height * 0.25)) {
                  overlayState.close()
                }
                if (side === 'top' && (velocity.y < -150 || offset.y < screen.height * 0.25)) {
                  overlayState.close()
                }
                if (side === 'left' && velocity.x < -150) {
                  overlayState.close()
                }
                if (side === 'right' && velocity.x > 150) {
                  overlayState.close()
                }
              }}
              dragElastic={{
                top: side === 'top' ? 1 : 0,
                bottom: side === 'bottom' ? 1 : 0,
                left: side === 'left' ? 1 : 0,
                right: side === 'right' ? 1 : 0,
              }}
              dragPropagation
            >
              <RACDialog
                aria-label="Drawer"
                role="dialog"
                className={cn(
                  'relative flex flex-col overflow-hidden outline-hidden will-change-auto',
                  side === 'top' || side === 'bottom'
                    ? 'mx-auto max-h-[calc(var(--visual-viewport-height,100dvh)-var(--visual-viewport-vertical-padding))] max-w-lg'
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
            </DrawerMotionModal>
          )}
        </DrawerMotionOverlay>
      )}
    </AnimatePresence>
  )
}

export const DrawerContent = createInterfaceComponent<DrawerContentProps, DrawerSlots>(
  {
    name: 'DrawerContent',
    category: 'overlay',
    description: 'Animated slide-in drawer surface with gesture drag dismissal, backdrop blur, and optical radius.',
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
      'isolate flex max-h-[calc(var(--visual-viewport-height,100dvh)-var(--visual-viewport-vertical-padding))] flex-col overflow-auto px-space-lg py-space-xs will-change-scroll',
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
