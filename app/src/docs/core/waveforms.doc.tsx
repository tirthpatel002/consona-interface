import React, { useState } from 'react'
import {
  BarVisualizer,
  LiveWaveform,
  type AgentState,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

function BarVisualizerAgentStatesDemo() {
  const [agentState, setAgentState] = useState<AgentState>('speaking')

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-wrap items-center gap-2">
        {(['idle', 'connecting', 'listening', 'thinking', 'speaking', 'muted', 'error'] as AgentState[]).map(
          (state) => (
            <button
              key={state}
              type="button"
              onClick={() => setAgentState(state)}
              className={`cursor-pointer rounded-base px-2.5 py-1 text-xs font-medium transition-colors ${
                agentState === state
                  ? 'bg-primary text-primary-fg shadow-xs'
                  : 'bg-muted text-muted-fg hover:bg-muted/80'
              }`}
            >
              {state}
            </button>
          )
        )}
      </div>
      <div className="flex h-28 items-center justify-center rounded-2xl border border-border/50 bg-card/60 p-4 backdrop-blur-md shadow-xs">
        <BarVisualizer state={agentState} barCount={24} demo />
      </div>
    </div>
  )
}

export const waveformsDoc: ComponentDocSpec = {
  id: 'bar-visualizer',
  name: 'Waveforms & Visualizers',
  component: BarVisualizer,
  summary:
    'High-performance audio visualization suite including BarVisualizer with voice agent state simulation and LiveWaveform canvas with static and real-time scrolling modes.',
  subcomponents: [
    'BarVisualizer',
    'LiveWaveform',
  ],
  playground: {
    defaultProps: {
      barCount: 24,
      align: 'center',
    },
    controls: [
      {
        name: 'barCount',
        type: 'number',
        defaultValue: 24,
      },
      {
        name: 'align',
        type: 'select',
        options: ['center', 'bottom'],
      },
    ],
    render: (props) => (
      <div className="flex flex-col gap-4 w-full max-w-lg">
        <div className="flex h-28 items-center justify-center rounded-2xl border border-border/50 bg-card/60 p-4 shadow-sm backdrop-blur-md">
          <BarVisualizer
            state="speaking"
            barCount={props.barCount}
            align={props.align}
            demo
          />
        </div>
      </div>
    ),
  },
  examples: [
    {
      title: 'BarVisualizer — Agent States Simulation',
      description:
        'Responsive multiband frequency visualizer supporting voice agent states (idle, connecting, listening, thinking, speaking, muted, error).',
      render: () => <BarVisualizerAgentStatesDemo />,
    },
    {
      title: 'BarVisualizer — Centered vs Bottom Alignment',
      description:
        'Easily toggle between centered wave reflection and bottom-grounded graphic equalizer bars.',
      render: () => (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full max-w-xl">
          <div className="flex h-28 flex-col items-center justify-center rounded-xl border border-border/50 bg-card/60 p-3 shadow-xs">
            <span className="mb-2 text-xs text-muted-fg font-mono">center</span>
            <BarVisualizer state="speaking" barCount={16} align="center" demo />
          </div>
          <div className="flex h-28 flex-col items-center justify-center rounded-xl border border-border/50 bg-card/60 p-3 shadow-xs">
            <span className="mb-2 text-xs text-muted-fg font-mono">bottom</span>
            <BarVisualizer state="speaking" barCount={16} align="bottom" demo />
          </div>
        </div>
      ),
    },
    {
      title: 'LiveWaveform — Static vs Scrolling Mode',
      description:
        'High-performance HTML5 Canvas audio waveform with smooth exponential interpolation for real-time streams.',
      render: () => (
        <div className="flex flex-col gap-4 w-full max-w-xl">
          <div className="rounded-2xl border border-border/50 bg-card/60 p-4 shadow-xs">
            <div className="mb-2 text-xs text-muted-fg font-medium">Static Waveform</div>
            <LiveWaveform mode="static" height={48} barCount={36} demo />
          </div>
          <div className="rounded-2xl border border-border/50 bg-card/60 p-4 shadow-xs">
            <div className="mb-2 text-xs text-muted-fg font-medium">Scrolling Waveform (Real-time stream)</div>
            <LiveWaveform mode="scrolling" height={48} barCount={48} demo />
          </div>
        </div>
      ),
    },
  ],
}
