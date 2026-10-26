import React from 'react'
import {
  Tabs as RACTabs,
  type TabsProps as RACTabsProps,
  TabList as RACTabList,
  type TabListProps as RACTabListProps,
  Tab as RACTab,
  type TabProps as RACTabProps,
  TabPanel as RACTabPanel,
  type TabPanelProps as RACTabPanelProps,
  type Key,
} from 'react-aria-components'
import { tv, type VariantProps } from 'tailwind-variants'
import { LayoutGroup, motion, type Transition } from 'motion/react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import type { BadgeProps } from '../badge'

/* ==========================================================================
   Tabs Types & Helpers
   ========================================================================== */

export type TabVariant = 'pill' | 'segmented' | 'underline' | 'bordered'
export type TabOrientation = 'horizontal' | 'vertical'
export type TabSize = 'xs' | 'sm' | 'md' | 'lg'

/**
 * Normalizes tab variant according to orientation.
 * Vertical orientation only supports 'segmented' and 'bordered' variants.
 */
export function normalizeTabVariant(
  variant: TabVariant | undefined,
  orientation: TabOrientation | undefined
): TabVariant {
  if (orientation === 'vertical') {
    if (variant === 'bordered') return 'bordered'
    return 'segmented'
  }
  return variant || 'pill'
}

/* ==========================================================================
   Tabs Styles & Ramps
   ========================================================================== */

export const tabListStyles = tv({
  base: 'relative flex outline-none w-fit max-w-full',
  variants: {
    variant: {
      pill: 'p-0.5 rounded-full bg-muted/90 dark:bg-muted/70 border border-border/80 gap-0.5',
      segmented: 'p-0.5 rounded-base bg-muted/90 dark:bg-muted/70 border border-border/80 gap-0.5',
      underline: 'border-b border-border/80 gap-space-md items-end',
      bordered: 'p-0.5 border border-border/80 rounded-base gap-0.5 bg-muted/30 dark:bg-muted/20',
    },
    orientation: {
      horizontal: 'flex-row items-center overflow-x-auto overflow-y-hidden overscroll-x-contain scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
      vertical: 'flex-col items-stretch',
    },
  },
  compoundVariants: [
    {
      orientation: 'vertical',
      variant: 'segmented',
      className: 'w-fit',
    },
    {
      orientation: 'vertical',
      variant: 'bordered',
      className: 'w-fit',
    },
    {
      orientation: 'horizontal',
      variant: 'underline',
      className: 'items-end',
    },
  ],
  defaultVariants: {
    variant: 'pill',
    orientation: 'horizontal',
  },
})

export const tabGliderStyles = tv({
  base: 'absolute pointer-events-none z-0',
  variants: {
    variant: {
      pill: 'inset-0 rounded-full bg-overlay shadow-xs border border-border/50 dark:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.08)]',
      segmented: 'inset-0 rounded-micro bg-primary shadow-xs',
      underline: 'bottom-0 left-0 right-0 h-0.5 bg-primary -mb-px z-10',
      bordered: 'inset-0 rounded-micro bg-overlay shadow-xs border border-border/80',
    },
    orientation: {
      horizontal: '',
      vertical: '',
    },
  },
  defaultVariants: {
    variant: 'pill',
    orientation: 'horizontal',
  },
})

export const tabItemStyles = tv({
  base: [
    'group relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-1.5 font-medium outline-none transition-colors duration-150',
    'focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1',
    'disabled:cursor-not-allowed disabled:opacity-40',
    '*:data-[slot=icon]:size-4 *:data-[slot=icon]:shrink-0',
  ],
  variants: {
    variant: {
      pill: [
        'rounded-full text-muted-fg hover:text-fg hover:bg-fg/[0.04] dark:hover:bg-fg/[0.06]',
        'data-[selected]:text-fg data-[selected]:font-semibold data-[selected]:hover:bg-transparent',
      ],
      segmented: [
        'rounded-micro text-muted-fg hover:text-fg hover:bg-fg/[0.04] dark:hover:bg-fg/[0.06]',
        'data-[selected]:text-primary-fg data-[selected]:font-semibold data-[selected]:hover:bg-transparent',
      ],
      underline: [
        'rounded-none pb-2 pt-1 text-muted-fg hover:text-fg -mb-px bg-transparent hover:bg-transparent',
        'data-[selected]:text-fg data-[selected]:font-semibold data-[selected]:hover:bg-transparent',
      ],
      bordered: [
        'rounded-micro text-muted-fg hover:text-fg hover:bg-fg/[0.04] dark:hover:bg-fg/[0.06]',
        'data-[selected]:text-fg data-[selected]:font-semibold data-[selected]:hover:bg-transparent',
      ],
    },
    orientation: {
      horizontal: 'justify-center',
      vertical: 'justify-start text-left px-2.5 py-1.5 w-full',
    },
    size: {
      xs: 'h-6 px-2 text-[11px] gap-1 *:data-[slot=icon]:size-3',
      sm: 'h-7 px-2.5 text-xs',
      md: 'h-8 px-3 text-xs sm:text-sm',
      lg: 'h-9 px-3.5 text-sm sm:text-base',
    },
  },
  compoundVariants: [
    {
      variant: 'pill',
      size: 'xs',
      className: 'px-2',
    },
    {
      variant: 'pill',
      size: 'sm',
      className: 'px-2.5',
    },
    {
      variant: 'pill',
      size: 'md',
      className: 'px-3',
    },
    {
      variant: 'pill',
      size: 'lg',
      className: 'px-3.5',
    },
    {
      variant: 'underline',
      size: 'xs',
      className: 'px-1 h-6',
    },
    {
      variant: 'underline',
      size: 'sm',
      className: 'px-1 h-7',
    },
    {
      variant: 'underline',
      size: 'md',
      className: 'px-1 h-8',
    },
    {
      variant: 'underline',
      size: 'lg',
      className: 'px-1 h-9',
    },
  ],
  defaultVariants: {
    variant: 'pill',
    orientation: 'horizontal',
    size: 'md',
  },
})

/* ==========================================================================
   Tabs Context
   ========================================================================== */

export interface TabsContextValue {
  variant?: TabVariant
  orientation?: TabOrientation
  gliderId: string
  direction: number
  registerTab?: (id: string | number) => void
  unregisterTab?: (id: string | number) => void
  size?: TabSize
}

export const {
  Context: TabsContext,
  Provider: TabsContextProvider,
  useCompoundContext: useTabsContext,
  useOptionalCompoundContext: useTabsContextOptional,
} = createCompoundContext<TabsContextValue>('Tabs')

/* ==========================================================================
   Tabs Root Primitive & Factory
   ========================================================================== */

export interface TabsSlots {}

export interface TabsProps
  extends Omit<RACTabsProps, 'children'>,
    VariantProps<typeof tabListStyles> {
  /** Explicit children composition or render function. */
  children?: React.ReactNode | ((values: any) => React.ReactNode)
  /** Visual variant: pill, segmented, underline, bordered (vertical only supports segmented and bordered). */
  variant?: TabVariant
  /** Orientation: horizontal, vertical. */
  orientation?: TabOrientation
  /** Sizing dimension token: xs, sm, md, lg. */
  size?: TabSize
  /** Additional CSS class names. */
  className?: string
  /** Slot component overrides. */
  slots?: SlotComponents<TabsSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<TabsSlots>
}

const TabsPrimitive = ({
  className,
  variant = 'pill',
  orientation = 'horizontal',
  size = 'md',
  slots = {},
  slotProps = {},
  children,
  onSelectionChange,
  ...props
}: TabsProps) => {
  const generatedId = React.useId()
  const gliderId = props.id || generatedId

  const resolvedVariant = normalizeTabVariant(variant, orientation)

  const [tabKeys, setTabKeys] = React.useState<string[]>([])
  const [internalSelectedKey, setInternalSelectedKey] = React.useState<Key | undefined>(
    props.selectedKey ?? props.defaultSelectedKey
  )
  const prevKeyRef = React.useRef<Key | undefined>(props.selectedKey ?? props.defaultSelectedKey)
  const [direction, setDirection] = React.useState<number>(1)

  const handleSelectionChange = React.useCallback(
    (key: Key) => {
      const prevKey = prevKeyRef.current
      if (prevKey !== undefined && key !== prevKey) {
        const prevIdx = tabKeys.indexOf(String(prevKey))
        const nextIdx = tabKeys.indexOf(String(key))
        if (prevIdx !== -1 && nextIdx !== -1) {
          setDirection(nextIdx >= prevIdx ? 1 : -1)
        } else {
          setDirection(1)
        }
      }
      prevKeyRef.current = key
      setInternalSelectedKey(key)
      onSelectionChange?.(key)
    },
    [tabKeys, onSelectionChange]
  )

  React.useEffect(() => {
    if (props.selectedKey !== undefined && props.selectedKey !== prevKeyRef.current) {
      const prevIdx = tabKeys.indexOf(String(prevKeyRef.current))
      const nextIdx = tabKeys.indexOf(String(props.selectedKey))
      if (prevIdx !== -1 && nextIdx !== -1) {
        setDirection(nextIdx >= prevIdx ? 1 : -1)
      }
      prevKeyRef.current = props.selectedKey
    }
  }, [props.selectedKey, tabKeys])

  const registerTab = React.useCallback((id: string | number) => {
    const strId = String(id)
    setTabKeys((prev) => (prev.includes(strId) ? prev : [...prev, strId]))
  }, [])

  const unregisterTab = React.useCallback((id: string | number) => {
    const strId = String(id)
    setTabKeys((prev) => prev.filter((k) => k !== strId))
  }, [])

  const contextValue = React.useMemo<TabsContextValue>(
    () => ({
      variant: resolvedVariant,
      orientation,
      gliderId,
      direction,
      registerTab,
      unregisterTab,
      size,
    }),
    [resolvedVariant, orientation, gliderId, direction, registerTab, unregisterTab, size]
  )

  return (
    <TabsContextProvider value={contextValue}>
      <RACTabs
        orientation={orientation}
        data-slot="tabs"
        className={cn(
          'flex max-w-full',
          orientation === 'vertical' ? 'flex-row gap-space-xl' : 'flex-col gap-space-lg',
          className
        )}
        onSelectionChange={handleSelectionChange}
        {...props}
      >
        {children}
      </RACTabs>
    </TabsContextProvider>
  )
}

export const Tabs = createInterfaceComponent<TabsProps, TabsSlots>(
  {
    name: 'Tabs',
    category: 'navigation',
    description: 'Accessible tab matrix container with pill, segmented, and underline optical variants.',
    version: '1.0.0',
    props: {
      variant: 'pill',
      orientation: 'horizontal',
      size: 'md',
    },
    slots: {},
  },
  TabsPrimitive
)

/* ==========================================================================
   Tabs Sub-Atoms
   ========================================================================== */

export interface TabListProps<T extends object = object>
  extends Omit<RACTabListProps<T>, 'children'>,
    VariantProps<typeof tabListStyles> {
  /** Explicit children composition or render function. */
  children?: React.ReactNode | ((item: T) => React.ReactNode)
  /** Visual variant: pill, segmented, underline, bordered (vertical only supports segmented and bordered). */
  variant?: TabVariant
  /** Sizing dimension token: xs, sm, md, lg. */
  size?: TabSize
}

const TabListPrimitive = <T extends object = object>({
  className,
  variant,
  size,
  children,
  ...props
}: TabListProps<T>) => {
  const parentContext = useTabsContextOptional()
  const fallbackId = React.useId()
  const activeOrientation = parentContext?.orientation || 'horizontal'
  const activeVariant = normalizeTabVariant(variant || parentContext?.variant, activeOrientation)
  const activeSize = size || parentContext?.size || 'md'
  const activeGliderId = parentContext?.gliderId || fallbackId
  const activeDirection = parentContext?.direction ?? 1

  const tabListContextValue = React.useMemo<TabsContextValue>(
    () => ({
      variant: activeVariant,
      orientation: activeOrientation,
      gliderId: activeGliderId,
      direction: activeDirection,
      registerTab: parentContext?.registerTab,
      unregisterTab: parentContext?.unregisterTab,
      size: activeSize,
    }),
    [activeVariant, activeOrientation, activeGliderId, activeDirection, parentContext?.registerTab, parentContext?.unregisterTab, activeSize]
  )

  return (
    <TabsContextProvider value={tabListContextValue}>
      {/* Glider layout is scoped to the list: layoutRoot measures relative to this box, so a moving or
          scaling ancestor (popover enter, panel height change) never animates the glider. */}
      <LayoutGroup id={activeGliderId}>
      <motion.div layoutRoot data-slot="tab-list-root" className="relative min-w-0 max-w-full">
      <RACTabList
        data-slot="tab-list"
        className={(values) =>
          cn(
            tabListStyles({ variant: activeVariant, orientation: values.orientation || activeOrientation }),
            typeof className === 'function' ? (className as any)(values) : className
          )
        }
        {...props}
      >
        {children}
      </RACTabList>
      </motion.div>
      </LayoutGroup>
    </TabsContextProvider>
  )
}

export const TabList = createInterfaceComponent<TabListProps<any>>(
  {
    name: 'TabList',
    category: 'navigation',
    description: 'Tab list bar coordinating active tabs and keyboard arrow navigation.',
    version: '1.0.0',
    props: {},
  },
  TabListPrimitive
)

export interface TabSlots {
  /** Optional icon slot */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Optional badge pill slot */
  badge?: React.ComponentType<BadgeProps>
}

export interface TabProps
  extends Omit<RACTabProps, 'children'>,
    VariantProps<typeof tabItemStyles> {
  /** Explicit children composition or render function. */
  children?: React.ReactNode | ((values: any) => React.ReactNode)
  /** Visual variant: pill, segmented, underline, bordered (vertical only supports segmented and bordered). */
  variant?: TabVariant
  /** Size token scaling dimensions: xs, sm, md, lg. */
  size?: TabSize
  /** Optional icon element. */
  icon?: React.ReactNode
  /** Optional badge text or count. */
  badge?: React.ReactNode
  /** Slot component overrides. */
  slots?: SlotComponents<TabSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<TabSlots>
}

const TabPrimitive = ({
  className,
  variant,
  size,
  icon,
  badge,
  slots = {},
  slotProps = {},
  children,
  ...props
}: TabProps) => {
  const context = useTabsContextOptional()
  const activeOrientation = context?.orientation || 'horizontal'
  const activeVariant = normalizeTabVariant(variant || context?.variant, activeOrientation)
  const activeSize = size || context?.size || 'md'
  const gliderId = context?.gliderId || 'default'

  React.useEffect(() => {
    if (props.id !== undefined && context?.registerTab) {
      context.registerTab(props.id)
      return () => {
        context.unregisterTab?.(props.id!)
      }
    }
  }, [props.id, context?.registerTab, context?.unregisterTab])

  return (
    <RACTab
      data-slot="tab"
      className={(values) =>
        cn(
          tabItemStyles({ variant: activeVariant, orientation: activeOrientation, size: activeSize }),
          typeof className === 'function' ? (className as any)(values) : className
        )
      }
      {...props}
    >
      {(tabState) => (
        <>
          {tabState.isSelected && (
            <motion.div
              layoutId={`tab-glider-${gliderId}`}
              data-slot="tab-glider"
              className={tabGliderStyles({ variant: activeVariant, orientation: activeOrientation })}
              transition={{
                type: 'spring',
                stiffness: 340,
                damping: 30,
                mass: 0.5,
              }}
            />
          )}
          <span className="relative z-10 inline-flex items-center flex-nowrap gap-space-xs min-w-0">
            {icon && (
              <span data-slot="icon" className="inline-flex items-center shrink-0">
                {icon}
              </span>
            )}
            {slots?.icon && (
              <span data-slot="icon" className="inline-flex items-center shrink-0">
                {renderSlot(slots?.icon, slotProps?.icon as object)}
              </span>
            )}
            <span className="inline-flex items-center whitespace-nowrap min-w-0">
              {typeof children === 'function' ? children(tabState) : children}
            </span>
            {badge && (
              <span
                data-slot="badge"
                className={cn(
                  'inline-flex items-center self-center px-1.5 py-0.5 leading-none rounded-full text-[10px] font-mono shrink-0 transition-colors',
                  activeVariant === 'segmented'
                    ? 'bg-muted/60 text-muted-fg group-data-[selected]:bg-primary-fg/20 group-data-[selected]:text-primary-fg'
                    : 'bg-muted/60 text-muted-fg group-data-[selected]:bg-primary/20 group-data-[selected]:text-primary'
                )}
              >
                {badge}
              </span>
            )}
            {slots?.badge && (
              <span className="inline-flex items-center self-center shrink-0">
                {renderSlot(slots?.badge, slotProps?.badge as object)}
              </span>
            )}
          </span>
        </>
      )}
    </RACTab>
  )
}

export const Tab = createInterfaceComponent<TabProps, TabSlots>(
  {
    name: 'Tab',
    category: 'navigation',
    description: 'Individual interactive tab element supporting icons and badge count indicators.',
    version: '1.0.0',
    props: {},
    slots: {
      icon: undefined,
      badge: undefined,
    },
  },
  TabPrimitive
)

export interface TabPanelProps extends RACTabPanelProps {
  /** className */
  className?: string
  /** Whether to enable sliding animation (defaults to true) */
  animated?: boolean
  /** Animation style: 'fade' (instant zero-jank crossfade), 'lift' (subtle 4px micro-lift), or 'slide' (gentle 8px directional slide). */
  animationType?: 'fade' | 'lift' | 'slide'
}

const TabPanelPrimitive = ({
  className,
  children,
  animated = true,
  animationType = 'fade',
  ...props
}: TabPanelProps) => {
  const context = useTabsContextOptional()
  const orientation = context?.orientation || 'horizontal'
  const direction = context?.direction ?? 1
  const isVertical = orientation === 'vertical'

  return (
    <RACTabPanel
      data-slot="tab-panel"
      className={cn(
        'outline-none focus:outline-none flex-1 max-w-full min-w-0 data-[inert]:hidden data-[exiting]:hidden',
        className
      )}
      {...props}
    >
      {(values) => {
        const content = typeof children === 'function' ? children(values) : children

        if (!animated) {
          return content
        }

        const variants: Record<'fade' | 'lift' | 'slide', { initial: any; animate: any; transition: Transition }> = {
          fade: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { duration: 0.24, ease: [0.25, 0.1, 0.25, 1] as const },
          },
          lift: {
            initial: { opacity: 0, y: 3 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] as const },
          },
          slide: {
            initial: {
              opacity: 0,
              x: isVertical ? 0 : direction * 6,
              y: isVertical ? direction * 6 : 0,
            },
            animate: { opacity: 1, x: 0, y: 0 },
            transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] as const },
          },
        }

        const selectedConfig = variants[animationType] || variants.fade

        return (
          <motion.div
            key={props.id ? String(props.id) : undefined}
            initial={selectedConfig.initial}
            animate={selectedConfig.animate}
            transition={selectedConfig.transition}
            className="w-full h-full min-w-0"
          >
            {content}
          </motion.div>
        )
      }}
    </RACTabPanel>
  )
}

export const TabPanel = createInterfaceComponent<TabPanelProps>(
  {
    name: 'TabPanel',
    category: 'navigation',
    description: 'Content container associated with the active selected tab.',
    version: '1.0.0',
    props: {
      animated: true,
      animationType: 'fade',
    },
  },
  TabPanelPrimitive
)

// SegmentedControl specialization
export const SegmentedControl = Tabs.extend({
  name: 'SegmentedControl',
  props: {
    variant: 'segmented',
  },
})

// Namespace attachments for compound family ergonomics
Tabs.List = TabList
Tabs.Tab = Tab
Tabs.Panel = TabPanel
Tabs.Segmented = SegmentedControl


