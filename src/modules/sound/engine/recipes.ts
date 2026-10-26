import type {
  AdaptiveSoundContext,
  CanonicalSoundName,
  ContinuousSoundName,
  ExpressiveSoundName,
  Shimmer,
  SoundCueDefinition,
  SoundEmphasis,
  SoundName,
  SoundRecipe,
} from './types'

/* ==========================================================================
   Sound Palette: Cues and Acoustic Variants
   ========================================================================== */

export const SOUND_REGISTRY: Record<string, SoundCueDefinition> = {
  // --- 1. TAP ---
  tap: {
    default: {
      masterGain: 0.46,
      layers: [
        { kind: 'noise', filterType: 'bandpass', filterFrequency: 3200, filterQ: 2.0, attack: 0.001, decay: 0.018, peak: 0.12 },
        { kind: 'tone', waveform: 'sine', frequency: 780, glideTo: 390, glideTime: 0.03, attack: 0.001, decay: 0.035, peak: 0.07 },
      ],
    },
    variants: {
      mechanical: {
        masterGain: 0.48,
        layers: [
          { kind: 'noise', filterType: 'bandpass', filterFrequency: 4800, filterQ: 3.2, attack: 0.0005, decay: 0.012, peak: 0.16 },
          { kind: 'tone', waveform: 'triangle', frequency: 920, attack: 0.0005, decay: 0.015, peak: 0.05 },
          { kind: 'noise', filterType: 'highpass', filterFrequency: 6000, attack: 0.0005, decay: 0.008, peak: 0.08 },
        ],
      },
      soft: {
        masterGain: 0.42,
        layers: [
          { kind: 'noise', filterType: 'lowpass', filterFrequency: 1400, filterQ: 0.8, attack: 0.004, decay: 0.035, peak: 0.08 },
          { kind: 'tone', waveform: 'sine', frequency: 520, attack: 0.004, decay: 0.04, peak: 0.04 },
        ],
      },
      spring: {
        masterGain: 0.46,
        layers: [
          { kind: 'tone', waveform: 'sine', frequency: 650, glideTo: 1300, glideTime: 0.02, attack: 0.001, decay: 0.045, peak: 0.08 },
          { kind: 'noise', filterType: 'bandpass', filterFrequency: 4200, filterQ: 2.5, attack: 0.001, decay: 0.015, peak: 0.09 },
        ],
      },
      pop: {
        masterGain: 0.5,
        layers: [
          { kind: 'tone', waveform: 'sine', frequency: 580, glideTo: 1420, glideTime: 0.035, attack: 0.001, decay: 0.055, peak: 0.1 },
          { kind: 'noise', filterType: 'bandpass', filterFrequency: 2900, filterQ: 2.2, attack: 0.001, decay: 0.015, peak: 0.06 },
        ],
      },
    },
  },

  // --- 2. TYPE ---
  type: {
    default: {
      masterGain: 0.38,
      layers: [
        { kind: 'noise', filterType: 'bandpass', filterFrequency: 4200, filterQ: 2.2, attack: 0.001, decay: 0.014, peak: 0.1 },
        { kind: 'tone', waveform: 'sine', frequency: 540, attack: 0.001, decay: 0.02, peak: 0.03 },
      ],
    },
    variants: {
      mechanical: {
        masterGain: 0.42,
        layers: [
          { kind: 'noise', filterType: 'bandpass', filterFrequency: 5200, filterQ: 2.8, attack: 0.0005, decay: 0.011, peak: 0.14 },
          { kind: 'noise', filterType: 'lowpass', filterFrequency: 1800, attack: 0.0005, decay: 0.016, peak: 0.06 },
          { kind: 'tone', waveform: 'triangle', frequency: 480, attack: 0.0005, decay: 0.014, peak: 0.03 },
        ],
      },
      clack: {
        masterGain: 0.44,
        layers: [
          { kind: 'noise', filterType: 'bandpass', filterFrequency: 6000, filterQ: 3.0, attack: 0.0005, decay: 0.009, peak: 0.15 },
          { kind: 'tone', waveform: 'sine', frequency: 720, attack: 0.001, decay: 0.018, peak: 0.04 },
        ],
      },
    },
  },

  // --- 3. SELECT ---
  select: {
    default: {
      masterGain: 0.44,
      layers: [
        { kind: 'noise', filterType: 'bandpass', filterFrequency: 5400, filterQ: 1.8, attack: 0.001, decay: 0.015, peak: 0.1 },
        { kind: 'tone', waveform: 'sine', frequency: 1320, attack: 0.002, decay: 0.045, peak: 0.055 },
      ],
      shimmer: { delay: 0.06, feedback: 0.15, wet: 0.1, lowpass: 5000 },
    },
    variants: {
      pluck: {
        masterGain: 0.46,
        layers: [
          { kind: 'tone', waveform: 'triangle', frequency: 1480, glideTo: 980, glideTime: 0.04, attack: 0.001, decay: 0.06, peak: 0.07 },
          { kind: 'noise', filterType: 'highpass', filterFrequency: 5000, attack: 0.0005, decay: 0.01, peak: 0.06 },
        ],
      },
      tick: {
        masterGain: 0.4,
        layers: [
          { kind: 'noise', filterType: 'bandpass', filterFrequency: 5800, filterQ: 2.2, attack: 0.001, decay: 0.012, peak: 0.14 },
          { kind: 'tone', waveform: 'sine', frequency: 2600, attack: 0.001, decay: 0.01, peak: 0.02 },
        ],
      },
      detent: {
        masterGain: 0.45,
        layers: [
          { kind: 'noise', filterType: 'bandpass', filterFrequency: 4500, filterQ: 3.0, attack: 0.0005, decay: 0.01, peak: 0.15 },
          { kind: 'tone', waveform: 'square', frequency: 1200, attack: 0.001, decay: 0.015, peak: 0.02 },
        ],
      },
    },
  },

  // --- 4. TOGGLE ---
  toggle: {
    default: {
      masterGain: 0.42,
      layers: [
        { kind: 'noise', filterType: 'bandpass', filterFrequency: 2200, filterQ: 1.6, attack: 0.001, decay: 0.016, peak: 0.11 },
        { kind: 'noise', filterType: 'bandpass', filterFrequency: 3800, filterQ: 1.6, offset: 0.022, attack: 0.001, decay: 0.02, peak: 0.09 },
        { kind: 'tone', waveform: 'sine', frequency: 660, offset: 0.022, attack: 0.002, decay: 0.03, peak: 0.04 },
      ],
    },
    variants: {
      switch: {
        masterGain: 0.45,
        layers: [
          { kind: 'noise', filterType: 'bandpass', filterFrequency: 2800, filterQ: 1.8, attack: 0.001, decay: 0.02, peak: 0.12 },
          { kind: 'tone', waveform: 'triangle', frequency: 800, glideTo: 1200, glideTime: 0.02, attack: 0.001, decay: 0.03, peak: 0.05 },
        ],
      },
      latch: {
        masterGain: 0.46,
        layers: [
          { kind: 'noise', filterType: 'bandpass', filterFrequency: 3600, filterQ: 2.5, attack: 0.0005, decay: 0.012, peak: 0.14 },
          { kind: 'noise', filterType: 'bandpass', filterFrequency: 5800, filterQ: 2.5, offset: 0.018, attack: 0.0005, decay: 0.015, peak: 0.12 },
        ],
      },
      mechanical: {
        masterGain: 0.48,
        layers: [
          { kind: 'noise', filterType: 'bandpass', filterFrequency: 4200, filterQ: 2.6, attack: 0.0005, decay: 0.01, peak: 0.15 },
          { kind: 'tone', waveform: 'triangle', frequency: 950, attack: 0.001, decay: 0.02, peak: 0.04 },
        ],
      },
    },
  },

  // --- 5. OPEN ---
  open: {
    default: {
      masterGain: 0.48,
      layers: [
        { kind: 'noise', filterType: 'lowpass', filterFrequency: 1400, filterQ: 0.7, attack: 0.025, decay: 0.12, peak: 0.04 },
        { kind: 'tone', waveform: 'sine', frequency: 440, glideTo: 880, glideTime: 0.14, attack: 0.015, decay: 0.16, peak: 0.065 },
        { kind: 'tone', waveform: 'sine', frequency: 1320, offset: 0.05, attack: 0.01, decay: 0.18, peak: 0.04 },
      ],
      shimmer: { delay: 0.1, feedback: 0.22, wet: 0.14, lowpass: 3800 },
    },
    variants: {
      elastic: {
        masterGain: 0.5,
        layers: [
          { kind: 'tone', waveform: 'sine', frequency: 330, glideTo: 990, glideTime: 0.18, attack: 0.01, decay: 0.2, peak: 0.08 },
          { kind: 'noise', filterType: 'bandpass', filterFrequency: 2200, filterQ: 1.5, attack: 0.01, decay: 0.08, peak: 0.05 },
        ],
        shimmer: { delay: 0.12, feedback: 0.25, wet: 0.16, lowpass: 4200 },
      },
      slide: {
        masterGain: 0.44,
        layers: [
          { kind: 'noise', filterType: 'bandpass', filterFrequency: 1800, filterQ: 1.0, attack: 0.02, decay: 0.14, peak: 0.08 },
          { kind: 'tone', waveform: 'triangle', frequency: 550, glideTo: 1100, glideTime: 0.1, attack: 0.005, decay: 0.12, peak: 0.045 },
        ],
      },
      snap: {
        masterGain: 0.48,
        layers: [
          { kind: 'noise', filterType: 'bandpass', filterFrequency: 4200, filterQ: 2.2, attack: 0.001, decay: 0.02, peak: 0.13 },
          { kind: 'tone', waveform: 'triangle', frequency: 440, glideTo: 880, glideTime: 0.06, attack: 0.002, decay: 0.08, peak: 0.06 },
        ],
      },
    },
  },

  // --- 6. CLOSE ---
  close: {
    default: {
      masterGain: 0.48,
      layers: [
        { kind: 'noise', filterType: 'lowpass', filterFrequency: 1600, filterQ: 0.8, attack: 0.01, decay: 0.14, peak: 0.045 },
        { kind: 'tone', waveform: 'sine', frequency: 880, glideTo: 380, glideTime: 0.13, attack: 0.005, decay: 0.16, peak: 0.06 },
      ],
      shimmer: { delay: 0.08, feedback: 0.18, wet: 0.12, lowpass: 3200 },
    },
    variants: {
      suction: {
        masterGain: 0.5,
        layers: [
          { kind: 'tone', waveform: 'sine', frequency: 990, glideTo: 330, glideTime: 0.15, attack: 0.005, decay: 0.18, peak: 0.07 },
          { kind: 'noise', filterType: 'lowpass', filterFrequency: 1200, filterQ: 1.2, offset: 0.02, attack: 0.01, decay: 0.12, peak: 0.06 },
        ],
      },
      snap: {
        masterGain: 0.48,
        layers: [
          { kind: 'noise', filterType: 'bandpass', filterFrequency: 4800, filterQ: 2.5, attack: 0.001, decay: 0.02, peak: 0.14 },
          { kind: 'tone', waveform: 'triangle', frequency: 820, glideTo: 320, glideTime: 0.04, attack: 0.001, decay: 0.05, peak: 0.05 },
        ],
      },
    },
  },

  // --- 7. SUCCESS ---
  success: {
    default: {
      masterGain: 0.52,
      layers: [
        { kind: 'tone', waveform: 'sine', frequency: 880, attack: 0.004, decay: 0.11, peak: 0.065 },
        { kind: 'tone', waveform: 'sine', frequency: 1108.73, offset: 0.065, attack: 0.004, decay: 0.12, peak: 0.065 },
        { kind: 'tone', waveform: 'sine', frequency: 1318.51, offset: 0.13, attack: 0.004, decay: 0.22, peak: 0.075 },
      ],
      shimmer: { delay: 0.11, feedback: 0.26, wet: 0.2, lowpass: 4800 },
    },
    variants: {
      chime: {
        masterGain: 0.5,
        layers: [
          { kind: 'tone', waveform: 'sine', frequency: 1046.5, attack: 0.006, decay: 0.22, peak: 0.09 },
          { kind: 'tone', waveform: 'sine', frequency: 1568, offset: 0.09, attack: 0.006, decay: 0.26, peak: 0.08 },
        ],
        shimmer: { delay: 0.12, feedback: 0.25, wet: 0.18, lowpass: 4000 },
      },
      sparkle: {
        masterGain: 0.5,
        layers: [
          { kind: 'tone', waveform: 'sine', frequency: 1760, offset: 0, attack: 0.003, decay: 0.09, peak: 0.045 },
          { kind: 'tone', waveform: 'sine', frequency: 2217, offset: 0.045, attack: 0.003, decay: 0.09, peak: 0.04 },
          { kind: 'tone', waveform: 'sine', frequency: 2637, offset: 0.09, attack: 0.003, decay: 0.1, peak: 0.038 },
          { kind: 'tone', waveform: 'sine', frequency: 3520, offset: 0.135, attack: 0.003, decay: 0.12, peak: 0.032 },
        ],
        shimmer: { delay: 0.07, feedback: 0.35, wet: 0.22, lowpass: 6000 },
      },
      harmonic: {
        masterGain: 0.46,
        layers: [
          { kind: 'tone', waveform: 'sine', frequency: 587.33, attack: 0.025, decay: 0.28, peak: 0.048 },
          { kind: 'tone', waveform: 'sine', frequency: 783.99, offset: 0.07, attack: 0.025, decay: 0.32, peak: 0.048 },
          { kind: 'tone', waveform: 'sine', frequency: 1046.5, offset: 0.14, attack: 0.025, decay: 0.42, peak: 0.052 },
        ],
        shimmer: { delay: 0.14, feedback: 0.26, wet: 0.18, lowpass: 3600 },
      },
    },
  },

  // --- 8. ERROR ---
  error: {
    default: {
      masterGain: 0.44,
      layers: [
        { kind: 'noise', filterType: 'bandpass', filterFrequency: 850, filterQ: 1.1, attack: 0.001, decay: 0.035, peak: 0.12 },
        { kind: 'tone', waveform: 'triangle', frequency: 440, offset: 0.02, attack: 0.004, decay: 0.09, peak: 0.045 },
        { kind: 'tone', waveform: 'triangle', frequency: 349.23, offset: 0.095, attack: 0.004, decay: 0.15, peak: 0.04 },
      ],
    },
    variants: {
      knock: {
        masterGain: 0.46,
        layers: [
          { kind: 'noise', filterType: 'bandpass', filterFrequency: 600, filterQ: 1.8, attack: 0.001, decay: 0.04, peak: 0.16 },
          { kind: 'noise', filterType: 'bandpass', filterFrequency: 900, offset: 0.06, attack: 0.001, decay: 0.04, peak: 0.14 },
        ],
      },
      descend: {
        masterGain: 0.45,
        layers: [
          { kind: 'tone', waveform: 'sawtooth', frequency: 380, glideTo: 190, glideTime: 0.12, attack: 0.002, decay: 0.14, peak: 0.05 },
        ],
      },
      buzz: {
        masterGain: 0.42,
        layers: [
          { kind: 'noise', filterType: 'lowpass', filterFrequency: 550, filterQ: 0.8, attack: 0.005, decay: 0.08, peak: 0.04 },
          { kind: 'tone', waveform: 'sine', frequency: 196, glideTo: 146.83, glideTime: 0.1, attack: 0.008, decay: 0.14, peak: 0.025 },
        ],
      },
    },
  },

  // --- 9. NAVIGATE ---
  navigate: {
    default: {
      masterGain: 0.38,
      layers: [
        { kind: 'noise', filterType: 'lowpass', filterFrequency: 850, filterQ: 0.6, attack: 0.015, decay: 0.1, peak: 0.045 },
        { kind: 'tone', waveform: 'sine', frequency: 280, glideTo: 360, glideTime: 0.1, offset: 0.005, attack: 0.012, decay: 0.12, peak: 0.02 },
      ],
      shimmer: { delay: 0.09, feedback: 0.15, wet: 0.12, lowpass: 2200 },
    },
    variants: {
      slide: {
        masterGain: 0.38,
        layers: [
          { kind: 'noise', filterType: 'lowpass', filterFrequency: 550, filterQ: 0.5, attack: 0.025, decay: 0.14, peak: 0.035 },
          { kind: 'tone', waveform: 'sine', frequency: 220, glideTo: 260, glideTime: 0.12, attack: 0.02, decay: 0.15, peak: 0.018 },
        ],
        shimmer: { delay: 0.1, feedback: 0.14, wet: 0.1, lowpass: 1800 },
      },
      swipe: {
        masterGain: 0.38,
        layers: [
          { kind: 'noise', filterType: 'lowpass', filterFrequency: 750, filterQ: 0.5, attack: 0.02, decay: 0.12, peak: 0.04 },
          { kind: 'tone', waveform: 'sine', frequency: 280, glideTo: 340, glideTime: 0.08, attack: 0.015, decay: 0.1, peak: 0.018 },
        ],
        shimmer: { delay: 0.08, feedback: 0.12, wet: 0.08, lowpass: 2000 },
      },
      page: {
        masterGain: 0.35,
        layers: [
          { kind: 'noise', filterType: 'lowpass', filterFrequency: 1400, filterQ: 0.7, attack: 0.006, decay: 0.08, peak: 0.06 },
          { kind: 'noise', filterType: 'bandpass', filterFrequency: 2800, filterQ: 1.0, offset: 0.03, attack: 0.004, decay: 0.06, peak: 0.04 },
        ],
      },
      whisper: {
        masterGain: 0.34,
        layers: [
          { kind: 'noise', filterType: 'lowpass', filterFrequency: 850, filterQ: 0.6, attack: 0.025, decay: 0.12, peak: 0.038 },
          { kind: 'tone', waveform: 'sine', frequency: 320, glideTo: 260, glideTime: 0.11, attack: 0.015, decay: 0.12, peak: 0.015 },
        ],
      },
    },
  },

  // --- 10. NOTIFICATION ---
  notification: {
    default: {
      masterGain: 0.5,
      layers: [
        { kind: 'tone', waveform: 'sine', frequency: 739.99, attack: 0.003, decay: 0.28, peak: 0.075 },
        { kind: 'tone', waveform: 'sine', frequency: 1108.73, offset: 0.045, attack: 0.003, decay: 0.32, peak: 0.065 },
        { kind: 'tone', waveform: 'sine', frequency: 2217.46, offset: 0.09, attack: 0.002, decay: 0.35, peak: 0.035 },
      ],
      shimmer: { delay: 0.12, feedback: 0.28, wet: 0.18, lowpass: 4800 },
    },
    variants: {
      subtle: {
        masterGain: 0.42,
        layers: [
          { kind: 'noise', filterType: 'lowpass', filterFrequency: 1400, filterQ: 0.8, attack: 0.002, decay: 0.04, peak: 0.08 },
          { kind: 'tone', waveform: 'triangle', frequency: 620, glideTo: 580, glideTime: 0.04, attack: 0.002, decay: 0.065, peak: 0.045 },
        ],
      },
      urgent: {
        masterGain: 0.52,
        layers: [
          { kind: 'tone', waveform: 'triangle', frequency: 880, attack: 0.002, decay: 0.07, peak: 0.09 },
          { kind: 'noise', filterType: 'bandpass', filterFrequency: 3600, filterQ: 3.0, attack: 0.001, decay: 0.015, peak: 0.12 },
          { kind: 'tone', waveform: 'sine', frequency: 1318.51, offset: 0.075, attack: 0.002, decay: 0.14, peak: 0.085 },
          { kind: 'noise', filterType: 'highpass', filterFrequency: 5500, offset: 0.075, attack: 0.001, decay: 0.02, peak: 0.09 },
        ],
      },
      gentle: {
        masterGain: 0.46,
        layers: [
          { kind: 'tone', waveform: 'sine', frequency: 440.0, attack: 0.015, decay: 0.32, peak: 0.05 },
          { kind: 'tone', waveform: 'sine', frequency: 554.37, offset: 0.035, attack: 0.015, decay: 0.34, peak: 0.045 },
          { kind: 'tone', waveform: 'sine', frequency: 659.25, offset: 0.07, attack: 0.015, decay: 0.38, peak: 0.04 },
        ],
        shimmer: { delay: 0.14, feedback: 0.25, wet: 0.16, lowpass: 3600 },
      },
      electronic: {
        masterGain: 0.44,
        layers: [
          { kind: 'tone', waveform: 'sawtooth', frequency: 1400, glideTo: 2100, glideTime: 0.035, attack: 0.001, decay: 0.08, peak: 0.05 },
          { kind: 'tone', waveform: 'sine', frequency: 2800, offset: 0.03, attack: 0.002, decay: 0.12, peak: 0.045 },
          { kind: 'noise', filterType: 'bandpass', filterFrequency: 6500, filterQ: 3.5, attack: 0.001, decay: 0.02, peak: 0.08 },
        ],
        shimmer: { delay: 0.06, feedback: 0.18, wet: 0.12, lowpass: 5500 },
      },
      crystal: {
        masterGain: 0.5,
        layers: [
          { kind: 'tone', waveform: 'sine', frequency: 1760.0, attack: 0.003, decay: 0.25, peak: 0.06 },
          { kind: 'tone', waveform: 'sine', frequency: 2637.02, offset: 0.03, attack: 0.003, decay: 0.28, peak: 0.045 },
          { kind: 'noise', filterType: 'bandpass', filterFrequency: 8500, filterQ: 4.5, attack: 0.001, decay: 0.03, peak: 0.06 },
        ],
        shimmer: { delay: 0.1, feedback: 0.35, wet: 0.22, lowpass: 6500 },
      },
      pop: {
        masterGain: 0.48,
        layers: [
          { kind: 'tone', waveform: 'sine', frequency: 480, glideTo: 1350, glideTime: 0.04, attack: 0.001, decay: 0.07, peak: 0.09 },
          { kind: 'noise', filterType: 'bandpass', filterFrequency: 3200, filterQ: 2.8, attack: 0.001, decay: 0.015, peak: 0.08 },
          { kind: 'tone', waveform: 'triangle', frequency: 880, offset: 0.025, attack: 0.002, decay: 0.09, peak: 0.04 },
        ],
      },
    },
  },

  // ==========================================================================
  // Expressive Sound Cues
  // ==========================================================================

  bloom: {
    default: {
      masterGain: 0.5,
      layers: [
        { kind: 'tone', waveform: 'sine', frequency: 528, attack: 0.06, decay: 0.32, peak: 0.06 },
        { kind: 'tone', waveform: 'sine', frequency: 528, detune: 12, attack: 0.06, decay: 0.34, peak: 0.05 },
      ],
      shimmer: { delay: 0.15, feedback: 0.2, wet: 0.12, lowpass: 2500 },
    },
  },

  droplet: {
    default: {
      masterGain: 0.55,
      layers: [
        { kind: 'tone', waveform: 'sine', frequency: 1200, glideTo: 550, glideTime: 0.14, attack: 0.004, decay: 0.2, peak: 0.075 },
      ],
      shimmer: { delay: 0.09, feedback: 0.2, wet: 0.15, lowpass: 3000 },
    },
  },

  chord: {
    default: {
      masterGain: 0.45,
      layers: [
        { kind: 'tone', waveform: 'sine', frequency: 523.25, attack: 0.01, decay: 0.25, peak: 0.06 },
        { kind: 'tone', waveform: 'sine', frequency: 659.25, offset: 0.02, attack: 0.01, decay: 0.28, peak: 0.055 },
        { kind: 'tone', waveform: 'sine', frequency: 783.99, offset: 0.04, attack: 0.01, decay: 0.32, peak: 0.05 },
      ],
      shimmer: { delay: 0.12, feedback: 0.24, wet: 0.18, lowpass: 3800 },
    },
  },

  lock: {
    default: {
      masterGain: 0.48,
      layers: [
        { kind: 'noise', filterType: 'bandpass', filterFrequency: 1900, filterQ: 2.2, attack: 0.001, decay: 0.025, peak: 0.13 },
        { kind: 'noise', filterType: 'highpass', filterFrequency: 4500, offset: 0.018, attack: 0.001, decay: 0.02, peak: 0.1 },
        { kind: 'tone', waveform: 'triangle', frequency: 320, attack: 0.001, decay: 0.04, peak: 0.06 },
      ],
    },
  },

  laser: {
    default: {
      masterGain: 0.42,
      layers: [
        { kind: 'tone', waveform: 'sawtooth', frequency: 2400, glideTo: 180, glideTime: 0.09, attack: 0.001, decay: 0.1, peak: 0.06 },
      ],
      shimmer: { delay: 0.05, feedback: 0.2, wet: 0.1, lowpass: 4500 },
    },
  },

  ready: {
    default: {
      masterGain: 0.48,
      layers: [
        { kind: 'noise', filterType: 'bandpass', filterFrequency: 3600, filterQ: 1.8, attack: 0.001, decay: 0.02, peak: 0.11 },
        { kind: 'tone', waveform: 'triangle', frequency: 330, glideTo: 660, glideTime: 0.12, offset: 0.012, attack: 0.004, decay: 0.16, peak: 0.055 },
        { kind: 'tone', waveform: 'sine', frequency: 990, offset: 0.13, attack: 0.004, decay: 0.22, peak: 0.06 },
      ],
      shimmer: { delay: 0.1, feedback: 0.16, wet: 0.1, lowpass: 4200 },
    },
  },

  scan: {
    default: {
      masterGain: 0.4,
      layers: [
        { kind: 'tone', waveform: 'sine', frequency: 740, attack: 0.002, decay: 0.055, peak: 0.05 },
        { kind: 'tone', waveform: 'sine', frequency: 1110, offset: 0.045, attack: 0.002, decay: 0.055, peak: 0.045 },
        { kind: 'tone', waveform: 'sine', frequency: 1665, offset: 0.09, attack: 0.002, decay: 0.07, peak: 0.04 },
      ],
      shimmer: { delay: 0.065, feedback: 0.16, wet: 0.1, lowpass: 4200 },
    },
  },

  arrival: {
    default: {
      masterGain: 0.44,
      layers: [
        { kind: 'noise', filterType: 'lowpass', filterFrequency: 900, filterQ: 0.8, attack: 0.05, decay: 0.24, peak: 0.035 },
        { kind: 'tone', waveform: 'sine', frequency: 220, glideTo: 440, glideTime: 0.32, attack: 0.04, decay: 0.34, peak: 0.055 },
        { kind: 'tone', waveform: 'sine', frequency: 659.25, offset: 0.12, attack: 0.045, decay: 0.32, peak: 0.04 },
        { kind: 'tone', waveform: 'sine', frequency: 987.77, offset: 0.19, attack: 0.045, decay: 0.34, peak: 0.032 },
      ],
      shimmer: { delay: 0.16, feedback: 0.28, wet: 0.18, lowpass: 3200 },
    },
  },

  whoosh: {
    default: {
      masterGain: 0.46,
      layers: [
        { kind: 'noise', filterType: 'bandpass', filterFrequency: 1200, filterQ: 0.9, attack: 0.04, decay: 0.18, peak: 0.09 },
        { kind: 'noise', filterType: 'lowpass', filterFrequency: 2400, offset: 0.02, attack: 0.03, decay: 0.16, peak: 0.06 },
      ],
    },
  },

  press: {
    default: {
      masterGain: 0.4,
      layers: [
        { kind: 'noise', filterType: 'bandpass', filterFrequency: 1700, filterQ: 1.4, attack: 0.001, decay: 0.02, peak: 0.13 },
      ],
    },
  },

  release: {
    default: {
      masterGain: 0.38,
      layers: [
        { kind: 'noise', filterType: 'lowpass', filterFrequency: 1000, filterQ: 0.6, attack: 0.005, decay: 0.06, peak: 0.045 },
        { kind: 'tone', waveform: 'sine', frequency: 320, glideTo: 220, glideTime: 0.06, attack: 0.005, decay: 0.08, peak: 0.03 },
      ],
    },
  },

  // ==========================================================================
  // Continuous & Infinite Sound Cues (TTL & Stop Trigger Controlled)
  // ==========================================================================

  // --- LOADING-HUM ---
  'loading-hum': {
    default: {
      masterGain: 0.38,
      defaultRelease: 0.4,
      layers: [
        {
          kind: 'sustained-tone',
          waveform: 'sine',
          frequency: 130.81, // C3
          attack: 0.3,
          sustain: 0.08,
          release: 0.4,
          lfo: { rate: 0.15, depth: 3, target: 'frequency', waveform: 'sine' },
        },
        {
          kind: 'sustained-tone',
          waveform: 'sine',
          frequency: 196.0, // G3
          attack: 0.4,
          sustain: 0.06,
          release: 0.45,
        },
        {
          kind: 'sustained-tone',
          waveform: 'triangle',
          frequency: 261.63, // C4
          attack: 0.5,
          sustain: 0.03,
          release: 0.5,
          lfo: { rate: 0.25, depth: 0.012, target: 'gain', waveform: 'sine' },
        },
      ],
      shimmer: { delay: 0.12, feedback: 0.3, wet: 0.15, lowpass: 3500 },
    },
    variants: {
      crystal: {
        masterGain: 0.36,
        defaultRelease: 0.5,
        layers: [
          {
            kind: 'sustained-tone',
            waveform: 'sine',
            frequency: 523.25, // C5
            attack: 0.25,
            sustain: 0.06,
            release: 0.5,
            lfo: { rate: 0.2, depth: 4, target: 'frequency' },
          },
          {
            kind: 'sustained-tone',
            waveform: 'sine',
            frequency: 659.25, // E5
            attack: 0.35,
            sustain: 0.05,
            release: 0.5,
          },
          {
            kind: 'sustained-tone',
            waveform: 'sine',
            frequency: 783.99, // G5
            attack: 0.45,
            sustain: 0.04,
            release: 0.5,
          },
        ],
        shimmer: { delay: 0.14, feedback: 0.45, wet: 0.22, lowpass: 5000 },
      },
      subtle: {
        masterGain: 0.32,
        defaultRelease: 0.35,
        layers: [
          {
            kind: 'sustained-tone',
            waveform: 'sine',
            frequency: 85.0,
            attack: 0.4,
            sustain: 0.1,
            release: 0.35,
          },
        ],
      },
      hyperspace: {
        masterGain: 0.4,
        defaultRelease: 0.45,
        layers: [
          {
            kind: 'sustained-tone',
            waveform: 'sawtooth',
            frequency: 110,
            glideTo: 440,
            glideTime: 4.0,
            attack: 0.5,
            sustain: 0.05,
            release: 0.45,
            lfo: { rate: 4.0, depth: 8, target: 'frequency' },
          },
          {
            kind: 'sustained-noise',
            filterType: 'bandpass',
            filterFrequency: 1800,
            filterQ: 2.5,
            attack: 0.5,
            sustain: 0.04,
            release: 0.4,
          },
        ],
      },
    },
  },

  // --- RADAR-PULSE ---
  'radar-pulse': {
    default: {
      masterGain: 0.45,
      defaultRelease: 0.3,
      layers: [
        {
          kind: 'pulse-loop',
          interval: 0.9,
          attack: 0.05,
          release: 0.3,
          pulse: [
            {
              kind: 'tone',
              waveform: 'sine',
              frequency: 1200,
              glideTo: 600,
              glideTime: 0.08,
              attack: 0.002,
              decay: 0.15,
              peak: 0.12,
            },
            {
              kind: 'noise',
              filterType: 'bandpass',
              filterFrequency: 3000,
              filterQ: 3.5,
              attack: 0.001,
              decay: 0.04,
              peak: 0.06,
            },
          ],
        },
      ],
      shimmer: { delay: 0.15, feedback: 0.4, wet: 0.25, lowpass: 4000 },
    },
    variants: {
      sonar: {
        masterGain: 0.48,
        defaultRelease: 0.4,
        layers: [
          {
            kind: 'pulse-loop',
            interval: 1.2,
            attack: 0.05,
            release: 0.4,
            pulse: [
              {
                kind: 'tone',
                waveform: 'sine',
                frequency: 880,
                glideTo: 440,
                glideTime: 0.12,
                attack: 0.003,
                decay: 0.25,
                peak: 0.15,
              },
            ],
          },
        ],
        shimmer: { delay: 0.2, feedback: 0.6, wet: 0.35, lowpass: 3000 },
      },
      fast: {
        masterGain: 0.42,
        defaultRelease: 0.2,
        layers: [
          {
            kind: 'pulse-loop',
            interval: 0.45,
            attack: 0.05,
            release: 0.2,
            pulse: [
              {
                kind: 'tone',
                waveform: 'sine',
                frequency: 1400,
                glideTo: 700,
                glideTime: 0.05,
                attack: 0.002,
                decay: 0.09,
                peak: 0.1,
              },
            ],
          },
        ],
      },
      deep: {
        masterGain: 0.46,
        defaultRelease: 0.35,
        layers: [
          {
            kind: 'pulse-loop',
            interval: 1.0,
            attack: 0.05,
            release: 0.35,
            pulse: [
              {
                kind: 'tone',
                waveform: 'sine',
                frequency: 440,
                glideTo: 180,
                glideTime: 0.14,
                attack: 0.004,
                decay: 0.22,
                peak: 0.16,
              },
            ],
          },
        ],
      },
    },
  },

  // --- BEAM-LASER ---
  'beam-laser': {
    default: {
      masterGain: 0.42,
      defaultRelease: 0.25,
      layers: [
        {
          kind: 'sustained-tone',
          waveform: 'sawtooth',
          frequency: 320,
          attack: 0.04,
          sustain: 0.07,
          release: 0.25,
          lfo: { rate: 8.5, depth: 15, target: 'frequency' },
        },
        {
          kind: 'sustained-tone',
          waveform: 'triangle',
          frequency: 640,
          attack: 0.02,
          sustain: 0.05,
          release: 0.2,
        },
        {
          kind: 'sustained-noise',
          filterType: 'bandpass',
          filterFrequency: 4500,
          filterQ: 4.0,
          attack: 0.05,
          sustain: 0.04,
          release: 0.2,
        },
      ],
    },
    variants: {
      plasma: {
        masterGain: 0.44,
        defaultRelease: 0.2,
        layers: [
          {
            kind: 'sustained-tone',
            waveform: 'square',
            frequency: 240,
            attack: 0.03,
            sustain: 0.06,
            release: 0.2,
            lfo: { rate: 12.0, depth: 20, target: 'frequency' },
          },
          {
            kind: 'sustained-noise',
            filterType: 'lowpass',
            filterFrequency: 1200,
            attack: 0.04,
            sustain: 0.06,
            release: 0.2,
          },
        ],
      },
      overload: {
        masterGain: 0.46,
        defaultRelease: 0.3,
        layers: [
          {
            kind: 'sustained-tone',
            waveform: 'sawtooth',
            frequency: 220,
            glideTo: 880,
            glideTime: 2.5,
            attack: 0.05,
            sustain: 0.08,
            release: 0.3,
            lfo: { rate: 14.0, depth: 25, target: 'frequency' },
          },
        ],
      },
      clean: {
        masterGain: 0.38,
        defaultRelease: 0.25,
        layers: [
          {
            kind: 'sustained-tone',
            waveform: 'sine',
            frequency: 440,
            attack: 0.05,
            sustain: 0.08,
            release: 0.25,
          },
          {
            kind: 'sustained-tone',
            waveform: 'sine',
            frequency: 880,
            attack: 0.05,
            sustain: 0.04,
            release: 0.25,
          },
        ],
      },
    },
  },

  // --- FOCUS-NOISE ---
  'focus-noise': {
    default: {
      masterGain: 0.32,
      defaultRelease: 0.6,
      layers: [
        {
          kind: 'sustained-noise',
          filterType: 'lowpass',
          filterFrequency: 650,
          filterQ: 0.7,
          attack: 0.6,
          sustain: 0.14,
          release: 0.6,
          lfo: { rate: 0.08, depth: 120, target: 'filter' },
        },
      ],
    },
    variants: {
      pink: {
        masterGain: 0.28,
        defaultRelease: 0.5,
        layers: [
          {
            kind: 'sustained-noise',
            filterType: 'lowpass',
            filterFrequency: 1400,
            filterQ: 0.5,
            attack: 0.5,
            sustain: 0.1,
            release: 0.5,
          },
        ],
      },
      rain: {
        masterGain: 0.34,
        defaultRelease: 0.7,
        layers: [
          {
            kind: 'sustained-noise',
            filterType: 'bandpass',
            filterFrequency: 2200,
            filterQ: 1.2,
            attack: 0.7,
            sustain: 0.12,
            release: 0.7,
            lfo: { rate: 0.2, depth: 350, target: 'filter' },
          },
        ],
      },
      cosmic: {
        masterGain: 0.35,
        defaultRelease: 0.8,
        layers: [
          {
            kind: 'sustained-noise',
            filterType: 'lowpass',
            filterFrequency: 350,
            filterQ: 1.0,
            attack: 0.8,
            sustain: 0.16,
            release: 0.8,
          },
          {
            kind: 'sustained-tone',
            waveform: 'sine',
            frequency: 65.4, // C2 sub-drone
            attack: 0.8,
            sustain: 0.04,
            release: 0.8,
          },
        ],
        shimmer: { delay: 0.25, feedback: 0.4, wet: 0.18, lowpass: 1500 },
      },
    },
  },

  // --- ALARM-BEACON ---
  'alarm-beacon': {
    default: {
      masterGain: 0.46,
      defaultRelease: 0.2,
      layers: [
        {
          kind: 'pulse-loop',
          interval: 0.65,
          attack: 0.05,
          release: 0.2,
          pulse: [
            {
              kind: 'tone',
              waveform: 'sine',
              frequency: 780,
              glideTo: 520,
              glideTime: 0.18,
              attack: 0.005,
              decay: 0.22,
              peak: 0.14,
            },
            {
              kind: 'tone',
              waveform: 'square',
              frequency: 390,
              attack: 0.005,
              decay: 0.18,
              peak: 0.04,
            },
          ],
        },
      ],
    },
    variants: {
      rapid: {
        masterGain: 0.48,
        defaultRelease: 0.15,
        layers: [
          {
            kind: 'pulse-loop',
            interval: 0.35,
            attack: 0.03,
            release: 0.15,
            pulse: [
              {
                kind: 'tone',
                waveform: 'sawtooth',
                frequency: 880,
                attack: 0.003,
                decay: 0.12,
                peak: 0.12,
              },
            ],
          },
        ],
      },
      subtle: {
        masterGain: 0.36,
        defaultRelease: 0.3,
        layers: [
          {
            kind: 'pulse-loop',
            interval: 1.4,
            attack: 0.05,
            release: 0.3,
            pulse: [
              {
                kind: 'tone',
                waveform: 'sine',
                frequency: 600,
                attack: 0.01,
                decay: 0.25,
                peak: 0.08,
              },
            ],
          },
        ],
      },
    },
  },

  // --- TICKER-STREAM ---
  'ticker-stream': {
    default: {
      masterGain: 0.36,
      defaultRelease: 0.15,
      layers: [
        {
          kind: 'pulse-loop',
          interval: 0.075,
          jitter: 0.25,
          attack: 0.02,
          release: 0.15,
          pulse: [
            {
              kind: 'noise',
              filterType: 'bandpass',
              filterFrequency: 5200,
              filterQ: 3.0,
              attack: 0.0005,
              decay: 0.009,
              peak: 0.12,
            },
            {
              kind: 'tone',
              waveform: 'sine',
              frequency: 1800,
              attack: 0.001,
              decay: 0.008,
              peak: 0.03,
            },
          ],
        },
      ],
    },
    variants: {
      terminal: {
        masterGain: 0.38,
        defaultRelease: 0.15,
        layers: [
          {
            kind: 'pulse-loop',
            interval: 0.065,
            jitter: 0.15,
            attack: 0.02,
            release: 0.15,
            pulse: [
              {
                kind: 'tone',
                waveform: 'triangle',
                frequency: 2400,
                attack: 0.0005,
                decay: 0.007,
                peak: 0.06,
              },
              {
                kind: 'noise',
                filterType: 'highpass',
                filterFrequency: 6000,
                attack: 0.0005,
                decay: 0.006,
                peak: 0.08,
              },
            ],
          },
        ],
      },
      geiger: {
        masterGain: 0.35,
        defaultRelease: 0.12,
        layers: [
          {
            kind: 'pulse-loop',
            interval: 0.09,
            jitter: 0.45,
            attack: 0.02,
            release: 0.12,
            pulse: [
              {
                kind: 'noise',
                filterType: 'bandpass',
                filterFrequency: 4200,
                filterQ: 4.5,
                attack: 0.0005,
                decay: 0.008,
                peak: 0.15,
              },
            ],
          },
        ],
      },
      smooth: {
        masterGain: 0.32,
        defaultRelease: 0.15,
        layers: [
          {
            kind: 'pulse-loop',
            interval: 0.08,
            jitter: 0.1,
            attack: 0.02,
            release: 0.15,
            pulse: [
              {
                kind: 'noise',
                filterType: 'lowpass',
                filterFrequency: 2200,
                filterQ: 1.0,
                attack: 0.001,
                decay: 0.012,
                peak: 0.08,
              },
            ],
          },
        ],
      },
    },
  },

  // --- WIND-AMBIENT ---
  'wind-ambient': {
    default: {
      masterGain: 0.34,
      defaultRelease: 0.8,
      layers: [
        {
          kind: 'sustained-noise',
          filterType: 'bandpass',
          filterFrequency: 850,
          filterQ: 1.6,
          attack: 0.8,
          sustain: 0.12,
          release: 0.8,
          lfo: { rate: 0.12, depth: 400, target: 'filter' },
        },
      ],
    },
    variants: {
      gust: {
        masterGain: 0.38,
        defaultRelease: 0.7,
        layers: [
          {
            kind: 'sustained-noise',
            filterType: 'bandpass',
            filterFrequency: 1200,
            filterQ: 2.2,
            attack: 0.5,
            sustain: 0.15,
            release: 0.7,
            lfo: { rate: 0.35, depth: 600, target: 'filter' },
          },
        ],
      },
      breeze: {
        masterGain: 0.28,
        defaultRelease: 0.9,
        layers: [
          {
            kind: 'sustained-noise',
            filterType: 'lowpass',
            filterFrequency: 600,
            filterQ: 0.8,
            attack: 0.9,
            sustain: 0.08,
            release: 0.9,
            lfo: { rate: 0.06, depth: 150, target: 'filter' },
          },
        ],
      },
    },
  },

  // --- HEARTBEAT ---
  heartbeat: {
    default: {
      masterGain: 0.48,
      defaultRelease: 0.3,
      layers: [
        {
          kind: 'pulse-loop',
          interval: 0.85, // ~70 BPM
          attack: 0.05,
          release: 0.3,
          pulse: [
            {
              kind: 'tone',
              waveform: 'sine',
              frequency: 58,
              glideTo: 38,
              glideTime: 0.09,
              attack: 0.004,
              decay: 0.12,
              peak: 0.24,
            },
            {
              kind: 'tone',
              waveform: 'sine',
              frequency: 68,
              glideTo: 42,
              glideTime: 0.09,
              offset: 0.16,
              attack: 0.004,
              decay: 0.14,
              peak: 0.2,
            },
          ],
        },
      ],
    },
    variants: {
      calm: {
        masterGain: 0.44,
        defaultRelease: 0.35,
        layers: [
          {
            kind: 'pulse-loop',
            interval: 1.05, // ~57 BPM
            attack: 0.05,
            release: 0.35,
            pulse: [
              {
                kind: 'tone',
                waveform: 'sine',
                frequency: 52,
                glideTo: 34,
                glideTime: 0.1,
                attack: 0.005,
                decay: 0.14,
                peak: 0.2,
              },
              {
                kind: 'tone',
                waveform: 'sine',
                frequency: 60,
                glideTo: 38,
                glideTime: 0.1,
                offset: 0.18,
                attack: 0.005,
                decay: 0.16,
                peak: 0.16,
              },
            ],
          },
        ],
      },
      elevated: {
        masterGain: 0.52,
        defaultRelease: 0.25,
        layers: [
          {
            kind: 'pulse-loop',
            interval: 0.55, // ~109 BPM
            attack: 0.04,
            release: 0.25,
            pulse: [
              {
                kind: 'tone',
                waveform: 'sine',
                frequency: 64,
                glideTo: 42,
                glideTime: 0.08,
                attack: 0.003,
                decay: 0.1,
                peak: 0.26,
              },
              {
                kind: 'tone',
                waveform: 'sine',
                frequency: 74,
                glideTo: 46,
                glideTime: 0.08,
                offset: 0.13,
                attack: 0.003,
                decay: 0.11,
                peak: 0.22,
              },
            ],
          },
        ],
      },
    },
  },
}

export const CANONICAL_SOUND_NAMES: readonly CanonicalSoundName[] = [
  'tap',
  'type',
  'select',
  'toggle',
  'open',
  'close',
  'success',
  'error',
  'navigate',
  'notification',
] as const

export const EXPRESSIVE_SOUND_NAMES: readonly ExpressiveSoundName[] = [
  'bloom',
  'droplet',
  'chord',
  'lock',
  'laser',
  'ready',
  'scan',
  'arrival',
  'whoosh',
  'press',
  'release',
] as const

export const CONTINUOUS_SOUND_NAMES: readonly ContinuousSoundName[] = [
  'loading-hum',
  'radar-pulse',
  'beam-laser',
  'focus-noise',
  'alarm-beacon',
  'ticker-stream',
  'wind-ambient',
  'heartbeat',
] as const

export const ALL_SOUND_NAMES = [
  ...CANONICAL_SOUND_NAMES,
  ...EXPRESSIVE_SOUND_NAMES,
  ...CONTINUOUS_SOUND_NAMES,
] as readonly SoundName[]

/**
 * Semantic aliases mapping shorthand identifiers directly to their sound cues and variants.
 */
export const SOUND_ALIASES: Record<string, string> = {
  click: 'tap',
  button: 'tap',
  keypress: 'type',
  keystroke: 'type',
  dropdown: 'select',
  menu: 'select',
  expand: 'open',
  collapse: 'close',
  show: 'open',
  hide: 'close',
  done: 'success',
  ok: 'success',
  fail: 'error',
  alert: 'notification:urgent',
  warning: 'error',
  notify: 'notification',
  ping: 'notification',
  toast: 'notification',
  badge: 'notification:subtle',
  message: 'notification',
  route: 'navigate',
  page: 'navigate:page',
  slide: 'navigate:slide',
  swipe: 'navigate:swipe',
  chime: 'success:chime',
  sparkle: 'success:sparkle',
  harmonic: 'success:harmonic',
  switch: 'toggle:switch',
  tick: 'select:tick',
  pop: 'tap:pop',
  whisper: 'navigate:whisper',
  velvet: 'navigate:slide',
  feather: 'navigate:whisper',
  loop: 'loading-hum',
  hum: 'loading-hum',
  drone: 'loading-hum',
  radar: 'radar-pulse',
  sonar: 'radar-pulse:sonar',
  beam: 'beam-laser',
  laserbeam: 'beam-laser',
  noise: 'focus-noise',
  brownnoise: 'focus-noise',
  pinknoise: 'focus-noise:pink',
  whitenoise: 'focus-noise',
  alarm: 'alarm-beacon',
  beacon: 'alarm-beacon',
  siren: 'alarm-beacon',
  ticker: 'ticker-stream',
  streaming: 'ticker-stream',
  tokens: 'ticker-stream',
  wind: 'wind-ambient',
  ambient: 'wind-ambient',
  heart: 'heartbeat',
  scrolling: 'toggle',
  scroll: 'toggle',
  dragging: 'navigate',
  drag: 'navigate',
  pointer: 'wind-ambient',
  cursor: 'wind-ambient',
}

/**
 * Parses cue and variant from various string notations (e.g. "tap:mechanical", "tap.mechanical", "tap-mechanical").
 */
export function parseCueIdentifier(identifier: string): { cue: string; variant?: string } {
  const trimmed = identifier.trim()
  if (trimmed.includes(':')) {
    const [c, v] = trimmed.split(':')
    return { cue: c!, variant: v }
  }
  if (trimmed.includes('.')) {
    const [c, v] = trimmed.split('.')
    return { cue: c!, variant: v }
  }

  // Check hyphenated variant notation (e.g. tap-mechanical) if base cue exists
  for (const baseCue of ALL_SOUND_NAMES) {
    if (trimmed.startsWith(`${baseCue}-`) && trimmed.length > baseCue.length + 1) {
      const v = trimmed.slice(baseCue.length + 1)
      return { cue: baseCue, variant: v }
    }
  }

  return { cue: trimmed }
}

/**
 * Checks if a string is a recognized sound cue.
 */
export function isSoundCue(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const { cue } = parseCueIdentifier(value)
  const aliasResolved = SOUND_ALIASES[cue] ?? cue
  const { cue: canonicalCue } = parseCueIdentifier(aliasResolved)
  return SOUND_REGISTRY[canonicalCue] !== undefined || SOUND_REGISTRY[cue] !== undefined
}

/**
 * Resolves a sound recipe given a cue and optional variant.
 */
export function getSoundRecipe(
  identifier: string,
  explicitVariant?: string,
  customRegistry?: Record<string, SoundCueDefinition>
): SoundRecipe | undefined {
  const { cue: parsedCue, variant: parsedVariant } = parseCueIdentifier(identifier)
  const aliasResolved = SOUND_ALIASES[parsedCue] ?? parsedCue
  const { cue: canonicalCue, variant: aliasVariant } = parseCueIdentifier(aliasResolved)
  const variant = explicitVariant ?? parsedVariant ?? aliasVariant

  const registry = customRegistry ?? SOUND_REGISTRY
  const def = registry[canonicalCue] ?? SOUND_REGISTRY[canonicalCue]
  if (!def) return undefined

  if (variant && def.variants?.[variant]) {
    return def.variants[variant]
  }

  return def.default
}

/**
 * Returns available variant names for a given cue.
 */
export function getCueVariants(
  cue: string,
  customRegistry?: Record<string, SoundCueDefinition>
): string[] {
  const registry = customRegistry ?? SOUND_REGISTRY
  const { cue: parsedCue } = parseCueIdentifier(cue)
  const aliasResolved = SOUND_ALIASES[parsedCue] ?? parsedCue
  const { cue: canonicalCue } = parseCueIdentifier(aliasResolved)
  const def = registry[canonicalCue] ?? SOUND_REGISTRY[canonicalCue]
  if (!def || !def.variants) return []
  return Object.keys(def.variants)
}

/**
 * Returns all registered base cue names.
 */
export function getAllCues(): readonly string[] {
  return ALL_SOUND_NAMES
}

/* ==========================================================================
   Adaptive Context Transformation & Recipe Modifier
   ========================================================================== */

export function adaptRecipe(
  baseRecipe: SoundRecipe,
  emphasis: SoundEmphasis = 'normal',
  context?: AdaptiveSoundContext
): SoundRecipe {
  let gainMultiplier = 1.0
  let decayMultiplier = 1.0
  let shimmerMultiplier = 1.0

  if (emphasis === 'subtle') {
    gainMultiplier = 0.65
    decayMultiplier = 0.8
    shimmerMultiplier = 0.5
  } else if (emphasis === 'strong') {
    gainMultiplier = 1.35
    decayMultiplier = 1.2
    shimmerMultiplier = 1.3
  }

  if (context?.cadenceDeltaMs && context.cadenceDeltaMs < 120) {
    gainMultiplier *= Math.max(0.7, context.cadenceDeltaMs / 120)
    decayMultiplier *= 0.85
  }

  let freqMultiplier = 1.0
  let microDetune = 0

  if (context?.keyRole === 'backspace' || context?.keyRole === 'delete') {
    freqMultiplier = 0.82
  } else if (context?.keyRole === 'enter') {
    freqMultiplier = 1.18
  } else if (context?.keyRole === 'space') {
    freqMultiplier = 0.94
  } else if (context?.keyRole === 'printable') {
    microDetune = (Math.random() - 0.5) * 60
  }

  if (context?.direction === 'up' || context?.direction === 'forward') {
    freqMultiplier *= 1.12
  } else if (context?.direction === 'down' || context?.direction === 'backward') {
    freqMultiplier *= 0.88
  }

  if (context?.toggleState === 'off' || context?.toggleState === false) {
    freqMultiplier *= 0.85
  }

  const adaptedLayers = baseRecipe.layers.map((layer) => {
    if (layer.kind === 'tone') {
      return {
        ...layer,
        frequency: layer.frequency * freqMultiplier,
        detune: (layer.detune ?? 0) + microDetune,
        glideTo: layer.glideTo ? layer.glideTo * freqMultiplier : undefined,
        attack: Math.max(0.0005, layer.attack),
        decay: Math.max(0.005, layer.decay * decayMultiplier),
        peak: Math.min(1.0, layer.peak * gainMultiplier),
      }
    } else if (layer.kind === 'noise') {
      return {
        ...layer,
        filterFrequency: Math.max(100, Math.min(18000, layer.filterFrequency * freqMultiplier)),
        attack: Math.max(0.0005, layer.attack),
        decay: Math.max(0.005, layer.decay * decayMultiplier),
        peak: Math.min(1.0, layer.peak * gainMultiplier),
      }
    } else if (layer.kind === 'sustained-tone') {
      return {
        ...layer,
        frequency: layer.frequency * freqMultiplier,
        detune: (layer.detune ?? 0) + microDetune,
        glideTo: layer.glideTo ? layer.glideTo * freqMultiplier : undefined,
        sustain: Math.min(1.0, layer.sustain * gainMultiplier),
      }
    } else if (layer.kind === 'sustained-noise') {
      return {
        ...layer,
        filterFrequency: Math.max(100, Math.min(18000, layer.filterFrequency * freqMultiplier)),
        sustain: Math.min(1.0, layer.sustain * gainMultiplier),
      }
    } else if (layer.kind === 'pulse-loop') {
      return {
        ...layer,
      }
    }
    return layer
  })

  let adaptedShimmer: Shimmer | undefined = undefined
  if (baseRecipe.shimmer) {
    adaptedShimmer = {
      ...baseRecipe.shimmer,
      wet: Math.min(0.9, baseRecipe.shimmer.wet * shimmerMultiplier),
      feedback: Math.min(0.85, baseRecipe.shimmer.feedback * (emphasis === 'subtle' ? 0.7 : 1.0)),
    }
  }

  return {
    ...baseRecipe,
    masterGain: baseRecipe.masterGain * gainMultiplier,
    layers: adaptedLayers,
    shimmer: adaptedShimmer,
  }
}
