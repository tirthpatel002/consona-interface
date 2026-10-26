import React, { useContext, useEffect, useMemo, type ReactNode } from 'react'
import { ThemeProvider, ThemeContext, type ThemeConfig } from '../theme/theme-provider'
import {
  InterfaceContext,
  type InterfaceConfig,
  type InterfaceContextValue,
} from './context'
import {
  collectEventListeners,
  dispatchEventListeners,
  registerEngineEventBridge,
} from './event-bus'
import type { InterfacePlugin } from './plugin'

export function InterfaceProvider({
  config = {},
  theme,
  plugins = [],
  children,
}: {
  config?: InterfaceConfig
  theme?: ThemeConfig
  plugins?: InterfacePlugin[]
  children: ReactNode
}) {
  const allPlugins = useMemo(
    () => [...(config.plugins ?? []), ...plugins],
    [config.plugins, plugins]
  )

  const contextValue = useMemo<InterfaceContextValue>(() => {
    const components = new Map<string, React.ComponentType<any>>(
      Object.entries(config.components ?? {})
    )

    for (const plugin of allPlugins) {
      if (plugin.components) {
        Object.entries(plugin.components).forEach(([k, comp]) => components.set(k, comp))
      }
    }

    return {
      getComponent: (name, fallback) => (components.get(name) as any) ?? fallback,
      emit: async (event: string, payload?: any) => {
        const listeners = [
          ...collectEventListeners(config.events, event),
          ...allPlugins.flatMap((plugin) => collectEventListeners(plugin.events, event)),
        ]
        await dispatchEventListeners(listeners, payload)
      },
    }
  }, [allPlugins, config.components, config.events])

  useEffect(() => {
    return registerEngineEventBridge((event, payload) => contextValue.emit(event, payload))
  }, [contextValue])

  const wrappedContent = useMemo(() => {
    return allPlugins.reduceRight((acc, plugin) => {
      if (!plugin.Provider) return acc
      const Provider = plugin.Provider
      return (
        <Provider options={plugin.options} {...(plugin.options || {})}>
          {acc}
        </Provider>
      )
    }, children)
  }, [allPlugins, children])

  const existingTheme = useContext(ThemeContext)
  const resolvedThemeConfig = theme ?? config.theme

  const themed = existingTheme && !resolvedThemeConfig ? (
    wrappedContent
  ) : (
    <ThemeProvider {...resolvedThemeConfig}>{wrappedContent}</ThemeProvider>
  )

  return (
    <InterfaceContext.Provider value={contextValue}>
      {themed}
    </InterfaceContext.Provider>
  )
}
