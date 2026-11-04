import { useMemo } from 'react'
import { useControllableState, type HeadlessHookReturn } from '../../../core/hooks'

export type PasswordStrengthLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong'

export interface PasswordRequirement {
  /** Stable requirement id. */
  id: 'length' | 'lowercase' | 'uppercase' | 'number' | 'symbol'
  /** Human-readable rule copy. */
  label: string
  /** Whether the current password satisfies the rule. */
  met: boolean
}

export interface UsePasswordFieldOptions {
  /** Controlled password value. */
  value?: string
  /** Uncontrolled initial password. */
  defaultValue?: string
  /** Called when the password changes. */
  onChange?: (value: string) => void
  /** Controlled reveal state. */
  isRevealed?: boolean
  /** Uncontrolled initial reveal state. */
  defaultRevealed?: boolean
  /** Called when hide/show toggles. */
  onRevealChange?: (revealed: boolean) => void
  /** Minimum character count for the length rule. */
  minLength?: number
}

export interface PasswordFieldState {
  /** Current password value. */
  value: string
  /** Whether the password is shown in plaintext. */
  isRevealed: boolean
  /** Discrete strength band. */
  level: PasswordStrengthLevel
  /** Strength score from 0–4. */
  score: number
  /** Individual rule results. */
  requirements: PasswordRequirement[]
}

export type PasswordFieldActions = {
  /** Replace the password value. */
  setValue: (value: string) => void
  /** Set reveal state. */
  setRevealed: (revealed: boolean) => void
  /** Toggle hide/show. */
  toggleRevealed: () => void
  /** Fill the field with a generated password and reveal it. */
  useSuggested: (password?: string) => void
}

export interface PasswordFieldHelpers {
  /** True when every requirement is met. */
  isStrong: boolean
  /** True when the password fails local validation. */
  isInvalid: boolean
  /** Strength label for status copy. */
  label: string
  /** Generate a new password candidate. */
  generate: (length?: number) => string
}

export interface PasswordFieldAriaProps {
  /** Native input type reflecting reveal state. */
  type: 'password' | 'text'
  /** Autocomplete token. */
  autoComplete: 'new-password'
  /** Whether the password currently fails validation. */
  'aria-invalid': boolean
}

export type UsePasswordFieldReturn = HeadlessHookReturn<
  PasswordFieldState,
  PasswordFieldActions,
  PasswordFieldHelpers,
  PasswordFieldAriaProps
>

const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGITS = '0123456789'
const SYMBOLS = '!@#$%^&*_-+=?'

function randomIndex(max: number): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bucket = new Uint32Array(1)
    crypto.getRandomValues(bucket)
    return (bucket[0] ?? 0) % max
  }
  return Math.floor(Math.random() * max)
}

function pick(set: string): string {
  return set.charAt(randomIndex(set.length))
}

export function generatePassword(length = 16): string {
  const size = Math.max(length, 8)
  const chars: string[] = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SYMBOLS)]
  const pool = LOWER + UPPER + DIGITS + SYMBOLS
  while (chars.length < size) chars.push(pick(pool))
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1)
    const current = chars[i] ?? ''
    chars[i] = chars[j] ?? ''
    chars[j] = current
  }
  return chars.join('')
}

export function scorePassword(value: string, minLength = 8): {
  score: number
  level: PasswordStrengthLevel
  requirements: PasswordRequirement[]
} {
  const requirements: PasswordRequirement[] = [
    { id: 'length', label: `At least ${minLength} characters`, met: value.length >= minLength },
    { id: 'lowercase', label: 'One lowercase letter', met: /[a-z]/.test(value) },
    { id: 'uppercase', label: 'One uppercase letter', met: /[A-Z]/.test(value) },
    { id: 'number', label: 'One number', met: /\d/.test(value) },
    { id: 'symbol', label: 'One symbol', met: /[^A-Za-z0-9]/.test(value) },
  ]

  if (!value) {
    return { score: 0, level: 'empty', requirements }
  }

  const met = requirements.filter((item) => item.met).length
  const lengthRule = requirements[0]
  const score = Math.max(1, Math.min(4, met - (lengthRule?.met ? 0 : 1)))
  const level: PasswordStrengthLevel =
    met <= 2 ? 'weak' : met === 3 ? 'fair' : met === 4 ? 'good' : 'strong'

  return { score, level, requirements }
}

export function usePasswordField(options: UsePasswordFieldOptions = {}): UsePasswordFieldReturn {
  const minLength = options.minLength ?? 8
  const [value, setValue] = useControllableState({
    prop: options.value,
    defaultProp: options.defaultValue ?? '',
    onChange: options.onChange,
  })
  const [isRevealed, setRevealed] = useControllableState({
    prop: options.isRevealed,
    defaultProp: options.defaultRevealed ?? false,
    onChange: options.onRevealChange,
  })

  const { score, level, requirements } = useMemo(
    () => scorePassword(value, minLength),
    [minLength, value]
  )

  const isStrong = requirements.every((item) => item.met)
  const isInvalid = value.length > 0 && !isStrong
  const label =
    level === 'empty'
      ? 'Enter a password'
      : level === 'weak'
        ? 'Weak password'
        : level === 'fair'
          ? 'Fair password'
          : level === 'good'
            ? 'Good password'
            : 'Strong password'

  return {
    state: { value, isRevealed, level, score, requirements },
    actions: {
      setValue,
      setRevealed,
      toggleRevealed: () => setRevealed(!isRevealed),
      useSuggested: (password) => {
        const next = password ?? generatePassword()
        setValue(next)
        setRevealed(true)
      },
    },
    helpers: {
      isStrong,
      isInvalid,
      label,
      generate: generatePassword,
    },
    ariaProps: {
      type: isRevealed ? 'text' : 'password',
      autoComplete: 'new-password',
      'aria-invalid': isInvalid,
    },
  }
}
