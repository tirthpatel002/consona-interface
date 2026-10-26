import type {
  CalculatedPosition,
  TargetRect,
  CutoutRadius,
  OverlayPlacement as TourPlacement,
  BackdropVariant as TourHighlightVariant,
  BackdropBehavior as TourBackdropBehavior,
  OverlayTargetResolver as TourTargetResolver,
} from '../../overlay/engine/types'

export type {
  CalculatedPosition,
  TargetRect,
  CutoutRadius,
  TourPlacement,
  TourHighlightVariant,
  TourBackdropBehavior,
  TourTargetResolver,
}

export interface TourStepDefinition<TMeta = Record<string, any>> {
  id?: string
  title?: any
  description?: any
  target?: TourTargetResolver
  placement?: TourPlacement
  highlight?: TourHighlightVariant
  spotlightPadding?: number
  spotlightRadius?: CutoutRadius
  interactive?: boolean
  badge?: any
  icon?: any
  arrow?: boolean
  offset?: number
  disableScroll?: boolean
  backdropBehavior?: TourBackdropBehavior
  /** Dynamic check if this step should be skipped or displayed */
  shouldShow?: (engine: any) => boolean | Promise<boolean>
  /** Dynamic next step resolver (step ID or index) */
  nextStep?: number | string | ((engine: any) => number | string | void)
  /** Hook fired before step is displayed */
  beforeStep?: () => void | Promise<void>
  /** Hook fired after step is completed or advanced */
  afterStep?: () => void | Promise<void>
  meta?: TMeta
  content?: any
}

export interface OnboardingTourDefinition<TMeta = Record<string, any>> {
  id: string
  steps: TourStepDefinition<TMeta>[]
  title?: string
  description?: string
  onComplete?: () => void
  onSkip?: () => void
  onStepChange?: (index: number, step: TourStepDefinition<TMeta>) => void
  meta?: TMeta
}

export interface ChecklistActionDefinition {
  label: string
  onClick?: () => void | Promise<void>
  href?: string
  intent?: 'primary' | 'secondary' | 'outline' | 'plain'
}

export type ActionTriggerPredicate = string | string[] | ((actionKey: string, payload?: any) => boolean)

export interface ChecklistItemDefinition<TMeta = Record<string, any>> {
  id: string
  title: any
  description?: any
  weight?: number
  badge?: any
  icon?: any
  tourId?: string
  triggerOn?: ActionTriggerPredicate
  target?: TourTargetResolver
  action?: ChecklistActionDefinition
  isCompleted?: boolean | (() => boolean)
  completedAt?: number | string
  isRequired?: boolean
  group?: string
  order?: number
  disabled?: boolean
  onClick?: () => void
  meta?: TMeta
}

export interface ChecklistGroupDefinition {
  id: string
  title: string
  description?: string
  icon?: any
}

export interface ChecklistProgress {
  total: number
  completed: number
  totalWeight: number
  completedWeight: number
  percentage: number
  remaining: number
  isAllCompleted: boolean
  requiredTotal: number
  requiredCompleted: number
  isRequiredCompleted: boolean
}

export interface OnboardingChecklistDefinition<TMeta = Record<string, any>> {
  id: string
  title?: string
  description?: string
  items: ChecklistItemDefinition<TMeta>[]
  groups?: ChecklistGroupDefinition[]
  collapsible?: boolean
  defaultExpanded?: boolean
  allowDismiss?: boolean
  allowManualToggle?: boolean
  onItemComplete?: (item: ChecklistItemDefinition<TMeta>) => void
  onAllComplete?: () => void
  meta?: TMeta
}

export interface ChecklistStorageAdapter {
  getItem: (key: string) => Promise<string | null> | string | null
  setItem: (key: string, value: string) => Promise<void> | void
  removeItem?: (key: string) => Promise<void> | void
}

export interface PersistedOnboardingState {
  completedTours: string[]
  completedTasks: Record<string, string[]> // checklistId -> taskIds[]
  taskTimestamps: Record<string, number> // taskId -> timestamp
  dismissedChecklists: string[]
  customData?: Record<string, any>
}

export interface OnboardingEngineState {
  activeTourId: string | null
  currentStepIndex: number
  isOpen: boolean
  completedTours: string[]
  completedTasks: Record<string, string[]>
  taskTimestamps: Record<string, number>
  dismissedChecklists: string[]
  activeChecklistId: string | null
}

export type OnboardingEngineEventMap = {
  'tour:start': { tourId: string; tour: OnboardingTourDefinition; stepIndex: number }
  'tour:step': { tourId: string; tour: OnboardingTourDefinition; step: TourStepDefinition; stepIndex: number; totalSteps: number }
  'tour:complete': { tourId: string; tour: OnboardingTourDefinition }
  'tour:skip': { tourId: string; tour: OnboardingTourDefinition; stepIndex: number }
  'tour:close': { tourId: string | null }
  'tour:reset': { tourId: string }
  'checklist:itemCompleted': { checklistId: string; itemId: string; item?: ChecklistItemDefinition; progress: ChecklistProgress }
  'checklist:itemUncompleted': { checklistId: string; itemId: string; item?: ChecklistItemDefinition; progress: ChecklistProgress }
  'checklist:allCompleted': { checklistId: string; checklist?: OnboardingChecklistDefinition }
  'checklist:dismissed': { checklistId: string }
  'checklist:undismissed': { checklistId: string }
  'checklist:reset': { checklistId: string }
  'action:tracked': { actionKey: string; payload?: any; completedTaskIds: string[] }
  'state:change': OnboardingEngineState
}

export type OnboardingEngineEventListener<T = any> = (data: T) => void
