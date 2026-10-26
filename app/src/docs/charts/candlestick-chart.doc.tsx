import React from 'react'
import { CandlestickChart } from '@consona/interface'
import type { ComponentDocSpec } from '../types'

const ohlcSampleData = [
  { date: '09/01', open: 178.2, high: 182.4, low: 177.1, close: 181.5, volume: 45200 },
  { date: '09/02', open: 181.5, high: 184.8, low: 180.2, close: 184.1, volume: 51300 },
  { date: '09/03', open: 184.1, high: 185.6, low: 182.0, close: 182.8, volume: 38900 },
  { date: '09/04', open: 182.8, high: 183.9, low: 179.5, close: 180.1, volume: 47600 },
  { date: '09/05', open: 180.1, high: 186.2, low: 179.8, close: 185.9, volume: 62400 },
  { date: '09/08', open: 185.9, high: 188.4, low: 184.5, close: 187.6, volume: 58900 },
  { date: '09/09', open: 187.6, high: 191.2, low: 186.9, close: 190.4, volume: 71200 },
  { date: '09/10', open: 190.4, high: 192.5, low: 188.1, close: 189.2, volume: 49800 },
  { date: '09/11', open: 189.2, high: 193.8, low: 188.6, close: 193.1, volume: 65400 },
  { date: '09/12', open: 193.1, high: 196.4, low: 192.2, close: 195.8, volume: 82100 },
  { date: '09/15', open: 195.8, high: 197.0, low: 193.4, close: 194.2, volume: 54300 },
  { date: '09/16', open: 194.2, high: 198.5, low: 193.9, close: 197.9, volume: 77800 },
]

export const candlestickChartDoc: ComponentDocSpec = {
  id: 'candlestick-chart',
  name: 'CandlestickChart',
  component: CandlestickChart,
  summary: 'Financial OHLC candlestick visualizer with Moving Average overlays, volume histograms, precision crosshairs, and full compound composition.',
  subcomponents: [
    'CandlestickChart.Container',
    'CandlestickChart.Header',
    'CandlestickChart.Toolbar',
    'CandlestickChart.Legend',
    'CandlestickChart.Canvas',
    'CandlestickChart.Tooltip',
    'CandlestickChart.Empty',
    'CandlestickChart.Loading',
    'CandlestickChart.Footer',
  ],
  playground: {
    defaultProps: {
      enableVolume: true,
      containerVariant: 'default',
      movingAverages: [5],
    },
    controls: [
      {
        name: 'enableVolume',
        type: 'boolean',
      },
      {
        name: 'containerVariant',
        type: 'select',
        options: ['default', 'glass', 'subtle', 'bordered', 'flat', 'glow'],
      },
    ],
    render: (props: any) => (
      <div className="w-full max-w-2xl p-4">
        <CandlestickChart
          data={ohlcSampleData}
          title="NVDA — NVIDIA Corporation"
          description="Daily OHLC price action with SMA(5) trendline and volume histogram."
          badge="$197.90 (+1.9%)"
          height={380}
          timeRanges={['1D', '1W', '1M', '1Y', 'ALL']}
          defaultRange="1M"
          {...props}
        />
      </div>
    ),
  },
  examples: [
    {
      title: 'Compound Composed Financial Terminal',
      description: 'Using CandlestickChart.Container and CandlestickChart.Canvas for modular financial terminal widgets.',
      render: () => (
        <div className="w-full max-w-2xl">
          <CandlestickChart
            data={ohlcSampleData}
            movingAverages={[5]}
            enableVolume={true}
            height={300}
          >
            <CandlestickChart.Container variant="glass">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-fg">NVDA &middot; Pro Terminal</h4>
                  <p className="text-xs text-muted-fg">Daily OHLC candle volume with 5-day SMA</p>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono bg-success/15 text-success rounded font-semibold">$197.90 (+1.9%)</span>
              </div>
              <div className="p-2">
                <CandlestickChart.Canvas />
              </div>
              <div className="p-3 border-t border-border/40 text-xs text-muted-fg flex justify-between">
                <span>Real-time market feed</span>
                <span className="font-mono">P/E: 48.2 &middot; Vol: 77.8k</span>
              </div>
            </CandlestickChart.Container>
          </CandlestickChart>
        </div>
      ),
    },
    {
      title: 'Glassmorphic Trading Surface',
      description: 'Clean dark/light financial terminal styling with dual MA lines and volume.',
      render: () => (
        <div className="w-full">
          <CandlestickChart
            data={ohlcSampleData}
            title="AAPL — Apple Inc"
            badge="Bullish SMA Cross"
            containerVariant="glass"
            movingAverages={[3, 7]}
            height={340}
          />
        </div>
      ),
    },
  ],
}
