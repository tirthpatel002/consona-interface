import React, {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { Button as RACButton } from 'react-aria-components/Button'
import type { Key } from '@react-types/shared'
import type {
  TreeItemContentProps as RACTreeItemContentProps,
  TreeItemContentRenderProps,
  TreeItemProps as RACTreeItemProps,
  TreeProps as RACTreeProps,
} from 'react-aria-components/Tree'
import {
  Tree as TreePrimitive,
  TreeItem as TreeItemPrimitive,
  TreeItemContent,
} from 'react-aria-components/Tree'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { Checkbox, CheckboxField } from '../checkbox'

const TREE_OPEN_MS = 200
const TREE_CLOSE_MS = 180
const TREE_EASE = 'cubic-bezier(0.2, 0, 0, 1)'

type TreeAnimContextValue = {
  /** Immediate expand state for chevron (updates before unmount). */
  uiExpanded: Set<Key>
}

const TreeAnimContext = createContext<TreeAnimContextValue | null>(null)

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function toKeySet(keys: Iterable<Key> | 'all' | undefined | null): Set<Key> {
  if (!keys || keys === 'all') return new Set()
  return keys instanceof Set ? new Set(keys) : new Set(keys)
}

function collectDescendantEls(root: HTMLElement, parentId: string): HTMLElement[] {
  const items = [
    ...root.querySelectorAll<HTMLElement>('[data-slot="tree-item"][data-tree-id]'),
  ]
  const parentIdx = items.findIndex((el) => el.getAttribute('data-tree-id') === parentId)
  if (parentIdx < 0) return []

  const parentLevel = Number(
    items[parentIdx]!.getAttribute('data-level') ||
      items[parentIdx]!.getAttribute('aria-level') ||
      1
  )
  const out: HTMLElement[] = []
  for (let i = parentIdx + 1; i < items.length; i++) {
    const level = Number(
      items[i]!.getAttribute('data-level') || items[i]!.getAttribute('aria-level') || 1
    )
    if (level <= parentLevel) break
    out.push(items[i]!)
  }
  return out
}

function clearRowAnimStyles(el: HTMLElement) {
  el.style.height = ''
  el.style.opacity = ''
  el.style.overflow = ''
  el.style.marginTop = ''
  el.style.marginBottom = ''
  el.style.paddingTop = ''
  el.style.paddingBottom = ''
  el.style.display = ''
}

/**
 * Collapse without the end hitch:
 * 1. Snapshot descendants into a fixed overlay (visual clip)
 * 2. Reserve their space as marginBottom on the folder row
 * 3. Hide live rows — caller unmounts React *now* (freeze covered by overlay)
 * 4. Animate overlay height + folder margin to 0 together
 *
 * Root cause of the laggy end: per-row height→0 still leaves flex `gap`, then
 * React unmount deletes that leftover space after a main-thread pause → freeze + snap.
 */
function startCollapseBlock(
  root: HTMLElement,
  parentId: string,
  duration: number
): Promise<void> | null {
  const folder = root.querySelector<HTMLElement>(
    `[data-slot="tree-item"][data-tree-id="${CSS.escape(parentId)}"]`
  )
  const targets = collectDescendantEls(root, parentId)
  if (!folder || targets.length === 0) return null

  if (prefersReducedMotion()) return Promise.resolve()

  const first = targets[0]!
  const last = targets[targets.length - 1]!
  const firstRect = first.getBoundingClientRect()
  const lastRect = last.getBoundingClientRect()
  const folderRect = folder.getBoundingClientRect()
  const total = Math.max(0, lastRect.bottom - folderRect.bottom)
  const visualHeight = Math.max(0, lastRect.bottom - firstRect.top)
  const treeEl = root.querySelector<HTMLElement>('[data-slot="tree"]')
  const gap = treeEl ? getComputedStyle(treeEl).rowGap || '0px' : '0px'

  const overlay = document.createElement('div')
  overlay.setAttribute('data-slot', 'tree-collapse-overlay')
  overlay.style.cssText = [
    'position:fixed',
    `top:${firstRect.top}px`,
    `left:${firstRect.left}px`,
    `width:${firstRect.width}px`,
    `height:${visualHeight}px`,
    'overflow:hidden',
    'z-index:2147483646',
    'pointer-events:none',
  ].join(';')

  const stack = document.createElement('div')
  stack.style.cssText = `display:flex;flex-direction:column;gap:${gap}`
  for (const el of targets) {
    const clone = el.cloneNode(true) as HTMLElement
    clone.removeAttribute('id')
    clone.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'))
    stack.appendChild(clone)
  }
  overlay.appendChild(stack)
  document.body.appendChild(overlay)

  // Reserve in-flow space, pull live rows out of layout (React will unmount next).
  folder.style.marginBottom = `${total}px`
  for (const el of targets) {
    el.style.display = 'none'
  }

  if (total < 0.5 && visualHeight < 0.5) {
    overlay.remove()
    folder.style.marginBottom = ''
    return Promise.resolve()
  }

  const cleanup = () => {
    overlay.remove()
    // Folder node may be gone if tree unmounted; guard.
    if (folder.isConnected) folder.style.marginBottom = ''
  }

  return Promise.all([
    overlay.animate(
      [
        { height: `${visualHeight}px` },
        { height: '0px' },
      ],
      { duration, easing: TREE_EASE, fill: 'forwards' }
    ).finished,
    folder.animate(
      [{ marginBottom: `${total}px` }, { marginBottom: '0px' }],
      { duration, easing: TREE_EASE, fill: 'forwards' }
    ).finished,
  ]).then(cleanup, cleanup)
}

/** Expand: per-row height open (measure natural size first). */
function animateOpenRow(el: HTMLElement, duration: number): Promise<void> {
  if (prefersReducedMotion()) {
    clearRowAnimStyles(el)
    return Promise.resolve()
  }

  clearRowAnimStyles(el)
  const fromHeight = el.getBoundingClientRect().height
  if (fromHeight < 0.5) return Promise.resolve()

  el.style.overflow = 'hidden'
  el.style.height = '0px'
  el.style.opacity = '0'
  void el.offsetHeight

  const anim = el.animate(
    [
      { height: '0px', opacity: 0 },
      { height: `${fromHeight}px`, opacity: 1 },
    ],
    { duration, easing: TREE_EASE, fill: 'forwards' }
  )

  return anim.finished
    .then(() => {
      try {
        anim.commitStyles()
      } catch {
        /* ignore */
      }
      anim.cancel()
      clearRowAnimStyles(el)
    })
    .catch(() => {
      /* cancelled */
    })
}

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (!ref) return
  if (typeof ref === 'function') ref(value)
  else (ref as React.MutableRefObject<T | null>).current = value
}

/* ==========================================================================
   Tree Root
   ========================================================================== */

export interface TreeSlots {}

export interface TreeProps<T extends object = object>
  extends Omit<RACTreeProps<T>, 'className' | 'slots' | 'slotProps' | 'children'> {
  className?: string
  slots?: SlotComponents<TreeSlots>
  slotProps?: SlotPropsMap<TreeSlots>
  children?: ReactNode | ((item: T) => ReactNode)
}

const TreePrimitiveWrapper = ({
  className,
  expandedKeys: expandedKeysProp,
  defaultExpandedKeys,
  onExpandedChange,
  ref: _forwardedRef,
  ...props
}: TreeProps<any> & { ref?: React.Ref<any> }) => {
  const isControlled = expandedKeysProp !== undefined
  const [uncontrolledKeys, setUncontrolledKeys] = useState<Set<Key>>(() =>
    toKeySet(defaultExpandedKeys as Iterable<Key> | undefined)
  )
  const committedKeys = isControlled
    ? toKeySet(expandedKeysProp as Iterable<Key>)
    : uncontrolledKeys

  // Keys that keep children mounted (delayed on collapse).
  const [mountedKeys, setMountedKeys] = useState<Set<Key>>(() => new Set(committedKeys))
  // Keys that drive chevron / UI (update immediately).
  const [uiExpanded, setUiExpanded] = useState<Set<Key>>(() => new Set(committedKeys))

  const treeRef = useRef<HTMLDivElement | null>(null)
  const animating = useRef(false)
  const pendingOpen = useRef<Key[]>([])

  // External / controlled sync when not mid-animation.
  useEffect(() => {
    if (animating.current) return
    let same = committedKeys.size === mountedKeys.size
    if (same) {
      for (const key of committedKeys) {
        if (!mountedKeys.has(key)) {
          same = false
          break
        }
      }
    }
    if (!same) {
      setMountedKeys(new Set(committedKeys))
      setUiExpanded(new Set(committedKeys))
    }
  }, [committedKeys, mountedKeys])

  const commitMounted = useCallback(
    (next: Set<Key>) => {
      setMountedKeys(new Set(next))
      setUiExpanded(new Set(next))
      if (!isControlled) setUncontrolledKeys(new Set(next))
      onExpandedChange?.(new Set(next))
    },
    [isControlled, onExpandedChange]
  )

  // After expand mounts new rows, height-animate them open.
  useLayoutEffect(() => {
    const toOpen = pendingOpen.current
    if (toOpen.length === 0) return
    pendingOpen.current = []

    const root = treeRef.current
    if (!root || prefersReducedMotion()) return

    const targets: HTMLElement[] = []
    for (const key of toOpen) {
      targets.push(...collectDescendantEls(root, String(key)))
    }
    if (targets.length === 0) return

    animating.current = true
    void Promise.all(targets.map((el) => animateOpenRow(el, TREE_OPEN_MS))).finally(() => {
      animating.current = false
    })
  }, [mountedKeys])

  const handleExpandedChange = useCallback(
    (nextIterable: Set<Key> | 'all') => {
      if (animating.current) return

      const next = toKeySet(nextIterable === 'all' ? mountedKeys : nextIterable)
      const prev = mountedKeys

      const removed: Key[] = []
      const added: Key[] = []
      for (const key of prev) if (!next.has(key)) removed.push(key)
      for (const key of next) if (!prev.has(key)) added.push(key)

      // Expand: mount immediately, then layout-effect animates rows.
      if (removed.length === 0) {
        if (added.length > 0) pendingOpen.current = added
        commitMounted(next)
        return
      }

      // Collapse: snapshot → overlay + reserved margin, unmount immediately
      // (React hitch is covered), then ease margin/overlay to 0.
      if (prefersReducedMotion()) {
        commitMounted(next)
        return
      }

      const root = treeRef.current
      if (!root) {
        commitMounted(next)
        return
      }

      const runs = removed
        .map((key) => startCollapseBlock(root, String(key), TREE_CLOSE_MS))
        .filter((p): p is Promise<void> => p != null)

      if (runs.length === 0) {
        commitMounted(next)
        return
      }

      animating.current = true
      // Single React commit — overlay already paints over the hitch.
      commitMounted(next)
      void Promise.all(runs).finally(() => {
        animating.current = false
      })
    },
    [mountedKeys, commitMounted]
  )

  const animCtx = useMemo(() => ({ uiExpanded }), [uiExpanded])

  return (
    <TreeAnimContext.Provider value={animCtx}>
      <div ref={treeRef} data-slot="tree-shell" className="consona-tree-shell">
        <TreePrimitive
          data-slot="tree"
          className={cn(
            'consona-tree flex cursor-default flex-col gap-y-0.5 overflow-auto outline-hidden forced-color-adjust-none',
            '[--tree-active-bg:var(--color-primary-subtle)] [--tree-active-fg:var(--color-primary-subtle-fg)]',
            className
          )}
          expandedKeys={mountedKeys}
          onExpandedChange={handleExpandedChange}
          {...props}
        />
      </div>
    </TreeAnimContext.Provider>
  )
}

export const Tree = createInterfaceComponent<TreeProps<any>, TreeSlots>(
  {
    name: 'Tree',
    category: 'data',
    description:
      'Hierarchical tree view with animated expand/collapse, branch lines, and multi-selection.',
    version: '1.0.0',
    slots: {},
  },
  TreePrimitiveWrapper as any
)

/* ==========================================================================
   Tree Item
   ========================================================================== */

export interface TreeItemSlots {}

export interface TreeItemProps<T extends object = object>
  extends Omit<RACTreeItemProps<T>, 'className' | 'slots' | 'slotProps'> {
  className?: string
  slots?: SlotComponents<TreeItemSlots>
  slotProps?: SlotPropsMap<TreeItemSlots>
}

const TreeItemPrimitiveWrapper = ({
  className,
  id,
  ref: forwardedRef,
  ...props
}: TreeItemProps<any> & { ref?: React.Ref<any> }) => {
  const itemRef = useRef<HTMLDivElement | null>(null)

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      itemRef.current = node
      assignRef(forwardedRef, node)
    },
    [forwardedRef]
  )

  return (
    <TreeItemPrimitive
      ref={setRefs}
      id={id}
      data-slot="tree-item"
      data-tree-id={id != null ? String(id) : undefined}
      className={cn(
        'consona-tree-item shrink-0 rounded-base px-2 py-1.5 pe-2',
        'group/tree-item relative flex select-none focus:outline-hidden',
        'transition-[background-color,color,box-shadow] duration-200 ease-out',
        'hover:bg-muted/60',
        'focus:bg-(--tree-active-bg) focus:text-(--tree-active-fg) focus:**:[.text-muted-fg]:text-(--tree-active-fg)',
        'selected:bg-(--tree-active-bg) selected:text-(--tree-active-fg)',
        '**:data-[slot=avatar]:*:size-6 **:data-[slot=avatar]:size-6 sm:**:data-[slot=avatar]:*:size-5 sm:**:data-[slot=avatar]:size-5',
        '**:[svg]:size-5 **:[svg]:shrink-0 sm:**:[svg]:size-4',
        '**:[svg:not([data-slot=check-indicator]):not([data-slot=chevron])]:me-1',
        'disabled:opacity-50',
        'cursor-pointer',
        className
      )}
      {...props}
    />
  )
}

export const TreeItem = createInterfaceComponent<TreeItemProps<any>, TreeItemSlots>(
  {
    name: 'TreeItem',
    category: 'data',
    description: 'Individual node entry in a hierarchical Tree structure.',
    version: '1.0.0',
    slots: {},
  },
  TreeItemPrimitiveWrapper as any
)

/* ==========================================================================
   Tree Content
   ========================================================================== */

export interface TreeContentSlots {
  dragButton?: React.ComponentType<Record<string, unknown>>
  selectionCheckbox?: React.ComponentType<Record<string, unknown>>
  indicator?: React.ComponentType<TreeIndicatorProps>
}

export interface TreeContentProps extends Omit<RACTreeItemContentProps, 'children'> {
  className?: string
  slots?: SlotComponents<TreeContentSlots>
  slotProps?: SlotPropsMap<TreeContentSlots>
  children?: ReactNode | ((values: TreeItemContentRenderProps) => ReactNode)
}

const TreeContentDefaultDragButton = (props: any) => (
  <RACButton className="sr-only" slot="drag" {...props} />
)
const TreeContentDefaultCheckbox = (props: any) => <Checkbox className="col-span-1" {...props} />
const TreeContentDefaultIndicator = (props: TreeIndicatorProps) => <TreeIndicator {...props} />

const TreeContentPrimitiveWrapper = ({
  className,
  children,
  slots = {},
  slotProps = {},
  ...props
}: TreeContentProps) => {
  return (
    <TreeItemContent {...props}>
      {(values) => (
        <div
          data-slot="tree-content"
          className={cn(
            'relative flex w-full min-w-0 items-center gap-x-1 truncate text-sm/6',
            className
          )}
        >
          {values.allowsDragging &&
            renderSlot(slots.dragButton, slotProps.dragButton, {
              defaultComponent: TreeContentDefaultDragButton,
            })}
          {values.selectionMode === 'multiple' && values.selectionBehavior === 'toggle' && (
            <CheckboxField className="gap-x-0" slot="selection">
              {renderSlot(slots.selectionCheckbox, slotProps.selectionCheckbox, {
                defaultComponent: TreeContentDefaultCheckbox,
              })}
            </CheckboxField>
          )}
          <div
            data-slot="tree-guides"
            className={cn(
              'relative w-[calc(calc(var(--tree-item-level)-1)*(--spacing(5)))] shrink-0',
              'before:absolute before:inset-0 before:-ms-1 before:origin-top before:bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(var(--tree-item-level)-1px),var(--border)_calc(var(--tree-item-level)-1px),var(--border)_calc(var(--tree-item-level)))]'
            )}
          />
          {values.hasChildItems ? (
            renderSlot(
              slots.indicator,
              {
                values: {
                  isDisabled: values.isDisabled,
                  isExpanded: values.isExpanded,
                  id: values.id,
                },
                ...slotProps.indicator,
              },
              { defaultComponent: TreeContentDefaultIndicator }
            )
          ) : (
            <span aria-hidden className="block w-5 shrink-0" />
          )}
          {typeof children === 'function' ? children(values) : children}
        </div>
      )}
    </TreeItemContent>
  )
}

export const TreeContent = createInterfaceComponent<TreeContentProps, TreeContentSlots>(
  {
    name: 'TreeContent',
    category: 'data',
    description:
      'Internal content layout for TreeItem managing indentation guides, chevrons, and labels.',
    version: '1.0.0',
    slots: {
      dragButton: TreeContentDefaultDragButton,
      selectionCheckbox: TreeContentDefaultCheckbox,
      indicator: TreeContentDefaultIndicator,
    },
  },
  TreeContentPrimitiveWrapper
)

/* ==========================================================================
   Tree Indicator
   ========================================================================== */

export interface TreeIndicatorSlots {
  chevron?: React.ComponentType<React.SVGProps<SVGSVGElement> & { isExpanded?: boolean }>
}

export interface TreeIndicatorProps {
  values: Pick<TreeItemContentRenderProps, 'isDisabled' | 'isExpanded'> & { id?: Key }
  className?: string
  slots?: SlotComponents<TreeIndicatorSlots>
  slotProps?: SlotPropsMap<TreeIndicatorSlots>
  children?: ReactNode
}

const TreeIndicatorDefaultChevron = ({ isExpanded, className, ...props }: any) => (
  <ChevronRightIcon
    data-slot="chevron"
    data-expanded={isExpanded ? 'true' : 'false'}
    className={cn('consona-tree-chevron size-5 sm:size-4', className)}
    {...props}
  />
)

const TreeIndicatorPrimitiveWrapper = ({
  values,
  className,
  children,
  slots = {},
  slotProps = {},
}: TreeIndicatorProps) => {
  const anim = useContext(TreeAnimContext)
  // Prefer optimistic UI expand so chevron flips immediately on collapse.
  const isExpanded =
    values.id != null && anim ? anim.uiExpanded.has(values.id) : values.isExpanded

  return (
    <RACButton
      slot="chevron"
      data-slot="tree-indicator"
      data-expanded={isExpanded ? 'true' : 'false'}
      isDisabled={values.isDisabled}
      className={cn(
        'shrink-0 content-center text-muted-fg hover:text-fg cursor-pointer p-0.5 rounded-atom',
        'transition-[color,background-color,transform] duration-150 ease-out',
        'hover:bg-muted/70 active:scale-90',
        isExpanded && 'text-fg',
        className
      )}
    >
      {children != null
        ? children
        : renderSlot(
            slots.chevron,
            { isExpanded, ...slotProps.chevron },
            { defaultComponent: TreeIndicatorDefaultChevron }
          )}
    </RACButton>
  )
}

export const TreeIndicator = createInterfaceComponent<TreeIndicatorProps, TreeIndicatorSlots>(
  {
    name: 'TreeIndicator',
    category: 'data',
    description: 'Expand/collapse chevron button indicator for expandable Tree nodes.',
    version: '1.0.0',
    slots: {
      chevron: TreeIndicatorDefaultChevron,
    },
  },
  TreeIndicatorPrimitiveWrapper
)

/* ==========================================================================
   Compound Family Namespace Attachments
   ========================================================================== */

Tree.Item = TreeItem
Tree.Content = TreeContent
Tree.Indicator = TreeIndicator

export const { Context: TreeContext, useCompoundContext: useTreeContext } =
  createCompoundContext<any>('Tree')
