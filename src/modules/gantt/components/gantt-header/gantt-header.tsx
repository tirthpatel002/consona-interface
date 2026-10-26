/**
 * @file gantt-header.tsx
 * Sticky timeline header with date / week columns and optional parent bands.
 * Title-column corner hosts the rail collapse / expand control when the rail is enabled.
 */

import React from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import {
  parentBandsFromColumns,
  parentBandsInWindow,
} from '../../engine'
import { useOptionalGantt } from '../../hooks'

export interface GanttHeaderRailCollapseSlotProps {
  /** Whether the title/rail column is currently collapsed. */
  collapsed: boolean
  /** Toggle collapse / expand. */
  onToggle: () => void
  /** Accessible label for the control. */
  'aria-label': string
  /** Custom CSS classes. */
  className?: string
}

export interface GanttHeaderSlots {
  /** Collapse / expand control in the title-column header cell (top-left corner). */
  railCollapse?: React.ComponentType<GanttHeaderRailCollapseSlotProps>
}

export interface GanttHeaderProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Optional sticky rail spacer width matching Gantt.Rail. Default: 12rem. */
  railWidth?: string | number
  /** Hide the sticky spacer (when composing rail separately). */
  hideRailSpacer?: boolean
  /**
   * Show the rail collapse / expand control in the title-column header cell.
   * Default: from context when the rail is enabled.
   */
  showRailCollapse?: boolean
  /** Controlled collapsed flag for the rail (overrides context when set). */
  railCollapsed?: boolean
  /** Collapse change callback (overrides context setter when set). */
  onRailCollapsedChange?: (collapsed: boolean) => void
  /** Custom CSS classes. */
  className?: string
  /** Slot overrides. */
  slots?: SlotComponents<GanttHeaderSlots>
  /** Slot props. */
  slotProps?: SlotPropsMap<GanttHeaderSlots>
}

/** Default outlined collapse / expand icon button for the title-column header cell. */
function DefaultRailCollapse({
  collapsed,
  onToggle,
  'aria-label': ariaLabel,
  className,
}: GanttHeaderRailCollapseSlotProps) {
  const Icon = collapsed ? ChevronRightIcon : ChevronLeftIcon
  return (
    <button
      type="button"
      data-slot="gantt-header-rail-collapse"
      aria-label={ariaLabel}
      aria-expanded={!collapsed}
      onClick={(e) => {
        e.stopPropagation()
        onToggle?.()
      }}
      className={cn(
        'inline-flex size-7 shrink-0 items-center justify-center rounded-micro',
        'text-muted-fg hover:bg-secondary hover:text-fg',
        'transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary',
        className
      )}
    >
      <Icon className="size-3.5" aria-hidden />
    </button>
  )
}

const GanttHeaderPrimitive = ({
  railWidth = '12rem',
  hideRailSpacer = false,
  showRailCollapse: showRailCollapseProp,
  railCollapsed: railCollapsedProp,
  onRailCollapsedChange,
  className,
  children,
  slots,
  slotProps,
  ...props
}: GanttHeaderProps) => {
  const gantt = useOptionalGantt()
  const columns = gantt?.helpers.columns ?? []
  const cellWidth = gantt?.state.cellWidth ?? 100
  const timelineWidthPx = gantt?.helpers.timelineWidthPx ?? columns.length * cellWidth
  const colWindow = gantt?.helpers.columnWindow ?? {
    startIndex: 0,
    endIndex: columns.length,
    offsetPx: 0,
  }
  const visibleColumns = gantt?.helpers.visibleColumns ?? columns
  const allParentBands = parentBandsFromColumns(columns, cellWidth)
  const windowWidthPx = Math.max(
    cellWidth,
    (colWindow.endIndex - colWindow.startIndex) * cellWidth
  )
  const parentBands = parentBandsInWindow(allParentBands, colWindow.offsetPx, windowWidthPx)
  const showParentBand = children == null && allParentBands.length > 0

  const ctx = gantt?.helpers.context
  const showRailCollapse =
    showRailCollapseProp !== undefined
      ? showRailCollapseProp
      : Boolean(ctx?.showRail)
  const railCollapsed =
    railCollapsedProp !== undefined ? railCollapsedProp : (ctx?.railCollapsed ?? false)

  const onToggle = () => {
    const next = !railCollapsed
    if (onRailCollapsedChange) {
      onRailCollapsedChange(next)
    } else {
      ctx?.setRailCollapsed(next)
    }
  }

  return (
    <div
      data-slot="gantt-header"
      role="rowgroup"
      className={cn(
        'sticky top-0 z-20 w-max min-w-full border-b border-border bg-bg/95 backdrop-blur-sm',
        className
      )}
      {...props}
    >
      <div className="flex w-max min-w-full" role="row">
        {!hideRailSpacer && (
          <div
            data-slot="gantt-header-rail-spacer"
            data-collapsed={railCollapsed || undefined}
            className={cn(
              'sticky left-0 z-30 flex shrink-0 items-center justify-center border-r border-border bg-bg',
              'transition-[width] duration-200 ease-out'
            )}
            style={{ width: railWidth }}
          >
            {showRailCollapse
              ? renderSlot(
                  slots?.railCollapse,
                  {
                    collapsed: railCollapsed,
                    onToggle,
                    'aria-label': railCollapsed
                      ? 'Expand title column'
                      : 'Collapse title column',
                    ...(slotProps?.railCollapse as object),
                  },
                  { defaultComponent: DefaultRailCollapse }
                )
              : null}
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col" style={{ width: timelineWidthPx }}>
          {showParentBand ? (
            <div
              data-slot="gantt-header-parent-band"
              className="relative border-b border-border/60 bg-secondary/40"
              role="row"
              style={{ width: timelineWidthPx, height: '1.5rem' }}
            >
              {parentBands.map((band) => (
                <div
                  key={band.key}
                  data-slot="gantt-header-parent-cell"
                  role="columnheader"
                  className="absolute top-0 flex h-full items-center justify-center overflow-hidden border-r border-border/60 px-space-xs py-space-xs text-center"
                  style={{ left: band.left, width: band.width }}
                  title={band.label}
                >
                  <span className="truncate text-[10px] font-medium text-muted-fg">
                    {band.label}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          <div
            data-slot="gantt-header-cells"
            className="relative flex"
            role="row"
            style={{ width: timelineWidthPx }}
          >
            {children != null ? (
              children
            ) : (
              <>
                {colWindow.offsetPx > 0 ? (
                  <div
                    data-slot="gantt-header-virtual-spacer"
                    aria-hidden
                    className="shrink-0"
                    style={{ width: colWindow.offsetPx }}
                  />
                ) : null}
                {visibleColumns.map((col, i) => {
                  const index = colWindow.startIndex + i
                  return (
                    <div
                      key={`${col.start.getTime()}-${index}`}
                      data-slot="gantt-header-cell"
                      role="columnheader"
                      className={cn(
                        'flex shrink-0 flex-col items-center justify-center gap-space-xs border-r border-border/60 px-space-xs py-space-sm text-center',
                        col.isToday && 'bg-danger/10 text-danger'
                      )}
                      style={{ width: cellWidth }}
                    >
                      <span className="text-xs font-medium text-fg">{col.label}</span>
                      {col.subLabel ? (
                        <span className="text-[10px] text-muted-fg">{col.subLabel}</span>
                      ) : null}
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export const GanttHeader = createInterfaceComponent<GanttHeaderProps, GanttHeaderSlots>(
  {
    name: 'GanttHeader',
    category: 'data',
    description:
      'Sticky Gantt timeline header with virtualized day/week column labels, optional parent bands (week/month), today highlighting, and a title-column collapse / expand control.',
    version: '1.2.0',
    props: {
      hideRailSpacer: false,
    },
    slots: {
      railCollapse: undefined,
    },
  },
  GanttHeaderPrimitive
)
