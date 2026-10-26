import React, { useCallback } from 'react'
import { useRating } from '../../hooks/use-rating'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'

/* ==========================================================================
   Rating Styles & Ramps
   ========================================================================== */

export const ratingStyles = tv({
  base: [
    'inline-flex items-center gap-space-sm select-none outline-none rounded-base p-space-2xs',
    'focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
  ],
  variants: {
    size: {
      sm: 'text-xs *:data-[slot=rating-icon]:size-4',
      md: 'text-sm *:data-[slot=rating-icon]:size-5',
      lg: 'text-base *:data-[slot=rating-icon]:size-6',
      xl: 'text-lg *:data-[slot=rating-icon]:size-8',
    },
    disabled: {
      true: 'opacity-40 pointer-events-none cursor-not-allowed',
      false: '',
    },
    readOnly: {
      true: 'cursor-default',
      false: '',
    },
  },
  defaultVariants: {
    size: 'md',
    disabled: false,
    readOnly: false,
  },
})

const sizeIconMap = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
  xl: 'size-8',
}

/* ==========================================================================
   Rating Slots & State Definitions
   ========================================================================== */

export interface RatingIconSlotProps {
  /** Whether the rating item is filled */
  isFilled: boolean
  /** Fill ratio between 0 and 1 */
  ratio: number
  [key: string]: any
}

export interface RatingSlots {
  /** Custom item icon renderer or component */
  icon?: React.ComponentType<RatingIconSlotProps> | ((filled: boolean, ratio: number) => React.ReactNode)
}

/* ==========================================================================
   Rating Root Primitive & Factory
   ========================================================================== */

export interface RatingProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'>,
    VariantProps<typeof ratingStyles> {
  /** Current controlled numeric rating score. */
  value?: number
  /** Default uncontrolled initial rating score. */
  defaultValue?: number
  /** Handler called when rating score changes. */
  onChange?: (value: number) => void
  /** Total maximum number of score stars/items. */
  max?: number
  /** Scoring step precision: 1 for whole stars, 0.5 for half-star precision. */
  precision?: 1 | 0.5
  /** Whether the rating is read-only and uneditable. */
  readOnly?: boolean
  /** Whether interaction is disabled. */
  disabled?: boolean
  /** Whether clicking the active score resets it to zero. */
  allowClear?: boolean
  /** Size token scaling the rating icons: 'sm', 'md', 'lg', 'xl'. */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Custom icon rendering function. */
  icon?: (filled: boolean, ratio?: number) => React.ReactNode
  /** Tooltip labels corresponding to each rating step (e.g. ['Poor', 'Fair', 'Good', ...]). */
  tooltips?: string[]
  /** Whether to render the numerical score text next to the stars. */
  showValue?: boolean
  /** Custom highlight color for filled stars (e.g. 'text-amber-500', 'text-yellow-400'). */
  highlightColor?: string
  /** Custom CSS classes for the rating container. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<RatingSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<RatingSlots>
}

const RatingPrimitive = ({
  value: controlledValue,
  defaultValue = 0,
  onChange,
  max = 5,
  precision = 1,
  readOnly = false,
  disabled = false,
  allowClear = true,
  size = 'md',
  icon,
  tooltips,
  showValue = false,
  highlightColor,
  className,
  slots = {},
  slotProps = {},
  ...props
}: RatingProps) => {
  const {
    state: { value: currentValue, hoverValue, activeValue },
    actions: { select: handleSelect, setHover: setHoverValue, setValue },
    helpers,
    ariaProps,
  } = useRating({
    value: controlledValue,
    defaultValue,
    onChange,
    max,
    precision,
    readOnly,
    disabled,
    allowClear,
  })

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!helpers.isInteractive) return
      const step = helpers.step

      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault()
        setValue(Math.min(max, currentValue + step))
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault()
        setValue(Math.max(0, currentValue - step))
      } else if (e.key === 'Home') {
        e.preventDefault()
        setValue(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        setValue(max)
      }
    },
    [helpers.isInteractive, helpers.step, currentValue, max, setValue]
  )

  const iconSizeClass = sizeIconMap[size] || 'size-5'
  const currentTooltip =
    tooltips && activeValue > 0 ? tooltips[Math.ceil(activeValue) - 1] : undefined

  return (
    <div
      aria-label="Rating"
      aria-valuetext={currentTooltip || `${currentValue} out of ${max} stars`}
      onKeyDown={handleKeyDown}
      onMouseLeave={() => setHoverValue(null)}
      className={cn(ratingStyles({ size, disabled, readOnly }), className)}
      {...ariaProps}
      {...props}
    >
      <div className="flex items-center gap-space-xs">
        {Array.from({ length: max }, (_, index) => {
          const itemIndex = index + 1
          const fillRatio = helpers.fillRatio(index)
          const isFullyFilled = fillRatio >= 1
          const isPartiallyFilled = fillRatio > 0 && fillRatio < 1

          return (
            <div
              key={index}
              className={cn(
                'relative flex items-center justify-center transition-transform',
                !readOnly && !disabled && 'cursor-pointer hover:scale-115 active:scale-95'
              )}
              onMouseMove={(e) => {
                if (readOnly || disabled) return
                if (precision === 0.5) {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const isLeftHalf = e.clientX - rect.left < rect.width / 2
                  setHoverValue(isLeftHalf ? index + 0.5 : index + 1)
                } else {
                  setHoverValue(itemIndex)
                }
              }}
              onClick={() => {
                if (readOnly || disabled) return
                if (precision === 0.5 && hoverValue !== null) {
                  handleSelect(hoverValue)
                } else {
                  handleSelect(itemIndex)
                }
              }}
            >
              {icon ? (
                icon(isFullyFilled, fillRatio)
              ) : slots.icon ? (
                slots.icon(isFullyFilled, fillRatio)
              ) : (
                <div data-slot="rating-icon" className={cn('relative', iconSizeClass)}>
                  {/* Empty star outline */}
                  <StarOutlineIcon
                    className="size-full text-muted-fg/40 transition-colors"
                    aria-hidden="true"
                  />

                  {/* Filled star / fractional overlay */}
                  {(isFullyFilled || isPartiallyFilled) && (
                    <div
                      className={cn(
                        'absolute inset-0 overflow-hidden transition-all duration-100',
                        highlightColor || 'text-amber-500 dark:text-amber-400'
                      )}
                      style={{ width: `${fillRatio * 100}%` }}
                    >
                      <StarSolidIcon className={cn('size-full shrink-0', iconSizeClass)} aria-hidden="true" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showValue && (
        <span className="font-mono text-xs font-semibold text-fg select-none">
          {currentValue.toFixed(precision === 0.5 ? 1 : 0)}
          <span className="text-muted-fg font-normal"> / {max}</span>
        </span>
      )}

      {currentTooltip && (
        <span className="text-xs font-medium text-muted-fg select-none ps-0.5">
          {currentTooltip}
        </span>
      )}
    </div>
  )
}

export const Rating = createInterfaceComponent<RatingProps, RatingSlots>(
  {
    name: 'Rating',
    category: 'form',
    description: 'Interactive star rating input with fractional precision, keyboard navigation, and readonly review support.',
    version: '1.0.0',
    props: {
      max: 5,
      precision: 1,
      size: 'md',
      showValue: false,
    },
    slots: {
      icon: undefined,
    },
  },
  RatingPrimitive
)

export const StarRating = Rating
