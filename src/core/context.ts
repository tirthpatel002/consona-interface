import { createContext, useContext, type ComponentType } from 'react'
import type { ThemeConfig } from '../theme/theme-provider'
import type { InterfaceEventListener } from './event-bus'
import type { InterfacePlugin } from './plugin'

export interface InterfaceConfig {
  theme?: ThemeConfig
  components?: Record<string, ComponentType<any>>
  plugins?: InterfacePlugin[]
  events?: Record<string, InterfaceEventListener>
}

export interface InterfaceContextValue {
  getComponent: <T extends ComponentType<any>>(name: string, fallback: T) => T
  emit: (event: string, payload?: any) => Promise<void>
}

export const InterfaceContext = createContext<InterfaceContextValue | null>(null)

export const useInterface = () => {
  const ctx = useContext(InterfaceContext)
  if (!ctx) throw new Error('useInterface must be used within an <InterfaceProvider>')
  return ctx
}

export const useInterfaceOptional = () => useContext(InterfaceContext)

/**
 * Factory for creating fail-closed Compound Component Contexts with uniform error reporting.
 * (Enforces Rules C6 & C8).
 */
export function createCompoundContext<T>(
  options: string | { name: string; errorMessage?: string }
) {
  const opts = typeof options === 'string' ? { name: options } : options
  const displayName = `${opts.name}Context`
  const Context = createContext<T | null>(null)
  Context.displayName = displayName

  const useCompoundContext = (): T => {
    const value = useContext(Context)
    if (value === null || value === undefined) {
      const msg =
        opts.errorMessage ||
        `<${opts.name}.*> compound subcomponents must be rendered within a <${opts.name}> root component.`
      throw new Error(`[Consona Interface Architecture] ${msg}`)
    }
    return value
  }

  const useOptionalCompoundContext = (): T | null => {
    return useContext(Context)
  }

  return {
    Context,
    Provider: Context.Provider,
    useCompoundContext,
    useOptionalCompoundContext,
  }
}
