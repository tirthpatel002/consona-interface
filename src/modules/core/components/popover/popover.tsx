import React from 'react'
import {
  Popover as RACPopover,
  PopoverContext as RACPopoverContext,
  type PopoverProps as RACPopoverProps,
  Dialog as RACDialog,
  type DialogProps as RACDialogProps,
  type DialogTriggerProps as RACDialogTriggerProps,
  OverlayArrow as RACOverlayArrow,
  type OverlayArrowProps as RACOverlayArrowProps,
  Heading as RACHeading,
  OverlayTriggerStateContext,
} from 'react-aria-components'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import {
  OverlayTrigger,
  useOverlayDismiss,
  useOverlayTriggerClose,
} from '../../../../core/overlay-trigger'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { XMarkIcon } from '@heroicons/react/20/solid'

/* ==========================================================================
   Popover Styles & Ramps
   ========================================================================== */

export const popoverStyles = tv({
  base: [
    'group z-50 min-w-48 outline-none border border-border/80 bg-overlay/95 text-fg backdrop-blur-md shadow-xl',
    // Surface + content animate as one element (see .consona-overlay-motion in theme/styles.css).
    'consona-overlay-motion',
  ],
  variants: {
    size: {
      sm: 'p-space-md max-w-xs text-xs rounded-base',
      md: 'p-space-lg max-w-sm text-sm rounded-macro',
      lg: 'p-5 max-w-md text-base rounded-macro',
      auto: 'rounded-macro',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

/* ==========================================================================
   Popover Context & State Definitions
   ========================================================================== */

export interface PopoverContextValue {
  size?: 'sm' | 'md' | 'lg' | 'auto'
  showArrow?: boolean
}

export const {
  Provider: PopoverProvider,
  useCompoundContext: usePopoverContext,
  useOptionalCompoundContext: useOptionalPopoverContext,
  Context: PopoverContext,
} = createCompoundContext<PopoverContextValue>({
  name: 'Popover',
})

/* ==========================================================================
   Popover Slot & State Definitions
   ========================================================================== */

export interface PopoverSlots {
  /** Floating overlay arrow indicator slot. */
  arrow?: React.ComponentType<PopoverArrowProps>
  /** Top header slot inside the popover dialog. */
  header?: React.ComponentType<PopoverHeaderProps>
  /** Bottom footer slot with action buttons. */
  footer?: React.ComponentType<PopoverFooterProps>
}

/* ==========================================================================
   Popover Root Primitive & Factory
   ========================================================================== */

export interface PopoverProps
  extends Omit<RACPopoverProps, 'children'>,
    VariantProps<typeof popoverStyles> {
  /** Size token scaling dimensions and optical curvature: sm, md, lg, auto. */
  size?: 'sm' | 'md' | 'lg' | 'auto'
  /** Show the default pointing arrow indicator. */
  showArrow?: boolean
  /** Additional CSS class names or render function. */
  className?: string | ((values: any) => string)
  /** Slot component overrides. */
  slots?: SlotComponents<PopoverSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<PopoverSlots>
  /** Popover dialog content or render function. */
  children?: React.ReactNode | ((opts: { close: () => void }) => React.ReactNode)
}

const PopoverPrimitive = ({
  className,
  size = 'md',
  showArrow = false,
  offset = 8,
  isNonModal = false,
  slots = {},
  slotProps = {},
  children,
  ...props
}: PopoverProps) => {
  const state = React.useContext(OverlayTriggerStateContext) as any
  const close = state?.close ?? useOverlayTriggerClose()
  const overlayRef = React.useRef<HTMLElement>(null)
  const racPopoverContext = React.useContext(RACPopoverContext)
  const triggerRef =
    racPopoverContext && !Array.isArray(racPopoverContext)
      ? (racPopoverContext as { triggerRef?: React.RefObject<Element | null> }).triggerRef
      : undefined

  useOverlayDismiss({
    enabled: Boolean(state?.isOpen),
    onClose: () => close?.(),
    overlayRef,
    triggerRef,
    containNested: true,
  })

  return (
    <PopoverProvider value={{ size, showArrow }}>
      <RACPopover
        ref={overlayRef}
        offset={offset}
        isNonModal={isNonModal}
        data-slot="popover"
        data-size={size}
        className={(values) =>
          cn(
            popoverStyles({ size }),
            typeof className === 'function' ? (className as any)(values) : className
          )
        }
        {...props}
      >
        {() => {
          return (
            <>
              {showArrow &&
                renderSlot(slots?.arrow, slotProps?.arrow as object, {
                  defaultComponent: PopoverArrow,
                })}
              <RACDialog
                aria-label={props['aria-label'] ?? (props['aria-labelledby'] ? undefined : 'Popover')}
                aria-labelledby={props['aria-labelledby']}
                className="outline-none focus:outline-none"
              >
                {({ close }) => (
                  <>
                    {renderSlot(slots?.header, slotProps?.header as object)}
                    {typeof children === 'function'
                      ? children({ close })
                      : children}
                    {renderSlot(slots?.footer, slotProps?.footer as object)}
                  </>
                )}
              </RACDialog>
            </>
          )
        }}
      </RACPopover>
    </PopoverProvider>
  )
}

export const Popover = createInterfaceComponent<PopoverProps, PopoverSlots>(
  {
    name: 'Popover',
    category: 'overlay',
    description: 'Anchor-positioned floating container with optical geometry, dialog semantics, and animated placement ramps.',
    version: '1.0.0',
    props: {
      size: 'md',
      showArrow: false,
      offset: 8,
      isNonModal: false,
    },
    slots: {
      arrow: undefined,
      header: undefined,
      footer: undefined,
    },
  },
  PopoverPrimitive
)

/* ==========================================================================
   Popover Sub-Atoms
   ========================================================================== */

export interface PopoverTriggerProps extends RACDialogTriggerProps {}

const PopoverTriggerPrimitive = (props: PopoverTriggerProps) => {
  return <OverlayTrigger data-slot="popover-trigger" {...props} />
}

export const PopoverTrigger = createInterfaceComponent<PopoverTriggerProps>(
  {
    name: 'PopoverTrigger',
    category: 'overlay',
    description: 'Anchor wrapper coordinating popover open state with target trigger.',
    version: '1.0.0',
  },
  PopoverTriggerPrimitive
)

export interface PopoverArrowProps extends RACOverlayArrowProps {
  /** className */
  className?: string
}

const PopoverArrowPrimitive = ({ className, ...props }: PopoverArrowProps) => {
  return (
    <RACOverlayArrow
      data-slot="popover-arrow"
      className={cn('group/arrow', className)}
      {...props}
    >
      <svg
        width={12}
        height={12}
        viewBox="0 0 12 12"
        className={cn(
          'block fill-overlay stroke-border/80 transition-colors',
          'group-data-[placement=bottom]/arrow:rotate-180 group-data-[placement=left]/arrow:-rotate-90 group-data-[placement=right]/arrow:rotate-90',
          'group-data-[placement=bottom]:rotate-180 group-data-[placement=left]:-rotate-90 group-data-[placement=right]:rotate-90'
        )}
      >
        <path d="M0 0 L6 6 L12 0" />
      </svg>
    </RACOverlayArrow>
  )
}

export const PopoverArrow = createInterfaceComponent<PopoverArrowProps>(
  {
    name: 'PopoverArrow',
    category: 'overlay',
    description: 'Pointing arrow indicator connecting popover container to anchor target.',
    version: '1.0.0',
  },
  PopoverArrowPrimitive
)

export interface PopoverHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional title text. */
  title?: string
  /** Optional subtitle/description text. */
  description?: string
}

const PopoverHeaderPrimitive = ({
  className,
  title,
  description,
  children,
  ...props
}: PopoverHeaderProps) => {
  return (
    <div
      data-slot="popover-header"
      className={cn('mb-space-md flex flex-col gap-space-xs', className)}
      {...props}
    >
      {title && (
        <RACHeading
          slot="title"
          data-slot="popover-title"
          className="text-sm font-bold text-fg tracking-tight"
        >
          {title}
        </RACHeading>
      )}
      {description && (
        <p className="text-xs text-muted-fg leading-relaxed">{description}</p>
      )}
      {children}
    </div>
  )
}

export const PopoverHeader = createInterfaceComponent<PopoverHeaderProps>(
  {
    name: 'PopoverHeader',
    category: 'overlay',
    description: 'Structured header section for popover content.',
    version: '1.0.0',
  },
  PopoverHeaderPrimitive
)

export interface PopoverTitleProps extends React.ComponentPropsWithoutRef<typeof RACHeading> {}

const PopoverTitlePrimitive = ({ className, ...props }: PopoverTitleProps) => {
  return (
    <RACHeading
      slot="title"
      data-slot="popover-title"
      className={cn('text-sm font-bold text-fg tracking-tight', className)}
      {...props}
    />
  )
}

export const PopoverTitle = createInterfaceComponent<PopoverTitleProps>(
  {
    name: 'PopoverTitle',
    category: 'overlay',
    description: 'Accessible title heading for popover content.',
    version: '1.0.0',
  },
  PopoverTitlePrimitive
)

export interface PopoverDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const PopoverDescriptionPrimitive = ({ className, ...props }: PopoverDescriptionProps) => {
  return (
    <p
      data-slot="popover-description"
      className={cn('text-xs text-muted-fg leading-relaxed', className)}
      {...props}
    />
  )
}

export const PopoverDescription = createInterfaceComponent<PopoverDescriptionProps>(
  {
    name: 'PopoverDescription',
    category: 'overlay',
    description: 'Supporting description text for popover dialogs.',
    version: '1.0.0',
  },
  PopoverDescriptionPrimitive
)

export interface PopoverFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const PopoverFooterPrimitive = ({ className, ...props }: PopoverFooterProps) => {
  return (
    <div
      data-slot="popover-footer"
      className={cn('mt-space-lg pt-space-md border-t border-border/60 flex items-center justify-end gap-space-sm', className)}
      {...props}
    />
  )
}

export const PopoverFooter = createInterfaceComponent<PopoverFooterProps>(
  {
    name: 'PopoverFooter',
    category: 'overlay',
    description: 'Structured action footer for popover dialogs.',
    version: '1.0.0',
  },
  PopoverFooterPrimitive
)

export interface PopoverCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** onClose */
  onClose?: () => void
}

const PopoverClosePrimitive = ({ className, onClose, ...props }: PopoverCloseProps) => {
  const state = React.useContext(OverlayTriggerStateContext) as any
  const close = state?.close ?? useOverlayTriggerClose()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    props.onClick?.(e)
    if (!e.defaultPrevented) {
      if (onClose) {
        onClose()
      } else {
        close?.()
      }
    }
  }

  return (
    <button
      type="button"
      data-slot="popover-close"
      onClick={handleClick}
      className={cn(
        'absolute top-3 right-3 p-space-xs rounded-micro text-muted-fg hover:text-fg hover:bg-secondary transition-colors cursor-pointer',
        className
      )}
      aria-label="Close popover"
      {...props}
    >
      <XMarkIcon className="size-4" />
    </button>
  )
}

export const PopoverClose = createInterfaceComponent<PopoverCloseProps>(
  {
    name: 'PopoverClose',
    category: 'overlay',
    description: 'Dismissal button closing the active popover.',
    version: '1.0.0',
  },
  PopoverClosePrimitive
)

// Namespace attachments for compound family ergonomics
Popover.Trigger = PopoverTrigger
Popover.Arrow = PopoverArrow
Popover.Header = PopoverHeader
Popover.Title = PopoverTitle
Popover.Description = PopoverDescription
Popover.Footer = PopoverFooter
Popover.Close = PopoverClose
