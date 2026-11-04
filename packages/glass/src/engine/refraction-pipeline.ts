import {
  type SurfaceFunctionName,
  SURFACE_FUNCTIONS,
} from './presets'

/**
 * Calculates the refractive profile curve based on glass thickness, bezel width,
 * profile height function, and index of refraction (IOR).
 */
export function calculateRefractionProfile(
  glassThickness: number,
  bezelWidth: number,
  heightFn: (x: number) => number,
  ior: number,
  samples = 128
): Float64Array {
  const eta = 1 / Math.max(1.0, ior)

  function refract(nx: number, ny: number): [number, number] | null {
    const dot = ny
    const k = 1 - eta * eta * (1 - dot * dot)
    if (k < 0) return null
    const sq = Math.sqrt(k)
    return [-(eta * dot + sq) * nx, eta - (eta * dot + sq) * ny]
  }

  const profile = new Float64Array(samples)
  for (let i = 0; i < samples; i++) {
    const x = i / samples
    const y = heightFn(x)
    const dx = x < 1 ? 0.0001 : -0.0001
    const y2 = heightFn(x + dx)
    const deriv = (y2 - y) / dx
    const mag = Math.sqrt(deriv * deriv + 1)
    const ref = refract(-deriv / mag, -1 / mag)
    if (!ref) {
      profile[i] = 0
      continue
    }
    profile[i] = ref[0] * ((y * bezelWidth + glassThickness) / ref[1])
  }
  return profile
}

/**
 * Converts a hex (#ffffff, #000) or rgb/rgba color string to an 'r, g, b' triplet string.
 * Accurately parses black (#000000 -> 0, 0, 0) and any hex color.
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

export interface SvgFilterOptions {
  filterId: string
  width?: number
  height?: number
  radius?: number
  thickness: number
  bezelWidth: number
  refractiveIndex: number
  scaleRatio: number
  blur: number
  specularOpacity: number
  specularSaturation: number
  surfaceFunction?: SurfaceFunctionName
}

/**
 * Builds a pure vector-based SVG liquid glass refraction filter.
 * Uses procedural turbulence displacement, saturation boost, and Snell specular lighting.
 * 100% resolution-independent, zero canvas rasterization dependencies, adapts seamlessly to any container size or shape.
 */
export function buildSvgFilterXml(options: SvgFilterOptions): {
  filterXml: string
  scale: number
} {
  const {
    filterId,
    thickness,
    bezelWidth,
    refractiveIndex,
    scaleRatio,
    blur,
    specularOpacity,
    specularSaturation,
  } = options

  const dispScale = Math.max(0.5, (refractiveIndex - 1.0) * (thickness / 6) * scaleRatio)
  const turbFreq = Math.max(0.003, 0.02 / Math.max(1, bezelWidth / 20))
  const satVal = Math.max(1.0, 1.0 + specularSaturation * 0.25)
  const blurVal = Math.max(0.1, blur)
  const surfaceScale = Math.max(1.0, (thickness / 15) * Math.max(0.2, specularOpacity))

  const filterXml = `
    <filter id="${filterId}" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="${turbFreq.toFixed(4)}" numOctaves="2" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="${dispScale.toFixed(2)}" xChannelSelector="R" yChannelSelector="G" result="displaced" />
      <feGaussianBlur in="displaced" stdDeviation="${blurVal.toFixed(2)}" result="blurred" />
      <feColorMatrix in="blurred" type="saturate" values="${satVal.toFixed(2)}" result="saturated" />
      <feGaussianBlur in="SourceAlpha" stdDeviation="${Math.max(1, bezelWidth * 0.08).toFixed(1)}" result="alpha_blur" />
      <feSpecularLighting in="alpha_blur" surfaceScale="${surfaceScale.toFixed(2)}" specularConstant="${(specularOpacity * 2.2).toFixed(2)}" specularExponent="18" lightingColor="#ffffff" result="spec">
        <feDistantLight azimuth="225" elevation="45" />
      </feSpecularLighting>
      <feComposite in="spec" in2="SourceAlpha" operator="in" result="spec_masked" />
      <feBlend in="spec_masked" in2="saturated" mode="screen" result="final" />
    </filter>
  `.trim()

  return { filterXml, scale: dispScale }
}

// ---------------------------------------------------------------------------
// Pure WebGL Shader Pipeline (CSS-Compliant Rounded Geometry)
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

float sdRoundedRect(vec2 p, vec2 halfSize, float r) {
  vec2 q = abs(p) - halfSize + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

float surfaceHeight(float t) {
  float s = 1.0 - t;
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
  return texture2D(uBgTex, uv).rgb;
}

vec3 sampleBgBlurred(vec2 uv, float radius) {
  if (radius < 0.5 || uHasBg == 0) return sampleBg(uv);
  vec3 sum = vec3(0.0);
  vec2 px = 1.0 / uResolution;
  vec2 offsets[16];
  offsets[0]  = vec2(-0.94201, -0.39906);
  offsets[1]  = vec2( 0.94558, -0.76890);
  offsets[2]  = vec2(-0.09418, -0.92938);
  offsets[3]  = vec2( 0.34495,  0.29387);
  offsets[4]  = vec2(-0.91588, -0.45771);
  offsets[5]  = vec2(-0.81544,  0.48568);
  offsets[6]  = vec2(-0.38277, -0.56071);
  offsets[7]  = vec2(-0.12675,  0.84686);
  offsets[8]  = vec2( 0.89642,  0.41254);
  offsets[9]  = vec2( 0.18150, -0.30020);
  offsets[10] = vec2(-0.01445, -0.16001);
  offsets[11] = vec2( 0.59614,  0.71118);
  offsets[12] = vec2( 0.49742, -0.47280);
  offsets[13] = vec2( 0.80685,  0.04588);
  offsets[14] = vec2(-0.32490, -0.03965);
  offsets[15] = vec2(-0.60975,  0.06566);
  for (int i = 0; i < 16; i++) {
    sum += sampleBg(uv + offsets[i] * radius * px);
  }
  return sum / 16.0;
}

void main() {
  vec2 screenPx = vec2(vUv.x, 1.0 - vUv.y) * uResolution;
  vec2 halfSize = uResolution * 0.5;
  vec2 p = screenPx - halfSize;

  // CSS Border Radius Clamping (Rule: radius cannot exceed min(width, height) / 2)
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

  float h = surfaceHeight(t);
  float dt = 0.001;
  float h2 = surfaceHeight(min(t + dt, 1.0));
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

export interface WebGLGlassOptions {
  canvas: HTMLCanvasElement
  getParams: () => {
    radius: number
    bezel: number
    thickness: number
    ior: number
    blur: number
    specular: number
    tint: number
    tintColor?: string
    backgroundUrl?: string
  }
  onReady?: () => void
  onError?: (err: Error) => void
}

/**
 * Creates a high-performance WebGL ray refraction pipeline tailored to the local surface geometry.
 */
export function createGlassWebGLRenderer(options: WebGLGlassOptions): () => void {
  const { canvas, getParams, onReady, onError } = options

  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false })
  if (!gl) {
    onError?.(new Error('WebGL is not supported by this browser.'))
    return () => { }
  }

  function compileShader(type: number, src: string): WebGLShader | null {
    if (!gl) return null
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

  const vs = compileShader(gl.VERTEX_SHADER, GL_VERTEX_SHADER)
  const fs = compileShader(gl.FRAGMENT_SHADER, GL_FRAGMENT_SHADER)
  if (!vs || !fs) return () => { }

  const program = gl.createProgram()
  if (!program) return () => { }
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program)
    onError?.(new Error(`WebGL program linking failed: ${info}`))
    return () => { }
  }

  gl.useProgram(program)

  // Setup full-screen quad buffer
  const positionLocation = gl.getAttribLocation(program, 'aPosition')
  const posBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  )
  gl.enableVertexAttribArray(positionLocation)
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

  // Uniform locations
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

  // Background texture management
  const bgTexture = gl.createTexture()
  let currentBgUrl = ''
  let bgAspect = 1.5
  let hasBg = 0

  function loadBackground(url: string) {
    if (!gl || !url || url === currentBgUrl) return
    currentBgUrl = url
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (!gl) return
      bgAspect = img.width / img.height
      hasBg = 1
      gl.bindTexture(gl.TEXTURE_2D, bgTexture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    }
    img.src = url
  }

  let animId = 0
  let isDisposed = false

  onReady?.()

  function render() {
    if (isDisposed || !gl) return

    const dpr = window.devicePixelRatio || 1
    const displayWidth = Math.max(2, Math.round(canvas.clientWidth * dpr))
    const displayHeight = Math.max(2, Math.round(canvas.clientHeight * dpr))

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth
      canvas.height = displayHeight
      gl.viewport(0, 0, displayWidth, displayHeight)
    }

    const params = getParams()
    if (params.backgroundUrl && params.backgroundUrl !== currentBgUrl) {
      loadBackground(params.backgroundUrl)
    }

    gl.useProgram(program)

    gl.uniform2f(uResolution, canvas.width, canvas.height)
    gl.uniform1f(uRadius, params.radius * dpr)
    gl.uniform1f(uBezel, params.bezel * dpr)
    gl.uniform1f(uThickness, params.thickness)
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

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, bgTexture)
    gl.uniform1i(uBgTex, 0)

    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.drawArrays(gl.TRIANGLES, 0, 6)

    animId = requestAnimationFrame(render)
  }

  animId = requestAnimationFrame(render)

  return () => {
    isDisposed = true
    cancelAnimationFrame(animId)
    if (gl) {
      gl.deleteBuffer(posBuffer)
      gl.deleteTexture(bgTexture)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
    }
  }
}
