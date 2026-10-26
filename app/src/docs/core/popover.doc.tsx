import React from 'react'
import {
  Popover,
  PopoverTrigger,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverFooter,
  PopoverClose,
  Button,
  Field,
  Input,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const popoverDoc: ComponentDocSpec = {
  id: 'popover',
  name: 'Popover',
  component: Popover,
  summary: 'Anchor-positioned floating container with optical geometry, dialog semantics, and animated placement ramps.',
  subcomponents: [
    'PopoverTrigger',
    'PopoverArrow',
    'PopoverHeader',
    'PopoverTitle',
    'PopoverDescription',
    'PopoverFooter',
    'PopoverClose',
  ],
  playground: {
    defaultProps: {
      size: 'md',
      showArrow: true,
      placement: 'bottom',
    },
    controls: [
      { name: 'size', type: 'select', options: ['sm', 'md', 'lg', 'auto'] },
      { name: 'showArrow', type: 'boolean' },
      { name: 'placement', type: 'select', options: ['top', 'bottom', 'left', 'right'] },
    ],
    render: (props: any) => (
      <div className="relative flex items-center justify-center p-12 overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-muted/30 to-accent/10 border border-border/40">
        <PopoverTrigger>
          <Button intent="primary">Open Settings Popover</Button>
          <Popover {...props}>
            {({ close }) => (
              <div className="space-y-3">
                <PopoverHeader
                  title="Workspace Dimensions"
                  description="Adjust viewport scale and optical density ratios."
                />
                <Field>
                  <Field.Label>Aspect Ratio</Field.Label>
                  <Input defaultValue="16:9 Cinema" />
                </Field>
                <PopoverFooter>
                  <Button intent="plain" size="sm" onPress={close}>
                    Cancel
                  </Button>
                  <Button intent="primary" size="sm" onPress={close}>
                    Save Changes
                  </Button>
                </PopoverFooter>
              </div>
            )}
          </Popover>
        </PopoverTrigger>
      </div>
    ),
  },
  examples: [
    {
      title: 'Interactive Filter & Form Workflows',
      description: 'Clean popovers for contextual filters, multi-step actions, and quick configuration forms.',
      render: () => (
        <div className="flex flex-wrap gap-4 items-center">
          {/* Quick Filter Popover */}
          <PopoverTrigger>
            <Button intent="outline">Filter Columns</Button>
            <Popover showArrow className="w-64 p-4">
              {({ close }) => (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <span className="text-xs font-semibold text-fg">Display Columns</span>
                    <PopoverClose />
                  </div>
                  <div className="space-y-2 text-xs text-muted-fg">
                    <label className="flex items-center gap-2 cursor-pointer hover:text-fg">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span>Timestamp</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:text-fg">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span>Audio Waveform</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:text-fg">
                      <input type="checkbox" className="rounded" />
                      <span>Confidence Score</span>
                    </label>
                  </div>
                  <div className="pt-2 border-t border-border/40 flex justify-end gap-2">
                    <Button size="xs" intent="plain" onPress={close}>Reset</Button>
                    <Button size="xs" intent="primary" onPress={close}>Apply</Button>
                  </div>
                </div>
              )}
            </Popover>
          </PopoverTrigger>

          {/* Quick Info Popover */}
          <PopoverTrigger>
            <Button intent="secondary">System Info</Button>
            <Popover showArrow className="w-56 p-3">
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold text-fg">Audio Engine</h5>
                <p className="text-2xs text-muted-fg leading-relaxed">
                  WebAudio pipeline active at 48kHz sample rate with real-time FFT analyzer.
                </p>
              </div>
            </Popover>
          </PopoverTrigger>
        </div>
      ),
    },
    {
      title: 'Compound Subcomponents & Slotted Workflows',
      description: 'Structured headers, titles, descriptions, footers, and close triggers for rich dialog ergonomics.',
      render: () => (
        <div className="flex flex-wrap gap-4 items-center">
          <PopoverTrigger>
            <Button intent="primary">User Profile Card</Button>
            <Popover size="md" showArrow>
              {({ close }) => (
                <div>
                  <PopoverHeader
                    title="Account Settings"
                    description="Manage your notifications and security preferences."
                  />
                  <div className="py-2 text-xs text-fg space-y-1">
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <span className="text-muted-fg">Role</span>
                      <span className="font-medium">Administrator</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-fg">Status</span>
                      <span className="text-emerald-500 font-medium">Active</span>
                    </div>
                  </div>
                  <PopoverFooter>
                    <Button intent="plain" size="sm" onPress={close}>
                      Dismiss
                    </Button>
                    <Button intent="primary" size="sm" onPress={close}>
                      Manage
                    </Button>
                  </PopoverFooter>
                </div>
              )}
            </Popover>
          </PopoverTrigger>
        </div>
      ),
    },
    {
      title: 'Size Variations (sm, md, lg, auto)',
      description: 'Compact to expanded popover geometries suited for quick info cards or complex workflows.',
      render: () => (
        <div className="flex flex-wrap gap-4">
          <PopoverTrigger>
            <Button size="sm" intent="outline">Small (sm)</Button>
            <Popover size="sm" showArrow>
              <p className="text-xs">Compact tooltip-like popover card.</p>
            </Popover>
          </PopoverTrigger>

          <PopoverTrigger>
            <Button size="sm" intent="outline">Medium (md)</Button>
            <Popover size="md" showArrow>
              <div className="space-y-1">
                <h5 className="font-semibold text-sm">Medium Geometry</h5>
                <p className="text-xs text-muted-fg">Balanced padding for configuration dialogs.</p>
              </div>
            </Popover>
          </PopoverTrigger>

          <PopoverTrigger>
            <Button size="sm" intent="outline">Large (lg)</Button>
            <Popover size="lg" showArrow>
              <div className="space-y-2">
                <h5 className="font-bold text-base">Large Geometry</h5>
                <p className="text-sm text-muted-fg">Expansive layout for multi-step menus and forms.</p>
              </div>
            </Popover>
          </PopoverTrigger>
        </div>
      ),
    },
  ],
}
