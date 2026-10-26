'use client'

import React, { useState, useEffect, type ReactNode } from 'react'
import {
  CheckIcon,
  MicrophoneIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Button, type ButtonProps } from '../../../core/components/button'
import type { AgentState } from '../../engine/types'
import { LiveWaveform } from '../live-waveform'

/* ==========================================================================
   VoiceButton Slots & Props
   ========================================================================== */

export type VoiceButtonState = AgentState

export interface VoiceButtonSlots {
  /** Default microphone icon */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Success checkmark icon */
  checkIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Error close icon */
  xMarkIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface VoiceButtonProps
  extends Omit<ButtonProps, 'children' | 'isPending' | 'slots' | 'slotProps'> {
  /** Current agent or recording state */
  state?: VoiceButtonState
  /** Leading text label */
  label?: ReactNode
  /** Trailing shortcut or icon (e.g. '⌘K') */
  trailing?: ReactNode
  /** Custom mic or action icon */
  icon?: ReactNode
  /** ClassName applied to waveform viewport container */
  waveformClassName?: string
  /** Duration in ms to display success or error state */
  feedbackDuration?: number
  /** Slot overrides map */
  slotProps?: SlotPropsMap<VoiceButtonSlots>
  /** Custom slot components */
  slots?: SlotComponents<VoiceButtonSlots>
}

function VoiceButtonPrimitive({
  state = 'idle',
  onPress,
  label = 'Ask AI',
  trailing = '⌘K',
  icon,
  size = 'md',
  intent = 'outline',
  waveformClassName,
  feedbackDuration = 1500,
  isDisabled,
  className,
  slots,
  slotProps,
  ...props
}: VoiceButtonProps) {
  const [showFeedback, setShowFeedback] = useState(false)

  useEffect(() => {
    if (state === 'success' || state === 'error') {
      setShowFeedback(true)
      const timer = setTimeout(() => setShowFeedback(false), feedbackDuration)
      return () => clearTimeout(timer)
    } else {
      setShowFeedback(false)
    }
  }, [state, feedbackDuration])

  const isRecording = state === 'recording' || state === 'listening'
  const isProcessing = state === 'processing' || state === 'thinking'
  const isSpeaking = state === 'speaking'
  const isSuccess = state === 'success'
  const isError = state === 'error'

  const shouldShowWaveform = isRecording || isProcessing || isSpeaking || showFeedback
  const shouldShowTrailing = !shouldShowWaveform && trailing

  return (
    <Button
      type="button"
      intent={isRecording ? 'primary' : intent}
      size={size}
      onPress={onPress}
      isDisabled={isDisabled || isProcessing}
      className={cn(
        'gap-space-2 transition-all duration-200',
        String(size).startsWith('sq-') && 'relative',
        className
      )}
      aria-label="Voice Assistant"
      {...props}
    >
      {!String(size).startsWith('sq-') && label && (
        <span className="inline-flex shrink-0 items-center justify-start text-xs font-medium">
          {label}
        </span>
      )}

      <div
        className={cn(
          'relative flex shrink-0 items-center justify-center overflow-hidden text-current transition-all duration-300',
          String(size).startsWith('sq-')
            ? 'absolute inset-0 rounded-micro bg-current/15'
            : 'h-5 w-24 rounded-micro border border-current/35 bg-current/15',
          waveformClassName
        )}
      >
        {shouldShowWaveform && (
          <LiveWaveform
            active={false}
            processing={isProcessing || isSuccess}
            demo={shouldShowWaveform}
            barWidth={2}
            barGap={1}
            barRadius={1}
            fadeEdges={false}
            sensitivity={1.8}
            height={18}
            mode="static"
            className="absolute inset-0 size-full text-current transition-opacity duration-300"
          />
        )}

        {shouldShowTrailing && (
          <div className="absolute inset-0 flex items-center justify-center">
            {typeof trailing === 'string' ? (
              <span className="font-mono text-[10px] font-medium text-current/80 select-none">
                {trailing}
              </span>
            ) : (
              trailing
            )}
          </div>
        )}

        {!shouldShowWaveform && !shouldShowTrailing && (
          <div className="flex items-center justify-center text-current/90">
            {icon ||
              renderSlot(
                slots?.icon,
                { className: 'size-4', ...slotProps?.icon },
                { defaultComponent: MicrophoneIcon }
              )}
          </div>
        )}

        {isSuccess && showFeedback && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/90">
            {renderSlot(
              slots?.checkIcon,
              { className: 'size-3.5 text-emerald-500', ...slotProps?.checkIcon },
              { defaultComponent: CheckIcon }
            )}
          </div>
        )}

        {isError && showFeedback && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/90">
            {renderSlot(
              slots?.xMarkIcon,
              { className: 'size-3.5 text-danger', ...slotProps?.xMarkIcon },
              { defaultComponent: XMarkIcon }
            )}
          </div>
        )}
      </div>
    </Button>
  )
}

export const VoiceButton = createInterfaceComponent<VoiceButtonProps, VoiceButtonSlots>(
  {
    name: 'VoiceButton',
    category: 'media',
    description: 'AI voice assistant interactive button with reactive audio waveform states.',
    version: '1.0.0',
    slots: {
      icon: MicrophoneIcon,
      checkIcon: CheckIcon,
      xMarkIcon: XMarkIcon,
    },
  },
  VoiceButtonPrimitive
)
