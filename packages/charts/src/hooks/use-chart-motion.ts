import { useEffect, useMemo, useState } from 'react'

/**
 * Chart animation defaults. Disables Nivo/SVG animation when the user
 * prefers reduced motion.
 */
export function useChartMotion(overrides?: { animate?: boolean; motionConfig?: string }) {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener?.('change', sync)
    return () => mq.removeEventListener?.('change', sync)
  }, [])

  return useMemo(() => {
    const animate = overrides?.animate ?? !reduced
    return {
      animate,
      ...(animate
        ? overrides?.motionConfig
          ? { motionConfig: overrides.motionConfig }
          : {}
        : { motionConfig: 'default' as const }),
    }
  }, [reduced, overrides?.animate, overrides?.motionConfig])
}
