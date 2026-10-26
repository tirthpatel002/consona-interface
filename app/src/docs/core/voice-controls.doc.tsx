import React, { useState } from 'react'
import {
  VoiceButton,
  MicSelector,
  SpeechInputButton,
  type AgentState,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

function VoiceButtonCycleDemo() {
  const [voiceButtonState, setVoiceButtonState] = useState<AgentState>('idle')

  const cycleState = () => {
    const nextState: Record<AgentState, AgentState> = {
      idle: 'connecting',
      connecting: 'listening',
      initializing: 'listening',
      listening: 'thinking',
      recording: 'thinking',
      thinking: 'speaking',
      processing: 'speaking',
      speaking: 'success',
      success: 'idle',
      error: 'idle',
      muted: 'idle',
    }
    setVoiceButtonState(nextState[voiceButtonState] ?? 'idle')
  }

  return (
    <div className="flex flex-wrap items-center gap-6">
      <VoiceButton
        state={voiceButtonState}
        onPress={cycleState}
      />
      <div className="text-xs text-muted-fg">
        Current agent state: <span className="font-semibold text-fg font-mono">{voiceButtonState}</span> (click to cycle)
      </div>
    </div>
  )
}

export const voiceControlsDoc: ComponentDocSpec = {
  id: 'voice-button',
  name: 'Voice & Microphone Controls',
  component: VoiceButton,
  summary:
    'Multi-state agent voice interaction button with ambient pulsing glows and microphone selector dropdown with real-time level meters.',
  subcomponents: [
    'VoiceButton',
    'MicSelector',
    'SpeechInputButton',
    'useAudioDevices',
  ],
  playground: {
    defaultProps: {
      size: 'md',
    },
    controls: [
      {
        name: 'size',
        type: 'select',
        options: ['sm', 'md', 'lg'],
      },
    ],
    render: (props) => (
      <div className="flex items-center gap-6">
        <VoiceButton size={props.size} />
      </div>
    ),
  },
  examples: [
    {
      title: 'VoiceButton (Multi-state Agent Button)',
      description:
        'Interactive AI agent voice button that transitions smoothly across states: idle, connecting, listening, thinking, speaking, and success.',
      render: () => <VoiceButtonCycleDemo />,
    },
    {
      title: 'MicSelector (Live Level Meter & Device Dropdown)',
      description:
        'Proactively checks microphone permissions, lists all available system audio inputs, and renders real-time VU level meters.',
      render: () => (
        <div className="max-w-xs w-full">
          <MicSelector showMuteToggle />
        </div>
      ),
    },
    {
      title: 'SpeechInputButton (Tap or Hold to Dictate)',
      description:
        'Modern dictation trigger with animated microphone pulse and direct audio blob capture callback.',
      render: () => (
        <div className="flex items-center gap-4">
          <SpeechInputButton
            placeholder="Press and hold or click to dictate..."
            onRecordingComplete={(_blob) => {
              console.log('Dictated audio captured')
            }}
          />
        </div>
      ),
    },
  ],
}
