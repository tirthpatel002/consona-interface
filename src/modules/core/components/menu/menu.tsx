import React from 'react'
import {
  Menu as RACMenu,
  type MenuProps as RACMenuProps,
  MenuItem as RACMenuItem,
  type MenuItemProps as RACMenuItemProps,
  MenuTrigger as RACMenuTrigger,
  type MenuTriggerProps as RACMenuTriggerProps,
  Section as RACSection,
  type SectionProps as RACSectionProps,
  Header as RACHeader,
  type HeaderProps as RACHeaderProps,
  Separator as RACSeparator,
  type SeparatorProps as RACSeparatorProps,
  SubmenuTrigger as RACSubmenuTrigger,
  type SubmenuTriggerProps as RACSubmenuTriggerProps,
  Popover as RACPopover,
  type PopoverProps as RACPopoverProps,
} from 'react-aria-components'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { ChevronRightIcon, CheckIcon } from '@heroicons/react/20/solid'

/* ==========================================================================
   Menu Styles & Ramps
   ========================================================================== */

export const menuPopoverStyles = tv({
  base: [
    'z-50 min-w-44 p-1.5 outline-none border border-border/40 bg-overlay/95 backdrop-blur-md text-fg rounded-macro shadow-lg',
    'consona-overlay-motion',
  ],
})

export const menuItemStyles = tv({
  base: [
    'group relative flex cursor-pointer select-none items-center gap-2.5 rounded-base px-2.5 py-1.5 text-xs sm:text-sm font-medium outline-none transition-colors',
    'data-[focused]:bg-secondary data-[focused]:text-fg',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
    '*:data-[slot=icon]:size-4 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:text-muted-fg group-data-[focused]:*:data-[slot=icon]:text-fg',
  ],
  variants: {
    intent: {
      default: 'text-fg data-[focused]:bg-secondary data-[focused]:text-fg',
      danger:
        'text-danger data-[focused]:bg-danger/10 data-[focused]:text-danger *:data-[slot=icon]:text-danger group-data-[focused]:*:data-[slot=icon]:text-danger',
      warning:
        'text-warning data-[focused]:bg-warning/10 data-[focused]:text-warning *:data-[slot=icon]:text-warning group-data-[focused]:*:data-[slot=icon]:text-warning',
      primary:
        'text-primary data-[focused]:bg-primary/10 data-[focused]:text-primary *:data-[slot=icon]:text-primary group-data-[focused]:*:data-[slot=icon]:text-primary',
    },
  },
  defaultVariants: {
    intent: 'default',
  },
})

/* ==========================================================================
   Menu Slots & State
   ========================================================================== */

export interface MenuSlots {}

/* ==========================================================================
   Menu Root Primitive & Factory
   ========================================================================== */

export interface MenuProps<T extends object = object>
  extends Omit<RACMenuProps<T>, 'children'> {
  /** Additional CSS class names */
  className?: string
  /** Slot component overrides */
  slots?: SlotComponents<MenuSlots>
  /** Slot props overrides */
  slotProps?: SlotPropsMap<MenuSlots>
  /** Menu children elements or render function */
  children?: React.ReactNode | ((values: any) => React.ReactNode)
}

const MenuPrimitive = <T extends object = object>({
  className,
  slots = {},
  slotProps = {},
  ...props
}: MenuProps<T>) => {
  return (
    <RACMenu
      data-slot="menu"
      className={cn('outline-none focus:outline-none flex flex-col gap-space-2xs', className)}
      {...props}
    />
  )
}

export const Menu = createInterfaceComponent<MenuProps<any>, MenuSlots>(
  {
    name: 'Menu',
    category: 'overlay',
    description: 'Accessible action menu with keyboard navigation, sub-menu nesting, and optical token styling.',
    version: '1.0.0',
    props: {},
    slots: {

    },
  },
  MenuPrimitive
)

/* ==========================================================================
   Menu Sub-Atoms
   ========================================================================== */

/** Trigger that opens the associated menu. Inherits React Aria MenuTrigger props. */
export interface MenuTriggerProps extends RACMenuTriggerProps {}

const MenuTriggerPrimitive = (props: MenuTriggerProps) => {
  return <RACMenuTrigger data-slot="menu-trigger" {...props} />
}

export const MenuTrigger = createInterfaceComponent<MenuTriggerProps>(
  {
    name: 'MenuTrigger',
    category: 'overlay',
    description: 'Trigger coordinating button interactions with menu open state.',
    version: '1.0.0',
  },
  MenuTriggerPrimitive
)

export interface MenuPopoverProps extends RACPopoverProps {
  /** Additional CSS class names for the floating menu surface. */
  className?: string
}

const MenuPopoverPrimitive = ({ className, offset = 6, ...props }: MenuPopoverProps) => {
  return (
    <RACPopover
      offset={offset}
      data-slot="menu-popover"
      className={(values) =>
        cn(
          menuPopoverStyles(),
          typeof className === 'function' ? (className as any)(values) : className
        )
      }
      {...props}
    />
  )
}

export const MenuPopover = createInterfaceComponent<MenuPopoverProps>(
  {
    name: 'MenuPopover',
    category: 'overlay',
    description: 'Floating popover container specifically tailored for menu dropdown items.',
    version: '1.0.0',
    props: {
      offset: 6,
    },
  },
  MenuPopoverPrimitive
)

export interface MenuItemSlots {
  /** Left icon element */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Right keyboard shortcut indicator */
  shortcut?: React.ComponentType<MenuKeyboardShortcutProps>
}

export interface MenuItemProps
  extends RACMenuItemProps,
    VariantProps<typeof menuItemStyles> {
  /** Semantic color intent: default, danger, warning, primary. */
  intent?: 'default' | 'danger' | 'warning' | 'primary'
  /** Optional icon displayed before label. */
  icon?: React.ReactNode
  /** Optional shortcut text (e.g. ⌘S). */
  shortcut?: string
  /** Slot component overrides. */
  slots?: SlotComponents<MenuItemSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<MenuItemSlots>
}

const MenuItemPrimitive = ({
  className,
  intent = 'default',
  icon,
  shortcut,
  slots = {},
  slotProps = {},
  children,
  ...props
}: MenuItemProps) => {
  return (
    <RACMenuItem
      data-slot="menu-item"
      className={(values) =>
        cn(
          menuItemStyles({ intent }),
          typeof className === 'function' ? (className as any)(values) : className
        )
      }
      {...props}
    >
      {(itemState) => (
        <>
          {icon && <span data-slot="icon">{icon}</span>}
          {renderSlot(slots.icon, slotProps?.icon)}
          <span className="flex-1 truncate">
            {typeof children === 'function' ? children(itemState) : children}
          </span>
          {itemState.isSelected && (
            <CheckIcon className="size-4 shrink-0 text-primary" />
          )}
          {shortcut && (
            <span
              data-slot="shortcut"
              className="ml-auto font-mono text-[10px] tracking-widest text-muted-fg group-data-[focused]:text-fg"
            >
              {shortcut}
            </span>
          )}
          {renderSlot(slots.shortcut, slotProps?.shortcut)}
        </>
      )}
    </RACMenuItem>
  )
}

export const MenuItem = createInterfaceComponent<MenuItemProps, MenuItemSlots>(
  {
    name: 'MenuItem',
    category: 'overlay',
    description: 'Interactive item row within menus with intent variants, icons, and keyboard shortcut slots.',
    version: '1.0.0',
    props: {
      intent: 'default',
    },
    slots: {
      icon: undefined,
      shortcut: undefined,
    },
  },
  MenuItemPrimitive
)

export interface MenuSectionProps<T extends object = object> extends Omit<RACSectionProps<T>, 'children'> {
  /** Optional section title header text. */
  title?: string
  /** Additional CSS class names. */
  className?: string
  /** Children items or render function. */
  children?: React.ReactNode | ((item: T) => React.ReactNode)
}

const MenuSectionPrimitive = <T extends object = object>({
  className,
  title,
  children,
  ...props
}: MenuSectionProps<T>) => {
  return (
    <RACSection
      data-slot="menu-section"
      className={cn('py-space-xs first:pt-0 last:pb-0', className)}
      {...(props as any)}
    >
      {title && <MenuHeader>{title}</MenuHeader>}
      {children as any}
    </RACSection>
  )
}

export const MenuSection = createInterfaceComponent<MenuSectionProps<any>>(
  {
    name: 'MenuSection',
    category: 'overlay',
    description: 'Logical grouping container organizing related menu items.',
    version: '1.0.0',
  },
  MenuSectionPrimitive
)

export interface MenuHeaderProps extends RACHeaderProps {
  /** className */
  className?: string
}

const MenuHeaderPrimitive = ({ className, ...props }: MenuHeaderProps) => {
  return (
    <RACHeader
      data-slot="menu-header"
      className={cn(
        'px-2.5 py-space-xs text-[11px] font-bold uppercase tracking-wider text-muted-fg select-none',
        className
      )}
      {...props}
    />
  )
}

export const MenuHeader = createInterfaceComponent<MenuHeaderProps>(
  {
    name: 'MenuHeader',
    category: 'overlay',
    description: 'Section header title label for menu item categories.',
    version: '1.0.0',
  },
  MenuHeaderPrimitive
)

export interface MenuSeparatorProps extends RACSeparatorProps {
  /** className */
  className?: string
}

const MenuSeparatorPrimitive = ({ className, ...props }: MenuSeparatorProps) => {
  return (
    <RACSeparator
      data-slot="menu-separator"
      className={cn('my-space-xs h-px bg-border/70 -mx-1', className)}
      {...props}
    />
  )
}

export const MenuSeparator = createInterfaceComponent<MenuSeparatorProps>(
  {
    name: 'MenuSeparator',
    category: 'overlay',
    description: 'Divider line separating menu sections.',
    version: '1.0.0',
  },
  MenuSeparatorPrimitive
)

export interface MenuSubmenuTriggerProps extends RACSubmenuTriggerProps {}

const MenuSubmenuTriggerPrimitive = (props: MenuSubmenuTriggerProps) => {
  return <RACSubmenuTrigger data-slot="menu-submenu-trigger" {...props} />
}

export const MenuSubmenuTrigger = createInterfaceComponent<MenuSubmenuTriggerProps>(
  {
    name: 'MenuSubmenuTrigger',
    category: 'overlay',
    description: 'Trigger orchestrating nested cascaded sub-menus.',
    version: '1.0.0',
  },
  MenuSubmenuTriggerPrimitive
)

export interface MenuKeyboardShortcutProps extends React.HTMLAttributes<HTMLSpanElement> {}

const MenuKeyboardShortcutPrimitive = ({
  className,
  ...props
}: MenuKeyboardShortcutProps) => {
  return (
    <span
      data-slot="menu-shortcut"
      className={cn(
        'ml-auto font-mono text-[10px] tracking-widest text-muted-fg',
        className
      )}
      {...props}
    />
  )
}

export const MenuKeyboardShortcut = createInterfaceComponent<MenuKeyboardShortcutProps>(
  {
    name: 'MenuKeyboardShortcut',
    category: 'overlay',
    description: 'Keyboard accelerator badge right-aligned within menu items.',
    version: '1.0.0',
  },
  MenuKeyboardShortcutPrimitive
)

// Aliases & Namespace compound attachments
export const Dropdown = Menu
export const DropdownTrigger = MenuTrigger
export const DropdownPopover = MenuPopover
export const DropdownItem = MenuItem
export const DropdownSection = MenuSection
export const DropdownSeparator = MenuSeparator

Menu.Trigger = MenuTrigger
Menu.Popover = MenuPopover
Menu.Item = MenuItem
Menu.Section = MenuSection
Menu.Header = MenuHeader
Menu.Separator = MenuSeparator
Menu.Submenu = MenuSubmenuTrigger
Menu.Shortcut = MenuKeyboardShortcut

Dropdown.Trigger = DropdownTrigger
Dropdown.Popover = DropdownPopover
Dropdown.Item = DropdownItem
Dropdown.Section = DropdownSection
Dropdown.Separator = DropdownSeparator

export const { Context: MenuContext, useCompoundContext: useMenuContext } =
  createCompoundContext<any>('Menu')

export const { Context: DropdownContext, useCompoundContext: useDropdownContext } =
  createCompoundContext<any>('Dropdown')
