import React, { useCallback } from 'react'
import { useChartTooltip } from '../../hooks/use-chart-tooltip'

export type BarCornerStyle = 'all' | 'flat-baseline' | 'top' | 'bottom' | 'left' | 'right' | 'none'

export interface BarItemProps {
  /** Custom bar configuration. */
  bar: {
    data: any
    x: number
    y: number
    width: number
    height: number
    color: string
    [key: string]: any
  }
  style?: React.CSSProperties | any
  /** Custom border radius configuration. */
  borderRadius?: number
  /** Custom corner style configuration. */
  cornerStyle?: BarCornerStyle
  /** Custom layout configuration. */
  layout?: 'vertical' | 'horizontal'
  /** Custom tooltip configuration. */
  tooltip?: React.ComponentType<any>
  /** Whether the component is interactive. */
  isInteractive?: boolean
  /** Callback fired when click occurs. */
  onClick?: (datum: any, event: React.MouseEvent) => void
  /** Callback fired when mouse enter occurs. */
  onMouseEnter?: (datum: any, event: React.MouseEvent) => void
  /** Callback fired when mouse move occurs. */
  onMouseMove?: (datum: any, event: React.MouseEvent) => void
  /** Callback fired when mouse leave occurs. */
  onMouseLeave?: (datum: any, event: React.MouseEvent) => void
  className?: string
}

export type BarChartItemProps = BarItemProps

/**
 * Universal Bar Item Renderer with pre-wired tooltip and event handling.
 * Supports configurable corner geometry (all, flat-baseline, top, right, none).
 */
export const BarChartItem: React.FC<BarItemProps> = ({
  bar,
  style,
  borderRadius = 4,
  cornerStyle = 'all',
  layout = 'vertical',
  tooltip: TooltipComponent,
  isInteractive = true,
  onClick,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  className,
  ...rest
}) => {
  // Extract Nivo internal engine props to prevent invalid DOM/SVG attribute warnings
  const {
    borderWidth,
    borderColor,
    enableLabel,
    label,
    labelColor,
    shouldRenderLabel,
    labelSkipWidth,
    labelSkipHeight,
    getTooltipLabel,
    isFocusable,
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    ariaHidden,
    ariaDisabled,
    theme,
    ...domProps
  } = rest as Record<string, any>

  const ariaAttributes = {
    ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
    ...(ariaLabelledBy ? { 'aria-labelledby': ariaLabelledBy } : {}),
    ...(ariaDescribedBy ? { 'aria-describedby': ariaDescribedBy } : {}),
    ...(ariaHidden !== undefined ? { 'aria-hidden': ariaHidden } : {}),
    ...(ariaDisabled !== undefined ? { 'aria-disabled': ariaDisabled } : {}),
  }

  const { showTooltipFromEvent, hideTooltip } = useChartTooltip()
  const { x, y, width, height, color } = bar

  const handleMouseEnter = useCallback(
    (event: React.MouseEvent) => {
      if (!isInteractive) return
      onMouseEnter?.(bar.data, event)
      if (TooltipComponent) {
        showTooltipFromEvent(React.createElement(TooltipComponent, { ...bar, ...bar.data }), event)
      }
    },
    [isInteractive, onMouseEnter, bar, TooltipComponent, showTooltipFromEvent]
  )

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!isInteractive) return
      onMouseMove?.(bar.data, event)
      if (TooltipComponent) {
        showTooltipFromEvent(React.createElement(TooltipComponent, { ...bar, ...bar.data }), event)
      }
    },
    [isInteractive, onMouseMove, bar, TooltipComponent, showTooltipFromEvent]
  )

  const handleMouseLeave = useCallback(
    (event: React.MouseEvent) => {
      if (!isInteractive) return
      onMouseLeave?.(bar.data, event)
      hideTooltip()
    },
    [isInteractive, onMouseLeave, bar.data, hideTooltip]
  )

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      if (!isInteractive) return
      onClick?.({ color: bar.color, ...bar.data }, event)
    },
    [isInteractive, onClick, bar]
  )

  const fillValue = bar.fill || (bar.data as any)?.fill || (style as any)?.fill || color

  if (height <= 0 || width <= 0) return null

  const isNegative = (bar.data as any)?.value < 0 || (bar.data as any)?.y < 0

  let effectiveCorner: BarCornerStyle = cornerStyle
  if (cornerStyle === 'flat-baseline') {
    if (layout === 'horizontal') {
      effectiveCorner = isNegative ? 'left' : 'right'
    } else {
      effectiveCorner = isNegative ? 'bottom' : 'top'
    }
  } else if (isNegative) {
    if (cornerStyle === 'top') effectiveCorner = 'bottom'
    else if (cornerStyle === 'right') effectiveCorner = 'left'
  }

  if (effectiveCorner === 'top') {
    const r = Math.min(borderRadius, width / 2, height / 2)
    const d = `
      M ${x},${y + height}
      L ${x},${y + r}
      Q ${x},${y} ${x + r},${y}
      L ${x + width - r},${y}
      Q ${x + width},${y} ${x + width},${y + r}
      L ${x + width},${y + height}
      Z
    `
    return (
      <path
        d={d}
        fill={fillValue}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{ transition: 'opacity 0.15s ease', ...style }}
        className={className || 'hover:opacity-85 cursor-pointer'}
        {...ariaAttributes}
        {...domProps}
      />
    )
  }

  if (effectiveCorner === 'bottom') {
    const r = Math.min(borderRadius, width / 2, height / 2)
    const d = `
      M ${x},${y}
      L ${x + width},${y}
      L ${x + width},${y + height - r}
      Q ${x + width},${y + height} ${x + width - r},${y + height}
      L ${x + r},${y + height}
      Q ${x},${y + height} ${x},${y + height - r}
      L ${x},${y}
      Z
    `
    return (
      <path
        d={d}
        fill={fillValue}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{ transition: 'opacity 0.15s ease', ...style }}
        className={className || 'hover:opacity-85 cursor-pointer'}
        {...ariaAttributes}
        {...domProps}
      />
    )
  }

  if (effectiveCorner === 'right') {
    const r = Math.min(borderRadius, width / 2, height / 2)
    const d = `
      M ${x},${y}
      L ${x + width - r},${y}
      Q ${x + width},${y} ${x + width},${y + r}
      L ${x + width},${y + height - r}
      Q ${x + width},${y + height} ${x + width - r},${y + height}
      L ${x},${y + height}
      Z
    `
    return (
      <path
        d={d}
        fill={fillValue}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{ transition: 'opacity 0.15s ease', ...style }}
        className={className || 'hover:opacity-85 cursor-pointer'}
        {...ariaAttributes}
        {...domProps}
      />
    )
  }

  if (effectiveCorner === 'left') {
    const r = Math.min(borderRadius, width / 2, height / 2)
    const d = `
      M ${x + width},${y}
      L ${x + width},${y + height}
      L ${x + r},${y + height}
      Q ${x},${y + height} ${x},${y + height - r}
      L ${x},${y + r}
      Q ${x},${y} ${x + r},${y}
      L ${x + width},${y}
      Z
    `
    return (
      <path
        d={d}
        fill={fillValue}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{ transition: 'opacity 0.15s ease', ...style }}
        className={className || 'hover:opacity-85 cursor-pointer'}
        {...ariaAttributes}
        {...domProps}
      />
    )
  }


  // Standard rectangle (all corners rounded via rx/ry)
  const rx = effectiveCorner === 'none' ? 0 : Math.min(borderRadius, width / 2, height / 2)

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={rx}
      ry={rx}
      fill={fillValue}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{ transition: 'opacity 0.15s ease', ...style }}
      className={className || 'hover:opacity-85 cursor-pointer'}
      {...ariaAttributes}
      {...domProps}
    />
  )
}

/**
 * Vertical Bar Item with rounded top and flat baseline (0 corner radius on touching bottom).
 */
export const TopRoundedBarItem: React.FC<BarItemProps> = (props) => (
  <BarChartItem {...props} cornerStyle="top" />
)

/**
 * Horizontal Bar Item with rounded right and flat baseline (0 corner radius on touching left).
 */
export const RightRoundedBarItem: React.FC<BarItemProps> = (props) => (
  <BarChartItem {...props} cornerStyle="right" />
)
