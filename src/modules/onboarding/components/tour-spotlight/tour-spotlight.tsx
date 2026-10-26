import React, { useEffect, useState, useRef, useCallback, useId, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { generateCutoutMaskPath, generateMultiCutoutMaskPath, getCompoundTargetRect, getTargetRect, resolveTargets } from '../../engine/dom'
import type { TargetRect, TourBackdropBehavior, TourHighlightVariant, TourTargetResolver } from '../../engine/types'

/* ==========================================================================
   TourSpotlight Slot Definitions
   ========================================================================== */

export interface TourSpotlightSlots {
  /** Optional custom overlay content rendered inside the spotlight portal. */
  content?: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
}

/* ==========================================================================
   TourSpotlight Props
   ========================================================================== */

export interface TourSpotlightProps {
  /** Target element or selector to spotlight. */
  target?: TourTargetResolver
  /** Whether the spotlight is actively visible. */
  active?: boolean
  /** Padding around the spotlight cutout in pixels (default 8). */
  padding?: number
  /** Border radius of the spotlight in pixels, or 'auto' for concentric corner radius sync (default 'auto'). */
  radius?: number | 'auto'
  /** Visual variant: cutout, ring, elevation. */
  variant?: TourHighlightVariant
  /** Whether user can interact with the target through the spotlight. */
  interactive?: boolean
  /** Backdrop dismissal/interaction rule: block, dismiss, close, pass-through, next. */
  backdropBehavior?: TourBackdropBehavior
  /** Custom backdrop color. */
  backdropColor?: string
  /** Dim opacity (0-1, default 0.65). */
  backdropOpacity?: number
  /** Glassmorphic backdrop blur filter. */
  backdropBlur?: boolean
  /** Backdrop click callback. */
  onBackdropClick?: () => void
  /** Target click callback. */
  onTargetClick?: () => void
  /** Additional CSS class names. */
  className?: string
  /** Optional child elements. */
  children?: React.ReactNode
  /** Custom slot components. */
  slots?: SlotComponents<TourSpotlightSlots>
  /** Custom slot props map. */
  slotProps?: SlotPropsMap<TourSpotlightSlots>
}

const TourSpotlightPrimitive = ({
  target,
  active = true,
  padding = 8,
  radius = 'auto',
  variant = 'cutout',
  interactive = false,
  backdropBehavior = 'block',
  backdropColor = '#000000',
  backdropOpacity = 0.65,
  backdropBlur = false,
  onBackdropClick,
  onTargetClick,
  className,
  children,
  slots,
  slotProps,
}: TourSpotlightProps) => {
  const [mounted, setMounted] = useState(false)
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  }))
  const [targetRects, setTargetRects] = useState<TargetRect[]>([])
  const animFrameRef = useRef<number | null>(null)

  useEffect(() => {
    setMounted(true)
    const updateDimensions = () => {
      setViewport({
        width: window.innerWidth || document.documentElement.clientWidth || 1920,
        height: window.innerHeight || document.documentElement.clientHeight || 1080,
      })
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Continuous tracking of target element bounding boxes
  const updateTargetRect = useCallback(() => {
    if (!active || !target) {
      setTargetRects([])
      return
    }
    const resolvedList = resolveTargets(target)
    const validRects: TargetRect[] = []
    for (const res of resolvedList) {
      const r = getTargetRect(res, padding)
      if (r) validRects.push(r)
    }
    setTargetRects(validRects)
  }, [active, target, padding])

  useEffect(() => {
    if (!active || !mounted) return

    updateTargetRect()

    const handleScroll = () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = requestAnimationFrame(updateTargetRect)
    }

    window.addEventListener('scroll', handleScroll, { capture: true, passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    const resolvedList = resolveTargets(target)
    const resizeObservers: ResizeObserver[] = []
    if (typeof ResizeObserver !== 'undefined') {
      resolvedList.forEach((resolved) => {
        if (resolved instanceof Element) {
          const ro = new ResizeObserver(() => {
            handleScroll()
          })
          ro.observe(resolved)
          resizeObservers.push(ro)
        }
      })
    }

    const interval = setInterval(updateTargetRect, 250)

    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true })
      window.removeEventListener('resize', handleScroll)
      resizeObservers.forEach((ro) => ro.disconnect())
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      clearInterval(interval)
    }
  }, [active, mounted, target, padding, updateTargetRect])

  const rawClipId = useId()
  const clipId = useMemo(() => 'tour-spotlight-clip-' + rawClipId.replace(/[^a-zA-Z0-9-_]/g, ''), [rawClipId])

  const maskPath = useMemo(() => {
    if (targetRects.length === 0) {
      return generateCutoutMaskPath(null, radius, viewport.width, viewport.height)
    }
    if (targetRects.length === 1) {
      return generateCutoutMaskPath(targetRects[0]!, radius, viewport.width, viewport.height)
    }
    return generateMultiCutoutMaskPath(targetRects, radius, viewport)
  }, [targetRects, radius, viewport])

  if (!mounted || !active) return null

  const handleBackdropPress = (e: React.MouseEvent) => {
    const { clientX, clientY } = e
    const insideAnyTarget = targetRects.some(
      (r) => clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom
    )

    if (insideAnyTarget) {
      onTargetClick?.()
      return
    }

    if (backdropBehavior === 'block') {
      e.stopPropagation()
    } else {
      onBackdropClick?.()
    }
  }

  const portalContent = (
    <div
      data-slot="tour-spotlight"
      className={cn(
        'fixed inset-0 z-[9990] select-none transition-opacity duration-300 pointer-events-auto',
        className
      )}
      style={{
        pointerEvents: backdropBehavior === 'pass-through' && !interactive ? 'none' : 'auto',
      }}
      onClick={handleBackdropPress}
      aria-hidden="true"
    >
      {/* 1. Backdrop Blur Filter Layer (clipped to maskPath so it NEVER blurs targets) */}
      {backdropBlur && (
        <div
          data-slot="tour-spotlight-blur"
          className="fixed inset-0 backdrop-blur-md transition-opacity duration-300 pointer-events-none z-[9990]"
          style={{
            clipPath: `url(#${clipId})`,
            WebkitClipPath: `url(#${clipId})`,
          }}
        />
      )}

      {/* 2. SVG Cutout Mask Layer with ClipPath Definition */}
      {variant === 'cutout' && (
        <svg
          data-slot="tour-spotlight-mask"
          className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-300 ease-out z-[9991]"
          viewBox={`0 0 ${viewport.width} ${viewport.height}`}
          style={{ width: '100vw', height: '100vh' }}
        >
          <defs>
            <clipPath id={clipId} clipRule="evenodd">
              <path d={maskPath} fillRule="evenodd" />
            </clipPath>
          </defs>
          <path
            d={maskPath}
            fill={backdropColor}
            fillOpacity={backdropOpacity}
            fillRule="evenodd"
            className="transition-all duration-300 ease-out"
          />
        </svg>
      )}

      {/* Dimmed backdrop when variant is not cutout */}
      {variant !== 'cutout' && (
        <div
          data-slot="tour-spotlight-dim"
          className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
          style={{
            backgroundColor: backdropColor,
            opacity: backdropOpacity,
          }}
        />
      )}

      {/* Interactive Pass-Through Holes */}
      {interactive &&
        targetRects.map((rect, idx) => (
          <div
            key={idx}
            data-slot="tour-spotlight-interactive-hole"
            className="absolute pointer-events-none"
            style={{
              top: `${rect.top}px`,
              left: `${rect.left}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
            }}
          />
        ))}

      {children}
      {slots?.content && renderSlot(slots.content, slotProps?.content as any)}
    </div>
  )

  return createPortal(portalContent, document.body)
}

export const TourSpotlight = createInterfaceComponent<TourSpotlightProps, TourSpotlightSlots>(
  {
    name: 'TourSpotlight',
    category: 'onboarding',
    description: 'Dynamic backdrop overlay and cutout spotlight for focusing on active tour steps.',
    version: '1.0.0',
    props: {
      active: true,
      padding: 8,
      radius: 'auto',
      variant: 'cutout',
      interactive: false,
      backdropBehavior: 'block',
      backdropColor: '#000000',
      backdropOpacity: 0.65,
      backdropBlur: false,
    },
    slots: {
      content: undefined,
    },
  },
  TourSpotlightPrimitive
)
