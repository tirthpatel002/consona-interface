import React, { useState } from 'react'
import { Counter, CounterControl, Button, type CounterSize, type CounterControlSize } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const counterDoc: ComponentDocSpec = {
  id: 'counter',
  name: 'Counter',
  component: Counter,
  subcomponents: ['CounterControl'],
  summary:
    'Continuous spring-animated rolling numerical ticker with fluid digit insertion/removal, editable counter controls with increment/decrement steppers, and delta options.',
  playground: {
    defaultProps: {
      value: 15327,
      size: '3xl',
      fontSize: undefined,
    },
    controls: [
      { name: 'value', type: 'number', min: 0, max: 999999 },
      {
        name: 'size',
        type: 'select',
        options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'],
      },
      { name: 'fontSize', type: 'number', min: 12, max: 96 },
    ],
    render: (props: any) => (
      <div className="flex w-full items-center justify-center p-8">
        <div className="rounded-macro border border-border bg-bg-surface p-8 shadow-subtle flex flex-col items-center gap-4">
          <span className="text-xs text-muted-fg font-medium">Dynamic Live Ticker</span>
          <Counter {...props} />
        </div>
      </div>
    ),
  },
  examples: [
    {
      title: 'CounterControl — Interactive Stepper with Editable Counter',
      description:
        'Centered rolling counter flanked by "-" and "+" action buttons. Click the central number to type directly (with toast error notification for non-numeric input) or use buttons.',
      render: () => {
        const ControlExample = () => {
          const [val, setVal] = useState<number>(42)

          return (
            <div className="flex w-full flex-col items-center gap-6 p-6">
              <div className="flex flex-col items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-fg">
                  Quantity Selector (Click number to edit)
                </span>
                <CounterControl
                  value={val}
                  min={0}
                  max={500}
                  step={1}
                  deltaOptions={[1, 5, 10, 25]}
                  size="lg"
                  onChange={setVal}
                />
              </div>
            </div>
          )
        }
        return <ControlExample />
      },
    },
    {
      title: 'CounterControl — Size Variants (sm, md, lg, xl)',
      description:
        'Proportionally scaled stepper controls with synchronized button sizes, padding, and counter typography.',
      render: () => {
        const ControlSizesExample = () => {
          const [val, setVal] = useState<number>(100)
          const sizes: CounterControlSize[] = ['sm', 'md', 'lg', 'xl']

          return (
            <div className="flex w-full flex-col items-center gap-6 p-4">
              <div className="flex flex-wrap items-center justify-center gap-6">
                {sizes.map((s) => (
                  <div key={s} className="flex flex-col items-center gap-2">
                    <span className="text-2xs font-mono uppercase text-muted-fg">size="{s}"</span>
                    <CounterControl
                      size={s}
                      value={val}
                      min={0}
                      max={1000}
                      step={10}
                      onChange={setVal}
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        }
        return <ControlSizesExample />
      },
    },
    {
      title: 'Dynamic Value Transitions (e.g. 39 ↔ 15,327)',
      description:
        'Smoothly handles variable length number jumps, animating newly added digits in and rolling existing columns.',
      render: () => {
        const ValueTransitionExample = () => {
          const [val, setVal] = useState<number>(39)

          return (
            <div className="flex w-full flex-col items-center gap-6 p-6">
              <div className="rounded-macro border border-border bg-bg-surface px-8 py-6 shadow-subtle flex flex-col items-center gap-2 min-w-[240px]">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-fg">
                  Metric Counter
                </span>
                <Counter value={val} size="4xl" className="text-primary" />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                {[39, 15327, 2048, 7, 99999, 0].map((target) => (
                  <Button
                    key={target}
                    size="sm"
                    intent={val === target ? 'primary' : 'outline'}
                    onPress={() => setVal(target)}
                  >
                    Set {target.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>
          )
        }
        return <ValueTransitionExample />
      },
    },
    {
      title: 'Size Presets (xs through 6xl)',
      description:
        'Standardized typography scale presets adjusting font sizes and line heights proportionally.',
      render: () => {
        const SizesExample = () => {
          const [num, setNum] = useState<number>(428)
          const sizes: CounterSize[] = ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl']

          return (
            <div className="flex w-full flex-col items-center gap-6 p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-xl">
                {sizes.map((s) => (
                  <div
                    key={s}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-base border border-border bg-bg-surface p-4"
                  >
                    <span className="text-2xs font-mono uppercase text-muted-fg">{s}</span>
                    <Counter value={num} size={s} />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" intent="outline" onPress={() => setNum((n) => n + 50)}>
                  +50
                </Button>
                <Button size="sm" intent="outline" onPress={() => setNum((n) => Math.max(0, n - 50))}>
                  -50
                </Button>
              </div>
            </div>
          )
        }
        return <SizesExample />
      },
    },
    {
      title: 'Custom Font Size in Pixels (fontSize prop)',
      description:
        'Pass an exact numeric pixel value or CSS dimension string to customize the counter font size precisely.',
      render: () => {
        const CustomFontSizeExample = () => {
          const [val, setVal] = useState<number>(1280)

          return (
            <div className="flex w-full flex-col items-center gap-4 p-6">
              <div className="flex items-center gap-4">
                <Counter value={val} fontSize={64} className="font-extrabold text-foreground" />
                <span className="text-2xl font-bold text-muted-fg">px scale</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" intent="outline" onPress={() => setVal(84)}>
                  84
                </Button>
                <Button size="sm" intent="outline" onPress={() => setVal(1280)}>
                  1,280
                </Button>
                <Button size="sm" intent="outline" onPress={() => setVal(64250)}>
                  64,250
                </Button>
              </div>
            </div>
          )
        }
        return <CustomFontSizeExample />
      },
    },
  ],
}

