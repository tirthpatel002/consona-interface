import React, { createContext, useContext, useEffect } from 'react'
import {
  Autocomplete,
  type AutocompleteProps,
  useFilter,
  Button as RACButton,
  Collection,
  Dialog as RACDialog,
  Header as RACHeader,
  type HeaderProps as RACHeaderProps,
  Input as RACInput,
  Menu as RACMenu,
  type MenuProps as RACMenuProps,
  MenuItem as RACMenuItem,
  type MenuItemProps as RACMenuItemProps,
  Modal as RACModal,
  ModalContext,
  ModalOverlay as RACModalOverlay,
  type ModalOverlayProps as RACModalOverlayProps,
  OverlayTriggerStateContext,
  SearchField as RACSearchField,
  type SearchFieldProps as RACSearchFieldProps,
  Section as RACSection,
  type SectionProps as RACSectionProps,
  Separator as RACSeparator,
  type SeparatorProps as RACSeparatorProps,
  Text as RACText,
  type TextProps as RACTextProps,
  type MenuTriggerProps,
} from 'react-aria-components'
import {
  type CollectionRenderer,
  CollectionRendererContext,
  DefaultCollectionRenderer,
} from 'react-aria-components/CollectionBuilder'
import { type VariantProps } from 'tailwind-variants'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { menuItemStyles } from '../menu/menu'
import { Loader } from '../loader/loader'

/* ==========================================================================
   CommandMenu Context & State
   ========================================================================== */

interface CommandMenuContextValue {
  isPending?: boolean
  escapeButton?: boolean
}

export const CommandMenuContext = createContext<CommandMenuContextValue | undefined>(undefined)

const DEFAULT_COMMAND_MENU_CONTEXT: CommandMenuContextValue = {
  isPending: false,
  escapeButton: true,
}

export const useCommandMenu = (): CommandMenuContextValue => {
  const context = useContext(CommandMenuContext)
  return context ?? DEFAULT_COMMAND_MENU_CONTEXT
}

export const CommandMenuProvider = CommandMenuContext.Provider
export const useCommandMenuContext = useCommandMenu

const SIZES = {
  xs: 'sm:max-w-xs',
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
  '3xl': 'sm:max-w-3xl',
}

/* ==========================================================================
   CommandMenu Slots & Root Component
   ========================================================================== */

export interface CommandMenuSlots {
  /** Search input field slot */
  search?: React.ComponentType<CommandMenuSearchProps>
  /** Footer action or hint bar slot */
  footer?: React.ComponentType<CommandMenuFooterProps>
}

export interface CommandMenuProps
  extends Omit<AutocompleteProps, 'children'>,
    Omit<MenuTriggerProps, 'children'>,
    CommandMenuContextValue {
  /** Whether pressing Escape or clicking the backdrop closes the menu. Defaults to true. */
  isDismissable?: boolean
  /** Accessible label for the dialog container. */
  'aria-label'?: string
  /** Global keyboard shortcut key (e.g. 'k' for ⌘K / Ctrl+K) that toggles open state. */
  shortcut?: string
  /** Custom CSS class names applied to the modal surface. */
  className?: string
  /** Max-width size token for the command dialog. Defaults to 'lg'. */
  size?: keyof typeof SIZES
  /** Props passed to the outer overlay backdrop. */
  overlay?: Pick<RACModalOverlayProps, 'className'>
  /** Slot component overrides. */
  slots?: SlotComponents<CommandMenuSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<CommandMenuSlots>
  /** Modal children content. */
  children?: React.ReactNode
}

const CommandMenuPrimitive = ({
  onOpenChange,
  className,
  isDismissable = true,
  escapeButton = true,
  isPending = false,
  overlay,
  size = 'lg',
  shortcut,
  slots = {},
  slotProps = {},
  children,
  ...props
}: CommandMenuProps) => {
  const { contains } = useFilter({ sensitivity: 'base' })
  const filter = (textValue: string, inputValue: string) => contains(textValue, inputValue)

  useEffect(() => {
    if (!shortcut) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === shortcut.toLowerCase() && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange?.(!props.isOpen)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [shortcut, onOpenChange, props.isOpen])

  return (
    <CommandMenuContext.Provider value={{ isPending, escapeButton }}>
      <ModalContext.Provider value={{ isOpen: props.isOpen, onOpenChange }}>
        <RACModalOverlay
          isDismissable={isDismissable}
          isOpen={props.isOpen}
          onOpenChange={onOpenChange}
          data-slot="command-menu-overlay"
          className={cn(
            'fixed inset-0 z-50 h-(--visual-viewport-height,100vh) w-screen overflow-hidden bg-black/40 backdrop-blur-xs',
            'grid grid-rows-[1fr_auto] justify-items-center text-center sm:grid-rows-[1fr_auto_3fr]',
            'entering:fade-in entering:animate-in entering:duration-200 entering:ease-out',
            'exiting:fade-out exiting:animate-out exiting:ease-in',
            overlay?.className
          )}
        >
          <RACModal
            data-slot="command-menu-modal"
            className={cn(
              'row-start-2 bg-overlay text-start text-fg shadow-2xl outline-none border border-border/60 md:row-start-1',
              'max-h-[calc(var(--visual-viewport-height,100vh)*0.8)] w-full sm:fixed sm:top-[10%] sm:left-1/2 sm:-translate-x-1/2',
              'rounded-t-macro md:rounded-macro overflow-hidden',
              SIZES[size],
              'entering:slide-in-from-bottom sm:entering:zoom-in-95 sm:entering:slide-in-from-bottom-0 entering:animate-in entering:duration-200 entering:ease-out',
              'exiting:slide-out-to-bottom sm:exiting:zoom-out-95 sm:exiting:slide-out-to-bottom-0 exiting:animate-out exiting:ease-in',
              className
            )}
          >
            <RACDialog
              aria-label={props['aria-label'] ?? 'Command Menu'}
              className="flex max-h-[inherit] flex-col overflow-hidden outline-hidden"
            >
              <Autocomplete filter={filter} {...props}>
                {renderSlot(slots.search, slotProps?.search)}
                {children}
                {renderSlot(slots.footer, slotProps?.footer)}
              </Autocomplete>
            </RACDialog>
          </RACModal>
        </RACModalOverlay>
      </ModalContext.Provider>
    </CommandMenuContext.Provider>
  )
}

export const CommandMenu = createInterfaceComponent<CommandMenuProps, CommandMenuSlots>(
  {
    name: 'CommandMenu',
    category: 'overlay',
    description: 'Spotlight modal command palette with instant search, group headers, and keyboard shortcut execution.',
    version: '1.0.0',
    props: {
      isDismissable: true,
      escapeButton: true,
      size: 'lg',
    },
    slots: {
      search: undefined,
      footer: undefined,
    },
  },
  CommandMenuPrimitive
)

/* ==========================================================================
   CommandMenu Sub-Atoms
   ========================================================================== */

export interface CommandMenuSearchProps extends RACSearchFieldProps {
  /** Placeholder text for the search input. Defaults to 'Search...'. */
  placeholder?: string
  /** Additional CSS class names. */
  className?: string
}

const CommandMenuSearchPrimitive = ({
  className,
  placeholder = 'Search...',
  ...props
}: CommandMenuSearchProps) => {
  const state = useContext(OverlayTriggerStateContext)
  const { isPending, escapeButton } = useCommandMenu()

  return (
    <RACSearchField
      aria-label={props['aria-label'] ?? 'Quick search'}
      autoFocus
      data-slot="command-menu-search"
      className={cn('flex w-full items-center px-3 py-2 border-b border-border/50 gap-space-xs', className)}
      {...props}
    >
      {isPending ? (
        <Loader size="sm" className="size-4.5 shrink-0 text-muted-fg" />
      ) : (
        <MagnifyingGlassIcon
          data-slot="command-menu-search-icon"
          className="size-5 shrink-0 text-muted-fg"
        />
      )}
      <RACInput
        placeholder={placeholder}
        className="w-full min-w-0 bg-transparent px-2 py-1 text-sm sm:text-base text-fg placeholder-muted-fg outline-hidden focus:outline-hidden [&::-ms-reveal]:hidden [&::-webkit-search-cancel-button]:hidden"
      />
      {escapeButton && (
        <RACButton
          onPress={() => state?.close()}
          className="hidden cursor-pointer rounded-atom border border-border/60 bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-fg hover:text-fg hover:bg-secondary lg:inline select-none"
        >
          ESC
        </RACButton>
      )}
    </RACSearchField>
  )
}

export const CommandMenuSearch = createInterfaceComponent<CommandMenuSearchProps>(
  {
    name: 'CommandMenuSearch',
    category: 'overlay',
    description: 'Header search input field for the CommandMenu with pending loader and Esc badge.',
    version: '1.0.0',
    props: {
      placeholder: 'Search...',
    },
  },
  CommandMenuSearchPrimitive
)

const emptyRenderer: CollectionRenderer = {
  CollectionRoot(props) {
    if (props.collection.size === 0) {
      return (
        <div className="col-span-full p-6 text-center text-muted-fg text-sm select-none">
          No results found.
        </div>
      )
    }
    return <DefaultCollectionRenderer.CollectionRoot {...props} />
  },
  CollectionBranch: DefaultCollectionRenderer.CollectionBranch,
}

export interface CommandMenuListProps<T extends object = object> extends RACMenuProps<T> {
  /** Additional CSS class names. */
  className?: string
}

const CommandMenuListPrimitive = <T extends object = object>({
  className,
  ...props
}: CommandMenuListProps<T>) => {
  return (
    <CollectionRendererContext.Provider value={emptyRenderer}>
      <RACMenu
        data-slot="command-menu-list"
        className={cn(
          'grid max-h-full flex-1 grid-cols-[auto_1fr] content-start overflow-y-auto p-2 sm:max-h-110 outline-none gap-space-2xs',
          className
        )}
        {...props}
      />
    </CollectionRendererContext.Provider>
  )
}

export const CommandMenuList = createInterfaceComponent<CommandMenuListProps<any>>(
  {
    name: 'CommandMenuList',
    category: 'overlay',
    description: 'Scrollable item list container with built-in empty results feedback.',
    version: '1.0.0',
  },
  CommandMenuListPrimitive
)

export interface CommandMenuSectionProps<T extends object = object>
  extends Omit<RACSectionProps<T>, 'children'> {
  /** Section heading label string. */
  label?: string
  /** Section heading title string. */
  title?: string
  /** Additional CSS class names. */
  className?: string
  /** Collection items. */
  items?: Iterable<T>
  /** Children items or render function. */
  children?: React.ReactNode | ((item: T) => React.ReactNode)
}

const CommandMenuSectionPrimitive = <T extends object = object>({
  className,
  label,
  title,
  items,
  children,
  ...props
}: CommandMenuSectionProps<T>) => {
  const displayTitle = label ?? title

  return (
    <RACSection
      data-slot="command-menu-section"
      className={cn('col-span-full grid grid-cols-[auto_1fr] content-start gap-y-0.5 py-space-xs', className)}
      {...(props as any)}
    >
      {displayTitle && (
        <RACHeader className="col-span-full mb-1 block truncate px-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-fg select-none">
          {displayTitle}
        </RACHeader>
      )}
      <Collection items={items}>{children}</Collection>
    </RACSection>
  )
}

export const CommandMenuSection = createInterfaceComponent<CommandMenuSectionProps<any>>(
  {
    name: 'CommandMenuSection',
    category: 'overlay',
    description: 'Categorized group section inside CommandMenuList with section header title.',
    version: '1.0.0',
  },
  CommandMenuSectionPrimitive
)

export interface CommandMenuItemProps
  extends RACMenuItemProps,
    VariantProps<typeof menuItemStyles> {
  /** Visual color intent variant. */
  intent?: 'default' | 'danger' | 'warning' | 'primary'
  /** Optional icon displayed before label. */
  icon?: React.ReactNode
  /** Optional keyboard shortcut string. */
  shortcut?: string
  /** Additional CSS class names. */
  className?: string
}

const CommandMenuItemPrimitive = ({
  className,
  intent = 'default',
  icon,
  shortcut,
  children,
  textValue,
  ...props
}: CommandMenuItemProps) => {
  const computedTextValue =
    textValue || (typeof children === 'string' ? children : undefined)

  return (
    <RACMenuItem
      data-slot="command-menu-item"
      textValue={computedTextValue}
      className={(values) =>
        cn(
          menuItemStyles({ intent }),
          'col-span-full items-center',
          typeof className === 'function' ? (className as any)(values) : className
        )
      }
      {...props}
    >
      {(itemState) => (
        <>
          {icon && <span data-slot="icon">{icon}</span>}
          <span className="flex-1 truncate">
            {typeof children === 'function' ? children(itemState) : children}
          </span>
          {shortcut && (
            <span
              data-slot="shortcut"
              className="ml-auto font-mono text-[10px] tracking-widest text-muted-fg group-data-[focused]:text-fg"
            >
              {shortcut}
            </span>
          )}
        </>
      )}
    </RACMenuItem>
  )
}

export const CommandMenuItem = createInterfaceComponent<CommandMenuItemProps>(
  {
    name: 'CommandMenuItem',
    category: 'overlay',
    description: 'Selectable command row with keyboard focus indicator, icon slot, and shortcut display.',
    version: '1.0.0',
    props: {
      intent: 'default',
    },
  },
  CommandMenuItemPrimitive
)

export interface CommandMenuDescriptionProps extends RACTextProps {
  /** Additional CSS class names. */
  className?: string
}

const CommandMenuDescriptionPrimitive = ({
  className,
  ...props
}: CommandMenuDescriptionProps) => {
  return (
    <RACText
      slot="description"
      data-slot="command-menu-description"
      className={cn('col-start-3 row-start-1 ms-auto text-xs text-muted-fg', className)}
      {...props}
    />
  )
}

export const CommandMenuDescription = createInterfaceComponent<CommandMenuDescriptionProps>(
  {
    name: 'CommandMenuDescription',
    category: 'overlay',
    description: 'Secondary contextual description text aligned alongside a CommandMenuItem.',
    version: '1.0.0',
  },
  CommandMenuDescriptionPrimitive
)

export interface CommandMenuSeparatorProps extends RACSeparatorProps {
  /** Additional CSS class names. */
  className?: string
}

const CommandMenuSeparatorPrimitive = ({
  className,
  ...props
}: CommandMenuSeparatorProps) => (
  <RACSeparator
    data-slot="command-menu-separator"
    className={cn('col-span-full -mx-2 my-space-xs h-px bg-border/60', className)}
    {...props}
  />
)

export const CommandMenuSeparator = createInterfaceComponent<CommandMenuSeparatorProps>(
  {
    name: 'CommandMenuSeparator',
    category: 'overlay',
    description: 'Horizontal divider separating command item categories.',
    version: '1.0.0',
  },
  CommandMenuSeparatorPrimitive
)

export interface CommandMenuFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS class names. */
  className?: string
}

const CommandMenuFooterPrimitive = ({
  className,
  ...props
}: CommandMenuFooterProps) => {
  return (
    <div
      data-slot="command-menu-footer"
      className={cn(
        'col-span-full flex items-center justify-between border-t border-border/50 px-3 py-2 text-xs text-muted-fg select-none',
        '*:[kbd]:font-mono *:[kbd]:text-[10px] *:[kbd]:px-1.5 *:[kbd]:py-0.5 *:[kbd]:rounded-atom *:[kbd]:border *:[kbd]:border-border *:[kbd]:bg-muted',
        className
      )}
      {...props}
    />
  )
}

export const CommandMenuFooter = createInterfaceComponent<CommandMenuFooterProps>(
  {
    name: 'CommandMenuFooter',
    category: 'overlay',
    description: 'Bottom footer banner displaying keyboard shortcut helpers and command navigation tips.',
    version: '1.0.0',
  },
  CommandMenuFooterPrimitive
)

export interface CommandMenuLabelProps extends RACHeaderProps {
  /** Additional CSS class names. */
  className?: string
}

const CommandMenuLabelPrimitive = ({ className, ...props }: CommandMenuLabelProps) => (
  <RACHeader
    data-slot="command-menu-label"
    className={cn(
      'px-2.5 py-space-xs text-[11px] font-bold uppercase tracking-wider text-muted-fg select-none',
      className
    )}
    {...props}
  />
)

export const CommandMenuLabel = createInterfaceComponent<CommandMenuLabelProps>(
  {
    name: 'CommandMenuLabel',
    category: 'overlay',
    description: 'Standalone label or title header within CommandMenu sections.',
    version: '1.0.0',
  },
  CommandMenuLabelPrimitive
)

export interface CommandMenuShortcutProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Additional CSS class names. */
  className?: string
}

const CommandMenuShortcutPrimitive = ({
  className,
  ...props
}: CommandMenuShortcutProps) => (
  <span
    data-slot="command-menu-shortcut"
    className={cn(
      'ml-auto inline-flex items-center gap-0.5 font-mono text-[10px] tracking-widest text-muted-fg',
      className
    )}
    {...props}
  />
)

export const CommandMenuShortcut = createInterfaceComponent<CommandMenuShortcutProps>(
  {
    name: 'CommandMenuShortcut',
    category: 'overlay',
    description: 'Keyboard shortcut badge right-aligned within a CommandMenuItem.',
    version: '1.0.0',
  },
  CommandMenuShortcutPrimitive
)

/* ==========================================================================
   Aliases & Compound Namespace Attachments
   ========================================================================== */

export const CommandPalette = CommandMenu
export const CommandPaletteSearch = CommandMenuSearch
export const CommandPaletteList = CommandMenuList
export const CommandPaletteSection = CommandMenuSection
export const CommandPaletteItem = CommandMenuItem
export const CommandPaletteDescription = CommandMenuDescription
export const CommandPaletteSeparator = CommandMenuSeparator
export const CommandPaletteFooter = CommandMenuFooter
export const CommandPaletteLabel = CommandMenuLabel
export const CommandPaletteShortcut = CommandMenuShortcut

CommandMenu.Provider = CommandMenuProvider
CommandMenu.Search = CommandMenuSearch
CommandMenu.List = CommandMenuList
CommandMenu.Section = CommandMenuSection
CommandMenu.Item = CommandMenuItem
CommandMenu.Description = CommandMenuDescription
CommandMenu.Separator = CommandMenuSeparator
CommandMenu.Footer = CommandMenuFooter
CommandMenu.Label = CommandMenuLabel
CommandMenu.Shortcut = CommandMenuShortcut

CommandPalette.Provider = CommandMenuProvider
CommandPalette.Search = CommandPaletteSearch
CommandPalette.List = CommandPaletteList
CommandPalette.Section = CommandPaletteSection
CommandPalette.Item = CommandPaletteItem
CommandPalette.Description = CommandPaletteDescription
CommandPalette.Separator = CommandPaletteSeparator
CommandPalette.Footer = CommandPaletteFooter
CommandPalette.Label = CommandPaletteLabel
CommandPalette.Shortcut = CommandPaletteShortcut
