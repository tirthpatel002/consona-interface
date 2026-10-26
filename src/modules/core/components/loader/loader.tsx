import React from 'react'
import { ProgressBar } from 'react-aria-components/ProgressBar'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'

export const LOADER_SIZES = {
  xs: 'size-3',
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-5',
  xl: 'size-6',
  '2xl': 'size-8',
  '3xl': 'size-12',
} as const

export type LoaderSize = keyof typeof LOADER_SIZES

/* ==========================================================================
   Loader Graphics & Animation Implementations
   ========================================================================== */

type LoaderGraphicProps = React.SVGProps<SVGSVGElement> & {
  size?: LoaderSize
  strokeWidth?: number | string
}

type LoaderDivGraphicProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: LoaderSize
}

const SPIN_STROKES: Record<LoaderSize, number> = {
  xs: 130,
  sm: 160,
  md: 200,
  lg: 230,
  xl: 250,
  '2xl': 270,
  '3xl': 290,
}

/** Classic discrete iOS/macOS-style radial multi-ray loader */
const Spin = ({ className, size = 'md', strokeWidth, ...props }: LoaderGraphicProps) => {
  const sw = Number(strokeWidth) || SPIN_STROKES[size] || 200
  return (
    <svg className={cn('size-full block stroke-current', className)} viewBox="0 0 2400 2400" aria-hidden="true" {...props}>
      <g strokeWidth={sw} strokeLinecap="round" fill="none">
        <line x1="1200" y1="600" x2="1200" y2="100" />
        <line opacity="0.5" x1="1200" y1="2300" x2="1200" y2="1800" />
        <line opacity="0.917" x1="900" y1="680.4" x2="650" y2="247.4" />
        <line opacity="0.417" x1="1750" y1="2152.6" x2="1500" y2="1719.6" />
        <line opacity="0.833" x1="680.4" y1="900" x2="247.4" y2="650" />
        <line opacity="0.333" x1="2152.6" y1="1750" x2="1719.6" y2="1500" />
        <line opacity="0.75" x1="600" y1="1200" x2="100" y2="1200" />
        <line opacity="0.25" x1="2300" y1="1200" x2="1800" y2="1200" />
        <line opacity="0.667" x1="680.4" y1="1500" x2="247.4" y2="1750" />
        <line opacity="0.167" x1="2152.6" y1="650" x2="1719.6" y2="900" />
        <line opacity="0.583" x1="900" y1="1719.6" x2="650" y2="2152.6" />
        <line opacity="0.083" x1="1750" y1="247.4" x2="1500" y2="680.4" />
        <animateTransform
          attributeName="transform"
          attributeType="XML"
          type="rotate"
          keyTimes="0;0.08333;0.16667;0.25;0.33333;0.41667;0.5;0.58333;0.66667;0.75;0.83333;0.91667"
          values="0 1199 1199;30 1199 1199;60 1199 1199;90 1199 1199;120 1199 1199;150 1199 1199;180 1199 1199;210 1199 1199;240 1199 1199;270 1199 1199;300 1199 1199;330 1199 1199"
          dur="0.83333s"
          begin="0.08333s"
          repeatCount="indefinite"
          calcMode="discrete"
        />
      </g>
    </svg>
  )
}

const RING_STROKES: Record<LoaderSize, number> = {
  xs: 2.0,
  sm: 2.4,
  md: 3.0,
  lg: 3.4,
  xl: 3.8,
  '2xl': 4.2,
  '3xl': 4.8,
}

/** Dual-tone circular track & head ring loader */
const Ring = ({ className, size = 'md', strokeWidth, ...props }: LoaderGraphicProps) => {
  const sw = Number(strokeWidth) || RING_STROKES[size] || 3.0
  return (
    <svg
      className={cn('size-full block animate-spin', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth={sw}
      />
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray="18 42"
        strokeDashoffset="0"
      />
    </svg>
  )
}

const DASH_STROKES: Record<LoaderSize, number> = {
  xs: 2.8,
  sm: 3.4,
  md: 4.0,
  lg: 4.6,
  xl: 5.2,
  '2xl': 5.8,
  '3xl': 6.5,
}

/** Material-inspired morphing stroke-dashoffset expanding/contracting arc ring */
const Dash = ({ className, size = 'md', strokeWidth, ...props }: LoaderGraphicProps) => {
  const sw = Number(strokeWidth) || DASH_STROKES[size] || 4.0
  return (
    <svg
      className={cn('size-full block animate-spin', className)}
      style={{ animationDuration: '1.4s' }}
      viewBox="0 0 50 50"
      aria-hidden="true"
      {...props}
    >
      <circle
        className="opacity-15"
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="currentColor"
        strokeWidth={sw}
      />
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
      >
        <animate
          attributeName="stroke-dasharray"
          values="1,150;90,150;90,150"
          keyTimes="0;0.5;1"
          dur="1.5s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke-dashoffset"
          values="0;-35;-124"
          keyTimes="0;0.5;1"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  )
}

const DOTS_RADIUS: Record<LoaderSize, number> = {
  xs: 1.8,
  sm: 2.1,
  md: 2.5,
  lg: 2.7,
  xl: 2.9,
  '2xl': 3.1,
  '3xl': 3.3,
}

/** Pulsating 3-dot wave indicator (great for conversational AI & typing states) */
const Dots = ({ className, size = 'md', ...props }: LoaderGraphicProps) => {
  const r = DOTS_RADIUS[size] || 2.5
  return (
    <svg
      className={cn('size-full block', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <circle cx="4" cy="12" r={r}>
        <animate
          attributeName="opacity"
          values="0.25;1;0.25"
          dur="1.1s"
          repeatCount="indefinite"
          begin="0s"
        />
        <animate
          attributeName="cy"
          values="12;8;12"
          dur="1.1s"
          repeatCount="indefinite"
          begin="0s"
        />
      </circle>
      <circle cx="12" cy="12" r={r}>
        <animate
          attributeName="opacity"
          values="0.25;1;0.25"
          dur="1.1s"
          repeatCount="indefinite"
          begin="0.2s"
        />
        <animate
          attributeName="cy"
          values="12;8;12"
          dur="1.1s"
          repeatCount="indefinite"
          begin="0.2s"
        />
      </circle>
      <circle cx="20" cy="12" r={r}>
        <animate
          attributeName="opacity"
          values="0.25;1;0.25"
          dur="1.1s"
          repeatCount="indefinite"
          begin="0.4s"
        />
        <animate
          attributeName="cy"
          values="12;8;12"
          dur="1.1s"
          repeatCount="indefinite"
          begin="0.4s"
        />
      </circle>
    </svg>
  )
}

const PULSE_CONFIG: Record<LoaderSize, { r: number; sw: number; anim: string }> = {
  xs: { r: 3.0, sw: 1.3, anim: '1.6;0.3;1.6' },
  sm: { r: 3.5, sw: 1.6, anim: '2.0;0.4;2.0' },
  md: { r: 4.0, sw: 2.0, anim: '2.5;0.5;2.5' },
  lg: { r: 4.3, sw: 2.3, anim: '2.8;0.6;2.8' },
  xl: { r: 4.6, sw: 2.6, anim: '3.1;0.7;3.1' },
  '2xl': { r: 5.0, sw: 2.9, anim: '3.5;0.8;3.5' },
  '3xl': { r: 5.5, sw: 3.3, anim: '4.0;1.0;4.0' },
}

/** Concentric expanding pulse/radar ripple ring */
const Pulse = ({ className, size = 'md', strokeWidth, ...props }: LoaderGraphicProps) => {
  const cfg = PULSE_CONFIG[size] || PULSE_CONFIG.md
  const sw = Number(strokeWidth) || cfg.sw
  return (
    <svg
      className={cn('size-full block', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r={cfg.r} fill="currentColor" />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={sw}>
        <animate
          attributeName="r"
          values="4;10;4"
          dur="1.6s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.8;0;0.8"
          dur="1.6s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke-width"
          values={cfg.anim}
          dur="1.6s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  )
}

const BARS_CONFIG: Record<LoaderSize, { width: number; rx: number; x: number[] }> = {
  xs: { width: 2.2, rx: 1.1, x: [3.3, 8.7, 14.1, 19.5] },
  sm: { width: 2.6, rx: 1.3, x: [2.9, 8.6, 14.3, 20.0] },
  md: { width: 3.0, rx: 1.5, x: [2.5, 8.5, 14.5, 20.5] },
  lg: { width: 3.2, rx: 1.6, x: [2.3, 8.4, 14.5, 20.6] },
  xl: { width: 3.4, rx: 1.7, x: [2.1, 8.4, 14.7, 21.0] },
  '2xl': { width: 3.6, rx: 1.8, x: [1.9, 8.3, 14.7, 21.1] },
  '3xl': { width: 3.8, rx: 1.9, x: [1.7, 8.2, 14.7, 21.2] },
}

/** Equalizer audio wave jumping bars */
const Bars = ({ className, size = 'md', ...props }: LoaderGraphicProps) => {
  const cfg = BARS_CONFIG[size] || BARS_CONFIG.md
  return (
    <svg
      className={cn('size-full block', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <rect x={cfg.x[0]} y="6" width={cfg.width} height="12" rx={cfg.rx}>
        <animate attributeName="height" values="6;16;6" dur="0.9s" repeatCount="indefinite" begin="0s" />
        <animate attributeName="y" values="9;4;9" dur="0.9s" repeatCount="indefinite" begin="0s" />
      </rect>
      <rect x={cfg.x[1]} y="4" width={cfg.width} height="16" rx={cfg.rx}>
        <animate attributeName="height" values="16;6;16" dur="0.9s" repeatCount="indefinite" begin="0.15s" />
        <animate attributeName="y" values="4;9;4" dur="0.9s" repeatCount="indefinite" begin="0.15s" />
      </rect>
      <rect x={cfg.x[2]} y="6" width={cfg.width} height="12" rx={cfg.rx}>
        <animate attributeName="height" values="6;16;6" dur="0.9s" repeatCount="indefinite" begin="0.3s" />
        <animate attributeName="y" values="9;4;9" dur="0.9s" repeatCount="indefinite" begin="0.3s" />
      </rect>
      <rect x={cfg.x[3]} y="8" width={cfg.width} height="8" rx={cfg.rx}>
        <animate attributeName="height" values="8;16;8" dur="0.9s" repeatCount="indefinite" begin="0.45s" />
        <animate attributeName="y" values="8;4;8" dur="0.9s" repeatCount="indefinite" begin="0.45s" />
      </rect>
    </svg>
  )
}

const GRID_CONFIG: Record<LoaderSize, { r: number; anim: string }> = {
  xs: { r: 1.3, anim: '0.8;1.6;0.8' },
  sm: { r: 1.6, anim: '1.0;2.0;1.0' },
  md: { r: 2.0, anim: '1.2;2.4;1.2' },
  lg: { r: 2.2, anim: '1.4;2.6;1.4' },
  xl: { r: 2.4, anim: '1.6;2.9;1.6' },
  '2xl': { r: 2.6, anim: '1.8;3.2;1.8' },
  '3xl': { r: 2.8, anim: '2.0;3.6;2.0' },
}

/** 3x3 pulsating matrix micro-grid */
const Grid = ({ className, size = 'md', ...props }: LoaderGraphicProps) => {
  const cfg = GRID_CONFIG[size] || GRID_CONFIG.md
  return (
    <svg
      className={cn('size-full block', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      {[
        { cx: 4, cy: 4, d: '0s' },
        { cx: 12, cy: 4, d: '0.15s' },
        { cx: 20, cy: 4, d: '0.3s' },
        { cx: 4, cy: 12, d: '0.15s' },
        { cx: 12, cy: 12, d: '0.3s' },
        { cx: 20, cy: 12, d: '0.45s' },
        { cx: 4, cy: 20, d: '0.3s' },
        { cx: 12, cy: 20, d: '0.45s' },
        { cx: 20, cy: 20, d: '0.6s' },
      ].map((dot, i) => (
        <circle key={i} cx={dot.cx} cy={dot.cy} r={cfg.r}>
          <animate
            attributeName="opacity"
            values="0.2;1;0.2"
            dur="1s"
            repeatCount="indefinite"
            begin={dot.d}
          />
          <animate
            attributeName="r"
            values={cfg.anim}
            dur="1s"
            repeatCount="indefinite"
            begin={dot.d}
          />
        </circle>
      ))}
    </svg>
  )
}

const DUAL_RING_STROKES: Record<LoaderSize, { outer: number; inner: number }> = {
  xs: { outer: 1.5, inner: 1.2 },
  sm: { outer: 1.8, inner: 1.5 },
  md: { outer: 2.25, inner: 2.0 },
  lg: { outer: 2.6, inner: 2.3 },
  xl: { outer: 2.9, inner: 2.5 },
  '2xl': { outer: 3.2, inner: 2.8 },
  '3xl': { outer: 3.6, inner: 3.2 },
}

/** Counter-rotating dual concentric rings */
const DualRing = ({ className, size = 'md', strokeWidth, ...props }: LoaderGraphicProps) => {
  const strokes = DUAL_RING_STROKES[size] || DUAL_RING_STROKES.md
  const outerSw = Number(strokeWidth) || strokes.outer
  const innerSw = Number(strokeWidth) ? Number(strokeWidth) * 0.85 : strokes.inner
  return (
    <svg
      className={cn('size-full block', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <g className="animate-spin" style={{ transformOrigin: '12px 12px', animationDuration: '1.2s' }}>
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth={outerSw}
          strokeLinecap="round"
          strokeDasharray="28 28"
        />
      </g>
      <g
        className="animate-spin"
        style={{
          transformOrigin: '12px 12px',
          animationDuration: '0.8s',
          animationDirection: 'reverse',
        }}
      >
        <circle
          cx="12"
          cy="12"
          r="5"
          stroke="currentColor"
          strokeWidth={innerSw}
          strokeLinecap="round"
          strokeDasharray="14 14"
          opacity="0.75"
        />
      </g>
    </svg>
  )
}

const GRADIENT_STROKES: Record<LoaderSize, number> = {
  xs: 1.8,
  sm: 2.2,
  md: 2.75,
  lg: 3.2,
  xl: 3.6,
  '2xl': 4.0,
  '3xl': 4.5,
}

/** Smooth luminescent conical gradient trail ring */
const Gradient = ({ className, size = 'md', strokeWidth, ...props }: LoaderGraphicProps) => {
  const id = React.useId()
  const sw = Number(strokeWidth) || GRADIENT_STROKES[size] || 2.75
  return (
    <svg
      className={cn('size-full block animate-spin', className)}
      style={{ animationDuration: '0.9s' }}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient id={`loader-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="60%" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke={`url(#loader-grad-${id})`}
        strokeWidth={sw}
        strokeLinecap="round"
      />
    </svg>
  )
}

/* ==========================================================================
   CSS Injection — Div-Based Variant Keyframes (injected once on import)
   ========================================================================== */

;(function injectDivLoaderCSS() {
  if (typeof document === 'undefined') return
  if (document.getElementById('loader-div-variant-css')) return
  const el = document.createElement('style')
  el.id = 'loader-div-variant-css'
  el.textContent = `
    @keyframes loader-corner-chase {
      0%   { transform: translate(0,    0);    }
      25%  { transform: translate(300%, 0);    }
      50%  { transform: translate(300%, 300%); }
      75%  { transform: translate(0,    300%); }
      100% { transform: translate(0,    0);    }
    }
    @keyframes loader-spiral {
      0%   { background-position: 0    0;    }
      25%  { background-position: 100% 0;    }
      50%  { background-position: 100% 100%; }
      75%  { background-position: 0%   100%; }
      100% { background-position: 0%   0%;   }
    }
    @keyframes loader-diamond {
      33%  { inset: -25%; transform: rotate(0deg);  }
      66%  { inset: -25%; transform: rotate(90deg); }
      100% { inset: 0;    transform: rotate(90deg); }
    }
    @keyframes loader-rot {
      100% { transform: rotate(1turn); }
    }
  `
  document.head.appendChild(el)
})()

/* ==========================================================================
   Div-Based Graphic Components
   ========================================================================== */

const CORNER_BLOB_SIZES: Record<LoaderSize, string> = {
  xs: '20%',
  sm: '22%',
  md: '25%',
  lg: '26%',
  xl: '27%',
  '2xl': '28%',
  '3xl': '30%',
}

/** 4 crisp dots chasing each other clockwise around the four corners */
const CornerBlob = ({ className, style, size = 'md' }: LoaderDivGraphicProps) => {
  const dotSize = CORNER_BLOB_SIZES[size] || '25%'
  return (
    <div aria-hidden="true" className={cn('size-full relative', className)} style={style}>
      {([0, -0.4, -0.8, -1.2] as const).map((delay, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: dotSize,
            height: dotSize,
            background: 'currentColor',
            borderRadius: '50%',
            animation: 'loader-corner-chase 1.6s ease-in-out infinite',
            animationDelay: `${delay}s`,
          }}
        />
      ))}
    </div>
  )
}

const SPIRAL_CONFIGS: Record<LoaderSize, { dot: string; pad: string }> = {
  xs: { dot: '20% 20%', pad: '5%' },
  sm: { dot: '22% 22%', pad: '5.5%' },
  md: { dot: '25% 25%', pad: '6.25%' },
  lg: { dot: '26% 26%', pad: '6.5%' },
  xl: { dot: '27% 27%', pad: '7%' },
  '2xl': { dot: '28% 28%', pad: '7.25%' },
  '3xl': { dot: '30% 30%', pad: '7.5%' },
}

/** Spiral: single dot travels along a 2-leg L-path conic track */
const Spiral = ({ className, style, size = 'md' }: LoaderDivGraphicProps) => {
  const cfg = SPIRAL_CONFIGS[size] || SPIRAL_CONFIGS.md
  return (
    <div aria-hidden="true" className={cn('size-full', className)} style={{
      padding: cfg.pad,
      boxSizing: 'border-box' as const,
      background: `
        radial-gradient(farthest-side, currentColor 98%, transparent) 0 0 / ${cfg.dot} no-repeat,
        conic-gradient(from 90deg at 12.5% 12.5%, transparent 90deg, currentColor 0) content-box,
        conic-gradient(from -90deg at 87.5% 87.5%, transparent 90deg, currentColor 0) content-box,
        transparent
      `,
      animation: 'loader-spiral 2s infinite',
      ...style,
    }} />
  )
}

const DIAMOND_LINES: Record<LoaderSize, number> = {
  xs: 12,
  sm: 15,
  md: 18,
  lg: 20,
  xl: 22,
  '2xl': 24,
  '3xl': 26,
}

/** Diamond: conic-gradient diamond shape with expanding X-crosshair overlay */
const DiamondLoader = ({ className, style, size = 'md' }: LoaderDivGraphicProps) => {
  const line = DIAMOND_LINES[size] || 18
  return (
    <div aria-hidden="true" className={cn('size-full relative', className)} style={{
      background: `
        conic-gradient(from 134deg at top,    currentColor 92deg, transparent 0) top,
        conic-gradient(from -46deg at bottom, currentColor 92deg, transparent 0) bottom
      `,
      backgroundSize: '100% 50%',
      backgroundRepeat: 'no-repeat',
      ...style,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          linear-gradient( 45deg, currentColor ${line}%, transparent 0 calc(100% - ${line}%), currentColor 0),
          linear-gradient(-45deg, currentColor ${line}%, transparent 0 calc(100% - ${line}%), currentColor 0)
        `,
        animation: 'loader-diamond 1.5s infinite cubic-bezier(0.3,1,0,1)',
      }} />
    </div>
  )
}

const SQUARES_BORDERS: Record<LoaderSize, string> = {
  xs: '0.75px',
  sm: '0.85px',
  md: '1px',
  lg: '1.25px',
  xl: '1.5px',
  '2xl': '1.75px',
  '3xl': '2px',
}

/** Squares: 3 nested concentric squares each spinning at a different cadence */
const Squares = ({ className, style, size = 'md' }: LoaderDivGraphicProps) => {
  const bw = SQUARES_BORDERS[size] || '1px'
  return (
    <div aria-hidden="true" className={cn('size-full relative flex items-center justify-center', className)} style={{
      border: `${bw} solid currentColor`,
      boxSizing: 'border-box' as const,
      animation: 'loader-rot 4s infinite linear',
      ...style,
    }}>
      <div style={{
        position: 'absolute', width: '70.7%', aspectRatio: '1',
        border: `${bw} solid currentColor`, boxSizing: 'border-box',
        animation: 'loader-rot 4s infinite linear',
      }} />
      <div style={{
        position: 'absolute', width: '50%', aspectRatio: '1',
        border: `${bw} solid currentColor`,
        animation: 'loader-rot 2s infinite linear',
      }} />
    </div>
  )
}


/* ==========================================================================
   Variant & Size Maps
   ========================================================================== */

export const LOADER_VARIANTS = {
  spin: Spin,
  ring: Ring,
  dash: Dash,
  dots: Dots,
  pulse: Pulse,
  bars: Bars,
  grid: Grid,
  'dual-ring': DualRing,
  gradient: Gradient,
  'corner-blob': CornerBlob,
  spiral: Spiral,
  diamond: DiamondLoader,
  squares: Squares,
} as const

export type LoaderVariant = keyof typeof LOADER_VARIANTS

/* ==========================================================================
   Loader Component Props
   ========================================================================== */

export interface LoaderProps
  extends Omit<React.ComponentPropsWithoutRef<'svg'>, 'display' | 'opacity' | 'children'> {
  /** Explicit children or label */
  children?: React.ReactNode
  /** Visual animation style: 'spin', 'ring', 'dash', 'dots', 'pulse', 'bars', 'grid', 'dual-ring', 'gradient', 'corner-blob', 'spiral', 'diamond', 'squares'. */
  variant?: LoaderVariant
  /** Size ramp token from xs (12px) to 3xl (48px). */
  size?: LoaderSize
  /** Current progress percentage (0-100) when running in deterministic mode. */
  percentage?: number
  /** Whether the loading state is indeterminate with continuous looping animation. */
  isIndeterminate?: boolean
  /** Intl formatting options for accessibility screen reader announcements. */
  formatOptions?: Intl.NumberFormatOptions
  /** Optional DOM ref passed to the SVG root element. */
  ref?: React.RefObject<SVGSVGElement | null>
  /** DOM slot identifier for styling targeting. */
  'data-slot'?: string
}

/* ==========================================================================
   Loader Primitive & Factory
   ========================================================================== */

/** Variants that render a <div> instead of <svg> — only className/style are forwarded */
const DIV_VARIANTS = new Set<LoaderVariant>([
  'corner-blob', 'spiral', 'diamond', 'squares',
])

const LoaderPrimitive = ({
  variant = 'spin',
  size = 'md',
  isIndeterminate = true,
  className,
  ref,
  ...props
}: LoaderProps) => {
  const resolvedVariant: LoaderVariant = variant in LOADER_VARIANTS ? variant : 'spin'
  const LoaderGraphic = LOADER_VARIANTS[resolvedVariant]
  const isDivBased = DIV_VARIANTS.has(resolvedVariant)

  return (
    <ProgressBar
      data-slot={props['data-slot'] ?? 'loader'}
      aria-label={props['aria-label'] ?? 'Loading...'}
      formatOptions={props.formatOptions}
      isIndeterminate={isIndeterminate}
      className={cn(
        'inline-flex items-center justify-center shrink-0 self-center leading-none',
        LOADER_SIZES[size] ?? LOADER_SIZES.md,
        className
      )}
    >
      {isDivBased ? (() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const DivGraphic = LoaderGraphic as React.ComponentType<any>
        return <DivGraphic size={size} className="size-full" style={props.style} />
      })() : (() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SvgGraphic = LoaderGraphic as React.ComponentType<any>
        return (
          <SvgGraphic
            role="presentation"
            className="size-full"
            size={size}
            ref={ref as any}
            {...props}
          />
        )
      })()}
    </ProgressBar>
  )
}

export const Loader = createInterfaceComponent<LoaderProps>(
  {
    name: 'Loader',
    category: 'feedback',
    description: 'Accessible animated SVG loading indicator featuring 10 modern motion variants, optical sizing scale, and semantic intent styling.',
    version: '1.0.0',
    props: {
      variant: 'spin',
      size: 'md',
      isIndeterminate: true,
    },
  },
  LoaderPrimitive
)

// Compound sub-components — each is a thin variant-locked wrapper registered
// directly via createInterfaceComponent so the registry builder's AST scanner
// picks them up as first-class named entries with their own props/description.

export const LoaderSpin = createInterfaceComponent<LoaderProps>(
  {
    name: 'LoaderSpin',
    category: 'feedback',
    description: 'Classic discrete iOS/macOS-style radial ray spin variant of Loader.',
    version: '1.0.0',
    props: { size: 'md', isIndeterminate: true },
  },
  (props) => <Loader variant="spin" {...props} />
)

export const LoaderRing = createInterfaceComponent<LoaderProps>(
  {
    name: 'LoaderRing',
    category: 'feedback',
    description: 'Dual-tone circular track & head ring variant of Loader.',
    version: '1.0.0',
    props: { size: 'md', isIndeterminate: true },
  },
  (props) => <Loader variant="ring" {...props} />
)

export const LoaderDash = createInterfaceComponent<LoaderProps>(
  {
    name: 'LoaderDash',
    category: 'feedback',
    description: 'Material-inspired morphing stroke-dashoffset expanding/contracting arc variant of Loader.',
    version: '1.0.0',
    props: { size: 'md', isIndeterminate: true },
  },
  (props) => <Loader variant="dash" {...props} />
)

export const LoaderDots = createInterfaceComponent<LoaderProps>(
  {
    name: 'LoaderDots',
    category: 'feedback',
    description: 'Pulsating 3-dot wave variant of Loader, ideal for conversational AI and typing states.',
    version: '1.0.0',
    props: { size: 'md', isIndeterminate: true },
  },
  (props) => <Loader variant="dots" {...props} />
)

export const LoaderPulse = createInterfaceComponent<LoaderProps>(
  {
    name: 'LoaderPulse',
    category: 'feedback',
    description: 'Concentric expanding radar sonar ripple variant of Loader.',
    version: '1.0.0',
    props: { size: 'md', isIndeterminate: true },
  },
  (props) => <Loader variant="pulse" {...props} />
)


export const LoaderBars = createInterfaceComponent<LoaderProps>(
  {
    name: 'LoaderBars',
    category: 'feedback',
    description: 'Equalizer audio wave jumping bars variant of Loader.',
    version: '1.0.0',
    props: { size: 'md', isIndeterminate: true },
  },
  (props) => <Loader variant="bars" {...props} />
)

export const LoaderGrid = createInterfaceComponent<LoaderProps>(
  {
    name: 'LoaderGrid',
    category: 'feedback',
    description: 'Staggered 3×3 breathing matrix dot grid variant of Loader.',
    version: '1.0.0',
    props: { size: 'md', isIndeterminate: true },
  },
  (props) => <Loader variant="grid" {...props} />
)

export const LoaderDualRing = createInterfaceComponent<LoaderProps>(
  {
    name: 'LoaderDualRing',
    category: 'feedback',
    description: 'Counter-rotating dual concentric rings variant of Loader.',
    version: '1.0.0',
    props: { size: 'md', isIndeterminate: true },
  },
  (props) => <Loader variant="dual-ring" {...props} />
)

export const LoaderGradient = createInterfaceComponent<LoaderProps>(
  {
    name: 'LoaderGradient',
    category: 'feedback',
    description: 'Smooth luminescent conic gradient trail ring variant of Loader.',
    version: '1.0.0',
    props: { size: 'md', isIndeterminate: true },
  },
  (props) => <Loader variant="gradient" {...props} />
)

export const LoaderCornerBlob = createInterfaceComponent<LoaderProps>(
  {
    name: 'LoaderCornerBlob',
    category: 'feedback',
    description: 'Gooey corner-dots: 4 blobs chase each other around the four corners using blur+contrast filter magic.',
    version: '1.0.0',
    props: { size: '3xl', isIndeterminate: true },
  },
  (props) => <Loader variant="corner-blob" {...props} />
)

export const LoaderSpiral = createInterfaceComponent<LoaderProps>(
  {
    name: 'LoaderSpiral',
    category: 'feedback',
    description: 'Spiral: single dot travels along a 2-leg L-shaped conic gradient track.',
    version: '1.0.0',
    props: { size: '3xl', isIndeterminate: true },
  },
  (props) => <Loader variant="spiral" {...props} />
)

export const LoaderDiamond = createInterfaceComponent<LoaderProps>(
  {
    name: 'LoaderDiamond',
    category: 'feedback',
    description: 'Diamond: conic-gradient diamond silhouette with an expanding X-crosshair overlay that rotates.',
    version: '1.0.0',
    props: { size: '3xl', isIndeterminate: true },
  },
  (props) => <Loader variant="diamond" {...props} />
)

export const LoaderSquares = createInterfaceComponent<LoaderProps>(
  {
    name: 'LoaderSquares',
    category: 'feedback',
    description: 'Squares: 3 nested concentric squares each spinning at a different cadence.',
    version: '1.0.0',
    props: { size: '3xl', isIndeterminate: true },
  },
  (props) => <Loader variant="squares" {...props} />
)



// Namespace attachments
Loader.Ring = LoaderRing
Loader.Spin = LoaderSpin
Loader.Dash = LoaderDash
Loader.Dots = LoaderDots
Loader.Pulse = LoaderPulse
Loader.Bars = LoaderBars
Loader.Grid = LoaderGrid
Loader.DualRing = LoaderDualRing
Loader.Gradient = LoaderGradient
Loader.CornerBlob = LoaderCornerBlob
Loader.Spiral = LoaderSpiral
Loader.Diamond = LoaderDiamond
Loader.Squares = LoaderSquares

export default Loader
