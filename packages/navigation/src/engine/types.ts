/**
 * Visual badge representation for a navigation node.
 */
export type NavBadge =
  | string
  | {
      text: string
      intent?: 'primary' | 'secondary' | 'accent' | 'danger' | 'warning' | 'success' | 'outline'
    }

/**
 * Asynchronous dynamic component loader function (e.g., () => import('./my-view')).
 */
export type AsyncComponentLoader<T = any> = () => Promise<
  { default: React.ComponentType<T> } | React.ComponentType<T> | any
>

/**
 * Strategy for route prefetching.
 */
export type PrefetchStrategy = 'intent' | 'viewport' | 'render' | false

/**
 * Status of an asynchronous route prefetch operation.
 */
export type PrefetchStatus = 'idle' | 'loading' | 'loaded' | 'error'

/**
 * Individual hierarchical navigation node definition.
 */
export interface NavNode<TData = any> {
  /** Unique identifier for the node (e.g., 'overview', 'media-audioplayer') */
  id: string
  /** Human-readable title displayed in navigation menus and breadcrumbs */
  title: string
  /** Optional shortened title for compact breadcrumbs or tabs */
  shortTitle?: string
  /** Destination path or URL */
  href?: string
  /** URL path pattern for dynamic route matching (e.g. '/modules/:module/:component') */
  pattern?: string | RegExp
  /** Component icon reference or render function */
  icon?: (props: { className?: string }) => any
  /** Explanatory description displayed in hover menus or command palettes */
  description?: string
  /** Visual badge indicator */
  badge?: NavBadge
  /** Direct Component to render when this route is active */
  component?: React.ComponentType<any> | any
  /** Explicit asynchronous dynamic loader for code-splitting (e.g. () => import('./my-page')) */
  lazy?: AsyncComponentLoader<any>
  /** Optional prefetch strategy override for this specific route */
  prefetch?: PrefetchStrategy
  /** Subordinate child navigation nodes */
  children?: NavNode<TData>[]
  /** Explicit parent ID (automatically resolved by engine during indexing) */
  parentId?: string
  /** Custom arbitrary metadata attached to the node */
  data?: TData
  /** Whether this node is disabled and non-navigable */
  disabled?: boolean
  /** Whether to omit this node from breadcrumb trail rendering */
  hideInBreadcrumbs?: boolean
  /** Whether to omit this node from navigation menus */
  hideInMenu?: boolean
  /** Whether to omit this node from general navigation lists */
  hideInNav?: boolean
}

/**
 * NavTree root type.
 */
export type NavTree<TData = any> = NavNode<TData>[]

/**
 * Active breadcrumb trail step.
 */
export interface NavTrailStep<TData = any> {
  /** The navigation node */
  node: NavNode<TData>
  /** Hierarchy level index (0 = root) */
  level: number
  /** Sibling options available at the exact same level */
  siblings: NavNode<TData>[]
  /** Direct children options of this step */
  children: NavNode<TData>[]
  /** Whether this step is the leaf/current active page */
  isCurrent: boolean
}

/**
 * Navigation Options passed when calling navigate().
 */
export interface NavigationOptions<TData = any, TParams = Record<string, any>> {
  /** Dynamic URL path parameters */
  params?: TParams
  /** URL query parameters */
  query?: Record<string, string | number | boolean | undefined>
  /** Transient in-memory state/payload */
  state?: TData
  /** Whether to replace the history entry rather than push */
  replace?: boolean
  /** Custom navigation metadata (e.g., trigger source, animation hint) */
  meta?: Record<string, any>
}

/**
 * Pluggable Router Adapter interface.
 * Decouples NavigationEngine from specific router implementations.
 */
export interface NavRouterAdapter {
  /** Returns the current path or route identifier */
  getCurrentPath: () => string
  /** Pushes a new route path/ID */
  push: (pathOrId: string, state?: any) => void
  /** Replaces the current route path/ID */
  replace: (pathOrId: string, state?: any) => void
  /** Navigate back in history */
  back?: () => void
  /** Navigate forward in history */
  forward?: () => void
  /** Subscribes to external route changes, returning an unsubscribe cleanup function */
  subscribe: (onPathChange: (pathOrId: string, state?: any) => void) => () => void
}

/**
 * Reactive state snapshot managed by NavigationEngine.
 */
export interface NavigationState<TData = any> {
  /** Current active node ID */
  activeId: string
  /** Current active path string */
  currentPath: string
  /** Full resolved active node */
  activeNode: NavNode<TData> | null
  /** Resolved ancestor breadcrumb trail */
  trail: NavTrailStep<TData>[]
  /** Active dynamic path parameters */
  params: Record<string, any>
  /** Active query parameters */
  query: Record<string, string | number | boolean | undefined>
  /** In-memory transient state payload */
  state: TData | null
  /** History stack length */
  historyIndex: number
  /** Total registered nodes count */
  totalNodes: number
}

/**
 * Navigation Guard Hook signature for intercepting transitions.
 */
export type NavigationGuard<TData = any> = (
  to: NavNode<TData> | null,
  from: NavNode<TData> | null,
  options?: NavigationOptions<TData>
) => boolean | Promise<boolean> | string | void
