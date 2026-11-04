import React from 'react'
import {
  DropZone as RACDropZone,
  type DropZoneProps as RACDropZoneProps,
  composeRenderProps,
} from 'react-aria-components'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'

export const dropZoneStyles = tv({
  base: [
    'group/drop-zone relative z-10 flex min-h-44 w-full flex-col items-center justify-center gap-space-md rounded-macro p-space-xl text-center select-none',
    'border-2 border-dashed border-border/50 bg-surface/40 backdrop-blur-sm text-fg transition-all duration-150',
    'hover:border-border/80 hover:bg-surface/70',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-primary',
    'data-[drop-target]:border-primary data-[drop-target]:border-solid data-[drop-target]:bg-primary/10 data-[drop-target]:ring-4 data-[drop-target]:ring-primary/20',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
  ],
})

/* ==========================================================================
   DropZone Slots & Props
   ========================================================================== */

export interface DropZoneSlots {
  /** Leading icon slot */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface DropZoneProps
  extends Omit<RACDropZoneProps, 'children'>,
    VariantProps<typeof dropZoneStyles> {
  /** Leading icon rendered inside the drop zone. */
  icon?: React.ReactNode
  /** Primary heading label text. */
  heading?: string
  /** Secondary description text explaining file types and limits. */
  description?: string
  /** Whether the drop zone is disabled. */
  isDisabled?: boolean
  /** Custom CSS classes for the container. */
  className?: string
  /** Custom children rendering inside the drop zone. */
  children?: React.ReactNode | ((values: any) => React.ReactNode)
  /** Injected slot component overrides. */
  slots?: SlotComponents<DropZoneSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<DropZoneSlots>
}

const DropZonePrimitive = ({
  className,
  icon,
  heading,
  description,
  children,
  slots = {},
  slotProps = {},
  ...props
}: DropZoneProps) => {
  return (
    <RACDropZone
      data-slot="drop-zone"
      className={composeRenderProps(className, (cls, renderProps) =>
        cn(dropZoneStyles(), cls)
      )}
      {...props}
    >
      {composeRenderProps(children, (content) => (
        <>
          {content || (
            <>
              <div className="flex size-11 items-center justify-center rounded-base bg-secondary text-muted-fg group-data-[drop-target]/drop-zone:bg-primary group-data-[drop-target]/drop-zone:text-primary-fg transition-colors">
                {renderSlot(slots.icon, slotProps.icon) || icon || <ArrowUpTrayIcon className="size-5" />}
              </div>
              <div className="flex flex-col gap-space-xs max-w-xs">
                <span className="text-sm font-semibold text-fg tracking-tight">
                  {heading || 'Drag and drop files here'}
                </span>
                <span className="text-xs text-muted-fg leading-relaxed">
                  {description || 'Drop files to upload, or click browse to select from device.'}
                </span>
              </div>
            </>
          )}
        </>
      ))}
    </RACDropZone>
  )
}

export const DropZone = createInterfaceComponent<DropZoneProps, DropZoneSlots>(
  {
    name: 'DropZone',
    category: 'form',
    description: 'Drag-and-drop file upload target zone with drop target indicators.',
    version: '1.0.0',
    props: {
      heading: 'Drag and drop files here',
      isDisabled: false,
    },
    slots: {
      icon: ArrowUpTrayIcon,
    },
  },
  DropZonePrimitive
)
