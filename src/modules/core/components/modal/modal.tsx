import React from 'react'
import {
  Modal as RACModal,
  type ModalOverlayProps as RACModalOverlayProps,
  ModalOverlay as RACModalOverlay,
  Dialog as RACDialog,
  type DialogProps as RACDialogProps,
  type DialogTriggerProps as RACDialogTriggerProps,
  Heading as RACHeading,
  type HeadingProps as RACHeadingProps,
} from 'react-aria-components'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { OverlayTrigger } from '../../../../core/overlay-trigger'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { XMarkIcon } from '@heroicons/react/24/outline'

/* ==========================================================================
   Modal Overlay & Content Styles
   ========================================================================== */

export const modalOverlayStyles = tv({
  base: [
    'fixed inset-0 z-50 flex items-center justify-center p-space-lg sm:p-space-xl overflow-y-auto',
    'bg-black/60 backdrop-blur-sm transition-all duration-200',
    'data-[entering]:animate-in data-[entering]:fade-in-0',
    'data-[exiting]:animate-out data-[exiting]:fade-out-0',
  ],
  variants: {
    blur: {
      none: 'backdrop-blur-none bg-black/70',
      sm: 'backdrop-blur-xs bg-black/60',
      md: 'backdrop-blur-sm bg-black/65',
      lg: 'backdrop-blur-md bg-black/75',
    },
  },
  defaultVariants: {
    blur: 'md',
  },
})

export const modalContentStyles = tv({
  base: [
    'relative w-full max-h-[90vh] overflow-hidden flex flex-col',
    'border border-border/80 bg-overlay/95 backdrop-blur-xl text-fg rounded-macro shadow-2xl outline-none',
    'transition-all duration-200',
    'data-[entering]:animate-in data-[entering]:fade-in-0 data-[entering]:zoom-in-95 data-[entering]:slide-in-from-bottom-2',
    'data-[exiting]:animate-out data-[exiting]:fade-out-0 data-[exiting]:zoom-out-95 data-[exiting]:slide-out-to-bottom-2',
  ],
  variants: {
    size: {
      xs: 'max-w-xs',
      sm: 'max-w-sm',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      fullscreen: 'max-w-[96vw] h-[94vh] max-h-[94vh] rounded-macro',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

/* ==========================================================================
   Modal Slots & State
   ========================================================================== */

export interface ModalSlotState {
  /** Whether the modal is currently entering */
  isEntering?: boolean
  /** Whether the modal is currently exiting */
  isExiting?: boolean
  /** Dismissal function callback */
  close?: () => void
}

export interface ModalSlots {
  /** Top header slot */
  header?: React.ComponentType<ModalHeaderProps>
  /** Bottom action footer slot */
  footer?: React.ComponentType<ModalFooterProps>
  /** Close dismissal button slot */
  closeButton?: React.ComponentType<ModalCloseButtonProps>
}

/* ==========================================================================
   Modal Root Primitive & Factory
   ========================================================================== */

export interface ModalProps
  extends Omit<RACModalOverlayProps, 'children'>,
    VariantProps<typeof modalContentStyles>,
    VariantProps<typeof modalOverlayStyles> {
  /** Size ramp token controlling modal maximum width: xs, sm, md, lg, xl, fullscreen. */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen'
  /** Backdrop blur intensity: none, sm, md, lg. */
  blur?: 'none' | 'sm' | 'md' | 'lg'
  /** Whether clicking outside the modal content dismisses the dialog. */
  isDismissable?: boolean
  /** Show the default close button in the top right corner. */
  showCloseButton?: boolean
  /** Custom CSS classes on the modal dialog container. */
  contentClassName?: string
  /** Slot component overrides. */
  slots?: SlotComponents<ModalSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<ModalSlots>
  /** Content children or render function with close trigger. */
  children?: React.ReactNode | ((opts: { close: () => void }) => React.ReactNode)
}

const ModalPrimitive = ({
  className,
  contentClassName,
  size = 'md',
  blur = 'md',
  isDismissable = true,
  showCloseButton = true,
  slots = {},
  slotProps = {},
  children,
  ...props
}: ModalProps) => {
  return (
    <RACModalOverlay
      isDismissable={isDismissable}
      data-slot="modal-overlay"
      className={(values) =>
        cn(
          modalOverlayStyles({ blur }),
          typeof className === 'function' ? (className as any)(values) : className
        )
      }
      {...props}
    >
      <RACModal
        data-slot="modal-content"
        className={(values) =>
          cn(
            modalContentStyles({ size }),
            typeof contentClassName === 'function' ? (contentClassName as any)(values) : contentClassName
          )
        }
      >
        <RACDialog className="outline-none focus:outline-none flex flex-col max-h-full overflow-hidden flex-1">
          {({ close }) => {
            return (
              <>
                {showCloseButton &&
                  renderSlot(
                    slots?.closeButton,
                    { onClose: close, ...(slotProps?.closeButton as object) },
                    { defaultComponent: ModalCloseButton }
                  )}
                {renderSlot(slots?.header, slotProps?.header as object)}
                {typeof children === 'function' ? children({ close }) : children}
                {renderSlot(slots?.footer, slotProps?.footer as object)}
              </>
            )
          }}
        </RACDialog>
      </RACModal>
    </RACModalOverlay>
  )
}

export const Modal = createInterfaceComponent<ModalProps, ModalSlots>(
  {
    name: 'Modal',
    category: 'overlay',
    description: 'Accessible modal dialog system with concentric optical geometry, focus trapping, backdrop blur, and size ramps.',
    version: '1.0.0',
    props: {
      size: 'md',
      blur: 'md',
      isDismissable: true,
      showCloseButton: true,
    },
    slots: {
      header: undefined,
      footer: undefined,
      closeButton: undefined,
    },
  },
  ModalPrimitive
)

/* ==========================================================================
   Modal Sub-Atoms
   ========================================================================== */

export interface ModalTriggerProps extends RACDialogTriggerProps {}

const ModalTriggerPrimitive = (props: ModalTriggerProps) => {
  return <OverlayTrigger data-slot="modal-trigger" {...props} />
}

export const ModalTrigger = createInterfaceComponent<ModalTriggerProps>(
  {
    name: 'ModalTrigger',
    category: 'overlay',
    description: 'Trigger wrapper connecting activator buttons to modal open state.',
    version: '1.0.0',
  },
  ModalTriggerPrimitive
)

export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Title text displayed in header. */
  title?: string
  /** Subtitle or description text. */
  description?: string
}

const ModalHeaderPrimitive = ({
  className,
  title,
  description,
  children,
  ...props
}: ModalHeaderProps) => {
  return (
    <div
      data-slot="modal-header"
      className={cn('px-space-xl py-5 border-b border-border/70 flex flex-col gap-1.5 shrink-0 pr-space-3xl', className)}
      {...props}
    >
      {title && <ModalTitle>{title}</ModalTitle>}
      {description && <ModalDescription>{description}</ModalDescription>}
      {children}
    </div>
  )
}

export const ModalHeader = createInterfaceComponent<ModalHeaderProps>(
  {
    name: 'ModalHeader',
    category: 'overlay',
    description: 'Structured top header container for modal titles and descriptions.',
    version: '1.0.0',
  },
  ModalHeaderPrimitive
)

export interface ModalTitleProps extends RACHeadingProps {}

const ModalTitlePrimitive = ({ className, ...props }: ModalTitleProps) => {
  return (
    <RACHeading
      slot="title"
      data-slot="modal-title"
      className={cn('text-lg sm:text-xl font-bold text-fg tracking-tight leading-snug', className)}
      {...props}
    />
  )
}

export const ModalTitle = createInterfaceComponent<ModalTitleProps>(
  {
    name: 'ModalTitle',
    category: 'overlay',
    description: 'Accessible heading for modal dialogs with automatic ARIA association.',
    version: '1.0.0',
  },
  ModalTitlePrimitive
)

export interface ModalDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const ModalDescriptionPrimitive = ({ className, ...props }: ModalDescriptionProps) => {
  return (
    <p
      data-slot="modal-description"
      className={cn('text-xs sm:text-sm text-muted-fg leading-relaxed', className)}
      {...props}
    />
  )
}

export const ModalDescription = createInterfaceComponent<ModalDescriptionProps>(
  {
    name: 'ModalDescription',
    category: 'overlay',
    description: 'Supporting description text for modal dialogs.',
    version: '1.0.0',
  },
  ModalDescriptionPrimitive
)

export interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

const ModalBodyPrimitive = ({ className, ...props }: ModalBodyProps) => {
  return (
    <div
      data-slot="modal-body"
      className={cn('px-space-xl py-5 overflow-y-auto flex-1 text-sm text-fg leading-relaxed', className)}
      {...props}
    />
  )
}

export const ModalBody = createInterfaceComponent<ModalBodyProps>(
  {
    name: 'ModalBody',
    category: 'overlay',
    description: 'Scrollable content body section for modal dialogs.',
    version: '1.0.0',
  },
  ModalBodyPrimitive
)

export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const ModalFooterPrimitive = ({ className, ...props }: ModalFooterProps) => {
  return (
    <div
      data-slot="modal-footer"
      className={cn(
        'px-space-xl py-space-lg border-t border-border/70 bg-muted/30 flex items-center justify-end gap-space-md shrink-0',
        className
      )}
      {...props}
    />
  )
}

export const ModalFooter = createInterfaceComponent<ModalFooterProps>(
  {
    name: 'ModalFooter',
    category: 'overlay',
    description: 'Action footer container for modal dialogs.',
    version: '1.0.0',
  },
  ModalFooterPrimitive
)

export interface ModalCloseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** onClose */
  onClose?: () => void
}

const ModalCloseButtonPrimitive = ({
  className,
  onClose,
  ...props
}: ModalCloseButtonProps) => {
  return (
    <button
      type="button"
      data-slot="modal-close"
      onClick={onClose}
      className={cn(
        'absolute top-4 right-4 z-10 p-1.5 rounded-base text-muted-fg hover:text-fg hover:bg-secondary transition-colors cursor-pointer border border-transparent hover:border-border/60',
        className
      )}
      aria-label="Close dialog"
      {...props}
    >
      <XMarkIcon className="size-5" />
    </button>
  )
}

export const ModalCloseButton = createInterfaceComponent<ModalCloseButtonProps>(
  {
    name: 'ModalCloseButton',
    category: 'overlay',
    description: 'Dismissal button closing the active modal.',
    version: '1.0.0',
  },
  ModalCloseButtonPrimitive
)

// Aliases & Compound Attachments
export const Dialog = Modal
export const DialogTrigger = ModalTrigger
export const DialogHeader = ModalHeader
export const DialogTitle = ModalTitle
export const DialogDescription = ModalDescription
export const DialogBody = ModalBody
export const DialogFooter = ModalFooter
export const DialogClose = ModalCloseButton

Modal.Trigger = ModalTrigger
Modal.Header = ModalHeader
Modal.Title = ModalTitle
Modal.Description = ModalDescription
Modal.Body = ModalBody
Modal.Footer = ModalFooter
Modal.Close = ModalCloseButton
Modal.CloseButton = ModalCloseButton

Dialog.Trigger = DialogTrigger
Dialog.Header = DialogHeader
Dialog.Title = DialogTitle
Dialog.Description = DialogDescription
Dialog.Body = DialogBody
Dialog.Footer = DialogFooter
Dialog.Close = DialogClose

export const { Context: ModalContext, useCompoundContext: useModalContext } =
  createCompoundContext<any>('Modal')

export const { Context: DialogContext, useCompoundContext: useDialogContext } =
  createCompoundContext<any>('Dialog')
