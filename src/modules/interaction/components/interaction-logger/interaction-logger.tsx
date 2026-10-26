import React, { useState } from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { useInteraction } from '../../context'
import type { InteractionLogEntry } from '../../engine/types'

export interface InteractionLoggerSlotProps {
  /** Total log count. */
  logCount: number
  /** Whether logger is paused. */
  isPaused: boolean
  /** Latest log entry. */
  latestLog?: InteractionLogEntry
}

export interface InteractionLoggerSlots {
  /** Custom header badge or status pill. */
  headerBadge?: React.ComponentType<InteractionLoggerSlotProps>
  /** Clear button slot. */
  clearButton?: React.ComponentType<{ onClear: () => void }>
}

export interface InteractionLoggerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum number of log items displayed. Default `10`. */
  maxDisplayItems?: number
  /** Position placement of the HUD. Default `'bottom-right'`. */
  placement?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  /** Whether the logger inspector is initially expanded. Default `false`. */
  defaultExpanded?: boolean
  /** Slot overrides map. */
  slots?: SlotComponents<InteractionLoggerSlots>
  /** Slot props map. */
  slotProps?: SlotPropsMap<InteractionLoggerSlots>
}

const InteractionLoggerPrimitive = ({
  maxDisplayItems = 10,
  placement = 'bottom-right',
  defaultExpanded = false,
  className,
  slots,
  slotProps,
  ...props
}: InteractionLoggerProps) => {
  const { logs, stats, keyBuffer, isPaused, pause, resume, clearLogs } = useInteraction()
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const displayedLogs = logs.slice(0, maxDisplayItems)

  const placementClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  }[placement]

  const slotContext: InteractionLoggerSlotProps = {
    logCount: logs.length,
    isPaused,
    latestLog: logs[0],
  }

  return (
    <div
      data-slot="interaction-logger"
      className={cn(
        'fixed z-50 flex flex-col font-mono text-xs rounded-macro border border-border bg-bg/95 backdrop-blur-md shadow-2xl transition-all duration-200 text-fg',
        placementClasses,
        isExpanded ? 'w-80 md:w-96 max-h-105' : 'w-auto',
        className
      )}
      {...props}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 p-space-sm border-b border-border/80 bg-muted/30">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-2 text-left font-semibold text-fg cursor-pointer hover:opacity-80 select-none"
        >
          <span className="inline-block size-2 rounded-full bg-primary animate-pulse" />
          <span>Interaction Engine</span>
          <span className="px-1.5 py-0.5 rounded-atom bg-muted text-[10px] text-muted-fg font-normal">
            {stats.totalEvents} ev
          </span>
        </button>

        {slots?.headerBadge && renderSlot(slots.headerBadge, { ...slotProps?.headerBadge, ...slotContext })}

        <div className="flex items-center gap-1.5 ml-auto">
          {isExpanded && (
            <>
              <button
                type="button"
                onClick={isPaused ? resume : pause}
                className="px-2 py-0.5 rounded-atom bg-secondary hover:bg-secondary/80 text-[10px] font-medium text-secondary-fg cursor-pointer"
              >
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              {slots?.clearButton ? (
                renderSlot(slots.clearButton, {
            ...slotProps?.clearButton, onClear: clearLogs })
              ) : (
                <button
                  type="button"
                  onClick={clearLogs}
                  className="px-2 py-0.5 rounded-atom hover:bg-muted text-[10px] text-muted-fg hover:text-fg cursor-pointer"
                >
                  Clear
                </button>
              )}
            </>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="px-1.5 py-0.5 rounded-atom hover:bg-muted text-muted-fg text-[11px] cursor-pointer"
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>
      </div>

      {/* Expanded Logs Body */}
      {isExpanded && (
        <div className="flex flex-col min-h-0 overflow-y-auto p-space-sm gap-y-1.5">
          {keyBuffer.length > 0 && (
            <div className="flex items-center gap-1.5 p-1.5 rounded-micro bg-primary/10 border border-primary/20 text-[11px] text-primary">
              <span className="font-semibold">Keys:</span>
              <span className="font-mono font-bold tracking-wider">{keyBuffer.join(' ')}</span>
            </div>
          )}

          {displayedLogs.length === 0 ? (
            <div className="py-6 text-center text-muted-fg text-[11px]">
              No interaction events logged yet.
            </div>
          ) : (
            displayedLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between gap-2 p-1.5 rounded-micro bg-muted/40 border border-border/40 text-[11px]"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className={cn(
                      'px-1 py-0.2 rounded-atom font-semibold text-[9px] uppercase',
                      log.matched ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-fg'
                    )}
                  >
                    {log.eventType}
                  </span>
                  <span className="text-fg font-medium truncate">
                    &lt;{log.targetTag}&gt;
                  </span>
                  {log.targetSelector && (
                    <span className="text-muted-fg truncate text-[10px]">
                      {log.targetSelector}
                    </span>
                  )}
                </div>

                {log.durationMs !== undefined && (
                  <span className="shrink-0 text-muted-fg text-[10px]">
                    {log.durationMs}ms
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export const InteractionLogger = createInterfaceComponent<
  InteractionLoggerProps,
  InteractionLoggerSlots
>(
  {
    name: 'InteractionLogger',
    category: 'feedback',
    description: 'Real-time floating DevTools inspector HUD for interaction engine events, rules, and key chords.',
    version: '1.0.0',
    props: {
      maxDisplayItems: 10,
      placement: 'bottom-right',
      defaultExpanded: false,
    },
    slots: {
      headerBadge: undefined,
      clearButton: undefined,
    },
  },
  InteractionLoggerPrimitive
)
