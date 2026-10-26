import React, { useState } from 'react'
import {
  Slider,
  SliderTrack,
  SliderThumb,
  SliderFill,
  SliderOutput,
  Label,
  RangeSlider,
  AdaptiveSlider,
  Counter,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const sliderDoc: ComponentDocSpec = {
  id: 'slider',
  name: 'Slider',
  component: Slider,
  summary: 'Precise range slider control with optical thumb geometry, dynamic fill tracks, value outputs, and slot customizability.',
  subcomponents: ['SliderTrack', 'SliderThumb', 'SliderFill', 'SliderOutput', 'SliderGroup', 'RangeSlider', 'AdaptiveSlider'],
  playground: {
    defaultProps: {
      defaultValue: 50,
      minValue: 0,
      maxValue: 100,
      step: 1,
      thumb: 'circle',
      isDisabled: false
    },
    controls: [
      { name: 'thumb', type: 'select', options: ['circle', 'pill'] },
      { name: 'minValue', type: 'number', min: 0, max: 50 },
      { name: 'maxValue', type: 'number', min: 50, max: 200 },
      { name: 'step', type: 'number', min: 1, max: 10 },
      { name: 'isDisabled', type: 'boolean' },
    ],
    render: (props: any) => (
      <div className="w-full max-w-sm space-y-2">
        <Slider aria-label="Density Factor" {...props}>
          <div className="flex justify-between text-xs font-medium text-fg mb-1.5">
            <Label>Density Factor</Label>
            <SliderOutput />
          </div>
          <SliderTrack>
            <SliderFill />
            <SliderThumb />
          </SliderTrack>
        </Slider>
      </div>
    )
  },
  examples: [
    {
      title: 'AdaptiveSlider — Calorie Tracker (Adaptive Spring Motion)',
      description:
        'Fluid spring-animated slider with dynamic multi-stage gradients (Emerald → Pink → Violet/Indigo) composed with an animated digit Counter readout.',
      render: () => {
        const CalorieTrackerExample = () => {
          const [calories, setCalories] = useState<number>(200)
          return (
            <div className="flex w-full items-center justify-center p-4">
              <div className="flex w-full max-w-sm flex-col items-center justify-center rounded-[32px] border border-border/80 bg-bg-surface p-6 sm:p-8 shadow-2xl shadow-black/5 dark:bg-neutral-900 dark:shadow-none">
                <span className="mb-2 text-sm font-bold tracking-wide text-[#878787] dark:text-neutral-500">
                  Calories
                </span>
                <div className="mb-6 flex items-center justify-center gap-1.5 leading-none">
                  <Counter
                    value={calories}
                    className="text-5xl font-extrabold tracking-tight text-fg leading-none sm:text-6xl"
                  />
                  <span className="text-4xl font-extrabold text-[#010101] leading-none transition-colors dark:text-neutral-100 sm:text-5xl">
                    kCal
                  </span>
                </div>
                <AdaptiveSlider
                  value={calories}
                  min={50}
                  max={350}
                  step={25}
                  size="xl"
                  onChange={setCalories}
                />
              </div>
            </div>
          )
        }
        return <CalorieTrackerExample />
      },
    },
    {
      title: 'AdaptiveSlider — Workout Intensity (Custom Stages & Units)',
      description:
        'Custom minimum, maximum, step increment, and color stages tailored for heart rate / workout target intensity tracking.',
      render: () => {
        const WorkoutIntensityExample = () => {
          const [bpm, setBpm] = useState<number>(140)
          return (
            <div className="flex w-full items-center justify-center p-4">
              <div className="flex w-full max-w-sm flex-col items-center justify-center rounded-[28px] border border-border/80 bg-bg-surface p-6 sm:p-8 shadow-2xl shadow-black/5 dark:bg-neutral-900 dark:shadow-none">
                <span className="mb-2 text-xs font-bold tracking-wide uppercase text-muted-fg">
                  Target Heart Rate
                </span>
                <div className="mb-5 flex items-center justify-center gap-1.5 leading-none">
                  <Counter
                    value={bpm}
                    className="text-4xl font-extrabold tracking-tight text-fg leading-none sm:text-5xl"
                  />
                  <span className="text-2xl font-extrabold text-muted-fg leading-none sm:text-3xl">
                    BPM
                  </span>
                </div>
                <AdaptiveSlider
                  value={bpm}
                  min={60}
                  max={200}
                  step={5}
                  size="lg"
                  dotCount={7}
                  colorStages={[
                    {
                      threshold: 0.45,
                      text: '#06B6D4',
                      gradient: 'linear-gradient(to right, #38BDF8, #06B6D4)',
                      thumbBorder: '#06B6D4',
                    },
                    {
                      threshold: 0.75,
                      text: '#F59E0B',
                      gradient: 'linear-gradient(to right, #FDE047, #F59E0B)',
                      thumbBorder: '#F59E0B',
                    },
                    {
                      threshold: 1.0,
                      text: '#EF4444',
                      gradient: 'linear-gradient(to right, #F87171, #DC2626)',
                      thumbBorder: '#EF4444',
                    },
                  ]}
                  onChange={setBpm}
                />
              </div>
            </div>
          )
        }
        return <WorkoutIntensityExample />
      },
    },
    {
      title: 'AdaptiveSlider — Size Variants (sm, md, lg, xl)',
      description:
        'Customizable scale presets adjusting track height and thumb size proportionally across 4 size steps.',
      render: () => {
        const SizeVariantsExample = () => {
          const [size, setSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('xl')
          const [val, setVal] = useState<number>(225)
          const sizes: Array<'sm' | 'md' | 'lg' | 'xl'> = ['sm', 'md', 'lg', 'xl']

          const sizeTypographyMap = {
            sm: { counter: 'text-2xl sm:text-3xl', unit: 'text-base sm:text-lg', label: 'text-2xs' },
            md: { counter: 'text-3xl sm:text-4xl', unit: 'text-xl sm:text-2xl', label: 'text-xs' },
            lg: { counter: 'text-4xl sm:text-5xl', unit: 'text-2xl sm:text-3xl', label: 'text-sm' },
            xl: { counter: 'text-5xl sm:text-6xl', unit: 'text-4xl sm:text-5xl', label: 'text-sm' },
          }

          return (
            <div className="flex w-full flex-col items-center gap-6 p-4">
              <div className="flex items-center gap-1.5 rounded-base border border-border bg-bg-surface p-1 shadow-xs">
                {sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`rounded-micro px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                      size === s
                        ? 'bg-primary text-primary-fg shadow-xs'
                        : 'text-muted-fg hover:text-fg'
                    }`}
                  >
                    {s} {s === 'xl' ? '(default)' : ''}
                  </button>
                ))}
              </div>

              <div className="flex w-full items-center justify-center">
                <div className="flex w-full max-w-sm flex-col items-center justify-center rounded-[28px] border border-border/80 bg-bg-surface p-6 sm:p-8 shadow-2xl shadow-black/5 dark:bg-neutral-900 dark:shadow-none">
                  <span className={`mb-2 font-bold tracking-wide text-[#878787] dark:text-neutral-500 ${sizeTypographyMap[size].label}`}>
                    Calories
                  </span>
                  <div className="mb-6 flex items-center justify-center gap-1.5 leading-none">
                    <Counter
                      value={val}
                      className={`font-extrabold tracking-tight text-fg leading-none ${sizeTypographyMap[size].counter}`}
                    />
                    <span className={`font-extrabold text-[#010101] leading-none transition-colors dark:text-neutral-100 ${sizeTypographyMap[size].unit}`}>
                      kCal
                    </span>
                  </div>
                  <AdaptiveSlider
                    size={size}
                    value={val}
                    min={50}
                    max={350}
                    step={25}
                    onChange={setVal}
                  />
                </div>
              </div>
            </div>
          )
        }
        return <SizeVariantsExample />
      },
    },
    {
      title: 'AdaptiveSlider — Width Options & Responsive Containers',
      description:
        'Control slider width using presets (xs, sm, md, lg, xl, full) or numeric pixel values, adapting seamlessly to layouts.',
      render: () => {
        const WidthExample = () => {
          const [width, setWidth] = useState<'xs' | 'sm' | 'md' | 'full'>('md')
          const [val, setVal] = useState<number>(180)
          const widths: Array<'xs' | 'sm' | 'md' | 'full'> = ['xs', 'sm', 'md', 'full']

          return (
            <div className="flex w-full flex-col items-center gap-6 p-4">
              <div className="flex items-center gap-1.5 rounded-base border border-border bg-bg-surface p-1 shadow-xs">
                {widths.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWidth(w)}
                    className={`rounded-micro px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                      width === w
                        ? 'bg-primary text-primary-fg shadow-xs'
                        : 'text-muted-fg hover:text-fg'
                    }`}
                  >
                    width: {w}
                  </button>
                ))}
              </div>

              <div className="flex w-full flex-col items-center justify-center rounded-macro border border-border bg-bg-surface p-6 shadow-subtle space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-muted-fg">Daily Budget:</span>
                  <div className="flex items-center font-bold text-fg">
                    <span>$</span>
                    <Counter value={val} className="text-lg font-extrabold" />
                  </div>
                </div>
                <AdaptiveSlider
                  width={width}
                  size="md"
                  value={val}
                  min={50}
                  max={350}
                  step={25}
                  onChange={setVal}
                />
              </div>
            </div>
          )
        }
        return <WidthExample />
      },
    },
    {
      title: 'AdaptiveSlider — Inline Track Control',
      description:
        'Embedding the adaptive spring motion slider track directly within standard form controls or compact setting panels.',
      render: () => {
        const InlineAdaptiveExample = () => {
          const [volume, setVolume] = useState<number>(65)
          return (
            <div className="w-full max-w-sm rounded-macro border border-border bg-bg-surface p-6 shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-fg">Master Output</h4>
                <div className="flex items-center text-xs font-bold text-muted-fg">
                  <Counter value={volume} className="font-bold text-fg" />
                  <span>%</span>
                </div>
              </div>
              <AdaptiveSlider
                size="md"
                value={volume}
                min={0}
                max={100}
                step={1}
                dotCount={5}
                onChange={setVolume}
              />
            </div>
          )
        }
        return <InlineAdaptiveExample />
      },
    },
    {
      title: 'RangeSlider — Price Range Picker',
      description: 'Dual-thumb RangeSlider with formatted currency output. The onChange handler drives a controlled display, demonstrating the [number, number] tuple API.',
      render: () => {
        const PriceRange = () => {
          const [range, setRange] = useState<[number, number]>([200, 800])
          return (
            <div className="w-full max-w-sm space-y-4">
              <RangeSlider
                aria-label="Price range"
                value={range}
                onChange={(v) => setRange(v as [number, number])}
                minValue={0}
                maxValue={1000}
                step={10}
              >
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-sm font-medium text-fg">Price Range</Label>
                  <span className="text-xs font-mono font-semibold text-primary tabular-nums">
                    ${range[0]} – ${range[1]}
                  </span>
                </div>
                <SliderTrack>
                  <SliderFill />
                  <SliderThumb index={0} aria-label="Minimum price" />
                  <SliderThumb index={1} aria-label="Maximum price" />
                </SliderTrack>
                <div className="flex justify-between mt-1.5 text-2xs text-muted-fg tabular-nums">
                  <span>$0</span>
                  <span>$1,000</span>
                </div>
              </RangeSlider>
            </div>
          )
        }
        return <PriceRange />
      }
    },
    {
      title: 'RangeSlider — Zero-Config Default',
      description: 'The simplest usage — no props required. Defaults to [25, 75] uncontrolled with showOutput for an instant readout.',
      render: () => (
        <div className="w-full max-w-sm space-y-6">
          <RangeSlider aria-label="Opacity range" showOutput />
          <RangeSlider
            aria-label="Zoom range"
            defaultValue={[10, 60]}
            minValue={0}
            maxValue={100}
            step={5}
            showOutput
          />
        </div>
      )
    },
    {
      title: 'RangeSlider — Image Adjustment Panel',
      description: 'Multiple independent RangeSliders in a controls panel — contrast, exposure, and temperature ranges with labeled readouts.',
      render: () => <ImagePanel />
    },
  ]
}

/* ── Hoisted to module scope so React sees a stable component identity ──────
   Defining components inside render() or another component's body creates a
   new type reference on every parent re-render → React unmounts + remounts
   the child, which kills the pointer capture mid-drag and breaks the thumbs.  */

interface AdjustRowProps {
  label: string
  value: [number, number]
  onChange: (v: [number, number]) => void
  min?: number
  max?: number
}

const AdjustRow = ({ label, value, onChange, min = 0, max = 100 }: AdjustRowProps) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-baseline">
      <span className="text-xs font-medium text-fg">{label}</span>
      <span className="text-2xs font-mono text-muted-fg tabular-nums">
        {value[0]} – {value[1]}
      </span>
    </div>
    <RangeSlider
      aria-label={label}
      value={value}
      onChange={(v) => onChange?.(v as [number, number])}
      minValue={min}
      maxValue={max}
    >
      <SliderTrack>
        <SliderFill />
        <SliderThumb index={0} aria-label={`${label} low`} />
        <SliderThumb index={1} aria-label={`${label} high`} />
      </SliderTrack>
    </RangeSlider>
  </div>
)

const ImagePanel = () => {
  const [contrast, setContrast] = useState<[number, number]>([20, 80])
  const [exposure, setExposure] = useState<[number, number]>([30, 70])
  const [temp, setTemp] = useState<[number, number]>([40, 65])

  return (
    <div className="w-full max-w-sm rounded-base border border-border bg-overlay p-4 space-y-4">
      <p className="text-xs font-semibold text-fg tracking-wide uppercase">Image Adjustments</p>
      <AdjustRow label="Contrast" value={contrast} onChange={setContrast} />
      <AdjustRow label="Exposure" value={exposure} onChange={setExposure} />
      <p className='text-xs font-semibold text-fg tracking-wide uppercase'>Min 20 & Max 80</p>
      <AdjustRow label="Color Temp" value={temp} onChange={setTemp} min={20} max={80} />
    </div>
  )
}
