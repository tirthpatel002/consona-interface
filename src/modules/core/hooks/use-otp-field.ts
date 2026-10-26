import { useMemo } from 'react'
import { useControllableState, type HeadlessHookReturn } from '../../../core/hooks'

export type OtpStatus = 'idle' | 'incomplete' | 'correct' | 'incorrect'

export interface UseOtpFieldOptions {
  /** Controlled OTP value. */
  value?: string
  /** Uncontrolled initial OTP value. */
  defaultValue?: string
  /** Called when the OTP value changes. */
  onChange?: (value: string) => void
  /** Called when every slot is filled. */
  onComplete?: (value: string) => void
  /** Number of OTP characters. */
  length?: number
  /** When true, slots accept letters and digits; otherwise digits only. */
  alphanumeric?: boolean
  /** Expected code used for correct/incorrect feedback. */
  expected?: string
}

export interface OtpFieldState {
  /** Current OTP string. */
  value: string
  /** Configured slot count. */
  length: number
  /** Whether letters are allowed. */
  alphanumeric: boolean
  /** Derived correctness status. */
  status: OtpStatus
  /** Whether every slot is filled. */
  isComplete: boolean
}

export type OtpFieldActions = {
  /** Replace the OTP value, constrained to length and charset. */
  setValue: (value: string) => void
  /** Clear the OTP. */
  clear: () => void
}

export interface OtpFieldHelpers {
  /** Pattern string forwarded to the OTP input. */
  pattern: string
  /** Input mode hint. */
  inputMode: 'numeric' | 'text'
  /** Human-readable status copy. */
  message: string | null
}

export interface OtpFieldAriaProps {
  /** Autocomplete token. */
  autoComplete: 'one-time-code'
  /** Whether the OTP is incorrect. */
  'aria-invalid': boolean
}

export type UseOtpFieldReturn = HeadlessHookReturn<
  OtpFieldState,
  OtpFieldActions,
  OtpFieldHelpers,
  OtpFieldAriaProps
>

const DIGITS = /[^0-9]/g
const ALPHANUMERIC = /[^a-zA-Z0-9]/g

export function useOtpField(options: UseOtpFieldOptions = {}): UseOtpFieldReturn {
  const length = options.length ?? 6
  const alphanumeric = options.alphanumeric ?? false
  const [value, setRawValue] = useControllableState({
    prop: options.value,
    defaultProp: options.defaultValue ?? '',
    onChange: options.onChange,
  })

  const sanitize = (next: string) =>
    next.replace(alphanumeric ? ALPHANUMERIC : DIGITS, '').slice(0, length)

  const setValue = (next: string) => {
    const cleaned = sanitize(next)
    setRawValue(cleaned)
    if (cleaned.length === length) options.onComplete?.(cleaned)
  }

  const isComplete = value.length === length
  const status: OtpStatus = useMemo(() => {
    if (!isComplete) return value.length === 0 ? 'idle' : 'incomplete'
    if (!options.expected) return 'idle'
    return value.toLowerCase() === options.expected.toLowerCase() ? 'correct' : 'incorrect'
  }, [isComplete, options.expected, value])

  const message =
    status === 'correct' ? 'Code confirmed.' : status === 'incorrect' ? 'Incorrect code. Try again.' : null

  return {
    state: { value, length, alphanumeric, status, isComplete },
    actions: { setValue, clear: () => setRawValue('') },
    helpers: {
      pattern: alphanumeric ? '^[a-zA-Z0-9]+$' : '^\\d+$',
      inputMode: alphanumeric ? 'text' : 'numeric',
      message,
    },
    ariaProps: {
      autoComplete: 'one-time-code',
      'aria-invalid': status === 'incorrect',
    },
  }
}
