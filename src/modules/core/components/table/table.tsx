import React, { createContext, useContext, type ReactNode } from 'react'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { Button as RACButton } from 'react-aria-components/Button'
import { composeRenderProps } from 'react-aria-components/composeRenderProps'
import { Group } from 'react-aria-components/Group'
import type {
  CellProps,
  ColumnProps,
  ColumnResizerProps as RACColumnResizerProps,
  RowProps,
  TableBodyProps as RACTableBodyProps,
  TableFooterProps as RACTableFooterProps,
  TableHeaderProps as RACHeaderProps,
  TableProps as TablePrimitiveProps,
} from 'react-aria-components/Table'
import {
  Cell,
  Collection,
  Column,
  ColumnResizer as ColumnResizerPrimitive,
  ResizableTableContainer,
  Row,
  Table as TablePrimitive,
  TableBody as TableBodyPrimitive,
  TableFooter as TableFooterPrimitive,
  TableHeader as TableHeaderPrimitive,
  useTableOptions,
} from 'react-aria-components/Table'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { CardDescription, CardTitle } from '../card'
import { Checkbox, CheckboxField } from '../checkbox'

/* ==========================================================================
   Table Context
   ========================================================================== */

export interface TableContextValue {
  allowResize?: boolean
  bleed?: boolean
  grid?: boolean
  striped?: boolean
}

const TableContext = createContext<TableContextValue>({
  allowResize: false,
})

export const useTableContext = () => useContext(TableContext)

export const TableProvider = TableContext.Provider

/* ==========================================================================
   Table Slots & Props
   ========================================================================== */

export interface TableSlots {
  /** Empty state element slot rendered when no rows exist. */
  emptyState?: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
  /** Interactive column resizer handle slot. */
  resizer?: React.ComponentType<ColumnResizerProps>
}

export interface TableProps
  extends Omit<TablePrimitiveProps, 'className' | 'slots' | 'slotProps' | 'children'> {
  /** Explicit children composition or render function. */
  children?: TablePrimitiveProps['children']
  /** Enable column resizing support across all columns. */
  allowResize?: boolean
  /** Custom CSS classes for the outer wrapper. */
  className?: string
  /** Remove lateral padding so the table bleeds edge-to-edge. */
  bleed?: boolean
  /** Render vertical grid border lines between columns. */
  grid?: boolean
  /** Alternate row background colors with zebra striping. */
  striped?: boolean
  /** Forwarded ref for the underlying HTML table element. */
  ref?: React.Ref<HTMLTableElement>
  /** Injected slot component overrides. */
  slots?: SlotComponents<TableSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<TableSlots>
}

const TablePrimitiveRoot = (props: TableProps) => {
  return (
    <TablePrimitive
      className="w-full min-w-full caption-bottom text-sm/6 outline-hidden [--table-selected-bg:var(--color-secondary)]/50"
      {...props}
    />
  )
}

const TablePrimitiveWrapper = ({
  allowResize = false,
  className,
  bleed = false,
  grid = false,
  striped = false,
  ref,
  slots = {},
  slotProps = {},
  ...props
}: TableProps) => {
  return (
    <TableContext.Provider value={{ allowResize, bleed, grid, striped }}>
      <div className="flow-root" data-slot="table-root">
        <div
          className={cn(
            'relative -mx-(--gutter) overflow-x-auto whitespace-nowrap [--gutter-y:--spacing(3)] has-data-[slot=table-resizable-container]:overflow-auto',
            className
          )}
        >
          <div
            className={cn('inline-block min-w-full align-middle', !bleed && 'sm:px-(--gutter)')}
          >
            {allowResize ? (
              <ResizableTableContainer data-slot="table-resizable-container">
                <TablePrimitiveRoot ref={ref} {...props} />
              </ResizableTableContainer>
            ) : (
              <TablePrimitiveRoot {...props} ref={ref} />
            )}
          </div>
        </div>
      </div>
    </TableContext.Provider>
  )
}

export const Table = createInterfaceComponent<TableProps, TableSlots>(
  {
    name: 'Table',
    category: 'data',
    description: 'Accessible data table root with column resizing, zebra striping, grid lines, and edge-to-edge bleeding.',
    version: '1.0.0',
    props: {
      allowResize: false,
      bleed: false,
      grid: false,
      striped: false,
    },
    slots: {
      emptyState: undefined,
      resizer: undefined,
    },
  },
  TablePrimitiveWrapper
)

/* ==========================================================================
   Column Resizer
   ========================================================================== */

export interface ColumnResizerSlots {
  /** Vertical divider line indicator slot. */
  divider?: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
}

export interface ColumnResizerProps
  extends Omit<RACColumnResizerProps, 'slots' | 'slotProps'> {
  /** Injected slot component overrides. */
  slots?: SlotComponents<ColumnResizerSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<ColumnResizerSlots>
}

const ColumnResizerPrimitiveWrapper = ({
  className,
  slots = {},
  slotProps = {},
  ...props
}: ColumnResizerProps) => {
  const defaultDivider = (
    <div
      data-slot="resizer-divider"
      className={cn('h-full w-px bg-border py-(--gutter-y)', slotProps.divider?.className)}
      {...slotProps.divider}
    />
  )

  return (
    <ColumnResizerPrimitive
      data-slot="column-resizer"
      {...props}
      className={cn(
        'absolute end-0 top-0 bottom-0 grid w-px &[data-resizable-direction=left]:cursor-e-resize &[data-resizable-direction=right]:cursor-w-resize resizable-both:cursor-ew-resize touch-none place-content-center px-1 [&[data-resizing]>div]:bg-primary',
        className
      )}
    >
      {slots.divider ? renderSlot(slots.divider, slotProps.divider) : defaultDivider}
    </ColumnResizerPrimitive>
  )
}

export const ColumnResizer = createInterfaceComponent<ColumnResizerProps, ColumnResizerSlots>(
  {
    name: 'ColumnResizer',
    category: 'data',
    description: 'Draggable column resizer handle for interactive width adjustments.',
    version: '1.0.0',
    slots: {
      divider: undefined,
    },
  },
  ColumnResizerPrimitiveWrapper
)

/* ==========================================================================
   Table Body
   ========================================================================== */

export interface TableBodySlots {
  /** Custom empty state renderer slot. */
  emptyState?: React.ComponentType<{ state?: any }>
}

export interface TableBodyProps<T extends object = object>
  extends Omit<RACTableBodyProps<T>, 'slots' | 'slotProps'> {
  /** Injected slot component overrides. */
  slots?: SlotComponents<TableBodySlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<TableBodySlots>
}

const DefaultEmptyStateIllustration = () => (
  <div aria-hidden className="relative flex h-72 items-center justify-center md:h-100">
    <div
      aria-hidden
      className="absolute top-1/2 m-auto grid size-15 -translate-y-1/2 place-content-center rounded-full border border-border/50 md:size-20"
    >
      <svg
        aria-hidden
        xmlns="http://www.w3.org/2000/svg"
        className="size-8"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4.69098 5.27849C5.13311 4.48897 5.96736 4 6.87225 4H17.1278C18.0326 4 18.8669 4.48898 19.309 5.27849L22.6813 11.3004C22.8903 11.6736 23 12.0941 23 12.5219V17.5C23 18.8807 21.8807 20 20.5 20H3.5C2.11929 20 1 18.8807 1 17.5V12.5219C1 12.0941 1.10974 11.6736 1.31874 11.3004L4.69098 5.27849ZM22 13H16.5C16.0279 13 15.5833 13.2223 15.3 13.6L15 14C14.5279 14.6295 13.7869 15 13 15H11C10.2131 15 9.47214 14.6295 9 14L8.7 13.6C8.41672 13.2223 7.97214 13 7.5 13H2V17.5C2 18.3284 2.67157 19 3.5 19H20.5C21.3284 19 22 18.3284 22 17.5V13Z"
          fill="currentColor"
        />
      </svg>
    </div>
    <i
      className="absolute top-1/2 m-auto size-30 -translate-y-1/2 rounded-full border border-border/40 md:size-40"
      aria-hidden
    />
    <i
      className="absolute top-1/2 m-auto size-45 -translate-y-1/2 rounded-full border border-border/30 md:size-60"
      aria-hidden
    />
    <i
      className="absolute top-1/2 m-auto size-60 -translate-y-1/2 rounded-full border border-border/20 md:size-80"
      aria-hidden
    />
    <i
      className="absolute top-1/2 m-auto size-80 -translate-y-1/2 rounded-full border border-border/10 md:size-100"
      aria-hidden
    />

    <div className="absolute top-[65%] space-y-0.5 px-2 text-center">
      <CardTitle className="font-semibold text-lg">No data found</CardTitle>
      <CardDescription>
        No information is currently available in this section.
      </CardDescription>
    </div>
  </div>
)

const TableBodyPrimitiveWrapper = <T extends object>({
  renderEmptyState,
  slots = {},
  slotProps = {},
  ...props
}: TableBodyProps<T>) => {
  return (
    <TableBodyPrimitive
      data-slot="table-body"
      renderEmptyState={(state) => {
        if (slots.emptyState) {
          return renderSlot(slots.emptyState, { state, ...slotProps.emptyState })
        }
        if (renderEmptyState) {
          return renderEmptyState(state)
        }
        return <DefaultEmptyStateIllustration />
      }}
      {...props}
    />
  )
}

export const TableBody = createInterfaceComponent<TableBodyProps<any>, TableBodySlots>(
  {
    name: 'TableBody',
    category: 'data',
    description: 'Container for table row records with default empty state visualization.',
    version: '1.0.0',
    slots: {
      emptyState: undefined,
    },
  },
  TableBodyPrimitiveWrapper as any
)

/* ==========================================================================
   Table Column
   ========================================================================== */

export interface TableColumnSlots {
  /** Sort direction indicator icon slot. */
  sortIcon?: React.ComponentType<React.SVGProps<SVGSVGElement> & { sortDirection?: 'ascending' | 'descending' }>
  /** Column resizer handle slot. */
  resizer?: React.ComponentType<ColumnResizerProps>
}

export interface TableColumnProps extends ColumnProps {
  /** Whether this specific column can be resized interactively. */
  isResizable?: boolean
  /** Injected slot component overrides. */
  slots?: SlotComponents<TableColumnSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<TableColumnSlots>
}

const TableColumnPrimitiveWrapper = ({
  isResizable = false,
  className,
  children,
  slots = {},
  slotProps = {},
  ...props
}: TableColumnProps) => {
  const { bleed, grid } = useTableContext()
  return (
    <Column
      data-slot="table-column"
      {...props}
      className={cn(
        'text-start font-medium text-muted-fg',
        'relative allows-sorting:cursor-pointer dragging:cursor-grabbing outline-hidden',
        'px-4 py-(--gutter-y)',
        'first:ps-(--gutter,--spacing(4)) last:pe-(--gutter,--spacing(4))',
        !bleed && 'sm:last:pe-1 sm:first:ps-1',
        grid && 'border-l first:border-l-0',
        isResizable && 'overflow-hidden truncate',
        className
      )}
    >
      {(values) => (
        <Group
          role="presentation"
          tabIndex={-1}
          className="inline-flex items-center gap-2 **:[svg]:shrink-0"
        >
          {typeof children === 'function' ? children(values) : children}
          {values.allowsSorting && (
            <span
              className={cn(
                'touch-target grid size-[1.15rem] flex-none shrink-0 place-content-center rounded bg-secondary text-fg *:[svg]:size-3.5 *:[svg]:shrink-0 *:[svg]:transition-transform *:[svg]:duration-200',
                values.isHovered ? 'bg-secondary-fg/10' : ''
              )}
            >
              {slots.sortIcon ? (
                renderSlot(slots.sortIcon, {
                  sortDirection: values.sortDirection,
                  ...slotProps.sortIcon,
                })
              ) : (
                <ChevronDownIcon
                  className={cn('size-3.5 transition-transform duration-200', values.sortDirection === 'ascending' && 'rotate-180')}
                />
              )}
            </span>
          )}
          {isResizable &&
            (slots.resizer ? (
              renderSlot(slots.resizer, slotProps.resizer)
            ) : (
              <ColumnResizer />
            ))}
        </Group>
      )}
    </Column>
  )
}

export const TableColumn = createInterfaceComponent<TableColumnProps, TableColumnSlots>(
  {
    name: 'TableColumn',
    category: 'data',
    description: 'Table column header cell with sorting affordance, dragging state, and resize handles.',
    version: '1.0.0',
    props: {
      isResizable: false,
    },
    slots: {
      sortIcon: undefined,
      resizer: undefined,
    },
  },
  TableColumnPrimitiveWrapper
)

/* ==========================================================================
   Table Header
   ========================================================================== */

export interface TableHeaderSlots {
  /** Checkbox selection component for batch selection. */
  selectionCheckbox?: React.ComponentType<Record<string, unknown>>
}

export interface TableHeaderProps<T extends object = object> extends RACHeaderProps<T> {
  /** Forwarded ref for the table header element. */
  ref?: React.Ref<HTMLTableSectionElement>
  /** Injected slot component overrides. */
  slots?: SlotComponents<TableHeaderSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<TableHeaderSlots>
}

const TableHeaderPrimitiveWrapper = <T extends object>({
  children,
  ref,
  columns,
  className,
  slots = {},
  slotProps = {},
  ...props
}: TableHeaderProps<T>) => {
  const { bleed } = useTableContext()
  const { selectionBehavior, selectionMode, allowsDragging } = useTableOptions()
  return (
    <TableHeaderPrimitive
      data-slot="table-header"
      className={cn('border-b', className)}
      ref={ref}
      {...props}
    >
      {allowsDragging && (
        <Column
          data-slot="table-column"
          className={cn('first:ps-(--gutter,--spacing(2))', !bleed && 'sm:last:pe-1 sm:first:ps-1')}
        />
      )}
      {selectionBehavior === 'toggle' && (
        <Column
          width={52}
          minWidth={52}
          style={{ width: 52 }}
          data-slot="table-column"
          className={cn(
            'w-13 min-w-13 p-0 text-center first:ps-0',
            !bleed && 'sm:last:pe-0 sm:first:ps-0'
          )}
        >
          {selectionMode === 'multiple' && (
            <CheckboxField slot="selection">
              {slots.selectionCheckbox ? (
                renderSlot(slots.selectionCheckbox, slotProps.selectionCheckbox)
              ) : (
                <Checkbox />
              )}
            </CheckboxField>
          )}
        </Column>
      )}
      <Collection items={columns}>{children}</Collection>
    </TableHeaderPrimitive>
  )
}

export const TableHeader = createInterfaceComponent<TableHeaderProps<any>, TableHeaderSlots>(
  {
    name: 'TableHeader',
    category: 'data',
    description: 'Header group container rendering column definitions and selection controls.',
    version: '1.0.0',
    slots: {
      selectionCheckbox: undefined,
    },
  },
  TableHeaderPrimitiveWrapper as any
)

/* ==========================================================================
   Table Row
   ========================================================================== */

export interface TableRowSlots {
  /** Drag handle trigger button slot. */
  dragButton?: React.ComponentType<Record<string, unknown>>
  /** Row selection checkbox slot. */
  selectionCheckbox?: React.ComponentType<Record<string, unknown>>
}

export interface TableRowProps<T extends object = object> extends RowProps<T> {
  /** Forwarded ref for the table row element. */
  ref?: React.Ref<HTMLTableRowElement>
  /** Injected slot component overrides. */
  slots?: SlotComponents<TableRowSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<TableRowSlots>
}

const TableRowPrimitiveWrapper = <T extends object>({
  children,
  className,
  columns,
  id,
  ref,
  slots = {},
  slotProps = {},
  ...props
}: TableRowProps<T>) => {
  const { selectionBehavior, allowsDragging } = useTableOptions()
  const { striped } = useTableContext()
  return (
    <Row
      ref={ref}
      data-slot="table-row"
      id={id}
      {...props}
      className={composeRenderProps(
        className,
        (
          resolvedClass,
          {
            isSelected,
            selectionMode,
            isFocusVisibleWithin,
            isDragging,
            isDisabled,
            isFocusVisible,
          }
        ) =>
          cn(
            'group relative outline outline-transparent',
            isFocusVisible &&
              'bg-primary/5 outline-primary ring-3 ring-ring/20 hover:bg-primary/10',
            isDragging && 'cursor-grabbing bg-primary/10 text-fg outline-primary',
            isSelected && 'bg-(--table-selected-bg) text-fg hover:bg-(--table-selected-bg)/50',
            striped && 'even:bg-muted',
            (props.href || props.onAction || selectionMode === 'multiple') &&
              'cursor-pointer hover:bg-(--table-selected-bg) hover:text-fg',
            (props.href || props.onAction || selectionMode === 'multiple') &&
              isFocusVisibleWithin &&
              'bg-(--table-selected-bg)/50 selected:bg-(--table-selected-bg)/50 text-fg',
            isDisabled && 'opacity-50',
            resolvedClass
          )
      )}
    >
      {allowsDragging && (
        <TableCell className="px-0">
          {slots.dragButton ? (
            renderSlot(slots.dragButton, slotProps.dragButton)
          ) : (
            <RACButton
              slot="drag"
              className="grid place-content-center rounded-atom px-[calc(var(--gutter)/2)] outline-hidden focus-visible:ring focus-visible:ring-ring"
            >
              <svg
                aria-hidden
                xmlns="http://www.w3.org/2000/svg"
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx={9} cy={12} r={1} />
                <circle cx={9} cy={5} r={1} />
                <circle cx={9} cy={19} r={1} />
                <circle cx={15} cy={12} r={1} />
                <circle cx={15} cy={5} r={1} />
                <circle cx={15} cy={19} r={1} />
              </svg>
            </RACButton>
          )}
        </TableCell>
      )}
      {selectionBehavior === 'toggle' && (
        <TableCell className="w-13 min-w-13 p-0 [&>div]:h-full [&>div]:w-full [&>div]:justify-center">
          <CheckboxField slot="selection">
            {slots.selectionCheckbox ? (
              renderSlot(slots.selectionCheckbox, slotProps.selectionCheckbox)
            ) : (
              <Checkbox />
            )}
          </CheckboxField>
        </TableCell>
      )}
      <Collection items={columns}>{children}</Collection>
    </Row>
  )
}

export const TableRow = createInterfaceComponent<TableRowProps<any>, TableRowSlots>(
  {
    name: 'TableRow',
    category: 'data',
    description: 'Interactive data row container with selection highlight, dragging, and focus states.',
    version: '1.0.0',
    slots: {
      dragButton: undefined,
      selectionCheckbox: undefined,
    },
  },
  TableRowPrimitiveWrapper as any
)

/* ==========================================================================
   Table Cell
   ========================================================================== */

export interface TableCellSlots {
  /** Expand/collapse tree chevron button slot. */
  chevronButton?: React.ComponentType<Record<string, unknown>>
}

export interface TableCellProps extends CellProps {
  /** Forwarded ref for the table cell element. */
  ref?: React.Ref<HTMLTableCellElement>
  /** Injected slot component overrides. */
  slots?: SlotComponents<TableCellSlots>
  /** Props passed down into injected slot components. */
  slotProps?: SlotPropsMap<TableCellSlots>
}

const TableCellPrimitiveWrapper = ({
  className,
  ref,
  children,
  slots = {},
  slotProps = {},
  ...props
}: TableCellProps) => {
  const { allowResize, bleed, grid, striped } = useTableContext()
  return (
    <Cell
      ref={ref}
      data-slot="table-cell"
      {...props}
      className={cn(
        'group px-4 py-(--gutter-y) align-middle outline-hidden first:ps-(--gutter,--spacing(4)) last:pe-(--gutter,--spacing(4)) group-has-data-focus-visible-within:text-fg',
        !striped && 'border-b',
        grid && 'border-l first:border-l-0',
        !bleed && 'sm:last:pe-1 sm:first:ps-1',
        allowResize && 'overflow-hidden truncate',
        className
      )}
      style={({ hasChildItems, isTreeColumn, level }) => ({
        paddingInlineStart: isTreeColumn
          ? 4 + (hasChildItems ? 0 : 24) + (level - 1) * 20
          : undefined,
      })}
    >
      {composeRenderProps(
        children,
        (resolvedChildren, { hasChildItems, isTreeColumn, isExpanded, isDisabled }) => (
          <div className="flex h-full w-full items-center">
            {hasChildItems && isTreeColumn && (
              slots.chevronButton ? (
                renderSlot(slots.chevronButton, { isExpanded, isDisabled, ...slotProps.chevronButton })
              ) : (
                <RACButton
                  slot="chevron"
                  className={cn(
                    isDisabled && 'opacity-50',
                    'mr-2 grid size-[1.15rem] flex-none shrink-0 place-content-center rounded text-fg hover:bg-secondary'
                  )}
                >
                  <ChevronRightIcon
                    className={cn(
                      'size-4 transition-transform duration-200',
                      isExpanded && 'rotate-90'
                    )}
                  />
                </RACButton>
              )
            )}
            {resolvedChildren}
          </div>
        )
      )}
    </Cell>
  )
}

export const TableCell = createInterfaceComponent<TableCellProps, TableCellSlots>(
  {
    name: 'TableCell',
    category: 'data',
    description: 'Data cell primitive with hierarchical tree indentation and expand chevron support.',
    version: '1.0.0',
    slots: {
      chevronButton: undefined,
    },
  },
  TableCellPrimitiveWrapper
)

/* ==========================================================================
   Table Footer
   ========================================================================== */

export interface TableFooterProps<T extends object = object> extends RACTableFooterProps<T> {}

const TableFooterPrimitiveWrapper = <T extends object>({
  className,
  ...props
}: TableFooterProps<T>) => {
  return (
    <TableFooterPrimitive
      data-slot="table-footer"
      className={cn('**:font-semibold [&_[slot=selection]]:invisible', className)}
      {...props}
    />
  )
}

export const TableFooter = createInterfaceComponent<TableFooterProps<any>>(
  {
    name: 'TableFooter',
    category: 'data',
    description: 'Summary footer row container for table totals and footnotes.',
    version: '1.0.0',
  },
  TableFooterPrimitiveWrapper as any
)

/* ==========================================================================
   Compound Family Namespace Attachments
   ========================================================================== */

Table.Header = TableHeader
Table.Column = TableColumn
Table.Body = TableBody
Table.Row = TableRow
Table.Cell = TableCell
Table.Footer = TableFooter
Table.ColumnResizer = ColumnResizer
Table.Resizer = ColumnResizer
Table.Provider = TableProvider
