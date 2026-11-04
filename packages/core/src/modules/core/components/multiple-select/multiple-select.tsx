import React, { Children, isValidElement, useMemo, useRef, useState } from 'react'
import {
  Button as RACButton,
  Popover as RACPopover,
  ListBox as RACListBox,
  ListBoxItem as RACListBoxItem,
  type ListBoxItemProps as RACListBoxItemProps,
  type Key,
} from 'react-aria-components'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { PlusIcon, XMarkIcon, ChevronUpDownIcon, CheckIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { Badge } from '../badge'
import { fieldStyles } from '../field'

/* ==========================================================================
   MultipleSelect Styles & Ramps
   ========================================================================== */

export const multipleSelectStyles = tv({
  base: 'flex flex-col gap-1.5 w-full group/multi-select',
})

export const multipleSelectTriggerStyles = tv({
  base: [
    'relative flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-base border border-input bg-bg px-space-md py-1.5 text-sm text-fg transition-colors',
    'hover:border-muted-fg/40 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20',
    'aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-disabled:bg-muted',
    'cursor-pointer outline-none select-none',
  ],
})

export const multipleSelectPopoverStyles = tv({
  base: [
    'z-50 min-w-(--trigger-width) max-h-72 overflow-hidden p-space-xs outline-none border border-border/40 bg-overlay/95 backdrop-blur-md text-fg rounded-macro shadow-lg flex flex-col gap-space-xs',
    'transition-all duration-150',
    'data-[entering]:animate-in data-[entering]:fade-in-0 data-[entering]:zoom-in-95',
    'data-[exiting]:animate-out data-[exiting]:fade-out-0 data-[exiting]:zoom-out-95',
  ],
})

/* ==========================================================================
   MultipleSelect Slots & State Definitions
   ========================================================================== */

export interface MultipleSelectTagSlotProps {
  /** Item data */
  item: OptionBase
  /** Tag display label */
  label: string
  /** Click handler to remove selected item */
  onRemove: (e: React.MouseEvent) => void
}

export interface MultipleSelectItemSlotProps {
  /** Option item data */
  item: OptionBase
  /** Whether the item is selected */
  isSelected: boolean
  /** Selection toggle handler */
  onToggle: () => void
}

export interface MultipleSelectSlots {
  /** Search icon slot inside the popover */
  searchIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Custom tag/pill renderer for selected items */
  tag?: React.ComponentType<MultipleSelectTagSlotProps>
  /** Custom item renderer for dropdown list items */
  item?: React.ComponentType<MultipleSelectItemSlotProps>
}

export interface OptionBase {
  /** id */
  id: string | number
  name: string
  [key: string]: any
}

/* ==========================================================================
   MultipleSelect Root Primitive & Factory
   ========================================================================== */

export interface MultipleSelectProps<T extends OptionBase = OptionBase>
  extends VariantProps<typeof multipleSelectStyles> {
  /** List of selectable items. */
  items?: T[]
  /** Placeholder text shown when no items are selected. */
  placeholder?: string
  /** Placeholder text in the filter search input. */
  searchPlaceholder?: string
  /** Controlled search query string in the filter input. */
  searchValue?: string
  /** Callback fired when search query changes. */
  onSearchChange?: (value: string) => void
  /** Controlled set of selected keys. */
  selectedKeys?: Iterable<Key>
  /** Default uncontrolled initial set of selected keys. */
  defaultSelectedKeys?: Iterable<Key>
  /** Callback fired when the selection changes. */
  onSelectionChange?: (keys: Set<Key>) => void
  /** Whether user interaction is disabled. */
  isDisabled?: boolean
  /** Custom CSS classes for the multi-select container. */
  className?: string
  /** Child elements or custom item renderer. */
  children?: React.ReactNode | ((item: T) => React.ReactNode)
  /** Injected slot component overrides. */
  slots?: SlotComponents<MultipleSelectSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<MultipleSelectSlots>
}

const MultipleSelectPrimitive = <T extends OptionBase = OptionBase>({
  items = [],
  placeholder = 'Select items...',
  searchPlaceholder = 'Search options...',
  searchValue: controlledSearch,
  onSearchChange,
  selectedKeys: controlledSelectedKeys,
  defaultSelectedKeys = [],
  onSelectionChange,
  isDisabled = false,
  className,
  children,
  slots = {},
  slotProps = {},
}: MultipleSelectProps<T>) => {
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<Set<Key>>(
    new Set(defaultSelectedKeys)
  )
  const [internalSearch, setInternalSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)

  const selectedKeys = useMemo(
    () => (controlledSelectedKeys ? new Set(controlledSelectedKeys) : internalSelectedKeys),
    [controlledSelectedKeys, internalSelectedKeys]
  )

  const searchQuery = controlledSearch !== undefined ? controlledSearch : internalSearch

  const handleSelectionChange = (newKeys: Set<Key>) => {
    if (!controlledSelectedKeys) {
      setInternalSelectedKeys(newKeys)
    }
    onSelectionChange?.(newKeys)
  }

  const handleToggleKey = (key: Key) => {
    const next = new Set(selectedKeys)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
    }
    handleSelectionChange(next)
  }

  const handleRemoveKey = (key: Key, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Set(selectedKeys)
    next.delete(key)
    handleSelectionChange(next)
  }

  // Extract items from props or child elements
  const allItems: T[] = useMemo(() => {
    if (items.length > 0) return items
    const extracted: T[] = []
    if (typeof children !== 'function') {
      Children.forEach(children, (child) => {
        if (isValidElement(child) && (child.props as any).id) {
          extracted.push({
            id: (child.props as any).id,
            name: (child.props as any).textValue || (child.props as any).children || String((child.props as any).id),
          } as T)
        }
      })
    }
    return extracted
  }, [items, children])

  const filteredItems = useMemo(() => {
    if (!searchQuery) return allItems
    const q = searchQuery.toLowerCase()
    return allItems.filter((it) => it.name.toLowerCase().includes(q))
  }, [allItems, searchQuery])

  const selectedItems = useMemo(() => {
    return allItems.filter((it) => selectedKeys.has(it.id))
  }, [allItems, selectedKeys])

  return (
    <div
      data-slot="multiple-select"
      className={cn(multipleSelectStyles(), fieldStyles(), className)}
    >
      <div
        ref={triggerRef}
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-disabled={isDisabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => !isDisabled && setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (isDisabled) return
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault()
            setIsOpen(true)
          }
        }}
        className={multipleSelectTriggerStyles()}
      >
        {selectedItems.length === 0 ? (
          <span className="text-muted-fg select-none py-space-2xs">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
            {selectedItems.map((item) => {
              const tagElement = renderSlot(slots?.tag, {
                item,
                label: item.name,
                onRemove: (e: React.MouseEvent) => handleRemoveKey(item.id, e),
                ...(slotProps?.tag as object),
              })
              if (tagElement) return <React.Fragment key={item.id}>{tagElement}</React.Fragment>

              return (
                <Badge
                  key={item.id}
                  intent="secondary"
                  size="sm"
                  className="gap-space-xs ps-2 pe-1 py-space-2xs"
                >
                  <span>{item.name}</span>
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={`Remove ${item.name}`}
                    onClick={(e) => handleRemoveKey(item.id, e)}
                    className="rounded-atom hover:bg-muted/80 p-space-2xs text-muted-fg hover:text-fg transition-colors"
                  >
                    <XMarkIcon className="size-3" />
                  </button>
                </Badge>
              )
            })}
          </div>
        )}

        <div className="ml-auto flex items-center gap-space-xs text-muted-fg">
          <ChevronUpDownIcon className="size-4 shrink-0 pointer-events-none" />
        </div>
      </div>

      <RACPopover
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        triggerRef={triggerRef}
        offset={4}
        className={multipleSelectPopoverStyles()}
      >
        <div className="relative flex items-center px-space-sm py-1.5 border-b border-border/40">
          {renderSlot(
            slots?.searchIcon,
            { className: 'size-4 text-muted-fg shrink-0 mr-space-sm', ...(slotProps?.searchIcon as object) },
            { defaultComponent: MagnifyingGlassIcon }
          )}
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value
              if (controlledSearch === undefined) {
                setInternalSearch(val)
              }
              onSearchChange?.(val)
            }}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-sm text-fg placeholder:text-muted-fg outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                if (controlledSearch === undefined) setInternalSearch('')
                onSearchChange?.('')
              }}
              className="p-space-2xs text-muted-fg hover:text-fg"
            >
              <XMarkIcon className="size-3.5" />
            </button>
          )}
        </div>

        <div className="max-h-56 overflow-y-auto p-space-2xs flex flex-col gap-space-2xs">
          {filteredItems.length === 0 ? (
            <div className="px-space-md py-space-lg text-center text-xs text-muted-fg">
              No matching options found
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = selectedKeys.has(item.id)
              const customItem = renderSlot(slots?.item, {
                item,
                isSelected,
                onToggle: () => handleToggleKey(item.id),
                ...(slotProps?.item as object),
              })
              if (customItem) return <React.Fragment key={item.id}>{customItem}</React.Fragment>

              return (
                <div
                  key={item.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleToggleKey(item.id)}
                  className={cn(
                    'group/item relative flex items-center gap-space-sm px-2.5 py-1.5 rounded-micro select-none cursor-pointer outline-none text-sm transition-colors',
                    'hover:bg-accent hover:text-accent-fg',
                    isSelected && 'bg-accent/60 text-accent-fg font-medium'
                  )}
                >
                  <div
                    className={cn(
                      'size-4 rounded-atom border flex items-center justify-center transition-colors',
                      isSelected
                        ? 'border-primary bg-primary text-primary-fg'
                        : 'border-input bg-bg'
                    )}
                  >
                    {isSelected && <CheckIcon className="size-3 stroke-3" />}
                  </div>
                  <span className="flex-1 truncate">{item.name}</span>
                </div>
              )
            })
          )}
        </div>
      </RACPopover>
    </div>
  )
}

export const MultipleSelect = createInterfaceComponent<MultipleSelectProps<any>, MultipleSelectSlots>(
  {
    name: 'MultipleSelect',
    category: 'form',
    description: 'Multiselect input rendering removable pill chips, tag wrapping, search filter, and dropdown list.',
    version: '1.0.0',
    props: {
      isDisabled: false,
    },
    slots: {
      searchIcon: MagnifyingGlassIcon,
      tag: undefined,
      item: undefined,
    },
  },
  MultipleSelectPrimitive
)

/* ==========================================================================
   MultipleSelect Subcomponents
   ========================================================================== */

export interface MultipleSelectTriggerSlots {}

export interface MultipleSelectTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Custom CSS class names */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<MultipleSelectTriggerSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<MultipleSelectTriggerSlots>
}

const MultipleSelectTriggerPrimitive = ({
  className,
  slots,
  slotProps,
  ...props
}: MultipleSelectTriggerProps) => (
  <div data-slot="multiple-select-trigger" className={cn(multipleSelectTriggerStyles(), className)} {...props} />
)

export const MultipleSelectTrigger = createInterfaceComponent<MultipleSelectTriggerProps, MultipleSelectTriggerSlots>(
  {
    name: 'MultipleSelectTrigger',
    category: 'form',
    description: 'Clickable interactive trigger container rendering selected badge tags.',
    version: '1.0.0',
    slots: {

    },
  },
  MultipleSelectTriggerPrimitive
)

export interface MultipleSelectTagSlots {}

export interface MultipleSelectTagProps {
  /** Label of the selected tag chip */
  label: string
  /** Handler fired when the removal button is clicked */
  onRemove?: () => void
  /** Custom CSS classes */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<MultipleSelectTagSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<MultipleSelectTagSlots>
}

const MultipleSelectTagPrimitive = ({
  label,
  onRemove,
  className,
  slots,
  slotProps,
}: MultipleSelectTagProps) => (
  <Badge intent="secondary" size="sm" className={cn('gap-space-xs ps-2 pe-1 py-space-2xs', className)}>
    <span>{label}</span>
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        className="rounded-atom hover:bg-muted/80 p-space-2xs text-muted-fg hover:text-fg transition-colors"
      >
        <XMarkIcon className="size-3" />
      </button>
    )}
  </Badge>
)

export const MultipleSelectTag = createInterfaceComponent<MultipleSelectTagProps, MultipleSelectTagSlots>(
  {
    name: 'MultipleSelectTag',
    category: 'form',
    description: 'Removable pill tag chip inside MultipleSelect.',
    version: '1.0.0',
    slots: {

    },
  },
  MultipleSelectTagPrimitive
)

export interface MultipleSelectContentSlots {}

export interface MultipleSelectContentProps<T extends OptionBase = OptionBase> {
  /** Iterable list of option items */
  items?: T[]
  /** Dynamic child item renderer */
  children?: (item: T) => React.ReactNode
  /** Injected slot component overrides. */
  slots?: SlotComponents<MultipleSelectContentSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<MultipleSelectContentSlots>
}

const MultipleSelectContentPrimitive = <T extends OptionBase = OptionBase>(_props: MultipleSelectContentProps<T>) => {
  return null
}

export const MultipleSelectContent = createInterfaceComponent<MultipleSelectContentProps<any>, MultipleSelectContentSlots>(
  {
    name: 'MultipleSelectContent',
    category: 'form',
    description: 'Declarative option list container for MultipleSelect.',
    version: '1.0.0',
    slots: {

    },
  },
  MultipleSelectContentPrimitive
)

export interface MultipleSelectItemSlots {}

export interface MultipleSelectItemProps {
  /** Unique key or identifier */
  id: string | number
  /** Text value of the item */
  textValue?: string
  /** Child node */
  children?: React.ReactNode
  /** Injected slot component overrides. */
  slots?: SlotComponents<MultipleSelectItemSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<MultipleSelectItemSlots>
}

const MultipleSelectItemPrimitive = (_props: MultipleSelectItemProps) => {
  return null
}

export const MultipleSelectItem = createInterfaceComponent<MultipleSelectItemProps, MultipleSelectItemSlots>(
  {
    name: 'MultipleSelectItem',
    category: 'form',
    description: 'Declarative option item for MultipleSelect.',
    version: '1.0.0',
    slots: {

    },
  },
  MultipleSelectItemPrimitive
)

// Namespace attachments for compound family ergonomics
export const TagPicker = MultipleSelect
MultipleSelect.Trigger = MultipleSelectTrigger
MultipleSelect.Tag = MultipleSelectTag
MultipleSelect.Content = MultipleSelectContent
MultipleSelect.Item = MultipleSelectItem

export const { Context: MultipleSelectContext, useCompoundContext: useMultipleSelectContext } =
  createCompoundContext<any>('MultipleSelect')
