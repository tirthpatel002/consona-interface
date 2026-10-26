import { useEffect, useMemo, useRef, useState } from 'react'
import { useControllableState, type HeadlessHookReturn } from '../../../core/hooks'

const USERNAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9._-]{2,29}$/

export type UsernameValidity = 'idle' | 'invalid' | 'valid'
export type UsernameAvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export interface UsernameAvailability {
  /** Availability outcome for the current username. */
  status: UsernameAvailabilityStatus
  /** Alternate handles suggested when the name is taken. */
  suggestions?: string[]
}

export interface UseUsernameFieldOptions {
  /** Controlled handle value (without a leading @). */
  value?: string
  /** Uncontrolled initial handle. */
  defaultValue?: string
  /** Called when the handle changes. */
  onChange?: (value: string) => void
  /** When to run local format validation. */
  validateOn?: 'change' | 'blur'
  /** Async or sync username availability checker. */
  checkAvailability?: (value: string) => UsernameAvailability | Promise<UsernameAvailability>
  /** Debounce window in milliseconds for availability checks. */
  availabilityDelay?: number
  /** Override the default username format pattern. */
  pattern?: RegExp | string
}

export interface UsernameFieldState {
  /** Current handle value. */
  value: string
  /** Local format validity. */
  validity: UsernameValidity
  /** Username availability payload. */
  availability: UsernameAvailability
  /** Whether the composed field should expose an invalid state. */
  isInvalid: boolean
}

export type UsernameFieldActions = {
  /** Replace the current handle. */
  setValue: (value: string) => void
  /** Mark the field as blurred so blur-mode validation runs. */
  blur: () => void
}

export interface UsernameFieldHelpers {
  /** True when the current value matches username format rules. */
  isFormatValid: boolean
  /** Handle with a leading @ for display. */
  handle: string
  /** Human-readable validation message, or null when valid/idle. */
  message: string | null
}

export interface UsernameFieldAriaProps {
  /** Handle input type. */
  type: 'text'
  /** Autocomplete token. */
  autoComplete: 'username'
  /** Whether the field is currently invalid. */
  'aria-invalid': boolean
}

export type UseUsernameFieldReturn = HeadlessHookReturn<
  UsernameFieldState,
  UsernameFieldActions,
  UsernameFieldHelpers,
  UsernameFieldAriaProps
>

export function isValidUsername(value: string, pattern?: RegExp | string): boolean {
  const source = pattern instanceof RegExp ? pattern : pattern ? new RegExp(pattern) : USERNAME_PATTERN
  return source.test(value.trim())
}

export function suggestUsernames(base: string, count = 3): string[] {
  const stem = base.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) || 'user'
  return Array.from({ length: count }, (_, index) => `${stem}${index + 12}${Math.floor(Math.random() * 90 + 10)}`)
}

export function useUsernameField(options: UseUsernameFieldOptions = {}): UseUsernameFieldReturn {
  const { validateOn = 'change', checkAvailability, availabilityDelay = 400, pattern } = options

  const [value, setRawValue] = useControllableState({
    prop: options.value,
    defaultProp: options.defaultValue ?? '',
    onChange: options.onChange,
  })
  const [blurred, setBlurred] = useState(false)
  const [availability, setAvailability] = useState<UsernameAvailability>({ status: 'idle' })
  const requestId = useRef(0)

  const setValue = (next: string) => setRawValue(next.replace(/^@+/, ''))

  const shouldValidate = validateOn === 'change' ? value.length > 0 : blurred
  const isFormatValid = useMemo(() => {
    if (!shouldValidate || value.length === 0) return true
    return isValidUsername(value, pattern)
  }, [pattern, shouldValidate, value])

  const validity: UsernameValidity = !shouldValidate || value.length === 0 ? 'idle' : isFormatValid ? 'valid' : 'invalid'

  useEffect(() => {
    if (!checkAvailability) {
      setAvailability({ status: 'idle' })
      return
    }
    if (!isValidUsername(value, pattern)) {
      setAvailability({ status: value.length === 0 ? 'idle' : 'invalid' })
      return
    }

    const id = ++requestId.current
    setAvailability({ status: 'checking' })
    const timer = window.setTimeout(() => {
      Promise.resolve(checkAvailability(value)).then((result) => {
        if (requestId.current !== id) return
        setAvailability(result)
      })
    }, availabilityDelay)

    return () => window.clearTimeout(timer)
  }, [availabilityDelay, checkAvailability, pattern, value])

  const isInvalid =
    validity === 'invalid' || availability.status === 'taken' || availability.status === 'invalid'

  let message: string | null = null
  if (validity === 'invalid') {
    message = 'Usernames must start with a letter and be 3–30 characters.'
  } else if (availability.status === 'taken') {
    message = 'That username is taken.'
  } else if (availability.status === 'available') {
    message = 'Username is available.'
  }

  return {
    state: { value, validity, availability, isInvalid },
    actions: { setValue, blur: () => setBlurred(true) },
    helpers: {
      isFormatValid,
      handle: value ? `@${value}` : '',
      message,
    },
    ariaProps: {
      type: 'text',
      autoComplete: 'username',
      'aria-invalid': isInvalid,
    },
  }
}
