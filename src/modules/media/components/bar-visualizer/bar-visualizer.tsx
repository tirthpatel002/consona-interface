'use client'

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
} from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { useMultibandVolume } from '../../hooks/use-audio-analyser'
import { generateSyntheticBands } from '../../engine/analyser'
import type { AgentState } from '../../engine/types'

/* ==========================================================================
   BarVisualizer Sub-Atom: Bar
   ========================================================================== */

export interface BarVisualizerBarProps extends HTMLAttributes<HTMLDivElement> {
  /** Height in percent (0 to 100). */
  heightPercent: number
  /** Color of the bar. */
  barColor?: string
  /** Whether the bar is in active/highlighted state. */
  isHighlighted?: boolean
  /** Active voice assistant / agent state. */
  state?: AgentState
}

const BarVisualizerBarPrimitive = ({
  heightPercent,
  barColor,
  isHighlighted,
  state,
  className,
  style,
  ...props
}: BarVisualizerBarProps) => {
  return (
    <div
      data-slot="bar-visualizer-bar"
      className={cn(
        'min-w-[4px] max-w-[14px] flex-1 rounded-full select-none transition-colors duration-200',
        state === 'speaking' && 'bg-primary shadow-[0_0_10px_rgba(var(--color-primary),0.35)]',
        state === 'thinking' && 'bg-primary/90 shadow-[0_0_8px_rgba(var(--color-primary),0.35)]',
        state === 'listening' && 'bg-primary/80 shadow-[0_0_8px_rgba(var(--color-primary),0.25)]',
        (state === 'connecting' || state === 'initializing') &&
          'bg-primary/80 shadow-[0_0_8px_rgba(var(--color-primary),0.3)]',
        state === 'idle' && 'bg-muted-fg/40',
        state === 'muted' && 'bg-muted-fg/20',
        state === 'success' && 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]',
        state === 'error' && 'bg-danger shadow-[0_0_10px_rgba(239,68,68,0.4)]',
        !state && (isHighlighted ? 'bg-primary shadow-xs' : 'bg-muted-fg/40'),
        className
      )}
      style={{
        height: `${heightPercent.toFixed(2)}%`,
        backgroundColor: barColor,
        ...style,
      }}
      {...props}
    />
  )
}

export const BarVisualizerBar = createInterfaceComponent<BarVisualizerBarProps>(
  {
    name: 'BarVisualizerBar',
    category: 'media',
    description: 'Individual animated equalizer bar in BarVisualizer.',
    version: '1.0.0',
  },
  BarVisualizerBarPrimitive
)

/* ==========================================================================
   BarVisualizer Root Component
   ========================================================================== */

export interface BarVisualizerSlots {
  /** Custom bar renderer component slot. */
  bar?: React.ComponentType<BarVisualizerBarProps>
}

export interface BarVisualizerProps extends HTMLAttributes<HTMLDivElement> {
  /** Voice assistant or agent lifecycle state. */
  state?: AgentState
  /** Total number of equalizer bars to display. */
  barCount?: number
  /** Audio source media stream to monitor. */
  mediaStream?: MediaStream | null
  /** Audio media element to analyze. */
  audioElement?: HTMLMediaElement | null
  /** Minimum bar height percentage (0 - 100). */
  minHeight?: number
  /** Maximum bar height percentage (0 - 100). */
  maxHeight?: number
  /** Whether to simulate activity with continuous sine wave demo loop. */
  demo?: boolean
  /** Bar vertical alignment. */
  align?: 'center' | 'bottom'
  /** Legacy alias for align="center". */
  centerAlign?: boolean
  /** Default bar fill color token or CSS string. */
  barColor?: string
  /** Highlighted active bar color token or CSS string. */
  highlightColor?: string
  /** Slot overrides map. */
  slots?: SlotComponents<BarVisualizerSlots>
  /** Property overrides passed down to injected slots. */
  slotProps?: SlotPropsMap<BarVisualizerSlots>
}

export const useBarAnimator = (
  state: AgentState | undefined,
  columns: number,
  interval: number
): number[] => {
  const indexRef = useRef(0)
  const [currentFrame, setCurrentFrame] = useState<number[]>([])
  const animationFrameId = useRef<number | null>(null)

  const sequence = useMemo(() => {
    if (state === 'thinking' || state === 'listening') {
      const center = Math.floor(columns / 2)
      return [[center], [-1]]
    } else if (state === 'connecting' || state === 'initializing') {
      const seq: number[][] = []
      for (let x = 0; x < columns; x++) {
        seq.push([x, columns - 1 - x])
      }
      return seq.length ? seq : [[]]
    } else if (state === 'speaking') {
      return [new Array(columns).fill(0).map((_, idx) => idx)]
    } else {
      return [[]]
    }
  }, [state, columns])

  useEffect(() => {
    indexRef.current = 0
    setCurrentFrame(sequence[0] || [])
  }, [sequence])

  useEffect(() => {
    let startTime = performance.now()

    const animate = (time: DOMHighResTimeStamp) => {
      const timeElapsed = time - startTime

      if (timeElapsed >= interval) {
        indexRef.current = (indexRef.current + 1) % sequence.length
        setCurrentFrame(sequence[indexRef.current] || [])
        startTime = time
      }

      animationFrameId.current = requestAnimationFrame(animate)
    }

    animationFrameId.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [interval, sequence])

  return currentFrame
}

const BarVisualizerPrimitive = ({
  state = 'idle',
  barCount = 15,
  mediaStream,
  audioElement,
  minHeight = 15,
  maxHeight = 95,
  demo = false,
  align,
  centerAlign = false,
  className,
  style,
  barColor,
  highlightColor,
  slots,
  slotProps,
  ...props
}: BarVisualizerProps) => {
  const isCentered = align === 'center' || centerAlign
  const audioSource = mediaStream || audioElement || null

  const realVolumeBands = useMultibandVolume(audioSource, {
    bands: barCount,
    loPass: 100,
    hiPass: 300,
    updateInterval: 32,
  })

  const [fakeVolumeBands, setFakeVolumeBands] = useState<number[]>(() =>
    new Array(barCount).fill(0.2)
  )

  // Pure continuous sine wave animation loop (60fps RAF)
  useEffect(() => {
    if (!demo && audioSource) return

    let animId: number
    const startTime = performance.now() / 1000

    const updateSineWave = () => {
      const time = performance.now() / 1000 - startTime
      const newBands = generateSyntheticBands(state, time, barCount)
      setFakeVolumeBands(newBands)
      animId = requestAnimationFrame(updateSineWave)
    }

    animId = requestAnimationFrame(updateSineWave)

    return () => {
      if (animId) cancelAnimationFrame(animId)
    }
  }, [demo, audioSource, state, barCount])

  const bands = audioSource && !demo ? realVolumeBands : fakeVolumeBands

  return (
    <div
      data-slot="bar-visualizer"
      data-state={state}
      className={cn(
        'relative flex h-32 w-full justify-center gap-1.5 overflow-hidden rounded-xl border border-border/40 bg-muted/40 p-4 backdrop-blur-sm transition-colors select-none',
        isCentered ? 'items-center' : 'items-end',
        className
      )}
      style={style}
      {...props}
    >
      {bands.map((val, idx) => {
        const clampedVol = Math.max(0, Math.min(1, val ?? 0))
        const heightPercent = minHeight + clampedVol * (maxHeight - minHeight)
        const isHighlighted = clampedVol > 0.35 || state === 'speaking' || state === 'recording'
        const color = highlightColor || barColor || undefined

        return (
          <React.Fragment key={idx}>
            {renderSlot(slots?.bar, {
              heightPercent,
              barColor: color,
              isHighlighted,
              state,
              ...slotProps?.bar,
            }, {
              defaultComponent: BarVisualizerBar,
            })}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export const BarVisualizer = createInterfaceComponent<BarVisualizerProps, BarVisualizerSlots>(
  {
    name: 'BarVisualizer',
    category: 'media',
    description: 'Multiband equalizer bar visualizer with AI assistant state reactivity.',
    version: '1.0.0',
    slots: {
      bar: BarVisualizerBar,
    },
  },
  BarVisualizerPrimitive
)

// Namespace attachments for compound family ergonomics
BarVisualizer.Bar = BarVisualizerBar
