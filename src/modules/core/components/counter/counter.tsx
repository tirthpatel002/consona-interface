import React, { useState, useRef, useEffect, useId } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { MinusIcon, PlusIcon } from '@heroicons/react/20/solid'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { toast } from '../toast'

export type CounterSize =
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | '6xl'

export interface CounterProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  /** Numeric value or formatted string to display and animate. */
  value: number | string
  /** Size preset for typography scale. Default: 'md' */
  size?: CounterSize
  /** Custom font size in pixels (number) or arbitrary CSS string (e.g. 52, '3rem', '48px'). Overrides size preset. */
  fontSize?: number | string
  /** Custom spring stiffness for digit roll transition. Default: 600 */
  stiffness?: number
  /** Custom spring damping for digit roll transition. Default: 38 */
  damping?: number
  /** Custom spring mass for digit roll transition. Default: 0.3 */
  mass?: number
  /** Custom formatting function for numeric values. */
  format?: (value: number) => string
  /** Additional CSS class names. */
  className?: string
  /** Inline styles. */
  style?: React.CSSProperties
}

const COUNTER_SIZE_CLASSES: Record<CounterSize, string> = {
  xs: 'text-xs font-semibold',
  sm: 'text-sm font-semibold',
  md: 'text-base font-bold',
  lg: 'text-lg font-bold',
  xl: 'text-xl font-bold',
  '2xl': 'text-2xl font-extrabold',
  '3xl': 'text-3xl font-extrabold',
  '4xl': 'text-4xl font-extrabold',
  '5xl': 'text-5xl font-extrabold',
  '6xl': 'text-6xl font-extrabold',
}

const NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

interface DigitColumnProps {
  digit: string
  stiffness: number
  damping: number
  mass: number
}

const DigitColumn = ({
  digit,
  stiffness,
  damping,
  mass,
}: DigitColumnProps) => {
  const num = parseInt(digit, 10)

  if (isNaN(num)) {
    return (
      <motion.span
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.15 }}
        className="inline-flex items-center justify-center leading-none tabular-nums select-none"
      >
        {digit === ' ' ? '\u00A0' : digit}
      </motion.span>
    )
  }

  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.8, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 6 }}
      transition={{ duration: 0.15 }}
      className="relative inline-flex h-[1em] w-[0.6em] items-center justify-center overflow-hidden leading-none tabular-nums select-none"
    >
      <motion.span
        className="absolute top-0 left-0 flex w-full flex-col items-center leading-none select-none"
        animate={{ y: `-${num * 10}%` }}
        transition={{
          type: 'spring',
          stiffness,
          damping,
          mass,
        }}
      >
        {NUMBERS.map((n) => (
          <span
            key={n}
            className="flex h-[1em] w-full items-center justify-center leading-none select-none"
          >
            {n}
          </span>
        ))}
      </motion.span>
    </motion.span>
  )
}

const CounterPrimitive = ({
  value,
  size = 'md',
  fontSize,
  stiffness = 600,
  damping = 38,
  mass = 0.3,
  format,
  className,
  style,
  ...props
}: CounterProps) => {
  const formattedValue = React.useMemo(() => {
    if (typeof value === 'number' && format) {
      return format(value)
    }
    return String(value)
  }, [value, format])

  const chars = formattedValue.split('')
  const total = chars.length

  const resolvedStyle: React.CSSProperties = {
    ...style,
    ...(fontSize !== undefined
      ? { fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize }
      : {}),
  }

  return (
    <span
      className={cn(
        'inline-flex items-center tabular-nums leading-none tracking-tight select-none will-change-transform',
        COUNTER_SIZE_CLASSES[size],
        className
      )}
      style={resolvedStyle}
      {...props}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {chars.map((char, index) => {
          const positionFromRight = total - 1 - index
          return (
            <DigitColumn
              key={positionFromRight}
              digit={char}
              stiffness={stiffness}
              damping={damping}
              mass={mass}
            />
          )
        })}
      </AnimatePresence>
    </span>
  )
}

export const Counter = createInterfaceComponent<CounterProps>(
  {
    name: 'Counter',
    category: 'typography',
    description:
      'Continuous spring-animated rolling numerical ticker with fluid digit insertion, size presets, and custom font sizing.',
    version: '1.0.0',
  },
  CounterPrimitive
)

/* ==========================================================================
   CounterControl — Interactive Stepper with Editable Counter & Delta Presets
   ========================================================================== */

export type CounterControlSize = 'sm' | 'md' | 'lg' | 'xl'

export interface CounterControlProps
  extends Omit<React.ComponentProps<'div'>, 'onChange' | 'defaultValue' | 'prefix'> {
  /** Controlled numeric counter value. */
  value?: number
  /** Uncontrolled initial value. Default: 0 */
  defaultValue?: number
  /** Minimum allowed value. */
  min?: number
  /** Maximum allowed value. */
  max?: number
  /** Primary step delta for increment/decrement operations. Default: 1 */
  step?: number
  /** Selectable delta preset options (e.g. [1, 5, 10, 50, 100]). */
  deltaOptions?: number[]
  /** Default active delta if deltaOptions is provided. */
  defaultDelta?: number
  /** Size variant scaling buttons, padding, and counter typography. Default: 'md' */
  size?: CounterControlSize
  /** Custom font size for the center counter (in px or CSS string). */
  fontSize?: number | string
  /** Whether the control is disabled. */
  isDisabled?: boolean
  /** Alias for isDisabled. */
  disabled?: boolean
  /** Custom toast error message displayed when invalid non-numeric input is entered. */
  errorMessage?: string
  /** Optional prefix element (e.g. currency symbol or icon). */
  prefix?: React.ReactNode
  /** Slot component overrides. */
  slots?: SlotComponents<CounterControlSlots>
  /** Slot prop overrides. */
  slotProps?: SlotPropsMap<CounterControlSlots>
  /** Optional suffix element (e.g. unit label). */
  suffix?: React.ReactNode
  /** Callback fired on value change. */
  onChange?: (value: number) => void
  /** Visual presentation variant. Default: 'default' */
  variant?: 'default' | 'card' | 'outline' | 'subtle'
}

export interface CounterDeltaOptionProps {
  /** Delta amount this chip applies. */
  delta: number
  /** Whether this delta is the active step. */
  isSelected: boolean
  /** Whether the chip is non-interactive. */
  isDisabled?: boolean
  /** Chip classes for the active size ramp. */
  className?: string
  /** Select this delta. */
  onSelect?: () => void
}

function CounterDeltaOption({
  delta,
  isSelected,
  isDisabled,
  className,
  onSelect,
}: CounterDeltaOptionProps) {
  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onSelect}
      aria-pressed={isSelected}
      className={className}
    >
      ±{delta}
    </button>
  )
}

export interface CounterControlSlots {
  /** Swappable delta-preset chip. */
  option?: React.ComponentType<CounterDeltaOptionProps>
}

interface CounterControlSizeConfig {
  containerClass: string
  buttonSizeClass: string
  iconSizeClass: string
  counterSize: CounterSize
  deltaChipClass: string
}

const CONTROL_SIZE_CONFIGS: Record<CounterControlSize, CounterControlSizeConfig> = {
  sm: {
    containerClass: 'h-9 px-1.5 gap-1.5 rounded-base',
    buttonSizeClass: 'size-7 rounded-micro cursor-pointer',
    iconSizeClass: 'size-3.5',
    counterSize: 'sm',
    deltaChipClass: 'text-2xs px-2 py-0.5 rounded-micro cursor-pointer',
  },
  md: {
    containerClass: 'h-11 px-2 gap-2.5 rounded-base',
    buttonSizeClass: 'size-8 rounded-micro cursor-pointer',
    iconSizeClass: 'size-4',
    counterSize: 'lg',
    deltaChipClass: 'text-xs px-2.5 py-1 rounded-micro cursor-pointer',
  },
  lg: {
    containerClass: 'h-14 px-3 gap-3.5 rounded-macro',
    buttonSizeClass: 'size-10 rounded-base cursor-pointer',
    iconSizeClass: 'size-5',
    counterSize: '2xl',
    deltaChipClass: 'text-xs px-3 py-1 rounded-micro cursor-pointer',
  },
  xl: {
    containerClass: 'h-18 px-4 gap-5 rounded-macro',
    buttonSizeClass: 'size-12 rounded-base cursor-pointer',
    iconSizeClass: 'size-6',
    counterSize: '4xl',
    deltaChipClass: 'text-sm px-3.5 py-1.5 rounded-micro font-semibold cursor-pointer',
  },
}

const CounterControlPrimitive = ({
  value: controlledValue,
  defaultValue = 0,
  min,
  max,
  step = 1,
  deltaOptions,
  defaultDelta,
  size = 'md',
  fontSize,
  isDisabled = false,
  disabled = false,
  errorMessage = 'Only numbers are allowed',
  prefix,
  suffix,
  onChange,
  variant = 'default',
  className,
  slots,
  slotProps,
  ...props
}: CounterControlProps) => {
  const effectiveDisabled = isDisabled || disabled
  const [internalValue, setInternalValue] = useState<number>(defaultValue)
  const currentValue = controlledValue !== undefined ? controlledValue : internalValue

  const initialDelta = defaultDelta ?? deltaOptions?.[0] ?? step
  const [activeDelta, setActiveDelta] = useState<number>(initialDelta)

  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [draftInput, setDraftInput] = useState<string>(String(currentValue))
  const inputRef = useRef<HTMLInputElement>(null)

  const sizeConfig = CONTROL_SIZE_CONFIGS[size] ?? CONTROL_SIZE_CONFIGS.md

  // Sync draft input when external value changes
  useEffect(() => {
    if (!isEditing) {
      setDraftInput(String(currentValue))
    }
  }, [currentValue, isEditing])

  // Focus and select input on edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const commitValue = (val: number) => {
    let clamped = val
    if (min !== undefined) clamped = Math.max(min, clamped)
    if (max !== undefined) clamped = Math.min(max, clamped)

    if (controlledValue === undefined) {
      setInternalValue(clamped)
    }
    onChange?.(clamped)
  }

  const handleIncrement = () => {
    if (effectiveDisabled) return
    const nextVal = currentValue + activeDelta
    commitValue(nextVal)
  }

  const handleDecrement = () => {
    if (effectiveDisabled) return
    const nextVal = currentValue - activeDelta
    commitValue(nextVal)
  }

  const isMinReached = min !== undefined && currentValue <= min
  const isMaxReached = max !== undefined && currentValue >= max

  // Intercept keyboard entry for strict numeric validation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const parsed = parseFloat(draftInput)
      if (!isNaN(parsed)) {
        commitValue(parsed)
      } else {
        toast.error(errorMessage)
        setDraftInput(String(currentValue))
      }
      setIsEditing(false)
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      setDraftInput(String(currentValue))
      setIsEditing(false)
      return
    }

    // Navigation and editing control keys
    if (
      [
        'Backspace',
        'Delete',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Tab',
        'Home',
        'End',
      ].includes(e.key) ||
      e.ctrlKey ||
      e.metaKey
    ) {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        handleIncrement()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        handleDecrement()
      }
      return
    }

    // Allow negative sign if at first index and negative numbers are permitted
    if (e.key === '-' && (min === undefined || min < 0)) {
      if (!draftInput.includes('-') && inputRef.current?.selectionStart === 0) {
        return
      }
    }

    // Check if key is a numeric digit
    if (!/^\d$/.test(e.key)) {
      e.preventDefault()
      toast.error(errorMessage)
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').trim()
    const isAllowNegative = min === undefined || min < 0
    const regex = isAllowNegative ? /^-?\d+$/ : /^\d+$/

    if (!regex.test(pasted)) {
      e.preventDefault()
      toast.error(errorMessage)
    }
  }

  const handleBlur = () => {
    const parsed = parseFloat(draftInput)
    if (!isNaN(parsed)) {
      commitValue(parsed)
    } else {
      setDraftInput(String(currentValue))
    }
    setIsEditing(false)
  }

  const variantStyles = {
    default: 'bg-bg-surface border border-border shadow-xs',
    card: 'bg-bg-surface border border-border shadow-lg p-2.5',
    outline: 'bg-transparent border border-border',
    subtle: 'bg-bg-muted border border-border/40',
  }[variant]

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          'inline-flex items-center justify-between border select-none transition-colors',
          sizeConfig.containerClass,
          variantStyles,
          effectiveDisabled && 'opacity-60 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {/* Decrement (-) Button */}
        <button
          type="button"
          aria-label={`Decrease value by ${activeDelta}`}
          disabled={effectiveDisabled || isMinReached}
          onClick={handleDecrement}
          className={cn(
            'inline-flex items-center justify-center font-bold text-fg bg-transparent transition-all duration-150',
            'hover:bg-bg-muted active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary',
            'cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none disabled:hover:bg-transparent',
            sizeConfig.buttonSizeClass
          )}
        >
          <MinusIcon className={sizeConfig.iconSizeClass} />
        </button>

        {/* Center Editable Counter */}
        <div
          onClick={() => !effectiveDisabled && setIsEditing(true)}
          className="relative flex cursor-pointer items-center justify-center px-2 py-0.5 text-center transition-transform hover:scale-[1.02]"
          title="Click to type number"
        >
          {prefix && <span className="mr-1 text-muted-fg leading-none font-medium">{prefix}</span>}

          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={draftInput}
              size={Math.max(1, draftInput.length)}
              onChange={(e) => setDraftInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onBlur={handleBlur}
              className={cn(
                'inline-block m-0 p-0 border-none bg-transparent text-center font-extrabold text-fg outline-hidden rounded-atom tabular-nums leading-none cursor-text [field-sizing:content]',
                COUNTER_SIZE_CLASSES[sizeConfig.counterSize]
              )}
              style={{
                width: `${Math.max(1, draftInput.length) * 0.62}em`,
                maxWidth: '100%',
                ...(fontSize !== undefined
                  ? { fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize }
                  : {}),
              }}
            />
          ) : (
            <Counter
              value={currentValue}
              size={sizeConfig.counterSize}
              fontSize={fontSize}
              className="text-fg font-extrabold leading-none cursor-pointer"
            />
          )}

          {suffix && <span className="ml-1 text-muted-fg leading-none font-medium">{suffix}</span>}
        </div>

        {/* Increment (+) Button */}
        <button
          type="button"
          aria-label={`Increase value by ${activeDelta}`}
          disabled={effectiveDisabled || isMaxReached}
          onClick={handleIncrement}
          className={cn(
            'inline-flex items-center justify-center font-bold text-fg bg-transparent transition-all duration-150',
            'hover:bg-bg-muted active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary',
            'cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none disabled:hover:bg-transparent',
            sizeConfig.buttonSizeClass
          )}
        >
          <PlusIcon className={sizeConfig.iconSizeClass} />
        </button>
      </div>

      {/* Optional Delta Options Switcher */}
      {deltaOptions && deltaOptions.length > 1 && (
        <div className="inline-flex items-center gap-1 rounded-micro border border-border/80 bg-bg-muted/60 p-0.5 shadow-2xs">
          {deltaOptions.map((delta) => {
            const isSelected = activeDelta === delta
            return (
              <React.Fragment key={delta}>
                {renderSlot(
                  slots?.option,
                  {
                    delta,
                    isSelected,
                    isDisabled: effectiveDisabled,
                    className: cn(
                      'font-medium transition-all duration-150 leading-none select-none cursor-pointer disabled:cursor-not-allowed',
                      sizeConfig.deltaChipClass,
                      isSelected
                        ? 'bg-primary text-primary-fg shadow-xs font-semibold'
                        : 'text-muted-fg hover:text-fg hover:bg-bg-surface/80'
                    ),
                    onSelect: () => setActiveDelta(delta),
                    ...(slotProps?.option as object),
                  },
                  { defaultComponent: CounterDeltaOption }
                )}
              </React.Fragment>
            )
          })}
        </div>
      )}
    </div>
  )
}

export const CounterControl = createInterfaceComponent<CounterControlProps, CounterControlSlots>(
  {
    name: 'CounterControl',
    category: 'form',
    description:
      'Interactive stepper control featuring an animated editable central counter, decrement/increment action buttons, and selectable delta options.',
    version: '1.0.0',
    slots: {
      option: CounterDeltaOption,
    },
  },
  CounterControlPrimitive
)

// Namespace attachments
Counter.Control = CounterControl
