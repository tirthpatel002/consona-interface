/**
 * @file draggable.tsx
 * Draggable Component Family with Handle affordance and typed slots.
 */

import React, { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import type { Identifier } from '../../engine/types'
import { useDraggable, type UseDraggableReturn } from '../../hooks/use-draggable'

export interface DraggableHandleProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional custom CSS class name. */
  className?: string
  /** Children icons or text. */
  children?: ReactNode
  /** Slot component overrides. */
  slots?: SlotComponents<DraggableHandleSlots>
  /** Slot prop overrides. */
  slotProps?: SlotPropsMap<DraggableHandleSlots>
}

export interface DraggableHandleSlots {
  /** Custom drag grip icon. */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

function DefaultGripIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="9" cy="6" r="1" />
      <circle cx="15" cy="6" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="9" cy="18" r="1" />
      <circle cx="15" cy="18" r="1" />
    </svg>
  )
}

const DraggableHandlePrimitive = forwardRef<HTMLDivElement, DraggableHandleProps & { slots?: SlotComponents<DraggableHandleSlots>; slotProps?: SlotPropsMap<DraggableHandleSlots> }>(
  ({ className = '', children, slots, slotProps, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        aria-label="Drag handle"
        className={`inline-flex items-center justify-center p-space-xs rounded-atom cursor-grab active:cursor-grabbing text-fg-muted hover:text-fg hover:bg-bg-subtle transition-colors touch-none ${className}`}
        {...props}
      >
        {children ?? renderSlot(slots?.icon, slotProps?.icon, { defaultComponent: DefaultGripIcon })}
      </div>
    )
  }
)
DraggableHandlePrimitive.displayName = 'DraggableHandlePrimitive'

export const DraggableHandle = createInterfaceComponent<DraggableHandleProps, DraggableHandleSlots>(
  {
    name: 'DraggableHandle',
    category: 'utility',
    description: 'Visual grip handle affordance for draggable surfaces and items.',
    version: '1.0.0',
    props: {},
    slots: {
      icon: undefined,
    },
  },
  DraggableHandlePrimitive
)

export interface DraggableSlots {
  /** Custom drag handle trigger slot. */
  handle?: React.ComponentType<DraggableHandleProps>
}

export interface DraggableProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'id'> {
  /** Unique entity identifier. */
  id: Identifier
  /** Semantic type discriminant (e.g. 'card', 'row', 'widget'). */
  type?: string
  /** Domain data payload attached to this draggable item. */
  data?: any
  /** Identifier of the parent container if nested in a collection. */
  containerId?: Identifier
  /** Initial index position. */
  index?: number
  /** Whether drag interaction is disabled. */
  disabled?: boolean
  /** Opacity applied to the source element while actively dragging. Default: 0.4 */
  dragOpacity?: number
  /** Custom UI or render function for the floating drag overlay portal when this item is dragging. */
  renderOverlay?: ReactNode | ((activeItem: any) => ReactNode)
  /** Child content or render function receiving useDraggable hook state. */
  children?: ReactNode | ((props: UseDraggableReturn) => ReactNode)
  /** Typed slot components. */
  slots?: SlotComponents<DraggableSlots>
  /** Typed slot props map. */
  slotProps?: SlotPropsMap<DraggableSlots>
}

const DraggablePrimitive = forwardRef<HTMLDivElement, DraggableProps>(
  (
    {
      id,
      type = 'draggable',
      data,
      containerId,
      index,
      disabled = false,
      dragOpacity = 0.4,
      renderOverlay,
      className = '',
      style,
      children,
      slots,
      slotProps,
      ...props
    },
    ref
  ) => {
    const draggable = useDraggable({
      id,
      type,
      data,
      containerId,
      index,
      disabled,
      renderOverlay,
    })

    const setRef = (node: HTMLDivElement | null) => {
      draggable.ref(node)
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as any).current = node
    }

    const dynamicStyle: React.CSSProperties = {
      ...draggable.style,
      ...style,
      opacity: draggable.isDragging ? dragOpacity : undefined,
      cursor: disabled ? 'default' : 'grab',
      touchAction: 'none',
    }

    if (typeof children === 'function') {
      return (
        <div
          ref={setRef}
          className={`select-none transition-opacity ${className}`}
          style={dynamicStyle}
          {...draggable.attributes}
          {...draggable.listeners}
          {...props}
        >
          {children(draggable)}
        </div>
      )
    }

    return (
      <div
        ref={setRef}
        className={`select-none transition-opacity ${className}`}
        style={dynamicStyle}
        {...draggable.attributes}
        {...draggable.listeners}
        {...props}
      >
        {slots?.handle && renderSlot(slots.handle, slotProps?.handle, { defaultComponent: DraggableHandle })}
        {children}
      </div>
    )
  }
)
DraggablePrimitive.displayName = 'DraggablePrimitive'

export const Draggable = createInterfaceComponent<DraggableProps, DraggableSlots>(
  {
    name: 'Draggable',
    category: 'utility',
    description: 'Universal drag-enabled wrapper component with ARIA accessibility bindings and slots.',
    version: '1.0.0',
    props: {
      disabled: false,
      dragOpacity: 0.4,
    },
    slots: {
      handle: undefined,
    },
  },
  DraggablePrimitive
)



Draggable.Handle = DraggableHandle
