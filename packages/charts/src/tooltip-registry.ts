import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react'

export type TooltipAnchor = 'top' | 'bottom' | 'left' | 'right' | 'center'

export interface TooltipState {
  /** Whether the tooltip is currently visible */
  isOpen: boolean
  /** Active React node content of the tooltip card */
  content: React.ReactNode | null
  /** X coordinate in pixels relative to the chart canvas */
  x: number
  /** Y coordinate in pixels relative to the chart canvas */
  y: number
  /** Target anchor alignment */
  anchor: TooltipAnchor
  /** Raw datum or event payload associated with the active item */
  datum?: any
  /** Whether the pointer/cursor is currently within the chart canvas boundary */
  isHoveringCanvas: boolean
  /** Whether tooltip stays available and mounted while cursor is anywhere in canvas */
  persistInCanvas: boolean
  /** Whether tooltip dynamically tracks cursor movement within canvas */
  followCursor: boolean
  /** Timestamp of the last state change */
  lastUpdated: number
}

export interface ShowTooltipOptions {
  event?: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent | any
  position?: [number, number]
  anchor?: TooltipAnchor | string
  datum?: any
  persistInCanvas?: boolean
  followCursor?: boolean
}

export interface TooltipStoreOptions {
  persistInCanvas?: boolean
  followCursor?: boolean
  hideDelayMs?: number
}

export interface TooltipStore {
  getState: () => TooltipState
  subscribe: (listener: (state: TooltipState) => void) => () => void
  showTooltip: (content: React.ReactNode, options?: ShowTooltipOptions) => void
  showTooltipFromEvent: (content: React.ReactNode, event: any, options?: ShowTooltipOptions) => void
  showTooltipAt: (content: React.ReactNode, position: [number, number], anchor?: string, datum?: any) => void
  hideTooltip: (immediate?: boolean, delayMs?: number) => void
  updatePosition: (x: number, y: number) => void
  onCanvasPointerEnter: (event: React.PointerEvent | React.MouseEvent) => void
  onCanvasPointerMove: (event: React.PointerEvent | React.MouseEvent) => void
  onCanvasPointerLeave: (event?: React.PointerEvent | React.MouseEvent) => void
  setCanvasRef: (element: HTMLElement | null) => void
  setOptions: (options: TooltipStoreOptions) => void
  destroy: () => void
}

/**
 * Creates a high-performance, non-flickering tooltip store instance.
 * Manages continuous canvas presence and prevents unmount/remount cycles during item transitions.
 */
export function createTooltipStore(initialOptions: TooltipStoreOptions = {}): TooltipStore {
  let state: TooltipState = {
    isOpen: false,
    content: null,
    x: 0,
    y: 0,
    anchor: 'top',
    datum: undefined,
    isHoveringCanvas: false,
    persistInCanvas: initialOptions.persistInCanvas ?? true,
    followCursor: initialOptions.followCursor ?? true,
    lastUpdated: Date.now(),
  }

  let canvasElement: HTMLElement | null = null
  let hideTimer: ReturnType<typeof setTimeout> | null = null
  const listeners = new Set<(s: TooltipState) => void>()

  const notify = () => {
    state = { ...state, lastUpdated: Date.now() }
    listeners.forEach((listener) => listener(state))
  }

  const cancelHide = () => {
    if (hideTimer !== null) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
  }

  const getCanvasCoords = (event: any): { x: number; y: number } => {
    if (!event) return { x: state.x, y: state.y }
    const target = canvasElement || (event.currentTarget as HTMLElement) || (event.target as HTMLElement)
    if (!target || typeof target.getBoundingClientRect !== 'function') {
      return { x: event.clientX || 0, y: event.clientY || 0 }
    }
    const rect = target.getBoundingClientRect()
    const client = 'touches' in event && event.touches && event.touches[0] ? event.touches[0] : event
    const clientX = client.clientX ?? (rect.left + rect.width / 2)
    const clientY = client.clientY ?? (rect.top + rect.height / 2)
    const scaleX = target.offsetWidth && rect.width ? target.offsetWidth / rect.width : 1
    const scaleY = target.offsetHeight && rect.height ? target.offsetHeight / rect.height : 1

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  const showTooltip = (content: React.ReactNode, options: ShowTooltipOptions = {}) => {
    cancelHide()

    let nextX = state.x
    let nextY = state.y

    if (options.position) {
      nextX = options.position[0]
      nextY = options.position[1]
    } else if (options.event) {
      const coords = getCanvasCoords(options.event)
      nextX = coords.x
      nextY = coords.y
    }

    const nextAnchor = (options.anchor as TooltipAnchor) || state.anchor || 'top'

    state = {
      ...state,
      isOpen: true,
      content,
      x: nextX,
      y: nextY,
      anchor: nextAnchor,
      datum: options.datum !== undefined ? options.datum : state.datum,
      isHoveringCanvas: true,
      persistInCanvas: options.persistInCanvas ?? state.persistInCanvas,
      followCursor: options.followCursor ?? state.followCursor,
    }

    notify()
  }

  const showTooltipFromEvent = (content: React.ReactNode, event: any, options: ShowTooltipOptions = {}) => {
    showTooltip(content, { ...options, event })
  }

  const showTooltipAt = (
    content: React.ReactNode,
    position: [number, number],
    anchor: string = 'top',
    datum?: any
  ) => {
    showTooltip(content, { position, anchor: anchor as TooltipAnchor, datum })
  }

  const hideTooltip = (immediate: boolean = false, delayMs: number = 180) => {
    cancelHide()

    // If configured to persist in canvas and cursor is currently within canvas, preserve tooltip
    if (!immediate && state.persistInCanvas && state.isHoveringCanvas) {
      return
    }

    if (immediate || delayMs <= 0) {
      state = {
        ...state,
        isOpen: false,
      }
      notify()
    } else {
      hideTimer = setTimeout(() => {
        state = {
          ...state,
          isOpen: false,
        }
        hideTimer = null
        notify()
      }, delayMs)
    }
  }

  const updatePosition = (x: number, y: number) => {
    if (state.x === x && state.y === y) return
    state = {
      ...state,
      x,
      y,
    }
    notify()
  }

  const onCanvasPointerEnter = (event: React.PointerEvent | React.MouseEvent) => {
    cancelHide()
    state.isHoveringCanvas = true
  }

  const onCanvasPointerMove = (event: React.PointerEvent | React.MouseEvent) => {
    cancelHide()
    state.isHoveringCanvas = true
    if (state.isOpen && state.followCursor) {
      const coords = getCanvasCoords(event)
      updatePosition(coords.x, coords.y)
    }
  }

  const onCanvasPointerLeave = (event?: React.PointerEvent | React.MouseEvent) => {
    state.isHoveringCanvas = false
    // When pointer leaves the canvas boundary, initiate graceful dismissal
    hideTooltip(false, 150)
  }

  const setCanvasRef = (element: HTMLElement | null) => {
    canvasElement = element
  }

  const setOptions = (options: TooltipStoreOptions) => {
    if (options.persistInCanvas !== undefined) state.persistInCanvas = options.persistInCanvas
    if (options.followCursor !== undefined) state.followCursor = options.followCursor
  }

  const destroy = () => {
    cancelHide()
    listeners.clear()
    canvasElement = null
  }

  return {
    getState: () => state,
    subscribe: (listener: (s: TooltipState) => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    showTooltip,
    showTooltipFromEvent,
    showTooltipAt,
    hideTooltip,
    updatePosition,
    onCanvasPointerEnter,
    onCanvasPointerMove,
    onCanvasPointerLeave,
    setCanvasRef,
    setOptions,
    destroy,
  }
}

/** Global default tooltip store for singleton or unnested contexts */
export const defaultChartTooltipStore = createTooltipStore()

/** Context providing the chart's dedicated TooltipStore to canvas hosts and hooks */
export const ChartTooltipStoreContext = createContext<TooltipStore | null>(null)

/**
 * Hook to subscribe to a TooltipStore's reactive state.
 */
export function useTooltipStoreState(store?: TooltipStore | null): TooltipState {
  const contextStore = useContext(ChartTooltipStoreContext)
  const activeStore = store || contextStore || defaultChartTooltipStore

  return useSyncExternalStore(
    activeStore.subscribe,
    activeStore.getState,
    activeStore.getState
  )
}
