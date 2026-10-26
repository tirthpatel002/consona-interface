'use client'

import React, { useCallback, useRef, useState, type HTMLAttributes, type ReactNode } from 'react'
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { cn } from '../../../../core/cn'
import { createCompoundContext } from '../../../../core/context'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import {
  DEFAULT_AUDIO_ACCEPT_ATTR,
  DEFAULT_MAX_AUDIO_BYTES,
  type AudioSourceConstraints,
  type AudioUploadResult,
  type AudioUploader,
} from '../../engine/types'
import { assertAudioFile } from '../../engine/security'
import { useAudioUpload } from '../../hooks/use-audio-upload'

/* ==========================================================================
   AudioSourcePicker Slots & Context
   ========================================================================== */

export interface AudioSourcePickerSlots {
  /** Upload or browse icon component. */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Custom progress indicator component. */
  progress?: React.ComponentType<{ percent: number }>
}

export interface AudioSourcePickerContextValue {
  /** Error message string if validation or upload failed. */
  error: string | null
  /** Whether drag is currently hovering over dropzone. */
  isDragOver: boolean
  /** Whether interaction is disabled. */
  disabled: boolean
  /** Primary label prompt. */
  label?: ReactNode
  /** Subtitle or format hint. */
  hint?: ReactNode
  /** Dropzone trigger callback to open native file chooser. */
  openFilePicker: () => void
  /** File input ref. */
  fileInputRef: React.RefObject<HTMLInputElement | null>
  /** File selection handler. */
  handleFile: (file: File | null | undefined) => Promise<void>
  /** Drag drop event handler. */
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void
  /** Drag over event handler. */
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  /** Drag leave event handler. */
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void
  /** Upload progress and state. */
  upload: ReturnType<typeof useAudioUpload>
  /** Accepted mime types string. */
  accept?: string | readonly string[]
  /** Compact card layout style. */
  compact?: boolean
  /** Slot overrides map. */
  slots?: SlotComponents<AudioSourcePickerSlots>
  /** Slot props overrides map. */
  slotProps?: SlotPropsMap<AudioSourcePickerSlots>
}

export const {
  Provider: AudioSourcePickerProvider,
  useCompoundContext: useAudioSourcePickerContext,
} = createCompoundContext<AudioSourcePickerContextValue>('AudioSourcePicker')

export interface AudioSourcePickerProps extends AudioSourceConstraints, HTMLAttributes<HTMLDivElement> {
  /** Callback fired when an audio file is selected. */
  onFile?: (file: File) => void
  /** Alias callback for source selection. */
  onSource?: (file: File) => void
  /** Optional custom upload function. */
  uploader?: AudioUploader | null
  /** Callback fired when an upload finishes successfully. */
  onUpload?: (result: AudioUploadResult, file: File) => void
  /** Whether to automatically initiate upload on file selection. */
  autoUpload?: boolean
  /** Whether interaction is disabled. */
  disabled?: boolean
  /** Primary label prompt. */
  label?: ReactNode
  /** Subtitle or format hint. */
  hint?: ReactNode
  /** Compact card layout style. */
  compact?: boolean
  /** Render as an icon-only circular/square button. */
  iconOnly?: boolean
  /** Children or custom compound subcomponents composition. */
  children?: ReactNode
  /** Slot overrides map. */
  slots?: SlotComponents<AudioSourcePickerSlots>
  /** Property overrides passed down to injected slots. */
  slotProps?: SlotPropsMap<AudioSourcePickerSlots>
}

/* ==========================================================================
   Compound Subcomponents
   ========================================================================== */

export interface AudioSourcePickerInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const AudioSourcePickerInputPrimitive = ({ className, ...props }: AudioSourcePickerInputProps) => {
  const { fileInputRef, accept, handleFile } = useAudioSourcePickerContext()
  return (
    <input
      ref={fileInputRef}
      type="file"
      accept={typeof accept === 'string' ? accept : DEFAULT_AUDIO_ACCEPT_ATTR}
      className={cn('sr-only hidden', className)}
      onChange={(e) => handleFile(e.target.files?.[0])}
      {...props}
    />
  )
}

export const AudioSourcePickerInput = createInterfaceComponent<AudioSourcePickerInputProps>(
  {
    name: 'AudioSourcePickerInput',
    category: 'media',
    description: 'Hidden native file input element for audio picker.',
    version: '1.0.0',
  },
  AudioSourcePickerInputPrimitive
)

export interface AudioSourcePickerIconSlots {
  /** Upload or browse icon component. */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface AudioSourcePickerIconProps extends React.SVGProps<SVGSVGElement> {
  /** Slot overrides map. */
  slots?: SlotComponents<AudioSourcePickerIconSlots>
  /** Slot props overrides map. */
  slotProps?: SlotPropsMap<AudioSourcePickerIconSlots>
}

const AudioSourcePickerIconPrimitive = ({ className, slots: directSlots, slotProps: directSlotProps, ...props }: AudioSourcePickerIconProps) => {
  const { slots: ctxSlots, slotProps: ctxSlotProps } = useAudioSourcePickerContext()
  const iconSlot = directSlots?.icon ?? ctxSlots?.icon
  const iconProps = { ...ctxSlotProps?.icon, ...directSlotProps?.icon }
  return (
    <div className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-fg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
      {renderSlot(
        iconSlot,
        {
          className: cn('size-5', className),
          ...props,
          ...iconProps,
        },
        { defaultComponent: ArrowUpTrayIcon }
      )}
    </div>
  )
}

export const AudioSourcePickerIcon = createInterfaceComponent<AudioSourcePickerIconProps, AudioSourcePickerIconSlots>(
  {
    name: 'AudioSourcePickerIcon',
    category: 'media',
    description: 'Icon wrapper for audio source upload indicator.',
    version: '1.0.0',
    slots: {
      icon: ArrowUpTrayIcon,
    },
  },
  AudioSourcePickerIconPrimitive
)

export interface AudioSourcePickerLabelProps extends HTMLAttributes<HTMLSpanElement> {}

const AudioSourcePickerLabelPrimitive = ({ className, children, ...props }: AudioSourcePickerLabelProps) => {
  const { label } = useAudioSourcePickerContext()
  return (
    <span className={cn('text-xs font-semibold text-fg', className)} {...props}>
      {children ?? label}
    </span>
  )
}

export const AudioSourcePickerLabel = createInterfaceComponent<AudioSourcePickerLabelProps>(
  {
    name: 'AudioSourcePickerLabel',
    category: 'media',
    description: 'Primary text label for audio source picker.',
    version: '1.0.0',
  },
  AudioSourcePickerLabelPrimitive
)

export interface AudioSourcePickerHintProps extends HTMLAttributes<HTMLSpanElement> {}

const AudioSourcePickerHintPrimitive = ({ className, children, ...props }: AudioSourcePickerHintProps) => {
  const { hint, error } = useAudioSourcePickerContext()
  if (error) {
    return (
      <span className={cn('text-xs font-medium text-danger', className)} {...props}>
        {error}
      </span>
    )
  }
  if (!hint && !children) return null
  return (
    <span className={cn('text-[11px] text-muted-fg', className)} {...props}>
      {children ?? hint}
    </span>
  )
}

export const AudioSourcePickerHint = createInterfaceComponent<AudioSourcePickerHintProps>(
  {
    name: 'AudioSourcePickerHint',
    category: 'media',
    description: 'Subtitle, error message, or file constraint hint.',
    version: '1.0.0',
  },
  AudioSourcePickerHintPrimitive
)

export interface AudioSourcePickerProgressSlots {
  /** Custom progress bar component. */
  progress?: React.ComponentType<{ percent: number }>
}

export interface AudioSourcePickerProgressProps extends HTMLAttributes<HTMLDivElement> {
  /** Slot overrides map. */
  slots?: SlotComponents<AudioSourcePickerProgressSlots>
  /** Slot props overrides map. */
  slotProps?: SlotPropsMap<AudioSourcePickerProgressSlots>
}

const AudioSourcePickerProgressPrimitive = ({ className, slots: directSlots, slotProps: directSlotProps, ...props }: AudioSourcePickerProgressProps) => {
  const { upload, slots: ctxSlots, slotProps: ctxSlotProps } = useAudioSourcePickerContext()
  if (!upload.isUploading) return null

  const progressSlot = directSlots?.progress ?? ctxSlots?.progress
  const progressProps = { ...ctxSlotProps?.progress, ...directSlotProps?.progress }

  if (progressSlot) {
    return (
      <div className={cn('mt-2 w-full max-w-xs', className)} {...props}>
        {renderSlot(progressSlot, { percent: upload.progress.percent, ...progressProps })}
      </div>
    )
  }

  return (
    <div className={cn('mt-2 w-full max-w-xs', className)} {...props}>
      <div className="flex items-center justify-between text-[10px] text-muted-fg font-mono mb-1">
        <span>Uploading...</span>
        <span>{upload.progress.percent}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-150"
          style={{ width: `${upload.progress.percent}%` }}
        />
      </div>
    </div>
  )
}

export const AudioSourcePickerProgress = createInterfaceComponent<AudioSourcePickerProgressProps, AudioSourcePickerProgressSlots>(
  {
    name: 'AudioSourcePickerProgress',
    category: 'media',
    description: 'Linear upload progress bar indicator.',
    version: '1.0.0',
    slots: {
      progress: undefined,
    },
  },
  AudioSourcePickerProgressPrimitive
)

export interface AudioSourcePickerDropzoneProps extends HTMLAttributes<HTMLDivElement> {}

const AudioSourcePickerDropzonePrimitive = ({
  className,
  children,
  ...props
}: AudioSourcePickerDropzoneProps) => {
  const {
    handleDrop,
    handleDragOver,
    handleDragLeave,
    openFilePicker,
    isDragOver,
    compact,
    disabled,
  } = useAudioSourcePickerContext()

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={openFilePicker}
      className={cn(
        'group relative flex cursor-pointer flex-col items-center justify-center rounded-macro border-2 border-dashed transition-all',
        isDragOver
          ? 'border-primary bg-primary/5 ring-4 ring-primary/10'
          : 'border-border/60 hover:border-primary/60 hover:bg-muted/30',
        compact ? 'p-space-md' : 'p-space-lg',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      {...props}
    >
      <AudioSourcePickerInput />
      {children ?? (
        <>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <AudioSourcePickerIcon />
            <AudioSourcePickerLabel />
            <AudioSourcePickerHint />
          </div>
          <AudioSourcePickerProgress />
        </>
      )}
    </div>
  )
}

export const AudioSourcePickerDropzone = createInterfaceComponent<AudioSourcePickerDropzoneProps>(
  {
    name: 'AudioSourcePickerDropzone',
    category: 'media',
    description: 'Dashed drag-and-drop target zone for audio files.',
    version: '1.0.0',
  },
  AudioSourcePickerDropzonePrimitive
)

/* ==========================================================================
   AudioSourcePicker Primitive
   ========================================================================== */

const AudioSourcePickerPrimitive = ({
  onFile,
  onSource,
  uploader,
  onUpload,
  autoUpload = Boolean(uploader),
  disabled = false,
  label = 'Drop audio or browse',
  hint,
  className,
  compact = false,
  iconOnly = false,
  maxBytes = DEFAULT_MAX_AUDIO_BYTES,
  accept,
  children,
  slots,
  slotProps,
  ...props
}: AudioSourcePickerProps) => {
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const upload = useAudioUpload({ uploader, maxBytes, accept })

  const handleFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file || disabled) return
      try {
        assertAudioFile(file, { maxBytes, accept })
        setError(null)
        onFile?.(file)
        onSource?.(file)
        if (autoUpload && uploader) {
          const result = await upload.upload(file)
          onUpload?.(result, file)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid audio file')
      }
    },
    [disabled, maxBytes, accept, onFile, onSource, autoUpload, uploader, upload, onUpload]
  )

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (disabled) return
    const file = e.dataTransfer.files?.[0]
    if (file) void handleFile(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const contextValue = React.useMemo<AudioSourcePickerContextValue>(
    () => ({
      error,
      isDragOver,
      disabled,
      label,
      hint,
      openFilePicker,
      fileInputRef,
      handleFile,
      handleDrop,
      handleDragOver,
      handleDragLeave,
      upload,
      accept,
      compact,
      slots,
      slotProps,
    }),
    [
      error,
      isDragOver,
      disabled,
      label,
      hint,
      handleFile,
      upload,
      accept,
      compact,
      slots,
      slotProps,
    ]
  )

  if (iconOnly) {
    return (
      <AudioSourcePickerProvider value={contextValue}>
        <div
          data-slot="audio-source-picker"
          className={cn('inline-block', className)}
          {...props}
        >
          <AudioSourcePickerInput />
          <button
            type="button"
            disabled={disabled}
            onClick={openFilePicker}
            title="Choose audio file"
            aria-label="Choose audio file"
            className="flex size-8 items-center justify-center rounded-base border border-border/60 bg-card text-muted-fg shadow-xs transition-colors hover:bg-muted hover:text-fg cursor-pointer disabled:opacity-50"
          >
            {renderSlot(
              slots?.icon,
              {
            ...slotProps?.icon, className: 'size-4', ...slotProps?.icon },
              { defaultComponent: ArrowUpTrayIcon }
            )}
          </button>
        </div>
      </AudioSourcePickerProvider>
    )
  }

  return (
    <AudioSourcePickerProvider value={contextValue}>
      <div data-slot="audio-source-picker" className={cn('w-full', className)} {...props}>
        {children != null ? children : <AudioSourcePickerDropzone />}
      </div>
    </AudioSourcePickerProvider>
  )
}

export const AudioSourcePicker = createInterfaceComponent<AudioSourcePickerProps, AudioSourcePickerSlots>(
  {
    name: 'AudioSourcePicker',
    category: 'media',
    description: 'Accessible drag-and-drop audio file importer with validation and progress feedback.',
    version: '1.0.0',
    slots: {
      icon: ArrowUpTrayIcon,
      progress: undefined,
    },
  },
  AudioSourcePickerPrimitive
)

AudioSourcePicker.Dropzone = AudioSourcePickerDropzone
AudioSourcePicker.Icon = AudioSourcePickerIcon
AudioSourcePicker.Label = AudioSourcePickerLabel
AudioSourcePicker.Hint = AudioSourcePickerHint
AudioSourcePicker.Progress = AudioSourcePickerProgress
AudioSourcePicker.Input = AudioSourcePickerInput
