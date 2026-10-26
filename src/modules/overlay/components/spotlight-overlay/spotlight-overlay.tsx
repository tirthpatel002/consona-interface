import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { resolveTargets } from '../../engine/geometry'
import { generateCutoutMaskPath, generateMultiCutoutMaskPath } from '../../engine/mask'
import { TargetTracker } from '../../engine/tracker'
import { useScrollLock } from '../../hooks/use-overlay'
import type {
  BackdropBehavior,
  BackdropVariant,
  CutoutRadius,
  CutoutShapeType,
  OverlayTargetResolver,
  TargetRect,
} from '../../engine/types'

/* ==========================================================================
   SpotlightOverlay Slot Definitions
   ========================================================================== */

export interface SpotlightOverlaySlots {
  /** Optional custom backdrop filter overlay layer. */
  backdropFilter?: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
  /** Optional custom target highlight / decorator renderer. */
  targetHighlight?: React.ComponentType<{ rect: TargetRect; index: number }>
}

/* ==========================================================================
   SpotlightOverlay Props
   ========================================================================== */

export interface SpotlightOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Single target or array of multiple targets to spotlight. */
  target?: OverlayTargetResolver | OverlayTargetResolver[]
  /** Whether the spotlight overlay is active/visible. */
  active?: boolean
  /** Visual highlight style: cutout, none. */
  variant?: BackdropVariant
  /** Padding around the spotlight cutout in pixels (default 8). */
  padding?: number
  /** Border radius of the cutout hole. */
  radius?: CutoutRadius
  /** Shape of the cutout mask (default 'rounded-rect'). */
  shape?: CutoutShapeType
  /** If true, user can click/interact with the spotlighted element through the backdrop. */
  interactive?: boolean
  /** Whether to apply glassmorphic backdrop blur to the dimmed surroundings (default false). */
  backdropBlur?: boolean
  /** Opacity of the dark dimmed overlay (0-1, default 0.6). */
  dimOpacity?: number
  /** Backdrop click interaction rule: block, dismiss, close, pass-through, next. */
  backdropBehavior?: BackdropBehavior
  /** Custom class name for the overlay container. */
  className?: string
  /** Custom class name applied to target highlight boxes (e.g. ring, border, shadow). */
  targetClassName?: string
  /** Custom CSS styles applied to target highlight boxes. */
  targetStyle?: React.CSSProperties
  /** Custom render function to decorate each target bounding rect. */
  renderTargetHighlight?: (rect: TargetRect, index: number) => React.ReactNode
  /** Callback fired when user clicks on the dimmed backdrop. */
  onBackdropClick?: () => void
  /** Callback fired when user clicks on the spotlighted target area. */
  onTargetClick?: () => void
  /** Custom slot components for replacing backdrop sub-layers. */
  slots?: SlotComponents<SpotlightOverlaySlots>
  /** Custom props passed into injected slot components. */
  slotProps?: SlotPropsMap<SpotlightOverlaySlots>
}

const SpotlightOverlayPrimitive = ({
  target,
  active = false,
  variant = 'cutout',
  padding = 8,
  radius = 'auto',
  shape = 'rounded-rect',
  interactive = false,
  backdropBlur = false,
  dimOpacity = 0.6,
  backdropBehavior = 'block',
  className,
  targetClassName,
  targetStyle,
  renderTargetHighlight,
  onBackdropClick,
  onTargetClick,
  slots,
  slotProps,
  ...props
}: SpotlightOverlayProps) => {
  const [mounted, setMounted] = useState(false)
  const [rects, setRects] = useState<TargetRect[]>([])
  const [viewportDims, setViewportDims] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  }))

  const rawClipId = useId()
  const clipId = useMemo(() => 'spotlight-clip-' + rawClipId.replace(/[^a-zA-Z0-9-_]/g, ''), [rawClipId])
  const trackersRef = useRef<TargetTracker[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  useScrollLock(active && backdropBehavior !== 'pass-through')

  // Update viewport dimensions on resize
  useEffect(() => {
    if (!active || typeof window === 'undefined') return

    const handleResize = () => {
      setViewportDims({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    handleResize()
    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [active])

  // Track targets with RAF smoothing and observers
  useEffect(() => {
    for (const t of trackersRef.current) {
      t.destroy()
    }
    trackersRef.current = []

    if (!active || !target) {
      setRects([])
      return
    }

    const resolvedList = resolveTargets(target)
    if (resolvedList.length === 0) {
      setRects([])
      return
    }

    const newRects: (TargetRect | null)[] = new Array(resolvedList.length).fill(null)

    resolvedList.forEach((t, index) => {
      const tracker = new TargetTracker({
        padding,
        onUpdate: (r) => {
          newRects[index] = r
          setRects(newRects.filter((item): item is TargetRect => item !== null))
        },
      })
      tracker.setTarget(t, padding)
      trackersRef.current.push(tracker)
    })

    return () => {
      for (const t of trackersRef.current) {
        t.destroy()
      }
      trackersRef.current = []
    }
  }, [active, target, padding])

  const maskPath = useMemo(() => {
    if (rects.length === 0) {
      return generateCutoutMaskPath(null, radius, viewportDims, shape)
    }
    if (rects.length === 1) {
      return generateCutoutMaskPath(rects[0]!, radius, viewportDims, shape)
    }
    return generateMultiCutoutMaskPath(rects, radius, viewportDims, shape)
  }, [rects, radius, viewportDims, shape])

  if (!mounted || !active) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (backdropBehavior === 'pass-through') return
    onBackdropClick?.()
  }

  const handleTargetClick = (e: React.MouseEvent) => {
    if (!interactive) {
      e.stopPropagation()
      onTargetClick?.()
    }
  }

  const overlayElement = (
    <div
      data-slot="spotlight-overlay"
      className={cn(
        'fixed inset-0 z-[9990] transition-opacity duration-300 ease-out select-none',
        backdropBehavior === 'pass-through' ? 'pointer-events-none' : 'pointer-events-auto',
        className
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleBackdropClick(e)
        }
      }}
      {...props}
    >
      {/* 1. Backdrop Blur Filter Layer (clipped to maskPath so it NEVER blurs targets) */}
      {backdropBlur && (
        <div
          data-slot="backdrop-filter"
          className="fixed inset-0 backdrop-blur-md transition-opacity duration-300 pointer-events-none z-[9990]"
          style={{
            clipPath: `url(#${clipId})`,
            WebkitClipPath: `url(#${clipId})`,
          }}
        >
          {slots?.backdropFilter && renderSlot(slots.backdropFilter, slotProps?.backdropFilter as any)}
        </div>
      )}

      {/* 2. SVG Cutout Mask Layer with ClipPath Definition */}
      {variant === 'cutout' && (
        <svg
          data-slot="cutout-mask"
          className="fixed inset-0 size-full pointer-events-none transition-all duration-300 ease-out z-[9991]"
          width={viewportDims.width}
          height={viewportDims.height}
          viewBox={`0 0 ${viewportDims.width} ${viewportDims.height}`}
          style={{
            fillRule: 'evenodd',
            clipRule: 'evenodd',
          }}
        >
          <defs>
            <clipPath id={clipId} clipRule="evenodd">
              <path d={maskPath} fillRule="evenodd" />
            </clipPath>
          </defs>
          <path
            d={maskPath}
            fill="black"
            fillOpacity={dimOpacity}
            className="transition-all duration-300 ease-out pointer-events-auto cursor-default"
            onClick={handleBackdropClick}
          />
        </svg>
      )}

      {/* 3. Target Highlights / Downstream Custom Target Decorators */}
      {rects.map((r, i) => {
        if (renderTargetHighlight) {
          return <React.Fragment key={i}>{renderTargetHighlight(r, i)}</React.Fragment>
        }
        if (slots?.targetHighlight) {
          return (
            <React.Fragment key={i}>
              {renderSlot(slots.targetHighlight, { rect: r, index: i, ...(slotProps?.targetHighlight as any) })}
            </React.Fragment>
          )
        }
        if (targetClassName || targetStyle) {
          return (
            <div
              key={i}
              data-slot="target-highlight"
              className={cn('fixed pointer-events-none transition-all duration-300 z-[9992]', targetClassName)}
              style={{
                top: `${r.top}px`,
                left: `${r.left}px`,
                width: `${r.width}px`,
                height: `${r.height}px`,
                ...targetStyle,
              }}
            />
          )
        }
        return null
      })}

      {/* 4. Interactive Pass-Through or Target Hit-Box */}
      {rects.map((r, i) => (
        <div
          key={i}
          onClick={handleTargetClick}
          className={cn(
            'fixed transition-all duration-300 ease-out z-[9993]',
            interactive ? 'pointer-events-none' : 'pointer-events-auto cursor-pointer'
          )}
          style={{
            top: `${r.top}px`,
            left: `${r.left}px`,
            width: `${r.width}px`,
            height: `${r.height}px`,
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  )

  return createPortal(overlayElement, document.body)
}

export const SpotlightOverlay = createInterfaceComponent<SpotlightOverlayProps, SpotlightOverlaySlots>(
  {
    name: 'SpotlightOverlay',
    category: 'overlay',
    description: 'Dynamic SVG cutout spotlight overlay with precise backdrop blur clipping and collision tracking.',
    version: '1.0.0',
    props: {
      active: false,
      variant: 'cutout',
      padding: 8,
      radius: 'auto',
      shape: 'rounded-rect',
      interactive: false,
      backdropBlur: false,
      dimOpacity: 0.6,
      backdropBehavior: 'block',
    },
    slots: {
      backdropFilter: undefined,
      targetHighlight: undefined,
    },
  },
  SpotlightOverlayPrimitive
)
