import React from 'react'
import {
  BentoGrid,
  BentoCard,
  BentoRow,
  Badge,
  Button,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'
import {
  SparklesIcon,
  BoltIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  CubeTransparentIcon,
  CommandLineIcon,
  CpuChipIcon,
  ArrowTrendingUpIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/20/solid'

export const bentoGridDoc: ComponentDocSpec = {
  id: 'bento-grid',
  name: 'BentoGrid',
  component: BentoGrid,
  summary:
    'Modern responsive asymmetrical bento grid and row layout engine with multi-breakpoint spans, declarative row bands, customizable row heights, and hover elevation.',
  subcomponents: ['BentoCard', 'BentoRow'],
  playground: {
    defaultProps: {
      cols: 3,
      rowHeight: 'md',
      gap: 'md',
    },
    controls: [
      { name: 'cols', type: 'number', min: 1, max: 4, step: 1 },
      {
        name: 'rowHeight',
        type: 'select',
        options: ['xs', 'sm', 'md', 'lg', 'xl', 'auto'],
      },
      {
        name: 'gap',
        type: 'select',
        options: ['none', 'xs', 'sm', 'md', 'lg', 'xl'],
      },
    ],
    render: (props: any) => (
      <div className="w-full max-w-4xl p-2 sm:p-4">
        <BentoGrid {...props}>
          <BentoCard
            colSpan={2}
            icon={<SparklesIcon className="size-5" />}
            badge={<Badge intent="primary">AI Native</Badge>}
            title="Generative Interface Engine"
            description="Dynamically construct and validate accessible user interfaces directly from typed component contracts with real-time feedback."
            cta={<Button size="sm" intent="primary">Explore Engine</Button>}
          />
          <BentoCard
            colSpan={1}
            icon={<BoltIcon className="size-5" />}
            badge={<Badge intent="accent">Sub-10ms</Badge>}
            title="Zero Latency"
            description="Synchronous external store updates with zero React re-rendering during high-frequency mutations."
          />
          <BentoCard
            colSpan={1}
            icon={<ShieldCheckIcon className="size-5" />}
            title="Full A11y Standards"
            description="WCAG AA compliant keyboard accessibility across all primitives."
          />
          <BentoCard
            colSpan={2}
            icon={<ChartBarIcon className="size-5" />}
            title="Real-time Observability"
            description="High-frequency metrics instrumentation with integrated status tracking and telemetry."
            cta={<Button size="sm" intent="outline">View Metrics</Button>}
          />
        </BentoGrid>
      </div>
    ),
  },
  examples: [
    {
      title: 'Row-Structured Bento Layout (BentoGrid.Row)',
      description:
        'Declarative row coordination with BentoGrid.Row where each row defines its own responsive column partition, height, and content rhythm.',
      render: () => (
        <div className="w-full max-w-4xl flex flex-col gap-space-md">
          <BentoGrid gap="md" rowHeight="auto">
            {/* Row 1: Spotlight Hero Row (2 columns: 65% / 35%) */}
            <BentoGrid.Row cols={3} rowHeight="md">
              <BentoCard
                colSpan={2}
                variant="glow"
                header={
                  <div className="h-28 w-full rounded-base bg-gradient-to-tr from-primary/40 via-accent/30 to-secondary/20 p-4 flex flex-col justify-end">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                      Architecture Tier 1
                    </span>
                    <span className="text-lg font-bold text-fg">Unified Canvas & Physics Pipeline</span>
                  </div>
                }
                title="Micro-Kernel Substrate"
                description="Deterministic state machines paired with WebGL and audio rendering engines."
                cta={<Button size="sm" intent="primary">Get Started</Button>}
              />
              <BentoCard
                colSpan={1}
                variant="interactive"
                icon={<CpuChipIcon className="size-5" />}
                badge={<Badge intent="success">99.99%</Badge>}
                title="Sub-ms Runtime"
                description="Zero overhead micro-task dispatching with direct event bus hooks."
                footer={<span>Updated 2m ago</span>}
              />
            </BentoGrid.Row>

            {/* Row 2: Triple Feature Band (3 columns) */}
            <BentoGrid.Row cols={3} rowHeight="sm">
              <BentoCard
                colSpan={1}
                icon={<CubeTransparentIcon className="size-5" />}
                title="Glass Physics"
                description="Dynamic OKLCH backdrop refraction shaders."
              />
              <BentoCard
                colSpan={1}
                icon={<CommandLineIcon className="size-5" />}
                title="CLI & AST Tools"
                description="Instant schema generation from source AST."
              />
              <BentoCard
                colSpan={1}
                icon={<ArrowTrendingUpIcon className="size-5" />}
                title="Auto Analytics"
                description="Built-in event telemetry across all UI atoms."
              />
            </BentoGrid.Row>

            {/* Row 3: Full-width Bottom Banner (1 column) */}
            <BentoGrid.Row cols={1} rowHeight="auto">
              <BentoCard
                variant="subtle"
                icon={<CloudArrowUpIcon className="size-5" />}
                badge={<Badge intent="warning">Enterprise</Badge>}
                title="Autonomous Edge Deployment"
                description="Deploy self-contained interface packages directly to global edge networks with zero runtime configuration."
                cta={<Button size="sm" intent="secondary">Deploy Now</Button>}
                footer={<span>Supports AWS, Cloudflare & Vercel Edge</span>}
              />
            </BentoGrid.Row>
          </BentoGrid>
        </div>
      ),
    },
    {
      title: 'Responsive Breakpoint Spans & 2D Grid',
      description:
        'Cards configured with responsive column and row spans adapting smoothly from mobile to widescreen viewports.',
      render: () => (
        <div className="w-full max-w-4xl">
          <BentoGrid
            cols={{ initial: 1, sm: 2, lg: 4 }}
            rowHeight="md"
            gap="md"
          >
            <BentoCard
              colSpan={{ initial: 1, sm: 2, lg: 2 }}
              rowSpan={{ initial: 1, md: 2 }}
              variant="glow"
              header={
                <div className="h-36 w-full rounded-base bg-gradient-to-br from-accent/30 via-primary/20 to-transparent p-4 flex items-center justify-center">
                  <SparklesIcon className="size-12 text-primary animate-pulse" />
                </div>
              }
              title="Adaptive Layout Matrix"
              description="Spans 2 columns and 2 rows on large screens, automatically collapsing down on mobile."
              cta={<Button size="sm" intent="primary">View Docs</Button>}
            />
            <BentoCard
              colSpan={{ initial: 1, sm: 2, lg: 2 }}
              icon={<BoltIcon className="size-5" />}
              title="Instant Sync"
              description="High throughput state synchronization."
            />
            <BentoCard
              colSpan={{ initial: 1, sm: 1, lg: 1 }}
              icon={<ShieldCheckIcon className="size-5" />}
              title="Encrypted"
              description="End-to-end cryptographic state security."
            />
            <BentoCard
              colSpan={{ initial: 1, sm: 1, lg: 1 }}
              icon={<ChartBarIcon className="size-5" />}
              title="Telemetry"
              description="Live telemetry streaming."
            />
          </BentoGrid>
        </div>
      ),
    },
    {
      title: 'Surface Variants & Interactive Elevation',
      description:
        'BentoCard supports multiple visual variants: glow, subtle, bordered, flat, and interactive.',
      render: () => (
        <div className="w-full max-w-4xl">
          <BentoGrid cols={{ initial: 1, sm: 2, md: 3 }} rowHeight="sm" gap="sm">
            <BentoCard
              variant="glow"
              icon={<SparklesIcon className="size-5" />}
              title="Glow Variant"
              description="Subtle primary border glow and backdrop blur."
            />
            <BentoCard
              variant="subtle"
              icon={<CubeTransparentIcon className="size-5" />}
              title="Subtle Variant"
              description="Muted secondary background surface."
            />
            <BentoCard
              variant="interactive"
              icon={<BoltIcon className="size-5" />}
              title="Interactive Variant"
              description="Hover elevation, border highlight, and click dynamics."
            />
            <BentoCard
              variant="bordered"
              icon={<ShieldCheckIcon className="size-5" />}
              title="Bordered Variant"
              description="Clean transparent background with crisp stroke."
            />
            <BentoCard
              variant="flat"
              icon={<CommandLineIcon className="size-5" />}
              title="Flat Variant"
              description="Borderless muted background pad."
            />
            <BentoCard
              variant="default"
              icon={<ChartBarIcon className="size-5" />}
              title="Default Variant"
              description="Standard card surface with macro radius."
            />
          </BentoGrid>
        </div>
      ),
    },
    {
      title: 'Custom Children & Full-Bleed Imagery (Zero Default Props)',
      description:
        'When downstream wants total compositional freedom without using any of BentoCard’s built-in icon, title, description, or CTA props, simply pass JSX children (and optionally padding="none" for edge-to-edge Unsplash imagery).',
      render: () => (
        <div className="w-full max-w-4xl">
          <BentoGrid cols={{ initial: 1, sm: 2, lg: 3 }} rowHeight="lg" gap="md">
            {/* 1. Full-bleed Unsplash Image Card with Glassmorphic Overlay */}
            <BentoCard
              colSpan={{ initial: 1, sm: 2, lg: 2 }}
              padding="none"
              className="relative group overflow-hidden border-border/70 text-white"
            >
              <img
                src="https://images.unsplash.com/photo-1645219502014-88689d94096a?q=80&w=2239&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Abstract 3D Fluid Art"
                className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              <div className="relative z-10 mt-auto flex flex-col gap-3 p-space-xl">
                <div className="flex items-center gap-2">
                  <Badge intent="primary" size="sm" className="bg-white/20 text-white border-white/30 backdrop-blur-md">
                    Featured
                  </Badge>
                  <span className="text-xs text-white/70 font-mono">
                    4K Resolution
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-xl font-bold text-white tracking-tight">
                    Dynamic Shading & Refraction Matrix
                  </h4>
                  <p className="text-sm text-white/80 leading-relaxed max-w-md">
                    Custom fluid canvas render pipeline utilizing OKLCH spectral mixing.
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button size="sm" intent="primary" className="bg-white text-zinc-950 hover:bg-white/90 border-transparent shadow-xs font-medium">
                    Launch Interactive Canvas
                  </Button>
                  <Button size="sm" intent="outline" className="border-white/30 text-white hover:bg-white/15 backdrop-blur-xs">
                    Source Code
                  </Button>
                </div>
              </div>
            </BentoCard>

            {/* 2. Custom Live Metric & Telemetry Panel (Custom Children) */}
            <BentoCard
              colSpan={1}
              variant="glow"
              padding="lg"
              className="flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                  Live Telemetry
                </span>
                <span className="flex size-2 rounded-full bg-success animate-ping" />
              </div>

              <div className="my-auto flex flex-col gap-2 py-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold tracking-tight text-fg font-mono">
                    99.98%
                  </span>
                  <span className="text-xs font-semibold text-success">
                    +0.4%
                  </span>
                </div>
                <span className="text-xs text-muted-fg">
                  Sub-millisecond external store frame delivery rate
                </span>

                <div className="mt-3 flex gap-1 h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full w-[78%]" />
                  <div className="h-full bg-accent rounded-full w-[16%]" />
                </div>
              </div>

              <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-fg font-mono">
                <span>Buffer: 128MB</span>
                <span className="text-fg font-medium">Synced</span>
              </div>
            </BentoCard>

            {/* 3. Unsplash Photographic Spotlight Card */}
            <BentoCard
              colSpan={1}
              padding="none"
              className="relative group overflow-hidden"
            >
              <img
                src="https://images.unsplash.com/photo-1520549233664-03f65c1d1327?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="3D Glass Spheres"
                className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              <div className="relative z-10 mt-auto p-space-lg flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-black/60 uppercase tracking-wider">
                  Optical Geometry
                </span>
                <p className="text-base font-bold text-black">
                  Sub-pixel Glass Morphism
                </p>
              </div>
            </BentoCard>

            {/* 4. Custom Interactive Terminal / Snippet Widget */}
            <BentoCard
              colSpan={{ initial: 1, sm: 2, lg: 2 }}
              variant="bordered"
              padding="lg"
              className="bg-muted/20 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-rose-500/80" />
                  <div className="size-2.5 rounded-full bg-amber-500/80" />
                  <div className="size-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono text-muted-fg">
                    terminal ~ bento-layout
                  </span>
                </div>
                <Badge intent="outline" size="sm">
                  zsh
                </Badge>
              </div>

              <div className="font-mono text-xs text-muted-fg py-4 flex flex-col gap-2">
                <p className="text-fg font-semibold">
                  $ npx consona-cli add bento-grid
                </p>
                <p className="text-success">
                  ✔ Installed @consona/interface/bento-grid
                </p>
                <p className="text-muted-fg">
                  ℹ Responsive rows, multi-breakpoint spans, and slot overrides active.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <span className="text-xs text-muted-fg">
                  Zero configuration required
                </span>
                <Button size="sm" intent="plain">
                  Copy Snippet
                </Button>
              </div>
            </BentoCard>
          </BentoGrid>
        </div>
      ),
    },
  ],
}
