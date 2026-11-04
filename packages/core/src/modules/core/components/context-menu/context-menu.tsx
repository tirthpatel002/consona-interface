import React, { Children, isValidElement } from 'react'
import {
  MenuTrigger as RACMenuTrigger,
  type MenuTriggerProps as RACMenuTriggerProps,
  Pressable,
  type PopoverProps as RACPopoverProps,
} from 'react-aria-components'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import {
  Menu,
  type MenuProps,
  MenuPopover,
  MenuItem,
  MenuSection,
  MenuHeader,
  MenuSeparator,
  MenuSubmenuTrigger,
  MenuKeyboardShortcut,
} from '../menu/menu'

/* ==========================================================================
   ContextMenu Slots & Root Component
   ========================================================================== */

export interface ContextMenuSlots {
  /** Trigger wrapper slot */
  trigger?: React.ComponentType<ContextMenuTriggerProps>
  /** Menu floating content slot */
  content?: React.ComponentType<ContextMenuContentProps>
}

export interface ContextMenuProps extends Omit<RACMenuTriggerProps, 'trigger' | 'children'> {
  /** Slot component overrides. */
  slots?: SlotComponents<ContextMenuSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<ContextMenuSlots>
  /** Trigger target and context menu content elements. */
  children?: React.ReactNode
}

const ContextMenuPrimitive = ({
  children,
  slots = {},
  slotProps = {},
  ...props
}: ContextMenuProps) => {
  return (
    <RACMenuTrigger trigger="contextMenu" data-slot="context-menu" {...props}>
      {renderSlot(slots.trigger, slotProps.trigger)}
      {Children.map(children, (child) => {
        if (!isValidElement(child) || typeof child.type !== 'string') {
          return child
        }
        return <Pressable>{child as React.ReactElement<any, string>}</Pressable>
      })}
      {renderSlot(slots.content, slotProps.content)}
    </RACMenuTrigger>
  )
}

export const ContextMenu = createInterfaceComponent<ContextMenuProps, ContextMenuSlots>(
  {
    name: 'ContextMenu',
    category: 'overlay',
    description: 'Right-click contextual action menu anchored to mouse pointer coordinates.',
    version: '1.0.0',
    props: {},
    slots: {
      trigger: undefined,
      content: undefined,
    },
  },
  ContextMenuPrimitive
)

/* ==========================================================================
   ContextMenu Sub-Atoms
   ========================================================================== */

export interface ContextMenuTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS class names. */
  className?: string
  /** Inner content serving as the right-click surface. */
  children?: React.ReactNode
}

const ContextMenuTriggerPrimitive = ({
  className,
  children,
  ...props
}: ContextMenuTriggerProps) => {
  return (
    <Pressable>
      <div
        data-slot="context-menu-trigger"
        className={cn('cursor-context-menu select-none', className)}
        {...props}
      >
        {children}
      </div>
    </Pressable>
  )
}

export const ContextMenuTrigger = createInterfaceComponent<ContextMenuTriggerProps>(
  {
    name: 'ContextMenuTrigger',
    category: 'overlay',
    description: 'Target wrapper element that activates the ContextMenu on secondary/right click.',
    version: '1.0.0',
  },
  ContextMenuTriggerPrimitive
)

export interface ContextMenuContentProps
  extends Omit<RACPopoverProps, 'children'> {
  /** Menu items, sections, and headers. */
  children?: React.ReactNode
  /** Additional CSS class names for the floating surface. */
  className?: string
  /** Props forwarded to the inner Menu container. */
  menuProps?: Partial<MenuProps<any>>
}

const ContextMenuContentPrimitive = ({
  placement = 'bottom start',
  offset = 4,
  crossOffset = 0,
  className,
  menuProps,
  children,
  ...props
}: ContextMenuContentProps) => {
  return (
    <MenuPopover
      placement={placement}
      offset={offset}
      crossOffset={crossOffset}
      data-slot="context-menu-content"
      className={className}
      {...props}
    >
      <Menu {...menuProps}>{children}</Menu>
    </MenuPopover>
  )
}

export const ContextMenuContent = createInterfaceComponent<ContextMenuContentProps>(
  {
    name: 'ContextMenuContent',
    category: 'overlay',
    description: 'Floating popover and action menu content container for ContextMenu.',
    version: '1.0.0',
    props: {
      placement: 'bottom start',
      offset: 4,
      crossOffset: 0,
    },
  },
  ContextMenuContentPrimitive
)

/* ==========================================================================
   Sub-Atom Aliases from Enhanced Menu
   ========================================================================== */

export const ContextMenuItem = MenuItem
export const ContextMenuSeparator = MenuSeparator
export const ContextMenuSection = MenuSection
export const ContextMenuHeader = MenuHeader
export const ContextMenuLabel = MenuHeader
export const ContextMenuShortcut = MenuKeyboardShortcut
export const ContextMenuSub = MenuSubmenuTrigger

/* ==========================================================================
   Compound Namespace Attachments
   ========================================================================== */

ContextMenu.Trigger = ContextMenuTrigger
ContextMenu.Content = ContextMenuContent
ContextMenu.Item = ContextMenuItem
ContextMenu.Separator = ContextMenuSeparator
ContextMenu.Section = ContextMenuSection
ContextMenu.Header = ContextMenuHeader
ContextMenu.Label = ContextMenuLabel
ContextMenu.Shortcut = ContextMenuShortcut
ContextMenu.Sub = ContextMenuSub

export const { Context: ContextMenuContext, useCompoundContext: useContextMenuContext } =
  createCompoundContext<any>('ContextMenu')
