import React, { useRef, useState } from 'react'
import {
  Button,
  Badge,
  SpotlightOverlay,
  AnchoredCallout,
  FeatureBeacon,
  OverlayFocus,
  OverlayProvider,
  useOverlay,
  cn,
  type OverlayPlacement,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

/* ==========================================================================
   Overlay Component Playground & Examples
   ========================================================================== */

export const spotlightOverlayDoc: ComponentDocSpec = {
  id: 'spotlight-overlay',
  name: 'SpotlightOverlay',
  badge: 'Overlay',
  summary:
    'Hardware-accelerated dynamic SVG mask spotlight overlay with optical cutout paths, backdrop blur, collision detection, and multi-target grouping.',
  subcomponents: ['SpotlightOverlay', 'AnchoredCallout', 'FeatureBeacon', 'OverlayFocus'],
  playground: {
    defaultProps: {
      shape: 'rounded-rect',
      padding: 8,
      radius: 12,
      backdropBlur: true,
      interactive: false,
      variant: 'cutout',
    },
    controls: [
      {
        name: 'shape',
        label: 'Cutout Shape',
        type: 'select',
        options: ['rounded-rect', 'circle', 'pill'],
        defaultValue: 'rounded-rect',
      },
      {
        name: 'variant',
        label: 'Overlay Variant',
        type: 'select',
        options: ['cutout', 'ring', 'dim'],
        defaultValue: 'cutout',
      },
      {
        name: 'padding',
        label: 'Padding (px)',
        type: 'number',
        min: 0,
        max: 32,
        step: 2,
        defaultValue: 8,
      },
      {
        name: 'radius',
        label: 'Border Radius (px)',
        type: 'number',
        min: 0,
        max: 32,
        step: 2,
        defaultValue: 12,
      },
      {
        name: 'backdropBlur',
        label: 'Backdrop Blur',
        type: 'boolean',
        defaultValue: true,
      },
      {
        name: 'interactive',
        label: 'Interactive Target',
        type: 'boolean',
        defaultValue: false,
      },
    ],
    render: (props) => {
      const [active, setActive] = useState(false)
      const targetRef = useRef<HTMLDivElement>(null)

      return (
        <div className="flex flex-col items-center justify-center p-8 gap-6 w-full min-h-[300px]">
          <div
            ref={targetRef}
            className="flex items-center gap-4 p-5 rounded-2xl border border-border bg-card/80 shadow-md max-w-sm"
          >
            <div className="relative size-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              AI
            
            </div>
            <div>
              <div className="text-sm font-semibold text-fg">Spotlight Target Element</div>
              <div className="text-xs text-muted-fg">Click toggle to activate dynamic mask</div>
            </div>
          </div>

          <Button intent="primary" onClick={() => setActive(!active)}>
            {active ? 'Dismiss Spotlight' : 'Activate Spotlight'}
          </Button>

          <SpotlightOverlay
            target={targetRef}
            active={active}
            shape={props.shape}
            variant={props.variant}
            padding={props.padding}
            radius={props.radius}
            backdropBlur={props.backdropBlur}
            interactive={props.interactive}
            onBackdropClick={() => setActive(false)}
          />
        </div>
      )
    },
  },
  examples: [
    {
      id: 'spotlight-shapes',
      title: 'Concentric Corner Radius Sync & Shape Auto-Matching',
      description:
        'SpotlightOverlay automatically extracts the target DOM element\'s computed border-radius and computes concentric cutout curves using R_outer = R_inner + padding, guaranteeing optically uniform margin curves.',
      render: () => {
        const [activeSpotlight, setActiveSpotlight] = useState<'sharp' | 'card' | 'pill' | 'circle' | null>(null)
        const [padding, setPadding] = useState(10)
        const sharpRef = useRef<HTMLDivElement>(null)
        const cardRef = useRef<HTMLDivElement>(null)
        const pillRef = useRef<HTMLButtonElement>(null)
        const circleRef = useRef<HTMLDivElement>(null)

        const targets = {
          sharp: sharpRef,
          card: cardRef,
          pill: pillRef,
          circle: circleRef,
        }

        return (
          <div className="flex flex-col gap-6 p-4 w-full">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold text-fg">Spotlight Target:</span>
              {(['sharp', 'card', 'pill', 'circle'] as const).map((key) => (
                <Button
                  key={key}
                  size="xs"
                  intent={activeSpotlight === key ? 'primary' : 'plain'}
                  onClick={() => setActiveSpotlight(activeSpotlight === key ? null : key)}
                >
                  {key === 'sharp' && 'Sharp Rect (r=0)'}
                  {key === 'card' && 'Card (r=16px)'}
                  {key === 'pill' && 'Pill Button (r=9999px)'}
                  {key === 'circle' && 'Circle Avatar (50%)'}
                </Button>
              ))}

              <div className="flex items-center gap-2 ml-auto text-xs bg-muted/30 px-2 py-1 rounded-lg border border-border">
                <span className="text-muted-fg font-mono">Padding: {padding}px</span>
                <Button size="xs" intent="plain" onClick={() => setPadding(Math.max(4, padding - 2))}>-</Button>
                <Button size="xs" intent="plain" onClick={() => setPadding(Math.min(24, padding + 2))}>+</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div
                ref={sharpRef}
                className="p-4 rounded-none border border-border bg-card shadow-xs flex flex-col gap-1.5"
              >
                <span className="text-xs font-bold text-fg">0px Sharp Corner</span>
                <span className="text-[11px] text-muted-fg font-mono">border-radius: 0px</span>
                <div className="text-[11px] text-muted-fg">Cutout automatically calculates sharp 90° corner.</div>
              </div>

              <div
                ref={cardRef}
                className="p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col gap-1.5"
              >
                <span className="text-xs font-bold text-fg">16px Card Corner</span>
                <span className="text-[11px] text-muted-fg font-mono">border-radius: 16px</span>
                <div className="text-[11px] text-muted-fg">Cutout radius = 16 + {padding} = {16 + padding}px concentric curve.</div>
              </div>

              <div className="flex flex-col justify-center items-start gap-2 p-4 rounded-2xl border border-border bg-card/60">
                <Button ref={pillRef} size="sm" intent="primary" className="rounded-full px-4">
                  🚀 Pill Action
                </Button>
                <span className="text-[11px] text-muted-fg font-mono">border-radius: 9999px</span>
              </div>

              <div
               
                className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card/60"
              >
                <div ref={circleRef} className="relative size-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  CP
                </div>
                <div>
                  <div className="text-xs font-semibold text-fg">Circle 50%</div>
                  <div className="text-[11px] text-muted-fg font-mono">border-radius: 50%</div>
                </div>
              </div>
            </div>

            {activeSpotlight && (
              <SpotlightOverlay
                target={targets[activeSpotlight]}
                active={Boolean(activeSpotlight)}
                radius="auto"
                padding={padding}
                backdropBlur
                onBackdropClick={() => setActiveSpotlight(null)}
              />
            )}
          </div>
        )
      },
    },
    {
      id: 'multi-target',
      title: 'Multi-Target Spotlight',
      description: 'Simultaneous compound spotlight highlighting multiple elements with a single SVG mask.',
      render: () => {
        const [multiOpen, setMultiOpen] = useState(false)
        const nodeA = useRef<HTMLDivElement>(null)
        const nodeB = useRef<HTMLDivElement>(null)

        return (
          <div className="flex flex-col gap-4 p-4 w-full">
            <Button
              size="sm"
              intent={multiOpen ? 'primary' : 'outline'}
              onClick={() => setMultiOpen(!multiOpen)}
            >
              ✨ Highlight Both Nodes
            </Button>

            <div className="flex items-center justify-between gap-6 p-6 rounded-2xl border border-border bg-card/40">
              <div ref={nodeA} className="p-4 rounded-xl border border-border bg-card shadow-sm">
                <div className="text-xs font-semibold text-fg">Node Alpha</div>
                <div className="text-[11px] text-muted-fg">Ingestion Cluster</div>
              </div>

              <div className="h-px flex-1 bg-border/60 border-t border-dashed border-border" />

              <div ref={nodeB} className="p-4 rounded-xl border border-border bg-card shadow-sm">
                <div className="text-xs font-semibold text-fg">Node Beta</div>
                <div className="text-[11px] text-muted-fg">Vector Index</div>
              </div>
            </div>

            <SpotlightOverlay
              target={[nodeA, nodeB]}
              active={multiOpen}
              padding={6}
              backdropBlur
              onBackdropClick={() => setMultiOpen(false)}
            />
          </div>
        )
      },
    },
    {
      id: 'anchored-callout',
      title: '12-Placement Anchored Callout',
      description:
        'Collision-aware floating card positioned relative to target element with clamped pointer arrows.',
      render: () => {
        const [calloutOpen, setCalloutOpen] = useState(false)
        const [placement, setPlacement] = useState<OverlayPlacement>('bottom')
        const anchorRef = useRef<HTMLDivElement>(null)

        return (
          <div className="flex flex-col items-center justify-center p-8 gap-6 w-full min-h-[320px]">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                intent={calloutOpen ? 'primary' : 'outline'}
                onClick={() => setCalloutOpen(!calloutOpen)}
              >
                📌 {calloutOpen ? 'Hide Callout' : 'Show Anchored Callout'}
              </Button>

              <div className="flex items-center gap-1">
                {(['top', 'bottom', 'left', 'right'] as const).map((p) => (
                  <Button
                    key={p}
                    size="xs"
                    intent={placement === p ? 'primary' : 'outline'}
                    onClick={() => setPlacement(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>

            <div
              ref={anchorRef}
              className="p-6 rounded-2xl border-2 border-dashed border-primary/50 bg-primary/10 flex flex-col items-center gap-2"
            >
              <div className="text-sm font-semibold text-fg">Target Anchor</div>
              <div className="text-xs text-muted-fg">Placement: {placement}</div>
            </div>

            <AnchoredCallout
              target={anchorRef}
              open={calloutOpen}
              placement={placement}
              offset={12}
              cardWidth={300}
            >
              <div className="p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-fg m-0">Collision-Aware Callout</h4>
                  <button
                    type="button"
                    onClick={() => setCalloutOpen(false)}
                    className="text-muted-fg hover:text-fg text-xs p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-muted-fg m-0">
                  Calculates sub-pixel placement with automatic boundary collision flipping and clamped pointer arrows.
                </p>
                <div className="flex items-center justify-between pt-2">
                  <Badge intent="primary" size="sm">
                    {placement}
                  </Badge>
                  <Button size="xs" intent="primary" onClick={() => setCalloutOpen(false)}>
                    Got it
                  </Button>
                </div>
              </div>
            </AnchoredCallout>
          </div>
        )
      },
    },
    {
      id: 'feature-beacon',
      title: 'Feature Beacons & Pulsing Indicators',
      description: 'Animated radar and beacon badges to guide user attention to unvisited actions.',
      render: () => {
        return (
          <div className="flex items-center gap-8 p-6 flex-wrap">
            <div className="relative flex items-center gap-2 p-3 rounded-xl border border-border bg-card">
              <span className="text-xs font-medium text-fg">New Analytics</span>
              <FeatureBeacon intent="primary" size="md" />
            </div>

            <div className="relative flex items-center gap-2 p-3 rounded-xl border border-border bg-card">
              <span className="text-xs font-medium text-fg">Live Stream</span>
              <FeatureBeacon intent="success" size="md" pulse />
            </div>

            <div className="relative flex items-center gap-2 p-3 rounded-xl border border-border bg-card">
              <span className="text-xs font-medium text-fg">Security Alert</span>
              <FeatureBeacon intent="danger" size="md" />
            </div>

            <div className="relative flex items-center gap-2 p-3 rounded-xl border border-border bg-card">
              <span className="text-xs font-medium text-fg">Warning</span>
              <FeatureBeacon intent="warning" size="md" />
            </div>
          </div>
        )
      },
    },
    {
      id: 'overlay-focus',
      title: 'Overlay Focus & Downstream Target Customization',
      description:
        'Declarative focus layer that spotlights target elements with SVG cutout masks while allowing downstream consumers to apply custom styling, border colors, badges, or rings to the focused target.',
      render: () => {
        const [focused, setFocused] = useState(false)
        const [targetEdit, setTargetEdit] = useState<'danger-border' | 'primary-glow' | 'warning-ring' | 'clean-cutout'>('primary-glow')
        const [blurEnabled, setBlurEnabled] = useState(true)
        const targetRef = useRef<HTMLDivElement>(null)

        const editStyles: Record<string, { className: string; description: string; badgeIntent: 'danger' | 'primary' | 'warning' | 'outline' }> = {
          'primary-glow': {
            className: 'border-primary ring-4 ring-primary/30 shadow-xl shadow-primary/20 transition-all duration-300',
            description: 'Target styled with accent primary border and glowing focus ring.',
            badgeIntent: 'primary',
          },
          'danger-border': {
            className: 'border-danger ring-4 ring-danger/30 shadow-xl shadow-danger/20 transition-all duration-300 bg-danger/5',
            description: 'Target styled with critical error red border and attention alert tint.',
            badgeIntent: 'danger',
          },
          'warning-ring': {
            className: 'border-warning ring-4 ring-warning/30 shadow-xl shadow-warning/20 transition-all duration-300',
            description: 'Target styled with amber warning ring for pending action items.',
            badgeIntent: 'warning',
          },
          'clean-cutout': {
            className: 'transition-all duration-300',
            description: 'Clean unstyled target cutout with pure spotlight contrast.',
            badgeIntent: 'outline',
          },
        }

        const currentEdit = editStyles[targetEdit]

        return (
          <div className="flex flex-col gap-4 p-4 w-full">
            <div className="flex items-center gap-3 flex-wrap">
              <Button size="sm" intent={focused ? 'primary' : 'outline'} onClick={() => setFocused(!focused)}>
                {focused ? 'Clear Focus' : 'Highlight Element'}
              </Button>

              <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border border-border text-xs">
                <span className="text-muted-fg px-2 font-mono">Target Edit:</span>
                {(['primary-glow', 'danger-border', 'warning-ring', 'clean-cutout'] as const).map((styleKey) => (
                  <Button
                    key={styleKey}
                    size="xs"
                    intent={targetEdit === styleKey ? 'primary' : 'plain'}
                    onClick={() => setTargetEdit(styleKey)}
                  >
                    {styleKey.replace('-', ' ')}
                  </Button>
                ))}
              </div>

              <Button
                size="xs"
                intent={blurEnabled ? 'secondary' : 'outline'}
                onClick={() => setBlurEnabled(!blurEnabled)}
              >
                {blurEnabled ? 'Backdrop Blur: ON' : 'Backdrop Blur: OFF'}
              </Button>
            </div>

            <div
              ref={targetRef}
              className={cn(
                'p-6 rounded-2xl border bg-card flex flex-col gap-2 max-w-md relative z-[1]',
                focused ? currentEdit.className : 'border-border'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-fg">Critical Configuration Card</div>
                {focused && (
                  <Badge size="sm" intent={currentEdit.badgeIntent}>
                    {targetEdit}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-fg">
                {currentEdit.description} Notice that the target remains 100% sharp and unblurred even when backdrop blur is active.
              </div>
            </div>

            <OverlayFocus
              target={targetRef}
              active={focused}
              backdropBlur={blurEnabled}
              padding={8}
              onClickBackdrop={() => setFocused(false)}
            >
              <div className="p-3.5 bg-card border border-border rounded-xl shadow-2xl text-xs flex flex-col gap-2">
                <div className="font-semibold text-fg flex items-center justify-between">
                  <span>Downstream Target Edit</span>
                  <Badge size="sm" intent={currentEdit.badgeIntent}>{targetEdit}</Badge>
                </div>
                <p className="text-muted-fg m-0">
                  {currentEdit.description} The backdrop is dimmed and blurred while this element stays interactive.
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-muted-fg font-mono">Click backdrop to dismiss</span>
                  <Button size="xs" intent="primary" onClick={() => setFocused(false)}>
                    Dismiss
                  </Button>
                </div>
              </div>
            </OverlayFocus>
          </div>
        )
      },
    },
    {
      id: 'selector-multi-target',
      title: 'ID & Multi-Node Selector Query Targeting',
      description:
        'SpotlightOverlay and OverlayFocus seamlessly query the DOM by ID (#my-id) or class (.multi-item), creating multiple cutout holes or compound spotlights across several elements without needing React refs.',
      render: () => {
        const [activeSelector, setActiveSelector] = useState<string | null>(null)
        const [targetMode, setTargetMode] = useState<'single-id' | 'multi-class' | 'compound-array'>('multi-class')

        const selectorMap = {
          'single-id': '#doc-server-card',
          'multi-class': '.doc-spotlight-card',
          'compound-array': ['#doc-server-card', '#doc-database-card'] as any,
        }

        const isOverlayActive = activeSelector !== null

        return (
          <div className="flex flex-col gap-4 p-4 w-full">
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                size="sm"
                intent={isOverlayActive ? 'primary' : 'outline'}
                onClick={() => {
                  if (isOverlayActive) {
                    setActiveSelector(null)
                  } else {
                    setActiveSelector(selectorMap[targetMode])
                  }
                }}
              >
                {isOverlayActive ? 'Clear Selector Overlay' : `Spotlight (${targetMode})`}
              </Button>

              <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border border-border text-xs">
                <span className="text-muted-fg px-2 font-mono">Query Mode:</span>
                {(['multi-class', 'single-id', 'compound-array'] as const).map((mode) => (
                  <Button
                    key={mode}
                    size="xs"
                    intent={targetMode === mode ? 'primary' : 'plain'}
                    onClick={() => {
                      setTargetMode(mode)
                      if (isOverlayActive) {
                        setActiveSelector(selectorMap[mode])
                      }
                    }}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                id="doc-server-card"
                className="doc-spotlight-card p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col gap-2 transition-all hover:border-primary/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-fg">API Edge Server</span>
                  <Badge size="sm" intent="success">Online</Badge>
                </div>
                <div className="text-[11px] text-muted-fg font-mono">ID: #doc-server-card</div>
                <div className="text-xs text-muted-fg">Matches class .doc-spotlight-card and unique #doc-server-card ID.</div>
              </div>

              <div
                id="doc-database-card"
                className="doc-spotlight-card p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col gap-2 transition-all hover:border-primary/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-fg">Cluster DB Replica</span>
                  <Badge size="sm" intent="primary">Primary</Badge>
                </div>
                <div className="text-[11px] text-muted-fg font-mono">ID: #doc-database-card</div>
                <div className="text-xs text-muted-fg">Queried alongside server card in multi-node and array modes.</div>
              </div>

              <div
                id="doc-worker-card"
                className="doc-spotlight-card p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col gap-2 transition-all hover:border-primary/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-fg">Queue Workers</span>
                  <Badge size="sm" intent="warning">8 Active</Badge>
                </div>
                <div className="text-[11px] text-muted-fg font-mono">ID: #doc-worker-card</div>
                <div className="text-xs text-muted-fg">Third node highlighted automatically via .doc-spotlight-card selector query.</div>
              </div>
            </div>

            {isOverlayActive && (
              <SpotlightOverlay
                target={activeSelector}
                active={isOverlayActive}
                variant="cutout"
                padding={8}
                onBackdropClick={() => setActiveSelector(null)}
              />
            )}
          </div>
        )
      },
    },
  ],
}

export const overlayDoc = spotlightOverlayDoc
export const anchoredCalloutDoc = spotlightOverlayDoc
export const featureBeaconDoc = spotlightOverlayDoc
export const overlayFocusDoc = spotlightOverlayDoc
