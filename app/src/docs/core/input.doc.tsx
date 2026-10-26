import React from 'react'
import {
  Input,
  InputGroup,
  TextField,
  Label,
  Description,
  Kbd,
  EmailInput,
  UsernameInput,
  PasswordInput,
  PhoneInput,
  InputOTP,
  InputOTPControl,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@consona/interface'
import { Search, Mail, Key } from 'lucide-react'
import type { ComponentDocSpec } from '../types'

export const inputDoc: ComponentDocSpec = {
  id: 'input',
  name: 'Input',
  component: Input,
  summary: 'Optical text input field with prefix/suffix icon slots, loader states, input groups, and specialized email, username, password, phone, and OTP atoms.',
  subcomponents: ['InputGroup', 'TextField', 'EmailInput', 'UsernameInput', 'PasswordInput', 'PhoneInput', 'InputOTP'],
  playground: {
    defaultProps: {
      placeholder: 'Search documentation...',
      disabled: false
    },
    controls: [
      { name: 'placeholder', type: 'text' },
      { name: 'disabled', type: 'boolean' },
    ],
    render: (props: any) => (
      <div className="w-full max-w-sm">
        <Input slots={{ icon: Search }} {...props} />
      </div>
    )
    },
  examples: [
    {
      title: 'Icon Slots & Grouped Inputs',
      description: 'Prefix icons and dynamic input groups.',
      render: () => (
        <div className="w-full max-w-sm space-y-3">
          <Input slots={{ icon: Search }} placeholder="Quick search..." />
          <Input slots={{ icon: Mail }} placeholder="Enter email..." />
          <InputGroup>
            <Search data-slot="icon" />
            <Input placeholder="Search with shortcut..." />
            <Kbd data-slot="kbd">⌘K</Kbd>
          </InputGroup>
        </div>
      )
    },
    {
      title: 'High-Level TextField Composite',
      description: 'All-in-one label, description, and input wrapper.',
      render: () => (
        <div className="w-full max-w-sm">
          <TextField>
            <Label>API Key</Label>
            <Input slots={{ icon: Key }} placeholder="cs_live_99x8291..." />
            <Description>Found in your project settings dashboard.</Description>
          </TextField>
        </div>
      )
    },
    {
      title: 'Email, Username, Password, and Phone Atoms',
      description: 'Typed input atoms. Validation, availability, strength, and country catalogs live on the matching Field products.',
      render: () => (
        <div className="w-full max-w-sm space-y-3">
          <EmailInput placeholder="name@company.com" aria-label="Email" />
          <UsernameInput placeholder="yourhandle" aria-label="Username" />
          <PasswordInput isRevealable placeholder="Password" aria-label="Password" />
          <PhoneInput placeholder="555 000 0000" aria-label="Phone" />
        </div>
      )
    },
    {
      title: 'OTP Input',
      description: 'Six-digit grouped OTP host with slot caret state. Length, charset, and correct/incorrect feedback are Field concerns.',
      render: () => (
        <InputOTP maxLength={6} aria-label="One-time code">
          <InputOTPControl>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTPControl>
        </InputOTP>
      )
    },
  ]
}
