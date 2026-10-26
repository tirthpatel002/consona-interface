import React from 'react'
import {
  Field,
  Label,
  Description,
  FieldError,
  FieldGroup,
  Fieldset,
  Legend,
  Input,
  TextField,
  EmailField,
  UsernameField,
  PasswordField,
  PhoneField,
  OtpField,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const TAKEN_USERNAMES = new Set(['admin', 'kalein', 'root'])

export const fieldDoc: ComponentDocSpec = {
  id: 'field',
  name: 'Field',
  component: Field,
  summary: 'Accessible form field wrapper plus email, username, password, phone, and OTP products with validation and live feedback.',
  subcomponents: [
    'Label',
    'Description',
    'FieldError',
    'FieldGroup',
    'Fieldset',
    'Legend',
    'TextField',
    'EmailField',
    'UsernameField',
    'PasswordField',
    'PhoneField',
    'OtpField',
  ],
  playground: {
    defaultProps: {
      label: 'Email Address',
      description: 'We will never share your personal email with third parties.',
      errorMessage: 'Please enter a valid business email address.',
      isInvalid: false
    },
    controls: [
      { name: 'label', type: 'text' },
      { name: 'description', type: 'text' },
      { name: 'errorMessage', type: 'text' },
      { name: 'isInvalid', type: 'boolean' },
    ],
    render: (props: any) => (
      <div className="w-full max-w-sm">
        <TextField isInvalid={props.isInvalid}>
          {props.label && <Label>{props.label}</Label>}
          <Input placeholder="name@company.com" />
          {props.description && !props.isInvalid && (
            <Description>{props.description}</Description>
          )}
          {props.isInvalid && props.errorMessage && (
            <FieldError>{props.errorMessage}</FieldError>
          )}
        </TextField>
      </div>
    )
    },
  examples: [
    {
      title: 'Standard Form Field with Validation State',
      description: 'Automatic error association via ARIA described-by.',
      render: () => (
        <div className="w-full max-w-md space-y-4">
          <TextField>
            <Label>Username</Label>
            <Input placeholder="johndoe" />
            <Description>Your public display handle.</Description>
          </TextField>

          <TextField isInvalid>
            <Label>Work Email</Label>
            <Input defaultValue="invalid-email" />
            <FieldError>Please enter a valid email address.</FieldError>
          </TextField>
        </div>
      )
    },
    {
      title: 'Fieldset & Legend Groups',
      description: 'Semantic groupings for compound form configurations.',
      render: () => (
        <div className="w-full max-w-md">
          <Fieldset>
            <Legend>Notification Preferences</Legend>
            <FieldGroup className="space-y-3 mt-3">
              <Field>
                <Label>Primary Phone</Label>
                <Input placeholder="+1 (555) 000-0000" />
              </Field>
              <Field>
                <Label>Backup Email</Label>
                <Input placeholder="backup@example.com" />
              </Field>
            </FieldGroup>
          </Fieldset>
        </div>
      )
    },
    {
      title: 'Email Domain Allowlist',
      description: 'Only addresses on company.com or any .edu domain are accepted.',
      render: () => (
        <div className="w-full max-w-md">
          <EmailField
            label="University or work email"
            description="Use a company.com or .edu address."
            placeholder="name@school.edu"
            allowedDomains={['company.com', '.edu']}
          />
        </div>
      )
    },
    {
      title: 'Email Domain Blacklist',
      description: 'Disposable and public domains are rejected. Try mailinator.com or gmail.com.',
      render: () => (
        <div className="w-full max-w-md">
          <EmailField
            label="Business email"
            description="Personal and disposable inboxes are not allowed."
            placeholder="name@company.com"
            blockedDomains={['gmail.com', 'mailinator.com', '.xyz']}
          />
        </div>
      )
    },
    {
      title: 'Username Availability',
      description: 'UsernameField uses a leading @ mark, format rules, and live availability with alternate handles.',
      render: () => (
        <div className="w-full max-w-md">
          <UsernameField
            label="Username"
            description="Try admin or kalein to see a taken state."
            pattern={/^[a-zA-Z][a-zA-Z0-9._-]{2,29}$/}
            checkAvailability={(value) => {
              const taken = TAKEN_USERNAMES.has(value.toLowerCase())
              return {
                status: taken ? 'taken' : 'available',
                suggestions: taken ? [`${value}_hq`, `${value}2026`] : undefined,
              }
            }}
          />
        </div>
      )
    },
    {
      title: 'Password Strength & Suggestor',
      description: 'Hide/show, live strength meter, rule checklist, and a generated password candidate.',
      render: () => (
        <div className="w-full max-w-md">
          <PasswordField
            label="Create password"
            description="Use a unique password you don’t use elsewhere."
          />
        </div>
      )
    },
    {
      title: 'Phone Country Dropdown',
      description: 'Flag, country name, and calling code in a searchable dropdown, with national-number validation.',
      render: () => (
        <div className="w-full max-w-md">
          <PhoneField
            label="Mobile number"
            description="Select your country, then enter the national number."
            defaultCountry="IN"
          />
        </div>
      )
    },
    {
      title: 'OTP Length, Alphanumeric, and Feedback',
      description: 'Digit vs alphanumeric OTP with correct/incorrect status against an expected code.',
      render: () => (
        <div className="w-full max-w-md space-y-6">
          <OtpField
            label="SMS code"
            description="Enter 123456 to see a confirmed state."
            length={6}
            expected="123456"
          />
          <OtpField
            label="Backup code"
            description="Alphanumeric, four characters. Try A1B2."
            length={4}
            alphanumeric
            expected="A1B2"
          />
        </div>
      )
    },
  ]
}
