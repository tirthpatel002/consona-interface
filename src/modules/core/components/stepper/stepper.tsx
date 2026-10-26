import * as React from 'react'
import {
  createContext,
  useContext,
  type ReactNode,
} from 'react'
import {
  CheckIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  MinusIcon,
} from '@heroicons/react/20/solid'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Loader } from '../loader'

/* ==========================================================================
   Stepper Types & Contexts
   ========================================================================== */

export type StepperOrientation = 'horizontal' | 'vertical'
export type StepStatus =
  | 'complete'
  | 'current'
  | 'upcoming'
  | 'error'
  | 'warning'
  | 'in_progress'
  | 'skipped'
export type StepperSize = 'sm' | 'md' | 'lg'
export type StepperVariant = 'default' | 'timeline' | 'dots'

export interface StepperContextValue {
  /** Active step index (0-based). */
  activeStep: number
  /** Stepper layout orientation. */
  orientation: StepperOrientation
  /** Total step count derived from children. */
  totalSteps: number
  /** Size token: sm, md, lg. */
  size: StepperSize
  /** Visual variant: default, timeline, or dots. */
  variant: StepperVariant
  /** Whether entire stepper steps are clickable. */
  clickable: boolean
  /** Callback fired on step navigation click. */
  onStepClick?: (stepIndex: number) => void
}

const DEFAULT_STEPPER_CONTEXT: StepperContextValue = {
  activeStep: 0,
  orientation: 'horizontal',
  totalSteps: 1,
  size: 'md',
  variant: 'default',
  clickable: false,
}

const StepperContext = createContext<StepperContextValue | null>(null)

export function useStepperContext(): StepperContextValue {
  const ctx = useContext(StepperContext)
  return ctx ?? DEFAULT_STEPPER_CONTEXT
}

export interface StepItemContextValue {
  /** 0-based index of this step. */
  index: number
  /** Calculated or explicit step status. */
  status: StepStatus
  /** Whether this is the final step in the sequence. */
  isLast: boolean
  /** Whether this specific step can be clicked. */
  isClickable: boolean
  /** Click action handler. */
  handleClick: () => void
}

const DEFAULT_STEP_ITEM_CONTEXT: StepItemContextValue = {
  index: 0,
  status: 'upcoming',
  isLast: false,
  isClickable: false,
  handleClick: () => {},
}

const StepItemContext = createContext<StepItemContextValue | null>(null)

export function useStepItemContext(): StepItemContextValue {
  const ctx = useContext(StepItemContext)
  return ctx ?? DEFAULT_STEP_ITEM_CONTEXT
}

export const StepperProvider = StepperContext.Provider

/* ==========================================================================
   Stepper Slots & Props
   ========================================================================== */

export interface StepperSlots {}

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0-based index of the active step. Default is 0. */
  activeStep?: number
  /** Layout direction: horizontal (default) or vertical. */
  orientation?: StepperOrientation
  /** Sizing ramp: sm, md, or lg. Default is md. */
  size?: StepperSize
  /** Visual display variant: 'default' (numbered circles), 'timeline' (timeline spine), or 'dots'. */
  variant?: StepperVariant
  /** Whether steps are clickable for direct workflow jumping. Default is false. */
  clickable?: boolean
  /** Callback fired when a step is clicked. */
  onStepChange?: (stepIndex: number) => void
  /** Slot overrides. */
  slots?: SlotComponents<StepperSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<StepperSlots>
  /** Step items or children. */
  children?: ReactNode
}

/* ==========================================================================
   Stepper Root Primitive
   ========================================================================== */

const StepperPrimitive = ({
  activeStep = 0,
  orientation = 'horizontal',
  size = 'md',
  variant = 'default',
  clickable = false,
  onStepChange,
  slots = {},
  slotProps = {},
  className,
  children,
  ...props
}: StepperProps) => {
  const childArray = React.Children.toArray(children).filter(Boolean)
  const totalSteps = childArray.length

  return (
    <StepperContext.Provider
      value={{
        activeStep,
        orientation,
        totalSteps,
        size,
        variant,
        clickable,
        onStepClick: onStepChange,
      }}
    >
      <div
        data-slot="stepper"
        data-orientation={orientation}
        data-size={size}
        data-variant={variant}
        aria-label="Progress steps"
        className={cn(
          'flex w-full',
          orientation === 'horizontal' ? 'flex-row items-start' : 'flex-col',
          className
        )}
        {...props}
      >
        {childArray.map((child: any, index) => {
          const explicitStatus: StepStatus | undefined = child?.props?.status
          const derivedStatus: StepStatus =
            explicitStatus ??
            (index < activeStep
              ? 'complete'
              : index === activeStep
              ? 'current'
              : 'upcoming')

          const isItemClickable =
            child?.props?.clickable ?? clickable ?? Boolean(onStepChange)

          const handleItemClick = () => {
            if (isItemClickable) {
              child?.props?.onClick?.()
              onStepChange?.(index)
            }
          }

          return (
            <StepItemContext.Provider
              key={index}
              value={{
                index,
                status: derivedStatus,
                isLast: index === totalSteps - 1,
                isClickable: isItemClickable,
                handleClick: handleItemClick,
              }}
            >
              <div
                className={cn(
                  'flex min-w-0',
                  orientation === 'horizontal'
                    ? 'flex-1 flex-col items-center'
                    : 'flex-col w-full'
                )}
              >
                {child}
              </div>
            </StepItemContext.Provider>
          )
        })}
      </div>
    </StepperContext.Provider>
  )
}

/* ==========================================================================
   StepItem Sub-Component
   ========================================================================== */

export interface StepItemSlots {
  /** Custom icon slot. */
  icon?: React.ComponentType<StepIconProps>
}

export interface StepItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Explicit status override: 'complete', 'current', 'upcoming', 'error', 'warning', 'in_progress', or 'skipped'. */
  status?: StepStatus
  /** Optional shorthand custom icon. */
  icon?: ReactNode
  /** Enable clicking on this specific step. */
  clickable?: boolean
  /** Slot overrides. */
  slots?: SlotComponents<StepItemSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<StepItemSlots>
  /** Step child elements. */
  children?: ReactNode
}

const StepItemDefaultIcon = ({ icon, ...props }: StepIconProps) =>
  icon ? <StepIcon icon={icon} {...props} /> : <StepIcon {...props} />

const StepItemPrimitive = ({
  className,
  status: _status,
  icon,
  clickable: _clickable,
  slots = {},
  slotProps = {},
  children,
  onClick,
  ...props
}: StepItemProps) => {
  const { orientation, activeStep, size, variant } = useStepperContext()
  const { index, isLast, isClickable, handleClick, status } = useStepItemContext()

  const childList = React.Children.toArray(children)
  const iconElement = childList.find(
    (c: any) =>
      c?.type === StepIcon ||
      c?.type?.displayName === 'StepIcon' ||
      c?.props?.['data-slot'] === 'step-icon'
  )
  const contentElements = iconElement
    ? childList.filter((c) => c !== iconElement)
    : childList

  const resolvedIcon =
    iconElement ??
    renderSlot(slots?.icon, { icon, ...(slotProps?.icon as object) }, {
      defaultComponent: StepItemDefaultIcon,
    })

  const isCompleteOrPast = status === 'complete' || index <= activeStep

  const sizeLeftColWidth: Record<string, string> = {
    sm: 'w-7',
    md: 'w-9',
    lg: 'w-11',
  }

  if (orientation === 'horizontal') {
    return (
      <div
        data-slot="step-item"
        data-status={status}
        onClick={onClick ?? (isClickable ? handleClick : undefined)}
        className={cn(
          'flex flex-col items-center w-full min-w-0',
          isClickable && 'cursor-pointer group/step',
          className
        )}
        {...props}
      >
        {/* Connector + Icon Row */}
        <div className="relative flex items-center justify-center w-full">
          {/* Left connector */}
          <div
            className={cn(
              'h-0.5 flex-1 transition-colors duration-300',
              index === 0 ? 'invisible' : 'visible',
              status === 'skipped' && 'border-t border-dashed border-border'
            )}
            style={{
              background:
                status === 'skipped'
                  ? 'transparent'
                  : isCompleteOrPast
                  ? 'var(--color-primary, currentColor)'
                  : 'var(--color-border)',
            }}
          />

          {/* Centered Step Icon */}
          <div className="mx-2 shrink-0">{resolvedIcon}</div>

          {/* Right connector */}
          <div
            className={cn(
              'h-0.5 flex-1 transition-colors duration-300',
              isLast ? 'invisible' : 'visible'
            )}
            style={{
              background:
                index < activeStep && status !== 'skipped'
                  ? 'var(--color-primary, currentColor)'
                  : 'var(--color-border)',
            }}
          />
        </div>

        {/* Text Content below Icon */}
        {contentElements.length > 0 && (
          <div className="mt-2.5 flex flex-col items-center text-center w-full">
            {contentElements}
          </div>
        )}
      </div>
    )
  }

  // Vertical orientation
  return (
    <div
      data-slot="step-item"
      data-status={status}
      onClick={onClick ?? (isClickable ? handleClick : undefined)}
      className={cn(
        'flex flex-row items-stretch gap-3.5 w-full min-w-0',
        isClickable && 'cursor-pointer group/step',
        className
      )}
      {...props}
    >
      {/* Left Column: Icon + Vertical Connector Spine */}
      <div className={cn('flex flex-col items-center shrink-0', sizeLeftColWidth[size] || 'w-9')}>
        {resolvedIcon}
        {!isLast && (
          <div
            className={cn(
              'w-0.5 flex-1 min-h-6 my-1.5 transition-colors duration-300',
              status === 'skipped' && 'border-l border-dashed border-border'
            )}
            style={{
              background:
                status === 'skipped'
                  ? 'transparent'
                  : index < activeStep
                  ? 'var(--color-primary, currentColor)'
                  : 'var(--color-border)',
            }}
          />
        )}
      </div>

      {/* Right Column: Step Content */}
      <div
        className={cn(
          'flex flex-col min-w-0 flex-1',
          !isLast ? (variant === 'timeline' ? 'pb-5' : 'pb-7') : 'pb-1'
        )}
      >
        {contentElements}
      </div>
    </div>
  )
}

export const StepItem = createInterfaceComponent<StepItemProps, StepItemSlots>(
  {
    name: 'StepItem',
    category: 'layout',
    description: 'Individual step item containing icon, connectors, and label content.',
    version: '1.0.0',
    slots: {
      icon: StepItemDefaultIcon,
    },
  },
  StepItemPrimitive
)

/* ==========================================================================
   StepIcon Sub-Component
   ========================================================================== */

export interface StepIconRenderProps {
  /** Step status token. */
  status: StepStatus
  /** Step index. */
  index: number
  /** Numeric step number. */
  step: number
}

export interface StepIconSlots {}

export interface StepIconProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Override the displayed step number or node. */
  step?: number | ReactNode
  /** Icon shown when status is 'complete'. */
  completeIcon?: ReactNode
  /** Icon shown when status is 'current'. */
  currentIcon?: ReactNode
  /** Icon shown when status is 'upcoming'. */
  upcomingIcon?: ReactNode
  /** Icon shown when status is 'error'. */
  errorIcon?: ReactNode
  /** Icon shown when status is 'warning'. */
  warningIcon?: ReactNode
  /** Icon shown when status is 'in_progress'. */
  inProgressIcon?: ReactNode
  /** Dynamic icon renderer or node. */
  icon?: ReactNode | ((props: { status: StepStatus; index: number }) => ReactNode)
  /** If true, removes default circle badge styling for unstyled icon placement. */
  unstyled?: boolean
  /** Render prop or children. */
  children?: ReactNode | ((props: StepIconRenderProps) => ReactNode)
}

const StepIconPrimitive = ({
  step,
  completeIcon,
  currentIcon,
  upcomingIcon,
  errorIcon,
  warningIcon,
  inProgressIcon,
  icon,
  unstyled = false,
  className,
  children,
  ...props
}: StepIconProps) => {
  const { size, variant } = useStepperContext()
  const { index, status } = useStepItemContext()
  const displayNumber = step ?? index + 1
  const numericStep = typeof step === 'number' ? step : index + 1

  const sizeClasses: Record<string, string> = {
    sm: 'size-7 text-xs',
    md: 'size-9 text-sm',
    lg: 'size-11 text-base',
  }

  const iconSizes: Record<string, string> = {
    sm: 'size-3.5',
    md: 'size-4.5',
    lg: 'size-5',
  }

  let renderedIcon: ReactNode

  if (typeof children === 'function') {
    renderedIcon = children({ status, index, step: numericStep })
  } else if (children) {
    renderedIcon = children
  } else if (typeof icon === 'function') {
    renderedIcon = icon({ status, index })
  } else if (status === 'complete' && completeIcon !== undefined) {
    renderedIcon = completeIcon
  } else if (status === 'current' && currentIcon !== undefined) {
    renderedIcon = currentIcon
  } else if (status === 'upcoming' && upcomingIcon !== undefined) {
    renderedIcon = upcomingIcon
  } else if (status === 'error' && errorIcon !== undefined) {
    renderedIcon = errorIcon
  } else if (status === 'warning' && warningIcon !== undefined) {
    renderedIcon = warningIcon
  } else if (status === 'in_progress' && inProgressIcon !== undefined) {
    renderedIcon = inProgressIcon
  } else if (status === 'complete') {
    renderedIcon = <CheckIcon className={iconSizes[size] || 'size-4.5'} />
  } else if (status === 'error') {
    renderedIcon = <ExclamationTriangleIcon className={iconSizes[size] || 'size-4.5'} />
  } else if (status === 'warning') {
    renderedIcon = <ExclamationCircleIcon className={iconSizes[size] || 'size-4.5'} />
  } else if (status === 'in_progress') {
    renderedIcon = <Loader size="sm" variant="spin" data-slot="loader" />
  } else if (status === 'skipped') {
    renderedIcon = <MinusIcon className={iconSizes[size] || 'size-4.5'} />
  } else if (variant === 'timeline' || variant === 'dots') {
    renderedIcon = <span className="size-2 rounded-full bg-current" />
  } else if (icon !== undefined) {
    renderedIcon = icon
  } else {
    renderedIcon = displayNumber
  }

  if (unstyled) {
    return (
      <div
        data-slot="step-icon"
        data-status={status}
        aria-hidden="true"
        className={cn('relative flex shrink-0 items-center justify-center', sizeClasses[size] || 'size-9', className)}
        {...props}
      >
        {renderedIcon}
      </div>
    )
  }

  return (
    <div
      data-slot="step-icon"
      data-status={status}
      aria-hidden="true"
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-full border-2 font-semibold transition-all duration-300 select-none',
        sizeClasses[size] || 'size-9 text-sm',
        status === 'complete' &&
          'border-primary bg-primary text-primary-fg shadow-2xs',
        status === 'current' &&
          'border-primary bg-bg text-primary ring-4 ring-primary/20 shadow-2xs',
        status === 'upcoming' &&
          'border-border bg-bg text-muted-fg',
        status === 'error' &&
          'border-danger bg-danger text-danger-fg shadow-2xs',
        status === 'warning' &&
          'border-warning bg-warning text-warning-fg shadow-2xs',
        status === 'in_progress' &&
          'border-primary bg-bg text-primary ring-4 ring-primary/20 shadow-2xs',
        status === 'skipped' &&
          'border-dashed border-border bg-muted/40 text-muted-fg',
        className
      )}
      {...props}
    >
      {renderedIcon}
    </div>
  )
}

export const StepIcon = createInterfaceComponent<StepIconProps, StepIconSlots>(
  {
    name: 'StepIcon',
    category: 'layout',
    description: 'Status indicator badge for a StepItem displaying step numbers, checks, or status icons.',
    version: '1.0.0',
    props: {
      unstyled: false,
    },
    slots: {

    },
  },
  StepIconPrimitive
)

/* ==========================================================================
   StepContent Sub-Component
   ========================================================================== */

export interface StepContentSlots {}

export interface StepContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Main step title label. */
  label?: ReactNode
  /** Subtitle or descriptive details. */
  description?: ReactNode
  /** Timestamp or metadata readout. */
  timestamp?: ReactNode
  /** Custom children or form content. */
  children?: ReactNode
}

const StepContentPrimitive = ({
  label,
  description,
  timestamp,
  children,
  className,
  ...props
}: StepContentProps) => {
  const { orientation, size } = useStepperContext()
  const { status } = useStepItemContext()

  const labelSize = size === 'sm' ? 'text-xs font-semibold' : 'text-sm font-semibold'

  if (orientation === 'vertical') {
    const hasSubtitleOrChildren = Boolean(description || timestamp || children)
    return (
      <div
        data-slot="step-content"
        className={cn('flex flex-col min-w-0 w-full', className)}
        {...props}
      >
        {(label || timestamp) && (
          <div
            className={cn(
              'flex items-center justify-between gap-2',
              hasSubtitleOrChildren ? 'pt-0.5 justify-start' : 'min-h-9 justify-center'
            )}
          >
            {label && (
              <span
                className={cn(
                  labelSize,
                  'leading-5 transition-colors duration-200',
                  status === 'current' && 'text-fg',
                  status === 'complete' && 'text-fg font-medium',
                  status === 'error' && 'text-danger font-semibold',
                  status === 'warning' && 'text-warning font-semibold',
                  status === 'in_progress' && 'text-primary font-semibold',
                  status === 'upcoming' && 'text-muted-fg font-normal',
                  status === 'skipped' && 'text-muted-fg line-through font-normal'
                )}
              >
                {label}
              </span>
            )}
            {timestamp && (
              <span className="text-[11px] font-mono text-muted-fg/70 ml-auto shrink-0">
                {timestamp}
              </span>
            )}
          </div>
        )}
        {description && (
          <span className="mt-0.5 text-xs text-muted-fg leading-relaxed">
            {description}
          </span>
        )}
        {children && <div className="mt-2.5">{children}</div>}
      </div>
    )
  }

  // Horizontal orientation
  return (
    <div
      data-slot="step-content"
      className={cn(
        'flex flex-col min-w-0 items-center text-center w-full px-1',
        className
      )}
      {...props}
    >
      {label && (
        <span
          className={cn(
            labelSize,
            'leading-tight transition-colors duration-200',
            status === 'current' && 'text-fg',
            status === 'complete' && 'text-fg font-medium',
            status === 'error' && 'text-danger font-semibold',
            status === 'warning' && 'text-warning font-semibold',
            status === 'in_progress' && 'text-primary font-semibold',
            status === 'upcoming' && 'text-muted-fg font-normal',
            status === 'skipped' && 'text-muted-fg line-through font-normal'
          )}
        >
          {label}
        </span>
      )}
      {description && (
        <span className="mt-1 text-xs text-muted-fg leading-relaxed text-center max-w-45">
          {description}
        </span>
      )}
      {timestamp && (
        <span className="mt-0.5 text-[10px] font-mono text-muted-fg/70">
          {timestamp}
        </span>
      )}
      {children && <div className="mt-2">{children}</div>}
    </div>
  )
}

export const StepContent = createInterfaceComponent<StepContentProps, StepContentSlots>(
  {
    name: 'StepContent',
    category: 'layout',
    description: 'Title, description, and timestamp layout container for StepItem.',
    version: '1.0.0',
    slots: {

    },
  },
  StepContentPrimitive
)

/* ==========================================================================
   StepConnector Sub-Component
   ========================================================================== */

export interface StepConnectorSlots {}

export interface StepConnectorProps extends React.HTMLAttributes<HTMLDivElement> {}

const StepConnectorPrimitive = ({ className, ...props }: StepConnectorProps) => {
  const { orientation, activeStep } = useStepperContext()
  const { index, status } = useStepItemContext()
  const filled = index <= activeStep || status === 'complete'

  if (orientation === 'horizontal') {
    return (
      <div
        data-slot="step-connector"
        className={cn('mx-2 h-0.5 flex-1 transition-colors duration-300', className)}
        style={{ background: filled ? 'var(--color-primary, currentColor)' : 'var(--color-border)' }}
        {...props}
      />
    )
  }
  return (
    <div
      data-slot="step-connector"
      className={cn('w-0.5 flex-1 min-h-6 my-1 transition-colors duration-300', className)}
      style={{ background: filled ? 'var(--color-primary, currentColor)' : 'var(--color-border)' }}
      {...props}
    />
  )
}

export const StepConnector = createInterfaceComponent<StepConnectorProps, StepConnectorSlots>(
  {
    name: 'StepConnector',
    category: 'layout',
    description: 'Connecting line between steps in a Stepper.',
    version: '1.0.0',
    slots: {

    },
  },
  StepConnectorPrimitive
)

/* ==========================================================================
   StepSeparator Sub-Component
   ========================================================================== */

export interface StepSeparatorSlots {}

export interface StepSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

const StepSeparatorPrimitive = ({ className, ...props }: StepSeparatorProps) => {
  const { status } = useStepItemContext()
  const filled = status === 'complete'
  return (
    <div
      data-slot="step-separator"
      className={cn('w-0.5 h-full min-h-8 transition-colors duration-300', className)}
      style={{ background: filled ? 'var(--color-primary, currentColor)' : 'var(--color-border)' }}
      {...props}
    />
  )
}

export const StepSeparator = createInterfaceComponent<StepSeparatorProps, StepSeparatorSlots>(
  {
    name: 'StepSeparator',
    category: 'layout',
    description: 'Vertical divider line for completed steps.',
    version: '1.0.0',
    slots: {

    },
  },
  StepSeparatorPrimitive
)

/* ==========================================================================
   Main Component Factory & Compound Attachments
   ========================================================================== */

export const Stepper = createInterfaceComponent<StepperProps, StepperSlots>(
  {
    name: 'Stepper',
    category: 'layout',
    description: 'Multi-step process workflow stepper supporting horizontal and vertical timelines, status checks, and interactive progression.',
    version: '1.0.0',
    props: {
      activeStep: 0,
      orientation: 'horizontal',
      size: 'md',
      variant: 'default',
      clickable: false,
    },
    slots: {

    },
  },
  StepperPrimitive
)

// Compound family attachments
Stepper.Item = StepItem
Stepper.Icon = StepIcon
Stepper.Content = StepContent
Stepper.Connector = StepConnector
Stepper.Separator = StepSeparator
Stepper.Provider = StepperProvider

/** Alias matching TASKS.md */
export const Wizard = Stepper
export interface WizardProps extends StepperProps {}
