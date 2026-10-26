import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { TourSpotlight, type TourSpotlightProps } from '../tour-spotlight'
import type {
  TargetRect,
  TourBackdropBehavior,
  TourHighlightVariant,
  TourPlacement,
  TourTargetResolver,
  CutoutRadius,
} from '../../engine/types'
import { calculateCardPosition, getTargetRect, resolveTarget, scrollTargetIntoView } from '../../engine/dom'

/* ==========================================================================
   OnboardingFocus Slot Definitions
   ========================================================================== */

export interface OnboardingFocusSlots {
  /** Custom spotlight implementation. */
  spotlight?: React.ComponentType<TourSpotlightProps>
}

/* ==========================================================================
   OnboardingFocus Props
   ========================================================================== */

export interface OnboardingFocusProps {
  /** Target element or selector to spotlight. */
  target?: TourTargetResolver
  /** Whether the focus spotlight is active. */
  active?: boolean
  /** Visual variant: 'cutout' (SVG mask), 'ring' (accent border), 'elevation', or 'none'. */
  variant?: TourHighlightVariant
  /** Padding around the spotlight in pixels (default 8). */
  padding?: number
  /** Border radius of the spotlight in pixels, or 'auto' for concentric sync (default 'auto'). */
  radius?: CutoutRadius
  /** If true, user can click and interact with the target while focused. */
  interactive?: boolean
  /** Backdrop click behavior (default 'close'). */
  backdropBehavior?: TourBackdropBehavior
  /** Backdrop dim opacity (default 0.65). */
  backdropOpacity?: number
  /** Whether to blur background elements. */
  backdropBlur?: boolean
  /** Preferred placement of optional popover content. */
  placement?: TourPlacement
  /** Distance in pixels between target and popover content (default 12). */
  offset?: number
  /** Auto-scroll target into view when activated (default true). */
  autoScroll?: boolean
  /** Callback fired when clicking the backdrop. */
  onClickBackdrop?: () => void
  /** Callback fired when clicking the spotlighted target. */
  onClickTarget?: () => void
  /** Custom popover content anchored to the focused element. */
  children?: React.ReactNode
  /** Additional class names for popover container. */
  className?: string
  /** Custom slot components. */
  slots?: SlotComponents<OnboardingFocusSlots>
  /** Custom slot props map. */
  slotProps?: SlotPropsMap<OnboardingFocusSlots>
}

const OnboardingFocusPrimitive = ({
  target,
  active = true,
  variant = 'cutout',
  padding = 8,
  radius = 'auto',
  interactive = false,
  backdropBehavior = 'close',
  backdropOpacity = 0.65,
  backdropBlur = false,
  placement = 'bottom',
  offset = 12,
  autoScroll = true,
  onClickBackdrop,
  onClickTarget,
  children,
  className,
  slots,
  slotProps,
}: OnboardingFocusProps) => {
  const [mounted, setMounted] = useState(false)
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [cardDims, setCardDims] = useState({ width: 320, height: 160 })

  useEffect(() => {
    setMounted(true)
  }, [])

  const updateTargetRect = React.useCallback(() => {
    if (!active) {
      setTargetRect(null)
      return
    }
    const resolved = resolveTarget(target)
    const rect = getTargetRect(resolved, padding)
    setTargetRect(rect)
  }, [active, target, padding])

  useEffect(() => {
    if (!active) return

    const resolved = resolveTarget(target)
    if (autoScroll && resolved) {
      scrollTargetIntoView(resolved)
    }

    updateTargetRect()

    let frameId: number | null = null
    const startTime = performance.now()
    const loop = (time: number) => {
      updateTargetRect()
      if (time - startTime < 600) {
        frameId = requestAnimationFrame(loop)
      }
    }
    frameId = requestAnimationFrame(loop)

    return () => {
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [active, target, autoScroll, updateTargetRect])

  useEffect(() => {
    if (!active) return

    const handleScrollOrResize = () => {
      updateTargetRect()
    }

    window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true })
    window.addEventListener('resize', handleScrollOrResize, { passive: true })

    const resolved = resolveTarget(target)
    let resizeObserver: ResizeObserver | null = null
    if (resolved && resolved instanceof Element && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateTargetRect()
      })
      resizeObserver.observe(resolved)
    }

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true })
      window.removeEventListener('resize', handleScrollOrResize)
      if (resizeObserver) resizeObserver.disconnect()
    }
  }, [active, target, updateTargetRect])

  useEffect(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setCardDims({ width: rect.width, height: rect.height })
      }
    }
  }, [children, active, targetRect])

  if (!mounted || !active) return null

  const pos = calculateCardPosition(targetRect, cardDims.width, cardDims.height, placement, offset)

  return (
    <>
      {slots?.spotlight ? (
        renderSlot(slots.spotlight, {
          target,
          active,
          padding,
          radius,
          variant,
          interactive,
          backdropBehavior,
          backdropOpacity,
          backdropBlur,
          onBackdropClick: onClickBackdrop,
          onTargetClick: onClickTarget,
          ...(slotProps?.spotlight as any),
        })
      ) : (
        <TourSpotlight
          target={target}
          active={active}
          padding={padding}
          radius={radius}
          variant={variant}
          interactive={interactive}
          backdropBehavior={backdropBehavior}
          backdropOpacity={backdropOpacity}
          backdropBlur={backdropBlur}
          onBackdropClick={onClickBackdrop}
          onTargetClick={onClickTarget}
          {...(slotProps?.spotlight as any)}
        />
      )}

      {children &&
        createPortal(
          <div
            ref={cardRef}
            data-slot="onboarding-focus-popover"
            className={cn(
              'fixed z-[9995] transition-all duration-300 ease-out animate-in fade-in-0 zoom-in-95',
              className
            )}
            style={{
              top: `${pos.y}px`,
              left: `${pos.x}px`,
            }}
          >
            {children}
          </div>,
          document.body
        )}
    </>
  )
}

export const OnboardingFocus = createInterfaceComponent<OnboardingFocusProps, OnboardingFocusSlots>(
  {
    name: 'OnboardingFocus',
    category: 'onboarding',
    description: 'Onboarding focus layer spotlighting specific DOM nodes with optional anchored popover content.',
    version: '1.0.0',
    props: {
      active: true,
      variant: 'cutout',
      padding: 8,
      radius: 'auto',
      interactive: false,
      backdropBehavior: 'close',
      backdropOpacity: 0.65,
      backdropBlur: false,
      placement: 'bottom',
      offset: 12,
      autoScroll: true,
    },
    slots: {
      spotlight: undefined,
    },
  },
  OnboardingFocusPrimitive
)
