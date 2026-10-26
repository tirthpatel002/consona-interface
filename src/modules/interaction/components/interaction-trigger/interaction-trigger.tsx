import React from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { useInteraction } from '../../context'

export interface InteractionTriggerSlotProps {
  /** Event name emitted by the trigger. */
  event: string
  /** Whether the trigger is currently focused or pressed. */
  isActive?: boolean
}

export interface InteractionTriggerSlots {
  /** Leading icon slot. */
  icon?: React.ComponentType<InteractionTriggerSlotProps>
  /** Keyboard shortcut indicator badge slot. */
  shortcutBadge?: React.ComponentType<InteractionTriggerSlotProps>
}

export interface InteractionTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  /** Event name emitted when triggered (e.g. 'consona:action', 'tour:next', 'modal:open'). */
  event?: string
  /** Custom payload dispatched with the event. */
  payload?: any
  /** Shortcut key chord associated with this trigger (e.g. 'Meta+k'). */
  shortcut?: string
  /** Trigger mode: 'click' | 'hover' | 'focus'. Default `'click'`. */
  triggerOn?: 'click' | 'hover' | 'focus'
  /** Callback fired when triggered. */
  onTrigger?: (payload: any) => void
  /** Slot overrides map. */
  slots?: SlotComponents<InteractionTriggerSlots>
  /** Slot props map. */
  slotProps?: SlotPropsMap<InteractionTriggerSlots>
}

const InteractionTriggerPrimitive = ({
  event = 'consona:action',
  payload,
  shortcut,
  triggerOn = 'click',
  onTrigger,
  className,
  children,
  slots,
  slotProps,
  ...props
}: InteractionTriggerProps) => {
  const { dispatchCustom } = useInteraction()

  const handleFire = (e: React.SyntheticEvent) => {
    dispatchCustom(event, payload, e.currentTarget as HTMLElement)
    onTrigger?.(payload)
  }

  const slotContext: InteractionTriggerSlotProps = {
    event,
  }

  return (
    <button
      type="button"
      data-slot="interaction-trigger"
      data-event={event}
      onClick={triggerOn === 'click' ? handleFire : undefined}
      onMouseEnter={triggerOn === 'hover' ? handleFire : undefined}
      onFocus={triggerOn === 'focus' ? handleFire : undefined}
      className={cn(
        'inline-flex items-center justify-center gap-x-space-sm rounded-base px-space-md py-space-xs text-sm font-medium text-fg bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-ring select-none',
        className
      )}
      {...props}
    >
      {slots?.icon && renderSlot(slots.icon, { ...slotProps?.icon, ...slotContext })}
      <span>{children}</span>
      {shortcut && (
        <kbd className="ml-space-sm px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-atom bg-muted border border-border/80 text-muted-fg">
          {shortcut}
        </kbd>
      )}
      {slots?.shortcutBadge && renderSlot(slots.shortcutBadge, { ...slotProps?.shortcutBadge, ...slotContext })}
    </button>
  )
}

export const InteractionTrigger = createInterfaceComponent<
  InteractionTriggerProps,
  InteractionTriggerSlots
>(
  {
    name: 'InteractionTrigger',
    category: 'utility',
    description: 'Declarative interactive action trigger that dispatches orchestrated events through the interaction engine.',
    version: '1.0.0',
    props: {
      event: 'consona:action',
      triggerOn: 'click',
    },
    slots: {
      icon: undefined,
      shortcutBadge: undefined,
    },
  },
  InteractionTriggerPrimitive
)
