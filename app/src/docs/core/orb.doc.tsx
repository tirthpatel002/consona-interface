import React, { useState } from 'react'
import {
  Orb,
  Button,
  Badge,
  Card,
  CardContent,
  type StyleName,
  type OrbStateName,
  styleNames,
} from '@consona/interface'
import {
  Sparkles,
  Play,
  Pause,
  Sliders,
  Cpu,
  Layers,
  Activity,
  Zap,
} from 'lucide-react'
import type { ComponentDocSpec } from '../types'

export const orbDoc: ComponentDocSpec = {
  id: 'orb',
  name: 'Orb',
  subpath: '@consona/interface/orb',
  badge: 'WebGPU 3D Shader',
  summary:
    'Real-time procedural WebGPU liquid glass orb with signed-distance boundary refraction, curated optical flow programs, spectral chromatic dispersion, and fluid caustics.',
  subcomponents: ['Orb'],
  playground: {
    defaultProps: {
      styleName: 'chrome' as StyleName,
      state: 'thinking' as OrbStateName,
      speed: 1.5,
      radius: 0.75,
      glassEnabled: true,
      glassOpacity: 1.0,
      sheen: 1.2,
      gloss: 1.0,
      size: 260,
    },
    controls: [
      {
        name: 'styleName',
        label: 'Style Preset',
        type: 'select',
        options: [
          'chrome',
          'gold',
          'champagneGold',
          'roseGold',
          'emerald',
          'blueFlame',
          'siri',
          'voiceWave',
          'aurora',
          'plasma',
          'frost',
          'blueDrop',
          'violetEmber',
          'refractiveBlob',
          'amber',
        ],
        defaultValue: 'chrome',
        description: 'Curated optical flow program preset.',
      },
      {
        name: 'state',
        label: 'State Profile',
        type: 'select',
        options: ['thinking', 'idle'],
        defaultValue: 'thinking',
        description: 'Active animation and color temperature profile.',
      },
      {
        name: 'glassEnabled',
        label: 'Glass Shell Enabled',
        type: 'boolean',
        defaultValue: true,
        description: 'Toggle outer refractive liquid glass contour envelope.',
      },
      {
        name: 'glassOpacity',
        label: 'Glass Refraction Opacity',
        type: 'number',
        min: 0.0,
        max: 1.0,
        step: 0.05,
        defaultValue: 1.0,
        description: 'Refraction depth and optical rim opacity of the glass shell.',
      },
      {
        name: 'sheen',
        label: 'Glass Sheen & Highlights',
        type: 'number',
        min: 0.0,
        max: 2.0,
        step: 0.1,
        defaultValue: 1.2,
        description: 'Intensity of directional key & fill specular highlights.',
      },
      {
        name: 'gloss',
        label: 'Chromatic Dispersion Gloss',
        type: 'number',
        min: 0.0,
        max: 2.0,
        step: 0.1,
        defaultValue: 1.0,
        description: 'Spectral red/green/blue ray separation along the glass edge.',
      },
      {
        name: 'speed',
        label: 'Speed Multiplier',
        type: 'number',
        min: 0.2,
        max: 4.0,
        step: 0.1,
        defaultValue: 1.5,
        description: 'Fluid motion phase speed multiplier.',
      },
      {
        name: 'radius',
        label: 'Sphere Radius',
        type: 'number',
        min: 0.3,
        max: 0.95,
        step: 0.05,
        defaultValue: 0.75,
        description: 'Normalized sphere radius ratio.',
      },
    ],
    render: (props) => (
      <div className="flex flex-col items-center justify-center p-space-8 w-full">
        <div className="relative flex items-center justify-center p-space-6 rounded-macro bg-bg border border-border/60 shadow-subtle">
          <Orb
            styleName={props.styleName}
            state={props.state}
            speed={props.speed}
            radius={props.radius}
            glassEnabled={props.glassEnabled}
            glassOpacity={props.glassOpacity}
            sheen={props.sheen}
            gloss={props.gloss}
            size={props.size ?? 260}
          />
        </div>
      </div>
    ),
    code: `<Orb
  styleName="chrome"
  state="thinking"
  glassEnabled={true}
  glassOpacity={1.0}
  sheen={1.2}
  gloss={1.0}
  speed={1.5}
  radius={0.75}
  size={260}
/>`,
  },
  examples: [
    {
      id: 'presets-showcase',
      title: 'Curated Flow Style Programs',
      description:
        'The Liquid Glass Orb includes 11 carefully crafted shader programs with custom fluid curl dynamics, color ramps, and caustics.',
      render: function PresetsShowcase() {
        const [selectedStyle, setSelectedStyle] = useState<StyleName>('siri')
        const [orbState, setOrbState] = useState<OrbStateName>('thinking')

        return (
          <div className="flex flex-col gap-space-6 w-full max-w-4xl mx-auto">
            {/* Style Selector Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1.5 rounded-macro bg-bg border border-border/60">
              {styleNames.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedStyle(name)}
                  className={`px-space-3 py-space-1.5 text-xs font-medium rounded-base transition-all ${selectedStyle === name
                      ? 'bg-primary text-primary-fg shadow-xs'
                      : 'text-muted-fg hover:text-fg hover:bg-muted/40'
                    }`}
                >
                  {name}
                </button>
              ))}
            </div>

            {/* Central Display Canvas */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-space-6 p-space-8 rounded-macro bg-bg border border-border shadow-soft overflow-hidden">
              <div className="flex flex-col gap-space-3 max-w-md">
                <div className="flex items-center gap-space-2">
                  <Badge intent="primary" size="sm">
                    {selectedStyle}
                  </Badge>
                  <Badge intent={orbState === 'thinking' ? 'success' : 'secondary'} size="sm">
                    {orbState}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-fg capitalize tracking-tight">
                  {selectedStyle} Shader Dynamic
                </h3>
                <p className="text-xs text-muted-fg leading-relaxed">
                  Real-time procedural raymarching with signed distance fields, internal fluid noise displacement, and dynamic specular reflection.
                </p>
                <div className="flex items-center gap-space-3 mt-space-2">
                  <Button
                    size="sm"
                    intent={orbState === 'thinking' ? 'primary' : 'outline'}
                    onClick={() => setOrbState('thinking')}
                  >
                    Thinking State
                  </Button>
                  <Button
                    size="sm"
                    intent={orbState === 'idle' ? 'primary' : 'outline'}
                    onClick={() => setOrbState('idle')}
                  >
                    Idle State
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-center p-space-4 rounded-macro bg-bg border border-border/40 shadow-inner">
                <Orb
                  styleName={selectedStyle}
                  state={orbState}
                  size={240}
                  speed={selectedStyle === 'aurora' ? 2 : 1.2}
                />
              </div>
            </div>
          </div>
        )
      },
      code: `const [style, setStyle] = useState<StyleName>('siri')
const [state, setState] = useState<OrbStateName>('thinking')

<Orb
  styleName={style}
  state={state}
  size={240}
  speed={1.2}
/>`,
    },
    {
      id: 'state-transitions',
      title: 'State Transition Dynamics (Idle vs Thinking)',
      description:
        'Orbs smoothly interpolate numeric parameters and linear-light RGB channels when switching between idle and thinking state profiles.',
      render: function StateTransitionsDemo() {
        const [state, setState] = useState<OrbStateName>('thinking')

        return (
          <div className="flex flex-col items-center gap-space-6 w-full max-w-3xl mx-auto p-space-6 rounded-macro bg-bg border border-border">
            <div className="flex items-center gap-space-4">
              <Button
                intent={state === 'thinking' ? 'primary' : 'outline'}
                onClick={() => setState('thinking')}
              >
                <Zap className="w-4 h-4 mr-1.5" />
                Thinking (High Energy)
              </Button>
              <Button
                intent={state === 'idle' ? 'secondary' : 'outline'}
                onClick={() => setState('idle')}
              >
                <Activity className="w-4 h-4 mr-1.5" />
                Idle (Calm & Low Power)
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-6 w-full mt-space-4">
              <div className="flex flex-col items-center gap-space-3 p-space-6 rounded-macro bg-bg border border-border/50 text-center">
                <Orb styleName="voiceWave" state={state} size={180} transitionDuration={0.8} />
                <span className="text-xs font-semibold text-fg mt-space-2">VoiceWave Dynamic</span>
                <span className="text-[11px] text-muted-fg font-mono">Profile: {state}</span>
              </div>
              <div className="flex flex-col items-center gap-space-3 p-space-6 rounded-macro bg-bg border border-border/50 text-center">
                <Orb styleName="blueDrop" state={state} size={180} transitionDuration={0.8} />
                <span className="text-xs font-semibold text-fg mt-space-2">BlueDrop Dynamic</span>
                <span className="text-[11px] text-muted-fg font-mono">Profile: {state}</span>
              </div>
            </div>
          </div>
        )
      },
      code: `const [state, setState] = useState<'idle' | 'thinking'>('thinking')

<Orb
  styleName="voiceWave"
  state={state}
  size={180}
  transitionDuration={0.8}
/>`,
    },
    {
      id: 'assistant-widget',
      title: 'AI Voice Assistant Widget Composite',
      description:
        'Embedding the liquid orb into a floating conversational assistant pill with responsive audio indicators.',
      render: function AssistantWidgetDemo() {
        const [isListening, setIsListening] = useState(false)

        return (
          <div className="flex flex-col items-center justify-center p-space-8 w-full">
            <div className="w-full max-w-md p-space-6 rounded-macro bg-bg border border-border shadow-soft flex flex-col items-center text-center gap-space-4">
              <div className="relative">
                <Orb
                  styleName={'chrome'}
                  state={isListening ? 'thinking' : 'idle'}
                  speed={isListening ? 2.2 : 0.8}
                  size={140}
                />
                <div className="absolute -bottom-1 -right-1">
                  <Badge intent={isListening ? 'success' : 'secondary'} size="sm">
                    {isListening ? 'Listening...' : 'Standby'}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col gap-space-1">
                <h4 className="text-sm font-semibold text-fg">Consona Intelligence</h4>
                <p className="text-xs text-muted-fg">
                  {isListening
                    ? 'Processing multi-modal speech tokens in real-time...'
                    : 'Tap the button below to start interactive voice session.'}
                </p>
              </div>

              <Button
                intent={isListening ? 'danger' : 'primary'}
                size="sm"
                onClick={() => setIsListening(!isListening)}
                className="mt-space-2 w-full"
              >
                {isListening ? 'End Conversation' : 'Talk with Consona'}
              </Button>
            </div>
          </div>
        )
      },
      code: `<Orb
  styleName={isListening ? 'plasma' : 'chrome'}
  state={isListening ? 'thinking' : 'idle'}
  speed={isListening ? 2.2 : 0.8}
  size={140}
/>`,
    },
  ],
  recipes: [
    {
      title: 'WebGPU Fallback & Graceful Degradation',
      description:
        'When WebGPU is unsupported (or disabled in flags), the component displays a fallback message or custom slot without crashing.',
      code: `<Orb
  styleName="chrome"
  fallback={
    <div className="p-4 rounded-macro bg-muted text-xs text-muted-fg text-center">
      WebGPU is required for liquid glass shaders.
    </div>
  }
/>`,
    },
    {
      title: 'Dynamic State Transitions with Durations',
      description:
        'Control how quickly the orb speeds up when activated vs how gently it calms back down to idle.',
      code: `<Orb
  styleName="siri"
  state={isThinking ? 'thinking' : 'idle'}
  activationDuration={0.22}
  transitionDuration={0.65}
/>`,
    },
  ],
  a11yNotes: [
    'The rendered <canvas> carries an aria-label indicating the active style program and current animation state.',
    'Render passes automatically pause when the tab is hidden or when the canvas scrolls out of viewport via IntersectionObserver.',
    'Graceful fallback slot for environments lacking WebGPU support.',
  ],
}
