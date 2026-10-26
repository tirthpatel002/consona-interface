import React, {
  useContext,
  useMemo,
  useState,
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
import {
  Breadcrumbs,
  BreadcrumbItem,
  BreadcrumbSeparator,
  type BreadcrumbsSeparatorType,
} from '../../../core/components/breadcrumbs'
import { NavigationContext } from '../../context/navigation-context'
import { NavLevelMenu, type NavLevelMenuProps } from '../nav-level-menu'
import type { NavNode, NavTrailStep, NavTree } from '../../engine/types'
import { NavigationEngine } from '../../engine/navigation-engine'

/* ==========================================================================
   Motion Spring Physics & Animation Curves (Inspired by Core Nav)
   ========================================================================== */

export interface NavBreadcrumbsSpringConfig {
  type: 'spring'
  bounce: number
  stiffness: number
  damping: number
}

const DEFAULT_SPRING: NavBreadcrumbsSpringConfig = {
  type: 'spring',
  bounce: 0,
  stiffness: 350,
  damping: 32,
}

const horizontalSlideVariants = {
  initial: (direction: number) => ({
    x: `${40 * direction}%`,
    opacity: 0,
  }),
  active: {
    x: '0%',
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: `${-40 * direction}%`,
    opacity: 0,
  }),
}

/* ==========================================================================
   Slot Definitions
   ========================================================================== */

export interface NavBreadcrumbItemSlotProps {
  step: NavTrailStep
  index: number
  isCurrent: boolean
  isOpen: boolean
  onSelect: (node: NavNode) => void
  children?: ReactNode
}

export interface NavBreadcrumbSeparatorSlotProps {
  step: NavTrailStep
  index: number
  separator: BreadcrumbsSeparatorType
  isOpen: boolean
  children?: ReactNode
}

export interface NavBreadcrumbsViewportSlotProps {
  isOpen: boolean
  children?: ReactNode
  className?: string
}

export interface NavBreadcrumbsSlots {
  /** Custom level menu slot */
  levelMenu?: React.ComponentType<NavLevelMenuProps>
  /** Custom breadcrumb item slot */
  item?: React.ComponentType<NavBreadcrumbItemSlotProps>
  /** Custom separator slot */
  separator?: React.ComponentType<NavBreadcrumbSeparatorSlotProps>
  /** Custom viewport slot */
  viewport?: React.ComponentType<NavBreadcrumbsViewportSlotProps>
}

export interface NavBreadcrumbsProps {
  /** Optional tree definition when used standalone without NavigationProvider */
  tree?: NavTree
  /** Optional active node ID when used standalone */
  activeId?: string
  /** Optional custom NavigationEngine instance */
  engine?: NavigationEngine
  /** Breadcrumb separator glyph: chevron, slash, arrow, bullet */
  separator?: BreadcrumbsSeparatorType
  /** Callback fired when an item is selected from trail or hover menu */
  onNavigate?: (node: NavNode) => void
  /** Whether to enable hover flyout menus for sibling trail levels (default true) */
  enableHoverMenus?: boolean
  /** Whether to enable hover flyout menus on the arrow separator for forward child routes (default true) */
  enableForwardMenus?: boolean
  /** Trigger mode for opening the level flyouts (hover, click, both) */
  trigger?: 'hover' | 'click' | 'both'
  /** Custom level menu renderer */
  renderHoverMenu?: (step: NavTrailStep, close: () => void) => ReactNode
  /** Custom forward routes menu renderer */
  renderForwardMenu?: (step: NavTrailStep, close: () => void) => ReactNode
  /** Spring bounce physics factor (0 to 1). Defaults to 0. */
  springBounce?: number
  /** Spring stiffness factor. Defaults to 350. */
  springStiffness?: number
  /** Spring damping factor. Defaults to 32. */
  springDamping?: number
  /** Additional CSS class names */
  className?: string
  /** Slot overrides */
  slots?: SlotComponents<NavBreadcrumbsSlots>
  /** Slot props overrides */
  slotProps?: SlotPropsMap<NavBreadcrumbsSlots>
  /** Optional trailing child elements */
  children?: ReactNode
}

interface ActiveMenuTarget {
  key: string
  step: NavTrailStep
  stepIndex: number
  type: 'item' | 'separator'
  items: NavNode[]
  title: string
  coords: { top: number; left: number; flipped: boolean }
}

/* ==========================================================================
   NavBreadcrumbs Primitive
   ========================================================================== */

const NavBreadcrumbsPrimitive: React.FC<NavBreadcrumbsProps> = ({
  tree,
  activeId,
  engine: externalEngine,
  separator = 'chevron',
  onNavigate,
  enableHoverMenus = true,
  enableForwardMenus = true,
  trigger = 'hover',
  renderHoverMenu,
  renderForwardMenu,
  springBounce = 0,
  springStiffness = 350,
  springDamping = 32,
  className,
  slots = {},
  slotProps = {},
  children,
}) => {
  const contextEngine = useContext(NavigationContext)

  // Standalone engine if context is absent
  const standaloneEngine = useMemo(() => {
    if (contextEngine) return null
    if (externalEngine) return externalEngine
    if (tree) {
      return new NavigationEngine({
        tree,
        defaultId: activeId || tree[0]?.id,
      })
    }
    return null
  }, [contextEngine, externalEngine, tree, activeId])

  const activeEngine = contextEngine || externalEngine || standaloneEngine

  // Coordinated single floating menu target
  const [activeTarget, setActiveTarget] = useState<ActiveMenuTarget | null>(null)
  const [horizontalDirection, setHorizontalDirection] = useState<number>(1)

  const prefersReducedMotion = useReducedMotion()
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInsideMenuRef = useRef(false)
  const menuCardRef = useRef<HTMLDivElement>(null)
  const contentMeasureRef = useRef<HTMLDivElement>(null)

  // Viewport dimensions for smooth morphing
  const [viewportSize, setViewportSize] = useState({ width: 240, height: 0 })
  const [lastViewportSize, setLastViewportSize] = useState({ width: 240, height: 0 })

  const spring = useMemo<NavBreadcrumbsSpringConfig>(
    () => ({
      type: 'spring',
      bounce: springBounce,
      stiffness: springStiffness,
      damping: springDamping,
    }),
    [springBounce, springStiffness, springDamping]
  )

  // ResizeObserver to track inner content dimensions and smoothly morph outer container
  useLayoutEffect(() => {
    const el = contentMeasureRef.current
    if (!el || !activeTarget) return

    const updateDimensions = () => {
      const rect = el.getBoundingClientRect()
      const nextSize = {
        width: Math.max(220, Math.min(rect.width + 12, 380)),
        height: Math.min(rect.height + 12, typeof window !== 'undefined' ? window.innerHeight - 80 : 400),
      }

      setViewportSize(nextSize)
      if (nextSize.width > 0 || nextSize.height > 0) {
        setLastViewportSize(nextSize)
      }
    }

    updateDimensions()

    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(updateDimensions)
    observer.observe(el)
    return () => observer.disconnect()
  }, [activeTarget])

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

  const closeMenu = useCallback(() => {
    clearTimers()
    setActiveTarget(null)
  }, [clearTimers])

  const computeCoordinates = useCallback(
    (element: HTMLElement) => {
      const rect = element.getBoundingClientRect()
      const menuWidth = viewportSize.width || 240
      const menuHeight = viewportSize.height || 200
      const padding = 12

      const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200
      const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800

      // Calculate horizontal centering under trigger
      const idealX = rect.left + rect.width / 2 - menuWidth / 2
      const clampedLeft = Math.min(
        Math.max(padding, idealX),
        windowWidth - menuWidth - padding
      )

      // Calculate vertical position (flip above if bottom overflowing)
      const fitsBelow = rect.bottom + menuHeight + padding <= windowHeight
      const flipped = !fitsBelow && rect.top - menuHeight - padding >= 0
      const top = flipped ? rect.top - menuHeight - 6 : rect.bottom + 6

      return { top, left: clampedLeft, flipped }
    },
    [viewportSize.width, viewportSize.height]
  )

  const openMenuTarget = useCallback(
    (target: Omit<ActiveMenuTarget, 'coords'>, element: HTMLElement) => {
      clearTimers()
      const coords = computeCoordinates(element)

      if (activeTarget) {
        // Calculate horizontal direction: right (+1) or left (-1)
        const dir =
          target.stepIndex !== activeTarget.stepIndex
            ? target.stepIndex > activeTarget.stepIndex
              ? 1
              : -1
            : target.type === 'separator' && activeTarget.type === 'item'
              ? 1
              : target.type === 'item' && activeTarget.type === 'separator'
                ? -1
                : coords.left > activeTarget.coords.left
                  ? 1
                  : -1

        setHorizontalDirection(dir)
        setActiveTarget({ ...target, coords })
      } else {
        setHorizontalDirection(1)
        // Soft entrance delay
        openTimerRef.current = setTimeout(() => {
          const freshCoords = computeCoordinates(element)
          setActiveTarget({ ...target, coords: freshCoords })
        }, 60)
      }
    },
    [activeTarget, clearTimers, computeCoordinates]
  )

  const scheduleClose = useCallback(() => {
    clearTimers()
    closeTimerRef.current = setTimeout(() => {
      if (!isInsideMenuRef.current) {
        setActiveTarget(null)
      }
    }, 180)
  }, [clearTimers])

  // Global dismissal listeners (pointer down outside & escape key)
  useEffect(() => {
    if (!activeTarget) return

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      if (
        menuCardRef.current?.contains(target) ||
        target.closest('[data-slot="nav-breadcrumbs"]') ||
        target.closest('[data-slot="nav-cascaded-submenu-container"]')
      ) {
        return
      }
      closeMenu()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeTarget, closeMenu])

  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [clearTimers])

  const scrollToRight = useCallback((smooth = false) => {
    const el = scrollContainerRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    if (maxScroll > 0) {
      el.scrollTo({
        left: maxScroll + 100,
        behavior: smooth ? 'smooth' : 'auto',
      })
    }
  }, [])

  if (!activeEngine) {
    return (
      <div className="text-xs text-muted-fg italic">
        [NavBreadcrumbs] Missing NavigationProvider, engine, or tree prop.
      </div>
    )
  }

  const engineState = activeEngine.getState()
  const trail = engineState.trail

  // Automatically scroll to the end so the active leaf node is always visible
  useLayoutEffect(() => {
    scrollToRight(false)
    const timeoutId = setTimeout(() => {
      scrollToRight(false)
    }, 0)
    const rafId = requestAnimationFrame(() => {
      scrollToRight(false)
    })
    return () => {
      clearTimeout(timeoutId)
      cancelAnimationFrame(rafId)
    }
  }, [trail, activeId, scrollToRight])

  // Keep scrolled to end on container resize
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    let timeoutId: ReturnType<typeof setTimeout> | null = null
    const handleResize = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        scrollToRight(false)
      }, 50)
    }

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(handleResize)
      observer.observe(el)
      return () => {
        if (timeoutId) clearTimeout(timeoutId)
        observer.disconnect()
      }
    }
  }, [scrollToRight])

  const handleSelect = (node: NavNode) => {
    activeEngine.navigate(node)
    onNavigate?.(node)
    closeMenu()
  }

  if (!trail || trail.length === 0) {
    return null
  }

  const width = viewportSize.width > 0 ? viewportSize.width : lastViewportSize.width
  const height = viewportSize.height > 0 ? viewportSize.height : lastViewportSize.height
  const isOpen = Boolean(activeTarget)

  return (
    <nav
      ref={scrollContainerRef}
      aria-label="Breadcrumb Navigation"
      data-slot="nav-breadcrumbs"
      className={cn(
        'group/nav-breadcrumbs relative inline-flex max-w-full min-w-0 items-center overflow-x-auto overflow-y-hidden scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
        className
      )}
      onScroll={() => {
        if (activeTarget) {
          closeMenu()
        }
      }}
    >
      <Breadcrumbs
        separator={false}
        className="flex shrink-0 flex-nowrap items-center text-xs text-muted-fg gap-0.5 m-0 p-0 whitespace-nowrap"
      >
        {trail.map((step, idx) => {
          const isCurrent = step.isCurrent || idx === trail.length - 1
          const Icon = step.node.icon
          const hasChildren = Boolean(step.children && step.children.length > 0)

          const itemMenuItems =
            step.siblings && step.siblings.length > 1
              ? step.siblings
              : step.children && step.children.length > 0
                ? step.children
                : step.siblings || []

          const canOpenItemMenu = enableHoverMenus && itemMenuItems.length > 0
          const canOpenForwardMenu = enableForwardMenus && hasChildren
          const showSeparator = (!isCurrent || (hasChildren && enableForwardMenus)) && separator !== false

          const isItemActive = activeTarget?.key === `item-${step.node.id}`
          const isSepActive = activeTarget?.key === `sep-${step.node.id}`

          return (
            <BreadcrumbItem
              key={step.node.id}
              isCurrent={isCurrent}
              separator={false}
              className="inline-flex shrink-0 items-center m-0 p-0 gap-0 w-fit whitespace-nowrap"
            >
              {() => (
                <div className="flex shrink-0 items-center gap-0.5 m-0 p-0">
                  {/* Item Text / Pill Trigger */}
                  {slots.item ? (
                    renderSlot(slots.item, {
                      step,
                      index: idx,
                      isCurrent,
                      isOpen: isItemActive,
                      onSelect: handleSelect,
                      ...slotProps?.item,
                    })
                  ) : (
                    <div
                      className="inline-flex shrink-0 items-center"
                      onPointerEnter={(e) => {
                        if (trigger === 'click') return
                        activeEngine?.prefetchOnIntent(step.node, 65)
                        if (canOpenItemMenu) {
                          openMenuTarget(
                            {
                              key: `item-${step.node.id}`,
                              step,
                              stepIndex: idx,
                              type: 'item',
                              items: itemMenuItems,
                              title: step.node.title,
                            },
                            e.currentTarget
                          )
                        } else {
                          scheduleClose()
                        }
                      }}
                      onPointerLeave={() => {
                        if (trigger === 'click') return
                        activeEngine?.cancelPrefetch(step.node)
                        scheduleClose()
                      }}
                      onClick={(e) => {
                        if (trigger === 'click' || trigger === 'both') {
                          if (canOpenItemMenu) {
                            if (activeTarget?.key === `item-${step.node.id}`) {
                              closeMenu()
                            } else {
                              openMenuTarget(
                                {
                                  key: `item-${step.node.id}`,
                                  step,
                                  stepIndex: idx,
                                  type: 'item',
                                  items: itemMenuItems,
                                  title: step.node.title,
                                },
                                e.currentTarget
                              )
                            }
                          }
                        }
                      }}
                    >
                      <span
                        role="button"
                        tabIndex={0}
                        aria-haspopup={canOpenItemMenu ? 'menu' : undefined}
                        aria-expanded={canOpenItemMenu ? isItemActive : undefined}
                        onClick={(e) => {
                          if (!isCurrent) {
                            e.stopPropagation()
                            handleSelect(step.node)
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            if (!isCurrent) {
                              e.preventDefault()
                              handleSelect(step.node)
                            }
                          } else if (e.key === 'ArrowDown' && canOpenItemMenu) {
                            e.preventDefault()
                            openMenuTarget(
                              {
                                key: `item-${step.node.id}`,
                                step,
                                stepIndex: idx,
                                type: 'item',
                                items: itemMenuItems,
                                title: step.node.title,
                              },
                              e.currentTarget
                            )
                          }
                        }}
                        className={cn(
                          'group/nav-breadcrumb-item inline-flex shrink-0 items-center gap-1.5 py-1 px-2 rounded-micro transition-all select-none text-xs leading-none m-0 whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          isCurrent
                            ? 'text-fg font-semibold cursor-default bg-secondary/40'
                            : 'text-muted-fg hover:text-fg hover:bg-secondary/60 cursor-pointer',
                          isItemActive && 'bg-secondary/80 text-fg shadow-xs ring-1 ring-border/40'
                        )}
                      >
                        {Icon && (
                          <Icon
                            className={cn(
                              'size-3.5 shrink-0 transition-colors',
                              isCurrent
                                ? 'text-primary'
                                : 'text-muted-fg group-hover/nav-breadcrumb-item:text-primary'
                            )}
                          />
                        )}
                        <span className="whitespace-nowrap font-medium">
                          {step.node.shortTitle || step.node.title}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Separator / Forward Routes Trigger */}
                  {showSeparator && (
                    slots.separator ? (
                      renderSlot(slots.separator, {
                        step,
                        index: idx,
                        separator,
                        isOpen: isSepActive,
                        ...slotProps?.separator,
                      })
                    ) : (
                      <div
                        className="inline-flex shrink-0 items-center justify-center m-0 p-0.5"
                        onPointerEnter={(e) => {
                          if (trigger === 'click') return
                          if (canOpenForwardMenu) {
                            openMenuTarget(
                              {
                                key: `sep-${step.node.id}`,
                                step,
                                stepIndex: idx,
                                type: 'separator',
                                items: step.children!,
                                title: `Forward: ${step.node.title}`,
                              },
                              e.currentTarget
                            )
                          } else {
                            scheduleClose()
                          }
                        }}
                        onPointerLeave={() => {
                          if (trigger === 'click') return
                          scheduleClose()
                        }}
                        onClick={(e) => {
                          if (trigger === 'click' || trigger === 'both') {
                            if (canOpenForwardMenu) {
                              if (activeTarget?.key === `sep-${step.node.id}`) {
                                closeMenu()
                              } else {
                                openMenuTarget(
                                  {
                                    key: `sep-${step.node.id}`,
                                    step,
                                    stepIndex: idx,
                                    type: 'separator',
                                    items: step.children!,
                                    title: `Forward: ${step.node.title}`,
                                  },
                                  e.currentTarget
                                )
                              }
                            }
                          }
                        }}
                      >
                        <button
                          type="button"
                          aria-label={`Forward child pages for ${step.node.title}`}
                          aria-haspopup={canOpenForwardMenu ? 'menu' : undefined}
                          aria-expanded={canOpenForwardMenu ? isSepActive : undefined}
                          disabled={!canOpenForwardMenu}
                          className={cn(
                            'inline-flex shrink-0 items-center justify-center p-0.5 rounded-micro transition-all duration-150 m-0 outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            canOpenForwardMenu
                              ? 'cursor-pointer hover:text-fg hover:bg-secondary/70 text-muted-fg/80'
                              : 'cursor-default text-muted-fg/50 pointer-events-none',
                            isSepActive && 'text-fg bg-secondary/80 ring-1 ring-border/50 shadow-xs'
                          )}
                        >
                          <BreadcrumbSeparator
                            separator={separator}
                            className="inline-flex shrink-0 items-center justify-center align-middle"
                          />
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </BreadcrumbItem>
          )
        })}
      </Breadcrumbs>
      {children}

      {/* Single Coordinated Morphing Spring Viewport for the entire Breadcrumbs Bar */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && activeTarget && (
              <motion.div
                key="nav-breadcrumbs-gliding-menu-container"
                data-slot="nav-breadcrumbs-viewport-container"
                initial={false}
                animate={{
                  top: activeTarget.coords.top,
                  left: activeTarget.coords.left,
                }}
                transition={spring}
                style={{
                  position: 'fixed',
                  zIndex: 9999,
                }}
                className="pointer-events-auto"
                onPointerEnter={() => {
                  isInsideMenuRef.current = true
                  clearTimers()
                }}
                onPointerLeave={() => {
                  isInsideMenuRef.current = false
                  scheduleClose()
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                {slots.viewport ? (
                  renderSlot(slots.viewport, {
                    isOpen,
                    className: 'rounded-macro border border-border/60 bg-overlay/95 p-1.5 shadow-2xl backdrop-blur-2xl text-fg select-none overflow-hidden ring-1 ring-black/5 dark:ring-white/10',
                    children: (
                      <AnimatePresence mode="popLayout" initial={false} custom={horizontalDirection}>
                        <motion.div
                          key={activeTarget.key}
                          custom={horizontalDirection}
                          variants={horizontalSlideVariants}
                          initial="initial"
                          animate="active"
                          exit="exit"
                          transition={spring}
                          className="w-full flex flex-col"
                        >
                          {activeTarget.type === 'item' && renderHoverMenu ? (
                            renderHoverMenu(activeTarget.step, closeMenu)
                          ) : activeTarget.type === 'separator' && renderForwardMenu ? (
                            renderForwardMenu(activeTarget.step, closeMenu)
                          ) : (
                            renderSlot(
                              slots.levelMenu,
                              {
                                items: activeTarget.items,
                                activeId: activeTarget.step.node.id,
                                title: activeTarget.title,
                                springBounce,
                                springStiffness,
                                springDamping,
                                onSelect: (item) => {
                                  handleSelect(item)
                                },
                                ...slotProps?.levelMenu,
                              },
                              { defaultComponent: NavLevelMenu }
                            )
                          )}
                        </motion.div>
                      </AnimatePresence>
                    ),
                    ...slotProps?.viewport,
                  })
                ) : (
                  <motion.div
                    ref={menuCardRef}
                    data-slot="nav-breadcrumbs-viewport"
                    initial={{
                      opacity: 0,
                      scale: 0.96,
                    }}
                    animate={{
                      width,
                      height: height > 0 ? height : undefined,
                      opacity: 1,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.96,
                      transition: { duration: 0.12 },
                    }}
                    transition={spring}
                    className="rounded-macro border border-border/60 bg-overlay/95 p-1.5 shadow-2xl backdrop-blur-2xl text-fg select-none overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
                  >
                    <AnimatePresence mode="popLayout" initial={false} custom={horizontalDirection}>
                      <motion.div
                        key={activeTarget.key}
                        custom={horizontalDirection}
                        variants={horizontalSlideVariants}
                        initial="initial"
                        animate="active"
                        exit="exit"
                        transition={spring}
                        className="w-full flex flex-col"
                      >
                        {activeTarget.type === 'item' && renderHoverMenu ? (
                          renderHoverMenu(activeTarget.step, closeMenu)
                        ) : activeTarget.type === 'separator' && renderForwardMenu ? (
                          renderForwardMenu(activeTarget.step, closeMenu)
                        ) : (
                          renderSlot(
                            slots.levelMenu,
                            {
                              items: activeTarget.items,
                              activeId: activeTarget.step.node.id,
                              title: activeTarget.title,
                              springBounce,
                              springStiffness,
                              springDamping,
                              onSelect: (item) => {
                                handleSelect(item)
                              },
                              ...slotProps?.levelMenu,
                            },
                            { defaultComponent: NavLevelMenu }
                          )
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Invisible fixed measurement node that prevents layout flicker */}
                <div
                  ref={contentMeasureRef}
                  aria-hidden="true"
                  data-slot="nav-breadcrumbs-measure"
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
                  <div className="p-1.5">
                    {activeTarget.type === 'item' && renderHoverMenu ? (
                      renderHoverMenu(activeTarget.step, closeMenu)
                    ) : activeTarget.type === 'separator' && renderForwardMenu ? (
                      renderForwardMenu(activeTarget.step, closeMenu)
                    ) : (
                      <NavLevelMenu
                        items={activeTarget.items}
                        activeId={activeTarget.step.node.id}
                        title={activeTarget.title}
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </nav>
  )
}

export const NavBreadcrumbs = createInterfaceComponent<NavBreadcrumbsProps, NavBreadcrumbsSlots>(
  {
    name: 'NavBreadcrumbs',
    category: 'navigation',
    description: 'Tree-connected hierarchical breadcrumbs trail with spring-animated morphing flyout viewports and fluid level navigation.',
    version: '1.0.0',
    props: {
      separator: 'chevron',
      enableHoverMenus: true,
      enableForwardMenus: true,
      trigger: 'hover',
    },
    slots: {
      levelMenu: NavLevelMenu,
      item: undefined,
      separator: undefined,
      viewport: undefined,
    },
  },
  NavBreadcrumbsPrimitive
)

export default NavBreadcrumbs
