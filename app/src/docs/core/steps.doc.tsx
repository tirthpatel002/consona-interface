import React, { useState } from 'react'
import {
  Steps,
  StepsNavigator,
  StepsIndicator,
  StepsNavigatorArrow,
  StepsNavigatorPill,
  StepsIndicatorTooltip,
  StepsIndicatorItem,
  StepsIndicatorTrack,
  Button,
} from '@consona/interface'
import {
  User,
  ShieldCheck,
  CreditCard,
  Rocket,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import type { ComponentDocSpec } from '../types'

export const stepsDoc: ComponentDocSpec = {
  id: 'steps',
  name: 'Steps',
  component: Steps,
  summary:
    'Spring-animated step & carousel navigation suite featuring dynamic theme morphing, linear timer progress fills, and fluid clip-path floating tooltip indicators.',
  subcomponents: [
    'StepsNavigator',
    'StepsNavigatorArrow',
    'StepsNavigatorPill',
    'StepsIndicator',
    'StepsIndicatorTrack',
    'StepsIndicatorItem',
    'StepsIndicatorTooltip',
  ],
  playground: {
    defaultProps: {
      size: 'md',
    },
    controls: [
      { name: 'size', type: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    ],
    render: (props: any) => {
      const [currentStep, setCurrentStep] = useState(0)

      const sampleSteps = [
        {
          id: 'account',
          label: 'Account Profile',
          icon: User,
          badge: 'Step 1',
        },
        {
          id: 'security',
          label: 'Security & 2FA',
          icon: ShieldCheck,
          badge: 'Step 2',
        },
        {
          id: 'billing',
          label: 'Payment Method',
          icon: CreditCard,
          badge: 'Step 3',
        },
        {
          id: 'launch',
          label: 'Deploy System',
          icon: Rocket,
          badge: 'Ready',
        },
      ]

      return (
        <div className="flex flex-col items-center justify-center gap-8 p-6 w-full max-w-xl">
          <StepsIndicator
            steps={sampleSteps}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            size={props.size}
          />
          <StepsNavigator
            totalSteps={sampleSteps.length}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            size={props.size}
          />
        </div>
      )
    },
  },
  examples: [
    {
      title: 'StepsNavigator — Segmented Carousel & Step Navigator',
      description:
        'Spring-morphing pill indicator with active step transitions, auto-play progress timers, and circular arrow actions.',
      render: () => {
        const NavigatorDemo = () => {
          const [step, setStep] = useState(0)
          const [autoPlay, setAutoPlay] = useState(false)

          return (
            <div className="flex flex-col items-center gap-6 p-6">
              <StepsNavigator
                totalSteps={4}
                currentStep={step}
                onStepChange={setStep}
                autoDelay={3000}
                isAutoPlaying={autoPlay}
                size="md"
              />
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  intent={autoPlay ? 'primary' : 'outline'}
                  onClick={() => setAutoPlay(!autoPlay)}
                >
                  {autoPlay ? 'Pause Auto-Play' : 'Start Auto-Play (3s timer)'}
                </Button>
                <span className="text-xs text-muted-fg font-medium">
                  Current Slide: <span className="font-semibold text-fg">{step + 1} / 4</span>
                </span>
              </div>
            </div>
          )
        }
        return <NavigatorDemo />
      },
    },
    {
      title: 'StepsIndicator — Segmented Bar with Floating Morphing Tooltip',
      description:
        'Smooth hover and focus clip-path banner tracking over segmented progress bars with spring physics.',
      render: () => {
        const IndicatorDemo = () => {
          const [activeStep, setActiveStep] = useState(1)

          const items = [
            {
              id: 'profile',
              label: 'Identity Setup',
              icon: User,
              badge: 'Required',
            },
            {
              id: 'verify',
              label: 'Verification',
              icon: ShieldCheck,
            },
            {
              id: 'tier',
              label: 'Subscription',
              icon: Sparkles,
            },
            {
              id: 'complete',
              label: 'Finish Setup',
              icon: CheckCircle2,
            },
          ]

          return (
            <div className="flex flex-col items-center gap-6 p-6 w-full max-w-lg mx-auto">
              <StepsIndicator
                steps={items}
                currentStep={activeStep}
                onStepChange={setActiveStep}
                size="md"
              />
              <div className="flex items-center gap-3 pt-2">
                <Button
                  size="sm"
                  intent="secondary"
                  isDisabled={activeStep === 0}
                  onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  intent="primary"
                  isDisabled={activeStep === items.length - 1}
                  onClick={() => setActiveStep((prev) => Math.min(items.length - 1, prev + 1))}
                >
                  Next Step
                </Button>
              </div>
            </div>
          )
        }
        return <IndicatorDemo />
      },
    },
  ],
}
