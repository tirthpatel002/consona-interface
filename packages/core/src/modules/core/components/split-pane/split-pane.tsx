import * as React from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'

/* ==========================================================================
   SplitPane Types & Context
   ========================================================================== */

export type SplitPaneOrientation = 'horizontal' | 'vertical'

export interface SplitPaneContextValue {
  /** Layout direction: horizontal or vertical. */
  orientation: SplitPaneOrientation
  /** Current split percentage position (minPercent - maxPercent). */
  splitPosition: number
  /** Imperative setter for split percentage position. */
  setSplitPosition: (pos: number) => void
  /** Whether the splitter handle is actively being dragged. */
  isDragging: boolean
  /** Starts pointer or touch dragging operation. */
  startDragging: (e: React.MouseEvent | React.TouchEvent) => void
  /** Ref to the outer container DOM element. */
  containerRef: React.RefObject<HTMLDivElement | null>
  /** Minimum clamped size percentage. */
  minPercent: number
  /** Maximum clamped size percentage. */
  maxPercent: number
  /** Snaps first panel to its minimum size. */
  collapseFirst: () => void
  /** Snaps second panel to its minimum size (first panel to max). */
  collapseSecond: () => void
  /** Resets split to default size. */
  resetSplit: () => void
  /** Whether dragging and keyboard adjustment is disabled. */
  disabled?: boolean
}

const SplitPaneContext = createContext<SplitPaneContextValue | null>(null)

const DEFAULT_SPLIT_PANE_CONTEXT: SplitPaneContextValue = {
  orientation: 'horizontal',
  splitPosition: 50,
  setSplitPosition: () => {},
  isDragging: false,
  startDragging: () => {},
  containerRef: { current: null },
  minPercent: 10,
  maxPercent: 90,
  collapseFirst: () => {},
  collapseSecond: () => {},
  resetSplit: () => {},
  disabled: false,
}

/**
 * Accesses ambient split pane state, drag coordinates, and imperative collapse actions.
 */
export function useSplitPane(): SplitPaneContextValue {
  const context = useContext(SplitPaneContext)
  return context ?? DEFAULT_SPLIT_PANE_CONTEXT
}

/* ==========================================================================
   SplitPane Slots & Props
   ========================================================================== */

export interface SplitPaneSlots {
  /** Draggable divider handle slot. */
  handle?: React.ComponentType<SplitPaneHandleProps>
  /** First/leading panel slot. */
  first?: React.ComponentType<SplitPanePanelProps>
  /** Second/trailing panel slot. */
  second?: React.ComponentType<SplitPanePanelProps>
}

export interface SplitPaneProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Layout orientation: horizontal or vertical. */
  orientation?: SplitPaneOrientation
  /** Initial starting split percentage (0–100). Default is 50. */
  defaultSize?: number
  /** Controlled split percentage. */
  size?: number
  /** Callback fired when split percentage changes. */
  onSizeChange?: (size: number) => void
  /** Minimum percentage the first panel can occupy. Default is 10. */
  minSize?: number
  /** Maximum percentage the first panel can occupy. Default is 90. */
  maxSize?: number
  /** Whether resizing interactions are disabled. */
  disabled?: boolean
  /** Slot overrides. */
  slots?: SlotComponents<SplitPaneSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<SplitPaneSlots>
  /** Children or compound panels. */
  children?: ReactNode
}

/* ==========================================================================
   SplitPane Root Primitive
   ========================================================================== */

const SplitPanePrimitive = ({
  orientation = 'horizontal',
  defaultSize = 50,
  size: controlledSize,
  onSizeChange,
  minSize = 10,
  maxSize = 90,
  disabled = false,
  slots = {},
  slotProps = {},
  className,
  children,
  ...props
}: SplitPaneProps) => {
  const [uncontrolledSize, setUncontrolledSize] = useState(defaultSize)
  const isControlled = controlledSize !== undefined
  const splitPosition = isControlled ? controlledSize : uncontrolledSize
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { ref: forwardedRef, ...cleanDomProps } = props as any

  const setSplit = useCallback(
    (newSize: number) => {
      const clamped = Math.max(minSize, Math.min(maxSize, newSize))
      if (!isControlled) {
        setUncontrolledSize(clamped)
      }
      onSizeChange?.(clamped)
    },
    [isControlled, minSize, maxSize, onSizeChange]
  )

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node
      if (typeof forwardedRef === 'function') {
        forwardedRef(node)
      } else if (forwardedRef && typeof forwardedRef === 'object' && 'current' in forwardedRef) {
        forwardedRef.current = node
      }
    },
    [forwardedRef]
  )

  const isDraggingRef = useRef(false)

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDraggingRef.current || !containerRef.current || disabled) return
      const rect = containerRef.current.getBoundingClientRect()

      if (orientation === 'horizontal') {
        const offset = clientX - rect.left
        const percent = (offset / rect.width) * 100
        setSplit(percent)
      } else {
        const offset = clientY - rect.top
        const percent = (offset / rect.height) * 100
        setSplit(percent)
      }
    },
    [orientation, setSplit, disabled]
  )

  useEffect(() => {
    if (!isDragging) return

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      handlePointerMove(e.clientX, e.clientY)
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)
      }
    }

    const onEnd = () => {
      isDraggingRef.current = false
      setIsDragging(false)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    document.body.style.userSelect = 'none'
    document.body.style.cursor = orientation === 'horizontal' ? 'col-resize' : 'row-resize'

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onEnd)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onEnd)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isDragging, orientation, handlePointerMove])

  const startDragging = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return
      e.preventDefault()
      isDraggingRef.current = true
      setIsDragging(true)
    },
    [disabled]
  )

  const collapseFirst = useCallback(() => setSplit(minSize), [minSize, setSplit])
  const collapseSecond = useCallback(() => setSplit(maxSize), [maxSize, setSplit])
  const resetSplit = useCallback(() => setSplit(defaultSize), [defaultSize, setSplit])

  return (
    <SplitPaneContext.Provider
      value={{
        orientation,
        splitPosition,
        setSplitPosition: setSplit,
        isDragging,
        startDragging,
        containerRef,
        minPercent: minSize,
        maxPercent: maxSize,
        collapseFirst,
        collapseSecond,
        resetSplit,
        disabled,
      }}
    >
      <div
        {...cleanDomProps}
        ref={setRefs}
        data-slot="split-pane"
        data-orientation={orientation}
        data-dragging={isDragging ? '' : undefined}
        className={cn(
          'relative flex size-full overflow-hidden rounded-macro border border-border bg-bg select-none',
          orientation === 'horizontal' ? 'flex-row' : 'flex-col',
          className
        )}
      >
        {children ?? (
          <>
            {renderSlot(slots.first, slotProps.first)}
            {renderSlot(slots.handle, slotProps.handle, {
              defaultComponent: SplitPaneHandle,
            })}
            {renderSlot(slots.second, slotProps.second)}
          </>
        )}
      </div>
    </SplitPaneContext.Provider>
  )
}

/* ==========================================================================
   SplitPanePanel Sub-Component
   ========================================================================== */

export interface SplitPanePanelSlots {}

export interface SplitPanePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Which panel role this occupies: 'first' (proportional) or 'second' (flex remainder). */
  panel?: 'first' | 'second'
  /** Children content. */
  children?: ReactNode
}

const SplitPanePanelPrimitive = ({
  panel = 'first',
  className,
  children,
  style,
  ...props
}: SplitPanePanelProps) => {
  const { orientation, splitPosition } = useSplitPane()

  const dynamicStyle: React.CSSProperties =
    panel === 'first'
      ? orientation === 'horizontal'
        ? { width: `${splitPosition}%`, flexShrink: 0 }
        : { height: `${splitPosition}%`, flexShrink: 0 }
      : { flex: '1 1 0%', minWidth: 0, minHeight: 0 }

  return (
    <div
      data-slot="split-pane-panel"
      data-panel={panel}
      className={cn('relative min-h-0 min-w-0 overflow-auto', className)}
      style={{ ...dynamicStyle, ...style }}
      {...props}
    >
      {children}
    </div>
  )
}

export const SplitPanePanel = createInterfaceComponent<SplitPanePanelProps, SplitPanePanelSlots>(
  {
    name: 'SplitPanePanel',
    category: 'layout',
    description: 'Individual panel container inside a SplitPane.',
    version: '1.0.0',
    props: {
      panel: 'first',
    },
    slots: {

    },
  },
  SplitPanePanelPrimitive
)

/* ==========================================================================
   SplitPaneHandle Sub-Component
   ========================================================================== */

export interface SplitPaneHandleRenderProps {
  /** Whether the handle is actively being dragged. */
  isDragging: boolean
  /** Current split percentage position. */
  splitPosition: number
  /** Current orientation. */
  orientation: SplitPaneOrientation
  /** Whether resizing is disabled. */
  disabled?: boolean
  /** Collapse first panel. */
  collapseFirst: () => void
  /** Collapse second panel. */
  collapseSecond: () => void
  /** Reset split to default. */
  resetSplit: () => void
  /** Imperative position setter. */
  setSplitPosition: (pos: number) => void
  /** Start dragging handler. */
  startDragging: (e: React.MouseEvent | React.TouchEvent) => void
}

export interface SplitPaneHandleSlots {}

export interface SplitPaneHandleProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Whether to render the visual 3-dot grip indicator. Default is true. */
  showGrip?: boolean
  /** If true, removes default handle background and hover effects for custom presentation. */
  unstyled?: boolean
  /** Custom render prop or node. */
  children?: ReactNode | ((props: SplitPaneHandleRenderProps) => ReactNode)
}

const SplitPaneHandlePrimitive = ({
  showGrip = true,
  unstyled = false,
  className,
  children,
  onKeyDown,
  onMouseDown,
  onTouchStart,
  ...props
}: SplitPaneHandleProps) => {
  const {
    orientation,
    splitPosition,
    setSplitPosition,
    startDragging,
    isDragging,
    disabled,
    minPercent,
    maxPercent,
    collapseFirst,
    collapseSecond,
    resetSplit,
  } = useSplitPane()

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (disabled || e.defaultPrevented) return

    const step = e.shiftKey ? 10 : 2
    if (orientation === 'horizontal') {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setSplitPosition(splitPosition - step)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setSplitPosition(splitPosition + step)
      }
    } else {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSplitPosition(splitPosition - step)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSplitPosition(splitPosition + step)
      }
    }

    if (e.key === 'Home') {
      e.preventDefault()
      setSplitPosition(minPercent)
    } else if (e.key === 'End') {
      e.preventDefault()
      setSplitPosition(maxPercent)
    }
  }

  const handlePointerDown = (e: React.MouseEvent<HTMLDivElement>) => {
    onMouseDown?.(e)
    if (e.defaultPrevented) return
    const target = e.target as HTMLElement
    if (target.closest('button, [role="button"], a, input, select, textarea')) {
      return
    }
    startDragging(e)
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    onTouchStart?.(e)
    if (e.defaultPrevented) return
    const target = e.target as HTMLElement
    if (target.closest('button, [role="button"], a, input, select, textarea')) {
      return
    }
    startDragging(e)
  }

  const renderContent = () => {
    if (typeof children === 'function') {
      return children({
        isDragging,
        splitPosition,
        orientation,
        disabled,
        collapseFirst,
        collapseSecond,
        resetSplit,
        setSplitPosition,
        startDragging,
      })
    }
    if (children) return children

    if (showGrip && !unstyled) {
      return (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-border/80 transition-colors group-hover/handle:bg-primary shadow-2xs',
            orientation === 'horizontal' ? 'h-7 w-1.5 flex-col gap-0.5' : 'h-1.5 w-7 flex-row gap-0.5',
            isDragging && 'bg-primary'
          )}
        >
          <span className={cn('size-0.5 rounded-full bg-fg/40 group-hover/handle:bg-primary-fg', isDragging && 'bg-primary-fg')} />
          <span className={cn('size-0.5 rounded-full bg-fg/40 group-hover/handle:bg-primary-fg', isDragging && 'bg-primary-fg')} />
          <span className={cn('size-0.5 rounded-full bg-fg/40 group-hover/handle:bg-primary-fg', isDragging && 'bg-primary-fg')} />
        </div>
      )
    }

    return null
  }

  return (
    <div
      role="separator"
      tabIndex={disabled ? -1 : 0}
      aria-valuenow={Math.round(splitPosition)}
      aria-valuemin={minPercent}
      aria-valuemax={maxPercent}
      aria-orientation={orientation}
      aria-disabled={disabled}
      data-slot="split-pane-handle"
      data-dragging={isDragging ? '' : undefined}
      onMouseDown={handlePointerDown}
      onTouchStart={handleTouchStart}
      onKeyDown={handleKeyDown}
      className={cn(
        'group/handle relative z-10 flex shrink-0 items-center justify-center transition-colors duration-150 select-none',
        orientation === 'horizontal'
          ? 'w-px cursor-col-resize before:absolute before:inset-y-0 before:-inset-x-2 before:z-10 before:cursor-col-resize'
          : 'h-px cursor-row-resize before:absolute before:inset-x-0 before:-inset-y-2 before:z-10 before:cursor-row-resize',
        !unstyled && [
          'bg-border hover:bg-primary/60 focus-visible:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isDragging && 'bg-primary ring-1 ring-primary/40',
        ],
        disabled && 'cursor-default opacity-50 pointer-events-none',
        className
      )}
      {...props}
    >
      {renderContent()}
    </div>
  )
}

export const SplitPaneHandle = createInterfaceComponent<SplitPaneHandleProps, SplitPaneHandleSlots>(
  {
    name: 'SplitPaneHandle',
    category: 'layout',
    description: 'Draggable separator handle between split pane panels.',
    version: '1.0.0',
    props: {
      showGrip: true,
      unstyled: false,
    },
    slots: {

    },
  },
  SplitPaneHandlePrimitive
)

export const SplitPaneDivider = SplitPaneHandle
export interface SplitPaneDividerProps extends SplitPaneHandleProps {}

/* ==========================================================================
   Convenience Panel Wrappers
   ========================================================================== */

export interface SplitPaneFirstProps extends Omit<SplitPanePanelProps, 'panel'> {}

const SplitPaneFirstPrimitive = (props: SplitPaneFirstProps) => {
  return <SplitPanePanel panel="first" {...props} />
}

export const SplitPaneFirst = createInterfaceComponent<SplitPaneFirstProps>(
  {
    name: 'SplitPaneFirst',
    category: 'layout',
    description: 'First panel in a SplitPane layout.',
    version: '1.0.0',
  },
  SplitPaneFirstPrimitive
)

export interface SplitPaneSecondProps extends Omit<SplitPanePanelProps, 'panel'> {}

const SplitPaneSecondPrimitive = (props: SplitPaneSecondProps) => {
  return <SplitPanePanel panel="second" {...props} />
}

export const SplitPaneSecond = createInterfaceComponent<SplitPaneSecondProps>(
  {
    name: 'SplitPaneSecond',
    category: 'layout',
    description: 'Second panel in a SplitPane layout.',
    version: '1.0.0',
  },
  SplitPaneSecondPrimitive
)

/* ==========================================================================
   Main Component Factory & Compound Attachments
   ========================================================================== */

export const SplitPane = createInterfaceComponent<SplitPaneProps, SplitPaneSlots>(
  {
    name: 'SplitPane',
    category: 'layout',
    description: 'Horizontal or vertical resizable layout container with draggable splitter handle and keyboard step controls.',
    version: '1.0.0',
    props: {
      orientation: 'horizontal',
      defaultSize: 50,
      size: undefined,
      minSize: 10,
      maxSize: 90,
      disabled: false,
    },
    slots: {
      handle: SplitPaneHandle,
      first: SplitPaneFirst,
      second: SplitPaneSecond,
    },
  },
  SplitPanePrimitive
)

// Compound family attachments
SplitPane.Panel = SplitPanePanel
SplitPane.Handle = SplitPaneHandle
SplitPane.Divider = SplitPaneDivider
SplitPane.First = SplitPaneFirst
SplitPane.Second = SplitPaneSecond

/** Alias matching TASKS.md */
export const ResizablePanels = SplitPane
export interface ResizablePanelsProps extends SplitPaneProps {}
