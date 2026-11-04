# `@consona/interface-orb`

Procedural WebGPU orb with curated optical flow presets and an audio-reactive `SensitiveOrb`.

```bash
npm install @consona/interface-orb
```

```ts
import { Orb, SensitiveOrb } from '@consona/interface-orb'

<Orb styleName="signal" glassEnabled />
<SensitiveOrb styleName="aurora" audioElement={el} />
```

Style names: `chrome`, `gold`, `champagneGold`, `roseGold`, `emerald`, `blueFlame`, `signal`, `voiceWave`, `aurora`, `plasma`, `frost`, `blueDrop`, `violetEmber`, `refractiveBlob`, `amber`.

Requires a WebGPU-capable browser. See `NOTICE` for third-party license attribution of derived shader code.
