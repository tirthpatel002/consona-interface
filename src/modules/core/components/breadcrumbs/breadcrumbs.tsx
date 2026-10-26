import React, { createContext, useContext } from 'react'
import {
  Breadcrumbs as RACBreadcrumbs,
  type BreadcrumbsProps as RACBreadcrumbsProps,
  Breadcrumb as RACBreadcrumb,
  type BreadcrumbProps as RACBreadcrumbProps,
  type LinkProps as RACLinkProps,
} from 'react-aria-components'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { Link } from '../link'

/* ==========================================================================
   Breadcrumbs Context
   ========================================================================== */

export type BreadcrumbsSeparatorType = 'chevron' | 'slash' | 'arrow' | 'bullet' | boolean

export interface BreadcrumbsContextValue {
  separator?: BreadcrumbsSeparatorType
}

export const BreadcrumbsContext = createContext<BreadcrumbsContextValue>({
  separator: 'chevron',
})

export const BreadcrumbsProvider = BreadcrumbsContext.Provider
export const useBreadcrumbsContext = () => useContext(BreadcrumbsContext)

/* ==========================================================================
   Breadcrumbs Root Primitive & Factory
   ========================================================================== */

export interface BreadcrumbsSlots {}

export interface BreadcrumbsProps<T extends object = object>
  extends RACBreadcrumbsProps<T> {
  /** Separator icon or character: chevron, slash, arrow, bullet, or false. */
  separator?: BreadcrumbsSeparatorType
  /** Child breadcrumb items or compound elements */
  children?: React.ReactNode | ((values: any) => React.ReactNode)
  /** Additional CSS class names. */
  className?: string
  /** Slot component overrides. */
  slots?: SlotComponents<BreadcrumbsSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<BreadcrumbsSlots>
}

const BreadcrumbsPrimitive = <T extends object = object>({
  className,
  separator = 'chevron',
  slots = {},
  slotProps = {},
  children,
  ...props
}: BreadcrumbsProps<T>) => {
  return (
    <BreadcrumbsContext.Provider value={{ separator }}>
      <RACBreadcrumbs
        data-slot="breadcrumbs"
        className={cn('flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-muted-fg', className)}
        {...props}
      >
        {children}
      </RACBreadcrumbs>
    </BreadcrumbsContext.Provider>
  )
}

export const Breadcrumbs = createInterfaceComponent<BreadcrumbsProps<any>, BreadcrumbsSlots>(
  {
    name: 'Breadcrumbs',
    category: 'navigation',
    description: 'Hierarchical navigation trail with custom separators, truncating ellipsis, and current page ARIA semantics.',
    version: '1.0.0',
    props: {
      separator: 'chevron',
    },
    slots: {},
  },
  BreadcrumbsPrimitive
)

/* ==========================================================================
   Breadcrumb Item Sub-Atom
   ========================================================================== */

export interface BreadcrumbItemSlots {
  /** Leading icon component */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface BreadcrumbItemProps extends RACBreadcrumbProps {
  /** Explicit override for current page state */
  isCurrent?: boolean
  /** Separator override for this specific item */
  separator?: BreadcrumbsSeparatorType
  /** Force showing separator even if current item (e.g. when forward routes exist) */
  showTrailingSeparator?: boolean
  /** Destination hyperlink URL */
  href?: string
  /** Link target attribute */
  target?: string
  /** Link rel attribute */
  rel?: string
  /** Additional CSS class names */
  className?: string
  /** Flyout menu or sibling options displayed on hover/click over the item text */
  menu?: React.ReactNode | ((opts: { isCurrent: boolean; close: () => void }) => React.ReactNode)
  /** Flyout menu or forward routes displayed on hover/click over the separator arrow icon */
  separatorMenu?: React.ReactNode | ((opts: { isCurrent: boolean; close: () => void }) => React.ReactNode)
  /** Trigger mode for opening menus (defaults to 'hover') */
  trigger?: 'hover' | 'click' | 'both'
  /** Delay in ms before opening menu on hover (default 120ms) */
  openDelayMs?: number
  /** Delay in ms before closing menu on mouse leave (default 180ms) */
  closeDelayMs?: number
  /** Slot component overrides */
  slots?: SlotComponents<BreadcrumbItemSlots>
  /** Slot props overrides */
  slotProps?: SlotPropsMap<BreadcrumbItemSlots>
  /** Content children, or a render prop. With `separator={false}` and no href/menus, a render prop owns full item chrome (compose). */
  children?: React.ReactNode | ((opts: { isCurrent: boolean }) => React.ReactNode)
}

const BreadcrumbItemPrimitive = ({
  className,
  separator: itemSeparator,
  showTrailingSeparator,
  isCurrent: itemIsCurrent,
  href,
  target,
  rel,
  menu,
  separatorMenu,
  trigger = 'hover',
  openDelayMs = 80,
  closeDelayMs = 220,
  slots = {},
  slotProps = {},
  children,
  ...props
}: BreadcrumbItemProps) => {
  const context = useContext(BreadcrumbsContext)
  const separator = itemSeparator !== undefined ? itemSeparator : context.separator
  
  // Item text menu state
  const [isOpen, setIsOpen] = React.useState(false)
  const openTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Separator arrow menu state (for forward routes)
  const [isSeparatorOpen, setIsSeparatorOpen] = React.useState(false)
  const openSeparatorTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeSeparatorTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const separatorRef = React.useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => {
    if (trigger === 'click' || !menu) return
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    openTimerRef.current = setTimeout(() => setIsOpen(true), openDelayMs)
  }

  const handleMouseLeave = () => {
    if (trigger === 'click' || !menu) return
    if (openTimerRef.current) clearTimeout(openTimerRef.current)
    closeTimerRef.current = setTimeout(() => setIsOpen(false), closeDelayMs)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (trigger === 'hover' || !menu) return
    if (trigger === 'click' || trigger === 'both') {
      setIsOpen((prev) => !prev)
    }
  }

  const handleSeparatorMouseEnter = () => {
    if (trigger === 'click' || !separatorMenu) return
    if (closeSeparatorTimerRef.current) clearTimeout(closeSeparatorTimerRef.current)
    openSeparatorTimerRef.current = setTimeout(() => setIsSeparatorOpen(true), openDelayMs)
  }

  const handleSeparatorMouseLeave = () => {
    if (trigger === 'click' || !separatorMenu) return
    if (openSeparatorTimerRef.current) clearTimeout(openSeparatorTimerRef.current)
    closeSeparatorTimerRef.current = setTimeout(() => setIsSeparatorOpen(false), closeDelayMs)
  }

  const handleSeparatorClick = (e: React.MouseEvent) => {
    if (!separatorMenu) return
    e.stopPropagation()
    if (trigger === 'click' || trigger === 'both') {
      setIsSeparatorOpen((prev) => !prev)
    }
  }

  const closeMenu = React.useCallback(() => {
    setIsOpen(false)
  }, [])

  const closeSeparatorMenu = React.useCallback(() => {
    setIsSeparatorOpen(false)
  }, [])

  // Close on outside click
  React.useEffect(() => {
    if (!isOpen && !isSeparatorOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return

      // Don't close if clicking inside any breadcrumb container, menu, or portal submenu
      if (
        containerRef.current?.contains(target) ||
        separatorRef.current?.contains(target) ||
        target.closest('[data-slot="breadcrumb-menu"]') ||
        target.closest('[data-slot="breadcrumb-separator-menu"]') ||
        target.closest('[data-slot="nav-cascaded-submenu"]') ||
        target.closest('[data-slot="nav-level-menu"]')
      ) {
        return
      }

      setIsOpen(false)
      setIsSeparatorOpen(false)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setIsSeparatorOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isSeparatorOpen])

  // Screen boundary alignment calculation
  const [menuAlign, setMenuAlign] = React.useState<'left' | 'right'>('left')
  const [separatorAlign, setSeparatorAlign] = React.useState<'center' | 'right' | 'left'>('center')

  React.useEffect(() => {
    if (!isOpen || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    if (rect.left + 300 > window.innerWidth - 16) {
      setMenuAlign('right')
    } else {
      setMenuAlign('left')
    }
  }, [isOpen])

  React.useEffect(() => {
    if (!isSeparatorOpen || !separatorRef.current) return
    const rect = separatorRef.current.getBoundingClientRect()
    if (rect.left + 160 > window.innerWidth - 16) {
      setSeparatorAlign('right')
    } else if (rect.left < 160) {
      setSeparatorAlign('left')
    } else {
      setSeparatorAlign('center')
    }
  }, [isSeparatorOpen])

  return (
    <RACBreadcrumb
      data-slot="breadcrumb-item"
      className={cn('inline-flex items-center gap-1.5 text-xs sm:text-sm relative', className)}
      {...props}
    >
      {({ isCurrent: racIsCurrent }) => {
        const isCurrent = itemIsCurrent !== undefined ? itemIsCurrent : racIsCurrent
        const renderSeparator = (!isCurrent || showTrailingSeparator) && separator !== false

        // C8 compose: consumer owns full item chrome (e.g. NavBreadcrumbs pill + separator).
        // Skip padded Link/span wrapper so layout spacing isn't doubled.
        if (
          typeof children === 'function' &&
          separator === false &&
          !href &&
          !menu &&
          !separatorMenu
        ) {
          return children({ isCurrent })
        }

        return (
          <div className="inline-flex items-center gap-1.5 relative">
            <div
              ref={containerRef}
              className="inline-flex items-center gap-1.5 relative group"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={handleClick}
            >
              {href && !isCurrent ? (
                <Link
                  href={href}
                  target={target}
                  rel={rel}
                  intent="secondary"
                  underline="hover"
                  className={cn(
                    'inline-flex items-center gap-space-xs text-muted-fg hover:text-fg font-normal transition-colors py-0.5 px-1 rounded-micro hover:bg-muted/40',
                    isOpen && 'bg-muted/60 text-fg'
                  )}
                >
                  {renderSlot(slots.icon, slotProps.icon)}
                  {typeof children === 'function' ? children({ isCurrent }) : children}
                </Link>
              ) : (
                <span
                  data-slot="breadcrumb-current"
                  aria-current={isCurrent ? 'page' : undefined}
                  className={cn(
                    'inline-flex items-center gap-space-xs py-0.5 px-1 rounded-micro transition-colors',
                    isCurrent ? 'font-semibold text-fg select-none' : 'text-muted-fg hover:text-fg',
                    isOpen && 'bg-muted/60 text-fg',
                    menu && 'cursor-pointer hover:bg-muted/40'
                  )}
                >
                  {renderSlot(slots.icon, slotProps.icon)}
                  {typeof children === 'function' ? children({ isCurrent }) : children}
                </span>
              )}

              {/* Item Text Hover / Click Flyout Overlay with Screen Boundary Awareness */}
              {menu && isOpen && (
                <div
                  data-slot="breadcrumb-menu"
                  className={cn(
                    'absolute top-full mt-1 z-50 min-w-56 max-w-sm rounded-macro border border-border bg-bg p-1.5 shadow-lg animate-in fade-in-0 zoom-in-95 duration-100',
                    menuAlign === 'right' ? 'right-0' : 'left-0'
                  )}
                >
                  {typeof menu === 'function' ? menu({ isCurrent, close: closeMenu }) : menu}
                </div>
              )}
            </div>

            {/* Separator Arrow & Forward Routes Menu with Screen Boundary Awareness */}
            {renderSeparator && (
              <div
                ref={separatorRef}
                className="relative inline-flex items-center"
                onMouseEnter={handleSeparatorMouseEnter}
                onMouseLeave={handleSeparatorMouseLeave}
                onClick={handleSeparatorClick}
              >
                <BreadcrumbSeparator
                  separator={separator}
                  className={cn(
                    'transition-colors duration-150',
                    separatorMenu &&
                      'cursor-pointer hover:text-fg hover:bg-muted/60 px-0.5 py-0.5 rounded-micro select-none',
                    isSeparatorOpen && 'text-fg bg-muted/70 ring-1 ring-border/50'
                  )}
                />

                {/* Separator Forward Routes Flyout Menu */}
                {separatorMenu && isSeparatorOpen && (
                  <div
                    data-slot="breadcrumb-separator-menu"
                    className={cn(
                      'absolute top-full mt-1 z-50 min-w-56 max-w-sm rounded-macro border border-border bg-bg p-1.5 shadow-lg animate-in fade-in-0 zoom-in-95 duration-100',
                      separatorAlign === 'right'
                        ? 'right-0'
                        : separatorAlign === 'left'
                        ? 'left-0'
                        : 'left-1/2 -translate-x-1/2'
                    )}
                  >
                    {typeof separatorMenu === 'function'
                      ? separatorMenu({ isCurrent, close: closeSeparatorMenu })
                      : separatorMenu}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      }}
    </RACBreadcrumb>
  )
}

export const BreadcrumbItem = createInterfaceComponent<BreadcrumbItemProps, BreadcrumbItemSlots>(
  {
    name: 'BreadcrumbItem',
    category: 'navigation',
    description: 'Individual navigation segment within breadcrumb trails with optional hover level menus.',
    version: '1.0.0',
    slots: {
      icon: undefined,
    },
  },
  BreadcrumbItemPrimitive
)

/* ==========================================================================
   Breadcrumb Separator Helper
   ========================================================================== */

export interface BreadcrumbSeparatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** separator */
  separator?: BreadcrumbsSeparatorType
}

const BreadcrumbSeparatorPrimitive = ({
  className,
  separator = 'chevron',
  ...props
}: BreadcrumbSeparatorProps) => {
  return (
    <span
      data-slot="breadcrumb-separator"
      aria-hidden="true"
      className={cn('inline-flex shrink-0 select-none text-muted-fg/60', className)}
      {...props}
    >
      {separator === 'chevron' && <ChevronRightIcon className="size-3.5" />}
      {separator === 'slash' && <span className="font-mono text-xs">/</span>}
      {separator === 'arrow' && <span className="text-xs">→</span>}
      {separator === 'bullet' && <span className="text-xs">•</span>}
    </span>
  )
}

export const BreadcrumbSeparator = createInterfaceComponent<BreadcrumbSeparatorProps>(
  {
    name: 'BreadcrumbSeparator',
    category: 'navigation',
    description: 'Divider glyph between consecutive breadcrumb items.',
    version: '1.0.0',
  },
  BreadcrumbSeparatorPrimitive
)

// Namespace attachments for compound family ergonomics
Breadcrumbs.Provider = BreadcrumbsProvider
Breadcrumbs.Item = BreadcrumbItem
Breadcrumbs.Separator = BreadcrumbSeparator
