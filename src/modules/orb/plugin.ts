import { definePlugin } from '../../core/plugin'
import { OrbProvider } from './context'
import { Orb } from './components/orb'

export const OrbPlugin = definePlugin({
  name: 'orb',
  version: '1.0.0',
  description: 'Orb physics engine with shader uniforms and event forwarding.',
  Provider: OrbProvider,
  components: {
    Orb,
  },
})
