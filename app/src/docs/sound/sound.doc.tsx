import React, { useEffect, useRef, useState } from 'react'
import {
  Badge,
  Button,
  ButtonGroup,
  SoundTrigger,
  useContinuousSound,
  useCursorSound,
  useDragSound,
  useDynamicSound,
  useKeySound,
  useScrollSound,
  useSound,
  useSoundFeedback,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  MousePointerClick,
  CheckCircle2,
  AlertOctagon,
  Keyboard,
  Sliders,
  Radio,
  ArrowRight,
  FolderOpen,
  FolderClosed,
  Zap,
  Layers,
  Wand2,
  Wind,
  Timer,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  Check,
  Activity,
  Search,
  Compass,
  CircleDot,
  ToggleLeft,
  Music,
  Lock,
  Crosshair,
  Waves,
  Heart,
  Bell,
  Infinity as InfinityIcon,
  PlayCircle,
  StopCircle,
  Move,
  ArrowDownUp,
  MousePointer,
  RotateCw,
} from 'lucide-react'
import { SOUND_REGISTRY } from '../../../../src/modules/sound/engine/recipes'
import type { SoundEmphasis, SoundName } from '../../../../src/modules/sound/engine/types'

/* ==========================================================================
   Sound Metadata & Full Catalog (All 36 Cues: 9 Canonical + 19 Expressive FX + 8 Continuous Loops)
   ========================================================================== */

interface CueMeta {
  cue: SoundName
  category: 'canonical' | 'expressive' | 'continuous'
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const CUES_CATALOG: CueMeta[] = [
  // --- 9 Canonical Semantic Interaction Cues ---
  {
    cue: 'tap',
    category: 'canonical',
    label: 'Tap',
    description: 'Crisp, tactile acoustic impulse for primary clicks and button presses.',
    icon: MousePointerClick,
  },
  {
    cue: 'type',
    category: 'canonical',
    label: 'Type',
    description: 'Short percussive keystroke click with subtle mechanical resonance.',
    icon: Keyboard,
  },
  {
    cue: 'select',
    category: 'canonical',
    label: 'Select',
    description: 'Bright acoustic chime for items, radio buttons, and table rows.',
    icon: Radio,
  },
  {
    cue: 'toggle',
    category: 'canonical',
    label: 'Toggle',
    description: 'Dual-phase bi-tonal click for switches, checkboxes, and boolean states.',
    icon: Sliders,
  },
  {
    cue: 'open',
    category: 'canonical',
    label: 'Open',
    description: 'Ascending airy whoosh for expanding accordions, menus, modals, and drawers.',
    icon: FolderOpen,
  },
  {
    cue: 'close',
    category: 'canonical',
    label: 'Close',
    description: 'Descending resonant latch for collapsing views, closing dialogs, and dismissals.',
    icon: FolderClosed,
  },
  {
    cue: 'success',
    category: 'canonical',
    label: 'Success',
    description: 'Uplifting harmonic chime for completed operations and validations.',
    icon: CheckCircle2,
  },
  {
    cue: 'error',
    category: 'canonical',
    label: 'Error',
    description: 'Low warning knock / descending tone for invalid actions and errors.',
    icon: AlertOctagon,
  },
  {
    cue: 'navigate',
    category: 'canonical',
    label: 'Navigate',
    description: 'Smooth directional acoustic swipe for page transitions and tab changes.',
    icon: ArrowRight,
  },
  {
    cue: 'notification',
    category: 'canonical',
    label: 'Notification',
    description: 'Ethereal double chime for toasts, priority alerts, incoming messages, and status badges.',
    icon: Bell,
  },

  // --- 11 Expressive Sound FX ---
  {
    cue: 'bloom',
    category: 'expressive',
    label: 'Bloom',
    description: 'Rich resonant chord swell for deep modal transitions and unlocks.',
    icon: Layers,
  },
  {
    cue: 'droplet',
    category: 'expressive',
    label: 'Droplet',
    description: 'Organic liquid pitch bend for fluid UI interactions and pull-to-refresh.',
    icon: Zap,
  },
  {
    cue: 'chord',
    category: 'expressive',
    label: 'Chord',
    description: 'Lush polyphonic three-note harmonic triad for major accomplishments.',
    icon: Music,
  },
  {
    cue: 'lock',
    category: 'expressive',
    label: 'Lock',
    description: 'Solid mechanical deadbolt engage for secure authorization actions.',
    icon: Lock,
  },
  {
    cue: 'laser',
    category: 'expressive',
    label: 'Laser',
    description: 'High-frequency futuristic downward chirp for fast action triggers.',
    icon: Crosshair,
  },
  {
    cue: 'ready',
    category: 'expressive',
    label: 'Ready',
    description: 'Warm rising arpeggio indicating initialization complete.',
    icon: Check,
  },
  {
    cue: 'scan',
    category: 'expressive',
    label: 'Scan',
    description: 'Triple-tone optical sonar sweep for detection and discovery routines.',
    icon: Search,
  },
  {
    cue: 'arrival',
    category: 'expressive',
    label: 'Arrival',
    description: 'Majestic descending harmonic swell for incoming messages or payloads.',
    icon: Compass,
  },
  {
    cue: 'whoosh',
    category: 'expressive',
    label: 'Whoosh',
    description: 'Fast cinematic spatial whoosh for rapid swipes, drags, and flings.',
    icon: Wind,
  },
  {
    cue: 'press',
    category: 'expressive',
    label: 'Press',
    description: 'Heavy mechanical down-stroke actuation impulse.',
    icon: ArrowDownCircle,
  },
  {
    cue: 'release',
    category: 'expressive',
    label: 'Release',
    description: 'Crisp tactile key cap spring return release.',
    icon: ArrowUpCircle,
  },

  // --- 8 Continuous & Infinite Sustained Sound Loops ---
  {
    cue: 'loading-hum',
    category: 'continuous',
    label: 'Loading Hum',
    description: 'Warm harmonic multi-sine sub-drone with 0.15Hz subtle LFO breathing and shimmer tail.',
    icon: Waves,
  },
  {
    cue: 'radar-pulse',
    category: 'continuous',
    label: 'Radar Pulse',
    description: 'Rhythmic spatial sonar sweep repeating at 0.9s intervals with shimmering echoes.',
    icon: Search,
  },
  {
    cue: 'beam-laser',
    category: 'continuous',
    label: 'Beam Laser',
    description: 'High-energy sci-fi continuous laser buzz with 8.5Hz vibrato and bandpass noise flutter.',
    icon: Crosshair,
  },
  {
    cue: 'focus-noise',
    category: 'continuous',
    label: 'Focus Noise',
    description: 'Deep soothing brown/pink continuous noise bed with gentle 0.08Hz breathing filter sweeps.',
    icon: Sliders,
  },
  {
    cue: 'alarm-beacon',
    category: 'continuous',
    label: 'Alarm Beacon',
    description: 'Alternating dual-tone warning beacon repeating at 0.65s intervals for alerts and monitors.',
    icon: Bell,
  },
  {
    cue: 'ticker-stream',
    category: 'continuous',
    label: 'Ticker Stream',
    description: 'Ultra-fast generative micro-clicks for streaming AI tokens, data processing, and live feeds.',
    icon: Activity,
  },
  {
    cue: 'wind-ambient',
    category: 'continuous',
    label: 'Wind Ambient',
    description: 'Continuous atmospheric filtered air noise with dynamic resonant LFO wind swells.',
    icon: Wind,
  },
  {
    cue: 'heartbeat',
    category: 'continuous',
    label: 'Heartbeat',
    description: 'Resonant sub-bass dual-pulse lub-dub repeating continuously at physiological 70 BPM.',
    icon: Heart,
  },
]

/* ==========================================================================
   Sound Interactive Showcase & Playgrounds
   ========================================================================== */

function SoundExplorerPlayground() {
  const {
    play,
    start,
    stop,
    stopAll,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    enabled,
    activeContinuousCount,
    activeContinuousCues,
    isContinuousPlaying,
  } = useSound()

  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'canonical' | 'expressive' | 'continuous'
  >('all')
  const [activeEmphasis, setActiveEmphasis] = useState<SoundEmphasis>('normal')
  const [selectedTtl, setSelectedTtl] = useState<number | undefined>(undefined)
  const [recentlyPlayed, setRecentlyPlayed] = useState<string | null>(null)
  const [lastCode, setLastCode] = useState<string>('play("tap")')

  const canonicalCount = CUES_CATALOG.filter((c) => c.category === 'canonical').length
  const expressiveCount = CUES_CATALOG.filter((c) => c.category === 'expressive').length
  const continuousCount = CUES_CATALOG.filter((c) => c.category === 'continuous').length

  const handlePlayCue = (cue: SoundName, variant?: string) => {
    const isDef = !variant || variant === 'default'
    const targetVariant = isDef ? undefined : variant
    play(cue, {
      variant: targetVariant,
      emphasis: activeEmphasis,
    })

    const key = `${cue}${targetVariant ? `:${targetVariant}` : ''}`
    setRecentlyPlayed(key)
    setTimeout(() => setRecentlyPlayed((prev) => (prev === key ? null : prev)), 400)

    if (targetVariant) {
      setLastCode(`play("${cue}", { variant: "${targetVariant}", emphasis: "${activeEmphasis}" })`)
    } else {
      setLastCode(`play("${cue}", { emphasis: "${activeEmphasis}" })`)
    }
  }

  const handleStartContinuous = (cue: SoundName, variant?: string) => {
    const isDef = !variant || variant === 'default'
    const targetVariant = isDef ? undefined : variant

    start(cue, {
      variant: targetVariant,
      emphasis: activeEmphasis,
      ttl: selectedTtl,
    })

    const key = `${cue}${targetVariant ? `:${targetVariant}` : ''}`
    setRecentlyPlayed(key)
    setTimeout(() => setRecentlyPlayed((prev) => (prev === key ? null : prev)), 400)

    if (selectedTtl) {
      setLastCode(`start("${cue}", { ttl: ${selectedTtl}${targetVariant ? `, variant: "${targetVariant}"` : ''} })`)
    } else {
      setLastCode(`const handle = start("${cue}"${targetVariant ? `, { variant: "${targetVariant}" }` : ''}); // handle.stop()`)
    }
  }

  const handleStopCue = (cue: SoundName) => {
    stop(cue)
    setRecentlyPlayed(null)
    setLastCode(`stop("${cue}")`)
  }

  const filteredCues = CUES_CATALOG.filter((item) => {
    if (selectedCategory === 'all') return true
    return item.category === selectedCategory
  })

  return (
    <div className="flex flex-col gap-6 w-full text-fg">
      {/* Top Test Bench Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 bg-card text-card-fg border border-border rounded-macro shadow-xs">
        {/* Left: Master Mute & Volume */}
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            intent={isMuted || !enabled ? 'danger' : 'secondary'}
            onClick={toggleMute}
            className="cursor-pointer gap-2"
          >
            {isMuted || !enabled ? (
              <>
                <VolumeX className="w-4 h-4" />
                <span>Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>Audio Active</span>
              </>
            )}
          </Button>

          {/* Volume Slider */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-border">
            <span className="text-xs font-mono text-muted-fg w-8">Vol:</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              className="w-24 md:w-32 h-1.5 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
            />
            <span className="text-xs font-mono font-medium text-fg w-10">
              {Math.round(volume * 100)}%
            </span>
          </div>

          {activeContinuousCount > 0 && (
            <div className="flex items-center gap-2 pl-3 border-l border-border">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
              <span className="text-xs font-mono font-semibold text-primary">
                {activeContinuousCount} Loop{activeContinuousCount !== 1 ? 's' : ''} Playing
              </span>
              <Button
                size="xs"
                intent="danger"
                onClick={() => stopAll()}
                className="text-[10px] px-2 py-0.5 ml-1"
              >
                Stop All
              </Button>
            </div>
          )}
        </div>

        {/* Right: Emphasis Level Tester & TTL Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* TTL Preset selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-fg">TTL:</span>
            <ButtonGroup>
              {[
                { label: 'Inf', val: undefined },
                { label: '3s', val: 3000 },
                { label: '6s', val: 6000 },
                { label: '10s', val: 10000 },
              ].map((item) => (
                <Button
                  key={item.label}
                  size="xs"
                  intent={selectedTtl === item.val ? 'primary' : 'plain'}
                  onClick={() => setSelectedTtl(item.val)}
                  className="font-mono text-[11px]"
                >
                  {item.label}
                </Button>
              ))}
            </ButtonGroup>
          </div>

          {/* Emphasis */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-fg">Emphasis:</span>
            <ButtonGroup>
              {(['subtle', 'normal', 'strong'] as SoundEmphasis[]).map((emp) => (
                <Button
                  key={emp}
                  size="xs"
                  intent={activeEmphasis === emp ? 'primary' : 'plain'}
                  onClick={() => setActiveEmphasis(emp)}
                  className="capitalize"
                >
                  {emp}
                </Button>
              ))}
            </ButtonGroup>
          </div>
        </div>
      </div>

      {/* Category Tabs & Code Inspector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <ButtonGroup>
          <Button
            size="sm"
            intent={selectedCategory === 'all' ? 'primary' : 'plain'}
            onClick={() => setSelectedCategory('all')}
          >
            All Cues ({CUES_CATALOG.length})
          </Button>
          <Button
            size="sm"
            intent={selectedCategory === 'canonical' ? 'primary' : 'plain'}
            onClick={() => setSelectedCategory('canonical')}
          >
            Canonical ({canonicalCount})
          </Button>
          <Button
            size="sm"
            intent={selectedCategory === 'expressive' ? 'primary' : 'plain'}
            onClick={() => setSelectedCategory('expressive')}
          >
            Expressive FX ({expressiveCount})
          </Button>
          <Button
            size="sm"
            intent={selectedCategory === 'continuous' ? 'primary' : 'plain'}
            onClick={() => setSelectedCategory('continuous')}
            className="gap-1.5"
          >
            <InfinityIcon className="w-3.5 h-3.5" />
            <span>Continuous Loops ({continuousCount})</span>
          </Button>
        </ButtonGroup>

        <div className="flex items-center gap-2 text-xs font-mono bg-secondary text-secondary-fg px-3 py-1.5 rounded-micro border border-border">
          <span className="font-semibold text-fg">Latest:</span>
          <code>{lastCode}</code>
        </div>
      </div>

      {/* Cues and Variants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
        {filteredCues.map((item) => {
          const Icon = item.icon
          const isContinuous = item.category === 'continuous'
          const isPlayingLoop = isContinuous && isContinuousPlaying(item.cue)
          const isBasePlaying = isContinuous ? isPlayingLoop : recentlyPlayed === item.cue
          const definition = SOUND_REGISTRY[item.cue]
          const variantKeys = definition?.variants ? Object.keys(definition.variants) : []
          const allVariants = ['default', ...variantKeys]

          return (
            <div
              key={item.cue}
              className={`flex flex-col justify-between p-4 bg-card text-card-fg border rounded-macro transition-all shadow-xs ${
                isPlayingLoop
                  ? 'border-primary/80 ring-2 ring-primary/20 bg-primary/[0.03]'
                  : 'border-border hover:border-border-hover'
              }`}
            >
              {/* Header */}
              <div className="flex flex-col gap-2.5">
                <div className="flex flex-wrap items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`p-2 rounded-base transition-colors shrink-0 ${
                        isBasePlaying
                          ? 'bg-primary text-primary-fg shadow-xs'
                          : 'bg-secondary text-secondary-fg'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-semibold capitalize text-fg truncate">
                          {item.label}
                        </h4>
                        {item.category === 'expressive' && (
                          <Badge intent="secondary" size="sm" className="text-[10px] px-1.5 py-0">
                            FX
                          </Badge>
                        )}
                        {item.category === 'continuous' && (
                          <Badge
                            intent={isPlayingLoop ? 'primary' : 'secondary'}
                            size="sm"
                            className="text-[10px] px-1.5 py-0 gap-1"
                          >
                            <InfinityIcon className="w-2.5 h-2.5" />
                            <span>{isPlayingLoop ? 'Active Loop' : 'Continuous'}</span>
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-muted-fg block truncate">
                        cue: "{item.cue}"
                      </span>
                    </div>
                  </div>

                  {/* Primary Trigger Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isContinuous ? (
                      isPlayingLoop ? (
                        <Button
                          size="xs"
                          intent="danger"
                          onClick={() => handleStopCue(item.cue)}
                          className="cursor-pointer gap-1 text-xs"
                        >
                          <Square className="w-3 h-3 fill-current" />
                          <span>Stop</span>
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Button
                            size="xs"
                            intent="primary"
                            onClick={() => handleStartContinuous(item.cue)}
                            className="cursor-pointer gap-1 text-xs"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>{selectedTtl ? `Start (${selectedTtl / 1000}s)` : 'Start'}</span>
                          </Button>
                          <SoundTrigger
                            event="hold"
                            cue={item.cue}
                            intent="outline"
                            size="xs"
                            className="text-[11px] px-2 cursor-pointer select-none"
                          >
                            Hold
                          </SoundTrigger>
                        </div>
                      )
                    ) : (
                      <Button
                        size="xs"
                        intent="secondary"
                        onClick={() => handlePlayCue(item.cue)}
                        className="cursor-pointer gap-1 text-xs"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Play</span>
                      </Button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted-fg leading-relaxed">
                  {item.description}
                </p>

                {/* Characteristics badge for continuous sounds */}
                {isContinuous && definition?.default && (
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono text-muted-fg bg-secondary/60 px-2 py-1 rounded-micro border border-border/50">
                    <span className="text-fg font-semibold">Engine:</span>
                    <span>
                      {definition.default.layers.map((l) => l.kind).join(' + ')}
                    </span>
                    {definition.default.shimmer && <span className="text-primary">• Shimmer FDN</span>}
                  </div>
                )}
              </div>

              {/* Variants Section */}
              <div className="mt-3.5 pt-3 border-t border-border flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted-fg uppercase tracking-wider">
                    Acoustic Variants
                  </span>
                  <span className="text-[10px] font-mono text-muted-fg">
                    {allVariants.length} option{allVariants.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {allVariants.map((v) => {
                    const isDef = v === 'default'
                    const key = `${item.cue}${isDef ? '' : `:${v}`}`
                    const isVariantActive = isContinuous
                      ? isContinuousPlaying(item.cue, isDef ? 'default' : v)
                      : recentlyPlayed === key

                    return (
                      <Button
                        key={v}
                        size="xs"
                        intent={
                          isVariantActive
                            ? 'primary'
                            : isDef
                            ? 'secondary'
                            : 'outline'
                        }
                        onClick={() => {
                          if (isContinuous) {
                            if (isVariantActive) {
                              handleStopCue(item.cue)
                            } else {
                              handleStartContinuous(item.cue, isDef ? undefined : v)
                            }
                          } else {
                            handlePlayCue(item.cue, isDef ? undefined : v)
                          }
                        }}
                        className={`font-mono text-[11px] transition-all cursor-pointer ${
                          isVariantActive
                            ? 'ring-1 ring-primary font-semibold shadow-2xs'
                            : ''
                        }`}
                      >
                        <span>{isDef ? 'default' : v}</span>
                        {isContinuous && isVariantActive && (
                          <span className="ml-1 w-1.5 h-1.5 rounded-full bg-primary-fg animate-ping inline-block" />
                        )}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ==========================================================================
   Documentation Specification
   ========================================================================== */

export const soundDoc: ComponentDocSpec = {
  id: 'sound',
  name: 'SoundTrigger',
  badge: 'Media & Audio',
  summary:
    'Web Audio procedural sound synthesis engine and interactive trigger primitives with 10 canonical semantic cues, 11 expressive standalone FX cues, 8 continuous / infinite sustained audio loops, acoustic variants, TTL timeouts, adaptive cadence, and declarative HTML bindings.',
  component: SoundTrigger,
  subcomponents: [
    'SoundTrigger.Icon',
    'SoundTrigger.RightIcon',
    'SoundTrigger.Indicator',
    'SoundTrigger.Loader',
    'SoundTrigger.Label',
    'useSound',
    'useContinuousSound',
    'useDynamicSound',
    'useScrollSound',
    'useDragSound',
    'useCursorSound',
    'useKeySound',
    'useSoundFeedback',
    'useSoundTrigger',
    'SoundEngine',
  ],
  playground: {
    defaultProps: {
      volume: 0.7,
    },
    controls: [],
    render: () => <SoundExplorerPlayground />,
  },
  examples: [
    {
      title: 'Continuous & Infinite Sound Loops with TTL and Stop Triggers',
      description:
        'Trigger sustained audio drones, pulsing radars, continuous laser beams, and streaming tickers with either manual stop triggers, TTL auto-expiration timeouts, or hold-to-play gestures.',
      render: () => {
        function ContinuousLoopsDemo() {
          const { start, stop, stopAll, isContinuousPlaying, activeContinuousCount } = useSound()
          const [activeCue, setActiveCue] = useState<string | null>(null)
          const [timerCountdown, setTimerCountdown] = useState<number | null>(null)
          const countdownIntervalRef = useRef<any>(null)

          const clearCountdownTimer = () => {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current)
              countdownIntervalRef.current = null
            }
          }

          useEffect(() => {
            return () => {
              clearCountdownTimer()
            }
          }, [])

          const runWithTtl = (cue: SoundName, ttlMs: number) => {
            clearCountdownTimer()
            stopAll()
            setActiveCue(cue)
            setTimerCountdown(ttlMs / 1000)

            start(cue, {
              ttl: ttlMs,
              onEnded: () => {
                clearCountdownTimer()
                setActiveCue(null)
                setTimerCountdown(null)
              },
            })

            countdownIntervalRef.current = setInterval(() => {
              setTimerCountdown((prev) => {
                if (prev === null || prev <= 1) {
                  clearCountdownTimer()
                  return null
                }
                return prev - 1
              })
            }, 1000)
          }

          const stopCurrent = () => {
            clearCountdownTimer()
            stopAll()
            setActiveCue(null)
            setTimerCountdown(null)
          }

          return (
            <div className="flex flex-col gap-5 w-full">
              {/* Active Voice Status Bar */}
              <div className="flex flex-wrap items-center justify-between p-3.5 bg-secondary text-secondary-fg rounded-macro border border-border gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      activeContinuousCount > 0
                        ? 'bg-primary animate-pulse'
                        : 'bg-muted-fg/40'
                    }`}
                  />
                  <div className="text-xs font-mono">
                    <span className="font-semibold text-fg">Status: </span>
                    {activeContinuousCount > 0 ? (
                      <span className="text-primary font-medium">
                        Synthesizing ({activeCue ?? 'Continuous Voice'} active
                        {timerCountdown !== null ? ` — TTL ${timerCountdown}s remaining` : ' — Infinite Loop'}
                        )
                      </span>
                    ) : (
                      <span className="text-muted-fg">Engine Idle</span>
                    )}
                  </div>
                </div>

                {activeContinuousCount > 0 && (
                  <Button size="xs" intent="danger" onClick={stopCurrent}>
                    Stop Loop
                  </Button>
                )}
              </div>

              {/* Loop Triggers Deck */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* 1. Loading Hum with 5s TTL */}
                <div className="flex flex-col gap-2 p-3 bg-card text-card-fg border border-border rounded-base">
                  <div className="flex items-center gap-2">
                    <Waves className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold">Loading Hum</span>
                  </div>
                  <p className="text-[11px] text-muted-fg">Sub-harmonic drone for async tasks with 5s TTL.</p>
                  <Button
                    size="sm"
                    intent={activeCue === 'loading-hum' ? 'primary' : 'secondary'}
                    onClick={() => runWithTtl('loading-hum', 5000)}
                    className="mt-auto"
                  >
                    Play (5s TTL)
                  </Button>
                </div>

                {/* 2. Radar Pulse Infinite */}
                <div className="flex flex-col gap-2 p-3 bg-card text-card-fg border border-border rounded-base">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold">Radar Pulse</span>
                  </div>
                  <p className="text-[11px] text-muted-fg">Continuous 0.9s sonar beacon for search/scan.</p>
                  <Button
                    size="sm"
                    intent={activeCue === 'radar-pulse' ? 'primary' : 'secondary'}
                    onClick={() => {
                      if (isContinuousPlaying('radar-pulse')) {
                        stop('radar-pulse')
                        setActiveCue(null)
                      } else {
                        stopAll()
                        setActiveCue('radar-pulse')
                        start('radar-pulse')
                      }
                    }}
                    className="mt-auto"
                  >
                    {isContinuousPlaying('radar-pulse') ? 'Stop Radar' : 'Start Radar (Inf)'}
                  </Button>
                </div>

                {/* 3. Beam Laser Hold-to-Play */}
                <div className="flex flex-col gap-2 p-3 bg-card text-card-fg border border-border rounded-base">
                  <div className="flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold">Beam Laser</span>
                  </div>
                  <p className="text-[11px] text-muted-fg">Plays while pressed down, stops on release.</p>
                  <SoundTrigger
                    event="hold"
                    cue="beam-laser"
                    intent="primary"
                    size="sm"
                    className="mt-auto"
                  >
                    Hold to Fire Beam
                  </SoundTrigger>
                </div>

                {/* 4. Ticker Stream (10s TTL) */}
                <div className="flex flex-col gap-2 p-3 bg-card text-card-fg border border-border rounded-base">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold">Ticker Stream</span>
                  </div>
                  <p className="text-[11px] text-muted-fg">Rapid generative clicks for streaming LLM tokens.</p>
                  <Button
                    size="sm"
                    intent={activeCue === 'ticker-stream' ? 'primary' : 'secondary'}
                    onClick={() => runWithTtl('ticker-stream', 8000)}
                    className="mt-auto"
                  >
                    Stream (8s TTL)
                  </Button>
                </div>
              </div>

              {/* Declarative HTML Attributes Demo */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <span className="text-xs font-semibold text-muted-fg">Declarative DOM Controls:</span>
                <button
                  data-sound-start="loading-hum"
                  data-sound-ttl="6000"
                  className="px-3 py-1.5 text-xs font-mono bg-secondary text-secondary-fg hover:bg-secondary/80 rounded-micro border border-border cursor-pointer transition-all"
                >
                  data-sound-start="loading-hum" (6s)
                </button>
                <button
                  data-sound-hold="focus-noise"
                  className="px-3 py-1.5 text-xs font-mono bg-secondary text-secondary-fg hover:bg-secondary/80 rounded-micro border border-border cursor-pointer transition-all"
                >
                  data-sound-hold="focus-noise"
                </button>
                <button
                  data-sound-stop="all"
                  className="px-3 py-1.5 text-xs font-mono bg-danger/10 text-danger hover:bg-danger/20 rounded-micro border border-danger/20 cursor-pointer transition-all"
                >
                  data-sound-stop="all"
                </button>
              </div>
            </div>
          )
        }

        return (
          <div className="p-5 bg-card text-card-fg border border-border rounded-macro">
            <ContinuousLoopsDemo />
          </div>
        )
      },
      code: `import { useSound, useContinuousSound, SoundTrigger } from '@consona/interface'

function ProcessingWorker() {
  const { start, stop } = useSound()

  // 1. Start an infinite loop and stop manually
  const onStartScanning = () => {
    const radar = start('radar-pulse')
    // Later: radar.stop() or stop('radar-pulse')
  }

  // 2. Start with a Time-to-Live (TTL) auto-expiration (e.g. 5 seconds)
  const onLongTask = () => {
    start('loading-hum', {
      ttl: 5000,     // Automatically stops after 5,000ms with smooth release
      release: 0.4,  // 400ms fade-out curve
    })
  }

  return (
    <div>
      <button onClick={onLongTask}>Start Task (5s TTL)</button>

      {/* 3. Declarative Hold Trigger: plays while pressed, stops on release */}
      <SoundTrigger event="hold" cue="beam-laser">
        Hold to Accelerate
      </SoundTrigger>

      {/* 4. Declarative HTML attributes */}
      <button data-sound-hold="focus-noise">Hold to Focus</button>
      <button data-sound-start="radar-pulse">Start Scan</button>
      <button data-sound-stop="radar-pulse">Stop Scan</button>
    </div>
  )
}`,
    },
    {
      title: 'Interactive Motion & Parametric Audio (Scroll, Drag, Cursor)',
      description:
        'Continuous physics-driven motion audio helpers calculate real-time distance, speed, and 2D spatial coordinates to dynamically modulate toggle-latch clicks for scrolling, navigate-whoosh audio for dragging, and wind-ambient breeze for cursor movement.',
      render: () => {
        function ScrollTabDemo() {
          const [scrollVariant, setScrollVariant] = useState<string>('latch')
          const [stepDistance, setStepDistance] = useState<number>(28)
          const scrollSound = useScrollSound({
            cue: 'toggle',
            variant: scrollVariant,
            stepDistance,
          })

          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left: Interactive Scroll Viewport */}
              <div className="lg:col-span-2 flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-fg">Scroll Velocity & Distance Feed</span>
                    <Badge size="sm" intent="primary">
                      modulates toggle:{scrollVariant}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-fg">Interval:</span>
                      <select
                        value={stepDistance}
                        onChange={(e) => setStepDistance(Number(e.target.value))}
                        className="px-2 py-1 text-xs font-mono bg-secondary text-secondary-fg border border-border rounded-micro cursor-pointer"
                      >
                        <option value={16}>16px (Dense click)</option>
                        <option value={28}>28px (Standard latch)</option>
                        <option value={48}>48px (Spaced detents)</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-fg">Variant:</span>
                      <select
                        value={scrollVariant}
                        onChange={(e) => setScrollVariant(e.target.value)}
                        className="px-2 py-1 text-xs font-mono bg-secondary text-secondary-fg border border-border rounded-micro cursor-pointer"
                      >
                        <option value="latch">latch (tactile detent click)</option>
                        <option value="switch">switch (crisp bi-tonal rocker)</option>
                        <option value="mechanical">mechanical (firm key switch)</option>
                        <option value="subtle">subtle (micro click)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div
                  ref={scrollSound.containerRef}
                  className="h-64 overflow-y-auto p-3 bg-bg/70 border border-border rounded-base flex flex-col gap-2.5 shadow-inner"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-3 bg-card text-card-fg border border-border/80 rounded-micro flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center font-mono text-[10px] text-muted-fg">
                          {i + 1}
                        </span>
                        <span className="font-medium">Data Stream Chunk #{1001 + i}</span>
                      </div>
                      <Badge size="sm" intent={i % 4 === 0 ? 'primary' : 'secondary'}>
                        {i % 4 === 0 ? 'Live Stream' : 'Buffered'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Real-time Telemetry */}
              <div className="flex flex-col justify-between p-4 bg-secondary/50 border border-border rounded-base">
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-fg">
                    Scroll Physics & Latch Metrics
                  </span>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-muted-fg">Velocity:</span>
                      <span className="text-fg font-semibold">
                        {scrollSound.velocity.toFixed(3)} px/ms
                      </span>
                    </div>
                    <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-75"
                        style={{
                          width: `${Math.min(100, scrollSound.normalizedSpeed * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-[11px] font-mono">
                    <div>
                      <span className="text-muted-fg block">Scrolled:</span>
                      <span className="text-fg font-semibold">
                        {scrollSound.scrolledDistance} px
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-fg block">Latch Count:</span>
                      <span className="text-primary font-semibold">
                        {scrollSound.latchCount} clicks
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-fg block">Direction:</span>
                      <span className="text-fg font-semibold capitalize">
                        {scrollSound.direction === 'none' ? '—' : scrollSound.direction}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-fg block">Progress:</span>
                      <span className="text-fg font-semibold">
                        {Math.round(scrollSound.scrollProgress * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/60">
                  <div className="text-[11px] font-mono text-muted-fg">
                    <span className="text-primary font-semibold">Modulation:</span>
                    <span> toggle:{scrollVariant} @ {stepDistance}px</span>
                  </div>
                  <Button size="xs" intent="plain" onClick={scrollSound.reset}>
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          )
        }

        function DragTabDemo() {
          const [dragVariant, setDragVariant] = useState<string>('slide')
          const dragSound = useDragSound({
            cue: 'navigate',
            variant: dragVariant,
            spatialPanning: true,
            pickCue: { cue: 'open', variant: 'slide' },
            dropCue: 'release',
            successCue: { cue: 'success', variant: 'harmonic' },
            errorCue: { cue: 'error', variant: 'buzz' },
            shuffleCue: { cue: 'navigate', variant: 'swipe' },
          })

          const [puckOffset, setPuckOffset] = useState({ x: 0, y: 0 })
          const [lastEvent, setLastEvent] = useState<string | null>(null)
          const dragOriginRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 })

          const handleTrigger = (name: string, fn: () => void) => {
            fn()
            setLastEvent(name)
            setTimeout(() => setLastEvent((prev) => (prev === name ? null : prev)), 800)
          }

          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left: 2D Drag Canvas */}
              <div className="lg:col-span-2 flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-fg">2D Drag Physics Arena</span>
                    <Badge size="sm" intent="primary">
                      modulates navigate:{dragVariant}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-fg">Variant:</span>
                    <select
                      value={dragVariant}
                      onChange={(e) => setDragVariant(e.target.value)}
                      className="px-2 py-1 text-xs font-mono bg-secondary text-secondary-fg border border-border rounded-micro cursor-pointer"
                    >
                      <option value="slide">slide (silky warm glide — default)</option>
                      <option value="velvet">velvet (ultra-soft cushioned friction)</option>
                      <option value="whisper">whisper (gentle air breeze drift)</option>
                      <option value="feather">feather (weightless airy glide)</option>
                      <option value="whoosh">whoosh (deep resonant airflow)</option>
                      <option value="swipe">swipe (aerodynamic directional sweep)</option>
                      <option value="default">default (smooth directional motion)</option>
                    </select>
                  </div>
                </div>

                <div className="relative h-64 bg-bg/80 border border-border rounded-base overflow-hidden flex items-center justify-center select-none">
                  <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />

                  <div
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId)
                      dragOriginRef.current = {
                        startX: e.clientX,
                        startY: e.clientY,
                        initialX: puckOffset.x,
                        initialY: puckOffset.y,
                      }
                      dragSound.dragProps.onPointerDown(e)
                    }}
                    onPointerMove={(e) => {
                      if (dragSound.isDragging) {
                        const dx = e.clientX - dragOriginRef.current.startX
                        const dy = e.clientY - dragOriginRef.current.startY
                        setPuckOffset({
                          x: Math.max(-140, Math.min(140, dragOriginRef.current.initialX + dx)),
                          y: Math.max(-90, Math.min(90, dragOriginRef.current.initialY + dy)),
                        })
                      }
                      dragSound.dragProps.onPointerMove(e)
                    }}
                    onPointerUp={(e) => {
                      try {
                        e.currentTarget.releasePointerCapture(e.pointerId)
                      } catch {}
                      dragSound.dragProps.onPointerUp(e)
                    }}
                    onPointerCancel={dragSound.dragProps.onPointerCancel}
                    style={{
                      transform: `translate(${puckOffset.x}px, ${puckOffset.y}px)`,
                    }}
                    className={`relative z-10 w-32 h-32 p-3 rounded-base bg-card text-card-fg border-2 flex flex-col items-center justify-center gap-1.5 shadow-md cursor-grab active:cursor-grabbing transition-shadow ${
                      dragSound.isDragging
                        ? 'border-primary ring-4 ring-primary/20 shadow-xl scale-105'
                        : 'border-border hover:border-primary/60'
                    }`}
                  >
                    <Move className={`w-5 h-5 ${dragSound.isDragging ? 'text-primary animate-pulse' : 'text-muted-fg'}`} />
                    <span className="text-xs font-semibold text-center leading-tight">
                      {dragSound.isDragging ? 'Dragging...' : 'Drag Physics Puck'}
                    </span>
                    <span className="text-[10px] font-mono text-muted-fg">Silky Slide + Events</span>
                  </div>
                </div>

                {/* Event Cues Action Deck */}
                <div className="flex flex-wrap items-center gap-2 p-3 bg-card border border-border rounded-base">
                  <span className="text-xs font-semibold text-muted-fg mr-1">Event Cues:</span>
                  <Button
                    size="xs"
                    intent={lastEvent === 'pick' ? 'primary' : 'outline'}
                    onClick={() => handleTrigger('pick', () => dragSound.playPick())}
                    className="gap-1 font-mono text-[11px]"
                  >
                    <span>Pick (open-slide)</span>
                  </Button>
                  <Button
                    size="xs"
                    intent={lastEvent === 'drop' ? 'primary' : 'outline'}
                    onClick={() => handleTrigger('drop', () => dragSound.playDrop())}
                    className="gap-1 font-mono text-[11px]"
                  >
                    <span>Drop (release)</span>
                  </Button>
                  <Button
                    size="xs"
                    intent={lastEvent === 'success' ? 'success' : 'outline'}
                    onClick={() => handleTrigger('success', () => dragSound.playSuccess())}
                    className="gap-1 font-mono text-[11px]"
                  >
                    <span>Success (success-harmonic)</span>
                  </Button>
                  <Button
                    size="xs"
                    intent={lastEvent === 'error' ? 'danger' : 'outline'}
                    onClick={() => handleTrigger('error', () => dragSound.playError())}
                    className="gap-1 font-mono text-[11px]"
                  >
                    <span>Error (error-buzz)</span>
                  </Button>
                  <Button
                    size="xs"
                    intent={lastEvent === 'shuffle' ? 'primary' : 'outline'}
                    onClick={() => handleTrigger('shuffle', () => dragSound.playShuffle())}
                    className="gap-1 font-mono text-[11px]"
                  >
                    <span>Shuffle (navigate-swipe)</span>
                  </Button>
                </div>
              </div>

              {/* Right: Drag Stats */}
              <div className="flex flex-col justify-between p-4 bg-secondary/50 border border-border rounded-base">
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-fg">
                    2D Motion & Audio Modulation
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-muted-fg block">Speed:</span>
                      <span className="text-fg font-semibold">
                        {dragSound.dragSpeed.toFixed(2)} px/ms
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-fg block">Distance:</span>
                      <span className="text-fg font-semibold">
                        {Math.round(dragSound.dragPosition.distance)} px
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-fg block">Strides:</span>
                      <span className="text-primary font-semibold">
                        {dragSound.dragCount} slides
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-fg block">State:</span>
                      <span className="text-fg font-semibold">
                        {dragSound.isDragging ? 'Dragging' : 'Idle'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 pt-2 border-t border-border/60">
                    <span className="text-xs font-mono text-muted-fg">Stereo Panning:</span>
                    <div className="flex items-center justify-between text-[10px] font-mono text-muted-fg">
                      <span>Left (-1.0)</span>
                      <span className="text-primary font-semibold">
                        {typeof window !== 'undefined'
                          ? ((dragSound.dragPosition.x / window.innerWidth) * 2 - 1).toFixed(2)
                          : '0.00'}
                      </span>
                      <span>Right (+1.0)</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-card border border-border rounded-micro text-[11px] font-mono text-muted-fg">
                    <span className="text-primary font-semibold block">Acoustic Feedback:</span>
                    <span>Modulating: navigate:{dragVariant} (silky strides)</span>
                    <br />
                    <span>Pick: open-slide | Drop: release</span>
                    <br />
                    <span>Success: success-harmonic | Error: error-buzz</span>
                  </div>
                </div>

                <Button
                  size="xs"
                  intent="secondary"
                  onClick={() => {
                    setPuckOffset({ x: 0, y: 0 })
                    dragSound.reset()
                  }}
                  className="mt-3 gap-1.5 self-start"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Reset Puck Position</span>
                </Button>
              </div>
            </div>
          )
        }

        function CursorTabDemo() {
          const [cursorVariant, setCursorVariant] = useState<string>('breeze')
          const cursorSound = useCursorSound({
            cue: 'wind-ambient',
            variant: cursorVariant,
            spatialPanning: true,
          })

          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left: Cursor Interactive Canvas */}
              <div className="lg:col-span-2 flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-fg">Cursor Movement & Air Flow</span>
                    <Badge size="sm" intent="primary">
                      modulates wind-ambient:{cursorVariant}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-fg">Variant:</span>
                    <select
                      value={cursorVariant}
                      onChange={(e) => setCursorVariant(e.target.value)}
                      className="px-2 py-1 text-xs font-mono bg-secondary text-secondary-fg border border-border rounded-micro cursor-pointer"
                    >
                      <option value="breeze">breeze (soft filtered atmospheric air)</option>
                      <option value="gust">gust (dynamic resonant wind swell)</option>
                      <option value="default">default (ambient air flow)</option>
                    </select>
                  </div>
                </div>

                <div
                  ref={cursorSound.containerRef}
                  className="relative h-64 bg-bg/80 border border-border rounded-base overflow-hidden flex flex-col items-center justify-center cursor-crosshair group"
                >
                  <div className="flex flex-col items-center gap-1 pointer-events-none text-center">
                    <Sparkles className={`w-6 h-6 ${cursorSound.isMoving ? 'text-primary animate-spin' : 'text-muted-fg'}`} />
                    <span className="text-xs font-semibold text-fg">
                      {cursorSound.isHovering ? 'Move pointer inside canvas area' : 'Hover into canvas area'}
                    </span>
                    <span className="text-[11px] font-mono text-muted-fg">
                      Speed modulates wind cutoff, pitch, &amp; stereo panning
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Cursor Stats */}
              <div className="flex flex-col justify-between p-4 bg-secondary/50 border border-border rounded-base">
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-fg">
                    Pointer Coordinates & Speed
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-muted-fg block">Speed:</span>
                      <span className="text-fg font-semibold">
                        {cursorSound.cursorSpeed.toFixed(2)} px/ms
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-fg block">State:</span>
                      <span className="text-fg font-semibold">
                        {cursorSound.isMoving ? 'Air Swell Active' : cursorSound.isHovering ? 'Hovering' : 'Idle'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-[11px] font-mono">
                    <div>
                      <span className="text-muted-fg block">Norm X:</span>
                      <span className="text-primary font-semibold">
                        {cursorSound.cursorPosition.normalizedX.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-fg block">Norm Y:</span>
                      <span className="text-primary font-semibold">
                        {cursorSound.cursorPosition.normalizedY.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-card border border-border rounded-micro text-[11px] font-mono text-muted-fg">
                    <span className="text-primary font-semibold block">Stereo Position:</span>
                    <span>
                      Pan: {cursorSound.cursorPosition.normalizedX < -0.2 ? 'Left Speaker' : cursorSound.cursorPosition.normalizedX > 0.2 ? 'Right Speaker' : 'Center'}
                    </span>
                    <br />
                    <span>Distance: {cursorSound.cursorPosition.distanceMoved} px</span>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        function MotionAudioDemo() {
          const [activeTab, setActiveTab] = useState<'scroll' | 'drag' | 'cursor'>('scroll')

          return (
            <div className="flex flex-col gap-5 w-full">
              {/* Navigation Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border">
                <ButtonGroup>
                  <Button
                    size="sm"
                    intent={activeTab === 'scroll' ? 'primary' : 'plain'}
                    onClick={() => setActiveTab('scroll')}
                    className="gap-1.5"
                  >
                    <ArrowDownUp className="w-3.5 h-3.5" />
                    <span>Scroll (toggle:latch)</span>
                  </Button>
                  <Button
                    size="sm"
                    intent={activeTab === 'drag' ? 'primary' : 'plain'}
                    onClick={() => setActiveTab('drag')}
                    className="gap-1.5"
                  >
                    <Move className="w-3.5 h-3.5" />
                    <span>2D Drag (navigate:slide)</span>
                  </Button>
                  <Button
                    size="sm"
                    intent={activeTab === 'cursor' ? 'primary' : 'plain'}
                    onClick={() => setActiveTab('cursor')}
                    className="gap-1.5"
                  >
                    <MousePointer className="w-3.5 h-3.5" />
                    <span>Cursor (wind:breeze)</span>
                  </Button>
                </ButtonGroup>

                <span className="text-xs font-mono text-muted-fg">
                  Real-time AudioParam Ramping & Physics Modulation
                </span>
              </div>

              {activeTab === 'scroll' && <ScrollTabDemo />}
              {activeTab === 'drag' && <DragTabDemo />}
              {activeTab === 'cursor' && <CursorTabDemo />}
            </div>
          )
        }

        return (
          <div className="p-5 bg-card text-card-fg border border-border rounded-macro">
            <MotionAudioDemo />
          </div>
        )
      },
      code: `import { useScrollSound, useDragSound, useCursorSound, useDynamicSound } from '@consona/interface'

// 1. Scroll-distance & velocity reactive sound (modulates toggle:latch)
function ScrollContainer() {
  const { containerRef, velocity, scrolledDistance, latchCount } = useScrollSound({
    cue: 'toggle',
    variant: 'latch',     // 'latch' | 'switch' | 'mechanical'
    stepDistance: 28,     // Triggers tactile latch click every 28px scrolled
  })

  return <div ref={containerRef} className="overflow-y-auto h-64">...</div>
}

// 2. Physics-aware 2D drag sound with event cues (modulates navigate:slide + pick/drop/success/error/shuffle)
function DraggablePuck() {
  const {
    dragProps,
    isDragging,
    dragSpeed,
    dragPosition,
    playPick,
    playDrop,
    playSuccess,
    playError,
    playShuffle,
  } = useDragSound({
    cue: 'navigate',
    variant: 'slide',               // 'slide' (default silky) | 'swipe' | 'whoosh'
    spatialPanning: true,          // Pans stereo audio based on X coordinate
    pickCue: { cue: 'open', variant: 'slide' },        // Fired on drag pick-up
    dropCue: 'release',                                 // Fired on drag release
    successCue: { cue: 'success', variant: 'harmonic' }, // Fired on valid drop target
    errorCue: { cue: 'error', variant: 'buzz' },         // Fired on invalid target/cancel
    shuffleCue: { cue: 'navigate', variant: 'swipe' },   // Fired on item swap/reorder
  })

  return (
    <div {...dragProps}>
      <span>Drag Me</span>
      {/* Trigger contextual drag & drop sounds */}
      <button onClick={() => playSuccess()}>Drop into Target</button>
      <button onClick={() => playShuffle()}>Reorder Item</button>
    </div>
  )
}

// 3. Real-time cursor velocity & spatial atmospheric air (modulates wind-ambient:breeze)
function SpatialRadar() {
  const { containerRef, cursorPosition, cursorSpeed, isMoving } = useCursorSound({
    cue: 'wind-ambient',
    variant: 'breeze',    // 'breeze' | 'gust'
    spatialPanning: true, // Left-to-right stereo panning
    pitchRange: [0.95, 1.3],
    cutoffRange: [500, 2400],
  })

  return <div ref={containerRef}>Hover & Move Pointer</div>
}

// 4. Custom parameter modulation on any continuous sound
function CustomModulator() {
  const { actions } = useDynamicSound({ cue: 'loading-hum' })

  const onSensorsUpdate = (frequencyHz: number, panLeftRight: number) => {
    actions.setModulation({
      cutoff: frequencyHz,
      pan: panLeftRight, // -1.0 to 1.0
      pitch: 1.25,
      volume: 0.8,
    }, 0.03) // 30ms smooth linear ramp
  }
}`,
    },
    {
      title: 'Declarative HTML Data Attributes',
      description:
        'Trigger acoustic synthesis with zero custom JavaScript. The delegated sound listener automatically catches clicks and interaction cues for elements with data-sound-* or data-sound-*-<variant> attributes.',
      render: () => (
        <div className="flex flex-wrap items-center gap-3 p-5 bg-card text-card-fg border border-border rounded-macro">
          <Button data-sound-tap intent="primary">
            data-sound-tap
          </Button>
          <Button data-sound-tap-mechanical intent="secondary">
            data-sound-tap-mechanical
          </Button>
          <Button data-sound-select-pluck intent="outline">
            data-sound-select-pluck
          </Button>
          <Button data-sound-open-elastic intent="secondary">
            data-sound-open-elastic
          </Button>
          <Button data-sound-close-suction intent="secondary">
            data-sound-close-suction
          </Button>
          <Button data-sound-success-chime intent="success">
            data-sound-success-chime
          </Button>
          <Button data-sound-error-knock intent="danger">
            data-sound-error-knock
          </Button>
          <Button data-sound-tap data-sound-emphasis="strong" intent="primary">
            data-sound-emphasis="strong"
          </Button>
        </div>
      ),
      code: `<!-- Canonical cue with default recipe -->
<button data-sound-tap>Save Changes</button>

<!-- Cue with acoustic variant via hyphenated attribute -->
<button data-sound-tap-mechanical>Mechanical Click</button>
<button data-sound-select-pluck>Pluck Select</button>
<button data-sound-open-elastic>Open Modal</button>
<button data-sound-close-suction>Close Drawer</button>
<button data-sound-success-chime>Operation Success</button>
<button data-sound-error-knock>Delete Record</button>

<!-- Cue with emphasis and volume modifiers -->
<button data-sound-tap data-sound-emphasis="strong" data-sound-volume="0.9">
  High-Impact Action
</button>`,
    },
    {
      title: 'Declarative SoundTrigger Component',
      description:
        'Wrap any interaction button or custom element with the SoundTrigger component for type-safe cue and variant triggering on click, press, hover, or hold.',
      render: () => (
        <div className="flex flex-wrap items-center gap-3 p-5 bg-card text-card-fg border border-border rounded-macro">
          <SoundTrigger cue="select" variant="pluck" intent="primary">
            SoundTrigger: Select (Pluck)
          </SoundTrigger>
          <SoundTrigger cue="success" variant="chime" intent="secondary">
            SoundTrigger: Success (Chime)
          </SoundTrigger>
          <SoundTrigger event="hover" cue="tap" variant="soft" intent="outline">
            SoundTrigger: Hover Me (Soft Tap)
          </SoundTrigger>
          <SoundTrigger event="hold" cue="beam-laser" intent="primary">
            SoundTrigger: Hold Me (Beam Laser)
          </SoundTrigger>
        </div>
      ),
      code: `import { SoundTrigger } from '@consona/interface'

<SoundTrigger cue="select" variant="pluck" intent="primary">
  Select Item
</SoundTrigger>

<SoundTrigger cue="success" variant="chime" intent="secondary">
  Complete Step
</SoundTrigger>

<SoundTrigger event="hover" cue="tap" variant="soft" intent="outline">
  Hover Sound
</SoundTrigger>

<SoundTrigger event="hold" cue="beam-laser" intent="primary">
  Hold to Fire Laser
</SoundTrigger>`,
    },
    {
      title: 'Asynchronous Workflow Feedback with useSoundFeedback',
      description:
        'Wrap async functions with withSound() to automatically trigger start acoustic cue, success chime, or error knock on promise resolution/rejection.',
      render: () => {
        function AsyncDemo() {
          const { actions, state } = useSoundFeedback()
          const [log, setLog] = useState<string[]>([])

          const handleDeploy = async () => {
            try {
              await actions.withSound(async () => {
                setLog((p) => ['Starting remote build & deployment...', ...p.slice(0, 3)])
                await new Promise((resolve) => setTimeout(resolve, 1400))
                setLog((p) => ['✅ Deployed successfully to Edge network!', ...p.slice(0, 3)])
              })
            } catch {
              setLog((p) => ['❌ Deployment aborted', ...p.slice(0, 3)])
            }
          }

          const handleFail = async () => {
            try {
              await actions.withSound(async () => {
                setLog((p) => ['Verifying database migration...', ...p.slice(0, 3)])
                await new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('Migration deadlock on table `orders`')), 1000)
                )
              })
            } catch (err: any) {
              setLog((p) => [`⚠️ Error: ${err.message}`, ...p.slice(0, 3)])
            }
          }

          return (
            <div className="flex flex-col gap-4 w-full">
              <div className="flex flex-wrap gap-3">
                <Button
                  intent="primary"
                  isDisabled={state.isLoading}
                  onClick={handleDeploy}
                  className="cursor-pointer"
                >
                  {state.isLoading ? 'Deploying...' : 'Simulate Async Success'}
                </Button>
                <Button
                  intent="outline"
                  isDisabled={state.isLoading}
                  onClick={handleFail}
                  className="cursor-pointer"
                >
                  Simulate Async Error
                </Button>
              </div>

              {log.length > 0 && (
                <div className="flex flex-col gap-1 p-3 bg-secondary text-secondary-fg rounded-micro border border-border text-xs font-mono">
                  {log.map((item, i) => (
                    <div key={i} className="text-fg">{item}</div>
                  ))}
                </div>
              )}
            </div>
          )
        }

        return (
          <div className="p-5 bg-card text-card-fg border border-border rounded-macro">
            <AsyncDemo />
          </div>
        )
      },
      code: `import { useSoundFeedback, Button } from '@consona/interface'

function DeployButton() {
  const { actions, state } = useSoundFeedback()

  const handleDeploy = async () => {
    await actions.withSound(async () => {
      // Plays 'tap' on start, 'success' on resolve, or 'error' on catch
      await api.deployProduction()
    })
  }

  return (
    <Button isDisabled={state.isLoading} onClick={handleDeploy}>
      {state.isLoading ? 'Deploying...' : 'Deploy'}
    </Button>
  )
}`,
    },
    {
      title: 'Adaptive Keystroke Acoustics with useKeySound',
      description:
        'Synthesize physical keyboard acoustics in real time with typing cadence acceleration, frequency gliding, and backspace detune pitch drops.',
      render: () => {
        function KeySoundDemo() {
          const { actions, state } = useKeySound()
          return (
            <div className="flex flex-col gap-3 w-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-fg">
                  Interactive Keystroke Acoustic Zone
                </span>
                <Badge intent="secondary" size="sm">
                  {state.keystrokeCount} Keystrokes
                </Badge>
              </div>
              <input
                type="text"
                placeholder="Type here to test typing cadence, pitch-glides, and backspace detunes..."
                onKeyDown={actions.handleKeyDown}
                className="w-full px-3.5 py-2.5 text-xs bg-bg text-fg border border-border rounded-micro focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )
        }

        return (
          <div className="p-5 bg-card text-card-fg border border-border rounded-macro">
            <KeySoundDemo />
          </div>
        )
      },
      code: `import { useKeySound } from '@consona/interface'

function TerminalInput() {
  const { actions, state } = useKeySound()

  return (
    <input
      type="text"
      placeholder="Type command..."
      onKeyDown={actions.handleKeyDown}
    />
  )
}`,
    },
    {
      title: 'Notification SFX & Acoustic Variants',
      description:
        'Acoustically sculpted notification cues designed with distinct timbres and physical resonance profiles for toasts, alerts, ambient badges, and HUD messages.',
      render: () => {
        function NotificationVariantsDemo() {
          const { play } = useSound()
          const [activeVariant, setActiveVariant] = useState<string | null>(null)

          const NOTIF_VARIANTS = [
            {
              id: 'default',
              label: 'Ethereal Chime (Default)',
              badge: 'Double Glass Bell',
              desc: 'Dual crystalline sine harmonics at F#5 & C#6 with an octave shimmer tail.',
              cue: 'notification',
              variant: undefined,
            },
            {
              id: 'subtle',
              label: 'Subtle',
              badge: 'Muted Bubble Tap',
              desc: 'Warm triangle pitch glide with lowpass noise tap. Zero ear fatigue for badges.',
              cue: 'notification',
              variant: 'subtle',
            },
            {
              id: 'urgent',
              label: 'Urgent',
              badge: 'Priority Staccato',
              desc: 'High-attention dual staccato pulse with highpass snap for critical alerts.',
              cue: 'notification',
              variant: 'urgent',
            },
            {
              id: 'gentle',
              label: 'Gentle',
              badge: 'Ambient Triad Bloom',
              desc: 'Ascending A-major chord triad with soft envelope and spatial decay.',
              cue: 'notification',
              variant: 'gentle',
            },
            {
              id: 'electronic',
              label: 'Electronic',
              badge: 'Cyber HUD Ping',
              desc: 'Fast upward FM pitch chirp with secondary 2.8kHz chime and sparkle.',
              cue: 'notification',
              variant: 'electronic',
            },
            {
              id: 'crystal',
              label: 'Crystal',
              badge: 'Glockenspiel Prism',
              desc: 'Pure high-frequency glass bell resonance at 1.76kHz and 2.63kHz.',
              cue: 'notification',
              variant: 'crystal',
            },
            {
              id: 'pop',
              label: 'Pop',
              badge: 'Bubbly Pluck',
              desc: 'Lively upward percussive bubble pop with warm harmonic body.',
              cue: 'notification',
              variant: 'pop',
            },
          ]

          const triggerVariant = (cue: string, variant?: string) => {
            const key = variant ?? 'default'
            setActiveVariant(key)
            play(cue, { variant, emphasis: 'strong' })
            setTimeout(() => setActiveVariant(null), 800)
          }

          return (
            <div className="flex flex-col gap-4 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {NOTIF_VARIANTS.map((item) => {
                  const isActive = activeVariant === item.id
                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col p-4 bg-card text-card-fg border rounded-base transition-all duration-200 ${
                        isActive
                          ? 'border-primary shadow-md ring-1 ring-primary/40'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <Bell className={`w-4 h-4 ${isActive ? 'text-primary animate-bounce' : 'text-muted-fg'}`} />
                          <span className="text-xs font-semibold">{item.label}</span>
                        </div>
                      </div>
                      <span className="inline-block self-start text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-secondary-fg mb-2">
                        {item.badge}
                      </span>
                      <p className="text-[11px] text-muted-fg leading-relaxed mb-4 flex-1">
                        {item.desc}
                      </p>
                      <Button
                        size="sm"
                        intent={isActive ? 'primary' : 'secondary'}
                        onClick={() => triggerVariant(item.cue, item.variant)}
                        className="w-full cursor-pointer"
                      >
                        {isActive ? 'Synthesizing...' : `Play ${item.variant ? item.variant : 'Default'}`}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }

        return (
          <div className="p-5 bg-card text-card-fg border border-border rounded-macro">
            <NotificationVariantsDemo />
          </div>
        )
      },
      code: `import { useSound } from '@consona/interface'

function NotificationDemo() {
  const { play } = useSound()

  // 1. Pristine default double-chime for toasts
  const onToast = () => play('notification')

  // 2. Muted bubble tap for subtle badges
  const onBadge = () => play('notification', { variant: 'subtle' })

  // 3. Urgent staccato alert for priority messages
  const onAlert = () => play('notification', { variant: 'urgent', emphasis: 'strong' })

  // 4. Ambient harmonic triad for calm reminders
  const onReminder = () => play('notification', { variant: 'gentle' })

  // 5. High-tech cyber ping
  const onCyberPing = () => play('notification', { variant: 'electronic' })

  // 6. Crystal glass prism bell
  const onCrystalChime = () => play('notification', { variant: 'crystal' })

  // 7. Bubbly tactile pop
  const onSocialPop = () => play('notification', { variant: 'pop' })

  return (
    <div className="flex gap-2">
      <button onClick={onToast}>Toast</button>
      <button onClick={onAlert}>Alert</button>
      <button onClick={onCrystalChime}>Crystal</button>
    </div>
  )
}`,
    },
    {
      title: 'Imperative Sound Synthesis with useSound',
      description:
        'Programmatically trigger any cue with full override control over variants, emphasis, volume, and input context.',
      render: () => {
        function ProgrammaticDemo() {
          const { play } = useSound()
          const [triggered, setTriggered] = useState<string | null>(null)

          const fire = (cue: SoundName, variant?: string) => {
            play(cue, { variant, emphasis: 'strong' })
            setTriggered(`${cue}${variant ? `:${variant}` : ''}`)
            setTimeout(() => setTriggered(null), 1000)
          }

          return (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                intent="primary"
                onClick={() => fire('sparkle')}
                className="cursor-pointer"
              >
                {triggered === 'sparkle' ? '✨ Sparkle Active!' : 'Play Sparkle'}
              </Button>
              <Button
                intent="secondary"
                onClick={() => fire('success', 'harmonic')}
                className="cursor-pointer"
              >
                {triggered === 'success:harmonic' ? '🎵 Harmonic Active!' : 'Play Success (Harmonic)'}
              </Button>
              <Button
                intent="outline"
                onClick={() => fire('error', 'descend')}
                className="cursor-pointer"
              >
                {triggered === 'error:descend' ? '📉 Descend Active!' : 'Play Error (Descend)'}
              </Button>
            </div>
          )
        }

        return (
          <div className="p-5 bg-card text-card-fg border border-border rounded-macro">
            <ProgrammaticDemo />
          </div>
        )
      },
      code: `import { useSound } from '@consona/interface'

function ActionCenter() {
  const { play } = useSound()

  const onMilestone = () => {
    // Play with variant and emphasis
    play('success', { variant: 'harmonic', emphasis: 'strong' })
  }

  const onSparkle = () => {
    play('sparkle', { volume: 0.85 })
  }

  return <button onClick={onMilestone}>Celebrate</button>
} `,
    },
  ],
}
