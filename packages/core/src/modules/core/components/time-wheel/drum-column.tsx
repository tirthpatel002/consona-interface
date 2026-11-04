import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'

/* ==========================================================================
   DrumColumn Component (3D Inertial Cylinder)
   ========================================================================== */

export interface DrumColumnProps<T extends number | string = number | string> {
  /** Array of values rendered on the drum cylinder surface. */
  items: T[]
  /** Currently selected active value. */
  value: T
  /** Handler called when the active value snaps to a new item. */
  onChange: (val: T) => void
  /** Custom formatter function for rendering item text labels. */
  format?: (val: T) => string
  /** Column width class (e.g. 'w-12 sm:w-14'). */
  columnWidth?: string
  /** Whether the drum rotates continuously in an infinite looping circle. */
  loop?: boolean
  /** Custom container CSS classes. */
  className?: string
}

const DrumColumnPrimitive = <T extends number | string = number | string>({
  items,
  value,
  onChange,
  format = (v) => String(v),
  columnWidth = 'w-12 sm:w-14',
  loop = true,
  className,
}: DrumColumnProps<T>) => {
  const numItems = items.length
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedIndex = useMemo(() => {
    const idx = items.indexOf(value)
    return idx >= 0 ? idx : 0
  }, [items, value])

  const [currentPos, setCurrentPos] = useState<number>(selectedIndex)
  const currentPosRef = useRef<number>(selectedIndex)
  const targetPosRef = useRef<number>(selectedIndex)
  const animFrameRef = useRef<number | null>(null)
  const wheelEndTimeoutRef = useRef<number | null>(null)

  const isDraggingRef = useRef(false)
  const startYRef = useRef(0)
  const startPosRef = useRef(0)
  const lastYRef = useRef(0)
  const lastTimeRef = useRef(0)
  const velocityRef = useRef(0)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const itemsRef = useRef(items)
  itemsRef.current = items
  const valueRef = useRef(value)
  valueRef.current = value

  // Fluid physics animation loop
  const startSpringLoop = useCallback(() => {
    const step = () => {
      const diff = targetPosRef.current - currentPosRef.current

      if (Math.abs(diff) < 0.002 && !isDraggingRef.current) {
        const finalSnap = Math.round(targetPosRef.current)
        const normalized = loop
          ? ((finalSnap % numItems) + numItems) % numItems
          : Math.max(0, Math.min(numItems - 1, finalSnap))

        currentPosRef.current = finalSnap
        setCurrentPos(finalSnap)

        const currentItem = itemsRef.current[normalized]
        if (currentItem !== undefined && currentItem !== valueRef.current) {
          onChangeRef.current(currentItem)
        }
        animFrameRef.current = null
        return
      }

      const nextPos = currentPosRef.current + diff * 0.28
      currentPosRef.current = nextPos
      setCurrentPos(nextPos)
      animFrameRef.current = requestAnimationFrame(step)
    }

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    animFrameRef.current = requestAnimationFrame(step)
  }, [loop, numItems])

  const animateTo = useCallback(
    (target: number) => {
      targetPosRef.current = target
      startSpringLoop()
    },
    [startSpringLoop]
  )

  useEffect(() => {
    if (!isDraggingRef.current) {
      if (loop) {
        const curNorm = ((currentPosRef.current % numItems) + numItems) % numItems
        let delta = selectedIndex - curNorm
        if (delta > numItems / 2) delta -= numItems
        if (delta < -numItems / 2) delta += numItems
        animateTo(currentPosRef.current + delta)
      } else {
        animateTo(selectedIndex)
      }
    }
  }, [selectedIndex, loop, numItems, animateTo])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onWheelNonPassive = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const deltaItems = e.deltaY / 38
      targetPosRef.current += deltaItems

      if (!loop) {
        targetPosRef.current = Math.max(-0.4, Math.min(numItems - 0.6, targetPosRef.current))
      }

      startSpringLoop()

      if (wheelEndTimeoutRef.current) window.clearTimeout(wheelEndTimeoutRef.current)
      wheelEndTimeoutRef.current = window.setTimeout(() => {
        const snapTarget = Math.round(targetPosRef.current)
        targetPosRef.current = loop
          ? snapTarget
          : Math.max(0, Math.min(numItems - 1, snapTarget))
        startSpringLoop()
      }, 85)
    }

    el.addEventListener('wheel', onWheelNonPassive, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheelNonPassive)
    }
  }, [loop, numItems, startSpringLoop])

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    isDraggingRef.current = true
    startYRef.current = e.clientY
    lastYRef.current = e.clientY
    lastTimeRef.current = performance.now()
    startPosRef.current = currentPosRef.current
    velocityRef.current = 0

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return
    const now = performance.now()
    const dt = Math.max(1, now - lastTimeRef.current)
    const dy = e.clientY - lastYRef.current

    velocityRef.current = dy / dt
    lastYRef.current = e.clientY
    lastTimeRef.current = now

    const totalDy = e.clientY - startYRef.current
    const stepOffset = totalDy / 40

    let nextPos = startPosRef.current - stepOffset
    if (!loop) {
      nextPos = Math.max(-0.5, Math.min(numItems - 0.5, nextPos))
    }

    currentPosRef.current = nextPos
    targetPosRef.current = nextPos
    setCurrentPos(nextPos)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      // Ignore
    }

    const flingUnits = (-velocityRef.current * 120) / 40
    const clampedFling = Math.max(-5, Math.min(5, flingUnits))
    const rawSnap = Math.round(currentPosRef.current + clampedFling)
    const targetSnap = loop ? rawSnap : Math.max(0, Math.min(numItems - 1, rawSnap))

    animateTo(targetSnap)
  }

  const drumRadius = 66
  const visibleSteps = [-3, -2, -1, 0, 1, 2, 3]

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={cn(
        'relative h-[184px] cursor-grab active:cursor-grabbing touch-none overscroll-contain perspective-[800px] overflow-hidden select-none',
        columnWidth,
        className
      )}
      style={{
        maskImage:
          'linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)',
      }}
    >
      {visibleSteps.map((step) => {
        const targetVirtualIdx = Math.round(currentPos) + step
        if (!loop && (targetVirtualIdx < 0 || targetVirtualIdx >= numItems)) {
          return null
        }

        const normIdx = ((targetVirtualIdx % numItems) + numItems) % numItems
        const item = items[normIdx]
        if (item === undefined) return null

        const diff = targetVirtualIdx - currentPos
        const angleDeg = diff * 24
        const angleRad = (angleDeg * Math.PI) / 180

        const yPos = Math.sin(angleRad) * drumRadius
        const zPos = Math.cos(angleRad) * drumRadius
        const scale = 0.84 + 0.18 * Math.cos(angleRad)
        const opacity = Math.max(0.18, Math.pow(Math.cos(angleRad), 2.2))
        const isCenter = Math.abs(diff) < 0.45

        return (
          <div
            key={`${step}-${normIdx}`}
            onClick={() => {
              onChange?.(item)
              animateTo(targetVirtualIdx)
            }}
            className={cn(
              'absolute inset-x-0 top-1/2 -mt-5 flex h-10 items-center justify-center font-mono transition-colors duration-75 will-change-transform cursor-pointer',
              isCenter
                ? 'font-bold text-xl text-fg'
                : 'text-sm sm:text-base font-medium text-muted-fg/70 hover:text-fg'
            )}
            style={{
              transform: `translateY(${yPos}px) translateZ(${zPos}px) rotateX(${-angleDeg}deg) scale(${scale})`,
              opacity,
            }}
          >
            {format(item)}
          </div>
        )
      })}
    </div>
  )
}

export const DrumColumn = createInterfaceComponent<DrumColumnProps<any>>(
  {
    name: 'DrumColumn',
    category: 'form',
    description: '3D cylindrical drum wheel column with direct manipulation momentum gestures.',
    version: '1.0.0',
  },
  DrumColumnPrimitive
)
