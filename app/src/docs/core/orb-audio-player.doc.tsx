import React from 'react'
import {
  OrbAudioPlayer,
  OrbAudioArtwork,
  ReactiveOrb,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const DEMO_AUDIO = '/sounds/songs/music.mp3'
const DEMO_ARTWORK = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&auto=format&fit=crop&q=80'

export const orbAudioPlayerDoc: ComponentDocSpec = {
  id: 'orb-audio-player',
  name: 'Orb Audio Player',
  component: OrbAudioPlayer,
  summary:
    'Audio-reactive player composite showcasing real-time WebGPU Liquid Glass Orb motion sensitive to audio frequency and volume when no track artwork is provided.',
  subcomponents: [
    'OrbAudioPlayer.Orb',
    'OrbAudioPlayer.Artwork',
    'OrbAudioPlayer.PlayButton',
    'OrbAudioPlayer.Timeline',
    'OrbAudioPlayer.TrackInfo',
    'OrbAudioPlayer.Scrubber',
    'OrbAudioPlayer.Time',
    'OrbAudioPlayer.Duration',
    'OrbAudioPlayer.MuteButton',
    'OrbAudioPlayer.VolumeSlider',
    'OrbAudioPlayer.SpeedDropdown',
    'OrbAudioPlayer.Pill',
  ],
  playground: {
    defaultProps: {
      title: 'Cosmic Resonance',
      artist: 'Consona Neural Engine',
      orbStyle: 'chrome',
      intent: 'primary',
      variant: 'card',
      orbSensitivity: 1.0,
      speedSensitivity: 1.2,
      sizeSensitivity: 1.0,
      contourSensitivity: 1.5,
      warpSensitivity: 1.2,
      glowSensitivity: 0.0,
    },
    controls: [
      {
        name: 'title',
        type: 'text',
      },
      {
        name: 'artist',
        type: 'text',
      },
      {
        name: 'orbStyle',
        type: 'select',
        options: [
          'aurora',
          'siri',
          'voiceWave',
          'chrome',
          'plasma',
          'gold',
          'emerald',
          'blueFlame',
          'violetEmber',
        ],
      },
      {
        name: 'intent',
        type: 'select',
        options: ['primary', 'secondary', 'warning', 'danger', 'success', 'info', 'indigo'],
      },
      {
        name: 'variant',
        type: 'select',
        options: ['card', 'hero', 'pill'],
      },
      {
        name: 'speedSensitivity',
        type: 'number',
        min: 0,
        max: 3,
        step: 0.1,
      },
      {
        name: 'sizeSensitivity',
        type: 'number',
        min: 0,
        max: 3,
        step: 0.1,
      },
      {
        name: 'contourSensitivity',
        type: 'number',
        min: 0,
        max: 3,
        step: 0.1,
      },
      {
        name: 'warpSensitivity',
        type: 'number',
        min: 0,
        max: 3,
        step: 0.1,
      },
      {
        name: 'glowSensitivity',
        type: 'number',
        min: 0,
        max: 3,
        step: 0.1,
      },
    ],
    render: (props) => (
      <div className="flex flex-col gap-4 w-full max-w-lg">
        <OrbAudioPlayer
          src={DEMO_AUDIO}
          title={props.title}
          artist={props.artist}
          orbStyle={props.orbStyle}
          intent={props.intent}
          variant={props.variant}
          orbSensitivity={props.orbSensitivity}
          speedSensitivity={props.speedSensitivity}
          sizeSensitivity={props.sizeSensitivity}
          contourSensitivity={props.contourSensitivity}
          warpSensitivity={props.warpSensitivity}
          glowSensitivity={props.glowSensitivity}
        />
      </div>
    ),
  },
  examples: [
    {
      title: 'Default WebGPU Reactive Orb Player',
      description:
        'When no artwork is specified, the player automatically renders a 60fps WebGPU Liquid Glass Orb that reacts dynamically to the audio volume, pulsating and warping with the rhythm.',
      render: () => (
        <div className="w-full max-w-lg">
          <OrbAudioPlayer
            src={DEMO_AUDIO}
            title="Synthetic Dreams"
            artist="ElevenLabs & Consona Audio"
            orbStyle="aurora"
            intent="primary"
          />
        </div>
      ),
    },
    {
      title: 'Hero Orb Centered Presentation',
      description:
        'Hero variant displaying a prominent central Orb with full audio sensitivity and centered metadata.',
      render: () => (
        <div className="w-full max-w-md">
          <OrbAudioPlayer
            src={DEMO_AUDIO}
            title="Celestial Flow"
            artist="Neural Soundscapes"
            variant="hero"
            orbStyle="plasma"
            intent="danger"
          />
        </div>
      ),
    },
    {
      title: 'OrbAudioPlayer.Pill — Mini Reactive Orb Pill',
      description:
        'Compact pill player featuring the reactive mini Orb on the left with our sleek curved cradle timeline.',
      render: () => (
        <div className="flex flex-col gap-4 w-full max-w-xl">
          <div className="flex flex-wrap items-center gap-4">
            <OrbAudioPlayer
              src={DEMO_AUDIO}
              title="Emerald Pulse"
              variant="pill"
              orbStyle="emerald"
              intent="success"
              contourSensitivity={0}
              
            />
            <OrbAudioPlayer
              src={DEMO_AUDIO}
              title="Gold Horizon"
              variant="pill"
              orbStyle="gold"
              intent="warning"
            />
            <OrbAudioPlayer
              src={DEMO_AUDIO}
              title="Indigo Fields"
              variant="pill"
              
              intent="indigo"
            />
          </div>
        </div>
      ),
    },
    {
      title: 'OrbAudioPlayer.Pill — Orb as Play/Pause Button',
      description:
        'Slim pill variant where the reactive Orb (or artwork) doubles as the play/pause button. No separate button is shown — the capsule shrinks to just the orb, and the timeline starts right from the orb\'s right curvature. Hover the orb to reveal the play/pause icon.',
      render: () => (
        <div className="flex flex-col gap-4 w-full max-w-xl">
          <div className="flex flex-wrap items-center gap-4">
            <OrbAudioPlayer
              src={DEMO_AUDIO}
              title="Emerald Pulse"
              variant="pill"
              orbStyle="emerald"
              intent="success"
              artworkAsButton
            />
            <OrbAudioPlayer
              src={DEMO_AUDIO}
              title="Plasma Storm"
              variant="pill"
              orbStyle="plasma"
              intent="danger"
              artworkAsButton
            />
            <OrbAudioPlayer
              src={DEMO_AUDIO}
              title="Chrome Fields"
              variant="pill"
              orbStyle="chrome"
              intent="indigo"
              artworkAsButton
            />
            <OrbAudioPlayer
              src={DEMO_AUDIO}
              title="With Artwork"
              artist="Hover to control"
              artwork={DEMO_ARTWORK}
              variant="pill"
              intent="primary"
              artworkAsButton
            />
          </div>
          <span className="text-xs text-muted-fg">
            Hover the orb or artwork to reveal the play/pause icon overlay, then click to toggle playback.
          </span>
        </div>
      ),
    },
    {
      title: 'Artwork Fallback Behavior',
      description:
        'When a track includes custom cover artwork, the image is rendered; when absent, it seamlessly falls back to the audio-reactive Orb.',
      render: () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
          <OrbAudioPlayer
            src={DEMO_AUDIO}
            title="With Track Artwork"
            artist="Studio Track"
            artwork={DEMO_ARTWORK}
            intent="primary"
          />
          <OrbAudioPlayer
            src={DEMO_AUDIO}
            title="Without Artwork (Orb Default)"
            artist="Procedural Stream"
            orbStyle="violetEmber"
            intent="primary"
          />
        </div>
      ),
    },
    {
      title: 'Granular Reactivity Tuning (Speed, Size, Contour & Glow)',
      description:
        'Customize exactly which parameters of the WebGPU Orb react to the audio track using speedSensitivity, sizeSensitivity, contourSensitivity, and glowSensitivity.',
      render: () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
          <OrbAudioPlayer
            src={DEMO_AUDIO}
            title="High Flow & Contour Warp"
            artist="Speed: 2.0 • Contour: 2.2 • Size: 1.0"
            orbStyle="aurora"
            intent="primary"
            speedSensitivity={2.0}
            contourSensitivity={2.2}
            sizeSensitivity={1.0}
          />
          <OrbAudioPlayer
            src={DEMO_AUDIO}
            title="Pulsating Core with Glow"
            artist="Size: 1.8 • Glow: 1.5 • Speed: 1.0"
            orbStyle="gold"
            intent="warning"
            sizeSensitivity={1.8}
            glowSensitivity={1.5}
            speedSensitivity={1.0}
          />
        </div>
      ),
    },
  ],
}
