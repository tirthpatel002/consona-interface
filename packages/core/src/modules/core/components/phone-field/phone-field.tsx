import React from 'react'
import type { Key } from 'react-aria-components'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Description, Field, FieldError, Label, fieldStyles, type DescriptionProps, type FieldErrorProps, type LabelProps } from '../field'
import { Input } from '../input'
import { PhoneInput, type PhoneInputProps } from '../phone-input/phone-input'
import { ListBox, ListBoxItem, Select, SelectPopover, SelectTrigger, SelectValue } from '../select'
import { usePhoneField } from '../../hooks/use-phone-field'
import { DEFAULT_PHONE_COUNTRIES, type PhoneCountry } from './countries'

export interface PhoneCountrySelectProps {
  /** Currently selected ISO country code. */
  selectedKey?: string
  /** Called when the selected country changes. */
  onSelectionChange?: (iso: string) => void
  /** Country catalog shown in the dropdown. */
  countries?: PhoneCountry[]
  /** Whether the trigger is disabled. */
  isDisabled?: boolean
  /** Additional classes on the select root. */
  className?: string
}

function matchesCountry(item: PhoneCountry, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return (
    item.name.toLowerCase().includes(needle) ||
    item.iso.toLowerCase().includes(needle) ||
    item.dialCode.toLowerCase().includes(needle) ||
    item.dialCode.replace('+', '').includes(needle.replace('+', ''))
  )
}

const PhoneCountrySelectPrimitive = ({
  selectedKey,
  onSelectionChange,
  countries = DEFAULT_PHONE_COUNTRIES,
  isDisabled,
  className,
}: PhoneCountrySelectProps) => {
  const selected = countries.find((item) => item.iso === selectedKey) ?? countries[0]
  const [query, setQuery] = React.useState('')
  const filtered = React.useMemo(
    () => countries.filter((item) => matchesCountry(item, query)),
    [countries, query]
  )

  return (
    <Select
      aria-label="Country calling code"
      selectedKey={selectedKey ?? selected?.iso}
      onSelectionChange={(key: Key | null) => {
        if (key != null) onSelectionChange?.(String(key))
      }}
      onOpenChange={(open) => {
        if (!open) setQuery('')
      }}
      isDisabled={isDisabled}
      className={cn('flex h-auto w-auto flex-row gap-0', className)}
    >
      <SelectTrigger
        variant="outline"
        className={cn(
          'h-auto min-h-9 self-stretch rounded-e-none border-input bg-bg',
          'px-3.5 py-space-sm sm:px-space-md sm:py-1.5 text-base/6 sm:text-sm/6',
          'hover:bg-bg hover:border-muted-fg/40'
        )}
      >
        <SelectValue>
          {() => (
            <span className="flex items-center gap-space-sm">
              <span aria-hidden="true">{selected?.flag}</span>
              <span className="font-medium tabular-nums">{selected?.dialCode}</span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectPopover className="min-w-72 overflow-hidden p-0">
        <div className="sticky top-0 z-10 border-b border-border bg-overlay p-space-sm">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-fg" />
            <Input
              aria-label="Search countries"
              placeholder="Search country or code"
              value={query}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
              onKeyDown={(event: React.KeyboardEvent) => event.stopPropagation()}
              className="ps-9"
            />
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="px-space-md py-space-sm text-sm text-muted-fg">No countries match that search.</p>
        ) : (
          <ListBox className="max-h-52 overflow-y-auto p-space-xs">
            {filtered.map((item) => (
              <ListBoxItem
                key={item.iso}
                id={item.iso}
                textValue={`${item.name} ${item.dialCode} ${item.iso}`}
                icon={<span aria-hidden="true">{item.flag}</span>}
              >
                <span className="flex min-w-0 flex-1 items-center justify-between gap-space-sm">
                  <span className="truncate">{item.name}</span>
                  <span className="tabular-nums text-muted-fg">{item.dialCode}</span>
                </span>
              </ListBoxItem>
            ))}
          </ListBox>
        )}
      </SelectPopover>
    </Select>
  )
}

export const PhoneCountrySelect = createInterfaceComponent<PhoneCountrySelectProps>(
  {
    name: 'PhoneCountrySelect',
    category: 'form',
    description: 'Country calling-code dropdown with search, flag, name, and dial code.',
    version: '1.0.0',
  },
  PhoneCountrySelectPrimitive
)

export interface PhoneFieldSlots {
  /** Accessible label. */
  label?: React.ComponentType<LabelProps>
  /** Help text under the control. */
  description?: React.ComponentType<DescriptionProps>
  /** Validation error message. */
  error?: React.ComponentType<FieldErrorProps>
  /** National-number input atom. */
  input?: React.ComponentType<PhoneInputProps>
  /** Country calling-code dropdown. */
  country?: React.ComponentType<PhoneCountrySelectProps>
}

export interface PhoneFieldProps {
  /** Accessible field label. */
  label?: React.ReactNode
  /** Auxiliary help text. */
  description?: React.ReactNode
  /** Override validation copy. */
  errorMessage?: React.ReactNode
  /** Controlled national number. */
  value?: string
  /** Uncontrolled initial national number. */
  defaultValue?: string
  /** Called when the national number changes. */
  onChange?: (value: string) => void
  /** Called with the E.164 number when the national number or country changes. */
  onE164Change?: (e164: string) => void
  /** Controlled ISO country code. */
  country?: string
  /** Uncontrolled initial ISO country code. */
  defaultCountry?: string
  /** Called when the selected country changes. */
  onCountryChange?: (iso: string) => void
  /** Country catalog. */
  countries?: PhoneCountry[]
  /** Placeholder for the national number. */
  placeholder?: string
  /** Minimum national-number digit count. */
  minLength?: number
  /** Maximum national-number digit count. */
  maxLength?: number
  /** Whether the control is disabled. */
  isDisabled?: boolean
  /** Whether a value is required. */
  isRequired?: boolean
  /** Additional classes on the field wrapper. */
  className?: string
  /** Optional composed children replacing the default anatomy. */
  children?: React.ReactNode
  /** Slot overrides. */
  slots?: SlotComponents<PhoneFieldSlots>
  /** Props forwarded to injected slots. */
  slotProps?: SlotPropsMap<PhoneFieldSlots>
}

const PhoneFieldPrimitive = ({
  label = 'Phone',
  description,
  errorMessage,
  value,
  defaultValue,
  onChange,
  onE164Change,
  country,
  defaultCountry = 'US',
  onCountryChange,
  countries = DEFAULT_PHONE_COUNTRIES,
  placeholder = '555 000 0000',
  minLength,
  maxLength,
  isDisabled,
  isRequired,
  className,
  children,
  slots = {},
  slotProps = {},
}: PhoneFieldProps) => {
  const field = usePhoneField({
    value,
    defaultValue,
    onChange,
    country,
    defaultCountry,
    onCountryChange,
    countries,
    minLength,
    maxLength,
  })

  React.useEffect(() => {
    onE164Change?.(field.helpers.e164)
  }, [field.helpers.e164, onE164Change])

  const countrySelect = renderSlot(
    slots.country,
    {
      selectedKey: field.state.country,
      onSelectionChange: field.actions.setCountry,
      countries,
      isDisabled,
      ...(slotProps.country ?? {}),
    },
    { defaultComponent: PhoneCountrySelect }
  )

  return (
    <div data-slot="phone-field" className={cn(fieldStyles(), className)}>
      {children ?? (
        <>
          {label && renderSlot(slots.label, { children: label, ...(slotProps.label ?? {}) }, { defaultComponent: Label })}
          {renderSlot(
            slots.input,
            {
            ...slotProps?.input,
              value: field.state.value,
              onChange: (event: React.ChangeEvent<HTMLInputElement>) => field.actions.setValue(event.target.value),
              placeholder,
              isDisabled,
              isInvalid: field.state.isInvalid,
              countryTrigger: countrySelect,
              'aria-invalid': field.ariaProps['aria-invalid'],
              ...(slotProps.input ?? {}),
            },
            { defaultComponent: PhoneInput }
          )}
          {description && !field.state.isInvalid &&
            renderSlot(slots.description, { children: description, ...(slotProps.description ?? {}) }, {
              defaultComponent: Description,
            })}
          {field.state.isInvalid &&
            renderSlot(
              slots.error,
              { children: errorMessage ?? field.helpers.message, ...(slotProps.error ?? {}) },
              { defaultComponent: FieldError }
            )}
          {isRequired && <span className="sr-only">Required</span>}
        </>
      )}
    </div>
  )
}

export const PhoneField = createInterfaceComponent<PhoneFieldProps, PhoneFieldSlots>(
  {
    name: 'PhoneField',
    category: 'form',
    description: 'Phone field with country flag/code dropdown and national-number validation.',
    version: '1.0.0',
    props: {
      defaultCountry: 'US',
    },
    slots: {
      label: Label,
      description: Description,
      error: FieldError,
      input: PhoneInput,
      country: PhoneCountrySelect,
    },
  },
  PhoneFieldPrimitive
)

PhoneField.Country = PhoneCountrySelect
PhoneField.Input = PhoneInput

Field.Phone = PhoneField

export type { PhoneCountry }
export { DEFAULT_PHONE_COUNTRIES, findPhoneCountry } from './countries'

export const { Context: PhoneFieldContext, useCompoundContext: usePhoneFieldContext } =
  createCompoundContext<any>('PhoneField')
