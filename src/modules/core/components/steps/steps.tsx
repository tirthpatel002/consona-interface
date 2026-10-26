import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type ComponentProps,
  type ReactNode,
} from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'

/* ==========================================================================
   Shared Types & Theme Tokens
   ========================================================================== */

export type StepsSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface StepThemeConfig {
  /** Container background class or color. */
  bg?: string
  /** Navigation action button background class or color. */
  button?: string
  /** Navigation action button foreground text/icon class or color. */
  buttonFg?: string
  /** Inactive indicator dot/pill class or color. */
  dot?: string
  /** Active indicator track / progress background class or color. */
  progress?: string
  /** Active indicator filling foreground class or color. */
  fill?: string
}

export const DEFAULT_STEPS_NAVIGATOR_THEME: StepThemeConfig = {
  bg: 'bg-bg-subtle text-fg border-border/50',
  button: 'bg-bg-surface text-fg hover:bg-bg-subtle hover:text-fg active:bg-secondary border border-border/80 shadow-xs',
  buttonFg: 'text-fg',
  dot: 'bg-muted-fg/20 hover:bg-muted-fg/35',
  progress: 'bg-muted-fg/25',
  fill: 'bg-fg shadow-xs',
}

export const DEFAULT_STEPS_NAVIGATOR_THEMES: StepThemeConfig[] = [
  DEFAULT_STEPS_NAVIGATOR_THEME,
]

export interface StepsItem {
  /** Unique identifier for the step. */
  id: string
  /** Primary label text. */
  label: ReactNode
  /** Optional secondary subtitle or description. */
  description?: ReactNode
  /** Optional leading or header icon. */
  icon?: ReactNode | React.ComponentType<{ className?: string }>
  /** Optional badge text or node. */
  badge?: ReactNode
  /** Whether this step is disabled from direct navigation. */
  isDisabled?: boolean
}

/* ==========================================================================
   StepsNavigator (Carousel / Auto-Progressing Segmented Bar Navigator)
   ========================================================================== */

export interface StepsNavigatorSlots {
  /** Custom previous navigation button. */
  prevButton?: React.ComponentType<StepsNavigatorArrowProps>
  /** Custom next navigation button. */
  nextButton?: React.ComponentType<StepsNavigatorArrowProps>
  /** Custom step indicator pill. */
  indicator?: React.ComponentType<StepsNavigatorPillProps>
  /** Custom previous icon. */
  prevIcon?: React.ComponentType<{ className?: string; 'data-slot'?: string }>
  /** Custom next icon. */
  nextIcon?: React.ComponentType<{ className?: string; 'data-slot'?: string }>
}

export interface StepsNavigatorArrowProps extends ComponentProps<'button'> {
  /** Direction of the navigation arrow. */
  direction: 'prev' | 'next'
  /** Whether the arrow action is disabled. */
  isDisabled?: boolean
  /** Theme styling configuration. */
  theme?: StepThemeConfig
  /** Size token scaling the button dimensions. */
  size?: StepsSize
  /** Custom CSS classes. */
  className?: string
  /** Children or custom icon. */
  children?: ReactNode
}

const StepsNavigatorArrowPrimitive = React.forwardRef<
  HTMLButtonElement,
  StepsNavigatorArrowProps
>(
  (
    {
      direction,
      isDisabled = false,
      theme,
      size = 'md',
      className,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      xs: 'size-6 *:data-[slot=icon]:size-3',
      sm: 'size-7 *:data-[slot=icon]:size-3.5',
      md: 'size-8 *:data-[slot=icon]:size-4',
      lg: 'size-10 *:data-[slot=icon]:size-4.5',
      xl: 'size-12 *:data-[slot=icon]:size-6',
    }[size]

    return (
      <motion.button
        ref={ref}
        type="button"
        data-slot={`steps-navigator-${direction}`}
        disabled={isDisabled}
        onClick={onClick}
        whileTap={!isDisabled ? { scale: 0.92 } : undefined}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full font-medium transition-all duration-300 select-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50 shrink-0 shadow-xs',
          theme?.button ?? 'bg-fg text-bg hover:bg-fg/90',
          isDisabled && 'opacity-40 cursor-not-allowed hover:bg-current active:scale-100 shadow-none',
          sizeClasses,
          className
        )}
        {...(props as any)}
      >
        {children ?? (
          direction === 'prev' ? (
            <ChevronLeftIcon className="size-4 stroke-2" data-slot="icon" />
          ) : (
            <ChevronRightIcon className="size-4 stroke-2" data-slot="icon" />
          )
        )}
      </motion.button>
    )
  }
)
StepsNavigatorArrowPrimitive.displayName = 'StepsNavigatorArrowPrimitive'

export const StepsNavigatorArrow = createInterfaceComponent<StepsNavigatorArrowProps>(
  {
    name: 'StepsNavigatorArrow',
    category: 'navigation',
    description: 'Circular spring-motion navigation arrow button for step carousels.',
    version: '1.0.0',
    props: {
      direction: 'next',
      size: 'md',
    },
  },
  StepsNavigatorArrowPrimitive
)

export interface StepsNavigatorPillProps extends ComponentProps<'button'> {
  /** Index of this step indicator. */
  index: number
  /** Whether this step is currently active. */
  isActive: boolean
  /** Whether this step is completed. */
  isCompleted?: boolean
  /** Auto-play timer delay in milliseconds for the animated progress fill. Set to 0 to disable timer. */
  autoDelay?: number
  /** Whether auto-play timer is actively progressing. */
  isAutoPlaying?: boolean
  /** Active theme styling configuration. */
  theme?: StepThemeConfig
  /** Size token scaling pill thickness and length. */
  size?: StepsSize
  /** Custom CSS classes. */
  className?: string
}

const PILL_WIDTHS = {
  xs: { active: 20, inactive: 5, height: 'h-1.5' },
  sm: { active: 28, inactive: 6, height: 'h-2' },
  md: { active: 36, inactive: 8, height: 'h-2' },
  lg: { active: 48, inactive: 10, height: 'h-2.5' },
  xl: { active: 64, inactive: 14, height: 'h-3.5' },
} as const

const PILL_SPRING = {
  type: 'spring',
  stiffness: 40,
  damping: 5,
  mass: 0.9,
} as const

const StepsNavigatorPillPrimitive = React.forwardRef<
  HTMLButtonElement,
  StepsNavigatorPillProps
>(
  (
    {
      index,
      isActive,
      isCompleted,
      autoDelay = 0,
      isAutoPlaying = false,
      theme,
      size = 'md',
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    const config = PILL_WIDTHS[size]

    return (
      <motion.button
        ref={ref}
        type="button"
        data-slot="steps-navigator-pill"
        data-active={isActive}
        data-completed={isCompleted}
        onClick={onClick}
        initial={false}
        animate={{
          width: isActive ? config.active : config.inactive,
        }}
        transition={PILL_SPRING}
        className={cn(
          'relative cursor-pointer rounded-full overflow-hidden transition-colors duration-500 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 shrink-0 select-none',
          config.height,
          isActive
            ? (theme?.progress ?? 'bg-border')
            : (theme?.dot ?? 'bg-border/60 hover:bg-border'),
          className
        )}
        {...(props as any)}
      >
        {isActive && autoDelay > 0 && isAutoPlaying && (
          <motion.div
            key={`fill-timer-${index}`}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: autoDelay / 1000, ease: 'linear' }}
            className={cn(
              'absolute inset-0 rounded-full',
              theme?.fill ?? 'bg-fg shadow-[0_0_8px_rgba(255,255,255,0.4)]'
            )}
          />
        )}
        {isActive && (!isAutoPlaying || autoDelay <= 0) && (
          <motion.div
            key={`fill-solid-${index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className={cn(
              'absolute inset-0 rounded-full',
              theme?.fill ?? 'bg-fg'
            )}
          />
        )}
      </motion.button>
    )
  }
)
StepsNavigatorPillPrimitive.displayName = 'StepsNavigatorPillPrimitive'

export const StepsNavigatorPill = createInterfaceComponent<StepsNavigatorPillProps>(
  {
    name: 'StepsNavigatorPill',
    category: 'navigation',
    description: 'Spring-morphing progress indicator pill with linear auto-play timer support.',
    version: '1.0.0',
    props: {
      index: 0,
      isActive: false,
      size: 'md',
    },
  },
  StepsNavigatorPillPrimitive
)

export interface StepsNavigatorProps extends Omit<ComponentProps<'div'>, 'onChange'> {
  /** Total number of steps or slides. Default: 4 */
  totalSteps?: number
  /** Controlled active step index (0-indexed). */
  currentStep?: number
  /** Initial step index in uncontrolled mode. Default: 0 */
  defaultStep?: number
  /** Callback fired when the active step index changes. */
  onStepChange?: (index: number) => void
  /** Auto-advance timer in milliseconds. Set to 0 to disable. Default: 0 */
  autoDelay?: number
  /** Whether auto-advance is running. Default: false */
  isAutoPlaying?: boolean
  /** Whether navigation wraps around past start and end. Default: true */
  isLoop?: boolean
  /** Array of theme configurations mapped per slide index or single theme. */
  themes?: StepThemeConfig[]
  /** Size ramp token: xs, sm, md, lg, xl. Default: 'md' */
  size?: StepsSize
  /** Slot overrides map. */
  slots?: SlotComponents<StepsNavigatorSlots>
  /** Slot props overrides map. */
  slotProps?: SlotPropsMap<StepsNavigatorSlots>
  /** Custom CSS classes. */
  className?: string
}

const StepsNavigatorPrimitive = ({
  totalSteps = 4,
  currentStep: controlledStep,
  defaultStep = 0,
  onStepChange,
  autoDelay = 0,
  isAutoPlaying = false,
  isLoop = true,
  themes = DEFAULT_STEPS_NAVIGATOR_THEMES,
  size = 'md',
  slots,
  slotProps,
  className,
  ...props
}: StepsNavigatorProps) => {
  const [internalStep, setInternalStep] = useState<number>(defaultStep)
  const isControlled = controlledStep !== undefined
  const activeStep = isControlled ? controlledStep : internalStep

  const setStep = useCallback(
    (newStep: number) => {
      const clamped = isLoop
        ? (newStep + totalSteps) % totalSteps
        : Math.max(0, Math.min(totalSteps - 1, newStep))

      if (!isControlled) {
        setInternalStep(clamped)
      }
      onStepChange?.(clamped)
    },
    [isControlled, isLoop, onStepChange, totalSteps]
  )

  // Auto-advance timer
  useEffect(() => {
    if (!isAutoPlaying || autoDelay <= 0 || totalSteps <= 1) return

    const timer = setTimeout(() => {
      setStep(activeStep + 1)
    }, autoDelay)

    return () => clearTimeout(timer)
  }, [isAutoPlaying, autoDelay, activeStep, setStep, totalSteps])

  const activeTheme = useMemo(() => {
    if (!themes || themes.length === 0) return DEFAULT_STEPS_NAVIGATOR_THEMES[0]
    return themes[activeStep % themes.length]
  }, [themes, activeStep])

  const isPrevDisabled = !isLoop && activeStep === 0
  const isNextDisabled = !isLoop && activeStep === totalSteps - 1

  const capsuleSizeClasses = {
    xs: 'p-1 gap-1',
    sm: 'p-1 gap-1.5',
    md: 'p-1.5 gap-1.5',
    lg: 'p-2 gap-2',
    xl: 'p-2.5 gap-2.5',
  }[size]

  const trackGapClasses = {
    xs: 'px-1 gap-1',
    sm: 'px-1.5 gap-1',
    md: 'px-2 gap-1.5',
    lg: 'px-2.5 gap-2',
    xl: 'px-3 gap-2.5',
  }[size]

  return (
    <div
      data-slot="steps-navigator"
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-colors duration-300 select-none shadow-xs border border-border/40',
        capsuleSizeClasses,
        activeTheme?.bg ?? 'bg-bg-subtle text-fg',
        className
      )}
      {...props}
    >
      {/* Prev Arrow */}
      {renderSlot(
        slots?.prevButton,
        {
          direction: 'prev' as const,
          isDisabled: isPrevDisabled,
          theme: activeTheme,
          size,
          onClick: () => setStep(activeStep - 1),
          children: renderSlot(
            slots?.prevIcon,
            {
              className: 'size-4 stroke-2',
              'data-slot': 'icon',
              ...(slotProps?.prevIcon as object),
            },
            { defaultComponent: ChevronLeftIcon }
          ),
          ...(slotProps?.prevButton as object),
        },
        {
          defaultComponent: StepsNavigatorArrow,
        }
      )}

      {/* Indicator Pills Track */}
      <div className={cn('flex items-center', trackGapClasses)}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <React.Fragment key={i}>
            {renderSlot(
              slots?.indicator,
              {
                index: i,
                isActive: i === activeStep,
                isCompleted: i < activeStep,
                autoDelay,
                isAutoPlaying,
                theme: activeTheme,
                size,
                onClick: () => setStep(i),
                ...(slotProps?.indicator as object),
              },
              {
                defaultComponent: StepsNavigatorPill,
              }
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Next Arrow */}
      {renderSlot(
        slots?.nextButton,
        {
          direction: 'next' as const,
          isDisabled: isNextDisabled,
          theme: activeTheme,
          size,
          onClick: () => setStep(activeStep + 1),
          children: renderSlot(
            slots?.nextIcon,
            {
              className: 'size-4 stroke-2',
              'data-slot': 'icon',
              ...(slotProps?.nextIcon as object),
            },
            { defaultComponent: ChevronRightIcon }
          ),
          ...(slotProps?.nextButton as object),
        },
        {
          defaultComponent: StepsNavigatorArrow,
        }
      )}
    </div>
  )
}

export const StepsNavigator = createInterfaceComponent<StepsNavigatorProps, StepsNavigatorSlots>(
  {
    name: 'StepsNavigator',
    category: 'navigation',
    description:
      'Fluid spring-animated step and carousel navigator with dynamic theme transitions, auto-timer progress fills, and slot-customizable controls.',
    version: '1.0.0',
    props: {
      totalSteps: 4,
      defaultStep: 0,
      autoDelay: 0,
      isAutoPlaying: false,
      isLoop: true,
      size: 'md',
    },
    slots: {
      prevButton: StepsNavigatorArrow,
      nextButton: StepsNavigatorArrow,
      indicator: StepsNavigatorPill,
      prevIcon: ChevronLeftIcon,
      nextIcon: ChevronRightIcon,
    },
  },
  StepsNavigatorPrimitive
)

/* ==========================================================================
   StepsIndicator (Floating Morphing Tooltip & Segmented Progress Bar)
   ========================================================================== */

export interface StepsIndicatorSlots {
  /** Custom segmented bar track. */
  track?: React.ComponentType<StepsIndicatorTrackProps>
  /** Custom individual step segment. */
  step?: React.ComponentType<StepsIndicatorItemProps>
  /** Custom floating tooltip banner. */
  tooltip?: React.ComponentType<StepsIndicatorTooltipProps>
}

export interface StepsIndicatorTooltipProps extends ComponentProps<'div'> {
  /** Active hovered or selected step item. */
  step: StepsItem
  /** Step index (0-based). */
  index: number
  /** Size ramp token. */
  size?: StepsSize
  /** Custom CSS classes. */
  className?: string
}

const StepsIndicatorTooltipPrimitive = React.forwardRef<
  HTMLDivElement,
  StepsIndicatorTooltipProps
>(({ step, index, size = 'md', className, children, ...props }, ref) => {
  const IconComponent = step.icon
  const sizeClasses = {
    xs: 'px-2.5 py-0.5 gap-1 text-[11px] font-medium',
    sm: 'px-3 py-1 gap-1.5 text-xs font-medium',
    md: 'px-3.5 py-1.5 gap-1.5 text-xs font-medium',
    lg: 'px-4 py-2 gap-2 text-sm font-medium',
    xl: 'px-5 py-2.5 gap-2.5 text-base font-medium',
  }[size]

  return (
    <div
      ref={ref}
      data-slot="steps-indicator-tooltip-content"
      className={cn(
        'flex items-center justify-center whitespace-nowrap text-overlay-fg',
        sizeClasses,
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          {IconComponent && (
            <span className="shrink-0 flex items-center justify-center text-muted-fg">
              {React.isValidElement(IconComponent) ? (
                IconComponent
              ) : typeof IconComponent === 'function' ? (
                <IconComponent className="size-3.5 stroke-2" />
              ) : null}
            </span>
          )}
          <span className="font-medium text-overlay-fg">{step.label}</span>
          {step.badge && (
            <span className="ml-1 rounded-full bg-primary-subtle text-primary border border-primary/20 px-1.5 py-0.5 text-[10px] font-semibold">
              {step.badge}
            </span>
          )}
        </>
      )}
    </div>
  )
})
StepsIndicatorTooltipPrimitive.displayName = 'StepsIndicatorTooltipPrimitive'

export const StepsIndicatorTooltip = createInterfaceComponent<StepsIndicatorTooltipProps>(
  {
    name: 'StepsIndicatorTooltip',
    category: 'navigation',
    description: 'Floating preview banner showing step icon, title, and metadata.',
    version: '1.0.0',
    props: {
      size: 'md',
    },
  },
  StepsIndicatorTooltipPrimitive
)

export interface StepsIndicatorItemProps extends ComponentProps<'button'> {
  /** Step definition item. */
  step: StepsItem
  /** Step index. */
  index: number
  /** Whether this step is actively selected. */
  isActive: boolean
  /** Whether this step is hovered. */
  isHovered: boolean
  /** Whether this step is completed. */
  isCompleted: boolean
  /** Size token. */
  size?: StepsSize
  /** Custom CSS classes. */
  className?: string
}

const StepsIndicatorItemPrimitive = React.forwardRef<
  HTMLButtonElement,
  StepsIndicatorItemProps
>(
  (
    {
      step,
      index,
      isActive,
      isHovered,
      isCompleted,
      size = 'md',
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    const heightClass = {
      xs: 'h-1.5',
      sm: 'h-2',
      md: 'h-2.5',
      lg: 'h-3',
      xl: 'h-4',
    }[size]

    return (
      <button
        ref={ref}
        type="button"
        data-slot="steps-indicator-item"
        data-active={isActive}
        data-hovered={isHovered}
        data-completed={isCompleted}
        disabled={step.isDisabled}
        onClick={onClick}
        className={cn(
          'group relative flex-1 cursor-pointer outline-none select-none rounded-full transition-all duration-200',
          heightClass,
          step.isDisabled && 'opacity-40 cursor-not-allowed',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'absolute inset-0 rounded-full transition-colors duration-300',
            'group-focus-visible:ring-2 group-focus-visible:ring-ring/50 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-bg',
            isActive || isHovered
              ? 'bg-fg dark:bg-fg'
              : isCompleted
                ? 'bg-fg/70 dark:bg-fg/70'
                : 'bg-border/80 hover:bg-muted-fg/30'
          )}
        />
      </button>
    )
  }
)
StepsIndicatorItemPrimitive.displayName = 'StepsIndicatorItemPrimitive'

export const StepsIndicatorItem = createInterfaceComponent<StepsIndicatorItemProps>(
  {
    name: 'StepsIndicatorItem',
    category: 'navigation',
    description: 'Individual clickable segmented progress bar item.',
    version: '1.0.0',
    props: {
      size: 'md',
    },
  },
  StepsIndicatorItemPrimitive
)

export interface StepsIndicatorTrackProps extends ComponentProps<'div'> {
  /** Custom CSS classes. */
  className?: string
  /** Children segments. */
  children?: ReactNode
}

const StepsIndicatorTrackPrimitive = React.forwardRef<
  HTMLDivElement,
  StepsIndicatorTrackProps
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="steps-indicator-track"
      className={cn('relative flex w-full items-center gap-2.5 px-1', className)}
      {...props}
    >
      {children}
    </div>
  )
})
StepsIndicatorTrackPrimitive.displayName = 'StepsIndicatorTrackPrimitive'

export const StepsIndicatorTrack = createInterfaceComponent<StepsIndicatorTrackProps>(
  {
    name: 'StepsIndicatorTrack',
    category: 'navigation',
    description: 'Horizontal track container aligning segmented step indicators.',
    version: '1.0.0',
  },
  StepsIndicatorTrackPrimitive
)

export interface StepsIndicatorProps extends Omit<ComponentProps<'div'>, 'onChange'> {
  /** Array of step definitions. */
  steps: StepsItem[]
  /** Controlled active step index (0-indexed). */
  currentStep?: number
  /** Initial step index in uncontrolled mode. Default: 0 */
  defaultStep?: number
  /** Callback fired when a step is selected or changed. */
  onStepChange?: (index: number) => void
  /** Delay in milliseconds before showing tooltip on hover. Default: 0 */
  tooltipDelay?: number
  /** Tooltip visibility mode: 'hover' (default, appears on hover/focus), 'always' (permanently pinned above active step), 'never' (disabled). */
  showTooltip?: 'hover' | 'always' | 'never'
  /** Size ramp token: sm, md, lg. Default: 'md' */
  size?: StepsSize
  /** Slot overrides map. */
  slots?: SlotComponents<StepsIndicatorSlots>
  /** Slot props overrides map. */
  slotProps?: SlotPropsMap<StepsIndicatorSlots>
  /** Custom CSS classes. */
  className?: string
}

const StepsIndicatorPrimitive = ({
  steps = [],
  currentStep: controlledStep,
  defaultStep = 0,
  onStepChange,
  tooltipDelay = 0,
  showTooltip = 'hover',
  size = 'md',
  slots,
  slotProps,
  className,
  ...props
}: StepsIndicatorProps) => {
  const [internalStep, setInternalStep] = useState<number>(defaultStep)
  const isControlled = controlledStep !== undefined
  const activeIndex = isControlled ? controlledStep : internalStep

  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const isAlways = showTooltip === 'always'
  const isNever = showTooltip === 'never'
  const isVisible = !isNever && (isAlways || hoverIndex !== null)
  const displayIndex = hoverIndex !== null ? hoverIndex : activeIndex

  const [coords, setCoords] = useState<{ width: number; x: number } | null>(null)

  const measureRefs = useRef<(HTMLDivElement | null)[]>([])
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const calculatePosition = useCallback((index: number) => {
    const activeLabel = measureRefs.current[index]
    const activeButton = buttonRefs.current[index]

    if (!activeLabel || !activeButton) return null

    const labelRect = activeLabel.getBoundingClientRect()
    const labelWidth = Math.ceil(labelRect.width)
    const buttonLeft = activeButton.offsetLeft
    const buttonWidth = activeButton.offsetWidth
    const buttonCenter = buttonLeft + buttonWidth / 2

    return {
      width: labelWidth,
      x: Math.round(buttonCenter - labelWidth / 2),
    }
  }, [])

  const handleShow = useCallback(
    (index: number) => {
      if (isNever) return
      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      const performUpdate = () => {
        setHoverIndex(index)
        const newCoords = calculatePosition(index)
        if (newCoords) {
          setCoords(newCoords)
        }
      }

      if (hoverIndex === null && !isAlways) {
        if (tooltipDelay > 0) {
          timeoutRef.current = setTimeout(performUpdate, tooltipDelay)
        } else {
          performUpdate()
        }
      } else {
        performUpdate()
      }
    },
    [calculatePosition, hoverIndex, isAlways, isNever, tooltipDelay]
  )

  const handleHide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setHoverIndex(null)
    if (!isAlways) {
      setCoords(null)
    } else {
      const activeCoords = calculatePosition(activeIndex)
      if (activeCoords) {
        setCoords(activeCoords)
      }
    }
  }, [activeIndex, calculatePosition, isAlways])

  // Auto-calculate position when visible on mount, step change, hover change, and window resize
  useEffect(() => {
    if (!isVisible) return

    const target = hoverIndex !== null ? hoverIndex : activeIndex
    const update = () => {
      if (target >= 0 && target < steps.length) {
        const newCoords = calculatePosition(target)
        if (newCoords) {
          setCoords(newCoords)
        }
      }
    }

    update()
    const frameId = requestAnimationFrame(update)

    const handleResize = () => {
      update()
    }

    window.addEventListener('resize', handleResize)
    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', handleResize)
    }
  }, [activeIndex, hoverIndex, isVisible, calculatePosition, steps.length])

  const handleSelectStep = (index: number) => {
    if (steps[index]?.isDisabled) return
    if (!isControlled) {
      setInternalStep(index)
    }
    onStepChange?.(index)
    if (isVisible) {
      const newCoords = calculatePosition(index)
      if (newCoords) {
        setCoords(newCoords)
      }
    }
  }

  const activeStepItem = steps[displayIndex] ?? steps[0]

  return (
    <div
      data-slot="steps-indicator"
      className={cn('relative flex w-full flex-col items-center justify-center p-4 pt-14 select-none', className)}
      {...props}
    >
      <div className="w-full max-w-115">
        <div
          className="relative flex w-full items-center"
          onMouseLeave={handleHide}
        >
          {/* Floating Spring-Morphing Tooltip Banner */}
          <AnimatePresence>
            {isVisible && coords && activeStepItem && (
              <motion.div
                className="pointer-events-none absolute bottom-6 left-0 z-30"
                initial={{ opacity: 0, y: 6 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  x: coords.x,
                  width: coords.width,
                }}
                exit={{ opacity: 0, y: 4 }}
                transition={{
                  type: 'spring',
                  stiffness: 350,
                  damping: 30,
                }}
              >
                <div className="flex w-full items-center justify-center rounded-full bg-overlay text-overlay-fg shadow-lg border border-border backdrop-blur-md">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={`active-step-${activeStepItem.id}`}
                      initial={{ opacity: 0, filter: 'blur(4px)', y: 2 }}
                      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                      exit={{ opacity: 0, filter: 'blur(4px)', y: -2 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="flex w-full items-center justify-center"
                    >
                      {renderSlot(
                        slots?.tooltip,
                        {
                          step: activeStepItem,
                          index: displayIndex,
                          size,
                          ...(slotProps?.tooltip as object),
                        },
                        {
                          defaultComponent: StepsIndicatorTooltip,
                        }
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Segmented Track */}
          {renderSlot(
            slots?.track,
            {
              className: 'relative flex w-full items-center gap-2.5 px-1',
              ...(slotProps?.track as object),
              children: steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  {renderSlot(
                    slots?.step,
                    {
                      step,
                      index,
                      isActive: activeIndex === index,
                      isHovered: hoverIndex === index,
                      isCompleted: index < activeIndex,
                      size,
                      ref: (el: HTMLButtonElement | null) => {
                        buttonRefs.current[index] = el
                      },
                      onMouseEnter: () => handleShow(index),
                      onFocus: () => handleShow(index),
                      onBlur: (e: React.FocusEvent) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                          handleHide()
                        }
                      },
                      onClick: () => handleSelectStep(index),
                      ...(slotProps?.step as object),
                    },
                    {
                      defaultComponent: StepsIndicatorItem,
                    }
                  )}
                </React.Fragment>
              )),
            },
            { defaultComponent: StepsIndicatorTrack }
          )}
        </div>
      </div>

      {/* Hidden Offscreen Measure Labels for Zero-Layout-Shift Math */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 flex h-0 overflow-hidden whitespace-nowrap opacity-0"
        aria-hidden="true"
      >
        {steps.map((step, index) => (
          <div
            key={`measure-${step.id}`}
            ref={(el) => {
              measureRefs.current[index] = el
            }}
            className="inline-flex items-center justify-center rounded-full border border-border"
          >
            {renderSlot(
              slots?.tooltip,
              {
                step,
                index,
                size,
                ...(slotProps?.tooltip as object),
              },
              {
                defaultComponent: StepsIndicatorTooltip,
              }
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export const StepsIndicator = createInterfaceComponent<StepsIndicatorProps, StepsIndicatorSlots>(
  {
    name: 'StepsIndicator',
    category: 'navigation',
    description:
      'Segmented step progress indicator with fluid spring-translated, clip-path morphing floating tooltip previews.',
    version: '1.0.0',
    props: {
      defaultStep: 0,
      tooltipDelay: 0,
      size: 'md',
    },
    slots: {
      track: StepsIndicatorTrack,
      step: StepsIndicatorItem,
      tooltip: StepsIndicatorTooltip,
    },
  },
  StepsIndicatorPrimitive
)

/* ==========================================================================
   Steps Root Family Component & Namespace Attachments
   ========================================================================== */

export interface StepsSlots {
  /** Custom navigator component. */
  navigator?: typeof StepsNavigator
  /** Custom indicator component. */
  indicator?: typeof StepsIndicator
}

export interface StepsProps extends ComponentProps<'div'> {
  /** Array of step item models. */
  steps?: StepsItem[]
  /** Controlled active step index. */
  currentStep?: number
  /** Initial step index in uncontrolled mode. */
  defaultStep?: number
  /** Callback fired when step index changes. */
  onStepChange?: (index: number) => void
  /** Total number of steps if step items are not provided. */
  totalSteps?: number
  /** Size token: sm, md, lg. Default: 'md' */
  size?: StepsSize
  /** Slot overrides map. */
  slots?: SlotComponents<StepsSlots>
  /** Slot props overrides map. */
  slotProps?: SlotPropsMap<StepsSlots>
  /** Custom CSS classes. */
  className?: string
  /** Children for compound composition. */
  children?: ReactNode
}

const StepsPrimitive = ({
  steps = [],
  currentStep,
  defaultStep = 0,
  onStepChange,
  totalSteps,
  size = 'md',
  slots,
  slotProps,
  className,
  children,
  ...props
}: StepsProps) => {
  const effectiveTotal = steps.length > 0 ? steps.length : (totalSteps ?? 4)

  return (
    <div
      data-slot="steps"
      className={cn('flex flex-col items-center justify-center gap-6 w-full', className)}
      {...props}
    >
      {children != null ? (
        children
      ) : (
        <>
          {steps.length > 0 &&
            renderSlot(
              slots?.indicator,
              {
                steps,
                currentStep,
                defaultStep,
                onStepChange,
                size,
                ...(slotProps?.indicator as object),
              },
              { defaultComponent: StepsIndicator }
            )}
          {renderSlot(
            slots?.navigator,
            {
              totalSteps: effectiveTotal,
              currentStep,
              defaultStep,
              onStepChange,
              size,
              ...(slotProps?.navigator as object),
            },
            { defaultComponent: StepsNavigator }
          )}
        </>
      )}
    </div>
  )
}

export const Steps = createInterfaceComponent<StepsProps, StepsSlots>(
  {
    name: 'Steps',
    category: 'navigation',
    description:
      'Coordinated step navigation suite including spring-animated carousel navigator and segmented clip-path tooltip indicators.',
    version: '1.0.0',
    props: {
      defaultStep: 0,
      size: 'md',
    },
    slots: {
      navigator: StepsNavigator,
      indicator: StepsIndicator,
    },
  },
  StepsPrimitive
)

// Namespace attachments for compound family ergonomics
Steps.Navigator = StepsNavigator
Steps.NavigatorArrow = StepsNavigatorArrow
Steps.NavigatorPill = StepsNavigatorPill
Steps.Indicator = StepsIndicator
Steps.IndicatorTrack = StepsIndicatorTrack
Steps.IndicatorItem = StepsIndicatorItem
Steps.IndicatorTooltip = StepsIndicatorTooltip
