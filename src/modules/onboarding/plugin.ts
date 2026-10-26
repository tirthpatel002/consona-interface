import { definePlugin } from '../../core/plugin'
import { OnboardingProvider } from './context'

export const OnboardingPlugin = definePlugin({
  name: 'onboarding',
  version: '1.0.0',
  description: 'Tour and checklist engine with injected storage and event forwarding.',
  Provider: OnboardingProvider,
})
