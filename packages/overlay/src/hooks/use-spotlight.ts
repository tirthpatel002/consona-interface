import { useCallback, useMemo } from 'react'
import { useTargetGeometry } from './use-overlay'
import type { OverlayTargetResolver, SpotlightOptions, TargetRect } from '../engine/types'

export interface UseSpotlightOptions extends Omit<SpotlightOptions, 'target'> {
  target?: OverlayTargetResolver
  active?: boolean
  padding?: number
  onDismiss?: () => void
}

export interface UseSpotlightReturn {
  state: {
    active: boolean
    rect: TargetRect | null
    shape: SpotlightOptions['shape']
    padding: number
  }
  actions: {
    update: () => TargetRect | null
    dismiss: () => void
  }
  helpers: {
    hasTarget: boolean
    isTargetVisible: boolean
  }
  ariaProps: {
    'aria-hidden': boolean
    role: string
  }
}

/**
 * Headless spotlight hook conforming to the 4-part contract.
 */
export function useSpotlight(options: UseSpotlightOptions = {}): UseSpotlightReturn {
  const {
    target,
    active = true,
    padding = 8,
    shape = 'rounded-rect',
    onDismiss,
  } = options

  const { rect, update } = useTargetGeometry(active ? target : null, padding)

  const dismiss = useCallback(() => {
    onDismiss?.()
  }, [onDismiss])

  const hasTarget = Boolean(target)
  const isTargetVisible = Boolean(rect && rect.width > 0 && rect.height > 0)

  return useMemo(
    () => ({
      state: {
        active,
        rect,
        shape,
        padding,
      },
      actions: {
        update,
        dismiss,
      },
      helpers: {
        hasTarget,
        isTargetVisible,
      },
      ariaProps: {
        'aria-hidden': true,
        role: 'presentation',
      },
    }),
    [active, rect, shape, padding, update, dismiss, hasTarget, isTargetVisible]
  )
}
