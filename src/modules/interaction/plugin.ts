import { definePlugin } from '../../core/plugin'
import { InteractionProvider } from './context'
import {
  InteractionZone,
  InteractionTrigger,
  InteractionLogger,
} from './components'

export const InteractionPlugin = definePlugin({
  name: 'interaction',
  version: '1.0.0',
  Provider: InteractionProvider,
  components: {
    InteractionZone,
    InteractionTrigger,
    InteractionLogger,
  },
})
