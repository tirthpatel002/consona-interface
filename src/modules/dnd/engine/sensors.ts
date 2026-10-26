/**
 * @file sensors.ts
 * Sensor subsystem managing Pointer, Touch, Mouse, and Keyboard gesture activation.
 * Dispatches normalized coordinates with configurable activation distance and delay thresholds.
 */

import type { Coordinates, SensorOptions } from './types'

export type SensorEventHandler = (event: {
  type: 'start' | 'move' | 'end' | 'cancel'
  coordinates: Coordinates
  nativeEvent: Event
}) => void

export interface SensorInstance {
  attach: (target: HTMLElement, handler: SensorEventHandler) => () => void
}

/**
 * Creates a Pointer Sensor with distance and delay activation thresholds.
 */
export function createPointerSensor(options: SensorOptions = {}): SensorInstance {
  const { activationDistance = 3, activationDelay = 0 } = options

  return {
    attach(target: HTMLElement, handler: SensorEventHandler): () => void {
      let startCoords: Coordinates | null = null
      let isActivated = false
      let delayTimer: ReturnType<typeof setTimeout> | null = null

      const handlePointerDown = (e: PointerEvent) => {
        // Only accept primary button (left click)
        if (e.button !== 0 && e.button !== undefined) return

        const coords: Coordinates = { x: e.clientX, y: e.clientY }
        startCoords = coords
        isActivated = false

        const cleanupMove = () => {
          window.removeEventListener('pointermove', handlePointerMove)
          window.removeEventListener('pointerup', handlePointerUp)
          window.removeEventListener('pointercancel', handlePointerCancel)
          if (delayTimer) {
            clearTimeout(delayTimer)
            delayTimer = null
          }
        }

        const triggerActivation = (currentCoords: Coordinates, nativeEvt: Event) => {
          if (isActivated) return
          isActivated = true
          handler({
            type: 'start',
            coordinates: currentCoords,
            nativeEvent: nativeEvt,
          })
        }

        if (activationDelay > 0) {
          delayTimer = setTimeout(() => {
            if (startCoords) {
              triggerActivation(startCoords, e)
            }
          }, activationDelay)
        }

        const handlePointerMove = (moveEvt: PointerEvent) => {
          if (!startCoords) return
          const currentCoords: Coordinates = { x: moveEvt.clientX, y: moveEvt.clientY }

          if (!isActivated) {
            const dx = currentCoords.x - startCoords.x
            const dy = currentCoords.y - startCoords.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist >= activationDistance) {
              if (delayTimer) clearTimeout(delayTimer)
              triggerActivation(currentCoords, moveEvt)
            }
          } else {
            handler({
              type: 'move',
              coordinates: currentCoords,
              nativeEvent: moveEvt,
            })
          }
        }

        const handlePointerUp = (upEvt: PointerEvent) => {
          cleanupMove()
          if (isActivated) {
            handler({
              type: 'end',
              coordinates: { x: upEvt.clientX, y: upEvt.clientY },
              nativeEvent: upEvt,
            })
          }
          startCoords = null
          isActivated = false
        }

        const handlePointerCancel = (cancelEvt: PointerEvent) => {
          cleanupMove()
          if (isActivated) {
            handler({
              type: 'cancel',
              coordinates: { x: cancelEvt.clientX, y: cancelEvt.clientY },
              nativeEvent: cancelEvt,
            })
          }
          startCoords = null
          isActivated = false
        }

        window.addEventListener('pointermove', handlePointerMove, { passive: false })
        window.addEventListener('pointerup', handlePointerUp, { passive: true })
        window.addEventListener('pointercancel', handlePointerCancel, { passive: true })
      }

      target.addEventListener('pointerdown', handlePointerDown)

      return () => {
        target.removeEventListener('pointerdown', handlePointerDown)
      }
    },
  }
}
