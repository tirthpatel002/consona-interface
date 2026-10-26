import React, { useId } from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { useInteractionRule } from '../../hooks/use-interaction-rule'
import type { InteractionContext, InteractionRule } from '../../engine/types'

export interface InteractionZoneSlotProps {
  /** Scope name or ID of the active interaction zone. */
  scope: string
  /** Whether the zone is currently hovered. */
  isHovered?: boolean
}

export interface InteractionZoneSlots {
  /** Optional badge or status indicator displayed on the zone. */
  badge?: React.ComponentType<InteractionZoneSlotProps>
  /** Optional overlay chrome or backdrop decorator. */
  overlay?: React.ComponentType<InteractionZoneSlotProps>
}

export interface InteractionZoneProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Unique name or scope identifier for this interaction zone. */
  name?: string
  /** Scoped interaction rules active only within this boundary. */
  rules?: Array<Omit<InteractionRule, 'id'> & { id?: string }>
  /** Callback fired when any interaction rule within this zone matches. */
  onInteraction?: (context: InteractionContext) => void
  /** Slot overrides map. */
  slots?: SlotComponents<InteractionZoneSlots>
  /** Slot props map. */
  slotProps?: SlotPropsMap<InteractionZoneSlots>
}

const InteractionZonePrimitive = ({
  name,
  rules = [],
  onInteraction,
  className,
  children,
  slots,
  slotProps,
  ...props
}: InteractionZoneProps) => {
  const autoId = useId()
  const zoneName = name || `zone-${autoId}`
  const zoneSelector = `[data-interaction-zone="${zoneName}"]`

  // Register scoped rules constrained to this zone boundary
  for (const rule of rules) {
    const ruleId = rule.id || `zone-${zoneName}-${rule.events.join('-')}`
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useInteractionRule(
      {
        ...rule,
        id: ruleId,
        modifiers: {
          ...rule.modifiers,
          within: zoneSelector,
        },
        handler: (ctx) => {
          rule.handler?.(ctx)
          onInteraction?.(ctx)
        },
      },
      [zoneName, rule.events.join(',')]
    )
  }

  const slotContext: InteractionZoneSlotProps = {
    scope: zoneName,
  }

  return (
    <div
      data-slot="interaction-zone"
      data-interaction-zone={zoneName}
      className={cn('relative isolate', className)}
      {...props}
    >
      {slots?.overlay && renderSlot(slots.overlay, { ...slotProps?.overlay, ...slotContext })}
      {slots?.badge && (
        <div className="absolute top-2 right-2 z-20 pointer-events-none">
          {renderSlot(slots.badge, { ...slotProps?.badge, ...slotContext })}
        </div>
      )}
      {children}
    </div>
  )
}

export const InteractionZone = createInterfaceComponent<
  InteractionZoneProps,
  InteractionZoneSlots
>(
  {
    name: 'InteractionZone',
    category: 'layout',
    description: 'Scoped boundary container that isolates and orchestrates delegated interaction rules within a DOM sub-tree.',
    version: '1.0.0',
    props: {
      name: 'default',
    },
    slots: {
      badge: undefined,
      overlay: undefined,
    },
  },
  InteractionZonePrimitive
)
