import React, { useRef, useState, useEffect } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'

/* ==========================================================================
   ScrollArea Styles & Ramps
   ========================================================================== */

export const scrollAreaStyles = tv({
  base: 'relative min-h-0 group',
  variants: {
    type: {
      auto: '',
      always: '',
      scroll: '',
      hover: '',
    },
  },
  defaultVariants: {
    type: 'hover',
  },
})

export const scrollBarStyles = tv({
  base: [
    'flex select-none touch-none transition-opacity duration-150 p-space-2xs pointer-events-auto',
    'data-[state=visible]:opacity-100',
  ],
  variants: {
    type: {
      auto: 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
      hover: 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
      always: 'opacity-100',
      scroll: 'opacity-0 data-[scrolling=true]:opacity-100',
    },
    orientation: {
      vertical: 'h-full w-2.5 border-l border-transparent hover:bg-muted/30 absolute right-0 top-0 bottom-0',
      horizontal: 'h-2.5 w-full border-t border-transparent hover:bg-muted/30 absolute bottom-0 left-0 right-0 flex-col',
    },
  },
  defaultVariants: {
    type: 'hover',
    orientation: 'vertical',
  },
})

export const scrollThumbStyles = tv({
  base: [
    'relative flex-1 rounded-full bg-border/80 hover:bg-muted-fg/60 active:bg-primary transition-colors cursor-pointer',
  ],
})

/* ==========================================================================
   ScrollArea Slots & State Definitions
   ========================================================================== */

export interface ScrollAreaSlots {
  /** Custom scrollbar container slot */
  scrollbar?: React.ComponentType<ScrollBarProps>
  /** Custom viewport scroll container slot */
  viewport?: React.ComponentType<ScrollAreaViewportProps>
}

/* ==========================================================================
   ScrollArea Root Primitive & Factory
   ========================================================================== */

export interface ScrollAreaProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof scrollAreaStyles> {
  /** Visibility behavior of scrollbars: auto, always, scroll, hover. */
  type?: 'auto' | 'always' | 'scroll' | 'hover'
  /** Orientation of scrollbars supported: vertical, horizontal, both. */
  orientation?: 'vertical' | 'horizontal' | 'both'
  /** Slot component overrides. */
  slots?: SlotComponents<ScrollAreaSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<ScrollAreaSlots>
}

const ScrollAreaPrimitive = ({
  className,
  type = 'hover',
  orientation = 'vertical',
  slots = {},
  slotProps = {},
  children,
  ...props
}: ScrollAreaProps) => {
  const [hasVerticalScroll, setHasVerticalScroll] = useState(false)
  const [hasHorizontalScroll, setHasHorizontalScroll] = useState(false)
  const viewportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    const checkScroll = () => {
      // 2px threshold avoids sub-pixel rounding jitter
      setHasVerticalScroll(el.scrollHeight - el.clientHeight > 2)
      setHasHorizontalScroll(el.scrollWidth - el.clientWidth > 2)
    }

    checkScroll()
    const observer = new ResizeObserver(checkScroll)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      data-slot="scroll-area"
      className={cn(scrollAreaStyles({ type }), className)}
      {...props}
    >
      {renderSlot(
        slots?.viewport,
        { ref: viewportRef, orientation, ...(slotProps?.viewport as object), children },
        { defaultComponent: ScrollAreaViewport }
      )}

      {(orientation === 'vertical' || orientation === 'both') && hasVerticalScroll &&
        renderSlot(
          slots?.scrollbar,
          { orientation: 'vertical', type, ...(slotProps?.scrollbar as object) },
          { defaultComponent: ScrollBar }
        )}

      {(orientation === 'horizontal' || orientation === 'both') && hasHorizontalScroll &&
        renderSlot(
          slots?.scrollbar,
          { orientation: 'horizontal', type, ...(slotProps?.scrollbar as object) },
          { defaultComponent: ScrollBar }
        )}
    </div>
  )
}

export const ScrollArea = createInterfaceComponent<ScrollAreaProps, ScrollAreaSlots>(
  {
    name: 'ScrollArea',
    category: 'layout',
    description: 'Custom styled scroll area container with non-intrusive scrollbars and optical curve styling.',
    version: '1.0.0',
    props: {
      type: 'hover',
      orientation: 'vertical',
    },
    slots: {
      scrollbar: undefined,
      viewport: undefined,
    },
  },
  ScrollAreaPrimitive
)

/* ==========================================================================
   ScrollArea Sub-Atoms
   ========================================================================== */

export interface ScrollAreaViewportProps extends React.HTMLAttributes<HTMLDivElement> {
  /** ref */
  ref?: React.Ref<HTMLDivElement>
  /** orientation */
  orientation?: 'vertical' | 'horizontal' | 'both'
}

const ScrollAreaViewportPrimitive = ({
  className,
  children,
  ref,
  orientation = 'vertical',
  ...props
}: ScrollAreaViewportProps) => {
  const overflowClass =
    orientation === 'vertical'
      ? 'overflow-y-auto overflow-x-hidden'
      : orientation === 'horizontal'
        ? 'overflow-x-auto overflow-y-hidden'
        : 'overflow-auto'

  return (
    <div
      ref={ref}
      data-slot="scroll-area-viewport"
      className={cn(
        'h-full w-full max-h-[inherit] rounded-[inherit] outline-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
        overflowClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const ScrollAreaViewport = createInterfaceComponent<ScrollAreaViewportProps>(
  {
    name: 'ScrollAreaViewport',
    category: 'layout',
    description: 'Scrollable viewport element housing the child content.',
    version: '1.0.0',
  },
  ScrollAreaViewportPrimitive
)

export interface ScrollBarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof scrollBarStyles> {
  /** orientation */
  orientation?: 'vertical' | 'horizontal'
  /** visibility type */
  type?: 'auto' | 'always' | 'scroll' | 'hover'
}

const ScrollBarPrimitive = ({
  className,
  orientation = 'vertical',
  type = 'hover',
  ...props
}: ScrollBarProps) => {
  return (
    <div
      data-slot="scroll-bar"
      className={cn(scrollBarStyles({ orientation, type }), className)}
      {...props}
    >
      <ScrollAreaThumb />
    </div>
  )
}

export const ScrollBar = createInterfaceComponent<ScrollBarProps>(
  {
    name: 'ScrollBar',
    category: 'layout',
    description: 'Track container for vertical and horizontal scrollbars.',
    version: '1.0.0',
    props: {
      orientation: 'vertical',
      type: 'hover',
    },
  },
  ScrollBarPrimitive
)

export interface ScrollAreaThumbProps extends React.HTMLAttributes<HTMLDivElement> {}

const ScrollAreaThumbPrimitive = ({ className, ...props }: ScrollAreaThumbProps) => {
  return (
    <div
      data-slot="scroll-area-thumb"
      className={cn(scrollThumbStyles(), className)}
      {...props}
    >
      <span className="sr-only">Scroll thumb</span>
    </div>
  )
}

export const ScrollAreaThumb = createInterfaceComponent<ScrollAreaThumbProps>(
  {
    name: 'ScrollAreaThumb',
    category: 'layout',
    description: 'Draggable scrollbar thumb indicator with optical curvature.',
    version: '1.0.0',
  },
  ScrollAreaThumbPrimitive
)

export interface ScrollAreaCornerProps extends React.HTMLAttributes<HTMLDivElement> {}

const ScrollAreaCornerPrimitive = ({ className, ...props }: ScrollAreaCornerProps) => {
  return (
    <div
      data-slot="scroll-area-corner"
      className={cn('bg-border/20 absolute right-0 bottom-0 size-2.5', className)}
      {...props}
    />
  )
}

export const ScrollAreaCorner = createInterfaceComponent<ScrollAreaCornerProps>(
  {
    name: 'ScrollAreaCorner',
    category: 'layout',
    description: 'Corner intersection element when both horizontal and vertical scrollbars are visible.',
    version: '1.0.0',
  },
  ScrollAreaCornerPrimitive
)

// Namespace attachments for compound family ergonomics
ScrollArea.Bar = ScrollBar
ScrollArea.Viewport = ScrollAreaViewport
ScrollArea.Thumb = ScrollAreaThumb
ScrollArea.Corner = ScrollAreaCorner

export const { Context: ScrollAreaContext, useCompoundContext: useScrollAreaContext } =
  createCompoundContext<any>('ScrollArea')
