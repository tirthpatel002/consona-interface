import * as React from 'react'
import { type ReactNode } from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import type { BadgeProps } from '../badge'

/* ==========================================================================
   Bento Responsive Types & Mappings
   ========================================================================== */

export type BreakpointKey = 'initial' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export type ResponsiveValue<T> =
  | T
  | {
      initial?: T
      sm?: T
      md?: T
      lg?: T
      xl?: T
      '2xl'?: T
    }

export type BentoCols = 1 | 2 | 3 | 4 | 5 | 6
export type ResponsiveCols = ResponsiveValue<BentoCols>

export type BentoSpan = 1 | 2 | 3 | 4 | 5 | 6 | 'full'
export type ResponsiveSpan = ResponsiveValue<BentoSpan>

export type BentoRowHeight = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto' | string
export type BentoGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type BentoCardVariant =
  | 'default'
  | 'subtle'
  | 'bordered'
  | 'flat'
  | 'glow'
  | 'interactive'

/* Static lookup tables for Tailwind class extraction */

const defaultGridColsMap: Record<BentoCols, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
  6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
}

const breakpointColsMap: Record<string, string> = {
  'initial-1': 'grid-cols-1',
  'initial-2': 'grid-cols-2',
  'initial-3': 'grid-cols-3',
  'initial-4': 'grid-cols-4',
  'initial-5': 'grid-cols-5',
  'initial-6': 'grid-cols-6',
  'sm-1': 'sm:grid-cols-1',
  'sm-2': 'sm:grid-cols-2',
  'sm-3': 'sm:grid-cols-3',
  'sm-4': 'sm:grid-cols-4',
  'sm-5': 'sm:grid-cols-5',
  'sm-6': 'sm:grid-cols-6',
  'md-1': 'md:grid-cols-1',
  'md-2': 'md:grid-cols-2',
  'md-3': 'md:grid-cols-3',
  'md-4': 'md:grid-cols-4',
  'md-5': 'md:grid-cols-5',
  'md-6': 'md:grid-cols-6',
  'lg-1': 'lg:grid-cols-1',
  'lg-2': 'lg:grid-cols-2',
  'lg-3': 'lg:grid-cols-3',
  'lg-4': 'lg:grid-cols-4',
  'lg-5': 'lg:grid-cols-5',
  'lg-6': 'lg:grid-cols-6',
  'xl-1': 'xl:grid-cols-1',
  'xl-2': 'xl:grid-cols-2',
  'xl-3': 'xl:grid-cols-3',
  'xl-4': 'xl:grid-cols-4',
  'xl-5': 'xl:grid-cols-5',
  'xl-6': 'xl:grid-cols-6',
  '2xl-1': '2xl:grid-cols-1',
  '2xl-2': '2xl:grid-cols-2',
  '2xl-3': '2xl:grid-cols-3',
  '2xl-4': '2xl:grid-cols-4',
  '2xl-5': '2xl:grid-cols-5',
  '2xl-6': '2xl:grid-cols-6',
}

const defaultColSpanMap: Record<string, string> = {
  '1': 'col-span-1',
  '2': 'col-span-1 sm:col-span-2',
  '3': 'col-span-1 sm:col-span-2 lg:col-span-3',
  '4': 'col-span-1 sm:col-span-2 lg:col-span-4',
  '5': 'col-span-1 sm:col-span-2 lg:col-span-5',
  '6': 'col-span-1 sm:col-span-3 lg:col-span-6',
  'full': 'col-span-full',
}

const breakpointColSpanMap: Record<string, string> = {
  'initial-1': 'col-span-1',
  'initial-2': 'col-span-2',
  'initial-3': 'col-span-3',
  'initial-4': 'col-span-4',
  'initial-5': 'col-span-5',
  'initial-6': 'col-span-6',
  'initial-full': 'col-span-full',
  'sm-1': 'sm:col-span-1',
  'sm-2': 'sm:col-span-2',
  'sm-3': 'sm:col-span-3',
  'sm-4': 'sm:col-span-4',
  'sm-5': 'sm:col-span-5',
  'sm-6': 'sm:col-span-6',
  'sm-full': 'sm:col-span-full',
  'md-1': 'md:col-span-1',
  'md-2': 'md:col-span-2',
  'md-3': 'md:col-span-3',
  'md-4': 'md:col-span-4',
  'md-5': 'md:col-span-5',
  'md-6': 'md:col-span-6',
  'md-full': 'md:col-span-full',
  'lg-1': 'lg:col-span-1',
  'lg-2': 'lg:col-span-2',
  'lg-3': 'lg:col-span-3',
  'lg-4': 'lg:col-span-4',
  'lg-5': 'lg:col-span-5',
  'lg-6': 'lg:col-span-6',
  'lg-full': 'lg:col-span-full',
  'xl-1': 'xl:col-span-1',
  'xl-2': 'xl:col-span-2',
  'xl-3': 'xl:col-span-3',
  'xl-4': 'xl:col-span-4',
  'xl-5': 'xl:col-span-5',
  'xl-6': 'xl:col-span-6',
  'xl-full': 'xl:col-span-full',
  '2xl-1': '2xl:col-span-1',
  '2xl-2': '2xl:col-span-2',
  '2xl-3': '2xl:col-span-3',
  '2xl-4': '2xl:col-span-4',
  '2xl-5': '2xl:col-span-5',
  '2xl-6': '2xl:col-span-6',
  '2xl-full': '2xl:col-span-full',
}

const defaultRowSpanMap: Record<string, string> = {
  '1': 'row-span-1',
  '2': 'row-span-1 md:row-span-2',
  '3': 'row-span-1 md:row-span-3',
  '4': 'row-span-1 md:row-span-4',
  'full': 'row-span-full',
}

const breakpointRowSpanMap: Record<string, string> = {
  'initial-1': 'row-span-1',
  'initial-2': 'row-span-2',
  'initial-3': 'row-span-3',
  'initial-4': 'row-span-4',
  'initial-full': 'row-span-full',
  'sm-1': 'sm:row-span-1',
  'sm-2': 'sm:row-span-2',
  'sm-3': 'sm:row-span-3',
  'sm-4': 'sm:row-span-4',
  'sm-full': 'sm:row-span-full',
  'md-1': 'md:row-span-1',
  'md-2': 'md:row-span-2',
  'md-3': 'md:row-span-3',
  'md-4': 'md:row-span-4',
  'md-full': 'md:row-span-full',
  'lg-1': 'lg:row-span-1',
  'lg-2': 'lg:row-span-2',
  'lg-3': 'lg:row-span-3',
  'lg-4': 'lg:row-span-4',
  'lg-full': 'lg:row-span-full',
  'xl-1': 'xl:row-span-1',
  'xl-2': 'xl:row-span-2',
  'xl-3': 'xl:row-span-3',
  'xl-4': 'xl:row-span-4',
  'xl-full': 'xl:row-span-full',
  '2xl-1': '2xl:row-span-1',
  '2xl-2': '2xl:row-span-2',
  '2xl-3': '2xl:row-span-3',
  '2xl-4': '2xl:row-span-4',
  '2xl-full': '2xl:row-span-full',
}

const rowHeightPresetMap: Record<string, string> = {
  xs: 'auto-rows-[12rem] sm:auto-rows-[14rem]',
  sm: 'auto-rows-[15rem] sm:auto-rows-[17rem]',
  md: 'auto-rows-[18rem] sm:auto-rows-[22rem]',
  lg: 'auto-rows-[22rem] sm:auto-rows-[26rem]',
  xl: 'auto-rows-[26rem] sm:auto-rows-[32rem]',
  auto: 'auto-rows-auto',
}

const bentoRowHeightMap: Record<string, string> = {
  xs: 'min-h-[12rem] sm:min-h-[14rem]',
  sm: 'min-h-[15rem] sm:min-h-[17rem]',
  md: 'min-h-[18rem] sm:min-h-[22rem]',
  lg: 'min-h-[22rem] sm:min-h-[26rem]',
  xl: 'min-h-[26rem] sm:min-h-[32rem]',
  auto: 'min-h-0',
}

const gapClasses: Record<BentoGap, string> = {
  none: 'gap-0',
  xs: 'gap-space-2xs',
  sm: 'gap-space-xs',
  md: 'gap-space-md',
  lg: 'gap-space-lg',
  xl: 'gap-space-xl',
}

const cardVariantClasses: Record<BentoCardVariant, string> = {
  default:
    'border-border/80 bg-card text-card-fg shadow-xs hover:border-border hover:shadow-md dark:hover:border-border/90',
  subtle:
    'border-border/60 bg-secondary/30 text-fg hover:border-border/90 hover:bg-secondary/50',
  bordered:
    'border-border bg-transparent text-fg hover:bg-muted/30 hover:border-border/90',
  flat:
    'border-transparent bg-muted/40 text-fg hover:bg-muted/60',
  glow:
    'border-primary/30 bg-overlay/60 text-fg backdrop-blur-xl ring-1 ring-primary/20 hover:border-primary/60 hover:ring-primary/40 hover:shadow-lg',
  interactive:
    'cursor-pointer border-border/80 bg-card text-card-fg shadow-xs hover:border-primary/50 hover:bg-overlay/80 hover:-translate-y-1 hover:shadow-lg active:scale-[0.99] active:translate-y-0',
}

/** Helper to resolve responsive column class names */
function resolveColsClass(cols?: ResponsiveCols): string {
  if (cols === undefined) return defaultGridColsMap[3]
  if (typeof cols === 'number') {
    return defaultGridColsMap[cols] || defaultGridColsMap[3]
  }
  const classes: string[] = []
  const keys: BreakpointKey[] = ['initial', 'sm', 'md', 'lg', 'xl', '2xl']
  for (const bp of keys) {
    const val = cols[bp]
    if (val !== undefined) {
      const cls = breakpointColsMap[`${bp}-${val}`]
      if (cls) classes.push(cls)
    }
  }
  return classes.length > 0 ? classes.join(' ') : defaultGridColsMap[3]
}

/** Helper to resolve responsive span class names */
function resolveSpanClass(
  span: ResponsiveSpan | undefined,
  defaultMap: Record<string, string>,
  breakpointMap: Record<string, string>,
  fallback: string
): string {
  if (span === undefined) return fallback
  if (typeof span === 'number' || typeof span === 'string') {
    return defaultMap[String(span)] || fallback
  }
  const classes: string[] = []
  const keys: BreakpointKey[] = ['initial', 'sm', 'md', 'lg', 'xl', '2xl']
  for (const bp of keys) {
    const val = span[bp]
    if (val !== undefined) {
      const cls = breakpointMap[`${bp}-${val}`]
      if (cls) classes.push(cls)
    }
  }
  return classes.length > 0 ? classes.join(' ') : fallback
}

/* ==========================================================================
   Bento Context & State Definitions
   ========================================================================== */

export interface BentoGridContextValue {
  /** Inherited responsive column structure */
  cols?: ResponsiveCols
  /** Inherited row height preset or arbitrary CSS length */
  rowHeight?: BentoRowHeight
  /** Inherited spacing gap */
  gap?: BentoGap
}

export const {
  Provider: BentoGridProvider,
  useCompoundContext: useBentoGridContext,
  useOptionalCompoundContext: useOptionalBentoGridContext,
  Context: BentoGridContext,
} = createCompoundContext<BentoGridContextValue>('BentoGrid')

/* ==========================================================================
   BentoGrid Slots & Props
   ========================================================================== */

export interface BentoGridSlots {
  /** Optional header container slot for whole bento section */
  header?: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
  /** Optional footer / action cluster slot */
  footer?: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
}

export interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Responsive column count: 1 to 6, or an object with responsive breakpoints
   * e.g. `{ initial: 1, sm: 2, md: 3, lg: 4 }`. Default is 3.
   */
  cols?: ResponsiveCols
  /**
   * Row height sizing preset: 'xs' (12-14rem), 'sm' (15-17rem), 'md' (18-22rem),
   * 'lg' (22-26rem), 'xl' (26-32rem), 'auto' (content-driven), or a custom CSS height string.
   */
  rowHeight?: BentoRowHeight
  /** Density-aware grid gap: 'none', 'xs', 'sm', 'md', 'lg', 'xl'. Default is 'md'. */
  gap?: BentoGap
  /**
   * Slot overrides.
   */
  slots?: SlotComponents<BentoGridSlots>
  /**
   * Slot props overrides.
   */
  slotProps?: SlotPropsMap<BentoGridSlots>
  /** BentoCard items, BentoGrid.Row children, or custom JSX. */
  children?: ReactNode
}

/* ==========================================================================
   BentoGrid Root Primitive
   ========================================================================== */

const BentoGridPrimitive = ({
  cols = 3,
  rowHeight = 'md',
  gap = 'md',
  slots = {},
  slotProps = {},
  className,
  style,
  children,
  ...props
}: BentoGridProps) => {
  const isCustomRowHeight =
    rowHeight && !rowHeightPresetMap[rowHeight] && rowHeight !== 'auto'

  const renderedHeader = renderSlot(slots.header, slotProps.header)
  const renderedFooter = renderSlot(slots.footer, slotProps.footer)

  return (
    <BentoGridProvider value={{ cols, rowHeight, gap }}>
      <div
        data-slot="bento-grid"
        className={cn(
          'grid w-full',
          resolveColsClass(cols),
          gapClasses[gap] || gapClasses.md,
          rowHeightPresetMap[rowHeight] || (rowHeight === 'auto' ? 'auto-rows-auto' : ''),
          className
        )}
        style={{
          ...(isCustomRowHeight ? { gridAutoRows: rowHeight } : {}),
          ...style,
        }}
        {...props}
      >
        {renderedHeader}
        {children}
        {renderedFooter}
      </div>
    </BentoGridProvider>
  )
}

/* ==========================================================================
   BentoRow Sub-Component (Row Understanding Primitive)
   ========================================================================== */

export interface BentoRowSlots {
  /** Optional background / decoration container */
  backdrop?: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
}

export interface BentoRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Responsive column count for this specific row.
   * Inherits from parent BentoGrid if omitted.
   */
  cols?: ResponsiveCols
  /**
   * Row height sizing preset: 'xs', 'sm', 'md', 'lg', 'xl', 'auto', or custom CSS string.
   * Inherits from parent BentoGrid if omitted.
   */
  rowHeight?: BentoRowHeight
  /** Density-aware gap for this row. Inherits from parent BentoGrid if omitted. */
  gap?: BentoGap
  /**
   * Vertical cross-axis alignment of cards within this row.
   */
  align?: 'stretch' | 'start' | 'center' | 'end'
  /** Slot overrides. */
  slots?: SlotComponents<BentoRowSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<BentoRowSlots>
  /** Cards or content belonging to this row. */
  children?: ReactNode
}

const alignClasses: Record<NonNullable<BentoRowProps['align']>, string> = {
  stretch: 'items-stretch',
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
}

const BentoRowPrimitive = ({
  cols,
  rowHeight,
  gap,
  align = 'stretch',
  slots = {},
  slotProps = {},
  className,
  style,
  children,
  ...props
}: BentoRowProps) => {
  const parentContext = useOptionalBentoGridContext()
  const effectiveCols = cols ?? parentContext?.cols ?? 3
  const effectiveRowHeight = rowHeight ?? parentContext?.rowHeight ?? 'auto'
  const effectiveGap = gap ?? parentContext?.gap ?? 'md'

  const isCustomRowHeight =
    effectiveRowHeight &&
    !bentoRowHeightMap[effectiveRowHeight] &&
    effectiveRowHeight !== 'auto'

  const renderedBackdrop = renderSlot(slots.backdrop, slotProps.backdrop)

  return (
    <div
      data-slot="bento-row"
      className={cn(
        'relative grid col-span-full w-full',
        resolveColsClass(effectiveCols),
        gapClasses[effectiveGap] || gapClasses.md,
        bentoRowHeightMap[effectiveRowHeight] || '',
        alignClasses[align],
        className
      )}
      style={{
        ...(isCustomRowHeight ? { minHeight: effectiveRowHeight } : {}),
        ...style,
      }}
      {...props}
    >
      {renderedBackdrop}
      {children}
    </div>
  )
}

export const BentoRow = createInterfaceComponent<BentoRowProps, BentoRowSlots>(
  {
    name: 'BentoRow',
    category: 'layout',
    description: 'Explicit horizontal row coordinator for multi-tier bento layouts with dedicated column partitioning and height control.',
    version: '1.0.0',
    props: {
      align: 'stretch',
    },
    slots: {
      backdrop: undefined,
    },
  },
  BentoRowPrimitive
)

/* ==========================================================================
   BentoCard Sub-Component
   ========================================================================== */

export interface BentoCardSlots {
  /** Top graphic, media, preview, or illustration slot. */
  header?: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
  /** Leading icon slot. */
  icon?: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
  /** Status or category badge slot. */
  badge?: React.ComponentType<BadgeProps>
  /** Bottom call-to-action button or link slot. */
  cta?: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
  /** Title heading slot. */
  title?: React.ComponentType<React.HTMLAttributes<HTMLHeadingElement>>
  /** Description paragraph slot. */
  description?: React.ComponentType<React.HTMLAttributes<HTMLParagraphElement>>
  /** Card footer action / metadata cluster slot. */
  footer?: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
}

const cardPaddingClasses: Record<'none' | 'sm' | 'md' | 'lg', string> = {
  none: 'p-0',
  sm: 'p-space-md',
  md: 'p-space-lg sm:p-space-xl',
  lg: 'p-space-xl sm:p-space-2xl',
}

export interface BentoCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /**
   * Horizontal column span: 1 to 6, 'full', or responsive object
   * e.g. `{ initial: 1, sm: 2, lg: 3 }`. Default is 1.
   */
  colSpan?: ResponsiveSpan
  /**
   * Vertical row span: 1 to 4, 'full', or responsive object
   * e.g. `{ initial: 1, md: 2 }`. Default is 1.
   */
  rowSpan?: ResponsiveSpan
  /** Visual surface variant: default, subtle, bordered, flat, glow, interactive. */
  variant?: BentoCardVariant
  /**
   * Internal padding ramp: 'none', 'sm', 'md', 'lg'. Default is 'md'.
   * Use 'none' for edge-to-edge media cards, full-bleed image backgrounds, or custom layouts.
   */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** Whether the card shows interactive hover elevation and tap dynamics. */
  interactive?: boolean
  /** Leading icon element. */
  icon?: ReactNode
  /** Title header string or element. */
  title?: ReactNode
  /** Description text or element. */
  description?: ReactNode
  /** Background graphic or media preview element. */
  header?: ReactNode
  /** Call to action button or element. */
  cta?: ReactNode
  /** Status or category badge element. */
  badge?: ReactNode
  /** Footer metadata or action element. */
  footer?: ReactNode
  /** Slot overrides. */
  slots?: SlotComponents<BentoCardSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<BentoCardSlots>
  /** Custom children (replaces default interior anatomy when provided). */
  children?: ReactNode
}

const BentoCardPrimitive = ({
  colSpan = 1,
  rowSpan = 1,
  variant = 'default',
  padding = 'md',
  interactive,
  icon,
  title,
  description,
  header,
  cta,
  badge,
  footer,
  slots = {},
  slotProps = {},
  className,
  children,
  ...props
}: BentoCardProps) => {
  const renderedHeader = renderSlot(slots.header, slotProps.header) ?? header
  const renderedIcon = renderSlot(slots.icon, slotProps.icon) ?? icon
  const renderedBadge = renderSlot(slots.badge, slotProps.badge) ?? badge
  const renderedCta = renderSlot(slots.cta, slotProps.cta) ?? cta
  const renderedTitle = renderSlot(slots.title, slotProps.title) ?? (
    title && (
      typeof title === 'string' ? (
        <h3 className="font-semibold text-base sm:text-lg text-fg tracking-tight leading-snug">
          {title}
        </h3>
      ) : (
        title
      )
    )
  )
  const renderedDescription = renderSlot(slots.description, slotProps.description) ?? (
    description && (
      typeof description === 'string' ? (
        <p className="text-muted-fg text-xs sm:text-sm leading-relaxed max-w-xl">
          {description}
        </p>
      ) : (
        description
      )
    )
  )
  const renderedFooter = renderSlot(slots.footer, slotProps.footer) ?? footer

  const effectiveVariant: BentoCardVariant =
    interactive && variant === 'default' ? 'interactive' : variant

  const colSpanClass = resolveSpanClass(
    colSpan,
    defaultColSpanMap,
    breakpointColSpanMap,
    'col-span-1'
  )

  const rowSpanClass = resolveSpanClass(
    rowSpan,
    defaultRowSpanMap,
    breakpointRowSpanMap,
    'row-span-1'
  )

  return (
    <div
      data-slot="bento-card"
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-macro border',
        cardPaddingClasses[padding] || cardPaddingClasses.md,
        'transition-all duration-300',
        cardVariantClasses[effectiveVariant] || cardVariantClasses.default,
        colSpanClass,
        rowSpanClass,
        className
      )}
      {...props}
    >
      {/* Background Graphic / Custom Media Header Slot */}
      {renderedHeader && (
        <div className="mb-space-md size-full max-h-56 overflow-hidden rounded-base">
          {renderedHeader}
        </div>
      )}

      {/* Main Content Area */}
      {children ? (
        children
      ) : (
        <div className="z-10 flex flex-1 flex-col justify-between gap-space-md">
          <div className="flex flex-col gap-space-sm">
            {/* Top metadata bar (Icon + Badge) */}
            {(renderedIcon || renderedBadge) && (
              <div className="flex items-center justify-between gap-space-xs">
                {renderedIcon && (
                  <div className="grid size-9 place-content-center rounded-base bg-muted text-fg transition-colors group-hover:bg-primary group-hover:text-primary-fg">
                    {renderedIcon}
                  </div>
                )}
                {renderedBadge && <div>{renderedBadge}</div>}
              </div>
            )}

            {/* Title & Description */}
            {(renderedTitle || renderedDescription) && (
              <div className="flex flex-1 flex-col gap-1.5">
                {renderedTitle}
                {renderedDescription}
              </div>
            )}
          </div>

          {/* Action / CTA & Footer */}
          {(renderedCta || renderedFooter) && (
            <div className="mt-auto flex items-center justify-between gap-space-md pt-space-xs">
              {renderedCta && <div>{renderedCta}</div>}
              {renderedFooter && (
                <div className="text-xs text-muted-fg">{renderedFooter}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export const BentoCard = createInterfaceComponent<BentoCardProps, BentoCardSlots>(
  {
    name: 'BentoCard',
    category: 'layout',
    description: 'Responsive spanning card cell within a BentoGrid featuring media header, icon, badge, and CTA slots.',
    version: '1.0.0',
    props: {
      colSpan: 1,
      rowSpan: 1,
      variant: 'default',
      padding: 'md',
    },
    slots: {
      header: undefined,
      icon: undefined,
      badge: undefined,
      cta: undefined,
      title: undefined,
      description: undefined,
      footer: undefined,
    },
  },
  BentoCardPrimitive
)

/* ==========================================================================
   Main Component Factory & Compound Attachments
   ========================================================================== */

export const BentoGrid = createInterfaceComponent<BentoGridProps, BentoGridSlots>(
  {
    name: 'BentoGrid',
    category: 'layout',
    description: 'Modern responsive asymmetrical bento grid layout with row-coordination, responsive spans, customizable row heights, and hover elevation.',
    version: '1.0.0',
    props: {
      cols: 3,
      rowHeight: 'md',
      gap: 'md',
    },
    slots: {
      header: undefined,
      footer: undefined,
    },
  },
  BentoGridPrimitive
)

// Compound family attachments (Rules C6 & C8)
BentoGrid.Card = BentoCard
BentoGrid.Row = BentoRow
BentoGrid.Provider = BentoGridProvider
