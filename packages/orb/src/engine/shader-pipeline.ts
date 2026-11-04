export interface ShaderUniforms {
  energy: number
  time: number
}

export function defaultOrbUniforms(energy: number, time: number): ShaderUniforms {
  return { energy, time }
}

export function compileShaderSource(kind: 'vertex' | 'fragment'): string {
  if (kind === 'vertex') {
    return 'attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }'
  }
  return 'precision mediump float; uniform float energy; void main() { gl_FragColor = vec4(energy, energy, 1.0, 1.0); }'
}
