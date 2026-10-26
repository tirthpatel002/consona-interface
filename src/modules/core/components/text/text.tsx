'use client'

import React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '../../../../core/cn'
import { createInterfaceComponent } from '../../../../core/component-factory'
import { createCompoundContext } from '../../../../core/context'
import { renderSlot } from '../../../../core/slot-resolver'
import type { SlotComponents, SlotPropsMap } from '../../../../core/types'
import { useThemeOptional, GOOGLE_FONTS_MONO } from '../../../../theme'

/* ==========================================================================
   Types
   ========================================================================== */

export type TextAnimation =
  | 'none' | 'scramble' | 'decrypt' | 'typewriter'
  | 'ticker' | 'counter' | 'wavy' | 'gradient'
  | 'shimmer' | 'pulse' | 'slide' | 'stream'
  | 'fade-in' | 'slide-in' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down'
  | 'lift' | 'lift-scale' | 'pop-in'
  | 'blur-in' | 'blur-slide' | 'blur-lift'

export type FontSize = 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'
export type FontWeight = 'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black' | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
export type FontTracking = 'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest'
export type FontLeading = 'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose'
export type FontAlign = 'left' | 'center' | 'right' | 'justify'
export type FontTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize'
export type TextIntent = 'default' | 'muted' | 'primary' | 'success' | 'warning' | 'danger' | 'inherit'
export type TextVariant = 'default' | 'muted' | 'subtle' | 'accent' | 'danger' | 'success' | 'warning' | 'inherit'
export type SlideDirection = 'up' | 'down' | 'left' | 'right'

export interface TextEntranceOptions {
  /** Entrance animation preset name (e.g. 'slide-left', 'lift', 'fade-in', 'blur-in', etc.) */
  type?: TextAnimation
  /** Custom duration in seconds (overrides default preset duration) */
  duration?: number
  /** Custom delay in seconds */
  delay?: number
  /** Custom easing curve (e.g. [0.19, 1, 0.22, 1] or 'easeOut') */
  ease?: any
  /** Custom distance for slide/lift presets in px (default: 16 / 14 / 12) */
  distance?: number
  /** Custom initial motion state */
  initial?: any
  /** Custom animate motion state */
  animate?: any
  /** Custom exit motion state */
  exit?: any
  /** Full custom transition config object */
  transition?: any
}

interface SlideOptions {
  /** Phrases to cycle through. */
  phrases?: string[]
  /** Interval in ms between slides (default: 3000). */
  interval?: number
  /** Entrance/exit direction (default: 'up'). */
  direction?: SlideDirection
  /** Animation duration in seconds (default: 0.35). */
  duration?: number
  /** Whether to loop continuously (default: true). Set to false for finite action sequences. */
  loop?: boolean
  /** Whether newly appended phrases immediately interrupt and slide into view (default: true). */
  interrupt?: boolean
}

interface StreamOptions {
  /** Ms per character (default: 18). */
  speed?: number
  /** Show blinking caret while streaming (default: true). */
  cursor?: boolean
  /** Fires when stream reaches end of current text. */
  onComplete?: () => void
}

export interface TextCharSlotProps {
  char: string
  index: number
  className?: string
  style?: React.CSSProperties
}

export interface TextSlots {
  /** Custom blinking caret for typing/streaming animations. */
  caret?: React.ComponentType<React.HTMLAttributes<HTMLSpanElement>>
  /** Custom per-character renderer for wavy animation. */
  char?: React.ComponentType<TextCharSlotProps>
}

/* ==========================================================================
   Class lookup tables (static — zero runtime cost when unused)
   ========================================================================== */

const SIZE: Record<string, string> = {
  xs: 'text-xs', sm: 'text-sm', base: 'text-base', md: 'text-base',
  lg: 'text-lg', xl: 'text-xl', '2xl': 'text-2xl', '3xl': 'text-3xl',
  '4xl': 'text-4xl', '5xl': 'text-5xl', '6xl': 'text-6xl', '7xl': 'text-7xl',
}

const WEIGHT: Record<string, string> = {
  thin: 'font-thin', light: 'font-light', normal: 'font-normal', medium: 'font-medium',
  semibold: 'font-semibold', bold: 'font-bold', extrabold: 'font-extrabold', black: 'font-black',
}

const TRACKING: Record<FontTracking, string> = {
  tighter: 'tracking-tighter', tight: 'tracking-tight', normal: 'tracking-normal',
  wide: 'tracking-wide', wider: 'tracking-wider', widest: 'tracking-widest',
}

const LEADING: Record<FontLeading, string> = {
  none: 'leading-none', tight: 'leading-tight', snug: 'leading-snug',
  normal: 'leading-normal', relaxed: 'leading-relaxed', loose: 'leading-loose',
}

const ALIGN: Record<FontAlign, string> = {
  left: 'text-left', center: 'text-center', right: 'text-right', justify: 'text-justify',
}

const TRANSFORM: Record<FontTransform, string> = {
  none: 'normal-case', uppercase: 'uppercase', lowercase: 'lowercase', capitalize: 'capitalize',
}

const INTENT: Record<TextIntent, string> = {
  default: 'text-fg', muted: 'text-muted-fg', primary: 'text-primary',
  success: 'text-success', warning: 'text-warning', danger: 'text-danger', inherit: '',
}

/** CSS-only animation class — no JS required */
const ANIM_CSS: Partial<Record<TextAnimation, string>> = {
  gradient: 'font-anim-gradient',
  shimmer: 'font-anim-shimmer',
  pulse: 'font-anim-pulse',
}

const VARIANT_INTENT: Record<TextVariant, TextIntent> = {
  default: 'default', muted: 'muted', subtle: 'muted',
  accent: 'primary', danger: 'danger', success: 'success',
  warning: 'warning', inherit: 'inherit',
}

const VARIANT_EXTRA: Partial<Record<TextVariant, string>> = {
  subtle: 'opacity-80',
  accent: 'font-medium',
}

const ENTRANCE_VARS: Record<string, { initial: any; animate: any; transition: any }> = {
  'fade-in': {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.6, ease: [0.19, 1, 0.22, 1] },
  },
  'slide-in': {
    initial: { opacity: 0, x: -16 },
    animate: { opacity: 1, x: 0 },
    transition: {
      duration: 0.72,
      ease: [0.19, 1, 0.22, 1],
      opacity: { duration: 0.48, ease: 'easeOut' },
    },
  },
  'slide-left': {
    initial: { opacity: 0, x: -16 },
    animate: { opacity: 1, x: 0 },
    transition: {
      duration: 0.72,
      ease: [0.19, 1, 0.22, 1],
      opacity: { duration: 0.48, ease: 'easeOut' },
    },
  },
  'slide-right': {
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0 },
    transition: {
      duration: 0.72,
      ease: [0.19, 1, 0.22, 1],
      opacity: { duration: 0.48, ease: 'easeOut' },
    },
  },
  'slide-up': {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.72,
      ease: [0.19, 1, 0.22, 1],
      opacity: { duration: 0.48, ease: 'easeOut' },
    },
  },
  'slide-down': {
    initial: { opacity: 0, y: -14 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.72,
      ease: [0.19, 1, 0.22, 1],
      opacity: { duration: 0.48, ease: 'easeOut' },
    },
  },
  'lift': {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.72,
      ease: [0.19, 1, 0.22, 1],
      opacity: { duration: 0.48, ease: 'easeOut' },
    },
  },
  'lift-scale': {
    initial: { opacity: 0, y: 12, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: {
      duration: 0.72,
      ease: [0.19, 1, 0.22, 1],
      opacity: { duration: 0.48, ease: 'easeOut' },
    },
  },
  'pop-in': {
    initial: { opacity: 0, scale: 0.92 },
    animate: { opacity: 1, scale: 1 },
    transition: {
      duration: 0.64,
      ease: [0.19, 1, 0.22, 1],
      opacity: { duration: 0.44, ease: 'easeOut' },
    },
  },
  'blur-in': {
    initial: { opacity: 0, filter: 'blur(8px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
    transition: {
      duration: 0.75,
      ease: [0.19, 1, 0.22, 1],
      filter: { duration: 0.58, ease: 'easeOut' },
      opacity: { duration: 0.5, ease: 'easeOut' },
    },
  },
  'blur-slide': {
    initial: { opacity: 0, x: -16, filter: 'blur(6px)' },
    animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
    transition: {
      duration: 0.72,
      ease: [0.19, 1, 0.22, 1],
      filter: { duration: 0.52, ease: 'easeOut' },
      opacity: { duration: 0.48, ease: 'easeOut' },
    },
  },
  'blur-lift': {
    initial: { opacity: 0, y: 12, filter: 'blur(6px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: {
      duration: 0.72,
      ease: [0.19, 1, 0.22, 1],
      filter: { duration: 0.52, ease: 'easeOut' },
      opacity: { duration: 0.48, ease: 'easeOut' },
    },
  },
}

/** Built-in entrance animation presets (motion variants + transitions) */
export const TEXT_ENTRANCE_PRESETS = ENTRANCE_VARS

/** JS-driven animations that require AnimatedText. All others use StaticText. */
const JS_ANIMATIONS = new Set<TextAnimation>([
  'scramble', 'decrypt', 'typewriter', 'ticker', 'counter', 'wavy', 'slide', 'stream',
  'fade-in', 'slide-in', 'slide-left', 'slide-right', 'slide-up', 'slide-down',
  'lift', 'lift-scale', 'pop-in', 'blur-in', 'blur-slide', 'blur-lift',
])

/* ==========================================================================
   Helpers
   ========================================================================== */

const SC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LC = 'abcdefghijklmnopqrstuvwxyz'
const DG = '0123456789'
const SY = '!@#$%&*?+='

function scrambleChar(t: string): string {
  if (t === ' ') return ' '
  if (/[a-z]/.test(t)) return LC[Math.floor(Math.random() * 26)]!
  if (/[A-Z]/.test(t)) return SC[Math.floor(Math.random() * 26)]!
  if (/[0-9]/.test(t)) return DG[Math.floor(Math.random() * 10)]!
  return SY[Math.floor(Math.random() * SY.length)]!
}

function buildClass(
  size: FontSize | string | undefined,
  weight: FontWeight | undefined,
  tracking: FontTracking | undefined,
  leading: FontLeading | undefined,
  align: FontAlign | undefined,
  transform: FontTransform | undefined,
  intent: TextIntent | undefined,
  animCss: string,
  italic: boolean | undefined,
  extra: string | undefined,
  className: string | undefined,
): string {
  return cn(
    size ? (SIZE[size] || size) : '',
    typeof weight === 'string' ? (WEIGHT[weight] || '') : '',
    tracking ? TRACKING[tracking] : '',
    leading ? LEADING[leading] : '',
    align ? ALIGN[align] : '',
    transform ? TRANSFORM[transform] : '',
    intent && intent !== 'inherit' ? INTENT[intent] : '',
    animCss,
    italic && 'italic',
    extra,
    className,
  )
}

function buildFontStyle(
  font: string | undefined,
  family: string,
  weight: FontWeight | undefined,
  tabular: boolean | undefined,
  slashedZero: boolean | undefined,
  ligatures: boolean | undefined,
  sans: string,
  mono: string,
): React.CSSProperties {
  const active = font || (family === 'mono' ? mono : family === 'sans' ? sans : family || sans)
  const isMono = family === 'mono' || GOOGLE_FONTS_MONO.some((f) => f.name === active)
  const stack = `'${active}', ${isMono ? 'ui-monospace, monospace' : 'ui-sans-serif, system-ui, sans-serif'}`
  const features = [tabular && '"tnum"', slashedZero && '"zero"', ligatures && '"calt", "liga"']
    .filter(Boolean).join(', ')
  return {
    fontFamily: stack,
    ...(typeof weight === 'number' ? { fontWeight: weight } : {}),
    ...(features ? { fontFeatureSettings: features } : {}),
  }
}


/* ==========================================================================
   Shared props surface — everything a Text atom can accept
   ========================================================================== */

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  /** Element to render (default: 'p'). */
  as?: React.ElementType
  /** Semantic color variant. */
  variant?: TextVariant
  /** Direct intent color (overrides variant). */
  intent?: TextIntent
  /** Size ramp token or custom class. */
  size?: FontSize | string
  /** Weight token or numeric 100-900. */
  weight?: FontWeight
  /** Letter-spacing token. */
  tracking?: FontTracking
  /** Line-height token. */
  leading?: FontLeading
  /** Text alignment. */
  align?: FontAlign
  /** Text transform. */
  transform?: FontTransform
  /** Italic styling. */
  italic?: boolean
  /** OpenType tabular numerals. */
  tabular?: boolean
  /** OpenType slashed zero. */
  slashedZero?: boolean
  /** OpenType coding ligatures. */
  ligatures?: boolean
  /** Explicit Google Font name. */
  font?: string
  /** Font family category (default: 'sans'). */
  family?: 'sans' | 'mono' | 'serif' | string
  /** Kinetic animation effect. */
  animation?: TextAnimation
  /** Shorthand for animation="gradient". */
  gradient?: boolean
  /** Loop kinetic animations continuously. */
  loop?: boolean
  /** Animation speed in ms. */
  speed?: number
  /** Enable slide transition between phrases or on content change. */
  slide?: boolean | SlideOptions
  /** Phrases to cycle through via slide animation. */
  phrases?: string[]
  /** Slide interval in ms (default: 3000). */
  slideInterval?: number
  /** Slide direction (default: 'up'). */
  slideDirection?: SlideDirection
  /** Slide animation duration in seconds (default: 0.35). */
  slideDuration?: number
  /** Enable progressive token streaming simulation. */
  stream?: boolean | StreamOptions
  /** Streaming speed in ms per character (default: 18). */
  streamSpeed?: number
  /** Show blinking cursor while streaming (default: true). */
  streamCursor?: boolean
  /** Fires when stream completes. */
  onStreamComplete?: () => void
  /**
   * Signal that the backend is done writing.
   * In append-stream mode the interval keeps polling until `streamDone` is
   * true AND the cursor has caught up with children — then it fires
   * `onStreamComplete` and stops. Omit (or leave `false`) while the server
   * is still pushing tokens.
   */
  streamDone?: boolean
  /** Declarative entrance animation configuration or preset override. */
  entrance?: boolean | TextAnimation | TextEntranceOptions
  /** Custom initial motion state for entrance animation. */
  initial?: any
  /** Custom animate motion state. */
  animate?: any
  /** Custom exit motion state. */
  exit?: any
  /** Custom transition configuration override. */
  transition?: any
  /** Slot component overrides. */
  slots?: SlotComponents<TextSlots>
  /** Slot prop overrides. */
  slotProps?: SlotPropsMap<TextSlots>
  ref?: React.Ref<HTMLElement>
  children?: React.ReactNode
}

export interface HeadingProps extends TextProps {
  /** Semantic heading level h1-h6 (default: 1). */
  level?: 1 | 2 | 3 | 4 | 5 | 6
  /** Slot component overrides. */
  slots?: SlotComponents<TextSlots>
  /** Slot prop overrides. */
  slotProps?: SlotPropsMap<TextSlots>
}

export interface StrongProps extends TextProps {
  /** Slot component overrides. */
  slots?: SlotComponents<TextSlots>
  /** Slot prop overrides. */
  slotProps?: SlotPropsMap<TextSlots>
}

export interface CodeProps extends StrongProps {
  /** Slot component overrides. */
  slots?: SlotComponents<TextSlots>
  /** Slot prop overrides. */
  slotProps?: SlotPropsMap<TextSlots>
}

export interface BlockquoteProps extends StrongProps {
  /** Slot component overrides. */
  slots?: SlotComponents<TextSlots>
  /** Slot prop overrides. */
  slotProps?: SlotPropsMap<TextSlots>
}

export interface LeadProps extends StrongProps {
  /** Slot component overrides. */
  slots?: SlotComponents<TextSlots>
  /** Slot prop overrides. */
  slotProps?: SlotPropsMap<TextSlots>
}

/* ==========================================================================
   Internal resolved props — passed from sub-atoms down to _CoreText
   ========================================================================== */

interface _ResolvedProps extends TextProps {
  _tag: React.ElementType
  _intent: TextIntent
  _extra?: string
  _extraStyle?: React.CSSProperties
  fontSans: string
  fontMono: string
}

/* ==========================================================================
   _StaticText — ZERO animation hooks. Used for plain text & CSS-only effects.
   ========================================================================== */

const _StaticText = ({
  _tag: Tag,
  _intent,
  _extra,
  _extraStyle,
  fontSans,
  fontMono,
  as: _as,
  variant: _v,
  intent: _i,
  font,
  family = 'sans',
  size,
  weight,
  tracking,
  leading,
  align,
  transform,
  italic,
  tabular,
  slashedZero,
  ligatures,
  animation = 'none',
  gradient,
  loop: _loop,
  speed: _speed,
  slide: _slide,
  phrases: _phrases,
  slideInterval: _si,
  slideDirection: _sd,
  slideDuration: _sdu,
  stream: _stream,
  streamSpeed: _ss,
  streamCursor: _sc,
  onStreamComplete: _osc,
  streamDone: _streamDone,
  slots: _slots,
  slotProps: _slotProps,
  className,
  style,
  ref,
  children,
  ...dom
}: _ResolvedProps) => {
  const eff: TextAnimation = gradient ? 'gradient' : (animation || 'none')
  const isChroma = eff === 'gradient' || eff === 'shimmer'
  const animCss = ANIM_CSS[eff] || ''
  const cls = buildClass(
    size,
    weight,
    tracking,
    leading,
    align,
    transform,
    isChroma ? undefined : _intent,
    animCss,
    italic,
    // Strip color util classes from _extra so they don't fight transparent fill
    isChroma ? _extra?.replace(/\btext-(?:fg|muted-fg|primary|success|warning|danger)\b/g, '').trim() : _extra,
    className
  )
  const fStyle = buildFontStyle(font, family, weight, tabular, slashedZero, ligatures, fontSans, fontMono)
  return (
    <Tag ref={ref} className={cls} style={{ ...fStyle, ..._extraStyle, ...style }} {...dom}>
      {children}
    </Tag>
  )
}

/* ==========================================================================
   _AnimatedText — all JS animation hooks. Only mounted when needed.
   Individual hooks early-exit cheaply when not their active mode.
   ========================================================================== */

const _AnimatedText = ({
  _tag: Tag,
  _intent,
  _extra,
  _extraStyle,
  fontSans,
  fontMono,
  as: _as,
  variant: _v,
  intent: _i,
  font,
  family = 'sans',
  size,
  weight,
  tracking,
  leading,
  align,
  transform,
  italic,
  tabular,
  slashedZero,
  ligatures,
  animation = 'none',
  gradient,
  loop,
  speed,
  slide,
  phrases,
  slideInterval,
  slideDirection,
  slideDuration,
  stream,
  streamSpeed,
  streamCursor,
  onStreamComplete,
  streamDone,
  entrance,
  initial,
  animate,
  exit,
  transition,
  slots,
  slotProps,
  className,
  style,
  ref,
  children,
  ...dom
}: _ResolvedProps) => {
  const eff: TextAnimation = gradient ? 'gradient' : (animation || 'none')

  const isSlide     = eff === 'slide' || Boolean(slide)
  const isStream    = eff === 'stream' || Boolean(stream)
  const isScramble  = eff === 'scramble' || eff === 'decrypt'
  const isTypewriter = eff === 'typewriter'
  const isTicker    = eff === 'ticker' || eff === 'counter'
  const isWavy      = eff === 'wavy'

  // Slide config
  const slideCfg  = typeof slide === 'object' ? slide : {}
  const phrases_  = phrases ?? slideCfg.phrases
  const interval_ = slideInterval ?? slideCfg.interval ?? 3000
  const dir_: SlideDirection = slideDirection ?? slideCfg.direction ?? 'up'
  const dur_      = slideDuration ?? slideCfg.duration ?? 0.35
  const slideLoop_ = loop ?? slideCfg.loop ?? true
  const slideInterrupt_ = slideCfg.interrupt ?? true

  // Stream config
  const streamCfg    = typeof stream === 'object' ? stream : {}
  const streamSpeed_ = streamSpeed ?? streamCfg.speed ?? speed ?? 18
  const showCursor_  = streamCursor ?? streamCfg.cursor ?? true
  const onComplete_  = onStreamComplete ?? streamCfg.onComplete
  // streamDone defaults to true so static-content usage auto-completes.
  // Pass streamDone={false} (or a state variable) when the backend is still writing.
  const streamDone_  = streamDone ?? true

  // Resolved text content (string | null)
  const textContent = phrases_?.length
    ? (phrases_[0] ?? null)
    : typeof children === 'string' ? children : null

  // ── Slide — interrupt-driven with fallback interval cycling ────────────────
  const [phraseIdx, setPhraseIdx] = React.useState(0)
  const phrasesRef = React.useRef(phrases_)
  React.useLayoutEffect(() => { phrasesRef.current = phrases_ }, [phrases_])

  const prevLenRef = React.useRef(phrases_?.length ?? 0)
  const slideTimerRef = React.useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  // 1. Interrupt on push/update: when phrases grow, immediately jump to newest phrase!
  React.useEffect(() => {
    if (!isSlide || !phrases_?.length) return
    const currentLen = phrases_.length
    if (slideInterrupt_ && currentLen > prevLenRef.current) {
      setPhraseIdx(currentLen - 1)
    }
    prevLenRef.current = currentLen
  }, [isSlide, phrases_?.length, slideInterrupt_])

  // 2. Interval cycling
  const hasEnough = (phrases_?.length ?? 0) > 1

  React.useEffect(() => {
    if (!isSlide || !hasEnough) return
    const tick = () => {
      const ps = phrasesRef.current
      if (!ps || ps.length <= 1) return
      setPhraseIdx((p) => {
        if (p >= ps.length - 1) {
          if (!slideLoop_) {
            clearInterval(slideTimerRef.current)
            return p
          }
          return 0
        }
        return p + 1
      })
    }
    slideTimerRef.current = setInterval(tick, interval_)
    return () => clearInterval(slideTimerRef.current)
  }, [isSlide, hasEnough, interval_, slideLoop_])

  const slideVars = React.useMemo(() => {
    if (!isSlide) return null
    const map = {
      up:    { initial: { opacity: 0, y: 14 },  animate: { opacity: 1, y: 0 },  exit: { opacity: 0, y: -14 } },
      down:  { initial: { opacity: 0, y: -14 }, animate: { opacity: 1, y: 0 },  exit: { opacity: 0, y: 14 } },
      left:  { initial: { opacity: 0, x: 18 },  animate: { opacity: 1, x: 0 },  exit: { opacity: 0, x: -18 } },
      right: { initial: { opacity: 0, x: -18 }, animate: { opacity: 1, x: 0 },  exit: { opacity: 0, x: 18 } },
    }
    return map[dir_]
  }, [isSlide, dir_])


  // ── Stream — ref-based stable interval for live backend append ────────────
  //
  // Design: the interval NEVER restarts when children changes. It reads the
  // latest content from `textRef` on every tick and advances one character.
  // This means you can do:
  //
  //   const [text, setText] = useState('')
  //   // as tokens arrive: setText(prev => prev + token)
  //   <Text stream streamDone={isDone}>{text}</Text>
  //
  // The animation follows the growing string in real-time without re-mounting.
  // Use React `key` prop to hard-reset (e.g. new conversation / new query).
  const textRef = React.useRef<string | null>(textContent)
  React.useLayoutEffect(() => { textRef.current = textContent }, [textContent])

  const streamDoneRef = React.useRef(streamDone_)
  React.useLayoutEffect(() => { streamDoneRef.current = streamDone_ }, [streamDone_])

  const onCompleteCbRef = React.useRef(onComplete_)
  React.useLayoutEffect(() => { onCompleteCbRef.current = onComplete_ }, [onComplete_])

  const loopRef = React.useRef(loop)
  React.useLayoutEffect(() => { loopRef.current = loop }, [loop])

  const [streamed, setStreamed] = React.useState('')
  const [streaming, setStreaming] = React.useState(isStream)
  const streamPosRef = React.useRef(0)
  const streamTimerRef = React.useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const streamLoopTimerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  React.useEffect(() => {
    if (!isStream) {
      // Static mode: mirror the text directly, no animation
      setStreamed(textRef.current ?? '')
      setStreaming(false)
      streamPosRef.current = textRef.current?.length ?? 0
      return
    }

    // Start / restart the stable interval
    streamPosRef.current = 0
    setStreamed('')
    setStreaming(true)

    const start = () => {
      streamTimerRef.current = setInterval(() => {
        const target = textRef.current ?? ''
        const pos = streamPosRef.current

        if (pos < target.length) {
          // Reveal the next character
          streamPosRef.current = pos + 1
          setStreamed(target.slice(0, pos + 1))
        } else if (streamDoneRef.current) {
          // Caught up and backend signalled completion
          clearInterval(streamTimerRef.current)
          setStreaming(false)
          onCompleteCbRef.current?.()
          if (loopRef.current) {
            streamLoopTimerRef.current = setTimeout(() => {
              streamPosRef.current = 0
              setStreamed('')
              setStreaming(true)
              start()
            }, 1400)
          }
        }
        // else: caught up but streamDone not yet set → keep polling for new tokens
      }, streamSpeed_)
    }

    start()
    return () => {
      clearInterval(streamTimerRef.current)
      clearTimeout(streamLoopTimerRef.current)
    }
  }, [isStream, streamSpeed_]) // textContent intentionally NOT in deps

  // ── Scramble ─────────────────────────────────────────────────────────────
  const [scrambled, setScrambled] = React.useState(textContent ?? '')
  React.useEffect(() => {
    if (!isScramble || !textContent) { setScrambled(textContent ?? ''); return }
    const dur = speed ?? Math.min(1400, Math.max(550, textContent.length * 20))
    let raf: number; let loopTmr: ReturnType<typeof setTimeout>
    const run = () => {
      const t0 = performance.now(); let last = 0
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / dur)
        if (now - last >= 35 || p >= 1) {
          last = now
          const resolved = Math.floor(p * textContent.length)
          setScrambled(p >= 1 ? textContent
            : textContent.split('').map((c, i) => c === ' ' ? ' ' : i < resolved ? c : scrambleChar(c)).join(''))
          if (p >= 1) { if (loop) loopTmr = setTimeout(run, 1400); return }
        }
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }
    run()
    return () => { cancelAnimationFrame(raf); clearTimeout(loopTmr) }
  }, [textContent, isScramble, speed, loop])

  // ── Typewriter ────────────────────────────────────────────────────────────
  const [typed, setTyped] = React.useState(isTypewriter ? '' : (textContent ?? ''))
  React.useEffect(() => {
    if (!isTypewriter || !textContent) { setTyped(textContent ?? ''); return }
    let count = 0; let loopTmr: ReturnType<typeof setTimeout>
    const run = (): ReturnType<typeof setInterval> => {
      count = 0; setTyped('')
      const t = setInterval(() => {
        count++; setTyped(textContent.slice(0, count))
        if (count >= textContent.length) { clearInterval(t); if (loop) loopTmr = setTimeout(run, 1400) }
      }, speed ?? 45)
      return t
    }
    const t = run()
    return () => { clearInterval(t); clearTimeout(loopTmr) }
  }, [textContent, isTypewriter, speed, loop])

  // ── Ticker ────────────────────────────────────────────────────────────────
  const numVal = textContent ? parseFloat(textContent.replace(/[^0-9.-]+/g, '')) : NaN
  const isNum  = !isNaN(numVal)
  const [tick, setTick] = React.useState(isTicker && isNum ? 0 : numVal)
  React.useEffect(() => {
    if (!isTicker || !isNum) { setTick(numVal); return }
    const dur = speed ?? 1000; let raf: number; let loopTmr: ReturnType<typeof setTimeout>
    const run = () => {
      const t0 = performance.now()
      const frame = (now: number) => {
        const p = Math.min(1, (now - t0) / dur)
        const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
        setTick(numVal * e)
        if (p < 1) raf = requestAnimationFrame(frame)
        else { setTick(numVal); if (loop) loopTmr = setTimeout(run, 1400) }
      }
      raf = requestAnimationFrame(frame)
    }
    run()
    return () => { cancelAnimationFrame(raf); clearTimeout(loopTmr) }
  }, [numVal, isTicker, isNum, speed, loop])

  // ── Build inner content ───────────────────────────────────────────────────
  const animCss = ANIM_CSS[eff] || ''
  const isChroma = eff === 'gradient' || eff === 'shimmer'
  const caret = <span data-slot="caret" className="font-anim-caret" />

  let inner: React.ReactNode = children

  if (textContent !== null) {
    if (isWavy) {
      const src = isStream ? streamed : textContent
      inner = (
        <>
          {src.split('').map((char, i) => {
            const delay = `${-(i * 0.1).toFixed(3)}s`
            const cp: TextCharSlotProps = { char, index: i, className: 'font-anim-wavy-char', style: { animationDelay: delay } }
            if (slots?.char) return <React.Fragment key={i}>{renderSlot(slots.char, { ...slotProps?.char, ...cp })}</React.Fragment>
            return <span key={i} data-slot="char" className="font-anim-wavy-char" style={{ animationDelay: delay }}>{char === ' ' ? '\u00A0' : char}</span>
          })}
          {isStream && showCursor_ && streaming && (slots?.caret ? renderSlot(slots.caret, slotProps?.caret ?? {}) : caret)}
        </>
      )
    } else if (isStream) {
      inner = <>{streamed}{showCursor_ && streaming && (slots?.caret ? renderSlot(slots.caret, slotProps?.caret ?? {}) : caret)}</>
    } else if (isScramble) {
      inner = scrambled
    } else if (isTypewriter) {
      inner = <>{typed}{slots?.caret ? renderSlot(slots.caret, slotProps?.caret ?? {}) : caret}</>
    } else if (isTicker && isNum) {
      const dec = textContent.includes('.') ? (textContent.split('.')[1]?.length ?? 0) : 0
      inner = tick.toFixed(dec)
    } else if (phrases_?.length) {
      inner = phrases_[phraseIdx]
    }
  }

  // ── Entrance config resolution ───────────────────────────────────────────
  const entranceCfg: TextEntranceOptions = typeof entrance === 'object' ? entrance : {}
  const entranceType = (typeof entrance === 'string' ? entrance : entranceCfg.type) ?? (eff in ENTRANCE_VARS ? eff : undefined)
  const isCustomEntrance = Boolean(initial || animate || entrance)
  const isEntrance = Boolean(entranceType || isCustomEntrance)

  const parentAnimClass = isSlide ? '' : animCss
  const childAnimClass = isSlide ? animCss : ''

  let output: React.ReactNode = inner
  if (isSlide && slideVars) {
    const key = phrases_
      ? `${phraseIdx}-${phrases_[phraseIdx]}`
      : typeof children === 'string' ? children : `s-${phraseIdx}`
    output = (
      <AnimatePresence mode="wait">
        <motion.span
          key={key}
          initial={slideVars.initial}
          animate={slideVars.animate}
          exit={slideVars.exit}
          transition={{ duration: dur_, ease: [0.25, 0.1, 0.25, 1] }}
          className={cn('inline-block', childAnimClass)}
        >
          {inner}
        </motion.span>
      </AnimatePresence>
    )
  } else if (isEntrance) {
    const basePreset = entranceType && ENTRANCE_VARS[entranceType]
      ? ENTRANCE_VARS[entranceType]!
      : ENTRANCE_VARS['fade-in']!

    let resolvedInitial = initial ?? entranceCfg.initial ?? basePreset.initial
    let resolvedAnimate = animate ?? entranceCfg.animate ?? basePreset.animate
    let resolvedExit = exit ?? entranceCfg.exit

    if (entranceCfg.distance !== undefined && entranceType) {
      const d = entranceCfg.distance
      if (entranceType === 'slide-left' || entranceType === 'slide-in' || entranceType === 'blur-slide') {
        resolvedInitial = { ...resolvedInitial, x: -d }
      } else if (entranceType === 'slide-right') {
        resolvedInitial = { ...resolvedInitial, x: d }
      } else if (entranceType === 'slide-up' || entranceType === 'lift' || entranceType === 'lift-scale' || entranceType === 'blur-lift') {
        resolvedInitial = { ...resolvedInitial, y: d }
      } else if (entranceType === 'slide-down') {
        resolvedInitial = { ...resolvedInitial, y: -d }
      }
    }

    const resolvedTransition = {
      ...basePreset.transition,
      ...(entranceCfg.duration !== undefined ? { duration: entranceCfg.duration } : {}),
      ...(entranceCfg.delay !== undefined ? { delay: entranceCfg.delay } : {}),
      ...(entranceCfg.ease !== undefined ? { ease: entranceCfg.ease } : {}),
      ...(typeof entranceCfg.transition === 'object' ? entranceCfg.transition : {}),
      ...(typeof transition === 'object' ? transition : {}),
    }

    output = (
      <motion.span
        initial={resolvedInitial}
        animate={resolvedAnimate}
        exit={resolvedExit}
        transition={resolvedTransition}
        className="inline-block max-w-full"
      >
        {inner}
      </motion.span>
    )
  }

  const cls = buildClass(size, weight, tracking, leading, align, transform,
    isChroma ? undefined : _intent,
    parentAnimClass,
    italic,
    // Strip color classes from _extra when chroma — they fight transparent fill
    isChroma ? _extra?.replace(/\btext-(?:fg|muted-fg|primary|success|warning|danger)\b/g, '').trim() : _extra,
    className)
  const fStyle = buildFontStyle(font, family, weight, tabular, slashedZero, ligatures, fontSans, fontMono)

  // Slide needs overflow:hidden so the exiting phrase clips at the element boundary.
  const extraStyle: React.CSSProperties = isSlide
    ? { overflow: 'hidden', display: 'block', ..._extraStyle, ...style }
    : { ..._extraStyle, ...style }

  return (
    <Tag ref={ref} className={cls} style={{ ...fStyle, ...extraStyle }} {...dom}>
      {output}
    </Tag>
  )
}

/* ==========================================================================
   _CoreText — resolves theme, routes to Static (0 anim hooks) or Animated
   ========================================================================== */

const _CoreText = (props: Omit<_ResolvedProps, 'fontSans' | 'fontMono'>) => {
  const theme   = useThemeOptional()
  const fontSans = (theme?.fontFamily ?? (theme as any)?.fontSans) ?? 'Inter'
  const fontMono = (theme?.fontFamilyMono ?? (theme as any)?.fontMono) ?? 'Geist Mono'

  const { animation, gradient, slide, stream, entrance, initial, animate } = props
  const eff: TextAnimation = gradient ? 'gradient' : (animation ?? 'none')
  const needsJS = JS_ANIMATIONS.has(eff) || Boolean(slide) || Boolean(stream) || Boolean(entrance) || Boolean(initial) || Boolean(animate)

  const resolved = { ...props, fontSans, fontMono } as _ResolvedProps
  return needsJS ? <_AnimatedText {...resolved} /> : <_StaticText {...resolved} />
}

/* ==========================================================================
   Sub-atom primitives — apply semantic defaults, delegate to _CoreText
   ========================================================================== */

// ── Text (body) ────────────────────────────────────────────────────────────

const TextPrimitive = ({
  as = 'p',
  variant = 'default',
  intent,
  ...props
}: TextProps) => {
  const resolvedIntent: TextIntent = intent ?? VARIANT_INTENT[variant] ?? 'default'
  const extra = VARIANT_EXTRA[variant]
  return (
    <_CoreText
      _tag={as}
      _intent={resolvedIntent}
      _extra={extra}
      {...props}
    />
  )
}

// ── Heading ────────────────────────────────────────────────────────────────

const H_SIZE: Record<number, FontSize> = {
  1: '3xl', 2: '2xl', 3: 'xl', 4: 'lg', 5: 'base', 6: 'sm',
}
const H_WEIGHT: Record<number, FontWeight> = {
  1: 'bold', 2: 'semibold', 3: 'semibold', 4: 'medium', 5: 'medium', 6: 'medium',
}
const H_TRACKING: Partial<Record<number, FontTracking>> = { 1: 'tight', 2: 'tight', 6: 'wider' }
const H_EXTRA: Record<number, string> = {
  1: 'text-fg sm:text-4xl font-sans', 2: 'text-fg sm:text-3xl font-sans',
  3: 'text-fg sm:text-2xl font-sans', 4: 'text-fg sm:text-xl font-sans',
  5: 'text-fg font-sans',             6: 'text-muted-fg uppercase font-sans',
}

const HeadingPrimitive = ({
  level = 1,
  as,
  size,
  weight,
  tracking,
  intent,
  ...props
}: HeadingProps) => (
  <_CoreText
    _tag={as ?? (`h${level}` as React.ElementType)}
    _intent={intent ?? 'default'}
    _extra={H_EXTRA[level]}
    size={size ?? H_SIZE[level]}
    weight={weight ?? H_WEIGHT[level]}
    tracking={tracking ?? H_TRACKING[level]}
    {...props}
  />
)

// ── Strong ─────────────────────────────────────────────────────────────────

const StrongPrimitive = ({ as = 'strong' as React.ElementType, intent, weight, ...props }: StrongProps) => (
  <_CoreText
    _tag={as}
    _intent={intent ?? 'default'}
    _extra="text-fg"
    weight={weight ?? 'semibold'}
    {...props}
  />
)

// ── Code ───────────────────────────────────────────────────────────────────

const CodePrimitive = ({ as = 'code' as React.ElementType, intent, family, size, weight, ...props }: CodeProps) => (
  <_CoreText
    _tag={as}
    _intent={intent ?? 'default'}
    _extra="rounded-atom border border-border bg-muted px-1.5 py-space-2xs text-fg"
    family={family ?? 'mono'}
    size={size ?? 'sm'}
    weight={weight ?? 'medium'}
    {...props}
  />
)

// ── Blockquote ─────────────────────────────────────────────────────────────

const BlockquotePrimitive = ({ as = 'blockquote' as React.ElementType, intent, italic, ...props }: BlockquoteProps) => (
  <_CoreText
    _tag={as}
    _intent={intent ?? 'muted'}
    _extra="border-l-2 border-border pl-space-lg my-space-lg"
    italic={italic ?? true}
    {...props}
  />
)

// ── Lead ───────────────────────────────────────────────────────────────────

const LeadPrimitive = ({ as = 'p' as React.ElementType, intent, size, leading, ...props }: LeadProps) => (
  <_CoreText
    _tag={as}
    _intent={intent ?? 'muted'}
    _extra="sm:text-xl"
    size={size ?? 'lg'}
    leading={leading ?? 'relaxed'}
    {...props}
  />
)

/* ==========================================================================
   Public createInterfaceComponent wrappers
   ========================================================================== */

export const Text = createInterfaceComponent<TextProps, TextSlots>(
  {
    name: 'Text',
    category: 'typography',
    description: 'Unified typographic atom for Consona Interface merging semantic typography with full kinetic animation capabilities.',
    version: '1.0.0',
    props: { as: 'p', variant: 'default', size: 'base' },
    slots: { caret: undefined, char: undefined },
  },
  TextPrimitive
)

export const Heading = createInterfaceComponent<HeadingProps, TextSlots>(
  {
    name: 'Heading',
    category: 'typography',
    description: 'Semantic h1-h6 heading with optical type scale defaults and full kinetic animation support.',
    version: '1.0.0',
    props: { level: 1 },
    slots: { caret: undefined, char: undefined },
  },
  HeadingPrimitive
)

export const Strong = createInterfaceComponent<StrongProps, TextSlots>(
  {
    name: 'Strong',
    category: 'typography',
    description: 'Inline bold emphasis element with optional kinetic effects.',
    version: '1.0.0',
    slots: { caret: undefined, char: undefined },
  },
  StrongPrimitive
)

export const Code = createInterfaceComponent<CodeProps, TextSlots>(
  {
    name: 'Code',
    category: 'typography',
    description: 'Monospace inline code snippet with border styling and optional kinetic effects.',
    version: '1.0.0',
    slots: { caret: undefined, char: undefined },
  },
  CodePrimitive
)

export const Blockquote = createInterfaceComponent<BlockquoteProps, TextSlots>(
  {
    name: 'Blockquote',
    category: 'typography',
    description: 'Semantic blockquote with left border indicator and italic styling.',
    version: '1.0.0',
    slots: { caret: undefined, char: undefined },
  },
  BlockquotePrimitive
)

export const Lead = createInterfaceComponent<LeadProps, TextSlots>(
  {
    name: 'Lead',
    category: 'typography',
    description: 'Prominent lead-in paragraph for hero sections and article headers.',
    version: '1.0.0',
    slots: { caret: undefined, char: undefined },
  },
  LeadPrimitive
)

// Namespace attachments for compound family ergonomics
Text.Heading = Heading
Text.Strong = Strong
Text.Code = Code
Text.Blockquote = Blockquote
Text.Lead = Lead

/* ==========================================================================
   Compound contexts
   ========================================================================== */

export const { Context: TextContext, useCompoundContext: useTextContext } =
  createCompoundContext<any>('Text')

export const { Context: HeadingContext, useCompoundContext: useHeadingContext } =
  createCompoundContext<any>('Heading')
