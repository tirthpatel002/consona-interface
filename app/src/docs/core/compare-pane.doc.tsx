import React from 'react'
import {
  ComparePane,
  ComparePaneFirst,
  ComparePaneSecond,
  ComparePaneHandle,
  ComparePaneLabel,
} from '@consona/interface'
import type { ComponentDocSpec } from '../types'

export const comparePaneDoc: ComponentDocSpec = {
  id: 'compare-pane',
  name: 'ComparePane',
  component: ComparePane,
  summary: 'Interactive before-and-after comparison slider driving zero-rerender CSS clip-path transformations with slider accessibility.',
  subcomponents: [
    'ComparePaneFirst',
    'ComparePaneSecond',
    'ComparePaneHandle',
    'ComparePaneDivider',
    'ComparePaneLabel',
  ],
  playground: {
    defaultProps: {
      orientation: 'horizontal',
      defaultPosition: 50,
    },
    controls: [
      { name: 'orientation', type: 'select', options: ['horizontal', 'vertical'] },
      { name: 'defaultPosition', type: 'number', min: 10, max: 90, step: 5 },
    ],
    render: (props: any) => (
      <div className="w-full max-w-xl h-80 p-2">
        <ComparePane {...props} className="h-full border border-border/80 shadow-sm">
          <ComparePaneFirst className="flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 via-stone-50 to-slate-100 dark:from-stone-900/90 dark:via-zinc-900 dark:to-stone-900 text-stone-800 dark:text-stone-100 p-6 select-none">
            <span className="text-xs font-mono tracking-widest uppercase text-stone-500 dark:text-stone-400 mb-2">
              Variant 01 • Alabaster Mist
            </span>
            <span className="text-2xl font-light tracking-tight font-serif italic text-stone-900 dark:text-stone-100">
              Atmospheric Light
            </span>
            <p className="text-xs text-stone-600/80 dark:text-stone-400 mt-2 max-w-xs text-center font-sans">
              Diffused natural daylight with subtle alabaster balance and low-contrast grain.
            </p>
          </ComparePaneFirst>

          <ComparePaneSecond className="flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-indigo-50/30 to-stone-100 dark:from-zinc-950 dark:via-slate-900/80 dark:to-stone-950 text-slate-800 dark:text-slate-100 p-6 select-none">
            <span className="text-xs font-mono tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-2">
              Variant 02 • Twilight Slate
            </span>
            <span className="text-2xl font-light tracking-tight font-serif italic text-slate-900 dark:text-slate-100">
              Nocturne Shadow
            </span>
            <p className="text-xs text-slate-600/80 dark:text-slate-400 mt-2 max-w-xs text-center font-sans">
              Calibrated ambient shadows with muted indigo undertones and specular depth.
            </p>
          </ComparePaneSecond>

          <ComparePaneLabel side="first" className="bg-stone-900/70 dark:bg-stone-800/80 text-stone-100 border border-stone-700/30">
            Alabaster
          </ComparePaneLabel>
          <ComparePaneLabel side="second" className="bg-slate-900/70 dark:bg-slate-800/80 text-slate-100 border border-slate-700/30">
            Nocturne
          </ComparePaneLabel>
          <ComparePaneHandle />
        </ComparePane>
      </div>
    ),
  },
  examples: [
    {
      title: 'Architectural Spec Grading (Horizontal)',
      description: 'Side-by-side inspection between raw schematic geometry and graded material finishes.',
      render: () => (
        <div className="w-full max-w-lg h-64 border border-border/70 rounded-macro overflow-hidden shadow-sm">
          <ComparePane orientation="horizontal" defaultPosition={46}>
            <ComparePaneFirst className="flex flex-col items-center justify-center bg-[#f7f5f0] dark:bg-[#1a1917] text-stone-700 dark:text-stone-300 p-6 select-none">
              <div className="flex flex-col items-center text-center space-y-1.5">
                <span className="text-[11px] font-mono tracking-widest uppercase text-stone-400 dark:text-stone-500">
                  Blueprint Pass
                </span>
                <div className="text-lg font-medium text-stone-800 dark:text-stone-200">
                  Neutral Linework
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400">
                  Monochrome vector profiles • 0.25pt wireframe
                </div>
              </div>
            </ComparePaneFirst>
            <ComparePaneSecond className="flex flex-col items-center justify-center bg-[#ede8dc] dark:bg-[#23201a] text-stone-800 dark:text-stone-200 p-6 select-none">
              <div className="flex flex-col items-center text-center space-y-1.5">
                <span className="text-[11px] font-mono tracking-widest uppercase text-stone-500 dark:text-stone-400">
                  Material Pass
                </span>
                <div className="text-lg font-medium text-stone-900 dark:text-stone-100">
                  Warm Travertine
                </div>
                <div className="text-xs text-stone-600/80 dark:text-stone-400">
                  PBR texture maps • Ambient occlusion 0.85
                </div>
              </div>
            </ComparePaneSecond>
            <ComparePaneLabel side="first" className="bg-stone-900/60 dark:bg-stone-800/80 text-stone-200 border border-stone-700/20">
              Linework
            </ComparePaneLabel>
            <ComparePaneLabel side="second" className="bg-stone-900/60 dark:bg-stone-800/80 text-stone-200 border border-stone-700/20">
              Textured
            </ComparePaneLabel>
            <ComparePaneHandle />
          </ComparePane>
        </div>
      ),
    },
    {
      title: 'Vertical Spectrum Comparison (Vertical)',
      description: 'Top-and-bottom stacked comparison slider for subtle tone curve and spectral balance.',
      render: () => (
        <div className="w-full max-w-lg h-72 border border-border/70 rounded-macro overflow-hidden shadow-sm">
          <ComparePane orientation="vertical" defaultPosition={48}>
            <ComparePaneFirst className="flex flex-col items-center justify-center bg-gradient-to-r from-slate-100 via-sky-50/40 to-slate-50 dark:from-slate-900 dark:via-sky-950/30 dark:to-slate-900 text-slate-800 dark:text-slate-200 p-4 select-none">
              <span className="text-[11px] font-mono tracking-widest uppercase text-slate-400 dark:text-slate-500 mb-1">
                Upper Domain • Cold Mist
              </span>
              <span className="text-base font-medium text-slate-900 dark:text-slate-100">
                5600K Daylight Spectrum
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Subtle cyan tint • Linear tone mapping
              </span>
            </ComparePaneFirst>
            <ComparePaneSecond className="flex flex-col items-center justify-center bg-gradient-to-r from-stone-100 via-amber-50/40 to-stone-50 dark:from-stone-900 dark:via-amber-950/20 dark:to-stone-900 text-stone-800 dark:text-stone-200 p-4 select-none">
              <span className="text-[11px] font-mono tracking-widest uppercase text-stone-400 dark:text-stone-500 mb-1">
                Lower Domain • Warm Dune
              </span>
              <span className="text-base font-medium text-stone-900 dark:text-stone-100">
                3200K Tungsten Horizon
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                Warm amber luminance • Filmic roll-off
              </span>
            </ComparePaneSecond>
            <ComparePaneLabel side="first" className="bg-slate-900/60 dark:bg-slate-800/80 text-slate-200 border border-slate-700/20">
              5600K
            </ComparePaneLabel>
            <ComparePaneLabel side="second" className="bg-stone-900/60 dark:bg-stone-800/80 text-stone-200 border border-stone-700/20">
              3200K
            </ComparePaneLabel>
            <ComparePaneHandle />
          </ComparePane>
        </div>
      ),
    },
  ],
}
