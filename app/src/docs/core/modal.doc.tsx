import React from 'react'
import {
  Modal,
  ModalTrigger,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  Button,
  Field,
  Input,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const modalDoc: ComponentDocSpec = {
  id: 'modal',
  name: 'Modal',
  component: Modal,
  summary: 'Accessible modal dialog system with concentric optical geometry, focus trapping, backdrop blur, and size ramps.',
  subcomponents: [
    'ModalTrigger',
    'ModalHeader',
    'ModalTitle',
    'ModalDescription',
    'ModalBody',
    'ModalFooter',
    'ModalCloseButton',
    'Dialog',
  ],
  playground: {
    defaultProps: {
      size: 'md',
      blur: 'md',
      isDismissable: true,
      showCloseButton: true,
    },
    controls: [
      { name: 'size', type: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl', 'fullscreen'] },
      { name: 'blur', type: 'select', options: ['none', 'sm', 'md', 'lg'] },
      { name: 'isDismissable', type: 'boolean' },
      { name: 'showCloseButton', type: 'boolean' },
    ],
    render: (props: any) => (
      <div className="flex items-center justify-center p-8">
        <ModalTrigger>
          <Button intent="primary">
            Launch Infrastructure Modal
          </Button>
          <Modal {...props}>
            {({ close }) => (
              <>
                <ModalHeader
                  title="Deploy Edge Compute Cluster"
                  description="Provision scalable Kubernetes nodes across distributed edge zones."
                />
                <ModalBody className="space-y-4">
                  <Field>
                    <Field.Label>Cluster Identifier</Field.Label>
                    <Input defaultValue="us-east-cluster-prod" />
                    <Field.Description>Global DNS routing name</Field.Description>
                  </Field>
                  <Field>
                    <Field.Label>Replica Nodes</Field.Label>
                    <Input defaultValue="12 Worker Nodes" />
                    <Field.Description>Autoscaling node pool capacity</Field.Description>
                  </Field>
                </ModalBody>
                <ModalFooter>
                  <Button intent="plain" onPress={close}>
                    Cancel
                  </Button>
                  <Button intent="primary" onPress={close}>
                    Deploy Now
                  </Button>
                </ModalFooter>
              </>
            )}
          </Modal>
        </ModalTrigger>
      </div>
    ),
  },
  examples: [
    {
      title: 'Destructive Confirmation Dialog',
      description: 'Modal configured for critical resource deletion workflows.',
      render: () => (
        <div>
          <ModalTrigger>
            <Button intent="danger">
              Delete Production Database
            </Button>
            <Modal size="sm">
              {({ close }) => (
                <>
                  <ModalHeader
                    title="Confirm Permanent Deletion"
                    description="This action is irreversible and will purge all customer tables."
                  />
                  <ModalFooter>
                    <Button intent="plain" onPress={close}>
                      Cancel
                    </Button>
                    <Button intent="danger" onPress={close}>
                      Confirm Delete
                    </Button>
                  </ModalFooter>
                </>
              )}
            </Modal>
          </ModalTrigger>
        </div>
      ),
    },
  ],
}
