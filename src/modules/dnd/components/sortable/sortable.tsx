import React, { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import type {
  DropRule,
  DropRulePredicate,
  Identifier,
} from '../../engine/types'
import { useSortable, type UseSortableReturn } from '../../hooks/use-sortable'
import { DraggableHandle, type DraggableHandleProps } from '../draggable/draggable'

export interface SortableSlots {
  /** Dedicated drag handle sub-component slot. */
  handle?: React.ComponentType<DraggableHandleProps>
}

export interface SortableProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'id'> {
  /** Unique item identifier. */
  id: Identifier
  /** Semantic type discriminant (e.g. 'task', 'row', 'column'). */
  type?: string
  /** Domain data payload attached to this sortable item. */
  data?: any
  /** Identifier of the enclosing container or list. */
  containerId?: Identifier
  /** Current index position. */
  index?: number
  /** Accepted type(s) when dropping onto this sortable item. */
  accept?: string | string[]
  /** Custom validation rule. */
  rule?: DropRule | DropRulePredicate
  /** Sorting orientation ('vertical' or 'horizontal'). Default: 'vertical' */
  orientation?: 'vertical' | 'horizontal'
  /** Whether drag/sort interaction is disabled. */
  disabled?: boolean
  /** Opacity applied to the source item while actively dragging. Default: 0.35 */
  dragOpacity?: number
  /** Custom UI or render function for the floating drag overlay portal when this item is dragging. */
  renderOverlay?: ReactNode | ((activeItem: any) => ReactNode)
  /** Child content or render function receiving useSortable hook state. */
  children?: ReactNode | ((props: UseSortableReturn) => ReactNode)
  /** Typed slot components. */
  slots?: SlotComponents<SortableSlots>
  /** Typed slot props map. */
  slotProps?: SlotPropsMap<SortableSlots>
}

const SortablePrimitive = forwardRef<HTMLDivElement, SortableProps>(
  (
    {
      id,
      type = 'sortable',
      data,
      containerId,
      index,
      accept,
      rule,
      orientation = 'vertical',
      disabled = false,
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
    const sortable = useSortable({
      id,
      type,
      data,
      containerId,
      index,
      accept,
      rule,
      orientation,
      disabled,
      renderOverlay,
    })

    const setRef = (node: HTMLDivElement | null) => {
      sortable.ref(node)
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as any).current = node
    }

    const dynamicStyle: React.CSSProperties = {
      ...sortable.style,
      ...style,
      opacity: sortable.style.opacity,
      touchAction: 'none',
    }

    if (typeof children === 'function') {
      return (
        <div
          ref={setRef}
          className={`relative select-none ${className}`}
          style={dynamicStyle}
          {...sortable.attributes}
          {...sortable.listeners}
          {...props}
        >
          {children(sortable)}
        </div>
      )
    }

    return (
      <div
        ref={setRef}
        className={`relative select-none ${className}`}
        style={dynamicStyle}
        {...sortable.attributes}
        {...sortable.listeners}
        {...props}
      >
        {slots?.handle && renderSlot(slots.handle, slotProps?.handle, { defaultComponent: DraggableHandle })}
        {children}
      </div>
    )
  }
)
SortablePrimitive.displayName = 'SortablePrimitive'

export const Sortable = createInterfaceComponent<SortableProps, SortableSlots>(
  {
    name: 'Sortable',
    category: 'utility',
    description: 'Interactive sortable container item with slot composition and optical styling.',
    version: '1.0.0',
    props: {
      orientation: 'vertical',
      disabled: false,
      dragOpacity: 0,
    },
    slots: {
      handle: undefined,
    },
  },
  SortablePrimitive
)


Sortable.Handle = DraggableHandle
