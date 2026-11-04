'use client'

import { useAudioPlayer, type UseAudioPlayerOptions, type UseAudioPlayerResult } from './use-audio-player'

/**
 * Alias for `useAudioPlayer` — headless playback for custom UIs.
 * For the shared app bus, use `useSharedAudioPlayer()` or `useAudioPlayer({ shared: true })`.
 * For the facade engine instance, use `useAudioEngine()` / `useOptionalAudioEngine()`.
 */
export function useAudio<TData = unknown>(
  options: UseAudioPlayerOptions<TData> = {}
): UseAudioPlayerResult<TData> {
  return useAudioPlayer<TData>(options)
}
