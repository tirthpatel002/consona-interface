import React from 'react'
import { renderSlot } from '@consona/interface-core'
import { ChartTooltip, type ChartTooltipProps } from '../components/chart-container'
import { findTooltipElement } from './chart-children'

export type ChartTooltipPayload = ChartTooltipProps & Record<string, unknown>

export interface RenderChartTooltipOptions {
  children?: React.ReactNode
  slots?: { tooltip?: any }
  slotProps?: { tooltip?: Record<string, unknown> }
  payload: ChartTooltipPayload
}

/**
 * Resolve composite child tooltip → slots.tooltip → default ChartTooltip card.
 * Shared by all chart engines to avoid per-file drift.
 */
export function renderChartTooltip({
  children,
  slots,
  slotProps,
  payload,
}: RenderChartTooltipOptions): React.ReactNode {
  const compositeTooltip = findTooltipElement(children ?? null)
  if (compositeTooltip) {
    const tooltipPropsObj = (compositeTooltip.props || {}) as Record<string, any>
    const merged = { ...payload, ...slotProps?.tooltip, ...tooltipPropsObj }
    if (typeof tooltipPropsObj.children === 'function') {
      return (
        <ChartTooltip {...merged}>
          {tooltipPropsObj.children(merged)}
        </ChartTooltip>
      )
    }
    return React.cloneElement(compositeTooltip, merged)
  }

  if (slots?.tooltip) {
    return renderSlot(slots.tooltip, { ...payload, ...slotProps?.tooltip } as any)
  }

  return (
    <ChartTooltip
      title={payload.title}
      label={payload.label}
      value={payload.value}
      color={payload.color}
      badge={payload.badge}
      badgeVariant={payload.badgeVariant}
      indicatorShape={payload.indicatorShape}
    />
  )
}
