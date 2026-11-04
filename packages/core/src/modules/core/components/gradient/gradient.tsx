import React from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'

export interface GradientColors {
  /** Pale wash along the top edge. */
  top?: string
  /** Saturated color through the middle. */
  center?: string
  /** Soft wash along the bottom edge. */
  bottom?: string
  /** Fallback bloom when left or right is omitted. */
  edge?: string
  /** Bloom on the left side. */
  left?: string
  /** Bloom on the right side. */
  right?: string
}

export type GradientShadow = 'none' | 'white' | 'black'

export interface GradientProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Mesh colors. Defaults to the violet-and-blue wash. */
  colors?: GradientColors
  /** Soft shadow painted over the edges. */
  shadow?: GradientShadow
  /** Optional content rendered above the wash. */
  children?: React.ReactNode
}

export const DEFAULT_GRADIENT_COLORS: Required<GradientColors> = {
  top: '#ddd4ff',
  center: '#3c5cf6',
  bottom: '#b7a6f8',
  edge: '#c3b0ff',
  left: '#c3b0ff',
  right: '#c3b0ff',
}

function mesh(colors: Required<GradientColors>) {
  return [
    `radial-gradient(ellipse 70% 42% at 50% 0%, ${colors.top} 0%, transparent 72%)`,
    `radial-gradient(ellipse 70% 42% at 50% 100%, ${colors.bottom} 0%, transparent 72%)`,
    `linear-gradient(to right, ${colors.left} 0%, transparent 18%)`,
    `linear-gradient(to left, ${colors.right} 0%, transparent 18%)`,
    `radial-gradient(ellipse 130% 110% at 50% 50%, ${colors.center} 0%, ${colors.center} 42%, transparent 78%)`,
    `linear-gradient(180deg, ${colors.top} 0%, ${colors.bottom} 100%)`,
  ].join(', ')
}

function edgeShadow(shadow: Exclude<GradientShadow, 'none'>) {
  const ink = shadow === 'white' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.55)'
  return `radial-gradient(ellipse 150% 130% at 50% 50%, transparent 78%, ${ink} 100%)`
}

const GradientPrimitive = ({ colors, shadow = 'white', className, children, ...props }: GradientProps) => {
  const paint = { ...DEFAULT_GRADIENT_COLORS, ...colors, left: colors?.left ?? colors?.edge ?? DEFAULT_GRADIENT_COLORS.left, right: colors?.right ?? colors?.edge ?? DEFAULT_GRADIENT_COLORS.right }
  const background = children == null

  return (
    <div
      data-slot="gradient"
      className={cn(
        'h-full w-full overflow-hidden',
        background ? 'pointer-events-none absolute inset-0' : 'relative',
        className
      )}
      {...props}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ backgroundColor: paint.top, backgroundImage: mesh(paint) }}
      />
      {shadow !== 'none' ? (
        <div aria-hidden className="absolute inset-0" style={{ backgroundImage: edgeShadow(shadow) }} />
      ) : null}
      {children != null ? <div className="relative z-10 h-full w-full">{children}</div> : null}
    </div>
  )
}

export const Gradient = createInterfaceComponent<GradientProps>(
  {
    name: 'Gradient',
    category: 'layout',
    description: 'Mesh gradient background with a white or black edge shadow. Drop it into any relative container, or wrap content with it.',
    version: '1.0.0',
  },
  GradientPrimitive
)
