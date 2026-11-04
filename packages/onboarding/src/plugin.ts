import { definePlugin } from '@consona/interface-core'
import { OnboardingProvider } from './context'
import {
  Tour,
  TourBeacon,
  TourCard,
  TourChecklist,
  TourSpotlight,
  OnboardingFocus,
} from './components'

export const OnboardingPlugin = definePlugin({
  name: 'onboarding',
  version: '1.0.0',
  description: 'Tour and checklist engine with injected storage and event forwarding.',
  Provider: OnboardingProvider,
  components: {
    Tour,
    TourBeacon,
    TourCard,
    TourChecklist,
    TourSpotlight,
    OnboardingFocus,
  },
})
