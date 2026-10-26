import React from 'react'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { AnchoredCallout, type AnchoredCalloutProps } from '../anchored-callout'
import { SpotlightOverlay, type SpotlightOverlayProps } from '../spotlight-overlay'
import type {
  BackdropVariant,
  CutoutRadius,
  CutoutShapeType,
  OverlayPlacement,
  OverlayTargetResolver,
  TargetRect,
} from '../../engine/types'

/* ==========================================================================
   OverlayFocus Slot Definitions
   ========================================================================== */

export interface OverlayFocusSlots {
  /** Spotlight overlay component slot. */
  spotlight?: React.ComponentType<SpotlightOverlayProps>
  /** Anchored floating callout component slot. */
  callout?: React.ComponentType<AnchoredCalloutProps>
}

/* ==========================================================================
   OverlayFocus Props
   ========================================================================== */

export interface OverlayFocusProps {
  /** Target to spotlight/focus. */
  target?: OverlayTargetResolver | OverlayTargetResolver[]
  /** Active state. */
  active?: boolean
  /** Highlight variant: cutout, none. */
  variant?: BackdropVariant
  /** Cutout padding in pixels (default 8). */
  padding?: number
  /** Cutout radius in pixels (default 8). */
  radius?: CutoutRadius
  /** Cutout shape: rounded-rect, rect, circle, pill. */
  shape?: CutoutShapeType
  /** Whether target remains interactive. */
  interactive?: boolean
  /** Backdrop blur filter for the background (default false). */
  backdropBlur?: boolean
  /** Custom class name applied to target highlight boxes (e.g. ring, border, shadow). */
  targetClassName?: string
  /** Custom CSS styles applied to target highlight boxes. */
  targetStyle?: React.CSSProperties
  /** Custom render function to decorate each target bounding rect. */
  renderTargetHighlight?: (rect: TargetRect, index: number) => React.ReactNode
  /** Placement of anchored child callout (if any). */
  placement?: OverlayPlacement
  /** Distance offset for child callout. */
  offset?: number
  /** Click backdrop callback. */
  onClickBackdrop?: () => void
  /** Anchored child content (optional floating card or tooltip). */
  children?: React.ReactNode
  /** Slot overrides map. */
  slots?: SlotComponents<OverlayFocusSlots>
  /** Slot props overrides map. */
  slotProps?: SlotPropsMap<OverlayFocusSlots>
}

const OverlayFocusPrimitive = ({
  target,
  active = false,
  variant = 'cutout',
  padding = 8,
  radius = 'auto',
  shape = 'rounded-rect',
  interactive = false,
  backdropBlur = false,
  targetClassName,
  targetStyle,
  renderTargetHighlight,
  placement = 'bottom',
  offset = 14,
  onClickBackdrop,
  children,
  slots,
  slotProps,
}: OverlayFocusProps) => {
  if (!active) return null

  return (
    <>
      {slots?.spotlight ? (
        renderSlot(slots.spotlight, {
          target,
          active,
          variant,
          padding,
          radius,
          shape,
          interactive,
          backdropBlur,
          targetClassName,
          targetStyle,
          renderTargetHighlight,
          onBackdropClick: onClickBackdrop,
          ...(slotProps?.spotlight as any),
        })
      ) : (
        <SpotlightOverlay
          target={target}
          active={active}
          variant={variant}
          padding={padding}
          radius={radius}
          shape={shape}
          interactive={interactive}
          backdropBlur={backdropBlur}
          targetClassName={targetClassName}
          targetStyle={targetStyle}
          renderTargetHighlight={renderTargetHighlight}
          onBackdropClick={onClickBackdrop}
          {...(slotProps?.spotlight as any)}
        />
      )}

      {children &&
        (slots?.callout ? (
          renderSlot(slots.callout, {
            target,
            open: active,
            placement,
            offset,
            children,
            ...(slotProps?.callout as any),
          })
        ) : (
          <AnchoredCallout
            target={target}
            open={active}
            placement={placement}
            offset={offset}
            {...(slotProps?.callout as any)}
          >
            {children}
          </AnchoredCallout>
        ))}
    </>
  )
}

export const OverlayFocus = createInterfaceComponent<OverlayFocusProps, OverlayFocusSlots>(
  {
    name: 'OverlayFocus',
    category: 'overlay',
    description: 'Composite focus spotlight orchestrating dynamic SVG mask cutout and anchored callout.',
    version: '1.0.0',
    props: {
      active: false,
      variant: 'cutout',
      padding: 8,
      radius: 'auto',
      shape: 'rounded-rect',
      interactive: false,
      backdropBlur: false,
      placement: 'bottom',
      offset: 14,
    },
    slots: {
      spotlight: undefined,
      callout: undefined,
    },
  },
  OverlayFocusPrimitive
)
