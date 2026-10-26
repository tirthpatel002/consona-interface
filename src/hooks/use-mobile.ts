import { useEffect, useState } from 'react'

const MOBILE_BREAKPOINT = 768

export function useIsMobile(breakpoint: number = MOBILE_BREAKPOINT): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < breakpoint
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    mql.addEventListener('change', onChange)
    setIsMobile(window.innerWidth < breakpoint)

    return () => mql.removeEventListener('change', onChange)
  }, [breakpoint])

  return isMobile
}
