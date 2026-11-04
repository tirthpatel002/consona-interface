import React from 'react'
import {
  SearchField as RACSearchField,
  type SearchFieldProps as RACSearchFieldProps,
  Button as RACButton,
  type ButtonProps as RACButtonProps,
  Input as RACInput,
  type InputProps as RACInputProps,
} from 'react-aria-components'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { fieldStyles } from '../field'
import { Loader, type LoaderProps } from '../loader'
import type { KbdProps } from '../kbd'

/* ==========================================================================
   SearchField Styles & Ramps
   ========================================================================== */

export const searchFieldStyles = tv({
  base: 'flex flex-col gap-1.5 w-full group/search-field',
})

/* ==========================================================================
   SearchField Slots & State Definitions
   ========================================================================== */

export interface SearchFieldSlots {
  /** Leading search icon slot */
  searchIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Clear dismissal button icon slot */
  clearIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Optional loading indicator slot */
  loader?: React.ComponentType<LoaderProps>
  /** Optional trailing keyboard shortcut badge slot */
  shortcut?: React.ComponentType<KbdProps>
}

/* ==========================================================================
   SearchField Root Primitive & Factory
   ========================================================================== */

export interface SearchFieldProps
  extends Omit<RACSearchFieldProps, 'children'>,
    VariantProps<typeof searchFieldStyles> {
  /** Current controlled search value. */
  value?: string
  /** Default uncontrolled initial search value. */
  defaultValue?: string
  /** Callback fired when search query changes. */
  onChange?: (value: string) => void
  /** Callback fired when Enter is pressed or submit is triggered. */
  onSubmit?: (value: string) => void
  /** Callback fired when the clear button is pressed. */
  onClear?: () => void
  /** Whether search is in an active loading state. */
  isLoading?: boolean
  /** Whether interaction is disabled. */
  isDisabled?: boolean
  /** Whether the field is read-only. */
  isReadOnly?: boolean
  /** Custom CSS classes for the search field. */
  className?: string
  /** Child elements, defaulting to SearchInput if omitted. */
  children?: React.ReactNode
  /** Injected slot component overrides. */
  slots?: SlotComponents<SearchFieldSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<SearchFieldSlots>
}

const SearchFieldPrimitive = ({
  className,
  isLoading = false,
  children,
  slots = {},
  slotProps = {},
  ...props
}: SearchFieldProps) => {
  return (
    <RACSearchField
      data-slot="search-field"
      aria-label={props['aria-label'] || 'Search'}
      className={cn(searchFieldStyles(), fieldStyles(), className)}
      {...props}
    >
      {children || <SearchInput isLoading={isLoading} slots={slots} slotProps={slotProps} />}
    </RACSearchField>
  )
}

export const SearchField = createInterfaceComponent<SearchFieldProps, SearchFieldSlots>(
  {
    name: 'SearchField',
    category: 'form',
    description: 'Accessible search input with leading search icon, clear button, loading state slot, and shortcut badge.',
    version: '1.0.0',
    props: {
      isLoading: false,
      isDisabled: false,
    },
    slots: {
      searchIcon: MagnifyingGlassIcon,
      clearIcon: XMarkIcon,
      loader: Loader,
      shortcut: undefined,
    },
  },
  SearchFieldPrimitive
)

/* ==========================================================================
   SearchInput Subcomponent
   ========================================================================== */

export interface SearchInputSlots extends SearchFieldSlots {}

export interface SearchInputProps extends RACInputProps {
  /** Optional DOM ref passed directly to the HTML input element. */
  ref?: React.Ref<HTMLInputElement>
  /** Whether search query is in an active loading state. */
  isLoading?: boolean
  /** Keyboard shortcut key sequence badge string (e.g. '⌘K'). */
  shortcut?: string
  /** Placeholder text shown when query is empty. */
  placeholder?: string
  /** Custom CSS classes for the input element. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<SearchInputSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<SearchInputSlots>
}

const SearchInputDefaultShortcut = ({ children, className, ...props }: any) => (
  <kbd
    data-slot="search-shortcut"
    className={cn(
      'hidden sm:inline-flex items-center justify-center px-1.5 py-space-2xs text-[10px] font-mono font-medium rounded-micro bg-secondary border border-border/40 text-muted-fg select-none group-not-empty/search-field:hidden',
      className
    )}
    {...props}
  >
    {children}
  </kbd>
)

const SearchInputPrimitive = ({
  className,
  isLoading = false,
  shortcut,
  slots = {},
  slotProps = {},
  ref,
  ...props
}: SearchInputProps) => {
  return (
    <div data-slot="search-input-group" className="relative isolate flex items-center w-full">
      <div className="absolute inset-y-0 start-3 z-10 flex items-center pointer-events-none text-muted-fg">
        {isLoading ? (
          renderSlot(
            slots.loader,
            { size: 'xs', className: 'size-4 text-muted-fg shrink-0', ...(slotProps?.loader as object) },
            { defaultComponent: Loader }
          )
        ) : (
          renderSlot(
            slots.searchIcon,
            { className: 'size-4 shrink-0', ...(slotProps?.searchIcon as object) },
            { defaultComponent: MagnifyingGlassIcon }
          )
        )}
      </div>

      <RACInput
        ref={ref as any}
        data-slot="input"
        className={cn(
          'relative block w-full appearance-none rounded-base bg-bg py-space-sm sm:py-1.5 text-base/6 text-fg placeholder:text-muted-fg sm:text-sm/6 border border-input transition-colors enabled:hover:border-muted-fg/40 outline-hidden focus:border-ring focus:ring-2 focus:ring-ring/20 invalid:border-danger focus:invalid:border-danger focus:invalid:ring-danger/20 [&::-ms-reveal]:hidden [&::-webkit-search-cancel-button]:hidden disabled:bg-muted disabled:opacity-60 disabled:cursor-not-allowed dark:scheme-dark',
          'ps-9',
          shortcut ? 'pe-14' : 'pe-8',
          className
        )}
        {...props}
      />

      <div className="absolute inset-y-0 end-1.5 z-10 flex items-center gap-space-xs">
        <RACButton
          data-slot="search-clear-button"
          aria-label="Clear search query"
          className="grid place-content-center size-6 rounded-micro text-muted-fg hover:text-fg hover:bg-secondary/80 transition-colors group-empty/search-field:hidden cursor-pointer outline-none"
        >
          {renderSlot(
            slots.clearIcon,
            { className: 'size-3.5', ...(slotProps?.clearIcon as object) },
            { defaultComponent: XMarkIcon }
          )}
        </RACButton>

        {shortcut && (
          renderSlot(
            slots.shortcut,
            { children: shortcut, ...(slotProps?.shortcut as object) },
            { defaultComponent: SearchInputDefaultShortcut }
          )
        )}
      </div>
    </div>
  )
}

export const SearchInput = createInterfaceComponent<SearchInputProps, SearchFieldSlots>(
  {
    name: 'SearchInput',
    category: 'form',
    description: 'Search field input box with responsive icon, clear button, and shortcut badge slot.',
    version: '1.0.0',
    props: {
      isLoading: false,
    },
    slots: {
      searchIcon: MagnifyingGlassIcon,
      clearIcon: XMarkIcon,
      loader: Loader,
      shortcut: SearchInputDefaultShortcut,
    },
  },
  SearchInputPrimitive
)

// Namespace attachments for compound family ergonomics
SearchField.Input = SearchInput
