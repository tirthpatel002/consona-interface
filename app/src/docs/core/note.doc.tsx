import React from 'react'
import { Note, Alert, Callout } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const noteDoc: ComponentDocSpec = {
  id: 'note',
  name: 'Note',
  component: Note,
  summary: 'Status alert with concentric intent indicators, optional dismiss trigger, and optical macro radius.',
  subcomponents: ['Alert', 'Callout'],
  playground: {
    defaultProps: {
      intent: 'info',
      indicator: true,
      isDismissible: false,
      children: 'Deployment finished. Review the changelog before promoting to production.',
    },
    controls: [
      { name: 'intent', type: 'select', options: ['info', 'success', 'warning', 'danger', 'neutral'] },
      { name: 'indicator', type: 'boolean' },
      { name: 'isDismissible', type: 'boolean' },
      { name: 'children', type: 'text' },
    ],
  },
  examples: [
    {
      title: 'Intent ramps',
      description: 'Info, success, warning, danger, and neutral callouts with concentric indicators.',
      render: () => (
        <div className="flex flex-col gap-3 w-full max-w-xl">
          <Note intent="info"><strong>Info.</strong> Sync is scheduled for 02:00 UTC.</Note>
          <Note intent="success"><strong>Success.</strong> All 12 checks passed.</Note>
          <Note intent="warning"><strong>Warning.</strong> Staging is 2 commits behind main.</Note>
          <Note intent="danger"><strong>Danger.</strong> The webhook secret is missing.</Note>
          <Note intent="neutral">Neutral note without a status icon.</Note>
        </div>
      ),
    },
    {
      title: 'Dismissible alert',
      description: 'Close trigger removes the note and fires onDismiss.',
      render: () => (
        <Alert intent="warning" isDismissible className="w-full max-w-xl">
          This environment expires in 6 hours. Save your work.
        </Alert>
      ),
    },
    {
      title: 'Callout alias',
      description: 'Callout is a specialized Note with a neutral default.',
      render: () => (
        <Callout className="w-full max-w-xl">
          Prefer Notes for transient status and Callouts for evergreen guidance.
        </Callout>
      ),
    },
  ],
}
