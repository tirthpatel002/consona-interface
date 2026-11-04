import { compileShaderSource, defaultOrbUniforms } from '../engine/shader-pipeline'

export function useShaderMaterial(energy = 0.5, time = 0) {
  return {
    uniforms: defaultOrbUniforms(energy, time),
    vertex: compileShaderSource('vertex'),
    fragment: compileShaderSource('fragment'),
  }
}
