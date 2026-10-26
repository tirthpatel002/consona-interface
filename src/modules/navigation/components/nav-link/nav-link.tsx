import React, { useRef, useEffect, useMemo, useCallback } from 'react'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { useNavigation } from '../../context/use-navigation'
import type { NavNode, PrefetchStrategy } from '../../engine/types'
import { cn } from '../../../../core/cn'

export interface NavLinkRenderProps {
  /** Whether the link's destination route is currently active */
  isActive: boolean
  /** Whether the link's destination route transition is pending or prefetching */
  isPending: boolean
  /** The currently active route identifier */
  activeId: string
  /** The current resolved route path */
  currentPath: string
}

export interface NavLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'className'> {
  /** Target route identifier (e.g. 'button') or destination URL path (e.g. '/components/button') */
  to: string | NavNode
  /** Speculative prefetching strategy: 'intent' (65ms hover/touch), 'viewport' (IntersectionObserver), 'render' (on mount), or false */
  prefetch?: PrefetchStrategy
  /** Whether to replace the browser history entry instead of pushing a new one */
  replace?: boolean
  /** Transient in-memory state payload to pass to the destination route */
  state?: any
  /** Whether active matching requires an exact path match (default: false for parent paths) */
  exact?: boolean
  /** CSS classes applied when the route is active */
  activeClassName?: string
  /** CSS classes applied when the route is in pending/prefetching state */
  pendingClassName?: string
  /** Dynamic or static CSS class name */
  className?: string | ((props: NavLinkRenderProps) => string | undefined)
  /** Dynamic render function or React child elements */
  children?: React.ReactNode | ((props: NavLinkRenderProps) => React.ReactNode)
}

function NavLinkPrimitive({
  to,
  prefetch = 'intent',
  replace = false,
  state,
  exact = false,
  activeClassName,
  pendingClassName,
  className,
  children,
  onClick,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  target,
  rel,
  ...rest
}: NavLinkProps) {
  const { navigate, activeId, currentPath, engine } = useNavigation()
  const linkRef = useRef<HTMLAnchorElement>(null)

  // Resolve target route info from engine
  const targetIdOrPath = typeof to === 'string' ? to : to.id
  const resolved = useMemo(() => {
    return engine.resolveNode(targetIdOrPath)
  }, [engine, targetIdOrPath])

  const destinationHref = resolved?.node.href || (targetIdOrPath.startsWith('/') ? targetIdOrPath : `/${targetIdOrPath}`)
  const destinationId = resolved?.node.id || targetIdOrPath

  // Calculate active matching
  const isActive = useMemo(() => {
    if (activeId === destinationId) return true
    const currentClean = currentPath.split('?')[0]?.split('#')[0] || '/'
    const destClean = destinationHref.split('?')[0]?.split('#')[0] || '/'

    if (exact || destClean === '/') {
      return currentClean === destClean
    }
    return currentClean === destClean || currentClean.startsWith(destClean.endsWith('/') ? destClean : `${destClean}/`)
  }, [activeId, destinationId, currentPath, destinationHref, exact])

  // Track prefetch status
  const prefetchStatus = engine.getPrefetchStatus(destinationId)
  const isPending = prefetchStatus === 'loading'

  // Viewport prefetching via IntersectionObserver
  useEffect(() => {
    if (prefetch !== 'viewport' || !linkRef.current || !resolved?.node) return

    const el = linkRef.current
    if (typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            engine.prefetch(resolved.node).catch(() => {})
            observer.disconnect()
          }
        })
      },
      { rootMargin: '100px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [prefetch, destinationId, engine, resolved])

  // Mount/Render prefetching
  useEffect(() => {
    if (prefetch === 'render' && resolved?.node) {
      engine.prefetch(resolved.node).catch(() => {})
    }
  }, [prefetch, destinationId, engine, resolved])

  // Intent prefetch handlers
  const handlePointerEnter = useCallback(
    (e: React.PointerEvent<HTMLAnchorElement>) => {
      onPointerEnter?.(e)
      if (prefetch === 'intent' && resolved?.node) {
        engine.prefetchOnIntent(resolved.node, 65)
      }
    },
    [onPointerEnter, prefetch, resolved, engine]
  )

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent<HTMLAnchorElement>) => {
      onPointerLeave?.(e)
      if (prefetch === 'intent' && resolved?.node) {
        engine.cancelPrefetch(resolved.node)
      }
    },
    [onPointerLeave, prefetch, resolved, engine]
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLAnchorElement>) => {
      onPointerDown?.(e)
      if (resolved?.node) {
        // Fast-path immediate prefetch on touch/down before click finishes
        engine.prefetch(resolved.node).catch(() => {})
      }
    },
    [onPointerDown, resolved, engine]
  )

  // Primary navigation click handler
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e)

      // Respect default browser behaviors: middle-click, cmd+click, ctrl+click, shift+click, external targets
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        target === '_blank' ||
        e.metaKey ||
        e.altKey ||
        e.ctrlKey ||
        e.shiftKey
      ) {
        return
      }

      e.preventDefault()
      navigate(destinationHref, { replace, state })
    },
    [onClick, target, destinationHref, replace, state, navigate]
  )

  const renderProps: NavLinkRenderProps = {
    isActive,
    isPending,
    activeId,
    currentPath,
  }

  const computedClassName = typeof className === 'function' ? className(renderProps) : className

  return (
    <a
      ref={linkRef}
      href={destinationHref}
      target={target}
      rel={rel || (target === '_blank' ? 'noopener noreferrer' : undefined)}
      aria-current={isActive ? 'page' : undefined}
      data-slot="nav-link"
      data-active={isActive ? 'true' : undefined}
      data-pending={isPending ? 'true' : undefined}
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      className={cn(
        computedClassName,
        isActive && activeClassName,
        isPending && pendingClassName
      )}
      {...rest}
    >
      {typeof children === 'function' ? children(renderProps) : children}
    </a>
  )
}

/**
 * First-class polymorphic NavLink component with built-in intent/viewport prefetching,
 * reactive active-state detection, keyboard accessibility, and zero-flicker routing.
 */
export const NavLink = createInterfaceComponent<NavLinkProps, {}>(
  {
    name: 'NavLink',
    category: 'navigation',
    description: 'Declarative navigation link with built-in intent prefetching and reactive active state.',
    version: '1.0.0',
    props: {},
    slots: {},
  },
  NavLinkPrimitive
)
