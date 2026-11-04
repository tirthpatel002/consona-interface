import type { ComponentType, ReactNode } from 'react'

export type ComponentCategory =
  | 'form'
  | 'feedback'
  | 'navigation'
  | 'overlay'
  | 'audio'
  | 'orb'
  | 'glass'
  | 'onboarding'
  | 'media'
  | 'data'
  | 'layout'
  | 'typography'
  | 'composite'
  | 'utility'

export interface ComponentConfig<
  Props = Record<string, any>,
  Slots extends Record<string, any> = Record<string, any>
> {
  name: string
  category?: ComponentCategory
  description?: string
  version?: string
  docUrl?: string
  tags?: string[]
  props?: Partial<Props>
  slots?: Partial<Slots>
}

export type SlotRenderer<P = any> =
  | ComponentType<P>
  | ((props: P) => ReactNode)
  | ReactNode

export type SlotDefinition<P = any, Variants extends string = string> =
  | SlotRenderer<P>
  | ({ [V in Variants]?: SlotRenderer<P> } & { [key: string]: SlotRenderer<P> })

export type SlotComponents<Slots extends Record<string, any>> = {
  [K in keyof Slots]?: (
    Slots[K] extends SlotDefinition<infer P, infer V>
      ? SlotDefinition<P, V>
      : Slots[K] extends ComponentType<infer P>
        ? SlotRenderer<P> | Record<string, SlotRenderer<P>>
        : any
  ) | null
}

export type SlotPropsMap<Slots extends Record<string, any>> = {
  [K in keyof Slots]?: Slots[K] extends SlotDefinition<infer P, any>
    ? Partial<P>
    : Slots[K] extends ComponentType<infer P>
    ? Partial<P>
    : Record<string, any>
}

export interface InterfaceComponent<
  Props = Record<string, any>,
  Slots extends Record<string, any> = Record<string, any>
> {
  (
    props: Props & {
      slots?: SlotComponents<Slots>
      slotProps?: SlotPropsMap<Slots>
      ref?: any
    }
  ): ReactNode
  displayName: string
  config: ComponentConfig<Props, Slots>
  extend: (
    extension: Partial<ComponentConfig<Props, Slots>>
  ) => InterfaceComponent<Props, Slots>
  [key: string]: any
}

export interface CompoundContextOptions {
  name: string
  errorMessage?: string
}

export interface CompoundContextResult<T> {
  Context: React.Context<T | null>
  Provider: React.Provider<T | null>
  useCompoundContext: () => T
  useOptionalCompoundContext: () => T | null
}

