import { useEffect, useRef, useSyncExternalStore } from 'react'
import { OnboardingEngine, type OnboardingEngineOptions } from '../engine/onboarding-engine'
import type { ChecklistProgress, OnboardingEngineState, OnboardingTourDefinition, TourStepDefinition } from '../engine/types'

let defaultSingletonEngine: OnboardingEngine | null = null

export function getGlobalOnboardingEngine(): OnboardingEngine {
  if (!defaultSingletonEngine) {
    defaultSingletonEngine = new OnboardingEngine()
  }
  return defaultSingletonEngine
}

/**
 * Hook to initialize and manage an OnboardingEngine instance.
 */
export function useOnboardingEngine(options?: OnboardingEngineOptions): OnboardingEngine {
  const engineRef = useRef<OnboardingEngine | null>(null)

  if (!engineRef.current) {
    engineRef.current = new OnboardingEngine(options)
  }

  // Update dynamic options if needed
  useEffect(() => {
    if (options?.tours) {
      engineRef.current?.registerTours(options.tours)
    }
    if (options?.checklists) {
      engineRef.current?.registerChecklists(options.checklists)
    }
  }, [options?.tours, options?.checklists])

  useEffect(() => {
    return () => {
      // Only destroy if it was locally created and not the global singleton
      if (engineRef.current && engineRef.current !== defaultSingletonEngine) {
        engineRef.current.destroy()
      }
    }
  }, [])

  return engineRef.current
}

/**
 * Hook to subscribe to an OnboardingEngine's state with useSyncExternalStore.
 */
export function useOnboardingState(engine: OnboardingEngine): OnboardingEngineState {
  return useSyncExternalStore(
    (callback) => engine.subscribe(callback),
    () => engine.getState(),
    () => engine.getState()
  )
}

/**
 * Hook for subscribing to a specific checklist's progress.
 */
export function useChecklistProgress(engine: OnboardingEngine, checklistId?: string): ChecklistProgress {
  useOnboardingState(engine)
  return engine.getProgress(checklistId)
}

/**
 * Hook for controlling a specific tour through the engine.
 */
export function useTourEngine(engine: OnboardingEngine, tourId?: string) {
  const state = useOnboardingState(engine)

  const isTourActive = state.isOpen && (tourId ? state.activeTourId === tourId : state.activeTourId !== null)
  const activeTour: OnboardingTourDefinition | null = isTourActive ? engine.getActiveTour() : null
  const currentStep: TourStepDefinition | null = isTourActive ? engine.getActiveStep() : null

  return {
    isOpen: isTourActive,
    activeTourId: state.activeTourId,
    activeTour,
    currentStepIndex: state.currentStepIndex,
    currentStep,
    totalSteps: activeTour?.steps?.length || 0,
    isCompleted: tourId ? engine.isTourCompleted(tourId) : false,
    start: (startStepIndex?: number) => {
      if (tourId) engine.startTour(tourId, startStepIndex)
    },
    next: () => engine.nextStep(),
    prev: () => engine.prevStep(),
    goTo: (index: number) => engine.goToStep(index),
    close: () => engine.closeTour(),
    skip: () => engine.skipTour(),
    complete: () => engine.completeTour(tourId),
    reset: () => {
      if (tourId) engine.resetTour(tourId)
    },
  }
}
