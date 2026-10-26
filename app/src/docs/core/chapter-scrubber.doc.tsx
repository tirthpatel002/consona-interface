import React, { useState } from 'react'
import {
  ChapterScrubber,
  Button,
  Badge,
  Card,
  CardContent,
  type ChapterScrubberItem,
} from '@consona/interface'
import {
  Film,
  Compass,
  Layers,
  Sparkles,
  Code,
  FileText,
  Sliders,
  Play,
  Clock,
  BookOpen,
} from 'lucide-react'
import type { ComponentDocSpec } from '../types'

const SAMPLE_VIDEO_CHAPTERS: ChapterScrubberItem[] = [
  {
    id: 'intro',
    title: '01. Architecture Overview',
    meta: '00:00 - 02:45',
    description: 'Introduction to Consona micro-kernel architecture, engine triad, and AST registry.',
    badge: <Badge intent="primary" size="sm">Intro</Badge>,
    icon: <Sparkles className="w-4 h-4" />,
  },
  {
    id: 'tokens',
    title: '02. Mathematical Optical Scale',
    meta: '02:46 - 06:12',
    description: 'Deep dive into OKLCH colors, fluid density factors, and radius presets.',
    badge: <Badge intent="secondary" size="sm">Tokens</Badge>,
    icon: <Sliders className="w-4 h-4" />,
  },
  {
    id: 'components',
    title: '03. Component Factory & Slots',
    meta: '06:13 - 11:30',
    description: 'Understanding createInterfaceComponent and deep hierarchical slot injection.',
    badge: <Badge intent="accent" size="sm">Core</Badge>,
    icon: <Code className="w-4 h-4" />,
  },
  {
    id: 'engines',
    title: '04. Framework-Agnostic Engines',
    meta: '11:31 - 16:50',
    description: 'Pure TypeScript state machines, driver adapters, and zero-tearing hooks.',
    badge: <Badge intent="warning" size="sm">Engines</Badge>,
    icon: <Layers className="w-4 h-4" />,
  },
  {
    id: 'kinetic',
    title: '05. Kinetic Motion & Shaders',
    meta: '16:51 - 22:05',
    description: 'Spring physics, raised-cosine wave magnification, and GPU shaders.',
    badge: <Badge intent="success" size="sm">Motion</Badge>,
    icon: <Compass className="w-4 h-4" />,
  },
  {
    id: 'deploy',
    title: '06. Production Distribution',
    meta: '22:06 - 28:40',
    description: 'Automated AST registry extraction, tree-shaking, and enterprise compliance.',
    badge: <Badge intent="danger" size="sm">Deploy</Badge>,
    icon: <FileText className="w-4 h-4" />,
  },
]

const SAMPLE_PODCAST_CHAPTERS: ChapterScrubberItem[] = [
  {
    id: 'p1',
    title: 'Welcome & High-Fidelity Design',
    meta: 'Track 01 • 03:20',
    description: 'Why tactile interaction design matters in AI-native interfaces.',
  },
  {
    id: 'p2',
    title: 'Cosine Wave Physics',
    meta: 'Track 02 • 05:45',
    description: 'Formulas behind smooth raised-cosine peak magnification.',
  },
  {
    id: 'p3',
    title: 'Downstream Customization Budget',
    meta: 'Track 03 • 08:15',
    description: 'Balancing slot density vs ergonomics in enterprise design systems.',
  },
  {
    id: 'p4',
    title: 'The Future of Interface Kernels',
    meta: 'Track 04 • 12:40',
    description: 'Streaming generative UI patch compilers and live spatial state.',
  },
]

const PLAYGROUND_CHAPTERS: ChapterScrubberItem[] = [
  {
    id: 'intro',
    title: '01. Architecture Overview',
    meta: '00:00 - 02:45',
    description: 'Introduction to Consona micro-kernel architecture, engine triad, and AST registry.',
  },
  {
    id: 'tokens',
    title: '02. Mathematical Optical Scale',
    meta: '02:46 - 06:12',
    description: 'Deep dive into OKLCH colors, fluid density factors, and radius presets.',
  },
  {
    id: 'components',
    title: '03. Component Factory & Slots',
    meta: '06:13 - 11:30',
    description: 'Understanding createInterfaceComponent and deep hierarchical slot injection.',
  },
  {
    id: 'engines',
    title: '04. Framework-Agnostic Engines',
    meta: '11:31 - 16:50',
    description: 'Pure TypeScript state machines, driver adapters, and zero-tearing hooks.',
  },
  {
    id: 'kinetic',
    title: '05. Kinetic Motion & Shaders',
    meta: '16:51 - 22:05',
    description: 'Spring physics, raised-cosine wave magnification, and GPU shaders.',
  },
  {
    id: 'deploy',
    title: '06. Production Distribution',
    meta: '22:06 - 28:40',
    description: 'Automated AST registry extraction, tree-shaking, and enterprise compliance.',
  },
]

export const chapterScrubberDoc: ComponentDocSpec = {
  id: 'chapter-scrubber',
  name: 'ChapterScrubber',
  component: ChapterScrubber,
  badge: 'Kinetic',
  summary:
    'Fluid kinetic timeline scrubber rail with raised-cosine wave magnification, spatial preview cards, and full keyboard navigation for video timelines, audio tracks, and document chapter navigation.',
  subcomponents: ['ChapterScrubber', 'ChapterScrubberTick', 'ChapterScrubberCard'],
  playground: {
    defaultProps: {
      chapters: PLAYGROUND_CHAPTERS,
      orientation: 'vertical',
      side: 'right',
      peakLength: 56,
      restLength: 14,
      rowHeight: 18,
      radius: 4,
      currentIndex: 0,
    },
    code: `<ChapterScrubber
  chapters={chapters}
  orientation="vertical"
  side="right"
  peakLength={56}
  restLength={14}
  rowHeight={18}
  radius={4}
  currentIndex={0}
  onSelect={(chapter, index) => console.log('Selected:', chapter)}
/>`,
    controls: [
      {
        name: 'orientation',
        type: 'select',
        label: 'Orientation',
        options: ['vertical', 'horizontal'],
      },
      {
        name: 'side',
        type: 'select',
        label: 'Card Side',
        options: ['right', 'left', 'top', 'bottom'],
      },
      { name: 'peakLength', type: 'number', label: 'Peak Length (px)', min: 30, max: 100, step: 2 },
      { name: 'restLength', type: 'number', label: 'Rest Length (px)', min: 8, max: 30, step: 1 },
      { name: 'rowHeight', type: 'number', label: 'Spacing / Row Height', min: 10, max: 36, step: 2 },
      { name: 'radius', type: 'number', label: 'Wave Radius (units)', min: 2, max: 8, step: 1 },
    ],
    render: (props: any) => {
      const [currentIdx, setCurrentIdx] = useState(0)

      return (
        <div className="flex items-center justify-center min-h-[280px] w-full p-8">
          <div className="flex items-center justify-center p-8 rounded-macro border border-border/70 bg-muted/20">
            <ChapterScrubber
              {...props}
              currentIndex={currentIdx}
              onSelect={(_, idx) => setCurrentIdx(idx)}
            />
          </div>
        </div>
      )
    },
  },
  examples: [
    {
      title: 'Vertical Video & Media Scrubber',
      description:
        'Tactile vertical scrubber rail simulating video chapters with timestamps, custom category badges, and active chapter tracking.',
      render: () => {
        const [selectedChapter, setSelectedChapter] = useState<ChapterScrubberItem>(SAMPLE_VIDEO_CHAPTERS[0]!)
        const [currentIndex, setCurrentIndex] = useState(0)

        return (
          <div className="w-full max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-8 p-6 rounded-macro border border-border/80 bg-muted/20">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-bold text-fg">Active Video Chapter</h4>
              </div>
              <div className="p-4 rounded-base border border-border bg-bg/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-fg">{selectedChapter.meta}</span>
                  {selectedChapter.badge}
                </div>
                <h3 className="text-base font-semibold text-fg tracking-tight">
                  {selectedChapter.title}
                </h3>
                <p className="text-xs text-muted-fg leading-relaxed">
                  {selectedChapter.description}
                </p>
              </div>
              <p className="text-2xs font-mono text-muted-fg">
                Hover or drag along the scrubber ticks to inspect chapter cards. Click or press Enter to jump.
              </p>
            </div>

            <div className="py-4 px-6 border-l border-border/60">
              <ChapterScrubber
                chapters={SAMPLE_VIDEO_CHAPTERS}
                orientation="vertical"
                side="left"
                currentIndex={currentIndex}
                rowHeight={16}
                peakLength={60}
                restLength={16}
                onSelect={(chap, idx) => {
                  setSelectedChapter(chap)
                  setCurrentIndex(idx)
                }}
              />
            </div>
          </div>
        )
      },
    },
    {
      title: 'Horizontal Audio & Podcast Timeline',
      description:
        'Horizontal orientation suitable for bottom media player bars and audio wave scrubbers.',
      render: () => {
        const [activeIdx, setActiveIdx] = useState(1)

        return (
          <div className="w-full max-w-3xl flex flex-col gap-6 p-6 rounded-macro border border-border/80 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-fg">Podcast Audio Rail</span>
              </div>
              <Badge intent="primary" size="sm">
                Track {activeIdx + 1} of {SAMPLE_PODCAST_CHAPTERS.length}
              </Badge>
            </div>

            <div className="pt-12 pb-4 px-8 rounded-base border border-border/60 bg-bg flex items-center justify-center">
              <div className="w-full max-w-md">
                <ChapterScrubber
                  chapters={SAMPLE_PODCAST_CHAPTERS}
                  orientation="horizontal"
                  side="top"
                  currentIndex={activeIdx}
                  rowHeight={24}
                  peakLength={50}
                  restLength={12}
                  onSelect={(_, idx) => setActiveIdx(idx)}
                />
              </div>
            </div>
          </div>
        )
      },
    },
  ],
}
