import * as React from 'react'
import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Button, type ButtonProps } from '../button'

/* ==========================================================================
   Carousel Context & Types
   ========================================================================== */

export type CarouselApi = UseEmblaCarouselType[1]
export type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
export type CarouselOptions = UseCarouselParameters[0]
export type CarouselPlugin = UseCarouselParameters[1]

export interface CarouselContextProps {
  /** Embla carousel viewport ref. */
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  /** Embla carousel API instance. */
  api: ReturnType<typeof useEmblaCarousel>[1]
  /** Scroll to previous slide. */
  scrollPrev: () => void
  /** Scroll to next slide. */
  scrollNext: () => void
  /** Whether scrolling backward is possible. */
  canScrollPrev: boolean
  /** Whether scrolling forward is possible. */
  canScrollNext: boolean
  /** Active orientation. */
  orientation: 'horizontal' | 'vertical'
  /** Carousel options. */
  opts?: CarouselOptions
}

export const CarouselContext = createContext<CarouselContextProps | null>(null)

const DEFAULT_CAROUSEL_CONTEXT: CarouselContextProps = {
  carouselRef: () => {},
  api: undefined,
  scrollPrev: () => {},
  scrollNext: () => {},
  canScrollPrev: false,
  canScrollNext: false,
  orientation: 'horizontal',
}

/**
 * Accesses ambient Embla carousel API, viewport ref, and navigation states.
 */
export function useCarousel(): CarouselContextProps {
  const context = useContext(CarouselContext)
  return context ?? DEFAULT_CAROUSEL_CONTEXT
}

export const CarouselProvider = CarouselContext.Provider
export const useCarouselContext = useCarousel

/* ==========================================================================
   Carousel Slots & Props
   ========================================================================== */

export interface CarouselSlots {}

export interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Embla configuration options. */
  opts?: CarouselOptions
  /** Embla plugin instances (e.g. autoplay, wheel). */
  plugins?: CarouselPlugin
  /** Scroll orientation: horizontal (default) or vertical. */
  orientation?: 'horizontal' | 'vertical'
  /** Callback to receive the Embla API instance when initialized. */
  setApi?: (api: CarouselApi) => void
  /** Slot overrides. */
  slots?: SlotComponents<CarouselSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<CarouselSlots>
  /** Carousel content and sub-components. */
  children?: ReactNode
}

/* ==========================================================================
   Carousel Root Primitive
   ========================================================================== */

const CarouselPrimitive = ({
  orientation = 'horizontal',
  opts,
  setApi,
  plugins,
  slots = {},
  slotProps = {},
  className,
  children,
  ...props
}: CarouselProps) => {
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === 'horizontal' ? 'x' : 'y',
    },
    plugins
  )
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const onSelect = useCallback((currentApi: CarouselApi) => {
    if (!currentApi) return
    setCanScrollPrev(currentApi.canScrollPrev())
    setCanScrollNext(currentApi.canScrollNext())
  }, [])

  const scrollPrev = useCallback(() => {
    api?.scrollPrev()
  }, [api])

  const scrollNext = useCallback(() => {
    api?.scrollNext()
  }, [api])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        scrollPrev()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        scrollNext()
      }
    },
    [scrollPrev, scrollNext]
  )

  useEffect(() => {
    if (!api || !setApi) return
    setApi?.(api)
  }, [api, setApi])

  useEffect(() => {
    if (!api) return
    onSelect?.(api)
    api.on('reInit', onSelect)
    api.on('select', onSelect)

    return () => {
      api?.off('select', onSelect)
    }
  }, [api, onSelect])

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api,
        opts,
        orientation: orientation || (opts?.axis === 'y' ? 'vertical' : 'horizontal'),
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        data-slot="carousel"
        className={cn('relative select-none', className)}
        role="region"
        aria-roledescription="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

/* ==========================================================================
   CarouselContent Sub-Component
   ========================================================================== */

export interface CarouselContentSlots {}

export interface CarouselContentProps extends React.ComponentProps<'div'> {}

const CarouselContentPrimitive = ({ className, ...props }: CarouselContentProps) => {
  const { carouselRef, orientation } = useCarousel()

  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div
        data-slot="carousel-content"
        className={cn('flex', orientation === 'horizontal' ? '-ms-4' : '-mt-4 flex-col', className)}
        {...props}
      />
    </div>
  )
}

export const CarouselContent = createInterfaceComponent<CarouselContentProps, CarouselContentSlots>(
  {
    name: 'CarouselContent',
    category: 'layout',
    description: 'Viewport and track container for carousel slides.',
    version: '1.0.0',
    slots: {

    },
  },
  CarouselContentPrimitive
)

/* ==========================================================================
   CarouselItem Sub-Component
   ========================================================================== */

export interface CarouselItemSlots {}

export interface CarouselItemProps extends React.ComponentProps<'div'> {}

const CarouselItemPrimitive = ({ className, ...props }: CarouselItemProps) => {
  const { orientation } = useCarousel()

  return (
    <div
      data-slot="carousel-item"
      role="group"
      aria-roledescription="slide"
      className={cn(
        'group/carousel-item relative min-w-0 shrink-0 grow-0 basis-full focus:outline-hidden focus-visible:outline-hidden',
        orientation === 'horizontal' ? 'ps-4' : 'pt-4',
        className
      )}
      {...props}
    />
  )
}

export const CarouselItem = createInterfaceComponent<CarouselItemProps, CarouselItemSlots>(
  {
    name: 'CarouselItem',
    category: 'layout',
    description: 'Individual slide container inside CarouselContent.',
    version: '1.0.0',
    slots: {

    },
  },
  CarouselItemPrimitive
)

/* ==========================================================================
   CarouselHandler Sub-Component
   ========================================================================== */

export interface CarouselHandlerSlots {}

export interface CarouselHandlerProps extends React.ComponentProps<'div'> {}

const CarouselHandlerPrimitive = ({ className, ...props }: CarouselHandlerProps) => {
  const { orientation } = useCarousel()
  return (
    <div
      data-slot="carousel-handler"
      className={cn(
        'relative z-10 mt-4 flex items-center gap-x-2',
        orientation === 'horizontal' ? 'justify-end' : 'justify-center',
        className
      )}
      {...props}
    />
  )
}

export const CarouselHandler = createInterfaceComponent<CarouselHandlerProps, CarouselHandlerSlots>(
  {
    name: 'CarouselHandler',
    category: 'layout',
    description: 'Navigation action container holding previous/next buttons.',
    version: '1.0.0',
    slots: {

    },
  },
  CarouselHandlerPrimitive
)

/* ==========================================================================
   CarouselButton Sub-Component
   ========================================================================== */

export interface CarouselButtonSlots {}

export interface CarouselButtonProps extends Omit<ButtonProps, 'slotProps' | 'slots'> {
  /** Navigation segment target: 'previous' or 'next'. */
  segment: 'previous' | 'next'
}

const CarouselButtonPrimitive = ({
  segment,
  className,
  intent = 'outline',
  isCircle = true,
  size = 'sq-sm',
  ...props
}: CarouselButtonProps) => {
  const { orientation, scrollPrev, canScrollPrev, scrollNext, canScrollNext } = useCarousel()
  const isNext = segment === 'next'
  const canScroll = isNext ? canScrollNext : canScrollPrev
  const scroll = isNext ? scrollNext : scrollPrev
  const Icon = isNext ? ChevronRightIcon : ChevronLeftIcon

  return (
    <Button
      aria-label={isNext ? 'Next slide' : 'Previous slide'}
      data-slot="carousel-button"
      data-handler={segment}
      intent={intent}
      size={size}
      isCircle={isCircle}
      className={cn(orientation === 'vertical' ? 'rotate-90' : '', 'shrink-0', className)}
      isDisabled={!canScroll}
      onPress={scroll}
      {...props}
    >
      <Icon className="size-4" />
    </Button>
  )
}

export const CarouselButton = createInterfaceComponent<CarouselButtonProps, CarouselButtonSlots>(
  {
    name: 'CarouselButton',
    category: 'form',
    description: 'Previous or next navigation trigger button for Carousel.',
    version: '1.0.0',
    props: {
      segment: 'next',
      intent: 'outline',
      isCircle: true,
      size: 'sq-sm',
    },
    slots: {

    },
  },
  CarouselButtonPrimitive
)

/* ==========================================================================
   CarouselDots Sub-Component
   ========================================================================== */

export interface CarouselDotsSlots {}

export interface CarouselDotsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Total slide count — must match the number of CarouselItem slides. */
  count: number
  /** Size token for dots: sm, md, lg. Default is 'md'. */
  size?: 'sm' | 'md' | 'lg'
}

const dotSizes = { sm: 'size-1.5', md: 'size-2', lg: 'size-2.5' }

const CarouselDotsPrimitive = ({ count, size = 'md', className, ...props }: CarouselDotsProps) => {
  const { api } = useCarousel()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!api) return
    const onSelect = () => setCurrent(api.selectedScrollSnap())
    api.on('select', onSelect)
    onSelect?.()
    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  return (
    <div
      data-slot="carousel-dots"
      role="tablist"
      aria-label="Carousel slide indicators"
      className={cn('flex items-center justify-center gap-1.5 py-1', className)}
      {...props}
    >
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === current}
          aria-label={`Slide ${i + 1}`}
          onClick={() => api?.scrollTo(i)}
          className={cn(
            'cursor-pointer rounded-full transition-all duration-200',
            dotSizes[size],
            i === current
              ? 'bg-primary scale-125 shadow-2xs'
              : 'bg-border hover:bg-muted-fg/60'
          )}
        />
      ))}
    </div>
  )
}

export const CarouselDots = createInterfaceComponent<CarouselDotsProps, CarouselDotsSlots>(
  {
    name: 'CarouselDots',
    category: 'feedback',
    description: 'Interactive dot indicators for direct slide jumping in Carousel.',
    version: '1.0.0',
    props: {
      count: 0,
      size: 'md',
    },
    slots: {

    },
  },
  CarouselDotsPrimitive
)

/* ==========================================================================
   CarouselThumb & CarouselThumbnails Sub-Components
   ========================================================================== */

export interface CarouselThumbSlots {}

export interface CarouselThumbProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Zero-based index of the corresponding slide. */
  index: number
  /** If true, removes default outline/rounded thumbnail styling for custom presentation. */
  unstyled?: boolean
  /** Render prop or children. */
  children?: ReactNode | ((state: { isSelected: boolean }) => ReactNode)
}

const CarouselThumbPrimitive = ({
  index,
  unstyled = false,
  className,
  children,
  onClick,
  ...props
}: CarouselThumbProps) => {
  const { api } = useCarousel()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!api) return
    const onSelect = () => setCurrent(api.selectedScrollSnap())
    api.on('select', onSelect)
    onSelect?.()
    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  const isSelected = current === index

  return (
    <button
      type="button"
      role="tab"
      aria-label={`Go to slide ${index + 1}`}
      aria-selected={isSelected}
      onClick={(e) => {
        api?.scrollTo(index)
        onClick?.(e)
      }}
      className={cn(
        'shrink-0 cursor-pointer transition-all duration-200',
        !unstyled && [
          'overflow-hidden rounded-base',
          isSelected
            ? 'outline-2 outline-offset-2 outline-primary opacity-100 scale-105'
            : 'outline-2 outline-offset-2 outline-transparent opacity-50 hover:opacity-75',
        ],
        className
      )}
      {...props}
    >
      {typeof children === 'function' ? children({ isSelected }) : children}
    </button>
  )
}

export const CarouselThumb = createInterfaceComponent<CarouselThumbProps, CarouselThumbSlots>(
  {
    name: 'CarouselThumb',
    category: 'layout',
    description: 'Single clickable thumbnail card inside CarouselThumbnails.',
    version: '1.0.0',
    props: {
      index: 0,
      unstyled: false,
    },
    slots: {

    },
  },
  CarouselThumbPrimitive
)

export type CarouselThumbnailItem =
  | string
  | {
      src?: string
      alt?: string
      label?: ReactNode
      icon?: ReactNode
      content?: ReactNode
    }

export interface CarouselThumbnailsSlots {}

export interface CarouselThumbnailsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of thumbnail images, tab descriptors, or custom preview objects. */
  thumbnails?: CarouselThumbnailItem[]
  /** Height of each thumbnail image if using string / src thumbnails. Default 56px. */
  thumbHeight?: number
  /** Children thumbnails. */
  children?: ReactNode
}

const CarouselThumbnailsPrimitive = ({
  thumbnails,
  thumbHeight = 56,
  className,
  children,
  ...props
}: CarouselThumbnailsProps) => {
  const { api } = useCarousel()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!api) return
    const onSelect = () => setCurrent(api.selectedScrollSnap())
    api.on('select', onSelect)
    onSelect?.()
    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  return (
    <div
      data-slot="carousel-thumbnails"
      role="tablist"
      aria-label="Carousel navigation"
      className={cn('mt-3 flex items-center gap-2 overflow-x-auto scrollbar-none p-1.5', className)}
      {...props}
    >
      {children
        ? children
        : thumbnails?.map((item, i) => {
            const isSelected = i === current
            if (typeof item === 'string') {
              return (
                <CarouselThumb key={i} index={i} style={{ height: thumbHeight, aspectRatio: '16/9' }}>
                  <img src={item} alt={`Slide ${i + 1}`} className="size-full object-cover" />
                </CarouselThumb>
              )
            }
            if (item.content) {
              return (
                <CarouselThumb key={i} index={i} unstyled>
                  {item.content}
                </CarouselThumb>
              )
            }
            if (item.src) {
              return (
                <CarouselThumb key={i} index={i} style={{ height: thumbHeight, aspectRatio: '16/9' }}>
                  <img src={item.src} alt={item.alt ?? `Slide ${i + 1}`} className="size-full object-cover" />
                </CarouselThumb>
              )
            }
            if (item.label || item.icon) {
              return (
                <CarouselThumb
                  key={i}
                  index={i}
                  unstyled
                  className={cn(
                    'flex items-center gap-2 rounded-base border px-3 py-1.5 text-xs font-medium transition-all duration-200',
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary shadow-xs'
                      : 'border-border bg-muted/40 text-muted-fg hover:border-fg/20 hover:text-fg'
                  )}
                >
                  {item.icon}
                  {item.label}
                </CarouselThumb>
              )
            }
            return null
          })}
    </div>
  )
}

export const CarouselThumbnails = createInterfaceComponent<CarouselThumbnailsProps, CarouselThumbnailsSlots>(
  {
    name: 'CarouselThumbnails',
    category: 'layout',
    description: 'Horizontal thumbnail strip for previewing and selecting Carousel slides.',
    version: '1.0.0',
    props: {
      thumbHeight: 56,
    },
    slots: {

    },
  },
  CarouselThumbnailsPrimitive
)

export const CarouselThumbs = CarouselThumbnails
export interface CarouselThumbsProps extends CarouselThumbnailsProps {}

/* ==========================================================================
   CarouselProgress Sub-Component
   ========================================================================== */

export interface CarouselProgressSlots {}

export interface CarouselProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Total slide count. */
  count: number
}

const CarouselProgressPrimitive = ({ count, className, ...props }: CarouselProgressProps) => {
  const { api } = useCarousel()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!api) return
    const onSelect = () => setCurrent(api.selectedScrollSnap())
    api.on('select', onSelect)
    onSelect?.()
    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  const percent = count > 1 ? (current / (count - 1)) * 100 : 100

  return (
    <div
      data-slot="carousel-progress"
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={count}
      aria-label="Carousel progress"
      className={cn('h-1 w-full overflow-hidden rounded-full bg-border', className)}
      {...props}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

export const CarouselProgress = createInterfaceComponent<CarouselProgressProps, CarouselProgressSlots>(
  {
    name: 'CarouselProgress',
    category: 'feedback',
    description: 'Smooth animated progress bar for Carousel tracking active slide percentage.',
    version: '1.0.0',
    props: {
      count: 0,
    },
    slots: {

    },
  },
  CarouselProgressPrimitive
)

/* ==========================================================================
   CarouselCounter Sub-Component
   ========================================================================== */

export interface CarouselCounterSlots {}

export interface CarouselCounterProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Total slide count. */
  count: number
  /** Separator character between active index and count. Default is '/'. */
  separator?: string
}

const CarouselCounterPrimitive = ({
  count,
  separator = '/',
  className,
  ...props
}: CarouselCounterProps) => {
  const { api } = useCarousel()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!api) return
    const onSelect = () => setCurrent(api.selectedScrollSnap())
    api.on('select', onSelect)
    onSelect?.()
    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  return (
    <span
      data-slot="carousel-counter"
      className={cn('tabular-nums text-xs font-medium text-muted-fg', className)}
      {...props}
    >
      <span className="text-fg">{current + 1}</span>
      <span className="mx-0.5 opacity-50">{separator}</span>
      {count}
    </span>
  )
}

export const CarouselCounter = createInterfaceComponent<CarouselCounterProps, CarouselCounterSlots>(
  {
    name: 'CarouselCounter',
    category: 'feedback',
    description: 'Tabular slide number indicator (e.g. 1 / 5) for Carousel.',
    version: '1.0.0',
    props: {
      count: 0,
      separator: '/',
    },
    slots: {

    },
  },
  CarouselCounterPrimitive
)

/* ==========================================================================
   Main Component Factory & Compound Attachments
   ========================================================================== */

export const Carousel = createInterfaceComponent<CarouselProps, CarouselSlots>(
  {
    name: 'Carousel',
    category: 'layout',
    description: 'Draggable touch and mouse slide carousel with Embla engine, pagination dots, thumbnails, and progress meter.',
    version: '1.0.0',
    props: {
      orientation: 'horizontal',
    },
    slots: {

    },
  },
  CarouselPrimitive
)

// Compound family attachments
Carousel.Provider = CarouselProvider
Carousel.Content = CarouselContent
Carousel.Item = CarouselItem
Carousel.Handler = CarouselHandler
Carousel.Button = CarouselButton
Carousel.Dots = CarouselDots
Carousel.Thumb = CarouselThumb
Carousel.Thumbnails = CarouselThumbnails
Carousel.Thumbs = CarouselThumbs
Carousel.Progress = CarouselProgress
Carousel.Counter = CarouselCounter
