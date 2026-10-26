import { useMemo } from 'react'
import { useControllableState, type HeadlessHookReturn } from '../../../core/hooks'
import type { PhoneCountry } from '../components/phone-field/countries'
import { DEFAULT_PHONE_COUNTRIES, findPhoneCountry } from '../components/phone-field/countries'

export interface UsePhoneFieldOptions {
  /** Controlled national number (no country calling code). */
  value?: string
  /** Uncontrolled initial national number. */
  defaultValue?: string
  /** Called when the national number changes. */
  onChange?: (value: string) => void
  /** Controlled ISO 3166-1 alpha-2 country code. */
  country?: string
  /** Uncontrolled initial country ISO code. */
  defaultCountry?: string
  /** Called when the selected country changes. */
  onCountryChange?: (iso: string) => void
  /** Country catalog used for lookup and validation. */
  countries?: PhoneCountry[]
  /** Minimum national-number digit count. */
  minLength?: number
  /** Maximum national-number digit count. */
  maxLength?: number
}

export interface PhoneFieldState {
  /** National number digits (formatting characters stripped). */
  value: string
  /** Selected country ISO code. */
  country: string
  /** Resolved country record. */
  selected: PhoneCountry | undefined
  /** Whether the current number fails validation. */
  isInvalid: boolean
}

export type PhoneFieldActions = {
  /** Replace the national number, stripping non-digits. */
  setValue: (value: string) => void
  /** Select a country by ISO code. */
  setCountry: (iso: string) => void
}

export interface PhoneFieldHelpers {
  /** E.164-style full number including calling code. */
  e164: string
  /** Display string with calling code prefix. */
  formatted: string
  /** Human-readable validation message. */
  message: string | null
}

export interface PhoneFieldAriaProps {
  /** Telephone input type. */
  type: 'tel'
  /** Numeric keypad hint. */
  inputMode: 'tel'
  /** Autocomplete token. */
  autoComplete: 'tel-national'
  /** Whether the number is invalid. */
  'aria-invalid': boolean
}

export type UsePhoneFieldReturn = HeadlessHookReturn<
  PhoneFieldState,
  PhoneFieldActions,
  PhoneFieldHelpers,
  PhoneFieldAriaProps
>

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

export function usePhoneField(options: UsePhoneFieldOptions = {}): UsePhoneFieldReturn {
  const countries = options.countries ?? DEFAULT_PHONE_COUNTRIES
  const minLength = options.minLength ?? 4
  const maxLength = options.maxLength ?? 15
  const [value, setRawValue] = useControllableState({
    prop: options.value,
    defaultProp: options.defaultValue ?? '',
    onChange: options.onChange,
  })
  const [country, setCountry] = useControllableState({
    prop: options.country,
    defaultProp: options.defaultCountry ?? 'US',
    onChange: options.onCountryChange,
  })

  const selected = findPhoneCountry(country, countries)
  const national = digitsOnly(value)
  const isInvalid = national.length > 0 && (national.length < minLength || national.length > maxLength)

  const e164 = useMemo(() => {
    if (!selected || !national) return ''
    return `${selected.dialCode}${national}`
  }, [national, selected])

  const message = isInvalid
    ? `Enter a ${minLength}–${maxLength} digit phone number.`
    : null

  return {
    state: {
      value: national,
      country,
      selected,
      isInvalid,
    },
    actions: {
      setValue: (next) => setRawValue(digitsOnly(next).slice(0, maxLength)),
      setCountry,
    },
    helpers: {
      e164,
      formatted: selected && national ? `${selected.dialCode} ${national}` : national,
      message,
    },
    ariaProps: {
      type: 'tel',
      inputMode: 'tel',
      autoComplete: 'tel-national',
      'aria-invalid': isInvalid,
    },
  }
}
