import React, { useState } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
  DrawerClose,
  Button,
  Field,
  Input,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'
import {
  CloudArrowUpIcon,
  Cog6ToothIcon,
  ServerStackIcon,
  ShieldCheckIcon,
} from '@heroicons/react/20/solid'

export const drawerDoc: ComponentDocSpec = {
  id: 'drawer',
  name: 'Drawer',
  component: Drawer,
  summary: 'Slide-in side drawer and bottom sheet overlay with backdrop blur, gesture drag dismissal, and optical token styling.',
  subcomponents: [
    'DrawerContent',
    'DrawerHeader',
    'DrawerTitle',
    'DrawerDescription',
    'DrawerBody',
    'DrawerFooter',
    'DrawerClose',
    'DrawerNotch',
    'Sheet',
    'SheetContent',
    'SheetHeader',
    'SheetTitle',
    'SheetDescription',
    'SheetBody',
    'SheetFooter',
    'SheetClose',
  ],
  playground: {
    defaultProps: {
      side: 'bottom',
      isFloat: false,
      notch: true,
    },
    controls: [
      { name: 'side', type: 'select', options: ['bottom', 'top', 'left', 'right'] },
      { name: 'isFloat', type: 'boolean' },
      { name: 'notch', type: 'boolean' },
    ],
    render: (props: any) => {
      const [isOpen, setIsOpen] = useState(false)
      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8">
          <Button intent="primary" onPress={() => setIsOpen(true)}>
            Open {props?.side?.toUpperCase()} Drawer
          </Button>

          <Drawer isOpen={isOpen} onOpenChange={setIsOpen}>
            <DrawerContent
              side={props?.side}
              isFloat={props?.isFloat}
              notch={props?.notch}
            >
              <DrawerHeader>
                <DrawerTitle>Cluster Node Configuration</DrawerTitle>
                <DrawerDescription>
                  Configure edge compute replicas and security policies for this deployment zone.
                </DrawerDescription>
              </DrawerHeader>

              <DrawerBody className="space-y-4">
                <Field>
                  <Field.Label>Zone Cluster Endpoint</Field.Label>
                  <Input defaultValue="https://edge-iad.compute.internal" />
                  <Field.Description>Internal mTLS ingress gateway</Field.Description>
                </Field>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-2 rounded-base border border-border/60 bg-muted/40 p-3">
                    <ServerStackIcon className="size-5 text-primary" />
                    <div>
                      <div className="text-xs font-semibold text-fg">8 Dedicated Nodes</div>
                      <div className="text-[11px] text-muted-fg">32 vCPU / 128GB RAM</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-base border border-border/60 bg-muted/40 p-3">
                    <ShieldCheckIcon className="size-5 text-emerald-500" />
                    <div>
                      <div className="text-xs font-semibold text-fg">mTLS Enforced</div>
                      <div className="text-[11px] text-muted-fg">Zero Trust Mesh</div>
                    </div>
                  </div>
                </div>
              </DrawerBody>

              <DrawerFooter>
                <Button intent="plain" onPress={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button intent="primary" onPress={() => setIsOpen(false)}>
                  Save & Sync Fleet
                </Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      )
    },
  },
  examples: [
    {
      title: 'Floating Left Navigation Sheet',
      description: 'Side panel floating over the viewport with rounded geometry.',
      render: () => {
        const [open, setOpen] = useState(false)
        return (
          <div>
            <Button intent="secondary" onPress={() => setOpen(true)}>
              <Cog6ToothIcon className="size-4 mr-1.5" />
              Open Left Drawer
            </Button>
            <Drawer isOpen={open} onOpenChange={setOpen}>
              <DrawerContent side="left" isFloat>
                <DrawerHeader>
                  <DrawerTitle>System Settings</DrawerTitle>
                  <DrawerDescription>Manage environment variables & tokens</DrawerDescription>
                </DrawerHeader>
                <DrawerBody className="space-y-3">
                  <div className="rounded-base border border-border p-3">
                    <div className="text-xs font-medium text-fg">API Key: sk_live_8923...</div>
                    <div className="text-[11px] text-muted-fg">Expires in 30 days</div>
                  </div>
                </DrawerBody>
                <DrawerFooter>
                  <DrawerClose onClose={() => setOpen(false)}>Dismiss</DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
        )
      },
    },
  ],
}
