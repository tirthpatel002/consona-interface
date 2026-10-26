'use client'

import { useAudioPlayer, type UseAudioPlayerResult } from './use-audio-player'
import type { AudioPlayerEngineOptions } from '../engine/player-engine'

export function useAudio<TData = unknown>(options: AudioPlayerEngineOptions<TData> = {}): UseAudioPlayerResult<TData> {
  return useAudioPlayer<TData>(options)
}
