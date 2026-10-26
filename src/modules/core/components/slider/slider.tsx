import React, { useEffect, useMemo, useRef, useState, type ComponentProps } from 'react'
import { motion } from 'motion/react'
import {
  Slider as PrimitiveSlider,
  SliderFill as PrimitiveSliderFill,
  type SliderFillProps as RACSliderFillProps,
  SliderOutput as PrimitiveSliderOutput,
  SliderThumb as PrimitiveSliderThumb,
  SliderTrack as PrimitiveSliderTrack,
} from 'react-aria-components/Slider'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'

/* ==========================================================================
   Slider Sub-Atoms
   ========================================================================== */

export interface SliderGroupProps extends React.ComponentProps<'div'> {
  /** Custom CSS classes for the horizontal slider group container. */
  className?: string
}

const SliderGroupPrimitive = ({ className, ...props }: SliderGroupProps) => {
  return (
    <div
      className={cn('flex items-center gap-x-space-md *:data-[slot=icon]:size-5', className)}
      {...props}
    />
  )
}

export const SliderGroup = createInterfaceComponent<SliderGroupProps>(
  {
    name: 'SliderGroup',
    category: 'form',
    description: 'Horizontal group container for slider controls, icons, and readout badges.',
    version: '1.0.0',
  },
  SliderGroupPrimitive
)

export interface SliderOutputProps extends ComponentProps<typeof PrimitiveSliderOutput> {
  /** Custom CSS classes for the formatted numerical output readout. */
  className?: string
}

const SliderOutputPrimitive = ({
  className,
  ...props
}: SliderOutputProps) => {
  return (
    <PrimitiveSliderOutput
      className={cn('font-medium text-sm text-fg', className)}
      {...props}
    />
  )
}

export const SliderOutput = createInterfaceComponent<SliderOutputProps>(
  {
    name: 'SliderOutput',
    category: 'form',
    description: 'Formatted numerical or custom textual output value for slider component.',
    version: '1.0.0',
  },
  SliderOutputPrimitive
)

export type SliderThumbShape = 'pill' | 'circle'

export interface SliderThumbProps extends ComponentProps<typeof PrimitiveSliderThumb> {
  /** Custom CSS classes for the draggable slider thumb grip. */
  className?: string
  /** Thumb geometry. Pill is a capsule; circle is a round knob. */
  thumb?: SliderThumbShape
}

const THUMB_SHAPE_CLASS: Record<SliderThumbShape, string> = {
  circle: 'size-5 rounded-full',
  pill: 'h-5 w-8 rounded-full group-orientation-vertical:h-8 group-orientation-vertical:w-5',
}

export interface SliderSlots {
  /** Injected slider track container. */
  track?: React.ComponentType<SliderTrackProps>
  /** Injected draggable thumb grip. */
  thumb?: React.ComponentType<SliderThumbProps>
  /** Injected active colored fill bar. */
  fill?: React.ComponentType<SliderFillProps>
  /** Injected numerical output readout. */
  output?: React.ComponentType<SliderOutputProps>
}

export interface SliderContextValue {
  /** Injected slots configuration */
  slots?: SlotComponents<SliderSlots>
  /** Injected slot props overrides */
  slotProps?: SlotPropsMap<SliderSlots>
  /** Thumb geometry shared by every thumb in this slider. */
  thumb?: SliderThumbShape
}

export const {
  Provider: SliderProvider,
  useCompoundContext: useSliderContext,
  useOptionalCompoundContext: useSliderContextOptional,
} = createCompoundContext<SliderContextValue>('Slider')

const SliderThumbPrimitive = ({ className, thumb, index, ...props }: SliderThumbProps) => {
  const inherited = useSliderContextOptional()?.thumb
  const shape = thumb ?? inherited ?? 'circle'

  return (
    <PrimitiveSliderThumb
      index={index}
      data-slot="slider-thumb"
      data-index={index ?? 0}
      data-thumb={shape}
      className={cn(
        'top-[50%] left-[50%] bg-bg border-2 border-primary outline-hidden shadow-xs ring-2 ring-primary/20 transition-transform hover:scale-110 focus-visible:scale-110 focus-visible:ring-4',
        THUMB_SHAPE_CLASS[shape],
        className
      )}
      {...props}
    />
  )
}

export const SliderThumb = createInterfaceComponent<SliderThumbProps>(
  {
    name: 'SliderThumb',
    category: 'form',
    description: 'Interactive draggable thumb grip. Use thumb="pill" or thumb="circle".',
    version: '1.0.0',
  },
  SliderThumbPrimitive
)

export interface SliderFillProps extends RACSliderFillProps {
  /** Custom CSS classes for the active colored slider track fill. */
  className?: string
}

const SliderFillPrimitive = ({ className, ...props }: SliderFillProps) => {
  return (
    <PrimitiveSliderFill
      data-slot="slider-fill"
      className={cn('pointer-events-none rounded-full bg-primary disabled:opacity-60', className)}
      {...props}
    />
  )
}

export const SliderFill = createInterfaceComponent<SliderFillProps>(
  {
    name: 'SliderFill',
    category: 'form',
    description: 'Colored active track segment filling up to the current slider thumb value.',
    version: '1.0.0',
  },
  SliderFillPrimitive
)

export interface SliderTrackSlots {
  /** Injected fill bar component. */
  fill?: React.ComponentType<SliderFillProps>
  /** Injected thumb component. */
  thumb?: React.ComponentType<SliderThumbProps>
}

export interface SliderTrackProps extends ComponentProps<typeof PrimitiveSliderTrack> {
  /** Custom CSS classes for the slider track container. */
  className?: string
  /** Slot overrides map. */
  slots?: SlotComponents<SliderTrackSlots>
  /** Property overrides passed down into injected slots. */
  slotProps?: SlotPropsMap<SliderTrackSlots>
}

const SliderTrackPrimitive = ({
  className,
  children,
  slots: directSlots,
  slotProps: directSlotProps,
  ...props
}: SliderTrackProps) => {
  let contextSlots: SlotComponents<SliderSlots> | undefined
  let contextSlotProps: SlotPropsMap<SliderSlots> | undefined
  try {
    const ctx = useSliderContext()
    contextSlots = ctx.slots
    contextSlotProps = ctx.slotProps
  } catch {
    // Standalone usage outside SliderProvider
  }

  const fillSlot = directSlots?.fill ?? contextSlots?.fill
  const fillProps = { ...(contextSlotProps?.fill as object), ...(directSlotProps?.fill as object) }
  const thumbSlot = directSlots?.thumb ?? contextSlots?.thumb
  const thumbProps = { ...(contextSlotProps?.thumb as object), ...(directSlotProps?.thumb as object) }

  return (
    <PrimitiveSliderTrack
      data-slot="slider-track"
      className={cn(
        'bg-secondary group/track relative cursor-pointer rounded-full',
        'grow group-orientation-horizontal:h-1.5 group-orientation-horizontal:w-full group-orientation-vertical:w-1.5 group-orientation-vertical:flex-1',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    >
      {(values) => (
        <>
          {typeof children === 'function'
            ? children(values)
            : (children ?? (
                <>
                  {renderSlot(fillSlot, fillProps, { defaultComponent: SliderFill })}
                  {values?.state?.values?.length > 1 ? (
                    values.state.values.map((_, i) => (
                      <SliderThumb key={i} index={i} aria-label={i === 0 ? 'Minimum value' : 'Maximum value'} />
                    ))
                  ) : (
                    renderSlot(thumbSlot, thumbProps, { defaultComponent: SliderThumb })
                  )}
                </>
              ))}
        </>
      )}
    </PrimitiveSliderTrack>
  )
}

export const SliderTrack = createInterfaceComponent<SliderTrackProps, SliderTrackSlots>(
  {
    name: 'SliderTrack',
    category: 'form',
    description: 'Linear track container holding slider thumb and active fill bar.',
    version: '1.0.0',
    slots: {
      fill: SliderFill,
      thumb: SliderThumb,
    },
  },
  SliderTrackPrimitive
)

export interface SliderProps<T extends number | number[] = number>
  extends ComponentProps<typeof PrimitiveSlider<T>> {
  /** Custom CSS classes for the slider root container. */
  className?: string
  /** Slot overrides map for customizing track, thumb, fill, or output components. */
  slots?: SlotComponents<SliderSlots>
  /** Property overrides passed down into injected slots. */
  slotProps?: SlotPropsMap<SliderSlots>
  /** Thumb geometry. `pill` is a capsule; `circle` is a round knob. */
  thumb?: SliderThumbShape
  /** Shorthand alias for minValue. */
  min?: number
  /** Shorthand alias for maxValue. */
  max?: number
  /** Children or custom composed subcomponents */
  children?: React.ReactNode | ((values: any) => React.ReactNode)
}

const SliderPrimitiveComponent = ({
  className,
  slots,
  slotProps,
  thumb = 'circle',
  min,
  max,
  minValue,
  maxValue,
  children,
  ...props
}: SliderProps<any>) => {
  const contextValue = React.useMemo(() => ({ slots, slotProps, thumb }), [slots, slotProps, thumb])

  return (
    <SliderProvider value={contextValue}>
      <PrimitiveSlider
        data-slot="slider"
        className={cn(
          'group relative flex touch-none select-none flex-col disabled:opacity-50 gap-y-space-sm',
          'orientation-horizontal:w-full orientation-horizontal:min-w-fit',
          'orientation-vertical:h-full orientation-vertical:min-h-fit orientation-vertical:w-1.5 orientation-vertical:items-center',
          className
        )}
        minValue={minValue ?? min}
        maxValue={maxValue ?? max}
        {...props}
      >
        {children != null
          ? (typeof children === 'function' ? (values: any) => children(values) : children)
          : (
              <>
                {renderSlot(slots?.output, slotProps?.output as object, { defaultComponent: SliderOutput })}
                {renderSlot(
                  slots?.track,
                  slotProps?.track as object,
                  { defaultComponent: SliderTrack }
                )}
              </>
            )}
      </PrimitiveSlider>
    </SliderProvider>
  )
}

export const Slider = createInterfaceComponent<SliderProps<any>, SliderSlots>(
  {
    name: 'Slider',
    category: 'form',
    description: 'Accessible draggable slider control with single or range dual-thumb track.',
    version: '1.0.0',
    slots: {
      track: SliderTrack,
      thumb: SliderThumb,
      fill: SliderFill,
      output: SliderOutput,
    },
  },
  SliderPrimitiveComponent
)

// Namespace attachments for compound family ergonomics
Slider.Track = SliderTrack
Slider.Thumb = SliderThumb
Slider.Fill = SliderFill
Slider.Output = SliderOutput
Slider.Group = SliderGroup
Slider.Provider = SliderProvider

/* ==========================================================================
   RangeSlider — Dual-thumb range variant
   ========================================================================== */

export interface RangeSliderProps
  extends Omit<SliderProps<number[]>, 'value' | 'defaultValue' | 'onChange'> {
  /** Controlled [min, max] range value. */
  value?: [number, number]
  /** Uncontrolled default [min, max] range value. */
  defaultValue?: [number, number]
  /** Called with the updated [min, max] tuple on every change. */
  onChange?: (value: number[]) => void
  /** Show the current range readout above the track. Defaults to false. */
  showOutput?: boolean
  /** Slot overrides map for customizing track, thumb, fill, or output components. */
  slots?: SlotComponents<SliderSlots>
  /** Property overrides passed down into injected slots. */
  slotProps?: SlotPropsMap<SliderSlots>
  // min/max shorthands are inherited from SliderProps via the Omit extension
}

const RangeSliderDefaultTrack = (props: SliderTrackProps) => (
  <SliderTrack {...props}>
    <SliderFill />
    <SliderThumb index={0} aria-label="Minimum value" />
    <SliderThumb index={1} aria-label="Maximum value" />
  </SliderTrack>
)

function snapToStep(value: number, min: number, max: number, step: number) {
  const clamped = Math.min(max, Math.max(min, value))
  if (!step) return clamped
  const snapped = min + Math.round((clamped - min) / step) * step
  const precision = (step.toString().split('.')[1] ?? '').length
  return Math.min(max, Math.max(min, Number(snapped.toFixed(precision))))
}

/** Left-hand value is always the minimum. Thumbs may pass through each other. */
function orderRange(anchor: number, next: number): [number, number] {
  return anchor <= next ? [anchor, next] : [next, anchor]
}

function valueFromPointer(
  clientX: number,
  clientY: number,
  track: HTMLElement,
  min: number,
  max: number,
  orientation: 'horizontal' | 'vertical',
) {
  const rect = track.getBoundingClientRect()
  const rtl = getComputedStyle(track).direction === 'rtl'
  let percent = 0
  if (orientation === 'vertical') {
    percent = rect.height === 0 ? 0 : 1 - (clientY - rect.top) / rect.height
  } else {
    percent = rect.width === 0 ? 0 : (clientX - rect.left) / rect.width
    if (rtl) percent = 1 - percent
  }
  return min + Math.min(1, Math.max(0, percent)) * (max - min)
}

const RangeSliderPrimitive = ({
  showOutput = false,
  defaultValue = [25, 75],
  value: valueProp,
  onChange,
  onChangeEnd,
  children,
  slots,
  slotProps,
  min,
  max,
  minValue,
  maxValue,
  step = 1,
  orientation = 'horizontal',
  isDisabled,
  ...props
}: RangeSliderProps) => {
  const minimum = minValue ?? min ?? 0
  const maximum = maxValue ?? max ?? 100
  const [uncontrolled, setUncontrolled] = useState<[number, number]>(defaultValue)
  const value = valueProp ?? uncontrolled
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const onChangeEndRef = useRef(onChangeEnd)
  onChangeEndRef.current = onChangeEnd
  const boundsRef = useRef({
    minimum,
    maximum,
    step,
    orientation,
    disabled: !!isDisabled,
    controlled: valueProp !== undefined,
  })
  boundsRef.current = {
    minimum,
    maximum,
    step,
    orientation,
    disabled: !!isDisabled,
    controlled: valueProp !== undefined,
  }
  const dragRef = useRef<{ pointerId: number; index: number; anchor: number; track: HTMLElement } | null>(null)
  const [dragValues, setDragValues] = useState<[number, number] | null>(null)
  const shown = dragValues ?? value
  const shownRef = useRef(shown)
  shownRef.current = shown

  const emit = (ordered: [number, number]) => {
    if (!boundsRef.current.controlled) setUncontrolled(ordered)
    onChangeRef.current?.(ordered)
  }

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || event.pointerId !== drag.pointerId) return
      const { minimum: lo, maximum: hi, step: stepSize, orientation: axis } = boundsRef.current
      const pointer = snapToStep(
        valueFromPointer(event.clientX, event.clientY, drag.track, lo, hi, axis),
        lo,
        hi,
        stepSize,
      )
      const placed: [number, number] = drag.index === 0 ? [pointer, drag.anchor] : [drag.anchor, pointer]
      shownRef.current = placed
      setDragValues(placed)
      emit(orderRange(drag.anchor, pointer))
    }
    const onUp = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || event.pointerId !== drag.pointerId) return
      dragRef.current = null
      const ordered = orderRange(shownRef.current[0], shownRef.current[1])
      shownRef.current = ordered
      setDragValues(null)
      if (!boundsRef.current.controlled) setUncontrolled(ordered)
      onChangeEndRef.current?.(ordered)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [])

  const onPointerDownCapture = (event: React.PointerEvent<HTMLDivElement>) => {
    if (boundsRef.current.disabled || event.button !== 0) return
    const thumb = (event.target as Element | null)?.closest?.('[data-slot="slider-thumb"]')
    if (!thumb) return
    const track = thumb.closest('[data-slot="slider-track"]') as HTMLElement | null
    if (!track) return
    const index = Number(thumb.getAttribute('data-index') ?? 0)
    const current = shownRef.current
    const anchor = current[index === 0 ? 1 : 0]
    if (current.length < 2 || Number.isNaN(index) || anchor == null) return
    event.preventDefault()
    event.stopPropagation()
    dragRef.current = {
      pointerId: event.pointerId,
      index,
      anchor,
      track,
    }
    thumb.querySelector('input')?.focus()
  }

  const onKeyDownCapture = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (boundsRef.current.disabled || event.altKey || event.metaKey || event.ctrlKey) return
    if (!(event.target instanceof HTMLInputElement) || event.target.type !== 'range') return
    const thumb = event.target.closest('[data-slot="slider-thumb"]')
    if (!thumb) return
    const index = Number(thumb.getAttribute('data-index') ?? 0)
    const current = shownRef.current
    if (current.length < 2 || Number.isNaN(index)) return
    const active = current[index]
    const other = current[index === 0 ? 1 : 0]
    if (active == null || other == null) return

    const { minimum: lo, maximum: hi, step: stepSize, orientation: axis } = boundsRef.current
    const track = thumb.closest('[data-slot="slider-track"]') as HTMLElement | null
    const rtl = track ? getComputedStyle(track).direction === 'rtl' : false
    const page = Math.max(stepSize * 10, stepSize)
    let delta = 0
    let absolute: number | null = null

    if (event.key === 'Home') absolute = lo
    else if (event.key === 'End') absolute = hi
    else if (event.key === 'PageUp') delta = page
    else if (event.key === 'PageDown') delta = -page
    else if (event.key === 'ArrowUp') delta = stepSize
    else if (event.key === 'ArrowDown') delta = -stepSize
    else if (event.key === 'ArrowRight') delta = axis !== 'vertical' && rtl ? -stepSize : stepSize
    else if (event.key === 'ArrowLeft') delta = axis !== 'vertical' && rtl ? stepSize : -stepSize
    else return

    if (
      event.shiftKey &&
      (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown')
    ) {
      delta = Math.sign(delta) * page
    }

    event.preventDefault()
    event.stopPropagation()
    const raw = snapToStep(absolute ?? active + delta, lo, hi, stepSize)
    const placed: [number, number] = index === 0 ? [raw, other] : [other, raw]
    shownRef.current = placed
    setDragValues(placed)
    emit(orderRange(placed[0], placed[1]))
  }

  return (
    <div
      className="w-full"
      onPointerDownCapture={onPointerDownCapture}
      onKeyDownCapture={onKeyDownCapture}
      onBlur={() => {
        if (dragRef.current) return
        const ordered = orderRange(shownRef.current[0], shownRef.current[1])
        shownRef.current = ordered
        setDragValues(null)
        if (!boundsRef.current.controlled) setUncontrolled(ordered)
      }}
    >
      <SliderPrimitiveComponent
        value={shown}
        minValue={minimum}
        maxValue={maximum}
        step={step}
        orientation={orientation}
        isDisabled={isDisabled}
        slots={slots}
        slotProps={slotProps}
        onChange={(next) => {
          if (dragRef.current || !Array.isArray(next) || next.length < 2) return
          const ordered = orderRange(next[0], next[1])
          shownRef.current = ordered
          setDragValues(null)
          emit(ordered)
        }}
        onChangeEnd={(next) => {
          if (dragRef.current || !Array.isArray(next)) return
          onChangeEndRef.current?.(next)
        }}
        {...props}
      >
        {children != null
          ? children
          : (
              <>
                {showOutput && renderSlot(slots?.output, slotProps?.output as object, { defaultComponent: SliderOutput })}
                {renderSlot(
                  slots?.track,
                  slotProps?.track as object,
                  { defaultComponent: RangeSliderDefaultTrack }
                )}
              </>
            )}
      </SliderPrimitiveComponent>
    </div>
  )
}

export const RangeSlider = createInterfaceComponent<RangeSliderProps, SliderSlots>(
  {
    name: 'RangeSlider',
    category: 'form',
    description:
      'Pre-composed dual-thumb range slider. The left thumb is always the minimum and the right thumb is always the maximum, including when they pass through each other.',
    version: '1.0.0',
    slots: {
      track: SliderTrack,
      thumb: SliderThumb,
      fill: SliderFill,
      output: SliderOutput,
    },
  },
  RangeSliderPrimitive
)

/* ==========================================================================
   AdaptiveSlider — Color-shifting spring motion slider
   ========================================================================== */

export type AdaptiveSliderSize = 'sm' | 'md' | 'lg' | 'xl'
export type AdaptiveSliderWidth = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'auto' | (string & {}) | number

export interface AdaptiveSliderColorStage {
  /** Maximum percentage threshold (0 to 1) for this stage */
  threshold: number
  /** Text accent color */
  text?: string
  /** CSS gradient or color string for track fill */
  gradient: string
  /** Thumb border/accent color */
  thumbBorder?: string
}

export interface AdaptiveSliderProps extends Omit<React.ComponentProps<'div'>, 'onChange' | 'defaultValue'> {
  /** Size variant controlling track thickness and thumb diameter. Default: 'xl' */
  size?: AdaptiveSliderSize
  /** Width preset or custom CSS width (e.g. 'xs', 'sm', 'md', 'lg', 'xl', 'full', 'auto', 360, '100%'). */
  width?: AdaptiveSliderWidth
  /** Custom CSS classes for the root container. */
  className?: string
  /** Controlled numeric slider value. */
  value?: number
  /** Uncontrolled default value. */
  defaultValue?: number
  /** Minimum selectable value. Default: 50 */
  min?: number
  /** Alias for min. */
  minValue?: number
  /** Maximum selectable value. Default: 350 */
  max?: number
  /** Alias for max. */
  maxValue?: number
  /** Step increment. Default: 25 */
  step?: number
  /** Number of embedded track dot markers. Default: 6 (set to 0 to disable) */
  dotCount?: number
  /** Whether the control is disabled. */
  isDisabled?: boolean
  /** Alias for isDisabled. */
  disabled?: boolean
  /** Custom color stages mapping percentage (0..1) to gradient and accent colors */
  colorStages?: AdaptiveSliderColorStage[]
  /** Custom function to compute color settings based on current value and range */
  getColorSettings?: (value: number, min: number, max: number) => {
    text?: string
    gradient: string
    thumbBorder?: string
  }
  /** Callback fired on value change. */
  onChange?: (value: number) => void
  /** Aria label for screen readers. */
  'aria-label'?: string
  /** Name attribute for form submission. */
  name?: string
}

const DEFAULT_ADAPTIVE_MIN = 50
const DEFAULT_ADAPTIVE_MAX = 350
const DEFAULT_ADAPTIVE_STEP = 25
const DEFAULT_ADAPTIVE_VALUE = 200

const DEFAULT_ADAPTIVE_COLOR_STAGES: AdaptiveSliderColorStage[] = [
  {
    threshold: 0.5,
    text: '#10B981',
    gradient: 'linear-gradient(to right, #FEB101, #FE7C09)',
    thumbBorder: '#10B981',
  },
  {
    threshold: 0.7,
    text: '#FE55B7',
    gradient: 'linear-gradient(to right, #FE55B74D, #FE55B7)',
    thumbBorder: '#F97316',
  },
  {
    threshold: 1.0,
    text: '#D946EF',
    gradient: 'linear-gradient(to right, #DAB0FE, #4946FF)',
    thumbBorder: '#D946EF',
  },
]

interface AdaptiveSizeConfig {
  trackHeightClass: string
  trackHeightPx: number
  thumbSizeClass: string
  innerDiscClass: string
  dotSizeClass: string
  dotPaddingClass: string
}

const ADAPTIVE_SIZE_CONFIGS: Record<AdaptiveSliderSize, AdaptiveSizeConfig> = {
  sm: {
    trackHeightClass: 'h-6',
    trackHeightPx: 24,
    thumbSizeClass: 'size-6',
    innerDiscClass: 'size-[18px]',
    dotSizeClass: 'size-1',
    dotPaddingClass: 'px-2.5 sm:px-3',
  },
  md: {
    trackHeightClass: 'h-8',
    trackHeightPx: 32,
    thumbSizeClass: 'size-8',
    innerDiscClass: 'size-6',
    dotSizeClass: 'size-1',
    dotPaddingClass: 'px-3 sm:px-4',
  },
  lg: {
    trackHeightClass: 'h-10',
    trackHeightPx: 40,
    thumbSizeClass: 'size-10',
    innerDiscClass: 'size-[30px]',
    dotSizeClass: 'size-1.5',
    dotPaddingClass: 'px-3.5 sm:px-5',
  },
  xl: {
    trackHeightClass: 'h-13',
    trackHeightPx: 52,
    thumbSizeClass: 'size-13',
    innerDiscClass: 'size-10',
    dotSizeClass: 'size-1.5',
    dotPaddingClass: 'px-4 sm:px-8',
  },
}

const ADAPTIVE_WIDTH_PRESETS: Record<string, string> = {
  xs: 'w-full max-w-xs',
  sm: 'w-full max-w-sm',
  md: 'w-full max-w-md',
  lg: 'w-full max-w-lg',
  xl: 'w-full max-w-xl',
  full: 'w-full max-w-full',
  auto: 'w-auto',
}

const AdaptiveSliderPrimitive = ({
  value: controlledValue,
  defaultValue = DEFAULT_ADAPTIVE_VALUE,
  min,
  minValue,
  max,
  maxValue,
  step = DEFAULT_ADAPTIVE_STEP,
  size = 'xl',
  width,
  dotCount = 6,
  isDisabled = false,
  disabled = false,
  colorStages = DEFAULT_ADAPTIVE_COLOR_STAGES,
  getColorSettings: customGetColorSettings,
  onChange,
  className,
  style,
  'aria-label': ariaLabel,
  name,
  ...props
}: AdaptiveSliderProps) => {
  const effectiveDisabled = isDisabled || disabled
  const effectiveMin = min ?? minValue ?? DEFAULT_ADAPTIVE_MIN
  const effectiveMax = max ?? maxValue ?? DEFAULT_ADAPTIVE_MAX
  const sizeConfig = ADAPTIVE_SIZE_CONFIGS[size] ?? ADAPTIVE_SIZE_CONFIGS.xl

  const [internalValue, setInternalValue] = useState<number>(defaultValue)
  const currentValue = controlledValue ?? internalValue

  const colorSettings = useMemo(() => {
    if (customGetColorSettings) {
      return customGetColorSettings(currentValue, effectiveMin, effectiveMax)
    }
    const range = effectiveMax - effectiveMin
    const ratio = range > 0 ? (currentValue - effectiveMin) / range : 0
    const matched = colorStages.find((s) => ratio <= s.threshold) ?? colorStages[colorStages.length - 1]
    return {
      text: matched?.text ?? '#10B981',
      gradient: matched?.gradient ?? 'linear-gradient(to right, #FEB101, #FE7C09)',
      thumbBorder: matched?.thumbBorder ?? '#10B981',
    }
  }, [currentValue, effectiveMin, effectiveMax, colorStages, customGetColorSettings])

  const percentage = Math.min(
    100,
    Math.max(0, effectiveMax > effectiveMin ? ((currentValue - effectiveMin) / (effectiveMax - effectiveMin)) * 100 : 0)
  )

  const dots = useMemo(() => {
    if (dotCount <= 0) return null
    return Array.from({ length: dotCount }).map((_, i) => (
      <div
        key={i}
        className={cn(
          'z-30 rounded-full bg-[#C4B9FA] transition-colors dark:bg-neutral-600',
          sizeConfig.dotSizeClass
        )}
        style={{ opacity: 0.8 }}
      />
    ))
  }, [dotCount, sizeConfig.dotSizeClass])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    if (controlledValue === undefined) {
      setInternalValue(val)
    }
    onChange?.(val)
  }

  // Resolve width classes and inline styles
  let resolvedWidthClass = 'w-full'
  let resolvedWidthStyle: React.CSSProperties | undefined

  if (typeof width === 'number') {
    resolvedWidthStyle = { width: `${width}px`, maxWidth: '100%' }
  } else if (typeof width === 'string') {
    if (ADAPTIVE_WIDTH_PRESETS[width]) {
      resolvedWidthClass = ADAPTIVE_WIDTH_PRESETS[width]
    } else {
      resolvedWidthStyle = { width, maxWidth: '100%' }
    }
  }

  return (
    <div
      className={cn('relative select-none', resolvedWidthClass, className)}
      style={{ ...resolvedWidthStyle, ...style }}
      {...props}
    >
      <div
        className={cn(
          'group relative flex w-full items-center overflow-hidden rounded-full bg-[#f1f3f5] transition-colors dark:bg-neutral-800',
          sizeConfig.trackHeightClass,
          effectiveDisabled && 'opacity-60 cursor-not-allowed'
        )}
      >
        {dots && (
          <div
            className={cn(
              'pointer-events-none absolute inset-0 flex items-center justify-between transition-colors',
              sizeConfig.dotPaddingClass
            )}
          >
            {dots}
          </div>
        )}

        <motion.div
          className="pointer-events-none absolute top-0 left-0 h-full rounded-full"
          animate={{
            width: `calc((${percentage} / 100) * (100% - ${sizeConfig.trackHeightPx}px) + ${sizeConfig.trackHeightPx}px)`,
            background: colorSettings.gradient,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />

        <input
          title={ariaLabel ?? 'Adaptive slider'}
          aria-label={ariaLabel ?? 'Adaptive slider'}
          name={name}
          type="range"
          min={effectiveMin}
          max={effectiveMax}
          step={step}
          value={currentValue}
          disabled={effectiveDisabled}
          onChange={handleSliderChange}
          className={cn(
            'absolute inset-0 z-50 w-full cursor-pointer opacity-0 disabled:cursor-not-allowed',
            sizeConfig.trackHeightClass
          )}
        />

        <motion.div
          className={cn(
            'pointer-events-none absolute top-0 z-40 flex items-center justify-center rounded-full border-none',
            sizeConfig.thumbSizeClass
          )}
          animate={{
            left: `calc((${percentage} / 100) * (100% - ${sizeConfig.trackHeightPx}px))`,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div
            className={cn(
              'rounded-full bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] shadow-md transition-transform group-hover:scale-105 dark:bg-neutral-100',
              sizeConfig.innerDiscClass
            )}
          />
        </motion.div>
      </div>
    </div>
  )
}

export const AdaptiveSlider = createInterfaceComponent<AdaptiveSliderProps>(
  {
    name: 'AdaptiveSlider',
    category: 'form',
    description:
      'Adaptive color-shifting slider featuring fluid spring motion track animations and dynamic multi-stage gradients.',
    version: '1.0.0',
  },
  AdaptiveSliderPrimitive
)

// Namespace attachments
Slider.Range = RangeSlider
Slider.Adaptive = AdaptiveSlider
