import React from 'react'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { fieldStyles } from '../field'

/* ==========================================================================
   NativeSelect Styles & Ramps
   ========================================================================== */

export const nativeSelectStyles = tv({
  base: 'flex flex-col gap-1.5 w-full relative has-[select:disabled]:opacity-50',
})

export const nativeSelectContentStyles = tv({
  base: [
    'relative block w-full appearance-none rounded-base font-normal select-none',
    'bg-bg text-fg border border-input transition-colors duration-150',
    'outline-none focus:border-ring focus:ring-2 focus:ring-ring/20',
    'enabled:hover:border-muted-fg/40',
    'disabled:cursor-not-allowed disabled:bg-muted/40 disabled:text-muted-fg disabled:opacity-60',
    'aria-[invalid=true]:border-danger aria-[invalid=true]:focus:border-danger aria-[invalid=true]:focus:ring-danger/20',
    'dark:scheme-dark cursor-pointer',
  ],
  variants: {
    size: {
      sm: 'h-8 px-2.5 pr-8 text-xs leading-normal py-1',
      md: 'h-9 px-3 pr-9 text-sm leading-normal py-1.5',
      lg: 'h-11 px-3.5 pr-10 text-base leading-normal py-2',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

/* ==========================================================================
   NativeSelect Slots & State Definitions
   ========================================================================== */

export interface NativeSelectSlots {
  /** Dropdown chevron indicator slot */
  chevron?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

/* ==========================================================================
   NativeSelect Root Primitive & Factory
   ========================================================================== */

export interface NativeSelectProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof nativeSelectStyles> {
  /** Custom CSS classes for the container wrapper. */
  className?: string
  /** Child select element or options. */
  children?: React.ReactNode
  /** Injected slot component overrides. */
  slots?: SlotComponents<NativeSelectSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<NativeSelectSlots>
}

const NativeSelectPrimitive = ({
  className,
  slots = {},
  slotProps = {},
  ...props
}: NativeSelectProps) => {
  return (
    <div
      data-slot="native-select"
      className={cn(nativeSelectStyles(), fieldStyles(), className)}
      {...props}
    />
  )
}

export const NativeSelect = createInterfaceComponent<NativeSelectProps, NativeSelectSlots>(
  {
    name: 'NativeSelect',
    category: 'form',
    description: 'Styled native HTML select input optimized for mobile operating systems and instant rendering.',
    version: '1.0.0',
    props: {},
    slots: {
      chevron: ChevronUpDownIcon,
    },
  },
  NativeSelectPrimitive
)

/* ==========================================================================
   NativeSelectContent Subcomponent
   ========================================================================== */

export interface NativeSelectContentProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof nativeSelectContentStyles> {
  /** Whether the field failed validation. */
  isInvalid?: boolean
  /** Controlled value of the select element. */
  value?: string | number | readonly string[]
  /** Default uncontrolled initial value. */
  defaultValue?: string | number | readonly string[]
  /** Callback fired when selection changes. */
  onChange?: React.ChangeEventHandler<HTMLSelectElement>
  /** Whether the select control is disabled. */
  disabled?: boolean
  /** Size variant for native select. */
  size?: 'sm' | 'md' | 'lg'
  /** Custom CSS classes for the native select element. */
  className?: string
  /** Child options or optgroups. */
  children?: React.ReactNode
  /** Injected slot component overrides. */
  slots?: SlotComponents<NativeSelectSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<NativeSelectSlots>
}

const NativeSelectContentPrimitive = ({
  className,
  size = 'md',
  isInvalid = false,
  slots = {},
  slotProps = {},
  children,
  ...props
}: NativeSelectContentProps) => {
  const chevronSizeClass = size === 'sm' ? 'size-3.5' : size === 'lg' ? 'size-4.5' : 'size-4'
  const chevronRightClass = size === 'sm' ? 'right-2' : size === 'lg' ? 'right-3' : 'right-2.5'

  return (
    <div data-slot="native-select-control" className="relative flex items-center justify-between w-full">
      <select
        data-slot="select"
        aria-invalid={isInvalid ? 'true' : undefined}
        className={cn(nativeSelectContentStyles({ size }), className)}
        {...props}
      >
        {children}
      </select>
      <div className={cn('pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-fg', chevronRightClass)}>
        {renderSlot(slots.chevron, slotProps.chevron) || (
          <ChevronUpDownIcon className={chevronSizeClass} />
        )}
      </div>
    </div>
  )
}

export const NativeSelectContent = createInterfaceComponent<NativeSelectContentProps, NativeSelectSlots>(
  {
    name: 'NativeSelectContent',
    category: 'form',
    description: 'Core select element and dropdown indicator for NativeSelect.',
    version: '1.0.0',
    slots: {
      chevron: ChevronUpDownIcon,
    },
  },
  NativeSelectContentPrimitive
)

/* ==========================================================================
   NativeSelect Option & OptGroup
   ========================================================================== */

export interface NativeSelectOptionSlots {}

export interface NativeSelectOptionProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  /** Injected slot component overrides. */
  slots?: SlotComponents<NativeSelectOptionSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<NativeSelectOptionSlots>
}

const NativeSelectOptionPrimitive = (props: NativeSelectOptionProps) => <option {...props} />

export const NativeSelectOption = createInterfaceComponent<NativeSelectOptionProps, NativeSelectOptionSlots>(
  {
    name: 'NativeSelectOption',
    category: 'form',
    description: 'Option item within a NativeSelect element.',
    version: '1.0.0',
    slots: {

    },
  },
  NativeSelectOptionPrimitive
)

export interface NativeSelectOptGroupSlots {}

export interface NativeSelectOptGroupProps extends React.OptgroupHTMLAttributes<HTMLOptGroupElement> {
  /** Injected slot component overrides. */
  slots?: SlotComponents<NativeSelectOptGroupSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<NativeSelectOptGroupSlots>
}

const NativeSelectOptGroupPrimitive = (props: NativeSelectOptGroupProps) => <optgroup {...props} />

export const NativeSelectOptGroup = createInterfaceComponent<NativeSelectOptGroupProps, NativeSelectOptGroupSlots>(
  {
    name: 'NativeSelectOptGroup',
    category: 'form',
    description: 'Option group category container within a NativeSelect element.',
    version: '1.0.0',
    slots: {

    },
  },
  NativeSelectOptGroupPrimitive
)

// Namespace attachments for compound family ergonomics
NativeSelect.Content = NativeSelectContent
NativeSelect.Option = NativeSelectOption
NativeSelect.OptGroup = NativeSelectOptGroup

export const { Context: NativeSelectContext, useCompoundContext: useNativeSelectContext } =
  createCompoundContext<any>('NativeSelect')
