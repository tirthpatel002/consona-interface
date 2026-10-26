import type { NavRouterAdapter } from '../types'

/**
 * Creates a NavRouterAdapter connecting NavigationEngine to React Router (v6/v7).
 *
 * @example
 * ```tsx
 * const navigate = useNavigate()
 * const location = useLocation()
 * const adapter = useMemo(() => createReactRouterAdapter(navigate, location), [navigate, location])
 * ```
 */
export function createReactRouterAdapter(
  navigate: (to: string, options?: { replace?: boolean; state?: any }) => void,
  location: { pathname: string; search?: string; hash?: string; state?: any }
): NavRouterAdapter {
  return {
    getCurrentPath: () => {
      return location.pathname + (location.search || '') + (location.hash || '')
    },
    push: (path, state) => {
      navigate(path, { replace: false, state })
    },
    replace: (path, state) => {
      navigate(path, { replace: true, state })
    },
    subscribe: (onPathChange) => {
      const current = location.pathname + (location.search || '') + (location.hash || '')
      onPathChange?.(current, location.state)
      return () => {}
    },
  }
}

/**
 * Creates a NavRouterAdapter connecting NavigationEngine to Next.js (App Router / Pages Router).
 *
 * @example
 * ```tsx
 * const router = useRouter()
 * const pathname = usePathname()
 * const searchParams = useSearchParams()
 * const adapter = useMemo(() => createNextRouterAdapter(router, pathname, searchParams), [router, pathname, searchParams])
 * ```
 */
export function createNextRouterAdapter(
  router: { push: (url: string) => void; replace: (url: string) => void },
  pathname: string,
  searchParams?: { toString: () => string }
): NavRouterAdapter {
  return {
    getCurrentPath: () => {
      const query = searchParams ? searchParams.toString() : ''
      return pathname + (query ? `?${query}` : '')
    },
    push: (path) => {
      router.push(path)
    },
    replace: (path) => {
      router.replace(path)
    },
    subscribe: (onPathChange) => {
      const query = searchParams ? searchParams.toString() : ''
      const current = pathname + (query ? `?${query}` : '')
      onPathChange?.(current)
      return () => {}
    },
  }
}
