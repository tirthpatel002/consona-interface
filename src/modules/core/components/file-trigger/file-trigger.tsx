import React from 'react'
import {
  FileTrigger as RACFileTrigger,
  type FileTriggerProps as RACFileTriggerProps,
} from 'react-aria-components'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Button, type ButtonProps } from '../button'
import {
  ArrowUpTrayIcon,
  CameraIcon,
  DocumentIcon,
  FilmIcon,
  FolderIcon,
  PaperClipIcon,
  PhotoIcon,
  SpeakerWaveIcon,
} from '@heroicons/react/24/outline'

export type FileTriggerIconVariant =
  | 'upload'
  | 'paperclip'
  | 'camera'
  | 'folder'
  | 'document'
  | 'image'
  | 'video'
  | 'audio'
  | 'none'

export interface FileTriggerSlots {
  /** Leading icon slot */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface FileTriggerProps extends RACFileTriggerProps {
  /** Accepted file types or MIME patterns (e.g. ['image/png', '.pdf']). */
  acceptedFileTypes?: string[]
  /** Whether selecting multiple files is permitted. */
  allowsMultiple?: boolean
  /** Whether selecting whole directory folders is supported. */
  acceptDirectory?: boolean
  /** Capture device camera for mobile uploads ('user' or 'environment'). */
  defaultCamera?: 'user' | 'environment'
  /** Handler called when files are selected. */
  onSelect?: (files: FileList | null) => void
  /** Icon preset variant. Default intelligently inferred from camera/folder/mime-types. */
  iconVariant?: FileTriggerIconVariant
  /** Custom leading icon element. Overrides iconVariant. */
  icon?: React.ReactNode
  /** Button intent when default button renderer is used. */
  intent?: ButtonProps['intent']
  /** Button size scaling token. */
  size?: ButtonProps['size']
  /** Whether the trigger uses circular geometry. */
  isCircle?: boolean
  /** Whether file picking is disabled. */
  isDisabled?: boolean
  /** Whether the button is in a loading/pending state. */
  isPending?: boolean
  /** Optional DOM ref passed to the hidden file input element. */
  ref?: React.Ref<HTMLInputElement>
  /** Custom CSS classes for the button trigger. */
  className?: string
  /** Trigger children button or element. */
  children?: React.ReactNode
  /** Injected slot component overrides. */
  slots?: SlotComponents<FileTriggerSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<FileTriggerSlots>
}

function resolveIcon(
  variant: FileTriggerIconVariant | undefined,
  customIcon: React.ReactNode | undefined,
  slots: SlotComponents<FileTriggerSlots>,
  slotProps: SlotPropsMap<FileTriggerSlots>,
  props: FileTriggerProps
): React.ReactNode {
  if (customIcon) return customIcon
  const slotted = renderSlot(slots.icon, slotProps.icon)
  if (slotted) return slotted
  if (variant === 'none') return null

  const resolved =
    variant ??
    (props.defaultCamera
      ? 'camera'
      : props.acceptDirectory
        ? 'folder'
        : props.acceptedFileTypes?.some((t) => t.startsWith('image/'))
          ? 'image'
          : props.acceptedFileTypes?.some((t) => t.startsWith('video/'))
            ? 'video'
            : props.acceptedFileTypes?.some((t) => t.startsWith('audio/'))
              ? 'audio'
              : 'upload')

  switch (resolved) {
    case 'upload':
      return <ArrowUpTrayIcon className="size-4 shrink-0" />
    case 'paperclip':
      return <PaperClipIcon className="size-4 shrink-0" />
    case 'camera':
      return <CameraIcon className="size-4 shrink-0" />
    case 'folder':
      return <FolderIcon className="size-4 shrink-0" />
    case 'document':
      return <DocumentIcon className="size-4 shrink-0" />
    case 'image':
      return <PhotoIcon className="size-4 shrink-0" />
    case 'video':
      return <FilmIcon className="size-4 shrink-0" />
    case 'audio':
      return <SpeakerWaveIcon className="size-4 shrink-0" />
    default:
      return null
  }
}

const FileTriggerPrimitive = ({
  intent = 'outline',
  size = 'md',
  isCircle = false,
  iconVariant,
  icon,
  isDisabled,
  isPending,
  className,
  children,
  slots = {},
  slotProps = {},
  ref,
  ...props
}: FileTriggerProps) => {
  const isStringChild = typeof children === 'string' || typeof children === 'number'
  const isCustomElement = React.isValidElement(children)

  const resolvedIcon = !isPending ? resolveIcon(iconVariant, icon, slots, slotProps, props) : null
  const defaultText = props.allowsMultiple
    ? 'Browse Files'
    : props.acceptDirectory
      ? 'Browse Folder'
      : 'Browse File'

  return (
    <RACFileTrigger ref={ref as any} {...props}>
      {isCustomElement ? (
        children
      ) : (
        <Button
          intent={intent}
          size={size}
          isCircle={isCircle}
          isDisabled={isDisabled}
          isPending={isPending}
          className={className}
        >
          {resolvedIcon}
          {isStringChild ? <span>{children}</span> : <span>{defaultText}</span>}
        </Button>
      )}
    </RACFileTrigger>
  )
}

export const FileTrigger = createInterfaceComponent<FileTriggerProps, FileTriggerSlots>(
  {
    name: 'FileTrigger',
    category: 'form',
    description: 'Accessible button trigger opening the native OS file upload picker dialog with icon variants.',
    version: '1.0.0',
    props: {
      intent: 'outline',
      size: 'md',
      allowsMultiple: false,
      acceptDirectory: false,
    },
    slots: {
      icon: undefined,
    },
  },
  FileTriggerPrimitive
)
