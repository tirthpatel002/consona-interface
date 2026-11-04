import React, { useContext, type ComponentType, type ReactNode } from 'react'
import { mergeProps, cn } from './cn'
import { InterfaceContext } from './context'
import { SizeProvider } from './size-context'
import { resolveSlots, mergeSlotProps } from './slot-resolver'
import type { ComponentConfig, InterfaceComponent, SlotComponents, SlotPropsMap } from './types'

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

const ResolvingNameContext = React.createContext<string | null>(null)

export function createInterfaceComponent<
  Props extends Record<string, any> = Record<string, any>,
  Slots extends Record<string, any> = Record<string, any>
>(
  config: ComponentConfig<Props, Slots>,
  RenderComponent: ComponentType<
    Props & {
      slots?: SlotComponents<Slots>
      slotProps?: SlotPropsMap<Slots>
      ref?: any
    }
  >
): InterfaceComponent<Props, Slots> {
  const Comp: any = React.forwardRef((instanceProps: any = {}, ref: any): ReactNode => {
    const iface = useContext(InterfaceContext)
    const resolvingName = useContext(ResolvingNameContext)

    if (iface && resolvingName !== config.name) {
      const Override = iface.getComponent(config.name, Comp)
      if (Override && Override !== Comp) {
        return (
          <ResolvingNameContext.Provider value={config.name}>
            {React.createElement(Override, { ...instanceProps, ref })}
          </ResolvingNameContext.Provider>
        )
      }
    }

    const mergedProps = mergeProps(config.props ?? {}, instanceProps)

    const hasSlots = Boolean(
      config.slots ||
      instanceProps.slots ||
      (config.props as any)?.slotProps ||
      instanceProps.slotProps
    )

    const { slots: _rawSlots, slotProps: _rawSlotProps, ...cleanProps } = mergedProps

    const extraProps: Record<string, any> = {}
    if (hasSlots) {
      extraProps.slots = resolveSlots(
        (config.slots ?? {}) as any,
        instanceProps.slots
      )
      extraProps.slotProps = mergeSlotProps(
        (config.props as any)?.slotProps,
        instanceProps.slotProps
      )
    }

    const semanticClass = `interface-${toKebabCase(config.name)}`
    const finalClassName =
      typeof cleanProps.className === 'function'
        ? (values: any) => cn(semanticClass, cleanProps.className(values))
        : cn(semanticClass, cleanProps.className)

    const node = React.createElement(RenderComponent, {
      'data-component': config.name,
      ...cleanProps,
      className: finalClassName,
      ...extraProps,
      ref,
    } as any)

    if (typeof cleanProps.size === 'string' && cleanProps.size.length > 0) {
      return <SizeProvider size={cleanProps.size}>{node}</SizeProvider>
    }

    return node
  })

  Comp.displayName = config.name
  Comp.config = config

  Comp.extend = (extendedConfig: Partial<ComponentConfig<Props, Slots>>) => {
    const newName = extendedConfig.name ?? `${config.name}Extended`
    return createInterfaceComponent<Props, Slots>(
      {
        ...config,
        ...extendedConfig,
        name: newName,
        props: mergeProps(config.props ?? {}, extendedConfig.props),
        slots: {
          ...config.slots,
          ...extendedConfig.slots,
        } as Partial<Slots>,
      },
      RenderComponent
    )
  }

  return Comp as InterfaceComponent<Props, Slots>
}
