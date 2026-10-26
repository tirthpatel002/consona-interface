import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
    Text,
    Badge,
    Button,
    cn,
    type TextVariant,
    type TextAnimation,
    type FontSize,
    type FontWeight,
    type SlideDirection,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'
import {
    RefreshCw,
    Sparkles,
    Bot,
    CheckCircle2,
    ShieldCheck,
    Database,
    Code2,
    Terminal,
    Play,
    ChevronDown,
    ChevronRight,
    User,
    Loader2,
} from 'lucide-react'

export const textDoc: ComponentDocSpec = {
    id: 'text',
    name: 'Text',
    component: Text,
    badge: 'Unified',
    summary:
        'Unified typographic primitive that combines semantic Typography structure (Heading, Strong, Code, Blockquote, Lead) with full Font kinetic capabilities (streaming, slide, scramble, typewriter, gradient, shimmer, etc.). One surface for all text needs.',
    subcomponents: ['Text', 'Text.Heading', 'Text.Strong', 'Text.Code', 'Text.Blockquote', 'Text.Lead'],
    playground: {
        defaultProps: {
            children: 'Consona Interface Text',
            variant: 'default',
            size: 'base',
            weight: 'normal',
            animation: 'none',
            align: 'left',
        },
        controls: [
            { name: 'children', type: 'text', label: 'Content' },
            {
                name: 'variant',
                type: 'select',
                label: 'Variant',
                options: ['default', 'muted', 'subtle', 'accent', 'danger', 'success', 'warning'],
            },
            {
                name: 'size',
                type: 'select',
                label: 'Size',
                options: ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'],
            },
            {
                name: 'weight',
                type: 'select',
                label: 'Weight',
                options: ['normal', 'medium', 'semibold', 'bold'],
            },
            {
                name: 'animation',
                type: 'select',
                label: 'Animation',
                options: [
                    'none', 'stream', 'slide', 'scramble', 'typewriter',
                    'shimmer', 'gradient', 'wavy', 'pulse',
                    'fade-in', 'slide-in', 'slide-left', 'slide-right', 'slide-up', 'slide-down',
                    'lift', 'lift-scale', 'pop-in',
                    'blur-in', 'blur-slide', 'blur-lift',
                ],
            },
            {
                name: 'align',
                type: 'select',
                label: 'Align',
                options: ['left', 'center', 'right'],
            },
        ],
        render: (props: any) => (
            <div className="flex items-center justify-center min-h-[120px] w-full p-space-lg">
                <Text {...props} className={cn('max-w-full break-words', props.className)} />
            </div>
        ),
    },
    examples: [
        {
            title: 'Heading Levels & Semantic Hierarchy',
            description:
                'Text.Heading renders h1-h6 with optical type scale, tracking, and weight defaults baked in. Override any prop freely.',
            render: () => (
                <div className="space-y-4 text-left w-full max-w-xl">
                    <Text.Heading level={1}>Heading 1: Ultra Headline</Text.Heading>
                    <Text.Heading level={2}>Heading 2: Section Title</Text.Heading>
                    <Text.Heading level={3}>Heading 3: Subsection</Text.Heading>
                    <Text.Heading level={4}>Heading 4: Component Group</Text.Heading>
                    <Text.Heading level={5}>Heading 5: Sub-element</Text.Heading>
                    <Text.Heading level={6}>Heading 6: Micro Caption</Text.Heading>
                </div>
            ),
        },
        {
            title: 'Body Text Variants',
            description:
                'The base Text element maps high-level semantic variants (default, muted, subtle, accent, danger, success, warning) to Font intent colors.',
            render: () => (
                <div className="space-y-3 text-left w-full max-w-xl">
                    {(
                        [
                            { variant: 'default', label: 'default', sample: 'Default body copy — core foreground text.' },
                            { variant: 'muted', label: 'muted', sample: 'Muted — secondary descriptive text and metadata.' },
                            { variant: 'subtle', label: 'subtle', sample: 'Subtle — tertiary hints, timestamps, placeholders.' },
                            { variant: 'accent', label: 'accent', sample: 'Accent — highlighted or call-to-action text.' },
                            { variant: 'danger', label: 'danger', sample: 'Danger — error messages and destructive cues.' },
                            { variant: 'success', label: 'success', sample: 'Success — confirmation and positive feedback.' },
                            { variant: 'warning', label: 'warning', sample: 'Warning — caution notices and soft alerts.' },
                        ] as const
                    ).map(({ variant, label, sample }) => (
                        <div key={variant} className="flex items-baseline gap-3">
                            <Badge intent="outline" size="sm" className="font-mono text-[10px] shrink-0 w-16 justify-center">
                                {label}
                            </Badge>
                            <Text variant={variant}>{sample}</Text>
                        </div>
                    ))}
                </div>
            ),
        },
        {
            title: 'Prose Atoms: Lead, Strong, Code & Blockquote',
            description:
                'Text ships compound sub-atoms for rich prose composition — all powered by Font internally and accepting every kinetic prop.',
            render: () => (
                <div className="space-y-4 text-left w-full max-w-xl">
                    <Text.Lead>
                        Consona Interface is a next-generation micro-kernel design system built for high-performance React applications.
                    </Text.Lead>
                    <Text>
                        Components feature mathematical{' '}
                        <Text.Strong as="span">optical token scaling</Text.Strong>
                        {' '}and pluggable domain modules. Install via{' '}
                        <Text.Code as="span">npm i @consona/interface</Text.Code>.
                    </Text>
                    <Text.Blockquote>
                        &ldquo;Good design is as little design as possible.&rdquo; &mdash; Dieter Rams
                    </Text.Blockquote>
                </div>
            ),
        },
        {
            title: 'Kinetic Animations on Any Sub-atom',
            description:
                'Every Text sub-atom — including Heading — accepts the full Font animation prop set: gradient, shimmer, wavy, pulse, scramble, typewriter.',
            render: () => {
                const [replayKey, setReplayKey] = useState(0)
                return (
                    <div className="w-full max-w-3xl flex flex-col gap-space-md">
                        <div className="flex items-center justify-between">
                            <Badge intent="primary" className="text-[10px] font-mono uppercase">
                                Live Animations
                            </Badge>
                            <Button
                                size="xs"
                                intent="secondary"
                                onPress={() => setReplayKey((k) => k + 1)}
                                className="gap-1 text-xs"
                            >
                                <RefreshCw className="size-3" />
                                Replay
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                            {([
                                { label: 'gradient', animation: 'gradient' as TextAnimation, size: '2xl' as FontSize, weight: 'bold' as FontWeight, text: 'Gradient Flow' },
                                { label: 'shimmer', animation: 'shimmer' as TextAnimation, size: '2xl' as FontSize, weight: 'bold' as FontWeight, text: 'Shimmer Wave' },
                                { label: 'wavy', animation: 'wavy' as TextAnimation, size: 'xl' as FontSize, weight: 'semibold' as FontWeight, text: 'Wavy Physics' },
                                { label: 'pulse', animation: 'pulse' as TextAnimation, size: 'xl' as FontSize, weight: 'semibold' as FontWeight, text: 'Pulse Glow' },
                            ]).map(({ label, animation, size, weight, text }) => (
                                <div
                                    key={label}
                                    className="p-space-md rounded-macro border border-border/70 bg-muted/20 flex flex-col gap-2"
                                >
                                    <span className="text-[10px] font-mono text-muted-fg">animation="{label}"</span>
                                    <div className="flex items-center justify-center py-2">
                                        <Text
                                            key={`${label}-${replayKey}`}
                                            animation={animation}
                                            size={size}
                                            weight={weight}
                                            className="tracking-tight select-none text-center"
                                        >
                                            {text}
                                        </Text>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            },
        },
        {
            title: 'Built-in Appearance & Entrance Presets',
            description:
                'Text ships GPU-accelerated entrance animation presets (slide-left, slide-up, blur-in, pop-in, fade-in) requiring zero motion wrappers or Framer Motion boilerplate.',
            render: () => {
                const [replayKey, setReplayKey] = useState(0)
                return (
                    <div className="w-full max-w-3xl flex flex-col gap-space-md">
                        <div className="flex items-center justify-between">
                            <Badge intent="primary" className="text-[10px] font-mono uppercase">
                                Entrance Presets
                            </Badge>
                            <Button
                                size="xs"
                                intent="secondary"
                                onPress={() => setReplayKey((k) => k + 1)}
                                className="gap-1 text-xs"
                            >
                                <RefreshCw className="size-3" />
                                Replay Entrances
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
                            {([
                                { label: 'slide-left', text: 'Slide Left Arrival' },
                                { label: 'slide-right', text: 'Slide Right Arrival' },
                                { label: 'slide-up', text: 'Slide Up Elevation' },
                                { label: 'slide-down', text: 'Slide Down Drop' },
                                { label: 'lift', text: 'Gentle Vertical Lift' },
                                { label: 'lift-scale', text: 'Lift Spring Scaling' },
                                { label: 'pop-in', text: 'Pop Spring Scaling' },
                                { label: 'fade-in', text: 'Gentle Opacity Fade' },
                                { label: 'blur-in', text: 'Optical Blur Resolve' },
                                { label: 'blur-slide', text: 'Optical Motion Blur' },
                                { label: 'blur-lift', text: 'Optical Lift Blur' },
                            ] as const).map(({ label, text }) => (
                                <div
                                    key={label}
                                    className="p-space-md rounded-macro border border-border/70 bg-muted/20 flex flex-col gap-2"
                                >
                                    <span className="text-[10px] font-mono text-muted-fg">animation="{label}"</span>
                                    <div className="flex items-center justify-center py-2 min-h-[48px]">
                                        <Text
                                            key={`${label}-${replayKey}`}
                                            animation={label}
                                            size="sm"
                                            weight="semibold"
                                            className="text-center"
                                        >
                                            {text}
                                        </Text>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            },
        },
        {
            title: 'Heading with Gradient & Slide',
            description:
                'Text.Heading is a semantic HTML element with full kinetic powers — combine gradient or slide animations with heading semantics cleanly.',
            render: () => {
                const [phraseIdx, setPhraseIdx] = useState(0)
                const [direction, setDirection] = useState<SlideDirection>('up')
                const phrases = ['Ship faster.', 'Design smarter.', 'Scale further.', 'Think differently.']

                return (
                    <div className="w-full max-w-2xl flex flex-col gap-space-md">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge intent="outline" className="text-[10px] font-mono uppercase">Direction</Badge>
                            {(['up', 'down', 'left', 'right'] as const).map((dir) => (
                                <Button
                                    key={dir}
                                    size="xs"
                                    intent={direction === dir ? 'primary' : 'outline'}
                                    onPress={() => setDirection(dir)}
                                    className="text-xs capitalize"
                                >
                                    {dir}
                                </Button>
                            ))}
                        </div>
                        <div className="py-8 rounded-macro border border-border/70 bg-muted/20 flex items-center justify-center overflow-hidden">
                            <Text.Heading
                                level={2}
                                slide
                                phrases={phrases}
                                slideDirection={direction}
                                slideInterval={2000}
                                className="text-center"
                            />
                        </div>
                        <div className="py-8 rounded-macro border border-border/70 bg-muted/20 flex items-center justify-center">
                            <Text.Heading level={1} animation="gradient" className="text-center">
                                Consona Interface
                            </Text.Heading>
                        </div>
                    </div>
                )
            },
        },
        {
            title: 'AI Token Streaming on Text.Lead',
            description:
                'Text.Lead accepts stream prop for a progressive AI token streaming effect — great for hero sections and live inference outputs.',
            render: () => {
                const [speed, setSpeed] = useState(20)
                const [replayKey, setReplayKey] = useState(0)
                const [done, setDone] = useState(false)

                const sample =
                    'Consona Interface utilises mathematical optical tokens that automatically cascade across density, radius, and elevation — enabling zero-configuration visual coherence at every scale.'

                return (
                    <div className="w-full max-w-2xl flex flex-col gap-space-md">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                                <Badge intent="primary" className="text-[10px] font-mono uppercase">Speed</Badge>
                                {[{ label: 'Fast', ms: 10 }, { label: 'Normal', ms: 22 }, { label: 'Human', ms: 50 }].map((s) => (
                                    <Button
                                        key={s.ms}
                                        size="xs"
                                        intent={speed === s.ms ? 'primary' : 'outline'}
                                        onPress={() => { setSpeed(s.ms); setReplayKey((k) => k + 1); setDone(false) }}
                                        className="text-xs"
                                    >
                                        {s.label}
                                    </Button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                {done && <Badge intent="success" size="sm" className="text-[10px]">Stream complete</Badge>}
                                <Button
                                    size="xs"
                                    intent="secondary"
                                    onPress={() => { setReplayKey((k) => k + 1); setDone(false) }}
                                    className="gap-1 text-xs"
                                >
                                    <RefreshCw className="size-3" /> Replay
                                </Button>
                            </div>
                        </div>
                        <div className="p-space-lg rounded-macro border border-border/80 bg-muted/20 min-h-[90px] flex items-center">
                            <Text.Lead
                                key={`${speed}-${replayKey}`}
                                stream
                                streamSpeed={speed}
                                onStreamComplete={() => setDone(true)}
                                className="sm:text-lg"
                            >
                                {sample}
                            </Text.Lead>
                        </div>
                    </div>
                )
            },
        },
        {
            title: 'Size & Weight Scale',
            description: 'Text accepts the full Font size ramp (xs → 7xl) and weight scale (thin → black) for precise typographic control.',
            render: () => (
                <div className="space-y-3 text-left w-full max-w-xl">
                    {(['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'] as const).map((size) => (
                        <div key={size} className="flex items-baseline gap-3">
                            <Badge intent="outline" size="sm" className="font-mono text-[10px] shrink-0 w-10 justify-center">
                                {size}
                            </Badge>
                            <Text size={size} variant="default">
                                The quick brown fox — {size}
                            </Text>
                        </div>
                    ))}
                </div>
            ),
        },
        {
            title: 'Live Backend Stream — Append Mode',
            description:
                'Simulates a real AI inference stream: tokens arrive one-by-one and are appended to children. The component never remounts or restarts — it just follows the growing string. Pass streamDone={false} while the server is writing, then flip it to true when the stream ends.',
            render: () => {
                const RESPONSE =
                    'Consona Interface uses a ref-based stable interval for stream mode. ' +
                    'The animation cursor advances character-by-character, reading from a ref that updates on every render. ' +
                    'New tokens from a backend can be appended to the children prop at any rate without restarting the animation. ' +
                    'When your fetch/WebSocket stream closes, set streamDone={true} and onStreamComplete fires.'

                const TOKENS = RESPONSE.match(/.{1,4}/g) ?? [] // simulate 4-char token chunks

                const [text, setText] = useState('')
                const [done, setDone] = useState(false)
                const [running, setRunning] = useState(false)
                const [complete, setComplete] = useState(false)
                const [speed, setSpeed] = useState(60) // token arrival interval ms

                const start = () => {
                    setText('')
                    setDone(false)
                    setRunning(true)
                    setComplete(false)
                    let i = 0
                    const t = setInterval(() => {
                        i++
                        setText(TOKENS.slice(0, i).join(''))
                        if (i >= TOKENS.length) {
                            clearInterval(t)
                            setDone(true)   // ← signal backend done
                            setRunning(false)
                        }
                    }, speed)
                }

                return (
                    <div className="w-full max-w-2xl flex flex-col gap-space-md">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                                <Badge intent="outline" className="text-[10px] font-mono uppercase">Token interval</Badge>
                                {[{ label: '20 ms', ms: 20 }, { label: '60 ms', ms: 60 }, { label: '150 ms', ms: 150 }].map((s) => (
                                    <Button
                                        key={s.ms}
                                        size="xs"
                                        intent={speed === s.ms ? 'primary' : 'outline'}
                                        onPress={() => setSpeed(s.ms)}
                                        className="text-xs"
                                        isDisabled={running}
                                    >
                                        {s.label}
                                    </Button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                {complete && <Badge intent="success" size="sm" className="text-[10px]">Stream complete</Badge>}
                                <Button size="xs" intent={running ? 'secondary' : 'primary'} onPress={start} isDisabled={running} className="gap-1 text-xs">
                                    <RefreshCw className="size-3" />
                                    {running ? 'Streaming…' : 'Start stream'}
                                </Button>
                            </div>
                        </div>

                        {/* Code sample */}
                        <pre className="text-[11px] rounded-macro border border-border bg-muted/40 p-space-md text-muted-fg overflow-x-auto leading-relaxed">
                            {`// Each token: setText(prev => prev + token)
<Text
  stream
  streamDone={isDone}          // false while fetching, true when done
  onStreamComplete={onDone}
>
  {accumulatedText}
</Text>`}
                        </pre>

                        {/* Live demo */}
                        <div className="p-space-lg rounded-macro border border-border/80 bg-muted/20 min-h-[100px] flex items-start">
                            {text || running ? (
                                <Text
                                    stream
                                    streamSpeed={12}
                                    streamDone={done}
                                    onStreamComplete={() => setComplete(true)}
                                    className="leading-relaxed"
                                >
                                    {text}
                                </Text>
                            ) : (
                                <Text variant="subtle" size="sm" className="italic">
                                    Press "Start stream" to simulate a backend response…
                                </Text>
                            )}
                        </div>
                    </div>
                )
            },
        },
        {
            title: 'Real-World AI Agent: Live Action Pipeline & Response Stream',
            description:
                'A production AI assistant interface. As the agent reasons and executes tool calls in the background, new thoughts arrive dynamically over the network. Text displays an active shimmer loading state, transitions smoothly between incoming agent thoughts via slide (interrupting instantly as new steps arrive), and progressively streams the synthesized final response.',
            render: () => {
                type ScenarioKey = 'security' | 'analytics' | 'code'

                interface Scenario {
                    name: string
                    icon: React.ComponentType<{ className?: string }>
                    prompt: string
                    actions: string[]
                    completeText: string
                    response: string
                }

                const SCENARIOS: Record<ScenarioKey, Scenario> = {
                    security: {
                        name: 'Security Audit',
                        icon: ShieldCheck,
                        prompt: 'Audit microservices for zero-trust compliance & certificate expiration.',
                        actions: [
                            '✦ Initializing distributed agent orchestrator...',
                            '🔍 Auditing 64 microservice endpoints & TLS 1.3 handshakes...',
                            '⚡ Testing token refresh vectors & replay vulnerabilities...',
                            '🛡️ Verifying RBAC permission boundaries & KMS envelope keys...',
                            '✨ Synthesizing audit report & post-quantum ciphers...',
                        ],
                        completeText: '✓ Completed all 5 security checks in 1.4s (0 errors)',
                        response:
                            'Security audit complete across all services:\n• Verified 64 microservice endpoints with TLS 1.3 zero-trust handshakes.\n• 0 high/critical vulnerabilities detected across active workloads.\n• Automated PR #142 dispatched to rotate 2 staging certificates.',
                    },
                    analytics: {
                        name: 'Neural Analytics',
                        icon: Database,
                        prompt: 'Forecast Q3 revenue retention & detect contraction anomalies.',
                        actions: [
                            '✦ Ingesting telemetry partitions from BigLake warehouse...',
                            '📈 Training ARIMA time-series regression models...',
                            '🔍 Identifying top 3 revenue contraction cohorts...',
                            '🧠 Generating predictive churn matrix at 99.4% confidence...',
                            '📊 Compiling multi-dimensional visual report...',
                        ],
                        completeText: '✓ Analysis complete. Generated 99.4% confidence forecast.',
                        response:
                            'Neural analytics completed for Q3 telemetry:\n• Net revenue retention projected at 114.2% (+3.8% YoY).\n• Identified 2 seasonal contraction risks in EMEA tier-3 cohorts.\n• Mitigations deployed to protect estimated $140k ARR.',
                    },
                    code: {
                        name: 'Code Architect',
                        icon: Code2,
                        prompt: 'Refactor legacy state store to signal-based atomic getters.',
                        actions: [
                            '✦ Parsing AST syntax tree across 128 module files...',
                            '⚡ Rewriting redundant subscriptions to atomic getters...',
                            '🧪 Running automated unit test suite (342 passing)...',
                            '🔍 Profiling heap memory allocation for zero leak overhead...',
                            '✨ Bundling production-ready tree-shaken package...',
                        ],
                        completeText: '✓ Refactoring finished with 100% snapshot parity (0 regressions)',
                        response:
                            'Architecture refactor successfully completed:\n• AST transform updated 128 legacy files to signal getters.\n• Reduced production bundle footprint by 34.2 kB (-41%).\n• All 342 unit tests passing with 100% snapshot parity.',
                    },
                }

                const [activeKey, setActiveKey] = useState<ScenarioKey>('security')
                const [actions, setActions] = useState<string[]>([])
                const [isExecuting, setIsExecuting] = useState(false)
                const [isComplete, setIsComplete] = useState(false)
                const [showTrace, setShowTrace] = useState(true)
                const [effect, setEffect] = useState<'shimmer' | 'gradient' | 'none'>('shimmer')
                const [intervalMs, setIntervalMs] = useState(1800)
                const timerRef = React.useRef<ReturnType<typeof setInterval> | undefined>(undefined)

                const scenario = SCENARIOS[activeKey]
                const fullActionPool = [...scenario.actions, scenario.completeText]

                const reset = () => {
                    clearInterval(timerRef.current)
                    setActions([])
                    setIsExecuting(false)
                    setIsComplete(false)
                }

                const handleScenarioChange = (key: ScenarioKey) => {
                    reset()
                    setActiveKey(key)
                }

                // Push single action manually (simulate single webhook / push event)
                const pushNextAction = () => {
                    setIsExecuting(true)
                    setActions((prev) => {
                        const nextIdx = prev.length < fullActionPool.length ? prev.length : 0
                        const nextList = [...prev, fullActionPool[nextIdx]!]
                        if (nextList.length >= fullActionPool.length) {
                            setIsExecuting(false)
                            setIsComplete(true)
                        }
                        return nextList
                    })
                }

                // Run full simulated agent flow with authentic pacing
                const runAgent = () => {
                    reset()
                    setIsExecuting(true)
                    let idx = 0
                    timerRef.current = setInterval(() => {
                        idx++
                        setActions(fullActionPool.slice(0, idx))
                        if (idx >= fullActionPool.length) {
                            clearInterval(timerRef.current)
                            setIsExecuting(false)
                            setIsComplete(true)
                        }
                    }, 1100)
                }

                React.useEffect(() => () => clearInterval(timerRef.current), [])

                return (
                    <div className="w-full max-w-2xl flex flex-col gap-space-md">
                        {/* Top Toolbar: Scenario & Effect Options */}
                        <div className="flex flex-wrap items-center justify-between gap-2 p-space-sm rounded-macro bg-muted/20 border border-border/70">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge intent="primary" className="text-[10px] uppercase font-mono py-0 px-1.5">
                                    Agent Preset
                                </Badge>
                                {(Object.keys(SCENARIOS) as ScenarioKey[]).map((key) => {
                                    const item = SCENARIOS[key]
                                    const ItemIcon = item.icon
                                    return (
                                        <Button
                                            key={key}
                                            size="xs"
                                            intent={activeKey === key ? 'primary' : 'outline'}
                                            onPress={() => handleScenarioChange(key)}
                                            className="gap-1 text-xs capitalize"
                                        >
                                            <ItemIcon className="size-3" />
                                            {item.name}
                                        </Button>
                                    )
                                })}
                            </div>

                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-muted-fg font-mono uppercase">Effect:</span>
                                {(['shimmer', 'gradient', 'none'] as const).map((eff) => (
                                    <Button
                                        key={eff}
                                        size="xs"
                                        intent={effect === eff ? 'primary' : 'outline'}
                                        onPress={() => setEffect(eff)}
                                        className="text-xs capitalize"
                                    >
                                        {eff}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Authentic AI Chat Window */}
                        <div className="rounded-macro border border-border/80 bg-surface shadow-xs flex flex-col divide-y divide-border/60 overflow-hidden">
                            {/* Chat Header */}
                            <div className="px-4 py-2.5 bg-muted/20 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="size-2 rounded-full bg-success animate-pulse" />
                                    <Text.Strong size="xs" className="font-mono text-muted-fg">
                                        Consona AI Copilot · {scenario.name}
                                    </Text.Strong>
                                </div>
                                <Badge intent="outline" size="sm" className="text-[10px] font-mono">
                                    v4.2-preview
                                </Badge>
                            </div>

                            {/* Chat Message Thread */}
                            <div className="p-4 sm:p-5 flex flex-col gap-4 bg-surface min-h-[280px]">
                                {/* 1. User Prompt Bubble */}
                                <div className="flex items-start gap-3 justify-end">
                                    <div className="max-w-[85%] rounded-macro bg-primary rounded-tr-xs px-3.5 py-2.5 text-xs text-primary-fg leading-relaxed shadow-xs">
                                        <Text size="xs" weight="medium" className="text-primary-fg">
                                            {scenario.prompt}
                                        </Text>
                                    </div>
                                    <div className="size-7 rounded-full flex items-center justify-center shrink-0 text-primary mt-0.5">
                                        <User className="size-3.5" />
                                    </div>
                                </div>

                                {/* 2. Assistant Response Bubble */}
                                <div className="flex items-start gap-3">
                                    <div className="size-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-primary">
                                        <Bot className="size-3.5" />
                                    </div>

                                    <div className="flex flex-col gap-3 min-w-0 flex-1">
                                        {/* Agent Thought / Tool Execution Accordion Card */}
                                        <div className="rounded-macro border border-border/50 bg-muted/20 flex flex-col overflow-hidden transition-all duration-300">
                                            {/* Thought Header (with Live Sliding Kinetic Action & Shimmer) */}
                                            <div
                                                onClick={() => actions.length > 0 && setShowTrace((s) => !s)}
                                                className={cn(
                                                    'px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs select-none transition-colors duration-200',
                                                    actions.length > 0 && 'cursor-pointer hover:bg-muted/40'
                                                )}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                    {isExecuting ? (
                                                        <Loader2 className="size-3.5 text-primary animate-spin shrink-0" />
                                                    ) : isComplete ? (
                                                        <CheckCircle2 className="size-3.5 text-success shrink-0" />
                                                    ) : (
                                                        <Sparkles className="size-3.5 text-muted-fg shrink-0" />
                                                    )}
                                                    <div className="min-w-0 flex-1 overflow-hidden">
                                                        <Text
                                                            size="xs"
                                                            weight="medium"
                                                            slide={{
                                                                phrases:
                                                                    actions.length > 0
                                                                        ? actions
                                                                        : [isExecuting ? '✦ Initializing agent runtime worker...' : '✦ Ready to dispatch tools...'],
                                                                loop: false,
                                                                interval: intervalMs,
                                                                interrupt: true,
                                                            }}
                                                            slideDirection="up"
                                                            animation={isExecuting && effect !== 'none' ? effect : undefined}
                                                            className="font-mono text-muted-fg block truncate"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    {actions.length > 0 && (
                                                        <Badge
                                                            intent={isComplete ? 'success' : 'primary'}
                                                            size="sm"
                                                            className="text-[10px] font-mono px-1.5 py-0"
                                                        >
                                                            {isComplete ? 'Complete' : `${actions.length}/${fullActionPool.length}`}
                                                        </Badge>
                                                    )}
                                                    {actions.length > 0 && (
                                                        <div className="text-muted-fg transition-transform duration-200">
                                                            {showTrace ? (
                                                                <ChevronDown className="size-3.5" />
                                                            ) : (
                                                                <ChevronRight className="size-3.5" />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Expanded Action Trace Drawer with AnimatePresence */}
                                            <AnimatePresence>
                                                {showTrace && actions.length > 0 && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                                        className="px-3.5 pb-3 pt-2 border-t border-border/40 bg-surface/50 font-mono text-[11px] overflow-hidden"
                                                    >
                                                        <div className="relative pl-3 border-l border-border/50 flex flex-col gap-2">
                                                            {actions.map((act, i) => {
                                                                const isLatest = isExecuting && i === actions.length - 1
                                                                return (
                                                                    <div key={act} className="flex items-center gap-2.5 text-muted-fg/80">
                                                                        <div className="size-3.5 flex items-center justify-center shrink-0">
                                                                            {isLatest ? (
                                                                                <Loader2 className="size-3 text-primary/90 animate-spin" />
                                                                            ) : (
                                                                                <CheckCircle2 className="size-3 text-success/80" />
                                                                            )}
                                                                        </div>
                                                                        <Text
                                                                            as="span"
                                                                            size="xs"
                                                                            weight={isLatest ? 'medium' : 'normal'}
                                                                            animation="slide-left"
                                                                            variant={isLatest ? 'default' : 'muted'}
                                                                            className="truncate font-mono text-[11px] transition-colors duration-300"
                                                                        >
                                                                            {act}
                                                                        </Text>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Assistant Final Streamed Prose Response with Built-in Animation */}
                                        {isComplete && (
                                            <div className="flex flex-col gap-2 pt-1 text-xs sm:text-sm text-fg leading-relaxed">
                                                <Text stream streamSpeed={12} animation="fade-in" className="whitespace-pre-line leading-relaxed font-sans text-xs">
                                                    {scenario.response}
                                                </Text>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Chat Input Bar at Bottom */}
                            <div className="p-2.5 sm:p-3 bg-muted/15 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                                <div className="flex items-center gap-2 flex-1 px-3 py-1.5 rounded-macro border border-border/70 bg-surface text-xs text-muted-fg min-w-0">
                                    <Terminal className="size-3.5 text-muted-fg shrink-0" />
                                    <span className="truncate">{scenario.prompt}</span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    <Button
                                        size="xs"
                                        intent="outline"
                                        onPress={pushNextAction}
                                        className="text-xs"
                                    >
                                        + Push Step
                                    </Button>
                                    <Button
                                        size="xs"
                                        intent="primary"
                                        onPress={runAgent}
                                        isDisabled={isExecuting}
                                        className="gap-1 text-xs"
                                    >
                                        <Play className={cn('size-3', isExecuting && 'animate-spin')} />
                                        {isExecuting ? 'Running…' : 'Run Agent'}
                                    </Button>
                                    {(actions.length > 0 || isComplete) && (
                                        <Button size="xs" intent="outline" onPress={reset} className="text-xs">
                                            Reset
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Production Code Reference */}
                        <pre className="text-[11px] rounded-macro border border-border bg-muted/40 p-space-md text-muted-fg overflow-x-auto leading-relaxed">
                            {`// 1. Sliding Thought / Reasoning Card:
<Text
  size="xs"
  slide={{ phrases: incomingActions, loop: false, interval: 1800, interrupt: true }}
  animation="shimmer"
/>

// 2. Progressive AI Output Stream:
<Text stream streamSpeed={12}>
  {synthesizedResponse}
</Text>`}
                        </pre>
                    </div>
                )
            },
        },
    ],
}
