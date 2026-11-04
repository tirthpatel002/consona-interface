import { BaseEngine } from '@consona/interface-core'
import { GLASS_DEFAULTS } from './defaults'
import type { SurfaceFunctionName, GlassMode } from './presets'

export interface GlassPhysicsState {
  borderRadius: number
  thickness: number
  bezelWidth: number
  refractiveIndex: number
  scaleRatio: number
  blur: number
  specularOpacity: number
  specularSaturation: number
  shadowColor: string
  shadowBlur: number
  shadowSpread: number
  tintColor: string
  tintOpacity: number
  outerShadowBlur: number
  outerShadowOpacity: number
  surfaceFunction: SurfaceFunctionName
  mode: GlassMode
  backgroundUrl: string
}

export interface GlassPhysicsEngineOptions extends Partial<GlassPhysicsState> {}

export class GlassPhysicsEngine extends BaseEngine<GlassPhysicsState> {
  constructor(options: GlassPhysicsEngineOptions = {}) {
    super({
      ...GLASS_DEFAULTS,
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
    this.setState({ ...GLASS_DEFAULTS })
    this.emit('glass:reset')
  }
}
