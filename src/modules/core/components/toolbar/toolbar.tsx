import * as React from 'react'
import { createContext, useContext, type ReactNode } from 'react'
import { composeRenderProps } from 'react-aria-components/composeRenderProps'
import { Group, type GroupProps } from 'react-aria-components/Group'
import {
  Toolbar as RACToolbar,
  type ToolbarProps as RACToolbarProps,
} from 'react-aria-components/Toolbar'
import {
  ToggleButton as RACToggleButton,
  type ToggleButtonProps as RACToggleButtonProps,
} from 'react-aria-components/ToggleButton'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Separator, type SeparatorProps } from '../separator'

/* ==========================================================================
   Toolbar Context & Types
   ========================================================================== */

export type ToolbarOverflow = 'wrap' | 'scroll'

export interface ToolbarContextValue {
  /** Toolbar orientation: horizontal or vertical. */
  orientation: 'horizontal' | 'vertical'
  /** Whether items use full circular border curvature. */
  isCircle?: boolean
  /** Overflow behavior when items exceed container: wrap or scroll. */
  overflow: ToolbarOverflow
}

const ToolbarContext = createContext<ToolbarContextValue>({
  orientation: 'horizontal',
  isCircle: false,
  overflow: 'scroll',
})

export function useToolbarContext(): ToolbarContextValue {
  return useContext(ToolbarContext)
}

const ToolbarGroupContext = createContext<{ isDisabled?: boolean; isCircle?: boolean }>({})

export function useToolbarGroupContext() {
  return useContext(ToolbarGroupContext)
}

export const ToolbarProvider = ToolbarContext.Provider

/* ==========================================================================
   Toolbar Slots & Props
   ========================================================================== */

export interface ToolbarSlots {}

export interface ToolbarProps extends Omit<RACToolbarProps, 'className'> {
  /** Whether the toolbar buttons have circular pill curvature. */
  isCircle?: boolean
  /** Overflow layout strategy: 'scroll' (horizontal/vertical scrolling) or 'wrap' (flex wrapping). Default is 'scroll'. */
  overflow?: ToolbarOverflow
  /** Custom CSS classes. */
  className?: string
  /** Slot overrides. */
  slots?: SlotComponents<ToolbarSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<ToolbarSlots>
  /** Children items, groups, or separators. */
  children?: ReactNode
}

/* ==========================================================================
   Toolbar Root Primitive
   ========================================================================== */

const ToolbarPrimitive = ({
  orientation = 'horizontal',
  isCircle = false,
  overflow = 'scroll',
  slots = {},
  slotProps = {},
  className,
  children,
  ...props
}: ToolbarProps) => {
  return (
    <ToolbarContext.Provider value={{ orientation, isCircle, overflow }}>
      <RACToolbar
        orientation={orientation}
        data-slot="toolbar"
        data-circle={isCircle ? '' : undefined}
        data-overflow={overflow}
        className={composeRenderProps(className, (userClass, { orientation: currentOrientation }) =>
          cn(
            'group flex min-w-0 gap-1.5 bg-overlay p-1.5 inset-ring inset-ring-border/80 border border-border/60 shadow-2xs',
            isCircle ? 'rounded-full' : 'rounded-base',
            currentOrientation === 'vertical' && 'w-max flex-col items-start',
            currentOrientation === 'horizontal' &&
              overflow === 'wrap' &&
              'w-full flex-row flex-wrap items-center',
            currentOrientation === 'horizontal' &&
              overflow === 'scroll' &&
              'w-full flex-nowrap items-center overflow-x-auto overflow-y-hidden overscroll-x-contain scrollbar-none',
            userClass
          )
        )}
        {...props}
      >
        {children}
      </RACToolbar>
    </ToolbarContext.Provider>
  )
}

/* ==========================================================================
   ToolbarGroup Sub-Component
   ========================================================================== */

export interface ToolbarGroupSlots {}

export interface ToolbarGroupProps extends GroupProps {
  /** Whether all items within this group are disabled. */
  isDisabled?: boolean
  /** Whether items within this group should be forced circular. */
  isCircle?: boolean
  /** Group children. */
  children?: ReactNode
}

const ToolbarGroupPrimitive = ({
  isDisabled,
  isCircle,
  className,
  children,
  ...props
}: ToolbarGroupProps) => {
  const { overflow } = useToolbarContext()
  return (
    <ToolbarGroupContext.Provider value={{ isDisabled, isCircle }}>
      <Group
        data-slot="toolbar-group"
        className={cn(
          'flex gap-1.5 group-orientation-vertical:flex-col group-orientation-vertical:items-start group-orientation-horizontal:items-center',
          overflow === 'wrap' ? 'flex-wrap' : 'w-max shrink-0 flex-nowrap',
          className
        )}
        {...props}
      >
        {children}
      </Group>
    </ToolbarGroupContext.Provider>
  )
}

export const ToolbarGroup = createInterfaceComponent<ToolbarGroupProps, ToolbarGroupSlots>(
  {
    name: 'ToolbarGroup',
    category: 'layout',
    description: 'Logical grouping container within a Toolbar.',
    version: '1.0.0',
    slots: {

    },
  },
  ToolbarGroupPrimitive
)

/* ==========================================================================
   ToolbarItem Sub-Component
   ========================================================================== */

export interface ToolbarItemSlots {}

export interface ToolbarItemProps
  extends Omit<RACToggleButtonProps, 'className'> {
  /** Whether this button is forced circular. Inherits from Toolbar context if omitted. */
  isCircle?: boolean
  /** Size token: xs, sm, md, lg, sq-xs, sq-sm, sq-md, sq-lg. Default is 'sm'. */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'sq-xs' | 'sq-sm' | 'sq-md' | 'sq-lg'
  /** Visual intent variant: outline or plain. Default is 'outline'. */
  intent?: 'outline' | 'plain'
  /** Custom CSS classes. */
  className?: string
  /** Children or render function. */
  children?: ReactNode | ((values: { isSelected: boolean }) => ReactNode)
}

const ToolbarItemPrimitive = ({
  isDisabled,
  isCircle,
  size = 'sm',
  intent = 'outline',
  className,
  children,
  ...props
}: ToolbarItemProps) => {
  const groupContext = useToolbarGroupContext()
  const toolbarContext = useToolbarContext()
  const effectiveIsDisabled = isDisabled || groupContext.isDisabled
  const effectiveIsCircle = isCircle ?? groupContext.isCircle ?? toolbarContext.isCircle

  const sizeClasses: Record<string, string> = {
    xs: 'min-h-7 px-2 text-xs gap-1.5',
    sm: 'min-h-8 px-2.5 text-xs gap-1.5',
    md: 'min-h-9 px-3 text-sm gap-2',
    lg: 'min-h-10 px-3.5 text-sm gap-2',
    'sq-xs': 'size-7 p-0',
    'sq-sm': 'size-8 p-0',
    'sq-md': 'size-9 p-0',
    'sq-lg': 'size-10 p-0',
  }

  return (
    <RACToggleButton
      data-slot="toolbar-item"
      isDisabled={effectiveIsDisabled}
      className={composeRenderProps(className, (userClass, { isSelected, isHovered, isFocusVisible, isDisabled: racDisabled }) =>
        cn(
          'relative inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer select-none',
          'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-bg',
          effectiveIsCircle ? 'rounded-full' : 'rounded-base',
          sizeClasses[size] || sizeClasses.sm,
          intent === 'outline' && [
            'border border-border/80 bg-bg text-fg hover:bg-muted/60 hover:text-fg',
            isSelected && 'bg-primary text-primary-fg border-primary shadow-2xs hover:bg-primary/90 hover:text-primary-fg',
          ],
          intent === 'plain' && [
            'border-transparent bg-transparent text-muted-fg hover:bg-muted/50 hover:text-fg',
            isSelected && 'bg-secondary text-secondary-fg shadow-2xs hover:bg-secondary/80',
          ],
          racDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          userClass
        )
      )}
      {...props}
    >
      {typeof children === 'function' ? children : children}
    </RACToggleButton>
  )
}

export const ToolbarItem = createInterfaceComponent<ToolbarItemProps, ToolbarItemSlots>(
  {
    name: 'ToolbarItem',
    category: 'form',
    description: 'Toggleable button item inside a Toolbar.',
    version: '1.0.0',
    props: {
      size: 'sm',
      intent: 'outline',
    },
    slots: {

    },
  },
  ToolbarItemPrimitive
)

export interface ToggleItemProps extends ToolbarItemProps {}

/* ==========================================================================
   ToolbarSeparator Sub-Component
   ========================================================================== */

export interface ToolbarSeparatorSlots {}

export interface ToolbarSeparatorProps extends SeparatorProps {}

const ToolbarSeparatorPrimitive = ({
  className,
  orientation: forcedOrientation,
  ...props
}: ToolbarSeparatorProps) => {
  const { orientation } = useToolbarContext()
  const reverseOrientation = orientation === 'vertical' ? 'horizontal' : 'vertical'
  const effectiveOrientation = forcedOrientation ?? reverseOrientation

  return (
    <Separator
      data-slot="toolbar-separator"
      orientation={effectiveOrientation}
      className={cn(
        effectiveOrientation === 'vertical' ? 'mx-0.5 h-5 self-center' : 'my-0.5 w-full',
        className
      )}
      {...props}
    />
  )
}

export const ToolbarSeparator = createInterfaceComponent<ToolbarSeparatorProps, ToolbarSeparatorSlots>(
  {
    name: 'ToolbarSeparator',
    category: 'layout',
    description: 'Orientation-aware divider line inside a Toolbar.',
    version: '1.0.0',
    slots: {

    },
  },
  ToolbarSeparatorPrimitive
)

/* ==========================================================================
   Main Component Factory & Compound Attachments
   ========================================================================== */

export const Toolbar = createInterfaceComponent<ToolbarProps, ToolbarSlots>(
  {
    name: 'Toolbar',
    category: 'layout',
    description: 'Accessible action toolbar orchestrating button groups, separators, and toggle buttons.',
    version: '1.0.0',
    props: {
      orientation: 'horizontal',
      isCircle: false,
      overflow: 'scroll',
    },
    slots: {

    },
  },
  ToolbarPrimitive
)

// Compound family attachments
Toolbar.Provider = ToolbarProvider
Toolbar.Group = ToolbarGroup
Toolbar.Item = ToolbarItem
Toolbar.Separator = ToolbarSeparator
