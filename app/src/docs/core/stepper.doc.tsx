import React, { useState } from 'react'
import {
  Stepper,
  StepItem,
  StepIcon,
  StepContent,
  StepConnector,
  Button,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const stepperDoc: ComponentDocSpec = {
  id: 'stepper',
  name: 'Stepper',
  component: Stepper,
  summary: 'Multi-step process workflow stepper supporting horizontal and vertical timelines, status checks, descriptions, and interactive progression.',
  subcomponents: [
    'StepItem',
    'StepIcon',
    'StepContent',
    'StepConnector',
    'StepSeparator',
    'Wizard',
  ],
  playground: {
    defaultProps: {
      orientation: 'horizontal',
      size: 'md',
      variant: 'default',
      clickable: true,
    },
    controls: [
      { name: 'orientation', type: 'select', options: ['horizontal', 'vertical'] },
      { name: 'size', type: 'select', options: ['sm', 'md', 'lg'] },
      { name: 'variant', type: 'select', options: ['default', 'timeline', 'dots'] },
      { name: 'clickable', type: 'boolean' },
    ],
    render: (props: any) => {
      const [activeStep, setActiveStep] = useState(1)

      return (
        <div className="w-full max-w-xl p-4 flex flex-col items-center gap-6">
          <Stepper
            activeStep={activeStep}
            onStepChange={setActiveStep}
            {...props}
          >
            <StepItem>
              <StepContent label="Account Details" description="Provide user profile information" />
            </StepItem>
            <StepItem>
              <StepContent label="Verification" description="Confirm email address and 2FA" />
            </StepItem>
            <StepItem>
              <StepContent label="Payment Plan" description="Choose subscription tier" />
            </StepItem>
            <StepItem>
              <StepContent label="Deployment" description="Provision cloud resources" />
            </StepItem>
          </Stepper>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              intent="outline"
              isDisabled={activeStep <= 0}
              onPress={() => setActiveStep((s) => Math.max(0, s - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              intent="primary"
              isDisabled={activeStep >= 3}
              onPress={() => setActiveStep((s) => Math.min(3, s + 1))}
            >
              Next Step
            </Button>
          </div>
        </div>
      )
    },
  },
  examples: [
    {
      title: 'Vertical Activity Timeline',
      description: 'Vertical Stepper in timeline variant displaying operational status and timestamps.',
      render: () => (
        <div className="w-full max-w-md p-4 bg-muted/20 rounded-macro border border-border">
          <Stepper orientation="vertical" variant="timeline" activeStep={2}>
            <StepItem status="complete">
              <StepContent label="Pull Request Approved" description="Merged by lead engineer" timestamp="10:30 AM" />
            </StepItem>
            <StepItem status="complete">
              <StepContent label="Build Pipeline Passed" description="All unit tests succeeded" timestamp="10:32 AM" />
            </StepItem>
            <StepItem status="current">
              <StepContent label="Canary Deployment" description="Routing 10% traffic to cluster us-east" timestamp="10:35 AM" />
            </StepItem>
            <StepItem status="upcoming">
              <StepContent label="Full Release Production" description="Promote traffic to 100%" timestamp="Pending" />
            </StepItem>
          </Stepper>
        </div>
      ),
    },
  ],
}
