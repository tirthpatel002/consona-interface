import { definePlugin } from '../../core/plugin'
import { GlassProvider } from './context'
import { Glass } from './components/glass'

export const GlassPlugin = definePlugin({
  name: 'glass',
  version: '1.0.0',
  description: 'Liquid glass refraction engine with SVG displacement filters and WebGL ray shaders.',
  Provider: GlassProvider,
  components: {
    Glass,
  },
})
