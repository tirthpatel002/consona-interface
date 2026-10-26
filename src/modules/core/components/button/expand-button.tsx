import React, {
    useState,
    useRef,
    useEffect,
    useCallback,
    type ComponentProps,
    type ReactNode,
} from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'

/* ==========================================================================
   ExpandButton Types & Context
   ========================================================================== */

export const EXPAND_BUTTON_SPRING = {
    type: 'spring',
    stiffness: 200,
    damping: 22,
    mass: 1.2,
} as const

export interface ExpandDetailItem {
    /** Unique identifier for the item. */
    id?: string
    /** Field header title text. */
    label: ReactNode
    /** Field metric value text. */
    value: ReactNode
    /** Column span across the 2-column detail grid (1 or 2). Default: 1 */
    span?: 1 | 2
    /** Optional leading icon element. */
    icon?: ReactNode
    /** Custom CSS classes. */
    className?: string
}

export interface ExpandButtonContextValue {
    /** Whether the details disclosure card is currently expanded. */
    isOpen: boolean
    /** Method to update or toggle expanded state. */
    setOpen: (open: boolean) => void
    /** Trigger label text. */
    label: ReactNode
    /** Collapsed trigger width (number in px or CSS string). */
    collapsedWidth: number | string
    /** Expanded container width (number in px or CSS string). */
    expandedWidth: number | string
    /** Injected slot overrides map. */
    slots?: SlotComponents<ExpandButtonSlots>
    /** Injected slot props overrides map. */
    slotProps?: SlotPropsMap<ExpandButtonSlots>
}

export const {
    Provider: ExpandButtonProvider,
    useCompoundContext: useExpandButtonContext,
    useOptionalCompoundContext: useOptionalExpandButtonContext,
} = createCompoundContext<ExpandButtonContextValue>('ExpandButton')

/* ==========================================================================
   ExpandButton Trigger
   ========================================================================== */

export interface ExpandButtonTriggerProps extends ComponentProps<'button'> {
    /** Custom CSS classes for the trigger button. */
    className?: string
    /** Label text for the trigger button. */
    label?: ReactNode
    /** Custom chevron icon element. */
    chevron?: ReactNode
    /** Children to render inside the trigger button. */
    children?: ReactNode
}

const ExpandButtonTriggerPrimitive = ({
    className,
    label,
    chevron,
    children,
    onClick,
    ...props
}: ExpandButtonTriggerProps) => {
    const ctx = useOptionalExpandButtonContext()
    const isOpen = ctx?.isOpen ?? false
    const displayLabel = label ?? ctx?.label ?? 'Details'

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        ctx?.setOpen(!isOpen)
        onClick?.(e)
    }

    return (
        <button
            type="button"
            data-slot="expand-button-trigger"
            aria-expanded={isOpen}
            onClick={handleClick}
            className={cn(
                'group flex w-full cursor-pointer items-center gap-1.5 text-muted-fg transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-base select-none',
                className
            )}
            {...props}
        >
            {children ?? (
                <>
                    <motion.div
                        animate={{ rotate: isOpen ? 0 : -90 }}
                        transition={{ duration: 0.2, ease: 'easeOut', delay: isOpen ? 0.25 : 0 }}
                        className="flex items-center justify-center shrink-0"
                    >
                        {chevron ?? (
                            <ChevronDownIcon className="size-4 stroke-2 text-muted-fg group-hover:text-fg transition-colors" />
                        )}
                    </motion.div>

                    <span className="text-sm font-medium text-fg whitespace-nowrap">
                        {displayLabel}
                    </span>
                </>
            )}
        </button>
    )
}

export const ExpandButtonTrigger = createInterfaceComponent<ExpandButtonTriggerProps>(
    {
        name: 'ExpandButtonTrigger',
        category: 'form',
        description: 'Interactive header trigger with synchronized rotating chevron and label.',
        version: '1.0.0',
    },
    ExpandButtonTriggerPrimitive
)

/* ==========================================================================
   ExpandButton Item & Grid
   ========================================================================== */

export interface ExpandButtonItemProps extends ComponentProps<'div'> {
    /** Item model definition. */
    item?: ExpandDetailItem
    /** Field label text. */
    label?: ReactNode
    /** Field value / metric text. */
    value?: ReactNode
    /** Grid column span: 1 or 2. */
    span?: 1 | 2
    /** Custom CSS classes. */
    className?: string
}

const ExpandButtonItemPrimitive = ({
    item,
    label: directLabel,
    value: directValue,
    span: directSpan,
    className,
    children,
    ...props
}: ExpandButtonItemProps) => {
    const label = directLabel ?? item?.label
    const value = directValue ?? item?.value
    const span = directSpan ?? item?.span ?? 1

    return (
        <div
            data-slot="expand-button-item"
            className={cn(
                'flex flex-col',
                span === 2 && 'col-span-2',
                item?.className,
                className
            )}
            {...props}
        >
            {children ?? (
                <>
                    <div className="text-xs font-medium text-muted-fg">
                        {label}
                    </div>
                    <div className="mt-1 text-sm sm:text-base font-semibold tracking-tight text-fg">
                        {value}
                    </div>
                </>
            )}
        </div>
    )
}

export const ExpandButtonItem = createInterfaceComponent<ExpandButtonItemProps>(
    {
        name: 'ExpandButtonItem',
        category: 'layout',
        description: 'Individual key-value metric field within the expanded details disclosure.',
        version: '1.0.0',
    },
    ExpandButtonItemPrimitive
)

export interface ExpandButtonGridProps extends ComponentProps<'div'> {
    /** Array of detail items to render in the grid. */
    items?: ExpandDetailItem[]
    /** Custom CSS classes. */
    className?: string
}

const ExpandButtonGridPrimitive = ({
    items = [],
    className,
    children,
    ...props
}: ExpandButtonGridProps) => {
    return (
        <div
            data-slot="expand-button-grid"
            className={cn('mt-3 ml-6 grid grid-cols-2 gap-x-4 gap-y-4 sm:gap-y-5', className)}
            {...props}
        >
            {children ??
                items.map((item, index) => (
                    <ExpandButtonItem key={item.id ?? index} item={item} />
                ))}
        </div>
    )
}

export const ExpandButtonGrid = createInterfaceComponent<ExpandButtonGridProps>(
    {
        name: 'ExpandButtonGrid',
        category: 'layout',
        description: 'Two-column detail grid container for metric fields.',
        version: '1.0.0',
    },
    ExpandButtonGridPrimitive
)

/* ==========================================================================
   ExpandButton Content
   ========================================================================== */

export interface ExpandButtonContentProps extends ComponentProps<'div'> {
    /** Array of detail items to render if no children provided. */
    items?: ExpandDetailItem[]
    /** Custom CSS classes. */
    className?: string
}

const ExpandButtonContentPrimitive = ({
    items,
    className,
    children,
    ...props
}: ExpandButtonContentProps) => {
    const ctx = useOptionalExpandButtonContext()
    const isOpen = ctx?.isOpen ?? false

    return (
        <AnimatePresence initial={false}>
            {isOpen && (
                <motion.div
                    key="expand-content"
                    data-slot="expand-button-content"
                    initial={{
                        opacity: 0,
                        filter: 'blur(8px)',
                        y: 30,
                    }}
                    animate={{
                        opacity: 1,
                        filter: 'blur(0px)',
                        y: 0,
                        transition: {
                            type: 'spring',
                            duration: 0.35,
                            bounce: 0,
                            delay: 0.25,
                        },
                    }}
                    exit={{
                        opacity: 0,
                        filter: 'blur(6px)',
                        y: 12,
                        transition: {
                            duration: 0.15,
                            ease: 'easeOut',
                        },
                    }}
                    className={cn('w-full max-w-full overflow-hidden', className)}
                    {...(props as any)}
                >
                    {children ?? <ExpandButtonGrid items={items} />}
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export const ExpandButtonContent = createInterfaceComponent<ExpandButtonContentProps>(
    {
        name: 'ExpandButtonContent',
        category: 'layout',
        description: 'Animated detail panel with staggered spring blur and translateY physics.',
        version: '1.0.0',
    },
    ExpandButtonContentPrimitive
)

/* ==========================================================================
   ExpandButton Root
   ========================================================================== */

export interface ExpandButtonSlots {
    /** Custom trigger header button. */
    trigger?: typeof ExpandButtonTrigger
    /** Custom content panel. */
    content?: typeof ExpandButtonContent
    /** Custom detail grid. */
    grid?: typeof ExpandButtonGrid
    /** Custom chevron icon. */
    chevron?: React.ComponentType<{ className?: string }>
}

export interface ExpandButtonProps
    extends Omit<ComponentProps<'div'>, 'title'> {
    /** Controlled open state. */
    isOpen?: boolean
    /** Alias for isOpen. */
    isExpanded?: boolean
    /** Initial open state in uncontrolled mode. Default: true */
    defaultOpen?: boolean
    /** Alias for defaultOpen. */
    defaultExpanded?: boolean
    /** Callback fired when open state changes. */
    onOpenChange?: (open: boolean) => void
    /** Alias for onOpenChange. */
    onExpandedChange?: (expanded: boolean) => void
    /** Trigger button label text. Default: 'Details' */
    label?: ReactNode
    /** Collapsed container width in pixels or CSS value. Default: 'auto' (fits trigger label naturally) */
    collapsedWidth?: number | string
    /** Expanded container width in pixels or CSS value. Default: 320 */
    expandedWidth?: number | string
    /** Predefined detail metric items. */
    items?: ExpandDetailItem[]
    /** Slot overrides map. */
    slots?: SlotComponents<ExpandButtonSlots>
    /** Slot props overrides map. */
    slotProps?: SlotPropsMap<ExpandButtonSlots>
    /** Custom CSS classes for the container. */
    className?: string
    /** Children elements for compound customization. */
    children?: ReactNode
}

const ExpandButtonPrimitive = ({
    isOpen: controlledIsOpen,
    isExpanded,
    defaultOpen = true,
    defaultExpanded,
    onOpenChange,
    onExpandedChange,
    label = 'Details',
    collapsedWidth = 'auto',
    expandedWidth = 320,
    items = [],
    slots,
    slotProps,
    className,
    children,
    ...props
}: ExpandButtonProps) => {
    const initialOpen = defaultExpanded ?? defaultOpen
    const [internalOpen, setInternalOpen] = useState<boolean>(initialOpen)
    const isControlled = controlledIsOpen !== undefined || isExpanded !== undefined
    const open = isControlled ? Boolean(controlledIsOpen ?? isExpanded) : internalOpen

    const [measuredHeight, setMeasuredHeight] = useState<number | 'auto'>('auto')
    const contentRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Track state transitions so spring delays apply exclusively on open/close, not on inner control re-renders
    const prevOpenRef = useRef<boolean>(open)
    const isStateTransition = prevOpenRef.current !== open

    useEffect(() => {
        prevOpenRef.current = open
    }, [open])

    const setOpen = useCallback(
        (newOpen: boolean) => {
            if (!isControlled) {
                setInternalOpen(newOpen)
            }
            onOpenChange?.(newOpen)
            onExpandedChange?.(newOpen)
        },
        [isControlled, onOpenChange, onExpandedChange]
    )

    // Measure content bounds dynamically using ResizeObserver without unmounting on children re-renders
    useEffect(() => {
        const el = contentRef.current
        if (!el || typeof ResizeObserver === 'undefined') return

        const updateHeight = () => {
            const h = el.getBoundingClientRect().height || el.offsetHeight
            if (h > 0) {
                setMeasuredHeight((prev) => {
                    if (typeof prev === 'number' && Math.abs(prev - h) < 1) {
                        return prev
                    }
                    return Math.ceil(h)
                })
            }
        }

        updateHeight()
        const observer = new ResizeObserver(updateHeight)
        observer.observe(el)

        return () => {
            observer.disconnect()
        }
    }, [open])

    // Outside click and Escape key dismissal
    useEffect(() => {
        if (!open) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setOpen(false)
            }
        }

        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('touchstart', handleClickOutside)

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('touchstart', handleClickOutside)
        }
    }, [open, setOpen])

    const [autoCollapsedWidth, setAutoCollapsedWidth] = useState<number | 'auto'>('auto')
    const anchorRef = useRef<HTMLDivElement>(null)

    // Measure natural trigger width for collapsed state with buffer for exact border fit
    useEffect(() => {
        const el = anchorRef.current
        if (!el) return

        const updateWidth = () => {
            const w = el.getBoundingClientRect().width || el.offsetWidth
            if (w > 0) {
                setAutoCollapsedWidth(Math.ceil(w) + 2)
            }
        }

        updateWidth()
        if (typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(updateWidth)
            observer.observe(el)
            return () => observer.disconnect()
        }
    }, [label])

    const contextValue = React.useMemo<ExpandButtonContextValue>(
        () => ({
            isOpen: open,
            setOpen,
            label,
            collapsedWidth,
            expandedWidth,
            slots,
            slotProps,
        }),
        [open, setOpen, label, collapsedWidth, expandedWidth, slots, slotProps]
    )

    const resolvedCollapsedWidth =
        collapsedWidth !== undefined && collapsedWidth !== 'auto'
            ? collapsedWidth
            : typeof autoCollapsedWidth === 'number' && autoCollapsedWidth > 0
                ? autoCollapsedWidth
                : 'max-content'

    const targetWidth = open ? expandedWidth : resolvedCollapsedWidth

    // Compute transition config: delayed spring on state open/close toggle, immediate/smooth on inner interactions
    const transitionConfig = React.useMemo(() => {
        if (isStateTransition) {
            return {
                height: {
                    ...EXPAND_BUTTON_SPRING,
                    delay: open ? 0.25 : 0,
                },
                width: {
                    ...EXPAND_BUTTON_SPRING,
                    delay: open ? 0 : 0.25,
                },
                borderRadius: EXPAND_BUTTON_SPRING,
            }
        }

        // Steady state: zero delayed animations during slider dragging or preset changes
        return {
            width: { duration: 0 },
            height: {
                type: 'spring' as const,
                stiffness: 300,
                damping: 30,
                delay: 0,
            },
            borderRadius: { duration: 0 },
        }
    }, [isStateTransition, open])

    return (
        <ExpandButtonProvider value={contextValue}>
            <div
                ref={containerRef}
                data-slot="expand-button"
                className={cn('relative inline-flex items-start select-none', className)}
                {...props}
            >
                {/* Invisible anchor holding stationary DOM footprint so surrounding UI never shifts */}
                <div
                    ref={anchorRef}
                    aria-hidden="true"
                    className="invisible pointer-events-none opacity-0 select-none inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-transparent rounded-base whitespace-nowrap w-max"
                >
                    <ChevronDownIcon className="size-4 stroke-2 shrink-0" />
                    <span>{label}</span>
                </div>

                {/* Floating morphing card with exact two-phase staggered spring timing */}
                <motion.div
                    animate={{
                        width: targetWidth,
                        height: typeof measuredHeight === 'number' && measuredHeight > 0 ? measuredHeight : 'auto',
                        borderRadius: open ? 'var(--radius-macro, 20px)' : 'var(--radius-base, 24px)',
                    }}
                    transition={transitionConfig}
                    onClick={!open ? () => setOpen(true) : undefined}
                    className={cn(
                        'absolute top-0 left-0 z-40 overflow-hidden bg-bg-surface text-fg border border-border shadow-xs backdrop-blur-md',
                        !open && 'cursor-pointer hover:bg-bg-subtle/80 hover:border-border/90 active:scale-[0.99]',
                        open && 'shadow-xl border-border/90 bg-bg-surface'
                    )}
                >
                    <div ref={contentRef} className="relative px-4 py-2">
                        {children != null ? (
                            children
                        ) : (
                            <>
                                {renderSlot(
                                    slots?.trigger,
                                    {
                                        label,
                                        chevron: renderSlot(
                                            slots?.chevron,
                                            {
                                                className:
                                                    'size-4 stroke-2 text-muted-fg group-hover:text-fg transition-colors',
                                                ...(slotProps?.chevron as object),
                                            },
                                            { defaultComponent: ChevronDownIcon }
                                        ),
                                        ...(slotProps?.trigger as object),
                                    },
                                    { defaultComponent: ExpandButtonTrigger }
                                )}
                                {renderSlot(
                                    slots?.content,
                                    {
                                        items,
                                        children: renderSlot(
                                            slots?.grid,
                                            {
                                                items,
                                                ...(slotProps?.grid as object),
                                            },
                                            { defaultComponent: ExpandButtonGrid }
                                        ),
                                        ...(slotProps?.content as object),
                                    },
                                    { defaultComponent: ExpandButtonContent }
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </ExpandButtonProvider>
    )
}

export const ExpandButton = createInterfaceComponent<ExpandButtonProps, ExpandButtonSlots>(
    {
        name: 'ExpandButton',
        category: 'form',
        description:
            'Floating morphing details expansion card with staggered spring width/height timing, blur reveal physics, and metric grid slot composition without shifting surrounding UI layout.',
        version: '1.0.0',
        props: {
            defaultOpen: true,
            label: 'Details',
            collapsedWidth: 'auto',
            expandedWidth: 320,
        },
        slots: {
            trigger: ExpandButtonTrigger,
            content: ExpandButtonContent,
            grid: ExpandButtonGrid,
            chevron: ChevronDownIcon,
        },
    },
    ExpandButtonPrimitive
)

// Namespace attachments for compound family ergonomics
ExpandButton.Trigger = ExpandButtonTrigger
ExpandButton.Content = ExpandButtonContent
ExpandButton.Grid = ExpandButtonGrid
ExpandButton.Item = ExpandButtonItem
ExpandButton.Field = ExpandButtonItem
