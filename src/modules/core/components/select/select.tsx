import React from 'react'
import {
  Select as RACSelect,
  type SelectProps as RACSelectProps,
  SelectValue as RACSelectValue,
  type SelectValueProps as RACSelectValueProps,
  Button as RACButton,
  type ButtonProps as RACButtonProps,
  ListBox as RACListBox,
  type ListBoxProps as RACListBoxProps,
  ListBoxItem as RACListBoxItem,
  type ListBoxItemProps as RACListBoxItemProps,
  Section as RACSection,
  type SectionProps as RACSectionProps,
  Header as RACHeader,
  type HeaderProps as RACHeaderProps,
  Separator as RACSeparator,
  type SeparatorProps as RACSeparatorProps,
  Popover as RACPopover,
  type PopoverProps as RACPopoverProps,
} from 'react-aria-components'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid'
import { Field } from '../field'

/* ==========================================================================
   Select Styles & Ramps
   ========================================================================== */

export const selectTriggerStyles = tv({
  base: [
    'relative flex w-full cursor-pointer items-center justify-between gap-space-sm border text-left outline-none transition-all duration-150',
    'rounded-base font-normal select-none',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/40',
  ],
  variants: {
    variant: {
      default:
        'bg-bg text-fg border-border hover:bg-secondary/40 active:bg-secondary/60',
      filled:
        'bg-secondary text-secondary-fg border-transparent hover:bg-secondary/80 active:bg-secondary/90',
      outline:
        'bg-transparent text-fg border-border hover:bg-secondary/30 active:bg-secondary/50',
      subtle:
        'bg-primary-subtle text-primary-subtle-fg border-transparent hover:bg-primary-subtle/80',
    },
    size: {
      sm: 'min-h-8 px-2.5 py-space-xs text-xs/4 gap-x-1.5',
      md: 'min-h-9 px-space-md py-1.5 text-sm/5 gap-x-space-sm',
      lg: 'min-h-11 px-space-lg py-2.5 text-base/6 gap-x-2.5',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
})

export const listBoxItemStyles = tv({
  base: [
    'group relative flex cursor-pointer select-none items-center gap-2.5 rounded-base px-2.5 py-1.5 text-xs sm:text-sm font-medium outline-none transition-colors',
    'data-[focused]:bg-secondary data-[focused]:text-fg',
    'data-[selected]:bg-primary/10 data-[selected]:text-primary data-[selected]:font-semibold',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
    '*:data-[slot=icon]:size-4 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:text-muted-fg group-data-[focused]:*:data-[slot=icon]:text-fg',
  ],
})

/* ==========================================================================
   Select Slots & State
   ========================================================================== */

export interface SelectSlots {
  /** Dropdown activator button trigger slot */
  trigger?: React.ComponentType<SelectTriggerProps>
  /** Rendered value container slot */
  value?: React.ComponentType<SelectValueProps<object>>
  /** Floating popover slot */
  popover?: React.ComponentType<SelectPopoverProps>
  /** ListBox item container slot */
  listBox?: React.ComponentType<ListBoxProps<object>>
}

/* ==========================================================================
   Select Root Primitive & Factory
   ========================================================================== */

export interface SelectProps<T = any>
  extends Omit<RACSelectProps<T & object>, 'children'>,
    VariantProps<typeof selectTriggerStyles> {
  /** Items list rendered in the select dropdown */
  items?: Iterable<T>
  /** Visual surface variant: default, filled, outline, subtle. */
  variant?: 'default' | 'filled' | 'outline' | 'subtle'
  /** Size token scaling trigger and typography: sm, md, lg. */
  /** Custom size configuration. */
  size?: 'sm' | 'md' | 'lg'
  /** Placeholder text shown when no item is selected. */
  placeholder?: string
  /** Additional CSS class names on the trigger container. */
  className?: string
  /** Slot component overrides. */
  slots?: SlotComponents<SelectSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<SelectSlots>
  /** Children items or render function. */
  children?: React.ReactNode | ((item: T) => React.ReactNode)
}

function isSelectChrome(node: React.ReactNode): boolean {
  return React.Children.toArray(node).some((child) => {
    if (!React.isValidElement(child)) return false
    const name = (child.type as { displayName?: string; name?: string }).displayName
      ?? (child.type as { name?: string }).name
    return (
      name === 'SelectTrigger' ||
      name === 'SelectPopover' ||
      name === 'SelectValue' ||
      name === 'ListBox'
    )
  })
}

const SelectPrimitive = <T extends object = object>({
  className,
  variant = 'default',
  size = 'md',
  placeholder = 'Select an option...',
  slots = {},
  slotProps = {},
  children,
  ...props
}: SelectProps<T>) => {
  const composed = typeof children !== 'function' && isSelectChrome(children)

  const trigger = renderSlot(
    slots?.trigger,
    {
      variant,
      size,
      ...(slotProps?.trigger as object),
      children: (
        <>
          {renderSlot(
            slots?.value,
            { placeholder, ...(slotProps?.value as object) },
            { defaultComponent: SelectValue }
          )}
          <ChevronUpDownIcon className="size-4 shrink-0 text-muted-fg ms-auto" />
        </>
      ),
    },
    { defaultComponent: SelectTrigger }
  )

  return (
    <RACSelect
      data-slot="select"
      placeholder={placeholder}
      className={cn('w-full flex flex-col gap-1.5', className)}
      {...props}
    >
      {composed ? (
        children
      ) : (
        <>
          {trigger}
          {renderSlot(
            slots?.popover,
            {
              ...(slotProps?.popover as object),
              children: renderSlot(
                slots?.listBox,
                {
                  'data-slot': 'list-box',
                  className: cn(
                    'outline-none focus:outline-none flex flex-col gap-space-2xs',
                    slotProps?.listBox?.className
                  ),
                  items: (props as any).items,
                  children: children as any,
                  ...(slotProps?.listBox as object),
                } as any,
                { defaultComponent: ListBox }
              ),
            },
            { defaultComponent: SelectPopover }
          )}
        </>
      )}
    </RACSelect>
  )
}

export const Select = createInterfaceComponent<SelectProps<any>, SelectSlots>(
  {
    name: 'Select',
    category: 'form',
    description: 'Accessible select dropdown system with searchable options, chips, and optical token styling.',
    version: '1.0.0',
    props: {
      variant: 'default',
      size: 'md',
      placeholder: 'Select an option...',
    },
    slots: {
      trigger: undefined,
      value: undefined,
      popover: undefined,
      listBox: undefined,
    },
  },
  SelectPrimitive
)

/* ==========================================================================
   Select Sub-Atoms & ListBox Family
   ========================================================================== */

export interface SelectTriggerProps
  extends RACButtonProps,
    VariantProps<typeof selectTriggerStyles> {
  /** Visual variant of the trigger button */
  variant?: 'default' | 'filled' | 'outline' | 'subtle'
  /** Size dimension of the trigger */
  size?: 'sm' | 'md' | 'lg'
}

const SelectTriggerPrimitive = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}: SelectTriggerProps) => {
  return (
    <RACButton
      data-slot="select-trigger"
      className={(values) =>
        cn(
          selectTriggerStyles({ variant, size }),
          typeof className === 'function' ? (className as any)(values) : className
        )
      }
      {...props}
    >
      {(values) => (
        <>
          {typeof children === 'function' ? children(values) : children}
          {!children && (
            <>
              <SelectValue />
              <ChevronUpDownIcon className="size-4 shrink-0 text-muted-fg ms-auto" />
            </>
          )}
        </>
      )}
    </RACButton>
  )
}

export const SelectTrigger = createInterfaceComponent<SelectTriggerProps>(
  {
    name: 'SelectTrigger',
    category: 'form',
    description: 'Dropdown trigger button showing current selection and toggle chevron.',
    version: '1.0.0',
    props: {
      variant: 'default',
      size: 'md',
    },
  },
  SelectTriggerPrimitive
)

export interface SelectValueProps<T extends object = object> extends RACSelectValueProps<T> {
  /** placeholder */
  placeholder?: string
}

const SelectValuePrimitive = <T extends object = object>({
  className,
  placeholder = 'Select an option...',
  children,
  ...props
}: SelectValueProps<T>) => {
  return (
    <RACSelectValue
      data-slot="select-value"
      className={cn(
        'flex min-w-0 flex-1 items-center gap-2 text-left data-[placeholder]:text-muted-fg',
        '[&_[data-slot=icon]]:flex [&_[data-slot=icon]]:size-4 [&_[data-slot=icon]]:shrink-0 [&_[data-slot=icon]]:items-center',
        '[&_[data-slot=icon]_svg]:size-4',
        '[&_[data-slot=description]]:hidden',
        '[&_[data-slot=selection-indicator]]:hidden',
        className
      )}
      {...props}
    >
      {typeof children === 'function'
        ? children
        : ({ defaultChildren, isPlaceholder }) =>
            isPlaceholder ? (
              <span className="truncate text-muted-fg">{placeholder || 'Select an option...'}</span>
            ) : (
              <span className="flex min-w-0 flex-1 items-center gap-2 text-fg">
                {defaultChildren || placeholder || 'Select an option...'}
              </span>
            )}
    </RACSelectValue>
  )
}

export const SelectValue = createInterfaceComponent<SelectValueProps<any>>(
  {
    name: 'SelectValue',
    category: 'form',
    description: 'Rendered text value for the currently selected option.',
    version: '1.0.0',
  },
  SelectValuePrimitive
)

export interface SelectPopoverProps extends RACPopoverProps {
  /** className */
  className?: string
}

const SelectPopoverPrimitive = ({
  className,
  offset = 4,
  ...props
}: SelectPopoverProps) => {
  return (
    <RACPopover
      offset={offset}
      data-slot="select-popover"
      className={(values) =>
        cn(
          'z-50 min-w-[var(--trigger-width)] max-h-60 overflow-y-auto p-1.5 outline-none border border-border/80 bg-overlay/95 backdrop-blur-md text-fg rounded-macro shadow-lg',
          'consona-overlay-motion',
          typeof className === 'function' ? (className as any)(values) : className
        )
      }
      {...props}
    />
  )
}

export const SelectPopover = createInterfaceComponent<SelectPopoverProps>(
  {
    name: 'SelectPopover',
    category: 'form',
    description: 'Floating dropdown popover menu anchored to the select trigger.',
    version: '1.0.0',
    props: {
      offset: 4,
    },
  },
  SelectPopoverPrimitive
)

export interface ListBoxProps<T extends object = object> extends Omit<RACListBoxProps<T>, 'children'> {
  /** Explicit children composition or render function. */
  children?: React.ReactNode | ((item: T) => React.ReactNode)
  /** className */
  className?: string
}

const ListBoxPrimitive = <T extends object = object>({
  className,
  ...props
}: ListBoxProps<T>) => {
  return (
    <RACListBox
      data-slot="list-box"
      className={cn('outline-none focus:outline-none flex flex-col gap-space-2xs', className)}
      {...props}
    />
  )
}

export const ListBox = createInterfaceComponent<ListBoxProps<any>>(
  {
    name: 'ListBox',
    category: 'form',
    description: 'Accessible list box selection container with keyboard arrow navigation.',
    version: '1.0.0',
  },
  ListBoxPrimitive
)

function extractText(node: React.ReactNode): string | undefined {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) {
    const texts = node.map(extractText).filter(Boolean)
    return texts.length > 0 ? texts.join(' ') : undefined
  }
  if (React.isValidElement(node)) {
    return extractText((node.props as any)?.children)
  }
  return undefined
}

export interface ListBoxItemProps extends RACListBoxItemProps {
  /** Optional icon displayed before label. */
  icon?: React.ReactNode
  /** Optional subtitle or description text. */
  description?: string
}

const ListBoxItemPrimitive = ({
  className,
  textValue,
  icon,
  description,
  children,
  ...props
}: ListBoxItemProps) => {
  const derivedTextValue =
    textValue ?? (typeof children === 'function' ? undefined : extractText(children))

  return (
    <RACListBoxItem
      data-slot="list-box-item"
      textValue={derivedTextValue}
      className={(values) =>
        cn(
          listBoxItemStyles(),
          typeof className === 'function' ? (className as any)(values) : className
        )
      }
      {...props}
    >
      {(itemState) => (
        <>
          {icon && <span data-slot="icon">{icon}</span>}
          <div className="flex-1 flex flex-col min-w-0">
            <span className="truncate">
              {typeof children === 'function' ? children(itemState) : children}
            </span>
            {description && (
              <span data-slot="description" className="text-2xs text-muted-fg font-normal truncate">
                {description}
              </span>
            )}
          </div>
          {itemState.isSelected && (
            <CheckIcon data-slot="selection-indicator" className="size-4 shrink-0 text-primary" />
          )}
        </>
      )}
    </RACListBoxItem>
  )
}

export const ListBoxItem = createInterfaceComponent<ListBoxItemProps>(
  {
    name: 'ListBoxItem',
    category: 'form',
    description: 'Option row within select list boxes with selection indicator and optional icon.',
    version: '1.0.0',
  },
  ListBoxItemPrimitive
)

export interface ListBoxSectionProps<T extends object = object> extends Omit<RACSectionProps<T>, 'children'> {
  /** Optional section title header. */
  title?: string
  className?: string
  children?: React.ReactNode | ((item: T) => React.ReactNode)
}

const ListBoxSectionPrimitive = <T extends object = object>({
  className,
  title,
  children,
  ...props
}: ListBoxSectionProps<T>) => {
  return (
    <RACSection
      data-slot="list-box-section"
      className={cn('py-space-xs first:pt-0 last:pb-0', className)}
      {...(props as any)}
    >
      {title && (
        <RACHeader
          data-slot="list-box-header"
          className="px-2.5 py-space-xs text-[11px] font-bold uppercase tracking-wider text-muted-fg select-none"
        >
          {title}
        </RACHeader>
      )}
      {children as any}
    </RACSection>
  )
}

export const ListBoxSection = createInterfaceComponent<ListBoxSectionProps<any>>(
  {
    name: 'ListBoxSection',
    category: 'form',
    description: 'Logical grouping container organizing related list box items.',
    version: '1.0.0',
  },
  ListBoxSectionPrimitive
)

export interface ListBoxSeparatorProps extends RACSeparatorProps {
  /** className */
  className?: string
}

const ListBoxSeparatorPrimitive = ({ className, ...props }: ListBoxSeparatorProps) => {
  return (
    <RACSeparator
      data-slot="list-box-separator"
      className={cn('my-space-xs h-px bg-border/70 -mx-1', className)}
      {...props}
    />
  )
}

export const ListBoxSeparator = createInterfaceComponent<ListBoxSeparatorProps>(
  {
    name: 'ListBoxSeparator',
    category: 'form',
    description: 'Divider line separating list box sections.',
    version: '1.0.0',
  },
  ListBoxSeparatorPrimitive
)

export interface SelectFieldProps<T extends object = object> extends SelectProps<T> {
  /** label */
  label?: React.ReactNode
  /** Custom description configuration. */
  description?: React.ReactNode
  /** Custom error message configuration. */
  errorMessage?: React.ReactNode
  /** fieldClassName */
  fieldClassName?: string
}

const SelectFieldPrimitive = <T extends object = object>({
  label,
  description,
  errorMessage,
  fieldClassName,
  ...props
}: SelectFieldProps<T>) => {
  return (
    <Field className={fieldClassName}>
      {label && <Field.Label>{label}</Field.Label>}
      <Select {...props} />
      {description && <Field.Description>{description}</Field.Description>}
      {errorMessage && <Field.Error>{errorMessage}</Field.Error>}
    </Field>
  )
}

export const SelectField = createInterfaceComponent<SelectFieldProps<any>>(
  {
    name: 'SelectField',
    category: 'form',
    description: 'Composite form field wrapping Select with accessible Label, Description, and ErrorMessage.',
    version: '1.0.0',
  },
  SelectFieldPrimitive
)

// Namespace attachments for compound family ergonomics
Select.Trigger = SelectTrigger
Select.Value = SelectValue
Select.Popover = SelectPopover
Select.ListBox = ListBox
Select.Item = ListBoxItem
Select.Section = ListBoxSection
Select.Separator = ListBoxSeparator
Select.Field = SelectField

ListBox.Item = ListBoxItem
ListBox.Section = ListBoxSection
ListBox.Separator = ListBoxSeparator

export const { Context: SelectContext, useCompoundContext: useSelectContext } =
  createCompoundContext<any>('Select')

export const { Context: ListBoxContext, useCompoundContext: useListBoxContext } =
  createCompoundContext<any>('ListBox')
