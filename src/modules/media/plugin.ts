import { definePlugin } from '../../core/plugin'
import { AudioProvider } from './context'

export const AudioPlugin = definePlugin({
  name: 'audio',
  version: '1.0.0',
  description: 'Audio and media playback framework with engines, providers, Type C hooks, and reactive visualizers.',
  Provider: AudioProvider,
})

export const MediaPlugin = AudioPlugin
