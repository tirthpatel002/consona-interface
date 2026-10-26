import React, { useCallback, useContext } from 'react'
import { useTooltip as useNivoTooltip } from '@nivo/tooltip'
import {
  ChartTooltipStoreContext,
  defaultChartTooltipStore,
  useTooltipStoreState,
  type TooltipStore,
  type TooltipState,
  type TooltipAnchor,
} from '../tooltip-registry'
import { useChartContext } from '../components/chart-context'

export interface ChartTooltipHandlers {
  showTooltip: (content: React.ReactNode, options?: { event?: any; position?: [number, number]; anchor?: TooltipAnchor | string; datum?: any }) => void
  showTooltipFromEvent: (content: React.ReactNode, event: React.MouseEvent | React.TouchEvent | any, options?: { anchor?: TooltipAnchor | string; datum?: any }) => void
  showTooltipAt: (content: React.ReactNode, position: [number, number], anchor?: string, datum?: any) => void
  hideTooltip: (immediate?: boolean | number, delayMs?: number) => void
  updatePosition: (x: number, y: number) => void
  tooltipStore: TooltipStore
  tooltipState: TooltipState
  /**
   * Generates mouse and focus event props to bind directly to SVG or HTML chart elements.
   */
  bindTooltipEvents: <T = any>(options: {
    datum: T
    tooltip?: React.ComponentType<any> | ((props: any) => React.ReactNode)
    isInteractive?: boolean
    anchor?: TooltipAnchor | string
    onMouseEnter?: (datum: T, event: React.MouseEvent) => void
    onMouseMove?: (datum: T, event: React.MouseEvent) => void
    onMouseLeave?: (datum: T, event: React.MouseEvent) => void
    onClick?: (datum: T, event: React.MouseEvent) => void
    onFocus?: (datum: T, event: React.FocusEvent) => void
    onBlur?: (datum: T, event: React.FocusEvent) => void
  }) => {
    onMouseEnter?: (event: React.MouseEvent) => void
    onMouseMove?: (event: React.MouseEvent) => void
    onMouseLeave?: (event: React.MouseEvent) => void
    onClick?: (event: React.MouseEvent) => void
    onFocus?: (event: React.FocusEvent) => void
    onBlur?: (event: React.FocusEvent) => void
  }
}

/**
 * Hook providing direct, non-flickering access to the underlying chart tooltip engine.
 * Eliminates remounting between items and maintains continuous presence within the canvas viewport.
 */
export function useChartTooltip(): ChartTooltipHandlers {
  const chartContext = useChartContext()
  const contextStore = useContext(ChartTooltipStoreContext)
  const activeStore: TooltipStore = chartContext.tooltipStore || contextStore || defaultChartTooltipStore
  const tooltipState = useTooltipStoreState(activeStore)

  let nivoTooltip: ReturnType<typeof useNivoTooltip> | null = null
  try {
    nivoTooltip = useNivoTooltip()
  } catch {
    nivoTooltip = null
  }

  const showTooltip = useCallback(
    (
      content: React.ReactNode,
      options: { event?: any; position?: [number, number]; anchor?: TooltipAnchor | string; datum?: any } = {}
    ) => {
      activeStore.showTooltip(content, options)

      // Sync with Nivo tooltip context if active
      if (options.position) {
        nivoTooltip?.showTooltipAt(content as any, options.position, options.anchor as any)
      } else if (options.event) {
        nivoTooltip?.showTooltipFromEvent(content as any, options.event)
      }
    },
    [activeStore, nivoTooltip]
  )

  const showTooltipFromEvent = useCallback(
    (content: React.ReactNode, event: React.MouseEvent | React.TouchEvent | any, options: { anchor?: TooltipAnchor | string; datum?: any } = {}) => {
      activeStore.showTooltipFromEvent(content, event, options)
      nivoTooltip?.showTooltipFromEvent(content as any, event)
    },
    [activeStore, nivoTooltip]
  )

  const showTooltipAt = useCallback(
    (content: React.ReactNode, position: [number, number], anchor: string = 'top', datum?: any) => {
      activeStore.showTooltipAt(content, position, anchor, datum)
      nivoTooltip?.showTooltipAt(content as any, position, anchor as any)
    },
    [activeStore, nivoTooltip]
  )

  const hideTooltip = useCallback(
    (immediateOrDelay: boolean | number = false, delayMs: number = 180) => {
      const immediate = typeof immediateOrDelay === 'boolean' ? immediateOrDelay : immediateOrDelay <= 0
      const delay = typeof immediateOrDelay === 'number' ? immediateOrDelay : delayMs

      activeStore.hideTooltip(immediate, delay)

      if (immediate) {
        nivoTooltip?.hideTooltip()
      }
    },
    [activeStore, nivoTooltip]
  )

  const updatePosition = useCallback(
    (x: number, y: number) => {
      activeStore.updatePosition(x, y)
    },
    [activeStore]
  )

  const bindTooltipEvents = useCallback(
    <T = any>({
      datum,
      tooltip,
      isInteractive = true,
      anchor = 'top',
      onMouseEnter,
      onMouseMove,
      onMouseLeave,
      onClick,
      onFocus,
      onBlur,
    }: {
      datum: T
      tooltip?: React.ComponentType<any> | ((props: any) => React.ReactNode)
      isInteractive?: boolean
      anchor?: TooltipAnchor | string
      onMouseEnter?: (datum: T, event: React.MouseEvent) => void
      onMouseMove?: (datum: T, event: React.MouseEvent) => void
      onMouseLeave?: (datum: T, event: React.MouseEvent) => void
      onClick?: (datum: T, event: React.MouseEvent) => void
      onFocus?: (datum: T, event: React.FocusEvent) => void
      onBlur?: (datum: T, event: React.FocusEvent) => void
    }) => {
      if (!isInteractive) return {}

      const renderContent = () => {
        if (!tooltip) return null
        if (typeof tooltip === 'function') {
          const props = typeof datum === 'object' && datum !== null ? (datum as Record<string, any>) : { datum }
          return React.createElement(tooltip as React.ComponentType<any>, props)
        }
        return null
      }

      return {
        onMouseEnter: (event: React.MouseEvent) => {
          onMouseEnter?.(datum, event)
          const content = renderContent()
          if (content) {
            showTooltipFromEvent(content, event, { anchor, datum })
          }
        },
        onMouseMove: (event: React.MouseEvent) => {
          onMouseMove?.(datum, event)
          const content = renderContent()
          if (content) {
            showTooltipFromEvent(content, event, { anchor, datum })
          }
        },
        onMouseLeave: (event: React.MouseEvent) => {
          onMouseLeave?.(datum, event)
          // Hide is non-immediate to prevent flickering when transitioning across items
          hideTooltip(false, 150)
        },
        onClick: (event: React.MouseEvent) => {
          onClick?.(datum, event)
        },
        onFocus: (event: React.FocusEvent) => {
          onFocus?.(datum, event)
        },
        onBlur: (event: React.FocusEvent) => {
          onBlur?.(datum, event)
          hideTooltip(true, 0)
        },
      }
    },
    [showTooltipFromEvent, hideTooltip]
  )

  return {
    showTooltip,
    showTooltipFromEvent,
    showTooltipAt,
    hideTooltip,
    updatePosition,
    bindTooltipEvents,
    tooltipStore: activeStore,
    tooltipState,
  }
}
