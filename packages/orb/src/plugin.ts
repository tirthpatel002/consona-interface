import { definePlugin } from '@consona/interface-core'
import { Orb } from './components/orb'
import { SensitiveOrb } from './components/sensitive-orb'

export const OrbPlugin = definePlugin({
  name: 'orb',
  version: '1.0.0',
  description: 'Procedural WebGPU orb with curated flow presets and audio-reactive sensitive mode.',
  components: {
    Orb,
    SensitiveOrb,
  },
})
