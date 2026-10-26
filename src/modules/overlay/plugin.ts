import { definePlugin } from '../../core/plugin'
import { OverlayProvider } from './context'
import {
  SpotlightOverlay,
  AnchoredCallout,
  FeatureBeacon,
  OverlayFocus,
} from './components'

export const OverlayPlugin = definePlugin({
  name: 'overlay',
  version: '1.0.0',
  Provider: OverlayProvider,
  components: {
    SpotlightOverlay,
    AnchoredCallout,
    FeatureBeacon,
    OverlayFocus,
  },
})
