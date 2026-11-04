import React from 'react'

const TOOLTIP_SLOTS = new Set(['chart-tooltip'])
const LAYOUT_SLOTS = new Set([
  'chart-container',
  'chart-canvas',
  'chart-header',
  'chart-toolbar',
  'chart-legend',
  'chart-footer',
  'chart-empty-state',
  'chart-loading-state',
])

const TOOLTIP_NAMES = new Set([
  'ChartTooltip',
  'ChartTooltipBridge',
  'InterfaceChartTooltip',
])

const LAYOUT_NAMES = new Set([
  'ChartContainer',
  'ChartCanvas',
  'ChartHeader',
  'ChartToolbar',
  'ChartLegend',
  'ChartFooter',
  'ChartEmptyState',
  'ChartLoadingState',
  'InterfaceChartContainer',
  'InterfaceChartCanvas',
  'InterfaceChartHeader',
  'InterfaceChartToolbar',
  'InterfaceChartLegend',
  'InterfaceChartFooter',
])

function elementName(type: unknown): string {
  if (typeof type === 'string') return type
  if (typeof type === 'function' || (typeof type === 'object' && type !== null)) {
    const t = type as { displayName?: string; name?: string; config?: { name?: string } }
    return t.displayName || t.name || t.config?.name || ''
  }
  return ''
}

function isTooltipElement(child: React.ReactElement): boolean {
  const slot = (child.props as { 'data-slot'?: string } | undefined)?.['data-slot']
  if (slot && TOOLTIP_SLOTS.has(slot)) return true
  const name = elementName(child.type)
  return TOOLTIP_NAMES.has(name) || name.endsWith('Tooltip') || name.endsWith('TooltipBridge')
}

function isLayoutElement(child: React.ReactElement): boolean {
  const slot = (child.props as { 'data-slot'?: string } | undefined)?.['data-slot']
  if (slot && LAYOUT_SLOTS.has(slot)) return true
  const name = elementName(child.type)
  if (LAYOUT_NAMES.has(name)) return true
  // Compound aliases: BarChart.Container, LineChart.Canvas, etc.
  return (
    /(Chart)?(Container|Canvas|Header|Toolbar|Legend|Footer|Empty|Loading|EmptyState|LoadingState)$/.test(
      name
    ) && !isTooltipElement(child)
  )
}

/**
 * Locate a ChartTooltip element anywhere in the children tree (used by Nivo tooltip bridges).
 */
export function findTooltipElement(node: React.ReactNode): React.ReactElement | null {
  if (!node) return null
  for (const child of React.Children.toArray(node)) {
    if (!React.isValidElement(child)) continue
    if (isTooltipElement(child)) return child
    const nested = (child.props as { children?: React.ReactNode } | undefined)?.children
    if (nested != null) {
      const found = findTooltipElement(nested)
      if (found) return found
    }
  }
  return null
}

/**
 * Headless mode only when children supply layout chrome (Container/Canvas/…).
 * Tooltip-only children compose into the default chart shell instead of replacing it.
 */
export function shouldRenderHeadlessChart(children: React.ReactNode): boolean {
  if (children == null) return false
  const nodes = React.Children.toArray(children).filter((n) => n != null && n !== false)
  if (nodes.length === 0) return false

  let sawLayout = false
  let sawUnknown = false

  for (const child of nodes) {
    if (!React.isValidElement(child)) {
      sawUnknown = true
      continue
    }
    if (isTooltipElement(child)) continue
    if (isLayoutElement(child)) {
      sawLayout = true
      continue
    }
    sawUnknown = true
  }

  return sawLayout || sawUnknown
}
