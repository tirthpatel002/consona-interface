import React, { useRef } from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { useSound } from '../../context'
import type { SoundEmphasis, SoundHandle, SoundName } from '../../engine/types'

export interface SoundTriggerIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Whether the sound voice or loop is actively synthesizing. */
  isActive?: boolean
}

export interface SoundTriggerLoaderProps extends React.SVGProps<SVGSVGElement> {
  /** Size token for loader. */
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

export interface SoundTriggerLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Child label text content. */
  children?: React.ReactNode
}

export interface SoundTriggerSlots {
  /** Leading icon slot. */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Trailing icon slot. */
  rightIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Live audio activity / waveform pulse indicator slot. */
  indicator?: React.ComponentType<SoundTriggerIndicatorProps>
  /** Active continuous audio loop loading / loader slot. */
  loader?: React.ComponentType<SoundTriggerLoaderProps>
  /** Text label content slot. */
  label?: React.ComponentType<SoundTriggerLabelProps>
}

export type SoundTriggerIntent =
  | 'primary'
  | 'secondary'
  | 'subtle'
  | 'outline'
  | 'plain'
  | 'ghost'
  | 'danger'
  | 'warning'
  | 'success'

export interface SoundTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Sound cue identifier to play upon trigger (default 'tap'). */
  cue?: SoundName
  /** Sound cue variant identifier (e.g. 'mechanical', 'soft', 'pluck', 'crystal'). */
  variant?: string
  /** Interaction event to listen to: 'click' | 'press' | 'hover' | 'hold' | 'start' | 'stop' | 'toggle-loop'. */
  event?: 'click' | 'press' | 'hover' | 'hold' | 'start' | 'stop' | 'toggle-loop'
  /** Time-to-Live in milliseconds for continuous sounds. Auto-stops after this duration. */
  ttl?: number
  /** Custom release fade-out duration in seconds when stopped. */
  release?: number
  /** Sound emphasis intensity level. */
  emphasis?: SoundEmphasis
  /** Custom volume level multiplier. */
  volume?: number
  /** Visual intent ramp when rendered as button: 'primary' | 'secondary' | 'subtle' | 'outline' | 'plain' | 'ghost' | 'danger' | 'warning' | 'success'. */
  intent?: SoundTriggerIntent
  /** Optical size scaling token. */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** Text label to display when children are omitted. */
  label?: string
  /** Whether to render as wrapper without native button styling. */
  asChild?: boolean
  /** Custom slots. */
  slots?: SlotComponents<SoundTriggerSlots>
  /** Custom slot props map. */
  slotProps?: SlotPropsMap<SoundTriggerSlots>
}

const SIZE_CLASSES = {
  xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-micro',
  sm: 'h-8 px-3 text-xs gap-2 rounded-micro',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-base',
  lg: 'h-10 px-4 text-base gap-2.5 rounded-base',
}

const INTENT_CLASSES: Record<SoundTriggerIntent, string> = {
  primary: 'bg-primary text-primary-fg hover:bg-primary/90 shadow-xs active:scale-[0.98]',
  secondary: 'bg-secondary text-secondary-fg hover:bg-secondary/80 border border-border shadow-2xs active:scale-[0.98]',
  subtle: 'bg-primary-subtle text-primary-subtle-fg hover:bg-primary-subtle/80 active:scale-[0.98]',
  outline: 'border border-border bg-transparent text-fg hover:bg-secondary active:scale-[0.98]',
  ghost: 'bg-transparent text-fg hover:bg-secondary active:scale-[0.98]',
  plain: 'bg-transparent text-fg hover:bg-secondary active:scale-[0.98]',
  danger: 'bg-danger text-danger-fg hover:bg-danger/90 active:scale-[0.98]',
  warning: 'bg-warning text-warning-fg hover:bg-warning/90 active:scale-[0.98]',
  success: 'bg-success text-success-fg hover:bg-success/90 active:scale-[0.98]',
}

export const SoundTriggerIcon = createInterfaceComponent<React.HTMLAttributes<HTMLSpanElement>>(
  {
    name: 'SoundTriggerIcon',
    category: 'media',
    description: 'Leading icon slot for SoundTrigger component.',
    version: '1.0.0',
  },
  (props) => <span data-slot="sound-trigger-icon" {...props} />
)

export const SoundTriggerRightIcon = createInterfaceComponent<React.HTMLAttributes<HTMLSpanElement>>(
  {
    name: 'SoundTriggerRightIcon',
    category: 'media',
    description: 'Trailing icon slot for SoundTrigger component.',
    version: '1.0.0',
  },
  (props) => <span data-slot="sound-trigger-right-icon" {...props} />
)

export const SoundTriggerIndicator = createInterfaceComponent<SoundTriggerIndicatorProps>(
  {
    name: 'SoundTriggerIndicator',
    category: 'media',
    description: 'Live audio visual pulse indicator dot for SoundTrigger component.',
    version: '1.0.0',
    props: {
      isActive: false,
    },
  },
  ({ isActive = false, className, ...props }) => (
    <span
      data-slot="sound-trigger-indicator"
      className={cn(
        'w-2 h-2 rounded-full transition-colors duration-150',
        isActive ? 'bg-primary animate-pulse' : 'bg-muted-fg/40',
        className
      )}
      {...props}
    />
  )
)

export const SoundTriggerLoader = createInterfaceComponent<SoundTriggerLoaderProps>(
  {
    name: 'SoundTriggerLoader',
    category: 'media',
    description: 'Active synthesizer loading indicator for SoundTrigger component.',
    version: '1.0.0',
  },
  ({ className, ...props }) => (
    <svg
      data-slot="sound-trigger-loader"
      className={cn('w-3.5 h-3.5 animate-spin text-current', className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
)

export const SoundTriggerLabel = createInterfaceComponent<SoundTriggerLabelProps>(
  {
    name: 'SoundTriggerLabel',
    category: 'media',
    description: 'Text label for SoundTrigger component.',
    version: '1.0.0',
  },
  ({ children, className, ...props }) => (
    <span data-slot="sound-trigger-label" className={cn('truncate', className)} {...props}>
      {children}
    </span>
  )
)

const SoundTriggerPrimitive = ({
  cue = 'tap',
  variant = 'default',
  event = 'click',
  ttl,
  release,
  emphasis = 'normal',
  volume = 1,
  intent = 'secondary',
  size = 'md',
  label,
  asChild = false,
  slots,
  slotProps,
  className,
  children,
  onClick,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerEnter,
  ...props
}: SoundTriggerProps) => {
  const { play, start, stop, isContinuousPlaying } = useSound()
  const holdVoiceRef = useRef<SoundHandle | null>(null)

  const isLoopActive = isContinuousPlaying(cue, variant)

  const fireSound = (inputMethod: any) => {
    play(cue, {
      variant,
      emphasis,
      volume,
      context: { inputMethod },
    })
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (e.defaultPrevented) return

    if (event === 'click') {
      fireSound('mouse')
    } else if (event === 'start') {
      start(cue, { variant, emphasis, volume, ttl, release })
    } else if (event === 'stop') {
      if (cue === 'all' || cue === '*') {
        stop(undefined, release)
      } else {
        stop(cue, release)
      }
    } else if (event === 'toggle-loop') {
      if (isContinuousPlaying(cue)) {
        stop(cue, release)
      } else {
        start(cue, { variant, emphasis, volume, ttl, release })
      }
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    onPointerDown?.(e)
    if (e.defaultPrevented) return

    if (event === 'press') {
      fireSound(e.pointerType || 'mouse')
    } else if (event === 'hold') {
      if (!holdVoiceRef.current) {
        holdVoiceRef.current = start(cue, { variant, emphasis, volume, ttl, release })
      }
    }
  }

  const handlePointerEnd = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (event === 'hold' && holdVoiceRef.current) {
      holdVoiceRef.current.stop(release)
      holdVoiceRef.current = null
    }
  }

  const handlePointerEnter = (e: React.PointerEvent<HTMLButtonElement>) => {
    onPointerEnter?.(e)
    if (event === 'hover' && !e.defaultPrevented) {
      fireSound(e.pointerType || 'mouse')
    }
  }

  if (asChild && React.isValidElement(children)) {
    const childProps = children.props as any
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: any) => {
        childProps.onClick?.(e)
        handleClick(e)
      },
      onPointerDown: (e: any) => {
        childProps.onPointerDown?.(e)
        handlePointerDown(e)
      },
      onPointerUp: (e: any) => {
        childProps.onPointerUp?.(e)
        onPointerUp?.(e)
        handlePointerEnd(e)
      },
      onPointerLeave: (e: any) => {
        childProps.onPointerLeave?.(e)
        onPointerLeave?.(e)
        handlePointerEnd(e)
      },
      onPointerEnter: (e: any) => {
        childProps.onPointerEnter?.(e)
        handlePointerEnter(e)
      },
    })
  }

  const defaultContent = (
    <>
      {isLoopActive && renderSlot(slots?.loader, slotProps?.loader, { defaultComponent: SoundTriggerLoader })}
      {renderSlot(slots?.icon, slotProps?.icon)}
      {children != null ? (
        children
      ) : label ? (
        renderSlot(slots?.label, { children: label, ...slotProps?.label }, {
          defaultComponent: SoundTriggerLabel,
        })
      ) : null}
      {renderSlot(slots?.indicator, { isActive: isLoopActive, ...slotProps?.indicator }, {
        defaultComponent: SoundTriggerIndicator,
      })}
      {renderSlot(slots?.rightIcon, slotProps?.rightIcon)}
    </>
  )

  return (
    <button
      type="button"
      data-slot="sound-trigger"
      data-cue={cue}
      data-variant={variant}
      data-active={isLoopActive ? 'true' : undefined}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={(e) => {
        onPointerUp?.(e)
        handlePointerEnd(e)
      }}
      onPointerLeave={(e) => {
        onPointerLeave?.(e)
        handlePointerEnd(e)
      }}
      onPointerEnter={handlePointerEnter}
      className={cn(
        'inline-flex items-center justify-center font-medium cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring select-none',
        SIZE_CLASSES[size],
        INTENT_CLASSES[intent] ?? INTENT_CLASSES.secondary,
        className
      )}
      {...props}
    >
      {defaultContent}
    </button>
  )
}

export const SoundTrigger = createInterfaceComponent<SoundTriggerProps, SoundTriggerSlots>(
  {
    name: 'SoundTrigger',
    category: 'media',
    description: 'Declarative component wrapper or button that triggers synthesized sound cues or continuous loops on interaction events.',
    version: '1.2.0',
    props: {
      cue: 'tap',
      variant: 'default',
      event: 'click',
      emphasis: 'normal',
      intent: 'secondary',
      size: 'md',
    },
    slots: {
      icon: undefined,
      rightIcon: undefined,
      indicator: undefined,
      loader: undefined,
      label: undefined,
    },
  },
  SoundTriggerPrimitive
)

SoundTrigger.Icon = SoundTriggerIcon
SoundTrigger.RightIcon = SoundTriggerRightIcon
SoundTrigger.Indicator = SoundTriggerIndicator
SoundTrigger.Loader = SoundTriggerLoader
SoundTrigger.Label = SoundTriggerLabel


