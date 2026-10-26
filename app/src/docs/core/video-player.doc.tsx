import React from 'react'
import {
  VideoPlayer,
  VideoPlayerDefault,
  VideoPlayerControls,
  VideoPlayerPlayButton,
  VideoPlayerScrubber,
  VideoPlayerTime,
  VideoPlayerMuteButton,
  VideoPlayerVolumeSlider,
  VideoPlayerFullscreenButton,
  VideoPlayerTopBar,
  VideoPlayerActionRow,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const DEMO_VIDEO = 'https://www.w3schools.com/html/mov_bbb.mp4'
const DEMO_POSTER = 'https://www.w3schools.com/html/pic_trulli.jpg'

export const videoPlayerDoc: ComponentDocSpec = {
  id: 'video-player',
  name: 'Video Player',
  component: VideoPlayer,
  summary:
    'Accessible, responsive HTML5 video player with auto-hiding glass controls, smooth scrubber, volume slider, top bar title, and fullscreen support.',
  subcomponents: [
    'VideoPlayer',
    'VideoPlayerDefault',
    'VideoPlayer.Controls',
    'VideoPlayer.TopBar',
    'VideoPlayer.Scrubber',
    'VideoPlayer.PlayButton',
    'VideoPlayer.MuteButton',
    'VideoPlayer.VolumeSlider',
    'VideoPlayer.Time',
    'VideoPlayer.FullscreenButton',
    'VideoPlayer.ActionRow',
  ],
  playground: {
    defaultProps: {
      autoPlay: false,
      loop: false,
      aspectRatio: '16/9',
    },
    controls: [
      {
        name: 'autoPlay',
        type: 'boolean',
      },
      {
        name: 'loop',
        type: 'boolean',
      },
      {
        name: 'aspectRatio',
        type: 'select',
        options: ['16/9', '4/3', '1/1'],
      },
    ],
    render: (props) => (
      <div className="w-full max-w-xl">
        <VideoPlayer
          src={DEMO_VIDEO}
          poster={DEMO_POSTER}
          autoPlay={props.autoPlay}
          loop={props.loop}
          aspectRatio={props.aspectRatio}
          className="shadow-xl rounded-2xl overflow-hidden"
        />
      </div>
    ),
  },
  examples: [
    {
      title: 'Default Out-of-the-Box Player with Integrated Controls',
      description:
        'Pass only src, poster and aspectRatio. VideoPlayer automatically renders a glassmorphic gradient overlay with scrubber, play/pause, volume slider, elapsed time, and fullscreen toggle.',
      render: () => (
        <div className="w-full max-w-xl">
          <VideoPlayer
            src={DEMO_VIDEO}
            poster={DEMO_POSTER}
            aspectRatio="16/9"
            className="rounded-2xl overflow-hidden shadow-md"
          />
        </div>
      ),
    },
    {
      title: 'VideoPlayerDefault Preset with Title TopBar',
      description:
        'Pre-composed preset with custom top bar overlay and complete controls row matching interface-demo.',
      render: () => (
        <div className="w-full max-w-xl">
          <VideoPlayerDefault
            src={DEMO_VIDEO}
            poster={DEMO_POSTER}
            title="Big Buck Bunny — Sample Clip"
            aspectRatio="16/9"
            className="rounded-2xl overflow-hidden shadow-md"
          />
        </div>
      ),
    },
    {
      title: 'Custom Composed Controls Layout',
      description:
        'Compose child controls in any layout with VideoPlayerTopBar, VideoPlayerControls, and VideoPlayerActionRow.',
      render: () => (
        <div className="w-full max-w-xl">
          <VideoPlayer
            src={DEMO_VIDEO}
            poster={DEMO_POSTER}
            aspectRatio="16/9"
            className="rounded-2xl overflow-hidden shadow-md"
          >
            <VideoPlayerTopBar>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white drop-shadow">Big Buck Bunny — HTML5 Video</p>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-mono text-white">HD</span>
              </div>
            </VideoPlayerTopBar>
            <VideoPlayerControls>
              <VideoPlayerScrubber />
              <VideoPlayerActionRow>
                <VideoPlayerPlayButton />
                <VideoPlayerMuteButton />
                <VideoPlayerVolumeSlider />
                <VideoPlayerTime />
                <VideoPlayerFullscreenButton />
              </VideoPlayerActionRow>
            </VideoPlayerControls>
          </VideoPlayer>
        </div>
      ),
    },
  ],
}
