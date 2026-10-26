import React, { useState } from 'react'
import {
  SensitiveOrb,
  Button,
  type StyleName,
} from '@consona/interface'
import {
  Activity,
  Zap,
  Volume2,
  Sliders,
  Sparkles,
} from 'lucide-react'
import type { ComponentDocSpec } from '../types'

const DEMO_AUDIO = '/sounds/songs/music.mp3'

export const sensitiveOrbDoc: ComponentDocSpec = {
  id: 'sensitive-orb',
  name: 'Sensitive Orb',
  subpath: '@consona/interface/orb',
  badge: 'Dynamic WebGPU',
  summary:
    'Audio-reactive and signal-sensitive procedural WebGPU liquid glass orb with fine-grained motion, warp, contour, and optical sensitivities.',
  subcomponents: ['SensitiveOrb', 'Orb'],
  playground: {
    defaultProps: {
      styleName: 'aurora' as StyleName,
      active: true,
      signal: 0.5,
      speedSensitivity: 1.4,
      sizeSensitivity: 1.2,
      contourSensitivity: 1.5,
      warpSensitivity: 1.2,
      glowSensitivity: 0.0,
      exposureSensitivity: 0.0,
      size: 260,
    },
    controls: [
      {
        name: 'styleName',
        label: 'Style Preset',
        type: 'select',
        options: [
          'aurora',
          'chrome',
          'plasma',
          'gold',
          'emerald',
          'blueFlame',
          'siri',
          'voiceWave',
          'violetEmber',
          'frost',
        ],
        defaultValue: 'aurora',
      },
      {
        name: 'active',
        label: 'Active / Modulating',
        type: 'boolean',
        defaultValue: true,
      },
      {
        name: 'signal',
        label: 'Input Signal (0..1)',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.5,
      },
      {
        name: 'speedSensitivity',
        label: 'Speed Sensitivity',
        type: 'number',
        min: 0,
        max: 3,
        step: 0.1,
        defaultValue: 1.4,
      },
      {
        name: 'sizeSensitivity',
        label: 'Radius / Pulse Sensitivity',
        type: 'number',
        min: 0,
        max: 3,
        step: 0.1,
        defaultValue: 1.2,
      },
      {
        name: 'contourSensitivity',
        label: 'Contour Deformation Sensitivity',
        type: 'number',
        min: 0,
        max: 3,
        step: 0.1,
        defaultValue: 1.5,
      },
      {
        name: 'warpSensitivity',
        label: 'Fluid Vortex Warp Sensitivity',
        type: 'number',
        min: 0,
        max: 3,
        step: 0.1,
        defaultValue: 1.2,
      },
      {
        name: 'glowSensitivity',
        label: 'Glow Sensitivity',
        type: 'number',
        min: 0,
        max: 3,
        step: 0.1,
        defaultValue: 0.0,
      },
    ],
    render: (props: any) => (
      <div className="flex flex-col items-center justify-center p-6 w-full">
        <SensitiveOrb
          styleName={props.styleName}
          active={props.active}
          signal={props.signal}
          speedSensitivity={props.speedSensitivity}
          sizeSensitivity={props.sizeSensitivity}
          contourSensitivity={props.contourSensitivity}
          warpSensitivity={props.warpSensitivity}
          glowSensitivity={props.glowSensitivity}
          size={props.size ?? 260}
        />
      </div>
    ),
  },
  examples: [
    {
      title: 'Signal-Driven Dynamic Orb',
      description:
        'SensitiveOrb continuously modulates flow speed, vortex turbulence, and pulsation in response to numeric energy signals or AI agent voice streams.',
      render: () => {
        const [signal, setSignal] = useState(0.4)
        return (
          <div className="flex flex-col sm:flex-row items-center gap-8 p-6 rounded-2xl bg-card/50 border border-border/50 w-full">
            <SensitiveOrb
              styleName="plasma"
              signal={signal}
              speedSensitivity={1.5}
              sizeSensitivity={1.2}
              contourSensitivity={1.4}
              size={192}
            />
            <div className="flex flex-col gap-4 flex-1 w-full">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-fg">Continuous Input Energy</span>
                <span className="font-mono text-xs text-muted-fg">{Math.round(signal * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={signal}
                onChange={(e) => setSignal(parseFloat(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <div className="flex gap-2">
                <Button size="sm" intent="secondary" onClick={() => setSignal(0)}>
                  Idle (0%)
                </Button>
                <Button size="sm" intent="secondary" onClick={() => setSignal(0.5)}>
                  Moderate (50%)
                </Button>
                <Button size="sm" intent="secondary" onClick={() => setSignal(1.0)}>
                  Peak (100%)
                </Button>
              </div>
            </div>
          </div>
        )
      },
    },
    {
      title: 'Audio Element Reactive Stream',
      description:
        'Pass any HTMLMediaElement (<audio> or <video>) directly to automatically sample frequency and RMS volume via WebAudio FFT.',
      render: () => {
        const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null)
        const [isPlaying, setIsPlaying] = useState(false)

        const togglePlay = () => {
          if (!audioEl) return
          if (isPlaying) {
            audioEl.pause()
            setIsPlaying(false)
          } else {
            audioEl.play()
            setIsPlaying(true)
          }
        }

        return (
          <div className="flex flex-col sm:flex-row items-center gap-8 p-6 rounded-2xl bg-card/50 border border-border/50 w-full">
            <audio
              ref={(el) => setAudioEl(el)}
              src={DEMO_AUDIO}
              loop
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            <SensitiveOrb
              styleName="emerald"
              active={isPlaying}
              audioElement={audioEl}
              speedSensitivity={1.4}
              sizeSensitivity={1.0}
              contourSensitivity={1.2}
              size={192}
            />
            <div className="flex flex-col gap-3 flex-1">
              <span className="text-base font-semibold text-fg">Audio-Reactive WebGPU Loop</span>
              <p className="text-xs text-muted-fg leading-relaxed">
                Connects directly to an HTML media element, analyzes acoustic energy at 60fps, and modulates fluid caustics smoothly.
              </p>
              <div>
                <Button onClick={togglePlay} size="sm" intent={isPlaying ? 'secondary' : 'primary'}>
                  {isPlaying ? 'Pause Audio' : 'Play Live Audio'}
                </Button>
              </div>
            </div>
          </div>
        )
      },
    },
    {
      title: 'Color and Optical Sensitivity Customization',
      description:
        'Easily override individual color stops, glass opacity, sheen, and vortex warp directly via orbProps or sensitivity options.',
      render: () => (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
          <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-card/40 border border-border/40 text-center">
            <SensitiveOrb
              styleName="chrome"
              active={true}
              signal={0.7}
              params={{
                colorA: '#FF2E93',
                colorB: '#00F0FF',
                colorC: '#7000FF',
                highlightColor: '#FFFFFF',
              }}
              size={128}
            />
            <span className="text-xs font-semibold text-fg">Cyber Neon</span>
          </div>

          <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-card/40 border border-border/40 text-center">
            <SensitiveOrb
              styleName="gold"
              active={true}
              signal={0.8}
              contourSensitivity={2.0}
              size={128}
            />
            <span className="text-xs font-semibold text-fg">Liquid Gold Warp</span>
          </div>

          <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-card/40 border border-border/40 text-center">
            <SensitiveOrb
              styleName="violetEmber"
              active={true}
              signal={0.6}
              warpSensitivity={1.8}
              size={128}
            />
            <span className="text-xs font-semibold text-fg">Violet Flame</span>
          </div>
        </div>
      ),
    },
  ],
}
