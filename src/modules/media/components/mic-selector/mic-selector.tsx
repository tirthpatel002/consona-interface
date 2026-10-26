'use client'

import React, { useState, useEffect, type HTMLAttributes } from 'react'
import {
  CheckIcon,
  ChevronUpDownIcon,
  MicrophoneIcon,
  SpeakerXMarkIcon,
} from '@heroicons/react/24/solid'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { useAudioDevices } from '../../hooks/use-audio-devices'
import { LiveWaveform } from '../live-waveform'

/* ==========================================================================
   MicSelector Sub-Atoms
   ========================================================================== */

export interface MicSelectorMuteButtonProps extends HTMLAttributes<HTMLButtonElement> {
  /** Whether the microphone is muted. */
  isMuted?: boolean
  /** Toggle mute callback. */
  onToggleMute?: () => void
}

const MicSelectorMuteButtonPrimitive = ({
  isMuted,
  onToggleMute,
  className,
  ...props
}: MicSelectorMuteButtonProps) => {
  return (
    <button
      type="button"
      data-slot="mic-selector-mute-button"
      onClick={onToggleMute}
      aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
      className={cn(
        'flex size-8 items-center justify-center rounded-base text-muted-fg transition-colors hover:bg-muted hover:text-fg cursor-pointer',
        isMuted && 'text-danger bg-danger/10 hover:bg-danger/20',
        className
      )}
      {...props}
    >
      {isMuted ? <SpeakerXMarkIcon className="size-4" /> : <MicrophoneIcon className="size-4" />}
    </button>
  )
}

export const MicSelectorMuteButton = createInterfaceComponent<MicSelectorMuteButtonProps>(
  {
    name: 'MicSelectorMuteButton',
    category: 'media',
    description: 'Toggle button for muting or unmuting the selected microphone.',
    version: '1.0.0',
  },
  MicSelectorMuteButtonPrimitive
)

/* ==========================================================================
   MicSelector Root Component
   ========================================================================== */

export interface MicSelectorSlots {
  /** Injected mute toggle button slot. */
  muteButton?: React.ComponentType<MicSelectorMuteButtonProps>
  /** Injected microphone icon slot. */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Custom device option item renderer */
  item?: React.ComponentType<{
    device: MediaDeviceInfo | { label: string; deviceId: string }
    isSelected: boolean
    onSelect: () => void
  }>
  /** Mic test preview slot */
  preview?: React.ComponentType<{
    active: boolean
    deviceId: string
  }>
}

export interface MicSelectorProps extends HTMLAttributes<HTMLDivElement> {
  /** Currently selected microphone device ID. */
  value?: string
  /** Callback fired when a new microphone is selected. */
  onValueChange?: (deviceId: string) => void
  /** Whether the microphone is muted. */
  muted?: boolean
  /** Callback fired when mute state changes. */
  onMutedChange?: (muted: boolean) => void
  /** Whether to show the mute toggle button. */
  showMuteToggle?: boolean
  /** Whether the control is disabled. */
  disabled?: boolean
  /** Slot overrides map. */
  slots?: SlotComponents<MicSelectorSlots>
  /** Property overrides passed down to injected slots. */
  slotProps?: SlotPropsMap<MicSelectorSlots>
}

const MicSelectorPrimitive = ({
  value,
  onValueChange,
  muted,
  onMutedChange,
  showMuteToggle = true,
  disabled,
  className,
  slots,
  slotProps,
  ...props
}: MicSelectorProps) => {
  const { devices, loading, hasPermission, loadDevices } = useAudioDevices()
  const [selectedDevice, setSelectedDevice] = useState<string>(value || '')
  const [internalMuted, setInternalMuted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const isMuted = muted !== undefined ? muted : internalMuted

  useEffect(() => {
    if (value !== undefined) {
      setSelectedDevice(value)
    }
  }, [value])

  const defaultDeviceId = devices[0]?.deviceId || ''
  useEffect(() => {
    if (!selectedDevice && defaultDeviceId) {
      setSelectedDevice(defaultDeviceId)
      onValueChange?.(defaultDeviceId)
    }
  }, [defaultDeviceId, selectedDevice, onValueChange])

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
    }
  }, [isOpen])

  const currentDevice =
    devices.find((d) => d.deviceId === selectedDevice) ||
    devices[0] || {
      label: loading ? 'Loading devices...' : 'No microphone',
      deviceId: '',
    }

  const handleSelect = (devId: string) => {
    setSelectedDevice(devId)
    onValueChange?.(devId)
    setIsOpen(false)
  }

  const handleToggleMute = () => {
    const next = !isMuted
    setInternalMuted(next)
    onMutedChange?.(next)
  }

  return (
    <div
      ref={containerRef}
      data-slot="mic-selector"
      className={cn('relative inline-flex items-center gap-space-sm', className)}
      {...props}
    >
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setIsOpen(!isOpen)
            if (!isOpen && !hasPermission) {
              loadDevices()
            }
          }}
          aria-expanded={isOpen}
          className={cn(
            'flex h-9 items-center gap-2 rounded-base border border-border/60 bg-card px-3 text-xs font-medium text-fg shadow-xs transition-colors hover:bg-muted/50 cursor-pointer',
            disabled && 'opacity-50 pointer-events-none'
          )}
        >
          {renderSlot(
            slots?.icon,
            { className: 'size-4 text-primary', ...slotProps?.icon },
            { defaultComponent: MicrophoneIcon }
          )}
          <span className="max-w-[140px] truncate">{currentDevice.label}</span>
          <ChevronUpDownIcon className="size-3.5 text-muted-fg" />
        </button>

        {isOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 min-w-[220px] rounded-macro border border-border bg-card p-1 shadow-md backdrop-blur-md">
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-fg">
              Select Microphone
            </div>
            <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto">
              {devices.map((d) => {
                const isSelected = d.deviceId === currentDevice.deviceId
                const customItem = renderSlot(slots?.item, {
                  device: d,
                  isSelected,
                  onSelect: () => handleSelect(d.deviceId),
                  ...(slotProps?.item as object),
                })
                if (customItem) return <React.Fragment key={d.deviceId}>{customItem}</React.Fragment>

                return (
                  <button
                    key={d.deviceId}
                    type="button"
                    onClick={() => handleSelect(d.deviceId)}
                    className={cn(
                      'flex items-center justify-between rounded-base px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-primary text-primary-fg font-medium'
                        : 'text-fg hover:bg-muted'
                    )}
                  >
                    <span className="truncate">{d.label}</span>
                    {isSelected && (
                      <CheckIcon className="size-3.5 shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Real-time mic test preview */}
            <div className="mt-2 border-t border-border/60 pt-2 px-1">
              <div className="mb-1 text-[10px] font-semibold text-muted-fg">Mic Test</div>
              {renderSlot(
                slots?.preview,
                { active: !isMuted, deviceId: currentDevice.deviceId, ...(slotProps?.preview as object) },
                {
                  defaultComponent: MicSelectorLivePreview,
                }
              )}
            </div>
          </div>
        )}
      </div>

      {showMuteToggle &&
        renderSlot(
          slots?.muteButton,
          { isMuted, onToggleMute: handleToggleMute, ...slotProps?.muteButton },
          { defaultComponent: MicSelectorMuteButton }
        )}
    </div>
  )
}

const MicSelectorLivePreview = ({ active, deviceId }: { active: boolean; deviceId: string }) => (
  <div className="h-6 overflow-hidden rounded-base bg-muted/40 px-1">
    <LiveWaveform
      active={active}
      deviceId={deviceId}
      barWidth={2}
      barGap={1}
      height={24}
      mode="static"
    />
  </div>
)

export const MicSelector = createInterfaceComponent<MicSelectorProps, MicSelectorSlots>(
  {
    name: 'MicSelector',
    category: 'media',
    description: 'Microphone selector dropdown with live input test waveform and mute toggle.',
    version: '1.0.0',
    slots: {
      muteButton: MicSelectorMuteButton,
      icon: MicrophoneIcon,
      item: undefined,
      preview: MicSelectorLivePreview,
    },
  },
  MicSelectorPrimitive
)

// Compound attachments
MicSelector.MuteButton = MicSelectorMuteButton
