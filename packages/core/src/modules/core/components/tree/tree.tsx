import React, { type ReactNode } from 'react'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { Button as RACButton } from 'react-aria-components/Button'
import type {
  TreeItemContentProps as RACTreeItemContentProps,
  TreeItemContentRenderProps,
  TreeItemProps as RACTreeItemProps,
  TreeProps as RACTreeProps,
} from 'react-aria-components/Tree'
import {
  Tree as TreePrimitive,
  TreeItem as TreeItemPrimitive,
  TreeItemContent,
} from 'react-aria-components/Tree'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Checkbox, CheckboxField } from '../checkbox'

/* ==========================================================================
   Tree Root
   ========================================================================== */

export interface TreeSlots {}

export interface TreeProps<T extends object = object>
  extends Omit<RACTreeProps<T>, 'className' | 'slots' | 'slotProps' | 'children'> {
  /** Custom CSS classes. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<TreeSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<TreeSlots>
  /** Tree children or item render function. */
  children?: ReactNode | ((item: T) => ReactNode)
}

const TreePrimitiveWrapper = <T extends object>({
  className,
  ...props
}: TreeProps<T>) => {
  return (
    <TreePrimitive
      data-slot="tree"
      className={cn(
        'flex cursor-default flex-col gap-y-2 overflow-auto outline-hidden forced-color-adjust-none',
        '[--tree-active-bg:var(--color-primary-subtle)] [--tree-active-fg:var(--color-primary-subtle-fg)]',
        className
      )}
      {...props}
    />
  )
}

export const Tree = createInterfaceComponent<TreeProps<any>, TreeSlots>(
  {
    name: 'Tree',
    category: 'data',
    description: 'Hierarchical tree view component with expandable branch nodes, branch lines, and multi-selection.',
    version: '1.0.0',
    slots: {

    },
  },
  TreePrimitiveWrapper as any
)

/* ==========================================================================
   Tree Item
   ========================================================================== */

export interface TreeItemSlots {}

export interface TreeItemProps<T extends object = object>
  extends Omit<RACTreeItemProps<T>, 'className' | 'slots' | 'slotProps' | 'children'> {
  /** Custom CSS classes. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<TreeItemSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<TreeItemSlots>
  /** Children or sub-items render function. */
  children?: RACTreeItemProps<T>['children']
}

const TreeItemPrimitiveWrapper = <T extends object>({
  className,
  ...props
}: TreeItemProps<T>) => {
  return (
    <TreeItemPrimitive
      data-slot="tree-item"
      className={cn(
        'shrink-0 rounded-base px-2 py-1.5 pe-2',
        'group/tree-item relative flex select-none focus:outline-hidden',
        'focus:bg-(--tree-active-bg) focus:text-(--tree-active-fg) focus:**:[.text-muted-fg]:text-(--tree-active-fg)',
        '**:data-[slot=avatar]:*:size-6 **:data-[slot=avatar]:size-6 sm:**:data-[slot=avatar]:*:size-5 sm:**:data-[slot=avatar]:size-5',
        '**:[svg]:size-5 **:[svg]:shrink-0 sm:**:[svg]:size-4',
        '**:[svg:not([data-slot=check-indicator]):not([data-slot=chevron])]:me-1',
        'disabled:opacity-50',
        'cursor-pointer',
        className
      )}
      {...(props as any)}
    />
  )
}

export const TreeItem = createInterfaceComponent<TreeItemProps<any>, TreeItemSlots>(
  {
    name: 'TreeItem',
    category: 'data',
    description: 'Individual node entry in a hierarchical Tree structure.',
    version: '1.0.0',
    slots: {

    },
  },
  TreeItemPrimitiveWrapper as any
)

/* ==========================================================================
   Tree Content
   ========================================================================== */

export interface TreeContentSlots {
  /** Drag button slot for reorderable tree nodes. */
  dragButton?: React.ComponentType<Record<string, unknown>>
  /** Selection checkbox slot. */
  selectionCheckbox?: React.ComponentType<Record<string, unknown>>
  /** Expand/collapse branch indicator slot. */
  indicator?: React.ComponentType<TreeIndicatorProps>
}

export interface TreeContentProps extends Omit<RACTreeItemContentProps, 'children'> {
  /** Custom CSS classes. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<TreeContentSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<TreeContentSlots>
  /** Children content or render function. */
  children?: ReactNode | ((values: TreeItemContentRenderProps) => ReactNode)
}

const TreeContentDefaultDragButton = (props: any) => <RACButton className="sr-only" slot="drag" {...props} />
const TreeContentDefaultCheckbox = (props: any) => <Checkbox className="col-span-1" {...props} />
const TreeContentDefaultIndicator = (props: TreeIndicatorProps) => <TreeIndicator {...props} />

const TreeContentPrimitiveWrapper = ({
  className,
  children,
  slots = {},
  slotProps = {},
  ...props
}: TreeContentProps) => {
  return (
    <TreeItemContent {...props}>
      {(values) => (
        <div
          data-slot="tree-content"
          className={cn(
            'relative flex w-full min-w-0 items-center gap-x-1 truncate text-sm/6',
            className
          )}
        >
          {values.allowsDragging &&
            renderSlot(slots.dragButton, slotProps.dragButton, {
              defaultComponent: TreeContentDefaultDragButton,
            })}
          {values.selectionMode === 'multiple' && values.selectionBehavior === 'toggle' && (
            <CheckboxField className="gap-x-0" slot="selection">
              {renderSlot(slots.selectionCheckbox, slotProps.selectionCheckbox, {
                defaultComponent: TreeContentDefaultCheckbox,
              })}
            </CheckboxField>
          )}
          <div
            className={cn(
              'relative w-[calc(calc(var(--tree-item-level)-1)*(--spacing(5)))] shrink-0',
              'before:absolute before:inset-0 before:-ms-1 before:bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(var(--tree-item-level)-1px),var(--border)_calc(var(--tree-item-level)-1px),var(--border)_calc(var(--tree-item-level)))]'
            )}
          />
          {values.hasChildItems ? (
            renderSlot(
              slots.indicator,
              {
                values: {
                  isDisabled: values.isDisabled,
                  isExpanded: values.isExpanded,
                },
                ...slotProps.indicator,
              },
              { defaultComponent: TreeContentDefaultIndicator }
            )
          ) : (
            <span aria-hidden className="block w-5 shrink-0" />
          )}
          {typeof children === 'function' ? children(values) : children}
        </div>
      )}
    </TreeItemContent>
  )
}

export const TreeContent = createInterfaceComponent<TreeContentProps, TreeContentSlots>(
  {
    name: 'TreeContent',
    category: 'data',
    description: 'Internal content layout for TreeItem managing indentation guides, chevrons, and labels.',
    version: '1.0.0',
    slots: {
      dragButton: TreeContentDefaultDragButton,
      selectionCheckbox: TreeContentDefaultCheckbox,
      indicator: TreeContentDefaultIndicator,
    },
  },
  TreeContentPrimitiveWrapper
)

/* ==========================================================================
   Tree Indicator
   ========================================================================== */

export interface TreeIndicatorSlots {
  /** Chevron icon slot. */
  chevron?: React.ComponentType<React.SVGProps<SVGSVGElement> & { isExpanded?: boolean }>
}

export interface TreeIndicatorProps {
  /** Reactive state from the parent tree node. */
  values: Pick<TreeItemContentRenderProps, 'isDisabled' | 'isExpanded'>
  /** Custom CSS classes. */
  className?: string
  /** Injected slot component overrides. */
  slots?: SlotComponents<TreeIndicatorSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<TreeIndicatorSlots>
  /** Children content. */
  children?: ReactNode
}

const TreeIndicatorDefaultChevron = ({ isExpanded, className, ...props }: any) => (
  <ChevronRightIcon
    data-slot="chevron"
    className={cn(
      'size-5 transition-transform duration-200 ease-in-out sm:size-4',
      isExpanded && 'rotate-90',
      className
    )}
    {...props}
  />
)

const TreeIndicatorPrimitiveWrapper = ({
  values,
  className,
  children,
  slots = {},
  slotProps = {},
}: TreeIndicatorProps) => {
  return (
    <RACButton
      slot="chevron"
      data-slot="tree-indicator"
      isDisabled={values.isDisabled}
      className={cn(
        'shrink-0 content-center text-muted-fg hover:text-fg cursor-pointer p-0.5 rounded-atom',
        values.isExpanded && 'text-fg',
        className
      )}
    >
      {children != null
        ? children
        : renderSlot(
            slots.chevron,
            { isExpanded: values.isExpanded, ...slotProps.chevron },
            { defaultComponent: TreeIndicatorDefaultChevron }
          )}
    </RACButton>
  )
}

export const TreeIndicator = createInterfaceComponent<TreeIndicatorProps, TreeIndicatorSlots>(
  {
    name: 'TreeIndicator',
    category: 'data',
    description: 'Expand/collapse chevron button indicator for expandable Tree nodes.',
    version: '1.0.0',
    slots: {
      chevron: TreeIndicatorDefaultChevron,
    },
  },
  TreeIndicatorPrimitiveWrapper
)

/* ==========================================================================
   Compound Family Namespace Attachments
   ========================================================================== */

Tree.Item = TreeItem
Tree.Content = TreeContent
Tree.Indicator = TreeIndicator

export const { Context: TreeContext, useCompoundContext: useTreeContext } =
  createCompoundContext<any>('Tree')
