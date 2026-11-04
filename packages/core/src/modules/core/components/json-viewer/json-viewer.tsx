import * as React from 'react'
import {
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { cn } from '../../../../core/cn'
import { createCompoundContext } from '../../../../core/context'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Badge } from '../badge'

/* ==========================================================================
   JsonViewer Slots & Context
   ========================================================================== */

export interface JsonViewerSlots {
  /** Leading search magnifying glass icon slot. */
  searchIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Copy full JSON action button slot. */
  copyButton?: React.ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement>>
  /** Json viewer tree slot */
  tree?: React.ComponentType<JsonViewerTreeProps>
}

export interface JsonViewerContextValue {
  /** Data payload to visualize. */
  data: unknown
  /** Search query string. */
  searchQuery: string
  /** Update search query. */
  setSearchQuery: (query: string) => void
  /** Matched path strings. */
  matchedPaths: string[]
  /** Active matched path index. */
  activeMatchIndex: number
  /** Active matched path string. */
  activeMatchPath: string | null
  /** Previous match trigger. */
  handlePrevMatch: () => void
  /** Next match trigger. */
  handleNextMatch: () => void
  /** Expand all nodes trigger. */
  handleExpandAll: () => void
  /** Collapse all nodes trigger. */
  handleCollapseAll: () => void
  /** Node toggle handler. */
  handleToggle: (path: string) => void
  /** Copy handler. */
  handleCopy: (text: string, pathId: string) => void
  /** Copy full JSON payload. */
  handleCopyFullJson: () => void
  /** Currently copied path. */
  copiedPath: string | null
  /** Effective node expansion state. */
  effectiveExpandedMap: Record<string, boolean>
  /** Whether search filtering is active. */
  isSearching: boolean
  /** Whether search is enabled. */
  searchable?: boolean
  /** Whether copy controls are enabled. */
  copyable?: boolean
  /** Whether toolbar controls are shown. */
  showControls?: boolean
  /** Parsed maximum container height. */
  parsedHeight?: string | number
  /** Tree container DOM ref. */
  treeContainerRef: React.RefObject<HTMLDivElement | null>
  /** Slot overrides. */
  slots?: SlotComponents<JsonViewerSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<JsonViewerSlots>
}

export const { Provider: JsonViewerProvider, useCompoundContext: useJsonViewerContext } =
  createCompoundContext<JsonViewerContextValue>('JsonViewer')

export interface JsonViewerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The data payload to visualize (Object, Array, or primitive). */
  data: unknown
  /** Initial tree expansion depth level. Default is 2. */
  initialExpandedDepth?: number
  /** Enable live search filtering by key name or scalar value. Default is true. */
  searchable?: boolean
  /** Allow copying JSON nodes and full payload to clipboard. Default is true. */
  copyable?: boolean
  /** Show top toolbar controls (search, expand/collapse all, copy). Default is true. */
  showControls?: boolean
  /** Maximum container height with internal scrolling. Default is 400. */
  maxHeight?: number | string
  /** Custom children for composite compound composition. */
  children?: React.ReactNode
  /** Slot overrides. */
  slots?: SlotComponents<JsonViewerSlots>
  /** Slot props overrides. */
  slotProps?: SlotPropsMap<JsonViewerSlots>
}

/* ==========================================================================
   Stable Slot Defaults
   ========================================================================== */

const DefaultSearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <MagnifyingGlassIcon
    className={cn(
      'pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-fg/70',
      props.className
    )}
    {...props}
  />
)

export interface JsonViewerCopyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const JsonViewerCopyButtonPrimitive = ({ className, ...props }: JsonViewerCopyButtonProps) => {
  const { copiedPath, handleCopyFullJson } = useJsonViewerContext()
  return (
    <button
      type="button"
      onClick={handleCopyFullJson}
      aria-label="Copy full JSON"
      title={copiedPath === 'full-json' ? 'Copied to clipboard' : 'Copy full JSON'}
      className={cn(
        'inline-flex items-center justify-center size-8 rounded-base border border-border/60 bg-muted/40 hover:bg-muted text-muted-fg hover:text-fg transition-colors cursor-pointer',
        className
      )}
      {...props}
    >
      {copiedPath === 'full-json' ? (
        <ClipboardDocumentCheckIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <ClipboardDocumentIcon className="size-4" />
      )}
    </button>
  )
}

export const JsonViewerCopyButton = createInterfaceComponent<JsonViewerCopyButtonProps>(
  {
    name: 'JsonViewerCopyButton',
    category: 'data',
    description: 'Copy full JSON action button control.',
    version: '1.0.0',
  },
  JsonViewerCopyButtonPrimitive
)

/* ==========================================================================
   Search & Path Matching Engine
   ========================================================================== */

interface SearchMatchInfo {
  matchedPaths: string[]
  expandedPaths: Set<string>
}

function computeSearchState(data: unknown, query: string): SearchMatchInfo {
  const q = query.trim().toLowerCase()
  if (!q) {
    return { matchedPaths: [], expandedPaths: new Set() }
  }

  const matchedPaths: string[] = []
  const expandedPaths = new Set<string>()

  function traverse(
    val: unknown,
    path: string,
    keyName: string | undefined,
    ancestorPaths: string[]
  ): boolean {
    const isObj = val !== null && typeof val === 'object'
    let isDirectMatch = false

    // Key match
    if (keyName && keyName.toLowerCase().includes(q)) {
      isDirectMatch = true
    }

    // Scalar primitive value match
    if (!isObj) {
      if (val !== undefined && val !== null && String(val).toLowerCase().includes(q)) {
        isDirectMatch = true
      }
    }

    if (isDirectMatch) {
      matchedPaths.push(path)
      ancestorPaths.forEach((p) => expandedPaths.add(p))
    }

    let hasSubtreeMatch = isDirectMatch

    if (isObj) {
      const isArr = Array.isArray(val)
      const obj = val as Record<string, unknown>
      const keys = Object.keys(obj)
      const currentAncestors = [...ancestorPaths, path]

      for (const k of keys) {
        const childVal = obj[k]
        const childPath = isArr ? `${path}[${k}]` : path === '$' ? `$.${k}` : `${path}.${k}`
        const childMatched = traverse(childVal, childPath, isArr ? undefined : k, currentAncestors)
        if (childMatched) {
          hasSubtreeMatch = true
          expandedPaths.add(path)
        }
      }
    }

    return hasSubtreeMatch
  }

  traverse(data, '$', undefined, [])
  return { matchedPaths, expandedPaths }
}

/* ==========================================================================
   Compound Subcomponents
   ========================================================================== */

export interface JsonNodeProps {
  /** Property key name if this node is an object entry. */
  keyName?: string
  /** Raw JSON data value of the current node. */
  value: unknown
  /** Dot-delimited JSONPath or key sequence for this node. */
  path: string
  /** Nesting indentation depth level. */
  depth: number
  /** Whether this node is the last entry among its siblings. */
  isLast: boolean
  /** Map of path keys to expansion booleans. */
  expandedMap: Record<string, boolean>
  /** Callback fired when collapsing or expanding this branch. */
  onToggle: (path: string) => void
  /** Active search query filter string. */
  searchQuery: string
  /** Path of the currently focused search match item. */
  activeMatchPath: string | null
  /** Whether copy-to-clipboard functionality is enabled. */
  copyable: boolean
  /** Path of the most recently copied node value. */
  copiedPath: string | null
  /** Callback fired when copying a node value to clipboard. */
  onCopy: (text: string, path: string) => void
}

export const JsonNode: React.FC<JsonNodeProps> = ({
  keyName,
  value,
  path,
  depth,
  isLast,
  expandedMap,
  onToggle,
  searchQuery,
  activeMatchPath,
  copyable,
  copiedPath,
  onCopy,
}) => {
  const isObject = value !== null && typeof value === 'object'
  const isArray = Array.isArray(value)
  const isExpanded = expandedMap[path] ?? depth <= 2

  const renderPrimitive = (val: unknown) => {
    if (val === null) return <span className="text-muted-fg/70 italic font-mono">null</span>
    if (val === undefined) return <span className="text-muted-fg/70 italic font-mono">undefined</span>
    if (typeof val === 'boolean') {
      return <span className="text-amber-600 dark:text-amber-400 font-bold font-mono">{String(val)}</span>
    }
    if (typeof val === 'number') {
      return <span className="text-sky-600 dark:text-sky-400 font-medium font-mono">{val}</span>
    }
    if (typeof val === 'string') {
      return (
        <span className="text-emerald-700 dark:text-emerald-400 font-mono">
          &quot;{val}&quot;
        </span>
      )
    }
    return <span>{String(val)}</span>
  }

  const matchesSearch = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return false
    if (keyName && keyName.toLowerCase().includes(q)) return true
    if (!isObject && value !== undefined && value !== null && String(value).toLowerCase().includes(q))
      return true
    return false
  }, [keyName, value, isObject, searchQuery])

  const isActiveMatch = activeMatchPath === path

  const handleNodeCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    const textToCopy = isObject
      ? JSON.stringify(value, null, 2)
      : typeof value === 'string'
      ? value
      : JSON.stringify(value)
    onCopy?.(textToCopy, path)
  }

  if (!isObject) {
    return (
      <div
        data-json-path={path}
        className={cn(
          'group/node flex items-center gap-1.5 py-0.5 px-1.5 rounded-atom hover:bg-muted/30 transition-all font-mono text-xs leading-relaxed min-w-max',
          matchesSearch && 'bg-primary/15 text-fg font-medium rounded-atom',
          isActiveMatch && 'ring-2 ring-primary bg-primary/25 shadow-2xs font-bold'
        )}
        style={{ paddingLeft: `${depth * 16 + 6}px` }}
      >
        {keyName !== undefined && (
          <span className="text-fg/80 font-medium select-none">
            &quot;{keyName}&quot;<span className="text-muted-fg/60">:</span>
          </span>
        )}
        <div className="flex items-center gap-1.5 min-w-0">
          {renderPrimitive(value)}
          {!isLast && <span className="text-muted-fg/50 select-none">,</span>}
        </div>

        {copyable && (
          <button
            type="button"
            onClick={handleNodeCopy}
            aria-label={`Copy value of ${keyName ?? path}`}
            title={`Copy value: ${JSON.stringify(value)}`}
            className="opacity-0 group-hover/node:opacity-100 ml-3 shrink-0 size-5 flex items-center justify-center rounded-atom bg-muted/40 hover:bg-muted text-muted-fg hover:text-fg transition-opacity cursor-pointer"
          >
            {copiedPath === path ? (
              <ClipboardDocumentCheckIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ClipboardDocumentIcon className="size-3.5" />
            )}
          </button>
        )}
      </div>
    )
  }

  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj)
  const isEmpty = keys.length === 0
  const openBracket = isArray ? '[' : '{'
  const closeBracket = isArray ? ']' : '}'

  return (
    <div className="flex flex-col font-mono text-xs leading-relaxed min-w-max">
      {/* Node Header Row */}
      <div
        data-json-path={path}
        className={cn(
          'group/node flex items-center gap-1.5 py-0.5 px-1.5 rounded-atom hover:bg-muted/30 transition-all cursor-pointer select-none',
          matchesSearch && 'bg-primary/15 text-fg font-medium rounded-atom',
          isActiveMatch && 'ring-2 ring-primary bg-primary/25 shadow-2xs font-bold'
        )}
        style={{ paddingLeft: `${depth * 16 + 6}px` }}
        onClick={() => onToggle?.(path)}
      >
        {/* Expand / Collapse Chevron */}
        <span className="size-4 shrink-0 flex items-center justify-center text-muted-fg/70">
          {!isEmpty &&
            (isExpanded ? (
              <ChevronDownIcon className="size-3.5 stroke-[2.5]" />
            ) : (
              <ChevronRightIcon className="size-3.5 stroke-[2.5]" />
            ))}
        </span>

        {/* Key Identifier */}
        {keyName !== undefined && (
          <span className="text-fg/80 font-medium">
            &quot;{keyName}&quot;<span className="text-muted-fg/60">:</span>
          </span>
        )}

        {/* Brackets & Badge indicator */}
        <span className="text-muted-fg font-bold">{openBracket}</span>
        {!isExpanded && (
          <Badge
            intent="outline"
            size="sm"
            className="text-[10px] px-1.5 py-0 border-border/60 bg-muted/20 font-mono text-muted-fg"
          >
            {isArray ? `${keys.length} items` : `${keys.length} keys`}
          </Badge>
        )}
        {!isExpanded && <span className="text-muted-fg font-bold">{closeBracket}</span>}
        {!isLast && !isExpanded && <span className="text-muted-fg/50 select-none">,</span>}

        {/* Copy Node JSON Button */}
        {copyable && (
          <button
            type="button"
            onClick={handleNodeCopy}
            aria-label={`Copy subtree of ${keyName ?? path}`}
            title="Copy subtree JSON"
            className="opacity-0 group-hover/node:opacity-100 ml-3 shrink-0 size-5 flex items-center justify-center rounded-atom bg-muted/40 hover:bg-muted text-muted-fg hover:text-fg transition-opacity cursor-pointer"
          >
            {copiedPath === path ? (
              <ClipboardDocumentCheckIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ClipboardDocumentIcon className="size-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Children Subtree */}
      {isExpanded && !isEmpty && (
        <div className="flex flex-col">
          {keys.map((k, idx) => {
            const childVal = obj[k]
            const childPath = isArray ? `${path}[${k}]` : path === '$' ? `$.${k}` : `${path}.${k}`
            const isChildLast = idx === keys.length - 1

            return (
              <JsonNode
                key={childPath}
                keyName={isArray ? undefined : k}
                value={childVal}
                path={childPath}
                depth={depth + 1}
                isLast={isChildLast}
                expandedMap={expandedMap}
                onToggle={onToggle}
                searchQuery={searchQuery}
                activeMatchPath={activeMatchPath}
                copyable={copyable}
                copiedPath={copiedPath}
                onCopy={onCopy}
              />
            )
          })}
        </div>
      )}

      {/* Closing Bracket Row */}
      {isExpanded && (
        <div
          className="flex items-center py-0.5 px-1.5 font-mono text-xs text-muted-fg font-bold select-none"
          style={{ paddingLeft: `${depth * 16 + 22}px` }}
        >
          <span>{closeBracket}</span>
          {!isLast && <span className="text-muted-fg/50 font-normal">,</span>}
        </div>
      )}
    </div>
  )
}

export interface JsonViewerToolbarSlots {
  /** Search magnifier icon slot. */
  searchIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Copy full JSON button slot. */
  copyButton?: React.ComponentType<JsonViewerCopyButtonProps>
}

export interface JsonViewerToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Slot overrides map. */
  slots?: SlotComponents<JsonViewerToolbarSlots>
  /** Property overrides passed down to injected slots. */
  slotProps?: SlotPropsMap<JsonViewerToolbarSlots>
}

const JsonViewerToolbarPrimitive = ({
  className,
  children,
  slots: directSlots,
  slotProps: directSlotProps,
  ...props
}: JsonViewerToolbarProps) => {
  const {
    searchable,
    searchQuery,
    setSearchQuery,
    matchedPaths,
    activeMatchIndex,
    isSearching,
    handlePrevMatch,
    handleNextMatch,
    handleExpandAll,
    handleCollapseAll,
    copyable,
    slots: ctxSlots,
    slotProps: ctxSlotProps,
  } = useJsonViewerContext()

  const searchIconSlot = directSlots?.searchIcon ?? ctxSlots?.searchIcon
  const searchIconProps = { ...ctxSlotProps?.searchIcon, ...directSlotProps?.searchIcon }
  const copyButtonSlot = directSlots?.copyButton ?? ctxSlots?.copyButton
  const copyButtonProps = { ...ctxSlotProps?.copyButton, ...directSlotProps?.copyButton }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        handlePrevMatch()
      } else {
        handleNextMatch()
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      handleNextMatch()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      handlePrevMatch()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setSearchQuery('')
    }
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 border-b border-border/40 bg-muted/30 px-3.5 py-2',
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          {/* Search Input & Navigation */}
          {searchable ? (
            <div className="flex items-center gap-1.5 flex-1 min-w-45 max-w-sm">
              <div className="relative flex-1">
                {renderSlot(searchIconSlot, searchIconProps, {
                  defaultComponent: DefaultSearchIcon,
                })}
                <input
                  type="text"
                  placeholder="Search keys / values..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className={cn(
                    'h-7 w-full rounded-base border border-border/40 bg-bg pl-8 text-xs text-fg placeholder:text-muted-fg/60 focus:border-primary focus:outline-hidden',
                    searchQuery ? 'pr-16' : 'pr-3'
                  )}
                />

                {/* Match Counter & Clear Button inside Input */}
                {searchQuery && (
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <span
                      className={cn(
                        'text-[10px] font-mono px-1 py-0.5 rounded-atom leading-none',
                        matchedPaths.length > 0
                          ? 'text-muted-fg bg-muted'
                          : 'text-destructive bg-destructive/10 font-medium'
                      )}
                    >
                      {matchedPaths.length > 0
                        ? `${activeMatchIndex + 1}/${matchedPaths.length}`
                        : '0'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      title="Clear search (Esc)"
                      aria-label="Clear search"
                      className="size-4 flex items-center justify-center rounded-full text-muted-fg hover:text-fg hover:bg-muted transition-colors cursor-pointer"
                    >
                      <XMarkIcon className="size-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Prev / Next Buttons */}
              {isSearching && (
                <div className="flex items-center gap-0.5 border border-border/60 rounded-base p-0.5 bg-bg shrink-0">
                  <button
                    type="button"
                    onClick={handlePrevMatch}
                    disabled={matchedPaths.length <= 1}
                    title="Previous match (Shift+Enter or ↑)"
                    aria-label="Previous match"
                    className="size-6 flex items-center justify-center rounded-atom text-muted-fg hover:text-fg hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  >
                    <ChevronUpIcon className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMatch}
                    disabled={matchedPaths.length <= 1}
                    title="Next match (Enter or ↓)"
                    aria-label="Next match"
                    className="size-6 flex items-center justify-center rounded-atom text-muted-fg hover:text-fg hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  >
                    <ChevronDownIcon className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <span className="text-xs font-medium text-muted-fg">JSON Inspector</span>
          )}

          {/* Expansion & Full Copy Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleExpandAll}
              title="Expand all nodes"
              aria-label="Expand all nodes"
              className="inline-flex items-center justify-center size-8 rounded-base border border-border/60 bg-muted/40 hover:bg-muted text-muted-fg hover:text-fg transition-colors cursor-pointer"
            >
              <ArrowsPointingOutIcon className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleCollapseAll}
              title="Collapse all nodes"
              aria-label="Collapse all nodes"
              className="inline-flex items-center justify-center size-8 rounded-base border border-border/60 bg-muted/40 hover:bg-muted text-muted-fg hover:text-fg transition-colors cursor-pointer"
            >
              <ArrowsPointingInIcon className="size-4" />
            </button>
            {copyable &&
              renderSlot(copyButtonSlot, copyButtonProps, {
                defaultComponent: JsonViewerCopyButton,
              })}
          </div>
        </>
      )}
    </div>
  )
}

export const JsonViewerToolbar = createInterfaceComponent<JsonViewerToolbarProps, JsonViewerToolbarSlots>(
  {
    name: 'JsonViewerToolbar',
    category: 'data',
    description: 'Toolbar containing search inputs, expand/collapse toggles, and copy controls.',
    version: '1.0.0',
    slots: {
      searchIcon: undefined,
      copyButton: JsonViewerCopyButton,
    },
  },
  JsonViewerToolbarPrimitive
)

export interface JsonViewerTreeSlots {
  /** Node renderer component slot. */
  node?: React.ComponentType<JsonNodeProps>
}

export interface JsonViewerTreeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Slot overrides map. */
  slots?: SlotComponents<JsonViewerTreeSlots>
  /** Property overrides passed down to injected slots. */
  slotProps?: SlotPropsMap<JsonViewerTreeSlots>
  /** Maximum scroll container height. */
  maxHeight?: number | string
  /** Whether copy to clipboard is enabled. */
  copyable?: boolean
}

const JsonViewerTreePrimitive = ({
  className,
  children,
  slots,
  slotProps,
  maxHeight: _maxHeight,
  copyable: _copyable,
  ...props
}: JsonViewerTreeProps) => {
  const {
    data,
    parsedHeight,
    effectiveExpandedMap,
    handleToggle,
    searchQuery,
    activeMatchPath,
    copyable,
    copiedPath,
    handleCopy,
    treeContainerRef,
  } = useJsonViewerContext()

  return (
    <div
      ref={treeContainerRef}
      style={{ maxHeight: parsedHeight }}
      className={cn('overflow-auto p-3.5 font-mono text-xs overscroll-contain bg-bg', className)}
      {...props}
    >
      <div className="min-w-max">
        {children ??
          renderSlot(
            slots?.node,
            {
              value: data,
              path: '$',
              depth: 0,
              isLast: true,
              expandedMap: effectiveExpandedMap,
              onToggle: handleToggle,
              searchQuery,
              activeMatchPath,
              copyable: copyable ?? true,
              copiedPath,
              onCopy: handleCopy,
              ...slotProps?.node,
            },
            { defaultComponent: JsonNode }
          )}
      </div>
    </div>
  )
}

export const JsonViewerTree = createInterfaceComponent<JsonViewerTreeProps, JsonViewerTreeSlots>(
  {
    name: 'JsonViewerTree',
    category: 'data',
    description: 'Scrollable JSON syntax tree renderer.',
    version: '1.0.0',
    slots:{
      node: JsonNode
    }
  },
  JsonViewerTreePrimitive
)

/* ==========================================================================
   JsonViewer Root Primitive
   ========================================================================== */

const JsonViewerPrimitive = ({
  data,
  initialExpandedDepth = 2,
  searchable = true,
  copyable = true,
  showControls = true,
  maxHeight = 400,
  slots = {},
  slotProps = {},
  className,
  children,
  ...props
}: JsonViewerProps) => {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [userExpandedMap, setUserExpandedMap] = React.useState<Record<string, boolean>>({})
  const [searchOverrideMap, setSearchOverrideMap] = React.useState<Record<string, boolean>>({})
  const [activeMatchIndex, setActiveMatchIndex] = React.useState<number>(0)
  const [copiedPath, setCopiedPath] = React.useState<string | null>(null)

  const treeContainerRef = React.useRef<HTMLDivElement | null>(null)

  // Compute search matches and auto-expanded paths
  const { matchedPaths, expandedPaths } = React.useMemo(
    () => computeSearchState(data, searchQuery),
    [data, searchQuery]
  )

  const isSearching = searchQuery.trim().length > 0

  React.useEffect(() => {
    setActiveMatchIndex(0)
    if (isSearching) {
      const nextMap: Record<string, boolean> = {}
      expandedPaths.forEach((p) => {
        nextMap[p] = true
      })
      setSearchOverrideMap(nextMap)
    } else {
      setSearchOverrideMap({})
    }
  }, [searchQuery, expandedPaths, isSearching])

  const activeMatchPath = isSearching && matchedPaths.length > 0 ? matchedPaths[activeMatchIndex] || null : null

  React.useEffect(() => {
    if (!activeMatchPath || !treeContainerRef.current) return
    const el = treeContainerRef.current.querySelector(`[data-json-path="${CSS.escape(activeMatchPath)}"]`)
    if (el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [activeMatchPath])

  const effectiveExpandedMap = React.useMemo(() => {
    if (isSearching) {
      return { ...searchOverrideMap, ...userExpandedMap }
    }
    return userExpandedMap
  }, [isSearching, searchOverrideMap, userExpandedMap])

  const handleToggle = (path: string) => {
    setUserExpandedMap((prev) => {
      const current = prev[path] ?? false
      return { ...prev, [path]: !current }
    })
  }

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {}
    function markAll(val: unknown, currentPath: string) {
      if (val !== null && typeof val === 'object') {
        next[currentPath] = true
        const isArr = Array.isArray(val)
        const obj = val as Record<string, unknown>
        Object.keys(obj).forEach((k) => {
          const nextPath = isArr ? `${currentPath}[${k}]` : currentPath === '$' ? `$.${k}` : `${currentPath}.${k}`
          markAll(obj[k], nextPath)
        })
      }
    }
    markAll(data, '$')
    if (isSearching) {
      setSearchOverrideMap(next)
    } else {
      setUserExpandedMap(next)
    }
  }

  const handleCollapseAll = () => {
    const next: Record<string, boolean> = {}
    function markAll(val: unknown, currentPath: string) {
      if (val !== null && typeof val === 'object') {
        next[currentPath] = false
        const isArr = Array.isArray(val)
        const obj = val as Record<string, unknown>
        Object.keys(obj).forEach((k) => {
          const nextPath = isArr ? `${currentPath}[${k}]` : currentPath === '$' ? `$.${k}` : `${currentPath}.${k}`
          markAll(obj[k], nextPath)
        })
      }
    }
    markAll(data, '$')
    if (isSearching) {
      setSearchOverrideMap(next)
    } else {
      setUserExpandedMap(next)
    }
  }

  const handlePrevMatch = () => {
    if (matchedPaths.length === 0) return
    setActiveMatchIndex((prev) => (prev - 1 + matchedPaths.length) % matchedPaths.length)
  }

  const handleNextMatch = () => {
    if (matchedPaths.length === 0) return
    setActiveMatchIndex((prev) => (prev + 1) % matchedPaths.length)
  }

  const handleCopy = (text: string, pathId: string) => {
    navigator.clipboard?.writeText(text)
    setCopiedPath(pathId)
    setTimeout(() => setCopiedPath(null), 2000)
  }

  const handleCopyFullJson = () => {
    const formatted = JSON.stringify(data, null, 2)
    handleCopy(formatted, 'full-json')
  }

  const parsedHeight = typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight

  const contextValue = React.useMemo<JsonViewerContextValue>(
    () => ({
      data,
      searchQuery,
      setSearchQuery,
      matchedPaths,
      activeMatchIndex,
      activeMatchPath,
      handlePrevMatch,
      handleNextMatch,
      handleExpandAll,
      handleCollapseAll,
      handleToggle,
      handleCopy,
      handleCopyFullJson,
      copiedPath,
      effectiveExpandedMap,
      isSearching,
      searchable,
      copyable,
      showControls,
      parsedHeight,
      treeContainerRef,
      slots,
      slotProps,
    }),
    [
      data,
      searchQuery,
      matchedPaths,
      activeMatchIndex,
      activeMatchPath,
      copiedPath,
      effectiveExpandedMap,
      isSearching,
      searchable,
      copyable,
      showControls,
      parsedHeight,
      slots,
      slotProps,
    ]
  )

  return (
    <JsonViewerProvider value={contextValue}>
      <div
        data-slot="json-viewer"
        className={cn(
          'flex flex-col rounded-macro border border-border/50 bg-bg overflow-hidden shadow-xs',
          className
        )}
        {...props}
      >
        {children != null ? (
          children
        ) : (
          <>
            {showControls && <JsonViewerToolbar />}
            {renderSlot(slots?.tree, slotProps?.tree, { defaultComponent: JsonViewerTree })}
          </>
        )}
      </div>
    </JsonViewerProvider>
  )
}

/* ==========================================================================
   Main Component Factory
   ========================================================================== */

export const JsonViewer = createInterfaceComponent<JsonViewerProps, JsonViewerSlots>(
  {
    name: 'JsonViewer',
    category: 'data',
    description:
      'Collapsible syntax-colored JSON tree visualizer with key filtering, depth levels, search auto-expansion and navigation, and clipboard copy controls.',
    version: '1.0.0',
    props: {
      initialExpandedDepth: 2,
      searchable: true,
      copyable: true,
      showControls: true,
      maxHeight: 400,
    },
    slots: {
      searchIcon: DefaultSearchIcon,
      copyButton: JsonViewerCopyButton,
      tree: JsonViewerTree
    },
  },
  JsonViewerPrimitive
)

JsonViewer.Toolbar = JsonViewerToolbar
JsonViewer.Tree = JsonViewerTree
JsonViewer.Copy = JsonViewerCopyButton
