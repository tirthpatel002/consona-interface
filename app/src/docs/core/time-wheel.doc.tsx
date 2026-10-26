import React, { useState } from 'react'
import {
  InteractiveTimeWheel,
  TimeWheel,
  DrumColumn,
  type TimeObject,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const timeWheelDoc: ComponentDocSpec = {
  id: 'time-wheel',
  name: 'TimeWheel',
  component: TimeWheel,
  summary: 'Inertia momentum 3D drum wheel cylinder for touch gestures and mousewheel temporal selection.',
  subcomponents: ['InteractiveTimeWheel', 'DrumColumn'],
  playground: {
    defaultProps: {
      is24Hour: false,
      showSeconds: false,
      minuteStep: 5,
    },
    controls: [
      { name: 'is24Hour', type: 'boolean' },
      { name: 'showSeconds', type: 'boolean' },
      { name: 'minuteStep', type: 'select', options: ['1', '5', '10', '15'] },
    ],
    render: (props) => {
      const [time, setTime] = useState<TimeObject>({ hour: 9, minute: 30, second: 0 })
      return (
        <div className="flex flex-col items-center gap-4 p-4 max-w-xs mx-auto border border-border rounded-xl bg-card">
          <InteractiveTimeWheel
            value={time}
            onChange={setTime}
            {...props}
            minuteStep={Number(props.minuteStep) || 5}
          />
          <div className="font-mono text-xs text-muted-fg">
            Selected: {String(time.hour).padStart(2, '0')}:{String(time.minute).padStart(2, '0')}
          </div>
        </div>
      )
    },
  },
  examples: [
    {
      title: '12-Hour Time Wheel with AM/PM',
      description: 'Cylindrical 3D drum columns with smooth kinetic inertia and snapping.',
      render: () => {
        const [time, setTime] = useState<TimeObject>({ hour: 14, minute: 15, second: 0 })
        return (
          <div className="flex flex-col items-center gap-3 p-4 max-w-xs mx-auto border border-border rounded-xl bg-card">
            <InteractiveTimeWheel value={time} onChange={setTime} is24Hour={false} />
          </div>
        )
      },
    },
    {
      title: '24-Hour Military Time Wheel with Seconds',
      description: 'Precision 3-column drum wheel showing hours (00-23), minutes, and seconds.',
      render: () => {
        const [time, setTime] = useState<TimeObject>({ hour: 21, minute: 45, second: 12 })
        return (
          <div className="flex flex-col items-center gap-3 p-4 max-w-sm mx-auto border border-border rounded-xl bg-card">
            <InteractiveTimeWheel
              value={time}
              onChange={setTime}
              is24Hour
              showSeconds
              minuteStep={1}
            />
          </div>
        )
      },
    },
    {
      title: 'Standalone DrumColumn',
      description: 'Single reusable drum column primitive for custom number or category scrolling.',
      render: () => {
        const [val, setVal] = useState<number>(50)
        const numbers = Array.from({ length: 100 }, (_, i) => i)
        return (
          <div className="flex flex-col items-center gap-2 p-4 border border-border rounded-xl bg-card w-40 mx-auto">
            <span className="text-xs font-semibold text-fg">Custom Scroller</span>
            <DrumColumn items={numbers} value={val} onChange={setVal} />
            <span className="font-mono text-xs text-muted-fg">Value: {val}</span>
          </div>
        )
      },
    },
    {
      title: 'Min / max time with remaining',
      description: 'Wheel values clamp into the window and show how much time remains until maxTime.',
      render: () => {
        const [time, setTime] = useState<TimeObject>({ hour: 10, minute: 0, second: 0 })
        return (
          <div className="flex flex-col items-center gap-3 p-4 max-w-xs mx-auto border border-border rounded-xl bg-card">
            <InteractiveTimeWheel
              value={time}
              onChange={setTime}
              minTime={{ hour: 9, minute: 0, second: 0 }}
              maxTime={{ hour: 17, minute: 0, second: 0 }}
              showRemaining
            />
          </div>
        )
      },
    },
  ],
}
