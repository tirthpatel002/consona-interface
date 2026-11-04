import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'

/* ==========================================================================
   Motion Spring Physics & Animation Curves
   ========================================================================== */

export interface NavSpringConfig {
  type: 'spring'
  bounce: number
  stiffness: number
  damping: number
}

const contentVariants = {
  initial: (direction: number) => ({
    x: `${70 * direction}%`,
    opacity: 0,
  }),
  active: {
    x: '0%',
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: `${-70 * direction}%`,
    opacity: 0,
  }),
}

/* ==========================================================================
   Shared Slot Props Interfaces (Rule C5.2)
   ========================================================================== */

export interface NavBadgeSlotProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Optional badge content or label. */
  children?: ReactNode
}

export interface NavMenuHeaderSlotProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional header slot content. */
  children?: ReactNode
}

export interface NavMenuFooterSlotProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional footer slot content. */
  children?: ReactNode
}

/* ==========================================================================
   Stable Default Slot Components (Rule C8.4)
   ========================================================================== */

const DefaultNavTriggerChevron = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <ChevronDownIcon
    className={cn(
      'size-3.5 opacity-60 transition-opacity group-hover/nav-trigger:opacity-100',
      className
    )}
    {...props}
  />
)

const DefaultNavLinkArrow = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <ChevronRightIcon
    className={cn(
      'size-4 shrink-0 mt-0.5 opacity-0 transition-all -translate-x-1 group-hover/nav-link:opacity-100 group-hover/nav-link:translate-x-0 text-muted-fg',
      className
    )}
    {...props}
  />
)

/* ==========================================================================
   Nav Context
   ========================================================================== */

export interface NavContentRecord {
  children: ReactNode
  className?: string
  innerClassName?: string
}

export interface NavContextValue {
  /** Active value of the currently open menu dropdown. */
  activeValue: string
  /** Direction index (-1 for left, 1 for right) for sliding content animations. */
  direction: number
  /** Spring transition physics. */
  spring: NavSpringConfig
  /** Whether the dynamic floating viewport is enabled. */
  viewport: boolean
  /** Calculated horizontal X offset for centering the viewport under the active trigger. */
  viewportX: number | null
  /** Programmatically retrieve registered mega-menu content by item value. */
  getContent: (value: string) => NavContentRecord | undefined
  /** Programmatically open a menu by value. */
  openValue: (value: string) => void
  /** Programmatically close any active menu immediately. */
  closeMenu: () => void
  /** Cancel any pending close timer when pointer enters triggers or viewport. */
  cancelCloseTimer: () => void
  /** Schedule debounced menu closing when pointer leaves nav regions. */
  scheduleCloseMenu: (delay?: number) => void
  /** Register mega-menu content in the content ref. */
  registerContent: (value: string, content: NavContentRecord) => () => void
  /** Re-calculate viewport dimensions and centering position. */
  updateViewportPosition: () => void
}

export const {
  Context: NavContext,
  useCompoundContext: useNavContext,
  useOptionalCompoundContext: useOptionalNavContext,
} = createCompoundContext<NavContextValue>('Nav')

export interface NavItemContextValue {
  /** Value identifying this navigation item. */
  value?: string
  /** Whether this item's menu is currently open. */
  isOpen: boolean
}

export const {
  Context: NavItemContext,
  useCompoundContext: useNavItemContext,
  useOptionalCompoundContext: useOptionalNavItemContext,
} = createCompoundContext<NavItemContextValue>('NavItem')

/* ==========================================================================
   Data Item Definition (For Rule C8 Fail-Closed Auto-Render Mode)
   ========================================================================== */

export interface NavItemLinkConfig {
  /** Unique key or identifier. */
  id?: string
  /** Title of the sub-link. */
  title: string
  /** Optional description copy for rich mega-menu layouts. */
  description?: string
  /** Link destination URL. */
  href?: string
  /** Optional leading icon element. */
  icon?: ReactNode
  /** Optional badge text or chip. */
  badge?: string
  /** Optional click handler. */
  onClick?: () => void
}

export interface NavItemConfig {
  /** Value identifying this menu item. */
  value: string
  /** Display label on the trigger button. */
  label: string
  /** Optional leading icon for the trigger. */
  icon?: ReactNode
  /** Optional badge text. */
  badge?: string
  /** Direct link URL if this item is a simple link rather than a dropdown menu. */
  href?: string
  /** Child links rendered inside the mega-menu dropdown. */
  children?: NavItemLinkConfig[]
}

/* ==========================================================================
   Nav Root Component
   ========================================================================== */

export interface NavSlots {
  /** Primary list container slot. */
  list?: React.ComponentType<NavListProps>
  /** Morphing spring floating viewport slot. */
  viewport?: React.ComponentType<NavViewportProps>
  /** Pointer arrow indicator slot. */
  indicator?: React.ComponentType<NavIndicatorProps>
}

export interface NavProps
  extends Omit<React.ComponentPropsWithRef<'nav'>, 'onValueChange'> {
  /** Optional compound children elements. */
  children?: ReactNode
  /** Controlled active menu value. */
  value?: string
  /** Uncontrolled default active menu value. */
  defaultValue?: string
  /** Callback fired when the active menu value changes. */
  onValueChange?: (value: string) => void
  /** Whether the floating morphing spring viewport is enabled. Defaults to true. */
  viewport?: boolean
  /** Custom CSS classes for the floating viewport container. */
  viewportClassName?: string
  /** Spring bounce physics factor (0 to 1). Defaults to 0. */
  springBounce?: number
  /** Spring stiffness factor. Defaults to 350. */
  springStiffness?: number
  /** Spring damping factor. Defaults to 32. */
  springDamping?: number
  /** Structured item array for fail-closed automatic rendering (Rule C8). */
  items?: NavItemConfig[]
  /** Slot component overrides. */
  slots?: SlotComponents<NavSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<NavSlots>
}

const NavPrimitive = ({
  className,
  viewport = true,
  viewportClassName,
  springBounce = 0,
  springStiffness = 350,
  springDamping = 32,
  value: controlledValue,
  defaultValue = '',
  onValueChange,
  items,
  slots = {},
  slotProps = {},
  children,
  onPointerEnter,
  onPointerLeave,
  onKeyDown,
  ...props
}: NavProps) => {
  const rootRef = useRef<HTMLElement | null>(null)
  const frameRef = useRef<number | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActiveValueRef = useRef(controlledValue ?? defaultValue)
  const isControlled = controlledValue !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue)
  const [direction, setDirection] = useState(1)
  const [viewportX, setViewportX] = useState<number | null>(null)
  const contentMapRef = useRef<Record<string, NavContentRecord>>({})

  const activeValue = controlledValue ?? internalValue

  const spring = useMemo<NavSpringConfig>(
    () => ({
      type: 'spring',
      bounce: springBounce,
      stiffness: springStiffness,
      damping: springDamping,
    }),
    [springBounce, springStiffness, springDamping]
  )

  const cancelCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const getItemValues = useCallback(() => {
    const root = rootRef.current
    if (!root) return []
    return Array.from(
      root.querySelectorAll<HTMLElement>('[data-slot="nav-item"][data-value]'),
      (item) => item.dataset.value ?? ''
    ).filter(Boolean)
  }, [])

  const updateViewportPosition = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
    }

    frameRef.current = requestAnimationFrame(() => {
      const root = rootRef.current
      if (!root) return

      const rootRect = root.getBoundingClientRect()
      const activeTrigger = root.querySelector<HTMLElement>(
        '[data-slot="nav-trigger"][data-state="open"]'
      )

      if (!activeTrigger) {
        setViewportX(rootRect.width / 2)
        return
      }

      const triggerRect = activeTrigger.getBoundingClientRect()
      const idealX = triggerRect.left - rootRect.left + triggerRect.width / 2

      const measureEl = document.querySelector<HTMLElement>('[data-slot="nav-measure"]')
      const viewportEl = root.querySelector<HTMLElement>('[data-slot="nav-viewport"]')
      const contentWidth =
        (measureEl ? measureEl.offsetWidth : 0) || (viewportEl ? viewportEl.offsetWidth : 0)
      const half = contentWidth / 2

      if (contentWidth > 0) {
        let boundary: DOMRect | null = null
        let ancestor = root.parentElement
        while (ancestor && ancestor !== document.body) {
          const style = window.getComputedStyle(ancestor)
          const overflow = style.overflow + style.overflowX
          if (/hidden|clip|scroll|auto/.test(overflow)) {
            boundary = ancestor.getBoundingClientRect()
            break
          }
          ancestor = ancestor.parentElement
        }
        if (!boundary) {
          boundary = document.documentElement.getBoundingClientRect()
        }

        const margin = 12
        const dropLeft = rootRect.left + idealX - half
        const dropRight = rootRect.left + idealX + half

        let adjustment = 0
        if (dropLeft < boundary.left + margin) {
          adjustment = boundary.left + margin - dropLeft
        } else if (dropRight > boundary.right - margin) {
          adjustment = boundary.right - margin - dropRight
        }

        setViewportX(idealX + adjustment)
      } else {
        setViewportX(idealX)
      }
    })
  }, [])

  const setActiveValue = useCallback(
    (nextValue: string) => {
      if (!isControlled) {
        setInternalValue(nextValue)
      }
      onValueChange?.(nextValue)
    },
    [isControlled, onValueChange]
  )

  const openValue = useCallback(
    (nextValue: string) => {
      cancelCloseTimer()
      if (!nextValue || nextValue === lastActiveValueRef.current) return

      const itemValues = getItemValues()
      const previousIndex = itemValues.indexOf(lastActiveValueRef.current)
      const nextIndex = itemValues.indexOf(nextValue)

      if (previousIndex !== -1 && nextIndex !== -1) {
        setDirection(nextIndex > previousIndex ? 1 : -1)
      }

      lastActiveValueRef.current = nextValue
      setActiveValue(nextValue)
      updateViewportPosition()
    },
    [cancelCloseTimer, getItemValues, setActiveValue, updateViewportPosition]
  )

  const closeMenu = useCallback(() => {
    cancelCloseTimer()
    lastActiveValueRef.current = ''
    setActiveValue('')
    updateViewportPosition()
  }, [cancelCloseTimer, setActiveValue, updateViewportPosition])

  const scheduleCloseMenu = useCallback(
    (delay = 150) => {
      cancelCloseTimer()
      closeTimerRef.current = setTimeout(() => {
        closeMenu()
      }, delay)
    },
    [cancelCloseTimer, closeMenu]
  )

  const registerContent = useCallback((val: string, content: NavContentRecord) => {
    contentMapRef.current[val] = content
    return () => {
      delete contentMapRef.current[val]
    }
  }, [])

  const getContent = useCallback((val: string) => {
    return contentMapRef.current[val]
  }, [])

  useEffect(() => {
    if (controlledValue === undefined) return
    if (!controlledValue) {
      lastActiveValueRef.current = ''
      return
    }
    openValue(controlledValue)
  }, [controlledValue, openValue])

  useLayoutEffect(() => {
    updateViewportPosition()
  }, [activeValue, updateViewportPosition])

  // Click outside to dismiss menu
  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && event.target instanceof Node && !rootRef.current.contains(event.target)) {
        closeMenu()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      cancelCloseTimer()
    }
  }, [closeMenu, cancelCloseTimer])

  const contextValue = useMemo<NavContextValue>(
    () => ({
      activeValue,
      direction,
      spring,
      viewport,
      viewportX,
      getContent,
      openValue,
      closeMenu,
      cancelCloseTimer,
      scheduleCloseMenu,
      registerContent,
      updateViewportPosition,
    }),
    [
      activeValue,
      direction,
      spring,
      viewport,
      viewportX,
      getContent,
      openValue,
      closeMenu,
      cancelCloseTimer,
      scheduleCloseMenu,
      registerContent,
      updateViewportPosition,
    ]
  )

  const navItems = items ?? (children == null ? [] : undefined)

  return (
    <NavContext.Provider value={contextValue}>
      <nav
        ref={rootRef}
        data-slot="nav"
        data-viewport={viewport}
        className={cn(
          'group/nav relative flex max-w-max flex-1 items-center justify-center rounded-macro border border-border/60 bg-bg/85 backdrop-blur-xl shadow-lg shadow-black/5 px-2 py-1',
          className
        )}
        onPointerEnter={(event) => {
          onPointerEnter?.(event)
          cancelCloseTimer()
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event)
          scheduleCloseMenu(180)
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.key === 'Escape') {
            closeMenu()
          }
        }}
        {...props}
      >
        {children != null ? (
          children
        ) : (
          renderSlot(
            slots.list,
            {
              items: navItems,
              ...slotProps?.list,
            },
            {
              defaultComponent: NavList,
            }
          )
        )}

        {renderSlot(slots.indicator, slotProps?.indicator)}

        {viewport &&
          renderSlot(
            slots.viewport,
            {
              className: viewportClassName,
              ...slotProps?.viewport,
            },
            {
              defaultComponent: NavViewport,
            }
          )}
      </nav>
    </NavContext.Provider>
  )
}

export const Nav = createInterfaceComponent<NavProps, NavSlots>(
  {
    name: 'Nav',
    category: 'navigation',
    description: 'Spring-animated navigation bar focused strictly on NavItems with morphing dropdown viewports.',
    version: '1.0.0',
    props: {
      viewport: true,
    },
    slots: {
      list: undefined,
      viewport: undefined,
      indicator: undefined,
    },
  },
  NavPrimitive
)

/* ==========================================================================
   NavList Sub-Component
   ========================================================================== */

export interface NavListSlots {
  /** Custom item slot for rendering interactive items in collection mode. */
  item?: React.ComponentType<NavItemProps>
}

export interface NavListProps extends React.ComponentPropsWithRef<'ul'> {
  /** Structured item array passed from parent data mode. */
  items?: NavItemConfig[]
  /** Optional child elements. */
  children?: ReactNode
  /** Slot component overrides. */
  slots?: SlotComponents<NavListSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<NavListSlots>
}

const NavListPrimitive = ({
  className,
  items,
  children,
  slots = {},
  slotProps = {},
  ...props
}: NavListProps) => {
  return (
    <ul
      data-slot="nav-list"
      role="menubar"
      className={cn(
        'group/nav-list relative z-10 flex flex-1 list-none items-center justify-center gap-1',
        className
      )}
      {...props}
    >
      {children != null
        ? children
        : items?.map((item) =>
            renderSlot(
              slots.item,
              {
                key: item.value,
                value: item.value,
                children:
                  item.children && item.children.length > 0 ? (
                    <>
                      <NavTrigger icon={item.icon} badge={item.badge}>
                        {item.label}
                      </NavTrigger>
                      <NavMenu>
                        <div className="grid w-full max-w-lg sm:w-115 grid-cols-1 sm:grid-cols-2 gap-space-sm p-space-sm">
                          {item.children.map((sub) => (
                            <NavbarLink
                              key={sub.title}
                              href={sub.href}
                              title={sub.title}
                              description={sub.description}
                              icon={sub.icon}
                              badge={sub.badge}
                              onClick={sub.onClick}
                            />
                          ))}
                        </div>
                      </NavMenu>
                    </>
                  ) : (
                    <NavbarLink href={item.href} icon={item.icon} badge={item.badge}>
                      {item.label}
                    </NavbarLink>
                  ),
                ...slotProps?.item,
              },
              {
                defaultComponent: NavItem,
              }
            )
          )}
    </ul>
  )
}

export const NavList = createInterfaceComponent<NavListProps, NavListSlots>(
  {
    name: 'NavList',
    category: 'navigation',
    description: 'Menubar row wrapping navigation items in a horizontal list.',
    version: '1.0.0',
    slots: {
      item: undefined,
    },
  },
  NavListPrimitive
)

/* ==========================================================================
   NavItem Sub-Component
   ========================================================================== */

export interface NavItemSlots { }

export interface NavItemProps extends React.ComponentPropsWithRef<'li'> {
  /** Value identifying this navigation item and coordinating open dropdown state. */
  value?: string
  /** Slot component overrides. */
  slots?: SlotComponents<NavItemSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<NavItemSlots>
}

const NavItemPrimitive = ({
  className,
  value,
  children,
  slots = {},
  slotProps = {},
  ...props
}: NavItemProps) => {
  const context = useOptionalNavContext()
  const isOpen = Boolean(value && context?.activeValue === value)

  const itemContextValue = useMemo<NavItemContextValue>(
    () => ({ value, isOpen }),
    [value, isOpen]
  )

  return (
    <NavItemContext.Provider value={itemContextValue}>
      <li
        data-slot="nav-item"
        data-value={value}
        data-state={isOpen ? 'open' : 'closed'}
        role="none"
        className={cn('relative inline-flex shrink-0 items-center', className)}
        {...props}
      >
        {children}
      </li>
    </NavItemContext.Provider>
  )
}

export const NavItem = createInterfaceComponent<NavItemProps, NavItemSlots>(
  {
    name: 'NavItem',
    category: 'navigation',
    description: 'Individual navigation item container binding value to child triggers and dropdown menus.',
    version: '1.0.0',
  },
  NavItemPrimitive
)

/* ==========================================================================
   NavTrigger Sub-Component (Spring Animated Rotating Chevron)
   ========================================================================== */

export interface NavTriggerSlots {
  /** Leading icon slot. */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Trailing rotating chevron icon slot. */
  chevron?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Status badge slot. */
  badge?: React.ComponentType<NavBadgeSlotProps>
}

export interface NavTriggerProps
  extends React.ComponentPropsWithRef<'button'> {
  /** Optional icon rendered before label. */
  icon?: ReactNode
  /** Optional badge content rendered next to label. */
  badge?: ReactNode
  /** Whether to hide the default rotating chevron icon. */
  hideChevron?: boolean
  /** Slot component overrides. */
  slots?: SlotComponents<NavTriggerSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<NavTriggerSlots>
}

const NavTriggerPrimitive = ({
  className,
  icon,
  badge,
  hideChevron = false,
  children,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onClick,
  slots = {},
  slotProps = {},
  ...props
}: NavTriggerProps) => {
  const context = useOptionalNavContext()
  const itemContext = useOptionalNavItemContext()
  const value = itemContext?.value
  const isOpen = Boolean(value && context?.activeValue === value)

  return (
    <button
      type="button"
      data-slot="nav-trigger"
      data-state={isOpen ? 'open' : 'closed'}
      aria-expanded={isOpen}
      aria-haspopup="menu"
      className={cn(
        'group/nav-trigger inline-flex h-9 w-max items-center justify-center gap-1.5 rounded-base bg-transparent px-3 py-1.5 text-sm font-medium text-muted-fg hover:text-fg hover:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-ring outline-none transition-colors select-none data-[state=open]:text-fg data-[state=open]:bg-secondary/70 disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      onPointerEnter={(event) => {
        onPointerEnter?.(event)
        if (value && context) {
          context.cancelCloseTimer()
          context.openValue(value)
        }
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event)
        if (context) {
          context.scheduleCloseMenu(180)
        }
      }}
      onFocus={(event) => {
        onFocus?.(event)
        if (value && context) {
          context.cancelCloseTimer()
          context.openValue(value)
        }
      }}
      onClick={(event) => {
        onClick?.(event)
        if (value && context) {
          if (isOpen) {
            context.closeMenu()
          } else {
            context.openValue(value)
          }
        }
      }}
      {...props}
    >
      {icon && <span data-slot="icon" className="inline-flex size-3.5 shrink-0 items-center justify-center text-muted-fg">{icon}</span>}
      {renderSlot(slots.icon, slotProps?.icon)}
      <span className="leading-none text-sm font-medium">{children}</span>
      {badge && (
        <span
          data-slot="badge"
          className="rounded-micro bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary"
        >
          {badge}
        </span>
      )}
      {renderSlot(slots.badge, slotProps?.badge)}
      {!hideChevron && (
        <motion.span
          aria-hidden="true"
          animate={{
            rotate: isOpen ? 180 : 0,
            y: isOpen ? 1 : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 22,
          }}
          className="relative top-0 ml-0.5 inline-flex shrink-0 items-center justify-center"
        >
          {renderSlot(
            slots.chevron,
            slotProps?.chevron,
            {
              defaultComponent: DefaultNavTriggerChevron,
            }
          )}
        </motion.span>
      )}
    </button>
  )
}

export const NavTrigger = createInterfaceComponent<NavTriggerProps, NavTriggerSlots>(
  {
    name: 'NavTrigger',
    category: 'navigation',
    description: 'Interactive button opening associated dropdown mega-menus with spring-animated rotating chevrons.',
    version: '1.0.0',
    props: {
      hideChevron: false,
    },
    slots: {
      icon: undefined,
      chevron: undefined,
      badge: undefined,
    },
  },
  NavTriggerPrimitive
)

/* ==========================================================================
   NavMenu Sub-Component (Mega-Menu Content)
   ========================================================================== */

export interface NavMenuSlots {
  /** Header chrome slot inside the menu panel. */
  header?: React.ComponentType<NavMenuHeaderSlotProps>
  /** Footer chrome slot inside the menu panel. */
  footer?: React.ComponentType<NavMenuFooterSlotProps>
}

export interface NavMenuProps
  extends Omit<React.ComponentPropsWithRef<'div'>, 'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart'> {
  /** Custom CSS classes for the inner menu wrapper. */
  innerClassName?: string
  /** Slot component overrides. */
  slots?: SlotComponents<NavMenuSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<NavMenuSlots>
}

const NavMenuPrimitive = ({
  className,
  innerClassName,
  children,
  slots = {},
  slotProps = {},
  ...props
}: NavMenuProps) => {
  const context = useOptionalNavContext()
  const itemContext = useOptionalNavItemContext()
  const value = itemContext?.value
  const isOpen = Boolean(value && context?.activeValue === value)

  useLayoutEffect(() => {
    if (!context || !value || !context.viewport) return

    return context.registerContent(value, {
      children,
      className,
      innerClassName,
    })
  }, [children, className, context, innerClassName, value])

  // If using shared morphing viewport, the viewport renders this content
  if (!context || !value || context.viewport) {
    return null
  }

  // Standalone mode when viewport is false
  return (
    <AnimatePresence initial={false} custom={context.direction}>
      {isOpen && (
        <motion.div
          data-slot="nav-menu"
          key={value}
          custom={context.direction}
          variants={contentVariants}
          initial="initial"
          animate="active"
          exit="exit"
          transition={context.spring}
          className={cn(
            'absolute top-full left-0 z-50 mt-2 rounded-macro border border-border/60 bg-overlay/95 p-space-md shadow-xl backdrop-blur-2xl text-fg min-w-70 max-w-[calc(100vw-2rem)]',
            className
          )}
          onPointerEnter={() => context.cancelCloseTimer()}
          onPointerLeave={() => context.scheduleCloseMenu(180)}
          {...props}
        >
          {renderSlot(slots.header, slotProps?.header)}
          <div className={cn('relative z-10', innerClassName)}>{children}</div>
          {renderSlot(slots.footer, slotProps?.footer)}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export const NavMenu = createInterfaceComponent<NavMenuProps, NavMenuSlots>(
  {
    name: 'NavMenu',
    category: 'navigation',
    description: 'Mega-menu content dropdown panel registered with the shared morphing spring viewport.',
    version: '1.0.0',
    slots: {
      header: undefined,
      footer: undefined,
    },
  },
  NavMenuPrimitive
)

export const NavContent = NavMenu

/* ==========================================================================
   NavLink Sub-Component (Interactive Menu Row / Card / Top-Level Bar Link)
   ========================================================================== */

export interface NavbarLinkSlots {
  /** Leading icon slot. */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Status badge slot. */
  badge?: React.ComponentType<NavBadgeSlotProps>
  /** Trailing arrow or accelerator indicator slot. */
  arrow?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface NavbarLinkProps
  extends React.ComponentPropsWithRef<'a'> {
  /** Title header text for rich card layouts. */
  title?: string
  /** Sub-title description copy. */
  description?: string
  /** Optional icon element. */
  icon?: ReactNode
  /** Optional badge text or node. */
  badge?: ReactNode
  /** Whether the link is currently selected/active. */
  isActive?: boolean
  /** Slot component overrides. */
  slots?: SlotComponents<NavbarLinkSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<NavbarLinkSlots>
}

const NavLinkPrimitive = ({
  className,
  title,
  description,
  icon,
  badge,
  isActive = false,
  children,
  onClick,
  slots = {},
  slotProps = {},
  ...props
}: NavbarLinkProps) => {
  const isCard = Boolean(description)

  return (
    <a
      data-slot="nav-link"
      data-active={isActive}
      className={cn(
        isCard
          ? 'group/nav-link flex items-start gap-3 rounded-macro border border-border/40 bg-card/60 p-3 hover:border-border hover:bg-secondary/50 hover:shadow-sm text-sm text-fg transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring'
          : 'group/nav-link inline-flex h-9 items-center justify-center gap-1.5 rounded-base px-3 py-1.5 text-sm font-medium text-muted-fg hover:text-fg hover:bg-secondary/60 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring data-[active=true]:text-fg data-[active=true]:bg-secondary/70',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {icon && (
        <span
          data-slot="icon"
          className={cn(
            'inline-flex shrink-0 items-center justify-center text-muted-fg transition-colors group-hover/nav-link:text-primary',
            isCard
              ? 'size-9 rounded-base bg-secondary/80 p-2 text-primary'
              : 'size-3.5'
          )}
        >
          {icon}
        </span>
      )}
      {renderSlot(slots.icon, slotProps?.icon)}

      {isCard ? (
        <div className="flex flex-1 flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-medium text-fg">
            <span className="truncate">{title || children}</span>
            {badge && (
              <span
                data-slot="badge"
                className="rounded-micro bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary shrink-0"
              >
                {badge}
              </span>
            )}
            {renderSlot(slots.badge, slotProps?.badge)}
          </div>
          {description && (
            <p className="line-clamp-2 text-xs text-muted-fg group-hover/nav-link:text-fg/80 transition-colors">
              {description}
            </p>
          )}
        </div>
      ) : (
        <>
          <span className="leading-none text-sm font-medium">{title || children}</span>
          {badge && (
            <span
              data-slot="badge"
              className="rounded-micro bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary"
            >
              {badge}
            </span>
          )}
          {renderSlot(slots.badge, slotProps?.badge)}
        </>
      )}

      {isCard &&
        renderSlot(
          slots.arrow,
          slotProps?.arrow,
          {
            defaultComponent: DefaultNavLinkArrow,
          }
        )}
    </a>
  )
}

export const NavbarLink = createInterfaceComponent<NavbarLinkProps, NavbarLinkSlots>(
  {
    name: 'NavbarLink',
    category: 'navigation',
    description: 'Interactive navigation item row or media card supporting leading icons, descriptions, badges, and top-level menubar alignment.',
    version: '1.0.0',
    props: {
      isActive: false,
    },
    slots: {
      icon: undefined,
      badge: undefined,
      arrow: undefined,
    },
  },
  NavLinkPrimitive
)


/* ==========================================================================
   NavViewport Sub-Component (Morphing Spring Viewport)
   ========================================================================== */

export interface NavViewportSlots { }

export interface NavViewportProps
  extends Omit<React.ComponentPropsWithRef<'div'>, 'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart'> {
  /** Slot component overrides. */
  slots?: SlotComponents<NavViewportSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<NavViewportSlots>
}

const NavViewportPrimitive = ({
  className,
  slots = {},
  slotProps = {},
  ...props
}: NavViewportProps) => {
  const context = useOptionalNavContext()
  const measureRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [lastSize, setLastSize] = useState({ width: 0, height: 0 })

  const activeContent = context?.activeValue ? context.getContent(context.activeValue) : undefined

  useLayoutEffect(() => {
    const node = measureRef.current
    if (!node || !activeContent) return

    const updateSize = () => {
      const rect = node.getBoundingClientRect()
      const nextSize = {
        width: rect.width,
        height: rect.height,
      }

      setSize(nextSize)

      if (nextSize.width > 0 || nextSize.height > 0) {
        setLastSize(nextSize)
      }

      context?.updateViewportPosition()
    }

    updateSize()

    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(updateSize)
    observer.observe(node)

    return () => observer.disconnect()
  }, [activeContent, context])

  const width = size.width > 0 ? size.width : lastSize.width
  const height = size.height > 0 ? size.height : lastSize.height
  const isOpen = Boolean(activeContent && context?.activeValue)

  return (
    <motion.div
      data-slot="nav-viewport-container"
      className={cn(
        'absolute top-full isolate z-50 flex -translate-x-1/2 justify-center max-w-[calc(100vw-2rem)]',
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      )}
      initial={false}
      animate={{ left: context?.viewportX ?? '50%' }}
      transition={context?.spring}
      onPointerEnter={() => context?.cancelCloseTimer()}
      onPointerLeave={() => context?.scheduleCloseMenu(180)}
    >
      <motion.div
        data-slot="nav-viewport"
        initial={false}
        animate={{
          width: isOpen ? width : 0,
          height: isOpen ? height : 0,
          opacity: isOpen ? 1 : 0,
          scale: isOpen ? 1 : 0.95,
        }}
        transition={context?.spring}
        className={cn(
          'relative mt-2 overflow-hidden rounded-macro border border-border/60 bg-overlay/95 text-fg shadow-2xl backdrop-blur-2xl transition-colors max-w-[calc(100vw-2rem)]',
          className
        )}
        {...props}
      >
        <AnimatePresence mode="popLayout" initial={false} custom={context?.direction ?? 1}>
          {isOpen && context?.activeValue && activeContent && (
            <motion.div
              data-slot="nav-viewport-content"
              key={context.activeValue}
              custom={context.direction}
              variants={contentVariants}
              initial="initial"
              animate="active"
              exit="exit"
              transition={context.spring}
              className={cn(activeContent.className)}
            >
              <div className={cn('relative z-10', activeContent.innerClassName)}>
                {activeContent.children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Invisible fixed measurement node that prevents page horizontal overflow */}
      <div
        ref={measureRef}
        aria-hidden="true"
        data-slot="nav-measure"
        style={{
          position: 'fixed',
          top: -99999,
          left: -99999,
          visibility: 'hidden',
          pointerEvents: 'none',
          zIndex: -9999,
          opacity: 0,
          width: 'max-content',
        }}
      >
        {activeContent && (
          <div className={cn(activeContent.className)}>
            <div className={cn('relative z-10', activeContent.innerClassName)}>
              {activeContent.children}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export const NavViewport = createInterfaceComponent<NavViewportProps, NavViewportSlots>(
  {
    name: 'NavViewport',
    category: 'navigation',
    description: 'Floating spring-animated morphing viewport dynamically sizing and positioning under active triggers.',
    version: '1.0.0',
  },
  NavViewportPrimitive
)

/* ==========================================================================
   NavIndicator Sub-Component
   ========================================================================== */

export interface NavIndicatorSlots { }

export interface NavIndicatorProps extends React.ComponentPropsWithRef<'div'> {
  /** Slot component overrides. */
  slots?: SlotComponents<NavIndicatorSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<NavIndicatorSlots>
}

const NavIndicatorPrimitive = ({
  className,
  slots = {},
  slotProps = {},
  ...props
}: NavIndicatorProps) => {
  return (
    <div
      data-slot="nav-indicator"
      className={cn(
        'pointer-events-none top-full z-1 flex h-1.5 items-end justify-center overflow-hidden',
        className
      )}
      {...props}
    >
      <div className="relative top-[60%] size-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
    </div>
  )
}

export const NavIndicator = createInterfaceComponent<NavIndicatorProps, NavIndicatorSlots>(
  {
    name: 'NavIndicator',
    category: 'navigation',
    description: 'Pointer arrow indicator highlighting the active top-level trigger.',
    version: '1.0.0',
  },
  NavIndicatorPrimitive
)

/* ==========================================================================
   Compound Family Namespace Attachments
   ========================================================================== */

Nav.List = NavList
Nav.Item = NavItem
Nav.Trigger = NavTrigger
Nav.Menu = NavMenu
Nav.Content = NavContent
Nav.Link = NavbarLink
Nav.Viewport = NavViewport
Nav.Indicator = NavIndicator

export default Nav