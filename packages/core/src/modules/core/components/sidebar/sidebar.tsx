import React, { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { type ButtonProps as RACButtonProps, Button as ButtonPrimitive } from 'react-aria-components/Button'
import { composeRenderProps } from 'react-aria-components/composeRenderProps'
import {
  Disclosure,
  DisclosurePanel,
  type DisclosurePanelProps,
  type DisclosureProps,
} from 'react-aria-components/Disclosure'
import {
  DisclosureGroup,
  type DisclosureGroupProps,
} from 'react-aria-components/DisclosureGroup'
import { Header } from 'react-aria-components/Header'
import { Heading } from 'react-aria-components/Heading'
import { Link as RACLink, type LinkProps as RACLinkProps, type LinkRenderProps } from 'react-aria-components/Link'
import {
  NavigationTree,
  NavigationTreeItem,
  NavigationTreeItemContent,
  type NavigationTreeItemContentProps,
  type NavigationTreeItemProps,
  type NavigationTreeProps,
} from 'react-aria-components/NavigationTree'
import {
  Separator as RACSeparator,
  type SeparatorProps as RACSeparatorProps,
} from 'react-aria-components/Separator'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { useIsMobile } from '../../../../hooks'
import { Button, type ButtonProps } from '../button'

const SIDEBAR_WIDTH = '17rem'
const SIDEBAR_WIDTH_DOCK = '3.5rem'
const SIDEBAR_COOKIE_NAME = 'sidebar_state'
const SIDEBAR_STORAGE_KEY = 'sidebar_collapsed'
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

/* ==========================================================================
   Sidebar Context & Hook
   ========================================================================== */

export interface SidebarContextProps {
  /** state */
  state: 'expanded' | 'collapsed'
  /** Custom open configuration. */
  open: boolean
  /** Custom set open configuration. */
  setOpen: (open: boolean) => void
  /** isOpenOnMobile */
  isOpenOnMobile: boolean
  /** Custom set is open on mobile configuration. */
  setIsOpenOnMobile: (open: boolean) => void
  /** Whether the component is mobile. */
  isMobile: boolean
  /** toggleSidebar */
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextProps | null>(null)

const DEFAULT_SIDEBAR_CONTEXT: SidebarContextProps = {
  state: 'expanded',
  open: true,
  setOpen: () => {},
  isOpenOnMobile: false,
  setIsOpenOnMobile: () => {},
  isMobile: false,
  toggleSidebar: () => {},
}

export const useSidebar = (): SidebarContextProps => {
  const context = useContext(SidebarContext)
  return context ?? DEFAULT_SIDEBAR_CONTEXT
}

/* ==========================================================================
   Sidebar Provider
   ========================================================================== */

export interface SidebarProviderProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Default initial expanded state of the sidebar. */
  defaultOpen?: boolean
  /** Controlled expanded state of the sidebar. */
  isOpen?: boolean
  /** Custom localStorage key to store collapsed state. Defaults to 'sidebar_collapsed'. */
  storageKey?: string
  /** Keyboard shortcut key (combined with Meta/Ctrl) to toggle the sidebar. */
  /** Keyboard shortcut combination string. */
  shortcut?: string
  /** Callback fired when the sidebar open state transitions. */
  onOpenChange?: (open: boolean) => void
}

const SidebarProviderPrimitive = ({
  defaultOpen = true,
  isOpen: openProp,
  storageKey = SIDEBAR_STORAGE_KEY,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  shortcut = 'b',
  ...props
}: SidebarProviderProps) => {
  const [openMobile, setOpenMobile] = useState(false)
  
  // Read initial open state from localStorage ('sidebar_collapsed'), falling back to defaultOpen
  const [internalOpenState, setInternalOpenState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedCollapsed = localStorage.getItem(storageKey)
        if (storedCollapsed !== null) {
          return storedCollapsed !== 'true'
        }
        const storedState = localStorage.getItem('sidebar_state')
        if (storedState !== null) {
          return storedState === 'true' || storedState === 'expanded'
        }
      } catch {
        // Fallback for restricted storage environments
      }
    }
    return defaultOpen
  })

  const open = openProp ?? internalOpenState

  const setOpen = useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === 'function' ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        setInternalOpenState(openState)
      }
      if (typeof window !== 'undefined') {
        try {
          const isCollapsed = !openState
          localStorage.setItem(storageKey, String(isCollapsed))
          localStorage.setItem('sidebar_state', openState ? 'expanded' : 'collapsed')
          document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
        } catch {
          // Ignore localStorage errors in restricted environments
        }
      }
    },
    [setOpenProp, open, storageKey]
  )

  const isMobile = useIsMobile()
  const isMobileRef = useRef(isMobile)
  isMobileRef.current = isMobile

  const toggleSidebar = useCallback(() => {
    if (isMobileRef.current) {
      setOpenMobile((prev) => !prev)
    } else {
      setOpen((prev) => !prev)
    }
  }, [setOpen])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === shortcut && (event.metaKey || event.ctrlKey)) {
        const activeElement = document.activeElement
        const isInTextInput =
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement ||
          activeElement?.getAttribute('contenteditable') === 'true' ||
          activeElement?.getAttribute('role') === 'textbox'

        if (!isInTextInput) {
          event.preventDefault()
          toggleSidebar()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar, shortcut])

  const state = open ? 'expanded' : 'collapsed'

  const contextValue = useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile: isMobile ?? false,
      isOpenOnMobile: openMobile,
      setIsOpenOnMobile: setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        data-slot="sidebar-wrapper"
        style={
          {
            '--sidebar-width': SIDEBAR_WIDTH,
            '--sidebar-width-dock': SIDEBAR_WIDTH_DOCK,
            ...style,
          } as React.CSSProperties
        }
        className={cn('group/sidebar-wrapper relative flex min-h-svh w-full text-fg isolate', className)}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

export const SidebarProvider = createInterfaceComponent<SidebarProviderProps>(
  {
    name: 'SidebarProvider',
    category: 'navigation',
    description: 'Context provider and state manager for responsive sidebar collapse/expand states.',
    version: '1.0.0',
    props: {
      defaultOpen: true,
      shortcut: 'b',
    },
  },
  SidebarProviderPrimitive
)

import type { SlotComponents, SlotDefinition, SlotPropsMap } from '../../../../core/types'
import { renderSlot } from '../../../../core/slot-resolver'

/* ==========================================================================
   Sidebar Slot Definitions & State Context
   ========================================================================== */

export interface SidebarSlotState {
  /** isOpen */
  isOpen: boolean
  isCollapsed: boolean
  state: 'expanded' | 'collapsed'
  /** isMobile */
  isMobile: boolean
  toggleSidebar: () => void
}

export interface SidebarHeaderSlotProps extends SidebarSlotState {
  /** title */
  title?: string
  /** Custom subtitle configuration. */
  subtitle?: string
  /** Whether to show the logo. */
  showLogo?: boolean
}

export interface SidebarSearchSlotProps extends SidebarSlotState {
  /** placeholder */
  placeholder?: string
  shortcut?: string
  /** Custom query configuration. */
  query?: string
  /** onSearch */
  onSearch?: (value: string) => void
}

export interface SidebarContentSlotProps extends SidebarSlotState {
  /** compact */
  compact?: boolean
}

export interface SidebarFooterSlotProps extends SidebarSlotState {
  /** user */
  user?: { name: string; email: string; avatar?: string }
  /** Custom status configuration. */
  status?: string
}

export interface SidebarRailSlotProps extends SidebarSlotState {
  /** shortcut */
  shortcut?: string
}

export interface SidebarSlots {
  /** Top pinned header slot container. */
  header?: SlotDefinition<SidebarHeaderSlotProps, 'expanded' | 'collapsed'>
  /** Quick search input or command palette trigger slot. */
  search?: SlotDefinition<SidebarSearchSlotProps, 'expanded' | 'collapsed'>
  /** Main scrollable navigation items content slot. */
  content?: SlotDefinition<SidebarContentSlotProps, 'expanded' | 'collapsed'>
  /** Bottom pinned user profile / status footer slot. */
  footer?: SlotDefinition<SidebarFooterSlotProps, 'expanded' | 'collapsed'>
  /** Draggable edge rail slot for expanding/collapsing. */
  rail?: SlotDefinition<SidebarRailSlotProps>
}

export interface SidebarProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'children'> {
  /** Explicit children composition or render function. */
  children?: React.ReactNode | ((context: SidebarContextProps) => React.ReactNode)
  /** Structural layout variant: default (bordered panel), float (floating card), inset (flush inset viewport). */
  intent?: 'default' | 'float' | 'inset'
  /** Responsive collapse behavior: hidden (drawer on mobile), dock (collapsed icon rail), none (fixed width). */
  collapsible?: 'hidden' | 'dock' | 'none'
  /** Placement side of the sidebar layout: left or right. */
  side?: 'left' | 'right'
  /** Slot overrides map for customizing header, content, footer, and rail. */
  slots?: SlotComponents<SidebarSlots>
  /** Property overrides passed down to injected slots. */
  slotProps?: SlotPropsMap<SidebarSlots>
}

const SidebarPrimitiveComponent = ({
  children,
  collapsible = 'hidden',
  side = 'left',
  intent = 'default',
  className,
  slots,
  slotProps,
  ...props
}: SidebarProps) => {
  const sidebarContext = useSidebar()
  const { isMobile, state, isOpenOnMobile, setIsOpenOnMobile, toggleSidebar } = sidebarContext
  const renderedChildren = typeof children === 'function' ? children(sidebarContext) : children

  const asideRef = useRef<HTMLElement | null>(null)
  const [isHoverOpen, setIsHoverOpen] = useState(false)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isHoverOpenRef = useRef(isHoverOpen)
  isHoverOpenRef.current = isHoverOpen

  const isHiddenCollapsed = !isMobile && collapsible === 'hidden' && state === 'collapsed'

  const clearCloseTimer = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
  }, [])

  const openHover = useCallback(() => {
    clearCloseTimer()
    setIsHoverOpen(true)
  }, [clearCloseTimer])

  const scheduleClose = useCallback((delay = 300) => {
    clearCloseTimer()
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHoverOpen(false)
    }, delay)
  }, [clearCloseTimer])

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      clearCloseTimer()
    }
  }, [clearCloseTimer])

  // If state is toggled to expanded, reset hover state
  useEffect(() => {
    if (state === 'expanded') {
      clearCloseTimer()
      setIsHoverOpen(false)
    }
  }, [state, clearCloseTimer])

  // Robust container-level / edge pointer move tracking
  useEffect(() => {
    if (!isHiddenCollapsed) return

    const handlePointerMove = (e: PointerEvent) => {
      const aside = asideRef.current
      const wrapper = (aside?.closest('[data-slot="sidebar-wrapper"]') || document.body) as HTMLElement
      const targetRect = wrapper.getBoundingClientRect()

      // Ensure pointer is vertically in bounds (with 16px buffer)
      if (e.clientY < targetRect.top - 16 || e.clientY > targetRect.bottom + 16) {
        if (isHoverOpenRef.current) {
          scheduleClose(150)
        }
        return
      }

      const relX = side === 'left' ? e.clientX - targetRect.left : targetRect.right - e.clientX

      // If sidebar is closed: open when cursor touches the edge zone (<= 24px)
      if (!isHoverOpenRef.current) {
        if (relX >= 0 && relX <= 24) {
          openHover()
        }
        return
      }

      // If sidebar is open: keep open while cursor is inside or within generous 32px safety margin
      if (isHoverOpenRef.current) {
        const sidebarWidth = aside?.offsetWidth || 272
        const safetyMargin = 32

        if (relX >= -10 && relX <= sidebarWidth + safetyMargin) {
          clearCloseTimer()
        } else {
          scheduleClose(300)
        }
      }
    }

    const handlePointerLeaveWindow = () => {
      if (isHoverOpenRef.current) {
        scheduleClose(150)
      }
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('blur', handlePointerLeaveWindow)
    document.addEventListener('mouseleave', handlePointerLeaveWindow)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('blur', handlePointerLeaveWindow)
      document.removeEventListener('mouseleave', handlePointerLeaveWindow)
    }
  }, [isHiddenCollapsed, side, openHover, scheduleClose, clearCloseTimer])

  const isEffectiveOpen = state === 'expanded' || (isHiddenCollapsed && isHoverOpen)
  const effectiveState: 'expanded' | 'collapsed' = isEffectiveOpen ? 'expanded' : 'collapsed'

  const effectiveContextValue = useMemo<SidebarContextProps>(
    () => ({
      ...sidebarContext,
      state: effectiveState,
      open: isEffectiveOpen,
    }),
    [sidebarContext, effectiveState, isEffectiveOpen]
  )

  const slotState: SidebarSlotState = {
    isOpen: isEffectiveOpen,
    isCollapsed: !isEffectiveOpen,
    state: effectiveState,
    isMobile,
    toggleSidebar,
  }
  const activeVariant = effectiveState === 'collapsed' ? 'collapsed' : 'expanded'

  if (collapsible === 'none') {
    return (
      <div
        data-intent={intent}
        data-collapsible="none"
        data-slot="sidebar"
        className={cn('flex h-full w-(--sidebar-width) flex-col bg-bg text-fg border-r border-border', className)}
        {...props}
      >
        {slots?.header && renderSlot(slots.header, { ...slotProps?.header, ...slotState }, { activeVariant })}
        {slots?.search && renderSlot(slots.search, { ...slotProps?.search, ...slotState }, { activeVariant })}
        {slots?.content ? renderSlot(slots.content, { ...slotProps?.content, ...slotState }, { activeVariant }) : renderedChildren}
        {slots?.footer && renderSlot(slots.footer, { ...slotProps?.footer, ...slotState }, { activeVariant })}
      </div>
    )
  }

  // Mobile Drawer Backdrop & Panel
  if (isMobile) {
    if (!isOpenOnMobile) return null
    return (
      <div className="fixed inset-0 z-50 flex">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
          onClick={() => setIsOpenOnMobile(false)}
        />
        <div
          data-slot="sidebar"
          data-side={side}
          className={cn(
            'relative z-50 flex h-full w-85 max-w-[90vw] flex-col bg-bg p-space-lg shadow-xl animate-in slide-in-from-left duration-200 text-fg',
            side === 'right' && 'ml-auto slide-in-from-right',
            className
          )}
          {...props}
        >
          {slots?.header && renderSlot(slots.header, { ...slotProps?.header, ...slotState }, { activeVariant })}
          {slots?.search && renderSlot(slots.search, { ...slotProps?.search, ...slotState }, { activeVariant })}
          {slots?.content ? renderSlot(slots.content, { ...slotProps?.content, ...slotState }, { activeVariant }) : renderedChildren}
          {slots?.footer && renderSlot(slots.footer, { ...slotProps?.footer, ...slotState }, { activeVariant })}
        </div>
      </div>
    )
  }

  // Desktop Collapsible Sidebar
  return (
    <aside
      ref={asideRef}
      data-state={effectiveState}
      data-collapsible={state === 'collapsed' ? collapsible : ''}
      data-hover-open={isHoverOpen ? 'true' : undefined}
      data-intent={intent}
      data-side={side}
      data-slot="sidebar"
      onPointerEnter={isHiddenCollapsed ? openHover : undefined}
      onPointerLeave={isHiddenCollapsed ? () => scheduleClose(300) : undefined}
      className={cn(
        'group peer flex h-full flex-col bg-bg text-fg shrink-0',
        // Normal in-flow sizing and transitions for expanded / dock modes
        !isHiddenCollapsed && [
          'relative overflow-hidden transition-[width] duration-200 ease-linear',
          state === 'expanded' && 'w-(--sidebar-width)',
          state === 'collapsed' && collapsible === 'dock' && 'w-(--sidebar-width-dock)',
        ],
        // Overlay slide-in mode for hidden collapsible when collapsed
        isHiddenCollapsed && [
          'absolute inset-y-0 z-40 w-(--sidebar-width) overflow-visible transition-transform duration-300 ease-out bg-bg',
          side === 'left' ? 'left-0' : 'right-0',
          isHoverOpen
            ? 'translate-x-0 shadow-2xl pointer-events-auto bg-bg'
            : side === 'left'
              ? '-translate-x-full shadow-none pointer-events-auto'
              : 'translate-x-full shadow-none pointer-events-auto',
        ],
        side === 'left' ? 'border-r border-border' : 'border-l border-border',
        intent === 'float' && 'm-space-sm h-[calc(100%-1rem)] rounded-macro border border-border bg-bg shadow-sm',
        intent === 'inset' && 'p-space-sm',
        className
      )}
      {...props}
    >
      {/* Edge hover hit zone: sits at the screen/parent edge when collapsed and hidden */}
      {isHiddenCollapsed && (
        <div
          data-slot="sidebar-edge-hitbox"
          aria-hidden="true"
          className={cn(
            'absolute inset-y-0 z-50 w-5 cursor-pointer pointer-events-auto transition-colors',
            side === 'left' ? '-right-5' : '-left-5',
            !isHoverOpen && 'hover:bg-primary/20'
          )}
        />
      )}
      <SidebarContext.Provider value={effectiveContextValue}>
        <div data-slot="sidebar-inner" className="flex size-full min-w-0 flex-col overflow-hidden text-fg">
          {slots?.header && renderSlot(slots.header, { ...slotProps?.header, ...slotState }, { activeVariant })}
          {slots?.search && renderSlot(slots.search, { ...slotProps?.search, ...slotState }, { activeVariant })}
          {slots?.content ? renderSlot(slots.content, { ...slotProps?.content, ...slotState }, { activeVariant }) : renderedChildren}
          {slots?.footer && renderSlot(slots.footer, { ...slotProps?.footer, ...slotState }, { activeVariant })}
        </div>
        {slots?.rail && renderSlot(slots.rail, { ...slotProps?.rail, ...slotState }, { activeVariant })}
      </SidebarContext.Provider>
    </aside>
  )
}

export const Sidebar = createInterfaceComponent<SidebarProps, SidebarSlots>(
  {
    name: 'Sidebar',
    category: 'navigation',
    description: 'Responsive collapsible application navigation sidebar with dock, mobile drawer modes, and state-aware variant slots.',
    version: '1.0.0',
    props: {
      intent: 'default',
      collapsible: 'dock',
      side: 'left',
    },
    slots: {
      header: undefined,
      search: undefined,
      content: undefined,
      footer: undefined,
      rail: undefined,
    },
  },
  SidebarPrimitiveComponent
)

/* ==========================================================================
   Sidebar Anatomy Subcomponents
   ========================================================================== */

export interface SidebarHeaderProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Custom CSS classes for the sidebar header container. */
  className?: string
}

const SidebarHeaderPrimitive = ({ className, ...props }: SidebarHeaderProps) => {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  return (
    <div
      data-slot="sidebar-header"
      className={cn(
        'flex flex-col gap-space-sm p-space-md border-b border-border/60 shrink-0 transition-all overflow-hidden',
        isCollapsed && 'items-center p-space-sm',
        className
      )}
      {...props}
    />
  )
}

export const SidebarHeader = createInterfaceComponent<SidebarHeaderProps>(
  {
    name: 'SidebarHeader',
    category: 'navigation',
    description: 'Header container of the application sidebar with collapse-responsive alignment.',
    version: '1.0.0',
  },
  SidebarHeaderPrimitive
)

export interface SidebarFooterProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Custom CSS classes for the pinned sidebar footer. */
  className?: string
}

const SidebarFooterPrimitive = ({ className, ...props }: SidebarFooterProps) => {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  return (
    <div
      data-slot="sidebar-footer"
      className={cn(
        'mt-auto flex shrink-0 items-center gap-space-sm p-space-md border-t border-border/60 overflow-hidden transition-all',
        isCollapsed && 'justify-center p-space-sm',
        className
      )}
      {...props}
    />
  )
}

export const SidebarFooter = createInterfaceComponent<SidebarFooterProps>(
  {
    name: 'SidebarFooter',
    category: 'navigation',
    description: 'Pinned bottom footer region of the application navigation sidebar.',
    version: '1.0.0',
  },
  SidebarFooterPrimitive
)

export interface SidebarContentSlots {}

export interface SidebarContentProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Injected slot component overrides. */
  slots?: SlotComponents<SidebarContentSlots>
  /** Props passed down to injected slot components. */
  slotProps?: SlotPropsMap<SidebarContentSlots>
  /** Custom CSS classes for the scrollable sidebar content container. */
  className?: string
}

const SidebarContentPrimitive = ({ className, slots, slotProps, ...props }: SidebarContentProps) => {
  return (
    <div
      data-slot="sidebar-content"
      className={cn('flex min-h-0 flex-1 flex-col overflow-y-auto p-space-sm gap-y-space-xs', className)}
      {...props}
    />
  )
}

export const SidebarContent = createInterfaceComponent<SidebarContentProps, SidebarContentSlots>(
  {
    name: 'SidebarContent',
    category: 'navigation',
    description: 'Scrollable main content zone inside navigation sidebar.',
    version: '1.0.0',
    slots: {},
  },
  SidebarContentPrimitive
)

export interface SidebarSectionSlots {}

export interface SidebarSectionProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Section heading title label displayed above navigation items. */
  title?: string
  /** Custom CSS classes for the section grouping. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<SidebarSectionSlots>
  /** Props passed down to injected slot components. */
  slotProps?: SlotPropsMap<SidebarSectionSlots>
}

const SidebarSectionPrimitive = ({
  title,
  className,
  children,
  slots,
  slotProps,
  ...props
}: SidebarSectionProps) => {
  const { state } = useSidebar()
  return (
    <div data-slot="sidebar-section" className={cn('flex flex-col gap-y-space-xs py-space-sm', className)} {...props}>
      {title && state !== 'collapsed' && (
        <span className="px-space-md text-xs font-semibold uppercase tracking-wider text-muted-fg">
          {title}
        </span>
      )}
      <div className="flex flex-col gap-y-space-2xs">{children}</div>
    </div>
  )
}

export const SidebarSection = createInterfaceComponent<SidebarSectionProps, SidebarSectionSlots>(
  {
    name: 'SidebarSection',
    category: 'navigation',
    description: 'Grouped navigation subsection with optional header title.',
    version: '1.0.0',
    props: {
      title: '',
    },
    slots: {},
  },
  SidebarSectionPrimitive
)

export interface SidebarItemProps extends Omit<RACLinkProps, 'children'> {
  /** Whether this navigation link represents the active/current route. */
  isCurrent?: boolean
  /** Floating tooltip label shown in collapsed icon dock mode. */
  tooltip?: string
  /** Leading icon node representing the navigation destination. */
  icon?: React.ReactNode
  /** Item label or dynamic render function receiving collapsed/hovered state. */
  children?:
  | React.ReactNode
  | ((values: LinkRenderProps & { defaultChildren: React.ReactNode; isCollapsed: boolean }) => React.ReactNode)
}

const SidebarItemPrimitive = ({
  isCurrent,
  icon,
  children,
  className,
  ...props
}: SidebarItemProps) => {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <RACLink
      data-slot="sidebar-item"
      data-current={isCurrent ? '' : undefined}
      aria-current={isCurrent ? 'page' : undefined}
      className={composeRenderProps(
        className,
        (className, { isFocusVisible, isHovered, isPressed }) =>
          cn(
            'flex items-center gap-x-space-md rounded-base p-space-sm text-sm font-medium text-muted-fg no-underline transition-colors cursor-pointer',
            isCollapsed && 'justify-center p-2.5',
            'hover:bg-accent hover:text-accent-fg',
            isCurrent && 'bg-primary-subtle text-primary-subtle-fg font-semibold',
            isFocusVisible && 'outline-2 outline-ring ring-2 ring-ring/20',
            (isHovered || isPressed) && 'bg-accent text-accent-fg',
            className
          )
      )}
      {...props}
    >
      {(values) => (
        <>
          {icon && <span data-slot="icon" className="shrink-0 size-4.5">{icon}</span>}
          {!isCollapsed && (
            <span className="truncate">
              {typeof children === 'function' ? children({ ...values, isCollapsed }) : children}
            </span>
          )}
        </>
      )}
    </RACLink>
  )
}

export const SidebarItem = createInterfaceComponent<SidebarItemProps>(
  {
    name: 'SidebarItem',
    category: 'navigation',
    description: 'Accessible interactive sidebar navigation link with active indicators, icon slots, and dock tooltip.',
    version: '1.0.0',
    props: {
      isCurrent: false,
    },
  },
  SidebarItemPrimitive
)

export interface SidebarTriggerProps extends React.ComponentPropsWithoutRef<typeof Button> {
  /** Custom CSS classes for the toggle trigger button. */
  className?: string
}

const SidebarTriggerPrimitive = ({
  onPress,
  className,
  children,
  ...props
}: SidebarTriggerProps) => {
  const { toggleSidebar } = useSidebar()
  return (
    <Button
      aria-label={props['aria-label'] || 'Toggle Sidebar'}
      data-slot="sidebar-trigger"
      intent={props.intent || 'plain'}
      size={props.size || 'sq-sm'}
      className={cn('shrink-0', className)}
      onPress={(event) => {
        onPress?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      {children || (
        <svg
          className="size-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M13.25 2.5c.69 0 1.25.56 1.25 1.25v8.5c0 .69-.56 1.25-1.25 1.25H7.5V15h5.75A2.75 2.75 0 0 0 16 12.25v-8.5A2.75 2.75 0 0 0 13.25 1H7.5v1.5zM5.75 1a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-3A2.75 2.75 0 0 1 0 12.25v-8.5A2.75 2.75 0 0 1 2.75 1z" />
        </svg>
      )}
    </Button>
  )
}

export const SidebarTrigger = createInterfaceComponent<SidebarTriggerProps>(
  {
    name: 'SidebarTrigger',
    category: 'navigation',
    description: 'Toggle button that expands or collapses the parent sidebar layout.',
    version: '1.0.0',
  },
  SidebarTriggerPrimitive
)

export interface SidebarInsetProps extends React.ComponentPropsWithoutRef<'main'> {
  /** Custom CSS classes for the main inset viewport container. */
  className?: string
}

const SidebarInsetPrimitive = ({ className, ...props }: SidebarInsetProps) => {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn('relative flex w-full flex-1 flex-col bg-bg min-w-0 overflow-hidden', className)}
      {...props}
    />
  )
}

export const SidebarInset = createInterfaceComponent<SidebarInsetProps>(
  {
    name: 'SidebarInset',
    category: 'navigation',
    description: 'Main view viewport inset area adjacent to the application sidebar.',
    version: '1.0.0',
  },
  SidebarInsetPrimitive
)

export interface SidebarRailProps extends React.ComponentPropsWithoutRef<'button'> {
  /** Custom CSS classes for the interactive resize rail. */
  className?: string
}

const SidebarRailPrimitive = ({ className, ...props }: SidebarRailProps) => {
  const { toggleSidebar } = useSidebar()
  return (
    <button
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      className={cn(
        'absolute inset-y-0 end-0 z-30 hidden w-1.5 cursor-col-resize hover:bg-primary/50 transition-colors md:block',
        className
      )}
      {...props}
    />
  )
}

export const SidebarRail = createInterfaceComponent<SidebarRailProps>(
  {
    name: 'SidebarRail',
    category: 'navigation',
    description: 'Invisible draggable edge rail enabling interactive sidebar expansion and resizing.',
    version: '1.0.0',
  },
  SidebarRailPrimitive
)

export interface SidebarSeparatorProps extends RACSeparatorProps {
  /** Custom CSS classes for the sidebar separator. */
  className?: string
}

const SidebarSeparatorPrimitive = ({ className, ...props }: SidebarSeparatorProps) => {
  return (
    <RACSeparator
      data-slot="sidebar-separator"
      orientation="horizontal"
      className={cn('my-space-sm h-px w-full bg-border/60', className)}
      {...props}
    />
  )
}

export const SidebarSeparator = createInterfaceComponent<SidebarSeparatorProps>(
  {
    name: 'SidebarSeparator',
    category: 'navigation',
    description: 'Themed horizontal boundary separator styled specifically for sidebar themes.',
    version: '1.0.0',
  },
  SidebarSeparatorPrimitive
)

// Namespace attachments for compound family ergonomics
Sidebar.Provider = SidebarProvider
Sidebar.Header = SidebarHeader
Sidebar.Footer = SidebarFooter
Sidebar.Content = SidebarContent
Sidebar.Section = SidebarSection
Sidebar.Item = SidebarItem
Sidebar.Trigger = SidebarTrigger
Sidebar.Inset = SidebarInset
Sidebar.Rail = SidebarRail
Sidebar.Separator = SidebarSeparator

