import * as React from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'

/* ==========================================================================
   ComparePane Context & CSS Variable Engine
   ========================================================================== */

export type ComparePaneOrientation = 'horizontal' | 'vertical'

export interface ComparePaneContextValue {
  /** Reference to the outer container DOM node. */
  containerRef: React.RefObject<HTMLDivElement | null>
  /** Split orientation: horizontal (side-by-side) or vertical (stacked). */
  orientation: ComparePaneOrientation
  /** Starts pointer or touch dragging operation. */
  startDrag: (e: React.MouseEvent | React.TouchEvent) => void
  /** Imperative position setter (2-98%). */
  setPosition: (pos: number) => void
  /** Current divider position percentage. */
  position: number
}

const ComparePaneContext = createContext<ComparePaneContextValue | null>(null)

const DEFAULT_COMPARE_PANE_CONTEXT: ComparePaneContextValue = {
  containerRef: { current: null },
  orientation: 'horizontal',
  startDrag: () => {},
  setPosition: () => {},
  position: 50,
}

/**
 * Accesses ambient compare pane state, drag coordinates, and current divider position.
 */
export function useComparePane(): ComparePaneContextValue {
  const ctx = useContext(ComparePaneContext)
  return ctx ?? DEFAULT_COMPARE_PANE_CONTEXT
}

const CP_VAR = '--cp'

/** Write position to container's CSS custom property — zero React re-renders. */
function applyPosition(el: HTMLElement, pos: number) {
  const clamped = Math.max(2, Math.min(98, pos))
  el.style.setProperty(CP_VAR, `${clamped}%`)
  const handle = el.querySelector<HTMLElement>('[data-slot="compare-handle"]')
  if (handle) handle.setAttribute('aria-valuenow', String(Math.round(clamped)))
}

/* ==========================================================================
   ComparePane Slots & Props
   ========================================================================== */

export interface ComparePaneSlots {
  /** Draggable comparison handle slot. */
  handle?: React.ComponentType<ComparePaneHandleProps>
  /** First/before layer slot. */
  first?: React.ComponentType<ComparePaneFirstProps>
  /** Second/after layer slot. */
  second?: React.ComponentType<ComparePaneSecondProps>
}

export interface ComparePaneProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Starting divider position (0–100). Default is 50. */
  defaultPosition?: number
  /** Controlled position override percentage. */
  position?: number
  /** Callback fired when divider position changes. */
  onPositionChange?: (pos: number) => void
  /** Comparison direction: horizontal or vertical. Default is horizontal. */
  orientation?: ComparePaneOrientation
  /** Slot overrides. */
  slots?: SlotComponents<ComparePaneSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<ComparePaneSlots>
  /** Children layers or compound panels. */
  children?: ReactNode
}

/* ==========================================================================
   ComparePane Root Primitive
   ========================================================================== */

const ComparePanePrimitive = ({
  defaultPosition = 50,
  position: controlledPosition,
  onPositionChange,
  orientation = 'horizontal',
  slots = {},
  slotProps = {},
  className,
  children,
  style,
  ...props
}: ComparePaneProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const isDragging = useRef(false)
  const isControlled = controlledPosition !== undefined
  const { ref: forwardedRef, ...cleanDomProps } = props as any

  const posRef = useRef(isControlled ? (controlledPosition ?? defaultPosition) : defaultPosition)

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

  const setPosition = useCallback(
    (raw: number) => {
      const clamped = Math.max(2, Math.min(98, raw))
      posRef.current = clamped
      if (containerRef.current) applyPosition(containerRef.current, clamped)
      onPositionChange?.(clamped)
    },
    [onPositionChange]
  )

  useEffect(() => {
    if (isControlled && containerRef.current) {
      applyPosition(containerRef.current, controlledPosition!)
      posRef.current = controlledPosition!
    }
  }, [isControlled, controlledPosition])

  useEffect(() => {
    if (containerRef.current) {
      applyPosition(containerRef.current, posRef.current)
    }
  }, [orientation])

  const getPercent = useCallback(
    (clientX: number, clientY: number): number => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return 50
      if (orientation === 'horizontal') {
        if (rect.width <= 0) return posRef.current
        return ((clientX - rect.left) / rect.width) * 100
      } else {
        if (rect.height <= 0) return posRef.current
        return ((clientY - rect.top) / rect.height) * 100
      }
    },
    [orientation]
  )

  const startDrag = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      isDragging.current = true
      const clientX = 'touches' in e ? e.touches[0]!.clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0]!.clientY : e.clientY
      setPosition(getPercent(clientX, clientY))

      document.body.style.userSelect = 'none'
      document.body.style.cursor = orientation === 'horizontal' ? 'col-resize' : 'row-resize'
    },
    [getPercent, orientation, setPosition]
  )

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return
      e.preventDefault()
      const clientX = 'touches' in e ? e.touches[0]!.clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0]!.clientY : e.clientY
      setPosition(getPercent(clientX, clientY))
    }

    const onUp = () => {
      if (!isDragging.current) return
      isDragging.current = false
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    window.addEventListener('mousemove', onMove, { passive: false })
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [getPercent, setPosition])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2
    if (orientation === 'horizontal') {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setPosition(posRef.current - step)
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setPosition(posRef.current + step)
      }
    } else {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setPosition(posRef.current - step)
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setPosition(posRef.current + step)
      }
    }
  }

  let hasExplicitHandle = false
  React.Children.forEach(children, (child) => {
    if (
      React.isValidElement(child) &&
      (child.type === ComparePaneHandle ||
        child.type === ComparePaneDivider ||
        (child.props as { 'data-slot'?: string })?.['data-slot'] === 'compare-handle')
    ) {
      hasExplicitHandle = true
    }
  })

  return (
    <ComparePaneContext.Provider
      value={{
        containerRef,
        orientation,
        startDrag,
        setPosition,
        position: posRef.current,
      }}
    >
      <div
        {...cleanDomProps}
        ref={setRefs}
        data-slot="compare-pane"
        data-orientation={orientation}
        onKeyDown={handleKeyDown}
        className={cn(
          'group/compare relative w-full h-full min-h-45 overflow-hidden rounded-macro border border-border select-none',
          className
        )}
        style={{ [CP_VAR]: `${posRef.current}%`, ...style } as React.CSSProperties}
      >
        {children ?? (
          <>
            {renderSlot(slots.first, slotProps.first)}
            {renderSlot(slots.second, slotProps.second)}
          </>
        )}

        {!hasExplicitHandle && (
          renderSlot(slots.handle, slotProps.handle, {
            defaultComponent: ComparePaneHandle,
          })
        )}
      </div>
    </ComparePaneContext.Provider>
  )
}

/* ==========================================================================
   ComparePaneHandle Sub-Component
   ========================================================================== */

export interface ComparePaneHandleSlots {}

export interface ComparePaneHandleProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether to render the circular grip handle. Default is true. */
  showGrip?: boolean
  /** If true, removes default divider styling so you can fully customize the divider and grip. */
  unstyled?: boolean
  /** Custom children to render inside the handle. */
  children?: ReactNode
}

const ComparePaneHandlePrimitive = ({
  showGrip = true,
  unstyled = false,
  className,
  children,
  ...props
}: ComparePaneHandleProps) => {
  const { orientation, startDrag, position } = useComparePane()

  return (
    <div
      data-slot="compare-handle"
      role="slider"
      aria-label="Comparison slider"
      aria-valuenow={Math.round(position)}
      aria-valuemin={2}
      aria-valuemax={98}
      aria-orientation={orientation}
      tabIndex={0}
      onMouseDown={startDrag}
      onTouchStart={startDrag}
      className={cn(
        'absolute z-20 flex items-center justify-center',
        orientation === 'horizontal'
          ? 'inset-y-0 w-px cursor-col-resize -translate-x-1/2 before:absolute before:inset-y-0 before:-inset-x-2 before:z-10 before:cursor-col-resize'
          : 'inset-x-0 w-full h-px cursor-row-resize -translate-y-1/2 before:absolute before:inset-x-0 before:-inset-y-2 before:z-10 before:cursor-row-resize',
        !unstyled && [
          'bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.25)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2',
        ],
        className
      )}
      style={
        orientation === 'horizontal'
          ? { left: `var(${CP_VAR})`, top: 0, bottom: 0 }
          : { top: `var(${CP_VAR})`, left: 0, right: 0 }
      }
      {...props}
    >
      {children ? (
        children
      ) : showGrip && !unstyled ? (
        <div
          className={cn(
            'flex shrink-0 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/10',
            orientation === 'horizontal' ? 'size-9 flex-col gap-0.75' : 'size-9 flex-row gap-0.75'
          )}
        >
          {orientation === 'horizontal' ? (
            <>
              <span className="block h-3.5 w-[1.5px] rounded-full bg-neutral-400" />
              <span className="block h-3.5 w-[1.5px] rounded-full bg-neutral-400" />
            </>
          ) : (
            <>
              <span className="block w-3.5 h-[1.5px] rounded-full bg-neutral-400" />
              <span className="block w-3.5 h-[1.5px] rounded-full bg-neutral-400" />
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}

export const ComparePaneHandle = createInterfaceComponent<ComparePaneHandleProps, ComparePaneHandleSlots>(
  {
    name: 'ComparePaneHandle',
    category: 'layout',
    description: 'Draggable separator handle for ComparePane with slider semantics and circular grip.',
    version: '1.0.0',
    props: {
      showGrip: true,
      unstyled: false,
    },
    slots: {

    },
  },
  ComparePaneHandlePrimitive
)

export const ComparePaneDivider = ComparePaneHandle
export interface ComparePaneDividerProps extends ComparePaneHandleProps {}

/* ==========================================================================
   ComparePaneFirst Sub-Component ("before" / "left" / "top")
   ========================================================================== */

export interface ComparePaneFirstSlots {}

export interface ComparePaneFirstProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Content for the first/before comparison layer. */
  children?: ReactNode
}

const ComparePaneFirstPrimitive = ({
  className,
  style,
  children,
  ...props
}: ComparePaneFirstProps) => {
  const { orientation } = useComparePane()

  const clipStyle: React.CSSProperties =
    orientation === 'horizontal'
      ? {
          clipPath: `inset(0 calc(100% - var(${CP_VAR})) 0 0)`,
          WebkitClipPath: `inset(0 calc(100% - var(${CP_VAR})) 0 0)`,
        }
      : {
          clipPath: `inset(0 0 calc(100% - var(${CP_VAR})) 0)`,
          WebkitClipPath: `inset(0 0 calc(100% - var(${CP_VAR})) 0)`,
        }

  return (
    <div
      data-slot="compare-pane-first"
      className={cn('absolute inset-0 size-full z-10 overflow-hidden', className)}
      style={{ ...clipStyle, ...style }}
      {...props}
    >
      {children}
    </div>
  )
}

export const ComparePaneFirst = createInterfaceComponent<ComparePaneFirstProps, ComparePaneFirstSlots>(
  {
    name: 'ComparePaneFirst',
    category: 'layout',
    description: 'First (before/left/top) clipped layer in a ComparePane.',
    version: '1.0.0',
    slots: {

    },
  },
  ComparePaneFirstPrimitive
)

/* ==========================================================================
   ComparePaneSecond Sub-Component ("after" / "right" / "bottom")
   ========================================================================== */

export interface ComparePaneSecondSlots {}

export interface ComparePaneSecondProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Content for the second/after comparison layer. */
  children?: ReactNode
}

const ComparePaneSecondPrimitive = ({
  className,
  style,
  children,
  ...props
}: ComparePaneSecondProps) => {
  const { orientation } = useComparePane()

  const clipStyle: React.CSSProperties =
    orientation === 'horizontal'
      ? {
          clipPath: `inset(0 0 0 var(${CP_VAR}))`,
          WebkitClipPath: `inset(0 0 0 var(${CP_VAR}))`,
        }
      : {
          clipPath: `inset(var(${CP_VAR}) 0 0 0)`,
          WebkitClipPath: `inset(var(${CP_VAR}) 0 0 0)`,
        }

  return (
    <div
      data-slot="compare-pane-second"
      className={cn('absolute inset-0 size-full overflow-hidden', className)}
      style={{ ...clipStyle, ...style }}
      {...props}
    >
      {children}
    </div>
  )
}

export const ComparePaneSecond = createInterfaceComponent<ComparePaneSecondProps, ComparePaneSecondSlots>(
  {
    name: 'ComparePaneSecond',
    category: 'layout',
    description: 'Second (after/right/bottom) base layer in a ComparePane.',
    version: '1.0.0',
    slots: {

    },
  },
  ComparePaneSecondPrimitive
)

/* ==========================================================================
   ComparePaneLabel Sub-Component (overlay badge on either side)
   ========================================================================== */

export interface ComparePaneLabelSlots {}

export interface ComparePaneLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Which comparison side this badge designates. */
  side: 'first' | 'second'
  /** Label copy or node. */
  children?: ReactNode
}

const ComparePaneLabelPrimitive = ({
  side,
  className,
  children,
  ...props
}: ComparePaneLabelProps) => {
  const { orientation } = useComparePane()

  const positionClass =
    orientation === 'horizontal'
      ? side === 'first'
        ? 'left-3 top-3'
        : 'right-3 top-3'
      : side === 'first'
      ? 'left-3 top-3'
      : 'left-3 bottom-3'

  return (
    <div
      data-slot="compare-label"
      data-side={side}
      className={cn(
        'pointer-events-none absolute z-30 rounded-micro bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm',
        positionClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const ComparePaneLabel = createInterfaceComponent<ComparePaneLabelProps, ComparePaneLabelSlots>(
  {
    name: 'ComparePaneLabel',
    category: 'layout',
    description: 'Floating status label badge over ComparePane halves.',
    version: '1.0.0',
    props: {
      side: 'first',
    },
    slots: {

    },
  },
  ComparePaneLabelPrimitive
)

/* ==========================================================================
   Main Component Factory & Compound Attachments
   ========================================================================== */

export const ComparePane = createInterfaceComponent<ComparePaneProps, ComparePaneSlots>(
  {
    name: 'ComparePane',
    category: 'layout',
    description: 'Interactive before-and-after comparison slider driving zero-rerender CSS clip-path transformations.',
    version: '1.0.0',
    props: {
      defaultPosition: 50,
      orientation: 'horizontal',
    },
    slots: {
      handle: ComparePaneHandle,
      first: ComparePaneFirst,
      second: ComparePaneSecond,
    },
  },
  ComparePanePrimitive
)

// Compound family attachments
ComparePane.Handle = ComparePaneHandle
ComparePane.Divider = ComparePaneDivider
ComparePane.First = ComparePaneFirst
ComparePane.Second = ComparePaneSecond
ComparePane.Label = ComparePaneLabel
