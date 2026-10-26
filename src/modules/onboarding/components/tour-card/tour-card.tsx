import React from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import type { CalculatedPosition } from '../../engine/types'

/* ==========================================================================
   TourCard Slot Definitions
   ========================================================================== */

export interface TourCardSlots {
  /** Pointer arrow indicator slot. */
  arrow?: React.ComponentType<{ placement?: string; style?: React.CSSProperties }>
  /** Header slot */
  header?: React.ComponentType<TourCardHeaderProps>
  /** Body slot */
  body?: React.ComponentType<TourCardBodyProps>
  /** Footer slot */
  footer?: React.ComponentType<TourCardFooterProps>
}

/* ==========================================================================
   TourCard Props
   ========================================================================== */

export interface TourCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Calculated floating positioning and arrow anchor metrics. */
  position?: CalculatedPosition
  /** Whether to show the pointer arrow. */
  showArrow?: boolean
  /** Children content. */
  children?: React.ReactNode
  /** Custom slot components. */
  slots?: SlotComponents<TourCardSlots>
  /** Custom slot props map. */
  slotProps?: SlotPropsMap<TourCardSlots>
}

const TourCardPrimitive = ({
  position,
  showArrow = true,
  className,
  style,
  children,
  slots,
  slotProps,
  ...props
}: TourCardProps) => {
  const arrowPlacement = position?.arrowPlacement
  const arrowX = position?.arrowX
  const arrowY = position?.arrowY

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-slot="tour-card"
      className={cn(
        'relative flex flex-col w-87.5 max-w-[calc(100vw-28px)] sm:max-w-sm',
        'rounded-macro border border-border/80 bg-card text-card-fg shadow-2xl backdrop-blur-xl',
        'outline-hidden p-space-md sm:p-space-lg',
        'animate-in fade-in-0 zoom-in-95 duration-200 ease-out',
        className
      )}
      style={{
        ...style,
      }}
      {...props}
    >
      {/* Precision SVG Pointer Arrow */}
      {showArrow && arrowPlacement && position?.placement !== 'center' && (
        <div
          data-slot="tour-card-arrow"
          className={cn(
            'absolute pointer-events-none z-20 flex items-center justify-center',
            arrowPlacement === 'top' && '-top-2 left-0 right-0 h-2',
            arrowPlacement === 'bottom' && '-bottom-2 left-0 right-0 h-2',
            arrowPlacement === 'left' && '-left-2 top-0 bottom-0 w-2',
            arrowPlacement === 'right' && '-right-2 top-0 bottom-0 w-2'
          )}
          style={{
            ...(arrowPlacement === 'top' || arrowPlacement === 'bottom'
              ? { left: arrowX !== undefined ? `${arrowX}px` : '50%', right: 'auto', transform: 'translateX(-50%)' }
              : { top: arrowY !== undefined ? `${arrowY}px` : '50%', bottom: 'auto', transform: 'translateY(-50%)' }),
          }}
        >
          {slots?.arrow ? (
            renderSlot(slots.arrow, { placement: arrowPlacement, ...(slotProps?.arrow as any) })
          ) : (
            <svg
              className={cn(
                'overflow-visible text-card fill-current drop-shadow-[0_1px_1px_rgba(0,0,0,0.05)]',
                arrowPlacement === 'top' && 'w-3.5 h-2',
                arrowPlacement === 'bottom' && 'w-3.5 h-2 rotate-180',
                arrowPlacement === 'left' && 'w-2 h-3.5 -rotate-90',
                arrowPlacement === 'right' && 'w-2 h-3.5 rotate-90'
              )}
              viewBox="0 0 14 8"
            >
              <path
                d="M0 8 L6.14 0.95 C6.6 0.42 7.4 0.42 7.86 0.95 L14 8 Z"
                className="stroke-border/90"
                strokeWidth="1"
              />
            </svg>
          )}
        </div>
      )}

      {children ?? (
        <>
          {slots?.header && renderSlot(slots.header, slotProps?.header, { defaultComponent: TourCardHeader })}
          {slots?.body && renderSlot(slots.body, slotProps?.body, { defaultComponent: TourCardBody })}
          {slots?.footer && renderSlot(slots.footer, slotProps?.footer, { defaultComponent: TourCardFooter })}
        </>
      )}
    </div>
  )
}

export const TourCard = createInterfaceComponent<TourCardProps, TourCardSlots>(
  {
    name: 'TourCard',
    category: 'onboarding',
    description: 'Floating modal card container for step-by-step onboarding walkthroughs.',
    version: '1.0.0',
    props: {
      showArrow: true,
    },
    slots: {
      arrow: undefined,
      header: undefined,
      body: undefined,
      footer: undefined,
    },
  },
  TourCardPrimitive
)

/* ==========================================================================
   TourCard Sub-Components
   ========================================================================== */

export interface TourCardHeaderSlots {
  /** Title heading slot */
  title?: React.ComponentType<TourCardTitleProps>
  /** Description paragraph slot */
  description?: React.ComponentType<TourCardDescriptionProps>
}

export interface TourCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  slots?: SlotComponents<TourCardHeaderSlots>
  slotProps?: SlotPropsMap<TourCardHeaderSlots>
}

const TourCardHeaderPrimitive = ({ className, children, slots, slotProps, ...props }: TourCardHeaderProps) => (
  <div
    data-slot="tour-card-header"
    className={cn('flex items-start justify-between gap-3 pb-2 border-b border-border/40', className)}
    {...props}
  >
    {children ?? (
      <div className="flex flex-col gap-1">
        {slots?.title && renderSlot(slots.title, slotProps?.title, { defaultComponent: TourCardTitle })}
        {slots?.description && renderSlot(slots.description, slotProps?.description, { defaultComponent: TourCardDescription })}
      </div>
    )}
  </div>
)

export const TourCardHeader = createInterfaceComponent<TourCardHeaderProps, TourCardHeaderSlots>(
  {
    name: 'TourCardHeader',
    category: 'onboarding',
    description: 'Header container of a tour card containing title and close actions.',
    version: '1.0.0',
    slots: {
      title: undefined,
      description: undefined,
    },
  },
  TourCardHeaderPrimitive
)

export interface TourCardTitleSlots {}

export interface TourCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  slots?: SlotComponents<TourCardTitleSlots>
  slotProps?: SlotPropsMap<TourCardTitleSlots>
}

const TourCardTitlePrimitive = ({ className, children, ...props }: TourCardTitleProps) => (
  <h3
    data-slot="tour-card-title"
    className={cn('text-sm font-semibold text-fg tracking-tight m-0 flex items-center gap-2', className)}
    {...props}
  >
    {children}
  </h3>
)

export const TourCardTitle = createInterfaceComponent<TourCardTitleProps, TourCardTitleSlots>(
  {
    name: 'TourCardTitle',
    category: 'onboarding',
    description: 'Title heading for the active tour step.',
    version: '1.0.0',
    slots: {

    },
  },
  TourCardTitlePrimitive
)

export interface TourCardDescriptionSlots {}

export interface TourCardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  slots?: SlotComponents<TourCardDescriptionSlots>
  slotProps?: SlotPropsMap<TourCardDescriptionSlots>
}

const TourCardDescriptionPrimitive = ({ className, children, ...props }: TourCardDescriptionProps) => (
  <p
    data-slot="tour-card-description"
    className={cn('text-xs text-muted-fg leading-relaxed m-0 mt-1', className)}
    {...props}
  >
    {children}
  </p>
)

export const TourCardDescription = createInterfaceComponent<TourCardDescriptionProps, TourCardDescriptionSlots>(
  {
    name: 'TourCardDescription',
    category: 'onboarding',
    description: 'Description paragraph text explaining the highlighted feature.',
    version: '1.0.0',
    slots: {

    },
  },
  TourCardDescriptionPrimitive
)

export interface TourCardBodySlots {
  /** Description paragraph slot */
  description?: React.ComponentType<TourCardDescriptionProps>
}

export interface TourCardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  slots?: SlotComponents<TourCardBodySlots>
  slotProps?: SlotPropsMap<TourCardBodySlots>
}

const TourCardBodyPrimitive = ({ className, children, slots, slotProps, ...props }: TourCardBodyProps) => (
  <div
    data-slot="tour-card-body"
    className={cn('py-3 text-xs leading-relaxed text-fg/90', className)}
    {...props}
  >
    {children ?? (slots?.description && renderSlot(slots.description, slotProps?.description, { defaultComponent: TourCardDescription }))}
  </div>
)

export const TourCardBody = createInterfaceComponent<TourCardBodyProps, TourCardBodySlots>(
  {
    name: 'TourCardBody',
    category: 'onboarding',
    description: 'Main body content wrapper inside a tour card.',
    version: '1.0.0',
    slots: {
      description: undefined,
    },
  },
  TourCardBodyPrimitive
)

export interface TourCardFooterSlots {
  /** Step dots indicator slot */
  dots?: React.ComponentType<TourCardDotsProps>
  /** Step progress bar slot */
  progress?: React.ComponentType<TourCardProgressProps>
}

export interface TourCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  slots?: SlotComponents<TourCardFooterSlots>
  slotProps?: SlotPropsMap<TourCardFooterSlots>
}

const TourCardFooterPrimitive = ({ className, children, slots, slotProps, ...props }: TourCardFooterProps) => (
  <div
    data-slot="tour-card-footer"
    className={cn(
      'flex items-center justify-between gap-2 pt-3 mt-1 border-t border-border/40',
      className
    )}
    {...props}
  >
    {children ?? (
      <>
        {slots?.dots && renderSlot(slots.dots, slotProps?.dots, { defaultComponent: TourCardDots })}
        {slots?.progress && renderSlot(slots.progress, slotProps?.progress, { defaultComponent: TourCardProgress })}
      </>
    )}
  </div>
)

export const TourCardFooter = createInterfaceComponent<TourCardFooterProps, TourCardFooterSlots>(
  {
    name: 'TourCardFooter',
    category: 'onboarding',
    description: 'Footer container for tour progression controls and action buttons.',
    version: '1.0.0',
    slots: {
      dots: undefined,
      progress: undefined,
    },
  },
  TourCardFooterPrimitive
)

export interface TourCardDotsSlots {}

export interface TourCardDotsProps {
  /** Total number of steps. */
  total: number
  /** Current 0-based active step index. */
  current: number
  /** Step change callback when a dot indicator is clicked. */
  onChange?: (index: number) => void
  /** Custom class name. */
  className?: string
  slots?: SlotComponents<TourCardDotsSlots>
  slotProps?: SlotPropsMap<TourCardDotsSlots>
}

const TourCardDotsPrimitive = ({ total, current, onChange, className }: TourCardDotsProps) => (
  <div data-slot="tour-card-dots" className={cn('flex items-center gap-1.5', className)}>
    {Array.from({ length: total }).map((_, idx) => (
      <button
        key={idx}
        type="button"
        aria-label={`Go to step ${idx + 1}`}
        onClick={() => onChange?.(idx)}
        className={cn(
          'h-1.5 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary',
          idx === current
            ? 'w-4 bg-primary'
            : 'w-1.5 bg-muted-fg/30 hover:bg-muted-fg/60 cursor-pointer'
        )}
      />
    ))}
  </div>
)

export const TourCardDots = createInterfaceComponent<TourCardDotsProps, TourCardDotsSlots>(
  {
    name: 'TourCardDots',
    category: 'onboarding',
    description: 'Dot step indicator for navigating between walkthrough steps.',
    version: '1.0.0',
    slots: {

    },
  },
  TourCardDotsPrimitive
)

export interface TourCardProgressSlots {}

export interface TourCardProgressProps {
  /** Current 0-based step index. */
  current: number
  /** Total number of steps. */
  total: number
  /** Progress format: fraction (e.g. 1 / 4) or bar. */
  variant?: 'fraction' | 'bar'
  /** Custom class name. */
  className?: string
  slots?: SlotComponents<TourCardProgressSlots>
  slotProps?: SlotPropsMap<TourCardProgressSlots>
}

const TourCardProgressPrimitive = ({
  current,
  total,
  variant = 'fraction',
  className,
}: TourCardProgressProps) => {
  if (variant === 'bar') {
    const percentage = total > 0 ? ((current + 1) / (total || 1)) * 100 : 0
    return (
      <div
        data-slot="tour-card-progress-bar"
        className={cn('w-20 h-1.5 bg-muted rounded-full overflow-hidden', className)}
      >
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }

  return (
    <span
      data-slot="tour-card-progress-fraction"
      className={cn('text-[11px] font-mono font-medium text-muted-fg select-none', className)}
    >
      {current + 1} / {total}
    </span>
  )
}

export const TourCardProgress = createInterfaceComponent<TourCardProgressProps, TourCardProgressSlots>(
  {
    name: 'TourCardProgress',
    category: 'onboarding',
    description: 'Fractional or progress bar step indicator.',
    version: '1.0.0',
    props: {
      variant: 'fraction',
    },
    slots: {

    },
  },
  TourCardProgressPrimitive
)

// Compound Attachments
TourCard.Header = TourCardHeader
TourCard.Title = TourCardTitle
TourCard.Description = TourCardDescription
TourCard.Body = TourCardBody
TourCard.Footer = TourCardFooter
TourCard.Dots = TourCardDots
TourCard.Progress = TourCardProgress

export const { Context: TourCardContext, useCompoundContext: useTourCardContext } =
  createCompoundContext<any>('TourCard')
