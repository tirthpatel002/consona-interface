'use client'

import * as React from 'react'
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'

/* ==========================================================================
   Chapter Scrubber Types & Interfaces
   ========================================================================== */

export interface ChapterScrubberItem {
  /** Stable, unique identifier for the chapter. */
  id: string
  /** Heading text shown at the top of the preview card. */
  title: string
  /** Supporting copy or node shown under the title. */
  description?: React.ReactNode
  /** Small label rendered above the title (e.g. timestamp, track time, step number). */
  meta?: React.ReactNode
  /** Optional thumbnail image URL. */
  thumbnail?: string
  /** Optional custom badge or tag node. */
  badge?: React.ReactNode
  /** Optional custom icon node. */
  icon?: React.ReactNode
}

export type ScrubberChapter = ChapterScrubberItem
export type Chapter = ChapterScrubberItem

export interface ChapterScrubberTickSlotProps {
  /** 0-based index of the tick. */
  index: number
  /** Continuous motion value tracking normalized pointer coordinate. */
  pointer: MotionValue<number>
  /** Motion value tracking interaction strength (0 resting to 1 engaged). */
  strength: MotionValue<number>
  /** Wave magnification radius in tick units. */
  radius: number
  /** Resting length of the tick in pixels. */
  restLength: number
  /** Peak magnified length of the tick in pixels. */
  peakLength: number
  /** Whether this tick matches the currently selected or active chapter. */
  isCurrent: boolean
  /** Layout orientation of the scrubber rail ('vertical' | 'horizontal'). */
  orientation: 'vertical' | 'horizontal'
}

export interface ChapterScrubberCardSlotProps {
  /** Active chapter payload currently being hovered or inspected. */
  chapter: ChapterScrubberItem
  /** 0-based index of the active chapter. */
  index: number
}

/* ==========================================================================
   Chapter Scrubber Slots Interface
   ========================================================================== */

export interface ChapterScrubberSlots {
  /** Custom floating preview card component or render function. */
  card?: React.ComponentType<ChapterScrubberCardSlotProps>
  /** Custom tick mark atom renderer along the rail. */
  tick?: React.ComponentType<ChapterScrubberTickSlotProps>
}

/* ==========================================================================
   Chapter Scrubber Props Interface
   ========================================================================== */

export interface ChapterScrubberProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** Chapters or items rendered sequentially along the rail. */
  chapters: ChapterScrubberItem[]
  /** Layout orientation of the scrubber rail. Default `'vertical'`. */
  orientation?: 'vertical' | 'horizontal'
  /** Side where the floating preview card opens toward. Default `'right'` for vertical, `'top'` for horizontal. */
  side?: 'left' | 'right' | 'top' | 'bottom'
  /** Length in pixels a tick reaches at the crest of wave magnification. Default `56`. */
  peakLength?: number
  /** Resting length in pixels of every tick. Default `14`. */
  restLength?: number
  /** Distance in pixels between ticks (row height for vertical, column width for horizontal). Default `10`. */
  rowHeight?: number
  /** Radius of the magnification wave in row/column units. Default `4`. */
  radius?: number
  /** Index of the persistent active or current position. */
  currentIndex?: number
  /** Callback fired when the active hovered or focused chapter changes. */
  onActiveChange?: (chapter: ChapterScrubberItem | null, index: number) => void
  /** Callback fired when a chapter is selected via click, Enter, or Space. */
  onSelect?: (chapter: ChapterScrubberItem, index: number) => void
  /** Legacy custom render function for the floating preview card. */
  renderCard?: (chapter: ChapterScrubberItem, index: number) => React.ReactNode
  /** Accessible label for the scrubber rail listbox. Default `'Chapters'`. */
  label?: string
  /** Custom CSS classes for the preview card container. */
  cardClassName?: string
  /** Slot component customizations. */
  slots?: SlotComponents<ChapterScrubberSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<ChapterScrubberSlots>
  /** Optional DOM ref attached to the root container. */
  ref?: React.Ref<HTMLDivElement>
}

export interface ScrubberProps extends ChapterScrubberProps { }

/* ==========================================================================
   Animation Springs & Cosine Bump
   ========================================================================== */

const CARD_WIDTH = 270
const GAP = 20

// Near-critically-damped spring for immediate pointer tracking without overshoot
const POINTER_SPRING = { stiffness: 700, damping: 52, mass: 0.5 }
// Softer spring for wave swell and relaxation
const STRENGTH_SPRING = { stiffness: 260, damping: 30, mass: 0.6 }
// Snappy kinetic spring for fluid card size transitions without abrupt jumping
const CARD_SIZE_SPRING = { stiffness: 420, damping: 32, mass: 0.5 }

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

// Raised-cosine bump: 1 at the crest, 0 beyond radius
function bump(distance: number, radius: number) {
  if (distance >= radius) return 0
  return 0.5 * (1 + Math.cos(Math.PI * (distance / radius)))
}

/* ==========================================================================
   Tick Sub-Atom Primitive & Factory
   ========================================================================== */

const ChapterScrubberTickPrimitive = ({
  index,
  pointer,
  strength,
  radius,
  restLength,
  peakLength,
  isCurrent,
  orientation,
}: ChapterScrubberTickSlotProps) => {
  const dimension = useTransform(() => {
    const rise = strength.get() * bump(Math.abs(index - pointer.get()), radius)
    return restLength + rise * (peakLength - restLength)
  })
  const opacity = useTransform(() => {
    const rise = strength.get() * bump(Math.abs(index - pointer.get()), radius)
    const base = isCurrent ? 0.85 : 0.25
    return base + rise * (1 - base)
  })
  const scaleCross = useTransform(() => {
    const rise = strength.get() * bump(Math.abs(index - pointer.get()), radius)
    return 1 + rise * 0.4
  })

  if (orientation === 'horizontal') {
    return (
      <motion.span
        data-slot="tick"
        aria-hidden="true"
        style={{ height: dimension, opacity, scaleX: scaleCross }}
        className={cn(
          'block w-0.5 rounded-full transition-colors duration-150',
          isCurrent ? 'bg-primary' : 'bg-fg'
        )}
      />
    )
  }

  return (
    <motion.span
      data-slot="tick"
      aria-hidden="true"
      style={{ width: dimension, opacity, scaleY: scaleCross }}
      className={cn(
        'block h-0.5 rounded-full transition-colors duration-150',
        isCurrent ? 'bg-primary' : 'bg-fg'
      )}
    />
  )
}

export const ChapterScrubberTick = createInterfaceComponent<ChapterScrubberTickSlotProps>(
  {
    name: 'ChapterScrubberTick',
    category: 'navigation',
    description: 'Kinetic tick mark atom with raised-cosine wave magnification for chapter scrubber rails.',
    version: '1.0.0',
  },
  ChapterScrubberTickPrimitive
)

/* ==========================================================================
   Preview Card Sub-Atom Primitive & Factory
   ========================================================================== */

export interface ChapterScrubberCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Active chapter item displayed inside the preview card. */
  chapter: ChapterScrubberItem
  /** 0-based index of the chapter. */
  index?: number
}

const ChapterScrubberCardPrimitive = ({
  chapter,
  className,
  ...props
}: ChapterScrubberCardProps) => {
  return (
    <div data-slot="chapter-scrubber-card" className={cn('flex flex-col', className)} {...props}>
      {chapter.thumbnail && (
        <div className="mb-2.5 overflow-hidden rounded-base aspect-video border border-border/50 bg-muted">
          <img
            src={chapter.thumbnail}
            alt={chapter.title}
            className="size-full object-cover"
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mb-1">
        {chapter.meta && (
          <span className="text-[11px] font-mono font-medium text-muted-fg tracking-wide">
            {chapter.meta}
          </span>
        )}
        <div className="flex items-center gap-1.5 ml-auto">
          {chapter.badge && <span>{chapter.badge}</span>}
          {chapter.icon && (
            <span className="size-3.5 text-muted-fg flex items-center justify-center">
              {chapter.icon}
            </span>
          )}
        </div>
      </div>

      <h4 className="text-sm font-semibold tracking-tight text-fg truncate">
        {chapter.title}
      </h4>

      {chapter.description && (
        <p className="mt-1 text-xs text-muted-fg leading-relaxed line-clamp-3">
          {chapter.description}
        </p>
      )}
    </div>
  )
}

export const ChapterScrubberCard = createInterfaceComponent<ChapterScrubberCardProps>(
  {
    name: 'ChapterScrubberCard',
    category: 'navigation',
    description: 'Floating popover preview card displaying chapter metadata, media thumbnail, and description.',
    version: '1.0.0',
  },
  ChapterScrubberCardPrimitive
)

/* ==========================================================================
   Chapter Scrubber Root Primitive Implementation
   ========================================================================== */

const ChapterScrubberPrimitive = ({
  chapters,
  orientation = 'vertical',
  side,
  peakLength = 56,
  restLength = 14,
  rowHeight = 10,
  radius = 4,
  currentIndex,
  onActiveChange,
  onSelect,
  renderCard,
  label = 'Chapters',
  cardClassName,
  slots,
  slotProps,
  className,
  ref,
  ...props
}: ChapterScrubberProps) => {
  const defaultSide = orientation === 'vertical' ? 'right' : 'top'
  const resolvedSideProp = side ?? defaultSide

  const prefersReducedMotion = useReducedMotion()
  const containerRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const cardRef = React.useRef<HTMLDivElement>(null)
  const contentMeasureRef = React.useRef<HTMLDivElement>(null)
  const isInitialMeasurementRef = React.useRef(true)
  const buttonsRef = React.useRef<Array<HTMLButtonElement | null>>([])
  const baseId = React.useId()
  const optionId = (index: number) => `${baseId}-opt-${index}`

  const rawPointer = useMotionValue(0)
  const rawStrength = useMotionValue(0)
  const rawCardHeight = useMotionValue(0)
  const rawCardWidth = useMotionValue(CARD_WIDTH)

  const springPointer = useSpring(rawPointer, POINTER_SPRING)
  const springStrength = useSpring(rawStrength, STRENGTH_SPRING)
  const springCardHeight = useSpring(rawCardHeight, CARD_SIZE_SPRING)
  const springCardWidth = useSpring(rawCardWidth, CARD_SIZE_SPRING)

  const pointer = prefersReducedMotion ? rawPointer : springPointer
  const strength = prefersReducedMotion ? rawStrength : springStrength
  const animatedCardHeight = prefersReducedMotion ? rawCardHeight : springCardHeight
  const animatedCardWidth = prefersReducedMotion ? rawCardWidth : springCardWidth

  const [activeIndex, setActiveIndex] = React.useState(0)
  const [engaged, setEngaged] = React.useState(false)
  const [flipped, setFlipped] = React.useState(false)
  const [cardSize, setCardSize] = React.useState({ width: CARD_WIDTH, height: 0 })
  const hoveringRef = React.useRef(false)
  const focusedRef = React.useRef<number | null>(null)
  const activeRef = React.useRef(0)

  const commitActive = React.useCallback((index: number) => {
    if (index !== activeRef.current) {
      activeRef.current = index
      setActiveIndex(index)
    }
  }, [])

  const last = chapters?.length - 1

  React.useEffect(() => {
    onActiveChange?.(
      engaged ? (chapters[activeIndex] ?? null) : null,
      engaged ? activeIndex : -1
    )
  }, [engaged, activeIndex, chapters, onActiveChange])

  // Measure card dimensions dynamically with ResizeObserver for smooth morphing & clamped positioning
  React.useEffect(() => {
    const el = contentMeasureRef.current
    if (!el) return

    const updateSize = () => {
      if (!contentMeasureRef.current || !cardRef.current) return
      const contentH = contentMeasureRef.current.offsetHeight
      const contentW = contentMeasureRef.current.offsetWidth

      const cardComputed = window.getComputedStyle(cardRef.current)
      const padBorderH =
        (parseFloat(cardComputed.paddingTop) || 0) +
        (parseFloat(cardComputed.paddingBottom) || 0) +
        (parseFloat(cardComputed.borderTopWidth) || 0) +
        (parseFloat(cardComputed.borderBottomWidth) || 0)
      const padBorderW =
        (parseFloat(cardComputed.paddingLeft) || 0) +
        (parseFloat(cardComputed.paddingRight) || 0) +
        (parseFloat(cardComputed.borderLeftWidth) || 0) +
        (parseFloat(cardComputed.borderRightWidth) || 0)

      const targetH = contentH + padBorderH
      const targetW = contentW + padBorderW

      if (targetH > 0) {
        setCardSize({ width: targetW || CARD_WIDTH, height: targetH })

        if (isInitialMeasurementRef.current || rawCardHeight.get() === 0) {
          rawCardHeight.set(targetH)
          springCardHeight.jump(targetH)
          rawCardWidth?.set?.(targetW || CARD_WIDTH)
          springCardWidth.jump(targetW || CARD_WIDTH)
          isInitialMeasurementRef.current = false
        } else {
          rawCardHeight.set(targetH)
          rawCardWidth?.set?.(targetW || CARD_WIDTH)
        }
      }
    }

    updateSize()

    const observer = new ResizeObserver(() => {
      updateSize()
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [activeIndex, chapters, rawCardHeight, springCardHeight, rawCardWidth, springCardWidth])

  // Viewport edge collision avoidance & auto-flip
  React.useEffect(() => {
    if (!engaged) return
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const doc = el.ownerDocument.defaultView
    const vw = doc?.innerWidth ?? 0
    const vh = doc?.innerHeight ?? 0

    if (orientation === 'vertical') {
      const need = CARD_WIDTH + GAP + 8
      let useRight = resolvedSideProp === 'right'
      if (useRight && vw - rect.right < need && rect.left >= need) useRight = false
      if (!useRight && rect.left < need && vw - rect.right >= need) useRight = true
      setFlipped(useRight !== (resolvedSideProp === 'right'))
    } else {
      const need = (cardSize.height || 100) + GAP + 8
      let useTop = resolvedSideProp === 'top'
      if (useTop && rect.top < need && vh - rect.bottom >= need) useTop = false
      if (!useTop && vh - rect.bottom < need && rect.top >= need) useTop = true
      setFlipped(useTop !== (resolvedSideProp === 'top'))
    }
  }, [engaged, activeIndex, orientation, resolvedSideProp, cardSize.height])

  const resolvedSide =
    orientation === 'vertical'
      ? resolvedSideProp === 'right'
        ? flipped ? 'left' : 'right'
        : flipped ? 'right' : 'left'
      : resolvedSideProp === 'top'
        ? flipped ? 'bottom' : 'top'
        : flipped ? 'top' : 'bottom'

  const totalLength = chapters?.length * rowHeight
  const rovingIndex = engaged ? activeIndex : (currentIndex ?? 0)

  // Floating card spatial positioning transforms with spring-interpolated centering
  const cardTop = useTransform(
    [pointer, animatedCardHeight],
    ([p, h]) => {
      if (orientation === 'horizontal') return 0
      const height = (typeof h === 'number' && h > 0 ? h : cardSize.height) || 80
      const half = height / 2
      const center = clamp(
        ((p as number) + 0.5) * rowHeight,
        half,
        Math.max(half, totalLength - half)
      )
      return center - half
    }
  )

  const cardLeft = useTransform(
    [pointer, animatedCardWidth],
    ([p, w]) => {
      if (orientation === 'vertical') return 0
      const width = (typeof w === 'number' && w > 0 ? w : cardSize.width) || CARD_WIDTH
      const half = width / 2
      const center = clamp(
        ((p as number) + 0.5) * rowHeight,
        half,
        Math.max(half, totalLength - half)
      )
      return center - half
    }
  )

  const cardScale = useTransform(strength, [0, 1], [0.96, 1])
  const cardTranslate = useTransform(strength, [0, 1], [
    resolvedSide === 'right' ? -6 : resolvedSide === 'left' ? 6 : 0,
    0,
  ])
  const cardTranslateY = useTransform(strength, [0, 1], [
    resolvedSide === 'bottom' ? -6 : resolvedSide === 'top' ? 6 : 0,
    0,
  ])

  const engageAt = (pointerUnit: number, activeAt: number) => {
    rawPointer?.set(pointerUnit)
    rawStrength?.set(1)
    commitActive(clamp(activeAt, 0, last))
    if (!engaged) setEngaged(true)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = listRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (orientation === 'vertical') {
      const row = (event.clientY - rect.top) / rowHeight - 0.5
      hoveringRef.current = true
      engageAt(clamp(row, -0.5, last + 0.5), Math.round(row))
    } else {
      const col = (event.clientX - rect.left) / rowHeight - 0.5
      hoveringRef.current = true
      engageAt(clamp(col, -0.5, last + 0.5), Math.round(col))
    }
  }

  const handlePointerLeave = () => {
    hoveringRef.current = false
    focusedRef.current = null
    rawStrength?.set?.(0)
    setEngaged(false)
    isInitialMeasurementRef.current = true
  }

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      focusedRef.current = null
      if (!hoveringRef.current) {
        rawStrength?.set?.(0)
        setEngaged(false)
        isInitialMeasurementRef.current = true
      }
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    let next = focusedRef.current ?? activeRef.current
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        next = Math.min(last, next + 1)
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        next = Math.max(0, next - 1)
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = last
        break
      default:
        return
    }
    event.preventDefault()
    buttonsRef.current[next]?.focus()
  }

  const activeChapter = chapters?.[activeIndex]

  return (
    <div
      ref={(el) => {
        containerRef.current = el
        if (typeof ref === 'function') ref(el)
        else if (ref && 'current' in ref) (ref as any).current = el
      }}
      data-slot="chapter-scrubber"
      data-orientation={orientation}
      style={{
        width: orientation === 'vertical' ? peakLength : '100%',
        height: orientation === 'horizontal' ? peakLength : undefined,
      }}
      className={cn('relative select-none touch-none', className)}
      {...props}
    >
      <div
        ref={listRef}
        role="listbox"
        aria-label={label}
        aria-orientation={orientation}
        aria-activedescendant={engaged ? optionId(activeIndex) : undefined}
        className={cn(
          'flex',
          orientation === 'vertical'
            ? 'w-full flex-col'
            : 'h-full flex-row items-center justify-between'
        )}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      >
        {chapters.map((chapter, index) => {
          const isCurrent = index === currentIndex
          const descText =
            typeof chapter.description === 'string'
              ? `. ${chapter.description}`
              : ''

          const tickProps: ChapterScrubberTickSlotProps = {
            index,
            pointer,
            strength,
            radius,
            restLength,
            peakLength,
            isCurrent,
            orientation,
          }

          return (
            <button
              ref={(el) => {
                buttonsRef.current[index] = el
              }}
              key={chapter.id}
              id={optionId(index)}
              type="button"
              role="option"
              aria-selected={isCurrent}
              aria-label={`${chapter.title}${descText}`}
              tabIndex={index === rovingIndex ? 0 : -1}
              onFocus={() => {
                focusedRef.current = index
                engageAt(index, index)
              }}
              onClick={(e) => {
                onSelect?.(chapter, index)
                e.currentTarget.blur()
                focusedRef.current = null
              }}
              style={{
                height: orientation === 'vertical' ? rowHeight : '100%',
                width: orientation === 'horizontal' ? rowHeight : '100%',
              }}
              className={cn(
                'group flex items-center rounded-atom outline-hidden transition-all',
                'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
                orientation === 'vertical'
                  ? resolvedSide === 'left'
                    ? 'justify-end'
                    : 'justify-start'
                  : resolvedSide === 'top'
                    ? 'items-end justify-center'
                    : 'items-start justify-center'
              )}
            >
              {slots?.tick ? (
                renderSlot(slots.tick, { ...slotProps?.tick, ...tickProps })
              ) : (
                <ChapterScrubberTickPrimitive {...tickProps} />
              )}
            </button>
          )
        })}
      </div>

      {activeChapter && (
        <motion.div
          ref={cardRef}
          aria-hidden="true"
          data-slot="card"
          style={{
            height: cardSize.height > 0 ? animatedCardHeight : undefined,
            ...(orientation === 'vertical'
              ? {
                top: cardTop,
                x: cardTranslate,
                scale: cardScale,
                opacity: strength,
                ...(resolvedSide === 'right'
                  ? { left: peakLength + GAP }
                  : { right: peakLength + GAP }),
              }
              : {
                left: cardLeft,
                y: cardTranslateY,
                scale: cardScale,
                opacity: strength,
                ...(resolvedSide === 'top'
                  ? { bottom: peakLength + GAP }
                  : { top: peakLength + GAP }),
              }),
          }}
          className={cn(
            'pointer-events-none absolute z-20 w-67.5 overflow-hidden rounded-macro border border-border bg-bg p-space-md text-fg shadow-2xl',
            orientation === 'vertical'
              ? resolvedSide === 'right'
                ? 'origin-left'
                : 'origin-right'
              : resolvedSide === 'top'
                ? 'origin-bottom'
                : 'origin-top',
            cardClassName
          )}
        >
          <div ref={contentMeasureRef} className="w-full">
            {renderCard ? (
              renderCard(activeChapter, activeIndex)
            ) : slots?.card ? (
              renderSlot(slots.card, { ...slotProps?.card, chapter: activeChapter, index: activeIndex })
            ) : (
              <ChapterScrubberCardPrimitive chapter={activeChapter} index={activeIndex} />
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export const ChapterScrubber = createInterfaceComponent<
  ChapterScrubberProps,
  ChapterScrubberSlots
>(
  {
    name: 'ChapterScrubber',
    category: 'navigation',
    description:
      'Fluid kinetic timeline scrubber rail with raised-cosine wave magnification, spatial preview cards, and keyboard navigation.',
    version: '1.0.0',
    props: {
      orientation: 'vertical',
      peakLength: 56,
      restLength: 14,
      rowHeight: 10,
      radius: 4,
      label: 'Chapters',
    },
    slots: {
      card: ChapterScrubberCard,
      tick: ChapterScrubberTick,
    },
  },
  ChapterScrubberPrimitive
)

export const { Context: ChapterScrubberContext, useCompoundContext: useChapterScrubberContext } =
  createCompoundContext<any>('ChapterScrubber')

// Compound Namespace Attachments
ChapterScrubber.Card = ChapterScrubberCard
ChapterScrubber.Tick = ChapterScrubberTick

// Export aliases
export const Scrubber = ChapterScrubber
