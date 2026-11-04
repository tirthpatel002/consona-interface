import type { NavRouterAdapter } from '../types'

export interface HistoryLikeLocation {
  pathname: string
  search?: string
  hash?: string
  state?: any
}

/**
 * Creates a NavRouterAdapter connecting NavigationEngine to React Router (v6/v7).
 *
 * Pass `listen` (e.g. from a data router / history.listen) so back/forward syncs.
 * Without `listen`, keep the engine controlled via `activeId` from `useLocation()`.
 *
 * @example
 * ```tsx
 * const navigate = useNavigate()
 * const location = useLocation()
 * const adapter = useMemo(
 *   () => createReactRouterAdapter(navigate, () => location, { listen: history.listen }),
 *   [navigate, location, history]
 * )
 * ```
 */
export function createReactRouterAdapter(
  navigate: (to: string, options?: { replace?: boolean; state?: any }) => void,
  locationOrGetter: HistoryLikeLocation | (() => HistoryLikeLocation),
  options?: {
    /** Subscribe to location changes (required for true back/forward sync) */
    listen?: (handler: (location: HistoryLikeLocation) => void) => () => void
  }
): NavRouterAdapter {
  const getLocation = () =>
    typeof locationOrGetter === 'function' ? locationOrGetter() : locationOrGetter

  const toPath = (loc: HistoryLikeLocation) =>
    loc.pathname + (loc.search || '') + (loc.hash || '')

  return {
    getCurrentPath: () => toPath(getLocation()),
    push: (path, state) => {
      navigate(path, { replace: false, state })
    },
    replace: (path, state) => {
      navigate(path, { replace: true, state })
    },
    subscribe: (onPathChange) => {
      if (options?.listen) {
        return options.listen((loc) => {
          onPathChange(toPath(loc), loc.state)
        })
      }
      // One-shot sync only — pair with controlled `activeId` from useLocation()
      const loc = getLocation()
      onPathChange(toPath(loc), loc.state)
      return () => {}
    },
  }
}

/**
 * Creates a NavRouterAdapter connecting NavigationEngine to Next.js (App Router / Pages Router).
 *
 * App Router does not expose a stable history listener. Prefer syncing via controlled
 * `activeId` / path derived from `usePathname()` + `useSearchParams()`, or pass
 * `listen` when using the Pages Router `router.events`.
 *
 * @example
 * ```tsx
 * const router = useRouter()
 * const pathname = usePathname()
 * const searchParams = useSearchParams()
 * const adapter = useMemo(
 *   () => createNextRouterAdapter(router, () => ({
 *     pathname,
 *     search: searchParams?.toString() ? `?${searchParams}` : '',
 *   })),
 *   [router, pathname, searchParams]
 * )
 * ```
 */
export function createNextRouterAdapter(
  router: {
    push: (url: string) => void
    replace: (url: string) => void
    events?: {
      on: (type: string, handler: (...args: any[]) => void) => void
      off: (type: string, handler: (...args: any[]) => void) => void
    }
  },
  pathnameOrGetter: string | (() => string) | (() => { pathname: string; search?: string }),
  searchParams?: { toString: () => string },
  options?: {
    listen?: (handler: (path: string) => void) => () => void
  }
): NavRouterAdapter {
  const getPath = () => {
    if (typeof pathnameOrGetter === 'function') {
      const value = pathnameOrGetter()
      if (typeof value === 'string') {
        const query = searchParams ? searchParams.toString() : ''
        return value + (query ? `?${query}` : '')
      }
      return value.pathname + (value.search || '')
    }
    const query = searchParams ? searchParams.toString() : ''
    return pathnameOrGetter + (query ? `?${query}` : '')
  }

  return {
    getCurrentPath: getPath,
    push: (path) => {
      router.push(path)
    },
    replace: (path) => {
      router.replace(path)
    },
    subscribe: (onPathChange) => {
      if (options?.listen) {
        return options.listen((path) => onPathChange(path))
      }

      // Pages Router: hook routeChangeComplete when events exist
      if (router.events) {
        const handler = (url: string) => onPathChange(url)
        router.events.on('routeChangeComplete', handler)
        onPathChange(getPath())
        return () => {
          router.events?.off('routeChangeComplete', handler)
        }
      }

      onPathChange(getPath())
      return () => {}
    },
  }
}
