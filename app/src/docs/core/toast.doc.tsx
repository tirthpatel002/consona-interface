import React from 'react'
import { Button, ToastQueue, useToast } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

function ToastPlayground() {
  const { actions } = useToast()
  return (
    <div className="flex flex-wrap gap-2 justify-center p-6">
      <Button intent="primary" onPress={() => actions.info('Workspace synced', { description: 'Latest draft is live.' })}>
        Info
      </Button>
      <Button intent="success" onPress={() => actions.success('Saved')}>
        Success
      </Button>
      <Button
        intent="warning"
        onPress={() =>
          actions.warning('Quota at 80%', {
            action: { label: 'Upgrade', onClick: () => actions.info('Opening billing') },
          })
        }
      >
        Warning + action
      </Button>
      <Button intent="danger" onPress={() => actions.error('Publish failed')}>
        Error
      </Button>
    </div>
  )
}

export const toastDoc: ComponentDocSpec = {
  id: 'toast',
  name: 'Toast',
  summary: 'Stacked notifications with swipe-to-dismiss, timeouts, and action buttons via ToastQueue / useToast.',
  subcomponents: [],
  playground: {
    defaultProps: {},
    controls: [],
    render: () => <ToastPlayground />,
  },
  examples: [
    {
      title: 'Queue API',
      description: 'ToastQueue can be called from anywhere after <Toast /> is mounted.',
      render: () => (
        <div className="flex flex-wrap gap-2">
          <Button intent="outline" onPress={() => ToastQueue.success('Copied to clipboard')}>
            Queue success
          </Button>
          <Button intent="outline" onPress={() => ToastQueue.dismiss()}>
            Dismiss all
          </Button>
        </div>
      ),
    },
  ],
}
