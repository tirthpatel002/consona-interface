import { type OrbParams, stylePresets, type StyleName } from "./presets";

export const orbStateNames = ["idle", "thinking"] as const;
export type OrbStateName = (typeof orbStateNames)[number];

export const orbStateNumericKeys = [
  "speed",
  "contourDeform",
  "zoom",
  "warp",
  "ridgeAmt",
  "sharp",
  "shade",
  "exposure",
  "edgeGlow",
] as const;

export const orbStateColorKeys = [
  "colorA",
  "colorB",
  "colorC",
  "colorD",
  "highlightColor",
  "glowColor",
] as const;

export const orbStateProfileKeys = [
  ...orbStateNumericKeys,
  ...orbStateColorKeys,
] as const;

export type OrbStateNumericKey = (typeof orbStateNumericKeys)[number];
export type OrbStateColorKey = (typeof orbStateColorKeys)[number];
export type OrbStateProfileKey = (typeof orbStateProfileKeys)[number];
export type OrbStateProfile = Pick<OrbParams, OrbStateProfileKey>;
export type OrbSharedParams = Omit<OrbParams, OrbStateProfileKey>;

export type OrbStateConfiguration = {
  shared: OrbSharedParams;
  profiles: Record<OrbStateName, OrbStateProfile>;
  activationDuration: number;
  transitionDuration: number;
};

export type OrbRenderTarget = {
  state: OrbStateName;
  params: OrbParams;
  activationDuration: number;
  transitionDuration: number;
};

export const defaultOrbState: OrbStateName = "thinking";
export const defaultOrbActivationDuration = 0.55;
export const defaultOrbTransitionDuration = 0.85;

type NumericTransform = {
  scale: number;
  offset?: number;
};

type IdleTransforms = Partial<Record<OrbStateNumericKey, NumericTransform>>;

type IdleStyleProfile = {
  numeric: IdleTransforms;
  /** Partial: any omitted key falls back to the preset's own color. */
  colors?: Partial<Record<OrbStateColorKey, string>>;
};

const idleProfilesByStyle: Record<StyleName, IdleStyleProfile> = {
  siri: {
    numeric: {
      speed: { scale: 0.3 },
      contourDeform: { scale: 0.3 },
      zoom: { scale: 0.94 },
      warp: { scale: 0.52 },
      ridgeAmt: { scale: 0.48 },
      sharp: { scale: 0.9 },
      exposure: { scale: 0.68 },
    },
    colors: {
      colorA: "#B5A674", colorB: "#5E8794", colorC: "#9A648A",
      colorD: "#635B8A", highlightColor: "#B6C4D2", glowColor: "#6C688F",
    },
  },
  voiceWave: {
    numeric: {
      speed: { scale: 0.28 },
      contourDeform: { scale: 0.3 },
      zoom: { scale: 0.92 },
      warp: { scale: 0.46 },
      ridgeAmt: { scale: 0.42 },
      exposure: { scale: 0.62 },
    },
    colors: {
      colorA: "#08050B", colorB: "#6A2F69", colorC: "#8C4652",
      colorD: "#55467F", highlightColor: "#B58AA5", glowColor: "#6C3E72",
    },
  },
  blueDrop: {
    numeric: {
      speed: { scale: 0.3 },
      contourDeform: { scale: 0.35 },
      zoom: { scale: 0.93 },
      warp: { scale: 0.5 },
      ridgeAmt: { scale: 0.46 },
      sharp: { scale: 0.82 },
      exposure: { scale: 0.66 },
    },
    colors: {
      colorA: "#020812", colorB: "#0A2C5A", colorC: "#24678A",
      colorD: "#A4C3CA", highlightColor: "#9FC8D5", glowColor: "#1F5076",
    },
  },
  violetEmber: {
    numeric: {
      speed: { scale: 0.28 },
      contourDeform: { scale: 0.3 },
      zoom: { scale: 0.92 },
      warp: { scale: 0.46 },
      ridgeAmt: { scale: 0.42 },
      sharp: { scale: 0.78 },
      exposure: { scale: 0.64 },
    },
    colors: {
      colorA: "#0B0310", colorB: "#2B1748", colorC: "#593078",
      colorD: "#9B78A8", highlightColor: "#BCA6C2", glowColor: "#593273",
    },
  },
  refractiveBlob: {
    numeric: {
      speed: { scale: 0.3 },
      contourDeform: { scale: 0.32 },
      zoom: { scale: 0.94 },
      warp: { scale: 0.5 },
      ridgeAmt: { scale: 0.44 },
      sharp: { scale: 0.82 },
      exposure: { scale: 0.68 },
    },
    colors: {
      colorA: "#0F0B16", colorB: "#403552", colorC: "#776990",
      colorD: "#AEA4BD", highlightColor: "#C9C4D1", glowColor: "#6E6185",
    },
  },
  amber: {
    numeric: {
      speed: { scale: 0.28 },
      contourDeform: { scale: 0.3 },
      zoom: { scale: 0.9 },
      warp: { scale: 0.5 },
      ridgeAmt: { scale: 0.48 },
      sharp: { scale: 0.8 },
      exposure: { scale: 0.7 },
    },
    colors: {
      colorA: "#1A0300", colorB: "#3D1800", colorC: "#6B2C00",
      colorD: "#9E5200", highlightColor: "#C4885A", glowColor: "#5C1060",
    },
  },
  aurora: {
    numeric: {
      speed: { scale: 0.22 },
      contourDeform: { scale: 0.3 },
      zoom: { scale: 0.92 },
      warp: { scale: 0.42 },
      ridgeAmt: { scale: 0.38 },
      sharp: { scale: 0.85 },
      exposure: { scale: 0.62 },
    },
    colors: {
      colorA: "#02050C", colorB: "#1D6659", colorC: "#285D78",
      colorD: "#533E75", highlightColor: "#92B6B3", glowColor: "#286A62",
    },
  },
  frost: {
    numeric: {
      speed: { scale: 0.26 },
      contourDeform: { scale: 0.28 },
      zoom: { scale: 0.94 },
      warp: { scale: 0.5 },
      ridgeAmt: { scale: 0.46 },
      sharp: { scale: 0.78 },
      exposure: { scale: 0.72 },
    },
    colors: {
      colorA: "#C3CDD5", colorB: "#9AABB8", colorC: "#768D9E",
      colorD: "#536985", highlightColor: "#D6DEE5", glowColor: "#697D91",
    },
  },
  chrome: {
    numeric: {
      speed: { scale: 0.28 },
      contourDeform: { scale: 0.35 },
      zoom: { scale: 0.92 },
      warp: { scale: 0.48 },
      sharp: { scale: 0.74 },
      exposure: { scale: 0.72 },
    },
    colors: {
      colorA: "#8E88B8", colorB: "#28309C", colorC: "#000000",
      colorD: "#3B5EB3", highlightColor: "#D6DEE5", glowColor: "#A29DCF",
    },
  },
  gold: {
    numeric: {
      speed: { scale: 0.28 },
      contourDeform: { scale: 0.35 },
      zoom: { scale: 0.92 },
      warp: { scale: 0.48 },
      sharp: { scale: 0.74 },
      exposure: { scale: 0.72 },
    },
  },
  champagneGold: {
    numeric: {
      speed: { scale: 0.28 },
      contourDeform: { scale: 0.35 },
      zoom: { scale: 0.92 },
      warp: { scale: 0.48 },
      sharp: { scale: 0.74 },
      exposure: { scale: 0.72 },
    },
  },
  roseGold: {
    numeric: {
      speed: { scale: 0.28 },
      contourDeform: { scale: 0.35 },
      zoom: { scale: 0.92 },
      warp: { scale: 0.48 },
      sharp: { scale: 0.74 },
      exposure: { scale: 0.72 },
    },
  },
  emerald: {
    numeric: {
      speed: { scale: 0.28 },
      contourDeform: { scale: 0.35 },
      zoom: { scale: 0.92 },
      warp: { scale: 0.48 },
      sharp: { scale: 0.74 },
      exposure: { scale: 0.72 },
    },
  },
  blueFlame: {
    numeric: {
      speed: { scale: 0.3 },
      contourDeform: { scale: 0.32 },
      zoom: { scale: 0.94 },
      warp: { scale: 0.5 },
      ridgeAmt: { scale: 0.44 },
      sharp: { scale: 0.82 },
      exposure: { scale: 0.68 },
    },
  },
  plasma: {
    numeric: {
      speed: { scale: 0.26 },
      contourDeform: { scale: 0.28 },
      zoom: { scale: 0.9 },
      warp: { scale: 0.42 },
      ridgeAmt: { scale: 0.36 },
      sharp: { scale: 0.68 },
      exposure: { scale: 0.6 },
    },
    colors: {
      colorA: "#04020A", colorB: "#084772", colorC: "#1C5790",
      colorD: "#174B84", highlightColor: "#A5BBD0", glowColor: "#14577F",
    },
  },
};

const orbStateProfileKeySet = new Set<keyof OrbParams>(orbStateProfileKeys);

export function isOrbStateProfileKey(key: keyof OrbParams): key is OrbStateProfileKey {
  return orbStateProfileKeySet.has(key);
}

export function splitOrbParams(params: OrbParams): {
  shared: OrbSharedParams;
  profile: OrbStateProfile;
} {
  const profile = Object.fromEntries(
    orbStateProfileKeys.map((key) => [key, params[key]]),
  ) as OrbStateProfile;
  const shared = { ...params } as Partial<OrbParams>;
  for (const key of orbStateProfileKeys) delete shared[key];

  return {
    shared: shared as OrbSharedParams,
    profile,
  };
}

function createIdleParams(thinkingParams: OrbParams): OrbParams {
  const idleParams = { ...thinkingParams };
  const profile = idleProfilesByStyle[thinkingParams.style];
  const preset = stylePresets[thinkingParams.style];

  for (const [key, transform] of Object.entries(profile.numeric) as Array<
    [OrbStateNumericKey, NumericTransform]
  >) {
    idleParams[key] = thinkingParams[key] * transform.scale + (transform.offset ?? 0);
  }
  // Single source of truth: unspecified color overrides fall back to the
  // preset's own colors (already present on thinkingParams).
  for (const key of orbStateColorKeys) {
    idleParams[key] = profile.colors?.[key] ?? preset[key];
  }

  return idleParams;
}

export function createOrbStateConfiguration(
  thinkingParams: OrbParams,
  transitionDuration = defaultOrbTransitionDuration,
  activationDuration = defaultOrbActivationDuration,
): OrbStateConfiguration {
  if (!Number.isFinite(transitionDuration) || transitionDuration < 0) {
    throw new RangeError(`Invalid orb transition duration: ${transitionDuration}`);
  }
  if (!Number.isFinite(activationDuration) || activationDuration < 0) {
    throw new RangeError(`Invalid orb activation duration: ${activationDuration}`);
  }

  const thinking = splitOrbParams(thinkingParams);
  const idle = splitOrbParams(createIdleParams(thinkingParams));

  return {
    activationDuration,
    shared: thinking.shared,
    profiles: {
      idle: idle.profile,
      thinking: thinking.profile,
    },
    transitionDuration,
  };
}

export function createPresetOrbStateConfiguration(style: StyleName): OrbStateConfiguration {
  return createOrbStateConfiguration({ style, ...stylePresets[style] });
}

export function resolveOrbStateParams(
  configuration: OrbStateConfiguration,
  state: OrbStateName,
): OrbParams {
  return {
    ...configuration.shared,
    ...configuration.profiles[state],
  };
}

export function updateOrbStateParam<Key extends keyof OrbParams>(
  configuration: OrbStateConfiguration,
  state: OrbStateName,
  key: Key,
  value: OrbParams[Key],
): OrbStateConfiguration {
  if (isOrbStateProfileKey(key)) {
    return {
      ...configuration,
      profiles: {
        ...configuration.profiles,
        [state]: {
          ...configuration.profiles[state],
          [key]: value,
        },
      },
    };
  }

  return {
    ...configuration,
    shared: {
      ...configuration.shared,
      [key]: value,
    },
  };
}

function parseHexColor(hex: string): [number, number, number] {
  if (!hex || typeof hex !== 'string') return [0, 0, 0];
  const clean = hex.startsWith('#') ? hex.slice(1) : hex;
  if (clean.length >= 6) {
    return [
      (Number.parseInt(clean.slice(0, 2), 16) || 0) / 255,
      (Number.parseInt(clean.slice(2, 4), 16) || 0) / 255,
      (Number.parseInt(clean.slice(4, 6), 16) || 0) / 255,
    ];
  }
  if (clean.length >= 3) {
    const r = clean.charAt(0) || '0';
    const g = clean.charAt(1) || '0';
    const b = clean.charAt(2) || '0';
    return [
      (Number.parseInt(r + r, 16) || 0) / 255,
      (Number.parseInt(g + g, 16) || 0) / 255,
      (Number.parseInt(b + b, 16) || 0) / 255,
    ];
  }
  return [0, 0, 0];
}

function srgbToLinear(value: number): number {
  return value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(value: number): number {
  return value <= 0.0031308
    ? value * 12.92
    : 1.055 * value ** (1 / 2.4) - 0.055;
}

function mixHexColor(from: string, to: string, progress: number): string {
  if (progress === 0) return from;
  if (progress === 1) return to;

  const fromRgb = parseHexColor(from);
  const toRgb = parseHexColor(to);
  const mixed = fromRgb.map((channel, index) => {
    const targetChannel = toRgb[index] ?? channel;
    const linear = srgbToLinear(channel)
      + (srgbToLinear(targetChannel) - srgbToLinear(channel)) * progress;
    return Math.min(255, Math.max(0, Math.round(linearToSrgb(linear) * 255)));
  });

  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

export function smoothOrbTransitionProgress(progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress));
  // Quintic smootherstep with zero 1st and 2nd derivatives at endpoints for ultra-soft easing
  return clamped * clamped * clamped * (clamped * (clamped * 6 - 15) + 10);
}

export function activeOrbTransitionProgress(progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress));
  // Smooth ease-in-out S-curve for organic blooming into active state
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

export function interpolateOrbParams(
  from: OrbParams,
  to: OrbParams,
  progress: number,
): OrbParams {
  const clamped = Math.min(1, Math.max(0, progress));
  if (clamped === 0) return { ...from };
  if (clamped === 1) return { ...to };

  const result = { ...to };
  for (const key of orbStateNumericKeys) {
    result[key] = from[key] + (to[key] - from[key]) * clamped;
  }
  for (const key of orbStateColorKeys) {
    result[key] = mixHexColor(from[key], to[key], clamped);
  }
  return result;
}

export function createOrbTransitionController(initialTarget: OrbRenderTarget): {
  sample: (target: OrbRenderTarget, nowMs: number) => OrbParams;
} {
  let state = initialTarget.state;
  let fromParams = { ...initialTarget.params };
  let targetParams = { ...initialTarget.params };
  let targetState = initialTarget.state;
  let startedAtMs = 0;
  let durationMs = 0;

  function currentParams(nowMs: number): OrbParams {
    if (durationMs === 0) return { ...targetParams };
    const elapsed = Math.max(0, nowMs - startedAtMs);
    const rawProgress = elapsed / durationMs;
    const progress = targetState === "thinking"
      ? activeOrbTransitionProgress(rawProgress)
      : smoothOrbTransitionProgress(rawProgress);
    return interpolateOrbParams(fromParams, targetParams, progress);
  }

  return {
    sample(nextTarget, nowMs) {
      if (nextTarget.state !== state) {
        const current = currentParams(nowMs);
        fromParams = current;
        targetParams = { ...nextTarget.params };
        targetState = nextTarget.state;
        startedAtMs = nowMs;
        durationMs = Math.max(
          0,
          (nextTarget.state === "thinking"
            ? nextTarget.activationDuration
            : nextTarget.transitionDuration) * 1000,
        );
        state = nextTarget.state;
      } else {
        targetParams = { ...nextTarget.params };
      }

      return currentParams(nowMs);
    },
  };
}
