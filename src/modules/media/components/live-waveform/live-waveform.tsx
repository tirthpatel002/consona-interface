'use client'

import React, { useEffect, useMemo, useRef, useState, type HTMLAttributes } from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { generateSyntheticBands } from '../../engine/analyser'
import { useLiveAudioBands } from '../../hooks/use-audio-analyser'

export interface LiveWaveformBarProps extends HTMLAttributes<HTMLDivElement> {
  /** Index of the bar in the waveform. */
  index?: number
  /** Amplitude / frequency value of this bar (0 to 1). */
  value?: number
  /** Whether the waveform visualizer is currently idle. */
  isIdle?: boolean
}

export interface LiveWaveformSlots {
  /** Injected fallback or empty state element when offline. */
  fallback?: React.ComponentType<HTMLAttributes<HTMLDivElement>>
  /** Custom bar atom renderer. */
  bar?: React.ComponentType<LiveWaveformBarProps>
}

export interface LiveWaveformProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onError'> {
  /** Whether microphone listening and visualization is currently active. */
  active?: boolean
  /** Whether the audio pipeline is processing an AI response (renders animated sine wave). */
  processing?: boolean
  /** Enable demo mode with synthetic animated waves without requesting microphone access. */
  demo?: boolean
  /** Specific microphone device ID to record from. */
  deviceId?: string
  /** Existing MediaStream to analyze instead of capturing microphone. */
  mediaStream?: MediaStream | null
  /** Bar width in pixels. */
  barWidth?: number
  /** Base minimum bar height in pixels. */
  barHeight?: number
  /** Spacing gap between bars in pixels. */
  barGap?: number
  /** Corner radius in pixels for bar caps. */
  barRadius?: number
  /** Bar color override (defaults to currentColor or primary token). */
  barColor?: string
  /** Fixed number of bars to render. */
  barCount?: number
  /** Whether to fade the outer edges using gradient masks. */
  fadeEdges?: boolean
  /** Width in pixels for edge gradient masks. */
  fadeWidth?: number
  /** Component height in pixels or CSS height string. */
  height?: string | number
  /** Sensitivity multiplier for audio amplitude scaling. */
  sensitivity?: number
  /** Analyser smoothing time constant (0 to 1). */
  smoothingTimeConstant?: number
  /** Fast Fourier Transform size for analyser node. */
  fftSize?: number
  /** Frame update rate for analyser polling in ms. */
  updateRate?: number
  /** Display mode: static centered bars or scrolling timeline. */
  mode?: 'scrolling' | 'static'
  /** Error callback for microphone permission failures or context errors. */
  onError?: (error: Error) => void
  /** Callback fired when a MediaStream is captured and ready. */
  onStreamReady?: (stream: MediaStream) => void
  /** Callback fired when the active stream ends. */
  onStreamEnd?: () => void
  /** Slot overrides map. */
  slots?: SlotComponents<LiveWaveformSlots>
  /** Property overrides passed down to injected slots. */
  slotProps?: SlotPropsMap<LiveWaveformSlots>
}

const LiveWaveformPrimitive = ({
  active = false,
  processing = false,
  demo = false,
  deviceId,
  mediaStream: externalStream,
  barWidth = 3,
  barGap = 2,
  barRadius = 9999,
  barColor,
  barCount = 36,
  fadeEdges = true,
  fadeWidth = 24,
  barHeight = 4,
  height = 48,
  sensitivity = 1.2,
  smoothingTimeConstant = 0.8,
  fftSize = 256,
  updateRate = 30,
  mode = 'static',
  onError,
  onStreamReady,
  onStreamEnd,
  className,
  style,
  slots,
  slotProps,
  ...props
}: LiveWaveformProps) => {
  const [internalStream, setInternalStream] = useState<MediaStream | null>(null)
  const [scrollingHistory, setScrollingHistory] = useState<number[]>(() =>
    new Array(barCount).fill(0.08)
  )

  const activeStream = externalStream || internalStream
  const isDemo = demo || (!activeStream && (active || processing))

  // Manage microphone capture when active && !demo && !externalStream
  useEffect(() => {
    if (!active || demo || externalStream) {
      if (internalStream) {
        internalStream.getTracks().forEach((track) => track.stop())
        setInternalStream(null)
        onStreamEnd?.()
      }
      return
    }

    let isCancelled = false

    const setupMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: deviceId
            ? {
                deviceId: { exact: deviceId },
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              }
            : {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
        })

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        setInternalStream(stream)
        onStreamReady?.(stream)
      } catch (err) {
        if (!isCancelled) {
          onError?.(err instanceof Error ? err : new Error(String(err)))
        }
      }
    }

    setupMic()

    return () => {
      isCancelled = true
      if (internalStream) {
        internalStream.getTracks().forEach((track) => track.stop())
        setInternalStream(null)
        onStreamEnd?.()
      }
    }
  }, [active, demo, deviceId, externalStream, onError, onStreamReady, onStreamEnd])

  // Hook into Audio Analyser Engine
  const analyserOptions = useMemo(
    () => ({
      fftSize,
      smoothingTimeConstant,
    }),
    [fftSize, smoothingTimeConstant]
  )

  const liveData = useLiveAudioBands(activeStream, {
    bands: barCount,
    demo: isDemo,
    state: processing ? 'thinking' : 'speaking',
    updateInterval: updateRate,
    analyserOptions,
  })

  // Handle scrolling mode history queue with proper time-stepping
  useEffect(() => {
    if (mode !== 'scrolling') return

    let lastUpdate = 0
    let animId: number
    const interval = Math.max(25, updateRate)

    const updateScroll = (timestamp: number) => {
      if (timestamp - lastUpdate >= interval) {
        lastUpdate = timestamp
        const time = timestamp / 1000

        let sampleVal = 0.08
        if (isDemo) {
          // Acoustic speech cadence simulation: dynamic energy packets & natural pauses
          const cadence = Math.max(0.04, Math.sin(time * 2.2) * 0.45 + Math.cos(time * 0.9) * 0.25 + 0.1)
          const voice = (Math.sin(time * 7.5) * 0.22 + Math.cos(time * 13.0) * 0.14 + 0.35) * cadence
          sampleVal = Math.max(0.08, Math.min(0.80, 0.08 + voice * 0.65))
        } else if (activeStream) {
          const rawVol = liveData.volume
          const noiseGate = 0.02
          const gated = Math.max(0, rawVol - noiseGate) / (1 - noiseGate)
          sampleVal = Math.max(0.06, Math.min(0.85, Math.pow(gated, 0.85) * 0.95 * sensitivity))
        }

        setScrollingHistory((prev) => {
          const current = prev.length === barCount ? prev : new Array(barCount).fill(0.08)
          return [...current.slice(1), sampleVal]
        })
      }

      animId = requestAnimationFrame(updateScroll)
    }

    animId = requestAnimationFrame(updateScroll)
    return () => {
      if (animId) cancelAnimationFrame(animId)
    }
  }, [mode, isDemo, activeStream, liveData.volume, sensitivity, barCount, updateRate])

  // Determine active bars array based on mode
  const barsData: number[] = useMemo(() => {
    if (!active && !processing && !demo) {
      return new Array(barCount).fill(0)
    }

    if (mode === 'scrolling') {
      return scrollingHistory.length === barCount
        ? scrollingHistory
        : new Array(barCount).fill(0.08)
    }

    // Static mode: compute symmetrical centered acoustic wave
    if (isDemo) {
      return liveData.bands
    }

    const half = Math.floor(barCount / 2)
    if (barCount > 6 && liveData.bands.length > 0) {
      const reflected: number[] = new Array(barCount)
      for (let i = 0; i < half; i++) {
        const raw = liveData.bands[i] ?? 0.06
        const val = Math.max(0.06, Math.min(0.85, raw * 0.95))
        reflected[half - 1 - i] = val
        reflected[half + i] = val
      }
      return reflected
    }

    return liveData.bands.map((v) => Math.max(0.06, Math.min(0.85, v * 0.95)))
  }, [active, processing, demo, mode, barCount, scrollingHistory, isDemo, liveData.bands])

  const heightStyle = typeof height === 'number' ? `${height}px` : height
  const isIdle = !active && !processing && !demo

  const maskStyle: React.CSSProperties =
    fadeEdges && fadeWidth > 0
      ? {
          WebkitMaskImage: `linear-gradient(to right, transparent, black ${fadeWidth}px, black calc(100% - ${fadeWidth}px), transparent)`,
          maskImage: `linear-gradient(to right, transparent, black ${fadeWidth}px, black calc(100% - ${fadeWidth}px), transparent)`,
        }
      : {}

  return (
    <div
      data-slot="live-waveform"
      data-mode={mode}
      data-active={active ? '' : undefined}
      data-processing={processing ? '' : undefined}
      style={{
        height: heightStyle,
        ...maskStyle,
        ...style,
      }}
      className={cn(
        'relative flex items-center justify-center w-full select-none overflow-hidden transition-opacity duration-300',
        className
      )}
      aria-label={
        active ? 'Live audio waveform' : processing ? 'Processing audio' : 'Audio waveform idle'
      }
      role="img"
      {...props}
    >
      {isIdle && (
        renderSlot(
          slots?.fallback,
          {
            className: 'absolute top-1/2 right-0 left-0 -translate-y-1/2 border-t border-dotted border-current/25 pointer-events-none',
            ...slotProps?.fallback,
          }
        ) ?? (
          <div className="absolute top-1/2 right-0 left-0 -translate-y-1/2 border-t border-dotted border-current/25 pointer-events-none" />
        )
      )}

      <div
        className="flex items-center justify-center size-full"
        style={{
          gap: `${barGap}px`,
        }}
      >
        {barsData.map((val, idx) => {
          const clampedVal = Math.max(0.06, Math.min(0.9, val))
          const heightPercent = isIdle ? 0 : Math.max(8, Math.round(clampedVal * 75))
          const opacity = isIdle ? 0.2 : Math.min(1, Math.max(0.4, 0.35 + clampedVal * 0.65))

          const defaultBar = (
            <div
              key={idx}
              data-slot="live-waveform-bar"
              className={cn(
                'shrink-0 transition-[height] duration-75 ease-out',
                !barColor && 'bg-primary'
              )}
              style={{
                width: `${barWidth}px`,
                minHeight: `${barHeight}px`,
                height: isIdle ? `${barHeight}px` : `${heightPercent}%`,
                borderRadius: `${barRadius}px`,
                backgroundColor: barColor || undefined,
                opacity,
              }}
            />
          )

          return (
            <React.Fragment key={idx}>
              {renderSlot(
                slots?.bar,
                {
                  index: idx,
                  value: val,
                  isIdle,
                  children: defaultBar,
                  ...slotProps?.bar,
                }
              ) ?? defaultBar}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

export const LiveWaveform = createInterfaceComponent<LiveWaveformProps, LiveWaveformSlots>(
  {
    name: 'LiveWaveform',
    category: 'media',
    description:
      'Ultra-crisp real-time audio visualizer with multi-band frequency analysis and smooth streaming modes.',
    version: '2.0.0',
    slots: {
      fallback: undefined,
      bar: undefined,
    },
  },
  LiveWaveformPrimitive
)
