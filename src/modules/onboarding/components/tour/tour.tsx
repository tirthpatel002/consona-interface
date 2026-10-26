import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, CheckIcon } from '@heroicons/react/20/solid'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Button } from '../../../core/components/button'
import { Badge } from '../../../core/components/badge'
import { TourSpotlight, type TourSpotlightProps } from '../tour-spotlight'
import {
  TourCard,
  type TourCardProps,
  TourCardHeader,
  TourCardTitle,
  TourCardDescription,
  TourCardBody,
  TourCardFooter,
  TourCardDots,
  TourCardProgress,
} from '../tour-card'
import type {
  CalculatedPosition,
  TargetRect,
  TourStepDefinition as TourStep,
} from '../../engine/types'
import { calculateCardPosition, getCompoundTargetRect, getTargetRect, resolveTargets, scrollTargetIntoView } from '../../engine/dom'
import { useTour } from '../../context'

export interface TourStepRenderProps {
  /** Tour step configuration definition. */
  step: TourStep
  /** Zero-based index of the currently active step. */
  currentStepIndex: number
  /** Total count of tour steps. */
  totalSteps: number
  /** Whether the current step is the first step in the flow. */
  isFirst: boolean
  /** Whether the current step is the final step in the flow. */
  isLast: boolean
  /** Handler to advance to the next step. */
  next: () => void
  /** Handler to navigate back to the previous step. */
  prev: () => void
  /** Handler to jump directly to a step index. */
  goTo: (index: number) => void
  /** Handler to dismiss and skip the remaining tour steps. */
  skip: () => void
  /** Handler to finish and mark the tour as complete. */
  complete: () => void
  /** Handler to close the active tour dialog. */
  close: () => void
}

/* ==========================================================================
   Tour Slot Definitions
   ========================================================================== */

export interface TourSlots {
  /** Spotlight overlay component slot. */
  spotlight?: React.ComponentType<TourSpotlightProps>
  /** Tour card component slot. */
  card?: React.ComponentType<TourCardProps>
}

/* ==========================================================================
   Tour Props
   ========================================================================== */

export interface TourProps {
  /** Tour ID if connecting to a registered tour in TourProvider. */
  tourId?: string
  /** Explicit steps for standalone / uncontrolled / controlled usage. */
  steps?: TourStep[]
  /** Controlled open state. */
  open?: boolean
  /** Controlled open change callback. */
  onOpenChange?: (open: boolean) => void
  /** Controlled step index. */
  currentStep?: number
  /** Controlled step change callback. */
  onStepChange?: (stepIndex: number, step: TourStep) => void
  /** Callback fired on tour completion. */
  onComplete?: () => void
  /** Callback fired when tour is skipped/closed. */
  onSkip?: () => void
  /** Custom class name for the tour card. */
  className?: string
  /** Custom card width in pixels (default 360). */
  cardWidth?: number
  /** Custom slot components. */
  slots?: SlotComponents<TourSlots>
  /** Custom slot props map. */
  slotProps?: SlotPropsMap<TourSlots>
  /** Children elements (if any). */
  children?: React.ReactNode
}

const TourPrimitive = ({
  tourId,
  steps: propSteps,
  open: propOpen,
  onOpenChange,
  currentStep: propCurrentStep,
  onStepChange,
  onComplete,
  onSkip,
  className,
  cardWidth = 360,
  slots,
  slotProps,
}: TourProps) => {
  const [mounted, setMounted] = useState(false)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [cardDims, setCardDims] = useState({ width: cardWidth, height: 180 })
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null)

  let context: ReturnType<typeof useTour> | null = null
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    context = useTour()
  } catch {
    context = null
  }

  const [internalOpen, setInternalOpen] = useState(false)
  const [internalStepIndex, setInternalStepIndex] = useState(0)

  const isControlledOpen = propOpen !== undefined
  const isOpen = isControlledOpen
    ? propOpen
    : context && tourId
    ? context.isOpen && context.activeTourId === tourId
    : context && !tourId && !propSteps
    ? context.isOpen
    : internalOpen

  const steps = propSteps ?? (context?.activeTour?.steps || [])
  const totalSteps = steps.length

  const isControlledStep = propCurrentStep !== undefined
  const currentStepIndex = isControlledStep
    ? propCurrentStep
    : context && (tourId ? context.activeTourId === tourId : !propSteps)
    ? context.currentStepIndex
    : internalStepIndex

  const step: TourStep | undefined = steps[currentStepIndex]

  useEffect(() => {
    setMounted(true)
  }, [])

  const registeredTourIdRef = useRef<string>('')
  const engine = context?.engine

  useEffect(() => {
    if (tourId && propSteps && propSteps.length > 0 && engine) {
      if (registeredTourIdRef.current !== tourId) {
        registeredTourIdRef.current = tourId
        engine.registerTour({
          id: tourId,
          steps: propSteps,
        })
      }
    }
  }, [tourId, propSteps, engine])

  useEffect(() => {
    if (!isOpen) {
      setInternalStepIndex(0)
    }
  }, [isOpen])

  const updateTargetRect = React.useCallback(() => {
    if (!isOpen || !step) {
      setTargetRect(null)
      return
    }

    const targets = resolveTargets(step.target)
    if (targets.length === 0) {
      setTargetRect(null)
      return
    }
    const rect =
      targets.length === 1
        ? getTargetRect(targets[0], step.spotlightPadding ?? 8)
        : getCompoundTargetRect(targets, step.spotlightPadding ?? 8)
    setTargetRect(rect)
  }, [isOpen, step])

  useEffect(() => {
    if (!isOpen || !step) {
      setTargetRect(null)
      return
    }

    const targets = resolveTargets(step.target)
    if (!step.disableScroll && targets.length > 0 && targets[0]) {
      scrollTargetIntoView(targets[0])
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
  }, [isOpen, step, currentStepIndex, updateTargetRect])

  useEffect(() => {
    if (!isOpen || !step) return

    const handleScrollOrResize = () => {
      updateTargetRect()
    }

    window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true })
    window.addEventListener('resize', handleScrollOrResize, { passive: true })

    const targets = resolveTargets(step.target)
    const resizeObservers: ResizeObserver[] = []
    if (typeof ResizeObserver !== 'undefined') {
      targets.forEach((resolved) => {
        if (resolved instanceof Element) {
          const ro = new ResizeObserver(() => {
            updateTargetRect()
          })
          ro.observe(resolved)
          resizeObservers.push(ro)
        }
      })
    }

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true })
      window.removeEventListener('resize', handleScrollOrResize)
      resizeObservers.forEach((ro) => ro.disconnect())
    }
  }, [isOpen, step, updateTargetRect])

  useEffect(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setCardDims({ width: rect.width, height: rect.height })
      }
    }
  }, [step, currentStepIndex, isOpen, targetRect])

  if (!mounted || !isOpen || !step || totalSteps === 0) return null

  const handleNext = async () => {
    if (currentStepIndex + 1 >= totalSteps) {
      handleComplete()
    } else {
      await handleGoTo(currentStepIndex + 1)
    }
  }

  const handlePrev = async () => {
    if (currentStepIndex > 0) {
      await handleGoTo(currentStepIndex - 1)
    }
  }

  const handleGoTo = async (index: number) => {
    if (index < 0 || index >= totalSteps) return

    if (step.afterStep) {
      await step.afterStep()
    }

    const nextStep = steps[index]
    if (nextStep?.beforeStep) {
      await nextStep.beforeStep()
    }

    if (context && context.isOpen && (!tourId || context.activeTourId === tourId)) {
      context.goToStep(index)
    } else {
      if (!isControlledStep) {
        setInternalStepIndex(index)
      }
      onStepChange?.(index, nextStep!)
    }
  }

  const handleClose = () => {
    if (context) {
      context.closeTour()
    }
    if (!isControlledOpen) {
      setInternalOpen(false)
    }
    onOpenChange?.(false)
  }

  const handleSkip = () => {
    if (context) {
      context.skipTour()
    }
    onSkip?.()
    handleClose()
  }

  const handleComplete = () => {
    const effectiveTourId = tourId || context?.activeTourId || undefined
    if (context) {
      context.completeTour(effectiveTourId)
    }
    onComplete?.()
    handleClose()
  }

  const isFirst = currentStepIndex === 0
  const isLast = currentStepIndex === totalSteps - 1

  const renderProps: TourStepRenderProps = {
    step,
    currentStepIndex,
    totalSteps,
    isFirst,
    isLast,
    next: handleNext,
    prev: handlePrev,
    goTo: handleGoTo,
    skip: handleSkip,
    complete: handleComplete,
    close: handleClose,
  }

  const effectiveCardWidth = Math.min(
    cardWidth,
    (typeof window !== 'undefined' ? window.innerWidth : 1024) - 28
  )

  const pos: CalculatedPosition = calculateCardPosition(
    targetRect,
    Math.min(cardDims.width, effectiveCardWidth),
    cardDims.height,
    step.placement ?? 'bottom',
    step.offset ?? 14
  )

  const handleBackdropClick = () => {
    const behavior = step.backdropBehavior ?? 'block'
    if (behavior === 'next') {
      handleNext()
    } else if (behavior === 'close') {
      handleSkip()
    }
  }

  return (
    <>
      {/* Spotlight Backdrop & Mask */}
      {renderSlot(
        slots?.spotlight,
        {
          target: step.target,
          active: isOpen,
          padding: step.spotlightPadding ?? 8,
          radius: step.spotlightRadius ?? 'auto',
          variant: step.highlight ?? 'cutout',
          interactive: step.interactive ?? false,
          backdropBehavior: step.backdropBehavior ?? 'block',
          onBackdropClick: handleBackdropClick,
          onTargetClick: step.interactive ? undefined : handleNext,
          ...(slotProps?.spotlight as any),
        },
        { defaultComponent: TourSpotlight }
      )}

      {/* Floating Anchored Tour Card */}
      {createPortal(
        <div
          ref={cardRef}
          data-slot="tour-overlay-portal"
          className="fixed z-[9995] transition-all duration-300 ease-out"
          style={{
            top: `${pos.y}px`,
            left: `${pos.x}px`,
          }}
        >
          {typeof step.content === 'function' ? (
            step.content(renderProps)
          ) : step.content ? (
            renderSlot(
              slots?.card,
              {
                position: pos,
                showArrow: step.arrow ?? true,
                className,
                children: step.content,
                ...(slotProps?.card as any),
              },
              { defaultComponent: TourCard }
            )
          ) : (
            renderSlot(
              slots?.card,
              {
                position: pos,
                showArrow: step.arrow ?? true,
                className,
                children: (
                  <>
                    {/* Header */}
                    <TourCardHeader>
                      <div className="flex items-center gap-2 min-w-0">
                        {step.icon && <div className="shrink-0 text-primary">{step.icon}</div>}
                        <TourCardTitle>{step.title}</TourCardTitle>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {step.badge ? (
                          typeof step.badge === 'string' ? (
                            <Badge intent="primary" className="text-[10px] px-1.5 py-0 font-medium">
                              {step.badge}
                            </Badge>
                          ) : (
                            step.badge
                          )
                        ) : null}
                        <button
                          type="button"
                          onClick={handleSkip}
                          className="text-muted-fg hover:text-fg p-1 rounded-base transition-colors cursor-pointer hover:bg-muted"
                          aria-label="Close tour"
                        >
                          <XMarkIcon className="size-4" />
                        </button>
                      </div>
                    </TourCardHeader>

                    {/* Body */}
                    <TourCardBody>
                      {step.description && <TourCardDescription>{step.description}</TourCardDescription>}
                    </TourCardBody>

                    {/* Footer */}
                    <TourCardFooter>
                      <div className="flex items-center gap-3">
                        <TourCardDots
                          total={totalSteps}
                          current={currentStepIndex}
                          onChange={handleGoTo}
                        />
                        <TourCardProgress current={currentStepIndex} total={totalSteps} />
                      </div>

                      <div className="flex items-center gap-2">
                        {!isFirst && (
                          <Button
                            size="xs"
                            intent="outline"
                            onClick={handlePrev}
                            className="text-xs px-2.5"
                          >
                            <ChevronLeftIcon className="size-3.5 mr-0.5" />
                            Back
                          </Button>
                        )}

                        <Button
                          size="xs"
                          intent="primary"
                          onClick={handleNext}
                          className="text-xs px-3 font-semibold"
                        >
                          {isLast ? (
                            <>
                              Finish
                              <CheckIcon className="size-3.5 ml-1" />
                            </>
                          ) : (
                            <>
                              Next
                              <ChevronRightIcon className="size-3.5 ml-0.5" />
                            </>
                          )}
                        </Button>
                      </div>
                    </TourCardFooter>
                  </>
                ),
                ...(slotProps?.card as any),
              },
              { defaultComponent: TourCard }
            )
          )}
        </div>,
        document.body
      )}
    </>
  )
}

export const Tour = createInterfaceComponent<TourProps, TourSlots>(
  {
    name: 'Tour',
    category: 'onboarding',
    description: 'Complete guided product tour orchestrating step-by-step spotlights and floating cards.',
    version: '1.0.0',
    props: {
      cardWidth: 360,
    },
    slots: {
      spotlight: TourSpotlight,
      card: TourCard,
    },
  },
  TourPrimitive
)
