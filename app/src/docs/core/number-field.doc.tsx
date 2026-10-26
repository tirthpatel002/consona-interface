import React, { useState } from 'react'
import {
  NumberField,
  NumberInput,
  Field,
  Card,
  Badge,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const numberFieldDoc: ComponentDocSpec = {
  id: 'number-field',
  name: 'NumberField',
  component: NumberField,
  summary: 'Formatted numeric input with increment/decrement steppers, format scaling, and keyboard controls.',
  subcomponents: ['NumberInput', 'StepperButton'],
  playground: {
    defaultProps: {
      minValue: 0,
      maxValue: 100,
      step: 1,
      defaultValue: 10,
    },
    controls: [
      { name: 'minValue', type: 'number' },
      { name: 'maxValue', type: 'number' },
      { name: 'step', type: 'number' },
      { name: 'isDisabled', type: 'boolean' },
    ],
    render: (props: any) => (
      <div className="flex flex-col items-center justify-center p-8 max-w-xs mx-auto w-full">
        <Field className="w-full">
          <Field.Label>Quantity</Field.Label>
          <NumberField aria-label="Quantity" {...props}>
            <NumberInput />
          </NumberField>
          <Field.Description>Adjust the item quantity between 0 and 100.</Field.Description>
        </Field>
      </div>
    ),
  },
  examples: [
    {
      title: 'Currency & Percentage Formats',
      description: 'Localized numerical formatting using formatOptions with decimal precision.',
      render: () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 max-w-xl">
          <Field>
            <Field.Label>Unit Price (USD)</Field.Label>
            <NumberField
              defaultValue={49.99}
              formatOptions={{
                style: 'currency',
                currency: 'USD',
              }}
            >
              <NumberInput />
            </NumberField>
          </Field>

          <Field>
            <Field.Label>Tax Rate</Field.Label>
            <NumberField
              defaultValue={0.0825}
              step={0.0025}
              formatOptions={{
                style: 'percent',
                minimumFractionDigits: 2,
              }}
            >
              <NumberInput />
            </NumberField>
          </Field>
        </div>
      ),
    },
    {
      title: 'Constrained Stepper Clamping',
      description: 'Bounded number bounds with custom stepping increments.',
      render: () => (
        <div className="flex flex-col gap-4 p-4 max-w-sm">
          <Field>
            <Field.Label>Seats (Min 1, Max 10, Step 1)</Field.Label>
            <NumberField defaultValue={2} minValue={1} maxValue={10} step={1}>
              <NumberInput />
            </NumberField>
          </Field>
        </div>
      ),
    },
  ],
}
