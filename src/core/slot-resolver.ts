import React, { type ComponentType, type ReactNode } from 'react'
import { cn, mergeProps } from './cn'
import type { SlotComponents, SlotPropsMap, SlotRenderer } from './types'

const FORWARD_REF_TYPE = Symbol.for('react.forward_ref')
const MEMO_TYPE = Symbol.for('react.memo')
const LAZY_TYPE = Symbol.for('react.lazy')

/**
 * True for function/class components and object-shaped React types
 * (forwardRef, memo, lazy, createInterfaceComponent). Those objects must
 * never be treated as C5 variant maps — Object.values()[0] is $$typeof.
 */
function isReactComponentType(slot: unknown): slot is ComponentType<any> {
  if (typeof slot === 'function') return true
  if (typeof slot !== 'object' || slot === null || React.isValidElement(slot)) {
    return false
  }

  const type = (slot as { $$typeof?: symbol }).$$typeof
  if (type === FORWARD_REF_TYPE || type === MEMO_TYPE || type === LAZY_TYPE) {
    return true
  }

  const maybeInterface = slot as { extend?: unknown; render?: unknown; displayName?: unknown }
  return Boolean(maybeInterface.extend && maybeInterface.render)
}

export function resolveSlots<Slots extends Record<string, any>>(
  defaultSlots: Slots,
  instanceSlots?: SlotComponents<Slots>
): Slots {
  if (!instanceSlots) return defaultSlots
  const resolved = { ...defaultSlots } as any

  for (const [key, SlotComp] of Object.entries(instanceSlots)) {
    if (SlotComp !== undefined) {
      resolved[key] = SlotComp
    }
  }

  return resolved
}

export function mergeSlotProps<Slots extends Record<string, any>>(
  defaultSlotProps?: SlotPropsMap<Slots>,
  instanceSlotProps?: SlotPropsMap<Slots>
): SlotPropsMap<Slots> {
  if (!defaultSlotProps && !instanceSlotProps) return {}
  if (!defaultSlotProps) return instanceSlotProps ?? {}
  if (!instanceSlotProps) return defaultSlotProps

  const merged = { ...defaultSlotProps } as any

  for (const [key, props] of Object.entries(instanceSlotProps)) {
    merged[key] = mergeProps(merged[key] ?? {}, props as Record<string, any>)
  }

  return merged
}

/**
 * Universal Slot Renderer that resolves:
 * 1. ComponentType (e.g. `const Header = (props) => ...`)
 * 2. Render Functions (e.g. `({ isCollapsed }) => ...`)
 * 3. Variant Maps (e.g. `{ expanded: HeaderExp, collapsed: HeaderCol }`)
 * 4. Pre-instantiated React Elements
 */
export function renderSlot<TProps extends Record<string, any> = Record<string, any>>(
  slot: SlotRenderer<TProps> | Record<string, any> | undefined,
  props: Partial<TProps> = {} as any,
  options?: {
    activeVariant?: string
    defaultComponent?: ComponentType<TProps>
    _depth?: number
  }
): ReactNode {
  // Explicit `null` opts the region out. Do not fall back to defaultComponent.
  if (slot === null) return null

  const depth = options?._depth ?? 0
  if (depth > 3) {
    console.warn('[Consona Slot Resolver] Maximum slot variant recursion depth exceeded.')
    if (options?.defaultComponent) {
      return React.createElement(options.defaultComponent, props as any)
    }
    return null
  }

  if (slot === undefined) {
    if (options?.defaultComponent) {
      const DefaultComp = options.defaultComponent
      return React.createElement(DefaultComp, props as any)
    }
    return null
  }

  // 1. Pre-instantiated React element
  if (React.isValidElement(slot)) {
    const existing = ((slot.props ?? {}) as Record<string, any>)
    return React.cloneElement(slot, {
      key: slot.key !== null && slot.key !== undefined ? slot.key : undefined,
      ...existing,
      ...props,
      className: cn(existing.className, (props as any).className),
    } as any)
  }

  // 2. ComponentType — functions, forwardRef, memo, and InterfaceComponent
  if (isReactComponentType(slot)) {
    if (typeof slot === 'function') {
      const isClassOrNamedComponent = Boolean(
        (slot as any).$$typeof ||
        (slot.prototype && (slot.prototype as any).isReactComponent) ||
        (slot as any).displayName ||
        (slot as any).extend ||
        (slot.name && /^[A-Z]/.test(slot.name))
      )

      if (isClassOrNamedComponent) {
        return React.createElement(slot as ComponentType<TProps>, props as any)
      }

      try {
        const result = (slot as (nextProps: Partial<TProps>) => ReactNode)(props)
        return result !== undefined ? result : (options?.defaultComponent ? React.createElement(options.defaultComponent, props as any) : null)
      } catch (err) {
        console.error('[Consona Slot Resolver] Slot render function threw an error:', err)
        if (options?.defaultComponent) {
          return React.createElement(options.defaultComponent, props as any)
        }
        return null
      }
    }

    return React.createElement(slot as ComponentType<TProps>, props as any)
  }

  // 3. Variant maps only — never forwardRef/memo objects (Rule C5)
  if (typeof slot === 'object') {
    const variantKey = options?.activeVariant ?? 'default'
    const slotObj = slot as Record<string, any>
    const target = slotObj[variantKey] ?? slotObj.default ?? Object.values(slotObj).find(
      (value) => typeof value !== 'symbol'
    )
    if (!target) {
      if (options?.defaultComponent) {
        return React.createElement(options.defaultComponent, props as any)
      }
      return null
    }
    return renderSlot(target, props, {
      ...options,
      activeVariant: undefined,
      _depth: depth + 1,
    })
  }

  return slot as ReactNode
}

/**
 * JSX Component wrapper for slot rendering
 */
export function RenderSlot<TProps extends Record<string, any> = Record<string, any>>({
  slot,
  props,
  variant,
  defaultComponent,
  children,
}: {
  slot?: SlotRenderer<TProps> | Record<string, any>
  props?: TProps
  variant?: string
  defaultComponent?: ComponentType<TProps>
  children?: ReactNode
}): ReactNode {
  const rendered = renderSlot(slot, props ?? ({} as TProps), {
    activeVariant: variant,
    defaultComponent,
  })

  return rendered ?? children ?? null
}
