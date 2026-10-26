import React, { createContext, useContext, forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import type {
  DropRule,
  DropRulePredicate,
  Identifier,
} from '../../engine/types'
import { useDroppable, type UseDroppableReturn } from '../../hooks/use-droppable'

export interface DroppableContextValue extends UseDroppableReturn { }
const DroppableContext = createContext<DroppableContextValue | null>(null)
export const useDroppableContext = () => useContext(DroppableContext)

export interface DroppableZoneSlots {
  /** Visual icon displayed in the dropzone target. */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Explanatory title or label text. */
  title?: React.ComponentType<HTMLAttributes<HTMLHeadingElement>>
  /** Secondary subtitle or helper text. */
  description?: React.ComponentType<HTMLAttributes<HTMLParagraphElement>>
}

export interface DroppableZoneProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Whether the active item is hovering over the zone. */
  isOver?: boolean
  /** Whether the hovering item is allowed by acceptance rules. */
  isAccepted?: boolean
  /** Whether the hovering item is rejected. */
  isRejected?: boolean
  /** Rejection reason message if rejected. */
  rejectionReason?: string
  /** Children content or render function. */
  children?: ReactNode | ((props: { isOver: boolean; isAccepted: boolean; isRejected: boolean; rejectionReason?: string }) => ReactNode)
  /** Typed slot components. */
  slots?: SlotComponents<DroppableZoneSlots>
  /** Typed slot props map. */
  slotProps?: SlotPropsMap<DroppableZoneSlots>
}

function DefaultDropIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3v12" />
      <path d="m8 11 4 4 4-4" />
      <path d="M8 21h8" />
    </svg>
  )
}

const DroppableZonePrimitive = forwardRef<HTMLDivElement, DroppableZoneProps>(
  (
    {
      isOver,
      isAccepted,
      isRejected,
      rejectionReason,
      className = '',
      children,
      slots,
      slotProps,
      ...props
    },
    ref
  ) => {
    const zoneContext = useDroppableContext()
    const activeIsOver = isOver ?? zoneContext?.isOver ?? false
    const activeIsAccepted = isAccepted ?? zoneContext?.isAccepted ?? false
    const activeIsRejected = isRejected ?? zoneContext?.isRejected ?? false
    const activeReason = rejectionReason ?? zoneContext?.rejectionReason

    let stateClasses = 'border-border-subtle bg-bg-subtle/40 text-fg-muted ring-2 ring-inset ring-transparent'

    if (activeIsOver) {
      if (activeIsRejected) {
        stateClasses = 'border-danger bg-danger-subtle/25 text-danger ring-2 ring-inset ring-danger/40 shadow-xs'
      } else if (activeIsAccepted) {
        stateClasses = 'border-primary bg-primary-subtle/25 text-primary ring-2 ring-inset ring-primary/40 shadow-xs'
      } else {
        stateClasses = 'border-primary/60 bg-primary-subtle/15 text-primary ring-2 ring-inset ring-primary/25'
      }
    }

    const renderContent = () => {
      if (typeof children === 'function') {
        return children({
          isOver: activeIsOver,
          isAccepted: activeIsAccepted,
          isRejected: activeIsRejected,
          rejectionReason: activeReason,
        })
      }
      if (children != null) {
        return children
      }
      const titleText = activeIsOver && activeIsRejected
        ? activeReason ?? 'Item not accepted'
        : activeIsOver && activeIsAccepted
          ? 'Drop item here'
          : 'Drag and drop items here'

      const defaultTitleNode = (
        <div className="text-sm font-medium text-fg">
          {titleText}
        </div>
      )
      const renderedTitle = renderSlot(slots?.title, { ...slotProps?.title, children: titleText }) ?? defaultTitleNode
      const renderedDescription = renderSlot(slots?.description, slotProps?.description)

      return (
        <>
          <div className="mb-space-xs p-space-sm rounded-full bg-bg-surface shadow-xs">
            {renderSlot(slots?.icon, slotProps?.icon, { defaultComponent: DefaultDropIcon })}
          </div>
          {renderedTitle}
          {renderedDescription}
        </>
      )
    }

    return (
      <div
        ref={ref}
        className={`flex flex-col items-center justify-center p-space-lg rounded-macro border-2 border-dashed transition-[color,background-color,border-color,box-shadow] duration-300 ease-out text-center ${stateClasses} ${className}`}
        {...props}
      >
        {renderContent()}
      </div>
    )
  }
)
DroppableZonePrimitive.displayName = 'DroppableZonePrimitive'

export const DroppableZone = createInterfaceComponent<DroppableZoneProps, DroppableZoneSlots>(
  {
    name: 'DroppableZone',
    category: 'utility',
    description: 'Visual drop zone target with animated acceptance and rejection feedback states.',
    version: '1.0.0',
    props: {
      isOver: false,
      isAccepted: false,
      isRejected: false,
    },
    slots: {
      icon: undefined,
      title: undefined,
      description: undefined,
    },
  },
  DroppableZonePrimitive
)

export interface DroppableSlots {
  /** Custom visual zone occupant slot. */
  zone?: React.ComponentType<DroppableZoneProps>
}

export interface DroppableProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'id'> {
  /** Unique droppable target identifier. */
  id: Identifier
  /** Semantic type discriminant for this target. */
  type?: string
  /** Domain payload data attached to this drop target. */
  data?: any
  /** Accepted type(s) or wildcard pattern ('*'). */
  accept?: string | string[]
  /** Deep validation predicate or rule object. */
  rule?: DropRule | DropRulePredicate
  /** Maximum items this target can accept. */
  maxCapacity?: number
  /** Parent container ID if nested. */
  containerId?: Identifier
  /** Whether the drop target is disabled. */
  disabled?: boolean
  /** Child content or render function receiving useDroppable return. */
  children?: ReactNode | ((props: UseDroppableReturn) => ReactNode)
  /** Typed slot components. */
  slots?: SlotComponents<DroppableSlots>
  /** Typed slot props map. */
  slotProps?: SlotPropsMap<DroppableSlots>
}

const DroppablePrimitive = forwardRef<HTMLDivElement, DroppableProps>(
  (
    {
      id,
      type = 'droppable',
      data,
      accept,
      rule,
      maxCapacity,
      containerId,
      disabled = false,
      className = '',
      children,
      slots,
      slotProps,
      ...props
    },
    ref
  ) => {
    const droppable = useDroppable({
      id,
      type,
      data,
      accept,
      rule,
      maxCapacity,
      containerId,
      disabled,
    })

    const setRef = (node: HTMLDivElement | null) => {
      droppable.ref(node)
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as any).current = node
    }

    return (
      <DroppableContext.Provider value={droppable}>
        <div ref={setRef} className={className} {...droppable.droppableProps} {...props}>
          {typeof children === 'function' ? (
            children(droppable)
          ) : (
            children ?? (
              slots?.zone ? (
                renderSlot(slots.zone, {
                  ...slotProps?.zone,
                  isOver: droppable.isOver,
                  isAccepted: droppable.isAccepted,
                  isRejected: droppable.isRejected,
                  rejectionReason: droppable.rejectionReason,
                } as any, { defaultComponent: DroppableZone })
              ) : (
                <DroppableZone
                  isOver={droppable.isOver}
                  isAccepted={droppable.isAccepted}
                  isRejected={droppable.isRejected}
                  rejectionReason={droppable.rejectionReason}
                />
              )
            )
          )}
        </div>
      </DroppableContext.Provider>
    )
  }
)
DroppablePrimitive.displayName = 'DroppablePrimitive'

export const Droppable = createInterfaceComponent<DroppableProps, DroppableSlots>(
  {
    name: 'Droppable',
    category: 'utility',
    description: 'Intelligent drop target container supporting type acceptance rules and capacity limits.',
    version: '1.0.0',
    props: {
      disabled: false,
    },
    slots: {
      zone: undefined,
    },
  },
  DroppablePrimitive
)


Droppable.Zone = DroppableZone
