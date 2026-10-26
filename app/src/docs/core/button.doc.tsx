import React, { useState } from 'react'
import {
  Button,
  ButtonGroup,
  ButtonWithIndicator,
  ToggleButton,
  ExpandButton,
  Slider,
  Switch,
} from '@consona/interface'
import {
  ArrowRight,
  Bookmark,
  Download,
  Loader2,
  Mail,
  Sparkles,
  Trash2,

} from 'lucide-react'
import type { ComponentDocSpec } from '../types'
import { AutoVariantGrid } from '../../components/auto-variant-grid'

export const buttonDoc: ComponentDocSpec = {
  id: 'button',
  name: 'Button',
  component: Button,
  summary: 'Interactive action button with optical geometry, semantic intent ramps, slot-based icon injection, and downstream .extend() support.',
  subcomponents: ['ButtonGroup', 'ButtonWithIndicator', 'ToggleButton'],
  playground: {
    defaultProps: {
      children: 'Deploy Project',
      intent: 'primary',
      size: 'md',
      state: 'idle',
      isDisabled: false,
    },
    controls: [
      {
        name: 'intent',
        type: 'select',
        options: [
          'primary',
          'secondary',
          'subtle',
          'outline',
          'plain',
          'danger',
          'warning',
          'success',
        ],
      },
      {
        name: 'state',
        type: 'select',
        options: ['idle', 'loading', 'success', 'error'],
      },
      {
        name: 'size',
        type: 'select',
        options: ['xs', 'sm', 'md', 'lg'],
      },
      {
        name: 'isDisabled',
        type: 'boolean',
      },
      {
        name: 'children',
        type: 'text',
      },
    ],
  },
  examples: [
    {
      title: 'Semantic Intent Ramps & Optical Sizes',
      description: 'Standard optical variant scale across all primary to subtle intent ramps.',
      render: () => (
        <AutoVariantGrid
          component={Button}
          intents={['primary', 'secondary', 'subtle', 'outline', 'plain', 'danger', 'warning', 'success']}
          sizes={['xs', 'sm', 'md', 'lg']}
          label="Button"
        />
      )
    },
    {
      title: 'Multi-State Lifecycle & Custom Themes',
      description: 'General-purpose state machine supporting semantic colors (green/red) or dark monochromatic styling for success/error feedback.',
      render: () => (
        <div className="flex flex-wrap gap-4 items-center">
          <Button state="idle" intent="primary">
            Deploy Service
          </Button>
          <Button state="loading" intent="primary">
            Deploying...
          </Button>
          <Button state="success">
            Deployed (Semantic Green)
          </Button>
          <Button
            state="success"
            states={{
              success: {
                intent: 'primary',
                children: 'Copied (Monochrome Dark)',
              },
            }}
          >
            Copy Link
          </Button>
          <Button state="error">
            Deployment Failed
          </Button>
        </div>
      )
    },
    {
      title: 'Slot Customization & Icon Injections',
      description: 'Injecting icons and custom loaders via type-safe component slots.',
      render: () => (
        <div className="flex flex-wrap gap-3 items-center">
          <Button slots={{ leftIcon: Sparkles }} intent="primary">
            AI Generate
          </Button>
          <Button slots={{ rightIcon: ArrowRight }} intent="secondary">
            Continue
          </Button>
          <Button slots={{ leftIcon: Mail, rightIcon: Download }} intent="outline">
            Export Inbox
          </Button>
          <Button
            isPending
            slots={{
              loader: () => <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            }}
            intent="warning"
          >
            Processing Slot
          </Button>
        </div>
      )
    },
    {
      title: 'Button Groups',
      description: 'Connected button group with unified optical corner radii.',
      render: () => (
        <div className="flex flex-col gap-4 items-center">
          <ButtonGroup>
            <Button intent="outline" slots={{ leftIcon: Bookmark }}>
              Save
            </Button>
            <Button intent="outline" slots={{ leftIcon: Download }}>
              Download
            </Button>
            <Button intent="outline" slots={{ leftIcon: Trash2 }}>
              Delete
            </Button>
          </ButtonGroup>
        </div>
      )
    },
    {
      title: 'Buttons with Live Status Indicators',
      description: 'Embedded real-time telemetry indicator dot for presence, system status, or stream health.',
      render: () => (
        <div className="flex flex-wrap gap-4 items-center">
          <ButtonWithIndicator indicatorStatus="online" intent="secondary" slots={{ leftIcon: Mail }}>
            Messages
          </ButtonWithIndicator>
          <ButtonWithIndicator indicatorStatus="busy" intent="outline">
            Live Stream
          </ButtonWithIndicator>
          <ButtonWithIndicator indicatorStatus="away" intent="outline">
            Away
          </ButtonWithIndicator>
          <ButtonWithIndicator indicatorStatus="offline" intent="subtle">
            Offline
          </ButtonWithIndicator>
        </div>
      )
    },
    {
      title: 'Two-State Toggle Buttons',
      description: 'Persistent on/off toggle buttons with selected state styling for actions like bookmarking or pinning.',
      render: () => (
        <div className="flex flex-wrap gap-4 items-center">
          <ToggleButton defaultSelected intent="outline">
            Bookmark (Selected)
          </ToggleButton>
          <ToggleButton intent="outline">
            Pin Tab (Unselected)
          </ToggleButton>
          <ToggleButton intent="secondary">
            Mute Audio
          </ToggleButton>
        </div>
      )
    },
    {
      title: 'ExpandButton — Spring-Animated Details Disclosure (GPT Metrics)',
      description:
        'Fluid width & height morphing disclosure button with staggered spring physics, blur reveal transitions, and structured metric key-value grid.',
      render: () => {
        const ExpandButtonDemo = () => {
          const [isOpen, setIsOpen] = useState(true)

          const gptMetrics = [
            {
              id: 'model',
              label: 'Model',
              value: 'GPT 5.5 Codex',
              span: 2 as const,
            },
            {
              id: 'tokens',
              label: 'Tokens',
              value: '3.4K',
            },
            {
              id: 'cost',
              label: 'Cost',
              value: '$0.27',
            },
            {
              id: 'latency',
              label: 'Latency',
              value: '1.4s',
            },
            {
              id: 'temp',
              label: 'Temperature',
              value: '0.7',
            },
          ]

          return (
            <div className="flex flex-col gap-4 p-4">
              <div className="flex items-center gap-4">
                <ExpandButton
                  isOpen={isOpen}
                  onOpenChange={setIsOpen}
                  label="Details"
                  expandedWidth={320}
                  items={gptMetrics}
                />
                <Button intent="secondary">Run Query</Button>
                <Button intent="outline">Export Trace</Button>
              </div>
              <span className="text-xs text-muted-fg font-medium">
                State: <span className="font-semibold text-fg">{isOpen ? 'Expanded' : 'Collapsed'}</span> • Neighboring action buttons remain stationary.
              </span>
            </div>
          )
        }
        return <ExpandButtonDemo />
      },
    },
    {
      title: 'ExpandButton — Interactive AI Parameters Controller',
      description:
        'Expandable button containing live interactive controls (sliders, switches, and preset action buttons) with dynamic height auto-tracking.',
      render: () => {
        const InteractiveExpandDemo = () => {
          const [isOpen, setIsOpen] = useState(false)
          const [temp, setTemp] = useState(0.7)
          const [maxTokens, setMaxTokens] = useState(2048)
          const [isStreaming, setIsStreaming] = useState(true)
          const [preset, setPreset] = useState<'balanced' | 'creative' | 'precise'>('balanced')

          const applyPreset = (type: 'balanced' | 'creative' | 'precise') => {
            setPreset(type)
            if (type === 'creative') {
              setTemp(0.9)
              setMaxTokens(3072)
            } else if (type === 'precise') {
              setTemp(0.2)
              setMaxTokens(1024)
            } else {
              setTemp(0.7)
              setMaxTokens(2048)
            }
          }

          return (
            <div className="flex flex-col gap-6 p-4 min-h-[300px]">
              <div className="flex items-center gap-4">
                <ExpandButton
                  isOpen={isOpen}
                  onOpenChange={setIsOpen}
                  label="Model Settings"
                  expandedWidth={340}
                >
                  <ExpandButton.Trigger />
                  <ExpandButton.Content>
                    <div className="mt-3 flex flex-col gap-3.5 px-2 pb-2">
                      {/* Presets */}
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="xs"
                          intent={preset === 'balanced' ? 'primary' : 'outline'}
                          onClick={() => applyPreset('balanced')}
                        >
                          Balanced
                        </Button>
                        <Button
                          size="xs"
                          intent={preset === 'creative' ? 'primary' : 'outline'}
                          onClick={() => applyPreset('creative')}
                        >
                          Creative
                        </Button>
                        <Button
                          size="xs"
                          intent={preset === 'precise' ? 'primary' : 'outline'}
                          onClick={() => applyPreset('precise')}
                        >
                          Precise
                        </Button>
                      </div>

                      {/* Temperature Slider */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs font-medium text-muted-fg">
                          <span>Temperature</span>
                          <span className="font-mono font-semibold text-fg">{temp.toFixed(2)}</span>
                        </div>
                        <Slider
                          value={temp}
                          onChange={(v) => setTemp(Array.isArray(v) ? v[0] : v)}
                          minValue={0}
                          maxValue={1}
                          step={0.05}
                          slots={{ output: () => null }}
                        />
                      </div>

                      {/* Max Tokens Slider */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs font-medium text-muted-fg">
                          <span>Max Tokens</span>
                          <span className="font-mono font-semibold text-fg">{maxTokens}</span>
                        </div>
                        <Slider
                          value={maxTokens}
                          onChange={(v) => setMaxTokens(Array.isArray(v) ? v[0] : v)}
                          minValue={256}
                          maxValue={4096}
                          step={128}
                          slots={{ output: () => null }}
                        />
                      </div>

                      {/* Streaming Toggle */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/60">
                        <span className="text-xs font-medium text-fg">Stream Tokens</span>
                        <Switch
                          isSelected={isStreaming}
                          onChange={setIsStreaming}
                        />
                      </div>
                    </div>
                  </ExpandButton.Content>
                </ExpandButton>

                <Button intent="primary">Generate Response</Button>
              </div>

             
            </div>
          )
        }
        return <InteractiveExpandDemo />
      },
    },
  ],
  recipes: [
    {
      title: 'Creating Branded Variants via Button.extend()',
      description: 'Specialize default intent, size, slots, or class names for a design system sub-brand.',
      code: `import { Button } from '@consona/interface'\nimport { Trash2 } from 'lucide-react'\n\nexport const DestructiveButton = Button.extend({\n  name: 'DestructiveButton',\n  props: {\n    intent: 'danger',\n    size: 'sm',\n  },\n  slots: {\n    leftIcon: Trash2,\n  },\n})\n\n// Usage:\n<DestructiveButton>Delete Cluster</DestructiveButton>`
    },
  ]
}
