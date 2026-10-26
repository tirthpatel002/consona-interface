'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AudioDevice } from '../engine/types'

export interface AudioDeviceInfo {
  deviceId: string
  label: string
  kind: 'audioinput' | 'audiooutput'
}

export interface UseAudioDevicesOptions {
  /** Optional custom device enumerator for host-agnostic environments (Electron/RN). */
  enumerate?: () => Promise<AudioDeviceInfo[]>
}

export async function listAudioDevices(
  enumerate?: UseAudioDevicesOptions['enumerate']
): Promise<AudioDeviceInfo[]> {
  if (enumerate) return enumerate()
  if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices
      .filter((d) => d.kind === 'audioinput' || d.kind === 'audiooutput')
      .map((d) => ({
        deviceId: d.deviceId,
        label: d.label || 'Audio Device',
        kind: d.kind as 'audioinput' | 'audiooutput',
      }))
  }
  return []
}

export interface UseAudioDevicesResult {
  devices: AudioDevice[]
  loading: boolean
  error: string | null
  hasPermission: boolean
  loadDevices: () => Promise<void>
}

export function useAudioDevices(): UseAudioDevicesResult {
  const [devices, setDevices] = useState<AudioDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState(false)

  const loadDevicesWithoutPermission = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const deviceList = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = deviceList
        .filter((d) => d.kind === 'audioinput')
        .map((d) => {
          let label = d.label || `Microphone (${d.deviceId ? d.deviceId.slice(0, 6) : 'Default'})`
          label = label.replace(/\s*\([^)]*\)/g, '').trim() || 'Microphone'
          return {
            deviceId: d.deviceId,
            label,
            groupId: d.groupId,
          }
        })

      setDevices(audioInputs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to query audio devices')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDevicesWithPermission = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return

    try {
      setLoading(true)
      setError(null)

      const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      tempStream.getTracks().forEach((track) => track.stop())

      const deviceList = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = deviceList
        .filter((d) => d.kind === 'audioinput')
        .map((d) => {
          let label = d.label || `Microphone (${d.deviceId ? d.deviceId.slice(0, 6) : 'Default'})`
          label = label.replace(/\s*\([^)]*\)/g, '').trim() || 'Microphone'
          return {
            deviceId: d.deviceId,
            label,
            groupId: d.groupId,
          }
        })

      setDevices(audioInputs)
      setHasPermission(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone permission denied')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDevicesWithoutPermission()

    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((permissionStatus) => {
          if (permissionStatus.state === 'granted') {
            setHasPermission(true)
            loadDevicesWithoutPermission()
          } else {
            setHasPermission(false)
          }

          permissionStatus.onchange = () => {
            if (permissionStatus.state === 'granted') {
              setHasPermission(true)
              loadDevicesWithoutPermission()
            } else {
              setHasPermission(false)
              loadDevicesWithoutPermission()
            }
          }
        })
        .catch(() => {
          // Permissions API for microphone not supported in all browsers
        })
    }
  }, [loadDevicesWithoutPermission, loadDevicesWithPermission])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return

    const handleDeviceChange = () => {
      if (hasPermission) {
        loadDevicesWithPermission()
      } else {
        loadDevicesWithoutPermission()
      }
    }

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange)
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange)
    }
  }, [hasPermission, loadDevicesWithPermission, loadDevicesWithoutPermission])

  return {
    devices,
    loading,
    error,
    hasPermission,
    loadDevices: loadDevicesWithPermission,
  }
}
