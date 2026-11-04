import React, { useEffect, useId, useRef } from 'react'
import { cn } from '@consona/interface-core'
import { createInterfaceComponent } from '@consona/interface-core'
import { renderSlot } from '@consona/interface-core'
import type { SlotComponents, SlotPropsMap } from '@consona/interface-core'
import { useInteraction } from '../../context'
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
  const { addRule } = useInteraction()

  const rulesRef = useRef(rules)
  rulesRef.current = rules
  const onInteractionRef = useRef(onInteraction)
  onInteractionRef.current = onInteraction

  // Stable identity for rule set changes (avoids hooks-in-loop)
  const rulesKey = rules
    .map((rule, index) => `${rule.id ?? index}:${rule.events.join(',')}:${rule.enabled ?? true}`)
    .join('|')

  useEffect(() => {
    const unsubs = rulesRef.current.map((rule, index) => {
      const ruleId = rule.id || `zone-${zoneName}-${rule.events.join('-')}-${index}`
      return addRule({
        ...rule,
        id: ruleId,
        modifiers: {
          ...rule.modifiers,
          within: zoneSelector,
        },
        handler: (ctx) => {
          const current = rulesRef.current.find((item, i) => (item.id || `zone-${zoneName}-${item.events.join('-')}-${i}`) === ruleId)
          current?.handler?.(ctx)
          onInteractionRef.current?.(ctx)
        },
      })
    })

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe())
    }
  }, [addRule, rulesKey, zoneName, zoneSelector])

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
