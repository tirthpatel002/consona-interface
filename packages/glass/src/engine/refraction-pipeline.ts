import { SURFACE_FUNCTION_INDEX, type GlassDefaults } from './defaults'
import type { SurfaceFunctionName } from './types'

/**
 * Converts a hex (#ffffff, #000) or rgb/rgba color string to an 'r, g, b' triplet string.
 */
export function hexToRgbString(hex: string): string {
  if (!hex || typeof hex !== 'string') return '255, 255, 255'
  const trimmed = hex.trim()
  if (trimmed.startsWith('rgb')) {
    const match = trimmed.match(/\(([^)]+)\)/)
    if (match && match[1]) {
      const parts = match[1].split(',').map((p) => parseFloat(p.trim()))
      const r = isNaN(parts[0]!) ? 255 : Math.round(parts[0]!)
      const g = isNaN(parts[1]!) ? 255 : Math.round(parts[1]!)
      const b = isNaN(parts[2]!) ? 255 : Math.round(parts[2]!)
      return `${r}, ${g}, ${b}`
    }
  }

  let clean = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (clean.length < 6) return '255, 255, 255'

  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)

  return `${isNaN(r) ? 255 : r}, ${isNaN(g) ? 255 : g}, ${isNaN(b) ? 255 : b}`
}

export interface SvgFilterParams {
  dispScale: number
  turbFreq: number
  satVal: number
  blurVal: number
  surfaceScale: number
  specularConstant: number
  alphaBlur: number
  /** Profile-driven turbulence octave / displacement bias. */
  octaveBias: number
}

/** Map surface profile → SVG filter tuning (shared by the component JSX filter). */
export function computeSvgFilterParams(options: {
  thickness: number
  bezelWidth: number
  refractiveIndex: number
  scaleRatio: number
  blur: number
  specularOpacity: number
  specularSaturation: number
  surfaceFunction?: SurfaceFunctionName
}): SvgFilterParams {
  const {
    thickness,
    bezelWidth,
    refractiveIndex,
    scaleRatio,
    blur,
    specularOpacity,
    specularSaturation,
    surfaceFunction = 'convex_squircle',
  } = options

  const profileBias =
    surfaceFunction === 'concave'
      ? 0.72
      : surfaceFunction === 'lip'
        ? 1.15
        : surfaceFunction === 'convex_circle'
          ? 0.9
          : 1.0

  return {
    dispScale: Math.max(0.5, (refractiveIndex - 1.0) * (thickness / 6) * scaleRatio * profileBias),
    turbFreq: Math.max(0.003, 0.02 / Math.max(1, bezelWidth / 20)),
    satVal: Math.max(1.0, 1.0 + specularSaturation * 0.25),
    blurVal: Math.max(0.1, blur),
    surfaceScale: Math.max(1.0, (thickness / 15) * Math.max(0.2, specularOpacity) * profileBias),
    specularConstant: specularOpacity * 2.2 * (surfaceFunction === 'lip' ? 1.1 : 1),
    alphaBlur: Math.max(1, bezelWidth * 0.08),
    octaveBias: surfaceFunction === 'lip' ? 3 : 2,
  }
}

// ---------------------------------------------------------------------------
// WebGL refraction pipeline
// ---------------------------------------------------------------------------

const GL_VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = (aPosition + 1.0) * 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`.trim()

const GL_FRAGMENT_SHADER = `
precision highp float;
varying vec2 vUv;

uniform vec2 uResolution;
uniform float uRadius;
uniform float uBezel;
uniform float uThickness;
uniform float uIOR;
uniform float uBlur;
uniform float uSpecular;
uniform float uTint;
uniform vec3 uTintColor;
uniform sampler2D uBgTex;
uniform float uBgAspect;
uniform int uHasBg;
uniform int uSurface;

float sdRoundedRect(vec2 p, vec2 halfSize, float r) {
  vec2 q = abs(p) - halfSize + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

float surfaceHeight(float t, int profile) {
  float s = 1.0 - t;
  if (profile == 1) {
    return sqrt(max(0.0, 1.0 - s * s));
  }
  if (profile == 2) {
    return 1.0 - sqrt(max(0.0, 1.0 - s * s));
  }
  if (profile == 3) {
    float convex = pow(1.0 - s*s*s*s, 0.25);
    float concave = 1.0 - sqrt(max(0.0, 1.0 - s * s)) + 0.1;
    float blend = t * t * (3.0 - 2.0 * t);
    return mix(convex, concave, blend);
  }
  return pow(1.0 - s*s*s*s, 0.25);
}

vec3 sampleBg(vec2 screenUV) {
  if (uHasBg == 0) {
    return vec3(0.08, 0.08, 0.1);
  }
  float screenAspect = uResolution.x / uResolution.y;
  vec2 uv = screenUV;
  if (uBgAspect > screenAspect) {
    float s = screenAspect / uBgAspect;
    uv.x = uv.x * s + (1.0 - s) * 0.5;
  } else {
    float s = uBgAspect / screenAspect;
    uv.y = uv.y * s + (1.0 - s) * 0.5;
  }
  uv.y = 1.0 - uv.y;
  return texture2D(uBgTex, clamp(uv, 0.0, 1.0)).rgb;
}

vec3 sampleBgBlurred(vec2 uv, float radius) {
  if (radius < 0.5 || uHasBg == 0) return sampleBg(uv);
  vec3 sum = vec3(0.0);
  vec2 px = 1.0 / uResolution;
  // Compact 8-tap disc (deterministic, not a third-party fingerprint kernel)
  sum += sampleBg(uv + vec2(-0.85, -0.35) * radius * px);
  sum += sampleBg(uv + vec2( 0.90, -0.55) * radius * px);
  sum += sampleBg(uv + vec2(-0.15, -0.95) * radius * px);
  sum += sampleBg(uv + vec2( 0.40,  0.35) * radius * px);
  sum += sampleBg(uv + vec2(-0.75,  0.55) * radius * px);
  sum += sampleBg(uv + vec2( 0.70,  0.65) * radius * px);
  sum += sampleBg(uv + vec2( 0.05,  0.90) * radius * px);
  sum += sampleBg(uv + vec2(-0.55,  0.10) * radius * px);
  return sum / 8.0;
}

void main() {
  vec2 screenPx = vec2(vUv.x, 1.0 - vUv.y) * uResolution;
  vec2 halfSize = uResolution * 0.5;
  vec2 p = screenPx - halfSize;

  float maxR = min(halfSize.x, halfSize.y);
  float r = clamp(uRadius, 0.0, maxR);

  float sd = sdRoundedRect(p, halfSize, r);
  if (sd > 0.0) {
    discard;
  }

  float distFromEdge = -sd;
  float maxBezel = max(r - 1.0, 1.0);
  float bezel = clamp(uBezel, 1.0, maxBezel);
  float t = clamp(distFromEdge / max(bezel, 1.0), 0.0, 1.0);

  float h = surfaceHeight(t, uSurface);
  float dt = 0.001;
  float h2 = surfaceHeight(min(t + dt, 1.0), uSurface);
  float dh = (h2 - h) / dt;

  float slopeAngle = atan(dh * (uThickness / max(bezel, 1.0)));
  float sinR = sin(slopeAngle) / max(uIOR, 1.0);
  sinR = clamp(sinR, -1.0, 1.0);
  float thetaR = asin(sinR);
  float displacement = h * uThickness * (tan(slopeAngle) - tan(thetaR));

  vec2 grad;
  float eps = 0.5;
  grad.x = sdRoundedRect(p + vec2(eps, 0.0), halfSize, r) - sd;
  grad.y = sdRoundedRect(p + vec2(0.0, eps), halfSize, r) - sd;
  float gradLen = length(grad);
  grad = gradLen > 0.0001 ? grad / gradLen : vec2(0.0);

  vec2 offset = -grad * (displacement / uResolution.y);

  vec2 uv = vec2(vUv.x, 1.0 - vUv.y) + offset;
  vec3 color = sampleBgBlurred(uv, uBlur);

  vec2 lightDir = normalize(vec2(0.5, -0.7));
  float rimDot = abs(dot(grad, lightDir));
  float rimFalloff = 1.0 - smoothstep(0.0, bezel * 0.4, distFromEdge);
  float specHighlight = pow(rimDot * rimFalloff, 1.5);
  color += vec3(specHighlight * uSpecular);

  float innerShadow = 1.0 - smoothstep(0.0, bezel * 0.6, distFromEdge);
  color *= mix(1.0, 0.7, innerShadow * 0.3);

  float innerRim = smoothstep(0.0, 2.0, distFromEdge) * (1.0 - smoothstep(2.0, 5.0, distFromEdge));
  color += vec3(innerRim * 0.15 * uSpecular);

  color = mix(color, uTintColor, uTint);

  float alpha = smoothstep(0.0, 1.5, distFromEdge);
  gl_FragColor = vec4(color, alpha);
}
`.trim()

export interface WebGLGlassParams {
  radius: number
  bezel: number
  thickness: number
  ior: number
  blur: number
  specular: number
  tint: number
  tintColor?: string
  backgroundUrl?: string
  surfaceFunction?: SurfaceFunctionName
  scaleRatio?: number
  specularSaturation?: number
  shadowBlur?: number
  shadowSpread?: number
}

export interface WebGLGlassOptions {
  canvas: HTMLCanvasElement
  getParams: () => WebGLGlassParams
  onReady?: () => void
  onError?: (err: Error) => void
}

/**
 * Creates a WebGL refraction pipeline. Redraws on param/size change and when
 * visible; pauses when the tab is hidden or `prefers-reduced-motion` is set.
 */
export function createGlassWebGLRenderer(options: WebGLGlassOptions): () => void {
  const { canvas, getParams, onReady, onError } = options

  const glCtx = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false })
  if (!glCtx) {
    onError?.(new Error('WebGL is not supported by this browser.'))
    return () => {}
  }
  const gl: WebGLRenderingContext = glCtx

  let vs: WebGLShader | null = null
  let fs: WebGLShader | null = null
  let program: WebGLProgram | null = null
  let posBuffer: WebGLBuffer | null = null
  let bgTexture: WebGLTexture | null = null

  function disposeGl(): void {
    if (!gl) return
    if (posBuffer) gl.deleteBuffer(posBuffer)
    if (bgTexture) gl.deleteTexture(bgTexture)
    if (program) gl.deleteProgram(program)
    if (vs) gl.deleteShader(vs)
    if (fs) gl.deleteShader(fs)
    posBuffer = null
    bgTexture = null
    program = null
    vs = null
    fs = null
  }

  function compileShader(type: number, src: string): WebGLShader | null {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, src)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader)
      gl.deleteShader(shader)
      onError?.(new Error(`WebGL shader compile failed: ${info}`))
      return null
    }
    return shader
  }

  vs = compileShader(gl.VERTEX_SHADER, GL_VERTEX_SHADER)
  fs = compileShader(gl.FRAGMENT_SHADER, GL_FRAGMENT_SHADER)
  if (!vs || !fs) {
    disposeGl()
    return () => {}
  }

  program = gl.createProgram()
  if (!program) {
    disposeGl()
    return () => {}
  }
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program)
    onError?.(new Error(`WebGL program linking failed: ${info}`))
    disposeGl()
    return () => {}
  }

  gl.useProgram(program)

  const positionLocation = gl.getAttribLocation(program, 'aPosition')
  posBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  )
  gl.enableVertexAttribArray(positionLocation)
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

  const uResolution = gl.getUniformLocation(program, 'uResolution')
  const uRadius = gl.getUniformLocation(program, 'uRadius')
  const uBezel = gl.getUniformLocation(program, 'uBezel')
  const uThickness = gl.getUniformLocation(program, 'uThickness')
  const uIOR = gl.getUniformLocation(program, 'uIOR')
  const uBlur = gl.getUniformLocation(program, 'uBlur')
  const uSpecular = gl.getUniformLocation(program, 'uSpecular')
  const uTint = gl.getUniformLocation(program, 'uTint')
  const uTintColor = gl.getUniformLocation(program, 'uTintColor')
  const uBgTex = gl.getUniformLocation(program, 'uBgTex')
  const uBgAspect = gl.getUniformLocation(program, 'uBgAspect')
  const uHasBg = gl.getUniformLocation(program, 'uHasBg')
  const uSurface = gl.getUniformLocation(program, 'uSurface')

  bgTexture = gl.createTexture()
  let currentBgUrl = ''
  let bgAspect = 1.5
  let hasBg = 0
  let loadGeneration = 0
  let isDisposed = false
  let needsRedraw = true
  let lastParamKey = ''
  let readyFired = false

  const prefersReduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function loadBackground(url: string) {
    if (!gl || !url) {
      hasBg = 0
      currentBgUrl = ''
      needsRedraw = true
      return
    }
    if (url === currentBgUrl) return
    currentBgUrl = url
    const gen = ++loadGeneration
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (isDisposed || !gl || gen !== loadGeneration) return
      bgAspect = img.width / Math.max(1, img.height)
      hasBg = 1
      gl.bindTexture(gl.TEXTURE_2D, bgTexture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      needsRedraw = true
    }
    img.onerror = () => {
      if (isDisposed || gen !== loadGeneration) return
      hasBg = 0
      currentBgUrl = ''
      needsRedraw = true
      onError?.(new Error('Failed to load glass background image.'))
    }
    img.src = url
  }

  function onContextLost(e: Event) {
    e.preventDefault()
    onError?.(new Error('WebGL context lost.'))
  }
  canvas.addEventListener('webglcontextlost', onContextLost)

  function onVisibility() {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      needsRedraw = true
    }
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibility)
  }

  function paramKey(p: WebGLGlassParams): string {
    return [
      p.radius,
      p.bezel,
      p.thickness,
      p.ior,
      p.blur,
      p.specular,
      p.tint,
      p.tintColor,
      p.backgroundUrl,
      p.surfaceFunction,
      p.scaleRatio,
      canvas.clientWidth,
      canvas.clientHeight,
    ].join('|')
  }

  function drawFrame() {
    if (isDisposed || !gl || !program) return

    const hidden =
      typeof document !== 'undefined' && document.visibilityState === 'hidden'
    if (hidden) return

    const dpr = window.devicePixelRatio || 1
    const displayWidth = Math.max(2, Math.round(canvas.clientWidth * dpr))
    const displayHeight = Math.max(2, Math.round(canvas.clientHeight * dpr))

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth
      canvas.height = displayHeight
      gl.viewport(0, 0, displayWidth, displayHeight)
      needsRedraw = true
    }

    const params = getParams()
    const key = paramKey(params)
    if (key !== lastParamKey) {
      lastParamKey = key
      needsRedraw = true
    }

    const nextUrl = params.backgroundUrl?.trim() || ''
    if (nextUrl !== currentBgUrl) {
      loadBackground(nextUrl)
    }

    if (!needsRedraw && prefersReduced) return
    if (!needsRedraw) {
      // Still schedule while animating blur only if continuous motion wanted —
      // glass surface is static for a given param set, so stop the loop.
      return
    }
    needsRedraw = false

    gl.useProgram(program)
    gl.uniform2f(uResolution, canvas.width, canvas.height)
    gl.uniform1f(uRadius, params.radius * dpr)
    gl.uniform1f(uBezel, params.bezel * dpr)
    const thicknessScale = Math.max(0.25, params.scaleRatio ?? 1)
    gl.uniform1f(uThickness, params.thickness * thicknessScale)
    gl.uniform1f(uIOR, params.ior)
    gl.uniform1f(uBlur, params.blur)
    gl.uniform1f(uSpecular, params.specular)
    gl.uniform1f(uTint, params.tint)

    const [r, g, b] = (params.tintColor ? hexToRgbString(params.tintColor) : '255, 255, 255')
      .split(',')
      .map((s) => parseFloat(s.trim()) / 255)
    gl.uniform3f(uTintColor, isNaN(r!) ? 1 : r!, isNaN(g!) ? 1 : g!, isNaN(b!) ? 1 : b!)

    gl.uniform1f(uBgAspect, bgAspect)
    gl.uniform1i(uHasBg, hasBg)
    gl.uniform1i(
      uSurface,
      SURFACE_FUNCTION_INDEX[params.surfaceFunction ?? 'convex_squircle'] ?? 0
    )

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, bgTexture)
    gl.uniform1i(uBgTex, 0)

    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    if (!readyFired) {
      readyFired = true
      onReady?.()
    }
  }

  let rafId = 0
  let lastTick = 0
  const tickMs = prefersReduced ? 200 : 33

  function loop(now: number) {
    if (isDisposed) return
    rafId = requestAnimationFrame(loop)
    if (now - lastTick < tickMs && !needsRedraw) return
    lastTick = now
    drawFrame()
  }
  rafId = requestAnimationFrame(loop)

  const ro =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          needsRedraw = true
        })
      : null
  ro?.observe(canvas)

  return () => {
    isDisposed = true
    cancelAnimationFrame(rafId)
    ro?.disconnect()
    canvas.removeEventListener('webglcontextlost', onContextLost)
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibility)
    }
    disposeGl()
  }
}

/** @deprecated Kept for type compatibility with older call sites — use GLASS_DEFAULTS. */
export type { GlassDefaults }
