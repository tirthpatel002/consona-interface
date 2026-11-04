# @consona/interface-sound

Procedural Web Audio interaction sounds for Consona Interface — one-shots, continuous loops, declarative `data-sound-*` bindings, and headless hooks.

## Install

```bash
pnpm add @consona/interface-sound
```

Peer: `react`, `react-dom`, `@consona/interface-core`.

## Quick start

```tsx
import { SoundProvider, SoundTrigger, useSound } from '@consona/interface-sound'

export function App() {
  return (
    <SoundProvider>
      <SoundTrigger cue="tap" label="Click me" />
      <Toolbar />
    </SoundProvider>
  )
}

function Toolbar() {
  const { play, start, stop, setMuted } = useSound()
  return (
    <>
      <button type="button" onClick={() => play('success', { variant: 'chime' })}>
        Success
      </button>
      <button type="button" onClick={() => start('loading-hum')}>
        Hum
      </button>
      <button type="button" onClick={() => stop('loading-hum')}>
        Stop
      </button>
      <button type="button" onClick={() => setMuted(true)}>
        Mute
      </button>
    </>
  )
}
```

## Provider ownership

- `SoundProvider` creates and owns an engine unless you pass `engine={createSoundEngine(...)}`.
- External engines are **never** destroyed by the provider.
- Owned engines are Strict Mode–safe (deferred destroy).
- Preferences persist only when a `storageAdapter` is supplied. The provider defaults to browser localStorage under `consona:sound:` + `storageKey` (default `config`). Pass a unique `storageKey` for independent engines.

```tsx
import { createSoundEngine, createLocalStorageAdapter } from '@consona/interface-sound'

const engine = createSoundEngine({
  storageAdapter: createLocalStorageAdapter(),
  storageKey: 'app-shell',
  autoBind: false,
  respectReducedMotion: true,
})
```

## Built-in cues

**Canonical:** `tap`, `type`, `select`, `toggle`, `open`, `close`, `success`, `error`, `navigate`, `notification`

**Expressive:** `bloom`, `droplet`, `chord`, `lock`, `laser`, `ready`, `scan`, `arrival`, `whoosh`, `press`, `release`

**Continuous:** `loading-hum`, `radar-pulse`, `beam-laser`, `focus-noise`, `alarm-beacon`, `ticker-stream`, `wind-ambient`, `heartbeat`

Many cues expose variants (e.g. `tap:mechanical`, `success:chime`). Use `getAvailableCues()` / `getVariants(cue)`.

## Custom cues

```tsx
const { registerCue, play } = useSound()

registerCue('brand-tap', {
  default: {
    masterGain: 0.8,
    layers: [
      { kind: 'tone', waveform: 'triangle', frequency: 520, attack: 0.005, decay: 0.12, peak: 0.6 },
    ],
  },
})

play('brand-tap')
```

`registerRecipe` / `customRecipes` never mutate the built-in palette — overrides live on the engine instance.

## Declarative DOM bindings

With `autoBind` (provider default `true`), delegated listeners honor:

| Attribute | Behavior |
|-----------|----------|
| `data-sound="tap:mechanical"` | Click / change |
| `data-sound-hover="select"` | Pointer enter (fine pointer) |
| `data-sound-press` / `data-sound-release` | Pointer down / up |
| `data-sound-hold="loading-hum"` | Continuous while pressed |
| `data-sound-start` / `data-sound-stop` / `data-sound-toggle-loop` | Continuous control |
| `data-sound-type` | Typing (skips password / IME / repeats) |
| `data-sound-emphasis` / `data-sound-volume` / `data-sound-ttl` | Overrides |

Re-binding the same engine+root is a no-op. Prefer one provider, or `autoBind={false}` and `engine.bind(root)`.

## Reduced motion

When `respectReducedMotion` is true (default), `play` / `start` no-op while `(prefers-reduced-motion: reduce)` matches.

## Hooks

| Hook | Role |
|------|------|
| `useSound` | Engine state + play/start/stop |
| `useSoundTrigger` | Click/press/hover/hold/loop helpers |
| `useContinuousSound` | Sustained loop lifecycle |
| `useDynamicSound` | Live modulation handle |
| `useCursorSound` | Pointer air / breeze |
| `useScrollSound` | Scroll latch clicks |
| `useDragSound` | Drag stride + pick/drop |
| `useKeySound` / `useSoundFeedback` | Keyboard / feedback helpers |

## Entries

- `@consona/interface-sound` — full surface
- `@consona/interface-sound/sound-trigger` — trigger component entry
