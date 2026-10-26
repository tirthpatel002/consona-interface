/**
 * @file positionable.tsx
 * Positionable Component Family for freeform spatial dragging with boundary constraints and magnetic grid snapping.
 * Wrapped in createInterfaceComponent with Rule C1, C4, C5, C6 compliance.
 */

import React, { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import type {
  BoundaryConstraints,
  Coordinates,
  DragAxis,
} from '../../engine/types'
import { usePositionable, type UsePositionableReturn } from '../../hooks/use-positionable'
import { DraggableHandle, type DraggableHandleProps } from '../draggable/draggable'

export interface PositionableSlots {
  /** Custom drag handle trigger slot. */
  handle?: React.ComponentType<DraggableHandleProps>
}

export interface PositionableProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Initial (x, y) coordinates in pixels. Default: { x: 0, y: 0 } */
  initialPosition?: Coordinates
  /** Z-index depth layer. Default: 1000 */
  zIndex?: number
  /** Boundary clamping container, padding, and viewport constraints. */
  boundaries?: BoundaryConstraints
  /** Constrained movement axis ('both' | 'horizontal' | 'vertical' | 'x' | 'y'). Default: 'both' */
  axis?: DragAxis
  /** Magnetic snap grid interval in pixels (e.g. 16 or [16, 16]). */
  gridSize?: number | [number, number]
  /** Positioning mode strategy: 'fixed' | 'absolute'. */
  positionMode?: 'fixed' | 'absolute'
  /** Callback fired on coordinate changes. */
  onPositionChange?: (position: Coordinates) => void
  /** Callback fired when drag begins. */
  onDragStart?: () => void
  /** Callback fired when drag concludes. */
  onDragEnd?: () => void
  /** Whether repositioning is disabled. */
  disabled?: boolean
  /** CSS selector or element for the drag handle affordance. */
  dragHandle?: string | HTMLElement | null
  /** CSS selector(s) to ignore pointer events on (e.g. buttons, inputs). */
  ignoreDragSelector?: string | string[]
  /** If true, starts in document flow until first drag interaction. */
  startInFlow?: boolean
  /** Hover / drag cursor style. Default: 'move' */
  cursor?: string
  /** Child content or render function. */
  children?: ReactNode | ((props: UsePositionableReturn) => ReactNode)
  /** Typed slot components. */
  slots?: SlotComponents<PositionableSlots>
  /** Typed slot props map. */
  slotProps?: SlotPropsMap<PositionableSlots>
}

const PositionablePrimitive = forwardRef<HTMLDivElement, PositionableProps>(
  (
    {
      initialPosition = { x: 0, y: 0 },
      zIndex = 1000,
      boundaries = {},
      axis = 'both',
      gridSize,
      positionMode,
      onPositionChange,
      onDragStart,
      onDragEnd,
      disabled = false,
      dragHandle = undefined,
      ignoreDragSelector = undefined,
      startInFlow = false,
      cursor = 'move',
      className = '',
      style = {},
      children,
      slots,
      slotProps,
      ...props
    },
    ref
  ) => {
    const positionable = usePositionable({
      initialPosition,
      zIndex,
      boundaries,
      axis,
      gridSize,
      positionMode,
      onPositionChange,
      onDragStart,
      onDragEnd,
      disabled,
      dragHandle,
      ignoreDragSelector,
      startInFlow,
      cursor,
    })

    const setRef = (node: HTMLDivElement | null) => {
      ; (positionable.containerRef as any).current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as any).current = node
    }

    const mergedStyle: React.CSSProperties = {
      ...positionable.containerStyle,
      ...style,
    }

    if (typeof children === 'function') {
      return (
        <div
          ref={setRef}
          className={`select-none ${className}`}
          style={mergedStyle}
          onPointerDown={positionable.handlePointerDown}
          {...positionable.ariaProps}
          {...props}
        >
          {children(positionable)}
        </div>
      )
    }

    return (
      <div
        ref={setRef}
        className={`select-none ${className}`}
        style={mergedStyle}
        onPointerDown={positionable.handlePointerDown}
        {...positionable.ariaProps}
        {...props}
      >
        {slots?.handle && renderSlot(slots.handle, slotProps?.handle, { defaultComponent: DraggableHandle })}
        {children}
      </div>
    )
  }
)
PositionablePrimitive.displayName = 'PositionablePrimitive'

export const Positionable = createInterfaceComponent<PositionableProps, PositionableSlots>(
  {
    name: 'Positionable',
    category: 'utility',
    description: 'Freeform 2D spatial draggable container with boundary constraints and magnetic grid snapping.',
    version: '1.0.0',
    props: {
      initialPosition: { x: 0, y: 0 },
      zIndex: 1000,
      axis: 'both',
      disabled: false,
      startInFlow: false,
      cursor: 'move',
    },
    slots: {
      handle: undefined,
    },
  },
  PositionablePrimitive
)

Positionable.Handle = DraggableHandle
