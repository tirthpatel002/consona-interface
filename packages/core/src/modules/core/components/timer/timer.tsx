import React, {
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
} from 'react'
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowPathIcon,
  FlagIcon,
} from '@heroicons/react/24/outline'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Button, type ButtonProps } from '../button'

/* ==========================================================================
   Timer Types & Helpers
   ========================================================================== */

export type TimerMode = 'stopwatch' | 'countdown'
export type TimerSize = 'sm' | 'md' | 'lg'
export type TimerVariant = 'card' | 'plain' | 'compact' | 'inline'
export type TimerAlignment = 'vertical' | 'horizontal'

export interface LapRecord {
  /** Sequential lap index number. */
  lapIndex: number
  /** Duration of this single lap in milliseconds. */
  time: number
  /** Cumulative split time at lap trigger in milliseconds. */
  splitTime: number
}

export function formatTimeString(totalMs: number, showMs: boolean): { main: string; ms: string } {
  const totalSeconds = Math.floor(totalMs / 1000)
  const hrs = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  const msFraction = Math.floor((totalMs % 1000) / 10)

  let main = ''
  if (hrs > 0) {
    main = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  } else {
    main = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const ms = `.${String(msFraction).padStart(2, '0')}`
  return { main, ms }
}

/* ==========================================================================
   TimerDisplay Sub-Atom & Props
   ========================================================================== */

export interface TimerDisplayProps extends HTMLAttributes<HTMLDivElement> {
  /** Time string representation payload. */
  timeString?: { main: string; ms: string }
  /** Sizing ramp token. */
  size?: TimerSize
  /** Whether compact layout style applies. */
  isCompact?: boolean
  /** Whether to render sub-second milliseconds. */
  showMilliseconds?: boolean
  /** Custom CSS classes. */
  className?: string
}

const TimerDisplayPrimitive = ({
  timeString = { main: '00:00', ms: '.00' },
  size = 'md',
  isCompact = false,
  showMilliseconds = false,
  className,
  ...props
}: TimerDisplayProps) => {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  }

  const compactSizeClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  }

  return (
    <div
      data-slot="timer-display"
      className={cn(
        'flex items-baseline font-mono font-medium tracking-tight text-fg/90 tabular-nums select-none',
        className
      )}
      {...props}
    >
      <span className={isCompact ? compactSizeClasses[size] : sizeClasses[size]}>
        {timeString.main}
      </span>
      {showMilliseconds && (
        <span
          data-slot="timer-ms"
          className={cn(
            'font-medium text-primary/75 tabular-nums ml-0.5',
            size === 'sm' || isCompact ? 'text-xs' : 'text-xl'
          )}
        >
          {timeString.ms}
        </span>
      )}
    </div>
  )
}

export const TimerDisplay = createInterfaceComponent<TimerDisplayProps>(
  {
    name: 'TimerDisplay',
    category: 'data',
    description: 'Numerical time digits display well with sub-second millisecond fractions.',
    version: '1.0.0',
  },
  TimerDisplayPrimitive
)

/* ==========================================================================
   TimerProgressRing Sub-Atom & Props
   ========================================================================== */

export interface TimerProgressRingProps extends HTMLAttributes<HTMLDivElement> {
  /** Sizing ramp token. */
  size?: TimerSize
  /** Progress fraction between 0 and 1. */
  progressFraction?: number
  /** Whether the timer has reached completion. */
  isComplete?: boolean
  /** Child elements centered within the ring. */
  children?: React.ReactNode
  /** Custom CSS classes. */
  className?: string
}

const TimerProgressRingPrimitive = ({
  size = 'md',
  progressFraction = 1,
  isComplete = false,
  children,
  className,
  ...props
}: TimerProgressRingProps) => {
  const ringSize = size === 'lg' ? 220 : size === 'sm' ? 140 : 180
  const strokeW = size === 'lg' ? 5 : size === 'sm' ? 3.5 : 4
  const r = (ringSize - strokeW * 2) / 2
  const circumference = 2 * Math.PI * r
  const strokeDashoffset = circumference * (1 - progressFraction)

  return (
    <div
      data-slot="timer-progress-ring"
      className={cn('relative flex items-center justify-center shrink-0', className)}
      style={{ width: ringSize, height: ringSize }}
      {...props}
    >
      <svg
        className="size-full -rotate-90"
        viewBox={`0 0 ${ringSize} ${ringSize}`}
        aria-hidden="true"
      >
        <circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={r}
          className="fill-none stroke-muted/30"
          strokeWidth={strokeW}
        />
        <circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={r}
          className={cn(
            'fill-none transition-all duration-300 ease-out',
            isComplete ? 'stroke-muted-fg/60' : 'stroke-primary/85'
          )}
          strokeWidth={strokeW}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
          }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  )
}

export const TimerProgressRing = createInterfaceComponent<TimerProgressRingProps>(
  {
    name: 'TimerProgressRing',
    category: 'data',
    description: 'Circular SVG progress arc for countdown and target stopwatch ceilings.',
    version: '1.0.0',
  },
  TimerProgressRingPrimitive
)

/* ==========================================================================
   TimerControls Sub-Atom, Slots & Props
   ========================================================================== */

export interface TimerControlsSlots {
  /** Start / Resume action button. */
  startButton?: React.ComponentType<ButtonProps>
  /** Pause action button. */
  pauseButton?: React.ComponentType<ButtonProps>
  /** Lap record action button. */
  lapButton?: React.ComponentType<ButtonProps>
  /** End / Stop action button. */
  endButton?: React.ComponentType<ButtonProps>
  /** Reset action button. */
  resetButton?: React.ComponentType<ButtonProps>
}

export interface TimerControlsProps extends HTMLAttributes<HTMLDivElement> {
  /** Whether the timer is actively running. */
  isRunning: boolean
  /** Operating mode. */
  mode: TimerMode
  /** Current elapsed time in milliseconds. */
  timeMs: number
  /** Initial countdown time in seconds. */
  initialTime: number
  /** Whether timer has reached end/completion. */
  isComplete: boolean
  /** Whether lap recording is enabled. */
  enableLaps?: boolean
  /** Whether explicit end button is shown. */
  showEndButton?: boolean
  /** Handlers */
  onStart: () => void
  /** Callback fired when pause occurs. */
  onPause: () => void
  /** Callback fired when reset occurs. */
  onReset: () => void
  /** Callback fired when end occurs. */
  onEnd: () => void
  /** Callback fired when lap occurs. */
  onLap: () => void
  /** Custom CSS classes. */
  className?: string
  /** Slot overrides. */
  slots?: SlotComponents<TimerControlsSlots>
  /** Slot props map. */
  slotProps?: SlotPropsMap<TimerControlsSlots>
}

const TimerControlsPrimitive = ({
  isRunning,
  mode,
  timeMs,
  initialTime,
  isComplete,
  enableLaps = false,
  showEndButton = true,
  onStart,
  onPause,
  onReset,
  onEnd,
  onLap,
  className,
  slots = {},
  slotProps = {},
  ...props
}: TimerControlsProps) => {
  const defaultStartBtn = (
    <Button
      size="xs"
      intent="primary"
      onPress={onStart}
      className="rounded-full gap-1.5 px-4 h-8 text-xs font-medium bg-primary/90 hover:bg-primary shadow-none transition-all"
      aria-label="Start timer"
      {...slotProps.startButton}
    >
      <PlayIcon className="size-3.5" />
      <span>{timeMs > 0 && mode === 'stopwatch' ? 'Resume' : 'Start'}</span>
    </Button>
  )

  const defaultPauseBtn = (
    <Button
      size="xs"
      intent="secondary"
      onPress={onPause}
      className="rounded-full gap-1.5 px-4 h-8 text-xs font-medium border border-border/50 bg-secondary/60 hover:bg-secondary transition-all"
      aria-label="Pause timer"
      {...slotProps.pauseButton}
    >
      <PauseIcon className="size-3.5 text-muted-fg" />
      <span>Pause</span>
    </Button>
  )

  const defaultLapBtn = (
    <Button
      size="xs"
      intent="outline"
      onPress={onLap}
      className="rounded-full gap-1 px-3 h-8 text-xs font-medium text-fg/80 hover:bg-secondary/40 border-border/50 transition-all"
      aria-label="Record lap"
      {...slotProps.lapButton}
    >
      <FlagIcon className="size-3.5 text-primary/80" />
      <span>Lap</span>
    </Button>
  )

  const defaultEndBtn = (
    <Button
      size="xs"
      intent="danger"
      onPress={onEnd}
      className="rounded-full gap-1 px-3.5 h-8 text-xs font-medium bg-danger/85 hover:bg-danger shadow-none transition-all"
      aria-label="End timer"
      {...slotProps.endButton}
    >
      <StopIcon className="size-3.5" />
      <span>End</span>
    </Button>
  )

  const defaultResetBtn = (
    <Button
      size="xs"
      intent="outline"
      onPress={onReset}
      className="size-8 p-0 shrink-0 rounded-full text-muted-fg hover:text-fg hover:bg-secondary/40 border border-transparent hover:border-border/40 transition-all"
      aria-label="Reset timer"
      {...slotProps.resetButton}
    >
      <ArrowPathIcon className="size-3.5" />
    </Button>
  )

  return (
    <div
      data-slot="timer-controls"
      className={cn('flex items-center gap-2', className)}
      {...props}
    >
      {!isRunning
        ? (slots.startButton ? renderSlot(slots.startButton, slotProps.startButton) : defaultStartBtn)
        : (slots.pauseButton ? renderSlot(slots.pauseButton, slotProps.pauseButton) : defaultPauseBtn)}

      {enableLaps && mode === 'stopwatch' && isRunning && (
        slots.lapButton ? renderSlot(slots.lapButton, slotProps.lapButton) : defaultLapBtn
      )}

      {showEndButton &&
        !isComplete &&
        (isRunning || (mode === 'countdown' ? timeMs < initialTime * 1000 : timeMs > 0)) && (
          slots.endButton ? renderSlot(slots.endButton, slotProps.endButton) : defaultEndBtn
        )}

      {slots.resetButton ? renderSlot(slots.resetButton, slotProps.resetButton) : defaultResetBtn}
    </div>
  )
}

export const TimerControls = createInterfaceComponent<TimerControlsProps, TimerControlsSlots>(
  {
    name: 'TimerControls',
    category: 'data',
    description: 'Controls action bar with Start, Pause, Reset, Lap, and Stop buttons.',
    version: '1.0.0',
    slots: {
      startButton: undefined,
      pauseButton: undefined,
      lapButton: undefined,
      endButton: undefined,
      resetButton: undefined,
    },
  },
  TimerControlsPrimitive
)

/* ==========================================================================
   TimerLapItem & TimerLaps Sub-Atoms
   ========================================================================== */

export interface TimerLapItemProps extends HTMLAttributes<HTMLDivElement> {
  /** Lap record data. */
  lap: LapRecord
  /** Custom CSS classes. */
  className?: string
}

const TimerLapItemPrimitive = ({ lap, className, ...props }: TimerLapItemProps) => {
  const lapFormatted = formatTimeString(lap.time, true)
  const splitFormatted = formatTimeString(lap.splitTime, true)

  return (
    <div
      data-slot="timer-lap-item"
      className={cn(
        'flex items-center justify-between text-xs font-mono py-1.5 px-2.5 rounded-micro bg-muted/10 hover:bg-secondary/30 border border-border/25 transition-colors',
        className
      )}
      {...props}
    >
      <span className="text-primary/90 font-semibold">#{lap.lapIndex}</span>
      <span className="font-semibold text-fg/90">
        {lapFormatted.main}
        <span className="text-primary/75 text-[10px] ml-0.5">{lapFormatted.ms}</span>
      </span>
      <span className="text-muted-fg/80 font-normal">
        {splitFormatted.main}
        <span className="text-muted-fg/60 text-[10px] ml-0.5">{splitFormatted.ms}</span>
      </span>
    </div>
  )
}

export const TimerLapItem = createInterfaceComponent<TimerLapItemProps>(
  {
    name: 'TimerLapItem',
    category: 'data',
    description: 'Individual split lap record row.',
    version: '1.0.0',
  },
  TimerLapItemPrimitive
)

export interface TimerLapsSlots {
  /** Individual lap item renderer slot. */
  item?: React.ComponentType<TimerLapItemProps>
}

export interface TimerLapsProps extends HTMLAttributes<HTMLDivElement> {
  /** Array of recorded split laps. */
  laps: LapRecord[]
  /** Custom CSS classes. */
  className?: string
  /** Slot overrides. */
  slots?: SlotComponents<TimerLapsSlots>
  /** Slot props map. */
  slotProps?: SlotPropsMap<TimerLapsSlots>
}

const TimerLapsPrimitive = ({
  laps,
  className,
  slots = {},
  slotProps = {},
  ...props
}: TimerLapsProps) => {
  return (
    <div
      data-slot="timer-laps"
      className={cn(
        'w-full max-w-xs flex flex-col gap-1 pt-space-sm border-t border-border/40 max-h-40 overflow-y-auto',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between text-[11px] font-medium text-muted-fg/80 px-2 uppercase tracking-wider">
        <span>Lap</span>
        <span>Split</span>
        <span>Total</span>
      </div>
      {laps.map((lap) => (
        <React.Fragment key={lap.lapIndex}>
          {slots.item ? (
            renderSlot(slots.item, { lap, ...slotProps.item })
          ) : (
            <TimerLapItem lap={lap} {...slotProps.item} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export const TimerLaps = createInterfaceComponent<TimerLapsProps, TimerLapsSlots>(
  {
    name: 'TimerLaps',
    category: 'data',
    description: 'Split lap records table displaying sequential lap intervals and cumulative times.',
    version: '1.0.0',
    slots: {
      item: undefined,
    },
  },
  TimerLapsPrimitive
)

/* ==========================================================================
   Timer Root Component & Slots
   ========================================================================== */

export interface TimerSlots {
  /** Digits readout display slot. */
  display?: React.ComponentType<TimerDisplayProps>
  /** Circular progress ring slot. */
  ring?: React.ComponentType<TimerProgressRingProps>
  /** Action controls bar slot. */
  controls?: React.ComponentType<TimerControlsProps>
  /** Laps records split table slot. */
  laps?: React.ComponentType<TimerLapsProps>
  /** Start button slot. */
  startButton?: React.ComponentType<ButtonProps>
  /** Pause button slot. */
  pauseButton?: React.ComponentType<ButtonProps>
  /** Reset button slot. */
  resetButton?: React.ComponentType<ButtonProps>
  /** Lap button slot. */
  lapButton?: React.ComponentType<ButtonProps>
  /** End button slot. */
  endButton?: React.ComponentType<ButtonProps>
}

export interface TimerProps extends HTMLAttributes<HTMLDivElement> {
  /** Operating mode: stopwatch (count up) or countdown (count down). */
  mode?: TimerMode
  /** Initial time in seconds for countdown mode (default 300 = 5m). */
  initialTime?: number
  /** Optional target ceiling in seconds for stopwatch auto-stop. */
  targetTime?: number
  /** Callback fired when timer reaches 0 or hits target time. */
  onComplete?: () => void
  /** Callback fired when timer finishes or user presses End. */
  onEnd?: (finalTimeInSeconds: number) => void
  /** Periodic ticker callback fired once per elapsed second. */
  onTick?: (timeInSeconds: number) => void
  /** Callback fired when a new lap is recorded. */
  onLap?: (lap: LapRecord, allLaps: LapRecord[]) => void
  /** Whether to render default start/pause/reset control buttons. */
  showControls?: boolean
  /** Whether to render the explicit stop/end button. */
  showEndButton?: boolean
  /** Whether to render sub-second millisecond fractions. */
  showMilliseconds?: boolean
  /** Whether to render the concentric circular SVG progress ring. */
  showProgressRing?: boolean
  /** Whether to enable stopwatch lap recording. */
  enableLaps?: boolean
  /** Sizing ramp token: sm, md, or lg. */
  size?: TimerSize
  /** Container visual surface variant. */
  variant?: TimerVariant
  /** Layout direction alignment: vertical or horizontal. */
  alignment?: TimerAlignment
  /** Custom container CSS classes. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<TimerSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<TimerSlots>
}

const TimerPrimitiveComponent = ({
  className,
  mode = 'stopwatch',
  initialTime = 300,
  targetTime,
  onComplete,
  onEnd,
  onTick,
  onLap,
  showControls = true,
  showEndButton = true,
  showMilliseconds = false,
  showProgressRing = false,
  enableLaps = false,
  size = 'md',
  variant = 'card',
  alignment = 'vertical',
  slots = {},
  slotProps = {},
  ...props
}: TimerProps) => {
  const [timeMs, setTimeMs] = useState<number>(
    mode === 'countdown' ? initialTime * 1000 : 0
  )
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [isEnded, setIsEnded] = useState<boolean>(false)
  const [laps, setLaps] = useState<LapRecord[]>([])
  const lastTimestampRef = useRef<number | null>(null)
  const animFrameRef = useRef<number | null>(null)

  const prevInitialTimeRef = useRef(initialTime)
  const prevModeRef = useRef(mode)

  useEffect(() => {
    if (prevModeRef.current !== mode) {
      prevModeRef.current = mode
      prevInitialTimeRef.current = initialTime
      setIsRunning(false)
      setIsEnded(false)
      setTimeMs(mode === 'countdown' ? initialTime * 1000 : 0)
      setLaps([])
      return
    }

    if (prevInitialTimeRef.current !== initialTime) {
      prevInitialTimeRef.current = initialTime
      if (mode === 'countdown' && !isRunning && !isEnded) {
        setTimeMs(initialTime * 1000)
      }
    }
  }, [initialTime, mode, isRunning, isEnded])

  useEffect(() => {
    if (!isRunning) {
      lastTimestampRef.current = null
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
      return
    }

    const tick = (now: number) => {
      if (lastTimestampRef.current != null) {
        const delta = now - lastTimestampRef.current
        setTimeMs((prev) => {
          if (mode === 'stopwatch') {
            const next = prev + delta
            if (targetTime && next >= targetTime * 1000) {
              setIsRunning(false)
              setIsEnded(true)
              onComplete?.()
              onEnd?.(targetTime)
              return targetTime * 1000
            }
            onTick?.(Math.floor(next / 1000))
            return next
          } else {
            const next = prev - delta
            if (next <= 0) {
              setIsRunning(false)
              setIsEnded(true)
              onComplete?.()
              onEnd?.(0)
              return 0
            }
            onTick?.(Math.floor(next / 1000))
            return next
          }
        })
      }
      lastTimestampRef.current = now
      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [isRunning, mode, targetTime, onComplete, onEnd, onTick])

  const handleStart = () => {
    setIsEnded(false)
    if (mode === 'countdown' && timeMs === 0) {
      setTimeMs(initialTime * 1000)
    }
    setIsRunning(true)
  }

  const handlePause = () => setIsRunning(false)

  const handleReset = () => {
    setIsRunning(false)
    setIsEnded(false)
    setTimeMs(mode === 'countdown' ? initialTime * 1000 : 0)
    setLaps([])
  }

  const handleEnd = () => {
    setIsRunning(false)
    setIsEnded(true)
    if (mode === 'countdown') {
      setTimeMs(0)
      onComplete?.()
      onEnd?.(0)
    } else {
      const finalSec = Math.floor(timeMs / 1000)
      onComplete?.()
      onEnd?.(finalSec)
    }
  }

  const handleRecordLap = () => {
    const prevTotalLapMs = laps.reduce((acc, l) => acc + l.time, 0)
    const thisLapMs = timeMs - prevTotalLapMs
    const newRecord: LapRecord = {
      lapIndex: laps.length + 1,
      time: thisLapMs,
      splitTime: timeMs,
    }
    const updated = [newRecord, ...laps]
    setLaps(updated)
    onLap?.(newRecord, updated)
  }

  const isComplete =
    isEnded ||
    (mode === 'countdown' && timeMs === 0 && !isRunning) ||
    (mode === 'stopwatch' && targetTime != null && timeMs >= targetTime * 1000)
  const timeFormatted = formatTimeString(timeMs, showMilliseconds)

  let progressFraction = 1
  if (mode === 'countdown' && initialTime > 0) {
    progressFraction = Math.max(0, Math.min(1, timeMs / (initialTime * 1000)))
  } else if (mode === 'stopwatch' && targetTime && targetTime > 0) {
    progressFraction = Math.max(0, Math.min(1, 1 - timeMs / (targetTime * 1000)))
  }

  const isCompact = variant === 'compact' || variant === 'inline'
  const isRow = alignment === 'horizontal' || variant === 'inline'

  const containerVariantClasses = {
    card: 'rounded-macro border border-border/40 bg-card/60 backdrop-blur-md p-space-lg transition-all',
    plain: 'p-space-xs',
    compact: 'rounded-base border border-border/40 bg-card/50 backdrop-blur-sm p-space-md',
    inline: 'p-1',
  }

  const defaultDisplay = (
    <TimerDisplay
      size={size}
      isCompact={isCompact}
      timeString={timeFormatted}
      showMilliseconds={showMilliseconds}
      {...slotProps.display}
    />
  )

  const defaultControls = (
    <TimerControls
      isRunning={isRunning}
      mode={mode}
      timeMs={timeMs}
      initialTime={initialTime}
      isComplete={isComplete}
      enableLaps={enableLaps}
      showEndButton={showEndButton}
      onStart={handleStart}
      onPause={handlePause}
      onReset={handleReset}
      onEnd={handleEnd}
      onLap={handleRecordLap}
      slots={{
        startButton: slots.startButton,
        pauseButton: slots.pauseButton,
        resetButton: slots.resetButton,
        lapButton: slots.lapButton,
        endButton: slots.endButton,
        ...slotProps.controls?.slots,
      }}
      slotProps={slotProps.controls?.slotProps}
      {...slotProps.controls}
    />
  )

  const defaultLaps = (
    <TimerLaps laps={laps} {...slotProps.laps} />
  )

  return (
    <div
      data-slot="timer"
      className={cn(
        'inline-flex w-fit h-fit max-w-full text-fg',
        containerVariantClasses[variant],
        isRow ? 'flex-row items-center gap-space-md' : 'flex-col items-center gap-space-lg',
        className
      )}
      {...props}
    >
      {/* Progress Ring Mode */}
      {showProgressRing && (mode === 'countdown' || (mode === 'stopwatch' && targetTime != null)) ? (
        slots.ring ? (
          renderSlot(slots.ring, {
            size,
            progressFraction,
            isComplete,
            children: slots.display ? renderSlot(slots.display, slotProps.display) : defaultDisplay,
            ...slotProps.ring,
          })
        ) : (
          <TimerProgressRing
            size={size}
            progressFraction={progressFraction}
            isComplete={isComplete}
            {...slotProps.ring}
          >
            {slots.display ? renderSlot(slots.display, slotProps.display) : defaultDisplay}
          </TimerProgressRing>
        )
      ) : (
        <div className="flex flex-col items-center gap-1">
          {slots.display ? renderSlot(slots.display, slotProps.display) : defaultDisplay}
        </div>
      )}

      {/* Controls Bar */}
      {showControls &&
        (slots.controls
          ? renderSlot(slots.controls, {
              isRunning,
              mode,
              timeMs,
              initialTime,
              isComplete,
              enableLaps,
              showEndButton,
              onStart: handleStart,
              onPause: handlePause,
              onReset: handleReset,
              onEnd: handleEnd,
              onLap: handleRecordLap,
              ...slotProps.controls,
            })
          : defaultControls)}

      {/* Laps List */}
      {enableLaps && laps.length > 0 &&
        (slots.laps
          ? renderSlot(slots.laps, { laps, ...slotProps.laps })
          : defaultLaps)}
    </div>
  )
}

export const Timer = createInterfaceComponent<TimerProps, TimerSlots>(
  {
    name: 'Timer',
    category: 'data',
    description: 'High-precision countdown and stopwatch timer with split lap tracking and circular progress arcs.',
    version: '1.0.0',
    slots: {
      display: TimerDisplay,
      ring: undefined,
      controls: TimerControls,
      laps: TimerLaps,
      startButton: undefined,
      pauseButton: undefined,
      resetButton: undefined,
      lapButton: undefined,
      endButton: undefined,
    },
  },
  TimerPrimitiveComponent
)

// Attachments
Timer.Display = TimerDisplay
Timer.Ring = TimerProgressRing
Timer.Controls = TimerControls
Timer.Laps = TimerLaps
Timer.LapItem = TimerLapItem

export const { Context: TimerContext, useCompoundContext: useTimerContext } =
  createCompoundContext<any>('Timer')
