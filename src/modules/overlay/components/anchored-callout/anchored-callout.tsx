import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { calculateFloatingPosition } from '../../engine/positioning'
import { useTargetGeometry } from '../../hooks/use-overlay'
import type {
  CalculatedPosition,
  OverlayPlacement,
  OverlayTargetResolver,
} from '../../engine/types'

/* ==========================================================================
   AnchoredCallout Slot Definitions
   ========================================================================== */

export interface AnchoredCalloutSlots {
  /** Floating pointer arrow indicator slot. */
  arrow?: React.ComponentType<{ placement: string; style?: React.CSSProperties; className?: string }>
}

/* ==========================================================================
   AnchoredCallout Props
   ========================================================================== */

export interface AnchoredCalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Target element, selector query, or array of targets to anchor the callout to. */
  target?: OverlayTargetResolver | OverlayTargetResolver[]
  /** Whether the callout is visible. */
  open?: boolean
  /** Placement relative to the target. */
  placement?: OverlayPlacement
  /** Distance from target in pixels (default 14). */
  offset?: number
  /** Whether to show a pointer arrow anchored to the target (default true). */
  showArrow?: boolean
  /** Custom card width in pixels (default 360). */
  cardWidth?: number
  /** Custom class name. */
  className?: string
  /** Children content rendered inside the card. */
  children?: React.ReactNode
  /** Slot overrides map. */
  slots?: SlotComponents<AnchoredCalloutSlots>
  /** Slot props overrides map. */
  slotProps?: SlotPropsMap<AnchoredCalloutSlots>
}

const AnchoredCalloutPrimitive = ({
  target,
  open = true,
  placement = 'bottom',
  offset = 14,
  showArrow = true,
  cardWidth = 360,
  className,
  children,
  slots,
  slotProps,
  ...props
}: AnchoredCalloutProps) => {
  const [mounted, setMounted] = useState(false)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [cardDims, setCardDims] = useState({ width: cardWidth, height: 160 })

  const { rect: targetRect } = useTargetGeometry(open ? target : null, 0)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Measure card dimensions dynamically
  useEffect(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setCardDims({ width: rect.width, height: rect.height })
      }
    }
  }, [children, targetRect, open])

  const pos: CalculatedPosition = calculateFloatingPosition(
    targetRect,
    Math.min(cardDims.width, cardWidth),
    cardDims.height,
    placement,
    { offset, autoFlip: true, autoShift: true }
  )

  if (!mounted || !open) return null

  // Arrow styles based on side
  const renderArrow = () => {
    if (!showArrow || !pos.arrowPlacement || pos.placement === 'center') return null

    const arrowStyle: React.CSSProperties = {}
    if (pos.arrowX !== undefined) arrowStyle.left = `${pos.arrowX}px`
    if (pos.arrowY !== undefined) arrowStyle.top = `${pos.arrowY}px`

    if (slots?.arrow) {
      return renderSlot(slots.arrow, {
        placement: pos.arrowPlacement,
        style: arrowStyle,
        ...(slotProps?.arrow as any),
      })
    }

    return (
      <div
        data-slot="arrow"
        className={cn(
          'absolute size-3.5 bg-card border border-border rotate-45 pointer-events-none z-0',
          pos.arrowPlacement === 'top' && '-top-1.75 border-b-0 border-r-0',
          pos.arrowPlacement === 'bottom' && '-bottom-1.75 border-t-0 border-l-0',
          pos.arrowPlacement === 'left' && '-left-1.75 border-t-0 border-r-0',
          pos.arrowPlacement === 'right' && '-right-1.75 border-b-0 border-l-0'
        )}
        style={arrowStyle}
      />
    )
  }

  const calloutElement = (
    <div
      ref={cardRef}
      role="dialog"
      data-slot="anchored-callout"
      className={cn(
        'fixed z-[9995] transition-all duration-300 ease-out',
        'flex flex-col rounded-macro border border-border/80 bg-card text-card-fg shadow-2xl overflow-visible',
        className
      )}
      style={{
        top: `${pos.y}px`,
        left: `${pos.x}px`,
        width: `${cardWidth}px`,
        maxWidth: `${pos.maxWidth ?? 360}px`,
        maxHeight: `${pos.maxHeight ?? 600}px`,
      }}
      {...props}
    >
      {renderArrow()}
      <div className="relative z-10 w-full overflow-hidden rounded-macro">{children}</div>
    </div>
  )

  return createPortal(calloutElement, document.body)
}

export const AnchoredCallout = createInterfaceComponent<AnchoredCalloutProps, AnchoredCalloutSlots>(
  {
    name: 'AnchoredCallout',
    category: 'overlay',
    description: '12-placement floating callout card anchored to target coordinates with auto-flip collision detection.',
    version: '1.0.0',
    props: {
      open: true,
      placement: 'bottom',
      offset: 14,
      showArrow: true,
      cardWidth: 360,
    },
    slots: {
      arrow: undefined,
    },
  },
  AnchoredCalloutPrimitive
)
