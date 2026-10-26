import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlayCircleIcon,
  SparklesIcon,
  ArrowPathIcon,
  CheckIcon,
} from '@heroicons/react/20/solid'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Button } from '../../../core/components/button'
import { Badge } from '../../../core/components/badge'
import { ScrollArea } from '../../../core/components/scroll-area'
import { useTour } from '../../context'
import type {
  ChecklistGroupDefinition as ChecklistGroup,
  ChecklistItemDefinition as ChecklistItem,
  ChecklistProgress,
  OnboardingChecklistDefinition as OnboardingChecklist,
} from '../../engine/types'

/* ==========================================================================
   TourChecklist Slot Definitions
   ========================================================================== */

export interface TourChecklistSlots {
  /** Top icon indicator slot. */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Custom progress bar slot. */
  progressBar?: React.ComponentType<{ progress: ChecklistProgress }>
}

/* ==========================================================================
   TourChecklist Props
   ========================================================================== */

export interface TourChecklistProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Checklist ID if connecting to pre-registered checklist in TourProvider. */
  checklistId?: string
  /** Title of the checklist. */
  title?: string
  /** Description or guidance subtitle. */
  description?: string
  /** List of checklist tasks. */
  items?: ChecklistItem[]
  /** Optional grouping headers. */
  groups?: ChecklistGroup[]
  /** Visual presentation variant: 'card' (standard inline) or 'floating' (bottom-right launcher widget). */
  variant?: 'card' | 'floating'
  /** Whether the checklist is collapsible. */
  collapsible?: boolean
  /** Default collapsed state. */
  defaultExpanded?: boolean
  /** Whether users can dismiss the checklist. */
  allowDismiss?: boolean
  /** Whether users can manually check/toggle items. */
  allowManualToggle?: boolean
  /** Whether users can reset the checklist progress from the header. */
  allowReset?: boolean
  /** Whether to show points / weights badges for items. */
  showWeights?: boolean
  /** Callback when an item is clicked. */
  onItemClick?: (item: ChecklistItem) => void
  /** Callback when all items are completed. */
  onAllComplete?: () => void
  /** Custom celebration message when 100% complete. */
  celebrationMessage?: string
  /** Custom slot components. */
  slots?: SlotComponents<TourChecklistSlots>
  /** Custom slot props map. */
  slotProps?: SlotPropsMap<TourChecklistSlots>
}

const TourChecklistPrimitive = ({
  checklistId,
  title = 'Getting Started with Consona',
  description = 'Complete these setup milestones to unlock your workspace full potential.',
  items: propItems,
  groups: propGroups,
  variant = 'card',
  collapsible = true,
  defaultExpanded = true,
  allowDismiss = true,
  allowManualToggle = true,
  allowReset = false,
  showWeights = true,
  onItemClick,
  onAllComplete,
  celebrationMessage = 'All setup milestones completed! You are ready to build.',
  className,
  slots,
  slotProps,
  ...props
}: TourChecklistProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [isFloatingOpen, setIsFloatingOpen] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  // Internal state for standalone usage when TourProvider is absent
  const [standaloneCompleted, setStandaloneCompleted] = useState<string[]>([])
  const [standaloneDismissed, setStandaloneDismissed] = useState(false)

  let tourCtx: ReturnType<typeof useTour> | null = null
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    tourCtx = useTour()
  } catch {
    tourCtx = null
  }

  const registeredChecklist: OnboardingChecklist | undefined = checklistId && tourCtx
    ? tourCtx.checklists[checklistId]
    : undefined

  const items = propItems || registeredChecklist?.items || []
  const groups = propGroups || registeredChecklist?.groups || []
  const currentChecklistId = checklistId || registeredChecklist?.id || 'default'

  // Register checklist if items are provided directly
  const registeredChecklistKeyRef = useRef<string>('')
  const engine = tourCtx?.engine

  useEffect(() => {
    if (propItems && propItems.length > 0 && engine) {
      const key = `${currentChecklistId}_${propItems.length}`
      if (registeredChecklistKeyRef.current !== key) {
        registeredChecklistKeyRef.current = key
        engine.registerChecklist({
          id: currentChecklistId,
          title,
          description,
          items: propItems,
          groups: propGroups,
          collapsible,
          allowDismiss,
          onAllComplete,
        })
      }
    }
  }, [currentChecklistId, propItems, propGroups, title, description, collapsible, allowDismiss, onAllComplete, engine])

  // Calculate live weighted progress
  const progressMetrics: ChecklistProgress = useMemo(() => {
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

    let completed = 0
    let totalWeight = 0
    let completedWeight = 0
    let requiredTotal = 0
    let requiredCompleted = 0

    for (const item of items) {
      const weight = item.weight && item.weight > 0 ? item.weight : 1
      totalWeight += weight

      let isDone = false
      if (tourCtx) {
        isDone =
          tourCtx.isChecklistItemCompleted(item.id, currentChecklistId) ||
          (item.tourId ? tourCtx.isTourCompleted(item.tourId) : false)
      } else {
        if (item.isCompleted !== undefined) {
          isDone = typeof item.isCompleted === 'function' ? item.isCompleted() : Boolean(item.isCompleted)
        } else {
          isDone = standaloneCompleted.includes(item.id)
        }
      }

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
  }, [
    items,
    tourCtx,
    currentChecklistId,
    standaloneCompleted,
    tourCtx?.completedTasks,
    tourCtx?.taskTimestamps,
    tourCtx?.completedTours,
  ])

  // Fire onAllComplete once 100% completed
  useEffect(() => {
    if (progressMetrics.isAllCompleted && progressMetrics.total > 0) {
      onAllComplete?.()
    }
  }, [progressMetrics.isAllCompleted, progressMetrics.total, onAllComplete])

  const isDismissed = tourCtx ? tourCtx.isChecklistDismissed(currentChecklistId) : standaloneDismissed

  if (isDismissed && variant === 'card') {
    return null
  }

  const handleItemAction = (item: ChecklistItem) => {
    if (item.disabled) return

    onItemClick?.(item)
    if (item.onClick) {
      item.onClick()
      return
    }

    if (item.tourId && tourCtx) {
      tourCtx.startTour(item.tourId)
      return
    }

    if (allowManualToggle) {
      if (tourCtx) {
        tourCtx.toggleChecklistItem(item.id, currentChecklistId)
      } else {
        setStandaloneCompleted((prev) =>
          prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
        )
      }
    }
  }

  const handleToggleCheck = (e: React.MouseEvent, item: ChecklistItem) => {
    e.stopPropagation()
    if (!allowManualToggle || item.disabled) return

    if (tourCtx) {
      tourCtx.toggleChecklistItem(item.id, currentChecklistId)
    } else {
      setStandaloneCompleted((prev) =>
        prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
      )
    }
  }

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (tourCtx) {
      tourCtx.resetChecklist(currentChecklistId)
    } else {
      setStandaloneCompleted([])
    }
  }

  const renderItemRow = (item: ChecklistItem) => {
    const isDone = tourCtx
      ? tourCtx.isChecklistItemCompleted(item.id, currentChecklistId) ||
        (item.tourId ? tourCtx.isTourCompleted(item.tourId) : false)
      : typeof item.isCompleted === 'function'
      ? item.isCompleted()
      : item.isCompleted !== undefined
      ? Boolean(item.isCompleted)
      : standaloneCompleted.includes(item.id)

    const weightBadge = showWeights && item.weight && item.weight > 0 ? `+${item.weight} pts` : null
    const hasDuplicateBadge = typeof item.badge === 'string' && (item.badge === weightBadge || item.badge.includes('pts'))

    return (
      <div
        key={item.id}
        onClick={() => handleItemAction(item)}
        className={cn(
          'group/item flex items-start justify-between gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-base transition-all',
          'hover:bg-muted/35 cursor-pointer select-none',
          item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          isDone && 'bg-muted/15'
        )}
      >
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          {/* Checkbox button */}
          <button
            type="button"
            onClick={(e) => handleToggleCheck(e, item)}
            className={cn(
              'mt-0.5 size-4.5 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer',
              isDone
                ? 'bg-success text-success-fg shadow-xs ring-1 ring-success/30'
                : 'border border-border/80 hover:border-primary/80 bg-bg/80 hover:bg-muted/30'
            )}
            aria-label={isDone ? `Mark "${item.title}" incomplete` : `Mark "${item.title}" complete`}
          >
            {isDone ? <CheckIcon className="size-3 stroke-[3]" /> : null}
          </button>

          {/* Title, points & description */}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={cn(
                  'text-xs font-medium text-fg tracking-tight break-words',
                  isDone && 'line-through text-muted-fg'
                )}
              >
                {item.title}
              </span>
              {weightBadge && (
                <span
                  className={cn(
                    'text-[10px] font-mono px-1.5 py-0.5 rounded-micro font-medium tracking-tight shrink-0',
                    isDone
                      ? 'text-muted-fg/70 bg-muted/40 line-through'
                      : 'text-primary bg-primary/10 border border-primary/20'
                  )}
                >
                  {weightBadge}
                </span>
              )}
              {item.badge && !hasDuplicateBadge && (
                typeof item.badge === 'string' ? (
                  <Badge intent={isDone ? 'outline' : 'primary'} className="text-[10px] px-1.5 py-0 shrink-0">
                    {item.badge}
                  </Badge>
                ) : (
                  item.badge
                )
              )}
            </div>
            {item.description && (
              <p className="text-[11px] text-muted-fg leading-relaxed m-0 mt-0.5 break-words">
                {item.description}
              </p>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 flex items-center gap-1 self-start sm:self-center mt-0.5 sm:mt-0 ml-1">
          {item.action ? (
            <Button
              size="xs"
              intent={item.action.intent || (isDone ? 'outline' : 'primary')}
              onClick={(e) => {
                e.stopPropagation()
                item.action?.onClick?.()
              }}
              className="text-[11px] h-6 px-2 sm:px-2.5 font-medium shrink-0"
            >
              {item.action.label}
            </Button>
          ) : item.tourId ? (
            <Button
              size="xs"
              intent={isDone ? 'outline' : 'primary'}
              onClick={(e) => {
                e.stopPropagation()
                handleItemAction(item)
              }}
              className="text-[11px] h-6 px-2 sm:px-2.5 font-medium shrink-0"
            >
              <PlayCircleIcon className="size-3 mr-1 shrink-0" />
              <span>{isDone ? 'Revisit' : 'Start'}</span>
            </Button>
          ) : null}
        </div>
      </div>
    )
  }

  const checklistCard = (
    <div
      role="region"
      aria-label={title}
      data-slot="tour-checklist"
      className={cn(
        'flex flex-col self-start w-full max-w-full sm:max-w-md md:max-w-lg lg:max-w-xl rounded-macro border border-border/80 bg-card text-card-fg shadow-lg overflow-hidden transition-all duration-300',
        variant === 'floating' && 'w-[calc(100vw-2rem)] sm:w-96 max-w-md shadow-2xl border-border',
        className
      )}
      {...props}
    >
      {/* Responsive Header */}
      <div
        className={cn(
          'flex items-center justify-between px-3.5 sm:px-4 py-3 bg-muted/15 border-b border-border/40 gap-2 shrink-0',
          collapsible && 'cursor-pointer select-none hover:bg-muted/30 transition-colors'
        )}
        onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <div className="flex items-center justify-center size-7 sm:size-8 rounded-base bg-primary/10 text-primary shrink-0">
            {slots?.icon ? (
              renderSlot(slots.icon, { className: 'size-3.5 sm:size-4', ...(slotProps?.icon as any) })
            ) : (
              <SparklesIcon className="size-3.5 sm:size-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-semibold text-fg tracking-tight m-0 truncate">{title}</h4>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-[11px] font-mono text-muted-fg">
                {progressMetrics.completed}/{progressMetrics.total} done
              </span>
              <span className="text-[10px] text-muted-fg/40">•</span>
              <span className="text-[11px] font-mono font-medium text-primary">
                {progressMetrics.percentage}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {allowReset && (
            <button
              type="button"
              title="Reset checklist progress"
              aria-label="Reset checklist progress"
              onClick={handleReset}
              className="text-muted-fg hover:text-fg p-1 rounded-micro hover:bg-muted/40 transition-colors shrink-0 cursor-pointer"
            >
              <ArrowPathIcon className="size-3.5" />
            </button>
          )}
          {collapsible && (
            <div className="text-muted-fg p-1 shrink-0">
              {isExpanded ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />}
            </div>
          )}
        </div>
      </div>

      {/* Slim Progress Bar */}
      {slots?.progressBar ? (
        renderSlot(slots.progressBar, { progress: progressMetrics, ...(slotProps?.progressBar as any) })
      ) : (
        <div className="w-full h-1 bg-muted/50 shrink-0">
          <div
            className={cn(
              'h-full transition-all duration-500 ease-out',
              progressMetrics.isAllCompleted ? 'bg-success' : 'bg-primary'
            )}
            style={{ width: `${progressMetrics.percentage}%` }}
          />
        </div>
      )}

      {/* Scrollable Content Area with ScrollArea component */}
      {isExpanded && (
        <ScrollArea
          orientation="vertical"
          className="max-h-95 sm:max-h-105 w-full shrink min-h-0"
        >
          <div className="flex flex-col p-2.5 sm:p-3 gap-2.5 pb-4 sm:pb-5">
            {description && (
              <p className="text-[11px] sm:text-xs text-muted-fg px-1 py-0.5 leading-relaxed m-0 break-words">{description}</p>
            )}

            {/* Celebration Banner when 100% complete */}
            {progressMetrics.isAllCompleted && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 my-1 rounded-base bg-success/10 border border-success/30 text-success">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <CheckCircleIcon className="size-4.5 shrink-0 text-success" />
                  <span className="text-xs font-medium text-fg leading-snug break-words">{celebrationMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[11px] font-medium text-muted-fg hover:text-fg underline shrink-0 cursor-pointer flex items-center gap-1 self-end sm:self-auto"
                >
                  <ArrowPathIcon className="size-3" />
                  Reset
                </button>
              </div>
            )}

            {/* Grouped (Phases) or Flat Items */}
            {groups.length > 0 ? (
              <div className="flex flex-col gap-2 pt-1.5">
                {groups.map((grp) => {
                  const groupItems = items.filter((i) => i.group === grp.id)
                  if (groupItems.length === 0) return null
                  const groupCompleted = groupItems.filter((i) => {
                    if (tourCtx) {
                      return tourCtx.isChecklistItemCompleted(i.id, currentChecklistId)
                    }
                    return typeof i.isCompleted === 'function'
                      ? i.isCompleted()
                      : i.isCompleted !== undefined
                      ? Boolean(i.isCompleted)
                      : standaloneCompleted.includes(i.id)
                  }).length

                  const isCollapsed = Boolean(collapsedGroups[grp.id])

                  return (
                    <div
                      key={grp.id}
                      className="flex flex-col rounded-base border border-border/40 bg-muted/10 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleGroup(grp.id)}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-micro text-muted-fg hover:text-fg hover:bg-muted/20 transition-colors w-full cursor-pointer select-none text-left"
                      >
                        <div className="flex items-center justify-between flex-1 gap-2 min-w-0 mr-1.5">
                          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-fg/90 truncate">
                            {grp.title}
                          </span>
                          <span className="text-[10px] font-mono text-muted-fg/70 shrink-0">
                            {groupCompleted}/{groupItems.length}
                          </span>
                        </div>
                        <ChevronDownIcon
                          className={cn(
                            'size-3.5 transition-transform duration-200 shrink-0 text-muted-fg/70',
                            isCollapsed && '-rotate-90'
                          )}
                        />
                      </button>
                      {!isCollapsed && (
                        <div className="flex flex-col gap-0.5 p-1 pt-0">
                          {groupItems.map(renderItemRow)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-0.5 pt-1">
                {items.map(renderItemRow)}
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  )

  if (variant === 'floating') {
    return (
      <div
        data-slot="tour-checklist-floating-host"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9980] flex flex-col items-end gap-2 max-w-[calc(100vw-2rem)]"
      >
        {isFloatingOpen && checklistCard}

        <button
          type="button"
          onClick={() => setIsFloatingOpen(!isFloatingOpen)}
          className={cn(
            'flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-full shadow-2xl border border-border/80 bg-card text-card-fg font-medium text-xs',
            'transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer max-w-full truncate',
            'focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary'
          )}
        >
          <div className="flex items-center justify-center size-5 rounded-full bg-primary/15 text-primary shrink-0">
            <SparklesIcon className="size-3" />
          </div>
          <span className="truncate">{title}</span>
          <Badge intent={progressMetrics.isAllCompleted ? 'success' : 'primary'} className="shrink-0">
            {progressMetrics.percentage}%
          </Badge>
        </button>
      </div>
    )
  }

  return checklistCard
}

export const TourChecklist = createInterfaceComponent<TourChecklistProps, TourChecklistSlots>(
  {
    name: 'TourChecklist',
    category: 'onboarding',
    description: 'Gamified milestone checklist container with weighted progress tracking and tour integration.',
    version: '1.0.0',
    props: {
      title: 'Getting Started with Consona',
      description: 'Complete these setup milestones to unlock your workspace full potential.',
      variant: 'card',
      collapsible: true,
      defaultExpanded: true,
      allowDismiss: true,
      allowManualToggle: true,
      showWeights: true,
      celebrationMessage: 'All setup milestones completed! You are ready to build.',
    },
    slots: {
      icon: undefined,
      progressBar: undefined,
    },
  },
  TourChecklistPrimitive
)
