/**
 * AudioContext lifecycle and resource manager.
 * Safely handles browser autoplay policies, suspended states, and cross-browser fallbacks.
 */

let sharedAudioContext: AudioContext | null = null

export function getAudioContextConstructor(): typeof AudioContext {
  if (typeof window === 'undefined') {
    throw new Error('Web Audio API is only available in browser environments.')
  }

  const constructor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext

  if (!constructor) {
    throw new Error('Your browser does not support the Web Audio API.')
  }

  return constructor
}

export function createAudioContext(options?: AudioContextOptions): AudioContext {
  const AudioCtx = getAudioContextConstructor()
  return new AudioCtx(options)
}

export function getSharedAudioContext(): AudioContext {
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = createAudioContext()
  }
  return sharedAudioContext
}

export async function resumeAudioContext(ctx?: AudioContext | null): Promise<void> {
  const target = ctx || sharedAudioContext
  if (target && target.state === 'suspended') {
    try {
      await target.resume()
    } catch (e) {
      console.warn('Failed to resume AudioContext:', e)
    }
  }
}

export function attachAutoResumeListener(ctx: AudioContext): () => void {
  if (typeof window === 'undefined') return () => {}

  const resume = () => {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
  }

  const events = ['pointerdown', 'keydown', 'touchstart'] as const
  events.forEach((evt) => window.addEventListener(evt, resume, { once: true, passive: true }))

  return () => {
    events.forEach((evt) => window.removeEventListener(evt, resume))
  }
}
