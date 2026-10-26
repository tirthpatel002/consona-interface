import { useState } from 'react'
import { useControllableState, type HeadlessHookReturn } from '../../../core/hooks'

export interface UseRatingOptions {
  /** Controlled score. */
  value?: number
  /** Uncontrolled initial score. */
  defaultValue?: number
  /** Called when the score changes. */
  onChange?: (value: number) => void
  /** Maximum score. */
  max?: number
  /** Step precision: 1 or 0.5. */
  precision?: 1 | 0.5
  /** Whether interaction is locked. */
  readOnly?: boolean
  /** Whether interaction is disabled. */
  disabled?: boolean
  /** Whether selecting the current score clears it to 0. */
  allowClear?: boolean
}

export interface RatingState {
  /** Current committed score. */
  value: number
  /** Score under the pointer, or null when not hovering. */
  hoverValue: number | null
  /** Score used for fill rendering (hover wins). */
  activeValue: number
  /** Maximum score on the scale. */
  max: number
}

export type RatingActions = {
  /** Set the committed score without clear-toggle semantics. */
  setValue: (value: number) => void
  /** Select a score, honoring allowClear / readOnly / disabled. */
  select: (value: number) => void
  /** Update hover preview, or clear it with null. */
  setHover: (value: number | null) => void
  /** Reset the committed score to 0. */
  clear: () => void
}

export interface RatingHelpers {
  /** Precision step used by keyboard increment. */
  step: number
  /** Whether pointer and keyboard input are enabled. */
  isInteractive: boolean
  /** Fill ratio (0–1) for the star at a 0-based index. */
  fillRatio: (index: number) => number
}

export interface RatingAriaProps {
  /** Slider role for the rating group. */
  role: 'slider'
  /** Minimum score. */
  'aria-valuemin': number
  /** Maximum score. */
  'aria-valuemax': number
  /** Current committed score. */
  'aria-valuenow': number
  /** Whether the rating is read-only. */
  'aria-readonly': boolean
  /** Whether the rating is disabled. */
  'aria-disabled': boolean
  /** Focus index; -1 when not interactive. */
  tabIndex: number
}

export type UseRatingReturn = HeadlessHookReturn<
  RatingState,
  RatingActions,
  RatingHelpers,
  RatingAriaProps
>

export function useRating(options: UseRatingOptions = {}): UseRatingReturn {
  const {
    max = 5,
    precision = 1,
    readOnly = false,
    disabled = false,
    allowClear = true,
  } = options

  const [value, setValue] = useControllableState<number>({
    prop: options.value,
    defaultProp: options.defaultValue ?? 0,
    onChange: options.onChange,
  })
  const [hoverValue, setHover] = useState<number | null>(null)
  const isInteractive = !readOnly && !disabled
  const activeValue = hoverValue !== null ? hoverValue : value

  const clamp = (next: number) => Math.min(Math.max(0, next), max)

  const select = (next: number) => {
    if (!isInteractive) return
    let finalValue = clamp(next)
    if (allowClear && finalValue === value) {
      finalValue = 0
    }
    setValue(finalValue)
  }

  return {
    state: { value, hoverValue, activeValue, max },
    actions: {
      setValue: (next) => setValue(clamp(next)),
      select,
      setHover,
      clear: () => setValue(0),
    },
    helpers: {
      step: precision,
      isInteractive,
      fillRatio: (index) => Math.max(0, Math.min(1, activeValue - index)),
    },
    ariaProps: {
      role: 'slider',
      'aria-valuemin': 0,
      'aria-valuemax': max,
      'aria-valuenow': value,
      'aria-readonly': readOnly,
      'aria-disabled': disabled,
      tabIndex: isInteractive ? 0 : -1,
    },
  }
}
