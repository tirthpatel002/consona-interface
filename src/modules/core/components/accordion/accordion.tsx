import React from 'react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import {
  DisclosureGroup as RACDisclosureGroup,
  type DisclosureGroupProps as RACDisclosureGroupProps,
  Disclosure as RACDisclosure,
  type DisclosureProps as RACDisclosureProps,
  Button as RACButton,
  type ButtonProps as RACButtonProps,
  Heading as RACHeading,
  type HeadingProps as RACHeadingProps,
} from 'react-aria-components'
import { AnimatePresence, motion, type HTMLMotionProps } from 'motion/react'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { createCompoundContext } from '../../../../core/context'

/* ==========================================================================
   Contexts
   ========================================================================== */

export interface AccordionContextValue {
  variant?: 'bordered' | 'separated' | 'flush'
}

export const {
  Provider: AccordionProvider,
  useCompoundContext: useAccordionContext,
  useOptionalCompoundContext: useOptionalAccordionContext,
  Context: AccordionContext,
} = createCompoundContext<AccordionContextValue>('Accordion')

export interface AccordionItemContextValue {
  isExpanded: boolean
  variant?: 'bordered' | 'separated' | 'flush'
}

export const {
  Provider: AccordionItemProvider,
  useCompoundContext: useAccordionItemContext,
  useOptionalCompoundContext: useOptionalAccordionItemContext,
  Context: AccordionItemContext,
} = createCompoundContext<AccordionItemContextValue>('AccordionItem')

/* ==========================================================================
   Accordion Styles & Ramps
   ========================================================================== */

export const accordionStyles = tv({
  base: 'w-full flex flex-col',
  variants: {
    variant: {
      bordered: 'border border-border/80 rounded-macro divide-y divide-border/80 overflow-hidden bg-overlay/30',
      separated: 'gap-y-2.5',
      flush: 'divide-y divide-border/80',
    },
  },
  defaultVariants: {
    variant: 'bordered',
  },
})

export const accordionItemStyles = tv({
  base: 'group flex flex-col transition-colors duration-150',
  variants: {
    variant: {
      bordered: 'first:rounded-t-[inherit] last:rounded-b-[inherit]',
      separated: 'border border-border/80 rounded-base bg-overlay/30 overflow-hidden',
      flush: '',
    },
  },
  defaultVariants: {
    variant: 'bordered',
  },
})

export const accordionTriggerStyles = tv({
  base: [
    'flex w-full cursor-pointer items-center justify-between gap-space-lg px-space-lg py-3.5 text-left text-sm font-bold text-fg outline-none transition-all duration-150',
    'hover:bg-muted/40 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1',
    'disabled:cursor-not-allowed disabled:opacity-40',
  ],
})

/* ==========================================================================
   Accordion Root Primitive & Factory
   ========================================================================== */

export interface AccordionSlots {}

export interface AccordionProps
  extends RACDisclosureGroupProps,
    VariantProps<typeof accordionStyles> {
  /** Visual variant: bordered, separated, flush. */
  variant?: 'bordered' | 'separated' | 'flush'
  /** Child accordion items or compound elements */
  children?: React.ReactNode | ((values: any) => React.ReactNode)
  /** Additional CSS class names. */
  className?: string
  /** Slot component overrides. */
  slots?: SlotComponents<AccordionSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<AccordionSlots>
}

const AccordionPrimitive = ({
  className,
  variant = 'bordered',
  children,
  slots = {},
  slotProps = {},
  ...props
}: AccordionProps) => {
  return (
    <AccordionProvider value={{ variant }}>
      <RACDisclosureGroup
        data-slot="accordion"
        className={cn(accordionStyles({ variant }), className)}
        {...props}
      >
        {children}
      </RACDisclosureGroup>
    </AccordionProvider>
  )
}

export const Accordion = createInterfaceComponent<AccordionProps, AccordionSlots>(
  {
    name: 'Accordion',
    category: 'layout',
    description: 'Expandable disclosure accordion matrix with bordered, separated, and flush optical variants.',
    version: '1.0.0',
    props: {
      variant: 'bordered',
    },
    slots: {},
  },
  AccordionPrimitive
)

/* ==========================================================================
   Accordion Sub-Atoms
   ========================================================================== */

export interface AccordionItemSlots {
  /** Header title trigger slot */
  trigger?: React.ComponentType<AccordionTriggerProps>
  /** Content panel slot */
  content?: React.ComponentType<AccordionContentProps>
}

export interface AccordionItemProps
  extends RACDisclosureProps,
    VariantProps<typeof accordionItemStyles> {
  /** Visual variant: bordered, separated, flush. */
  variant?: 'bordered' | 'separated' | 'flush'
  /** Header title text. */
  title?: string
  /** Header description text. */
  description?: string
  /** Optional icon element. */
  icon?: React.ReactNode
  /** Child content or render function */
  children?: React.ReactNode | ((values: any) => React.ReactNode)
  /** Additional CSS class names. */
  className?: string
  /** Slot component overrides. */
  slots?: SlotComponents<AccordionItemSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<AccordionItemSlots>
}

const AccordionItemPrimitive = ({
  className,
  variant: propVariant,
  title,
  description,
  icon,
  slots = {},
  slotProps = {},
  children,
  ...props
}: AccordionItemProps) => {
  const accordionContext = useOptionalAccordionContext()
  const variant = propVariant ?? accordionContext?.variant ?? 'bordered'

  return (
    <RACDisclosure
      data-slot="accordion-item"
      className={(values) =>
        cn(
          accordionItemStyles({ variant }),
          typeof className === 'function' ? (className as any)(values) : className
        )
      }
      {...props}
    >
      {(itemState) => (
        <AccordionItemProvider value={{ isExpanded: itemState.isExpanded, variant }}>
          {title ? (
            <AccordionHeading>
              <AccordionTrigger
                icon={icon}
                description={description}
                slots={slots.trigger ? { trigger: slots.trigger } : undefined}
                {...slotProps.trigger}
              >
                {title}
              </AccordionTrigger>
            </AccordionHeading>
          ) : null}

          {renderSlot(slots.trigger, slotProps.trigger)}

          {typeof children === 'function' ? (
            children(itemState)
          ) : (
            renderSlot(
              slots.content,
              { children, ...slotProps.content },
              { defaultComponent: AccordionContent }
            )
          )}
        </AccordionItemProvider>
      )}
    </RACDisclosure>
  )
}

export const AccordionItem = createInterfaceComponent<AccordionItemProps, AccordionItemSlots>(
  {
    name: 'AccordionItem',
    category: 'layout',
    description: 'Individual expandable panel item within an accordion group.',
    version: '1.0.0',
    props: {
      variant: 'bordered',
    },
    slots: {
      trigger: undefined,
      content: undefined,
    },
  },
  AccordionItemPrimitive
)

export interface AccordionHeadingProps extends RACHeadingProps {}

const AccordionHeadingPrimitive = ({ className, ...props }: AccordionHeadingProps) => {
  return (
    <RACHeading
      data-slot="accordion-heading"
      className={cn('flex m-0', className)}
      {...props}
    />
  )
}

export const AccordionHeading = createInterfaceComponent<AccordionHeadingProps>(
  {
    name: 'AccordionHeading',
    category: 'layout',
    description: 'Heading container wrapping accordion triggers.',
    version: '1.0.0',
  },
  AccordionHeadingPrimitive
)

export interface AccordionTriggerProps extends RACButtonProps {
  /** Optional icon before title */
  icon?: React.ReactNode
  /** Optional subtitle or description text */
  description?: string
  /** Rotate indicator chevron on open */
  showChevron?: boolean
}

const AccordionTriggerPrimitive = ({
  className,
  icon,
  description,
  showChevron = true,
  children,
  ...props
}: AccordionTriggerProps) => {
  const itemContext = useOptionalAccordionItemContext()

  return (
    <RACButton
      slot="trigger"
      data-slot="accordion-trigger"
      className={(values) =>
        cn(
          accordionTriggerStyles(),
          typeof className === 'function' ? (className as any)(values) : className
        )
      }
      {...props}
    >
      {(buttonState) => {
        const isExpanded = itemContext?.isExpanded ?? false
        return (
          <>
            <div className="flex items-center gap-space-md min-w-0">
              {icon && <span data-slot="icon" className="size-4 shrink-0 text-muted-fg">{icon}</span>}
              <div className="flex flex-col gap-space-2xs min-w-0 text-left">
                <span className="truncate">
                  {typeof children === 'function' ? children(buttonState) : children}
                </span>
                {description && (
                  <span className="text-2xs text-muted-fg font-normal truncate">
                    {description}
                  </span>
                )}
              </div>
            </div>
            {showChevron && (
              <motion.span
                className="flex items-center justify-center shrink-0"
                animate={{
                  rotate: isExpanded ? 180 : 0,
                  color: isExpanded ? 'var(--color-primary)' : 'var(--color-muted-fg)',
                }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <ChevronDownIcon className="size-4" />
              </motion.span>
            )}
          </>
        )
      }}
    </RACButton>
  )
}

export const AccordionTrigger = createInterfaceComponent<AccordionTriggerProps>(
  {
    name: 'AccordionTrigger',
    category: 'layout',
    description: 'Clickable header trigger toggling accordion expansion state with smooth chevron rotation.',
    version: '1.0.0',
    props: {
      showChevron: true,
    },
  },
  AccordionTriggerPrimitive
)

export interface AccordionContentProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  /** Child elements */
  children?: React.ReactNode
  /** className */
  className?: string
}

const AccordionContentPrimitive = ({
  className,
  children,
  ...props
}: AccordionContentProps) => {
  const itemContext = useOptionalAccordionItemContext()
  const isExpanded = itemContext?.isExpanded ?? false

  return (
    <AnimatePresence initial={false}>
      {isExpanded && (
        <motion.div
          data-slot="accordion-content"
          role="region"
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: 'auto',
            opacity: 1,
            transition: {
              height: {
                duration: 0.3,
                ease: [0.16, 1, 0.3, 1],
              },
              opacity: {
                duration: 0.22,
                delay: 0.04,
                ease: 'easeOut',
              },
            },
          }}
          exit={{
            height: 0,
            opacity: 0,
            transition: {
              height: {
                duration: 0.24,
                ease: [0.16, 1, 0.3, 1],
              },
              opacity: {
                duration: 0.15,
                ease: 'easeIn',
              },
            },
          }}
          className={cn(
            'overflow-hidden text-xs sm:text-sm text-muted-fg leading-relaxed',
            typeof className === 'function' ? (className as any)({ isExpanded }) : className
          )}
          {...props}
        >
          <div className="px-space-lg pb-space-lg pt-space-xs">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export const AccordionContent = createInterfaceComponent<AccordionContentProps>(
  {
    name: 'AccordionContent',
    category: 'layout',
    description: 'Collapsible content panel container housing child elements.',
    version: '1.0.0',
  },
  AccordionContentPrimitive
)

// Standalone Collapsible component specialization
export const Collapsible = AccordionItem.extend({
  name: 'Collapsible',
  props: {
    variant: 'separated',
  },
})

// Namespace attachments for compound family ergonomics
Accordion.Provider = AccordionProvider
Accordion.Item = AccordionItem
Accordion.Trigger = AccordionTrigger
Accordion.Heading = AccordionHeading
Accordion.Content = AccordionContent
Accordion.Collapsible = Collapsible

Collapsible.Provider = AccordionProvider
Collapsible.Trigger = AccordionTrigger
Collapsible.Heading = AccordionHeading
Collapsible.Content = AccordionContent

export const { Context: CollapsibleContext, useCompoundContext: useCollapsibleContext } =
  createCompoundContext<any>('Collapsible')
