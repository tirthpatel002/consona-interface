import React from 'react'
import {
  NativeSelect,
  NativeSelectContent,
  Field,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const nativeSelectDoc: ComponentDocSpec = {
  id: 'native-select',
  name: 'NativeSelect',
  component: NativeSelect,
  summary: 'Styled native HTML select input optimized for mobile operating systems and instant rendering.',
  subcomponents: ['NativeSelectContent'],
  playground: {
    defaultProps: {
      defaultValue: 'usd',
    },
    controls: [],
    render: (props: any) => (
      <div className="flex flex-col items-center justify-center p-8 max-w-xs mx-auto w-full">
        <Field className="w-full">
          <Field.Label>Currency</Field.Label>
          <NativeSelect>
            <NativeSelectContent {...props}>
              <option value="usd">USD — United States Dollar</option>
              <option value="eur">EUR — Euro</option>
              <option value="gbp">GBP — British Pound</option>
              <option value="jpy">JPY — Japanese Yen</option>
              <option value="cad">CAD — Canadian Dollar</option>
            </NativeSelectContent>
          </NativeSelect>
          <Field.Description>Native OS select menu for frictionless mobile experience.</Field.Description>
        </Field>
      </div>
    ),
  },
  examples: [
    {
      title: 'Region and Locale Picker',
      description: 'Native select grouped by option categories using optgroup.',
      render: () => (
        <div className="flex flex-col gap-4 p-4 max-w-sm">
          <Field>
            <Field.Label>Data Residency Region</Field.Label>
            <NativeSelect>
              <NativeSelectContent defaultValue="us-east-1">
                <optgroup label="North America">
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="ca-central-1">Canada (Central)</option>
                </optgroup>
                <optgroup label="Europe">
                  <option value="eu-west-1">EU (Ireland)</option>
                  <option value="eu-central-1">EU (Frankfurt)</option>
                </optgroup>
              </NativeSelectContent>
            </NativeSelect>
          </Field>
        </div>
      ),
    },
  ],
}
