import React, { type ReactNode } from 'react'
import { Button as RACButton } from 'react-aria-components/Button'
import type {
  GridListItemProps as RACGridListItemProps,
  GridListProps as RACGridListProps,
} from 'react-aria-components/GridList'
import {
  GridList as GridListPrimitive,
  GridListHeader as GridListHeaderPrimitive,
  GridListItem as GridListItemPrimitive,
  GridListSection as GridListSectionPrimitive,
} from 'react-aria-components/GridList'
import { Text, type TextProps } from 'react-aria-components/Text'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Checkbox, CheckboxField } from '../checkbox'

/* ==========================================================================
   GridList Root
   ========================================================================== */

export interface GridListSlots {
  /** Empty state placeholder slot. */
  emptyState?: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
}

export interface GridListProps<T extends object = object>
  extends Omit<RACGridListProps<T>, 'className' | 'slots' | 'slotProps' | 'children'> {
  /** Custom CSS classes. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<GridListSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<GridListSlots>
  /** GridList items or render function. */
  children?: React.ReactNode | ((values: any) => React.ReactNode)
}

const GridListPrimitiveWrapper = <T extends object>({
  className,
  slots = {},
  slotProps = {},
  renderEmptyState,
  ...props
}: GridListProps<T>) => (
  <GridListPrimitive
    data-slot="grid-list"
    renderEmptyState={
      renderEmptyState ||
      (slots.emptyState
        ? () => renderSlot(slots.emptyState, slotProps?.emptyState)
        : undefined)
    }
    className={cn(
      'relative divide-y overflow-hidden rounded-base border border-border bg-bg *:drop-target:border-accent sm:text-sm/6 dark:bg-muted/40',
      className
    )}
    {...(props as any)}
  />
)

export const GridList = createInterfaceComponent<GridListProps<any>, GridListSlots>(
  {
    name: 'GridList',
    category: 'data',
    description: 'Accessible interactive list of items with keyboard navigation, selection, and reorder dragging.',
    version: '1.0.0',
    slots: {
      emptyState: undefined,
    },
  },
  GridListPrimitiveWrapper as any
)

/* ==========================================================================
   GridList Section
   ========================================================================== */

export interface GridListSectionProps<T extends object = object>
  extends React.ComponentProps<typeof GridListSectionPrimitive<T>> {}

const GridListSectionPrimitiveWrapper = <T extends object>({
  className,
  ...props
}: GridListSectionProps<T>) => {
  return (
    <GridListSectionPrimitive
      data-slot="grid-list-section"
      className={cn('divide-y divide-border/60', className)}
      {...props}
    />
  )
}

export const GridListSection = createInterfaceComponent<GridListSectionProps<any>>(
  {
    name: 'GridListSection',
    category: 'data',
    description: 'Organized grouping section inside a GridList container.',
    version: '1.0.0',
  },
  GridListSectionPrimitiveWrapper as any
)

/* ==========================================================================
   GridList Header
   ========================================================================== */

export interface GridListHeaderProps
  extends React.ComponentProps<typeof GridListHeaderPrimitive> {}

const GridListHeaderPrimitiveWrapper = ({
  className,
  ...props
}: GridListHeaderProps) => {
  return (
    <GridListHeaderPrimitive
      data-slot="grid-list-header"
      className={cn('px-3 py-2.5 font-semibold text-sm/6 text-fg bg-muted/20', className)}
      {...props}
    />
  )
}

export const GridListHeader = createInterfaceComponent<GridListHeaderProps>(
  {
    name: 'GridListHeader',
    category: 'data',
    description: 'Header title element for GridList sections.',
    version: '1.0.0',
  },
  GridListHeaderPrimitiveWrapper
)

/* ==========================================================================
   GridList Item
   ========================================================================== */

export interface GridListItemSlots {
  /** Drag handle button slot. */
  dragButton?: React.ComponentType<Record<string, unknown>>
  /** Drag icon slot. */
  dragIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Selection checkbox component slot. */
  selectionCheckbox?: React.ComponentType<Record<string, unknown>>
}

export interface GridListItemProps
  extends Omit<RACGridListItemProps, 'slots' | 'slotProps'> {
  /** Injected slot component overrides. */
  slots?: SlotComponents<GridListItemSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<GridListItemSlots>
}

const DefaultDragIcon = () => (
  <svg
    data-slot="drag-icon"
    className="size-5 text-muted-fg sm:size-4"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
  >
    <path
      d="M11 5.5C11 6.32843 10.3284 7 9.5 7C8.67157 7 8 6.32843 8 5.5C8 4.67157 8.67157 4 9.5 4C10.3284 4 11 4.67157 11 5.5Z"
      fill="currentColor"
    />
    <path
      d="M16 5.5C16 6.32843 15.3284 7 14.5 7C13.6716 7 13 6.32843 13 5.5C13 4.67157 13.6716 4 14.5 4C15.3284 4 16 4.67157 16 5.5Z"
      fill="currentColor"
    />
    <path
      d="M11 18.5C11 19.3284 10.3284 20 9.5 20C8.67157 20 8 19.3284 8 18.5C8 17.6716 8.67157 17 9.5 17C10.3284 17 11 17.6716 11 18.5Z"
      fill="currentColor"
    />
    <path
      d="M16 18.5C16 19.3284 15.3284 20 14.5 20C13.6716 20 13 19.3284 13 18.5C13 17.6716 13.6716 17 14.5 17C15.3284 17 16 17.6716 16 18.5Z"
      fill="currentColor"
    />
    <path
      d="M11 12C11 12.8284 10.3284 13.5 9.5 13.5C8.67157 13.5 8 12.8284 8 12C8 11.1716 8.67157 10.5 9.5 10.5C10.3284 10.5 11 11.1716 11 12Z"
      fill="currentColor"
    />
    <path
      d="M16 12C16 12.8284 15.3284 13.5 14.5 13.5C13.6716 13.5 13 12.8284 13 12C13 11.1716 13.6716 10.5 14.5 10.5C15.3284 10.5 16 11.1716 16 12Z"
      fill="currentColor"
    />
  </svg>
)

const GridListItemPrimitiveWrapper = ({
  className,
  children,
  slots = {},
  slotProps = {},
  ...props
}: GridListItemProps) => {
  const textValue = typeof children === 'string' ? children : undefined
  return (
    <GridListItemPrimitive
      textValue={textValue}
      data-slot="grid-list-item"
      {...props}
      className={cn(
        'group relative min-w-0 px-3 py-2.5 outline-hidden [--me-icon:--spacing(2)]',
        'flex min-w-0 cursor-pointer items-center gap-2 sm:gap-2.5',
        'dragging:cursor-grab dragging:opacity-70 dragging:**:[[slot=drag]]:text-fg',
        "hover:bg-accent/50 **:[svg:not([data-slot='check-indicator'])]:size-5 **:[svg:not([data-slot='check-indicator'])]:shrink-0 **:[svg:not([data-slot='check-indicator'])]:text-muted-fg sm:**:[svg:not([data-slot='check-indicator'])]:size-4",
        'selected:bg-accent/40 selected:text-fg selected:hover:bg-accent/80 selected:**:[.text-muted-fg]:text-accent-fg/80',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      {(values) => (
        <>
          {values.allowsDragging && (
            slots.dragButton ? (
              renderSlot(slots.dragButton, slotProps?.dragButton)
            ) : (
              <RACButton slot="drag" className="touch-none cursor-grab">
                {slots.dragIcon ? renderSlot(slots.dragIcon, slotProps?.dragIcon) : <DefaultDragIcon />}
              </RACButton>
            )
          )}

          {values.selectionMode === 'multiple' && values.selectionBehavior === 'toggle' && (
            <CheckboxField className="gap-x-0" slot="selection">
              {slots.selectionCheckbox ? (
                renderSlot(slots.selectionCheckbox, slotProps?.selectionCheckbox)
              ) : (
                <Checkbox className="col-span-1" />
              )}
            </CheckboxField>
          )}
          {typeof children === 'function' ? children(values) : children}
        </>
      )}
    </GridListItemPrimitive>
  )
}

export const GridListItem = createInterfaceComponent<GridListItemProps, GridListItemSlots>(
  {
    name: 'GridListItem',
    category: 'data',
    description: 'Interactive item row inside GridList with drag handles and selection checkbox support.',
    version: '1.0.0',
    slots: {
      dragButton: undefined,
      dragIcon: undefined,
      selectionCheckbox: undefined,
    },
  },
  GridListItemPrimitiveWrapper
)

/* ==========================================================================
   GridList Sub-Elements
   ========================================================================== */

export interface GridListEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}

const GridListEmptyStatePrimitive = ({ ref, className, ...props }: GridListEmptyStateProps) => (
  <div ref={ref} data-slot="grid-list-empty-state" className={cn('p-6 text-center text-sm text-muted-fg', className)} {...props} />
)

export const GridListEmptyState = createInterfaceComponent<GridListEmptyStateProps>(
  {
    name: 'GridListEmptyState',
    category: 'data',
    description: 'Empty state placeholder when GridList contains zero items.',
    version: '1.0.0',
  },
  GridListEmptyStatePrimitive
)

export interface GridListSpacerProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}

const GridListSpacerPrimitive = ({ className, ref, ...props }: GridListSpacerProps) => {
  return <div ref={ref} data-slot="grid-list-spacer" aria-hidden className={cn('-ms-4 flex-1', className)} {...props} />
}

export const GridListSpacer = createInterfaceComponent<GridListSpacerProps>(
  {
    name: 'GridListSpacer',
    category: 'data',
    description: 'Flexible spacer separating start and end content inside GridListItem.',
    version: '1.0.0',
  },
  GridListSpacerPrimitive
)

export interface GridListStartProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}

const GridListStartPrimitive = ({ className, ref, ...props }: GridListStartProps) => {
  return (
    <div
      ref={ref}
      data-slot="grid-list-start"
      className={cn('relative flex items-center gap-x-2.5 sm:gap-x-3', className)}
      {...props}
    />
  )
}

export const GridListStart = createInterfaceComponent<GridListStartProps>(
  {
    name: 'GridListStart',
    category: 'data',
    description: 'Leading content cluster container inside GridListItem.',
    version: '1.0.0',
  },
  GridListStartPrimitive
)

export interface GridListTextProps extends TextProps {
  ref?: React.Ref<HTMLDivElement>
}

const GridListLabelPrimitive = ({ className, ref, ...props }: GridListTextProps) => (
  <Text ref={ref} data-slot="grid-list-label" className={cn('font-medium text-fg', className)} {...props} />
)

export const GridListLabel = createInterfaceComponent<GridListTextProps>(
  {
    name: 'GridListLabel',
    category: 'data',
    description: 'Primary label text inside GridListItem.',
    version: '1.0.0',
  },
  GridListLabelPrimitive
)

const GridListDescriptionPrimitive = ({ className, ref, ...props }: GridListTextProps) => (
  <Text
    slot="description"
    ref={ref}
    data-slot="grid-list-description"
    className={cn('font-normal text-muted-fg text-sm', className)}
    {...props}
  />
)

export const GridListDescription = createInterfaceComponent<GridListTextProps>(
  {
    name: 'GridListDescription',
    category: 'data',
    description: 'Supporting description text inside GridListItem.',
    version: '1.0.0',
  },
  GridListDescriptionPrimitive
)

/* ==========================================================================
   Compound Family Namespace Attachments
   ========================================================================== */

GridList.Section = GridListSection
GridList.Header = GridListHeader
GridList.Item = GridListItem
GridList.EmptyState = GridListEmptyState
GridList.Spacer = GridListSpacer
GridList.Start = GridListStart
GridList.Label = GridListLabel
GridList.Description = GridListDescription

export const { Context: GridListContext, useCompoundContext: useGridListContext } =
  createCompoundContext<any>('GridList')
