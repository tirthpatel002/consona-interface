import React, { useState } from 'react'
import {
  AudioRecorder,
  AudioRecorderCard,
  AudioRecorderPill,
  AudioRecorderButton,
  SpeechInputButton,
  type AudioRecordingResult,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

function AudioRecorderPillDemo() {
  const [lastPillRecording, setLastPillRecording] = useState<AudioRecordingResult | null>(null)

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-wrap items-center gap-4">
        <AudioRecorderPill
          label="Voice Memo"
          intent="primary"
          size="md"
          onRecordingComplete={(res) => setLastPillRecording(res)}
          onDiscard={() => setLastPillRecording(null)}
        />
        <AudioRecorderPill
          label="Quick Note"
          intent="success"
          size="sm"
          onRecordingComplete={(res) => setLastPillRecording(res)}
          onDiscard={() => setLastPillRecording(null)}
        />
        <AudioRecorderPill
          label="Voice Recording"
          intent="danger"
          size="lg"
          onRecordingComplete={(res) => setLastPillRecording(res)}
          onDiscard={() => setLastPillRecording(null)}
        />
      </div>

      {lastPillRecording && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-xs text-fg animate-in fade-in slide-in-from-top-1 duration-200">
          <span className="flex size-2 rounded-full bg-primary animate-pulse" />
          <span className="font-semibold text-primary">Recording Captured:</span>
          <span className="font-mono tabular-nums font-medium">
            {lastPillRecording.duration.toFixed(1)}s ({(lastPillRecording.blob.size / 1024).toFixed(1)} KB, {lastPillRecording.blob.type || 'audio/wav'})
          </span>
          <a
            href={lastPillRecording.url}
            download={`recording-${Date.now()}.wav`}
            className="ml-auto underline hover:text-primary font-medium cursor-pointer"
          >
            Download .wav
          </a>
        </div>
      )}

      <span className="text-xs text-muted-fg">
        Tap the mic icon to record with live canvas waveform feedback, tap stop to finish, and review with 60fps morphing scrub playback.
      </span>
    </div>
  )
}

export const audioRecorderDoc: ComponentDocSpec = {
  id: 'audio-recorder',
  name: 'Audio Recorder',
  component: AudioRecorder,
  summary:
    'High-fidelity microphone capture suite featuring the flagship AudioRecorderPill with 60fps morphing playback review, live audio visualizer, and full card recorders.',
  subcomponents: [
    'AudioRecorderPill',
    'AudioRecorderCard',
    'AudioRecorderButton',
    'SpeechInputButton',
    'AudioRecorder.Timer',
    'AudioRecorder.Controls',
    'AudioRecorder.LiveVisualizer',
    'AudioRecorder.Provider',
  ],
  playground: {
    defaultProps: {
      intent: 'primary',
      size: 'md',
      label: 'Voice Memo',
    },
    controls: [
      {
        name: 'intent',
        type: 'select',
        options: ['primary', 'success', 'danger', 'secondary'],
      },
      {
        name: 'size',
        type: 'select',
        options: ['sm', 'md', 'lg'],
      },
      {
        name: 'label',
        type: 'text',
      },
    ],
    render: (props) => (
      <div className="flex flex-col gap-4 w-full max-w-lg">
        <AudioRecorderPill
          label={props.label}
          intent={props.intent}
          size={props.size}
        />
      </div>
    ),
  },
  examples: [
    {
      title: 'AudioRecorderPill (Live Waveform & Morphing Review)',
      description:
        'The flagship pill recorder. Features edge-to-edge trigger button, live microphone waveform capture, device menu, discard/re-record actions, and drag scrub playback.',
      render: () => <AudioRecorderPillDemo />,
    },
    {
      title: 'AudioRecorderCard (Bar Waveform Review)',
      description:
        'Full recorder card with real-time waveform capture, timer, download action, and bar-based playback preview.',
      render: () => (
        <div className="w-full max-w-lg">
          <AudioRecorderCard title="Voice Recorder (Waveform)" timelineVariant="bars" />
        </div>
      ),
    },
    {
      title: 'AudioRecorderCard (Slider Review)',
      description:
        'Full recorder card with smooth linear slider scrubber review and elapsed time counters.',
      render: () => (
        <div className="w-full max-w-lg">
          <AudioRecorderCard title="Voice Recorder (Slider)" timelineVariant="slider" />
        </div>
      ),
    },
    {
      title: 'AudioRecorderButton & SpeechInputButton',
      description:
        'Compact voice trigger button with inline mini waveform, instant listen action, and reset take button.',
      render: () => (
        <div className="flex flex-wrap items-center gap-4">
          <AudioRecorderButton />
          <SpeechInputButton
            placeholder="Press and hold or click to dictate..."
            onRecordingComplete={(_blob) => {
              // speech audio callback
            }}
          />
        </div>
      ),
    },
  ],
}
