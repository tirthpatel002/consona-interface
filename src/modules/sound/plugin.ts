import { definePlugin } from '../../core/plugin'
import { SoundProvider } from './context'
import { SoundTrigger } from './components'

export const SoundPlugin = definePlugin({
  name: 'sound',
  version: '1.0.0',
  description: 'Web Audio procedural interaction sound synthesis engine and tactile acoustic feedback.',
  Provider: SoundProvider,
  components: {
    SoundTrigger,
  },
})
