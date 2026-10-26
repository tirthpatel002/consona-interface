import React from 'react'
import {
  Nav,
  NavList,
  NavItem,
  NavTrigger,
  NavMenu,
  NavbarLink as NavLink,
  NavViewport,
  NavIndicator,
} from '@consona/interface'
import {
  Sparkles,
  Layers,
  Cpu,
  Shield,
  Volume2,
  Compass,
  Code2,
  BookOpen,
  Terminal,
  Activity,
  Zap,
  Sliders,
  ArrowRight,
  Boxes,
  Workflow,
  CheckCircle2,
  ExternalLink,
  Flame,
} from 'lucide-react'
import type { ComponentDocSpec } from '../types'

export const navDoc: ComponentDocSpec = {
  id: 'nav',
  name: 'Nav',
  component: Nav,
  summary:
    'Spring-animated navigation bar focused strictly on NavItems with morphing dropdown viewports and sliding indicators.',
  subcomponents: [
    'NavList',
    'NavItem',
    'NavTrigger',
    'NavMenu',
    'NavContent',
    'NavLink',
    'NavViewport',
    'NavIndicator',
  ],
  playground: {
    defaultProps: {
      viewport: true,
    },
    minHeight: 600,
    controls: [
      {
        name: 'viewport',
        type: 'boolean',
        defaultValue: true,
      },
    ],
    render: (props: any) => (
      <div className="relative flex w-full flex-col items-center justify-start rounded-macro border border-border/40 bg-gradient-to-b from-bg to-secondary/20 p-6">
        <Nav {...props}>
          <NavList>
            <NavItem value="products">
              <NavTrigger icon={<Layers className="size-3.5" />}>Products</NavTrigger>
              <NavMenu>
                <div className="grid w-[460px] grid-cols-2 gap-2 p-3">
                  <NavLink
                    href="#ui"
                    title="Micro-Kernel UI"
                    description="Zero-runtime AST engine on React Aria."
                    icon={<Cpu className="size-4 text-primary" />}
                    badge="V2.0"
                  />
                  <NavLink
                    href="#audio"
                    title="Audio Engine"
                    description="WebAudio FFT visualizers and streams."
                    icon={<Volume2 className="size-4 text-emerald-500" />}
                  />
                  <NavLink
                    href="#orb"
                    title="Liquid Glass Orb"
                    description="WebGPU interactive particle simulator."
                    icon={<Sparkles className="size-4 text-purple-500" />}
                  />
                  <NavLink
                    href="#tour"
                    title="Guided Onboarding"
                    description="Spotlights, beacons, and step tours."
                    icon={<Compass className="size-4 text-amber-500" />}
                  />
                </div>
              </NavMenu>
            </NavItem>

            <NavItem value="developers">
              <NavTrigger icon={<Code2 className="size-3.5" />}>Developers</NavTrigger>
              <NavMenu>
                <div className="flex w-[340px] flex-col gap-1 p-3">
                  <NavLink
                    href="#docs"
                    title="Documentation"
                    description="Deep architectural invariants and guides."
                    icon={<BookOpen className="size-4 text-sky-500" />}
                  />
                  <NavLink
                    href="#registrar"
                    title="AST Registrar"
                    description="High-density token slicing for AI agents."
                    icon={<Terminal className="size-4 text-emerald-400" />}
                  />
                  <NavLink
                    href="#plugins"
                    title="Plugin Registry"
                    description="Pluggable engines and storage adapters."
                    icon={<Sliders className="size-4 text-indigo-400" />}
                  />
                </div>
              </NavMenu>
            </NavItem>

            <NavItem value="enterprise">
              <NavTrigger icon={<Shield className="size-3.5" />}>Enterprise</NavTrigger>
              <NavMenu>
                <div className="flex w-[300px] flex-col gap-1 p-3">
                  <NavLink
                    href="#saif"
                    title="Security & SAIF"
                    description="Zero-trust encryption and compliance."
                    icon={<Shield className="size-4 text-rose-500" />}
                  />
                  <NavLink
                    href="#sla"
                    title="Mission Critical SLA"
                    description="24/7 dedicated support & infrastructure."
                    icon={<Activity className="size-4 text-amber-500" />}
                  />
                </div>
              </NavMenu>
            </NavItem>

            <NavItem value="pricing">
              <NavLink href="#pricing" icon={<Zap className="size-3.5" />}>
                Pricing
              </NavLink>
            </NavItem>
          </NavList>

          {props.viewport && <NavViewport />}
        </Nav>

        <div className="mt-auto flex items-center justify-center pt-8 text-center">
          <p className="max-w-md text-xs text-muted-fg">
            Hover over items to trigger the spring-animated morphing viewport and direction-aware slide transitions.
          </p>
        </div>
      </div>
    ),
  },
  examples: [
    {
      title: 'Hero Spotlight & Feature Cards Mega-Menu',
      description:
        'Custom asymmetric mega-menu layout combining a highlighted release card on the left with categorized links on the right.',
      render: () => (

        <Nav>
          <NavList>
            <NavItem value="platform">
              <NavTrigger icon={<Boxes className="size-3.5" />}>Platform</NavTrigger>
              <NavMenu>
                <div className="flex w-[540px] flex-col p-3 gap-3">
                  <div className="flex gap-3">
                    {/* Left: Highlight Hero Card */}
                    <a
                      href="#v3"
                      className="group/hero relative flex w-48 flex-col justify-between rounded-macro border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent p-3.5 transition-all hover:border-primary/50 hover:shadow-md"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                          <Flame className="size-3" />
                          <span>NEW 3.0</span>
                        </div>
                        <span className="text-sm font-semibold text-fg group-hover/hero:text-primary transition-colors">
                          Zero-Runtime AST Engine
                        </span>
                        <p className="text-[11px] text-muted-fg leading-relaxed">
                          Full-stack kernel with reactive state bridges and instant tokens.
                        </p>
                      </div>
                      <div className="flex items-center gap-1 pt-2 text-xs font-medium text-primary">
                        <span>Explore release</span>
                        <ArrowRight className="size-3.5 transition-transform group-hover/hero:translate-x-1" />
                      </div>
                    </a>

                    {/* Right: Categorized Links */}
                    <div className="flex flex-1 flex-col gap-1.5">
                      <NavLink
                        href="#audio"
                        title="WebAudio FFT Visualizer"
                        description="High-FPS frequency analyzer and waveform recorder."
                        icon={<Volume2 className="size-4 text-emerald-400" />}
                      />
                      <NavLink
                        href="#orb"
                        title="Liquid Glass Shader Orb"
                        description="WebGL particle engine with refraction physics."
                        icon={<Sparkles className="size-4 text-purple-400" />}
                      />
                      <NavLink
                        href="#tour"
                        title="Interactive Onboarding"
                        description="Spotlight tours, beacons, and step checklists."
                        icon={<Compass className="size-4 text-amber-400" />}
                      />
                    </div>
                  </div>

                  {/* Bottom strip */}
                  <div className="flex items-center justify-between border-t border-border/30 pt-2 text-xs text-muted-fg px-1">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                      <CheckCircle2 className="size-3.5" />
                      All 600+ components verified
                    </span>
                    <a href="#changelog" className="inline-flex items-center gap-1 hover:text-fg transition-colors font-medium">
                      <span>Changelog</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>
              </NavMenu>
            </NavItem>

            <NavItem value="solutions">
              <NavTrigger icon={<Workflow className="size-3.5" />}>Solutions</NavTrigger>
              <NavMenu>
                <div className="grid w-[420px] grid-cols-2 gap-2 p-3">
                  <NavLink
                    href="#cloud"
                    title="Cloud Architecture"
                    description="Zero-trust isolation with distributed edge cache."
                    icon={<Shield className="size-4 text-sky-400" />}
                  />
                  <NavLink
                    href="#analytics"
                    title="Real-Time Telemetry"
                    description="Sub-millisecond data pipelines and metrics."
                    icon={<Activity className="size-4 text-rose-400" />}
                  />
                </div>
              </NavMenu>
            </NavItem>

            <NavItem value="pricing">
              <NavLink href="#pricing" icon={<Zap className="size-3.5" />}>
                Pricing
              </NavLink>
            </NavItem>
          </NavList>
          <NavViewport />
        </Nav>

      ),
    },
    {
      title: 'Developer Hub Mega-Menu with Terminal Preview',
      description:
        'Developer-oriented 3-column navigation panel with quick API links, engine references, and an interactive terminal snippet card.',
      render: () => (

        <Nav springStiffness={400} springDamping={28}>
          <NavList>
            <NavItem value="ecosystem">
              <NavTrigger icon={<Code2 className="size-3.5" />}>Ecosystem</NavTrigger>
              <NavMenu>
                <div className="grid w-[620px] grid-cols-3 gap-3 p-3.5">
                  {/* Col 1: Documentation */}
                  <div className="flex flex-col gap-1">
                    <span className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-fg">
                      Architecture
                    </span>
                    <NavLink
                      href="#ast"
                      title="AST Registrar"
                      description="Query engine and token slicing."
                    />
                    <NavLink
                      href="#plugins"
                      title="Plugin System"
                      description="Pluggable engines & adapters."
                    />
                    <NavLink
                      href="#slots"
                      title="Slot Injection"
                      description="Downstream control plane."
                    />
                  </div>

                  {/* Col 2: SDK & APIs */}
                  <div className="flex flex-col gap-1">
                    <span className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-fg">
                      Libraries
                    </span>
                    <NavLink
                      href="#react"
                      title="React Aria"
                      description="Accessible foundation atoms."
                    />
                    <NavLink
                      href="#motion"
                      title="Motion Engine"
                      description="Spring physics & gestures."
                    />
                    <NavLink
                      href="#theme"
                      title="Optical Tokens"
                      description="OKLCH dynamic palettes."
                    />
                  </div>

                  {/* Col 3: Terminal Card */}
                  <div className="flex flex-col justify-between rounded-base border border-border/50 bg-secondary/30 p-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-fg">Quick Install</span>
                        <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <div className="rounded-micro bg-black/80 px-2.5 py-2 font-mono text-[11px] text-emerald-400 selection:bg-emerald-400 selection:text-black">
                        pnpm add @consona/interface
                      </div>
                      <p className="text-[10px] text-muted-fg">
                        Zero-config AST kernel with all 12 domain modules.
                      </p>
                    </div>

                    <a
                      href="https://github.com"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-micro bg-primary px-2.5 py-1 text-xs font-semibold text-primary-fg hover:opacity-90 transition-opacity"
                    >
                      <span>View on GitHub</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>
              </NavMenu>
            </NavItem>

            <NavItem value="status">
              <NavLink href="#status" badge="100% SLA">
                System Health
              </NavLink>
            </NavItem>

            <NavItem value="docs">
              <NavLink href="#docs">
                Documentation
              </NavLink>
            </NavItem>
          </NavList>
          <NavViewport />
        </Nav>

      ),
    },
  ],
  recipes: [
    {
      title: 'Extending Nav with Custom Spring Physics',
      description:
        'Use Rule C3 `.extend()` to define specialized navigation menus with custom spring stiffness and damping.',
      code: `import { Nav } from '@consona/interface'

export const SnappyNav = Nav.extend({
  name: 'SnappyNav',
  props: {
    viewport: true,
    springStiffness: 450,
    springDamping: 24,
  },
})`,
    },
  ],
  a11yNotes: [
    'Semantic `<nav>` container with `role="menubar"` and `role="none"` on list items for standard screen reader navigation.',
    'Triggers provide `aria-haspopup="menu"` and reactive `aria-expanded` attributes.',
    'Automatic keyboard navigation supports Tab focusing, Enter/Space activation, and Escape to dismiss open dropdown viewports.',
    'Focus rings strictly respect `--color-ring` with optical contrast on dark and light surfaces.',
  ],
}

export default navDoc
