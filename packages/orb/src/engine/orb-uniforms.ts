import { type OrbParams, styleFlowIndexes } from "./presets";

export const orbUniformFloatCount = 120;
export const orbColorOffset = 24;
export const orbCanvasColorOffset = orbColorOffset + 10 * 4;

const paletteStops = [
  "#F7FBFF",
  "#EFF6FD",
  "#E0EEF9",
  "#D4E6F7",
  "#BBD5F3",
  "#A6C7F0",
  "#87B0EB",
  "#6F9EE8",
  "#6F9EE8",
  "#6F9EE8",
  "#6F9EE8",
  "#6F9EE8",
] as const;

function rgb(hex: string): [number, number, number, number] {
  if (!hex || typeof hex !== 'string') return [0, 0, 0, 1];
  const value = hex.startsWith('#') ? hex.slice(1) : hex;

  if (value.length >= 8) {
    return [
      (Number.parseInt(value.slice(0, 2), 16) || 0) / 255,
      (Number.parseInt(value.slice(2, 4), 16) || 0) / 255,
      (Number.parseInt(value.slice(4, 6), 16) || 0) / 255,
      (Number.parseInt(value.slice(6, 8), 16) || 0) / 255,
    ];
  }
  if (value.length >= 6) {
    return [
      (Number.parseInt(value.slice(0, 2), 16) || 0) / 255,
      (Number.parseInt(value.slice(2, 4), 16) || 0) / 255,
      (Number.parseInt(value.slice(4, 6), 16) || 0) / 255,
      1,
    ];
  }
  if (value.length >= 3) {
    const r = value.charAt(0) || '0';
    const g = value.charAt(1) || '0';
    const b = value.charAt(2) || '0';
    return [
      (Number.parseInt(r + r, 16) || 0) / 255,
      (Number.parseInt(g + g, 16) || 0) / 255,
      (Number.parseInt(b + b, 16) || 0) / 255,
      1,
    ];
  }
  return [0, 0, 0, 1];
}

export function writeOrbUniforms(
  target: Float32Array,
  width: number,
  height: number,
  time: number,
  params: OrbParams,
): void {
  target.fill(0);
  target[0] = width;
  target[1] = height;
  target[2] = time;

  target.set(
    [
      params.speed,
      params.radius,
      params.zoom,
      params.warp,
      params.ridgeAmt,
      params.sharp,
      params.shade,
      params.sheen,
      params.gloss,
      params.shellMidAlpha,
      params.shellEdgeAlpha,
      params.exposure,
      styleFlowIndexes[params.style],
      params.edgeSoftness,
      params.edgeGlow,
      0,
      params.glassEnabled ? 1 : 0,
      params.glassOpacity,
      params.contourDeform,
    ],
    3,
  );

  const colors = [
    params.colorA,
    params.colorB,
    params.colorC,
    params.colorD,
    params.highlightColor,
    params.shellInner,
    params.shellMid,
    params.shellEdge,
    params.sheenColor,
    params.specColor,
    params.canvasColor,
    params.glowColor,
    ...paletteStops,
  ];
  colors.forEach((hex, index) => target.set(rgb(hex), orbColorOffset + index * 4));
}

export function createOrbUniformSnapshot(params: OrbParams): number[] {
  const values = new Float32Array(orbUniformFloatCount);
  writeOrbUniforms(values, 1, 1, 0, params);
  return Array.from(values);
}
