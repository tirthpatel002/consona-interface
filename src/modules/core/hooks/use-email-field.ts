import { useMemo, useState } from 'react'
import { useControllableState, type HeadlessHookReturn } from '../../../core/hooks'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type EmailValidity = 'idle' | 'invalid' | 'valid'

export interface UseEmailFieldOptions {
  /** Controlled value. */
  value?: string
  /** Uncontrolled initial value. */
  defaultValue?: string
  /** Called when the value changes. */
  onChange?: (value: string) => void
  /** When to run local format validation. */
  validateOn?: 'change' | 'blur'
  /** Override the default email format pattern. */
  pattern?: RegExp | string
  /** Restrict accepted domains, e.g. `['company.com', '.edu']`. */
  allowedDomains?: string[]
  /** Reject these domains, e.g. `['mailinator.com', '.xyz']`. */
  blockedDomains?: string[]
}

export interface EmailFieldState {
  /** Current input value. */
  value: string
  /** Local format validity. */
  validity: EmailValidity
  /** Whether the composed field should expose an invalid state. */
  isInvalid: boolean
}

export type EmailFieldActions = {
  /** Replace the current value. */
  setValue: (value: string) => void
  /** Mark the field as blurred so blur-mode validation runs. */
  blur: () => void
}

export interface EmailFieldHelpers {
  /** True when the current value matches email format rules. */
  isFormatValid: boolean
  /** True when the domain is in `allowedDomains` (or no allowlist is set). */
  isDomainAllowed: boolean
  /** True when the domain is not in `blockedDomains` (or no denylist is set). */
  isDomainUnblocked: boolean
  /** Human-readable validation message, or null when valid/idle. */
  message: string | null
}

export interface EmailFieldAriaProps {
  /** Email input type. */
  type: 'email'
  /** Autocomplete token. */
  autoComplete: 'email'
  /** Whether the field is currently invalid. */
  'aria-invalid': boolean
}

export type UseEmailFieldReturn = HeadlessHookReturn<
  EmailFieldState,
  EmailFieldActions,
  EmailFieldHelpers,
  EmailFieldAriaProps
>

export function toRegExp(pattern?: RegExp | string): RegExp | undefined {
  if (!pattern) return undefined
  return pattern instanceof RegExp ? pattern : new RegExp(pattern)
}

export function isValidEmail(value: string, pattern?: RegExp | string): boolean {
  return (toRegExp(pattern) ?? EMAIL_PATTERN).test(value.trim())
}

export function emailDomain(value: string): string {
  const at = value.trim().lastIndexOf('@')
  if (at < 0) return ''
  return value.trim().slice(at + 1).toLowerCase()
}

export function matchEmailDomain(value: string, rules?: string[]): boolean {
  if (!rules || rules.length === 0) return false
  const domain = emailDomain(value)
  if (!domain) return false
  return rules.some((rule) => {
    const normalized = rule.trim().replace(/^@/, '').toLowerCase()
    if (!normalized) return false
    if (normalized.startsWith('.')) {
      return domain.endsWith(normalized) || domain === normalized.slice(1)
    }
    return domain === normalized || domain.endsWith(`.${normalized}`)
  })
}

export function isAllowedEmailDomain(value: string, allowedDomains?: string[]): boolean {
  if (!allowedDomains || allowedDomains.length === 0) return true
  return matchEmailDomain(value, allowedDomains)
}

export function isBlockedEmailDomain(value: string, blockedDomains?: string[]): boolean {
  if (!blockedDomains || blockedDomains.length === 0) return false
  return matchEmailDomain(value, blockedDomains)
}

export function useEmailField(options: UseEmailFieldOptions = {}): UseEmailFieldReturn {
  const { validateOn = 'change', pattern, allowedDomains, blockedDomains } = options

  const [value, setValue] = useControllableState({
    prop: options.value,
    defaultProp: options.defaultValue ?? '',
    onChange: options.onChange,
  })
  const [blurred, setBlurred] = useState(false)

  const shouldValidate = validateOn === 'change' ? value.length > 0 : blurred
  const isFormatValid = useMemo(() => {
    if (!shouldValidate || value.length === 0) return true
    return isValidEmail(value, pattern)
  }, [pattern, shouldValidate, value])

  const isDomainAllowed = useMemo(() => {
    if (!shouldValidate || value.length === 0 || !isFormatValid) return true
    return isAllowedEmailDomain(value, allowedDomains)
  }, [allowedDomains, isFormatValid, shouldValidate, value])

  const isDomainUnblocked = useMemo(() => {
    if (!shouldValidate || value.length === 0 || !isFormatValid) return true
    return !isBlockedEmailDomain(value, blockedDomains)
  }, [blockedDomains, isFormatValid, shouldValidate, value])

  const validity: EmailValidity =
    !shouldValidate || value.length === 0
      ? 'idle'
      : isFormatValid && isDomainAllowed && isDomainUnblocked
        ? 'valid'
        : 'invalid'
  const isInvalid = validity === 'invalid'

  let message: string | null = null
  if (isInvalid && !isFormatValid) {
    message = 'Enter a valid email address.'
  } else if (isInvalid && !isDomainAllowed) {
    const list = (allowedDomains ?? []).join(', ')
    message = list ? `Use an email from: ${list}` : 'That email domain is not allowed.'
  } else if (isInvalid && !isDomainUnblocked) {
    const list = (blockedDomains ?? []).join(', ')
    message = list ? `That domain is blocked: ${list}` : 'That email domain is blocked.'
  }

  return {
    state: { value, validity, isInvalid },
    actions: {
      setValue,
      blur: () => setBlurred(true),
    },
    helpers: { isFormatValid, isDomainAllowed, isDomainUnblocked, message },
    ariaProps: {
      type: 'email',
      autoComplete: 'email',
      'aria-invalid': isInvalid,
    },
  }
}
