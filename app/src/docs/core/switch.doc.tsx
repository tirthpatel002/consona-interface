import React from 'react'
import { Switch, SwitchButton, SwitchField, Description } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const switchDoc: ComponentDocSpec = {
  id: 'switch',
  name: 'Switch',
  component: Switch,
  summary: 'Interactive toggle switch with smooth physics transitions, optical track scaling, and thumb slots.',
  subcomponents: ['SwitchField', 'SwitchButton'],
  playground: {
    defaultProps: {
      children: 'Airplane Mode',
      defaultSelected: true,
      isDisabled: false
    },
    controls: [
      { name: 'children', type: 'text' },
      { name: 'defaultSelected', type: 'boolean' },
      { name: 'isDisabled', type: 'boolean' },
    ],
    render: (props: any) => (
      <div className="flex items-center gap-3">
        <Switch {...props} />
      </div>
    )
    },
  examples: [
    {
      title: 'Settings Toggle Rows',
      description: 'SwitchField composite with integrated label and description.',
      render: () => (
        <div className="w-full max-w-md space-y-4">
          <SwitchField>
            <Switch defaultSelected>Automatic Cloud Backups</Switch>
            <Description>Sync your workspace snapshot every 15 minutes.</Description>
          </SwitchField>
          <SwitchField>
            <Switch>Developer Beta Features</Switch>
            <Description>Access experimental canvas shaders and WebGL orbs.</Description>
          </SwitchField>
        </div>
      )
    },
  ]
    }
