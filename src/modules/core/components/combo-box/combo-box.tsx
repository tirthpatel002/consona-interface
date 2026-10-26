import React from 'react'
import {
  ComboBox as RACComboBox,
  type ComboBoxProps as RACComboBoxProps,
  ComboBoxValue as RACComboBoxValue,
  type ComboBoxValueProps as RACComboBoxValueProps,
  Button as RACButton,
  Input as RACInput,
  type InputProps as RACInputProps,
  ListBox as RACListBox,
  type ListBoxProps as RACListBoxProps,
  ListBoxItem as RACListBoxItem,
  type ListBoxItemProps as RACListBoxItemProps,
  ListBoxSection as RACListBoxSection,
  type ListBoxSectionProps as RACListBoxSectionProps,
  Header as RACHeader,
  type HeaderProps as RACHeaderProps,
  Separator as RACSeparator,
  type SeparatorProps as RACSeparatorProps,
  Popover as RACPopover,
  type PopoverProps as RACPopoverProps,
  type Key,
} from 'react-aria-components'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid'
import { fieldStyles } from '../field'

/* ==========================================================================
   ComboBox Styles & Ramps
   ========================================================================== */

export const comboBoxStyles = tv({
  base: 'flex flex-col gap-1.5 w-full group/combo-box',
})

export const comboBoxPopoverStyles = tv({
  base: [
    'z-50 min-w-(--trigger-width) max-h-60 overflow-y-auto p-space-xs outline-none border border-border/40 bg-overlay/95 backdrop-blur-md text-fg rounded-macro shadow-lg',
    'consona-overlay-motion',
  ],
})

export const comboBoxItemStyles = tv({
  base: [
    'group/combo-box-item relative flex items-center gap-space-sm px-2.5 py-1.5 rounded-micro select-none cursor-pointer outline-none text-sm transition-colors duration-100',
    'focus:bg-accent focus:text-accent-fg',
    'data-[selected]:bg-accent/70 data-[selected]:text-accent-fg data-[selected]:font-medium',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
  ],
})

/* ==========================================================================
   ComboBox Slots & State Definitions
   ========================================================================== */

export interface ComboBoxSlots {
  /** Dropdown toggle chevron icon slot */
  chevron?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

/* ==========================================================================
   ComboBox Root Primitive & Factory
   ========================================================================== */

export interface ComboBoxProps<T extends object = object>
  extends Omit<RACComboBoxProps<T>, 'children' | 'selectedKey' | 'defaultSelectedKey' | 'onSelectionChange'>,
    VariantProps<typeof comboBoxStyles> {
  /** Current selected item key. */
  selectedKey?: Key | null
  /** Default initially selected item key. */
  defaultSelectedKey?: Key
  /** Callback fired when selected key changes. */
  onSelectionChange?: (key: Key | null) => void
  /** Current text value in the input. */
  inputValue?: string
  /** Default initial text value in the input. */
  defaultInputValue?: string
  /** Callback fired when input text changes. */
  onInputChange?: (value: string) => void
  /** Placeholder text shown when input is empty. */
  placeholder?: string
  /** Whether user interaction is disabled. */
  isDisabled?: boolean
  /** Whether the field is read-only. */
  isReadOnly?: boolean
  /** Whether a value is required for form validation. */
  isRequired?: boolean
  /** Custom CSS classes for the combobox container. */
  className?: string
  /** Child elements composing input, popover, and listbox. */
  children?: React.ReactNode
  /** Injected slot component overrides. */
  slots?: SlotComponents<ComboBoxSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ComboBoxSlots>
}

const ComboBoxPrimitive = <T extends object = object>({
  className,
  slots = {},
  slotProps = {},
  ...props
}: ComboBoxProps<T>) => {
  return (
    <RACComboBox
      data-slot="combo-box"
      className={cn(comboBoxStyles(), fieldStyles(), className)}
      {...(props as any)}
    />
  )
}

export const ComboBox = createInterfaceComponent<ComboBoxProps<any>, ComboBoxSlots>(
  {
    name: 'ComboBox',
    category: 'form',
    description: 'Filterable auto-complete dropdown select input with keyboard navigation and listbox selection.',
    version: '1.0.0',
    props: {
      isDisabled: false,
    },
    slots: {
      chevron: ChevronUpDownIcon,
    },
  },
  ComboBoxPrimitive
)

/* ==========================================================================
   ComboBox Input & Trigger Subcomponents
   ========================================================================== */

export interface ComboBoxInputProps extends RACInputProps {
  /** Optional DOM ref passed directly to the HTML input element. */
  ref?: React.Ref<HTMLInputElement>
  /** Placeholder text shown when input is empty. */
  placeholder?: string
  /** Custom CSS class names for the input. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<ComboBoxSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ComboBoxSlots>
}

const ComboBoxInputPrimitive = ({
  className,
  placeholder,
  slots = {},
  slotProps = {},
  ref,
  ...props
}: ComboBoxInputProps) => {
  return (
    <div data-slot="combo-box-control" className="relative isolate flex items-center w-full">
      <RACInput
        ref={ref as any}
        data-slot="input"
        placeholder={placeholder}
        className={cn(
          'relative block w-full appearance-none rounded-base bg-bg px-3.5 py-space-sm sm:px-space-md sm:py-1.5',
          'text-base/6 text-fg placeholder:text-muted-fg sm:text-sm/6',
          'border border-input transition-colors enabled:hover:border-muted-fg/40',
          'outline-hidden focus:border-ring focus:ring-2 focus:ring-ring/20',
          'invalid:border-danger focus:invalid:border-danger focus:invalid:ring-danger/20',
          'pe-10',
          'disabled:bg-muted disabled:opacity-60 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
      <RACButton
        data-slot="combo-box-button"
        aria-label="Toggle options"
        className="absolute inset-y-0 end-0 grid w-10 place-content-center text-muted-fg hover:text-fg transition-colors cursor-pointer outline-none z-10"
      >
        {renderSlot(slots.chevron, slotProps.chevron) || (
          <ChevronUpDownIcon className="size-4 pointer-events-none" />
        )}
      </RACButton>
    </div>
  )
}

export const ComboBoxInput = createInterfaceComponent<ComboBoxInputProps, ComboBoxSlots>(
  {
    name: 'ComboBoxInput',
    category: 'form',
    description: 'Text input triggering the filterable ComboBox popover dropdown.',
    version: '1.0.0',
    slots: {
      chevron: ChevronUpDownIcon,
    },
  },
  ComboBoxInputPrimitive
)

/* ==========================================================================
   ComboBox Content / Popover Subcomponent
   ========================================================================== */

/* ==========================================================================
   ComboBox Content / Popover Subcomponent
   ========================================================================== */

export interface ComboBoxContentSlots {}

export interface ComboBoxContentProps<T extends object = object>
  extends Omit<RACListBoxProps<T>, 'layout' | 'orientation'> {
  /** Props passed to the underlying floating Popover container. */
  popoverProps?: Omit<RACPopoverProps, 'children'>
  /** Alias for popoverProps for compatibility. */
  popover?: Omit<RACPopoverProps, 'children'>
  /** Custom CSS classes for the ListBox. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<ComboBoxContentSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ComboBoxContentSlots>
}

const ComboBoxContentPrimitive = <T extends object = object>({
  children,
  items,
  className,
  popoverProps,
  popover,
  slots,
  slotProps,
  ...props
}: ComboBoxContentProps<T>) => {
  const mergedPopover = popoverProps || popover
  return (
    <RACPopover
      offset={4}
      {...(mergedPopover as any)}
      data-slot="combo-box-popover"
      className={(values) =>
        cn(
          comboBoxPopoverStyles(),
          typeof mergedPopover?.className === 'function'
            ? (mergedPopover.className as any)(values)
            : mergedPopover?.className
        )
      }
    >
      <RACListBox
        data-slot="combo-box-listbox"
        className={cn(
          'flex max-h-64 w-full flex-col gap-space-2xs overflow-y-auto p-space-2xs outline-none',
          className
        )}
        items={items}
        {...props}
      >
        {children}
      </RACListBox>
    </RACPopover>
  )
}

export const ComboBoxContent = createInterfaceComponent<ComboBoxContentProps<any>, ComboBoxContentSlots>(
  {
    name: 'ComboBoxContent',
    category: 'form',
    description: 'Floating popover container with scrollable listbox items for ComboBox.',
    version: '1.0.0',
    slots: {

    },
  },
  ComboBoxContentPrimitive
)

/* ==========================================================================
   ComboBoxItem Subcomponent
   ========================================================================== */

export interface ComboBoxItemSlots {
  /** Checkmark selection indicator slot */
  checkIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface ComboBoxItemProps extends RACListBoxItemProps {
  /** Optional leading icon */
  icon?: React.ReactNode
  /** Optional secondary description text */
  description?: string
  /** Custom CSS classes for the item */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<ComboBoxItemSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ComboBoxItemSlots>
}

const ComboBoxItemPrimitive = ({
  className,
  icon,
  description,
  children,
  textValue: customTextValue,
  slots = {},
  slotProps = {},
  ...props
}: ComboBoxItemProps) => {
  const computedTextValue =
    customTextValue ??
    (typeof children === 'string'
      ? children
      : typeof (props as any).title === 'string'
        ? (props as any).title
        : undefined)

  return (
    <RACListBoxItem
      data-slot="combo-box-item"
      textValue={computedTextValue}
      className={(values) =>
        cn(
          comboBoxItemStyles(),
          typeof className === 'function' ? (className as any)(values) : className
        )
      }
      {...props}
    >
      {(renderProps) => (
        <>
          {icon && <span className="size-4 shrink-0 text-muted-fg">{icon}</span>}
          <div className="flex flex-col flex-1 min-w-0">
            <span className="truncate">
              {typeof children === 'function' ? (children as any)(renderProps) : children}
            </span>
            {description && (
              <span className="text-xs text-muted-fg truncate">{description}</span>
            )}
          </div>
          {renderProps.isSelected && (
            renderSlot(slots.checkIcon, slotProps.checkIcon) || (
              <CheckIcon className="size-4 shrink-0 text-primary ml-auto" />
            )
          )}
        </>
      )}
    </RACListBoxItem>
  )
}

export const ComboBoxItem = createInterfaceComponent<ComboBoxItemProps, ComboBoxItemSlots>(
  {
    name: 'ComboBoxItem',
    category: 'form',
    description: 'Selectable item row inside the ComboBox listbox.',
    version: '1.0.0',
    slots: {
      checkIcon: CheckIcon,
    },
  },
  ComboBoxItemPrimitive
)

/* ==========================================================================
   Additional Anatomy Elements
   ========================================================================== */

export interface ComboBoxSectionSlots {}

export interface ComboBoxSectionProps<T extends object = object> extends RACListBoxSectionProps<T> {
  /** Custom CSS class name */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<ComboBoxSectionSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ComboBoxSectionSlots>
}

const ComboBoxSectionPrimitive = <T extends object = object>({
  className,
  slots,
  slotProps,
  ...props
}: ComboBoxSectionProps<T>) => {
  return <RACListBoxSection className={cn('flex flex-col gap-space-2xs', className)} {...props} />
}

export const ComboBoxSection = createInterfaceComponent<ComboBoxSectionProps<any>, ComboBoxSectionSlots>(
  {
    name: 'ComboBoxSection',
    category: 'form',
    description: 'Grouped section container within ComboBox listbox.',
    version: '1.0.0',
    slots: {

    },
  },
  ComboBoxSectionPrimitive
)

export interface ComboBoxHeaderSlots {}

export interface ComboBoxHeaderProps extends RACHeaderProps {
  /** Custom CSS class name */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<ComboBoxHeaderSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ComboBoxHeaderSlots>
}

const ComboBoxHeaderPrimitive = ({ className, slots, slotProps, ...props }: ComboBoxHeaderProps) => {
  return (
    <RACHeader
      className={cn('px-2.5 py-space-xs text-xs font-semibold text-muted-fg uppercase tracking-wider', className)}
      {...props}
    />
  )
}

export const ComboBoxHeader = createInterfaceComponent<ComboBoxHeaderProps, ComboBoxHeaderSlots>(
  {
    name: 'ComboBoxHeader',
    category: 'form',
    description: 'Section header label within ComboBox listbox.',
    version: '1.0.0',
    slots: {

    },
  },
  ComboBoxHeaderPrimitive
)

export interface ComboBoxSeparatorSlots {}

export interface ComboBoxSeparatorProps extends RACSeparatorProps {
  /** Custom CSS class name */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<ComboBoxSeparatorSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ComboBoxSeparatorSlots>
}

const ComboBoxSeparatorPrimitive = ({ className, slots, slotProps, ...props }: ComboBoxSeparatorProps) => {
  return <RACSeparator className={cn('h-px bg-border/40 my-space-xs -mx-0.5', className)} {...props} />
}

export const ComboBoxSeparator = createInterfaceComponent<ComboBoxSeparatorProps, ComboBoxSeparatorSlots>(
  {
    name: 'ComboBoxSeparator',
    category: 'form',
    description: 'Visual dividing separator rule within ComboBox listbox.',
    version: '1.0.0',
    slots: {

    },
  },
  ComboBoxSeparatorPrimitive
)

export interface ComboBoxValueSlots {}

export interface ComboBoxValueProps<T extends object = object> extends RACComboBoxValueProps<T> {
  /** Custom CSS class name */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<ComboBoxValueSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ComboBoxValueSlots>
}

const ComboBoxValuePrimitive = <T extends object = object>({
  className,
  slots,
  slotProps,
  ...props
}: ComboBoxValueProps<T>) => {
  return <RACComboBoxValue className={cn('text-sm text-fg', className)} {...props} />
}

export const ComboBoxValue = createInterfaceComponent<ComboBoxValueProps<any>, ComboBoxValueSlots>(
  {
    name: 'ComboBoxValue',
    category: 'form',
    description: 'Current selected value presenter within ComboBox.',
    version: '1.0.0',
    slots: {

    },
  },
  ComboBoxValuePrimitive
)

export interface ComboBoxLabelSlots {}

export interface ComboBoxLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Custom CSS class name */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<ComboBoxLabelSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ComboBoxLabelSlots>
}

const ComboBoxLabelPrimitive = ({ className, slots, slotProps, ...props }: ComboBoxLabelProps) => {
  return (
    <div
      data-slot="label"
      className={cn('text-sm font-semibold text-fg tracking-tight select-none', className)}
      {...props}
    />
  )
}

export const ComboBoxLabel = createInterfaceComponent<ComboBoxLabelProps, ComboBoxLabelSlots>(
  {
    name: 'ComboBoxLabel',
    category: 'form',
    description: 'Title heading text within a ComboBox item or dropdown.',
    version: '1.0.0',
    slots: {

    },
  },
  ComboBoxLabelPrimitive
)

export interface ComboBoxDescriptionSlots {}

export interface ComboBoxDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Custom CSS class name */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<ComboBoxDescriptionSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ComboBoxDescriptionSlots>
}

const ComboBoxDescriptionPrimitive = ({ className, slots, slotProps, ...props }: ComboBoxDescriptionProps) => {
  return (
    <div
      data-slot="description"
      className={cn('text-xs text-muted-fg leading-relaxed select-none', className)}
      {...props}
    />
  )
}

export const ComboBoxDescription = createInterfaceComponent<ComboBoxDescriptionProps, ComboBoxDescriptionSlots>(
  {
    name: 'ComboBoxDescription',
    category: 'form',
    description: 'Secondary description text within a ComboBox item or dropdown.',
    version: '1.0.0',
    slots: {

    },
  },
  ComboBoxDescriptionPrimitive
)

// Namespace attachments for compound family ergonomics
export const Autocomplete = ComboBox
ComboBox.Input = ComboBoxInput
ComboBox.Content = ComboBoxContent
ComboBox.Item = ComboBoxItem
ComboBox.Section = ComboBoxSection
ComboBox.Header = ComboBoxHeader
ComboBox.Separator = ComboBoxSeparator
ComboBox.Value = ComboBoxValue
ComboBox.Label = ComboBoxLabel
ComboBox.Description = ComboBoxDescription

Autocomplete.Input = ComboBoxInput
Autocomplete.Content = ComboBoxContent
Autocomplete.Item = ComboBoxItem
Autocomplete.Section = ComboBoxSection
Autocomplete.Header = ComboBoxHeader
Autocomplete.Separator = ComboBoxSeparator
Autocomplete.Value = ComboBoxValue
Autocomplete.Label = ComboBoxLabel
Autocomplete.Description = ComboBoxDescription

export const { Context: ComboBoxContext, useCompoundContext: useComboBoxContext } =
  createCompoundContext<any>('ComboBox')

export const { Context: AutocompleteContext, useCompoundContext: useAutocompleteContext } =
  createCompoundContext<any>('Autocomplete')
