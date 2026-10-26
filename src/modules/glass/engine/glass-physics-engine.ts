import { BaseEngine } from '../../../core/engine'
import {
  type SurfaceFunctionName,
  type GlassMode,
} from './presets'

export interface GlassPhysicsState {
  /** Border radius in pixels. */
  borderRadius: number
  /** Physical glass thickness (10 - 200). */
  thickness: number
  /** Edge bezel width in pixels (2 - 60). */
  bezelWidth: number
  /** Index of Refraction / IOR (1.0 - 3.0). */
  refractiveIndex: number
  /** Displacement scale ratio (0.0 - 2.0). */
  scaleRatio: number
  /** Gaussian blur radius (0.0 - 12.0). */
  blur: number
  /** Specular highlight opacity (0.0 - 1.0). */
  specularOpacity: number
  /** Specular saturation multiplier (0 - 12). */
  specularSaturation: number
  /** Inner shadow color hex string. */
  shadowColor: string
  /** Inner shadow blur in pixels (0 - 40). */
  shadowBlur: number
  /** Inner shadow spread in pixels (-15 - 10). */
  shadowSpread: number
  /** Glass tint color hex string. */
  tintColor: string
  /** Glass tint opacity (0.0 - 0.4). */
  tintOpacity: number
  /** Outer drop shadow blur in pixels (0 - 50). */
  outerShadowBlur: number
  /** Outer drop shadow opacity (0.0 - 1.0). */
  outerShadowOpacity: number
  /** Mathematical surface height function profile. */
  surfaceFunction: SurfaceFunctionName
  /** Active rendering engine: 'svg' | 'webgl'. */
  mode: GlassMode
  /** Background image URL for refraction sampling in WebGL. */
  backgroundUrl: string
}

export interface GlassPhysicsEngineOptions extends Partial<GlassPhysicsState> {}

export class GlassPhysicsEngine extends BaseEngine<GlassPhysicsState> {
  constructor(options: GlassPhysicsEngineOptions = {}) {
    super({
      borderRadius: 48,
      thickness: 80,
      bezelWidth: 60,
      refractiveIndex: 3.0,
      scaleRatio: 1.0,
      blur: 0.3,
      specularOpacity: 0.5,
      specularSaturation: 4,
      shadowColor: '#ffffff',
      shadowBlur: 20,
      shadowSpread: -5,
      tintColor: '#ffffff',
      tintOpacity: 0.06,
      outerShadowBlur: 24,
      outerShadowOpacity: 0.18,
      surfaceFunction: 'convex_squircle',
      mode: 'svg',
      backgroundUrl:
        'https://images.unsplash.com/photo-1789660817213-260c3815de6f?q=80&w=2274&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      ...options,
    })
  }

  public setMode(mode: GlassMode) {
    this.setState({ mode })
    this.emit('glass:mode', { mode })
  }

  public setBackgroundUrl(backgroundUrl: string) {
    this.setState({ backgroundUrl })
    this.emit('glass:background', { backgroundUrl })
  }

  public updateParams(params: Partial<GlassPhysicsState>) {
    this.setState(params)
    this.emit('glass:update', params)
  }

  public reset() {
    this.setState({
      borderRadius: 48,
      thickness: 80,
      bezelWidth: 60,
      refractiveIndex: 3.0,
      scaleRatio: 1.0,
      blur: 0.3,
      specularOpacity: 0.5,
      specularSaturation: 4,
      shadowColor: '#ffffff',
      shadowBlur: 20,
      shadowSpread: -5,
      tintColor: '#ffffff',
      tintOpacity: 0.06,
      outerShadowBlur: 24,
      outerShadowOpacity: 0.18,
      surfaceFunction: 'convex_squircle',
      mode: 'svg',
    })
    this.emit('glass:reset')
  }
}
