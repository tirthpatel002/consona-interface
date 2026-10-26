import React, { useRef, useState } from 'react'
import {
  Badge,
  Button,
  Input,
  OnboardingFocus,
  OnboardingProvider,
  Tour,
  TourBeacon,
  TourCard,
  TourChecklist,
  useTour,
  type ChecklistItemDefinition as ChecklistItem,
  type TourStepDefinition as TourStep,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

/* ==========================================================================
   Onboarding Component Playground & Examples
   ========================================================================== */

export const playgroundTourId = 'playground-workspace-tour'

export const playgroundTourSteps: TourStep[] = [
  {
    id: 'step-1',
    title: 'Welcome to Consona Workspace',
    description: 'Take a quick guided tour to discover key capabilities and components.',
    placement: 'center',
    badge: 'Intro',
  },
  {
    id: 'step-2',
    target: '#playground-search-input',
    title: 'Universal AI Search',
    description: 'Search documentation, telemetry events, or command actions live during tour.',
    placement: 'bottom-start',
    highlight: 'cutout',
    interactive: true,
    badge: 'Interactive',
  },
  {
    id: 'step-3',
    target: '#playground-telemetry-card',
    title: 'Production Metrics',
    description: 'Real-time telemetry stream showing active requests and system health.',
    placement: 'top-start',
    highlight: 'cutout',
    badge: 'Live Data',
  },
]

export const tourDoc: ComponentDocSpec = {
  id: 'tour',
  name: 'Tour & Onboarding Suite',
  badge: 'Onboarding',
  summary:
    'Full-featured guided walkthrough tour system with hardware-accelerated spotlight cutouts, collision-aware cards, and gamified progress tracking.',
  subcomponents: ['Tour', 'TourCard', 'TourChecklist', 'TourSpotlight', 'TourBeacon', 'OnboardingFocus'],
  playground: {
    defaultProps: {
      showProgress: true,
      showDots: true,
      cardWidth: 320,
      backdropBlur: true,
    },
    controls: [
      {
        name: 'showProgress',
        label: 'Show Progress %',
        type: 'boolean',
        defaultValue: true,
      },
      {
        name: 'showDots',
        label: 'Show Step Dots',
        type: 'boolean',
        defaultValue: true,
      },
      {
        name: 'backdropBlur',
        label: 'Backdrop Blur',
        type: 'boolean',
        defaultValue: true,
      },
      {
        name: 'cardWidth',
        label: 'Card Width (px)',
        type: 'number',
        min: 260,
        max: 420,
        step: 20,
        defaultValue: 320,
      },
    ],
    render: (props) => {
      const onboarding = useTour()
      const isCompleted = onboarding.isTourCompleted(playgroundTourId)

      return (
        <div className="flex flex-col items-center justify-center p-8 gap-6 w-full min-h-[320px]">
          <div className="flex items-center gap-3">
            <Button
              intent="primary"
              onClick={() => {
                onboarding.startTour({
                  id: playgroundTourId,
                  title: 'Playground Workspace Tour',
                  steps: playgroundTourSteps,
                })
              }}
            >
              {isCompleted ? 'Replay Playground Tour' : 'Start Interactive Tour'}
            </Button>
            {isCompleted && (
              <Badge intent="success" size="sm">
                Tour Completed ✓
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
            <div id="playground-search-input" className="flex flex-col gap-2 p-4 rounded-xl border border-border bg-card">
              <span className="text-xs font-semibold text-fg">Search Command</span>
              <Input placeholder="Search commands or docs..." />
            </div>

            <div id="playground-telemetry-card" className="flex flex-col gap-2 p-4 rounded-xl border border-border bg-card">
              <span className="text-xs font-semibold text-fg">Cluster Telemetry</span>
              <div className="flex items-center gap-2">
                <Badge intent="success">Online</Badge>
                <span className="text-xs text-muted-fg">99.99% uptime</span>
              </div>
            </div>
          </div>

          <Tour
            tourId={playgroundTourId}
            steps={playgroundTourSteps}
            cardWidth={props.cardWidth}
          />
        </div>
      )
    },
  },
  examples: [
    {
      id: 'tour-checklist',
      title: 'Gamified Milestone Checklist & Context Syncing',
      description:
        'Checklist component with weighted milestone tracking, parent app event triggers (trackAction), and live context synchronization.',
      render: () => <ChecklistInteractiveExample />,
    },
    {
      id: 'tour-card-anatomy',
      title: 'Tour Card Subcomponents & Custom Composition',
      description: 'Modular tour card anatomy with Header, Title, Description, Body, Dots, and Footer.',
      render: () => {
        const [step, setStep] = useState(1)

        return (
          <div className="flex justify-center p-6 w-full">
            <TourCard className="max-w-sm shadow-xl">
              <TourCard.Header>
                <TourCard.Title badge={<Badge intent="primary" size="sm">Step {step}/3</Badge>}>
                  Modular Card Anatomy
                </TourCard.Title>
                <TourCard.Description>
                  Compound atoms allow fully custom step layout, header icons, body inputs, and navigation actions.
                </TourCard.Description>
              </TourCard.Header>

              <TourCard.Body>
                <div className="p-3 rounded-lg bg-muted/30 border border-border/60 text-xs text-muted-fg">
                  Custom step content embedded seamlessly inside TourCard.Body.
                </div>
              </TourCard.Body>

              <TourCard.Footer>
                <TourCard.Dots current={step - 1} total={3} />
                <div className="flex items-center gap-1.5">
                  <Button
                    size="xs"
                    intent="outline"
                    isDisabled={step === 1}
                    onClick={() => setStep(step - 1)}
                  >
                    Back
                  </Button>
                  <Button
                    size="xs"
                    intent="primary"
                    onClick={() => setStep(step === 3 ? 1 : step + 1)}
                  >
                    {step === 3 ? 'Finish' : 'Next'}
                  </Button>
                </div>
              </TourCard.Footer>
            </TourCard>
          </div>
        )
      },
    },
    {
      id: 'onboarding-beacons',
      title: 'Tour Beacon Pulse Indicators',
      description: 'Subtle attention triggers placed on UI features with custom badges and click handlers.',
      render: () => {
        const [beaconActive, setBeaconActive] = useState(true)

        return (
          <div className="flex items-center gap-6 p-6 flex-wrap">
            <div className="relative flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
              <span className="text-xs font-semibold text-fg">AI Copilot</span>
              <TourBeacon
                pulse={beaconActive}
                intent="primary"
                onClick={() => setBeaconActive(false)}
              />
            </div>

            <div className="relative flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
              <span className="text-xs font-semibold text-fg">Live Telemetry</span>
              <TourBeacon pulse={beaconActive} intent="success" />
            </div>

            <Button size="xs" intent="outline" onClick={() => setBeaconActive(!beaconActive)}>
              Toggle Beacons
            </Button>
          </div>
        )
      },
    },
    {
      id: 'onboarding-focus',
      title: 'Onboarding Focus Spotlight',
      description: 'Declarative focus spotlight highlighting elements for tutorial flows.',
      render: () => {
        const [focusActive, setFocusActive] = useState(false)
        const targetRef = useRef<HTMLDivElement>(null)

        return (
          <div className="flex flex-col gap-4 p-4 w-full">
            <Button
              size="sm"
              intent={focusActive ? 'primary' : 'outline'}
              onClick={() => setFocusActive(!focusActive)}
            >
              {focusActive ? 'Clear Focus' : 'Spotlight Target'}
            </Button>

            <div
              ref={targetRef}
              className="p-6 rounded-2xl border-2 border-primary/40 bg-primary/5 flex flex-col gap-2 max-w-sm"
            >
              <div className="text-sm font-semibold text-fg">Primary Action Target</div>
              <div className="text-xs text-muted-fg">This container is spotlighted during onboarding focus.</div>
            </div>

            <OnboardingFocus
              target={targetRef}
              active={focusActive}
              variant="cutout"
              padding={8}
              onClickBackdrop={() => setFocusActive(false)}
            />
          </div>
        )
      },
    },
  ],
}

export const onboardingDoc = tourDoc
export const tourCardDoc = tourDoc
export const tourChecklistDoc = tourDoc
export const tourSpotlightDoc = tourDoc
export const tourBeaconDoc = tourDoc
export const onboardingFocusDoc = tourDoc

/* ==========================================================================
   Interactive Checklist Demo Helper Components
   ========================================================================== */

function ChecklistInteractiveExample() {
  const [variant, setVariant] = useState<'card' | 'floating'>('card')
  const onboarding = useTour()
  const progress = onboarding.getChecklistProgress('workspace-demo-checklist')

  const checklistGroups = [
    { id: 'basics', title: 'Phase 1: Workspace Basics' },
    { id: 'advanced', title: 'Phase 2: Deployment & Telemetry' },
  ]

  const checklistItems: ChecklistItem[] = [
    {
      id: 'task-playground-tour',
      group: 'basics',
      title: 'Complete Guided Workspace Tour (from Playground above)',
      description: 'Run through the 3-step interactive tour in the playground above. Completing it from the top or here syncs instantly!',
      tourId: playgroundTourId,
      weight: 40,
      isRequired: true,
    },
    {
      id: 'task-search',
      group: 'basics',
      title: 'Test AI Command Search',
      description: 'Search documentation or query live telemetry.',
      triggerOn: ['search:used', 'doc:searched'],
      weight: 20,
    },
    {
      id: 'task-telemetry',
      group: 'advanced',
      title: 'Isolate Telemetry Node',
      description: 'Trigger standalone spotlight focus with SVG cutout mask.',
      triggerOn: 'telemetry:isolated',
      weight: 20,
    },
    {
      id: 'task-deploy',
      group: 'advanced',
      title: 'Configure Production Pipeline',
      description: 'Connect repository hooks for continuous edge delivery.',
      triggerOn: 'pipeline:deployed',
      weight: 20,
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-4 w-full">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          intent={variant === 'card' ? 'primary' : 'outline'}
          onClick={() => setVariant('card')}
        >
          Card View
        </Button>
        <Button
          size="sm"
          intent={variant === 'floating' ? 'primary' : 'outline'}
          onClick={() => setVariant('floating')}
        >
          Floating Launcher View
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-start">
        <TourChecklist
          checklistId="workspace-demo-checklist"
          title="Getting Started Checklist"
          description="Complete these milestones to configure your workspace."
          groups={checklistGroups}
          items={checklistItems}
          variant={variant}
          allowManualToggle
          allowReset
          allowDismiss={false}
        />

        <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-fg">Context Action Engine</span>
            <Badge intent={progress.isAllCompleted ? 'success' : 'primary'}>
              {progress.percentage}% ({progress.completed}/{progress.total})
            </Badge>
          </div>
          <p className="text-xs text-muted-fg m-0">
            This checklist is connected to the exact same global Onboarding Context as the <strong>Playground Tour</strong> at the top of the page. Try starting and completing the tour in the playground above, or launch it with the button below!
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="xs"
              intent="primary"
              onClick={() => onboarding.startTour(playgroundTourId)}
            >
              🚀 Launch Playground Tour
            </Button>
            <Button
              size="xs"
              intent="outline"
              onClick={() => onboarding.trackAction('search:used')}
            >
              ⚡ Fire 'search:used'
            </Button>
            <Button
              size="xs"
              intent="outline"
              onClick={() => onboarding.trackAction('telemetry:isolated')}
            >
              ⚡ Fire 'telemetry:isolated'
            </Button>
            <Button
              size="xs"
              intent="outline"
              onClick={() => onboarding.trackAction('pipeline:deployed')}
            >
              ⚡ Fire 'pipeline:deployed'
            </Button>
            <Button
              size="xs"
              intent="outline"
              onClick={() => onboarding.resetChecklist('workspace-demo-checklist')}
            >
              🔄 Reset Checklist
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
