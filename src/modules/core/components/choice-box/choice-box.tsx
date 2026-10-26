import React, { createContext, useContext } from 'react'
import {
  GridList as RACGridList,
  type GridListProps as RACGridListProps,
  GridListItem as RACGridListItem,
  type GridListItemProps as RACGridListItemProps,
  Text as RACText,
  type TextProps as RACTextProps,
  composeRenderProps,
} from 'react-aria-components'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Checkbox, CheckboxField } from '../checkbox'
import { Radio } from '../radio'
import type { AvatarProps } from '../avatar'

/* ==========================================================================
   ChoiceBox Styles & Ramps
   ========================================================================== */

export const choiceBoxStyles = tv({
  base: 'grid gap-space-md w-full',
  variants: {
    columns: {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
      5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
      6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
    },
    gap: {
      0: 'gap-0',
      1: 'gap-space-xs',
      2: 'gap-space-sm',
      3: 'gap-space-md',
      4: 'gap-space-lg',
      5: 'gap-5',
      6: 'gap-space-xl',
    },
  },
  defaultVariants: {
    columns: 1,
    gap: 3,
  },
})

export const choiceBoxItemStyles = tv({
  base: [
    'group/choice relative flex cursor-pointer select-none items-start gap-space-md rounded-macro p-3.5 sm:p-space-lg',
    'border border-border/40 bg-surface/70 backdrop-blur-sm text-fg transition-all duration-150 outline-none',
    'hover:border-border/70 hover:bg-surface/90',
    'focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-primary',
    'data-[selected]:border-primary data-[selected]:bg-primary/5 dark:data-[selected]:bg-primary/10 data-[selected]:ring-1 data-[selected]:ring-primary/40',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
  ],
})

import { createCompoundContext } from '../../../../core/context'

/* ==========================================================================
   ChoiceBox Context
   ========================================================================== */

export interface ChoiceBoxContextValue {
  columns?: number | string
  isReadOnly?: boolean
}

export const {
  Provider: ChoiceBoxProvider,
  useCompoundContext: useChoiceBoxContext,
  Context: ChoiceBoxContext,
} = createCompoundContext<ChoiceBoxContextValue>('ChoiceBox')

/* ==========================================================================
   ChoiceBox Slots & Props
   ========================================================================== */

export interface ChoiceBoxSlots {}

export interface ChoiceBoxProps<T extends object = object>
  extends RACGridListProps<T> {
  /** Responsive column count: 1, 2, 3, 4, 5, 6. */
  columns?: 1 | 2 | 3 | 4 | 5 | 6 | '1' | '2' | '3' | '4' | '5' | '6'
  /** Gap size between choice cards: 0, 1, 2, 3, 4, 5, 6. */
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | '0' | '1' | '2' | '3' | '4' | '5' | '6'
  /** Selection behavior: 'single', 'multiple', or 'none'. */
  selectionMode?: 'single' | 'multiple' | 'none'
  /** Whether the choice box is read-only. */
  isReadOnly?: boolean
  /** Custom CSS classes for the grid container. */
  className?: string
  /** Child cards or collection items. */
  children?: React.ReactNode
  /** Injected slot component overrides. */
  slots?: SlotComponents<ChoiceBoxSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ChoiceBoxSlots>
}

const ChoiceBoxPrimitive = <T extends object = object>({
  columns = 1,
  gap = 3,
  selectionMode = 'single',
  isReadOnly = false,
  className,
  slots,
  slotProps,
  children,
  ...props
}: ChoiceBoxProps<T>) => {
  const colNum = (Number(columns) || 1) as 1 | 2 | 3 | 4 | 5 | 6
  const gapNum = (Number(gap) || 0) as 0 | 1 | 2 | 3 | 4 | 5 | 6

  return (
    <ChoiceBoxProvider value={{ columns: colNum, isReadOnly }}>
      <RACGridList
        data-slot="choice-box"
        layout={colNum === 1 ? 'stack' : 'grid'}
        selectionMode={selectionMode}
        className={cn(choiceBoxStyles({ columns: colNum, gap: gapNum }), className)}
        {...props}
      >
        {children}
      </RACGridList>
    </ChoiceBoxProvider>
  )
}

export const ChoiceBox = createInterfaceComponent<ChoiceBoxProps<any>, ChoiceBoxSlots>(
  {
    name: 'ChoiceBox',
    category: 'form',
    description: 'Selectable card grid container organizing multi-attribute radio or checkbox choice cards.',
    version: '1.0.0',
    props: {
      columns: 1,
      gap: 3,
      selectionMode: 'single',
    },
    slots: {

    },
  },
  ChoiceBoxPrimitive
)

/* ==========================================================================
   ChoiceBoxItem Subcomponent
   ========================================================================== */

export interface ChoiceBoxItemSlots {
  /** Leading icon slot */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Leading avatar slot */
  avatar?: React.ComponentType<AvatarProps>
}

export interface ChoiceBoxItemProps
  extends RACGridListItemProps,
    VariantProps<typeof choiceBoxItemStyles> {
  /** Main title heading text. */
  title?: string
  /** Alias for title heading text. */
  label?: string
  /** Supporting subtitle or description text. */
  description?: string
  /** Optional icon element displayed on the leading edge. */
  icon?: React.ReactNode
  /** Optional avatar element displayed on the leading edge. */
  avatar?: React.ReactNode
  /** Custom CSS classes for the card container. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<ChoiceBoxItemSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ChoiceBoxItemSlots>
}

const ChoiceBoxItemPrimitive = ({
  className,
  title,
  label,
  description,
  icon,
  avatar,
  slots = {},
  slotProps = {},
  children,
  ...props
}: ChoiceBoxItemProps) => {
  const { isReadOnly } = useChoiceBoxContext()
  const headingText = title || label

  return (
    <RACGridListItem
      data-slot="choice-box-item"
      data-readonly={isReadOnly}
      className={composeRenderProps(className, (cls, renderProps) =>
        cn(choiceBoxItemStyles(), cls)
      )}
      {...props}
    >
      {composeRenderProps(children, (childContent, { isSelected, selectionMode }) => (
        <>
          {/* Avatar or Icon Slot */}
          {avatar ? (
            <div data-slot="avatar" className="shrink-0 mt-space-2xs">{avatar}</div>
          ) : renderSlot(slots.avatar, slotProps?.avatar) ? (
            <div data-slot="avatar" className="shrink-0 mt-space-2xs">{renderSlot(slots.avatar, slotProps?.avatar)}</div>
          ) : icon ? (
            <div data-slot="icon" className="shrink-0 mt-space-2xs text-muted-fg group-data-[selected]/choice:text-primary transition-colors">{icon}</div>
          ) : renderSlot(slots.icon, slotProps?.icon) ? (
            <div data-slot="icon" className="shrink-0 mt-space-2xs text-muted-fg group-data-[selected]/choice:text-primary transition-colors">{renderSlot(slots.icon, slotProps?.icon)}</div>
          ) : null}

          {/* Text Content */}
          <div className="flex-1 min-w-0 flex flex-col gap-space-2xs">
            {childContent ? (
              typeof childContent === 'string' ? (
                <ChoiceBoxLabel>{childContent}</ChoiceBoxLabel>
              ) : (
                childContent
              )
            ) : (
              <>
                {headingText && <ChoiceBoxLabel>{headingText}</ChoiceBoxLabel>}
                {description && <ChoiceBoxDescription>{description}</ChoiceBoxDescription>}
              </>
            )}
          </div>

          {/* Selection indicator checkbox or radio */}
          {selectionMode === 'multiple' && (
            <CheckboxField slot="selection" className="shrink-0 self-start mt-space-2xs pointer-events-none">
              <Checkbox isSelected={isSelected} />
            </CheckboxField>
          )}
          {selectionMode === 'single' && (
            <div
              data-slot="radio-indicator"
              className={cn(
                'size-4 rounded-full border border-border/60 shrink-0 self-start mt-space-xs flex items-center justify-center transition-colors',
                isSelected && 'border-primary bg-primary text-primary-fg'
              )}
            >
              {isSelected && <span className="size-1.5 rounded-full bg-primary-fg" />}
            </div>
          )}
        </>
      ))}
    </RACGridListItem>
  )
}

export const ChoiceBoxItem = createInterfaceComponent<ChoiceBoxItemProps, ChoiceBoxItemSlots>(
  {
    name: 'ChoiceBoxItem',
    category: 'form',
    description: 'Selectable card item within ChoiceBox with title, description, and indicator slots.',
    version: '1.0.0',
    slots: {
      icon: undefined,
      avatar: undefined,
    },
  },
  ChoiceBoxItemPrimitive
)

/* ==========================================================================
   ChoiceBox Label & Description
   ========================================================================== */

export interface ChoiceBoxLabelSlots {}

export interface ChoiceBoxLabelProps extends RACTextProps {
  /** Optional DOM ref. */
  ref?: React.Ref<HTMLDivElement>
  /** Custom CSS classes. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<ChoiceBoxLabelSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ChoiceBoxLabelSlots>
}

const ChoiceBoxLabelPrimitive = ({ className, ref, slots, slotProps, ...props }: ChoiceBoxLabelProps) => {
  return (
    <RACText
      data-slot="label"
      ref={ref as any}
      className={cn('text-xs sm:text-sm font-semibold text-fg tracking-tight select-none', className)}
      {...props}
    />
  )
}

export const ChoiceBoxLabel = createInterfaceComponent<ChoiceBoxLabelProps, ChoiceBoxLabelSlots>(
  {
    name: 'ChoiceBoxLabel',
    category: 'form',
    description: 'Title heading text within a ChoiceBoxItem.',
    version: '1.0.0',
    slots: {

    },
  },
  ChoiceBoxLabelPrimitive
)

export interface ChoiceBoxDescriptionSlots {}

export interface ChoiceBoxDescriptionProps extends RACTextProps {
  /** Optional DOM ref. */
  ref?: React.Ref<HTMLDivElement>
  /** Custom CSS classes. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<ChoiceBoxDescriptionSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ChoiceBoxDescriptionSlots>
}

const ChoiceBoxDescriptionPrimitive = ({ className, ref, slots, slotProps, ...props }: ChoiceBoxDescriptionProps) => {
  return (
    <RACText
      slot="description"
      data-slot="description"
      ref={ref as any}
      className={cn('text-xs text-muted-fg leading-relaxed select-none', className)}
      {...props}
    />
  )
}

export const ChoiceBoxDescription = createInterfaceComponent<ChoiceBoxDescriptionProps, ChoiceBoxDescriptionSlots>(
  {
    name: 'ChoiceBoxDescription',
    category: 'form',
    description: 'Supporting description text within a ChoiceBoxItem.',
    version: '1.0.0',
    slots: {

    },
  },
  ChoiceBoxDescriptionPrimitive
)

// Namespace attachments for compound family ergonomics
export const RadioCards = ChoiceBox
export const RadioCard = ChoiceBoxItem
ChoiceBox.Provider = ChoiceBoxProvider
ChoiceBox.Item = ChoiceBoxItem
ChoiceBox.Label = ChoiceBoxLabel
ChoiceBox.Description = ChoiceBoxDescription
