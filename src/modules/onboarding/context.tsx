import React, { createContext, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import {
  OnboardingEngine,
  createOnboardingEngine,
  type OnboardingEngineOptions,
} from './engine/onboarding-engine'
import type {
  ChecklistItemDefinition as ChecklistItem,
  ChecklistProgress,
  ChecklistStorageAdapter,
  OnboardingChecklistDefinition as OnboardingChecklist,
  OnboardingTourDefinition as OnboardingTour,
  TourStepDefinition as TourStep,
} from './engine/types'

export interface TourContextValue {
  /** Currently active tour ID or null. */
  activeTourId: string | null
  /** Currently active tour configuration or null. */
  activeTour: OnboardingTour | null
  /** Current step index (0-based). */
  currentStepIndex: number
  /** Total steps in active tour. */
  totalSteps: number
  /** Current step object. */
  currentStep: TourStep | null
  /** Whether a tour is currently active/open. */
  isOpen: boolean
  /** Start a registered tour by ID or on-the-fly definition. */
  startTour: (tourOrId: string | OnboardingTour, startStepIndex?: number) => void
  /** Close / dismiss current tour. */
  closeTour: () => void
  /** Advance to next step. */
  nextStep: () => void
  /** Return to previous step. */
  prevStep: () => void
  /** Jump to a specific step index. */
  goToStep: (index: number) => void
  /** Skip current tour. */
  skipTour: () => void
  /** Complete current tour or specified tourId. */
  completeTour: (tourId?: string) => void
  /** Register tours into the provider. */
  registerTour: (tour: OnboardingTour) => void
  /** Check if a tour has been completed (via storage or state). */
  isTourCompleted: (tourId: string) => boolean
  /** Reset completion status for a tour. */
  resetTour: (tourId: string) => void
  /** List of all completed tour IDs. */
  completedTours: string[]

  // ─── Checklist Engine State & Methods ──────────────────────────────────────────
  /** Completed tasks grouped by checklist ID. */
  completedTasks: Record<string, string[]>
  /** Completion timestamps for tasks. */
  taskTimestamps: Record<string, number>
  /** Dismissed checklist IDs. */
  dismissedChecklists: string[]
  /** Registered checklists. */
  checklists: Record<string, OnboardingChecklist>
  /** Active primary checklist ID or null. */
  activeChecklistId: string | null
  /** Register a checklist definition. */
  registerChecklist: (checklist: OnboardingChecklist) => void
  /** Mark a checklist item as completed. */
  completeChecklistItem: (itemId: string, checklistId?: string) => void
  /** Direct alias to complete any task/item. */
  completeTask: (taskId: string, checklistId?: string) => void
  /** Unmark a checklist item. */
  uncompleteChecklistItem: (itemId: string, checklistId?: string) => void
  /** Direct alias to uncomplete a task. */
  uncompleteTask: (taskId: string, checklistId?: string) => void
  /** Toggle or set completion status of a task/item. */
  toggleChecklistItem: (itemId: string, checklistId?: string) => void
  /** Set explicit done state for a task. */
  setTaskDone: (taskId: string, isDone?: boolean, checklistId?: string) => void
  /** Action tracker for parent app events. */
  trackAction: (actionKey: string, payload?: any) => void
  /** Check if a specific checklist item is completed. */
  isChecklistItemCompleted: (itemId: string, checklistId?: string) => boolean
  /** Calculate live weighted progress metrics for a checklist. */
  getChecklistProgress: (checklistId?: string) => ChecklistProgress
  /** Dismiss checklist widget. */
  dismissChecklist: (checklistId?: string) => void
  /** Re-show / un-dismiss checklist widget. */
  undismissChecklist: (checklistId?: string) => void
  /** Check if a checklist is dismissed. */
  isChecklistDismissed: (checklistId?: string) => boolean
  /** Reset all checklist item completions. */
  resetChecklist: (checklistId?: string) => void
  /** Force re-evaluation of reactive getter states. */
  refreshChecklists: () => void
}

export type OnboardingContextValue = TourContextValue

export interface ExtendedTourContextValue extends TourContextValue {
  /** The underlying pure framework-agnostic OnboardingEngine instance. */
  engine: OnboardingEngine
}

const OnboardingContext = createContext<ExtendedTourContextValue | null>(null)

export function useTour(): ExtendedTourContextValue {
  const ctx = useContext(OnboardingContext)
  if (!ctx) {
    throw new Error('useTour must be used within an <OnboardingProvider> or <TourProvider>')
  }
  return ctx
}

export const useOnboarding = useTour

export function useChecklist(checklistId?: string) {
  const ctx = useTour()
  const targetId = checklistId || ctx.activeChecklistId || Object.keys(ctx.checklists)[0] || 'default'
  const checklist = ctx.checklists[targetId]

  const progress = useMemo(() => {
    return ctx.getChecklistProgress(targetId)
  }, [ctx, targetId])

  const isDismissed = ctx.isChecklistDismissed(targetId)

  return {
    checklist,
    progress,
    isDismissed,
    completeItem: (itemId: string) => ctx.completeChecklistItem(itemId, targetId),
    completeTask: (taskId: string) => ctx.completeTask(taskId, targetId),
    uncompleteItem: (itemId: string) => ctx.uncompleteChecklistItem(itemId, targetId),
    uncompleteTask: (taskId: string) => ctx.uncompleteTask(taskId, targetId),
    toggleItem: (itemId: string) => ctx.toggleChecklistItem(itemId, targetId),
    setTaskDone: (taskId: string, isDone?: boolean) => ctx.setTaskDone(taskId, isDone, targetId),
    trackAction: (actionKey: string, payload?: any) => ctx.trackAction(actionKey, payload),
    isCompleted: (itemId: string) => ctx.isChecklistItemCompleted(itemId, targetId),
    dismiss: () => ctx.dismissChecklist(targetId),
    undismiss: () => ctx.undismissChecklist(targetId),
    reset: () => ctx.resetChecklist(targetId),
    refresh: () => ctx.refreshChecklists(),
    engine: ctx.engine,
  }
}

export interface OnboardingProviderProps {
  /** Optional custom OnboardingEngine instance to bind. */
  engine?: OnboardingEngine
  /** Optional generic options passed when auto-constructing engine. */
  options?: OnboardingEngineOptions & Record<string, unknown>
  /** Pre-registered tours. */
  tours?: OnboardingTour[]
  /** Pre-registered checklists. */
  checklists?: OnboardingChecklist[]
  /** Storage key for persisting completed tours & checklists in localStorage. */
  storageKey?: string | null
  /** Custom storage adapter for persisting state to API/backend. */
  storageAdapter?: ChecklistStorageAdapter
  /** Whether keyboard navigation (Arrow keys, Enter, Escape) is enabled (default true). */
  enableKeyboard?: boolean
  children: React.ReactNode
}

export function OnboardingProvider({
  engine: propEngine,
  options,
  tours = [],
  checklists = [],
  storageKey = 'consona_onboarding_state',
  storageAdapter,
  enableKeyboard = true,
  children,
}: OnboardingProviderProps) {
  const engineRef = useRef<OnboardingEngine | null>(null)

  if (!engineRef.current) {
    if (propEngine) {
      engineRef.current = propEngine
    } else {
      engineRef.current = createOnboardingEngine({
        tours: options?.tours ?? tours,
        checklists: options?.checklists ?? checklists,
        storageKey: options?.storageKey ?? storageKey,
        storageAdapter: options?.storageAdapter ?? storageAdapter,
        enableKeyboard: options?.enableKeyboard ?? enableKeyboard,
      })
    }
  }

  const engine = engineRef.current!

  useEffect(() => {
    if (tours && tours.length > 0) {
      engine.registerTours(tours)
    }
    if (checklists && checklists.length > 0) {
      engine.registerChecklists(checklists)
    }
  }, [tours, checklists, engine])

  const engineState = useSyncExternalStore(
    (callback) => engine.subscribe(callback),
    () => engine.getState(),
    () => engine.getState()
  )

  const activeTour = engine.getActiveTour() as OnboardingTour | null
  const currentStep = engine.getActiveStep() as TourStep | null
  const totalSteps = activeTour?.steps?.length || 0

  const checklistsMap = useMemo(() => {
    const map: Record<string, OnboardingChecklist> = {}
    for (const c of engine.getAllChecklists()) {
      map[c.id] = c as OnboardingChecklist
    }
    return map
  }, [engine, engineState])

  const contextValue: ExtendedTourContextValue = useMemo(() => {
    return {
      engine,
      activeTourId: engineState.activeTourId,
      activeTour,
      currentStepIndex: engineState.currentStepIndex,
      totalSteps,
      currentStep,
      isOpen: engineState.isOpen,

      startTour: (tourOrId, startStepIndex) => engine.startTour(tourOrId as any, startStepIndex),
      closeTour: () => engine.closeTour(),
      nextStep: () => engine.nextStep(),
      prevStep: () => engine.prevStep(),
      goToStep: (index) => engine.goToStep(index),
      skipTour: () => engine.skipTour(),
      completeTour: (tourId) => engine.completeTour(tourId),
      registerTour: (tour) => engine.registerTour(tour as any),
      isTourCompleted: (tourId) => engine.isTourCompleted(tourId),
      resetTour: (tourId) => engine.resetTour(tourId),
      completedTours: engineState.completedTours,

      completedTasks: engineState.completedTasks,
      taskTimestamps: engineState.taskTimestamps,
      dismissedChecklists: engineState.dismissedChecklists,
      checklists: checklistsMap,
      activeChecklistId: engineState.activeChecklistId,
      registerChecklist: (checklist) => engine.registerChecklist(checklist as any),
      completeChecklistItem: (itemId, checklistId) => engine.completeTask(itemId, checklistId),
      completeTask: (taskId, checklistId) => engine.completeTask(taskId, checklistId),
      uncompleteChecklistItem: (itemId, checklistId) => engine.uncompleteTask(itemId, checklistId),
      uncompleteTask: (taskId, checklistId) => engine.uncompleteTask(taskId, checklistId),
      toggleChecklistItem: (itemId, checklistId) => engine.toggleTask(itemId, checklistId),
      setTaskDone: (taskId, isDone, checklistId) => engine.setTaskDone(taskId, isDone, checklistId),
      trackAction: (actionKey, payload) => engine.trackAction(actionKey, payload),
      isChecklistItemCompleted: (itemId, checklistId) => engine.isTaskCompleted(itemId, checklistId),
      getChecklistProgress: (checklistId) => engine.getProgress(checklistId),
      dismissChecklist: (checklistId) => engine.dismissChecklist(checklistId),
      undismissChecklist: (checklistId) => engine.undismissChecklist(checklistId),
      isChecklistDismissed: (checklistId) => engine.isChecklistDismissed(checklistId),
      resetChecklist: (checklistId) => engine.resetChecklist(checklistId),
      refreshChecklists: () => {
        engine.getState()
      },
    }
  }, [engine, engineState, activeTour, currentStep, totalSteps, checklistsMap])

  return <OnboardingContext.Provider value={contextValue}>{children}</OnboardingContext.Provider>
}

export const TourProvider = OnboardingProvider
