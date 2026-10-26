import { BaseEngine } from '../../../core/engine'
import {
  DEFAULT_STORAGE_KEY,
  LocalStorageAdapter,
  MemoryStorageAdapter,
  createDefaultPersistedState,
  parsePersistedState,
} from './storage'
import type {
  ChecklistItemDefinition,
  ChecklistProgress,
  ChecklistStorageAdapter,
  OnboardingChecklistDefinition,
  OnboardingEngineEventListener,
  OnboardingEngineEventMap,
  OnboardingEngineState,
  OnboardingTourDefinition,
  PersistedOnboardingState,
  TourStepDefinition,
} from './types'

export interface OnboardingEngineOptions {
  /** Initial registered tours */
  tours?: OnboardingTourDefinition[]
  /** Initial registered checklists */
  checklists?: OnboardingChecklistDefinition[]
  /** Storage key for persistence */
  storageKey?: string | null
  /** Custom storage adapter (defaults to LocalStorageAdapter or MemoryStorageAdapter in SSR) */
  storageAdapter?: ChecklistStorageAdapter
  /** Whether keyboard shortcuts (Arrow keys, Escape, Enter) are enabled when tours are active */
  enableKeyboard?: boolean
  /** Auto-save state mutations to storage adapter (default true) */
  autoSave?: boolean
}

export class OnboardingEngine extends BaseEngine<OnboardingEngineState> {
  private tours: Map<string, OnboardingTourDefinition> = new Map()
  private checklists: Map<string, OnboardingChecklistDefinition> = new Map()

  private storageKey: string | null
  private storageAdapter: ChecklistStorageAdapter
  private autoSave: boolean
  private enableKeyboard: boolean

  private completedTours: Set<string> = new Set()
  private completedTasks: Map<string, Set<string>> = new Map() // checklistId -> Set<taskId>
  private taskTimestamps: Map<string, number> = new Map() // taskId -> timestamp
  private dismissedChecklists: Set<string> = new Set()

  private keydownHandler: ((e: KeyboardEvent) => void) | null = null
  private destroyed: boolean = false

  constructor(options: OnboardingEngineOptions = {}) {
    super({
      activeTourId: null,
      currentStepIndex: 0,
      isOpen: false,
      completedTours: [],
      completedTasks: {},
      taskTimestamps: {},
      dismissedChecklists: [],
      activeChecklistId: null,
    })

    this.storageKey = options.storageKey === undefined ? DEFAULT_STORAGE_KEY : options.storageKey
    this.autoSave = options.autoSave ?? true
    this.enableKeyboard = options.enableKeyboard ?? true
    this.storageAdapter = options.storageAdapter ?? new LocalStorageAdapter()

    if (options.tours) {
      for (const tour of options.tours) {
        this.tours.set(tour.id, tour)
      }
    }

    if (options.checklists) {
      for (const cl of options.checklists) {
        this.checklists.set(cl.id, cl)
      }
      if (options.checklists.length > 0) {
        this.setState({ activeChecklistId: options.checklists[0]!.id })
      }
    }

    this.loadState()
    this.setupKeyboardListeners()
  }



  private syncStateSnapshot(): void {
    const completedTasksObj: Record<string, string[]> = {}
    for (const [k, v] of this.completedTasks.entries()) {
      completedTasksObj[k] = Array.from(v)
    }

    const taskTimestampsObj: Record<string, number> = {}
    for (const [k, v] of this.taskTimestamps.entries()) {
      taskTimestampsObj[k] = v
    }

    this.setState({
      completedTours: Array.from(this.completedTours),
      completedTasks: completedTasksObj,
      taskTimestamps: taskTimestampsObj,
      dismissedChecklists: Array.from(this.dismissedChecklists),
    })
  }

  private isTourStructurallyEqual(a?: OnboardingTourDefinition, b?: OnboardingTourDefinition): boolean {
    if (!a || !b) return a === b
    if (a.id !== b.id || a.title !== b.title || a.description !== b.description) return false
    if ((a.steps?.length || 0) !== (b.steps?.length || 0)) return false
    for (let i = 0; i < a.steps.length; i++) {
      if (a.steps[i]?.id !== b.steps[i]?.id || a.steps[i]?.title !== b.steps[i]?.title) {
        return false
      }
    }
    return true
  }

  private isChecklistStructurallyEqual(a?: OnboardingChecklistDefinition, b?: OnboardingChecklistDefinition): boolean {
    if (!a || !b) return a === b
    if (a.id !== b.id || a.title !== b.title || a.description !== b.description) return false
    if ((a.items?.length || 0) !== (b.items?.length || 0)) return false
    for (let i = 0; i < a.items.length; i++) {
      if (
        a.items[i]?.id !== b.items[i]?.id ||
        a.items[i]?.weight !== b.items[i]?.weight ||
        a.items[i]?.title !== b.items[i]?.title
      ) {
        return false
      }
    }
    return true
  }

  // ─── Tour Management API ───────────────────────────────────────────────────────

  public registerTour(tour: OnboardingTourDefinition): this {
    this.tours.set(tour.id, tour)
    return this
  }

  public registerTours(tours: OnboardingTourDefinition[]): this {
    for (const t of tours) {
      this.tours.set(t.id, t)
    }
    return this
  }

  public unregisterTour(tourId: string): boolean {
    const res = this.tours.delete(tourId)
    if (res) this.syncStateSnapshot()
    return res
  }

  public getTour(tourId: string): OnboardingTourDefinition | undefined {
    return this.tours.get(tourId)
  }

  public getAllTours(): OnboardingTourDefinition[] {
    return Array.from(this.tours.values())
  }

  public async startTour(tourOrId: string | OnboardingTourDefinition, startStepIndex: number = 0): Promise<void> {
    let tour: OnboardingTourDefinition | undefined
    if (typeof tourOrId === 'string') {
      tour = this.tours.get(tourOrId)
      if (!tour) {
        console.warn(`[OnboardingEngine] Tour "${tourOrId}" is not registered.`)
        return
      }
    } else {
      tour = tourOrId
      this.tours.set(tour.id, tour)
    }

    const steps = tour.steps || []
    if (steps.length === 0) return

    const validIndex = Math.max(0, Math.min(startStepIndex, steps.length - 1))
    const firstStep = steps[validIndex]

    if (firstStep?.beforeStep) {
      await firstStep.beforeStep()
    }

    this.setState({
      activeTourId: tour.id,
      currentStepIndex: validIndex,
      isOpen: true,
    })

    this.emit('tour:start', { tourId: tour.id, tour, stepIndex: validIndex })
    this.emit('tour:step', {
      tourId: tour.id,
      tour,
      step: firstStep!,
      stepIndex: validIndex,
      totalSteps: steps.length,
    })
  }

  public async nextStep(): Promise<void> {
    const tour = this.getActiveTour()
    if (!tour || !this.state.isOpen) return

    const steps = tour.steps || []
    const currentStep = steps[this.state.currentStepIndex]

    if (currentStep?.afterStep) {
      await currentStep.afterStep()
    }

    if (currentStep?.nextStep !== undefined) {
      let resolvedNext: number | string | void
      if (typeof currentStep.nextStep === 'function') {
        resolvedNext = currentStep.nextStep(this)
      } else {
        resolvedNext = currentStep.nextStep
      }

      if (typeof resolvedNext === 'number') {
        await this.goToStep(resolvedNext)
        return
      } else if (typeof resolvedNext === 'string') {
        const targetIndex = steps.findIndex((s) => s.id === resolvedNext)
        if (targetIndex !== -1) {
          await this.goToStep(targetIndex)
          return
        }
      }
    }

    if (this.state.currentStepIndex + 1 >= steps.length) {
      this.completeTour(tour.id)
    } else {
      await this.goToStep(this.state.currentStepIndex + 1)
    }
  }

  public async prevStep(): Promise<void> {
    if (this.state.currentStepIndex > 0) {
      await this.goToStep(this.state.currentStepIndex - 1)
    }
  }

  public async goToStep(index: number): Promise<void> {
    const tour = this.getActiveTour()
    if (!tour || !this.state.isOpen) return

    const steps = tour.steps || []
    if (index < 0 || index >= steps.length) return

    const nextStep = steps[index]
    if (nextStep?.beforeStep) {
      await nextStep.beforeStep()
    }

    this.setState({ currentStepIndex: index })
    tour.onStepChange?.(index, nextStep!)

    this.emit('tour:step', {
      tourId: tour.id,
      tour,
      step: nextStep!,
      stepIndex: index,
      totalSteps: steps.length,
    })
  }

  public closeTour(): void {
    const tourId = this.state.activeTourId
    this.setState({
      isOpen: false,
      activeTourId: null,
      currentStepIndex: 0,
    })

    this.emit('tour:close', { tourId })
  }

  public skipTour(): void {
    const tour = this.getActiveTour()
    const stepIndex = this.state.currentStepIndex
    const tourId = this.state.activeTourId

    if (tour) {
      tour.onSkip?.()
      this.emit('tour:skip', { tourId: tour.id, tour, stepIndex })
    }

    this.closeTour()
  }

  public completeTour(tourId?: string): void {
    const id = tourId || this.state.activeTourId
    if (!id) return

    const tour = this.tours.get(id)
    this.completedTours.add(id)

    // Mark all tasks with this tourId as completed across all checklists
    for (const [clId, cl] of this.checklists.entries()) {
      for (const item of cl.items) {
        if (item.tourId === id) {
          const set = this.completedTasks.get(clId) || new Set<string>()
          set.add(item.id)
          this.completedTasks.set(clId, set)
          this.taskTimestamps.set(item.id, Date.now())
        }
      }
    }

    this.syncStateSnapshot()
    this.saveState()

    if (tour) {
      tour.onComplete?.()
      this.emit('tour:complete', { tourId: id, tour })
    }

    if (this.state.activeTourId === id) {
      this.closeTour()
    }
  }

  public resetTour(tourId: string): void {
    this.completedTours.delete(tourId)

    // Also reset completion for tasks referencing this tourId
    for (const [clId, cl] of this.checklists.entries()) {
      for (const item of cl.items) {
        if (item.tourId === tourId) {
          const set = this.completedTasks.get(clId)
          if (set) {
            set.delete(item.id)
          }
          this.taskTimestamps.delete(item.id)
        }
      }
    }

    this.syncStateSnapshot()
    this.saveState()
    this.emit('tour:reset', { tourId })
  }

  public isTourCompleted(tourId: string): boolean {
    return this.completedTours.has(tourId)
  }

  public getActiveTour(): OnboardingTourDefinition | null {
    if (!this.state.activeTourId) return null
    return this.tours.get(this.state.activeTourId) || null
  }

  public getActiveStep(): TourStepDefinition | null {
    const tour = this.getActiveTour()
    if (!tour || !this.state.isOpen) return null
    return tour.steps[this.state.currentStepIndex] || null
  }

  // ─── Checklist Management API ──────────────────────────────────────────────────

  public registerChecklist(checklist: OnboardingChecklistDefinition): this {
    this.checklists.set(checklist.id, checklist)
    if (!this.state.activeChecklistId) {
      this.setState({ activeChecklistId: checklist.id })
    }
    return this
  }

  public registerChecklists(checklists: OnboardingChecklistDefinition[]): this {
    for (const c of checklists) {
      this.checklists.set(c.id, c)
    }
    if (!this.state.activeChecklistId && checklists.length > 0) {
      this.setState({ activeChecklistId: checklists[0]!.id })
    }
    return this
  }

  public unregisterChecklist(checklistId: string): boolean {
    const res = this.checklists.delete(checklistId)
    if (this.state.activeChecklistId === checklistId) {
      this.setState({ activeChecklistId: this.checklists.keys().next().value || null })
    }
    if (res) this.syncStateSnapshot()
    return res
  }

  public getChecklist(checklistId?: string): OnboardingChecklistDefinition | undefined {
    const id = checklistId || this.state.activeChecklistId || this.checklists.keys().next().value
    return id ? this.checklists.get(id) : undefined
  }

  public getAllChecklists(): OnboardingChecklistDefinition[] {
    return Array.from(this.checklists.values())
  }

  public completeTask(taskId: string, checklistId?: string): void {
    const clId = checklistId || this.findChecklistIdForTask(taskId) || this.state.activeChecklistId || 'default'
    if (!this.completedTasks.has(clId)) {
      this.completedTasks.set(clId, new Set())
    }

    const set = this.completedTasks.get(clId)!
    if (!set.has(taskId)) {
      set.add(taskId)
      this.taskTimestamps.set(taskId, Date.now())
      this.syncStateSnapshot()
      this.saveState()

      const cl = this.checklists.get(clId)
      const item = cl?.items.find((i) => i.id === taskId)
      const progress = this.getProgress(clId)

      if (cl && item) {
        cl.onItemComplete?.(item)
      }

      this.emit('checklist:itemCompleted', { checklistId: clId, itemId: taskId, item, progress })

      if (progress.isAllCompleted && cl) {
        cl.onAllComplete?.()
        this.emit('checklist:allCompleted', { checklistId: clId, checklist: cl })
      }
    }
  }

  public uncompleteTask(taskId: string, checklistId?: string): void {
    const clId = checklistId || this.findChecklistIdForTask(taskId) || this.state.activeChecklistId || 'default'
    const set = this.completedTasks.get(clId)
    if (set && set.has(taskId)) {
      set.delete(taskId)
      this.taskTimestamps.delete(taskId)
      this.syncStateSnapshot()
      this.saveState()

      const cl = this.checklists.get(clId)
      const item = cl?.items.find((i) => i.id === taskId)
      const progress = this.getProgress(clId)

      this.emit('checklist:itemUncompleted', { checklistId: clId, itemId: taskId, item, progress })
    }
  }

  public toggleTask(taskId: string, checklistId?: string): void {
    if (this.isTaskCompleted(taskId, checklistId)) {
      this.uncompleteTask(taskId, checklistId)
    } else {
      this.completeTask(taskId, checklistId)
    }
  }

  public setTaskDone(taskId: string, isDone: boolean = true, checklistId?: string): void {
    if (isDone) {
      this.completeTask(taskId, checklistId)
    } else {
      this.uncompleteTask(taskId, checklistId)
    }
  }

  public isTaskCompleted(taskId: string, checklistId?: string): boolean {
    const clId = checklistId || this.findChecklistIdForTask(taskId) || this.state.activeChecklistId || 'default'
    const cl = this.checklists.get(clId)
    const item = cl?.items.find((i) => i.id === taskId)

    if (item?.isCompleted !== undefined) {
      const isDone = typeof item.isCompleted === 'function' ? item.isCompleted() : Boolean(item.isCompleted)
      if (isDone) return true
    }

    if (item?.tourId && this.isTourCompleted(item.tourId)) {
      return true
    }

    const set = this.completedTasks.get(clId)
    if (set && set.has(taskId)) {
      return true
    }

    for (const taskSet of this.completedTasks.values()) {
      if (taskSet.has(taskId)) {
        return true
      }
    }

    for (const checklist of this.checklists.values()) {
      const found = checklist.items.find((i) => i.id === taskId)
      if (found?.tourId && this.isTourCompleted(found.tourId)) {
        return true
      }
    }

    return false
  }

  public getTaskCompletedAt(taskId: string): number | null {
    return this.taskTimestamps.get(taskId) ?? null
  }

  public getProgress(checklistId?: string): ChecklistProgress {
    const cl = this.getChecklist(checklistId)
    const items = cl?.items || []

    if (items.length === 0) {
      return {
        total: 0,
        completed: 0,
        totalWeight: 0,
        completedWeight: 0,
        percentage: 0,
        remaining: 0,
        isAllCompleted: false,
        requiredTotal: 0,
        requiredCompleted: 0,
        isRequiredCompleted: true,
      }
    }

    const clId = cl?.id || 'default'
    let completed = 0
    let totalWeight = 0
    let completedWeight = 0
    let requiredTotal = 0
    let requiredCompleted = 0

    for (const item of items) {
      const weight = item.weight && item.weight > 0 ? item.weight : 1
      totalWeight += weight

      const isDone = this.isTaskCompleted(item.id, clId)
      if (isDone) {
        completed++
        completedWeight += weight
      }

      if (item.isRequired) {
        requiredTotal++
        if (isDone) requiredCompleted++
      }
    }

    const percentage = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0
    const isAllCompleted = completed === items.length
    const isRequiredCompleted = requiredTotal === 0 || requiredCompleted === requiredTotal

    return {
      total: items.length,
      completed,
      totalWeight,
      completedWeight,
      percentage,
      remaining: items.length - completed,
      isAllCompleted,
      requiredTotal,
      requiredCompleted,
      isRequiredCompleted,
    }
  }

  public trackAction(actionKey: string, payload?: any): string[] {
    const matchedTaskIds: string[] = []

    for (const [clId, cl] of this.checklists.entries()) {
      for (const item of cl.items) {
        let isMatch = false
        if (item.triggerOn) {
          if (typeof item.triggerOn === 'string' && item.triggerOn === actionKey) {
            isMatch = true
          } else if (Array.isArray(item.triggerOn) && item.triggerOn.includes(actionKey)) {
            isMatch = true
          } else if (typeof item.triggerOn === 'function' && item.triggerOn(actionKey, payload)) {
            isMatch = true
          }
        } else if (item.id === actionKey) {
          isMatch = true
        }

        if (isMatch) {
          this.completeTask(item.id, clId)
          matchedTaskIds.push(item.id)
        }
      }
    }

    this.emit('action:tracked', { actionKey, payload, completedTaskIds: matchedTaskIds })
    return matchedTaskIds
  }

  public dismissChecklist(checklistId?: string): void {
    const id = checklistId || this.state.activeChecklistId || 'default'
    this.dismissedChecklists.add(id)
    this.syncStateSnapshot()
    this.saveState()
    this.emit('checklist:dismissed', { checklistId: id })
  }

  public undismissChecklist(checklistId?: string): void {
    const id = checklistId || this.state.activeChecklistId || 'default'
    this.dismissedChecklists.delete(id)
    this.syncStateSnapshot()
    this.saveState()
    this.emit('checklist:undismissed', { checklistId: id })
  }

  public isChecklistDismissed(checklistId?: string): boolean {
    const id = checklistId || this.state.activeChecklistId || 'default'
    return this.dismissedChecklists.has(id)
  }

  public resetChecklist(checklistId?: string): void {
    const id = checklistId || this.state.activeChecklistId || 'default'
    const cl = this.checklists.get(id)
    if (cl) {
      for (const item of cl.items) {
        if (item.tourId) {
          this.completedTours.delete(item.tourId)
        }
      }
    }
    const tasks = this.completedTasks.get(id)
    if (tasks) {
      for (const tId of tasks) {
        this.taskTimestamps.delete(tId)
      }
      tasks.clear()
    }
    this.syncStateSnapshot()
    this.saveState()
    this.emit('checklist:reset', { checklistId: id })
  }

  // ─── State Management & Serialization ──────────────────────────────────────────

  public exportState(): PersistedOnboardingState {
    return {
      completedTours: this.state.completedTours,
      completedTasks: this.state.completedTasks,
      taskTimestamps: this.state.taskTimestamps,
      dismissedChecklists: this.state.dismissedChecklists,
    }
  }

  public importState(persisted: Partial<PersistedOnboardingState>): void {
    if (persisted.completedTours) {
      this.completedTours = new Set(persisted.completedTours)
    }
    if (persisted.completedTasks) {
      this.completedTasks.clear()
      for (const [k, v] of Object.entries(persisted.completedTasks)) {
        this.completedTasks.set(k, new Set(v))
      }
    }
    if (persisted.taskTimestamps) {
      this.taskTimestamps.clear()
      for (const [k, v] of Object.entries(persisted.taskTimestamps)) {
        this.taskTimestamps.set(k, v)
      }
    }
    if (persisted.dismissedChecklists) {
      this.dismissedChecklists = new Set(persisted.dismissedChecklists)
    }

    this.syncStateSnapshot()
    this.saveState()
  }

  public resetAll(): void {
    this.completedTours.clear()
    this.completedTasks.clear()
    this.taskTimestamps.clear()
    this.dismissedChecklists.clear()
    this.closeTour()
    this.syncStateSnapshot()
    this.saveState()
  }

  private saveState(): void {
    if (!this.autoSave || !this.storageKey) return

    const payload = this.exportState()
    const serialized = JSON.stringify(payload)
    const res = this.storageAdapter.setItem(this.storageKey, serialized)
    if (res instanceof Promise) {
      res.catch((e) => console.warn('[OnboardingEngine] Async storage setItem failed:', e))
    }
  }

  private loadState(): void {
    if (!this.storageKey) return

    const rawOrPromise = this.storageAdapter.getItem(this.storageKey)
    if (rawOrPromise instanceof Promise) {
      rawOrPromise
        .then((raw) => {
          if (raw) {
            const parsed = parsePersistedState(raw)
            this.importState(parsed)
          }
        })
        .catch((e) => console.warn('[OnboardingEngine] Async storage getItem failed:', e))
      return
    }

    if (rawOrPromise) {
      const parsed = parsePersistedState(rawOrPromise)
      this.importState(parsed)
    }
  }

  private findChecklistIdForTask(taskId: string): string | null {
    for (const [id, cl] of this.checklists.entries()) {
      if (cl.items.some((i) => i.id === taskId)) {
        return id
      }
    }
    return null
  }

  private setupKeyboardListeners(): void {
    if (typeof window === 'undefined' || !this.enableKeyboard) return

    this.keydownHandler = (e: KeyboardEvent) => {
      if (!this.state.isOpen || !this.state.activeTourId) return

      if (e.key === 'Escape') {
        e.preventDefault()
        this.skipTour()
      } else if (e.key === 'ArrowRight' || (e.key === 'Enter' && !e.shiftKey)) {
        const active = document.activeElement
        if (
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement ||
          active?.getAttribute('contenteditable') === 'true'
        ) {
          return
        }
        e.preventDefault()
        this.nextStep()
      } else if (e.key === 'ArrowLeft') {
        const active = document.activeElement
        if (
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement ||
          active?.getAttribute('contenteditable') === 'true'
        ) {
          return
        }
        e.preventDefault()
        this.prevStep()
      }
    }

    window.addEventListener('keydown', this.keydownHandler)
  }

  public override destroy(): void {
    if (this.destroyed) return
    this.destroyed = true

    if (this.keydownHandler && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.keydownHandler)
      this.keydownHandler = null
    }

    this.tours.clear()
    this.checklists.clear()
    super.destroy()
  }
}

export function createOnboardingEngine(options?: OnboardingEngineOptions): OnboardingEngine {
  return new OnboardingEngine(options)
}
