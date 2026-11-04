import { useState, useEffect, useRef, type RefObject } from 'react'

export interface UseChartDimensionsOptions {
  height?: number | string
  aspectRatio?: number
  defaultWidth?: number
  defaultHeight?: number
}

export interface ChartDimensions {
  ref: RefObject<HTMLDivElement | null>
  width: number
  height: number
  isReady: boolean
}

/**
 * Precision responsive dimension detector with ResizeObserver support.
 */
export function useChartDimensions(
  options: UseChartDimensionsOptions = {}
): ChartDimensions {
  const {
    height: explicitHeight,
    aspectRatio,
    defaultWidth = 500,
    defaultHeight = 360,
  } = options

  const ref = useRef<HTMLDivElement | null>(null)
  const [dimensions, setDimensions] = useState<{ width: number; height: number; isReady: boolean }>({
    width: defaultWidth,
    height: typeof explicitHeight === 'number' ? explicitHeight : defaultHeight,
    isReady: false,
  })

  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return

    const updateDimensions = () => {
      const rect = el.getBoundingClientRect()
      const w = Math.floor(rect.width)
      let h = defaultHeight

      if (aspectRatio && w > 0) {
        h = Math.floor(w / aspectRatio)
      } else if (typeof explicitHeight === 'number') {
        h = explicitHeight
      } else if (rect.height > 0) {
        h = Math.floor(rect.height)
      }

      if (w > 0 && h > 0) {
        setDimensions({
          width: w,
          height: h,
          isReady: true,
        })
      }
    }

    const ro = new ResizeObserver(() => {
      updateDimensions()
    })

    ro.observe(el)
    updateDimensions()

    return () => ro.disconnect()
  }, [explicitHeight, aspectRatio, defaultHeight])

  return {
    ref,
    width: dimensions.width,
    height: dimensions.height,
    isReady: dimensions.isReady,
  }
}
