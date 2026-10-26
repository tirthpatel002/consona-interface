import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { cn } from '../../../../core/cn'
import type { NavNode } from '../../engine/types'
import {
  MagnifyingGlassIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/20/solid'

/* ==========================================================================
   Motion Spring Physics & Animation Curves (Inspired by Core Nav)
   ========================================================================== */

export interface NavLevelSpringConfig {
  type: 'spring'
  bounce: number
  stiffness: number
  damping: number
}

const DEFAULT_SPRING: NavLevelSpringConfig = {
  type: 'spring',
  bounce: 0,
  stiffness: 350,
  damping: 32,
}

const verticalSlideVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    y: `${25 * dir}%`,
  }),
  center: {
    opacity: 1,
    y: '0%',
  },
  exit: (dir: number) => ({
    opacity: 0,
    y: `${-25 * dir}%`,
  }),
}

/* ==========================================================================
   Slot Definitions
   ========================================================================== */

export interface NavLevelMenuItemSlotProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  key?: React.Key
  item: NavNode
  index: number
  activeId?: string
  isSubmenuActive?: boolean
  onSelect?: (item: NavNode) => void
  onHoverItem?: (item: NavNode, index: number, rowElement: HTMLElement) => void
  onLeaveItem?: (item: NavNode) => void
  slots?: SlotComponents<NavLevelMenuSlots>
  slotProps?: SlotPropsMap<NavLevelMenuSlots>
}

export interface NavLevelMenuHeaderSlotProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  children?: ReactNode
}

export interface NavLevelMenuFooterSlotProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
}

export interface NavLevelMenuSlots {
  /** Search icon slot */
  searchIcon?: React.ComponentType<{ className?: string }>
  /** Search clear icon slot */
  clearIcon?: React.ComponentType<{ className?: string }>
  /** Trailing chevron icon slot */
  chevron?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Header chrome slot */
  header?: React.ComponentType<NavLevelMenuHeaderSlotProps>
  /** Footer chrome slot */
  footer?: React.ComponentType<NavLevelMenuFooterSlotProps>
  /** Custom row item slot */
  item?: React.ComponentType<NavLevelMenuItemSlotProps>
}

export interface NavLevelMenuProps {
  /** Sibling or level options to display */
  items: NavNode[]
  /** Currently active node ID at this level */
  activeId?: string
  /** Callback fired when an item is selected */
  onSelect?: (item: NavNode) => void
  /** Title or level label displayed at top of the menu */
  title?: string
  /** Whether to show a search filter box when item count exceeds threshold */
  searchable?: boolean
  /** Minimum items before search box is shown (default 8) */
  searchThreshold?: number
  /** Maximum height in pixels for the scrollable items area */
  maxHeight?: number
  /** Spring bounce physics factor (0 to 1). Defaults to 0. */
  springBounce?: number
  /** Spring stiffness factor. Defaults to 350. */
  springStiffness?: number
  /** Spring damping factor. Defaults to 32. */
  springDamping?: number
  /** Additional CSS class names */
  className?: string
  /** Slot overrides */
  slots?: SlotComponents<NavLevelMenuSlots>
  /** Slot props overrides */
  slotProps?: SlotPropsMap<NavLevelMenuSlots>
  /** Children elements */
  children?: ReactNode
}

/* ==========================================================================
   Default Slot Icons
   ========================================================================== */

const DefaultSearchIcon = ({ className, ...props }: { className?: string }) => (
  <MagnifyingGlassIcon
    className={cn('size-3.5 absolute left-2.5 text-muted-fg pointer-events-none shrink-0', className)}
    {...props}
  />
)

const DefaultClearIcon = ({ className, ...props }: { className?: string }) => (
  <XMarkIcon className={cn('size-3 text-muted-fg hover:text-fg', className)} {...props} />
)

const DefaultRowChevron = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <ChevronRightIcon
    className={cn('size-3.5 shrink-0 transition-transform duration-200 group-hover/row:translate-x-0.5', className)}
    {...props}
  />
)

const DefaultLevelMenuHeader = ({ children }: { children?: ReactNode }) => <>{children}</>

/* ==========================================================================
   NavMenuItemRow (Item Component)
   ========================================================================== */

const NavMenuItemRow: React.FC<NavLevelMenuItemSlotProps> = ({
  item,
  index,
  activeId,
  isSubmenuActive = false,
  onSelect,
  onHoverItem,
  onLeaveItem,
  slots = {},
  slotProps = {},
  className,
  ...props
}) => {
  const rowRef = useRef<HTMLDivElement>(null)

  const isSelected = item.id === activeId
  const Icon = item.icon
  const hasChildren = Boolean(item.children && item.children.length > 0)

  const badgeText = typeof item.badge === 'string' ? item.badge : item.badge?.text
  const badgeIntent = typeof item.badge === 'object' ? item.badge.intent : undefined

  const handleMouseEnter = () => {
    if (rowRef.current) {
      onHoverItem?.(item, index, rowRef.current)
    }
  }

  const handleMouseLeave = () => {
    onLeaveItem?.(item)
  }

  const handleRowClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (item.disabled) return
    onSelect?.(item)
  }

  return (
    <div
      ref={rowRef}
      className={cn('relative w-full', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <div
        role="menuitem"
        tabIndex={item.disabled ? -1 : 0}
        aria-disabled={item.disabled}
        aria-haspopup={hasChildren ? 'menu' : undefined}
        aria-expanded={hasChildren ? isSubmenuActive : undefined}
        onClick={handleRowClick}
        onKeyDown={(e) => {
          if (item.disabled) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            e.stopPropagation()
            onSelect?.(item)
          }
        }}
        className={cn(
          'group/row flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-micro text-left transition-all duration-150 cursor-pointer select-none w-full outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isSelected
            ? 'bg-primary/10 text-primary font-semibold'
            : isSubmenuActive
              ? 'bg-secondary/80 text-fg font-medium shadow-xs'
              : 'text-fg/90 hover:bg-secondary/60 hover:text-fg',
          item.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {Icon && (
            <span
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-micro transition-colors',
                isSelected
                  ? 'text-primary bg-primary/15'
                  : isSubmenuActive
                    ? 'text-fg bg-secondary/80'
                    : 'text-muted-fg group-hover/row:text-primary group-hover/row:bg-primary/10'
              )}
            >
              <Icon className="size-3.5 shrink-0" />
            </span>
          )}

          <div className="flex flex-col min-w-0 flex-1">
            <span className="truncate text-xs font-medium leading-snug">{item.title}</span>
            {item.description && (
              <span className="text-[10px] text-muted-fg group-hover/row:text-fg/80 truncate leading-tight transition-colors">
                {item.description}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {badgeText && (
            <span
              className={cn(
                'rounded-micro px-1.5 py-0.5 text-[10px] font-mono font-semibold border shrink-0',
                badgeIntent === 'primary'
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : badgeIntent === 'danger'
                    ? 'bg-danger/10 border-danger/30 text-danger'
                    : badgeIntent === 'success'
                      ? 'bg-success/10 border-success/30 text-success'
                      : badgeIntent === 'warning'
                        ? 'bg-warning/10 border-warning/30 text-warning'
                        : 'bg-muted/80 border-border/60 text-muted-fg'
              )}
            >
              {badgeText}
            </span>
          )}

          {isSelected && !hasChildren && (
            <CheckIcon className="size-3.5 text-primary shrink-0 opacity-80" />
          )}

          {hasChildren &&
            renderSlot(
              slots.chevron,
              {
                className: cn(
                  'size-3.5 transition-all duration-150',
                  isSubmenuActive ? 'text-fg translate-x-0.5' : 'text-muted-fg group-hover/row:text-fg'
                ),
                ...slotProps.chevron,
              },
              { defaultComponent: DefaultRowChevron }
            )}
        </div>
      </div>
    </div>
  )
}

/* ==========================================================================
   Submenu Position & Sizing Interface
   ========================================================================== */

interface ActiveSubmenuState {
  item: NavNode
  index: number
  pos: { top: number; left: number; width: number; maxHeight: number }
}

/* ==========================================================================
   NavLevelMenu Primitive & Component
   ========================================================================== */

const NavLevelMenuPrimitive: React.FC<NavLevelMenuProps> = ({
  items,
  activeId,
  onSelect,
  title,
  searchable = true,
  searchThreshold = 8,
  maxHeight = 300,
  springBounce = 0,
  springStiffness = 350,
  springDamping = 32,
  className,
  slots = {},
  slotProps = {},
  children,
}) => {
  const [query, setQuery] = useState('')
  const [activeSubmenu, setActiveSubmenu] = useState<ActiveSubmenuState | null>(null)
  const [verticalDirection, setVerticalDirection] = useState<number>(0)
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)

  const prefersReducedMotion = useReducedMotion()
  const menuContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const submenuMeasureRef = useRef<HTMLDivElement>(null)
  const isInitialSubmenuOpenRef = useRef(true)

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInsideSubmenuRef = useRef(false)

  // Spring dimensions for morphing cascading submenu
  const [submenuSize, setSubmenuSize] = useState({ width: 230, height: 0 })
  const [lastSubmenuSize, setLastSubmenuSize] = useState({ width: 230, height: 0 })

  const spring = useMemo<NavLevelSpringConfig>(
    () => ({
      type: 'spring',
      bounce: springBounce,
      stiffness: springStiffness,
      damping: springDamping,
    }),
    [springBounce, springStiffness, springDamping]
  )

  // Measure cascading submenu dimensions using fixed offscreen measure element
  useLayoutEffect(() => {
    const el = submenuMeasureRef.current
    if (!el || !activeSubmenu) return

    const updateSubmenuDimensions = () => {
      const rect = el.getBoundingClientRect()
      const targetWidth = activeSubmenu.pos.width || 240
      const nextSize = {
        width: targetWidth,
        height: Math.min(rect.height + 12, activeSubmenu.pos.maxHeight),
      }

      setSubmenuSize(nextSize)
      if (nextSize.width > 0 || nextSize.height > 0) {
        setLastSubmenuSize(nextSize)
        isInitialSubmenuOpenRef.current = false
      }
    }

    updateSubmenuDimensions()

    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(updateSubmenuDimensions)
    observer.observe(el)
    return () => observer.disconnect()
  }, [activeSubmenu])

  const clearTimers = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }
  }, [])

  const calculateSubmenuPosition = useCallback((rowElement: HTMLElement) => {
    const rect = rowElement.getBoundingClientRect()
    const parentContainer = menuContainerRef.current
    const parentMenuWidth = parentContainer ? parentContainer.offsetWidth : 240
    const targetWidth = parentMenuWidth > 0 ? parentMenuWidth : 240
    const padding = 12

    // Check right boundary with 2px overlap to eliminate dead cursor air gaps
    const flipLeft = rect.right + targetWidth > (typeof window !== 'undefined' ? window.innerWidth - padding : 1000)
    const left = flipLeft
      ? Math.max(padding, rect.left - targetWidth + 2)
      : Math.min(
          typeof window !== 'undefined' ? window.innerWidth - targetWidth - padding : rect.right,
          rect.right - 2
        )

    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800
    // Position the submenu a bit higher (rect.top - 12) so diagonal cursor movement stays comfortably inside submenu top bounds
    const top = Math.max(padding, Math.min(rect.top - 12, windowHeight - 280))
    const maxHeightCalc = Math.min(460, Math.max(160, windowHeight - top - padding))

    return { top, left, width: targetWidth, maxHeight: maxHeightCalc }
  }, [])

  const handleHoverItem = useCallback(
    (item: NavNode, index: number, rowElement: HTMLElement) => {
      clearTimers()

      if (item.children && item.children.length > 0) {
        const pos = calculateSubmenuPosition(rowElement)
        if (activeSubmenu) {
          const dir =
            index !== activeSubmenu.index
              ? index > activeSubmenu.index
                ? 1
                : -1
              : pos.top > activeSubmenu.pos.top
                ? 1
                : pos.top < activeSubmenu.pos.top
                  ? -1
                  : 0

          setVerticalDirection(dir)
          setActiveSubmenu({ item, index, pos })
        } else {
          setVerticalDirection(0)
          openTimerRef.current = setTimeout(() => {
            const freshPos = calculateSubmenuPosition(rowElement)
            setActiveSubmenu({ item, index, pos: freshPos })
          }, 60)
        }
      } else {
        closeTimerRef.current = setTimeout(() => {
          if (!isInsideSubmenuRef.current) {
            setActiveSubmenu(null)
          }
        }, 180)
      }
    },
    [activeSubmenu, calculateSubmenuPosition, clearTimers]
  )

  const handleLeaveItem = useCallback(
    (_item: NavNode) => {
      clearTimers()
      closeTimerRef.current = setTimeout(() => {
        if (!isInsideSubmenuRef.current) {
          setActiveSubmenu(null)
        }
      }, 180)
    },
    [clearTimers]
  )

  const handleSubmenuMouseEnter = useCallback(() => {
    isInsideSubmenuRef.current = true
    clearTimers()
  }, [clearTimers])

  const handleSubmenuMouseLeave = useCallback(() => {
    isInsideSubmenuRef.current = false
    clearTimers()
    closeTimerRef.current = setTimeout(() => {
      setActiveSubmenu(null)
    }, 180)
  }, [clearTimers])

  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [clearTimers])

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items
    const q = query.toLowerCase().trim()
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.shortTitle && item.shortTitle.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q))
    )
  }, [items, query])

  const showSearch = searchable && items.length >= searchThreshold

  // Keyboard navigation within the level list
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1))
    } else if (e.key === 'Home') {
      e.preventDefault()
      setFocusedIndex(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setFocusedIndex(filteredItems.length - 1)
    } else if (e.key === 'ArrowRight') {
      if (focusedIndex >= 0 && focusedIndex < filteredItems.length) {
        const item = filteredItems[focusedIndex]
        if (item && item.children && item.children.length > 0) {
          e.preventDefault()
          const rows = menuContainerRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]')
          const targetRow = rows?.[focusedIndex]
          if (targetRow) {
            const pos = calculateSubmenuPosition(targetRow)
            setActiveSubmenu({ item, index: focusedIndex, pos })
          }
        }
      }
    } else if (e.key === 'ArrowLeft') {
      if (activeSubmenu) {
        e.preventDefault()
        setActiveSubmenu(null)
      }
    }
  }

  const submenuW = submenuSize.width > 0 ? submenuSize.width : lastSubmenuSize.width
  const submenuH = submenuSize.height > 0 ? submenuSize.height : lastSubmenuSize.height
  const isSubmenuOpen = Boolean(activeSubmenu && activeSubmenu.item.children && activeSubmenu.item.children.length > 0)

  return (
    <div
      ref={menuContainerRef}
      data-slot="nav-level-menu"
      role="menu"
      aria-label={title || 'Navigation Level Menu'}
      className={cn('flex flex-col gap-1 text-xs w-full select-none max-h-100 overflow-hidden', className)}
      onKeyDown={handleKeyDown}
    >
      {/* Optional Level Title / Header */}
      {title &&
        renderSlot(
          slots.header,
          {
            title,
            children: (
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-fg/80 border-b border-border/50 shrink-0 select-none">
                {title}
              </div>
            ),
            ...slotProps.header,
          },
          {
            defaultComponent: DefaultLevelMenuHeader,
          }
        )}

      {/* Quick Search Filter */}
      {showSearch && (
        <div className="p-1 pb-1.5 border-b border-border/60 shrink-0">
          <div className="relative flex items-center">
            {renderSlot(
              slots.searchIcon,
              slotProps.searchIcon,
              { defaultComponent: DefaultSearchIcon }
            )}
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setFocusedIndex(-1)
              }}
              placeholder="Filter options..."
              className="w-full pl-8 pr-7 py-1 text-xs rounded-micro bg-secondary/50 border border-border/60 text-fg placeholder:text-muted-fg/70 focus:outline-hidden focus:border-primary/60 focus:ring-1 focus:ring-primary/40 font-sans transition-colors"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                e.stopPropagation()
                if (e.key === 'Escape') {
                  if (query) {
                    setQuery('')
                  }
                }
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  searchInputRef.current?.focus()
                }}
                className="absolute right-2 flex size-4 items-center justify-center rounded-micro hover:bg-muted/70 transition-colors"
              >
                {renderSlot(
                  slots.clearIcon,
                  slotProps.clearIcon,
                  { defaultComponent: DefaultClearIcon }
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Scrollable Items List */}
      <div
        style={{ maxHeight: `${maxHeight}px` }}
        className="flex flex-col gap-0.5 overflow-y-auto overscroll-contain py-0.5 pr-0.5 min-h-0 scrollbar-thin"
      >
        {filteredItems.length === 0 ? (
          <div className="px-3 py-3 text-center text-muted-fg text-[11px] italic">
            No matching options found.
          </div>
        ) : (
          filteredItems.map((item, idx) =>
            renderSlot(
              slots.item,
              {
                key: item.id,
                item,
                index: idx,
                activeId,
                isSubmenuActive: activeSubmenu?.item.id === item.id,
                onSelect,
                onHoverItem: handleHoverItem,
                onLeaveItem: handleLeaveItem,
                slots,
                slotProps,
                ...slotProps.item,
              },
              {
                defaultComponent: NavMenuItemRow,
              }
            )
          )
        )}
      </div>

      {children}

      {/* Optional Footer */}
      {renderSlot(slots.footer, slotProps.footer)}

      {/* Exactly ONE coordinated child submenu per menu level using morphing spring viewport */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isSubmenuOpen && activeSubmenu && (
              <motion.div
                key="nav-cascaded-submenu-container"
                data-slot="nav-cascaded-submenu-container"
                initial={false}
                animate={{
                  top: activeSubmenu.pos.top,
                  left: activeSubmenu.pos.left,
                }}
                transition={spring}
                style={{
                  position: 'fixed',
                  zIndex: 99999,
                  width: `${activeSubmenu.pos.width}px`,
                  maxWidth: `${activeSubmenu.pos.width}px`,
                }}
                className="pointer-events-auto"
                onMouseEnter={handleSubmenuMouseEnter}
                onMouseLeave={handleSubmenuMouseLeave}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div
                  data-slot="nav-cascaded-submenu"
                  initial={{
                    opacity: 0,
                    scale: 0.95,
                  }}
                  animate={{
                    width: activeSubmenu.pos.width,
                    height: submenuH > 0 ? submenuH : undefined,
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.95,
                    transition: { duration: 0.12 },
                  }}
                  transition={spring}
                  style={{
                    width: `${activeSubmenu.pos.width}px`,
                    maxWidth: `${activeSubmenu.pos.width}px`,
                    maxHeight: `${activeSubmenu.pos.maxHeight}px`,
                  }}
                  className="flex flex-col rounded-macro border border-border/60 bg-overlay/95 p-1.5 shadow-2xl backdrop-blur-2xl text-fg select-none overflow-hidden ring-1 ring-black/5 dark:ring-white/10 w-full"
                >
                  <AnimatePresence mode="popLayout" initial={false} custom={verticalDirection}>
                    <motion.div
                      key={activeSubmenu.item.id}
                      custom={verticalDirection}
                      variants={verticalSlideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={spring}
                      className="w-full flex flex-col"
                    >
                      <NavLevelMenu
                        items={activeSubmenu.item.children!}
                        activeId={activeId}
                        title={activeSubmenu.item.title}
                        onSelect={onSelect}
                        springBounce={springBounce}
                        springStiffness={springStiffness}
                        springDamping={springDamping}
                        maxHeight={activeSubmenu.pos.maxHeight - 32}
                      />
                    </motion.div>
                  </AnimatePresence>
                </motion.div>

                {/* Offscreen fixed measurement element */}
                <div
                  ref={submenuMeasureRef}
                  aria-hidden="true"
                  data-slot="nav-level-submenu-measure"
                  style={{
                    position: 'fixed',
                    top: -99999,
                    left: -99999,
                    visibility: 'hidden',
                    pointerEvents: 'none',
                    zIndex: -9999,
                    opacity: 0,
                    width: `${activeSubmenu.pos.width}px`,
                    maxWidth: `${activeSubmenu.pos.width}px`,
                  }}
                >
                  <div className="p-1.5 w-full">
                    <NavLevelMenu
                      items={activeSubmenu.item.children!}
                      activeId={activeId}
                      title={activeSubmenu.item.title}
                      maxHeight={activeSubmenu.pos.maxHeight - 32}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  )
}

export const NavLevelMenu = createInterfaceComponent<NavLevelMenuProps, NavLevelMenuSlots>(
  {
    name: 'NavLevelMenu',
    category: 'navigation',
    description: 'Spring-animated hierarchical flyout menu listing sibling options, categories, and child branches with morphing viewports and cascading submenus.',
    version: '1.0.0',
    slots: {
      searchIcon: DefaultSearchIcon,
      clearIcon: DefaultClearIcon,
      chevron: DefaultRowChevron,
      header: undefined,
      footer: undefined,
      item: undefined,
    },
  },
  NavLevelMenuPrimitive
)

/* ==========================================================================
   Compound Sub-Components
   ========================================================================== */

export const NavMenuItem = NavMenuItemRow
export const NavLevelMenuSearch = DefaultSearchIcon

export default NavLevelMenu
