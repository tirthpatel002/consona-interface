// Component Factory & Slots
export { createInterfaceComponent } from './component-factory'
export {
  OverlayTrigger,
  CollectionPopover,
  useOverlayDismiss,
  useOverlayTriggerClose,
  OVERLAY_SURFACE_SELECTOR,
  registerOverlaySurfaceSelector,
  getOverlaySurfaceSelector,
} from './overlay-trigger'
export { resolveSlots, mergeSlotProps, renderSlot, RenderSlot } from './slot-resolver'
export { SizeProvider, useOpticalSize } from './size-context'
export type { OpticalSize, SizeProviderProps } from './size-context'
export type {
  ComponentConfig,
  ComponentCategory,
  InterfaceComponent,
  SlotComponents,
  SlotPropsMap,
  SlotDefinition,
  SlotRenderer,
  CompoundContextOptions,
  CompoundContextResult,
} from './types'

export {
  MemoryStorageAdapter,
  createWebStorageAdapter,
  createBrowserLocalStorageAdapter,
  createPrefixStorageAdapter,
  createSafeJSONSerializer,
} from './storage'
export type { StorageAdapter, SafeJSONSerializer } from './storage'

// Engine Core Foundation
export { BaseEngine } from './engine'
export type {
  EngineInstance,
  EngineEventListener,
  EngineStateSubscriber,
  EngineStorageBindingOptions,
} from './engine'

// Plugin System
export { definePlugin } from './plugin'
export type { InterfacePlugin } from './plugin'
export {
  matchEvent,
  collectEventListeners,
  dispatchEventListeners,
  registerEngineEventBridge,
  forwardEngineEvent,
} from './event-bus'
export type { InterfaceEventListener } from './event-bus'

// Hooks Core Primitives
export {
  useEngineState,
  useEngine,
  useControllableState,
  useCallbackRef,
} from './hooks'
export type {
  HeadlessHookReturn,
  UseControllableStateParams,
} from './hooks'

// Provider & Context Core
export { InterfaceProvider } from './provider'
export {
  InterfaceContext,
  useInterface,
  useInterfaceOptional,
  createCompoundContext,
} from './context'
export type { InterfaceConfig, InterfaceContextValue } from './context'

// Utilities
export { cn, mergeProps } from './cn'

