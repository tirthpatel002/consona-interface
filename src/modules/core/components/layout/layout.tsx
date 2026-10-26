import React, { Children, isValidElement, Fragment, useState, useEffect, type ReactNode } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { ArrowUpIcon } from '@heroicons/react/24/outline'

/* ==========================================================================
   Container Primitive & Factory
   ========================================================================== */

export const containerStyles = tv({
  base: 'mx-auto w-full px-space-lg sm:px-space-xl lg:px-space-2xl',
  variants: {
    size: {
      sm: 'max-w-3xl',
      md: 'max-w-5xl',
      lg: 'max-w-7xl',
      xl: 'max-w-full max-w-7xl',
      fluid: 'max-w-full',
    },
    constrained: {
      true: 'px-space-lg sm:px-space-xl',
      false: 'px-space-lg',
    },
  },
  defaultVariants: {
    size: 'lg',
    constrained: false,
  },
})

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerStyles> {
  /** Maximum container width constraint: sm, md, lg, xl, fluid */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fluid'
  /** Whether to constrain padding on larger screens */
  constrained?: boolean
  /** Additional CSS class names */
  className?: string
}

const ContainerPrimitive = ({
  className,
  size = 'lg',
  constrained = false,
  ...props
}: ContainerProps) => {
  return (
    <div
      data-slot="container"
      className={cn(containerStyles({ size, constrained }), className)}
      {...props}
    />
  )
}

export const Container = createInterfaceComponent<ContainerProps>(
  {
    name: 'Container',
    category: 'layout',
    description: 'Centered responsive content container with max-width breakpoints and optical gutters.',
    version: '1.0.0',
    props: {
      size: 'lg',
      constrained: false,
    },
  },
  ContainerPrimitive
)

/* ==========================================================================
   Stack Primitives & Factory (Stack, HStack, VStack)
   ========================================================================== */

export type StackDirection = 'row' | 'col' | 'responsive' | 'responsive-reverse'
export type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline'
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
export type StackGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const directionClasses: Record<StackDirection, string> = {
  row: 'flex-row',
  col: 'flex-col',
  responsive: 'flex-col sm:flex-row',
  'responsive-reverse': 'flex-col-reverse sm:flex-row',
}

const alignClasses: Record<StackAlign, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
}

const justifyClasses: Record<StackJustify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
}

const gapClasses: Record<StackGap, string> = {
  none: 'gap-0',
  xs: 'gap-space-xs',
  sm: 'gap-space-sm',
  md: 'gap-space-lg',
  lg: 'gap-space-xl',
  xl: 'gap-space-2xl',
  '2xl': 'gap-space-3xl',
}

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Flex direction flow: row, col, responsive, responsive-reverse */
  direction?: StackDirection
  /** Cross-axis alignment: start, center, end, stretch, baseline */
  align?: StackAlign
  /** Main-axis distribution: start, center, end, between, around, evenly */
  justify?: StackJustify
  /** Inter-element spacing token: none, xs, sm, md, lg, xl, 2xl */
  gap?: StackGap
  /** Whether items wrap onto multiple lines */
  wrap?: boolean
  /** Optional divider element inserted between consecutive children */
  divider?: ReactNode
}

const StackPrimitive = ({
  direction = 'col',
  align = 'stretch',
  justify = 'start',
  gap = 'md',
  wrap = false,
  divider,
  className,
  children,
  ...props
}: StackProps) => {
  const validChildren = Children.toArray(children).filter(isValidElement)

  return (
    <div
      data-slot="stack"
      data-direction={direction}
      className={cn(
        'flex',
        directionClasses[direction] || directionClasses.col,
        alignClasses[align] || alignClasses.stretch,
        justifyClasses[justify] || justifyClasses.start,
        gapClasses[gap] || gapClasses.md,
        wrap && 'flex-wrap',
        className
      )}
      {...props}
    >
      {divider
        ? validChildren.map((child, index) => (
            <Fragment key={child.key ?? index}>
              {child}
              {index < validChildren.length - 1 && (
                <div data-slot="stack-divider" className="shrink-0">
                  {divider}
                </div>
              )}
            </Fragment>
          ))
        : children}
    </div>
  )
}

export const Stack = createInterfaceComponent<StackProps>(
  {
    name: 'Stack',
    category: 'layout',
    description: 'Flexible layout container orchestrating linear item flow, alignment, gaps, and inter-item dividers.',
    version: '1.0.0',
    props: {
      direction: 'col',
      align: 'stretch',
      justify: 'start',
      gap: 'md',
      wrap: false,
    },
  },
  StackPrimitive
)

export interface HStackProps extends Omit<StackProps, 'direction'> {
  /** direction */
  direction?: 'row' | 'responsive'
}

export const HStack: React.FC<HStackProps> = ({
  direction = 'row',
  align = 'center',
  ...props
}) => {
  return <Stack direction={direction} align={align} {...props} />
}

export interface VStackProps extends Omit<StackProps, 'direction'> {
  /** direction */
  direction?: 'col' | 'responsive-reverse'
}

export const VStack: React.FC<VStackProps> = ({
  direction = 'col',
  align = 'stretch',
  ...props
}) => {
  return <Stack direction={direction} align={align} {...props} />
}

/* ==========================================================================
   Center Primitive & Factory
   ========================================================================== */

export interface CenterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether to use inline-flex display */
  inline?: boolean
}

const CenterPrimitive = ({
  inline = false,
  className,
  children,
  ...props
}: CenterProps) => {
  return (
    <div
      data-slot="center"
      className={cn(
        inline ? 'inline-flex' : 'flex',
        'items-center justify-center',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const Center = createInterfaceComponent<CenterProps>(
  {
    name: 'Center',
    category: 'layout',
    description: 'Layout primitive centering child elements along both horizontal and vertical axes.',
    version: '1.0.0',
    props: {
      inline: false,
    },
  },
  CenterPrimitive
)

/* ==========================================================================
   Bleed Primitive & Factory
   ========================================================================== */

export type BleedAmount = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'

export interface BleedProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Negative horizontal bleed */
  inline?: BleedAmount | boolean
  /** Negative vertical bleed */
  block?: BleedAmount | boolean
  /** Negative bleed on all 4 edges */
  all?: BleedAmount | boolean
}

const marginMap: Record<BleedAmount, { x: string; y: string; all: string }> = {
  xs: { x: '-mx-1', y: '-my-1', all: '-m-1' },
  sm: { x: '-mx-2', y: '-my-2', all: '-m-2' },
  md: { x: '-mx-4', y: '-my-4', all: '-m-4' },
  lg: { x: '-mx-6', y: '-my-6', all: '-m-6' },
  xl: { x: '-mx-8', y: '-my-8', all: '-m-8' },
  '2xl': { x: '-mx-12', y: '-my-12', all: '-m-12' },
  full: { x: '-mx-6 sm:-mx-8 lg:-mx-10', y: '-my-6 sm:-my-8 lg:-my-10', all: '-m-6 sm:-m-8 lg:-m-10' },
}

const BleedPrimitive = ({
  inline,
  block,
  all = 'md',
  className,
  children,
  ...props
}: BleedProps) => {
  let marginClass = ''

  if (inline) {
    const amt = typeof inline === 'string' ? inline : 'md'
    marginClass += ` ${marginMap[amt]?.x || '-mx-4'}`
  }
  if (block) {
    const amt = typeof block === 'string' ? block : 'md'
    marginClass += ` ${marginMap[amt]?.y || '-my-4'}`
  }
  if (!inline && !block && all) {
    const amt = typeof all === 'string' ? all : 'md'
    marginClass = marginMap[amt]?.all || '-m-4'
  }

  return (
    <div data-slot="bleed" className={cn(marginClass.trim(), className)} {...props}>
      {children}
    </div>
  )
}

export const Bleed = createInterfaceComponent<BleedProps>(
  {
    name: 'Bleed',
    category: 'layout',
    description: 'Negative margin wrapper allowing child elements to bleed into surrounding container padding.',
    version: '1.0.0',
    props: {
      all: 'md',
    },
  },
  BleedPrimitive
)

/* ==========================================================================
   Float Primitive & Factory (Float, BackToTop)
   ========================================================================== */

export type FloatPlacement =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left'
  | 'bottom-center'
  | 'top-center'

export interface FloatProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Screen corner or edge position */
  placement?: FloatPlacement
  /** Minimum vertical scroll pixels required before floating element transitions in */
  showAfter?: number
}

const placementClasses: Record<FloatPlacement, string> = {
  'bottom-right': 'bottom-6 end-6',
  'bottom-left': 'bottom-6 start-6',
  'top-right': 'top-6 end-6',
  'top-left': 'top-6 start-6',
  'bottom-center': 'bottom-6 start-1/2 -translate-x-1/2',
  'top-center': 'top-6 start-1/2 -translate-x-1/2',
}

const FloatPrimitive = ({
  placement = 'bottom-right',
  showAfter = 0,
  className,
  children,
  ...props
}: FloatProps) => {
  const [isVisible, setIsVisible] = useState(showAfter === 0)

  useEffect(() => {
    if (showAfter === 0) return

    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop
      setIsVisible(scrollY > showAfter)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [showAfter])

  return (
    <div
      data-slot="float"
      data-visible={isVisible ? '' : undefined}
      className={cn(
        'fixed z-50 transition-all duration-300 ease-out pointer-events-auto',
        placementClasses[placement] || placementClasses['bottom-right'],
        isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 pointer-events-none translate-y-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const Float = createInterfaceComponent<FloatProps>(
  {
    name: 'Float',
    category: 'layout',
    description: 'Fixed-position anchor pinning floating action buttons or widgets to screen coordinates with scroll-trigger thresholds.',
    version: '1.0.0',
    props: {
      placement: 'bottom-right',
      showAfter: 0,
    },
  },
  FloatPrimitive
)

export interface BackToTopProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Scroll distance in pixels before appearing */
  showAfter?: number
  /** Whether to use smooth scrolling */
  smooth?: boolean
}

const BackToTopPrimitive = ({
  showAfter = 200,
  smooth = true,
  className,
  children,
  onClick,
  ...props
}: BackToTopProps) => {
  const scrollToTop = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented) {
      window.scrollTo({
        top: 0,
        behavior: smooth ? 'smooth' : 'auto',
      })
    }
  }

  return (
    <Float placement="bottom-right" showAfter={showAfter}>
      <button
        type="button"
        aria-label="Back to top"
        onClick={scrollToTop}
        className={cn(
          'flex size-10 items-center justify-center rounded-full border border-border/40 bg-surface/90 text-fg backdrop-blur-md shadow-sm transition-all cursor-pointer',
          'hover:bg-primary hover:text-primary-fg hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className
        )}
        {...props}
      >
        {children || <ArrowUpIcon className="size-4" />}
      </button>
    </Float>
  )
}

export const BackToTop = createInterfaceComponent<BackToTopProps>(
  {
    name: 'BackToTop',
    category: 'layout',
    description: 'Floating button smoothly returning scroll position to the top of the viewport.',
    version: '1.0.0',
    props: {
      showAfter: 200,
      smooth: true,
    },
  },
  BackToTopPrimitive
)

/* ==========================================================================
   Composite Layout Namespace Object
   ========================================================================== */

export const Layout = {
  Container,
  Stack,
  HStack,
  VStack,
  Center,
  Bleed,
  Float,
  BackToTop,
}
